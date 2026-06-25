import { describe, expect, it } from "vitest"
import {
    buildArchivedPawnIds,
    prepareSyncRows,
    type IncomingSyncRow,
} from "@/lib/sync-pawn-records"

describe("prepareSyncRows", () => {
    it("keeps valid rows and logs invalid and duplicate rows as issues", () => {
        const rows: IncomingSyncRow[] = [
            {
                rowIndex: 2,
                pawnId: "P-1001",
                customerPhone: "081-234-5678",
                startDate: "2024-06-10",
                loanAmount: 10000,
                promoType: "โปร 2%",
                sourceUpdatedAt: null,
            },
            {
                rowIndex: 3,
                pawnId: "P-1001",
                customerPhone: "0812345678",
                startDate: "2024-06-11",
                loanAmount: 12000,
                promoType: "โปร 2%",
                sourceUpdatedAt: null,
            },
            {
                rowIndex: 4,
                pawnId: "",
                customerPhone: null,
                startDate: "2024-06-10",
                loanAmount: 10000,
                promoType: "โปร 2%",
                sourceUpdatedAt: null,
            },
        ]

        const result = prepareSyncRows(rows)

        expect(result.validRows).toEqual([
            {
                rowIndex: 2,
                pawnId: "P-1001",
                customerPhone: "0812345678",
                startDate: "2024-06-10",
                loanAmount: 10000,
                promoType: "โปร 2%",
                sourceUpdatedAt: null,
            },
        ])
        expect(result.issues).toEqual([
            expect.objectContaining({
                rowIndex: 3,
                pawnIdRaw: "P-1001",
                reason: "Duplicate Pawn ID in sync batch",
                severity: "error",
            }),
            expect.objectContaining({
                rowIndex: 4,
                pawnIdRaw: "",
                reason: "Missing Pawn ID",
                severity: "error",
            }),
        ])
    })
})

describe("buildArchivedPawnIds", () => {
    it("marks missing source records for archiving", () => {
        expect(
            buildArchivedPawnIds({
                existingPawnIds: ["P-1001", "P-1002", "P-1003"],
                activeIncomingPawnIds: ["P-1001", "P-1003"],
            })
        ).toEqual(["P-1002"])
    })
})
