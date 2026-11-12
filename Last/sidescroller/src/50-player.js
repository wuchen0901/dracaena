
// ============================================================
//  玩家控制：移动 / 跳跃 / 攀爬 / 推拉 / 操作机关 / 回到存档点
// ============================================================
const GRAV = 23, JUMP_V = 7.5, RUN = 3.3, WALK = 1.25, PUSH = 1.25;
let hero = makeCharacter('K'), state = 'title', T = 0, ctl = true, autoDir = 0;
const sfx = {};                                   // 音效函数在后面的音频部分填进来
const fx = (name, ...a) => { if (sfx[name]) sfx[name](...a); };
function fitHero() { P.H = hero.H; P.hh = hero.H * 0.9; }
fitHero();
function setSkin(k) {
  if (hero.kind !== k) { const prev = hero; prev.dispose(); hero = makeCharacter(k, prev); fitHero(); }
  document.querySelectorAll('#skins button').forEach(b => b.classList.toggle('on', b.dataset.k === hero.kind));
}

function rebuildHero() { const prev = hero; prev.dispose(); hero = makeCharacter(prev.kind, prev); fitHero(); }   // 同一个外形重新搭一遍（换了腿脚之类）

function startMantle(s, side) {                   // 抓住方块 s 的边缘翻上去；side = 1 表示方块在右边
  const ex = side > 0 ? s.x1 : s.x2, h = s.y2 - P.y;
  P.mantle = { x0: P.x, y0: P.y, x1: ex + side * (P.hw + 0.12), top: s.y2, ex, s, T: 0.5 + 0.3 * clamp(h / 1.5, 0, 1) };
  P.mode = 'mantle'; P.modeT = 0; P.vx = P.vy = 0; P.facing = side; fx('grab');
}
function findUse() {                              // 脚边够得着、现在能用的机关
  let best = null, bd = 1e9;
  for (const u of USES) {
    const d = Math.abs(P.x - u.x);
    if (d < (u.r ?? 0.95) && d < bd && P.y >= (u.y0 ?? -1e9) && P.y <= (u.y1 ?? 1e9) && (!u.can || u.can())) { best = u; bd = d; }
  }
  return best;
}
function findGrab() {                             // 身前或身后紧挨着的、可以推拉的东西
  for (const o of PUSHABLES) {
    if (o.locked || o.off || Math.abs(P.y - o.y1) > 0.06) continue;
    const gr = o.x1 - (P.x + P.hw), gl = (P.x - P.hw) - o.x2;
    if (gr > -0.06 && gr < 0.45) return [o, 1];
    if (gl > -0.06 && gl < 0.45) return [o, -1];
  }
  return null;
}

function stepPlayer(dt) {
  const d = ctl ? (keys.has('R') ? 1 : 0) - (keys.has('L') ? 1 : 0) : autoDir;      // autoDir：过场时自动往前走
  P.impact = 0;
  if (ctl && pressed.has('J')) P.jumpBuf = 0.13;
  P.jumpBuf -= dt; P.coyote -= dt;

  if (P.mode === 'mantle') {                      // 攀爬是一段固定的动作：先向上，再翻过去
    const m = P.mantle; P.modeT += dt; const k = P.modeT / m.T, e = sstep(0, 1, Math.min(1, k / 0.8));
    m.top = m.s.y2;                               // 边缘自己在动（漂着的木梁）：跟着它
    P.y = lerp(m.y0, m.top, e); P.x = lerp(m.x0, m.x1, sstep(0.45, 1, k));
    if (k >= 1) { P.mode = 'normal'; P.grounded = true; P.y = m.top; P.vy = 0; P.coyote = 0; }
    return;
  }

  if (P.mode === 'push') {                        // 抓着东西：人和它一起慢慢移动
    const o = P.grabObj, side = P.grab, want = (side > 0 ? o.x1 : o.x2) - side * (P.hw + 0.2);
    if (!keys.has('E') || !ctl || !P.grounded || o.locked) { P.mode = 'normal'; o.v = 0; return; }
    o.v = damp(o.v, d * PUSH, 7, dt);
    let nx = clamp(o.x + o.v * dt, o.lo ? o.lo() : o.min, o.hi ? o.hi() : o.max), dx = nx - o.x;
    o.off = true; if (sideHit(P.x + dx, P.y)) dx = 0; o.off = false;         // 人被别的东西挡住，它也就拉不动了
    if (dx === 0) o.v = damp(o.v, 0, 20, dt);
    o.x += dx; syncBox(o);
    P.x = damp(P.x + dx, want + dx, 14, dt); P.vx = dx / dt; P.facing = side;
    if (Math.abs(dx) > 1e-5) P.pushed = true;
    return;
  }

  // ---- 普通状态 ----
  const speed = (keys.has('S') || !ctl ? WALK : RUN) * P.speedK;
  P.vx = damp(P.vx, d * speed, P.grounded ? (d ? 9 : 14) : 3.5, dt);
  if (d) { P.facing = d; P.moved = true; }
  if (Math.abs(P.vx) < 0.02 && !d) P.vx = 0;

  if (P.jumpBuf > 0 && (P.grounded || P.coyote > 0) && P.speedK > 0.5) {
    P.vy = JUMP_V; P.grounded = false; P.jumpBuf = 0; P.coyote = 0; P.jumped = true; fx('jump');
  }
  if (!P.grounded && P.vy > 0 && !(ctl && keys.has('J'))) P.vy -= GRAV * 1.3 * dt;   // 松开跳跃键就跳得矮一些

  // 水平移动，被方块侧面挡住
  let nx = P.x + P.vx * dt; const hit = sideHit(nx, P.y);
  if (hit) {
    const side = P.vx > 0 ? 1 : -1;
    nx = side > 0 ? hit.x1 - P.hw - 1e-3 : hit.x2 + P.hw + 1e-3;
    const h = hit.y2 - P.y;                      // 腾空时贴着墙、够得着边缘就攀上去
    if (!P.grounded && d === side && h > 0.25 && h < 1.2 * P.H && P.vy < 4.5 && hit.x2 - hit.x1 > 0.6 && !hit.noclimb) { P.x = nx; startMantle(hit, side); return; }
    P.vx = 0;
  }
  P.x = nx;

  // 垂直方向：贴地行走，或者受重力下落
  const f = floorY(P.x, P.y);
  if (P.grounded) {
    if (f < P.y - 0.3) { P.grounded = false; P.coyote = 0.1; P.gy = P.y; } else P.y = f;
  }
  if (!P.grounded) {
    P.vy -= GRAV * dt; const ny = P.y + P.vy * dt;
    if (P.vy <= 0 && ny <= f) { P.y = f; P.impact = -P.vy; P.vy = 0; P.grounded = true; fx('land', P.impact); }
    else P.y = ny;
  } else { P.vy = 0; P.gy = P.y; }

  // 抓住可以推拉的东西 / 操作机关
  if (ctl && P.grounded && keys.has('E')) {
    const g = findGrab();
    if (g) { P.mode = 'push'; P.grabObj = g[0]; P.grab = g[1]; P.facing = g[1]; g[0].v = 0; }
    else if (pressed.has('E')) { const u = findUse(); if (u) { P.used = true; u.on(u); } }
  }
  for (let i = CPS.length - 1; i > P.cp; i--) if (P.grounded && P.x >= CPS[i].x) { P.cp = i; break; }
}

