# B01 — isolated environment preparation

28 October 2026, Asia/Bangkok. **In progress; owner acceptance pending.** Parent: [GitHub issue #13](https://github.com/bird-chakraphan/bunchai-pawn-interest-calculator/issues/13).

## Authorized outcome

Prepare a reproducible development/test environment for the existing application, with a test-connected website for later workflow trials. Preserve the existing public and staff calculators, their links and production data. The owner selected sample data first without added paid services. B02 normal-sale design and B03 normal-sale implementation need their own authorization.

The current local trial uses the existing calculator, a real local Supabase database and synthetic records. It checks the environment and recovery path. It does not validate every financial rule or implement a replacement calculator.

## Boundaries

- Continue the existing Next.js/Supabase application and GitHub repository. Vercel remains the intended host; a separate new-platform project is intended, without renaming the legacy project or moving its domains.
- Keep test and production credentials separate. No production credentials, customer data or attachments are copied into this trial or Git.
- AppSheet remains the live writer. Do not change production schema/auth/storage, synchronization ownership, financial records, payments or notifications.
- No paid upgrade or additional paid resource is selected. A hosted target requires verified eligibility, costs and test-only connections, including the initial deployment's actual environment scope.
- Use English for technical discussion and Thai for the application interface, with amounts in บาท.
- Do not merge development changes into live `main`. Follow the guarded development path in [the Git review record](b01-git-review-path.md).

## Completion evidence

| Gate | Required evidence | Current state |
| --- | --- | --- |
| Source | Repository, base revision, preserved unrelated work, reproducible checks | Recorded in [progress](b01-progress.md) |
| Access/targets | Verified GitHub/Vercel/Supabase identities and separate test/live targets | Access verified; local test target selected; hosted test target pending |
| Isolation | Traceable test write/read; application rejects production targets; external effects disabled | Local checks passed |
| Recovery | Repeatable isolated database and private-file export/reset/restore | Local rehearsal passed; not production recovery |
| Website | Reproducible test-connected deployment/access, relevant browser/device checks, existing links | Local owner trial worked; hosted website and device acceptance pending |
| Review | Portable packet, actual integration/production mapping, visible required checks/failures | Setup applied; GitHub review being established |
| Acceptance | Technical checks, owner demonstration, material feedback resolution, acceptance, development integration and durable checkpoint/handoff | Not accepted or integrated |

See [the runbook](b01-local-runbook.md) and [dated check summary](b01-local-checks-2026-10-28.json) for actual commands/results. The two known baseline UI test failures remain visible. Local legacy authenticated read policies are not approval of the replacement platform's authorization model. Node 24.22.1 build/TypeScript, local lookup and recovery verification passed, with the same two baseline test failures. Staff sign-in, real tablets/printing/offline behavior and production recovery remain unverified.

## Review process

Technical verification → owner demonstration/review → resolve material feedback → record acceptance → integrate into the agreed development baseline → durable checkpoint → continuation handoff when needed. A local smoke test or draft PR does not complete B01 or authorize production release. Leave issue #13 open while these conditions remain unmet.

## Source and limits

This is the portable B01 scope extracted from the owner-reviewed workspace plan and B01 packet. [The source map](b01-source-map.md) explains which canonical documents remain outside this public repository. Confirmed target rules take precedence over conflicting legacy code; do not implement unreviewed business rules from the older historical context file.
