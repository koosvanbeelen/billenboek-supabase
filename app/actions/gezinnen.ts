"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getActiefGezinId } from "@/lib/supabase/gezin"

function code() {
  return crypto.randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase()
}

export async function maakGezinAan(naam: string) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) throw new Error("Je sessie is verlopen. Log opnieuw in.")
  const { data, error } = await supabase.rpc("create_family_with_invite", {
    family_name: naam.trim(), invite_code: code(), expires_at: new Date(Date.now() + 30 * 86400000).toISOString(),
  })
  if (error) {
    console.error("[v0] maakGezinAan RPC fout", error)
    throw new Error(process.env.NODE_ENV === "development" ? `Gezin aanmaken mislukt: ${error.message}` : "We konden je gezin niet aanmaken. Probeer het opnieuw.")
  }
  revalidatePath("/", "layout")
  return data as { gezin_id: string; code: string }
}

export async function neemDeelMetCode(value: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("join_family_with_code", { invite_code: value.trim() })
  if (error) {
    console.error("[v0] neemDeelMetCode RPC fout", error)
    throw new Error(process.env.NODE_ENV === "development" ? `Deelnemen mislukt: ${error.message}` : "Deze uitnodigingscode is ongeldig of verlopen.")
  }
  revalidatePath("/", "layout")
  return data as string
}

export async function maakNieuweUitnodiging() {
  const supabase = await createClient()
  const gezinId = await getActiefGezinId()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Niet ingelogd.")
  const inviteCode = code()
  const { error } = await supabase.from("gezin_uitnodigingen").insert({ gezin_id: gezinId, code: inviteCode, aangemaakt_door: user.id, vervalt_op: new Date(Date.now() + 30 * 86400000).toISOString() })
  if (error) throw new Error("Nieuwe code aanmaken lukt niet.")
  revalidatePath("/instellingen")
  return inviteCode
}

export async function laadGezinsgegevens() {
  const supabase = await createClient()
  const gezinId = await getActiefGezinId()
  const [{ data: gezin }, { data: leden }, { data: uitnodigingen }] = await Promise.all([
    supabase.from("gezinnen").select("id, naam").eq("id", gezinId).single(),
    supabase.from("gezin_leden").select("user_id, rol, aangemaakt_op").eq("gezin_id", gezinId).order("aangemaakt_op"),
    supabase.from("gezin_uitnodigingen").select("code, vervalt_op, gebruikt_op").eq("gezin_id", gezinId).order("aangemaakt_op", { ascending: false }).limit(10),
  ])
  return { gezin, leden: leden ?? [], uitnodigingen: uitnodigingen ?? [] }
}
