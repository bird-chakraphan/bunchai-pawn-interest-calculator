# B01 local sample-data runbook

28 October 2026, Asia/Bangkok. This is an isolated local compatibility trial of the existing calculator. It is not the new sale workflow, a production release or complete B01 acceptance.

## Verified local environment

- Application: `http://127.0.0.1:3000`; Supabase API: `http://127.0.0.1:55321`; Studio: `http://127.0.0.1:55323`.
- Local Supabase ID: `bunchai-b01-local`; Docker network: `bunchai-b01-loopback`. No hosted project link exists.
- Supabase CLI 2.118.0, Docker 29.6.1, PostgreSQL 17 configuration, Node 26.0.0/npm 11.12.1. Follow-up Node 24.22.1 build/TypeScript, 81/83 test outcome, local API/page and restored trace/file checks passed; tablet/browser matrices remain unverified.
- Synthetic pawn `I99001`, deliberately non-real phone `0000000000`, principal 10,000 บาท, rate 2%, start date 20 Bangkok calendar days before the seed is run. Type **99001** into the existing lookup field; it adds `I` automatically.
- The Thai banner identifies the page as sample data. No genuine customer, staff account or attachment was copied.

## Startup

Run from the application checkout, with Docker Desktop already running:

```sh
# Create once; if it exists, inspect it rather than replacing an unrelated network.
docker network create --driver bridge --opt com.docker.network.bridge.host_binding_ipv4=127.0.0.1 bunchai-b01-loopback
supabase start --network-id bunchai-b01-loopback --exclude vector,logflare,realtime,edge-runtime,imgproxy,supavisor
python3 scripts/b01-bind-local.py
node scripts/b01-local-env.mjs
npm run build
npm run start -- --hostname 127.0.0.1
```

The env-generation script writes a mode-0600, Git-ignored `.env.local` containing keys obtained only from this local stack. It refuses an existing file, unexpected API URL or hosted link. On subsequent starts retain the verified file; regenerate only after reviewing/deleting that locally generated file deliberately. CLI startup/status output contains local keys: do not commit or publish it.

Docker Desktop 29.6.1 did not honor the network's default loopback-binding option during this trial. The binding script recreates only four exactly named B01 containers with explicit `127.0.0.1` bindings, preserving their named volumes and CLI-generated writable files. It uses local untagged Docker image snapshots; it does not upload images. Run it after startup or reset and verify the published addresses with `docker ps`. It refuses unexpected networks. The first workaround lost generated API files; preserving the writable layer fixed this, and all services subsequently passed health checks.

Stop only this stack with `supabase stop --project-id bunchai-b01-local`. Do not use `--all` or `--no-backup` to stop it. Stop the application process separately.

## Configuration boundary

`next.config.ts` refuses startup/build unless local-test mode, the exact approved local API URL, local key fields and `PAYMENTS_ENABLED=false` are present, with payment/LINE/sync secrets empty. Runtime Supabase helpers also reject all other URLs. Local-test mode disables the external integrations even if settings are accidentally inherited. No production credentials were read or copied.

The baseline migration reproduces the existing calculator schema and legacy read policies in isolation. Its authenticated policies are not the replacement platform's accepted authorization model. Anonymous direct table access is denied; the existing lookup route uses a local server key. No staff sign-in or role/device acceptance is claimed.

## Tested checks

- Browser form → local lookup API → sample pawn → displayed 200 บาท interest, 28 October; repeated successfully after recovery.
- A traceable `b01.isolation_probe` row writes/reads successfully; a private test-file upload/download matches SHA-256; anonymous direct pawn-table read is denied.
- Exported public schema/data plus a retrieved file and manifest, reset the local database without seeds, restored the data and file, then verified the trace, sample count and file hash.
- Build including TypeScript passed. Tests: **81/83 pass**; the two pre-existing staff-calculator text assertions remain recorded in `b01-progress.md`.
- Built-app requests: sample lookup 200/success, payment creation 404, legacy sync 503, Omise webhook 503. These disabled routes performed no external effect.
- Published local ports verified as `127.0.0.1` only. Live calculator still returned 200 and `/staff` 307 to sign-in, around 19:32 Bangkok.

## Repeat the local recovery rehearsal

Only use these commands on this unlinked, disposable B01 stack. The probe script checks its target before writes. Backups are under ignored `supabase/.temp/b01-recovery/`; they contain synthetic data only, and are not production backups.

```sh
node scripts/b01-data-check.mjs probe
supabase db dump --local --schema public --file supabase/.temp/b01-recovery/schema.sql
docker exec supabase_db_bunchai-b01-local pg_dump -U postgres --data-only --schema public --inserts --no-owner --no-acl postgres > supabase/.temp/b01-recovery/data.sql
supabase db reset --local --no-seed --network-id bunchai-b01-loopback
python3 scripts/b01-bind-local.py
docker exec -i supabase_db_bunchai-b01-local psql -U postgres -v ON_ERROR_STOP=1 postgres < supabase/.temp/b01-recovery/data.sql
node scripts/b01-data-check.mjs restore-file
```

Always pass the same network ID to reset. An initial reset omitted it, placing the database on the default network and breaking Storage DNS; the corrected command restored service and passed the rehearsal. Schema is reproduced from the versioned local migration; the schema export is retained as evidence. The data export restores public rows; the separate downloaded-object backup restores the test file. This is a local setup rehearsal, not a production restore, full historical import or proof of preserving future real transactions during rollback.

## Remaining B01 dependencies

The owner-approved engineering configuration, portable B01 scope/source map and issue #13 are in place; guarded branch/PR verification is tracked in b01-git-review-path.md. Remaining dependencies include the eligible hosted test website path, real tablet/browser checks relevant to setup and owner demonstration/feedback/acceptance. No hosted resource, paid upgrade, live migration or cutover has occurred. The old live calculator remains on its existing code and hosting.
