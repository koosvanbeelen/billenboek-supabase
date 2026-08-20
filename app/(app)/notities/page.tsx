import { getNotities } from "@/app/actions/notities"
import { NotitiesWeergave } from "@/components/notities-weergave"

export const dynamic = "force-dynamic"

export default async function NotitiesPage() {
  const notities = await getNotities()

  return <NotitiesWeergave notities={notities} />
}
