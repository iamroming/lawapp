-- =============================================
-- TASK MANAGEMENT
-- =============================================

create table public.tasks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  case_id uuid references public.cases(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  firm_id uuid,
  assigned_to uuid references public.profiles(id) on delete set null,
  title text not null,
  description text,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'review', 'done')),
  due_date date,
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_tasks_user on public.tasks(user_id);
create index idx_tasks_case on public.tasks(case_id);
create index idx_tasks_client on public.tasks(client_id);
create index idx_tasks_firm on public.tasks(firm_id);
create index idx_tasks_assigned on public.tasks(assigned_to);
create index idx_tasks_status on public.tasks(status);
create index idx_tasks_due on public.tasks(due_date);

alter table public.tasks enable row level security;

create policy "Users can manage tasks for their firm" on public.tasks
  for all using (
    user_id = auth.uid()
    or assigned_to = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
      and p.firm_id = tasks.firm_id
      and p.role in ('owner', 'partner')
    )
  );

create or replace function update_tasks_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  if new.status = 'done' and old.status != 'done' then
    new.completed_at = now();
  end if;
  return new;
end;
$$ language plpgsql;

create trigger tasks_updated_at
  before update on public.tasks
  for each row execute function update_tasks_updated_at();
