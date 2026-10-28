-- Synthetic B01 fixtures only; phone is deliberately not a real mobile number.
-- Relative dates keep the existing calculator trial usable after a later reset.
insert into public.pawn_records (
    pawn_id, customer_phone, start_date, loan_amount, promo_type, base_rate,
    source_status, archived_from_source, source_updated_at, last_synced_at
) values (
    'I99001', '0000000000',
    (current_timestamp at time zone 'Asia/Bangkok')::date - 20,
    10000, 'โปร 2%', 0.02, 'ยังอยู่ในกำหนด', false, now(), now()
) on conflict (pawn_id) do nothing;

insert into storage.buckets (id, name, public)
values ('b01-test-files', 'b01-test-files', false)
on conflict (id) do nothing;
