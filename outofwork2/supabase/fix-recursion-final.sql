-- FIX: infinite recursion in profiles RLS policy
-- The "profiles_firm_isolation" policy queries profiles FROM profiles = recursion.
-- Fix: use a SECURITY DEFINER function that bypasses RLS.

-- 1. Create helper function (security definer bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_my_firm_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT firm_id FROM public.profiles WHERE id = auth.uid();
$$;

-- 2. Drop the recursive policy
DROP POLICY IF EXISTS "profiles_firm_isolation" ON public.profiles;

-- 3. Recreate with the helper function (no recursion)
CREATE POLICY "profiles_firm_isolation" ON public.profiles
  FOR SELECT USING (
    id = auth.uid()
    OR firm_id = public.get_my_firm_id()
  );

-- 4. Also fix the team_invites policy that has the same issue
DROP POLICY IF EXISTS "team_invites_redeem_firm" ON public.team_invites;
CREATE POLICY "team_invites_redeem_firm" ON public.team_invites
  FOR UPDATE USING (
    is_active = true
    AND used_by IS NULL
    AND firm_id = public.get_my_firm_id()
  );
