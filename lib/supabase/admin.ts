import { createClient } from "@supabase/supabase-js"
import { getSupabaseServiceEnv } from "@/lib/supabase/env"

export function createAdminSupabaseClient() {
    const env = getSupabaseServiceEnv()

    if (!env) {
        return null
    }

    return createClient(env.url, env.serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    })
}
