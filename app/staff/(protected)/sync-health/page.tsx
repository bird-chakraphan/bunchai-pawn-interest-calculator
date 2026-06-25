import Link from "next/link"
import { signOutAction } from "@/app/staff/sign-in/actions"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { getSyncHealthSnapshot } from "@/lib/sync-health"

export const dynamic = "force-dynamic"

function formatThaiDateTime(value: string | null): string {
    if (!value) {
        return "-"
    }

    return new Intl.DateTimeFormat("th-TH", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value))
}

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

    const snapshot = await getSyncHealthSnapshot({ supabase })

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

                <header className="pawn-header pawn-header-with-actions">
                    <div className="pawn-title-row">
                        <h1>สถานะการ sync ข้อมูล</h1>
                        <Link className="staff-inline-action" href="/staff">
                            กลับไปหน้าพนักงาน
                        </Link>
                    </div>
                </header>

                <div className="staff-auth-message">
                    ระบบ sync ข้อมูลจาก Google Sheets ทุก 5 นาที และยังไม่มีปุ่ม Sync now ใน MVP นี้
                </div>

                <section className="staff-sync-health-grid">
                    <div className="pawn-card staff-sync-health-card">
                        <span>Last successful sync</span>
                        <strong>
                            {formatThaiDateTime(snapshot.lastSuccessfulRun?.finishedAt ?? null)}
                        </strong>
                    </div>
                    <div className="pawn-card staff-sync-health-card">
                        <span>Latest run status</span>
                        <strong>{snapshot.latestRun?.status ?? "-"}</strong>
                    </div>
                    <div className="pawn-card staff-sync-health-card">
                        <span>Active records</span>
                        <strong>{snapshot.activeRecordCount}</strong>
                    </div>
                    <div className="pawn-card staff-sync-health-card">
                        <span>Archived records</span>
                        <strong>{snapshot.archivedRecordCount}</strong>
                    </div>
                </section>

                {snapshot.latestRun ? (
                    <section className="pawn-card staff-sync-health-table-card">
                        <h2>Latest run summary</h2>
                        <div className="staff-sync-health-summary">
                            <div>
                                <span>Started</span>
                                <strong>{formatThaiDateTime(snapshot.latestRun.startedAt)}</strong>
                            </div>
                            <div>
                                <span>Finished</span>
                                <strong>{formatThaiDateTime(snapshot.latestRun.finishedAt)}</strong>
                            </div>
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
