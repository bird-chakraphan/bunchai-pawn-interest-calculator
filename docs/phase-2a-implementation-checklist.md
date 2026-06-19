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
- [x] Add Supabase packages
- [x] Add environment helpers for public/server config
- [x] Add browser/server Supabase client factories
- [x] Add `.env.example`

### 2. Data model
- [x] Define `pawn_records` app model in TypeScript
- [x] Add initial Supabase schema SQL for:
  - `pawn_records`
  - `staff_profiles`
  - `sync_runs`
- [x] Add lookup-oriented indexes and uniqueness on `pawn_id`

### 3. Staff auth shell
- [x] Add `/staff/sign-in`
- [x] Add sign-in server action
- [x] Add protected `/staff` layout guard
- [x] Add sign-out action
- [x] Show setup-safe fallback when Supabase env is missing

### 4. Staff lookup flow
- [x] Add pawn ID search form
- [x] Add server-side pawn record lookup by `pawn_id`
- [x] Show pawn detail summary
- [x] Show both `ต่อดอก` and `ไถ่ของ` calculations from one record
- [x] Keep manual calculator mode available from staff area

### 5. TDD verification
- [x] Tracer bullet test for staff lookup calculation mapping
- [x] Green implementation for lookup calculation helper
- [-] Add test for lookup UI empty/not-found/found states where practical
- [x] Run test suite
- [x] Run production build

### 6. GitHub / issue hygiene
- [ ] Verify actual git worktree for this project
- [ ] Commit and push completed Phase 1 work
- [ ] Close done Phase 1 issue(s)

## Current blockers

- The current folder is not a git worktree, so push/close workflow cannot be completed from here yet.
- Supabase project credentials are not configured yet, so auth/data flow must be scaffolded in a setup-safe way.
