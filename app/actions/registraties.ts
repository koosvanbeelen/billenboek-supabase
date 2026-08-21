"use server"

import { revalidatePath } from "next/cache"
import { createClient as createSupabaseClient } from "@/lib/supabase/server"
import { getActiefGezinId } from "@/lib/supabase/gezin"
import { dagGrenzen, datumNaarInput, duurInMinuten, inputNaarDatum } from "@/lib/datum"
import type {
  BoertjeItem,
  DagGegevens,
  GroeiItem,
  HuilItem,
  KolfItem,
  LuierItem,
  MedicatieItem,
  SlaapItem,
  Soort,
  TemperatuurItem,
  TijdlijnItem,
  VitamineItem,
  VoedingItem,
} from "@/lib/types"
import {
  boertjeSchema,
  groeiSchema,
  huilSchema,
  kolfSchema,
  luierSchema,
  medicatieSchema,
  slaapSchema,
  temperatuurSchema,
  vitamineSchema,
  voedingSchema,
  type BoertjeInput,
  type GroeiInput,
  type HuilInput,
  type KolfInput,
  type LuierInput,
  type MedicatieInput,
  type SlaapInput,
  type TemperatuurInput,
  type VitamineInput,
  type VoedingInput,
} from "@/lib/validations"

function herlaad() {
  revalidatePath("/")
  revalidatePath("/geschiedenis")
}

async function getOwnedClient() {
  const supabase = await createSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Niet ingelogd")
  const gezinId = await getActiefGezinId()
  return { supabase, user, gezinId }
}

async function insertOwn(table: string, values: Record<string, unknown>) {
  const { supabase, user, gezinId } = await getOwnedClient()
  const { error } = await supabase.from(tableName(table)).insert({ ...toDbValues(values), user_id: user.id, gezin_id: gezinId })
  if (error) throw error
}

async function updateOwn(table: string, id: number, values: Record<string, unknown>) {
  const { supabase, gezinId } = await getOwnedClient()
  const { error } = await supabase.from(tableName(table)).update(toDbValues(values)).eq("id", id).eq("gezin_id", gezinId)
  if (error) throw error
}

async function deleteOwn(table: string, id: number) {
  const { supabase, gezinId } = await getOwnedClient()
  const { error } = await supabase.from(tableName(table)).delete().eq("id", id).eq("gezin_id", gezinId)
  if (error) throw error
}

const iso = (d: Date | string) => new Date(d).toISOString()

const tableName = (table: string) => table === "boertjesSpugen" ? "spugen" : table
const columnName = (column: string) => column.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
const toDbValues = (values: Record<string, unknown>) => Object.fromEntries(
  Object.entries(values).map(([key, value]) => [columnName(key), value]),
)
const fromDbRow = (row: Record<string, any>) => Object.fromEntries(
  Object.entries(row).map(([key, value]) => [key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase()), value]),
)

