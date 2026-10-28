# B01 — source/baseline checkpoint

28 October 2026, Asia/Bangkok. **Partial / in progress; not accepted.**

This is the existing `bird-chakraphan/bunchai-pawn-interest-calculator` repository. B01 uses local branch `codex/b01-isolated-environment`, based on live/main commit `bc041a1cd2b864ca9afe261a0bcc7f290dd91b07`. The sibling older jewelry checkout was preserved. GitHub batch issue #13 is open. The guarded development integration branch is published at c35f03440dcbcd9114a1daf70202dffff3da5ac7. The owner explicitly approved the reviewed public upload. B01 snapshot 479f8423ccd37d0dd57071031536c54cc0ed569d is published on codex/b01-isolated-environment and [draft PR #14](https://github.com/bird-chakraphan/bunchai-pawn-interest-calculator/pull/14) targets development integration; no hosted provisioning or deployment has occurred. Local-only sample-data infrastructure has now been created and verified.

## Current local result

The local sample-data application is available at `http://127.0.0.1:3000`. See [the startup/recovery runbook](b01-local-runbook.md) and [check summary](b01-local-checks-2026-10-28.json). Browser lookup, trace write/read, private-file hash recovery and anonymous-table rejection passed before/after local reset/restore. Build/TypeScript pass; 81/83 tests pass, retaining the same two baseline UI failures. The owner confirmed the local trial works and approved AGENTS.md plus the reviewed engineering setup. Node 24.22.1 additionally passes build/TypeScript, the same 81/83 tests, local sample lookup and restored trace/file/anonymous-access checks. GitHub feature publication and the draft PR are now complete. Hosted test deployment and final owner acceptance remain pending.

## Portable review packet

Start with [B01 scope/acceptance](b01-scope.md), [the source map](b01-source-map.md), [repository instructions](../AGENTS.md) and [the B01 glossary extract](../CONTEXT.md). Parent issue: [#13](https://github.com/bird-chakraphan/bunchai-pawn-interest-calculator/issues/13). Engineering setup is applied in AGENTS.md and docs/agents/; this does not authorize other batches.

## Governing local records

In this B01 workspace the canonical documents are available beside the application checkout:

- [Project instructions](../../AGENTS.md)
- [Implementation plan](../../docs/implementation-plan.md)
- [B01 scope and acceptance](../../docs/batches/B01-isolated-environment-preparation.md)
- [Detailed execution evidence and dependencies](../../docs/batches/B01-execution-2026-10-28.md)
- [Glossary](../../CONTEXT.md)
- [Confirmed business rules](../../docs/business-rules.md)

These relative links intentionally resolve in the local `Bunchai Shop/application` layout. The portable B01 entries above are available in this repository; full business-rule documents remain outside it and must be obtained/reviewed before later domain work. The old Framer-era `PROJECT_CONTEXT.md` is historical and conflicts with current package/source facts. Current owner-confirmed shop rules take precedence.

Project communication and technical reports are English. The end-user interface remains Thai, with currency expressed using บาท.

## Historical baseline checks

The following commands describe the original source baseline, before fail-closed local-test configuration was introduced. For the current branch, first create the approved local stack and generated `.env.local` using the [runbook](b01-local-runbook.md); a bare build intentionally refuses missing local configuration. Never use production credentials.

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm test
./node_modules/.bin/tsc --noEmit --incremental false
npm run build
```

Observed with Node 26.0.0/npm 11.12.1; legacy Vercel specifies Node 24.x. The follow-up Node 24.22.1 verification passed build/TypeScript and retained the same 81/83 test outcome. Network access to Google Fonts is required by the unchanged build. Existing locked versions and lockfile remain intact.

- TypeScript and network-enabled production build passed.
- Test alias resolution failed for paths containing spaces. `vitest.config.ts` now uses Node's `fileURLToPath` rather than URL `.pathname`; no application logic changed.
- After that fix, **68 of 70 tests pass**. Two unchanged `ManualCalculator` staff-lookup tests fail at missing text `สรุปทั้งสองรายการจากข้อมูลใบจำนำ`: `renders locked prefilled fields for staff lookup mode` and `marks archived staff records clearly`. Assertions after that point remain unverified.
- Existing Next.js middleware deprecation warning remains; no framework migration is in B01.
- Legacy public URL returned 200; `/staff` returned 307 to sign-in. No real customer query or transaction submitted.

## Owner-selected immediate test path

The owner confirmed sample data first and free internal testing on 28 October. Prepare local Supabase/application trials with production-independent credentials and no added paid services. A Vercel-hosted site still requires an eligible plan/path; sample data alone does not establish Hobby permission. Local progress is not completion of the agreed B01 hosted-website, isolation/recovery and owner-acceptance target.

## Isolation and review prerequisites

The ignored mode-0600 `.env.local` contains only keys generated from the local stack. No production credentials were read/copied; no hosted Supabase or `.vercel` link exists. The new config/runtime guards reject hosted database URLs. Do not copy credentials from the older checkout or legacy Vercel project.

GitHub connector access works; local `gh` token is invalid. Vercel access was restored by owner consent. The legacy project deploys `main`; its Preview and Production share six sensitive env-variable scopes. Their values were not read. **Do not push any branch until the legacy Preview trigger is accounted for**; non-main alone is not sufficient isolation.

Supabase connector access was restored after owner reconnection. Correct organization: `h-and-double-h-design` (`abbumqvqsphqgqreaoae`), currently Pro; production project `xbvfdqhcrdrkjldvxcpb` is active/healthy. Read-only schema metadata lists ten public tables with RLS enabled and empty migration history. No production schema, policies or records changed.

A second hosted project in this paid organization adds compute costs under the [billing guidance](https://supabase.com/docs/guides/platform/billing-faq); no paid test resource has been selected or created. Current usage/allowances, isolated setup and recovery proof remain pending.

Vercel's team is Hobby; eligibility for this business test website is unresolved under the [published plan restriction](https://vercel.com/docs/plans/hobby). No paid upgrade is selected. No new-platform hosting project or hosted test database exists; the local stack is isolated and verified.

Engineering-skill configuration is applied and B01 GitHub issue #13 is open. The integration branch is published with the deployment safeguard; no new Vercel deployment was listed afterward. After explicit owner approval, the exact 26-file snapshot was published and draft PR #14 opened against codex/bunchai-integration. Its tree matches the reviewed local snapshot; no private keys/backups were published. The first remote check read returned zero check runs/statuses, so no CI pass is claimed. Hosted website and device evidence remain outstanding. The local-only migration, sample-data server, fixture/write/read, production-target rejection and database/file restore/reset now have evidence in the runbook. Technical verification must precede owner demonstration/acceptance; this checkpoint is not batch completion.
