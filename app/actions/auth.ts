"use server"

import { redirect } from "next/navigation"
import { controleerAntwoord, maakSessie, verwijderSessie } from "@/lib/auth"

export async function inloggen(
  _prevState: { fout?: string } | undefined,
  formData: FormData,
): Promise<{ fout?: string }> {
  const antwoord = String(formData.get("antwoord") ?? "")

  if (!controleerAntwoord(antwoord)) {
    return { fout: "Dat is niet het juiste antwoord. Probeer het opnieuw." }
  }

  await maakSessie()
  redirect("/")
}

export async function uitloggen() {
  await verwijderSessie()
  redirect("/login")
}