// ---------------------------------------------------------------------------
// Ophalen van een volledige dag
// ---------------------------------------------------------------------------
export async function getDagGegevens(datum: string): Promise<DagGegevens> {
  const { van, tot } = dagGrenzen(datum)
  const { supabase, gezinId } = await getOwnedClient()

  const dagQuery = async (table: string, timeColumn: string): Promise<any[]> => {
    const { data, error } = await supabase
      .from(tableName(table))
      .select("*")
      .eq("gezin_id", gezinId)
      .gte(columnName(timeColumn), van.toISOString())
      .lte(timeColumn, tot.toISOString())
    if (error) throw error
    return (data ?? []).map((row) => fromDbRow(row))
  }

  const vRows = await dagQuery("voedingen", "datumTijd")
  const lRows = await dagQuery("luiers", "datumTijd")
  const tRows = await dagQuery("temperaturen", "datumTijd")
  const bRows = await dagQuery("boertjesSpugen", "datumTijd")
  const viRows = await dagQuery("vitamines", "datumTijd")
  const mRows = await dagQuery("medicatie", "datumTijd")
  const gRows = await dagQuery("groei", "datumTijd")
  const sRows = await dagQuery("slapen", "start")
  const hRows = await dagQuery("huilen", "start")
  const kRows = await dagQuery("kolven", "datumTijd")

  const historyQuery = async (table: string) => {
    const { data, error } = await supabase
      .from(tableName(table))
      .select("datum_tijd")
      .eq("gezin_id", gezinId)
      .order("datum_tijd", { ascending: false })
      .limit(1)
    if (error) throw error
    return (data ?? []).map((row) => fromDbRow(row))
  }
  const laatsteVoedingRij = await historyQuery("voedingen")
  const laatsteLuierRij = await historyQuery("luiers")

  const items: TijdlijnItem[] = []

  for (const r of vRows) {
    items.push({
      soort: "voeding",
      id: r.id,
      datumTijd: iso(r.datumTijd),
      record: {
        id: r.id,
        datumTijd: iso(r.datumTijd),
        type: r.type as VoedingItem["type"],
        borst: r.borst as VoedingItem["borst"],
        duurMinuten: r.duurMinuten,
        hoeveelheidMl: r.hoeveelheidMl,
        notitie: r.notitie,
      },
    })
  }
  for (const r of lRows) {
    items.push({
      soort: "luier",
      id: r.id,
      datumTijd: iso(r.datumTijd),
      record: {
        id: r.id,
        datumTijd: iso(r.datumTijd),
        plas: r.plas,
        poep: r.poep,
        schoon: r.schoon,
      } satisfies LuierItem,
    })
  }
  for (const r of tRows) {
    items.push({
      soort: "temperatuur",
      id: r.id,
      datumTijd: iso(r.datumTijd),
      record: {
        id: r.id,
        datumTijd: iso(r.datumTijd),
        temperatuur: Number(r.temperatuur),
      } satisfies TemperatuurItem,
    })
  }
  for (const r of bRows) {
    items.push({
      soort: "boertje",
      id: r.id,
      datumTijd: iso(r.datumTijd),
      record: {
        id: r.id,
        datumTijd: iso(r.datumTijd),
        notitie: r.notitie,
      } satisfies BoertjeItem,
    })
  }
  for (const r of viRows) {
    items.push({
      soort: "vitamine",
      id: r.id,
      datumTijd: iso(r.datumTijd),
      record: {
        id: r.id,
        datumTijd: iso(r.datumTijd),
        vitamineK: r.vitamineK,
        vitamineD: r.vitamineD,
      } satisfies VitamineItem,
    })
  }
  for (const r of mRows) {
    items.push({
      soort: "medicatie",
      id: r.id,
      datumTijd: iso(r.datumTijd),
      record: {
        id: r.id,
        datumTijd: iso(r.datumTijd),
        naam: r.naam,
        dosering: r.dosering,
        notitie: r.notitie,
      } satisfies MedicatieItem,
    })
  }
  for (const r of gRows) {
    items.push({
      soort: "groei",
      id: r.id,
      datumTijd: iso(r.datumTijd),
      record: {
        id: r.id,
        datumTijd: iso(r.datumTijd),
        gewichtKg: r.gewichtKg !== null ? Number(r.gewichtKg) : null,
        lengteCm: r.lengteCm !== null ? Number(r.lengteCm) : null,
        opmerking: r.opmerking,
      } satisfies GroeiItem,
    })
  }
  for (const r of sRows) {
    items.push({
      soort: "slapen",
      id: r.id,
      datumTijd: iso(r.start),
      record: {
        id: r.id,
        datumTijd: iso(r.start),
        start: iso(r.start),
        einde: iso(r.einde),
        duurMinuten: r.duurMinuten,
        locatie: r.locatie,
        notitie: r.notitie,
      } satisfies SlaapItem,
    })
  }
  for (const r of hRows) {
    items.push({
      soort: "huilen",
      id: r.id,
      datumTijd: iso(r.start),
      record: {
        id: r.id,
        datumTijd: iso(r.start),
        start: iso(r.start),
        einde: iso(r.einde),
        duurMinuten: r.duurMinuten,
        oorzaak: r.oorzaak,
        troost: r.troost,
      } satisfies HuilItem,
    })
  }
  for (const r of kRows) {
    items.push({
      soort: "kolven",
      id: r.id,
      datumTijd: iso(r.datumTijd),
      record: {
        id: r.id,
        datumTijd: iso(r.datumTijd),
        borst: r.borst as KolfItem["borst"],
        hoeveelheidMl: r.hoeveelheidMl,
        notitie: r.notitie,
      } satisfies KolfItem,
    })
  }

  items.sort((a, b) => a.datumTijd.localeCompare(b.datumTijd))

  const tellers: DagGegevens["tellers"] = {
    voedingenAantal: vRows.length,
    voedingenMinuten: vRows.reduce((s, r) => s + (r.duurMinuten ?? 0), 0),
    luiersAantal: lRows.length,
    luiersPoep: lRows.filter((r) => r.poep).length,
    luiersPlas: lRows.filter((r) => r.plas).length,
    mlGekolfd: kRows.reduce((s, r) => s + r.hoeveelheidMl, 0),
    slaapMinuten: sRows.reduce((s, r) => s + r.duurMinuten, 0),
    huilMinuten: hRows.reduce((s, r) => s + r.duurMinuten, 0),
    laatsteVoeding: laatsteVoedingRij[0]
      ? datumNaarInput(laatsteVoedingRij[0].datumTijd)
      : null,
    laatsteLuier: laatsteLuierRij[0]
      ? datumNaarInput(laatsteLuierRij[0].datumTijd)
      : null,
  }

  return { datum, items, tellers }
}

