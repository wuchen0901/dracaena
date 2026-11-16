
// ============================================================
//  绳子：从吊臂、横梁上垂下来的一根绳子
//  跳起来，手碰到绳子就抓住；按住 ↑ / 空格 往上爬（两只手一上一下地倒），↓ 顺着绳子往下滑，← → 转身；
//  爬到够得着旁边高台边缘的高度，往高台那边按方向，就翻上去；滑到绳子下头还按着 ↓，就松手掉下去。
//  人抓着绳子的时候，人和绳子当成一个单摆一起晃（跳过来带着的速度变成摆动，撞到墙就弹回来）；
//  绳子的样子是一串小段（韦尔莱积分）：挂点固定；抓着的时候挂点到手那一段拉直，手往下到两脚夹住的地方跟着人，剩下的一截自己垂着、被风吹着
// ============================================================
// reach 手离绳子多近才抓得住 / up 往上爬多快 / down 往下滑多快 / hang 两手中间离脚底多高 / hx 绳子在身子前面多远 / top 两手中间最高到挂点下面多少 /
// cd 松手以后多久不再抓 / ledge 高台的边离身子最远多少还翻得上去 / g 摆动用的重力 / foot 两脚夹住绳子的地方离两手中间多远（沿着绳子）/
// hi、lo 抓着的手最高、最低在两手中间的上面、下面多少 / reachT 一只手往上倒一下要多久
const ROPE = { reach: 0.42, up: 0.95, down: 1.5, hang: 1.12, hx: 0.14, top: 0.3, cd: 0.45, ledge: 1.3, g: 13, foot: 0.95, hi: -0.13, lo: 0.1, reachT: 0.26 };
const ROPES = [];
// 登记一根绳子：{ x 挂点, top 挂点的高度, bot 下端的高度, z 离玩法平面多远（默认 0）, deco 只是布景、抓不住, r 粗细, windK 风吹得动多少 }
function rope(o) {
  o.z ??= 0; o.len = o.top - o.bot; o.th = 0; o.w = 0; o.held = false; o.r ??= 0.03; o.windK ??= 1; o.kick = 0; o.h = 1 / 120;
  o.n = Math.max(8, Math.ceil(o.len / 0.1) + 1); o.seg = o.len / (o.n - 1);
  o.p = new Float32Array(o.n * 2); o.q = new Float32Array(o.n * 2); o.pin = new Uint8Array(o.n);
  ropeReset(o); ROPES.push(o); return o;
}
function ropeReset(r) {
  for (let i = 0; i < r.n; i++) { r.p[2 * i] = r.q[2 * i] = r.x; r.p[2 * i + 1] = r.q[2 * i + 1] = r.top - i * r.seg; }
  r.th = r.w = r.kick = 0; r.held = false; r.near = null;
}
// 绳子上离挂点 s 米的那一点（顺着那一串小段量）
function ropeXY(r, s) {
  const f = clamp(s / r.seg, 0, r.n - 1), i = Math.min(r.n - 2, Math.floor(f)), t = f - i, p = r.p;
  return [lerp(p[2 * i], p[2 * i + 2], t), lerp(p[2 * i + 1], p[2 * i + 3], t)];
}
// 抓着的时候绳子是拉直的：顺着摆的角度量下去
const ropeLine = (r, s) => [r.x + s * Math.sin(r.th), r.top - s * Math.cos(r.th)];
// 绳子在高度 y 那里离挂点多远（沿着绳子）；绳子够不到这个高度就是 null
function ropeArcAt(r, y) {
  const p = r.p;
  for (let i = 0; i < r.n - 1; i++) { const y0 = p[2 * i + 1], y1 = p[2 * i + 3]; if ((y0 - y) * (y1 - y) <= 0 && y0 !== y1) return (i + (y0 - y) / (y0 - y1)) * r.seg; }
  return null;
}

