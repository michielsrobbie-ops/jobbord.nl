#!/usr/bin/env python3
"""Bouwt de vacaturepagina's van jobbord.nl uit data/vacatures.json.

Gebruik:  python3 build/build.py

Maakt of vernieuwt:
  vacature/<code>.html   een pagina per vacature, met Google for Jobs-gegevens (JobPosting)
  index.html             de vacaturekaarten tussen <!-- vacatures:start --> en <!-- vacatures:end -->
  sitemap.xml            alle pagina's voor Google
  robots.txt             verwijst naar de sitemap
  api/_vacatures.json    de codes die /api/solliciteer accepteert

Vacature erbij: voeg een blok toe aan data/vacatures.json, draai dit script, push.
Vacature stoppen: haal het blok weg (of zet "geldig_tot" in het verleden), draai dit script, push.
De pagina verdwijnt dan, net als de kaart en de regel in de sitemap.

Klantnamen staan hier NOOIT in. Welke klant bij een code hoort, staat alleen in
JOBBORD_VACATURES op Railway (portaal).
"""
import datetime
import html
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = "https://jobbord.nl"
CSS_V = "20261120f"
VANDAAG = datetime.date.today()

# Vaste vakgebieden voor het filter op de homepage (code -> naam). Elke vacature
# in data/vacatures.json heeft "vakgebied" met een van deze codes.
VAKGEBIEDEN = {
    "techniek": "Techniek en installatie",
    "bouw": "Bouw en infra",
    "auto": "Auto, transport en vervoer",
    "productie": "Productie en metaal",
    "logistiek": "Logistiek en magazijn",
    "engineering": "Kantoor en engineering",
    "groen": "Groen en tuinbouw",
    "horeca": "Horeca en winkel",
    "zorg": "Zorg",
}

e = html.escape


def lees():
    data = json.loads((ROOT / "data/vacatures.json").read_text())
    codes = set()
    actief = []
    for v in data:
        if not re.fullmatch(r"[a-z0-9-]{3,80}", v["code"]):
            sys.exit(f"Ongeldige code: {v['code']!r} (alleen kleine letters, cijfers en streepjes)")
        if v["code"] in codes:
            sys.exit(f"Dubbele code: {v['code']}")
        codes.add(v["code"])
        if v.get("vakgebied") not in VAKGEBIEDEN:
            sys.exit(f"{v['code']}: vakgebied {v.get('vakgebied')!r} onbekend, kies uit {', '.join(VAKGEBIEDEN)}")
        if datetime.date.fromisoformat(v["geldig_tot"]) < VANDAAG:
            print(f"  verlopen, niet gepubliceerd: {v['code']} (geldig_tot {v['geldig_tot']})")
            continue
        actief.append(v)
    actief.sort(key=lambda v: v["geplaatst"], reverse=True)
    return actief


def omschrijving_html(v):
    """De vacaturetekst als HTML, voor de pagina en voor Google for Jobs."""
    delen = ["<h2>De functie</h2>"] + [f"<p>{e(p)}</p>" for p in v["functie"]]
    if v["taken"]:
        delen.append("<h2>Wat ga je doen</h2><ul class=\"txt\">" + "".join(f"<li>{e(t)}</li>" for t in v["taken"]) + "</ul>")
    delen.append("<h2>Wat vragen we</h2><ul class=\"txt\">" + "".join(f"<li>{e(t)}</li>" for t in v["eisen"]) + "</ul>")
    blok = f"<h2>{e(v['aanbod_titel'])}</h2>"
    if v["aanbod"]:
        blok += "<ul class=\"txt\">" + "".join(f"<li>{e(t)}</li>" for t in v["aanbod"]) + "</ul>"
    if v["aanbod_tekst"]:
        blok += f"<p>{e(v['aanbod_tekst'])}</p>"
    delen.append(blok)
    return delen


