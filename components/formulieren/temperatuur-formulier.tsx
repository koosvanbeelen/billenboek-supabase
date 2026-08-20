"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel, FieldError, FieldDescription } from "@/components/ui/field"
import { DatumTijdKiezer } from "@/components/datum-tijd-kiezer"
import { TemperatuurIndicator } from "@/components/temperatuur-indicator"
import { voegTemperatuurToe, werkTemperatuurBij } from "@/app/actions/registraties"
import { nuInputWaarde, datumNaarInput } from "@/lib/datum"
import type { TemperatuurItem } from "@/lib/types"

type Props = { bestaand?: TemperatuurItem; onKlaar: () => void }

export function TemperatuurFormulier({ bestaand, onKlaar }: Props) {
  const [bezig, setBezig] = useState(false)
  const [datumTijd, setDatumTijd] = useState(
    bestaand ? datumNaarInput(new Date(bestaand.datumTijd)) : nuInputWaarde(),
  )
  const [temp, setTemp] = useState(
    bestaand ? bestaand.temperatuur.toString().replace(".", ",") : "",
  )
  const [fout, setFout] = useState<string | null>(null)

  const getal = Number(temp.replace(",", "."))
  const geldig = temp !== "" && !Number.isNaN(getal) && getal >= 30 && getal <= 45

  async function verstuur() {
    if (!geldig) {
      setFout("Vul een temperatuur tussen 30 en 45 in")
      return
    }
    setBezig(true)
    setFout(null)
    try {
      const input = { datumTijd, temperatuur: getal }
      if (bestaand) await werkTemperatuurBij(bestaand.id, input)
      else await voegTemperatuurToe(input)
      toast.success(bestaand ? "Temperatuur bijgewerkt" : "Temperatuur opgeslagen")
      onKlaar()
    } catch {
      setFout("Er ging iets mis bij het opslaan")
    } finally {
      setBezig(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Field>
        <FieldLabel htmlFor="temp">Temperatuur (°C)</FieldLabel>
        <Input
          id="temp"
          type="text"
          inputMode="decimal"
          value={temp}
          onChange={(e) => setTemp(e.target.value)}
          placeholder="Bijv. 37,2"
          className="h-12 text-base"
        />
        <FieldDescription>Tussen 36,5 en 37,5 is normaal.</FieldDescription>
      </Field>

      {geldig && <TemperatuurIndicator temperatuur={getal} groot />}

      <DatumTijdKiezer waarde={datumTijd} onChange={setDatumTijd} />

      {fout && <FieldError>{fout}</FieldError>}

      <Button onClick={verstuur} disabled={bezig} size="lg" className="h-12 w-full text-base">
        {bezig ? "Bezig..." : bestaand ? "Bijwerken" : "Opslaan"}
      </Button>
    </div>
  )
}
