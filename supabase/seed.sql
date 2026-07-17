-- Development-only seed data. It intentionally contains no customer or staff data.
insert into public.jewelry_categories (code, name_th, is_active)
values
    ('ring', 'แหวน', true),
    ('earring', 'หู', true),
    ('pendant', 'จี้', true)
on conflict (code) do update
set name_th = excluded.name_th,
    is_active = excluded.is_active;
