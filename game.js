'use strict';
/* ===================== Speicher ===================== */
const KEY = 'mathe-abenteuer-v2';
const S = (() => {
  const d = { name: '', hero: '', stars: {}, sound: true, voice: true, coins: 0, solved: 0, story: {}, sf: {}, done: {}, blitz: 0, exam: 0, tp: {}, sel: null, own: {}, my: { env: 'home', items: [] }, last: '', days: 0 };
  try { return Object.assign(d, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { return d; }
})();
/* Der Spielstand liegt im localStorage und zur Sicherheit als Kopie im Cache-Speicher (wird beim Start zurückgeholt, falls der localStorage leer ist) */
const MIRROR = 'mathe-abenteuer-save';
const mirror = json => { try { if (window.caches) caches.open(MIRROR).then(c => json == null ? c.delete('save') : c.put('save', new Response(json, { headers: { 'content-type': 'application/json' } }))).catch(() => {}); } catch (e) { /* egal */ } };
const save = () => { try { const j = JSON.stringify(S); localStorage.setItem(KEY, j); if (S.hero) mirror(j); } catch (e) { /* egal */ } };
const HAD_SAVE = (() => { try { return !!localStorage.getItem(KEY); } catch (e) { return true; } })();
const $ = s => document.querySelector(s);
const app = $('#app');
const eimg = f => `img/e/${f}.png`;
const photo = id => `img/${id}.jpg`;
const TOPIC = { wald: 'Nachbarzahlen', savanne: 'Zahlenstrahl', eis: 'Runden', ozean: 'Kreis', dschungel: 'Vierecke', berge: 'Parallel & senkrecht', insel: 'Gemischt',
  markt: 'Plus & Minus schriftlich', wiese: 'Multiplizieren', piraten: 'Dividieren', zucker: 'Größen', schloss: 'Umfang & Fläche', wueste: 'Körper & Symmetrie', jahrmarkt: 'Daten & Zufall', sterne: 'Rechenregeln & Knobeln' };
const ENVCSS = { home: ['#1e6fd9', '#57b947'], wald: ['#14532d', '#3f8f3f'], savanne: ['#c2570c', '#e0a030'], eis: ['#1c6fb5', '#8fd0ff'], ozean: ['#0b4f8a', '#1aa3c4'], dschungel: ['#166534', '#52a52e'], berge: ['#3b5fc0', '#6fb86a'], insel: ['#0e8fb8', '#e8c96a'],
  markt: ['#b45309', '#f2b05e'], wiese: ['#2f9e44', '#d9c13a'], piraten: ['#0b6e8a', '#d8b46a'], zucker: ['#d6336c', '#f7a8c4'], schloss: ['#6d3fc4', '#7fc87a'], wueste: ['#d9730d', '#f0c66e'], jahrmarkt: ['#3b1d8f', '#e0457b'], sterne: ['#0b1445', '#4b3fb5'] };
const BUDDIES = { wald: ['nelli', 'iggi', 'eule'], savanne: ['gina', 'zora', 'leo'], eis: ['pia', 'robbi', 'bruno'], ozean: ['coco', 'tilda', 'dana'], dschungel: ['mimi', 'pedro', 'tara'], berge: ['alma', 'zick', 'luna'], insel: ['wirbel', 'kiki', 'kalle'],
  markt: ['hanni', 'rosa', 'kiko'], wiese: ['summi', 'mari', 'hoppel'], piraten: ['zwick', 'olli', 'kroko'], zucker: ['kruemel', 'bao', 'brummi'], schloss: ['quaki', 'sina', 'luma'], wueste: ['karim', 'flatter', 'jasmin'], jahrmarkt: ['bello', 'dotti', 'zampano'], sterne: ['zorp', 'eule', 'wirbel'] };
/* Aufgaben einer Welt: entweder ein Generator oder [Generator, Thema] (in den Meister-Welten) */
const POOL = {}; WORLDS.forEach(w => { POOL[w.id] = [...new Set(w.levels.flat().filter(g => !Array.isArray(g)))]; });
const partOf = x => x.part || 0;
const CARDS = WORLDS.length * 3;
/* Themen-Auswahl für Klassenarbeit, Blitz-Runde und Schwächen-Zauber */
const TOPICS = WORLDS.filter(w => w.id !== 'insel');
const selT = () => { const s = TOPICS.map(w => w.id).filter(t => (S.sel || []).includes(t)); return s.length ? s : TOPICS.filter(w => !partOf(w)).map(w => w.id); };
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
/* Name und Form (Mädchen/Junge) des gewählten Helden in Texte einsetzen */
const BOYS = ['boy', 'prince', 'man_superhero', 'man_astronaut'];
const isBoy = () => BOYS.includes(S.hero);
const meister = () => isBoy() ? 'ein echter Zahlenmeister' : 'eine echte Zahlenmeisterin';
const T = t => t.replace(/\{name\}/g, S.name || 'Polina').replace(/\{Sie\}/g, isBoy() ? 'Er' : 'Sie').replace(/\{meisterin\}/g, meister());
const starStr = (n, max = 3) => '<span class="stars">' + '★'.repeat(n) + '<span class="off">' + '★'.repeat(max - n) + '</span></span>';
const starsOf = (w, l) => S.stars[w + '-' + l] || 0;
const cardCount = () => Object.values(S.stars).filter(x => x > 0).length;
const cardsIn = p => Object.keys(S.stars).filter(k => S.stars[k] > 0 && WORLDS[+k.split('-')[0]] && partOf(WORLDS[+k.split('-')[0]]) === p).length;
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
const hud = () => `<div class="hud"><span>🪙 <b id="coinct">${S.coins}</b></span><span style="pointer-events:auto;cursor:pointer" onclick="event.stopPropagation();G.gemInfo()">💎 ${gemCount()}/${CHAPTERS.length}</span>${S.feather ? `<span>🪶 ${S.feather}</span>` : ''}${S.days > 1 ? `<span>🔥 ${S.days} Tage</span>` : ''}</div>`;
const backBtn = (fn, label = '← Zurück') => `<button class="back" onclick="event.stopPropagation();${fn}">${label}</button>`;

/* ===================== Aufgaben-Baustein ===================== */
let CUR = null;
const keysHTML = multi => `<div class="keys">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(d => `<button onclick="G.key('${d}')">${d}</button>`).join('')}<button class="del" onclick="G.key('del')">⌫</button>${multi ? '<button class="nxt" onclick="G.key(\'next\')">→</button>' : ''}</div>`;
function qHTML(q) {
  let body = '';
  if (q.type === 'choice') body = `<div class="opts ${q.grid ? 'grid' : ''} ${q.two ? 'two' : ''} ${q.long || q.options.length === 3 ? 'long' : ''}">${q.options.map((o, i) => `<button class="opt" data-i="${i}" onclick="G.choose(${i})">${o}</button>`).join('')}</div>`;
  else if (q.type === 'fields') { let k = 0; const n = q.parts.filter(p => typeof p === 'object').length; body = `<div class="fields ${n > 2 ? 'many' : ''}">${q.parts.map(p => typeof p === 'object' ? `<button class="field" data-f="${k}" onclick="G.focus(${k++})"></button>` : `<span>${p}</span>`).join('')}</div>${keysHTML(n > 1)}`; }
  else if (q.type === 'col') body = `<div class="colwrap">${colHTML(q.col, true)}</div>${keysHTML(q.col.rows.length > 1)}`;
  else if (q.type === 'cells') body = '<div id="icells" class="inter"></div>';
  else if (q.type === 'line') body = '<div id="iline" class="inter"></div><div class="nudge"><button onclick="G.nudge(-1)">◀</button><span>Tippe auf einen Strich</span><button onclick="G.nudge(1)">▶</button></div>';
  else if (q.type === 'grid') body = '<div id="igrid" class="inter"></div>';
  return `<div class="prompt">${q.q}</div>${q.visual ? `<div class="visual">${q.visual}</div>` : ''}${body}`;
}
function qMount(q, onReady) {
  CUR = { q, sel: null, fields: null, active: 0, done: false, t0: Date.now(), onReady: onReady || (() => {}) };
  if (q.type === 'fields') { CUR.fields = q.parts.filter(p => typeof p === 'object').map(() => ''); drawFields(); }
  if (q.type === 'line') { drawLine(); $('#iline').addEventListener('pointerdown', e => { if (CUR.done) return; const r = $('#iline svg').getBoundingClientRect(), n = q.line.majors * q.line.sub, x = (e.clientX - r.left) / r.width * 1000; CUR.sel = Math.max(0, Math.min(n, Math.round((x - 55) / 890 * n))); sfx.tap(); drawLine(); }); }
  if (q.type === 'col') { CUR.cells = q.col.rows.map(r => Array(r.n).fill('')); CUR.pos = [0, q.col.rows[0].n - 1]; drawCol(); }
  if (q.type === 'cells') { CUR.sel = []; drawCells(); $('#icells').addEventListener('pointerdown', e => { if (CUR.done) return; const m = q.mirror, r = $('#icells svg').getBoundingClientRect(), x = Math.floor(((e.clientX - r.left) / r.width * (m.W * 50 + 20) - 10) / 50), y = Math.floor(((e.clientY - r.top) / r.height * (m.H * 50 + 20) - 10) / 50); if (x < 0 || x >= m.W || y < 0 || y >= m.H || !(m.vert ? x >= m.W / 2 : y >= m.H / 2)) return; const i = CUR.sel.findIndex(c => c[0] === x && c[1] === y); if (i >= 0) CUR.sel.splice(i, 1); else CUR.sel.push([x, y]); sfx.tap(); drawCells(); }); }
  if (q.type === 'grid') { drawGrid(); $('#igrid').addEventListener('pointerdown', e => { if (CUR.done) return; const r = $('#igrid svg').getBoundingClientRect(), x = Math.round(((e.clientX - r.left) / r.width * 650 - 25) / 50), y = Math.round(((e.clientY - r.top) / r.height * 450 - 25) / 50), g = q.grid; if (x < 0 || x > 12 || y < 0 || y > 8 || [g.A, g.B, g.D].some(p => p[0] === x && p[1] === y)) return; CUR.sel = [x, y]; sfx.tap(); drawGrid(); }); }
}
const ready = on => CUR.onReady(on);
function choose(i) { if (!CUR || CUR.done) return; CUR.sel = i; sfx.tap(); document.querySelectorAll('.opt').forEach(b => b.classList.toggle('sel', +b.dataset.i === i)); ready(true); }
function drawFields() { document.querySelectorAll('.field').forEach(b => { const k = +b.dataset.f; b.textContent = CUR.fields[k] ? fmt(+CUR.fields[k]) : ''; b.classList.toggle('act', !CUR.done && k === CUR.active); }); ready(CUR.fields.every(f => f !== '')); }
function focus(k) { if (CUR.done) return; CUR.active = k; drawFields(); }
function drawCol() { const [pr, pk] = CUR.pos; document.querySelectorAll('.cc').forEach(b => { const r = +b.dataset.r, k = +b.dataset.k; b.textContent = CUR.cells[r][k]; b.classList.toggle('act', !CUR.done && r === pr && k === pk); }); ready(CUR.cells.every(row => row[row.length - 1] !== '')); }
function colFocus(r, k) { if (!CUR || CUR.done || !CUR.cells) return; CUR.pos = [r, k]; sfx.tap(); drawCol(); }
/* schriftliches Rechnen: Ziffer eintragen, dann springt das Kästchen nach links */
function colKey(k) {
  const [r, i] = CUR.pos, row = CUR.cells[r];
  if (k === 'del') { if (row[i] !== '') row[i] = ''; else if (i < row.length - 1) { row[i + 1] = ''; CUR.pos = [r, i + 1]; } }
  else if (k === 'next') { const nr = (r + 1) % CUR.cells.length, nrow = CUR.cells[nr]; let j = nrow.length - 1; while (j > 0 && nrow[j] !== '') j--; CUR.pos = [nr, j]; }
  else { row[i] = k; if (i > 0) CUR.pos = [r, i - 1]; }
  sfx.tap(); drawCol();
}
function drawCells(reveal) { $('#icells').innerHTML = spiegelSVG(CUR.q.mirror, CUR.sel, reveal); if (!reveal) ready(CUR.sel.length > 0); }
function key(k) {
  if (CUR && !CUR.done && CUR.cells) return colKey(k);
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
  else if (q.type === 'col') {
    if (CUR.cells.some(row => row[row.length - 1] === '')) return null;
    const res = q.col.rows.map((r, i) => { const t = CUR.cells[i].map(c => c || ' ').join(''); return /^ *\d+$/.test(t) && +t === r.ans; }); ok = res.every(Boolean);
    if (!silent) document.querySelectorAll('.cc').forEach(b => { b.classList.remove('act'); b.classList.add(res[+b.dataset.r] ? 'right' : 'wrong'); });
    sol = `<p class="sol">Richtig ist: <b>${fmt(q.col.rows[q.col.rows.length - 1].ans)}</b></p>`;
  } else if (q.type === 'cells') {
    if (!CUR.sel.length) return null; const a = new Set(q.mirror.ans.map(c => c.join(','))); ok = CUR.sel.length === a.size && CUR.sel.every(c => a.has(c.join(',')));
    if (!silent) drawCells(true);
  }
  CUR.done = true; document.querySelectorAll('.keys button,.nudge button,.opt,.cc').forEach(b => { b.disabled = true; });
  return { ok, sol };
}
const PRAISE = ['Richtig! 🎉', 'Super! ⭐', 'Genau! 👏', 'Klasse gemacht! 💪', 'Perfekt! 🌟', 'Stark! 🚀', 'Wow! 🤩'];
const checkBtn = (color, label = 'Prüfen') => `<button id="check" class="btn" style="background:${color}" disabled onclick="G.check()">${label}</button><div id="fb"></div>`;
const enableCheck = on => { THINK.ready = on; const b = $('#check'); if (b) b.disabled = !on || Date.now() < THINK.until; };

/* ===================== Eulen-Pause: hilft, wenn geraten statt gerechnet wird ===================== */
/* Mehrere falsche Antworten hintereinander (schnelle zählen stärker) → Frau Eule bittet zur Denkpause:
   Merkzettel zum Thema, einmal durchatmen, danach „Erst denken“-Sekunden vor dem Prüfen und eine Eulenfeder für die nächste richtige Antwort. */
const THINK = { score: 0, slow: false, until: 0, ready: false, iv: null };
function guessNote(ok) {
  if (ok) { THINK.score = 0; return false; }
  const ms = Date.now() - CUR.t0, fast = ms < (CUR.q.type === 'choice' ? 4000 : 3000);
  THINK.score += fast ? 1.5 : 1; if (THINK.score < 2.5) return false; THINK.score = 0; return true;
}
function thinkBreak(topic, then) {
  const w = WORLDS.find(x => x.id === topic) || WORLDS[0], line = pick(['Schuhu! Halt, nicht raten – zusammen kriegen wir das hin.', 'Schuhu! Schnell tippen hilft hier nicht. Wir schauen uns das in Ruhe an.', 'Schuhu! Auch Meisterinnen machen mal Pause. Lies erst meinen Merkzettel.']);
  const d = document.createElement('div'); d.className = 'think'; d.id = 'think';
  d.innerHTML = `<div class="thinkbox"><div class="thinktop"><img src="${eimg('owl')}" alt=""><div><h2>Eulen-Pause</h2><p>${line}</p></div></div>
    <div class="rule"><b>📜 Merkzettel: ${TOPIC[w.id] || w.topic}</b><br>${w.rule}</div>
    <div class="breath"><i></i><span id="breathtxt">Atme mit dem Stern ein …</span></div>
    <p class="hint">🪶 Für die nächste richtige Antwort schenkt dir Frau Eule eine <b>Eulenfeder</b> und 2 Münzen extra.</p>
    <button class="btn" id="thinkgo" style="background:#7c3aed" disabled>Gleich geht es weiter …</button></div>`;
  document.body.appendChild(d); sfx.page(); speak(line + ' ' + w.rule.replace(/<[^>]+>/g, ' '), 'eule');
  let k = 0; const words = ['Atme mit dem Stern ein …', '… und langsam wieder aus.', 'Noch einmal ein …', '… und aus. Jetzt bist du bereit!'];
  const iv = setInterval(() => { k++; const t = $('#breathtxt'); if (!t) return clearInterval(iv); if (k < 4) t.textContent = words[k]; else { clearInterval(iv); const b = $('#thinkgo'); b.disabled = false; b.textContent = 'Ich denke jetzt nach 💪'; b.onclick = () => { d.remove(); if (window.speechSynthesis) speechSynthesis.cancel(); THINK.slow = true; then(); }; } }, 2000);
}
/* nach der Pause: ein paar Sekunden „erst denken“, bevor man prüfen kann */
function thinkDelay() {
  clearInterval(THINK.iv); const b = $('#check'); if (!THINK.slow || !b) { THINK.until = 0; return; }
  const label = b.textContent; let n = 6; THINK.until = Date.now() + n * 1000; b.disabled = true; b.textContent = `🦉 Erst denken … ${n}`;
  THINK.iv = setInterval(() => { const c = $('#check'); n--; if (!c || c !== b) { clearInterval(THINK.iv); THINK.until = 0; return; } if (n > 0) { b.textContent = `🦉 Erst denken … ${n}`; return; } clearInterval(THINK.iv); THINK.until = 0; b.textContent = label; b.disabled = !THINK.ready || (CUR && CUR.done); }, 1000);
}
/* richtige Antwort nach der Pause → Eulenfeder */
function thinkReward() { if (!THINK.slow) return ''; THINK.slow = false; S.feather = (S.feather || 0) + 1; coins(2, true); save(); return `<p class="feather">🪶 Eulenfeder Nr. ${S.feather}! Nachdenken lohnt sich. +2 🪙</p>`; }

/* ===================== Start: Heldin wählen ===================== */
function chooseHero() {
  MODE = 'hero'; stage('home', 'home', [actor('finn', 50, 3, 40, 'hop')]);
  app.innerHTML = `<div class="stagehit"><h1 class="title">Willkommen im Zahlenland!</h1></div>
  <div class="panel"><h2>Wer möchtest du sein?</h2>
    <div class="heroes">${HEROES.map(h => `<button class="hero ${S.hero === h[0] ? 'sel' : ''}" data-h="${h[0]}" onclick="G.pickHero('${h[0]}')"><img src="${eimg(h[0])}" alt=""><span>${h[1]}</span></button>`).join('')}</div>
    <label class="namel">Dein Name: <input id="hname" maxlength="14" placeholder="Wie heißt du?" value="${S.name}"></label>
    <button class="btn" id="herogo" style="background:#e11d74" ${S.hero ? '' : 'disabled'} onclick="G.heroDone()">Abenteuer starten! 🚀</button>
  </div>`;
}
function pickHero(h) { S.hero = h; sfx.ok(); document.querySelectorAll('.hero').forEach(b => b.classList.toggle('sel', b.dataset.h === h)); $('#herogo').disabled = false; W3.setActors([actor('polina', 38, 3, 46, 'hop'), actor('finn', 62, 3, 36, 'hop')]); W3.celebrate(); }
function heroDone() { S.name = ($('#hname').value.trim() || (HEROES.find(h => h[0] === S.hero) || ['', 'Polina'])[1]).slice(0, 14); save(); confetti(60); sfx.win(); home(); }

/* ===================== Startseite ===================== */
function home() {
  stopTimer(); MODE = 'home'; if (window.speechSynthesis) speechSynthesis.cancel();
  if (!S.hero) return chooseHero();
  const gems = CHAPTERS.map((c, i) => S.done[c.id] ? Object.assign(actor('gem', 8 + i * 6, 66 + (i % 2) * 7, 9, 'float', 'g' + i), { hue: c.hue }) : null).filter(Boolean);
  stage('home', 'home', [actor('polina', 36, 3, 44), actor('finn', 58, 3, 32, 'hop'), ...gems]);
  const ci = CHAPTERS.findIndex(c => !S.done[c.id]), ch = CHAPTERS[ci < 0 ? 0 : ci], allDone = ci < 0;
  const weak = selT().filter(t => S.tp[t] && S.tp[t].n >= 3).sort((a, b) => S.tp[a].ok / S.tp[a].n - S.tp[b].ok / S.tp[b].n)[0];
  app.innerHTML = `<div class="stagehit"><h1 class="title" id="hometitle" style="pointer-events:auto;-webkit-touch-callout:none">${S.name}s Mathe-Abenteuer</h1>${hud()}</div>
  <div class="menu">
    <button class="mode big" style="--a:${ENVCSS[ch.id][0]};--b:${ENVCSS[ch.id][1]}" onclick="G.storyMenu()">
      <img src="${eimg('books')}" alt=""><span><b>📖 Geschichte</b><small>${allDone ? 'Alle Kristalle und Sternsplitter gefunden! Nochmal ansehen?' : `Kapitel ${ci + 1}: ${ch.title} · Szene ${Math.min((S.story[ch.id] || 0) + 1, ch.scenes.length)} von ${ch.scenes.length}`}</small></span><i>▶</i></button>
    <button class="mode" style="--a:#7c3aed;--b:#c026d3" onclick="G.trainMenu()"><img src="${eimg('bullseye')}" alt=""><span><b>Training</b><small>Tierkarten gewinnen · ${cardCount()}/${CARDS}</small></span></button>
    <button class="mode" style="--a:#ea580c;--b:#facc15" onclick="G.blitzIntro()"><img src="${eimg('high_voltage')}" alt=""><span><b>Blitz-Runde</b><small>90 Sekunden · Rekord: ${S.blitz}</small></span></button>
    <button class="mode" style="--a:#0f766e;--b:#22c55e" onclick="G.examIntro()"><img src="${eimg('memo')}" alt=""><span><b>Klassenarbeit</b><small>${S.exam ? 'Beste Note: ' + S.exam + ' · Themen wählbar' : 'Probe wie in der Schule · Themen wählbar'}</small></span></button>
    <button class="mode" style="--a:#be123c;--b:#fb7185" onclick="G.weakMenu()"><img src="${eimg('magic_wand')}" alt=""><span><b>Schwächen-Zauber</b><small>${weak ? 'Übe: ' + TOPIC[weak] : 'Übt, was noch schwer ist'}</small></span></button>
    <button class="mode" style="--a:#0369a1;--b:#38bdf8" onclick="G.myWorld()"><img src="${eimg('castle')}" alt=""><span><b>Meine Welt</b><small>Sticker kaufen und 3D-Welt bauen</small></span></button>
    <button class="mode" style="--a:#a16207;--b:#fbbf24" onclick="G.album()"><img src="${eimg('trophy')}" alt=""><span><b>Tieralbum</b><small>${cardCount() ? cardCount() + ' von ' + CARDS + ' Karten' : 'Karten gewinnst du im Training'}</small></span></button>
  </div>
  <div class="foot"><button class="pill" onclick="G.toggle('sound')">${S.sound ? '🔊 Töne an' : '🔇 Töne aus'}</button><button class="pill" onclick="G.toggle('voice')">${S.voice ? '🗣️ Vorlesen an' : '🤐 Vorlesen aus'}</button><button class="pill" onclick="G.chooseHero()">🧑‍🎤 Figur ändern</button><span class="pill off" id="offst" style="display:${OFFLINE ? '' : 'none'}">✈️ Offline bereit</span><span class="pill ver">Version ${VERSION}</span></div>`;
  window.scrollTo(0, 0);
}

/* ===================== GESCHICHTE ===================== */
let ST = null;
const GEMINFO = 'Für jedes geschaffte Kapitel bekommst du einen Zahlenkristall (in Teil 2 einen Sternsplitter) und 20 🪙. Er öffnet das nächste Kapitel, eine neue 3D-Welt und ein neues Sticker-Paket in „Meine Welt“. Mit allen 7 Kristallen rettest du das Zahlenland – und mit allen 8 Sternsplittern leuchtet der Rechenstern wieder!';
const gemInfo = () => say(GEMINFO);
const chOpen = i => i === 0 || !!S.done[CHAPTERS[i - 1].id];
const gemImg = c => partOf(c) ? 'glowing_star' : 'gem_stone';
const chStars = c => { const n = c.scenes.filter(s => s.g).length, f = c.scenes.filter((s, i) => S.sf[c.id + '-' + i] === 1).length, r = f / n; return !S.done[c.id] ? 0 : r >= 0.95 ? 3 : r >= 0.7 ? 2 : 1; };
function storyMenu() {
  stopTimer(); MODE = 'menu'; if (window.speechSynthesis) speechSynthesis.cancel();
  stage('home', 'home', [actor('polina', 30, 3, 42), actor('finn', 46, 3, 30), actor('map', 68, 6, 34, 'pulse')]);
  const card = (c, i) => {
    const open = chOpen(i), n = c.scenes.length, u = S.done[c.id] ? n : Math.min(S.story[c.id] || 0, n);
    return `<button class="chapter ${open ? '' : 'locked'}" style="--a:${ENVCSS[c.id][0]};--b:${ENVCSS[c.id][1]}" onclick="${open ? `G.playChapter(${i})` : ''}">
      <img class="gemimg ${S.done[c.id] ? '' : 'off'}" style="filter:${partOf(c) ? '' : `hue-rotate(${c.hue - 200}deg)`}${S.done[c.id] ? '' : ' grayscale(1) brightness(.6)'}" src="${eimg(gemImg(c))}" alt="">
      <span><small>Kapitel ${i + 1} · ${c.sub}</small><b>${c.title}</b>
      <span class="bar"><i style="width:${u / n * 100}%"></i></span>
      <small>${open ? (S.done[c.id] ? 'Geschafft! ' + starStr(chStars(c)) : `Szene ${u + 1} von ${n}`) : '🔒 Schaffe erst Kapitel ' + i}</small></span></button>`;
  };
  app.innerHTML = `<div class="stagehit">${backBtn('G.home()')}<h1 class="title">Geschichte</h1></div>
  <p class="rule">💎 ${GEMINFO}</p>
  ${PARTS.map((P, p) => `<h2 class="parth">${P.title}<small>${p && !chOpen(CHAPTERS.findIndex(c => partOf(c) === p)) ? '🔒 Öffnet sich, wenn du Teil ' + p + ' geschafft hast. Üben kannst du die Themen schon jetzt im Training!' : P.sub}</small></h2><div class="chapters">${CHAPTERS.map((c, i) => partOf(c) === p ? card(c, i) : '').join('')}</div>`).join('')}`;
  window.scrollTo(0, 0);
}
function playChapter(ci) { const c = CHAPTERS[ci]; playScene(ci, S.done[c.id] ? 0 : Math.min(S.story[c.id] || 0, c.scenes.length - 1)); }
function parseActors(str, hue) { actor.hue = hue; return str.split(/\s+/).filter(Boolean).map(tokActor).filter(Boolean); }
function tokActor(tok) { const mm = tok.match(/^(\w+)@(\d+)(?:,(\d+))?(?:\*(\d+))?(?:!(\w+))?$/); return mm ? actor(mm[1], +mm[2], mm[3] == null ? (mm[1] === 'gem' ? 30 : 3) : +mm[3], mm[4] ? +mm[4] : 0, mm[5], mm[1]) : null; }
function stopTimer() { if (ST && ST.timer) { clearInterval(ST.timer); ST.timer = null; } }
function playScene(ci, si) {
  stopTimer();
  MODE = 'story'; const c = CHAPTERS[ci], sc = c.scenes[si], solved = S.done[c.id] ? c.scenes.length : (S.story[c.id] || 0);
  ST = { ci, si, line: -1, phase: 'talk', first: true, replay: si < solved, step: 0, gens: null, slow: false };
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
/* Regieanweisungen im Dialog: Zeilen, die mit * beginnen, lassen auf der Bühne etwas passieren
   *enter figur@x…  *exit figur  *move figur x [y]  *emote figur ❗  *jump [figur]  *anim figur hop  *shake  *flash [farbe]  *coins n Text  *sfx name */
function direct(cmd) {
  const [op, a, b, ...rest] = cmd.trim().split(/\s+/);
  if (op === 'enter') { const x = tokActor(a); if (x) { actor.hue = CHAPTERS[ST.ci].hue; W3.addActor(x); } }
  else if (op === 'exit') W3.exitActor(a);
  else if (op === 'move') W3.moveTo(a, +b, rest.length ? +rest[0] : null);
  else if (op === 'emote') W3.emote(a, b);
  else if (op === 'jump') W3.jump(a || null, 0.8);
  else if (op === 'anim') W3.setAnim(a, b);
  else if (op === 'shake') { W3.shake(0.8); tone([90, 70, 60], 0.12, 'sawtooth', 0.12); }
  else if (op === 'flash') W3.celebrate(a ? +a : null);
  else if (op === 'coins') { if (!ST.replay) coins(+a); toast(`🪙 ${[b, ...rest].join(' ')}${ST.replay ? '' : ` +${a}`}`); }
  else if (op === 'sfx' && sfx[a]) sfx[a]();
}
function sNext() {
  if (!ST || ST.phase !== 'talk') return;
  const c = CHAPTERS[ST.ci], sc = c.scenes[ST.si]; ST.line++;
  while (ST.line < sc.l.length && sc.l[ST.line][0] === '*') { direct(sc.l[ST.line].slice(1)); ST.line++; }
  if (ST.line < sc.l.length) {
    const mm = T(sc.l[ST.line]).match(/^(\w+):\s*(.*)$/), who = mm[1], text = mm[2], isN = who === 'N';
    const name = isN ? '' : who === 'polina' ? S.name : ACT[who][1], f = who === 'polina' ? S.hero : isN ? 'scroll' : ACT[who][0];
    $('#cap').innerHTML = `<img src="${eimg(f)}" alt=""><div class="${isN ? 'narr' : ''}"><b>${name}</b><p>${text}</p></div><span class="tapnext">▶</span>`;
    W3.talk(isN ? null : who); sfx.tap(); speak(text, isN ? '' : who); return;
  }
  W3.talk(null);
  if ((sc.g || sc.pick) && !ST.replay) { ST.phase = 'task'; if (sc.pick) sPick(); else { ST.gens = sceneGens(sc); sTask(); } }
  else {
    ST.phase = 'end'; const last = ST.si === c.scenes.length - 1;
    $('#cap').innerHTML = `<div class="capend"><button class="btn" style="background:${ENVCSS[c.id][0]}" onclick="event.stopPropagation();${last ? `G.chapterDone(${ST.ci})` : `G.playScene(${ST.ci},${ST.si + 1})`}">${last ? (S.done[c.id] ? 'Kapitel beenden' : PARTS[partOf(c)].collect) : 'Nächste Szene ▶'}</button></div>`;
  }
}
/* Aufgaben einer Szene: g = ein Generator oder eine Liste (mehrere Schritte); n = so oft derselbe Generator */
const sceneGens = (sc, g = sc.g) => Array.isArray(g) ? g : Array(sc.n || 1).fill(g);
/* Wegwahl: zwei Wege mit verschiedenen Aufgaben (und verschiedenem Lohn) */
function sPick() {
  const c = CHAPTERS[ST.ci], sc = c.scenes[ST.si], intro = T(sc.intro || 'Welchen Weg nimmst du?');
  $('#cap').innerHTML = `<img src="${eimg('compass')}" alt=""><div class="narr"><p>${intro}</p></div>`; speak(intro);
  $('#task').innerHTML = `<div class="ways">${sc.pick.map((w, i) => `<button class="way" style="--a:${ENVCSS[c.id][0]};--b:${ENVCSS[c.id][1]}" onclick="G.sWay(${i})"><span class="wayi">${w.icon}</span><b>${w.label}</b><small>${w.sub}</small><i>${'🪙'.repeat(w.coins || 3)}</i></button>`).join('')}</div>`;
  document.body.style.setProperty('--sh', '32vh');
}
function sWay(i) { const sc = CHAPTERS[ST.ci].scenes[ST.si], w = sc.pick[i]; ST.way = w; ST.gens = sceneGens(sc, w.g); sfx.ok(); W3.jump('polina', 0.8); sTask(); }
function sTask() {
  stopTimer();
  const c = CHAPTERS[ST.ci], sc = c.scenes[ST.si], q = ST.gens[ST.step](), n = ST.gens.length, pip = sc.pip || ['🔒', '🔓']; ST.t = (ST.way && ST.way.t) || sc.t || c.id;
  const intro = T((ST.way && ST.way.intro) || (Array.isArray(sc.steps) && sc.steps[ST.step]) || sc.intro || 'Löse die Aufgabe!'); $('#cap').innerHTML = `<img src="${eimg('scroll')}" alt=""><div class="narr"><p>${intro}</p></div>`; speak(intro);
  const timed = sc.time && !ST.slow;
  $('#task').innerHTML = `<div class="card">${n > 1 ? `<div class="pips">${ST.gens.map((_, i) => `<span class="${i < ST.step ? 'done' : i === ST.step ? 'cur' : ''}">${i < ST.step ? pip[1] : pip[0]}</span>`).join('')}</div>` : ''}${timed ? `<div class="tbar"><i id="tbar"></i><span>${sc.timeIcon || '⏳'}</span></div>` : ''}${ST.first && !ST.slow ? '' : '<div class="badge">🔁 Neuer Versuch – ganz in Ruhe</div>'}${qHTML(q)}${checkBtn(ENVCSS[c.id][0])}</div>`;
  qMount(q, enableCheck); document.body.style.setProperty('--sh', '32vh'); thinkDelay();
  if (timed) { ST.left = sc.time; ST.timer = setInterval(() => { if (MODE !== 'story' || !$('#tbar')) return stopTimer(); ST.left -= 0.25; $('#tbar').style.width = Math.max(0, ST.left / sc.time * 100) + '%'; if (ST.left <= 5 && ST.left % 1 === 0 && ST.left > 0) tone([880], 0.05, 'square', 0.04); if (ST.left <= 0) sLate(); }, 250); }
}
function sLate() {
  stopTimer(); if (!CUR || CUR.done) return; const sc = CHAPTERS[ST.ci].scenes[ST.si];
  CUR.done = true; ST.slow = true; ST.first = false; sfx.bad(); W3.shake(0.5); W3.sad();
  document.querySelectorAll('.keys button,.nudge button,.opt,.cc').forEach(b => { b.disabled = true; });
  $('#fb').innerHTML = `<div class="fb bad"><h3>${sc.late || 'Die Zeit ist um!'}</h3><p>Nicht schlimm. Jetzt darfst du ganz in Ruhe rechnen – ohne Uhr.</p></div>`;
  const b = $('#check'); b.textContent = '🔁 Nochmal in Ruhe'; b.disabled = false; b.onclick = () => sTask();
}
function sCheck() {
  if (CUR.done) return; const r = qCheck(); if (!r) return; stopTimer();
  const c = CHAPTERS[ST.ci], sc = c.scenes[ST.si], k = c.id + '-' + ST.si, b = $('#check'); record(ST.t, r.ok); const guess = guessNote(r.ok), fea = r.ok ? thinkReward() : '';
  if (r.ok && ST.step + 1 < ST.gens.length) { // Zwischenschritt geschafft
    sfx.ok(); W3.celebrate(c.hue); const cur = document.querySelector('.pips .cur'); if (cur) { cur.textContent = (sc.pip || ['🔒', '🔓'])[1]; cur.classList.add('done', 'fresh'); }
    $('#fb').innerHTML = `<div class="fb good"><h3>${pick(PRAISE)}</h3><p>${ST.step + 1} von ${ST.gens.length} geschafft – weiter so!</p>${fea}</div>`;
    b.textContent = 'Weiter ▶'; b.disabled = false; b.onclick = () => { ST.step++; sTask(); }; return;
  }
  if (r.ok) {
    if (S.sf[k] == null) S.sf[k] = ST.first ? 1 : 0;
    S.story[c.id] = Math.max(S.story[c.id] || 0, ST.si + 1); save();
    const pay = (ST.first ? 3 : 1) + (ST.way && ST.first ? (ST.way.coins || 3) - 3 : 0) + (ST.gens.length > 1 ? ST.gens.length - 1 : 0);
    sfx.ok(); W3.celebrate(c.hue); coins(pay); if (sc.win) sc.win.forEach(direct);
    $('#fb').innerHTML = `<div class="fb good"><h3>${pick(PRAISE)}</h3><p>🔓 Die nächste Szene ist freigeschaltet!</p>${fea}${sc.bonus ? `<button class="bonus" id="bonus" onclick="G.sBonus()">${BONUS[sc.bonus][0]}</button>` : ''}</div>`;
    b.textContent = 'Nächste Szene ▶'; b.disabled = false; b.onclick = () => playScene(ST.ci, ST.si + 1);
    const nx = document.querySelectorAll('.strip button')[ST.si + 1]; if (nx) { nx.classList.remove('lock'); nx.textContent = ST.si + 2; nx.classList.add('fresh'); }
  } else {
    sfx.bad(); ST.first = false; ST.slow = true; W3.sad(); W3.emote('finn', '💡');
    $('#fb').innerHTML = `<div class="fb bad"><h3>Noch nicht ganz – schau mal:</h3>${r.sol}${CUR.q.explain}</div>`;
    b.textContent = guess ? '🦉 Erst zu Frau Eule' : '🔁 Neue Aufgabe versuchen'; b.disabled = false; b.onclick = () => guess ? thinkBreak(ST.t, sTask) : sTask();
    setTimeout(() => $('#fb').scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60);
  }
}
/* Überraschung nach einer Szene: Glücksrad, Schatzkiste, Sternschnuppe … */
const BONUS = { rad: ['🎡 Glücksrad drehen!', '🎡', [2, 3, 3, 4, 5, 6, 8, 12]], kiste: ['🧰 Schatzkiste öffnen!', '💰', [3, 4, 5, 5, 6, 8, 10]], stern: ['🌠 Sternschnuppe fangen!', '🌠', [3, 4, 5, 6, 7, 9]], honig: ['🍯 Honigtopf auslecken!', '🍯', [2, 3, 4, 5, 6]], torte: ['🍰 Tortenstück probieren!', '🍰', [2, 3, 4, 5, 6]] };
function sBonus() {
  const el = $('#bonus'), sc = CHAPTERS[ST.ci].scenes[ST.si], B2 = BONUS[sc.bonus]; if (!el || el.disabled) return; el.disabled = true; el.classList.add('spin');
  let k = 0; const iv = setInterval(() => { el.textContent = `${B2[1]} ${pick(B2[2])} 🪙`; tone([500 + k * 40], 0.04, 'square', 0.04); if (++k > 14) { clearInterval(iv); const n = pick(B2[2]); el.classList.remove('spin'); el.classList.add('won'); el.textContent = `${B2[1]} Gewonnen: +${n} 🪙`; coins(n); confetti(30); W3.jump(null, 0.9); } }, 90);
}
function chapterDone(ci) {
  const c = CHAPTERS[ci], was = S.done[c.id]; S.done[c.id] = 1; save();
  if (was) return storyMenu();
  MODE = 'menu'; actor.hue = c.hue; coins(20, true); sfx.win(); confetti(140);
  stage('big', c.scenes[0].bg, [actor('polina', 30, 3, 44, 'hop'), actor('gem', 50, 34, 46, 'pulse'), actor('finn', 70, 3, 32, 'hop')]); W3.celebrate(c.hue);
  const P = PARTS[partOf(c)], inPart = CHAPTERS.filter(x => partOf(x) === partOf(c)), last = inPart[inPart.length - 1] === c, nx = CHAPTERS[ci + 1];
  app.innerHTML = `<div class="stagehit"></div><div class="result"><h1>${last ? P.final : `${P.gem} ${inPart.filter(x => S.done[x.id]).length} von ${inPart.length}!`}</h1>
    <div class="bigstars">${starStr(chStars(c))}</div><p>Kapitel „${c.title}“ geschafft. +20 🪙</p>
    <p>${last ? T(P.finalP) : `${P.icon} Dein ${P.gem} hat das nächste Kapitel geöffnet – und die Welt „${c.title}“ samt neuem Sticker-Paket für „Meine Welt“!`}</p>
    <div class="btns">${nx ? `<button class="btn" style="background:${ENVCSS[nx.id][0]}" onclick="G.playChapter(${ci + 1})">${last ? 'Teil ' + (partOf(nx) + 1) + ' beginnen ▶' : `Kapitel ${ci + 2} starten ▶`}</button>` : ''}<button class="btn sec" onclick="S.my.env='${c.id}';save();G.myWorld()">🏰 Neue Welt ansehen</button><button class="btn sec" onclick="G.home()">Zur Startseite</button></div></div>`;
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
  qMount(it.q, enableCheck); window.scrollTo(0, 0); thinkDelay();
}
function quizNext() { QZ.i++; if (QZ.i < QZ.queue.length) quizRender(); else QZ.finish(QZ.first, QZ.N); }
function quizCheck() {
  if (CUR.done) { if (QZ.guess && QZ.i + 1 < QZ.queue.length) { QZ.guess = false; return thinkBreak(QZ.queue[QZ.i].t, quizNext); } return quizNext(); }
  const r = qCheck(); if (!r) return; const it = QZ.queue[QZ.i]; record(it.t, r.ok); QZ.guess = guessNote(r.ok); const fea = r.ok ? thinkReward() : '';
  if (r.ok) { QZ.streak++; if (!it.retry) QZ.first++; sfx.ok(); W3.celebrate(); coins(1, true); if (QZ.streak % 5 === 0) confetti(30); }
  else { QZ.streak = 0; sfx.bad(); W3.sad(); if (!it.retry) QZ.queue.push({ gen: it.gen, t: it.t, q: it.gen(), retry: true }); }
  const se = $('.streak'); se.textContent = '🔥 ' + QZ.streak; se.classList.toggle('on', QZ.streak >= 2);
  const pct = (QZ.i + 1) / QZ.queue.length * 100; $('.fill').style.width = pct + '%'; $('.runner').style.left = pct + '%';
  $('#fb').innerHTML = r.ok ? `<div class="fb good"><h3>${pick(PRAISE)}${QZ.streak >= 3 ? ` &nbsp;${QZ.streak} in Folge!` : ''}</h3>${fea}</div>`
    : `<div class="fb bad"><h3>Noch nicht ganz – schau mal:</h3>${r.sol}${it.q.explain}${it.retry ? '' : '<p class="again">🔁 So eine Aufgabe kommt am Ende nochmal.</p>'}</div>`;
  const b = $('#check'); b.textContent = QZ.guess && QZ.i + 1 < QZ.queue.length ? '🦉 Erst zu Frau Eule' : QZ.i + 1 < QZ.queue.length ? 'Weiter →' : 'Fertig! 🏁'; b.disabled = false;
  if (!r.ok) setTimeout(() => $('#fb').scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60);
}
function quit() { if (confirm('Wirklich abbrechen?')) { if (BZ) { clearInterval(BZ.timer); BZ = null; } home(); } }

/* ---- Training mit Tierkarten ---- */
const CARDINFO = 'So bekommst du Tierkarten: Wähle eine Welt und spiele ein Level. Löst du mindestens 6 von 8 Aufgaben (in den Meister-Welten 7 von 10) gleich beim ersten Versuch richtig, gewinnst du die Tierkarte mit dem echten Tierfoto. Jede Welt hat 3 Tiere.';
function trainMenu() {
  MODE = 'menu'; stage('home', 'home', [actor('polina', 34, 3, 42), actor('trophy', 58, 4, 34, 'pulse')]);
  const card = (w, wi) => {
    const locked = w.boss && cardsIn(partOf(w)) < 6;
    return `<button class="chapter ${locked ? 'locked' : ''}" style="--a:${ENVCSS[w.id][0]};--b:${ENVCSS[w.id][1]}" onclick="${locked ? '' : `G.world(${wi})`}">
      <span class="wicon">${w.icon}</span><span><small>${w.topic}</small><b>${w.name}</b>
      <span class="wthumbs">${w.animals.map((a, li) => `<img src="${photo(a)}" class="${starsOf(wi, li) ? '' : 'hid'}" alt="">`).join('')}</span>
      <small>${locked ? `🔒 Sammle erst 6 Tierkarten in Teil ${partOf(w) + 1}` : starStr(w.animals.reduce((s, _, li) => s + starsOf(wi, li), 0), 9)}</small></span></button>`;
  };
  app.innerHTML = `<div class="stagehit">${backBtn('G.home()')}<h1 class="title">Training</h1></div>
  <p class="rule">🃏 ${CARDINFO}<br>👉 Jede Welt ist ein Thema – such dir aus, was du üben möchtest.</p>
  ${PARTS.map((P, p) => `<h2 class="parth">${P.train}<small>${P.sub}</small></h2><div class="chapters">${WORLDS.map((w, wi) => partOf(w) === p ? card(w, wi) : '').join('')}</div>`).join('')}`;
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
  runQuiz({ env: w.id, color: w.color, buddy: BUDDIES[w.id][li], items: order.slice(0, N).map(g => Array.isArray(g) ? { gen: g[0], t: g[1] } : { gen: g, t: w.id }), finish: (first, n) => trainDone(wi, li, first, n) });
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
function albumPlay(wi, li) {
  const w = WORLDS[wi];
  if (w.boss && cardsIn(partOf(w)) < 6) return say(`Diese Welt öffnet sich, wenn du 6 Tierkarten aus Teil ${partOf(w) + 1} hast.`);
  if (li > 0 && !starsOf(wi, li - 1)) return say(`Gewinne erst die Karte von Level ${li} in der Welt „${w.name}“.`);
  train(wi, li);
}
function album() {
  MODE = 'menu'; stage('small', 'home', [actor('polina', 42, 3, 62), actor('trophy', 60, 4, 50, 'pulse')]);
  app.innerHTML = `<div class="stagehit">${backBtn('G.home()')}<h1 class="title">Tieralbum · ${cardCount()}/${CARDS}</h1></div>
  <p class="rule">🃏 ${CARDINFO} Tippe auf eine verdeckte Karte, um sie zu spielen.</p>
  <div class="album">${WORLDS.map((w, wi) => w.animals.map((a, li) => { const st = starsOf(wi, li); return st ? `<div class="acard"><img src="${photo(a)}" alt=""><div><b>${ANIMALS[a][0]} ${starStr(st)}</b><span>${ANIMALS[a][1]}</span></div></div>` : `<button class="acard hidcard" onclick="G.albumPlay(${wi},${li})"><img src="${photo(a)}" alt=""><div><b>???</b><span>${w.icon} ${w.name} · Level ${li + 1}<br>▶ Im Training gewinnen</span></div></button>`; }).join('')).join('')}</div>`;
  window.scrollTo(0, 0);
}

/* ---- Schwächen-Zauber ---- */
/* Themen-Auswahl (gilt für Klassenarbeit, Blitz-Runde und Schwächen-Zauber) */
let PICKBACK = null;
function picker(back) {
  PICKBACK = back; const sel = selT();
  return `<div class="pick"><p class="hint"><b>Welche Themen sollen drankommen?</b> Tippe an, was gerade in der Schule dran ist.</p>
    ${PARTS.map((P, p) => `<div class="pickrow"><button class="pickall" onclick="G.pickPart(${p})">Nur Teil ${p + 1}</button>${TOPICS.filter(w => partOf(w) === p).map(w => `<button class="chip ${sel.includes(w.id) ? 'on' : ''}" onclick="G.pickT('${w.id}')">${w.icon} ${TOPIC[w.id]}</button>`).join('')}</div>`).join('')}
    <div class="pickrow"><button class="pickall" onclick="G.pickPart(-1)">Alle Themen</button></div></div>`;
}
function pickT(id) { let s = selT(); s = s.includes(id) ? s.filter(x => x !== id) : [...s, id]; if (!s.length) return say('Mindestens ein Thema muss ausgewählt sein.'); S.sel = s; save(); sfx.tap(); const y = window.scrollY; PICKBACK(); window.scrollTo(0, y); }
function pickPart(p) { S.sel = TOPICS.filter(w => p < 0 || partOf(w) === p).map(w => w.id); save(); sfx.tap(); const y = window.scrollY; PICKBACK(); window.scrollTo(0, y); }

function weakMenu() {
  MODE = 'menu'; stage('home', 'home', [actor('polina', 36, 3, 42), actor('magic_wand', 56, 20, 30, 'sway')]);
  const ts = selT();
  app.innerHTML = `<div class="stagehit">${backBtn('G.home()')}<h1 class="title">Schwächen-Zauber</h1></div>
  <div class="panel"><h2>So gut bist du schon:</h2>
    ${ts.map(t => { const r = S.tp[t], p = r && r.n ? Math.round(r.ok / r.n * 100) : null; return `<div class="trow"><span>${TOPIC[t]}</span><span class="bar"><i style="width:${p == null ? 0 : p}%;background:${p == null ? '#cbd5e1' : p >= 85 ? '#22c55e' : p >= 65 ? '#f59e0b' : '#ef4444'}"></i></span><b>${p == null ? '–' : p + ' %'}</b><small>${r ? r.n : 0} Aufgaben</small></div>`; }).join('')}
    <p class="hint">Der Zauber sucht 8 Aufgaben aus – am meisten von dem, was noch schwer ist.</p>
    <button class="btn" style="background:#be123c" onclick="G.weak()">Zauber starten ✨</button>${picker(weakMenu)}</div>`;
  window.scrollTo(0, 0);
}
function weak() {
  const ts = selT(), wt = ts.map(t => { const r = S.tp[t]; return !r || r.n < 4 ? 3 : 1 + 8 * (1 - r.ok / r.n); }), sum = wt.reduce((a, b) => a + b, 0), items = [];
  for (let i = 0; i < 8; i++) { let x = Math.random() * sum, k = 0; while (k < ts.length - 1 && x > wt[k]) { x -= wt[k]; k++; } const t = ts[k]; items.push({ gen: pick(POOL[t]), t }); }
  runQuiz({ env: 'home', color: '#be123c', buddy: 'magic_wand', items, finish: (first, n) => {
    MODE = 'menu'; coins(first * 2, true); sfx.win(); if (first >= 6) confetti(80);
    stage('small', 'home', [actor('polina', 42, 3, 62, 'hop')]);
    app.innerHTML = `<div class="stagehit"></div><div class="result"><h1>${first >= 7 ? 'Zauberhaft!' : first >= 5 ? 'Gut gezaubert!' : 'Weiter üben!'}</h1><p>${first} von ${n} gleich richtig. +${first * 2} 🪙</p><div class="btns"><button class="btn" style="background:#be123c" onclick="G.weak()">Nochmal zaubern</button><button class="btn sec" onclick="G.weakMenu()">Meine Stärken ansehen</button><button class="btn sec" onclick="G.home()">Startseite</button></div></div>`;
  } });
}

/* ===================== BLITZ ===================== */
let BZ = null;
function blitzIntro() {
  MODE = 'menu'; stage('home', 'savanne', [actor('polina', 36, 3, 42), actor('high_voltage', 58, 10, 34, 'pulse')]);
  app.innerHTML = `<div class="stagehit">${backBtn('G.home()')}<h1 class="title">⚡ Blitz-Runde</h1></div><div class="panel"><h2>90 Sekunden. So viele Aufgaben wie möglich!</h2><p class="hint">Jede richtige Antwort gibt einen Punkt und eine Münze. Dein Rekord: <b>${S.blitz}</b></p><button class="btn" style="background:#ea580c" onclick="G.blitz()">Auf die Plätze … los!</button>${picker(blitzIntro)}</div>`;
}
function blitz() {
  THINK.slow = false; THINK.until = 0; MODE = 'blitz'; BZ = { left: 90, score: 0, n: 0, lock: false, ts: selT() };
  stage('small', 'savanne', [actor('polina', 40, 3, 62, 'hop'), actor('high_voltage', 60, 6, 50, 'pulse')]);
  app.innerHTML = `<div class="stagehit"></div><div class="quiz"><div class="topbar">${backBtn('G.quit()', '✕')}<div class="track"><div class="fill" id="tfill" style="width:100%;background:#ea580c"></div></div><span class="streak on" id="bscore">⚡ 0</span></div><div class="card" id="bcard"></div></div>`;
  BZ.timer = setInterval(() => { BZ.left--; const f = $('#tfill'); if (f) f.style.width = BZ.left / 90 * 100 + '%'; if (BZ.left <= 10 && BZ.left > 0) tone([880], 0.05, 'square', 0.04); if (BZ.left <= 0) blitzEnd(); }, 1000);
  blitzNext();
}
function blitzNext() {
  if (!BZ) return; BZ.lock = false; const t = pick(BZ.ts), q = pick(BLITZPOOL[t])(); BZ.t = t;
  $('#bcard').innerHTML = qHTML(q) + (q.type === 'choice' ? '' : checkBtn('#ea580c'));
  qMount(q, on => { if (q.type === 'choice') { if (on) blitzCheck(); } else enableCheck(on); });
}
function blitzCheck() {
  if (!BZ || BZ.lock) return; const r = qCheck(); if (!r) return; BZ.lock = true; BZ.n++; record(BZ.t, r.ok);
  if (r.ok) { BZ.score++; sfx.ok(); W3.celebrate(40); $('#bscore').textContent = '⚡ ' + BZ.score; } else { sfx.bad(); W3.sad(); }
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
/* Die Arbeit wird aus den gewählten Themen zusammengestellt: pro Thema zuerst die wichtigsten Aufgaben (Reihenfolge in EXPOOL) */
const examN = k => k >= 10 ? 24 : k >= 3 ? 18 : k === 2 ? 14 : 10;
function examItems() {
  const ts = selT(), N = examN(ts.length), out = [];
  ts.forEach((t, i) => { const n = Math.floor(N / ts.length) + (i < N % ts.length ? 1 : 0); let pool = []; for (let k = 0; k < n; k++) { if (!pool.length) pool = k ? shuffle(EXPOOL[t]) : EXPOOL[t].slice(); out.push({ q: pool.shift()(), t }); } });
  return out;
}
function examIntro() {
  MODE = 'menu'; stage('home', 'berge', [actor('polina', 36, 3, 42), actor('memo', 58, 8, 34, 'sway')]);
  const ts = selT();
  app.innerHTML = `<div class="stagehit">${backBtn('G.home()')}<h1 class="title">📝 Klassenarbeit</h1></div><div class="panel"><h2>Probe-Klassenarbeit mit ${examN(ts.length)} Aufgaben</h2><p class="hint">Wie in der Schule: Du siehst erst am Ende, was richtig war – und bekommst eine Note. ${S.exam ? `Deine beste Note bisher: <b>${S.exam}</b>` : ''}</p><button class="btn" style="background:#0f766e" onclick="G.exam()">Klassenarbeit beginnen</button>${picker(examIntro)}</div>`;
}
function exam() { THINK.slow = false; THINK.until = 0; MODE = 'exam'; EX = { items: examItems(), i: 0, ok: 0, wrong: [] }; stage('small', 'berge', [actor('polina', 40, 3, 62), actor('memo', 60, 6, 48)]); examRender(); }
function examRender() {
  const it = EX.items[EX.i], n = EX.items.length;
  app.innerHTML = `<div class="stagehit"></div><div class="quiz"><div class="topbar">${backBtn('G.quit()', '✕')}<div class="track"><div class="fill" style="width:${EX.i / n * 100}%;background:#0f766e"></div></div><span class="streak on">${EX.i + 1}/${n}</span></div>
    <div class="card"><div class="badge">Aufgabe ${EX.i + 1} · ${TOPIC[it.t]}</div>${qHTML(it.q)}${checkBtn('#0f766e', EX.i + 1 < n ? 'Antwort abgeben →' : 'Abgeben 🏁')}</div></div>`;
  qMount(it.q, enableCheck); window.scrollTo(0, 0);
}
function examCheck() {
  const r = qCheck(true); if (!r) return; const it = EX.items[EX.i]; record(it.t, r.ok); sfx.tap();
  if (r.ok) EX.ok++; else EX.wrong.push({ q: it.q, sol: r.sol, n: EX.i + 1, t: it.t });
  EX.i++; if (EX.i < EX.items.length) return examRender();
  const n = EX.items.length, p = EX.ok / n, note = p >= 0.95 ? 1 : p >= 0.8 ? 2 : p >= 0.6 ? 3 : p >= 0.45 ? 4 : p >= 0.15 ? 5 : 6;
  if (!S.exam || note < S.exam) S.exam = note; MODE = 'menu'; const c = (7 - note) * 5; coins(c, true); sfx.win(); if (note <= 2) confetti(120);
  stage('small', 'berge', [actor('polina', 42, 3, 62, note <= 2 ? 'hop' : '')]);
  app.innerHTML = `<div class="stagehit"></div><div class="result"><h1>Note ${note}</h1><div class="bigstars">${EX.ok} / ${n} Punkte</div><p>${['', 'Sehr gut! Fantastisch! 🏆', 'Gut gemacht! 👏', 'Befriedigend – das wird noch besser!', 'Ausreichend – übe mit dem Schwächen-Zauber!', 'Das üben wir nochmal zusammen.', 'Das üben wir nochmal zusammen.'][note]} +${c} 🪙</p>
    <div class="btns"><button class="btn" style="background:#0f766e" onclick="G.exam()">Neue Klassenarbeit</button><button class="btn sec" onclick="G.weak()">Schwächen-Zauber</button><button class="btn sec" onclick="G.home()">Startseite</button></div></div>
    ${EX.wrong.length ? `<div class="review"><h2>Das schauen wir uns nochmal an:</h2>${EX.wrong.map(w => `<div class="card"><div class="badge">Aufgabe ${w.n} · ${TOPIC[w.t]}</div><div class="prompt">${w.q.q}</div>${w.q.visual ? `<div class="visual">${w.q.visual}</div>` : ''}<div class="fb bad">${w.sol}${w.q.explain}</div></div>`).join('')}</div>` : ''}`;
  EX = null; window.scrollTo(0, 0);
}

/* ===================== MEINE WELT (Sticker) ===================== */
let MY = null;
const packOf = f => Object.keys(PACKS).find(k => PACKS[k].includes(f));
/* frei ist ein Sticker, wenn sein Kapitel geschafft ist – oder wenn man ihn schon früher gekauft hat */
const stickerOpen = f => { const k = packOf(f); return !k || f === S.hero || !!S.done[k] || !!S.own[f] || S.my.items.some(q => q.k === f); };
const shopBtn = ([f, p]) => { const own = S.own[f] || p === 0, inW = S.my.items.some(q => q.k === f), open = stickerOpen(f); return `<button class="${inW ? 'in' : own ? 'own' : open ? '' : 'lockd'}" onclick="G.sticker('${f}',${p})"><img src="${eimg(f)}" loading="lazy" alt=""><span>${inW ? '✓ in der Welt' : own ? '＋ hinstellen' : open ? '🪙 ' + p : '🔒'}</span></button>`; };
const myShop = () => {
  const el = $('#shop'); if (!el) return; const all = [[S.hero, 0], ...STICKERS];
  const sec = (title, list, cls = '') => list.length ? `<h3 class="shoph ${cls}">${title}</h3><div class="shop">${list.map(shopBtn).join('')}</div>` : '';
  el.innerHTML = sec('🎒 Start-Paket', all.filter(x => !packOf(x[0]))) + CHAPTERS.map((c, i) => { const list = all.filter(x => packOf(x[0]) === c.id); return sec(S.done[c.id] ? `${PARTS[partOf(c)].icon} Paket „${c.title}“` : `🔒 Paket „${c.title}“ – schaffe Kapitel ${i + 1} in der Geschichte`, list, S.done[c.id] ? '' : 'off'); }).join('');
};
function myWorld() {
  MODE = 'my'; MY = { sel: null, drag: false }; S.own.fox = 1;
  const seen = {}; S.my.items = S.my.items.filter(it => !seen[it.k] && (seen[it.k] = 1)); // jeden Sticker nur einmal
  const envs = ['home', ...CHAPTERS.filter(c => S.done[c.id]).map(c => c.id)]; if (!envs.includes(S.my.env)) S.my.env = 'home';
  myStage();
  app.innerHTML = `<div class="stagehit my" id="myhit">${backBtn('G.home()')}${hud()}<div class="mytools" id="mytools"></div></div>
  <div class="panel"><div class="envs">${Object.keys(ENVCSS).map(e => { const o = envs.includes(e); return `<button class="${S.my.env === e ? 'sel' : ''} ${o ? '' : 'locked'}" style="--a:${ENVCSS[e][0]};--b:${ENVCSS[e][1]}" onclick="${o ? `G.myEnv('${e}')` : `G.say('Diese Welt bekommst du, wenn du das Kapitel in der Geschichte schaffst!')`}">${o ? '' : '🔒'}</button>`; }).join('')}</div>
    <p class="hint">Jedes geschaffte Kapitel der Geschichte schenkt dir eine neue Welt <b>und</b> ein neues Sticker-Paket. Jeden Sticker gibt es <b>einmal</b>: kaufen 🪙, dann hinstellen. Tippe ihn in deiner Welt an, um ihn zu <b>verschieben</b>, größer oder kleiner zu machen oder <b>wegzuräumen</b> 🗑.</p>
    <div id="shop"></div>
    <button class="btn sec bordered" onclick="G.myClear()">🧹 Alle Sticker wegräumen</button></div>`;
  myShop();
  const hit = $('#myhit');
  hit.addEventListener('pointerdown', e => { if (e.target.closest('button')) return; const p = W3.pick(e.clientX, e.clientY); let best = null; S.my.items.forEach(it => { const hw = Math.max(5, it.s * 0.3); if (Math.abs(p.x - it.x) <= hw && p.y >= it.y - 4 && p.y <= it.y + it.s + 4) best = it; }); MY.sel = best ? best.id : null; MY.drag = !!best; if (best) { MY.dx = best.x - p.x; MY.dy = best.y - p.y; try { hit.setPointerCapture(e.pointerId); } catch (x) { /* egal */ } sfx.tap(); } W3.talk(MY.sel); myTools(); });
  hit.addEventListener('pointermove', e => { if (!MY || !MY.drag) return; const p = W3.pick(e.clientX, e.clientY), it = S.my.items.find(q => q.id === MY.sel); if (!it) return; it.x = Math.max(0, Math.min(100, p.x + MY.dx)); it.y = Math.max(0, Math.min(80, p.y + MY.dy)); W3.moveActor(it.id, it.x, it.y); });
  const up = () => { if (MY && MY.drag) { MY.drag = false; save(); } }; hit.addEventListener('pointerup', up); hit.addEventListener('pointercancel', up);
  myTools(); window.scrollTo(0, 0);
}
function myStage() { stage('full', S.my.env, S.my.items.map(it => ({ id: it.id, img: eimg(it.k), x: it.x, y: it.y, size: it.s, flip: it.f })), true); if (MY && MY.sel) W3.talk(MY.sel); }
function myTools() { const el = $('#mytools'); if (!el) return; el.innerHTML = MY.sel ? `<button onclick="G.myEdit('big')">＋</button><button onclick="G.myEdit('small')">－</button><button onclick="G.myEdit('flip')">↔</button><button class="delb" onclick="G.myEdit('del')">🗑 weg</button>` : (S.my.items.length ? '<span>👆 Tippe einen Sticker an: verschieben, Größe ändern oder wegräumen</span>' : '<span>Deine Welt ist noch leer – such dir unten Sticker aus!</span>'); }
function myEdit(a) {
  const it = S.my.items.find(q => q.id === MY.sel); if (!it) return;
  if (a === 'big') it.s = Math.min(90, it.s * 1.2); if (a === 'small') it.s = Math.max(8, it.s / 1.2); if (a === 'flip') it.f = !it.f;
  if (a === 'del') { S.my.items = S.my.items.filter(q => q !== it); MY.sel = null; save(); myStage(); myTools(); myShop(); sfx.tap(); return; }
  W3.sizeActor(it.id, it.s, it.f); sfx.tap(); save();
}
function myClear() { if (!S.my.items.length || !confirm('Alle Sticker aus deiner Welt wegräumen? (Sie bleiben gekauft.)')) return; S.my.items = []; MY.sel = null; save(); myStage(); myTools(); myShop(); }
function myEnv(e) { S.my.env = e; save(); myWorld(); }
function sticker(f, price) {
  const there = S.my.items.find(q => q.k === f);
  if (there) { MY.sel = there.id; W3.talk(there.id); myTools(); sfx.tap(); window.scrollTo({ top: 0, behavior: 'smooth' }); return say('Der Sticker steht schon in deiner Welt. Du kannst ihn oben verschieben oder wegräumen.'); }
  if (!stickerOpen(f)) { sfx.bad(); const k = packOf(f), i = CHAPTERS.findIndex(c => c.id === k); return say(`Dieses Sticker-Paket bekommst du, wenn du Kapitel ${i + 1} „${CHAPTERS[i].title}“ in der Geschichte schaffst.`); }
  if (!S.own[f] && price > 0) {
    if (S.coins < price) { sfx.bad(); return say(`Dafür brauchst du ${price} Münzen. Löse Aufgaben, um Münzen zu verdienen!`); }
    S.coins -= price; S.own[f] = 1; sfx.win(); confetti(25); $('#coinct').textContent = S.coins;
  }
  const it = { id: 's' + Date.now(), k: f, x: 20 + Math.random() * 60, y: 3, s: 30, f: false }; S.my.items.push(it); MY.sel = it.id; save(); myStage(); W3.celebrate(); myTools(); myShop(); sfx.ok(); window.scrollTo({ top: 0, behavior: 'smooth' });
}
/* Versteckt für Eltern: Titel auf der Startseite 3 Sekunden gedrückt halten (oder #reset an die Adresse hängen), dann RESET eintippen */
/* Eltern-Bereich: Fortschritt sichern, wiederherstellen oder löschen */
const VERSION = '14', MAIN_HOST = 'mathe-abenteuer.ermakov.dev';
const packSave = () => 'MA1:' + btoa(unescape(encodeURIComponent(JSON.stringify(S))));
function unpackSave(code) {
  const m = String(code).replace(/\s+/g, '').match(/MA1:([A-Za-z0-9+/=]+)/); if (!m) return null;
  try { const o = JSON.parse(decodeURIComponent(escape(atob(m[1])))); return o && typeof o === 'object' && typeof o.hero === 'string' && o.stars && o.done ? o : null; } catch (e) { return null; }
}
function resetAll() {
  if ($('#parent')) return; const d = document.createElement('div'); d.className = 'think'; d.id = 'parent';
  d.innerHTML = `<div class="thinkbox"><div class="thinktop"><img src="${eimg('key')}" alt=""><div><h2>Eltern-Bereich</h2><p>Version ${VERSION} · 💎 ${gemCount()}/${CHAPTERS.length} · 🃏 ${cardCount()}/${CARDS} · 🪙 ${S.coins}</p></div></div>
    <p class="hint addr">Adresse dieser Kopie: <b>${location.host}</b>${location.hostname === MAIN_HOST ? '' : `<br>⚠️ Das ist nicht die Hauptadresse <b>${MAIN_HOST}</b>. Jede Adresse hat ihren eigenen Spielstand und ihre eigene Version!`}</p>
    <div class="btns"><button class="btn" style="background:#b45309" onclick="G.manual()">✏️ Fortschritt von Hand eintragen</button></div>
    <p class="hint"><b>Fortschritt sichern:</b> Der Code unten enthält den ganzen Spielstand. Kopiere ihn und bewahre ihn auf (z.&nbsp;B. in den Notizen oder per Nachricht an dich selbst).</p>
    <textarea id="pcode" readonly rows="4">${packSave()}</textarea>
    <div class="btns"><button class="btn" style="background:#0f766e" onclick="G.parent('copy')">📋 Code kopieren</button>${navigator.share ? '<button class="btn" style="background:#0369a1" onclick="G.parent(\'share\')">📤 Teilen …</button>' : ''}</div>
    <p class="hint" style="margin-top:18px"><b>Fortschritt wiederherstellen:</b> Gesicherten Code hier einfügen. Der jetzige Spielstand auf diesem Gerät wird ersetzt.</p>
    <textarea id="pin" rows="3" placeholder="MA1:…"></textarea>
    <div class="btns"><button class="btn" style="background:#7c3aed" onclick="G.parent('restore')">♻️ Wiederherstellen</button></div>
    <div class="btns" style="margin-top:18px"><button class="btn sec bordered" onclick="G.parent('wipe')">🗑 Alles löschen</button><button class="btn sec bordered" onclick="G.parent('close')">Schließen</button></div></div>`;
  document.body.appendChild(d);
}
function parent(a) {
  const d = $('#parent'); if (!d) return;
  if (a === 'close') return d.remove();
  if (a === 'copy') { const t = $('#pcode'); t.focus(); t.select(); t.setSelectionRange(0, 99999); const done = () => toast('✅ Code kopiert. Jetzt irgendwo sicher einfügen!'); if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t.value).then(done, () => { try { document.execCommand('copy'); done(); } catch (e) { toast('Bitte den Code von Hand markieren und kopieren.'); } }); else { try { document.execCommand('copy'); done(); } catch (e) { toast('Bitte den Code von Hand markieren und kopieren.'); } } return; }
  if (a === 'share') return void navigator.share({ title: 'Mathe-Abenteuer Spielstand', text: packSave() }).catch(() => {});
  if (a === 'restore') {
    const o = unpackSave($('#pin').value); if (!o) return toast('❌ Das ist kein gültiger Code. Bitte den ganzen Code einfügen (beginnt mit MA1:).');
    if (!confirm(`Spielstand von „${o.name || '?'}“ wiederherstellen (${Object.keys(o.done).length} Kapitel, ${o.coins || 0} Münzen)? Der jetzige Spielstand auf diesem Gerät wird ersetzt.`)) return;
    try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) { return toast('❌ Speichern nicht möglich.'); } location.hash = ''; location.reload(); return;
  }
  if (a === 'wipe') { const x = prompt('Um ALLES zu löschen (Münzen, Kristalle, Tierkarten, Welt), hier RESET eintippen:'); if (!x || x.trim().toUpperCase() !== 'RESET') return; try { localStorage.removeItem(KEY); } catch (e) { /* egal */ } mirror(null); location.hash = ''; setTimeout(() => location.reload(), 300); }
}
/* Fortschritt von Hand eintragen (z.B. nach einem verlorenen Spielstand): Kapitel und Tierkarten anklicken, Münzen werden passend gutgeschrieben */
let MAN = null;
const chTasks = c => c.scenes.filter(sc => sc.g || sc.pick).length;
function manualCoins() {
  let n = 0;
  CHAPTERS.forEach((c, i) => { if (i < MAN.ch && !S.done[c.id]) n += chTasks(c) * 3 + 20; });
  Object.keys(MAN.stars).forEach(k => { const now = MAN.stars[k], was = S.stars[k] || 0; if (now > was) n += (was ? 0 : 5) + (now - was) * 5; });
  return n;
}
function manual() {
  const p = $('#parent'); if (p) p.remove();
  if (!MAN) { let ch = 0; while (ch < CHAPTERS.length && S.done[CHAPTERS[ch].id]) ch++; MAN = { ch, stars: {} }; WORLDS.forEach((w, wi) => w.animals.forEach((a, li) => { MAN.stars[wi + '-' + li] = starsOf(wi, li); })); }
  let d = $('#manual'); if (!d) { d = document.createElement('div'); d.className = 'think'; d.id = 'manual'; document.body.appendChild(d); }
  const y = d.scrollTop, plus = manualCoins();
  d.innerHTML = `<div class="thinkbox wide"><div class="thinktop"><img src="${eimg('memo')}" alt=""><div><h2>Fortschritt eintragen</h2><p>Tippe an, was schon geschafft war. Münzen, Kristalle und Sticker-Pakete kommen automatisch dazu.</p></div></div>
    <h3 class="shoph">📖 Geschichte – bis zu welchem Kapitel war alles geschafft?</h3>
    <div class="manch">${CHAPTERS.map((c, i) => `<button class="${i < MAN.ch ? 'on' : ''}" onclick="G.manSet('ch',${i})"><b>${i + 1}</b>${c.title}</button>`).join('')}</div>
    <h3 class="shoph">🃏 Training – Tierkarten (antippen: 1, 2, 3 Sterne, wieder leer)</h3>
    ${WORLDS.map((w, wi) => `<div class="manw"><span>${w.icon} ${w.name}</span>${w.animals.map((a, li) => { const st = MAN.stars[wi + '-' + li]; return `<button class="${st ? 'on' : ''}" onclick="G.manSet('st','${wi}-${li}')">${ANIMALS[a][0]}<i>${st ? '★'.repeat(st) : '–'}</i></button>`; }).join('')}</div>`).join('')}
    <p class="hint">💎 ${MAN.ch} von ${CHAPTERS.length} Kapiteln · 🃏 ${Object.values(MAN.stars).filter(x => x > 0).length} von ${CARDS} Karten · Gutschrift: <b>+${plus} 🪙</b></p>
    <div class="btns"><button class="btn" style="background:#0f766e" onclick="G.manSet('apply')">✅ Übernehmen</button><button class="btn sec bordered" onclick="G.manSet('cancel')">Abbrechen</button></div></div>`;
  d.scrollTop = y;
}
function manSet(what, v) {
  if (what === 'ch') MAN.ch = MAN.ch === v + 1 ? v : v + 1;
  else if (what === 'st') MAN.stars[v] = (MAN.stars[v] + 1) % 4;
  else if (what === 'cancel') { MAN = null; $('#manual').remove(); return; }
  else if (what === 'apply') {
    const plus = manualCoins();
    CHAPTERS.forEach((c, i) => {
      if (i < MAN.ch) { if (!S.done[c.id]) { S.solved += chTasks(c); c.scenes.forEach((sc, si) => { if ((sc.g || sc.pick) && S.sf[c.id + '-' + si] == null) S.sf[c.id + '-' + si] = 1; }); } S.done[c.id] = 1; S.story[c.id] = c.scenes.length; }
      else if (S.done[c.id]) { delete S.done[c.id]; delete S.story[c.id]; }
    });
    Object.keys(MAN.stars).forEach(k => { if (MAN.stars[k]) S.stars[k] = MAN.stars[k]; else delete S.stars[k]; });
    S.coins += plus; save(); MAN = null; $('#manual').remove(); confetti(80); sfx.win(); home(); toast(`✅ Fortschritt eingetragen. +${plus} 🪙`); return;
  }
  sfx.tap(); manual();
}
let holdT = null;
document.addEventListener('pointerdown', e => { if (e.target.id === 'hometitle') holdT = setTimeout(resetAll, 3000); });
['pointerup', 'pointercancel', 'pointermove'].forEach(ev => document.addEventListener(ev, () => { clearTimeout(holdT); }));
let OFFLINE = false;
/* Jeder Knopf federt sichtbar, wenn man ihn drückt (auch bei ganz kurzem Tippen) */
document.addEventListener('pointerdown', e => { const b = e.target.closest && e.target.closest('button,.caption'); if (!b || b.disabled) return; b.classList.remove('tapfx'); void b.offsetWidth; b.classList.add('tapfx'); const r = b.getBoundingClientRect(), d = document.createElement('span'); d.className = 'ripple'; d.style.left = e.clientX - r.left + 'px'; d.style.top = e.clientY - r.top + 'px'; if (getComputedStyle(b).position === 'static') b.style.position = 'relative'; b.appendChild(d); setTimeout(() => d.remove(), 450); }, true);
document.addEventListener('touchstart', () => {}, { passive: true });
function say(t) { toast(t); speak(t); }

/* ===================== Steuerung ===================== */
function check() { if (MODE === 'story') sCheck(); else if (MODE === 'quiz') quizCheck(); else if (MODE === 'blitz') blitzCheck(); else if (MODE === 'exam') examCheck(); }
function toggle(k, inScene) { S[k] = !S[k]; save(); if (k === 'voice' && !S.voice && window.speechSynthesis) speechSynthesis.cancel(); if (inScene) { event.target.textContent = S.voice ? '🗣️' : '🤐'; } else home(); }
document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || $('#parent') || $('#think') || $('#manual')) return;
  if (MODE === 'story' && ST && ST.phase === 'talk' && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); return sNext(); }
  if (!CUR || !['story', 'quiz', 'blitz', 'exam'].includes(MODE)) return;
  if (e.key === 'Enter') { const b = $('#check'); if (b && !b.disabled) { e.preventDefault(); b.click(); } return; }
  const q = CUR.q;
  if (q.type === 'fields' || q.type === 'col') { if (/^\d$/.test(e.key)) key(e.key); else if (e.key === 'Backspace') key('del'); else if (e.key === 'Tab') { e.preventDefault(); key('next'); } }
  else if (q.type === 'choice' && /^[1-4]$/.test(e.key) && +e.key <= q.options.length) choose(+e.key - 1);
  else if (q.type === 'line') { if (e.key === 'ArrowLeft') nudge(-1); if (e.key === 'ArrowRight') nudge(1); }
});
const G = { gemInfo, albumPlay, home, chooseHero, pickHero, heroDone, storyMenu, playChapter, playScene, sNext, chapterDone, trainMenu, world, train, album, weakMenu, weak, blitzIntro, blitz, examIntro, exam, myWorld, myEnv, myEdit, myClear, resetAll, sticker, say, choose, focus, key, colFocus, pickT, pickPart, sWay, sBonus, parent, manual, manSet, nudge, check, quit, toggle };
window.G = G;

