# jobbord.nl — plan

Gratis vacaturesite voor bedrijven die zelf personeel zoeken. Geen uitzendbureaus, detacheerders of wervingsbureaus.
Stijl: gebaseerd op de opbouw van Jooble (zoekbalk centraal, lijst links + vacature rechts), met een eigen huisstijl.

## Demo (deze map)
- `index.html` — homepage met zoekbalk, provincies, vakgebieden, blok voor werkgevers
- `vacatures.html` — zoeken + filters, vacature rechts, solliciteren in een minuut (knock-outvragen, cv optioneel, honeypot + tijdscheck)
- `werkgevers.html` — aanmeldflow: Google → KvK-check → bedrijfsmail → vacature plaatsen (alles nagebootst)
- `dashboard.html` — werkgeversdashboard: sollicitaties, vacatures, e-mailadressen voor meldingen
- Demo-data in `js/data.js` (verzonnen bedrijven)

## Echte versie
- Next.js op Vercel + Supabase (Postgres, Google-login, opslag cv's)
- KvK API: € 6,20/mnd + € 0,02 per Basisprofiel-opvraging (Zoeken gratis)
- Automatisch weigeren: SBI 78xx (uitzend/detachering/arbeidsbemiddeling) + naamcheck
- Bedrijfsmail-verificatie op het domein van de bedrijfswebsite; anders handmatige check
- Mail via Resend of Brevo (gratis tier)
- JobPosting-schema per vacature voor Google for Jobs
- Vacatures verlopen na 60 dagen; cv's automatisch verwijderd na 6 maanden (AVG)

## Open
- Alleen NL of ook België (KBO-check)?
- Fase 2: matchsysteem, nieuwsbrief, bedrijvendatabase
