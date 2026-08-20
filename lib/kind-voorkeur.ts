"use client"

import { useCallback, useEffect, useState } from "react"

export type Kind = {
  id: string
  naam: string
}

type KindState = {
  kinderen: Kind[]
  actiefKindId: string
}

const OPSLAG_SLEUTEL_KINDEREN = "billenboek:kinderen"
const OPSLAG_SLEUTEL_ACTIEF = "billenboek:actief-kind-id"
const WIJZIG_EVENT = "billenboek:kind-wijziging"

// Zolang er nog geen kinderen-tabel in de database bestaat, begint iedereen
// met één (herbenoembaar) kind. Zodra de echte kinderen-tabel er is, kan
// deze hook vervangen worden door een variant die van de server leest —
// de componenten die `useKindKeuze` gebruiken hoeven dan niet te wijzigen.
export const STANDAARD_KINDEREN: Kind[] = [{ id: "kind-1", naam: "Baby" }]

function nieuwKindId(): string {
  return `kind-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function isGeldigeKinderen(waarde: unknown): waarde is Kind[] {
  return (
    Array.isArray(waarde) &&
    waarde.length > 0 &&
    waarde.every(
      (k) =>
        typeof k === "object" &&
        k !== null &&
        typeof (k as Kind).id === "string" &&
        typeof (k as Kind).naam === "string" &&
        (k as Kind).naam.trim().length > 0,
    )
  )
}

function leesOpgeslagenState(): KindState {
  if (typeof window === "undefined") {
    return { kinderen: STANDAARD_KINDEREN, actiefKindId: STANDAARD_KINDEREN[0].id }
  }
  try {
    const ruw = window.localStorage.getItem(OPSLAG_SLEUTEL_KINDEREN)
    const geparsed = ruw ? JSON.parse(ruw) : null
    const kinderen = isGeldigeKinderen(geparsed) ? geparsed : STANDAARD_KINDEREN

    const opgeslagenActief = window.localStorage.getItem(OPSLAG_SLEUTEL_ACTIEF)
    const actiefKindId = kinderen.some((k) => k.id === opgeslagenActief)
      ? (opgeslagenActief as string)
      : kinderen[0].id

    return { kinderen, actiefKindId }
  } catch {
    return { kinderen: STANDAARD_KINDEREN, actiefKindId: STANDAARD_KINDEREN[0].id }
  }
}

function schrijfState(state: KindState) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(OPSLAG_SLEUTEL_KINDEREN, JSON.stringify(state.kinderen))
  window.localStorage.setItem(OPSLAG_SLEUTEL_ACTIEF, state.actiefKindId)
  window.dispatchEvent(new CustomEvent(WIJZIG_EVENT, { detail: state }))
}

/**
 * Voorkeur voor welk kind er actief geselecteerd is in de header, en het
 * lijstje kinderen van het gezin. Dit is (nog) puur clientside via
 * localStorage, los van de database — bedoeld als UI-voorbereiding op de
 * geplande kinderen-tabel. Blijft, net als de andere voorkeuren, per
 * apparaat bewaard en gesynchroniseerd tussen gelijktijdig gemonteerde
 * componenten via een custom event.
 */
export function useKindKeuze(): {
  kinderen: Kind[]
  actiefKind: Kind
  kiesKind: (id: string) => void
  voegKindToe: (naam: string) => void
  hernoemKind: (id: string, naam: string) => void
  verwijderKind: (id: string) => void
} {
  // Server- en eerste client-render gebruiken bewust dezelfde standaardwaarde
  // (voorkomt een hydration-mismatch); pas na mount lezen we localStorage.
  const [state, setState] = useState<KindState>({
    kinderen: STANDAARD_KINDEREN,
    actiefKindId: STANDAARD_KINDEREN[0].id,
  })

  useEffect(() => {
    setState(leesOpgeslagenState())

    function opWijziging(event: Event) {
      const detail = (event as CustomEvent<KindState>).detail
      if (detail && isGeldigeKinderen(detail.kinderen)) setState(detail)
    }

    window.addEventListener(WIJZIG_EVENT, opWijziging)
    return () => window.removeEventListener(WIJZIG_EVENT, opWijziging)
  }, [])

  const kiesKind = useCallback((id: string) => {
    setState((huidig) => {
      if (!huidig.kinderen.some((k) => k.id === id)) return huidig
      const nieuw: KindState = { ...huidig, actiefKindId: id }
      schrijfState(nieuw)
      return nieuw
    })
  }, [])

  const voegKindToe = useCallback((naam: string) => {
    const schoneNaam = naam.trim()
    if (!schoneNaam) return
    setState((huidig) => {
      const kind: Kind = { id: nieuwKindId(), naam: schoneNaam }
      const nieuw: KindState = {
        kinderen: [...huidig.kinderen, kind],
        actiefKindId: kind.id,
      }
      schrijfState(nieuw)
      return nieuw
    })
  }, [])

  const hernoemKind = useCallback((id: string, naam: string) => {
    const schoneNaam = naam.trim()
    if (!schoneNaam) return
    setState((huidig) => {
      const nieuw: KindState = {
        ...huidig,
        kinderen: huidig.kinderen.map((k) =>
          k.id === id ? { ...k, naam: schoneNaam } : k,
        ),
      }
      schrijfState(nieuw)
      return nieuw
    })
  }, [])

  const verwijderKind = useCallback((id: string) => {
    setState((huidig) => {
      // Veiligheidsklep: er moet altijd minstens één kind overblijven.
      if (huidig.kinderen.length <= 1) return huidig
      const kinderen = huidig.kinderen.filter((k) => k.id !== id)
      const actiefKindId =
        huidig.actiefKindId === id ? kinderen[0].id : huidig.actiefKindId
      const nieuw: KindState = { kinderen, actiefKindId }
      schrijfState(nieuw)
      return nieuw
    })
  }, [])

  const actiefKind =
    state.kinderen.find((k) => k.id === state.actiefKindId) ?? state.kinderen[0]

  return { kinderen: state.kinderen, actiefKind, kiesKind, voegKindToe, hernoemKind, verwijderKind }
}

/** Zet de kinderenlijst terug naar de standaard: één kind, genaamd "Baby". */
export function resetKindKeuze() {
  if (typeof window === "undefined") return
  const standaard: KindState = {
    kinderen: STANDAARD_KINDEREN,
    actiefKindId: STANDAARD_KINDEREN[0].id,
  }
  schrijfState(standaard)
}
