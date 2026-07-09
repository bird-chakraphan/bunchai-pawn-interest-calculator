import type { Metadata } from "next"
import { Noto_Sans_Thai } from "next/font/google"
import "./globals.css"

const notoSansThai = Noto_Sans_Thai({
    subsets: ["latin", "thai"],
    weight: ["400", "500", "600", "700", "800", "900"],
    display: "swap",
    variable: "--font-pawn-ui",
})

export const metadata: Metadata = {
    title: "Bunchai Pawn Interest Calculator",
    description: "Manual pawn interest calculation parity app for Phase 1.",
}

export default function RootLayout(props: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="th" className={notoSansThai.variable}>
            <body>{props.children}</body>
        </html>
    )
}
