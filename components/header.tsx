import Image from "next/image"

// Gewoon onderdeel van de normale pagina-inhoud (position: static) — schuift
// dus mee omhoog en verdwijnt uit beeld zodra er naar beneden gescrold
// wordt. Toont het gecentreerde Billenboek-beeldmerk.
//
// Het logo bestaat uit twee losse afbeeldingen zodat de tekst "illenBoek"
// in donkere modus wit kan worden, terwijl het gekleurde "BB"-icoon
// ongewijzigd blijft:
// - header-icoon.png       → het "BB"-icoon met babykopje en hartje
// - header-tekst.png       → "illenBoek" in donkergrijs (lichte modus)
// - header-tekst-donker.png→ dezelfde tekst, wit (donkere modus)
// Alle drie zijn transparant, dus ze nemen de kaartkleur van de header aan.
// Het wisselen tussen de twee tekstvarianten gebeurt puur met Tailwinds
// `dark:`-variant, zonder JavaScript.
export function Header() {
  return (
    <header className="border-b border-border bg-card pt-safe">
      <div className="flex items-center justify-center px-4 py-3 md:px-8 xl:px-12">
        <Image
          src="/header-icoon.png"
          alt=""
          width={410}
          height={435}
          priority
          className="h-[4.5rem] w-auto sm:h-[5.0625rem]"
        />
        <Image
          src="/header-tekst.png"
          alt="Billenboek"
          width={839}
          height={435}
          priority
          className="h-[4.5rem] w-auto dark:hidden sm:h-[5.0625rem]"
        />
        <Image
          src="/header-tekst-donker.png"
          alt="Billenboek"
          width={839}
          height={435}
          priority
          className="hidden h-[4.5rem] w-auto dark:block sm:h-[5.0625rem]"
        />
      </div>
    </header>
  )
}
