
// ============================================================
//  水里的小东西：跳进水里溅起的水花、被身子带下去的一大团气泡，在水下时嘴边冒出的气泡，浮在水面上时身边一道道散开的波纹
//  用的是空中细节那一套点（70-air.js 的 airCloud），贴图是自己的一小张；第一次用到时才建，挂在场景上，所有能游泳的水共用
//  每一处水可以自己定气泡和水花的颜色、亮度（跟着那里的光走）：water({ ..., fx: { c: 0xRRGGBB, k: 0..1 或者 lit(x, y) 这一点有多亮 } })，不写就是偏冷的白
// ============================================================
// 贴图集（4×4 格，每格 64 像素，全是白的）：0 圆点（水花、小气泡）  1 一道细长的亮痕（水面的波纹）  2 / 3 气泡：一圈亮边、里面淡淡的、左上一点高光（3 扁一些）
let WATER_TEX = null;
function waterTex() {
  if (WATER_TEX) return WATER_TEX;
  const [c, g] = mkCanvas(256, 256);
  const tile = (i, fn) => { g.save(); g.translate((i % 4) * 64 + 32, Math.floor(i / 4) * 64 + 32); g.scale(32, 32); fn(); g.restore(); };
  const soft = (x, y, r, a) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); for (const [t, k] of [[0, 1], [0.3, 0.85], [0.6, 0.28], [1, 0]]) gr.addColorStop(t, `rgba(255,255,255,${a * k})`); g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r); };
  tile(0, () => soft(0, 0, 0.92, 1));
  tile(1, () => { const gr = g.createLinearGradient(-0.9, 0, 0.9, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(0, 0, 0.9, 0.07, 0, 0, 6.2832); g.fill(); });
  const bubble = sq => {
    g.save(); g.scale(1, sq); const gr = g.createRadialGradient(0, 0, 0, 0, 0, 0.9);
    for (const [t, a] of [[0, 0.1], [0.55, 0.14], [0.76, 0.4], [0.87, 1], [0.94, 0.55], [1, 0]]) gr.addColorStop(t, `rgba(255,255,255,${a})`);
    g.fillStyle = gr; g.fillRect(-1, -1, 2, 2); g.restore(); soft(-0.3, -0.32 * sq, 0.3, 0.95);
  };
  tile(2, () => bubble(1)); tile(3, () => bubble(0.84));
  const t = sharedTex(canvasTex(c)); t.anisotropy = 1; return WATER_TEX = t;   // 所有的水共用这一张，哪一章卸载都不释放它
}

