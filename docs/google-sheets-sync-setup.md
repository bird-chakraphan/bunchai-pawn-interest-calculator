# Google Sheets Sync Setup

This is the non-payment MVP sync path. Google Sheets remains the working source
for pawn records, and the app receives a fresh operational copy in Supabase.

## Source Mapping

Spreadsheet:

`https://docs.google.com/spreadsheets/d/1QZmlv3x0jQ7g946X1fTy4DXrHvmJOcicXsOc4YKHXnw/edit`

Loan tab:

`Loan Stock`

| App field | Sheet source |
| --- | --- |
| `pawnId` | `Loan Stock!A` / `Loan ID` |
| `loanAmount` | `Loan Stock!AK` / `Total Loan Amount` |
| `startDate` | `Loan Stock!AP` / `Latest Renewal Date` |
| customer join key | `Loan Stock!AM` / `Customer Name`, which is actually Customer ID |
| `customerPhone` | join `Loan Stock!AM` to `Customer!A`, then use `Customer!F` / `Phone Number` |
| `promoType` | `Loan Stock!AL` / `Base Percentage` |

Important: `promoType` is required because the calculation can be `โปร 2%` or
`โปรแสน (1.5%)`. The sync script maps `2%`, `2`, or `0.02` to `โปร 2%`, and
maps `1.5%`, `1.5`, or `0.015` to `โปรแสน (1.5%)`.

## Apps Script

Use [scripts/google-sheets-pawn-sync-apps-script.js](/Users/chakraphanhiranwongwira/Documents/Codex/Projects/Pawn-Interest-Calculator/scripts/google-sheets-pawn-sync-apps-script.js:1)
as the Google Apps Script source.

Setup steps:

1. Open the Google Sheet.
2. Go to `Extensions` -> `Apps Script`.
3. Paste the full script into `Code.gs`.
4. Open `Project Settings` -> `Script Properties`.
5. Add:
   - `APP_SYNC_ENDPOINT`: `https://your-domain.com/api/internal/sync/pawn-records`
   - `INTERNAL_SYNC_SECRET`: same value as the app environment variable
   - `PROMO_COLUMN_LETTER`: optional override; default is `AL`
   - `DEFAULT_PROMO_TYPE`: optional fallback, only if `Base Percentage` is blank
6. Run `installFiveMinuteTrigger` once.
7. Run `syncPawnRecords` once manually and confirm it returns `ok: true`.
8. In the app, open `/staff/sync-health` and verify:
   - latest run is successful
   - invalid rows are separated from active rows
   - archived rows are visible if any old Pawn IDs disappeared from the sheet

## Real Sync Readiness

The source mapping is now complete for calculation:

- pawn ID
- loan amount
- latest renewal date
- base percentage / promotion
- customer phone through the Customer sheet join

Before enabling the 5-minute trigger in production, run `syncPawnRecords` once
manually and review `/staff/sync-health` for invalid source rows.
