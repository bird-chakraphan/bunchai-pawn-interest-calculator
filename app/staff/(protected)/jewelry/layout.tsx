import { requireServiceAccess } from "@/lib/staff-access"

export default async function JewelryServiceLayout(props: { children: React.ReactNode }) {
    await requireServiceAccess("jewelry")

    return props.children
}
