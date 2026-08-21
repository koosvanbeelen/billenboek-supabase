"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

function veiligeNext(value: string) {
  return value.startsWith("/") && !value.startsWith("//") ? value : "/"
}

export async function inloggen(
  _prevState: { fout?: string } | undefined,
  formData: FormData,
): Promise<{ fout?: string }> {
  const email = String(formData.get("email") ?? "").trim()
  const password = String(formData.get("password") ?? "")
  const next = veiligeNext(String(formData.get("next") ?? ""))
  if (!email || !password) return { fout: "Vul je e-mailadres en wachtwoord in." }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    if (error.message.toLowerCase().includes("confirm")) {
      return { fout: "Bevestig eerst je e-mailadres via de link in je inbox." }
    }
    return { fout: "Ongeldig e-mailadres of wachtwoord." }
  }
  redirect(next)
}

export async function registreren(
  _prevState: { fout?: string; succes?: string } | undefined,
  formData: FormData,
): Promise<{ fout?: string; succes?: string }> {
  const email = String(formData.get("email") ?? "").trim()
  const password = String(formData.get("password") ?? "")
  const next = veiligeNext(String(formData.get("next") ?? ""))
  if (!email || password.length < 8) return { fout: "Gebruik een geldig e-mailadres en minimaal 8 tekens." }

  const supabase = await createClient()
  const requestHeaders = await headers()
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host")
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https"
  const origin = host ? `${protocol}://${host}` : "http://localhost:3000"
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  })
  if (error) return { fout: "Registreren is niet gelukt. Controleer je gegevens." }
  if (data.session) redirect(next)
  return { succes: "Controleer je inbox om je e-mailadres te bevestigen." }
}

export async function uitloggen() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}
