"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import { DatumTijdKiezer } from "@/components/datum-tijd-kiezer"
import { voegGroeiToe, werkGroeiBij } from "@/app/actions/registraties"
import { nuInputWaarde, datumNaarInput } from "@/lib/datum"
import type { GroeiItem } from "@/lib/types"

type Props = { bestaand?: GroeiItem; onKlaar: () => void }

export function GroeiFormulier({ bestaand, onKlaar }: Props) {
  const [bezig, setBezig] = useState(false)
  const [datumTijd, setDatumTijd] = useState(
    bestaand ? datumNaarInput(new Date(bestaand.datumTijd)) : nuInputWaarde(),
  )
  const [gewicht, setGewicht] = useState(bestaand?.gewichtKg?.toString() ?? "")
  const [lengte, setLengte] = useState(bestaand?.lengteCm?.toString() ?? "")
  const [opmerking, setOpmerking] = useState(bestaand?.opmerking ?? "")
  const [fout, setFout] = useState<string | null>(null)

  async function verstuur() {
    if (!gewicht.trim() && !lengte.trim()) {
      setFout("Vul gewicht of lengte in")
      return
    }
    setBezig(true)
    setFout(null)
    try {
      const input = {
        datumTijd,
        gewichtKg: gewicht.trim() ? Number(gewicht.replace(",", ".")) : undefined,
        lengteCm: lengte.trim() ? Number(lengte.replace(",", ".")) : undefined,
        opmerking: opmerking.trim() || undefined,
      }
      if (bestaand) await werkGroeiBij(bestaand.id, input)
      else await voegGroeiToe(input)
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
      <div className="flex gap-3">
        <Field className="flex-1">
          <FieldLabel htmlFor="gewicht">Gewicht (kg)</FieldLabel>
          <Input
            id="gewicht"
            type="number"
            inputMode="decimal"
            step="0.01"
            min={0}
            value={gewicht}
            onChange={(e) => setGewicht(e.target.value)}
            placeholder="Bijv. 4,20"
            className="h-12 text-base"
          />
        </Field>
        <Field className="flex-1">
          <FieldLabel htmlFor="lengte">Lengte (cm)</FieldLabel>
          <Input
            id="lengte"
            type="number"
            inputMode="decimal"
            step="0.1"
            min={0}
            value={lengte}
            onChange={(e) => setLengte(e.target.value)}
            placeholder="Bijv. 52,5"
            className="h-12 text-base"
          />
        </Field>
      </div>

      <DatumTijdKiezer waarde={datumTijd} onChange={setDatumTijd} />

      <Field>
        <FieldLabel htmlFor="opmerking">Opmerking (optioneel)</FieldLabel>
        <Textarea
          id="opmerking"
          value={opmerking}
          onChange={(e) => setOpmerking(e.target.value)}
          placeholder="Bijv. gemeten bij het consultatiebureau"
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
