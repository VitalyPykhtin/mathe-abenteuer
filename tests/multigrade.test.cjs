'use strict';
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');
const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

test('grade selector links to the two currently playable grades', () => {
  const index = read('index.html');
  assert.match(index, /href="klasse1\.html"/);
  assert.match(index, /href="klasse4\.html"/);
  assert.doesNotMatch(index, /href="klasse2\.html"/);
  assert.doesNotMatch(index, /href="klasse3\.html"/);
});

test('Klasse 4 page preserves original engine and save format', () => {
  const klass4 = read('klasse4.html');
  assert.match(klass4, /src="tasks\.js\?v=15"/);
  assert.match(klass4, /src="story2\.js\?v=15"/);
  assert.match(klass4, /src="game\.js\?v=15"/);
  const legacy = read('game.js');
  assert.match(legacy, /const KEY = 'mathe-abenteuer-v2'/);
  assert.match(legacy, /const MIRROR = 'mathe-abenteuer-save'/);
});

test('new Grade 1 page reuses original procedural Three.js world', () => {
  const html = read('klasse1.html');
  assert.match(html, /src="three\.min\.js/);
  assert.match(html, /src="world3d\.js/);
  assert.match(html, /src="grades\/klasse1\.js/);
  assert.match(html, /src="grades\/klasse1-app\.js/);
});

test('service worker pre-caches all grade pages and preserves both saves', () => {
  const worker = read('sw.js');
  for (const file of ['index.html', 'klasse1.html', 'klasse4.html',
    'grades/catalog.js', 'grades/launcher.css', 'grades/klasse1.js',
    'grades/klasse1-app.js', 'grades/klasse1.css']) {
    assert.ok(worker.includes("'" + file + "'"), file);
  }
  assert.match(worker, /k !== 'mathe-abenteuer-save'/);
  assert.match(worker, /k !== 'mathe-abenteuer-grade-1-save'/);
});

test('Grade 1 browser stores progress with a dedicated key and story progression', () => {
  const app = read('grades/klasse1-app.js');
  assert.match(app, /const KEY = catalogue\[1\]\.progressKey/);
  assert.match(app, /state\.completed\[finished\.world\] = true/);
  assert.match(app, /state\.stars\[key\] = Math\.max/);
  assert.match(app, /if \(!state\.name\) return welcome\(\)/);
});
