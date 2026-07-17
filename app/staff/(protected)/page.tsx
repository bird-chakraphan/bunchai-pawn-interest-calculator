import Link from "next/link"
import { redirect } from "next/navigation"
import { signOutAction } from "@/app/staff/sign-in/actions"
import { requireActiveStaffContext } from "@/lib/staff-access"

export const dynamic = "force-dynamic"

export default async function StaffServicePortal(props: {
    searchParams: Promise<{ pawnId?: string; error?: string }>
}) {
    const [staff, searchParams] = await Promise.all([
        requireActiveStaffContext(),
        props.searchParams,
    ])

    if (searchParams.pawnId) {
        redirect(`/staff/pawn?pawnId=${encodeURIComponent(searchParams.pawnId)}`)
    }

    const hasPawn = staff.services.some((service) => service.service === "pawn")
    const hasJewelry = staff.services.some((service) => service.service === "jewelry")

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

                <header className="pawn-header">
                    <h1>บริการสำหรับพนักงาน</h1>
                    {staff.fullName ? <p className="staff-empty-copy">{staff.fullName}</p> : null}
                </header>

                {searchParams.error === "service-access-denied" ? (
                    <div className="staff-auth-message is-error">
                        บัญชีนี้ไม่มีสิทธิ์เข้าถึงบริการที่เลือก
                    </div>
                ) : null}

                <section className="staff-payment-section">
                    {hasPawn ? (
                        <Link className="pawn-card staff-payment-row" href="/staff/pawn">
                            <div>
                                <span>บริการ</span>
                                <strong>งานจำนำ</strong>
                            </div>
                            <div>
                                <span>ค้นหาใบจำนำ คำนวณดอกเบี้ย และตรวจสอบการชำระเงิน</span>
                            </div>
                        </Link>
                    ) : null}
                    {hasJewelry ? (
                        <Link className="pawn-card staff-payment-row" href="/staff/jewelry">
                            <div>
                                <span>บริการ</span>
                                <strong>จัดการเครื่องประดับ</strong>
                            </div>
                            <div>
                                <span>สต็อก ขาย คืน เปลี่ยน และประวัติรายการ</span>
                            </div>
                        </Link>
                    ) : null}
                    {!hasPawn && !hasJewelry ? (
                        <div className="pawn-card staff-auth-card">
                            <div className="staff-auth-message is-warning">
                                บัญชีนี้ยังไม่ได้รับสิทธิ์เข้าถึงบริการ กรุณาติดต่อผู้ดูแลระบบ
                            </div>
                        </div>
                    ) : null}
                </section>
            </section>
        </main>
    )
}
