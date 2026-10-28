import * as React from "react"
import { fireEvent, render, screen, within } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { ManualCalculator } from "@/components/manual-calculator"
import { buildStaffLookupViewModel, type PawnRecord } from "@/lib/staff-lookup"

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

    it("shows zero months for same-day extension", async () => {
        render(<ManualCalculator />)

        fireEvent.click(screen.getByLabelText("วันเริ่ม / ต่อดอกล่าสุด"))
        fireEvent.click(screen.getByRole("button", { name: "2567" }))
        fireEvent.click(screen.getByRole("button", { name: "ก.ค." }))
        fireEvent.click(screen.getByRole("button", { name: "10" }))
        fireEvent.change(screen.getByLabelText("ยอดจำนำ"), {
            target: { value: "12000" },
        })

        expect(screen.getByText("0", { selector: "strong" })).toBeInTheDocument()
        expect(screen.getByText("12,000 × 2% × 0 เดือน")).toBeInTheDocument()
        expect(screen.getByText("คิดเดือนจริง โปร 2%")).toBeInTheDocument()
        expect(screen.getByText("ต่อดอก 0 เดือน ถึงวันที่ 10 ส.ค. 2567")).toBeInTheDocument()
        expect(screen.getByText("0 เดือน 0 วัน")).toBeInTheDocument()
    })

    it("shows one started month for same-day redeem", async () => {
        render(<ManualCalculator />)

        fireEvent.click(screen.getByLabelText("วันเริ่ม / ต่อดอกล่าสุด"))
        fireEvent.click(screen.getByRole("button", { name: "2567" }))
        fireEvent.click(screen.getByRole("button", { name: "ก.ค." }))
        fireEvent.click(screen.getByRole("button", { name: "10" }))
        fireEvent.change(screen.getByLabelText("ยอดจำนำ"), {
            target: { value: "12000" },
        })
        fireEvent.click(screen.getByRole("radio", { name: "ไถ่ของ" }))

        expect(screen.getByText("12,240", { selector: "strong" })).toBeInTheDocument()
        expect(screen.getByText("12,000 × 2% × 1 เดือน")).toBeInTheDocument()
        expect(screen.getByText("ปัดเต็มเดือน โปร 2%")).toBeInTheDocument()
        expect(screen.getByText("0 เดือน 0 วัน")).toBeInTheDocument()
    })

    it("offers backward renewal for months 1 to 3 and days 1 to 7", () => {
        vi.setSystemTime(new Date("2024-07-15T12:00:00"))
        render(<ManualCalculator />)

        fireEvent.click(screen.getByLabelText("วันเริ่ม / ต่อดอกล่าสุด"))
        fireEvent.click(screen.getByRole("button", { name: "2567" }))
        fireEvent.click(screen.getByRole("button", { name: "มิ.ย." }))
        fireEvent.click(screen.getByRole("button", { name: "10" }))
        fireEvent.change(screen.getByLabelText("ยอดจำนำ"), {
            target: { value: "10000" },
        })

        expect(screen.getByRole("radiogroup", { name: "รูปแบบการต่อดอก" })).toBeInTheDocument()
        expect(screen.getByRole("radio", { name: "ต่อย้อนหลัง" })).toHaveAttribute("aria-checked", "true")
        expect(screen.getByText("ต่อดอก 1 เดือน ถึงวันที่ 10 ก.ค. 2567")).toBeInTheDocument()
        expect(screen.getByText("10,000 × 2% × 1 เดือน")).toBeInTheDocument()
        expect(screen.getByText("200", { selector: "strong" })).toBeInTheDocument()
        expect(screen.getByText("1 เดือน 5 วัน")).toBeInTheDocument()

        fireEvent.click(screen.getByRole("radio", { name: "ต่อล่วงหน้า" }))

        expect(screen.getByText("ต่อดอก 2 เดือน ถึงวันที่ 10 ส.ค. 2567")).toBeInTheDocument()
        expect(
            screen.getByText("โปร 2% × 2 เดือน ดอกเบี้ย 400 บาท")
        ).toBeInTheDocument()
    })

    it("does not offer backward renewal on an exact monthly boundary", () => {
        render(<ManualCalculator />)

        fireEvent.click(screen.getByLabelText("วันเริ่ม / ต่อดอกล่าสุด"))
        fireEvent.click(screen.getByRole("button", { name: "2567" }))
        fireEvent.click(screen.getByRole("button", { name: "มิ.ย." }))
        fireEvent.click(screen.getByRole("button", { name: "10" }))
        fireEvent.change(screen.getByLabelText("ยอดจำนำ"), {
            target: { value: "10000" },
        })

        expect(screen.queryByRole("radiogroup", { name: "รูปแบบการต่อดอก" })).not.toBeInTheDocument()
    })

    it("shows validation for invalid input", async () => {
        render(<ManualCalculator />)

        expect(
            screen.getByText(/เมื่อกรอกข้อมูลครบ/i)
        ).toBeInTheDocument()
        expect(
            screen.getByText(/ระบบจะคำนวณอัตโนมัติ/i)
        ).toBeInTheDocument()
        expect(screen.queryByText("กรุณาเลือกวันเริ่ม")).not.toBeInTheDocument()
        expect(screen.queryByText("กรุณากรอกยอดจำนำ")).not.toBeInTheDocument()
    })

    it("does not preselect a date when opening the picker from empty state", async () => {
        render(<ManualCalculator />)

        fireEvent.click(screen.getByLabelText("วันเริ่ม / ต่อดอกล่าสุด"))

        const dialog = screen.getByRole("dialog", { name: "เลือกวันเริ่ม" })

        expect(within(dialog).queryByRole("button", { name: "2567" })).not.toHaveClass(
            "is-selected"
        )
        expect(within(dialog).queryByRole("button", { name: "2566" })).not.toHaveClass(
            "is-selected"
        )
        expect(within(dialog).queryByRole("button", { name: "2565" })).not.toHaveClass(
            "is-selected"
        )
    })

    it("lists date-picker years from oldest to newest", () => {
        render(<ManualCalculator />)

        fireEvent.click(screen.getByLabelText("วันเริ่ม / ต่อดอกล่าสุด"))

        const dialog = screen.getByRole("dialog", { name: "เลือกวันเริ่ม" })
        expect(
            within(dialog)
                .getAllByRole("button")
                .map((button) => button.textContent)
        ).toEqual(["2565", "2566", "2567"])
    })

    it("does not show selected styling while navigating the date picker", async () => {
        render(<ManualCalculator />)

        fireEvent.click(screen.getByLabelText("วันเริ่ม / ต่อดอกล่าสุด"))
        fireEvent.click(screen.getByRole("button", { name: "2567" }))

        const monthDialog = screen.getByRole("dialog", { name: "เลือกวันเริ่ม" })
        expect(within(monthDialog).queryByRole("button", { name: "มิ.ย." })).not.toHaveClass(
            "is-selected"
        )

        fireEvent.click(screen.getByRole("button", { name: "มิ.ย." }))

        const dayDialog = screen.getByRole("dialog", { name: "เลือกวันเริ่ม" })
        expect(within(dayDialog).queryByRole("button", { name: "10" })).not.toHaveClass(
            "is-selected"
        )
    })

    it("lets the user quickly fill today's date from the shortcut button", async () => {
        render(<ManualCalculator />)

        fireEvent.click(screen.getByRole("button", { name: "เลือกวันนี้" }))

        expect(screen.getByText("10 ก.ค. 2567")).toBeInTheDocument()
    })

    it("renders locked prefilled fields for staff lookup mode", () => {
        const record: PawnRecord = {
            id: "record-1",
            pawnId: "P-1001",
            startDate: "2024-06-10",
            loanAmount: 10000,
            promoType: "โปร 2%",
            baseRate: 0.02,
            customerPhone: "0000000000",
            archivedFromSource: false,
            sourceUpdatedAt: "2024-07-01T10:00:00.000Z",
            lastSyncedAt: "2024-07-10T10:00:00.000Z",
        }
        render(
            <ManualCalculator
                prefilledRecord={record}
                staffLookupViewModel={buildStaffLookupViewModel({ record, currentDate: "2024-07-10" })}
                title="คำนวณดอกเบี้ยจำนำ รหัส P-1001"
                showStaffLookupMetadata
            />
        )

        expect(screen.getByRole("heading", { name: "คำนวณดอกเบี้ยจำนำ รหัส P-1001" })).toBeInTheDocument()
        expect(screen.getByText("P-1001")).toBeInTheDocument()
        expect(screen.getByText("10 มิ.ย. 2567")).toBeInTheDocument()
        expect(screen.getByText("10,000 บาท")).toBeInTheDocument()
        expect(screen.getAllByText("โปร 2%").length).toBeGreaterThan(0)
        // Staff record values stay locked while the action remains selectable.
        expect(screen.queryByRole("textbox")).not.toBeInTheDocument()
        expect(screen.queryByRole("button", { name: "วันเริ่ม / ต่อดอกล่าสุด" })).not.toBeInTheDocument()
        expect(screen.queryByRole("radiogroup", { name: "โปรโมชัน" })).not.toBeInTheDocument()
        expect(screen.getByText("อัพเดทล่าสุด")).toBeInTheDocument()
        expect(screen.getByText("10 ก.ค. 2567 17:00")).toBeInTheDocument()
        expect(screen.getByText("ดอกเบี้ยที่ต้องชำระในการต่อดอก")).toBeInTheDocument()
        expect(screen.getByText("200", { selector: "strong" })).toBeInTheDocument()
        expect(screen.getByText("10,000 × 2% × 1 เดือน")).toBeInTheDocument()

        fireEvent.click(screen.getByRole("radio", { name: "ไถ่ของ" }))
        expect(screen.getByText("เงินต้นและดอกเบี้ยที่ต้องชำระในการไถ่")).toBeInTheDocument()
        expect(screen.getByText("10,200", { selector: "strong" })).toBeInTheDocument()
        expect(screen.getByText("สามารถไถ่ได้")).toBeInTheDocument()
        expect(screen.queryByRole("textbox")).not.toBeInTheDocument()
    })

    it("marks archived staff records clearly", () => {
        // Beyond the three-month term plus grace, so the real engine blocks redemption.
        const record: PawnRecord = {
            id: "record-2",
            pawnId: "P-2001",
            startDate: "2024-03-10",
            loanAmount: 10000,
            promoType: "โปร 2%",
            baseRate: 0.02,
            customerPhone: "0000000000",
            archivedFromSource: true,
            sourceUpdatedAt: "2024-07-01T10:00:00.000Z",
            lastSyncedAt: "2024-07-10T10:00:00.000Z",
        }
        render(
            <ManualCalculator
                prefilledRecord={record}
                staffLookupViewModel={buildStaffLookupViewModel({ record, currentDate: "2024-07-10" })}
                title="คำนวณดอกเบี้ยจำนำ รหัส P-2001"
                showStaffLookupMetadata
            />
        )

        expect(screen.getByText(/จากการ sync ล่าสุด/)).toBeInTheDocument()
        expect(screen.getByText("สถานะข้อมูล")).toBeInTheDocument()
        expect(screen.getAllByText("archived_from_source").length).toBeGreaterThan(0)
        expect(screen.queryByRole("textbox")).not.toBeInTheDocument()
        fireEvent.click(screen.getByRole("radio", { name: "ไถ่ของ" }))
        expect(screen.getAllByText("ไม่สามารถไถ่ได้").length).toBeGreaterThan(0)
        expect(screen.queryByText("เงินต้นและดอกเบี้ยที่ต้องชำระในการไถ่")).not.toBeInTheDocument()
    })
})
