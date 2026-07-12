import { describe, expect, it, vi } from "vitest"
import {
    getPawnRecordById,
    getStaffPawnLookupById,
} from "@/lib/pawn-records"
import { SEARCHABLE_PAWN_RECORD_STATUSES } from "@/lib/pawn-record-status"

describe("getPawnRecordById", () => {
    it("normalizes numeric and optional timestamp fields from Supabase rows", async () => {
        const maybeSingle = vi.fn().mockResolvedValue({
            data: {
                id: "record-1",
                pawn_id: "P-1001",
                customer_phone: "0812345678",
                start_date: "2024-06-10",
                loan_amount: "10000.00",
                promo_type: "โปร 1%",
                base_rate: "0.01000",
                source_status: SEARCHABLE_PAWN_RECORD_STATUSES[0],
                archived_from_source: false,
                source_updated_at: "invalid-timestamp",
                last_synced_at: "",
            },
            error: null,
        })

        const eqArchived = vi.fn().mockReturnValue({ maybeSingle })
        const inStatuses = vi.fn().mockReturnValue({ eq: eqArchived })
        const eqPawnId = vi.fn().mockReturnValue({ in: inStatuses })
        const select = vi.fn().mockReturnValue({ eq: eqPawnId })
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
            promoType: "โปร 1%",
            baseRate: 0.01,
            archivedFromSource: false,
            sourceUpdatedAt: null,
            lastSyncedAt: null,
        })
        expect(eqPawnId).toHaveBeenCalledWith("pawn_id", "P-1001")
        expect(inStatuses).toHaveBeenCalledWith(
            "source_status",
            SEARCHABLE_PAWN_RECORD_STATUSES
        )
        expect(eqArchived).toHaveBeenCalledWith("archived_from_source", false)
    })

    it("returns null when the record is archived or not in the allowed status set", async () => {
        const maybeSingle = vi.fn().mockResolvedValue({
            data: null,
            error: null,
        })
        const eqArchived = vi.fn().mockReturnValue({ maybeSingle })
        const inStatuses = vi.fn().mockReturnValue({ eq: eqArchived })
        const eqPawnId = vi.fn().mockReturnValue({ in: inStatuses })
        const select = vi.fn().mockReturnValue({ eq: eqPawnId })
        const from = vi.fn().mockReturnValue({ select })

        const supabase = {
            from,
        }

        const record = await getPawnRecordById({
            supabase: supabase as never,
            pawnId: "P-4040",
        })

        expect(record).toBeNull()
        expect(eqArchived).toHaveBeenCalledWith("archived_from_source", false)
    })

    it.each([
        ["ยังอยู่ในกำหนด", "active"],
        ["ช่วงผ่อนผัน", "active"],
        ["วันสุดท้าย", "active"],
        ["ไถ่แล้ว", "redeemed"],
        ["เอาขาด", "expired"],
        ["ขาดแล้ว", "expired"],
        [null, "not_found"],
    ] as const)("classifies a staff lookup with status %s as %s", async (sourceStatus, expectedStatus) => {
        const maybeSingle = vi.fn().mockResolvedValue({
            data: sourceStatus
                ? {
                      id: "record-1",
                      pawn_id: "P-1001",
                      customer_phone: "0812345678",
                      start_date: "2024-06-10",
                      loan_amount: "10000.00",
                      promo_type: "โปร 1%",
                      base_rate: "0.01000",
                      source_status: sourceStatus,
                      archived_from_source: false,
                      source_updated_at: null,
                      last_synced_at: null,
                  }
                : null,
            error: null,
        })
        const eqArchived = vi.fn().mockReturnValue({ maybeSingle })
        const eqPawnId = vi.fn().mockReturnValue({ eq: eqArchived })
        const select = vi.fn().mockReturnValue({ eq: eqPawnId })
        const from = vi.fn().mockReturnValue({ select })

        const result = await getStaffPawnLookupById({
            supabase: { from } as never,
            pawnId: "P-1001",
        })

        expect(result.status).toBe(expectedStatus)
        expect(eqArchived).toHaveBeenCalledWith("archived_from_source", false)
    })
})
