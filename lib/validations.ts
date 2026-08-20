import { z } from "zod"

// datetime-local waarde: "yyyy-MM-ddTHH:mm"
const datumTijd = z
  .string()
  .min(1, "Datum en tijd zijn verplicht")
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Ongeldige datum of tijd")

export const voedingSchema = z
  .object({
    datumTijd,
    type: z.enum(["borstvoeding", "kolfmelk", "kunstvoeding"]),
    // "beide" blijft geldig zodat bestaande registraties van vóór het
    // bijhouden van de volgorde nog steeds bewerkt kunnen worden.
    borst: z
      .enum(["links", "rechts", "links-rechts", "rechts-links", "beide"])
      .optional(),
    duurMinuten: z.coerce.number().int().min(0).max(360).optional(),
    hoeveelheidMl: z.coerce.number().int().min(0).max(2000).optional(),
    notitie: z.string().max(500).optional(),
  })
  .refine(
    (d) => d.type !== "borstvoeding" || !!d.borst,
    { message: "Kies welke borst", path: ["borst"] },
  )

export const luierSchema = z
  .object({
    datumTijd,
    plas: z.boolean().default(false),
    poep: z.boolean().default(false),
    schoon: z.boolean().default(false),
  })
  .refine((d) => d.plas || d.poep || d.schoon, {
    message: "Kies minstens één optie",
    path: ["plas"],
  })

export const temperatuurSchema = z.object({
  datumTijd,
  temperatuur: z.coerce
    .number({ message: "Vul een temperatuur in" })
    .min(30, "Te laag")
    .max(45, "Te hoog"),
})

export const boertjeSchema = z.object({
  datumTijd,
  notitie: z.string().max(500).optional(),
})

export const vitamineSchema = z
  .object({
    datumTijd,
    vitamineK: z.boolean().default(false),
    vitamineD: z.boolean().default(false),
  })
  .refine((d) => d.vitamineK || d.vitamineD, {
    message: "Kies minstens één vitamine",
    path: ["vitamineK"],
  })

export const medicatieSchema = z.object({
  datumTijd,
  naam: z.string().min(1, "Naam is verplicht").max(120),
  dosering: z.string().max(120).optional(),
  notitie: z.string().max(500).optional(),
})

export const groeiSchema = z
  .object({
    datumTijd,
    gewichtKg: z.coerce.number().min(0).max(50).optional(),
    lengteCm: z.coerce.number().min(0).max(150).optional(),
    opmerking: z.string().max(500).optional(),
  })
  .refine((d) => d.gewichtKg !== undefined || d.lengteCm !== undefined, {
    message: "Vul gewicht of lengte in",
    path: ["gewichtKg"],
  })

export const slaapSchema = z
  .object({
    start: datumTijd,
    einde: datumTijd,
    locatie: z.string().max(120).optional(),
    notitie: z.string().max(500).optional(),
  })
  .refine((d) => new Date(`${d.einde}:00.000Z`) > new Date(`${d.start}:00.000Z`), {
    message: "Einde moet na start liggen",
    path: ["einde"],
  })

export const huilSchema = z
  .object({
    start: datumTijd,
    einde: datumTijd,
    oorzaak: z.string().max(120).optional(),
    troost: z.string().max(120).optional(),
  })
  .refine((d) => new Date(`${d.einde}:00.000Z`) > new Date(`${d.start}:00.000Z`), {
    message: "Einde moet na start liggen",
    path: ["einde"],
  })

export const kolfSchema = z.object({
  datumTijd,
  borst: z.enum(["links", "rechts", "beide"]),
  hoeveelheidMl: z.coerce
    .number({ message: "Vul de hoeveelheid in" })
    .int()
    .min(0)
    .max(2000),
  notitie: z.string().max(500).optional(),
})

export const notitieSchema = z.object({
  // Max is verhoogd t.o.v. voorheen omdat opmaaktekens (**, *, -, [ ], 1.)
  // meetellen in de lengte van de opgeslagen tekst.
  notitie: z.string().min(1, "Schrijf eerst iets").max(4000),
})

export type VoedingInput = z.infer<typeof voedingSchema>
export type LuierInput = z.infer<typeof luierSchema>
export type TemperatuurInput = z.infer<typeof temperatuurSchema>
export type BoertjeInput = z.infer<typeof boertjeSchema>
export type VitamineInput = z.infer<typeof vitamineSchema>
export type MedicatieInput = z.infer<typeof medicatieSchema>
export type NotitieInput = z.infer<typeof notitieSchema>
export type GroeiInput = z.infer<typeof groeiSchema>
export type SlaapInput = z.infer<typeof slaapSchema>
export type HuilInput = z.infer<typeof huilSchema>
export type KolfInput = z.infer<typeof kolfSchema>
