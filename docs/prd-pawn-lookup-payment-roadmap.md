# PRD: Bunchai Pawn Interest Lookup And Payment Roadmap

## Problem Statement

Bunchai has a tested pawn interest calculator that currently works as a Framer
Code Component with manual input. Staff and customers still need a safer,
database-backed way to look up a pawn ticket, see the calculated interest, and
eventually let customers pay extension interest online.

The current pawn data lives in Google Sheet/AppSheet. Pawn IDs are sequential and
easy to guess, so public lookup cannot rely on Pawn ID alone. Customers should be
able to look up their own ticket only with Pawn ID plus mobile number. Staff
should be able to use Pawn ID internally after logging in.

Online payment should start with `ต่อดอก` only. `ไถ่ของ` can be calculated and
displayed, but cannot be paid online in the MVP because redemption requires
physical handover and staff handling.

## Solution

Build a proper Next.js application backed by Supabase. Keep Framer only as the
marketing/public website if desired, linking to the app for the secure workflow.

The new app will launch in three phases:

1. Staff calculator and lookup.
2. Customer lookup calculator.
3. Customer online payment for `ต่อดอก` through Omise.

Google Sheet/AppSheet remains the source system for pawn records during MVP.
Supabase receives scheduled copies of pawn data every 5 minutes. Supabase owns
app data such as staff accounts, lookup attempts, calculation snapshots, Omise
payment records, staff review state, LINE notification state, and audit logs.

The current calculation logic must be extracted into a tested pure module and
preserved across all app flows.

## User Stories

1. As a staff user, I want to log in with my own account, so that staff actions
   can be audited.
2. As a staff user, I want to enter a Pawn ID, so that I can retrieve the current
   pawn details from the synced database.
3. As a staff user, I want to see the latest synced pawn data, so that I know the
   calculation is based on the current Google Sheet/AppSheet source.
4. As a staff user, I want to see the last sync time, so that I can judge whether
   data is fresh enough.
5. As a staff user, I want to calculate `ต่อดอก`, so that I can tell the customer
   the extension interest due.
6. As a staff user, I want to calculate `ไถ่ของ`, so that I can tell the customer
   the principal plus interest needed to redeem in person.
7. As a staff user, I want a manual calculator mode, so that I can calculate
   interest even when a pawn record is not in the database.
8. As a staff user, I want manual calculator inputs for start/latest renewal
   date, loan amount, promotion, and action type, so that I can reproduce the
   current Framer calculator behavior.
9. As a staff user, I want invalid pawn records to be visible as sync warnings,
   so that source data can be corrected.
10. As a staff user, I want records missing from the latest Google Sheet sync to
    be archived, not deleted, so that history is preserved.
11. As a staff user, I want archived records to be clearly marked, so that I do
    not accidentally treat stale records as active.
12. As a customer, I want to enter Pawn ID and mobile number, so that I can
    securely look up my pawn interest.
13. As a customer, I want lookup to fail safely if my mobile number does not
    match, so that other customers cannot guess my ticket details.
14. As a customer, I want lookup to be blocked if the pawn record has no mobile
    number, so that I am instructed to contact the branch.
15. As a customer, I want to see `กรุณาติดต่อสาขา` when online lookup is not
    available, so that I know the next action.
16. As a customer, I want to see a safe loan summary, so that I can verify I am
    viewing the right pawn ticket.
17. As a customer, I want to see `ต่อดอก` calculation, so that I know how much
    interest is due.
18. As a customer, I want to see `ไถ่ของ` calculation, so that I know the
    in-person redemption amount.
19. As a customer, I want to use a manual calculator without lookup, so that I
    can estimate interest without revealing private data.
20. As a customer, I want the app to explain when redemption is blocked, so that
    I understand when a ticket is beyond the allowed period.
21. As a customer, I want to pay only `ต่อดอก` online, so that I can renew my
    pawn contract without visiting the shop.
22. As a customer, I want the online payment amount to be recalculated by the
    server, so that the payment amount is trustworthy.
23. As a customer, I want to pay through Omise, so that I can use the payment
    provider Bunchai already has.
24. As a customer, I want clear success/failure payment states, so that I know
    whether my payment was received.
25. As a staff user, I want a payment review queue, so that I can manually update
    Google Sheet/AppSheet for MVP.
26. As a staff user, I want paid extension payments to be marked
    `paid_pending_staff_review`, so that I know which records need action.
27. As a staff user, I want LINE notifications in one shared staff group, so that
    the team sees new paid extension records quickly.
28. As a staff user, I want LINE notification failures to be retryable, so that a
    notification issue does not break payment recording.
29. As a staff user, I want to mark a payment as reviewed, so that the app records
    that staff handled the manual AppSheet update.
30. As a staff user, I want staff approval in the app and manual AppSheet update
    in MVP, so that the payment workflow is safe before automation.
31. As the business owner, I want the same Pawn ID to support repeated payments,
    so that customers can pay extension interest again and again.
32. As the business owner, I want each payment to store its own calculation
    snapshot, so that historical payment amounts remain explainable after source
    records change.
33. As the business owner, I want payment state separated from renewal state, so
    that a paid payment can still wait for staff review.
