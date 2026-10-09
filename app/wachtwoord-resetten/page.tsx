import { redirect } from "next/navigation"
import { isIngelogd } from "@/lib/auth"
import { AuthFooter, AuthShell } from "@/components/auth-shell"
import { WachtwoordResettenForm } from "@/components/wachtwoord-resetten-form"

export default async function WachtwoordResettenPage() {
  // Zonder actieve (herstel)sessie is er niets te resetten: terug naar het begin.
  if (!(await isIngelogd())) redirect("/wachtwoord-vergeten?fout=link")
  return (
    <AuthShell eyebrow="Bijna klaar" title="Kies een nieuw wachtwoord" description="Gebruik minimaal 8 tekens. Daarna ga je direct door naar Billenboek.">
      <WachtwoordResettenForm />
      <AuthFooter />
    </AuthShell>
  )
}
