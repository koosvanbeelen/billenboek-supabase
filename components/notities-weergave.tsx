"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { NotebookPen } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { NotitieEditor } from "@/components/notitie-editor"
import { LegeStatus } from "@/components/lege-status"
import { BevestigDialog } from "@/components/bevestig-dialog"
import { NotitieKaart } from "@/components/notitie-kaart"
import { voegNotitieToe, verwijderNotitie } from "@/app/actions/notities"
import type { NotitieItem } from "@/lib/types"

export function NotitiesWeergave({ notities }: { notities: NotitieItem[] }) {
  const router = useRouter()
  const [nieuweNotitie, setNieuweNotitie] = useState("")
  const [bezig, setBezig] = useState(false)
  const [teVerwijderen, setTeVerwijderen] = useState<NotitieItem | null>(null)
  const [verwijderBezig, setVerwijderBezig] = useState(false)

  async function toevoegen() {
    const tekst = nieuweNotitie.trim()
    if (!tekst) return
    setBezig(true)
    try {
      await voegNotitieToe({ notitie: tekst })
      toast.success("Notitie toegevoegd")
      setNieuweNotitie("")
      router.refresh()
    } catch {
      toast.error("Opslaan mislukt")
    } finally {
      setBezig(false)
    }
  }

  async function bevestigVerwijderen() {
    if (!teVerwijderen) return
    const item = teVerwijderen
    setTeVerwijderen(null)
    setVerwijderBezig(true)
    try {
      await verwijderNotitie(item.id)
      toast.success("Verwijderd")
      router.refresh()
    } catch {
      toast.error("Verwijderen mislukt")
    } finally {
      setVerwijderBezig(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-heading text-xl font-semibold text-foreground">
        Notities
      </h1>

      {/* Nieuwe notitie toevoegen */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
        <NotitieEditor
          waarde={nieuweNotitie}
          onWaardeChange={setNieuweNotitie}
          rows={3}
        />
        <Button
          onClick={toevoegen}
          disabled={bezig || !nieuweNotitie.trim()}
          size="lg"
          className="h-12 w-full text-base"
        >
          {bezig ? "Bezig..." : "Notitie toevoegen"}
        </Button>
      </div>

      {/* Lijst van bestaande notities */}
      {notities.length === 0 ? (
        <LegeStatus
          icon={NotebookPen}
          titel="Nog geen notities"
          beschrijving="Schrijf hierboven je eerste notitie."
        />
      ) : (
        <div
          className={
            verwijderBezig ? "flex flex-col gap-3 opacity-60" : "flex flex-col gap-3"
          }
        >
          {notities.map((item) => (
            <NotitieKaart
              key={item.id}
              item={item}
              onVerwijder={() => setTeVerwijderen(item)}
            />
          ))}
        </div>
      )}

      <BevestigDialog
        open={teVerwijderen !== null}
        onOpenChange={(o) => !o && setTeVerwijderen(null)}
        titel="Notitie verwijderen?"
        beschrijving="Dit kan niet ongedaan worden gemaakt."
        onBevestig={bevestigVerwijderen}
      />
    </div>
  )
}