// ---- 闸门：匀速开关；有人站在门洞里就先不落下来 ----
function stepGates(dt) {
  for (const g of GATES) {
    if (g.open === g.want) continue;
    if (g.want < g.open && P.x + P.hw > g.x1 - 0.05 && P.x - P.hw < g.x2 + 0.05 && P.y < g.y2) continue;
    const was = g.open; g.open = approach(g.open, g.want, dt / g.T); g.y1 = g.y0 + g.open * (g.h + 0.15);
    if (was !== g.open && (g.open === 1 || g.open === 0) && Math.abs(g.x - P.x) < 40) fx('doorStop');
  }
}

// ---- 回到最近的存档点：黑屏一下再亮起来。已经解开的机关都保留 ----
let fadeT = 0, fadeThen = null;
function fadeOut(then, hold = 1.1) { if (state === 'fade') return; state = 'fade'; fadeT = hold; fadeThen = then; ctl = false; $('fade').style.opacity = 1; }
function stepFade(dt) {
  if (state !== 'fade') return;
  fadeT -= dt; if (fadeT > 0) return;
  const f = fadeThen; fadeThen = null; state = 'play'; ctl = true; $('fade').style.opacity = 0; if (f) f();
}
function placePlayer(x, y) {
  Object.assign(P, { x, vx: 0, vy: 0, grounded: true, mode: 'normal', facing: 1, grabObj: null, mantle: null, speedK: 1 });
  P.y = y ?? floorY(x, 60); P.gy = P.y;
}
function respawn() {
  fadeOut(() => {
    const c = CPS[P.cp]; placePlayer(c.x, c.y);
    for (const z of ZONES) if (z.respawn) z.respawn(c);
    if (CAT.state === 'follow') catPlace(P.x - 0.8, floorY(P.x - 0.8, P.y + 0.1));
    snapCamera();
  });
}
function stepPits() {                              // 掉进水里或者坑里：回到岸上
  if (state !== 'play') return;
  for (const p of PITS) if (P.x > p.x1 && P.x < p.x2 && P.y < (typeof p.y === 'function' ? p.y() : p.y) && (!p.when || p.when())) {
    fx(p.sfx ?? 'fall'); if (p.on) p.on();
    const bx_ = p.back ? p.back() : null;
    fadeOut(() => { if (bx_ === null) { const c = CPS[P.cp]; placePlayer(c.x, c.y); } else placePlayer(bx_); for (const z of ZONES) if (z.respawn) z.respawn(CPS[P.cp]);
      if (CAT.state === 'follow') catPlace(P.x - 0.8, floorY(P.x - 0.8, P.y + 0.1)); snapCamera(); }, 0.9);
    return;
  }
}