// ---- 绳子自己的样子：每一帧走几小步 ----
function ropeSim(r, dt) {
  const n = r.n, p = r.p, q = r.q, pin = r.pin, seg = r.seg;
  if (!r.near) r.near = SOLIDS.filter(s => s.x2 > r.x - r.len - 1 && s.x1 < r.x + r.len + 1 && s.y2 > r.bot - r.len - 1 && s.y1 < r.top + 1);
  const steps = Math.max(1, Math.min(6, Math.round(dt * 120))), h = dt / steps; r.h = h;
  // 抓着的时候：挂点到下面那只手拉直；两脚夹住的那一点跟着人
  pin.fill(0); pin[0] = 1;
  let kLow = 0, kFoot = -1, fx_ = 0, fy_ = 0;
  if (r.held && P.rope === r && P.hands) {
    let sLow = P.rs; for (const hd of P.hands) if (hd.t >= 1) sLow = Math.max(sLow, hd.s);
    kLow = Math.min(n - 1, Math.floor(Math.min(sLow, r.len) / seg)); for (let i = 0; i <= kLow; i++) pin[i] = 1;
    const sf = P.rs + ROPE.foot + 0.03; if (sf < r.len - seg) { kFoot = Math.round(sf / seg); pin[kFoot] = 1; [fx_, fy_] = ropeLine(r, kFoot * seg); }
  }
  const kick = r.kick, dmp = r.held ? 0.972 : r.deco ? 0.992 : 0.994; r.kick = 0;          // 被人抓着时，垂着的那一截跟着人晃、很快就稳住（不会甩起来）
  for (let k = 0; k < steps; k++) {
    const tt = T + k * h, wind = (E.wind * 0.5 + 0.32 * Math.sin(tt * 0.53 + r.x * 0.37) + 0.16 * Math.sin(tt * 1.9 + r.x * 1.3)) * r.windK;
    for (let i = 1; i < n; i++) {
      if (pin[i]) continue;
      const j = 2 * i, vx = (p[j] - q[j]) * dmp, vy = (p[j + 1] - q[j + 1]) * dmp;
      q[j] = p[j]; q[j + 1] = p[j + 1];
      p[j] += vx + wind * h * h + (k === 0 ? kick * h * i / n : 0); p[j + 1] += vy - 9.8 * h * h;
    }
    const setPin = (i, x, y) => { const j = 2 * i; q[j] = p[j]; q[j + 1] = p[j + 1]; p[j] = x; p[j + 1] = y; };
    setPin(0, r.x, r.top);
    if (kLow) for (let i = 1; i <= kLow; i++) { const [x, y] = ropeLine(r, i * seg); setPin(i, x, y); }
    if (kFoot > 0) setPin(kFoot, fx_, fy_);
    for (let it = 0, its = r.deco ? 6 : 16; it < its; it++) {
      for (let i = 0; i < n - 1; i++) {
        const a = 2 * i, b = a + 2, dx = p[b] - p[a], dy = p[b + 1] - p[a + 1], d = Math.sqrt(dx * dx + dy * dy) || 1e-6, e = (d - seg) / d;
        const wa = pin[i] ? 0 : 1, wb = pin[i + 1] ? 0 : 1, ws = wa + wb; if (!ws) continue;
        p[a] += dx * e * wa / ws; p[a + 1] += dy * e * wa / ws; p[b] -= dx * e * wb / ws; p[b + 1] -= dy * e * wb / ws;
      }
      if (!r.deco) for (let i = 0; i < n - 2; i++) {      // 粗绳子折不过来：隔一个点的两点不许靠得太近
        const a = 2 * i, b = a + 4, dx = p[b] - p[a], dy = p[b + 1] - p[a + 1], d = Math.sqrt(dx * dx + dy * dy) || 1e-6, mn = seg * 1.85;
        if (d >= mn) continue;
        const e = (d - mn) / d * 0.5, wa = pin[i] ? 0 : 1, wb = pin[i + 2] ? 0 : 1, ws = wa + wb; if (!ws) continue;
        p[a] += dx * e * wa / ws; p[a + 1] += dy * e * wa / ws; p[b] -= dx * e * wb / ws; p[b + 1] -= dy * e * wb / ws;
      }
    }
    for (let i = 1; i < n; i++) if (!pin[i]) for (const s of r.near) {        // 绳子不穿进墙里：推到最近的那一面外头
      const j = 2 * i, x = p[j], y = p[j + 1]; if (s.off || x <= s.x1 || x >= s.x2 || y <= s.y1 || y >= s.y2) continue;
      const dl = x - s.x1, dr = s.x2 - x, du = s.y2 - y; if (du < dl && du < dr) p[j + 1] = s.y2 + 0.005; else p[j] = dl < dr ? s.x1 - 0.005 : s.x2 + 0.005;
      q[j] = lerp(q[j], p[j], 0.5);
    }
    for (let i = 1; i < n; i++) if (!pin[i]) { const j = 2 * i, gy = groundY(p[j]) + r.r; if (p[j + 1] < gy) { p[j + 1] = gy; q[j] = lerp(q[j], p[j], 0.3); } }   // 垂到地上的一截堆在地上
  }
}

