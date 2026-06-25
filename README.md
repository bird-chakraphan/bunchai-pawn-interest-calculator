# Pawn Interest Calculator

Next.js app for Bunchai pawn interest calculation, staff/customer pawn lookup,
and the planned online renewal payment workflow.

## Current MVP Focus

The current working target is the non-payment MVP:

- staff sign-in
- staff Pawn ID lookup and calculation
- public manual calculation
- customer Pawn ID + phone lookup and calculation
- Google Sheet to Supabase sync

Online payment code is present for the roadmap, but it is disabled by default
with `PAYMENTS_ENABLED=false`.

## Setup

1. Copy `.env.example` to `.env.local`.
2. Fill Supabase values.
3. Keep `PAYMENTS_ENABLED=false` until Omise is ready.
4. Run `npm run dev`.

## Google Sheet Sync

The sync is implemented as Google Apps Script pushing into:

`POST /api/internal/sync/pawn-records`

Setup notes live in
[docs/google-sheets-sync-setup.md](/Users/chakraphanhiranwongwira/Documents/Codex/Projects/Pawn-Interest-Calculator/docs/google-sheets-sync-setup.md:1).

## Legacy Reference

- [src/PawnInterestCalculator.tsx](/Users/chakraphanhiranwongwira/Documents/Codex/Projects/Pawn-Interest-Calculator/src/PawnInterestCalculator.tsx:1):
  original Framer-compatible calculator reference.
- [scripts/build_pawn_interest_sheet.mjs](/Users/chakraphanhiranwongwira/Documents/Codex/Projects/Pawn-Interest-Calculator/scripts/build_pawn_interest_sheet.mjs:1):
  spreadsheet review generator.
