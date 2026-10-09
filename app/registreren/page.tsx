import { redirect } from "next/navigation"
import { isIngelogd, veiligeNext } from "@/lib/auth"
import { RegistreerForm } from "@/components/registreer-form"
import { AuthFooter, AuthShell } from "@/components/auth-shell"

export default async function RegistrerenPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const params = await searchParams
  if (await isIngelogd()) redirect("/")

  const next = veiligeNext(params.next)
  const uitgenodigd = next.startsWith("/gezin/deelnemen")
  return (
    <AuthShell
      eyebrow={uitgenodigd ? "Je bent uitgenodigd" : "Nieuw bij Billenboek"}
      title={uitgenodigd ? "Maak een account om mee te doen" : "Maak jullie veilige plek"}
      description={uitgenodigd ? "Na het aanmaken van je account sluit je direct aan bij het gezin dat je heeft uitgenodigd." : "Registreer je gratis en nodig daarna je gezin uit voor één gedeeld overzicht."}
    >
      <RegistreerForm next={next} />
      <AuthFooter />
    </AuthShell>
  )
}
