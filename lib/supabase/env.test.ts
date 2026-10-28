import { afterEach, describe, expect, it, vi } from "vitest"
import {
    arePaymentsEnabled,
    getSupabaseServiceEnv,
    getInternalSyncSecret,
    getOmiseEnv,
    getLineEnv,
} from "@/lib/supabase/env"

describe("arePaymentsEnabled", () => {
    afterEach(() => {
        vi.unstubAllEnvs()
    })

    it("keeps payments disabled by default", () => {
        vi.stubEnv("PAYMENTS_ENABLED", "")
        expect(arePaymentsEnabled()).toBe(false)
    })

    it("enables payments only with an explicit true value", () => {
        vi.stubEnv("PAYMENTS_ENABLED", "true")
        expect(arePaymentsEnabled()).toBe(true)
    })

    it("rejects the production database before constructing a service client", () => {
        vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://xbvfdqhcrdrkjldvxcpb.supabase.co")
        vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "synthetic-public-key")
        vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "synthetic-server-key")
        expect(() => getSupabaseServiceEnv()).toThrow()
    })

    it("disables external effects in local-test mode even with inherited settings", () => {
        vi.stubEnv("NEXT_PUBLIC_BUNCHAI_ENVIRONMENT", "local-test")
        vi.stubEnv("PAYMENTS_ENABLED", "true")
        vi.stubEnv("INTERNAL_SYNC_SECRET", "synthetic-sync-key")
        vi.stubEnv("OMISE_SECRET_KEY", "synthetic-payment-key")
        vi.stubEnv("LINE_CHANNEL_ACCESS_TOKEN", "synthetic-notification-key")
        vi.stubEnv("LINE_GROUP_ID", "synthetic-group")
        expect(arePaymentsEnabled()).toBe(false)
        expect(getInternalSyncSecret()).toBeNull()
        expect(getOmiseEnv()).toBeNull()
        expect(getLineEnv()).toBeNull()
    })
})
