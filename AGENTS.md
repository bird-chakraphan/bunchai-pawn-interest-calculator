# Bunchai Shop application instructions

## Current authorized scope
The owner started B01 isolated environment preparation on 28 October 2026 and selected sample data first with no added paid service. Normal-sale design is B02; normal-sale implementation is B03. Do not start those workflows, real shop transactions or production release from B01 authorization.

The pawn calculator remains a separate application/service from the new shop system; shared database use is intended in the appropriate environment. Do not fold it into the new shop interface or reorganize source/deployment boundaries without a reviewed decision.

## Read before working
Read docs/b01-progress.md, docs/b01-local-runbook.md and docs/b01-git-review-path.md. Read the portable docs/b01-scope.md and docs/b01-source-map.md. The canonical workspace plan, batch packet, glossary and owner-confirmed business rules are linked from b01-progress.md; full rules are not yet packaged in this public checkout. Read the relevant canonical rules before domain changes; do not treat the old Framer-era PROJECT_CONTEXT.md as current architecture evidence.

Latest explicit owner instructions govern. Confirmed target rules take precedence over contradictory legacy code/formulas. Preserve unresolved policy questions and historical financial records; do not invent policy or silently recalculate history.

## Working boundaries
- Use English for project discussion/reports and Thai for the end-user interface, with currency expressed in บาท.
- Preserve the public and staff calculators, their existing links and live production data.
- Use only the named, unlinked local B01 test stack until a hosted test target and its eligibility/costs are selected. Never copy production credentials into local/Preview configuration or put secrets/backups/private records in Git.
- Keep payments, notifications and legacy Sheet sync disabled in local-test mode. Do not change production schema/auth/storage or legacy writer ownership.
- Keep B01 and replacement-platform work on reviewed development branches. Do not merge routine work into the live auto-deploy branch or change domains/legacy hosting traffic.
- Use applicable Supabase/Postgres/Vercel skills and current platform documentation. Complete engineering-skill setup before dependent issue/TDD workflows.
- Verify meaningful isolation, permissions, repeatability and recovery checks. Preserve known baseline failures visibly; do not remove assertions merely to obtain a green result.
- Record confirmed decisions, proposals and unresolved questions separately. CONTEXT.md is glossary-only; business rules and implementation state have separate canonical records. Create ADRs only for consequential hard-to-reverse decisions.
- Do not create/message other Codex chats, spawn agents or send messages to other people unless the owner explicitly authorizes them.

## Batch review
Technical verification precedes owner demonstration/review. Resolve material feedback, record acceptance, integrate into the agreed development baseline, save the durable checkpoint and then prepare Handoff. A successful local test or branch-only result does not complete B01 or authorize production release.

## Agent skills

### Issue tracker
GitHub Issues in bird-chakraphan/bunchai-pawn-interest-calculator; one parent per batch with useful sub-issues/checklists. See docs/agents/issue-tracker.md.

### Triage labels
Standard role labels; preserve the existing ready-for-agent convention. See docs/agents/triage-labels.md.

### Domain docs
Single shared shop context; glossary, business rules and implementation records have separate purposes. See docs/agents/domain.md.
