// Lichte, veilige opmaak voor notities.
//
// We slaan notities op als platte tekst met een kleine, herkenbare syntax:
//   **vet**            -> vet
//   *cursief*          -> cursief
//   - tekst            -> opsomming (bullet)
//   1. tekst           -> genummerde lijst
//   - [ ] tekst        -> checklist-item (niet afgevinkt)
//   - [x] tekst        -> checklist-item (afgevinkt)
//
// Er wordt bewust GEEN HTML opgeslagen of geïnterpreteerd: alles wordt als
// platte tekst geparsed en als React-elementen gerenderd. Daardoor is er geen
// sanitatie tegen HTML-injectie nodig en werkt het overal hetzelfde, ook op
// mobiel.

export type NotitieRegel =
  | { type: "paragraaf"; tekst: string; regelIndex: number }
  | { type: "bullet"; tekst: string; regelIndex: number }
  | { type: "genummerd"; tekst: string; regelIndex: number }
  | { type: "checkbox"; tekst: string; afgevinkt: boolean; regelIndex: number }

const CHECKBOX_PATROON = /^-\s\[([ xX])\]\s?(.*)$/
const BULLET_PATROON = /^-\s(?!\[)(.*)$/
const GENUMMERD_PATROON = /^\d+\.\s(.*)$/

/** Splitst opgeslagen notitietekst in regels met hun opmaaktype. */
export function parseNotitieRegels(tekst: string): NotitieRegel[] {
  return tekst.split("\n").map((regel, regelIndex) => {
    const checkboxMatch = regel.match(CHECKBOX_PATROON)
    if (checkboxMatch) {
      return {
        type: "checkbox",
        tekst: checkboxMatch[2],
        afgevinkt: checkboxMatch[1].toLowerCase() === "x",
        regelIndex,
      }
    }

    const bulletMatch = regel.match(BULLET_PATROON)
    if (bulletMatch) {
      return { type: "bullet", tekst: bulletMatch[1], regelIndex }
    }

    const genummerdMatch = regel.match(GENUMMERD_PATROON)
    if (genummerdMatch) {
      return { type: "genummerd", tekst: genummerdMatch[1], regelIndex }
    }

    return { type: "paragraaf", tekst: regel, regelIndex }
  })
}

export type InlineToken =
  | { type: "tekst"; tekst: string }
  | { type: "vet"; tekst: string }
  | { type: "cursief"; tekst: string }

/** Herkent **vet** en *cursief* binnen een regel tekst. Niet genest. */
export function tokenizeInline(tekst: string): InlineToken[] {
  const tokens: InlineToken[] = []
  const regex = /\*\*(.+?)\*\*|\*(.+?)\*/g
  let laatsteIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(tekst)) !== null) {
    if (match.index > laatsteIndex) {
      tokens.push({ type: "tekst", tekst: tekst.slice(laatsteIndex, match.index) })
    }
    if (match[1] !== undefined) {
      tokens.push({ type: "vet", tekst: match[1] })
    } else {
      tokens.push({ type: "cursief", tekst: match[2] })
    }
    laatsteIndex = regex.lastIndex
  }

  if (laatsteIndex < tekst.length) {
    tokens.push({ type: "tekst", tekst: tekst.slice(laatsteIndex) })
  }

  return tokens
}

/** Wisselt het afgevinkt-teken van één regel in de opgeslagen tekst. */
export function toggleCheckboxRegel(tekst: string, regelIndex: number): string {
  const regels = tekst.split("\n")
  const regel = regels[regelIndex]
  if (regel === undefined) return tekst

  const match = regel.match(CHECKBOX_PATROON)
  if (!match) return tekst

  const nietAfgevinkt = match[1].toLowerCase() !== "x"
  regels[regelIndex] = `- [${nietAfgevinkt ? "x" : " "}] ${match[2]}`
  return regels.join("\n")
}