let WFX = null;
const _headP = new THREE.Vector3(), _bodyP = [0, 0];
function heroHead() {                                    // 主角头的位置（模型还没加载出来就按身体中点估一下）
  const b = hero.B.traveler?.bones?.get('Head');
  if (b) { b.node.getWorldPosition(_headP); return _headP; }
  return _headP.set(P.x + P.facing * 0.45, P.y + SWIM.c + 0.15, 0);
}
function heroBody(u) {                                   // 主角身上的一点 [x, y]：u = -1 脚，0 身体中点，1 头顶（游起来身子是斜的、平的）
  const a = hero.A.pitch || 0, c = SWIM.c;
  _bodyP[0] = P.x + Math.sin(a) * P.facing * u * c; _bodyP[1] = P.y + c + Math.cos(a) * u * c; return _bodyP;
}
function waterFx() {
  if (WFX) return WFX;
  const N = 520;
  const C = airCloud(scene, N, { add: true, order: 52, name: 'water', tex: waterTex(),
    init(s) { s.kind = 0; s.a = 0; s.y = -999; s.tile = 0; s.c = airCol(0xdfeff0); },
    step(s, dt) {
      if (!s.kind) { s.a = 0; return; }
      s.age += dt;
      if (s.kind === 1) {                                // 气泡：先被身子带着往下，水一拦就慢下来，然后一边晃一边往上冒（大的冒得快）；最小的那些冒不到水面，半路就散了
        s.vy += (s.vmax - s.vy) * Math.min(1, 3.2 * dt); s.vx *= Math.max(0, 1 - 3 * dt);
        s.x += (s.vx + Math.sin(T * s.f + s.ph) * s.wob) * dt; s.y += s.vy * dt;
        s.a = s.b * sstep(0, 0.06, s.age) * (1 - sstep(s.life - 0.4, s.life, s.age));
        if (s.y > s.top - 0.4 * s.size) {                // 冒到水面：破掉。大一些的留下一小圈波纹
          if (s.tile) Object.assign(s, { kind: 3, age: 0, y: s.top + 0.012, s0: s.size * 1.3, grow: 0.55, life: ar(0.25, 0.45), b: s.b * 0.55, tile: 1 }); else s.kind = 0;
        } else if (s.age > s.life || s.y > ceilY(s.x) - 0.03 || s.y < groundY(s.x)) s.kind = 0;   // 散了，或者碰到头顶的岩石、被带进潭底：没了
      } else if (s.kind === 2) {                         // 水花：往上一溅，落回水面（或者落到岸上）就没了，落到一半已经散得看不清。飞得快的时候顺着飞的方向拉成一道
        s.vy -= 16 * dt; s.x += s.vx * dt; s.y += s.vy * dt;
        if (s.vy < 0 && s.y < Math.max(s.y0, groundY(s.x))) s.kind = 0;
        s.rot = Math.atan2(s.vx, s.vy); s.flip = clamp(1 / (1 + 0.55 * Math.hypot(s.vx, s.vy)), 0.3, 1); s.a = s.b * (1 - 0.7 * sstep(0.3, 0.7, s.age));
      } else {                                           // 波纹：贴着水面往两边散开，越来越淡
        s.size = s.s0 + s.age * s.grow; s.a = s.b * (1 - sstep(0, s.life, s.age));
        if (s.age > s.life) s.kind = 0;
      }
      if (!s.kind) s.a = 0;
    } });
  let next = 0;
  const take = () => { for (let i = 0; i < N; i++) { const s = C.list[(next + i) % N]; if (!s.kind) { next = (next + i + 1) % N; return s; } } return null; };
  return WFX = { C, take, live: 0 };
}
const fxCol = (w, dflt) => airCol(w.fx?.c ?? dflt), fxK = (w, x, y) => w.fx?.lit ? w.fx.lit(x, y) : w.fx?.k ?? 0.8;
// 一颗气泡。r 画多大（米）：小的是一个亮点，大一些的看得出是一圈；o.vx / o.vy 一开始的速度，o.z 离镜头远近（主角在 0）
function bubbleAt(w, x, y, r, o = {}) {
  const s = waterFx().take(); if (!s) return;
  const ring = r >= 0.05;
  Object.assign(s, { kind: 1, age: 0, x, y, z: o.z ?? ar(-0.3, 0.4), vx: o.vx ?? ar(-0.25, 0.25), vy: o.vy ?? ar(-0.3, 0.1), vmax: (0.55 + r * 10) * ar(0.8, 1.25), f: ar(4, 9), ph: ar(0, 6.28), wob: ar(0.06, 0.2),
    size: ring ? r : r * 1.3, tile: ring ? (Math.random() < 0.5 ? 2 : 3) : 0, b: ar(0.35, 0.85) * fxK(w, x, y), life: ring ? 9 : ar(0.7, 2.2), top: w.y, rot: 0, flip: 1, c: fxCol(w, 0xd8ecee) });
  WFX.live = 3;
}
const bubbleSize = big => { const u = Math.random(); return u < 0.7 ? ar(0.024, 0.05) : u < 1 - 0.05 * big ? ar(0.05, 0.078) : ar(0.078, 0.105); };   // 多数是小的，少数大的；big 0..1 最大的那几颗有多少
function rippleAt(w, x, k) {
  const s = waterFx().take(); if (!s) return;
  Object.assign(s, { kind: 3, age: 0, x, y: w.y + 0.012, z: 0.35, s0: 0.25, size: 0.25, grow: 0.85, life: 0.8 + 0.6 * k, b: 0.4 * k * fxK(w, x, w.y), tile: 1, rot: 0, flip: 1, c: fxCol(w, 0xe0f0f0) });
  WFX.live = 3;
}
function splashAt(w, x, k = 1, bubbles = 0) {            // 水面上的那一下：溅起一把水花，散开一道波纹；bubbles 水面下面再翻起几颗气泡（爬上岸时腿带起来的）
  for (let i = 0, n = Math.round(14 + 26 * k); i < n; i++) {
    const s = waterFx().take(); if (!s) break;
    let dx = ar(-0.35, 0.35); if (groundY(x + dx) > w.y) dx = -dx;                    // 紧挨着岸：水花只从有水的这一边溅起来
    Object.assign(s, { kind: 2, age: 0, x: x + dx, y: w.y + 0.02, y0: w.y, z: ar(-0.4, 0.5), vx: ar(-1.3, 1.3), vy: ar(1.8, 5.0) * (0.45 + 0.65 * k), size: ar(0.05, 0.1), b: ar(0.45, 1) * fxK(w, x, w.y), tile: 0, rot: 0, flip: 1, c: fxCol(w, 0xe6f2f2) });
  }
  for (let i = 0; i < bubbles; i++) bubbleAt(w, x + ar(-0.35, 0.35), w.y - ar(0.1, 0.6), bubbleSize(0));
  rippleAt(w, x, 0.8);
}
// ---- 跳进水里：身子把空气带下去，翻成一团气泡 ----
// k 入水有多猛（0.25 滑进去 .. 1 从高处跳下来）。入水的一瞬间沿着身子从脚到水面冒出一大团；接着的半秒里人还在往下沉，
// 气泡不断从身上甩出来、留在后面往上冒；之后衣服里的空气再零零星星跑出来几颗
let plunge = null;
function plungeAt(w, k) {
  const feet = P.y - 0.1, vx0 = P.vx * 0.3;
  for (let i = 0, n = Math.round(16 + 54 * k); i < n; i++) {
    const u = Math.random(), y = lerp(feet, w.y - 0.04, u); let dx = (ar(-1, 1) + ar(-1, 1)) * (0.14 + 0.2 * k) * (0.5 + u);   // 越靠近水面散得越开
    if (groundY(P.x + dx) > y - 0.05) dx = -dx;                                       // 贴着岸壁下来的：岩石里不冒泡，都翻到水这一边
    bubbleAt(w, P.x + dx, y, bubbleSize(k), { vx: vx0 + ar(-1.1, 1.1), vy: -ar(0.2, 1) * (0.6 + 2.2 * k) });
  }
  plunge = { w, k, t: 0, n: 0 };
}
function stepPlunge(dt) {
  const p = plunge, w = p.w; p.t += dt;
  if (p.t > 2.4) { plunge = null; return; }
  p.n += p.k * (120 * Math.exp(-p.t / 0.25) + 7 * (1 - sstep(1, 2.4, p.t))) * dt;
  for (; p.n >= 1; p.n--) {
    const [x, y] = heroBody(ar(-1, 0.8)); if (y > w.y - 0.06) continue;
    bubbleAt(w, x + ar(-0.14, 0.14), y + ar(-0.08, 0.08), bubbleSize(p.k * Math.exp(-p.t / 0.4)) * (p.t > 0.7 ? 0.8 : 1), { vx: P.vx * 0.5 + ar(-0.35, 0.35), vy: P.vy * 0.6 + ar(-0.3, 0.3) });
  }
}
let bubT = 0, ripT = 0;
function stepWaterFx(dt) {
  if (P.mode === 'swim' && P.water && state === 'play') {
    const w = P.water;
    if (plunge) stepPlunge(dt);
    if (P.under) {                                       // 在水下：隔一会儿从嘴边冒一两个气泡；憋不住了冒得更勤
      bubT -= dt * (1 + 3 * sstep(0.55, 1, 1 - P.air / SWIM.breath));
      if (bubT <= 0) { const h = heroHead(); bubT = ar(0.3, 1.0); for (let i = 0, n = Math.random() < 0.3 ? 3 : 1; i < n; i++) bubbleAt(w, h.x + P.facing * 0.1, h.y + i * 0.06, ar(0.03, 0.06), { z: ar(0.1, 0.3) }); fx('blub'); }
    } else {                                             // 浮在水面上：身边一道道波纹
      ripT -= dt * (0.6 + Math.min(1.5, Math.abs(P.vx))); if (ripT <= 0) { ripT = 0.55; rippleAt(w, P.x + ar(-0.2, 0.2), 0.6); }
    }
  } else plunge = null;
  if (WFX && WFX.live > 0) { WFX.C.step(dt); if (!WFX.C.list.some(s => s.kind)) WFX.live -= dt; }
}
