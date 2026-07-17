import type { SupabaseClient } from "@supabase/supabase-js"
import type { StaffService } from "@/lib/staff-access"

export async function recordAuditEvent(params: {
    supabase: SupabaseClient
    actorUserId?: string | null
    eventType: string
    entityType: string
    entityId?: string | null
    metadata?: Record<string, unknown>
    serviceKey?: StaffService
}) {
    const { error } = await params.supabase.from("audit_events").insert({
        actor_user_id: params.actorUserId ?? null,
        event_type: params.eventType,
        entity_type: params.entityType,
        entity_id: params.entityId ?? null,
        metadata: params.metadata ?? {},
        service_key: params.serviceKey ?? "pawn",
    })

    if (error) {
        throw new Error(error.message)
    }
}
