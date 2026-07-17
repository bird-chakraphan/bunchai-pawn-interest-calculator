import Link from "next/link"
import { ManualCalculator } from "@/components/manual-calculator"
import { StaffTitleMenu } from "@/components/staff-title-menu"
import { signOutAction } from "@/app/staff/sign-in/actions"
import { getStaffPawnLookupById } from "@/lib/pawn-records"
import { buildStaffLookupViewModel } from "@/lib/staff-lookup"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

function normalizeStaffPawnId(value: string): string {
    const normalizedValue = value.trim()

    return /^\d{5}$/.test(normalizedValue) ? `I${normalizedValue}` : normalizedValue
}

export default async function PawnStaffHomePage(props: {
    searchParams: Promise<{ pawnId?: string }>
}) {
    const searchParams = await props.searchParams
    const pawnId = normalizeStaffPawnId(searchParams.pawnId ?? "")
    const pawnIdInput = pawnId.replace(/^I(?=\d{5}$)/i, "")
    const supabase = await createServerSupabaseClient()
    const currentDate = new Date().toISOString().slice(0, 10)

    let lookupError: string | null = null
    let record = null
    let staffLookupViewModel = null
    let lookupStatus: "redeemed" | "expired" | "not_found" | null = null

    if (pawnId && supabase) {
        try {
            const lookupResult = await getStaffPawnLookupById({ supabase, pawnId })
            record = lookupResult.status === "active" ? lookupResult.record : null
            lookupStatus = lookupResult.status === "active" ? null : lookupResult.status
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
            title="คำนวณดอกเบี้ยจำนำ"
            titleLeadingAction={
                record ? (
                    <Link
                        aria-label="ล้างการค้นหา"
                        className="staff-sync-health-back-link"
                        href="/staff/pawn"
                        title="ล้างการค้นหา"
                    >
                        <svg aria-hidden="true" fill="none" height="24" viewBox="0 0 24 24" width="24">
                            <path d="M15 5 8 12l7 7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.25" />
                        </svg>
                    </Link>
                ) : null
            }
            titleAction={<StaffTitleMenu signOutAction={signOutAction} />}
            titleRowClassName={record ? "staff-sync-health-title-row" : undefined}
            headerAction={
                record ? null : (
                    <div className="staff-header-actions">
                        <div className="pawn-card staff-search-card">
                            <form className="staff-header-search" action="/staff/pawn" method="get">
                                <input className="pawn-control" name="pawnId" defaultValue={pawnIdInput} placeholder="กรอกตัวเลข 5 ตัวในใบจำนำ" inputMode="numeric" maxLength={5} pattern="[0-9]*" />
                                <button className="staff-primary-button" type="submit">ค้นหา</button>
                            </form>
                        </div>
                    </div>
                )
            }
            notice={
                lookupError ? <div className="staff-auth-message is-error">{lookupError}</div>
                : lookupStatus === "expired" ? <div className="staff-auth-message">หมายเลขของจำใบนี้พ้นกำหนดเวลาแล้ว กรุณาติดต่อร้าน</div>
                : lookupStatus === "redeemed" ? <div className="staff-auth-message">หมายเลขของจำใบนี้ถูกไถ่จากระบบแล้ว</div>
                : lookupStatus === "not_found" ? <div className="staff-auth-message">ไม่พบข้อมูลหมายเลขของจำนี้ในฐานข้อมูล</div>
                : null
            }
            prefilledRecord={record ? {
                pawnId: record.pawnId,
                startDate: record.startDate,
                loanAmount: record.loanAmount,
                promoType: record.promoType,
                baseRate: record.baseRate,
            } : null}
            staffLookupViewModel={staffLookupViewModel}
            showStaffLookupMetadata
            resetVersion={record ? undefined : 0}
            bottomAction={record ? <Link className="staff-inline-action public-clear-lookup" href="/staff/pawn">ล้างการค้นหา</Link> : null}
        />
    )
}
