import { signInAction } from "@/app/staff/sign-in/actions"
import { getSupabasePublicEnv } from "@/lib/supabase/env"

function readError(searchParams: { [key: string]: string | string[] | undefined }): string | null {
    const rawValue = searchParams.error
    const errorValue = Array.isArray(rawValue) ? rawValue[0] : rawValue

    if (!errorValue) {
        return null
    }

    if (errorValue === "supabase-not-configured") {
        return "ยังไม่ได้ตั้งค่า Supabase ในเครื่องนี้"
    }

    if (errorValue === "staff-access-required") {
        return "บัญชีนี้ยังไม่ได้รับสิทธิ์ใช้งานระบบพนักงาน"
    }

    return errorValue
}

export default async function StaffSignInPage(props: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const searchParams = await props.searchParams
    const errorMessage = readError(searchParams)
    const isConfigured = getSupabasePublicEnv() !== null

    return (
        <main className="phase-page">
            <section className="pawn-calculator-app">
                <header className="pawn-header staff-auth-header">
                    <h1>Bunchai Staff Sign In</h1>
                </header>

                <div className="pawn-card staff-auth-card">
                    {!isConfigured ? (
                        <div className="staff-auth-message is-warning">
                            ยังไม่ได้ตั้งค่า Supabase กรุณาเพิ่มค่าใน <code>.env</code> ก่อนใช้งาน
                        </div>
                    ) : null}

                    {errorMessage ? (
                        <div className="staff-auth-message is-error">{errorMessage}</div>
                    ) : null}

                    <form action={signInAction} className="staff-auth-form">
                        <label className="staff-auth-field">
                            <span>Email</span>
                            <input
                                className="pawn-control"
                                name="email"
                                type="email"
                                placeholder="กรอกอีเมล"
                                required
                            />
                        </label>

                        <label className="staff-auth-field">
                            <span>Password</span>
                            <input
                                className="pawn-control"
                                name="password"
                                type="password"
                                placeholder="กรอกรหัสผ่าน"
                                required
                            />
                        </label>

                        <button className="staff-primary-button" type="submit" disabled={!isConfigured}>
                            Sign In
                        </button>
                    </form>
                </div>
            </section>
        </main>
    )
}
