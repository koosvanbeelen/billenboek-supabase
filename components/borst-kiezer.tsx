"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// "beide" blijft bestaan als legacy-waarde voor oudere registraties die vóór
// deze wijziging zijn opgeslagen (toen volgorde nog niet werd bijgehouden).
export type BorstWaarde =
  | "links"
  | "rechts"
  | "links-rechts"
  | "rechts-links"
  | "beide"

type Kant = "links" | "rechts"

function parseVolgorde(waarde: BorstWaarde | undefined): Kant[] {
  switch (waarde) {
    case "links":
      return ["links"]
    case "rechts":
      return ["rechts"]
    case "links-rechts":
      return ["links", "rechts"]
    case "rechts-links":
      return ["rechts", "links"]
    case "beide":
      return ["links", "rechts"]
    default:
      return []
  }
}

function volgordeNaarWaarde(volgorde: Kant[]): BorstWaarde | undefined {
  if (volgorde.length === 0) return undefined
  if (volgorde.length === 1) return volgorde[0]
  return volgorde.join("-") as BorstWaarde
}

// Laat de gebruiker links en/of rechts aantikken en weer uitzetten. Bij beide
// kanten wordt de volgorde waarin ze zijn aangeklikt zichtbaar gemaakt met
// genummerde badges, zodat duidelijk is of het links-rechts of rechts-links
// was. Er is geen minimum: de gebruiker kan alles uitzetten tot er niets meer
// geselecteerd is.
export function BorstKiezer({
  waarde,
  onChange,
  className,
}: {
  waarde: BorstWaarde | undefined
  onChange: (waarde: BorstWaarde | undefined) => void
  className?: string
}) {
  const volgorde = parseVolgorde(waarde)
  // Bij de legacy "beide"-waarde is de oorspronkelijke volgorde niet meer
  // bekend, dus tonen we dan geen badges.
  const toontVolgorde = waarde !== "beide" && volgorde.length === 2

  function klik(kant: Kant) {
    const actief = volgorde.includes(kant)
    const volgende = actief
      ? volgorde.filter((k) => k !== kant)
      : [...volgorde, kant]
    onChange(volgordeNaarWaarde(volgende))
  }

  return (
    <div className={cn("flex w-full gap-2", className)}>
      {(["links", "rechts"] as const).map((kant) => {
        const actief = volgorde.includes(kant)
        const positie = toontVolgorde ? volgorde.indexOf(kant) + 1 : null
        return (
          <button
            key={kant}
            type="button"
            aria-pressed={actief}
            onClick={() => klik(kant)}
            className={cn(
              "relative h-12 flex-1 rounded-lg border text-base font-medium transition-colors",
              actief
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-background text-foreground hover:bg-muted",
            )}
          >
            {kant === "links" ? "Links" : "Rechts"}
            {positie !== null && (
              <Badge className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full p-0 text-[11px]">
                {positie}
              </Badge>
            )}
          </button>
        )
      })}
    </div>
  )
}
