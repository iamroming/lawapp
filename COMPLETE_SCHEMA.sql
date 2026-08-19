-- =============================================
-- LAWAPP COMPLETE DATABASE SCHEMA
-- Compiled from ALL migration files
-- Run this on a fresh Supabase project
-- =============================================

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- =============================================
-- TABLES (in dependency order)
-- =============================================

-- 1. PROFILES
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null default '',
  email text not null default '',
  phone text default '',
  role text not null default 'associate' check (role in (
    'owner','partner','senior_associate','associate',
    'junior_associate','paralegal','intern','office_admin','super_admin'
  )),
  enrollment_number text,
  specialization text[] default '{}',
  firm_name text default '',
  avatar_url text,
  is_active boolean default true,
  firm_id uuid references public.profiles(id),
  invoice_template text default 'classic',
  bank_name text, bank_account text, bank_ifsc text, upi_id text,
  invoice_settings jsonb default '{"show_firm_name":true,"show_firm_address":true,"show_firm_phone":true,"show_firm_email":true,"show_firm_gstin":true,"show_bank_details":true,"show_upi":true,"show_client_company":true,"show_client_gstin":true,"show_case_details":true,"show_due_date":true,"show_hsn_code":true,"show_gst_breakdown":true,"show_reverse_charge":true,"show_place_of_supply":true,"show_terms":true,"show_payment_instructions":true,"show_footer_notes":true,"footer_notes":"","terms_and_conditions":"Payment due within 30 days."}'::jsonb,
  payment_type text default 'fixed_salary',
  monthly_salary numeric default 0,
  percentage_rate numeric default 0,
  payment_day integer default 1,
  allotment_status text default 'allotted',
  pf_enabled boolean default false,
  esi_enabled boolean default false,
  tds_rate numeric default 0,
  referral_code text unique,
  referred_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. CLIENTS
