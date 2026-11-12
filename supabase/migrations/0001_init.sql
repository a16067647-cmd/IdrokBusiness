-- Idrok Business: initial schema.
-- Run once in Supabase → SQL Editor. Every table uses Row Level Security:
-- a signed-in user can only read and write their own rows.

-- ---------------------------------------------------------------
-- Profiles (one per account). Users may edit their name only;
-- level and guardian consent change only through a verified process.
-- ---------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '' check (char_length(full_name) <= 80),
  level int not null default 0 check (level >= 0),
  guardian_acknowledged boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

drop policy if exists "profiles: read own" on public.profiles;
create policy "profiles: read own" on public.profiles for select using (auth.uid() = id);
drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

revoke update on public.profiles from authenticated, anon;
grant update (full_name) on public.profiles to authenticated;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, guardian_acknowledged)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 80),
    coalesce((new.raw_user_meta_data ->> 'guardian_acknowledged')::boolean, false)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------
-- Products
-- ---------------------------------------------------------------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  marketplace text not null check (marketplace in ('amazon', 'uzum')),
  status text not null default 'idea' check (status in ('idea', 'researching', 'approved', 'rejected')),
  sale_price numeric check (sale_price >= 0),
  unit_cost numeric check (unit_cost >= 0),
  shipping_per_unit numeric check (shipping_per_unit >= 0),
  fee_pct numeric check (fee_pct >= 0 and fee_pct <= 100),
  fulfillment_fee numeric check (fulfillment_fee >= 0),
  other_per_unit numeric check (other_per_unit >= 0),
  ad_per_unit numeric check (ad_per_unit >= 0),
  quantity numeric check (quantity >= 0),
  weight_kg numeric check (weight_kg >= 0),
  longest_cm numeric check (longest_cm >= 0),
  restricted text[] not null default '{}',
  notes text check (char_length(notes) <= 1000),
  reject_reason text check (char_length(reject_reason) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists products_user_idx on public.products (user_id, updated_at desc);
alter table public.products enable row level security;

drop policy if exists "products: own rows" on public.products;
create policy "products: own rows" on public.products for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------
-- Lesson progress (append-only: a finished lesson stays finished)
-- ---------------------------------------------------------------
create table if not exists public.lesson_progress (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  lesson_id text not null check (char_length(lesson_id) <= 64),
  completed_on date not null,
  primary key (user_id, lesson_id)
);
alter table public.lesson_progress enable row level security;

drop policy if exists "lessons: read own" on public.lesson_progress;
create policy "lessons: read own" on public.lesson_progress for select using (auth.uid() = user_id);
drop policy if exists "lessons: insert own" on public.lesson_progress;
create policy "lessons: insert own" on public.lesson_progress for insert with check (auth.uid() = user_id);

-- ---------------------------------------------------------------
-- Level 0 limits (the user's own safety rules)
-- ---------------------------------------------------------------
create table if not exists public.user_limits (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.user_limits enable row level security;

drop policy if exists "limits: own row" on public.user_limits;
create policy "limits: own row" on public.user_limits for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------
-- Audit log (append-only: no update or delete policies)
-- ---------------------------------------------------------------
create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  at timestamptz not null default now(),
  action text not null check (action in ('create', 'update', 'delete', 'status', 'limits', 'lesson', 'signin')),
  subject text not null check (char_length(subject) <= 200),
  detail text check (char_length(detail) <= 1000)
);
create index if not exists audit_user_idx on public.audit_log (user_id, at desc);
alter table public.audit_log enable row level security;

drop policy if exists "audit: read own" on public.audit_log;
create policy "audit: read own" on public.audit_log for select using (auth.uid() = user_id);
drop policy if exists "audit: insert own" on public.audit_log;
create policy "audit: insert own" on public.audit_log for insert with check (auth.uid() = user_id);
