// ============================================================
//  第 26 章 · 沉淀池（工厂深处之二）
//  分拣区冲地的水从地漏流下来，在地下汇成一大池暗红的液体（不点明是什么），水面漂着一团一团的白色内衣，里面裹着人。
//  对岸高处的走道上站着一个看守，手电沿着池面来回扫。
//  玩法：池面上的漂浮物从左边的排水口冒出来，慢慢往右漂，到了右边的格栅沉下去。站上一团跟着漂过去；
//  光扫到身上的时候别动（漂着的东西是不会动的），在光里走、跳就被盯上。快到格栅时跳上右边的岸
// ============================================================
const H2 = (() => {
  const k = 1, X = hX(k), LEN = HLEN[k];
  hChapter(k, { name: '沉淀池', sub: '漂过去', ground: 'concrete', len: LEN, tint: 0x160606 });
  const V1 = X + 8, V2 = X + 30, SURF = -0.6, BOT = -3.5;
  terrain([X - 14, 0], [V1, 0], [V1 + 0.02, BOT], [V2 - 0.02, BOT], [V2, 0], [X + LEN + 4, 0]);
  ground(X - 14, 0x261c1a); ground(X + LEN + 4, 0x221a18);
  groundBack(V1, V2, -9.4); groundFront(V1, V2, 1.6); hCut(X - 14, X + LEN + 4);
  const POOL = ooze({ x1: V1, x2: V2, y: SURF, bot: BOT, z1: -9, z2: 1.6, kind: 'blood', rate: 0.9, big: 0.1, haze: 0.1, li: 1.4 });
  checkpoint(X + 2); checkpoint(V2 + 2);
  camKeys([X - 14, 17, 1.6, 1, 1], [V1 - 3, 19, 1.4, 2, 2.8], [V2 + 1, 19, 1.4, 1.5, 2.8], [X + 44, 17, 1.6, 1, 0.8], [X + LEN + 4, 16, 1.6, 1, 0]);
  hEnv(k, { fog: 0x140808, fogD: 0.026, hemiS: 0x8a6a66, hemiG: 0x140606, hemiI: 0.42, keyC: 0xe0b0a0, keyI: 0.18, rimC: 0xff7a60, rimI: 0.3, dustC: 0xe0a090, dustO: 0.25, aDrip: 0.8, aFlow: 0.4 }, LEN);
  FAR[HN(k)] = ['gurgle', 'drip', 'chain', 'creak'];
  // 黄昏一样昏黄的工作灯，挂在对岸走道上
  workLamps([X + 12, X + 26], { c: 0xffb070, i: 1.6 });

  // ---- 漂浮物：三团，一个周期 36 秒，错开 12 秒。0–2 从排水口冒上来 / 2–30 往右漂 / 30–33 在格栅上沉下去 / 33–36 看不见 ----
  const PER = 36, W = 2.2, TOPY = SURF + 0.24, XA = V1 + 0.05, XB = V2 - 0.05 - W;
  const RAFTS = [0, 12, 24].map((ph, i) => ({ i, ph, x: XA, y: -9, sink: 0,
    s: solid({ x1: XA, x2: XA + W, y1: -9.3, y2: -9, plat: true, noclimb: true, snd: 'puddle' }) }));
  const S = { t: 0 };
  function raftAt(u) {                                    // 这一刻：左边缘在哪、顶面多高
    if (u < 2) return [XA, lerp(SURF - 1.2, TOPY, sstep(0, 2, u))];
    if (u < 30) return [lerp(XA, XB, (u - 2) / 28), TOPY + 0.03 * Math.sin(u * 1.7)];
    if (u < 33) return [XB, lerp(TOPY, SURF - 1.6, sstep(30, 33, u))];
    return [XA, SURF - 2];
  }
  // 看守：对岸高处的走道上，手电沿着池面来回扫
  const G = hWatch({ gx: X + 19, gy: 2.6, gz: -8.2, l0: V1 + 1, l1: V2 - 1, sp: 2.2, r: 1.25, hold: 1.4, rule: 'move', ty: () => TOPY, lx0: V2 - 1 });
  const onRaft = () => RAFTS.some(r => standingOn(r.s));
  hint(() => P.x > X + 2 && P.x < V1 + 0.4 && P.y > -0.3, '等一团漂浮物冒上来，站上去');
  hint(() => onRaft() && G.on > 0.5 && Math.abs(G.lx - P.x) < 4, '光照过来的时候别动');
  hint(() => onRaft() && P.x > V2 - 6, '跳上右边的岸');

  let V = null;
  function* build(R) {
    const v = {};
    hHall(X, LEN, { far: '#1a1110', win: '#3a2420', mid: '#120c0b', near: '#090605' }, { cols: [X + 4, X + 36, X + 56], fore: [X + 5, X + 40], top: 22 });
    hCutFace(R, X - 14, V1 - 0.5, 0); hCutFace(R, V2 + 0.5, X + LEN + 4, 0);   // 池子那一段不挡：前面是液体切开的那一面
    yield;
    POOL.build(R); poolShell(R, POOL, { mat: lam(0x302624) });
    add(R, bx(V2 - V1 + 1, 0.2, 22), lam(0x2a201e), (V1 + V2) / 2, -0.1, -20.6);
    // 对岸的走道：高处一条格栅，看守站在上面
    grating(R, V1 - 2, V2 + 2, 2.6, -9.0, -7.6); for (let x = V1 - 1; x < V2 + 2; x += 5) add(R, bx(0.18, 2.6 - BOT, 0.18), MAT.dark, x, (2.6 + BOT) / 2, -8.3);
    // 左边的排水口：墙上一个黑洞，暗红的水一直往下淌
    pipe(R, V1 + 1.2, 2.5, V1 + 1.2, 1.25, -8.8, 0.28); add(R, cy(0.34, 0.34, 0.2, 12), MAT.dark, V1 + 1.2, 1.2, -8.8);
    v.fall = add(R, bx(0.32, 1, 0.2), new THREE.MeshBasicMaterial({ color: 0x5a0a08 }), V1 + 1.2, 0, -8.8, false);
    // 右边的格栅：池子尽头一块铁箅子，漂到这里的都被吸下去
    for (let i = 0; i < 7; i++) add(R, bx(0.06, 0.1, 3.2), MAT.dark, XB + 0.3 + i * 0.33, SURF + 0.02, -0.4, false);
    yield;
    // 漂浮物：一团叠在一起的白色内衣，上面躺着两个人（白色内衣：尸体）
    v.crowd = mkCrowd(R, 16);
    v.rafts = RAFTS.map(r => {
      const g = grp(R, 0, 0, 0), m = lam(0xcfccc2), m2 = lam(0xb8b4a8);
      for (let j = 0; j < 9; j++) add(g, bx(rr(0.5, 0.9), rr(0.12, 0.22), rr(0.5, 0.9)), j % 2 ? m : m2, rr(0.3, W - 0.3), -0.1 + rr(-0.03, 0.05), rr(-0.6, 0.6)).rotation.y = rr(-0.6, 0.6);
      const bodies = [0, 1].map(j => v.crowd.add(fig('body', 0, { act: 'lie', face: j ? 1 : -1, still: false })));
      return { g, bodies };
    });
    // 后面也漂着几团（不能站）
    v.junk = [];
    for (let i = 0; i < 7; i++) {
      const g = grp(R, 0, SURF + 0.05, rr(-8, -2.5)), m = lam(0xc8c4b8);
      for (let j = 0; j < 5; j++) add(g, bx(rr(0.3, 0.7), 0.12, rr(0.3, 0.7)), m, rr(-0.6, 0.6), 0, rr(-0.4, 0.4), false).rotation.y = rr(0, 3);
      if (i % 2 === 0) { const b = v.crowd.add(fig('body', 0, { act: 'lie', face: 1, z: g.position.z })); b.k = 30; g.userData.b = b; }
      v.junk.push({ g, x: rr(V1 + 1, V2 - 1), sp: rr(0.2, 0.5) });
    }
    v.crowd.addAll([]);
    G.build(R, v.crowd);
    V = v;
  }
  function update(dt) {
    const play = state === 'play';
    S.t += dt;
    for (const r of RAFTS) {
      const u = ((S.t - r.ph) % PER + PER) % PER, [x, y] = raftAt(u), dx = x - r.x, dy = y - r.y;
      const on = standingOn(r.s);
      r.x = x; r.y = y; r.s.x1 = x; r.s.x2 = x + W; r.s.y2 = y; r.s.y1 = y - 0.3; r.s.off = u >= 33;
      if (on && Math.abs(dx) < 1) carryOn(r.s, dx);
      if (on && dy < 0) P.y = y;
      if (u > 30 && u < 30.1 && Math.abs(x - P.x) < 20) { POOL.burst(x + 1, 2.6, 0); fx('rush', 0.4); }
    }
    POOL.step(dt);
    // 漂在上面一动不动：缩起身子，看着就像一团东西
    if (play && onRaft() && !hMoving()) HX.pose = crouchPose(1);
    hWatchAll([G], dt, play);
    const v = V; if (!v) return;
    RAFTS.forEach((r, i) => {
      const o = v.rafts[i], vis = !r.s.off; o.g.visible = vis; o.g.position.set(r.x, r.y, 0);
      o.bodies.forEach((b, j) => { b.hide = !vis || r.y < SURF - 0.3; b.x = r.x + 0.55 + j * 1.1; b.y = r.y - 0.08; b.z = j ? -0.5 : 0.45; b.dirty = true; figStep(b, dt); });
    });
    for (const j of v.junk) { j.x += j.sp * dt; if (j.x > V2 - 0.5) j.x = V1 + 0.6; j.g.position.x = j.x; j.g.position.y = SURF + 0.04 + 0.02 * Math.sin(T + j.sp * 9); const b = j.g.userData.b; if (b) { b.x = j.x - 0.6; b.y = SURF - 0.05; b.dirty = true; figStep(b, dt); } }
    figStep(G.f, dt);
    v.fall.scale.set(1 + 0.15 * Math.sin(T * 13), 1.15 - SURF, 1); v.fall.position.y = (1.15 + SURF) / 2; v.fall.material.color.setHSL(0.0, 0.8, 0.12 + 0.03 * Math.sin(T * 7));
    if (Math.random() < dt * 3) POOL.burst(V1 + 1.2 + rr(-0.4, 0.4), 0.6, -8.5);
    v.crowd.draw();
  }
  function reset() { S.t = 6; G.reset(); }
  reset();
  return defZone({ n: HN(k), vis: [X - 14, X + LEN + 4], build, update, reset, solve() {}, unbuild() { V = null; POOL.unbuild(); G.unbuild(); },
    respawn() { G.reset(); }, RAFTS, S, G, PER, raftAt });
})();
