import { InstellingenWeergave } from "@/components/instellingen-weergave"
import { laadGezinsgegevens } from "@/app/actions/gezinnen"
import packageJson from "@/package.json"

export default async function InstellingenPage() {
  const gezinsgegevens = await laadGezinsgegevens()
  return <InstellingenWeergave versie={packageJson.version} gezinsgegevens={gezinsgegevens} />
}
