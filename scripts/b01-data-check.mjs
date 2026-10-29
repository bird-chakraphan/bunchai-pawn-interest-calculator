import { createClient } from "@supabase/supabase-js"
import { createHash, randomUUID } from "node:crypto"
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { loadLocalContext } from "./b01-local-target.mjs"

const { url, serviceKey, anonKey } = loadLocalContext()
const admin = createClient(url, serviceKey, { auth: { persistSession: false } })
const anon = createClient(url, anonKey, { auth: { persistSession: false } })
const folder = "supabase/.temp/b01-recovery"
const bucket = "b01-test-files"
mkdirSync(folder, { recursive: true })

function checked(result) {
    if (result.error) throw new Error(result.error.message)
    return result
}
function sha256(bytes) {
    return createHash("sha256").update(bytes).digest("hex")
}
async function verify(manifest) {
    const row = checked(await admin.from("audit_events").select("event_type").eq("id", manifest.traceId).single()).data
    if (row.event_type !== "b01.isolation_probe") throw new Error("Trace row mismatch")
    const pawns = checked(await admin.from("pawn_records").select("id", { count: "exact", head: true })).count
    if (pawns !== manifest.pawnCount) throw new Error("Restored pawn count mismatch")
    const file = checked(await admin.storage.from(bucket).download(manifest.fileName)).data
    if (sha256(Buffer.from(await file.arrayBuffer())) !== manifest.fileSha256) throw new Error("Restored file mismatch")
    const denied = await anon.from("pawn_records").select("pawn_id")
    if (!denied.error) throw new Error("Anonymous direct table access unexpectedly succeeded")
    console.log(JSON.stringify({ traceRead: true, pawnCount: pawns, privateFileHashMatches: true, anonymousTableReadDenied: true }))
}

const mode = process.argv[2]
if (mode === "probe") {
    const traceId = randomUUID()
    checked(await admin.from("audit_events").insert({ id: traceId, event_type: "b01.isolation_probe", entity_type: "test_environment", entity_id: "bunchai-b01-local" }))
    const bytes = Buffer.from(`Synthetic B01 recovery fixture ${traceId}\n`, "utf8")
    const fileName = `recovery-${traceId}.txt`
    checked(await admin.storage.from(bucket).upload(fileName, bytes, { contentType: "text/plain" }))
    const pawnCount = checked(await admin.from("pawn_records").select("id", { count: "exact", head: true })).count
    const manifest = { traceId, fileName, fileSha256: sha256(bytes), pawnCount }
    // Export the retrieved object, rather than assuming the upload's source bytes were stored.
    const downloaded = checked(await admin.storage.from(bucket).download(fileName)).data
    writeFileSync(`${folder}/file.txt`, Buffer.from(await downloaded.arrayBuffer()), { mode: 0o600 })
    writeFileSync(`${folder}/manifest.json`, JSON.stringify(manifest, null, 2), { mode: 0o600 })
    await verify(manifest)
} else if (mode === "restore-file") {
    const manifest = JSON.parse(readFileSync(`${folder}/manifest.json`, "utf8"))
    const found = await admin.storage.getBucket(bucket)
    if (found.error) checked(await admin.storage.createBucket(bucket, { public: false }))
    checked(await admin.storage.from(bucket).upload(manifest.fileName, readFileSync(`${folder}/file.txt`), { contentType: "text/plain", upsert: true }))
    await verify(manifest)
} else if (mode === "verify") {
    await verify(JSON.parse(readFileSync(`${folder}/manifest.json`, "utf8")))
} else {
    throw new Error("Choose probe, restore-file or verify")
}
