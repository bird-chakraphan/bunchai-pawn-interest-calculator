import { existsSync } from "node:fs"
import { spawn } from "node:child_process"
import { assertLocalProject, assertLocalDocker, localCommand, loadLocalContext, waitForLocalServices, B01_NETWORK } from "./b01-local-target.mjs"

const args = process.argv.slice(2)
if (args.length && (args.length !== 1 || args[0] !== "--dev")) throw new Error("Choose no arguments or --dev")
assertLocalProject()
assertLocalDocker()
const networks = localCommand("docker", ["network", "ls", "--format", "{{.Name}}"]).trim().split("\n")
if (!networks.includes(B01_NETWORK)) {
    localCommand("docker", ["network", "create", "--driver", "bridge", "--opt", "com.docker.network.bridge.host_binding_ipv4=127.0.0.1", B01_NETWORK])
}
const network = JSON.parse(localCommand("docker", ["network", "inspect", B01_NETWORK]))[0]
if (network.Driver !== "bridge" || network.Options?.["com.docker.network.bridge.host_binding_ipv4"] !== "127.0.0.1") {
    throw new Error("Unexpected B01 network configuration; no services started")
}
console.log("Starting the named local B01 stack; CLI output withheld because it includes local keys.")
localCommand("supabase", ["start", "--network-id", B01_NETWORK, "--exclude", "vector,logflare,realtime,edge-runtime,imgproxy,supavisor"])
localCommand("python3", ["scripts/b01-bind-local.py"])
await waitForLocalServices()
if (!existsSync(".env.local")) localCommand(process.execPath, ["scripts/b01-local-env.mjs"])
loadLocalContext() // Refuse an inherited/stale environment instead of overwriting it.
console.log("Local B01 services and matching test credentials are ready. No hosted link or deployment.")
if (args[0] === "--dev") {
    const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1"], { stdio: "inherit" })
    child.on("exit", (code) => { process.exitCode = code ?? 1 })
} else {
    console.log("Start the sample app with npm run b01:dev, or build/start on loopback using the runbook.")
}
