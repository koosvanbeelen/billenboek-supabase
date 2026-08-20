"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import { DatumTijdKiezer } from "@/components/datum-tijd-kiezer"
import { voegMedicatieToe, werkMedicatieBij } from "@/app/actions/registraties"
import { nuInputWaarde, datumNaarInput } from "@/lib/datum"
import type { MedicatieItem } from "@/lib/types"

type Props = { bestaand?: MedicatieItem; onKlaar: () => void }

export function MedicatieFormulier({ bestaand, onKlaar }: Props) {
  const [bezig, setBezig] = useState(false)
  const [datumTijd, setDatumTijd] = useState(
    bestaand ? datumNaarInput(new Date(bestaand.datumTijd)) : nuInputWaarde(),
  )
  const [naam, setNaam] = useState(bestaand?.naam ?? "")
  const [dosering, setDosering] = useState(bestaand?.dosering ?? "")
  const [notitie, setNotitie] = useState(bestaand?.notitie ?? "")
  const [fout, setFout] = useState<string | null>(null)

  async function verstuur() {
    if (!naam.trim()) {
      setFout("Vul de naam van het medicijn in")
      return
    }
    setBezig(true)
    setFout(null)
    try {
      const input = {
        datumTijd,
        naam: naam.trim(),
        dosering: dosering.trim() || undefined,
        notitie: notitie.trim() || undefined,
      }
      if (bestaand) await werkMedicatieBij(bestaand.id, input)
      else await voegMedicatieToe(input)
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
        <FieldLabel htmlFor="naam">Naam medicijn</FieldLabel>
        <Input
          id="naam"
          value={naam}
          onChange={(e) => setNaam(e.target.value)}
          placeholder="Bijv. Paracetamol"
          className="h-12 text-base"
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="dosering">Dosering (optioneel)</FieldLabel>
        <Input
          id="dosering"
          value={dosering}
          onChange={(e) => setDosering(e.target.value)}
          placeholder="Bijv. 2,5 ml"
          className="h-12 text-base"
        />
      </Field>

      <DatumTijdKiezer waarde={datumTijd} onChange={setDatumTijd} />

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
