"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ListChecks, LayoutGrid } from "lucide-react"
import { toast } from "sonner"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { ALLE_SOORTEN, useZichtbareFormulieren } from "@/lib/formulier-voorkeur"
import { soortMeta } from "@/lib/soorten"
import {
  ALLE_TELLERS,
  MAX_TELLERS,
  useZichtbareTellers,
} from "@/lib/teller-voorkeur"
import { tellerMeta } from "@/lib/tellers"
import type { Soort } from "@/lib/types"

export function FormulierenEnTellersWeergave() {
  const router = useRouter()

  // Voorkomt een hydration-mismatch: de opgeslagen voorkeuren zijn pas na
  // mount bekend.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const [zichtbareFormulieren, zetFormulier] = useZichtbareFormulieren()
  const [zichtbareTellers, zetTeller] = useZichtbareTellers()

  function wijzigFormulier(soort: Soort, aan: boolean) {
    const aantalActief = ALLE_SOORTEN.filter((s) => zichtbareFormulieren[s]).length
    if (!aan && aantalActief <= 1) {
      toast.error("Minstens één formulier moet actief blijven")
      return
    }
    zetFormulier(soort, aan)
  }

  function wijzigTeller(id: (typeof ALLE_TELLERS)[number], aan: boolean) {
    if (aan && zichtbareTellers.length >= MAX_TELLERS) {
      toast.error(`Je kunt maximaal ${MAX_TELLERS} tellers selecteren`)
      return
    }
    zetTeller(id, aan)
  }

  return (
    <div className="flex flex-col gap-5">
      <Button variant="ghost" size="sm" onClick={() => router.back()} className="w-fit">
        <ChevronLeft className="size-4" data-icon="inline-start" />
        Terug
      </Button>

      <h1 className="font-heading text-xl font-semibold text-foreground">
        Formulieren en tellers
      </h1>

      {/* Formulieren */}
      <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <ListChecks className="size-5 text-primary" aria-hidden />
          <div className="flex flex-col">
            <span className="text-base font-medium text-card-foreground">
              Formulieren
            </span>
            <span className="text-sm text-muted-foreground">
              Kies welke registraties je wilt gebruiken. Bestaande gegevens
              blijven altijd zichtbaar.
            </span>
          </div>
        </div>
        <div className="flex flex-col divide-y divide-border">
          {ALLE_SOORTEN.map((soort) => {
            const meta = soortMeta[soort]
            const Icon = meta.icon
            return (
              <div
                key={soort}
                className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-3">
                  <Icon className="size-4 text-muted-foreground" aria-hidden />
                  <span className="text-sm font-medium text-card-foreground">
                    {meta.label}
                  </span>
                </div>
                {mounted ? (
                  <Switch
                    checked={zichtbareFormulieren[soort]}
                    onCheckedChange={(checked) => wijzigFormulier(soort, checked)}
                    aria-label={`${meta.label} aan of uit`}
                  />
                ) : (
                  <div className="h-[18.4px] w-[32px]" aria-hidden />
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* Tellers */}
      <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <LayoutGrid className="size-5 text-primary" aria-hidden />
          <div className="flex flex-col">
            <span className="text-base font-medium text-card-foreground">
              Tellers
            </span>
            <span className="text-sm text-muted-foreground">
              Kies maximaal {MAX_TELLERS} tellers voor bovenaan Vandaag en
              Geschiedenis
              {mounted && (
                <>
                  {" "}
                  ·{" "}
                  <span className="tabular-nums text-card-foreground">
                    {zichtbareTellers.length}/{MAX_TELLERS}
                  </span>{" "}
                  geselecteerd
                </>
              )}
            </span>
          </div>
        </div>
        <div className="flex flex-col divide-y divide-border">
          {ALLE_TELLERS.map((id) => {
            const meta = tellerMeta[id]
            const Icon = meta.icon
            const aan = zichtbareTellers.includes(id)
            const uitgeschakeld =
              mounted && !aan && zichtbareTellers.length >= MAX_TELLERS
            return (
              <div
                key={id}
                className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-3">
                  <Icon className="size-4 text-muted-foreground" aria-hidden />
                  <span
                    className={
                      uitgeschakeld
                        ? "text-sm font-medium text-muted-foreground/70"
                        : "text-sm font-medium text-card-foreground"
                    }
                  >
                    {meta.label}
                  </span>
                </div>
                {mounted ? (
                  <Switch
                    checked={aan}
                    disabled={uitgeschakeld}
                    onCheckedChange={(checked) => wijzigTeller(id, checked)}
                    aria-label={`${meta.label} aan of uit`}
                  />
                ) : (
                  <div className="h-[18.4px] w-[32px]" aria-hidden />
                )}
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
