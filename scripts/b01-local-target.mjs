import { execFileSync } from "node:child_process"
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import nextEnv from "@next/env"
import { assertLocalTestConfiguration } from "../lib/local-test-config.ts"

export const B01_PROJECT = "bunchai-b01-local"
export const B01_NETWORK = "bunchai-b01-loopback"

export function assertLocalProject(root = process.cwd()) {
    const config = readFileSync(join(root, "supabase/config.toml"), "utf8")
    if (!/^project_id\s*=\s*"bunchai-b01-local"\s*$/m.test(config)) {
        throw new Error("B01 commands require the named local project")
    }
    if (existsSync(join(root, "supabase/.temp/project-ref"))) {
        throw new Error("B01 must not be linked to a hosted Supabase project")
    }
    const api = config.match(/^\[api\]\s*\n([\s\S]*?)(?=^\[|$(?![\s\S]))/m)?.[1] ?? ""
    if (!/^port\s*=\s*55321\s*$/m.test(api)) {
        throw new Error("B01 commands require local API port 55321")
    }
}

export function assertLocalStatus(status, env = undefined) {
    if (status.API_URL !== "http://127.0.0.1:55321" || !status.ANON_KEY || !status.SERVICE_ROLE_KEY) {
        throw new Error("Unexpected local Supabase status; no action taken")
    }
    if (env && (env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== status.ANON_KEY || env.SUPABASE_SERVICE_ROLE_KEY !== status.SERVICE_ROLE_KEY)) {
        throw new Error("Environment credentials do not match the current local stack")
    }
}

export function assertLocalDockerEndpoint(endpoint) {
    if (!endpoint.startsWith("unix://")) throw new Error("B01 requires a local Unix Docker socket")
}

export function localServicesReady(services) {
    if (services.length !== 8) throw new Error("Expected exactly eight B01 services")
    for (const service of services) {
        const networks = Object.keys(service.NetworkSettings.Networks)
        if (networks.length !== 1 || networks[0] !== B01_NETWORK) throw new Error("Unexpected B01 service network")
        for (const bindings of Object.values(service.HostConfig.PortBindings ?? {})) {
            if ((bindings ?? []).some(b => b.HostIp !== "127.0.0.1")) throw new Error("B01 services must publish only on loopback")
        }
    }
    return services.every(c => c.State.Running && (!c.State.Health || c.State.Health.Status === "healthy"))
}

export function inspectLocalServices() {
    const names = ["db", "kong", "studio", "inbucket", "pg_meta", "storage", "rest", "auth"].map(s => `supabase_${s}_${B01_PROJECT}`)
    return JSON.parse(localCommand("docker", ["inspect", ...names]))
}

export async function waitForLocalServices() {
    for (let attempt = 0; ; attempt++) {
        if (localServicesReady(inspectLocalServices())) return
        if (attempt >= 59) throw new Error("B01 services did not become healthy")
        await new Promise(resolve => setTimeout(resolve, 1000))
    }
}

// Command output can include local credentials. Never attach stdout/stderr to an error.
export function localCommand(command, args, options = {}) {
    try {
        return execFileSync(command, args, {
            encoding: "utf8", stdio: ["pipe", "pipe", "pipe"], timeout: 180000,
            maxBuffer: 8 * 1024 * 1024, ...options,
        })
    } catch {
        throw new Error(`B01 ${command} ${args[0] ?? ""} failed; output withheld to protect local credentials`)
    }
}

export function assertLocalDocker() {
    assertLocalDockerEndpoint(localCommand("docker", ["context", "inspect", "--format", "{{.Endpoints.docker.Host}}"]).trim())
}

export function getLocalStatus() {
    assertLocalProject()
    assertLocalDocker()
    let status
    try { status = JSON.parse(localCommand("supabase", ["status", "-o", "json"])) }
    catch { throw new Error("Local Supabase status unavailable; start the B01 stack first (output withheld)") }
    assertLocalStatus(status)
    return status
}

export function loadLocalContext() {
    assertLocalProject()
    nextEnv.loadEnvConfig(process.cwd())
    assertLocalTestConfiguration(process.env)
    assertLocalStatus(getLocalStatus(), process.env)
    return {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    }
}
