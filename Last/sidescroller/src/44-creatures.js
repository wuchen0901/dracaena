
// ============================================================
//  路上的角色：同型号的机器人、人、小猫和追犬
// ============================================================
// 包一层：记住自己的位置和姿势，每帧调 step(dt)。kind 用 SKINS 里的字母（R = 和 07 同型号、灯灭着的机器人）
function makeNPC(kind, parent, o = {}) {
  const ch = makeCharacter(kind, null, { npc: true, parent });
  const n = { ch, x: o.x ?? 0, y: o.y ?? 0, z: o.z ?? 0, vx: 0, facing: o.facing ?? 1, pose: o.pose ?? null, seed: rr(0, 50), mode: 'normal', hand: null,
    step(dt) { ch.update(dt, { x: n.x, y: n.y, z: n.z, vx: n.vx, vy: 0, grounded: true, facing: n.facing, mode: n.mode, t: T + n.seed, impact: 0, slope: 0, alert: 0, hand: n.hand, pose: n.pose, modeT: 0 }); },
    walkTo(tx, speed, dt) {                              // 走向 tx；到了返回 true
      const d = tx - n.x; if (Math.abs(d) < 0.03) { n.vx = 0; return true; }
      n.facing = Math.sign(d); n.vx = Math.sign(d) * Math.min(speed, Math.abs(d) / Math.max(dt, 1e-4)); n.x += n.vx * dt; return false;
    } };
  ch.root.visible = o.visible ?? true;
  return n;
}

