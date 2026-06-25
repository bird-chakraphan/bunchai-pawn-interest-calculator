"use client"

import * as React from "react"
import { ManualCalculator } from "@/components/manual-calculator"
import type { StaffLookupViewModel } from "@/lib/staff-lookup"

interface PublicLookupRecord {
    pawnId: string
    startDate: string
    loanAmount: number
    promoType: string
    baseRate: number
}

type LookupResultState =
    | {
          status: "idle"
      }
    | {
          status: "loading"
      }
    | {
          status: "success"
          record: PublicLookupRecord
          lookupViewModel: StaffLookupViewModel
      }
    | {
          status: "generic_failure" | "contact_branch" | "rate_limited" | "error"
          message: string
      }

export function PublicHomePage(props: { paymentsEnabled?: boolean }) {
    const [mode, setMode] = React.useState<"lookup" | "manual">("lookup")
    const [pawnId, setPawnId] = React.useState("")
    const [phone, setPhone] = React.useState("")
    const [lookupResult, setLookupResult] = React.useState<LookupResultState>({
        status: "idle",
    })
    const [paymentState, setPaymentState] = React.useState<{
        isLoading: boolean
        error: string | null
    }>({
        isLoading: false,
        error: null,
    })

    async function handleLookupSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setLookupResult({ status: "loading" })

        const response = await fetch("/api/customer/lookup", {
            method: "POST",
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify({
                pawnId,
                phone,
            }),
        })

        const payload = (await response.json()) as
            | {
                  status: "success"
                  record: PublicLookupRecord
                  lookupViewModel: StaffLookupViewModel
              }
            | {
                  status?: "generic_failure" | "contact_branch" | "rate_limited"
                  error?: string
              }

        if (response.status === 429 || payload.status === "rate_limited") {
            setLookupResult({
                status: "rate_limited",
                message: "ลองใหม่อีกครั้งในภายหลัง",
            })
            return
        }

        if (!response.ok) {
            const errorMessage =
                "error" in payload && typeof payload.error === "string"
                    ? payload.error
                    : "เกิดข้อผิดพลาดในการค้นหาข้อมูล"

            setLookupResult({
                status: "error",
                message: errorMessage,
            })
            return
        }

        if (payload.status === "success") {
            setLookupResult(payload)
            return
        }

        if (payload.status === "contact_branch") {
            setLookupResult({
                status: "contact_branch",
                message: "กรุณาติดต่อสาขา",
            })
            return
        }

        setLookupResult({
            status: "generic_failure",
            message: "ไม่สามารถยืนยันข้อมูลได้ กรุณาตรวจสอบเลขใบจำนำและเบอร์โทรศัพท์",
        })
    }

    function clearLookup() {
        setPawnId("")
        setPhone("")
        setLookupResult({ status: "idle" })
        setPaymentState({
            isLoading: false,
            error: null,
        })
    }

    async function handleExtendPayment() {
        setPaymentState({
            isLoading: true,
            error: null,
        })

        const response = await fetch("/api/customer/payments/extend", {
            method: "POST",
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify({
                pawnId,
                phone,
            }),
        })

        const payload = (await response.json()) as {
            status?: string
            checkoutUrl?: string
            error?: string
        }

        if (!response.ok || payload.status !== "success" || !payload.checkoutUrl) {
            setPaymentState({
                isLoading: false,
                error: payload.error || "ไม่สามารถเริ่มการชำระเงินได้",
            })
            return
        }

        window.location.href = payload.checkoutUrl
    }

    const isLookupMode = mode === "lookup"
    const successResult = lookupResult.status === "success" ? lookupResult : null
    const modeSwitch = (
        <div className="staff-mode-switch">
            <button
                className={isLookupMode ? "staff-primary-button" : "staff-secondary-button"}
                type="button"
                onClick={() => setMode("lookup")}
            >
                ค้นหาด้วย Pawn ID
            </button>
            <button
                className={!isLookupMode ? "staff-primary-button" : "staff-secondary-button"}
                type="button"
                onClick={() => {
                    setMode("manual")
                    clearLookup()
                }}
            >
                กรอกข้อมูลเอง
            </button>
        </div>
    )

    return (
        <ManualCalculator
            title={
                successResult
                    ? `คำนวณดอกเบี้ยจำนำ รหัส ${successResult.record.pawnId}`
                    : "คำนวณดอกเบี้ยจำนำ"
            }
            titleAction={
                successResult ? (
                    <div className="staff-title-actions">
                        {modeSwitch}
                        <button
                            className="staff-inline-action"
                            type="button"
                            onClick={clearLookup}
                        >
                            ล้างการค้นหา
                        </button>
                    </div>
                ) : (
                    modeSwitch
                )
            }
            headerAction={
                isLookupMode && !successResult ? (
                    <form className="staff-header-search customer-header-search" onSubmit={handleLookupSubmit}>
                        <input
                            className="pawn-control"
                            name="pawnId"
                            placeholder="กรอกเลขใบจำนำ"
                            value={pawnId}
                            onChange={(event) => setPawnId(event.target.value)}
                        />
                        <input
                            className="pawn-control"
                            name="phone"
                            placeholder="กรอกเบอร์โทรศัพท์"
                            value={phone}
                            onChange={(event) => setPhone(event.target.value)}
                        />
                        <button className="staff-primary-button" type="submit">
                            {lookupResult.status === "loading" ? "กำลังค้นหา..." : "ค้นหา"}
                        </button>
                    </form>
                ) : null
            }
            notice={
                <>
                    {lookupResult.status !== "success" &&
                    lookupResult.status !== "idle" &&
                    lookupResult.status !== "loading" ? (
                        <div
                            className={`staff-auth-message ${
                                lookupResult.status === "error" ? "is-error" : ""
                            }`}
                        >
                            {lookupResult.message}
                        </div>
                    ) : null}
                    {paymentState.error ? (
                        <div className="staff-auth-message is-error">
                            {paymentState.error}
                        </div>
                    ) : null}
                </>
            }
            prefilledRecord={successResult?.record ?? null}
            staffLookupViewModel={successResult?.lookupViewModel ?? null}
            lookupAction={
                successResult && props.paymentsEnabled ? (
                    <button
                        className="staff-primary-button"
                        type="button"
                        onClick={handleExtendPayment}
                    >
                        {paymentState.isLoading ? "กำลังเชื่อมไปหน้าชำระเงิน..." : "ชำระต่อดอกออนไลน์"}
                    </button>
                ) : null
            }
        />
    )
}
