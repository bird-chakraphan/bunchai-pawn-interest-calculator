import Link from "next/link"
import { signOutAction } from "@/app/staff/sign-in/actions"
import {
    formatBaht,
    formatThaiDateTime,
    getPaymentStatusLabel,
    getRenewalStatusLabel,
} from "@/lib/payment-presentation"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

interface ReviewQueueRow {
    id: string
    status: string
    created_at: string
    reviewed_at: string | null
    payment: {
        id: string
        pawn_id_snapshot: string
        amount: number
        payment_status: string
        renewal_status: string
        paid_at: string | null
    } | null
}

export default async function StaffPaymentsPage() {
    const supabase = createAdminSupabaseClient()

    if (!supabase) {
        return <PaymentSetupState />
    }

    const { data, error } = await supabase
        .from("staff_review_tasks")
        .select(
            "id, status, created_at, reviewed_at, payment:payments!staff_review_tasks_payment_id_fkey(id, pawn_id_snapshot, amount, payment_status, renewal_status, paid_at)"
        )
        .order("created_at", { ascending: false })

    const tasks = (data ?? []) as unknown as ReviewQueueRow[]
    const pendingTasks = tasks.filter((task) => task.status === "pending")
    const completedTasks = tasks.filter((task) => task.status === "completed")

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
                        <h1>รายการชำระเงิน</h1>
                        <Link className="staff-inline-action" href="/staff">
                            กลับไปหน้าพนักงาน
                        </Link>
                    </div>
                </header>

                {error ? (
                    <div className="staff-auth-message is-error">
                        ไม่สามารถโหลดรายการชำระเงินได้: {error.message}
                    </div>
                ) : null}

                <ReviewTaskSection
                    title={`รอตรวจสอบ (${pendingTasks.length})`}
                    tasks={pendingTasks}
                    emptyMessage="ไม่มีรายการที่รอพนักงานอัปเดต AppSheet"
                />
                <ReviewTaskSection
                    title={`ตรวจสอบแล้ว (${completedTasks.length})`}
                    tasks={completedTasks}
                    emptyMessage="ยังไม่มีรายการที่ตรวจสอบเสร็จ"
                />
            </section>
        </main>
    )
}

function PaymentSetupState() {
    return (
        <main className="phase-page">
            <section className="pawn-calculator-app">
                <header className="pawn-header pawn-header-with-actions">
                    <div className="pawn-title-row">
                        <h1>รายการชำระเงิน</h1>
                        <Link className="staff-inline-action" href="/staff">
                            กลับไปหน้าพนักงาน
                        </Link>
                    </div>
                </header>
                <div className="pawn-card staff-auth-card">
                    <div className="staff-auth-message is-warning">
                        ยังไม่ได้ตั้งค่า Supabase service role สำหรับหน้ารายการชำระเงิน
                    </div>
                </div>
            </section>
        </main>
    )
}

function ReviewTaskSection(props: {
    title: string
    tasks: ReviewQueueRow[]
    emptyMessage: string
}) {
    return (
        <section className="pawn-card staff-payment-section">
            <h2>{props.title}</h2>
            {props.tasks.length === 0 ? (
                <p className="staff-empty-copy">{props.emptyMessage}</p>
            ) : (
                <div className="staff-payment-list">
                    {props.tasks.map((task) => {
                        const payment = task.payment

                        if (!payment) {
                            return null
                        }

                        return (
                            <Link
                                className="staff-payment-row"
                                href={`/staff/payments/${payment.id}`}
                                key={task.id}
                            >
                                <div>
                                    <span>Pawn ID</span>
                                    <strong>{payment.pawn_id_snapshot}</strong>
                                </div>
                                <div>
                                    <span>ยอดชำระ</span>
                                    <strong>{formatBaht(payment.amount)}</strong>
                                </div>
                                <div>
                                    <span>ชำระเมื่อ</span>
                                    <strong>{formatThaiDateTime(payment.paid_at)}</strong>
                                </div>
                                <div>
                                    <span>สถานะ</span>
                                    <strong>{getPaymentStatusLabel(payment.payment_status)}</strong>
                                    <small>{getRenewalStatusLabel(payment.renewal_status)}</small>
                                </div>
                            </Link>
                        )
                    })}
                </div>
            )}
        </section>
    )
}
