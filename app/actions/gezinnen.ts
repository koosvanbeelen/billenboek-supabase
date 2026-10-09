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
    const messages: Record<string, string> = {
      already_in_family: "Je bent al aan een gezin gekoppeld.",
      family_name_too_short: "Kies een gezinsnaam van minimaal twee tekens.",
      not_authenticated: "Je sessie is verlopen. Log opnieuw in.",
    }
    throw new Error(messages[error.message] ?? "We konden je gezin niet aanmaken. Probeer het opnieuw.")
  }
  revalidatePath("/", "layout")
  return data as { gezin_id: string; code: string }
}

export async function neemDeelMetCode(value: string) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) throw new Error("Je sessie is verlopen. Log opnieuw in.")
  const { data, error } = await supabase.rpc("join_family_with_code", { invite_code: value.trim() })
  if (error) {
    console.error("[v0] neemDeelMetCode RPC fout", error)
    const messages: Record<string, string> = {
      already_in_family: "Je bent al aan een gezin gekoppeld.",
      invalid_or_expired_code: "Deze uitnodigingscode is ongeldig of verlopen.",
      not_authenticated: "Je sessie is verlopen. Log opnieuw in.",
    }
    throw new Error(messages[error.message] ?? "We konden je niet aan het gezin koppelen. Probeer het opnieuw.")
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
  const vervaltOp = new Date(Date.now() + 30 * 86400000).toISOString()
  const { error } = await supabase.from("gezin_uitnodigingen").insert({ gezin_id: gezinId, code: inviteCode, aangemaakt_door: user.id, vervalt_op: vervaltOp })
  if (error) throw new Error("Nieuwe code aanmaken lukt niet.")
  revalidatePath("/instellingen")
  return { code: inviteCode, vervalt_op: vervaltOp }
}

export type GezinsLid = { user_id: string; rol: string; naam: string | null; ben_ik: boolean }
export type Gezinsgegevens = {
  gezin: { id: string; naam: string } | null
  leden: GezinsLid[]
  ikBenEigenaar: boolean
  actieveCode: { code: string; vervalt_op: string } | null
}

export async function laadGezinsgegevens(): Promise<Gezinsgegevens> {
  const supabase = await createClient()
  const gezinId = await getActiefGezinId()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: gezin }, { data: leden }, { data: uitnodigingen }] = await Promise.all([
    supabase.from("gezinnen").select("id, naam").eq("id", gezinId).single(),
    supabase.from("gezin_leden").select("user_id, rol, aangemaakt_op").eq("gezin_id", gezinId).order("aangemaakt_op"),
    supabase.from("gezin_uitnodigingen").select("code, vervalt_op, gebruikt_op").eq("gezin_id", gezinId).order("aangemaakt_op", { ascending: false }).limit(10),
  ])

  const ledenLijst = leden ?? []
  const { data: profielen } = ledenLijst.length
    ? await supabase.from("profielen").select("user_id, weergavenaam").in("user_id", ledenLijst.map((lid) => lid.user_id))
    : { data: [] as { user_id: string; weergavenaam: string }[] }
  const namen = new Map((profielen ?? []).map((p) => [p.user_id, p.weergavenaam.trim()]))

  const nu = Date.now()
  const actief = (uitnodigingen ?? []).find((u) => !u.gebruikt_op && new Date(u.vervalt_op).getTime() > nu)

  return {
    gezin: gezin ? { id: gezin.id as string, naam: gezin.naam as string } : null,
    leden: ledenLijst.map((lid) => ({
      user_id: lid.user_id as string,
      rol: lid.rol as string,
      naam: namen.get(lid.user_id) || null,
      ben_ik: lid.user_id === user?.id,
    })),
    ikBenEigenaar: ledenLijst.some((lid) => lid.user_id === user?.id && lid.rol === "eigenaar"),
    actieveCode: actief ? { code: actief.code as string, vervalt_op: actief.vervalt_op as string } : null,
  }
}
