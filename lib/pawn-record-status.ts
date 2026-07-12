export const SEARCHABLE_PAWN_RECORD_STATUS = "ยังอยู่ในกำหนด" as const

export const SEARCHABLE_PAWN_RECORD_STATUSES = [
    SEARCHABLE_PAWN_RECORD_STATUS,
    "ช่วงผ่อนผัน",
    "วันสุดท้าย",
] as const

export const EXPIRED_PAWN_RECORD_STATUSES = ["เอาขาด", "ขาดแล้ว"] as const

export const PAWN_RECORD_SOURCE_STATUSES = [
    "ไถ่แล้ว",
    ...EXPIRED_PAWN_RECORD_STATUSES,
    ...SEARCHABLE_PAWN_RECORD_STATUSES,
] as const

export type PawnRecordSourceStatus =
    (typeof PAWN_RECORD_SOURCE_STATUSES)[number]

export function isPawnRecordSourceStatus(
    value: string
): value is PawnRecordSourceStatus {
    return PAWN_RECORD_SOURCE_STATUSES.includes(value as PawnRecordSourceStatus)
}

export function isSearchablePawnRecordStatus(
    value: PawnRecordSourceStatus | null | undefined
): boolean {
    return SEARCHABLE_PAWN_RECORD_STATUSES.includes(
        value as (typeof SEARCHABLE_PAWN_RECORD_STATUSES)[number]
    )
}

export function isExpiredPawnRecordStatus(
    value: PawnRecordSourceStatus | null | undefined
): boolean {
    return EXPIRED_PAWN_RECORD_STATUSES.includes(
        value as (typeof EXPIRED_PAWN_RECORD_STATUSES)[number]
    )
}
