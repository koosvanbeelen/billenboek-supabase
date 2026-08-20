import { getDagGegevens } from "@/app/actions/registraties"
import { GeschiedenisWeergave } from "@/components/geschiedenis-weergave"
import { vandaagDatum } from "@/lib/datum"

export const dynamic = "force-dynamic"

export default async function GeschiedenisPage({
  searchParams,
}: {
  searchParams: Promise<{ datum?: string; detail?: string }>
}) {
  const { datum, detail } = await searchParams
  const geldig = datum && /^\d{4}-\d{2}-\d{2}$/.test(datum)
  const dag = geldig ? datum : vandaagDatum()
  const data = await getDagGegevens(dag)

  // detail=true: toon detailweergave voor deze dag (als Vandaag)
  // detail=false/undefined: toon lijstweergave met dagsamenvattingen
  const toonDetail = detail === "true"

  return <GeschiedenisWeergave data={data} dag={dag} toonDetail={toonDetail} />
}
