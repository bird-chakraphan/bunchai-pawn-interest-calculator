import * as React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { ManualCalculator } from "@/components/manual-calculator"

describe("ManualCalculator", () => {
    beforeEach(() => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date("2024-07-10T12:00:00"))
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it("shows the calculated result after valid input", async () => {
        render(<ManualCalculator />)

        fireEvent.click(screen.getByLabelText("วันเริ่ม / ต่อดอกล่าสุด"))
        fireEvent.click(screen.getByRole("button", { name: "2567" }))
        fireEvent.click(screen.getByRole("button", { name: "มิ.ย." }))
        fireEvent.click(screen.getByRole("button", { name: "10" }))
        fireEvent.change(screen.getByLabelText("ยอดจำนำ"), {
            target: { value: "10000" },
        })

        expect(screen.getByText("ดอกเบี้ยที่ต้องชำระในการต่อดอก")).toBeInTheDocument()
        expect(screen.getByText("200", { selector: "strong" })).toBeInTheDocument()
        expect(screen.getByText("10,000 × 2% × 1 เดือน")).toBeInTheDocument()
        expect(screen.getByText("ภายในวันที่ 10 ส.ค. 2567")).toBeInTheDocument()
    })

    it("shows validation for invalid input", async () => {
        render(<ManualCalculator />)

        expect(screen.getByText("กรอกข้อมูลให้ครบเพื่อคำนวณ")).toBeInTheDocument()
        expect(screen.getByText("กรุณาเลือกวันเริ่ม")).toBeInTheDocument()
        expect(screen.getByText("กรุณากรอกยอดจำนำ")).toBeInTheDocument()
    })

    it("renders locked prefilled fields for staff lookup mode", async () => {
        render(
            <ManualCalculator
                prefilledRecord={{
                    pawnId: "P-1001",
                    startDate: "2024-06-10",
                    loanAmount: 10000,
                    promoType: "โปร 2%",
                }}
                staffLookupViewModel={{
                    record: {
                        pawnId: "P-1001",
                        startDate: "2024-06-10",
                        loanAmount: 10000,
                        promoType: "โปร 2%",
                        customerPhone: "0812345678",
                        archivedFromSource: false,
                        sourceUpdatedAt: "2024-07-01T10:00:00.000Z",
                        lastSyncedAt: "2024-07-10T10:00:00.000Z",
                    },
                    extend: {
                        transactionType: "ต่อดอก",
                        result: {
                            mode: "monthlyPromo",
                            rate: 0.02,
                            rateLabel: "2% ต่อเดือน",
                            method: "ปัดเต็มเดือน โปร 2%",
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
                }}
                title="คำนวณดอกเบี้ยจำนำ รหัส P-1001"
            />
        )

        expect(screen.getByRole("heading", { name: "คำนวณดอกเบี้ยจำนำ รหัส P-1001" })).toBeInTheDocument()
        expect(screen.getByText("10 มิ.ย. 2567")).toBeInTheDocument()
        expect(screen.getByText("10,000 บาท")).toBeInTheDocument()
        expect(screen.getAllByText("โปร 2%").length).toBeGreaterThan(0)
        expect(screen.getByText("ดอกเบี้ยที่ต้องชำระในการต่อดอก")).toBeInTheDocument()
        expect(screen.getByText("สรุปทั้งสองรายการจากข้อมูลใบจำนำ")).toBeInTheDocument()
        expect(screen.getByText("active")).toBeInTheDocument()
        expect(screen.getByText("10,200 บาท")).toBeInTheDocument()
        expect(screen.getByText("sync ล่าสุด")).toBeInTheDocument()
        expect(screen.getByText("source ล่าสุด")).toBeInTheDocument()
    })

    it("marks archived staff records clearly", async () => {
        render(
            <ManualCalculator
                prefilledRecord={{
                    pawnId: "P-2001",
                    startDate: "2024-06-10",
                    loanAmount: 10000,
                    promoType: "โปร 2%",
                }}
                staffLookupViewModel={{
                    record: {
                        pawnId: "P-2001",
                        startDate: "2024-06-10",
                        loanAmount: 10000,
                        promoType: "โปร 2%",
                        customerPhone: "0812345678",
                        archivedFromSource: true,
                        sourceUpdatedAt: "2024-07-01T10:00:00.000Z",
                        lastSyncedAt: "2024-07-10T10:00:00.000Z",
                    },
                    extend: {
                        transactionType: "ต่อดอก",
                        result: {
                            mode: "monthlyPromo",
                            rate: 0.02,
                            rateLabel: "2% ต่อเดือน",
                            method: "ปัดเต็มเดือน โปร 2%",
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
                            mode: "blocked",
                            rate: 0.03,
                            rateLabel: "3% ต่อเดือน",
                            method: "เกินกำหนด 20 วัน",
                            status: "เกินกำหนดไถ่ของ",
                            interestAmount: null,
                            monthCount: 1,
                            actualMonthCount: 1,
                            displayedOverdueDays: 0,
                            latestBoundary: "2024-07-10",
                            nextBoundary: "2024-08-10",
                            contractExpiryDate: "2024-09-10",
                            overdueFromLatestBoundary: 0,
                            overdueFromContractExpiry: 30,
                            formulaText: "ไม่สามารถไถ่ได้",
                            blockedTitle: "ไม่สามารถไถ่ได้",
                            blockedMessage: "เกินกำหนดไถ่ของ",
                        },
                    },
                }}
                title="คำนวณดอกเบี้ยจำนำ รหัส P-2001"
            />
        )

        expect(screen.getAllByText(/archived_from_source/).length).toBeGreaterThan(0)
        expect(screen.getByText("สรุปทั้งสองรายการจากข้อมูลใบจำนำ")).toBeInTheDocument()
        expect(screen.getAllByText("ไม่สามารถไถ่ได้").length).toBeGreaterThan(0)
    })
})
