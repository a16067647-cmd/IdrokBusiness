-- Idrok Business: let a signed-in user delete their own account. Run once after 0006.
-- Deleting the auth user cascades to every table that references it
-- (profiles, products, lesson_progress, audit_log, agent_runs, approvals, expenses).
create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = public, auth as $$
declare
  me uuid := auth.uid();
begin
  if me is null then
    raise exception 'not signed in' using errcode = 'insufficient_privilege';
  end if;
  delete from auth.users where id = me;
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

notify pgrst, 'reload schema';