// ---- 四条腿的小动物。局部坐标：面朝 +x，y 向上 ----
// mode：idle 站 / run 跑 / sit 坐 / cower 缩成一团发抖 / bark 吠 / drink 低头喝水 / curl 蜷着睡 / leap 跃起
function makeCritter(kind, parent) {
  const cat = kind === 'cat';
  const K = cat ? { L: 0.36, H: 0.215, r: 0.068, head: 0.074, leg: 0.105, tail: 0.1, col: 0xc9bca6, col2: 0x8b7d68 }
                : { L: 0.84, H: 0.56, r: 0.15, head: 0.125, leg: 0.275, tail: 0.17, col: 0x2a2521, col2: 0x6d5a44 };
  const fur = lam(K.col, { emissive: K.col, emissiveIntensity: cat ? 0.32 : 0.1 }), fur2 = lam(K.col2, { emissive: K.col2, emissiveIntensity: cat ? 0.2 : 0.1 });
  const root = new THREE.Group(); parent.add(root);
  const body = grp(root, 0, K.H, 0);
  const torso = add(body, new THREE.CapsuleGeometry(K.r, K.L - K.r * 1.2, 4, 10), fur); torso.rotation.z = Math.PI / 2; torso.scale.set(1, 1, 0.84);
  if (!cat) add(body, new THREE.SphereGeometry(K.r * 1.12, 10, 8), fur, K.L * 0.3, K.r * 0.06, 0).scale.set(1.1, 1.05, 0.9);                // 狗的胸更厚
  const neck = grp(body, K.L / 2 - K.r * 0.2, K.r * 0.55, 0);
  add(neck, new THREE.SphereGeometry(K.head, 12, 10), fur, K.head * 0.75, K.head * 0.5, 0).scale.set(1.05, 0.95, 0.95);
  for (const sz of [-1, 1]) add(neck, new THREE.ConeGeometry(K.head * 0.38, K.head * (cat ? 0.75 : 0.7), 6), cat ? fur : fur2, K.head * 0.55, K.head * 1.32, sz * K.head * 0.52).rotation.z = 0.18;
  const jaw = grp(neck, K.head * 1.25, K.head * 0.22, 0);
  if (cat) add(neck, new THREE.SphereGeometry(K.head * 0.4, 8, 6), fur, K.head * 1.5, K.head * 0.34, 0);
  else {
    add(neck, bx(K.head * 1.25, K.head * 0.56, K.head * 0.74), fur2, K.head * 1.95, K.head * 0.52, 0);            // 长嘴
    add(jaw, bx(K.head * 1.15, K.head * 0.22, K.head * 0.62), fur, K.head * 0.62, -K.head * 0.08, 0);            // 下颌：吠的时候张开
    add(neck, new THREE.TorusGeometry(K.head * 0.82, K.head * 0.11, 5, 12), lam(0x8a3a2c), -K.head * 0.05, K.head * 0.12, 0).rotation.y = Math.PI / 2;   // 项圈
  }
  const tails = []; let tp = grp(body, -K.L / 2 + K.r * 0.2, K.r * 0.5, 0);
  for (let i = 0; i < 3; i++) { const r = K.r * (cat ? 0.34 : 0.3) * (1 - i * 0.22); add(tp, cy(r * 0.8, r, K.tail, 6), cat && i === 2 ? fur2 : fur, 0, K.tail / 2, 0); tails.push(tp); tp = grp(tp, 0, K.tail, 0); }
  const legs = [];
  for (const [front, sz] of [[1, 1], [1, -1], [0, 1], [0, -1]]) {
    const hip = grp(body, front ? K.L / 2 - K.r * 0.55 : -K.L / 2 + K.r * 0.55, -K.r * 0.3, sz * K.r * 0.52), r = K.r * (cat ? 0.3 : 0.27);
    add(hip, cy(r * (front ? 1 : 1.35), r * 0.85, K.leg, 6), fur, 0, -K.leg / 2, 0);
    const knee = grp(hip, 0, -K.leg, 0); add(knee, cy(r * 0.8, r * 0.7, K.leg, 6), fur, 0, -K.leg / 2, 0);
    add(knee, new THREE.SphereGeometry(r * 1.05, 6, 5), cat ? fur : fur2, r * 0.4, -K.leg, 0).scale.set(1.4, 0.7, 1);
    legs.push({ hip, knee, front, ph: (front ? 0 : 0.5) + (sz > 0 ? 0 : 0.5) });
  }
  const A = { ph: 0, yaw: 0, mv: 0, run: 0, by: K.H, pitch: 0, head: 0.2, tail: 1, fold: 0, crouch: 0, jaw: 0 };
  function update(dt, s) {
    const sp = Math.abs(s.vx), t = s.t, m = s.mode;
    A.yaw = damp(A.yaw, s.facing > 0 ? 0 : -Math.PI, 12, dt); root.rotation.y = A.yaw; root.position.set(s.x, s.y, s.z ?? 0);
    A.mv = damp(A.mv, m === 'leap' ? 0 : sstep(0.05, 0.6, sp), 12, dt); A.run = damp(A.run, sstep(1.4, 3.6, sp), 8, dt);
    A.ph = (A.ph + sp * dt / (K.L * lerp(1.3, 2.6, A.run))) % 1;
    // 每种状态对应一组目标姿势：身体高度、俯仰、头、尾巴、后腿折叠、四肢弯曲
    let by = K.H, pitch = 0, head = cat ? 0.25 : 0.1, tail = cat ? 1.25 : 0.6, fold = 0, crouch = 0, jawT = 0, shake = 0;
    if (m === 'sit') { by = K.H * 0.8; pitch = 0.46; fold = 1; head = -0.2; tail = -0.9; }
    else if (m === 'cower') { by = K.H * 0.62; pitch = -0.08; crouch = 1; head = -0.45; tail = -1.3; shake = 1; }
    else if (m === 'bark') { const p = t % 1.5, k = Math.max(0, Math.sin(Math.PI * clamp(p / 0.2, 0, 1)), Math.sin(Math.PI * clamp((p - 0.34) / 0.2, 0, 1))); pitch = -0.1 + 0.1 * k; head = 0.55 + 0.3 * k; jawT = k; tail = 1.3; crouch = 0.25; }
    else if (m === 'growl') { pitch = -0.12; head = 0.1; tail = 0.2; crouch = 0.35; jawT = 0.15; }
    else if (m === 'drink') { pitch = -0.3; head = -1.15; tail = 0.5; crouch = 0.3; }
    else if (m === 'curl') { by = K.r * 0.95; crouch = 1; fold = 1; head = -1.0; tail = -1.9; }
    else if (m === 'leap') { pitch = clamp((s.vy ?? 0) * 0.12, -0.5, 0.6); head = 0.1; tail = 0.3; }
    else { pitch = -0.03 * A.run; tail = lerp(tail, cat ? 1.5 : 0.2, A.run); }
    const k = 10; A.by = damp(A.by, by, k, dt); A.pitch = damp(A.pitch, pitch, k, dt); A.head = damp(A.head, head, k, dt); A.tail = damp(A.tail, tail, 7, dt);
    A.fold = damp(A.fold, fold, k, dt); A.crouch = damp(A.crouch, crouch, k, dt); A.jaw = damp(A.jaw, jawT, 30, dt);
    const bob = Math.abs(Math.sin(2 * Math.PI * A.ph)) * K.H * 0.06 * A.mv * A.run;
    body.position.set(shake * 0.004 * Math.sin(t * 43), A.by - A.crouch * K.H * 0.16 + bob + K.H * 0.012 * Math.sin(t * 2.1) * (1 - A.mv), 0);
    body.rotation.z = A.pitch;
    neck.rotation.z = A.head - A.pitch * 0.6 + 0.05 * Math.sin(t * 0.9) * (1 - A.mv);
    jaw.rotation.z = -0.55 * A.jaw;
    tails[0].rotation.z = Math.PI / 2 - A.tail * 0.6 - A.pitch * 0.5 + 0.12 * Math.sin(t * (cat ? 2.2 : 6) + 1) * (m === 'cower' ? 0 : 1);   // 正数 = 翘起来，负数 = 夹在身下
    tails[1].rotation.z = 0.25 - A.tail * 0.38; tails[2].rotation.z = 0.2 - A.tail * 0.38 + 0.2 * Math.sin(t * 1.7);
    const leap = m === 'leap' ? 1 : 0;
    for (const L of legs) {
      const p = 2 * Math.PI * (A.ph + L.ph * lerp(1, L.front ? 0.12 : 0.6, A.run) + (L.front ? 0 : 0.5 * A.run));   // 走：对角步；跑：前腿一起、后腿一起
      const sw = Math.sin(p), lift = Math.max(0, Math.cos(p)), amp = lerp(0.42, 0.85, A.run) * A.mv;
      let a = (L.front ? -0.15 : 0.35) + amp * sw, b = (L.front ? 0.3 : -0.7) + (L.front ? 1 : -1) * lift * lerp(0.6, 1.1, A.run) * A.mv;
      a += (L.front ? -0.3 : 0.5) * A.crouch; b += (L.front ? 0.75 : -0.95) * A.crouch;
      if (!L.front) { a = lerp(a, 1.25, A.fold); b = lerp(b, -2.5, A.fold); } else if (m === 'curl') { a = lerp(a, -1.2, A.fold); b = lerp(b, 2.4, A.fold); }
      if (leap) { a = L.front ? 1.1 : -0.9; b = L.front ? 0.2 : -0.3; }
      L.hip.rotation.z = a - A.pitch * (m === 'sit' && L.front ? 1 : 0.4); L.knee.rotation.z = b;
    }
  }
  return { root, update, K, A };
}

