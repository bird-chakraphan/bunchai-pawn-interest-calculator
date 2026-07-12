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
| `baseRate` | `Loan Stock!AL` / `Base Percentage` |
| `promoType` | display label derived from `Base Percentage`, such as `โปร 1%`, `โปร 1.5%`, or `โปร 2%` |
| `sourceStatus` | `Loan Stock!AZ` / `Status` |

Important: `Base Percentage` is the source of truth for calculation. The sync
script stores it as `baseRate`, so source values like `1%`, `1.5%`, `2%`,
`0.01`, `0.015`, and `0.02` are calculated directly.

Only rows whose `Status` is exactly `ยังอยู่ในกำหนด` are searchable in the app.
Rows with `ไถ่แล้ว` or `เอาขาด` still sync into Supabase for traceability, but
shared lookup paths treat them as not found.

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
6. Run `installDualFrequencyTriggers` once.
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

Business-hour schedule:

- `08:00` to `17:45`: sync every 15 minutes near `:00`, `:15`, `:30`, `:45`
- all other times: sync hourly near `:00`

Before enabling the production triggers, run `syncPawnRecords` once manually
and review `/staff/sync-health` for invalid source rows.