def jobposting(v):
    """Gestructureerde gegevens voor Google for Jobs.
    https://developers.google.com/search/docs/appearance/structured-data/job-posting"""
    # "geen_plaats": de baan heeft geen vaste standplaats (bv. varen, of alleen een regio bekend).
    adres = {"@type": "PostalAddress", "addressCountry": "NL"}
    if not v.get("geen_plaats"):
        adres["addressLocality"] = v["plaats"]
    if v.get("regio"):
        adres["addressRegion"] = v["regio"]
    if v.get("postcode"):
        adres["postalCode"] = v["postcode"]
    d = {
        "@context": "https://schema.org/",
        "@type": "JobPosting",
        "title": v["titel"],
        "description": "".join(omschrijving_html(v)),
        "identifier": {"@type": "PropertyValue", "name": "jobbord.nl", "value": v["code"]},
        "datePosted": v["geplaatst"],
        "validThrough": v["geldig_tot"] + "T23:59:59+01:00",
        "employmentType": v["soort"] if len(v["soort"]) > 1 else v["soort"][0],
        # De naam van het bedrijf blijft bewust verborgen (zie de pagina); we
        # gebruiken dezelfde omschrijving die bezoekers op de pagina zien.
        "hiringOrganization": {"@type": "Organization", "name": v["werkgever"]},
        "jobLocation": {"@type": "Place", "address": adres},
        "directApply": True,
        "url": f"{SITE}/vacature/{v['code']}",
    }
    s = v.get("salaris")
    if s:
        waarde = {"@type": "QuantitativeValue", "unitText": s["per"]}
        if s.get("min") and s.get("max"):
            waarde.update(minValue=s["min"], maxValue=s["max"])
        else:
            waarde["value" if not s.get("max") else "maxValue"] = s.get("max") or s.get("min")
        d["baseSalary"] = {"@type": "MonetaryAmount", "currency": "EUR", "value": waarde}
    return json.dumps(d, ensure_ascii=False, indent=1).replace("</", "<\\/")


def kop(v, url):
    titel = f"{v['seo_titel']} | jobbord.nl"
    og_titel = f"{v['titel']} in {v['plaats']}"
    return f"""<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="/img/favicon-32.png">
<link rel="apple-touch-icon" href="/img/apple-touch-icon.png">
<meta name="theme-color" content="#0A2452">
<title>{e(titel)}</title>
<meta name="description" content="{e(v['seo_omschrijving'])}">
<link rel="canonical" href="{url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="jobbord.nl">
<meta property="og:url" content="{url}">
<meta property="og:title" content="{e(og_titel)}">
<meta property="og:description" content="{e(v['deel_omschrijving'])}">
<meta property="og:image" content="{SITE}/img/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">
{jobposting(v)}
</script>
<script type="application/ld+json">
{json.dumps({"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
    {"@type": "ListItem", "position": 1, "name": "Vacatures", "item": SITE + "/"},
    {"@type": "ListItem", "position": 2, "name": og_titel, "item": url}]}, ensure_ascii=False)}
</script>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/style.css?v={CSS_V}">
</head>
<body>
<header class="top"><div class="wrap">
  <a class="logo" href="/"><img src="/img/logo.png" alt="jobbord.nl" width="214" height="40"></a>
</div></header>
"""


VOET = f"""<footer><div class="wrap">
  <span class="foot-brand"><img src="/img/logo.png" alt="jobbord.nl" width="150" height="28">© 2026</span>
  <nav aria-label="Footer"><a href="/">Vacatures</a><a href="/over-ons">Over ons</a><a href="/werkgevers">Voor bedrijven</a><a href="/privacy">Privacy</a></nav>
  <span>Website door <a href="https://maxxmarketing.eu">MaxxMarketing</a></span>
</div></footer>
<script src="/js/solliciteer.js?v={CSS_V}"></script>
</body>
</html>
"""


