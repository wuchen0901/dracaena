// ============================================================
//  第 32 章 · 晾衣场（工厂深处之八）
//  几百件灰色工服挂成一排一排，风一吹一齐晃，远看像一排一排站着的人。
//  一个看守打着手电在衣服中间来回走。
//  玩法：路边隔一段有一个空着的衣钩，钩上搭着一件工服。站到它后面按 E，抬手抓住钩子、套上工服挂进去，跟着别的衣服一起晃 —— 光照过来也看不出来。
//  按方向键就下来。看守在走廊里来回巡，避开他的光，一个钩子一个钩子往前挪。
//  走到一半，看守在后面那排衣服前站住了，用棍子捅了捅其中一件 —— 那是一个躲在里面的人。他掉下来，被拖走
// ============================================================
const H8 = (() => {
  const k = 7, X = hX(k), LEN = HLEN[k];
  hChapter(k, { name: '晾衣场', sub: '挂进去', ground: 'concrete', len: LEN, tint: 0x12140f });
  terrain([X - 14, 0], [X + LEN + 4, 0]);
  ground(X - 14, 0x262823); ground(X + LEN + 4, 0x232521);
  hCut(X - 14, X + LEN + 4);
  const SPOTS = [7, 13, 19, 25, 31, 37, 43].map(dx => ({ x: X + dx }));
  checkpoint(X + 2);
  camKeys([X - 14, 16, 1.6, 1, 0.6], [X + LEN + 4, 16, 1.6, 1, 0.6]);
  hEnv(k, { fog: 0x10120e, fogD: 0.03, hemiS: 0x9aa098, hemiG: 0x12140f, hemiI: 0.62, keyC: 0xd8e0d8, keyI: 0.35, rimC: 0xb8c0b0, rimI: 0.3, dustC: 0xd0d8d0, dustO: 0.45, wind: 0.08, aWhis: 0.4, aWind: 0.2, aRoom: 0.6, aDrip: 0 }, LEN);
  FAR[HN(k)] = ['creak', 'chain', 'clank', 'creak'];
  workLamps([X + 10, X + 30, X + 50], { c: 0xdfe6e0, i: 1.4 });

  const H = { spot: null, k: 0 };                            // 挂在哪个钩子上；k 挂上去的样子到哪了
  const PAT = { x: X + 34, dir: -1, wait: 0, ev: 0, et: 0 }; // 看守走到哪；ev：0 还没出事 / 1 走过去 / 2 捅 / 3 拖走 / 4 走开了又回来 / 5 演完
  const VICTIM_X = X + 28.5, PL = X + 5, PR = X + 47;
  const G = hWatch({ gx: PAT.x, gy: 0, gz: -1.0, l0: PL, l1: PR, r: 1.25, rule: 'any', hidden: () => H.spot && H.k > 0.7,
    path: () => PAT.ev === 2 || PAT.ev === 3 ? VIC.x : PAT.x + PAT.dir * 2.6 });
  for (const s of SPOTS) usable({ x: s.x, r: 0.7, can: () => !H.spot && P.grounded, on() { H.spot = s; fx('cloth'); } });
  hint(() => !H.spot && P.x > X + 3 && P.x < X + 9 && P.x < SPOTS[0].x + 0.8, '衣钩上搭着工服。站到它后面按 <b>E</b> 挂进去');
  hint(() => H.spot && H.k > 0.7, '光照过来也看不出来。按 <b>←</b> <b>→</b> 下来');
  hint(() => !H.spot && G.W.ex > 0.2, '快挂进去');
  // 那个躲在衣服里的人
  const VIC = { x: VICTIM_X, y: 0, f: null, st: 0 };

  let V = null;
  function* build(R) {
    const v = {};
    hHall(X, LEN, { far: '#151713', win: '#3a3e36', mid: '#10120e', near: '#080907' }, { cols: [X + 3, X + 52], fore: [X + 8, X + 40], lamps: [X + 10, X + 30, X + 50] });
    hCutFace(R, X - 14, X + LEN + 4, 0);
    yield;
    // 一件工服：上衣、两条裤腿，挂在一根横杆上（原点在挂钩上）
    const geo = geoJoin(
      (() => { const g = bx(0.52, 0.62, 0.1); g.translate(0, -0.4, 0); return g; })(),
      (() => { const g = bx(0.86, 0.14, 0.09); g.translate(0, -0.14, 0); return g; })(),
      (() => { const g = bx(0.2, 0.82, 0.09); g.translate(-0.13, -1.12, 0); return g; })(),
      (() => { const g = bx(0.2, 0.82, 0.09); g.translate(0.13, -1.12, 0); return g; })(),
      (() => { const g = bx(0.6, 0.03, 0.03); g.translate(0, -0.05, 0); return g; })());
    v.geo = geo;
    const rows = [[-1.7, 0.75], [-3.2, 0.7], [-4.8, 0.7], [-6.6, 0.75], [-8.6, 0.8], [-11, 0.9]];
    const list = [];
    for (const [z, gap] of rows) for (let x = X - 12; x < X + LEN + 2; x += gap * rr(0.85, 1.15)) if (rnd() > 0.08) list.push({ x, z, y: 3.1 + rr(-0.05, 0.05), ph: rr(0, 6.3), yaw: rr(-0.25, 0.25) });
    const m = lam(0x767c7b); m.userData.own = true;
    v.uni = new THREE.InstancedMesh(geo, m, list.length); v.uni.castShadow = true; v.uni.receiveShadow = true; R.add(v.uni);
    list.forEach((u, i) => v.uni.setColorAt(i, new THREE.Color().setHSL(0.45, 0.03, rr(0.55, 0.7))));
    v.list = list;
    for (const [z] of rows) add(R, bx(LEN + 16, 0.03, 0.03), MAT.dark, X + LEN / 2 - 5, 3.15, z, false);
    for (let x = X - 10; x < X + LEN; x += 8) for (const [z] of rows) add(R, bx(0.07, 3.15, 0.07), MAT.dark, x, 1.575, z, false);
    yield;
    // 路边的衣钩：一根竖杆、一个钩子、搭着一件（挂在路前面一点，人站在它后面）
    v.spots = SPOTS.map(s => {
      add(R, bx(0.06, 2.15, 0.06), MAT.dark, s.x + 0.5, 1.075, 0.55, false); add(R, bx(0.6, 0.05, 0.05), MAT.dark, s.x + 0.2, 2.13, 0.55, false);   // 矮一些：衣服正好挡住挂在后面的人
      const g = grp(R, s.x, 2.08, 0.42); add(g, geo, m, 0, 0, 0);
      return { g };
    });
    v.crowd = mkCrowd(R, 3);
    VIC.f = v.crowd.add(fig('gray', VICTIM_X, { z: -1.6, act: 'handsup', face: 1 }));
    G.build(R, v.crowd);
    v.crowd.addAll([]);
    v.m4 = new THREE.Matrix4(); v.q = new THREE.Quaternion(); v.e = new THREE.Euler(); v.p = V3(); v.s = V3(1, 1, 1);
    V = v;
  }
  const swayAt = (x, ph) => 0.12 * Math.sin(T * 1.3 + x * 0.12) * GUST.v + 0.04 * Math.sin(T * 2.1 + ph);
  function update(dt) {
    const play = state === 'play';
    // ---- 挂着 ----
    if (H.spot) {
      const d = ctl && (keys.has('L') || keys.has('R') || keys.has('J'));
      if (d && H.k > 0.6) { H.spot = null; P.speedK = 1; fx('cloth'); }
      else { P.speedK = 0; P.vx = 0; P.x = damp(P.x, H.spot.x, 10, dt); P.facing = 1; }
    }
    H.k = damp(H.k, H.spot ? 1 : 0, 6, dt);
    if (H.k > 0.02) {
      const sw = H.spot ? swayAt(H.spot.x, 0) : 0;
      HX.pose = { arms: [{ a: 2.75 + sw, b: 0.25, k: H.k }, { a: 2.6 + sw, b: 0.35, k: H.k }], bow: -0.05 * H.k, turn: 0 };
      HERO_TOP.uTop.value.setHex(0x767c7b); HERO_TOP.uTopK.value = H.k;
    }
    // ---- 看守 ----
    if (PAT.ev === 0 && P.x > X + 24 && play && PAT.wait <= 0) PAT.ev = 1;                 // 主角走过一半：看守朝那件衣服走过去
    if (PAT.ev === 0 || PAT.ev >= 4) {
      if (PAT.wait > 0) PAT.wait -= dt;
      else { PAT.x += PAT.dir * 1.05 * dt; if (PAT.x < PL) { PAT.x = PL; PAT.dir = 1; PAT.wait = 1.6; } if (PAT.x > PR) { PAT.x = PR; PAT.dir = -1; PAT.wait = 1.6; } }
      if (PAT.ev === 4 && (PAT.et += dt) > 3) PAT.ev = 5;
    } else if (PAT.ev === 1) { const tx = VICTIM_X + 0.9; PAT.dir = tx < PAT.x ? -1 : 1; PAT.x = approach(PAT.x, tx, 1.05 * dt); if (Math.abs(PAT.x - tx) < 0.05) { PAT.ev = 2; PAT.et = 0; } }
    else if (PAT.ev === 2) { PAT.et += dt; if (PAT.et > 2.2) { PAT.ev = 3; PAT.et = 0; fx('thud', 0.8); } }
    else if (PAT.ev === 3) { PAT.et += dt; if (PAT.et > 1.0) { PAT.x += 0.8 * dt; VIC.x = PAT.x - 1.1; } if (PAT.x > PR) { PAT.ev = 4; PAT.et = 0; PAT.dir = -1; VIC.st = 2; } }
    G.gx = PAT.x;
    const ex = hWatchAll([G], dt, play);
    if (play && !(H.spot && H.k > 0.7) && Math.abs(P.x - PAT.x) < 1.1 && PAT.ev !== 3) caughtNow('alarm');   // 撞上了
    if (G.f) {
      const f = G.f; f.x = PAT.x; f.z = PAT.ev === 2 ? -1.1 : G.gz;
      if (PAT.ev === 2) { figAct(f, 'poke'); f.face = -1; f.tx = VICTIM_X; f.ty = 2.0; }
      else if (PAT.ev === 3) { figAct(f, PAT.et > 1 ? 'pull' : 'stand'); f.face = -1; f.vx = PAT.et > 1 ? 0.8 : 0; }
      else { figAct(f, PAT.wait > 0 ? 'point' : 'walk'); f.vx = PAT.wait > 0 ? 0 : PAT.dir * 1.05; }
      figStep(f, dt);
    }
    const v = V; if (!v) return;
    // 那个人
    const vf = VIC.f;
    if (PAT.ev < 2 || (PAT.ev === 2 && PAT.et < 1.6)) { vf.x = VICTIM_X; vf.y = 3.12 - vf.H * 1.13; vf.z = -1.6; figAct(vf, PAT.ev === 2 ? 'struggle' : 'handsup'); vf.yawT = -0.4 + swayAt(VICTIM_X, 1) * 2; }
    else if (PAT.ev === 2) { vf.y = Math.max(0, vf.y - 9 * dt * (PAT.et - 1.6)); figAct(vf, 'prone'); vf.yawT = undefined; vf.face = -1; }
    else { vf.y = 0; vf.x = VIC.x; figAct(vf, 'dragged'); vf.face = -1; vf.hide = VIC.st === 2; }
    vf.dirty = true; figStep(vf, dt);
    v.crowd.draw();
    // 衣服：一齐晃
    const { m4, q, e, p, s } = v;
    v.list.forEach((u, i) => { e.set(0, u.yaw, swayAt(u.x, u.ph)); q.setFromEuler(e); p.set(u.x, u.y, u.z); m4.compose(p, q, s); v.uni.setMatrixAt(i, m4); });
    v.uni.instanceMatrix.needsUpdate = true;
    SPOTS.forEach((sp, i) => { const g = v.spots[i].g; g.rotation.z = swayAt(sp.x, i); g.position.z = 0.42 + (H.spot === sp ? 0.06 * H.k : 0); });
  }
  function reset() { H.spot = null; H.k = 0; P.speedK = 1; Object.assign(PAT, { x: X + 34, dir: -1, wait: 0, ev: 0, et: 0 }); Object.assign(VIC, { x: VICTIM_X, st: 0 }); if (VIC.f) VIC.f.hide = false; G.reset(); }
  return defZone({ n: HN(k), vis: [X - 14, X + LEN + 4], build, update, reset, solve() { PAT.ev = 5; VIC.st = 2; }, unbuild() { V = null; G.unbuild(); VIC.f = null; },
    respawn() { H.spot = null; H.k = 0; P.speedK = 1; G.reset(); if (PAT.ev < 4) { Object.assign(PAT, { x: X + 34, dir: -1, wait: 0, ev: 0, et: 0 }); VIC.x = VICTIM_X; } else { PAT.x = PR; PAT.dir = -1; } }, H, PAT, G, SPOTS });
})();
