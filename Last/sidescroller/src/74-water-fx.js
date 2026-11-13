
// ============================================================
//  水里的小东西：主角嘴边冒出的气泡、跳进水里溅起的水花和一团气泡、浮在水面上时身边一道道散开的波纹
//  用的是空中细节那一套点（70-air.js 的 airCloud），第一次用到时才建，挂在场景上，所有能游泳的水共用
// ============================================================
let WFX = null;
const _headP = new THREE.Vector3();
function heroHead() {                                    // 主角头的位置（模型还没加载出来就按身体中点估一下）
  const b = hero.B.traveler?.bones?.get('Head');
  if (b) { b.node.getWorldPosition(_headP); return _headP; }
  return _headP.set(P.x + P.facing * 0.45, P.y + SWIM.c + 0.15, 0);
}
function waterFx() {
  if (WFX) return WFX;
  const N = 260;
  const C = airCloud(scene, N, { add: true, order: 52, name: 'water',
    init(s) { s.kind = 0; s.a = 0; s.y = -999; s.tile = 0; s.c = airCol(0xdfeff0); },
    step(s, dt) {
      if (!s.kind) { s.a = 0; return; }
      s.age += dt;
      if (s.kind === 1) {                                // 气泡：一边晃一边往上冒，碰到水面（或者头顶的岩石）就没了
        s.vy = Math.min(s.vy + 1.8 * dt, s.vmax); s.y += s.vy * dt; s.x += (Math.sin(T * s.f + s.ph) * 0.14 + s.vx) * dt; s.vx *= 1 - 2 * dt;
        if (s.y > Math.min(s.top, ceilY(s.x)) - 0.03) s.kind = 0;
        s.a = s.b * sstep(0, 0.06, s.age);
      } else if (s.kind === 2) {                         // 水花：往上一溅，落回水面就没了
        s.vy -= 9.8 * dt; s.x += s.vx * dt; s.y += s.vy * dt;
        if (s.vy < 0 && s.y < s.y0) s.kind = 0;
        s.a = s.b;
      } else {                                           // 波纹：贴着水面往两边散开，越来越淡
        s.size = s.s0 + s.age * 0.85; s.a = s.b * (1 - sstep(0, s.life, s.age));
        if (s.age > s.life) s.kind = 0;
      }
      if (!s.kind) s.a = 0;
    } });
  let next = 0;
  const take = () => { for (let i = 0; i < N; i++) { const s = C.list[(next + i) % N]; if (!s.kind) { next = (next + i + 1) % N; return s; } } return null; };
  return WFX = { C, take, live: 0 };
}
function bubbleAt(x, y, top, r) {
  const s = waterFx().take(); if (!s) return;
  Object.assign(s, { kind: 1, age: 0, x, y, z: ar(-0.15, 0.25), vx: ar(-0.25, 0.25), vy: ar(-0.3, 0.1), vmax: 0.4 + r * 7, f: ar(5, 9), ph: ar(0, 6.28), size: r, b: ar(0.4, 0.8), tile: 0, rot: 0, flip: 1, top, c: airCol(0xd8ecee) });
  WFX.live = 3;
}
function rippleAt(x, y, k) {
  const s = waterFx().take(); if (!s) return;
  Object.assign(s, { kind: 3, age: 0, x, y: y + 0.012, z: 0.35, s0: 0.25, size: 0.25, life: 0.8 + 0.6 * k, b: 0.32 * k, tile: 1, rot: 0, flip: 1, c: airCol(0xe0f0f0) });
  WFX.live = 3;
}
function splashAt(x, y, k = 1) {                         // 跳进水里：溅起一把水花，水下翻起一团气泡，水面散开一道波纹
  for (let i = 0, n = Math.round(14 + 26 * k); i < n; i++) {
    const s = waterFx().take(); if (!s) break;
    Object.assign(s, { kind: 2, age: 0, x: x + ar(-0.35, 0.35), y: y + 0.02, y0: y, z: ar(-0.4, 0.5), vx: ar(-1.3, 1.3), vy: ar(1.4, 4.0) * (0.45 + 0.65 * k), size: ar(0.025, 0.06), b: ar(0.35, 0.8), tile: 0, rot: 0, flip: 1, c: airCol(0xe6f2f2) });
  }
  for (let i = 0, n = Math.round(8 + 30 * k); i < n; i++) bubbleAt(x + ar(-0.45, 0.45), y - ar(0.15, 0.3 + 1.3 * k), y, ar(0.02, 0.07));
  rippleAt(x, y, 0.8);
  WFX.live = 3;
}
let bubT = 0, ripT = 0;
function stepWaterFx(dt) {
  if (P.mode === 'swim' && P.water && state === 'play') {
    const w = P.water;
    if (P.under) {                                       // 在水下：隔一会儿从嘴边冒一两个气泡；憋不住了冒得更勤
      bubT -= dt * (1 + 3 * sstep(0.55, 1, 1 - P.air / SWIM.breath));
      if (bubT <= 0) { const h = heroHead(); bubT = ar(0.3, 1.0); for (let i = 0, n = Math.random() < 0.3 ? 3 : 1; i < n; i++) bubbleAt(h.x + P.facing * 0.1, h.y + i * 0.05, w.y, ar(0.015, 0.04)); fx('blub'); }
    } else {                                             // 浮在水面上：身边一道道波纹
      ripT -= dt * (0.6 + Math.min(1.5, Math.abs(P.vx))); if (ripT <= 0) { ripT = 0.55; rippleAt(P.x + ar(-0.2, 0.2), w.y, 0.6); }
    }
  }
  if (WFX && WFX.live > 0) { WFX.C.step(dt); if (!WFX.C.list.some(s => s.kind)) WFX.live -= dt; }
}
