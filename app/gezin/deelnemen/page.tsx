import { redirect } from "next/navigation"
import { GezinOnboarding } from "@/components/gezin-onboarding"
import { getActiefGezinId } from "@/lib/supabase/gezin"
import { createClient } from "@/lib/supabase/server"

export default async function DeelnemenPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const next = `/gezin/deelnemen${params.code ? `?code=${encodeURIComponent(params.code)}` : ""}`
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`)

  let heeftGezin = false
  try { await getActiefGezinId(); heeftGezin = true } catch {}
  if (heeftGezin) redirect("/")
  return <GezinOnboarding initialCode={params.code ?? ""} />
}
