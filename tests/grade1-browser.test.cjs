'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const assert = require('node:assert/strict');
const root = path.join(__dirname, '..');
const script = name => fs.readFileSync(path.join(root, name), 'utf8');

test('first-grade page can start, answer eight questions, and save stars in a mocked iPad browser', () => {
  const events = {};
  const store = new Map();
  const game = { innerHTML: '', addEventListener(type, fn) { events[type] = fn; } };
  const stage = { style: {} };
  const world = { style: {} };
  const nameInput = { value: 'Lina' };
  const feedback = { innerHTML: '' };
  const choiceButtons = Array.from({ length: 4 }, () => ({
    disabled: false, classList: { add() {} }
  }));
  const document = {
    getElementById(id) {
      if (id === 'game') return game;
      if (id === 'world') return world;
      if (id === 'name') return nameInput;
      if (id === 'feedback') return feedback;
      return null;
    },
    querySelector(selector) { if (selector === '.world-stage') return stage; return null; },
    querySelectorAll(selector) { if (selector === '.choice') return choiceButtons; return []; }
  };
  const sandbox = {
    document, navigator: {}, console, Math, JSON, Number, Array, Object, String,
    localStorage: {
      getItem(key) { return store.get(key) || null; },
      setItem(key, value) { store.set(key, String(value)); }
    },
    scrollTo() {},
    confirm() { return true; },
    alert() {},
    W3: { ok: false, init() { return false; } }
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  for (const name of ['grades/catalog.js', 'grades/klasse1.js', 'grades/avatars.js', 'grades/klasse1-app.js']) {
    vm.runInContext(script(name), sandbox, { filename: name });
  }
  assert.match(game.innerHTML, /Willkommen im Zahlenland/);
  assert.match(game.innerHTML, /id="name-form"/);

  events.submit({ target: { id: 'name-form' }, preventDefault() {} });
  assert.match(game.innerHTML, /Linas Mathe-Abenteuer/);
  assert.ok(store.has('mathe-abenteuer-grade-1-v1'));
  assert.equal(store.has('mathe-abenteuer-v2'), false);

  const click = (action, dataset = {}) =>
    events.click({ target: { closest: () => ({ dataset: { action, ...dataset }, disabled: false }) } });
  click('training');
  assert.match(game.innerHTML, /Level 1/);
  click('play', { world: '0', level: '0' });
  assert.match(game.innerHTML, /Aufgabe 1 von 8/);
  for (let i = 0; i < 8; i++) {
    click('answer', { option: '0' });
    assert.match(feedback.innerHTML, /Richtige Antwort/);
    click('next');
  }
  assert.match(game.innerHTML, /von 8 richtig/);
  const progress = JSON.parse(store.get('mathe-abenteuer-grade-1-v1'));
  assert.equal(progress.grade, 1);
  assert.equal(progress.sessions, 1);
  assert.ok(progress.stars['0-0'] >= 1);
  assert.equal(store.has('mathe-abenteuer-v2'), false);
});
