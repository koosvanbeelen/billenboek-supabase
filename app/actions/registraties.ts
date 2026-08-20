"use server"

import { and, desc, eq, gte, lte } from "drizzle-orm"
import type { AnyPgColumn } from "drizzle-orm/pg-core"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import {
  boertjesSpugen,
  groei,
  huilen,
  kolven,
  luiers,
  medicatie,
  slapen,
  temperaturen,
  vitamines,
  voedingen,
} from "@/lib/db/schema"
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

const iso = (d: Date) => d.toISOString()

// ---------------------------------------------------------------------------
// Ophalen van een volledige dag
// ---------------------------------------------------------------------------
export async function getDagGegevens(datum: string): Promise<DagGegevens> {
  const { van, tot } = dagGrenzen(datum)

  const binnen = (kolom: AnyPgColumn<{ data: Date }>) =>
    and(gte(kolom, van), lte(kolom, tot))

  // Alles na elkaar i.p.v. via Promise.all: gelijktijdige queries (zelfs
  // maar een stuk of 10) bleken de Neon-verbinding te overbelasten, met een
  // schijnbaar willekeurige query die dan faalde. Sequentieel ophalen kost
  // wat milliseconden meer, maar is voor deze schaal (één gezin) volledig
  // verwaarloosbaar en voorkomt dit probleem structureel.
  const vRows = await db.select().from(voedingen).where(binnen(voedingen.datumTijd))
  const lRows = await db.select().from(luiers).where(binnen(luiers.datumTijd))
  const tRows = await db
    .select()
    .from(temperaturen)
    .where(binnen(temperaturen.datumTijd))
  const bRows = await db
    .select()
    .from(boertjesSpugen)
    .where(binnen(boertjesSpugen.datumTijd))
  const viRows = await db.select().from(vitamines).where(binnen(vitamines.datumTijd))
  const mRows = await db.select().from(medicatie).where(binnen(medicatie.datumTijd))
  const gRows = await db.select().from(groei).where(binnen(groei.datumTijd))
  const sRows = await db.select().from(slapen).where(binnen(slapen.start))
  const hRows = await db.select().from(huilen).where(binnen(huilen.start))
  const kRows = await db.select().from(kolven).where(binnen(kolven.datumTijd))

  // Meest recente voeding/luier over de hele geschiedenis (niet begrensd
  // tot deze dag), voor de "tijd sinds laatste..."-tellers.
  const laatsteVoedingRij = await db
    .select({ datumTijd: voedingen.datumTijd })
    .from(voedingen)
    .orderBy(desc(voedingen.datumTijd))
    .limit(1)
  const laatsteLuierRij = await db
    .select({ datumTijd: luiers.datumTijd })
    .from(luiers)
    .orderBy(desc(luiers.datumTijd))
    .limit(1)

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
  await db.insert(voedingen).values({
    datumTijd: inputNaarDatum(d.datumTijd),
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
  await db
    .update(voedingen)
    .set({
      datumTijd: inputNaarDatum(d.datumTijd),
      type: d.type,
      borst: d.type === "borstvoeding" ? d.borst : null,
      duurMinuten: d.type === "borstvoeding" ? d.duurMinuten ?? null : null,
      hoeveelheidMl: d.type !== "borstvoeding" ? d.hoeveelheidMl ?? null : null,
      notitie: d.notitie || null,
      bijgewerktOp: new Date(),
    })
    .where(eq(voedingen.id, id))
  herlaad()
}

export async function verwijderVoeding(id: number) {
  await db.delete(voedingen).where(eq(voedingen.id, id))
  herlaad()
}

// ---------------------------------------------------------------------------
// Luier
// ---------------------------------------------------------------------------
export async function voegLuierToe(input: LuierInput) {
  const d = luierSchema.parse(input)
  await db.insert(luiers).values({
    datumTijd: inputNaarDatum(d.datumTijd),
    plas: d.plas,
    poep: d.poep,
    schoon: d.schoon,
  })
  herlaad()
}

export async function werkLuierBij(id: number, input: LuierInput) {
  const d = luierSchema.parse(input)
  await db
    .update(luiers)
    .set({
      datumTijd: inputNaarDatum(d.datumTijd),
      plas: d.plas,
      poep: d.poep,
      schoon: d.schoon,
      bijgewerktOp: new Date(),
    })
    .where(eq(luiers.id, id))
  herlaad()
}

export async function verwijderLuier(id: number) {
  await db.delete(luiers).where(eq(luiers.id, id))
  herlaad()
}

// ---------------------------------------------------------------------------
// Temperatuur
// ---------------------------------------------------------------------------
export async function voegTemperatuurToe(input: TemperatuurInput) {
  const d = temperatuurSchema.parse(input)
  await db.insert(temperaturen).values({
    datumTijd: inputNaarDatum(d.datumTijd),
    temperatuur: d.temperatuur.toFixed(1),
  })
  herlaad()
}

export async function werkTemperatuurBij(id: number, input: TemperatuurInput) {
  const d = temperatuurSchema.parse(input)
  await db
    .update(temperaturen)
    .set({
      datumTijd: inputNaarDatum(d.datumTijd),
      temperatuur: d.temperatuur.toFixed(1),
      bijgewerktOp: new Date(),
    })
    .where(eq(temperaturen.id, id))
  herlaad()
}

export async function verwijderTemperatuur(id: number) {
  await db.delete(temperaturen).where(eq(temperaturen.id, id))
  herlaad()
}

// ---------------------------------------------------------------------------
// Boertje / Spugen
// ---------------------------------------------------------------------------
export async function voegBoertjeToe(input: BoertjeInput) {
  const d = boertjeSchema.parse(input)
  await db.insert(boertjesSpugen).values({
    datumTijd: inputNaarDatum(d.datumTijd),
    notitie: d.notitie || null,
  })
  herlaad()
}

export async function werkBoertjeBij(id: number, input: BoertjeInput) {
  const d = boertjeSchema.parse(input)
  await db
    .update(boertjesSpugen)
    .set({
      datumTijd: inputNaarDatum(d.datumTijd),
      notitie: d.notitie || null,
      bijgewerktOp: new Date(),
    })
    .where(eq(boertjesSpugen.id, id))
  herlaad()
}

export async function verwijderBoertje(id: number) {
  await db.delete(boertjesSpugen).where(eq(boertjesSpugen.id, id))
  herlaad()
}

// ---------------------------------------------------------------------------
// Vitamines
// ---------------------------------------------------------------------------
export async function voegVitamineToe(input: VitamineInput) {
  const d = vitamineSchema.parse(input)
  await db.insert(vitamines).values({
    datumTijd: inputNaarDatum(d.datumTijd),
    vitamineK: d.vitamineK,
    vitamineD: d.vitamineD,
  })
  herlaad()
}

export async function werkVitamineBij(id: number, input: VitamineInput) {
  const d = vitamineSchema.parse(input)
  await db
    .update(vitamines)
    .set({
      datumTijd: inputNaarDatum(d.datumTijd),
      vitamineK: d.vitamineK,
      vitamineD: d.vitamineD,
      bijgewerktOp: new Date(),
    })
    .where(eq(vitamines.id, id))
  herlaad()
}

export async function verwijderVitamine(id: number) {
  await db.delete(vitamines).where(eq(vitamines.id, id))
  herlaad()
}

// ---------------------------------------------------------------------------
// Medicatie
// ---------------------------------------------------------------------------
export async function voegMedicatieToe(input: MedicatieInput) {
  const d = medicatieSchema.parse(input)
  await db.insert(medicatie).values({
    datumTijd: inputNaarDatum(d.datumTijd),
    naam: d.naam,
    dosering: d.dosering || null,
    notitie: d.notitie || null,
  })
  herlaad()
}

export async function werkMedicatieBij(id: number, input: MedicatieInput) {
  const d = medicatieSchema.parse(input)
  await db
    .update(medicatie)
    .set({
      datumTijd: inputNaarDatum(d.datumTijd),
      naam: d.naam,
      dosering: d.dosering || null,
      notitie: d.notitie || null,
      bijgewerktOp: new Date(),
    })
    .where(eq(medicatie.id, id))
  herlaad()
}

export async function verwijderMedicatie(id: number) {
  await db.delete(medicatie).where(eq(medicatie.id, id))
  herlaad()
}

// ---------------------------------------------------------------------------
// Groei
// ---------------------------------------------------------------------------
export async function voegGroeiToe(input: GroeiInput) {
  const d = groeiSchema.parse(input)
  await db.insert(groei).values({
    datumTijd: inputNaarDatum(d.datumTijd),
    gewichtKg: d.gewichtKg !== undefined ? d.gewichtKg.toFixed(2) : null,
    lengteCm: d.lengteCm !== undefined ? d.lengteCm.toFixed(1) : null,
    opmerking: d.opmerking || null,
  })
  herlaad()
}

export async function werkGroeiBij(id: number, input: GroeiInput) {
  const d = groeiSchema.parse(input)
  await db
    .update(groei)
    .set({
      datumTijd: inputNaarDatum(d.datumTijd),
      gewichtKg: d.gewichtKg !== undefined ? d.gewichtKg.toFixed(2) : null,
      lengteCm: d.lengteCm !== undefined ? d.lengteCm.toFixed(1) : null,
      opmerking: d.opmerking || null,
      bijgewerktOp: new Date(),
    })
    .where(eq(groei.id, id))
  herlaad()
}

export async function verwijderGroei(id: number) {
  await db.delete(groei).where(eq(groei.id, id))
  herlaad()
}

// ---------------------------------------------------------------------------
// Slapen
// ---------------------------------------------------------------------------
export async function voegSlaapToe(input: SlaapInput) {
  const d = slaapSchema.parse(input)
  await db.insert(slapen).values({
    start: inputNaarDatum(d.start),
    einde: inputNaarDatum(d.einde),
    duurMinuten: duurInMinuten(d.start, d.einde),
    locatie: d.locatie || null,
    notitie: d.notitie || null,
  })
  herlaad()
}

export async function werkSlaapBij(id: number, input: SlaapInput) {
  const d = slaapSchema.parse(input)
  await db
    .update(slapen)
    .set({
      start: inputNaarDatum(d.start),
      einde: inputNaarDatum(d.einde),
      duurMinuten: duurInMinuten(d.start, d.einde),
      locatie: d.locatie || null,
      notitie: d.notitie || null,
      bijgewerktOp: new Date(),
    })
    .where(eq(slapen.id, id))
  herlaad()
}

export async function verwijderSlaap(id: number) {
  await db.delete(slapen).where(eq(slapen.id, id))
  herlaad()
}

// ---------------------------------------------------------------------------
// Huilen
// ---------------------------------------------------------------------------
export async function voegHuilToe(input: HuilInput) {
  const d = huilSchema.parse(input)
  await db.insert(huilen).values({
    start: inputNaarDatum(d.start),
    einde: inputNaarDatum(d.einde),
    duurMinuten: duurInMinuten(d.start, d.einde),
    oorzaak: d.oorzaak || null,
    troost: d.troost || null,
  })
  herlaad()
}

export async function werkHuilBij(id: number, input: HuilInput) {
  const d = huilSchema.parse(input)
  await db
    .update(huilen)
    .set({
      start: inputNaarDatum(d.start),
      einde: inputNaarDatum(d.einde),
      duurMinuten: duurInMinuten(d.start, d.einde),
      oorzaak: d.oorzaak || null,
      troost: d.troost || null,
      bijgewerktOp: new Date(),
    })
    .where(eq(huilen.id, id))
  herlaad()
}

export async function verwijderHuil(id: number) {
  await db.delete(huilen).where(eq(huilen.id, id))
  herlaad()
}

// ---------------------------------------------------------------------------
// Kolven
// ---------------------------------------------------------------------------
export async function voegKolfToe(input: KolfInput) {
  const d = kolfSchema.parse(input)
  await db.insert(kolven).values({
    datumTijd: inputNaarDatum(d.datumTijd),
    borst: d.borst,
    hoeveelheidMl: d.hoeveelheidMl,
    notitie: d.notitie || null,
  })
  herlaad()
}

export async function werkKolfBij(id: number, input: KolfInput) {
  const d = kolfSchema.parse(input)
  await db
    .update(kolven)
    .set({
      datumTijd: inputNaarDatum(d.datumTijd),
      borst: d.borst,
      hoeveelheidMl: d.hoeveelheidMl,
      notitie: d.notitie || null,
      bijgewerktOp: new Date(),
    })
    .where(eq(kolven.id, id))
  herlaad()
}

export async function verwijderKolf(id: number) {
  await db.delete(kolven).where(eq(kolven.id, id))
  herlaad()
}

// ---------------------------------------------------------------------------
// Algemene verwijderfunctie op basis van soort
// ---------------------------------------------------------------------------
export async function verwijderRegistratie(soort: Soort, id: number) {
  switch (soort) {
    case "voeding":
      await db.delete(voedingen).where(eq(voedingen.id, id))
      break
    case "luier":
      await db.delete(luiers).where(eq(luiers.id, id))
      break
    case "temperatuur":
      await db.delete(temperaturen).where(eq(temperaturen.id, id))
      break
    case "boertje":
      await db.delete(boertjesSpugen).where(eq(boertjesSpugen.id, id))
      break
    case "vitamine":
      await db.delete(vitamines).where(eq(vitamines.id, id))
      break
    case "medicatie":
      await db.delete(medicatie).where(eq(medicatie.id, id))
      break
    case "groei":
      await db.delete(groei).where(eq(groei.id, id))
      break
    case "slapen":
      await db.delete(slapen).where(eq(slapen.id, id))
      break
    case "huilen":
      await db.delete(huilen).where(eq(huilen.id, id))
      break
    case "kolven":
      await db.delete(kolven).where(eq(kolven.id, id))
      break
  }
  herlaad()
}
