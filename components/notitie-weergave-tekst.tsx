"use client"

import { parseNotitieRegels, tokenizeInline, type NotitieRegel } from "@/lib/notitie-opmaak"
import { cn } from "@/lib/utils"

type Props = {
  tekst: string
  /** Als meegegeven, worden checklist-items klikbaar. Anders alleen-lezen. */
  onVinkAf?: (regelIndex: number) => void
  className?: string
}

function InlineTekst({ tekst }: { tekst: string }) {
  const tokens = tokenizeInline(tekst)
  return (
    <>
      {tokens.map((token, i) => {
        if (token.type === "vet") {
          return (
            <strong key={i} className="font-semibold">
              {token.tekst}
            </strong>
          )
        }
        if (token.type === "cursief") {
          return (
            <em key={i} className="italic">
              {token.tekst}
            </em>
          )
        }
        return <span key={i}>{token.tekst}</span>
      })}
    </>
  )
}

export function NotitieWeergaveTekst({ tekst, onVinkAf, className }: Props) {
  const regels = parseNotitieRegels(tekst)

  // Groepeer opeenvolgende regels van hetzelfde lijsttype, zodat er één
  // <ul>/<ol> per aaneengesloten blok ontstaat in plaats van per regel.
  const groepen: Array<{ type: NotitieRegel["type"]; items: NotitieRegel[] }> = []
  for (const regel of regels) {
    const laatste = groepen[groepen.length - 1]
    if (laatste && laatste.type === regel.type && regel.type !== "paragraaf") {
      laatste.items.push(regel)
    } else {
      groepen.push({ type: regel.type, items: [regel] })
    }
  }

  return (
    <div className={cn("flex flex-col gap-1.5 text-sm leading-relaxed text-card-foreground", className)}>
      {groepen.map((groep, groepIndex) => {
        if (groep.type === "paragraaf") {
          return groep.items.map((regel) =>
            regel.tekst.trim() === "" ? (
              <div key={regel.regelIndex} className="h-1.5" aria-hidden="true" />
            ) : (
              <p key={regel.regelIndex} className="whitespace-pre-wrap">
                <InlineTekst tekst={regel.tekst} />
              </p>
            )
          )
        }

        if (groep.type === "bullet") {
          return (
            <ul key={groepIndex} className="list-disc space-y-1 pl-5 marker:text-muted-foreground">
              {groep.items.map((regel) => (
                <li key={regel.regelIndex}>
                  <InlineTekst tekst={regel.tekst} />
                </li>
              ))}
            </ul>
          )
        }

        if (groep.type === "genummerd") {
          return (
            <ol key={groepIndex} className="list-decimal space-y-1 pl-5 marker:text-muted-foreground">
              {groep.items.map((regel) => (
                <li key={regel.regelIndex}>
                  <InlineTekst tekst={regel.tekst} />
                </li>
              ))}
            </ol>
          )
        }

        // checkbox
        return (
          <ul key={groepIndex} className="space-y-1.5">
            {groep.items.map((regel) => {
              if (regel.type !== "checkbox") return null
              return (
                <li key={regel.regelIndex} className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={regel.afgevinkt}
                    onChange={() => onVinkAf?.(regel.regelIndex)}
                    disabled={!onVinkAf}
                    aria-label={regel.afgevinkt ? "Afvinken ongedaan maken" : "Afvinken"}
                    className="mt-0.5 size-4 shrink-0 rounded border-input accent-primary disabled:opacity-70"
                  />
                  <span className={cn(regel.afgevinkt && "text-muted-foreground line-through")}>
                    <InlineTekst tekst={regel.tekst} />
                  </span>
                </li>
              )
            })}
          </ul>
        )
      })}
    </div>
  )
}
