"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getActiefGezinId } from "@/lib/supabase/gezin"
import { toggleCheckboxRegel } from "@/lib/notitie-opmaak"
import type { NotitieItem } from "@/lib/types"
import { notitieSchema } from "@/lib/validations"
import { notitieFromDb, notitieToDb } from "@/lib/db/mappers"

async function getUserScopedClient() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error("Je moet ingelogd zijn.")
  const gezinId = await getActiefGezinId()
  return { supabase, user, gezinId }
}

export async function getNotities(): Promise<NotitieItem[]> {
  const { supabase, gezinId } = await getUserScopedClient()
  const { data, error } = await supabase
    .from("notities")
    .select("id, datum_tijd, notitie")
    .order("datum_tijd", { ascending: false })
  if (error) throw new Error("Notities konden niet worden geladen.")
  return (data ?? []).map(notitieFromDb)
}

export async function voegNotitieToe(input: { notitie: string }) {
  const d = notitieSchema.parse(input)
  const { supabase, user, gezinId } = await getUserScopedClient()
  const { error } = await supabase.from("notities").insert({
    ...notitieToDb({ notitie: d.notitie }),
    user_id: user.id,
    gezin_id: gezinId,
  })
  if (error) throw new Error("Notitie kon niet worden opgeslagen.")
  revalidatePath("/notities")
}

export async function werkNotitieBij(id: number, input: { notitie: string }) {
  const d = notitieSchema.parse(input)
  const { supabase, user, gezinId } = await getUserScopedClient()
  const { error } = await supabase
    .from("notities")
    .update(notitieToDb({ notitie: d.notitie }))
    .eq("id", id)
    .eq("gezin_id", gezinId)
  if (error) throw new Error("Notitie kon niet worden bijgewerkt.")
  revalidatePath("/notities")
}

export async function verwijderNotitie(id: number) {
  const { supabase, user, gezinId } = await getUserScopedClient()
  const { error } = await supabase.from("notities").delete().eq("id", id).eq("gezin_id", gezinId)
  if (error) throw new Error("Notitie kon niet worden verwijderd.")
  revalidatePath("/notities")
}

export async function vinkNotitieRegelAf(id: number, regelIndex: number) {
  const { supabase, user, gezinId } = await getUserScopedClient()
  const { data: row, error } = await supabase
    .from("notities")
    .select("notitie")
    .eq("id", id)
    .eq("gezin_id", gezinId)
    .single()
  if (error || !row) return

  const nieuweTekst = toggleCheckboxRegel(row.notitie, regelIndex)
  const { error: updateError } = await supabase
    .from("notities")
    .update({ notitie: nieuweTekst })
    .eq("id", id)
    .eq("gezin_id", gezinId)
  if (updateError) throw new Error("Checklist kon niet worden bijgewerkt.")
  revalidatePath("/notities")
}
