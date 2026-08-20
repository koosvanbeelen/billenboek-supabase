"use client"

import { useMemo, useState, useTransition } from "react"
import { ChevronLeft, ChevronRight, CalendarDays, NotebookPen } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { ActieKnop } from "@/components/actie-knop"
import { DagTellersRij } from "@/components/dag-tellers"
import { TijdlijnItem } from "@/components/tijdlijn-item"
import { TijdlijnSorteerKnop } from "@/components/tijdlijn-sorteer-knop"
import { useTijdlijnVolgorde } from "@/lib/tijdlijn-voorkeur"
import { ALLE_SOORTEN, useZichtbareFormulieren } from "@/lib/formulier-voorkeur"
import { useActieveTimer } from "@/lib/actieve-timer"
import { soortMeta } from "@/lib/soorten"
import { LegeStatus } from "@/components/lege-status"
import { BevestigDialog } from "@/components/bevestig-dialog"
import { RegistratieDialog, type Bewerking } from "@/components/registratie-dialog"
import {
  formatDatumLang,
  verschuifDatum,
  isVandaag,
  vandaagDatum,
  duurInMinuten,
  formatDuur,
} from "@/lib/datum"
import { getDagGegevens, verwijderRegistratie } from "@/app/actions/registraties"
import type { DagGegevens, Soort, TijdlijnItem as Item } from "@/lib/types"

