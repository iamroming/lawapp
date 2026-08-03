-- =============================================
-- SALARY MODULE MIGRATION
-- Run this AFTER complete-schema.sql and lawfirm-roles-migration.sql
-- =============================================

-- =============================================
-- 1. ADD SALARY COLUMNS TO PROFILES
-- =============================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'payment_type') THEN
    ALTER TABLE public.profiles ADD COLUMN payment_type TEXT DEFAULT 'fixed_salary';
    -- Values: 'fixed_salary', 'case_percentage', 'hybrid'
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'monthly_salary') THEN
    ALTER TABLE public.profiles ADD COLUMN monthly_salary NUMERIC DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'percentage_rate') THEN
    ALTER TABLE public.profiles ADD COLUMN percentage_rate NUMERIC DEFAULT 0;
    -- e.g., 30 means 30%
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'payment_day') THEN
    ALTER TABLE public.profiles ADD COLUMN payment_day INTEGER DEFAULT 1;
    -- Day of month for salary payment
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'upi_id') THEN
    ALTER TABLE public.profiles ADD COLUMN upi_id TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'allotment_status') THEN
    ALTER TABLE public.profiles ADD COLUMN allotment_status TEXT DEFAULT 'allotted';
    -- Values: 'allotted', 'pending', 'not_allotted'
  END IF;
END $$;

-- =============================================
-- 1b. ADD COLUMNS TO TEAM_INVITES
-- =============================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'team_invites' AND column_name = 'payment_type') THEN
    ALTER TABLE public.team_invites ADD COLUMN payment_type TEXT DEFAULT 'fixed_salary';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'team_invites' AND column_name = 'upi_id') THEN
    ALTER TABLE public.team_invites ADD COLUMN upi_id TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'team_invites' AND column_name = 'allotment_status') THEN
    ALTER TABLE public.team_invites ADD COLUMN allotment_status TEXT DEFAULT 'allotted';
  END IF;
END $$;

-- =============================================
-- 1c. ADD FEE COLUMNS TO CASES
-- =============================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cases' AND column_name = 'advance_amount') THEN
    ALTER TABLE public.cases ADD COLUMN advance_amount NUMERIC DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cases' AND column_name = 'next_payment_date') THEN
    ALTER TABLE public.cases ADD COLUMN next_payment_date DATE;
  END IF;
END $$;

-- =============================================
-- 1d. ADD COLUMNS TO TEAM_INVITES
-- =============================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'team_invites' AND column_name = 'monthly_salary') THEN
    ALTER TABLE public.team_invites ADD COLUMN monthly_salary NUMERIC DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'team_invites' AND column_name = 'percentage_rate') THEN
    ALTER TABLE public.team_invites ADD COLUMN percentage_rate NUMERIC DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'team_invites' AND column_name = 'pf_enabled') THEN
    ALTER TABLE public.team_invites ADD COLUMN pf_enabled BOOLEAN DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'team_invites' AND column_name = 'esi_enabled') THEN
    ALTER TABLE public.team_invites ADD COLUMN esi_enabled BOOLEAN DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'team_invites' AND column_name = 'tds_rate') THEN
    ALTER TABLE public.team_invites ADD COLUMN tds_rate NUMERIC DEFAULT 0;
  END IF;
END $$;

-- =============================================
-- 2. CREATE ROLE_SALARY_DEFAULTS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.role_salary_defaults (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  
  payment_type TEXT DEFAULT 'fixed_salary',
  monthly_salary NUMERIC DEFAULT 0,
  percentage_rate NUMERIC DEFAULT 0,
  pf_enabled BOOLEAN DEFAULT false,
  esi_enabled BOOLEAN DEFAULT false,
  tds_rate NUMERIC DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(firm_id, role)
);

-- =============================================
-- 2b. CREATE CASE_TEAM TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.case_team (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  brought_by TEXT,
  profit_share_percentage NUMERIC DEFAULT 0,
  is_lead BOOLEAN DEFAULT false,
  notes TEXT,
  added_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_case_team_case ON public.case_team(case_id);
CREATE INDEX IF NOT EXISTS idx_case_team_employee ON public.case_team(employee_id);

ALTER TABLE public.case_team ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "case_team_select" ON public.case_team;
CREATE POLICY "case_team_select" ON public.case_team
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.cases WHERE cases.id = case_team.case_id
      AND (cases.created_by = auth.uid() OR cases.assigned_to = auth.uid())
    )
  );

DROP POLICY IF EXISTS "case_team_insert" ON public.case_team;
CREATE POLICY "case_team_insert" ON public.case_team
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cases WHERE cases.id = case_id
      AND (cases.created_by = auth.uid() OR cases.assigned_to = auth.uid())
    )
  );

DROP POLICY IF EXISTS "case_team_update" ON public.case_team;
CREATE POLICY "case_team_update" ON public.case_team
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.cases WHERE cases.id = case_id
      AND (cases.created_by = auth.uid() OR cases.assigned_to = auth.uid())
    )
  );

