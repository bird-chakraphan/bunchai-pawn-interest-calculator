import { normalizePhoneNumber } from "@/lib/phone"

export interface IncomingSyncRow {
    rowIndex: number
    pawnId: string
    customerPhone: string | null
    startDate: string
    loanAmount: number
    promoType: string
    baseRate: number
    sourceUpdatedAt: string | null
}

export interface SyncRunIssueInput {
    rowIndex: number | null
    pawnIdRaw: string | null
    severity: "warning" | "error"
    reason: string
    rawRow: Record<string, unknown>
}

interface PrepareSyncRowsResult {
    validRows: IncomingSyncRow[]
    issues: SyncRunIssueInput[]
}

function isValidDateInput(value: string): boolean {
    const parsedDate = new Date(value)
    return !Number.isNaN(parsedDate.getTime()) && /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function normalizePawnId(value: string): string {
    return value.trim()
}

function toIssue(row: IncomingSyncRow, reason: string): SyncRunIssueInput {
    return {
        rowIndex: row.rowIndex,
        pawnIdRaw: row.pawnId,
        severity: "error",
        reason,
        rawRow: row as unknown as Record<string, unknown>,
    }
}

function validateRow(row: IncomingSyncRow): SyncRunIssueInput | null {
    if (!normalizePawnId(row.pawnId)) {
        return toIssue(row, "Missing Pawn ID")
    }

    if (!isValidDateInput(row.startDate)) {
        return toIssue(row, "Invalid start date")
    }

    if (!Number.isFinite(row.loanAmount) || row.loanAmount <= 0) {
        return toIssue(row, "Invalid loan amount")
    }

    if (!Number.isFinite(row.baseRate) || row.baseRate <= 0) {
        return toIssue(row, "Invalid base rate")
    }

    return null
}

export function prepareSyncRows(rows: IncomingSyncRow[]): PrepareSyncRowsResult {
    const issues: SyncRunIssueInput[] = []
    const validRows: IncomingSyncRow[] = []
    const seenPawnIds = new Set<string>()

    for (const row of rows) {
        const validationIssue = validateRow(row)

        if (validationIssue) {
            issues.push(validationIssue)
            continue
        }

        const normalizedPawnId = normalizePawnId(row.pawnId)

        if (seenPawnIds.has(normalizedPawnId)) {
            issues.push(toIssue(row, "Duplicate Pawn ID in sync batch"))
            continue
        }

        seenPawnIds.add(normalizedPawnId)
        validRows.push({
            ...row,
            pawnId: normalizedPawnId,
            customerPhone: normalizePhoneNumber(row.customerPhone),
        })
    }

    return {
        validRows,
        issues,
    }
}

export function buildArchivedPawnIds(params: {
    existingPawnIds: string[]
    activeIncomingPawnIds: string[]
}): string[] {
    const incomingPawnIds = new Set(params.activeIncomingPawnIds)

    return params.existingPawnIds.filter((pawnId) => !incomingPawnIds.has(pawnId))
}
