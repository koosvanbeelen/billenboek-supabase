import { InstellingenWeergave } from "@/components/instellingen-weergave"
import packageJson from "@/package.json"

export default function InstellingenPage() {
  return <InstellingenWeergave versie={packageJson.version} />
}
