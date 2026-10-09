import { z } from "zod"

export const naamSchema = z
  .string()
  .trim()
  .min(1, "Vul een naam in.")
  .max(40, "Gebruik maximaal 40 tekens.")

export const emailSchema = z.email("Vul een geldig e-mailadres in.")

// Supabase hasht met bcrypt; langer dan 72 tekens wordt afgekapt.
export const wachtwoordSchema = z
  .string()
  .min(8, "Gebruik minimaal 8 tekens.")
  .max(72, "Gebruik maximaal 72 tekens.")

export type ActieUitkomst = { ok: true } | { ok: false; fout: string }

export function eersteFout(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Controleer je invoer."
}
