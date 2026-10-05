import { redirect } from "next/navigation"
import { isIngelogd, veiligeNext } from "@/lib/auth"
import { RegistreerForm } from "@/components/registreer-form"

export default async function RegistrerenPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const params = await searchParams
  if (await isIngelogd()) redirect("/")

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background p-6">
      <RegistreerForm next={veiligeNext(params.next)} />
    </main>
  )
}
