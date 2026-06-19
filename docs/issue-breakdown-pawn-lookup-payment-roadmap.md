# Draft Issue Breakdown: Pawn Lookup And Payment Roadmap

This `to-issues` breakdown was published to GitHub Issues on 2026-06-18.

Parent PRD issue title:

```text
PRD: Bunchai Pawn Interest Lookup And Payment Roadmap
```

Triage label:

```text
ready-for-agent
```

## Proposed Vertical Slices

## Published GitHub Issues

- #1: PRD: Bunchai Pawn Interest Lookup And Payment Roadmap
- #2: Establish app foundation with tested calculation engine
- #3: Add individual staff login and audit-friendly session state
- #4: Sync Google Sheet pawn records into Supabase every 5 minutes
- #5: Deliver staff Pawn ID lookup with both action calculations
- #6: Add staff sync health and data quality review
- #7: Deliver customer lookup with Pawn ID and mobile verification
- #8: Add public manual calculator mode
- #9: Create Omise payment for customer ต่อดอก only
- #10: Verify Omise webhooks and record paid pending staff review
- #11: Notify shared staff LINE group for paid pending review
- #12: Add staff payment review queue for manual AppSheet update

### 1. Establish App Foundation With Tested Calculation Engine

Type: AFK

Blocked by: None

User stories covered: 1, 5, 6, 7, 8, 35

What to build:

Create the Next.js/Supabase-ready app foundation and extract the current pawn
interest rules into a pure, tested calculation engine. The app should be able to
run the current manual calculator behavior from typed inputs before any database
or payment integration is added.

Acceptance criteria:

- [ ] A developer can run the app and test suite locally.
- [ ] The calculation engine accepts start date, current date, loan amount,
      promotion, and action type and returns the expected calculation result.
- [ ] Tests cover the existing workbook review cases and key boundary rules.
- [ ] Manual calculation can be exercised in a basic UI or dev route.

### 2. Add Individual Staff Login And Audit-Friendly Session State

Type: AFK

Blocked by: 1

User stories covered: 1, 36

What to build:

Add individual staff authentication so every internal lookup and later payment
review action can be attributed to a staff user. Provide a minimal signed-in
staff shell that future staff tools can use.

Acceptance criteria:

- [ ] Staff users can sign in and sign out individually.
- [ ] Protected staff pages cannot be accessed while signed out.
- [ ] Staff identity is available to server actions/API handlers.
- [ ] The app records basic staff-auth-related audit events.

### 3. Sync Google Sheet Pawn Records Into Supabase Every 5 Minutes

Type: AFK

Blocked by: 1

User stories covered: 3, 4, 9, 10, 11, 36

What to build:

Implement scheduled Google Sheet to Supabase sync for pawn records. The sync
should upsert new and edited records by Pawn ID, validate required fields, log
sync status, and mark records missing from the latest source as
`archived_from_source`.

Acceptance criteria:

- [ ] Scheduled sync can read source rows and upsert active pawn records.
- [ ] Edited source records update their Supabase copy on the next sync.
- [ ] Missing source records are archived instead of deleted.
- [ ] Sync logs include start time, finish time, counts, warnings, and failures.
- [ ] App-owned payment/review data is not overwritten by sync.

### 4. Deliver Staff Pawn ID Lookup With Both Action Calculations

Type: AFK

Blocked by: 1, 2, 3

User stories covered: 2, 3, 4, 5, 6, 7, 8, 11

What to build:

Give signed-in staff a lookup screen where they enter a Pawn ID, view the synced
pawn details, and see calculated results for both `ต่อดอก` and `ไถ่ของ`. Include
manual calculator mode for records not found in the database.

Acceptance criteria:

- [ ] Staff can search by Pawn ID.
- [ ] Active records show safe staff-facing pawn details and sync freshness.
- [ ] Archived records are visibly marked.
- [ ] Both `ต่อดอก` and `ไถ่ของ` calculations are shown from the same synced
      record.
- [ ] Manual calculator mode works without a pawn record.

### 5. Add Staff Sync Health And Data Quality Review

Type: AFK

Blocked by: 3, 4

User stories covered: 4, 9, 10, 11, 36

What to build:

Add a staff-visible sync health surface so staff can see whether Google Sheet
data is fresh and whether any source rows need correction.

Acceptance criteria:

- [ ] Staff can see the last successful sync timestamp.
- [ ] Staff can see latest sync warnings and failed rows.
- [ ] Staff can distinguish active, invalid, and archived-from-source records.
- [ ] A manual "sync now" action exists or is explicitly deferred with a visible
      reason.

