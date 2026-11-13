-- Idrok Business: real expenses log for the Finance page. Run once after 0005.
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  spent_on date not null default current_date,
  category text not null check (category in ('samples', 'inventory', 'shipping', 'fees', 'ads', 'tools', 'other')),
  amount numeric not null check (amount > 0 and amount < 1000000000),
  currency text not null check (currency in ('USD', 'UZS')),
  product_id uuid references public.products (id) on delete set null,
  note text not null default '' check (char_length(note) <= 300),
  created_at timestamptz not null default now()
);
create index if not exists expenses_user_idx on public.expenses (user_id, spent_on desc);
alter table public.expenses enable row level security;

drop policy if exists "expenses: own rows" on public.expenses;
create policy "expenses: own rows" on public.expenses for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "expenses: admin read" on public.expenses;
create policy "expenses: admin read" on public.expenses for select using (public.is_admin());

notify pgrst, 'reload schema';
