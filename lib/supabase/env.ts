export interface SupabasePublicEnv {
    url: string
    anonKey: string
}

export interface SupabaseServiceEnv extends SupabasePublicEnv {
    serviceRoleKey: string
}

export interface OmiseEnv {
    secretKey: string
}

export interface LineEnv {
    channelAccessToken: string
    groupId: string
}

export function getSupabasePublicEnv(): SupabasePublicEnv | null {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

    if (!url || !anonKey) {
        return null
    }

    return { url, anonKey }
}

export function getSupabaseServiceEnv(): SupabaseServiceEnv | null {
    const publicEnv = getSupabasePublicEnv()
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

    if (!publicEnv || !serviceRoleKey) {
        return null
    }

    return {
        ...publicEnv,
        serviceRoleKey,
    }
}

export function getInternalSyncSecret(): string | null {
    const secret = process.env.INTERNAL_SYNC_SECRET?.trim()
    return secret || null
}

export function getAppBaseUrl(): string {
    return process.env.APP_BASE_URL?.trim() || "http://localhost:3000"
}

export function arePaymentsEnabled(): boolean {
    return process.env.PAYMENTS_ENABLED?.trim().toLowerCase() === "true"
}

export function getOmiseEnv(): OmiseEnv | null {
    const secretKey = process.env.OMISE_SECRET_KEY?.trim()

    if (!secretKey) {
        return null
    }

    return {
        secretKey,
    }
}

export function getLineEnv(): LineEnv | null {
    const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN?.trim()
    const groupId = process.env.LINE_GROUP_ID?.trim()

    if (!channelAccessToken || !groupId) {
        return null
    }

    return {
        channelAccessToken,
        groupId,
    }
}
