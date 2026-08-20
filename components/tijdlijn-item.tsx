"use client"

import { cn } from "@/lib/utils"
import { TemperatuurIndicator } from "@/components/temperatuur-indicator"
import { soortMeta } from "@/lib/soorten"
import { formatTijd, formatDuur } from "@/lib/datum"
import type { TijdlijnItem as Item, VoedingItem } from "@/lib/types"

// Zet de borst-waarde van een voeding om naar leesbare tekst, inclusief
// volgorde wanneer beide kanten zijn gebruikt (bijv. "links, dan rechts").
function borstvoedingLabel(borst: VoedingItem["borst"]): string {
  switch (borst) {
    case "links":
      return "linker borst"
    case "rechts":
      return "rechter borst"
    case "links-rechts":
      return "links, dan rechts"
    case "rechts-links":
      return "rechts, dan links"
    case "beide":
      return "beide borsten"
    default:
      return "borst"
  }
}

function samenvatting(item: Item): React.ReactNode {
  switch (item.soort) {
    case "voeding": {
      const r = item.record
      if (r.type === "borstvoeding") {
        return `Borstvoeding · ${borstvoedingLabel(r.borst)}${r.duurMinuten ? ` · ${r.duurMinuten} min` : ""}`
      }
      if (r.type === "kolfmelk") {
        return `Gekolfde melk${r.hoeveelheidMl ? ` · ${r.hoeveelheidMl} ml` : ""}`
      }
      return `Kunstvoeding${r.hoeveelheidMl ? ` · ${r.hoeveelheidMl} ml` : ""}`
    }
    case "luier": {
      const r = item.record
      const delen = [
        r.poep && "poep",
        r.plas && "plas",
        r.schoon && "verschoond",
      ].filter(Boolean)
      return delen.join(" + ") || "luier"
    }
    case "temperatuur":
      return <TemperatuurIndicator temperatuur={item.record.temperatuur} />
    case "boertje":
      return "Boertje / spugen"
    case "vitamine": {
      const r = item.record
      const delen = [r.vitamineD && "Vitamine D", r.vitamineK && "Vitamine K"].filter(
        Boolean,
      )
      return delen.join(" + ")
    }
    case "medicatie": {
      const r = item.record
      return `${r.naam}${r.dosering ? ` · ${r.dosering}` : ""}`
    }
    case "groei": {
      const r = item.record
      const delen = [
        r.gewichtKg !== null && `${r.gewichtKg} kg`,
        r.lengteCm !== null && `${r.lengteCm} cm`,
      ].filter(Boolean)
      return delen.join(" · ") || "Groeimeting"
    }
    case "slapen":
      return `Geslapen · ${formatDuur(item.record.duurMinuten)}${
        item.record.locatie ? ` · ${item.record.locatie}` : ""
      }`
    case "huilen":
      return `Gehuild · ${formatDuur(item.record.duurMinuten)}${
        item.record.oorzaak ? ` · ${item.record.oorzaak}` : ""
      }`
    case "kolven": {
      const r = item.record
      const borst = r.borst === "beide" ? "beide borsten" : `${r.borst}er borst`
      return `Kolven · ${borst} · ${r.hoeveelheidMl} ml`
    }
  }
}

// De optionele opmerking staat, indien aanwezig, altijd op een eigen regel
// onder de rest van de kaart (niet afgekapt, mag meerdere regels beslaan).
function opmerking(item: Item): string | null {
  switch (item.soort) {
    case "voeding":
    case "medicatie":
    case "boertje":
    case "slapen":
      return item.record.notitie || null
    case "groei":
      return item.record.opmerking || null
    case "huilen":
      return item.record.troost || null
    case "kolven":
      return item.record.notitie || null
    default:
      return null
  }
}

export function TijdlijnItem({
  item,
  onBewerk,
}: {
  item: Item
  onBewerk: () => void
}) {
  const meta = soortMeta[item.soort]
  const Icon = meta.icon
  const notitie = opmerking(item)

  return (
    <button
      type="button"
      onClick={onBewerk}
      className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left transition-colors hover:bg-muted/40 active:bg-muted/60"
    >
      <span
        className={cn(
          "flex size-10 flex-none items-center justify-center rounded-full",
          meta.kleur,
        )}
      >
        <Icon className="size-5" aria-hidden />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="font-semibold tabular-nums text-card-foreground">
            {formatTijd(item.datumTijd)}
          </span>
          <span className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {meta.label}
          </span>
        </div>
        <div className="mt-0.5 truncate text-sm text-muted-foreground">
          {samenvatting(item)}
        </div>
        {notitie && (
          <div className="mt-0.5 whitespace-pre-line text-sm italic text-muted-foreground/80">
            {notitie}
          </div>
        )}
      </div>
    </button>
  )
}

