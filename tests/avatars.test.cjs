'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const base = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(base, name), 'utf8');
const avatars = require('../grades/avatars.js');
const catalogue = require('../grades/catalog.js');

test('there are twelve unique heroes, including an astronaut', () => {
  assert.equal(avatars.length, 12);
  assert.equal(new Set(avatars.map(a => a.id)).size, 12);
  assert.ok(avatars.find(a => a.id === 'astronaut' && /astro/.test(a.image)));
  assert.deepEqual(avatars.map(a => a.id), [
    'girl','boy','astronaut','robot','pirate','knight','princess','wizard',
    'fox','owl','dragon','unicorn'
  ]);
  for (const avatar of avatars) {
    assert.ok(avatar.label);
    assert.ok(fs.existsSync(path.join(base, avatar.image)), avatar.image);
  }
});

test('classes 1–3 load the avatar catalogue, while class 4 stays untouched', () => {
  for (const n of [1,2,3]) {
    const html = read('klasse'+n+'.html');
    assert.match(html, /src="grades\/avatars\.js\?v=18"/);
    assert.ok(html.indexOf('grades/avatars.js') < html.indexOf(n===1?'grades/klasse1-app.js':'grades/upper-app.js'));
  }
  assert.doesNotMatch(read('klasse4.html'), /grades\/avatars\.js/);
});

test('both mini-adventure engines use selected image on the home page and 3D stage', () => {
  for (const file of ['grades/klasse1-app.js','grades/upper-app.js']) {
    const s = read(file);
    assert.match(s, /const AVATARS = window\.MATHE_AVATARS/);
    assert.match(s, /img: avatarById\(state\.avatar\)\.image/);
    assert.match(s, /const avatarImg = \(\) => avatarById\(state\.avatar\)\.image/);
    assert.match(s, /case 'change-avatar': welcome\(\)/);
    assert.match(s, /AVATARS\.map\(a =>/);
  }
});

test('avatar choice and saved progress survive class 1 and class 2 profile edits', () => {
  for (const grade of [1,2]) {
    const events = {};
    const stored = new Map();
    const app = {innerHTML:'',addEventListener(type,fn){events[type]=fn;}};
    const input = {value:'Mia'};
    const document = {
      body:{dataset:{grade:String(grade)}},
      getElementById(id){return {game:app,name:input,world:{style:{}}}[id] || null;},
      querySelector(sel){return sel==='.world-stage'?{style:{}}:null;},
      querySelectorAll(){return [];}
    };
    const sandbox = { document, navigator:{}, scrollTo(){}, console, confirm(){return true;},
      W3:{ok:false,init(){return false;}},
      localStorage:{getItem(k){return stored.get(k)||null;},setItem(k,v){stored.set(k,String(v));}} };
    sandbox.window=sandbox;
    sandbox.MATHE_GRADES=catalogue;
    sandbox.MATHE_AVATARS=avatars;
    vm.createContext(sandbox);
    if(grade===1) {
      sandbox.MATHE_GRADE1=require('../grades/klasse1.js');
    } else {
      vm.runInContext(read('grades/upper-bank.js'), sandbox);
    }
    vm.runInContext(read(grade===1?'grades/klasse1-app.js':'grades/upper-app.js'),sandbox);
    const click=(action,data={})=>events.click({
      target:{closest(){return {disabled:false,dataset:{action,...data}};}}
    });
    // Both previously saved settings and existing task progress are preserved.
    events.submit({target:{id:'name-form'},preventDefault(){}});
    const key=catalogue[grade].progressKey;
    const before=JSON.parse(stored.get(key));
    before.stars={'0-0':3};before.coins=30;
    stored.set(key,JSON.stringify(before));
    click('change-avatar');
    assert.match(app.innerHTML,/Astronaut/);
    assert.match(app.innerHTML,/Roboter/);
    click('avatar',{avatar:'astronaut'});
    events.submit({target:{id:'name-form'},preventDefault(){}});
    const after=JSON.parse(stored.get(key));
    assert.equal(after.avatar,'astronaut');
    assert.equal(after.coins,30);
    assert.equal(after.stars['0-0'],3);
    assert.match(app.innerHTML,/man_astronaut\.png/);
  }
});
