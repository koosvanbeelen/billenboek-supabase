"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { toggleCheckboxRegel } from "@/lib/notitie-opmaak"
import type { NotitieItem } from "@/lib/types"
import { notitieSchema } from "@/lib/validations"

async function getUserScopedClient() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error("Je moet ingelogd zijn.")
  return { supabase, user }
}

export async function getNotities(): Promise<NotitieItem[]> {
  const { supabase } = await getUserScopedClient()
  const { data, error } = await supabase
    .from("notities")
    .select("id, datum_tijd, notitie")
    .order("datum_tijd", { ascending: false })
  if (error) throw new Error("Notities konden niet worden geladen.")
  return (data ?? []).map((row) => ({
    id: row.id,
    datumTijd: row.datum_tijd,
    notitie: row.notitie,
  }))
}

export async function voegNotitieToe(input: { notitie: string }) {
  const d = notitieSchema.parse(input)
  const { supabase, user } = await getUserScopedClient()
  const { error } = await supabase.from("notities").insert({
    notitie: d.notitie,
    user_id: user.id,
  })
  if (error) throw new Error("Notitie kon niet worden opgeslagen.")
  revalidatePath("/notities")
}

export async function werkNotitieBij(id: number, input: { notitie: string }) {
  const d = notitieSchema.parse(input)
  const { supabase, user } = await getUserScopedClient()
  const { error } = await supabase
    .from("notities")
    .update({ notitie: d.notitie })
    .eq("id", id)
    .eq("user_id", user.id)
  if (error) throw new Error("Notitie kon niet worden bijgewerkt.")
  revalidatePath("/notities")
}

export async function verwijderNotitie(id: number) {
  const { supabase, user } = await getUserScopedClient()
  const { error } = await supabase.from("notities").delete().eq("id", id).eq("user_id", user.id)
  if (error) throw new Error("Notitie kon niet worden verwijderd.")
  revalidatePath("/notities")
}

export async function vinkNotitieRegelAf(id: number, regelIndex: number) {
  const { supabase, user } = await getUserScopedClient()
  const { data: row, error } = await supabase
    .from("notities")
    .select("notitie")
    .eq("id", id)
    .eq("user_id", user.id)
    .single()
  if (error || !row) return

  const nieuweTekst = toggleCheckboxRegel(row.notitie, regelIndex)
  const { error: updateError } = await supabase
    .from("notities")
    .update({ notitie: nieuweTekst })
    .eq("id", id)
    .eq("user_id", user.id)
  if (updateError) throw new Error("Checklist kon niet worden bijgewerkt.")
  revalidatePath("/notities")
}
