
// ============================================================
//  空中的细节（二）：会被惊飞的鸟
//  落在地上、横梁、电线、墙头、屋檐、树上的鸟。主角走近就飞走 —— 跑着过来，离得远就飞了；慢慢走能凑得更近。
//  一群里有一只飞了，旁边的就一只接一只跟着飞；附近有大的响动（压机砸下去、狗叫、重重落地、闸门撞到头）也会惊飞。
//  飞的时候背对着镜头往高处、往远处去；过一阵、主角走远了，再从高处滑翔回来落下
// ============================================================
const BIRD_KIND = {                                      // [背, 肚子, 翅膀, 头, 嘴] 的颜色, 身长（米）
  pigeon: { c: [0x7a848c, 0xa3abb0, 0x5d666e, 0x58626b, 0x2a2626], L: 0.33 },
  crow: { c: [0x1c1e20, 0x24272a, 0x141618, 0x181a1c, 0x101010], L: 0.44 },
  sparrow: { c: [0x8a6a48, 0xd2c4a8, 0x5c4630, 0x6e5640, 0x3a3026], L: 0.19 },
};
const BIRD_MAT = {}, BIRD_FLAT = {};
for (const k in BIRD_KIND) BIRD_MAT[k] = BIRD_KIND[k].c.map(c => lam(c, { emissive: c, emissiveIntensity: 0.18 }));
const birdFlat = c => BIRD_FLAT[c] ??= new THREE.MeshBasicMaterial({ color: c });   // 远处布景板上的鸟：和那块板一样，只是一块颜色
const BIRD_GEO = { body: new THREE.SphereGeometry(0.5, 9, 7), belly: new THREE.SphereGeometry(0.4, 8, 6), head: new THREE.SphereGeometry(0.17, 8, 6),
  beak: new THREE.ConeGeometry(0.05, 0.17, 5).rotateZ(-Math.PI / 2), tail: new THREE.BoxGeometry(0.42, 0.035, 0.22),
  wing: [-1, 1].map(sz => new THREE.BoxGeometry(0.42, 0.03, 0.62).translate(-0.06, 0, sz * 0.31)) };
const AIR_FLOCKS = new Set();                            // 现在搭好了的几群鸟：大的响动从这里找到附近的鸟
let lastFlutter = -9;

function mkAirBird(parent, kind, flat) {
  const K = BIRD_KIND[kind], m = flat ? Array(5).fill(birdFlat(flat)) : BIRD_MAT[kind];
  const g = grp(parent), body = grp(g, 0, 0.3, 0);
  add(body, BIRD_GEO.body, m[0], 0, 0, 0, false).scale.set(1, 0.62, 0.56);
  add(body, BIRD_GEO.belly, m[1], 0.06, -0.08, 0, false).scale.set(1, 0.6, 0.62);
  const head = grp(body, 0.42, 0.22, 0); add(head, BIRD_GEO.head, m[3], 0, 0, 0, false); add(head, BIRD_GEO.beak, m[4], 0.2, -0.02, 0, false);
  add(body, BIRD_GEO.tail, m[2], -0.6, 0.04, 0, false).rotation.z = 0.25;
  const wings = BIRD_GEO.wing.map(geo => { const w = grp(body, 0.02, 0.12, 0); add(w, geo, m[2], 0, 0, 0, false); return w; });
  g.scale.setScalar(K.L);
  return { g, body, head, wings };
}
const flapTo = (b, up) => b.wings.forEach((w, i) => { w.rotation.x = (i ? -1 : 1) * up; w.scale.z = up < -1 ? 0.6 : 1; });   // up > 0 翅膀抬起；-1.45 收着贴在身子两侧

