-- =============================================
-- SECURITY AUDIT DB MIGRATIONS
-- Run in Supabase SQL Editor
-- Safe to re-run (idempotent)
-- =============================================

-- =============================================
-- 1. NEXT INVOICE NUMBER RPC
-- Atomic counter per firm + financial year
-- Prevents race condition in invoice creation
-- =============================================
CREATE OR REPLACE FUNCTION public.next_invoice_number(
  p_firm_id uuid,
  p_fy text
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next integer;
BEGIN
  -- Upsert the counter, returning the new value atomically
  INSERT INTO public.invoice_counters (firm_id, financial_year, next_number)
  VALUES (p_firm_id, p_fy, 2)
  ON CONFLICT (firm_id, financial_year)
  DO UPDATE SET next_number = public.invoice_counters.next_number + 1
  RETURNING next_number INTO v_next;

  RETURN v_next;
END;
$$;

-- Invoice counters table (if not exists)
CREATE TABLE IF NOT EXISTS public.invoice_counters (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  firm_id uuid NOT NULL,
  financial_year text NOT NULL,
  next_number integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (firm_id, financial_year)
);

-- Recreate function in case table was just created
CREATE OR REPLACE FUNCTION public.next_invoice_number(
  p_firm_id uuid,
  p_fy text
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next integer;
BEGIN
  INSERT INTO public.invoice_counters (firm_id, financial_year, next_number)
  VALUES (p_firm_id, p_fy, 2)
  ON CONFLICT (firm_id, financial_year)
  DO UPDATE SET next_number = public.invoice_counters.next_number + 1
  RETURNING next_number INTO v_next;

  RETURN v_next;
END;
$$;

-- Updated_at trigger for invoice_counters
CREATE OR REPLACE FUNCTION update_invoice_counters_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_invoice_counters_updated_at ON public.invoice_counters;
CREATE TRIGGER update_invoice_counters_updated_at
  BEFORE UPDATE ON public.invoice_counters
  FOR EACH ROW
  EXECUTE PROCEDURE update_invoice_counters_updated_at();

-- RLS: only super admins and firm owners can see counters
ALTER TABLE public.invoice_counters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "invoice_counters_firm_access" ON public.invoice_counters;
CREATE POLICY "invoice_counters_firm_access" ON public.invoice_counters
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.super_admins WHERE id = auth.uid())
    OR firm_id = public.get_my_firm_id()
  );

-- Index
CREATE INDEX IF NOT EXISTS idx_invoice_counters_firm_fy
  ON public.invoice_counters(firm_id, financial_year);


-- =============================================
-- 2. COUPON USES UNIQUE CONSTRAINT
-- Prevents double-redeem race condition
-- =============================================
DO $$ BEGIN
  ALTER TABLE public.coupon_uses
    ADD CONSTRAINT unique_coupon_user UNIQUE (coupon_id, user_id);
EXCEPTION
  WHEN duplicate_table THEN NULL;
  WHEN unique_violation THEN NULL;
END $$;


-- =============================================
-- 3. COLLECTION_LOGS: Add firm_id column
-- Code already inserts firm_id, but column was missing
-- =============================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'collection_logs' AND column_name = 'firm_id'
  ) THEN
    ALTER TABLE public.collection_logs ADD COLUMN firm_id uuid;
  END IF;
END $$;

-- Populate firm_id from invoices
UPDATE public.collection_logs cl
SET firm_id = i.firm_id
FROM public.invoices i
WHERE cl.invoice_id = i.id AND cl.firm_id IS NULL AND i.firm_id IS NOT NULL;

-- Index for firm-scoped queries
CREATE INDEX IF NOT EXISTS idx_collection_logs_firm_id
  ON public.collection_logs(firm_id);

-- RLS: update existing policy to support firm scoping
DROP POLICY IF EXISTS "Users manage collections" ON public.collection_logs;
CREATE POLICY "collection_logs_firm_isolation" ON public.collection_logs
  FOR ALL USING (
    user_id = auth.uid()
    OR firm_id = public.get_my_firm_id()
  );


-- =============================================
-- 4. TIME_ENTRIES: Add firm_id column
-- Code already inserts firm_id, but column was missing
-- =============================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'time_entries' AND column_name = 'firm_id'
  ) THEN
    ALTER TABLE public.time_entries ADD COLUMN firm_id uuid;
  END IF;
END $$;

-- Populate firm_id from profiles (via lawyer_id)
UPDATE public.time_entries te
SET firm_id = p.firm_id
FROM public.profiles p
WHERE te.lawyer_id = p.id AND te.firm_id IS NULL AND p.firm_id IS NOT NULL;

-- Index for firm-scoped queries
CREATE INDEX IF NOT EXISTS idx_time_entries_firm_id
  ON public.time_entries(firm_id);

-- RLS: update existing policy to support firm scoping
DROP POLICY IF EXISTS "Users can manage own time entries" ON public.time_entries;
DROP POLICY IF EXISTS "time_entries_firm_isolation" ON public.time_entries;
CREATE POLICY "time_entries_firm_isolation" ON public.time_entries
  FOR ALL USING (
    lawyer_id = auth.uid()
    OR public.is_firm_privileged(auth.uid())
  );


-- =============================================
-- DONE
-- =============================================
