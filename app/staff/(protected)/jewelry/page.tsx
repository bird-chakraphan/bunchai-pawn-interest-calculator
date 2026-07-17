import Link from "next/link"
import { signOutAction } from "@/app/staff/sign-in/actions"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export default async function JewelryHomePage(props: {
    searchParams: Promise<{ q?: string; status?: string; category?: string }>
}) {
    const [supabase, searchParams] = await Promise.all([createServerSupabaseClient(), props.searchParams])

    if (!supabase) {
        return <main className="phase-page"><section className="pawn-calculator-app"><div className="staff-auth-message is-warning">ยังไม่ได้ตั้งค่า Supabase</div></section></main>
    }

    const categoriesResult = await supabase.from("jewelry_categories").select("id, code, name_th").eq("is_active", true).order("name_th")
    let itemsQuery = supabase
        .from("jewelry_items")
        .select("id, item_code, title, status, sale_price, category:jewelry_categories(name_th)")
        .order("updated_at", { ascending: false })
        .limit(100)

    if (searchParams.q?.trim()) {
        itemsQuery = itemsQuery.or(`item_code.ilike.%${searchParams.q.trim()}%,title.ilike.%${searchParams.q.trim()}%`)
    }
    if (searchParams.status) itemsQuery = itemsQuery.eq("status", searchParams.status)
    if (searchParams.category) itemsQuery = itemsQuery.eq("category_id", searchParams.category)

    const itemsResult = await itemsQuery
    const categories = (categoriesResult.data ?? []) as Array<{ id: string; code: string; name_th: string }>
    const items = (itemsResult.data ?? []) as unknown as Array<{
        id: string; item_code: string; title: string; status: string; sale_price: number | null; category: { name_th: string } | null
    }>

    return (
        <main className="phase-page">
            <section className="pawn-calculator-app">
                <div className="pawn-top-action"><form action={signOutAction}><button className="staff-secondary-button" type="submit">Sign Out</button></form></div>
                <header className="pawn-header pawn-header-with-actions"><div className="pawn-title-row"><h1>จัดการเครื่องประดับ</h1><Link className="staff-inline-action" href="/staff">เลือกบริการ</Link></div></header>
                <div className="staff-header-actions">
                    <Link className="staff-primary-button" href="/staff/jewelry/new">เพิ่มสินค้า</Link>
                    <Link className="staff-secondary-button" href="/staff/jewelry/approvals">รออนุมัติ</Link>
                </div>
                <form className="pawn-card staff-search-card" method="get">
                    <div className="staff-header-search">
                        <input className="pawn-control" name="q" defaultValue={searchParams.q} placeholder="ค้นหารหัสหรือชื่อสินค้า" />
                        <select className="pawn-control" name="status" defaultValue={searchParams.status ?? ""}><option value="">ทุกสถานะ</option><option value="in_stock">พร้อมขาย</option><option value="draft">รอตรวจ</option><option value="reserved">จอง/รออนุมัติ</option><option value="sold">ขายแล้ว</option><option value="returned">รับคืน</option><option value="exchanged">เปลี่ยนแล้ว</option></select>
                        <select className="pawn-control" name="category" defaultValue={searchParams.category ?? ""}><option value="">ทุกประเภท</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name_th}</option>)}</select>
                        <button className="staff-primary-button" type="submit">ค้นหา</button>
                    </div>
                </form>
                {itemsResult.error ? <div className="staff-auth-message is-error">ไม่สามารถโหลดสต็อกได้: {itemsResult.error.message}</div> : null}
                <section className="staff-payment-section">
                    {items.length === 0 ? <div className="pawn-card staff-auth-card"><div className="staff-auth-message">ไม่พบรายการสินค้า</div></div> : items.map((item) => (
                        <Link className="pawn-card staff-payment-row" href={`/staff/jewelry/items/${item.id}`} key={item.id}>
                            <div><span>{item.category?.name_th ?? "-"}</span><strong>{item.item_code}</strong></div>
                            <div><span>{item.title}</span><strong>{item.status}</strong></div>
                            <div><span>ราคาขาย</span><strong>{item.sale_price === null ? "-" : `${item.sale_price.toLocaleString()} บาท`}</strong></div>
                        </Link>
                    ))}
                </section>
            </section>
        </main>
    )
}
