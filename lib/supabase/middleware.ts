import { createServerClient } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"
import { getSupabasePublicEnv } from "@/lib/supabase/env"

export function updateSession(request: NextRequest) {
    const env = getSupabasePublicEnv()

    if (!env) {
        return NextResponse.next({ request })
    }

    let response = NextResponse.next({
        request,
    })

    const supabase = createServerClient(env.url, env.anonKey, {
        cookies: {
            getAll() {
                return request.cookies.getAll()
            },
            setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value, options }) => {
                    request.cookies.set(name, value)
                    response.cookies.set(name, value, options)
                })
            },
        },
    })

    void supabase.auth.getUser()

    return response
}
