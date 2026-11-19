/* First exercise-bank prototype for Klasse 1. Does not modify the Klasse 4 game.
   Output matches the existing qHTML 'choice' task format. */
(function (root) {
  'use strict';

  const randomInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
  const shuffled = values => {
    const result = values.slice();
    for (let i = result.length - 1; i > 0; i--) {
      const j = randomInt(0, i);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  };
  const choice = (question, answer, alternatives, explanation, visual) => {
    const values = [...new Set([answer, ...alternatives].map(String))];
    if (values.length < 3) throw new Error('A choice task needs at least three distinct options');
    const options = shuffled(values.slice(0, 4));
    return {
      type: 'choice', q: question, options,
      correct: options.indexOf(String(answer)),
      explain: explanation,
      ...(visual ? { visual } : {})
    };
  };
  const numberChoice = (question, answer, max, explanation, visual) => {
    const alternatives = [];
    for (const delta of [-1, 1, -2, 2, -3, 3, -4, 4, -5, 5]) {
      const candidate = answer + delta;
      if (candidate >= 0 && candidate <= max && candidate !== answer) alternatives.push(candidate);
      if (alternatives.length >= 3) break;
    }
    return choice(question, answer, alternatives, explanation, visual);
  };

  const count = level => () => {
    const limit = [6, 12, 20][level], n = randomInt(1, limit);
    const stars = '⭐'.repeat(n);
    return numberChoice('Wie viele Sterne siehst du?', n, 20,
      'Zähle die Sterne langsam, eine nach der anderen.',
      '<div role="img" aria-label="' + n + ' Sterne" style="font-size:2rem;line-height:1.6;overflow-wrap:anywhere">' + stars + '</div>');
  };
  const beforeAfter = level => () => {
    const limit = [10, 15, 20][level];
    const n = randomInt(2, limit - 1);
    const after = randomInt(0, 1) === 1, answer = n + (after ? 1 : -1);
    const label = after ? 'nach' : 'vor';
    return numberChoice('Welche Zahl kommt ' + label + ' ' + n + '?', answer, 20,
      'Zähle von ' + n + ' einen Schritt ' + (after ? 'vorwärts' : 'rückwärts') + '.');
  };
  const add = level => () => {
    const limit = [10, 15, 20][level];
    const a = randomInt(0, limit), b = randomInt(0, limit - a);
    const answer = a + b;
    return numberChoice(a + ' + ' + b + ' = ?', answer, 20,
      a + ' und ' + b + ' zusammen sind ' + answer + '.');
  };
  const subtract = level => () => {
    const limit = [10, 15, 20][level];
    const a = randomInt(0, limit), b = randomInt(0, a);
    const answer = a - b;
    return numberChoice(a + ' − ' + b + ' = ?', answer, 20,
      'Von ' + a + ' nimmst du ' + b + ' weg. Es bleiben ' + answer + '.');
  };
  const compare = level => () => {
    const limit = [10, 15, 20][level], a = randomInt(0, limit), b = randomInt(0, limit);
    const answer = a < b ? '<' : a > b ? '>' : '=';
    return choice('Welches Zeichen passt? ' + a + ' __ ' + b, answer,
      ['<', '>', '='], 'Vergleiche die beiden Zahlen von links nach rechts.');
  };
  const shapes = level => () => {
    const available = [
      ['🔵', 'Kreis'], ['🔺', 'Dreieck'], ['🟦', 'Quadrat'],
      ['▭', 'Rechteck']
    ];
    const selected = available[randomInt(0, level === 0 ? 2 : 3)];
    return choice('Welche Form siehst du?', selected[1],
      available.map(shape => shape[1]),
      'Die Form heißt ' + selected[1] + '.',
      '<div role="img" aria-label="' + selected[1] + '" style="font-size:4rem">' + selected[0] + '</div>');
  };
  const patterns = level => () => {
    const step = [1, 2, 5][level];
    const first = randomInt(0, 20 - 4 * step);
    const values = [0, 1, 2, 3].map(n => first + n * step);
    const answer = first + 4 * step;
    return numberChoice('Wie geht die Reihe weiter? ' + values.join(', ') + ', ...', answer, 20,
      'Die Zahlen werden immer um ' + step + ' größer.');
  };

  const worlds = [
    { id: 'g1_zahlen', name: 'Zahlenwald', topic: 'Zahlen bis 20', icon: '🌳',
      levels: [[count(0), beforeAfter(0)], [count(1), beforeAfter(1)], [count(2), beforeAfter(2)]] },
    { id: 'g1_rechnen', name: 'Rechenwiese', topic: 'Plus und Minus bis 20', icon: '🐝',
      levels: [[add(0), subtract(0)], [add(1), subtract(1)], [add(2), subtract(2)]] },
    { id: 'g1_vergleichen', name: 'Zeichenbrücke', topic: 'Vergleichen und Ordnen', icon: '🌉',
      levels: [[compare(0)], [compare(1)], [compare(2)]] },
    { id: 'g1_formen', name: 'Formenschloss', topic: 'Formen und Muster', icon: '🏰',
      levels: [[shapes(0), patterns(0)], [shapes(1), patterns(1)], [shapes(2), patterns(2)]] }
  ];

  const grade1 = Object.freeze({ grade: 1, status: 'prototype', worlds });
  root.MATHE_GRADE1 = grade1;
  if (typeof module !== 'undefined' && module.exports) module.exports = grade1;
})(typeof globalThis !== 'undefined' ? globalThis : this);
