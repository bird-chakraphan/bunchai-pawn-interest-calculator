// @vitest-environment node
import { afterEach, describe, expect, it } from "vitest"
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { assertLocalProject, assertLocalStatus, assertLocalDockerEndpoint, localCommand, localServicesReady } from "./b01-local-target.mjs"

const folders: string[] = []
function project(config = 'project_id = "bunchai-b01-local"\n[api]\nport = 55321\n') {
    const folder = mkdtempSync(join(tmpdir(), "b01-guard-"))
    folders.push(folder)
    mkdirSync(join(folder, "supabase/.temp"), { recursive: true })
    writeFileSync(join(folder, "supabase/config.toml"), config)
    return folder
}
afterEach(() => { for (const folder of folders.splice(0)) rmSync(folder, { recursive: true, force: true }) })

describe("B01 command target guards", () => {
    function services() {
        return Array.from({ length: 8 }, () => ({ NetworkSettings: { Networks: { "bunchai-b01-loopback": {} } }, HostConfig: { PortBindings: { "8000/tcp": [{ HostIp: "127.0.0.1" }] } }, State: { Running: true, Health: { Status: "healthy" } } }))
    }
    it("waits for service readiness rather than treating a running container as ready", () => {
        const stack = services()
        expect(localServicesReady(stack)).toBe(true)
        stack[0].State.Health.Status = "starting"
        expect(localServicesReady(stack)).toBe(false)
        stack[0].State.Running = false
        expect(localServicesReady(stack)).toBe(false)
    })
    it("refuses missing services or network isolation during readiness checks", () => {
        expect(() => localServicesReady(services().slice(1))).toThrow()
        const stack = services()
        stack[0].NetworkSettings.Networks = {} as typeof stack[0]["NetworkSettings"]["Networks"]
        expect(() => localServicesReady(stack)).toThrow(/network/)
    })
    it("refuses non-loopback publication during readiness checks", () => {
        const stack = services()
        stack[0].HostConfig.PortBindings["8000/tcp"][0].HostIp = "0.0.0.0"
        expect(() => localServicesReady(stack)).toThrow(/loopback/)
    })
    it("accepts only the named unlinked local project", () => {
        expect(() => assertLocalProject(project())).not.toThrow()
        expect(() => assertLocalProject(project('project_id = "production"\n[api]\nport = 55321\n'))).toThrow()
    })
    it("rejects a hosted link even when the file is empty", () => {
        const root = project()
        writeFileSync(join(root, "supabase/.temp/project-ref"), "")
        expect(() => assertLocalProject(root)).toThrow(/linked/)
    })
    it("rejects a mismatched local API port", () => {
        expect(() => assertLocalProject(project('project_id = "bunchai-b01-local"\n[api]\nport = 54321\n'))).toThrow()
    })
    it("rejects hosted or lookalike CLI status before any network request", () => {
        const local = { API_URL: "http://127.0.0.1:55321", ANON_KEY: "fake-public", SERVICE_ROLE_KEY: "fake-server" }
        expect(() => assertLocalStatus(local)).not.toThrow()
        expect(() => assertLocalStatus({ ...local, API_URL: "https://shop.supabase.co" })).toThrow()
        expect(() => assertLocalStatus({ ...local, API_URL: "http://127.0.0.1.example.com:55321" })).toThrow()
    })
    it("rejects missing keys or credentials different from the current local stack", () => {
        const status = { API_URL: "http://127.0.0.1:55321", ANON_KEY: "fake-public", SERVICE_ROLE_KEY: "fake-server" }
        expect(() => assertLocalStatus({ ...status, ANON_KEY: "" })).toThrow()
        expect(() => assertLocalStatus(status, { NEXT_PUBLIC_SUPABASE_ANON_KEY: "fake-public", SUPABASE_SERVICE_ROLE_KEY: "other-key" })).toThrow(/credentials/)
    })
    it("refuses a remote Docker context", () => {
        expect(() => assertLocalDockerEndpoint("unix:///tmp/local-docker.sock")).not.toThrow()
        expect(() => assertLocalDockerEndpoint("ssh://remote-server")).toThrow()
        expect(() => assertLocalDockerEndpoint("tcp://remote-server:2376")).toThrow()
    })
    it("withholds command output from errors instead of leaking credentials", () => {
        let message = ""
        try { localCommand(process.execPath, ["-e", "process.stderr.write('synthetic-sensitive-token');process.exit(1)"]) }
        catch (error) { message = String(error) }
        expect(message).toContain("output withheld")
        expect(message).not.toContain("synthetic-sensitive-token")
    })
})
