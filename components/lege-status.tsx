import type { LucideIcon } from "lucide-react"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export function LegeStatus({
  icon: Icon,
  titel,
  beschrijving,
}: {
  icon: LucideIcon
  titel: string
  beschrijving: string
}) {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon />
        </EmptyMedia>
        <EmptyTitle>{titel}</EmptyTitle>
        <EmptyDescription>{beschrijving}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}
