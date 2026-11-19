/* Shared mini-adventure for Klasse 2 and 3, with isolated saves per grade. */
(function () {
  'use strict';

  const app = document.getElementById('game');
  const GRADE = Number(document.body.dataset.grade);
  if (GRADE !== 2 && GRADE !== 3) throw new Error('Grade 2 or 3 required');
  const bank = window['MATHE_GRADE' + GRADE];
  if (!bank || bank.grade !== GRADE) throw new Error('Grade question bank missing');
  const catalogue = window.MATHE_GRADES;
  const KEY = catalogue[GRADE].progressKey;
  const MIRROR = 'mathe-abenteuer-grade-' + GRADE + '-save';
  const WORLD_SCENES = bank.worlds.map(world => world.scene);
  const COLORS = bank.worlds.map(world => world.color);
  const CHAPTERS = bank.worlds.map(world => world.story);

  const defaults = () => ({
    version: 1, grade: GRADE, name: '', avatar: 'girl',
    voice: true, sound: true, coins: 0, solved: 0,
    stars: {}, completed: {}, sessions: 0
  });
  const esc = value => String(value).replace(/[&<>"']/g, ch =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
  const validSave = obj => !!(obj && obj.grade === GRADE && typeof obj.name === 'string' &&
    obj.stars && typeof obj.stars === 'object' && !Array.isArray(obj.stars) &&
    obj.completed && typeof obj.completed === 'object' && !Array.isArray(obj.completed));
  const load = () => {
    try {
      const obj = JSON.parse(localStorage.getItem(KEY) || 'null');
      return validSave(obj) ? Object.assign(defaults(), obj) : defaults();
    } catch (_) { return defaults(); }
  };
  let state = load();
  let screen = 'home';
  let quiz = null;
  let currentWorld = 0;
  let currentAnswer = null;
  let context = null;
  let soundContext = null;

  function save() {
    const json = JSON.stringify(state);
    try { localStorage.setItem(KEY, json); } catch (_) {}
    if (window.caches) {
      caches.open(MIRROR).then(cache => cache.put('save',
        new Response(json, { headers: { 'content-type': 'application/json' } }))).catch(() => {});
    }
  }
  function restoreMirror() {
    try {
      if (localStorage.getItem(KEY) || !window.caches) return;
      caches.open(MIRROR).then(cache => cache.match('save'))
        .then(response => response && response.text()).then(json => {
          if (!json) return;
          const obj = JSON.parse(json);
          if (!validSave(obj) || state.name) return;
          localStorage.setItem(KEY, json);
          state = Object.assign(defaults(), obj);
          home();
        }).catch(() => {});
    } catch (_) {}
  }
  function audio(notes) {
    if (!state.sound) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      soundContext = soundContext || new AudioCtx();
      if (soundContext.state === 'suspended') soundContext.resume().catch(() => {});
      notes.forEach((frequency, index) => {
        const oscillator = soundContext.createOscillator();
        const gain = soundContext.createGain();
        const t = soundContext.currentTime + index * 0.11;
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0.10, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.20);
        oscillator.connect(gain);
        gain.connect(soundContext.destination);
        oscillator.start(t);
        oscillator.stop(t + 0.21);
      });
    } catch (_) {}
  }
  function speak(text) {
    if (!state.voice || !window.speechSynthesis || !text) return;
    try {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(
        String(text).replace(/<[^>]*>/g, '').replace(/[🌟🌈🐝🏰]/g, ''));
      utterance.lang = 'de-DE';
      utterance.rate = 0.87;
      utterance.pitch = 1.06;
      const voice = speechSynthesis.getVoices().find(v => v.lang && v.lang.startsWith('de'));
      if (voice) utterance.voice = voice;
      speechSynthesis.speak(utterance);
    } catch (_) {}
  }
  function stage(worldNumber) {
    const n = Number.isInteger(worldNumber) ? worldNumber : 0;
    const stageElement = document.querySelector('.world-stage');
    stageElement.style.background = 'linear-gradient(130deg,' + COLORS[n] + ',#a7f3d0)';
    if (typeof W3 === 'undefined' || !W3.ok) return;
    W3.setEnv(WORLD_SCENES[n]);
    W3.setActors([
      { id: 'hero', img: 'img/e/' + (state.avatar === 'boy' ? 'boy' : 'girl') + '.png', x: 30, y: 3, size: 38, anim: 'hop' },
      { id: 'finn', img: 'img/e/fox.png', x: 58, y: 3, size: 30, anim: 'hop' },
      { id: 'eule', img: 'img/e/owl.png', x: 77, y: 26, size: 27, anim: 'float' }
    ]);
  }
  const top = () => { window.scrollTo(0, 0); };
  const avatarImg = () => 'img/e/' + (state.avatar === 'boy' ? 'boy' : 'girl') + '.png';
  const foot = () => '<footer class="footer">' +
    '<button type="button" data-action="toggle-voice">' + (state.voice ? '🗣️ Vorlesen an' : '🤐 Vorlesen aus') + '</button>' +
    '<button type="button" data-action="toggle-sound">' + (state.sound ? '🔊 Töne an' : '🔇 Töne aus') + '</button>' +
    '<button type="button" data-action="parent">⚙️ Eltern</button>' +
    '<span class="small muted" id="offline">Version 0.1</span></footer>';
  const stars = n => '⭐'.repeat(n || 0) + '☆'.repeat(3 - (n || 0));
  const progress = () => Object.values(state.stars).filter(n => n > 0).length;

  function welcome() {
    screen = 'welcome'; stage();
    app.innerHTML = '<section class="card center"><h1>Willkommen im Zahlenland!</h1>' +
      '<p class="lead">Wie heißt du? Wir gehen gemeinsam auf Zahlen-Abenteuer!</p>' +
      '<div class="avatars">' +
      ['girl', 'boy'].map((id, index) =>
        '<button class="avatar ' + (state.avatar === id ? 'chosen' : '') +
        '" data-action="avatar" data-avatar="' + id + '" aria-label="' +
        (index ? 'Junge' : 'Mädchen') + '"><img src="img/e/' + id + '.png" alt="">' +
        (index ? 'Junge' : 'Mädchen') + '</button>').join('') +
      '</div><form id="name-form"><label for="name">Dein Name</label>' +
      '<input class="name-input" id="name" name="name" maxlength="24" autocomplete="off" placeholder="Wie heißt du?" value="' + esc(state.name) + '">' +
      '<button type="submit" class="btn">Los geht’s! 🚀</button></form></section>';
    top();
  }
  function home() {
    if (!state.name) return welcome();
    screen = 'home'; quiz = null; stage();
    app.innerHTML = '<div class="topline"><h1>' + esc(state.name) + 's Mathe-Abenteuer</h1>' +
      '<span class="counter">🪙 ' + Math.max(0, state.coins) + ' · ⭐ ' + progress() + '/' + (bank.worlds.length * 3) + '</span></div>' +
      '<section class="card center"><img src="' + avatarImg() + '" alt="" width="76" height="76">' +
      '<h2>Hallo, ' + esc(state.name) + '! 👋</h2>' +
      '<p class="lead">Hilf Finn und Frau Eule im Zahlenland. Heute kannst du zählen, rechnen und Formen entdecken!</p>' +
      '<div class="actions"><button class="btn" data-action="story">📖 Abenteuer</button>' +
      '<button class="btn alt" data-action="training">🎯 Training</button></div></section>' +
      '<section class="card"><h3>Deine Erfolge</h3><p>Geschafft: ' + Object.keys(state.completed).filter(k => state.completed[k]).length +
      ' von ' + CHAPTERS.length + ' Kapiteln · ' + Math.max(0, state.solved) + ' richtige Antworten</p>' +
      '<div class="progress"><div style="width:' + (progress() / (bank.worlds.length * 3) * 100) + '%"></div></div>' +
      '<p class="muted small">Die Übungswelten kannst du frei auswählen. Die Geschichte wird Schritt für Schritt freigeschaltet.</p></section>' + foot();
    top();
  }
  function training() {
    screen = 'training'; stage(currentWorld);
    const cards = bank.worlds.map((world, wi) =>
      '<article class="card"><div class="story-card"><span class="chapter">' + world.icon +
      '</span><div><strong>' + esc(world.name) + '</strong><p class="muted small">' + esc(world.topic) + '</p></div></div>' +
      '<div class="levels">' + world.levels.map((_, li) =>
      '<button class="level" data-action="play" data-world="' + wi + '" data-level="' + li + '">' +
      'Level ' + (li + 1) + ' <span class="mini-stars">' + stars(state.stars[wi + '-' + li]) +
      '</span></button>').join('') + '</div></article>').join('');
    app.innerHTML = '<div class="topline"><h1>🎯 Training</h1><button class="btn soft" data-action="home">← Zurück</button></div>' +
      '<p class="lead">Wähle eine Welt und ein Level. Für jedes Training gibt es bis zu drei Sterne!</p>' + cards + foot();
    top();
  }
  function storyMenu() {
    screen = 'story'; stage();
    app.innerHTML = '<div class="topline"><h1>📖 Dein Abenteuer</h1>' +
      '<button class="btn soft" data-action="home">← Zurück</button></div>' +
      '<p class="lead">' + CHAPTERS.length + ' kleine Geschichten: Hilf deinen Freunden und löse die Rätsel!</p>' +
      CHAPTERS.map((chapter, index) => {
        const locked = index > 0 && !state.completed[index - 1];
        const complete = !!state.completed[index];
        return '<section class="card story-card' + (locked ? ' locked' : '') + '">' +
          '<div class="chapter">' + chapter.icon + '</div><div style="flex:1">' +
          '<strong>Kapitel ' + (index + 1) + ': ' + esc(chapter.title) + '</strong>' +
          '<p class="muted small">' + (complete ? '✅ Geschafft' : locked ? '🔒 Erst das vorige Kapitel spielen' : 'Bereit zum Start') + '</p></div>' +
          '<button class="btn ' + (locked ? 'soft' : '') + '" data-action="chapter" data-world="' +
          index + '"' + (locked ? ' disabled' : '') + '>' + (complete ? 'Nochmal' : locked ? '🔒' : 'Start') + '</button></section>';
      }).join('') + foot();
    top();
  }
  function chapterIntro(index) {
    if (index > 0 && !state.completed[index - 1]) return storyMenu();
    screen = 'chapter'; currentWorld = index; stage(index);
    const chapter = CHAPTERS[index];
    app.innerHTML = '<section class="card"><div class="topline"><span class="counter">Kapitel ' +
      (index + 1) + ' von 4</span><button class="btn soft" data-action="story">← Zurück</button></div>' +
      '<h1>' + chapter.icon + ' ' + esc(chapter.title) + '</h1>' +
      '<div class="story-intro">' + esc(chapter.text) + '</div>' +
      '<div class="actions"><button class="btn soft" data-action="read-story">🔊 Vorlesen</button>' +
      '<button class="btn" data-action="begin-story" data-world="' + index + '">Jetzt helfen! ⭐</button></div>' +
      '</section>';
    top(); speak(chapter.text);
  }
  function play(worldNumber, level, mode) {
    const world = bank.worlds[worldNumber];
    if (!world || !world.levels[level]) return;
    if (mode === 'story' && worldNumber > 0 && !state.completed[worldNumber - 1]) return storyMenu();
    currentWorld = worldNumber;
    quiz = { world: worldNumber, level, mode, index: 0, correct: 0, count: mode === 'story' ? 5 : 8, answered: false };
    screen = 'quiz'; stage(worldNumber);
    showQuestion();
  }
  function currentQuestion() {
    const world = bank.worlds[quiz.world];
    const generators = world.levels[quiz.level];
    return generators[quiz.index % generators.length]();
  }
  function showQuestion() {
    quiz.answered = false;
    currentAnswer = null;
    context = currentQuestion();
    const question = context;
    const chapter = CHAPTERS[quiz.world];
    const title = quiz.mode === 'story' ? chapter.title : bank.worlds[quiz.world].name;
    app.innerHTML = '<section class="card"><div class="topline"><span class="counter">' +
      (quiz.mode === 'story' ? '📖 Kapitel ' + (quiz.world + 1) : '🎯 Level ' + (quiz.level + 1)) +
      '</span><button class="btn soft" data-action="quit">✕ Beenden</button></div>' +
      '<h2 class="center">' + esc(title) + '</h2>' +
      '<div class="progress"><div style="width:' + (quiz.index / quiz.count * 100) + '%"></div></div>' +
      '<p class="center muted">Aufgabe ' + (quiz.index + 1) + ' von ' + quiz.count + '</p>' +
      '<div class="question" id="question">' + esc(question.q) + '</div>' +
      (question.visual ? '<div class="picture">' + question.visual + '</div>' : '') +
      '<div class="options">' + question.options.map((option, oi) =>
        '<button class="choice" data-action="answer" data-option="' + oi +
        '" aria-label="Antwort ' + esc(option) + '">' + esc(option) + '</button>').join('') +
      '</div><div id="feedback" aria-live="assertive"></div>' +
      '<div class="actions"><button class="btn soft" data-action="read-question">🔊 Aufgabe vorlesen</button></div></section>';
    top(); speak(question.q);
  }
  function answer(option) {
    if (!quiz || quiz.answered || !context || !Number.isInteger(option) ||
        option < 0 || option >= context.options.length) return;
    quiz.answered = true;
    const correct = option === context.correct;
    if (correct) {
      quiz.correct++;
      state.solved++;
      state.coins += 2;
      audio([660, 880, 1046]);
      if (typeof W3 !== 'undefined' && W3.ok) W3.celebrate();
    } else {
      audio([330, 260]);
      if (typeof W3 !== 'undefined' && W3.ok) W3.sad();
    }
    save();
    document.querySelectorAll('.choice').forEach((button, i) => {
      button.disabled = true;
      if (i === context.correct) button.classList.add('good');
      else if (i === option) button.classList.add('bad');
    });
    const feedback = document.getElementById('feedback');
    feedback.innerHTML = '<div class="feedback ' + (correct ? 'ok' : '') + '">' +
      '<strong>' + (correct ? 'Super! Richtig! 🌟' : 'Fast! Schau dir die Lösung an. 💡') + '</strong>' +
      '<p>' + esc(context.explain) + '</p>' +
      '<p>Richtige Antwort: <strong>' + esc(context.options[context.correct]) + '</strong></p>' +
      '</div><div class="actions"><button class="btn" data-action="next">' +
      (quiz.index + 1 === quiz.count ? 'Ergebnis ansehen 🎉' : 'Weiter →') + '</button></div>';
    speak(correct ? 'Super, richtig!' : 'Das ist noch nicht richtig. ' + context.explain);
  }
  function next() {
    if (!quiz || !quiz.answered) return;
    quiz.index++;
    if (quiz.index < quiz.count) showQuestion();
    else completeQuiz();
  }
  function completeQuiz() {
    const finished = quiz;
    quiz = null; screen = 'result';
    const passed = finished.mode !== 'story' || finished.correct >= 3;
    const isNewChapter = finished.mode === 'story' && passed && !state.completed[finished.world];
    if (finished.mode === 'training') {
      const key = finished.world + '-' + finished.level;
      const score = finished.correct / finished.count;
      const medal = score >= .875 ? 3 : score >= .625 ? 2 : 1;
      state.stars[key] = Math.max(state.stars[key] || 0, medal);
    } else if (isNewChapter) {
      state.completed[finished.world] = true;
      state.coins += 15;
    }
    state.sessions++;
    save(); stage(finished.world);
    const statement = finished.mode === 'story' ?
      (passed ? CHAPTERS[finished.world].finish : 'Noch nicht ganz! Versuch es noch einmal. Finn hilft dir!') :
      'Du hast fleißig geübt. Versuche beim nächsten Mal noch mehr richtige Antworten!';
    app.innerHTML = '<section class="card center"><h1>' +
      (passed ? '🎉 Super gemacht!' : '💛 Gut versucht!') + '</h1>' +
      '<div style="font-size:4rem">' + (passed ? '🏆' : '🦉') + '</div>' +
      '<p class="lead">' + esc(statement) + '</p>' +
      '<h2>' + finished.correct + ' von ' + finished.count + ' richtig</h2>' +
      (finished.mode === 'training' ? '<p class="counter">' +
        stars(state.stars[finished.world + '-' + finished.level]) + '</p>' : '') +
      (isNewChapter ? '<p class="counter">+15 🪙 · Neues Kapitel frei!</p>' : '') +
      '<div class="actions"><button class="btn alt" data-action="retry" data-world="' +
      finished.world + '" data-level="' + finished.level + '" data-mode="' +
      finished.mode + '">Nochmal spielen</button><button class="btn" data-action="' +
      (finished.mode === 'story' ? 'story' : 'training') + '">Zur Auswahl</button></div></section>' + foot();
    if (passed) { audio([523, 659, 784, 1046]); if (typeof W3 !== 'undefined' && W3.ok) W3.celebrate(); }
    top(); speak(statement);
  }
  function quit() {
    if (quiz && !window.confirm('Willst du die Runde wirklich beenden? Dein bisheriger Fortschritt dieser Runde geht verloren.')) return;
    const mode = quiz && quiz.mode;
    quiz = null; context = null;
    if (mode === 'story') storyMenu(); else training();
  }
  function parent() {
    screen = 'parent'; stage();
    app.innerHTML = '<section class="card"><div class="topline"><h1>⚙️ Eltern-Bereich</h1>' +
      '<button class="btn soft" data-action="home">← Zurück</button></div>' +
      '<p>Jede Klasse hat einen eigenen Spielstand. Der Spielstand der 4. Klasse bleibt unberührt.</p>' +
      '<p><strong>' + GRADE + '. Klasse:</strong> ' + esc(state.name) + ' · 🪙 ' + state.coins +
      ' · ⭐ ' + progress() + '/' + (bank.worlds.length * 3) + '</p><h3>Sicherungskopie</h3>' +
      '<p class="small muted">Kopiere diesen Code in deine Notizen, um den Fortschritt später wiederherzustellen.</p>' +
      '<textarea id="save-code" readonly aria-label="Sicherungscode">' + toCode(state) + '</textarea>' +
      '<div class="actions"><button class="btn alt" data-action="copy">📋 Code kopieren</button></div>' +
      '<h3 style="margin-top:25px">Fortschritt wiederherstellen</h3>' +
      '<textarea id="restore-code" aria-label="Code für Wiederherstellung" placeholder="MA-G' + GRADE + ':..."></textarea>' +
      '<div class="actions"><button class="btn" data-action="restore">♻️ Wiederherstellen</button></div>' +
      '<div class="actions"><button class="btn warn" data-action="reset">🗑 ' + GRADE + '. Klasse zurücksetzen</button></div>' +
      '</section>';
    top();
  }
  function toCode(value) {
    return 'MA-G' + GRADE + ':' + btoa(unescape(encodeURIComponent(JSON.stringify(value))));
  }
  function fromCode(raw) {
    try {
      const match = String(raw).replace(/\s/g, '').match(new RegExp('^MA-G' + GRADE + ':([A-Za-z0-9+/=]+)$'));
      if (!match) return null;
      const value = JSON.parse(decodeURIComponent(escape(atob(match[1]))));
      return validSave(value) ? Object.assign(defaults(), value) : null;
    } catch (_) { return null; }
  }
  function chooseAvatar(avatar) {
    if (avatar !== 'boy' && avatar !== 'girl') return;
    const input = document.getElementById('name');
    const name = input ? input.value : '';
    state.avatar = avatar;
    welcome();
    const newInput = document.getElementById('name');
    if (newInput) newInput.value = name;
  }
  function dispatch(action, button) {
    const n = Number(button.dataset.world), level = Number(button.dataset.level);
    switch (action) {
      case 'home': home(); break;
      case 'training': training(); break;
      case 'story': storyMenu(); break;
      case 'avatar': chooseAvatar(button.dataset.avatar); break;
      case 'play': play(n, level, 'training'); break;
      case 'chapter': chapterIntro(n); break;
      case 'begin-story': play(n, 0, 'story'); break;
      case 'answer': answer(Number(button.dataset.option)); break;
      case 'next': next(); break;
      case 'quit': quit(); break;
      case 'read-question': if (context) speak(context.q); break;
      case 'read-story': speak(CHAPTERS[currentWorld].text); break;
      case 'retry': play(n, level, button.dataset.mode === 'story' ? 'story' : 'training'); break;
      case 'toggle-voice': state.voice = !state.voice; save(); home(); break;
      case 'toggle-sound': state.sound = !state.sound; save(); home(); break;
      case 'parent': parent(); break;
      case 'copy': {
        const area = document.getElementById('save-code');
        area.focus(); area.select(); area.setSelectionRange(0, area.value.length);
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(area.value).then(() => alert('Code kopiert!'),
            () => alert('Bitte den Code von Hand kopieren.'));
        } else alert('Bitte den markierten Code von Hand kopieren.');
        break;
      }
      case 'restore': {
        const newSave = fromCode(document.getElementById('restore-code').value);
        if (!newSave) { alert('Ungültiger Code für die ' + GRADE + '. Klasse.'); break; }
        if (!confirm('Den aktuellen Spielstand der ' + GRADE + '. Klasse ersetzen?')) break;
        state = newSave; save(); home(); break;
      }
      case 'reset': {
        if (!confirm('Wirklich nur den Spielstand der ' + GRADE + '. Klasse löschen?')) break;
        state = defaults(); save(); welcome(); break;
      }
      default: break;
    }
  }
  app.addEventListener('click', event => {
    const button = event.target.closest('[data-action]');
    if (button && !button.disabled) dispatch(button.dataset.action, button);
  });
  app.addEventListener('submit', event => {
    if (event.target.id !== 'name-form') return;
    event.preventDefault();
    const value = document.getElementById('name').value.trim().replace(/[<>]/g, '');
    state.name = value.slice(0, 24) || 'Zahlenheld';
    save(); audio([440, 660, 880]); home();
  });
  try {
    if (typeof W3 !== 'undefined' && !W3.init(document.getElementById('world')))
      document.getElementById('world').style.display = 'none';
  } catch (_) { document.getElementById('world').style.display = 'none'; }
  home(); restoreMirror();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(reg => {
      reg.update().catch(() => {});
      return navigator.serviceWorker.ready;
    }).then(() => {
      const label = document.getElementById('offline');
      if (label) label.textContent = '✈️ Offline vorbereitet';
    }).catch(() => {});
  }
})();
