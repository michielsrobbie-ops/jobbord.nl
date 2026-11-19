/* Server van jobbord.nl: neemt een sollicitatie aan en stuurt die ondertekend
 * door naar het portaal van De Vacature Expert. Hier wordt niets bewaard.
 *
 * Instellingen (Vercel > Settings > Environment Variables):
 *   PORTAL_URL      bijvoorbeeld https://portaal.devacatureexpert.nl
 *   JOBBORD_SECRET  dezelfde lange sleutel als op Railway
 */
const crypto = require('crypto');

// Alleen deze vacaturecodes worden geaccepteerd.
const VACATURES = new Set(['automonteur-harderwijk']);

const kort = (s, n) => String(s == null ? '' : s).trim().slice(0, n);

// Eenvoudige rem per IP-adres (per serverinstantie).
const recent = new Map();
function teVaak(ip) {
  const nu = Date.now();
  const lijst = (recent.get(ip) || []).filter((t) => nu - t < 10 * 60 * 1000);
  lijst.push(nu);
  recent.set(ip, lijst);
  return lijst.length > 5;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'method' }); }
  const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});

  // Bots: honeypot ingevuld of binnen 3 seconden verstuurd. Doe alsof het gelukt is.
  if (b.website || Number(b.duur_ms) < 3000) return res.status(200).json({ ok: true });

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'onbekend';
  if (teVaak(ip)) return res.status(429).json({ error: 'te_vaak' });

  const code = kort(b.vacature_code, 80);
  const naam = kort(b.naam, 120);
  const telefoon = kort(b.telefoon, 40);
  if (!VACATURES.has(code) || naam.length < 2 || telefoon.replace(/\D/g, '').length < 9) {
    return res.status(400).json({ error: 'ongeldig' });
  }

  const portaal = String(process.env.PORTAL_URL || '').replace(/\/+$/, '');
  const secret = String(process.env.JOBBORD_SECRET || '');
  if (!portaal || !secret) { console.error('[solliciteer] PORTAL_URL of JOBBORD_SECRET ontbreekt'); return res.status(500).json({ error: 'config' }); }

  const bericht = JSON.stringify({
    id: crypto.randomUUID(),
    vacature_code: code,
    naam, telefoon,
    email: kort(b.email, 160),
    woonplaats: kort(b.woonplaats, 80),
    antwoorden: (Array.isArray(b.antwoorden) ? b.antwoorden : []).slice(0, 10).map((a) => ({ vraag: kort(a && a.vraag, 200), antwoord: kort(a && a.antwoord, 200) })),
    utm: kort(b.herkomst, 300),
  });
  const ts = String(Date.now());
  const handtekening = 'sha256=' + crypto.createHmac('sha256', secret).update(`${ts}.`).update(bericht).digest('hex');

  try {
    const r = await fetch(`${portaal}/webhooks/jobbord`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'X-Jobbord-Timestamp': ts, 'X-Jobbord-Signature': handtekening },
      body: bericht,
    });
    if (!r.ok) throw new Error(`portaal gaf ${r.status}`);
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('[solliciteer] doorsturen mislukt:', e.message);
    return res.status(502).json({ error: 'doorsturen' });
  }
};
