import { createClient } from "@supabase/supabase-js"
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync, chmodSync } from "node:fs"
import { loadLocalContext, localCommand, waitForLocalServices, B01_NETWORK, B01_PROJECT } from "./b01-local-target.mjs"

if (process.argv.slice(2).join(" ") !== "--reset-local") throw new Error("This disposable local rehearsal requires --reset-local")
const { url, serviceKey } = loadLocalContext()
const admin = createClient(url, serviceKey, { auth: { persistSession: false } })
// Do not silently discard later local workflow trials or real accounts placed in this stack.
const pawns = await admin.from("pawn_records").select("pawn_id")
if (pawns.error || pawns.data.length !== 1 || pawns.data[0].pawn_id !== "I99001") throw new Error("Recovery is restricted to the single synthetic B01 pawn")
for (const table of ["staff_profiles", "payments", "staff_review_tasks", "notification_deliveries"]) {
    const result = await admin.from(table).select("id", { count: "exact", head: true })
    if (result.error || result.count !== 0) throw new Error(`Unexpected local ${table} rows; review a broader restore plan first`)
}
const users = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
if (users.error || users.data.users.length > 1 || users.data.users.some(u => u.email !== "b01-staff@example.test" || u.app_metadata.b01_fixture !== true)) {
    throw new Error("Unexpected Auth accounts; no local reset performed")
}
const folder = "supabase/.temp/b01-recovery"
if (existsSync(folder)) {
    const archive = `supabase/.temp/b01-recovery-history/${new Date().toISOString().replace(/[:.]/g, "-")}`
    mkdirSync(archive, { recursive: true, mode: 0o700 })
    cpSync(folder, `${archive}/snapshot`, { recursive: true, errorOnExist: true, force: false })
}
mkdirSync(folder, { recursive: true, mode: 0o700 })
console.log("Exporting synthetic public rows/schema and the retrieved private probe file; prior recovery files are archived locally.")
localCommand(process.execPath, ["scripts/b01-data-check.mjs", "probe"])
localCommand("supabase", ["db", "dump", "--local", "--schema", "public", "--file", `${folder}/schema.sql`])
chmodSync(`${folder}/schema.sql`, 0o600)
writeFileSync(`${folder}/data.sql`, localCommand("docker", ["exec", `supabase_db_${B01_PROJECT}`, "pg_dump", "-U", "postgres", "--data-only", "--schema", "public", "--inserts", "--no-owner", "--no-acl", "postgres"]), { mode: 0o600 })
loadLocalContext() // Revalidate the live local target immediately before reset.
console.log("Resetting only the unlinked B01 local database on its named network.")
localCommand("supabase", ["db", "reset", "--local", "--no-seed", "--network-id", B01_NETWORK])
localCommand("python3", ["scripts/b01-bind-local.py"])
await waitForLocalServices() // Database readiness alone does not cover Storage/Auth after reset.
localCommand("docker", ["exec", "-i", `supabase_db_${B01_PROJECT}`, "psql", "-U", "postgres", "-v", "ON_ERROR_STOP=1", "postgres"], { input: readFileSync(`${folder}/data.sql`, "utf8") })
localCommand(process.execPath, ["scripts/b01-data-check.mjs", "restore-file"])
if (existsSync("supabase/.temp/b01-auth/fixture.json")) localCommand(process.execPath, ["scripts/b01-auth-fixture.mjs", "prepare"])
console.log("Local public data and private probe file restored and verified; any synthetic Auth fixture was recreated. This is not production/Auth-history/full-media recovery proof.")
