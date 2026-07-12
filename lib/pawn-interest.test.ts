import { describe, expect, it } from "vitest"
import { calculatePawnInterest } from "@/lib/pawn-interest"

describe("calculatePawnInterest", () => {
    it("treats same-day extension as zero completed months", () => {
        const result = calculatePawnInterest({
            startDate: "2024-07-10",
            currentDate: "2024-07-10",
            loanAmount: 12000,
            promoType: "โปร 2%",
            transactionType: "ต่อดอก",
        })

        expect(result.mode).toBe("monthlyPromo")
        expect(result.monthCount).toBe(0)
        expect(result.actualMonthCount).toBe(0)
        expect(result.interestAmount).toBe(0)
        expect(result.formulaText).toBe("12,000 × 2% × 0 เดือน")
        expect(result.method).toBe("คิดเดือนจริง โปร 2%")
        expect(result.status).toBe("ภายในระยะเวลา")
    })

    it("treats same-day redeem as one started month", () => {
        const result = calculatePawnInterest({
            startDate: "2024-07-10",
            currentDate: "2024-07-10",
            loanAmount: 12000,
            promoType: "โปร 2%",
            transactionType: "ไถ่ของ",
        })

        expect(result.mode).toBe("monthlyPromo")
        expect(result.monthCount).toBe(1)
        expect(result.actualMonthCount).toBe(0)
        expect(result.interestAmount).toBe(240)
        expect(result.formulaText).toBe("12,000 × 2% × 1 เดือน")
        expect(result.method).toBe("ปัดเต็มเดือน โปร 2%")
        expect(result.status).toBe("ภายในระยะเวลา")
    })

    it("calculates exact one-month extension with promo 2%", () => {
        const result = calculatePawnInterest({
            startDate: "2024-06-10",
            currentDate: "2024-07-10",
            loanAmount: 10000,
            promoType: "โปร 2%",
            transactionType: "ต่อดอก",
        })

        expect(result.mode).toBe("monthlyPromo")
        expect(result.monthCount).toBe(1)
        expect(result.actualMonthCount).toBe(1)
        expect(result.interestAmount).toBe(200)
        expect(result.formulaText).toBe("10,000 × 2% × 1 เดือน")
        expect(result.status).toBe("ภายในระยะเวลา")
    })

    it("charges the next month when the date passes the boundary by one day", () => {
        const result = calculatePawnInterest({
            startDate: "2024-06-10",
            currentDate: "2024-07-11",
            loanAmount: 10000,
            promoType: "โปร 2%",
            transactionType: "ต่อดอก",
        })

        expect(result.mode).toBe("monthlyPromo")
        expect(result.monthCount).toBe(2)
        expect(result.actualMonthCount).toBe(1)
        expect(result.overdueFromLatestBoundary).toBe(1)
        expect(result.interestAmount).toBe(400)
        expect(result.method).toBe("ปัดเต็มเดือน โปร 2%")
        expect(result.isBackwardRenewalEligible).toBe(true)
    })

    it("calculates an eligible backward renewal one month earlier", () => {
        const result = calculatePawnInterest({
            startDate: "2024-05-10",
            currentDate: "2024-07-15",
            loanAmount: 10000,
            promoType: "โปร 2%",
            transactionType: "ต่อดอก",
            renewalDirection: "backward",
        })

        expect(result.renewalDirection).toBe("backward")
        expect(result.monthCount).toBe(2)
        expect(result.actualMonthCount).toBe(2)
        expect(result.overdueFromLatestBoundary).toBe(5)
        expect(result.nextBoundary).toBe("2024-07-10")
        expect(result.interestAmount).toBe(400)
        expect(result.formulaText).toBe("10,000 × 2% × 2 เดือน")
    })

    it.each([
        ["2024-06-10", "2024-07-10"],
        ["2024-06-10", "2024-07-18"],
        ["2024-03-10", "2024-07-15"],
    ])("rejects an ineligible backward renewal from %s on %s", (startDate, currentDate) => {
        expect(() =>
            calculatePawnInterest({
                startDate,
                currentDate,
                loanAmount: 10000,
                promoType: "โปร 2%",
                transactionType: "ต่อดอก",
                renewalDirection: "backward",
            })
        ).toThrow("Backward renewal is not available for this duration")
    })

    it("uses end-of-month fallback for leap-year anniversaries", () => {
        const result = calculatePawnInterest({
            startDate: "2024-01-31",
            currentDate: "2024-02-29",
            loanAmount: 10000,
            promoType: "โปร 2%",
            transactionType: "ต่อดอก",
        })

        expect(result.latestBoundary).toBe("2024-02-29")
        expect(result.nextBoundary).toBe("2024-03-31")
        expect(result.monthCount).toBe(1)
        expect(result.interestAmount).toBe(200)
    })

    it("uses the weekly redeem rule for 1 to 7 overdue days", () => {
        const result = calculatePawnInterest({
            startDate: "2026-04-10",
            currentDate: "2026-05-15",
            loanAmount: 100000,
            promoType: "โปรแสน (1.5%)",
            transactionType: "ไถ่ของ",
        })

        expect(result.mode).toBe("weeklyOnePercent")
        expect(result.actualMonthCount).toBe(1)
        expect(result.monthCount).toBe(2)
        expect(result.overdueFromLatestBoundary).toBe(5)
        expect(result.interestAmount).toBe(2500)
        expect(result.formulaText).toBe("100,000 × 1.5% × 1 เดือน + 100,000 × 1%")
    })

    it("falls back to monthly promo rounding when redeem is over 7 days late", () => {
        const result = calculatePawnInterest({
            startDate: "2026-04-10",
            currentDate: "2026-05-18",
            loanAmount: 100000,
            promoType: "โปรแสน (1.5%)",
            transactionType: "ไถ่ของ",
        })

        expect(result.mode).toBe("monthlyPromo")
        expect(result.monthCount).toBe(2)
        expect(result.overdueFromLatestBoundary).toBe(8)
        expect(result.interestAmount).toBe(3000)
        expect(result.method).toBe("ปัดเต็มเดือน โปร 1.5%")
    })

    it("switches extension to 3 percent after 20 days past contract expiry", () => {
        const result = calculatePawnInterest({
            startDate: "2026-01-10",
            currentDate: "2026-05-01",
            loanAmount: 10000,
            promoType: "โปร 2%",
            transactionType: "ต่อดอก",
        })

        expect(result.mode).toBe("penaltyThreePercent")
        expect(result.monthCount).toBe(4)
        expect(result.overdueFromContractExpiry).toBe(21)
        expect(result.displayedOverdueDays).toBe(21)
        expect(result.interestAmount).toBe(1200)
        expect(result.formulaText).toBe("10,000 × 3% × 4 เดือน")
    })

    it("blocks redeem after 20 days past contract expiry", () => {
        const result = calculatePawnInterest({
            startDate: "2026-01-10",
            currentDate: "2026-05-01",
            loanAmount: 10000,
            promoType: "โปร 2%",
            transactionType: "ไถ่ของ",
        })

        expect(result.mode).toBe("blocked")
        expect(result.interestAmount).toBeNull()
        expect(result.status).toBe("ของหลุดสิทธิ์")
        expect(result.blockedTitle).toBe("ไม่สามารถไถ่ได้")
        expect(result.blockedMessage).toBe(
            "เกินระยะเวลาที่กำหนด ของหลุดสิทธิ์แล้ว"
        )
        expect(result.formulaText).toBe("ไม่มีการคำนวณดอกเบี้ย")
    })

    it("rounds interest up with Math.ceil", () => {
        const result = calculatePawnInterest({
            startDate: "2026-04-10",
            currentDate: "2026-05-10",
            loanAmount: 12345,
            promoType: "โปรแสน (1.5%)",
            transactionType: "ต่อดอก",
        })

        expect(result.interestAmount).toBe(186)
    })

    it("uses source base rate when provided instead of fixed promo mapping", () => {
        const result = calculatePawnInterest({
            startDate: "2026-04-10",
            currentDate: "2026-05-10",
            loanAmount: 10000,
            promoType: "โปร 2%",
            baseRate: 0.01,
            transactionType: "ต่อดอก",
        })

        expect(result.rate).toBe(0.01)
        expect(result.method).toBe("คิดเดือนจริง โปร 1%")
        expect(result.interestAmount).toBe(100)
        expect(result.formulaText).toBe("10,000 × 1% × 1 เดือน")
    })
})
