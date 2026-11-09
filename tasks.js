'use strict';
/* ===== Hilfsfunktionen ===== */
const NB = ' ';
const fmt = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, NB);
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = a => a[rnd(0, a.length - 1)];
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(0, i); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const B = s => `<b>${s}</b>`;
const KIDS = ['Leo', 'Mia', 'Sophie', 'Ben', 'Emma', 'Noah', 'Lina', 'Paul', 'Hanna', 'Finn'];
const twoKids = () => shuffle(KIDS).slice(0, 2);

const UNITS = {
  1000: { n: 'Tausender', k: 'T', nb: 'Nachbartausender', idx: 3 },
  10000: { n: 'Zehntausender', k: 'ZT', nb: 'Nachbarzehntausender', idx: 4 },
  100000: { n: 'Hunderttausender', k: 'HT', nb: 'Nachbarhunderttausender', idx: 5 },
};
const PLACE = ['E', 'Z', 'H', 'T', 'ZT', 'HT'];

/* Multiple Choice: mischt und entfernt doppelte Antworten */
function mc(q, correct, wrongs, explain, extra = {}) {
  const seen = new Set([String(correct)]);
  const w = [];
  for (const x of wrongs) { if (!seen.has(String(x))) { seen.add(String(x)); w.push(x); } }
  const n = extra.n || 4;
  const opts = shuffle([correct, ...w.slice(0, n - 1)]);
  return Object.assign({ type: 'choice', q, options: opts.map(String), correct: opts.indexOf(correct), explain }, extra);
}
/* Feste Reihenfolge (z.B. Stimmt / Stimmt nicht) */
function fixed(q, options, correct, explain, extra = {}) {
  return Object.assign({ type: 'choice', q, options, correct, explain }, extra);
}
const tf = (q, isTrue, explain, extra = {}, labels = ['Stimmt', 'Stimmt nicht']) =>
  fixed(q, labels, isTrue ? 0 : 1, explain, Object.assign({ two: true }, extra));

/* Stellenwerttafel */
function tafel(n, marks = {}) {
  const s = String(n).padStart(6, ' ').slice(-6);
  let h = '<table class="tafel"><tr>';
  for (let i = 5; i >= 0; i--) h += `<th class="${marks[i] || ''}">${PLACE[i]}</th>`;
  h += '</tr><tr>';
  [...s].forEach((c, j) => { h += `<td class="${marks[5 - j] || ''}">${c === ' ' ? '' : c}</td>`; });
  return h + '</tr></table>';
}

function randNum(u, tricky) {
  for (;;) {
    let n;
    if (tricky) {
      const d = [rnd(1, 9), pick([0, 9, rnd(0, 9)]), pick([0, 9, rnd(0, 9)]), pick([0, 9, 5, rnd(0, 9)]), rnd(0, 9), rnd(0, 9)];
      n = +d.join('');
    } else n = rnd(100001, 999998);
    if (n % u !== 0 && n % 1000 !== 0 && n > 100000) return n;
  }
}

