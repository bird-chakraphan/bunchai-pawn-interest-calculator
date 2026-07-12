import Link from "next/link"
import { signOutAction } from "@/app/staff/sign-in/actions"
import { StaffTitleMenu } from "@/components/staff-title-menu"
import { formatThaiDateTime } from "@/lib/payment-presentation"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { getSyncHealthSnapshot, type SyncHealthSnapshot } from "@/lib/sync-health"

export const dynamic = "force-dynamic"

export default async function StaffSyncHealthPage() {
    const supabase = createAdminSupabaseClient()

    if (!supabase) {
        return (
            <main className="phase-page">
                <section className="pawn-calculator-app">
                    <header className="pawn-header pawn-header-with-actions">
                        <div className="pawn-title-row">
                            <h1>สถานะการ sync ข้อมูล</h1>
                        </div>
                    </header>

                    <div className="pawn-card staff-auth-card">
                        <div className="staff-auth-message is-warning">
                            ยังไม่ได้ตั้งค่า Supabase service role สำหรับหน้า sync health
                        </div>
                    </div>
                </section>
            </main>
        )
    }

    let loadError: string | null = null
    let snapshot: SyncHealthSnapshot = {
        latestRun: null,
        lastSuccessfulRun: null,
        recentIssues: [],
        activeRecordCount: 0,
        archivedRecordCount: 0,
    }

    try {
        snapshot = await getSyncHealthSnapshot({ supabase })
    } catch (error) {
        loadError =
            error instanceof Error ? error.message : "ไม่สามารถโหลดข้อมูลสถานะ sync ได้"
    }

    return (
        <main className="phase-page">
            <section className="pawn-calculator-app">
                <header className="pawn-header pawn-header-with-actions">
                    <div className="pawn-title-row staff-sync-health-title-row">
                        <Link
                            aria-label="กลับไปหน้าพนักงาน"
                            className="staff-sync-health-back-link"
                            href="/staff"
                            title="กลับไปหน้าพนักงาน"
                        >
                            <svg
                                aria-hidden="true"
                                fill="none"
                                height="24"
                                viewBox="0 0 24 24"
                                width="24"
                            >
                                <path
                                    d="M15 5 8 12l7 7"
                                    stroke="currentColor"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2.25"
                                />
                            </svg>
                        </Link>
                        <h1>สถานะข้อมูล</h1>
                        <StaffTitleMenu signOutAction={signOutAction} />
                    </div>
                </header>

                <div className="staff-auth-message">
                    ระบบ sync ข้อมูลจาก Google Sheets ช่วง 08:00-17:45 ทุก 15 นาทีใกล้กับนาที :00, :15, :30, :45 และช่วงเวลาอื่นทุก 1 ชั่วโมงใกล้กับนาที :00 โดยยังไม่มีปุ่ม Sync now ใน MVP นี้
                </div>

                {loadError ? (
                    <div className="staff-auth-message is-error">
                        ไม่สามารถโหลดข้อมูลสถานะ sync ได้: {loadError}
                    </div>
                ) : null}

                <section className="staff-sync-health-groups">
                    <div className="staff-sync-health-group">
                        <div className="pawn-card staff-sync-health-card">
                            <span>Active records</span>
                            <strong>{snapshot.activeRecordCount}</strong>
                        </div>
                        <div className="pawn-card staff-sync-health-card">
                            <span>Archived records</span>
                            <strong>{snapshot.archivedRecordCount}</strong>
                        </div>
                    </div>
                    <div className="staff-sync-health-group">
                        <div className="pawn-card staff-sync-health-card">
                            <span>Last sync</span>
                            <strong>
                                {formatThaiDateTime(snapshot.lastSuccessfulRun?.finishedAt ?? null)}
                            </strong>
                        </div>
                        <div className="pawn-card staff-sync-health-card">
                            <span>Latest status</span>
                            <strong>{snapshot.latestRun?.status ?? "-"}</strong>
                        </div>
                    </div>
                </section>

                {snapshot.latestRun ? (
                    <section className="pawn-card staff-sync-health-table-card">
                        <h2>Latest run summary</h2>
                        <div className="staff-sync-health-summary">
                            <div>
                                <span>Rows</span>
                                <strong>{snapshot.latestRun.rowCount}</strong>
                            </div>
                            <div>
                                <span>Inserted</span>
                                <strong>{snapshot.latestRun.insertedCount}</strong>
                            </div>
                            <div>
                                <span>Updated</span>
                                <strong>{snapshot.latestRun.updatedCount}</strong>
                            </div>
                            <div>
                                <span>Archived</span>
                                <strong>{snapshot.latestRun.archivedCount}</strong>
                            </div>
                            <div>
                                <span>Warnings</span>
                                <strong>{snapshot.latestRun.warningCount}</strong>
                            </div>
                            <div>
                                <span>Error</span>
                                <strong>{snapshot.latestRun.errorMessage ?? "-"}</strong>
                            </div>
                        </div>
                    </section>
                ) : null}

                <section className="pawn-card staff-sync-health-table-card">
                    <h2>Invalid source rows / warnings</h2>
                    {snapshot.recentIssues.length === 0 ? (
                        <div className="staff-auth-message">ยังไม่มี warning หรือ invalid row ล่าสุด</div>
                    ) : (
                        <div className="staff-sync-issue-list">
                            {snapshot.recentIssues.map((issue) => (
                                <div key={issue.id} className="staff-sync-issue-row">
                                    <div>
                                        <span>Pawn ID</span>
                                        <strong>{issue.pawnIdRaw || "-"}</strong>
                                    </div>
                                    <div>
                                        <span>Row</span>
                                        <strong>{issue.rowIndex ?? "-"}</strong>
                                    </div>
                                    <div>
                                        <span>Severity</span>
                                        <strong>{issue.severity}</strong>
                                    </div>
                                    <div>
                                        <span>Reason</span>
                                        <strong>{issue.reason}</strong>
                                    </div>
                                    <div>
                                        <span>Logged at</span>
                                        <strong>{formatThaiDateTime(issue.createdAt)}</strong>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </section>
        </main>
    )
}
