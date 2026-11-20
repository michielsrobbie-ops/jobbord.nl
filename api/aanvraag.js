/* Aanvraag van een bedrijf (testfase: bedrijven alleen op aanvraag).
 * Gaat ondertekend naar het portaal, dat hem mailt naar de administratie. */
const { naarPortaal, teVaak, kort } = require('./_portaal');

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'method' }); }
  const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});

  // Bots: honeypot ingevuld of binnen 3 seconden verstuurd. Doe alsof het gelukt is.
  if (b.website || Number(b.duur_ms) < 3000) return res.status(200).json({ ok: true });
  if (teVaak(req, 3)) return res.status(429).json({ error: 'te_vaak' });

  const v = {
    bedrijf: kort(b.bedrijf, 120), naam: kort(b.naam, 120), email: kort(b.email, 160), telefoon: kort(b.telefoon, 40),
    kvk: kort(b.kvk, 20), functies: kort(b.functies, 1500), herkomst: kort(b.herkomst, 300),
  };
  if (v.bedrijf.length < 2 || v.naam.length < 2 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.email) || v.telefoon.replace(/\D/g, '').length < 9) {
    return res.status(400).json({ error: 'ongeldig' });
  }
  try {
    await naarPortaal('/webhooks/jobbord/aanvraag', v);
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('[aanvraag]', e.message);
    return res.status(e.config ? 500 : 502).json({ error: 'doorsturen' });
  }
};
