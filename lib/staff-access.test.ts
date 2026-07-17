import { describe, expect, it } from "vitest"
import { canAccessService, type StaffAccessContext } from "@/lib/staff-access"

const context: StaffAccessContext = {
    userId: "staff-user",
    fullName: "Test Staff",
    services: [{ service: "pawn", role: "staff" }],
}

describe("canAccessService", () => {
    it("allows an active service role", () => {
        expect(canAccessService(context, "pawn")).toBe(true)
    })

    it("denies a service the staff member does not have", () => {
        expect(canAccessService(context, "jewelry")).toBe(false)
    })

    it("denies a role outside the allowed operation roles", () => {
        expect(canAccessService(context, "pawn", ["manager", "admin"])).toBe(false)
    })
})
