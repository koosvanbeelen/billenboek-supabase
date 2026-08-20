"use client"

import { useCallback, useEffect, useState } from "react"
import type { Soort } from "@/lib/types"

const OPSLAG_SLEUTEL = "billenboek:zichtbare-formulieren"
const WIJZIG_EVENT = "billenboek:zichtbare-formulieren-wijziging"

// Alle bestaande soorten. Nieuwe soorten hier toevoegen zodra ze bestaan.
export const ALLE_SOORTEN: Soort[] = [
  "voeding",
  "luier",
  "temperatuur",
  "boertje",
  "vitamine",
  "medicatie",
  "groei",
  "slapen",
  "huilen",
  "kolven",
]

export type ZichtbareFormulieren = Record<Soort, boolean>

// Standaard staat alles aan: een bestaande gebruiker ziet na deze update
// dezelfde knoppen als voorheen, plus de vier nieuwe. Uitzetten is een
// bewuste keuze via Instellingen.
export const STANDAARD_ZICHTBARE_FORMULIEREN: ZichtbareFormulieren =
  Object.fromEntries(ALLE_SOORTEN.map((s) => [s, true])) as ZichtbareFormulieren

function isGeldigeWaarde(waarde: unknown): waarde is ZichtbareFormulieren {
  if (typeof waarde !== "object" || waarde === null) return false
  return ALLE_SOORTEN.every(
    (s) => typeof (waarde as Record<string, unknown>)[s] === "boolean",
  )
}

function leesOpgeslagenWaarde(): ZichtbareFormulieren {
  if (typeof window === "undefined") return STANDAARD_ZICHTBARE_FORMULIEREN
  try {
    const ruw = window.localStorage.getItem(OPSLAG_SLEUTEL)
    if (!ruw) return STANDAARD_ZICHTBARE_FORMULIEREN
    const geparsed = JSON.parse(ruw)
    // Vul ontbrekende (nieuwe) soorten aan met de standaardwaarde (aan),
    // zodat een oudere opgeslagen voorkeur geen nieuwe soorten verbergt.
    const aangevuld = { ...STANDAARD_ZICHTBARE_FORMULIEREN, ...geparsed }
    return isGeldigeWaarde(aangevuld) ? aangevuld : STANDAARD_ZICHTBARE_FORMULIEREN
  } catch {
    return STANDAARD_ZICHTBARE_FORMULIEREN
  }
}

/**
 * Voorkeur voor welke formulieren/registratiesoorten actief zijn. Gebruikers
 * kunnen dit per apparaat instellen via Instellingen. Uitgezette soorten
 * verdwijnen uit de actieknoppen op "Vandaag" en "Geschiedenis", maar
 * bestaande registraties van dat soort blijven gewoon zichtbaar en
 * bewerkbaar in de tijdlijn.
 */
export function useZichtbareFormulieren(): [
  ZichtbareFormulieren,
  (soort: Soort, aan: boolean) => void,
] {
  const [waarde, setWaardeState] = useState<ZichtbareFormulieren>(
    STANDAARD_ZICHTBARE_FORMULIEREN,
  )

  useEffect(() => {
    setWaardeState(leesOpgeslagenWaarde())

    function opWijziging(event: Event) {
      const detail = (event as CustomEvent<ZichtbareFormulieren>).detail
      if (isGeldigeWaarde(detail)) setWaardeState(detail)
    }

    window.addEventListener(WIJZIG_EVENT, opWijziging)
    return () => window.removeEventListener(WIJZIG_EVENT, opWijziging)
  }, [])

  const zetSoort = useCallback((soort: Soort, aan: boolean) => {
    setWaardeState((huidig) => {
      const nieuw = { ...huidig, [soort]: aan }
      if (typeof window !== "undefined") {
        window.localStorage.setItem(OPSLAG_SLEUTEL, JSON.stringify(nieuw))
        window.dispatchEvent(new CustomEvent(WIJZIG_EVENT, { detail: nieuw }))
      }
      return nieuw
    })
  }, [])

  return [waarde, zetSoort]
}

/** Zet alle formulieren terug naar zichtbaar/actief. */
export function resetZichtbareFormulieren() {
  if (typeof window === "undefined") return
  window.localStorage.setItem(
    OPSLAG_SLEUTEL,
    JSON.stringify(STANDAARD_ZICHTBARE_FORMULIEREN),
  )
  window.dispatchEvent(
    new CustomEvent(WIJZIG_EVENT, { detail: STANDAARD_ZICHTBARE_FORMULIEREN }),
  )
}
