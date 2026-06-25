import { describe, expect, it } from "vitest"
import {
    formatBaht,
    getPaymentStatusLabel,
    getRenewalStatusLabel,
} from "@/lib/payment-presentation"

describe("payment presentation", () => {
    it("maps provider states to customer-safe Thai labels", () => {
        expect(getPaymentStatusLabel("pending_payment")).toBe("รอการชำระเงิน")
        expect(getPaymentStatusLabel("paid")).toBe("ชำระเงินแล้ว")
        expect(getRenewalStatusLabel("pending_staff_review")).toBe(
            "รอพนักงานอัปเดต AppSheet"
        )
        expect(getRenewalStatusLabel("review_completed")).toBe(
            "พนักงานตรวจสอบเรียบร้อย"
        )
    })

    it("formats whole-baht payment amounts", () => {
        expect(formatBaht(1240)).toBe("1,240 บาท")
    })
})
