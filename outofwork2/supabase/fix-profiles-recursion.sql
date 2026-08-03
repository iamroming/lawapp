-- Fix: infinite recursion in profiles RLS policy
-- The "Admins can view all profiles" policy queries the profiles table
-- from within a policy on the same table, causing infinite recursion.
--
-- Fix: Replace the self-referential subquery with a SECURITY DEFINER
-- function that bypasses RLS.

-- 1. Create helper function (security definer bypasses RLS)
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = uid and role = 'admin'
  );
$$;

-- 2. Drop and recreate the self-referential policy
drop policy if exists "Admins can view all profiles" on public.profiles;

create policy "Admins can view all profiles" on public.profiles
  for select using (public.is_admin(auth.uid()));
