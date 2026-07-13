import fs from "node:fs"
import path from "node:path"
import vm from "node:vm"
import { describe, expect, it } from "vitest"

function loadScriptExports() {
    const scriptPath = path.resolve(
        process.cwd(),
        "scripts/google-sheets-pawn-sync-apps-script.js"
    )
    const source = fs.readFileSync(scriptPath, "utf8")
    const context = {
        Map,
        Date,
        console,
        Session: {
            getScriptTimeZone: () => "Asia/Bangkok",
        },
        Utilities: {
            formatDate: (value) => {
                const year = value.getUTCFullYear()
                const month = String(value.getUTCMonth() + 1).padStart(2, "0")
                const day = String(value.getUTCDate()).padStart(2, "0")
                return `${year}-${month}-${day}`
            },
        },
    }

    vm.createContext(context)
    vm.runInContext(
        `${source}\nthis.__TEST_EXPORTS__ = { CONFIG, buildPawnRows_, columnToIndex_ };`,
        context
    )

    return context.__TEST_EXPORTS__
}

function createLoanStockRow(valuesByColumn, columnToIndex) {
    const maxColumn = Math.max(...Object.keys(valuesByColumn).map(columnToIndex))
    const row = new Array(maxColumn).fill("")

    for (const [columnLetter, value] of Object.entries(valuesByColumn)) {
        row[columnToIndex(columnLetter) - 1] = value
    }

    return row
}

describe("google sheets pawn sync apps script", () => {
    it("uses Updated Loan Amount from column BJ for loanAmount", () => {
        const { CONFIG, buildPawnRows_, columnToIndex_ } = loadScriptExports()
        const row = createLoanStockRow(
            {
                A: "P-1001",
                AL: "2%",
                AM: "CUST-1",
                AP: new Date("2026-07-01T00:00:00.000Z"),
                AZ: "ยังอยู่ในกำหนด",
                AK: 11111,
                BJ: 22222,
            },
            columnToIndex_
        )
        const sheet = {
            getLastRow: () => CONFIG.FIRST_DATA_ROW,
            getRange: () => ({
                getValues: () => [row],
            }),
        }
        const rows = buildPawnRows_(sheet, new Map([["CUST-1", "0812345678"]]), {
            loanAmountColumnLetter: CONFIG.LOAN_AMOUNT_COLUMN,
            promoColumnLetter: CONFIG.PROMO_COLUMN,
            defaultPromoType: "",
        })

        expect(CONFIG.LOAN_AMOUNT_COLUMN).toBe("BJ")
        expect(rows).toHaveLength(1)
        expect(rows[0]).toMatchObject({
            pawnId: "P-1001",
            customerPhone: "0812345678",
            loanAmount: 22222,
        })
    })
})
