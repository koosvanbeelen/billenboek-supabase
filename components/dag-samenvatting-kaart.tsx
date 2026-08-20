"use client"

import Link from "next/link"
import { Milk, Baby, Thermometer, ChevronRight } from "lucide-react"
import { formatDatumLang } from "@/lib/datum"
import { TemperatuurIndicator } from "@/components/temperatuur-indicator"
import type { DagSamenvatting } from "@/app/actions/geschiedenis"

type Props = {
  dag: DagSamenvatting
}

export function DagSamenvattingKaart({ dag }: Props) {
  return (
    <Link
      href={`/geschiedenis?datum=${dag.datum}&detail=true`}
      className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-sm active:bg-primary/5"
    >
      {/* Linker kolom: datum */}
      <div className="min-w-0 flex-shrink-0">
        <div className="text-sm font-bold capitalize text-foreground">
          {formatDatumLang(dag.datum).split(" ").slice(0, 1).join("")}
        </div>
        <div className="text-xs text-muted-foreground">
          {formatDatumLang(dag.datum).split(" ").slice(1).join(" ")}
        </div>
      </div>

      {/* Midden kolom: tellers */}
      <div className="flex flex-1 items-center justify-around gap-2 px-2">
        {/* Voedingen */}
        <div className="flex flex-col items-center gap-1 text-center">
          <Milk className="size-4 text-primary" aria-hidden />
          <div className="text-sm font-bold text-foreground">
            {dag.voedingenAantal}
          </div>
          <div className="text-xs text-muted-foreground">{dag.voedingenMinuten}m</div>
        </div>

        {/* Luiers */}
        <div className="flex flex-col items-center gap-1 text-center">
          <Baby className="size-4 text-primary" aria-hidden />
          <div className="flex items-center gap-0.5 text-sm font-bold text-foreground">
            <span>{dag.luiersPoep}</span>
            <span className="text-xs">/</span>
            <span>{dag.luiersPlas}</span>
          </div>
          <div className="text-xs text-muted-foreground">poep/plas</div>
        </div>

        {/* Temperatuur */}
        {dag.gemiddeldeTemperatuur !== null ? (
          <div className="flex flex-col items-center gap-1 text-center">
            <Thermometer className="size-4 text-primary" aria-hidden />
            <TemperatuurIndicator
              temperatuur={dag.gemiddeldeTemperatuur}
              className="text-xs"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 text-center">
            <Thermometer className="size-4 text-muted-foreground/40" aria-hidden />
            <div className="text-xs text-muted-foreground/50">—</div>
          </div>
        )}
      </div>

      {/* Rechter kolom: chevron */}
      <ChevronRight className="size-5 flex-shrink-0 text-muted-foreground" aria-hidden />
    </Link>
  )
}
