'use strict';
/* Service Worker: speichert das ganze Spiel auf dem Gerät, damit es ohne Netz läuft.
   Die Bilderliste wird aus den Spieldaten berechnet – neue Figuren, Sticker und Tiere sind automatisch dabei.
   Nach Änderungen am Spiel V hochzählen. */
importScripts('tasks.js', 'tasks2.js', 'story.js', 'story2.js');
const V = 'v14', CACHE = 'mathe-abenteuer-' + V;
const CORE = ['./', 'index.html', 'style.css', 'game.js', 'tasks.js', 'tasks2.js', 'story.js', 'story2.js', 'world3d.js', 'three.min.js', 'manifest.json', 'fonts/fredoka.woff2', 'fonts/nunito.woff2'];
const EMO = [...new Set(['compass', 'glowing_star', ...Object.values(ACT).map(a => a[0]), ...HEROES.map(h => h[0]), ...STICKERS.map(s => s[0]), ...ICONS])].map(f => 'img/e/' + f + '.png');
const PHOTOS = Object.keys(ANIMALS).map(k => 'img/' + k + '.jpg');
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => Promise.all([...CORE, ...EMO, ...PHOTOS].map(u => c.add(new Request(u, { cache: 'reload' })).catch(() => {})))).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k !== 'mathe-abenteuer-save').map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith((async () => {
    const c = await caches.open(CACHE), key = url.origin + url.pathname, hit = await c.match(key);
    if (hit && /\/(img|fonts)\/|three\.min\.js$/.test(url.pathname)) return hit; // Bilder: sofort aus dem Speicher
    try { // Code: erst Netz (höchstens 2,5 s warten), sonst Speicher
      const res = await Promise.race([fetch(url.href, { cache: 'no-cache', credentials: 'same-origin' }), new Promise((_, no) => setTimeout(no, hit ? 2500 : 15000))]);
      if (res && res.ok) c.put(key, res.clone());
      return res;
    } catch (err) {
      return hit || (req.mode === 'navigate' ? c.match(url.origin + url.pathname.replace(/[^/]*$/, '') + 'index.html') : Response.error());
    }
  })());
});
