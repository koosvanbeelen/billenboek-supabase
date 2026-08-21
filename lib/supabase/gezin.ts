import { createClient } from "@/lib/supabase/server"

export async function getActiefGezinId() {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) throw new Error("Je moet ingelogd zijn.")

  const { data, error } = await supabase
    .from("gezin_leden")
    .select("gezin_id")
    .eq("user_id", user.id)
    .order("aangemaakt_op", { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) throw new Error("Gezin kon niet worden geladen.")
  if (!data?.gezin_id) throw new Error("Je bent nog niet aan een gezin gekoppeld.")
  return data.gezin_id as string
}

export async function getActiefGezinClient() {
  const supabase = await createClient()
  const gezinId = await getActiefGezinId()
  return { supabase, gezinId }
}
