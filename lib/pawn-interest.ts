export type PromoType = "โปร 2%" | "โปรแสน (1.5%)"
export type TransactionType = "ต่อดอก" | "ไถ่ของ"
export type InterestMode =
    | "monthlyPromo"
    | "weeklyOnePercent"
    | "penaltyThreePercent"
    | "blocked"

export interface PawnInterestInput {
    startDate: string
    currentDate: string
    loanAmount: number
    promoType: PromoType
    transactionType: TransactionType
}

export interface PawnInterestResult {
    mode: InterestMode
    rate: number
    rateLabel: string
    method: string
    status: string
    blockedTitle?: string
    blockedMessage?: string
    interestAmount: number | null
    monthCount: number
    actualMonthCount: number
    displayedOverdueDays: number
    latestBoundary: string
    nextBoundary: string
    contractExpiryDate: string
    overdueFromLatestBoundary: number
    overdueFromContractExpiry: number
    formulaText: string
}

const PROMO_RATES: Record<PromoType, number> = {
    "โปร 2%": 0.02,
    "โปรแสน (1.5%)": 0.015,
}

const MS_PER_DAY = 24 * 60 * 60 * 1000
const CONTRACT_DURATION_MONTHS = 3

function findLastDayOfMonth(year: number, monthIndex: number): number {
    return new Date(year, monthIndex + 1, 0).getDate()
}

