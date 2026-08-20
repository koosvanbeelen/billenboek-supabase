"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// Herbruikbaar bevestigingsvenster (bijv. voor verwijderen).
export function BevestigDialog({
  open,
  onOpenChange,
  titel,
  beschrijving,
  bevestigLabel = "Verwijderen",
  onBevestig,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  titel: string
  beschrijving: string
  bevestigLabel?: string
  onBevestig: () => void
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle>{titel}</AlertDialogTitle>
          <AlertDialogDescription>{beschrijving}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuleren</AlertDialogCancel>
          <AlertDialogAction
            onClick={onBevestig}
            className="bg-destructive/10 text-destructive hover:bg-destructive/20"
          >
            {bevestigLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
