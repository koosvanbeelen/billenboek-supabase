"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { CalendarDays, NotebookPen, Settings, Sun } from "lucide-react"
import { cn } from "@/lib/utils"

const tabs = [
  { href: "/", label: "Vandaag", icon: Sun },
  { href: "/geschiedenis", label: "Geschiedenis", icon: CalendarDays },
  { href: "/notities", label: "Notities", icon: NotebookPen },
  { href: "/instellingen", label: "Instellingen", icon: Settings },
]

// Zijbalknavigatie voor laptop/desktop (lg+). Vervangt de BottomNav op die
// breedte; beide componenten bestaan naast elkaar en tonen/verbergen
// zichzelf puur via Tailwind-breakpoints (geen JS-detectie nodig).
export function SideNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Hoofdnavigatie"
      className="sticky top-16 hidden h-[calc(100dvh-4rem)] w-56 shrink-0 flex-col border-r border-border bg-card/60 px-3 py-8 lg:flex xl:w-64"
    >
      <div className="mb-8 px-3">
        <span className="font-heading text-lg font-semibold text-foreground">
          Billenboek
        </span>
      </div>
      <ul className="flex flex-col gap-1">
        {tabs.map((tab) => {
          const active =
            tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href)
          const Icon = tab.icon
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="size-5" aria-hidden />
                {tab.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
