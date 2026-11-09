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
  };

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
  /* list: [{id, img, x, y, size, anim, gem, hue}] */
  function setActors(list, instant) {
    if (!ok) return;
    actors.splice(0).forEach(a => { scene.remove(a.o); if (a.sh) scene.remove(a.sh); });
    list.forEach((a, i) => {
      let o; const h = toH(a.size || 36);
      if (a.gem) {
        o = new THREE.Mesh(G.oct, new THREE.MeshPhongMaterial({ color: new THREE.Color().setHSL((a.hue || 200) / 360, 0.85, 0.55), emissive: new THREE.Color().setHSL((a.hue || 200) / 360, 0.9, 0.25), shininess: 120, flatShading: true, fog: false }));
        o.scale.set(h * 0.33, h * 0.5, h * 0.33); const pl = new THREE.PointLight(new THREE.Color().setHSL((a.hue || 200) / 360, 1, 0.7), 1.2, 9); o.add(pl);
      } else {
        o = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex(a.img), transparent: true, alphaTest: 0.08, fog: false }));
        o.center.set(0.5, 0); o.scale.set(h * (a.flip ? -1 : 1), h, 1);
      }
      const x = toX(a.x), y = toY(a.y == null ? 3 : a.y) + (a.gem ? h * 0.5 : 0), z = 0.4 - i * 0.07;
      o.position.set(x, y, z); scene.add(o);
      let sh = null;
      if (!a.noShadow && y < 3) { sh = new THREE.Mesh(G.circ, new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.22, depthWrite: false })); sh.rotation.x = -Math.PI / 2; sh.scale.set(h * 0.32, h * 0.14, 1); sh.position.set(x, 0.03, z); scene.add(sh); }
      actors.push({ id: a.id, o, sh, x, y, z, h, anim: a.anim, gem: a.gem, flip: a.flip ? -1 : 1, ph: i * 1.7, t0: instant ? -9 : clock.elapsedTime + i * 0.13 });
    });
  }
  function moveActor(id, xp, yp) { const a = actors.find(q => q.id === id); if (!a) return; a.x = toX(xp); a.y = toY(yp); if (a.sh) a.sh.position.x = a.x; }
  function sizeActor(id, s, flip) { const a = actors.find(q => q.id === id); if (!a) return; a.h = toH(s); a.flip = flip ? -1 : 1; }
  const talk = id => { talkId = id; };
  function celebrate(hue) {
    if (!ok) return; const n = 90, pos = new Float32Array(n * 3), vel = [];
    for (let i = 0; i < n; i++) { pos[i * 3 + 1] = 2; const a = Math.random() * 6.28, s = 2 + Math.random() * 5; vel.push([Math.cos(a) * s, 3 + Math.random() * 6, Math.sin(a) * s * 0.4]); }
    const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const p = new THREE.Points(bg, new THREE.PointsMaterial({ color: new THREE.Color().setHSL((hue == null ? Math.random() * 360 : hue) / 360, 1, 0.65), size: 0.35, map: dot(), transparent: true, depthWrite: false, fog: false }));
    scene.add(p); bursts.push({ p, vel, t: 0 });
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
    let tx = 0;
    for (const a of actors) {
      const e = Math.min(1, Math.max(0, (t - a.t0) / 0.5)), ease = e < 1 ? 1 - Math.pow(1 - e, 3) * Math.cos(e * 7) : 1;
      let x = a.x, y = a.y, sc = ease, rot = 0; const p = t + a.ph;
      if (a.anim === 'hop') y += Math.abs(Math.sin(p * 4)) * 0.35; else if (a.anim === 'float') y += Math.sin(p * 1.6) * 0.22;
      else if (a.anim === 'shake') x += Math.sin(p * 28) * 0.035; else if (a.anim === 'sway') rot = Math.sin(p * 2) * 0.12;
      else if (a.anim === 'pulse') sc *= 1 + Math.sin(p * 4) * 0.07; else if (a.anim === 'spin') rot = p * 1.5;
      if (a.id === talkId) { y += Math.abs(Math.sin(t * 9)) * 0.16; sc *= 1.08; tx = a.x * 0.12; }
      a.o.position.set(x, y + (1 - e) * 1.5, a.z);
      if (a.gem) { a.o.rotation.y = t * 1.6; a.o.scale.set(a.h * 0.33 * sc, a.h * 0.5 * sc, a.h * 0.33 * sc); }
      else { a.o.scale.set(a.h * sc * a.flip, a.h * sc, 1); a.o.material.rotation = rot; }
      if (a.sh) a.sh.material.opacity = 0.22 * e;
    }
    for (let i = bursts.length - 1; i >= 0; i--) {
      const b = bursts[i], a = b.p.geometry.attributes.position; b.t += dt;
      for (let k = 0; k < a.count; k++) { const v = b.vel[k]; v[1] -= 9 * dt; a.setXYZ(k, a.getX(k) + v[0] * dt, a.getY(k) + v[1] * dt, a.getZ(k) + v[2] * dt); }
      a.needsUpdate = true; b.p.material.opacity = Math.max(0, 1 - b.t / 1.6);
      if (b.t > 1.6) { scene.remove(b.p); bursts.splice(i, 1); }
    }
    dolly = Math.max(0, dolly - dt * 0.9); lookX += (tx - lookX) * Math.min(1, dt * 3);
    const d = dist + dolly * dolly * 5;
    cam.position.set(Math.sin(t * 0.3) * 0.3 + lookX * 0.5, 2.25 + Math.sin(t * 0.23) * 0.08 + dolly * 1.2, d);
    cam.lookAt(lookX, 1.75, 0);
    R.render(scene, cam);
  }
  return { init, resize, setEnv, setActors, moveActor, sizeActor, talk, celebrate, pick, get ok() { return ok; } };
})();
