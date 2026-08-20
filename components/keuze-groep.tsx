"use client"

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"

type Optie<T extends string> = { waarde: T; label: string }

// Single-select wrapper rond base-ui ToggleGroup (die met arrays werkt).
export function KeuzeGroep<T extends string>({
  waarde,
  opties,
  onChange,
  className,
}: {
  waarde: T
  opties: Optie<T>[]
  onChange: (waarde: T) => void
  className?: string
}) {
  return (
    <ToggleGroup
      value={[waarde]}
      onValueChange={(groep) => {
        const volgende = groep.find((g) => g !== waarde) ?? groep[0]
        if (volgende) onChange(volgende as T)
      }}
      className={cn("w-full", className)}
    >
      {opties.map((o) => (
        <ToggleGroupItem
          key={o.waarde}
          value={o.waarde}
          variant="outline"
          className="h-12 min-w-0 flex-1 truncate px-1.5 text-[13px] leading-tight data-pressed:border-primary data-pressed:bg-primary/10 data-pressed:text-primary sm:px-2.5 sm:text-base"
        >
          {o.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
