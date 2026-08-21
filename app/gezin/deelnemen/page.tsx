import { GezinOnboarding } from "@/components/gezin-onboarding"

export default async function DeelnemenPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const params = await searchParams
  return <GezinOnboarding initialCode={params.code ?? ""} />
}
