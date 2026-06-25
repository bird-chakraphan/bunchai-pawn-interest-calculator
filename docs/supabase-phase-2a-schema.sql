create table if not exists public.pawn_records (
    id uuid primary key default gen_random_uuid(),
    pawn_id text not null unique,
    customer_phone text,
    start_date date not null,
    loan_amount numeric(12, 2) not null check (loan_amount > 0),
    promo_type text not null,
    base_rate numeric(8, 6) not null default 0.02 check (base_rate > 0),
    archived_from_source boolean not null default false,
    source_updated_at timestamptz,
    last_synced_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.pawn_records
    add column if not exists base_rate numeric(8, 6) not null default 0.02 check (base_rate > 0);

alter table public.pawn_records
    alter column promo_type type text;

alter table public.pawn_records
    drop constraint if exists pawn_records_promo_type_check;

update public.pawn_records
set base_rate = case
    when promo_type in ('โปรแสน (1.5%)', 'โปร 1.5%') then 0.015
    when promo_type = 'โปร 1%' then 0.01
    else 0.02
end
where base_rate is null or base_rate = 0.02;

alter table public.pawn_records enable row level security;

create index if not exists pawn_records_pawn_id_idx
    on public.pawn_records (pawn_id);

create index if not exists pawn_records_archived_from_source_idx
    on public.pawn_records (archived_from_source);

create table if not exists public.staff_profiles (
    id uuid primary key references auth.users (id) on delete cascade,
    full_name text,
    role text not null default 'staff',
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.staff_profiles enable row level security;

create table if not exists public.sync_runs (
    id uuid primary key default gen_random_uuid(),
    status text not null,
    started_at timestamptz not null default now(),
    finished_at timestamptz,
    row_count integer not null default 0,
    inserted_count integer not null default 0,
    updated_count integer not null default 0,
    archived_count integer not null default 0,
    warning_count integer not null default 0,
    error_message text
);

alter table public.sync_runs enable row level security;

create table if not exists public.sync_run_issues (
    id uuid primary key default gen_random_uuid(),
    sync_run_id uuid not null references public.sync_runs (id) on delete cascade,
    row_index integer,
    pawn_id_raw text,
    severity text not null check (severity in ('warning', 'error')),
    reason text not null,
    raw_row jsonb not null,
    created_at timestamptz not null default now()
);

alter table public.sync_run_issues enable row level security;

create index if not exists sync_run_issues_sync_run_id_idx
    on public.sync_run_issues (sync_run_id);

create table if not exists public.customer_lookup_attempts (
    id uuid primary key default gen_random_uuid(),
    normalized_pawn_id text not null,
    ip_hash text not null,
    result_status text not null,
    created_at timestamptz not null default now()
);

alter table public.customer_lookup_attempts enable row level security;

create index if not exists customer_lookup_attempts_lookup_idx
    on public.customer_lookup_attempts (normalized_pawn_id, ip_hash, created_at desc);

create table if not exists public.payments (
    id uuid primary key default gen_random_uuid(),
    pawn_record_id uuid references public.pawn_records (id) on delete set null,
    pawn_id_snapshot text not null,
    transaction_type text not null check (transaction_type in ('ต่อดอก')),
    amount integer not null check (amount > 0),
    currency text not null default 'THB',
    payment_status text not null check (
        payment_status in ('pending_payment', 'paid', 'failed', 'expired')
    ),
    renewal_status text not null check (
        renewal_status in ('none', 'pending_staff_review', 'review_completed')
    ),
    start_date_before_payment date not null,
    effective_renewal_date date,
    calculation_snapshot jsonb not null,
    omise_link_id text,
    omise_charge_id text,
    omise_source_id text,
    omise_checkout_url text,
    paid_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.payments enable row level security;

create index if not exists payments_pawn_id_snapshot_idx
    on public.payments (pawn_id_snapshot, created_at desc);

create table if not exists public.payment_webhook_events (
    id uuid primary key default gen_random_uuid(),
    provider_event_id text not null unique,
    event_type text not null,
    payload jsonb not null,
    received_at timestamptz not null default now(),
    processed_at timestamptz,
    payment_id uuid references public.payments (id) on delete set null
);

alter table public.payment_webhook_events enable row level security;

create table if not exists public.staff_review_tasks (
    id uuid primary key default gen_random_uuid(),
    payment_id uuid not null unique references public.payments (id) on delete cascade,
    status text not null check (status in ('pending', 'completed')),
    assigned_group text not null,
    created_at timestamptz not null default now(),
    reviewed_at timestamptz,
    reviewed_by uuid references auth.users (id) on delete set null
);

alter table public.staff_review_tasks enable row level security;

create table if not exists public.notification_deliveries (
    id uuid primary key default gen_random_uuid(),
    task_id uuid not null references public.staff_review_tasks (id) on delete cascade,
    channel text not null check (channel in ('line_group')),
    status text not null check (status in ('pending', 'sent', 'failed')),
    attempt_count integer not null default 0,
    last_error text,
    last_attempted_at timestamptz,
    created_at timestamptz not null default now()
);

alter table public.notification_deliveries enable row level security;

create table if not exists public.audit_events (
    id uuid primary key default gen_random_uuid(),
    actor_user_id uuid references auth.users (id) on delete set null,
    event_type text not null,
    entity_type text not null,
    entity_id text,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

alter table public.audit_events enable row level security;

drop policy if exists "Authenticated users can read pawn_records" on public.pawn_records;
create policy "Authenticated users can read pawn_records"
    on public.pawn_records
    for select
    to authenticated
    using (true);

drop policy if exists "Authenticated users can read their own staff profile" on public.staff_profiles;
create policy "Authenticated users can read their own staff profile"
    on public.staff_profiles
    for select
    to authenticated
    using (auth.uid() = id);

drop policy if exists "Authenticated users can read sync_runs" on public.sync_runs;
create policy "Authenticated users can read sync_runs"
    on public.sync_runs
    for select
    to authenticated
    using (true);

drop policy if exists "Authenticated users can read sync_run_issues" on public.sync_run_issues;
create policy "Authenticated users can read sync_run_issues"
    on public.sync_run_issues
    for select
    to authenticated
    using (true);

drop policy if exists "Authenticated users can read payments" on public.payments;
create policy "Authenticated users can read payments"
    on public.payments
    for select
    to authenticated
    using (true);

drop policy if exists "Authenticated users can read staff_review_tasks" on public.staff_review_tasks;
create policy "Authenticated users can read staff_review_tasks"
    on public.staff_review_tasks
    for select
    to authenticated
    using (true);

drop policy if exists "Authenticated users can read notification_deliveries" on public.notification_deliveries;
create policy "Authenticated users can read notification_deliveries"
    on public.notification_deliveries
    for select
    to authenticated
    using (true);

drop policy if exists "Authenticated users can read audit_events" on public.audit_events;
create policy "Authenticated users can read audit_events"
    on public.audit_events
    for select
    to authenticated
    using (true);
