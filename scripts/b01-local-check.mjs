import { createClient } from "@supabase/supabase-js"
import { loadLocalContext, inspectLocalServices, localServicesReady } from "./b01-local-target.mjs"

const { url, serviceKey, anonKey } = loadLocalContext()
const containers = inspectLocalServices()
if (!localServicesReady(containers)) throw new Error("B01 services are not healthy")
const admin = createClient(url, serviceKey, { auth: { persistSession: false } })
const anon = createClient(url, anonKey, { auth: { persistSession: false } })
const pawn = await admin.from("pawn_records").select("pawn_id").eq("pawn_id", "I99001").single()
if (pawn.error || pawn.data?.pawn_id !== "I99001") throw new Error("The synthetic B01 pawn is unavailable")
const denied = await anon.from("pawn_records").select("pawn_id")
if (!denied.error) throw new Error("Anonymous table access unexpectedly succeeded")
const auth = await fetch(`${url}/auth/v1/health`, { headers: { apikey: anonKey }, signal: AbortSignal.timeout(5000) })
if (!auth.ok) throw new Error("Local Auth health check failed")
const app = await fetch("http://127.0.0.1:3000", { signal: AbortSignal.timeout(5000) })
if (!app.ok || !(await app.text()).includes("ข้อมูลตัวอย่างสำหรับทดสอบ")) throw new Error("Local sample app is not ready")
const staff = await fetch("http://127.0.0.1:3000/staff", { redirect: "manual", signal: AbortSignal.timeout(5000) })
if (staff.status !== 307 || staff.headers.get("location") !== "/staff/sign-in") throw new Error("Signed-out staff access did not redirect")
console.log(JSON.stringify({ localTarget: true, matchingLocalKeys: true, healthyServices: containers.length, loopbackOnly: true, samplePawn: true, anonymousTableDenied: true, authHealthy: true, samplePage: true, signedOutStaffDenied: true }))
