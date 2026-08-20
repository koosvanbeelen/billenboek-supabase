"use client"

import { useCallback, useEffect, useState } from "react"
import type { TijdlijnVolgorde } from "@/components/tijdlijn-sorteer-knop"

const OPSLAG_SLEUTEL = "billenboek:tijdlijn-volgorde"
const WIJZIG_EVENT = "billenboek:tijdlijn-volgorde-wijziging"

export const STANDAARD_TIJDLIJN_VOLGORDE: TijdlijnVolgorde = "oud-nieuw"

function isGeldigeVolgorde(waarde: unknown): waarde is TijdlijnVolgorde {
  return waarde === "oud-nieuw" || waarde === "nieuw-oud"
}

function leesOpgeslagenVolgorde(): TijdlijnVolgorde {
  if (typeof window === "undefined") return STANDAARD_TIJDLIJN_VOLGORDE
  const waarde = window.localStorage.getItem(OPSLAG_SLEUTEL)
  return isGeldigeVolgorde(waarde) ? waarde : STANDAARD_TIJDLIJN_VOLGORDE
}

/**
 * Gedeelde voorkeur voor de sorteervolgorde van tijdlijnen (gebruikt in zowel
 * "Vandaag" als de dagdetailweergave in "Geschiedenis"). Wordt, net als
 * donkere modus, bewaard in localStorage: per apparaat onthouden en instel-
 * baar via Instellingen. Alle tegelijk gemonteerde componenten blijven in
 * sync via een custom event, zodat een wijziging via de knop op "Vandaag"
 * direct terug te zien is in Instellingen en andersom.
 */
export function useTijdlijnVolgorde(): [
  TijdlijnVolgorde,
  (volgorde: TijdlijnVolgorde) => void,
] {
  // Server- en eerste client-render gebruiken bewust dezelfde standaardwaarde
  // (voorkomt een hydration-mismatch); pas na mount lezen we localStorage.
  const [volgorde, setVolgordeState] = useState<TijdlijnVolgorde>(
    STANDAARD_TIJDLIJN_VOLGORDE,
  )

  useEffect(() => {
    setVolgordeState(leesOpgeslagenVolgorde())

    function opWijziging(event: Event) {
      const detail = (event as CustomEvent<TijdlijnVolgorde>).detail
      if (isGeldigeVolgorde(detail)) setVolgordeState(detail)
    }

    window.addEventListener(WIJZIG_EVENT, opWijziging)
    return () => window.removeEventListener(WIJZIG_EVENT, opWijziging)
  }, [])

  const setVolgorde = useCallback((nieuw: TijdlijnVolgorde) => {
    setVolgordeState(nieuw)
    if (typeof window === "undefined") return
    window.localStorage.setItem(OPSLAG_SLEUTEL, nieuw)
    window.dispatchEvent(new CustomEvent(WIJZIG_EVENT, { detail: nieuw }))
  }, [])

  return [volgorde, setVolgorde]
}

/** Zet de voorkeur terug naar de standaard ("oudste eerst"). */
export function resetTijdlijnVolgorde() {
  if (typeof window === "undefined") return
  window.localStorage.setItem(OPSLAG_SLEUTEL, STANDAARD_TIJDLIJN_VOLGORDE)
  window.dispatchEvent(
    new CustomEvent(WIJZIG_EVENT, { detail: STANDAARD_TIJDLIJN_VOLGORDE }),
  )
}
