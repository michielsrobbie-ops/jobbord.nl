/* jobbord.nl demo */
(function(){
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const JOBS=window.JOBS||[];
const page=document.body.dataset.page;

/* logo-tegel met initialen, vaste kleur per bedrijf */
const TONES=["#0448AF","#0e7a55","#b4531a","#6b3fa0","#0f6b8a","#a1293b","#3d5a1e","#7a5c00","#334155"];
function av(name,cls=""){
  const ini=name.replace(/\b(B\.?V\.?|en|de|van|der)\b/gi,"").trim().split(/\s+/).slice(0,2).map(w=>w[0]).join("").toUpperCase();
  let h=0;for(const c of name)h=(h*31+c.charCodeAt(0))>>>0;
  return `<span class="av ${cls}" style="background:${TONES[h%TONES.length]}" aria-hidden="true">${esc(ini)}</span>`;
}
const VF='<span class="vf" title="Gecontroleerd bij de KvK"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2.5l2.4 1.7 2.9-.2 1 2.8 2.4 1.7-.8 2.8.8 2.8-2.4 1.7-1 2.8-2.9-.2L12 21.5l-2.4-1.7-2.9.2-1-2.8L3.3 15.5l.8-2.8-.8-2.8 2.4-1.7 1-2.8 2.9.2z"/><path d="m8.3 12.2 2.5 2.5 4.9-5.1" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg><span class="sr">Gecontroleerd bedrijf</span></span>';
const PIN='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/></svg>';
const CLOCK='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';
const BOLT='<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>';
const eur=n=>"€"+n.toLocaleString("nl-NL");
const pay=j=>`${eur(j.pay[0])} – ${eur(j.pay[1])} per ${j.pay[2]}`;
const when=d=>d===0?"Vandaag":d===1?"Gisteren":`${d} dagen geleden`;
function card(j,cur){
  return `<button class="job" type="button" data-id="${j.id}" aria-current="${j.id===cur}">
    ${av(j.company)}
    <span class="job-body">
      <h3>${esc(j.title)}${j.days<=1?'<span class="tag-new">Nieuw</span>':""}</h3>
      <p class="co">${esc(j.company)} ${VF}</p>
      <p class="place"><span>${PIN}${esc(j.city)}</span><span>${CLOCK}${esc(j.type)}, ${esc(j.hours)}</span></p>
      <span class="salary">${pay(j)}</span>
      <p class="snip">${esc(j.snip)}</p>
      <p class="when">${when(j.days)}</p>
    </span></button>`;
}
/* plaatsen voor de datalist */
const CITIES=["Alkmaar","Almelo","Almere","Amersfoort","Amsterdam","Apeldoorn","Arnhem","Assen","Bergen op Zoom","Breda","Delft","Den Bosch","Den Haag","Deventer","Doetinchem","Dordrecht","Ede","Eindhoven","Emmen","Enschede","Gouda","Groningen","Haarlem","Harderwijk","Heerenveen","Heerlen","Helmond","Hengelo","Hilversum","Hoorn","Kampen","Leeuwarden","Leiden","Lelystad","Maastricht","Meppel","Middelburg","Nijmegen","Oss","Roermond","Roosendaal","Rotterdam","Sittard","Sneek","Tilburg","Utrecht","Veenendaal","Venlo","Vlissingen","Weert","Zaandam","Zoetermeer","Zutphen","Zwolle"];
const dl=$("#steden"); if(dl) dl.innerHTML=CITIES.map(c=>`<option value="${c}">`).join("");

/* ---------- home ---------- */
if(page==="home"){
  const count=key=>JOBS.reduce((m,j)=>(m[j[key]]=(m[j[key]]||0)+1,m),{});
  const prov=count("prov"), sec=count("sector");
  const all=["Drenthe","Flevoland","Friesland","Gelderland","Groningen","Limburg","Noord-Brabant","Noord-Holland","Overijssel","Utrecht","Zeeland","Zuid-Holland"];
  $("#prov-links").innerHTML=all.map(p=>`<li><a href="vacatures.html?prov=${encodeURIComponent(p)}">${p}<span>${prov[p]||0}</span></a></li>`).join("");
  $("#sector-links").innerHTML=window.SECTORS.map(s=>`<li><a href="vacatures.html?sector=${encodeURIComponent(s)}">${esc(s)}<span>${sec[s]||0}</span></a></li>`).join("");
  const latest=$("#latest");
  latest.innerHTML=[...JOBS].sort((a,b)=>a.days-b.days).slice(0,6).map(j=>card(j)).join("");
  latest.addEventListener("click",e=>{const b=e.target.closest(".job");if(b) location.href="vacatures.html?id="+b.dataset.id;});
}

/* ---------- results ---------- */
if(page==="results"){
  const params=new URLSearchParams(location.search);
  const form=$("#search"), filters=$("#filters"), list=$("#list"), detail=$("#detail");
  form.q.value=params.get("q")||""; form.l.value=params.get("l")||"";
  const provSel=$("#f-prov");
  [...new Set(JOBS.map(j=>j.prov))].sort().forEach(p=>provSel.insertAdjacentHTML("beforeend",`<option>${p}</option>`));
  provSel.value=params.get("prov")||"";
  $("#f-sector").insertAdjacentHTML("beforeend",window.SECTORS.map(s=>`<label><input type="checkbox" name="sector" value="${esc(s)}"${params.get("sector")===s?" checked":""}> ${esc(s)}</label>`).join(""));
  let current=+params.get("id")||null;

  const norm=s=>s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");
  function filtered(){
    const q=norm(form.q.value.trim()), l=norm(form.l.value.trim());
    const secs=$$("input[name=sector]:checked").map(i=>i.value);
    const types=$$("input[name=type]:checked").map(i=>i.value);
    const days=+$("input[name=days]:checked").value;
    return JOBS.filter(j=>
      (!q||q.split(/\s+/).every(w=>norm(j.title+" "+j.company+" "+j.sector).includes(w))) &&
      (!l||norm(j.city+" "+j.prov).includes(l)) &&
      (!provSel.value||j.prov===provSel.value) &&
      (!secs.length||secs.includes(j.sector)) &&
      (!types.length||types.some(t=>j.type.includes(t))) &&
      j.days<=days);
  }
  function render(){
    const res=filtered();
    $("#count").innerHTML=`<strong>${res.length}</strong> ${res.length===1?"vacature":"vacatures"}`;
    if(!res.length){
      const q=form.q.value.trim(), l=form.l.value.trim();
      list.innerHTML=`<div class="empty"><p><strong>Geen vacatures${q?` voor "${esc(q)}"`:""}${l?` in ${esc(l)}`:""}.</strong></p><p>Probeer een andere functie, of zoek in heel Nederland.</p><button class="btn ghost small" type="button" id="reset">Toon alle vacatures</button></div>`;
      $("#reset").onclick=()=>{form.reset();filters.reset();provSel.value="";render();};
      detail.innerHTML="";return;
    }
    list.innerHTML=res.map(j=>card(j,current)).join("");
    if(!res.some(j=>j.id===current)) current=window.innerWidth>1060?res[0].id:null;
    if(current) show(current,false);
  }
  function show(id,open=true){
    current=id;const j=JOBS.find(x=>x.id===id); if(!j) return;
    $$(".job",list).forEach(b=>b.setAttribute("aria-current",+b.dataset.id===id));
    const li=a=>a.map(x=>`<li>${esc(x)}</li>`).join("");
    detail.innerHTML=`<div class="detail-in">
      <button class="btn ghost small close-detail" type="button" id="close">Terug naar de lijst</button>
      <div class="d-head">${av(j.company,"lg")}<div><h2>${esc(j.title)}</h2><p class="co">${esc(j.company)} ${VF}</p></div></div>
      <p class="place"><span>${PIN}${esc(j.city)}</span><span>${CLOCK}${esc(j.type)}, ${esc(j.hours)}</span></p>
      <span class="salary">${pay(j)}</span><br>
      <a class="btn" href="#apply" style="margin-top:8px">Solliciteer</a>
      <h3>De functie</h3><p>${esc(j.snip)}</p>
      <h3>Wat ga je doen</h3><ul class="txt">${li(j.tasks)}</ul>
      <h3>Wat krijg je</h3><ul class="txt">${li(j.offer)}</ul>
      <h3>Wat vragen we</h3><ul class="txt">${li(j.req)}</ul>
      <h3>Over ${esc(j.company)}</h3><p>${esc(j.about)}</p>
      <div class="kvk"><strong>${VF} Gecontroleerd bij de KvK.</strong> Ingeschreven sinds ${j.since}, ${esc(j.sbi.replace(/^\d+\s/,"").toLowerCase())}.</div>
      <form class="apply" id="apply" novalidate>
        <h3>Solliciteer bij ${esc(j.company)}</h3>
        <p class="hint">Je sollicitatie gaat direct naar ${esc(j.company)}.</p>
        <div class="hp" aria-hidden="true"><label>Website<input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
        <input type="hidden" name="t" value="${Date.now()}">
        <div class="field"><label for="a-name">Naam</label><input type="text" id="a-name" name="name" autocomplete="name"></div>
        <div class="field"><label for="a-tel">Telefoonnummer</label><input type="tel" id="a-tel" name="tel" autocomplete="tel" inputmode="tel" placeholder="06 12345678"></div>
        ${j.ko.map((q,i)=>`<div class="field" role="group" aria-labelledby="ko${i}"><span class="lbl" id="ko${i}">${esc(q)}</span><div class="yn"><label><input type="radio" name="ko${i}" value="ja"> Ja</label><label><input type="radio" name="ko${i}" value="nee"> Nee</label></div></div>`).join("")}
        <div class="field"><label for="a-cv">Cv toevoegen <span style="font-weight:400;color:var(--ink-2)">(hoeft niet)</span></label><label class="file"><input type="file" id="a-cv" name="cv" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"></label><small>Een foto van je cv met je telefoon is ook goed.</small></div>
        <p class="err" id="a-err" hidden></p>
        <button class="btn" type="submit">Verstuur sollicitatie</button>
      </form></div>`;
    detail.scrollTop=0;
    if(open&&window.innerWidth<=1060){detail.classList.add("open");document.body.style.overflow="hidden";}
    $("#close").onclick=()=>{detail.classList.remove("open");document.body.style.overflow="";};
    const f=$("#apply"), err=$("#a-err");
    f.tel.addEventListener("blur",()=>{const d=f.tel.value.replace(/\D/g,"").replace(/^31/,"0");if(/^06\d{8}$/.test(d))f.tel.value="06 "+d.slice(2);});
    f.onsubmit=e=>{
      e.preventDefault();
      if(f.website.value||Date.now()-+f.t.value<3000) return thanks(j,f);   // honeypot / te snel: doe alsof het gelukt is
      let first=null;const miss=[];
      if(f.name.value.trim().length<2){miss.push("je naam");first=first||f.name;}
      const d=f.tel.value.replace(/\D/g,"");
      if(d.length<9){miss.push("een telefoonnummer");first=first||f.tel;}
      const open=j.ko.findIndex((_,i)=>!f["ko"+i].value);
      if(open>-1){miss.push("ja of nee bij de vragen");first=first||f.querySelector(`[name=ko${open}]`);}
      if(miss.length){err.textContent="Vul nog in: "+miss.join(", ")+".";err.hidden=false;first.focus();return;}
      thanks(j,f);
    };
  }
  function thanks(j,f){
    const tel=esc(f.tel.value||"");
    f.outerHTML=`<div class="done" role="status"><h3>Verstuurd</h3><p>${esc(j.company)} heeft je sollicitatie ontvangen.${tel?` Ze bellen je op ${tel}.`:""}</p></div>`;
  }
  list.addEventListener("click",e=>{const b=e.target.closest(".job");if(b) show(+b.dataset.id);});
  form.addEventListener("submit",e=>{e.preventDefault();current=null;render();
    const u=new URL(location);u.searchParams.set("q",form.q.value);u.searchParams.set("l",form.l.value);u.searchParams.delete("id");history.replaceState(null,"",u);});
  filters.addEventListener("change",()=>{current=null;render();});
  const tg=$(".filter-toggle");
  tg.onclick=()=>{const o=filters.classList.toggle("open");tg.setAttribute("aria-expanded",o);};
  render();
  if(params.get("id")&&window.innerWidth<=1060) show(current);
}

/* ---------- onboarding ---------- */
if(page==="onboarding"){
  /* nagebootst KvK-register */
  const REG=[
    {name:"Hofstede Installaties",kvk:"12345678",city:"Zwolle",sbi:"4322",act:"Loodgieters- en installatiebedrijven",since:1998,domain:"hofstede-demo.nl"},
    {name:"Hofstede Bouw B.V.",kvk:"23456789",city:"Meppel",sbi:"4120",act:"Algemene burgerlijke en utiliteitsbouw",since:2010,domain:"hofstedebouw-demo.nl"},
    {name:"Grondwerken Tjalsma",kvk:"34567890",city:"Heerenveen",sbi:"4312",act:"Grondverzet",since:2004,domain:"tjalsma-demo.nl"},
    {name:"Transportbedrijf Wolters",kvk:"45678901",city:"Apeldoorn",sbi:"4941",act:"Goederenvervoer over de weg",since:1987,domain:"wolters-demo.nl"},
    {name:"Flexwerk Personeelsdiensten B.V.",kvk:"78200000",city:"Utrecht",sbi:"7820",act:"Uitzendbureaus",since:2016,domain:"flexwerk-demo.nl"},
    {name:"TechDetach Hofstad B.V.",kvk:"78300000",city:"Den Haag",sbi:"7830",act:"Payroll en detachering",since:2019,domain:"techdetach-demo.nl"}
  ];
  let company=null;
  const go=n=>{
    $$("[data-step]").forEach(s=>s.hidden=+s.dataset.step!==n);
    $$("#steps li").forEach((li,i)=>li.dataset.state=i+1<n?"done":i+1===n?"now":"");
    const first=$(`[data-step="${n}"] input:not([type=hidden]):not([tabindex="-1"]):not([readonly])`);
    (first||$(`[data-step="${n}"] h1, [data-step="${n}"] h2`)).focus?.();
  };
  $("#google").onclick=()=>go(2);

  const inp=$("#kvk"), listEl=$("#kvk-list"), out=$("#kvk-result");
  let t;
  inp.addEventListener("input",()=>{clearTimeout(t);t=setTimeout(search,200);});
  function search(){
    const q=inp.value.trim().toLowerCase(); out.innerHTML="";
    if(q.length<2){listEl.innerHTML="";return;}
    const digits=q.replace(/\D/g,"");
    const hits=REG.filter(r=>r.name.toLowerCase().includes(q)||(digits.length>=4&&r.kvk.startsWith(digits)));
    listEl.innerHTML=hits.length?`<ul class="suggest">${hits.map((r,i)=>`<li><button type="button" data-i="${REG.indexOf(r)}">${av(r.name)}<span><strong>${esc(r.name)}</strong><small>${esc(r.city)}, KvK ${r.kvk}</small></span></button></li>`).join("")}</ul>`
      :`<div class="suggest"><p class="nores">Niets gevonden voor "${esc(inp.value.trim())}". Controleer de spelling, of typ je KvK-nummer.</p></div>`;
  }
  listEl.addEventListener("click",e=>{
    const b=e.target.closest("[data-i]"); if(!b) return;
    const r=REG[+b.dataset.i]; listEl.innerHTML="";
    if(/^78/.test(r.sbi)){
      out.innerHTML=`<div class="result no" role="alert"><h3>${esc(r.name)} kan geen vacatures plaatsen</h3>
        <p>Dit bedrijf staat bij de KvK ingeschreven als ${esc(r.act.toLowerCase())}. Jobbord.nl is alleen voor bedrijven die zelf mensen in dienst nemen.</p>
        <p>Klopt dit niet? Mail naar support@jobbord.nl, dan kijken we ernaar.</p></div>`;
      return;
    }
    company=r;
    out.innerHTML=`<div class="chosen">${av(r.name)}<span><strong>${esc(r.name)}</strong><small>${esc(r.city)}, ${esc(r.act.toLowerCase())}, sinds ${r.since}</small></span></div>
      <p style="margin-top:16px"><button class="btn" type="button" id="to3">Ja, dit is mijn bedrijf</button></p>`;
    $("#to3").onclick=()=>{$("#domain").textContent="@"+company.domain;$("#mail-sub").textContent=`We sturen een code naar je e-mailadres bij ${company.name}.`;go(3);};
  });

  $("#mail-form").onsubmit=e=>{
    e.preventDefault();
    const err=$("#mail-err");
    let v=$("#bmail").value.trim().toLowerCase();
    if(v.includes("@")) v=v.split("@")[0];                       // iemand typt toch het hele adres
    if(!/^[a-z0-9._%+-]+$/.test(v)){err.textContent="Typ alleen het deel vóór het @-teken.";err.hidden=false;$("#bmail").focus();return;}
    err.hidden=true;
    const full=v+"@"+company.domain;
    $("#mail-form").hidden=true;$("#code-form").hidden=false;$("#j-mail").value=full;
    $("#code-sent").textContent=`Gestuurd naar ${full}. Niks ontvangen? Kijk ook even in je spam.`;
    $("#code").focus();
  };
  $("#manual").onclick=()=>{$("#mail-sub").textContent="Prima. We controleren je aanmelding binnen één werkdag en mailen je als alles klaarstaat.";$("#mail-form").hidden=true;};
  $("#code").addEventListener("input",e=>{e.target.value=e.target.value.replace(/\D/g,"").slice(0,6);if(e.target.value.length===6)$("#code-form").requestSubmit();});
  $("#code-form").onsubmit=e=>{
    e.preventDefault();
    if(!/^\d{6}$/.test($("#code").value)){$("#code-err").textContent="De code heeft 6 cijfers.";$("#code-err").hidden=false;return;}
    $("#j-city").value=company.city;
    go(4);
  };
  const started=Date.now();
  $("#job-form").onsubmit=e=>{
    e.preventDefault();
    const f=e.target, err=$("#job-err");
    if(f.website.value||Date.now()-started<3000){go(5);return;}
    const need=[["j-title","de functie"],["j-city","de plaats"],["j-desc","een korte omschrijving"]].filter(([id])=>!$("#"+id).value.trim());
    if(need.length){err.textContent="Vul nog in: "+need.map(n=>n[1]).join(", ")+".";err.hidden=false;$("#"+need[0][0]).focus();return;}
    $("#live-sub").textContent=`${$("#j-title").value.trim()} in ${$("#j-city").value.trim()} staat online. Sollicitaties gaan naar ${$("#j-mail").value}.`;
    go(5);
  };
}

/* ---------- dashboard ---------- */
if(page==="dashboard"){
  const apps=[
    {n:"Daan Mulder",tel:"06 12345678",job:"Servicemonteur",ko:[1,1],t:"Vandaag 09:14"},
    {n:"Sem de Groot",tel:"06 23456789",job:"Servicemonteur",ko:[1,0],t:"Vandaag 07:52"},
    {n:"Ilse Bakker",tel:"06 34567890",job:"Werkvoorbereider",ko:[1],t:"Gisteren"},
    {n:"Mohamed El Idrissi",tel:"06 45678901",job:"Servicemonteur",ko:[1,1],t:"Gisteren"}
  ];
  $("#apps").innerHTML=apps.map((a,i)=>`<tr>
    <td><strong>${a.n}</strong> ${i<2?'<span class="status new">Nieuw</span>':""}<br><a href="tel:${a.tel.replace(/\s/g,"")}">${a.tel}</a><br><span class="ko">${a.t}</span></td>
    <td class="hide-sm">${a.job}</td>
    <td class="ko">${a.ko.map(k=>k?"<b>✓ ja</b>":"<i>✗ nee</i>").join("<br>")}</td>
    <td><div class="feedback" role="group" aria-label="Was deze sollicitant bruikbaar?"><button type="button" aria-pressed="false">Ja</button><button type="button" class="neg" aria-pressed="false">Nee</button></div></td></tr>`).join("");
  $("#apps").addEventListener("click",e=>{const b=e.target.closest(".feedback button");if(!b)return;
    $$("button",b.parentNode).forEach(x=>x.setAttribute("aria-pressed",x===b));});

  let mails=[{a:"planning@hofstede-demo.nl",m:"elk"},{a:"jan@hofstede-demo.nl",m:"dag"}];
  const draw=()=>{$("#mails").innerHTML=mails.map((x,i)=>`<li><span>${esc(x.a)}</span>
    <label class="sr" for="m${i}">Wanneer mailen</label><select id="m${i}" data-i="${i}"><option value="elk"${x.m==="elk"?" selected":""}>Bij elke sollicitatie</option><option value="dag"${x.m==="dag"?" selected":""}>Eén keer per dag</option></select>
    <button class="x" type="button" data-del="${i}" aria-label="${esc(x.a)} verwijderen">×</button></li>`).join("")||'<li>Nog niemand. Voeg hieronder een adres toe.</li>';};
  draw();
  $("#mails").addEventListener("change",e=>{if(e.target.dataset.i) mails[+e.target.dataset.i].m=e.target.value;});
  $("#mails").addEventListener("click",e=>{const d=e.target.closest("[data-del]");if(d){mails.splice(+d.dataset.del,1);draw();}});
  $("#add-mail").onsubmit=e=>{e.preventDefault();const v=$("#new-mail").value.trim().toLowerCase(),err=$("#add-err");
    if(!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(v)){err.textContent="Dit lijkt geen e-mailadres. Controleer het even.";err.hidden=false;return;}
    if(mails.some(x=>x.a===v)){err.textContent="Dit adres krijgt al meldingen.";err.hidden=false;return;}
    err.hidden=true;mails.push({a:v,m:"elk"});$("#new-mail").value="";draw();};
}
})();
