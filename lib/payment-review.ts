export type PaymentReviewDecision = "complete" | "already_completed" | "not_ready"

export function getPaymentReviewDecision(params: {
    paymentStatus: string | null | undefined
    renewalStatus: string | null | undefined
    taskStatus: string | null | undefined
}): PaymentReviewDecision {
    if (
        params.paymentStatus === "paid" &&
        params.renewalStatus === "review_completed" &&
        params.taskStatus === "completed"
    ) {
        return "already_completed"
    }

    if (
        params.paymentStatus === "paid" &&
        params.renewalStatus === "pending_staff_review" &&
        params.taskStatus === "pending"
    ) {
        return "complete"
    }

    return "not_ready"
}
