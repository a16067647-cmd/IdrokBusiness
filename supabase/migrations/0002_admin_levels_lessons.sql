-- Idrok Business: admin role, fixed level rules, database lessons.
-- Run once after 0001_init.sql.

-- ---------------------------------------------------------------
-- Profiles: admin flag and admin-verified net profit
-- ---------------------------------------------------------------
alter table public.profiles add column if not exists is_admin boolean not null default false;
alter table public.profiles add column if not exists verified_profit_usd numeric not null default 0 check (verified_profit_usd >= 0);

-- Users still may only edit their own name (column grant from 0001).

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

drop policy if exists "profiles: admin read" on public.profiles;
create policy "profiles: admin read" on public.profiles for select using (public.is_admin());

drop policy if exists "audit: admin read" on public.audit_log;
create policy "audit: admin read" on public.audit_log for select using (public.is_admin());

drop policy if exists "products: admin read" on public.products;
create policy "products: admin read" on public.products for select using (public.is_admin());

-- ---------------------------------------------------------------
-- Level rules: set by admins, read by everyone signed in
-- ---------------------------------------------------------------
create table if not exists public.level_rules (
  level int primary key check (level >= 0),
  rules jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.level_rules enable row level security;

drop policy if exists "levels: read" on public.level_rules;
create policy "levels: read" on public.level_rules for select using (auth.role() = 'authenticated');
drop policy if exists "levels: admin write" on public.level_rules;
create policy "levels: admin write" on public.level_rules for all using (public.is_admin()) with check (public.is_admin());

insert into public.level_rules (level, rules) values
  (0, '{"maxUnitCostUsd":5,"maxOrderBudgetUsd":300,"maxUnitCostUzs":60000,"maxOrderBudgetUzs":3500000,"maxWeightKg":0.5,"maxLongestCm":30,"blocked":["batteries","food","cosmetics","supplements","medical"],"profitToNextUsd":100}'),
  -- Level 1 starts as a copy of level 0; the admin sets its real rules.
  (1, '{"maxUnitCostUsd":5,"maxOrderBudgetUsd":300,"maxUnitCostUzs":60000,"maxOrderBudgetUzs":3500000,"maxWeightKg":0.5,"maxLongestCm":30,"blocked":["batteries","food","cosmetics","supplements","medical"],"profitToNextUsd":100}')
on conflict (level) do nothing;

-- ---------------------------------------------------------------
-- Products must respect the rules of the owner's level (enforced here,
-- not only in the app). The user's own limits table is no longer used.
-- ---------------------------------------------------------------
create or replace function public.enforce_level_rules()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  lvl int;
  r jsonb;
  usd boolean := new.marketplace = 'amazon';
  max_cost numeric;
  max_budget numeric;
  cat text;
begin
  select level into lvl from public.profiles where id = new.user_id;
  select rules into r from public.level_rules where level = coalesce(lvl, 0);
  if r is null then return new; end if;

  max_cost := (r ->> case when usd then 'maxUnitCostUsd' else 'maxUnitCostUzs' end)::numeric;
  max_budget := (r ->> case when usd then 'maxOrderBudgetUsd' else 'maxOrderBudgetUzs' end)::numeric;

  if new.unit_cost is not null and max_cost is not null and new.unit_cost > max_cost then
    raise exception 'LEVEL_RULE: unitCost' using errcode = 'check_violation';
  end if;
  if new.unit_cost is not null and new.quantity is not null and max_budget is not null
     and (new.unit_cost + coalesce(new.shipping_per_unit, 0)) * new.quantity > max_budget then
    raise exception 'LEVEL_RULE: orderBudget' using errcode = 'check_violation';
  end if;
  if new.weight_kg is not null and (r ? 'maxWeightKg') and new.weight_kg > (r ->> 'maxWeightKg')::numeric then
    raise exception 'LEVEL_RULE: weight' using errcode = 'check_violation';
  end if;
  if new.longest_cm is not null and (r ? 'maxLongestCm') and new.longest_cm > (r ->> 'maxLongestCm')::numeric then
    raise exception 'LEVEL_RULE: size' using errcode = 'check_violation';
  end if;
  foreach cat in array coalesce(new.restricted, '{}') loop
    if (r -> 'blocked') ? cat then
      raise exception 'LEVEL_RULE: category' using errcode = 'check_violation';
    end if;
  end loop;
  return new;
end;
$$;

drop trigger if exists products_level_rules on public.products;
create trigger products_level_rules before insert or update on public.products
  for each row execute function public.enforce_level_rules();

-- ---------------------------------------------------------------
-- Lessons: stored in the database so admins can add, edit and delete them
-- ---------------------------------------------------------------
create table if not exists public.lessons (
  id text primary key check (id ~ '^[a-z0-9-]{2,64}$'),
  level int not null default 0 check (level >= 0),
  position int not null default 0,
  published boolean not null default true,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
create index if not exists lessons_order_idx on public.lessons (level, position);
alter table public.lessons enable row level security;

drop policy if exists "lessons: read published" on public.lessons;
create policy "lessons: read published" on public.lessons for select using (published or public.is_admin());
drop policy if exists "lessons: admin write" on public.lessons;
create policy "lessons: admin write" on public.lessons for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------
-- Admin functions (each checks the caller is an admin)
-- ---------------------------------------------------------------
create or replace function public.admin_list_users()
returns table (
  id uuid, email text, full_name text, level int, verified_profit_usd numeric, is_admin boolean,
  created_at timestamptz, last_sign_in_at timestamptz, products bigint, lessons_done bigint
) language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not allowed' using errcode = 'insufficient_privilege'; end if;
  return query
    select p.id, u.email::text, p.full_name, p.level, p.verified_profit_usd, p.is_admin,
           u.created_at, u.last_sign_in_at,
           (select count(*) from public.products x where x.user_id = p.id),
           (select count(*) from public.lesson_progress l where l.user_id = p.id)
    from public.profiles p join auth.users u on u.id = p.id
    order by u.created_at desc;
end;
$$;

create or replace function public.admin_update_user(target uuid, new_level int, new_profit numeric)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not allowed' using errcode = 'insufficient_privilege'; end if;
  if new_level < 0 or new_profit < 0 then raise exception 'invalid value'; end if;
  update public.profiles set level = new_level, verified_profit_usd = new_profit where id = target;
  insert into public.audit_log (user_id, action, subject, detail)
    values (auth.uid(), 'update', 'admin:user', format('user=%s level=%s profit=%s', target, new_level, new_profit));
end;
$$;

revoke all on function public.admin_list_users() from public, anon;
revoke all on function public.admin_update_user(uuid, int, numeric) from public, anon;
grant execute on function public.admin_list_users() to authenticated;
grant execute on function public.admin_update_user(uuid, int, numeric) to authenticated;

notify pgrst, 'reload schema';
