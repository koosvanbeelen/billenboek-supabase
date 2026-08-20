"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useTheme } from "next-themes"
import {
  Moon,
  DatabaseZap,
  Info,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Smartphone,
  Share,
  ArrowDownNarrowWide,
  ListChecks,
  ChevronRight,
} from "lucide-react"
import { toast } from "sonner"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { BevestigDialog } from "@/components/bevestig-dialog"
import { controleerDatabase } from "@/app/actions/systeem"
import { usePwaInstall } from "@/components/pwa-install-provider"
import {
  useTijdlijnVolgorde,
  resetTijdlijnVolgorde,
} from "@/lib/tijdlijn-voorkeur"
import { resetZichtbareFormulieren } from "@/lib/formulier-voorkeur"
import { resetZichtbareTellers } from "@/lib/teller-voorkeur"

type DbStatus = { ok: boolean; bericht: string }

export function InstellingenWeergave({ versie }: { versie: string }) {
  // Voorkomt een hydration-mismatch: het thema is pas na mount bekend.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const { theme, setTheme } = useTheme()
  const { installable, installed, isIos, promptInstall } = usePwaInstall()
  const [volgorde, setVolgorde] = useTijdlijnVolgorde()

  const [installBezig, setInstallBezig] = useState(false)

  async function installeerApp() {
    setInstallBezig(true)
    try {
      const uitkomst = await promptInstall()
      if (uitkomst === "accepted") {
        toast.success("Billenboek wordt geïnstalleerd")
      } else if (uitkomst === "unavailable") {
        toast.error("Installeren is nu niet beschikbaar in deze browser")
      }
    } finally {
      setInstallBezig(false)
    }
  }

  const [dbBezig, setDbBezig] = useState(false)
  const [dbStatus, setDbStatus] = useState<DbStatus | null>(null)

  const [resetOpen, setResetOpen] = useState(false)

  async function testVerbinding() {
    setDbBezig(true)
    setDbStatus(null)
    try {
      const resultaat = await controleerDatabase()
      setDbStatus(resultaat)
    } catch {
      setDbStatus({
        ok: false,
        bericht: "Geen verbinding met de database. Probeer het later opnieuw.",
      })
    } finally {
      setDbBezig(false)
    }
  }

  function resetVoorkeuren() {
    setTheme("light")
    resetTijdlijnVolgorde()
    resetZichtbareFormulieren()
    resetZichtbareTellers()
    setDbStatus(null)
    setResetOpen(false)
    toast.success("Voorkeuren gereset")
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-heading text-xl font-semibold text-foreground">
        Instellingen
      </h1>

      {/* Formulieren en tellers (submenu) */}
      <Link
        href="/instellingen/formulieren-en-tellers"
        className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-accent"
      >
        <ListChecks className="size-5 text-primary" aria-hidden />
        <div className="flex flex-1 flex-col">
          <span className="text-base font-medium text-card-foreground">
            Formulieren en tellers
          </span>
          <span className="text-sm text-muted-foreground">
            Kies welke registraties en tellers je gebruikt
          </span>
        </div>
        <ChevronRight className="size-5 flex-none text-muted-foreground" aria-hidden />
      </Link>

      {/* Tijdlijn */}
      <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <ArrowDownNarrowWide className="size-5 text-primary" aria-hidden />
            <div className="flex flex-col">
              <span className="text-base font-medium text-card-foreground">
                Nieuwste eerst
              </span>
              <span className="text-sm text-muted-foreground">
                Bepaalt de volgorde van de tijdlijn in Vandaag en Geschiedenis
              </span>
            </div>
          </div>
          {mounted ? (
            <Switch
              checked={volgorde === "nieuw-oud"}
              onCheckedChange={(checked) =>
                setVolgorde(checked ? "nieuw-oud" : "oud-nieuw")
              }
              aria-label="Nieuwste eerst aan of uit"
            />
          ) : (
            <div className="h-[18.4px] w-[32px]" aria-hidden />
          )}
        </div>
      </section>

      {/* Weergave */}
      <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Moon className="size-5 text-primary" aria-hidden />
            <div className="flex flex-col">
              <span className="text-base font-medium text-card-foreground">
                Donkere modus
              </span>
              <span className="text-sm text-muted-foreground">
                Lichte modus is de standaard
              </span>
            </div>
          </div>
          {mounted ? (
            <Switch
              checked={theme === "dark"}
              onCheckedChange={(checked) =>
                setTheme(checked ? "dark" : "light")
              }
              aria-label="Donkere modus aan of uit"
            />
          ) : (
            <div className="h-[18.4px] w-[32px]" aria-hidden />
          )}
        </div>
      </section>

      {/* App installeren, databaseverbinding en appversie */}
      <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <Smartphone className="size-5 text-primary" aria-hidden />
          <div className="flex flex-col">
            <span className="text-base font-medium text-card-foreground">
              App installeren
            </span>
            <span className="text-sm text-muted-foreground">
              Zet Billenboek op je startscherm voor snelle toegang
            </span>
          </div>
        </div>

        {installed ? (
          <div className="flex items-center gap-2 rounded-xl bg-temp-good/15 px-3 py-2 text-sm font-medium text-temp-good">
            <CheckCircle2 className="size-4 flex-none" aria-hidden />
            Billenboek is al geïnstalleerd op dit apparaat
          </div>
        ) : installable ? (
          <Button onClick={installeerApp} disabled={installBezig}>
            {installBezig ? "Bezig..." : "Installeer app"}
          </Button>
        ) : isIos ? (
          <div className="flex items-start gap-2 rounded-xl bg-muted px-3 py-2 text-sm text-muted-foreground">
            <Share className="size-4 flex-none translate-y-0.5" aria-hidden />
            <span>
              Tik op <strong className="text-card-foreground">Deel</strong> onderin Safari en kies
              vervolgens <strong className="text-card-foreground">Zet op beginscherm</strong>.
            </span>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Installeren wordt niet ondersteund in deze browser.
          </p>
        )}

        <Separator />

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <DatabaseZap className="size-5 text-primary" aria-hidden />
            <div className="flex flex-col">
              <span className="text-base font-medium text-card-foreground">
                Databaseverbinding
              </span>
              <span className="text-sm text-muted-foreground">
                Controleer of de app de database kan bereiken
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={testVerbinding}
            disabled={dbBezig}
          >
            {dbBezig ? "Bezig..." : "Testen"}
          </Button>
        </div>

        {dbStatus && (
          <div
            className={
              dbStatus.ok
                ? "flex items-center gap-2 rounded-xl bg-temp-good/15 px-3 py-2 text-sm font-medium text-temp-good"
                : "flex items-center gap-2 rounded-xl bg-temp-bad/15 px-3 py-2 text-sm font-medium text-temp-bad"
            }
          >
            {dbStatus.ok ? (
              <CheckCircle2 className="size-4 flex-none" aria-hidden />
            ) : (
              <XCircle className="size-4 flex-none" aria-hidden />
            )}
            {dbStatus.bericht}
          </div>
        )}

        <Separator />

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Info className="size-5 text-primary" aria-hidden />
            <span className="text-base font-medium text-card-foreground">
              Appversie
            </span>
          </div>
          <span className="text-sm tabular-nums text-muted-foreground">
            {versie}
          </span>
        </div>
      </section>

      {/* Voorkeuren resetten */}
      <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <RotateCcw className="size-5 text-destructive" aria-hidden />
          <div className="flex flex-col">
            <span className="text-base font-medium text-card-foreground">
              Voorkeuren resetten
            </span>
            <span className="text-sm text-muted-foreground">
              Zet weergave-instellingen terug naar de standaard
            </span>
          </div>
        </div>
        <Button
          variant="outline"
          className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => setResetOpen(true)}
        >
          Voorkeuren resetten
        </Button>
      </section>

      <BevestigDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        titel="Voorkeuren resetten?"
        beschrijving="Donkere modus wordt uitgezet, de tijdlijnvolgorde gaat terug naar oudste eerst, alle formulieren worden weer actief en de tellers gaan terug naar de standaard 4."
        onBevestig={resetVoorkeuren}
      />
    </div>
  )
}
