import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import * as schema from "./schema"

const globalForDb = globalThis as unknown as {
  pool: Pool | undefined
}

export const pool =
  globalForDb.pool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    // Neon-compute kan "slapen" en moet dan even opstarten; geef verbindingen
    // ruimte om dat te overleven i.p.v. na de korte pg-standaardtijd te falen.
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 30_000,
  })

if (process.env.NODE_ENV !== "production") {
  globalForDb.pool = pool
}

export const db = drizzle(pool, { schema })
