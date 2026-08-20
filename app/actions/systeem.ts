"use server"

import { sql } from "drizzle-orm"
import { db } from "@/lib/db"

export async function controleerDatabase(): Promise<{
  ok: boolean
  bericht: string
}> {
  try {
    await db.execute(sql`select 1`)
    return { ok: true, bericht: "Verbinding met de database is in orde." }
  } catch (e) {
    return {
      ok: false,
      bericht: "Geen verbinding met de database. Probeer het later opnieuw.",
    }
  }
}
