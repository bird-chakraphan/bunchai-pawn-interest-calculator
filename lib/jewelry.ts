export function normalizeJewelryPhone(value: string) {
    const digits = value.replace(/\D/g, "")

    if (!digits) return null

    return digits.startsWith("66") && digits.length === 11 ? `0${digits.slice(2)}` : digits
}

export function parseNonNegativeAmount(value: FormDataEntryValue | null) {
    const normalized = String(value ?? "").trim().replace(/,/g, "")

    if (!normalized) return null

    const amount = Number(normalized)
    return Number.isFinite(amount) && amount >= 0 ? amount : null
}

export function safeJewelryFilename(value: string) {
    const extension = value.split(".").pop()?.toLowerCase()

    return extension && /^[a-z0-9]+$/.test(extension) ? extension : "jpg"
}
