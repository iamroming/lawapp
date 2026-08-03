-- =============================================
-- TEAM INVITE CODES
-- One-time-use codes for team member invitations
-- =============================================

create table if not exists public.team_invites (
  id uuid default uuid_generate_v4() primary key,
  code text unique not null,
  role_id text not null,
  created_by uuid references public.profiles(id) on delete cascade,
  firm_id uuid references public.profiles(id) on delete cascade,
  used_by uuid references public.profiles(id) on delete set null,
  used_at timestamptz,
  expires_at timestamptz,
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table public.team_invites enable row level security;

-- Firm owner/partner can manage invites
CREATE OR REPLACE FUNCTION public.can_manage_invites(uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = uid AND role IN ('owner', 'partner', 'super_admin')
  );
$$;

create policy "Firm can manage invites" on public.team_invites
  for all using (public.can_manage_invites(auth.uid()));

-- Anyone can redeem a valid invite (used during signup)
create policy "Anyone can redeem valid invite" on public.team_invites
  for update using (is_active = true and used_by is null);

create index if not exists idx_team_invites_code on public.team_invites(code);
create index if not exists idx_team_invites_firm_id on public.team_invites(firm_id);
