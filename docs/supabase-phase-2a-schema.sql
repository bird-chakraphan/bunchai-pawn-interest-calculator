create table if not exists public.pawn_records (
    id uuid primary key default gen_random_uuid(),
    pawn_id text not null unique,
    customer_phone text,
    start_date date not null,
    loan_amount numeric(12, 2) not null check (loan_amount > 0),
    promo_type text not null check (promo_type in ('โปร 2%', 'โปรแสน (1.5%)')),
    archived_from_source boolean not null default false,
    source_updated_at timestamptz,
    last_synced_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

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
