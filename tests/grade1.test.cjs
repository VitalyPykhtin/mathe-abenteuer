'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const catalogue = require('../grades/catalog.js');
const grade1 = require('../grades/klasse1.js');

test('the original Klasse 4 save key is preserved', () => {
  assert.equal(catalogue[4].progressKey, 'mathe-abenteuer-v2');
  assert.equal(catalogue[4].entryPoint, 'index.html');
  assert.equal(new Set(Object.values(catalogue).map(grade => grade.progressKey)).size, 4);
});

test('all four grades are declared and only Klasse 4 is marked existing', () => {
  assert.deepEqual(Object.keys(catalogue), ['1', '2', '3', '4']);
  assert.equal(catalogue[1].status, 'prototype');
  assert.equal(catalogue[2].status, 'planned');
  assert.equal(catalogue[3].status, 'planned');
  assert.equal(catalogue[4].status, 'existing');
});

test('the first Klasse 1 question bank has three levels per world', () => {
  assert.ok(grade1.worlds.length >= 4);
  assert.equal(new Set(grade1.worlds.map(world => world.id)).size, grade1.worlds.length);
  for (const world of grade1.worlds) {
    assert.equal(world.levels.length, 3, world.id);
    assert.ok(world.levels.every(level => level.length > 0), world.id);
  }
});

test('generated Klasse 1 tasks always have valid, unique answer options', () => {
  for (const world of grade1.worlds) {
    for (const level of world.levels) {
      for (const generate of level) {
        for (let i = 0; i < 150; i++) {
          const q = generate();
          assert.equal(q.type, 'choice');
          assert.equal(typeof q.q, 'string');
          assert.ok(q.q.length);
          assert.ok(q.explain.length);
          assert.ok(q.options.length >= 3 && q.options.length <= 4);
          assert.equal(new Set(q.options).size, q.options.length);
          assert.ok(Number.isInteger(q.correct) && q.correct >= 0 && q.correct < q.options.length);
          const answer = q.options[q.correct];
          if (/^\d+$/.test(answer)) assert.ok(Number(answer) >= 0 && Number(answer) <= 20);
        }
      }
    }
  }
});

test('arithmetic tasks compute the result shown in their prompt', () => {
  const arithmetic = grade1.worlds.find(world => world.id === 'g1_rechnen');
  for (const level of arithmetic.levels) {
    for (const generate of level) {
      for (let i = 0; i < 250; i++) {
        const q = generate();
        const match = q.q.match(/^(\d+) ([+−]) (\d+) = \?$/);
        assert.ok(match, q.q);
        const [, lhs, operator, rhs] = match;
        const expected = operator === '+' ? Number(lhs) + Number(rhs) : Number(lhs) - Number(rhs);
        assert.equal(Number(q.options[q.correct]), expected);
      }
    }
  }
});
