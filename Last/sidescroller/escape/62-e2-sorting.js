
// ============================================================
//  第二章 · 分拣
//  炉子的上游是一个大厅。后面一排工位上，看守弯着腰把身体上的灰色工服剥下来，扔进大桶；剥完的身体只剩白色内衣，推向左边的炉子。
//  洗好的工服叠成一摞摞，装上同一种推车，往右推走 —— 和主角同一个方向。
//  怎么通过：一 一个看守打着手电在后面的过道里来回走，光扫过来时站到大桶、货箱前面的影子里；
//    二 两台压机一下一下往下砸，看准抬起来的空当过去；
//    三 一盏灯来回扫着运工服的那条路，运工服的推车堆得比人高，跟着它走，待在它的影子里（按住 Shift 慢走正好跟得上）。
//  看到的：他们死之前都穿着同样的灰色工服；这是每天都在做的事，连衣服都在回收。留下的问题：穿灰衣服的人，死之前在哪里？
// ============================================================
const E2 = (() => {
  const X = 80, END = X + 100, PZ = -5;                    // PZ：打手电的看守走的那条过道
  const C = chapter({ n: 2, x0: X + 0.5, start: X + 3, name: '分拣', sub: '连衣服都在回收', ground: 'concrete' });
  terrain([END, 0]); ground(X + 1, 0x1d1c18); ground(END, 0x1d1c18);
  // 一 四处挡光的东西：大桶、货箱、一车堆得很高的工服。[左, 右]，都摆在主角走的那条线后面一米来远
  const COVERS = [[11.8, 13.2], [18.2, 19.8], [24.5, 25.9], [30.9, 32.5]].map(([a, b]) => ({ a: X + a, b: X + b, zb: -1.7, zf: -0.62 }));
  const PAT = { a: X + 8.5, b: X + 37.5, wait: 0, dir: -1, ax: X + 28 };
  const GP = fig('guard', X + 30, { z: PZ, face: -1 });
  // 二 两台压机：[在哪, 错开多少秒]。一轮 3.4 秒：抬着 2 秒 → 灯闪 0.7 秒 → 砸下去、压住 0.7 秒
  const PRESS = [{ x: X + 46, ph: 0, y: 3 }, { x: X + 53, ph: 1.7, y: 3 }], CYC = 3.4;
  // 三 一盏来回扫的灯，和三辆往右走的工服推车（一辆接一辆，隔 12 米）
  const LAMP = { x: X + 76, y: 3.4, z: -7.2, ax: X + 76, r: 1.9 }, CC = [0, 1, 2].map(i => ({ x: 0, i })), C_GAP = 12, C_V = 1.25, C_X0 = X + 59, PILLAR = { a: X + 75.3, b: X + 76.7, zb: -1.7, zf: -0.6 };
  const S = { t: 0 }, W = { ex: 0, caught: 0 };
  // 后面的三个工位：看守、等着剥的一车（还穿着灰色工服）、剥完的一车（白色内衣）、一只大桶
  const ST = [13, 23, 33].map(x => X + x), SZ = -8.6;
  const SG = ST.map(x => fig('guard', x + 0.55, { z: SZ - 0.75, act: 'bend', yawT: -1.2 }));
  const SB = ST.map(x => [bodiesFor(2, { kind: 'worn' }), bodiesFor(2)]);
  const OUT = { x: X + 30, bodies: bodiesFor(3) };          // 往左推走的一车白色身体
  const LG = fig('guard', LAMP.x + 0.9, { z: LAMP.z + 0.3, face: -1, turn: 0.6 });
  const FIGS = [GP, LG, ...SG, ...SB.flat(2), ...OUT.bodies];

  for (const x of [3, 12.5, 25.2, 41, 49.5, 57, 76, 95]) checkpoint(X + x);
  camKeys([X + 1, 19.5, 1.9, 1], [X + 8, 22, 2.2, 1.5], [X + 40, 22, 2.2, 1], [X + 46, 20.5, 2.0, 0.6], [X + 56, 20.5, 2.0, 0.6], [X + 62, 24, 2.5, 1.5], [X + 92, 24, 2.5, 0], [END, 19, 1.8, -1]);
  // 光：昏黄的工作灯，闷
  env(X + 0.7, { fog: 0x1f1c15, fogD: 0.027, hemiS: 0xa39a84, hemiG: 0x17140e, hemiI: 0.78, keyC: 0xffe0b0, keyI: 0.42, keyDir: [0.2, 1, 0.35], rimC: 0xffcf8a, rimI: 0.55,
    dustC: 0xffe2b0, dustO: 0.4, wind: 0.02, ext: 0, vig: 1.1, aRoom: 1, roomF: 180, aHum: 0.5, aDrip: 0.3, aFar: 0.9, rvHall: 1 });
  env(END - 0.7, {});

  const inA = () => P.x > X + 6 && P.x < X + 41, inC = () => P.x > X + 60.5 && P.x < X + 92.5;
  const cartCovers = () => CC.filter(c => c.x > C_X0 + 0.5 && c.x < X + 94).map(c => ({ a: c.x - 0.82, b: c.x + 0.82, zb: -1.58, zf: -0.62 }));
  const hidA = () => inShadow(P.x, COVERS, GP.x, PZ), hidC = () => inShadow(P.x, [...cartCovers(), PILLAR], LAMP.x, LAMP.z);
  hint(() => inA() && P.x < X + 11.5 && W.ex < 0.2, '躲开手电 —— 光扫过来时，站到大桶和货箱前面的影子里');
  hint(() => PRESS.some(p => P.x > p.x - 3.2 && P.x < p.x - 0.9) && P.cp < 5, '等压机抬起来再过去');
  hint(() => P.x > X + 57 && P.x < X + 63 && W.ex < 0.2, '跟着运工服的推车走，待在它的影子里（按住 <b>Shift</b> 慢走）');

  const LAMPS = [X + 13, X + 23, X + 33, X + 49.5, X + 66, X + 86];
  workLamps(LAMPS.slice(3), { c: 0xffc070, i: 3.6 });
  ST.forEach(x => pointLight({ p: [x + 0.6, 3.2, SZ + 0.8], c: 0xffc070, i: 9, d: 8, dec: 1.6 }));       // 工位上方各一盏灯
  const bounce = pointLight({ p: [X, 1.2, 0.6], c: 0xfff0d0, i: 2.2, d: 9, dec: 1.5, on: 0 });           // 手电照着的那块地反上来的光

  let V = null;
  function* build(R) {
    const v = {}, B = baker(); B.vary = 0.07;
    hallLayers(X - 1.5, END + 1.5, { far: '#17150f', win: '#3d3520', mid: '#0d0c09', near: '#090806', near2: '#1c170d' }, { lamps: LAMPS.slice(3), cols: [X + 5.2, X + 42.6, X + 58.8, X + 93.6], fore: [X + 21.3, X + 70.5], zMid: -15 });
    yield;
    floorSeams(R, X + 2, END - 1);
    // 一 挡光的东西
    B.at(X + 12.5, 0, -1.15); B.cyl(0.7, 0.66, 1.55, 18, 0x3d4441, 0, 0.775, 0); B.torus(0.7, 0.03, 0x24282a, 0, 1.2, 0, Math.PI / 2, 0, 0); B.torus(0.68, 0.03, 0x24282a, 0, 0.4, 0, Math.PI / 2, 0, 0);
    B.at(X + 19, 0, -1.15); B.box(1.6, 1.5, 1.05, 0x4a4338, 0, 0.75, 0); B.box(1.66, 0.08, 1.11, 0x2e2a24, 0, 1.5, 0); B.box(1.66, 0.08, 1.11, 0x2e2a24, 0, 0.3, 0);
    B.at(X + 31.7, 0, -1.15); B.cyl(0.8, 0.76, 1.6, 18, 0x3d4441, 0, 0.8, 0); B.torus(0.8, 0.03, 0x24282a, 0, 1.25, 0, Math.PI / 2, 0, 0);
    v.cover3 = mkCart(R, X + 25.2, -1.1, 'stack');
    // 后面的工位：一张长台、一只大桶；两辆推车（左边剥完的，右边等着剥的）
    for (const x of ST) { B.at(x, 0, SZ); B.box(2.6, 0.08, 0.9, 0x34383a, 0.6, 0.86, -1.4); for (const sx of [-0.6, 1.8]) B.box(0.08, 0.86, 0.8, 0x24282a, sx, 0.43, -1.4);
      B.cyl(0.8, 0.75, 1.5, 18, 0x3a403e, 2.6, 0.75, 0.1); for (let k = 0; k < 5; k++) B.box(0.5, 0.12, 0.4, 0x8d9391, 2.6 + rr(-0.3, 0.3), 1.5 + k * 0.05, 0.1 + rr(-0.3, 0.3), 0, rr(0, 3), rr(-0.4, 0.4)); }
    v.stCarts = ST.map(x => [mkCart(R, x + 0.6, SZ), mkCart(R, x - 1.6, SZ + 0.1)]);
    v.outCart = mkCart(R, OUT.x, -11.2);
    yield;
    // 二 压机：一道门架跨在路上，压头顺着两根立柱上下；底下一块铁砧，旁边堆着压成捆的工服
    v.heads = PRESS.map(p => {
      for (const z of [-1.25, 1.25]) add(R, bx(0.4, 6.4, 0.4), MAT.steel, p.x, 3.2, z); add(R, bx(2.2, 0.8, 3.1), MAT.steel, p.x, 6.6, 0); add(R, bx(1.9, 0.06, 2.1), MAT.dark, p.x, 0.03, 0, false).receiveShadow = true;
      const h = add(R, bx(1.8, 1.0, 2.0), MAT.rust2, p.x, 3.5, 0); add(h, cy(0.2, 0.2, 3.0, 10), MAT.steel, 0, 2.0, 0, false); add(h, bx(1.86, 0.12, 2.06), MAT.rust, 0, -0.5, 0, false);
      for (let k = 0; k < 4; k++) add(R, bx(0.7, 0.34, 0.5), lam(0x878d8b), p.x + rr(-0.5, 0.5), 0.17 + k * 0.34, -2.0 + rr(-0.1, 0.1)).rotation.y = rr(-0.2, 0.2);
      return { h, lamp: glow(R, 0xffa23a, 1.6, 0, p.x - 1.2, 2.4, 1.4), lens: add(R, new THREE.SphereGeometry(0.09, 10, 8), unlit(0x3a2410, { fog: false }), p.x - 1.2, 2.4, 1.38, false) };
    });
    add(R, bx(0.3, 2.0, 0.3), MAT.dark, PRESS[0].x - 1.2, 1.2, 1.3, false); add(R, bx(0.3, 2.0, 0.3), MAT.dark, PRESS[1].x - 1.2, 1.2, 1.3, false);
    yield;
    // 三 运工服的那条路：一道矮矮的铁轨，推车从左边的隔断里出来，到右边的隔断进去；后面一盏装在杆子上的灯，旁边站着一个看守
    for (const z of [-1.45, -0.75]) add(R, bx(37, 0.05, 0.06), MAT.steel, X + 76.5, 0.025, z, false).receiveShadow = true;
    for (const x of [C_X0 - 0.6, X + 94.6]) { add(R, bx(0.5, 3.4, 0.5), MAT.concrete, x, 1.7, -2.0); add(R, bx(0.5, 1.2, 2.2), MAT.concrete, x, 2.8, -1.1); add(R, bx(0.5, 3.4, 8), MAT.concrete, x, 1.7, -6.2); }
    B.at(X + 76, 0, -1.15); B.box(1.4, 2.6, 1.1, 0x30363a, 0, 1.3, 0); B.box(1.5, 0.12, 1.2, 0x202426, 0, 2.6, 0);                 // 路中间一只高高的配电柜：这里歇一口气
    add(R, cy(0.07, 0.1, LAMP.y, 8), MAT.dark, LAMP.x, LAMP.y / 2, LAMP.z); v.lampHead = grp(R, LAMP.x, LAMP.y, LAMP.z + 0.2);
    add(v.lampHead, bx(0.34, 0.3, 0.5), MAT.steel, 0, 0, 0); v.lampEye = glow(v.lampHead, 0xfff0d0, 2.4, 0.8, 0, 0, 0.32, GLOW_SOFT);
    v.ccarts = CC.map(() => mkCart(R, 0, -1.1, 'stack'));
    v.coneA = mkCone(R, 0.26, { c: 0xfff0d0, op: 0.1 }); v.coneC = mkCone(R, 0.26, { c: 0xfff0d0, op: 0.09 });
    v.cloths = ST.map(() => add(R, bx(0.5, 0.1, 0.4), lam(0x8d9391, { emissive: 0x8d9391, emissiveIntensity: 0.2 }), 0, -5, 0));
    B.mesh(R);
    v.lampG = lampGlows(R, LAMPS.slice(3)); for (const x of ST) glow(R, 0xffc070, 1.6, 0.7, x + 0.6, 3.3, SZ + 0.6);
    divider(R, END);
    v.crowd = mkCrowd(R, FIGS.length + 2); v.crowd.addAll(FIGS);
    V = v;
  }

  function update(dt) {
    const play = state === 'play';
    S.t += dt;
    // 一 打手电的看守：来回走，到头站一下再掉头；盯上人了就慢下来，手电转过来
    if (PAT.wait > 0) { GP.vx = 0; figAct(GP, 'stand'); if ((PAT.wait -= dt) <= 0) PAT.dir = -PAT.dir; }
    else { figAct(GP, 'walk'); if (figGo(GP, PAT.dir > 0 ? PAT.b : PAT.a, 1.15 * (1 - 0.8 * W.ex), dt)) PAT.wait = 1.3; }
    PAT.ax = damp(PAT.ax, GP.x + GP.face * 1.9, 3, dt);
    const kx = sstep(0.15, 1, W.ex), a = inA(), c = inC();
    const axA = a ? lerp(PAT.ax, P.x, kx) : PAT.ax, seenA = a && P.y < 1.7 && Math.abs(P.x - PAT.ax) < 1.35 && !hidA();
    // 三 来回扫的灯
    LAMP.ax = LAMP.x + 15 * Math.sin(S.t * 0.6 - 0.25 * Math.sin(S.t * 0.6) * W.ex);
    const axC = c ? lerp(LAMP.ax, P.x, kx) : LAMP.ax, seenC = c && P.y < 1.9 && Math.abs(P.x - LAMP.ax) < LAMP.r && !hidC();
    watchStep(W, seenA || seenC, dt, 0.55, 0.9);
    HX.alert = W.ex;
    if (play && ((a && hidA() && Math.abs(P.x - PAT.ax) < 5) || (c && hidC() && Math.abs(P.x - LAMP.ax) < 6)) && Math.abs(P.vx) < 1.6) HX.pose = crouchPose(sstep(1.6, 0.6, Math.abs(P.vx)));
    if (a || c) TIRED.rushT = 0.5;
    const gx = GP.x + GP.face * 0.3, useA = P.x < X + 46;
    if (Math.abs(P.x - (X + 50)) < 70) {
      if (useA) useBeam(gx, 1.35, PZ + 0.25, axA, 0.25, 0, { ang: 0.27, i: 26, c: C_WARM, alert: kx });
      else useBeam(LAMP.x, LAMP.y, LAMP.z + 0.3, axC, 0.25, 0, { ang: 0.24, i: 34, c: C_WARM, alert: kx });
      bounce.on = 1; bounce.p[0] = useA ? axA : axC; bounce.c.copy(beam.color);
    } else bounce.on = 0;
    // 三辆工服推车：一直往右走
    CC.forEach((cc, i) => { cc.x = C_X0 + (S.t * C_V + i * C_GAP) % (3 * C_GAP); });
    if (c) AUD.wheels = Math.max(AUD.wheels, 0.25 * Math.max(0, ...CC.map(cc => sstep(9, 2, Math.abs(cc.x - P.x)))));
    // 二 压机
    for (const p of PRESS) {
      const tt = (S.t + p.ph) % CYC, was = p.y;
      p.y = tt < 2.7 ? 3.0 : tt < 2.9 ? lerp(3.0, 0.75, (tt - 2.7) / 0.2) : tt < 3.15 ? 0.75 : lerp(0.75, 3.0, (tt - 3.15) / 0.25); p.warn = tt > 2.0 && tt < 2.7 && tt % 0.24 < 0.13;
      if (was > 0.8 && p.y <= 0.8) fx('press', sstep(26, 5, Math.abs(P.x - p.x)) * 0.8);
      if (play && Math.abs(P.x - p.x) < 0.98 && p.y - 0.5 < P.y + 1.15) caughtNow('thud');
    }
    // 后面的工位：隔几秒一件灰色工服被扔进大桶；一车白色的身体慢慢往左推走
    OUT.x -= 0.5 * dt; if (OUT.x < X - 2) OUT.x = X + 42;
    cartBodies(OUT.bodies, OUT.x, 0, -11.2);
    for (const f of FIGS) figStep(f, dt);
    const v = V; if (!v) return;
    v.outCart.position.x = OUT.x;
    ST.forEach((x, i) => { const u = ((S.t + i * 0.9) % 2.8) / 0.75, m = v.cloths[i]; m.visible = u < 1; if (u < 1) { m.position.set(lerp(x + 0.7, x + 2.6, u), 1.3 + 2.2 * u * (1 - u) + 0.3 * u, SZ - 0.3 + 0.4 * u); m.rotation.set(u * 5, u * 3, u * 4); } });
    v.heads.forEach((o, i) => { const p = PRESS[i]; o.h.position.y = p.y; o.lamp.material.opacity = p.warn ? 0.95 : 0; o.lens.material.color.setHex(p.warn ? 0xffc070 : 0x3a2410); });
    CC.forEach((cc, i) => { v.ccarts[i].position.x = cc.x; });
    v.coneA.aim(gx, 1.35, PZ + 0.25, axA, 0.2, 0); v.coneA.m.material.color.copy(useA ? beam.color : C_WARM);
    v.coneC.aim(LAMP.x, LAMP.y, LAMP.z + 0.3, axC, 0.2, 0); v.coneC.m.material.color.copy(useA ? C_WARM : beam.color); v.lampHead.lookAt(axC, 0.2, 0);
    v.crowd.draw();
  }
  function place() {
    SB.forEach((pair, i) => { cartBodies(pair[0], ST[i] + 0.6, 0, SZ); cartBodies(pair[1], ST[i] - 1.6, 0, SZ + 0.1); });
    Object.assign(GP, { x: X + 30, face: -1, vx: 0 }); Object.assign(PAT, { wait: 0, dir: -1, ax: X + 28 }); Object.assign(W, { ex: 0, caught: 0 });
  }
  function reset() { S.t = 0; place(); }
  place();
  return defZone({ n: 2, vis: [X - 2, END + 1], build, update, reset, solve() { reset(); }, unbuild() { V = null; },
    respawn(c) { if (c.x > X && c.x < END) { Object.assign(W, { ex: 0, caught: 0 }); if (c.x < X + 44 && Math.abs(GP.x - c.x) < 7) { GP.x = c.x < X + 23 ? PAT.b : PAT.a; PAT.dir = c.x < X + 23 ? -1 : 1; PAT.wait = 0; PAT.ax = GP.x; } } },
    S, W, PAT, GP, PRESS, LAMP, CC, COVERS, hidA, hidC });
})();
