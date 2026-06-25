import { NextRequest, NextResponse } from "next/server"
import { sendLineGroupMessage } from "@/lib/line"
import { retrieveOmiseCharge, verifyOmiseEventById } from "@/lib/omise"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { getLineEnv, getOmiseEnv } from "@/lib/supabase/env"

function buildLineMessage(params: {
    pawnId: string
    amount: number
    paidDate: string
    paymentId: string
}): string {
    return [
        "มีรายการต่อดอกออนไลน์รอตรวจสอบ",
        `Pawn ID: ${params.pawnId}`,
        `ยอดชำระ: ${params.amount} บาท`,
        `วันที่ชำระ: ${params.paidDate}`,
        `Review: /staff/payments/${params.paymentId}`,
    ].join("\n")
}

export async function POST(request: NextRequest) {
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

    const payload = await request.json()
    const incomingEvent = payload as {
        id?: string
        key?: string
        data?: { id?: string }
    }
    const eventId = String(incomingEvent.id ?? "").trim()

    if (!eventId) {
        return NextResponse.json({ error: "Missing Omise event id" }, { status: 400 })
    }

    const duplicateCheck = await supabase
        .from("payment_webhook_events")
        .select("id", { head: true, count: "exact" })
        .eq("provider_event_id", eventId)

    if (duplicateCheck.error) {
        return NextResponse.json({ error: duplicateCheck.error.message }, { status: 500 })
    }

    if ((duplicateCheck.count ?? 0) > 0) {
        return NextResponse.json({ ok: true, status: "duplicate" })
    }

    try {
        const verifiedEvent = await verifyOmiseEventById({
            secretKey: omiseEnv.secretKey,
            eventId,
        })

        const eventType = String(verifiedEvent.key ?? "")
        const eventData = (verifiedEvent.data ?? {}) as {
            id?: string
        }
        const chargeId = String(eventData.id ?? "").trim()

        if (!chargeId) {
            return NextResponse.json(
                { error: "Webhook payload is missing charge id" },
                { status: 400 }
            )
        }

        const verifiedCharge = await retrieveOmiseCharge({
            secretKey: omiseEnv.secretKey,
            chargeId,
        })
        const linkId =
            typeof verifiedCharge.link === "string"
                ? verifiedCharge.link
                : String(verifiedCharge.link?.id ?? "").trim()
        const metadataPaymentId = String(
            verifiedCharge.metadata?.payment_id ?? ""
        ).trim()

        let paymentLookup = supabase
            .from("payments")
            .select("id, pawn_id_snapshot, amount, payment_status")

        if (metadataPaymentId) {
            paymentLookup = paymentLookup.eq("id", metadataPaymentId)
        } else if (linkId) {
            paymentLookup = paymentLookup.eq("omise_link_id", linkId)
        } else {
            return NextResponse.json(
                { error: "Verified charge is not linked to a local payment" },
                { status: 400 }
            )
        }

        const paymentLookupResult = await paymentLookup.maybeSingle()

        if (paymentLookupResult.error || !paymentLookupResult.data) {
            return NextResponse.json(
                {
                    error:
                        paymentLookupResult.error?.message ||
                        "No local payment matches the verified charge",
                },
                { status: 400 }
            )
        }

        const paymentId = String(paymentLookupResult.data.id)

        const { data: webhookRow, error: webhookInsertError } = await supabase
            .from("payment_webhook_events")
            .insert({
                provider_event_id: eventId,
                event_type: eventType,
                payload: {
                    event: verifiedEvent,
                    verified_charge: verifiedCharge,
                },
            })
            .select("id")
            .single()

        if (webhookInsertError || !webhookRow) {
            throw new Error(webhookInsertError?.message || "Failed to log webhook")
        }

        if (
            eventType !== "charge.complete" ||
            verifiedCharge.paid !== true ||
            verifiedCharge.status !== "successful"
        ) {
            await supabase
                .from("payment_webhook_events")
                .update({
                    processed_at: new Date().toISOString(),
                    payment_id: paymentId,
                })
                .eq("id", webhookRow.id)

            return NextResponse.json({ ok: true, status: "ignored_unpaid_event" })
        }

        if (verifiedCharge.amount !== Number(paymentLookupResult.data.amount) * 100) {
            throw new Error("Verified Omise charge amount does not match local payment")
        }

        const paidAt = new Date().toISOString()
        const effectiveRenewalDate = paidAt.slice(0, 10)

        const paymentUpdateResult = await supabase
            .from("payments")
            .update({
                payment_status: "paid",
                renewal_status: "pending_staff_review",
                paid_at: paidAt,
                effective_renewal_date: effectiveRenewalDate,
                omise_charge_id: chargeId,
            })
            .eq("id", paymentId)
            .select("id, pawn_id_snapshot, amount")
            .single()

        if (paymentUpdateResult.error || !paymentUpdateResult.data) {
            throw new Error(
                paymentUpdateResult.error?.message || "Failed to update payment status"
            )
        }

        const payment = paymentUpdateResult.data as {
            id: string
            pawn_id_snapshot: string
            amount: number
        }

        const taskUpsertResult = await supabase
            .from("staff_review_tasks")
            .upsert(
                {
                    payment_id: paymentId,
                    status: "pending",
                    assigned_group: "shared_staff_group",
                },
                {
                    onConflict: "payment_id",
                }
            )
            .select("id")
            .single()

        if (taskUpsertResult.error || !taskUpsertResult.data) {
            throw new Error(
                taskUpsertResult.error?.message || "Failed to create review task"
            )
        }

        const taskId = String(taskUpsertResult.data.id)
        const notificationInsertResult = await supabase
            .from("notification_deliveries")
            .insert({
                task_id: taskId,
                channel: "line_group",
                status: "pending",
            })
            .select("id")
            .single()

        if (notificationInsertResult.error || !notificationInsertResult.data) {
            throw new Error(
                notificationInsertResult.error?.message ||
                    "Failed to create notification delivery"
            )
        }

        const notificationId = String(notificationInsertResult.data.id)
        const lineEnv = getLineEnv()

        try {
            if (!lineEnv) {
                throw new Error("LINE is not configured")
            }

            await sendLineGroupMessage({
                channelAccessToken: lineEnv.channelAccessToken,
                groupId: lineEnv.groupId,
                text: buildLineMessage({
                    pawnId: payment.pawn_id_snapshot,
                    amount: payment.amount,
                    paidDate: effectiveRenewalDate,
                    paymentId,
                }),
            })

            await supabase
                .from("notification_deliveries")
                .update({
                    status: "sent",
                    attempt_count: 1,
                    last_attempted_at: new Date().toISOString(),
                })
                .eq("id", notificationId)
        } catch (error) {
            await supabase
                .from("notification_deliveries")
                .update({
                    status: "failed",
                    attempt_count: 1,
                    last_error:
                        error instanceof Error
                            ? error.message
                            : "Unknown LINE delivery error",
                    last_attempted_at: new Date().toISOString(),
                })
                .eq("id", notificationId)
        }

        await supabase
            .from("payment_webhook_events")
            .update({
                processed_at: new Date().toISOString(),
                payment_id: paymentId,
            })
            .eq("id", webhookRow.id)

        return NextResponse.json({ ok: true, status: "processed" })
    } catch (error) {
        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Unexpected Omise webhook error",
            },
            { status: 500 }
        )
    }
}
