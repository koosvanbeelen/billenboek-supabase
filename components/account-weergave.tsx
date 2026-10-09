"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, KeyRound, LogOut, Trash2, UserRound } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { bewaarNaam, verwijderAccount, wijzigWachtwoord, type AccountGegevens } from "@/app/actions/account"
import { uitloggen } from "@/app/actions/auth"

type Props = { account: AccountGegevens; aantalLeden: number; ikBenEigenaar: boolean }

export function AccountWeergave({ account, aantalLeden, ikBenEigenaar }: Props) {
  const router = useRouter()

  // Profiel
  const [naam, setNaam] = useState(account.naam)
  const [naamBezig, setNaamBezig] = useState(false)
  const [naamFout, setNaamFout] = useState<string | null>(null)

  async function bewaar(e: FormEvent) {
    e.preventDefault()
    setNaamBezig(true)
    setNaamFout(null)
    const uitkomst = await bewaarNaam(naam)
    setNaamBezig(false)
    if (!uitkomst.ok) return setNaamFout(uitkomst.fout)
    toast.success("Naam opgeslagen")
    router.refresh()
  }

  // Wachtwoord
  const [huidig, setHuidig] = useState("")
  const [nieuw, setNieuw] = useState("")
  const [bevestig, setBevestig] = useState("")
  const [pwBezig, setPwBezig] = useState(false)
  const [pwFout, setPwFout] = useState<string | null>(null)

  async function wijzig(e: FormEvent) {
    e.preventDefault()
    setPwBezig(true)
    setPwFout(null)
    const uitkomst = await wijzigWachtwoord(huidig, nieuw, bevestig)
    setPwBezig(false)
    if (!uitkomst.ok) return setPwFout(uitkomst.fout)
    setHuidig("")
    setNieuw("")
    setBevestig("")
    toast.success("Wachtwoord gewijzigd")
  }

  // Account verwijderen
  const [verwijderOpen, setVerwijderOpen] = useState(false)
  const [verwijderWachtwoord, setVerwijderWachtwoord] = useState("")
  const [verwijderBezig, setVerwijderBezig] = useState(false)
  const [verwijderFout, setVerwijderFout] = useState<string | null>(null)

  function sluitVerwijder(open: boolean) {
    setVerwijderOpen(open)
    if (!open) {
      setVerwijderWachtwoord("")
      setVerwijderFout(null)
    }
  }

  async function verwijder(e: FormEvent) {
    e.preventDefault()
    setVerwijderBezig(true)
    setVerwijderFout(null)
    const uitkomst = await verwijderAccount(verwijderWachtwoord)
    if (!uitkomst.ok) {
      setVerwijderBezig(false)
      return setVerwijderFout(uitkomst.fout)
    }
    router.replace("/login?melding=verwijderd")
  }

  const laatsteLid = aantalLeden <= 1
  const kaart = "flex flex-col gap-4 rounded-2xl border border-border bg-card p-4"

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon-lg" className="size-12" onClick={() => router.push("/instellingen")} aria-label="Terug naar instellingen">
          <ChevronLeft className="size-5" aria-hidden />
        </Button>
        <h1 className="font-heading text-xl font-semibold text-foreground">Account</h1>
      </div>

      <section className={kaart}>
        <div className="flex items-center gap-3">
          <UserRound className="size-5 text-primary" aria-hidden />
          <span className="text-base font-medium text-card-foreground">Profiel</span>
        </div>
        <form onSubmit={bewaar} className="flex flex-col gap-4">
          <Field data-invalid={naamFout ? true : undefined}>
            <FieldLabel htmlFor="naam">Jouw naam</FieldLabel>
            <Input id="naam" value={naam} onChange={(e) => setNaam(e.target.value)} maxLength={40} required autoComplete="given-name" className="h-12" aria-invalid={naamFout ? true : undefined} />
            {naamFout ? <p className="text-sm text-destructive" role="alert">{naamFout}</p> : <p className="text-sm text-muted-foreground">Zo zien je gezinsleden je in Billenboek.</p>}
          </Field>
          <Field>
            <FieldLabel htmlFor="email">E-mailadres</FieldLabel>
            <Input id="email" value={account.email} readOnly disabled className="h-12" />
          </Field>
          <Button type="submit" className="h-12 text-base" disabled={naamBezig || naam.trim() === account.naam}>
            {naamBezig ? <Spinner data-icon="inline-start" /> : null}Naam opslaan
          </Button>
        </form>
      </section>

      <section className={kaart}>
        <div className="flex items-center gap-3">
          <KeyRound className="size-5 text-primary" aria-hidden />
          <span className="text-base font-medium text-card-foreground">Wachtwoord wijzigen</span>
        </div>
        <form onSubmit={wijzig} className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="huidig">Huidig wachtwoord</FieldLabel>
            <Input id="huidig" type="password" value={huidig} onChange={(e) => setHuidig(e.target.value)} autoComplete="current-password" required className="h-12" />
          </Field>
          <Field>
            <FieldLabel htmlFor="nieuw">Nieuw wachtwoord</FieldLabel>
            <Input id="nieuw" type="password" value={nieuw} onChange={(e) => setNieuw(e.target.value)} autoComplete="new-password" minLength={8} required className="h-12" />
          </Field>
          <Field data-invalid={pwFout ? true : undefined}>
            <FieldLabel htmlFor="bevestig">Herhaal nieuw wachtwoord</FieldLabel>
            <Input id="bevestig" type="password" value={bevestig} onChange={(e) => setBevestig(e.target.value)} autoComplete="new-password" minLength={8} required className="h-12" aria-invalid={pwFout ? true : undefined} />
            {pwFout ? <p className="text-sm text-destructive" role="alert">{pwFout}</p> : null}
          </Field>
          <Button type="submit" variant="outline" className="h-12 text-base" disabled={pwBezig}>
            {pwBezig ? <Spinner data-icon="inline-start" /> : null}Wachtwoord wijzigen
          </Button>
        </form>
      </section>

      <section className={kaart}>
        <form action={uitloggen}>
          <Button type="submit" variant="outline" className="h-12 w-full text-base">
            <LogOut data-icon="inline-start" aria-hidden />Uitloggen
          </Button>
        </form>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-destructive/30 bg-card p-4">
        <div className="flex items-center gap-3">
          <Trash2 className="size-5 text-destructive" aria-hidden />
          <div className="flex flex-col">
            <span className="text-base font-medium text-card-foreground">Account verwijderen</span>
            <span className="text-sm text-muted-foreground">
              {laatsteLid
                ? "Je bent het enige lid: het hele gezin en alle registraties worden verwijderd."
                : "Je registraties blijven bewaard voor de andere gezinsleden."}
            </span>
          </div>
        </div>
        <Button variant="destructive" className="h-12 text-base" onClick={() => setVerwijderOpen(true)}>
          Account verwijderen
        </Button>
      </section>

      <Dialog open={verwijderOpen} onOpenChange={sluitVerwijder}>
        <DialogContent className="rounded-3xl">
          <form onSubmit={verwijder} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>Account definitief verwijderen?</DialogTitle>
              <DialogDescription>
                {laatsteLid
                  ? "Je bent het enige lid van dit gezin. Het gezin met alle voedingen, luiers, notities en andere registraties wordt voorgoed verwijderd."
                  : `Je account wordt verwijderd en je verlaat het gezin. De registraties blijven bewaard voor de andere gezinsleden.${ikBenEigenaar ? " De eigenaarsrol gaat naar het langst aangesloten lid." : ""}`}
                {" "}Dit kan niet ongedaan worden gemaakt.
              </DialogDescription>
            </DialogHeader>
            <Field data-invalid={verwijderFout ? true : undefined}>
              <FieldLabel htmlFor="verwijder-wachtwoord">Bevestig met je wachtwoord</FieldLabel>
              <Input id="verwijder-wachtwoord" type="password" value={verwijderWachtwoord} onChange={(e) => setVerwijderWachtwoord(e.target.value)} autoComplete="current-password" required className="h-12" aria-invalid={verwijderFout ? true : undefined} />
              {verwijderFout ? <p className="text-sm text-destructive" role="alert">{verwijderFout}</p> : null}
            </Field>
            <DialogFooter>
              <Button type="button" variant="outline" className="h-12" onClick={() => sluitVerwijder(false)} disabled={verwijderBezig}>Annuleren</Button>
              <Button type="submit" variant="destructive" className="h-12" disabled={verwijderBezig || !verwijderWachtwoord}>
                {verwijderBezig ? <Spinner data-icon="inline-start" /> : null}Definitief verwijderen
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
