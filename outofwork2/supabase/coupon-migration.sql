-- =============================================
-- COUPON SYSTEM + SUBSCRIPTION MANAGEMENT
-- Run this migration on your Supabase database
-- =============================================

-- 1. Coupon codes table
CREATE TABLE IF NOT EXISTS public.coupon_codes (
  id uuid default uuid_generate_v4() primary key,
  code text unique not null,
  plan_id uuid references public.subscription_plans(id),
  discount_type text not null check (discount_type in ('percent', 'fixed', 'free')),
  discount_value numeric(10,2) default 0,
  max_uses integer default -1,
  current_uses integer default 0,
  valid_from timestamptz default now(),
  valid_until timestamptz,
  is_active boolean default true,
  created_by uuid references public.profiles(id),
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Coupon usage tracking
CREATE TABLE IF NOT EXISTS public.coupon_uses (
  id uuid default uuid_generate_v4() primary key,
  coupon_id uuid references public.coupon_codes(id) on delete cascade,
  user_id uuid references public.profiles(id),
  used_at timestamptz default now(),
  plan_subscribed uuid references public.subscription_plans(id),
  amount_before numeric(10,2),
  amount_after numeric(10,2),
  ip_address text
);

-- 3. Subscription override fields
DO $$ BEGIN
  ALTER TABLE public.user_subscriptions ADD COLUMN IF NOT EXISTS discount_percent numeric(5,2) default 0;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.user_subscriptions ADD COLUMN IF NOT EXISTS custom_price numeric(10,2);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.user_subscriptions ADD COLUMN IF NOT EXISTS overridden_by uuid references public.profiles(id);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.user_subscriptions ADD COLUMN IF NOT EXISTS overridden_at timestamptz;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.user_subscriptions ADD COLUMN IF NOT EXISTS override_reason text;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.user_subscriptions ADD COLUMN IF NOT EXISTS is_enabled boolean default true;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.user_subscriptions ADD COLUMN IF NOT EXISTS disabled_at timestamptz;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.user_subscriptions ADD COLUMN IF NOT EXISTS disabled_reason text;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_coupon_codes_code ON public.coupon_codes(code);
CREATE INDEX IF NOT EXISTS idx_coupon_codes_active ON public.coupon_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_coupon_uses_coupon_id ON public.coupon_uses(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_uses_user_id ON public.coupon_uses(user_id);

-- 5. RLS policies
ALTER TABLE public.coupon_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_uses ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Authenticated users can view active coupons" ON public.coupon_codes;
  DROP POLICY IF EXISTS "Super admins can manage coupons" ON public.coupon_codes;
  DROP POLICY IF EXISTS "Users can view own coupon uses" ON public.coupon_uses;
  DROP POLICY IF EXISTS "Super admins can view all coupon uses" ON public.coupon_uses;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY "Authenticated users can view active coupons"
  ON public.coupon_codes FOR SELECT
  TO authenticated
  USING (is_active = true OR created_by = auth.uid());

CREATE POLICY "Super admins can manage coupons"
  ON public.coupon_codes FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.super_admins WHERE id = auth.uid())
  );

CREATE POLICY "Users can view own coupon uses"
  ON public.coupon_uses FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Super admins can view all coupon uses"
  ON public.coupon_uses FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.super_admins WHERE id = auth.uid())
  );

-- 6. Updated_at trigger for coupon_codes
CREATE OR REPLACE FUNCTION update_coupon_codes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DO $$ BEGIN
  DROP TRIGGER IF EXISTS update_coupon_codes_updated_at ON public.coupon_codes;
  CREATE TRIGGER update_coupon_codes_updated_at
    BEFORE UPDATE ON public.coupon_codes
    FOR EACH ROW
    EXECUTE PROCEDURE update_coupon_codes_updated_at();
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- 7. Seed some sample coupons
INSERT INTO public.coupon_codes (code, plan_id, discount_type, discount_value, max_uses, valid_until, description, is_active)
SELECT
  'WELCOME20',
  (SELECT id FROM public.subscription_plans WHERE slug = 'professional' LIMIT 1),
  'percent',
  20,
  100,
  now() + interval '6 months',
  '20% off Professional plan for first 100 users',
  true
WHERE EXISTS (SELECT 1 FROM public.subscription_plans WHERE slug = 'professional');

INSERT INTO public.coupon_codes (code, plan_id, discount_type, discount_value, max_uses, valid_until, description, is_active)
SELECT
  'FLAT500',
  NULL,
  'fixed',
  500,
  50,
  now() + interval '3 months',
  '₹500 off any plan',
  true
WHERE EXISTS (SELECT 1 FROM public.subscription_plans LIMIT 1);

INSERT INTO public.coupon_codes (code, plan_id, discount_type, discount_value, max_uses, valid_until, description, is_active)
SELECT
  'FRIEND2026',
  (SELECT id FROM public.subscription_plans WHERE slug = 'enterprise' LIMIT 1),
  'free',
  0,
  -1,
  now() + interval '10 years',
  'Free lifetime Enterprise access for friends',
  true
WHERE EXISTS (SELECT 1 FROM public.subscription_plans WHERE slug = 'enterprise');
