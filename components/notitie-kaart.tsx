"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Trash2, X, Check } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { NotitieEditor } from "@/components/notitie-editor"
import { NotitieWeergaveTekst } from "@/components/notitie-weergave-tekst"
import { werkNotitieBij, vinkNotitieRegelAf } from "@/app/actions/notities"
import { formatDatumLang, formatTijd } from "@/lib/datum"
import { toggleCheckboxRegel } from "@/lib/notitie-opmaak"
import type { NotitieItem } from "@/lib/types"

type Props = {
  item: NotitieItem
  onVerwijder: () => void
}

// Kaart voor één notitie. Bewerken gebeurt inline in de kaart zelf, zodat
// er geen extra klik naar een apart formulier nodig is.
export function NotitieKaart({ item, onVerwijder }: Props) {
  const router = useRouter()
  const [bewerken, setBewerken] = useState(false)
  const [waarde, setWaarde] = useState(item.notitie)
  const [bezig, setBezig] = useState(false)

  // Los bijgehouden van `waarde` (het bewerkveld), zodat een checklist-tik
  // meteen zichtbaar is zonder op de volledige paginaverversing te wachten.
  const [weergaveTekst, setWeergaveTekst] = useState(item.notitie)

  useEffect(() => {
    setWeergaveTekst(item.notitie)
    setWaarde(item.notitie)
  }, [item.notitie])

  function annuleer() {
    setWaarde(item.notitie)
    setBewerken(false)
  }

  async function vinkAf(regelIndex: number) {
    const vorigeTekst = weergaveTekst
    setWeergaveTekst(toggleCheckboxRegel(weergaveTekst, regelIndex)) // optimistisch
    try {
      await vinkNotitieRegelAf(item.id, regelIndex)
      router.refresh()
    } catch {
      setWeergaveTekst(vorigeTekst)
      toast.error("Bijwerken mislukt")
    }
  }

  async function opslaan() {
    const tekst = waarde.trim()
    if (!tekst) return
    setBezig(true)
    try {
      await werkNotitieBij(item.id, { notitie: tekst })
      toast.success("Bijgewerkt")
      setBewerken(false)
      router.refresh()
    } catch {
      toast.error("Bijwerken mislukt")
    } finally {
      setBezig(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {formatDatumLang(item.datumTijd.slice(0, 10))} · {formatTijd(item.datumTijd)}
        </span>

        {!bewerken && (
          <div className="flex flex-none items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setBewerken(true)}
              aria-label="Notitie bewerken"
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onVerwijder}
              aria-label="Notitie verwijderen"
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        )}
      </div>

      {bewerken ? (
        <div className="flex flex-col gap-3">
          <NotitieEditor
            waarde={waarde}
            onWaardeChange={setWaarde}
            rows={3}
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={annuleer} disabled={bezig}>
              <X className="size-4" data-icon="inline-start" />
              Annuleren
            </Button>
            <Button
              size="sm"
              onClick={opslaan}
              disabled={bezig || !waarde.trim()}
            >
              <Check className="size-4" data-icon="inline-start" />
              {bezig ? "Bezig..." : "Opslaan"}
            </Button>
          </div>
        </div>
      ) : (
        <NotitieWeergaveTekst tekst={weergaveTekst} onVinkAf={vinkAf} />
      )}
    </div>
  )
}
