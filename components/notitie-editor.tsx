"use client"

import { useRef, type KeyboardEvent } from "react"
import { Bold, Italic, List, ListOrdered, ListTodo } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Props = {
  waarde: string
  onWaardeChange: (waarde: string) => void
  disabled?: boolean
  autoFocus?: boolean
  rows?: number
  placeholder?: string
}

// Patronen mét inhoud (voor Enter-afhandeling: we moeten weten of een regel leeg is).
const CHECKBOX_MET_INHOUD = /^-\s\[([ xX])\]\s?(.*)$/
const BULLET_MET_INHOUD = /^-\s(?!\[)(.*)$/
const GENUMMERD_MET_INHOUD = /^(\d+)\.\s(.*)$/

// Patronen zonder capture (voor herkennen/strippen bij de knoppen).
const CHECKBOX_PATROON = /^-\s\[[ xX]\]\s?/
const BULLET_PATROON = /^-\s(?!\[)/
const GENUMMERD_PATROON = /^\d+\.\s/

const TEXTAREA_CLASSNAME =
  "flex field-sizing-content min-h-16 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80"

export function NotitieEditor({
  waarde,
  onWaardeChange,
  disabled,
  autoFocus,
  rows = 3,
  placeholder = "Schrijf een losse gedachte of aantekening...",
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function stelSelectieIn(start: number, eind: number) {
    requestAnimationFrame(() => {
      const el = textareaRef.current
      if (!el) return
      el.focus()
      el.setSelectionRange(start, eind)
    })
  }

  // Zet opmaaktekens rond de selectie, of haalt ze weg als de selectie er al
  // mee omringd is. Voor cursief (enkel sterretje) wordt expliciet
  // uitgesloten dat dit per ongeluk een deel van **vet** (dubbel sterretje)
  // te pakken krijgt — dat veroorzaakte eerder inconsistente opmaak.
  function omringSelectie(marker: "**" | "*") {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    const eind = el.selectionEnd
    const geselecteerd = waarde.slice(start, eind)

    const voor = waarde.slice(Math.max(0, start - marker.length), start)
    const na = waarde.slice(eind, eind + marker.length)

    let isAlOmringd = voor === marker && na === marker
    if (isAlOmringd && marker === "*") {
      const tekenDaarvoor = waarde.charAt(start - marker.length - 1)
      const tekenErna = waarde.charAt(eind + marker.length)
      // Dit is een los sterretje van *cursief*, niet een deel van **vet**.
      if (tekenDaarvoor === "*" || tekenErna === "*") {
        isAlOmringd = false
      }
    }

    if (isAlOmringd) {
      const nieuw = waarde.slice(0, start - marker.length) + geselecteerd + waarde.slice(eind + marker.length)
      onWaardeChange(nieuw)
      stelSelectieIn(start - marker.length, eind - marker.length)
      return
    }

    const nieuw = waarde.slice(0, start) + marker + geselecteerd + marker + waarde.slice(eind)
    onWaardeChange(nieuw)
    stelSelectieIn(start + marker.length, eind + marker.length)
  }

  // Zet of verwijdert een regelprefix (bullet/genummerd/checklist) op alle
  // geselecteerde regels. Bij `groepeerAangrenzend` (gebruikt voor
  // genummerde lijsten) wordt het blok eerst uitgebreid naar direct
  // aangrenzende regels die al hetzelfde patroon hebben, zodat de hele lijst
  // in één keer consistent doorgenummerd wordt — ook als je maar op één
  // regel klikt.
  function wisselRegelPrefix(
    maakPrefix: (volgnummer: number) => string,
    herkenPatroon: RegExp,
    groepeerAangrenzend = false
  ) {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    const eind = el.selectionEnd

    let blokStart = waarde.lastIndexOf("\n", start - 1) + 1
    let blokEind = waarde.indexOf("\n", eind)
    if (blokEind === -1) blokEind = waarde.length

    if (groepeerAangrenzend) {
      while (blokStart > 0) {
        const vorigeRegelStart = waarde.lastIndexOf("\n", blokStart - 2) + 1
        const vorigeRegel = waarde.slice(vorigeRegelStart, blokStart - 1)
        if (!herkenPatroon.test(vorigeRegel)) break
        blokStart = vorigeRegelStart
      }
      while (blokEind < waarde.length) {
        const zoekVanaf = blokEind + 1
        const eindeVolgende = waarde.indexOf("\n", zoekVanaf)
        const volgendeRegelEind = eindeVolgende === -1 ? waarde.length : eindeVolgende
        const volgendeRegel = waarde.slice(zoekVanaf, volgendeRegelEind)
        if (!herkenPatroon.test(volgendeRegel)) break
        blokEind = volgendeRegelEind
      }
    }

    const blokRegels = waarde.slice(blokStart, blokEind).split("\n")
    const alHeleBlokPrefix = blokRegels.every(
      (regel) => herkenPatroon.test(regel) || regel.trim() === ""
    )

    let volgnummer = 1
    const nieuweRegels = blokRegels.map((regel) => {
      const kaleTekst = regel
        .replace(CHECKBOX_PATROON, "")
        .replace(BULLET_PATROON, "")
        .replace(GENUMMERD_PATROON, "")

      if (alHeleBlokPrefix || regel.trim() === "") {
        return kaleTekst
      }
      const prefix = maakPrefix(volgnummer)
      volgnummer += 1
      return prefix + kaleTekst
    })

    const nieuwBlok = nieuweRegels.join("\n")
    const nieuweWaarde = waarde.slice(0, blokStart) + nieuwBlok + waarde.slice(blokEind)
    onWaardeChange(nieuweWaarde)
    stelSelectieIn(blokStart, blokStart + nieuwBlok.length)
  }

  // Bij Enter binnen een lijstregel: zet dezelfde opmaak voort op de nieuwe
  // regel (bullet -> bullet, genummerd -> volgende nummer, checklist ->
  // nieuwe onaangevinkte checkbox). Op een lege lijstregel beëindigt Enter
  // juist de lijst, zoals gebruikelijk in tekstverwerkers.
  function afhandelenEnter(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== "Enter" || e.shiftKey) return
    const el = textareaRef.current
    if (!el) return

    const selStart = el.selectionStart
    const selEnd = el.selectionEnd

    const regelStart = waarde.lastIndexOf("\n", selStart - 1) + 1
    let regelEind = waarde.indexOf("\n", selStart)
    if (regelEind === -1) regelEind = waarde.length
    const huidigeRegel = waarde.slice(regelStart, regelEind)

    const checkboxMatch = huidigeRegel.match(CHECKBOX_MET_INHOUD)
    const bulletMatch = !checkboxMatch ? huidigeRegel.match(BULLET_MET_INHOUD) : null
    const genummerdMatch = huidigeRegel.match(GENUMMERD_MET_INHOUD)

    let vervolgPrefix: string | null = null
    let regelIsLeeg = false

    if (checkboxMatch) {
      vervolgPrefix = "- [ ] "
      regelIsLeeg = checkboxMatch[2].trim() === ""
    } else if (bulletMatch) {
      vervolgPrefix = "- "
      regelIsLeeg = bulletMatch[1].trim() === ""
    } else if (genummerdMatch) {
      const volgendeNummer = Number.parseInt(genummerdMatch[1], 10) + 1
      vervolgPrefix = `${volgendeNummer}. `
      regelIsLeeg = genummerdMatch[2].trim() === ""
    }

    if (vervolgPrefix === null) return // geen lijst-context: standaardgedrag van Enter laten gebeuren

    e.preventDefault()

    if (regelIsLeeg) {
      // Lege lijstregel + Enter = lijst beëindigen.
      const nieuweWaarde = waarde.slice(0, regelStart) + waarde.slice(regelEind)
      onWaardeChange(nieuweWaarde)
      stelSelectieIn(regelStart, regelStart)
      return
    }

    const invoeging = "\n" + vervolgPrefix
    const nieuweWaarde = waarde.slice(0, selStart) + invoeging + waarde.slice(selEnd)
    onWaardeChange(nieuweWaarde)
    const nieuweCursor = selStart + invoeging.length
    stelSelectieIn(nieuweCursor, nieuweCursor)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5" role="toolbar" aria-label="Tekstopmaak">
        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          onClick={() => omringSelectie("**")}
          disabled={disabled}
          aria-label="Vet"
        >
          <Bold className="size-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          onClick={() => omringSelectie("*")}
          disabled={disabled}
          aria-label="Cursief"
        >
          <Italic className="size-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          onClick={() => wisselRegelPrefix(() => "- ", BULLET_PATROON)}
          disabled={disabled}
          aria-label="Opsomming"
        >
          <List className="size-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          onClick={() => wisselRegelPrefix((n) => `${n}. `, GENUMMERD_PATROON, true)}
          disabled={disabled}
          aria-label="Genummerde lijst"
        >
          <ListOrdered className="size-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          onClick={() => wisselRegelPrefix(() => "- [ ] ", CHECKBOX_PATROON)}
          disabled={disabled}
          aria-label="Checklist"
        >
          <ListTodo className="size-4" />
        </Button>
      </div>
      <textarea
        ref={textareaRef}
        value={waarde}
        onChange={(e) => onWaardeChange(e.target.value)}
        onKeyDown={afhandelenEnter}
        rows={rows}
        autoFocus={autoFocus}
        disabled={disabled}
        placeholder={placeholder}
        className={cn(TEXTAREA_CLASSNAME)}
      />
    </div>
  )
}
