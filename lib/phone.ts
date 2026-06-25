function digitsOnly(value: string): string {
    return value.replace(/\D/g, "")
}

function canonicalThaiPhone(value: string | null): string | null {
    if (!value) {
        return null
    }

    const digits = digitsOnly(value)

    if (!digits) {
        return null
    }

    if (digits.startsWith("66") && digits.length >= 11) {
        return `0${digits.slice(2)}`
    }

    return digits
}

export function normalizePhoneNumber(value: string | null): string | null {
    return canonicalThaiPhone(value)
}

export function phoneNumbersMatch(left: string | null, right: string | null): boolean {
    const normalizedLeft = canonicalThaiPhone(left)
    const normalizedRight = canonicalThaiPhone(right)

    if (!normalizedLeft || !normalizedRight) {
        return false
    }

    return normalizedLeft === normalizedRight
}