### 6. Deliver Customer Lookup With Pawn ID And Mobile Verification

Type: AFK

Blocked by: 1, 3

User stories covered: 12, 13, 14, 15, 16, 17, 18, 20

What to build:

Build the public customer lookup flow. Customers enter Pawn ID and mobile
number, the backend verifies both, and the app returns a safe summary plus
`ต่อดอก` and `ไถ่ของ` calculations. Missing mobile, mismatch, archived, and not
found cases fail safely.

Acceptance criteria:

- [ ] Customer lookup requires Pawn ID and mobile number.
- [ ] Mobile mismatch does not reveal whether the Pawn ID is valid.
- [ ] Missing mobile blocks lookup and displays `กรุณาติดต่อสาขา`.
- [ ] Successful lookup shows safe summary and both calculations.
- [ ] Archived or ineligible records display safe contact-branch states.

### 7. Add Public Manual Calculator Mode

Type: AFK

Blocked by: 1

User stories covered: 19

What to build:

Expose a public manual calculator mode that does not require database lookup and
matches the current manual Framer calculator behavior.

Acceptance criteria:

- [ ] Public users can enter start/latest renewal date, loan amount, promotion,
      and action type.
- [ ] Manual results match the calculation engine.
- [ ] Manual mode does not expose or query pawn database records.
- [ ] Validation messages are clear for missing or invalid inputs.

### 8. Create Omise Payment For Customer `ต่อดอก` Only

Type: AFK

Blocked by: 6

User stories covered: 21, 22, 23, 24, 31, 32, 33

What to build:

Add customer payment initiation for `ต่อดอก` only. The server must reload the
pawn record, recalculate the amount, create an Omise payment, and store a
calculation snapshot before sending the customer into payment.

Acceptance criteria:

- [ ] Payment button appears only for eligible `ต่อดอก` customer lookups.
- [ ] `ไถ่ของ` remains calculation-only.
- [ ] Payment amount is recalculated server-side before Omise creation.
- [ ] A calculation snapshot is stored for the payment attempt.
- [ ] Repeated payments for the same Pawn ID are supported as separate records.

### 9. Verify Omise Webhooks And Record Paid Pending Staff Review

Type: AFK

Blocked by: 8

User stories covered: 24, 25, 26, 31, 32, 33

What to build:

Handle Omise webhook confirmation idempotently. Confirmed payments should become
paid payment records with renewal status pending staff review. The webhook must
not directly update the Google Sheet/AppSheet source in MVP.

Acceptance criteria:

- [ ] Omise webhooks are verified before payment state changes.
- [ ] Duplicate webhook delivery is idempotent.
- [ ] Confirmed payments become `paid_pending_staff_review`.
- [ ] Payment status and renewal status are stored separately.
- [ ] Current pawn start/latest renewal date is not automatically changed in
      MVP.

### 10. Notify Shared Staff LINE Group For Paid Pending Review

Type: AFK

Blocked by: 9

User stories covered: 27, 28

What to build:

Send a LINE Messaging API alert to one shared staff group when a confirmed
online `ต่อดอก` payment needs review. Notification failures should be recorded
and retryable without affecting the payment state.

Acceptance criteria:

- [ ] A confirmed payment creates or updates a staff review task.
- [ ] A LINE message is sent to the configured shared staff group.
- [ ] Message content avoids unnecessary customer personal data.
- [ ] Notification success or failure is recorded.
- [ ] Failed notifications can be retried from staff tooling or a retry job.

### 11. Add Staff Payment Review Queue For Manual AppSheet Update

Type: AFK

Blocked by: 9, 10

User stories covered: 25, 26, 29, 30, 34

What to build:

Give staff a review queue for confirmed online extension payments. Staff can
open a paid record, update Google Sheet/AppSheet manually outside the app, then
mark the app review as completed. The next scheduled sync updates the current
contract data from the Sheet.

Acceptance criteria:

- [ ] Staff can see paid payments awaiting review.
- [ ] Staff can open a payment and see the calculation snapshot and payment
      details needed for manual AppSheet update.
- [ ] Staff can mark the review completed.
- [ ] Review completion is attributed to the signed-in staff user.
- [ ] The app does not write the renewal date back to Google Sheet/AppSheet in
      MVP.

## Approval Questions

1. Does this granularity feel right, too coarse, or too fine?
2. Are the dependency relationships correct?
3. Should any slices be merged or split further?
4. Are the correct slices marked as AFK, or should any be HITL?
