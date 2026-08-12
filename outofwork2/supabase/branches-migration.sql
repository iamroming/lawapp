-- Branches Module Migration
-- Creates branches table, employee_branches junction, and adds branch_id to key tables

-- 1. Create branches table
CREATE TABLE IF NOT EXISTS public.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  phone TEXT,
  email TEXT,
  operating_hours JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create employee_branches junction table (multi-branch support)
CREATE TABLE IF NOT EXISTS public.employee_branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(employee_id, branch_id)
);

-- 3. Add branch_id to existing tables
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id);
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id);
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id);
ALTER TABLE public.hearings ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id);
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id);

-- 4. Add max_branches to subscription_plans
ALTER TABLE public.subscription_plans ADD COLUMN IF NOT EXISTS max_branches INTEGER DEFAULT 0;

-- 5. Update existing plans with branch limits
UPDATE public.subscription_plans SET max_branches = 0 WHERE slug = 'solo';
UPDATE public.subscription_plans SET max_branches = 3 WHERE slug = 'professional';
UPDATE public.subscription_plans SET max_branches = 10 WHERE slug = 'firm';
UPDATE public.subscription_plans SET max_branches = -1 WHERE slug = 'enterprise';

-- 6. Add branch_id to team_invites
ALTER TABLE public.team_invites ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id);

-- 6. Create indexes
CREATE INDEX IF NOT EXISTS idx_branches_firm_id ON public.branches(firm_id);
CREATE INDEX IF NOT EXISTS idx_employee_branches_employee ON public.employee_branches(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_branches_branch ON public.employee_branches(branch_id);
CREATE INDEX IF NOT EXISTS idx_cases_branch ON public.cases(branch_id);
CREATE INDEX IF NOT EXISTS idx_clients_branch ON public.clients(branch_id);
CREATE INDEX IF NOT EXISTS idx_invoices_branch ON public.invoices(branch_id);

-- 7. Enable RLS (optional, but recommended)
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_branches ENABLE ROW LEVEL SECURITY;

-- 8. Create policies (firm-scoped access)
CREATE POLICY "Users can view own firm branches" ON public.branches
  FOR SELECT USING (
    firm_id = (SELECT firm_id FROM profiles WHERE id = auth.uid())
    OR firm_id = auth.uid()
  );

CREATE POLICY "Firm owners can manage branches" ON public.branches
  FOR ALL USING (
    firm_id = auth.uid()
    OR firm_id = (SELECT firm_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can view own firm employee branches" ON public.employee_branches
  FOR SELECT USING (
    employee_id IN (
      SELECT id FROM profiles WHERE firm_id = (SELECT firm_id FROM profiles WHERE id = auth.uid())
      UNION SELECT id FROM profiles WHERE firm_id = auth.uid()
    )
  );

CREATE POLICY "Firm owners can manage employee branches" ON public.employee_branches
  FOR ALL USING (
    employee_id IN (
      SELECT id FROM profiles WHERE firm_id = (SELECT firm_id FROM profiles WHERE id = auth.uid())
      UNION SELECT id FROM profiles WHERE firm_id = auth.uid()
    )
  );

-- 9. Add updated_at trigger for branches
CREATE OR REPLACE FUNCTION update_branches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER branches_updated_at
  BEFORE UPDATE ON public.branches
  FOR EACH ROW
  EXECUTE FUNCTION update_branches_updated_at();
