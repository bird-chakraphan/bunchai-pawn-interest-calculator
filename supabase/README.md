# Supabase workflow

This directory is the version-controlled home for database changes. It is not
evidence that the checked-in SQL documentation exactly matches production.

## Current baseline status

The application can reach the configured hosted Supabase project, but this
workspace has neither a Supabase personal access token nor the database
password required by `supabase link` / `supabase db pull`. Docker is also not
available here, so a local Supabase stack cannot be started on this machine.

Before applying any migration, a database owner must capture the authoritative
baseline into a separate clean clone or this branch:

```sh
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db pull
npx supabase migration list
```

Review the generated migration against the hosted project before committing it.
Do not use `supabase db reset`, `db push`, or any destructive command against
the production project.

## Staging-first deployment

1. Verify the Supabase dashboard backup/PITR retention and record the latest
   successful backup.
2. Restore or clone production into a staging project.
3. Link this branch to staging, run `npx supabase db push`, and run the app
   regression suite against staging.
4. Verify the RLS role matrix with real staging JWTs and rehearse restoring the
   pre-change backup.
5. Review the generated SQL and apply the same migrations to production only
   after explicit approval.

`supabase/seed.sql` contains development-only jewellery sample data. It must
never contain real customer, staff, or workbook data.
