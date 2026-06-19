import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
    title: "Bunchai Pawn Interest Calculator",
    description: "Manual pawn interest calculation parity app for Phase 1.",
}

export default function RootLayout(props: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="th">
            <body>{props.children}</body>
        </html>
    )
}
