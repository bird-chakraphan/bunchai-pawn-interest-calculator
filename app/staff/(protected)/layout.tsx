import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export default async function StaffProtectedLayout(props: {
    children: React.ReactNode
}) {
    const supabase = await createServerSupabaseClient()

    if (!supabase) {
        return (
            <main className="phase-page">
                <section className="pawn-calculator-app">
                    <header className="pawn-header">
                        <h1>Staff Area Setup</h1>
                    </header>

                    <div className="pawn-card staff-auth-card">
                        <div className="staff-auth-message is-warning">
                            ยังไม่ได้ตั้งค่า Supabase กรุณาเพิ่มค่าใน <code>.env</code> ก่อนเปิดใช้งาน Staff Area
                        </div>
                    </div>
                </section>
            </main>
        )
    }

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect("/staff/sign-in")
    }

    return props.children
}
