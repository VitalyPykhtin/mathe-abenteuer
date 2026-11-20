'use strict';
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const source = p => fs.readFileSync(path.resolve(root, p), 'utf8');

function loadBank(grade) {
  const sandbox = { MATHE_GRADES: require('../grades/catalog.js'),
    document: {body:{ dataset:{grade:String(grade)} }},
    Math, Number, Object, Array, String, Set, Error, console };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(source('grades/upper-bank.js'),sandbox);
  return sandbox['MATHE_GRADE'+grade];
}

for (const grade of [2,3]) {
  test('Klasse '+grade+' has six playable worlds, six stories and three levels',()=>{
    const bank=loadBank(grade);
    assert.equal(bank.grade,grade);
    assert.equal(bank.worlds.length,6);
    const ids=new Set();
    for(const world of bank.worlds){
      assert.ok(world.scene && world.color && world.story);
      assert.ok(world.story.title && world.story.text && world.story.finish);
      assert.equal(world.levels.length,3);
      for(const level of world.levels)assert.ok(level.length>0);
      ids.add(world.id);
    }
    assert.equal(ids.size,bank.worlds.length);
  });
  test('Klasse '+grade+' randomized tasks produce valid and distinct correct answers',()=>{
    const bank=loadBank(grade);
    for(const world of bank.worlds)for(const level of world.levels)for(const gen of level){
      for(let i=0;i<75;i++){
        const q=gen();
        assert.equal(q.type,'choice');
        assert.ok(q.q && q.explain);
        assert.ok(q.options.length>=3 && q.options.length<=4, q.q);
        assert.equal(new Set(q.options).size,q.options.length,q.q);
        assert.ok(q.correct>=0 && q.correct<q.options.length,q.q);
        assert.equal(typeof q.options[q.correct],'string',q.q);
        const m=q.q.match(/^(\\d+) ([+−·:]) (\\d+) = \\?$/);
        if(m && /^\\d+$/.test(q.options[q.correct])){
          const a=Number(m[1]),b=Number(m[3]);
          const expected=m[2]==='+'?a+b:m[2]==='−'?a-b:m[2]==='·'?a*b:a/b;
          assert.equal(Number(q.options[q.correct]),expected,q.q);
        }
      }
    }
  });
}

function runBrowser(grade) {
  const bank = loadBank(grade);
  const events = {};
  const saved = new Map();
  const app = {innerHTML:'', addEventListener(type,cb){events[type]=cb;}};
  const feedback={innerHTML:''};
  const name={value:'Mia'};
  const canvas={style:{}};
  const stage={style:{}};
  const choices=Array.from({length:4},()=>({disabled:false,classList:{add(){}}}));
  const document = {
    body:{dataset:{grade:String(grade)}},
    getElementById(id){
      return {game:app,name,world:canvas,feedback}[id] || null;
    },
    querySelector(s){return s==='.world-stage'?stage:null;},
    querySelectorAll(s){return s==='.choice'?choices:[];}
  };
  const window={
    MATHE_GRADES: require('../grades/catalog.js'),
    MATHE_AVATARS: require('../grades/avatars.js'),
    ['MATHE_GRADE'+grade]:bank,
    document,navigator:{},scrollTo(){},confirm(){return true;},alert(){},
    W3:{ok:false,init(){return false;}},
    localStorage:{
      getItem(k){return saved.get(k)||null;},
      setItem(k,v){saved.set(k,String(v));}
    }
  };
  window.window=window;
  vm.createContext(window);
  vm.runInContext(source('grades/upper-app.js'),window,{filename:'upper-app.js'});
  const click=(action,data={})=>events.click({
    target:{closest(){return {disabled:false,dataset:{action,...data}};}}
  });
  events.submit({target:{id:'name-form'},preventDefault(){}});
  assert.match(app.innerHTML,/Mias Mathe-Abenteuer/);
  click('training');
  assert.match(app.innerHTML,/Level 1/);
  click('play',{world:'0',level:'0'});
  for(let i=0;i<8;i++){
    assert.match(app.innerHTML,/Aufgabe \d von 8/);
    click('answer',{option:'0'});
    assert.match(feedback.innerHTML,/Richtige Antwort/);
    click('next');
  }
  assert.match(app.innerHTML,/von 8 richtig/);
  const key='mathe-abenteuer-grade-'+grade+'-v1';
  const state=JSON.parse(saved.get(key));
  assert.equal(state.grade,grade);
  assert.ok(state.stars['0-0']>=1);
  assert.equal(state.sessions,1);
  assert.equal(saved.has('mathe-abenteuer-v2'),false);
  assert.equal(saved.has('mathe-abenteuer-grade-1-v1'),false);
  assert.equal(saved.has('mathe-abenteuer-grade-'+(grade===2?3:2)+'-v1'),false);
  return {state,saved,bank,click,app,events};
}

for (const grade of [2,3]){
  test('Klasse '+grade+' browser training round and grade-isolated progress',()=>{
    runBrowser(grade);
  });
}
