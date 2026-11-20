/* Stuurt een bericht ondertekend (HMAC) naar het portaal van De Vacature Expert.
 * Instellingen in Vercel: PORTAL_URL en JOBBORD_SECRET (zelfde sleutel als op Railway). */
const crypto = require('crypto');

async function naarPortaal(pad, gegevens) {
  const portaal = String(process.env.PORTAL_URL || '').replace(/\/+$/, '');
  const secret = String(process.env.JOBBORD_SECRET || '');
  if (!portaal || !secret) { const e = new Error('PORTAL_URL of JOBBORD_SECRET ontbreekt'); e.config = true; throw e; }
  const bericht = JSON.stringify(gegevens);
  const ts = String(Date.now());
  const handtekening = 'sha256=' + crypto.createHmac('sha256', secret).update(`${ts}.`).update(bericht).digest('hex');
  const r = await fetch(`${portaal}${pad}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'X-Jobbord-Timestamp': ts, 'X-Jobbord-Signature': handtekening },
    body: bericht,
  });
  if (!r.ok) throw new Error(`portaal gaf ${r.status}`);
}

// Eenvoudige rem per IP-adres (per serverinstantie).
const recent = new Map();
function teVaak(req, max = 5) {
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'onbekend';
  const nu = Date.now();
  const lijst = (recent.get(ip) || []).filter((t) => nu - t < 10 * 60 * 1000);
  lijst.push(nu);
  recent.set(ip, lijst);
  return lijst.length > max;
}

const kort = (s, n) => String(s == null ? '' : s).trim().slice(0, n);

module.exports = { naarPortaal, teVaak, kort };
