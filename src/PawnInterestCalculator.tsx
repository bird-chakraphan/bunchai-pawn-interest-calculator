import * as React from "react"
import { addPropertyControls, ControlType } from "framer"

type PromoType = "โปร 2%" | "โปรแสน (1.5%)"
type TransactionType = "ต่อดอก" | "ไถ่ของ"
type InterestMode = "monthlyPromo" | "weeklyOnePercent" | "penaltyThreePercent" | "blocked"
type DatePickerStep = "year" | "month" | "day"

interface PawnInterestCalculatorProps {
    backgroundColor: string
    cardColor: string
    fieldColor: string
    accentColor: string
    textColor: string
    mutedTextColor: string
    borderColor: string
    borderRadius: number
    fontSize: number
    fontControl: React.CSSProperties
    spacing: number
    titleLabel: string
    subtitleLabel: string
    startDateLabel: string
    loanAmountLabel: string
    loanAmountPlaceholder: string
    promoLabel: string
    transactionLabel: string
    extendLabel: string
    redeemLabel: string
    extendResultTitleLabel: string
    redeemResultTitleLabel: string
    principalResultLabel: string
    interestResultLabel: string
    totalDurationResultLabel: string
    calculationResultLabel: string
    methodResultLabel: string
    statusResultLabel: string
    redeemStatusResultLabel: string
    todayTextLabel: string
}

interface MonthlyBoundaries {
    latestBoundary: Date
    nextBoundary: Date
    latestBoundaryIndex: number
}

interface InterestModeDetails {
    mode: InterestMode
    rate: number
    rateLabel: string
    method: string
    status: string
    blockedTitle?: string
    blockedMessage?: string
}

interface CalculationResult extends InterestModeDetails {
    interestAmount: number | null
    monthCount: number
    actualMonthCount: number
    displayedOverdueDays: number
    latestBoundary: Date
    nextBoundary: Date
    contractExpiryDate: Date
    overdueFromLatestBoundary: number
    overdueFromContractExpiry: number
    formulaText: string
}

interface ExtendOptionEntry {
    title: string
    detail: string
    coverage?: string
    warning?: string
}

const PROMO_RATES: Record<PromoType, number> = {
    "โปร 2%": 0.02,
    "โปรแสน (1.5%)": 0.015,
}

const PROMO_OPTIONS: PromoType[] = ["โปร 2%", "โปรแสน (1.5%)"]
const PROMO_DISPLAY_LABELS: Record<PromoType, string> = {
    "โปร 2%": "โปร 2%",
    "โปรแสน (1.5%)": "โปรแสน",
}
const TRANSACTION_OPTIONS: TransactionType[] = ["ต่อดอก", "ไถ่ของ"]
const MS_PER_DAY = 24 * 60 * 60 * 1000
const BUDDHIST_YEAR_OFFSET = 543
const CONTRACT_DURATION_MONTHS = 3
const RETRO_EXTEND_WINDOW_DAYS = 7
const CONTRACT_GRACE_DAYS = 20
const DATE_PICKER_YEAR_RANGE = 2
const THAI_MONTH_LABELS = [
    "ม.ค.",
    "ก.พ.",
    "มี.ค.",
    "เม.ย.",
    "พ.ค.",
    "มิ.ย.",
    "ก.ค.",
    "ส.ค.",
    "ก.ย.",
    "ต.ค.",
    "พ.ย.",
    "ธ.ค.",
]

const defaultPawnInterestCalculatorProps: PawnInterestCalculatorProps = {
    backgroundColor: "#760608",
    cardColor: "#87090A",
    fieldColor: "#5B1D0C",
    accentColor: "#F3C94E",
    textColor: "#FFF7E6",
    mutedTextColor: "#E8CBA2",
    borderColor: "#D8AA34",
    borderRadius: 18,
    fontSize: 18,
    fontControl: {},
    spacing: 24,
    titleLabel: "คำนวณดอกเบี้ยจำนำ",
    subtitleLabel: "คำนวณอัตโนมัติเมื่อกรอกข้อมูลครบ",
    startDateLabel: "วันเริ่ม / ต่อดอกล่าสุด",
    loanAmountLabel: "ยอดจำนำ",
    loanAmountPlaceholder: "กรอกยอดจำนำ",
    promoLabel: "โปรโมชัน",
    transactionLabel: "รายการ",
    extendLabel: "ต่อดอก",
    redeemLabel: "ไถ่ของ",
    extendResultTitleLabel: "ดอกเบี้ยที่ต้องชำระในการต่อดอก",
    redeemResultTitleLabel: "เงินต้นและดอกเบี้ยที่ต้องชำระในการไถ่",
    principalResultLabel: "เงินต้น",
    interestResultLabel: "ดอกเบี้ย",
    totalDurationResultLabel: "ระยะเวลาทั้งสิ้น",
    calculationResultLabel: "คำนวณ",
    methodResultLabel: "วิธีคิดดอก",
    statusResultLabel: "สถานะสัญญา",
    redeemStatusResultLabel: "สถานะไถ่ของ",
    todayTextLabel: "คำนวณตามวันที่วันนี้ วันที่",
}

export function findLastDayOfMonth(year: number, monthIndex: number): number {
    return new Date(year, monthIndex + 1, 0).getDate()
}

