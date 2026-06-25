import { afterEach, describe, expect, it, vi } from "vitest"
import { arePaymentsEnabled } from "@/lib/supabase/env"

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
})
