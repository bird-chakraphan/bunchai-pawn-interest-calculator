import type { SupabaseClient } from "@supabase/supabase-js"
import {
    buildArchivedPawnIds,
    prepareSyncRows,
    type IncomingSyncRow,
} from "@/lib/sync-pawn-records"

export interface PawnRecordSyncPayload {
    source: "google_sheets"
    spreadsheetId: string
    sheetName: string
    startedAt: string
    rows: IncomingSyncRow[]
}

export interface PawnRecordSyncResult {
    syncRunId: string
    rowCount: number
    insertedCount: number
    updatedCount: number
    archivedCount: number
    warningCount: number
}

export async function runPawnRecordSync(params: {
    supabase: SupabaseClient
    payload: PawnRecordSyncPayload
}): Promise<PawnRecordSyncResult> {
    const { data: syncRunRow, error: syncRunInsertError } = await params.supabase
        .from("sync_runs")
        .insert({
            status: "running",
            started_at: params.payload.startedAt,
            row_count: params.payload.rows.length,
        })
        .select("id")
        .single()

    if (syncRunInsertError || !syncRunRow) {
        throw new Error(syncRunInsertError?.message || "Failed to create sync run")
    }

    const syncRunId = String(syncRunRow.id)

    try {
        const prepared = prepareSyncRows(params.payload.rows)

        const { data: existingRows, error: existingRowsError } = await params.supabase
            .from("pawn_records")
            .select("pawn_id")

        if (existingRowsError) {
            throw new Error(existingRowsError.message)
        }

        const existingPawnIds = (existingRows ?? []).map((row) => String(row.pawn_id))
        const activeIncomingPawnIds = prepared.validRows.map((row) => row.pawnId)
        const archivedPawnIds = buildArchivedPawnIds({
            existingPawnIds,
            activeIncomingPawnIds,
        })

        let insertedCount = 0
        let updatedCount = 0

        if (prepared.validRows.length > 0) {
            const nowIso = new Date().toISOString()
            const upsertPayload = prepared.validRows.map((row) => ({
                pawn_id: row.pawnId,
                customer_phone: row.customerPhone,
                start_date: row.startDate,
                loan_amount: row.loanAmount,
                promo_type: row.promoType,
                base_rate: row.baseRate,
                archived_from_source: false,
                source_updated_at: row.sourceUpdatedAt,
                last_synced_at: nowIso,
            }))

            const existingSet = new Set(existingPawnIds)
            insertedCount = prepared.validRows.filter((row) => !existingSet.has(row.pawnId)).length
            updatedCount = prepared.validRows.length - insertedCount

            const { error: upsertError } = await params.supabase
                .from("pawn_records")
                .upsert(upsertPayload, {
                    onConflict: "pawn_id",
                })

            if (upsertError) {
                throw new Error(upsertError.message)
            }
        }

        if (archivedPawnIds.length > 0) {
            const { error: archiveError } = await params.supabase
                .from("pawn_records")
                .update({
                    archived_from_source: true,
                    last_synced_at: new Date().toISOString(),
                })
                .in("pawn_id", archivedPawnIds)

            if (archiveError) {
                throw new Error(archiveError.message)
            }
        }

        if (prepared.issues.length > 0) {
            const { error: issuesError } = await params.supabase
                .from("sync_run_issues")
                .insert(
                    prepared.issues.map((issue) => ({
                        sync_run_id: syncRunId,
                        row_index: issue.rowIndex,
                        pawn_id_raw: issue.pawnIdRaw,
                        severity: issue.severity,
                        reason: issue.reason,
                        raw_row: issue.rawRow,
                    }))
                )

            if (issuesError) {
                throw new Error(issuesError.message)
            }
        }

        const warningCount = prepared.issues.length

        const { error: finishError } = await params.supabase
            .from("sync_runs")
            .update({
                status: "success",
                finished_at: new Date().toISOString(),
                inserted_count: insertedCount,
                updated_count: updatedCount,
                archived_count: archivedPawnIds.length,
                warning_count: warningCount,
            })
            .eq("id", syncRunId)

        if (finishError) {
            throw new Error(finishError.message)
        }

        return {
            syncRunId,
            rowCount: params.payload.rows.length,
            insertedCount,
            updatedCount,
            archivedCount: archivedPawnIds.length,
            warningCount,
        }
    } catch (error) {
        await params.supabase
            .from("sync_runs")
            .update({
                status: "failed",
                finished_at: new Date().toISOString(),
                error_message:
                    error instanceof Error ? error.message : "Unexpected sync failure",
            })
            .eq("id", syncRunId)

        throw error
    }
}
