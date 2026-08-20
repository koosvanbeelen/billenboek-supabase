"use client"

import { useCallback, useEffect, useState } from "react"
import { inputNaarDatum, nuInputWaarde } from "@/lib/datum"

const OPSLAG_SLEUTEL = "billenboek:actieve-timers"
const WIJZIG_EVENT = "billenboek:actieve-timers-wijziging"

export type TimerSoort = "slapen" | "huilen"
export type TimerStatus = "uit" | "lopend" | "wacht"

// Starttijdstippen worden bewaard als dezelfde "yyyy-MM-ddTHH:mm"
// wandkloktijd-string die de rest van de app gebruikt (zie lib/datum.ts),
// zodat ze zonder conversie in de formulieren gebruikt kunnen worden en
// consistent blijven met hoe duur elders berekend wordt.
//
// `einde: null`   -> de timer loopt nog ("lopend")
// `einde` gezet   -> gestopt maar nog niet opgeslagen/verwijderd ("wacht")
// hele soort null -> geen meting bezig ("uit")
type TimerMeting = { start: string; einde: string | null }
type TimerState = Record<TimerSoort, TimerMeting | null>

const STANDAARD: TimerState = { slapen: null, huilen: null }

function isGeldigeMeting(waarde: unknown): waarde is TimerMeting | null {
  if (waarde === null) return true
  if (typeof waarde !== "object") return false
  const w = waarde as Record<string, unknown>
  return typeof w.start === "string" && (w.einde === null || typeof w.einde === "string")
}

function isGeldig(waarde: unknown): waarde is TimerState {
  if (typeof waarde !== "object" || waarde === null) return false
  const w = waarde as Record<string, unknown>
  return isGeldigeMeting(w.slapen) && isGeldigeMeting(w.huilen)
}

function leesOpgeslagenWaarde(): TimerState {
  if (typeof window === "undefined") return STANDAARD
  try {
    const ruw = window.localStorage.getItem(OPSLAG_SLEUTEL)
    if (!ruw) return STANDAARD
    const geparsed = JSON.parse(ruw)
    const aangevuld = { ...STANDAARD, ...geparsed }
    return isGeldig(aangevuld) ? aangevuld : STANDAARD
  } catch {
    return STANDAARD
  }
}

function schrijf(waarde: TimerState) {
  window.localStorage.setItem(OPSLAG_SLEUTEL, JSON.stringify(waarde))
  window.dispatchEvent(new CustomEvent(WIJZIG_EVENT, { detail: waarde }))
}

// Verstreken hele seconden sinds een opgeslagen starttijd, met dezelfde
// wandkloktijd-conventie als de rest van de app (zie duurInMinuten).
export function verstrekenSeconden(sinds: string): number {
  const ms =
    inputNaarDatum(nuInputWaarde()).getTime() - inputNaarDatum(sinds).getTime()
  return Math.max(0, Math.floor(ms / 1000))
}

/**
 * Live start/stop-timer voor "Slapen" en "Huilen".
 *
 * - Eerste tik start de timer (blijft actief bij herladen/navigeren, via
 *   localStorage): status wordt "lopend".
 * - Tweede tik bepaalt de eindtijd en zet status op "wacht" — de meting
 *   blijft bewaard totdat hij expliciet opgeslagen (wisTimer wordt dan door
 *   het formulier aangeroepen) of bewust verwijderd wordt. Zo gaat een
 *   meting nooit verloren door het formulier per ongeluk weg te tikken.
 * - Nogmaals tikken tijdens "wacht" levert dezelfde meting opnieuw op, zodat
 *   het (nog niet opgeslagen) formulier opnieuw geopend kan worden.
 */
export function useActieveTimer(soort: TimerSoort) {
  const [alle, setAlle] = useState<TimerState>(STANDAARD)

  useEffect(() => {
    setAlle(leesOpgeslagenWaarde())
    function opWijziging(event: Event) {
      const detail = (event as CustomEvent<TimerState>).detail
      if (isGeldig(detail)) setAlle(detail)
    }
    window.addEventListener(WIJZIG_EVENT, opWijziging)
    return () => window.removeEventListener(WIJZIG_EVENT, opWijziging)
  }, [])

  const entry = alle[soort]
  const status: TimerStatus = !entry ? "uit" : entry.einde === null ? "lopend" : "wacht"

  const beginTimer = useCallback(() => {
    const nieuw: TimerState = {
      ...leesOpgeslagenWaarde(),
      [soort]: { start: nuInputWaarde(), einde: null },
    }
    schrijf(nieuw)
    setAlle(nieuw)
  }, [soort])

  // Zet de eindtijd maar bewaart de meting (status wordt "wacht").
  const stopTimer = useCallback((): { start: string; einde: string } | null => {
    const huidig = leesOpgeslagenWaarde()
    const bestaand = huidig[soort]
    if (!bestaand) return null
    const einde = bestaand.einde ?? nuInputWaarde()
    const nieuw: TimerState = { ...huidig, [soort]: { start: bestaand.start, einde } }
    schrijf(nieuw)
    setAlle(nieuw)
    return { start: bestaand.start, einde }
  }, [soort])

  // Wist de meting volledig: na succesvol opslaan, of wanneer de gebruiker
  // 'm bewust weggooit.
  const wisTimer = useCallback(() => {
    const nieuw: TimerState = { ...leesOpgeslagenWaarde(), [soort]: null }
    schrijf(nieuw)
    setAlle(nieuw)
  }, [soort])

  return {
    status,
    entry,
    startTijd: entry?.start ?? null,
    beginTimer,
    stopTimer,
    wisTimer,
  }
}
