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
| `promoType` | needs the real promo/rate column, or an explicitly approved fallback |

Important: `promoType` is required because the calculation can be `โปร 2%` or
`โปรแสน (1.5%)`. Do not silently guess it for production data.

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
   - `PROMO_COLUMN_LETTER`: the column letter that stores the pawn promotion/rate
   - `DEFAULT_PROMO_TYPE`: optional fallback, only if the business approves one
6. Run `installFiveMinuteTrigger` once.
7. Run `syncPawnRecords` once manually and confirm it returns `ok: true`.
8. In the app, open `/staff/sync-health` and verify:
   - latest run is successful
   - invalid rows are separated from active rows
   - archived rows are visible if any old Pawn IDs disappeared from the sheet

## Current Promotion Blocker

The provided mapping does not include the promotion/rate column. Before this sync
should be used for real customer-visible lookup, choose one:

1. Provide the real promo/rate column from `Loan Stock`.
2. Confirm that the app should derive promotion from amount, matching the old UI:
   `loanAmount >= 100000` -> `โปรแสน (1.5%)`, otherwise `โปร 2%`.
3. Confirm that all synced rows should use one fixed default promotion.

Option 1 is safest.
