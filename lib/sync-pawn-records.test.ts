import { describe, expect, it } from "vitest"
import {
    buildArchivedPawnIds,
    getIncomingPawnIds,
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
                promoType: "โปร 1%",
                baseRate: 0.01,
                sourceStatus: "ยังอยู่ในกำหนด",
                sourceUpdatedAt: null,
            },
            {
                rowIndex: 3,
                pawnId: "P-1001",
                customerPhone: "0812345678",
                startDate: "2024-06-11",
                loanAmount: 12000,
                promoType: "โปร 2%",
                baseRate: 0.02,
                sourceStatus: "ยังอยู่ในกำหนด",
                sourceUpdatedAt: null,
            },
            {
                rowIndex: 4,
                pawnId: "",
                customerPhone: null,
                startDate: "2024-06-10",
                loanAmount: 10000,
                promoType: "โปร 2%",
                baseRate: 0.02,
                sourceStatus: "ยังอยู่ในกำหนด",
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
                promoType: "โปร 1%",
                baseRate: 0.01,
                sourceStatus: "ยังอยู่ในกำหนด",
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

    it("logs rows with unknown source statuses as issues", () => {
        const rows: IncomingSyncRow[] = [
            {
                rowIndex: 2,
                pawnId: "P-1001",
                customerPhone: "0812345678",
                startDate: "2024-06-10",
                loanAmount: 10000,
                promoType: "โปร 2%",
                baseRate: 0.02,
                sourceStatus: "ยังอยู่ในกำหนด",
                sourceUpdatedAt: null,
            },
            {
                rowIndex: 3,
                pawnId: "P-1002",
                customerPhone: "0822222222",
                startDate: "2024-06-10",
                loanAmount: 20000,
                promoType: "โปร 2%",
                baseRate: 0.02,
                sourceStatus: "รอตรวจสอบ",
                sourceUpdatedAt: null,
            },
        ]

        const result = prepareSyncRows(rows)

        expect(result.validRows).toEqual([
            expect.objectContaining({
                pawnId: "P-1001",
                sourceStatus: "ยังอยู่ในกำหนด",
            }),
        ])
        expect(result.issues).toEqual([
            expect.objectContaining({
                rowIndex: 3,
                pawnIdRaw: "P-1002",
                reason: "Invalid source status",
                severity: "error",
            }),
        ])
    })

    it("accepts every status used by the Loan Stock sheet", () => {
        const records = [
            { pawnId: "I06627", sourceStatus: "ช่วงผ่อนผัน" },
            { pawnId: "I06613", sourceStatus: "ขาดแล้ว" },
            { pawnId: "I06440", sourceStatus: "วันสุดท้าย" },
            { pawnId: "P-1001", sourceStatus: "ยังอยู่ในกำหนด" },
            { pawnId: "P-1002", sourceStatus: "ไถ่แล้ว" },
            { pawnId: "P-1003", sourceStatus: "เอาขาด" },
        ]

        const result = prepareSyncRows(
            records.map((record, index) => ({
                rowIndex: index + 2,
                pawnId: record.pawnId,
                customerPhone: "0812345678",
                startDate: "2024-06-10",
                loanAmount: 10000,
                promoType: "โปร 2%",
                baseRate: 0.02,
                sourceStatus: record.sourceStatus,
                sourceUpdatedAt: null,
            }))
        )

        expect(result.validRows).toHaveLength(records.length)
        expect(result.issues).toEqual([])
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

    it("keeps an invalid source row from being treated as deleted", () => {
        const incomingPawnIds = getIncomingPawnIds([
            {
                rowIndex: 2,
                pawnId: "P-1002",
                customerPhone: null,
                startDate: "2024-06-10",
                loanAmount: 10000,
                promoType: "โปร 2%",
                baseRate: 0.02,
                sourceStatus: "รอตรวจสอบ",
                sourceUpdatedAt: null,
            },
        ])

        expect(
            buildArchivedPawnIds({
                existingPawnIds: ["P-1001", "P-1002"],
                activeIncomingPawnIds: incomingPawnIds,
            })
        ).toEqual(["P-1001"])
    })
})
