# Accountbeheer voor Billenboek (Supabase-fork)

Branch: `account-beheer` (niet op `main` zetten voordat je het hebt getest).

## Wat zit erin

| Onderdeel | Waar |
|---|---|
| Uitloggen | Instellingen (onderaan) en Instellingen → Account |
| Wachtwoord vergeten | `/wachtwoord-vergeten` (link "Vergeten?" op het inlogscherm) → mail → `/wachtwoord-resetten` |
| Wachtwoord wijzigen (ingelogd) | Instellingen → Account |
| Account verwijderen | Instellingen → Account, bevestigen met wachtwoord |
| Profiel / naam | Naam bij registratie, aanpasbaar in Instellingen → Account. Ledenlijst toont namen i.p.v. `user_id` |
| Uitnodigen | Instellingen → Gezin: deelknop (iOS/Android deelmenu), WhatsApp, link kopiëren. De link `/gezin/deelnemen?code=…` stuurt nieuwe mensen naar registreren en daarna direct het gezin in |

## Volgorde van uitrollen (belangrijk)

### Stap 1: eerst de database
Open Supabase → SQL Editor → plak de inhoud van
`supabase/migrations/20261009120000_account_beheer.sql` → Run.

Het script is idempotent (je mag het opnieuw draaien). Het maakt:
- tabel `profielen` met RLS (gezinsleden zien elkaars naam, bewerken kan alleen je eigen naam)
- een trigger die bij registratie een profiel aanmaakt
- profielen voor bestaande gebruikers (naam = deel van het e-mailadres voor de @, later aan te passen)
- de functie `verwijder_mijn_account()`

### Stap 2: de code
**GitHub Desktop (aanbevolen):**
1. Maak een branch `account-beheer` vanaf `main`.
2. Pak `billenboek-account-beheer.zip` uit over je lokale map heen (mappen blijven behouden, ook `app/(app)/`).
   Of: `git apply account-beheer.patch`.
3. `pnpm install` is niet nodig (geen nieuwe pakketten).
4. Commit en push de branch. Vercel maakt een preview-deployment.

**Let op bij v0:** v0 verwijdert bij een zip-upload bestanden die niet in de zip zitten. Gebruik v0 daarom niet voor deze upload; werk via GitHub en laat v0 daarna de branch synchroniseren.

### Stap 3: Supabase-instellingen
1. Authentication → URL Configuration: controleer dat **Site URL** je productiedomein is en dat `https://<jouw-domein>/auth/callback` bij **Redirect URLs** staat (voor preview-deployments een wildcard zoals `https://*-<team>.vercel.app/**`).
2. **Aanbevolen voor de geïnstalleerde app:** Authentication → Email Templates → *Reset Password*. Vervang de link door:
   ```
   <a href="{{ .SiteURL }}/auth/bevestigen?token_hash={{ .TokenHash }}&type=recovery&next=/wachtwoord-resetten">Kies een nieuw wachtwoord</a>
   ```
   Waarom: de standaardlink werkt alleen als je hem opent in dezelfde browser als waar je de aanvraag deed. Een mail-app opent links in Safari/Chrome, niet in de geïnstalleerde PWA. Met de `token_hash`-link werkt het altijd. Zonder deze aanpassing blijft de standaardlink werken (met `?code=`), maar dan kan het mislukken vanuit de PWA; de app toont dan "link verlopen" en laat je een nieuwe aanvragen.
3. Mail-limieten: de ingebouwde Supabase-mailserver heeft een lage limiet en stuurt alleen naar teamleden. Voor wachtwoordherstel bij echte gebruikers is een eigen SMTP (bijv. Resend) nodig onder Project Settings → Authentication → SMTP.

## Gedrag bij account verwijderen
- Je moet je wachtwoord opnieuw invullen.
- **Er zijn nog andere gezinsleden:** je verlaat het gezin, de registraties blijven bewaard en worden toegewezen aan het langst aangesloten lid. Was je eigenaar, dan wordt dat lid eigenaar.
- **Je bent het enige lid:** het hele gezin met alle registraties en notities wordt definitief verwijderd.
- Alles gebeurt in één transactie. Lukt iets niet (bijv. een tabel die ik niet kan zien verwijst nog naar je account), dan wordt er niets verwijderd en zie je een foutmelding.
- De verwijdering draait via een `security definer`-functie. Er is **geen** service-role-sleutel in de app nodig.

## Testlijst (op de preview, met een testaccount)
1. Registreren met naam → mail → bevestigen → gezin aanmaken → naam staat in Instellingen.
2. Uitloggen → inloggen.
3. "Vergeten?" → mail → link → nieuw wachtwoord → je bent ingelogd. Open de link een tweede keer: je krijgt "link verlopen".
4. Instellingen → Account: naam wijzigen, wachtwoord wijzigen (fout huidig wachtwoord geeft een melding).
5. Uitnodigen via WhatsApp/deel/kopieer. Open de link in een privévenster → registreren → komt in het gezin terecht.
6. Met een tweede testaccount in hetzelfde gezin: account verwijderen. Gegevens blijven zichtbaar voor het eerste account.
7. Laatste testaccount verwijderen: het gezin is weg.

**Maak een back-up (Supabase → Database → Backups, of `pg_dump`) vóór je dit op productie met echte data uitprobeert.** Test het verwijderen alleen met testaccounts.

## Bewust niet veranderd (volgende stappen)
- Uitnodigingscodes zijn nog 8 tekens, 30 dagen geldig en meermalig bruikbaar (zoals na de laatste hardening-migratie). Aanscherping (eenmalig, langer, rate limit) is een eigen stap.
- Leden verwijderen of eigenaarschap overdragen vanuit de app kan nog niet.
- E-mailadres wijzigen kan nog niet.

## Technisch
- `tsc --noEmit` slaagt.
- De SQL is getest in een lokale Postgres met een nagebootst schema: herhaald draaien, profiel-trigger, vertrek van eigenaar met overdracht, laatste lid dat het gezin opruimt, en weigeren zonder sessie.
- Niet getest: de echte Supabase-omgeving, de e-mailtemplates en `next build` (Google Fonts is in mijn omgeving niet bereikbaar).
