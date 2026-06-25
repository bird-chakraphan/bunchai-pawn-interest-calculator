import type { SupabaseClient } from "@supabase/supabase-js"

export interface SyncRunSummary {
    id: string
    status: string
    startedAt: string
    finishedAt: string | null
    rowCount: number
    insertedCount: number
    updatedCount: number
    archivedCount: number
    warningCount: number
    errorMessage: string | null
}

export interface SyncRunIssueSummary {
    id: string
    syncRunId: string
    rowIndex: number | null
    pawnIdRaw: string | null
    severity: "warning" | "error"
    reason: string
    createdAt: string
}

export interface SyncHealthSnapshot {
    latestRun: SyncRunSummary | null
    lastSuccessfulRun: SyncRunSummary | null
    recentIssues: SyncRunIssueSummary[]
    activeRecordCount: number
    archivedRecordCount: number
}

function mapSyncRun(row: Record<string, unknown>): SyncRunSummary {
    return {
        id: String(row.id),
        status: String(row.status),
        startedAt: String(row.started_at),
        finishedAt: row.finished_at ? String(row.finished_at) : null,
        rowCount: Number(row.row_count ?? 0),
        insertedCount: Number(row.inserted_count ?? 0),
        updatedCount: Number(row.updated_count ?? 0),
        archivedCount: Number(row.archived_count ?? 0),
        warningCount: Number(row.warning_count ?? 0),
        errorMessage: row.error_message ? String(row.error_message) : null,
    }
}

function mapSyncIssue(row: Record<string, unknown>): SyncRunIssueSummary {
    return {
        id: String(row.id),
        syncRunId: String(row.sync_run_id),
        rowIndex:
            typeof row.row_index === "number" ? row.row_index : row.row_index ? Number(row.row_index) : null,
        pawnIdRaw: row.pawn_id_raw ? String(row.pawn_id_raw) : null,
        severity: row.severity === "warning" ? "warning" : "error",
        reason: String(row.reason),
        createdAt: String(row.created_at),
    }
}

export async function getSyncHealthSnapshot(params: {
    supabase: SupabaseClient
}): Promise<SyncHealthSnapshot> {
    const [latestRunResult, lastSuccessfulRunResult, recentIssuesResult, activeCountResult, archivedCountResult] =
        await Promise.all([
            params.supabase
                .from("sync_runs")
                .select("*")
                .order("started_at", { ascending: false })
                .limit(1)
                .maybeSingle(),
            params.supabase
                .from("sync_runs")
                .select("*")
                .eq("status", "success")
                .order("finished_at", { ascending: false })
                .limit(1)
                .maybeSingle(),
            params.supabase
                .from("sync_run_issues")
                .select("id, sync_run_id, row_index, pawn_id_raw, severity, reason, created_at")
                .order("created_at", { ascending: false })
                .limit(20),
            params.supabase
                .from("pawn_records")
                .select("id", { count: "exact", head: true })
                .eq("archived_from_source", false),
            params.supabase
                .from("pawn_records")
                .select("id", { count: "exact", head: true })
                .eq("archived_from_source", true),
        ])

    for (const result of [
        latestRunResult,
        lastSuccessfulRunResult,
        recentIssuesResult,
        activeCountResult,
        archivedCountResult,
    ]) {
        if (result.error) {
            throw new Error(result.error.message)
        }
    }

    return {
        latestRun: latestRunResult.data ? mapSyncRun(latestRunResult.data as Record<string, unknown>) : null,
        lastSuccessfulRun: lastSuccessfulRunResult.data
            ? mapSyncRun(lastSuccessfulRunResult.data as Record<string, unknown>)
            : null,
        recentIssues: (recentIssuesResult.data ?? []).map((row) =>
            mapSyncIssue(row as Record<string, unknown>)
        ),
        activeRecordCount: activeCountResult.count ?? 0,
        archivedRecordCount: archivedCountResult.count ?? 0,
    }
}
