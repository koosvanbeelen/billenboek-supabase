"use server"

import { voedingen, luiers, temperaturen } from "@/lib/db/schema"
import { db } from "@/lib/db"
import { vandaagDatum, dagGrenzen } from "@/lib/datum"
import { and, gte, lte } from "drizzle-orm"

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

  // Na elkaar i.p.v. gelijktijdig: zie de toelichting in
  // app/actions/registraties.ts — deze Neon-verbinding blijkt gevoelig
  // voor meerdere gelijktijdige queries.
  const vRows = await db
    .select()
    .from(voedingen)
    .where(and(gte(voedingen.datumTijd, vanDatum), lte(voedingen.datumTijd, totDatum)))
  const lRows = await db
    .select()
    .from(luiers)
    .where(and(gte(luiers.datumTijd, vanDatum), lte(luiers.datumTijd, totDatum)))
  const tRows = await db
    .select()
    .from(temperaturen)
    .where(
      and(gte(temperaturen.datumTijd, vanDatum), lte(temperaturen.datumTijd, totDatum)),
    )

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
    const d = v.datumTijd.toISOString().slice(0, 10)
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
    const d = l.datumTijd.toISOString().slice(0, 10)
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
    const d = t.datumTijd.toISOString().slice(0, 10)
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
