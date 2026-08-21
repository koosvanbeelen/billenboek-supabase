import { redirect } from "next/navigation"
import { isIngelogd } from "@/lib/auth"
import { LoginForm } from "@/components/login-form"

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const params = await searchParams
  if (await isIngelogd()) {
    redirect("/")
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background p-6">
      <LoginForm next={params.next} />
    </main>
  )
}