def pagina(v):
    url = f"{SITE}/vacature/{v['code']}"
    meta = "".join(f"<li>{e(m)}</li>" for m in v["meta"])
    tekst = "\n    ".join(omschrijving_html(v))
    keuzes = "\n".join(
        f'          <label><input type="radio" name="v1" value="{e(o)}"> {e(o)}</label>' for o in v["opties"])
    return kop(v, url) + f"""
<main class="wrap vac">
  <article class="vac-text">
    <p class="back"><a href="/">Alle vacatures</a></p>
    <h1>{e(v['titel'])} in {e(v['plaats'])}</h1>
    <ul class="meta">{meta}</ul>
    <a class="btn mobile-only" href="#solliciteer">Solliciteer in een minuut</a>

    {tekst}

    <h2>Hoe gaat het verder?</h2>
    <p>Het bedrijf bekijkt je sollicitatie zelf. Wil het je spreken, dan word je gebeld en hoor je ook bij welk bedrijf je solliciteert. Elk bedrijf op jobbord.nl is door ons gecontroleerd. Het is geen uitzendbureau.</p>
    <p class="posted">Geplaatst op {datetime.date.fromisoformat(v['geplaatst']).strftime('%d-%m-%Y')}</p>
  </article>

  <aside class="vac-form">
    <form class="apply" id="solliciteer" data-vacature="{v['code']}" novalidate>
      <h2>Solliciteer in een minuut</h2>
      <p class="hint">Met je cv, je naam en je telefoonnummer.</p>
      <div class="hp" aria-hidden="true"><label>Website<input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
      <div class="field"><label for="a-naam">Naam</label><input type="text" id="a-naam" name="naam" autocomplete="name"></div>
      <div class="field"><label for="a-tel">Telefoonnummer</label><input type="tel" id="a-tel" name="telefoon" autocomplete="tel" inputmode="tel" placeholder="06 12345678"></div>
      <div class="field"><label for="a-mail">E-mailadres <span class="opt">(hoeft niet)</span></label><input type="email" id="a-mail" name="email" autocomplete="email"></div>
      <div class="field"><label for="a-plaats">Woonplaats</label><input type="text" id="a-plaats" name="woonplaats" autocomplete="address-level2"></div>
      <div class="field"><label for="a-cv">Je cv</label><input type="file" id="a-cv" name="cv" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,application/pdf,image/*"><small>Pdf, Word of een foto van je cv. Maximaal 3 MB.</small></div>
      <fieldset class="field">
        <legend class="lbl">{e(v['vraag'])}</legend>
        <div class="choices" data-vraag="{e(v['vraag'])}">
{keuzes}
        </div>
      </fieldset>
      <label class="consent"><input type="checkbox" name="andere"> <span><strong>Ook gebeld worden over andere vacatures?</strong> Past deze baan niet, dan hoor je het als er iets anders bij je past. Je hoeft dan niet opnieuw te solliciteren. We bewaren je gegevens daarvoor 2 jaar.</span></label>
      <p class="err" id="a-err" role="alert" hidden></p>
      <button class="btn" type="submit">Verstuur sollicitatie</button>
      <p class="fine">Je gegevens gaan naar het bedrijf achter deze vacature. Lees de <a href="/privacy">privacyverklaring</a>.</p>
    </form>
  </aside>
</main>

""" + VOET


PIN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/></svg>'
KLOK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>'


def slug(t):
    return re.sub(r"[^a-z0-9]+", "-", t.lower()).strip("-")


def kaart(v):
    zoek = " ".join([v["titel"], v["plaats"], v.get("regio", ""), v["sector"], v["werkgever"], VAKGEBIEDEN[v["vakgebied"]], " ".join(v["meta"])]).lower()
    regio = slug(v["regio"]) if v.get("regio") else "*"
    return f"""    <a class="job" href="/vacature/{v['code']}" data-provincie="{regio}" data-vakgebied="{v['vakgebied']}" data-zoek="{e(zoek)}">
      <span class="av" style="background:{v['kleur']}" aria-hidden="true"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">{v['icoon']}</svg></span>
      <span class="job-body">
        <h3>{e(v['titel'])}</h3>
        <p class="co">{e(v['sector'])}</p>
        <p class="place"><span>{PIN}{e(v['plaats'])}</span><span>{KLOK}{e(v['dienstverband'])}, {e(v['uren_kort'].lower())}</span></p>
        <span class="btn small">Bekijk en solliciteer</span>
      </span>
    </a>
"""