// 一群鸟。specs: [[种类, x, y（null = 站在地上）, z, { face 朝哪边, flee 主角走到多近就飞（0 = 不怕人）, s 大小, flat 远处的剪影色,
//                   away 往哪边飞（1 右 / -1 左，不写就背着主角）, toZ 往深处飞多快, back 飞走以后至少过多久才回来, noise 怕不怕响动（0..1）,
//                   dy 主角在上下多远以内才算走近（停在高处电线上的要大一些）}], ...]
// 同一群里一只飞了，别的跟着飞
function airBirds(R, specs, o = {}) {
  const root = grp(R), birds = specs.map(([kind, x, y, z, b = {}], i) => {
    const B = mkAirBird(root, kind, b.flat), K = BIRD_KIND[kind];
    return Object.assign(B, { kind, K, x, y0: y, z, i, face: b.face ?? (i % 2 ? 1 : -1), flee: b.flee ?? 3, s: b.s ?? 1, away: b.away, toZ: b.toZ, back: b.back ?? ar(9, 16),
      noise: b.noise ?? 1, dy: b.dy ?? 4.5, ground: y === null, seed: x * 0.61 + i * 1.37, st: 'perch', t: 0 });
  });
  const F = { name: o.name ?? 'birds', root, birds, on: true };
  const place = b => { b.y = b.ground ? groundY(b.x) : b.y0; b.g.position.set(b.x, b.y, b.z); b.g.scale.setScalar(b.K.L * b.s); b.g.rotation.y = b.face > 0 ? 0 : Math.PI; b.g.visible = true; b.st = 'perch'; b.t = 0; };
  F.reset = () => birds.forEach(place); F.reset();
  // 惊飞一只：dir 往哪边飞，delay 隔多久才起飞（一群里一只接一只）
  F.off = (b, dir, delay = 0) => {
    if (b.st !== 'perch') return;
    b.st = 'go'; b.delay = delay; b.dir = b.away ?? (dir || b.face);
    for (const q of birds) if (q.st === 'perch' && Math.abs(q.x - b.x) < (o.spread ?? 6) && Math.abs(q.y - b.y) < 2.5 && Math.abs(q.z - b.z) < 6) { q.st = 'go'; q.dir = q.away ?? b.dir; q.delay = delay + ar(0.06, 0.3) + 0.06 * Math.abs(q.x - b.x); }
  };
  F.scare = (x, r, p = 1, y = null, ry = 99) => { for (const b of birds) if (b.st === 'perch' && Math.abs(b.x - x) < r && (y === null || Math.abs(b.y - y) < ry) && Math.random() < p * b.noise) F.off(b, Math.sign(b.x - x)); };   // y, ry：只惊动这个高度附近的
  function launch(b) {
    b.st = 'fly'; b.t = 0; b.vx = b.dir * 1.2; b.vy = 3; b.vz = 0; b.sp = ar(3.5, 5.5) * (o.speed ?? 1); b.climb = ar(1.8, 3.2); b.tz = b.toZ ?? ar(-3.5, -1.5);
    if (T - lastFlutter > 0.35 && inView(b.x, b.z, 2)) { lastFlutter = T; fx('flutter'); }
  }
  F.step = dt => {
    if (!root.visible) return;
    for (const b of birds) {
      const g = b.g; b.t += dt;
      if (b.st === 'perch' || b.st === 'go') {               // 落着：每隔一会儿做一件小事 —— 啄一下、蹦一下、扭头看看、抖抖翅膀
        const q = T * 0.7 + b.seed, n = Math.floor(q), f = q - n, h = hash1(n + b.seed * 7);
        const peck = b.ground && h < 0.45 ? Math.sin(Math.min(1, f * 2.2) * Math.PI) : 0, hop = b.ground && h > 0.84 ? Math.sin(clamp(f * 3, 0, 1) * Math.PI) : 0;
        b.body.rotation.z = -0.9 * peck + (b.ground ? 0 : 0.05 * Math.sin(T * 1.1 + b.seed)); b.head.rotation.y = h > 0.5 && h < 0.8 ? 1.0 * sstep(0, 0.2, f) * (1 - sstep(0.7, 0.9, f)) : 0;
        g.position.set(b.x, b.y + 0.06 * hop, b.z); flapTo(b, -1.45 + (h > 0.96 ? 0.5 * Math.max(0, Math.sin(f * 40)) : 0));
        if (b.st === 'go') { b.delay -= dt; if (b.delay <= 0) launch(b); }
        else if (state === 'play' && b.flee > 0) {
          const r = b.flee * lerp(0.6, 1.35, clamp(Math.abs(P.vx) / RUN, 0, 1));
          if (Math.abs(P.x - b.x) < r && Math.abs(P.y - b.y) < b.dy) F.off(b, Math.sign(b.x - P.x));
        }
      } else if (b.st === 'fly') {                           // 飞走：先猛扑几下拔起来，然后往高处、往深处飞
        b.vx = damp(b.vx, b.dir * b.sp, 2.5, dt); b.vy = damp(b.vy, b.climb, 1.6, dt); b.vz = damp(b.vz, b.tz, 1.5, dt);
        g.position.x += b.vx * dt; g.position.y += (b.vy + 0.5 * Math.sin(b.t * 10)) * dt; g.position.z += b.vz * dt;
        g.rotation.y = Math.atan2(-b.vz, b.vx); b.body.rotation.z = 0.25; b.head.rotation.y = 0;
        flapTo(b, 0.15 + 1.05 * Math.sin(b.t * (b.t < 0.7 ? 34 : 21) + b.seed));
        if (b.t > 7 || g.position.y > viewTop(g.position.z) + 2.5 || !inView(g.position.x, g.position.z, 5)) { b.st = 'gone'; b.t = 0; g.visible = false; }
      } else if (b.st === 'gone') {                          // 主角走远了再回来
        if (b.t > b.back && Math.abs(P.x - b.x) > (o.backAt ?? 12)) { b.st = 'come'; b.t = 0; b.cdir = Math.random() < 0.5 ? -1 : 1; g.visible = true; }
      } else if (b.st === 'come') {                          // 从高处滑翔下来，落地前扑几下
        const k = Math.min(1, b.t / 3), a = (1 - k) * (1 - k);
        g.position.set(b.x + a * 8 * b.cdir, b.y + a * 5, b.z - a * 6); g.rotation.y = (b.cdir > 0 ? Math.PI : 0) + 0.6 * a * b.cdir;
        b.body.rotation.z = 0.2 * a; flapTo(b, k > 0.78 ? 0.2 + 0.9 * Math.sin(b.t * 30) : 0.3 + 0.08 * Math.sin(b.t * 3));
        if (k >= 1) { b.st = 'perch'; g.rotation.y = b.face > 0 ? 0 : Math.PI; }
      }
    }
  };
  AIR_FLOCKS.add(F); F.dispose = () => AIR_FLOCKS.delete(F);
  return F;
}

