import { NextRequest, NextResponse } from "next/server"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { getInternalSyncSecret } from "@/lib/supabase/env"
import {
    runPawnRecordSync,
    type PawnRecordSyncPayload,
} from "@/lib/run-pawn-record-sync"

function isSyncPayload(value: unknown): value is PawnRecordSyncPayload {
    if (!value || typeof value !== "object") {
        return false
    }

    const payload = value as Record<string, unknown>

    return (
        payload.source === "google_sheets" &&
        typeof payload.spreadsheetId === "string" &&
        typeof payload.sheetName === "string" &&
        typeof payload.startedAt === "string" &&
        Array.isArray(payload.rows)
    )
}

export async function POST(request: NextRequest) {
    const syncSecret = getInternalSyncSecret()

    if (!syncSecret) {
        return NextResponse.json(
            { error: "Sync secret is not configured" },
            { status: 503 }
        )
    }

    if (request.headers.get("x-sync-secret") !== syncSecret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createAdminSupabaseClient()

    if (!supabase) {
        return NextResponse.json(
            { error: "Supabase service role is not configured" },
            { status: 503 }
        )
    }

    const payload = await request.json()

    if (!isSyncPayload(payload)) {
        return NextResponse.json({ error: "Invalid sync payload" }, { status: 400 })
    }

    try {
        const result = await runPawnRecordSync({
            supabase,
            payload,
        })

        return NextResponse.json({
            ok: true,
            ...result,
        })
    } catch (error) {
        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Unexpected sync error",
            },
            { status: 500 }
        )
    }
}
