import { redirect } from "next/navigation"
import { AccountWeergave } from "@/components/account-weergave"
import { laadAccount } from "@/app/actions/account"
import { laadGezinsgegevens } from "@/app/actions/gezinnen"

export default async function AccountPage() {
  const [account, gezin] = await Promise.all([laadAccount(), laadGezinsgegevens()])
  if (!account) redirect("/login")
  return <AccountWeergave account={account} aantalLeden={gezin.leden.length} ikBenEigenaar={gezin.ikBenEigenaar} />
}
