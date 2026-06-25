import type { PawnRecord, StaffLookupViewModel } from "@/lib/staff-lookup"

export interface PendingExtendPaymentDraft {
    pawnRecordId: string
    pawnIdSnapshot: string
    transactionType: "ต่อดอก"
    amountBaht: number
    amountSubunits: number
    currency: "THB"
    paymentStatus: "pending_payment"
    renewalStatus: "none"
    startDateBeforePayment: string
    calculationSnapshot: {
        transactionType: "ต่อดอก"
        result: StaffLookupViewModel["extend"]["result"]
    }
}

export function buildPendingExtendPayment(params: {
    record: PawnRecord
    lookupViewModel: StaffLookupViewModel
}): PendingExtendPaymentDraft {
    const amountBaht = params.lookupViewModel.extend.result.interestAmount ?? 0

    if (amountBaht <= 0) {
        throw new Error("Extend payment amount must be greater than zero")
    }

    return {
        pawnRecordId: params.record.id,
        pawnIdSnapshot: params.record.pawnId,
        transactionType: "ต่อดอก",
        amountBaht,
        amountSubunits: amountBaht * 100,
        currency: "THB",
        paymentStatus: "pending_payment",
        renewalStatus: "none",
        startDateBeforePayment: params.record.startDate,
        calculationSnapshot: {
            transactionType: "ต่อดอก",
            result: params.lookupViewModel.extend.result,
        },
    }
}
