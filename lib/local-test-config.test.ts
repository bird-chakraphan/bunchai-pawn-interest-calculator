import { describe, expect, it } from "vitest"
import { assertLocalTestConfiguration, LOCAL_TEST_SUPABASE_URL } from "@/lib/local-test-config"

const valid = {
    NEXT_PUBLIC_BUNCHAI_ENVIRONMENT: "local-test",
    NEXT_PUBLIC_SUPABASE_URL: LOCAL_TEST_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "synthetic-local-public-key",
    SUPABASE_SERVICE_ROLE_KEY: "synthetic-local-server-key",
    APP_BASE_URL: "http://127.0.0.1:3000",
    PAYMENTS_ENABLED: "false",
}

describe("B01 local isolation boundary", () => {
    it("accepts the isolated local target with external effects disabled", () => {
        expect(() => assertLocalTestConfiguration(valid)).not.toThrow()
    })

    it.each([
        "https://xbvfdqhcrdrkjldvxcpb.supabase.co",
        "https://another-project.supabase.co",
        "http://127.0.0.1.example.com:55321",
        "http://127.0.0.1:54321",
    ])("rejects an unapproved database target: %s", (url) => {
        expect(() => assertLocalTestConfiguration({ ...valid, NEXT_PUBLIC_SUPABASE_URL: url })).toThrow()
    })

    it("fails closed when test mode or a required key is missing", () => {
        expect(() => assertLocalTestConfiguration({ ...valid, NEXT_PUBLIC_BUNCHAI_ENVIRONMENT: "" })).toThrow()
        expect(() => assertLocalTestConfiguration({ ...valid, SUPABASE_SERVICE_ROLE_KEY: "" })).toThrow()
    })

    it("rejects enabled payments", () => {
        expect(() => assertLocalTestConfiguration({ ...valid, PAYMENTS_ENABLED: "true" })).toThrow()
    })

    it("rejects an external application URL in the local environment", () => {
        expect(() => assertLocalTestConfiguration({ ...valid, APP_BASE_URL: "https://shop.example.com" })).toThrow()
    })

    it.each(["INTERNAL_SYNC_SECRET", "OMISE_SECRET_KEY", "LINE_CHANNEL_ACCESS_TOKEN", "LINE_GROUP_ID"])(
        "rejects an external integration configuration: %s", (name) => {
            expect(() => assertLocalTestConfiguration({ ...valid, [name]: "synthetic-key" })).toThrow()
        }
    )
})