create table if not exists public.clients (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  full_name text not null,
  email text,
  phone text not null,
  alternate_phone text,
  address text, city text, state text, pincode text,
  id_type text check (id_type in ('aadhaar','pan','passport','voter_id','other')),
  id_number text,
  company_name text, gst_number text, notes text,
  created_by uuid references public.profiles(id),
  firm_id uuid references public.profiles(id),
  branch_id uuid,
  deleted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. CASES
create table if not exists public.cases (
  id uuid default uuid_generate_v4() primary key,
  case_number text unique not null,
  title text not null,
  description text,
  case_type text not null default 'Civil',
  court text, court_room text, judge_name text,
  opposing_party text, opposing_counsel text,
  client_id uuid references public.clients(id) on delete cascade,
  assigned_to uuid references public.profiles(id),
  created_by uuid references public.profiles(id),
  firm_id uuid references public.profiles(id),
  branch_id uuid,
  status text not null default 'pending' check (status in (
    'pending','active','in-progress','under-trial',
    'won','lost','settled','closed','adjourned','dismissed'
  )),
  priority text default 'medium' check (priority in ('low','medium','high','urgent')),
  filing_date date,
  next_hearing_date timestamptz,
  last_hearing_date timestamptz,
  total_fee numeric(12,2) default 0,
  amount_received numeric(12,2) default 0,
  advance_amount numeric default 0,
  next_payment_date date,
  outcome text,
  acts text[], sections text[], clauses text[],
  limitation_date date,
  next_action_date date,
  next_action_text text,
  deleted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. HEARINGS
create table if not exists public.hearings (
  id uuid default uuid_generate_v4() primary key,
  case_id uuid references public.cases(id) on delete cascade,
  hearing_date timestamptz not null,
  court text, court_room text, judge_name text,
  purpose text, notes text, outcome text,
  next_hearing_date timestamptz,
  is_completed boolean default false,
  created_by uuid references public.profiles(id),
  firm_id uuid references public.profiles(id),
  branch_id uuid,
  deleted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 5. DOCUMENTS
create table if not exists public.documents (
  id uuid default uuid_generate_v4() primary key,
  case_id uuid references public.cases(id) on delete cascade,
  uploaded_by uuid references public.profiles(id),
  title text not null,
  description text,
  file_url text not null,
  file_path text, file_name text not null,
  file_type text, file_size bigint,
  category text check (category in ('petition','affidavit','evidence','judgment','agreement','correspondence','other')),
  is_confidential boolean default false,
  firm_id uuid references public.profiles(id),
  branch_id uuid,
  deleted_at timestamptz,
  created_at timestamptz default now()
);

-- 6. TIME ENTRIES
create table if not exists public.time_entries (
  id uuid default uuid_generate_v4() primary key,
  case_id uuid references public.cases(id) on delete cascade,
  lawyer_id uuid references public.profiles(id),
  description text not null,
  hours numeric(5,2) not null,
  rate_per_hour numeric(10,2),
  date date not null default current_date,
  is_billable boolean default true,
  firm_id uuid,
  created_at timestamptz default now()
);

-- 7. INVOICES
create table if not exists public.invoices (
  id uuid default uuid_generate_v4() primary key,
  invoice_number text unique not null,
  case_id uuid references public.cases(id) on delete set null,
  client_id uuid references public.clients(id) on delete cascade,
  issued_by uuid references public.profiles(id),
  amount numeric(12,2) not null,
  tax_amount numeric(12,2) default 0,
  gst_rate numeric(5,2) default 18.00,
  cgst numeric(12,2) default 0, sgst numeric(12,2) default 0, igst numeric(12,2) default 0,
  gstin text, hsncode text, place_of_supply text,
  reverse_charge boolean default false,
  description text,
  status text not null default 'draft' check (status in ('draft','sent','paid','overdue','cancelled')),
  due_date date, paid_date date,
  payment_method text, notes text,
  firm_id uuid references public.profiles(id),
  branch_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 8. PAYMENTS
create table if not exists public.payments (
  id uuid default uuid_generate_v4() primary key,
  invoice_id uuid references public.invoices(id) on delete set null,
  client_id uuid references public.clients(id) on delete cascade,
  case_id uuid references public.cases(id) on delete set null,
  amount numeric(12,2) not null,
  payment_method text check (payment_method in ('cash','bank_transfer','upi','cheque','card','other')),
  payment_date date not null default current_date,
  reference_number text, notes text,
  received_by uuid references public.profiles(id),
  firm_id uuid references public.profiles(id),
  created_at timestamptz default now()
);

-- 9. NOTES
create table if not exists public.notes (
  id uuid default uuid_generate_v4() primary key,
  case_id uuid references public.cases(id) on delete cascade,
  author_id uuid references public.profiles(id),
  content text not null,
  is_pinned boolean default false,
  mentions uuid[] default '{}',
  firm_id uuid,
  deleted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 10. TAGS
create table if not exists public.tags (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  color text default '#3b82f6',
  created_by uuid references public.profiles(id),
  firm_id uuid,
  unique(name)
);

-- 11. CASE_TAGS
create table if not exists public.case_tags (
  case_id uuid references public.cases(id) on delete cascade,
  tag_id uuid references public.tags(id) on delete cascade,
  primary key (case_id, tag_id)
);

-- 12. REMINDERS
create table if not exists public.reminders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  case_id uuid references public.cases(id) on delete cascade,
  title text not null,
  description text,
  reminder_date timestamptz not null,
  type text default 'custom' check (type in ('hearing','deadline','payment','follow_up','custom')),
  is_sent boolean default false,
  is_read boolean default false,
  firm_id uuid,
  created_at timestamptz default now()
);

-- 13. AUDIT_LOGS
create table if not exists public.audit_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  entity_name text,
  old_values jsonb, new_values jsonb,
  ip_address inet, user_agent text,
  created_at timestamptz default now()
);

-- 14. SUBSCRIPTION_PLANS
create table if not exists public.subscription_plans (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text unique not null,
  description text,
  price numeric(10,2) not null,
  billing_period text not null default 'monthly' check (billing_period in ('monthly','yearly','one_time')),
  features jsonb default '[]'::jsonb,
  max_cases integer default -1,
  max_users integer default 1,
  max_storage_mb integer default 100,
  max_branches integer default 0,
  addon_price numeric(10,2) default 0,
  addon_cases_bonus integer default 0,
  max_addons integer default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 15. USER_SUBSCRIPTIONS
create table if not exists public.user_subscriptions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  plan_id uuid references public.subscription_plans(id),
  status text not null default 'active' check (status in ('active','trialing','past_due','cancelled','expired')),
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  cancelled_at timestamptz,
  payment_method text,
  amount_paid numeric(10,2) default 0,
  currency text default 'INR',
  auto_renew boolean default true,
  notes text,
  discount_percent numeric(5,2) default 0,
  custom_price numeric(10,2),
  overridden_by uuid references public.profiles(id),
  overridden_at timestamptz,
  override_reason text,
  is_enabled boolean default true,
  disabled_at timestamptz,
  disabled_reason text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 16. ACTIVITY_LOGS
create table if not exists public.activity_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text, entity_id uuid, entity_name text,
  details jsonb default '{}'::jsonb,
  ip_address inet, user_agent text,
  created_at timestamptz default now()
);

-- 17. SUPER_ADMINS
create table if not exists public.super_admins (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  access_level text not null default 'owner' check (access_level in ('owner','super_admin')),
  permissions jsonb default '["all"]'::jsonb,
  last_login timestamptz,
  created_at timestamptz default now()
);

-- 18. PLATFORM_SETTINGS
create table if not exists public.platform_settings (
  key text primary key,
  value jsonb not null,
  description text,
  updated_by uuid references public.profiles(id),
  updated_at timestamptz default now()
);

-- 19. NOTIFICATIONS
create table if not exists public.notifications (
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
  firm_id uuid,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

-- 20. NOTIFICATION_PREFERENCES
create table if not exists public.notification_preferences (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade unique,
  email boolean default true, sms boolean default false,
  whatsapp boolean default false, push boolean default true,
  hearing_reminders boolean default true,
  payment_alerts boolean default true,
  case_updates boolean default true,
  document_alerts boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 21. MESSAGES
create table if not exists public.messages (
  id uuid default uuid_generate_v4() primary key,
  case_id uuid references public.cases(id) on delete set null,
  sender_id uuid references public.profiles(id) on delete set null,
  receiver_id uuid references public.profiles(id) on delete set null,
  client_id uuid references public.clients(id) on delete cascade,
  content text not null,
  is_read boolean default false,
  firm_id uuid,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

-- 22. CLIENT_PORTAL_USERS
create table if not exists public.client_portal_users (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references public.clients(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  email text not null,
  role text default 'client' check (role in ('client')),
  is_active boolean default true,
  last_login timestamptz,
  firm_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 23. TASKS
create table if not exists public.tasks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  case_id uuid references public.cases(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  firm_id uuid,
  assigned_to uuid references public.profiles(id) on delete set null,
  title text not null,
  description text,
  priority text not null default 'medium' check (priority in ('low','medium','high','urgent')),
  status text not null default 'todo' check (status in ('todo','in_progress','review','done')),
  due_date date,
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 24. TIMESHEETS
create table if not exists public.timesheets (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  case_id uuid references public.cases(id) on delete set null,
  firm_id uuid,
  description text,
  hours numeric(6,2) not null check (hours > 0),
  billable_rate numeric(10,2) default 0,
  is_billable boolean default true,
  is_billed boolean default false,
  invoice_id uuid references public.invoices(id) on delete set null,
  worked_date date not null default current_date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 25. ACTIVE_TIMERS
create table if not exists public.active_timers (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null unique,
  case_id uuid references public.cases(id) on delete set null,
  description text,
  started_at timestamptz not null default now(),
  created_at timestamptz default now()
);

-- 26. TEAM_INVITES
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
  payment_type text default 'fixed_salary',
  upi_id text,
  allotment_status text default 'allotted',
  monthly_salary numeric default 0,
  percentage_rate numeric default 0,
  pf_enabled boolean default false,
  esi_enabled boolean default false,
  tds_rate numeric default 0,
  branch_id uuid,
  created_at timestamptz default now()
);

-- 27. WORKFLOW_EVENTS
create table if not exists public.workflow_events (
  id uuid default uuid_generate_v4() primary key,
  event_type text not null,
  entity_type text not null,
  entity_id uuid not null,
  case_id uuid references public.cases(id) on delete set null,
  firm_id uuid,
  old_data jsonb, new_data jsonb,
  processed boolean default false,
  processed_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

-- 28. ROLE_SALARY_DEFAULTS
create table if not exists public.role_salary_defaults (
  id uuid default gen_random_uuid() primary key,
  firm_id uuid references public.profiles(id) on delete cascade,
  role text not null,
  payment_type text default 'fixed_salary',
  monthly_salary numeric default 0,
  percentage_rate numeric default 0,
  pf_enabled boolean default false,
  esi_enabled boolean default false,
  tds_rate numeric default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(firm_id, role)
);

-- 29. CASE_TEAM
create table if not exists public.case_team (
  id uuid default gen_random_uuid() primary key,
  case_id uuid references public.cases(id) on delete cascade,
  employee_id uuid references public.profiles(id) on delete cascade,
  brought_by text,
  profit_share_percentage numeric default 0,
  is_lead boolean default false,
  notes text,
  added_by uuid references public.profiles(id),
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

-- 30. SALARY_PAYMENTS
create table if not exists public.salary_payments (
  id uuid default gen_random_uuid() primary key,
  employee_id uuid references public.profiles(id) on delete cascade,
  firm_id uuid references public.profiles(id),
  period_start date, period_end date,
  payment_type text not null default 'fixed_salary',
  base_salary numeric default 0,
  percentage_earned numeric default 0,
  total_earnings numeric default 0,
  pf_deduction numeric default 0,
  esi_deduction numeric default 0,
  tds_deduction numeric default 0,
  other_deductions numeric default 0,
  total_deductions numeric default 0,
  net_payable numeric default 0,
  status text default 'pending',
  paid_at timestamptz,
  payment_method text default 'bank_transfer',
  transaction_ref text,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 31. CASE_EARNINGS
create table if not exists public.case_earnings (
  id uuid default gen_random_uuid() primary key,
  case_id uuid references public.cases(id) on delete cascade,
  employee_id uuid references public.profiles(id) on delete cascade,
  invoice_id uuid references public.invoices(id) on delete set null,
  salary_payment_id uuid references public.salary_payments(id) on delete set null,
  invoice_amount numeric default 0,
  collected_amount numeric default 0,
  percentage_rate numeric default 0,
  earned_amount numeric default 0,
  settled boolean default false,
  settled_at timestamptz,
  created_at timestamptz default now()
);

-- 32. SALARY_SETTINGS
create table if not exists public.salary_settings (
  id uuid default gen_random_uuid() primary key,
  firm_id uuid references public.profiles(id) unique not null,
  default_pf_rate numeric default 12,
  default_esi_rate numeric default 0.75,
  default_tds_rate numeric default 10,
  payment_cycle text default 'monthly',
  payment_day integer default 1,
  auto_calculate boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 33. FIRM_PROFIT_SHARING
create table if not exists public.firm_profit_sharing (
  id uuid default uuid_generate_v4() primary key,
  firm_id uuid not null,
  role text not null,
  profit_percentage numeric(5,2) default 0 check (profit_percentage >= 0 and profit_percentage <= 100),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(firm_id, role)
);

-- 34. FIRM_ROLES
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

-- 35. FIRM_MEMBERS
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

-- 36. PERMISSIONS
create table if not exists public.permissions (
  id uuid default uuid_generate_v4() primary key,
  code text unique not null,
  description text not null,
  category text not null,
  created_at timestamptz default now()
);

-- 37. ROLE_PERMISSIONS
create table if not exists public.role_permissions (
  id uuid default uuid_generate_v4() primary key,
  role_id text not null,
  permission_code text not null references public.permissions(code) on delete cascade,
  created_at timestamptz default now(),
  unique(role_id, permission_code)
);

-- 38. QUOTATIONS
create table if not exists public.quotations (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.profiles(id) on delete cascade,
  quotation_number text not null,
  client_id uuid references public.clients(id) on delete set null,
  case_id uuid references public.cases(id) on delete set null,
  title text not null,
  description text,
  items jsonb not null default '[]',
  subtotal numeric(12,2) not null default 0,
  tax_rate numeric(5,2) default 0,
  tax_amount numeric(12,2) default 0,
  discount_amount numeric(12,2) default 0,
  total_amount numeric(12,2) not null default 0,
  status text not null default 'draft' check (status in ('draft','sent','accepted','rejected','expired')),
  valid_until date,
  notes text, terms text,
  created_by uuid references auth.users(id),
  sent_at timestamptz,
  accepted_at timestamptz,
  rejected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- 39. EXPENSES
create table if not exists public.expenses (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  case_id uuid references public.cases(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  firm_id uuid,
  title text not null,
  description text,
  amount numeric(12,2) not null check (amount >= 0),
  category text not null default 'other' check (category in ('court_fees','travel','filing','notary','stamp_duty','postal','photocopy','other')),
  is_billable boolean default true,
  is_billed boolean default false,
  invoice_id uuid references public.invoices(id) on delete set null,
  receipt_url text,
  expense_date date not null default current_date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 40. ECOURTS_CASES
create table if not exists public.ecourts_cases (
  id uuid default uuid_generate_v4() primary key,
  case_id uuid references public.cases(id) on delete cascade,
  cnr_number text not null,
  court_name text not null,
  court_type text not null check (court_type in ('district','high_court','supreme','tribunal')),
  state text, district text,
  last_synced_at timestamptz,
  last_status text, last_hearing_date date, next_hearing_date date,
  case_stage text, judge_name text, listing_bench text,
  is_active boolean default true,
  sync_errors jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 41. CAUSE_LIST_ENTRIES (ecourts version)
create table if not exists public.cause_list_entries (
  id uuid default uuid_generate_v4() primary key,
  case_id uuid references public.cases(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade not null,
  firm_id uuid,
  ecourts_case_id uuid references public.ecourts_cases(id) on delete cascade,
  listing_date date,
  item_number text,
  court_hall text, bench text,
  judge_name text,
  listing_purpose text,
  status text check (status in ('listed','argued','adjourned','disposed','not_reached','withdrawn')),
  raw_data jsonb,
  court_name text,
  cause_list_type text default 'main',
  serial_number text,
  hearing_date date not null default current_date,
  fetched_at timestamptz default now(),
  created_at timestamptz default now()
);

-- 42. ECOURTS_ORDERS
create table if not exists public.ecourts_orders (
  id uuid default uuid_generate_v4() primary key,
  ecourts_case_id uuid references public.ecourts_cases(id) on delete cascade,
  case_id uuid references public.cases(id) on delete set null,
  order_date date not null,
  order_type text check (order_type in ('order','judgment','directions','interim')),
  title text, summary text,
  pdf_url text, raw_data jsonb,
  synced_at timestamptz default now(),
  created_at timestamptz default now()
);

-- 43. ECOURTS_SYNC_LOG
create table if not exists public.ecourts_sync_log (
  id uuid default uuid_generate_v4() primary key,
  ecourts_case_id uuid references public.ecourts_cases(id) on delete cascade,
  sync_type text not null check (sync_type in ('status','cause_list','orders')),
  status text not null check (status in ('success','error','partial')),
  error_message text,
  data_before jsonb, data_after jsonb,
  created_at timestamptz default now()
);

-- 44. WHATSAPP_LOGS
create table if not exists public.whatsapp_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  case_id uuid references public.cases(id) on delete set null,
  phone_number text not null,
  message_type text not null check (message_type in ('hearing_reminder','case_update','payment_reminder','document_share','custom')),
  message_content text not null,
  status text not null default 'pending' check (status in ('pending','sent','delivered','failed')),
  error_message text, twilio_sid text,
  sent_at timestamptz,
  created_at timestamptz default now()
);

-- 45. SCHEDULED_REMINDERS
create table if not exists public.scheduled_reminders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  case_id uuid references public.cases(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  title text not null,
  message text not null,
  reminder_date timestamptz not null,
  channels text[] default '{in_app}' check (channels <@ '{in_app,email,sms,whatsapp}'),
  status text default 'pending' check (status in ('pending','sent','failed','cancelled')),
  sent_channels text[] default '{}',
  failed_channels text[] default '{}',
  retry_count int default 0,
  max_retries int default 3,
  metadata jsonb default '{}'::jsonb,
  firm_id uuid,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 46. TRUST_ACCOUNTS
create table if not exists public.trust_accounts (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references public.clients(id) on delete cascade,
  case_id uuid references public.cases(id) on delete set null,
  balance numeric(12,2) default 0,
  total_deposited numeric(12,2) default 0,
  total_withdrawn numeric(12,2) default 0,
  status text default 'active' check (status in ('active','frozen','closed')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 47. TRUST_TRANSACTIONS
create table if not exists public.trust_transactions (
  id uuid default uuid_generate_v4() primary key,
  trust_account_id uuid references public.trust_accounts(id) on delete cascade,
  type text not null check (type in ('deposit','withdrawal','transfer')),
  amount numeric(12,2) not null,
  description text,
  invoice_id uuid references public.invoices(id) on delete set null,
  reference_number text,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

-- 48. TDS_RECORDS
create table if not exists public.tds_records (
  id uuid default uuid_generate_v4() primary key,
  invoice_id uuid references public.invoices(id) on delete cascade,
  client_id uuid references public.clients(id) on delete cascade,
  tds_rate numeric(5,2) not null default 10.00,
  tds_amount numeric(12,2) not null,
  pan_number text, quarter text, financial_year text,
  form_20_26q_url text,
  status text default 'pending' check (status in ('pending','filed','received')),
  created_at timestamptz default now()
);

-- 49. COUPON_CODES
create table if not exists public.coupon_codes (
  id uuid default uuid_generate_v4() primary key,
  code text unique not null,
  plan_id uuid references public.subscription_plans(id),
  discount_type text not null check (discount_type in ('percent','fixed','free')),
  discount_value numeric(10,2) default 0,
  max_uses integer default -1,
  current_uses integer default 0,
  valid_from timestamptz default now(),
  valid_until timestamptz,
  is_active boolean default true,
  created_by uuid references public.profiles(id),
  description text,
  max_per_user integer default 1,
  billing_cycle text default 'both' check (billing_cycle in ('both','monthly','annual')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 50. COUPON_USES
create table if not exists public.coupon_uses (
  id uuid default uuid_generate_v4() primary key,
  coupon_id uuid references public.coupon_codes(id) on delete cascade,
  user_id uuid references public.profiles(id),
  used_at timestamptz default now(),
  plan_subscribed uuid references public.subscription_plans(id),
  amount_before numeric(10,2),
  amount_after numeric(10,2),
  ip_address text,
  unique(coupon_id, user_id)
);

-- 51. CLIENT_TAGS
create table if not exists public.client_tags (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  color text default '#3B82F6',
  firm_id uuid,
  created_at timestamptz default now(),
  unique(user_id, name)
);

-- 52. CLIENT_TAG_ASSIGNMENTS
create table if not exists public.client_tag_assignments (
  client_id uuid references public.clients(id) on delete cascade not null,
  tag_id uuid references public.client_tags(id) on delete cascade not null,
  primary key (client_id, tag_id)
);

-- 53. CLIENT_FEEDBACK
create table if not exists public.client_feedback (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references public.clients(id) on delete cascade not null,
  case_id uuid references public.cases(id) on delete set null,
  user_id uuid references public.profiles(id) on delete set null,
  rating integer not null check (rating >= 1 and rating <= 5),
  feedback_text text,
  feedback_type text default 'general' check (feedback_type in ('general','case_resolution','consultation','service')),
  is_anonymous boolean default false,
  created_at timestamptz default now()
);

-- 54. CLIENT_COMMUNICATIONS
create table if not exists public.client_communications (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references public.clients(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete set null,
  type text not null check (type in ('call','email','whatsapp','meeting','note','sms')),
  direction text not null check (direction in ('inbound','outbound','internal')),
  subject text, notes text,
  duration_minutes integer,
  attachments text[],
  created_at timestamptz default now()
);

-- 55. CASE_LAW_RESULTS
create table if not exists public.case_law_results (
  id uuid default uuid_generate_v4() primary key,
  case_id uuid references public.cases(id) on delete cascade not null,
  title text not null,
  citation text, court text, judgment_date date,
  judges text[], excerpt text, url text,
  relevance_score numeric(3,2) default 0,
  matched_sections text[],
  source text not null check (source in ('indian_kanoon','internal')),
  fetched_at timestamptz default now(),
  created_at timestamptz default now()
);

-- 56. CASE_ALERTS
create table if not exists public.case_alerts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  case_id uuid references public.cases(id) on delete cascade not null,
  ecourts_case_id uuid references public.ecourts_cases(id) on delete set null,
  is_active boolean default true,
  channels text[] default '{in_app,email,whatsapp}' check (channels <@ '{in_app,email,sms,whatsapp}'),
  last_known_status text,
  last_known_hearing_date date,
  last_known_stage text,
  last_checked_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, case_id)
);

-- 57. CASE_ALERT_HISTORY
create table if not exists public.case_alert_history (
  id uuid default uuid_generate_v4() primary key,
  case_alert_id uuid references public.case_alerts(id) on delete cascade not null,
  change_type text not null check (change_type in ('status','hearing_date','stage','judge','order')),
  old_value text, new_value text,
  change_summary text not null,
  notified boolean default false,
  notified_at timestamptz,
  created_at timestamptz default now()
);

-- 58. CALENDAR_RULES
create table if not exists public.calendar_rules (
  id uuid default gen_random_uuid() primary key,
  firm_id uuid references public.profiles(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  title text not null,
  description text,
  rule_date timestamptz not null,
  court text,
  rule_type text default 'deadline',
  is_important boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 59. CALENDAR_EVENTS
create table if not exists public.calendar_events (
  id uuid default gen_random_uuid() primary key,
  firm_id uuid references public.profiles(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  title text not null,
  description text,
  event_date timestamptz not null,
  location text,
  event_type text default 'meeting',
  is_important boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 60. BRANCHES
create table if not exists public.branches (
  id uuid default gen_random_uuid() primary key,
  firm_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  address text, city text, state text, pincode text,
  phone text, email text,
  operating_hours jsonb default '{}',
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 61. EMPLOYEE_BRANCHES
create table if not exists public.employee_branches (
  id uuid default gen_random_uuid() primary key,
  employee_id uuid not null references public.profiles(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete cascade,
  is_primary boolean default false,
  created_at timestamptz default now(),
  unique(employee_id, branch_id)
);

-- 62. BLOG_POSTS
create table if not exists public.blog_posts (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  slug text unique not null,
  heading text not null,
  cover_image text,
  content text not null,
  excerpt text,
  status text not null default 'draft' check (status in ('draft','published')),
  author_name text default 'CaseFiles Team',
  meta_title text, meta_description text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 63. AI_USAGE
create table if not exists public.ai_usage (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  query_type text not null,
  created_at timestamptz default now()
);

-- 64. FIRM_ADDONS
create table if not exists public.firm_addons (
  id uuid default uuid_generate_v4() primary key,
  firm_id uuid not null references public.profiles(id) on delete cascade,
  addon_type text not null default 'extra_user' check (addon_type in ('extra_user')),
  quantity integer not null default 1 check (quantity > 0),
  razorpay_plan_id text,
  razorpay_subscription_id text,
  status text not null default 'active' check (status in ('active','cancelled','past_due')),
  amount_per_unit numeric(10,2) not null default 299,
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 65. INVOICE_COUNTERS
create table if not exists public.invoice_counters (
  id uuid default uuid_generate_v4() primary key,
  firm_id uuid not null,
  financial_year text not null,
  next_number integer not null default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(firm_id, financial_year)
);

-- 66. INVOICE_TEMPLATES
create table if not exists public.invoice_templates (
  id uuid default uuid_generate_v4() primary key,
  firm_id uuid references public.profiles(id) on delete cascade not null,
  template_id text not null default 'classic',
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 67. INTAKE_FORMS
create table if not exists public.intake_forms (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  fields jsonb not null default '[]',
  is_active boolean default true,
  firm_id uuid,
  created_at timestamptz default now()
);

-- 68. INTAKE_SUBMISSIONS
create table if not exists public.intake_submissions (
  id uuid default uuid_generate_v4() primary key,
  form_id uuid references public.intake_forms(id) on delete cascade not null,
  submitted_by uuid references public.profiles(id) on delete set null,
  client_name text not null,
  client_email text, client_phone text,
  data jsonb not null default '{}',
  status text default 'new' check (status in ('new','reviewed','converted','archived')),
  notes text,
  firm_id uuid,
  created_at timestamptz default now()
);

-- 69. CONSULTATION_SLOTS
create table if not exists public.consultation_slots (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  day_of_week integer not null check (day_of_week >= 0 and day_of_week <= 6),
  start_time time not null,
  end_time time not null,
  is_available boolean default true,
  consultation_type text default 'general' check (consultation_type in ('general','case_review','document_review','court_preparation','other')),
  fee numeric(10,2) default 0,
  duration_minutes integer default 30,
  created_at timestamptz default now()
);

-- 70. CONSULTATIONS
create table if not exists public.consultations (
  id uuid default uuid_generate_v4() primary key,
  lawyer_id uuid references public.profiles(id) on delete cascade not null,
  client_id uuid references public.clients(id) on delete set null,
  client_name text not null,
  client_email text, client_phone text,
  consultation_date date not null,
  start_time time not null,
  end_time time not null,
  consultation_type text default 'general',
  status text default 'pending' check (status in ('pending','confirmed','completed','cancelled','no_show')),
  notes text, meeting_link text,
  payment_id text,
  payment_amount numeric(10,2) default 0,
  payment_status text default 'unpaid' check (payment_status in ('unpaid','paid','refunded')),
  firm_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 71. COLLECTION_LOGS
create table if not exists public.collection_logs (
  id uuid default uuid_generate_v4() primary key,
  invoice_id uuid references public.invoices(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete set null,
  action text not null check (action in ('reminder','final_notice','legal_notice','recovery','note')),
  channel text check (channel in ('email','whatsapp','sms','phone','in_person')),
  notes text,
  sent_at timestamptz default now(),
  firm_id uuid,
  created_by uuid references public.profiles(id)
);

-- 72. DEADLINE_REMINDERS
create table if not exists public.deadline_reminders (
  id uuid default uuid_generate_v4() primary key,
  case_id uuid references public.cases(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  reminder_date date not null,
  reminder_type text not null check (reminder_type in ('limitation','filing','hearing','custom')),
  message text not null,
  is_sent boolean default false,
  created_at timestamptz default now()
);

-- 73. COURT_CASE_LINKS
create table if not exists public.court_case_links (
  id uuid default gen_random_uuid() primary key,
  case_id uuid references public.cases(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  court_code text not null,
  case_type_code text,
  case_number text, year text,
  cnr_number text,
  bench_code text default '1',
  last_checked timestamptz,
  last_order_date date,
  auto_fetch boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 74. COURT_ORDERS
create table if not exists public.court_orders (
  id uuid default gen_random_uuid() primary key,
  case_id uuid references public.cases(id) on delete cascade,
  court_code text not null,
  order_date date, order_type text,
  judge text, pdf_url text, pdf_storage_path text,
  downloaded boolean default false,
  notified boolean default false,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

-- 75. COURT_CAUSE_LISTS
create table if not exists public.court_cause_lists (
  id uuid default gen_random_uuid() primary key,
  court_code text not null,
  listing_date date not null,
  serial_number integer,
  case_number text, case_type text,
  petitioner text, respondent text,
  advocate_petitioner text, advocate_respondent text,
  court_number text, judge text, bench text,
  created_at timestamptz default now()
);

-- 76. RATE_LIMITS
create table if not exists public.rate_limits (
  id uuid default gen_random_uuid() primary key,
  key text not null,
  created_at timestamptz default now()
);

-- 77. NOTIFICATION_LOGS
create table if not exists public.notification_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  reminder_id uuid,
  channel text not null check (channel in ('email','sms','whatsapp','in_app','push')),
  status text default 'sent' check (status in ('sent','failed','pending')),
  error_message text,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

-- 78. REFERRALS
create table if not exists public.referrals (
  id uuid default gen_random_uuid() primary key,
  referrer_id uuid not null references public.profiles(id),
  referred_id uuid references public.profiles(id),
  referral_code text not null,
  status text default 'pending' check (status in ('pending','signed_up','trial_started','converted','rewarded')),
  referrer_reward_days integer default 30,
  referred_reward_days integer default 30,
  referrer_rewarded boolean default false,
  referred_rewarded boolean default false,
  rewarded_at timestamptz,
  ip_address text, user_agent text,
  source text default 'link',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 79. CRON_JOBS
create table if not exists public.cron_jobs (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  slug text not null unique,
  description text,
  endpoint text not null,
  method text default 'GET' check (method in ('GET','POST')),
  schedule_cron text not null default '0 9 * * *',
  timezone text default 'UTC',
  is_enabled boolean default true,
  last_run_at timestamptz,
  last_status text check (last_status in ('success','failed','running')),
  last_error text,
  last_duration_ms integer,
  total_runs integer default 0,
  total_successes integer default 0,
  total_failures integer default 0,
  actions jsonb default '{"email":false,"whatsapp":false,"in_app":false,"database":true}'::jsonb,
  config jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 80. ANALYTICS_EVENTS
create table if not exists public.analytics_events (
  id uuid default gen_random_uuid() primary key,
  event_type text not null default 'pageview',
  page_url text, referrer text,
  user_agent text, ip_hash text,
  country text, city text,
  device_type text, browser text, os text,
  session_id text not null,
  user_id uuid,
  duration_ms integer,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

-- =============================================
-- INDEXES
-- =============================================

create index if not exists idx_clients_created_by on public.clients(created_by);
create index if not exists idx_clients_deleted_at on public.clients(deleted_at) where deleted_at is null;
create index if not exists idx_clients_firm_id on public.clients(firm_id);
create index if not exists idx_clients_branch on public.clients(branch_id);
create index if not exists idx_cases_client_id on public.cases(client_id);
create index if not exists idx_cases_assigned_to on public.cases(assigned_to);
create index if not exists idx_cases_created_by on public.cases(created_by);
create index if not exists idx_cases_status on public.cases(status);
create index if not exists idx_cases_next_hearing on public.cases(next_hearing_date);
create index if not exists idx_cases_deleted_at on public.cases(deleted_at) where deleted_at is null;
create index if not exists idx_cases_firm_id on public.cases(firm_id);
create index if not exists idx_cases_branch on public.cases(branch_id);
create index if not exists idx_hearings_case_id on public.hearings(case_id);
create index if not exists idx_hearings_date on public.hearings(hearing_date);
create index if not exists idx_hearings_firm_id on public.hearings(firm_id);
create index if not exists idx_documents_case_id on public.documents(case_id);
create index if not exists idx_documents_firm_id on public.documents(firm_id);
create index if not exists idx_time_entries_case_id on public.time_entries(case_id);
create index if not exists idx_time_entries_lawyer_id on public.time_entries(lawyer_id);
create index if not exists idx_time_entries_firm_id on public.time_entries(firm_id);
create index if not exists idx_invoices_client_id on public.invoices(client_id);
create index if not exists idx_invoices_firm_id on public.invoices(firm_id);
create index if not exists idx_invoices_branch on public.invoices(branch_id);
create index if not exists idx_payments_client_id on public.payments(client_id);
create index if not exists idx_payments_firm_id on public.payments(firm_id);
create index if not exists idx_notes_firm_id on public.notes(firm_id);
create index if not exists idx_audit_logs_user_id on public.audit_logs(user_id);
create index if not exists idx_audit_logs_entity on public.audit_logs(entity_type, entity_id);
create index if not exists idx_audit_logs_created_at on public.audit_logs(created_at);
create index if not exists idx_reminders_user_id on public.reminders(user_id);
create index if not exists idx_reminders_date on public.reminders(reminder_date);
create index if not exists idx_activity_logs_user_id on public.activity_logs(user_id);
create index if not exists idx_activity_logs_created_at on public.activity_logs(created_at);
create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_notifications_read on public.notifications(read);
create index if not exists idx_notifications_created_at on public.notifications(created_at);
create index if not exists idx_notifications_firm_id on public.notifications(firm_id);
create index if not exists idx_notification_preferences_user_id on public.notification_preferences(user_id);
create index if not exists idx_messages_case_id on public.messages(case_id);
create index if not exists idx_messages_sender_id on public.messages(sender_id);
create index if not exists idx_messages_receiver_id on public.messages(receiver_id);
create index if not exists idx_messages_client_id on public.messages(client_id);
create index if not exists idx_messages_created_at on public.messages(created_at);
create index if not exists idx_messages_firm_id on public.messages(firm_id);
create index if not exists idx_client_portal_users_client_id on public.client_portal_users(client_id);
create index if not exists idx_client_portal_users_user_id on public.client_portal_users(user_id);
create index if not exists idx_client_portal_users_email on public.client_portal_users(email);
create index if not exists idx_tasks_user on public.tasks(user_id);
create index if not exists idx_tasks_case on public.tasks(case_id);
create index if not exists idx_tasks_client on public.tasks(client_id);
create index if not exists idx_tasks_firm on public.tasks(firm_id);
create index if not exists idx_tasks_assigned on public.tasks(assigned_to);
create index if not exists idx_tasks_status on public.tasks(status);
create index if not exists idx_tasks_due on public.tasks(due_date);
create index if not exists idx_timesheets_user on public.timesheets(user_id);
create index if not exists idx_timesheets_case on public.timesheets(case_id);
create index if not exists idx_timesheets_firm on public.timesheets(firm_id);
create index if not exists idx_timesheets_date on public.timesheets(worked_date);
create index if not exists idx_team_invites_code on public.team_invites(code);
create index if not exists idx_team_invites_firm_id on public.team_invites(firm_id);
create index if not exists idx_workflow_events_type on public.workflow_events(event_type);
create index if not exists idx_workflow_events_case on public.workflow_events(case_id);
create index if not exists idx_workflow_events_firm on public.workflow_events(firm_id);
create index if not exists idx_workflow_events_unprocessed on public.workflow_events(processed) where processed = false;
create index if not exists idx_salary_payments_employee on public.salary_payments(employee_id);
create index if not exists idx_salary_payments_firm on public.salary_payments(firm_id);
create index if not exists idx_salary_payments_period on public.salary_payments(period_start, period_end);
create index if not exists idx_salary_payments_status on public.salary_payments(status);
create index if not exists idx_case_earnings_case on public.case_earnings(case_id);
create index if not exists idx_case_earnings_employee on public.case_earnings(employee_id);
create index if not exists idx_case_earnings_settled on public.case_earnings(settled);
create index if not exists idx_salary_settings_firm on public.salary_settings(firm_id);
create index if not exists idx_role_salary_defaults_firm on public.role_salary_defaults(firm_id);
create index if not exists idx_role_salary_defaults_role on public.role_salary_defaults(firm_id, role);
create index if not exists idx_case_team_case on public.case_team(case_id);
create index if not exists idx_case_team_employee on public.case_team(employee_id);
create index if not exists idx_firm_members_firm_id on public.firm_members(firm_id);
create index if not exists idx_firm_members_user_id on public.firm_members(user_id);
create index if not exists idx_firm_members_role_id on public.firm_members(role_id);
create index if not exists idx_role_permissions_role_id on public.role_permissions(role_id);
create index if not exists idx_role_permissions_permission_code on public.role_permissions(permission_code);
create index if not exists idx_profiles_firm_id on public.profiles(firm_id);
create index if not exists idx_firm_profit_sharing_firm on public.firm_profit_sharing(firm_id);
create index if not exists idx_quotations_firm on public.quotations(firm_id);
create index if not exists idx_quotations_client on public.quotations(client_id);
create index if not exists idx_quotations_status on public.quotations(status);
create index if not exists idx_expenses_user on public.expenses(user_id);
create index if not exists idx_expenses_case on public.expenses(case_id);
create index if not exists idx_expenses_client on public.expenses(client_id);
create index if not exists idx_expenses_firm on public.expenses(firm_id);
create index if not exists idx_expenses_billable on public.expenses(is_billable) where is_billable = true;
create index if not exists idx_expenses_date on public.expenses(expense_date);
create index if not exists idx_ecourts_cases_case_id on public.ecourts_cases(case_id);
create index if not exists idx_ecourts_cases_cnr on public.ecourts_cases(cnr_number);
create index if not exists idx_ecourts_cases_court on public.ecourts_cases(court_name);
create index if not exists idx_cause_list_entries_date on public.cause_list_entries(listing_date);
create index if not exists idx_cause_list_entries_case on public.cause_list_entries(case_id);
create index if not exists idx_cause_list_date on public.cause_list_entries(hearing_date);
create index if not exists idx_cause_list_user on public.cause_list_entries(user_id);
create index if not exists idx_ecourts_orders_case on public.ecourts_orders(ecourts_case_id);
create index if not exists idx_ecourts_sync_log_case on public.ecourts_sync_log(ecourts_case_id);
create index if not exists idx_whatsapp_logs_user on public.whatsapp_logs(user_id);
create index if not exists idx_whatsapp_logs_status on public.whatsapp_logs(status);
create index if not exists idx_scheduled_reminders_date on public.scheduled_reminders(reminder_date);
create index if not exists idx_scheduled_reminders_user on public.scheduled_reminders(user_id);
create index if not exists idx_scheduled_reminders_status on public.scheduled_reminders(status);
create index if not exists idx_trust_accounts_client on public.trust_accounts(client_id);
create index if not exists idx_trust_transactions_account on public.trust_transactions(trust_account_id);
create index if not exists idx_tds_records_invoice on public.tds_records(invoice_id);
create index if not exists idx_coupon_codes_code on public.coupon_codes(code);
create index if not exists idx_coupon_codes_active on public.coupon_codes(is_active);
create index if not exists idx_coupon_uses_coupon_id on public.coupon_uses(coupon_id);
create index if not exists idx_coupon_uses_user_id on public.coupon_uses(user_id);
create index if not exists idx_client_feedback_client on public.client_feedback(client_id);
create index if not exists idx_client_communications_client on public.client_communications(client_id);
create index if not exists idx_case_law_case_id on public.case_law_results(case_id);
create index if not exists idx_case_law_fetched_at on public.case_law_results(fetched_at);
create index if not exists idx_case_alerts_user on public.case_alerts(user_id);
create index if not exists idx_case_alerts_case on public.case_alerts(case_id);
create index if not exists idx_case_alerts_active on public.case_alerts(is_active) where is_active = true;
create index if not exists idx_case_alert_history_alert on public.case_alert_history(case_alert_id);
create index if not exists idx_case_alert_history_created on public.case_alert_history(created_at);
create index if not exists idx_calendar_rules_date on public.calendar_rules(rule_date);
create index if not exists idx_calendar_rules_firm on public.calendar_rules(firm_id);
create index if not exists idx_calendar_events_date on public.calendar_events(event_date);
create index if not exists idx_calendar_events_firm on public.calendar_events(firm_id);
create index if not exists idx_branches_firm_id on public.branches(firm_id);
create index if not exists idx_employee_branches_employee on public.employee_branches(employee_id);
create index if not exists idx_employee_branches_branch on public.employee_branches(branch_id);
create index if not exists idx_blog_posts_published on public.blog_posts(status, published_at desc);
create unique index if not exists idx_blog_posts_slug on public.blog_posts(slug);
create index if not exists idx_ai_usage_user_created on public.ai_usage(user_id, created_at);
create index if not exists idx_firm_addons_firm_id on public.firm_addons(firm_id);
create index if not exists idx_firm_addons_status on public.firm_addons(status);
create index if not exists idx_invoice_counters_firm_fy on public.invoice_counters(firm_id, financial_year);
create index if not exists idx_invoice_templates_firm on public.invoice_templates(firm_id);
create index if not exists idx_intake_forms_user on public.intake_forms(user_id);
create index if not exists idx_intake_submissions_form on public.intake_submissions(form_id);
create index if not exists idx_consultation_slots_user on public.consultation_slots(user_id);
create index if not exists idx_consultations_lawyer on public.consultations(lawyer_id);
create index if not exists idx_consultations_client on public.consultations(client_id);
create index if not exists idx_consultations_date on public.consultations(consultation_date);
create index if not exists idx_collection_logs_invoice on public.collection_logs(invoice_id);
create index if not exists idx_collection_logs_firm_id on public.collection_logs(firm_id);
create index if not exists idx_deadline_reminders_date on public.deadline_reminders(reminder_date);
create index if not exists idx_court_case_links_case_id on public.court_case_links(case_id);
create index if not exists idx_court_case_links_user_id on public.court_case_links(user_id);
create index if not exists idx_court_case_links_cnr on public.court_case_links(cnr_number);
create index if not exists idx_court_orders_case_id on public.court_orders(case_id);
create index if not exists idx_court_orders_date on public.court_orders(order_date);
create index if not exists idx_court_cause_lists_date on public.court_cause_lists(listing_date);
create index if not exists idx_court_cause_lists_court on public.court_cause_lists(court_code);
create index if not exists idx_rate_limits_key_created on public.rate_limits(key, created_at);
create index if not exists idx_notification_logs_user_id on public.notification_logs(user_id);
create index if not exists idx_notification_logs_created_at on public.notification_logs(created_at);
create index if not exists idx_referrals_referrer on public.referrals(referrer_id);
create index if not exists idx_referrals_referred on public.referrals(referred_id);
create index if not exists idx_referrals_code on public.referrals(referral_code);
create index if not exists idx_referrals_status on public.referrals(status);
create index if not exists idx_cron_jobs_slug on public.cron_jobs(slug);
create index if not exists idx_cron_jobs_enabled on public.cron_jobs(is_enabled);
create index if not exists idx_analytics_events_created_at on public.analytics_events(created_at desc);
create index if not exists idx_analytics_events_session_id on public.analytics_events(session_id);
create index if not exists idx_analytics_events_event_type on public.analytics_events(event_type);
create index if not exists idx_analytics_events_page_url on public.analytics_events(page_url);
create index if not exists idx_analytics_events_referrer on public.analytics_events(referrer);
create index if not exists idx_analytics_events_user_id on public.analytics_events(user_id);
create index if not exists idx_tags_firm_id on public.tags(firm_id);

-- =============================================
-- ROW LEVEL SECURITY (enable on all tables)
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
alter table public.notifications enable row level security;
alter table public.messages enable row level security;
alter table public.client_portal_users enable row level security;
alter table public.tasks enable row level security;
alter table public.timesheets enable row level security;
alter table public.active_timers enable row level security;
alter table public.team_invites enable row level security;
alter table public.workflow_events enable row level security;
alter table public.salary_payments enable row level security;
alter table public.case_earnings enable row level security;
alter table public.salary_settings enable row level security;
alter table public.role_salary_defaults enable row level security;
alter table public.case_team enable row level security;
alter table public.firm_profit_sharing enable row level security;
alter table public.firm_roles enable row level security;
alter table public.firm_members enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.quotations enable row level security;
alter table public.expenses enable row level security;
alter table public.ecourts_cases enable row level security;
alter table public.cause_list_entries enable row level security;
alter table public.ecourts_orders enable row level security;
alter table public.ecourts_sync_log enable row level security;
alter table public.whatsapp_logs enable row level security;
alter table public.scheduled_reminders enable row level security;
alter table public.trust_accounts enable row level security;
alter table public.trust_transactions enable row level security;
alter table public.tds_records enable row level security;
alter table public.coupon_codes enable row level security;
alter table public.coupon_uses enable row level security;
alter table public.client_tags enable row level security;
alter table public.client_tag_assignments enable row level security;
alter table public.client_feedback enable row level security;
alter table public.client_communications enable row level security;
alter table public.case_law_results enable row level security;
alter table public.case_alerts enable row level security;
alter table public.case_alert_history enable row level security;
alter table public.calendar_rules enable row level security;
alter table public.calendar_events enable row level security;
alter table public.branches enable row level security;
alter table public.employee_branches enable row level security;
alter table public.ai_usage enable row level security;
alter table public.firm_addons enable row level security;
alter table public.invoice_counters enable row level security;
alter table public.invoice_templates enable row level security;
alter table public.intake_forms enable row level security;
alter table public.intake_submissions enable row level security;
alter table public.consultation_slots enable row level security;
alter table public.consultations enable row level security;
alter table public.collection_logs enable row level security;
alter table public.deadline_reminders enable row level security;
alter table public.court_case_links enable row level security;
alter table public.court_orders enable row level security;
alter table public.court_cause_lists enable row level security;
alter table public.rate_limits enable row level security;
alter table public.notification_logs enable row level security;
alter table public.referrals enable row level security;
alter table public.analytics_events enable row level security;

-- =============================================
-- FUNCTIONS
-- =============================================

-- is_admin: check if user has admin/owner role
create or replace function public.is_admin(uid uuid)
returns boolean language sql security definer stable set search_path = public
as $$ select exists (select 1 from public.profiles where id = uid and role = 'owner'); $$;

-- is_firm_privileged: check if user is owner or partner
create or replace function public.is_firm_privileged(uid uuid)
returns boolean language sql security definer stable set search_path = public
as $$ select exists (select 1 from public.profiles where id = uid and role in ('owner','partner')); $$;

-- is_firm_owner
create or replace function public.is_firm_owner(uid uuid)
returns boolean language sql security definer stable set search_path = public
as $$ select exists (select 1 from public.profiles where id = uid and role = 'owner'); $$;

-- has_permission
create or replace function public.has_permission(uid uuid, perm_code text)
returns boolean language sql security definer stable set search_path = public
as $$
  select exists (
    select 1 from public.firm_members fm
    join public.role_permissions rp on rp.role_id = fm.role_id
    where fm.user_id = uid and fm.is_active = true and rp.permission_code = perm_code
  ) or exists (
    select 1 from public.profiles p where p.id = uid and p.role = 'super_admin'
  );
$$;

-- get_role_level
create or replace function public.get_role_level(uid uuid)
returns integer language sql security definer stable set search_path = public
as $$
  select case (select role from public.profiles where id = uid)
    when 'owner' then 0 when 'super_admin' then 0 when 'partner' then 1
    when 'senior_associate' then 2 when 'associate' then 3
    when 'junior_associate' then 4 when 'paralegal' then 5
    when 'intern' then 6 when 'office_admin' then 7 else 99
  end;
$$;

-- get_my_firm_id
create or replace function public.get_my_firm_id()
returns uuid language sql security definer stable set search_path = public
as $$ select firm_id from public.profiles where id = auth.uid(); $$;

-- can_manage_invites
create or replace function public.can_manage_invites(uid uuid)
returns boolean language sql security definer stable set search_path = public
as $$ select exists (select 1 from public.profiles where id = uid and role in ('owner','partner','super_admin')); $$;

-- get_profit_share
create or replace function public.get_profit_share(p_firm_id uuid, p_role text)
returns numeric language sql security definer stable
as $$ select coalesce((select profit_percentage from public.firm_profit_sharing where firm_id = p_firm_id and role = p_role), 0); $$;

-- get_firm_profit_shares
create or replace function public.get_firm_profit_shares(p_firm_id uuid)
returns table(role text, profit_percentage numeric) language sql security definer stable
as $$ select fps.role, fps.profit_percentage from public.firm_profit_sharing fps where fps.firm_id = p_firm_id order by fps.profit_percentage desc; $$;

-- update_updated_at
create or replace function public.update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

-- update_tasks_updated_at
create or replace function public.update_tasks_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  if new.status = 'done' and old.status != 'done' then new.completed_at = now(); end if;
  return new;
end;
$$ language plpgsql;

-- update_timesheets_updated_at
create or replace function public.update_timesheets_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

-- update_expenses_updated_at
create or replace function public.update_expenses_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

-- update_consultations_updated_at
create or replace function public.update_consultations_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

-- update_salary_updated_at
create or replace function public.update_salary_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

-- update_coupon_codes_updated_at
create or replace function public.update_coupon_codes_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

-- update_court_case_links_updated_at
create or replace function public.update_court_case_links_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

-- update_invoice_counters_updated_at
create or replace function public.update_invoice_counters_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

-- update_firm_addons_updated_at
create or replace function public.update_firm_addons_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

-- update_branches_updated_at
create or replace function public.update_branches_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

-- update_case_alert_updated_at
create or replace function public.update_case_alert_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

-- update_referrals_updated_at
create or replace function public.update_referrals_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

-- update_cron_jobs_updated_at
create or replace function public.update_cron_jobs_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

-- handle_new_user: create profile on auth signup
create or replace function public.handle_new_user()
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

-- log_audit
create or replace function public.log_audit(
  p_user_id uuid, p_action text, p_entity_type text,
  p_entity_id uuid default null, p_entity_name text default null,
  p_old_values jsonb default null, p_new_values jsonb default null
) returns void as $$
begin
  insert into public.audit_logs (user_id, action, entity_type, entity_id, entity_name, old_values, new_values)
  values (p_user_id, p_action, p_entity_type, p_entity_id, p_entity_name, p_old_values, p_new_values);
end;
$$ language plpgsql security definer;

-- log_activity
create or replace function public.log_activity(
  p_user_id uuid, p_action text, p_entity_type text default null,
  p_entity_id uuid default null, p_entity_name text default null,
  p_details jsonb default '{}'::jsonb
) returns void as $$
begin
  insert into public.activity_logs (user_id, action, entity_type, entity_id, entity_name, details)
  values (p_user_id, p_action, p_entity_type, p_entity_id, p_entity_name, p_details);
end;
$$ language plpgsql security definer;

-- generate_case_number
create or replace function public.generate_case_number()
returns text as $$
declare year_part text; seq_num text;
begin
  year_part := to_char(now(), 'YYYY');
  seq_num := lpad(nextval('case_number_seq')::text, 5, '0');
  return 'CASE/' || year_part || '/' || seq_num;
end;
$$ language plpgsql;

do $$ begin
  if not exists (select 1 from pg_sequences where sequencename = 'case_number_seq') then
    create sequence case_number_seq start with 1000;
  end if;
end $$;

-- generate_invoice_number
create or replace function public.generate_invoice_number()
returns text as $$
declare year_part text; seq_num text;
begin
  year_part := to_char(now(), 'YYYY');
  seq_num := lpad(nextval('invoice_number_seq')::text, 5, '0');
  return 'INV/' || year_part || '/' || seq_num;
end;
$$ language plpgsql;

do $$ begin
  if not exists (select 1 from pg_sequences where sequencename = 'invoice_number_seq') then
    create sequence invoice_number_seq start with 1000;
  end if;
end $$;

-- generate_quotation_number
create or replace function public.generate_quotation_number()
returns trigger as $$
begin
  if new.quotation_number is null or new.quotation_number = '' then
    new.quotation_number := 'Q-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substring(md5(random()::text) from 1 for 4));
  end if;
  return new;
end;
$$ language plpgsql;

-- generate_referral_code
create or replace function public.generate_referral_code()
returns trigger as $$
begin
  if new.referral_code is null then
    new.referral_code := upper(substring(md5(random()::text) from 1 for 8));
  end if;
  return new;
end;
$$ language plpgsql;

-- next_invoice_number (atomic per firm+FY)
create or replace function public.next_invoice_number(p_firm_id uuid, p_fy text)
returns integer language plpgsql security definer set search_path = public
as $$
declare v_next integer;
begin
  insert into public.invoice_counters (firm_id, financial_year, next_number)
  values (p_firm_id, p_fy, 2)
  on conflict (firm_id, financial_year)
  do update set next_number = public.invoice_counters.next_number + 1
  returning next_number into v_next;
  return v_next;
end;
$$;

-- cleanup_rate_limits
create or replace function public.cleanup_rate_limits()
returns void as $$
begin
  delete from public.rate_limits where created_at < now() - interval '1 hour';
end;
$$ language plpgsql;

-- log_cron_run
create or replace function public.log_cron_run(
  p_slug text, p_status text, p_duration_ms integer default null, p_error text default null
) returns void as $$
begin
  update public.cron_jobs set
    last_run_at = now(), last_status = p_status, last_error = p_error,
    last_duration_ms = p_duration_ms,
    total_runs = total_runs + 1,
    total_successes = case when p_status = 'success' then total_successes + 1 else total_successes end,
    total_failures = case when p_status = 'failed' then total_failures + 1 else total_failures end
  where slug = p_slug;
end;
$$ language plpgsql;

-- set_firm_id_from_creator: auto-set firm_id on insert
create or replace function public.set_firm_id_from_creator()
returns trigger as $$
declare new_json jsonb; creator_id uuid;
begin
  if new.firm_id is null then
    new_json := to_jsonb(NEW);
    creator_id := coalesce(
      (new_json ->> 'created_by')::uuid,
      (new_json ->> 'uploaded_by')::uuid,
      (new_json ->> 'received_by')::uuid,
      (new_json ->> 'issued_by')::uuid,
      (new_json ->> 'author_id')::uuid,
      (new_json ->> 'user_id')::uuid,
      auth.uid()
    );
    select firm_id into new.firm_id from public.profiles where id = creator_id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- calculate_employee_salary
create or replace function public.calculate_employee_salary(
  p_employee_id uuid, p_month integer, p_year integer
) returns numeric language plpgsql security definer
as $$
declare
  v_payment_type text; v_monthly_salary numeric; v_percentage_rate numeric;
  v_total_earned numeric := 0; v_period_start date; v_period_end date;
begin
  select payment_type, monthly_salary, percentage_rate
  into v_payment_type, v_monthly_salary, v_percentage_rate
  from public.profiles where id = p_employee_id;
  v_period_start := make_date(p_year, p_month, 1);
  v_period_end := (v_period_start + interval '1 month' - interval '1 day')::date;
  if v_payment_type = 'fixed_salary' then
    return coalesce(v_monthly_salary, 0);
  elsif v_payment_type = 'case_percentage' then
    select coalesce(sum(ce.earned_amount), 0) into v_total_earned
    from public.case_earnings ce
    where ce.employee_id = p_employee_id
      and ce.created_at >= v_period_start and ce.created_at < v_period_end + interval '1 day'
      and ce.settled = false;
    return v_total_earned;
  else return 0;
  end if;
end;
$$;

-- generate_hearing_reminders
create or replace function public.generate_hearing_reminders()
returns trigger as $$
begin
  insert into public.scheduled_reminders (user_id, case_id, client_id, title, message, reminder_date, channels)
  select c.assigned_to, c.id, c.client_id,
    'Hearing in 7 days: ' || c.title,
    'Your case ' || c.case_number || ' has a hearing on ' || to_char(NEW.hearing_date, 'DD Mon YYYY HH:MI AM') || '.',
    NEW.hearing_date - interval '7 days', '{in_app,email}'
  from public.cases c where c.id = NEW.case_id and c.assigned_to is not null and NEW.hearing_date > now() + interval '7 days';
  return NEW;
end;
$$ language plpgsql security definer;

-- notify_hearing_updated
create or replace function public.notify_hearing_updated()
returns trigger as $$
begin
  if OLD.hearing_date is distinct from NEW.hearing_date and NEW.hearing_date is not null then
    insert into public.workflow_events (event_type, entity_type, entity_id, case_id, firm_id, old_data, new_data)
    values ('hearing_updated', 'hearing', NEW.id, NEW.case_id, (select firm_id from public.cases where id = NEW.case_id),
      jsonb_build_object('hearing_date', OLD.hearing_date),
      jsonb_build_object('hearing_date', NEW.hearing_date));
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

-- notify_case_status_changed
create or replace function public.notify_case_status_changed()
returns trigger as $$
begin
  if OLD.status is distinct from NEW.status then
    insert into public.workflow_events (event_type, entity_type, entity_id, case_id, firm_id, old_data, new_data)
    values ('case_status_changed', 'case', NEW.id, NEW.id, NEW.firm_id,
      jsonb_build_object('status', OLD.status), jsonb_build_object('status', NEW.status));
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

-- notify_document_uploaded
create or replace function public.notify_document_uploaded()
returns trigger as $$
begin
  if NEW.case_id is not null then
    insert into public.workflow_events (event_type, entity_type, entity_id, case_id, firm_id, new_data)
    values ('document_uploaded', 'document', NEW.id, NEW.case_id,
      (select firm_id from public.cases where id = NEW.case_id),
      jsonb_build_object('title', NEW.title, 'file_name', NEW.file_name));
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

-- =============================================
-- TRIGGERS
-- =============================================

-- updated_at triggers (loop over tables)
do $$
declare tbl text;
begin
  for tbl in select unnest(array[
    'profiles','clients','cases','hearings','invoices','notes',
    'subscription_plans','user_subscriptions','platform_settings',
    'reminders','firm_roles','firm_members'
  ]) loop
    execute format(
      'create trigger update_%s_updated_at before update on public.%s
       for each row execute function update_updated_at()', tbl, tbl);
  end loop;
end $$;

-- auth user signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- tasks updated_at
create trigger tasks_updated_at before update on public.tasks
  for each row execute function update_tasks_updated_at();

-- timesheets updated_at
create trigger timesheets_updated_at before update on public.timesheets
  for each row execute function update_timesheets_updated_at();

-- expenses updated_at
create trigger expenses_updated_at before update on public.expenses
  for each row execute function update_expenses_updated_at();

-- consultations updated_at
create trigger consultations_updated_at before update on public.consultations
  for each row execute function update_consultations_updated_at();

-- salary updated_at
create trigger update_salary_payments_updated_at before update on public.salary_payments
  for each row execute function update_salary_updated_at();
create trigger update_salary_settings_updated_at before update on public.salary_settings
  for each row execute function update_salary_updated_at();
create trigger update_role_salary_defaults_updated_at before update on public.role_salary_defaults
  for each row execute function update_salary_updated_at();

-- quotation number
drop trigger if exists trg_quotation_number on public.quotations;
create trigger trg_quotation_number before insert on public.quotations
  for each row execute function generate_quotation_number();

-- referral code
drop trigger if exists auto_generate_referral_code on public.profiles;
create trigger auto_generate_referral_code before insert on public.profiles
  for each row execute function generate_referral_code();

-- referrals updated_at
create trigger referrals_updated_at before update on public.referrals
  for each row execute function update_referrals_updated_at();

-- coupon_codes updated_at
drop trigger if exists update_coupon_codes_updated_at on public.coupon_codes;
create trigger update_coupon_codes_updated_at before update on public.coupon_codes
  for each row execute function update_coupon_codes_updated_at();

-- court_case_links updated_at
create trigger trigger_update_court_case_links_updated_at before update on public.court_case_links
  for each row execute function update_court_case_links_updated_at();

-- invoice_counters updated_at
create trigger update_invoice_counters_updated_at before update on public.invoice_counters
  for each row execute function update_invoice_counters_updated_at();

-- firm_addons updated_at
drop trigger if exists update_firm_addons_updated_at on public.firm_addons;
create trigger update_firm_addons_updated_at before update on public.firm_addons
  for each row execute function update_firm_addons_updated_at();

-- branches updated_at
create trigger branches_updated_at before update on public.branches
  for each row execute function update_branches_updated_at();

-- case_alerts updated_at
create trigger case_alerts_updated_at before update on public.case_alerts
  for each row execute function update_case_alert_updated_at();

-- cron_jobs updated_at
drop trigger if exists cron_jobs_updated_at on public.cron_jobs;
create trigger cron_jobs_updated_at before update on public.cron_jobs
  for each row execute function update_cron_jobs_updated_at();

-- hearing reminders (auto-generate)
drop trigger if exists on_hearing_created on public.hearings;
create trigger on_hearing_created after insert on public.hearings
  for each row execute function generate_hearing_reminders();

-- workflow triggers
drop trigger if exists on_hearing_updated on public.hearings;
create trigger on_hearing_updated after update on public.hearings
  for each row execute function notify_hearing_updated();

drop trigger if exists on_case_status_changed on public.cases;
create trigger on_case_status_changed after update of status on public.cases
  for each row execute function notify_case_status_changed();

drop trigger if exists on_document_uploaded on public.documents;
create trigger on_document_uploaded after insert on public.documents
  for each row execute function notify_document_uploaded();

-- set_firm_id triggers
do $$
declare tbl text;
begin
  for tbl in select unnest(array[
    'cases','clients','documents','payments','invoices',
    'hearings','messages','notifications','notes'
  ]) loop
    execute format(
      'create trigger set_firm_id_%s before insert on public.%s
       for each row execute function set_firm_id_from_creator()', tbl, tbl);
  end loop;
end $$;

-- =============================================
-- RLS POLICIES (final state after all migrations)
-- =============================================

-- PROFILES
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Authenticated users can insert own profile" on public.profiles;
drop policy if exists "Admins can view all profiles" on public.profiles;
drop policy if exists "profiles_firm_isolation" on public.profiles;

create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);
create policy "Authenticated users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles_firm_isolation" on public.profiles
  for select using (id = auth.uid() or firm_id = public.get_my_firm_id());

-- CLIENTS
drop policy if exists "clients_firm_isolation" on public.clients;
create policy "clients_firm_isolation" on public.clients
  for all using (
    firm_id = public.get_my_firm_id()
    and (public.is_firm_privileged(auth.uid()) or created_by = auth.uid()
      or exists (select 1 from public.cases where cases.client_id = clients.id
        and (cases.created_by = auth.uid() or cases.assigned_to = auth.uid())))
  );

-- CASES
drop policy if exists "cases_firm_isolation" on public.cases;
create policy "cases_firm_isolation" on public.cases
  for all using (
    firm_id = public.get_my_firm_id()
    and (public.is_firm_privileged(auth.uid()) or created_by = auth.uid() or assigned_to = auth.uid())
  );

-- HEARINGS
drop policy if exists "hearings_firm_isolation" on public.hearings;
create policy "hearings_firm_isolation" on public.hearings
  for all using (
    firm_id = public.get_my_firm_id()
    and (public.is_firm_privileged(auth.uid())
      or exists (select 1 from public.cases where cases.id = hearings.case_id
        and (cases.created_by = auth.uid() or cases.assigned_to = auth.uid())))
  );

-- DOCUMENTS
drop policy if exists "documents_firm_isolation" on public.documents;
create policy "documents_firm_isolation" on public.documents
  for all using (
    firm_id = public.get_my_firm_id()
    and (public.is_firm_privileged(auth.uid()) or uploaded_by = auth.uid()
      or exists (select 1 from public.cases where cases.id = documents.case_id
        and (cases.created_by = auth.uid() or cases.assigned_to = auth.uid())))
  );

-- TIME_ENTRIES
drop policy if exists "time_entries_firm_isolation" on public.time_entries;
create policy "time_entries_firm_isolation" on public.time_entries
  for all using (lawyer_id = auth.uid() or public.is_firm_privileged(auth.uid()));

-- INVOICES
drop policy if exists "invoices_firm_isolation" on public.invoices;
create policy "invoices_firm_isolation" on public.invoices
  for all using (
    firm_id = public.get_my_firm_id()
    and (public.is_firm_privileged(auth.uid()) or issued_by = auth.uid())
  );

-- PAYMENTS
drop policy if exists "payments_firm_isolation" on public.payments;
create policy "payments_firm_isolation" on public.payments
  for all using (
    firm_id = public.get_my_firm_id()
    and (public.is_firm_privileged(auth.uid()) or received_by = auth.uid())
  );

-- NOTES
drop policy if exists "notes_firm_isolation" on public.notes;
create policy "notes_firm_isolation" on public.notes
  for all using (
    firm_id = public.get_my_firm_id()
    and (public.is_firm_privileged(auth.uid()) or author_id = auth.uid()
      or exists (select 1 from public.cases where cases.id = notes.case_id
        and (cases.created_by = auth.uid() or cases.assigned_to = auth.uid())))
  );

-- TAGS
drop policy if exists "tags_firm_isolation" on public.tags;
create policy "tags_firm_isolation" on public.tags
  for all using (firm_id = public.get_my_firm_id());

-- CASE_TAGS
drop policy if exists "case_tags_firm_isolation" on public.case_tags;
create policy "case_tags_firm_isolation" on public.case_tags
  for all using (
    exists (select 1 from public.cases where cases.id = case_tags.case_id
      and cases.firm_id = public.get_my_firm_id()
      and (public.is_firm_privileged(auth.uid()) or cases.created_by = auth.uid() or cases.assigned_to = auth.uid()))
  );

-- REMINDERS
drop policy if exists "reminders_firm_isolation" on public.reminders;
create policy "reminders_firm_isolation" on public.reminders
  for all using (user_id = auth.uid() or firm_id = public.get_my_firm_id());

-- AUDIT_LOGS
create policy "Users can view own audit logs" on public.audit_logs
  for select using (auth.uid() = user_id);
create policy "Admins can view all audit logs" on public.audit_logs
  for select using (public.is_admin(auth.uid()));
create policy "Authenticated users can insert audit logs" on public.audit_logs
  for insert with check (auth.role() = 'authenticated');

-- SUBSCRIPTION_PLANS
create policy "Authenticated users can view plans" on public.subscription_plans
  for select using (auth.role() = 'authenticated');
create policy "Admins can manage plans" on public.subscription_plans
  for all using (public.is_admin(auth.uid()));

-- USER_SUBSCRIPTIONS
create policy "Users can view own subscriptions" on public.user_subscriptions
  for select using (auth.uid() = user_id);
create policy "Admins can manage all subscriptions" on public.user_subscriptions
  for all using (public.is_admin(auth.uid()));

-- ACTIVITY_LOGS
create policy "Admins can view all activity logs" on public.activity_logs
  for select using (public.is_admin(auth.uid()));
create policy "Authenticated users can insert activity logs" on public.activity_logs
  for insert with check (auth.role() = 'authenticated');

-- SUPER_ADMINS
create policy "Owner can manage super_admins" on public.super_admins
  for all using (exists (select 1 from public.super_admins where id = auth.uid() and access_level = 'owner'));

-- PLATFORM_SETTINGS
create policy "Super admins can manage settings" on public.platform_settings
  for all using (exists (select 1 from public.super_admins where id = auth.uid()));

-- NOTIFICATIONS
drop policy if exists "notifications_firm_isolation" on public.notifications;
create policy "notifications_firm_isolation" on public.notifications
  for all using (user_id = auth.uid() or firm_id = public.get_my_firm_id());

-- MESSAGES
drop policy if exists "messages_firm_isolation" on public.messages;
create policy "messages_firm_isolation" on public.messages
  for all using (firm_id = public.get_my_firm_id());

-- CLIENT_PORTAL_USERS
drop policy if exists "portal_users_firm_isolation" on public.client_portal_users;
create policy "portal_users_firm_isolation" on public.client_portal_users
  for all using (client_id in (select id from public.clients where firm_id = public.get_my_firm_id()));

-- TASKS
create policy "Users can manage tasks for their firm" on public.tasks
  for all using (user_id = auth.uid() or assigned_to = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.firm_id = tasks.firm_id and p.role in ('owner','partner')));

-- TIMESHEETS
create policy "Users can manage timesheets for their firm" on public.timesheets
  for all using (user_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.firm_id = timesheets.firm_id and p.role in ('owner','partner')));

-- ACTIVE_TIMERS
create policy "Users can manage their own timer" on public.active_timers
  for all using (user_id = auth.uid());

-- TEAM_INVITES
create policy "Firm can manage invites" on public.team_invites
  for all using (public.can_manage_invites(auth.uid()));
drop policy if exists "team_invites_redeem_firm" on public.team_invites;
create policy "team_invites_redeem_firm" on public.team_invites
  for update using (is_active = true and used_by is null and firm_id = public.get_my_firm_id());

-- CASE_TEAM
create policy "case_team_select" on public.case_team for select using (
  exists (select 1 from public.cases where cases.id = case_team.case_id
    and (cases.created_by = auth.uid() or cases.assigned_to = auth.uid())));
create policy "case_team_insert" on public.case_team for insert with check (
  exists (select 1 from public.cases where cases.id = case_id
    and (cases.created_by = auth.uid() or cases.assigned_to = auth.uid())));
create policy "case_team_update" on public.case_team for update using (
  exists (select 1 from public.cases where cases.id = case_id
    and (cases.created_by = auth.uid() or cases.assigned_to = auth.uid())));
create policy "case_team_delete" on public.case_team for delete using (
  exists (select 1 from public.cases where cases.id = case_id
    and (cases.created_by = auth.uid() or cases.assigned_to = auth.uid())));

-- SALARY_PAYMENTS
create policy "salary_payments_select" on public.salary_payments for select using (
  firm_id = public.get_my_firm_id());
create policy "salary_payments_insert" on public.salary_payments for insert with check (
  firm_id = public.get_my_firm_id() and exists (select 1 from public.profiles where id = auth.uid() and role in ('owner','partner','admin')));
create policy "salary_payments_update" on public.salary_payments for update using (
  firm_id = public.get_my_firm_id() and exists (select 1 from public.profiles where id = auth.uid() and role in ('owner','partner','admin')));

-- CASE_EARNINGS
create policy "case_earnings_select" on public.case_earnings for select using (
  exists (select 1 from public.profiles where id = auth.uid()
    and (firm_id = (select firm_id from public.profiles where id = employee_id) or id = employee_id or role in ('owner','partner','admin'))));
create policy "case_earnings_insert" on public.case_earnings for insert with check (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('owner','partner','admin')));

-- SALARY_SETTINGS
create policy "salary_settings_select" on public.salary_settings for select using (
  firm_id = public.get_my_firm_id());
create policy "salary_settings_insert" on public.salary_settings for insert with check (
  firm_id = public.get_my_firm_id() and exists (select 1 from public.profiles where id = auth.uid() and role in ('owner','partner')));
create policy "salary_settings_update" on public.salary_settings for update using (
  firm_id = public.get_my_firm_id() and exists (select 1 from public.profiles where id = auth.uid() and role in ('owner','partner')));

-- ROLE_SALARY_DEFAULTS
create policy "role_salary_defaults_select" on public.role_salary_defaults for select using (
  firm_id = public.get_my_firm_id());
create policy "role_salary_defaults_insert" on public.role_salary_defaults for insert with check (
  firm_id = public.get_my_firm_id() and exists (select 1 from public.profiles where id = auth.uid() and role in ('owner','partner')));
create policy "role_salary_defaults_update" on public.role_salary_defaults for update using (
  firm_id = public.get_my_firm_id() and exists (select 1 from public.profiles where id = auth.uid() and role in ('owner','partner')));
create policy "role_salary_defaults_delete" on public.role_salary_defaults for delete using (
  firm_id = public.get_my_firm_id() and exists (select 1 from public.profiles where id = auth.uid() and role in ('owner','partner')));

-- FIRM_PROFIT_SHARING
create policy "Firm owners can manage profit sharing" on public.firm_profit_sharing
  for all using (exists (select 1 from public.profiles where id = auth.uid() and role = 'owner' and firm_id = firm_profit_sharing.firm_id));

-- FIRM_ROLES
create policy "Firm owner can manage roles" on public.firm_roles
  for all using (public.is_firm_owner(auth.uid()) or public.has_permission(auth.uid(), 'firm.manage'));
create policy "Members can view firm roles" on public.firm_roles
  for select using (public.has_permission(auth.uid(), 'team.view'));

-- FIRM_MEMBERS
create policy "Members can view firm members" on public.firm_members
  for select using (public.has_permission(auth.uid(), 'team.view'));
create policy "Firm owner can manage members" on public.firm_members
  for all using (public.is_firm_owner(auth.uid()) or public.has_permission(auth.uid(), 'team.invite'));

-- PERMISSIONS
create policy "Authenticated users can view permissions" on public.permissions
  for select using (auth.role() = 'authenticated');

-- ROLE_PERMISSIONS
create policy "Authenticated users can view role permissions" on public.role_permissions
  for select using (auth.role() = 'authenticated');

-- QUOTATIONS
create policy "Firm members can view quotations" on public.quotations for select using (
  firm_id in (select firm_id from public.profiles where id = auth.uid()));
create policy "Firm members can insert quotations" on public.quotations for insert with check (
  firm_id in (select firm_id from public.profiles where id = auth.uid()));
create policy "Firm members can update quotations" on public.quotations for update using (
  firm_id in (select firm_id from public.profiles where id = auth.uid()));
create policy "Firm members can delete quotations" on public.quotations for delete using (
  firm_id in (select firm_id from public.profiles where id = auth.uid()));

-- EXPENSES
create policy "Users can manage expenses for their firm" on public.expenses
  for all using (user_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.firm_id = expenses.firm_id and p.role in ('owner','partner')));

-- ECOURTS
create policy "ecourts_cases_firm_isolation" on public.ecourts_cases for all using (
  exists (select 1 from public.cases where cases.id = ecourts_cases.case_id
    and cases.firm_id = public.get_my_firm_id()
    and (public.is_firm_privileged(auth.uid()) or cases.created_by = auth.uid() or cases.assigned_to = auth.uid())));
create policy "cause_list_entries_firm_isolation" on public.cause_list_entries for all using (
  exists (select 1 from public.cases where cases.id = cause_list_entries.case_id
    and cases.firm_id = public.get_my_firm_id()
    and (public.is_firm_privileged(auth.uid()) or cases.created_by = auth.uid() or cases.assigned_to = auth.uid())));
create policy "ecourts_orders_firm_isolation" on public.ecourts_orders for all using (
  exists (select 1 from public.cases where cases.id = ecourts_orders.case_id
    and cases.firm_id = public.get_my_firm_id()
    and (public.is_firm_privileged(auth.uid()) or cases.created_by = auth.uid() or cases.assigned_to = auth.uid())));
create policy "System can manage sync logs" on public.ecourts_sync_log
  for all using (auth.role() = 'service_role');
create policy "whatsapp_logs_user_isolation" on public.whatsapp_logs
  for select using (user_id = auth.uid());
create policy "whatsapp_logs_insert_auth" on public.whatsapp_logs
  for insert with check (user_id = auth.uid());
create policy "scheduled_reminders_firm_isolation" on public.scheduled_reminders
  for all using (user_id = auth.uid() or firm_id = public.get_my_firm_id());
create policy "trust_accounts_firm_isolation" on public.trust_accounts for all using (
  exists (select 1 from public.cases where cases.id = trust_accounts.case_id
    and cases.firm_id = public.get_my_firm_id()
    and (public.is_firm_privileged(auth.uid()) or cases.created_by = auth.uid() or cases.assigned_to = auth.uid())));
create policy "trust_transactions_firm_isolation" on public.trust_transactions for all using (
  exists (select 1 from public.trust_accounts ta join public.cases c on c.id = ta.case_id
    where ta.id = trust_transactions.trust_account_id and c.firm_id = public.get_my_firm_id()
    and (public.is_firm_privileged(auth.uid()) or c.created_by = auth.uid() or c.assigned_to = auth.uid())));
create policy "tds_records_firm_isolation" on public.tds_records for all using (
  exists (select 1 from public.clients where clients.id = tds_records.client_id and clients.firm_id = public.get_my_firm_id()));

-- COUPONS
create policy "Authenticated users can view active coupons" on public.coupon_codes
  for select to authenticated using (is_active = true or created_by = auth.uid());
create policy "Super admins can manage coupons" on public.coupon_codes
  for all to authenticated using (exists (select 1 from public.super_admins where id = auth.uid()));
create policy "Users can view own coupon uses" on public.coupon_uses
  for select to authenticated using (user_id = auth.uid());
create policy "Super admins can view all coupon uses" on public.coupon_uses
  for all to authenticated using (exists (select 1 from public.super_admins where id = auth.uid()));

-- CLIENT_TAGS
create policy "Users manage own tags" on public.client_tags for all using (user_id = auth.uid());
create policy "tag_assignments_firm_isolation" on public.client_tag_assignments for all using (
  exists (select 1 from public.client_tags ct where ct.id = client_tag_assignments.tag_id and ct.firm_id = public.get_my_firm_id()));

-- CLIENT_FEEDBACK
create policy "feedback_firm_isolation" on public.client_feedback for all using (
  exists (select 1 from public.clients where clients.id = client_feedback.client_id and clients.firm_id = public.get_my_firm_id()));

-- CLIENT_COMMUNICATIONS
create policy "Users manage communications for their clients" on public.client_communications for all using (
  client_id in (select id from public.clients where created_by = auth.uid()));

-- CASE_LAW_RESULTS
create policy "case_law_results_firm_isolation" on public.case_law_results for all using (
  exists (select 1 from public.cases where cases.id = case_law_results.case_id
    and cases.firm_id = public.get_my_firm_id()
    and (public.is_firm_privileged(auth.uid()) or cases.created_by = auth.uid() or cases.assigned_to = auth.uid())));

-- CASE_ALERTS
create policy "Users can manage their own case alerts" on public.case_alerts for all using (user_id = auth.uid());
create policy "Users can view their alert history" on public.case_alert_history for select using (
  exists (select 1 from public.case_alerts where case_alerts.id = case_alert_history.case_alert_id and case_alerts.user_id = auth.uid()));

-- CALENDAR
create policy "Users view firm rules" on public.calendar_rules for select using (
  created_by = auth.uid() or firm_id in (select firm_id from public.profiles where id = auth.uid()) or firm_id = auth.uid());
create policy "Users insert rules" on public.calendar_rules for insert with check (created_by = auth.uid() or created_by is null);
create policy "Users update own rules" on public.calendar_rules for update using (created_by = auth.uid() or firm_id = auth.uid());
create policy "Users delete own rules" on public.calendar_rules for delete using (created_by = auth.uid() or firm_id = auth.uid());
create policy "Users view firm events" on public.calendar_events for select using (
  created_by = auth.uid() or firm_id in (select firm_id from public.profiles where id = auth.uid()) or firm_id = auth.uid());
create policy "Users insert events" on public.calendar_events for insert with check (created_by = auth.uid() or created_by is null);
create policy "Users update own events" on public.calendar_events for update using (created_by = auth.uid() or firm_id = auth.uid());
create policy "Users delete own events" on public.calendar_events for delete using (created_by = auth.uid() or firm_id = auth.uid());

-- BRANCHES
create policy "Users can view own firm branches" on public.branches for select using (
  firm_id = (select firm_id from public.profiles where id = auth.uid()) or firm_id = auth.uid());
create policy "Firm owners can manage branches" on public.branches for all using (
  firm_id = auth.uid() or firm_id = (select firm_id from public.profiles where id = auth.uid()));
create policy "Users can view own firm employee branches" on public.employee_branches for select using (
  employee_id in (select id from public.profiles where firm_id = (select firm_id from public.profiles where id = auth.uid())
    union select id from public.profiles where firm_id = auth.uid()));
create policy "Firm owners can manage employee branches" on public.employee_branches for all using (
  employee_id in (select id from public.profiles where firm_id = (select firm_id from public.profiles where id = auth.uid())
    union select id from public.profiles where firm_id = auth.uid()));

-- BLOG
alter table public.blog_posts disable row level security;

-- AI_USAGE
create policy "Users can view own AI usage" on public.ai_usage for select using (auth.uid() = user_id);
create policy "Service role can insert AI usage" on public.ai_usage for insert with check (auth.role() = 'service_role');

-- FIRM_ADDONS
create policy "Firm owners can manage addons" on public.firm_addons for all using (auth.uid() = firm_id);

-- INVOICE_COUNTERS
create policy "invoice_counters_firm_access" on public.invoice_counters for all using (
  exists (select 1 from public.super_admins where id = auth.uid()) or firm_id = public.get_my_firm_id());

-- INVOICE_TEMPLATES
create policy "invoice_templates_firm_access" on public.invoice_templates
  for all using (firm_id = public.get_my_firm_id());

-- INTAKE_FORMS
create policy "Users manage own intake forms" on public.intake_forms for all using (user_id = auth.uid());
create policy "Users manage own intake submissions" on public.intake_submissions for all using (
  form_id in (select id from public.intake_forms where user_id = auth.uid()));

-- CONSULTATIONS
create policy "Lawyers manage own slots" on public.consultation_slots for all using (user_id = auth.uid());
create policy "Users manage consultations" on public.consultations for all using (
  lawyer_id = auth.uid() or client_id in (select id from public.clients where created_by = auth.uid()));

-- COLLECTION_LOGS
create policy "collection_logs_firm_isolation" on public.collection_logs
  for all using (user_id = auth.uid() or firm_id = public.get_my_firm_id());

-- DEADLINE_REMINDERS
create policy "Users manage own deadline reminders" on public.deadline_reminders for all using (user_id = auth.uid());

-- COURT_INTEGRATION
create policy "court_case_links_firm_isolation" on public.court_case_links for all using (
  exists (select 1 from public.cases where cases.id = court_case_links.case_id
    and cases.firm_id = public.get_my_firm_id()
    and (public.is_firm_privileged(auth.uid()) or cases.created_by = auth.uid() or cases.assigned_to = auth.uid())));
create policy "court_orders_firm_isolation" on public.court_orders for all using (
  exists (select 1 from public.cases where cases.id = court_orders.case_id
    and cases.firm_id = public.get_my_firm_id()
    and (public.is_firm_privileged(auth.uid()) or cases.created_by = auth.uid() or cases.assigned_to = auth.uid())));
create policy "court_cause_lists_auth" on public.court_cause_lists for all using (auth.role() = 'authenticated');

-- RATE_LIMITS
create policy "Service role only" on public.rate_limits for all using (auth.role() = 'service_role');

-- NOTIFICATION_LOGS
create policy "notification_logs_select" on public.notification_logs for select using (user_id = auth.uid());
create policy "notification_logs_insert" on public.notification_logs for insert with check (user_id = auth.uid());

-- REFERRALS (no RLS specified in migration - using basic access)

-- ANALYTICS
create policy "Service role full access" on public.analytics_events for all using (true) with check (true);

-- =============================================
-- SEED DATA
-- =============================================

-- Subscription plans
insert into public.subscription_plans (name, slug, description, price, billing_period, features, max_cases, max_users, max_storage_mb, max_branches) values
('Free', 'free', 'Basic plan for individual lawyers', 0, 'monthly',
  '["3 active cases", "Basic dashboard", "Email support"]'::jsonb, 3, 1, 200, 0),
('Solo', 'solo', 'For solo practitioners', 499, 'monthly',
  '["20 active cases", "Notifications", "Document storage", "Email support"]'::jsonb, 20, 1, 1024, 0),
('Professional', 'professional', 'For practicing advocates', 999, 'monthly',
  '["Unlimited cases", "Full dashboard", "Document storage", "Calendar sync", "WhatsApp notifications", "Priority support"]'::jsonb, -1, 1, 3072, 3),
('Firm', 'firm', 'For small law firms', 2999, 'monthly',
  '["Everything in Professional", "Up to 10 users", "Client portal", "Team collaboration", "Billing management", "Phone support"]'::jsonb, -1, 10, 7168, 10),
('Enterprise', 'enterprise', 'For large firms and organizations', 4999, 'monthly',
  '["Unlimited everything", "Custom integrations", "Dedicated support", "SLA guarantee", "White label option", "API access"]'::jsonb, -1, 50, 20480, -1)
on conflict (slug) do nothing;

-- Platform settings
insert into public.platform_settings (key, value, description) values
('app_name', '"LawApp"', 'Application name'),
('maintenance_mode', 'false', 'Enable maintenance mode'),
('allow_signups', 'true', 'Allow new user registrations'),
('default_trial_days', '14', 'Default trial period in days'),
('max_upload_size_mb', '50', 'Maximum file upload size in MB'),
('support_email', '"support@lawapp.in"', 'Support contact email')
on conflict (key) do nothing;

-- Default tags
insert into public.tags (name, color) values
('Urgent', '#ef4444'),
('Pro Bono', '#10b981'),
('Corporate', '#3b82f6'),
('Criminal', '#8b5cf6'),
('Family', '#f59e0b'),
('Property', '#06b6d4')
on conflict (name) do nothing;

-- Permissions
insert into public.permissions (code, description, category) values
('firm.manage', 'Manage firm settings', 'Firm'),
('firm.view_settings', 'View firm settings', 'Firm'),
('team.invite', 'Invite team members', 'Team'),
('team.remove', 'Remove team members', 'Team'),
('team.view', 'View team members', 'Team'),
('team.change_roles', 'Change team member roles', 'Team'),
('cases.view_all', 'View all cases', 'Cases'),
('cases.view_assigned', 'View assigned cases', 'Cases'),
('cases.create', 'Create cases', 'Cases'),
('cases.edit', 'Edit cases', 'Cases'),
('cases.delete', 'Delete cases', 'Cases'),
('cases.assign', 'Assign cases to team members', 'Cases'),
('clients.view_all', 'View all clients', 'Clients'),
('clients.view_assigned', 'View assigned clients', 'Clients'),
('clients.create', 'Create clients', 'Clients'),
('clients.edit', 'Edit clients', 'Clients'),
('clients.delete', 'Delete clients', 'Clients'),
('documents.view_all', 'View all documents', 'Documents'),
('documents.view_assigned', 'View assigned documents', 'Documents'),
('documents.create', 'Create documents', 'Documents'),
('documents.edit', 'Edit documents', 'Documents'),
('documents.delete', 'Delete documents', 'Documents'),
('invoices.view_all', 'View all invoices', 'Billing'),
('invoices.view_own', 'View own invoices', 'Billing'),
('invoices.create', 'Create invoices', 'Billing'),
('invoices.edit', 'Edit invoices', 'Billing'),
('invoices.delete', 'Delete invoices', 'Billing'),
('reports.view_all', 'View all reports', 'Reports'),
('reports.view_own', 'View own reports', 'Reports'),
('audit_logs.view', 'View audit logs', 'Reports'),
('hearings.view_all', 'View all hearings', 'Calendar'),
('hearings.view_assigned', 'View assigned hearings', 'Calendar'),
('hearings.manage', 'Manage hearings', 'Calendar')
on conflict (code) do nothing;

-- Role permissions: Owner gets all
insert into public.role_permissions (role_id, permission_code)
select 'owner', code from public.permissions on conflict do nothing;

-- Partner
insert into public.role_permissions (role_id, permission_code)
select 'partner', code from public.permissions where code in (
  'firm.view_settings','team.invite','team.remove','team.view',
  'cases.view_all','cases.view_assigned','cases.create','cases.edit','cases.delete','cases.assign',
  'clients.view_all','clients.view_assigned','clients.create','clients.edit','clients.delete',
  'documents.view_all','documents.view_assigned','documents.create','documents.edit','documents.delete',
  'invoices.view_all','invoices.view_own','invoices.create','invoices.edit',
  'reports.view_all','reports.view_own','audit_logs.view',
  'hearings.view_all','hearings.view_assigned','hearings.manage'
) on conflict do nothing;

-- Senior Associate
insert into public.role_permissions (role_id, permission_code)
select 'senior_associate', code from public.permissions where code in (
  'firm.view_settings','team.view',
  'cases.view_all','cases.view_assigned','cases.create','cases.edit','cases.assign',
  'clients.view_all','clients.view_assigned','clients.create','clients.edit',
  'documents.view_all','documents.view_assigned','documents.create','documents.edit','documents.delete',
  'invoices.view_all','invoices.view_own','invoices.create',
  'reports.view_all','reports.view_own',
  'hearings.view_all','hearings.view_assigned','hearings.manage'
) on conflict do nothing;

-- Associate
insert into public.role_permissions (role_id, permission_code)
select 'associate', code from public.permissions where code in (
  'team.view','cases.view_assigned','cases.create','cases.edit',
  'clients.view_assigned','clients.create','clients.edit',
  'documents.view_assigned','documents.create','documents.edit',
  'invoices.view_own','reports.view_own',
  'hearings.view_assigned','hearings.manage'
) on conflict do nothing;

-- Junior Associate
insert into public.role_permissions (role_id, permission_code)
select 'junior_associate', code from public.permissions where code in (
  'team.view','cases.view_assigned','clients.view_assigned',
  'documents.view_assigned','documents.create','documents.edit','hearings.view_assigned'
) on conflict do nothing;

-- Paralegal
insert into public.role_permissions (role_id, permission_code)
select 'paralegal', code from public.permissions where code in (
  'team.view','cases.view_assigned','clients.view_assigned',
  'documents.view_assigned','documents.create','documents.edit','hearings.view_assigned'
) on conflict do nothing;

-- Intern
insert into public.role_permissions (role_id, permission_code)
select 'intern', code from public.permissions where code in (
  'team.view','cases.view_assigned','clients.view_assigned',
  'documents.view_assigned','hearings.view_assigned'
) on conflict do nothing;

-- Office Admin
insert into public.role_permissions (role_id, permission_code)
select 'office_admin', code from public.permissions where code in (
  'firm.view_settings','team.view',
  'invoices.view_all','invoices.view_own','invoices.create','invoices.edit',
  'reports.view_all','reports.view_own'
) on conflict do nothing;

-- Sample coupons
insert into public.coupon_codes (code, plan_id, discount_type, discount_value, max_uses, valid_until, description, is_active)
select 'WELCOME20', id, 'percent', 20, 100, now() + interval '6 months', '20% off Professional plan', true
from public.subscription_plans where slug = 'professional' limit 1
on conflict (code) do nothing;

insert into public.coupon_codes (code, discount_type, discount_value, max_uses, valid_until, description, is_active)
select 'FLAT500', 'fixed', 500, 50, now() + interval '3 months', '500 off any plan', true
where not exists (select 1 from public.coupon_codes where code = 'FLAT500')
on conflict (code) do nothing;

-- Default cron jobs
insert into public.cron_jobs (name, slug, description, endpoint, schedule_cron, actions) values
('Trial Funnel', 'trial-funnel', 'Sends trial reminder emails', '/api/subscriptions/trial-funnel', '0 9 * * *', '{"email":true,"whatsapp":true,"in_app":false,"database":true}'::jsonb),
('Hearing Reminders', 'hearing-reminders', 'Sends hearing reminders', '/api/reminders/cron', '0 18 * * *', '{"email":false,"whatsapp":true,"in_app":false,"database":true}'::jsonb),
('Expire Trials', 'expire-trials', 'Marks expired trials', '/api/subscriptions/expire-trials', '0 8 * * *', '{"email":false,"whatsapp":false,"in_app":false,"database":true}'::jsonb),
('Daily Digest', 'daily-digest', 'Sends daily digest email', '/api/daily-digest', '30 2 * * *', '{"email":true,"whatsapp":false,"in_app":false,"database":false}'::jsonb),
('Invoice Reminders', 'invoice-reminders', 'Sends payment reminders', '/api/invoices/reminders', '0 10 * * *', '{"email":true,"whatsapp":false,"in_app":false,"database":true}'::jsonb),
('Deadline Check', 'deadline-check', 'Checks limitation dates', '/api/deadlines/check', '0 7 * * *', '{"email":true,"whatsapp":true,"in_app":false,"database":true}'::jsonb),
('Cause List Sync', 'cause-list-sync', 'Syncs cause list entries', '/api/cause-list/sync', '0 5 * * *', '{"email":false,"whatsapp":false,"in_app":false,"database":true}'::jsonb),
('Case Alerts Check', 'case-alerts', 'Checks eCourts for changes', '/api/case-alerts/check', '0 11 * * *', '{"email":true,"whatsapp":true,"in_app":true,"database":true}'::jsonb)
on conflict (slug) do nothing;

-- =============================================
-- DONE! Complete schema compiled from all files.
-- =============================================
