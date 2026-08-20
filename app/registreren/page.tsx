"use client"

import Link from "next/link"
import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { registreren } from "@/app/actions/auth"

function Submit() {
  const { pending } = useFormStatus()
  return <Button type="submit" className="w-full" disabled={pending}>{pending ? <Spinner data-icon="inline-start" /> : null}Account maken</Button>
}

export default function RegistrerenPage() {
  const [state, action] = useActionState(registreren, undefined)
  return <main className="flex min-h-screen items-center justify-center p-6"><Card className="w-full max-w-sm"><CardHeader><CardTitle>Account maken</CardTitle><CardDescription>Gebruik je e-mailadres om Billenboek veilig te gebruiken.</CardDescription></CardHeader><CardContent><form action={action} className="flex flex-col gap-4"><Field><FieldLabel htmlFor="email">E-mailadres</FieldLabel><Input id="email" name="email" type="email" autoComplete="email" required /></Field><Field><FieldLabel htmlFor="password">Wachtwoord</FieldLabel><Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required /></Field>{state?.fout ? <p className="text-sm text-destructive" role="alert">{state.fout}</p> : null}{state?.succes ? <p className="text-sm text-primary" role="status">{state.succes}</p> : null}<Submit /></form><p className="mt-4 text-center text-sm text-muted-foreground">Al een account? <Link href="/login" className="text-primary underline-offset-4 hover:underline">Inloggen</Link></p></CardContent></Card></main>
}
