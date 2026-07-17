import Link from "next/link"
import { createJewelryItemAction } from "@/app/staff/(protected)/jewelry/actions"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export default async function NewJewelryItemPage(props: { searchParams: Promise<{ error?: string }> }) {
    const [supabase, searchParams] = await Promise.all([createServerSupabaseClient(), props.searchParams])
    const categoriesResult = supabase ? await supabase.from("jewelry_categories").select("id, name_th").eq("is_active", true).order("name_th") : { data: [] }
    const categories = (categoriesResult.data ?? []) as Array<{ id: string; name_th: string }>

    return (
        <main className="phase-page"><section className="pawn-calculator-app">
            <header className="pawn-header pawn-header-with-actions"><div className="pawn-title-row"><h1>เพิ่มสินค้าเครื่องประดับ</h1><Link className="staff-inline-action" href="/staff/jewelry">กลับสต็อก</Link></div></header>
            {searchParams.error ? <div className="staff-auth-message is-error">บันทึกสินค้าไม่สำเร็จ: {searchParams.error}</div> : null}
            <form action={createJewelryItemAction} className="pawn-card staff-auth-form" encType="multipart/form-data">
                <label className="staff-auth-field"><span>รหัสสินค้า *</span><input className="pawn-control" name="itemCode" required /></label>
                <label className="staff-auth-field"><span>ประเภท *</span><select className="pawn-control" name="categoryId" required defaultValue=""><option disabled value="">เลือกประเภท</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name_th}</option>)}</select></label>
                <label className="staff-auth-field"><span>ชื่อ/รายละเอียดสั้น *</span><input className="pawn-control" name="title" required /></label>
                <label className="staff-auth-field"><span>รายละเอียด</span><textarea className="pawn-control" name="description" rows={3} /></label>
                <label className="staff-auth-field"><span>น้ำหนักรวม (กรัม)</span><input className="pawn-control" name="grossWeight" inputMode="decimal" /></label>
                <label className="staff-auth-field"><span>น้ำหนักทอง (กรัม)</span><input className="pawn-control" name="goldWeight" inputMode="decimal" /></label>
                <label className="staff-auth-field"><span>วัสดุ</span><input className="pawn-control" name="material" /></label>
                <label className="staff-auth-field"><span>ตำแหน่งเก็บ</span><input className="pawn-control" name="location" /></label>
                <label className="staff-auth-field"><span>ราคาขาย (บาท)</span><input className="pawn-control" name="salePrice" inputMode="decimal" /></label>
                <label className="staff-auth-field"><span>สถานะเริ่มต้น</span><select className="pawn-control" name="status" defaultValue="draft"><option value="draft">รอตรวจ</option><option value="in_stock">พร้อมขาย</option></select></label>
                <label className="staff-auth-field"><span>รูปสินค้า</span><input className="pawn-control" name="photo" type="file" accept="image/jpeg,image/png,image/webp" /></label>
                <label className="staff-auth-field"><span>คำอธิบายรูป</span><input className="pawn-control" name="photoCaption" /></label>
                <button className="staff-primary-button" type="submit">บันทึกสินค้า</button>
            </form>
        </section></main>
    )
}
