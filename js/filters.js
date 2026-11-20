/* Filters op de homepage: zoeken op functie/trefwoord, provincie en vakgebied.
 * Alles gebeurt in de browser op de kaarten die al op de pagina staan.
 * De keuze komt in de link (?q=&provincie=&vakgebied=), zodat je een gefilterde
 * lijst kan delen of in een advertentie kan gebruiken. */
(function () {
  const form = document.getElementById('filters');
  const lijst = document.getElementById('lijst');
  if (!form || !lijst) return;
  const kaarten = [...lijst.querySelectorAll('.job')];
  const aantal = document.getElementById('f-aantal');
  const leeg = document.getElementById('f-leeg');

  // Woorden los zoeken: "monteur utrecht" vindt een monteur in Utrecht.
  const normaal = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  // Begin met wat er in de link staat.
  const params = new URLSearchParams(location.search);
  form.q.value = params.get('q') || '';
  ['provincie', 'vakgebied'].forEach((n) => {
    const w = params.get(n) || '';
    if ([...form[n].options].some((o) => o.value === w)) form[n].value = w;
  });

  function filter() {
    const woorden = normaal(form.q.value).split(/\s+/).filter(Boolean);
    const prov = form.provincie.value;
    const vak = form.vakgebied.value;
    let n = 0;
    kaarten.forEach((k) => {
      const zoek = normaal(k.dataset.zoek || '');
      const ok = woorden.every((w) => zoek.includes(w))
        && (!prov || k.dataset.provincie === prov || k.dataset.provincie === '*')
        && (!vak || k.dataset.vakgebied === vak);
      k.hidden = !ok;
      if (ok) n++;
    });
    aantal.textContent = n === 1 ? '1 vacature' : `${n} vacatures`;
    leeg.hidden = n > 0;

    // Link bijwerken zonder de pagina te herladen.
    const p = new URLSearchParams();
    if (form.q.value.trim()) p.set('q', form.q.value.trim());
    if (prov) p.set('provincie', prov);
    if (vak) p.set('vakgebied', vak);
    const url = location.pathname + (p.toString() ? `?${p}` : '') + location.hash;
    history.replaceState(null, '', url);
  }

  form.addEventListener('input', filter);
  form.addEventListener('change', filter);
  form.addEventListener('submit', (e) => { e.preventDefault(); filter(); form.q.blur(); });
  document.getElementById('f-wis').addEventListener('click', () => { form.reset(); form.q.value = ''; filter(); form.q.focus(); });
  filter();
})();
