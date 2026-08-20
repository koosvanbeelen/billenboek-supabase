import { redirect } from "next/navigation"
import { isIngelogd } from "@/lib/auth"
import { BottomNav } from "@/components/bottom-nav"
import { SideNav } from "@/components/side-nav"
import { Header } from "@/components/header"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  if (!(await isIngelogd())) {
    redirect("/login")
  }

  return (
    <div className="min-h-dvh bg-background">
      <Header />
      <div className="lg:flex">
        <SideNav />
        {/*
          Breedte per apparaat:
          - mobiel (< md):  max-w-md, ongewijzigd
          - tablet (md-lg): 80% van de paginabreedte
          - desktop (lg+):  vult de ruimte naast de zijbalk, met een zachte
            bovengrens (2xl) zodat regels op zeer brede monitors leesbaar blijven
        */}
        <div className="mx-auto flex min-h-dvh w-full max-w-md flex-1 flex-col md:max-w-[80%] lg:mx-0 lg:max-w-none">
          <main className="flex-1 px-4 pb-28 pt-6 md:px-8 md:pt-8 lg:px-8 lg:pb-10 lg:pt-10 xl:px-12 2xl:mx-auto 2xl:w-full 2xl:max-w-[1600px]">
            {children}
          </main>
          <BottomNav />
        </div>
      </div>
    </div>
  )
}

