import Link from "next/link"
import { ManualCalculator } from "@/components/manual-calculator"
import { signOutAction } from "@/app/staff/sign-in/actions"
import { getPawnRecordById } from "@/lib/pawn-records"
import { buildStaffLookupViewModel } from "@/lib/staff-lookup"
import { createServerSupabaseClient } from "@/lib/supabase/server"
export const dynamic = "force-dynamic"

export default async function StaffHomePage(props: {
    searchParams: Promise<{ pawnId?: string }>
}) {
    const searchParams = await props.searchParams
    const pawnId = searchParams.pawnId?.trim() ?? ""
    const supabase = await createServerSupabaseClient()
    const currentDate = new Date().toISOString().slice(0, 10)

    let lookupError: string | null = null
    let record = null
    let staffLookupViewModel = null

    if (pawnId && supabase) {
        try {
            record = await getPawnRecordById({ supabase, pawnId })
            if (record) {
                staffLookupViewModel = buildStaffLookupViewModel({
                    record,
                    currentDate,
                })
            }
        } catch (error) {
            lookupError =
                error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการค้นหาข้อมูล"
        }
    }

    return (
        <ManualCalculator
            title={record ? `คำนวณดอกเบี้ยจำนำ รหัส ${record.pawnId}` : "คำนวณดอกเบี้ยจำนำ"}
            titleAction={
                record ? (
                    <Link className="staff-inline-action" href="/staff">
                        ล้างการค้นหา
                    </Link>
                ) : null
            }
            headerAction={
                record ? null : (
                    <div className="staff-header-actions">
                        <form className="staff-header-search" action="/staff" method="get">
                            <input
                                className="pawn-control"
                                name="pawnId"
                                defaultValue={pawnId}
                                placeholder="กรอกเลขใบจำนำเพื่อค้นหา"
                            />
                            <button className="staff-primary-button" type="submit">
                                ค้นหา
                            </button>
                        </form>
                        <Link className="staff-inline-action" href="/staff/sync-health">
                            ดูสถานะ sync
                        </Link>
                        <Link className="staff-inline-action" href="/staff/payments">
                            รายการชำระเงิน
                        </Link>
                    </div>
                )
            }
            topAction={
                <form action={signOutAction}>
                    <button className="staff-secondary-button" type="submit">
                        Sign Out
                    </button>
                </form>
            }
            notice={
                lookupError ? (
                    <div className="staff-auth-message is-error">{lookupError}</div>
                ) : pawnId && !record ? (
                    <div className="staff-auth-message">
                        ไม่พบข้อมูล Pawn ID นี้ในฐานข้อมูล
                    </div>
                ) : null
            }
            prefilledRecord={
                record
                    ? {
                          pawnId: record.pawnId,
                          startDate: record.startDate,
                          loanAmount: record.loanAmount,
                          promoType: record.promoType,
                          baseRate: record.baseRate,
                      }
                    : null
            }
            staffLookupViewModel={staffLookupViewModel}
            showStaffLookupMetadata
        />
    )
}