// ---- 小猫：救下来以后一直跟着 07。它不做寻路：同一个台面上就跑过去，高低不一样或者隔着坑就跳过去 ----
// state：none 不在场 / follow 跟着 07 / hold 跑到指定的地方待着（CAT.hold = { x, y, mode }）
const CAT = { state: 'none', x: 0, y: 0, z: 0.42, vx: 0, vy: 0, facing: 1, mode: 'idle', leap: null, still: 0, hold: null, crit: null };
function catFollow() { CAT.state = 'follow'; CAT.hold = null; }
function catHold(x, y, mode = 'sit', facing = 1) { CAT.state = 'hold'; CAT.hold = { x, y, mode, facing }; }
function catPlace(x, y, state = 'follow') { Object.assign(CAT, { x, y, vx: 0, vy: 0, leap: null, still: 0, state, hold: null, mode: 'idle' }); }
function stepCat(dt) {
  const c = CAT; if (!c.crit) return;
  c.crit.root.visible = c.state !== 'none'; if (c.state === 'none') return;
  let tx = c.x, ty = c.y, rest = 'idle', go = true;
  c.z = damp(c.z, c.state === 'hold' ? c.hold.z ?? 0.42 : 0.42, 6, dt);
  if (c.state === 'hold') { tx = c.hold.x; ty = c.hold.y; rest = c.hold.mode; }
  else if (P.grounded && P.mode !== 'mantle') {
    tx = P.x - P.facing * 0.8; ty = floorY(tx, P.y + 0.1);
    if (Math.abs(ty - P.y) > 0.3) { tx = P.x - P.facing * 0.15; ty = P.y; }          // 身后那一步不在同一个台面上：就贴着 07 的脚边
  } else go = Math.abs(P.x - c.x) > 3.5 && (tx = P.x - P.facing * 1.2, ty = c.y, true);   // 07 在半空：先等着，离远了才跟上去
  if (c.leap) {                                          // 一次跳跃：一条抛物线，不管中间有什么
    const L = c.leap; L.t += dt; const k = Math.min(1, L.t / L.T);
    c.x = lerp(L.x0, L.x1, k); c.y = lerp(L.y0, L.y1, k) + 4 * L.h * k * (1 - k); c.vy = (L.y1 - L.y0 + 4 * L.h * (1 - 2 * k)) / L.T; c.vx = (L.x1 - L.x0) / L.T;
    c.facing = L.x1 >= L.x0 ? 1 : -1; c.mode = 'leap';
    if (k >= 1) { c.leap = null; c.vx = 0; c.still = 0; }
  } else {
    const dx = tx - c.x, far = Math.abs(dx);
    const jump = () => { const d = Math.hypot(tx - c.x, ty - c.y); c.leap = { x0: c.x, y0: c.y, x1: tx, y1: ty, t: 0, T: clamp(0.26 + 0.075 * d, 0.3, 0.75), h: 0.22 + 0.3 * Math.abs(ty - c.y) + 0.07 * Math.abs(tx - c.x) }; fx('catHop'); };
    if (go && far < 6 && Math.abs(ty - c.y) > 0.25 && (far < 2.6 || c.state === 'hold')) jump();
    else if (go && far > 0.22) {
      const v = Math.sign(dx) * clamp(far * 4.5, 0.6, 5.6), nx = c.x + v * dt, f = floorY(nx, c.y + 0.2);
      if (far > 9) { c.x = tx - Math.sign(dx) * 5; c.y = floorY(c.x, ty + 0.2); }              // 被甩得太远（在画面外）：直接跟上来
      else if (Math.abs(f - c.y) > 0.25) { if (far < 6) jump(); else { c.x = nx; c.y = f; } }  // 前面是台阶或者坑：跳
      else { c.x = nx; c.y = f; c.vx = v; c.facing = Math.sign(dx); c.mode = 'run'; c.still = 0; }
    } else {
      c.vx = 0; c.still += dt;
      if (c.state === 'hold') { c.mode = rest; c.facing = c.hold.facing; }
      else { c.mode = c.still > 2.2 ? 'sit' : 'idle'; if (c.still > 0.4) c.facing = P.x >= c.x ? 1 : -1; }
    }
  }
  c.crit.update(dt, { x: c.x, y: c.y, z: c.z, vx: c.vx, vy: c.vy, facing: c.facing, mode: c.mode, t: T });
}
