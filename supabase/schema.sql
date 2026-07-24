create table leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  budget_range text not null,
  message text not null,
  status text not null default 'New' check (status in ('New', 'Contacted', 'Closed')),
  created_at timestamptz not null default now()
);

alter table leads enable row level security;

create policy "Public can insert leads"
  on leads for insert
  to anon
  with check (true);

create policy "Authenticated users can read leads"
  on leads for select
  to authenticated
  using (true);

create policy "Authenticated users can update leads"
  on leads for update
  to authenticated
  using (true);