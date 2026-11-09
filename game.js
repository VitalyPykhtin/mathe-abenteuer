'use strict';
/* ===================== Speicher ===================== */
const KEY = 'mathe-abenteuer-v2';
const S = (() => {
  const d = { name: '', hero: '', stars: {}, sound: true, voice: true, coins: 0, solved: 0, story: {}, sf: {}, done: {}, blitz: 0, exam: 0, tp: {}, own: {}, my: { env: 'home', items: [] }, last: '', days: 0 };
  try { return Object.assign(d, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { return d; }
})();
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* egal */ } };
const $ = s => document.querySelector(s);
const app = $('#app');
const eimg = f => `img/e/${f}.png`;
const photo = id => `img/${id}.jpg`;
const TOPIC = { wald: 'Nachbarzahlen', savanne: 'Zahlenstrahl', eis: 'Runden', ozean: 'Kreis', dschungel: 'Vierecke', berge: 'Parallel & senkrecht', insel: 'Gemischt' };
const ENVCSS = { home: ['#1e6fd9', '#57b947'], wald: ['#14532d', '#3f8f3f'], savanne: ['#c2570c', '#e0a030'], eis: ['#1c6fb5', '#8fd0ff'], ozean: ['#0b4f8a', '#1aa3c4'], dschungel: ['#166534', '#52a52e'], berge: ['#3b5fc0', '#6fb86a'], insel: ['#0e8fb8', '#e8c96a'] };
const HEROES = [['girl', 'Mädchen'], ['princess', 'Prinzessin'], ['woman_fairy', 'Fee'], ['woman_superhero', 'Superheldin'], ['woman_mage', 'Zauberin'], ['woman_astronaut', 'Astronautin'], ['woman_elf', 'Elfe'], ['ninja', 'Ninja'], ['woman_detective', 'Detektivin'], ['woman_artist', 'Künstlerin'], ['woman_scientist', 'Forscherin'], ['woman_singer', 'Sängerin'], ['unicorn', 'Einhorn'], ['cat', 'Katze'], ['dragon', 'Drache'], ['panda', 'Panda'], ['boy', 'Junge'], ['prince', 'Prinz'], ['man_superhero', 'Superheld'], ['man_astronaut', 'Astronaut']];
const BUDDIES = { wald: ['nelli', 'iggi', 'eule'], savanne: ['gina', 'zora', 'leo'], eis: ['pia', 'robbi', 'bruno'], ozean: ['coco', 'tilda', 'dana'], dschungel: ['mimi', 'pedro', 'tara'], berge: ['alma', 'zick', 'luna'], insel: ['wirbel', 'kiki', 'kalle'] };
const POOL = {}; WORLDS.forEach(w => { POOL[w.id] = [...new Set(w.levels.flat())]; });
let MODE = 'home';

