import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { veiligeNext } from "@/lib/auth"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const next = veiligeNext(url.searchParams.get("next"))

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(new URL(next, url.origin))
    console.error("[auth/callback] code uitwisselen mislukt", error.message)
  }

  if (next.startsWith("/wachtwoord-resetten")) {
    return NextResponse.redirect(new URL("/wachtwoord-vergeten?fout=link", url.origin))
  }
  return NextResponse.redirect(new URL(`/login?fout=bevestiging&next=${encodeURIComponent(next)}`, url.origin))
}
