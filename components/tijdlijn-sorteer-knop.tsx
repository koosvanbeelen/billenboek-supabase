"use client"

import { ArrowDownNarrowWide, ArrowUpNarrowWide } from "lucide-react"
import { Button } from "@/components/ui/button"

export type TijdlijnVolgorde = "oud-nieuw" | "nieuw-oud"

type Props = {
  volgorde: TijdlijnVolgorde
  onWijzig: (volgorde: TijdlijnVolgorde) => void
}

// Kleine, rechts uitgelijnde knop naast de "Tijdlijn"-kop waarmee tussen
// oudste-eerst en nieuwste-eerst gewisseld kan worden.
export function TijdlijnSorteerKnop({ volgorde, onWijzig }: Props) {
  const nieuwsteEerst = volgorde === "nieuw-oud"

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-auto gap-1 px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
      onClick={() => onWijzig(nieuwsteEerst ? "oud-nieuw" : "nieuw-oud")}
      aria-label={
        nieuwsteEerst
          ? "Sorteer van oud naar nieuw"
          : "Sorteer van nieuw naar oud"
      }
    >
      {nieuwsteEerst ? (
        <ArrowDownNarrowWide className="size-3.5" aria-hidden />
      ) : (
        <ArrowUpNarrowWide className="size-3.5" aria-hidden />
      )}
      {nieuwsteEerst ? "Nieuwste eerst" : "Oudste eerst"}
    </Button>
  )
}
