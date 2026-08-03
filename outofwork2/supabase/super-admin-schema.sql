-- =============================================
-- SUPER ADMIN (OWNER) SCHEMA
-- Run this AFTER admin-schema.sql
-- =============================================

-- =============================================
-- SUPER ADMINS TABLE (Owner access)
-- =============================================
create table public.super_admins (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  access_level text not null default 'owner' check (access_level in ('owner', 'super_admin')),
  permissions jsonb default '["all"]'::jsonb,
  last_login timestamptz,
  created_at timestamptz default now()
);

alter table public.super_admins enable row level security;

-- Only the owner can read super_admins
create policy "Owner can manage super_admins" on public.super_admins
  for all using (
    exists (
      select 1 from public.super_admins
      where id = auth.uid() and access_level = 'owner'
    )
  );

-- =============================================
-- SEED THE OWNER
-- =============================================
-- The owner account will be created on first login
-- and stored in this table via the application logic.

-- =============================================
-- PLATFORM SETTINGS
-- =============================================
create table public.platform_settings (
  key text primary key,
  value jsonb not null,
  description text,
  updated_by uuid references public.profiles(id),
  updated_at timestamptz default now()
);

alter table public.platform_settings enable row level security;

create policy "Only super admins can manage settings" on public.platform_settings
  for all using (
    exists (
      select 1 from public.super_admins where id = auth.uid()
    )
  );

-- Seed default settings
insert into public.platform_settings (key, value, description) values
('app_name', '"LawApp"', 'Application name'),
('maintenance_mode', 'false', 'Enable maintenance mode'),
('allow_signups', 'true', 'Allow new user registrations'),
('default_trial_days', '14', 'Default trial period in days'),
('max_upload_size_mb', '50', 'Maximum file upload size in MB'),
('support_email', '"support@lawapp.in"', 'Support contact email');

create trigger update_platform_settings_updated_at
  before update on public.platform_settings
  for each row execute function update_updated_at();
