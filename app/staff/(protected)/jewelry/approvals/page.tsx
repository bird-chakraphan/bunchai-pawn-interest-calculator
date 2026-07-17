import Link from "next/link"
import { approveJewelryTransactionAction } from "@/app/staff/(protected)/jewelry/actions"
import { requireServiceAccess } from "@/lib/staff-access"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export default async function JewelryApprovalsPage(props: { searchParams: Promise<{ success?: string; error?: string }> }) {
    await requireServiceAccess("jewelry", ["manager", "admin"])
    const [supabase, searchParams] = await Promise.all([createServerSupabaseClient(), props.searchParams])
    const result = supabase ? await supabase.from("jewelry_transactions").select("id, transaction_number, gross_amount, exception_reason, created_at, item:jewelry_transaction_items(item:jewelry_items(item_code, title))").eq("status", "pending_approval").order("created_at") : { data: [], error: null }
    const transactions = (result.data ?? []) as unknown as Array<{ id: string; transaction_number: string; gross_amount: number; exception_reason: string | null; created_at: string; item: Array<{ item: { item_code: string; title: string } | null }> }>
    return <main className="phase-page"><section className="pawn-calculator-app"><header className="pawn-header pawn-header-with-actions"><div className="pawn-title-row"><h1>รายการรออนุมัติ</h1><Link className="staff-inline-action" href="/staff/jewelry">กลับสต็อก</Link></div></header>{searchParams.success ? <div className="staff-auth-message">อนุมัติรายการแล้ว</div> : null}{searchParams.error ? <div className="staff-auth-message is-error">ไม่สามารถอนุมัติได้: {searchParams.error}</div> : null}{transactions.length === 0 ? <div className="pawn-card staff-auth-card"><div className="staff-auth-message">ไม่มีรายการรออนุมัติ</div></div> : transactions.map((transaction) => <section className="pawn-card staff-payment-detail-card" key={transaction.id}><h2>{transaction.transaction_number}</h2><p>{transaction.item.map((entry) => entry.item ? `${entry.item.item_code} — ${entry.item.title}` : "-").join(", ")}</p><p>ยอดขาย {transaction.gross_amount.toLocaleString()} บาท</p><p>เหตุผลข้อยกเว้น: {transaction.exception_reason ?? "-"}</p><form action={approveJewelryTransactionAction}><input name="transactionId" type="hidden" value={transaction.id} /><button className="staff-primary-button" type="submit">อนุมัติการขาย</button></form></section>)}</section></main>
}
