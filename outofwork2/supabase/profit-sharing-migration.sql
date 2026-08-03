-- =============================================
-- PROFIT SHARING TABLE
-- Stores profit share percentages per role per firm
-- =============================================
create table if not exists public.firm_profit_sharing (
  id uuid default uuid_generate_v4() primary key,
  firm_id uuid not null,
  role text not null,
  profit_percentage numeric(5,2) default 0 check (profit_percentage >= 0 and profit_percentage <= 100),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(firm_id, role)
);

-- RLS
alter table public.firm_profit_sharing enable row level security;

-- Only firm owners can manage profit sharing
create policy "Firm owners can manage profit sharing"
  on public.firm_profit_sharing
  for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role = 'owner'
        and firm_id = firm_profit_sharing.firm_id
    )
  );

-- Index
create index if not exists idx_firm_profit_sharing_firm on public.firm_profit_sharing(firm_id);

-- =============================================
-- Function to get profit share for a role in a firm
-- =============================================
create or replace function get_profit_share(p_firm_id uuid, p_role text)
returns numeric
language sql
security definer
stable
as $$
  select coalesce(
    (select profit_percentage from public.firm_profit_sharing where firm_id = p_firm_id and role = p_role),
    0
  );
$$;

-- =============================================
-- Function to get all profit shares for a firm
-- =============================================
create or replace function get_firm_profit_shares(p_firm_id uuid)
returns table(role text, profit_percentage numeric)
language sql
security definer
stable
as $$
  select fps.role, fps.profit_percentage
  from public.firm_profit_sharing fps
  where fps.firm_id = p_firm_id
  order by fps.profit_percentage desc;
$$;