DROP POLICY IF EXISTS "case_team_delete" ON public.case_team;
CREATE POLICY "case_team_delete" ON public.case_team
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.cases WHERE cases.id = case_id
      AND (cases.created_by = auth.uid() OR cases.assigned_to = auth.uid())
    )
  );

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'pf_enabled') THEN
    ALTER TABLE public.profiles ADD COLUMN pf_enabled BOOLEAN DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'esi_enabled') THEN
    ALTER TABLE public.profiles ADD COLUMN esi_enabled BOOLEAN DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'tds_rate') THEN
    ALTER TABLE public.profiles ADD COLUMN tds_rate NUMERIC DEFAULT 0;
    -- e.g., 10 means 10% TDS
  END IF;
END $$;

-- =============================================
-- 2. CREATE SALARY_PAYMENTS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.salary_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  firm_id UUID REFERENCES public.profiles(id),
  
  period_start DATE,
  period_end DATE,
  
  payment_type TEXT NOT NULL DEFAULT 'fixed_salary',
  -- 'fixed_salary', 'case_percentage', 'bonus', 'deduction'
  
  base_salary NUMERIC DEFAULT 0,
  percentage_earned NUMERIC DEFAULT 0,
  total_earnings NUMERIC DEFAULT 0,
  
  pf_deduction NUMERIC DEFAULT 0,
  esi_deduction NUMERIC DEFAULT 0,
  tds_deduction NUMERIC DEFAULT 0,
  other_deductions NUMERIC DEFAULT 0,
  total_deductions NUMERIC DEFAULT 0,
  
  net_payable NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'pending',
  -- 'pending', 'processing', 'paid', 'cancelled'
  
  paid_at TIMESTAMPTZ,
  payment_method TEXT DEFAULT 'bank_transfer',
  transaction_ref TEXT,
  
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 3. CREATE CASE_EARNINGS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.case_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  salary_payment_id UUID REFERENCES public.salary_payments(id) ON DELETE SET NULL,
  
  invoice_amount NUMERIC DEFAULT 0,
  collected_amount NUMERIC DEFAULT 0,
  percentage_rate NUMERIC DEFAULT 0,
  earned_amount NUMERIC DEFAULT 0,
  
  settled BOOLEAN DEFAULT false,
  settled_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 4. CREATE SALARY_SETTINGS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.salary_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID REFERENCES public.profiles(id) UNIQUE NOT NULL,
  
  default_pf_rate NUMERIC DEFAULT 12,
  default_esi_rate NUMERIC DEFAULT 0.75,
  default_tds_rate NUMERIC DEFAULT 10,
  
  payment_cycle TEXT DEFAULT 'monthly',
  payment_day INTEGER DEFAULT 1,
  
  auto_calculate BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 5. INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_salary_payments_employee ON public.salary_payments(employee_id);
CREATE INDEX IF NOT EXISTS idx_salary_payments_firm ON public.salary_payments(firm_id);
CREATE INDEX IF NOT EXISTS idx_salary_payments_period ON public.salary_payments(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_salary_payments_status ON public.salary_payments(status);

CREATE INDEX IF NOT EXISTS idx_case_earnings_case ON public.case_earnings(case_id);
CREATE INDEX IF NOT EXISTS idx_case_earnings_employee ON public.case_earnings(employee_id);
CREATE INDEX IF NOT EXISTS idx_case_earnings_settled ON public.case_earnings(settled);

CREATE INDEX IF NOT EXISTS idx_salary_settings_firm ON public.salary_settings(firm_id);

CREATE INDEX IF NOT EXISTS idx_role_salary_defaults_firm ON public.role_salary_defaults(firm_id);
CREATE INDEX IF NOT EXISTS idx_role_salary_defaults_role ON public.role_salary_defaults(firm_id, role);

-- =============================================
-- 6. RLS POLICIES
-- =============================================

ALTER TABLE public.salary_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_salary_defaults ENABLE ROW LEVEL SECURITY;

-- salary_payments: firm members can view, owner/partner can manage
DROP POLICY IF EXISTS "salary_payments_select" ON public.salary_payments;
CREATE POLICY "salary_payments_select" ON public.salary_payments
  FOR SELECT USING (
    firm_id = (SELECT firm_id FROM public.profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "salary_payments_insert" ON public.salary_payments;
CREATE POLICY "salary_payments_insert" ON public.salary_payments
  FOR INSERT WITH CHECK (
    firm_id = (SELECT firm_id FROM public.profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('owner', 'partner', 'admin')
    )
  );

DROP POLICY IF EXISTS "salary_payments_update" ON public.salary_payments;
CREATE POLICY "salary_payments_update" ON public.salary_payments
  FOR UPDATE USING (
    firm_id = (SELECT firm_id FROM public.profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('owner', 'partner', 'admin')
    )
  );

-- case_earnings: firm members can view
DROP POLICY IF EXISTS "case_earnings_select" ON public.case_earnings;
CREATE POLICY "case_earnings_select" ON public.case_earnings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND (
        firm_id = (SELECT firm_id FROM public.profiles WHERE id = employee_id)
        OR id = employee_id
        OR role IN ('owner', 'partner', 'admin')
      )
    )
  );

DROP POLICY IF EXISTS "case_earnings_insert" ON public.case_earnings;
CREATE POLICY "case_earnings_insert" ON public.case_earnings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('owner', 'partner', 'admin')
    )
  );

