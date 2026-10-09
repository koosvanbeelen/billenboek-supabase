import { NextResponse } from "next/server"
import type { EmailOtpType } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import { veiligeNext } from "@/lib/auth"

// Bevestiging via token_hash (verifyOtp). In tegenstelling tot de ?code=-flow hoeft de
// link niet in dezelfde browser geopend te worden als waar de aanvraag begon. Dat is
// belangrijk voor de geïnstalleerde app: mail-apps openen links in Safari/Chrome en niet
// in de PWA. Vereist een aangepast e-mailtemplate in Supabase (zie LEES_MIJ.md).
const TOEGESTANE_TYPES: EmailOtpType[] = ["recovery", "signup", "email", "magiclink", "invite", "email_change"]

export async function GET(request: Request) {
  const url = new URL(request.url)
  const tokenHash = url.searchParams.get("token_hash")
  const type = url.searchParams.get("type") as EmailOtpType | null
  const next = veiligeNext(url.searchParams.get("next"))

  if (tokenHash && type && TOEGESTANE_TYPES.includes(type)) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    if (!error) return NextResponse.redirect(new URL(next, url.origin))
    console.error("[auth/bevestigen] verifyOtp mislukt", error.message)
  }

  if (type === "recovery") {
    return NextResponse.redirect(new URL("/wachtwoord-vergeten?fout=link", url.origin))
  }
  return NextResponse.redirect(new URL(`/login?fout=bevestiging&next=${encodeURIComponent(next)}`, url.origin))
}
