"use server"

import { randomUUID } from "node:crypto"
import { redirect } from "next/navigation"
import { recordAuditEvent } from "@/lib/audit-events"
import { normalizeJewelryPhone, parseNonNegativeAmount, safeJewelryFilename } from "@/lib/jewelry"
import { requireServiceAccess } from "@/lib/staff-access"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"

function getAdminClient() {
    const client = createAdminSupabaseClient()

    if (!client) {
        throw new Error("Supabase service role is not configured")
    }

    return client
}

function returnToItem(itemId: string, error?: string) {
    const suffix = error ? `?error=${encodeURIComponent(error)}` : ""
    redirect(`/staff/jewelry/items/${itemId}${suffix}`)
}

export async function createJewelryItemAction(formData: FormData) {
    const staff = await requireServiceAccess("jewelry")
    const admin = getAdminClient()
    const itemCode = String(formData.get("itemCode") ?? "").trim()
    const categoryId = String(formData.get("categoryId") ?? "").trim()
    const title = String(formData.get("title") ?? "").trim()
    const salePrice = parseNonNegativeAmount(formData.get("salePrice"))

    if (!itemCode || !categoryId || !title) {
        redirect("/staff/jewelry/new?error=missing-required-fields")
    }

    const { data: item, error } = await admin
        .from("jewelry_items")
        .insert({
            item_code: itemCode,
            category_id: categoryId,
            title,
            description: String(formData.get("description") ?? "").trim() || null,
            gross_weight_g: parseNonNegativeAmount(formData.get("grossWeight")),
            gold_weight_g: parseNonNegativeAmount(formData.get("goldWeight")),
            material: String(formData.get("material") ?? "").trim() || null,
            current_location: String(formData.get("location") ?? "").trim() || null,
            sale_price: salePrice,
            status: String(formData.get("status") ?? "draft") === "in_stock" ? "in_stock" : "draft",
            created_by: staff.userId,
            updated_by: staff.userId,
        })
        .select("id")
        .single()

    if (error || !item) {
        redirect(`/staff/jewelry/new?error=${encodeURIComponent(error?.message ?? "create-failed")}`)
    }

    const photo = formData.get("photo")
    if (photo instanceof File && photo.size > 0) {
        const storagePath = `${item.id}/${randomUUID()}.${safeJewelryFilename(photo.name)}`
        const uploadResult = await admin.storage
            .from("jewelry-photos")
            .upload(storagePath, Buffer.from(await photo.arrayBuffer()), {
                contentType: photo.type || "image/jpeg",
                upsert: false,
            })

        if (uploadResult.error) {
            returnToItem(String(item.id), uploadResult.error.message)
        }

        const mediaResult = await admin.from("jewelry_item_media").insert({
            item_id: item.id,
            storage_path: storagePath,
            caption: String(formData.get("photoCaption") ?? "").trim() || null,
            uploaded_by: staff.userId,
        })

        if (mediaResult.error) {
            returnToItem(String(item.id), mediaResult.error.message)
        }
    }

    await recordAuditEvent({
        supabase: admin,
        actorUserId: staff.userId,
        eventType: "jewelry_item_created",
        entityType: "jewelry_item",
        entityId: String(item.id),
        serviceKey: "jewelry",
    })

    redirect(`/staff/jewelry/items/${item.id}`)
}

export async function updateJewelryItemAction(formData: FormData) {
    const staff = await requireServiceAccess("jewelry")
    const admin = getAdminClient()
    const itemId = String(formData.get("itemId") ?? "").trim()

    if (!itemId) returnToItem(itemId, "invalid-item")

    const current = await admin.from("jewelry_items").select("status").eq("id", itemId).maybeSingle()
    if (current.error || !current.data || !["draft", "in_stock"].includes(current.data.status)) {
        returnToItem(itemId, "item-is-not-editable")
    }

    const result = await admin
        .from("jewelry_items")
        .update({
            title: String(formData.get("title") ?? "").trim(),
            description: String(formData.get("description") ?? "").trim() || null,
            gross_weight_g: parseNonNegativeAmount(formData.get("grossWeight")),
            gold_weight_g: parseNonNegativeAmount(formData.get("goldWeight")),
            current_location: String(formData.get("location") ?? "").trim() || null,
            sale_price: parseNonNegativeAmount(formData.get("salePrice")),
            updated_by: staff.userId,
        })
        .eq("id", itemId)

    if (result.error) returnToItem(itemId, result.error.message)

    await recordAuditEvent({
        supabase: admin,
        actorUserId: staff.userId,
        eventType: "jewelry_item_updated",
        entityType: "jewelry_item",
        entityId: itemId,
        serviceKey: "jewelry",
    })
    redirect(`/staff/jewelry/items/${itemId}?success=updated`)
}

