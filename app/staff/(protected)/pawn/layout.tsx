import { requireServiceAccess } from "@/lib/staff-access"

export default async function PawnServiceLayout(props: { children: React.ReactNode }) {
    await requireServiceAccess("pawn")

    return props.children
}
