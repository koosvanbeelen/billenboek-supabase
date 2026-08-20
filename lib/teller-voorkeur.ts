"use client"

import { useCallback, useEffect, useState } from "react"

const OPSLAG_SLEUTEL = "billenboek:zichtbare-tellers"
const WIJZIG_EVENT = "billenboek:zichtbare-tellers-wijziging"

export type TellerId =
  | "voedingenAantal"
  | "borsttijd"
  | "poepluier"
  | "plasluier"
  | "totaalLuiers"
  | "tijdSindsVoeding"
  | "tijdSindsLuier"
  | "mlGekolfd"
  | "totaleSlaaptijd"
  | "totaleHuiltijd"

// Alle bestaande tellers, in de volgorde waarin ze in Instellingen getoond
// worden. Nieuwe tellers hier toevoegen zodra ze bestaan.
export const ALLE_TELLERS: TellerId[] = [
  "voedingenAantal",
  "borsttijd",
  "poepluier",
  "plasluier",
  "totaalLuiers",
  "tijdSindsVoeding",
  "tijdSindsLuier",
  "mlGekolfd",
  "totaleSlaaptijd",
  "totaleHuiltijd",
]

export const MAX_TELLERS = 4

// Standaard: dezelfde 4 tellers die de app altijd al toonde, zodat een
// bestaande gebruiker na deze update niets ziet veranderen.
export const STANDAARD_TELLERS: TellerId[] = [
  "voedingenAantal",
  "borsttijd",
  "poepluier",
  "plasluier",
]

function isGeldigeLijst(waarde: unknown): waarde is TellerId[] {
  return (
    Array.isArray(waarde) &&
    waarde.every(
      (w) => typeof w === "string" && (ALLE_TELLERS as string[]).includes(w),
    )
  )
}

function leesOpgeslagenWaarde(): TellerId[] {
  if (typeof window === "undefined") return STANDAARD_TELLERS
  try {
    const ruw = window.localStorage.getItem(OPSLAG_SLEUTEL)
    if (!ruw) return STANDAARD_TELLERS
    const geparsed = JSON.parse(ruw)
    if (!isGeldigeLijst(geparsed)) return STANDAARD_TELLERS
    // Extra veiligheid: nooit meer dan het maximum teruggeven, ook niet als
    // de opslag handmatig aangepast is.
    return geparsed.slice(0, MAX_TELLERS)
  } catch {
    return STANDAARD_TELLERS
  }
}

function schrijf(waarde: TellerId[]) {
  window.localStorage.setItem(OPSLAG_SLEUTEL, JSON.stringify(waarde))
  window.dispatchEvent(new CustomEvent(WIJZIG_EVENT, { detail: waarde }))
}

/**
 * Voorkeur voor welke tellers bovenaan "Vandaag" en "Geschiedenis" getoond
 * worden. Maximaal 4 tegelijk, per apparaat ingesteld via Instellingen
 * (localStorage), zelfde patroon als de zichtbare formulieren.
 */
export function useZichtbareTellers(): [
  TellerId[],
  (id: TellerId, aan: boolean) => void,
] {
  const [waarde, setWaardeState] = useState<TellerId[]>(STANDAARD_TELLERS)

  useEffect(() => {
    setWaardeState(leesOpgeslagenWaarde())

    function opWijziging(event: Event) {
      const detail = (event as CustomEvent<TellerId[]>).detail
      if (isGeldigeLijst(detail)) setWaardeState(detail)
    }

    window.addEventListener(WIJZIG_EVENT, opWijziging)
    return () => window.removeEventListener(WIJZIG_EVENT, opWijziging)
  }, [])

  const zetTeller = useCallback((id: TellerId, aan: boolean) => {
    setWaardeState((huidig) => {
      let nieuw: TellerId[]
      if (aan) {
        if (huidig.includes(id) || huidig.length >= MAX_TELLERS) return huidig
        nieuw = [...huidig, id]
      } else {
        nieuw = huidig.filter((t) => t !== id)
      }
      schrijf(nieuw)
      return nieuw
    })
  }, [])

  return [waarde, zetTeller]
}

/** Zet de tellerselectie terug naar de standaard 4. */
export function resetZichtbareTellers() {
  if (typeof window === "undefined") return
  window.localStorage.setItem(OPSLAG_SLEUTEL, JSON.stringify(STANDAARD_TELLERS))
  window.dispatchEvent(
    new CustomEvent(WIJZIG_EVENT, { detail: STANDAARD_TELLERS }),
  )
}
