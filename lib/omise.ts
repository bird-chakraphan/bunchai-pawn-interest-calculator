function createBasicAuthHeader(secretKey: string): string {
    return `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`
}

export async function createOmisePaymentLink(params: {
    secretKey: string
    amountSubunits: number
    title: string
    description: string
}) {
    const body = new URLSearchParams({
        amount: String(params.amountSubunits),
        currency: "THB",
        title: params.title,
        description: params.description,
    })

    const response = await fetch("https://api.omise.co/links", {
        method: "POST",
        headers: {
            authorization: createBasicAuthHeader(params.secretKey),
            "content-type": "application/x-www-form-urlencoded",
        },
        body,
    })

    const payload = (await response.json()) as {
        id?: string
        payment_uri?: string
        message?: string
    }

    if (!response.ok || !payload.id || !payload.payment_uri) {
        throw new Error(payload.message || "Failed to create Omise payment link")
    }

    return {
        omiseLinkId: payload.id,
        checkoutUrl: payload.payment_uri,
    }
}

export async function verifyOmiseEventById(params: {
    secretKey: string
    eventId: string
}) {
    const response = await fetch(`https://api.omise.co/events/${params.eventId}`, {
        headers: {
            authorization: createBasicAuthHeader(params.secretKey),
        },
    })

    const payload = (await response.json()) as {
        id?: string
        key?: string
        message?: string
        [key: string]: unknown
    }

    if (!response.ok || payload.id !== params.eventId) {
        throw new Error(payload.message || "Failed to verify Omise event")
    }

    return payload
}

export async function retrieveOmiseCharge(params: {
    secretKey: string
    chargeId: string
}) {
    const response = await fetch(`https://api.omise.co/charges/${params.chargeId}`, {
        headers: {
            authorization: createBasicAuthHeader(params.secretKey),
        },
    })

    const payload = (await response.json()) as {
        id?: string
        status?: string
        paid?: boolean
        amount?: number
        link?: string | { id?: string } | null
        metadata?: { payment_id?: string }
        message?: string
        [key: string]: unknown
    }

    if (!response.ok || payload.id !== params.chargeId) {
        throw new Error(payload.message || "Failed to retrieve Omise charge")
    }

    return payload
}
