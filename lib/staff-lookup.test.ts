import { describe, expect, it } from "vitest"
import { buildStaffLookupViewModel, type PawnRecord } from "@/lib/staff-lookup"

describe("buildStaffLookupViewModel", () => {
    it("returns both extend and redeem calculations for a pawn record", () => {
        const record: PawnRecord = {
            pawnId: "P-1001",
            startDate: "2024-06-10",
            loanAmount: 10000,
            promoType: "โปร 2%",
            customerPhone: "0812345678",
            archivedFromSource: false,
            sourceUpdatedAt: "2024-07-01T10:00:00.000Z",
            lastSyncedAt: "2024-07-10T10:00:00.000Z",
        }

        const viewModel = buildStaffLookupViewModel({
            record,
            currentDate: "2024-07-10",
        })

        expect(viewModel.record.pawnId).toBe("P-1001")
        expect(viewModel.extend.transactionType).toBe("ต่อดอก")
        expect(viewModel.extend.result.interestAmount).toBe(200)
        expect(viewModel.redeem.transactionType).toBe("ไถ่ของ")
        expect(viewModel.redeem.result.interestAmount).toBe(200)
    })
})
