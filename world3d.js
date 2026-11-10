'use strict';
/* 3D-Welten mit three.js: prozedurale Low-Poly-Landschaften, Figuren als Sprites */
const W3 = (() => {
  let R, scene, cam, canvas, ok = false, clock, hemi, sun, sky, cur = null;
  const envs = {}, actors = [], bursts = [];
  let talkId = null, dolly = 0, lookX = 0, variant = 0, dist = 9;
  let seed = 7; const rr = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const R2 = (a, b) => a + rr() * (b - a);
  const mat = (c, o = {}) => new THREE.MeshPhongMaterial(Object.assign({ color: c, flatShading: true, shininess: 0 }, o));
  const G = {};
  const geo = () => {
    G.cone = new THREE.ConeGeometry(1, 1, 7); G.cone4 = new THREE.ConeGeometry(1, 1, 5); G.cyl = new THREE.CylinderGeometry(1, 1, 1, 7);
    G.ico = new THREE.IcosahedronGeometry(1, 0); G.ico1 = new THREE.IcosahedronGeometry(1, 1); G.dod = new THREE.DodecahedronGeometry(1, 0);
    G.box = new THREE.BoxGeometry(1, 1, 1); G.sph = new THREE.SphereGeometry(1, 12, 8); G.circ = new THREE.CircleGeometry(1, 40); G.oct = new THREE.OctahedronGeometry(1, 0);
  };
  function m(g, geom, color, x, y, z, sx = 1, sy = sx, sz = sx, o) {
    const me = new THREE.Mesh(geom, typeof color === 'object' ? color : mat(color, o));
    me.position.set(x, y, z); me.scale.set(sx, sy, sz); g.add(me); return me;
  }
  let dotTex;
  function dot() {
    if (dotTex) return dotTex;
    const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
    const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.5, 'rgba(255,255,255,.7)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return (dotTex = new THREE.CanvasTexture(c));
  }
  function points(g, n, color, size, box, opacity = 0.9) {
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { pos[i * 3] = R2(box[0], box[1]); pos[i * 3 + 1] = R2(box[2], box[3]); pos[i * 3 + 2] = R2(box[4], box[5]); }
    const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const p = new THREE.Points(bg, new THREE.PointsMaterial({ color, size, map: dot(), transparent: true, opacity, depthWrite: false, fog: false }));
    p.userData.box = box; g.add(p); return p;
  }
  /* freie Fläche für die Figuren: z > -2.5 und |x| < 8 bleibt leer */
  function spot(xr, z0, z1) { for (;;) { const x = R2(-xr, xr), z = R2(z0, z1); if (z < -3 || Math.abs(x) > 8) return [x, z]; } }
  const ground = (g, c, y = 0) => { const me = m(g, G.circ, c, 0, y, 0, 160, 160, 1); me.rotation.x = -Math.PI / 2; return me; };
  function pine(g, x, z, s, c = 0x1f6b3a) { m(g, G.cyl, 0x6b4423, x, s * 0.5, z, s * 0.16, s, s * 0.16); for (let i = 0; i < 3; i++) m(g, G.cone, c, x, s * (1.3 + i * 0.75), z, s * (1.05 - i * 0.26), s * 1.3, s * (1.05 - i * 0.26)); }
  function roundTree(g, x, z, s, c = 0x3fa34d) { m(g, G.cyl, 0x7a4f2a, x, s * 0.7, z, s * 0.18, s * 1.4, s * 0.18); m(g, G.ico1, c, x, s * 2, z, s * 1.1, s * 1.05, s * 1.1); m(g, G.ico1, c, x + s * 0.6, s * 1.6, z + 0.2, s * 0.7); }
  function acacia(g, x, z, s) { const t = m(g, G.cyl, 0x5c3d1e, x, s * 1.2, z, s * 0.14, s * 2.4, s * 0.14); t.rotation.z = R2(-0.15, 0.15); m(g, G.ico1, 0x7d8f2a, x, s * 2.6, z, s * 1.9, s * 0.38, s * 1.5); m(g, G.ico1, 0x8c9c33, x + s * 0.8, s * 2.9, z, s * 1.1, s * 0.28, s); }
  function palm(g, x, z, s) {
    const grp = new THREE.Group(); grp.position.set(x, 0, z); const lean = R2(-0.25, 0.25); let px = 0, py = 0;
    for (let i = 0; i < 5; i++) { const seg = m(grp, G.cyl, 0x8a6a3b, px, py + s * 0.45, 0, s * (0.2 - i * 0.02), s * 0.95, s * (0.2 - i * 0.02)); seg.rotation.z = -lean * i * 0.5; px += Math.sin(lean * i * 0.5) * s * 0.9; py += s * 0.85; }
    for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2, lf = m(grp, G.cone4, i % 2 ? 0x2f9e44 : 0x37b24d, px + Math.cos(a) * s * 0.9, py + s * 0.1, Math.sin(a) * s * 0.9, s * 0.32, s * 2, s * 0.1); lf.rotation.z = Math.PI / 2 + 0.5; lf.rotation.y = -a; lf.rotation.order = 'YXZ'; }
    m(grp, G.sph, 0x5c3d1e, px + 0.2, py - s * 0.15, 0.2, s * 0.2); g.add(grp); return grp;
  }
  const rock = (g, x, z, s, c = 0x8a8f98) => { const r = m(g, G.dod, c, x, s * 0.45, z, s, s * 0.7, s * 0.9); r.rotation.set(R2(0, 3), R2(0, 3), 0); return r; };
  function cloud(g, x, y, z, s) { const c = new THREE.Group(); c.position.set(x, y, z); const w = mat(0xffffff, { fog: false }); m(c, G.ico1, w, 0, 0, 0, s * 1.6, s, s); m(c, G.ico1, w, s * 1.3, -0.1 * s, 0, s * 1.1, s * 0.8, s * 0.8); m(c, G.ico1, w, -s * 1.3, -0.15 * s, 0, s, s * 0.7, s * 0.8); g.add(c); return c; }
  function flower(g, x, z, c) { m(g, G.cyl, 0x2f9e44, x, 0.2, z, 0.025, 0.4, 0.025); m(g, G.ico, c, x, 0.45, z, 0.13); }
  function mountain(g, x, z, r, h, c = 0x7b8aa3) { m(g, G.cone, c, x, h / 2, z, r, h, r).rotation.y = R2(0, 3); m(g, G.cone, 0xffffff, x, h * 0.86, z, r * 0.3, h * 0.29, r * 0.3).rotation.y = R2(0, 3); }
  function skyDome(top, bottom) {
    const g2 = new THREE.SphereGeometry(300, 24, 16), col = [], p = g2.attributes.position, a = new THREE.Color(top), b = new THREE.Color(bottom), c = new THREE.Color();
    for (let i = 0; i < p.count; i++) { const t = Math.max(0, Math.min(1, p.getY(i) / 170)); c.copy(b).lerp(a, Math.pow(t, 0.6)); col.push(c.r, c.g, c.b); }
    g2.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    return new THREE.Mesh(g2, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }));
  }
  const drift = (list, sp = 0.4) => (t, dt) => list.forEach((c, i) => { c.position.x += dt * sp * (0.6 + i % 3 * 0.3); if (c.position.x > 70) c.position.x = -70; });
  function fall(p, vy, wob) { return (t, dt) => { const a = p.geometry.attributes.position, b = p.userData.box; for (let i = 0; i < a.count; i++) { let y = a.getY(i) + vy * dt * (0.6 + (i % 5) * 0.2); if (y < b[2]) y = b[3]; if (y > b[3]) y = b[2]; a.setY(i, y); a.setX(i, a.getX(i) + Math.sin(t * 1.3 + i) * wob * dt); } a.needsUpdate = true; }; }

  /* ===== Welten ===== */
  const BUILD = {
    home(g, T) {
      ground(g, 0x6cc04a);
      for (let i = 0; i < 7; i++) m(g, G.sph, [0x5fb344, 0x79c95a, 0x54a63d][i % 3], R2(-90, 90), -6, R2(-110, -45), R2(22, 40), R2(10, 16), R2(18, 30));
      for (let i = 0; i < 26; i++) { const [x, z] = spot(42, -42, -5); roundTree(g, x, z, R2(0.9, 1.7), [0x3fa34d, 0x56b85f, 0x2f9e44][i % 3]); }
      for (let i = 0; i < 110; i++) { const [x, z] = spot(16, -14, 3); flower(g, x, z, [0xff6b9d, 0xffd43b, 0xffffff, 0xb197fc, 0xff922b][i % 5]); }
      const cols = [0xff4d4d, 0xff922b, 0xffd43b, 0x51cf66, 0x339af0, 0x7950f2];
      cols.forEach((c, i) => { const t = new THREE.Mesh(new THREE.TorusGeometry(30 - i * 1.1, 0.56, 8, 60, Math.PI), new THREE.MeshBasicMaterial({ color: c, fog: false, transparent: true, opacity: 0.85 })); t.position.set(0, -2, -62); g.add(t); });
      const cl = []; for (let i = 0; i < 9; i++) cl.push(cloud(g, R2(-70, 70), R2(14, 26), R2(-70, -30), R2(2, 4)));
      const bf = points(g, 40, 0xffe066, 0.28, [-12, 12, 0.5, 4, -10, 2]);
      T.push(drift(cl), fall(bf, 0.25, 1.2));
      return { sky: [0x3d9bff, 0xd4f1ff], fog: [0xd4f1ff, 50, 240], sun: [0xfff4d6, 0.9], hemi: [0xcfe9ff, 0x6cc04a, 0.75] };
    },
    wald(g, T) {
      ground(g, 0x2f6b2f);
      for (let i = 0; i < 120; i++) { const [x, z] = spot(46, -60, 2); pine(g, x, z, R2(1.3, 2.6), [0x1f6b3a, 0x237a41, 0x1a5c33, 0x2c8a4b][i % 4]); }
      for (let i = 0; i < 18; i++) { const [x, z] = spot(12, -9, 3); m(g, G.cyl, 0xf8f0e3, x, 0.18, z, 0.07, 0.36, 0.07); m(g, G.sph, 0xe03131, x, 0.4, z, 0.24, 0.16, 0.24); }
      for (let i = 0; i < 14; i++) { const [x, z] = spot(14, -12, 3); rock(g, x, z, R2(0.3, 0.8), 0x6b7566); }
      for (let i = 0; i < 40; i++) { const [x, z] = spot(14, -10, 3); m(g, G.ico, 0x2b8a3e, x, 0.25, z, R2(0.3, 0.6), 0.3, R2(0.3, 0.6)); }
      const ff = points(g, 70, 0xfff3a0, 0.3, [-14, 14, 0.4, 5, -16, 3]);
      T.push(fall(ff, 0.3, 1.5), t => { ff.material.opacity = 0.55 + Math.sin(t * 3) * 0.35; });
      return { sky: [0x2b7a4b, 0xbfe8b0], fog: [0x9fd3a0, 14, 70], sun: [0xfff1c2, 0.8], hemi: [0xbfe8b0, 0x234d23, 0.7] };
    },
    savanne(g, T) {
      ground(g, 0xd9a441);
      for (let i = 0; i < 8; i++) m(g, G.sph, 0xb8823a, R2(-120, 120), -5, R2(-130, -70), R2(25, 45), R2(9, 15), R2(20, 30));
      for (let i = 0; i < 16; i++) { const [x, z] = spot(50, -55, -4); acacia(g, x, z, R2(1.4, 2.4)); }
      for (let i = 0; i < 16; i++) { const [x, z] = spot(30, -30, 3); rock(g, x, z, R2(0.4, 1.3), 0xa3876a); }
      for (let i = 0; i < 160; i++) { const [x, z] = spot(22, -25, 3); m(g, G.cone4, [0xe6c35c, 0xc9a13b][i % 2], x, 0.3, z, 0.1, R2(0.4, 0.9), 0.1).rotation.z = R2(-0.2, 0.2); }
      m(g, G.sph, new THREE.MeshBasicMaterial({ color: 0xfff0b3, fog: false }), -40, 26, -200, 22);
      const birds = points(g, 12, 0x3d2b1f, 0.5, [-40, 40, 12, 20, -60, -30]);
      T.push((t, dt) => { birds.position.x = Math.sin(t * 0.1) * 20; });
      return { sky: [0xff8c42, 0xffe3a8], fog: [0xffdca0, 40, 220], sun: [0xffd08a, 1.0], hemi: [0xffe3a8, 0xc98f3a, 0.75] };
    },
    eis(g, T) {
      const water = ground(g, mat(0x2a8fcf, { shininess: 60, flatShading: false }), -0.35);
      m(g, G.cyl, 0xf4fbff, 0, -0.35, -1.5, 12, 0.7, 6); m(g, G.cyl, 0xdcefff, 0, -0.5, -1.5, 12.6, 0.5, 6.5);
      const floes = []; for (let i = 0; i < 22; i++) { const [x, z] = spot(48, -50, -9); floes.push(m(g, G.cyl, 0xf4fbff, x, -0.25, z, R2(1.5, 4), 0.35, R2(1.2, 3))); }
      for (let i = 0; i < 14; i++) { const x = R2(-70, 70), z = R2(-90, -24), s = R2(3, 9); m(g, G.cone4, [0xe8f6ff, 0xcfeaff, 0xffffff][i % 3], x, s * 0.9, z, s, s * 2, s * 0.8).rotation.y = R2(0, 3); m(g, G.dod, 0xdff1ff, x + s * 0.8, s * 0.3, z + 1, s * 0.7); }
      for (let i = 0; i < 9; i++) { const [x, z] = spot(11, -5, -3); m(g, G.cone4, 0xcfeaff, x, 0.5, z, 0.35, R2(0.8, 1.6), 0.35); }
      const sn = points(g, 380, 0xffffff, 0.22, [-22, 22, 0, 14, -24, 6]);
      T.push(fall(sn, -1.3, 0.8), t => { floes.forEach((f, i) => { f.position.y = -0.25 + Math.sin(t * 0.9 + i) * 0.08; }); water.position.y = -0.35 + Math.sin(t * 0.7) * 0.03; });
      return { sky: [0x5aaeff, 0xeef9ff], fog: [0xe3f4ff, 26, 150], sun: [0xffffff, 0.85], hemi: [0xeef9ff, 0x9fd0f5, 0.85] };
    },
    ozean(g, T) {
      ground(g, 0xcdb67c, -0.2);
      const cc = [0xff6b9d, 0xff922b, 0xb197fc, 0xff5c5c, 0xffd43b, 0xf783ac, 0x66d9e8];
      for (let i = 0; i < 90; i++) {
        const [x, z] = spot(26, -30, 2), c = cc[i % cc.length], s = R2(0.5, 1.4);
        if (i % 3 === 0) { m(g, G.ico1, c, x, s * 0.5, z, s, s * 0.75, s); }
        else if (i % 3 === 1) { for (let k = 0; k < 5; k++) { const b = m(g, G.cyl, c, x + R2(-0.4, 0.4) * s, s * 0.8, z + R2(-0.3, 0.3) * s, s * 0.11, s * R2(1.2, 2), s * 0.11); b.rotation.z = R2(-0.5, 0.5); b.rotation.x = R2(-0.4, 0.4); } }
        else { m(g, G.cyl, c, x, s * 0.4, z, s * 0.9, s * 0.12, s * 0.9); m(g, G.cyl, c, x, s * 0.2, z, s * 0.15, s * 0.4, s * 0.15); }
      }
      const weed = []; for (let i = 0; i < 60; i++) { const [x, z] = spot(24, -26, 3), h = R2(1.5, 4.5); const w = m(g, G.cone4, [0x2f9e44, 0x37b24d, 0x20c997][i % 3], x, h / 2 - 0.2, z, 0.14, h, 0.06); weed.push(w); }
      for (let i = 0; i < 7; i++) { const [x, z] = spot(26, -30, -6); rock(g, x, z, R2(0.6, 2), 0x5c7c8a); }
      const fish = []; for (let i = 0; i < 26; i++) { const f = m(g, G.cone4, [0xffa94d, 0xffe066, 0xff8787, 0x74c0fc][i % 4], 0, 0, 0, 0.14, 0.5, 0.07); f.rotation.z = -Math.PI / 2; f.userData = { r: R2(7, 20), y: R2(2.5, 8), sp: R2(0.15, 0.4) * (i % 2 ? 1 : -1), ph: R2(0, 6.28), z: R2(-18, -6) }; fish.push(f); }
      const bub = points(g, 160, 0xdff6ff, 0.2, [-20, 20, 0, 12, -22, 4], 0.7);
      for (let i = 0; i < 7; i++) { const ray = m(g, G.cone4, new THREE.MeshBasicMaterial({ color: 0xbff3ff, transparent: true, opacity: 0.09, fog: false, depthWrite: false }), R2(-25, 25), 12, R2(-30, -8), 2.5, 30, 2.5); ray.rotation.z = 0.25; }
      T.push(fall(bub, 1.1, 0.5), t => { weed.forEach((w, i) => { w.rotation.z = Math.sin(t * 1.2 + i) * 0.2; }); fish.forEach(f => { const u = f.userData, a = t * u.sp + u.ph; f.position.set(Math.cos(a) * u.r, u.y + Math.sin(a * 3) * 0.3, u.z + Math.sin(a) * 4); f.rotation.y = u.sp > 0 ? Math.PI : 0; }); });
      return { sky: [0x0b5fa5, 0x38c4e0], fog: [0x1f9ccc, 9, 55], sun: [0xc9f4ff, 0.7], hemi: [0x9be7ff, 0x2a6f97, 0.95] };
    },
    dschungel(g, T) {
      ground(g, 0x3d8b37);
      for (let i = 0; i < 38; i++) { const [x, z] = spot(40, -45, 1); palm(g, x, z, R2(1.1, 1.9)); }
      for (let i = 0; i < 70; i++) { const [x, z] = spot(34, -40, 3), s = R2(0.6, 1.8); m(g, G.ico1, [0x2b8a3e, 0x2f9e44, 0x1e7a34, 0x40c057][i % 4], x, s * 0.5, z, s, s * 0.7, s); }
      for (let i = 0; i < 30; i++) { const [x, z] = spot(14, -10, 3); flower(g, x, z, [0xff6b6b, 0xffa94d, 0xf06595][i % 3]); }
      for (let i = 0; i < 6; i++) m(g, G.box, [0xb8a888, 0xa89878][i % 2], 9, 0.6 + i * 1.2, -24, 14 - i * 2.2, 1.2, 14 - i * 2.2);
      m(g, G.box, 0x3b2f2f, 9, 1.6, -16.9, 2, 3.2, 0.3); m(g, G.box, 0xd9c89e, 9, 8.2, -24, 2.6, 1.6, 2.6);
      m(g, G.box, 0x6b7280, -16, 6, -30, 12, 12, 5); const wf = m(g, G.box, new THREE.MeshBasicMaterial({ color: 0xbfeaff, transparent: true, opacity: 0.85 }), -16, 6, -27.3, 3.2, 12, 0.2);
      m(g, G.cyl, mat(0x4dabf7, { shininess: 80 }), -16, 0.03, -23, 6, 0.06, 4);
      const pol = points(g, 60, 0xd8f5a2, 0.22, [-14, 14, 0.5, 6, -14, 3]);
      const mist = points(g, 50, 0xffffff, 0.6, [-19, -13, 0, 2.5, -26, -22], 0.5);
      T.push(fall(pol, 0.2, 1.2), fall(mist, 0.8, 0.6), t => { wf.material.opacity = 0.75 + Math.sin(t * 9) * 0.1; });
      return { sky: [0x1f9d6b, 0xd3f9c8], fog: [0xa9e6a0, 14, 80], sun: [0xfff3bf, 0.85], hemi: [0xd3f9c8, 0x2b6e2b, 0.75] };
    },
    berge(g, T) {
      ground(g, 0x7cc36a);
      for (let i = 0; i < 13; i++) mountain(g, -110 + i * 18 + R2(-5, 5), R2(-110, -70), R2(18, 28), R2(28, 52), [0x7b8aa3, 0x8b97ad, 0x6c7a93][i % 3]);
      for (let i = 0; i < 7; i++) mountain(g, R2(-70, 70), R2(-60, -42), R2(9, 14), R2(14, 22), 0x8da07a);
      for (let i = 0; i < 46; i++) { const [x, z] = spot(44, -40, 0); pine(g, x, z, R2(1, 1.9), [0x2b6f4a, 0x23643f][i % 2]); }
      for (let i = 0; i < 22; i++) { const [x, z] = spot(26, -26, 3); rock(g, x, z, R2(0.4, 1.6)); }
      for (let i = 0; i < 70; i++) { const [x, z] = spot(15, -12, 3); flower(g, x, z, [0xffffff, 0x74c0fc, 0xffd43b, 0xf783ac][i % 4]); }
      m(g, G.cyl, mat(0x4dabf7, { shininess: 90, flatShading: false }), -11, 0.03, -15, 8, 0.06, 4.5);
      const cl = []; for (let i = 0; i < 8; i++) cl.push(cloud(g, R2(-70, 70), R2(16, 30), R2(-75, -35), R2(2.5, 5)));
      T.push(drift(cl, 0.6));
      return { sky: [0x2f86e0, 0xdcf0ff], fog: [0xdcf0ff, 60, 260], sun: [0xffffff, 0.95], hemi: [0xdcf0ff, 0x6aa85a, 0.75] };
    },
    insel(g, T) {
      const water = ground(g, mat(0x0f9fc0, { shininess: 25, flatShading: false }), -0.3);
      m(g, G.sph, 0xe3c684, 0, -3.1, -4, 17, 3.2, 12); m(g, G.sph, 0x8fd16a, -2, -2.4, -11, 10, 3, 6);
      for (let i = 0; i < 11; i++) palm(g, R2(-13, 13), R2(-13, -4.5), R2(1.2, 2));
      for (let i = 0; i < 9; i++) { const [x, z] = spot(13, -9, 2); rock(g, x, z, R2(0.3, 0.8), 0x9a9287); }
      for (let i = 0; i < 12; i++) { const [x, z] = spot(11, -6, 3); m(g, G.cone4, [0xff8787, 0xffc078, 0xffffff][i % 3], x, 0.1, z, 0.18, 0.12, 0.18); }
      for (let i = 0; i < 5; i++) { const x = R2(-110, 110), z = R2(-150, -70); m(g, G.sph, 0xe9d59a, x, -2, z, R2(8, 16), 3, R2(6, 10)); palm(g, x, z, 2.4); }
      const boat = new THREE.Group(); m(boat, G.box, 0x8a4f2a, 0, 0.3, 0, 3.4, 0.7, 1.2); m(boat, G.cyl, 0x5c3d1e, 0, 2.2, 0, 0.07, 3.6, 0.07);
      const sail = m(boat, G.cone4, mat(0xffffff, { side: THREE.DoubleSide }), 0.75, 2.3, 0, 1.3, 3, 0.05); sail.rotation.y = 0.3; boat.position.set(-17, -0.2, -24); g.add(boat);
      m(g, G.sph, new THREE.MeshBasicMaterial({ color: 0xfff7c2, fog: false }), 50, 55, -210, 14);
      const cl = []; for (let i = 0; i < 7; i++) cl.push(cloud(g, R2(-80, 80), R2(18, 30), R2(-90, -45), R2(3, 5)));
      const sp = points(g, 50, 0xffffff, 0.25, [-40, 40, -0.2, 0, -50, -14], 0.8);
      T.push(drift(cl, 0.5), t => { boat.position.y = -0.2 + Math.sin(t * 1.2) * 0.12; boat.rotation.z = Math.sin(t * 0.9) * 0.05; boat.position.x = -17 + Math.sin(t * 0.08) * 8; water.position.y = -0.3 + Math.sin(t * 0.8) * 0.04; sp.material.opacity = 0.4 + Math.sin(t * 2) * 0.3; });
      return { sky: [0x1c9bff, 0xcdf3ff], fog: [0xcdf3ff, 60, 260], sun: [0xfff6d6, 1.0], hemi: [0xcdf3ff, 0xe9d59a, 0.8] };
    },
    markt(g, T) {
      ground(g, 0xd8c3a0);
      const roof = new THREE.ConeGeometry(1, 1, 4);
      for (let i = 0; i < 16; i++) { const x = -52 + i * 7 + R2(-1, 1), z = R2(-34, -22), w = R2(4, 6), h = R2(4, 8), c = [0xf4e3c1, 0xf7c8a0, 0xe9d8f0, 0xcfe8d5, 0xfbe6a2][i % 5]; m(g, G.box, c, x, h / 2, z, w, h, w); const r = m(g, roof, [0xb5482f, 0x8f3a26, 0xa85b32][i % 3], x, h + 1.4, z, w * 0.85, 2.8, w * 0.85); r.rotation.y = Math.PI / 4; m(g, G.box, 0x6b4423, x, 1, z + w / 2 + 0.02, 0.9, 2, 0.1); m(g, G.box, 0x9fd3f5, x + 1.2, h * 0.65, z + w / 2 + 0.02, 0.9, 0.9, 0.1); }
      m(g, G.box, 0xe8dcc0, 14, 9, -30, 5, 18, 5); const tr = m(g, roof, 0x8f3a26, 14, 21, -30, 4.6, 6, 4.6); tr.rotation.y = Math.PI / 4; m(g, G.cyl, 0xffffff, 14, 14, -27.4, 1.3, 0.2, 1.3).rotation.x = Math.PI / 2;
      const aw = [0xe03131, 0x1c7ed6, 0x2f9e44, 0xf08c00, 0xae3ec9];
      for (let i = 0; i < 9; i++) { const [x, z] = spot(20, -16, -4); m(g, G.box, 0x8a5a2b, x, 0.6, z, 2.6, 1.2, 1.4); for (let k = 0; k < 4; k++) m(g, G.box, k % 2 ? 0xffffff : aw[i % 5], x - 0.98 + k * 0.65, 2.5, z, 0.65, 0.12, 1.8).rotation.x = 0.25; m(g, G.cyl, 0x5c3d1e, x - 1.2, 1.3, z - 0.6, 0.06, 2.6, 0.06); m(g, G.cyl, 0x5c3d1e, x + 1.2, 1.3, z - 0.6, 0.06, 2.6, 0.06); for (let k = 0; k < 5; k++) m(g, G.sph, [0xe03131, 0xffd43b, 0x74b816, 0xff922b][(i + k) % 4], x - 0.9 + k * 0.45, 1.35, z + 0.2, 0.2); }
      m(g, G.cyl, 0xb9c0c9, -12, 0.4, -12, 2.6, 0.8, 2.6); m(g, G.cyl, mat(0x4dabf7, { shininess: 80 }), -12, 0.75, -12, 2.2, 0.2, 2.2); m(g, G.cyl, 0xb9c0c9, -12, 1.4, -12, 0.3, 2, 0.3); m(g, G.sph, 0xb9c0c9, -12, 2.5, -12, 0.6, 0.3, 0.6);
      for (let i = 0; i < 6; i++) { const [x, z] = spot(30, -20, -6); roundTree(g, x, z, R2(0.9, 1.3)); }
      const fl = points(g, 60, 0xff6b6b, 0.35, [-24, 24, 5.5, 6.5, -18, -8]); const fl2 = points(g, 60, 0x4dabf7, 0.35, [-24, 24, 5.2, 6.2, -17, -7]);
      const spray = points(g, 40, 0xdff6ff, 0.18, [-13, -11, 1, 3, -13, -11], 0.8);
      const cl = []; for (let i = 0; i < 7; i++) cl.push(cloud(g, R2(-70, 70), R2(20, 30), R2(-80, -40), R2(2.5, 4)));
      T.push(drift(cl, 0.5), fall(spray, -1.6, 0.3), t => { fl.position.y = Math.sin(t * 2) * 0.12; fl2.position.y = Math.cos(t * 2.3) * 0.12; });
      return { sky: [0x3d9bff, 0xffeccc], fog: [0xffeccc, 45, 200], sun: [0xfff0c8, 0.95], hemi: [0xdff0ff, 0xcbb089, 0.8] };
    },
    wiese(g, T) {
      ground(g, 0x7fd15a);
      for (let i = 0; i < 9; i++) m(g, G.sph, [0x6cc04a, 0x8ad96a, 0x5fb344][i % 3], R2(-100, 100), -7, R2(-120, -50), R2(24, 44), R2(11, 17), R2(18, 30));
      for (let i = 0; i < 380; i++) { const [x, z] = spot(26, -30, 3); flower(g, x, z, [0xff6b9d, 0xffd43b, 0xffffff, 0xb197fc, 0xff922b, 0xff5c5c, 0x74c0fc][i % 7]); }
      const sun = []; for (let i = 0; i < 26; i++) { const [x, z] = spot(22, -20, -4), h = R2(1.6, 2.8); const st = new THREE.Group(); st.position.set(x, 0, z); m(st, G.cyl, 0x2f9e44, 0, h / 2, 0, 0.06, h, 0.06); m(st, G.cyl, 0xffd43b, 0, h, 0.05, 0.5, 0.08, 0.5).rotation.x = Math.PI / 2; m(st, G.cyl, 0x5c3d1e, 0, h, 0.1, 0.22, 0.1, 0.22).rotation.x = Math.PI / 2; g.add(st); sun.push(st); }
      for (let i = 0; i < 7; i++) { const [x, z] = spot(18, -16, -5); m(g, G.box, 0x8a5a2b, x, 0.35, z, 1.5, 0.7, 1.5); for (let k = 0; k < 4; k++) m(g, G.cyl, k % 2 ? 0xf5b93a : 0xf0a020, x, 0.95 + k * 0.42, z, 0.95 - k * 0.14, 0.42, 0.95 - k * 0.14); m(g, G.cyl, 0x3b2a14, x, 1.05, z + 0.86, 0.16, 0.05, 0.16).rotation.x = Math.PI / 2; }
      for (let i = 0; i < 12; i++) { const [x, z] = spot(44, -46, -10); roundTree(g, x, z, R2(1.2, 2.2), [0x3fa34d, 0x56b85f][i % 2]); }
      const bees = []; for (let i = 0; i < 34; i++) { const b = m(g, G.sph, i % 2 ? 0xffd43b : 0x3b2a14, 0, 0, 0, 0.11, 0.09, 0.09); b.userData = { cx: R2(-14, 14), cz: R2(-14, 0), r: R2(0.6, 3), y: R2(1, 4.5), sp: R2(1, 2.6) * (i % 2 ? 1 : -1), ph: R2(0, 6.28) }; bees.push(b); }
      const pol = points(g, 70, 0xfff3a0, 0.2, [-16, 16, 0.4, 5, -16, 3]);
      const cl = []; for (let i = 0; i < 9; i++) cl.push(cloud(g, R2(-70, 70), R2(15, 27), R2(-75, -32), R2(2, 4.5)));
      T.push(drift(cl, 0.45), fall(pol, 0.25, 1.4), t => { sun.forEach((s2, i) => { s2.rotation.z = Math.sin(t * 1.1 + i) * 0.07; }); bees.forEach(b => { const u = b.userData, a = t * u.sp + u.ph; b.position.set(u.cx + Math.cos(a) * u.r, u.y + Math.sin(a * 2.7) * 0.4, u.cz + Math.sin(a) * u.r); }); });
      return { sky: [0x4aa8ff, 0xe2f7ff], fog: [0xe2f7ff, 50, 230], sun: [0xfff6d0, 0.95], hemi: [0xdff5ff, 0x7fd15a, 0.8] };
    },
    piraten(g, T) {
      const water = ground(g, mat(0x1286a8, { shininess: 30, flatShading: false }), -0.3);
      m(g, G.sph, 0xe6cc8f, 0, -3.1, -3, 19, 3.2, 11);
      for (let i = 0; i < 9; i++) palm(g, R2(-15, 15), R2(-11, -4.5), R2(1.2, 2));
      for (let i = 0; i < 10; i++) { const x = R2(-60, 60), z = R2(-70, -30), s = R2(3, 8); m(g, G.dod, [0x6b7280, 0x545b66][i % 2], x, s * 0.5, z, s, s * 1.5, s * 0.9).rotation.y = R2(0, 3); }
      const ship = new THREE.Group(); m(ship, G.box, 0x6b3f1d, 0, 1, 0, 9, 2, 2.8); m(ship, G.box, 0x8a5a2b, -3.6, 2.6, 0, 2, 1.4, 2.8); m(ship, G.box, 0x8a5a2b, 3.8, 2.3, 0, 1.6, 0.8, 2.6); m(ship, G.cone4, 0x6b3f1d, 5.6, 1.3, 0, 1.3, 2.6, 1.3).rotation.z = -Math.PI / 2;
      [[-1.5, 9], [2, 7]].forEach(([x, h]) => { m(ship, G.cyl, 0x4a2f14, x, 2 + h / 2, 0, 0.12, h, 0.12); m(ship, G.box, mat(0xf5efe0, { side: THREE.DoubleSide }), x, 2 + h * 0.6, 0.15, 3.6, h * 0.5, 0.08); m(ship, G.box, mat(0xf5efe0, { side: THREE.DoubleSide }), x, 2 + h * 0.2, 0.15, 4.2, h * 0.22, 0.08); });
      const flag = m(ship, G.box, 0x111111, -0.9, 11.4, 0, 1.3, 0.8, 0.04); ship.position.set(-15, -0.5, -22); ship.rotation.y = 0.35; g.add(ship);
      const chest = new THREE.Group(); m(chest, G.box, 0x7a4a1c, 0, 0.35, 0, 1.3, 0.7, 0.9); m(chest, G.cyl, 0x8a5a2b, 0, 0.7, 0, 0.45, 1.3, 0.45).rotation.z = Math.PI / 2; m(chest, G.box, 0xffd43b, 0, 0.5, 0.46, 0.25, 0.3, 0.05); chest.position.set(10.5, 0, -6); chest.rotation.y = -0.5; g.add(chest);
      for (let i = 0; i < 14; i++) m(g, G.cyl, mat(0xffd43b, { shininess: 90 }), 10.5 + R2(-1.6, 1.6), 0.05, -6 + R2(-0.4, 1.4), 0.13, 0.04, 0.13);
      for (let i = 0; i < 5; i++) { const [x, z] = spot(12, -8, -4); m(g, G.cyl, 0x8a5a2b, x, 0.5, z, 0.42, 1, 0.42); m(g, G.cyl, 0x3b2a14, x, 0.5, z, 0.44, 0.1, 0.44); }
      const gulls = []; for (let i = 0; i < 9; i++) { const b = m(g, G.cone4, 0xffffff, 0, 0, 0, 0.5, 0.12, 0.12); b.userData = { r: R2(10, 30), y: R2(9, 16), sp: R2(0.2, 0.45), ph: R2(0, 6.28) }; gulls.push(b); }
      m(g, G.sph, new THREE.MeshBasicMaterial({ color: 0xffd9a0, fog: false }), 40, 20, -220, 20);
      const cl = []; for (let i = 0; i < 6; i++) cl.push(cloud(g, R2(-80, 80), R2(18, 30), R2(-90, -45), R2(3, 5)));
      const sp = points(g, 60, 0xffffff, 0.25, [-40, 40, -0.2, 0, -50, -14], 0.8);
      T.push(drift(cl, 0.5), t => { ship.position.y = -0.5 + Math.sin(t * 1.1) * 0.18; ship.rotation.z = Math.sin(t * 0.8) * 0.04; flag.rotation.y = Math.sin(t * 5) * 0.4; water.position.y = -0.3 + Math.sin(t * 0.8) * 0.04; sp.material.opacity = 0.4 + Math.sin(t * 2) * 0.3; gulls.forEach(b => { const u = b.userData, a = t * u.sp + u.ph; b.position.set(Math.cos(a) * u.r, u.y + Math.sin(a * 4) * 0.4, -24 + Math.sin(a) * 10); b.rotation.y = -a; b.scale.y = 0.12 + Math.abs(Math.sin(t * 6 + u.ph)) * 0.25; }); });
      return { sky: [0x2a7fd6, 0xffe2b8], fog: [0xffe2b8, 55, 250], sun: [0xffe0b0, 1.0], hemi: [0xd6ecff, 0xe6cc8f, 0.8] };
    },
    zucker(g, T) {
      ground(g, 0xffd0e4);
      for (let i = 0; i < 8; i++) { const x = R2(-90, 90), z = R2(-110, -55), s = R2(12, 22); m(g, G.cone, [0xf7a8c4, 0xfde2a7, 0xc9a7f5, 0xa7e3f5][i % 4], x, s * 0.5, z, s, s, s); m(g, G.sph, 0xffffff, x, s * 0.98, z, s * 0.36, s * 0.22, s * 0.36); m(g, G.sph, 0xe03131, x, s * 1.22, z, s * 0.1); }
      const cc = [0xff6b9d, 0x74c0fc, 0xffd43b, 0x8ce99a, 0xb197fc, 0xff922b]; const lol = [];
      for (let i = 0; i < 34; i++) { const [x, z] = spot(34, -36, 0), h = R2(1.6, 4.2); m(g, G.cyl, 0xffffff, x, h / 2, z, 0.07, h, 0.07); const d = m(g, G.cyl, cc[i % 6], x, h + 0.5, z, 0.75, 0.2, 0.75); d.rotation.x = Math.PI / 2; const d2 = m(g, G.cyl, 0xffffff, x, h + 0.5, z + 0.02, 0.4, 0.22, 0.4); d2.rotation.x = Math.PI / 2; lol.push(d, d2); }
      for (let i = 0; i < 12; i++) { const [x, z] = spot(26, -26, -3); for (let k = 0; k < 7; k++) m(g, G.cyl, k % 2 ? 0xffffff : 0xe03131, x, 0.2 + k * 0.4, z, 0.16, 0.4, 0.16); const hk = m(g, new THREE.TorusGeometry(0.4, 0.16, 6, 10, Math.PI), 0xe03131, x + 0.4, 3, z); hk.rotation.y = 0; }
      for (let i = 0; i < 16; i++) { const [x, z] = spot(18, -16, 3), s = R2(0.35, 0.7); m(g, G.cyl, [0xf7c59f, 0xd9a066][i % 2], x, s * 0.35, z, s * 0.5, s * 0.7, s * 0.38); m(g, G.sph, cc[i % 6], x, s * 0.85, z, s * 0.55, s * 0.4, s * 0.55); m(g, G.sph, 0xe03131, x, s * 1.3, z, s * 0.14); }
      const roof = new THREE.ConeGeometry(1, 1, 4); m(g, G.box, 0xc98a4b, 12, 2.5, -20, 7, 5, 6); const r = m(g, roof, 0xffffff, 12, 6.6, -20, 6, 3.4, 5.4); r.rotation.y = Math.PI / 4; m(g, G.box, 0x7a4a1c, 12, 1.3, -16.95, 1.4, 2.6, 0.1); for (let k = 0; k < 6; k++) m(g, G.sph, cc[k], 9.4 + k, 4.4, -16.9, 0.28);
      for (let i = 0; i < 6; i++) { const [x, z] = spot(22, -20, -4); const t2 = m(g, new THREE.TorusGeometry(0.7, 0.32, 8, 14), [0xd9a066, 0xff8fb8][i % 2], x, 0.34, z); t2.rotation.x = Math.PI / 2; }
      const spr = points(g, 120, 0xffffff, 0.2, [-18, 18, 0, 10, -18, 4], 0.85); const spr2 = points(g, 80, 0xff6b9d, 0.2, [-18, 18, 0, 10, -18, 4], 0.85);
      const cl = []; for (let i = 0; i < 9; i++) { const c = cloud(g, R2(-70, 70), R2(14, 26), R2(-70, -30), R2(2, 4)); c.children.forEach(ch => { ch.material = mat(0xffc9e0, { fog: false }); }); cl.push(c); }
      T.push(drift(cl, 0.4), fall(spr, -0.7, 0.6), fall(spr2, -0.5, 0.8), t => { lol.forEach((d, i) => { d.rotation.z = t * 0.6 + i; }); });
      return { sky: [0xff8ec7, 0xfff0f7], fog: [0xfff0f7, 40, 200], sun: [0xfff3e0, 0.9], hemi: [0xffe9f3, 0xf7a8c4, 0.85] };
    },
    schloss(g, T) {
      ground(g, 0x6fc160);
      const st = 0xe9e4f5, rf = 0x7048c8, cs = new THREE.Group();
      m(cs, G.box, st, 0, 6, 0, 22, 12, 9); m(cs, G.box, st, 0, 15, 0, 9, 8, 7); for (let i = 0; i < 9; i++) m(cs, G.box, st, -10 + i * 2.5, 12.6, 4.2, 1.3, 1.2, 0.8);
      [[-12, 16], [12, 16], [-4.6, 24], [4.6, 24]].forEach(([x, h]) => { m(cs, G.cyl, st, x, h / 2, 1, 2.4, h, 2.4); m(cs, G.cone, rf, x, h + 2.6, 1, 3, 5.2, 3); m(cs, G.box, 0xff6b9d, x + 0.6, h + 6, 1, 1.2, 0.7, 0.05); m(cs, G.cyl, 0x4a3a2a, x, h + 5.6, 1, 0.06, 1.6, 0.06); });
      m(cs, G.box, 0x5a3a8a, 0, 2.6, 4.55, 3.4, 5.2, 0.2); for (let i = 0; i < 6; i++) m(cs, G.box, 0x9fd3f5, -8.5 + i * 3.4, 8, 4.55, 1.1, 1.8, 0.1); cs.position.set(0, 0, -44); g.add(cs);
      for (let i = 0; i < 2; i++) for (let k = 0; k < 7; k++) { const x = (i ? 1 : -1) * 10.5, z = -6 - k * 4.6; m(g, G.box, 0x2b8a3e, x, 0.7, z, 1.6, 1.4, 3.6); m(g, G.cone, 0x2f9e44, x, 2.7, z, 0.9, 2.6, 0.9); }
      for (let i = 0; i < 46; i++) { const [x, z] = spot(30, -30, 1); m(g, G.ico1, 0x2b8a3e, x, 0.45, z, 0.7, 0.55, 0.7); for (let k = 0; k < 5; k++) m(g, G.ico, [0xe03131, 0xff6b9d, 0xffffff, 0xffd43b][i % 4], x + R2(-0.5, 0.5), 0.75 + R2(0, 0.3), z + R2(-0.5, 0.5), 0.14); }
      m(g, G.cyl, 0xcfd4dc, 0, 0.35, -15, 3, 0.7, 3); m(g, G.cyl, mat(0x4dabf7, { shininess: 80 }), 0, 0.68, -15, 2.6, 0.12, 2.6); m(g, G.cyl, 0xcfd4dc, 0, 1.5, -15, 0.35, 2.4, 0.35); m(g, G.cyl, 0xcfd4dc, 0, 2.6, -15, 1.2, 0.2, 1.2);
      m(g, G.cyl, mat(0x4dabf7, { shininess: 90, flatShading: false }), -19, 0.03, -14, 6, 0.06, 4);
      for (let i = 0; i < 22; i++) { const [x, z] = spot(48, -40, -8); roundTree(g, x, z, R2(1.2, 2.1), [0x3fa34d, 0x2f9e44][i % 2]); }
      const spray = points(g, 70, 0xe8f7ff, 0.2, [-1.6, 1.6, 1, 4.2, -16.5, -13.5], 0.85); const pet = points(g, 50, 0xffc9de, 0.22, [-16, 16, 0.5, 7, -16, 3]);
      const cl = []; for (let i = 0; i < 8; i++) cl.push(cloud(g, R2(-70, 70), R2(24, 34), R2(-85, -45), R2(2.5, 4.5)));
      T.push(drift(cl, 0.45), fall(spray, -2.2, 0.4), fall(pet, -0.5, 1.4));
      return { sky: [0x5d7fe8, 0xf3e8ff], fog: [0xf3e8ff, 50, 230], sun: [0xfff4e0, 0.95], hemi: [0xeee6ff, 0x6fc160, 0.8] };
    },
    wueste(g, T) {
      ground(g, 0xe9c37b);
      const pyr = new THREE.ConeGeometry(1, 1, 4);
      [[-26, -58, 26], [8, -70, 34], [36, -52, 20], [-52, -80, 22]].forEach(([x, z, s], i) => { const p = m(g, pyr, [0xd9a75a, 0xcf9b4e, 0xe0b469][i % 3], x, s * 0.36, z, s, s * 0.72, s); p.rotation.y = Math.PI / 4 + i * 0.12; });
      for (let i = 0; i < 16; i++) m(g, G.sph, [0xe2b86a, 0xf0cc86, 0xd9ab5c][i % 3], R2(-110, 110), -5.5, R2(-120, -24), R2(18, 40), R2(7, 11), R2(12, 24));
      for (let i = 0; i < 22; i++) { const [x, z] = spot(34, -34, 2), h = R2(1.2, 3); m(g, G.cyl, 0x2f9e44, x, h / 2, z, 0.3, h, 0.3); m(g, G.sph, 0x2f9e44, x, h, z, 0.3); if (i % 3) { m(g, G.cyl, 0x2f9e44, x + 0.55, h * 0.55, z, 0.17, h * 0.4, 0.17); m(g, G.cyl, 0x2f9e44, x + 0.35, h * 0.38, z, 0.3, 0.16, 0.16); } if (i % 2) { m(g, G.cyl, 0x2f9e44, x - 0.55, h * 0.7, z, 0.17, h * 0.34, 0.17); m(g, G.cyl, 0x2f9e44, x - 0.35, h * 0.55, z, 0.3, 0.16, 0.16); } if (i % 4 === 0) m(g, G.ico, 0xff6b9d, x, h + 0.34, z, 0.16); }
      m(g, G.cyl, mat(0x33b5d6, { shininess: 90, flatShading: false }), 17, 0.03, -17, 6, 0.06, 3.6); for (let i = 0; i < 7; i++) palm(g, 17 + R2(-7, 7), -17 + R2(-4.5, 3), R2(1.2, 1.9));
      for (let i = 0; i < 18; i++) { const [x, z] = spot(26, -26, 3); rock(g, x, z, R2(0.3, 1.1), 0xc19a5b); }
      for (let i = 0; i < 5; i++) { const x = -15 + i * 1.6, h = 3 + (i % 2) * 1.4; m(g, G.cyl, 0xe6d3a8, x, h / 2, -19 - i * 0.6, 0.4, h, 0.4); }
      m(g, G.sph, new THREE.MeshBasicMaterial({ color: 0xfff3c4, fog: false }), -50, 60, -210, 16);
      const dust = points(g, 180, 0xf7e2b0, 0.22, [-24, 24, 0, 6, -24, 5], 0.6);
      T.push((t, dt) => { const a = dust.geometry.attributes.position; for (let i = 0; i < a.count; i++) { let x = a.getX(i) + dt * (1.6 + (i % 4) * 0.6); if (x > 24) x = -24; a.setX(i, x); a.setY(i, Math.max(0.05, a.getY(i) + Math.sin(t * 2 + i) * dt * 0.5)); } a.needsUpdate = true; });
      return { sky: [0x2f8fe0, 0xffe9bd], fog: [0xffe4b0, 45, 230], sun: [0xfff0c8, 1.05], hemi: [0xfff0d0, 0xd9a75a, 0.8] };
    },
    jahrmarkt(g, T) {
      ground(g, 0x3f7a4a);
      const cc = [0xff4d6d, 0xffd43b, 0x4dabf7, 0x8ce99a, 0xb197fc, 0xff922b], glow = c => new THREE.MeshBasicMaterial({ color: c, fog: false });
      const wheel = new THREE.Group(); wheel.add(new THREE.Mesh(new THREE.TorusGeometry(9, 0.3, 6, 30), mat(0xf1f3f5))); wheel.add(new THREE.Mesh(new THREE.TorusGeometry(7.6, 0.14, 6, 30), glow(0xffd43b)));
      const cab = []; for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2, sp = m(wheel, G.box, 0xdee2e6, Math.cos(a) * 4.5, Math.sin(a) * 4.5, 0, 9, 0.14, 0.14); sp.rotation.z = a; const c = m(wheel, G.box, cc[i % 6], Math.cos(a) * 9, Math.sin(a) * 9 - 0.8, 0, 1.5, 1.4, 1.2); c.userData.a = a; cab.push(c); }
      wheel.position.set(-13, 11.5, -30); g.add(wheel); m(g, G.cyl, 0xadb5bd, -15.5, 5.6, -30.4, 0.25, 12, 0.25).rotation.z = -0.38; m(g, G.cyl, 0xadb5bd, -10.5, 5.6, -30.4, 0.25, 12, 0.25).rotation.z = 0.38;
      const car = new THREE.Group(); m(car, G.cyl, 0xf8f0e3, 0, 0.3, 0, 4.4, 0.6, 4.4); m(car, G.cyl, 0xffd43b, 0, 2.6, 0, 0.4, 4.6, 0.4); const top = m(car, G.cone, 0xff4d6d, 0, 6, 0, 5, 2.6, 5); m(car, G.sph, 0xffd43b, 0, 7.5, 0, 0.4);
      const hs = []; for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; m(car, G.cyl, 0xffffff, Math.cos(a) * 3.2, 2.6, Math.sin(a) * 3.2, 0.06, 4.4, 0.06); const h = m(car, G.box, cc[i % 6], Math.cos(a) * 3.2, 1.7, Math.sin(a) * 3.2, 0.5, 0.7, 1.1); h.rotation.y = -a; h.userData.i = i; hs.push(h); }
      car.position.set(13, 0, -19); g.add(car);
      for (let i = 0; i < 9; i++) { const [x, z] = spot(34, -34, -6), s = R2(1.6, 2.8), c = cc[i % 6]; m(g, G.cyl, 0xffffff, x, s * 0.6, z, s, s * 1.2, s); for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; m(g, G.box, c, x + Math.cos(a) * s * 0.93, s * 0.6, z + Math.sin(a) * s * 0.93, s * 0.3, s * 1.2, 0.1).rotation.y = -a + Math.PI / 2; } m(g, G.cone, c, x, s * 1.75, z, s * 1.25, s * 1.1, s * 1.25); m(g, G.sph, 0xffd43b, x, s * 2.4, z, 0.2); }
      const bal = []; for (let i = 0; i < 22; i++) { const [x, z] = spot(26, -24, 0); const b = m(g, G.sph, mat(cc[i % 6], { shininess: 80, flatShading: false }), x, R2(3, 9), z, 0.45, 0.55, 0.45); b.userData = { y: b.position.y, ph: R2(0, 6) }; bal.push(b); }
      const L1 = points(g, 90, 0xffe066, 0.5, [-30, 30, 4, 9, -30, -8], 1), L2 = points(g, 90, 0xff6b9d, 0.5, [-30, 30, 4, 9, -30, -8], 1), L3 = points(g, 90, 0x74c0fc, 0.5, [-30, 30, 4, 9, -30, -8], 1);
      const stars = points(g, 260, 0xffffff, 0.9, [-200, 200, 40, 160, -260, -120], 0.9); const conf = points(g, 90, 0xffd43b, 0.16, [-16, 16, 0, 9, -14, 4], 0.9);
      m(g, G.sph, new THREE.MeshBasicMaterial({ color: 0xfff3c4, fog: false }), 55, 70, -220, 10);
      T.push(fall(conf, -0.8, 1.2), (t, dt) => { wheel.rotation.z = t * 0.22; cab.forEach(c => { c.rotation.z = -wheel.rotation.z; }); car.rotation.y = t * 0.5; hs.forEach(h => { h.position.y = 1.7 + Math.sin(t * 2.4 + h.userData.i * 1.6) * 0.5; }); top.rotation.y = -t * 0.3; bal.forEach(b => { b.position.y = b.userData.y + Math.sin(t * 0.9 + b.userData.ph) * 0.5; }); L1.material.opacity = 0.5 + Math.sin(t * 5) * 0.5; L2.material.opacity = 0.5 + Math.sin(t * 5 + 2.1) * 0.5; L3.material.opacity = 0.5 + Math.sin(t * 5 + 4.2) * 0.5; stars.material.opacity = 0.7 + Math.sin(t * 1.7) * 0.25; });
      return { sky: [0x1b1464, 0xe0457b], fog: [0x7a2f7a, 40, 190], sun: [0xffd6e8, 0.75], hemi: [0xffc9e9, 0x3f7a4a, 0.95] };
    },
    sterne(g, T) {
      ground(g, 0x2c3566);
      for (let i = 0; i < 9; i++) m(g, G.sph, [0x27305c, 0x323c73, 0x232a52][i % 3], R2(-100, 100), -7, R2(-110, -40), R2(22, 40), R2(11, 16), R2(18, 28));
      const ob = new THREE.Group(); m(ob, G.cyl, 0xe9ecef, 0, 3, 0, 5.5, 6, 5.5); const dome = m(ob, new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xcfd6e6, { flatShading: false, shininess: 60 }), 0, 6, 0, 5.6, 5.6, 5.6); m(ob, G.box, 0x1a1f45, 0, 8.6, 3.2, 1.6, 4.4, 4); const tel = m(ob, G.cyl, 0x868e96, 0, 9.6, 4, 0.6, 5, 0.6); tel.rotation.x = 0.9; m(ob, G.box, 0x4c3a8a, 0, 1.5, 5.46, 1.6, 3, 0.1); for (let i = 0; i < 4; i++) m(ob, G.box, glowM(0xffe066), -3.6 + i * 2.4, 3.6, 5.2 - Math.abs(i - 1.5) * 0.6, 0.8, 0.8, 0.1); ob.position.set(-13, 0, -22); g.add(ob);
      const rk = new THREE.Group(); m(rk, G.cyl, 0xf1f3f5, 0, 3.2, 0, 1, 4.4, 1); m(rk, G.cone, 0xe03131, 0, 6.4, 0, 1, 2, 1); m(rk, G.sph, mat(0x4dabf7, { shininess: 100, flatShading: false }), 0, 4, 0.9, 0.42); for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2, f = m(rk, G.cone4, 0xe03131, Math.cos(a) * 1.1, 1.4, Math.sin(a) * 1.1, 0.6, 1.8, 0.2); f.rotation.y = -a; } const fire = m(rk, G.cone, glowM(0xffa94d), 0, 0.5, 0, 0.6, 1.4, 0.6); fire.rotation.x = Math.PI; rk.position.set(14, 0.4, -15); g.add(rk);
      for (let i = 0; i < 30; i++) { const [x, z] = spot(40, -40, 2); pine(g, x, z, R2(0.9, 1.8), [0x1d3b5c, 0x234a6b][i % 2]); }
      for (let i = 0; i < 20; i++) { const [x, z] = spot(20, -18, 3); m(g, G.oct, glowM([0x74c0fc, 0xb197fc, 0x63e6be][i % 3]), x, R2(0.2, 0.5), z, R2(0.12, 0.3), R2(0.3, 0.7), R2(0.12, 0.3)); }
      const pl = []; [[-38, 44, -150, 9, 0xffa94d, 1], [46, 60, -180, 13, 0x74c0fc, 0], [10, 78, -200, 6, 0xf783ac, 1]].forEach(([x, y, z, s, c, ring]) => { const p = new THREE.Group(); m(p, G.sph, new THREE.MeshLambertMaterial({ color: c, fog: false, emissive: c, emissiveIntensity: 0.35 }), 0, 0, 0, s); if (ring) { const r = new THREE.Mesh(new THREE.TorusGeometry(s * 1.6, s * 0.12, 4, 40), glowM(0xffe8a3)); r.rotation.x = 1.25; p.add(r); } p.position.set(x, y, z); g.add(p); pl.push(p); });
      m(g, G.sph, glowM(0xfff7d6), -70, 80, -220, 12);
      const s1 = points(g, 420, 0xffffff, 1.1, [-240, 240, 25, 190, -280, -110], 1), s2 = points(g, 220, 0xffe8a3, 1.5, [-240, 240, 25, 190, -280, -110], 1), ff = points(g, 60, 0xb7d7ff, 0.22, [-14, 14, 0.4, 6, -14, 3]);
      const sh = m(g, G.box, glowM(0xffffff), 0, 0, 0, 5, 0.12, 0.12); sh.rotation.z = -0.5;
      T.push(fall(ff, 0.25, 1.2), t => { s1.material.opacity = 0.75 + Math.sin(t * 2.3) * 0.25; s2.material.opacity = 0.7 + Math.sin(t * 1.6 + 2) * 0.3; pl.forEach((p, i) => { p.rotation.y = t * 0.2 * (i + 1); }); dome.rotation.y = Math.sin(t * 0.2) * 0.6; fire.scale.y = 1.2 + Math.sin(t * 22) * 0.4; rk.position.y = 0.4 + Math.sin(t * 1.4) * 0.12; const u = (t % 7) / 1.3; sh.visible = u < 1; sh.position.set(60 - u * 90, 70 - u * 44, -150); });
      return { sky: [0x050a30, 0x3b3fa0], fog: [0x2a2f7a, 30, 220], sun: [0xc9d6ff, 0.7], hemi: [0xb9c6ff, 0x2c3566, 0.95] };
    },
  };
  function glowM(c) { return new THREE.MeshBasicMaterial({ color: c, fog: false }); }

  function init(c) {
    canvas = c;
    try { R = new THREE.WebGLRenderer({ canvas: c, antialias: true }); } catch (e) { return false; }
    R.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    scene = new THREE.Scene(); cam = new THREE.PerspectiveCamera(40, 1, 0.1, 700); clock = new THREE.Clock(); geo();
    hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8); sun = new THREE.DirectionalLight(0xffffff, 0.9); sun.position.set(-6, 12, 8); scene.add(hemi, sun);
    ok = true; resize(); window.addEventListener('resize', resize);
    if (window.ResizeObserver) new ResizeObserver(resize).observe(c); R.setAnimationLoop(frame); return true;
  }
  function resize() {
    if (!ok) return; const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
    R.setSize(w, h, false); cam.aspect = w / h;
    dist = Math.max(8.2, 11.4 / (2 * Math.tan(20 * Math.PI / 180) * cam.aspect)); cam.updateProjectionMatrix();
  }
  function setEnv(name, v = 0) {
    if (!ok) return; if (!BUILD[name]) name = 'home';
    const key = name; variant = v;
    if (!envs[key]) { seed = 11 + name.length * 131 + name.charCodeAt(0); const g = new THREE.Group(), T = []; const cfg = BUILD[name](g, T); cfg.g = g; cfg.T = T; cfg.dome = skyDome(cfg.sky[0], cfg.sky[1]); g.add(cfg.dome); g.visible = false; scene.add(g); envs[key] = cfg; }
    if (cur && cur !== envs[key]) cur.g.visible = false;
    const changed = cur !== envs[key] || cur.v !== v; cur = envs[key]; cur.v = v; cur.g.visible = true; cur.g.rotation.y = v ? 0.55 : 0;
    scene.fog = new THREE.Fog(cur.fog[0], cur.fog[1], cur.fog[2]); scene.background = new THREE.Color(cur.sky[1]);
    sun.color.set(cur.sun[0]); sun.intensity = cur.sun[1]; sun.position.set(v ? 7 : -6, 12, 8);
    hemi.color.set(cur.hemi[0]); hemi.groundColor.set(cur.hemi[1]); hemi.intensity = cur.hemi[2];
    if (changed) dolly = 1;
  }
  const texCache = {}, loader = () => (loader.l = loader.l || new THREE.TextureLoader());
  const tex = src => texCache[src] || (texCache[src] = loader().load(src));
  const toX = x => (x - 50) / 50 * 5.3, toY = y => y / 100 * 5.6, toH = s => s / 100 * 5.6;
  /* list: [{id, img, x, y, size, anim, gem, hue}]
     Figuren, die schon auf der Bühne stehen, laufen an ihren neuen Platz; neue kommen von der Seite herein. */
  function makeActor(a, i, instant, old) {
    let o; const h = toH(a.size || 36);
    if (a.gem) {
      o = new THREE.Mesh(G.oct, new THREE.MeshPhongMaterial({ color: new THREE.Color().setHSL((a.hue || 200) / 360, 0.85, 0.55), emissive: new THREE.Color().setHSL((a.hue || 200) / 360, 0.9, 0.25), shininess: 120, flatShading: true, fog: false }));
      o.scale.set(h * 0.33, h * 0.5, h * 0.33); const pl = new THREE.PointLight(new THREE.Color().setHSL((a.hue || 200) / 360, 1, 0.7), 1.2, 9); o.add(pl);
    } else {
      o = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex(a.img), transparent: true, alphaTest: 0.08, fog: false }));
      o.center.set(0.5, 0); o.scale.set(h * (a.flip ? -1 : 1), h, 1);
    }
    const x = toX(a.x), y = toY(a.y == null ? 3 : a.y) + (a.gem ? h * 0.5 : 0), z = 0.4 - i * 0.07, air = y > 1.2 || a.gem;
    let sx = x, sy = y, pop = instant ? 1 : 0, t0 = instant ? -9 : clock.elapsedTime + i * 0.12;
    if (old) { sx = old.x; sy = old.y; pop = 1; t0 = -9; } else if (!instant && !air) { sx = x < 0 ? x - 7 - i : x + 7 + i; pop = 1; }
    o.position.set(sx, sy, z); scene.add(o);
    let sh = null;
    if (!a.noShadow && y < 3) { sh = new THREE.Mesh(G.circ, new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.22, depthWrite: false })); sh.rotation.x = -Math.PI / 2; sh.scale.set(h * 0.32, h * 0.14, 1); sh.position.set(sx, 0.03, z); scene.add(sh); }
    return { id: a.id, o, sh, x: sx, y: sy, tx: x, ty: y, z, h, anim: a.anim, gem: a.gem, flip: a.flip ? -1 : 1, ph: i * 1.7, t0, pop, wait: old || instant ? 0 : i * 0.12, jump: -1, jh: 0.7, sad: 0, fid: clock.elapsedTime + 2 + Math.random() * 5, quiet: instant };
  }
  function dropActor(a) { scene.remove(a.o); if (a.sh) scene.remove(a.sh); if (a.emo) scene.remove(a.emo.o); }
  function setActors(list, instant) {
    if (!ok) return;
    const olds = actors.splice(0);
    list.forEach((a, i) => { const k = olds.findIndex(q => q.id === a.id && !q.gem && !a.gem && !instant && !q.quiet && !q.exit); const old = k >= 0 ? olds.splice(k, 1)[0] : null; actors.push(makeActor(a, i, instant, old)); if (old) dropActor(old); });
    olds.forEach(dropActor);
  }
  const find = id => actors.find(q => q.id === id);
  function addActor(a) { if (!ok) return; const old = find(a.id); if (old) { old.tx = toX(a.x); old.ty = toY(a.y == null ? 3 : a.y); return; } actors.push(makeActor(a, actors.length, false, null)); }
  function exitActor(id) { if (!ok) return; const a = find(id); if (!a) return; a.tx = a.x < 0 ? -14 : 14; a.exit = true; }
  function moveTo(id, xp, yp) { const a = find(id); if (!a) return; a.tx = toX(xp); if (yp != null) a.ty = toY(yp); }
  function moveActor(id, xp, yp) { const a = find(id); if (!a) return; a.x = a.tx = toX(xp); a.y = a.ty = toY(yp); }
  function sizeActor(id, s, flip) { const a = find(id); if (!a) return; a.h = toH(s); a.flip = flip ? -1 : 1; }
  function setAnim(id, anim) { const a = find(id); if (a) a.anim = anim; }
  function jump(id, hgt) { if (!ok) return; const now = clock.elapsedTime; actors.forEach((a, i) => { if (a.gem || (id && a.id !== id)) return; a.jump = now + (id ? 0 : i * 0.09); a.jh = hgt || 0.7; }); }
  function sad() { if (!ok) return; const now = clock.elapsedTime; actors.forEach(a => { if (!a.gem) a.sad = now + 1.1; }); }
  let shakeT = 0; const shake = (d = 0.6) => { shakeT = d; };
  const emoTex = {};
  function emote(id, ch) {
    const a = find(id); if (!ok || !a) return; if (a.emo) scene.remove(a.emo.o);
    if (!emoTex[ch]) { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); x.fillStyle = '#fff'; x.beginPath(); x.arc(64, 58, 54, 0, 6.3); x.fill(); x.beginPath(); x.moveTo(40, 100); x.lineTo(64, 126); x.lineTo(84, 104); x.fill(); x.font = '64px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#1f2937'; x.fillText(ch, 64, 62); emoTex[ch] = new THREE.CanvasTexture(c); }
    const o = new THREE.Sprite(new THREE.SpriteMaterial({ map: emoTex[ch], transparent: true, fog: false, depthTest: false })); o.center.set(0.5, 0); scene.add(o); a.emo = { o, t: clock.elapsedTime };
  }
  const talk = id => { talkId = id; };
  function celebrate(hue) {
    if (!ok) return; const n = 90, pos = new Float32Array(n * 3), vel = [];
    for (let i = 0; i < n; i++) { pos[i * 3 + 1] = 2; const a = Math.random() * 6.28, s = 2 + Math.random() * 5; vel.push([Math.cos(a) * s, 3 + Math.random() * 6, Math.sin(a) * s * 0.4]); }
    const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const p = new THREE.Points(bg, new THREE.PointsMaterial({ color: new THREE.Color().setHSL((hue == null ? Math.random() * 360 : hue) / 360, 1, 0.65), size: 0.35, map: dot(), transparent: true, depthWrite: false, fog: false }));
    scene.add(p); bursts.push({ p, vel, t: 0 }); jump();
  }
  /* Bildschirmpunkt → Bühnen-Prozent (für „Meine Welt“) */
  function pick(clientX, clientY) {
    const r = canvas.getBoundingClientRect(), nx = (clientX - r.left) / r.width * 2 - 1, ny = -((clientY - r.top) / r.height * 2 - 1);
    const hh = Math.tan(20 * Math.PI / 180) * dist, wx = nx * hh * cam.aspect, wy = 1.75 + ny * hh;
    return { x: wx / 5.3 * 50 + 50, y: wy / 5.6 * 100 };
  }
  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
    if (cur) cur.T.forEach(f => f(t, dt));
    let tx = 0; const talker = talkId ? find(talkId) : null;
    for (let i = actors.length - 1; i >= 0; i--) {
      const a = actors[i], p = t + a.ph;
      if (a.wait > 0) a.wait -= dt;
      const e = a.pop ? 1 : Math.min(1, Math.max(0, (t - a.t0) / 0.5)), ease = e < 1 ? 1 - Math.pow(1 - e, 3) * Math.cos(e * 7) : 1;
      /* laufen: mit kleinen Hüpfern zum Ziel */
      let walk = 0; const dx = a.tx - a.x, dy = a.ty - a.y;
      if (a.wait <= 0 && (Math.abs(dx) > 0.02 || Math.abs(dy) > 0.02)) { const sp = (a.exit ? 7 : 5.5) * dt, d = Math.hypot(dx, dy); if (d <= sp) { a.x = a.tx; a.y = a.ty; } else { a.x += dx / d * sp; a.y += dy / d * sp; walk = 1; } }
      if (a.exit && Math.abs(a.x - a.tx) < 0.05) { dropActor(a); actors.splice(i, 1); continue; }
      let x = a.x, y = a.y, sx = ease, sy = ease, rot = 0;
      if (a.gem) { a.o.position.set(x, y + (1 - e) * 1.5 + Math.sin(p * 1.6) * 0.12, a.z); a.o.rotation.y = t * 1.6; const s = 1 + Math.sin(p * 4) * 0.07; a.o.scale.set(a.h * 0.33 * ease * s, a.h * 0.5 * ease * s, a.h * 0.33 * ease * s); continue; }
      if (walk) { y += Math.abs(Math.sin(t * 13 + a.ph)) * 0.16; rot = -Math.sign(dx) * 0.1; }
      else if (a.anim === 'hop') { const b = Math.abs(Math.sin(p * 4)); y += b * 0.35; sy *= 1 + (b - 0.5) * 0.1; sx *= 1 - (b - 0.5) * 0.08; }
      else if (a.anim === 'float') { y += Math.sin(p * 1.6) * 0.22; rot = Math.sin(p * 0.9) * 0.06; }
      else if (a.anim === 'shake') x += Math.sin(p * 28) * 0.035; else if (a.anim === 'sway') rot = Math.sin(p * 2) * 0.12;
      else if (a.anim === 'pulse') { sx *= 1 + Math.sin(p * 4) * 0.07; sy *= 1 + Math.sin(p * 4) * 0.07; } else if (a.anim === 'spin') rot = p * 1.5;
      /* atmen und leicht wiegen – niemand steht ganz still */
      if (a.anim !== 'spin') { const br = Math.sin(p * 2.3) * 0.022; sy *= 1 + br; sx *= 1 - br * 0.7; if (!a.anim && !walk) rot += Math.sin(p * 1.1) * 0.025; }
      /* ab und zu ein kleiner Hüpfer von selbst */
      if (!a.quiet && !walk && t > a.fid) { a.fid = t + 3.5 + Math.random() * 6; if (a.jump < 0 && a.id !== talkId) { a.jump = t; a.jh = 0.22 + Math.random() * 0.2; } }
      if (a.jump >= 0 && t >= a.jump) { const u = (t - a.jump) / 0.55; if (u >= 1) a.jump = -1; else { const s = Math.sin(u * Math.PI); y += s * a.jh; sy *= 1 + s * 0.12 - (u < 0.12 || u > 0.9 ? 0.12 : 0); sx *= 1 - s * 0.08 + (u < 0.12 || u > 0.9 ? 0.1 : 0); if (a.jh > 0.6) rot += Math.sin(u * Math.PI * 2) * 0.18; } }
      if (a.sad > t) { const u = (a.sad - t) / 1.1; x += Math.sin(t * 40) * 0.04 * u; rot += 0.16 * Math.sin(u * Math.PI); sy *= 1 - 0.1 * Math.sin(u * Math.PI); }
      if (a.id === talkId) { const b = Math.abs(Math.sin(t * 9)); y += b * 0.16; sx *= 1.08; sy *= 1.08 + b * 0.04; rot += Math.sin(t * 4.5) * 0.05; tx = a.x * 0.12; }
      else if (talker && !walk) rot += Math.max(-0.07, Math.min(0.07, (a.x - talker.x) * 0.02)); // zum Sprecher neigen
      a.o.position.set(x, y + (1 - e) * 1.5, a.z);
      a.o.scale.set(a.h * sx * a.flip, a.h * sy, 1); a.o.material.rotation = rot;
      if (a.sh) { a.sh.position.x = x; a.sh.material.opacity = 0.22 * e * Math.max(0.35, 1 - (y - a.ty) * 0.8); }
      if (a.emo) { const u = (t - a.emo.t) / 1.8; if (u >= 1) { scene.remove(a.emo.o); a.emo = null; } else { const s = Math.min(1, u * 8) * (u > 0.8 ? (1 - u) * 5 : 1) * 0.9; a.emo.o.position.set(x + a.h * 0.28, y + a.h * 0.92 + Math.sin(u * 9) * 0.05, a.z + 0.3); a.emo.o.scale.set(s, s, 1); } }
    }
    for (let i = bursts.length - 1; i >= 0; i--) {
      const b = bursts[i], a = b.p.geometry.attributes.position; b.t += dt;
      for (let k = 0; k < a.count; k++) { const v = b.vel[k]; v[1] -= 9 * dt; a.setXYZ(k, a.getX(k) + v[0] * dt, a.getY(k) + v[1] * dt, a.getZ(k) + v[2] * dt); }
      a.needsUpdate = true; b.p.material.opacity = Math.max(0, 1 - b.t / 1.6);
      if (b.t > 1.6) { scene.remove(b.p); bursts.splice(i, 1); }
    }
    dolly = Math.max(0, dolly - dt * 0.9); lookX += (tx - lookX) * Math.min(1, dt * 3); shakeT = Math.max(0, shakeT - dt);
    const d = dist + dolly * dolly * 5, sk = shakeT * 0.5;
    cam.position.set(Math.sin(t * 0.3) * 0.3 + lookX * 0.5 + Math.sin(t * 61) * sk, 2.25 + Math.sin(t * 0.23) * 0.08 + dolly * 1.2 + Math.cos(t * 53) * sk, d);
    cam.lookAt(lookX, 1.75, 0);
    R.render(scene, cam);
  }
  return { init, resize, setEnv, setActors, addActor, exitActor, moveTo, moveActor, sizeActor, setAnim, jump, sad, shake, emote, talk, celebrate, pick, get ok() { return ok; } };
})();
