-- =============================================
-- LAWAPP COMPLETE DATABASE SCHEMA
-- Fixed RLS, tenant isolation, soft delete, audit trail
-- Run this INSTEAD of the original schema.sql
-- =============================================

-- Enable extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- =============================================
-- PROFILES (extends auth.users)
-- =============================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null default '',
  email text not null default '',
  phone text default '',
  role text not null default 'lawyer' check (role in ('admin', 'lawyer', 'paralegal', 'staff')),
  enrollment_number text,
  specialization text[] default '{}',
  firm_name text default '',
  avatar_url text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =============================================
-- CLIENTS
-- =============================================
create table public.clients (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  full_name text not null,
  email text,
  phone text not null,
  alternate_phone text,
  address text,
  city text,
  state text,
  pincode text,
  id_type text check (id_type in ('aadhaar', 'pan', 'passport', 'voter_id', 'other')),
  id_number text,
  company_name text,
  gst_number text,
  notes text,
  created_by uuid references public.profiles(id),
  deleted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =============================================
-- CASES
-- =============================================
create table public.cases (
  id uuid default uuid_generate_v4() primary key,
  case_number text unique not null,
  title text not null,
  description text,
  case_type text not null default 'Civil',
  court text,
  court_room text,
  judge_name text,
  opposing_party text,
  opposing_counsel text,
  client_id uuid references public.clients(id) on delete set null,
  assigned_to uuid references public.profiles(id),
  created_by uuid references public.profiles(id),
  status text not null default 'pending' check (status in (
    'pending', 'active', 'in-progress', 'under-trial',
    'won', 'lost', 'settled', 'closed', 'adjourned', 'dismissed'
  )),
  priority text default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  filing_date date,
  next_hearing_date timestamptz,
  last_hearing_date timestamptz,
  total_fee numeric(12, 2) default 0,
  amount_received numeric(12, 2) default 0,
  outcome text,
  deleted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =============================================
-- HEARINGS
-- =============================================
create table public.hearings (
  id uuid default uuid_generate_v4() primary key,
  case_id uuid references public.cases(id) on delete cascade,
  hearing_date timestamptz not null,
  court text,
  court_room text,
  judge_name text,
  purpose text,
  notes text,
  outcome text,
  next_hearing_date timestamptz,
  is_completed boolean default false,
  created_by uuid references public.profiles(id),
  deleted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =============================================
-- DOCUMENTS
-- =============================================
create table public.documents (
  id uuid default uuid_generate_v4() primary key,
  case_id uuid references public.cases(id) on delete cascade,
  uploaded_by uuid references public.profiles(id),
  title text not null,
  description text,
  file_url text not null,
  file_path text,
  file_name text not null,
  file_type text,
  file_size bigint,
  category text check (category in (
    'petition', 'affidavit', 'evidence', 'judgment',
    'agreement', 'correspondence', 'other'
  )),
  is_confidential boolean default false,
  deleted_at timestamptz,
  created_at timestamptz default now()
);

-- =============================================
-- TIME ENTRIES
-- =============================================
create table public.time_entries (
  id uuid default uuid_generate_v4() primary key,
  case_id uuid references public.cases(id) on delete cascade,
  lawyer_id uuid references public.profiles(id),
  description text not null,
  hours numeric(5, 2) not null,
  rate_per_hour numeric(10, 2),
  date date not null default current_date,
  is_billable boolean default true,
  created_at timestamptz default now()
);

-- =============================================
-- INVOICES
-- =============================================
create table public.invoices (
  id uuid default uuid_generate_v4() primary key,
  invoice_number text unique not null,
  case_id uuid references public.cases(id) on delete set null,
  client_id uuid references public.clients(id) on delete cascade,
  issued_by uuid references public.profiles(id),
  amount numeric(12, 2) not null,
  tax_amount numeric(12, 2) default 0,
  gst_rate numeric(5, 2) default 18.00,
  cgst numeric(12, 2) default 0,
  sgst numeric(12, 2) default 0,
  igst numeric(12, 2) default 0,
  gstin text,
  hsncode text,
  place_of_supply text,
  reverse_charge boolean default false,
  description text,
  status text not null default 'draft' check (status in ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  due_date date,
  paid_date date,
  payment_method text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =============================================
-- PAYMENTS
-- =============================================
create table public.payments (
  id uuid default uuid_generate_v4() primary key,
  invoice_id uuid references public.invoices(id) on delete set null,
  client_id uuid references public.clients(id) on delete cascade,
  case_id uuid references public.cases(id) on delete set null,
  amount numeric(12, 2) not null,
  payment_method text check (payment_method in ('cash', 'bank_transfer', 'upi', 'cheque', 'card', 'other')),
  payment_date date not null default current_date,
  reference_number text,
  notes text,
  received_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

-- =============================================
-- NOTES
-- =============================================
create table public.notes (
  id uuid default uuid_generate_v4() primary key,
  case_id uuid references public.cases(id) on delete cascade,
  author_id uuid references public.profiles(id),
  content text not null,
  is_pinned boolean default false,
  mentions uuid[] default '{}',
  deleted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =============================================
-- TAGS (flexible categorization)
-- =============================================
create table public.tags (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  color text default '#3b82f6',
  created_by uuid references public.profiles(id),
  unique(name)
);

create table public.case_tags (
  case_id uuid references public.cases(id) on delete cascade,
  tag_id uuid references public.tags(id) on delete cascade,
  primary key (case_id, tag_id)
);

-- =============================================
-- REMINDERS (notification scheduling)
-- =============================================
create table public.reminders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  case_id uuid references public.cases(id) on delete cascade,
  title text not null,
  description text,
  reminder_date timestamptz not null,
  type text default 'custom' check (type in ('hearing', 'deadline', 'payment', 'follow_up', 'custom')),
  is_sent boolean default false,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- =============================================
-- AUDIT TRAIL
-- =============================================
create table public.audit_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  entity_name text,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz default now()
);

-- =============================================
-- SUBSCRIPTION PLANS
-- =============================================
create table public.subscription_plans (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text unique not null,
  description text,
  price numeric(10, 2) not null,
  billing_period text not null default 'monthly' check (billing_period in ('monthly', 'yearly', 'one_time')),
  features jsonb default '[]'::jsonb,
  max_cases integer default -1,
  max_users integer default 1,
  max_storage_mb integer default 100,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =============================================
-- USER SUBSCRIPTIONS
-- =============================================
create table public.user_subscriptions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  plan_id uuid references public.subscription_plans(id),
  status text not null default 'active' check (status in ('active', 'trialing', 'past_due', 'cancelled', 'expired')),
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  cancelled_at timestamptz,
  payment_method text,
  amount_paid numeric(10, 2) default 0,
  currency text default 'INR',
  auto_renew boolean default true,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =============================================
-- ACTIVITY LOGS
-- =============================================
create table public.activity_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  entity_name text,
  details jsonb default '{}'::jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz default now()
);

-- =============================================
-- SUPER ADMINS
-- =============================================
create table public.super_admins (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  access_level text not null default 'owner' check (access_level in ('owner', 'super_admin')),
  permissions jsonb default '["all"]'::jsonb,
  last_login timestamptz,
  created_at timestamptz default now()
);

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

-- =============================================
-- NOTIFICATIONS
-- =============================================
create table public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  title_hi text,
  message text not null,
  message_hi text,
  channels text[] default '{in_app}',
  read boolean default false,
  data jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- =============================================
-- NOTIFICATION PREFERENCES
-- =============================================
create table public.notification_preferences (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade unique,
  email boolean default true,
  sms boolean default false,
  whatsapp boolean default false,
  push boolean default true,
  hearing_reminders boolean default true,
  payment_alerts boolean default true,
  case_updates boolean default true,
  document_alerts boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =============================================
-- CLIENT PORTAL MESSAGES
-- =============================================
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  case_id uuid references public.cases(id) on delete set null,
  sender_id uuid references public.profiles(id) on delete set null,
  receiver_id uuid references public.profiles(id) on delete set null,
  client_id uuid references public.clients(id) on delete cascade,
  content text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- =============================================
-- CLIENT PORTAL USERS
-- =============================================
create table public.client_portal_users (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references public.clients(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  email text not null,
  role text default 'client' check (role in ('client')),
  is_active boolean default true,
  last_login timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =============================================
-- INDEXES
-- =============================================
create index idx_clients_created_by on public.clients(created_by);
create index idx_clients_deleted_at on public.clients(deleted_at) where deleted_at is null;
create index idx_cases_client_id on public.cases(client_id);
create index idx_cases_assigned_to on public.cases(assigned_to);
create index idx_cases_created_by on public.cases(created_by);
create index idx_cases_status on public.cases(status);
create index idx_cases_next_hearing on public.cases(next_hearing_date);
create index idx_cases_deleted_at on public.cases(deleted_at) where deleted_at is null;
create index idx_hearings_case_id on public.hearings(case_id);
create index idx_hearings_date on public.hearings(hearing_date);
create index idx_documents_case_id on public.documents(case_id);
create index idx_time_entries_case_id on public.time_entries(case_id);
create index idx_time_entries_lawyer_id on public.time_entries(lawyer_id);
create index idx_invoices_client_id on public.invoices(client_id);
create index idx_payments_client_id on public.payments(client_id);
create index idx_audit_logs_user_id on public.audit_logs(user_id);
create index idx_audit_logs_entity on public.audit_logs(entity_type, entity_id);
create index idx_audit_logs_created_at on public.audit_logs(created_at);
create index idx_reminders_user_id on public.reminders(user_id);
create index idx_reminders_date on public.reminders(reminder_date);
create index idx_activity_logs_user_id on public.activity_logs(user_id);
create index idx_activity_logs_created_at on public.activity_logs(created_at);
create index idx_notifications_user_id on public.notifications(user_id);
create index idx_notifications_read on public.notifications(read);
create index idx_notifications_created_at on public.notifications(created_at);
create index idx_notification_preferences_user_id on public.notification_preferences(user_id);
create index idx_messages_case_id on public.messages(case_id);
create index idx_messages_sender_id on public.messages(sender_id);
create index idx_messages_receiver_id on public.messages(receiver_id);
create index idx_messages_client_id on public.messages(client_id);
create index idx_messages_created_at on public.messages(created_at);
create index idx_client_portal_users_client_id on public.client_portal_users(client_id);
create index idx_client_portal_users_user_id on public.client_portal_users(user_id);
create index idx_client_portal_users_email on public.client_portal_users(email);

-- =============================================
-- ROW LEVEL SECURITY (Fixed with tenant isolation)
-- =============================================
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.cases enable row level security;
alter table public.hearings enable row level security;
alter table public.documents enable row level security;
alter table public.time_entries enable row level security;
alter table public.invoices enable row level security;
alter table public.payments enable row level security;
alter table public.notes enable row level security;
alter table public.tags enable row level security;
alter table public.case_tags enable row level security;
alter table public.reminders enable row level security;
alter table public.audit_logs enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.user_subscriptions enable row level security;
alter table public.activity_logs enable row level security;
alter table public.super_admins enable row level security;
alter table public.platform_settings enable row level security;

-- Helper: SECURITY DEFINER function to check admin status (avoids self-referential RLS recursion)
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

-- PROFILES: Users can read/update own, admins can read all
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Admins can view all profiles" on public.profiles;

create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Authenticated users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

create policy "Admins can view all profiles" on public.profiles
  for select using (public.is_admin(auth.uid()));

-- CLIENTS: Users can CRUD their own clients
drop policy if exists "Authenticated users can view clients" on public.clients;
drop policy if exists "Authenticated users can insert clients" on public.clients;
drop policy if exists "Authenticated users can update clients" on public.clients;

create policy "Users can view own clients" on public.clients
  for select using (auth.uid() = created_by or auth.uid() = user_id);

create policy "Users can insert own clients" on public.clients
  for insert with check (auth.uid() = created_by);

create policy "Users can update own clients" on public.clients
  for update using (auth.uid() = created_by or auth.uid() = user_id);

create policy "Users can delete own clients" on public.clients
  for delete using (auth.uid() = created_by);

-- CASES: Users can CRUD their own cases
drop policy if exists "Authenticated users can view cases" on public.cases;
drop policy if exists "Authenticated users can insert cases" on public.cases;
drop policy if exists "Authenticated users can update cases" on public.cases;

create policy "Users can view own cases" on public.cases
  for select using (auth.uid() = created_by or auth.uid() = assigned_to);

create policy "Users can insert own cases" on public.cases
  for insert with check (auth.uid() = created_by);

create policy "Users can update own cases" on public.cases
  for update using (auth.uid() = created_by or auth.uid() = assigned_to);

create policy "Users can delete own cases" on public.cases
  for delete using (auth.uid() = created_by);

-- HEARINGS: Users can manage hearings on their own cases
drop policy if exists "Authenticated users can view hearings" on public.hearings;

create policy "Users can manage own case hearings" on public.hearings
  for all using (
    exists (
      select 1 from public.cases
      where cases.id = hearings.case_id
      and (cases.created_by = auth.uid() or cases.assigned_to = auth.uid())
    )
  );

-- DOCUMENTS: Users can manage documents on their own cases
drop policy if exists "Authenticated users can manage documents" on public.documents;

create policy "Users can manage own case documents" on public.documents
  for all using (
    auth.uid() = uploaded_by or
    exists (
      select 1 from public.cases
      where cases.id = documents.case_id
      and (cases.created_by = auth.uid() or cases.assigned_to = auth.uid())
    )
  );

-- TIME ENTRIES: Users can manage their own entries
drop policy if exists "Authenticated users can manage time_entries" on public.time_entries;

create policy "Users can manage own time entries" on public.time_entries
  for all using (auth.uid() = lawyer_id);

-- INVOICES: Users can manage invoices they created or for their cases
drop policy if exists "Authenticated users can manage invoices" on public.invoices;

create policy "Users can manage own invoices" on public.invoices
  for all using (
    auth.uid() = issued_by or
    exists (
      select 1 from public.cases
      where cases.id = invoices.case_id
      and cases.created_by = auth.uid()
    )
  );

-- PAYMENTS: Users can manage payments they received
drop policy if exists "Authenticated users can manage payments" on public.payments;

create policy "Users can manage own payments" on public.payments
  for all using (auth.uid() = received_by);

-- NOTES: Users can manage notes on their own cases
drop policy if exists "Authenticated users can manage notes" on public.notes;

create policy "Users can manage own case notes" on public.notes
  for all using (
    auth.uid() = author_id or
    exists (
      select 1 from public.cases
      where cases.id = notes.case_id
      and (cases.created_by = auth.uid() or cases.assigned_to = auth.uid())
    )
  );

-- TAGS: Authenticated users can read, creators can manage
create policy "Authenticated users can view tags" on public.tags
  for select using (auth.role() = 'authenticated');

create policy "Users can create tags" on public.tags
  for insert with check (auth.uid() = created_by);

-- CASE_TAGS: Users can manage tags on their own cases
create policy "Users can manage own case tags" on public.case_tags
  for all using (
    exists (
      select 1 from public.cases
      where cases.id = case_tags.case_id
      and cases.created_by = auth.uid()
    )
  );

-- REMINDERS: Users can manage their own reminders
create policy "Users can manage own reminders" on public.reminders
  for all using (auth.uid() = user_id);

-- AUDIT LOGS: Users can view logs they created, admins can view all
create policy "Users can view own audit logs" on public.audit_logs
  for select using (auth.uid() = user_id);

create policy "Admins can view all audit logs" on public.audit_logs
  for select using (public.is_admin(auth.uid()));

create policy "Authenticated users can insert audit logs" on public.audit_logs
  for insert with check (auth.role() = 'authenticated');

-- SUBSCRIPTION PLANS: Anyone authenticated can read
create policy "Authenticated users can view plans" on public.subscription_plans
  for select using (auth.role() = 'authenticated');

-- USER SUBSCRIPTIONS: Users can view own, admins can manage all
create policy "Users can view own subscriptions" on public.user_subscriptions
  for select using (auth.uid() = user_id);

create policy "Admins can manage all subscriptions" on public.user_subscriptions
  for all using (public.is_admin(auth.uid()));

-- ACTIVITY LOGS: Admins can read, authenticated can insert
create policy "Admins can view all activity logs" on public.activity_logs
  for select using (public.is_admin(auth.uid()));

create policy "Authenticated users can insert activity logs" on public.activity_logs
  for insert with check (auth.role() = 'authenticated');

-- SUPER ADMINS: Owner only
create policy "Owner can manage super_admins" on public.super_admins
  for all using (
    exists (select 1 from public.super_admins where id = auth.uid() and access_level = 'owner')
  );

-- PLATFORM SETTINGS: Super admins only
create policy "Super admins can manage settings" on public.platform_settings
  for all using (
    exists (select 1 from public.super_admins where id = auth.uid())
  );

-- =============================================
-- FUNCTIONS
-- =============================================

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply triggers
do $$
declare
  tbl text;
begin
  for tbl in select unnest(array[
    'profiles', 'clients', 'cases', 'hearings',
    'invoices', 'notes', 'subscription_plans',
    'user_subscriptions', 'platform_settings', 'reminders'
  ]) loop
    execute format(
      'create trigger update_%s_updated_at before update on public.%s
       for each row execute function update_updated_at()',
      tbl, tbl
    );
  end loop;
end $$;

-- Handle new user signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'role', 'associate')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Audit trail function
create or replace function log_audit(
  p_user_id uuid,
  p_action text,
  p_entity_type text,
  p_entity_id uuid default null,
  p_entity_name text default null,
  p_old_values jsonb default null,
  p_new_values jsonb default null
)
returns void as $$
begin
  insert into public.audit_logs (user_id, action, entity_type, entity_id, entity_name, old_values, new_values)
  values (p_user_id, p_action, p_entity_type, p_entity_id, p_entity_name, p_old_values, p_new_values);
end;
$$ language plpgsql security definer;

-- Activity log function
create or replace function log_activity(
  p_user_id uuid,
  p_action text,
  p_entity_type text default null,
  p_entity_id uuid default null,
  p_entity_name text default null,
  p_details jsonb default '{}'::jsonb
)
returns void as $$
begin
  insert into public.activity_logs (user_id, action, entity_type, entity_id, entity_name, details)
  values (p_user_id, p_action, p_entity_type, p_entity_id, p_entity_name, p_details);
end;
$$ language plpgsql security definer;

-- Generate unique case number
create or replace function generate_case_number()
returns text as $$
declare
  year_part text;
  seq_num text;
begin
  year_part := to_char(now(), 'YYYY');
  seq_num := lpad(nextval('case_number_seq')::text, 5, '0');
  return 'CASE/' || year_part || '/' || seq_num;
end;
$$ language plpgsql;

-- Create sequence if not exists
do $$
begin
  if not exists (select 1 from pg_sequences where sequencename = 'case_number_seq') then
    create sequence case_number_seq start with 1000;
  end if;
end $$;

-- Generate unique invoice number
create or replace function generate_invoice_number()
returns text as $$
declare
  year_part text;
  seq_num text;
begin
  year_part := to_char(now(), 'YYYY');
  seq_num := lpad(nextval('invoice_number_seq')::text, 5, '0');
  return 'INV/' || year_part || '/' || seq_num;
end;
$$ language plpgsql;

do $$
begin
  if not exists (select 1 from pg_sequences where sequencename = 'invoice_number_seq') then
    create sequence invoice_number_seq start with 1000;
  end if;
end $$;

-- =============================================
-- SEED DATA
-- =============================================

-- Subscription plans
insert into public.subscription_plans (name, slug, description, price, billing_period, features, max_cases, max_users, max_storage_mb) values
('Free', 'free', 'Basic plan for individual lawyers', 0, 'monthly',
  '["3 active cases", "Basic dashboard", "Email support"]'::jsonb,
  3, 1, 100),
('Starter', 'starter', 'For solo practitioners', 499, 'monthly',
  '["20 active cases", "Notifications", "Document storage", "Email support"]'::jsonb,
  20, 1, 512),
('Professional', 'professional', 'For practicing advocates', 999, 'monthly',
  '["Unlimited cases", "Full dashboard", "Document storage", "Calendar sync", "WhatsApp notifications", "Priority support"]'::jsonb,
  -1, 1, 2048),
('Firm', 'firm', 'For small law firms', 2999, 'monthly',
  '["Everything in Professional", "Up to 5 users", "Client portal", "Team collaboration", "Billing management", "Phone support"]'::jsonb,
  -1, 5, 10240),
('Enterprise', 'enterprise', 'For large firms and organizations', 9999, 'monthly',
  '["Unlimited everything", "Custom integrations", "Dedicated support", "SLA guarantee", "White label option", "API access"]'::jsonb,
  -1, -1, -1);

-- Platform settings
insert into public.platform_settings (key, value, description) values
('app_name', '"LawApp"', 'Application name'),
('maintenance_mode', 'false', 'Enable maintenance mode'),
('allow_signups', 'true', 'Allow new user registrations'),
('default_trial_days', '14', 'Default trial period in days'),
('max_upload_size_mb', '50', 'Maximum file upload size in MB'),
('support_email', '"support@lawapp.in"', 'Support contact email');

-- Default tags
insert into public.tags (name, color, created_by) values
('Urgent', '#ef4444', null),
('Pro Bono', '#10b981', null),
('Corporate', '#3b82f6', null),
('Criminal', '#8b5cf6', null),
('Family', '#f59e0b', null),
('Property', '#06b6d4', null);
