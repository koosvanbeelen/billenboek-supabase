"use client"

import { useEffect, useState } from "react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useZichtbareTellers, type TellerId } from "@/lib/teller-voorkeur"
import { tellerMeta } from "@/lib/tellers"
import { duurInMinuten, formatDuur, formatUuMm, nuInputWaarde } from "@/lib/datum"
import type { DagTellers } from "@/lib/types"

function Teller({
  icon: Icon,
  waarde,
  label,
}: {
  icon: LucideIcon
  waarde: string
  label: string
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl border border-border bg-card p-3 text-center">
      <Icon className="size-5 text-primary" aria-hidden />
      <span className="text-lg font-bold tabular-nums text-card-foreground">
        {waarde}
      </span>
      <span className="text-xs leading-tight text-muted-foreground">{label}</span>
    </div>
  )
}

// "Tijd sinds..." rekent tegen `nu`, dat elke 30s ververst wordt zodat de
// teller live meeloopt zonder de hele pagina te laten heropbouwen.
function waardeVoorTeller(id: TellerId, tellers: DagTellers, nu: string): string {
  switch (id) {
    case "voedingenAantal":
      return String(tellers.voedingenAantal)
    case "borsttijd":
      return `${tellers.voedingenMinuten}m`
    case "poepluier":
      return String(tellers.luiersPoep)
    case "plasluier":
      return String(tellers.luiersPlas)
    case "totaalLuiers":
      return String(tellers.luiersAantal)
    case "tijdSindsVoeding":
      return tellers.laatsteVoeding
        ? formatUuMm(duurInMinuten(tellers.laatsteVoeding, nu))
        : "—"
    case "tijdSindsLuier":
      return tellers.laatsteLuier
        ? formatUuMm(duurInMinuten(tellers.laatsteLuier, nu))
        : "—"
    case "mlGekolfd":
      return `${tellers.mlGekolfd}ml`
    case "totaleSlaaptijd":
      return formatDuur(tellers.slaapMinuten)
    case "totaleHuiltijd":
      return formatDuur(tellers.huilMinuten)
  }
}

const kolomKlasse: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
}

export function DagTellersRij({ tellers }: { tellers: DagTellers }) {
  const [zichtbaar] = useZichtbareTellers()
  const [nu, setNu] = useState(() => nuInputWaarde())

  useEffect(() => {
    const interval = setInterval(() => setNu(nuInputWaarde()), 30_000)
    return () => clearInterval(interval)
  }, [])

  if (zichtbaar.length === 0) return null

  return (
    <div className={cn("grid gap-2", kolomKlasse[zichtbaar.length] ?? "grid-cols-4")}>
      {zichtbaar.map((id) => {
        const meta = tellerMeta[id]
        return (
          <Teller
            key={id}
            icon={meta.icon}
            waarde={waardeVoorTeller(id, tellers, nu)}
            label={meta.label}
          />
        )
      })}
    </div>
  )
}
