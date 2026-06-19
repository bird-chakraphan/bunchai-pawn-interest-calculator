import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { getSupabasePublicEnv } from "@/lib/supabase/env"

export async function createServerSupabaseClient() {
    const env = getSupabasePublicEnv()

    if (!env) {
        return null
    }

    const cookieStore = await cookies()

    return createServerClient(env.url, env.anonKey, {
        cookies: {
            getAll() {
                return cookieStore.getAll()
            },
            setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value, options }) => {
                    try {
                        cookieStore.set(name, value, options)
                    } catch {
                        // Server Components can read cookies but may not always be
                        // allowed to mutate them. Middleware and Server Actions
                        // handle the writable session updates for us.
                    }
                })
            },
        },
    })
}
