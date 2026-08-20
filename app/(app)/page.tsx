import { getDagGegevens } from "@/app/actions/registraties"
import { getNotities } from "@/app/actions/notities"
import { VandaagWeergave } from "@/components/vandaag-weergave"
import { NotitiesWeergave } from "@/components/notities-weergave"
import { vandaagDatum } from "@/lib/datum"

export const dynamic = "force-dynamic"

export default async function VandaagPage({
  searchParams,
}: {
  searchParams: Promise<{ datum?: string }>
}) {
  const { datum } = await searchParams
  const geldig = datum && /^\d{4}-\d{2}-\d{2}$/.test(datum)
  const dag = geldig ? datum : vandaagDatum()
  const [data, notities] = await Promise.all([
    getDagGegevens(dag),
    getNotities(),
  ])

  return (
    <div className="split-view:grid split-view:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] split-view:items-start split-view:gap-6 xl:gap-10">
      {/*
        Beide kolommen krijgen in de gesplitste weergave (desktop lg+, of
        tablet in landscape) hun eigen vaste hoogte en overflow-y-auto, zodat
        ze als losse "frames" onafhankelijk van elkaar scrollen — scrollen in
        Vandaag beweegt Notities niet mee, en andersom. Op telefoon/tablet in
        portrait blijft dit gewoon één doorlopende pagina.
      */}
      <div className="split-view:sticky split-view:top-10 split-view:h-[calc(100dvh-2.5rem)] split-view:overflow-y-auto split-view:overscroll-contain">
        <VandaagWeergave data={data} />
      </div>
      {/* Notities-paneel: alleen zichtbaar in de gesplitste weergave, naast
          Vandaag. Op telefoon/tablet in portrait blijft Notities een eigen tab. */}
      <aside className="hidden split-view:sticky split-view:top-10 split-view:block split-view:h-[calc(100dvh-2.5rem)] split-view:overflow-y-auto split-view:overscroll-contain">
        <NotitiesWeergave notities={notities} />
      </aside>
    </div>
  )
}

