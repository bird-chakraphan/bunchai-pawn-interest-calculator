# Current Calculation Logic

Last summarized: 2026-06-18

This document logs the calculation behavior currently implemented in the Framer
`PawnInterestCalculator` component and mirrored by the spreadsheet review script.
The user has tested this logic heavily, so future rebuild work should preserve it
unless the business explicitly changes the pawnshop rules.

## Core Inputs

The calculator currently needs these inputs:

- Start date / latest renewal date (`วันเริ่ม / ต่อดอกล่าสุด`)
- Loan amount (`ยอดจำนำ`)
- Promotion (`โปรโมชัน`)
- Action type (`รายการ`)

Promotion values:

- `โปร 2%` means 2% per month.
- `โปรแสน (1.5%)` means 1.5% per month. The UI may display this as `โปรแสน`,
  but the internal rate remains 1.5%.

Action values:

- `ต่อดอก`
- `ไถ่ของ`

Dates are stored internally as Gregorian dates. Display dates use Thai Buddhist
year formatting.

## Calendar Anniversary Model

The calculator uses calendar-anniversary month boundaries. It does not divide
days by 30.

For each month boundary:

- Start from the start/latest renewal date.
- Add whole calendar months.
- If the original day does not exist in the target month, use the final day of
  the target month.

Examples:

- 10 Jun to 10 Jul is exactly 1 month.
- 10 Jun to 11 Jul is 1 completed month plus 1 day, so the charged month count
  becomes 2.
- 31 Jan 2024 plus 1 month becomes 29 Feb 2024 because 2024 is a leap year.

## Month Counts

The logic tracks two month counts:

- `actualMonthCount`: the number of completed anniversary months.
- `monthCount`: the number of months to charge.

If the current date is exactly on the latest anniversary boundary, `monthCount`
equals `actualMonthCount`.

If the current date is after the latest anniversary boundary by even 1 day,
`monthCount` becomes `actualMonthCount + 1`.

## Contract Duration And Grace

The contract duration is 3 months.

The contract grace period is 20 days after the 3-month contract expiry date.

The logic tracks:

- `overdueFromLatestBoundary`: days after the latest monthly anniversary.
- `overdueFromContractExpiry`: days after the 3-month contract expiry date.

Contract status text:

- `ภายในระยะเวลา`: not overdue after contract expiry.
- `เกินกำหนดไม่เกิน 20 วัน`: overdue after contract expiry but within 20 days.
- `เกินกำหนด`: overdue after contract expiry by more than 20 days.

## Interest Modes

### Normal Monthly Promotion

Mode: `monthlyPromo`

Used when no special weekly or penalty rule applies.

Formula:

```text
ceil(loanAmount * promoRate * monthCount)
```

Method text:

- If exactly on a boundary: `คิดเดือนจริง โปร X%`
- If after a boundary: `ปัดเต็มเดือน โปร X%`

### Redeem Weekly 1 Percent

Mode: `weeklyOnePercent`

Used only for `ไถ่ของ` when:

- `overdueFromLatestBoundary` is 1 to 7 days, inclusive.

Formula:

```text
ceil((loanAmount * promoRate * actualMonthCount) + (loanAmount * 1%))
```

Method text:

```text
คิดเดือนจริง โปร X% + รายสัปดาห์ 1%
```

This means the customer pays completed anniversary months at the promotion rate,
plus one weekly 1% charge.

There is no 2-week or 3-week mode in the current logic. If the redeem date is
more than 7 days after the latest boundary, the calculation returns to full
monthly promotion rounding.

### Extend Penalty 3 Percent

Mode: `penaltyThreePercent`

Used only for `ต่อดอก` when:

- `overdueFromContractExpiry` is more than 20 days.

Formula:

```text
ceil(loanAmount * 3% * monthCount)
```

Method text:

```text
เกินกำหนด ใช้อัตรา 3%
```

### Redeem Blocked

Mode: `blocked`

Used only for `ไถ่ของ` when:

- `overdueFromContractExpiry` is more than 20 days.

Result:

- No interest amount is calculated.
- Status is `ของหลุดสิทธิ์`.
- Blocked title is `ไม่สามารถไถ่ได้`.
- Blocked message is `เกินระยะเวลาที่กำหนด ของหลุดสิทธิ์แล้ว`.

## Action-Specific Result Behavior

For `ต่อดอก`:

- The main amount is interest only.
- The UI also shows option entries for possible extension deadlines.
- If paid online in the future system, this will reset the start/latest renewal
  date to the paid date after staff approval in MVP.

For `ไถ่ของ`:

- The main amount is principal plus interest.
- The UI separately shows principal and interest.
- Online payment is out of scope for MVP; customers may view the calculation
  but must redeem in person.

## Rounding

All calculated interest amounts are rounded up using `ceil`.

The spreadsheet review workbook should mirror this behavior with `ROUNDUP`.

## Validation Rules

The current UI requires:

- A valid start/latest renewal date.
- A loan amount greater than 0.
- Current date must not be earlier than the start/latest renewal date.

Future customer lookup will add:

- Pawn ID must exist.
- Customer mobile number must match the pawn record.
- If the mobile number is missing for that pawn record, customer lookup/payment
  is blocked and the customer sees `กรุณาติดต่อสาขา`.
- Staff lookup remains allowed.

## Review Cases From The Existing Workbook

These examples should become automated tests in the new app:

1. Start 10 Jun 2024, current 10 Jul 2024, `โปร 2%`, `ต่อดอก`: exactly 1 month.
2. Start 10 Jun 2024, current 11 Jul 2024, `โปร 2%`, `ต่อดอก`: charge 2 months
   because the date passed the boundary by 1 day.
3. Start 31 Jan 2024, current 29 Feb 2024, `โปร 2%`, `ต่อดอก`: anniversary
   fallback reaches 29 Feb 2024.
4. Start 10 Apr 2026, current 15 May 2026, `โปรแสน (1.5%)`, `ไถ่ของ`: completed
   1 month plus 5 days, use promotion for 1 completed month plus weekly 1%.
5. Start 10 Apr 2026, current 18 May 2026, `โปรแสน (1.5%)`, `ไถ่ของ`: 8 days
   after latest boundary, use full monthly promotion rounding instead of weekly.
6. Start 10 Jan 2026, current 1 May 2026, `โปร 2%`, `ต่อดอก`: 21 days after
   contract expiry, use 3% penalty rate.
7. Start 10 Jan 2026, current 1 May 2026, `โปร 2%`, `ไถ่ของ`: 21 days after
   contract expiry, redeem is blocked.
8. Start 27 Apr 2026, current 11 May 2026, `โปรแสน (1.5%)`, `ไถ่ของ`: current
   example from the workbook.

## Preservation Rules For The Rebuild

- Preserve anniversary-based month calculation.
- Preserve end-of-month fallback.
- Preserve `ceil` rounding.
- Preserve separate `actualMonthCount` and `monthCount`.
- Preserve the special 1-7 day redeem weekly rule.
- Preserve the 20-day post-contract grace rule.
- Preserve blocked redeem after more than 20 days past contract expiry.
- Preserve 3% penalty for extend after more than 20 days past contract expiry.
- Keep database/payment additions outside the pure calculation engine so the
  calculation remains easy to test.
