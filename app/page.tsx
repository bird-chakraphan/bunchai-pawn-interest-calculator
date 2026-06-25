import { PublicHomePage } from "@/components/public-home-page"
import { arePaymentsEnabled } from "@/lib/supabase/env"

export default function HomePage() {
    return <PublicHomePage paymentsEnabled={arePaymentsEnabled()} />
}
