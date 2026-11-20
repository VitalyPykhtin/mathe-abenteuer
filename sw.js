'use strict';
/* Offline cache for the personal multi-grade fork. Keep all local progress mirror caches intact. */
importScripts('tasks.js', 'tasks2.js', 'story.js', 'story2.js');
const V = 'v18', CACHE = 'mathe-abenteuer-' + V;
const CORE = [
  './', 'index.html', 'klasse1.html', 'klasse2.html', 'klasse3.html', 'klasse4.html',
  'style.css', 'game.js', 'tasks.js', 'tasks2.js', 'story.js', 'story2.js',
  'world3d.js', 'three.min.js', 'manifest.json',
  'grades/catalog.js', 'grades/avatars.js', 'grades/launcher.css', 'grades/upper-bank.js', 'grades/upper-app.js', 'grades/klasse1.js',
  'grades/klasse1-app.js', 'grades/klasse1.css',
  'fonts/fredoka.woff2', 'fonts/nunito.woff2',
  'img/e/gem_stone.png', 'img/e/boy.png', 'img/e/girl.png',
  'img/e/fox.png', 'img/e/owl.png',
  'img/e/robot.svg', 'img/e/pirate.svg', 'img/e/knight.svg'
];
const EMO = [...new Set(['compass', 'glowing_star', ...Object.values(ACT).map(a => a[0]),
  ...HEROES.map(h => h[0]), ...STICKERS.map(s => s[0]), ...ICONS])].map(f => 'img/e/' + f + '.png');
const PHOTOS = Object.keys(ANIMALS).map(k => 'img/' + k + '.jpg');
self.addEventListener('install', event => event.waitUntil(
  caches.open(CACHE).then(cache =>
    // Core is mandatory: offline-ready must not succeed with missing app scripts.
    Promise.all(CORE.map(url => cache.add(new Request(url, { cache: 'reload' }))))
      .then(() => Promise.all([...EMO, ...PHOTOS].map(url =>
        cache.add(new Request(url, { cache: 'reload' })).catch(() => {})))))
    .then(() => self.skipWaiting())
));
self.addEventListener('activate', event => event.waitUntil(
  caches.keys().then(keys => Promise.all(keys
    .filter(k => k !== CACHE && k !== 'mathe-abenteuer-save' && k !== 'mathe-abenteuer-grade-1-save' &&
      k !== 'mathe-abenteuer-grade-2-save' && k !== 'mathe-abenteuer-grade-3-save')
    .map(k => caches.delete(k)))).then(() => self.clients.claim())
));
self.addEventListener('fetch', event => {
  const req = event.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const key = url.origin + url.pathname;
    const hit = await cache.match(key);
    // Reuse large assets immediately; refresh app code when online.
    if (hit && /\/(img|fonts)\/|three\.min\.js$/.test(url.pathname)) return hit;
    try {
      const response = await Promise.race([
        fetch(url.href, { cache: 'no-cache', credentials: 'same-origin' }),
        new Promise((_, reject) => setTimeout(reject, hit ? 2500 : 15000))
      ]);
      if (response && response.ok) cache.put(key, response.clone());
      return response;
    } catch (error) {
      return hit || (req.mode === 'navigate'
        ? cache.match(url.origin + url.pathname.replace(/[^/]*$/, '') + 'index.html')
        : Response.error());
    }
  })());
});
