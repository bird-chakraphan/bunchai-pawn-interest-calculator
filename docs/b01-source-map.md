# B01 governing-document source map

28 October 2026. The parent Bunchai Shop workspace holds the canonical full shop specification. This public application repository includes the B01 instructions, scope, configuration, runbook and non-sensitive check results required to review the isolated environment.

| Canonical workspace source | Portable repository entry | Use |
| --- | --- | --- |
| AGENTS.md | [AGENTS.md](../AGENTS.md) | Authorized scope, working boundaries and review process |
| docs/implementation-plan.md and B01 packet | [B01 scope](b01-scope.md), [progress](b01-progress.md), [Git review path](b01-git-review-path.md) | B01 outcome, evidence, dependencies and integration boundary |
| CONTEXT.md | [B01 glossary extract](../CONTEXT.md) | Shared terminology only |
| docs/business-rules.md and focused workflow reviews | Not republished in this B01 change | Required before later domain implementation; obtain and review the canonical rules first |
| Dated study/evidence and detailed execution log | [Check summary](b01-local-checks-2026-10-28.json), [runbook](b01-local-runbook.md) | Selected dated environment evidence; no raw records, credentials or backup contents |

The source workspace is arranged with `application/` beside its canonical documents. A reviewer with only this checkout should start with the portable entries above. Do not follow missing parent-workspace links as if they were remote repository files, or substitute the historical Framer-era PROJECT_CONTEXT.md for the current plan.

The full business specification is deliberately not duplicated here. Later workflow work must package the relevant owner-confirmed rules into reviewable repository documents before it starts, without publishing private shop records. Keep this limitation visible rather than inferring policy from legacy source or synthetic fixtures. No new ADR is introduced for routine B01 setup.
