import { redirect } from "next/navigation"
import { isIngelogd, veiligeNext } from "@/lib/auth"
import { LoginForm } from "@/components/login-form"
import { AuthFooter, AuthShell } from "@/components/auth-shell"

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; fout?: string; melding?: string }> }) {
  const params = await searchParams
  if (await isIngelogd()) {
    redirect("/")
  }

  return (
    <AuthShell eyebrow="Welkom terug" title="Log in op jullie Billenboek" description="Ga verder waar je gebleven was en houd de dag samen overzichtelijk.">
      <LoginForm
        next={veiligeNext(params.next)}
        melding={
          params.fout === "bevestiging"
            ? "Bevestigen is niet gelukt. Open de link in dezelfde browser als waar je je registreerde, of log in als je account al bevestigd is."
            : params.melding === "verwijderd"
              ? "Je account is verwijderd. Bedankt dat je Billenboek hebt gebruikt."
              : undefined
        }
      />
      <AuthFooter />
    </AuthShell>
  )
}
