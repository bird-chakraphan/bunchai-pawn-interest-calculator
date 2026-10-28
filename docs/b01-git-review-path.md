# B01 Git and deployment review path

28 October 2026. The owner-approved engineering setup is applied and batch issue #13 is open. The guarded integration branch now exists; B01 feature publication is blocked by automatic approval review pending explicit approval of the exact upload; the draft PR has not been created.

## Verified baseline

- Existing remote branches: `main` at `bc041a1cd2b864ca9afe261a0bcc7f290dd91b07` and `codex/jewelry-staff-foundation` at `a0799af0e936a7cf87dc3ceb575a03b3ea09fe23`, both unprotected.
- The live calculator uses `main`. Its legacy Preview and Production scopes share sensitive environment-variable names; values have not been read/copied.
- GitHub connector access works. Local `gh` authentication remains invalid; prefer the connector where sufficient.
- Existing labels include `ready-for-agent` and `wontfix`. The proposed `needs-triage`, `needs-info` and `ready-for-human` labels are absent. Preserve the existing labels; create missing role labels only when the setup review is resolved.

## Branch safeguard

`vercel.json` disables automatic Git deployments for the existing local `codex/b01-isolated-environment` branch and the new development namespace `codex/bunchai-*`. The proposed integration branch is `codex/bunchai-integration`; future replacement-platform feature branches can use the same namespace.

Unspecified branches retain Vercel's default behavior, so this file does not select a different behavior for `main` or the older jewelry branch. No legacy dashboard settings, deployed files, aliases or credentials have changed.

The local app's build/runtime guards separately reject hosted database URLs. This protects against using inherited production connections even if a build is attempted outside the intended Git path.

Vercel applies repository configuration to connected projects, so these Git-deployment rules also apply to a future new-platform project using these branches. That project's test deployment must use a separately reviewed manual/API path initially, or explicitly revisit the branch policy after test-only connections are verified. No hosted deployment is cleared by this file.

Source: [Vercel Git configuration](https://vercel.com/docs/project-configuration/git-configuration#git.deploymentenabled), read 28 October. Remote behavior must still be checked after the guarded branch is published; a local JSON check alone is not evidence that the remote platform skipped a deployment.

## Next review steps

1. Finish the required engineering-skill setup review and apply the agreed root instruction file and `docs/agents/` configuration.
2. Package a portable B01 packet and governing-document source map for this public repository, excluding private records, credentials and backups.
3. Create the B01 parent issue with the verified local results, remaining hosted/owner-review gates and a useful checklist. Keep it open while incomplete.
4. The integration branch was established at `c35f03440dcbcd9114a1daf70202dffff3da5ac7`, with only the safeguard added to live/main. Publish B01 with the safeguard present and verify no unintended legacy deployment was triggered.
5. Open a draft PR to the development integration branch. Keep the live `main` branch unchanged. Record actual remote revisions and check results; do not invent a green CI status or hide the two known UI test failures.
6. Integrate only after the applicable review/acceptance conditions are met. B01 still requires an eligible hosted test-site path and final owner acceptance.

## Applied setup checkpoint

AGENTS.md and docs/agents/ are applied after owner approval. [Issue #13](https://github.com/bird-chakraphan/bunchai-pawn-interest-calculator/issues/13) is the open parent. Standard role mappings are configured; the three missing role labels are not needed for this in-progress parent and have not been created. The existing enhancement label is used. Full shop business rules are not published; the portable B01 scope/source map and glossary extract define this review boundary.

The GitHub connector publishes reviewed content with the connected account identity. Earlier local commits are retained locally and are not uploaded, avoiding publication of their automatically derived machine email. The remote B01 commit will be based on the guarded integration commit; compare tree contents rather than assuming local and remote commit IDs are identical.

## Remote verification and publication boundary

After creating the integration branch, Vercel still listed only the four existing deployments; the live deployment remains dpl_96XQWXErbKZddZutFP2puFufyYyC from main at bc041a1cd2b864ca9afe261a0bcc7f290dd91b07. Live public/staff entry points returned 200 and 307 to /staff/sign-in. There is no B01 feature branch or draft PR yet and no remote CI result is claimed.

Automatic approval review rejected the create-tree operation for the 26-file B01 bundle because publishing application code, infrastructure scripts, local schema, operational metadata and test configuration to this public repository requires explicit payload-and-destination approval. No alternate upload path was attempted. The local publication-review manifest and patch are saved in the parent workspace. Continue only after approval of that reviewed payload; keep main unchanged and open the PR against codex/bunchai-integration.

## Owner-approved Projects and naming

Bunchai Shop System (https://github.com/users/bird-chakraphan/projects/1) contains #13 in In Progress. Pawn Calculator (https://github.com/users/bird-chakraphan/projects/2) contains all calculator issues #1–#12: eight closed/completed in Done, and four open backlog items #9–#12 in Backlog. Both boards remain private and are linked to this repository. Titles use [SHOP B01] for the current shop batch and [CALC] for existing calculator issues. Future dedicated shared database issues use [SHARED DB] and can belong to both boards. Area labels are not used. Existing descriptions, state/reason and label sets were verified unchanged. This approved issue organization does not approve the separate public code payload.
