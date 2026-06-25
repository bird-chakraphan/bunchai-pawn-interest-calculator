import { describe, expect, it } from "vitest"
import { getPaymentReviewDecision } from "@/lib/payment-review"

describe("getPaymentReviewDecision", () => {
    it("allows a paid pending review to complete", () => {
        expect(
            getPaymentReviewDecision({
                paymentStatus: "paid",
                renewalStatus: "pending_staff_review",
                taskStatus: "pending",
            })
        ).toBe("complete")
    })

    it("treats a repeated completion as an idempotent success", () => {
        expect(
            getPaymentReviewDecision({
                paymentStatus: "paid",
                renewalStatus: "review_completed",
                taskStatus: "completed",
            })
        ).toBe("already_completed")
    })

    it("rejects unrelated payment and task states", () => {
        expect(
            getPaymentReviewDecision({
                paymentStatus: "pending_payment",
                renewalStatus: "none",
                taskStatus: undefined,
            })
        ).toBe("not_ready")
    })
})
