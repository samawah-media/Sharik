create table if not exists public.member_profiles (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null,
  display_name text not null check (char_length(trim(display_name)) between 2 and 120),
  role_label text,
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (tenant_id, user_id)
);

create index if not exists member_profiles_tenant_user_idx
  on public.member_profiles (tenant_id, user_id);

alter table public.member_profiles enable row level security;
grant select on public.member_profiles to authenticated;

drop policy if exists s015_member_profiles_select on public.member_profiles;
create policy s015_member_profiles_select on public.member_profiles
  for select to authenticated using (
    public.f001_has_active_role(
      tenant_id,
      array[
        'tenant_owner',
        'tenant_administrator',
        'project_manager',
        'marketing_manager',
        'account_manager',
        'content_writer',
        'designer',
        'performance_specialist'
      ],
      'tenant',
      tenant_id
    )
  );
