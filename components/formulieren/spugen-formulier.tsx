"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import { DatumTijdKiezer } from "@/components/datum-tijd-kiezer"
import { voegSpugenToe, werkSpugenBij } from "@/app/actions/registraties"
import { nuInputWaarde, datumNaarInput } from "@/lib/datum"
import type { SpugenItem } from "@/lib/types"

type Props = { bestaand?: SpugenItem; onKlaar: () => void }

export function SpugenFormulier({ bestaand, onKlaar }: Props) {
  const [bezig, setBezig] = useState(false)
  const [datumTijd, setDatumTijd] = useState(
    bestaand ? datumNaarInput(new Date(bestaand.datumTijd)) : nuInputWaarde(),
  )
  const [notitie, setNotitie] = useState(bestaand?.notitie ?? "")
  const [fout, setFout] = useState<string | null>(null)

  async function verstuur() {
    setBezig(true)
    setFout(null)
    try {
      const input = { datumTijd, notitie: notitie.trim() || undefined }
      if (bestaand) await werkSpugenBij(bestaand.id, input)
      else await voegSpugenToe(input)
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
      <DatumTijdKiezer waarde={datumTijd} onChange={setDatumTijd} />

      <Field>
        <FieldLabel htmlFor="notitie">Notitie (optioneel)</FieldLabel>
        <Textarea
          id="notitie"
          value={notitie}
          onChange={(e) => setNotitie(e.target.value)}
          placeholder="Bijv. flinke boer, beetje gespuugd..."
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
