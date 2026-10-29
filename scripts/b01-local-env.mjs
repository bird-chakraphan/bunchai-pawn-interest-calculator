import { existsSync, writeFileSync } from "node:fs"
import { getLocalStatus } from "./b01-local-target.mjs"

// Capture locally generated keys without printing them or reading a hosted key.
const status = getLocalStatus()
const env = {
    NEXT_PUBLIC_BUNCHAI_ENVIRONMENT: "local-test",
    NEXT_PUBLIC_SUPABASE_URL: status.API_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: status.ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: status.SERVICE_ROLE_KEY,
    APP_BASE_URL: "http://127.0.0.1:3000",
    PAYMENTS_ENABLED: "false",
    INTERNAL_SYNC_SECRET: "",
    OMISE_SECRET_KEY: "",
    LINE_CHANNEL_ACCESS_TOKEN: "",
    LINE_GROUP_ID: "",
}
if (existsSync(".env.local")) {
    throw new Error(".env.local exists; review it before deliberately replacing it")
}
writeFileSync(".env.local", Object.entries(env).map(([k, v]) => `${k}=${JSON.stringify(v)}`).join("\n") + "\n", {
    mode: 0o600,
    flag: "wx",
})
console.log("Wrote ignored .env.local with local-only keys; values withheld.")