// ---------------------------------------------------------------------------
// Voeding
// ---------------------------------------------------------------------------
export async function voegVoedingToe(input: VoedingInput) {
  const d = voedingSchema.parse(input)
  await insertOwn("voedingen", {
    datumTijd: inputNaarDatum(d.datumTijd).toISOString(),
    type: d.type,
    borst: d.type === "borstvoeding" ? d.borst : null,
    duurMinuten: d.type === "borstvoeding" ? d.duurMinuten ?? null : null,
    hoeveelheidMl: d.type !== "borstvoeding" ? d.hoeveelheidMl ?? null : null,
    notitie: d.notitie || null,
  })
  herlaad()
}

export async function werkVoedingBij(id: number, input: VoedingInput) {
  const d = voedingSchema.parse(input)
  await updateOwn("voedingen", id, {
    datumTijd: inputNaarDatum(d.datumTijd).toISOString(),
    type: d.type,
    borst: d.type === "borstvoeding" ? d.borst : null,
    duurMinuten: d.type === "borstvoeding" ? d.duurMinuten ?? null : null,
    hoeveelheidMl: d.type !== "borstvoeding" ? d.hoeveelheidMl ?? null : null,
    notitie: d.notitie || null,
    bijgewerktOp: new Date().toISOString(),
  })
  herlaad()
}

export async function verwijderVoeding(id: number) {
  await deleteOwn("voedingen", id)
  herlaad()
}

// ---------------------------------------------------------------------------
// Luier
// ---------------------------------------------------------------------------
export async function voegLuierToe(input: LuierInput) {
  const d = luierSchema.parse(input)
  await insertOwn("luiers", {
    datumTijd: inputNaarDatum(d.datumTijd).toISOString(),
    plas: d.plas,
    poep: d.poep,
    schoon: d.schoon,
  })
  herlaad()
}

export async function werkLuierBij(id: number, input: LuierInput) {
  const d = luierSchema.parse(input)
  await updateOwn("luiers", id, {
    datumTijd: inputNaarDatum(d.datumTijd).toISOString(),
    plas: d.plas,
    poep: d.poep,
    schoon: d.schoon,
    bijgewerktOp: new Date().toISOString(),
  })
  herlaad()
}

export async function verwijderLuier(id: number) {
  await deleteOwn("luiers", id)
  herlaad()
}

// ---------------------------------------------------------------------------
// Temperatuur
// ---------------------------------------------------------------------------
export async function voegTemperatuurToe(input: TemperatuurInput) {
  const d = temperatuurSchema.parse(input)
  await insertOwn("temperaturen", {
    datumTijd: inputNaarDatum(d.datumTijd).toISOString(),
    temperatuur: d.temperatuur.toFixed(1),
  })
  herlaad()
}

export async function werkTemperatuurBij(id: number, input: TemperatuurInput) {
  const d = temperatuurSchema.parse(input)
  await updateOwn("temperaturen", id, {
    datumTijd: inputNaarDatum(d.datumTijd).toISOString(),
    temperatuur: d.temperatuur.toFixed(1),
    bijgewerktOp: new Date().toISOString(),
  })
  herlaad()
}

