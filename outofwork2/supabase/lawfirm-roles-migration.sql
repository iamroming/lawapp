-- =============================================
-- LAW FIRM ROLES & PERMISSIONS MIGRATION
-- Run this AFTER the complete-schema.sql
-- =============================================

-- =============================================
-- 1. NEW TABLES
-- =============================================

-- Firm roles: defines available roles per firm
create table if not exists public.firm_roles (
  id uuid default uuid_generate_v4() primary key,
  firm_id uuid references public.profiles(id) on delete cascade,
  role_id text not null,
  display_name text not null,
  level integer not null,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(firm_id, role_id)
);

-- Firm members: links users to firms with assigned roles
create table if not exists public.firm_members (
  id uuid default uuid_generate_v4() primary key,
  firm_id uuid references public.profiles(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  role_id text not null default 'associate',
  invited_by uuid references public.profiles(id),
  joined_at timestamptz default now(),
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(firm_id, user_id)
);

-- Permissions: master list of all permissions
create table if not exists public.permissions (
  id uuid default uuid_generate_v4() primary key,
  code text unique not null,
  description text not null,
  category text not null,
  created_at timestamptz default now()
);

-- Role permissions: maps roles to their permissions
create table if not exists public.role_permissions (
  id uuid default uuid_generate_v4() primary key,
  role_id text not null,
  permission_code text not null references public.permissions(code) on delete cascade,
  created_at timestamptz default now(),
  unique(role_id, permission_code)
);

-- =============================================
-- 2. SEED DEFAULT PERMISSIONS
-- =============================================

insert into public.permissions (code, description, category) values
-- Firm Management
('firm.manage', 'Manage firm settings', 'Firm'),
('firm.view_settings', 'View firm settings', 'Firm'),

-- Team Management
('team.invite', 'Invite team members', 'Team'),
('team.remove', 'Remove team members', 'Team'),
('team.view', 'View team members', 'Team'),
('team.change_roles', 'Change team member roles', 'Team'),

-- Cases
('cases.view_all', 'View all cases', 'Cases'),
('cases.view_assigned', 'View assigned cases', 'Cases'),
('cases.create', 'Create cases', 'Cases'),
('cases.edit', 'Edit cases', 'Cases'),
('cases.delete', 'Delete cases', 'Cases'),
('cases.assign', 'Assign cases to team members', 'Cases'),

-- Clients
('clients.view_all', 'View all clients', 'Clients'),
('clients.view_assigned', 'View assigned clients', 'Clients'),
('clients.create', 'Create clients', 'Clients'),
('clients.edit', 'Edit clients', 'Clients'),
('clients.delete', 'Delete clients', 'Clients'),

-- Documents
('documents.view_all', 'View all documents', 'Documents'),
('documents.view_assigned', 'View assigned documents', 'Documents'),
('documents.create', 'Create documents', 'Documents'),
('documents.edit', 'Edit documents', 'Documents'),
('documents.delete', 'Delete documents', 'Documents'),

-- Billing & Invoices
('invoices.view_all', 'View all invoices', 'Billing'),
('invoices.view_own', 'View own invoices', 'Billing'),
('invoices.create', 'Create invoices', 'Billing'),
('invoices.edit', 'Edit invoices', 'Billing'),
('invoices.delete', 'Delete invoices', 'Billing'),

-- Reports
('reports.view_all', 'View all reports', 'Reports'),
('reports.view_own', 'View own reports', 'Reports'),
('audit_logs.view', 'View audit logs', 'Reports'),

-- Calendar & Hearings
('hearings.view_all', 'View all hearings', 'Calendar'),
('hearings.view_assigned', 'View assigned hearings', 'Calendar'),
('hearings.manage', 'Manage hearings', 'Calendar')
on conflict (code) do nothing;

-- =============================================
-- 3. SEED ROLE PERMISSIONS
-- =============================================

-- Owner (full access)
insert into public.role_permissions (role_id, permission_code)
select 'owner', code from public.permissions
on conflict do nothing;

-- Partner
insert into public.role_permissions (role_id, permission_code)
select 'partner', code from public.permissions
where code in (
  'firm.view_settings',
  'team.invite', 'team.remove', 'team.view',
  'cases.view_all', 'cases.view_assigned', 'cases.create', 'cases.edit', 'cases.delete', 'cases.assign',
  'clients.view_all', 'clients.view_assigned', 'clients.create', 'clients.edit', 'clients.delete',
  'documents.view_all', 'documents.view_assigned', 'documents.create', 'documents.edit', 'documents.delete',
  'invoices.view_all', 'invoices.view_own', 'invoices.create', 'invoices.edit',
  'reports.view_all', 'reports.view_own', 'audit_logs.view',
  'hearings.view_all', 'hearings.view_assigned', 'hearings.manage'
)
on conflict do nothing;

-- Senior Associate
insert into public.role_permissions (role_id, permission_code)
select 'senior_associate', code from public.permissions
where code in (
  'firm.view_settings',
  'team.view',
  'cases.view_all', 'cases.view_assigned', 'cases.create', 'cases.edit', 'cases.assign',
  'clients.view_all', 'clients.view_assigned', 'clients.create', 'clients.edit',
  'documents.view_all', 'documents.view_assigned', 'documents.create', 'documents.edit', 'documents.delete',
  'invoices.view_all', 'invoices.view_own', 'invoices.create',
  'reports.view_all', 'reports.view_own',
  'hearings.view_all', 'hearings.view_assigned', 'hearings.manage'
)
on conflict do nothing;

-- Associate
insert into public.role_permissions (role_id, permission_code)
select 'associate', code from public.permissions
where code in (
  'team.view',
  'cases.view_assigned', 'cases.create', 'cases.edit',
  'clients.view_assigned', 'clients.create', 'clients.edit',
  'documents.view_assigned', 'documents.create', 'documents.edit',
  'invoices.view_own',
  'reports.view_own',
  'hearings.view_assigned', 'hearings.manage'
)
on conflict do nothing;

-- Junior Associate
insert into public.role_permissions (role_id, permission_code)
select 'junior_associate', code from public.permissions
where code in (
  'team.view',
  'cases.view_assigned',
  'clients.view_assigned',
  'documents.view_assigned', 'documents.create', 'documents.edit',
  'hearings.view_assigned'
)
on conflict do nothing;

-- Paralegal
insert into public.role_permissions (role_id, permission_code)
select 'paralegal', code from public.permissions
where code in (
  'team.view',
  'cases.view_assigned',
  'clients.view_assigned',
  'documents.view_assigned', 'documents.create', 'documents.edit',
  'hearings.view_assigned'
)
on conflict do nothing;

-- Intern
insert into public.role_permissions (role_id, permission_code)
select 'intern', code from public.permissions
where code in (
  'team.view',
  'cases.view_assigned',
  'clients.view_assigned',
  'documents.view_assigned',
  'hearings.view_assigned'
)
on conflict do nothing;

-- Office Admin
insert into public.role_permissions (role_id, permission_code)
select 'office_admin', code from public.permissions
where code in (
  'firm.view_settings',
  'team.view',
  'invoices.view_all', 'invoices.view_own', 'invoices.create', 'invoices.edit',
  'reports.view_all', 'reports.view_own'
)
on conflict do nothing;

-- =============================================
-- 4. UPDATE PROFILES TABLE
-- =============================================

-- Add firm_id column
alter table public.profiles add column if not exists firm_id uuid references public.profiles(id);

-- =============================================
-- 5. HELPER FUNCTIONS
-- =============================================

-- Check if user has a specific permission
create or replace function public.has_permission(uid uuid, perm_code text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.firm_members fm
    join public.role_permissions rp on rp.role_id = fm.role_id
    where fm.user_id = uid
      and fm.is_active = true
      and rp.permission_code = perm_code
  ) or exists (
    select 1 from public.profiles p
    where p.id = uid and p.role = 'super_admin'
  );
$$;

-- Check if user is firm owner
create or replace function public.is_firm_owner(uid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = uid and role = 'owner'
  );
$$;

-- Get user's role level (lower = more senior)
create or replace function public.get_role_level(uid uuid)
returns integer
language sql
security definer
stable
set search_path = public
as $$
  select case p.role
    when 'owner' then 0
    when 'super_admin' then 0
    when 'partner' then 1
    when 'senior_associate' then 2
    when 'associate' then 3
    when 'junior_associate' then 4
    when 'paralegal' then 5
    when 'intern' then 6
    when 'office_admin' then 7
    else 99
  end from public.profiles p where p.id = uid;
$$;

-- =============================================
-- 6. MIGRATE EXISTING USERS (BEFORE constraint change)
-- =============================================

-- Map old roles to new roles
-- admin -> owner (firm owner)
-- lawyer -> associate
-- paralegal -> paralegal
-- staff -> office_admin

update public.profiles set role = 'owner' where role = 'admin';
update public.profiles set role = 'associate' where role = 'lawyer';
update public.profiles set role = 'office_admin' where role = 'staff';
-- paralegal stays as paralegal

-- =============================================
-- 7. UPDATE ROLE CONSTRAINT (AFTER migration)
-- =============================================

-- Drop old role constraint and add new one
do $$
begin
  if exists (select 1 from information_schema.table_constraints where constraint_name = 'profiles_role_check') then
    alter table public.profiles drop constraint profiles_role_check;
  end if;
end $$;

alter table public.profiles add constraint profiles_role_check
  check (role in (
    'owner', 'partner', 'senior_associate', 'associate',
    'junior_associate', 'paralegal', 'intern', 'office_admin', 'super_admin'
  ));

-- =============================================
-- 8. CREATE FIRM MEMBERS (AFTER constraint change)
-- =============================================

-- Create firm_members entries for existing users
-- Each user becomes a member of their own "firm" (themselves as owner)
insert into public.firm_members (firm_id, user_id, role_id, is_active)
select id, id, role, true
from public.profiles
where firm_id is null
on conflict do nothing;

-- Update firm_id for all profiles (each user is their own firm owner initially)
update public.profiles set firm_id = id where firm_id is null;

-- =============================================
-- 7. ROW LEVEL SECURITY
-- =============================================

alter table public.firm_roles enable row level security;
alter table public.firm_members enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;

-- Firm roles: firm owner can manage
create policy "Firm owner can manage roles" on public.firm_roles
  for all using (
    public.is_firm_owner(auth.uid()) or public.has_permission(auth.uid(), 'firm.manage')
  );

-- Firm roles: members can view
create policy "Members can view firm roles" on public.firm_roles
  for select using (
    public.has_permission(auth.uid(), 'team.view')
  );

-- Firm members: members can view
create policy "Members can view firm members" on public.firm_members
  for select using (
    public.has_permission(auth.uid(), 'team.view')
  );

-- Firm members: owner/admin can manage
create policy "Firm owner can manage members" on public.firm_members
  for all using (
    public.is_firm_owner(auth.uid()) or public.has_permission(auth.uid(), 'team.invite')
  );

-- Permissions: everyone can view
create policy "Authenticated users can view permissions" on public.permissions
  for select using (auth.role() = 'authenticated');

-- Role permissions: everyone can view
create policy "Authenticated users can view role permissions" on public.role_permissions
  for select using (auth.role() = 'authenticated');

-- =============================================
-- 8. INDEXES
-- =============================================

create index if not exists idx_firm_members_firm_id on public.firm_members(firm_id);
create index if not exists idx_firm_members_user_id on public.firm_members(user_id);
create index if not exists idx_firm_members_role_id on public.firm_members(role_id);
create index if not exists idx_role_permissions_role_id on public.role_permissions(role_id);
create index if not exists idx_role_permissions_permission_code on public.role_permissions(permission_code);
create index if not exists idx_profiles_firm_id on public.profiles(firm_id);

-- =============================================
-- 9. UPDATED AT TRIGGERS
-- =============================================

create trigger update_firm_roles_updated_at
  before update on public.firm_roles
  for each row execute function update_updated_at();

create trigger update_firm_members_updated_at
  before update on public.firm_members
  for each row execute function update_updated_at();
