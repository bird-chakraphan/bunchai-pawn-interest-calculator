# Phase 2A Implementation Checklist

Status key:
- `[ ]` not started
- `[-]` in progress
- `[x]` done

## Scope

Build the first internal staff flow on top of the Phase 1 calculator foundation:
- staff sign in
- protected staff area
- pawn ID lookup
- Supabase-ready pawn record model
- shared calculation engine reuse

## Slice Checklist

### 1. Supabase foundation
- [ ] Add Supabase packages
- [ ] Add environment helpers for public/server config
- [ ] Add browser/server Supabase client factories
- [ ] Add `.env.example`

### 2. Data model
- [ ] Define `pawn_records` app model in TypeScript
- [ ] Add initial Supabase schema SQL for:
  - `pawn_records`
  - `staff_profiles`
  - `sync_runs`
- [ ] Add lookup-oriented indexes and uniqueness on `pawn_id`

### 3. Staff auth shell
- [ ] Add `/staff/sign-in`
- [ ] Add sign-in server action
- [ ] Add protected `/staff` layout guard
- [ ] Add sign-out action
- [ ] Show setup-safe fallback when Supabase env is missing

### 4. Staff lookup flow
- [ ] Add pawn ID search form
- [ ] Add server-side pawn record lookup by `pawn_id`
- [ ] Show pawn detail summary
- [ ] Show both `ต่อดอก` and `ไถ่ของ` calculations from one record
- [ ] Keep manual calculator mode available from staff area

### 5. TDD verification
- [ ] Tracer bullet test for staff lookup calculation mapping
- [ ] Green implementation for lookup calculation helper
- [ ] Add test for lookup UI empty/not-found/found states where practical
- [ ] Run test suite
- [ ] Run production build

### 6. GitHub / issue hygiene
- [ ] Verify actual git worktree for this project
- [ ] Commit and push completed Phase 1 work
- [ ] Close done Phase 1 issue(s)

## Current blockers

- The current folder is not a git worktree, so push/close workflow cannot be completed from here yet.
- Supabase project credentials are not configured yet, so auth/data flow must be scaffolded in a setup-safe way.
