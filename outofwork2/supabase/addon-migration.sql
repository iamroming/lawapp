-- ============================================================
-- ADD-ON SYSTEM: Extra users for Rs 299/mo (+10 cases each)
-- ============================================================

-- 1. Add addon columns to subscription_plans
ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS addon_price NUMERIC(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS addon_cases_bonus INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_addons INTEGER DEFAULT 0;

-- 2. Update plan limits: Professional=50 cases, Firm=200 cases
UPDATE public.subscription_plans SET
  max_cases = 50,
  addon_price = 299,
  addon_cases_bonus = 10,
  max_addons = -1
WHERE slug = 'professional';

UPDATE public.subscription_plans SET
  max_cases = 200,
  addon_price = 299,
  addon_cases_bonus = 10,
  max_addons = -1
WHERE slug = 'firm';

UPDATE public.subscription_plans SET
  addon_price = 299,
  addon_cases_bonus = 10,
  max_addons = -1
WHERE slug = 'solo';

UPDATE public.subscription_plans SET
  max_addons = 0
WHERE slug = 'free';

UPDATE public.subscription_plans SET
  max_addons = 0
WHERE slug = 'enterprise';

-- 3. Create firm_addons table
CREATE TABLE IF NOT EXISTS public.firm_addons (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  firm_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  addon_type    TEXT NOT NULL DEFAULT 'extra_user'
                CHECK (addon_type IN ('extra_user')),
  quantity      INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  razorpay_plan_id TEXT,
  razorpay_subscription_id TEXT,
  status        TEXT NOT NULL DEFAULT 'active'
                CHECK (status IN ('active', 'cancelled', 'past_due')),
  amount_per_unit NUMERIC(10, 2) NOT NULL DEFAULT 299,
  starts_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_firm_addons_firm_id ON public.firm_addons(firm_id);
CREATE INDEX IF NOT EXISTS idx_firm_addons_status ON public.firm_addons(status);

-- 4. RLS policies for firm_addons
ALTER TABLE public.firm_addons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Firm owners can manage addons" ON public.firm_addons;
CREATE POLICY "Firm owners can manage addons" ON public.firm_addons
  FOR ALL USING (
    auth.uid() = firm_id
  );

-- 5. Updated at trigger
CREATE OR REPLACE FUNCTION update_firm_addons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_firm_addons_updated_at ON public.firm_addons;
CREATE TRIGGER update_firm_addons_updated_at
  BEFORE UPDATE ON public.firm_addons
  FOR EACH ROW EXECUTE FUNCTION update_firm_addons_updated_at();
