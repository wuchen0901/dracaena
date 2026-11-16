// ============================================================
//  第 30 章 · 玻璃大罐（工厂深处之六）
//  一排几层楼高的玻璃罐，里面是浑浊的黄绿色液体，只看得见漂着的人形剪影；偶尔有一个慢慢漂过来，撞在玻璃上。
//  尽头的门口站着一个看守，手电一直照着门前那一段路，过不去。
//  玩法：离路最近的那只罐子已经裂了。爬上它旁边的检修台，按 E 拧开罐子顶上的阀门 —— 罐子撑不住，整面玻璃炸开，
//  里面的东西一下子冲出来：把看守冲倒、把门冲开。人得站在高处，水头过去以前下到地上就会被冲走。
//  代价是罐子里的人也一起流出来，躺在去门口的路上（一个改不回去的选择）
// ============================================================
const H6 = (() => {
  const k = 5, X = hX(k), LEN = 60;
  hChapter(k, { name: '玻璃大罐', sub: '已经裂了', ground: 'concrete', len: LEN, tint: 0x141a10 });
  terrain([X - 14, 0], [X + LEN + 4, 0]);
  ground(X - 14, 0x23281f); ground(X + LEN + 4, 0x20251d);
  hCut(X - 14, X + LEN + 4);
  const TX = X + 20.6, TZ = -2.3, TR = 1.4, DOOR_X = X + 37;
  const STEP = solid({ x1: X + 12.4, x2: X + 14, y1: 0, y2: 1.2, snd: 'metal' });
  const GAL = solid({ x1: X + 14, x2: X + 22.6, y1: 0, y2: 2.4, snd: 'metal' });
  const DOOR = gate({ x: DOOR_X, w: 0.5, h: 3.4, T: 0.5 });
  checkpoint(X + 2); checkpoint(X + 16, { y: 2.4 }); checkpoint(DOOR_X + 3);
  camKeys([X - 14, 16.5, 1.7, 1, 0.6], [X + 12, 18, 1.8, 2, 1.2], [X + 30, 18, 1.6, 1, 1.2], [X + 44, 16.5, 1.6, 1, 0.6], [X + LEN + 4, 16, 1.6, 1, 0]);
  hEnv(k, { fog: 0x10140c, fogD: 0.026, hemiS: 0x8a9a78, hemiG: 0x10140c, hemiI: 0.5, keyC: 0xd0e0b0, keyI: 0.25, rimC: 0xb8d070, rimI: 0.35, dustC: 0xc8d8a0, dustO: 0.3, aHum: 0.5, aDrip: 0.4 }, LEN);
  FAR[HN(k)] = ['hum2', 'relay', 'knock', 'drip'];
  const tankL = [0, 1, 2, 3, 4].map(i => pointLight({ p: [X + 6 + i * 7.5, 2.5, -4], c: 0xb8d070, i: 1.4, d: 7 }));

  // S.ph：0 还没动 / 1 拧开了，玻璃在裂 / 2 炸开了，水头往两边冲 / 3 平静下来
  const S = { ph: 0, t: 0, xl: TX, xr: TX, h: 0, swept: false };
  const G = hWatch({ gx: DOOR_X - 1.2, gy: 0, gz: -0.9, l0: X + 26, l1: DOOR_X - 2, sp: 1.0, r: 1.4, hold: 0.8, rule: 'any', when: () => S.ph < 2, lx0: DOOR_X - 3 });
  usable({ x: TX - 0.2, r: 1.0, y0: 2.3, y1: 2.6, can: () => S.ph === 0, on() { S.ph = 1; S.t = 0; fx('valve'); } });
  surface(TX - 30, TX + 30, x => S.ph >= 2 && x > S.xl && x < S.xr ? 'wade' : 'concrete');
  hint(() => S.ph === 0 && P.x > X + 22 && P.x < X + 27 && P.y < 0.5, '门口有人照着，过不去');
  hint(() => S.ph === 0 && P.x > X + 8 && P.x < X + 14 && P.y < 1, '爬上检修台');
  hint(() => S.ph === 0 && P.y > 2.3 && Math.abs(P.x - TX) < 1.5, '这只罐子已经裂了。按 <b>E</b> 拧开顶上的阀门');
  hint(() => S.ph === 1 || (S.ph === 2 && S.t < 1.5), '待在高处');

  let V = null;
  function* build(R) {
    const v = {};
    hHall(X, LEN, { far: '#12160e', win: '#2a3420', mid: '#0d100a', near: '#070906' }, { cols: [X + 3, X + 46], fore: [X + 6, X + 44], lamps: [] });
    hCutFace(R, X - 14, X + LEN + 4, 0);
    yield;
    const glass = new THREE.MeshLambertMaterial({ color: 0xa8c0b0, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide }); glass.userData.own = true;
    const inner = lam(0x4a5a2a, { emissive: new THREE.Color(0x6a8a30), emissiveIntensity: 0.45, transparent: true, opacity: 0.82 }); inner.userData.own = true;
    const ring_ = lam(0x2a302a);
    v.crowd = mkCrowd(R, 24);
    v.float = [];
    const tank = (x, z, r, h, crack) => {
      const g = grp(R, x, 0, z);
      add(g, cy(r + 0.15, r + 0.2, 0.6, 24), ring_, 0, 0.3, 0); add(g, cy(r + 0.15, r + 0.15, 0.5, 24), ring_, 0, h + 0.25, 0);
      const liq = add(g, cy(r - 0.05, r - 0.05, h - 0.7, 24), inner, 0, 0.6 + (h - 0.7) / 2, 0, false);
      const gl = add(g, new THREE.CylinderGeometry(r, r, h - 0.6, 28, 1, true), glass, 0, 0.6 + (h - 0.6) / 2, 0, false); gl.renderOrder = 30;
      for (const a of [0.4, 2.2, 4.1]) add(g, bx(0.08, h - 0.6, 0.08), ring_, Math.cos(a) * (r + 0.02), 0.6 + (h - 0.6) / 2, Math.sin(a) * (r + 0.02), false);
      pipe(R, x, h + 0.5, x, 9, z, 0.18);
      return { g, liq, gl, x, z, r, h };
    };
    v.back = [0, 1, 2, 3, 4].map(i => tank(X + 6 + i * 7.5, -6, 1.6, 6.4));
    for (const t of v.back) for (let j = 0; j < 2; j++) {
      const f = v.crowd.add(fig('body', t.x + rr(-0.6, 0.6), { z: t.z + rr(-0.6, 0.6), act: 'hunch', face: rnd() < 0.5 ? 1 : -1 }));
      f.k = 3; v.float.push({ f, t, y0: rr(1.2, 3.2), ph: rr(0, 6.3), bump: 0 });
    }
    yield;
    // 裂了的那一只：在检修台后面，玻璃上一道道白的裂纹
    v.T = tank(TX, TZ, TR, 5.4, true);
    v.cracks = [];
    for (let i = 0; i < 9; i++) {
      const c = add(R, bx(0.03, rr(0.6, 1.8), 0.02), new THREE.MeshBasicMaterial({ color: 0xe8f0e0, transparent: true, opacity: 0.7 }), TX + rr(-0.9, 0.9), rr(1.2, 4.8), TZ + TR + 0.02, false);
      c.rotation.z = rr(-0.9, 0.9); c.visible = i < 3; v.cracks.push(c);
    }
    v.tBodies = [0, 1, 2].map(j => v.crowd.add(fig('body', TX + (j - 1) * 0.5, { z: TZ + (j - 1) * 0.3, act: 'hunch', face: j % 2 ? 1 : -1 })));
    v.tBodies.forEach((f, j) => { f.y = 1.4 + j * 0.9; f.k = 3; });
    v.shards = [];
    for (let i = 0; i < 26; i++) { const s = add(R, bx(rr(0.1, 0.35), 0.02, rr(0.1, 0.3)), glass, 0, 0, 0, false); s.visible = false; v.shards.push({ m: s, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0 }); }
    // 检修台：铁架子、栏杆、一只阀门手轮
    add(R, bx(GAL.x2 - GAL.x1, 0.12, 2.0), lam(0x3a403a), (GAL.x1 + GAL.x2) / 2, 2.34, -0.2);
    for (let x = GAL.x1 + 0.2; x < GAL.x2; x += 2.1) add(R, bx(0.12, 2.3, 0.12), MAT.dark, x, 1.15, 0.6);
    add(R, bx(GAL.x2 - GAL.x1, 2.3, 0.1), lam(0x1d221d), (GAL.x1 + GAL.x2) / 2, 1.15, 0.7);
    for (let i = 0; i < 2; i++) add(R, bx(0.5, 1.2 - i * 0.6, 1.6), lam(0x3a403a), STEP.x1 + 0.4 + i * 0.6, (1.2 - i * 0.6) / 2, -0.2);
    add(R, bx(STEP.x2 - STEP.x1, 1.2, 1.6), lam(0x343a34), (STEP.x1 + STEP.x2) / 2, 0.6, -0.2);
    grating(R, GAL.x1, GAL.x2, 2.4, -1.2, 0.8);
    v.wheel = add(R, new THREE.TorusGeometry(0.3, 0.05, 8, 20), lam(0xa05030), TX - 0.2, 3.5, TZ + TR + 0.25);
    pipe(R, TX - 0.2, 3.5, TX - 0.2, 5.4, TZ + TR, 0.08);
    // 门：一扇铁门，门口站着看守
    v.door = add(R, bx(0.5, 3.4, 3), lam(0x2c302a), DOOR_X, 1.7, -1.2);
    add(R, bx(0.6, 6, 6), MAT.dark, DOOR_X, 6.4, -1.2); add(R, bx(0.6, 9, 20), MAT.dark, DOOR_X, 4.5, -14.2);
    G.build(R, v.crowd);
    // 水：一块贴着地面往两边冲的浑水，水头上一排白沫
    const wm = lam(0x5a6a3a, { emissive: new THREE.Color(0x4a5a20), emissiveIntensity: 0.35, transparent: true, opacity: 0.88 }); wm.userData.own = true;
    v.flood = add(R, bx(1, 1, 7.6), wm, TX, 0, -2.0, false); v.flood.visible = false;
    v.foam = [0, 1].map(() => { const s = glow(R, 0xe0e8d0, 2.0, 0, 0, 0, 0, GLOW_SOFT); s.material.blending = THREE.NormalBlending; return s; });
    v.crowd.addAll([]);
    V = v;
  }
  function update(dt) {
    const play = state === 'play';
    S.t += dt;
    if (S.ph === 1) { if (S.t > 0.6 && S.t - dt <= 0.6) fx('crack', 1); if (S.t > 1.3 && S.t - dt <= 1.3) fx('crack', 1.2); if (S.t > 1.9) { S.ph = 2; S.t = 0; fx('shatter', 1.2); fx('rush', 1.2); burstGlass(); } }
    if (S.ph === 2) {
      S.xr = TX + 7.5 * S.t * (1 - 0.08 * S.t); S.xl = TX - 5 * S.t * (1 - 0.1 * S.t); S.h = Math.max(0.07, 1.1 * Math.exp(-S.t / 1.3));
      if (!S.swept && S.xr > G.gx) { S.swept = true; DOOR.want = 1; fx('thud', 1); fx('clang', 1); }
      if (play && S.t < 2.6 && P.y < S.h + 0.3 && P.x > S.xl && P.x < S.xr) { caughtNow('fall'); }
      if (S.t > 5) { S.ph = 3; S.t = 0; }
    }
    hWatchAll([G], dt, play && S.ph < 2);
    const v = V; if (!v) return;
    v.door.position.y = 1.7 + DOOR.open * 3.5;
    // 罐子里漂着的人：慢慢浮沉，偶尔一个漂过来撞在玻璃上
    for (const o of v.float) {
      const f = o.f; o.bump = Math.max(0, o.bump - dt);
      if (Math.abs(o.t.x - P.x) < 8 && o.bump <= 0 && Math.random() < dt * 0.05) { o.bump = 3; fx('knock'); }
      const k = Math.sin(Math.PI * Math.max(0, o.bump) / 3);
      f.x = o.t.x + 0.4 * Math.sin(T * 0.2 + o.ph); f.y = o.y0 + 0.3 * Math.sin(T * 0.35 + o.ph); f.z = o.t.z + 0.3 * Math.cos(T * 0.17 + o.ph) + k * 1.2; f.yawT = o.ph + 0.2 * Math.sin(T * 0.1); f.dirty = true; figStep(f, dt);
    }
    // 裂了的那一只
    const T6 = v.T;
    if (S.ph === 1) v.cracks.forEach((c, i) => { c.visible = i < 3 + Math.floor(S.t * 4); });
    const broken = S.ph >= 2;
    T6.gl.visible = !broken; v.cracks.forEach(c => { if (broken) c.visible = false; });
    T6.liq.scale.y = broken ? Math.max(0.01, 1 - S.t * 0.9) : 1; T6.liq.position.y = 0.6 + (5.4 - 0.7) / 2 * T6.liq.scale.y;
    v.wheel.rotation.z = S.ph >= 1 ? -Math.min(S.t, 1.9) * 3 : 0;
    v.tBodies.forEach((f, j) => {
      if (!broken) { f.x = TX + (j - 1) * 0.5 + 0.2 * Math.sin(T * 0.3 + j); f.y = 1.4 + j * 0.9 + 0.2 * Math.sin(T * 0.4 + j); f.z = TZ + (j - 1) * 0.3; figAct(f, 'hunch'); }
      else { const end = X + 24 + j * 2.6, k2 = sstep(0, 1.6 + j * 0.4, S.ph === 2 ? S.t : 9); f.x = lerp(TX, end, k2); f.y = lerp(1.4 + j * 0.9, 0, Math.min(1, k2 * 1.4)); f.z = lerp(TZ, -0.4 - j * 0.5, k2); figAct(f, 'prone'); }
      f.dirty = true; figStep(f, dt);
    });
    // 看守：被水头冲倒，滑出去一截，趴在地上；手电掉在地上照着墙角
    if (G.f) {
      if (S.swept) { figAct(G.f, 'prone'); G.f.x = damp(G.f.x, DOOR_X + 1.6, 3, dt); G.f.z = damp(G.f.z, -1.6, 3, dt); G.f.dirty = true; }
      figStep(G.f, dt);
    }
    // 水
    const fl = v.flood; fl.visible = S.ph >= 2;
    if (fl.visible) { const xl = Math.max(X - 12, S.xl), xr = Math.min(X + LEN, S.xr); fl.scale.set(xr - xl, S.h, 1); fl.position.set((xl + xr) / 2, S.h / 2, -2.0);
      v.foam[0].position.set(xr, S.h, 0.4); v.foam[1].position.set(xl, S.h, 0.4); for (const f of v.foam) { f.material.opacity = S.ph === 2 ? 0.7 * sstep(5, 1, S.t) : 0; f.scale.setScalar(1 + 2 * S.h); } }
    for (const s of v.shards) { if (!s.m.visible) continue; s.vy -= 9 * dt; s.x += s.vx * dt; s.y = Math.max(0.02, s.y + s.vy * dt); s.z += s.vz * dt; if (s.y <= 0.02) { s.vx *= 0.9; s.vz *= 0.9; s.vy = 0; } s.m.position.set(s.x, s.y, s.z); }
    v.crowd.draw();
    tankL.forEach((l, i) => { l.on = 0.75 + 0.25 * Math.sin(T * 0.8 + i * 1.7); });
  }
  function burstGlass() {
    const v = V; if (!v) return;
    for (const s of v.shards) { const a = rr(-1.2, 1.2); Object.assign(s, { x: TX + Math.sin(a) * TR, y: rr(0.8, 4.5), z: TZ + Math.cos(a) * TR, vx: Math.sin(a) * rr(1, 5) + 1.5, vy: rr(0, 3), vz: Math.cos(a) * rr(1, 4) }); s.m.visible = true; s.m.rotation.set(rr(0, 3), rr(0, 3), rr(0, 3)); }
  }
  function reset() {
    Object.assign(S, { ph: 0, t: 0, xl: TX, xr: TX, h: 0, swept: false }); setGate(DOOR, 0); G.reset();
    if (V) { for (const s of V.shards) s.m.visible = false; if (G.f) { G.f.x = G.gx; G.f.z = G.gz; figAct(G.f, 'point'); } }
  }
  function solve() { reset(); S.ph = 3; S.swept = true; setGate(DOOR, 1); S.xl = TX - 14; S.xr = TX + 26; S.h = 0.07; }
  return defZone({ n: HN(k), vis: [X - 14, X + LEN + 4], build, update, reset, solve, unbuild() { V = null; G.unbuild(); },
    respawn() { if (S.ph < 2) { G.reset(); if (S.ph === 1) S.ph = 1; } }, S, G, DOOR });
})();
