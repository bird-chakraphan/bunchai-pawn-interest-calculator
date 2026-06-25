import type { SupabaseClient } from "@supabase/supabase-js"

export async function recordAuditEvent(params: {
    supabase: SupabaseClient
    actorUserId?: string | null
    eventType: string
    entityType: string
    entityId?: string | null
    metadata?: Record<string, unknown>
}) {
    const { error } = await params.supabase.from("audit_events").insert({
        actor_user_id: params.actorUserId ?? null,
        event_type: params.eventType,
        entity_type: params.entityType,
        entity_id: params.entityId ?? null,
        metadata: params.metadata ?? {},
    })

    if (error) {
        throw new Error(error.message)
    }
}
