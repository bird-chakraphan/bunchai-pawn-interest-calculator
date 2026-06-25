import { afterEach, describe, expect, it, vi } from "vitest"
import {
    createOmisePaymentLink,
    retrieveOmiseCharge,
    verifyOmiseEventById,
} from "@/lib/omise"

describe("createOmisePaymentLink", () => {
    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it("creates a hosted payment link and returns its checkout URL", async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                id: "link_test_123",
                payment_uri: "https://link.omise.co/test-link",
            }),
        })

        vi.stubGlobal("fetch", fetchMock)

        const result = await createOmisePaymentLink({
            secretKey: "skey_test",
            amountSubunits: 20000,
            title: "P-1001",
            description: "ต่อดอก",
        })

        expect(result).toEqual({
            omiseLinkId: "link_test_123",
            checkoutUrl: "https://link.omise.co/test-link",
        })
        expect(fetchMock).toHaveBeenCalledOnce()
        expect(String(fetchMock.mock.calls[0]?.[1]?.body)).not.toContain("metadata")
        expect(String(fetchMock.mock.calls[0]?.[1]?.body)).not.toContain("return_uri")
    })
})

describe("Omise verification", () => {
    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it("fetches the canonical Omise event payload by id", async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                id: "evnt_test_123",
                key: "charge.complete",
                data: {
                    id: "chrg_test_123",
                },
            }),
        })

        vi.stubGlobal("fetch", fetchMock)

        const result = await verifyOmiseEventById({
            secretKey: "skey_test",
            eventId: "evnt_test_123",
        })

        expect(result.key).toBe("charge.complete")
        expect(fetchMock).toHaveBeenCalledOnce()
    })

    it("retrieves the canonical charge used to confirm payment", async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                id: "chrg_test_123",
                status: "successful",
                paid: true,
                amount: 20000,
                link: "link_test_123",
            }),
        })

        vi.stubGlobal("fetch", fetchMock)

        const result = await retrieveOmiseCharge({
            secretKey: "skey_test",
            chargeId: "chrg_test_123",
        })

        expect(result.status).toBe("successful")
        expect(result.link).toBe("link_test_123")
    })
})
