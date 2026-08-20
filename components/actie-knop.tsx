"use client"

import { useEffect, useState } from "react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { verstrekenSeconden } from "@/lib/actieve-timer"

function formatVerstreken(seconden: number): string {
  const uren = Math.floor(seconden / 3600)
  const minuten = Math.floor((seconden % 3600) / 60)
  const sec = seconden % 60
  const mm = String(minuten).padStart(2, "0")
  const ss = String(sec).padStart(2, "0")
  return uren > 0 ? `${uren}:${mm}:${ss}` : `${mm}:${ss}`
}

// Grote actieknop met icoon en label. Minimaal 48x48 tikvlak.
//
// Optioneel ondersteunt de knop een timerstatus (voor Slapen/Huilen):
// - "lopend": de timer loopt, knop kleurt lichtgroen en toont de verstreken
//   tijd sinds `sinds` in plaats van het label.
// - "wacht": de timer is gestopt maar nog niet opgeslagen, knop kleurt
//   amber en toont de vaste duur (`duurLabel`) in plaats van het label.
export function ActieKnop({
  label,
  icon: Icon,
  onClick,
  className,
  status,
  sinds = null,
  duurLabel,
}: {
  label: string
  icon: LucideIcon
  onClick: () => void
  className?: string
  status?: "lopend" | "wacht"
  sinds?: string | null
  duurLabel?: string
}) {
  const [verstreken, setVerstreken] = useState(0)

  useEffect(() => {
    if (status !== "lopend" || !sinds) return
    setVerstreken(verstrekenSeconden(sinds))
    const interval = setInterval(() => {
      setVerstreken(verstrekenSeconden(sinds))
    }, 1000)
    return () => clearInterval(interval)
  }, [status, sinds])

  const tekst =
    status === "lopend"
      ? formatVerstreken(verstreken)
      : status === "wacht"
        ? (duurLabel ?? "Afronden")
        : label

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={status !== undefined}
      className={cn(
        "flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border p-4 text-center shadow-sm transition-colors",
        status === "lopend" && "border-temp-good/40 bg-temp-good/15",
        status === "wacht" && "border-amber-400/50 bg-amber-400/15",
        !status && "border-border bg-card hover:bg-accent",
        "active:translate-y-px",
        "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        className,
      )}
    >
      <span
        className={cn(
          "flex size-12 items-center justify-center rounded-full",
          status === "lopend" && "bg-temp-good/20 text-temp-good",
          status === "wacht" && "bg-amber-400/20 text-amber-700 dark:text-amber-400",
          !status && "bg-primary/10 text-primary",
        )}
      >
        <Icon className="size-6" aria-hidden />
      </span>
      <span
        className={cn(
          "text-sm font-medium tabular-nums",
          status === "lopend" && "text-temp-good",
          status === "wacht" && "text-amber-700 dark:text-amber-400",
          !status && "text-card-foreground",
        )}
      >
        {tekst}
      </span>
    </button>
  )
}
