"use server"

import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function signInAction(formData: FormData) {
    const email = String(formData.get("email") ?? "").trim()
    const password = String(formData.get("password") ?? "")
    const supabase = await createServerSupabaseClient()

    if (!supabase) {
        redirect("/staff/sign-in?error=supabase-not-configured")
    }

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        redirect(`/staff/sign-in?error=${encodeURIComponent(error.message)}`)
    }

    redirect("/staff")
}

export async function signOutAction() {
    const supabase = await createServerSupabaseClient()

    if (supabase) {
        await supabase.auth.signOut()
    }

    redirect("/staff/sign-in")
}
