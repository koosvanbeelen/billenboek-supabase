"use client"

import Link from "next/link"
import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { BookHeart } from "lucide-react"
import { inloggen } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"

function VerstuurKnop() {
  const { pending } = useFormStatus()
  return <Button type="submit" size="lg" className="h-14 w-full text-base" disabled={pending}>{pending ? <Spinner data-icon="inline-start" /> : null}Inloggen</Button>
}

export function LoginForm() {
  const [state, formAction] = useActionState(inloggen, undefined)
  return (
    <Card className="w-full max-w-sm rounded-3xl shadow-sm">
      <CardHeader className="items-center text-center">
        <div className="mx-auto mb-2 flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary"><BookHeart className="size-8" /></div>
        <CardTitle className="text-2xl">Welkom bij Billenboek</CardTitle>
        <CardDescription>Log in om de gegevens van je baby veilig te bekijken.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-5">
          <Field><FieldLabel htmlFor="email">E-mailadres</FieldLabel><Input id="email" name="email" type="email" autoComplete="email" autoFocus required /></Field>
          <Field data-invalid={state?.fout ? true : undefined}><FieldLabel htmlFor="password">Wachtwoord</FieldLabel><Input id="password" name="password" type="password" autoComplete="current-password" required aria-invalid={state?.fout ? true : undefined} />{state?.fout ? <p className="text-sm text-destructive" role="alert">{state.fout}</p> : null}</Field>
          <VerstuurKnop />
        </form>
        <p className="mt-5 text-center text-sm text-muted-foreground">Nog geen account? <Link href="/registreren" className="font-medium text-primary underline-offset-4 hover:underline">Registreren</Link></p>
      </CardContent>
    </Card>
  )
}
