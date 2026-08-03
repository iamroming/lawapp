-- =============================================
-- CASE STATUS ALERTS
-- =============================================

-- Track which cases have alerts enabled and user preferences
create table public.case_alerts (
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

-- History of all status changes detected
create table public.case_alert_history (
  id uuid default uuid_generate_v4() primary key,
  case_alert_id uuid references public.case_alerts(id) on delete cascade not null,
  change_type text not null check (change_type in ('status', 'hearing_date', 'stage', 'judge', 'order')),
  old_value text,
  new_value text,
  change_summary text not null,
  notified boolean default false,
  notified_at timestamptz,
  created_at timestamptz default now()
);

-- Indexes
create index idx_case_alerts_user on public.case_alerts(user_id);
create index idx_case_alerts_case on public.case_alerts(case_id);
create index idx_case_alerts_active on public.case_alerts(is_active) where is_active = true;
create index idx_case_alert_history_alert on public.case_alert_history(case_alert_id);
create index idx_case_alert_history_created on public.case_alert_history(created_at);

-- RLS
alter table public.case_alerts enable row level security;
alter table public.case_alert_history enable row level security;

-- case_alerts: users can manage their own alerts
create policy "Users can manage their own case alerts" on public.case_alerts
  for all using (user_id = auth.uid());

-- case_alert_history: users can view history for their alerts
create policy "Users can view their alert history" on public.case_alert_history
  for select using (
    exists (
      select 1 from public.case_alerts
      where case_alerts.id = case_alert_history.case_alert_id
      and case_alerts.user_id = auth.uid()
    )
  );

-- Function to update updated_at on case_alerts
create or replace function update_case_alert_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger case_alerts_updated_at
  before update on public.case_alerts
  for each row execute function update_case_alert_updated_at();
