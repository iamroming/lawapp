-- LawApp Database Schema for Indian Lawyers & Law Firms
-- Run this in Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =============================================
-- PROFILES (extends auth.users)
-- =============================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  email text not null,
  phone text,
  role text not null default 'lawyer' check (role in ('admin', 'lawyer', 'paralegal', 'staff')),
  enrollment_number text, -- Bar Council enrollment number
  specialization text[],
  firm_name text,
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
  case_type text not null,
  court text,
  court_room text,
  judge_name text,
  opposing_party text,
  opposing_counsel text,
  client_id uuid references public.clients(id) on delete cascade,
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
create table public.documents (
  id uuid default uuid_generate_v4() primary key,
  case_id uuid references public.cases(id) on delete cascade,
  uploaded_by uuid references public.profiles(id),
  title text not null,
  description text,
  file_url text not null,
  file_name text not null,
  file_type text,
  file_size bigint,
  category text check (category in (
    'petition', 'affidavit', 'evidence', 'judgment',
    'agreement', 'correspondence', 'other'
  )),
  is_confidential boolean default false,
  created_at timestamptz default now()
);

-- =============================================
-- TIME ENTRIES (for billing)
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
  total_amount numeric(12, 2) not null,
  description text,
  status text not null default 'pending' check (status in ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
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
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =============================================
-- INDEXES
-- =============================================
create index idx_cases_client_id on public.cases(client_id);
create index idx_cases_assigned_to on public.cases(assigned_to);
create index idx_cases_status on public.cases(status);
create index idx_cases_next_hearing on public.cases(next_hearing_date);
create index idx_hearings_case_id on public.hearings(case_id);
create index idx_hearings_date on public.hearings(hearing_date);
create index idx_documents_case_id on public.documents(case_id);
create index idx_time_entries_case_id on public.time_entries(case_id);
create index idx_time_entries_lawyer_id on public.time_entries(lawyer_id);
create index idx_invoices_client_id on public.invoices(client_id);
create index idx_payments_client_id on public.payments(client_id);

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

-- Profiles: Users can read/update own, admins can read all
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Authenticated users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

create policy "Admins can view all profiles" on public.profiles
  for select using (public.is_admin(auth.uid()));

-- Clients: Users can CRUD their own clients
create policy "Users can view own clients" on public.clients
  for select using (auth.uid() = created_by or auth.uid() = user_id);

create policy "Users can insert own clients" on public.clients
  for insert with check (auth.uid() = created_by);

create policy "Users can update own clients" on public.clients
  for update using (auth.uid() = created_by or auth.uid() = user_id);

create policy "Users can delete own clients" on public.clients
  for delete using (auth.uid() = created_by);

-- Cases: Users can CRUD their own cases
create policy "Users can view own cases" on public.cases
  for select using (auth.uid() = created_by or auth.uid() = assigned_to);

create policy "Users can insert own cases" on public.cases
  for insert with check (auth.uid() = created_by);

create policy "Users can update own cases" on public.cases
  for update using (auth.uid() = created_by or auth.uid() = assigned_to);

create policy "Users can delete own cases" on public.cases
  for delete using (auth.uid() = created_by);

-- Hearings: Users can manage hearings on their own cases
create policy "Users can manage own case hearings" on public.hearings
  for all using (
    exists (
      select 1 from public.cases
      where cases.id = hearings.case_id
      and (cases.created_by = auth.uid() or cases.assigned_to = auth.uid())
    )
  );

-- Documents: Users can manage documents on their own cases
create policy "Users can manage own case documents" on public.documents
  for all using (
    auth.uid() = uploaded_by or
    exists (
      select 1 from public.cases
      where cases.id = documents.case_id
      and (cases.created_by = auth.uid() or cases.assigned_to = auth.uid())
    )
  );

-- Time Entries: Users can manage their own entries
create policy "Users can manage own time entries" on public.time_entries
  for all using (auth.uid() = lawyer_id);

-- Invoices: Users can manage invoices they created or for their cases
create policy "Users can manage own invoices" on public.invoices
  for all using (
    auth.uid() = issued_by or
    exists (
      select 1 from public.cases
      where cases.id = invoices.case_id
      and cases.created_by = auth.uid()
    )
  );

-- Payments: Users can manage payments they received
create policy "Users can manage own payments" on public.payments
  for all using (auth.uid() = received_by);

-- Notes: Users can manage notes on their own cases
create policy "Users can manage own case notes" on public.notes
  for all using (
    auth.uid() = author_id or
    exists (
      select 1 from public.cases
      where cases.id = notes.case_id
      and (cases.created_by = auth.uid() or cases.assigned_to = auth.uid())
    )
  );

-- =============================================
-- FUNCTIONS
-- =============================================

-- Auto-update updated_at timestamp
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute function update_updated_at();

create trigger update_clients_updated_at
  before update on public.clients
  for each row execute function update_updated_at();

create trigger update_cases_updated_at
  before update on public.cases
  for each row execute function update_updated_at();

create trigger update_hearings_updated_at
  before update on public.hearings
  for each row execute function update_updated_at();

create trigger update_invoices_updated_at
  before update on public.invoices
  for each row execute function update_updated_at();

create trigger update_notes_updated_at
  before update on public.notes
  for each row execute function update_updated_at();

-- Function to handle new user signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'User'),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'associate')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
