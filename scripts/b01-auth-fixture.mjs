import { createClient } from "@supabase/supabase-js"
import { randomBytes } from "node:crypto"
import { existsSync, mkdirSync, readFileSync, writeFileSync, chmodSync } from "node:fs"
import { loadLocalContext } from "./b01-local-target.mjs"

const mode = process.argv[2] ?? "check"
if (!["prepare", "check"].includes(mode)) throw new Error("Choose prepare or check")
const { url, serviceKey, anonKey } = loadLocalContext()
const options = { auth: { persistSession: false, autoRefreshToken: false } }
const admin = createClient(url, serviceKey, options)
const folder = "supabase/.temp/b01-auth"
const file = `${folder}/fixture.json`
const email = "b01-staff@example.test"
let fixture
if (existsSync(file)) {
    fixture = JSON.parse(readFileSync(file, "utf8"))
    const found = await admin.auth.admin.getUserById(fixture.userId)
    if (!found.error && (found.data.user.email !== email || found.data.user.app_metadata.b01_fixture !== true)) {
        throw new Error("Existing fixture identity does not match; no credentials changed")
    }
    if (found.error) fixture = null // A disposable local reset removed the prior fixture.
}
if (!fixture) {
    const password = randomBytes(32).toString("base64url")
    const result = await admin.auth.admin.createUser({ email, password, email_confirm: true, app_metadata: { b01_fixture: true } })
    if (result.error) throw new Error("Could not create the synthetic local Auth user; no existing password was changed")
    fixture = { userId: result.data.user.id, email, password }
    mkdirSync(folder, { recursive: true, mode: 0o700 })
    writeFileSync(file, JSON.stringify(fixture), { mode: 0o600 })
}
chmodSync(file, 0o600)
if (mode === "check") {
    const client = createClient(url, anonKey, options)
    const wrong = await client.auth.signInWithPassword({ email: fixture.email, password: "deliberately-wrong-b01-password" })
    if (wrong.error?.code !== "invalid_credentials" || wrong.data.session) throw new Error("Wrong-password check did not reach the active password provider")
    const signedIn = await client.auth.signInWithPassword({ email: fixture.email, password: fixture.password })
    if (signedIn.error || signedIn.data.user?.id !== fixture.userId) throw new Error("Synthetic sign-in failed")
    const pawn = await client.from("pawn_records").select("pawn_id").eq("pawn_id", "I99001").single()
    if (pawn.error || pawn.data?.pawn_id !== "I99001") throw new Error("Authenticated sample lookup failed")
    const registration = await createClient(url, anonKey, options).auth.signUp({ email: "b01-unregistered@example.test", password: fixture.password })
    if (registration.error?.code !== "signup_disabled" || registration.data.user) throw new Error("Public registration was not rejected as disabled")
    const signedOut = await client.auth.signOut()
    if (signedOut.error) throw new Error("Synthetic sign-out failed")
    const session = await client.auth.getSession()
    if (session.data.session) throw new Error("Local client retained its session after sign-out")
    const denied = await client.from("pawn_records").select("pawn_id")
    if (!denied.error) throw new Error("Signed-out table access unexpectedly succeeded")
    console.log(JSON.stringify({ syntheticUser: true, wrongPasswordDenied: true, signIn: true, authenticatedSampleLookup: true, publicRegistrationDisabled: true, signOut: true, signedOutTableDenied: true }))
} else {
    console.log("Synthetic local Auth fixture ready; credentials remain in the ignored mode-0600 fixture file.")
}
