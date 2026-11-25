-- The existing directory enforces a single active tenant and a tenant owner or admin.
create function public.s015_list_internal_team_members_v2()
returns table (
  membership_id uuid,
  user_id uuid,
  display_name text,
  membership_status text,
  role_keys text[],
  client_names text[],
  assignments jsonb,
  available_clients jsonb,
  email text
)
language sql
stable
security definer
set search_path = ''
as $$
  select member.membership_id, member.user_id, member.display_name,
         member.membership_status, member.role_keys, member.client_names,
         member.assignments, member.available_clients, nullif(btrim(account.email), '')
  from public.s015_list_internal_team_members() as member
  left join auth.users as account on account.id = member.user_id
  order by member.display_name, member.membership_id;
$$;

revoke all on function public.s015_list_internal_team_members_v2()
  from public, anon, authenticated;
grant execute on function public.s015_list_internal_team_members_v2()
  to authenticated;
