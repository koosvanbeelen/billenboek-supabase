"use client"

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
  return (
    <Button type="submit" size="lg" className="h-14 w-full text-base" disabled={pending}>
      {pending ? <Spinner data-icon="inline-start" /> : null}
      Verder
    </Button>
  )
}

export function LoginForm() {
  const [state, formAction] = useActionState(inloggen, undefined)

  return (
    <Card className="w-full max-w-sm rounded-3xl shadow-sm">
      <CardHeader className="items-center text-center">
        <div className="mx-auto mb-2 flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <BookHeart className="size-8" />
        </div>
        <CardTitle className="text-2xl">Welkom bij Billenboek</CardTitle>
        <CardDescription className="text-pretty">
          Beantwoord de onderstaande vraag om verder te gaan.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-5">
          <Field data-invalid={state?.fout ? true : undefined}>
            <FieldLabel htmlFor="antwoord" className="text-base">
              De Here is mijn...
            </FieldLabel>
            <Input
              id="antwoord"
              name="antwoord"
              autoComplete="off"
              autoFocus
              required
              aria-invalid={state?.fout ? true : undefined}
              className="h-12 text-base"
            />
            {state?.fout ? (
              <p className="text-sm text-destructive" role="alert">
                {state.fout}
              </p>
            ) : null}
          </Field>
          <VerstuurKnop />
        </form>
      </CardContent>
    </Card>
  )
}
