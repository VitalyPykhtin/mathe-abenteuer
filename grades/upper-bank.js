/* Shared exercise generators for the first playable Klasse 2 and Klasse 3 editions.
   Each task uses the existing "choice" question shape, with its own numeric range.
   These are early game curricula, not full end-of-year coverage. */
(function (root) {
  'use strict';

  const grade = Number(typeof document !== 'undefined' && document.body && document.body.dataset.grade);
  if (grade !== 2 && grade !== 3) throw new Error('Upper-grade exercise bank requires grade 2 or 3');
  const max = grade === 2 ? 100 : 1000;
  const rnd = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
  const pick = a => a[rnd(0, a.length - 1)];
  const shuffle = a => {
    const out = a.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = rnd(0, i);
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  };
  const choice = (q, answer, wrong, explain, visual) => {
    const values = [...new Set([answer, ...wrong].map(String))].slice(0, 4);
    if (values.length < 3) throw new Error('Too few distinct answers: ' + q);
    const options = shuffle(values);
    return {
      type: 'choice', q, options, correct: options.indexOf(String(answer)),
      explain, ...(visual ? { visual } : {})
    };
  };
  const numeric = (q, answer, low, high, explain) => {
    if (!Number.isInteger(answer) || answer < low || answer > high) {
      throw new Error('Answer outside bounds: ' + q + ' → ' + answer);
    }
    const deltas = [1, -1, 2, -2, 5, -5, 10, -10, 20, -20, 50, -50, 100, -100];
    const wrong = [];
    for (const delta of shuffle(deltas)) {
      const n = answer + delta;
      if (n >= low && n <= high && n !== answer && !wrong.includes(n)) wrong.push(n);
      if (wrong.length === 3) break;
    }
    if (wrong.length < 2) {
      for (let n = low; n <= high && wrong.length < 3; n++) {
        if (n !== answer && !wrong.includes(n)) wrong.push(n);
      }
    }
    return choice(q, answer, wrong, explain);
  };
  const line = (start, step, count) => [start, start + step, start + 2 * step,
    start + 3 * step, start + 4 * step].slice(0, count);

  // Shared topics: increasingly difficult within the three practice levels.
  const neighbors = level => () => {
    const limit = grade === 2 ? [30, 60, 100][level] : [200, 600, 1000][level];
    const n = rnd(2, limit - 1), after = rnd(0, 1) === 0;
    const answer = n + (after ? 1 : -1);
    return numeric('Welche Zahl kommt ' + (after ? 'nach ' : 'vor ') + n + '?',
      answer, 0, max, 'Gehe auf dem Zahlenstrahl genau einen Schritt.');
  };
  const placeValue = level => () => {
    const n = grade === 2 ? rnd(10, [39, 69, 99][level]) :
      rnd(100, [299, 699, 999][level]);
    const pos = grade === 2 ? pick([1, 10]) : pick([1, 10, 100]);
    const label = pos === 1 ? 'Einer' : pos === 10 ? 'Zehner' : 'Hunderter';
    const answer = Math.floor(n / pos) % 10;
    return numeric('Wie viele ' + label + ' hat die Zahl ' + n + '?',
      answer, 0, 9, 'Schau auf die richtige Stelle: ' + label + '.');
  };
  const compare = level => () => {
    const limit = grade === 2 ? [40, 70, 100][level] : [300, 700, 1000][level];
    const a = rnd(1, limit), b = rnd(1, limit);
    return choice('Welches Zeichen passt? ' + a + ' __ ' + b,
      a < b ? '<' : a > b ? '>' : '=', ['<', '>', '='],
      'Vergleiche erst die größte Stelle, dann die kleineren.');
  };
  const sequence = level => () => {
    const step = grade === 2 ? [1, 2, 10][level] : [10, 25, 100][level];
    const start = rnd(0, Math.floor((max - 4 * step) / step)) * step;
    const arr = line(start, step, 4), answer = start + 4 * step;
    return numeric('Wie geht die Reihe weiter? ' + arr.join(' – ') + ' – ?',
      answer, 0, max, 'Addiere immer ' + step + '.');
  };
  const rounding = level => () => {
    const step = grade === 2 ? 10 : [10, 100, 100][level];
    const limit = grade === 2 ? 100 : 1000;
    const n = rnd(1, limit - 1);
    const answer = Math.round(n / step) * step;
    return numeric('Runde ' + n + ' auf den nächsten ' + (step === 10 ? 'Zehner' : 'Hunderter') + '.',
      answer, 0, limit, 'Ab der Hälfte wird aufgerundet, darunter abgerundet.');
  };
  const add = level => () => {
    const cap = grade === 2 ? [40, 70, 100][level] : [300, 700, 1000][level];
    const a = rnd(0, cap), b = rnd(0, cap - a), result = a + b;
    return numeric(a + ' + ' + b + ' = ?', result, 0, max,
      'Zerlege die Zahlen in Hunderter, Zehner und Einer.');
  };
  const subtract = level => () => {
    const cap = grade === 2 ? [40, 70, 100][level] : [300, 700, 1000][level];
    const a = rnd(0, cap), b = rnd(0, a), result = a - b;
    return numeric(a + ' − ' + b + ' = ?', result, 0, max,
      'Ziehe erst die Zehner, dann die Einer ab.');
  };
  const complete = level => () => {
    const cap = grade === 2 ? [20, 50, 100][level] : [100, 500, 1000][level];
    const a = rnd(0, cap), answer = cap - a;
    return numeric(a + ' + ? = ' + cap, answer, 0, max,
      'Die fehlende Zahl ist ' + cap + ' minus ' + a + '.');
  };
  const multiply = level => () => {
    if (grade === 2) {
      const factors = [[2, 5, 10], [2, 3, 4, 5, 10], [2, 3, 4, 5, 6, 7, 8, 9, 10]][level];
      const a = pick(factors), b = rnd(1, 10), result = a * b;
      return numeric(a + ' · ' + b + ' = ?', result, 0, 100,
        'Du kannst ' + a + ' genau ' + b + '-mal addieren.');
    }
    const factor = rnd(2, [5, 8, 9][level]);
    const n = level === 0 ? rnd(2, 10) : level === 1 ? rnd(11, 40) : rnd(20, 100);
    const result = factor * n;
    return numeric(factor + ' · ' + n + ' = ?', result, 0, 1000,
      'Zerlege ' + n + ' in einfache Teile und multipliziere.');
  };
  const division = level => () => {
    const divisor = rnd(2, grade === 2 ? [5, 8, 10][level] : [5, 8, 10][level]);
    const quotient = rnd(1, grade === 2 ? 10 : [10, 20, 60][level]);
    const dividend = divisor * quotient;
    return numeric(dividend + ' : ' + divisor + ' = ?', quotient, 0, max,
      'Prüfe mit Mal: ' + quotient + ' · ' + divisor + ' = ' + dividend + '.');
  };
  const divisionRemainder = level => () => {
    const divisor = rnd(2, [5, 7, 9][level]);
    const quotient = rnd(2, [9, 25, 80][level]);
    const remainder = rnd(1, divisor - 1);
    const dividend = divisor * quotient + remainder;
    const correct = quotient + ' Rest ' + remainder;
    return choice(dividend + ' : ' + divisor + ' = ?',
      correct, [quotient + 1 + ' Rest ' + remainder,
        quotient + ' Rest ' + (remainder + 1),
        quotient + ' Rest 0'],
      'Rechne ' + quotient + ' · ' + divisor + ' + ' + remainder + ' = ' + dividend + '.');
  };
  const textProblem = level => () => {
    const a = rnd(2, grade === 2 ? [5, 7, 8][level] : [5, 9, 10][level]);
    const limit = grade === 2 ? [8, 12, 20][level] : [15, 30, 80][level];
    const n = rnd(grade === 2 ? 3 : 6, Math.min(limit, Math.floor(max / a)));
    const result = a * n;
    return numeric('Im Garten gibt es ' + a + ' Reihen mit je ' + n +
      ' Blumen. Wie viele Blumen sind das?', result, 0, max,
      'Multipliziere die Reihen mit den Blumen pro Reihe.');
  };
  const money = level => () => {
    const cap = grade === 2 ? [10, 30, 50][level] : [20, 50, 100][level];
    const cost = rnd(1, cap - 1), paid = cap, answer = paid - cost;
    return numeric('Du hast ' + paid + ' €. Ein Spielzeug kostet ' + cost +
      ' €. Wie viel Geld bleibt?', answer, 0, cap,
      'Das Rückgeld ist ' + paid + ' € minus ' + cost + ' €.');
  };
  const time = level => () => {
    const hour = rnd(7, 16), minutes = grade === 2 ?
      [15, 30, 60][level] : [15, 30, 45][level];
    const answer = (hour + Math.floor(minutes / 60)) % 24;
    const question = 'Es ist ' + hour + ':00 Uhr. Wie spät ist es ' +
      minutes + ' Minuten später?';
    if (minutes === 60) return numeric(question, answer, 0, 23,
      'Eine Stunde sind 60 Minuten.');
    return choice(question, hour + ':' + String(minutes).padStart(2, '0'),
      [hour + ':00', ((hour + 1) % 24) + ':' + String(minutes).padStart(2, '0'),
        hour + ':' + String(60 - minutes).padStart(2, '0')],
      'Eine Stunde hat 60 Minuten.');
  };
  const measure = level => () => {
    const factors = grade === 2 ?
      [['cm', 'mm', 10], ['m', 'cm', 100], ['€', 'ct', 100]] :
      [['m', 'cm', 100], ['km', 'm', 1000], ['kg', 'g', 1000]];
    const [big, small, factor] = factors[level];
    const n = rnd(1, grade === 2 ? 9 : 5), answer = n * factor;
    return numeric(n + ' ' + big + ' = ? ' + small, answer, 0, 10000,
      '1 ' + big + ' entspricht ' + factor + ' ' + small + '.');
  };
  const shapes = level => () => {
    const shapesArr = [
      ['🔵', 'Kreis'], ['🔺', 'Dreieck'], ['🟦', 'Quadrat'], ['▭', 'Rechteck']
    ];
    const [emoji, label] = pick(shapesArr);
    return choice('Welche Form ist das?', label, shapesArr.map(a => a[1]),
      'Die Form heißt ' + label + '.',
      '<span role="img" aria-label="' + label + '" style="font-size:4rem">' + emoji + '</span>');
  };
  const perimeter = level => () => {
    const a = rnd(2, grade === 2 ? 9 : [8, 20, 35][level]);
    const b = rnd(2, grade === 2 ? 9 : [8, 20, 35][level]);
    const answer = 2 * (a + b);
    return numeric('Ein Rechteck ist ' + a + ' cm lang und ' + b +
      ' cm breit. Wie groß ist der Umfang?', answer, 0, max,
      'Umfang = ' + a + ' + ' + b + ' + ' + a + ' + ' + b + '.');
  };
  const data = level => () => {
    const a = rnd(2, [5, 8, 12][level]), b = rnd(1, [4, 7, 12][level]);
    return numeric('Im Album sind ' + a + ' rote und ' + b +
      ' blaue Sticker. Wie viele Sticker sind das?', a + b, 0, max,
      'Addiere beide Gruppen: ' + a + ' + ' + b + '.');
  };
  const story = (icon, title, text, finish) => ({ icon, title, text, finish });
  const makeWorld = (id, name, topic, icon, scene, color, levels, chapter) =>
    ({ id, name, topic, icon, scene, color, levels, story: chapter });

  const worlds2 = [
    makeWorld('g2_zahlen', 'Zahlenwald bis 100', 'Zahlen bis 100', '🌳', 'wald', '#15803d',
      [[neighbors(0), placeValue(0)], [neighbors(1), placeValue(1), compare(1)], [neighbors(2), placeValue(2), sequence(2), rounding(2)]],
      story('🌳', 'Das Geheimnis der Hundert', 'Finn hat hundert Zahlenkarten gefunden. Hilf ihm beim Ordnen und finde die richtige Nachbarzahl!', 'Jetzt sind die Zahlen wieder an ihrem Platz! 🌟')),
    makeWorld('g2_rechnen', 'Rechenmarkt', 'Plus und Minus bis 100', '🧺', 'markt', '#b45309',
      [[add(0), subtract(0)], [add(1), subtract(1), complete(1)], [add(2), subtract(2), complete(2)]],
      story('🧺', 'Der verschwundene Marktschatz', 'Auf dem Rechenmarkt fehlen Zahlen auf den Preisschildern. Löse die Aufgaben, damit die Händler wieder verkaufen können!', 'Der Rechenmarkt ist gerettet! 🪙')),
    makeWorld('g2_mal', 'Einmaleins-Wiese', 'Einmaleins', '🐝', 'wiese', '#15803d',
      [[multiply(0)], [multiply(1)], [multiply(2), textProblem(2)]],
      story('🐝', 'Die Bienen zählen ihre Blüten', 'Auf jeder Wiese wachsen gleich viele Blumen in Reihen. Die Bienen brauchen das Einmaleins!', 'Die Bienen feiern ihr Einmaleins! 🐝')),
    makeWorld('g2_teilen', 'Teiler-Bucht', 'Teilen und Umkehraufgaben', '🏴‍☠️', 'piraten', '#0f766e',
      [[division(0)], [division(1)], [division(2), multiply(2)]],
      story('🏴‍☠️', 'Der Schatz der Piraten', 'Die Piraten möchten ihren Schatz gerecht teilen. Hilf ihnen mit Teilen und Malnehmen!', 'Alle Piraten haben ihren gerechten Anteil! 🎁')),
    makeWorld('g2_groessen', 'Zeit- und Geldbäckerei', 'Geld, Zeit und Größen', '🧁', 'zucker', '#db2777',
      [[money(0), measure(0)], [money(1), time(1), measure(1)], [money(2), time(2), measure(2)]],
      story('🧁', 'Der Kuchen für Frau Eule', 'Der Kuchen muss rechtzeitig fertig sein und die Zutaten kosten Geld. Rechne mit Zeit und Größen!', 'Frau Eule bekommt ihren Kuchen pünktlich! 🧁')),
    makeWorld('g2_formen', 'Formenschloss', 'Geometrie und Daten', '🏰', 'schloss', '#7c3aed',
      [[shapes(0), data(0)], [shapes(1), data(1)], [shapes(2), data(2), perimeter(2)]],
      story('🏰', 'Das Rätsel im Formenschloss', 'Im Schloss werden Formen, Muster und Sticker gezählt. Finde die Lösung für das Schlosstor!', 'Das Formenschloss ist wieder offen! 🏰'))
  ];

  const worlds3 = [
    makeWorld('g3_zahlen', 'Zahlenwald bis 1000', 'Zahlen bis 1000', '🌳', 'wald', '#15803d',
      [[neighbors(0), placeValue(0)], [neighbors(1), placeValue(1), compare(1)], [neighbors(2), placeValue(2), sequence(2), rounding(2)]],
      story('🌲', 'Die tausend verlorenen Zahlen', 'Im Zahlenwald liegen Zahlenkarten bis 1000 durcheinander. Hilf Finn, das Geheimnis der Hunderter zu lösen!', 'Alle tausend Zahlen kennen wieder ihren Platz! ✨')),
    makeWorld('g3_rechnen', 'Rechenmarkt bis 1000', 'Addition und Subtraktion bis 1000', '🧺', 'markt', '#b45309',
      [[add(0), subtract(0)], [add(1), subtract(1), complete(1)], [add(2), subtract(2), complete(2)]],
      story('🧺', 'Das große Marktfest', 'Auf dem Markt sind große Bestellungen angekommen. Die Händler müssen mit Hundertern rechnen!', 'Das Marktfest kann beginnen! 🧺')),
    makeWorld('g3_mal', 'Mal-Wiese', 'Multiplikation und Sachaufgaben', '🐝', 'wiese', '#15803d',
      [[multiply(0)], [multiply(1), textProblem(1)], [multiply(2), textProblem(2)]],
      story('🐝', 'Die Wiese der großen Zahlen', 'Die Bienen entdecken riesige Blumenfelder. Mit dem Malnehmen lassen sich alle Blüten zählen!', 'Die Blumenfelder sind endlich gezählt! 🌻')),
    makeWorld('g3_teilen', 'Piratenbucht', 'Division, Teilen mit Rest', '🏴‍☠️', 'piraten', '#0f766e',
      [[division(0)], [division(1), divisionRemainder(1)], [division(2), divisionRemainder(2)]],
      story('🏴‍☠️', 'Der ungleiche Piratenschatz', 'Beim Aufteilen der Schatzkisten bleiben manchmal Münzen übrig. Hilf den Piraten, den Rest zu bestimmen!', 'Der Schatz ist gerecht verteilt! 💎')),
    makeWorld('g3_groessen', 'Zuckerbäckerei', 'Geld, Zeit und Maße', '🧁', 'zucker', '#db2777',
      [[money(0), measure(0)], [money(1), time(1), measure(1)], [money(2), time(2), measure(2)]],
      story('🧁', 'Der Kuchen der Riesen', 'Frau Eule möchte einen Riesenkuchen backen. Dafür brauchst du Maße, Gewichte und Zeit!', 'Der Riesenkuchen ist fertig! 🎂')),
    makeWorld('g3_formen', 'Geometrieschloss', 'Umfang, Geometrie und Daten', '🏰', 'schloss', '#7c3aed',
      [[shapes(0), data(0)], [perimeter(1), data(1)], [perimeter(2), data(2)]],
      story('🏰', 'Das Schloss der Maße', 'Um das Schloss zu öffnen, müssen die Wächter den Umfang von geheimen Figuren bestimmen!', 'Die Schlosstüren öffnen sich! 🏰'))
  ];

  const bank = Object.freeze({ grade, status: 'playable', worlds: grade === 2 ? worlds2 : worlds3 });
  root['MATHE_GRADE' + grade] = bank;
  if (typeof module !== 'undefined' && module.exports) module.exports = bank;
})(typeof globalThis !== 'undefined' ? globalThis : this);
