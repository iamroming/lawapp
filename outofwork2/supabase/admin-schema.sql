-- =============================================
-- ADMIN MODULE - Subscriptions, Plans & Activity Logs
-- Run this AFTER the main schema.sql
-- =============================================

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
-- SEED DEFAULT PLANS
-- =============================================
insert into public.subscription_plans (name, slug, description, price, billing_period, features, max_cases, max_users, max_storage_mb) values
('Free', 'free', 'Basic plan for individual lawyers', 0, 'monthly',
  '["5 active cases", "Basic dashboard", "Email support"]'::jsonb,
  5, 1, 100),
('Professional', 'professional', 'For practicing advocates', 999, 'monthly',
  '["Unlimited cases", "Full dashboard", "Document storage", "Calendar sync", "Priority support"]'::jsonb,
  -1, 1, 1024),
('Firm', 'firm', 'For small law firms', 2999, 'monthly',
  '["Everything in Professional", "Up to 5 users", "Team collaboration", "Billing management", "Phone support"]'::jsonb,
  -1, 5, 5120),
('Enterprise', 'enterprise', 'For large firms and organizations', 9999, 'monthly',
  '["Unlimited everything", "Custom integrations", "Dedicated support", "SLA guarantee", "On-premise option"]'::jsonb,
  -1, -1, -1);

-- =============================================
-- INDEXES
-- =============================================
create index idx_user_subscriptions_user_id on public.user_subscriptions(user_id);
create index idx_user_subscriptions_status on public.user_subscriptions(status);
create index idx_activity_logs_user_id on public.activity_logs(user_id);
create index idx_activity_logs_action on public.activity_logs(action);
create index idx_activity_logs_created_at on public.activity_logs(created_at);
create index idx_activity_logs_entity on public.activity_logs(entity_type, entity_id);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
alter table public.subscription_plans enable row level security;
alter table public.user_subscriptions enable row level security;
alter table public.activity_logs enable row level security;

-- Plans: anyone authenticated can read
create policy "Authenticated users can view plans" on public.subscription_plans
  for select using (auth.role() = 'authenticated');

-- Admins can manage plans
create policy "Admins can manage plans" on public.subscription_plans
  for all using (public.is_admin(auth.uid()));

-- Subscriptions: users can view their own, admins can view all
create policy "Users can view own subscriptions" on public.user_subscriptions
  for select using (auth.uid() = user_id);

create policy "Admins can view all subscriptions" on public.user_subscriptions
  for select using (public.is_admin(auth.uid()));

create policy "Admins can manage subscriptions" on public.user_subscriptions
  for all using (public.is_admin(auth.uid()));

-- Activity logs: admins only
create policy "Admins can view all activity logs" on public.activity_logs
  for select using (public.is_admin(auth.uid()));

create policy "Authenticated users can insert activity logs" on public.activity_logs
  for insert with check (auth.role() = 'authenticated');

-- =============================================
-- TRIGGERS
-- =============================================
create trigger update_subscription_plans_updated_at
  before update on public.subscription_plans
  for each row execute function update_updated_at();

create trigger update_user_subscriptions_updated_at
  before update on public.user_subscriptions
  for each row execute function update_updated_at();

-- =============================================
-- FUNCTION: Log user activity
-- =============================================
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
