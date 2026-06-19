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
                title="คำนวณดอกเบี้ยจำนำ รหัส P-1001"
            />
        )

        expect(screen.getByRole("heading", { name: "คำนวณดอกเบี้ยจำนำ รหัส P-1001" })).toBeInTheDocument()
        expect(screen.getByText("10 มิ.ย. 2567")).toBeInTheDocument()
        expect(screen.getByText("10,000 บาท")).toBeInTheDocument()
        expect(screen.getAllByText("โปร 2%").length).toBeGreaterThan(0)
        expect(screen.getByText("ดอกเบี้ยที่ต้องชำระในการต่อดอก")).toBeInTheDocument()
    })
})
