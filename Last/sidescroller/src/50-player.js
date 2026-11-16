
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
// ---- 按住型机关：按住 E 一点点推进，松手就往回退，推到头才算数（《长夜》机房的检修柄、拧灯、拉闸三处共用）----
// { x 站在哪里够得着, r 左右多远, can() 现在能不能用, rate(k) 按住时每秒推进多少（随推到哪里变：前半程快、后半程慢）,
//   back(k) 松手以后每秒退多少, done(o) 推到头时调一次（之后 locked，不再退回）, keep 推到头也不算数（小窗：按着就停在头上，一松手照样回去）}
// k 现在推到哪（0..1），on 这一刻有没有人按着
const HOLDS = [];
function holdable(o) { o.k = 0; o.on = false; o.locked = false; HOLDS.push(o); return o; }
function findHold() {
  let best = null, bd = 1e9;
  for (const o of HOLDS) { const d = Math.abs(P.x - o.x); if (!o.locked && d < (o.r ?? 0.8) && d < bd && (!o.can || o.can())) { best = o; bd = d; } }
  return best;
}
function stepHolds(dt) {                          // 没人按着的就往回退
  for (const o of HOLDS) if (!o.on && !o.locked && o.k > 0) o.k = Math.max(0, o.k - (o.back ? o.back(o.k) : 1) * dt);
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

// ============================================================
//  累：爬坡爬久了、连续跑太久，人就累了 —— 慢下来、弓着腰走，时不时停下来撑着膝盖喘口气、抹一下汗、抬头望一眼坡顶、脚下绊一下
//  F 疲劳 0..1：往上爬按爬高了多少涨（跑着爬比走着爬涨得快）；一直按着跑、跑上半分钟左右也开始涨（runT：这一口气跑了多久，停下来喘过气就重新算）；
//    停下来喘气、站着缓得最快，平地上慢慢走缓得慢些，刚开始跑的那二十来秒也在缓；还在往上爬、或者跑太久了还硬撑着跑的时候缓不过来。回到存档点就缓过来了
//  k 累的样子有多重：F 过了三成五开始有，过了八成五就是累透了；被追的时候（rushT > 0，章节里每帧给它续上）顾不上累
//  三种走法（见 42-character-anim.js 的 TIRED_GAIT）组合着用：每回累起来随机挑“弓背低头”或者“拖着脚”为主，走一阵会换；
//    坡陡的地方（多数时候）两手按到大腿上去
//  四个小动作随机出现，一次只做一样：走着走着停下来撑着膝盖喘气（只在地面上，不在箱子、木梁上）、抹额头、抬头望坡顶（只在上坡）、
//    脚尖绊一下（累透了才有）；站着不动的时候也是撑着膝盖喘，隔一会儿抬头往前看一眼
// ============================================================
const TIRED = { F: 0, k: 0, runT: 0, idleT: 0, ep: false, gait: 0, gaitT: 0, steep: true, mix: [1, 0, 0],
  rest: 0, restT: -1, restD: 0, wipeT: -1, lookT: -1, stbT: -1, nRest: 0, nWipe: 0, nLook: 0, nStb: 0, half: 0, rushT: 0, seed: 20261113, fixF: -1 };
function trand() { TIRED.seed = TIRED.seed * 16807 % 2147483647; return TIRED.seed / 2147483647; }   // 自己的随机数：画面图设好种子，拍出来每次一样
function resetTired() { Object.assign(TIRED, { F: 0, k: 0, runT: 0, idleT: 0, ep: false, rest: 0, restT: -1, wipeT: -1, lookT: -1, stbT: -1, rushT: 0 }); }
function stepTired(dt, d) {
  const T = TIRED, ground = P.grounded && P.mode === 'normal', sp = Math.abs(P.vx);
  const slope = ground ? groundSlope(P.x) : 0, up = slope * (d || P.facing), climb = Math.max(0, P.vx * slope);   // up：朝着走的方向坡往上多陡；climb：每秒爬高多少米
  const onTerrain = ground && P.y - groundY(P.x) < 0.02, fast = ground && sp > 2.2;
  const pushing = ground && d && sp > 0.25 && ctl && !keys.has('S');   // 想跑：按着方向键、没按 Shift（过场里自己走的时候不算）
  T.rushT = Math.max(0, T.rushT - dt);
  T.runT = T.rest ? 0 : pushing ? T.runT + dt : Math.max(0, T.runT - (sp < 0.1 || P.mode !== 'normal' ? 3 : 1) * dt);   // 推箱子、攀爬、游泳的时候不算在跑
  T.idleT = ground && sp < 0.1 && !d ? T.idleT + dt : 0;
  const gain = climb * (fast ? 0.45 : 0.33) + 0.07 * sstep(25, 35, T.runT);
  const rec = !ground ? 0 : T.rest || sp < 0.1 ? 0.12 : climb > 0.02 ? 0 : (fast ? 0.04 : 0.07) * (1 - sstep(23, 27, T.runT));   // 跑得太久还硬撑着跑：走着也缓不过来，得停下来
  T.F = T.fixF >= 0 ? T.fixF : clamp(T.F + (gain - rec) * dt, 0, 1);
  const want = T.rushT > 0 ? 0 : sstep(0.35, 0.85, T.F);
  T.k = damp(T.k, want, want > T.k ? 1.0 : T.rushT > 0 ? 5 : 0.8, dt);
  // 一回累：开始的时候随机挑主要的走法、各个小动作第一次出现的时间；走一阵换一种走法
  if (!T.ep && T.k > 0.06) {
    T.ep = true; T.gait = trand() < 0.6 ? 0 : 2; T.gaitT = 8 + 6 * trand(); T.steep = trand() < 0.75;
    T.nRest = 4 + 4 * trand(); T.nWipe = 3 + 5 * trand(); T.nLook = 2 + 3 * trand(); T.nStb = 6 + 6 * trand();
  }
  if (T.ep && T.k < 0.03 && !T.rest) T.ep = false;
  if (T.ep && (T.gaitT -= dt) < 0) { T.gait = 2 - T.gait; T.gaitT = 7 + 7 * trand(); }
  const thigh = T.steep ? sstep(0.1, 0.18, up) * sstep(0.45, 0.85, T.k) : 0;
  for (let i = 0; i < 3; i++) T.mix[i] = damp(T.mix[i], (i === T.gait ? 1 - thigh : 0) + (i === 1 ? thigh : 0), 1.6, dt);
  // 小动作：时间往前走，做完了清掉
  if (T.wipeT >= 0 && (T.wipeT += dt) > 1.5) T.wipeT = -1;
  if (T.lookT >= 0 && (T.lookT += dt) > 2.4) T.lookT = -1;
  if (T.stbT >= 0 && (T.stbT += dt) > 0.75) T.stbT = -1;
  if (T.restT >= 0) {                                                  // 走着走着停下来喘气：到点了接着走，起身之前抬头看一眼前面
    T.restT += dt;
    if (T.restT > T.restD - 1.3 && T.lookT < 0) T.lookT = 0;
    if (T.restT > T.restD || !ground) { T.restT = -1; T.rest = 0; }
  } else if (T.rest && (d || !ground || T.k < 0.2)) T.rest = 0;        // 站着喘气：一动就起身
  const busy = T.rest || T.wipeT >= 0 || T.lookT >= 0 || T.stbT >= 0;
  const half = Math.floor(hero.A.ph * 2), step = half !== T.half; T.half = half;   // step：刚好踩下一步
  if (T.ep && T.k > 0.45 && T.rushT <= 0) {
    if (ground && sp > 0.25 && d) {
      if ((T.nRest -= dt) < 0 && !busy && onTerrain && T.k > 0.6) { T.rest = 1; T.restT = 0; T.restD = 2.2 + 1.2 * trand(); T.nRest = 9 + 7 * trand(); }
      else if ((T.nWipe -= dt) < 0 && !busy && T.mix[1] < 0.3) { T.wipeT = 0; T.nWipe = 8 + 6 * trand(); }   // 两手按着大腿的时候腾不出手
      else if ((T.nLook -= dt) < 0 && !busy && up > 0.04) { T.lookT = 0; T.nLook = 6 + 6 * trand(); }
      else if ((T.nStb -= dt) < 0 && !busy && step && onTerrain && T.k > 0.75) { T.stbT = 0; T.nStb = (T.mix[2] > 0.5 ? 6 : 10) + 8 * trand(); }
    } else if (ground && sp < 0.1 && !d && T.idleT > 0.35 && !busy) T.rest = 1;
    if (T.rest && T.restT < 0 && T.lookT < 0 && (T.nLook -= dt) < 0) { T.lookT = 0; T.nLook = 3 + 3 * trand(); }
  }
}

function stepPlayer(dt) {
  const d = ctl ? (keys.has('R') ? 1 : 0) - (keys.has('L') ? 1 : 0) : autoDir;      // autoDir：过场时自动往前走
  P.impact = 0;
  stepTired(dt, d);
  if (ctl && pressed.has('J')) P.jumpBuf = 0.13;
  P.jumpBuf -= dt; P.coyote -= dt;
  P.ropeCD = Math.max(0, (P.ropeCD || 0) - dt);
  if (P.mode !== 'rope' && P.rope) { P.rope.held = false; P.rope = null; }      // 回到存档点、换章节时还抓着绳子：放开

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

  if (P.mode === 'hold') {                        // 按着按住型机关：人站住不动，手搭在上面（手放在哪由章节给，见 HX.pose.hands）
    const o = P.holdObj;
    if (!keys.has('E') || !ctl || o.locked || (o.can && !o.can())) { P.mode = 'normal'; o.on = false; return; }
    o.on = true; o.k = Math.min(1, o.k + o.rate(o.k) * dt); P.vx = 0;
    if (o.face) P.facing = o.face;
    if (o.stand !== undefined) P.x = damp(P.x, o.stand, 10, dt);
    if (o.k >= 1 && !o.keep) { o.locked = true; o.on = false; P.mode = 'normal'; if (o.done) o.done(o); }
    return;
  }
  if (P.mode === 'swim') {
    if (ctl && pressed.has('E')) { const u = findUse(); if (u) { P.used = true; u.on(u); } }
    stepSwim(dt, d); return; }   // 在水里：见下面的“游泳”
  if (P.mode === 'rope') { stepRope(dt, d); return; }   // 抓着绳子：见 51-rope.js

  // ---- 普通状态 ----
  const y0 = P.y;                                 // 这一步开始时脚的高度：下面入水的时候，要看这一步实际降了多少
  // 从高处落地以后的一小会儿：lh 被拖住多少（蹲着走不快、跳不起来），lp 被惯性带着往前的速度，lc 这时按键能管几成
  let lh = 0, lp = null, lc = 1;
  if (P.land) { const L = P.land; L.t += dt * (d && L.t > 0.15 && L.style < 3 ? 1.35 : 1); const l = landAt(L); if (l.done) P.land = null; else { lh = l.hold; lp = l.push; lc = l.ctl; } }   // 按着方向键就起身快一些
  let speed = (keys.has('S') || !ctl ? WALK : RUN) * P.speedK * (1 - lh);
  if (TIRED.k > 0.001) {                                                // 累：慢下来，一下一下地往前挪；上坡比平地慢，坡越陡越慢
    const up = P.grounded ? groundSlope(P.x) * (d || P.facing) : 0, tv = (up > 0.03 ? lerp(0.78, 0.56, sstep(0.05, 0.2, up)) : 0.95) * hero.A.pace;
    speed = lerp(speed, Math.min(speed, tv), TIRED.k);
  }
  if (TIRED.restT >= 0) speed *= 1 - sstep(0, 0.3, TIRED.restT) * (1 - sstep(TIRED.restD - 0.3, TIRED.restD, TIRED.restT));   // 走着停下来喘口气
  P.vx = damp(P.vx, lp === null ? d * speed : lerp(lp, d * speed, lc), !P.grounded ? 3.5 : lp !== null ? 9 : d ? lerp(9, 18, TIRED.k) : 14, dt);   // 累了步子一下快一下慢，速度要跟得紧
  if (d && lc > 0.5) { P.facing = d; P.moved = true; }
  if (Math.abs(P.vx) < 0.02 && !d && lp === null) P.vx = 0;

  if (P.jumpBuf > 0 && (P.grounded || P.coyote > 0) && P.speedK > 0.5 && lh < 0.35 && lc > 0.5) {
    P.vy = JUMP_V; P.grounded = false; P.jumpBuf = 0; P.coyote = 0; P.jumped = true; fx('jump');
  }
  if (!P.grounded && P.vy > 0 && !(ctl && keys.has('J'))) P.vy -= GRAV * 1.3 * dt;   // 松开跳跃键就跳得矮一些

  // 水平移动，被方块侧面挡住
  let nx = P.x + P.vx * dt; const hit = sideHit(nx, P.y);
  if (hit) {
    const side = P.x < (hit.x1 + hit.x2) / 2 ? 1 : -1;   // 方块在哪一边：看人在它中线的哪一侧（慢慢走下台阶边时身子还压着台阶的侧面，按速度判断会被推到台阶另一头去）
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
  if (!P.grounded && ROPES.length) { const g = findRope(); if (g) { enterRope(...g); return; } }   // 跳起来手碰到绳子：抓住
  const wt = waterAt(P.x);
  if (wt) {                                       // 能游泳的水：脚一碰到水面就溅起水花；再沉下去一截就游起来
    const vIn = Math.min(P.vy, Math.max((P.y - y0) / dt, -7));   // 是多快下来的（顺着陡岸滑下去时 P.vy 是 0，按这一步实际降了多快算，最多算 7 米/秒）
    if (y0 >= wt.y && P.y < wt.y) hitWater(wt, vIn);
    if (P.y < wt.y - SWIM.enter) { enterSwim(wt, vIn); return; }
  }

  // 抓住可以推拉的东西 / 操作机关
  if (ctl && P.grounded && keys.has('E')) {
    const g = findGrab();
    if (g) { P.mode = 'push'; P.grabObj = g[0]; P.grab = g[1]; P.facing = g[1]; g[0].v = 0; P.land = null; }
    else if (pressed.has('E')) {
      const h = findHold();                       // 按住型机关要新按一下才开始：一直按着 E 走过去不算
      if (h) { P.mode = 'hold'; P.holdObj = h; P.vx = 0; P.land = null; P.used = true; h.on = true; if (h.start) h.start(h); }
      else { const u = findUse(); if (u) { P.used = true; u.on(u); } }
    }
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
  if (P.holdObj) P.holdObj.on = false;
  Object.assign(P, { x, vx: 0, vy: 0, grounded: true, mode: 'normal', facing: 1, grabObj: null, holdObj: null, mantle: null, speedK: 1, water: null, air: SWIM.breath, land: null });
  P.y = y ?? floorY(x, 60); P.gy = P.y; resetTired();
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
// vy：是多快掉进来的。掉得越猛，水花越大，人沉得越深，带下去的气泡越多
function hitWater(w, vy) { P.wetT = T; fx('splash', clamp(-vy / 8, 0.35, 1)); splashAt(w, P.x, clamp(-vy / 9, 0.25, 1)); }   // 脚碰到水面的那一下
function enterSwim(w, vy = P.vy) {
  if (!(T - P.wetT < 0.6)) hitWater(w, vy);         // 没经过水面就到了水里（比如被直接放进水里）：水花补在这里
  Object.assign(P, { mode: 'swim', water: w, grounded: false, coyote: 0, jumpBuf: 0, stroke: 0.55, land: null });
  P.vy = clamp(vy * 0.3, -2.2, 0); P.vx *= 0.6;
  plungeAt(w, clamp(-vy / 9, 0.25, 1));
}
// 在水面上往 side 那边找岸：地面从水里冒出来、又不太高（撑得上去），岸上头顶也够高（上去站得直）
function climbOut(w, side, cx) {
  for (let k = 0.1; k <= 0.75; k += 0.05) {
    const x = cx + side * k; if (groundY(x) <= w.y + 0.02) continue;
    let top = -Infinity; for (let j = 0; j <= 0.6; j += 0.05) top = Math.max(top, groundY(x + side * j));
    if (top - w.y > SWIM.reach || ceilY(x + side * 0.45) < top + P.H + 0.05) return false;
    let e = x; for (let n = 0; n < 80 && groundY(e) < top - 0.04; n++) e += side * 0.01;
    P.water = null; startMantle(side > 0 ? { x1: e, x2: e + 1, y2: top } : { x1: e - 1, x2: e, y2: top }, side); P.mantle.T = 0.9;
    fx('wade'); splashAt(w, cx + side * 0.2, 0.35, 8);
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
  if (swimHit(nx, ny)) { ny = cy; if (cy <= topY + 1e-4) P.vy = 0; }   // 刚入水、身子还高出该浮着的那条线时被挡住，是往下够那条线时蹭到了岸壁，不是沉到了底：往下沉的势头留着
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
