"use client"

import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

type Props = {
  // Gecombineerde waarde "yyyy-MM-ddTHH:mm"
  waarde: string
  onChange: (waarde: string) => void
}

// Herbruikbare datum- en tijdkiezer. Toont een aparte datum- en tijdkiezer
// naast elkaar en levert één gecombineerde "yyyy-MM-ddTHH:mm" waarde.
export function DatumTijdKiezer({ waarde, onChange }: Props) {
  const [datum = "", tijd = ""] = waarde.split("T")

  return (
    <div className="flex gap-3">
      <Field className="flex-1">
        <FieldLabel htmlFor="dtk-datum">Datum</FieldLabel>
        <Input
          id="dtk-datum"
          type="date"
          value={datum}
          onChange={(e) => onChange(`${e.target.value}T${tijd || "00:00"}`)}
          className="h-12 text-base"
        />
      </Field>
      <Field className="w-28 flex-none">
        <FieldLabel htmlFor="dtk-tijd">Tijd</FieldLabel>
        <Input
          id="dtk-tijd"
          type="time"
          value={tijd}
          onChange={(e) =>
            onChange(`${datum || new Date().toISOString().slice(0, 10)}T${e.target.value}`)
          }
          className="h-12 text-base"
        />
      </Field>
    </div>
  )
}
