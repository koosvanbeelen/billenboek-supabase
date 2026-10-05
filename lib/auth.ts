import { createClient } from "@/lib/supabase/server"

export async function isIngelogd(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return Boolean(user)
}

// Alleen interne paden toestaan als doorstuur-doel (voorkomt open redirects).
export function veiligeNext(value: string | null | undefined): string {
  const v = value ?? ""
  return v.startsWith("/") && !v.startsWith("//") ? v : "/"
}