export async function createJewelrySaleAction(formData: FormData) {
    const staff = await requireServiceAccess("jewelry")
    const admin = getAdminClient()
    const itemId = String(formData.get("itemId") ?? "").trim()
    const customerName = String(formData.get("customerName") ?? "").trim()
    const phoneRaw = String(formData.get("customerPhone") ?? "").trim()
    const amount = parseNonNegativeAmount(formData.get("saleAmount"))

    if (!itemId || !customerName || amount === null) {
        returnToItem(itemId, "missing-sale-information")
    }

    const phoneNormalized = normalizeJewelryPhone(phoneRaw)
    let customerId: string | null = null

    if (phoneNormalized) {
        const existing = await admin
            .from("jewelry_customers")
            .select("id")
            .eq("phone_normalized", phoneNormalized)
            .maybeSingle()
        customerId = existing.data?.id ? String(existing.data.id) : null
    }

    if (!customerId) {
        const customer = await admin
            .from("jewelry_customers")
            .insert({
                display_name: customerName,
                phone_raw: phoneRaw || null,
                phone_normalized: phoneNormalized,
                created_by: staff.userId,
                updated_by: staff.userId,
            })
            .select("id")
            .single()
        const newCustomerId = customer.data?.id
        if (customer.error || !newCustomerId) returnToItem(itemId, customer.error?.message ?? "customer-create-failed")
        customerId = String(newCustomerId)
    }

    const exceptionReason = String(formData.get("exceptionReason") ?? "").trim() || null
    const result = await admin.rpc("post_jewelry_sale", {
        p_item_id: itemId,
        p_customer_id: customerId,
        p_gross_amount: amount,
        p_terms_snapshot: {
            return_terms: String(formData.get("returnTerms") ?? "").trim() || null,
            exchange_terms: String(formData.get("exchangeTerms") ?? "").trim() || null,
        },
        p_actor_user_id: staff.userId,
        p_exception_reason: exceptionReason,
    })

    if (result.error) returnToItem(itemId, result.error.message)
    redirect(`/staff/jewelry/items/${itemId}?success=${exceptionReason && !staff.services.some((entry) => entry.service === "jewelry" && entry.role !== "staff") ? "approval-requested" : "sold"}`)
}

export async function returnJewelryItemAction(formData: FormData) {
    const staff = await requireServiceAccess("jewelry")
    const admin = getAdminClient()
    const itemId = String(formData.get("itemId") ?? "").trim()
    const originalSaleId = String(formData.get("originalSaleId") ?? "").trim()
    if (!itemId || !originalSaleId) returnToItem(itemId, "original-sale-required")
    const result = await admin.rpc("post_jewelry_return", {
        p_item_id: itemId,
        p_original_sale_id: originalSaleId,
        p_actor_user_id: staff.userId,
        p_reason: String(formData.get("reason") ?? "").trim() || null,
    })
    if (result.error) returnToItem(itemId, result.error.message)
    redirect(`/staff/jewelry/items/${itemId}?success=returned`)
}

export async function exchangeJewelryItemsAction(formData: FormData) {
    const staff = await requireServiceAccess("jewelry")
    const admin = getAdminClient()
    const itemId = String(formData.get("itemId") ?? "").trim()
    const originalSaleId = String(formData.get("originalSaleId") ?? "").trim()
    const replacementItemId = String(formData.get("replacementItemId") ?? "").trim()
    const amount = parseNonNegativeAmount(formData.get("exchangeAmount"))

    if (!itemId || !originalSaleId || !replacementItemId || amount === null) {
        returnToItem(itemId, "exchange-information-required")
    }

    const result = await admin.rpc("post_jewelry_exchange", {
        p_original_item_id: itemId,
        p_replacement_item_id: replacementItemId,
        p_original_sale_id: originalSaleId,
        p_actor_user_id: staff.userId,
        p_gross_amount: amount,
    })
    if (result.error) returnToItem(itemId, result.error.message)
    redirect(`/staff/jewelry/items/${itemId}?success=exchanged`)
}

export async function approveJewelryTransactionAction(formData: FormData) {
    const staff = await requireServiceAccess("jewelry", ["manager", "admin"])
    const admin = getAdminClient()
    const transactionId = String(formData.get("transactionId") ?? "").trim()
    if (!transactionId) redirect("/staff/jewelry/approvals?error=invalid-transaction")
    const result = await admin.rpc("approve_jewelry_transaction", {
        p_transaction_id: transactionId,
        p_actor_user_id: staff.userId,
    })
    if (result.error) redirect(`/staff/jewelry/approvals?error=${encodeURIComponent(result.error.message)}`)
    redirect("/staff/jewelry/approvals?success=approved")
}
