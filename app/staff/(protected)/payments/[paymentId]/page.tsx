import Link from "next/link"
import { notFound } from "next/navigation"
import { markPaymentReviewCompleteAction } from "@/app/staff/(protected)/payments/actions"
import { signOutAction } from "@/app/staff/sign-in/actions"
import {
    formatBaht,
    formatThaiDate,
    formatThaiDateTime,
    getPaymentStatusLabel,
    getRenewalStatusLabel,
} from "@/lib/payment-presentation"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

interface PaymentDetail {
    id: string
    pawn_id_snapshot: string
    transaction_type: string
    amount: number
    currency: string
    payment_status: string
    renewal_status: string
    start_date_before_payment: string
    effective_renewal_date: string | null
    calculation_snapshot: Record<string, unknown>
    omise_link_id: string | null
    omise_charge_id: string | null
    paid_at: string | null
    created_at: string
}

interface ReviewTaskDetail {
    id: string
    status: string
    created_at: string
    reviewed_at: string | null
    reviewed_by: string | null
}

interface NotificationDetail {
    id: string
    status: string
    attempt_count: number
    last_error: string | null
    last_attempted_at: string | null
}

export default async function StaffPaymentDetailPage(props: {
    params: Promise<{ paymentId: string }>
    searchParams: Promise<{ success?: string; error?: string }>
}) {
    const [{ paymentId }, searchParams] = await Promise.all([
        props.params,
        props.searchParams,
    ])
    const supabase = createAdminSupabaseClient()

    if (!supabase) {
        return <PaymentDetailSetupState />
    }

    const [paymentResult, taskResult] = await Promise.all([
        supabase.from("payments").select("*").eq("id", paymentId).maybeSingle(),
        supabase
            .from("staff_review_tasks")
            .select("id, status, created_at, reviewed_at, reviewed_by")
            .eq("payment_id", paymentId)
            .maybeSingle(),
    ])

    if (paymentResult.error) {
        return <PaymentLoadError message={paymentResult.error.message} />
    }

    if (!paymentResult.data) {
        notFound()
    }

    const payment = paymentResult.data as PaymentDetail
    const task = (taskResult.data ?? null) as ReviewTaskDetail | null
    const notificationResult = task
        ? await supabase
              .from("notification_deliveries")
              .select("id, status, attempt_count, last_error, last_attempted_at")
              .eq("task_id", task.id)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle()
        : null
    const notification = (notificationResult?.data ?? null) as NotificationDetail | null
    const canCompleteReview =
        payment.payment_status === "paid" &&
        payment.renewal_status === "pending_staff_review" &&
        task?.status === "pending"

    return (
        <main className="phase-page">
            <section className="pawn-calculator-app">
                <div className="pawn-top-action">
                    <form action={signOutAction}>
                        <button className="staff-secondary-button" type="submit">
                            Sign Out
                        </button>
                    </form>
                </div>

                <header className="pawn-header pawn-header-with-actions">
                    <div className="pawn-title-row">
                        <h1>ตรวจสอบการชำระ {payment.pawn_id_snapshot}</h1>
                        <Link className="staff-inline-action" href="/staff/payments">
                            กลับไปรายการชำระเงิน
                        </Link>
                    </div>
                </header>

                {searchParams.success === "reviewed" ? (
                    <div className="staff-auth-message">
                        บันทึกว่าพนักงานอัปเดต AppSheet เรียบร้อยแล้ว
                    </div>
                ) : null}
                {searchParams.error ? (
                    <div className="staff-auth-message is-error">
                        ไม่สามารถบันทึกการตรวจสอบได้: {searchParams.error}
                    </div>
                ) : null}
                {taskResult.error ? (
                    <div className="staff-auth-message is-error">
                        ไม่สามารถโหลดงานตรวจสอบได้: {taskResult.error.message}
                    </div>
                ) : null}

                <section className="staff-payment-detail-grid">
                    <div className="pawn-card staff-payment-detail-card">
                        <h2>ข้อมูลการชำระเงิน</h2>
                        <DetailRows
                            rows={[
                                ["Pawn ID", payment.pawn_id_snapshot],
                                ["รายการ", payment.transaction_type],
                                ["ยอดชำระ", formatBaht(payment.amount)],
                                ["สถานะชำระเงิน", getPaymentStatusLabel(payment.payment_status)],
                                ["สถานะต่อดอก", getRenewalStatusLabel(payment.renewal_status)],
                                ["ชำระเมื่อ", formatThaiDateTime(payment.paid_at)],
                                ["วันต่อดอกเดิม", formatThaiDate(payment.start_date_before_payment)],
                                ["วันต่อดอกใหม่", formatThaiDate(payment.effective_renewal_date)],
                            ]}
                        />
                    </div>

                    <div className="pawn-card staff-payment-detail-card">
                        <h2>ข้อมูลอ้างอิง</h2>
                        <DetailRows
                            rows={[
                                ["Payment ID", payment.id],
                                ["Omise link", payment.omise_link_id ?? "-"],
                                ["Omise charge", payment.omise_charge_id ?? "-"],
                                ["สร้างรายการเมื่อ", formatThaiDateTime(payment.created_at)],
                                ["LINE notification", notification?.status ?? "-"],
                                ["จำนวนครั้งที่ส่ง", String(notification?.attempt_count ?? 0)],
                                ["ส่งล่าสุด", formatThaiDateTime(notification?.last_attempted_at ?? null)],
                                ["ข้อผิดพลาด LINE", notification?.last_error ?? "-"],
                            ]}
                        />
                    </div>
                </section>

                <section className="pawn-card staff-payment-detail-card staff-payment-calculation-card">
                    <h2>Calculation snapshot</h2>
                    <pre>{JSON.stringify(payment.calculation_snapshot, null, 2)}</pre>
                </section>

                <section className="pawn-card staff-payment-review-card">
                    <div>
                        <h2>ยืนยันหลังอัปเดต AppSheet</h2>
                        <p>
                            ตรวจสอบข้อมูลด้านบน อัปเดตวันต่อดอกใน AppSheet แล้วจึงกดปุ่มยืนยัน
                            ระบบนี้จะไม่แก้ Google Sheet โดยตรงใน MVP
                        </p>
                    </div>
                    {canCompleteReview ? (
                        <form action={markPaymentReviewCompleteAction}>
                            <input name="paymentId" type="hidden" value={payment.id} />
                            <button className="staff-primary-button" type="submit">
                                ยืนยันว่าอัปเดต AppSheet แล้ว
                            </button>
                        </form>
                    ) : (
                        <div className="staff-auth-message">
                            {task?.status === "completed"
                                ? `ตรวจสอบแล้วเมื่อ ${formatThaiDateTime(task.reviewed_at)}`
                                : "รายการนี้ยังไม่พร้อมให้ยืนยันการตรวจสอบ"}
                        </div>
                    )}
                </section>
            </section>
        </main>
    )
}

function DetailRows(props: { rows: Array<[string, string]> }) {
    return (
        <dl className="staff-payment-detail-list">
            {props.rows.map(([label, value]) => (
                <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                </div>
            ))}
        </dl>
    )
}

function PaymentDetailSetupState() {
    return (
        <main className="phase-page">
            <section className="pawn-calculator-app">
                <header className="pawn-header">
                    <h1>ตรวจสอบการชำระเงิน</h1>
                </header>
                <div className="pawn-card staff-auth-card">
                    <div className="staff-auth-message is-warning">
                        ยังไม่ได้ตั้งค่า Supabase service role สำหรับหน้าตรวจสอบการชำระเงิน
                    </div>
                </div>
            </section>
        </main>
    )
}

function PaymentLoadError(props: { message: string }) {
    return (
        <main className="phase-page">
            <section className="pawn-calculator-app">
                <header className="pawn-header">
                    <h1>ตรวจสอบการชำระเงิน</h1>
                </header>
                <div className="staff-auth-message is-error">
                    ไม่สามารถโหลดรายการชำระเงินได้: {props.message}
                </div>
            </section>
        </main>
    )
}
