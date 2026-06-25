import {
    calculatePawnInterest,
    type PawnInterestResult,
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
        }),
    }
}

export function buildStaffLookupViewModel(params: {
    record: PawnRecord
    currentDate: string
}): StaffLookupViewModel {
    return {
        record: params.record,
        extend: buildCalculationEntry({
            record: params.record,
            currentDate: params.currentDate,
            transactionType: "ต่อดอก",
        }),
        redeem: buildCalculationEntry({
            record: params.record,
            currentDate: params.currentDate,
            transactionType: "ไถ่ของ",
        }),
    }
}
