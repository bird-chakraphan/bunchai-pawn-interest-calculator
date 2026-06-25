import { describe, expect, it } from "vitest"
import { buildPendingExtendPayment } from "@/lib/payments"
import type { PawnRecord, StaffLookupViewModel } from "@/lib/staff-lookup"

const record: PawnRecord = {
    id: "record-1",
    pawnId: "P-1001",
    startDate: "2024-06-10",
    loanAmount: 10000,
    promoType: "โปร 2%",
    baseRate: 0.02,
    customerPhone: "0812345678",
    archivedFromSource: false,
    sourceUpdatedAt: null,
    lastSyncedAt: null,
}

const lookupViewModel: StaffLookupViewModel = {
    record,
    extend: {
        transactionType: "ต่อดอก",
        result: {
            mode: "monthlyPromo",
            rate: 0.02,
            rateLabel: "2% ต่อเดือน",
            method: "คิดเดือนจริง โปร 2%",
            status: "ภายในระยะเวลา",
            interestAmount: 200,
            monthCount: 1,
            actualMonthCount: 1,
            displayedOverdueDays: 0,
            latestBoundary: "2024-07-10",
            nextBoundary: "2024-08-10",
            contractExpiryDate: "2024-09-10",
            overdueFromLatestBoundary: 0,
            overdueFromContractExpiry: 0,
            formulaText: "10,000 × 2% × 1 เดือน",
        },
    },
    redeem: {
        transactionType: "ไถ่ของ",
        result: {
            mode: "monthlyPromo",
            rate: 0.02,
            rateLabel: "2% ต่อเดือน",
            method: "คิดเดือนจริง โปร 2%",
            status: "ภายในระยะเวลา",
            interestAmount: 200,
            monthCount: 1,
            actualMonthCount: 1,
            displayedOverdueDays: 0,
            latestBoundary: "2024-07-10",
            nextBoundary: "2024-08-10",
            contractExpiryDate: "2024-09-10",
            overdueFromLatestBoundary: 0,
            overdueFromContractExpiry: 0,
            formulaText: "10,000 × 2% × 1 เดือน",
        },
    },
}

describe("buildPendingExtendPayment", () => {
    it("creates a pending payment draft from the server-side extend calculation", () => {
        const payment = buildPendingExtendPayment({
            record,
            lookupViewModel,
        })

        expect(payment.amountBaht).toBe(200)
        expect(payment.amountSubunits).toBe(20000)
        expect(payment.paymentStatus).toBe("pending_payment")
        expect(payment.renewalStatus).toBe("none")
        expect(payment.calculationSnapshot.transactionType).toBe("ต่อดอก")
        expect(payment.calculationSnapshot.result.formulaText).toBe("10,000 × 2% × 1 เดือน")
    })
})
