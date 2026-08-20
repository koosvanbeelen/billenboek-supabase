"use client"

import { useState } from "react"
import { Check, ChevronDown, Pencil, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useKindKeuze } from "@/lib/kind-voorkeur"

function KindAvatar({ naam }: { naam: string }) {
  const letter = naam.trim().charAt(0).toUpperCase() || "?"
  return (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
      {letter}
    </span>
  )
}

// Links in de header: knop met het actieve kind, die een lijstje opent om
// van kind te wisselen, een kind te hernoemen of toe te voegen. Nog puur
// clientside (localStorage) — nog niet gekoppeld aan registraties.
export function KindKiezer() {
  const { kinderen, actiefKind, kiesKind, voegKindToe, hernoemKind, verwijderKind } =
    useKindKeuze()

  const [open, setOpen] = useState(false)
  const [nieuweNaam, setNieuweNaam] = useState("")
  const [bewerkId, setBewerkId] = useState<string | null>(null)
  const [bewerkNaam, setBewerkNaam] = useState("")

  function startBewerken(id: string, huidigeNaam: string) {
    setBewerkId(id)
    setBewerkNaam(huidigeNaam)
  }

  function bewaarBewerking() {
    if (bewerkId) hernoemKind(bewerkId, bewerkNaam)
    setBewerkId(null)
  }

  function kindToevoegen() {
    if (!nieuweNaam.trim()) return
    voegKindToe(nieuweNaam)
    setNieuweNaam("")
  }

  return (
    <Popover
      open={open}
      onOpenChange={(volgende) => {
        setOpen(volgende)
        if (!volgende) setBewerkId(null)
      }}
    >
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            className="h-11 gap-2 rounded-xl px-2 text-sm font-medium"
          >
            <KindAvatar naam={actiefKind.naam} />
            <span className="max-w-24 truncate sm:max-w-36">
              {actiefKind.naam}
            </span>
            <ChevronDown className="size-4 text-muted-foreground" aria-hidden />
          </Button>
        }
      />
      <PopoverContent align="start" className="w-64">
        <p className="px-1 pb-1 text-xs font-medium text-muted-foreground">
          Wie wordt er geregistreerd?
        </p>

        <ul className="flex flex-col gap-0.5">
          {kinderen.map((kind) => {
            const isBewerken = bewerkId === kind.id
            const isActief = kind.id === actiefKind.id

            if (isBewerken) {
              return (
                <li key={kind.id} className="flex items-center gap-1.5 py-0.5">
                  <Input
                    autoFocus
                    value={bewerkNaam}
                    onChange={(e) => setBewerkNaam(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") bewaarBewerking()
                      if (e.key === "Escape") setBewerkId(null)
                    }}
                    className="h-9"
                  />
                  <Button
                    type="button"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={bewaarBewerking}
                    aria-label="Naam opslaan"
                  >
                    <Check className="size-4" aria-hidden />
                  </Button>
                </li>
              )
            }

            return (
              <li key={kind.id} className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    kiesKind(kind.id)
                    setOpen(false)
                  }}
                  className={cn(
                    "flex flex-1 items-center gap-2 rounded-lg px-2 py-2 text-left text-sm font-medium transition-colors",
                    isActief
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-muted",
                  )}
                >
                  <KindAvatar naam={kind.naam} />
                  <span className="truncate">{kind.naam}</span>
                </button>
                <button
                  type="button"
                  aria-label={`${kind.naam} hernoemen`}
                  onClick={() => startBewerken(kind.id, kind.naam)}
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Pencil className="size-4" aria-hidden />
                </button>
                {kinderen.length > 1 && (
                  <button
                    type="button"
                    aria-label={`${kind.naam} verwijderen`}
                    onClick={() => verwijderKind(kind.id)}
                    className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                )}
              </li>
            )
          })}
        </ul>

        <div className="mt-1 flex items-center gap-1.5 border-t border-border pt-2">
          <Input
            value={nieuweNaam}
            onChange={(e) => setNieuweNaam(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && kindToevoegen()}
            placeholder="Naam nieuw kind"
            className="h-9"
          />
          <Button
            type="button"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={kindToevoegen}
            aria-label="Kind toevoegen"
          >
            <Plus className="size-4" aria-hidden />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