/* Zahlwort */
function zahlwort(n) {
  const e = ['', 'ein', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn', 'elf', 'zwölf', 'dreizehn', 'vierzehn', 'fünfzehn', 'sechzehn', 'siebzehn', 'achtzehn', 'neunzehn'];
  const z = ['', '', 'zwanzig', 'dreißig', 'vierzig', 'fünfzig', 'sechzig', 'siebzig', 'achtzig', 'neunzig'];
  const u1000 = (m, end) => {
    let s = ''; const h = Math.floor(m / 100), r = m % 100;
    if (h) s += e[h] + 'hundert';
    if (r) { if (r < 20) s += (r === 1 && end) ? 'eins' : e[r]; else { const o = r % 10; s += (o ? e[o] + 'und' : '') + z[Math.floor(r / 10)]; } }
    return s;
  };
  const t = Math.floor(n / 1000), r = n % 1000;
  return (t ? u1000(t, false) + 'tausend' : '') + (r ? u1000(r, true) : '');
}

/* =====================================================
   WELT 1: Nachbarzahlen
   ===================================================== */
function nachbarExplain(n, u) {
  const U = UNITS[u], lo = Math.floor(n / u) * u, hi = lo + u;
  return `${tafel(n, { [U.idx]: 'hi' })}
  <p>Schau auf die ${B(U.k)}-Stelle. Sie bleibt stehen – alle Stellen <b>rechts davon</b> werden 0: ${B(fmt(lo))}.</p>
  <p>Der größere Nachbar ist genau ${fmt(u)} mehr: ${B(fmt(hi))}.</p>
  <p class="tip">💡 Die Nachbarn sind fast so groß wie die Zahl selbst. Sie haben (fast immer) gleich viele Stellen!</p>`;
}
const genNachbar = (u, tricky) => () => {
  const n = randNum(u, tricky), U = UNITS[u], lo = Math.floor(n / u) * u;
  return {
    type: 'fields', q: `Trage die ${B(U.nb)} ein.`,
    parts: [{ ans: lo }, ` &lt; ${fmt(n)} &lt; `, { ans: lo + u }],
    explain: nachbarExplain(n, u),
  };
};
const genNachbarWahl = u => () => {
  const n = randNum(u, true), U = UNITS[u], lo = Math.floor(n / u) * u, hi = lo + u;
  const lower = rnd(0, 1) === 0, c = lower ? lo : hi;
  const s = u / 10, b = u * 10;
  const wrongs = shuffle([lower ? hi : lo, Math.floor(n / s) * s, Math.floor(n / s) * s + s, lo / 10, hi / 10,
    Math.floor(n / b) * b, Math.floor(n / b) * b + b, lower ? lo - u : hi + u].filter(x => x > 0 && x !== c));
  return mc(`Welche Zahl ist der ${B(lower ? 'kleinere' : 'größere')} ${B(U.nb)} von ${B(fmt(n))}?`,
    fmt(c), wrongs.map(fmt), nachbarExplain(n, u));
};
const genNachbarDoppel = () => {
  const n = randNum(10000, true), t = Math.floor(n / 1000) * 1000, z = Math.floor(n / 10000) * 10000;
  return {
    type: 'fields', q: `Trage die Nachbarzahlen von ${B(fmt(n))} ein.`,
    parts: ['<span class="lbl">Nachbartausender:</span>', { ans: t }, ` &lt; ${fmt(n)} &lt; `, { ans: t + 1000 }, '<br>',
      '<span class="lbl">Nachbarzehntausender:</span>', { ans: z }, ` &lt; ${fmt(n)} &lt; `, { ans: z + 10000 }],
    explain: `${tafel(n, { 3: 'look', 4: 'hi' })}
    <p>${B('Tausender')}: T-Stelle bleibt, rechts davon Nullen → ${B(fmt(t))} und ${B(fmt(t + 1000))}.</p>
    <p>${B('Zehntausender')}: ZT-Stelle bleibt, rechts davon Nullen → ${B(fmt(z))} und ${B(fmt(z + 10000))}.</p>`,
  };
};
const genVorNach = () => {
  const base = pick([rnd(10, 99) * 10000, rnd(100, 999) * 1000, rnd(1, 9) * 100000, rnd(1000, 9999) * 100, rnd(100001, 999998)]);
  const nach = rnd(0, 1) === 0;
  const n = nach ? base - 1 : base;
  return {
    type: 'fields', q: `Wie heißt der ${B(nach ? 'Nachfolger' : 'Vorgänger')} von ${B(fmt(n))}?`,
    parts: [{ ans: nach ? n + 1 : n - 1 }],
    explain: `<p>Der ${nach ? 'Nachfolger ist immer 1 größer' : 'Vorgänger ist immer 1 kleiner'}: ${fmt(n)} ${nach ? '+' : '−'} 1 = ${B(fmt(nach ? n + 1 : n - 1))}.</p>`,
  };
};
const genRaetsel = () => {
  const [k] = twoKids();
  const t = rnd(0, 3);
  if (t === 0) {
    const st = pick([[4, 'vierstelligen'], [5, 'fünfstelligen']]);
    const big = Math.pow(10, st[0]) - 1;
    return { type: 'fields', q: `${k}: „Meine Zahl ist der ${B('Nachfolger')} der größten ${B(st[1])} Zahl.“<br>Wie heißt ${k}s Zahl?`, parts: [{ ans: big + 1 }],
      explain: `<p>Die größte ${st[1]} Zahl ist ${B(fmt(big))}. Der Nachfolger ist 1 größer: ${B(fmt(big + 1))}.</p>` };
  }
  if (t === 1) {
    const st = pick([[5, 'fünfstelligen'], [6, 'sechsstelligen']]);
    const small = Math.pow(10, st[0] - 1);
    return { type: 'fields', q: `${k}: „Meine Zahl ist der ${B('Vorgänger')} der kleinsten ${B(st[1])} Zahl.“<br>Wie heißt ${k}s Zahl?`, parts: [{ ans: small - 1 }],
      explain: `<p>Die kleinste ${st[1]} Zahl ist ${B(fmt(small))}. Der Vorgänger ist 1 kleiner: ${B(fmt(small - 1))}.</p>` };
  }
  const u = pick([100000, 10000, 1000]);
  const a = rnd(1, 8) * (u === 100000 ? u : u * rnd(2, 9) * (u === 1000 ? 10 : 1));
  const lo = Math.floor(a / u) * u, hi = lo + u, mid = lo + u / 2;
  return { type: 'fields', q: `${k}: „Meine Zahl liegt ${B('genau in der Mitte')} zwischen ${fmt(lo)} und ${fmt(hi)}.“<br>Wie heißt ${k}s Zahl?`, parts: [{ ans: mid }],
    explain: `<p>Von ${fmt(lo)} bis ${fmt(hi)} sind es ${fmt(u)}. Die Hälfte davon ist ${fmt(u / 2)}.</p><p>${fmt(lo)} + ${fmt(u / 2)} = ${B(fmt(mid))}</p>` };
};

/* =====================================================
   WELT 2: Zahlenstrahl
   ===================================================== */
function lineSVG(cfg, arrows = []) {
  const x0 = 55, x1 = 945, y = 118;
  const total = cfg.major * cfg.majors, n = cfg.majors * cfg.sub;
  const X = v => x0 + (v - cfg.start) / total * (x1 - x0);
  let s = `<svg class="zs" viewBox="0 0 1000 185" xmlns="http://www.w3.org/2000/svg">
  <line x1="${x0 - 30}" y1="${y}" x2="${x1 + 32}" y2="${y}" stroke="#1f2937" stroke-width="4" stroke-linecap="round"/>
  <path d="M${x1 + 42} ${y} l-16 -9 v18z" fill="#1f2937"/>`;
  for (let i = 0; i <= n; i++) {
    const x = x0 + i / n * (x1 - x0);
    const maj = i % cfg.sub === 0, half = cfg.sub % 2 === 0 && i % (cfg.sub / 2) === 0;
    const h = maj ? 20 : half ? 14 : 9;
    s += `<line x1="${x}" y1="${y - h}" x2="${x}" y2="${y + h}" stroke="#1f2937" stroke-width="${maj ? 4 : 2.5}" stroke-linecap="round"/>`;
    if (maj) s += `<text x="${x}" y="${y + 50}" text-anchor="middle" font-size="24" font-weight="700" fill="#1f2937">${fmt(cfg.start + i / cfg.sub * cfg.major)}</text>`;
  }
  for (const a of arrows) {
    const x = X(a.v), c = a.color || '#e11d48';
    s += `<g><line x1="${x}" y1="52" x2="${x}" y2="${y - 24}" stroke="${c}" stroke-width="4"/>
    <path d="M${x} ${y - 16} l-9 -15 h18z" fill="${c}"/>
    <circle cx="${x}" cy="32" r="22" fill="${c}"/><text x="${x}" y="41" text-anchor="middle" font-size="25" font-weight="800" fill="#fff">${a.label || ''}</text></g>`;
  }
  return s + '</svg>';
}
const LINES = {
  A: () => ({ start: rnd(10, 95) * 10000, major: 10000, sub: 10, majors: 4 }),
  B: () => ({ start: rnd(0, 5) * 100000, major: 100000, sub: 10, majors: 4 }),
  C: () => ({ start: rnd(10, 990) * 1000, major: 1000, sub: 10, majors: 4 }),
  D: () => ({ start: rnd(10, 95) * 10000, major: 10000, sub: 5, majors: 4 }),
  E: () => ({ start: rnd(10, 94) * 10000, major: 10000, sub: 2, majors: 5 }),
  F: () => ({ start: rnd(0, 5) * 100000, major: 100000, sub: 5, majors: 4 }),
};
function lineValue(cfg) {
  const n = cfg.majors * cfg.sub; let i;
  do { i = rnd(1, n - 1); } while (i % cfg.sub === 0);
  return cfg.start + i * cfg.major / cfg.sub;
}
function lineExplain(cfg, v, lab) {
  const step = cfg.major / cfg.sub, base = Math.floor(v / cfg.major) * cfg.major, k = (v - base) / step;
  return `${lineSVG(cfg, [{ v, label: lab, color: '#16a34a' }])}
  <p>Zwischen ${fmt(base)} und ${fmt(base + cfg.major)} liegen ${fmt(cfg.major)}. Das sind ${cfg.sub} Schritte, also ist jeder Schritt ${B(fmt(step))}.</p>
  <p>Starte bei ${fmt(base)} und gehe ${k} ${k === 1 ? 'Strich' : 'Striche'} weiter: ${fmt(base)} + ${k} · ${fmt(step)} = ${B(fmt(v))}.</p>`;
}
const genLineRead = key => () => {
  const cfg = LINES[key](), v = lineValue(cfg);
  return { type: 'fields', q: 'Bei welcher Zahl steht der Pfeil A?', visual: lineSVG(cfg, [{ v, label: 'A' }]),
    parts: ['A = ', { ans: v }], explain: lineExplain(cfg, v, 'A') };
};
const genLinePlace = key => () => {
  const cfg = LINES[key](), v = lineValue(cfg);
  return { type: 'line', q: `Setze den Pfeil B auf ${B(fmt(v))}. Tippe auf den richtigen Strich.`, line: cfg, ans: v, explain: lineExplain(cfg, v, 'B') };
};
const genLineStep = key => () => {
  const cfg = LINES[key](), step = cfg.major / cfg.sub;
  const wrongs = shuffle([step * 10, step / 10, step * 2, step / 2, step * 5, cfg.major].filter(x => x !== step && Number.isInteger(x)));
  return mc('Von Strich zu Strich sind es immer …', fmt(step), wrongs.map(fmt),
    `<p>Zwischen ${fmt(cfg.start)} und ${fmt(cfg.start + cfg.major)} liegen ${fmt(cfg.major)}. Zähle die Schritte dazwischen: ${cfg.sub}.</p><p>${fmt(cfg.major)} : ${cfg.sub} = ${B(fmt(step))}</p>`,
    { visual: lineSVG(cfg) });
};

/* =====================================================
   WELT 3: Runden
   ===================================================== */
const roundTo = (n, u) => Math.round(n / u) * u;
function rundNum(u) {
  for (;;) {
    let n = randNum(u, false);
    if (rnd(0, 2) === 0) { // entscheidende Ziffer 4 oder 5
      const s = u / 10, dig = Math.floor(n / s) % 10;
      n += (pick([4, 5]) - dig) * s;
    }
    if (n % u !== 0 && n > 100000 && n < 999000) return n;
  }
}
function rundExplain(n, u) {
  const U = UNITS[u], s = u / 10, dig = Math.floor(n / s) % 10, up = dig >= 5, r = roundTo(n, u);
  return `${tafel(n, { [U.idx]: 'hi', [U.idx - 1]: 'look' })}
  <p>Du rundest auf ${B(U.n)}. Schau auf die Ziffer ${B('rechts daneben')} (${PLACE[U.idx - 1]}-Stelle): ${B(dig)}.</p>
  <p>${dig} ist ${up ? '5 oder mehr → ' + B('aufrunden') : 'weniger als 5 → ' + B('abrunden')}: ${fmt(n)} ≈ ${B(fmt(r))}</p>
  <p class="tip">💡 0, 1, 2, 3, 4 → abrunden &nbsp;·&nbsp; 5, 6, 7, 8, 9 → aufrunden</p>`;
}
const genRunden = u => () => {
  const n = rundNum(u);
  return { type: 'fields', q: `Runde auf ${B(UNITS[u].n)}.`, parts: [`${fmt(n)} ≈ `, { ans: roundTo(n, u) }], explain: rundExplain(n, u) };
};
const genLeoRundet = u => () => {
  const n = rundNum(u), r = roundTo(n, u), lo = Math.floor(n / u) * u, wrong = r === lo ? lo + u : lo;
  const right = rnd(0, 1) === 0, [k] = twoKids();
  return tf(`${k} rundet ${B(fmt(n))} auf ${B(UNITS[u].n)} und sagt:<br>„${fmt(n)} ≈ ${fmt(right ? r : wrong)}“`, right, rundExplain(n, u), {}, [`${k} hat recht`, `${k} hat nicht recht`]);
};
const genRundenWahl = u => () => {
  const X = rnd(11, 98) * (u === 100000 ? 0 : 1) * u + (u === 100000 ? rnd(2, 8) * u : 0), h = u / 2;
  const c = X + pick([rnd(1, h - 1), -rnd(1, h)]);
  const w = [X + h, X - h - rnd(1, u / 10), X + h + rnd(1, u / 5), X - u + rnd(1, u / 10)];
  const all = [c, ...w];
  return mc(`Welche Zahl wird beim Runden auf ${B(UNITS[u].n)} zu ${B(fmt(X))}?`, fmt(c), w.map(fmt),
    `<p>Runde jede Zahl auf ${UNITS[u].n}:</p><ul>${all.sort((a, b) => a - b).map(v => `<li>${fmt(v)} ≈ ${roundTo(v, u) === X ? B(fmt(X)) + ' ✅' : fmt(roundTo(v, u))}</li>`).join('')}</ul>`);
};
const genRundGrenze = () => {
  const u = pick([1000, 10000]), X = rnd(11, 98) * u * (u === 1000 ? 10 : 1) + (u === 1000 ? rnd(1, 9) * 1000 : 0);
  const big = rnd(0, 1) === 0, ans = big ? X + u / 2 - 1 : X - u / 2;
  return { type: 'fields', q: `Welches ist die ${B(big ? 'größte' : 'kleinste')} Zahl, die auf ${B(UNITS[u].n)} gerundet ${B(fmt(X))} ergibt?`, parts: [{ ans }],
    explain: big
      ? `<p>Abgerundet wird, solange die Ziffer rechts neben der ${UNITS[u].k}-Stelle höchstens 4 ist. Die größte Zahl ist also ${B(fmt(ans))}.</p><p>Schon ${fmt(ans + 1)} wird aufgerundet zu ${fmt(X + u)}.</p>`
      : `<p>Aufgerundet wird ab der Ziffer 5 rechts neben der ${UNITS[u].k}-Stelle. Die kleinste Zahl ist also ${B(fmt(ans))}.</p><p>${fmt(ans - 1)} wird noch abgerundet zu ${fmt(X - u)}.</p>` };
};

/* =====================================================
   WELT 4: Kreis
   ===================================================== */
function kreisSVG(hi, o = {}) {
  const cx = 150, cy = 150, r = 112, RED = '#e11d48', INK = '#1f2937';
  const a = o.a != null ? o.a : -0.6, b = o.b != null ? o.b : 2.75;
  const P = (ang, rr = r) => [cx + rr * Math.cos(ang), cy + rr * Math.sin(ang)];
  let s = `<svg class="kreis" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff7ed" stroke="${hi === 'k' ? RED : INK}" stroke-width="${hi === 'k' ? 7 : 3.5}"/>`;
  if (hi === 'sehne') {
    const [p1, p2] = [P(o.s1), P(o.s2)];
    s += `<line x1="${p1[0]}" y1="${p1[1]}" x2="${p2[0]}" y2="${p2[1]}" stroke="${RED}" stroke-width="6" stroke-linecap="round"/>`;
  } else {
    if (!o.onlyD) { const p = P(a); s += `<line x1="${cx}" y1="${cy}" x2="${p[0]}" y2="${p[1]}" stroke="${hi === 'r' ? RED : INK}" stroke-width="${hi === 'r' ? 6 : 3}" stroke-linecap="round"/>`; }
    if (!o.onlyR) { const p1 = P(b), p2 = P(b + Math.PI); s += `<line x1="${p1[0]}" y1="${p1[1]}" x2="${p2[0]}" y2="${p2[1]}" stroke="${hi === 'd' ? RED : INK}" stroke-width="${hi === 'd' ? 6 : 3}" stroke-linecap="round"/>`; }
  }
  s += `<circle cx="${cx}" cy="${cy}" r="${hi === 'M' ? 10 : 5}" fill="${hi === 'M' ? RED : INK}"/>`;
  if (o.labelM) s += `<text x="${cx - 8}" y="${cy + 30}" font-size="22" font-weight="700" fill="${INK}">M</text>`;
  if (o.text) s += `<text x="150" y="292" text-anchor="middle" font-size="22" font-weight="800" fill="${INK}">${o.text}</text>`;
  return s + '</svg>';
}
const KNAMES = { M: 'Mittelpunkt', r: 'Radius', d: 'Durchmesser', k: 'Kreislinie' };
const KERKL = {
  M: 'Der <b>Mittelpunkt</b> liegt genau in der Mitte. Dort stichst du den Zirkel ein.',
  r: 'Der <b>Radius</b> geht vom Mittelpunkt bis zur Kreislinie.',
  d: 'Der <b>Durchmesser</b> geht von Kreislinie zu Kreislinie – genau durch den Mittelpunkt.',
  k: 'Die <b>Kreislinie</b> ist der Rand des Kreises.',
};
const genKreisTeil = () => {
  const hi = pick(['M', 'r', 'd', 'k']);
  const o = { a: Math.random() * 6.28, b: Math.random() * 3.14 };
  return mc('Wie heißt der rote Teil des Kreises?', KNAMES[hi], Object.keys(KNAMES).filter(k => k !== hi).map(k => KNAMES[k]),
    `<p>${KERKL[hi]}</p>`, { visual: kreisSVG(hi, o) });
};
const genSehne = () => {
  const isD = rnd(0, 1) === 0, s1 = Math.random() * 6.28;
  const s2 = isD ? s1 + Math.PI : s1 + pick([1.5, 1.9, 2.2, -1.6, -2.1]);
  return tf('Ist die rote Linie ein Durchmesser?', isD,
    `<p>${isD ? 'Ja! Die Linie geht von Kreislinie zu Kreislinie und <b>durch den Mittelpunkt</b>.' : 'Nein. Ein Durchmesser muss <b>durch den Mittelpunkt</b> gehen. Diese Linie geht am Mittelpunkt vorbei.'}</p>`,
    { visual: kreisSVG('sehne', { s1, s2, labelM: true }) }, ['Ja', 'Nein']);
};
const genRD = unit => () => {
  const r = unit === 'mm' ? rnd(12, 48) : rnd(2, 12), toD = rnd(0, 1) === 0;
  return toD
    ? { type: 'fields', q: `Ein Kreis hat den Radius ${B(`r = ${r} ${unit}`)}.<br>Wie lang ist der Durchmesser?`, parts: ['d = ', { ans: 2 * r }, ` ${unit}`],
      visual: kreisSVG('d', { b: 0, a: -1.1, text: `r = ${r} ${unit}` }),
      explain: `<p>Der Durchmesser ist ${B('doppelt so lang')} wie der Radius.</p><p>d = 2 · ${r} ${unit} = ${B(2 * r + ' ' + unit)}</p>` }
    : { type: 'fields', q: `Ein Kreis hat den Durchmesser ${B(`d = ${2 * r} ${unit}`)}.<br>Wie lang ist der Radius?`, parts: ['r = ', { ans: r }, ` ${unit}`],
      visual: kreisSVG('r', { b: 0, a: -1.1, text: `d = ${2 * r} ${unit}` }),
      explain: `<p>Der Radius ist ${B('halb so lang')} wie der Durchmesser.</p><p>r = ${2 * r} ${unit} : 2 = ${B(r + ' ' + unit)}</p>` };
};
const genRHalb = () => {
  const d = pick([3, 5, 7, 9, 11, 13]), r = (d / 2).toString().replace('.', ',');
  return mc(`Ein Kreis hat den Durchmesser ${B(`d = ${d} cm`)}. Wie lang ist der Radius?`, `${r} cm`,
    [`${d * 2} cm`, `${d} cm`, `${Math.floor(d / 2)} cm`, `${Math.ceil(d / 2)} cm`],
    `<p>Der Radius ist halb so lang wie der Durchmesser.</p><p>${d} cm : 2 = ${B(r + ' cm')} &nbsp;(${Math.floor(d / 2)} cm und 5 mm)</p>`);
};
const genKreisSatz = () => {
  const dFirst = rnd(0, 1) === 0;
  return dFirst
    ? mc('Der Durchmesser ist … so lang wie der Radius.', 'doppelt', ['halb', 'genau', 'dreimal'], '<p>d = 2 · r. Der Durchmesser ist <b>doppelt</b> so lang wie der Radius.</p>', { visual: kreisSVG('d', { b: 0, a: -1.1 }) })
    : mc('Der Radius ist … so lang wie der Durchmesser.', 'halb', ['doppelt', 'genau', 'dreimal'], '<p>r = d : 2. Der Radius ist <b>halb</b> so lang wie der Durchmesser.</p>', { visual: kreisSVG('r', { b: 0, a: -1.1 }) });
};
const genZirkel = () => {
  const r = rnd(2, 9), thing = pick(['einen Laternenboden', 'eine Uhr', 'ein Rad', 'eine Pizza aus Papier', 'einen Mond']);
  return { type: 'fields', q: `Du willst ${thing} zeichnen: einen Kreis mit ${B(`d = ${2 * r} cm`)}.<br>Wie weit musst du den Zirkel öffnen?`, parts: [{ ans: r }, ' cm'],
    explain: `<p>Der Zirkel wird immer auf den ${B('Radius')} eingestellt – von der Spitze (Mittelpunkt) bis zum Stift (Kreislinie).</p><p>r = ${2 * r} cm : 2 = ${B(r + ' cm')}</p>` };
};
function zweiKreise(k1, r1, k2, r2x2) { // r2x2 = Durchmesser des zweiten Kreises
  const sc = 7, R1 = r1 * sc, R2 = r2x2 / 2 * sc;
  const c = (x, R, col, name, txt) => `<circle cx="${x}" cy="105" r="${R}" fill="${col}22" stroke="${col}" stroke-width="4"/>
   <line x1="${x - R}" y1="105" x2="${x + R}" y2="105" stroke="${col}" stroke-width="3" stroke-dasharray="6 5"/><circle cx="${x}" cy="105" r="4" fill="${col}"/>
   <text x="${x}" y="212" text-anchor="middle" font-size="19" font-weight="800" fill="#1f2937">${name}: ${txt}</text>`;
  return `<svg class="zk" viewBox="0 0 440 222" xmlns="http://www.w3.org/2000/svg">${c(115, R1, '#2563eb', k1, 'd = ' + 2 * r1 + ' cm')}${c(325, R2, '#ea580c', k2, 'd = ' + r2x2 + ' cm')}</svg>`;
}
function vergleichData() {
  const [k1, k2] = twoKids(), r = rnd(3, 9);
  const d = 2 * r + pick([-3, -1, -1, 0, 1, 1, 3]);
  return { k1, k2, r, d };
}
function vergleichExplain({ k1, k2, r, d }) {
  const D1 = 2 * r;
  return `${zweiKreise(k1, r, k2, d)}
  <p>Achtung: ${k1} sagt den ${B('Radius')}, ${k2} den ${B('Durchmesser')}. Mach erst beides gleich!</p>
  <p>${k1}: r = ${r} cm → d = 2 · ${r} cm = ${B(D1 + ' cm')}<br>${k2}: d = ${B(d + ' cm')}</p>
  <p>${D1 > d ? `${D1} cm &gt; ${d} cm → ${B(k1 + 's Kreis ist größer')}.` : D1 < d ? `${D1} cm &lt; ${d} cm → ${B(k2 + 's Kreis ist größer')}.` : `${D1} cm = ${d} cm → ${B('Beide Kreise sind gleich groß')}.`}</p>`;
}
const genVergleich = () => {
  const v = vergleichData(), D1 = 2 * v.r;
  return fixed(`${v.k1} zeichnet einen Kreis mit ${B(`r = ${v.r} cm`)}.<br>${v.k2} zeichnet einen Kreis mit ${B(`d = ${v.d} cm`)}.<br>Wessen Kreis ist größer?`,
    [`${v.k1}s Kreis`, `${v.k2}s Kreis`, 'Beide sind gleich groß'], D1 > v.d ? 0 : D1 < v.d ? 1 : 2, vergleichExplain(v));
};
const genLeoKreis = () => {
  let v; do { v = vergleichData(); } while (v.d <= v.r || v.d === 2 * v.r);
  const right = v.d > 2 * v.r;
  return tf(`${v.k1} zeichnet einen Kreis mit ${B(`r = ${v.r} cm`)}. ${v.k2} zeichnet einen Kreis mit ${B(`d = ${v.d} cm`)}.<br>${v.k2}: „Mein Kreis ist größer als ${v.k1}s Kreis.“`,
    right, vergleichExplain(v), {}, [`${v.k2} hat recht`, `${v.k2} hat nicht recht`]);
};
const genBegruendung = () => {
  let v; do { v = vergleichData(); } while (v.d <= v.r || v.d >= 2 * v.r);
  const { k1, k2, r, d } = v;
  return mc(`${k1}: Kreis mit ${B(`r = ${r} cm`)}. ${k2}: Kreis mit ${B(`d = ${d} cm`)}.<br>Welche Begründung ist richtig?`,
    `${k1}: r = ${r} cm, also d = ${2 * r} cm. ${2 * r} cm ist mehr als ${d} cm. ${k1}s Kreis ist größer.`,
    [`${d} ist mehr als ${r}. ${k2}s Kreis ist größer.`,
      `${d} − ${r} = ${d - r}. ${k2}s Kreis ist ${d - r} cm größer.`,
      `${k2}: d = ${d} cm, also r = ${2 * d} cm. ${k2}s Kreis ist größer.`],
    vergleichExplain(v), { long: true });
};
const genKreisQuadrat = () => {
  const r = rnd(3, 8), side = 2 * r + pick([-3, -2, -1, 0, 1, 2, 3]), fits = 2 * r <= side;
  return tf(`Passt ein Kreis mit ${B(`r = ${r} cm`)} in ein Quadrat mit ${B(`${side} cm`)} Seitenlänge?`, fits,
    `<p>Der Kreis ist so breit wie sein ${B('Durchmesser')}: d = 2 · ${r} cm = ${B(2 * r + ' cm')}.</p><p>${2 * r} cm ${2 * r < side ? '&lt;' : 2 * r === side ? '=' : '&gt;'} ${side} cm → ${fits ? 'Er passt' + (2 * r === side ? ' ganz genau' : '') + ' hinein.' : 'Er passt nicht hinein.'}</p>`, {}, ['Ja, er passt', 'Nein, er passt nicht']);
};

/* =====================================================
   WELT 5: Vierecke
   ===================================================== */
const SHAPES = [
  { id: 'quadrat', name: 'Quadrat', v: [[-52, -52], [52, -52], [52, 52], [-52, 52]], pairs: [[0, 2], [1, 3]] },
  { id: 'rechteck', name: 'Rechteck', v: [[-75, -40], [75, -40], [75, 40], [-75, 40]], pairs: [[0, 2], [1, 3]] },
  { id: 'pgramm', name: 'Parallelogramm', v: [[-70, 40], [40, 40], [70, -40], [-40, -40]], pairs: [[0, 2], [1, 3]] },
  { id: 'raute', name: 'Raute', v: [[0, -65], [48, 0], [0, 65], [-48, 0]], pairs: [[0, 2], [1, 3]] },
  { id: 'trapez1', name: 'Trapez', v: [[-72, 40], [72, 40], [34, -40], [-34, -40]], pairs: [[0, 2]] },
  { id: 'trapez2', name: 'Trapez', v: [[-60, 42], [72, 42], [18, -42], [-60, -42]], pairs: [[0, 2]] },
  { id: 'trapez3', name: 'Trapez', v: [[-74, 40], [62, 40], [52, -40], [-8, -40]], pairs: [[0, 2]] },
  { id: 'drachen', name: 'Drachenviereck', v: [[0, -68], [42, -18], [0, 68], [-42, -18]], pairs: [] },
  { id: 'allg1', name: 'Viereck ohne parallele Seiten', v: [[-60, 50], [70, 25], [30, -55], [-40, -15]], pairs: [] },
  { id: 'allg2', name: 'Viereck ohne parallele Seiten', v: [[-65, 35], [55, 55], [60, -45], [-20, -30]], pairs: [] },
];
const PAARLABEL = ['keine parallelen Seiten', 'genau ein Paar paralleler Seiten', 'zwei Paare paralleler Seiten'];
function shapeSVG(sh, rot = 0, mirror = false, colored = false, cls = 'shape') {
  const c = Math.cos(rot), s = Math.sin(rot);
  const pts = sh.v.map(([x, y]) => { if (mirror) x = -x; return [110 + x * c - y * s, 100 + x * s + y * c]; });
  let o = `<svg class="${cls}" viewBox="0 0 220 200" xmlns="http://www.w3.org/2000/svg"><polygon points="${pts.map(p => p.map(v => v.toFixed(1)).join(',')).join(' ')}" fill="#fde68a" stroke="#1f2937" stroke-width="4" stroke-linejoin="round"/>`;
  if (colored) {
    const cols = ['#2563eb', '#ea580c'];
    sh.pairs.forEach((pr, i) => pr.forEach(k => { const a = pts[k], b = pts[(k + 1) % 4]; o += `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${cols[i]}" stroke-width="8" stroke-linecap="round"/>`; }));
  }
  return o + '</svg>';
}
const randRot = lvl => lvl === 0 ? pick([0, 0, Math.PI / 2]) : lvl === 1 ? pick([0, 0.35, -0.35, Math.PI / 2, 0.8]) : Math.random() * 6.28;
function paarExplain(sh, rot, mir) {
  const n = sh.pairs.length;
  const t = n === 2 ? `Die blauen Seiten sind parallel <b>und</b> die orangen Seiten sind parallel: ${B('zwei Paare')}.`
    : n === 1 ? `Nur die blauen Seiten sind parallel. Die anderen beiden laufen aufeinander zu: ${B('genau ein Paar')}.`
      : `Keine Seiten sind parallel – verlängert würden sich alle irgendwann treffen: ${B('keine parallelen Seiten')}.`;
  return `${shapeSVG(sh, rot, mir, true)}<p>${t}</p><p>Das ist ein ${B(sh.name)}.</p>
  <p class="tip">💡 Parallele Seiten haben überall den gleichen Abstand – wie Schienen. „Genau ein Paar“ heißt: eins, nicht zwei!</p>`;
}
const genPaare = lvl => () => {
  const n = rnd(0, 2), sh = pick(SHAPES.filter(s => s.pairs.length === n)), rot = randRot(lvl), mir = rnd(0, 1) === 1;
  return fixed('Wie viele Paare paralleler Seiten hat dieses Viereck?', ['zwei Paare', 'genau ein Paar', 'keine parallelen Seiten'], 2 - n,
    paarExplain(sh, rot, mir), { visual: shapeSVG(sh, rot, mir) });
};
const genWelches = lvl => () => {
  const n = rnd(0, 2);
  const good = pick(SHAPES.filter(s => s.pairs.length === n));
  const bad = shuffle(SHAPES.filter(s => s.pairs.length !== n)).slice(0, 3);
  const all = shuffle([good, ...bad]).map(sh => ({ sh, rot: randRot(lvl), mir: rnd(0, 1) === 1 }));
  return { type: 'choice', q: `Welches Viereck hat ${B(PAARLABEL[n])}?`, grid: true,
    options: all.map(a => shapeSVG(a.sh, a.rot, a.mir, false, 'shape small')), correct: all.findIndex(a => a.sh === good),
    explain: `<div class="row4">${all.map(a => `<div>${shapeSVG(a.sh, a.rot, a.mir, true, 'shape small')}<small>${['kein Paar', 'ein Paar', 'zwei Paare'][a.sh.pairs.length]}</small></div>`).join('')}</div><p>Parallele Seiten sind farbig markiert.</p>` };
};
const AUSSAGEN = [
  ['Ein Rechteck hat zwei Paare paralleler Seiten.', true, 'Oben und unten sind parallel, links und rechts auch.', 'rechteck'],
  ['Ein Quadrat hat genau ein Paar paralleler Seiten.', false, 'Ein Quadrat hat <b>zwei</b> Paare paralleler Seiten.', 'quadrat'],
  ['Ein Parallelogramm hat zwei Paare paralleler Seiten.', true, 'Daher kommt der Name: Gegenüberliegende Seiten sind parallel.', 'pgramm'],
  ['Ein Trapez hat genau ein Paar paralleler Seiten.', true, 'Nur zwei Seiten sind parallel, die anderen beiden laufen schräg aufeinander zu.', 'trapez1'],
  ['Jedes Viereck hat parallele Seiten.', false, 'Es gibt Vierecke ganz ohne parallele Seiten, z.&nbsp;B. das Drachenviereck.', 'drachen'],
  ['Ein Viereck mit zwei Paaren paralleler Seiten hat auch „genau ein Paar“.', false, '„Genau ein Paar“ heißt: <b>eins und nicht mehr</b>. Zwei Paare sind nicht genau eins.', 'pgramm'],
  ['Im Rechteck stehen benachbarte Seiten senkrecht aufeinander.', true, 'Alle vier Ecken im Rechteck sind rechte Winkel.', 'rechteck'],
  ['Im Parallelogramm sind gegenüberliegende Seiten gleich lang.', true, 'Gegenüberliegende Seiten sind parallel und gleich lang.', 'pgramm'],
  ['Eine Raute hat keine parallelen Seiten.', false, 'Die Raute hat <b>zwei</b> Paare paralleler Seiten – sie ist ein schiefes Quadrat.', 'raute'],
  ['Ein Drachenviereck hat zwei Paare paralleler Seiten.', false, 'Beim Drachenviereck ist keine Seite parallel zu einer anderen.', 'drachen'],
];
const genAussage = () => {
  const a = pick(AUSSAGEN), sh = SHAPES.find(s => s.id === a[3]);
  return tf(`Stimmt das?<br>„${a[0]}“`, a[1], `${shapeSVG(sh, 0, false, true)}<p>${a[2]}</p>`);
};

/* =====================================================
   WELT 6: Parallel und senkrecht
   ===================================================== */
const DIRS = [[1, 0], [0, 1], [1, 1], [1, -1], [2, 1], [1, 2], [2, -1], [1, -2], [3, 1], [1, 3], [3, -1], [1, -3]];
const ang = d => Math.atan2(d[1], d[0]) * 180 / Math.PI;
const angDiff = (a, b) => { let x = Math.abs(ang(a) - ang(b)) % 180; return Math.min(x, 180 - x); };
const perp = d => [-d[1], d[0]];
const neitherDir = d => pick(DIRS.filter(e => angDiff(e, d) >= 17 && angDiff(e, perp(d)) >= 17));
function planSVG(lines) {
  const C = 40, W = 16, H = 10;
  let s = `<svg class="plan" viewBox="0 0 ${W * C} ${H * C}" xmlns="http://www.w3.org/2000/svg"><rect width="${W * C}" height="${H * C}" fill="#fffdf5"/>`;
  for (let i = 0; i <= W; i++) s += `<line x1="${i * C}" y1="0" x2="${i * C}" y2="${H * C}" stroke="#cbd5e1" stroke-width="1"/>`;
  for (let j = 0; j <= H; j++) s += `<line x1="0" y1="${j * C}" x2="${W * C}" y2="${j * C}" stroke="#cbd5e1" stroke-width="1"/>`;
  const placed = [];
  for (const l of lines) {
    const len = Math.hypot(l.d[0], l.d[1]), u = [l.d[0] / len, l.d[1] / len];
    const inside = (x, y) => x >= 0.9 && x <= W - 0.9 && y >= 0.9 && y <= H - 0.9;
    const ext = sg => { let t = 0; while (t < (l.half || 5) && inside(l.c[0] + sg * (t + 0.1) * u[0], l.c[1] + sg * (t + 0.1) * u[1])) t += 0.1; return t; };
    const t1 = ext(-1), t2 = ext(1);
    const a = [l.c[0] - t1 * u[0], l.c[1] - t1 * u[1]], b = [l.c[0] + t2 * u[0], l.c[1] + t2 * u[1]];
    const col = l.color || '#475569';
    s += `<line x1="${a[0] * C}" y1="${a[1] * C}" x2="${b[0] * C}" y2="${b[1] * C}" stroke="${col}" stroke-width="${l.color ? 6 : 4.5}" stroke-linecap="round"/>`;
    const cands = [[b[0] + 0.5 * u[0], b[1] + 0.5 * u[1]], [a[0] - 0.5 * u[0], a[1] - 0.5 * u[1]]];
    const free = p => Math.min(99, ...placed.map(q => Math.hypot(p[0] - q[0], p[1] - q[1])));
    const best = free(cands[0]) >= free(cands[1]) ? cands[0] : cands[1];
    placed.push(best);
    const lx = best[0] * C, ly = best[1] * C;
    s += `<circle cx="${lx}" cy="${ly}" r="15" fill="#fff" stroke="${col}" stroke-width="2.5"/><text x="${lx}" y="${ly + 7}" text-anchor="middle" font-size="21" font-style="italic" font-weight="800" fill="${col}">${l.name}</text>`;
  }
  return s + '</svg>';
}
function offsetFor(d) { // ganzzahliger Versatz ungefähr senkrecht zur Richtung
  const len = Math.hypot(d[0], d[1]);
  let o = [Math.round(-d[1] / len * 1.8), Math.round(d[0] / len * 1.8)];
  if (o[0] * d[1] - o[1] * d[0] === 0) o = [-d[1], d[0]];
  return o;
}
const REL = ['parallel', 'senkrecht zueinander', 'weder parallel noch senkrecht'];
const RELERKL = [
  'Die Linien haben überall den <b>gleichen Abstand</b> und treffen sich nie – sie sind <b>parallel</b>.',
  'Die Linien bilden einen <b>rechten Winkel</b> (wie die Ecke am Geodreieck) – sie sind <b>senkrecht</b> zueinander.',
  'Die Linien laufen schräg aufeinander zu. Sie sind <b>nicht parallel</b> (der Abstand ändert sich) und bilden <b>keinen rechten Winkel</b>.',
];
const kaestchen = d => d[1] === 0 ? 'genau waagerecht' : d[0] === 0 ? 'genau von oben nach unten' : `${Math.abs(d[0])} Kästchen zur Seite und ${Math.abs(d[1])} nach ${(d[0] * d[1] > 0) ? 'unten' : 'oben'}`;
const genZweiLinien = lvl => () => {
  const d = lvl === 0 ? pick(DIRS.slice(0, 4)) : pick(DIRS), rel = rnd(0, 2);
  const d2 = rel === 0 ? d : rel === 1 ? perp(d) : neitherDir(d);
  const o = offsetFor(d), names = shuffle(['g', 'h', 'k', 'l', 'm']).slice(0, 2);
  const sh = rel === 0 ? [0, 0] : [rnd(-2, 2), 0];
  const lines = [{ name: names[0], c: [8 - o[0], 5 - o[1]], d, color: '#2563eb', half: 4.5 },
    { name: names[1], c: [8 + o[0] + sh[0], 5 + o[1]], d: d2, color: '#ea580c', half: rel === 0 ? 4.5 : 3.5 }];
  return fixed(`Wie liegen die Linien ${B(names[0])} und ${B(names[1])} zueinander?`, REL, rel,
    `<p>${RELERKL[rel]}</p><p class="tip">💡 Zähle Kästchen: ${names[0]} läuft ${kaestchen(d)}, ${names[1]} läuft ${kaestchen(d2)}.</p>`, { visual: planSVG(lines) });
};
const genStadtplan = () => {
  const d = pick(DIRS), o = offsetFor(d), p = perp(d), nd = neitherDir(d);
  const nm = shuffle(['g', 'h', 'k', 'l', 'm']);
  const len = Math.hypot(d[0], d[1]), u = [d[0] / len, d[1] / len];
  const L = [
    { name: nm[0], c: [8 - o[0], 5 - o[1]], d },
    { name: nm[1], c: [8 + o[0], 5 + o[1]], d },
    { name: nm[2], c: [8 + Math.round(u[0] * 3), 5 + Math.round(u[1] * 3)], d: p },
    { name: nm[3], c: [8 - Math.round(u[0] * 4), 5 - Math.round(u[1] * 3)], d: nd },
  ];
  // Paar (i,j) mit echter Beziehung: 0 parallel, 1 senkrecht, 2 weder
  const pairs = [[0, 1, 0], [2, 0, 1], [2, 1, 1], [3, 0, 2], [3, 1, 2], [3, 2, 2]];
  const [i, j, rel] = pick([pairs[0], pairs[0], pairs[1], pairs[2], pairs[3], pairs[4], pairs[5]]);
  const claim = rel === 2 ? rnd(0, 1) : (rnd(0, 2) === 0 ? 1 - rel : rel);
  L[i].color = '#2563eb'; L[j].color = '#ea580c';
  return tf(`Stadtplan: Die Linien sind Straßen.<br>„${B(L[i].name)} ist ${B(claim === 0 ? 'parallel' : 'senkrecht')} zu ${B(L[j].name)}.“`, claim === rel,
    `<p>${RELERKL[rel]}</p><p class="tip">💡 Zähle Kästchen: ${L[i].name} läuft ${kaestchen(L[i].d)}, ${L[j].name} läuft ${kaestchen(L[j].d)}.</p>`, { visual: planSVG(L) });
};
/* Parallelogramm ergänzen */
function gridSVG(g, sel, reveal) {
  const C = 50, W = 12, H = 8, P = p => [p[0] * C, p[1] * C];
  let s = `<svg class="gitter" viewBox="-25 -25 ${W * C + 50} ${H * C + 50}" xmlns="http://www.w3.org/2000/svg"><rect x="-25" y="-25" width="${W * C + 50}" height="${H * C + 50}" fill="#fffdf5"/>`;
  for (let i = 0; i <= W; i++) s += `<line x1="${i * C}" y1="0" x2="${i * C}" y2="${H * C}" stroke="#cbd5e1" stroke-width="1.5"/>`;
  for (let j = 0; j <= H; j++) s += `<line x1="0" y1="${j * C}" x2="${W * C}" y2="${j * C}" stroke="#cbd5e1" stroke-width="1.5"/>`;
  const seg = (a, b, col, dash) => { const [x1, y1] = P(a), [x2, y2] = P(b); return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col}" stroke-width="5" stroke-linecap="round" ${dash ? 'stroke-dasharray="10 8"' : ''}/>`; };
  if (reveal) s += `<polygon points="${[g.A, g.B, g.C, g.D].map(p => P(p).join(',')).join(' ')}" fill="#bbf7d0" opacity=".7"/>` + seg(g.B, g.C, '#16a34a') + seg(g.D, g.C, '#16a34a');
  s += seg(g.A, g.B, '#1f2937') + seg(g.A, g.D, '#1f2937');
  if (sel && !(reveal && sel[0] === g.C[0] && sel[1] === g.C[1])) {
    s += seg(g.B, sel, reveal ? '#e11d48' : '#2563eb', true) + seg(g.D, sel, reveal ? '#e11d48' : '#2563eb', true);
    const [x, y] = P(sel); s += `<circle cx="${x}" cy="${y}" r="11" fill="${reveal ? '#e11d48' : '#2563eb'}"/>`;
  }
  const dot = (p, name, col = '#1f2937') => { const [x, y] = P(p); return `<circle cx="${x}" cy="${y}" r="8" fill="${col}"/><text x="${x - 20}" y="${y + (name === 'A' || name === 'B' ? 30 : -14)}" font-size="26" font-weight="800" fill="${col}">${name}</text>`; };
  s += dot(g.A, 'A') + dot(g.B, 'B') + dot(g.D, 'D');
  if (reveal) s += dot(g.C, 'C', '#16a34a');
  return s + '</svg>';
}
const genPgramm = () => {
  for (;;) {
    const A = [rnd(1, 5), rnd(4, 7)], u = [rnd(3, 6), rnd(-1, 1)], v = [rnd(-2, 3), -rnd(2, 4)];
    const Bp = [A[0] + u[0], A[1] + u[1]], D = [A[0] + v[0], A[1] + v[1]], C = [Bp[0] + v[0], Bp[1] + v[1]];
    if (![A, Bp, C, D].every(p => p[0] >= 1 && p[0] <= 11 && p[1] >= 1 && p[1] <= 7)) continue;
    const g = { A, B: Bp, C, D };
    const side = v[0] === 0 ? '' : `${Math.abs(v[0])} Kästchen nach ${v[0] > 0 ? 'rechts' : 'links'} und `;
    return { type: 'grid', q: `Tippe auf den Punkt ${B('C')}, sodass ${B('ABCD')} ein Parallelogramm wird.`, grid: g, ans: C,
      explain: `<p>Im Parallelogramm ist BC parallel zu AD und DC parallel zu AB.</p><p>Von A nach D geht es ${side}${Math.abs(v[1])} Kästchen nach oben. Gehe von ${B('B')} aus genau gleich – dort liegt ${B('C')}.</p>` };
  }
};

/* =====================================================
   WELT 7: Klassenarbeit-Mix (zusätzliche Aufgaben)
   ===================================================== */
function niceNum() { for (;;) { const d = [rnd(1, 9), pick([0, rnd(1, 9)]), rnd(0, 9), pick([0, rnd(1, 9)]), pick([0, rnd(1, 9)]), rnd(1, 9)]; const n = +d.join(''); if (n % 1000 && Math.floor(n / 1000) % 100) return n; } }
const genWort = () => { const n = niceNum(); return { type: 'fields', q: `Schreibe die Zahl mit Ziffern:<br><span class="wort">${zahlwort(n)}</span>`, parts: [{ ans: n }], explain: `${tafel(n)}<p>${B(zahlwort(Math.floor(n / 1000) * 1000))} → ${fmt(Math.floor(n / 1000) * 1000)}<br>${B(zahlwort(n % 1000))} → ${n % 1000}</p><p>Zusammen: ${B(fmt(n))}. Wo nichts genannt wird, steht eine 0.</p>` }; };
const genStellen = () => {
  const n = niceNum(), s = String(n);
  const txt = [...s].map((c, i) => c === '0' ? '' : `${c}${NB}${PLACE[5 - i]}`).filter(Boolean).join(' &nbsp; ');
  return { type: 'fields', q: `Schreibe die Zahl mit Ziffern:<br><span class="wort">${txt}</span>`, parts: [{ ans: n }], explain: `${tafel(n)}<p>Trage jede Ziffer in ihre Spalte ein. Leere Spalten bekommen eine ${B('0')}.</p>` };
};
const genSumme = () => {
  const n = niceNum(), s = String(n);
  const txt = [...s].map((c, i) => c === '0' ? '' : fmt(+c * Math.pow(10, 5 - i))).filter(Boolean).join(' + ');
  return { type: 'fields', q: `Welche Zahl ist das?<br><span class="wort">${txt}</span>`, parts: [{ ans: n }], explain: `${tafel(n)}<p>Jeder Teil gehört in seine Spalte. Leere Spalten bekommen eine ${B('0')}.</p>` };
};
const genOrdnen = () => {
  const a = rnd(1, 8), b = rnd(1, 9), c = rnd(0, 8), small = rnd(0, 1) === 0;
  const set = new Set([a * 100000 + b * 10000 + c * 1000 + rnd(100, 999), a * 100000 + c * 10000 + b * 1000 + rnd(100, 999), a * 100000 + b * 10000 + (c + 1) * 1000 + rnd(10, 99), (a + 1) * 100000 + rnd(0, 9999), a * 100000 + b * 10000 + c * 1000 + rnd(10, 99)]);
  const nums = shuffle([...set]).slice(0, 4), sorted = nums.slice().sort((x, y) => x - y);
  const ans = small ? sorted[0] : sorted[sorted.length - 1];
  return mc(`Welche Zahl ist die ${B(small ? 'kleinste' : 'größte')}?`, fmt(ans), nums.filter(x => x !== ans).map(fmt),
    `<p>Vergleiche von links nach rechts: erst HT, dann ZT, dann T …</p><p>${sorted.map(fmt).join(' &lt; ')}</p>`);
};

/* =====================================================
   TIERE UND WELTEN
   ===================================================== */
const ANIMALS = {
  eichhoernchen: ['Eichhörnchen', 'Eichhörnchen verstecken im Herbst tausende Nüsse – und finden viele mit der Nase wieder.'],
  igel: ['Igel', 'Ein Igel hat etwa 6 000 bis 8 000 Stacheln.'],
  fuchs: ['Rotfuchs', 'Füchse hören eine Maus sogar unter einer dicken Schneedecke.'],
  erdmaennchen: ['Erdmännchen', 'Erdmännchen halten abwechselnd Wache, während die anderen fressen.'],
  giraffe: ['Giraffe', 'Giraffen haben nur 7 Halswirbel – genauso viele wie du!'],
  loewe: ['Löwe', 'Das Brüllen eines Löwen hört man bis zu 8 km weit.'],
  pinguin: ['Pinguin', 'Pinguine können nicht fliegen – aber unter Wasser sind sie pfeilschnell.'],
  robbe: ['Robbe', 'Manche Robben können über 30 Minuten lang tauchen, ohne Luft zu holen.'],
  eisbaer: ['Eisbär', 'Unter dem weißen Fell ist die Haut des Eisbären schwarz.'],
  clownfisch: ['Clownfisch', 'Clownfische wohnen in Seeanemonen. Deren Gift macht ihnen nichts aus.'],
  schildkroete: ['Meeresschildkröte', 'Meeresschildkröten legen ihre Eier an dem Strand, an dem sie selbst geschlüpft sind.'],
  delfin: ['Delfin', 'Delfine schlafen immer nur mit einer Gehirnhälfte – die andere passt auf.'],
  faultier: ['Faultier', 'Faultiere sind so langsam, dass in ihrem Fell Algen wachsen.'],
  tukan: ['Tukan', 'Der riesige Schnabel des Tukans ist federleicht.'],
  tiger: ['Tiger', 'Jeder Tiger hat sein eigenes Streifenmuster – wie ein Fingerabdruck.'],
  alpaka: ['Alpaka', 'Alpakas summen, wenn sie neugierig oder zufrieden sind.'],
  schneeeule: ['Schnee-Eule', 'Eulen können ihren Kopf fast ganz herumdrehen – um 270 Grad.'],
  schneeleopard: ['Schneeleopard', 'Schneeleoparden benutzen ihren dicken Schwanz als Schal.'],
  roterpanda: ['Roter Panda', 'Rote Pandas wickeln sich beim Schlafen in ihren buschigen Schwanz.'],
  koala: ['Koala', 'Koalas schlafen bis zu 20 Stunden am Tag.'],
  quokka: ['Quokka', 'Quokkas sehen aus, als würden sie immer lächeln.'],
};

const WORLDS = [
  { id: 'wald', name: 'Zahlenwald', topic: 'Nachbarzahlen', icon: '🌲', color: '#15803d', animals: ['eichhoernchen', 'igel', 'fuchs'],
    rule: `<b>Nachbarzahlen:</b> Zwischen welchen Tausendern, Zehntausendern oder Hunderttausendern liegt die Zahl?<br>Beispiel 347&nbsp;280: Nachbar<u>zehn</u>tausender sind <b>340&nbsp;000</b> und <b>350&nbsp;000</b>.`,
    levels: [
      [genNachbar(1000), genNachbar(1000), genVorNach, genNachbarWahl(1000)],
      [genNachbar(10000), genNachbarWahl(10000), genNachbar(10000, true), genNachbar(1000, true)],
      [genNachbar(100000), genNachbarDoppel, genRaetsel, genNachbarWahl(100000), genNachbar(10000, true), genNachbarDoppel, genRaetsel, genNachbar(100000, true)],
    ] },
  { id: 'savanne', name: 'Zahlenstrahl-Savanne', topic: 'Zahlenstrahl', icon: '🦒', color: '#b45309', animals: ['erdmaennchen', 'giraffe', 'loewe'],
    rule: `<b>Zahlenstrahl:</b> Finde zuerst heraus, wie groß ein Schritt von Strich zu Strich ist. Dann zähle vom letzten beschrifteten Strich weiter.`,
    levels: [
      [genLineStep('A'), genLineRead('A'), genLineRead('A'), genLinePlace('A')],
      [genLinePlace('A'), genLineRead('B'), genLinePlace('B'), genLineStep('C'), genLineRead('C'), genLinePlace('C')],
      [genLineStep('D'), genLineRead('D'), genLinePlace('D'), genLineStep('E'), genLineRead('E'), genLinePlace('F'), genLineRead('F'), genLinePlace('A')],
    ] },
  { id: 'eis', name: 'Rundungs-Eismeer', topic: 'Runden', icon: '🧊', color: '#0369a1', animals: ['pinguin', 'robbe', 'eisbaer'],
    rule: `<b>Runden:</b> Schau auf die Ziffer <u>rechts</u> neben der Rundungsstelle.<br>0–4 → abrunden &nbsp;·&nbsp; 5–9 → aufrunden. Alles rechts davon wird 0.`,
    levels: [
      [genRunden(1000), genRunden(1000), genLeoRundet(1000), genRunden(10000)],
      [genRunden(10000), genRunden(100000), genLeoRundet(10000), genRundenWahl(1000), genRunden(10000), genLeoRundet(100000)],
      [genRunden(100000), genRundenWahl(10000), genRundGrenze, genLeoRundet(100000), genRunden(10000), genRundenWahl(100000), genRundGrenze, genRunden(1000)],
    ] },
  { id: 'ozean', name: 'Kreis-Riff', topic: 'Kreis: Radius & Durchmesser', icon: '🐠', color: '#0e7490', animals: ['clownfisch', 'schildkroete', 'delfin'],
    rule: `<b>Kreis:</b> Der Radius <i>r</i> geht vom Mittelpunkt zur Kreislinie. Der Durchmesser <i>d</i> geht einmal quer durch den Mittelpunkt.<br><b>d = 2 · r</b> &nbsp;und&nbsp; <b>r = d : 2</b>. Vergleiche Kreise nur mit gleichen Maßen!`,
    levels: [
      [genKreisTeil, genRD('cm'), genKreisTeil, genKreisSatz, genRD('cm'), genSehne],
      [genRD('mm'), genZirkel, genSehne, genRHalb, genVergleich, genRD('cm'), genKreisSatz, genZirkel],
      [genVergleich, genLeoKreis, genBegruendung, genKreisQuadrat, genVergleich, genRHalb, genLeoKreis, genZirkel],
    ] },
  { id: 'dschungel', name: 'Vierecks-Dschungel', topic: 'Vierecke & parallele Seiten', icon: '🦜', color: '#4d7c0f', animals: ['faultier', 'tukan', 'tiger'],
    rule: `<b>Vierecke:</b> Suche Seiten, die parallel sind (gleicher Abstand, wie Schienen).<br>Zwei Paare (z.&nbsp;B. Rechteck, Parallelogramm) · genau ein Paar (Trapez) · keine (z.&nbsp;B. Drachen).`,
    levels: [
      [genPaare(0)],
      [genPaare(1), genPaare(1), genWelches(1), genAussage],
      [genPaare(2), genWelches(2), genAussage, genPaare(2)],
    ] },
  { id: 'berge', name: 'Linien-Gebirge', topic: 'Parallel & senkrecht', icon: '⛰️', color: '#6d28d9', animals: ['alpaka', 'schneeeule', 'schneeleopard'],
    rule: `<b>Parallel:</b> gleicher Abstand, treffen sich nie.<br><b>Senkrecht:</b> rechter Winkel, wie die Ecke am Geodreieck.<br>Tipp: Zähle die Kästchen!`,
    levels: [
      [genZweiLinien(0), genZweiLinien(0), genZweiLinien(1)],
      [genZweiLinien(1), genStadtplan, genStadtplan, genPgramm],
      [genStadtplan, genPgramm, genZweiLinien(1), genPgramm],
    ] },
  { id: 'insel', name: 'Insel der Meister', topic: 'Klassenarbeit-Mix', icon: '🏝️', color: '#be185d', animals: ['roterpanda', 'koala', 'quokka'], boss: true, count: 10,
    rule: `<b>Alles gemischt</b> – wie in der Klassenarbeit. Hier zeigst du, was du kannst!`,
    levels: [
      [genWort, genStellen, genSumme, genNachbarDoppel, genLineRead('A'), genLinePlace('A'), genOrdnen, genRunden(1000), genRunden(10000), genLeoRundet(100000), genRaetsel],
      [genStadtplan, genPgramm, genKreisTeil, genKreisSatz, genRD('cm'), genZirkel, genPaare(2), genWelches(2), genLeoKreis, genVergleich, genZweiLinien(1)],
      [genWort, genNachbarDoppel, genNachbar(10000, true), genLinePlace('D'), genRundGrenze, genLeoRundet(100000), genStadtplan, genPgramm, genPaare(2), genBegruendung, genLeoKreis, genOrdnen],
    ] },
];
const LEVELNAMES = ['Level 1 · Aufwärmen', 'Level 2 · Training', 'Level 3 · Profi'];
