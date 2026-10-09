"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { veiligeNext } from "@/lib/auth"
import { getOrigin } from "@/lib/origin"
import { eersteFout, emailSchema, naamSchema, wachtwoordSchema } from "@/lib/account-validatie"

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
  const next = veiligeNext(String(formData.get("next") ?? ""))

  const naam = naamSchema.safeParse(formData.get("naam") ?? "")
  if (!naam.success) return { fout: eersteFout(naam.error) }
  const email = emailSchema.safeParse(String(formData.get("email") ?? "").trim())
  if (!email.success) return { fout: eersteFout(email.error) }
  const wachtwoord = wachtwoordSchema.safeParse(String(formData.get("password") ?? ""))
  if (!wachtwoord.success) return { fout: eersteFout(wachtwoord.error) }

  const supabase = await createClient()
  const origin = await getOrigin()
  const { data, error } = await supabase.auth.signUp({
    email: email.data,
    password: wachtwoord.data,
    options: {
      // De database-trigger handle_new_user maakt hiermee het profiel aan.
      data: { weergavenaam: naam.data },
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
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

// Stap 1 van "wachtwoord vergeten": mail met herstellink aanvragen.
// We melden altijd hetzelfde terug, zodat niet te achterhalen is welke
// e-mailadressen een account hebben.
export async function wachtwoordVergeten(
  _prevState: { fout?: string; succes?: string } | undefined,
  formData: FormData,
): Promise<{ fout?: string; succes?: string }> {
  const email = emailSchema.safeParse(String(formData.get("email") ?? "").trim())
  if (!email.success) return { fout: eersteFout(email.error) }

  const supabase = await createClient()
  const origin = await getOrigin()
  const { error } = await supabase.auth.resetPasswordForEmail(email.data, {
    redirectTo: `${origin}/auth/callback?next=${encodeURIComponent("/wachtwoord-resetten")}`,
  })
  if (error) {
    console.error("[auth] wachtwoord herstel aanvragen mislukt", error.status, error.message)
    if (error.status === 429) {
      return { fout: "Je hebt zojuist al een mail aangevraagd. Probeer het over een minuut opnieuw." }
    }
  }
  return { succes: "Als dit e-mailadres bij een account hoort, is er een mail met een herstellink onderweg." }
}

// Stap 2: nieuw wachtwoord kiezen na het openen van de herstellink (sessie is dan actief).
export async function herstelWachtwoord(
  _prevState: { fout?: string } | undefined,
  formData: FormData,
): Promise<{ fout?: string }> {
  const nieuw = wachtwoordSchema.safeParse(String(formData.get("password") ?? ""))
  if (!nieuw.success) return { fout: eersteFout(nieuw.error) }
  if (nieuw.data !== String(formData.get("bevestig") ?? "")) {
    return { fout: "De twee wachtwoorden zijn niet hetzelfde." }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { fout: "Deze link is verlopen. Vraag een nieuwe aan." }

  const { error } = await supabase.auth.updateUser({ password: nieuw.data })
  if (error) {
    if (error.message.toLowerCase().includes("different")) {
      return { fout: "Kies een ander wachtwoord dan je huidige." }
    }
    console.error("[auth] wachtwoord herstellen mislukt", error.message)
    return { fout: "Wachtwoord wijzigen is niet gelukt. Probeer het opnieuw." }
  }
  redirect("/")
}
