'use strict';
/* =====================================================================
   TEIL 2: Stoff für die zweite Hälfte von Klasse 4
   (schriftliches Rechnen, Größen, Umfang & Fläche, Körper, Daten & Zufall)
   Benutzt die Helfer aus tasks.js (mc, tf, fixed, fmt, rnd, pick, shuffle, B …).
   ===================================================================== */
const P10 = k => Math.pow(10, k);
const STELLE = ['Einer', 'Zehner', 'Hunderter', 'Tausender', 'Zehntausender', 'Hunderttausender', 'Millionen'];
const kid = () => pick(KIDS);

/* ---------- Schriftliches Rechnen im Kästchen-Raster (Aufgabentyp „col“) ----------
   col = { W, head: [Zeilen als Strings der Länge W], carry: 'Merkzahlen' (nur Lösung),
           rows: [{ ans, end, n, rule }] }  – jede Antwortzeile hat n Kästchen, das letzte in Spalte „end“.
   input = true: Kästchen zum Eintippen (von rechts nach links), sonst ausgefüllte Lösung. show: andere Zahlen anzeigen. */
function colHTML(col, input, show) {
  let h = '<table class="col">';
  col.head.forEach(l => { h += '<tr>' + [...l].map(c => `<td>${c === ' ' ? '' : c}</td>`).join('') + '</tr>'; });
  if (!input && col.carry && col.carry.trim()) h += '<tr class="carry">' + [...col.carry].map(c => `<td>${c === ' ' ? '' : c}</td>`).join('') + '</tr>';
  col.rows.forEach((r, ri) => {
    const s = String(show ? show[ri] : r.ans).padStart(r.n, ' ');
    h += `<tr class="${r.rule ? 'crule' : ''}">`;
    for (let c = 0; c < col.W; c++) {
      const k = c - (r.end - r.n + 1);
      if (k < 0 || k >= r.n) h += '<td></td>';
      else h += input ? `<td><button class="cc" data-r="${ri}" data-k="${k}" onclick="G.colFocus(${ri},${k})"></button></td>` : `<td class="${show ? 'shown' : 'ok'}">${s[k].trim()}</td>`;
    }
    h += '</tr>';
  });
  return h + '</table>';
}
function addCol(nums) {
  const sum = nums.reduce((a, b) => a + b, 0), L = Math.max(...nums.map(n => String(n).length)) + 1, W = L + 1;
  const head = nums.map((n, i) => (i ? '+' : ' ') + String(n).padStart(L, ' '));
  const cl = Array(W).fill(' '), steps = []; let carry = 0;
  for (let p = 0; p < L; p++) {
    const ds = nums.map(n => Math.floor(n / P10(p)) % 10), s = ds.reduce((a, b) => a + b, 0) + carry;
    if (P10(p) <= sum) steps.push(`${B(STELLE[p])}: ${ds.join(' + ')}${carry ? ' + ' + carry + ' (gemerkt)' : ''} = ${s} → schreibe ${B(s % 10)}${s > 9 ? ', merke ' + B(Math.floor(s / 10)) : ''}`);
    carry = Math.floor(s / 10); if (carry) cl[W - 2 - p] = String(carry);
  }
  return { W, head, carry: cl.join(''), steps, rows: [{ ans: sum, end: W - 1, n: L, rule: true }] };
}
function subCol(a, b) {
  const L = String(a).length, W = L + 1;
  return { W, head: [' ' + a, '−' + String(b).padStart(L, ' ')], rows: [{ ans: a - b, end: W - 1, n: L, rule: true }] };
}
function mulCol1(n, f) {
  const s = `${n}·${f}`, W = s.length, steps = []; let carry = 0;
  [...String(n)].reverse().forEach((d, p) => { const v = f * +d + carry; steps.push(`${f} · ${d}${carry ? ' + ' + carry : ''} = ${v} → schreibe ${B(p === String(n).length - 1 ? v : v % 10)}${v > 9 && p < String(n).length - 1 ? ', merke ' + B(Math.floor(v / 10)) : ''}`); carry = Math.floor(v / 10); });
  return { W, head: [s], steps, rows: [{ ans: n * f, end: W - 1, n: W, rule: true }] };
}
function mulCol2(n, f) {
  const s = ` ${n}·${f}`, W = s.length, t = Math.floor(f / 10), u = f % 10;
  return { W, head: [s], rows: [{ ans: n * t, end: W - 2, n: W - 1, rule: true }, { ans: n * u, end: W - 1, n: W }, { ans: n * f, end: W - 1, n: W, rule: true }] };
}
const colTask = (q, col, explain) => ({ type: 'col', q, col, explain });

/* =====================================================
   WELT 8: Marktplatz – schriftlich addieren und subtrahieren
   ===================================================== */
const genAddCol = lvl => () => {
  let nums;
  do {
    nums = lvl === 0 ? [rnd(2000, 60000), rnd(1000, 30000)] : lvl === 1 ? [rnd(100000, 600000), rnd(20000, 390000)] : [rnd(10000, 400000), rnd(1000, 90000), rnd(100, 300000)];
  } while (nums.reduce((a, b) => a + b, 0) >= 1000000);
  const col = addCol(nums);
  return colTask('Addiere schriftlich. Beginne rechts bei den Einern!', col,
    `${colHTML(col)}<ul>${col.steps.map(s => `<li>${s}</li>`).join('')}</ul><p class="tip">💡 Die kleinen Zahlen sind die Merkzahlen (Überträge). Vergiss sie in der nächsten Spalte nicht!</p>`);
};
const genSubCol = lvl => () => {
  let a, b;
  if (lvl === 0) { a = rnd(5000, 90000); b = rnd(1000, a - 500); }
  else if (lvl === 1) { a = rnd(100000, 999999); b = rnd(10000, a - 1000); }
  else { a = pick([rnd(2, 9) * 100000, rnd(20, 99) * 10000 + rnd(1, 9), rnd(1, 9) * 100000 + rnd(1, 9) * 100 + rnd(0, 9), 1000000, rnd(3, 9) * 100000 + rnd(1, 9) * 1000]); b = rnd(1234, Math.min(a - 1000, 499999)); }
  const col = subCol(a, b), d = a - b;
  return colTask('Subtrahiere schriftlich. Beginne rechts bei den Einern!', col,
    `${colHTML(col)}<p>${fmt(a)} − ${fmt(b)} = ${B(fmt(d))}</p><p class="tip">💡 Probe mit der Umkehraufgabe: ${fmt(d)} + ${fmt(b)} = ${fmt(a)} ✅<br>Überschlag: ${fmt(roundTo(a, 10000))} − ${fmt(roundTo(b, 10000))} = ${fmt(roundTo(a, 10000) - roundTo(b, 10000))}</p>`);
};
const genUeberAdd = () => {
  const plus = rnd(0, 1) === 0; let a, b;
  do { a = rnd(21000, 89000); b = rnd(11000, 69000); } while (a % 10000 === 5000 || b % 10000 === 5000 || (!plus && a - b < 15000) || a + b > 150000);
  const ra = roundTo(a, 10000), rb = roundTo(b, 10000), c = plus ? ra + rb : ra - rb;
  return mc(`Überschlage: Runde beide Zahlen auf ${B('Zehntausender')} und rechne dann.<br><span class="wort">${fmt(a)} ${plus ? '+' : '−'} ${fmt(b)} ≈ ?</span>`, fmt(c),
    shuffle([c + 10000, c - 10000, c + 20000, plus ? ra - rb : ra + rb].filter(x => x > 0)).map(fmt),
    `<p>${fmt(a)} ≈ ${B(fmt(ra))} &nbsp;und&nbsp; ${fmt(b)} ≈ ${B(fmt(rb))}</p><p>${fmt(ra)} ${plus ? '+' : '−'} ${fmt(rb)} = ${B(fmt(c))}</p><p class="tip">💡 Mit dem Überschlag prüfst du, ob dein genaues Ergebnis stimmen kann. (Genau: ${fmt(plus ? a + b : a - b)})</p>`);
};
const genKopfAdd = () => {
  const t = rnd(0, 4);
  if (t === 0) { const a = rnd(11, 60) * 10000, b = rnd(11, 39) * 10000; return { type: 'fields', q: 'Rechne im Kopf.', parts: [`${fmt(a)} + ${fmt(b)} = `, { ans: a + b }], explain: `<p>Rechne mit Zehntausendern: ${a / 10000} ZT + ${b / 10000} ZT = ${(a + b) / 10000} ZT = ${B(fmt(a + b))}</p>` }; }
  if (t === 1) { const a = rnd(30, 95) * 10000, b = rnd(5, 28) * 10000; return { type: 'fields', q: 'Rechne im Kopf.', parts: [`${fmt(a)} − ${fmt(b)} = `, { ans: a - b }], explain: `<p>${a / 10000} ZT − ${b / 10000} ZT = ${(a - b) / 10000} ZT = ${B(fmt(a - b))}</p>` }; }
  if (t === 2) { const a = pick([rnd(1, 19) * 50000, rnd(1, 99) * 10000, rnd(1, 9) * 100000 + rnd(1, 9) * 1000]); return { type: 'fields', q: `Ergänze bis zur ${B('Million')}.`, parts: [`${fmt(a)} + `, { ans: 1000000 - a }, ' = 1 000 000'], explain: `<p>Von ${fmt(a)} bis 1 000 000 fehlen ${B(fmt(1000000 - a))}.</p><p class="tip">💡 Probe: ${fmt(a)} + ${fmt(1000000 - a)} = 1 000 000</p>` }; }
  if (t === 3) { const a = rnd(12, 49) * 10000 + pick([0, 5000]); return { type: 'fields', q: `Wie viel ist das ${B('Doppelte')} von ${B(fmt(a))}?`, parts: [{ ans: 2 * a }], explain: `<p>${fmt(a)} + ${fmt(a)} = ${B(fmt(2 * a))}</p>` }; }
  const a = rnd(11, 49) * 20000 + pick([0, 10000]); return { type: 'fields', q: `Wie viel ist die ${B('Hälfte')} von ${B(fmt(a))}?`, parts: [{ ans: a / 2 }], explain: `<p>${fmt(a)} : 2 = ${B(fmt(a / 2))}, denn ${fmt(a / 2)} + ${fmt(a / 2)} = ${fmt(a)}.</p>` };
};
const genAddFehler = () => {
  const nums = [rnd(12000, 480000), rnd(11000, 380000)], col = addCol(nums), sum = col.rows[0].ans, right = rnd(0, 1) === 0, k = kid();
  const cps = []; [...col.carry].forEach((c, i) => { if (c !== ' ') cps.push(col.W - 1 - i); });
  const wrong = cps.length ? sum - P10(pick(cps)) : sum + P10(rnd(1, 3));
  return tf(`${k} hat schriftlich addiert. Stimmt das Ergebnis?`, right,
    `${colHTML(col)}<p>Richtig ist ${B(fmt(sum))}.${right ? '' : ` ${k} hat eine ${B('Merkzahl')} (Übertrag) vergessen.`}</p><ul>${col.steps.map(s => `<li>${s}</li>`).join('')}</ul>`,
    { visual: colHTML(col, false, [right ? sum : wrong]) }, ['Stimmt', 'Stimmt nicht']);
};
const genSachAdd = () => {
  const t = rnd(0, 4), k = kid(); let q, ans, unit, calc;
  if (t === 0) { const a = rnd(3200, 9800), b = rnd(1500, 8900); q = `Auf dem Markt wurden am Freitag ${B(fmt(a))} Äpfel verkauft und am Samstag ${B(fmt(b))}. Wie viele Äpfel waren das zusammen?`; ans = a + b; unit = 'Äpfel'; calc = `${fmt(a)} + ${fmt(b)}`; }
  else if (t === 1) { const a = rnd(4000, 9900), b = rnd(1200, a - 900); q = `Eine Händlerin hatte ${B(fmt(a))} Eier. ${B(fmt(b))} Eier hat sie verkauft. Wie viele Eier hat sie noch?`; ans = a - b; unit = 'Eier'; calc = `${fmt(a)} − ${fmt(b)}`; }
  else if (t === 2) { const a = rnd(30, 75) * 1000, b = rnd(12000, a - 4000); q = `Ein Stadion hat ${B(fmt(a))} Plätze. ${B(fmt(b))} Plätze sind schon besetzt. Wie viele Plätze sind noch frei?`; ans = a - b; unit = 'Plätze'; calc = `${fmt(a)} − ${fmt(b)}`; }
  else if (t === 3) { const a = rnd(240, 690), b = rnd(85, a - 60); q = `Ein Fahrrad kostet ${B(a + ' €')}. ${k} hat schon ${B(b + ' €')} gespart. Wie viel Geld fehlt noch?`; ans = a - b; unit = '€'; calc = `${a} − ${b}`; }
  else { const a = rnd(1200, 4800), b = rnd(900, 3900), c = rnd(400, 2900); q = `Die Bäckerin verkauft morgens ${B(fmt(a))} Brötchen, mittags ${B(fmt(b))} und abends ${B(fmt(c))}. Wie viele Brötchen sind das insgesamt?`; ans = a + b + c; unit = 'Brötchen'; calc = `${fmt(a)} + ${fmt(b)} + ${fmt(c)}`; }
  return { type: 'fields', q, parts: [{ ans }, ' ' + unit], explain: `<p>Rechnung: ${calc} = ${B(fmt(ans))}</p><p>Antwort: ${B(fmt(ans) + ' ' + unit)}.</p><p class="tip">💡 „zusammen“, „insgesamt“ → plus. „noch“, „fehlt“, „übrig“ → minus.</p>` };
};
const genErgaenzen = () => {
  const c = rnd(3, 9) * pick([1000, 10000]), b = rnd(1, 9) * (c >= 30000 ? 1000 : 100) + rnd(1, 9) * (c >= 30000 ? 100 : 10), plus = rnd(0, 1) === 0, x = c - b;
  return { type: 'fields', q: 'Welche Zahl fehlt?', parts: plus ? [{ ans: x }, ` + ${fmt(b)} = ${fmt(c)}`] : [`${fmt(c)} − `, { ans: x }, ` = ${fmt(b)}`],
    explain: `<p>Rechne die ${B('Umkehraufgabe')}: ${fmt(c)} − ${fmt(b)} = ${B(fmt(x))}</p><p class="tip">💡 Probe: ${plus ? `${fmt(x)} + ${fmt(b)} = ${fmt(c)}` : `${fmt(c)} − ${fmt(x)} = ${fmt(b)}`}</p>` };
};

/* =====================================================
   WELT 9: Bienenwiese – multiplizieren
   ===================================================== */
