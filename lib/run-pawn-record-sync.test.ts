import { describe, expect, it, vi } from "vitest"
import { runPawnRecordSync } from "@/lib/run-pawn-record-sync"
import { SEARCHABLE_PAWN_RECORD_STATUS } from "@/lib/pawn-record-status"

describe("runPawnRecordSync", () => {
    it("persists source status on upserted pawn records", async () => {
        const syncRunsInsertSingle = vi.fn().mockResolvedValue({
            data: { id: "sync-run-1" },
            error: null,
        })
        const syncRunsInsertSelect = vi
            .fn()
            .mockReturnValue({ single: syncRunsInsertSingle })
        const syncRunsInsert = vi
            .fn()
            .mockReturnValue({ select: syncRunsInsertSelect })
        const syncRunsUpdateEq = vi.fn().mockResolvedValue({ error: null })
        const syncRunsUpdate = vi.fn().mockReturnValue({ eq: syncRunsUpdateEq })

        const pawnRecordsSelect = vi.fn().mockResolvedValue({
            data: [],
            error: null,
        })
        const pawnRecordsUpsert = vi.fn().mockResolvedValue({ error: null })
        const pawnRecordsUpdateIn = vi.fn().mockResolvedValue({ error: null })
        const pawnRecordsUpdate = vi.fn().mockReturnValue({ in: pawnRecordsUpdateIn })

        const from = vi.fn((table: string) => {
            if (table === "sync_runs") {
                return {
                    insert: syncRunsInsert,
                    update: syncRunsUpdate,
                }
            }

            if (table === "pawn_records") {
                return {
                    select: pawnRecordsSelect,
                    upsert: pawnRecordsUpsert,
                    update: pawnRecordsUpdate,
                }
            }

            if (table === "sync_run_issues") {
                return {
                    insert: vi.fn().mockResolvedValue({ error: null }),
                }
            }

            throw new Error(`Unexpected table: ${table}`)
        })

        const result = await runPawnRecordSync({
            supabase: { from } as never,
            payload: {
                source: "google_sheets",
                spreadsheetId: "sheet-1",
                sheetName: "Loan Stock",
                startedAt: "2026-07-12T03:00:00.000Z",
                rows: [
                    {
                        rowIndex: 2,
                        pawnId: "P-1001",
                        customerPhone: "081-234-5678",
                        startDate: "2024-06-10",
                        loanAmount: 10000,
                        promoType: "โปร 2%",
                        baseRate: 0.02,
                        sourceStatus: SEARCHABLE_PAWN_RECORD_STATUS,
                        sourceUpdatedAt: null,
                    },
                ],
            },
        })

        expect(pawnRecordsUpsert).toHaveBeenCalledWith(
            [
                expect.objectContaining({
                    pawn_id: "P-1001",
                    customer_phone: "0812345678",
                    source_status: SEARCHABLE_PAWN_RECORD_STATUS,
                    archived_from_source: false,
                }),
            ],
            { onConflict: "pawn_id" }
        )
        expect(result).toMatchObject({
            rowCount: 1,
            insertedCount: 1,
            updatedCount: 0,
            archivedCount: 0,
            warningCount: 0,
        })
    })
})
