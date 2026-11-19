/* Sollicitatieformulier: stuurt naar /api/solliciteer (server van jobbord.nl). */
(function () {
  const f = document.getElementById('solliciteer');
  if (!f) return;
  const err = document.getElementById('a-err');
  const gestart = Date.now();
  const utm = new URLSearchParams(location.search);
  const herkomst = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'fbclid']
    .filter((k) => utm.get(k)).map((k) => `${k}=${utm.get(k)}`).join('&');

  f.telefoon.addEventListener('blur', () => {
    const d = f.telefoon.value.replace(/\D/g, '').replace(/^31/, '0');
    if (/^06\d{8}$/.test(d)) f.telefoon.value = '06 ' + d.slice(2);
  });

  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    err.hidden = true;
    const groepen = [...f.querySelectorAll('.choices')];
    const mist = [];
    let eerste = null;
    if (f.naam.value.trim().length < 2) { mist.push('je naam'); eerste = eerste || f.naam; }
    if (f.telefoon.value.replace(/\D/g, '').length < 9) { mist.push('een telefoonnummer'); eerste = eerste || f.telefoon; }
    if (f.woonplaats.value.trim().length < 2) { mist.push('je woonplaats'); eerste = eerste || f.woonplaats; }
    const open = groepen.find((g) => !g.querySelector('input:checked'));
    if (open) { mist.push('een antwoord op de vraag'); eerste = eerste || open.querySelector('input'); }
    if (mist.length) { err.textContent = 'Vul nog in: ' + mist.join(', ') + '.'; err.hidden = false; eerste.focus(); return; }

    const knop = f.querySelector('button[type=submit]');
    knop.disabled = true; knop.textContent = 'Bezig met versturen…';
    try {
      const r = await fetch('/api/solliciteer', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          vacature_code: f.dataset.vacature,
          naam: f.naam.value, telefoon: f.telefoon.value, email: f.email.value, woonplaats: f.woonplaats.value,
          antwoorden: groepen.map((g) => ({ vraag: g.dataset.vraag, antwoord: g.querySelector('input:checked').value })),
          website: f.website.value, duur_ms: Date.now() - gestart, herkomst,
        }),
      });
      if (!r.ok) throw new Error(String(r.status));
      f.innerHTML = '<div class="done" role="status"><h2>Verstuurd</h2><p>Bedankt! Het bedrijf bekijkt je sollicitatie. Wil het je spreken, dan word je gebeld op ' +
        f.telefoon.value.replace(/[<>&"]/g, '') + '.</p></div>';
    } catch (x) {
      knop.disabled = false; knop.textContent = 'Verstuur sollicitatie';
      err.textContent = 'Versturen lukte niet. Controleer je internetverbinding en probeer het nog een keer.';
      err.hidden = false;
    }
  });
})();
