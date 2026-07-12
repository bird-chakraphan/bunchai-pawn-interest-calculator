import {
    calculatePawnInterest,
    type PawnInterestResult,
    type RenewalDirection,
    type TransactionType,
} from "@/lib/pawn-interest"

export interface PawnRecord {
    id: string
    pawnId: string
    startDate: string
    loanAmount: number
    promoType: string
    baseRate: number
    customerPhone: string | null
    archivedFromSource: boolean
    sourceUpdatedAt: string | null
    lastSyncedAt: string | null
}

interface CalculationEntry {
    transactionType: TransactionType
    renewalDirection?: RenewalDirection
    result: PawnInterestResult
}

export interface StaffLookupViewModel {
    record: PawnRecord
    extend: CalculationEntry
    redeem: CalculationEntry
}

function buildCalculationEntry(params: {
    record: PawnRecord
    currentDate: string
    transactionType: TransactionType
    renewalDirection?: RenewalDirection
}): CalculationEntry {
    return {
        transactionType: params.transactionType,
        result: calculatePawnInterest({
            startDate: params.record.startDate,
            currentDate: params.currentDate,
            loanAmount: params.record.loanAmount,
            promoType:
                params.record.promoType === "โปรแสน (1.5%)"
                    ? "โปรแสน (1.5%)"
                    : "โปร 2%",
            baseRate: params.record.baseRate,
            transactionType: params.transactionType,
            renewalDirection: params.renewalDirection,
        }),
    }
}

export function buildStaffLookupViewModel(params: {
    record: PawnRecord
    currentDate: string
    renewalDirection?: RenewalDirection
}): StaffLookupViewModel {
    return {
        record: params.record,
        extend: buildCalculationEntry({
            record: params.record,
            currentDate: params.currentDate,
            transactionType: "ต่อดอก",
            renewalDirection: params.renewalDirection,
        }),
        redeem: buildCalculationEntry({
            record: params.record,
            currentDate: params.currentDate,
            transactionType: "ไถ่ของ",
        }),
    }
}
