"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import { DatumTijdKiezer } from "@/components/datum-tijd-kiezer"
import { voegLuierToe, werkLuierBij } from "@/app/actions/registraties"
import { nuInputWaarde, datumNaarInput } from "@/lib/datum"
import type { LuierItem } from "@/lib/types"

type Props = { bestaand?: LuierItem; onKlaar: () => void }

const opties = [
  { sleutel: "plas", label: "Plas" },
  { sleutel: "poep", label: "Poep" },
  { sleutel: "schoon", label: "Alleen verschoond" },
] as const

export function LuierFormulier({ bestaand, onKlaar }: Props) {
  const [bezig, setBezig] = useState(false)
  const [datumTijd, setDatumTijd] = useState(
    bestaand ? datumNaarInput(new Date(bestaand.datumTijd)) : nuInputWaarde(),
  )
  const [staat, setStaat] = useState({
    plas: bestaand?.plas ?? false,
    poep: bestaand?.poep ?? false,
    schoon: bestaand?.schoon ?? false,
  })
  const [fout, setFout] = useState<string | null>(null)

  function wissel(sleutel: keyof typeof staat, aan: boolean) {
    setStaat((s) => ({ ...s, [sleutel]: aan }))
  }

  async function verstuur() {
    if (!staat.plas && !staat.poep && !staat.schoon) {
      setFout("Kies minstens één optie")
      return
    }
    setBezig(true)
    setFout(null)
    try {
      const input = { datumTijd, ...staat }
      if (bestaand) await werkLuierBij(bestaand.id, input)
      else await voegLuierToe(input)
      toast.success(bestaand ? "Luier bijgewerkt" : "Luier opgeslagen")
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
        <FieldLabel>Wat zat erin?</FieldLabel>
        <div className="flex flex-col gap-2">
          {opties.map((o) => (
            <FieldLabel
              key={o.sleutel}
              className="flex items-center gap-3 rounded-xl border border-border p-3"
            >
              <Checkbox
                checked={staat[o.sleutel]}
                onCheckedChange={(c) => wissel(o.sleutel, c === true)}
              />
              <span className="text-base font-medium">{o.label}</span>
            </FieldLabel>
          ))}
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