/* ===================== Töne, Sprache, Effekte ===================== */
let AC;
function tone(freqs, dur = 0.13, type = 'sine', vol = 0.16) {
  if (!S.sound) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    freqs.forEach((f, i) => { const o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime + i * dur; o.type = type; o.frequency.value = f; o.connect(g); g.connect(AC.destination); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur * 1.6); o.start(t); o.stop(t + dur * 1.7); });
  } catch (e) { /* kein Ton */ }
}
const sfx = { ok: () => tone([660, 880]), bad: () => tone([220, 180], 0.16, 'triangle'), win: () => tone([523, 659, 784, 1047, 1319], 0.14), tap: () => tone([500], 0.04, 'sine', 0.06), coin: () => tone([1200, 1600], 0.06, 'square', 0.05), page: () => tone([392, 523], 0.09, 'triangle', 0.1) };
function speak(text, who) {
  if (!window.speechSynthesis) return; speechSynthesis.cancel(); if (!S.voice || !text) return;
  const u = new SpeechSynthesisUtterance(text.replace(/<[^>]+>/g, '').replace(/…/g, '...')); u.lang = 'de-DE'; u.rate = 0.98;
  let h = 0; for (const c of (who || '')) h = (h * 31 + c.charCodeAt(0)) % 97; u.pitch = who ? 0.7 + (h % 10) / 10 : 1;
  const v = speechSynthesis.getVoices().find(x => x.lang && x.lang.startsWith('de')); if (v) u.voice = v;
  speechSynthesis.speak(u);
}
function confetti(n = 70) {
  const fx = $('#fx'), cols = ['#f43f5e', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#fde047'];
  for (let i = 0; i < n; i++) { const p = document.createElement('i'); p.style.cssText = `left:${Math.random() * 100}%;background:${pick(cols)};animation-duration:${1.6 + Math.random() * 1.8}s;animation-delay:${Math.random() * 0.5}s;width:${7 + Math.random() * 8}px;height:${10 + Math.random() * 10}px`; fx.appendChild(p); setTimeout(() => p.remove(), 4200); }
}
function toast(html) { const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = html; document.body.appendChild(t); setTimeout(() => t.remove(), 2600); }
function coins(n, quiet) { S.coins += n; save(); if (!quiet) { sfx.coin(); const c = document.createElement('div'); c.className = 'coinfly'; c.textContent = `+${n} 🪙`; document.body.appendChild(c); setTimeout(() => c.remove(), 1200); } const el = $('#coinct'); if (el) el.textContent = S.coins; }
const starStr = (n, max = 3) => '<span class="stars">' + '★'.repeat(n) + '<span class="off">' + '★'.repeat(max - n) + '</span></span>';
const starsOf = (w, l) => S.stars[w + '-' + l] || 0;
const cardCount = () => Object.values(S.stars).filter(x => x > 0).length;
const gemCount = () => CHAPTERS.filter(c => S.done[c.id]).length;
function record(t, ok) { if (!t) return; const r = S.tp[t] = S.tp[t] || { n: 0, ok: 0 }; r.n++; if (ok) { r.ok++; S.solved++; } save(); }

/* ===================== Bühne (3D) ===================== */
function actor(key, x, y, size, anim, id) {
  if (key === 'gem') return { id: id || 'gem', gem: true, hue: actor.hue, x, y: y == null ? 30 : y, size: size || 30, anim, noShadow: true };
  const f = key === 'polina' ? S.hero : (ACT[key] ? ACT[key][0] : key);
  return { id: id || key, img: eimg(f), x, y, size: size || (key === 'polina' ? 40 : key === 'finn' ? 30 : 36), anim };
}
function stage(size, envKey, list, instant) {
  const name = envKey.replace(/2$/, ''), c = ENVCSS[name] || ENVCSS.home, b = document.body.style;
  b.setProperty('--sh', { big: '46vh', home: '40vh', small: '23vh', full: '62vh' }[size]); b.setProperty('--bgA', c[0]); b.setProperty('--bgB', c[1]);
  if (!W3.ok) return;
  W3.setEnv(name, /2$/.test(envKey) ? 1 : 0); W3.setActors(list || [], instant); W3.talk(null);
  requestAnimationFrame(() => W3.resize());
}
const hud = () => `<div class="hud"><span>🪙 <b id="coinct">${S.coins}</b></span><span>💎 ${gemCount()}/7</span>${S.days > 1 ? `<span>🔥 ${S.days} Tage</span>` : ''}</div>`;
const backBtn = (fn, label = '← Zurück') => `<button class="back" onclick="event.stopPropagation();${fn}">${label}</button>`;

/* ===================== Aufgaben-Baustein ===================== */
let CUR = null;
function qHTML(q) {
  let body = '';
  if (q.type === 'choice') body = `<div class="opts ${q.grid ? 'grid' : ''} ${q.two ? 'two' : ''} ${q.long || q.options.length === 3 ? 'long' : ''}">${q.options.map((o, i) => `<button class="opt" data-i="${i}" onclick="G.choose(${i})">${o}</button>`).join('')}</div>`;
  else if (q.type === 'fields') { let k = 0; const n = q.parts.filter(p => typeof p === 'object').length; body = `<div class="fields">${q.parts.map(p => typeof p === 'object' ? `<button class="field" data-f="${k}" onclick="G.focus(${k++})"></button>` : `<span>${p}</span>`).join('')}</div><div class="keys">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(d => `<button onclick="G.key('${d}')">${d}</button>`).join('')}<button class="del" onclick="G.key('del')">⌫</button>${n > 1 ? '<button class="nxt" onclick="G.key(\'next\')">→</button>' : ''}</div>`; }
  else if (q.type === 'line') body = '<div id="iline" class="inter"></div><div class="nudge"><button onclick="G.nudge(-1)">◀</button><span>Tippe auf einen Strich</span><button onclick="G.nudge(1)">▶</button></div>';
  else if (q.type === 'grid') body = '<div id="igrid" class="inter"></div>';
  return `<div class="prompt">${q.q}</div>${q.visual ? `<div class="visual">${q.visual}</div>` : ''}${body}`;
}
function qMount(q, onReady) {
  CUR = { q, sel: null, fields: null, active: 0, done: false, onReady: onReady || (() => {}) };
  if (q.type === 'fields') { CUR.fields = q.parts.filter(p => typeof p === 'object').map(() => ''); drawFields(); }
  if (q.type === 'line') { drawLine(); $('#iline').addEventListener('pointerdown', e => { if (CUR.done) return; const r = $('#iline svg').getBoundingClientRect(), n = q.line.majors * q.line.sub, x = (e.clientX - r.left) / r.width * 1000; CUR.sel = Math.max(0, Math.min(n, Math.round((x - 55) / 890 * n))); sfx.tap(); drawLine(); }); }
  if (q.type === 'grid') { drawGrid(); $('#igrid').addEventListener('pointerdown', e => { if (CUR.done) return; const r = $('#igrid svg').getBoundingClientRect(), x = Math.round(((e.clientX - r.left) / r.width * 650 - 25) / 50), y = Math.round(((e.clientY - r.top) / r.height * 450 - 25) / 50), g = q.grid; if (x < 0 || x > 12 || y < 0 || y > 8 || [g.A, g.B, g.D].some(p => p[0] === x && p[1] === y)) return; CUR.sel = [x, y]; sfx.tap(); drawGrid(); }); }
}
const ready = on => CUR.onReady(on);
function choose(i) { if (!CUR || CUR.done) return; CUR.sel = i; sfx.tap(); document.querySelectorAll('.opt').forEach(b => b.classList.toggle('sel', +b.dataset.i === i)); ready(true); }
function drawFields() { document.querySelectorAll('.field').forEach(b => { const k = +b.dataset.f; b.textContent = CUR.fields[k] ? fmt(+CUR.fields[k]) : ''; b.classList.toggle('act', !CUR.done && k === CUR.active); }); ready(CUR.fields.every(f => f !== '')); }
function focus(k) { if (CUR.done) return; CUR.active = k; drawFields(); }
function key(k) {
  if (!CUR || CUR.done || !CUR.fields) return; let v = CUR.fields[CUR.active];
  if (k === 'del') v = v.slice(0, -1); else if (k === 'next') { CUR.active = (CUR.active + 1) % CUR.fields.length; drawFields(); return; } else if (v.length < 7) v = (v === '0' ? '' : v) + k;
  CUR.fields[CUR.active] = v; sfx.tap(); drawFields();
}
function drawLine(reveal) {
  const q = CUR.q, c = q.line, step = c.major / c.sub, arrows = [], v = CUR.sel != null ? c.start + CUR.sel * step : null;
  if (reveal && v !== q.ans) arrows.push({ v: q.ans, label: '✓', color: '#16a34a' });
  if (v != null) arrows.push({ v, label: 'B', color: reveal ? (v === q.ans ? '#16a34a' : '#e11d48') : '#2563eb' });
  $('#iline').innerHTML = lineSVG(c, arrows); if (!reveal) ready(v != null);
}
function nudge(d) { if (!CUR || CUR.done || CUR.q.type !== 'line') return; const n = CUR.q.line.majors * CUR.q.line.sub; CUR.sel = Math.max(0, Math.min(n, CUR.sel == null ? Math.round(n / 2) : CUR.sel + d)); sfx.tap(); drawLine(); }
function drawGrid(reveal) { $('#igrid').innerHTML = gridSVG(CUR.q.grid, CUR.sel, reveal); if (!reveal) ready(CUR.sel != null); }
/* prüft die aktuelle Aufgabe; silent = ohne Farben (Klassenarbeit) */
function qCheck(silent) {
  const q = CUR.q; let ok = false, sol = '';
  if (q.type === 'choice') {
    if (CUR.sel == null) return null; ok = CUR.sel === q.correct; sol = `<p class="sol">Richtig ist: <b>${q.grid ? 'siehe unten' : q.options[q.correct]}</b></p>`;
    if (!silent) document.querySelectorAll('.opt').forEach(b => { const i = +b.dataset.i; b.disabled = true; if (i === q.correct) b.classList.add('right'); else if (i === CUR.sel) b.classList.add('wrong'); });
  } else if (q.type === 'fields') {
    if (CUR.fields.some(f => f === '')) return null; const ans = q.parts.filter(p => typeof p === 'object').map(p => p.ans); ok = CUR.fields.every((f, k) => +f === ans[k]);
    if (!silent) document.querySelectorAll('.field').forEach(b => { const k = +b.dataset.f; b.classList.add(+CUR.fields[k] === ans[k] ? 'right' : 'wrong'); b.classList.remove('act'); });
    sol = `<p class="sol">Richtig ist: ${q.parts.map(p => typeof p === 'object' ? `<b>${fmt(p.ans)}</b>` : p).join(' ')}</p>`;
  } else if (q.type === 'line') { if (CUR.sel == null) return null; ok = q.line.start + CUR.sel * q.line.major / q.line.sub === q.ans; if (!silent) drawLine(true); }
  else if (q.type === 'grid') { if (CUR.sel == null) return null; ok = CUR.sel[0] === q.ans[0] && CUR.sel[1] === q.ans[1]; if (!silent) drawGrid(true); }
  CUR.done = true; document.querySelectorAll('.keys button,.nudge button,.opt').forEach(b => { b.disabled = true; });
  return { ok, sol };
}
const PRAISE = ['Richtig! 🎉', 'Super! ⭐', 'Genau! 👏', 'Klasse gemacht! 💪', 'Perfekt! 🌟', 'Stark! 🚀', 'Wow! 🤩'];
const checkBtn = (color, label = 'Prüfen') => `<button id="check" class="btn" style="background:${color}" disabled onclick="G.check()">${label}</button><div id="fb"></div>`;
const enableCheck = on => { const b = $('#check'); if (b) b.disabled = !on; };

/* ===================== Start: Heldin wählen ===================== */
function chooseHero() {
  MODE = 'hero'; stage('home', 'home', [actor('finn', 50, 3, 40, 'hop')]);
  app.innerHTML = `<div class="stagehit"><h1 class="title">Willkommen im Zahlenland!</h1></div>
  <div class="panel"><h2>Wer möchtest du sein?</h2>
    <div class="heroes">${HEROES.map(h => `<button class="hero ${S.hero === h[0] ? 'sel' : ''}" data-h="${h[0]}" onclick="G.pickHero('${h[0]}')"><img src="${eimg(h[0])}" alt=""><span>${h[1]}</span></button>`).join('')}</div>
    <label class="namel">Dein Name: <input id="hname" maxlength="14" value="${S.name || 'Polina'}"></label>
    <button class="btn" id="herogo" style="background:#e11d74" ${S.hero ? '' : 'disabled'} onclick="G.heroDone()">Abenteuer starten! 🚀</button>
  </div>`;
}
function pickHero(h) { S.hero = h; sfx.ok(); document.querySelectorAll('.hero').forEach(b => b.classList.toggle('sel', b.dataset.h === h)); $('#herogo').disabled = false; W3.setActors([actor('polina', 38, 3, 46, 'hop'), actor('finn', 62, 3, 36, 'hop')]); W3.celebrate(); }
function heroDone() { S.name = ($('#hname').value || 'Polina').trim().slice(0, 14); save(); confetti(60); sfx.win(); home(); }

/* ===================== Startseite ===================== */
function home() {
  MODE = 'home'; if (window.speechSynthesis) speechSynthesis.cancel();
  if (!S.hero) return chooseHero();
  const gems = CHAPTERS.map((c, i) => S.done[c.id] ? Object.assign(actor('gem', 14 + i * 12, 66, 13, 'float', 'g' + i), { hue: c.hue }) : null).filter(Boolean);
  stage('home', 'home', [actor('polina', 36, 3, 44), actor('finn', 58, 3, 32, 'hop'), ...gems]);
  const ci = CHAPTERS.findIndex(c => !S.done[c.id]), ch = CHAPTERS[ci < 0 ? 0 : ci], allDone = ci < 0;
  const weak = Object.keys(TOPIC).filter(t => S.tp[t] && S.tp[t].n >= 3).sort((a, b) => S.tp[a].ok / S.tp[a].n - S.tp[b].ok / S.tp[b].n)[0];
  app.innerHTML = `<div class="stagehit"><h1 class="title">${S.name}s Mathe-Abenteuer</h1>${hud()}</div>
  <div class="menu">
    <button class="mode big" style="--a:${ENVCSS[ch.id][0]};--b:${ENVCSS[ch.id][1]}" onclick="G.storyMenu()">
      <img src="${eimg('books')}" alt=""><span><b>📖 Geschichte</b><small>${allDone ? 'Alle 7 Kristalle gefunden! Nochmal ansehen?' : `Kapitel ${ci + 1}: ${ch.title} · Szene ${Math.min((S.story[ch.id] || 0) + 1, ch.scenes.length)} von ${ch.scenes.length}`}</small></span><i>▶</i></button>
    <button class="mode" style="--a:#7c3aed;--b:#c026d3" onclick="G.trainMenu()"><img src="${eimg('bullseye')}" alt=""><span><b>Training</b><small>Tierkarten sammeln · ${cardCount()}/21</small></span></button>
    <button class="mode" style="--a:#ea580c;--b:#facc15" onclick="G.blitzIntro()"><img src="${eimg('high_voltage')}" alt=""><span><b>Blitz-Runde</b><small>90 Sekunden · Rekord: ${S.blitz}</small></span></button>
    <button class="mode" style="--a:#0f766e;--b:#22c55e" onclick="G.examIntro()"><img src="${eimg('memo')}" alt=""><span><b>Klassenarbeit</b><small>${S.exam ? 'Beste Note: ' + S.exam : 'Probe wie in der Schule'}</small></span></button>
    <button class="mode" style="--a:#be123c;--b:#fb7185" onclick="G.weakMenu()"><img src="${eimg('magic_wand')}" alt=""><span><b>Schwächen-Zauber</b><small>${weak ? 'Übe: ' + TOPIC[weak] : 'Übt, was noch schwer ist'}</small></span></button>
    <button class="mode" style="--a:#0369a1;--b:#38bdf8" onclick="G.myWorld()"><img src="${eimg('castle')}" alt=""><span><b>Meine Welt</b><small>Sticker kaufen und 3D-Welt bauen</small></span></button>
    <button class="mode" style="--a:#a16207;--b:#fbbf24" onclick="G.album()"><img src="${eimg('trophy')}" alt=""><span><b>Tieralbum</b><small>Deine echten Tierfotos</small></span></button>
  </div>
  <div class="foot"><button class="pill" onclick="G.toggle('sound')">${S.sound ? '🔊 Töne an' : '🔇 Töne aus'}</button><button class="pill" onclick="G.toggle('voice')">${S.voice ? '🗣️ Vorlesen an' : '🤐 Vorlesen aus'}</button><button class="pill" onclick="G.chooseHero()">🧑‍🎤 Figur ändern</button></div>`;
  window.scrollTo(0, 0);
}

/* ===================== GESCHICHTE ===================== */
let ST = null;
const chOpen = i => i === 0 || S.done[CHAPTERS[i - 1].id];
const chStars = c => { const n = c.scenes.filter(s => s.g).length, f = c.scenes.filter((s, i) => S.sf[c.id + '-' + i] === 1).length, r = f / n; return !S.done[c.id] ? 0 : r >= 0.95 ? 3 : r >= 0.7 ? 2 : 1; };
function storyMenu() {
  MODE = 'menu'; if (window.speechSynthesis) speechSynthesis.cancel();
  stage('home', 'home', [actor('polina', 30, 3, 42), actor('finn', 46, 3, 30), actor('map', 68, 6, 34, 'pulse')]);
  app.innerHTML = `<div class="stagehit">${backBtn('G.home()')}<h1 class="title">Die sieben Zahlenkristalle</h1></div>
  <div class="chapters">${CHAPTERS.map((c, i) => {
    const open = chOpen(i), n = c.scenes.length, u = S.done[c.id] ? n : Math.min(S.story[c.id] || 0, n);
    return `<button class="chapter ${open ? '' : 'locked'}" style="--a:${ENVCSS[c.id][0]};--b:${ENVCSS[c.id][1]}" onclick="${open ? `G.playChapter(${i})` : ''}">
      <img class="gemimg ${S.done[c.id] ? '' : 'off'}" style="filter:hue-rotate(${c.hue - 200}deg)${S.done[c.id] ? '' : ' grayscale(1) brightness(.6)'}" src="${eimg('gem_stone')}" alt="">
      <span><small>Kapitel ${i + 1} · ${c.sub}</small><b>${c.title}</b>
      <span class="bar"><i style="width:${u / n * 100}%"></i></span>
      <small>${open ? (S.done[c.id] ? 'Geschafft! ' + starStr(chStars(c)) : `Szene ${u + 1} von ${n}`) : '🔒 Schaffe erst Kapitel ' + i}</small></span></button>`;
  }).join('')}</div>`;
  window.scrollTo(0, 0);
}
function playChapter(ci) { const c = CHAPTERS[ci]; playScene(ci, S.done[c.id] ? 0 : Math.min(S.story[c.id] || 0, c.scenes.length - 1)); }
function parseActors(str, hue) {
  actor.hue = hue;
  return str.split(/\s+/).filter(Boolean).map((tok, i) => { const mm = tok.match(/^(\w+)@(\d+)(?:,(\d+))?(?:\*(\d+))?(?:!(\w+))?$/); if (!mm) return null; return actor(mm[1], +mm[2], mm[3] == null ? (mm[1] === 'gem' ? 30 : 3) : +mm[3], mm[4] ? +mm[4] : 0, mm[5], mm[1] + (mm[1] === 'gem' ? '' : '')); }).filter(Boolean);
}
function playScene(ci, si) {
  MODE = 'story'; const c = CHAPTERS[ci], sc = c.scenes[si], solved = S.done[c.id] ? c.scenes.length : (S.story[c.id] || 0);
  ST = { ci, si, line: -1, phase: 'talk', first: true, replay: si < solved };
  stage('big', sc.bg, parseActors(sc.a, c.hue)); sfx.page();
  app.innerHTML = `<div class="stagehit" onclick="G.sNext()">
    <div class="stagetop">${backBtn('G.storyMenu()', '✕')}
      <div class="strip">${c.scenes.map((s, i) => `<button class="${i === si ? 'now' : ''} ${i <= solved ? '' : 'lock'}" onclick="event.stopPropagation();${i <= solved ? `G.playScene(${ci},${i})` : ''}">${i <= solved ? i + 1 : '🔒'}</button>`).join('')}</div>
      <button class="back" onclick="event.stopPropagation();G.toggle('voice',1)">${S.voice ? '🗣️' : '🤐'}</button></div>
    <div class="chlabel">Kapitel ${ci + 1} · ${c.title}</div>
  </div>
  <div class="story"><div class="caption" id="cap" onclick="G.sNext()"></div><div id="task"></div></div>`;
  window.scrollTo(0, 0); sNext();
}
function sNext() {
  if (!ST || ST.phase !== 'talk') return;
  const c = CHAPTERS[ST.ci], sc = c.scenes[ST.si]; ST.line++;
  if (ST.line < sc.l.length) {
    const mm = sc.l[ST.line].match(/^(\w+):\s*(.*)$/), who = mm[1], text = mm[2], isN = who === 'N';
    const name = isN ? '' : who === 'polina' ? S.name : ACT[who][1], f = who === 'polina' ? S.hero : isN ? 'scroll' : ACT[who][0];
    $('#cap').innerHTML = `<img src="${eimg(f)}" alt=""><div class="${isN ? 'narr' : ''}"><b>${name}</b><p>${text}</p></div><span class="tapnext">▶</span>`;
    W3.talk(isN ? null : who); sfx.tap(); speak(text, isN ? '' : who); return;
  }
  W3.talk(null);
  if (sc.g && !ST.replay) { ST.phase = 'task'; sTask(); }
  else {
    ST.phase = 'end'; const last = ST.si === c.scenes.length - 1;
    $('#cap').innerHTML = `<div class="capend"><button class="btn" style="background:${ENVCSS[c.id][0]}" onclick="event.stopPropagation();${last ? `G.chapterDone(${ST.ci})` : `G.playScene(${ST.ci},${ST.si + 1})`}">${last ? (S.done[c.id] ? 'Kapitel beenden' : '💎 Kristall einsammeln!') : 'Nächste Szene ▶'}</button></div>`;
  }
}
function sTask() {
  const c = CHAPTERS[ST.ci], sc = c.scenes[ST.si], q = sc.g(); ST.t = sc.t || c.id;
  $('#cap').innerHTML = `<img src="${eimg('scroll')}" alt=""><div class="narr"><p>${sc.intro || 'Löse die Aufgabe!'}</p></div>`; speak(sc.intro);
  $('#task').innerHTML = `<div class="card">${ST.first ? '' : '<div class="badge">🔁 Neuer Versuch</div>'}${qHTML(q)}${checkBtn(ENVCSS[c.id][0])}</div>`;
  qMount(q, enableCheck); document.body.style.setProperty('--sh', '32vh');
}
function sCheck() {
  if (CUR.done) return; const r = qCheck(); if (!r) return;
  const c = CHAPTERS[ST.ci], k = c.id + '-' + ST.si; record(ST.t, r.ok);
  if (r.ok) {
    if (S.sf[k] == null) S.sf[k] = ST.first ? 1 : 0;
    S.story[c.id] = Math.max(S.story[c.id] || 0, ST.si + 1); save();
    sfx.ok(); W3.celebrate(c.hue); coins(ST.first ? 3 : 1);
    $('#fb').innerHTML = `<div class="fb good"><h3>${pick(PRAISE)}</h3><p>🔓 Die nächste Szene ist freigeschaltet!</p></div>`;
    const b = $('#check'); b.textContent = 'Nächste Szene ▶'; b.disabled = false; b.onclick = () => playScene(ST.ci, ST.si + 1);
    const nx = document.querySelectorAll('.strip button')[ST.si + 1]; if (nx) { nx.classList.remove('lock'); nx.textContent = ST.si + 2; nx.classList.add('fresh'); }
  } else {
    sfx.bad(); ST.first = false;
    $('#fb').innerHTML = `<div class="fb bad"><h3>Noch nicht ganz – schau mal:</h3>${r.sol}${CUR.q.explain}</div>`;
    const b = $('#check'); b.textContent = '🔁 Neue Aufgabe versuchen'; b.disabled = false; b.onclick = () => sTask();
    setTimeout(() => $('#fb').scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60);
  }
}
function chapterDone(ci) {
  const c = CHAPTERS[ci], was = S.done[c.id]; S.done[c.id] = 1; save();
  if (was) return storyMenu();
  MODE = 'menu'; actor.hue = c.hue; coins(20, true); sfx.win(); confetti(140);
  stage('big', c.scenes[0].bg, [actor('polina', 30, 3, 44, 'hop'), actor('gem', 50, 34, 46, 'pulse'), actor('finn', 70, 3, 32, 'hop')]); W3.celebrate(c.hue);
  const last = ci === CHAPTERS.length - 1;
  app.innerHTML = `<div class="stagehit"></div><div class="result"><h1>${last ? 'Zahlenland gerettet!' : `Kristall ${gemCount()} von 7!`}</h1>
    <div class="bigstars">${starStr(chStars(c))}</div><p>Kapitel „${c.title}“ geschafft. +20 🪙</p>
    <p>${last ? 'Du bist jetzt eine echte Zahlenmeisterin! 👑' : `Neu: Die Welt „${c.title}“ kannst du jetzt in „Meine Welt“ benutzen.`}</p>
    <div class="btns">${last ? '' : `<button class="btn" style="background:${ENVCSS[CHAPTERS[ci + 1].id][0]}" onclick="G.playChapter(${ci + 1})">Kapitel ${ci + 2} starten ▶</button>`}<button class="btn sec" onclick="G.home()">Zur Startseite</button></div></div>`;
  window.scrollTo(0, 0);
}

/* ===================== QUIZ (Training, Schwächen) ===================== */
let QZ = null;
function runQuiz(cfg) {
  MODE = 'quiz'; QZ = Object.assign({ i: 0, first: 0, streak: 0 }, cfg);
  QZ.queue = cfg.items.map(it => ({ gen: it.gen, t: it.t, q: it.gen(), retry: false })); QZ.N = QZ.queue.length;
  stage('small', cfg.env, [actor('polina', 38, 3, 62), actor(cfg.buddy, 62, 3, 56, 'hop')]); quizRender();
}
function quizRender() {
  const it = QZ.queue[QZ.i], pct = QZ.i / QZ.queue.length * 100;
  app.innerHTML = `<div class="stagehit"></div><div class="quiz">
    <div class="topbar">${backBtn('G.quit()', '✕')}<div class="track"><div class="fill" style="width:${pct}%;background:${QZ.color}"></div><img class="runner" src="${eimg(S.hero)}" style="left:${pct}%" alt=""><span class="haus">🏁</span></div><span class="streak ${QZ.streak >= 2 ? 'on' : ''}">🔥 ${QZ.streak}</span></div>
    <div class="card">${it.retry ? '<div class="badge">🔁 Zweite Chance</div>' : ''}${qHTML(it.q)}${checkBtn(QZ.color)}</div></div>`;
  qMount(it.q, enableCheck); window.scrollTo(0, 0);
}
function quizCheck() {
  if (CUR.done) { QZ.i++; if (QZ.i < QZ.queue.length) quizRender(); else QZ.finish(QZ.first, QZ.N); return; }
  const r = qCheck(); if (!r) return; const it = QZ.queue[QZ.i]; record(it.t, r.ok);
  if (r.ok) { QZ.streak++; if (!it.retry) QZ.first++; sfx.ok(); W3.celebrate(); coins(1, true); if (QZ.streak % 5 === 0) confetti(30); }
  else { QZ.streak = 0; sfx.bad(); if (!it.retry) QZ.queue.push({ gen: it.gen, t: it.t, q: it.gen(), retry: true }); }
  const se = $('.streak'); se.textContent = '🔥 ' + QZ.streak; se.classList.toggle('on', QZ.streak >= 2);
  const pct = (QZ.i + 1) / QZ.queue.length * 100; $('.fill').style.width = pct + '%'; $('.runner').style.left = pct + '%';
  $('#fb').innerHTML = r.ok ? `<div class="fb good"><h3>${pick(PRAISE)}${QZ.streak >= 3 ? ` &nbsp;${QZ.streak} in Folge!` : ''}</h3></div>`
    : `<div class="fb bad"><h3>Noch nicht ganz – schau mal:</h3>${r.sol}${it.q.explain}${it.retry ? '' : '<p class="again">🔁 So eine Aufgabe kommt am Ende nochmal.</p>'}</div>`;
  const b = $('#check'); b.textContent = QZ.i + 1 < QZ.queue.length ? 'Weiter →' : 'Fertig! 🏁'; b.disabled = false;
  if (!r.ok) setTimeout(() => $('#fb').scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60);
}
function quit() { if (confirm('Wirklich abbrechen?')) { if (BZ) { clearInterval(BZ.timer); BZ = null; } home(); } }

/* ---- Training mit Tierkarten ---- */
function trainMenu() {
  MODE = 'menu'; stage('home', 'home', [actor('polina', 34, 3, 42), actor('trophy', 58, 4, 34, 'pulse')]);
  const bossOpen = cardCount() >= 6;
  app.innerHTML = `<div class="stagehit">${backBtn('G.home()')}<h1 class="title">Training</h1></div>
  <div class="chapters">${WORLDS.map((w, wi) => {
    const locked = w.boss && !bossOpen;
    return `<button class="chapter ${locked ? 'locked' : ''}" style="--a:${ENVCSS[w.id][0]};--b:${ENVCSS[w.id][1]}" onclick="${locked ? '' : `G.world(${wi})`}">
      <span class="wicon">${w.icon}</span><span><small>${w.topic}</small><b>${w.name}</b>
      <span class="wthumbs">${w.animals.map((a, li) => `<img src="${photo(a)}" class="${starsOf(wi, li) ? '' : 'hid'}" alt="">`).join('')}</span>
      <small>${locked ? '🔒 Sammle erst 6 Tierkarten' : starStr(w.animals.reduce((s, _, li) => s + starsOf(wi, li), 0), 9)}</small></span></button>`;
  }).join('')}</div>`;
  window.scrollTo(0, 0);
}
function world(wi) {
  MODE = 'menu'; const w = WORLDS[wi]; stage('home', w.id, [actor('polina', 30, 3, 42), ...BUDDIES[w.id].map((b, i) => actor(b, 50 + i * 16, 3, 34, i === 1 ? 'hop' : ''))]);
  app.innerHTML = `<div class="stagehit">${backBtn('G.trainMenu()')}<h1 class="title">${w.icon} ${w.name}</h1></div>
  <div class="rule">${w.rule}</div>
  <div class="levels">${w.animals.map((a, li) => {
    const open = li === 0 || starsOf(wi, li - 1) > 0, st = starsOf(wi, li);
    return `<button class="level ${open ? '' : 'locked'}" style="--c:${w.color}" onclick="${open ? `G.train(${wi},${li})` : ''}"><span class="photo ${st ? '' : 'hid'}"><img src="${photo(a)}" alt=""></span><b>${LEVELNAMES[li]}</b>
      <small>${st ? ANIMALS[a][0] + ' ist dein Freund!' : open ? 'Gewinne die Tierkarte!' : '🔒 Schaffe erst Level ' + li}</small>${starStr(st)}<span class="go">${open ? (st ? 'Nochmal spielen' : 'Los geht’s!') : 'Gesperrt'}</span></button>`;
  }).join('')}</div>`;
  window.scrollTo(0, 0);
}
function train(wi, li) {
  const w = WORLDS[wi], gens = w.levels[li], N = w.count || 8; let order = [];
  while (order.length < N) order = order.concat(shuffle(gens));
  runQuiz({ env: w.id, color: w.color, buddy: BUDDIES[w.id][li], items: order.slice(0, N).map(g => ({ gen: g, t: w.id })), finish: (first, n) => trainDone(wi, li, first, n) });
}
function trainDone(wi, li, first, N) {
  MODE = 'menu'; const w = WORLDS[wi], a = w.animals[li], ratio = first / N, st = ratio >= 1 ? 3 : ratio >= 0.85 ? 2 : ratio >= 0.7 ? 1 : 0;
  const before = starsOf(wi, li), isNew = st > 0 && before === 0; if (st > before) { S.stars[wi + '-' + li] = st; save(); }
  stage('small', w.id, [actor('polina', 40, 3, 62, st ? 'hop' : ''), actor(BUDDIES[w.id][li], 60, 3, 56, st ? 'hop' : '')]);
  if (st > 0) {
    sfx.win(); confetti(isNew ? 120 : 60); coins(5 + st * 5, true);
    app.innerHTML = `<div class="stagehit"></div><div class="result"><h1>${isNew ? 'Neue Tierkarte!' : 'Geschafft!'}</h1><div class="bigstars">${starStr(st)}</div>
      <p>${first} von ${N} gleich beim ersten Mal richtig. +${5 + st * 5} 🪙${st < 3 ? ' · Schaffst du 3 Sterne?' : ''}</p>
      <div class="acard ${isNew ? 'flip' : ''}"><img src="${photo(a)}" alt=""><div><b>${ANIMALS[a][0]}</b><span>${ANIMALS[a][1]}</span></div></div>
      <div class="btns">${li < 2 ? `<button class="btn" style="background:${w.color}" onclick="G.train(${wi},${li + 1})">Nächstes Level →</button>` : ''}<button class="btn sec" onclick="G.train(${wi},${li})">Nochmal</button><button class="btn sec" onclick="G.world(${wi})">Zur Welt</button></div></div>`;
  } else {
    app.innerHTML = `<div class="stagehit"></div><div class="result"><h1>Fast geschafft!</h1><p>${first} von ${N} gleich richtig. Für die Tierkarte brauchst du ${Math.ceil(N * 0.7)}.</p>
      <div class="rule">${w.rule}</div><div class="btns"><button class="btn" style="background:${w.color}" onclick="G.train(${wi},${li})">Gleich nochmal!</button><button class="btn sec" onclick="G.world(${wi})">Zur Welt</button></div></div>`;
  }
  window.scrollTo(0, 0);
}
function album() {
  MODE = 'menu'; stage('small', 'home', [actor('polina', 42, 3, 62), actor('trophy', 60, 4, 50, 'pulse')]);
  app.innerHTML = `<div class="stagehit">${backBtn('G.home()')}<h1 class="title">Tieralbum · ${cardCount()}/21</h1></div>
  <div class="album">${WORLDS.map((w, wi) => w.animals.map((a, li) => { const st = starsOf(wi, li); return st ? `<div class="acard"><img src="${photo(a)}" alt=""><div><b>${ANIMALS[a][0]} ${starStr(st)}</b><span>${ANIMALS[a][1]}</span></div></div>` : `<div class="acard hidcard"><img src="${photo(a)}" alt=""><div><b>???</b><span>${w.icon} ${w.name} · Level ${li + 1}</span></div></div>`; }).join('')).join('')}</div>`;
  window.scrollTo(0, 0);
}

/* ---- Schwächen-Zauber ---- */
function weakMenu() {
  MODE = 'menu'; stage('home', 'home', [actor('polina', 36, 3, 42), actor('magic_wand', 56, 20, 30, 'sway')]);
  const ts = Object.keys(TOPIC).filter(t => t !== 'insel');
  app.innerHTML = `<div class="stagehit">${backBtn('G.home()')}<h1 class="title">Schwächen-Zauber</h1></div>
  <div class="panel"><h2>So gut bist du schon:</h2>
    ${ts.map(t => { const r = S.tp[t], p = r && r.n ? Math.round(r.ok / r.n * 100) : null; return `<div class="trow"><span>${TOPIC[t]}</span><span class="bar"><i style="width:${p == null ? 0 : p}%;background:${p == null ? '#cbd5e1' : p >= 85 ? '#22c55e' : p >= 65 ? '#f59e0b' : '#ef4444'}"></i></span><b>${p == null ? '–' : p + ' %'}</b><small>${r ? r.n : 0} Aufgaben</small></div>`; }).join('')}
    <p class="hint">Der Zauber sucht 8 Aufgaben aus – am meisten von dem, was noch schwer ist.</p>
    <button class="btn" style="background:#be123c" onclick="G.weak()">Zauber starten ✨</button></div>`;
  window.scrollTo(0, 0);
}
function weak() {
  const ts = Object.keys(TOPIC).filter(t => t !== 'insel'), wt = ts.map(t => { const r = S.tp[t]; return !r || r.n < 4 ? 3 : 1 + 8 * (1 - r.ok / r.n); }), sum = wt.reduce((a, b) => a + b, 0), items = [];
  for (let i = 0; i < 8; i++) { let x = Math.random() * sum, k = 0; while (x > wt[k]) { x -= wt[k]; k++; } const t = ts[Math.min(k, ts.length - 1)]; items.push({ gen: pick(POOL[t]), t }); }
  runQuiz({ env: 'home', color: '#be123c', buddy: 'magic_wand', items, finish: (first, n) => {
    MODE = 'menu'; coins(first * 2, true); sfx.win(); if (first >= 6) confetti(80);
    stage('small', 'home', [actor('polina', 42, 3, 62, 'hop')]);
    app.innerHTML = `<div class="stagehit"></div><div class="result"><h1>${first >= 7 ? 'Zauberhaft!' : first >= 5 ? 'Gut gezaubert!' : 'Weiter üben!'}</h1><p>${first} von ${n} gleich richtig. +${first * 2} 🪙</p><div class="btns"><button class="btn" style="background:#be123c" onclick="G.weak()">Nochmal zaubern</button><button class="btn sec" onclick="G.weakMenu()">Meine Stärken ansehen</button><button class="btn sec" onclick="G.home()">Startseite</button></div></div>`;
  } });
}

/* ===================== BLITZ ===================== */
let BZ = null;
const BLITZ = [[genVorNach, 'wald'], [genNachbarWahl(1000), 'wald'], [genNachbarWahl(10000), 'wald'], [genRunden(1000), 'eis'], [genRunden(10000), 'eis'], [genLeoRundet(10000), 'eis'], [genRD('cm'), 'ozean'], [genKreisSatz, 'ozean'], [genKreisTeil, 'ozean'], [genZirkel, 'ozean'], [genPaare(1), 'dschungel'], [genAussage, 'dschungel'], [genZweiLinien(0), 'berge'], [genOrdnen, 'wald'], [genLineStep('A'), 'savanne']];
function blitzIntro() {
  MODE = 'menu'; stage('home', 'savanne', [actor('polina', 36, 3, 42), actor('high_voltage', 58, 10, 34, 'pulse')]);
  app.innerHTML = `<div class="stagehit">${backBtn('G.home()')}<h1 class="title">⚡ Blitz-Runde</h1></div><div class="panel"><h2>90 Sekunden. So viele Aufgaben wie möglich!</h2><p class="hint">Jede richtige Antwort gibt einen Punkt und eine Münze. Dein Rekord: <b>${S.blitz}</b></p><button class="btn" style="background:#ea580c" onclick="G.blitz()">Auf die Plätze … los!</button></div>`;
}
function blitz() {
  MODE = 'blitz'; BZ = { left: 90, score: 0, n: 0, lock: false };
  stage('small', 'savanne', [actor('polina', 40, 3, 62, 'hop'), actor('high_voltage', 60, 6, 50, 'pulse')]);
  app.innerHTML = `<div class="stagehit"></div><div class="quiz"><div class="topbar">${backBtn('G.quit()', '✕')}<div class="track"><div class="fill" id="tfill" style="width:100%;background:#ea580c"></div></div><span class="streak on" id="bscore">⚡ 0</span></div><div class="card" id="bcard"></div></div>`;
  BZ.timer = setInterval(() => { BZ.left--; const f = $('#tfill'); if (f) f.style.width = BZ.left / 90 * 100 + '%'; if (BZ.left <= 10 && BZ.left > 0) tone([880], 0.05, 'square', 0.04); if (BZ.left <= 0) blitzEnd(); }, 1000);
  blitzNext();
}
function blitzNext() {
  if (!BZ) return; BZ.lock = false; const [g, t] = pick(BLITZ), q = g(); BZ.t = t;
  $('#bcard').innerHTML = qHTML(q) + (q.type === 'choice' ? '' : checkBtn('#ea580c'));
  qMount(q, on => { if (q.type === 'choice') { if (on) blitzCheck(); } else enableCheck(on); });
}
function blitzCheck() {
  if (!BZ || BZ.lock) return; const r = qCheck(); if (!r) return; BZ.lock = true; BZ.n++; record(BZ.t, r.ok);
  if (r.ok) { BZ.score++; sfx.ok(); W3.celebrate(40); $('#bscore').textContent = '⚡ ' + BZ.score; } else sfx.bad();
  const b = $('#check'); if (b) b.disabled = true;
  setTimeout(blitzNext, r.ok ? 350 : 1500);
}
function blitzEnd() {
  clearInterval(BZ.timer); const sc = BZ.score, n = BZ.n, rec = sc > S.blitz; if (rec) S.blitz = sc; BZ = null; MODE = 'menu'; coins(sc, true); sfx.win(); if (rec) confetti(120);
  stage('small', 'savanne', [actor('polina', 42, 3, 62, 'hop')]);
  app.innerHTML = `<div class="stagehit"></div><div class="result"><h1>${rec ? 'Neuer Rekord!' : 'Zeit ist um!'}</h1><div class="bigstars">⚡ ${sc}</div><p>${sc} von ${n} Aufgaben richtig. +${sc} 🪙 · Rekord: ${S.blitz}</p><div class="btns"><button class="btn" style="background:#ea580c" onclick="G.blitz()">Nochmal!</button><button class="btn sec" onclick="G.home()">Startseite</button></div></div>`;
}

/* ===================== KLASSENARBEIT ===================== */
let EX = null;
const EXAM = () => [[pick([genWort, genStellen, genSumme]), 'wald'], [genNachbarDoppel, 'wald'], [genNachbar(10000, true), 'wald'], [genLineRead('A'), 'savanne'], [genLinePlace('A'), 'savanne'], [genOrdnen, 'wald'], [genRunden(1000), 'eis'], [genRunden(10000), 'eis'], [genLeoRundet(100000), 'eis'], [genRaetsel, 'wald'], [genStadtplan, 'berge'], [genPgramm, 'berge'], [genKreisTeil, 'ozean'], [genZirkel, 'ozean'], [genPaare(2), 'dschungel'], [genWelches(2), 'dschungel'], [genLeoKreis, 'ozean'], [genBegruendung, 'ozean']];
function examIntro() {
  MODE = 'menu'; stage('home', 'berge', [actor('polina', 36, 3, 42), actor('memo', 58, 8, 34, 'sway')]);
  app.innerHTML = `<div class="stagehit">${backBtn('G.home()')}<h1 class="title">📝 Klassenarbeit</h1></div><div class="panel"><h2>Probe-Klassenarbeit mit 18 Aufgaben</h2><p class="hint">Wie in der Schule: Du siehst erst am Ende, was richtig war – und bekommst eine Note. ${S.exam ? `Deine beste Note bisher: <b>${S.exam}</b>` : ''}</p><button class="btn" style="background:#0f766e" onclick="G.exam()">Klassenarbeit beginnen</button></div>`;
}
function exam() { MODE = 'exam'; EX = { items: EXAM().map(([g, t]) => ({ q: g(), t })), i: 0, ok: 0, wrong: [] }; stage('small', 'berge', [actor('polina', 40, 3, 62), actor('memo', 60, 6, 48)]); examRender(); }
function examRender() {
  const it = EX.items[EX.i], n = EX.items.length;
  app.innerHTML = `<div class="stagehit"></div><div class="quiz"><div class="topbar">${backBtn('G.quit()', '✕')}<div class="track"><div class="fill" style="width:${EX.i / n * 100}%;background:#0f766e"></div></div><span class="streak on">${EX.i + 1}/${n}</span></div>
    <div class="card"><div class="badge">Aufgabe ${EX.i + 1}</div>${qHTML(it.q)}${checkBtn('#0f766e', EX.i + 1 < n ? 'Antwort abgeben →' : 'Abgeben 🏁')}</div></div>`;
  qMount(it.q, enableCheck); window.scrollTo(0, 0);
}
function examCheck() {
  const r = qCheck(true); if (!r) return; const it = EX.items[EX.i]; record(it.t, r.ok); sfx.tap();
  if (r.ok) EX.ok++; else EX.wrong.push({ q: it.q, sol: r.sol, n: EX.i + 1 });
  EX.i++; if (EX.i < EX.items.length) return examRender();
  const n = EX.items.length, p = EX.ok / n, note = p >= 0.95 ? 1 : p >= 0.8 ? 2 : p >= 0.6 ? 3 : p >= 0.45 ? 4 : p >= 0.15 ? 5 : 6;
  if (!S.exam || note < S.exam) S.exam = note; MODE = 'menu'; const c = (7 - note) * 5; coins(c, true); sfx.win(); if (note <= 2) confetti(120);
  stage('small', 'berge', [actor('polina', 42, 3, 62, note <= 2 ? 'hop' : '')]);
  app.innerHTML = `<div class="stagehit"></div><div class="result"><h1>Note ${note}</h1><div class="bigstars">${EX.ok} / ${n} Punkte</div><p>${['', 'Sehr gut! Fantastisch! 🏆', 'Gut gemacht! 👏', 'Befriedigend – das wird noch besser!', 'Ausreichend – übe mit dem Schwächen-Zauber!', 'Das üben wir nochmal zusammen.', 'Das üben wir nochmal zusammen.'][note]} +${c} 🪙</p>
    <div class="btns"><button class="btn" style="background:#0f766e" onclick="G.exam()">Neue Klassenarbeit</button><button class="btn sec" onclick="G.weak()">Schwächen-Zauber</button><button class="btn sec" onclick="G.home()">Startseite</button></div></div>
    ${EX.wrong.length ? `<div class="review"><h2>Das schauen wir uns nochmal an:</h2>${EX.wrong.map(w => `<div class="card"><div class="badge">Aufgabe ${w.n}</div><div class="prompt">${w.q.q}</div>${w.q.visual ? `<div class="visual">${w.q.visual}</div>` : ''}<div class="fb bad">${w.sol}${w.q.explain}</div></div>`).join('')}</div>` : ''}`;
  EX = null; window.scrollTo(0, 0);
}

/* ===================== MEINE WELT (Sticker) ===================== */
const STICKERS = [['fox', 0], ['butterfly', 5], ['tulip', 5], ['sunflower', 5], ['mushroom', 5], ['cloud', 5], ['sun', 8], ['deciduous_tree', 8], ['evergreen_tree', 8], ['palm_tree', 8], ['cherry_blossom', 8], ['lady_beetle', 8], ['honeybee', 8], ['snail', 8], ['hatching_chick', 10], ['rabbit', 10], ['hamster', 10], ['mouse', 10], ['frog', 10], ['duck', 10], ['cat', 12], ['dog', 12], ['hedgehog', 12], ['chipmunk', 12], ['owl', 12], ['penguin', 12], ['koala', 12], ['panda', 15], ['otter', 15], ['seal', 15], ['sloth', 15], ['llama', 15], ['deer', 15], ['flamingo', 15], ['swan', 15], ['parrot', 15], ['peacock', 18], ['turtle', 15], ['tropical_fish', 12], ['dolphin', 18], ['whale', 18], ['octopus', 15], ['crab', 10], ['shark', 18], ['monkey', 15], ['tiger', 18], ['lion', 18], ['leopard', 18], ['giraffe', 18], ['zebra', 18], ['elephant', 18], ['kangaroo', 18], ['polar_bear', 18], ['horse', 18], ['raccoon', 15], ['house', 20], ['tent', 15], ['camping', 20], ['sailboat', 20], ['balloon', 10], ['wrapped_gift', 10], ['birthday_cake', 12], ['cupcake', 8], ['soft_ice_cream', 8], ['lollipop', 8], ['strawberry', 6], ['watermelon', 6], ['teddy_bear', 15], ['ribbon', 8], ['red_heart', 8], ['star', 10], ['glowing_star', 12], ['crescent_moon', 12], ['shooting_star', 15], ['ringed_planet', 20], ['rocket', 25], ['snowman', 15], ['rainbow', 25], ['crown', 25], ['carousel_horse', 30], ['ferris_wheel', 35], ['castle', 40], ['unicorn', 40], ['dragon', 45]];
let MY = null;
function myWorld() {
  MODE = 'my'; MY = { sel: null, drag: false }; S.own.fox = 1;
  const envs = ['home', ...CHAPTERS.filter(c => S.done[c.id]).map(c => c.id)]; if (!envs.includes(S.my.env)) S.my.env = 'home';
  myStage();
  app.innerHTML = `<div class="stagehit my" id="myhit">${backBtn('G.home()')}${hud()}<div class="mytools" id="mytools"></div></div>
  <div class="panel"><div class="envs">${Object.keys(ENVCSS).map(e => { const o = envs.includes(e); return `<button class="${S.my.env === e ? 'sel' : ''} ${o ? '' : 'locked'}" style="--a:${ENVCSS[e][0]};--b:${ENVCSS[e][1]}" onclick="${o ? `G.myEnv('${e}')` : `G.say('Diese Welt bekommst du, wenn du das Kapitel in der Geschichte schaffst!')`}">${o ? '' : '🔒'}</button>`; }).join('')}</div>
    <p class="hint">Tippe auf einen Sticker, um ihn zu kaufen oder in deine Welt zu setzen. Ziehe ihn dann mit dem Finger an seinen Platz.</p>
    <div class="shop">${[[S.hero, 0], ...STICKERS].map(([f, p]) => `<button class="${S.own[f] || p === 0 ? 'own' : ''}" data-s="${f}" onclick="G.sticker('${f}',${p})"><img src="${eimg(f)}" loading="lazy" alt=""><span>${S.own[f] || p === 0 ? '＋' : '🪙 ' + p}</span></button>`).join('')}</div></div>`;
  const hit = $('#myhit');
  hit.addEventListener('pointerdown', e => { if (e.target.closest('button')) return; const p = W3.pick(e.clientX, e.clientY); let best = null, bd = 14; S.my.items.forEach(it => { const d = Math.hypot(it.x - p.x, (it.y + it.s * 0.5 - p.y) * 0.8); if (d < bd) { bd = d; best = it; } }); MY.sel = best ? best.id : null; MY.drag = !!best; if (best) { MY.dx = best.x - p.x; MY.dy = best.y - p.y; hit.setPointerCapture(e.pointerId); } W3.talk(MY.sel); myTools(); });
  hit.addEventListener('pointermove', e => { if (!MY || !MY.drag) return; const p = W3.pick(e.clientX, e.clientY), it = S.my.items.find(q => q.id === MY.sel); if (!it) return; it.x = Math.max(0, Math.min(100, p.x + MY.dx)); it.y = Math.max(0, Math.min(80, p.y + MY.dy)); W3.moveActor(it.id, it.x, it.y); });
  hit.addEventListener('pointerup', () => { if (MY && MY.drag) { MY.drag = false; save(); } });
  myTools(); window.scrollTo(0, 0);
}
function myStage() { stage('full', S.my.env, S.my.items.map(it => ({ id: it.id, img: eimg(it.k), x: it.x, y: it.y, size: it.s, flip: it.f })), true); }
function myTools() { const el = $('#mytools'); if (!el) return; el.innerHTML = MY.sel ? `<button onclick="G.myEdit('big')">＋</button><button onclick="G.myEdit('small')">－</button><button onclick="G.myEdit('flip')">↔</button><button onclick="G.myEdit('del')">🗑</button>` : (S.my.items.length ? '<span>Tippe einen Sticker an</span>' : '<span>Deine Welt ist noch leer – such dir unten Sticker aus!</span>'); }
function myEdit(a) {
  const it = S.my.items.find(q => q.id === MY.sel); if (!it) return;
  if (a === 'big') it.s = Math.min(90, it.s * 1.2); if (a === 'small') it.s = Math.max(8, it.s / 1.2); if (a === 'flip') it.f = !it.f;
  if (a === 'del') { S.my.items = S.my.items.filter(q => q !== it); MY.sel = null; save(); myStage(); myTools(); return; }
  W3.sizeActor(it.id, it.s, it.f); sfx.tap(); save();
}
function myEnv(e) { S.my.env = e; save(); myWorld(); }
function sticker(f, price) {
  if (!S.own[f] && price > 0) {
    if (S.coins < price) { sfx.bad(); return say(`Dafür brauchst du ${price} Münzen. Löse Aufgaben, um Münzen zu verdienen!`); }
    S.coins -= price; S.own[f] = 1; save(); sfx.win(); confetti(25); const b = document.querySelector(`.shop [data-s="${f}"]`); if (b) { b.classList.add('own'); b.querySelector('span').textContent = '＋'; } $('#coinct').textContent = S.coins;
  }
  if (S.my.items.length >= 40) return say('Deine Welt ist voll! Lösche erst einen Sticker.');
  const it = { id: 's' + Date.now(), k: f, x: 20 + Math.random() * 60, y: 3, s: 30, f: false }; S.my.items.push(it); MY.sel = it.id; save(); myStage(); W3.talk(it.id); W3.celebrate(); myTools(); sfx.ok(); window.scrollTo({ top: 0, behavior: 'smooth' });
}
function say(t) { toast(t); speak(t); }

/* ===================== Steuerung ===================== */
function check() { if (MODE === 'story') sCheck(); else if (MODE === 'quiz') quizCheck(); else if (MODE === 'blitz') blitzCheck(); else if (MODE === 'exam') examCheck(); }
function toggle(k, inScene) { S[k] = !S[k]; save(); if (k === 'voice' && !S.voice && window.speechSynthesis) speechSynthesis.cancel(); if (inScene) { event.target.textContent = S.voice ? '🗣️' : '🤐'; } else home(); }
document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT') return;
  if (MODE === 'story' && ST && ST.phase === 'talk' && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); return sNext(); }
  if (!CUR || !['story', 'quiz', 'blitz', 'exam'].includes(MODE)) return;
  if (e.key === 'Enter') { const b = $('#check'); if (b && !b.disabled) { e.preventDefault(); b.click(); } return; }
  const q = CUR.q;
  if (q.type === 'fields') { if (/^\d$/.test(e.key)) key(e.key); else if (e.key === 'Backspace') key('del'); else if (e.key === 'Tab') { e.preventDefault(); key('next'); } }
  else if (q.type === 'choice' && /^[1-4]$/.test(e.key) && +e.key <= q.options.length) choose(+e.key - 1);
  else if (q.type === 'line') { if (e.key === 'ArrowLeft') nudge(-1); if (e.key === 'ArrowRight') nudge(1); }
});
const G = { home, chooseHero, pickHero, heroDone, storyMenu, playChapter, playScene, sNext, chapterDone, trainMenu, world, train, album, weakMenu, weak, blitzIntro, blitz, examIntro, exam, myWorld, myEnv, myEdit, sticker, say, choose, focus, key, nudge, check, quit, toggle };
window.G = G;

/* Start */
if (!W3.init($('#gl'))) document.body.classList.add('nogl');
(() => { // Tagesbonus
  const d = new Date(), today = d.toDateString(), y = new Date(d - 864e5).toDateString();
  if (S.last !== today) { S.days = S.last === y ? S.days + 1 : 1; S.last = today; const bonus = Math.min(S.days, 5) * 3; if (S.hero) { S.coins += bonus; setTimeout(() => toast(`🎁 Tagesbonus: +${bonus} 🪙${S.days > 1 ? ` · ${S.days} Tage in Folge!` : ''}`), 800); } save(); }
})();
home();
