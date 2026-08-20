"use client"

import { useMemo, useState } from "react"
import { Timer } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import { DatumTijdKiezer } from "@/components/datum-tijd-kiezer"
import { voegSlaapToe, werkSlaapBij } from "@/app/actions/registraties"
import { nuInputWaarde, datumNaarInput, duurInMinuten, formatDuur } from "@/lib/datum"
import type { SlaapItem } from "@/lib/types"

type Props = {
  bestaand?: SlaapItem
  voorinvulling?: { start: string; einde: string }
  onKlaar: () => void
  // Start de live timer en sluit het formulier, zodat de rest van de app
  // ondertussen gewoon gebruikt kan worden. Alleen aanwezig bij een geheel
  // nieuwe, lege registratie (geen bestaand item, geen voorinvulling).
  onStartTimer?: () => void
}

export function SlaapFormulier({
  bestaand,
  voorinvulling,
  onKlaar,
  onStartTimer,
}: Props) {
  const [bezig, setBezig] = useState(false)
  const [start, setStart] = useState(
    bestaand
      ? datumNaarInput(new Date(bestaand.start))
      : voorinvulling?.start ?? nuInputWaarde(),
  )
  const [einde, setEinde] = useState(
    bestaand
      ? datumNaarInput(new Date(bestaand.einde))
      : voorinvulling?.einde ?? nuInputWaarde(),
  )
  const [locatie, setLocatie] = useState(bestaand?.locatie ?? "")
  const [notitie, setNotitie] = useState(bestaand?.notitie ?? "")
  const [fout, setFout] = useState<string | null>(null)

  const duur = useMemo(() => duurInMinuten(start, einde), [start, einde])
  const duurGeldig = new Date(`${einde}:00.000Z`) > new Date(`${start}:00.000Z`)
  const toonTimerKnop = Boolean(onStartTimer) && !bestaand && !voorinvulling

  async function verstuur() {
    if (!duurGeldig) {
      setFout("Einde moet na start liggen")
      return
    }
    setBezig(true)
    setFout(null)
    try {
      const input = {
        start,
        einde,
        locatie: locatie.trim() || undefined,
        notitie: notitie.trim() || undefined,
      }
      if (bestaand) await werkSlaapBij(bestaand.id, input)
      else await voegSlaapToe(input)
      toast.success(bestaand ? "Bijgewerkt" : "Opgeslagen")
      onKlaar()
    } catch {
      setFout("Er ging iets mis bij het opslaan")
    } finally {
      setBezig(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {toonTimerKnop && (
        <>
          <Button
            type="button"
            onClick={onStartTimer}
            size="lg"
            variant="outline"
            className="h-12 w-full border-temp-good/40 text-base text-temp-good hover:bg-temp-good/10 hover:text-temp-good"
          >
            <Timer className="size-5" data-icon="inline-start" />
            Start timer
          </Button>
          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">of vul handmatig in</span>
            <Separator className="flex-1" />
          </div>
        </>
      )}

      <Field>
        <FieldLabel>Start</FieldLabel>
        <DatumTijdKiezer waarde={start} onChange={setStart} />
      </Field>

      <Field>
        <FieldLabel>Einde</FieldLabel>
        <DatumTijdKiezer waarde={einde} onChange={setEinde} />
      </Field>

      <div className="rounded-xl bg-muted px-3 py-2 text-sm text-muted-foreground">
        Duur:{" "}
        <span className="font-medium text-card-foreground">
          {duurGeldig ? formatDuur(duur) : "—"}
        </span>
      </div>

      <Field>
        <FieldLabel htmlFor="locatie">Locatie (optioneel)</FieldLabel>
        <Input
          id="locatie"
          value={locatie}
          onChange={(e) => setLocatie(e.target.value)}
          placeholder="Bijv. eigen bedje, wandelwagen, auto"
          className="h-12 text-base"
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="notitie">Notitie (optioneel)</FieldLabel>
        <Textarea
          id="notitie"
          value={notitie}
          onChange={(e) => setNotitie(e.target.value)}
          placeholder="Bijzonderheden..."
          rows={2}
        />
      </Field>

      {fout && <FieldError>{fout}</FieldError>}

      <Button onClick={verstuur} disabled={bezig} size="lg" className="h-12 w-full text-base">
        {bezig ? "Bezig..." : bestaand ? "Bijwerken" : "Opslaan"}
      </Button>
    </div>
  )
}
