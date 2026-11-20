/* Aanvraagformulier voor bedrijven: stuurt naar /api/aanvraag. */
(function () {
  const f = document.getElementById('aanvraag');
  if (!f) return;
  const err = document.getElementById('b-err');
  const gestart = Date.now();
  const utm = new URLSearchParams(location.search);
  const herkomst = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'gclid', 'fbclid']
    .filter((k) => utm.get(k)).map((k) => `${k}=${utm.get(k)}`).join('&');

  f.telefoon.addEventListener('blur', () => {
    const d = f.telefoon.value.replace(/\D/g, '').replace(/^31/, '0');
    if (/^06\d{8}$/.test(d)) f.telefoon.value = '06 ' + d.slice(2);
  });

  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    err.hidden = true;
    const mist = [];
    let eerste = null;
    const check = (veld, ok, tekst) => { if (!ok) { mist.push(tekst); eerste = eerste || veld; } };
    check(f.bedrijf, f.bedrijf.value.trim().length >= 2, 'de bedrijfsnaam');
    check(f.naam, f.naam.value.trim().length >= 2, 'je naam');
    check(f.email, /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email.value.trim()), 'een geldig e-mailadres');
    check(f.telefoon, f.telefoon.value.replace(/\D/g, '').length >= 9, 'een telefoonnummer');
    if (mist.length) { err.textContent = 'Vul nog in: ' + mist.join(', ') + '.'; err.hidden = false; eerste.focus(); return; }

    const knop = f.querySelector('button[type=submit]');
    knop.disabled = true; knop.textContent = 'Bezig met versturen…';
    try {
      const r = await fetch('/api/aanvraag', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          bedrijf: f.bedrijf.value, naam: f.naam.value, email: f.email.value, telefoon: f.telefoon.value,
          kvk: f.kvk.value, functies: f.functies.value,
          website: f.website.value, duur_ms: Date.now() - gestart, herkomst,
        }),
      });
      if (!r.ok) throw new Error(String(r.status));
      f.innerHTML = '<div class="done" role="status"><h2>Bedankt voor je aanvraag</h2><p>We nemen zo snel mogelijk contact met je op.</p></div>';
    } catch (x) {
      knop.disabled = false; knop.textContent = 'Verstuur aanvraag';
      err.textContent = 'Versturen lukte niet. Controleer je internetverbinding en probeer het nog een keer.';
      err.hidden = false;
    }
  });
})();
