"use client"

import * as React from "react"
import {
    calculatePawnInterest,
    type PawnInterestResult,
    type PromoType,
    type TransactionType,
} from "@/lib/pawn-interest"

type DatePickerStep = "year" | "month" | "day"

interface OptionEntry {
    title: string
    detail: string
    coverage?: string
    warning?: string
}

const PROMO_OPTIONS: Array<{ label: string; value: PromoType }> = [
    { label: "โปร 2%", value: "โปร 2%" },
    { label: "โปรแสน", value: "โปรแสน (1.5%)" },
]

const TRANSACTION_OPTIONS: Array<{ label: string; value: TransactionType }> = [
    { label: "ต่อดอก", value: "ต่อดอก" },
    { label: "ไถ่ของ", value: "ไถ่ของ" },
]

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

const BUDDHIST_YEAR_OFFSET = 543
const CONTRACT_DURATION_MONTHS = 3
const RETRO_EXTEND_WINDOW_DAYS = 7
const CONTRACT_GRACE_DAYS = 20
const DATE_PICKER_YEAR_RANGE = 2
const PROMO_RATES: Record<PromoType, number> = {
    "โปร 2%": 0.02,
    "โปรแสน (1.5%)": 0.015,
}

function findLastDayOfMonth(year: number, monthIndex: number): number {
    return new Date(year, monthIndex + 1, 0).getDate()
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

function normalizeDate(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function getToday(): Date {
    return normalizeDate(new Date())
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

function formatBuddhistYear(year: number): string {
    return String(year + BUDDHIST_YEAR_OFFSET)
}

function formatThaiDate(value: string): string {
    const parsedDate = parseDateInput(value)
    return parsedDate ? formatDate(parsedDate) : value
}

function formatDate(date: Date): string {
    return `${date.getDate()} ${THAI_MONTH_LABELS[date.getMonth()]} ${date.getFullYear() + BUDDHIST_YEAR_OFFSET}`
}

function formatMonthYear(date: Date): string {
    return `${THAI_MONTH_LABELS[date.getMonth()]} ${formatBuddhistYear(date.getFullYear())}`
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

function formatBaht(value: number): string {
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

function buildValidationMessages(values: {
    startDate: Date | null
    loanInput: string
    loanAmount: number
    currentDate: Date
}): string[] {
    const messages: string[] = []

    if (!values.startDate) {
        messages.push("กรุณาเลือกวันเริ่ม")
    }

    if (!values.loanInput.trim()) {
        messages.push("กรุณากรอกยอดจำนำ")
    } else if (values.loanAmount <= 0) {
        messages.push("ยอดจำนำต้องมากกว่า 0")
    }

    if (values.startDate && compareDates(values.currentDate, values.startDate) < 0) {
        messages.push("วันที่วันนี้ต้องไม่ก่อนวันเริ่ม")
    }

    return messages
}

function buildExtendOptionEntries(params: {
    startDate: Date
    result: PawnInterestResult
    loanAmount: number
    promoType: PromoType
}): OptionEntry[] {
    const promoRate = PROMO_RATES[params.promoType]
    const promoLabel = `โปร ${formatPercent(promoRate)}`
    const latestBoundary = parseDateInput(params.result.latestBoundary)
    const contractExpiryDate = parseDateInput(params.result.contractExpiryDate)

    if (!latestBoundary || !contractExpiryDate) {
        return []
    }

    const retroDeadline = addDays(latestBoundary, RETRO_EXTEND_WINDOW_DAYS)
    const promoGraceDeadline = addDays(contractExpiryDate, CONTRACT_GRACE_DAYS)
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
    const penaltyInterest = Math.ceil(params.loanAmount * 0.03 * nextPeriodMonthCount)
    const retroInterest = Math.ceil(
        params.loanAmount * promoRate * params.result.actualMonthCount
    )
    const entries: OptionEntry[] = []

    if (
        params.result.overdueFromLatestBoundary >= 1 &&
        params.result.overdueFromLatestBoundary <= RETRO_EXTEND_WINDOW_DAYS
    ) {
        entries.push({
            title: `ภายในวันที่ ${formatDate(retroDeadline)}`,
            coverage: `ต่อดอกย้อนหลัง โดยชำระดอกถึง ${formatDate(latestBoundary)}`,
            detail: `${promoLabel} × ${params.result.actualMonthCount} เดือน ดอกเบี้ย ${formatBaht(retroInterest)} บาท`,
            warning: "หลังจากนี้จะไม่สามารถต่อดอกย้อนหลังได้",
        })
    }

    if (params.result.monthCount < CONTRACT_DURATION_MONTHS) {
        for (
            let monthCount = params.result.monthCount + 1;
            monthCount <= CONTRACT_DURATION_MONTHS;
            monthCount += 1
        ) {
            const deadline = addAnniversaryMonths(params.startDate, monthCount)
            const interestAmount = Math.ceil(params.loanAmount * promoRate * monthCount)

            entries.push({
                title: `ภายในวันที่ ${formatDate(deadline)}`,
                detail: `${promoLabel} × ${monthCount} เดือน ดอกเบี้ย ${formatBaht(interestAmount)} บาท`,
                warning:
                    monthCount === CONTRACT_DURATION_MONTHS
                        ? "หลังจากนี้จะหมดอายุสัญญา"
                        : undefined,
            })
        }
    } else {
        entries.push({
            title: `ภายในวันที่ ${formatDate(contractExpiryDate)}`,
            detail: `${promoLabel} × ${CONTRACT_DURATION_MONTHS} เดือน ดอกเบี้ย ${formatBaht(contractInterest)} บาท`,
            warning: "หลังจากนี้จะหมดอายุสัญญา",
        })
    }

    entries.push(
        {
            title: `ภายในวันที่ ${formatDate(promoGraceDeadline)}`,
            detail: `${promoLabel} × ${nextPeriodMonthCount} เดือน ดอกเบี้ย ${formatBaht(graceInterest)} บาท`,
            warning: `หลังจากนี้จะหมดอายุสัญญาเกิน ${CONTRACT_GRACE_DAYS} วัน โปรโมชั่นจะกลายเป็น 3%`,
        },
        {
            title: `ภายในวันที่ ${formatDate(penaltyDeadline)}`,
            detail: `อัตรา 3% × ${nextPeriodMonthCount} เดือน ดอกเบี้ย ${formatBaht(penaltyInterest)} บาท`,
        }
    )

    return entries
}

function buildRedeemOptionEntries(params: {
    startDate: Date
    result: PawnInterestResult
    loanAmount: number
    promoType: PromoType
}): OptionEntry[] {
    const promoRate = PROMO_RATES[params.promoType]
    const promoLabel = `โปร ${formatPercent(promoRate)}`
    const latestBoundary = parseDateInput(params.result.latestBoundary)

    if (!latestBoundary) {
        return []
    }

    const entries: OptionEntry[] = []

    if (
        params.result.overdueFromLatestBoundary >= 1 &&
        params.result.overdueFromLatestBoundary <= RETRO_EXTEND_WINDOW_DAYS &&
        params.result.actualMonthCount < CONTRACT_DURATION_MONTHS
    ) {
        const weeklyDeadline = addDays(latestBoundary, RETRO_EXTEND_WINDOW_DAYS)
        const weeklyInterest = Math.ceil(
            params.loanAmount * promoRate * params.result.actualMonthCount +
                params.loanAmount * 0.01
        )
        const weeklyTotalRedeem = params.loanAmount + weeklyInterest

        entries.push({
            title: `ภายในวันที่ ${formatDate(weeklyDeadline)}`,
            detail:
                params.result.actualMonthCount === 0
                    ? `อัตรา 1 สัปดาห์ ดอกเบี้ย ${formatBaht(weeklyInterest)} บาท · รวมไถ่ ${formatBaht(weeklyTotalRedeem)} บาท`
                    : `${promoLabel} × ${params.result.actualMonthCount} เดือน + 1 สัปดาห์ ดอกเบี้ย ${formatBaht(weeklyInterest)} บาท · รวมไถ่ ${formatBaht(weeklyTotalRedeem)} บาท`,
        })
    }

    for (
        let monthCount = params.result.actualMonthCount + 1;
        monthCount <= CONTRACT_DURATION_MONTHS;
        monthCount += 1
    ) {
        const boundaryDate = addAnniversaryMonths(params.startDate, monthCount)
        const monthlyInterest = Math.ceil(params.loanAmount * promoRate * monthCount)
        const monthlyTotalRedeem = params.loanAmount + monthlyInterest

        entries.push({
            title: `ภายในวันที่ ${formatDate(boundaryDate)}`,
            detail: `${promoLabel} × ${monthCount} เดือน ดอกเบี้ย ${formatBaht(monthlyInterest)} บาท · รวมไถ่ ${formatBaht(monthlyTotalRedeem)} บาท`,
            warning:
                monthCount === CONTRACT_DURATION_MONTHS
                    ? "หลังจากนี้จะหมดอายุสัญญา ไม่สามารถไถ่ได้"
                    : undefined,
        })

        if (monthCount < CONTRACT_DURATION_MONTHS) {
            const weeklyDeadline = addDays(boundaryDate, RETRO_EXTEND_WINDOW_DAYS)
            const weeklyInterest = Math.ceil(
                params.loanAmount * promoRate * monthCount + params.loanAmount * 0.01
            )
            const weeklyTotalRedeem = params.loanAmount + weeklyInterest

            entries.push({
                title: `ภายในวันที่ ${formatDate(weeklyDeadline)}`,
                detail: `${promoLabel} × ${monthCount} เดือน + 1 สัปดาห์ ดอกเบี้ย ${formatBaht(weeklyInterest)} บาท · รวมไถ่ ${formatBaht(weeklyTotalRedeem)} บาท`,
            })
        }
    }

    return entries
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
            <span className="pawn-weekly-addition">{value.slice(markerIndex + 1)}</span>
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
            <span className="pawn-start-date-part">/ {restParts.join(" / ")}</span>
        </span>
    )
}

function ResultRow(props: {
    label: string
    value: React.ReactNode
    separated?: boolean
    highlight?: boolean
}) {
    return (
        <div className={`pawn-result-row ${props.separated ? "is-separated" : ""}`}>
            <span>{props.label}</span>
            <span className={props.highlight ? "is-highlight" : undefined}>
                {props.value}
            </span>
        </div>
    )
}

export function ManualCalculator() {
    const [currentDate, setCurrentDate] = React.useState(() => getToday())
    const [startDateInput, setStartDateInput] = React.useState("")
    const [loanInput, setLoanInput] = React.useState("")
    const [promoType, setPromoType] = React.useState<PromoType>("โปร 2%")
    const [transactionType, setTransactionType] =
        React.useState<TransactionType>("ต่อดอก")
    const [validationMessages, setValidationMessages] = React.useState<string[]>([])
    const [result, setResult] = React.useState<PawnInterestResult | null>(null)
    const [engineError, setEngineError] = React.useState<string | null>(null)
    const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false)
    const [datePickerStep, setDatePickerStep] =
        React.useState<DatePickerStep>("year")
    const [datePickerDraft, setDatePickerDraft] = React.useState(() => getToday())
    const datePickerRef = React.useRef<HTMLDivElement | null>(null)
    const loanInputRef = React.useRef<HTMLInputElement | null>(null)

    const startDate = React.useMemo(
        () => parseDateInput(startDateInput),
        [startDateInput]
    )
    const loanAmount = React.useMemo(() => getLoanAmountFromInput(loanInput), [loanInput])
    const datePickerYears = React.useMemo(
        () => getDatePickerYears(currentDate, datePickerDraft),
        [currentDate, datePickerDraft]
    )
    const datePickerDayCount = findLastDayOfMonth(
        datePickerDraft.getFullYear(),
        datePickerDraft.getMonth()
    )

    React.useEffect(() => {
        const timer = window.setInterval(() => {
            setCurrentDate((previousDate) => {
                const nextDate = getToday()
                return compareDates(previousDate, nextDate) === 0 ? previousDate : nextDate
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
        const messages = buildValidationMessages({
            startDate,
            loanInput,
            loanAmount,
            currentDate,
        })
        setValidationMessages(messages)
        setEngineError(null)

        if (messages.length > 0 || !startDate) {
            setResult(null)
            return
        }

        try {
            setResult(
                calculatePawnInterest({
                    startDate: startDateInput,
                    currentDate: formatDateInputValue(currentDate),
                    loanAmount,
                    promoType,
                    transactionType,
                })
            )
        } catch (error) {
            setResult(null)
            setEngineError(
                error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการคำนวณ"
            )
        }
    }, [currentDate, loanAmount, loanInput, promoType, startDate, startDateInput, transactionType])

    const optionEntries = React.useMemo(() => {
        if (!startDate || !result) {
            return []
        }

        if (transactionType === "ต่อดอก") {
            return buildExtendOptionEntries({
                startDate,
                result,
                loanAmount,
                promoType,
            })
        }

        return buildRedeemOptionEntries({
            startDate,
            result,
            loanAmount,
            promoType,
        })
    }, [loanAmount, promoType, result, startDate, transactionType])

    const totalRedeemAmount =
        transactionType === "ไถ่ของ" &&
        result !== null &&
        result.interestAmount !== null
            ? loanAmount + result.interestAmount
            : null

    const openDatePicker = () => {
        setDatePickerDraft(startDate ?? currentDate)
        setDatePickerStep("year")
        setIsDatePickerOpen(true)
    }

    const updateStartDate = (nextDate: Date) => {
        setStartDateInput(formatDateInputValue(clampDateToToday(nextDate, currentDate)))
    }

    const handleLoanChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const digitsOnly = event.target.value.replace(/[^\d]/g, "")
        const nextLoanAmount = digitsOnly ? Number(digitsOnly) : 0
        setLoanInput(digitsOnly ? formatBaht(nextLoanAmount) : "")
        setPromoType(nextLoanAmount >= 100000 ? "โปรแสน (1.5%)" : "โปร 2%")
    }

    return (
        <main className="phase-page">
            <section className="pawn-calculator-app">
                <header className="pawn-header">
                    <h1>คำนวณดอกเบี้ยจำนำ</h1>
                </header>

                <div className="pawn-layout">
                    <div className="pawn-card pawn-form-card">
                        <div className="pawn-field-row">
                            <label htmlFor="pawn-start-date">
                                {renderResponsiveSlashLabel("วันเริ่ม / ต่อดอกล่าสุด")}
                            </label>
                            <div
                                className={`pawn-date-picker ${isDatePickerOpen ? "is-open" : ""}`}
                                ref={datePickerRef}
                            >
                                <button
                                    id="pawn-start-date"
                                    className="pawn-date-trigger"
                                    type="button"
                                    aria-haspopup="dialog"
                                    aria-expanded={isDatePickerOpen}
                                    aria-label="วันเริ่ม / ต่อดอกล่าสุด"
                                    onClick={() =>
                                        isDatePickerOpen ? setIsDatePickerOpen(false) : openDatePicker()
                                    }
                                >
                                    <span
                                        className={
                                            startDateInput
                                                ? "pawn-date-value"
                                                : "pawn-date-value is-placeholder"
                                        }
                                    >
                                        {startDate ? formatDate(startDate) : "วัน / เดือน / ปี"}
                                    </span>
                                    <span className="pawn-calendar-icon" aria-hidden>
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
                                    <div className="pawn-date-popover" role="dialog" aria-label="เลือกวันเริ่ม">
                                        <div className="pawn-date-step-header">
                                            {datePickerStep !== "year" ? (
                                                <button
                                                    className="pawn-date-back-button"
                                                    type="button"
                                                    aria-label="ย้อนกลับ"
                                                    onClick={() =>
                                                        setDatePickerStep(
                                                            datePickerStep === "day" ? "month" : "year"
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
                                                      ? `ปี ${formatBuddhistYear(datePickerDraft.getFullYear())}`
                                                      : formatMonthYear(datePickerDraft)}
                                            </span>
                                            <span aria-hidden />
                                        </div>

                                        {datePickerStep === "year" ? (
                                            <div className="pawn-date-panel">
                                                <div className="pawn-date-year-options">
                                                    {datePickerYears.map((year) => (
                                                        <button
                                                            key={year}
                                                            type="button"
                                                            className={
                                                                datePickerDraft.getFullYear() === year
                                                                    ? "is-selected"
                                                                    : ""
                                                            }
                                                            disabled={year > currentDate.getFullYear()}
                                                            onClick={() => {
                                                                setDatePickerDraft((previousDate) =>
                                                                    clampDateToToday(
                                                                        createSafeDate(
                                                                            year,
                                                                            previousDate.getMonth(),
                                                                            previousDate.getDate()
                                                                        ),
                                                                        currentDate
                                                                    )
                                                                )
                                                                setDatePickerStep("month")
                                                            }}
                                                        >
                                                            {formatBuddhistYear(year)}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : null}

                                        {datePickerStep === "month" ? (
                                            <div className="pawn-date-panel">
                                                <div className="pawn-date-month-options">
                                                    {THAI_MONTH_LABELS.map((monthLabel, monthIndex) => {
                                                        const monthStart = new Date(
                                                            datePickerDraft.getFullYear(),
                                                            monthIndex,
                                                            1
                                                        )

                                                        return (
                                                            <button
                                                                key={monthLabel}
                                                                type="button"
                                                                className={
                                                                    datePickerDraft.getMonth() === monthIndex
                                                                        ? "is-selected"
                                                                        : ""
                                                                }
                                                                disabled={compareDates(monthStart, currentDate) > 0}
                                                                onClick={() => {
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
                                                                }}
                                                            >
                                                                {monthLabel}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        ) : null}

                                        {datePickerStep === "day" ? (
                                            <div className="pawn-date-panel">
                                                <div className="pawn-date-day-options">
                                                    {Array.from({ length: datePickerDayCount }, (_, index) => {
                                                        const day = index + 1
                                                        const optionDate = createSafeDate(
                                                            datePickerDraft.getFullYear(),
                                                            datePickerDraft.getMonth(),
                                                            day
                                                        )

                                                        return (
                                                            <button
                                                                key={day}
                                                                type="button"
                                                                className={
                                                                    datePickerDraft.getDate() === day
                                                                        ? "is-selected"
                                                                        : ""
                                                                }
                                                                disabled={compareDates(optionDate, currentDate) > 0}
                                                                onClick={() => {
                                                                    updateStartDate(optionDate)
                                                                    setDatePickerDraft(
                                                                        clampDateToToday(optionDate, currentDate)
                                                                    )
                                                                    setIsDatePickerOpen(false)
                                                                    loanInputRef.current?.focus()
                                                                }}
                                                            >
                                                                {day}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        ) : null}
                                    </div>
                                ) : null}
                            </div>
                        </div>

                        <div className="pawn-field-row">
                            <label htmlFor="loanAmount">
                                <span>ยอดจำนำ</span>
                            </label>
                            <div className="pawn-money-input">
                                <input
                                    ref={loanInputRef}
                                    id="loanAmount"
                                    className="pawn-control"
                                    name="loanAmount"
                                    type="tel"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    autoComplete="off"
                                    placeholder="กรอกยอดจำนำ"
                                    value={loanInput}
                                    onChange={handleLoanChange}
                                />
                                <span>บาท</span>
                            </div>
                        </div>

                        <div className="pawn-field-row">
                            <label>
                                <span>โปรโมชัน</span>
                            </label>
                            <div className="pawn-segmented" role="radiogroup" aria-label="โปรโมชัน">
                                {PROMO_OPTIONS.map((option) => {
                                    const isSelected = promoType === option.value
                                    return (
                                        <button
                                            key={option.value}
                                            type="button"
                                            role="radio"
                                            aria-checked={isSelected}
                                            className={isSelected ? "is-selected" : ""}
                                            onClick={() => setPromoType(option.value)}
                                        >
                                            {option.label}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        <div className="pawn-field-row pawn-field-row-last">
                            <label>
                                <span>รายการ</span>
                            </label>
                            <div className="pawn-segmented" role="radiogroup" aria-label="รายการ">
                                {TRANSACTION_OPTIONS.map((option) => {
                                    const isSelected = transactionType === option.value
                                    return (
                                        <button
                                            key={option.value}
                                            type="button"
                                            role="radio"
                                            aria-checked={isSelected}
                                            className={isSelected ? "is-selected" : ""}
                                            onClick={() => setTransactionType(option.value)}
                                        >
                                            {option.label}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="pawn-result-wrap">
                        <div
                            className={`pawn-card pawn-result-card ${
                                result?.mode === "blocked" ? "is-warning" : ""
                            }`}
                        >
                            {validationMessages.length > 0 ? (
                                <div className="pawn-empty-state">
                                    <strong>กรอกข้อมูลให้ครบเพื่อคำนวณ</strong>
                                    <div className="pawn-validation-list">
                                        {validationMessages.map((message) => (
                                            <span key={message}>{message}</span>
                                        ))}
                                    </div>
                                </div>
                            ) : engineError ? (
                                <div className="pawn-warning-content">
                                    <span className="pawn-warning-kicker">Engine error</span>
                                    <strong>ไม่สามารถคำนวณได้</strong>
                                    <p>{engineError}</p>
                                </div>
                            ) : result?.mode === "blocked" ? (
                                <div className="pawn-warning-content">
                                    <span className="pawn-warning-kicker">{result.status}</span>
                                    <strong>{result.blockedTitle}</strong>
                                    <p>{result.blockedMessage}</p>
                                </div>
                            ) : result ? (
                                <div className="pawn-result-content">
                                    <div className="pawn-result-main">
                                        {transactionType === "ต่อดอก" ? (
                                            <div className="pawn-result-note">
                                                {`ต่อดอก ${result.monthCount} เดือน ถึงวันที่ ${formatThaiDate(result.nextBoundary)}`}
                                            </div>
                                        ) : null}
                                        <span>
                                            {transactionType === "ต่อดอก"
                                                ? "ดอกเบี้ยที่ต้องชำระในการต่อดอก"
                                                : "เงินต้นและดอกเบี้ยที่ต้องชำระในการไถ่"}
                                        </span>
                                        <strong>
                                            {formatBaht(totalRedeemAmount ?? result.interestAmount ?? 0)}
                                            <em>บาท</em>
                                        </strong>
                                    </div>

                                    <div className="pawn-result-grid">
                                        <ResultRow
                                            label="วันที่คำนวณ"
                                            value={formatThaiDate(formatDateInputValue(currentDate))}
                                        />
                                        {transactionType === "ไถ่ของ" ? (
                                            <>
                                                <ResultRow
                                                    label="เงินต้น"
                                                    value={`${formatBaht(loanAmount)} บาท`}
                                                />
                                                <ResultRow
                                                    label="ดอกเบี้ย"
                                                    value={`${formatBaht(result.interestAmount ?? 0)} บาท`}
                                                />
                                            </>
                                        ) : null}
                                        <ResultRow
                                            label="ระยะเวลาทั้งสิ้น"
                                            value={`${result.actualMonthCount} เดือน ${result.overdueFromLatestBoundary} วัน`}
                                            separated={transactionType === "ไถ่ของ"}
                                        />
                                        <ResultRow
                                            label="วิธีคิดดอก"
                                            value={formatWeeklyAdditionLineBreak(result.method)}
                                            highlight
                                        />
                                        <ResultRow
                                            label="คำนวณ"
                                            value={formatWeeklyAdditionLineBreak(result.formulaText)}
                                            highlight
                                        />
                                        <ResultRow
                                            label="สถานะสัญญา"
                                            value={result.status}
                                            separated
                                        />
                                        <ResultRow label="สถานะไถ่ของ" value="สามารถไถ่ได้" />
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>

                {result && optionEntries.length > 0 ? (
                    <section className="pawn-extend-options-section">
                        <div className="pawn-card pawn-extend-options-card">
                            {optionEntries.map((entry) => (
                                <React.Fragment key={`${entry.title}-${entry.detail}`}>
                                    <div className="pawn-extend-option-entry">
                                        <div className="pawn-extend-option-title">{entry.title}</div>
                                        {entry.coverage ? (
                                            <div className="pawn-extend-option-coverage">
                                                {entry.coverage}
                                            </div>
                                        ) : null}
                                        <div className="pawn-extend-option-detail">{entry.detail}</div>
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
                    </section>
                ) : null}
            </section>
        </main>
    )
}
