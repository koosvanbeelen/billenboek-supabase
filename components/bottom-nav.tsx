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

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Hoofdnavigatie"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur lg:hidden"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-around px-2 pb-safe pt-1.5">
        {tabs.map((tab) => {
          const active =
            tab.href === "/"
              ? pathname === "/"
              : pathname.startsWith(tab.href)
          const Icon = tab.icon
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1.5 text-xs font-medium transition-colors",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-6" aria-hidden />
                <span>{tab.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
