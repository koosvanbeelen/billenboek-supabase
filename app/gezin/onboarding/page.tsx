import { redirect } from "next/navigation"
import { GezinOnboarding } from "@/components/gezin-onboarding"
import { getActiefGezinId } from "@/lib/supabase/gezin"

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const params = await searchParams
  let heeftGezin = false
  try { await getActiefGezinId(); heeftGezin = true } catch {}
  if (heeftGezin) redirect("/")
  return <GezinOnboarding initialCode={params.code ?? ""} />
}
