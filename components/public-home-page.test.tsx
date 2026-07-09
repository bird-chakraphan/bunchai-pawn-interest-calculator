import * as React from "react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { PublicHomePage } from "@/components/public-home-page"
import { buildStaffLookupViewModel } from "@/lib/staff-lookup"

describe("PublicHomePage", () => {
    afterEach(() => {
        vi.restoreAllMocks()
    })

    it("does not render an empty notice spacer on first load", () => {
        const { container } = render(<PublicHomePage />)

        expect(screen.getByRole("heading", { name: "คำนวณดอกเบี้ยจำนำ" })).toBeInTheDocument()
        expect(screen.getByText("เลขใบจำนำ")).toBeInTheDocument()
        expect(screen.getByText("เบอร์โทรศัพท์")).toBeInTheDocument()
        expect(container.querySelector(".pawn-page-notice")).not.toBeInTheDocument()
    })

    it("clears lookup state and manual inputs when switching modes", async () => {
        const record = {
            id: "record-1",
            pawnId: "P-1001",
            startDate: "2024-05-08",
            loanAmount: 120000,
            promoType: "โปรแสน (1.5%)",
            baseRate: 0.015,
            customerPhone: "0812345678",
            archivedFromSource: false,
            sourceUpdatedAt: "2024-07-09T10:00:00.000Z",
            lastSyncedAt: "2024-07-09T10:00:00.000Z",
        }

        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({
                status: "success" as const,
                record,
                lookupViewModel: buildStaffLookupViewModel({
                    record,
                    currentDate: "2024-07-09",
                }),
            }),
        } as Response)

        render(<PublicHomePage />)

        fireEvent.click(screen.getByRole("button", { name: "กรอกข้อมูล" }))
        fireEvent.change(screen.getByLabelText("ยอดจำนำ"), {
            target: { value: "120000" },
        })

        expect(
            (screen.getByLabelText("ยอดจำนำ") as HTMLInputElement).value
        ).toBe("120,000")

        fireEvent.click(screen.getByRole("button", { name: "ค้นหาด้วยรหัส" }))

        fireEvent.change(screen.getByPlaceholderText("กรอกเลขใบจำนำ"), {
            target: { value: "P-1001" },
        })
        fireEvent.change(screen.getByPlaceholderText("กรอกเบอร์โทรศัพท์"), {
            target: { value: "0812345678" },
        })
        fireEvent.click(screen.getByRole("button", { name: "ค้นหา" }))

        await waitFor(() => {
            expect(
                screen.getByRole("heading", {
                    name: "คำนวณดอกเบี้ยจำนำ รหัส P-1001",
                })
            ).toBeInTheDocument()
        })

        fireEvent.click(screen.getByRole("button", { name: "กรอกข้อมูล" }))

        expect(
            screen.getByRole("heading", { name: "คำนวณดอกเบี้ยจำนำ" })
        ).toBeInTheDocument()
        expect(
            screen.getByText(/เมื่อกรอกข้อมูลครบ/i)
        ).toBeInTheDocument()
        expect(
            screen.getByText(/ระบบจะคำนวณอัตโนมัติ/i)
        ).toBeInTheDocument()
        expect(
            (screen.getByLabelText("ยอดจำนำ") as HTMLInputElement).value
        ).toBe("")

        fireEvent.click(screen.getByRole("button", { name: "ค้นหาด้วยรหัส" }))

        expect(
            (screen.getByPlaceholderText("กรอกเลขใบจำนำ") as HTMLInputElement).value
        ).toBe("")
        expect(
            (screen.getByPlaceholderText("กรอกเบอร์โทรศัพท์") as HTMLInputElement).value
        ).toBe("")
    })

    it("shows the required fields error in Thai", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 400,
            json: async () => ({
                error: "กรุณากรอกเลขใบจำนำและเบอร์โทรศัพท์",
            }),
        } as Response)

        render(<PublicHomePage />)

        fireEvent.click(screen.getByRole("button", { name: "ค้นหา" }))

        await waitFor(() => {
            expect(
                screen.getByText("กรุณากรอกเลขใบจำนำและเบอร์โทรศัพท์")
            ).toBeInTheDocument()
        })
    })

    it("shows the updated not found message for generic lookup failures", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({
                status: "generic_failure" as const,
            }),
        } as Response)

        render(<PublicHomePage />)

        fireEvent.change(screen.getByPlaceholderText("กรอกเลขใบจำนำ"), {
            target: { value: "P-9999" },
        })
        fireEvent.change(screen.getByPlaceholderText("กรอกเบอร์โทรศัพท์"), {
            target: { value: "0812345678" },
        })
        fireEvent.click(screen.getByRole("button", { name: "ค้นหา" }))

        await waitFor(() => {
            expect(
                screen.getByText("ไม่พบข้อมูลในระบบ กรุณาตรวจสอบเลขใบจำนำและเบอร์โทรศัพท์")
            ).toBeInTheDocument()
        })
    })
})
