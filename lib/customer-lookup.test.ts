import { describe, expect, it } from "vitest"
import {
    buildCustomerLookupOutcome,
    isCustomerLookupRateLimited,
} from "@/lib/customer-lookup"
import type { PawnRecord } from "@/lib/staff-lookup"

const baseRecord: PawnRecord = {
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

describe("buildCustomerLookupOutcome", () => {
    it("returns success when the phone matches after normalization", () => {
        const result = buildCustomerLookupOutcome({
            record: baseRecord,
            enteredPhone: "+66 81 234 5678",
            currentDate: "2024-07-10",
        })

        expect(result.status).toBe("success")
        if (result.status === "success") {
            expect(result.record.pawnId).toBe("P-1001")
            expect(result.lookupViewModel.extend.result.interestAmount).toBe(200)
        }
    })

    it("returns generic failure when record is missing or phone mismatches", () => {
        expect(
            buildCustomerLookupOutcome({
                record: null,
                enteredPhone: "0812345678",
                currentDate: "2024-07-10",
            }).status
        ).toBe("generic_failure")

        expect(
            buildCustomerLookupOutcome({
                record: baseRecord,
                enteredPhone: "0899999999",
                currentDate: "2024-07-10",
            }).status
        ).toBe("generic_failure")
    })

    it("returns contact branch states for missing mobile and archived records", () => {
        expect(
            buildCustomerLookupOutcome({
                record: {
                    ...baseRecord,
                    customerPhone: null,
                },
                enteredPhone: "0812345678",
                currentDate: "2024-07-10",
            }).status
        ).toBe("contact_branch")

        expect(
            buildCustomerLookupOutcome({
                record: {
                    ...baseRecord,
                    archivedFromSource: true,
                },
                enteredPhone: "0812345678",
                currentDate: "2024-07-10",
            }).status
        ).toBe("contact_branch")
    })
})

describe("isCustomerLookupRateLimited", () => {
    it("blocks after the configured threshold", () => {
        expect(isCustomerLookupRateLimited(4)).toBe(false)
        expect(isCustomerLookupRateLimited(5)).toBe(true)
    })
})