const genMalZehner = () => {
  let a, b, za, zb;
  do { a = rnd(2, 9); b = rnd(2, 9); za = pick([1, 10, 100, 1000]); zb = pick([1, 10, 100]); } while ((za === 1 && zb === 1) || a * b * za * zb > 1000000);
  const nul = String(za * zb).length - 1;
  return { type: 'fields', q: 'Rechne im Kopf.', parts: [`${fmt(a * za)} · ${fmt(b * zb)} = `, { ans: a * b * za * zb }],
    explain: `<p>Erst die kleine Aufgabe: ${a} · ${b} = ${B(a * b)}.</p><p>Dann ${B(nul + (nul === 1 ? ' Null' : ' Nullen'))} anhängen (so viele, wie beide Zahlen zusammen haben): ${B(fmt(a * b * za * zb))}</p>` };
};
const genMalHalb = () => {
  const f = rnd(3, 9), h = rnd(1, 9), z = rnd(1, 9), e = rnd(2, 9), n = h * 100 + z * 10 + e;
  return { type: 'fields', q: `Rechne Schritt für Schritt: ${B(`${f} · ${n}`)}`,
    parts: [`${f} · ${h * 100} = `, { ans: f * h * 100 }, '<br>', `${f} · ${z * 10} = `, { ans: f * z * 10 }, '<br>', `${f} · ${e} = `, { ans: f * e }, '<br>', '<span class="lbl">Alles zusammen:</span>', `${f} · ${n} = `, { ans: f * n }],
    explain: `<p>Zerlege ${n} in ${h * 100} + ${z * 10} + ${e} und rechne jedes Stück mal ${f}:</p><p>${fmt(f * h * 100)} + ${f * z * 10} + ${f * e} = ${B(fmt(f * n))}</p>` };
};
const genMalCol = lvl => () => {
  if (lvl === 2) {
    const n = rnd(123, 987), f = rnd(1, 9) * 10 + rnd(2, 9), col = mulCol2(n, f), t = Math.floor(f / 10), u = f % 10;
    return colTask(`Multipliziere schriftlich.<br><small>1. Zeile: ${n} · ${t} &nbsp; 2. Zeile: ${n} · ${u} &nbsp; 3. Zeile: addieren</small>`, col,
      `${colHTML(col)}<p>${n} · ${t} = ${B(fmt(n * t))} – das sind Zehner, darum rückt die Zahl eine Stelle nach links.</p><p>${n} · ${u} = ${B(fmt(n * u))}</p><p>Addieren: ${fmt(n * t * 10)} + ${fmt(n * u)} = ${B(fmt(n * f))}</p>`);
  }
  const n = lvl === 0 ? rnd(123, 989) : rnd(1234, pick([9876, 48765])), f = rnd(3, 9), col = mulCol1(n, f);
  return colTask('Multipliziere schriftlich. Beginne rechts bei den Einern!', col,
    `${colHTML(col)}<ul>${col.steps.map(s => `<li>${s}</li>`).join('')}</ul><p class="tip">💡 Überschlag: ${f} · ${fmt(roundTo(n, P10(String(n).length - 1)))} = ${fmt(f * roundTo(n, P10(String(n).length - 1)))}</p>`);
};
const genMalUeber = () => {
  const f = rnd(3, 9), u = pick([100, 1000]); let n; do { n = rnd(12, 88) * u / 10 + rnd(1, u / 10 - 1); } while (Math.floor(n / (u / 10)) % 10 === 5);
  const r = roundTo(n, u), c = f * r;
  return mc(`Überschlage: Runde die große Zahl auf ${B(u === 100 ? 'Hunderter' : 'Tausender')}.<br><span class="wort">${f} · ${fmt(n)} ≈ ?</span>`, fmt(c),
    shuffle([c * 10, c / 10, f * (r + u), f * (r - u), c + r].filter(x => x > 0 && Number.isInteger(x))).map(fmt),
    `<p>${fmt(n)} ≈ ${B(fmt(r))}</p><p>${f} · ${fmt(r)} = ${B(fmt(c))}</p><p class="tip">💡 Genau gerechnet: ${f} · ${fmt(n)} = ${fmt(f * n)}. Das liegt nah am Überschlag – gut!</p>`);
};
const genMalFehler = () => {
  const f = rnd(3, 9), n = rnd(1211, 8899), p = f * n, right = rnd(0, 2) === 0, k = kid();
  const wrong = pick([p * 10, Math.round(p / 10), p + pick([-1, 1]) * rnd(2, 4) * 10000]);
  const r = roundTo(n, 1000);
  return tf(`${k} rechnet: ${B(`${f} · ${fmt(n)} = ${fmt(right ? p : wrong)}`)}<br>Kann das stimmen? Prüfe mit dem ${B('Überschlag')}!`, right,
    `<p>Überschlag: ${f} · ${fmt(r)} = ${B(fmt(f * r))}</p><p>${right ? `${fmt(p)} liegt nah daran – das Ergebnis stimmt.` : `${fmt(wrong)} ist weit davon entfernt. Richtig ist ${B(fmt(p))}.`}</p>`, {}, ['Kann stimmen', 'Kann nicht stimmen']);
};
const genMalSach = () => {
  const t = rnd(0, 3); let q, a, b, unit;
  if (t === 0) { a = rnd(3, 9); b = rnd(115, 480); q = `Jedes der ${B(a)} Bienenvölker sammelt an einem Tag ${B(b + ' g')} Honig. Wie viel Gramm sammeln alle zusammen?`; unit = 'g'; }
  else if (t === 1) { a = rnd(12, 38); b = pick([6, 12, 24]); q = `In einem Karton sind ${B(b)} Honiggläser. Wie viele Gläser sind in ${B(a)} Kartons?`; unit = 'Gläser'; }
  else if (t === 2) { a = 7; b = rnd(210, 950); q = `Eine Biene besucht an einem Tag ${B(b)} Blüten. Wie viele Blüten besucht sie in einer Woche?`; unit = 'Blüten'; }
  else { a = rnd(4, 9); b = rnd(1150, 4800); q = `In einem Bienenstock leben ${B(fmt(b))} Bienen. Wie viele Bienen leben in ${B(a)} gleich großen Stöcken?`; unit = 'Bienen'; }
  return { type: 'fields', q, parts: [{ ans: a * b }, ' ' + unit], explain: `<p>Immer gleich viele → ${B('mal')} rechnen: ${a} · ${fmt(b)} = ${B(fmt(a * b))}</p><p>Antwort: ${B(fmt(a * b) + ' ' + unit)}.</p>` };
};

/* =====================================================
   WELT 10: Piratenbucht – dividieren, Teiler und Vielfache
   ===================================================== */
function divSteps(n, d) {
  const ds = String(n), out = [`  ${ds} : ${d} = ${Math.floor(n / d)}${n % d ? ' Rest ' + n % d : ''}`]; let cur = 0, started = false;
  for (let i = 0; i < ds.length; i++) {
    cur = cur * 10 + +ds[i];
    if (!started && cur < d && i < ds.length - 1) continue;
    started = true; const sub = Math.floor(cur / d) * d, rest = cur - sub, w = String(cur).length;
    out.push('−' + String(sub).padStart(i + 2, ' ')); out.push(' '.repeat(i + 3 - w) + '─'.repeat(w));
    out.push(i < ds.length - 1 ? String(rest).padStart(i + 3, ' ') + ds[i + 1] : String(rest).padStart(i + 3, ' '));
    cur = rest;
  }
  return `<pre class="div">${out.join('\n')}</pre>`;
}
const genDivZehner = () => {
  const b = rnd(2, 9), r = rnd(2, 9), z = pick([10, 100, 1000]), big = rnd(0, 2) === 0 && z > 10;
  const n = b * r * z, d = big ? b * 10 : b, ans = n / d;
  return { type: 'fields', q: 'Rechne im Kopf.', parts: [`${fmt(n)} : ${d} = `, { ans }],
    explain: `<p>Die kleine Aufgabe hilft: ${b * r} : ${b} = ${B(r)}.</p><p>${fmt(n)} : ${d} = ${B(fmt(ans))}</p><p class="tip">💡 Probe mit Mal: ${fmt(ans)} · ${d} = ${fmt(n)}</p>` };
};
const genDivHalb = () => {
  const d = rnd(2, 9), q = rnd(1, 2) * 100 + rnd(1, 9) * 10 + rnd(1, 9), n = d * q, p = [Math.floor(q / 100) * 100, Math.floor(q % 100 / 10) * 10, q % 10];
  return { type: 'fields', q: `Zerlege geschickt und rechne: ${B(`${fmt(n)} : ${d}`)}`, parts: [`${fmt(n)} : ${d} = `, { ans: q }],
    explain: `<p>Zerlege ${fmt(n)} in Stücke, die sich gut durch ${d} teilen lassen:</p><p>${p.map(x => `${fmt(x * d)} : ${d} = ${x}`).join('<br>')}</p><p>${p.join(' + ')} = ${B(q)}</p>` };
};
const genDivRest = lvl => () => {
  const d = rnd(lvl ? 3 : 2, 9), q = lvl ? rnd(12, 99) : rnd(2, 9), r = rnd(1, d - 1), n = d * q + r;
  return { type: 'fields', q: 'Rechne mit Rest.', parts: [`${n} : ${d} = `, { ans: q }, ' Rest ', { ans: r }],
    explain: `<p>${d} passt ${B(q)}-mal in ${n}: ${q} · ${d} = ${q * d}.</p><p>Übrig bleiben ${n} − ${q * d} = ${B(r)}.</p><p class="tip">💡 Der Rest ist immer kleiner als die Zahl, durch die du teilst.</p>` };
};
const genDivSchrift = rest => () => {
  const d = rnd(2, 9), q = rnd(112, 1899), r = rest ? rnd(1, d - 1) : 0, n = d * q + r;
  return { type: 'fields', q: `Dividiere${rest ? ' – es bleibt ein Rest' : ''}. Du darfst auf Papier schriftlich rechnen!`,
    parts: [`${fmt(n)} : ${d} = `, { ans: q }].concat(rest ? [' Rest ', { ans: r }] : []),
    explain: `${divSteps(n, d)}<p>Teile Stelle für Stelle von links: teilen, malnehmen, abziehen, nächste Ziffer herunterholen.</p><p class="tip">💡 Probe: ${fmt(q)} · ${d}${r ? ' + ' + r : ''} = ${fmt(n)}</p>` };
};
const genTeiler = () => {
  const t = rnd(0, 2);
  if (t === 0) {
    const n = pick([24, 36, 48, 60, 72, 84, 90, 96, 120]), all = [3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 15, 16];
    const c = pick(all.filter(x => n % x === 0)), w = shuffle(all.filter(x => n % x !== 0)).slice(0, 3);
    return mc(`Welche Zahl ist ein ${B('Teiler')} von ${B(n)}?`, c, w, `<p>Ein Teiler teilt die Zahl ${B('ohne Rest')}: ${n} : ${c} = ${n / c}.</p><p>Bei den anderen bleibt ein Rest, z.&nbsp;B. ${n} : ${w[0]} = ${Math.floor(n / w[0])} Rest ${n % w[0]}.</p>`);
  }
  if (t === 1) {
    const k = pick([6, 7, 8, 9, 12]), c = k * rnd(4, 12), w = shuffle([c + 1, c - 1, c + 2, c - 2, c + k - 1, c - k + 1].filter(x => x % k !== 0)).slice(0, 3);
    return mc(`Welche Zahl ist ein ${B('Vielfaches')} von ${B(k)}?`, c, w, `<p>Vielfache von ${k} stehen in der ${k}er-Reihe: ${[1, 2, 3, 4].map(i => i * k).join(', ')}, …</p><p>${c} = ${c / k} · ${k} ✅</p>`);
  }
  const d = pick([2, 5, 10]), n = rnd(1000, 9998), ok = n % d === 0, last = n % 10;
  return tf(`Stimmt das?<br>„${B(fmt(n))} ist durch ${B(d)} teilbar.“`, ok,
    `<p>Schau nur auf die ${B('letzte Ziffer')}: ${B(last)}.</p><p>${d === 2 ? 'Durch 2 teilbar sind alle geraden Zahlen (letzte Ziffer 0, 2, 4, 6, 8).' : d === 5 ? 'Durch 5 teilbar sind Zahlen mit der letzten Ziffer 0 oder 5.' : 'Durch 10 teilbar sind Zahlen mit der letzten Ziffer 0.'}</p><p>${fmt(n)} ist also ${ok ? '' : B('nicht') + ' '}durch ${d} teilbar.</p>`);
};
const genDivSach = () => {
  const t = rnd(0, 3), d = rnd(3, 9);
  if (t === 0) { const q = rnd(112, 480), n = d * q; return { type: 'fields', q: `${B(d)} Piraten teilen ${B(fmt(n))} Goldmünzen gerecht auf. Wie viele Münzen bekommt jeder?`, parts: [{ ans: q }, ' Münzen'], explain: `${divSteps(n, d)}<p>Gerecht teilen → ${B('geteilt')} rechnen. Jeder bekommt ${B(q + ' Münzen')}.</p>` }; }
  if (t === 1) { const q = rnd(21, 99), r = rnd(1, d - 1), n = d * q + r; return { type: 'fields', q: `${B(d)} Piraten teilen ${B(fmt(n))} Perlen gerecht auf. Wie viele bekommt jeder – und wie viele bleiben übrig?`, parts: ['Jeder: ', { ans: q }, '<br>', 'Übrig: ', { ans: r }], explain: `${divSteps(n, d)}<p>Jeder bekommt ${B(q)} Perlen, ${B(r)} ${r === 1 ? 'bleibt' : 'bleiben'} übrig.</p>` }; }
  const q = rnd(4, 12), r = rnd(1, d - 1), n = d * q + r;
  if (t === 2) return { type: 'fields', q: `${B(n)} Piraten wollen zur Insel rudern. In jedes Boot passen ${B(d)} Piraten. Wie viele Boote brauchen sie?`, parts: [{ ans: q + 1 }, ' Boote'], explain: `<p>${n} : ${d} = ${q} Rest ${r}</p><p>${q} Boote sind voll. Für die ${r} übrigen Piraten braucht man ${B('noch ein Boot')}: ${q} + 1 = ${B(q + 1)}.</p><p class="tip">💡 Überlege bei einem Rest immer: Was passiert mit dem Rest in der Geschichte?</p>` };
  return { type: 'fields', q: `Der Schiffskoch hat ${B(n)} Flaschen. In eine Kiste passen ${B(d)} Flaschen. Wie viele Kisten werden ${B('ganz voll')}?`, parts: [{ ans: q }, ' Kisten'], explain: `<p>${n} : ${d} = ${q} Rest ${r}</p><p>${B(q)} Kisten werden voll. ${r} ${r === 1 ? 'Flasche bleibt' : 'Flaschen bleiben'} übrig – das reicht nicht für eine volle Kiste.</p>` };
};
const genDivProbe = () => {
  const d = rnd(3, 9), q = rnd(2, 9) * pick([10, 100]) + pick([0, rnd(1, 9)]), mal = rnd(0, 1) === 0;
  return { type: 'fields', q: 'Welche Zahl fehlt?', parts: mal ? [{ ans: q }, ` · ${d} = ${fmt(d * q)}`] : [{ ans: d * q }, ` : ${d} = ${fmt(q)}`],
    explain: `<p>Rechne die ${B('Umkehraufgabe')}: ${mal ? `${fmt(d * q)} : ${d} = ${B(fmt(q))}` : `${fmt(q)} · ${d} = ${B(fmt(d * q))}`}</p>` };
};

/* =====================================================
   WELT 11: Zuckerbäckerei – Größen (Gewicht, Länge, Liter, Zeit)
   ===================================================== */
