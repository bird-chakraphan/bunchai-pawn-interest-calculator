export const SEARCHABLE_PAWN_RECORD_STATUS = "ยังอยู่ในกำหนด" as const

export const PAWN_RECORD_SOURCE_STATUSES = [
    "ไถ่แล้ว",
    "เอาขาด",
    SEARCHABLE_PAWN_RECORD_STATUS,
] as const

export type PawnRecordSourceStatus =
    (typeof PAWN_RECORD_SOURCE_STATUSES)[number]

export function isPawnRecordSourceStatus(
    value: string
): value is PawnRecordSourceStatus {
    return PAWN_RECORD_SOURCE_STATUSES.includes(value as PawnRecordSourceStatus)
}
