"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { maakGezinAan, neemDeelMetCode } from "@/app/actions/gezinnen"

export function GezinOnboarding({ initialCode = "" }: { initialCode?: string }) {
  const router = useRouter()
  const [naam, setNaam] = useState("")
  const [code, setCode] = useState(initialCode)
  const [resultaat, setResultaat] = useState<string | null>(null)
  const [fout, setFout] = useState<string | null>(null)
  const [bezig, setBezig] = useState(false)
  const [gekopieerd, setGekopieerd] = useState(false)
  async function submitCreate(event: React.FormEvent) { event.preventDefault(); setBezig(true); setFout(null); try { const r = await maakGezinAan(naam); setResultaat(r.code); router.replace("/"); router.refresh() } catch (e) { setFout(e instanceof Error ? e.message : "Er ging iets mis.") } finally { setBezig(false) } }
  async function submitJoin(event: React.FormEvent) { event.preventDefault(); setBezig(true); setFout(null); try { await neemDeelMetCode(code); router.replace("/"); router.refresh() } catch (e) { setFout(e instanceof Error ? e.message : "Er ging iets mis.") } finally { setBezig(false) } }
  return <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col justify-center gap-6"><header className="flex flex-col gap-2"><p className="text-sm font-medium text-primary">Bijna klaar</p><h1 className="font-heading text-3xl font-semibold text-foreground">Koppel je Billenboek aan een gezin</h1><p className="text-muted-foreground">Werk samen met je partner of andere verzorgers in één gedeelde omgeving.</p></header><div className="grid gap-4 md:grid-cols-2"><Card><CardHeader><CardTitle>Start een nieuw gezin</CardTitle></CardHeader><CardContent><form onSubmit={submitCreate} className="flex flex-col gap-4"><label className="flex flex-col gap-2 text-sm font-medium">Gezinsnaam<Input value={naam} onChange={(e) => setNaam(e.target.value)} placeholder="Bijvoorbeeld: Familie De Vries" required minLength={2} /></label><Button type="submit" disabled={bezig}>{bezig ? "Bezig..." : "Gezin aanmaken"}</Button>{resultaat && <div className="flex flex-col gap-3 rounded-xl bg-primary/10 p-4 text-sm"><span>Je uitnodigingscode is <strong className="font-mono text-lg">{resultaat}</strong>. Deel deze code met je gezin.</span><div className="flex flex-wrap gap-2"><Button type="button" size="sm" variant="outline" onClick={() => { void navigator.clipboard.writeText(resultaat); setGekopieerd(true) }}>{gekopieerd ? "Gekopieerd" : "Code kopiëren"}</Button><Button type="button" size="sm" onClick={() => router.replace("/")}>Naar Vandaag</Button></div></div>}</form></CardContent></Card><Card><CardHeader><CardTitle>Ik heb een uitnodigingscode</CardTitle></CardHeader><CardContent><form onSubmit={submitJoin} className="flex flex-col gap-4"><label className="flex flex-col gap-2 text-sm font-medium">Uitnodigingscode<Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="AB12CD34" required minLength={6} /></label><Button type="submit" variant="outline" disabled={bezig}>{bezig ? "Bezig..." : "Deelnemen"}</Button></form></CardContent></Card></div>{fout && <p role="alert" className="text-sm text-destructive">{fout}</p>}</main>
}
