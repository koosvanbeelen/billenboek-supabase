"use server"

import { createClient } from "@/lib/supabase/server"

export async function controleerDatabase(): Promise<{
  ok: boolean
  bericht: string
}> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from("notities").select("id").limit(1)
    if (error) throw error
    return { ok: true, bericht: "Verbinding met de database is in orde." }
  } catch {
    return {
      ok: false,
      bericht: "Geen verbinding met de database. Probeer het later opnieuw.",
    }
  }
}
