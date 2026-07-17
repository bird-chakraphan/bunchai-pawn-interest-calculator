import { describe, expect, it } from "vitest"
import { normalizeJewelryPhone, parseNonNegativeAmount, safeJewelryFilename } from "@/lib/jewelry"

describe("jewelry form helpers", () => {
    it("normalizes Thai phone input without inventing a number", () => {
        expect(normalizeJewelryPhone("+66 81-234-5678")).toBe("0812345678")
        expect(normalizeJewelryPhone("-")).toBeNull()
    })

    it("only accepts non-negative amounts", () => {
        expect(parseNonNegativeAmount("12,500")).toBe(12500)
        expect(parseNonNegativeAmount("-1")).toBeNull()
    })

    it("keeps a safe image extension", () => {
        expect(safeJewelryFilename("ring.PNG")).toBe("png")
        expect(safeJewelryFilename("ring.unsafe/extension")).toBe("jpg")
    })
})
