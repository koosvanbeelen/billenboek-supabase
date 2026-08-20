import { cn } from "@/lib/utils"

// Een temperatuur tussen 36,5 en 37,5 is goed (groen), daarbuiten afwijkend (rood).
export function isTemperatuurGoed(temp: number): boolean {
  return temp >= 36.5 && temp <= 37.5
}

export function formatTemperatuur(temp: number): string {
  return `${temp.toFixed(1).replace(".", ",")}°C`
}

export function TemperatuurIndicator({
  temperatuur,
  groot = false,
  className,
}: {
  temperatuur: number
  groot?: boolean
  className?: string
}) {
  const goed = isTemperatuurGoed(temperatuur)
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full font-semibold tabular-nums",
        groot ? "px-4 py-2 text-2xl" : "px-2.5 py-0.5 text-sm",
        goed
          ? "bg-temp-good/15 text-temp-good"
          : "bg-temp-bad/15 text-temp-bad",
        className,
      )}
    >
      <span
        className={cn(
          "rounded-full",
          groot ? "size-3" : "size-2",
          goed ? "bg-temp-good" : "bg-temp-bad",
        )}
        aria-hidden
      />
      {formatTemperatuur(temperatuur)}
    </span>
  )
}
