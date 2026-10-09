"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { herstelWachtwoord } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"

function VerstuurKnop() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="lg" className="h-14 w-full text-base" disabled={pending}>
      {pending ? <Spinner data-icon="inline-start" /> : null}Wachtwoord opslaan
    </Button>
  )
}

export function WachtwoordResettenForm() {
  const [state, formAction] = useActionState(herstelWachtwoord, undefined)
  return (
    <form action={formAction} className="flex flex-col gap-5">
      <Field>
        <FieldLabel htmlFor="password">Nieuw wachtwoord</FieldLabel>
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} autoFocus required />
      </Field>
      <Field data-invalid={state?.fout ? true : undefined}>
        <FieldLabel htmlFor="bevestig">Herhaal wachtwoord</FieldLabel>
        <Input id="bevestig" name="bevestig" type="password" autoComplete="new-password" minLength={8} required aria-invalid={state?.fout ? true : undefined} />
        {state?.fout ? <p className="text-sm text-destructive" role="alert">{state.fout}</p> : null}
      </Field>
      <VerstuurKnop />
    </form>
  )
}
