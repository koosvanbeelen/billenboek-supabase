import { AuthFooter, AuthShell } from "@/components/auth-shell"
import { WachtwoordVergetenForm } from "@/components/wachtwoord-vergeten-form"

export default async function WachtwoordVergetenPage({ searchParams }: { searchParams: Promise<{ fout?: string }> }) {
  const params = await searchParams
  return (
    <AuthShell eyebrow="Geen zorgen" title="Wachtwoord vergeten?" description="Vul je e-mailadres in. Je ontvangt een link om een nieuw wachtwoord te kiezen.">
      <WachtwoordVergetenForm
        melding={params.fout === "link" ? "Deze link is verlopen of al gebruikt. Vraag hieronder een nieuwe aan." : undefined}
      />
      <AuthFooter />
    </AuthShell>
  )
}
