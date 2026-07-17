import Link from "next/link"
import { notFound } from "next/navigation"
import {
    createJewelrySaleAction,
    exchangeJewelryItemsAction,
    returnJewelryItemAction,
    updateJewelryItemAction,
} from "@/app/staff/(protected)/jewelry/actions"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

interface ItemRecord {
    id: string
    item_code: string
    title: string
    description: string | null
    status: string
    gross_weight_g: number | null
    gold_weight_g: number | null
    current_location: string | null
    sale_price: number | null
    category: { name_th: string } | null
}

export default async function JewelryItemPage(props: {
    params: Promise<{ itemId: string }>
    searchParams: Promise<{ success?: string; error?: string }>
}) {
    const [{ itemId }, searchParams] = await Promise.all([props.params, props.searchParams])
    const supabase = await createServerSupabaseClient()
    if (!supabase) notFound()

    const [itemResult, mediaResult, detailsResult, eventsResult, historyResult, replacementsResult] = await Promise.all([
        supabase.from("jewelry_items").select("id, item_code, title, description, status, gross_weight_g, gold_weight_g, current_location, sale_price, category:jewelry_categories(name_th)").eq("id", itemId).maybeSingle(),
        supabase.from("jewelry_item_media").select("id, storage_path, caption").eq("item_id", itemId).order("created_at"),
        supabase.from("jewelry_item_details").select("id, line_number, original_text").eq("item_id", itemId).order("line_number"),
        supabase.from("jewelry_item_events").select("id, event_type, status_before, status_after, reason, created_at, transaction_id").eq("item_id", itemId).order("created_at", { ascending: false }),
        supabase.from("jewelry_transaction_items").select("transaction_id, transaction:jewelry_transactions(id, transaction_type, status, customer_id, gross_amount, created_at)").eq("item_id", itemId).order("created_at", { ascending: false }),
        supabase.from("jewelry_items").select("id, item_code, title").eq("status", "in_stock").neq("id", itemId).order("item_code").limit(50),
    ])

    if (itemResult.error || !itemResult.data) notFound()
    const item = itemResult.data as unknown as ItemRecord
    const media = (mediaResult.data ?? []) as Array<{ id: string; storage_path: string; caption: string | null }>
    const photoUrls = await Promise.all(media.map(async (photo) => {
        const signed = await supabase.storage.from("jewelry-photos").createSignedUrl(photo.storage_path, 300)
        return { ...photo, url: signed.data?.signedUrl ?? null }
    }))
    const history = (historyResult.data ?? []) as unknown as Array<{ transaction_id: string; transaction: { id: string; transaction_type: string; status: string; customer_id: string | null; gross_amount: number; created_at: string } | null }>
    const lastSale = history.find((entry) => entry.transaction?.transaction_type === "sale")?.transaction ?? null
    const replacements = (replacementsResult.data ?? []) as Array<{ id: string; item_code: string; title: string }>
    const editable = item.status === "draft" || item.status === "in_stock"

    return (
        <main className="phase-page"><section className="pawn-calculator-app">
            <header className="pawn-header pawn-header-with-actions"><div className="pawn-title-row"><h1>{item.item_code}</h1><Link className="staff-inline-action" href="/staff/jewelry">กลับสต็อก</Link></div></header>
            {searchParams.success ? <div className="staff-auth-message">บันทึกรายการเรียบร้อย: {searchParams.success}</div> : null}
            {searchParams.error ? <div className="staff-auth-message is-error">ไม่สามารถดำเนินการได้: {searchParams.error}</div> : null}
            <section className="staff-payment-detail-grid">
                <div className="pawn-card staff-payment-detail-card"><h2>{item.title}</h2><DetailRows rows={[["ประเภท", item.category?.name_th ?? "-"], ["สถานะ", item.status], ["น้ำหนักรวม", item.gross_weight_g === null ? "-" : `${item.gross_weight_g} กรัม`], ["น้ำหนักทอง", item.gold_weight_g === null ? "-" : `${item.gold_weight_g} กรัม`], ["ตำแหน่ง", item.current_location ?? "-"], ["ราคาขาย", item.sale_price === null ? "-" : `${item.sale_price.toLocaleString()} บาท`]]} /><p>{item.description}</p></div>
                <div className="pawn-card staff-payment-detail-card"><h2>รูปสินค้า</h2>{photoUrls.length === 0 ? <p className="staff-empty-copy">ยังไม่มีรูปสินค้า</p> : photoUrls.map((photo) => photo.url ? <figure key={photo.id}><img alt={photo.caption ?? item.title} src={photo.url} style={{ maxWidth: "100%", borderRadius: 12 }} /><figcaption>{photo.caption}</figcaption></figure> : <p key={photo.id}>{photo.storage_path}</p>)}</div>
            </section>

            {editable ? <section className="pawn-card staff-payment-detail-card"><h2>แก้ไขสินค้าที่ยังว่าง</h2><form action={updateJewelryItemAction} className="staff-auth-form"><input name="itemId" type="hidden" value={item.id} /><label className="staff-auth-field"><span>ชื่อสินค้า</span><input className="pawn-control" name="title" defaultValue={item.title} required /></label><label className="staff-auth-field"><span>รายละเอียด</span><textarea className="pawn-control" name="description" defaultValue={item.description ?? ""} rows={3} /></label><label className="staff-auth-field"><span>น้ำหนักรวม</span><input className="pawn-control" name="grossWeight" defaultValue={item.gross_weight_g ?? ""} /></label><label className="staff-auth-field"><span>น้ำหนักทอง</span><input className="pawn-control" name="goldWeight" defaultValue={item.gold_weight_g ?? ""} /></label><label className="staff-auth-field"><span>ตำแหน่ง</span><input className="pawn-control" name="location" defaultValue={item.current_location ?? ""} /></label><label className="staff-auth-field"><span>ราคาขาย</span><input className="pawn-control" name="salePrice" defaultValue={item.sale_price ?? ""} /></label><button className="staff-primary-button" type="submit">บันทึกการแก้ไข</button></form></section> : null}

            {item.status === "in_stock" ? <section className="pawn-card staff-payment-detail-card"><h2>ขายสินค้า</h2><form action={createJewelrySaleAction} className="staff-auth-form"><input name="itemId" type="hidden" value={item.id} /><label className="staff-auth-field"><span>ชื่อลูกค้า *</span><input className="pawn-control" name="customerName" required /></label><label className="staff-auth-field"><span>เบอร์โทร</span><input className="pawn-control" name="customerPhone" inputMode="tel" /></label><label className="staff-auth-field"><span>ราคาขาย *</span><input className="pawn-control" name="saleAmount" defaultValue={item.sale_price ?? ""} inputMode="decimal" required /></label><label className="staff-auth-field"><span>เงื่อนไขคืน</span><input className="pawn-control" name="returnTerms" /></label><label className="staff-auth-field"><span>เงื่อนไขเปลี่ยน</span><input className="pawn-control" name="exchangeTerms" /></label><label className="staff-auth-field"><span>เหตุผลข้อยกเว้น (ส่งรอผู้จัดการอนุมัติ)</span><input className="pawn-control" name="exceptionReason" /></label><button className="staff-primary-button" type="submit">บันทึกการขาย</button></form></section> : null}

            {item.status === "sold" && lastSale ? <section className="staff-payment-detail-grid"><div className="pawn-card staff-payment-detail-card"><h2>รับคืน</h2><form action={returnJewelryItemAction} className="staff-auth-form"><input name="itemId" type="hidden" value={item.id} /><input name="originalSaleId" type="hidden" value={lastSale.id} /><label className="staff-auth-field"><span>เหตุผล/สภาพสินค้า</span><input className="pawn-control" name="reason" /></label><button className="staff-primary-button" type="submit">บันทึกรับคืน</button></form></div><div className="pawn-card staff-payment-detail-card"><h2>เปลี่ยนสินค้า</h2><form action={exchangeJewelryItemsAction} className="staff-auth-form"><input name="itemId" type="hidden" value={item.id} /><input name="originalSaleId" type="hidden" value={lastSale.id} /><label className="staff-auth-field"><span>สินค้าใหม่</span><select className="pawn-control" name="replacementItemId" required defaultValue=""><option disabled value="">เลือกสินค้า</option>{replacements.map((replacement) => <option key={replacement.id} value={replacement.id}>{replacement.item_code} — {replacement.title}</option>)}</select></label><label className="staff-auth-field"><span>ส่วนต่าง</span><input className="pawn-control" name="exchangeAmount" defaultValue="0" inputMode="decimal" /></label><button className="staff-primary-button" type="submit">บันทึกเปลี่ยนสินค้า</button></form></div></section> : null}

            <section className="pawn-card staff-payment-detail-card"><h2>ประวัติและ Audit timeline</h2>{eventsResult.error ? <div className="staff-auth-message is-error">โหลดประวัติไม่สำเร็จ</div> : <div className="staff-payment-list">{(eventsResult.data ?? []).map((event: { id: string; event_type: string; status_before: string | null; status_after: string | null; reason: string | null; created_at: string }) => <div className="staff-payment-row" key={event.id}><div><strong>{event.event_type}</strong><span>{event.created_at}</span></div><div><span>{event.status_before ?? "-"} → {event.status_after ?? "-"}</span><small>{event.reason ?? ""}</small></div></div>)}</div>}</section>
            <section className="pawn-card staff-payment-detail-card"><h2>รายการที่เกี่ยวข้อง</h2>{history.map((entry) => entry.transaction ? <div className="staff-payment-row" key={entry.transaction_id}><div><strong>{entry.transaction.transaction_type}</strong><span>{entry.transaction.status}</span></div><div><span>{entry.transaction.gross_amount.toLocaleString()} บาท</span>{entry.transaction.customer_id ? <Link href={`/staff/jewelry/customers/${entry.transaction.customer_id}`}>ดูลูกค้า</Link> : null}</div></div> : null)}</section>
        </section></main>
    )
}

function DetailRows(props: { rows: Array<[string, string]> }) {
    return <dl className="staff-payment-detail-list">{props.rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
}
