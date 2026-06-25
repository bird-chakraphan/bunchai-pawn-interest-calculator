export type PaymentStatus = "pending_payment" | "paid" | "failed" | "expired"

export type RenewalStatus = "none" | "pending_staff_review" | "review_completed"

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
    pending_payment: "รอการชำระเงิน",
    paid: "ชำระเงินแล้ว",
    failed: "ชำระเงินไม่สำเร็จ",
    expired: "รายการหมดอายุ",
}

const RENEWAL_STATUS_LABELS: Record<RenewalStatus, string> = {
    none: "ยังไม่เข้าสู่ขั้นตอนตรวจสอบ",
    pending_staff_review: "รอพนักงานอัปเดต AppSheet",
    review_completed: "พนักงานตรวจสอบเรียบร้อย",
}

export function getPaymentStatusLabel(status: string): string {
    return PAYMENT_STATUS_LABELS[status as PaymentStatus] ?? status
}

export function getRenewalStatusLabel(status: string): string {
    return RENEWAL_STATUS_LABELS[status as RenewalStatus] ?? status
}

export function formatBaht(amount: number): string {
    return `${new Intl.NumberFormat("th-TH", {
        maximumFractionDigits: 0,
    }).format(amount)} บาท`
}

export function formatThaiDateTime(value: string | null): string {
    if (!value) {
        return "-"
    }

    const parsedDate = new Date(value)

    if (Number.isNaN(parsedDate.getTime())) {
        return "-"
    }

    return new Intl.DateTimeFormat("th-TH", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(parsedDate)
}

export function formatThaiDate(value: string | null): string {
    if (!value) {
        return "-"
    }

    const parsedDate = new Date(`${value}T00:00:00`)

    if (Number.isNaN(parsedDate.getTime())) {
        return "-"
    }

    return new Intl.DateTimeFormat("th-TH", {
        dateStyle: "medium",
    }).format(parsedDate)
}
