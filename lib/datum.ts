// Datum-/tijdhulpmiddelen.
//
// Alle momenten worden opgeslagen en getoond als "wandkloktijd". Een ingevoerde
// tijd van 07:15 verschijnt overal als 07:15, onafhankelijk van de tijdzone van
// de server. Intern bewaren we de wandkloktijd als UTC-instant en formatteren we
// altijd met UTC-componenten. De huidige tijd bepalen we in de Nederlandse zone.

const TZ = "Europe/Amsterdam"

function pad(n: number): string {
  return String(n).padStart(2, "0")
}

// Onderdelen van "nu" in de Nederlandse tijdzone.
function nlOnderdelen(): {
  jaar: number
  maand: number
  dag: number
  uur: number
  minuut: number
} {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
  const delen = Object.fromEntries(
    fmt.formatToParts(new Date()).map((p) => [p.type, p.value]),
  ) as Record<string, string>
  return {
    jaar: Number(delen.year),
    maand: Number(delen.month),
    dag: Number(delen.day),
    uur: delen.hour === "24" ? 0 : Number(delen.hour),
    minuut: Number(delen.minute),
  }
}

// "yyyy-MM-ddTHH:mm" voor de huidige NL-tijd (datetime-local input).
export function nuInputWaarde(): string {
  const o = nlOnderdelen()
  return `${o.jaar}-${pad(o.maand)}-${pad(o.dag)}T${pad(o.uur)}:${pad(o.minuut)}`
}

// "yyyy-MM-dd" voor de huidige NL-datum.
export function vandaagDatum(): string {
  const o = nlOnderdelen()
  return `${o.jaar}-${pad(o.maand)}-${pad(o.dag)}`
}

// Opgeslagen Date -> "yyyy-MM-ddTHH:mm" (UTC-componenten = wandkloktijd).
export function datumNaarInput(d: Date): string {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(
    d.getUTCDate(),
  )}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`
}

// "yyyy-MM-ddTHH:mm" -> Date (wandkloktijd opgeslagen als UTC-instant).
export function inputNaarDatum(v: string): Date {
  return new Date(`${v}:00.000Z`)
}

// Begin- en eindgrens van een kalenderdag ("yyyy-MM-dd").
export function dagGrenzen(datum: string): { van: Date; tot: Date } {
  return {
    van: new Date(`${datum}T00:00:00.000Z`),
    tot: new Date(`${datum}T23:59:59.999Z`),
  }
}

// "07:15" uit een opgeslagen moment.
export function formatTijd(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d
  return `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`
}

const WEEKDAGEN = [
  "zondag",
  "maandag",
  "dinsdag",
  "woensdag",
  "donderdag",
  "vrijdag",
  "zaterdag",
]
const MAANDEN = [
  "januari",
  "februari",
  "maart",
  "april",
  "mei",
  "juni",
  "juli",
  "augustus",
  "september",
  "oktober",
  "november",
  "december",
]

// "zondag 29 juni 2026" uit "yyyy-MM-dd".
export function formatDatumLang(datum: string): string {
  const d = new Date(`${datum}T12:00:00.000Z`)
  return `${WEEKDAGEN[d.getUTCDay()]} ${d.getUTCDate()} ${
    MAANDEN[d.getUTCMonth()]
  } ${d.getUTCFullYear()}`
}

// "29 jun" korte weergave.
export function formatDatumKort(datum: string): string {
  const d = new Date(`${datum}T12:00:00.000Z`)
  return `${d.getUTCDate()} ${MAANDEN[d.getUTCMonth()].slice(0, 3)}`
}

// Verschuif een datumstring met een aantal dagen.
export function verschuifDatum(datum: string, dagen: number): string {
  const d = new Date(`${datum}T12:00:00.000Z`)
  d.setUTCDate(d.getUTCDate() + dagen)
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(
    d.getUTCDate(),
  )}`
}

export function isVandaag(datum: string): boolean {
  return datum === vandaagDatum()
}

// Aantal hele minuten tussen twee "yyyy-MM-ddTHH:mm" inputwaarden.
export function duurInMinuten(start: string, einde: string): number {
  const van = inputNaarDatum(start).getTime()
  const tot = inputNaarDatum(einde).getTime()
  return Math.max(0, Math.round((tot - van) / 60000))
}

// "1u 25m" of "45m" uit een aantal minuten.
export function formatDuur(minuten: number): string {
  const uren = Math.floor(minuten / 60)
  const rest = minuten % 60
  if (uren === 0) return `${rest}m`
  if (rest === 0) return `${uren}u`
  return `${uren}u ${rest}m`
}

// "02:15" uit een aantal minuten (uu:mm met voorloopnullen), voor de
// "tijd sinds..."-tellers.
export function formatUuMm(minuten: number): string {
  const uren = Math.floor(minuten / 60)
  const rest = minuten % 60
  return `${String(uren).padStart(2, "0")}:${String(rest).padStart(2, "0")}`
}
