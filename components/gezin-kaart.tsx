"use client"

import { useEffect, useState } from "react"
import { Check, Copy, Link2, MessageCircle, Share2, UserPlus } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { maakNieuweUitnodiging, type Gezinsgegevens } from "@/app/actions/gezinnen"

const ROL_LABEL: Record<string, string> = { eigenaar: "Eigenaar", lid: "Lid" }

function datumKort(iso: string) {
  return new Date(iso).toLocaleDateString("nl-NL", { day: "numeric", month: "long" })
}

export function GezinKaart({ gezinsgegevens }: { gezinsgegevens: Gezinsgegevens }) {
  const [uitnodiging, setUitnodiging] = useState(gezinsgegevens.actieveCode)
  const [bezig, setBezig] = useState(false)
  const [gekopieerd, setGekopieerd] = useState(false)
  const [origin, setOrigin] = useState("")
  const [kanDelen, setKanDelen] = useState(false)

  // window bestaat pas na mount; zo blijft de server-render identiek aan de eerste client-render.
  useEffect(() => {
    setOrigin(window.location.origin)
    setKanDelen(typeof navigator !== "undefined" && typeof navigator.share === "function")
  }, [])

  const gezinNaam = gezinsgegevens.gezin?.naam ?? "ons gezin"
  const link = uitnodiging && origin ? `${origin}/gezin/deelnemen?code=${encodeURIComponent(uitnodiging.code)}` : ""
  const bericht = `Doe mee met ons Billenboek (${gezinNaam}). Open deze link en maak een account: ${link}`

  async function nieuweCode() {
    setBezig(true)
    try {
      setUitnodiging(await maakNieuweUitnodiging())
      setGekopieerd(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Nieuwe code aanmaken lukt niet.")
    } finally {
      setBezig(false)
    }
  }

  async function kopieer() {
    try {
      await navigator.clipboard.writeText(link)
      setGekopieerd(true)
      toast.success("Link gekopieerd")
      setTimeout(() => setGekopieerd(false), 3000)
    } catch {
      toast.error("Kopiëren lukt niet. Selecteer de code en kopieer die zelf.")
    }
  }

  async function deel() {
    try {
      await navigator.share({ title: "Billenboek", text: bericht })
    } catch {
      // Geannuleerd door de gebruiker: geen foutmelding nodig.
    }
  }

  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-4">
      <div>
        <p className="text-sm text-muted-foreground">Gezin</p>
        <h2 className="text-lg font-semibold text-card-foreground">{gezinsgegevens.gezin?.naam}</h2>
      </div>

      <ul className="flex flex-col gap-3" aria-label="Gezinsleden">
        {gezinsgegevens.leden.map((lid) => {
          const naam = lid.naam ?? "Gezinslid"
          return (
            <li key={lid.user_id} className="flex items-center gap-3">
              <span className="flex size-10 flex-none items-center justify-center rounded-full bg-primary/10 text-base font-semibold text-primary" aria-hidden>
                {naam.charAt(0).toUpperCase()}
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-base font-medium text-card-foreground">
                  {naam}{lid.ben_ik ? " (jij)" : ""}
                </span>
                <span className="text-sm text-muted-foreground">{ROL_LABEL[lid.rol] ?? lid.rol}</span>
              </div>
            </li>
          )
        })}
      </ul>

      <div className="flex flex-col gap-3 rounded-xl bg-muted/60 p-3">
        <div className="flex items-center gap-2 text-sm font-medium text-card-foreground">
          <UserPlus className="size-4 text-primary" aria-hidden />
          Iemand uitnodigen
        </div>

        {uitnodiging ? (
          <>
            <div className="flex items-center justify-between gap-3 rounded-lg bg-background px-3 py-2">
              <span className="font-mono text-lg tracking-widest text-foreground" aria-label="Uitnodigingscode">{uitnodiging.code}</span>
              <span className="text-xs text-muted-foreground">geldig t/m {datumKort(uitnodiging.vervalt_op)}</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {kanDelen ? (
                <Button className="col-span-2 h-12 text-base" onClick={deel} disabled={!link}>
                  <Share2 data-icon="inline-start" aria-hidden />Deel uitnodiging
                </Button>
              ) : null}
              <Button
                variant={kanDelen ? "outline" : "default"}
                className="h-12 text-base"
                render={<a href={link ? `https://wa.me/?text=${encodeURIComponent(bericht)}` : undefined} target="_blank" rel="noopener noreferrer" />}
                nativeButton={false}
                disabled={!link}
              >
                <MessageCircle data-icon="inline-start" aria-hidden />WhatsApp
              </Button>
              <Button variant="outline" className="h-12 text-base" onClick={kopieer} disabled={!link}>
                {gekopieerd ? <Check data-icon="inline-start" aria-hidden /> : <Copy data-icon="inline-start" aria-hidden />}
                {gekopieerd ? "Gekopieerd" : "Kopieer link"}
              </Button>
            </div>

            <p className="flex items-start gap-2 text-xs text-muted-foreground">
              <Link2 className="mt-0.5 size-3.5 flex-none" aria-hidden />
              Wie de link opent, maakt een account en sluit meteen aan bij {gezinNaam}. Of vul de code in tijdens het aanmelden.
            </p>
            <Button variant="ghost" className="h-12" onClick={nieuweCode} disabled={bezig}>
              {bezig ? "Bezig..." : "Nieuwe code maken"}
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">Er is nog geen geldige uitnodigingscode. Maak er een om iemand te laten aansluiten.</p>
            <Button className="h-12 text-base" onClick={nieuweCode} disabled={bezig}>
              {bezig ? "Bezig..." : "Uitnodiging maken"}
            </Button>
          </>
        )}
      </div>
    </section>
  )
}
