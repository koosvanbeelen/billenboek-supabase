"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import { KeuzeGroep } from "@/components/keuze-groep"
import { DatumTijdKiezer } from "@/components/datum-tijd-kiezer"
import { voegKolfToe, werkKolfBij } from "@/app/actions/registraties"
import { nuInputWaarde, datumNaarInput } from "@/lib/datum"
import type { KolfItem } from "@/lib/types"

type Props = { bestaand?: KolfItem; onKlaar: () => void }

export function KolfFormulier({ bestaand, onKlaar }: Props) {
  const [bezig, setBezig] = useState(false)
  const [borst, setBorst] = useState<"links" | "rechts" | "beide">(
    bestaand?.borst ?? "links",
  )
  const [hoeveelheid, setHoeveelheid] = useState(
    bestaand?.hoeveelheidMl?.toString() ?? "",
  )
  const [datumTijd, setDatumTijd] = useState(
    bestaand ? datumNaarInput(new Date(bestaand.datumTijd)) : nuInputWaarde(),
  )
  const [notitie, setNotitie] = useState(bestaand?.notitie ?? "")
  const [fout, setFout] = useState<string | null>(null)

  async function verstuur() {
    if (!hoeveelheid.trim()) {
      setFout("Vul de hoeveelheid in")
      return
    }
    setBezig(true)
    setFout(null)
    try {
      const input = {
        datumTijd,
        borst,
        hoeveelheidMl: Number(hoeveelheid),
        notitie: notitie.trim() || undefined,
      }
      if (bestaand) await werkKolfBij(bestaand.id, input)
      else await voegKolfToe(input)
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
        <FieldLabel>Welke borst</FieldLabel>
        <KeuzeGroep
          waarde={borst}
          onChange={setBorst}
          opties={[
            { waarde: "links", label: "Links" },
            { waarde: "rechts", label: "Rechts" },
            { waarde: "beide", label: "Beide" },
          ]}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="ml">Hoeveelheid (ml)</FieldLabel>
        <Input
          id="ml"
          type="number"
          inputMode="numeric"
          min={0}
          value={hoeveelheid}
          onChange={(e) => setHoeveelheid(e.target.value)}
          placeholder="Bijv. 90"
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
