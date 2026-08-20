export type Soort =
  | "voeding"
  | "luier"
  | "temperatuur"
  | "boertje"
  | "vitamine"
  | "medicatie"
  | "groei"
  | "slapen"
  | "huilen"
  | "kolven"

export type VoedingItem = {
  id: number
  datumTijd: string
  type: "borstvoeding" | "kolfmelk" | "kunstvoeding"
  // "beide" is een legacy-waarde van vóór het bijhouden van de volgorde.
  borst: "links" | "rechts" | "links-rechts" | "rechts-links" | "beide" | null
  duurMinuten: number | null
  hoeveelheidMl: number | null
  notitie: string | null
}

export type LuierItem = {
  id: number
  datumTijd: string
  plas: boolean
  poep: boolean
  schoon: boolean
}

export type TemperatuurItem = {
  id: number
  datumTijd: string
  temperatuur: number
}

export type BoertjeItem = {
  id: number
  datumTijd: string
  notitie: string | null
}

export type VitamineItem = {
  id: number
  datumTijd: string
  vitamineK: boolean
  vitamineD: boolean
}

export type MedicatieItem = {
  id: number
  datumTijd: string
  naam: string
  dosering: string | null
  notitie: string | null
}

export type GroeiItem = {
  id: number
  datumTijd: string
  gewichtKg: number | null
  lengteCm: number | null
  opmerking: string | null
}

export type SlaapItem = {
  id: number
  datumTijd: string // gelijk aan `start`, gebruikt voor tijdlijn-sortering
  start: string
  einde: string
  duurMinuten: number
  locatie: string | null
  notitie: string | null
}

export type HuilItem = {
  id: number
  datumTijd: string // gelijk aan `start`, gebruikt voor tijdlijn-sortering
  start: string
  einde: string
  duurMinuten: number
  oorzaak: string | null
  troost: string | null
}

export type KolfItem = {
  id: number
  datumTijd: string
  borst: "links" | "rechts" | "beide"
  hoeveelheidMl: number
  notitie: string | null
}

export type TijdlijnItem =
  | { soort: "voeding"; id: number; datumTijd: string; record: VoedingItem }
  | { soort: "luier"; id: number; datumTijd: string; record: LuierItem }
  | {
      soort: "temperatuur"
      id: number
      datumTijd: string
      record: TemperatuurItem
    }
  | { soort: "boertje"; id: number; datumTijd: string; record: BoertjeItem }
  | { soort: "vitamine"; id: number; datumTijd: string; record: VitamineItem }
  | {
      soort: "medicatie"
      id: number
      datumTijd: string
      record: MedicatieItem
    }
  | { soort: "groei"; id: number; datumTijd: string; record: GroeiItem }
  | { soort: "slapen"; id: number; datumTijd: string; record: SlaapItem }
  | { soort: "huilen"; id: number; datumTijd: string; record: HuilItem }
  | { soort: "kolven"; id: number; datumTijd: string; record: KolfItem }

export type DagTellers = {
  voedingenAantal: number
  voedingenMinuten: number
  luiersAantal: number
  luiersPoep: number
  luiersPlas: number
  mlGekolfd: number
  slaapMinuten: number
  huilMinuten: number
  // Meest recente voeding/luier over de hele geschiedenis (niet begrensd tot
  // deze dag), als "yyyy-MM-ddTHH:mm" wandkloktijd-string, of null als er
  // nog nooit een geregistreerd is. Gebruikt voor "tijd sinds laatste...".
  laatsteVoeding: string | null
  laatsteLuier: string | null
}

export type DagGegevens = {
  datum: string
  items: TijdlijnItem[]
  tellers: DagTellers
}

export type NotitieItem = {
  id: number
  datumTijd: string
  notitie: string
}
