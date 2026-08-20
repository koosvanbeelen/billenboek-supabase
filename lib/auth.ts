import { cookies } from "next/headers"

// Eenvoudige toegangscontrole zonder accounts.
// De juiste woordvraag geeft toegang en zet een sessiecookie van 30 dagen.
export const SESSIE_COOKIE = "billenboek_sessie"
export const SESSIE_TOKEN = "billenboek-bewaarder-toegang"
export const JUISTE_ANTWOORD = "Bewaarder"
const DERTIG_DAGEN = 60 * 60 * 24 * 30

export function controleerAntwoord(antwoord: string): boolean {
  return antwoord.trim().toLowerCase() === JUISTE_ANTWOORD.toLowerCase()
}

export async function isIngelogd(): Promise<boolean> {
  const store = await cookies()
  return store.get(SESSIE_COOKIE)?.value === SESSIE_TOKEN
}

export async function maakSessie() {
  const store = await cookies()
  store.set(SESSIE_COOKIE, SESSIE_TOKEN, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: DERTIG_DAGEN,
    path: "/",
  })
}

export async function verwijderSessie() {
  const store = await cookies()
  store.delete(SESSIE_COOKIE)
}
