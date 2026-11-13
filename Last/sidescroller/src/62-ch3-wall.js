
// ============================================================
//  第三章 · 围墙与废料场：越过围墙
//  围墙里侧，另一条回收线还在运转：同样的三次灯号，同样带着“07”批次标记的外壳一只只进了压机。
//  把旧箱子沿着拖痕推到墙脚 → 跳上箱子、翻上墙头 → 墙外的残墙上，一只小猫被追犬逼在高处：
//  跳到它身边就救下了它；之后踩着残墙和卡在断桥边的货箱走，别落到地上 —— 追犬过不了断桥
// ============================================================
const CH3 = (() => {
  const X = X3, WALL = X + 44, PIT0 = X + 56.5, PIT1 = X + 58.7;
  const C = chapter({ n: 3, x0: X + 0.5, start: X + 3, name: '围墙与废料场', sub: '越过围墙' });
  C.ground = 'sand';                                                               // 脚步声：墙外的废料场是沙土；林子边是落叶，围墙里的场子是碎石；墙、残墙是水泥，货箱是铁的，旧箱子是木头的
  terrain([PIT0, 0], [PIT0 + 0.01, -3.6], [PIT1 - 0.01, -3.6], [PIT1, 0], [X4, 0]);
  ground(X + 10, 0x3c381d); ground(X + 30, 0x675d4b); ground(X + 70, 0x6a604e); ground(X4 - 6, 0x5a5750);      // 头一个：林子的地一直铺到这里，和第二章末尾是同一个颜色
  solid({ id: 'pwall', x1: WALL, x2: WALL + 1.3, y1: 0, y2: 3.3, snd: 'concrete' });
  const A = solid({ id: 'ruinA', x1: WALL + 1.3, x2: WALL + 4.6, y1: 0, y2: 2.3, snd: 'concrete' });
  const B = solid({ id: 'ruinB', x1: WALL + 6.2, x2: WALL + 8.9, y1: 0, y2: 1.9, snd: 'concrete' });
  const Cb = solid({ id: 'cargo', x1: X + 54.7, x2: PIT0, y1: 0, y2: 1.2, snd: 'metal' });
  solid({ id: 'pitL', x1: PIT0 - 0.6, x2: PIT0, y1: -3.6, y2: 0 }); solid({ id: 'pitR', x1: PIT1, x2: PIT1 + 0.6, y1: -3.6, y2: 0 });
  const crate = pushable({ id: 'crate3', x: X + 31, w: 1.2, h: 1.0, min: X + 27.5, max: WALL - 0.6, snd: 'wood' });
  surface(X - 1, X + 16, 'forest'); surface(X + 16, WALL, 'gravel');
  const CATX = B.x2 - 0.75, DOG0 = B.x1 - 0.75, DMIN = A.x2 + 0.35, DMAX = Cb.x1 - 0.4;
  const DOG = { x: DOG0, vx: 0, facing: 1, mode: 'bark', bite: 0, z: 0 };
  const S = { safe: false };                             // safe：已经带着小猫过了断桥
  // 围墙里侧的回收线（在背景里，停不下来）
  const BY = 2.5, BZ = -7, BAY = X + 30.6, GAP = 4.2;
  const LINE = { phase: 'move', t: 0, ram: 0, lamp: 0, hit: false, shells: [0, 1, 2, 3, 4, 5].map(i => ({ x: BAY - 1.5 - i * GAP })) };

  pit({ x1: PIT0 + 0.05, x2: PIT1 - 0.05, y: -1.2 });
  checkpoint(X + 3); checkpoint(X + 26); checkpoint(WALL + 2.4); checkpoint(PIT1 + 2);
  camKeys([X + 2, 19, 1.8, 0], [X + 14, 21, 2.4, 2], [X + 30, 21.5, 2.7, 2], [X + 41, 22, 2.7, 2.5], [X + 46, 22, 1.7, 3.5], [X + 56, 21, 1.9, 2], [X + 63, 20, 2.0, 0.5], [X + 80, 19, 1.8, 0], [X4 - 2, 19, 1.8, 0]);
  // 出了林子是工业荒漠的边缘：上午的薄霾，光更亮更白
  env(X + 6, {});
  env(X + 30, { fog: 0xbcae97, fogD: 0.0075, hemiS: 0xf3ebd9, hemiG: 0x4f483c, hemiI: 1.0, keyC: 0xfff0d8, keyI: 1.9, keyDir: [0.55, 0.62, -0.3], rimI: 0.25, dustC: 0xf2e4c8, dustO: 0.4, wind: -0.7,
    sky: [0x6f8791, 0x9aa9a6, 0xc4c2ae, 0xddd3b6, 0xe8dcbc, 0xb5a88c], sunX: 0.12, sunY: 0.3, sunP: 0.45, cloud: 0.7, cloudC: 0xf6f0e0, birds: 0,
    aWind: 1, aWhis: 1, aLeaf: 0.12, leafDry: 1, aBug: 0, aFar: 0.9 });                 // 声音：一阵阵的大风，风从铁皮缝里钻过去的哨声，远处乌鸦、铁皮哐哐响
  env(X4 - 20, {});

  hint(() => !STORY.cat && crate.x < WALL - 1 && P.x > WALL - 2.6 && P.x < WALL && P.y < 0.5, '墙太高了 —— 墙脚的拖痕通向一只旧箱子');
  hint(() => crate.x < WALL - 1 && P.x > X + 27 && P.x < WALL && Math.abs(P.x - crate.x) < 2.4 && P.y < 0.5 && P.mode !== 'push', '按住 <b>E</b> 把箱子推到墙脚');
  hint(() => crate.x >= WALL - 1 && P.x > WALL - 4 && P.x < WALL && P.y < 1.2 && P.mode !== 'push', '跳上箱子，再跳向墙头');
  hint(() => !STORY.cat && P.x > WALL && P.x < A.x2 + 0.2 && P.y > 2, '别落到地上 —— 跳到小猫身边去');
  hint(() => STORY.cat && !S.safe && P.x > B.x1 - 0.3 && P.x < PIT0 + 0.2 && P.y > 0.9, '踩着货箱跳过断桥。追犬过不来');

  let V = null;
  function mkShell(parent) {                             // 一只拆下来的外壳：头盔 + 躯干，侧面喷着同样的“07”
    const g = grp(parent), m = lam(0x7c8c82, { emissive: 0x7c8c82, emissiveIntensity: 0.1 });
    add(g, bx(0.26, 0.4, 0.24), m, 0, 0.2, 0); add(g, cy(0.14, 0.13, 0.13, 14), m, 0.02, 0.5, 0);
    add(g, new THREE.SphereGeometry(0.14, 14, 8, 0, 6.2832, 0, Math.PI / 2), m, 0.02, 0.565, 0).scale.y = 0.86;
    plate(g, stencil07(), 0.17, 0.11, 0.02, 0.5, 0.145, 0x1c2022, { fog: true, order: 1 });
    return g;
  }
  function* build(R) {
    const gy = groundY, v = {};
    // 远景：左边还是林子的山脊，往右渐渐露出旧城的天际线
    backdrop(X - 40, X4 + 60, -6, 74, -150, 6, g => {
      setInk(g, vgrad(g, 30, 0, '#a9a898', '#8d8c7d')); ridge(g, X - 40, X + 70, -6, x => 13 + 6 * Math.sin(x / 21) + 3 * Math.sin(x / 7.7 + 1) + rr(-0.5, 0.5) - Math.max(0, x - X - 20) * 0.22, 1.5);
      setInk(g, vgrad(g, 60, 0, '#b9b6a8', '#8f8f86'));
      for (let x = X + 46; x < X4 + 58; x += rr(5, 11)) { const k = sstep(X + 40, X + 120, x), w = rr(5, 11); building(g, x, -6, w, 6 + rr(8, 52) * k, { holes: 0.35, gx: 2.6, gy: 3.6, win: 1.1, winH: 1.5, base: 8 }); }
      line(g, [[X + 90, 30], [X4 + 58, 34]], 0.7); for (let x = X + 96; x < X4 + 58; x += 13) box(g, x, -6, 1.2, 38);          // 架在空中的旧轨道
    }, { fog: false, order: -2000, fadeL: 44, fadeR: 44 });
    yield;
    // 中景：围墙里的岗楼、围网、探照灯杆；墙外的荒地和电线杆
    backdrop(X - 6, X4 + 20, -4, 34, -48, 14, g => {
      setInk(g, '#5b564d'); ridge(g, X - 6, X4 + 20, -4, x => 0.5 + rr(0, 1.1), 3);
      for (const x of [X + 9, X + 36]) { box(g, x, 0, 0.7, 13); box(g, x + 4.3, 0, 0.7, 13); box(g, x - 1, 13, 7, 4.2); g.clearRect(x - 0.3, 14.6, 5.6, 1.5); poly(g, [[x - 1.6, 17.2], [x + 2.5, 19.4], [x + 6.6, 17.2]]); line(g, [[x + 2.5, 19.4], [x + 2.5, 24]], 0.2); }   // 岗楼
      box(g, X + 46.5, 0, 2.2, 16); for (let x = X + 49; x < X4 + 20; x += rr(14, 22)) { line(g, [[x, 0], [x + rr(-0.6, 0.6), 11]], 0.3); line(g, [[x - 2, 9.6], [x + 2, 9.9]], 0.2); }
      fence(g, X - 6, X + 46, () => 0.8, 4.2, 3.4, [0.3, 0.55, 0.8, 0.98]);
    }, { fadeL: 6, fadeR: 14 });
    yield;
    // 近一层：成堆的废料、分拣出来的零件箱
    backdrop(X - 2, X4 + 6, -3, 16, -13, 22, g => {
      setInk(g, '#39352f'); ridge(g, X - 2, X4 + 6, -3, x => gy(x) > -1 ? rr(0.1, 0.7) : -3, 1);
      heap(g, X + 2, X + 26, 0.3, 0.4, 2.6, 0.9); heap(g, X + 34, X + 43, 0.3, 0.3, 1.8, 0.8);
      for (let x = X + 60; x < X4; x += rr(6, 13)) { const t = rnd(); if (t < 0.4) heap(g, x, x + rr(2, 5), 0.2, 0.2, 1.3, 0.6); else if (t < 0.7) { line(g, [[x, 0], [x + rr(-0.5, 0.5), rr(3, 6)]], 0.16); } else box(g, x, 0, rr(1, 2.4), rr(0.6, 1.6)); }
      for (const [x, h] of [[X + 64, 6], [X + 71, 4.5]]) tree(g, x, 0.2, h, 'dead');
    }, { fadeL: 4, fadeR: 6 });
    yield;
    backdrop(X - 2, X4 + 4, -3, 10, 6, 22, g => {         // 前景
      setInk(g, '#040607');
      const top = [[X - 2, -5]];
      for (let x = X - 2; x <= X4 + 4; x += rr(0.4, 1.3)) { const h = (gy(x) < -1 ? -0.6 : 0) + rr(0.2, 0.55); top.push([x, h]); if (rnd() < 0.3) top.push([x + 0.05, h + rr(0.2, 0.9)], [x + 0.12, h]); }
      top.push([X4 + 4, -5]); poly(g, top);
      for (const x of [X + 10.5, X + 73.5, X + 108]) { box(g, x, -3, 0.3, 13); line(g, [[x - 1.6, 8.6], [x + 1.9, 8.9]], 0.14); }      // 近处的杆子
    }, { fog: false, blur: 2.2, order: 4000, fadeL: 7 });      // 左头渐渐显出来：第二章已经没有这道前景了，不能在两章交界的地方齐齐地冒出一个头
    yield;

    // ---------------- 围墙里侧：废料场的回收线 ----------------
    add(R, bx(28, 0.3, 1.5), MAT.dark, X + 17.4, BY - 0.15, BZ); add(R, bx(28, 0.06, 1.3), MAT.steel, X + 17.4, BY + 0.02, BZ).receiveShadow = true;
    v.rollers = []; for (let x = X + 4; x <= X + 31; x += 1.5) { const r = add(R, cy(0.15, 0.15, 1.6, 10), MAT.steel, x, BY - 0.2, BZ, false); r.rotation.x = Math.PI / 2; v.rollers.push(r); }
    for (let x = X + 5; x < X + 29; x += 6) for (const z of [-0.8, 0.8]) add(R, bx(0.16, BY, 0.16), MAT.dark, x, BY / 2 - 0.15, BZ + z);
    add(R, bx(3, 3, 2.6), MAT.dark, X + 2.6, BY + 1.3, BZ);
    for (const x of [BAY - 1.5, BAY + 1.5]) add(R, bx(0.5, 8.4, 2.2), MAT.steel, x, 4.2, BZ);
    add(R, bx(3.6, 1.0, 2.4), MAT.steel, BAY, 7.5, BZ); add(R, bx(2.4, 0.5, 1.9), MAT.dark, BAY, BY - 0.25, BZ);
    v.ram = add(R, bx(2.3, 1.4, 1.8), MAT.rust2, BAY, 5.6, BZ); add(v.ram, cy(0.22, 0.22, 2.2, 10), MAT.steel, 0, 1.5, 0, false);
    add(R, bx(0.3, 0.42, 0.3), MAT.dark, BAY - 1.75, 4.6, BZ + 1.2, false);
    v.lamp = glow(R, 0xffa23a, 1.9, 0, BAY - 1.75, 4.6, BZ + 1.4); v.lens = add(R, new THREE.SphereGeometry(0.1, 10, 8), unlit(0x3a2410, { fog: false }), BAY - 1.75, 4.6, BZ + 1.38, false);
    for (let i = 0; i < 3; i++) { const x = BAY + 3.2 + i * 2.5; add(R, bx(2.1, 1.3, 1.8), MAT.sheet, x, 0.65, BZ); for (let k = 0; k < 5; k++) add(R, i === 0 ? cy(0.07, 0.08, 0.5, 6) : i === 1 ? bx(0.3, 0.24, 0.26) : new THREE.SphereGeometry(0.17, 8, 5, 0, 6.2832, 0, Math.PI / 2), lam(0x7c8c82), x + rr(-0.7, 0.7), 1.36 + rr(0, 0.2), BZ + rr(-0.6, 0.6)).rotation.set(rr(-1, 1), rr(0, 3), rr(-1.4, 1.4)); }   // 分好类的零件
    plate(R, textTex('记忆清除 · 回收线', { w: 512, h: 96, size: 54, color: '#c9cfc9', worn: 5 }), 5.2, 0.98, X + 17, 5.0, BZ + 0.8, 0x8f958f, { fog: true, order: 1 });
    add(R, bx(5.6, 1.3, 0.1), MAT.dark, X + 17, 5.0, BZ + 0.72); for (const x of [X + 14.6, X + 19.4]) add(R, cy(0.04, 0.04, 2.6, 5), MAT.dark, x, 3.75, BZ + 0.72, false);
    v.shells = LINE.shells.map(() => { const g = mkShell(R); g.scale.setScalar(1.7); return g; });
    yield;
    // 围墙：一道一直伸到远处的水泥墙，墙头拉着铁丝网
    const conc = lam(0x676a63), conc2 = lam(0x74725f);
    add(R, bx(1.3, 3.3, 34), conc, WALL + 0.65, 1.65, -15.8);
    add(R, bx(1.36, 0.1, 34.04), MAT.pale, WALL + 0.65, 3.3, -15.8, false);
    for (let z = -32; z < -1.6; z += 2.6) add(R, cy(0.025, 0.025, 0.8, 5), MAT.dark, WALL + 0.45, 3.68, z, false).rotation.z = 0.5;      // 墙头向里歪的铁丝网桩
    for (const [dx, dy] of [[-0.02, 0.28], [-0.2, 0.62]]) add(R, bx(0.02, 0.02, 30.4), MAT.dark, WALL + 0.45 + dx, 3.3 + dy, -16.8, false);
    for (let i = 0; i < 4; i++) add(R, bx(0.12, 0.34, 0.03), MAT.dark, WALL - 0.02, 1.0 + i * 0.5 + rr(-0.1, 0.1), rr(-0.5, 0.6), false).rotation.x = rr(-0.3, 0.3);   // 墙面上磨出来的鞋印
    v.crateG = mkCrate(R, crate, 'wood'); dragMarks(R, X + 30.6, WALL - 0.1);
    // 墙外：塌了一半的残墙（两段），小猫缩在第二段上
    add(R, bx(3.3, 2.3, 2.6), conc2, (A.x1 + A.x2) / 2, 1.15, -0.2); add(R, bx(1.2, 0.5, 2.0), conc2, A.x1 + 0.7, 2.55, -1.3).rotation.z = 0.2;
    add(R, bx(2.7, 1.9, 2.5), conc2, (B.x1 + B.x2) / 2, 0.95, -0.2); add(R, bx(0.9, 0.7, 1.3), conc2, B.x2 - 0.2, 0.35, 1.5).rotation.y = 0.5;
    for (const [x, y, h] of [[A.x2 - 0.2, 2.3, 0.8], [B.x1 + 0.3, 1.9, 0.6], [B.x2 - 0.5, 1.9, 0.9]]) add(R, cy(0.02, 0.02, h, 5), MAT.rust, x, y + h / 2, -1.2).rotation.z = rr(-0.4, 0.4);
    // 断桥：一条排水沟上塌掉的桥板；近端卡着一只货箱
    for (const [x, sx] of [[PIT0, -1], [PIT1, 1]]) add(R, bx(0.6, 3.66, 30), conc, x + sx * 0.3, -1.8, -9);
    add(R, bx(1.6, 0.22, 2.2), MAT.stone2, PIT0 + 0.5, -0.11, 0).rotation.z = -0.1; add(R, bx(1.3, 0.22, 2.2), MAT.stone2, PIT1 - 0.35, -0.15, 0).rotation.z = 0.16;
    add(R, bx(1.7, 0.22, 2.1), MAT.stone2, (PIT0 + PIT1) / 2 + 0.1, -3.2, 0.1).rotation.z = 0.5;
    v.cargo = mkCrate(R, { x: (Cb.x1 + Cb.x2) / 2, y1: 0, w: 1.8, h: 1.2 }, 'steel');
    // 沿路的维修标记：一块块指向旧城方向的小牌子
    for (const x of [X + 68, X + 96, X + 122]) { add(R, cy(0.04, 0.05, 2.2, 6), MAT.dark, x, 1.1, -1.6); plate(R, iconTex('bolt'), 0.4, 0.4, x - 0.25, 2.0, -1.55, 0xb9c4c0, { fog: true, order: 1 }); add(R, bx(1.1, 0.5, 0.05), MAT.steel, x, 2.0, -1.6); add(R, bx(0.3, 0.07, 0.06), MAT.pale, x + 0.25, 2.0, -1.56, false); }
    v.dog = makeCritter('dog', R);
    // 墙外荒地的路边：几丛干草、一棵蒙着灰的牛蒡、一棵孤零零的小树（48-brush.js）。颜色是荒地上的灰黄
    brushRow(R, [['grass', 334.5, 0.35, 1.05], ['leaf', 347.5, 0.42, 1.25], ['grass', 362.5, -0.35, 1.1], ['branch', 377.5, -0.75, 0.95]], {
      leaf: [0x5e6040, 0x6a6a46, 0x55583a, 0x76704a], grass: [0xa89a6c, 0x9a8c5e, 0xb8aa7c, 0x8e8058], plume: [0xd6caa4, 0xc8bb92],
      fern: [0x6e6040, 0x7a6c48], twig: [0x7a7a52, 0x6a6c48, 0x8a8458, 0x747048], bark: 0x4a4238 }, 3307);
    V = v;
  }

  function stepLine(dt) {
    const L = LINE; if (Math.abs(P.x - (X + 20)) > 46) return;
    const vol = sstep(34, 8, Math.abs(P.x - BAY)) * 0.8;
    let lead = L.shells[0]; for (const s of L.shells) if (s.x > lead.x) lead = s;
    if (L.phase === 'move') { const dx = Math.min(1.0 * dt, BAY - lead.x); for (const s of L.shells) s.x += dx; if (lead.x >= BAY - 1e-4) { L.phase = 'warn'; L.t = 0; fx('tick3', vol); } }
    else if (L.phase === 'warn') { L.t += dt; L.lamp = L.t < 1.5 && L.t % 0.5 < 0.26 ? 1 : 0; if (L.t >= 1.6) { L.phase = 'slam'; L.t = 0; L.hit = false; } }
    else if (L.phase === 'slam') { L.t += dt; L.ram = Math.min(1, L.t / 0.2); if (L.t >= 0.2 && !L.hit) { L.hit = true; fx('press', vol); lead.x -= GAP * L.shells.length; } if (L.t >= 0.8) { L.phase = 'rise'; L.t = 0; } }
    else { L.t += dt; L.ram = Math.max(0, 1 - L.t / 1.1); if (L.t >= 1.1) L.phase = 'move'; }
    AUD.belt = Math.max(AUD.belt, vol * (L.phase === 'move' ? 1 : 0.3));
  }
  function update(dt) {
    stepLine(dt);
    // 救猫：落到它身边就算救下，不需要按键
    if (!STORY.cat && state === 'play' && standingOn(B) && Math.abs(P.x - CATX) < 1.5) { STORY.cat = true; catFollow(); fx('meow'); saveGame(); }
    if (STORY.cat && !S.safe && P.grounded && P.x > PIT1 + 0.6) { S.safe = true; saveGame(); }
    // 追犬：平时只顾着朝小猫吠；有人落到地上，或者小猫被救走，就转过来追。它上不了残墙，也过不了断桥
    const D = DOG, inYard = P.x > A.x1 && P.x < PIT0 + 0.3, low = inYard && P.y < 0.75, near = Math.abs(P.x - D.x) < 30;
    if (near && state === 'play') {
      const chase = STORY.cat || low;
      if (chase) TIRED.rushT = 0.5;                                          // 被追着：顾不上累
      if (D.bite > 0) { D.bite += dt; D.mode = 'bark'; if (D.bite > 0.7 && state === 'play') respawn(); }
      else if (chase) {
        let tx = clamp(P.x > PIT0 ? DMAX : P.x, DMIN, DMAX);
        if (tx > B.x1 - 0.8 && tx < B.x2 + 0.8) tx = tx < (B.x1 + B.x2) / 2 ? B.x1 - 0.8 : B.x2 + 0.8;                       // 不停在残墙后面：站到看得见的空当里朝上吠
        const dx = tx - D.x;
        if (Math.abs(dx) > 0.12) { D.vx = Math.sign(dx) * 4.6; D.x += D.vx * dt; D.facing = Math.sign(dx); D.mode = 'run'; if (Math.abs(tx - D.x) < 0.1) D.x = tx; }
        else { D.vx = 0; D.mode = 'bark'; D.facing = P.x >= D.x ? 1 : -1; }
        if (low && P.grounded && Math.abs(P.x - D.x) < 0.7) { D.bite = 0.01; ctl = false; fx('bark', 1); fx('alarm'); }      // 被追上了
      } else { D.vx = 0; D.mode = 'bark'; D.facing = 1; D.x = damp(D.x, DOG0, 4, dt); }
      if (D.mode === 'bark' && Math.floor(T / 1.5) !== Math.floor((T - dt) / 1.5)) fx('bark', sstep(26, 5, Math.abs(P.x - D.x)));
      D.z = damp(D.z, (D.x > B.x1 - 0.5 && D.x < B.x2 + 0.5) || D.x < A.x2 + 0.2 ? -1.75 : -0.35, 8, dt);                    // 从残墙后面绕过去
    }
    const v = V; if (!v) return;
    v.crateG.position.x = crate.x;
    v.ram.position.y = lerp(5.6, BY + 0.95, LINE.ram);
    v.lamp.material.opacity = 0.95 * LINE.lamp; v.lens.material.color.setHex(LINE.lamp ? 0xffc070 : 0x3a2410);
    for (const r of v.rollers) r.rotation.y += dt / 0.15;
    LINE.shells.forEach((s, i) => { const g = v.shells[i]; g.visible = s.x > X + 4.2; g.position.set(s.x, BY + 0.05, BZ + (i % 2 ? 0.15 : -0.1)); g.rotation.y = (i % 3 - 1) * 0.5; });
    v.dog.root.visible = near;
    if (near) v.dog.update(dt, { x: D.x, y: 0, z: D.z, vx: D.vx, facing: D.facing, mode: D.mode, t: T });
  }
  function resetChase() {
    Object.assign(DOG, { x: DOG0, vx: 0, facing: 1, mode: 'bark', bite: 0, z: -0.35 }); S.safe = false;
    STORY.cat = false; catPlace(CATX, B.y2, 'hold'); CAT.hold = { x: CATX, y: B.y2, mode: 'cower', facing: -1 };
  }
  function reset() { placeBox(crate, X + 31); resetChase(); Object.assign(LINE, { phase: 'move', t: 0, ram: 0, lamp: 0 }); LINE.shells.forEach((s, i) => { s.x = BAY - 1.5 - i * GAP; }); }
  function solve() { placeBox(crate, WALL - 0.6); Object.assign(DOG, { x: DMAX, vx: 0, facing: 1, mode: 'bark', bite: 0, z: -0.35 }); S.safe = true; }
  return defZone({ n: 3, vis: [X - 6, X4 + 6], build, update, reset, solve, unbuild() { V = null; },
    respawn(c) { DOG.bite = 0; if (!S.safe && c.x >= X && c.x < X4 && STORY.ch === 3) resetChase(); }, crate, DOG, S, A, B, Cb });
})();
