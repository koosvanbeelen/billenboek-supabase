import type { ReactNode } from "react"
import { BookHeart, ShieldCheck } from "lucide-react"

export function AuthShell({ children, eyebrow, title, description }: { children: ReactNode; eyebrow: string; title: string; description: string }) {
  return (
    <main className="relative flex min-h-dvh items-center overflow-hidden bg-[#f5f7f4] px-4 py-8 text-foreground sm:px-6">
      <div className="pointer-events-none absolute -left-24 -top-24 size-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-20 size-80 rounded-full bg-amber-200/30 blur-3xl" />
      <div className="relative mx-auto grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-border/70 bg-card shadow-xl shadow-primary/5 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="hidden flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex">
          <div>
            <div className="flex items-center gap-3 text-lg font-semibold"><span className="flex size-10 items-center justify-center rounded-xl bg-white/15"><BookHeart className="size-5" /></span>Billenboek</div>
            <div className="mt-24 max-w-sm"><p className="text-sm font-medium text-primary-foreground/70">Inzicht in je dag</p><h2 className="mt-0 text-4xl font-semibold tracking-tight">Samen overzicht houden over de dag van je kleintje.</h2><p className="mt-5 leading-7 text-primary-foreground/75">Een veilige plek voor ouders en verzorgers om het ritme van jullie gezin bij te houden.</p></div>
          </div>
          <div className="flex items-center gap-2 text-sm text-primary-foreground/75"><ShieldCheck className="size-4" />Je gegevens blijven binnen jouw gezin</div>
        </section>
        <section className="flex items-center justify-center p-5 sm:p-10"><div className="w-full max-w-sm"><div className="mb-7 lg:hidden"><div className="flex items-center gap-3 text-lg font-semibold"><span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><BookHeart className="size-5" /></span>Billenboek</div></div><p className="text-sm font-medium text-primary">{eyebrow}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p><div className="mt-8">{children}</div></div></section>
      </div>
    </main>
  )
}

export function AuthFooter() {
  return <p className="mt-6 text-center text-xs text-muted-foreground">Beveiligd met Supabase Auth · Alleen jij en je gezin hebben toegang</p>
}
