import { redirect } from "next/navigation"
import { isIngelogd, veiligeNext } from "@/lib/auth"
import { LoginForm } from "@/components/login-form"

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; fout?: string }> }) {
  const params = await searchParams
  if (await isIngelogd()) {
    redirect("/")
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background p-6">
      <LoginForm
        next={veiligeNext(params.next)}
        melding={
          params.fout === "bevestiging"
            ? "Bevestigen is niet gelukt. Open de link in dezelfde browser als waar je je registreerde, of log in als je account al bevestigd is."
            : undefined
        }
      />
    </main>
  )
}
