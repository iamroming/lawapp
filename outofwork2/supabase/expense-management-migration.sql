-- =============================================
-- EXPENSE MANAGEMENT
-- =============================================

create table public.expenses (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  case_id uuid references public.cases(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  firm_id uuid,
  title text not null,
  description text,
  amount numeric(12, 2) not null check (amount >= 0),
  category text not null default 'other' check (category in ('court_fees', 'travel', 'filing', 'notary', 'stamp_duty', 'postal', 'photocopy', 'other')),
  is_billable boolean default true,
  is_billed boolean default false,
  invoice_id uuid references public.invoices(id) on delete set null,
  receipt_url text,
  expense_date date not null default current_date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes
create index idx_expenses_user on public.expenses(user_id);
create index idx_expenses_case on public.expenses(case_id);
create index idx_expenses_client on public.expenses(client_id);
create index idx_expenses_firm on public.expenses(firm_id);
create index idx_expenses_billable on public.expenses(is_billable) where is_billable = true;
create index idx_expenses_date on public.expenses(expense_date);

-- RLS
alter table public.expenses enable row level security;

create policy "Users can manage expenses for their firm" on public.expenses
  for all using (
    user_id = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
      and p.firm_id = expenses.firm_id
      and p.role in ('owner', 'partner')
    )
  );

-- Updated at trigger
create or replace function update_expenses_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger expenses_updated_at
  before update on public.expenses
  for each row execute function update_expenses_updated_at();
