
// ============================================================
//  第六章 · 接收
//  工厂的最外一层。卡车从右边开进来，卸下一车车刚被抓来的人，穿着各色衣服，有老有少；关进牢房，再一批批往左押向改造室。
//  牢房里的人扒着栏杆往外看。主角穿着和他们一样的衣服走过：有的人朝他伸出整条手臂，有的人从栏杆边猛地往后退，挥手让他走开。
//  院子里，一个人在排队时挣扎得太厉害，被看守打倒在地，不动了。看守把他抬起来，扔上一辆推车，往左推向工厂深处 ——
//  推车的样子和轮子声都和开场一样。这就是主角自己被扔上那辆车的原因。
//  怎么通过：牢房外的走廊里躲牢房顶上那个看守的手电；趁灯不在，把箱子推到隔墙脚下翻过去；
//    院子里一盏大灯来回扫，躲在行李堆、货箱朝左的影子里一段一段往前；最后钻到刚卸完人的卡车底下，等大门为下一辆卡车打开，冲出去。
//  看到的：这条链完整了 —— 被抓来的普通人 → 换上灰衣服 → 劳动 → 干不动 → 被烧。
// ============================================================
const E6_X = E4_END + 58;
const E6 = (() => {
  const X = E6_X, END = X + 92, BZ = -1.75, CELL_H = 2.6, WZ = -2.6, GX = X + 88;
  const C = chapter({ n: 5, x0: X + 0.5, start: X + 2, name: '接收', sub: '他们是这样来的', ground: 'concrete' });   // 游戏里的第 5 章（焚化炉删掉以后）
  terrain([END, 0]); ground(X + 1, 0x1d2226); ground(GX - 1, 0x1d2226);
  const CELLS = [8, 16, 24, 32].map(x => X + x), CW = 7.4;
  const COVA = [[13.2, 14.8], [27.0, 28.6]].map(([a, b]) => ({ a: X + a, b: X + b, zb: -1.45, zf: -0.55 }));
  const WAT = { a: X + 7, b: X + 39, wait: 0, dir: 1, ax: X + 9 };
  const WALL = solid({ id: 'e6wall', x1: X + 41.4, x2: X + 42.6, y1: 0, y2: 2.6, snd: 'concrete' });
  const crate = pushable({ id: 'e6crate', x: X + 31.2, w: 1.2, h: 1.25, min: X + 30.6, max: X + 40.75, snd: 'wood' });
  // 院子里朝左投下影子的三样东西（都摆在路上；平时从前面绕过去，见 20-world.js 的 thru），和卡车底下
  const KS = [[49.5, 51, 1.4], [58.5, 60, 1.3], [66, 67.5, 1.4]].map(([a, b, h], i) => solid({ id: 'e6k' + i, x1: X + a, x2: X + b, y1: 0, y2: h, snd: i === 1 ? 'wood' : 'metal', thru: true, zf: 0.58 }));
  const TRUCKX = X + 75.2, UNDER = [X + 72.5, X + 81.4];
  ceiling([X + 72.2, 1.16], [X + 81.6, 1.16]);
  const GATE = gate({ id: 'e6gate', x: GX, w: 1.0, h: 4.2, T: 2.4 });
  const FLOOD = { x: X + 86.2, y: 5.6, z: -1.6, ax: X + 60, az: 0, t: 0 };
  // ev：0 还没开始 / 1 卡车上的人下来排队 / 2 队伍往左走，一个人挣扎 / 3 被打倒 / 4 推车来了，抬上去，推走 / 5 剩下的人被押走 / 6 院子空了，大灯来回扫 / 7 大门开了
  const S = { ev: 0, et: 0, under: 0, gateT: 0, cart: X + 44, truck: X + 130, round: 0 }, W = { ex: 0, caught: 0 };
  const WG = fig('guard', X + 9, { y: CELL_H + 0.08, z: WZ });
  const G1 = fig('guard', X + 55, { z: -1.4, face: 1 }), G2 = fig('guard', X + 72.5, { z: -2.0, face: -1 }), GG = fig('guard', X + 85.2, { z: -2.4, face: -1, turn: 0.6 });
  // 牢房里的人：一半扒着栏杆。主角走近，有的伸出手臂，有的往后退、挥手让他走开
  const CAP = [];
  CELLS.forEach((c0, k) => { for (let i = 0; i < (k % 2 ? 3 : 4); i++) { const front = i < 2, x = c0 + 0.9 + (CW - 1.8) * (i + 0.5) / 4 + (frand() - 0.5) * 0.5;
    const f = fig('civ', x, front ? { z: BZ - 0.38, act: 'bars', yawT: -1.25, H: i === 1 && k === 2 ? 1.25 : undefined, old: k === 1 && i === 0 } : { z: -3.6 - frand() * 0.6, act: i === 2 ? 'sit' : 'hunch', face: frand() < 0.5 ? 1 : -1, old: i === 3 });
    f.home = { x: f.x, z: f.z, act: f.act, yawT: f.yawT }; f.front = front; f.shy = (i + k) % 2 === 1; CAP.push(f); } });
  // 院子里排队的人：前四个已经站着，后三个从卡车上下来
  const LINE = [0, 1, 2, 3, 4, 5, 6].map(i => { const f = fig('civ', X + 55.5 + 1.5 * i, { z: -2.0, face: -1, c: [1, 6, 3, 8, 2, 7, 5][i], old: i === 1, H: i === 5 ? 1.3 : undefined, act: i === 1 ? 'hunch' : 'stand' }); f.i = i; f.lx = X + 55.5 + 1.5 * i; return f; });
  const VIC = LINE[3];
  const FIGS = [WG, G1, G2, GG, ...CAP, ...LINE];

  for (const x of [2, 14, 27.8, 45, 48.4, 57.4, 65, 76.5]) checkpoint(X + x);
  camKeys([X + 3, 20, 1.9, 1.5], [X + 8, 21.5, 2.3, 1.5], [X + 36, 21.5, 2.4, 2], [X + 41, 22, 2.8, 1.5], [X + 46, 24, 2.6, 4], [X + 70, 24, 2.6, 2], [X + 80, 23, 2.4, 2.5], [GX, 21, 2.2, 1], [END, 20, 2.0, 1]);
  // 光：冷。走廊的灯从牢房后面、栏杆缝里切进来
  env(X + 0.7, { fog: 0x1b2126, fogD: 0.023, hemiS: 0x9fb2be, hemiG: 0x13181c, hemiI: 0.68, keyC: 0xd8e6f0, keyI: 0.38, keyDir: [0.15, 1, 0.3], rimC: 0xa8c4d6, rimI: 0.55,
    dustC: 0xd0e0ea, dustO: 0.34, wind: 0.02, ext: 0, vig: 1.1, aRoom: 1, roomF: 190, aHum: 0.4, aDrip: 0.4, aFar: 0.9, rvHall: 1 });
  env(X + 43, {});
  env(X + 47, { fog: 0x1a2028, fogD: 0.02, hemiI: 0.6, ext: 0.25, aRoom: 0.6, aWind: 0.3 });
  env(GX - 0.7, {});

  const inA = () => P.x > X + 5 && P.x < X + 41.4 && P.y < 2, hidA = () => inShadow(P.x, COVA, WG.x, WZ);
  const inYard = () => P.x > WALL.x2 && P.x < GX;
  const hidY = () => (P.x > UNDER[0] && P.x < UNDER[1] && P.y < 0.3) || KS.some(k => P.y < 0.4 && P.x < k.x1 - 0.1 && P.x > k.x1 - 2.3);
  hint(() => S.ev === 0 && inA() && P.x < X + 12 && W.ex < 0.2, '牢房顶上有人打着手电 —— 光扫过来时，站到那摞货箱前面的影子里');
  hint(() => crate.x < X + 40 && P.x > X + 28.5 && P.x < X + 41 && P.y < 0.5 && P.mode !== 'push' && Math.abs(P.x - crate.x) < 2.6, '趁灯不在，按住 <b>E</b> 把箱子推到隔墙脚下，翻过去');
  hint(() => S.ev >= 1 && S.ev <= 5 && W.ex < 0.3, '躲在铁箱后面，别出去');
  hint(() => S.ev === 6 && inYard() && P.x < UNDER[0] && W.ex < 0.3, '大灯扫过来时，蹲到行李堆、货箱左边的影子里；钻到卡车底下去');
  hint(() => S.ev === 6 && P.x > UNDER[0] && P.x < UNDER[1], '在车底下等着 —— 大门会为下一辆卡车打开');
  hint(() => S.ev === 7 && GATE.open > 0.4 && P.x < GX, '趁现在 —— 冲出大门');

  const LAMPS = [X + 4];
  for (const c0 of CELLS) spotLight({ p: [c0 + CW / 2, 4.6, -7.5], t: [c0 + CW / 2, 0, 0.8], c: 0xcfe2f0, i: 3.2, a: 0.5, d: 16, pen: 0.8 });   // 从牢房后面照出来的走廊灯
  const bounce = pointLight({ p: [X, 1.2, 0.6], c: 0xfff0d0, i: 2.2, d: 9, dec: 1.5, on: 0 });
  const headL = pointLight({ p: [X + 130, 1.6, -3.4], c: 0xfff2d0, i: 30, d: 16, dec: 1.4, on: 0 });                        // 开进来的那辆卡车的车灯

  let V = null;
  function* build(R) {
    const v = {}, B = baker(); B.vary = 0.07;
    hallLayers(X - 8, X + 46, { far: '#151b20', win: '#3f5262', mid: '#0e1317', near: '#0a0d10', near2: '#161d24' }, { cols: [X + 5.2, X + 44.2], fore: [X + 20.4], zMid: -16, beam: false });
    // 院子：露天，四面高墙。后墙上一排窗，墙头的铁丝网，远处的岗楼
    backdrop(X + 42, X + 96, -2, 30, -24, 8, g => { setInk(g, '#11161b'); box(g, X + 42, -2, 54, 15); for (let x = X + 46; x < X + 94; x += 6) { g.fillStyle = '#2a3642'; box(g, x, 4, 1.2, 5); } setInk(g, '#0b0f13'); fence(g, X + 42, X + 96, () => 13, 1.6, 2.4, [0.5, 0.85]); box(g, X + 60, 13, 5, 8); poly(g, [[X + 59, 21], [X + 66, 21], [X + 62.5, 24]]); g.clearRect(X + 60.8, 17.5, 3.4, 1.6); });
    backdrop(X + 44, X + 92, -3, 10, 6, 20, g => { setInk(g, '#040506'); box(g, X + 54.6, -3, 0.42, 13); for (let x = X + 46; x < X + 84; x += rr(10, 18)) cable(g, x, 10, x + rr(6, 12), 10, rr(1.5, 2.4), 0.09); }, { fog: false, blur: 2.2, order: 4000 });
    yield;
    floorSeams(R, X - 4, GX - 1);
    // 牢房：后墙、顶（看守在上面走）、隔板、正面的栏杆
    add(R, bx(31.6, 6.5, 0.4), MAT.concrete, X + 23.7, 3.25, -5.0); add(R, bx(31.6, 0.16, 3.3), MAT.steel, X + 23.7, CELL_H, -3.3);
    for (let k = 0; k <= 4; k++) add(R, bx(0.12, CELL_H, 3.2), MAT.dark, CELLS[0] - 0.3 + 8 * k, CELL_H / 2, -3.35);
    for (const c0 of CELLS) barsInto(B, c0, c0 + CW, BZ, CELL_H);
    B.at(0, 0, 0); for (let x = X + 7.6; x < X + 40; x += 1.5) B.box(0.04, 1.0, 0.04, 0x1a1d1f, x, CELL_H + 0.5, -1.9); B.box(31.6, 0.04, 0.04, 0x1a1d1f, X + 23.7, CELL_H + 1.0, -1.9);
    for (const c of COVA) { const cx = (c.a + c.b) / 2; for (let j = 0; j < 3; j++) { B.at(cx + rr(-0.05, 0.05), j * 0.84, -1.0, rr(-0.06, 0.06)); B.box(1.56, 0.8, 0.9, j % 2 ? 0x363b40 : 0x40443f, 0, 0.42, 0); B.box(1.6, 0.05, 0.94, 0x22262a, 0, 0.02, 0); } }
    // 隔墙（后面那一段上有一扇门：推车和队伍从那里进出），箱子
    add(R, bx(1.2, 2.6, 2.6), MAT.wall2, X + 42, 1.3, 0.2); add(R, bx(1.2, 9, 3.4), MAT.wall2, X + 42, 4.5, 3.2); add(R, bx(1.2, 9, 12), MAT.wall2, X + 42, 4.5, -9.4); add(R, bx(1.2, 6, 2.3), MAT.wall2, X + 42, 3 + 3, -2.25);
    v.crateG = mkCrate(R, crate, 'wood'); dragMarks(R, X + 30.8, X + 41.2);
    yield;
    // 院子里挡光的三样东西：铁箱、行李堆、货箱
    for (const [i, c] of [[0, 0x33383c], [2, 0x3a3d3a]]) { const k = KS[i], w = k.x2 - k.x1; B.at((k.x1 + k.x2) / 2, 0, 0); B.box(w, k.y2, 1.1, c, 0, k.y2 / 2, 0); for (const y of [0.04, k.y2 * 0.5, k.y2 - 0.03]) B.box(w + 0.06, 0.07, 1.16, 0x1e2124, 0, y, 0); }
    B.at((KS[1].x1 + KS[1].x2) / 2, 0, 0); for (let i = 0; i < 16; i++) B.box(rr(0.45, 0.8), rr(0.28, 0.42), rr(0.4, 0.7), pick([0x5a4a38, 0x3f4a55, 0x6b5a3c, 0x4a3f3a, 0x55604a]), rr(-0.42, 0.42), 0.16 + (i % 4) * 0.3 + rr(0, 0.05), rr(-0.25, 0.25), 0, rr(-0.5, 0.5), rr(-0.08, 0.08));
    truckInto(B, TRUCKX, 0, 1); B.at(TRUCKX - 3.3, 0, 0); B.box(0.08, 0.08, 2.2, 0x1c2022, 0, 0.66, 0); B.box(0.5, 0.06, 2.0, 0x2b3134, -0.3, 0.9, 0, 0, 0, 0.9);   // 放下来的后挡板
    // 大门：一堵一直砌到远处的外墙，门是一整扇往上提的铁板；门边一根杆子上装着大灯
    v.gate = mkGateDoor(grp(R, 0, 0, -2.6), GATE, { depth: 8 });                                 // 大门有两条车道那么宽：近处这条停着卸完人的卡车，远处那条进车
    add(R, cy(0.09, 0.12, FLOOD.y, 8), MAT.dark, FLOOD.x, FLOOD.y / 2, FLOOD.z - 0.3); v.floodHead = grp(R, FLOOD.x, FLOOD.y, FLOOD.z);
    add(v.floodHead, bx(0.5, 0.45, 0.6), MAT.steel, 0, 0, 0); v.floodEye = glow(v.floodHead, 0xeaf4f6, 4, 0.85, 0, 0, 0.36, GLOW_SOFT);
    B.mesh(R);
    add(R, bx(1.4, 48, 25.4), MAT.concrete, GX, 24, -19.3); add(R, bx(1.4, 48 - GATE.h, 8), MAT.concrete, GX, GATE.h + (48 - GATE.h) / 2, -2.6); add(R, bx(1.4, 70, 40), MAT.black, GX, 30, 21.4, false);   // 外墙：靠镜头这一侧是一整面黑墙，镜头穿过它的时候换成外面的夜色
    v.cart = mkCart(R, S.cart, -1.3);
    { const T2 = baker(); truckInto(T2, 0, 0, -1, { c: 0x262c30 }); v.truck = grp(R, S.truck, 0, -4.2); T2.mesh(v.truck); for (const z of [-0.7, 0.7]) glow(v.truck, 0xfff2d0, 1.6, 0.9, -6.2, 1.35, z); }
    v.coneA = mkCone(R, 0.27, { c: 0xfff0d0, op: 0.1 }); v.coneF = mkCone(R, 0.2, { op: 0.07 });
    glow(R, 0xcfe2f0, 1.6, 0.6, X + 4, 5.2, -3.4);
    v.crowd = mkCrowd(R, FIGS.length + 2); v.crowd.addAll(FIGS);
    V = v;
  }

  function stepCells(dt) {                               // 牢房里的人看见主角走过
    for (const f of CAP) {
      if (!f.front) continue;
      const d = P.x - f.x, near = Math.abs(d) < 5.5 && P.x < WALL.x1 && P.y < 1.5 && state === 'play';
      if (near && f.shy) { f.z = damp(f.z, -3.3, 3.5, dt); f.yawT = undefined; f.face = d > 0 ? 1 : -1; f.arm = 0; figAct(f, 'shoo', { tx: P.x, ty: P.y + 1.3 }); }
      else if (near) { f.yawT = undefined; f.face = d > 0 ? 1 : -1; figAct(f, 'reach', { tx: f.x + clamp(d, -1.6, 1.6), ty: P.y + 1.0, arm: 0 }); }
      else { f.z = damp(f.z, f.home.z, 1.5, dt); f.yawT = f.home.yawT; figAct(f, 'bars'); }
    }
  }
  function startEvent() { S.ev = 1; S.et = 0; }
  function resetEvent() {
    S.ev = 0; S.et = 0; S.cart = X + 44;
    LINE.forEach(f => { Object.assign(f, { x: f.lx, y: 0, z: -2.0, face: -1, vx: 0, hide: f.i >= 4, k: 10, yawT: undefined }); figAct(f, f.i === 1 ? 'hunch' : 'stand'); figSnap(f); });
    Object.assign(G1, { x: X + 54.3, z: -1.4, face: 1, vx: 0, hide: false }); figAct(G1, 'stand'); Object.assign(G2, { x: X + 73, z: -2.0, face: -1, vx: 0, hide: true });
  }
  function stepEvent(dt) {
    const t = S.et += dt;
    if (S.ev === 1) {                                    // 卡车上剩下的三个人跳下来，被赶着排到队尾
      LINE.forEach(f => { if (f.i < 4) return; const t0 = (f.i - 4) * 1.3; if (t < t0) return; f.hide = false;
        if (t < t0 + 0.45) { const k = (t - t0) / 0.45; f.x = TRUCKX - 3.6 - 0.5 * k; f.y = 1.3 * (1 - k * k); f.z = -0.3 - 1.7 * k; figAct(f, 'cower', { k: 14 }); } else { f.y = 0; f.z = damp(f.z, -2.0, 4, dt); figAct(f, figGo(f, f.lx, 1.5, dt) ? 'stand' : f.i === 5 ? 'shuffle' : 'walk'); if (f.act === 'stand') f.face = -1; } });
      G2.hide = t < 3; if (!G2.hide) { figAct(G2, figGo(G2, LINE[6].lx + 1.4, 1.3, dt) ? 'stand' : 'walk'); G2.face = -1; }
      if (t > 7.2) { S.ev = 2; S.et = 0; }
    } else if (S.ev === 2) {                             // 队伍往左挪，一个人挣扎着往外挣
      for (const f of LINE) { if (f === VIC) continue; f.x -= 0.5 * dt; f.vx = -0.5; figAct(f, f.i === 1 || f.i === 5 ? 'shuffle' : 'walk', { gait: 0.26 }); }
      figAct(VIC, 'struggle'); VIC.vx = 0; VIC.z = damp(VIC.z, -1.0, 1.6, dt); VIC.x += 0.25 * dt;
      figAct(G1, 'walk'); figGo(G1, VIC.x - 0.75, 1.6, dt); G1.z = damp(G1.z, -1.05, 2, dt);
      if (t > 2.6) { S.ev = 3; S.et = 0; G1.face = 1; G1.vx = 0; figAct(G1, 'strike'); }
    } else if (S.ev === 3) {                             // 看守抡起棍子：他倒在地上，不动了。别的人一下子都缩起来
      for (const f of LINE) if (f !== VIC) { f.vx = 0; figAct(f, t > 0.4 && t < 2.2 ? 'cower' : f.i === 1 ? 'hunch' : 'stand'); }
      if (t > 0.34 && VIC.act !== 'prone') { figAct(VIC, 'prone', { k: 8, face: 1 }); fx('thud', 1); }
      if (t > 1.2) figAct(G1, 'stand');
      if (t > 2.6) { S.ev = 4; S.et = 0; S.sub = 0; S.cart = X + 43.6; Object.assign(G2, { x: X + 42.4, z: -1.3, face: 1, hide: false }); figAct(G2, 'push'); }
    } else if (S.ev === 4) {                             // 另一个看守推着空车从门里出来 —— 和开场一样的车，一样的轮子声；两个人把他抬起来扔上去，往左推回去
      if (S.sub === 0) { AUD.wheels = 0.5; S.cart = Math.min(VIC.x - 1.5, S.cart + 1.5 * dt); G2.x = S.cart - 1.25; G2.vx = 1.5; if (S.cart >= VIC.x - 1.5) { S.sub = 1; S.et = 0; } }
      else if (S.sub === 1) { figAct(G1, 'lift'); figAct(G2, 'stand'); G2.vx = 0; const k = sstep(0.4, 1.3, t); VIC.x = lerp(VIC.x, S.cart + 0.05, k); VIC.z = lerp(VIC.z, -1.3, k); VIC.y = (CART.bed + 0.03) * k + 0.5 * Math.sin(Math.PI * k);
        if (k >= 1) { figAct(VIC, 'lie', { k: 9, face: -1 }); if (t > 1.7) { S.sub = 2; fx('clunk'); figAct(G1, 'stand'); G2.face = -1; } } }
      else if (S.sub === 2) { figAct(G2, 'walk'); if (figGo(G2, S.cart + 1.25, 1.6, dt)) { S.sub = 3; G2.face = -1; figAct(G2, 'push'); } }
      else { AUD.wheels = 0.5; S.cart -= 1.2 * dt; G2.x = S.cart + 1.25; G2.vx = -1.2; VIC.x = S.cart + 0.05; if (S.cart < X + 43.2) { S.ev = 5; S.et = 0; G2.hide = true; VIC.hide = true; } }
    } else if (S.ev === 5) {                             // 剩下的人被押着从门里走了
      let left = 0; for (const f of LINE) { if (f === VIC || f.hide) continue; left++; f.z = damp(f.z, -2.2, 2, dt); figAct(f, f.i === 1 || f.i === 5 ? 'shuffle' : 'walk', { gait: 0.36 }); if (figGo(f, X + 43, 1.15, dt)) f.hide = true; }
      figAct(G1, 'walk'); G1.z = damp(G1.z, -2.6, 2, dt); const last = LINE.filter(f => f !== VIC && !f.hide).pop(); if (last) figGo(G1, last.x + 1.3, 1.3, dt); else if (figGo(G1, X + 43, 1.3, dt)) G1.hide = true;
      if (!left && G1.hide) { S.ev = 6; S.et = 0; }
    }
  }
  function update(dt) {
    const play = state === 'play';
    // 牢房顶上的看守
    if (WAT.wait > 0) { WG.vx = 0; figAct(WG, 'stand'); if ((WAT.wait -= dt) <= 0) WAT.dir = -WAT.dir; }
    else { figAct(WG, 'walk'); if (figGo(WG, WAT.dir > 0 ? WAT.b : WAT.a, 1.1 * (1 - 0.8 * W.ex), dt)) WAT.wait = 1.4; }
    WAT.ax = damp(WAT.ax, WG.x + WG.face * 1.2, 3, dt);
    const kx = sstep(0.15, 1, W.ex), a = inA(), axA = a ? lerp(WAT.ax, P.x, kx) : WAT.ax;
    let seen = a && P.y < 1.7 && Math.abs(P.x - WAT.ax) < 1.35 && !hidA();
    stepCells(dt);
    // 院子
    const y = inYard();
    if (S.ev === 0 && play && P.x > X + 47.2 && P.grounded && W.caught === 0) startEvent();
    if (S.ev >= 1 && S.ev <= 5) { stepEvent(dt); if (y && play) camOvr = { d: 25, yo: 2.6, xo: 6.5 }; }
    FLOOD.t += dt;
    const sweep = X + 58.5 + 13 * Math.sin(FLOOD.t * 0.38), busy = S.ev >= 1 && S.ev <= 5;
    const fx_ = busy ? VIC.x - 0.6 + 1.5 * Math.sin(FLOOD.t * 0.7) : S.ev === 7 ? lerp(sweep, GX - 3, sstep(0, 2, S.gateT)) : sweep, fz = busy ? -1.4 : S.ev === 7 ? lerp(0, -3.4, sstep(0, 2, S.gateT)) : 0;
    FLOOD.ax = damp(FLOOD.ax, y ? lerp(fx_, P.x, kx) : fx_, 4, dt); FLOOD.az = damp(FLOOD.az, lerp(fz, 0, y ? kx : 0), 4, dt);
    if (y) {
      TIRED.rushT = 0.5;
      if (busy) seen = seen || (P.x > KS[0].x1 - 0.12) || P.y > 0.6;
      else if (S.ev === 6) seen = seen || (Math.abs(P.x - FLOOD.ax) < 1.8 && Math.abs(FLOOD.az) < 1.2 && !hidY());
      if (play && hidY() && Math.abs(P.vx) < 1.6 && (busy || Math.abs(P.x - FLOOD.ax) < 7 || P.x > UNDER[0])) HX.pose = crouchPose(sstep(1.6, 0.6, Math.abs(P.vx)));
    }
    watchStep(W, seen, dt, y ? 0.7 : 0.55, 0.9); HX.alert = W.ex;
    if (play && a && hidA() && Math.abs(P.x - WAT.ax) < 5 && Math.abs(P.vx) < 1.6) HX.pose = crouchPose(sstep(1.6, 0.6, Math.abs(P.vx)));
    // 钻到卡车底下等：大门为下一辆卡车打开，大灯转过去照着它；车开过去以后门再关上，没出去就等下一辆
    const under = P.x > UNDER[0] && P.x < UNDER[1] && P.y < 0.3;
    if (S.ev === 6) { S.under = under ? S.under + dt : 0; if (S.under > 2.2 && play) { S.ev = 7; S.gateT = 0; S.truck = X + 114; GATE.want = 1; fx('engine'); } }
    else if (S.ev === 7) {
      S.gateT += dt; if (S.gateT > 1.0) S.truck = Math.max(X + 52, S.truck - 6 * dt * (1 - sstep(X + 62, X + 52, S.truck) * 0.9));   // 开进来，在院子里停下
      if (S.gateT > 11 && P.x < GX - 0.6) { GATE.want = 0; if (GATE.open <= 0) { S.ev = 6; S.under = 0; } }
      if (P.x > GX + 1.2) GATE.want = 0;
    }
    headL.on = S.ev === 7 ? 1 : 0; headL.p[0] = S.truck - 7.5;
    const useA = P.x < X + 44;
    if (Math.abs(P.x - (X + 46)) < 70) {
      if (useA) useBeam(WG.x + WG.face * 0.3, CELL_H + 1.4, WZ + 0.25, axA, 0.25, 0, { ang: 0.27, i: 26, c: C_WARM, alert: kx });
      else useBeam(FLOOD.x, FLOOD.y, FLOOD.z + 0.3, FLOOD.ax, 0.3, FLOOD.az, { ang: 0.1, i: 40, alert: kx });
      bounce.on = 1; bounce.p[0] = useA ? axA : FLOOD.ax; bounce.c.copy(beam.color);
    } else bounce.on = 0;
    for (const f of FIGS) figStep(f, dt);
    const v = V; if (!v) return;
    v.crateG.position.x = crate.x; v.gate.sync(GATE);
    v.cart.visible = S.ev === 4; v.cart.position.x = S.cart;
    v.truck.position.x = S.truck; v.truck.visible = S.ev === 7;
    v.coneA.m.visible = useA || P.x < X + 60; v.coneA.aim(WG.x + WG.face * 0.3, CELL_H + 1.4, WZ + 0.25, axA, 0.2, 0); v.coneA.m.material.color.copy(useA ? beam.color : C_WARM);
    v.coneF.aim(FLOOD.x, FLOOD.y, FLOOD.z + 0.3, FLOOD.ax, 0.2, FLOOD.az); v.coneF.m.material.color.copy(useA ? C_CALM : beam.color); v.floodHead.lookAt(FLOOD.ax, 0.2, FLOOD.az);
    v.crowd.draw();
  }
  function reset() {
    resetEvent(); placeBox(crate, X + 31.2); setGate(GATE, 0); Object.assign(S, { under: 0, gateT: 0, truck: X + 130 }); Object.assign(W, { ex: 0, caught: 0 });
    Object.assign(WG, { x: X + 9, face: 1, vx: 0 }); Object.assign(WAT, { wait: 0, dir: 1, ax: X + 9 });
    for (const f of CAP) { Object.assign(f, { x: f.home.x, z: f.home.z, yawT: f.home.yawT }); figAct(f, f.home.act); figSnap(f); }
  }
  function solve() { reset(); S.ev = 6; for (const f of LINE) f.hide = true; G1.hide = true; placeBox(crate, X + 40.75); }
  return defZone({ n: 5, vis: [X - 8, END + 1], build, update, reset, solve, unbuild() { V = null; },
    respawn(c) {
      if (c.x < X || c.x > END) return;
      Object.assign(W, { ex: 0, caught: 0 });
      if (S.ev >= 1 && S.ev <= 5) resetEvent();
      if (S.ev === 7) { S.ev = 6; S.under = 0; setGate(GATE, 0); }
      if (c.x < X + 44 && Math.abs(WG.x - c.x) < 7) { WG.x = c.x < X + 23 ? WAT.b : WAT.a; WAT.dir = c.x < X + 23 ? -1 : 1; WAT.wait = 0; WAT.ax = WG.x; }
    }, S, W, WAT, WG, FLOOD, KS, COVA, crate, GATE, UNDER, hidA, hidY, LINE, VIC });
})();