const SYS = {
  kg: { big: 'kg', small: 'g', f: 1000, s: [5, 50, 500, 250, 75, 750, 125, 80, 300] },
  t: { big: 't', small: 'kg', f: 1000, s: [500, 250, 50, 800, 5] },
  km: { big: 'km', small: 'm', f: 1000, s: [500, 250, 50, 5, 750, 400, 80] },
  m: { big: 'm', small: 'cm', f: 100, s: [5, 50, 25, 8, 80, 45] },
  cm: { big: 'cm', small: 'mm', f: 10, s: [5, 2, 8, 3] },
  l: { big: 'l', small: 'ml', f: 1000, s: [500, 250, 750, 50, 5, 200, 125] },
};
const dec = (b, s, f, trim) => { let d = String(s).padStart(String(f).length - 1, '0'); if (trim) d = d.replace(/0+$/, ''); return d ? `${b},${d}` : String(b); };
const mixed = (v, S) => { const b = Math.floor(v / S.f), s = v % S.f; return b && s ? `${b} ${S.big} ${s} ${S.small}` : b ? `${b} ${S.big}` : `${s} ${S.small}`; };
const BRUCHTEIL = [['½', 2, 1], ['¼', 4, 1], ['¾', 4, 3]];
const genUmrechnen = (...keys) => () => {
  const S = SYS[pick(keys)], b = rnd(1, 9), s = pick([pick(S.s), rnd(1, S.f - 1)]), v = b * S.f + s, t = rnd(0, S.f === 10 ? 1 : 3);
  const regel = `<p>${B(`1 ${S.big} = ${fmt(S.f)} ${S.small}`)}</p>`;
  if (t === 0) return { type: 'fields', q: 'Wandle um.', parts: [`${b} ${S.big} ${s} ${S.small} = `, { ans: v }, ' ' + S.small], explain: `${regel}<p>${b} ${S.big} = ${fmt(b * S.f)} ${S.small}. Dazu ${s} ${S.small}: ${B(fmt(v) + ' ' + S.small)}</p>` };
  if (t === 1) return { type: 'fields', q: 'Wandle um.', parts: [`${fmt(v)} ${S.small} = `, { ans: b }, ` ${S.big} `, { ans: s }, ' ' + S.small], explain: `${regel}<p>In ${fmt(v)} ${S.small} stecken ${b} ganze ${S.big} (${fmt(b * S.f)} ${S.small}). Übrig: ${B(s + ' ' + S.small)}.</p>` };
  if (t === 2) { const [sym, den, num] = pick(BRUCHTEIL); return { type: 'fields', q: 'Wandle um.', parts: [`${sym} ${S.big} = `, { ans: S.f / den * num }, ' ' + S.small], explain: `${regel}<p>${sym === '½' ? 'Die Hälfte' : sym === '¼' ? 'Ein Viertel' : 'Drei Viertel'} davon: ${fmt(S.f)} : ${den}${num > 1 ? ' · ' + num : ''} = ${B(fmt(S.f / den * num) + ' ' + S.small)}</p>` }; }
  const x = pick(S.s.filter(y => y >= S.f / 20)); return { type: 'fields', q: 'Wie viel fehlt?', parts: [`${x} ${S.small} + `, { ans: S.f - x }, ` ${S.small} = 1 ${S.big}`], explain: `${regel}<p>${fmt(S.f)} − ${x} = ${B(fmt(S.f - x) + ' ' + S.small)}</p>` };
};
const genKomma = (...keys) => () => {
  const S = SYS[pick(keys)], b = rnd(1, 9), s = pick(S.s), toMixed = rnd(0, 1) === 0;
  const alt = [...new Set([s * 10, s / 10, s * 100, s / 100, ...S.s])].filter(x => Number.isInteger(x) && x > 0 && x < S.f && x !== s);
  const regel = `<p>Vor dem Komma stehen die ganzen ${S.big}. Dahinter ${S.f === 1000 ? 'gehören immer drei Stellen' : S.f === 100 ? 'gehören immer zwei Stellen' : 'steht eine Stelle'} für die ${S.small}.</p>`;
  const tab = `<p>${B(dec(b, s, S.f) + ' ' + S.big)} = ${b} ${S.big} ${s} ${S.small} = ${fmt(b * S.f + s)} ${S.small}</p>`;
  if (toMixed) return mc(`Was ist dasselbe wie ${B(dec(b, s, S.f, rnd(0, 1)) + ' ' + S.big)}?`, `${b} ${S.big} ${s} ${S.small}`,
    shuffle(alt).slice(0, 2).map(x => `${b} ${S.big} ${x} ${S.small}`).concat([`${b * 10} ${S.big} ${s} ${S.small}`, `${b}${s} ${S.small}`]), regel + tab);
  return mc(`Wie schreibt man ${B(`${b} ${S.big} ${s} ${S.small}`)} mit Komma?`, `${dec(b, s, S.f)} ${S.big}`,
    shuffle(alt).slice(0, 2).map(x => `${dec(b, x, S.f)} ${S.big}`).concat([`${b},${s} ${S.big}`, `${b}${s},0 ${S.big}`]), regel + tab);
};
const STUETZ = [
  ['Wie schwer ist ein Elefant ungefähr?', '5 t', ['5 kg', '50 kg', '500 g']], ['Wie schwer ist eine Tafel Schokolade?', '100 g', ['1 kg', '10 kg', '1 g']],
  ['Wie schwer ist eine Packung Mehl?', '1 kg', ['1 g', '10 g', '1 t']], ['Wie schwer ist ein kleines Auto ungefähr?', '1 t', ['1 kg', '100 kg', '100 t']],
  ['Wie viel Wasser passt in einen Putzeimer?', '10 l', ['10 ml', '100 ml', '1 000 l']], ['Wie viel passt auf einen Teelöffel?', '5 ml', ['5 l', '500 ml', '50 l']],
  ['Wie viel passt in ein Trinkglas?', '200 ml', ['2 ml', '20 l', '2 l']], ['Wie hoch ist eine Zimmertür?', '2 m', ['20 cm', '2 km', '20 m']],
  ['Wie lang ist ein Fußballfeld ungefähr?', '100 m', ['100 cm', '10 km', '10 m']], ['Wie dick ist ein Mathebuch ungefähr?', '15 mm', ['15 cm', '15 m', '1 mm']],
  ['Wie weit ist es von Berlin bis nach München?', '600 km', ['600 m', '60 km', '6 km']], ['Wie lange dauert eine Schulstunde?', '45 min', ['45 s', '45 h', '4 min']],
  ['Wie lange putzt du deine Zähne?', '3 min', ['3 s', '3 h', '30 min']], ['Wie lange dauern die Sommerferien in Berlin?', '6 Wochen', ['6 Tage', '6 Monate', '6 Stunden']],
];
const genEinheit = () => { const s = pick(STUETZ); return mc(s[0], s[1], s[2], `<p>Richtig ist ${B(s[1])}. Solche Vergleichsgrößen helfen dir beim Schätzen!</p><p class="tip">💡 Merke dir: 1 Packung Mehl = 1 kg · 1 Tafel Schokolade = 100 g · Tür = 2 m · Trinkglas = 200 ml</p>`); };
const uhr = m => `${Math.floor(m / 60) % 24}:${String(m % 60).padStart(2, '0')} Uhr`;
const genZeit = () => {
  const t = rnd(0, 3);
  if (t === 0) {
    const st = rnd(7, 18) * 60 + rnd(3, 11) * 5, du = pick([25, 35, 40, 45, 50, 55, 65, 75, 80, 95]), en = st + du;
    const naive = `${Math.floor(st / 60)}:${st % 60 + du} Uhr`;
    return mc(`Der Kuchen kommt um ${B(uhr(st))} in den Ofen. Er muss ${B(du + ' Minuten')} backen. Wann ist er fertig?`, uhr(en),
      [uhr(en + 10), uhr(en - 10), uhr(en + 60), uhr(en - 60), ...(st % 60 + du >= 60 && st % 60 + du < 100 ? [naive] : [])].reverse(),
      (st % 60 + du > 60 ? `<p>Rechne erst bis zur vollen Stunde: von ${uhr(st)} bis ${uhr(Math.ceil(st / 60) * 60)} sind es ${60 - st % 60} min.</p><p>Dann bleiben noch ${du} − ${60 - st % 60} = ${du - (60 - st % 60)} min → ${B(uhr(en))}</p>` : `<p>${st % 60} min + ${du} min = ${st % 60 + du} min → ${B(uhr(en))}</p>`) + '<p class="tip">💡 Eine Stunde hat 60 Minuten – nicht 100!</p>');
  }
  if (t === 1) {
    const st = rnd(7, 17) * 60 + rnd(1, 11) * 5, du = rnd(13, 35) * 5, en = st + du;
    return { type: 'fields', q: `Der Zirkus beginnt um ${B(uhr(st))} und endet um ${B(uhr(en))}. Wie lange dauert er?`, parts: [{ ans: Math.floor(du / 60) }, ' h ', { ans: du % 60 }, ' min'],
      explain: `<p>Gehe in Schritten: von ${uhr(st)} bis ${uhr(Math.ceil(st / 60) * 60)} sind es ${60 - st % 60} min, von dort bis ${uhr(en)} noch ${en - Math.ceil(st / 60) * 60} min.</p><p>Zusammen: ${du} min = ${B(`${Math.floor(du / 60)} h ${du % 60} min`)}</p>` };
  }
  if (t === 2) {
    const h = rnd(1, 4), m = rnd(1, 11) * 5, back = rnd(0, 1) === 0;
    return back ? { type: 'fields', q: 'Wandle um.', parts: [`${h * 60 + m} min = `, { ans: h }, ' h ', { ans: m }, ' min'], explain: `<p>${B('1 h = 60 min')}. In ${h * 60 + m} min stecken ${h} volle Stunden (${h * 60} min). Übrig: ${B(m + ' min')}.</p>` }
      : { type: 'fields', q: 'Wandle um.', parts: [`${h} h ${m} min = `, { ans: h * 60 + m }, ' min'], explain: `<p>${B('1 h = 60 min')}. ${h} h = ${h * 60} min. Dazu ${m} min: ${B(h * 60 + m + ' min')}</p>` };
  }
  const [txt, ans, unit, why] = pick([['¼ h', 15, 'min', '60 min : 4'], ['½ h', 30, 'min', '60 min : 2'], ['¾ h', 45, 'min', '3 · 15 min'], ['1½ h', 90, 'min', '60 min + 30 min'], ['3 min', 180, 's', '3 · 60 s'], ['5 min', 300, 's', '5 · 60 s'], ['2 Tage', 48, 'h', '2 · 24 h'], ['3 Wochen', 21, 'Tage', '3 · 7 Tage'], ['2 Jahre', 24, 'Monate', '2 · 12 Monate']]);
  return { type: 'fields', q: 'Wandle um.', parts: [`${txt} = `, { ans }, ' ' + unit], explain: `<p>${txt} = ${why} = ${B(ans + ' ' + unit)}</p><p class="tip">💡 1 min = 60 s · 1 h = 60 min · 1 Tag = 24 h · 1 Woche = 7 Tage</p>` };
};
const genGroessenRechnen = () => {
  const t = rnd(0, 3);
  if (t === 0) { const x = rnd(3, 19) * 50; return { type: 'fields', q: `In der Tüte war ${B('1 kg')} Zucker. Für den Teig wurden ${B(x + ' g')} gebraucht. Wie viel ist noch in der Tüte?`, parts: [{ ans: 1000 - x }, ' g'], explain: `<p>Erst umwandeln: 1 kg = 1 000 g.</p><p>1 000 g − ${x} g = ${B(1000 - x + ' g')}</p>` }; }
  if (t === 1) { const v = pick([100, 125, 200, 250, 500]); return { type: 'fields', q: `Wie viele Gläser mit ${B(v + ' ml')} kannst du aus einer ${B('1-l-Flasche')} füllen?`, parts: [{ ans: 1000 / v }, ' Gläser'], explain: `<p>1 l = 1 000 ml.</p><p>1 000 ml : ${v} ml = ${B(1000 / v)}</p>` }; }
  if (t === 2) { const x = rnd(4, 18) * 25, k = pick([2, 3, 4]), n = 4; return { type: 'fields', q: `Für ${B(n + ' Muffins')} braucht der Bäcker ${B(x + ' g')} Mehl. Wie viel Mehl braucht er für ${B(n * k + ' Muffins')}?`, parts: [{ ans: x * k }, ' g'], explain: `<p>${n * k} Muffins sind ${B(k + '-mal so viele')} wie ${n}. Also braucht er auch ${k}-mal so viel Mehl:</p><p>${k} · ${x} g = ${B(fmt(x * k) + ' g')}${x * k >= 1000 ? ` (= ${mixed(x * k, SYS.kg)})` : ''}</p>` }; }
  const k = rnd(3, 8), v = pick([250, 300, 400, 500, 750]); return { type: 'fields', q: `${B(k)} Flaschen Saft mit je ${B(v + ' ml')}. Wie viel Saft ist das zusammen?`, parts: [{ ans: k * v }, ' ml'], explain: `<p>${k} · ${v} ml = ${B(fmt(k * v) + ' ml')}${k * v >= 1000 ? ` = ${mixed(k * v, SYS.l)}` : ''}</p>` };
};
const genGroessenOrdnen = () => {
  const key = pick(['kg', 'km', 'l', 'm']), S = SYS[key], b = rnd(1, 8), max = rnd(0, 1) === 0;
  const cand = S.f === 1000 ? [5, 50, 500, 55, 505, 550, 450, 45] : [5, 50, 55, 45, 8, 80];
  const vals = shuffle(cand).slice(0, 4).map(s => b * S.f + s), nota = shuffle([0, 1, 2, rnd(0, 2)]);
  const show = (v, i) => nota[i] === 0 ? `${fmt(v)} ${S.small}` : nota[i] === 1 ? mixed(v, S) : `${dec(Math.floor(v / S.f), v % S.f, S.f, true)} ${S.big}`;
  const sorted = vals.slice().sort((x, y) => x - y), ans = max ? sorted[3] : sorted[0], word = { kg: ['schwersten', 'leichtesten'], km: ['längsten', 'kürzesten'], m: ['längsten', 'kürzesten'], l: ['meisten', 'wenigsten'] }[key][max ? 0 : 1];
  return mc(`Was ist am ${B(word)}?`, show(ans, vals.indexOf(ans)), vals.filter(v => v !== ans).map(v => show(v, vals.indexOf(v))),
    `<p>Wandle alles in ${B(S.small)} um, dann kannst du vergleichen:</p><ul>${vals.map((v, i) => `<li>${show(v, i)} = ${fmt(v)} ${S.small}${v === ans ? ' ✅' : ''}</li>`).join('')}</ul>`);
};

/* =====================================================
   WELT 12: Schlossgarten – Umfang, Flächeninhalt, Maßstab
   ===================================================== */
