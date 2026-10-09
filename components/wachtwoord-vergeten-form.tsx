"use client"

import Link from "next/link"
import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { wachtwoordVergeten } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"

function VerstuurKnop() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="lg" className="h-14 w-full text-base" disabled={pending}>
      {pending ? <Spinner data-icon="inline-start" /> : null}Stuur herstellink
    </Button>
  )
}

export function WachtwoordVergetenForm({ melding }: { melding?: string }) {
  const [state, formAction] = useActionState(wachtwoordVergeten, undefined)
  return (
    <div>
      {melding ? <p className="mb-5 rounded-xl bg-primary/10 p-3 text-sm text-foreground" role="status">{melding}</p> : null}
      {state?.succes ? (
        <p className="rounded-xl bg-primary/10 p-4 text-sm text-foreground" role="status">{state.succes}</p>
      ) : (
        <form action={formAction} className="flex flex-col gap-5">
          <Field data-invalid={state?.fout ? true : undefined}>
            <FieldLabel htmlFor="email">E-mailadres</FieldLabel>
            <Input id="email" name="email" type="email" autoComplete="email" autoFocus required aria-invalid={state?.fout ? true : undefined} />
            {state?.fout ? <p className="text-sm text-destructive" role="alert">{state.fout}</p> : null}
          </Field>
          <VerstuurKnop />
        </form>
      )}
      <p className="mt-5 text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">Terug naar inloggen</Link>
      </p>
    </div>
  )
}
