import {
  boolean,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core"

// Voedingen (feedings)
export const voedingen = pgTable("voedingen", {
  id: serial("id").primaryKey(),
  datumTijd: timestamp("datum_tijd", { withTimezone: true }).notNull(),
  type: text("type").notNull(), // "borstvoeding" | "kolfmelk" | "kunstvoeding"
  borst: text("borst"), // "links" | "rechts" | "links-rechts" | "rechts-links" | "beide" (legacy)
  duurMinuten: integer("duur_minuten"),
  hoeveelheidMl: integer("hoeveelheid_ml"),
  notitie: text("notitie"),
  aangemaaktOp: timestamp("aangemaakt_op", { withTimezone: true })
    .notNull()
    .defaultNow(),
  bijgewerktOp: timestamp("bijgewerkt_op", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

// Luiers (diapers)
export const luiers = pgTable("luiers", {
  id: serial("id").primaryKey(),
  datumTijd: timestamp("datum_tijd", { withTimezone: true }).notNull(),
  plas: boolean("plas").notNull().default(false),
  poep: boolean("poep").notNull().default(false),
  schoon: boolean("schoon").notNull().default(false),
  aangemaaktOp: timestamp("aangemaakt_op", { withTimezone: true })
    .notNull()
    .defaultNow(),
  bijgewerktOp: timestamp("bijgewerkt_op", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

// Temperaturen (temperatures)
export const temperaturen = pgTable("temperaturen", {
  id: serial("id").primaryKey(),
  datumTijd: timestamp("datum_tijd", { withTimezone: true }).notNull(),
  temperatuur: numeric("temperatuur", { precision: 4, scale: 1 }).notNull(),
  aangemaaktOp: timestamp("aangemaakt_op", { withTimezone: true })
    .notNull()
    .defaultNow(),
  bijgewerktOp: timestamp("bijgewerkt_op", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

// Boertjes / Spugen (burps / spit-up)
export const boertjesSpugen = pgTable("spugen", {
  id: serial("id").primaryKey(),
  datumTijd: timestamp("datum_tijd", { withTimezone: true }).notNull(),
  notitie: text("notitie"),
  aangemaaktOp: timestamp("aangemaakt_op", { withTimezone: true })
    .notNull()
    .defaultNow(),
  bijgewerktOp: timestamp("bijgewerkt_op", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

// Vitamines (vitamins)
export const vitamines = pgTable("vitamines", {
  id: serial("id").primaryKey(),
  datumTijd: timestamp("datum_tijd", { withTimezone: true }).notNull(),
  vitamineK: boolean("vitamine_k").notNull().default(false),
  vitamineD: boolean("vitamine_d").notNull().default(false),
  aangemaaktOp: timestamp("aangemaakt_op", { withTimezone: true })
    .notNull()
    .defaultNow(),
  bijgewerktOp: timestamp("bijgewerkt_op", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

// Medicatie (medication)
export const medicatie = pgTable("medicatie", {
  id: serial("id").primaryKey(),
  datumTijd: timestamp("datum_tijd", { withTimezone: true }).notNull(),
  naam: text("naam").notNull(),
  dosering: text("dosering"),
  notitie: text("notitie"),
  aangemaaktOp: timestamp("aangemaakt_op", { withTimezone: true })
    .notNull()
    .defaultNow(),
  bijgewerktOp: timestamp("bijgewerkt_op", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

// Notities (free-form notes)
export const notities = pgTable("notities", {
  id: serial("id").primaryKey(),
  datumTijd: timestamp("datum_tijd", { withTimezone: true })
    .notNull()
    .defaultNow(),
  notitie: text("notitie").notNull(),
})

// Groei (growth: gewicht/lengte metingen)
export const groei = pgTable("groei", {
  id: serial("id").primaryKey(),
  datumTijd: timestamp("datum_tijd", { withTimezone: true }).notNull(),
  gewichtKg: numeric("gewicht_kg", { precision: 5, scale: 2 }),
  lengteCm: numeric("lengte_cm", { precision: 5, scale: 1 }),
  opmerking: text("opmerking"),
  aangemaaktOp: timestamp("aangemaakt_op", { withTimezone: true })
    .notNull()
    .defaultNow(),
  bijgewerktOp: timestamp("bijgewerkt_op", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

// Slapen (sleep sessies)
export const slapen = pgTable("slapen", {
  id: serial("id").primaryKey(),
  start: timestamp("start", { withTimezone: true }).notNull(),
  einde: timestamp("einde", { withTimezone: true }).notNull(),
  duurMinuten: integer("duur_minuten").notNull(),
  locatie: text("locatie"),
  notitie: text("notitie"),
  aangemaaktOp: timestamp("aangemaakt_op", { withTimezone: true })
    .notNull()
    .defaultNow(),
  bijgewerktOp: timestamp("bijgewerkt_op", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

// Huilen (crying sessies)
export const huilen = pgTable("huilen", {
  id: serial("id").primaryKey(),
  start: timestamp("start", { withTimezone: true }).notNull(),
  einde: timestamp("einde", { withTimezone: true }).notNull(),
  duurMinuten: integer("duur_minuten").notNull(),
  oorzaak: text("oorzaak"),
  troost: text("troost"),
  aangemaaktOp: timestamp("aangemaakt_op", { withTimezone: true })
    .notNull()
    .defaultNow(),
  bijgewerktOp: timestamp("bijgewerkt_op", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

// Kolven (afkolven van moedermelk)
export const kolven = pgTable("kolven", {
  id: serial("id").primaryKey(),
  datumTijd: timestamp("datum_tijd", { withTimezone: true }).notNull(),
  borst: text("borst").notNull(), // "links" | "rechts" | "beide"
  hoeveelheidMl: integer("hoeveelheid_ml").notNull(),
  notitie: text("notitie"),
  aangemaaktOp: timestamp("aangemaakt_op", { withTimezone: true })
    .notNull()
    .defaultNow(),
  bijgewerktOp: timestamp("bijgewerkt_op", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export type Voeding = typeof voedingen.$inferSelect
export type Luier = typeof luiers.$inferSelect
export type Temperatuur = typeof temperaturen.$inferSelect
export type BoertjeSpugen = typeof boertjesSpugen.$inferSelect
export type Vitamine = typeof vitamines.$inferSelect
export type Medicatie = typeof medicatie.$inferSelect
export type Notitie = typeof notities.$inferSelect
export type Groei = typeof groei.$inferSelect
export type Slapen = typeof slapen.$inferSelect
export type Huilen = typeof huilen.$inferSelect
export type Kolven = typeof kolven.$inferSelect
