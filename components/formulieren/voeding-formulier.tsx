"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import { KeuzeGroep } from "@/components/keuze-groep"
import { BorstKiezer, type BorstWaarde } from "@/components/borst-kiezer"
import { DatumTijdKiezer } from "@/components/datum-tijd-kiezer"
import { voegVoedingToe, werkVoedingBij } from "@/app/actions/registraties"
import { nuInputWaarde, datumNaarInput } from "@/lib/datum"
import type { VoedingItem } from "@/lib/types"

type Props = {
  bestaand?: VoedingItem
  onKlaar: () => void
}

export function VoedingFormulier({ bestaand, onKlaar }: Props) {
  const [bezig, setBezig] = useState(false)
  const [type, setType] = useState<"borstvoeding" | "kolfmelk" | "kunstvoeding">(
    bestaand?.type ?? "borstvoeding",
  )
  const [borst, setBorst] = useState<BorstWaarde | undefined>(
    bestaand?.borst ?? undefined,
  )
  const [datumTijd, setDatumTijd] = useState(
    bestaand ? datumNaarInput(new Date(bestaand.datumTijd)) : nuInputWaarde(),
  )
  const [duur, setDuur] = useState(bestaand?.duurMinuten?.toString() ?? "")
  const [hoeveelheid, setHoeveelheid] = useState(
    bestaand?.hoeveelheidMl?.toString() ?? "",
  )
  const [notitie, setNotitie] = useState(bestaand?.notitie ?? "")
  const [fout, setFout] = useState<string | null>(null)

  async function verstuur() {
    if (type === "borstvoeding" && !borst) {
      setFout("Kies welke borst")
      return
    }
    setBezig(true)
    setFout(null)
    try {
      const input = {
        datumTijd,
        type,
        borst: type === "borstvoeding" ? borst : undefined,
        duurMinuten: type === "borstvoeding" && duur ? Number(duur) : undefined,
        hoeveelheidMl:
          type !== "borstvoeding" && hoeveelheid
            ? Number(hoeveelheid)
            : undefined,
        notitie: notitie.trim() || undefined,
      }
      if (bestaand) await werkVoedingBij(bestaand.id, input)
      else await voegVoedingToe(input)
      toast.success(bestaand ? "Voeding bijgewerkt" : "Voeding opgeslagen")
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
        <FieldLabel>Soort voeding</FieldLabel>
        <KeuzeGroep
          waarde={type}
          onChange={setType}
          opties={[
            { waarde: "borstvoeding", label: "Borstvoeding" },
            { waarde: "kolfmelk", label: "Gekolfde melk" },
            { waarde: "kunstvoeding", label: "Kunstvoeding" },
          ]}
        />
      </Field>

      {type === "borstvoeding" && (
        <Field>
          <FieldLabel>Welke borst</FieldLabel>
          <BorstKiezer waarde={borst} onChange={setBorst} />
        </Field>
      )}

      {type === "borstvoeding" && (
        <Field>
          <FieldLabel htmlFor="duur">Duur (minuten)</FieldLabel>
          <Input
            id="duur"
            type="number"
            inputMode="numeric"
            min={0}
            value={duur}
            onChange={(e) => setDuur(e.target.value)}
            placeholder="Bijv. 15"
            className="h-12 text-base"
          />
        </Field>
      )}

      {(type === "kolfmelk" || type === "kunstvoeding") && (
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
      )}

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
