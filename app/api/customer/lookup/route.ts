import { createHash } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import {
    buildCustomerLookupOutcome,
    isCustomerLookupRateLimited,
} from "@/lib/customer-lookup"
import { getPawnRecordById } from "@/lib/pawn-records"

const LOOKUP_RATE_LIMIT_WINDOW_MINUTES = 15

function getRequestIpAddress(request: NextRequest): string {
    const forwardedFor = request.headers.get("x-forwarded-for")

    if (forwardedFor) {
        return forwardedFor.split(",")[0]?.trim() || "unknown"
    }

    return request.headers.get("x-real-ip")?.trim() || "unknown"
}

function hashIpAddress(ipAddress: string): string {
    return createHash("sha256").update(ipAddress).digest("hex")
}

export async function POST(request: NextRequest) {
    const supabase = createAdminSupabaseClient()

    if (!supabase) {
        return NextResponse.json(
            { error: "Supabase service role is not configured" },
            { status: 503 }
        )
    }

    const body = (await request.json()) as {
        pawnId?: string
        phone?: string
    }

    const pawnId = String(body.pawnId ?? "").trim()
    const phone = String(body.phone ?? "").trim()

    if (!pawnId || !phone) {
        return NextResponse.json(
            { error: "Pawn ID and mobile number are required" },
            { status: 400 }
        )
    }

    const ipHash = hashIpAddress(getRequestIpAddress(request))
    const windowStart = new Date(
        Date.now() - LOOKUP_RATE_LIMIT_WINDOW_MINUTES * 60 * 1000
    ).toISOString()

    const recentAttemptResult = await supabase
        .from("customer_lookup_attempts")
        .select("id", { count: "exact", head: true })
        .eq("normalized_pawn_id", pawnId)
        .eq("ip_hash", ipHash)
        .gte("created_at", windowStart)

    if (recentAttemptResult.error) {
        return NextResponse.json(
            { error: recentAttemptResult.error.message },
            { status: 500 }
        )
    }

    if (isCustomerLookupRateLimited(recentAttemptResult.count ?? 0)) {
        await supabase.from("customer_lookup_attempts").insert({
            normalized_pawn_id: pawnId,
            ip_hash: ipHash,
            result_status: "rate_limited",
        })

        return NextResponse.json({ status: "rate_limited" }, { status: 429 })
    }

    const record = await getPawnRecordById({
        supabase,
        pawnId,
    })

    const outcome = buildCustomerLookupOutcome({
        record,
        enteredPhone: phone,
        currentDate: new Date().toISOString().slice(0, 10),
    })

    const insertAttemptResult = await supabase.from("customer_lookup_attempts").insert({
        normalized_pawn_id: pawnId,
        ip_hash: ipHash,
        result_status: outcome.status,
    })

    if (insertAttemptResult.error) {
        return NextResponse.json(
            { error: insertAttemptResult.error.message },
            { status: 500 }
        )
    }

    if (outcome.status !== "success") {
        return NextResponse.json({ status: outcome.status })
    }

    return NextResponse.json({
        status: "success",
        record: {
            pawnId: outcome.record.pawnId,
            startDate: outcome.record.startDate,
            loanAmount: outcome.record.loanAmount,
            promoType: outcome.record.promoType,
        },
        lookupViewModel: outcome.lookupViewModel,
    })
}
