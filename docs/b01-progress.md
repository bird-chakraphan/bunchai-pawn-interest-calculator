# B01 — source/baseline checkpoint

**Latest owner decision — 29 October:** continue sample-data testing only in the existing isolated local stack `bunchai-b01-local`. The final shop system and calculator will share the existing paid Supabase project. Do not create another cloud project for now, activate the Vercel trial, add a payment method or change production. An empty Free test organization was created during the earlier approved attempt; no cloud test database/project was provisioned and the organization remains unused. The earlier Free-project proposal is superseded. Hosted test-site readiness and final B01 acceptance remain pending; this decision does not authorize a production connection or complete the batch.

28 October 2026, Asia/Bangkok. **Partial / in progress; not accepted.**

This is the existing `bird-chakraphan/bunchai-pawn-interest-calculator` repository. B01 uses local branch `codex/b01-isolated-environment`, based on live/main commit `bc041a1cd2b864ca9afe261a0bcc7f290dd91b07`. The sibling older jewelry checkout was preserved. GitHub batch issue #13 is open. The guarded development integration branch is published at c35f03440dcbcd9114a1daf70202dffff3da5ac7. The owner explicitly approved the reviewed public upload. B01 snapshot 479f8423ccd37d0dd57071031536c54cc0ed569d is published on codex/b01-isolated-environment and [draft PR #14](https://github.com/bird-chakraphan/bunchai-pawn-interest-calculator/pull/14) targets development integration; no hosted provisioning or deployment has occurred. Local-only sample-data infrastructure has now been created and verified.

## Current local result

The local sample-data application is available at `http://127.0.0.1:3000`. The owner authorized an unattended **B01-only** queue on 29 October. See [the current overnight report](b01-overnight-2026-10-29.md) and [startup/recovery runbook](b01-local-runbook.md). All 94 tests pass in UTC and Bangkok; TypeScript passes. The two baseline failures were stale tests following a deliberate historical UI simplification; tests now cover actual locked fields, renewal/redemption selection and expiry warnings using the real view model. No calculator component or engine changed.

Development-only GitHub CI now checks tests in both timezones, TypeScript and a build with nonfunctional local placeholders; run 40743216730 passed at revision 6dceeb43ec5c6e35bcd6406daf0fb2abb03d1f8a. Local startup/health/recovery commands verify exact unlinked targets/current local keys, withhold command output containing keys and refuse remote Docker/unsafe configuration. The local email-provider setup was repaired while keeping public registration disabled. Synthetic sign-in/out, authenticated sample read, wrong-password rejection and signed-out denial passed. A full local public-data/private-probe recovery command passed after adding service-readiness checks; Auth history/full-media recovery is not claimed.

Browser staff/customer lookup passed after recovery at desktop/tablet-sized widths. Physical device checks, eligible hosted test resources/site, final owner acceptance and development integration remain pending. PR #14 stays draft and targets development integration; no production release is authorized.


## Current local acceptance checkpoint

The owner resumed B01 and requested completion on 29 October. Eight services were healthy; the stopped sample app was restarted from its existing local-key build on loopback. Fresh guarded health/Auth/recovery-probe readback and browser sample lookup passed. No reset, calculator change, live data/sync change or new cloud resource was needed. [The acceptance packet](b01-review-2026-10-29.md) presents the concrete local demonstration and recommends explicitly amending B01 to local readiness with hosted setup deferred. The owner has not yet accepted that amendment/result; issue #13 stays open and PR #14 unmerged until acceptance and development integration.

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
