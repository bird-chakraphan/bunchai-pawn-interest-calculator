# B01 local sample-data runbook

**29 October owner confirmation:** this local stack is the selected testing environment. Use the existing paid Supabase project only for the final shared live system after its authorized release gates. Do not provision another cloud test project or activate a Vercel trial for now.

Updated 29 October 2026, Asia/Bangkok. This is an isolated local compatibility trial of the existing calculator. It is not the new sale workflow, a production release or complete B01 acceptance.

## Verified local environment

- Application: `http://127.0.0.1:3000`; Supabase API: `http://127.0.0.1:55321`; Studio: `http://127.0.0.1:55323`.
- Local Supabase ID: `bunchai-b01-local`; Docker network: `bunchai-b01-loopback`. No hosted project link exists.
- Supabase CLI 2.118.0, Docker 29.6.1, PostgreSQL 17 configuration. Use Node 24.22.1 (`.nvmrc`); dependencies/lockfile are unchanged. Latest tests: 94/94 in UTC and Asia/Bangkok; TypeScript passes. See the dated overnight report for final build/CI evidence.
- Synthetic pawn `I99001`, deliberately non-real phone `0000000000`, principal 10,000 บาท, rate 2%, start date 20 Bangkok calendar days before the seed is run. Type **99001** into the existing lookup field; it adds `I` automatically.
- The Thai banner identifies the page as sample data. No genuine customer, staff account or attachment was copied.

## Startup

Run from the application checkout, with Docker Desktop already running:

```sh
# Select Node 24.22.1 with your existing version manager first.
npm run b01:up
npm run build
npm run start -- --hostname 127.0.0.1
# In another terminal:
npm run b01:check
npm run b01:auth
```

For active development use `npm run b01:dev` instead of build/start. `b01:up` is repeatable: it checks the named loopback Docker network, starts the exact B01 stack, applies the binding fix, waits for all eight services, generates credentials only if absent, and refuses stale/mismatched keys. It does not start a hosted resource. Keep the app bound to 127.0.0.1.

The env-generation script writes a mode-0600, Git-ignored `.env.local` containing keys obtained only from this local stack. It refuses an existing file, unexpected API URL or hosted link. On subsequent starts retain the verified file; regenerate only after reviewing/deleting that locally generated file deliberately. CLI startup/status output contains local keys: do not commit or publish it.

Docker Desktop 29.6.1 did not honor the network's default loopback-binding option during this trial. The binding script recreates only four exactly named B01 containers with explicit `127.0.0.1` bindings, preserving their named volumes and CLI-generated writable files. It uses local untagged Docker image snapshots; it does not upload images. Run it after startup or reset and verify the published addresses with `docker ps`. It refuses unexpected networks. The first workaround lost generated API files; preserving the writable layer fixed this, and all services subsequently passed health checks.

Stop only this stack with `supabase stop --project-id bunchai-b01-local`. Do not use `--all` or `--no-backup` to stop it. Stop the application process separately.

## Configuration boundary

`next.config.ts` refuses startup/build unless local-test mode, the exact approved local API URL, local key fields and `PAYMENTS_ENABLED=false` are present, with payment/LINE/sync secrets empty. Runtime Supabase helpers also reject all other URLs. Local-test mode disables the external integrations even if settings are accidentally inherited. No production credentials were read or copied.

The baseline migration reproduces the existing calculator schema and legacy read policies in isolation. Its authenticated policies are not the replacement platform's accepted authorization model. Anonymous direct table access is denied; the existing lookup route uses a local server key. The synthetic local email/password sign-in/out path is verified. It does not accept the replacement platform's QR/PIN, role or device model. Global `auth.enable_signup=false` blocks public registration; the local email-provider switch is enabled so the pre-created synthetic user can sign in. Both behaviors are explicitly checked by `b01:auth`.

## Tested checks

- Browser form → local lookup API → sample pawn → displayed 200 บาท interest, 28 October; repeated successfully after recovery.
- A traceable `b01.isolation_probe` row writes/reads successfully; a private test-file upload/download matches SHA-256; anonymous direct pawn-table read is denied.
- Exported public schema/data plus a retrieved file and manifest, reset the local database without seeds, restored the data and file, then verified the trace, sample count and file hash.
- Latest tests: **94/94 pass in UTC and Asia/Bangkok**. The two stale UI tests now use the real view-model builder, consistent dates, locked fields, action switching and archived warnings; no calculator component or engine was changed. Historical failures remain recorded in `b01-progress.md`.
- Built-app requests: sample lookup 200/success, payment creation 404, legacy sync 503, Omise webhook 503. These disabled routes performed no external effect.
- Published local ports verified as `127.0.0.1` only. Live calculator still returned 200 and `/staff` 307 to sign-in, around 19:32 Bangkok.

## Repeat the local recovery rehearsal

Only use these commands on this unlinked, disposable B01 stack. The probe script checks its target before writes. Backups are under ignored `supabase/.temp/b01-recovery/`; they contain synthetic data only, and are not production backups.

```sh
npm run b01:recovery
npm run b01:check
npm run b01:auth
```

`b01:recovery` explicitly runs the disposable `--reset-local` command. It refuses a hosted link, remote Docker socket, mismatched current local keys, any pawn other than the single sample I99001, populated staff/payment/review/notification tables, or non-fixture Auth users. Do not use it to preserve later workflow experiments. It archives prior local backup files, exports public schema/data and one retrieved private probe file, resets only this named local stack, waits for all services, restores and verifies rows/file/hash/anonymous denial, and recreates the synthetic Auth fixture. It does not back up Auth history or all Storage objects.

Credentials for the synthetic `b01-staff@example.test` account are generated into ignored `supabase/.temp/b01-auth/fixture.json` with mode 0600; never publish that file or put its password in a report. A reset recreates the fixture and changes its synthetic password. Use the current file only for local manual sign-in. No existing real account password is changed.

Always pass the same network ID to reset. An initial reset omitted it, placing the database on the default network and breaking Storage DNS; the corrected command restored service and passed the rehearsal. Schema is reproduced from the versioned local migration; the schema export is retained as evidence. The data export restores public rows; the separate downloaded-object backup restores the test file. This is a local setup rehearsal, not a production restore, full historical import or proof of preserving future real transactions during rollback.

## Remaining B01 dependencies

The owner-approved engineering configuration, portable B01 scope/source map and issue #13 are in place; guarded branch/PR verification is tracked in b01-git-review-path.md. Desktop 1440×900 and tablet-sized 820×1180 Chrome checks passed for local lookup; staff sign-in, wrong-password rejection, action selection, sign-out and protected-page denial were exercised after recovery. This is viewport testing, not physical iPad, camera, printer, Safari, offline or replacement-platform role acceptance. Legacy English sign-in/menu/error copy was observed and preserved in this compatibility trial; future shop screens must use Thai. Remaining dependencies include the eligible hosted test website path, relevant physical device/browser checks and owner demonstration/feedback/acceptance. No hosted resource, paid upgrade, live migration or cutover has occurred. The old live calculator remains on its existing code and hosting.