function beetSVG(list, unit = 'm') { // list: [{a, b, name}]
  const C = Math.min(34, Math.floor(300 / Math.max(...list.map(r => Math.max(r.a, r.b * 1.4))))), gap = 50;
  let x = 40, s = '', H = Math.max(...list.map(r => r.b)) * C + 90;
  for (const r of list) {
    const w = r.a * C, h = r.b * C, y = 34;
    s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#bbf7d0" stroke="#166534" stroke-width="4"/>`;
    if (r.grid) { for (let i = 1; i < r.a; i++) s += `<line x1="${x + i * C}" y1="${y}" x2="${x + i * C}" y2="${y + h}" stroke="#16a34a" stroke-width="1"/>`; for (let j = 1; j < r.b; j++) s += `<line x1="${x}" y1="${y + j * C}" x2="${x + w}" y2="${y + j * C}" stroke="#16a34a" stroke-width="1"/>`; }
    s += `<text x="${x + w / 2}" y="${y - 10}" text-anchor="middle" font-size="19" font-weight="800" fill="#1f2937">${r.la != null ? r.la : r.a + ' ' + unit}</text>`;
    s += `<text x="${x - 8}" y="${y + h / 2 + 6}" text-anchor="end" font-size="19" font-weight="800" fill="#1f2937">${r.lb != null ? r.lb : r.b + ' ' + unit}</text>`;
    if (r.name) s += `<text x="${x + w / 2}" y="${y + h + 26}" text-anchor="middle" font-size="19" font-weight="800" fill="#166534">${r.name}</text>`;
    x += w + gap + 40;
  }
  return `<svg class="beet" viewBox="-30 0 ${x - gap + 10} ${H}" xmlns="http://www.w3.org/2000/svg">${s}</svg>`;
}
const genUmfang = () => {
  const sq = rnd(0, 3) === 0, a = rnd(3, 12), b = sq ? a : rnd(2, 8), U = 2 * a + 2 * b;
  return { type: 'fields', q: `Wie lang ist der Zaun um das ${sq ? 'quadratische ' : ''}Beet? Berechne den ${B('Umfang')}.`, visual: beetSVG([{ a, b }]), parts: ['U = ', { ans: U }, ' m'],
    explain: `<p>Der Umfang ist der Weg ${B('einmal außen herum')}. Addiere alle vier Seiten:</p><p>${sq ? `4 · ${a} m` : `${a} m + ${b} m + ${a} m + ${b} m`} = ${B(U + ' m')}</p>${sq ? '' : `<p class="tip">💡 Kurz: U = 2 · ${a} m + 2 · ${b} m</p>`}` };
};
const genFlaeche = () => {
  const a = rnd(3, 10), b = rnd(2, 7);
  return { type: 'fields', q: `Das Beet wird mit Platten ausgelegt. Jede Platte ist 1 m² groß (ein Kästchen). Wie groß ist der ${B('Flächeninhalt')}?`, visual: beetSVG([{ a, b, grid: true }]), parts: ['A = ', { ans: a * b }, ' m²'],
    explain: `<p>Der Flächeninhalt sagt, wie viele Einheitsquadrate hineinpassen.</p><p>${b} Reihen mit je ${a} Kästchen: ${a} · ${b} = ${B(a * b + ' m²')}</p><p class="tip">💡 Flächeninhalt vom Rechteck: Länge mal Breite.</p>` };
};
function formSVG(cells, W = 9, H = 7) {
  const C = 44, has = (x, y) => cells.some(c => c[0] === x && c[1] === y); let s = '';
  for (let i = 0; i <= W; i++) s += `<line x1="${i * C}" y1="0" x2="${i * C}" y2="${H * C}" stroke="#cbd5e1" stroke-width="1"/>`;
  for (let j = 0; j <= H; j++) s += `<line x1="0" y1="${j * C}" x2="${W * C}" y2="${j * C}" stroke="#cbd5e1" stroke-width="1"/>`;
  cells.forEach(([x, y]) => { s += `<rect x="${x * C}" y="${y * C}" width="${C}" height="${C}" fill="#bbf7d0" stroke="#86efac" stroke-width="1"/>`; });
  cells.forEach(([x, y]) => { [[0, -1, 0, 0, 1, 0], [0, 1, 0, 1, 1, 1], [-1, 0, 0, 0, 0, 1], [1, 0, 1, 0, 1, 1]].forEach(([dx, dy, x1, y1, x2, y2]) => { if (!has(x + dx, y + dy)) s += `<line x1="${(x + x1) * C}" y1="${(y + y1) * C}" x2="${(x + x2) * C}" y2="${(y + y2) * C}" stroke="#166534" stroke-width="5" stroke-linecap="round"/>`; }); });
  return `<svg class="plan" viewBox="-4 -4 ${W * C + 8} ${H * C + 8}" xmlns="http://www.w3.org/2000/svg"><rect x="-4" y="-4" width="${W * C + 8}" height="${H * C + 8}" fill="#fffdf5"/>${s}</svg>`;
}
const genForm = () => {
  const w1 = rnd(4, 6), h1 = rnd(2, 3), w2 = rnd(1, w1 - 2), h2 = rnd(1, 3), off = pick([0, w1 - w2, Math.floor((w1 - w2) / 2)]), cells = [];
  for (let x = 0; x < w1; x++) for (let y = 0; y < h1; y++) cells.push([1 + x, 1 + h2 + y]);
  for (let x = 0; x < w2; x++) for (let y = 0; y < h2; y++) cells.push([1 + off + x, 1 + y]);
  const A = cells.length, U = 2 * (w1 + h1 + h2);
  return { type: 'fields', q: 'Der Schlossteich hat eine besondere Form. Zähle genau!', visual: formSVG(cells),
    parts: ['<span class="lbl">Flächeninhalt (Kästchen):</span>', { ans: A }, '<br>', '<span class="lbl">Umfang (Kästchenlängen am Rand):</span>', { ans: U }],
    explain: `<p>${B('Flächeninhalt')}: Zähle die grünen Kästchen – oder zerlege in zwei Rechtecke: ${w1} · ${h1} + ${w2} · ${h2} = ${B(A)}.</p><p>${B('Umfang')}: Fahre einmal am dicken Rand entlang und zähle jede Kästchenlänge: ${B(U)}.</p><p class="tip">💡 Fläche = innen (Kästchen). Umfang = außen herum (Striche am Rand).</p>` };
};
const genSeiteGesucht = () => {
  const t = rnd(0, 2), a = rnd(4, 12), b = rnd(2, 9);
  if (t === 0) return { type: 'fields', q: `Ein rechteckiges Beet hat den Umfang ${B(`U = ${2 * a + 2 * b} m`)}. Eine Seite ist ${B(a + ' m')} lang. Wie lang ist die andere Seite?`, visual: beetSVG([{ a, b, lb: '?' }]), parts: [{ ans: b }, ' m'], explain: `<p>Zwei Seiten sind je ${a} m lang: 2 · ${a} m = ${2 * a} m.</p><p>Für die beiden anderen bleiben: ${2 * a + 2 * b} m − ${2 * a} m = ${2 * b} m. Eine davon: ${2 * b} m : 2 = ${B(b + ' m')}</p>` };
  if (t === 1) return { type: 'fields', q: `Ein ${B('quadratisches')} Beet hat den Umfang ${B(`U = ${4 * a} m`)}. Wie lang ist eine Seite?`, parts: [{ ans: a }, ' m'], explain: `<p>Im Quadrat sind alle vier Seiten gleich lang: ${4 * a} m : 4 = ${B(a + ' m')}</p>` };
  return { type: 'fields', q: `Ein rechteckiges Beet hat den Flächeninhalt ${B(`A = ${a * b} m²`)}. Eine Seite ist ${B(a + ' m')} lang. Wie lang ist die andere Seite?`, visual: beetSVG([{ a, b, lb: '?' }]), parts: [{ ans: b }, ' m'], explain: `<p>A = Länge · Breite. Also: ${a} · ? = ${a * b} → ${a * b} : ${a} = ${B(b + ' m')}</p>` };
};
const genUAVergleich = () => {
  const sameU = rnd(0, 1) === 0, askU = rnd(0, 1) === 0; let r1, r2;
  if (sameU) { const s = rnd(7, 12), a = rnd(Math.ceil(s / 2), s - 2); let c; do { c = rnd(Math.ceil(s / 2), s - 1); } while (c === a); r1 = [a, s - a]; r2 = [c, s - c]; }
  else { const [p, q] = pick([[[6, 2], [4, 3]], [[8, 2], [4, 4]], [[6, 4], [8, 3]], [[9, 2], [6, 3]], [[10, 2], [5, 4]], [[6, 6], [9, 4]]]); [r1, r2] = shuffle([p, q]); }
  const U = r => 2 * r[0] + 2 * r[1], A = r => r[0] * r[1], f = askU ? U : A, v1 = f(r1), v2 = f(r2);
  return fixed(askU ? `Welches Beet braucht den ${B('längeren Zaun')} (größerer Umfang)?` : `In welches Beet passen ${B('mehr Blumen')} (größerer Flächeninhalt)?`, ['Beet A', 'Beet B', 'Beide gleich'], v1 > v2 ? 0 : v1 < v2 ? 1 : 2,
    `<p>Beet A: U = ${U(r1)} m, A = ${r1[0]} · ${r1[1]} = ${A(r1)} m²<br>Beet B: U = ${U(r2)} m, A = ${r2[0]} · ${r2[1]} = ${A(r2)} m²</p><p class="tip">💡 Gleicher Umfang heißt nicht gleiche Fläche – und umgekehrt! Rechne immer beides aus.</p>`,
    { visual: beetSVG([{ a: r1[0], b: r1[1], name: 'Beet A' }, { a: r2[0], b: r2[1], name: 'Beet B' }]) });
};
const UODERA = [['Der Gärtner baut einen Zaun um das Beet.', 0], ['Der Maler streicht die Wand.', 1], ['Oma näht eine Borte rund um die Tischdecke.', 0], ['Im Zimmer wird Teppich verlegt.', 1], ['Im Schlosshof wird Rasen gesät.', 1], ['Ein Bild bekommt einen Rahmen aus Holzleisten.', 0], ['Der Küchenboden wird gefliest.', 1], ['Eine Lichterkette wird rund um das Fenster gehängt.', 0], ['Die Prinzessin reitet einmal rund um den Schlossteich.', 0], ['Das Fußballfeld bekommt neuen Rollrasen.', 1], ['Ein Geschenk wird mit Papier beklebt.', 1], ['Um die Sandkiste kommt eine Holzkante.', 0]];
const genUoderA = () => { const s = pick(UODERA); return fixed(`Was muss man hier berechnen?<br>„${s[0]}“`, ['Umfang', 'Flächeninhalt'], s[1], `<p>${s[1] ? `Hier wird eine ${B('Fläche bedeckt')} – man braucht den ${B('Flächeninhalt')}.` : `Hier geht es ${B('außen herum')} – man braucht den ${B('Umfang')}.`}</p><p class="tip">💡 Umfang = Rand (Zaun, Rahmen). Flächeninhalt = alles innen (Rasen, Teppich, Farbe).</p>`, { two: true }); };
const genMassstab = () => {
  const [M, eins, f, u] = pick([[100, '1 m', 1, 'm'], [100, '1 m', 1, 'm'], [1000, '10 m', 10, 'm'], [10, '10 cm', 10, 'cm'], [100000, '1 km', 1, 'km']]), x = rnd(2, 12), rev = rnd(0, 2) === 0;
  const ding = pick(['der Schlossgarten', 'die Schlossmauer', 'der Weg zum Turm', 'die Brücke']);
  const regel = `<p>Maßstab ${B('1 : ' + fmt(M))} heißt: ${B('1 cm')} auf dem Plan sind in Wirklichkeit ${fmt(M)} cm = ${B(eins)}.</p>`;
  return rev ? { type: 'fields', q: `In Wirklichkeit ist ${ding} ${B(x * f + ' ' + u)} lang. Wie lang ist das auf dem Plan im Maßstab ${B('1 : ' + fmt(M))}?`, parts: [{ ans: x }, ' cm'], explain: `${regel}<p>${x * f} ${u} : ${f === 1 ? '1' : f} ${u} = ${B(x + ' cm')} auf dem Plan.</p>` }
    : { type: 'fields', q: `Auf dem Plan (Maßstab ${B('1 : ' + fmt(M))}) ist ${ding} ${B(x + ' cm')} lang. Wie lang ist das in Wirklichkeit?`, parts: [{ ans: x * f }, ' ' + u], explain: `${regel}<p>${x} cm auf dem Plan → ${x} · ${eins} = ${B(x * f + ' ' + u)}</p>` };
};

/* =====================================================
   WELT 13: Pyramiden-Wüste – Körper, Netze, Würfelgebäude, Symmetrie
   ===================================================== */
