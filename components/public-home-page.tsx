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
    const [calculatorResetVersion, setCalculatorResetVersion] = React.useState(0)
    const fullPawnId = pawnId ? `I${pawnId}` : ""

    async function handleLookupSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setLookupResult({ status: "loading" })

        const response = await fetch("/api/customer/lookup", {
            method: "POST",
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify({
                pawnId: fullPawnId,
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
            message: "ไม่พบข้อมูลในระบบ กรุณาตรวจสอบเลขใบจำนำและเบอร์โทรศัพท์",
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

    function handleModeChange(nextMode: "lookup" | "manual") {
        if (nextMode === mode) {
            return
        }

        clearLookup()
        setCalculatorResetVersion((currentValue) => currentValue + 1)
        setMode(nextMode)
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
                pawnId: fullPawnId,
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
    const hasLookupError =
        lookupResult.status !== "success" &&
        lookupResult.status !== "idle" &&
        lookupResult.status !== "loading"
    const notice =
        hasLookupError || paymentState.error ? (
            <>
                {hasLookupError ? (
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
        ) : null
    const modeSwitch = (
        <div className="staff-mode-switch">
            <button
                className={isLookupMode ? "staff-primary-button" : "staff-secondary-button"}
                type="button"
                onClick={() => handleModeChange("lookup")}
            >
                ค้นหาด้วยรหัส
            </button>
            <button
                className={!isLookupMode ? "staff-primary-button" : "staff-secondary-button"}
                type="button"
                onClick={() => handleModeChange("manual")}
            >
                กรอกข้อมูล
            </button>
        </div>
    )
    const titleAction = (
        <div className="public-title-actions">
            <div className="pawn-card public-mode-switch-card">{modeSwitch}</div>
        </div>
    )

    return (
        <ManualCalculator
            resetVersion={calculatorResetVersion}
            title="คำนวณดอกเบี้ยจำนำ"
            titleAction={titleAction}
            headerAction={
                isLookupMode && !successResult ? (
                    <div className="pawn-card public-lookup-search-card">
                        <form className="public-lookup-form" onSubmit={handleLookupSubmit}>
                            <div className="pawn-field-row">
                                <label htmlFor="public-pawn-id">
                                    <span>เลขใบจำนำ</span>
                                </label>
                                <input
                                    id="public-pawn-id"
                                    className="pawn-control"
                                    name="pawnId"
                                    placeholder="กรอกตัวเลข 5 ตัวในใบจำนำ"
                                    inputMode="numeric"
                                    maxLength={5}
                                    pattern="[0-9]*"
                                    value={pawnId}
                                    onChange={(event) =>
                                        setPawnId(event.target.value.replace(/\D/g, "").slice(0, 5))
                                    }
                                />
                            </div>
                            <div className="pawn-field-row pawn-field-row-last">
                                <label htmlFor="public-phone">
                                    <span>เบอร์โทรศัพท์</span>
                                </label>
                                <input
                                    id="public-phone"
                                    className="pawn-control"
                                    name="phone"
                                    placeholder="กรอกเบอร์โทรศัพท์"
                                    inputMode="numeric"
                                    value={phone}
                                    onChange={(event) => setPhone(event.target.value)}
                                />
                            </div>
                            <button className="staff-primary-button public-lookup-submit" type="submit">
                                {lookupResult.status === "loading" ? "กำลังค้นหา..." : "ค้นหา"}
                            </button>
                        </form>
                    </div>
                ) : null
            }
            hideCalculatorBody={isLookupMode && !successResult}
            notice={notice}
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
            bottomAction={
                successResult ? (
                    <button
                        className="staff-inline-action public-clear-lookup"
                        type="button"
                        onClick={clearLookup}
                    >
                        ล้างการค้นหา
                    </button>
                ) : null
            }
        />
    )
}
