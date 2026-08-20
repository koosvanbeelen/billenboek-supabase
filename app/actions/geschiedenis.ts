"use server"

import { createClient } from "@/lib/supabase/server"
import { vandaagDatum } from "@/lib/datum"

export type DagSamenvatting = {
  datum: string // "yyyy-MM-dd"
  voedingenAantal: number
  voedingenMinuten: number
  luiersPoep: number
  luiersPlas: number
  gemiddeldeTemperatuur: number | null
}

/**
 * Haalt alle dagen met data op (maximaal 60 dagen terug).
 * Bouwt een samenvatting per dag met voedingen, luiers en gemiddelde temp.
 */
export async function getGeschiedenis(): Promise<DagSamenvatting[]> {
  const vandaag = vandaagDatum()
  const zestigDagenGeleden = new Date(
    new Date(vandaag).getTime() - 60 * 24 * 60 * 60 * 1000
  )
    .toISOString()
    .slice(0, 10)
  const vanDatum = new Date(zestigDagenGeleden + "T00:00:00Z")
  const totDatum = new Date(vandaag + "T23:59:59Z")

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Niet ingelogd")

  const query = async (table: string) => {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq("user_id", user.id)
      .gte("datumTijd", vanDatum.toISOString())
      .lte("datumTijd", totDatum.toISOString())
    if (error) throw error
    return data ?? []
  }

  const vRows = await query("voedingen")
  const lRows = await query("luiers")
  const tRows = await query("temperaturen")

  // Groepeer per dag
  const perDag = new Map<
    string,
    {
      voedingenAantal: number
      voedingenMinuten: number
      luiersPoep: number
      luiersPlas: number
      temperaturen: number[]
    }
  >()

  // Voedingen
  for (const v of vRows) {
    const d = new Date(v.datumTijd).toISOString().slice(0, 10)
    const entry = perDag.get(d) ?? {
      voedingenAantal: 0,
      voedingenMinuten: 0,
      luiersPoep: 0,
      luiersPlas: 0,
      temperaturen: [],
    }
    entry.voedingenAantal++
    if (v.duurMinuten) entry.voedingenMinuten += v.duurMinuten
    perDag.set(d, entry)
  }

  // Luiers
  for (const l of lRows) {
    const d = new Date(l.datumTijd).toISOString().slice(0, 10)
    const entry = perDag.get(d) ?? {
      voedingenAantal: 0,
      voedingenMinuten: 0,
      luiersPoep: 0,
      luiersPlas: 0,
      temperaturen: [],
    }
    if (l.poep) entry.luiersPoep++
    if (l.plas) entry.luiersPlas++
    perDag.set(d, entry)
  }

  // Temperaturen (numeric field wordt als string opgeslagen in Drizzle)
  for (const t of tRows) {
    const d = new Date(t.datumTijd).toISOString().slice(0, 10)
    const entry = perDag.get(d) ?? {
      voedingenAantal: 0,
      voedingenMinuten: 0,
      luiersPoep: 0,
      luiersPlas: 0,
      temperaturen: [],
    }
    const temp = typeof t.temperatuur === "string" 
      ? parseFloat(t.temperatuur) 
      : t.temperatuur
    entry.temperaturen.push(temp)
    perDag.set(d, entry)
  }

  // Sorteer van nieuw naar oud en zet om naar output
  return Array.from(perDag.entries())
    .sort(([dateA], [dateB]) => (dateB as string).localeCompare(dateA as string))
    .map(([datum, data]) => ({
      datum,
      voedingenAantal: data.voedingenAantal,
      voedingenMinuten: data.voedingenMinuten,
      luiersPoep: data.luiersPoep,
      luiersPlas: data.luiersPlas,
      gemiddeldeTemperatuur:
        data.temperaturen.length > 0
          ? Number(
              (
                data.temperaturen.reduce((a, b) => a + b, 0) /
                data.temperaturen.length
              ).toFixed(1)
            )
          : null,
    }))
}
