# jobbord.nl

Gratis vacaturesite voor bedrijven die zelf personeel zoeken. Geen uitzendbureaus, detacheerders of wervingsbureaus: elk bedrijf wordt gecontroleerd in het KvK-register.

Dit is de **demo**: statische HTML, CSS en JavaScript, zonder backend. Inloggen, de KvK-check en e-mail worden nagebootst. Alle vacatures en bedrijven zijn verzonnen.

## Pagina's

| Bestand | Wat |
|---|---|
| `index.html` | Homepage: zoekbalk, nieuwste vacatures, provincies, vakgebieden |
| `vacatures.html` | Zoeken en filteren, vacature rechts, solliciteren (`?q=`, `?l=`, `?prov=`, `?sector=`, `?id=`) |
| `werkgevers.html` | Aanmelden als werkgever: Google → bedrijf zoeken (KvK) → bedrijfsmail → vacature plaatsen |
| `dashboard.html` | Werkgeversdashboard: sollicitaties, vacatures, e-mailmeldingen |

- `css/style.css`: alle stijlen
- `js/data.js`: demo-vacatures
- `js/app.js`: alle logica, per pagina via `<body data-page="...">`
- `docs/plan.md`: plan voor de echte versie

## Lokaal bekijken

Open `index.html` in je browser, of start een simpele server:

```bash
python3 -m http.server 8000
```

en ga naar http://localhost:8000.

## Deployen

Koppel de repo aan Vercel (geen build-stap nodig, output = de hoofdmap).

## Afspraken

- Elk formulier heeft een honeypot (`website`, onzichtbaar, `tabindex="-1"`) en een tijdscheck: versturen binnen 3 seconden telt als bot.
- Pas je CSS of JS aan? Verhoog dan `?v=` achter `style.css`, `data.js` en `app.js` in alle HTML-bestanden, anders zien bezoekers een oude versie.
