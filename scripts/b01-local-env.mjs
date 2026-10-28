import { execFileSync } from "node:child_process"
import { existsSync, readFileSync, writeFileSync } from "node:fs"

// Capture locally generated keys without printing them or reading a hosted key.
if (!readFileSync("supabase/config.toml", "utf8").includes('project_id = "bunchai-b01-local"')) {
    throw new Error("Run this script from the B01 application checkout")
}
if (existsSync("supabase/.temp/project-ref")) {
    throw new Error("B01 must not be linked to any hosted Supabase project")
}
const status = JSON.parse(execFileSync("supabase", ["status", "-o", "json"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
}))
if (status.API_URL !== "http://127.0.0.1:55321") {
    throw new Error("Unexpected local API URL; no environment file written")
}
if (!status.ANON_KEY || !status.SERVICE_ROLE_KEY) {
    throw new Error("Local stack did not provide required keys")
}
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