export function VandaagWeergave({ data: initieleData }: { data: DagGegevens }) {
  const [data, setData] = useState(initieleData)
  const [bewerking, setBewerking] = useState<Bewerking | null>(null)
  const [teVerwijderen, setTeVerwijderen] = useState<{
    soort: Soort
    id: number
  } | null>(null)
  const [volgorde, setVolgorde] = useTijdlijnVolgorde()
  const [zichtbaar] = useZichtbareFormulieren()
  const [bezig, start] = useTransition()
  const slaapTimer = useActieveTimer("slapen")
  const huilTimer = useActieveTimer("huilen")

  const zichtbareSoorten = useMemo(
    () => ALLE_SOORTEN.filter((s) => zichtbaar[s]),
    [zichtbaar],
  )

  const items = useMemo(() => {
    const teken = volgorde === "oud-nieuw" ? 1 : -1
    return [...data.items].sort(
      (a, b) =>
        teken *
        (new Date(a.datumTijd).getTime() - new Date(b.datumTijd).getTime()),
    )
  }, [data.items, volgorde])

  // Alle dag-navigatie blijft bewust client-side (React state) in plaats van
  // in de URL. Zo kan een herstelde/gebookmarkte URL nooit een oude datum
  // "bevriezen" wanneer de app opnieuw geopend wordt.
  function ververs(nieuweDatum: string) {
    start(async () => {
      const nieuweData = await getDagGegevens(nieuweDatum)
      setData(nieuweData)
    })
  }

  function ga(dagen: number) {
    ververs(verschuifDatum(data.datum, dagen))
  }

  function nieuw(soort: Soort) {
    setBewerking({ soort } as Bewerking)
  }

  // Tikken op Slapen/Huilen opent altijd het formulier:
  // - geen timer bezig: leeg formulier met een "Start timer"-knop erin.
  //   Die knop start de timer en sluit het formulier weer.
  // - timer loopt: het "terugkeren naar het formulier" stopt de timer en
  //   berekent de eindtijd (start + verstreken tijd), en opent het
  //   formulier voorgevuld.
  // - timer is al gestopt maar nog niet opgeslagen: opnieuw hetzelfde
  //   (vaste) formulier openen, tijden blijven ongewijzigd.
  function tikTimer(soort: "slapen" | "huilen") {
    const timer = soort === "slapen" ? slaapTimer : huilTimer
    if (timer.status === "lopend") {
      const voorinvulling = timer.stopTimer()
      if (voorinvulling) {
        setBewerking({ soort, voorinvulling, wisTimer: timer.wisTimer } as Bewerking)
      }
      return
    }
    if (timer.status === "wacht" && timer.entry?.einde) {
      setBewerking({
        soort,
        voorinvulling: { start: timer.entry.start, einde: timer.entry.einde },
        wisTimer: timer.wisTimer,
      } as Bewerking)
      return
    }
    setBewerking({ soort, onStartTimer: timer.beginTimer } as Bewerking)
  }

  function bewerk(item: Item) {
    setBewerking({ soort: item.soort, record: item.record } as Bewerking)
  }

  // Verwijderen start vanuit het bewerkformulier (in RegistratieDialog): het
  // formulier sluit direct, en de bestaande bevestigingsstap opent daarna.
  function verwijderVanuitFormulier() {
    if (!bewerking?.record) return
    setTeVerwijderen({ soort: bewerking.soort, id: bewerking.record.id })
    setBewerking(null)
  }

  function bevestigVerwijderen() {
    if (!teVerwijderen) return
    const target = teVerwijderen
    setTeVerwijderen(null)
    start(async () => {
      try {
        await verwijderRegistratie(target.soort, target.id)
        toast.success("Verwijderd")
        const nieuweData = await getDagGegevens(data.datum)
        setData(nieuweData)
      } catch {
        toast.error("Verwijderen mislukt")
      }
    })
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Datumnavigatie */}
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="icon" onClick={() => ga(-1)} aria-label="Vorige dag">
          <ChevronLeft className="size-5" />
        </Button>
        <div className="text-center">
          <p className="font-heading text-base font-semibold capitalize text-foreground">
            {isVandaag(data.datum) ? "Vandaag" : formatDatumLang(data.datum).split(" ")[0]}
          </p>
          <p className="text-xs text-muted-foreground">{formatDatumLang(data.datum)}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => ga(1)}
          aria-label="Volgende dag"
          disabled={isVandaag(data.datum)}
        >
          <ChevronRight className="size-5" />
        </Button>
      </div>

      {!isVandaag(data.datum) && (
        <Button
          variant="outline"
          size="sm"
          className="self-center"
          onClick={() => ververs(vandaagDatum())}
        >
          <CalendarDays className="size-4" data-icon="inline-start" />
          Terug naar vandaag
        </Button>
      )}

      <DagTellersRij tellers={data.tellers} />

      {/* Actieknoppen */}
      {zichtbareSoorten.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {zichtbareSoorten.map((soort) => {
            const meta = soortMeta[soort]
            const metTimer =
              isVandaag(data.datum) && (soort === "slapen" || soort === "huilen")
            if (metTimer) {
              const timer = soort === "slapen" ? slaapTimer : huilTimer
              const status = timer.status === "uit" ? undefined : timer.status
              const duurLabel =
                timer.status === "wacht" && timer.entry?.einde
                  ? formatDuur(duurInMinuten(timer.entry.start, timer.entry.einde))
                  : undefined
              return (
                <ActieKnop
                  key={soort}
                  label={meta.label}
                  icon={meta.icon}
                  status={status}
                  sinds={timer.startTijd}
                  duurLabel={duurLabel}
                  onClick={() => tikTimer(soort)}
                />
              )
            }
            return (
              <ActieKnop
                key={soort}
                label={meta.label}
                icon={meta.icon}
                onClick={() => nieuw(soort)}
              />
            )
          })}
        </div>
      )}

      {/* Tijdlijn */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Tijdlijn
          </h2>
          {data.items.length > 0 && (
            <TijdlijnSorteerKnop volgorde={volgorde} onWijzig={setVolgorde} />
          )}
        </div>
        {data.items.length === 0 ? (
          <LegeStatus
            icon={NotebookPen}
            titel="Nog niks vandaag"
            beschrijving="Tik op een knop hierboven om de eerste registratie toe te voegen."
          />
        ) : (
          <div className={bezig ? "flex flex-col gap-2 opacity-60" : "flex flex-col gap-2"}>
            {items.map((item) => (
              <TijdlijnItem
                key={`${item.soort}-${item.id}`}
                item={item}
                onBewerk={() => bewerk(item)}
              />
            ))}
          </div>
        )}
      </section>

      <RegistratieDialog
        bewerking={bewerking}
        onClose={() => {
          setBewerking(null)
          ververs(data.datum)
        }}
        onVerwijder={verwijderVanuitFormulier}
      />

      <BevestigDialog
        open={teVerwijderen !== null}
        onOpenChange={(o) => !o && setTeVerwijderen(null)}
        titel="Registratie verwijderen?"
        beschrijving="Dit kan niet ongedaan worden gemaakt."
        onBevestig={bevestigVerwijderen}
      />
    </div>
  )
}
