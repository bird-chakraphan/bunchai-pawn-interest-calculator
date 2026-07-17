begin;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create table if not exists public.staff_service_access (
    user_id uuid not null references auth.users (id) on delete cascade,
    service_key text not null check (service_key in ('pawn', 'jewelry')),
    role text not null check (role in ('staff', 'manager', 'admin')),
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    primary key (user_id, service_key)
);

drop trigger if exists staff_service_access_set_updated_at on public.staff_service_access;
create trigger staff_service_access_set_updated_at
before update on public.staff_service_access
for each row execute procedure public.set_updated_at();

-- Existing staff keep their pawn access. Service access, rather than the legacy
-- profile role, becomes the authorization source for every privileged path.
insert into public.staff_service_access (user_id, service_key, role, is_active)
select
    id,
    'pawn',
    case when role in ('staff', 'manager', 'admin') then role else 'staff' end,
    is_active
from public.staff_profiles
on conflict (user_id, service_key) do nothing;

alter table public.audit_events
    add column if not exists service_key text not null default 'pawn';

alter table public.audit_events
    drop constraint if exists audit_events_service_key_check;

alter table public.audit_events
    add constraint audit_events_service_key_check
    check (service_key in ('pawn', 'jewelry'));

create index if not exists staff_service_access_active_idx
    on public.staff_service_access (service_key, role)
    where is_active;

create index if not exists audit_events_service_key_created_at_idx
    on public.audit_events (service_key, created_at desc);

create or replace function public.has_active_staff_profile()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.staff_profiles
        where id = auth.uid()
          and is_active
    );
$$;

create or replace function public.has_service_access(
    requested_service text,
    allowed_roles text[] default array['staff', 'manager', 'admin']
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select public.has_active_staff_profile()
       and exists (
            select 1
            from public.staff_service_access
            where user_id = auth.uid()
              and service_key = requested_service
              and is_active
              and role = any (allowed_roles)
       );
$$;

create or replace function public.has_staff_admin_access()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select public.has_active_staff_profile()
       and exists (
            select 1
            from public.staff_service_access
            where user_id = auth.uid()
              and is_active
              and role = 'admin'
       );
$$;

revoke all on function public.has_active_staff_profile() from public;
revoke all on function public.has_service_access(text, text[]) from public;
revoke all on function public.has_staff_admin_access() from public;
grant execute on function public.has_active_staff_profile() to authenticated;
grant execute on function public.has_service_access(text, text[]) to authenticated;
grant execute on function public.has_staff_admin_access() to authenticated;

alter table public.staff_service_access enable row level security;

-- Remove legacy blanket authenticated policies before replacing them. Service-role
-- jobs bypass RLS and continue to be authenticated by their server-only secret.
do $$
declare
    target_table text;
    target_policy record;
begin
    foreach target_table in array array[
        'pawn_records',
        'sync_runs',
        'sync_run_issues',
        'customer_lookup_attempts',
        'payments',
        'payment_webhook_events',
        'staff_review_tasks',
        'notification_deliveries',
        'audit_events'
    ]
    loop
        execute format('alter table public.%I enable row level security', target_table);
        for target_policy in
            select policyname
            from pg_policies
            where schemaname = 'public'
              and tablename = target_table
        loop
            execute format('drop policy if exists %I on public.%I', target_policy.policyname, target_table);
        end loop;
    end loop;
end;
$$;

drop policy if exists "Staff can read their own profile" on public.staff_profiles;
drop policy if exists "Staff administrators can manage profiles" on public.staff_profiles;
create policy "Staff can read their own profile"
    on public.staff_profiles
    for select to authenticated
    using (id = auth.uid() or public.has_staff_admin_access());
create policy "Staff administrators can manage profiles"
    on public.staff_profiles
    for all to authenticated
    using (public.has_staff_admin_access())
    with check (public.has_staff_admin_access());

create policy "Staff can read their own service access"
    on public.staff_service_access
    for select to authenticated
    using (user_id = auth.uid() or public.has_staff_admin_access());
create policy "Staff administrators can manage service access"
    on public.staff_service_access
    for all to authenticated
    using (public.has_staff_admin_access())
    with check (public.has_staff_admin_access());

create policy "Active pawn staff can read pawn records"
    on public.pawn_records for select to authenticated
    using (public.has_service_access('pawn'));
create policy "Active pawn staff can read sync runs"
    on public.sync_runs for select to authenticated
    using (public.has_service_access('pawn'));
create policy "Active pawn staff can read sync issues"
    on public.sync_run_issues for select to authenticated
    using (public.has_service_access('pawn'));
create policy "Active pawn staff can read customer lookup attempts"
    on public.customer_lookup_attempts for select to authenticated
    using (public.has_service_access('pawn', array['manager', 'admin']));
create policy "Active pawn staff can read payments"
    on public.payments for select to authenticated
    using (public.has_service_access('pawn'));
create policy "Active pawn staff can read webhook events"
    on public.payment_webhook_events for select to authenticated
    using (public.has_service_access('pawn', array['manager', 'admin']));
create policy "Active pawn staff can read review tasks"
    on public.staff_review_tasks for select to authenticated
    using (public.has_service_access('pawn'));
create policy "Active pawn staff can read notification deliveries"
    on public.notification_deliveries for select to authenticated
    using (public.has_service_access('pawn'));
create policy "Staff can read audit events for their service"
    on public.audit_events for select to authenticated
    using (public.has_service_access(service_key));

grant select on public.staff_service_access to authenticated;

commit;
