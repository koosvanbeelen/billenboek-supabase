"use client"

import { useState } from "react"
import { CalendarDays } from "lucide-react"
import { nl } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { formatDatumLang } from "@/lib/datum"

type Props = {
  // "yyyy-MM-dd"
  waarde: string
  onChange: (datum: string) => void
  // "yyyy-MM-dd" — datums hierna worden uitgeschakeld (bijv. vandaag)
  maxDatum?: string
}

function datumUitString(datum: string): Date {
  return new Date(`${datum}T12:00:00.000Z`)
}

function stringUitDatum(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// Herbruikbare "Datumkiezer": knop met huidige datum die een kalender
// opent om snel naar een andere dag te bladeren.
export function DatumKiezer({ waarde, onChange, maxDatum }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            className="h-11 gap-2 rounded-xl px-3 text-sm font-medium"
          >
            <CalendarDays className="size-4 text-primary" aria-hidden />
            <span className="flex flex-col items-start leading-tight">
              <span className="capitalize">
                {formatDatumLang(waarde).split(" ").slice(0, 1)}
              </span>
              <span className="text-xs font-normal text-muted-foreground">
                {formatDatumLang(waarde).split(" ").slice(1).join(" ")}
              </span>
            </span>
          </Button>
        }
      />
      <PopoverContent align="center" className="w-auto p-0">
        <Calendar
          mode="single"
          locale={nl}
          selected={datumUitString(waarde)}
          defaultMonth={datumUitString(waarde)}
          disabled={maxDatum ? { after: datumUitString(maxDatum) } : undefined}
          onSelect={(d) => {
            if (!d) return
            onChange(stringUitDatum(d))
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
