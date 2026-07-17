"use client"

import Link from "next/link"
import * as React from "react"

interface StaffTitleMenuProps {
    signOutAction: (formData: FormData) => void | Promise<void>
}

export function StaffTitleMenu(props: StaffTitleMenuProps) {
    const [isOpen, setIsOpen] = React.useState(false)
    const menuRef = React.useRef<HTMLDivElement | null>(null)

    React.useEffect(() => {
        if (!isOpen) return

        const handlePointerDown = (event: MouseEvent | TouchEvent) => {
            if (!(event.target instanceof Node)) return
            if (menuRef.current?.contains(event.target)) return
            setIsOpen(false)
        }

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setIsOpen(false)
            }
        }

        document.addEventListener("mousedown", handlePointerDown)
        document.addEventListener("touchstart", handlePointerDown)
        document.addEventListener("keydown", handleEscape)

        return () => {
            document.removeEventListener("mousedown", handlePointerDown)
            document.removeEventListener("touchstart", handlePointerDown)
            document.removeEventListener("keydown", handleEscape)
        }
    }, [isOpen])

    return (
        <div
            ref={menuRef}
            className={`staff-title-menu${isOpen ? " is-open" : ""}`}
        >
            {isOpen ? (
                <button
                    aria-label="ปิดเมนูพนักงาน"
                    className="staff-menu-backdrop"
                    type="button"
                    onClick={() => setIsOpen(false)}
                />
            ) : null}

            <button
                aria-expanded={isOpen}
                aria-haspopup="menu"
                aria-label="เปิดเมนูพนักงาน"
                className="staff-menu-button"
                type="button"
                onClick={() => setIsOpen((currentValue) => !currentValue)}
            >
                <span />
                <span />
                <span />
            </button>

            {isOpen ? (
                <div className="pawn-card staff-menu-list" role="menu">
                    <Link
                        className="staff-menu-item"
                        href="/staff/pawn/sync-health"
                        role="menuitem"
                        onClick={() => setIsOpen(false)}
                    >
                        ดูสถานะ sync
                    </Link>
                    <Link
                        className="staff-menu-item"
                        href="/staff/pawn/payments"
                        role="menuitem"
                        onClick={() => setIsOpen(false)}
                    >
                        รายการชำระเงิน
                    </Link>
                    <form action={props.signOutAction}>
                        <button className="staff-menu-item" role="menuitem" type="submit">
                            Sign Out
                        </button>
                    </form>
                </div>
            ) : null}
        </div>
    )
}
