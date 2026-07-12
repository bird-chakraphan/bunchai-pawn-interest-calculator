import type { SupabaseClient } from "@supabase/supabase-js"
import {
    SEARCHABLE_PAWN_RECORD_STATUS,
    type PawnRecordSourceStatus,
} from "@/lib/pawn-record-status"
import type { PawnRecord } from "@/lib/staff-lookup"

interface PawnRecordRow {
    id: string
    pawn_id: string
    customer_phone: string | null
    start_date: string
    loan_amount: number | string
    promo_type: string
    base_rate: number | string | null
    source_status?: PawnRecordSourceStatus | null
    archived_from_source: boolean
    source_updated_at: string | null
    last_synced_at: string | null
}

export type StaffPawnLookupResult =
    | { status: "active"; record: PawnRecord }
    | { status: "redeemed" | "expired" | "not_found" }

function normalizeLoanAmount(value: number | string): number {
    const parsedValue =
        typeof value === "number" ? value : Number.parseFloat(value)

    if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
        throw new Error("Invalid loan_amount value returned from pawn_records")
    }

    return parsedValue
}

function normalizeOptionalTimestamp(value: string | null): string | null {
    if (!value) {
        return null
    }

    const parsedDate = new Date(value)

    if (Number.isNaN(parsedDate.getTime())) {
        return null
    }

    return parsedDate.toISOString()
}

function normalizeBaseRate(value: number | string | null): number {
    const parsedValue =
        typeof value === "number" ? value : Number.parseFloat(String(value ?? ""))

    if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
        return 0.02
    }

    return parsedValue
}

function mapPawnRecordRow(row: PawnRecordRow): PawnRecord {
    return {
        id: row.id,
        pawnId: row.pawn_id,
        customerPhone: row.customer_phone,
        startDate: row.start_date,
        loanAmount: normalizeLoanAmount(row.loan_amount),
        promoType: row.promo_type,
        baseRate: normalizeBaseRate(row.base_rate),
        archivedFromSource: row.archived_from_source,
        sourceUpdatedAt: normalizeOptionalTimestamp(row.source_updated_at),
        lastSyncedAt: normalizeOptionalTimestamp(row.last_synced_at),
    }
}

export async function getPawnRecordById(params: {
    supabase: SupabaseClient
    pawnId: string
}): Promise<PawnRecord | null> {
    const { data, error } = await params.supabase
        .from("pawn_records")
        .select(
            "id, pawn_id, customer_phone, start_date, loan_amount, promo_type, base_rate, archived_from_source, source_updated_at, last_synced_at"
        )
        .eq("pawn_id", params.pawnId)
        .eq("source_status", SEARCHABLE_PAWN_RECORD_STATUS)
        .eq("archived_from_source", false)
        .maybeSingle<PawnRecordRow>()

    if (error) {
        throw new Error(error.message)
    }

    if (!data) {
        return null
    }

    return mapPawnRecordRow(data)
}

export async function getStaffPawnLookupById(params: {
    supabase: SupabaseClient
    pawnId: string
}): Promise<StaffPawnLookupResult> {
    const { data, error } = await params.supabase
        .from("pawn_records")
        .select(
            "id, pawn_id, customer_phone, start_date, loan_amount, promo_type, base_rate, source_status, archived_from_source, source_updated_at, last_synced_at"
        )
        .eq("pawn_id", params.pawnId)
        .eq("archived_from_source", false)
        .maybeSingle<PawnRecordRow>()

    if (error) {
        throw new Error(error.message)
    }

    if (!data) {
        return { status: "not_found" }
    }

    if (data.source_status === SEARCHABLE_PAWN_RECORD_STATUS) {
        return { status: "active", record: mapPawnRecordRow(data) }
    }

    if (data.source_status === "ไถ่แล้ว") {
        return { status: "redeemed" }
    }

    if (data.source_status === "เอาขาด") {
        return { status: "expired" }
    }

    return { status: "not_found" }
}