// 落在一块布景板画出来的东西的顶上（树冠、枯枝、电线、屋檐）：在那块板的画布上，从上往下找这一列第一个不透明的像素。
// zoneN 哪一章, z 板的深度, x 世界 x, yMax 从多高往下找, solid 多不透明才算（细电线要放低一些）。找不到返回 null
function boardTop(zoneN, z, x, yMax = 99, solid = 170) {
  const zone = ZONES.find(q => q.n === zoneN && !q.air), root = zone && zone.root; if (!root) return null;
  for (const m of root.children) {
    const img = m.material && m.material.map && m.material.map.image, pr = m.geometry && m.geometry.parameters;
    if (!img || !img.getContext || !pr || pr.width === undefined || m.rotation.x !== 0 || Math.abs(m.position.z - z) > 0.01) continue;
    const x1 = m.position.x - pr.width / 2, y2 = m.position.y + pr.height / 2; if (x < x1 || x > x1 + pr.width) continue;
    const k = img.width / pr.width, col = Math.round((x - x1) * k), y0 = clamp(Math.round((y2 - yMax) * k), 0, img.height - 1);
    const d = img.getContext('2d').getImageData(col, y0, 1, img.height - y0).data;
    for (let i = 0; i < d.length / 4; i++) if (d[i * 4 + 3] > solid) return y2 - (y0 + i) / k;
  }
  return null;
}

// 大的响动：几种音效上挂一个钩子，响的时候惊飞附近的鸟（声音关着也照样惊飞）。[离多远的鸟会飞, 每只飞的可能（鸟听惯了的响动就小一些）]
const AIR_NOISE = { press: [14, 0.45], bark: [9, 0.6], alarm: [12, 1], doorStop: [7, 0.8], splash: [7, 1], powerDown: [9, 1], powerUp: [6, 0.7], lever: [5, 1], clunk: [5, 1], cloth: [6, 1], land: [0, 1] };
function airNoise(kind, v) {
  let [r, p] = AIR_NOISE[kind], x = P.x;
  if (kind === 'land') r = v > 7 ? 5 : 0;
  if (kind === 'press') x = Math.abs(P.x - 101.9) < Math.abs(P.x - (X3 + 30.6)) ? 101.9 : X3 + 30.6;          // 两台压机：第一章的回收大厅、第三章围墙里
  if (kind === 'bark' && typeof CH3 !== 'undefined') x = CH3.DOG.x;
  if (r > 0 && state === 'play') for (const F of AIR_FLOCKS) F.scare(x, r, p);
}
for (const k in AIR_NOISE) { const f = sfx[k]; if (f) sfx[k] = (...a) => { airNoise(k, a[0]); return f(...a); }; }