const KOERPER = {
  wuerfel: { name: 'Würfel', E: 8, K: 12, F: 6, alltag: ['ein Spielwürfel', 'ein Zauberwürfel'], hint: 'Ich habe 6 gleich große Quadrate als Flächen.' },
  quader: { name: 'Quader', E: 8, K: 12, F: 6, alltag: ['ein Schuhkarton', 'ein Ziegelstein', 'eine Milchpackung'], hint: 'Ich habe 6 Rechtecke als Flächen und 8 Ecken.' },
  kugel: { name: 'Kugel', alltag: ['ein Fußball', 'eine Orange', 'eine Murmel'], hint: 'Ich habe keine Ecken und keine Kanten. Ich rolle in jede Richtung.' },
  zylinder: { name: 'Zylinder', alltag: ['eine Konservendose', 'eine Kerze', 'eine Litfaßsäule'], hint: 'Ich habe zwei Kreise als Flächen und kann rollen.' },
  kegel: { name: 'Kegel', alltag: ['eine Eiswaffel', 'ein Verkehrshütchen', 'ein Partyhut'], hint: 'Ich habe eine Spitze und einen Kreis als Boden.' },
  pyramide: { name: 'Pyramide', E: 5, K: 8, F: 5, alltag: ['die großen Bauwerke in Ägypten', 'das Dach eines Kirchturms'], hint: 'Ich habe ein Quadrat als Boden, 4 Dreiecke und eine Spitze.' },
  prisma: { name: 'Dreiecksprisma', E: 6, K: 9, F: 5, alltag: ['ein Zelt', 'ein Hausdach', 'eine dreieckige Schokoladenschachtel'], hint: 'Ich habe 2 Dreiecke und 3 Rechtecke als Flächen.' },
};
function koerperSVG(id) {
  const st = 'fill="#fde68a" stroke="#1f2937" stroke-width="3.5" stroke-linejoin="round"', dash = 'fill="none" stroke="#1f2937" stroke-width="2" stroke-dasharray="6 5"';
  const P = pts => pts.map(p => p.join(',')).join(' '); let s = '';
  const box = (x, y, w, h, dx, dy) => `<polygon points="${P([[x, y], [x + dx, y - dy], [x + w + dx, y - dy], [x + w + dx, y + h - dy], [x + w, y + h], [x, y + h]])}" ${st}/><polyline points="${P([[x, y], [x + w, y], [x + w, y + h]])}" fill="none" stroke="#1f2937" stroke-width="3.5"/><line x1="${x + w}" y1="${y}" x2="${x + w + dx}" y2="${y - dy}" stroke="#1f2937" stroke-width="3.5"/><polyline points="${P([[x, y + h], [x + dx, y + h - dy], [x + w + dx, y + h - dy]])}" ${dash}/><line x1="${x + dx}" y1="${y + h - dy}" x2="${x + dx}" y2="${y - dy}" ${dash}/>`;
  if (id === 'wuerfel') s = box(60, 70, 95, 95, 38, 30);
  else if (id === 'quader') s = box(30, 95, 145, 70, 36, 28);
  else if (id === 'kugel') s = `<circle cx="120" cy="100" r="72" ${st}/><path d="M48 100 A72 20 0 0 0 192 100" fill="none" stroke="#1f2937" stroke-width="2.5"/><path d="M48 100 A72 20 0 0 1 192 100" ${dash}/>`;
  else if (id === 'zylinder') s = `<path d="M65 50 V150 A55 17 0 0 0 175 150 V50" ${st}/><ellipse cx="120" cy="50" rx="55" ry="17" ${st}/><path d="M65 150 A55 17 0 0 1 175 150" ${dash}/>`;
  else if (id === 'kegel') s = `<path d="M60 152 L120 22 L180 152 A60 18 0 0 1 60 152" ${st}/><path d="M60 152 A60 18 0 0 1 180 152" ${dash}/>`;
  else if (id === 'pyramide') s = `<polygon points="${P([[40, 160], [150, 160], [200, 125], [120, 25]])}" ${st}/><line x1="150" y1="160" x2="120" y2="25" stroke="#1f2937" stroke-width="3.5"/><polyline points="${P([[40, 160], [90, 125], [200, 125]])}" ${dash}/><line x1="90" y1="125" x2="120" y2="25" ${dash}/>`;
  else s = `<polygon points="${P([[35, 160], [125, 160], [205, 130], [160, 45], [80, 75]])}" ${st}/><polyline points="${P([[35, 160], [80, 75], [125, 160]])}" fill="none" stroke="#1f2937" stroke-width="3.5"/><line x1="80" y1="75" x2="160" y2="45" stroke="#1f2937" stroke-width="3.5"/><polyline points="${P([[35, 160], [115, 130], [205, 130]])}" ${dash}/><line x1="115" y1="130" x2="160" y2="45" ${dash}/>`;
  return `<svg class="koerper" viewBox="0 0 240 190" xmlns="http://www.w3.org/2000/svg">${s}</svg>`;
}
const KIDS_K = Object.keys(KOERPER);
const genKoerperName = () => { const id = pick(KIDS_K), k = KOERPER[id]; return mc('Wie heißt dieser Körper?', k.name, shuffle(KIDS_K.filter(x => x !== id)).map(x => KOERPER[x].name), `<p>Das ist ein${id === 'pyramide' || id === 'kugel' ? 'e' : ''} ${B(k.name)}. ${k.hint.replace(/Ich habe/, 'Der Körper hat').replace(/Ich rolle/, 'Er rollt').replace(/ und kann rollen/, ' und kann rollen')}</p><p>Beispiel: ${k.alltag[0]}.</p>`, { visual: koerperSVG(id) }); };
const genKoerperAlltag = () => {
  const id = pick(KIDS_K), k = KOERPER[id], raetsel = rnd(0, 2) === 0;
  return mc(raetsel ? `Körper-Rätsel: „${k.hint}“<br>Wer bin ich?` : `Welche Form hat ${B(pick(k.alltag))}?`, k.name, shuffle(KIDS_K.filter(x => x !== id && !(id === 'wuerfel' && x === 'quader' && !raetsel))).map(x => KOERPER[x].name),
    `${koerperSVG(id)}<p>Das ist ${id === 'pyramide' || id === 'kugel' ? 'eine' : 'ein'} ${B(k.name)}. ${raetsel ? 'Beispiele: ' + k.alltag.join(', ') + '.' : k.hint.replace(/^Ich habe/, 'Dieser Körper hat').replace(/Ich rolle/, 'Er rollt')}</p>`);
};
const genEKF = () => {
  const id = pick(['wuerfel', 'quader', 'pyramide', 'prisma', 'wuerfel', 'quader']), k = KOERPER[id];
  return { type: 'fields', q: `Wie viele Ecken, Kanten und Flächen hat ${id === 'pyramide' ? 'die' : 'der'} ${B(id === 'prisma' ? 'Körper (Dreiecksprisma)' : k.name)}?<br><small>Gestrichelte Linien sind Kanten auf der Rückseite.</small>`, visual: koerperSVG(id),
    parts: ['Ecken: ', { ans: k.E }, '<br>', 'Kanten: ', { ans: k.K }, '<br>', 'Flächen: ', { ans: k.F }],
    explain: `${koerperSVG(id)}<p>${B(k.name)}: ${B(k.E)} Ecken (Spitzen), ${B(k.K)} Kanten (Linien) und ${B(k.F)} Flächen (Seiten).</p><p class="tip">💡 Zähle geordnet: erst alles oben, dann alles unten, dann was dazwischen liegt.</p>` };
};
/* Würfelnetze: 11 richtige und einige falsche Sechslinge */
const NETZE = [
  ...[[0, 0], [0, 1], [0, 2], [0, 3], [1, 1], [1, 2]].map(([t, b]) => [[[0, 1], [1, 1], [2, 1], [3, 1], [t, 0], [b, 2]], true]),
  ...[1, 2, 3].map(b => [[[0, 0], [1, 0], [1, 1], [2, 1], [3, 1], [b, 2]], true]),
  [[[0, 0], [1, 0], [1, 1], [2, 1], [2, 2], [3, 2]], true], [[[0, 0], [1, 0], [2, 0], [2, 1], [3, 1], [4, 1]], true],
  [[[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1]], false, 'Hier liegen Quadrate im Block. Wo vier Quadrate an einer Ecke zusammenstoßen, kann man keinen Würfel falten.'],
  [[[0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [0, 0]], false, 'Fünf Quadrate in einer Reihe: Schon das fünfte würde auf das erste klappen.'],
  [[[0, 1], [1, 1], [2, 1], [3, 1], [0, 0], [2, 0]], false, 'Beide „Deckel“ hängen auf derselben Seite. Sie klappen aufeinander – und auf der anderen Seite bleibt ein Loch.'],
  [[[0, 2], [1, 2], [2, 2], [3, 2], [1, 1], [1, 0]], false, 'Die zwei Quadrate oben klappen auf eine Seite, die schon besetzt ist – und der Boden fehlt.'],
  [[[0, 0], [1, 0], [0, 1], [1, 1], [2, 1], [3, 1]], false, 'Vier Quadrate liegen im Block. Wo vier Quadrate an einer Ecke zusammenstoßen, kann man keinen Würfel falten.'],
];
function netzSVG(cells) {
  const k = rnd(0, 3), mir = rnd(0, 1); let c = cells.map(([x, y]) => { if (mir) x = -x; for (let i = 0; i < k; i++) [x, y] = [-y, x]; return [x, y]; });
  const mx = Math.min(...c.map(p => p[0])), my = Math.min(...c.map(p => p[1])); c = c.map(p => [p[0] - mx, p[1] - my]);
  const W = Math.max(...c.map(p => p[0])) + 1, H = Math.max(...c.map(p => p[1])) + 1, C = 46;
  return `<svg class="netz" style="width:${W * 46 + 12}px" viewBox="-6 -6 ${W * C + 12} ${H * C + 12}" xmlns="http://www.w3.org/2000/svg">${c.map(p => `<rect x="${p[0] * C}" y="${p[1] * C}" width="${C}" height="${C}" fill="#fde68a" stroke="#1f2937" stroke-width="3.5"/>`).join('')}</svg>`;
}
const genNetz = () => {
  const ok = rnd(0, 1) === 0, n = pick(NETZE.filter(x => x[1] === ok));
  return tf(`Kannst du aus diesem Netz einen ${B('Würfel')} falten?`, ok, `<p>${ok ? 'Ja! Das ist ein richtiges Würfelnetz: 6 Quadrate, und beim Falten bekommt jede Würfelseite genau ein Quadrat.' : 'Nein. ' + n[2]}</p><p class="tip">💡 Stell dir vor, ein Quadrat ist der Boden. Klappe die anderen in Gedanken hoch.</p>`, { visual: netzSVG(n[0]) }, ['Ja', 'Nein']);
};
/* Würfelgebäude in Schrägansicht: h[y][x] = Höhe, y = 0 ist hinten */
function bauSVG(h) {
  const dx = 30, dy = 16, dz = 32, ny = h.length, nx = h[0].length, mz = Math.max(...h.flat()), ox = ny * dx + 10, oy = mz * dz + 14;
  const cube = (x, y, z) => { const X = ox + (x - y) * dx, Y = oy + (x + y) * dy - z * dz, p = a => a.map(q => q.join(',')).join(' '); return `<polygon points="${p([[X, Y - dz], [X + dx, Y - dz + dy], [X, Y - dz + 2 * dy], [X - dx, Y - dz + dy]])}" fill="#fde68a"/><polygon points="${p([[X - dx, Y - dz + dy], [X, Y - dz + 2 * dy], [X, Y + 2 * dy], [X - dx, Y + dy]])}" fill="#f59e0b"/><polygon points="${p([[X + dx, Y - dz + dy], [X, Y - dz + 2 * dy], [X, Y + 2 * dy], [X + dx, Y + dy]])}" fill="#d97706"/>`; };
  let s = '';
  for (let d = 0; d <= nx + ny - 2; d++) for (let y = 0; y < ny; y++) { const x = d - y; if (x < 0 || x >= nx) continue; for (let z = 0; z < h[y][x]; z++) s += cube(x, y, z); }
  return `<svg class="bau" viewBox="0 0 ${(nx + ny) * dx + 20} ${oy + (nx + ny) * dy + 12}" xmlns="http://www.w3.org/2000/svg" stroke="#1f2937" stroke-width="2" stroke-linejoin="round">${s}</svg>`;
}
function bauRandom() {
  for (;;) {
    const h = [[], [], []];
    for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) { const m = Math.min(y ? h[y - 1][x] : 3, x ? h[y][x - 1] : 3); h[y][x] = x + y === 0 ? rnd(2, 3) : rnd(Math.max(0, m - 1), m); }
    const n = h.flat().reduce((a, b) => a + b, 0); if (n >= 6 && n <= 20) return h;
  }
}
const lagen = h => [1, 2, 3].map(z => h.flat().filter(v => v >= z).length).filter(Boolean);
const genWuerfelbau = fehlt => () => {
  const h = bauRandom(), n = h.flat().reduce((a, b) => a + b, 0), L = lagen(h);
  const ex = `<p>Zähle Stockwerk für Stockwerk: ${L.map((v, i) => `${['unten', 'in der Mitte', 'oben'][i === L.length - 1 && L.length === 2 ? 2 : i]} ${v}`).join(', ')}.</p><p>${L.join(' + ')} = ${B(n)} Würfel</p><p class="tip">💡 Vergiss die Würfel nicht, die unter anderen versteckt sind!</p>`;
  return fehlt ? { type: 'fields', q: `Das Gebäude soll ein großer Würfel aus ${B('3 · 3 · 3 = 27')} kleinen Würfeln werden. Wie viele Würfel ${B('fehlen')} noch?<br><small>Hinter dem Gebäude ist nichts versteckt.</small>`, visual: bauSVG(h), parts: [{ ans: 27 - n }, ' Würfel'], explain: `${ex}<p>Es fehlen: 27 − ${n} = ${B(27 - n)}</p>` }
    : { type: 'fields', q: `Aus wie vielen Würfeln besteht das Gebäude?<br><small>Hinter dem Gebäude ist nichts versteckt.</small>`, visual: bauSVG(h), parts: [{ ans: n }, ' Würfel'], explain: ex };
};
const genQuaderVol = () => {
  const a = rnd(2, 4), b = rnd(2, 3), c = rnd(2, 3), h = Array.from({ length: b }, () => Array(a).fill(c));
  return { type: 'fields', q: 'Wie viele kleine Würfel stecken in diesem Quader?', visual: bauSVG(h), parts: [{ ans: a * b * c }, ' Würfel'],
    explain: `<p>In einer Schicht liegen ${a} · ${b} = ${a * b} Würfel.</p><p>Es gibt ${c} Schichten übereinander: ${c} · ${a * b} = ${B(a * b * c)}</p><p class="tip">💡 So misst man den Rauminhalt: Man zählt, wie viele Einheitswürfel hineinpassen.</p>` };
};
/* Spiegelbild im Kästchengitter (Aufgabentyp „cells“) */
function spiegelSVG(m, sel, reveal) {
  const C = 50, { W, H } = m, key = c => c.join(','), ans = new Set(m.ans.map(key)), on = new Set((sel || []).map(key)); let s = '';
  for (let x = 0; x < W; x++) for (let y = 0; y < H; y++) {
    const k = x + ',' + y, giv = m.given.some(c => key(c) === k), tgt = m.vert ? x >= W / 2 : y >= H / 2;
    let f = giv ? '#7c3aed' : tgt ? '#ffffff' : '#f1f5f9';
    if (!giv && on.has(k)) f = reveal ? (ans.has(k) ? '#16a34a' : '#e11d48') : '#2563eb';
    else if (!giv && reveal && ans.has(k)) f = '#bbf7d0';
    s += `<rect x="${x * C}" y="${y * C}" width="${C}" height="${C}" fill="${f}" stroke="#94a3b8" stroke-width="1.5"/>`;
  }
  s += m.vert ? `<line x1="${W / 2 * C}" y1="-8" x2="${W / 2 * C}" y2="${H * C + 8}" stroke="#e11d48" stroke-width="5" stroke-dasharray="12 8"/>` : `<line x1="-8" y1="${H / 2 * C}" x2="${W * C + 8}" y2="${H / 2 * C}" stroke="#e11d48" stroke-width="5" stroke-dasharray="12 8"/>`;
  return `<svg class="spiegel" viewBox="-10 -10 ${W * C + 20} ${H * C + 20}" xmlns="http://www.w3.org/2000/svg">${s}</svg>`;
}
const genSpiegel = lvl => () => {
  const vert = lvl === 0 || rnd(0, 1) === 0, W = vert ? 8 : 6, H = vert ? 6 : 8, hw = vert ? 4 : 6, hh = vert ? 6 : 4, n = lvl === 0 ? rnd(4, 5) : rnd(6, 8);
  const set = new Set(); let cur = vert ? [3, rnd(1, 4)] : [rnd(1, 4), 3]; set.add(cur.join(','));
  for (let g = 0; set.size < n && g < 200; g++) { const b = pick([...set]).split(',').map(Number), d = pick([[1, 0], [-1, 0], [0, 1], [0, -1]]), c = [b[0] + d[0], b[1] + d[1]]; if (c[0] >= 0 && c[0] < hw && c[1] >= 0 && c[1] < hh) set.add(c.join(',')); }
  const given = [...set].map(k => k.split(',').map(Number)), ans = given.map(([x, y]) => vert ? [W - 1 - x, y] : [x, H - 1 - y]), m = { W, H, vert, given, ans };
  return { type: 'cells', q: `Ergänze das ${B('Spiegelbild')}: Tippe auf der anderen Seite der roten Spiegelachse alle Kästchen an, die gefärbt sein müssen.`, mirror: m,
    explain: `${spiegelSVG(m, ans, true)}<p>Jedes Kästchen hat ein Spiegel-Kästchen: ${B('gleich weit')} von der Spiegelachse entfernt, genau gegenüber.</p><p class="tip">💡 Zähle für jedes Kästchen: Wie viele Kästchen bis zur Achse? Genauso viele auf der anderen Seite weiter.</p>` };
};
const ACHSEN = [
  ['ein Quadrat', '4', [[55, 45], [165, 45], [165, 155], [55, 155]], [[110, 30, 110, 170], [40, 100, 180, 100], [45, 35, 175, 165], [175, 35, 45, 165]]],
  ['ein Rechteck', '2', [[35, 60], [185, 60], [185, 140], [35, 140]], [[110, 45, 110, 155], [20, 100, 200, 100]]],
  ['ein gleichseitiges Dreieck', '3', [[110, 35], [185, 165], [35, 165]], [[110, 20, 110, 180], [28, 170, 158, 95], [192, 170, 62, 95]]],
  ['ein Parallelogramm', '0', [[35, 145], [150, 145], [185, 55], [70, 55]], []],
  ['eine Raute', '2', [[110, 30], [165, 100], [110, 170], [55, 100]], [[110, 18, 110, 182], [40, 100, 180, 100]]],
  ['ein gleichschenkliges Trapez', '1', [[35, 150], [185, 150], [150, 60], [70, 60]], [[110, 45, 110, 165]]],
  ['ein Drachenviereck', '1', [[110, 30], [160, 80], [110, 175], [60, 80]], [[110, 18, 110, 187]]],
  ['ein Kreis', 'unendlich viele', null, [[110, 20, 110, 180], [30, 100, 190, 100], [53, 43, 167, 157], [167, 43, 53, 157]]],
];
function achsenSVG(a, show) {
  return `<svg class="shape" viewBox="0 0 220 200" xmlns="http://www.w3.org/2000/svg">${a[2] ? `<polygon points="${a[2].map(p => p.join(',')).join(' ')}" fill="#fde68a" stroke="#1f2937" stroke-width="4" stroke-linejoin="round"/>` : '<circle cx="110" cy="100" r="68" fill="#fde68a" stroke="#1f2937" stroke-width="4"/>'}${show ? a[3].map(l => `<line x1="${l[0]}" y1="${l[1]}" x2="${l[2]}" y2="${l[3]}" stroke="#e11d48" stroke-width="3.5" stroke-dasharray="9 6"/>`).join('') : ''}</svg>`;
}
const genAchsen = () => {
  const a = pick(ACHSEN);
  return mc(`Wie viele ${B('Symmetrieachsen')} (Spiegelachsen) hat ${a[0]}?`, a[1], shuffle(['0', '1', '2', '3', '4', 'unendlich viele'].filter(x => x !== a[1])),
    `${achsenSVG(a, true)}<p>${a[1] === '0' ? 'Ein Parallelogramm kann man nicht so falten, dass beide Hälften genau aufeinander liegen: ' + B('keine') + ' Symmetrieachse.' : a[1] === 'unendlich viele' ? 'Jede Linie durch den Mittelpunkt ist eine Spiegelachse – das sind ' + B('unendlich viele') + '.' : `Die roten Linien sind die Symmetrieachsen: ${B(a[1])}.`}</p><p class="tip">💡 Falt-Test: An einer Symmetrieachse gefaltet, liegen beide Hälften genau aufeinander.</p>`, { visual: achsenSVG(a) });
};

/* =====================================================
   WELT 14: Jahrmarkt – Daten, Zufall, Kombinatorik, erste Brüche
   ===================================================== */
