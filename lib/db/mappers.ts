import type {
  BoertjeItem,
  GroeiItem,
  HuilItem,
  KolfItem,
  LuierItem,
  MedicatieItem,
  SlaapItem,
  TemperatuurItem,
  VitamineItem,
  VoedingItem,
} from "@/lib/types"

type DbRow = Record<string, any>

const toIso = (value: string | Date | null | undefined): string => new Date(value ?? 0).toISOString()

export const voedingFromDb = (row: DbRow): VoedingItem => ({ id: row.id, datumTijd: toIso(row.datum_tijd), type: row.type, borst: row.borst, duurMinuten: row.duur_minuten, hoeveelheidMl: row.hoeveelheid_ml, notitie: row.notitie })
export const voedingToDb = (row: DbRow) => ({ datum_tijd: row.datumTijd, type: row.type, borst: row.borst, duur_minuten: row.duurMinuten, hoeveelheid_ml: row.hoeveelheidMl, notitie: row.notitie })

export const luierFromDb = (row: DbRow): LuierItem => ({ id: row.id, datumTijd: toIso(row.datum_tijd), plas: row.plas, poep: row.poep, schoon: row.schoon })
export const luierToDb = (row: DbRow) => ({ datum_tijd: row.datumTijd, plas: row.plas, poep: row.poep, schoon: row.schoon })

export const temperatuurFromDb = (row: DbRow): TemperatuurItem => ({ id: row.id, datumTijd: toIso(row.datum_tijd), temperatuur: Number(row.temperatuur) })
export const temperatuurToDb = (row: DbRow) => ({ datum_tijd: row.datumTijd, temperatuur: row.temperatuur })

export const boertjeFromDb = (row: DbRow): BoertjeItem => ({ id: row.id, datumTijd: toIso(row.datum_tijd), notitie: row.notitie })
export const boertjeToDb = (row: DbRow) => ({ datum_tijd: row.datumTijd, notitie: row.notitie })

export const vitamineFromDb = (row: DbRow): VitamineItem => ({ id: row.id, datumTijd: toIso(row.datum_tijd), vitamineK: row.vitamine_k, vitamineD: row.vitamine_d })
export const vitamineToDb = (row: DbRow) => ({ datum_tijd: row.datumTijd, vitamine_k: row.vitamineK, vitamine_d: row.vitamineD })

export const medicatieFromDb = (row: DbRow): MedicatieItem => ({ id: row.id, datumTijd: toIso(row.datum_tijd), naam: row.naam, dosering: row.dosering, notitie: row.notitie })
export const medicatieToDb = (row: DbRow) => ({ datum_tijd: row.datumTijd, naam: row.naam, dosering: row.dosering, notitie: row.notitie })

export const groeiFromDb = (row: DbRow): GroeiItem => ({ id: row.id, datumTijd: toIso(row.datum_tijd), gewichtKg: row.gewicht_kg == null ? null : Number(row.gewicht_kg), lengteCm: row.lengte_cm == null ? null : Number(row.lengte_cm), opmerking: row.opmerking })
export const groeiToDb = (row: DbRow) => ({ datum_tijd: row.datumTijd, gewicht_kg: row.gewichtKg, lengte_cm: row.lengteCm, opmerking: row.opmerking })

export const slaapFromDb = (row: DbRow): SlaapItem => ({ id: row.id, datumTijd: toIso(row.start), start: toIso(row.start), einde: toIso(row.einde), duurMinuten: row.duur_minuten, locatie: row.locatie, notitie: row.notitie })
export const slaapToDb = (row: DbRow) => ({ start: row.start, einde: row.einde, duur_minuten: row.duurMinuten, locatie: row.locatie, notitie: row.notitie })

export const huilFromDb = (row: DbRow): HuilItem => ({ id: row.id, datumTijd: toIso(row.start), start: toIso(row.start), einde: toIso(row.einde), duurMinuten: row.duur_minuten, oorzaak: row.oorzaak, troost: row.troost })
export const huilToDb = (row: DbRow) => ({ start: row.start, einde: row.einde, duur_minuten: row.duurMinuten, oorzaak: row.oorzaak, troost: row.troost })

export const kolfFromDb = (row: DbRow): KolfItem => ({ id: row.id, datumTijd: toIso(row.datum_tijd), borst: row.borst, hoeveelheidMl: row.hoeveelheid_ml, notitie: row.notitie })
export const kolfToDb = (row: DbRow) => ({ datum_tijd: row.datumTijd, borst: row.borst, hoeveelheid_ml: row.hoeveelheidMl, notitie: row.notitie })

export const notitieFromDb = (row: DbRow) => ({ id: row.id, datumTijd: toIso(row.datum_tijd), notitie: row.notitie })
export const notitieToDb = (row: DbRow) => ({ ...(row.datumTijd !== undefined ? { datum_tijd: row.datumTijd } : {}), notitie: row.notitie })

export const tableMappers = {
  voedingen: { fromDb: voedingFromDb, toDb: voedingToDb },
  luiers: { fromDb: luierFromDb, toDb: luierToDb },
  temperaturen: { fromDb: temperatuurFromDb, toDb: temperatuurToDb },
  spugen: { fromDb: boertjeFromDb, toDb: boertjeToDb },
  vitamines: { fromDb: vitamineFromDb, toDb: vitamineToDb },
  medicatie: { fromDb: medicatieFromDb, toDb: medicatieToDb },
  groei: { fromDb: groeiFromDb, toDb: groeiToDb },
  slapen: { fromDb: slaapFromDb, toDb: slaapToDb },
  huilen: { fromDb: huilFromDb, toDb: huilToDb },
  kolven: { fromDb: kolfFromDb, toDb: kolfToDb },
} as const

export type MappedTable = keyof typeof tableMappers

export const toDbRow = (table: string, row: DbRow) => ({
  ...tableMappers[table as MappedTable].toDb(row),
  ...(row.bijgewerktOp !== undefined ? { bijgewerkt_op: row.bijgewerktOp } : {}),
})
export const fromDbRow = (table: string, row: DbRow) => tableMappers[table as MappedTable].fromDb(row)