/* Offline: Service Worker speichert alle Dateien auf dem Gerät (braucht HTTPS oder localhost) */
if ('serviceWorker' in navigator) {
  const had = !!navigator.serviceWorker.controller; let reloaded = false;
  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(r => { try { r.update(); } catch (e) { /* egal */ } return navigator.serviceWorker.ready; }).then(() => { OFFLINE = true; const el = $('#offst'); if (el) el.style.display = ''; }).catch(() => {});
  /* neue Version ist da → Startseite sofort neu laden (nicht mitten in einer Aufgabe) */
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (had && !reloaded && (MODE === 'home' || MODE === 'hero')) { reloaded = true; location.reload(); } });
}
/* Browser bitten, den Spielstand nicht von selbst zu löschen */
try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {}); } catch (e) { /* egal */ }
/* localStorage leer, aber es gibt noch eine Kopie → Spielstand zurückholen */
if (!HAD_SAVE && window.caches) caches.open(MIRROR).then(c => c.match('save')).then(r => r && r.text()).then(j => { if (!j) return; const o = JSON.parse(j); if (!o || !o.hero || S.hero) return; localStorage.setItem(KEY, j); location.reload(); }).catch(() => {});
/* Start */
if (!W3.init($('#gl'))) document.body.classList.add('nogl');
(() => { // Tagesbonus
  const d = new Date(), today = d.toDateString(), y = new Date(d - 864e5).toDateString();
  if (S.last !== today) { S.days = S.last === y ? S.days + 1 : 1; S.last = today; const bonus = Math.min(S.days, 5) * 3; if (S.hero) { S.coins += bonus; setTimeout(() => toast(`🎁 Tagesbonus: +${bonus} 🪙${S.days > 1 ? ` · ${S.days} Tage in Folge!` : ''}`), 800); } save(); }
})();
home();
if (location.hash === '#reset') setTimeout(resetAll, 500);
