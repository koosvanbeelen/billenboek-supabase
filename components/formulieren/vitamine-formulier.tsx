"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import { DatumTijdKiezer } from "@/components/datum-tijd-kiezer"
import { voegVitamineToe, werkVitamineBij } from "@/app/actions/registraties"
import { nuInputWaarde, datumNaarInput } from "@/lib/datum"
import type { VitamineItem } from "@/lib/types"

type Props = { bestaand?: VitamineItem; onKlaar: () => void }

export function VitamineFormulier({ bestaand, onKlaar }: Props) {
  const [bezig, setBezig] = useState(false)
  const [datumTijd, setDatumTijd] = useState(
    bestaand ? datumNaarInput(new Date(bestaand.datumTijd)) : nuInputWaarde(),
  )
  const [vitamineK, setK] = useState(bestaand?.vitamineK ?? false)
  const [vitamineD, setD] = useState(bestaand?.vitamineD ?? true)
  const [fout, setFout] = useState<string | null>(null)

  async function verstuur() {
    if (!vitamineK && !vitamineD) {
      setFout("Kies minstens één vitamine")
      return
    }
    setBezig(true)
    setFout(null)
    try {
      const input = { datumTijd, vitamineK, vitamineD }
      if (bestaand) await werkVitamineBij(bestaand.id, input)
      else await voegVitamineToe(input)
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
      <Field>
        <FieldLabel>Welke vitamine?</FieldLabel>
        <div className="flex flex-col gap-2">
          <FieldLabel className="flex items-center gap-3 rounded-xl border border-border p-3">
            <Checkbox checked={vitamineD} onCheckedChange={(c) => setD(c === true)} />
            <span className="text-base font-medium">Vitamine D</span>
          </FieldLabel>
          <FieldLabel className="flex items-center gap-3 rounded-xl border border-border p-3">
            <Checkbox checked={vitamineK} onCheckedChange={(c) => setK(c === true)} />
            <span className="text-base font-medium">Vitamine K</span>
          </FieldLabel>
        </div>
      </Field>

      <DatumTijdKiezer waarde={datumTijd} onChange={setDatumTijd} />

      {fout && <FieldError>{fout}</FieldError>}

      <Button onClick={verstuur} disabled={bezig} size="lg" className="h-12 w-full text-base">
        {bezig ? "Bezig..." : bestaand ? "Bijwerken" : "Opslaan"}
      </Button>
    </div>
  )
}
