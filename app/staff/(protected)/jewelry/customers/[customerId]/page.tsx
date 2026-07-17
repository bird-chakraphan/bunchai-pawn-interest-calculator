import Link from "next/link"
import { notFound } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export default async function JewelryCustomerPage(props: { params: Promise<{ customerId: string }> }) {
    const [{ customerId }, supabase] = await Promise.all([props.params, createServerSupabaseClient()])
    if (!supabase) notFound()
    const [customerResult, transactionsResult] = await Promise.all([
        supabase.from("jewelry_customers").select("display_name, phone_raw, contact_notes").eq("id", customerId).maybeSingle(),
        supabase.from("jewelry_transactions").select("id, transaction_number, transaction_type, status, gross_amount, created_at").eq("customer_id", customerId).order("created_at", { ascending: false }),
    ])
    if (!customerResult.data) notFound()
    return <main className="phase-page"><section className="pawn-calculator-app"><header className="pawn-header pawn-header-with-actions"><div className="pawn-title-row"><h1>{customerResult.data.display_name}</h1><Link className="staff-inline-action" href="/staff/jewelry">กลับสต็อก</Link></div></header><section className="pawn-card staff-payment-detail-card"><DetailRows rows={[["เบอร์โทร", customerResult.data.phone_raw ?? "-"], ["หมายเหตุ", customerResult.data.contact_notes ?? "-"]]} /></section><section className="pawn-card staff-payment-detail-card"><h2>ประวัติการซื้อ</h2>{(transactionsResult.data ?? []).map((transaction: { id: string; transaction_number: string; transaction_type: string; status: string; gross_amount: number; created_at: string }) => <div className="staff-payment-row" key={transaction.id}><div><strong>{transaction.transaction_number}</strong><span>{transaction.transaction_type}</span></div><div><strong>{transaction.gross_amount.toLocaleString()} บาท</strong><span>{transaction.status}</span></div></div>)}</section></section></main>
}

function DetailRows(props: { rows: Array<[string, string]> }) {
    return <dl className="staff-payment-detail-list">{props.rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
}
