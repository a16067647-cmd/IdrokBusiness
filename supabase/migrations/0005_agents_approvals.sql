-- Idrok Business: AI agent runs and the Approval Center.
-- Run once after 0004. All tables use Row Level Security.

-- ---------------------------------------------------------------
-- AI agent runs (history + daily limit). Written by the server route
-- with the user's own token, so RLS applies to it too.
-- ---------------------------------------------------------------
create table if not exists public.agent_runs (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  agent text not null check (agent in ('discovery', 'market', 'supplier', 'risk', 'manager')),
  lang text not null default 'uz' check (lang in ('uz', 'ru')),
  input jsonb not null default '{}',
  output jsonb,
  created_at timestamptz not null default now()
);
create index if not exists agent_runs_user_idx on public.agent_runs (user_id, created_at desc);
alter table public.agent_runs enable row level security;

drop policy if exists "agent_runs: read own" on public.agent_runs;
create policy "agent_runs: read own" on public.agent_runs for select using (auth.uid() = user_id or public.is_admin());
drop policy if exists "agent_runs: insert own" on public.agent_runs;
create policy "agent_runs: insert own" on public.agent_runs for insert with check (auth.uid() = user_id);

-- ---------------------------------------------------------------
-- Approvals: a purchase decision recorded before anyone spends money.
-- Idrok never buys anything; this is the record that a person (with a
-- parent or guardian) approved a specific, bounded action.
-- ---------------------------------------------------------------
create table if not exists public.approvals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  action text not null check (action in ('sample', 'order')),
  supplier text not null check (char_length(supplier) between 1 and 120),
  quantity int not null check (quantity > 0),
  max_spend numeric not null check (max_spend > 0),
  currency text not null check (currency in ('USD', 'UZS')),
  shipping text not null default '' check (char_length(shipping) <= 500),
  risks text not null default '' check (char_length(risks) <= 1000),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'expired')),
  guardian_name text check (char_length(guardian_name) <= 80),
  decision_note text check (char_length(decision_note) <= 500),
  expires_at timestamptz not null,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists approvals_user_idx on public.approvals (user_id, created_at desc);
alter table public.approvals enable row level security;

drop policy if exists "approvals: own rows" on public.approvals;
create policy "approvals: own rows" on public.approvals for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "approvals: admin read" on public.approvals;
create policy "approvals: admin read" on public.approvals for select using (public.is_admin());

-- Spending must stay within the owner's level rules (same rules as products).
create or replace function public.enforce_approval_rules()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  lvl int;
  r jsonb;
  max_budget numeric;
begin
  select level into lvl from public.profiles where id = new.user_id;
  select rules into r from public.level_rules where level = coalesce(lvl, 0);
  if r is null then return new; end if;
  max_budget := (r ->> case when new.currency = 'USD' then 'maxOrderBudgetUsd' else 'maxOrderBudgetUzs' end)::numeric;
  if max_budget is not null and new.max_spend > max_budget then
    raise exception 'LEVEL_RULE: orderBudget' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists approvals_level_rules on public.approvals;
create trigger approvals_level_rules before insert or update of max_spend, currency on public.approvals
  for each row execute function public.enforce_approval_rules();

-- If any detail of the product changes, earlier approvals are no longer valid.
create or replace function public.expire_approvals_on_product_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (new.name, new.marketplace, new.sale_price, new.unit_cost, new.shipping_per_unit, new.fee_pct,
      new.fulfillment_fee, new.other_per_unit, new.ad_per_unit, new.quantity, new.weight_kg, new.longest_cm, new.restricted)
     is distinct from
     (old.name, old.marketplace, old.sale_price, old.unit_cost, old.shipping_per_unit, old.fee_pct,
      old.fulfillment_fee, old.other_per_unit, old.ad_per_unit, old.quantity, old.weight_kg, old.longest_cm, old.restricted) then
    update public.approvals set status = 'expired', decided_at = coalesce(decided_at, now())
      where product_id = new.id and status in ('pending', 'approved');
  end if;
  return new;
end;
$$;

drop trigger if exists products_expire_approvals on public.products;
create trigger products_expire_approvals after update on public.products
  for each row execute function public.expire_approvals_on_product_change();

notify pgrst, 'reload schema';
