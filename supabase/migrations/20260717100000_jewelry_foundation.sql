begin;

create table public.jewelry_categories (
    id uuid primary key default gen_random_uuid(),
    code text not null unique,
    name_th text not null,
    source_sheet_aliases text[] not null default '{}',
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.jewelry_items (
    id uuid primary key default gen_random_uuid(),
    item_code text not null unique,
    category_id uuid not null references public.jewelry_categories (id),
    status text not null default 'draft' check (status in (
        'draft', 'in_stock', 'reserved', 'sold', 'return_pending',
        'returned', 'exchange_pending', 'exchanged', 'transferred',
        'quarantined', 'cancelled'
    )),
    received_on date,
    title text not null,
    description text,
    gross_weight_g numeric(10, 3),
    gold_weight_g numeric(10, 3),
    material text,
    purity text,
    current_location text,
    sale_price numeric(12, 2),
    spec_json jsonb not null default '{}'::jsonb,
    source_status text,
    status_set_at timestamptz not null default now(),
    created_by uuid references auth.users (id) on delete set null,
    updated_by uuid references auth.users (id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    check (gross_weight_g is null or gross_weight_g >= 0),
    check (gold_weight_g is null or gold_weight_g >= 0),
    check (sale_price is null or sale_price >= 0)
);

create table public.jewelry_item_details (
    id uuid primary key default gen_random_uuid(),
    item_id uuid not null references public.jewelry_items (id) on delete cascade,
    line_number integer not null,
    original_text text not null,
    detail_type text,
    parsed_value jsonb,
    parse_confidence numeric(4, 3),
    created_at timestamptz not null default now(),
    unique (item_id, line_number),
    check (parse_confidence is null or (parse_confidence >= 0 and parse_confidence <= 1))
);

create table public.jewelry_item_media (
    id uuid primary key default gen_random_uuid(),
    item_id uuid not null references public.jewelry_items (id) on delete cascade,
    storage_path text not null unique,
    checksum text,
    caption text,
    source_reference text,
    uploaded_by uuid references auth.users (id) on delete set null,
    created_at timestamptz not null default now()
);

create table public.jewelry_customers (
    id uuid primary key default gen_random_uuid(),
    display_name text not null,
    phone_raw text,
    phone_normalized text,
    contact_notes text,
    created_by uuid references auth.users (id) on delete set null,
    updated_by uuid references auth.users (id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create unique index jewelry_customers_phone_normalized_unique
    on public.jewelry_customers (phone_normalized)
    where phone_normalized is not null;

create table public.jewelry_transactions (
    id uuid primary key default gen_random_uuid(),
    transaction_number text not null unique default ('J' || replace(gen_random_uuid()::text, '-', '')),
    transaction_type text not null check (transaction_type in (
        'intake', 'sale', 'reservation', 'reservation_release', 'return',
        'exchange', 'transfer', 'stock_adjustment', 'write_off', 'price_adjustment'
    )),
    status text not null check (status in ('draft', 'pending_approval', 'posted', 'rejected', 'voided', 'reconciled', 'needs_review')),
    customer_id uuid references public.jewelry_customers (id) on delete set null,
    original_transaction_id uuid references public.jewelry_transactions (id) on delete set null,
    pawn_record_id uuid references public.pawn_records (id) on delete set null,
    gross_amount numeric(12, 2) not null default 0 check (gross_amount >= 0),
    terms_snapshot jsonb not null default '{}'::jsonb,
    exception_reason text,
    recorded_by uuid references auth.users (id) on delete set null,
    approved_by uuid references auth.users (id) on delete set null,
    approved_at timestamptz,
    posted_at timestamptz,
    void_reason text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.jewelry_transaction_items (
    id uuid primary key default gen_random_uuid(),
    transaction_id uuid not null references public.jewelry_transactions (id) on delete cascade,
    item_id uuid not null references public.jewelry_items (id),
    item_status_before text not null,
    item_status_after text not null,
    condition_snapshot jsonb not null default '{}'::jsonb,
    specification_snapshot jsonb not null default '{}'::jsonb,
    amount_allocation numeric(12, 2),
    created_at timestamptz not null default now(),
    unique (transaction_id, item_id)
);

create table public.jewelry_terms (
    id uuid primary key default gen_random_uuid(),
    transaction_id uuid not null references public.jewelry_transactions (id) on delete cascade,
    term_type text not null check (term_type in ('return', 'exchange', 'discount', 'contract')),
    percentage numeric(7, 6),
    amount numeric(12, 2),
    duration_days integer,
    due_date date,
    raw_wording text,
    status text not null default 'active' check (status in ('active', 'superseded', 'cancelled')),
    created_at timestamptz not null default now()
);

create table public.jewelry_item_events (
    id uuid primary key default gen_random_uuid(),
    item_id uuid not null references public.jewelry_items (id),
    transaction_id uuid references public.jewelry_transactions (id) on delete set null,
    event_type text not null,
    status_before text,
    status_after text,
    reason text,
    metadata jsonb not null default '{}'::jsonb,
    actor_user_id uuid references auth.users (id) on delete set null,
    created_at timestamptz not null default now()
);

create table public.jewelry_import_batches (
    id uuid primary key default gen_random_uuid(),
    original_filename text not null,
    checksum_sha256 text not null,
    source_format_version text,
    status text not null check (status in ('draft', 'dry_run', 'review', 'completed', 'failed')),
    imported_by uuid references auth.users (id) on delete set null,
    started_at timestamptz not null default now(),
    completed_at timestamptz,
    summary jsonb not null default '{}'::jsonb,
    unique (checksum_sha256, source_format_version)
);

create table public.jewelry_import_rows (
    id uuid primary key default gen_random_uuid(),
    batch_id uuid not null references public.jewelry_import_batches (id) on delete cascade,
    sheet_name text not null,
    source_row_number integer not null,
    row_group integer,
    source_row_fingerprint text not null,
    raw_cells jsonb not null,
    parsed_candidate jsonb not null default '{}'::jsonb,
    match_state text not null default 'needs_review' check (match_state in ('unmatched', 'matched', 'needs_review', 'ignored')),
    review_reason text,
    resolved_item_id uuid references public.jewelry_items (id) on delete set null,
    resolved_transaction_id uuid references public.jewelry_transactions (id) on delete set null,
    created_at timestamptz not null default now(),
    unique (batch_id, sheet_name, source_row_number, source_row_fingerprint)
);

create table public.jewelry_reconciliation_issues (
    id uuid primary key default gen_random_uuid(),
    batch_id uuid not null references public.jewelry_import_batches (id) on delete cascade,
    import_row_id uuid references public.jewelry_import_rows (id) on delete set null,
    issue_type text not null,
    severity text not null check (severity in ('warning', 'blocking')),
    details jsonb not null default '{}'::jsonb,
    status text not null default 'open' check (status in ('open', 'resolved', 'accepted')),
    resolved_by uuid references auth.users (id) on delete set null,
    resolved_at timestamptz,
    resolution_reason text,
    created_at timestamptz not null default now()
);

create index jewelry_items_search_idx on public.jewelry_items (item_code, status, category_id);
create index jewelry_transactions_customer_idx on public.jewelry_transactions (customer_id, created_at desc);
create index jewelry_transaction_items_item_idx on public.jewelry_transaction_items (item_id, created_at desc);
create index jewelry_item_events_item_idx on public.jewelry_item_events (item_id, created_at desc);
create index jewelry_import_rows_batch_idx on public.jewelry_import_rows (batch_id, sheet_name, source_row_number);
create index jewelry_reconciliation_issues_open_idx on public.jewelry_reconciliation_issues (batch_id, severity) where status = 'open';

create trigger jewelry_categories_set_updated_at before update on public.jewelry_categories
for each row execute procedure public.set_updated_at();
create trigger jewelry_items_set_updated_at before update on public.jewelry_items
for each row execute procedure public.set_updated_at();
create trigger jewelry_customers_set_updated_at before update on public.jewelry_customers
for each row execute procedure public.set_updated_at();
create trigger jewelry_transactions_set_updated_at before update on public.jewelry_transactions
for each row execute procedure public.set_updated_at();

create or replace function public.require_jewelry_actor(p_actor_user_id uuid, p_manager_required boolean default false)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
    actor_role text;
begin
    select access.role into actor_role
    from public.staff_profiles profile
    join public.staff_service_access access on access.user_id = profile.id
    where profile.id = p_actor_user_id
      and profile.is_active
      and access.service_key = 'jewelry'
      and access.is_active;

    if actor_role is null or (p_manager_required and actor_role not in ('manager', 'admin')) then
        raise exception 'Jewelry service access denied' using errcode = '42501';
    end if;

    return actor_role;
end;
$$;

create or replace function public.post_jewelry_sale(
    p_item_id uuid,
    p_customer_id uuid,
    p_gross_amount numeric,
    p_terms_snapshot jsonb,
    p_actor_user_id uuid,
    p_exception_reason text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
    item_row public.jewelry_items;
    actor_role text;
    transaction_id uuid;
    next_status text;
    next_transaction_status text;
begin
    actor_role := public.require_jewelry_actor(p_actor_user_id, false);
    select * into item_row from public.jewelry_items where id = p_item_id for update;

    if not found or item_row.status <> 'in_stock' then
        raise exception 'Item is not available for sale' using errcode = '23514';
    end if;

    if p_gross_amount < 0 then
        raise exception 'Sale amount cannot be negative' using errcode = '22003';
    end if;

    next_status := case when p_exception_reason is not null and actor_role = 'staff' then 'reserved' else 'sold' end;
    next_transaction_status := case when next_status = 'reserved' then 'pending_approval' else 'posted' end;

    insert into public.jewelry_transactions (
        transaction_type, status, customer_id, gross_amount, terms_snapshot,
        exception_reason, recorded_by, approved_by, approved_at, posted_at
    ) values (
        'sale', next_transaction_status, p_customer_id, p_gross_amount,
        coalesce(p_terms_snapshot, '{}'::jsonb), p_exception_reason, p_actor_user_id,
        case when next_transaction_status = 'posted' then p_actor_user_id else null end,
        case when next_transaction_status = 'posted' then now() else null end,
        case when next_transaction_status = 'posted' then now() else null end
    ) returning id into transaction_id;

    insert into public.jewelry_transaction_items (
        transaction_id, item_id, item_status_before, item_status_after,
        specification_snapshot, amount_allocation
    ) values (
        transaction_id, p_item_id, item_row.status, next_status,
        jsonb_build_object('title', item_row.title, 'description', item_row.description, 'spec_json', item_row.spec_json),
        p_gross_amount
    );

    update public.jewelry_items
    set status = next_status, status_set_at = now(), updated_by = p_actor_user_id
    where id = p_item_id;

    insert into public.jewelry_item_events (item_id, transaction_id, event_type, status_before, status_after, reason, actor_user_id)
    values (p_item_id, transaction_id, case when next_status = 'reserved' then 'sale_requested' else 'sale_posted' end, item_row.status, next_status, p_exception_reason, p_actor_user_id);

    insert into public.audit_events (actor_user_id, event_type, entity_type, entity_id, service_key, metadata)
    values (p_actor_user_id, 'jewelry_sale_' || next_transaction_status, 'jewelry_transaction', transaction_id::text, 'jewelry', jsonb_build_object('item_id', p_item_id));

    return transaction_id;
end;
$$;

create or replace function public.approve_jewelry_transaction(p_transaction_id uuid, p_actor_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    transaction_row public.jewelry_transactions;
    transaction_item public.jewelry_transaction_items;
    item_row public.jewelry_items;
begin
    perform public.require_jewelry_actor(p_actor_user_id, true);
    select * into transaction_row from public.jewelry_transactions where id = p_transaction_id for update;
    if not found or transaction_row.status <> 'pending_approval' then
        raise exception 'Transaction is not awaiting approval' using errcode = '23514';
    end if;
    select * into transaction_item from public.jewelry_transaction_items where transaction_id = p_transaction_id;
    select * into item_row from public.jewelry_items where id = transaction_item.item_id for update;
    if item_row.status <> 'reserved' then
        raise exception 'Reserved item is no longer available for approval' using errcode = '23514';
    end if;

    update public.jewelry_transactions set status = 'posted', approved_by = p_actor_user_id, approved_at = now(), posted_at = now() where id = p_transaction_id;
    update public.jewelry_transaction_items set item_status_after = 'sold' where id = transaction_item.id;
    update public.jewelry_items set status = 'sold', status_set_at = now(), updated_by = p_actor_user_id where id = item_row.id;
    insert into public.jewelry_item_events (item_id, transaction_id, event_type, status_before, status_after, actor_user_id)
    values (item_row.id, p_transaction_id, 'sale_approved', 'reserved', 'sold', p_actor_user_id);
    insert into public.audit_events (actor_user_id, event_type, entity_type, entity_id, service_key, metadata)
    values (p_actor_user_id, 'jewelry_sale_approved', 'jewelry_transaction', p_transaction_id::text, 'jewelry', jsonb_build_object('item_id', item_row.id));
end;
$$;

create or replace function public.post_jewelry_return(
    p_item_id uuid,
    p_original_sale_id uuid,
    p_actor_user_id uuid,
    p_reason text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
    item_row public.jewelry_items;
    transaction_id uuid;
begin
    perform public.require_jewelry_actor(p_actor_user_id, false);
    select * into item_row from public.jewelry_items where id = p_item_id for update;
    if not found or item_row.status <> 'sold' then
        raise exception 'Only sold items can be returned' using errcode = '23514';
    end if;

    insert into public.jewelry_transactions (transaction_type, status, original_transaction_id, recorded_by, approved_by, approved_at, posted_at)
    values ('return', 'posted', p_original_sale_id, p_actor_user_id, p_actor_user_id, now(), now()) returning id into transaction_id;
    insert into public.jewelry_transaction_items (transaction_id, item_id, item_status_before, item_status_after, specification_snapshot)
    values (transaction_id, p_item_id, 'sold', 'returned', jsonb_build_object('title', item_row.title, 'spec_json', item_row.spec_json));
    update public.jewelry_items set status = 'returned', status_set_at = now(), updated_by = p_actor_user_id where id = p_item_id;
    insert into public.jewelry_item_events (item_id, transaction_id, event_type, status_before, status_after, reason, actor_user_id)
    values (p_item_id, transaction_id, 'return_posted', 'sold', 'returned', p_reason, p_actor_user_id);
    insert into public.audit_events (actor_user_id, event_type, entity_type, entity_id, service_key, metadata)
    values (p_actor_user_id, 'jewelry_return_posted', 'jewelry_transaction', transaction_id::text, 'jewelry', jsonb_build_object('item_id', p_item_id));
    return transaction_id;
end;
$$;

create or replace function public.post_jewelry_exchange(
    p_original_item_id uuid,
    p_replacement_item_id uuid,
    p_original_sale_id uuid,
    p_actor_user_id uuid,
    p_gross_amount numeric default 0
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
    original_item public.jewelry_items;
    replacement_item public.jewelry_items;
    transaction_id uuid;
begin
    perform public.require_jewelry_actor(p_actor_user_id, false);
    select * into original_item from public.jewelry_items where id = p_original_item_id for update;
    if not found then
        raise exception 'Original item was not found' using errcode = '23514';
    end if;
    select * into replacement_item from public.jewelry_items where id = p_replacement_item_id for update;
    if not found or original_item.status <> 'sold' or replacement_item.status <> 'in_stock' then
        raise exception 'Exchange requires one sold item and one available replacement' using errcode = '23514';
    end if;

    insert into public.jewelry_transactions (transaction_type, status, original_transaction_id, gross_amount, recorded_by, approved_by, approved_at, posted_at)
    values ('exchange', 'posted', p_original_sale_id, p_gross_amount, p_actor_user_id, p_actor_user_id, now(), now()) returning id into transaction_id;
    insert into public.jewelry_transaction_items (transaction_id, item_id, item_status_before, item_status_after, specification_snapshot)
    values
        (transaction_id, original_item.id, 'sold', 'exchanged', jsonb_build_object('title', original_item.title, 'spec_json', original_item.spec_json)),
        (transaction_id, replacement_item.id, 'in_stock', 'sold', jsonb_build_object('title', replacement_item.title, 'spec_json', replacement_item.spec_json));
    update public.jewelry_items set status = 'exchanged', status_set_at = now(), updated_by = p_actor_user_id where id = original_item.id;
    update public.jewelry_items set status = 'sold', status_set_at = now(), updated_by = p_actor_user_id where id = replacement_item.id;
    insert into public.jewelry_item_events (item_id, transaction_id, event_type, status_before, status_after, actor_user_id)
    values
        (original_item.id, transaction_id, 'exchange_out_posted', 'sold', 'exchanged', p_actor_user_id),
        (replacement_item.id, transaction_id, 'exchange_in_posted', 'in_stock', 'sold', p_actor_user_id);
    insert into public.audit_events (actor_user_id, event_type, entity_type, entity_id, service_key, metadata)
    values (p_actor_user_id, 'jewelry_exchange_posted', 'jewelry_transaction', transaction_id::text, 'jewelry', jsonb_build_object('original_item_id', original_item.id, 'replacement_item_id', replacement_item.id));
    return transaction_id;
end;
$$;

alter table public.jewelry_categories enable row level security;
alter table public.jewelry_items enable row level security;
alter table public.jewelry_item_details enable row level security;
alter table public.jewelry_item_media enable row level security;
alter table public.jewelry_customers enable row level security;
alter table public.jewelry_transactions enable row level security;
alter table public.jewelry_transaction_items enable row level security;
alter table public.jewelry_terms enable row level security;
alter table public.jewelry_item_events enable row level security;
alter table public.jewelry_import_batches enable row level security;
alter table public.jewelry_import_rows enable row level security;
alter table public.jewelry_reconciliation_issues enable row level security;

create policy "Jewelry staff can read categories" on public.jewelry_categories for select to authenticated using (public.has_service_access('jewelry'));
create policy "Jewelry staff can read items" on public.jewelry_items for select to authenticated using (public.has_service_access('jewelry'));
create policy "Jewelry staff can read item details" on public.jewelry_item_details for select to authenticated using (public.has_service_access('jewelry'));
create policy "Jewelry staff can read item media" on public.jewelry_item_media for select to authenticated using (public.has_service_access('jewelry'));
create policy "Jewelry staff can read customers" on public.jewelry_customers for select to authenticated using (public.has_service_access('jewelry'));
create policy "Jewelry staff can read transactions" on public.jewelry_transactions for select to authenticated using (public.has_service_access('jewelry'));
create policy "Jewelry staff can read transaction items" on public.jewelry_transaction_items for select to authenticated using (public.has_service_access('jewelry'));
create policy "Jewelry staff can read terms" on public.jewelry_terms for select to authenticated using (public.has_service_access('jewelry'));
create policy "Jewelry staff can read item events" on public.jewelry_item_events for select to authenticated using (public.has_service_access('jewelry'));
create policy "Jewelry managers can read import batches" on public.jewelry_import_batches for select to authenticated using (public.has_service_access('jewelry', array['manager', 'admin']));
create policy "Jewelry managers can read import rows" on public.jewelry_import_rows for select to authenticated using (public.has_service_access('jewelry', array['manager', 'admin']));
create policy "Jewelry managers can read reconciliation issues" on public.jewelry_reconciliation_issues for select to authenticated using (public.has_service_access('jewelry', array['manager', 'admin']));

grant select on public.jewelry_categories, public.jewelry_items, public.jewelry_item_details,
    public.jewelry_item_media, public.jewelry_customers, public.jewelry_transactions,
    public.jewelry_transaction_items, public.jewelry_terms, public.jewelry_item_events
to authenticated;
grant select on public.jewelry_import_batches, public.jewelry_import_rows, public.jewelry_reconciliation_issues to authenticated;
revoke all on function public.require_jewelry_actor(uuid, boolean) from public;
revoke all on function public.post_jewelry_sale(uuid, uuid, numeric, jsonb, uuid, text) from public;
revoke all on function public.approve_jewelry_transaction(uuid, uuid) from public;
revoke all on function public.post_jewelry_return(uuid, uuid, uuid, text) from public;
revoke all on function public.post_jewelry_exchange(uuid, uuid, uuid, uuid, numeric) from public;
grant execute on function public.post_jewelry_sale(uuid, uuid, numeric, jsonb, uuid, text) to service_role;
grant execute on function public.approve_jewelry_transaction(uuid, uuid) to service_role;
grant execute on function public.post_jewelry_return(uuid, uuid, uuid, text) to service_role;
grant execute on function public.post_jewelry_exchange(uuid, uuid, uuid, uuid, numeric) to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('jewelry-photos', 'jewelry-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Jewelry staff can read private photos" on storage.objects;
drop policy if exists "Jewelry staff can upload private photos" on storage.objects;
drop policy if exists "Jewelry staff can update private photos" on storage.objects;
drop policy if exists "Jewelry staff can delete private photos" on storage.objects;
create policy "Jewelry staff can read private photos" on storage.objects for select to authenticated
using (bucket_id = 'jewelry-photos' and public.has_service_access('jewelry'));
create policy "Jewelry staff can upload private photos" on storage.objects for insert to authenticated
with check (bucket_id = 'jewelry-photos' and public.has_service_access('jewelry'));
create policy "Jewelry staff can update private photos" on storage.objects for update to authenticated
using (bucket_id = 'jewelry-photos' and public.has_service_access('jewelry'));
create policy "Jewelry staff can delete private photos" on storage.objects for delete to authenticated
using (bucket_id = 'jewelry-photos' and public.has_service_access('jewelry', array['manager', 'admin']));

commit;
