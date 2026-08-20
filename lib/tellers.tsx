import {
  Milk,
  Hourglass,
  Baby,
  Droplet,
  Layers,
  Clock,
  FlaskConical,
  Moon,
  Frown,
  type LucideIcon,
} from "lucide-react"
import type { TellerId } from "@/lib/teller-voorkeur"

export const tellerMeta: Record<TellerId, { label: string; icon: LucideIcon }> = {
  voedingenAantal: { label: "Aantal voedingen", icon: Milk },
  borsttijd: { label: "Borsttijd", icon: Hourglass },
  poepluier: { label: "Poepluier", icon: Baby },
  plasluier: { label: "Plasluier", icon: Droplet },
  totaalLuiers: { label: "Totaal luiers", icon: Layers },
  tijdSindsVoeding: { label: "Tijd sinds laatste voeding", icon: Clock },
  tijdSindsLuier: { label: "Tijd sinds laatste luier", icon: Clock },
  mlGekolfd: { label: "Milliliter gekolfd", icon: FlaskConical },
  totaleSlaaptijd: { label: "Totale slaaptijd", icon: Moon },
  totaleHuiltijd: { label: "Totale huiltijd", icon: Frown },
}
