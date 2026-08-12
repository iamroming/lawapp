create table if not exists quotations (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references profiles(id) on delete cascade,
  quotation_number text not null,
  client_id uuid references clients(id) on delete set null,
  case_id uuid references cases(id) on delete set null,
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
  notes text,
  terms text,
  created_by uuid references auth.users(id),
  sent_at timestamptz,
  accepted_at timestamptz,
  rejected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_quotations_firm on quotations(firm_id);
create index if not exists idx_quotations_client on quotations(client_id);
create index if not exists idx_quotations_status on quotations(status);

alter table quotations enable row level security;

drop policy if exists "Firm members can view quotations" on quotations;
drop policy if exists "Firm members can insert quotations" on quotations;
drop policy if exists "Firm members can update quotations" on quotations;
drop policy if exists "Firm members can delete quotations" on quotations;

create policy "Firm members can view quotations"
  on quotations for select using (
    firm_id in (select firm_id from profiles where id = auth.uid())
  );

create policy "Firm members can insert quotations"
  on quotations for insert with check (
    firm_id in (select firm_id from profiles where id = auth.uid())
  );

create policy "Firm members can update quotations"
  on quotations for update using (
    firm_id in (select firm_id from profiles where id = auth.uid())
  );

create policy "Firm members can delete quotations"
  on quotations for delete using (
    firm_id in (select firm_id from profiles where id = auth.uid())
  );

-- Auto-generate quotation_number per firm
create or replace function generate_quotation_number()
returns trigger as $$
begin
  if new.quotation_number is null or new.quotation_number = '' then
    new.quotation_number := 'Q-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substring(md5(random()::text) from 1 for 4));
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_quotation_number on quotations;
create trigger trg_quotation_number
  before insert on quotations
  for each row execute function generate_quotation_number();
