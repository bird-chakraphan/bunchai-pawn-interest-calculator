import { requireActiveStaffContext } from "@/lib/staff-access"

export const dynamic = "force-dynamic"

export default async function StaffProtectedLayout(props: {
    children: React.ReactNode
}) {
    await requireActiveStaffContext()

    return props.children
}