export async function verwijderTemperatuur(id: number) {
  await deleteOwn("temperaturen", id)
  herlaad()
}

// ---------------------------------------------------------------------------
// Boertje / Spugen
// ---------------------------------------------------------------------------
export async function voegBoertjeToe(input: BoertjeInput) {
  const d = boertjeSchema.parse(input)
  await insertOwn("boertjesSpugen", {
    datumTijd: inputNaarDatum(d.datumTijd).toISOString(),
    notitie: d.notitie || null,
  })
  herlaad()
}

export async function werkBoertjeBij(id: number, input: BoertjeInput) {
  const d = boertjeSchema.parse(input)
  await updateOwn("boertjesSpugen", id, {
    datumTijd: inputNaarDatum(d.datumTijd).toISOString(),
    notitie: d.notitie || null,
    bijgewerktOp: new Date().toISOString(),
  })
  herlaad()
}

export async function verwijderBoertje(id: number) {
  await deleteOwn("boertjesSpugen", id)
  herlaad()
}

export async function voegSpugenToe(input: BoertjeInput) {
  return voegBoertjeToe(input)
}

export async function werkSpugenBij(id: number, input: BoertjeInput) {
  return werkBoertjeBij(id, input)
}

// ---------------------------------------------------------------------------
// Vitamines
// ---------------------------------------------------------------------------
export async function voegVitamineToe(input: VitamineInput) {
  const d = vitamineSchema.parse(input)
  await insertOwn("vitamines", {
    datumTijd: inputNaarDatum(d.datumTijd).toISOString(),
    vitamineK: d.vitamineK,
    vitamineD: d.vitamineD,
  })
  herlaad()
}

export async function werkVitamineBij(id: number, input: VitamineInput) {
  const d = vitamineSchema.parse(input)
  await updateOwn("vitamines", id, {
    datumTijd: inputNaarDatum(d.datumTijd).toISOString(),
    vitamineK: d.vitamineK,
    vitamineD: d.vitamineD,
    bijgewerktOp: new Date().toISOString(),
  })
  herlaad()
}

export async function verwijderVitamine(id: number) {
  await deleteOwn("vitamines", id)
  herlaad()
}

// ---------------------------------------------------------------------------
// Medicatie
// ---------------------------------------------------------------------------
export async function voegMedicatieToe(input: MedicatieInput) {
  const d = medicatieSchema.parse(input)
  await insertOwn("medicatie", {
    datumTijd: inputNaarDatum(d.datumTijd).toISOString(),
    naam: d.naam,
    dosering: d.dosering || null,
    notitie: d.notitie || null,
  })
  herlaad()
}

export async function werkMedicatieBij(id: number, input: MedicatieInput) {
  const d = medicatieSchema.parse(input)
  await updateOwn("medicatie", id, {
    datumTijd: inputNaarDatum(d.datumTijd).toISOString(),
    naam: d.naam,
    dosering: d.dosering || null,
    notitie: d.notitie || null,
    bijgewerktOp: new Date().toISOString(),
  })
  herlaad()
}

export async function verwijderMedicatie(id: number) {
  await deleteOwn("medicatie", id)
  herlaad()
}

// ---------------------------------------------------------------------------
// Groei
// ---------------------------------------------------------------------------
export async function voegGroeiToe(input: GroeiInput) {
  const d = groeiSchema.parse(input)
  await insertOwn("groei", {
    datumTijd: inputNaarDatum(d.datumTijd).toISOString(),
    gewichtKg: d.gewichtKg !== undefined ? d.gewichtKg.toFixed(2) : null,
    lengteCm: d.lengteCm !== undefined ? d.lengteCm.toFixed(1) : null,
    opmerking: d.opmerking || null,
  })
  herlaad()
}

export async function werkGroeiBij(id: number, input: GroeiInput) {
  const d = groeiSchema.parse(input)
  await updateOwn("groei", id, {
    datumTijd: inputNaarDatum(d.datumTijd).toISOString(),
    gewichtKg: d.gewichtKg !== undefined ? d.gewichtKg.toFixed(2) : null,
    lengteCm: d.lengteCm !== undefined ? d.lengteCm.toFixed(1) : null,
    opmerking: d.opmerking || null,
    bijgewerktOp: new Date().toISOString(),
  })
  herlaad()
}

