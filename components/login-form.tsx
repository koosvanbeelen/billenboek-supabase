"use client"

import Link from "next/link"
import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { inloggen } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"

function VerstuurKnop() {
  const { pending } = useFormStatus()
  return <Button type="submit" size="lg" className="h-14 w-full text-base" disabled={pending}>{pending ? <Spinner data-icon="inline-start" /> : null}Inloggen</Button>
}

export function LoginForm({ next = "/", melding }: { next?: string; melding?: string }) {
  const [state, formAction] = useActionState(inloggen, undefined)
  const registrerenHref = next !== "/" ? `/registreren?next=${encodeURIComponent(next)}` : "/registreren"
  return (
    <div>
      {melding ? <p className="mb-5 rounded-xl bg-primary/10 p-3 text-sm text-foreground" role="status">{melding}</p> : null}
      <form action={formAction} className="flex flex-col gap-5"><input type="hidden" name="next" value={next} />
        <Field><FieldLabel htmlFor="email">E-mailadres</FieldLabel><Input id="email" name="email" type="email" autoComplete="email" autoFocus required /></Field>
        <Field data-invalid={state?.fout ? true : undefined}><div className="flex items-center justify-between"><FieldLabel htmlFor="password">Wachtwoord</FieldLabel><Link href="/wachtwoord-vergeten" className="text-sm font-medium text-primary underline-offset-4 hover:underline">Vergeten?</Link></div><Input id="password" name="password" type="password" autoComplete="current-password" required aria-invalid={state?.fout ? true : undefined} />{state?.fout ? <p className="text-sm text-destructive" role="alert">{state.fout}</p> : null}</Field>
        <VerstuurKnop />
      </form>
      <p className="mt-5 text-center text-sm text-muted-foreground">Nog geen account? <Link href={registrerenHref} className="font-medium text-primary underline-offset-4 hover:underline">Registreren</Link></p>
    </div>
  )
}