-- salary_settings: firm owner/partner only
DROP POLICY IF EXISTS "salary_settings_select" ON public.salary_settings;
CREATE POLICY "salary_settings_select" ON public.salary_settings
  FOR SELECT USING (
    firm_id = (SELECT firm_id FROM public.profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "salary_settings_insert" ON public.salary_settings;
CREATE POLICY "salary_settings_insert" ON public.salary_settings
  FOR INSERT WITH CHECK (
    firm_id = (SELECT firm_id FROM public.profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('owner', 'partner')
    )
  );

DROP POLICY IF EXISTS "salary_settings_update" ON public.salary_settings;
CREATE POLICY "salary_settings_update" ON public.salary_settings
  FOR UPDATE USING (
    firm_id = (SELECT firm_id FROM public.profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('owner', 'partner')
    )
  );

-- role_salary_defaults: firm members can view, owner/partner can manage
DROP POLICY IF EXISTS "role_salary_defaults_select" ON public.role_salary_defaults;
CREATE POLICY "role_salary_defaults_select" ON public.role_salary_defaults
  FOR SELECT USING (
    firm_id = (SELECT firm_id FROM public.profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "role_salary_defaults_insert" ON public.role_salary_defaults;
CREATE POLICY "role_salary_defaults_insert" ON public.role_salary_defaults
  FOR INSERT WITH CHECK (
    firm_id = (SELECT firm_id FROM public.profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('owner', 'partner')
    )
  );

DROP POLICY IF EXISTS "role_salary_defaults_update" ON public.role_salary_defaults;
CREATE POLICY "role_salary_defaults_update" ON public.role_salary_defaults
  FOR UPDATE USING (
    firm_id = (SELECT firm_id FROM public.profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('owner', 'partner')
    )
  );

DROP POLICY IF EXISTS "role_salary_defaults_delete" ON public.role_salary_defaults;
CREATE POLICY "role_salary_defaults_delete" ON public.role_salary_defaults
  FOR DELETE USING (
    firm_id = (SELECT firm_id FROM public.profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('owner', 'partner')
    )
  );

-- =============================================
-- 7. UPDATED_AT TRIGGER
-- =============================================

CREATE OR REPLACE FUNCTION public.update_salary_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_salary_payments_updated_at ON public.salary_payments;
CREATE TRIGGER update_salary_payments_updated_at
  BEFORE UPDATE ON public.salary_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_salary_updated_at();

DROP TRIGGER IF EXISTS update_salary_settings_updated_at ON public.salary_settings;
CREATE TRIGGER update_salary_settings_updated_at
  BEFORE UPDATE ON public.salary_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_salary_updated_at();

DROP TRIGGER IF EXISTS update_role_salary_defaults_updated_at ON public.role_salary_defaults;
CREATE TRIGGER update_role_salary_defaults_updated_at
  BEFORE UPDATE ON public.role_salary_defaults
  FOR EACH ROW
  EXECUTE FUNCTION public.update_salary_updated_at();

-- =============================================
-- 8. AUTO-CALCULATE FUNCTION
-- =============================================

CREATE OR REPLACE FUNCTION public.calculate_employee_salary(
  p_employee_id UUID,
  p_month INTEGER,
  p_year INTEGER
)
RETURNS NUMERIC AS $$
DECLARE
  v_payment_type TEXT;
  v_monthly_salary NUMERIC;
  v_percentage_rate NUMERIC;
  v_total_earned NUMERIC := 0;
  v_period_start DATE;
  v_period_end DATE;
BEGIN
  -- Get employee payment settings
  SELECT payment_type, monthly_salary, percentage_rate
  INTO v_payment_type, v_monthly_salary, v_percentage_rate
  FROM public.profiles
  WHERE id = p_employee_id;

  v_period_start := make_date(p_year, p_month, 1);
  v_period_end := (v_period_start + interval '1 month' - interval '1 day')::date;

  IF v_payment_type = 'fixed_salary' THEN
    RETURN COALESCE(v_monthly_salary, 0);

  ELSIF v_payment_type = 'case_percentage' THEN
    -- Sum earnings from case_earnings for the period
    SELECT COALESCE(SUM(ce.earned_amount), 0)
    INTO v_total_earned
    FROM public.case_earnings ce
    WHERE ce.employee_id = p_employee_id
      AND ce.created_at >= v_period_start
      AND ce.created_at < v_period_end + interval '1 day'
      AND ce.settled = false;

    RETURN v_total_earned;

  ELSE
    RETURN 0;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- DONE!
-- =============================================
