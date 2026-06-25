/**
 * Google Apps Script: Push pawn records from Google Sheets to the app.
 *
 * Setup:
 * 1. Open the source Google Sheet.
 * 2. Extensions -> Apps Script.
 * 3. Paste this whole file into Code.gs.
 * 4. Set Script Properties:
 *    - APP_SYNC_ENDPOINT=https://your-domain.com/api/internal/sync/pawn-records
 *    - INTERNAL_SYNC_SECRET=<same value as the app env>
 *    - PROMO_COLUMN_LETTER=<column letter that stores โปร 2% / โปรแสน>
 *    - DEFAULT_PROMO_TYPE=<optional: โปร 2% or โปรแสน (1.5%)>
 * 5. Run installFiveMinuteTrigger once.
 *
 * This script intentionally sends the full current source dataset. The app
 * upserts active rows and marks missing rows archived_from_source.
 */

const CONFIG = {
    SPREADSHEET_ID: "1QZmlv3x0jQ7g946X1fTy4DXrHvmJOcicXsOc4YKHXnw",
    LOAN_STOCK_SHEET_NAME: "Loan Stock",
    CUSTOMER_SHEET_NAME: "Customer",
    LOAN_ID_COLUMN: "A",
    LOAN_AMOUNT_COLUMN: "AK",
    CUSTOMER_ID_COLUMN_IN_LOAN_STOCK: "AM",
    LATEST_RENEWAL_DATE_COLUMN: "AP",
    CUSTOMER_ID_COLUMN_IN_CUSTOMER: "A",
    CUSTOMER_PHONE_COLUMN: "F",
    FIRST_DATA_ROW: 2,
}

function installFiveMinuteTrigger() {
    ScriptApp.getProjectTriggers()
        .filter((trigger) => trigger.getHandlerFunction() === "syncPawnRecords")
        .forEach((trigger) => ScriptApp.deleteTrigger(trigger))

    ScriptApp.newTrigger("syncPawnRecords")
        .timeBased()
        .everyMinutes(5)
        .create()
}

function syncPawnRecords() {
    const properties = PropertiesService.getScriptProperties()
    const endpoint = requireScriptProperty_(properties, "APP_SYNC_ENDPOINT")
    const syncSecret = requireScriptProperty_(properties, "INTERNAL_SYNC_SECRET")
    const promoColumnLetter = properties.getProperty("PROMO_COLUMN_LETTER")
    const defaultPromoType = properties.getProperty("DEFAULT_PROMO_TYPE")

    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID)
    const loanSheet = spreadsheet.getSheetByName(CONFIG.LOAN_STOCK_SHEET_NAME)
    const customerSheet = spreadsheet.getSheetByName(CONFIG.CUSTOMER_SHEET_NAME)

    if (!loanSheet) {
        throw new Error(`Missing sheet: ${CONFIG.LOAN_STOCK_SHEET_NAME}`)
    }

    if (!customerSheet) {
        throw new Error(`Missing sheet: ${CONFIG.CUSTOMER_SHEET_NAME}`)
    }

    const customerPhoneById = buildCustomerPhoneById_(customerSheet)
    const rows = buildPawnRows_(loanSheet, customerPhoneById, {
        promoColumnLetter,
        defaultPromoType,
    })
    const payload = {
        source: "google_sheets",
        spreadsheetId: CONFIG.SPREADSHEET_ID,
        sheetName: CONFIG.LOAN_STOCK_SHEET_NAME,
        startedAt: new Date().toISOString(),
        rows,
    }

    const response = UrlFetchApp.fetch(endpoint, {
        method: "post",
        contentType: "application/json",
        headers: {
            "x-sync-secret": syncSecret,
        },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true,
    })
    const statusCode = response.getResponseCode()

    if (statusCode < 200 || statusCode >= 300) {
        throw new Error(
            `Pawn sync failed with HTTP ${statusCode}: ${response.getContentText()}`
        )
    }

    return JSON.parse(response.getContentText())
}

