import { redirect } from "next/navigation"
import { isIngelogd, veiligeNext } from "@/lib/auth"
import { RegistreerForm } from "@/components/registreer-form"
import { AuthFooter, AuthShell } from "@/components/auth-shell"

export default async function RegistrerenPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const params = await searchParams
  if (await isIngelogd()) redirect("/")

  return (
    <AuthShell eyebrow="Nieuw bij Billenboek" title="Maak jullie veilige plek" description="Registreer je gratis en nodig daarna je gezin uit voor één gedeeld overzicht.">
      <RegistreerForm next={veiligeNext(params.next)} />
      <AuthFooter />
    </AuthShell>
  )
}
