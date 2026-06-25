import Link from "next/link"
import {
    formatBaht,
    formatThaiDate,
    formatThaiDateTime,
    getPaymentStatusLabel,
    getRenewalStatusLabel,
} from "@/lib/payment-presentation"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

interface PublicPaymentStatus {
    pawn_id_snapshot: string
    amount: number
    payment_status: string
    renewal_status: string
    paid_at: string | null
    effective_renewal_date: string | null
    created_at: string
}

export default async function PaymentStatusPage(props: {
    searchParams: Promise<{ paymentId?: string }>
}) {
    const { paymentId } = await props.searchParams
    const supabase = createAdminSupabaseClient()
    const normalizedPaymentId = paymentId?.trim() ?? ""

    let payment: PublicPaymentStatus | null = null
    let loadError: string | null = null

    if (supabase && normalizedPaymentId) {
        const result = await supabase
            .from("payments")
            .select(
                "pawn_id_snapshot, amount, payment_status, renewal_status, paid_at, effective_renewal_date, created_at"
            )
            .eq("id", normalizedPaymentId)
            .maybeSingle()

        if (result.error) {
            loadError = result.error.message
        } else {
            payment = result.data as PublicPaymentStatus | null
        }
    }

    const isPaid = payment?.payment_status === "paid"

    return (
        <main className="phase-page payment-status-page">
            <section className="pawn-calculator-app payment-status-shell">
                <header className="pawn-header">
                    <h1>สถานะการชำระเงิน</h1>
                </header>

                {!supabase ? (
                    <PaymentStatusMessage
                        tone="warning"
                        title="ระบบตรวจสอบสถานะยังไม่พร้อม"
                        copy="กรุณาติดต่อสาขาเพื่อยืนยันรายการชำระเงิน"
                    />
                ) : !normalizedPaymentId || loadError || !payment ? (
                    <PaymentStatusMessage
                        tone="error"
                        title="ไม่พบรายการชำระเงิน"
                        copy="กรุณาตรวจสอบลิงก์ หรือติดต่อสาขาพร้อมหลักฐานการชำระเงิน"
                    />
                ) : (
                    <section className="pawn-card payment-status-card">
                        <span className={`payment-status-badge ${isPaid ? "is-success" : ""}`}>
                            {getPaymentStatusLabel(payment.payment_status)}
                        </span>
                        <h2>{payment.pawn_id_snapshot}</h2>
                        <strong className="payment-status-amount">
                            {formatBaht(payment.amount)}
                        </strong>
                        <dl className="staff-payment-detail-list">
                            <div>
                                <dt>สร้างรายการเมื่อ</dt>
                                <dd>{formatThaiDateTime(payment.created_at)}</dd>
                            </div>
                            <div>
                                <dt>ชำระเมื่อ</dt>
                                <dd>{formatThaiDateTime(payment.paid_at)}</dd>
                            </div>
                            <div>
                                <dt>วันต่อดอกใหม่</dt>
                                <dd>{formatThaiDate(payment.effective_renewal_date)}</dd>
                            </div>
                            <div>
                                <dt>สถานะดำเนินการ</dt>
                                <dd>{getRenewalStatusLabel(payment.renewal_status)}</dd>
                            </div>
                        </dl>
                        <p className="payment-status-note">
                            หากเพิ่งชำระเงิน สถานะอาจใช้เวลาสักครู่ในการอัปเดต
                            สามารถกดรีเฟรชหน้านี้เพื่อตรวจสอบอีกครั้ง
                        </p>
                        <div className="payment-status-actions">
                            <Link
                                className="staff-primary-button"
                                href={`/payment-status?paymentId=${encodeURIComponent(normalizedPaymentId)}`}
                            >
                                รีเฟรชสถานะ
                            </Link>
                            <Link className="staff-secondary-button" href="/">
                                กลับหน้าคำนวณ
                            </Link>
                        </div>
                    </section>
                )}
            </section>
        </main>
    )
}

function PaymentStatusMessage(props: {
    tone: "warning" | "error"
    title: string
    copy: string
}) {
    return (
        <section className="pawn-card payment-status-card">
            <h2>{props.title}</h2>
            <div
                className={`staff-auth-message ${
                    props.tone === "error" ? "is-error" : "is-warning"
                }`}
            >
                {props.copy}
            </div>
            <div className="payment-status-actions">
                <Link className="staff-secondary-button" href="/">
                    กลับหน้าคำนวณ
                </Link>
            </div>
        </section>
    )
}