def filters(vacatures):
    """Zoekveld en keuzelijsten boven de vacatures, met aantallen."""
    provincies = {}
    for v in vacatures:
        if v.get("regio"):
            provincies[v["regio"]] = provincies.get(v["regio"], 0) + 1
    landelijk = sum(1 for v in vacatures if not v.get("regio"))
    vak = {}
    for v in vacatures:
        vak[v["vakgebied"]] = vak.get(v["vakgebied"], 0) + 1
    opt_p = "".join(f'<option value="{slug(p)}">{e(p)} ({n + landelijk})</option>' for p, n in sorted(provincies.items()))
    opt_v = "".join(f'<option value="{k}">{e(naam)} ({vak[k]})</option>' for k, naam in VAKGEBIEDEN.items() if k in vak)
    return f"""  <form class="filters" id="filters" role="search" action="/" method="get">
    <label class="f-zoek"><span class="sr">Zoek op functie of trefwoord</span><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input type="search" name="q" placeholder="Functie of trefwoord, bijvoorbeeld monteur" autocomplete="off"></label>
    <label><span class="sr">Provincie</span><select name="provincie"><option value="">Alle provincies</option>{opt_p}</select></label>
    <label><span class="sr">Vakgebied</span><select name="vakgebied"><option value="">Alle vakgebieden</option>{opt_v}</select></label>
  </form>
  <p class="f-aantal" id="f-aantal" aria-live="polite">{len(vacatures)} vacatures</p>
  <div class="f-leeg" id="f-leeg" hidden><p>Geen vacatures gevonden met deze filters.</p><button type="button" class="btn ghost small" id="f-wis">Wis filters</button></div>"""


def main():
    vacatures = lees()
    map_ = ROOT / "vacature"
    map_.mkdir(exist_ok=True)
    gewenst = {f"{v['code']}.html" for v in vacatures}
    for oud in map_.glob("*.html"):
        if oud.name not in gewenst:
            oud.unlink()
            print(f"  weggehaald: vacature/{oud.name}")
    for v in vacatures:
        (map_ / f"{v['code']}.html").write_text(pagina(v))

    idx = ROOT / "index.html"
    s = idx.read_text()
    s, n = re.subn(r"(<!-- vacatures:start -->\n).*?(\s*<!-- vacatures:end -->)",
                   lambda m: m.group(1) + "".join(kaart(v) for v in vacatures).rstrip("\n") + m.group(2), s, flags=re.S)
    if n != 1:
        sys.exit("index.html: markeringen <!-- vacatures:start --> / <!-- vacatures:end --> niet gevonden")
    s, n = re.subn(r"(<!-- filters:start -->\n).*?(\s*<!-- filters:end -->)",
                   lambda m: m.group(1) + filters(vacatures) + m.group(2), s, flags=re.S)
    if n != 1:
        sys.exit("index.html: markeringen <!-- filters:start --> / <!-- filters:end --> niet gevonden")
    idx.write_text(s)

    urls = [(SITE + "/", VANDAAG.isoformat()), (SITE + "/werkgevers", VANDAAG.isoformat()), (SITE + "/over-ons", VANDAAG.isoformat())] + [(f"{SITE}/vacature/{v['code']}", v["geplaatst"]) for v in vacatures]
    (ROOT / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "".join(f"  <url><loc>{u}</loc><lastmod>{d}</lastmod></url>\n" for u, d in urls)
        + "</urlset>\n")
    (ROOT / "robots.txt").write_text(f"User-agent: *\nDisallow: /demo/\nDisallow: /api/\n\nSitemap: {SITE}/sitemap.xml\n")
    (ROOT / "api/_vacatures.json").write_text(json.dumps(sorted(v["code"] for v in vacatures), indent=1) + "\n")
    print(f"Klaar: {len(vacatures)} vacatures.")


if __name__ == "__main__":
    main()
