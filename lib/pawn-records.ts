import type { SupabaseClient } from "@supabase/supabase-js"
import type { PawnRecord } from "@/lib/staff-lookup"

interface PawnRecordRow {
    pawn_id: string
    customer_phone: string | null
    start_date: string
    loan_amount: number
    promo_type: PawnRecord["promoType"]
    archived_from_source: boolean
    source_updated_at: string | null
    last_synced_at: string | null
}

function mapPawnRecordRow(row: PawnRecordRow): PawnRecord {
    return {
        pawnId: row.pawn_id,
        customerPhone: row.customer_phone,
        startDate: row.start_date,
        loanAmount: row.loan_amount,
        promoType: row.promo_type,
        archivedFromSource: row.archived_from_source,
        sourceUpdatedAt: row.source_updated_at,
        lastSyncedAt: row.last_synced_at,
    }
}

export async function getPawnRecordById(params: {
    supabase: SupabaseClient
    pawnId: string
}): Promise<PawnRecord | null> {
    const { data, error } = await params.supabase
        .from("pawn_records")
        .select(
            "pawn_id, customer_phone, start_date, loan_amount, promo_type, archived_from_source, source_updated_at, last_synced_at"
        )
        .eq("pawn_id", params.pawnId)
        .maybeSingle<PawnRecordRow>()

    if (error) {
        throw new Error(error.message)
    }

    if (!data) {
        return null
    }

    return mapPawnRecordRow(data)
}
