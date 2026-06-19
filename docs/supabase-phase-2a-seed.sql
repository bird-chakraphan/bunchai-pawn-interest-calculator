-- Phase 2A staff lookup seed records
-- Safe to rerun: uses pawn_id upsert keys.
-- Assumes today's calculator date is around 2026-06-20.

insert into public.pawn_records (
    pawn_id,
    customer_phone,
    start_date,
    loan_amount,
    promo_type,
    archived_from_source,
    source_updated_at,
    last_synced_at,
    updated_at
)
values
    (
        'P-1001',
        '0812345678',
        '2024-06-10',
        10000,
        'โปร 2%',
        false,
        now(),
        now(),
        now()
    ),
    (
        'P-ACTIVE-001',
        '0811111111',
        '2026-06-08',
        12000,
        'โปร 2%',
        false,
        now(),
        now(),
        now()
    ),
    (
        'P-GRACE-001',
        '0822222222',
        '2026-03-10',
        15000,
        'โปร 2%',
        false,
        now(),
        now(),
        now()
    ),
    (
        'P-BLOCKED-001',
        '0833333333',
        '2026-02-25',
        10000,
        'โปร 2%',
        false,
        now(),
        now(),
        now()
    )
on conflict (pawn_id) do update
set
    customer_phone = excluded.customer_phone,
    start_date = excluded.start_date,
    loan_amount = excluded.loan_amount,
    promo_type = excluded.promo_type,
    archived_from_source = excluded.archived_from_source,
    source_updated_at = excluded.source_updated_at,
    last_synced_at = excluded.last_synced_at,
    updated_at = now();
