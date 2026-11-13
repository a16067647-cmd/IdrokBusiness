-- Idrok Business: activity numbers for the admin Statistics tab. Run once after 0007.
-- Returns counts only (no personal data). Admins only.
create or replace function public.admin_stats()
returns jsonb language plpgsql stable security definer set search_path = public, auth as $$
declare
  result jsonb;
begin
  if not public.is_admin() then raise exception 'not allowed' using errcode = 'insufficient_privilege'; end if;
  select jsonb_build_object(
    'users_total',        (select count(*) from auth.users),
    'users_7d',           (select count(*) from auth.users where created_at > now() - interval '7 days'),
    'users_30d',          (select count(*) from auth.users where created_at > now() - interval '30 days'),
    'active_7d',          (select count(*) from auth.users where last_sign_in_at > now() - interval '7 days'),
    'products_total',     (select count(*) from public.products),
    'products_7d',        (select count(*) from public.products where created_at > now() - interval '7 days'),
    'users_with_product', (select count(distinct user_id) from public.products),
    'lessons_done_total', (select count(*) from public.lesson_progress),
    'lessons_done_7d',    (select count(*) from public.lesson_progress where completed_on > current_date - 7),
    'learners',           (select count(distinct user_id) from public.lesson_progress),
    'ai_runs_total',      (select count(*) from public.agent_runs),
    'ai_runs_7d',         (select count(*) from public.agent_runs where created_at > now() - interval '7 days'),
    'approvals',          (select coalesce(jsonb_object_agg(status, n), '{}') from (select status, count(*) n from public.approvals group by status) a),
    'expenses_total',     (select count(*) from public.expenses),
    'signups_by_day',     (select coalesce(jsonb_agg(jsonb_build_object('day', d::date, 'n', coalesce(c.n, 0)) order by d), '[]')
                             from generate_series(current_date - 29, current_date, interval '1 day') d
                             left join (select created_at::date as signup_day, count(*) as n from auth.users group by 1) c on c.signup_day = d::date),
    'top_lessons',        (select coalesce(jsonb_agg(x), '[]') from (
                             select lesson_id, count(*) n from public.lesson_progress group by lesson_id order by n desc, lesson_id limit 5) x)
  ) into result;
  return result;
end;
$$;

revoke all on function public.admin_stats() from public, anon;
grant execute on function public.admin_stats() to authenticated;

notify pgrst, 'reload schema';
