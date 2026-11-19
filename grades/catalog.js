/* Multi-grade catalogue. The original Klasse 4 entry point remains index.html. */
(function (root) {
  'use strict';

  const catalogue = Object.freeze({
    1: Object.freeze({
      grade: 1, title: '1. Klasse', status: 'prototype',
      progressKey: 'mathe-abenteuer-grade-1-v1',
      topics: [
        'Zahlen bis 20', 'Plus und Minus bis 20',
        'Vergleichen und Ordnen', 'Formen und Muster',
        'Geld, Längen und Zeit'
      ]
    }),
    2: Object.freeze({
      grade: 2, title: '2. Klasse', status: 'planned',
      progressKey: 'mathe-abenteuer-grade-2-v1',
      topics: [
        'Zahlen bis 100', 'Plus und Minus bis 100',
        'Einmaleins und Teilen', 'Größen und Zeit', 'Formen und Daten'
      ]
    }),
    3: Object.freeze({
      grade: 3, title: '3. Klasse', status: 'planned',
      progressKey: 'mathe-abenteuer-grade-3-v1',
      topics: [
        'Zahlen bis 1 000', 'Plus und Minus bis 1 000',
        'Einmaleins und Division', 'Sachaufgaben und Größen',
        'Geometrie und Daten'
      ]
    }),
    4: Object.freeze({
      grade: 4, title: '4. Klasse', status: 'existing',
      entryPoint: 'index.html',
      // Critical: never migrate or overwrite the existing Klasse 4 save in place.
      progressKey: 'mathe-abenteuer-v2'
    })
  });

  root.MATHE_GRADES = catalogue;
  if (typeof module !== 'undefined' && module.exports) module.exports = catalogue;
})(typeof globalThis !== 'undefined' ? globalThis : this);
