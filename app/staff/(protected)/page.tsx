import Link from "next/link"
import { ManualCalculator } from "@/components/manual-calculator"
import { signOutAction } from "@/app/staff/sign-in/actions"
import { getPawnRecordById } from "@/lib/pawn-records"
import { buildStaffLookupViewModel } from "@/lib/staff-lookup"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

function formatDateTime(value: string | null): string {
    if (!value) {
        return "-"
    }

    return new Intl.DateTimeFormat("th-TH", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value))
}

export default async function StaffHomePage(props: {
    searchParams: Promise<{ mode?: string; pawnId?: string }>
}) {
    const searchParams = await props.searchParams
    const mode = searchParams.mode === "manual" ? "manual" : "lookup"
    const pawnId = searchParams.pawnId?.trim() ?? ""
    const currentDate = new Date().toISOString().slice(0, 10)
    const supabase = await createServerSupabaseClient()

    let lookupError: string | null = null
    let lookupViewModel: ReturnType<typeof buildStaffLookupViewModel> | null = null

    if (mode === "lookup" && pawnId && supabase) {
        try {
            const record = await getPawnRecordById({ supabase, pawnId })

            if (record) {
                lookupViewModel = buildStaffLookupViewModel({
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
        <main className="phase-page">
            <section className="pawn-calculator-app">
                <header className="pawn-header staff-header">
                    <div>
                        <h1>Staff Lookup</h1>
                    </div>

                    <form action={signOutAction}>
                        <button className="staff-secondary-button" type="submit">
                            Sign Out
                        </button>
                    </form>
                </header>

                <div className="staff-mode-switch">
                    <Link
                        className={mode === "lookup" ? "is-active" : undefined}
                        href="/staff"
                    >
                        ค้นหาด้วย Pawn ID
                    </Link>
                    <Link
                        className={mode === "manual" ? "is-active" : undefined}
                        href="/staff?mode=manual"
                    >
                        กรอกข้อมูลเอง
                    </Link>
                </div>

                {mode === "manual" ? (
                    <ManualCalculator />
                ) : (
                    <>
                        <div className="pawn-card staff-lookup-card">
                            <form className="staff-lookup-form" action="/staff" method="get">
                                <label className="staff-auth-field">
                                    <span>Pawn ID</span>
                                    <input
                                        className="pawn-control"
                                        name="pawnId"
                                        defaultValue={pawnId}
                                        placeholder="เช่น P-1001"
                                    />
                                </label>

                                <button className="staff-primary-button" type="submit">
                                    ค้นหา
                                </button>
                            </form>

                            {lookupError ? (
                                <div className="staff-auth-message is-error">{lookupError}</div>
                            ) : null}

                            {!pawnId ? (
                                <div className="staff-empty-copy">
                                    กรอก Pawn ID เพื่อดึงข้อมูลจากฐานข้อมูลและคำนวณทั้ง ต่อดอก และ ไถ่ของ
                                </div>
                            ) : null}

                            {pawnId && !lookupViewModel && !lookupError ? (
                                <div className="staff-auth-message">
                                    ไม่พบข้อมูล Pawn ID นี้ในฐานข้อมูล
                                </div>
                            ) : null}
                        </div>

                        {lookupViewModel ? (
                            <div className="staff-results-stack">
                                <div className="pawn-card staff-record-card">
                                    <h2>ข้อมูลสัญญา</h2>
                                    <dl className="staff-record-grid">
                                        <div>
                                            <dt>Pawn ID</dt>
                                            <dd>{lookupViewModel.record.pawnId}</dd>
                                        </div>
                                        <div>
                                            <dt>วันเริ่ม / ต่อดอกล่าสุด</dt>
                                            <dd>{lookupViewModel.record.startDate}</dd>
                                        </div>
                                        <div>
                                            <dt>ยอดจำนำ</dt>
                                            <dd>{lookupViewModel.record.loanAmount.toLocaleString("th-TH")} บาท</dd>
                                        </div>
                                        <div>
                                            <dt>โปรโมชัน</dt>
                                            <dd>{lookupViewModel.record.promoType}</dd>
                                        </div>
                                        <div>
                                            <dt>สถานะข้อมูล</dt>
                                            <dd>
                                                {lookupViewModel.record.archivedFromSource
                                                    ? "archived_from_source"
                                                    : "active"}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt>sync ล่าสุด</dt>
                                            <dd>{formatDateTime(lookupViewModel.record.lastSyncedAt)}</dd>
                                        </div>
                                    </dl>
                                </div>

                                <div className="staff-calculation-grid">
                                    <div className="pawn-card staff-calculation-card">
                                        <h2>ต่อดอก</h2>
                                        <p className="staff-calculation-amount">
                                            {(lookupViewModel.extend.result.interestAmount ?? 0).toLocaleString(
                                                "th-TH"
                                            )}{" "}
                                            บาท
                                        </p>
                                        <p>{lookupViewModel.extend.result.formulaText}</p>
                                        <p>{lookupViewModel.extend.result.status}</p>
                                    </div>

                                    <div className="pawn-card staff-calculation-card">
                                        <h2>ไถ่ของ</h2>
                                        <p className="staff-calculation-amount">
                                            {(
                                                lookupViewModel.record.loanAmount +
                                                (lookupViewModel.redeem.result.interestAmount ?? 0)
                                            ).toLocaleString("th-TH")}{" "}
                                            บาท
                                        </p>
                                        <p>{lookupViewModel.redeem.result.formulaText}</p>
                                        <p>{lookupViewModel.redeem.result.status}</p>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </>
                )}
            </section>
        </main>
    )
}
