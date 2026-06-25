"use server"

import { redirect } from "next/navigation"
import { recordAuditEvent } from "@/lib/audit-events"
import { getPaymentReviewDecision } from "@/lib/payment-review"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function markPaymentReviewCompleteAction(formData: FormData) {
    const paymentId = String(formData.get("paymentId") ?? "").trim()
    const authSupabase = await createServerSupabaseClient()
    const adminSupabase = createAdminSupabaseClient()

    if (!paymentId || !authSupabase || !adminSupabase) {
        redirect(`/staff/payments/${paymentId}?error=setup`)
    }

    const {
        data: { user },
    } = await authSupabase.auth.getUser()

    if (!user) {
        redirect("/staff/sign-in")
    }

    const [paymentResult, taskResult] = await Promise.all([
        adminSupabase
            .from("payments")
            .select("payment_status, renewal_status")
            .eq("id", paymentId)
            .maybeSingle(),
        adminSupabase
            .from("staff_review_tasks")
            .select("status")
            .eq("payment_id", paymentId)
            .maybeSingle(),
    ])

    if (paymentResult.error || taskResult.error) {
        const message = paymentResult.error?.message ?? taskResult.error?.message ?? "Lookup failed"
        redirect(`/staff/payments/${paymentId}?error=${encodeURIComponent(message)}`)
    }

    const reviewDecision = getPaymentReviewDecision({
        paymentStatus: paymentResult.data?.payment_status,
        renewalStatus: paymentResult.data?.renewal_status,
        taskStatus: taskResult.data?.status,
    })

    if (reviewDecision === "already_completed") {
        redirect(`/staff/payments/${paymentId}?success=reviewed`)
    }

    if (reviewDecision === "not_ready") {
        redirect(`/staff/payments/${paymentId}?error=not_ready_for_review`)
    }

    const reviewedAt = new Date().toISOString()

    const taskUpdateResult = await adminSupabase
        .from("staff_review_tasks")
        .update({
            status: "completed",
            reviewed_at: reviewedAt,
            reviewed_by: user.id,
        })
        .eq("payment_id", paymentId)
        .eq("status", "pending")

    if (taskUpdateResult.error) {
        redirect(`/staff/payments/${paymentId}?error=${encodeURIComponent(taskUpdateResult.error.message)}`)
    }

    const paymentUpdateResult = await adminSupabase
        .from("payments")
        .update({
            renewal_status: "review_completed",
        })
        .eq("id", paymentId)

    if (paymentUpdateResult.error) {
        redirect(`/staff/payments/${paymentId}?error=${encodeURIComponent(paymentUpdateResult.error.message)}`)
    }

    await recordAuditEvent({
        supabase: adminSupabase,
        actorUserId: user.id,
        eventType: "payment_review_completed",
        entityType: "payment",
        entityId: paymentId,
    }).catch(() => null)

    redirect(`/staff/payments/${paymentId}?success=reviewed`)
}