const FARBEN = { rot: ['Rot', '#ef4444'], blau: ['Blau', '#3b82f6'], gelb: ['Gelb', '#facc15'], gruen: ['Grün', '#22c55e'] };
const FK = Object.keys(FARBEN);
function diagSVG(d) { // d: { cats: [[name, wert]], step }
  const max = Math.ceil(Math.max(...d.cats.map(c => c[1])) / d.step) * d.step, H = 220, bw = 62, x0 = 56, W = x0 + d.cats.length * (bw + 22) + 10, Y = v => 20 + H - v / max * H;
  let s = '';
  for (let v = 0; v <= max; v += d.step) s += `<line x1="${x0 - 6}" y1="${Y(v)}" x2="${W - 6}" y2="${Y(v)}" stroke="${v ? '#cbd5e1' : '#1f2937'}" stroke-width="${v ? 1.5 : 3}"/><text x="${x0 - 12}" y="${Y(v) + 6}" text-anchor="end" font-size="16" font-weight="700" fill="#475569">${v}</text>`;
  if (d.half) for (let v = d.step / 2; v < max; v += d.step) s += `<line x1="${x0 - 6}" y1="${Y(v)}" x2="${W - 6}" y2="${Y(v)}" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="4 4"/>`;
  d.cats.forEach((c, i) => { const x = x0 + 12 + i * (bw + 22); s += `<rect x="${x}" y="${Y(c[1])}" width="${bw}" height="${H - (Y(c[1]) - 20)}" fill="${['#f43f5e', '#3b82f6', '#f59e0b', '#22c55e', '#a855f7'][i]}" rx="5"/><text x="${x + bw / 2}" y="${H + 42}" text-anchor="middle" font-size="14.5" font-weight="800" fill="#1f2937">${c[0]}</text>`; });
  return `<svg class="diag" viewBox="0 0 ${W} ${H + 54}" xmlns="http://www.w3.org/2000/svg">${s}</svg>`;
}
const genDiagramm = lvl => () => {
  const step = pick(lvl ? [10, 20, 50] : [5, 10]), half = lvl > 0, names = shuffle(['Karussell', 'Riesenrad', 'Rutsche', 'Zuckerwatte', 'Losbude']).slice(0, 4);
  const vs = shuffle([1, 2, 3, 4, 5, 6, 7, 8]).slice(0, 4).map(k => k * step + (half && rnd(0, 1) ? step / 2 : 0)), cats = names.map((n, i) => [n, vs[i]]), d = { cats, step, half }, vis = diagSVG(d);
  const t = rnd(0, lvl ? 3 : 1), [a, b] = shuffle(cats), tab = `<p>${cats.map(c => `${c[0]}: ${B(c[1])}`).join(' · ')}</p>`;
  const head = 'Das Diagramm zeigt, wie viele Karten heute verkauft wurden.<br>';
  if (t === 0) return { type: 'fields', q: `${head}Wie viele Karten waren es für ${B(a[0])}?`, visual: vis, parts: [{ ans: a[1] }, ' Karten'], explain: `${tab}<p>Gehe vom oberen Rand der Säule nach links zur Zahlenleiste.${half ? ` Endet die Säule genau zwischen zwei Linien, liegt der Wert in der Mitte (halber Schritt = ${step / 2}).` : ''}</p>` };
  if (t === 1) { const top = rnd(0, 1) === 0, s = cats.slice().sort((x, y) => x[1] - y[1]), c = top ? s[3] : s[0]; return mc(`${head}Wofür wurden die ${B(top ? 'meisten' : 'wenigsten')} Karten verkauft?`, c[0], cats.filter(x => x !== c).map(x => x[0]), `${tab}<p>Die ${top ? 'höchste' : 'niedrigste'} Säule gehört zu ${B(c[0])}.</p>`, { visual: vis }); }
  if (t === 2) { const hi = a[1] > b[1] ? a : b, lo = hi === a ? b : a; return { type: 'fields', q: `${head}Wie viele Karten wurden für ${B(hi[0])} ${B('mehr')} verkauft als für ${B(lo[0])}?`, visual: vis, parts: [{ ans: hi[1] - lo[1] }, ' Karten'], explain: `${tab}<p>Unterschied: ${hi[1]} − ${lo[1]} = ${B(hi[1] - lo[1])}</p>` }; }
  const sum = vs.reduce((x, y) => x + y, 0); return { type: 'fields', q: `${head}Wie viele Karten wurden ${B('insgesamt')} verkauft?`, visual: vis, parts: [{ ans: sum }, ' Karten'], explain: `${tab}<p>${vs.join(' + ')} = ${B(sum)}</p>` };
};
function radSVG(secs, label) { // secs: Liste von Farb-Schlüsseln, alle Felder gleich groß
  const n = secs.length, cx = 110, cy = 112, r = 92; let s = '';
  secs.forEach((f, i) => { const a1 = i / n * 2 * Math.PI - Math.PI / 2, a2 = (i + 1) / n * 2 * Math.PI - Math.PI / 2; s += n === 1 ? `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${f}" stroke="#1f2937" stroke-width="3"/>` : `<path d="M${cx} ${cy} L${cx + r * Math.cos(a1)} ${cy + r * Math.sin(a1)} A${r} ${r} 0 0 1 ${cx + r * Math.cos(a2)} ${cy + r * Math.sin(a2)}Z" fill="${f}" stroke="#1f2937" stroke-width="3" stroke-linejoin="round"/>`; });
  return `<svg class="rad" viewBox="0 0 220 ${label ? 238 : 212}" xmlns="http://www.w3.org/2000/svg">${s}<circle cx="${cx}" cy="${cy}" r="9" fill="#1f2937"/><path d="M${cx - 11} 4 h22 l-11 24z" fill="#1f2937"/>${label ? `<text x="110" y="232" text-anchor="middle" font-size="20" font-weight="800" fill="#1f2937">${label}</text>` : ''}</svg>`;
}
const radOf = cnt => shuffle(Object.keys(cnt).flatMap(k => Array(cnt[k]).fill(FARBEN[k][1])));
const zaehl = cnt => Object.keys(cnt).filter(k => cnt[k]).map(k => `${FARBEN[k][0]}: ${cnt[k]}`).join(' · ');
const SMU = ['sicher', 'möglich, aber nicht sicher', 'unmöglich'];
function radCounts(n) { for (;;) { const ks = shuffle(FK).slice(0, rnd(2, 3)), c = {}; let left = n; ks.forEach((k, i) => { c[k] = i === ks.length - 1 ? left : rnd(1, left - (ks.length - 1 - i)); left -= c[k]; }); if (ks.every(k => c[k] > 0)) return c; } }
const genGluecksrad = () => {
  const n = pick([6, 8, 8, 10]), t = rnd(0, 3);
  if (t === 0) { let c, m; do { c = radCounts(n); m = Math.max(...Object.values(c)); } while (Object.values(c).filter(v => v === m).length > 1); const win = Object.keys(c).find(k => c[k] === m);
    return mc(`Das Glücksrad wird gedreht. Bei welcher Farbe bleibt es ${B('am wahrscheinlichsten')} stehen?`, FARBEN[win][0], FK.filter(k => k !== win).map(k => FARBEN[k][0]), `<p>Zähle die Felder: ${zaehl(c)} (von ${n}).</p><p>${B(FARBEN[win][0])} hat die meisten Felder – das ist am wahrscheinlichsten.</p>`, { visual: radSVG(radOf(c)) }); }
  if (t === 1) { const c = radCounts(n), [a, b] = shuffle(Object.keys(c));
    return fixed(`Vergleiche ${B(FARBEN[a][0])} und ${B(FARBEN[b][0])}. Was ist wahrscheinlicher?`, [FARBEN[a][0], FARBEN[b][0], 'Beide gleich wahrscheinlich'], c[a] > c[b] ? 0 : c[a] < c[b] ? 1 : 2, `<p>Zähle die Felder: ${zaehl(c)}.</p><p>${c[a] === c[b] ? 'Gleich viele Felder → ' + B('gleich wahrscheinlich') + '.' : `Mehr Felder → wahrscheinlicher: ${B(FARBEN[c[a] > c[b] ? a : b][0])}.`}</p>`, { visual: radSVG(radOf(c)) }); }
  if (t === 2) { const c = radCounts(n), ks = Object.keys(c), miss = FK.find(k => !ks.includes(k)), v = rnd(0, 2);
    const st = v === 0 ? `Der Zeiger bleibt auf ${FARBEN[miss][0]} stehen.` : v === 1 ? `Der Zeiger bleibt auf ${FARBEN[ks[0]][0]} stehen.` : `Der Zeiger bleibt auf ${ks.map(k => FARBEN[k][0]).join(' oder ')} stehen.`;
    return fixed(`Wie wahrscheinlich ist das?<br>„${st}“`, SMU, v === 0 ? 2 : v === 1 ? 1 : 0, `<p>Auf dem Rad gibt es: ${zaehl(c)}.</p><p>${v === 0 ? `${FARBEN[miss][0]} kommt gar nicht vor → ${B('unmöglich')}.` : v === 1 ? `${FARBEN[ks[0]][0]} kommt vor, aber es gibt auch andere Farben → ${B('möglich, aber nicht sicher')}.` : `Andere Farben gibt es nicht → ${B('sicher')}.`}</p>`, { visual: radSVG(radOf(c)) }); }
  let n1, n2, r1, r2; do { n1 = pick([4, 6, 8]); n2 = pick([4, 6, 8, 10]); r1 = rnd(1, n1 - 1); r2 = rnd(1, n2 - 1); } while (n1 === n2);
  const rad = (r, m) => shuffle([...Array(r).fill(FARBEN.rot[1]), ...Array(m - r).fill('#e2e8f0')]), cmp = r1 * n2 - r2 * n1, half = (r, m) => 2 * r === m ? 'genau die Hälfte' : 2 * r > m ? 'mehr als die Hälfte' : 'weniger als die Hälfte';
  return fixed(`Du gewinnst bei ${B('Rot')}. Welches Glücksrad ist besser für dich?`, ['Rad A', 'Rad B', 'Beide gleich gut'], cmp > 0 ? 0 : cmp < 0 ? 1 : 2,
    `<p>Rad A: ${r1} von ${n1} Feldern sind rot (${half(r1, n1)}).<br>Rad B: ${r2} von ${n2} Feldern sind rot (${half(r2, n2)}).</p><p>Es kommt nicht auf die Anzahl an, sondern auf den ${B('Anteil')}: Wie viel vom ganzen Rad ist rot? ${cmp === 0 ? 'Hier ist der Anteil gleich.' : `Bei Rad ${cmp > 0 ? 'A' : 'B'} ist der rote Teil größer.`}</p>`,
    { visual: `<div class="row2">${radSVG(rad(r1, n1), 'Rad A')}${radSVG(rad(r2, n2), 'Rad B')}</div>` });
};
function beutelSVG(c) {
  const balls = shuffle(Object.keys(c).flatMap(k => Array(c[k]).fill(FARBEN[k][1]))), per = 6, rows = Math.ceil(balls.length / per);
  return `<svg class="beutel" viewBox="0 0 ${per * 44 + 20} ${rows * 44 + 20}" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="${per * 44 + 16}" height="${rows * 44 + 16}" rx="22" fill="#f1f5f9" stroke="#94a3b8" stroke-width="3"/>${balls.map((f, i) => `<circle cx="${32 + i % per * 44}" cy="${32 + Math.floor(i / per) * 44}" r="17" fill="${f}" stroke="#1f2937" stroke-width="2.5"/>`).join('')}</svg>`;
}
const genBeutel = () => {
  const t = rnd(0, 2), ks = shuffle(FK).slice(0, 3), c = {}; let ok = false;
  while (!ok) { ks.forEach(k => { c[k] = rnd(1, 6); }); const vs = Object.values(c), m = Math.max(...vs); ok = vs.filter(v => v === m).length === 1 && vs.reduce((a, b) => a + b, 0) <= 12; }
  const vis = beutelSVG(c), head = 'Im Lostopf liegen diese Kugeln. Du ziehst eine Kugel, ohne hinzusehen.<br>';
  if (t === 0) { const top = rnd(0, 2) > 0, s = ks.slice().sort((a, b) => c[a] - c[b]); if (!top && c[s[0]] === c[s[1]]) c[s[1]]++; const w = top ? s[2] : s[0];
    return mc(`${head}Welche Farbe ziehst du ${B(top ? 'am wahrscheinlichsten' : 'am unwahrscheinlichsten')}?`, FARBEN[w][0], ks.filter(k => k !== w).map(k => FARBEN[k][0]), `<p>Zähle: ${zaehl(c)}.</p><p>${top ? 'Die meisten' : 'Die wenigsten'} Kugeln sind ${B(FARBEN[w][0])}.</p>`, { visual: beutelSVG(c), n: 3 }); }
  if (t === 1) { const miss = FK.find(k => !ks.includes(k)), v = rnd(0, 2), st = v === 0 ? `Du ziehst eine Kugel in ${FARBEN[miss][0]}.` : v === 1 ? `Du ziehst eine Kugel in ${FARBEN[ks[0]][0]}.` : 'Du ziehst eine Kugel.';
    return fixed(`${head}„${st}“ – Das ist …`, SMU, v === 0 ? 2 : v === 1 ? 1 : 0, `<p>Im Topf: ${zaehl(c)}.</p><p>${v === 0 ? `${FARBEN[miss][0]} gibt es nicht → ${B('unmöglich')}.` : v === 1 ? `Es gibt ${FARBEN[ks[0]][0]}, aber auch andere Farben → ${B('möglich, aber nicht sicher')}.` : `Im Topf sind nur Kugeln → ${B('sicher')}.`}</p>`, { visual: vis }); }
  const s = ks.slice().sort((a, b) => c[a] - c[b]), lo = s[0], hi = s[2];
  return { type: 'fields', q: `${head}Wie viele Kugeln in ${B(FARBEN[lo][0])} musst du dazulegen, damit ${FARBEN[lo][0]} und ${FARBEN[hi][0]} ${B('gleich wahrscheinlich')} sind?`, visual: vis, parts: [{ ans: c[hi] - c[lo] }, ' Kugeln'], explain: `<p>Jetzt: ${zaehl(c)}.</p><p>Gleich wahrscheinlich heißt: gleich viele Kugeln. ${c[hi]} − ${c[lo]} = ${B(c[hi] - c[lo])}</p>` };
};
const WUERFELW = [
  ['eine 6', 'eine gerade Zahl', 1, 'Eine 6 ist nur 1 von 6 Zahlen. Gerade sind 2, 4 und 6 – das sind 3 von 6.'], ['eine Zahl kleiner als 3', 'eine Zahl größer als 3', 1, 'Kleiner als 3 sind 1 und 2 (zwei Zahlen). Größer als 3 sind 4, 5 und 6 (drei Zahlen).'],
  ['eine 1', 'eine 6', 2, 'Jede einzelne Zahl ist gleich wahrscheinlich: 1 von 6.'], ['eine gerade Zahl', 'eine ungerade Zahl', 2, 'Gerade: 2, 4, 6. Ungerade: 1, 3, 5. Beides sind 3 von 6.'],
  ['eine Zahl größer als 4', 'eine Zahl kleiner als 4', 1, 'Größer als 4 sind 5 und 6 (zwei Zahlen). Kleiner als 4 sind 1, 2 und 3 (drei Zahlen).'], ['eine 3 oder eine 4', 'eine 5', 0, '3 oder 4 sind zwei Zahlen, die 5 ist nur eine.'],
];
const WUERFELS = [['Du würfelst eine Zahl kleiner als 7.', 0, 'Alle Zahlen auf dem Würfel (1 bis 6) sind kleiner als 7.'], ['Du würfelst eine 7.', 2, 'Auf einem Spielwürfel gibt es nur 1 bis 6.'], ['Du würfelst eine 3.', 1, 'Die 3 kann kommen, aber auch jede andere Zahl.'], ['Du würfelst eine gerade Zahl.', 1, '2, 4 und 6 sind gerade, 1, 3 und 5 nicht.'], ['Du würfelst eine Zahl größer als 0.', 0, 'Alle Zahlen von 1 bis 6 sind größer als 0.'], ['Du würfelst zweimal und hast zusammen 13.', 2, 'Mehr als 6 + 6 = 12 geht nicht.']];
const genWuerfelW = () => {
  if (rnd(0, 1)) { const w = pick(WUERFELW); return fixed(`Du würfelst einmal mit einem Spielwürfel. Was ist wahrscheinlicher?`, [w[0], w[1], 'Beides gleich wahrscheinlich'], w[2], `<p>${w[3]}</p><p class="tip">💡 Zähle, wie viele der 6 Würfelzahlen passen.</p>`); }
  const w = pick(WUERFELS); return fixed(`Spielwürfel: „${w[0]}“ – Das ist …`, SMU, w[1], `<p>${w[2]} → ${B(SMU[w[1]])}</p>`);
};
const genKombi = () => {
  const t = rnd(0, 4), k = kid();
  if (t === 0) { const a = rnd(3, 5), b = rnd(2, 4); return { type: 'fields', q: `Am Eisstand gibt es ${B(a + ' Eissorten')} und ${B(b + ' Soßen')}. ${k} nimmt eine Kugel Eis mit einer Soße. Wie viele verschiedene Möglichkeiten gibt es?`, parts: [{ ans: a * b }, ' Möglichkeiten'], explain: `<p>Zu ${B('jeder')} der ${a} Eissorten passen ${b} Soßen: ${a} · ${b} = ${B(a * b)}</p><p class="tip">💡 Ein Baumdiagramm hilft: erst ${a} Äste für das Eis, an jedem Ast ${b} Zweige für die Soße.</p>` }; }
  if (t === 1) { const a = rnd(3, 5), b = rnd(2, 3); return { type: 'fields', q: `${k} hat ${B(a + ' T-Shirts')} und ${B(b + ' Hosen')}. Wie viele verschiedene Outfits kann ${k} anziehen?`, parts: [{ ans: a * b }, ' Outfits'], explain: `<p>Jedes T-Shirt passt zu jeder Hose: ${a} · ${b} = ${B(a * b)}</p>` }; }
  if (t === 2) return { type: 'fields', q: `${k} baut Türme mit drei Stockwerken aus einem roten, einem blauen und einem gelben Stein. Wie viele ${B('verschiedene')} Türme gibt es?`, parts: [{ ans: 6 }, ' Türme'], explain: `<p>Unten 3 Möglichkeiten, in der Mitte noch 2, oben bleibt 1: 3 · 2 · 1 = ${B(6)}</p><p>RBG, RGB, BRG, BGR, GRB, GBR</p>` };
  if (t === 3) { const n = rnd(3, 5), z = shuffle([2, 3, 4, 5, 6, 7, 8, 9]).slice(0, n).sort(); return { type: 'fields', q: `Auf dem Tisch liegen die Ziffernkarten ${B(z.join(', '))}. Wie viele verschiedene ${B('zweistellige')} Zahlen kannst du legen? (Jede Karte nur einmal.)`, parts: [{ ans: n * (n - 1) }, ' Zahlen'], explain: `<p>Für die Zehnerstelle gibt es ${n} Karten, für die Einerstelle bleiben ${n - 1}: ${n} · ${n - 1} = ${B(n * (n - 1))}</p><p class="tip">💡 Schreibe geordnet auf: erst alle Zahlen mit ${z[0]} vorn, dann mit ${z[1]} …</p>` }; }
  const n = rnd(3, 6); return { type: 'fields', q: `${B(n + ' Kinder')} begrüßen sich. Jedes Kind gibt jedem anderen genau einmal die Hand. Wie oft werden Hände geschüttelt?`, parts: [{ ans: n * (n - 1) / 2 }, '-mal'], explain: `<p>Das erste Kind schüttelt ${n - 1} Hände, das zweite noch ${n - 2} neue …</p><p>${Array.from({ length: n - 1 }, (_, i) => n - 1 - i).join(' + ')} = ${B(n * (n - 1) / 2)}</p>` };
};
const BRUCH = { '1/2': '½', '1/3': '⅓', '2/3': '⅔', '1/4': '¼', '3/4': '¾', '1/6': '⅙', '5/6': '⅚', '1/8': '⅛', '3/8': '⅜', '5/8': '⅝', '7/8': '⅞' };
const genBruch = () => {
  if (rnd(0, 2) === 0) { const [sym, d, z, w] = pick([['die Hälfte', 2, 1, '½'], ['ein Drittel', 3, 1, '⅓'], ['ein Viertel', 4, 1, '¼'], ['drei Viertel', 4, 3, '¾']]), n = d * rnd(2, 9);
    return { type: 'fields', q: `An der Losbude liegen ${B(n + ' Lose')}. ${B(sym[0].toUpperCase() + sym.slice(1))} (${w}) davon sind Gewinne. Wie viele Gewinne sind das?`, parts: [{ ans: n / d * z }, ' Gewinne'], explain: `<p>Teile in ${d} gleiche Teile: ${n} : ${d} = ${n / d}.</p>${z > 1 ? `<p>Nimm ${z} davon: ${z} · ${n / d} = ${B(n / d * z)}</p>` : `<p>Ein Teil davon: ${B(n / d)}</p>`}` }; }
  const key = pick(Object.keys(BRUCH)), [z, d] = key.split('/').map(Number), secs = [...Array(z).fill(FARBEN.rot[1]), ...Array(d - z).fill('#f1f5f9')];
  const wrong = [`${z}/${d - z}`, `${d - z}/${d}`, `1/${z}`, ...shuffle(Object.keys(BRUCH))].filter(k => BRUCH[k] && k !== key).map(k => BRUCH[k]);
  return mc(`Welcher ${B('Bruchteil')} der Pizza ist rot belegt?`, BRUCH[key], wrong,
    `<p>Die Pizza ist in ${B(d)} gleich große Stücke geteilt (das steht unten). ${B(z)} davon ${z === 1 ? 'ist' : 'sind'} rot (das steht oben): ${B(BRUCH[key])}</p><p class="tip">💡 Unten: in wie viele Teile geteilt. Oben: wie viele Teile gemeint sind.</p>`, { visual: radSVG(secs).replace(/<path d="M\d+ 4[^>]*>/, '') });
};

/* =====================================================
   WELT 15: Sternwarte – Rechenregeln, Gleichungen, Knobeln
   ===================================================== */
const genPunktStrich = () => {
  const t = rnd(0, 5), a = rnd(2, 9), b = rnd(2, 9), c = rnd(2, 9); let txt, ans, why;
  if (t === 0) { const s = rnd(4, 30); txt = `${s} + ${a} · ${b}`; ans = s + a * b; why = `Erst ${a} · ${b} = ${a * b}, dann ${s} + ${a * b}`; }
  else if (t === 1) { const s = rnd(2, a * b - 1); txt = `${a} · ${b} − ${s}`; ans = a * b - s; why = `Erst ${a} · ${b} = ${a * b}, dann ${a * b} − ${s}`; }
  else if (t === 2) { const s = rnd(b + 2, 60); txt = `${s} − ${a * b} : ${a}`; ans = s - b; why = `Erst ${a * b} : ${a} = ${b}, dann ${s} − ${b}`; }
  else if (t === 3) { txt = `(${a} + ${b}) · ${c}`; ans = (a + b) * c; why = `Erst die Klammer: ${a} + ${b} = ${a + b}, dann ${a + b} · ${c}`; }
  else if (t === 4) { const x = rnd(c + 1, c + 9); txt = `${a} · (${x} − ${c})`; ans = a * (x - c); why = `Erst die Klammer: ${x} − ${c} = ${x - c}, dann ${a} · ${x - c}`; }
  else { const s = rnd(10, 40), d = rnd(2, 9); txt = `${s} + ${a} · ${b} − ${d}`; ans = s + a * b - d; why = `Erst ${a} · ${b} = ${a * b}, dann von links: ${s} + ${a * b} − ${d}`; }
  return { type: 'fields', q: 'Achte auf die Rechenregeln!', parts: [`${txt} = `, { ans }], explain: `<p>${why} = ${B(ans)}</p><p class="tip">💡 1. Klammern zuerst &nbsp;·&nbsp; 2. Punkt vor Strich (· und : vor + und −) &nbsp;·&nbsp; 3. sonst von links nach rechts</p>` };
};
const genTermWahl = () => {
  const t = rnd(0, 2), k = kid(), a = rnd(3, 6), b = rnd(2, 5), c = rnd(6, 12); let q, ok, wr, erg;
  if (t === 0) { q = `${k} kauft ${B(a + ' Hefte')} für je ${B(b + ' €')} und einen Füller für ${B(c + ' €')}. Wie viel muss ${k} bezahlen?`; ok = `${a} · ${b} + ${c}`; wr = [`${a} + ${b} + ${c}`, `${a} · (${b} + ${c})`, `${a} · ${b} · ${c}`]; erg = a * b + c; }
  else if (t === 1) { const g = a * b + rnd(3, 20); q = `${k} hat ${B(g + ' €')} und kauft ${B(a + ' Karten')} für je ${B(b + ' €')}. Wie viel Geld bleibt übrig?`; ok = `${g} − ${a} · ${b}`; wr = [`(${g} − ${a}) · ${b}`, `${g} − ${a} − ${b}`, `${g} + ${a} · ${b}`]; erg = g - a * b; }
  else { q = `${B(a + ' Kinder')} und ${B(b + ' Erwachsene')} gehen in die Sternwarte. Jeder zahlt ${B(c + ' €')} Eintritt. Wie viel zahlen alle zusammen?`; ok = `(${a} + ${b}) · ${c}`; wr = [`${a} + ${b} · ${c}`, `${a} · ${b} · ${c}`, `${a} + ${b} + ${c}`]; erg = (a + b) * c; }
  return mc(`${q}<br>Welche Rechnung passt?`, ok, wr, `<p>Richtig ist ${B(ok)} = ${B(erg + ' €')}.</p><p class="tip">💡 „je“ bedeutet mal. Was zusammengehört und zuerst gerechnet werden soll, kommt in die Klammer – oder ist eine Punktrechnung.</p>`);
};
const genGleichung = () => {
  const t = rnd(0, 3), d = rnd(3, 9);
  if (t === 0) { const q = rnd(2, 9) * 100; return { type: 'fields', q: 'Welche Zahl gehört in das Kästchen?', parts: [{ ans: q }, ` · ${d} = ${fmt(d * q)}`], explain: `<p>Umkehraufgabe: ${fmt(d * q)} : ${d} = ${B(fmt(q))}</p>` }; }
  if (t === 1) { const a = rnd(5, 10) * 100, x = rnd(12, 48) * 10 - 5; return { type: 'fields', q: 'Welche Zahl gehört in das Kästchen?', parts: [`${fmt(a)} − `, { ans: x }, ` = ${fmt(a - x)}`], explain: `<p>Wie viel wurde weggenommen? ${fmt(a)} − ${fmt(a - x)} = ${B(x)}</p>` }; }
  if (t === 2) { const x = rnd(4, 15), m = rnd(2, 6), p = rnd(3, 20); return { type: 'fields', q: `Zahlenrätsel: „Ich denke mir eine Zahl. Ich ${B('multipliziere sie mit ' + m)} und ${B('addiere ' + p)}. Ich erhalte ${B(x * m + p)}.“<br>Wie heißt die Zahl?`, parts: [{ ans: x }], explain: `<p>Rechne ${B('rückwärts')} mit den Umkehraufgaben:</p><p>${x * m + p} − ${p} = ${x * m} &nbsp;→&nbsp; ${x * m} : ${m} = ${B(x)}</p><p class="tip">💡 Probe: ${x} · ${m} + ${p} = ${x * m + p}</p>` }; }
  const x = rnd(3, 12) * d, m = rnd(4, 30); return { type: 'fields', q: `Zahlenrätsel: „Ich denke mir eine Zahl. Ich ${B('teile sie durch ' + d)} und ${B('ziehe ' + Math.min(m, x / d - 1) + ' ab')}. Ich erhalte ${B(x / d - Math.min(m, x / d - 1))}.“<br>Wie heißt die Zahl?`, parts: [{ ans: x }], explain: `<p>Rechne ${B('rückwärts')}: ${x / d - Math.min(m, x / d - 1)} + ${Math.min(m, x / d - 1)} = ${x / d} &nbsp;→&nbsp; ${x / d} · ${d} = ${B(x)}</p>` };
};
const genFolge = () => {
  const t = rnd(0, 4); let seq, rule;
  if (t === 0) { const s = rnd(1, 9) * 10000, k = pick([15000, 25000, 5000, 20000]); seq = [0, 1, 2, 3, 4, 5].map(i => s + i * k); rule = `immer + ${fmt(k)}`; }
  else if (t === 1) { const k = pick([25000, 50000, 30000, 125000]), s = 1000000 - rnd(0, 2) * k; seq = [0, 1, 2, 3, 4, 5].map(i => s - i * k); rule = `immer − ${fmt(k)}`; }
  else if (t === 2) { const s = rnd(2, 6), f = pick([2, 2, 3]); seq = [0, 1, 2, 3, 4, 5].map(i => s * Math.pow(f, i)); rule = `immer · ${f}`; }
  else if (t === 3) { const s = rnd(1, 20); seq = [s]; for (let i = 1; i < 6; i++) seq.push(seq[i - 1] + i); rule = '+ 1, + 2, + 3, + 4 … (jedes Mal eins mehr)'; }
  else { const s = rnd(20, 60), a = rnd(6, 12), b = rnd(2, 5); seq = [s]; for (let i = 1; i < 6; i++) seq.push(seq[i - 1] + (i % 2 ? a : -b)); rule = `abwechselnd + ${a} und − ${b}`; }
  return { type: 'fields', q: `Wie geht die ${B('Zahlenfolge')} weiter?`, parts: [seq.slice(0, 4).map(fmt).join(' → ') + ' → ', { ans: seq[4] }, ' → ', { ans: seq[5] }], explain: `<p>Regel: ${B(rule)}</p><p>${seq.map(fmt).join(' → ')}</p>` };
};
const genSachMix = () => {
  const t = rnd(0, 4), k = kid();
  if (t === 0) { const a = rnd(12, 28), b = rnd(6, 12), c = rnd(15, 60); return { type: 'fields', q: `Im Raumschiff stehen ${B(a + ' Kisten')} mit je ${B(b + ' Dosen')}. ${B(c + ' Dosen')} wurden schon gegessen. Wie viele Dosen sind noch da?`, parts: [{ ans: a * b - c }, ' Dosen'], explain: `<p>1. Schritt: ${a} · ${b} = ${a * b} Dosen am Anfang.</p><p>2. Schritt: ${a * b} − ${c} = ${B(a * b - c)}</p>` }; }
  if (t === 1) { const a = rnd(120, 480), b = rnd(3, 8); return { type: 'fields', q: `Eine Rakete fliegt in einer Minute ${B(a + ' km')} weit. Wie weit kommt sie in ${B(b + ' Minuten')}?`, parts: [{ ans: a * b }, ' km'], explain: `<p>${b} · ${a} km = ${B(fmt(a * b) + ' km')}</p>` }; }
  if (t === 2) { const a = rnd(13, 45); return { type: 'fields', q: `${k} hat ${B(a + ' Sternsticker')}. Wirbel hat ${B('doppelt so viele')}. Wie viele Sticker haben beide zusammen?`, parts: [{ ans: 3 * a }, ' Sticker'], explain: `<p>Wirbel: 2 · ${a} = ${2 * a}. Zusammen: ${a} + ${2 * a} = ${B(3 * a)}</p>` }; }
  if (t === 3) { const d = rnd(3, 8), q = rnd(12, 40), e = rnd(2, 9); return { type: 'fields', q: `Ein Fernrohr kostet ${B(d * q + e + ' €')}. ${k} hat schon ${B(e + ' €')} und spart jede Woche ${B(d + ' €')}. Nach wie vielen Wochen kann ${k} das Fernrohr kaufen?`, parts: [{ ans: q }, ' Wochen'], explain: `<p>1. Schritt: Es fehlen ${d * q + e} − ${e} = ${d * q} €.</p><p>2. Schritt: ${d * q} : ${d} = ${B(q)} Wochen</p>` }; }
  const a = rnd(3, 6), p = rnd(4, 9), g = a * p < 42 ? 50 : 100; return { type: 'fields', q: `${k} kauft ${B(a + ' Eintrittskarten')} für je ${B(p + ' €')} und bezahlt mit einem ${B(g + '-€-Schein')}. Wie viel Geld bekommt ${k} zurück?`, parts: [{ ans: g - a * p }, ' €'], explain: `<p>1. Schritt: ${a} · ${p} € = ${a * p} €.</p><p>2. Schritt: ${g} € − ${a * p} € = ${B(g - a * p + ' €')}</p>` };
};

/* =====================================================
   TIERE UND WELTEN – TEIL 2
   ===================================================== */
Object.assign(ANIMALS, {
  hamster: ['Feldhamster', 'In seine Backentaschen stopft ein Hamster so viel Futter, dass sein Kopf doppelt so breit wird.'],
  esel: ['Esel', 'Esel sind gar nicht stur: Sie bleiben stehen, um erst einmal in Ruhe nachzudenken.'],
  storch: ['Weißstorch', 'Störche fliegen im Herbst bis zu 10 000 km weit nach Afrika.'],
  biene: ['Honigbiene', 'Für ein Glas Honig fliegen Bienen etwa 40 000-mal aus.'],
  marienkaefer: ['Marienkäfer', 'Ein Marienkäfer frisst bis zu 50 Blattläuse am Tag.'],
  feldhase: ['Feldhase', 'Ein Feldhase rennt bis zu 70 km/h schnell und schlägt dabei Haken.'],
  ara: ['Ara', 'Aras können über 60 Jahre alt werden und knacken mit dem Schnabel sogar Paranüsse.'],
  seeotter: ['Seeotter', 'Seeotter halten sich beim Schlafen an den Pfoten, damit sie nicht auseinandertreiben.'],
  buckelwal: ['Buckelwal', 'Buckelwale singen Lieder, die man viele Kilometer weit hört.'],
  haselmaus: ['Haselmaus', 'Die Haselmaus verschläft mehr als die Hälfte des Jahres.'],
  waschbaer: ['Waschbär', 'Waschbären ertasten ihr Futter mit den Pfoten – das sieht aus wie Waschen.'],
  braunbaer: ['Braunbär', 'Ein Braunbär riecht Honig aus mehreren Kilometern Entfernung.'],
  schwan: ['Höckerschwan', 'Ein Schwan hat rund 25 000 Federn.'],
  pfau: ['Pfau', 'Die Schleppe eines Pfaus hat etwa 150 Federn mit schillernden „Augen“.'],
  eisvogel: ['Eisvogel', 'Der Eisvogel stürzt sich wie ein blauer Pfeil ins Wasser und fängt kleine Fische.'],
  dromedar: ['Dromedar', 'Ein durstiges Dromedar trinkt über 100 Liter Wasser in zehn Minuten.'],
  fennek: ['Wüstenfuchs', 'Mit seinen riesigen Ohren gibt der Fennek Wärme ab – wie mit einer Klimaanlage.'],
  chamaeleon: ['Chamäleon', 'Ein Chamäleon kann seine Augen unabhängig voneinander bewegen.'],
  flamingo: ['Flamingo', 'Flamingos werden rosa, weil sie kleine rote Krebse und Algen fressen.'],
  papageitaucher: ['Papageitaucher', 'Ein Papageitaucher trägt bis zu zehn kleine Fische gleichzeitig im Schnabel.'],
  axolotl: ['Axolotl', 'Einem Axolotl wachsen verlorene Beine einfach wieder nach.'],
  fledermaus: ['Fledermaus', 'Fledermäuse „sehen“ im Dunkeln mit den Ohren – durch das Echo ihrer Rufe.'],
  uhu: ['Uhu', 'Der Uhu ist die größte Eule der Welt und fliegt fast lautlos.'],
  kolibri: ['Kolibri', 'Kolibris schlagen bis zu 80-mal pro Sekunde mit den Flügeln und können rückwärts fliegen.'],
});
WORLDS.push(
  { id: 'markt', part: 1, name: 'Rechen-Markt', topic: 'Schriftlich addieren & subtrahieren', icon: '🧺', color: '#b45309', animals: ['hamster', 'esel', 'storch'],
    rule: `<b>Schriftlich rechnen:</b> Schreibe Einer unter Einer, Zehner unter Zehner … Beginne <u>rechts</u>.<br>Im Spiel springt das Kästchen von selbst nach links. Prüfe am Ende mit dem <b>Überschlag</b>!`,
    levels: [
      [genKopfAdd, genAddCol(0), genSubCol(0), genUeberAdd, genAddCol(0), genSubCol(0)],
      [genAddCol(1), genSubCol(1), genErgaenzen, genSachAdd, genAddFehler, genUeberAdd, genAddCol(1), genSubCol(1)],
      [genAddCol(2), genSubCol(2), genSachAdd, genAddFehler, genErgaenzen, genSubCol(2), genAddCol(2), genKopfAdd],
    ] },
  { id: 'wiese', part: 1, name: 'Mal-Wiese', topic: 'Multiplizieren', icon: '🐝', color: '#ca8a04', animals: ['biene', 'marienkaefer', 'feldhase'],
    rule: `<b>Multiplizieren:</b> Große Aufgaben zerlegst du in kleine: 6 · 438 = 6 · 400 + 6 · 30 + 6 · 8.<br>Schriftlich beginnst du rechts bei den Einern und merkst dir die Überträge.`,
    levels: [
      [genMalZehner, genMalHalb, genMalZehner, genMalCol(0), genMalHalb, genMalUeber],
      [genMalCol(0), genMalCol(1), genMalUeber, genMalSach, genMalFehler, genMalCol(1), genMalZehner, genMalCol(1)],
      [genMalCol(2), genMalCol(1), genMalSach, genMalFehler, genMalCol(2), genMalUeber, genMalCol(2), genMalSach],
    ] },
  { id: 'piraten', part: 1, name: 'Teiler-Bucht', topic: 'Dividieren, Teiler & Vielfache', icon: '🏴‍☠️', color: '#0f766e', animals: ['ara', 'seeotter', 'buckelwal'],
    rule: `<b>Dividieren:</b> Gerecht teilen. Zerlege die Zahl in Stücke, die sich gut teilen lassen.<br>Bleibt etwas übrig, ist das der <b>Rest</b> – er ist immer kleiner als der Teiler. Probe: mit Mal zurückrechnen!`,
    levels: [
      [genDivZehner, genDivRest(0), genDivHalb, genDivZehner, genTeiler, genDivRest(0)],
      [genDivHalb, genDivRest(1), genDivSchrift(false), genTeiler, genDivSach, genDivProbe, genDivSchrift(false), genDivRest(1)],
      [genDivSchrift(false), genDivSchrift(true), genDivSach, genTeiler, genDivSchrift(true), genDivProbe, genDivSach, genDivSchrift(true)],
    ] },
  { id: 'zucker', part: 1, name: 'Zuckerbäckerei', topic: 'Größen: Gewicht, Länge, Liter, Zeit', icon: '🧁', color: '#db2777', animals: ['haselmaus', 'waschbaer', 'braunbaer'],
    rule: `<b>Größen:</b> 1 kg = 1 000 g · 1 t = 1 000 kg · 1 km = 1 000 m · 1 m = 100 cm · 1 cm = 10 mm · 1 l = 1 000 ml · 1 h = 60 min.<br>Vor dem Vergleichen und Rechnen: alles in die <u>gleiche Einheit</u> umwandeln!`,
    levels: [
      [genUmrechnen('kg', 'l'), genEinheit, genUmrechnen('km', 'm'), genZeit, genUmrechnen('kg', 'm'), genEinheit],
      [genUmrechnen('kg', 't', 'l'), genKomma('kg', 'm'), genZeit, genGroessenRechnen, genUmrechnen('km', 'm', 'cm'), genKomma('l', 'km'), genEinheit, genZeit],
      [genKomma('kg', 'm', 'l', 'km'), genGroessenOrdnen, genZeit, genGroessenRechnen, genKomma('kg', 'm', 'cm'), genGroessenOrdnen, genUmrechnen('t', 'km', 'l', 'cm'), genZeit],
    ] },
  { id: 'schloss', part: 1, name: 'Schlossgarten', topic: 'Umfang, Flächeninhalt, Maßstab', icon: '🏰', color: '#7c3aed', animals: ['schwan', 'pfau', 'eisvogel'],
    rule: `<b>Umfang:</b> einmal außen herum – alle Seiten addieren.<br><b>Flächeninhalt:</b> wie viele Einheitsquadrate passen hinein? Beim Rechteck: Länge · Breite.<br><b>Maßstab 1 : 100:</b> 1 cm auf dem Plan = 100 cm = 1 m in echt.`,
    levels: [
      [genUmfang, genFlaeche, genUoderA, genUmfang, genFlaeche, genUoderA],
      [genForm, genSeiteGesucht, genUmfang, genMassstab, genFlaeche, genUAVergleich, genForm, genMassstab],
      [genUAVergleich, genForm, genSeiteGesucht, genMassstab, genUAVergleich, genForm, genSeiteGesucht, genMassstab],
    ] },
  { id: 'wueste', part: 1, name: 'Pyramiden-Wüste', topic: 'Körper, Netze, Würfelgebäude, Symmetrie', icon: '🐪', color: '#c2410c', animals: ['dromedar', 'fennek', 'chamaeleon'],
    rule: `<b>Körper</b> haben Ecken, Kanten und Flächen. Würfel und Quader: 8 Ecken, 12 Kanten, 6 Flächen.<br><b>Netz:</b> der aufgeklappte Körper. <b>Symmetrie:</b> Beide Seiten der Spiegelachse sind genau gleich.`,
    levels: [
      [genKoerperName, genKoerperAlltag, genSpiegel(0), genQuaderVol, genKoerperName, genAchsen],
      [genEKF, genWuerfelbau(false), genNetz, genSpiegel(1), genKoerperAlltag, genAchsen, genQuaderVol, genNetz],
      [genNetz, genWuerfelbau(true), genEKF, genSpiegel(1), genWuerfelbau(false), genAchsen, genNetz, genWuerfelbau(true)],
    ] },
  { id: 'jahrmarkt', part: 1, name: 'Zufalls-Jahrmarkt', topic: 'Daten, Zufall, Kombinieren, Brüche', icon: '🎡', color: '#e11d48', animals: ['flamingo', 'papageitaucher', 'axolotl'],
    rule: `<b>Zufall:</b> sicher · möglich · unmöglich. Je mehr Felder oder Kugeln eine Farbe hat, desto wahrscheinlicher ist sie.<br><b>Kombinieren:</b> geordnet aufschreiben oder malnehmen. <b>Diagramm:</b> Säulenhöhe an der Zahlenleiste ablesen.`,
    levels: [
      [genDiagramm(0), genGluecksrad, genBeutel, genWuerfelW, genDiagramm(0), genKombi],
      [genDiagramm(1), genGluecksrad, genKombi, genBruch, genBeutel, genWuerfelW, genDiagramm(1), genBruch],
      [genKombi, genGluecksrad, genDiagramm(1), genBruch, genBeutel, genKombi, genWuerfelW, genGluecksrad],
    ] },
  { id: 'sterne', part: 1, name: 'Sternwarte der Meister', topic: 'Rechenregeln, Knobeln & Mix', icon: '🚀', color: '#4338ca', animals: ['fledermaus', 'uhu', 'kolibri'], boss: true, count: 10,
    rule: `<b>Rechenregeln:</b> Klammern zuerst, dann Punkt vor Strich.<br>Dazu <b>alles gemischt</b> aus Teil 2 – wie in der Klassenarbeit am Ende des Schuljahres!`,
    levels: [
      [genPunktStrich, genFolge, genGleichung, genPunktStrich, [genAddCol(1), 'markt'], [genSubCol(1), 'markt'], [genMalCol(1), 'wiese'], [genDivRest(1), 'piraten'], [genUmrechnen('kg', 'km', 'l'), 'zucker'], [genZeit, 'zucker'], [genUmfang, 'schloss']],
      [genTermWahl, genSachMix, genPunktStrich, genGleichung, [genForm, 'schloss'], [genMassstab, 'schloss'], [genEKF, 'wueste'], [genNetz, 'wueste'], [genGluecksrad, 'jahrmarkt'], [genDiagramm(1), 'jahrmarkt'], [genKomma('kg', 'm', 'l'), 'zucker'], [genDivSchrift(false), 'piraten']],
      [genSachMix, genGleichung, genFolge, genTermWahl, [genMalCol(2), 'wiese'], [genSubCol(2), 'markt'], [genDivSchrift(true), 'piraten'], [genDivSach, 'piraten'], [genGroessenOrdnen, 'zucker'], [genUAVergleich, 'schloss'], [genWuerfelbau(true), 'wueste'], [genSpiegel(1), 'wueste'], [genKombi, 'jahrmarkt'], [genBruch, 'jahrmarkt']],
    ] },
);

/* Aufgaben für die Klassenarbeit (EXPOOL) und die Blitz-Runde (BLITZPOOL), nach Thema */
const EXPOOL = {
  wald: [() => pick([genWort, genStellen, genSumme])(), genNachbarDoppel, genNachbar(10000, true), genOrdnen, genRaetsel],
  savanne: [genLineRead('A'), genLinePlace('A'), genLineRead('D')],
  eis: [genRunden(1000), genRunden(10000), genLeoRundet(100000), genRundGrenze],
  ozean: [genKreisTeil, genZirkel, genLeoKreis, genBegruendung],
  dschungel: [genPaare(2), genWelches(2), genAussage],
  berge: [genStadtplan, genPgramm, genZweiLinien(1)],
  markt: [genAddCol(1), genSubCol(1), genAddCol(2), genSubCol(2), genUeberAdd, genSachAdd, genErgaenzen, genAddFehler],
  wiese: [genMalCol(1), genMalCol(2), genMalZehner, genMalUeber, genMalSach, genMalHalb, genMalFehler],
  piraten: [genDivSchrift(false), genDivSchrift(true), genDivRest(1), genDivSach, genTeiler, genDivZehner, genDivProbe],
  zucker: [genUmrechnen('kg', 't', 'l'), genUmrechnen('km', 'm', 'cm'), genKomma('kg', 'm', 'l'), genZeit, genGroessenRechnen, genGroessenOrdnen, genEinheit, genZeit],
  schloss: [genUmfang, genFlaeche, genForm, genSeiteGesucht, genUAVergleich, genMassstab, genUoderA],
  wueste: [genEKF, genNetz, genWuerfelbau(false), genSpiegel(1), genKoerperAlltag, genAchsen, genWuerfelbau(true)],
  jahrmarkt: [genDiagramm(1), genGluecksrad, genBeutel, genKombi, genWuerfelW, genBruch],
  sterne: [genPunktStrich, genTermWahl, genGleichung, genFolge, genSachMix, genPunktStrich],
};
const BLITZPOOL = {
  wald: [genVorNach, genNachbarWahl(1000), genNachbarWahl(10000), genOrdnen], savanne: [genLineStep('A'), genLineStep('D')], eis: [genRunden(1000), genRunden(10000), genLeoRundet(10000)],
  ozean: [genRD('cm'), genKreisSatz, genKreisTeil, genZirkel], dschungel: [genPaare(1), genAussage], berge: [genZweiLinien(0)],
  markt: [genKopfAdd, genUeberAdd, genErgaenzen], wiese: [genMalZehner, genMalUeber, genMalFehler], piraten: [genDivZehner, genDivRest(0), genTeiler, genDivProbe],
  zucker: [genUmrechnen('kg', 'km', 'l', 'm'), genEinheit, genKomma('kg', 'm'), genZeit], schloss: [genUoderA, genUmfang, genFlaeche, genMassstab],
  wueste: [genKoerperName, genKoerperAlltag, genNetz, genAchsen], jahrmarkt: [genWuerfelW, genGluecksrad, genBruch, genKombi], sterne: [genPunktStrich, genFolge, genGleichung],
};
