
// ============================================================
//  第三章 · 暂存
//  再往上游是一排铁笼。笼子里的人穿着灰色工服，驼着背，有的坐着，有的靠着栏杆：还活着，只是干不动了。
//  他们会怕：推车的轮子声一响，所有人往墙角缩。看守打开一只笼子，把一个人拖出来；他抓着栏杆不肯放，被拽倒，拖上推车，往左推向炉子。
//  主角躲在铁箱后面。推车从他身后过去，走出几米，车上脸朝后躺着的人看见了他，撑起身子，伸直手臂指了过来。看守转过头 —— 放狗。
//  怎么通过：前半段躲笼顶上那个看守的手电（站到堆着的货箱前面的影子里）；被指认以后往右跑：翻过铁箱，爬上装卸台（狗上不来，但它过一阵会找到路），
//    把台上的箱子推到隔墙脚下翻过去；狗从侧门绕过来，再跑一段，拉下闸门把它关在后面。
//  看到的：被烧的人不一定已经死了，这里的人知道自己接下来会去哪里。留下的问题：他们为什么会变成这样？
// ============================================================
const E3 = (() => {
  const X = 180, END = X + 110, BZ = -1.75, CAGE_H = 2.6, WZ = -2.6;          // BZ：铁笼正面的栏杆 / WZ：笼顶上看守走的那一道
  const C = chapter({ n: 3, x0: X + 0.5, start: X + 3, name: '暂存', sub: '他们会怕', ground: 'concrete' });
  terrain([END, 0]); ground(X + 1, 0x1c1b18); ground(END, 0x1c1b18);
  const CAGES = [0, 1, 2, 3, 4, 5].map(k => X + 10 + 7 * k), CW = 6.4, DOORX = [X + 45.4, X + 46.6];    // 六只铁笼各自的左边；第六只的门
  // 前半段挡光的东西：两摞货箱
  const COVA = [[15.6, 17.2], [24.0, 25.6]].map(([a, b]) => ({ a: X + a, b: X + b, zb: -1.45, zf: -0.55 }));
  const WAT = { a: X + 9, b: X + 31, wait: 0, dir: 1, ax: X + 12 };
  const HIDE = [X + 35.0, X + 38.5];                                         // 躲在铁箱后面的这一段
  solid({ id: 'e3box', x1: X + 38.6, x2: X + 40.2, y1: 0, y2: 1.25, snd: 'metal' });
  const DOCK = solid({ id: 'e3dock', x1: X + 54, x2: X + 68, y1: 0, y2: 1.1, snd: 'concrete' });
  const WALL = solid({ id: 'e3wall', x1: X + 68, x2: X + 69.2, y1: 0, y2: 3.3, snd: 'concrete' });
  const crate = pushable({ id: 'e3crate', x: X + 57.6, y1: 1.1, w: 1.15, h: 1.0, min: X + 55.6, max: X + 67.4, snd: 'wood' });
  solid({ id: 'e3hurdle1', x1: X + 76, x2: X + 76.9, y1: 0, y2: 0.9, snd: 'metal' });
  solid({ id: 'e3hurdle2', x1: X + 84, x2: X + 85.6, y1: 0, y2: CART.rail, snd: 'metal' });
  const GATE = gate({ id: 'e3gate', x: X + 96, T: 0.45 }), LEVER = { x: X + 98.3, t: 0 };
  usable({ id: 'e3lever', x: LEVER.x, r: 0.9, can: () => GATE.want === 1 && S.ev >= 5, on() { GATE.want = 0; fx('lever'); } });
  // ev：0 还没开始 / 1 轮子声，看守推着空车过来 / 2 开笼门、进去 / 3 把人拖出来、拖上车 / 4 推着车往左，经过主角 / 5 被指认，追 / 7 闸门落下，甩开了
  const S = { ev: 0, et: 0, step: 0, dockT: 0, cart: X + 56, door: 0 }, W = { ex: 0, caught: 0 };
  const DOG0 = [X + 27.5, -0.9], DOG = { x: DOG0[0], y: 0, z: DOG0[1], vx: 0, vy: 0, facing: 1, mode: 'curl', st: 'sleep', t: 0, leap: null };
  const WG = fig('guard', X + 12, { y: CAGE_H + 0.08, z: WZ }), DG = fig('guard', X + 58, { z: -1.05, face: -1, hide: true });
  // 笼子里的人
  const INM = []; let M = null;
  CAGES.forEach((c0, k) => { const n = k === 5 ? 3 : 2 + (k % 2);
    for (let i = 0; i < n; i++) { const kind = (i + k) % 3, x = c0 + 0.9 + (CW - 1.8) * (i + 0.5) / n + (frand() - 0.5) * 0.6;
      const f = fig('worn', x, kind === 0 ? { z: -4.25, act: 'sit', face: frand() < 0.5 ? 1 : -1, turn: 0.5 } : kind === 1 ? { z: BZ - 0.4, act: 'lean', face: frand() < 0.5 ? 1 : -1, turn: 0.9 } : { z: -3.2 + frand() * 0.5, act: 'hunch', face: frand() < 0.5 ? 1 : -1 });
      f.home = { x: f.x, z: f.z, act: f.act, face: f.face }; f.cage = k; f.corner = x < c0 + CW / 2 ? c0 + 0.6 + 0.5 * i : c0 + CW - 0.6 - 0.5 * i; INM.push(f);
      if (k === 5 && i === 0) M = f; } });
  M.home.x = M.x = X + 47.6; M.home.z = M.z = -3.4; M.home.act = M.act = 'hunch'; M.corner = X + 46.7;
  const FIGS = [WG, DG, ...INM];

  for (const x of [3, 16.4, 24.8, 37.3, 56, 72, 99.5]) checkpoint(X + x);
  camKeys([X + 1, 19.5, 1.9, 1], [X + 8, 21.5, 2.3, 1.5], [X + 34, 21.5, 2.3, 2], [X + 52, 22, 2.4, 2.5], [X + 60, 22, 3.0, 1.5], [X + 67, 22, 3.4, 0.5], [X + 72, 21, 2.2, 2.5], [X + 94, 21, 2.0, 1.5], [X + 100, 20, 1.9, 0], [END, 19, 1.8, -1]);
  env(X + 0.7, { fog: 0x1e1b15, fogD: 0.027, hemiS: 0xa0977f, hemiG: 0x16130d, hemiI: 0.76, keyC: 0xffe0b0, keyI: 0.4, keyDir: [0.2, 1, 0.35], rimC: 0xffcf8a, rimI: 0.5,
    dustC: 0xffe2b0, dustO: 0.38, wind: 0.02, ext: 0, vig: 1.1, aRoom: 1, roomF: 170, aHum: 0.3, aDrip: 0.5, aFar: 0.8, rvHall: 1 });
  env(END - 0.7, {});

  const inA = () => P.x > X + 7 && P.x < X + 33.6, hidA = () => inShadow(P.x, COVA, WG.x, WZ), inHide = () => P.x > HIDE[0] && P.x < HIDE[1] && P.y < 0.4;
  hint(() => S.ev === 0 && inA() && P.x < X + 15 && W.ex < 0.2, '笼顶上有人打着手电 —— 光扫过来时，站到那摞货箱前面的影子里');
  hint(() => S.ev >= 1 && S.ev <= 4 && W.ex < 0.3, '有人来了 —— 躲在铁箱后面，别出去');
  hint(() => S.ev === 5 && P.x < X + 53, '跑！翻过铁箱，往右');
  hint(() => S.ev === 5 && P.x > X + 54 && P.x < X + 68 && P.y > 1 && crate.x < X + 67, '按住 <b>E</b> 把箱子推到墙脚，翻过去 —— 狗会找到路上来');
  hint(() => S.ev === 5 && P.x > X + 69.3 && P.x < X + 97, '别停，往右跑');
  hint(() => S.ev === 5 && GATE.want === 1 && Math.abs(P.x - LEVER.x) < 0.9, '按 <b>E</b> 放下闸门');

  const LAMPS = [X + 20, X + 34, X + 48, X + 62, X + 80, X + 92];
  workLamps(LAMPS, { c: 0xffc070, i: 3.2 });
  const bounce = pointLight({ p: [X, 1.2, 0.6], c: 0xfff0d0, i: 2.2, d: 9, dec: 1.5, on: 0 });
  const gateL = pointLight({ p: [LEVER.x, 2.2, 0.3], c: 0xff4a2a, i: 2, d: 5, dec: 2 });

  let V = null;
  function* build(R) {
    const v = {}, B = baker(); B.vary = 0.07;
    hallLayers(X - 1.5, END + 1.5, { far: '#16140f', win: '#3a321f', mid: '#0d0c09', near: '#090806', near2: '#1c170d' }, { lamps: LAMPS, cols: [X + 5.3, X + 53, X + 71.5, X + 103.5], fore: [X + 29.6, X + 88.4], zMid: -15 });
    yield;
    floorSeams(R, X + 2, END - 1);
    // 铁笼：后墙、笼顶（看守在上面走）、每两只中间一道隔板、正面一排栏杆；第六只留一个门
    add(R, bx(42.4, 6.5, 0.4), MAT.concrete, X + 30.7, 3.25, -5.0); add(R, bx(42.4, 0.16, 3.3), MAT.steel, X + 30.7, CAGE_H, -3.3);
    for (let k = 0; k <= 6; k++) add(R, bx(0.12, CAGE_H, 3.2), MAT.dark, CAGES[0] - 0.3 + 7 * k, CAGE_H / 2, -3.35);
    CAGES.forEach((c0, k) => barsInto(B, c0, c0 + CW, BZ, CAGE_H, k === 5 ? { skip: DOORX } : {}));
    B.at(0, 0, 0); for (let x = X + 9.5; x < X + 52; x += 1.5) B.box(0.04, 1.0, 0.04, 0x1a1d1f, x, CAGE_H + 0.5, -1.9); B.box(42.4, 0.04, 0.04, 0x1a1d1f, X + 30.7, CAGE_H + 1.0, -1.9);   // 笼顶的栏杆
    v.cdoor = grp(R, DOORX[0], 0, BZ + 0.06); { const D = baker(); barsInto(D, 0, DOORX[1] - DOORX[0], 0, CAGE_H - 0.1); D.mesh(v.cdoor); }
    yield;
    // 两摞货箱（挡手电）、路上的铁箱（躲在它后面）、睡着狗的垫子
    for (const c of COVA) { const cx = (c.a + c.b) / 2; for (let j = 0; j < 3; j++) { B.at(cx + rr(-0.05, 0.05), j * 0.84, -1.0, rr(-0.06, 0.06)); B.box(1.56, 0.8, 0.9, j % 2 ? 0x3a3d3c : 0x444039, 0, 0.42, 0); B.box(1.6, 0.05, 0.94, 0x24262a, 0, 0.02, 0); } }
    B.at(X + 39.4, 0, 0); B.box(1.6, 1.25, 1.0, 0x33383a, 0, 0.625, 0); for (const y of [0.04, 0.62, 1.22]) B.box(1.66, 0.07, 1.06, 0x1f2224, 0, y, 0); for (const sx of [-0.78, 0.78]) B.box(0.07, 1.25, 1.06, 0x1f2224, sx, 0.625, 0);
    B.at(DOG0[0], 0, DOG0[1]); B.box(1.2, 0.05, 0.8, 0x3a332a, 0, 0.03, 0); B.cyl(0.03, 0.03, 0.5, 6, 0x1a1c1e, -0.7, 0.25, -0.3);
    // 装卸台、隔墙、台上的箱子
    add(R, bx(14, 1.1, 5), MAT.concrete, X + 61, 0.55, -1.2); add(R, bx(14.04, 0.07, 0.1), MAT.edge, X + 61, 1.1, 1.32, false);
    add(R, bx(1.2, 3.3, 9), MAT.wall2, X + 68.6, 1.65, -2.6); add(R, bx(1.26, 0.1, 9.04), MAT.pale, X + 68.6, 3.3, -2.6, false);
    for (let j = 0; j < 3; j++) { B.at(X + 53.1, 0, -1.3 - j * 0.1); B.box(1.2, 0.55, 1.0, 0x3d3f3b, 0, 0.3 + j * 0.02, 0); }                        // 台子左头堆着的矮箱：狗后来就是从这里蹿上去的
    v.crateG = mkCrate(R, crate, 'wood'); dragMarks(R, X + 57.2, X + 67.8, 1.1);
    // 隔墙后面：两处要翻过去的东西、闸门和它的拉杆
    B.at(X + 76.45, 0, 0); B.box(0.9, 0.9, 1.0, 0x33383a, 0, 0.45, 0); for (const y of [0.04, 0.86]) B.box(0.96, 0.07, 1.06, 0x1f2224, 0, y, 0);
    v.hurdle = mkCart(R, X + 84.8, 0, 'clothes');
    add(R, bx(1.2, 9, 12), MAT.wall2, GATE.x, 4.5, -7.4); add(R, bx(1.2, 9 - GATE.h, 2.8), MAT.wall2, GATE.x, GATE.h + (9 - GATE.h) / 2, 0); add(R, bx(1.2, 9, 3), MAT.wall2, GATE.x, 4.5, 2.9);
    v.gate = mkGateDoor(R, GATE, { bars: true }); v.lever = mkLever(R, LEVER.x, 0.35, -0.9);
    B.mesh(R);
    v.lampG = lampGlows(R, LAMPS);
    v.cart = mkCart(R, S.cart, -1.05); v.dog = makeCritter('dog', R);
    v.cone = mkCone(R, 0.27, { c: 0xfff0d0, op: 0.1 });
    divider(R, END);
    v.crowd = mkCrowd(R, FIGS.length + 2); v.crowd.addAll(FIGS);
    V = v;
  }

  function cowerAll(on) { for (const f of INM) { if (f === M && S.ev >= 3) continue; f.goal = on ? 'corner' : 'home'; } }
  function stepInmates(dt) {
    for (const f of INM) {
      if (f.goal === 'corner') { f.z = damp(f.z, -4.2, 2.5, dt); if (figGo(f, f.corner, 1.5, dt)) { figAct(f, 'cower'); f.face = f.corner < CAGES[f.cage] + CW / 2 ? 1 : -1; f.goal = null; } else figAct(f, 'shuffle', { gait: 0.3 }); }
      else if (f.goal === 'home') { f.z = damp(f.z, f.home.z, 1.5, dt); if (figGo(f, f.home.x, 0.5, dt)) { figAct(f, f.home.act); f.face = f.home.face; f.goal = null; } else figAct(f, 'shuffle'); }
    }
  }
  function startEvent() { S.ev = 1; S.et = 0; S.step = 0; S.cart = X + 56; Object.assign(DG, { x: X + 57.25, z: -1.05, face: -1, hide: false, yawT: undefined }); figAct(DG, 'push'); cowerAll(true); }
  function resetEvent() {
    S.ev = 0; S.et = 0; S.step = 0; S.cart = X + 56; S.door = 0; S.dockT = 0; DG.hide = true; DG.yawT = undefined;
    for (const f of INM) { Object.assign(f, { x: f.home.x, z: f.home.z, y: 0, face: f.home.face, goal: null, vx: 0, yawT: undefined, k: 10 }); figAct(f, f.home.act); figSnap(f); }
    Object.assign(DOG, { x: DOG0[0], y: 0, z: DOG0[1], vx: 0, vy: 0, facing: 1, mode: 'curl', st: 'sleep', t: 0, leap: null });
  }
  function stepEvent(dt) {                               // 拖人的那一场：一步一步往下走
    const t = S.et += dt, ph = S.ev;
    if (ph === 1) {                                      // 看守推着空车过来，停在第六只笼子的门左边
      AUD.wheels = 0.45; S.cart = Math.max(X + 44, S.cart - 1.3 * dt); DG.x = S.cart + 1.25; DG.vx = -1.3;
      if (S.cart <= X + 44) { S.ev = 2; S.et = 0; DG.vx = 0; }
    } else if (ph === 2) {                               // 开门，进去
      figAct(DG, 'walk'); S.door = sstep(0.5, 1.3, t);
      if (t < 0.6) figGo(DG, X + 46.0, 1.2, dt); else { DG.z = damp(DG.z, -3.1, 2.2, dt); figGo(DG, X + 46.9, 1.0, dt); }
      if (t > 2.4) { S.ev = 3; S.et = 0; S.step = 0; }
    } else if (ph === 3) {
      if (S.step === 0) {                                // 抓住他，倒退着往外拖；他挣着
        figAct(DG, 'pull'); DG.face = 1; DG.vx = -0.8; DG.x = Math.max(X + 45.1, DG.x - 0.8 * dt); DG.z = damp(DG.z, -1.15, 1.2, dt);
        figAct(M, 'struggle'); M.face = -1; M.x = damp(M.x, DG.x + 0.8, 7, dt); M.z = damp(M.z, DG.z - 0.25, 3, dt); M.goal = null;
        if (DG.x <= X + 45.1 && t > 2.0) { S.step = 1; S.et = 0; }
      } else if (S.step === 1) {                         // 到了门口，他抓住栏杆不放
        DG.vx = -0.15 * Math.sin(t * 6); figAct(M, 'cling', { tx: X + 47.0, ty: 1.45, face: 1 }); M.z = damp(M.z, BZ + 0.1, 4, dt);
        if (t > 2.4) { S.step = 2; S.et = 0; fx('thud', 0.7); }
      } else if (S.step === 2) {                         // 被拽倒，在地上拖到车旁边
        figAct(M, 'dragged', { k: 7, face: 1 }); DG.vx = -0.9; DG.x = Math.max(X + 43.2, DG.x - 0.9 * dt); M.x = DG.x + 1.35; M.z = damp(M.z, -1.1, 3, dt);
        if (DG.x <= X + 43.2 && t > 1.2) { S.step = 3; S.et = 0; }
      } else if (S.step === 3) {                         // 抬起来，扔上车
        figAct(DG, 'lift'); DG.vx = 0; const k = sstep(0.3, 1.1, t); M.x = lerp(M.x, S.cart - 0.05, k); M.y = (CART.bed + 0.03) * k + 0.5 * Math.sin(Math.PI * k) * (1 - k * 0.3); M.z = -1.05;
        if (k >= 1) { figAct(M, 'lie', { face: 1, k: 8 }); if (t > 1.4) { S.step = 4; S.et = 0; fx('clunk'); } }
      } else {                                           // 绕到车后面
        figAct(DG, 'walk'); DG.z = damp(DG.z, -1.05, 4, dt); S.door = 1 - sstep(0, 0.8, t);
        if (figGo(DG, S.cart + 1.25, 1.4, dt)) { S.ev = 4; S.et = 0; S.step = 0; DG.face = -1; figAct(DG, 'push'); cowerAll(false); }
      }
    } else if (ph === 4) {                               // 推着车往左走，从主角身边经过
      if (S.step === 0) {                                // 车从铁箱后面过去，一直推到主角左边几米远
        AUD.wheels = 0.45; S.cart -= 1.15 * dt; DG.x = S.cart + 1.25; DG.vx = -1.15; M.x = S.cart - 0.05;
        if (S.cart < Math.min(X + 33.2, P.x - 2.6)) { S.step = 1; S.et = 0; }
      } else if (S.step === 1) {                         // 车上的人脸朝后躺着，看见了铁箱后面的他：撑起身子，伸直手臂指过来；看守回过头
        AUD.wheels = 0.45 * (1 - sstep(0.5, 1.0, t)); const v = 1.15 * (1 - sstep(0.5, 1.0, t)); S.cart -= v * dt; DG.x = S.cart + 1.25; DG.vx = -v; M.x = S.cart - 0.05;
        figAct(M, 'sitpoint', { tx: P.x, ty: P.y + 0.9, k: 9 });
        if (t > 1.0) { figAct(DG, 'stand'); DG.vx = 0; DG.face = 1; }
        if (t > 1.9) { S.ev = 5; S.et = 0; fx('alarm'); figAct(DG, 'point', { tx: P.x, ty: P.y + 1.0, yawT: undefined, face: P.x > DG.x ? 1 : -1 }); DOG.st = 'wake'; DOG.t = 0; }
      }
    }
  }
  function stepDog(dt) {
    const D = DOG, play = state === 'play', low = y => P.y < y + 0.75 && P.mode !== 'mantle';
    D.t += dt;
    const bite = () => { if (play && S.ev === 5) { D.mode = 'bark'; fx('bark', 1); S.ev = 5.5; caughtNow('alarm'); } };
    const run = (tx, v) => { const dx = tx - D.x; if (Math.abs(dx) > 0.12) { D.vx = Math.sign(dx) * v; D.x += D.vx * dt; D.facing = Math.sign(dx); D.mode = 'run'; } else { D.vx = 0; D.mode = 'bark'; D.facing = P.x >= D.x ? 1 : -1; } };
    if (D.st === 'sleep') { D.mode = 'curl'; return; }
    if (D.st === 'wake') { D.mode = 'bark'; D.facing = 1; if (D.t > 1.3) D.st = 'run'; }
    else if (D.st === 'run') {                           // 在地上追：主角上了台子，它在台子脚下干着急
      D.z = damp(D.z, -0.45, 6, dt); D.y = 0;
      run(clamp(P.x, X + 20, DOCK.x1 - 0.7), 4.3);
      if (low(0) && Math.abs(P.x - D.x) < 0.65) bite();
      if (P.x > DOCK.x1 && P.y > 1.0 && D.x > DOCK.x1 - 1.2) { D.st = 'dock'; S.dockT = 0; }
    } else if (D.st === 'dock') {                        // 过一阵，它从台子左头的矮箱上蹿上来
      D.mode = 'bark'; D.facing = 1; D.vx = 0; S.dockT += dt;
      if (P.x < DOCK.x1 && low(0)) D.st = 'run';
      else if (S.dockT > 12.5) { D.st = 'leap'; D.t = 0; D.leap = [D.x, DOCK.x1 + 0.8]; fx('bark', 1); }
      if (P.x > WALL.x2) { D.st = 'around'; D.t = 0; }
    } else if (D.st === 'leap') {
      const k = Math.min(1, D.t / 0.55); D.x = lerp(D.leap[0], D.leap[1], k); D.y = lerp(0, DOCK.y2, k) + 1.2 * k * (1 - k); D.vy = (0.5 - k) * 4; D.mode = 'leap'; D.facing = 1;
      if (k >= 1) { D.st = 'dockrun'; D.y = DOCK.y2; }
    } else if (D.st === 'dockrun') {                     // 在台子上追：站到箱子上、墙头上它就够不着
      run(clamp(P.x, DOCK.x1 + 0.5, Math.min(WALL.x1 - 0.6, crate.x1 - 0.5)), 4.6); D.y = DOCK.y2;
      if (low(DOCK.y2) && Math.abs(P.x - D.x) < 0.65 && P.x < WALL.x1) bite();
      if (P.x > WALL.x2) { D.st = 'around'; D.t = 0; }
    } else if (D.st === 'around') {                      // 主角翻过了墙：它从侧门绕过来
      D.mode = 'run'; if (D.t > 5.2) { D.st = 'run2'; D.x = WALL.x2 + 1.2; D.y = 0; D.z = -2.6; fx('bark', 0.8); }
    } else if (D.st === 'run2') {
      D.z = damp(D.z, -0.45, 3, dt); D.y = 0;
      const shut = GATE.open < 0.45, lim = shut ? GATE.x - 0.95 : X + 108;
      run(clamp(P.x, WALL.x2 + 0.8, lim), 4.3);
      if (low(0) && Math.abs(P.x - D.x) < 0.65 && !(shut && P.x > GATE.x)) bite();
      if (shut && P.x > GATE.x) { D.st = 'gate'; S.ev = 7; fx('doorStop'); }
    } else if (D.st === 'gate') { run(GATE.x - 0.95, 4.3); if (D.mode !== 'run') D.mode = 'bark'; }
    if ((D.mode === 'bark') && D.st !== 'sleep' && Math.floor(T / 1.5) !== Math.floor((T - dt) / 1.5)) fx('bark', sstep(26, 5, Math.abs(P.x - D.x)));
  }
  function update(dt) {
    const play = state === 'play';
    // 笼顶上的看守：来回走，手电照着下面的路
    if (WAT.wait > 0) { WG.vx = 0; figAct(WG, 'stand'); if ((WAT.wait -= dt) <= 0) WAT.dir = -WAT.dir; }
    else { figAct(WG, 'walk'); if (figGo(WG, WAT.dir > 0 ? WAT.b : WAT.a, 1.1 * (1 - 0.8 * W.ex), dt)) WAT.wait = 1.4; }
    WAT.ax = damp(WAT.ax, WG.x + WG.face * 1.2, 3, dt);
    const kx = sstep(0.15, 1, W.ex), a = inA() && S.ev === 0, ax = a ? lerp(WAT.ax, P.x, kx) : WAT.ax;
    let seen = a && P.y < 1.7 && Math.abs(P.x - WAT.ax) < 1.35 && !hidA();
    // 拖人的那一场：主角一走近就开始；这时候离开铁箱后面就会被看见
    if (S.ev === 0 && play && P.x > X + 34.6 && W.caught === 0) startEvent();
    if (S.ev >= 1 && S.ev <= 4) {
      stepEvent(dt);
      if (S.ev < 4 || S.step === 0) seen = seen || (P.x > X + 26 && !inHide() && (S.ev > 1 || S.et > 1.5));
      if (play && inHide() && Math.abs(P.vx) < 1.6) HX.pose = crouchPose(sstep(1.6, 0.6, Math.abs(P.vx)));
      if (play && P.x > X + 30) camOvr = { d: 24, yo: 2.3, xo: S.ev === 4 ? lerp(5.5, -2.5, sstep(0, 3.5, S.et + (S.step ? 9 : 0))) : lerp(1.5, 5.5, sstep(X + 33, X + 37, P.x)) };   // 先往右看那只笼子；推车往左走的时候，镜头跟着移回来，把车和主角都框进去
    }
    if (S.ev === 5 && DG.act === 'point') { DG.tx = P.x; DG.ty = P.y + 1.0; DG.face = P.x > DG.x ? 1 : -1; }
    if (S.ev >= 5) TIRED.rushT = 0.5;
    watchStep(W, seen, dt, S.ev ? 0.5 : 0.55, 0.9); HX.alert = W.ex;
    if (play && a && hidA() && Math.abs(P.x - WAT.ax) < 5 && Math.abs(P.vx) < 1.6) HX.pose = crouchPose(sstep(1.6, 0.6, Math.abs(P.vx)));
    stepInmates(dt); stepDog(dt);
    if (Math.abs(P.x - (X + 20)) < 50 && S.ev === 0) { useBeam(WG.x + WG.face * 0.3, CAGE_H + 1.4, WZ + 0.25, ax, 0.25, 0, { ang: 0.27, i: 26, c: C_WARM, alert: kx }); bounce.on = 1; bounce.p[0] = ax; bounce.c.copy(beam.color); } else bounce.on = 0;
    if (GATE.want === 0) LEVER.t = Math.min(1, LEVER.t + dt * 4); else LEVER.t = 0;
    gateL.c.set(LEVER.t > 0.5 ? 0x6dff9a : 0xff4a2a);
    for (const f of FIGS) figStep(f, dt);
    const v = V; if (!v) return;
    v.cart.position.x = S.cart; v.cart.visible = S.ev >= 1;
    v.cdoor.position.x = DOORX[0] + 1.25 * S.door;
    v.crateG.position.x = crate.x; v.gate.sync(GATE); v.lever.set(LEVER.t);
    v.dog.root.visible = !(DOG.st === 'around');
    v.dog.update(dt, { x: DOG.x, y: DOG.y, z: DOG.z, vx: DOG.vx, vy: DOG.vy, facing: DOG.facing, mode: DOG.mode, t: T });
    v.cone.m.visible = S.ev === 0; v.cone.aim(WG.x + WG.face * 0.3, CAGE_H + 1.4, WZ + 0.25, ax, 0.2, 0); v.cone.m.material.color.copy(beam.color);
    v.crowd.draw();
  }
  function reset() {
    resetEvent(); placeBox(crate, X + 57.6); setGate(GATE, 1); LEVER.t = 0;
    Object.assign(WG, { x: X + 12, face: 1, vx: 0 }); Object.assign(WAT, { wait: 0, dir: 1, ax: X + 12 }); Object.assign(W, { ex: 0, caught: 0 });
  }
  function solve() { reset(); S.ev = 7; DOG.st = 'gate'; DOG.x = GATE.x - 0.95; DOG.z = -0.45; DOG.mode = 'bark'; setGate(GATE, 0); placeBox(crate, X + 67.4); }
  return defZone({ n: 3, vis: [X - 2, END + 1], build, update, reset, solve, unbuild() { V = null; },
    respawn(c) {
      if (c.x < X || c.x > END) return;
      Object.assign(W, { ex: 0, caught: 0 });
      if (S.ev >= 1 && S.ev <= 4) resetEvent();                                             // 那一场还没演完就被看见了：从头再来
      else if (S.ev >= 5 && S.ev < 7) {                                                     // 追的时候被咬住：从这一个存档点接着追
        S.ev = 5; setGate(GATE, 1); S.dockT = 0;
        if (c.x < X + 50) Object.assign(DOG, { x: DOG0[0], y: 0, z: DOG0[1], st: 'wake', t: 0, mode: 'bark' });
        else if (c.x < WALL.x1) Object.assign(DOG, { x: DOCK.x1 - 0.9, y: 0, z: -0.45, st: 'dock', t: 0 });
        else Object.assign(DOG, { st: 'around', t: 0 });
      }
    }, S, W, WAT, WG, DG, DOG, M, crate, GATE, LEVER, COVA, hidA, inHide });
})();