function buildCustomerPhoneById_(sheet) {
    const lastRow = sheet.getLastRow()

    if (lastRow < CONFIG.FIRST_DATA_ROW) {
        return new Map()
    }

    const customerIdColumn = columnToIndex_(CONFIG.CUSTOMER_ID_COLUMN_IN_CUSTOMER)
    const phoneColumn = columnToIndex_(CONFIG.CUSTOMER_PHONE_COLUMN)
    const maxColumn = Math.max(customerIdColumn, phoneColumn)
    const values = sheet
        .getRange(CONFIG.FIRST_DATA_ROW, 1, lastRow - CONFIG.FIRST_DATA_ROW + 1, maxColumn)
        .getValues()
    const phoneById = new Map()

    values.forEach((row) => {
        const customerId = normalizeString_(row[customerIdColumn - 1])

        if (!customerId) {
            return
        }

        phoneById.set(customerId, normalizeString_(row[phoneColumn - 1]) || null)
    })

    return phoneById
}

function buildPawnRows_(sheet, customerPhoneById, options) {
    const lastRow = sheet.getLastRow()

    if (lastRow < CONFIG.FIRST_DATA_ROW) {
        return []
    }

    const loanIdColumn = columnToIndex_(CONFIG.LOAN_ID_COLUMN)
    const amountColumn = columnToIndex_(CONFIG.LOAN_AMOUNT_COLUMN)
    const customerIdColumn = columnToIndex_(CONFIG.CUSTOMER_ID_COLUMN_IN_LOAN_STOCK)
    const renewalDateColumn = columnToIndex_(CONFIG.LATEST_RENEWAL_DATE_COLUMN)
    const promoColumn = options.promoColumnLetter
        ? columnToIndex_(options.promoColumnLetter)
        : null
    const maxColumn = Math.max(
        loanIdColumn,
        amountColumn,
        customerIdColumn,
        renewalDateColumn,
        promoColumn || 1
    )
    const values = sheet
        .getRange(CONFIG.FIRST_DATA_ROW, 1, lastRow - CONFIG.FIRST_DATA_ROW + 1, maxColumn)
        .getValues()

    return values.map((row, index) => {
        const customerId = normalizeString_(row[customerIdColumn - 1])
        const rawPromo = promoColumn ? row[promoColumn - 1] : options.defaultPromoType

        return {
            rowIndex: CONFIG.FIRST_DATA_ROW + index,
            pawnId: normalizeString_(row[loanIdColumn - 1]),
            customerPhone: customerPhoneById.get(customerId) || null,
            startDate: formatDateForApp_(row[renewalDateColumn - 1]),
            loanAmount: parseLoanAmount_(row[amountColumn - 1]),
            promoType: normalizePromoType_(rawPromo),
            sourceUpdatedAt: null,
        }
    })
}

function requireScriptProperty_(properties, name) {
    const value = properties.getProperty(name)

    if (!value) {
        throw new Error(`Missing Script Property: ${name}`)
    }

    return value
}

function columnToIndex_(columnLetter) {
    return String(columnLetter)
        .trim()
        .toUpperCase()
        .split("")
        .reduce((total, character) => total * 26 + character.charCodeAt(0) - 64, 0)
}

function normalizeString_(value) {
    return value === null || value === undefined ? "" : String(value).trim()
}

function parseLoanAmount_(value) {
    if (typeof value === "number") {
        return value
    }

    const normalized = normalizeString_(value).replace(/,/g, "")
    const parsed = Number(normalized)

    return Number.isFinite(parsed) ? parsed : 0
}

function formatDateForApp_(value) {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
        return Utilities.formatDate(value, Session.getScriptTimeZone(), "yyyy-MM-dd")
    }

    const text = normalizeString_(value)

    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
        return text
    }

    return text
}

function normalizePromoType_(value) {
    const text = normalizeString_(value)

    if (text === "โปร 2%" || text === "2%" || text === "2") {
        return "โปร 2%"
    }

    if (
        text === "โปรแสน" ||
        text === "โปรแสน (1.5%)" ||
        text === "1.5%" ||
        text === "1.5"
    ) {
        return "โปรแสน (1.5%)"
    }

    return text
}
