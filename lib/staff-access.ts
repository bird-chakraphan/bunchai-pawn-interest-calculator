import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export const STAFF_ROLES = ["staff", "manager", "admin"] as const
export const STAFF_SERVICES = ["pawn", "jewelry"] as const

export type StaffRole = (typeof STAFF_ROLES)[number]
export type StaffService = (typeof STAFF_SERVICES)[number]

export interface StaffAccessContext {
    userId: string
    fullName: string | null
    services: Array<{ service: StaffService; role: StaffRole }>
}

function isStaffRole(value: unknown): value is StaffRole {
    return typeof value === "string" && STAFF_ROLES.includes(value as StaffRole)
}

function isStaffService(value: unknown): value is StaffService {
    return typeof value === "string" && STAFF_SERVICES.includes(value as StaffService)
}

export function canAccessService(
    context: StaffAccessContext,
    service: StaffService,
    allowedRoles: readonly StaffRole[] = STAFF_ROLES
) {
    return context.services.some(
        (access) => access.service === service && allowedRoles.includes(access.role)
    )
}

export async function getActiveStaffContext(): Promise<StaffAccessContext | null> {
    const supabase = await createServerSupabaseClient()

    if (!supabase) {
        return null
    }

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return null
    }

    const [profileResult, accessResult] = await Promise.all([
        supabase
            .from("staff_profiles")
            .select("full_name, is_active")
            .eq("id", user.id)
            .maybeSingle(),
        supabase
            .from("staff_service_access")
            .select("service_key, role")
            .eq("user_id", user.id)
            .eq("is_active", true),
    ])

    if (profileResult.error || accessResult.error || !profileResult.data?.is_active) {
        return null
    }

    const services = (accessResult.data ?? []).flatMap((row) =>
        isStaffService(row.service_key) && isStaffRole(row.role)
            ? [{ service: row.service_key, role: row.role }]
            : []
    )

    return {
        userId: user.id,
        fullName: profileResult.data.full_name ?? null,
        services,
    }
}

export async function requireActiveStaffContext() {
    const context = await getActiveStaffContext()

    if (!context) {
        redirect("/staff/sign-in?error=staff-access-required")
    }

    return context
}

export async function requireServiceAccess(
    service: StaffService,
    allowedRoles: readonly StaffRole[] = STAFF_ROLES
) {
    const context = await requireActiveStaffContext()

    if (!canAccessService(context, service, allowedRoles)) {
        redirect("/staff?error=service-access-denied")
    }

    return context
}
