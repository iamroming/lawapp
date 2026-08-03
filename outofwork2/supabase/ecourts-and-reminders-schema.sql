-- =============================================
-- ECOURTS INTEGRATION TABLES
-- =============================================

-- Track CNR numbers linked to cases
create table public.ecourts_cases (
  id uuid default uuid_generate_v4() primary key,
  case_id uuid references public.cases(id) on delete cascade,
  cnr_number text not null,
  court_name text not null,
  court_type text not null check (court_type in ('district', 'high_court', 'supreme', 'tribunal')),
  state text,
  district text,
  last_synced_at timestamptz,
  last_status text,
  last_hearing_date date,
  next_hearing_date date,
  case_stage text,
  judge_name text,
  listing_bench text,
  is_active boolean default true,
  sync_errors jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Store synced cause list entries
create table public.cause_list_entries (
  id uuid default uuid_generate_v4() primary key,
  ecourts_case_id uuid references public.ecourts_cases(id) on delete cascade,
  case_id uuid references public.cases(id) on delete set null,
  listing_date date not null,
  item_number text,
  court_hall text,
  bench text,
  judge_name text,
  listing_purpose text,
  status text check (status in ('listed', 'argued', 'adjourned', 'disposed', 'not_reached', 'withdrawn')),
  raw_data jsonb,
  created_at timestamptz default now()
);

-- Store synced orders/judgments
create table public.ecourts_orders (
  id uuid default uuid_generate_v4() primary key,
  ecourts_case_id uuid references public.ecourts_cases(id) on delete cascade,
  case_id uuid references public.cases(id) on delete set null,
  order_date date not null,
  order_type text check (order_type in ('order', 'judgment', 'directions', 'interim')),
  title text,
  summary text,
  pdf_url text,
  raw_data jsonb,
  synced_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Sync log for monitoring
create table public.ecourts_sync_log (
  id uuid default uuid_generate_v4() primary key,
  ecourts_case_id uuid references public.ecourts_cases(id) on delete cascade,
  sync_type text not null check (sync_type in ('status', 'cause_list', 'orders')),
  status text not null check (status in ('success', 'error', 'partial')),
  error_message text,
  data_before jsonb,
  data_after jsonb,
  created_at timestamptz default now()
);

-- =============================================
-- REMINDER & NOTIFICATION TABLES
-- =============================================

-- WhatsApp message logs
create table public.whatsapp_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  case_id uuid references public.cases(id) on delete set null,
  phone_number text not null,
  message_type text not null check (message_type in ('hearing_reminder', 'case_update', 'payment_reminder', 'document_share', 'custom')),
  message_content text not null,
  status text not null default 'pending' check (status in ('pending', 'sent', 'delivered', 'failed')),
  error_message text,
  twilio_sid text,
  sent_at timestamptz,
  created_at timestamptz default now()
);

-- Scheduled reminders with multi-channel support
create table public.scheduled_reminders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  case_id uuid references public.cases(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  title text not null,
  message text not null,
  reminder_date timestamptz not null,
  channels text[] default '{in_app}' check (channels <@ '{in_app,email,sms,whatsapp}'),
  status text default 'pending' check (status in ('pending', 'sent', 'failed', 'cancelled')),
  sent_channels text[] default '{}',
  failed_channels text[] default '{}',
  retry_count int default 0,
  max_retries int default 3,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =============================================
-- ENHANCED BILLING TABLES
-- =============================================

-- Trust/retainer account tracking
create table public.trust_accounts (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references public.clients(id) on delete cascade,
  case_id uuid references public.cases(id) on delete set null,
  balance numeric(12, 2) default 0,
  total_deposited numeric(12, 2) default 0,
  total_withdrawn numeric(12, 2) default 0,
  status text default 'active' check (status in ('active', 'frozen', 'closed')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Trust account transactions
create table public.trust_transactions (
  id uuid default uuid_generate_v4() primary key,
  trust_account_id uuid references public.trust_accounts(id) on delete cascade,
  type text not null check (type in ('deposit', 'withdrawal', 'transfer')),
  amount numeric(12, 2) not null,
  description text,
  invoice_id uuid references public.invoices(id) on delete set null,
  reference_number text,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

-- TDS tracking
create table public.tds_records (
  id uuid default uuid_generate_v4() primary key,
  invoice_id uuid references public.invoices(id) on delete cascade,
  client_id uuid references public.clients(id) on delete cascade,
  tds_rate numeric(5, 2) not null default 10.00,
  tds_amount numeric(12, 2) not null,
  pan_number text,
  quarter text,
  financial_year text,
  form_20_26q_url text,
  status text default 'pending' check (status in ('pending', 'filed', 'received')),
  created_at timestamptz default now()
);

-- =============================================
-- INDEXES FOR NEW TABLES
-- =============================================
create index idx_ecourts_cases_case_id on public.ecourts_cases(case_id);
create index idx_ecourts_cases_cnr on public.ecourts_cases(cnr_number);
create index idx_ecourts_cases_court on public.ecourts_cases(court_name);
create index idx_cause_list_entries_date on public.cause_list_entries(listing_date);
create index idx_cause_list_entries_case on public.cause_list_entries(case_id);
create index idx_ecourts_orders_case on public.ecourts_orders(ecourts_case_id);
create index idx_ecourts_sync_log_case on public.ecourts_sync_log(ecourts_case_id);
create index idx_whatsapp_logs_user on public.whatsapp_logs(user_id);
create index idx_whatsapp_logs_status on public.whatsapp_logs(status);
create index idx_scheduled_reminders_date on public.scheduled_reminders(reminder_date);
create index idx_scheduled_reminders_user on public.scheduled_reminders(user_id);
create index idx_scheduled_reminders_status on public.scheduled_reminders(status);
create index idx_trust_accounts_client on public.trust_accounts(client_id);
create index idx_trust_transactions_account on public.trust_transactions(trust_account_id);
create index idx_tds_records_invoice on public.tds_records(invoice_id);

-- =============================================
-- ROW LEVEL SECURITY FOR NEW TABLES
-- =============================================
alter table public.ecourts_cases enable row level security;
alter table public.cause_list_entries enable row level security;
alter table public.ecourts_orders enable row level security;
alter table public.ecourts_sync_log enable row level security;
alter table public.whatsapp_logs enable row level security;
alter table public.scheduled_reminders enable row level security;
alter table public.trust_accounts enable row level security;
alter table public.trust_transactions enable row level security;
alter table public.tds_records enable row level security;

-- ECOURTS CASES: linked to case ownership
create policy "Users can manage ecourts cases for their cases" on public.ecourts_cases
  for all using (
    exists (
      select 1 from public.cases
      where cases.id = ecourts_cases.case_id
      and (cases.created_by = auth.uid() or cases.assigned_to = auth.uid())
    )
  );

-- CAUSE LIST ENTRIES: readable if case is accessible
create policy "Users can view cause list entries for their cases" on public.cause_list_entries
  for all using (
    exists (
      select 1 from public.cases
      where cases.id = cause_list_entries.case_id
      and (cases.created_by = auth.uid() or cases.assigned_to = auth.uid())
    )
  );

-- ECOURTS ORDERS: readable if case is accessible
create policy "Users can view ecourts orders for their cases" on public.ecourts_orders
  for all using (
    exists (
      select 1 from public.cases
      where cases.id = ecourts_orders.case_id
      and (cases.created_by = auth.uid() or cases.assigned_to = auth.uid())
    )
  );

-- SYNC LOG: system only
create policy "System can manage sync logs" on public.ecourts_sync_log
  for all using (auth.role() = 'service_role');

-- WHATSAPP LOGS: users can view their own
create policy "Users can view own whatsapp logs" on public.whatsapp_logs
  for select using (auth.uid() = user_id);

create policy "System can insert whatsapp logs" on public.whatsapp_logs
  for insert with check (true);

-- SCHEDULED REMINDERS: users can manage their own
create policy "Users can manage own scheduled reminders" on public.scheduled_reminders
  for all using (auth.uid() = user_id);

-- TRUST ACCOUNTS: linked to case ownership
create policy "Users can manage trust accounts for their cases" on public.trust_accounts
  for all using (
    exists (
      select 1 from public.cases
      where cases.id = trust_accounts.case_id
      and cases.created_by = auth.uid()
    )
  );

-- TRUST TRANSACTIONS: linked to trust account
create policy "Users can manage trust transactions for their accounts" on public.trust_transactions
  for all using (
    exists (
      select 1 from public.trust_accounts
      where trust_accounts.id = trust_transactions.trust_account_id
      and exists (
        select 1 from public.cases
        where cases.id = trust_accounts.case_id
        and cases.created_by = auth.uid()
      )
    )
  );

-- TDS RECORDS: linked to case ownership
create policy "Users can manage tds records for their cases" on public.tds_records
  for all using (
    exists (
      select 1 from public.invoices
      where invoices.id = tds_records.invoice_id
      and invoices.issued_by = auth.uid()
    )
  );

-- =============================================
-- AUTO-REMINDER GENERATION FUNCTION
-- =============================================
create or replace function generate_hearing_reminders()
returns trigger as $$
begin
  -- Create reminders at 7 days, 3 days, 1 day before hearing
  insert into public.scheduled_reminders (user_id, case_id, client_id, title, message, reminder_date, channels)
  select
    c.assigned_to,
    c.id,
    c.client_id,
    'Hearing in 7 days: ' || c.title,
    'Your case ' || c.case_number || ' has a hearing on ' || to_char(NEW.hearing_date, 'DD Mon YYYY HH:MI AM') || ' at ' || coalesce(NEW.court, 'Court') || '. Please prepare.',
    NEW.hearing_date - interval '7 days',
    '{in_app,email}'
  from public.cases c
  where c.id = NEW.case_id and c.assigned_to is not null
    and NEW.hearing_date > now() + interval '7 days';

  insert into public.scheduled_reminders (user_id, case_id, client_id, title, message, reminder_date, channels)
  select
    c.assigned_to,
    c.id,
    c.client_id,
    'Hearing in 3 days: ' || c.title,
    'URGENT: Your case ' || c.case_number || ' has a hearing on ' || to_char(NEW.hearing_date, 'DD Mon YYYY HH:MI AM') || '. Please ensure all documents are ready.',
    NEW.hearing_date - interval '3 days',
    '{in_app,email,sms}'
  from public.cases c
  where c.id = NEW.case_id and c.assigned_to is not null
    and NEW.hearing_date > now() + interval '3 days';

  insert into public.scheduled_reminders (user_id, case_id, client_id, title, message, reminder_date, channels)
  select
    c.assigned_to,
    c.id,
    c.client_id,
    'Hearing TOMORROW: ' || c.title,
    'REMINDER: Your case ' || c.case_number || ' has a hearing TOMORROW at ' || to_char(NEW.hearing_date, 'HH:MI AM') || ' at ' || coalesce(NEW.court, 'Court') || '. Do not miss this hearing.',
    NEW.hearing_date - interval '1 day',
    '{in_app,email,sms,whatsapp}'
  from public.cases c
  where c.id = NEW.case_id and c.assigned_to is not null
    and NEW.hearing_date > now() + interval '1 day';

  return NEW;
end;
$$ language plpgsql security definer;

-- Trigger for auto-reminders on hearing creation
drop trigger if exists on_hearing_created on public.hearings;
create trigger on_hearing_created
  after insert on public.hearings
  for each row execute function generate_hearing_reminders();
