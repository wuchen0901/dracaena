
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
  P.mode = 'mantle'; P.modeT = 0; P.vx = P.vy = 0; P.facing = side; P.land = null; fx('grab');
}
function startLand() {                            // 落地：落差够大，就按情况挑一种落地的动作（挑法、动作和拖住玩家多久，见 42-character-anim.js 的 landStyle / landAt）
  const k = landHard(P.impact);
  P.land = k > 0.02 ? { t: 0, k, v: P.vx, dir: Math.sign(P.vx) || P.facing, style: landStyle(P.impact, P.vx) } : null;
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

  if (P.mode === 'swim') { stepSwim(dt, d); return; }   // 在水里：见下面的“游泳”

  // ---- 普通状态 ----
  // 从高处落地以后的一小会儿：lh 被拖住多少（蹲着走不快、跳不起来），lp 被惯性带着往前的速度，lc 这时按键能管几成
  let lh = 0, lp = null, lc = 1;
  if (P.land) { const L = P.land; L.t += dt * (d && L.t > 0.15 && L.style < 3 ? 1.35 : 1); const l = landAt(L); if (l.done) P.land = null; else { lh = l.hold; lp = l.push; lc = l.ctl; } }   // 按着方向键就起身快一些
  const speed = (keys.has('S') || !ctl ? WALK : RUN) * P.speedK * (1 - lh);
  P.vx = damp(P.vx, lp === null ? d * speed : lerp(lp, d * speed, lc), P.grounded ? (d || lp !== null ? 9 : 14) : 3.5, dt);
  if (d && lc > 0.5) { P.facing = d; P.moved = true; }
  if (Math.abs(P.vx) < 0.02 && !d && lp === null) P.vx = 0;

  if (P.jumpBuf > 0 && (P.grounded || P.coyote > 0) && P.speedK > 0.5 && lh < 0.35 && lc > 0.5) {
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
  if (ceilY(nx) < P.y + P.hh && ceilY(nx) < ceilY(P.x)) { nx = P.x; P.vx = 0; }      // 洞顶压下来，挡在前面
  P.x = nx;

  // 垂直方向：贴地行走，或者受重力下落
  const f = floorY(P.x, P.y);
  if (P.grounded) {
    if (f < P.y - 0.3) { P.grounded = false; P.coyote = 0.1; P.gy = P.y; } else P.y = f;
  }
  if (!P.grounded) {
    P.vy -= GRAV * dt; const ny = P.y + P.vy * dt;
    if (P.vy <= 0 && ny <= f) { P.y = f; P.impact = -P.vy; P.vy = 0; P.grounded = true; fx('land', P.impact); startLand(); }
    else P.y = ny;
  } else { P.vy = 0; P.gy = P.y; }
  const cTop = ceilY(P.x); if (P.y + P.hh > cTop) { P.y = Math.max(f, cTop - P.hh); if (P.vy > 0) P.vy = 0; }   // 头顶碰到洞顶
  const wt = waterAt(P.x); if (wt && P.y < wt.y - SWIM.enter) { enterSwim(wt); return; }     // 掉进能游泳的水里

  // 抓住可以推拉的东西 / 操作机关
  if (ctl && P.grounded && keys.has('E')) {
    const g = findGrab();
    if (g) { P.mode = 'push'; P.grabObj = g[0]; P.grab = g[1]; P.facing = g[1]; g[0].v = 0; P.land = null; }
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
  Object.assign(P, { x, vx: 0, vy: 0, grounded: true, mode: 'normal', facing: 1, grabObj: null, mantle: null, speedK: 1, water: null, air: SWIM.breath, land: null });
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

// ============================================================
//  游泳：掉进登记过的水（water()）里就游起来
//  ← → 游，空格 / ↑ 往上，↓ 往下潜，斜着按就斜着游；什么都不按就慢慢浮上去，浮到水面上头露出来、踩着水。
//  在水面上往岸边游（或者按空格），岸不太高就撑上去。憋气有限：在水下待太久，画面暗下去，回到存档点
// ============================================================
// v / vTop 水下 / 水面上游多快，rise 不按键时往上浮多快，r 身体当成多大的圆，c 身体中点离脚底多高，top 浮在水面上时中点在水面下多深，
// enter 脚比水面低这么多就算掉进水里，reach 岸比水面高多少还撑得上去，breath 一口气能憋多少秒
const SWIM = { v: 1.7, vTop: 1.3, acc: 3.2, stop: 2.4, rise: 0.3, r: 0.3, c: 0.6, top: 0.5, enter: 0.85, reach: 1.05, breath: 24 };
function swimHit(x, cy) {                            // 身体中点在 (x, cy) 时会不会碰到地面、洞顶、方块
  const r = SWIM.r;
  for (const dx of [-0.8 * r, 0, 0.8 * r]) { if (groundY(x + dx) > cy - r) return true; if (ceilY(x + dx) < cy + 0.7 * r) return true; }
  for (const s of SOLIDS) if (!s.off && x + r > s.x1 && x - r < s.x2 && cy + r > s.y1 && cy - r < s.y2) return true;
  return false;
}
function enterSwim(w) {
  const vy = P.vy;
  Object.assign(P, { mode: 'swim', water: w, grounded: false, coyote: 0, jumpBuf: 0, stroke: 0.55, land: null });
  P.vy = clamp(vy * 0.3, -2.2, 0); P.vx *= 0.6;
  fx('splash', clamp(-vy / 8, 0.35, 1)); splashAt(P.x, w.y, clamp(-vy / 9, 0.25, 1));
}
// 在水面上往 side 那边找岸：地面从水里冒出来、又不太高（撑得上去），岸上头顶也够高（上去站得直）
function climbOut(w, side, cx) {
  for (let k = 0.1; k <= 0.75; k += 0.05) {
    const x = cx + side * k; if (groundY(x) <= w.y + 0.02) continue;
    let top = -Infinity; for (let j = 0; j <= 0.6; j += 0.05) top = Math.max(top, groundY(x + side * j));
    if (top - w.y > SWIM.reach || ceilY(x + side * 0.45) < top + P.H + 0.05) return false;
    let e = x; for (let n = 0; n < 80 && groundY(e) < top - 0.04; n++) e += side * 0.01;
    P.water = null; startMantle(side > 0 ? { x1: e, x2: e + 1, y2: top } : { x1: e - 1, x2: e, y2: top }, side); P.mantle.T = 0.9;
    fx('wade'); splashAt(cx + side * 0.2, w.y, 0.35);
    return true;
  }
  return false;
}
function stepSwim(dt, d) {
  const w = P.water, dy = ctl ? (keys.has('J') ? 1 : 0) - (keys.has('DOWN') ? 1 : 0) : 0, topY = w.y - SWIM.top;
  if (swimHit(P.x, P.y + SWIM.c)) {                  // 卡进了岩石（刚掉进水里时贴着岸边）：挪到最近的空处
    const c0 = P.y + SWIM.c; let ok = false;
    for (let r = 0.05; r <= 1.2 && !ok; r += 0.05) for (const [dx, dy_] of [[r, 0], [-r, 0], [0, -r], [0.7 * r, -0.7 * r], [-0.7 * r, -0.7 * r], [0, r]]) {
      const ny = Math.min(c0 + dy_, topY); if (!swimHit(P.x + dx, ny)) { P.x += dx; P.y = ny - SWIM.c; ok = true; break; }
    }
  }
  const cx = P.x, cy = P.y + SWIM.c, atTop = cy > topY - 0.06;
  let tx = d, ty = dy; const n = Math.hypot(tx, ty); if (n > 1) { tx /= n; ty /= n; }
  const sp = atTop && dy <= 0 ? SWIM.vTop : SWIM.v, surge = 0.75 + 0.5 * sstep(0.35, 0.5, P.stroke) * (1 - sstep(0.6, 0.95, P.stroke));   // 蹬腿的那一下往前冲
  P.vx = damp(P.vx, tx * sp * surge, d ? SWIM.acc : SWIM.stop, dt);
  P.vy = damp(P.vy, dy ? ty * sp * surge : SWIM.rise, dy ? SWIM.acc : 1.3, dt);
  if (d) P.facing = d;
  const moving = Math.abs(P.vx) + Math.abs(P.vy) > 0.3, panic = sstep(0.55, 1, 1 - P.air / SWIM.breath);
  P.stroke = (P.stroke + dt * (moving ? 0.8 : atTop ? 0.65 : 0.4) * (1 + 0.8 * panic)) % 1;
  // 先横着走，再竖着走，各自碰到东西就停
  let nx = cx + P.vx * dt;
  if (swimHit(nx, cy)) { if (atTop && d && climbOut(w, d, cx)) return; nx = cx; P.vx = 0; }
  let ny = Math.min(cy + P.vy * dt, topY);
  if (swimHit(nx, ny)) { ny = cy; P.vy = 0; }
  if (ny >= topY - 1e-4 && P.vy > 0) P.vy = 0;
  P.x = nx; P.y = ny - SWIM.c;
  if (atTop && ctl && pressed.has('J') && climbOut(w, P.facing, nx)) return;
  // 憋气：头在水下就一点点用掉，露出水面很快就缓过来
  P.under = ny < topY - 0.15;
  P.air = P.under ? P.air - dt : Math.min(SWIM.breath, P.air + dt * 6);
  if (P.air <= 0 && state === 'play') drown();
}
function drown() {                                   // 憋不住了：黑下去，回到最近的存档点（解开的东西都保留）
  fx('fall');
  fadeOut(() => { const c = CPS[P.cp]; placePlayer(c.x, c.y); for (const z of ZONES) if (z.respawn) z.respawn(c); snapCamera(); }, 1.0);
}
// 憋气快到头了：画面一点点暗下去（借用黑场那一层）
let breathDark = 0;
function stepBreath() {
  if (state !== 'play') { breathDark = 0; return; }
  const k = P.mode === 'swim' ? sstep(0.6, 1, 1 - P.air / SWIM.breath) : 0;
  if (Math.abs(k - breathDark) > 0.01 || (k === 0 && breathDark > 0)) { breathDark = k; $('fade').style.opacity = (0.75 * k).toFixed(3); }
}
