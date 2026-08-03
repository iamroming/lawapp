-- =============================================
-- TIMESHEET / TIME TRACKING
-- =============================================

create table public.timesheets (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  case_id uuid references public.cases(id) on delete set null,
  firm_id uuid,
  description text,
  hours numeric(6, 2) not null check (hours > 0),
  billable_rate numeric(10, 2) default 0,
  is_billable boolean default true,
  is_billed boolean default false,
  invoice_id uuid references public.invoices(id) on delete set null,
  worked_date date not null default current_date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_timesheets_user on public.timesheets(user_id);
create index idx_timesheets_case on public.timesheets(case_id);
create index idx_timesheets_firm on public.timesheets(firm_id);
create index idx_timesheets_date on public.timesheets(worked_date);

alter table public.timesheets enable row level security;

create policy "Users can manage timesheets for their firm" on public.timesheets
  for all using (
    user_id = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
      and p.firm_id = timesheets.firm_id
      and p.role in ('owner', 'partner')
    )
  );

create or replace function update_timesheets_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger timesheets_updated_at
  before update on public.timesheets
  for each row execute function update_timesheets_updated_at();

-- Active timers table
create table public.active_timers (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null unique,
  case_id uuid references public.cases(id) on delete set null,
  description text,
  started_at timestamptz not null default now(),
  created_at timestamptz default now()
);

alter table public.active_timers enable row level security;

create policy "Users can manage their own timer" on public.active_timers
  for all using (user_id = auth.uid());