function normalizeDate(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function addAnniversaryMonths(startDate: Date, monthsToAdd: number): Date {
    const start = normalizeDate(startDate)
    const targetMonthNumber = start.getMonth() + monthsToAdd
    const targetYear = start.getFullYear() + Math.floor(targetMonthNumber / 12)
    const targetMonth = ((targetMonthNumber % 12) + 12) % 12
    const targetDay = Math.min(
        start.getDate(),
        findLastDayOfMonth(targetYear, targetMonth)
    )

    return new Date(targetYear, targetMonth, targetDay)
}

function compareDates(a: Date, b: Date): number {
    const dateA = normalizeDate(a).getTime()
    const dateB = normalizeDate(b).getTime()

    if (dateA === dateB) return 0
    return dateA > dateB ? 1 : -1
}

function isSameDate(a: Date, b: Date): boolean {
    return compareDates(a, b) === 0
}

function getCalendarDayValue(date: Date): number {
    const normalizedDate = normalizeDate(date)

    return Date.UTC(
        normalizedDate.getFullYear(),
        normalizedDate.getMonth(),
        normalizedDate.getDate()
    )
}

function daysBetween(fromDate: Date, toDate: Date): number {
    return Math.round(
        (getCalendarDayValue(toDate) - getCalendarDayValue(fromDate)) /
            MS_PER_DAY
    )
}

function calculateMonthlyBoundaries(startDate: Date, currentDate: Date) {
    const start = normalizeDate(startDate)
    const current = normalizeDate(currentDate)

    let latestBoundaryIndex = 0
    let nextBoundary = addAnniversaryMonths(start, 1)

    while (compareDates(nextBoundary, current) <= 0) {
        latestBoundaryIndex += 1
        nextBoundary = addAnniversaryMonths(start, latestBoundaryIndex + 1)
    }

    return {
        latestBoundary: addAnniversaryMonths(start, latestBoundaryIndex),
        nextBoundary,
        latestBoundaryIndex,
    }
}

function calculateStartedMonthCount(
    currentDate: Date,
    boundaries: ReturnType<typeof calculateMonthlyBoundaries>
): number {
    const current = normalizeDate(currentDate)
    const isOnBoundary = isSameDate(current, boundaries.latestBoundary)

    return isOnBoundary
        ? boundaries.latestBoundaryIndex
        : boundaries.latestBoundaryIndex + 1
}

function calculateContractExpiry(startDate: Date): Date {
    return addAnniversaryMonths(startDate, CONTRACT_DURATION_MONTHS)
}

function calculateOverdueDays(fromDate: Date, toDate: Date): number {
    return Math.max(0, daysBetween(fromDate, toDate))
}

function formatPercent(rate: number): string {
    const percent = rate * 100
    return `${Number.isInteger(percent) ? percent : percent.toFixed(1)}%`
}

function formatIntegerBaht(value: number): string {
    return new Intl.NumberFormat("th-TH", {
        maximumFractionDigits: 0,
    }).format(value)
}

function getContractStatus(overdueFromContractExpiry: number): string {
    if (overdueFromContractExpiry === 0) {
        return "ภายในระยะเวลา"
    }

    if (overdueFromContractExpiry <= 20) {
        return "เกินกำหนดไม่เกิน 20 วัน"
    }

    return "เกินกำหนด"
}

function determineInterestMode(params: {
    promoType: PromoType
    transactionType: TransactionType
    overdueFromLatestBoundary: number
    overdueFromContractExpiry: number
}) {
    const promoRate = PROMO_RATES[params.promoType]
    const promoRateLabel = `${formatPercent(promoRate)} ต่อเดือน`

    if (
        params.transactionType === "ไถ่ของ" &&
        params.overdueFromContractExpiry > 20
    ) {
        return {
            mode: "blocked" as const,
            rate: 0,
            rateLabel: "-",
            method: "ไม่สามารถไถ่ได้",
            status: "ของหลุดสิทธิ์",
            blockedTitle: "ไม่สามารถไถ่ได้",
            blockedMessage: "เกินระยะเวลาที่กำหนด ของหลุดสิทธิ์แล้ว",
        }
    }

    if (
        params.transactionType === "ไถ่ของ" &&
        params.overdueFromLatestBoundary > 0 &&
        params.overdueFromLatestBoundary <= 7
    ) {
        return {
            mode: "weeklyOnePercent" as const,
            rate: 0.01,
            rateLabel: `${formatPercent(promoRate)} ต่อเดือน + 1%`,
            method: `คิดเดือนจริง โปร ${formatPercent(promoRate)} + รายสัปดาห์ 1%`,
            status: getContractStatus(params.overdueFromContractExpiry),
        }
    }

    if (
        params.transactionType === "ต่อดอก" &&
        params.overdueFromContractExpiry > 20
    ) {
        return {
            mode: "penaltyThreePercent" as const,
            rate: 0.03,
            rateLabel: "3% ต่อเดือน",
            method: "เกินกำหนด ใช้อัตรา 3%",
            status: "เกินกำหนด",
        }
    }

    return {
        mode: "monthlyPromo" as const,
        rate: promoRate,
        rateLabel: promoRateLabel,
        method:
            params.overdueFromLatestBoundary > 0
                ? `ปัดเต็มเดือน โปร ${formatPercent(promoRate)}`
                : `คิดเดือนจริง โปร ${formatPercent(promoRate)}`,
        status: getContractStatus(params.overdueFromContractExpiry),
    }
}

function calculateInterestAmount(params: {
    loanAmount: number
    monthCount: number
    actualMonthCount: number
    promoRate: number
    mode: InterestMode
    rate: number
}): number | null {
    if (params.mode === "blocked") {
        return null
    }

    if (params.mode === "weeklyOnePercent") {
        return Math.ceil(
            params.loanAmount * params.actualMonthCount * params.promoRate +
                params.loanAmount * 0.01
        )
    }

    return Math.ceil(params.loanAmount * params.rate * params.monthCount)
}

function buildFormulaText(params: {
    loanAmount: number
    monthCount: number
    actualMonthCount: number
    promoRate: number
    mode: InterestMode
    rate: number
}): string {
    if (params.mode === "blocked") {
        return "ไม่มีการคำนวณดอกเบี้ย"
    }

    if (params.mode === "weeklyOnePercent") {
        return `${formatIntegerBaht(params.loanAmount)} × ${formatPercent(
            params.promoRate
        )} × ${params.actualMonthCount} เดือน + ${formatIntegerBaht(
            params.loanAmount
        )} × 1%`
    }

    return `${formatIntegerBaht(params.loanAmount)} × ${formatPercent(
        params.rate
    )} × ${params.monthCount} เดือน`
}

function parseInputDate(value: string, fieldName: string): Date {
    const [year, month, day] = value.split("-").map(Number)

    if (!year || !month || !day) {
        throw new Error(`${fieldName} must be in YYYY-MM-DD format`)
    }

    const parsedDate = new Date(year, month - 1, day)
    if (
        parsedDate.getFullYear() !== year ||
        parsedDate.getMonth() !== month - 1 ||
        parsedDate.getDate() !== day
    ) {
        throw new Error(`${fieldName} must be a valid date`)
    }

    return parsedDate
}

function formatOutputDate(date: Date): string {
    const year = String(date.getFullYear())
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
}

export function calculatePawnInterest(
    input: PawnInterestInput
): PawnInterestResult {
    const startDate = parseInputDate(input.startDate, "startDate")
    const currentDate = parseInputDate(input.currentDate, "currentDate")

    if (input.loanAmount <= 0) {
        throw new Error("loanAmount must be greater than 0")
    }

    if (compareDates(currentDate, startDate) < 0) {
        throw new Error("currentDate must not be earlier than startDate")
    }

    const boundaries = calculateMonthlyBoundaries(startDate, currentDate)
    const monthCount = calculateStartedMonthCount(currentDate, boundaries)
    const actualMonthCount = boundaries.latestBoundaryIndex
    const contractExpiryDate = calculateContractExpiry(startDate)
    const overdueFromLatestBoundary = calculateOverdueDays(
        boundaries.latestBoundary,
        currentDate
    )
    const overdueFromContractExpiry =
        compareDates(currentDate, contractExpiryDate) > 0
            ? calculateOverdueDays(contractExpiryDate, currentDate)
            : 0

    const modeDetails = determineInterestMode({
        promoType: input.promoType,
        transactionType: input.transactionType,
        overdueFromLatestBoundary,
        overdueFromContractExpiry,
    })

    const interestAmount = calculateInterestAmount({
        loanAmount: input.loanAmount,
        monthCount,
        actualMonthCount,
        promoRate: PROMO_RATES[input.promoType],
        mode: modeDetails.mode,
        rate: modeDetails.rate,
    })

    return {
        ...modeDetails,
        interestAmount,
        monthCount,
        actualMonthCount,
        displayedOverdueDays:
            input.transactionType === "ต่อดอก" && overdueFromContractExpiry > 0
                ? overdueFromContractExpiry
                : overdueFromLatestBoundary,
        latestBoundary: formatOutputDate(boundaries.latestBoundary),
        nextBoundary: formatOutputDate(boundaries.nextBoundary),
        contractExpiryDate: formatOutputDate(contractExpiryDate),
        overdueFromLatestBoundary,
        overdueFromContractExpiry,
        formulaText: buildFormulaText({
            loanAmount: input.loanAmount,
            monthCount,
            actualMonthCount,
            promoRate: PROMO_RATES[input.promoType],
            mode: modeDetails.mode,
            rate: modeDetails.rate,
        }),
    }
}
