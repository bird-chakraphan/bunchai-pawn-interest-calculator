import { describe, expect, it } from "vitest"
import {
    normalizePhoneNumber,
    phoneNumbersMatch,
} from "@/lib/phone"

describe("normalizePhoneNumber", () => {
    it("normalizes Thai local and country-code formats to digits", () => {
        expect(normalizePhoneNumber("081-234-5678")).toBe("0812345678")
        expect(normalizePhoneNumber("+66 81 234 5678")).toBe("0812345678")
        expect(normalizePhoneNumber("")).toBeNull()
        expect(normalizePhoneNumber(null)).toBeNull()
    })
})

describe("phoneNumbersMatch", () => {
    it("matches local Thai mobile numbers with equivalent 66-prefixed values", () => {
        expect(phoneNumbersMatch("0812345678", "+66812345678")).toBe(true)
        expect(phoneNumbersMatch("66812345678", "0812345678")).toBe(true)
        expect(phoneNumbersMatch("0812345678", "0899999999")).toBe(false)
    })
})
