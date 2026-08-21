import { GezinOnboarding } from "@/components/gezin-onboarding"

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const params = await searchParams
  return <GezinOnboarding initialCode={params.code ?? ""} />
}
