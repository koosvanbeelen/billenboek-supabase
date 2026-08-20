"use client"

import { useState, useEffect, useMemo, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { ActieKnop } from "@/components/actie-knop"
import { DagTellersRij } from "@/components/dag-tellers"
import { TijdlijnItem } from "@/components/tijdlijn-item"
import { LegeStatus } from "@/components/lege-status"
import { BevestigDialog } from "@/components/bevestig-dialog"
import {
  RegistratieDialog,
  type Bewerking,
} from "@/components/registratie-dialog"
import { DagSamenvattingKaart } from "@/components/dag-samenvatting-kaart"
import { useTijdlijnVolgorde } from "@/lib/tijdlijn-voorkeur"
import { ALLE_SOORTEN, useZichtbareFormulieren } from "@/lib/formulier-voorkeur"
import { useActieveTimer } from "@/lib/actieve-timer"
import { soortMeta } from "@/lib/soorten"
import { verwijderRegistratie } from "@/app/actions/registraties"
import { getGeschiedenis } from "@/app/actions/geschiedenis"
import { verschuifDatum, isVandaag, vandaagDatum, formatDatumLang, duurInMinuten, formatDuur } from "@/lib/datum"
import type { DagGegevens, Soort, TijdlijnItem as Item } from "@/lib/types"

type Props = {
  data: DagGegevens
  dag: string
  toonDetail: boolean
}

export function GeschiedenisWeergave({ data, dag, toonDetail }: Props) {
  const router = useRouter()
  const [bewerking, setBewerking] = useState<Bewerking | null>(null)
  const [teVerwijderen, setTeVerwijderen] = useState<{
    soort: Soort
    id: number
  } | null>(null)
  const [samenvattingen, setSamenvattingen] = useState<
    Awaited<ReturnType<typeof getGeschiedenis>> | null
  >(null)
  const [bezig, start] = useTransition()
  const [volgorde] = useTijdlijnVolgorde()
  const [zichtbaar] = useZichtbareFormulieren()
  const slaapTimer = useActieveTimer("slapen")
  const huilTimer = useActieveTimer("huilen")

  const zichtbareSoorten = useMemo(
    () => ALLE_SOORTEN.filter((s) => zichtbaar[s]),
    [zichtbaar],
  )

  // Respecteer dezelfde tijdlijn-voorkeur als "Vandaag" (in te stellen via
  // Instellingen).
  const items = useMemo(() => {
    const teken = volgorde === "oud-nieuw" ? 1 : -1
    return [...data.items].sort(
      (a, b) =>
        teken *
        (new Date(a.datumTijd).getTime() - new Date(b.datumTijd).getTime()),
    )
  }, [data.items, volgorde])

  // Bij mount: haal samenvattingen op als we in lijstweergave zijn
  useEffect(() => {
    if (toonDetail) return
    let actief = true
    start(async () => {
      try {
        const s = await getGeschiedenis()
        if (actief) setSamenvattingen(s)
      } catch {
        if (actief) toast.error("Kon geschiedenis niet laden")
      }
    })
    return () => {
      actief = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toonDetail])

  function gaTerug() {
    if (toonDetail) {
      router.push("/geschiedenis")
    }
  }

  function ga(dagen: number) {
    router.push(`/geschiedenis?datum=${verschuifDatum(dag, dagen)}&detail=true`)
  }

  function nieuw(soort: Soort) {
    setBewerking({ soort } as Bewerking)
  }

  // Zelfde live start/stop-timer als op "Vandaag" — alleen zinvol als deze
  // dag ook echt vandaag is. Tikken opent altijd het formulier; "terugkeren"
  // naar het formulier terwijl de timer loopt stopt 'm en berekent de
  // eindtijd (start + verstreken tijd).
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
        router.refresh()
      } catch {
        toast.error("Verwijderen mislukt")
      }
    })
  }

  // ===== LIJSTWEERGAVE (standaard): dagsamenvattingen =====
  if (!toonDetail) {
    return (
      <div className="flex flex-col gap-5">
        <h1 className="font-heading text-xl font-semibold text-foreground">
          Geschiedenis
        </h1>

        {samenvattingen && samenvattingen.length === 0 ? (
          <LegeStatus
            icon={Calendar}
            titel="Nog geen registraties"
            beschrijving="Voeg registraties toe in het tabblad 'Vandaag'."
          />
        ) : samenvattingen ? (
          <div className={bezig ? "flex flex-col gap-2 opacity-60" : "flex flex-col gap-2"}>
            {samenvattingen.map((s) => (
              <DagSamenvattingKaart key={s.datum} dag={s} />
            ))}
          </div>
        ) : (
          <div className="text-center text-sm text-muted-foreground">
            Bezig met laden...
          </div>
        )}
      </div>
    )
  }

  // ===== DETAILWEERGAVE: dezelfde als Vandaag (tijdlijn + bewerken/verwijderen) =====
  return (
    <div className="flex flex-col gap-5">
      {/* Terug naar lijstweergave */}
      <Button
        variant="ghost"
        size="sm"
        onClick={gaTerug}
        className="w-fit"
      >
        <ChevronLeft className="size-4" data-icon="inline-start" />
        Terug
      </Button>

      {/* Datumnavigatie */}
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => ga(-1)}
          aria-label="Vorige dag"
        >
          <ChevronLeft className="size-5" />
        </Button>

        <div className="text-center">
          <p className="font-heading text-base font-semibold capitalize text-foreground">
            {isVandaag(dag) ? "Vandaag" : formatDatumLang(dag).split(" ")[0]}
          </p>
          <p className="text-xs text-muted-foreground">{formatDatumLang(dag)}</p>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => ga(1)}
          aria-label="Volgende dag"
          disabled={isVandaag(dag)}
        >
          <ChevronRight className="size-5" />
        </Button>
      </div>

      <DagTellersRij tellers={data.tellers} />

      {/* Actieknoppen voor deze dag */}
      {zichtbareSoorten.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {zichtbareSoorten.map((soort) => {
            const meta = soortMeta[soort]
            const metTimer =
              isVandaag(dag) && (soort === "slapen" || soort === "huilen")
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
        <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Tijdlijn
        </h2>
        {data.items.length === 0 ? (
          <LegeStatus
            icon={Calendar}
            titel="Niks geregistreerd"
            beschrijving="Voor deze dag zijn nog geen registraties toegevoegd."
          />
        ) : (
          <div
            className={
              bezig ? "flex flex-col gap-2 opacity-60" : "flex flex-col gap-2"
            }
          >
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
          router.refresh()
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
