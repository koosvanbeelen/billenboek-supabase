import {
  Milk,
  Baby,
  Thermometer,
  Wind,
  Pill,
  Sparkles,
  Ruler,
  Moon,
  Frown,
  FlaskConical,
  type LucideIcon,
} from "lucide-react"
import type { Soort } from "@/lib/types"

export const soortMeta: Record<
  Soort,
  { label: string; icon: LucideIcon; kleur: string }
> = {
  voeding: { label: "Voeding", icon: Milk, kleur: "text-sky-600 bg-sky-500/10" },
  luier: { label: "Luier", icon: Baby, kleur: "text-amber-600 bg-amber-500/10" },
  temperatuur: {
    label: "Temperatuur",
    icon: Thermometer,
    kleur: "text-rose-600 bg-rose-500/10",
  },
  boertje: { label: "Boertje", icon: Wind, kleur: "text-teal-600 bg-teal-500/10" },
  vitamine: {
    label: "Vitamine",
    icon: Sparkles,
    kleur: "text-primary bg-primary/10",
  },
  medicatie: {
    label: "Medicatie",
    icon: Pill,
    kleur: "text-indigo-600 bg-indigo-500/10",
  },
  groei: {
    label: "Groei",
    icon: Ruler,
    kleur: "text-emerald-600 bg-emerald-500/10",
  },
  slapen: {
    label: "Slapen",
    icon: Moon,
    kleur: "text-violet-600 bg-violet-500/10",
  },
  huilen: {
    label: "Huilen",
    icon: Frown,
    kleur: "text-orange-600 bg-orange-500/10",
  },
  kolven: {
    label: "Kolven",
    icon: FlaskConical,
    kleur: "text-cyan-600 bg-cyan-500/10",
  },
}