// ---- 绳子的样子：顺着那一串点拉成一根管子，每一帧重新摆一遍顶点 ----
let ROPE_MAT = null, KNOT_GEO = null;
function ropeMat() {                                     // 三股拧在一起的旧麻绳：一道道斜着的深缝，几丝起毛
  if (ROPE_MAT) return ROPE_MAT;
  const [c, g] = mkCanvas(32, 96), s0 = _seed; _seed = 777;
  g.fillStyle = '#9b8f7d'; g.fillRect(0, 0, 32, 96);
  for (let k = -2; k < 8; k++) {
    const y = k * 16; g.fillStyle = 'rgba(255,245,225,.16)'; g.beginPath(); g.moveTo(0, y + 3); g.lineTo(32, y + 13); g.lineTo(32, y + 19); g.lineTo(0, y + 9); g.fill();
    g.strokeStyle = 'rgba(28,22,16,.75)'; g.lineWidth = 2.6; g.beginPath(); g.moveTo(0, y); g.lineTo(32, y + 16); g.stroke();
  }
  for (let i = 0; i < 70; i++) { g.fillStyle = rnd() < 0.5 ? 'rgba(40,32,24,.35)' : 'rgba(230,220,200,.25)'; g.fillRect(rr(0, 32), rr(0, 96), rr(1, 3), 1); }
  _seed = s0;
  const t = canvasTex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return ROPE_MAT = lam(0x8f8474, { map: t });
}
function ropeMesh(R, r, o = {}) {
  const n = r.n, M = 6, V = n * (M + 1), pos = new Float32Array(V * 3), nor = new Float32Array(V * 3), uv = new Float32Array(V * 2), idx = [];
  for (let i = 0; i < n; i++) for (let j = 0; j <= M; j++) { const v = i * (M + 1) + j; uv[2 * v] = j / M; uv[2 * v + 1] = i * r.seg * 5.5; }
  for (let i = 0; i < n - 1; i++) for (let j = 0; j < M; j++) { const a = i * (M + 1) + j, b = a + M + 1; idx.push(a, a + 1, b, a + 1, b + 1, b); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(idx);
  const m = new THREE.Mesh(g, o.mat ?? ropeMat()); m.frustumCulled = false; m.castShadow = o.shadow !== false; m.receiveShadow = true; R.add(m);
  KNOT_GEO ??= new THREE.SphereGeometry(1, 10, 8);
  const knot = new THREE.Mesh(KNOT_GEO, m.material); knot.scale.set(r.r * 1.9, r.r * 2.6, r.r * 1.9); knot.castShadow = m.castShadow; R.add(knot);
  r.mesh = m; r.knot = knot; ropeDraw(r);
  return m;
}
function ropeDraw(r) {
  const m = r.mesh; if (!m) return;
  const n = r.n, M = 6, p = r.p, pos = m.geometry.attributes.position.array, nor = m.geometry.attributes.normal.array, rad = r.r;
  for (let i = 0; i < n; i++) {
    const a = Math.max(0, i - 1), b = Math.min(n - 1, i + 1), tx = p[2 * b] - p[2 * a], ty = p[2 * b + 1] - p[2 * a + 1], tl = Math.sqrt(tx * tx + ty * ty) || 1;
    const nx = -ty / tl, ny = tx / tl, cx = p[2 * i], cy = p[2 * i + 1], taper = i === n - 1 ? 0.85 : 1;
    for (let j = 0; j <= M; j++) {
      const f = j / M * 6.2832, c = Math.cos(f), s = Math.sin(f), v = 3 * (i * (M + 1) + j);
      nor[v] = c * nx; nor[v + 1] = c * ny; nor[v + 2] = s;
      pos[v] = cx + rad * taper * c * nx; pos[v + 1] = cy + rad * taper * c * ny; pos[v + 2] = r.z + rad * taper * s;
    }
  }
  m.geometry.attributes.position.needsUpdate = true; m.geometry.attributes.normal.needsUpdate = true;
  const j = 2 * (n - 1), dx = p[j] - p[j - 2], dy = p[j + 1] - p[j - 1];
  r.knot.position.set(p[j] + dx * 0.2, p[j + 1] + dy * 0.2, r.z); r.knot.rotation.z = Math.atan2(dx, -dy);
}
function stepRopes(list, dt) { for (const r of list) { ropeSim(r, dt); ropeDraw(r); } }

// ============================================================
//  主角抓着绳子
// ============================================================
// 空中：手够得着的高度上有没有绳子（从高往低找，找手离得最近的那一根）
function findRope() {
  if (P.ropeCD > 0) return null;
  let best = null, bd = 1e9;
  for (const r of ROPES) {
    if (r.deco || Math.abs(r.z) > 0.3 || Math.abs(r.x - P.x) > r.len + 1.5) continue;
    for (let y = P.y + 1.28; y >= P.y + 0.72; y -= 0.06) {
      if (y > r.top - ROPE.top) continue;
      const s = ropeArcAt(r, y); if (s === null || s > r.len - 0.1) continue;
      const rx = ropeXY(r, s)[0], dx = Math.min(Math.abs(rx - P.x), Math.abs(rx - P.x - P.facing * ROPE.hx));   // 绳子在身前（手伸出去的地方）也算
      if (dx < ROPE.reach) { if (dx < bd) { best = [r, s]; bd = dx; } break; }
    }
  }
  return best;
}
function enterRope(r, s) {
  const [hx, hy] = ropeXY(r, s), i = Math.min(r.n - 1, Math.round(s / r.seg)), vRope = (r.p[2 * i] - r.q[2 * i]) / r.h;
  r.th = Math.atan2(hx - r.x, r.top - hy);
  r.w = clamp((P.vx * 0.3 + vRope * 0.8) / (s + 0.5), -1.1, 1.1);              // 跳过来带着的速度变成摆动
  if (Math.abs(hx - P.x) > 0.03) P.facing = hx > P.x ? 1 : -1;                     // 面朝绳子
  const s0 = clamp(s, ROPE.top, r.len - 0.14);
  Object.assign(P, { mode: 'rope', rope: r, land: null, rs: s0, rv: P.vy < -1.5 ? clamp(-P.vy * 0.4, 0, 2.6) : 0, dropT: 0, grounded: false, coyote: 0, jumpBuf: 0, vx: 0, vy: 0,
    hands: [{ s: s0 - 0.07, t: 1 }, { s: s0 + 0.07, t: 1 }] });                    // 下落时抓住的：手顺着绳子往下滑一小段才停住
  r.held = true; fx('grab');
}
function releaseRope() {                                 // 松手掉下去：带着绳子摆动的速度
  const r = P.rope, L = P.rs + 0.5, vx = r ? r.w * L * Math.cos(r.th) : 0;
  if (r) { r.held = false; r.kick = -vx * 0.5; }
  Object.assign(P, { mode: 'normal', rope: null, grounded: false, vx, vy: r ? r.w * L * Math.sin(r.th) : 0, ropeCD: ROPE.cd, gy: P.y, coyote: 0 });
}
// 两手中间在绳子上 s 处时，人（脚底的中点）在哪里：人顺着绳子垂在手下面，绳子在身子前面一点
function ropeBody(r, s) {
  const [hx, hy] = ropeLine(r, s), c = Math.cos(r.th), sn = Math.sin(r.th), f = P.facing * ROPE.hx;
  return [hx + ROPE.hang * sn - f * c, hy - ROPE.hang * c - f * sn];
}
// 往 side 那边，身边够得着的高台：边缘离身子不太远，台面在脚下面一点到肩膀之间，台上站得下
function ropeLedge(side) {
  for (const s of SOLIDS) {
    if (s.off || s.noclimb || (s.plat && !s.ledge) || s.x2 - s.x1 < 0.6) continue;   // 悬空的架子（plat）一般不算，标了 ledge 的算（第 29 章竖井里的铁架子）
    const ex = side > 0 ? s.x1 : s.x2, gap = (ex - P.x) * side, h = s.y2 - P.y;
    if (gap < P.hw - 0.08 || gap > ROPE.ledge || h < -0.6 || h > 0.95) continue;
    if (sideHit(ex + side * (P.hw + 0.14), s.y2 + 0.02) || ceilY(ex + side * 0.4) < s.y2 + P.H) continue;
    return s;
  }
  return null;
}
// 两只手：抓着的手停在绳子上不动，人往上一提，它就一点点落到胸前；落到胸前、另一只手也抓牢了，它就松开，往上倒到头顶前面再抓住
function stepRopeHands(dt, s, sPrev, climb) {
  const H = P.hands, mv = s - sPrev;
  for (const h of H) if (h.t < 1) { h.t = Math.min(1, h.t + dt / ROPE.reachT); h.s = lerp(h.s0, h.s1, sstep(0, 1, h.t)); }
  if (P.rv > 0.05) {                                     // 往下滑：两只手都顺着绳子跟着滑，慢慢回到一上一下的样子
    for (let i = 0; i < 2; i++) { const h = H[i]; if (h.t < 1) h.t = 1; h.s += mv; h.s = damp(h.s, s + (i ? 0.05 : -0.12), 6, dt); }
    return;
  }
  if (climb) {                                           // 要往上爬：下面那只手已经落到胸前、上面那只手抓牢了，就松开下面那只往上倒
    const [a, b] = H[0].s > H[1].s ? [H[0], H[1]] : [H[1], H[0]];
    if (a.t >= 1 && b.t >= 1 && a.s - s > ROPE.lo - 0.05) { a.t = 0; a.s0 = a.s; a.s1 = Math.max(ROPE.top + ROPE.hi + 0.02, s + Math.min(P.rv, -0.4) * ROPE.reachT * 0.9 + ROPE.hi); }
  }
}
function stepRope(dt, d) {
  const r = P.rope, up = ctl && keys.has('J') && !keys.has('DOWN'), dn = ctl && keys.has('DOWN') && !keys.has('J');
  if (d) P.facing = d;
  const want = up ? -ROPE.up : dn ? ROPE.down : 0;
  P.rv = damp(P.rv, want, want ? 9 : 14, dt);
  let s = P.rs + P.rv * dt;
  if (P.rv < 0) for (const h of P.hands) if (h.t >= 1) s = Math.max(s, h.s - ROPE.lo - 0.04);   // 抓着的那只手已经拉到胸前：等另一只手抓住再往上
  const sMin = ROPE.top, sMax = r.len - 0.14;
  if (s < sMin) { s = sMin; if (P.rv < 0) P.rv = 0; }
  if (s >= sMax) {                                       // 滑到下头了：还按着 ↓ 就松手
    s = sMax; if (P.rv > 0) P.rv = 0;
    P.dropT = dn ? P.dropT + dt : 0; if (P.dropT > 0.16) { releaseRope(); return; }
  } else P.dropT = 0;
  // 摆：人越往下，摆得越慢；爬的时候手脚用着力，摆停得快一些
  r.w += -ROPE.g / (s + 0.5) * Math.sin(r.th) * dt; r.w *= Math.exp(-(want ? 1.1 : 0.5) * dt);
  const th0 = r.th; r.th = clamp(r.th + r.w * dt, -0.7, 0.7);
  let [nx, ny] = ropeBody(r, s);
  if (sideHit(nx, ny)) {                                 // 荡到墙上：弹回来
    if (Math.abs(r.w) > 0.3) fx('land', 2.5);
    r.th = th0; r.w = -r.w * 0.3; [nx, ny] = ropeBody(r, s);
    if (sideHit(nx, ny)) { s = P.rs; P.rv = 0; [nx, ny] = ropeBody(r, s); }
  }
  const f = floorY(nx, ny + 0.25);
  if (ny <= f + 0.02 && P.rv >= 0) {                     // 滑到脚着地了：站住
    r.held = false; Object.assign(P, { mode: 'normal', rope: null, grounded: true, y: f, x: nx, vx: 0, vy: 0, gy: f, ropeCD: ROPE.cd }); fx('land', 2); return;
  }
  stepRopeHands(dt, s, P.rs, want < 0 && s > sMin + 0.01);
  P.rs = s;
  const a = 1 - Math.exp(-dt / 0.06); P.x += (nx - P.x) * a; P.y += (ny - P.y) * a;   // 刚抓住、转身时不要一下子跳过去
  if (ctl && d) {                                        // 往高台那边按：翻上去（脚往绳子上一蹬，绳子荡开）
    const L = ropeLedge(d);
    if (L) { r.held = false; r.kick = -d * 1.6; P.rope = null; P.ropeCD = ROPE.cd; startMantle(L, d); P.mantle.T = 0.95; return; }
  }
}
// 交给主角动画：两只手、两只脚在世界里的位置（手正在往上倒的时候离开绳子一点），人斜多少
function ropeAnim() {
  const r = P.rope; if (!r) return null;
  const H = P.hands, f = P.facing, lift = [0, 0];
  const hands = H.map(h => { const [x, y] = ropeLine(r, h.s); return { x, y, lift: h.t < 1 ? Math.sin(Math.PI * h.t) : 0 }; });
  for (let i = 0; i < 2; i++) lift[1 - i] = hands[i].lift;               // 一只手往上倒的时候，另一边的膝盖提一下
  const feet = [0, 1].map(i => { const [x, y] = ropeLine(r, P.rs + ROPE.foot + (i ? 0.05 : -0.03) - 0.24 * lift[i]); return { x, y }; });
  return { th: r.th, f, z: r.z, hands, feet, rv: P.rv };
}

// ---- 把主角模型的手脚摆到绳子上：每条胳膊 / 腿两节骨头，三维的两节反向运动学（手肘朝下朝外，膝盖朝前）。k：和原来的姿势混合多少 ----
const _iv = Array.from({ length: 12 }, () => new THREE.Vector3()), _iq = Array.from({ length: 3 }, () => new THREE.Quaternion());
function aimBone(node, from, child, to, k) {             // 转动 node，让它下一节的起点 child 转到从 from 看去 to 的方向上
  const a = _iv[7].subVectors(child, from), b = _iv[8].subVectors(to, from);
  if (a.lengthSq() < 1e-10 || b.lengthSq() < 1e-10) return;
  a.normalize(); b.normalize();
  const qW = _iq[0].setFromUnitVectors(a, b), pq = node.parent.getWorldQuaternion(_iq[1]);
  const nq = _iq[2].copy(pq).invert().multiply(qW).multiply(pq).multiply(node.quaternion);
  node.quaternion.slerp(nq, k); node.updateWorldMatrix(false, true);
}
function ikLimb(up, lo, end, target, pole, k) {
  const a = up.getWorldPosition(_iv[0]), b = lo.getWorldPosition(_iv[1]), c = end.getWorldPosition(_iv[2]);
  const l1 = a.distanceTo(b), l2 = b.distanceTo(c), dir = _iv[3].subVectors(target, a), dist = clamp(dir.length(), Math.abs(l1 - l2) + 1e-3, l1 + l2 - 1e-3);
  dir.normalize();
  const pp = _iv[4].subVectors(pole, a); pp.addScaledVector(dir, -pp.dot(dir)); if (pp.lengthSq() < 1e-10) return; pp.normalize();
  const ca = clamp((l1 * l1 + dist * dist - l2 * l2) / (2 * l1 * dist), -1, 1);
  const elbow = _iv[5].copy(a).addScaledVector(dir, l1 * ca).addScaledVector(pp, l1 * Math.sqrt(1 - ca * ca));
  aimBone(up, a, b, elbow, k);
  const b2 = lo.getWorldPosition(_iv[1]), c2 = end.getWorldPosition(_iv[2]), tg = _iv[6].copy(a).addScaledVector(dir, dist);
  aimBone(lo, b2, c2, tg, k);
}
function ropeIK(tr, w, k) {
  const bone = n => tr.bones.get(n)?.node, T_ = _iv[9], Po = _iv[10], J = _iv[11];
  for (let i = 0; i < 2; i++) {
    const side = i ? 'Right' : 'Left';
    const up = bone(side + 'Arm'), lo = bone(side + 'ForeArm'), end = bone(side + 'Hand');
    if (up && lo && end) {
      up.getWorldPosition(J); const sz = Math.sign(J.z - w.z) || (i ? 1 : -1), h = w.hands[i];
      T_.set(h.x - w.f * 0.06 * h.lift, h.y - 0.05, w.z + sz * (0.042 + 0.05 * h.lift));            // 手腕在握住的地方下面一点
      Po.set(J.x + w.f * 0.12, J.y - 0.5, J.z + sz * 0.6);
      ikLimb(up, lo, end, T_, Po, k);
    }
    const hip = bone(side + 'UpLeg'), knee = bone(side + 'Leg'), foot = bone(side + 'Foot');
    if (hip && knee && foot) {
      hip.getWorldPosition(J); const sz = Math.sign(J.z - w.z) || (i ? 1 : -1), ft = w.feet[i];
      T_.set(ft.x - w.f * 0.03, ft.y + 0.04, w.z + sz * 0.05);
      Po.set(J.x + w.f * 1.0, J.y + 0.15, J.z + sz * 0.25);
      ikLimb(hip, knee, foot, T_, Po, k);
    }
  }
}
