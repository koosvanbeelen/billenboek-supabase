"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import {
  eersteFout,
  naamSchema,
  wachtwoordSchema,
  type ActieUitkomst,
} from "@/lib/account-validatie"

export type AccountGegevens = { id: string; email: string; naam: string }

export async function laadAccount(): Promise<AccountGegevens | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from("profielen")
    .select("weergavenaam")
    .eq("user_id", user.id)
    .maybeSingle()
  return { id: user.id, email: user.email ?? "", naam: data?.weergavenaam ?? "" }
}

export async function bewaarNaam(naam: string): Promise<ActieUitkomst> {
  const parsed = naamSchema.safeParse(naam)
  if (!parsed.success) return { ok: false, fout: eersteFout(parsed.error) }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, fout: "Je sessie is verlopen. Log opnieuw in." }

  const { error } = await supabase.from("profielen").upsert({
    user_id: user.id,
    weergavenaam: parsed.data,
    bijgewerkt_op: new Date().toISOString(),
  })
  if (error) {
    console.error("[account] naam opslaan mislukt", error.message)
    return { ok: false, fout: "Naam opslaan is niet gelukt. Probeer het opnieuw." }
  }
  revalidatePath("/instellingen", "layout")
  return { ok: true }
}

export async function wijzigWachtwoord(
  huidig: string,
  nieuw: string,
  bevestig: string,
): Promise<ActieUitkomst> {
  const parsed = wachtwoordSchema.safeParse(nieuw)
  if (!parsed.success) return { ok: false, fout: eersteFout(parsed.error) }
  if (nieuw !== bevestig) return { ok: false, fout: "De twee nieuwe wachtwoorden zijn niet hetzelfde." }
  if (nieuw === huidig) return { ok: false, fout: "Kies een ander wachtwoord dan je huidige." }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return { ok: false, fout: "Je sessie is verlopen. Log opnieuw in." }

  // Opnieuw inloggen bewijst dat het de eigenaar is (en niet iemand met een open telefoon).
  const { error: loginFout } = await supabase.auth.signInWithPassword({ email: user.email, password: huidig })
  if (loginFout) return { ok: false, fout: "Je huidige wachtwoord klopt niet." }

  const { error } = await supabase.auth.updateUser({ password: parsed.data })
  if (error) {
    console.error("[account] wachtwoord wijzigen mislukt", error.message)
    return { ok: false, fout: "Wachtwoord wijzigen is niet gelukt. Probeer het opnieuw." }
  }
  return { ok: true }
}

export async function verwijderAccount(wachtwoord: string): Promise<ActieUitkomst> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return { ok: false, fout: "Je sessie is verlopen. Log opnieuw in." }

  const { error: loginFout } = await supabase.auth.signInWithPassword({ email: user.email, password: wachtwoord })
  if (loginFout) return { ok: false, fout: "Dit wachtwoord klopt niet." }

  const { error } = await supabase.rpc("verwijder_mijn_account")
  if (error) {
    console.error("[account] verwijderen mislukt", error.message)
    return { ok: false, fout: "Je account kon niet worden verwijderd. Er is niets gewijzigd. Probeer het later opnieuw." }
  }

  // De gebruiker bestaat niet meer; alleen de lokale cookies opruimen.
  await supabase.auth.signOut({ scope: "local" }).catch(() => undefined)
  return { ok: true }
}
