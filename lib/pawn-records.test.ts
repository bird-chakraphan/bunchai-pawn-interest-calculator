import { describe, expect, it, vi } from "vitest"
import { getPawnRecordById } from "@/lib/pawn-records"

describe("getPawnRecordById", () => {
    it("normalizes numeric and optional timestamp fields from Supabase rows", async () => {
        const maybeSingle = vi.fn().mockResolvedValue({
            data: {
                id: "record-1",
                pawn_id: "P-1001",
                customer_phone: "0812345678",
                start_date: "2024-06-10",
                loan_amount: "10000.00",
                promo_type: "โปร 2%",
                archived_from_source: false,
                source_updated_at: "invalid-timestamp",
                last_synced_at: "",
            },
            error: null,
        })

        const eq = vi.fn().mockReturnValue({ maybeSingle })
        const select = vi.fn().mockReturnValue({ eq })
        const from = vi.fn().mockReturnValue({ select })

        const supabase = {
            from,
        }

        const record = await getPawnRecordById({
            supabase: supabase as never,
            pawnId: "P-1001",
        })

        expect(record).toEqual({
            id: "record-1",
            pawnId: "P-1001",
            customerPhone: "0812345678",
            startDate: "2024-06-10",
            loanAmount: 10000,
            promoType: "โปร 2%",
            archivedFromSource: false,
            sourceUpdatedAt: null,
            lastSyncedAt: null,
        })
    })
})