export function normalizeDate(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function addAnniversaryMonths(startDate: Date, monthsToAdd: number): Date {
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

export function calculateMonthlyBoundaries(
    startDate: Date,
    currentDate: Date
): MonthlyBoundaries {
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

export function calculateStartedMonthCount(
    currentDate: Date,
    boundaries: MonthlyBoundaries
): number {
    const current = normalizeDate(currentDate)
    const isOnBoundary = isSameDate(current, boundaries.latestBoundary)

    return isOnBoundary
        ? boundaries.latestBoundaryIndex
        : boundaries.latestBoundaryIndex + 1
}

export function calculateContractExpiry(startDate: Date): Date {
    return addAnniversaryMonths(startDate, CONTRACT_DURATION_MONTHS)
}

export function calculateOverdueDays(fromDate: Date, toDate: Date): number {
    return Math.max(0, daysBetween(fromDate, toDate))
}

export function determineInterestMode(params: {
    promoType: PromoType
    transactionType: TransactionType
    overdueFromLatestBoundary: number
    overdueFromContractExpiry: number
}): InterestModeDetails {
    const promoRate = PROMO_RATES[params.promoType]
    const promoRateLabel = `${formatPercent(promoRate)} ต่อเดือน`

    if (
        params.transactionType === "ไถ่ของ" &&
        params.overdueFromContractExpiry > 20
    ) {
        return {
            mode: "blocked",
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
            mode: "weeklyOnePercent",
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
            mode: "penaltyThreePercent",
            rate: 0.03,
            rateLabel: "3% ต่อเดือน",
            method: "เกินกำหนด ใช้อัตรา 3%",
            status: "เกินกำหนด",
        }
    }

    return {
        mode: "monthlyPromo",
        rate: promoRate,
        rateLabel: promoRateLabel,
        method:
            params.overdueFromLatestBoundary > 0
                ? `ปัดเต็มเดือน โปร ${formatPercent(promoRate)}`
                : `คิดเดือนจริง โปร ${formatPercent(promoRate)}`,
        status: getContractStatus(params.overdueFromContractExpiry),
    }
}

export function calculateInterestAmount(params: {
    loanAmount: number
    monthCount: number
    actualMonthCount: number
    promoRate: number
    modeDetails: InterestModeDetails
}): number | null {
    if (params.modeDetails.mode === "blocked") {
        return null
    }

    if (params.modeDetails.mode === "weeklyOnePercent") {
        return Math.ceil(
            params.loanAmount * params.actualMonthCount * params.promoRate +
                params.loanAmount * 0.01
        )
    }

    return Math.ceil(
        params.loanAmount * params.modeDetails.rate * params.monthCount
    )
}

function calculatePawnInterest(params: {
    startDate: Date
    currentDate: Date
    loanAmount: number
    promoType: PromoType
    transactionType: TransactionType
}): CalculationResult {
    const boundaries = calculateMonthlyBoundaries(
        params.startDate,
        params.currentDate
    )
    const monthCount = calculateStartedMonthCount(
        params.currentDate,
        boundaries
    )
    const actualMonthCount = boundaries.latestBoundaryIndex
    const contractExpiryDate = calculateContractExpiry(params.startDate)
    const overdueFromLatestBoundary = calculateOverdueDays(
        boundaries.latestBoundary,
        params.currentDate
    )
    const overdueFromContractExpiry =
        compareDates(params.currentDate, contractExpiryDate) > 0
            ? calculateOverdueDays(contractExpiryDate, params.currentDate)
            : 0

    const modeDetails = determineInterestMode({
        promoType: params.promoType,
        transactionType: params.transactionType,
        overdueFromLatestBoundary,
        overdueFromContractExpiry,
    })
    const interestAmount = calculateInterestAmount({
        loanAmount: params.loanAmount,
        monthCount,
        actualMonthCount,
        promoRate: PROMO_RATES[params.promoType],
        modeDetails,
    })

    return {
        ...modeDetails,
        interestAmount,
        monthCount,
        actualMonthCount,
        displayedOverdueDays:
            params.transactionType === "ต่อดอก" && overdueFromContractExpiry > 0
                ? overdueFromContractExpiry
                : overdueFromLatestBoundary,
        latestBoundary: boundaries.latestBoundary,
        nextBoundary: boundaries.nextBoundary,
        contractExpiryDate,
        overdueFromLatestBoundary,
        overdueFromContractExpiry,
        formulaText: buildFormulaText({
            loanAmount: params.loanAmount,
            monthCount,
            actualMonthCount,
            promoRate: PROMO_RATES[params.promoType],
            modeDetails,
        }),
    }
}

function buildFormulaText(params: {
    loanAmount: number
    monthCount: number
    actualMonthCount: number
    promoRate: number
    modeDetails: InterestModeDetails
}): string {
    if (params.modeDetails.mode === "blocked") {
        return "ไม่มีการคำนวณดอกเบี้ย"
    }

    if (params.modeDetails.mode === "weeklyOnePercent") {
        return `${formatIntegerBaht(params.loanAmount)} × ${formatPercent(
            params.promoRate
        )} × ${params.actualMonthCount} เดือน + ${formatIntegerBaht(
            params.loanAmount
        )} × 1%`
    }

    return `${formatIntegerBaht(params.loanAmount)} × ${formatPercent(
        params.modeDetails.rate
    )} × ${params.monthCount} เดือน`
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

function compareDates(a: Date, b: Date): number {
    const dateA = normalizeDate(a).getTime()
    const dateB = normalizeDate(b).getTime()

    if (dateA === dateB) return 0
    return dateA > dateB ? 1 : -1
}

function addDays(date: Date, daysToAdd: number): Date {
    return normalizeDate(
        new Date(date.getFullYear(), date.getMonth(), date.getDate() + daysToAdd)
    )
}

function isSameDate(a: Date, b: Date): boolean {
    return compareDates(a, b) === 0
}

function daysBetween(fromDate: Date, toDate: Date): number {
    return Math.round(
        (getCalendarDayValue(toDate) - getCalendarDayValue(fromDate)) /
            MS_PER_DAY
    )
}

function getCalendarDayValue(date: Date): number {
    const normalizedDate = normalizeDate(date)

    return Date.UTC(
        normalizedDate.getFullYear(),
        normalizedDate.getMonth(),
        normalizedDate.getDate()
    )
}

function parseDateInput(value: string): Date | null {
    if (!value) return null

    const [year, month, day] = value.split("-").map(Number)
    if (!year || !month || !day) return null

    const parsedDate = new Date(year, month - 1, day)
    const isValid =
        parsedDate.getFullYear() === year &&
        parsedDate.getMonth() === month - 1 &&
        parsedDate.getDate() === day

    return isValid ? parsedDate : null
}

function formatDateInputValue(date: Date): string {
    const year = String(date.getFullYear())
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")

    return `${year}-${month}-${day}`
}

function getToday(): Date {
    return normalizeDate(new Date())
}

function formatDate(date: Date): string {
    const day = String(date.getDate())
    const month = THAI_MONTH_LABELS[date.getMonth()]
    const year = String(date.getFullYear() + BUDDHIST_YEAR_OFFSET)

    return `${day} ${month} ${year}`
}

function formatBuddhistYear(year: number): string {
    return String(year + BUDDHIST_YEAR_OFFSET)
}

function formatMonthYear(date: Date): string {
    return `${THAI_MONTH_LABELS[date.getMonth()]} ${formatBuddhistYear(
        date.getFullYear()
    )}`
}

function createSafeDate(year: number, monthIndex: number, day: number): Date {
    return new Date(
        year,
        monthIndex,
        Math.min(day, findLastDayOfMonth(year, monthIndex))
    )
}

function clampDateToToday(date: Date, currentDate: Date): Date {
    return compareDates(date, currentDate) > 0
        ? normalizeDate(currentDate)
        : normalizeDate(date)
}

function getDatePickerYears(currentDate: Date, selectedDate: Date): number[] {
    const currentYear = currentDate.getFullYear()
    const selectedYear = selectedDate.getFullYear()
    const years = new Set<number>()

    for (let index = 0; index <= DATE_PICKER_YEAR_RANGE; index += 1) {
        years.add(currentYear - index)
    }

    years.add(selectedYear)

    return Array.from(years).sort((a, b) => b - a)
}

function formatIntegerBaht(value: number): string {
    return new Intl.NumberFormat("th-TH", {
        maximumFractionDigits: 0,
    }).format(value)
}

function formatInterestBaht(value: number): string {
    return new Intl.NumberFormat("th-TH", {
        maximumFractionDigits: 0,
    }).format(value)
}

function formatPercent(rate: number): string {
    const percent = rate * 100
    return `${Number.isInteger(percent) ? percent : percent.toFixed(1)}%`
}

function getLoanAmountFromInput(value: string): number {
    const digitsOnly = value.replace(/[^\d]/g, "")
    return digitsOnly ? Number(digitsOnly) : 0
}

function getValidationMessages(params: {
    startDate: Date | null
    loanInput: string
    loanAmount: number
    currentDate: Date
}): string[] {
    const messages: string[] = []

    if (!params.startDate) {
        messages.push("กรุณาเลือกวันเริ่ม")
    }

    if (!params.loanInput.trim()) {
        messages.push("กรุณากรอกยอดจำนำ")
    } else if (params.loanAmount <= 0) {
        messages.push("ยอดจำนำต้องมากกว่า 0")
    }

    if (
        params.startDate &&
        compareDates(params.currentDate, params.startDate) < 0
    ) {
        messages.push("วันที่วันนี้ต้องไม่ก่อนวันเริ่ม")
    }

    return messages
}

function buildExtendOptionEntries(params: {
    startDate: Date
    latestBoundary: Date
    actualMonthCount: number
    overdueFromLatestBoundary: number
    contractExpiryDate: Date
    overdueFromContractExpiry: number
    currentMonthCount: number
    loanAmount: number
    promoType: PromoType
}): ExtendOptionEntry[] {
    const promoRate = PROMO_RATES[params.promoType]
    const promoLabel = `โปร ${formatPercent(promoRate)}`
    const retroDeadline = addDays(params.latestBoundary, RETRO_EXTEND_WINDOW_DAYS)
    const promoGraceDeadline = addDays(
        params.contractExpiryDate,
        CONTRACT_GRACE_DAYS
    )
    const penaltyDeadline = addAnniversaryMonths(
        params.startDate,
        CONTRACT_DURATION_MONTHS + 1
    )
    const contractInterest = Math.ceil(
        params.loanAmount * promoRate * CONTRACT_DURATION_MONTHS
    )
    const nextPeriodMonthCount = CONTRACT_DURATION_MONTHS + 1
    const graceInterest = Math.ceil(
        params.loanAmount * promoRate * nextPeriodMonthCount
    )
    const penaltyInterest = Math.ceil(
        params.loanAmount * 0.03 * nextPeriodMonthCount
    )
    const retroInterest = Math.ceil(
        params.loanAmount * promoRate * params.actualMonthCount
    )
    const entries: ExtendOptionEntry[] = []

    if (
        params.overdueFromLatestBoundary >= 1 &&
        params.overdueFromLatestBoundary <= RETRO_EXTEND_WINDOW_DAYS
    ) {
        entries.push({
            title: `ภายในวันที่ ${formatDate(retroDeadline)}`,
            coverage: `ต่อดอกย้อนหลัง โดยชำระดอกถึง ${formatDate(
                params.latestBoundary
            )}`,
            detail: `${promoLabel} × ${params.actualMonthCount} เดือน ดอกเบี้ย ${formatInterestBaht(
                retroInterest
            )} บาท`,
            warning: "หลังจากนี้จะไม่สามารถต่อดอกย้อนหลังได้",
        })
    }

    if (params.currentMonthCount < CONTRACT_DURATION_MONTHS) {
        for (
            let monthCount = params.currentMonthCount + 1;
            monthCount <= CONTRACT_DURATION_MONTHS;
            monthCount += 1
        ) {
            const deadline = addAnniversaryMonths(params.startDate, monthCount)
            const interestAmount = Math.ceil(
                params.loanAmount * promoRate * monthCount
            )

            entries.push({
                title: `ภายในวันที่ ${formatDate(deadline)}`,
                detail: `${promoLabel} × ${monthCount} เดือน ดอกเบี้ย ${formatInterestBaht(
                    interestAmount
                )} บาท`,
                warning:
                    monthCount === CONTRACT_DURATION_MONTHS
                        ? "หลังจากนี้จะหมดอายุสัญญา"
                        : undefined,
            })
        }
    } else {
        entries.push({
            title: `ภายในวันที่ ${formatDate(params.contractExpiryDate)}`,
            detail: `${promoLabel} × ${CONTRACT_DURATION_MONTHS} เดือน ดอกเบี้ย ${formatInterestBaht(
                contractInterest
            )} บาท`,
            warning: "หลังจากนี้จะหมดอายุสัญญา",
        })
    }

    entries.push(
        {
            title: `ภายในวันที่ ${formatDate(promoGraceDeadline)}`,
            detail: `${promoLabel} × ${nextPeriodMonthCount} เดือน ดอกเบี้ย ${formatInterestBaht(
                graceInterest
            )} บาท`,
            warning: `หลังจากนี้จะหมดอายุสัญญาเกิน ${CONTRACT_GRACE_DAYS} วัน โปรโมชั่นจะกลายเป็น 3%`,
        },
        {
            title: `ภายในวันที่ ${formatDate(penaltyDeadline)}`,
            detail: `อัตรา 3% × ${nextPeriodMonthCount} เดือน ดอกเบี้ย ${formatInterestBaht(
                penaltyInterest
            )} บาท`,
        }
    )

    return entries
}

function buildRedeemOptionEntries(params: {
    startDate: Date
    latestBoundary: Date
    actualMonthCount: number
    overdueFromLatestBoundary: number
    loanAmount: number
    promoType: PromoType
}): ExtendOptionEntry[] {
    const promoRate = PROMO_RATES[params.promoType]
    const promoLabel = `โปร ${formatPercent(promoRate)}`
    const entries: ExtendOptionEntry[] = []

    if (
        params.overdueFromLatestBoundary >= 1 &&
        params.overdueFromLatestBoundary <= RETRO_EXTEND_WINDOW_DAYS &&
        params.actualMonthCount < CONTRACT_DURATION_MONTHS
    ) {
        const weeklyDeadline = addDays(
            params.latestBoundary,
            RETRO_EXTEND_WINDOW_DAYS
        )
        const weeklyInterest = Math.ceil(
            params.loanAmount * promoRate * params.actualMonthCount +
                params.loanAmount * 0.01
        )
        const weeklyTotalRedeem = params.loanAmount + weeklyInterest

        entries.push({
            title: `ภายในวันที่ ${formatDate(weeklyDeadline)}`,
            detail:
                params.actualMonthCount === 0
                    ? `อัตรา 1 สัปดาห์ ดอกเบี้ย ${formatInterestBaht(
                          weeklyInterest
                      )} บาท · รวมไถ่ ${formatInterestBaht(
                          weeklyTotalRedeem
                      )} บาท`
                    : `${promoLabel} × ${params.actualMonthCount} เดือน + 1 สัปดาห์ ดอกเบี้ย ${formatInterestBaht(
                          weeklyInterest
                      )} บาท · รวมไถ่ ${formatInterestBaht(
                          weeklyTotalRedeem
                      )} บาท`,
        })
    }

    for (
        let monthCount = params.actualMonthCount + 1;
        monthCount <= CONTRACT_DURATION_MONTHS;
        monthCount += 1
    ) {
        const boundaryDate = addAnniversaryMonths(params.startDate, monthCount)
        const monthlyInterest = Math.ceil(
            params.loanAmount * promoRate * monthCount
        )
        const monthlyTotalRedeem = params.loanAmount + monthlyInterest

        entries.push({
            title: `ภายในวันที่ ${formatDate(boundaryDate)}`,
            detail: `${promoLabel} × ${monthCount} เดือน ดอกเบี้ย ${formatInterestBaht(
                monthlyInterest
            )} บาท · รวมไถ่ ${formatInterestBaht(monthlyTotalRedeem)} บาท`,
            warning:
                monthCount === CONTRACT_DURATION_MONTHS
                    ? "หลังจากนี้จะหมดอายุสัญญา ไม่สามารถไถ่ได้"
                    : undefined,
        })

        if (monthCount < CONTRACT_DURATION_MONTHS) {
            const weeklyDeadline = addDays(
                boundaryDate,
                RETRO_EXTEND_WINDOW_DAYS
            )
            const weeklyInterest = Math.ceil(
                params.loanAmount * promoRate * monthCount +
                    params.loanAmount * 0.01
            )
            const weeklyTotalRedeem = params.loanAmount + weeklyInterest

            entries.push({
                title: `ภายในวันที่ ${formatDate(weeklyDeadline)}`,
                detail: `${promoLabel} × ${monthCount} เดือน + 1 สัปดาห์ ดอกเบี้ย ${formatInterestBaht(
                    weeklyInterest
                )} บาท · รวมไถ่ ${formatInterestBaht(
                    weeklyTotalRedeem
                )} บาท`,
            })
        }
    }

    return entries
}

function ResultRow(props: {
    label: string
    value: React.ReactNode
    highlight?: boolean
    separated?: boolean
}): React.ReactElement {
    return (
        <div
            className={`pawn-result-row ${
                props.separated ? "is-separated" : ""
            }`}
        >
            <span>{props.label}</span>
            <span className={props.highlight ? "is-highlight" : undefined}>
                {props.value}
            </span>
        </div>
    )
}

function formatWeeklyAdditionLineBreak(value: string): React.ReactNode {
    const hasWeeklyAddition =
        value.includes("รายสัปดาห์ 1%") || value.includes("× 1%")
    const markerIndex = value.lastIndexOf(" + ")

    if (!hasWeeklyAddition || markerIndex === -1) {
        return value
    }

    return (
        <>
            {value.slice(0, markerIndex)}
            <span className="pawn-weekly-addition">
                {value.slice(markerIndex + 1)}
            </span>
        </>
    )
}

function normalizeInlineLabel(label: string): string {
    return label.replace(/\s*\/\s*/g, " / ").replace(/\s+/g, " ").trim()
}

function renderResponsiveSlashLabel(label: string): React.ReactElement {
    const normalizedLabel = normalizeInlineLabel(label)
    const [firstPart, ...restParts] = normalizedLabel.split(" / ")

    if (!firstPart || restParts.length === 0) {
        return <span>{normalizedLabel}</span>
    }

    return (
        <span>
            <span className="pawn-start-date-part">{firstPart}</span>{" "}
            <span className="pawn-start-date-part">
                / {restParts.join(" / ")}
            </span>
        </span>
    )
}

export default function PawnInterestCalculator(
    props: Partial<PawnInterestCalculatorProps> = {}
): React.ReactElement {
    const {
        backgroundColor,
        cardColor,
        fieldColor,
        accentColor,
        textColor,
        mutedTextColor,
        borderColor,
        borderRadius,
        fontSize,
        fontControl,
        spacing,
        titleLabel,
        subtitleLabel,
        startDateLabel,
        loanAmountLabel,
        loanAmountPlaceholder,
        promoLabel,
        transactionLabel,
        extendLabel,
        redeemLabel,
        extendResultTitleLabel,
        redeemResultTitleLabel,
        principalResultLabel,
        interestResultLabel,
        totalDurationResultLabel,
        calculationResultLabel,
        methodResultLabel,
        statusResultLabel,
        redeemStatusResultLabel,
        todayTextLabel,
    } = { ...defaultPawnInterestCalculatorProps, ...props }

    const [currentDate, setCurrentDate] = React.useState(() => getToday())
    const [startDateInput, setStartDateInput] = React.useState("")
    const [loanInput, setLoanInput] = React.useState("")
    const [promoType, setPromoType] = React.useState<PromoType>("โปร 2%")
    const [transactionType, setTransactionType] =
        React.useState<TransactionType>("ต่อดอก")
    const [isCalculating, setIsCalculating] = React.useState(false)
    const [calculation, setCalculation] =
        React.useState<CalculationResult | null>(null)
    const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false)
    const [datePickerStep, setDatePickerStep] =
        React.useState<DatePickerStep>("year")
    const [datePickerDraft, setDatePickerDraft] = React.useState(() =>
        getToday()
    )
    const datePickerRef = React.useRef<HTMLDivElement | null>(null)
    const loanInputRef = React.useRef<HTMLInputElement | null>(null)

    const startDate = React.useMemo(
        () => parseDateInput(startDateInput),
        [startDateInput]
    )
    const loanAmount = React.useMemo(
        () => getLoanAmountFromInput(loanInput),
        [loanInput]
    )
    const validationMessages = React.useMemo(
        () =>
            getValidationMessages({
                startDate,
                loanInput,
                loanAmount,
                currentDate,
            }),
        [startDate, loanInput, loanAmount, currentDate]
    )
    const isReady = validationMessages.length === 0 && startDate !== null
    const activeResultTitleLabel =
        transactionType === "ต่อดอก"
            ? extendResultTitleLabel
            : redeemResultTitleLabel
    const resultMainAmount =
        transactionType === "ไถ่ของ" && calculation?.interestAmount !== null
            ? (calculation?.interestAmount ?? 0) + loanAmount
            : calculation?.interestAmount ?? 0
    const datePickerYears = React.useMemo(
        () => getDatePickerYears(currentDate, datePickerDraft),
        [currentDate, datePickerDraft]
    )
    const optionEntries = React.useMemo(() => {
        if (!startDate || !calculation || transactionType !== "ต่อดอก") {
            if (!startDate || !calculation || transactionType !== "ไถ่ของ") {
                return []
            }

            return buildRedeemOptionEntries({
                startDate,
                latestBoundary: calculation.latestBoundary,
                actualMonthCount: calculation.actualMonthCount,
                overdueFromLatestBoundary: calculation.overdueFromLatestBoundary,
                loanAmount,
                promoType,
            })
        }

        return buildExtendOptionEntries({
            startDate,
            latestBoundary: calculation.latestBoundary,
            actualMonthCount: calculation.actualMonthCount,
            overdueFromLatestBoundary: calculation.overdueFromLatestBoundary,
            contractExpiryDate: calculation.contractExpiryDate,
            overdueFromContractExpiry: calculation.overdueFromContractExpiry,
            currentMonthCount: calculation.monthCount,
            loanAmount,
            promoType,
        })
    }, [calculation, loanAmount, promoType, startDate, transactionType])
    const datePickerDayCount = findLastDayOfMonth(
        datePickerDraft.getFullYear(),
        datePickerDraft.getMonth()
    )

    React.useEffect(() => {
        const timer = window.setInterval(() => {
            setCurrentDate((previousDate) => {
                const nextDate = getToday()
                return isSameDate(previousDate, nextDate)
                    ? previousDate
                    : nextDate
            })
        }, 60 * 1000)

        return () => window.clearInterval(timer)
    }, [])

    React.useEffect(() => {
        if (!isDatePickerOpen) return

        const handlePointerDown = (event: MouseEvent | TouchEvent) => {
            const target = event.target

            if (
                target instanceof Node &&
                !datePickerRef.current?.contains(target)
            ) {
                setIsDatePickerOpen(false)
            }
        }
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setIsDatePickerOpen(false)
            }
        }

        document.addEventListener("mousedown", handlePointerDown)
        document.addEventListener("touchstart", handlePointerDown)
        document.addEventListener("keydown", handleKeyDown)

        return () => {
            document.removeEventListener("mousedown", handlePointerDown)
            document.removeEventListener("touchstart", handlePointerDown)
            document.removeEventListener("keydown", handleKeyDown)
        }
    }, [isDatePickerOpen])

    React.useEffect(() => {
        if (!isReady || !startDate) {
            setCalculation(null)
            setIsCalculating(false)
            return
        }

        setIsCalculating(true)
        const timer = window.setTimeout(() => {
            setCalculation(
                calculatePawnInterest({
                    startDate,
                    currentDate,
                    loanAmount,
                    promoType,
                    transactionType,
                })
            )
            setIsCalculating(false)
        }, 180)

        return () => window.clearTimeout(timer)
    }, [isReady, startDate, currentDate, loanAmount, promoType, transactionType])

    const rootStyle = {
        "--pawn-bg": backgroundColor,
        "--pawn-card": cardColor,
        "--pawn-field": fieldColor,
        "--pawn-accent": accentColor,
        "--pawn-text": textColor,
        "--pawn-muted": mutedTextColor,
        "--pawn-border": borderColor,
        "--pawn-radius": `${borderRadius}px`,
        "--pawn-font-size": `${fontSize}px`,
        "--pawn-spacing": `${spacing}px`,
        ...fontControl,
    } as React.CSSProperties

    const handleLoanChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const digitsOnly = event.target.value.replace(/[^\d]/g, "")
        const nextLoanAmount = digitsOnly ? Number(digitsOnly) : 0
        setLoanInput(digitsOnly ? formatIntegerBaht(nextLoanAmount) : "")
        setPromoType(nextLoanAmount >= 100000 ? "โปรแสน (1.5%)" : "โปร 2%")
    }

    const handleLoanKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter") {
            event.currentTarget.blur()
        }
    }

    const updateStartDate = (nextDate: Date) => {
        setStartDateInput(
            formatDateInputValue(clampDateToToday(nextDate, currentDate))
        )
    }

    const openDatePicker = () => {
        setDatePickerDraft(startDate ?? currentDate)
        setDatePickerStep("year")
        setIsDatePickerOpen(true)
    }

    const handleDateTriggerClick = () => {
        if (isDatePickerOpen) {
            setIsDatePickerOpen(false)
            return
        }

        openDatePicker()
    }

    const selectDatePickerYear = (year: number) => {
        setDatePickerDraft((previousDate) =>
            clampDateToToday(
                createSafeDate(year, previousDate.getMonth(), previousDate.getDate()),
                currentDate
            )
        )
        setDatePickerStep("month")
    }

    const selectDatePickerMonth = (monthIndex: number) => {
        setDatePickerDraft((previousDate) =>
            clampDateToToday(
                createSafeDate(
                    previousDate.getFullYear(),
                    monthIndex,
                    previousDate.getDate()
                ),
                currentDate
            )
        )
        setDatePickerStep("day")
    }

    const selectDatePickerDay = (day: number) => {
        const nextDate = createSafeDate(
            datePickerDraft.getFullYear(),
            datePickerDraft.getMonth(),
            day
        )

        updateStartDate(nextDate)
        setDatePickerDraft(clampDateToToday(nextDate, currentDate))
        setIsDatePickerOpen(false)
        loanInputRef.current?.focus()
    }

    return (
        <section className="pawn-calculator" style={rootStyle}>
            <style>{componentStyles}</style>

            <div className="pawn-responsive-frame">
                <div className="pawn-layout">
                    <div className="pawn-card pawn-form-card">
                        <div className="pawn-field-row">
                            <label htmlFor="pawn-start-date">
                                {renderResponsiveSlashLabel(startDateLabel)}
                            </label>
                            <div
                                className={`pawn-date-picker ${
                                    isDatePickerOpen ? "is-open" : ""
                                }`}
                                ref={datePickerRef}
                            >
                                <button
                                    id="pawn-start-date"
                                    className="pawn-date-trigger"
                                    type="button"
                                    aria-haspopup="dialog"
                                    aria-expanded={isDatePickerOpen}
                                    aria-label={normalizeInlineLabel(
                                        startDateLabel
                                    )}
                                    onClick={handleDateTriggerClick}
                                >
                                    <span
                                        className={
                                            startDateInput
                                                ? "pawn-date-value"
                                                : "pawn-date-value is-placeholder"
                                        }
                                    >
                                        {startDate
                                            ? formatDate(startDate)
                                            : "วัน / เดือน / ปี"}
                                    </span>
                                    <span
                                        className="pawn-calendar-icon"
                                        aria-hidden
                                    >
                                        <svg
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path
                                                d="M7 3.75V6.25M17 3.75V6.25M4.75 9.25H19.25M6.5 5H17.5C18.6046 5 19.5 5.89543 19.5 7V17.5C19.5 18.6046 18.6046 19.5 17.5 19.5H6.5C5.39543 19.5 4.5 18.6046 4.5 17.5V7C4.5 5.89543 5.39543 5 6.5 5Z"
                                                stroke="currentColor"
                                                strokeWidth="1.8"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    </span>
                                </button>

                                {isDatePickerOpen ? (
                                    <div
                                        className="pawn-date-popover"
                                        role="dialog"
                                        aria-label="เลือกวันเริ่ม"
                                    >
                                        <div className="pawn-date-step-header">
                                            {datePickerStep !== "year" ? (
                                                <button
                                                    className="pawn-date-back-button"
                                                    type="button"
                                                    aria-label="ย้อนกลับ"
                                                    onClick={() =>
                                                        setDatePickerStep(
                                                            datePickerStep ===
                                                                "day"
                                                                ? "month"
                                                                : "year"
                                                        )
                                                    }
                                                >
                                                    ‹
                                                </button>
                                            ) : (
                                                <span aria-hidden />
                                            )}
                                            <span className="pawn-date-step-value">
                                                {datePickerStep === "year"
                                                    ? "เลือกปี"
                                                    : datePickerStep === "month"
                                                      ? `ปี ${formatBuddhistYear(
                                                            datePickerDraft.getFullYear()
                                                        )}`
                                                      : formatMonthYear(
                                                            datePickerDraft
                                                        )}
                                            </span>
                                            <span aria-hidden />
                                        </div>

                                        {datePickerStep === "year" ? (
                                            <div className="pawn-date-panel">
                                                <div className="pawn-date-year-options">
                                                    {datePickerYears.map(
                                                        (year) => {
                                                            const isSelected =
                                                                datePickerDraft.getFullYear() ===
                                                                year
                                                            const isDisabled =
                                                                year >
                                                                currentDate.getFullYear()

                                                            return (
                                                                <button
                                                                    key={year}
                                                                    type="button"
                                                                    className={
                                                                        isSelected
                                                                            ? "is-selected"
                                                                            : ""
                                                                    }
                                                                    disabled={
                                                                        isDisabled
                                                                    }
                                                                    onClick={() =>
                                                                        selectDatePickerYear(
                                                                            year
                                                                        )
                                                                    }
                                                                >
                                                                    {formatBuddhistYear(
                                                                        year
                                                                    )}
                                                                </button>
                                                            )
                                                        }
                                                    )}
                                                </div>
                                            </div>
                                        ) : null}

                                        {datePickerStep === "month" ? (
                                            <div className="pawn-date-panel">
                                                <div className="pawn-date-month-options">
                                                    {THAI_MONTH_LABELS.map(
                                                        (monthLabel, monthIndex) => {
                                                            const monthStart =
                                                                new Date(
                                                                    datePickerDraft.getFullYear(),
                                                                    monthIndex,
                                                                    1
                                                                )
                                                            const isSelected =
                                                                datePickerDraft.getMonth() ===
                                                                monthIndex
                                                            const isDisabled =
                                                                compareDates(
                                                                    monthStart,
                                                                    currentDate
                                                                ) > 0

                                                            return (
                                                                <button
                                                                    key={
                                                                        monthLabel
                                                                    }
                                                                    type="button"
                                                                    className={
                                                                        isSelected
                                                                            ? "is-selected"
                                                                            : ""
                                                                    }
                                                                    disabled={
                                                                        isDisabled
                                                                    }
                                                                    onClick={() =>
                                                                        selectDatePickerMonth(
                                                                            monthIndex
                                                                        )
                                                                    }
                                                                >
                                                                    {monthLabel}
                                                                </button>
                                                            )
                                                        }
                                                    )}
                                                </div>
                                            </div>
                                        ) : null}

                                        {datePickerStep === "day" ? (
                                            <div className="pawn-date-panel">
                                                <div className="pawn-date-day-options">
                                                    {Array.from(
                                                        {
                                                            length: datePickerDayCount,
                                                        },
                                                        (_, index) => {
                                                            const day = index + 1
                                                            const optionDate =
                                                                createSafeDate(
                                                                    datePickerDraft.getFullYear(),
                                                                    datePickerDraft.getMonth(),
                                                                    day
                                                                )
                                                            const isSelected =
                                                                datePickerDraft.getDate() ===
                                                                day
                                                            const isDisabled =
                                                                compareDates(
                                                                    optionDate,
                                                                    currentDate
                                                                ) > 0

                                                            return (
                                                                <button
                                                                    key={day}
                                                                    type="button"
                                                                    className={
                                                                        isSelected
                                                                            ? "is-selected"
                                                                            : ""
                                                                    }
                                                                    disabled={
                                                                        isDisabled
                                                                    }
                                                                    onClick={() =>
                                                                        selectDatePickerDay(
                                                                            day
                                                                        )
                                                                    }
                                                                >
                                                                    {day}
                                                                </button>
                                                            )
                                                        }
                                                    )}
                                                </div>
                                            </div>
                                        ) : null}
                                    </div>
                                ) : null}
                            </div>
                        </div>

                        <div className="pawn-field-row">
                            <label htmlFor="pawn-loan-amount">
                                <span>{loanAmountLabel}</span>
                            </label>
                            <div className="pawn-money-input">
                                <input
                                    ref={loanInputRef}
                                    id="pawn-loan-amount"
                                    className="pawn-control"
                                    type="tel"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    enterKeyHint="done"
                                    autoComplete="off"
                                    placeholder={loanAmountPlaceholder}
                                    value={loanInput}
                                    onChange={handleLoanChange}
                                    onKeyDown={handleLoanKeyDown}
                                    aria-label={loanAmountLabel}
                                />
                                <span>บาท</span>
                            </div>
                        </div>

                        <div className="pawn-field-row">
                            <label>
                                <span>{promoLabel}</span>
                            </label>
                            <div
                                className="pawn-segmented"
                                role="radiogroup"
                                aria-label={promoLabel}
                            >
                                {PROMO_OPTIONS.map((option) => {
                                    const isSelected = promoType === option

                                    return (
                                        <button
                                            key={option}
                                            type="button"
                                            className={
                                                isSelected ? "is-selected" : ""
                                            }
                                            role="radio"
                                            aria-checked={isSelected}
                                            onClick={() => setPromoType(option)}
                                        >
                                            {PROMO_DISPLAY_LABELS[option]}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        <div className="pawn-field-row pawn-field-row-last">
                            <label>
                                <span>{transactionLabel}</span>
                            </label>
                            <div
                                className="pawn-segmented"
                                role="radiogroup"
                                aria-label={transactionLabel}
                            >
                                {TRANSACTION_OPTIONS.map((option) => {
                                    const isSelected = transactionType === option
                                    const displayLabel =
                                        option === "ต่อดอก"
                                            ? extendLabel
                                            : redeemLabel

                                    return (
                                        <button
                                            key={option}
                                            type="button"
                                            className={
                                                isSelected ? "is-selected" : ""
                                            }
                                            role="radio"
                                            aria-checked={isSelected}
                                            onClick={() =>
                                                setTransactionType(option)
                                            }
                                        >
                                            {displayLabel}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="pawn-result-wrap">
                        <div
                            className={`pawn-card pawn-result-card ${
                                calculation?.mode === "blocked"
                                    ? "is-warning"
                                    : ""
                            }`}
                        >
                            {!isReady ? (
                                <div className="pawn-empty-state">
                                    <strong>กรอกข้อมูลให้ครบเพื่อคำนวณ</strong>
                                    {validationMessages.length > 0 ? (
                                        <div className="pawn-validation-list">
                                            {validationMessages.map((message) => (
                                                <span key={message}>
                                                    {message}
                                                </span>
                                            ))}
                                        </div>
                                    ) : null}
                                </div>
                            ) : isCalculating ? (
                                <div className="pawn-loading">
                                    <span>กำลังคำนวณ...</span>
                                </div>
                            ) : calculation?.mode === "blocked" ? (
                                <div className="pawn-warning-content">
                                    <span className="pawn-warning-kicker">
                                        {calculation.status}
                                    </span>
                                    <strong>{calculation.blockedTitle}</strong>
                                    <p>{calculation.blockedMessage}</p>
                                </div>
                            ) : calculation ? (
                                <div className="pawn-result-content">
                                    <div className="pawn-result-main">
                                        {transactionType === "ต่อดอก" ? (
                                            <div className="pawn-result-note">
                                                {`ต่อดอก ${calculation.monthCount} เดือน ถึงวันที่ ${formatDate(
                                                    calculation.nextBoundary
                                                )}`}
                                            </div>
                                        ) : null}
                                        <span>{activeResultTitleLabel}</span>
                                        <strong>
                                            {formatInterestBaht(resultMainAmount)}
                                            <em>บาท</em>
                                        </strong>
                                    </div>

                                    <div className="pawn-result-grid">
                                        <ResultRow
                                            label="วันที่คำนวณ"
                                            value={formatDate(currentDate)}
                                        />
                                        {transactionType === "ไถ่ของ" ? (
                                            <>
                                                <ResultRow
                                                    label={principalResultLabel}
                                                    value={`${formatIntegerBaht(
                                                        loanAmount
                                                    )} บาท`}
                                                />
                                                <ResultRow
                                                    label={interestResultLabel}
                                                    value={`${formatInterestBaht(
                                                        calculation.interestAmount ?? 0
                                                    )} บาท`}
                                                />
                                            </>
                                        ) : null}
                                        <ResultRow
                                            label={totalDurationResultLabel}
                                            value={`${calculation.actualMonthCount} เดือน ${calculation.overdueFromLatestBoundary} วัน`}
                                            separated={transactionType === "ไถ่ของ"}
                                        />
                                        <ResultRow
                                            label={methodResultLabel}
                                            value={formatWeeklyAdditionLineBreak(
                                                calculation.method
                                            )}
                                            highlight
                                        />
                                        <ResultRow
                                            label={calculationResultLabel}
                                            value={formatWeeklyAdditionLineBreak(
                                                calculation.formulaText
                                            )}
                                            highlight
                                        />
                                        <ResultRow
                                            label={statusResultLabel}
                                            value={calculation.status}
                                            separated
                                        />
                                        <ResultRow
                                            label={redeemStatusResultLabel}
                                            value="สามารถไถ่ได้"
                                        />
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
                {isReady && calculation && optionEntries.length > 0 ? (
                    <div className="pawn-extend-options-section">
                        <div className="pawn-card pawn-extend-options-card">
                            {optionEntries.map((entry) => (
                                <React.Fragment
                                    key={`${entry.title}-${entry.detail}`}
                                >
                                    <div className="pawn-extend-option-entry">
                                        <div className="pawn-extend-option-title">
                                            {entry.title}
                                        </div>
                                        {entry.coverage ? (
                                            <div className="pawn-extend-option-coverage">
                                                {entry.coverage}
                                            </div>
                                        ) : null}
                                        <div className="pawn-extend-option-detail">
                                            {entry.detail}
                                        </div>
                                    </div>
                                    {entry.warning ? (
                                        <div className="pawn-extend-option-entry is-warning-only">
                                            <div className="pawn-extend-option-warning-message">
                                                {entry.warning}
                                            </div>
                                        </div>
                                    ) : null}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                ) : null}
            </div>
        </section>
    )
}

const componentStyles = `
.pawn-calculator,
.pawn-calculator * {
    box-sizing: border-box;
}

.pawn-calculator {
    display: block;
    width: 100%;
    max-width: 100%;
    min-width: 0;
    height: 100%;
    padding: 0;
    overflow: visible;
    color: var(--pawn-text);
    background: transparent;
    border: 0;
    border-radius: 0;
    box-shadow: none;
    font-size: var(--pawn-font-size);
}

.pawn-responsive-frame {
    position: relative;
    width: 100%;
    min-width: 0;
}

.pawn-header {
    margin-bottom: calc(var(--pawn-spacing) * 0.78);
}

.pawn-header h2,
.pawn-header p {
    margin: 0;
}

.pawn-header h2 {
    color: var(--pawn-accent);
    font-size: calc(var(--pawn-font-size) * 1.72);
    line-height: 1.15;
    font-weight: 760;
    letter-spacing: 0;
}

.pawn-header p {
    max-width: 720px;
    margin-top: 8px;
    color: var(--pawn-accent);
    font-size: calc(var(--pawn-font-size) * 0.92);
    line-height: 1.45;
}

.pawn-layout {
    position: relative;
    display: flex;
    flex-wrap: wrap;
    width: 100%;
    min-width: 0;
    gap: 12px;
    align-items: stretch;
}

.pawn-extend-options-section {
    width: 100%;
    margin-top: 12px;
}

.pawn-card {
    min-width: 0;
    background: var(--pawn-card);
    border: 1px solid rgba(245, 199, 75, 0.52);
    border-radius: calc(var(--pawn-radius) * 0.72);
    box-shadow: 0 12px 26px rgba(40, 0, 0, 0.18);
}

.pawn-extend-options-card {
    display: grid;
    gap: 16px;
    padding: 20px 24px;
}

.pawn-extend-option-entry {
    display: grid;
    gap: 4px;
}

.pawn-extend-option-entry.is-warning-only {
    gap: 0;
}

.pawn-extend-option-title,
.pawn-extend-option-coverage,
.pawn-extend-option-detail,
.pawn-extend-option-warning {
    min-width: 0;
}

.pawn-extend-option-title {
    color: var(--pawn-text);
    font-size: calc(var(--pawn-font-size) * 0.8);
    font-weight: 400;
    line-height: 1.38;
}

.pawn-extend-option-coverage {
    color: var(--pawn-text);
    font-size: calc(var(--pawn-font-size) * 0.8);
    font-weight: 400;
    line-height: 1.4;
}

.pawn-extend-option-detail {
    color: var(--pawn-accent);
    font-size: calc(var(--pawn-font-size) * 0.8);
    font-weight: 400;
    line-height: 1.4;
}

.pawn-extend-option-warning-message {
    display: flex;
    align-items: center;
    gap: 10px;
    color: rgba(214, 170, 120, 0.42);
    font-size: calc(var(--pawn-font-size) * 0.76);
    font-weight: 400;
    line-height: 1.45;
}

.pawn-extend-option-warning-message::after {
    content: "";
    flex: 1;
    height: 1px;
    background: rgba(214, 170, 120, 0.24);
}

.pawn-extend-option-warning-message::before {
    content: "";
    width: 8px;
    height: 1px;
    background: rgba(214, 170, 120, 0.24);
    flex: 0 0 8px;
}

.pawn-form-card {
    flex: 1 1 300px;
    min-width: min(100%, 360px);
    padding: 8px 24px;
}

.pawn-field-row {
    display: flex;
    flex-wrap: wrap;
    gap: 14px;
    align-items: center;
    min-width: 0;
    padding: calc(var(--pawn-spacing) * 0.58) 0;
    border-bottom: 1px solid rgba(245, 199, 75, 0.15);
}

.pawn-field-row-last {
    border-bottom: 0;
}

.pawn-field-row label {
    flex: 0.42 1 180px;
    min-width: 0;
    color: var(--pawn-text);
    font-size: calc(var(--pawn-font-size) * 0.8);
    font-weight: 400;
    line-height: 1.25;
}

.pawn-field-row label span,
.pawn-field-row label small {
    display: block;
}

.pawn-field-row label .pawn-start-date-part {
    display: inline-block;
    white-space: nowrap;
}

.pawn-field-row > :not(label) {
    flex: 1 1 230px;
    min-width: min(100%, 230px);
}

.pawn-field-row label small {
    margin-top: 5px;
    color: var(--pawn-muted);
    font-size: calc(var(--pawn-font-size) * 0.72);
    font-weight: 500;
    line-height: 1.35;
}

.pawn-control {
    width: 100%;
    min-width: 0;
    height: 46px;
    appearance: none;
    border: 1px solid rgba(245, 199, 75, 0.18);
    border-radius: calc(var(--pawn-radius) * 0.42);
    outline: none;
    background: var(--pawn-field);
    color: var(--pawn-text);
    padding: 0 14px;
    font: inherit;
    font-size: calc(var(--pawn-font-size) * 0.92);
    transition:
        border-color 180ms ease,
        box-shadow 180ms ease,
        background-color 180ms ease;
}

.pawn-control::placeholder {
    color: rgba(255, 245, 223, 0.48);
}

.pawn-control:hover {
    border-color: rgba(245, 199, 75, 0.42);
}

.pawn-control:focus {
    border-color: var(--pawn-accent);
    box-shadow: 0 0 0 3px rgba(245, 199, 75, 0.16);
}

.pawn-date-picker {
    position: relative;
    width: 100%;
    min-width: 0;
    z-index: 4;
}

.pawn-date-picker.is-open {
    z-index: 30;
}

.pawn-date-trigger {
    appearance: none;
    display: flex;
    width: 100%;
    height: 46px;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    cursor: pointer;
    border: 1px solid rgba(245, 199, 75, 0.18);
    border-radius: calc(var(--pawn-radius) * 0.42);
    background: var(--pawn-field);
    color: var(--pawn-text);
    padding: 0 14px;
    font: inherit;
    text-align: left;
    transition:
        border-color 180ms ease,
        box-shadow 180ms ease,
        background-color 180ms ease;
}

.pawn-date-trigger:hover,
.pawn-date-trigger:focus-visible,
.pawn-date-picker.is-open .pawn-date-trigger {
    outline: none;
    border-color: var(--pawn-accent);
    box-shadow: 0 0 0 3px rgba(245, 199, 75, 0.12);
}

.pawn-date-value {
    min-width: 0;
    color: var(--pawn-text);
    font-size: calc(var(--pawn-font-size) * 0.92);
    line-height: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.pawn-date-value.is-placeholder {
    color: rgba(255, 245, 223, 0.48);
}

.pawn-calendar-icon {
    display: inline-flex;
    flex: 0 0 auto;
    width: 20px;
    height: 20px;
    color: var(--pawn-accent);
}

.pawn-calendar-icon svg {
    width: 100%;
    height: 100%;
}

.pawn-date-popover {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    z-index: 40;
    width: 100%;
    max-width: 100%;
    color: var(--pawn-text);
    background: #6a1909;
    border: 1px solid rgba(245, 199, 75, 0.42);
    border-radius: calc(var(--pawn-radius) * 0.56);
    box-shadow: 0 18px 34px rgba(28, 0, 0, 0.34);
    padding: 12px;
    animation: pawnFadeIn 150ms ease both;
}

.pawn-date-step-header {
    display: grid;
    grid-template-columns: 30px minmax(0, 1fr) 30px;
    align-items: center;
    gap: 8px;
}

.pawn-date-step-value {
    min-width: 0;
    color: var(--pawn-accent);
    font-size: calc(var(--pawn-font-size) * 0.92);
    font-weight: 400;
    line-height: 1.25;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.pawn-date-back-button {
    appearance: none;
    display: inline-flex;
    width: 30px;
    height: 30px;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border: 1px solid rgba(245, 199, 75, 0.22);
    border-radius: 999px;
    background: rgba(255, 245, 223, 0.07);
    color: var(--pawn-text);
    font: inherit;
    font-size: calc(var(--pawn-font-size) * 1.25);
    font-weight: 400;
    line-height: 1;
}

.pawn-date-panel {
    display: grid;
    gap: 11px;
    margin-top: 11px;
}

.pawn-date-day-options,
.pawn-date-month-options,
.pawn-date-year-options {
    display: grid;
    gap: 6px;
}

.pawn-date-day-options {
    grid-template-columns: repeat(7, minmax(0, 1fr));
}

.pawn-date-month-options {
    grid-template-columns: repeat(4, minmax(0, 1fr));
}

.pawn-date-year-options {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    max-height: 102px;
    overflow: auto;
    padding-right: 2px;
}

.pawn-date-day-options button,
.pawn-date-month-options button,
.pawn-date-year-options button {
    appearance: none;
    min-width: 0;
    height: 36px;
    cursor: pointer;
    border: 1px solid rgba(245, 199, 75, 0.16);
    border-radius: calc(var(--pawn-radius) * 0.28);
    background: rgba(73, 18, 7, 0.74);
    color: var(--pawn-text);
    font: inherit;
    font-size: calc(var(--pawn-font-size) * 0.92);
    font-weight: 400;
    line-height: 1;
    transition:
        border-color 160ms ease,
        background-color 160ms ease,
        color 160ms ease;
}

.pawn-date-day-options button:hover:not(:disabled),
.pawn-date-month-options button:hover:not(:disabled),
.pawn-date-year-options button:hover:not(:disabled) {
    border-color: rgba(245, 199, 75, 0.45);
}

.pawn-date-day-options button.is-selected,
.pawn-date-month-options button.is-selected,
.pawn-date-year-options button.is-selected {
    color: #5d1b08;
    background: linear-gradient(180deg, #f7d764, var(--pawn-accent));
    border-color: rgba(255, 244, 192, 0.58);
}

.pawn-date-day-options button:disabled,
.pawn-date-month-options button:disabled,
.pawn-date-year-options button:disabled {
    cursor: not-allowed;
    opacity: 0.34;
}

.pawn-select {
    cursor: pointer;
    background-image:
        linear-gradient(45deg, transparent 50%, var(--pawn-accent) 50%),
        linear-gradient(135deg, var(--pawn-accent) 50%, transparent 50%);
    background-position:
        calc(100% - 18px) 20px,
        calc(100% - 12px) 20px;
    background-size: 6px 6px, 6px 6px;
    background-repeat: no-repeat;
    padding-right: 38px;
}

.pawn-money-input {
    position: relative;
    min-width: 0;
}

.pawn-money-input .pawn-control {
    padding-right: 54px;
}

.pawn-money-input span {
    position: absolute;
    right: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--pawn-muted);
    pointer-events: none;
    font-size: calc(var(--pawn-font-size) * 0.92);
    font-weight: 650;
}

.pawn-segmented {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
    min-width: 0;
}

.pawn-segmented button {
    appearance: none;
    border: 0;
    font: inherit;
    letter-spacing: 0;
}

.pawn-segmented button {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 0;
    height: 46px;
    cursor: pointer;
    color: var(--pawn-text);
    background: var(--pawn-field);
    border: 1px solid rgba(245, 199, 75, 0.18);
    border-radius: calc(var(--pawn-radius) * 0.42);
    padding: 0 10px;
    font-size: calc(var(--pawn-font-size) * 0.92);
    font-weight: 400;
    line-height: 1;
    text-align: center;
    transition:
        transform 180ms ease,
        background-color 180ms ease,
        border-color 180ms ease,
        color 180ms ease;
}

.pawn-segmented button:hover {
    transform: translateY(-1px);
    border-color: rgba(245, 199, 75, 0.4);
}

.pawn-segmented button.is-selected {
    color: #5d1b08;
    background: linear-gradient(180deg, #f7d764, var(--pawn-accent));
    border-color: rgba(255, 244, 192, 0.58);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.35);
}

.pawn-result-wrap {
    display: flex;
    flex: 1 1 260px;
    min-width: min(100%, 260px);
    flex-direction: column;
    gap: 9px;
}

.pawn-result-card {
    display: flex;
    flex: 1;
    min-height: 0;
    padding: 20px 24px;
    transition:
        border-color 180ms ease,
        box-shadow 180ms ease;
}

.pawn-result-card.is-warning {
    border-color: rgba(255, 189, 128, 0.72);
    box-shadow:
        0 12px 26px rgba(40, 0, 0, 0.22),
        inset 0 0 0 1px rgba(255, 230, 180, 0.08);
}

.pawn-result-content,
.pawn-empty-state,
.pawn-loading,
.pawn-warning-content {
    width: 100%;
    min-width: 0;
    animation: pawnFadeIn 180ms ease both;
}

.pawn-result-content {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 100%;
}

.pawn-result-main {
    padding-bottom: 14px;
    border-bottom: 1px solid rgba(245, 199, 75, 0.18);
}

.pawn-result-main span {
    display: block;
    color: var(--pawn-muted);
    font-size: calc(var(--pawn-font-size) * 0.8);
    line-height: 1.3;
}

.pawn-result-main strong {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 10px;
    margin-top: 8px;
    color: var(--pawn-accent);
    font-size: calc(var(--pawn-font-size) * 2);
    font-weight: 820;
    line-height: 1.02;
    letter-spacing: 0;
    overflow-wrap: anywhere;
}

.pawn-result-main em {
    color: var(--pawn-text);
    font-style: normal;
    font-size: calc(var(--pawn-font-size) * 0.92);
    font-weight: 760;
}

.pawn-result-grid {
    display: grid;
    gap: 20px;
    padding-top: 13px;
}

.pawn-result-note {
    margin-bottom: 6px;
    color: var(--pawn-muted);
    font-size: calc(var(--pawn-font-size) * 0.8);
    font-weight: 400;
    line-height: 1.3;
}

.pawn-result-row {
    display: grid;
    grid-template-columns: max-content minmax(0, 1fr);
    gap: 12px;
    align-items: baseline;
    min-width: 0;
    color: var(--pawn-muted);
    font-size: calc(var(--pawn-font-size) * 0.8);
    line-height: 1.35;
}

.pawn-result-row.is-separated {
    padding-top: 14px;
    border-top: 1px solid rgba(245, 199, 75, 0.18);
}

.pawn-result-row > span:first-child {
    white-space: nowrap;
}

.pawn-result-row > span:last-child {
    min-width: 0;
    color: var(--pawn-text);
    font-size: calc(var(--pawn-font-size) * 0.8);
    font-weight: 400;
    text-align: right;
    overflow-wrap: anywhere;
}

.pawn-result-row > span:last-child.is-highlight {
    color: var(--pawn-text);
}

.pawn-weekly-addition {
    display: block;
    margin-top: 2px;
}

.pawn-empty-state,
.pawn-loading,
.pawn-warning-content {
    display: flex;
    min-height: 228px;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
}

.pawn-empty-state strong,
.pawn-loading span,
.pawn-warning-content strong {
    color: var(--pawn-accent);
    font-size: calc(var(--pawn-font-size) * 1);
    font-weight: 400;
    line-height: 1.35;
}

.pawn-validation-list {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 7px;
    margin-top: 12px;
}

.pawn-validation-list span {
    color: var(--pawn-muted);
    background: rgba(255, 245, 223, 0.06);
    border: 1px solid rgba(245, 199, 75, 0.12);
    border-radius: 999px;
    padding: 5px 9px;
    font-size: calc(var(--pawn-font-size) * 0.8);
    line-height: 1.2;
}

.pawn-loading span {
    position: relative;
    animation: pawnPulse 900ms ease-in-out infinite;
}

.pawn-warning-content {
    align-items: flex-start;
    min-height: 228px;
    text-align: left;
}

.pawn-warning-kicker {
    display: inline-flex;
    width: fit-content;
    margin-bottom: 12px;
    color: var(--pawn-accent);
    background: rgba(255, 220, 160, 0.08);
    border: 1px solid rgba(255, 220, 160, 0.2);
    border-radius: 999px;
    padding: 6px 10px;
    font-size: calc(var(--pawn-font-size) * 0.8);
    font-weight: 760;
}

.pawn-warning-content strong {
    color: var(--pawn-accent);
    font-size: calc(var(--pawn-font-size) * 1.56);
    font-weight: 820;
}

.pawn-warning-content p {
    margin: 8px 0 0;
    color: var(--pawn-muted);
    font-size: calc(var(--pawn-font-size) * 0.92);
    line-height: 1.45;
}

.pawn-today-text {
    color: var(--pawn-muted);
    font-size: calc(var(--pawn-font-size) * 0.8);
    line-height: 1.35;
    text-align: right;
    opacity: 0.88;
}

.pawn-result-footer {
    margin-top: auto;
    padding-top: 24px;
}

@keyframes pawnFadeIn {
    from {
        opacity: 0;
        transform: translateY(4px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes pawnPulse {
    0%,
    100% {
        opacity: 0.58;
    }
    50% {
        opacity: 1;
    }
}

@media (prefers-reduced-motion: reduce) {
    .pawn-result-content,
    .pawn-empty-state,
    .pawn-loading,
    .pawn-warning-content,
    .pawn-loading span,
    .pawn-segmented button {
        animation: none;
        transition: none;
    }
}

@media (max-width: 420px) {
    .pawn-form-card,
    .pawn-result-card,
    .pawn-extend-options-card {
        padding: calc(var(--pawn-spacing) * 0.58);
    }

    .pawn-header h2 {
        font-size: calc(var(--pawn-font-size) * 1.45);
    }

    .pawn-result-main strong {
        font-size: calc(var(--pawn-font-size) * 1.8);
    }

    .pawn-result-row {
        grid-template-columns: 1fr;
        gap: 3px;
    }

    .pawn-result-row > span:last-child {
        text-align: left;
    }
}
`

addPropertyControls(PawnInterestCalculator, {
    backgroundColor: {
        type: ControlType.Color,
        title: "พื้นหลัง",
        defaultValue: "#760608",
    },
    cardColor: {
        type: ControlType.Color,
        title: "การ์ด",
        defaultValue: "#87090A",
    },
    fieldColor: {
        type: ControlType.Color,
        title: "ช่องกรอก",
        defaultValue: "#5B1D0C",
    },
    accentColor: {
        type: ControlType.Color,
        title: "สีทอง",
        defaultValue: "#F3C94E",
    },
    textColor: {
        type: ControlType.Color,
        title: "ตัวอักษร",
        defaultValue: "#FFF7E6",
    },
    mutedTextColor: {
        type: ControlType.Color,
        title: "ตัวรอง",
        defaultValue: "#E8CBA2",
    },
    borderColor: {
        type: ControlType.Color,
        title: "เส้นขอบ",
        defaultValue: "#D8AA34",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "มุมโค้ง",
        min: 8,
        max: 32,
        step: 1,
        defaultValue: 18,
    },
    fontSize: {
        type: ControlType.Number,
        title: "ขนาดตัวอักษร",
        min: 14,
        max: 24,
        step: 1,
        defaultValue: 18,
    },
    fontControl: {
        type: ControlType.Font,
        title: "ฟอนต์",
        defaultValue: {},
        defaultFontType: "sans-serif",
        displayFontSize: false,
        displayTextAlignment: false,
        controls: "basic",
    },
    spacing: {
        type: ControlType.Number,
        title: "ระยะห่าง",
        min: 14,
        max: 36,
        step: 1,
        defaultValue: 24,
    },
    titleLabel: {
        type: ControlType.String,
        title: "หัวข้อ",
        defaultValue: "คำนวณดอกเบี้ยจำนำ",
    },
    subtitleLabel: {
        type: ControlType.String,
        title: "คำอธิบาย",
        defaultValue: "คำนวณอัตโนมัติเมื่อกรอกข้อมูลครบ",
    },
    startDateLabel: {
        type: ControlType.String,
        title: "ป้ายวันที่",
        defaultValue: "วันเริ่ม / ต่อดอกล่าสุด",
    },
    loanAmountLabel: {
        type: ControlType.String,
        title: "ป้ายยอด",
        defaultValue: "ยอดจำนำ",
    },
    loanAmountPlaceholder: {
        type: ControlType.String,
        title: "ตัวอย่างยอด",
        defaultValue: "กรอกยอดจำนำ",
    },
    promoLabel: {
        type: ControlType.String,
        title: "ป้ายโปร",
        defaultValue: "โปรโมชัน",
    },
    transactionLabel: {
        type: ControlType.String,
        title: "ป้ายรายการ",
        defaultValue: "รายการ",
    },
    extendLabel: {
        type: ControlType.String,
        title: "ต่อดอก",
        defaultValue: "ต่อดอก",
    },
    redeemLabel: {
        type: ControlType.String,
        title: "ไถ่ของ",
        defaultValue: "ไถ่ของ",
    },
    extendResultTitleLabel: {
        type: ControlType.String,
        title: "หัวข้อต่อดอก",
        defaultValue: "ดอกเบี้ยที่ต้องชำระในการต่อดอก",
    },
    redeemResultTitleLabel: {
        type: ControlType.String,
        title: "หัวข้อไถ่",
        defaultValue: "เงินต้นและดอกเบี้ยที่ต้องชำระในการไถ่",
    },
    principalResultLabel: {
        type: ControlType.String,
        title: "ป้ายเงินต้น",
        defaultValue: "เงินต้น",
    },
    interestResultLabel: {
        type: ControlType.String,
        title: "ป้ายดอกเบี้ย",
        defaultValue: "ดอกเบี้ย",
    },
    totalDurationResultLabel: {
        type: ControlType.String,
        title: "ป้ายระยะเวลา",
        defaultValue: "ระยะเวลาทั้งสิ้น",
    },
    calculationResultLabel: {
        type: ControlType.String,
        title: "ป้ายคำนวณ",
        defaultValue: "คำนวณ",
    },
    methodResultLabel: {
        type: ControlType.String,
        title: "ป้ายวิธีคิดดอก",
        defaultValue: "วิธีคิดดอก",
    },
    statusResultLabel: {
        type: ControlType.String,
        title: "ป้ายสถานะ",
        defaultValue: "สถานะสัญญา",
    },
    redeemStatusResultLabel: {
        type: ControlType.String,
        title: "ป้ายไถ่ของ",
        defaultValue: "สถานะไถ่ของ",
    },
    todayTextLabel: {
        type: ControlType.String,
        title: "ป้ายวันที่วันนี้",
        defaultValue: "คำนวณตามวันที่วันนี้ วันที่",
    },
})