export async function verwijderGroei(id: number) {
  await deleteOwn("groei", id)
  herlaad()
}

// ---------------------------------------------------------------------------
// Slapen
// ---------------------------------------------------------------------------
export async function voegSlaapToe(input: SlaapInput) {
  const d = slaapSchema.parse(input)
  await insertOwn("slapen", {
    start: inputNaarDatum(d.start).toISOString(),
    einde: inputNaarDatum(d.einde).toISOString(),
    duurMinuten: duurInMinuten(d.start, d.einde),
    locatie: d.locatie || null,
    notitie: d.notitie || null,
  })
  herlaad()
}

export async function werkSlaapBij(id: number, input: SlaapInput) {
  const d = slaapSchema.parse(input)
  await updateOwn("slapen", id, {
    start: inputNaarDatum(d.start).toISOString(),
    einde: inputNaarDatum(d.einde).toISOString(),
    duurMinuten: duurInMinuten(d.start, d.einde),
    locatie: d.locatie || null,
    notitie: d.notitie || null,
    bijgewerktOp: new Date().toISOString(),
  })
  herlaad()
}

export async function verwijderSlaap(id: number) {
  await deleteOwn("slapen", id)
  herlaad()
}

// ---------------------------------------------------------------------------
// Huilen
// ---------------------------------------------------------------------------
export async function voegHuilToe(input: HuilInput) {
  const d = huilSchema.parse(input)
  await insertOwn("huilen", {
    start: inputNaarDatum(d.start).toISOString(),
    einde: inputNaarDatum(d.einde).toISOString(),
    duurMinuten: duurInMinuten(d.start, d.einde),
    oorzaak: d.oorzaak || null,
    troost: d.troost || null,
  })
  herlaad()
}

export async function werkHuilBij(id: number, input: HuilInput) {
  const d = huilSchema.parse(input)
  await updateOwn("huilen", id, {
    start: inputNaarDatum(d.start).toISOString(),
    einde: inputNaarDatum(d.einde).toISOString(),
    duurMinuten: duurInMinuten(d.start, d.einde),
    oorzaak: d.oorzaak || null,
    troost: d.troost || null,
    bijgewerktOp: new Date().toISOString(),
  })
  herlaad()
}

export async function verwijderHuil(id: number) {
  await deleteOwn("huilen", id)
  herlaad()
}

// ---------------------------------------------------------------------------
// Kolven
// ---------------------------------------------------------------------------
export async function voegKolfToe(input: KolfInput) {
  const d = kolfSchema.parse(input)
  await insertOwn("kolven", {
    datumTijd: inputNaarDatum(d.datumTijd).toISOString(),
    borst: d.borst,
    hoeveelheidMl: d.hoeveelheidMl,
    notitie: d.notitie || null,
  })
  herlaad()
}

export async function werkKolfBij(id: number, input: KolfInput) {
  const d = kolfSchema.parse(input)
  await updateOwn("kolven", id, {
    datumTijd: inputNaarDatum(d.datumTijd).toISOString(),
    borst: d.borst,
    hoeveelheidMl: d.hoeveelheidMl,
    notitie: d.notitie || null,
    bijgewerktOp: new Date().toISOString(),
  })
  herlaad()
}

export async function verwijderKolf(id: number) {
  await deleteOwn("kolven", id)
  herlaad()
}

// ---------------------------------------------------------------------------
// Algemene verwijderfunctie op basis van soort
// ---------------------------------------------------------------------------
export async function verwijderRegistratie(soort: Soort, id: number) {
  switch (soort) {
    case "voeding":
  await deleteOwn("voedingen", id)
      break
    case "luier":
await deleteOwn("luiers", id)
      break
    case "temperatuur":
await deleteOwn("temperaturen", id)
      break
    case "boertje":
await deleteOwn("boertjesSpugen", id)
      break
    case "vitamine":
await deleteOwn("vitamines", id)
      break
    case "medicatie":
await deleteOwn("medicatie", id)
      break
    case "groei":
await deleteOwn("groei", id)
      break
    case "slapen":
await deleteOwn("slapen", id)
      break
    case "huilen":
await deleteOwn("huilen", id)
      break
    case "kolven":
await deleteOwn("kolven", id)
      break
  }
  herlaad()
}