34. As the business owner, I want the future option to automatically update the
    renewal date after payment, so that the workflow can become more efficient
    once proven.
35. As an implementer, I want calculation tests from the existing workbook, so
    that the rebuild preserves the heavily tested logic.
36. As an implementer, I want sync logs and audit logs, so that operational
    failures are diagnosable.

## Implementation Decisions

- Use Next.js, React, and TypeScript for the app.
- Use Supabase Postgres for staff accounts, synced pawn records, lookup attempts,
  sync logs, calculation snapshots, payments, review tasks, notification state,
  and audit logs.
- Keep Google Sheet/AppSheet as the MVP source system for pawn records.
- Sync Google Sheet data into Supabase every 5 minutes.
- The sync should upsert new and edited records by Pawn ID.
- If a Supabase pawn record disappears from the Google Sheet, mark it
  `archived_from_source` instead of deleting it.
- Do not let Google Sheet sync delete or overwrite app-owned payment history.
- Use individual staff accounts from the beginning.
- Staff can look up by Pawn ID after login.
- Customers must use Pawn ID plus mobile number.
- If mobile is missing for a pawn record, block customer lookup/payment and show
  `กรุณาติดต่อสาขา`.
- Online payment is only for `ต่อดอก` in the MVP.
- `ไถ่ของ` remains calculation-only and must be handled in person.
- Use Omise for payment.
- Payment amount must be recalculated server-side before creating an Omise
  payment.
- Omise webhook confirmation is the source of truth for paid status.
- Store each payment as a repeatable payment record tied to the long-lived pawn
  contract.
- Store `paid_at`, `effective_renewal_date`, `start_date_before_payment`,
  `calculation_snapshot`, and Omise IDs on each payment.
- In MVP, after payment confirmation, mark renewal as pending staff review.
- In MVP, staff manually updates Google Sheet/AppSheet after reviewing payment in
  the app.
- The next scheduled sync updates Supabase's current start/latest renewal date
  from Google Sheet/AppSheet.
- Long-term, the app should support automatic renewal after payment confirmation.
- Send LINE Messaging API notification to one shared staff group after confirmed
  Omise payment and review task creation.
- If LINE sending fails, preserve the payment and mark notification failure for
  retry.
- Extract the existing interest rules into a pure calculation engine that accepts
  typed inputs and returns typed calculation results.
- The calculation engine is a deep module and should not depend on UI, Supabase,
  Google Sheet, Omise, or LINE.
- Keep manual calculator mode in both staff and customer-facing surfaces.

## Testing Decisions

- Tests should focus on external behavior: given start date, current date, loan
  amount, promotion, and action type, the result should match the expected mode,
  month count, overdue days, interest amount, status, and formula behavior.
- Do not test implementation details such as internal loop structure or CSS.
- The calculation engine needs comprehensive unit tests.
- Tests should cover all workbook review cases from the current project.
- Tests should cover end-of-month fallback, including leap year behavior.
- Tests should cover `ต่อดอก` normal promo, penalty 3%, and boundary dates.
- Tests should cover `ไถ่ของ` normal promo, weekly 1%, and blocked redemption.
- Tests should cover `Math.ceil` rounding behavior.
- Sync tests should verify create, update, archive-from-source, invalid row
  handling, duplicate Pawn ID handling, and sync log creation.
- Customer lookup tests should verify phone match, phone mismatch, missing mobile,
  archived record, and rate-limited lookup attempts.
- Payment tests should verify server-side recalculation, Omise payment creation,
  webhook confirmation, idempotency, repeated payments for the same Pawn ID, and
  payment/renewal status separation.
- Notification tests should verify LINE send success, LINE send failure, and
  retryable notification status.
- Admin review tests should verify staff can mark a confirmed payment as reviewed
  without directly mutating Google Sheet in MVP.

## Out of Scope

- Online payment for `ไถ่ของ`.
- Automatic renewal date update in Phase 3 MVP.
- Direct writeback to Google Sheet/AppSheet in MVP.
- Replacing AppSheet as the staff business system.
- Native mobile apps.
- Customer accounts/passwords.
- Public exposure of full pawn record data.
- Reworking the established pawn interest calculation rules.
- Framer Code Component maintenance except as a reference/source artifact.

## Further Notes

- The current local folder is not a Git checkout and has no package or TypeScript
  config.
- The GitHub repository named by the user is
  `bird-chakraphan/bunchai-pawn-interest-calculator`.
- GitHub issue publishing was completed on 2026-06-18 after creating the
  `ready-for-agent` label.
- The parent PRD issue is GitHub issue #1.
- The current calculation logic is logged separately in
  `docs/current-calculation-logic.md`.

## Proposed Deep Modules

- Interest calculation engine: pure date/rate/action calculation.
- Pawn source sync: imports Google Sheet rows into app-owned pawn records.
- Lookup authorization: controls staff and customer lookup behavior.
- Staff account and audit module: identity, roles, and action history.
- Payment orchestration: server-side calculation snapshot, Omise creation, and
  webhook confirmation.
- Review task workflow: pending staff review, reviewed state, and future
  automation hook.
- Notification delivery: LINE message creation, send, failure, and retry.
