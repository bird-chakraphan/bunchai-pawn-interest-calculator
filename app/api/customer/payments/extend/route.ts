import { NextRequest, NextResponse } from "next/server"
import { buildCustomerLookupOutcome } from "@/lib/customer-lookup"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { arePaymentsEnabled, getOmiseEnv } from "@/lib/supabase/env"
import { getPawnRecordById } from "@/lib/pawn-records"
import { buildPendingExtendPayment } from "@/lib/payments"
import { createOmisePaymentLink } from "@/lib/omise"

export async function POST(request: NextRequest) {
    if (!arePaymentsEnabled()) {
        return NextResponse.json(
            { error: "Online payment is not available" },
            { status: 404 }
        )
    }

    const supabase = createAdminSupabaseClient()
    const omiseEnv = getOmiseEnv()

    if (!supabase) {
        return NextResponse.json(
            { error: "Supabase service role is not configured" },
            { status: 503 }
        )
    }

    if (!omiseEnv) {
        return NextResponse.json(
            { error: "Omise is not configured" },
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

    const record = await getPawnRecordById({
        supabase,
        pawnId,
    })

    const lookupOutcome = buildCustomerLookupOutcome({
        record,
        enteredPhone: phone,
        currentDate: new Date().toISOString().slice(0, 10),
    })

    if (lookupOutcome.status !== "success") {
        return NextResponse.json({ status: lookupOutcome.status })
    }

    const paymentDraft = buildPendingExtendPayment({
        record: lookupOutcome.record,
        lookupViewModel: lookupOutcome.lookupViewModel,
    })

    const { data: paymentRow, error: paymentInsertError } = await supabase
        .from("payments")
        .insert({
            pawn_record_id: paymentDraft.pawnRecordId,
            pawn_id_snapshot: paymentDraft.pawnIdSnapshot,
            transaction_type: paymentDraft.transactionType,
            amount: paymentDraft.amountBaht,
            currency: paymentDraft.currency,
            payment_status: paymentDraft.paymentStatus,
            renewal_status: paymentDraft.renewalStatus,
            start_date_before_payment: paymentDraft.startDateBeforePayment,
            calculation_snapshot: paymentDraft.calculationSnapshot,
        })
        .select("id")
        .single()

    if (paymentInsertError || !paymentRow) {
        return NextResponse.json(
            { error: paymentInsertError?.message || "Failed to create payment row" },
            { status: 500 }
        )
    }

    try {
        const paymentId = String(paymentRow.id)
        const omiseLink = await createOmisePaymentLink({
            secretKey: omiseEnv.secretKey,
            amountSubunits: paymentDraft.amountSubunits,
            title: `Bunchai Pawn ${paymentDraft.pawnIdSnapshot}`,
            description: `ต่อดอก ${paymentDraft.pawnIdSnapshot}`,
        })

        const { error: paymentUpdateError } = await supabase
            .from("payments")
            .update({
                omise_link_id: omiseLink.omiseLinkId,
                omise_checkout_url: omiseLink.checkoutUrl,
            })
            .eq("id", paymentId)

        if (paymentUpdateError) {
            throw new Error(paymentUpdateError.message)
        }

        return NextResponse.json({
            status: "success",
            paymentId,
            checkoutUrl: omiseLink.checkoutUrl,
        })
    } catch (error) {
        await supabase
            .from("payments")
            .update({
                payment_status: "failed",
            })
            .eq("id", paymentRow.id)

        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to create Omise payment link",
            },
            { status: 500 }
        )
    }
}
