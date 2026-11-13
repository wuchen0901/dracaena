
// ============================================================
//  第六章 · 供水街区：把水送到需要它的地方
//  这条街的电都给了监控，居民的水泵却断着电。把地上的导电线圈推到水泵那一路的触点上：
//  水泵转起来，监控熄灭，和监控连着的闸门也就开了；线圈随时可以推回去，没有惩罚。
//  闸门后面（可以不做）：一个幸存者守着一点食物，小猫一靠近他就挥手赶开。
//  把带轮子的铁盘推到漏水的管子下面接满水，再推到他和小猫之间，然后走开 —— 剩下的那一步由他自己来
// ============================================================
const CH6 = (() => {
  const X = X6, PAD_A = X + 9.0, PAD_B = X + 14.0, PUMP = X + 18.5, GATE = X + 41, LEAK = X + 50, PERCH = X + 55.4, MAN = X + 61.6, Z0 = X + 57.0, Z1 = X + 59.0;
  const C = chapter({ n: 6, x0: X + 0.5, start: X + 3, name: '供水街区', sub: '把水送到需要它的地方' });
  C.ground = 'concrete';
  terrain([X7, 0]);
  ground(X + 4, 0x4d5052); ground(X + 70, 0x4d5052); ground(X7 - 8, 0x4c5540);
  const coil = pushable({ id: 'coil', x: PAD_A, w: 1.0, h: 0.85, min: PAD_A, max: PAD_B, grip: 0.72, snd: 'metal' });
  const lid = pushable({ id: 'lid', x: X + 46.6, w: 0.95, h: 0.5, min: X + 45.6, max: Z1, grip: 0.74, snd: 'metal' });
  const door = gate({ id: 'door6', x: GATE, w: 0.8, h: 3.6, T: 1.6 });
  // ph：0 小猫还跟着 / 1 它闻着味跑向那个人 / 2 被赶到一边蹲着 / 3 那个人把食物推过来 / 4 小猫在喝水 / 5 结束 / 9 没管，走了
  const S = { pump: false, k: 0, fill: 0, ph: 0, t: 0, shoo: 0, morsel: 0, grow: 0 };
  checkpoint(X + 3); checkpoint(X + 22); checkpoint(GATE + 2.5); checkpoint(X + 72);
  camKeys([X + 2, 19, 1.8, 0], [X + 9, 20, 2.3, 2], [X + 20, 20.5, 2.5, 1.5], [X + 33, 21, 2.7, 1], [GATE + 1, 19.5, 2.0, 0.5], [X + 50, 20, 2.2, 1.5], [X + 60, 19.5, 1.9, 0.5], [X + 72, 19, 1.8, 0], [X7 - 2, 19, 1.8, 0]);
  env(X + 60, { aDrip: 0.3 });                                                     // 声音：漏水的管子一路滴着
  // 往城外走，路面的裂缝里开始长草；午后的光偏暖
  env(X7 - 10, { fog: 0xb9bda6, hemiS: 0xf2f0dc, hemiG: 0x4b4f40, keyC: 0xfff3d6, keyI: 1.9, keyDir: [-0.35, 0.8, -0.2], sky: [0x7c96a0, 0xa6b6b4, 0xc9cdbc, 0xdcd8be, 0xe6dec2, 0xa8ad98], sunX: -0.25, sunY: 0.42, sunP: 0.35, cloudC: 0xf6f2e2, birds: 0.5,
    aCity: 0.3, aLeaf: 0.3, leafDry: 0.2, aDrip: 0 });                                 // 往城外走：城市的声音小下去，有了树叶声和鸟

  hint(() => !S.pump && Math.abs(P.x - coil.x) < 2.4 && P.y < 0.5 && P.mode !== 'push', '按住 <b>E</b> 把线圈推到通向水泵的触点上');
  hint(() => !S.pump && P.x > X + 21 && P.x < GATE && P.y < 1, '监控还亮着，闸门就不会开 —— 这条街的电都在它们身上');
  hint(() => S.ph < 3 && S.fill < 1 && Math.abs(lid.x - LEAK) < 0.45 && P.x > LEAK - 4 && P.x < LEAK + 4, '等水接满');
  hint(() => S.ph < 3 && S.fill >= 1 && lid.x < Z0 && Math.abs(P.x - lid.x) < 3 && P.mode !== 'push', '把水推到那个人和小猫之间');
  hint(() => S.ph === 2 && S.fill >= 1 && lid.x >= Z0 && Math.abs(P.x - lid.x) < 3.2, '走开一点。剩下的由他们自己来');
  hint(() => S.ph < 3 && S.fill < 1 && S.pump && Math.abs(P.x - lid.x) < 2.4 && P.y < 0.5 && P.mode !== 'push' && Math.abs(lid.x - LEAK) >= 0.45, '按住 <b>E</b> 把铁盘推到漏水的管子下面（可以不做）');

  const camLs = [X + 27, X + 35].map(x => spotLight({ p: [x - 0.85, 4.7, -1.6], t: [x - 3, 0.3, 0], c: 0xe2eef2, i: 5, d: 20, a: 0.15, pen: 0.5 }));
  const padL = pointLight({ p: [PAD_B, 0.5, 0.5], c: 0x7fd0ff, i: 3, d: 5, dec: 2, on: 0 });
  const pumpL = pointLight({ p: [PUMP + 0.6, 2.6, -0.8], c: 0xd8ecf2, i: 5, d: 9, on: 0 });

  let V = null;
  function* build(R) {
    const v = {};
    backdrop(X - 60, X7 - 6, -6, 80, -150, 6, g => {      // 远景：城市渐渐退到后面，右边开始是山（到花园之前淡出，接上第七章的远山）
      setInk(g, vgrad(g, 66, 0, '#b3b9b9', '#8e9496'));
      for (let x = X - 58; x < X + 96; x += rr(5, 10)) building(g, x, -6, rr(5, 12), rr(14, 60) * (1 - 0.7 * sstep(X + 50, X + 96, x)), { holes: 0.38, gx: 2.6, gy: 3.6, win: 1.1, winH: 1.5, base: 8 });
      setInk(g, vgrad(g, 40, 0, '#a9b3a2', '#8a9584')); ridge(g, X + 60, X7 + 60, -6, x => (10 + 9 * Math.sin(x / 31) + 4 * Math.sin(x / 11 + 2) + rr(-0.5, 0.5)) * sstep(X + 60, X + 100, x), 1.5);
    }, { fog: false, order: -2000, fadeL: 44, fadeR: 44 });
    yield;
    backdrop(X - 10, X7 + 1, -4, 44, -44, 13, g => {      // 中景：居民楼，越往右越矮、越破，楼顶长出了树（画到花园的墙为止）
      setInk(g, '#6f7678');
      for (let x = X - 8; x < X7 + 10; x += rr(9, 15)) { const w = rr(8, 13), h = rr(14, 36) * (1 - 0.6 * sstep(X + 60, X7, x)); building(g, x, -4, w, h, { holes: 0.5, gx: 2.4, gy: 3.3 }); if (x > X + 55 && rnd() < 0.7) { setInk(g, '#667066'); tree(g, x + w * rr(0.3, 0.7), h - 4.2, rr(4, 8), 'round'); setInk(g, '#6f7678'); } }
    }, { fadeL: 8, fadeR: 12 });
    yield;
    backdrop(X - 6, X7 + 1, -3, 30, -9, 20, g => {        // 近处的一排住宅：阳台、晾衣绳、水箱
      setInk(g, '#3d4244');
      let x = X - 5;
      while (x < X + 78) {
        const w = rr(8, 13), h = rr(10, 22); building(g, x, -3, w, h + 3, { holes: 0.5, gx: 2.3, gy: 3.0, base: 6.8 });
        for (let y = 6.4; y < h - 1; y += 3.0) box(g, x + 0.4, y, w - 0.8, 0.16);                             // 阳台
        box(g, x + rr(1, w - 3), h, 1.8, 1.4); line(g, [[x + w * 0.5, 9], [x + w + 3, 8.4]], 0.04);
        x += w + (rnd() < 0.4 ? rr(1.5, 3) : 0);
      }
      setInk(g, '#3a4238');                                // 城市边缘：矮墙、从裂缝里长出来的灌木和小树
      ridge(g, X + 76, X7 + 8, -3, x => 0.6 + rr(0, 1.2), 1);
      for (let x = X + 80; x < X7 + 6; x += rr(4, 9)) { if (rnd() < 0.5) tree(g, x, 0.3, rr(4, 9), 'round'); else for (let k = 0; k < 4; k++) disc(g, x + rr(-1, 1), 1.2 + rr(0, 0.8), rr(0.6, 1.2)); }
      for (let x = X + 78; x < X7; x += rr(9, 16)) { box(g, x, 0, rr(3, 6), rr(1.5, 4.5)); }
    }, { fadeL: 4, fadeR: 6 });
    yield;
    v.wins = backdrop(X + 8, X + 44, 5, 22, -8.9, 9, g => { // 水来了以后亮起来的窗
      for (let i = 0; i < 22; i++) { const x = rr(X + 9, X + 43), y = rr(7, 20); g.fillStyle = `rgba(215,232,240,${rr(0.4, 0.8)})`; box(g, x, y, 0.9, 1.2); }
    }, { additive: true, fog: false, blur: 2, order: -30, opacity: 0 });
    backdrop(X - 4, X7 + 1, -3, 10, 6, 22, g => {         // 前景：越往右草越多
      setInk(g, '#040607');
      const top = [[X - 4, -5]];
      for (let x = X - 4; x <= X7 + 6; x += rr(0.5, 1.5)) { const k = sstep(X + 60, X + 100, x), h = rr(0.15, 0.5) + 0.2 * k; top.push([x, h]); if (rnd() < 0.12 + 0.5 * k) top.push([x + 0.05, h + rr(0.3, 1.0)], [x + 0.14, h]); }
      top.push([X7 + 6, -5]); poly(g, top);
      for (const x of [X + 23.6, X + 66]) { box(g, x, -3, 0.34, 13); box(g, x - 1.4, 8.4, 3, 0.2); }
      for (let x = X; x < X + 76; x += rr(10, 18)) cable(g, x, 10, x + rr(7, 13), 10, rr(1.4, 2.4), 0.08);
    }, { fog: false, blur: 2.2, order: 4000 });
    yield;

    // 线路：墙上的配电箱引出两路 —— 一路直接上杆子接监控，一路埋在地槽里通向水泵，中间缺着一截（线圈就是补这一截的）
    add(R, bx(1.2, 1.5, 0.4), MAT.steel, X + 6.4, 1.6, -1.9); plate(R, iconTex('bolt'), 0.46, 0.46, X + 6.4, 1.7, -1.68, 0xe8c070, { fog: true, order: 1 });
    tube(R, [[X + 6.4, 2.3, -1.9], [X + 9, 5.4, -1.8], [X + 18, 5.0, -1.7], [X + 27, 5.2, -1.6], [X + 35, 5.2, -1.6]], 0.035, MAT.dark, 40);
    v.camLeds = [X + 12, X + 17, X + 22].map(x => add(R, new THREE.SphereGeometry(0.06, 8, 6), unlit(0xff3a2a, { fog: false }), x, 5.2 - 0.02 * Math.abs(x - X - 17), -1.66, false));
    plate(R, iconTex('eye'), 0.5, 0.5, X + 9.2, 4.4, -1.7, 0xd0d8d8, { fog: true, order: 1 });
    add(R, bx(PUMP - PAD_A + 1.6, 0.04, 0.5), MAT.dark, (PAD_A + PUMP) / 2 - 0.4, 0.02, 0, false);             // 地槽
    for (const z of [-0.2, 0.2]) add(R, bx(PAD_B - PAD_A + 1.6, 0.05, 0.05), MAT.steel, (PAD_A + PAD_B) / 2, 0.045, z, false);
    for (const x of [PAD_A, PAD_B]) add(R, bx(0.9, 0.03, 0.7), x === PAD_B ? MAT.copper : MAT.steel, x, 0.035, 0, false);
    v.padGlow = glow(R, 0x7fd0ff, 1.6, 0, PAD_B, 0.25, 0.35);
    v.pumpLeds = [PAD_B + 1.2, PAD_B + 2.4, PAD_B + 3.6].map(x => add(R, new THREE.SphereGeometry(0.05, 8, 6), unlit(0x1c2a30, { fog: false }), x, 0.06, 0.3, false));
    plate(R, iconTex('drop'), 0.34, 0.34, PAD_B + 0.75, 0.42, -0.5, 0xbfe0ee, { fog: true, order: 1 }); add(R, bx(0.5, 0.5, 0.05), MAT.dark, PAD_B + 0.75, 0.42, -0.54);
    // 线圈：一只架在小车上的大线盘
    v.coil = grp(R, coil.x, 0, 0);
    add(v.coil, bx(0.9, 0.08, 0.7), MAT.dark, 0, 0.14, 0);
    v.reel = grp(v.coil, 0, 0.5, 0); add(v.reel, cy(0.27, 0.27, 0.5, 18), MAT.copper).rotation.x = Math.PI / 2;
    for (const z of [-0.28, 0.28]) add(v.reel, cy(0.36, 0.36, 0.05, 18), MAT.steel, 0, 0, z).rotation.x = Math.PI / 2;
    for (let i = 0; i < 4; i++) add(v.reel, bx(0.66, 0.05, 0.02), MAT.dark, 0, 0, 0.31, false).rotation.z = i * 0.785;
    for (const sx of [-1, 1]) { add(v.coil, bx(0.05, 0.62, 0.05), MAT.steel, sx * 0.44, 0.45, 0.3); add(v.coil, bx(0.05, 0.62, 0.05), MAT.steel, sx * 0.44, 0.45, -0.3); add(v.coil, bx(0.05, 0.05, 0.66), MAT.steel, sx * 0.47, 0.76, 0, false); }
    // 水泵：一根立管、一只出水口、一只水槽；旁边等水的居民
    add(R, cy(0.14, 0.18, 1.5, 10), MAT.steel, PUMP, 0.75, -1.2); add(R, bx(0.7, 0.12, 0.12), MAT.steel, PUMP + 0.3, 1.38, -1.2); add(R, bx(0.1, 0.24, 0.1), MAT.steel, PUMP + 0.62, 1.28, -1.2);
    add(R, bx(1.2, 0.36, 0.8), MAT.stone, PUMP + 0.65, 0.18, -1.15); v.basin = add(R, bx(1.06, 0.03, 0.66), unlit(0x86a9b2), PUMP + 0.65, 0.2, -1.15, false);
    v.stream = add(R, bx(0.07, 0.95, 0.07), unlit(0xcfe6ee, { transparent: true, opacity: 0.8 }), PUMP + 0.62, 0.72, -1.2, false);
    add(R, bx(1.3, 0.3, 0.3), MAT.wood2, PUMP - 0.4, 3.3, -2.2); v.sprouts = [0, 1, 2, 3].map(i => add(R, bx(0.03, 0.3, 0.03), MAT.leaf2, PUMP - 0.85 + i * 0.3, 3.5, -2.2, false));   // 窗台上的菜苗
    yield;
    // 两只监控，和它们连着的闸门
    v.cams = [X + 27, X + 35].map(x => mkCamPole(R, x, 0, -1.6, 5.0, { dir: -1, len: 11, ang: 0.14 }));
    add(R, bx(0.5, 3.6, 34), lam(0x676a63), GATE, 1.8, -18.4); add(R, bx(0.5, 3.6, 4), lam(0x676a63), GATE, 1.8, 3.5);
    v.door = mkGateDoor(R, door, { mat: MAT.sheet, band: MAT.rust2 });
    v.dLamp = unlit(0xff3a2a, { fog: false }); add(R, new THREE.SphereGeometry(0.1, 10, 8), v.dLamp, GATE - 0.5, 3.95, 1.25, false); v.dGlow = glow(R, 0xff3a22, 1.6, 0.8, GATE - 0.55, 3.95, 1.3);
    tube(R, [[X + 35, 5.0, -1.6], [X + 38, 5.6, -1.6], [GATE, 4.1, -1.4]], 0.03, MAT.dark);
    // 漏水的管子、铁盘小车、水渍
    add(R, cy(0.09, 0.09, 26, 8), MAT.steel, X + 55, 3.1, -0.7).rotation.z = Math.PI / 2; for (const x of [LEAK, X + 58, X + 64]) add(R, cy(0.13, 0.13, 0.16, 10), MAT.rust, x, 3.1, -0.7).rotation.z = Math.PI / 2;
    for (const x of [X + 44, X + 54, X + 66]) add(R, cy(0.04, 0.04, 3.1, 6), MAT.dark, x, 1.55, -0.9);
    v.leak = add(R, bx(0.035, 2.8, 0.035), unlit(0xcfe6ee, { transparent: true, opacity: 0.7 }), LEAK, 1.7, -0.6, false);
    decal(R, LEAK - 1.2, LEAK + 1.2, -1.5, 0.7, 0, 30, g => { const gr = g.createRadialGradient(LEAK, -0.5, 0, LEAK, -0.5, 1.1); gr.addColorStop(0, 'rgba(20,28,30,.5)'); gr.addColorStop(1, 'rgba(20,28,30,0)'); g.fillStyle = gr; g.fillRect(LEAK - 1.2, -1.5, 2.4, 2.2); });
    v.lid = grp(R, lid.x, 0, 0);
    add(v.lid, bx(0.8, 0.06, 0.62), MAT.dark, 0, 0.16, 0); for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(v.lid, cy(0.08, 0.08, 0.05, 10), MAT.dark, sx * 0.3, 0.08, sz * 0.3).rotation.x = Math.PI / 2;
    add(v.lid, new THREE.CylinderGeometry(0.44, 0.38, 0.16, 20, 1, true), lam(0x39444a, { side: THREE.DoubleSide }), 0, 0.3, -0.05); add(v.lid, cy(0.38, 0.38, 0.02, 20), MAT.steel, 0, 0.23, -0.05);
    v.lidWater = add(v.lid, cy(0.4, 0.4, 0.015, 20), unlit(0x9cc2cc), 0, 0.25, -0.05, false);
    for (const sz of [-1, 1]) add(v.lid, bx(0.04, 0.6, 0.04), MAT.steel, -0.42, 0.48, sz * 0.26); add(v.lid, bx(0.04, 0.04, 0.56), MAT.steel, -0.42, 0.78, 0, false);
    // 小猫蹲的那摞箱子、幸存者、他守着的那点东西
    add(R, bx(0.9, 0.6, 0.8), MAT.wood, PERCH, 0.3, -0.95); add(R, bx(0.7, 0.45, 0.7), MAT.wood2, PERCH + 0.05, 0.825, -0.95);
    add(R, new THREE.SphereGeometry(0.42, 10, 8), lam(0x4a3f3a), MAN + 1.15, 0.2, -0.7).scale.set(1.5, 0.6, 0.9);                      // 一头死猪的残躯（围着它飞的苍蝇在 72-air-chapters.js 里）
    for (const dx of [-0.3, 0.4]) add(R, cy(0.05, 0.04, 0.3, 6), lam(0x4a3f3a), MAN + 1.15 + dx, 0.36, -0.55).rotation.z = dx;
    v.morsel = add(R, bx(0.12, 0.07, 0.09), lam(0x8a6a58), MAN, 0.3, -0.5);
    yield;
    v.res = makeNPC('N', R, { x: PUMP + 1.55, z: -1.1, facing: -1 }); yield;
    v.man = makeNPC('S', R, { x: MAN, z: -0.7, facing: 1 });
    V = v;
  }

  function update(dt) {
    const near = Math.abs(P.x - (X + 36)) < 62;
    S.pump = Math.abs(coil.x - PAD_B) < 0.3;
    const was = S.k; S.k = damp(S.k, S.pump ? 1 : 0, 4, dt);
    if (near && state === 'play') { if (was < 0.5 && S.k >= 0.5) { fx('powerUp'); fx('dock'); } else if (was >= 0.5 && S.k < 0.5) fx('powerDown'); }
    door.want = S.pump ? 1 : 0;
    if (S.pump && P.x > GATE + 1 && !STORY.pump) { STORY.pump = true; saveGame(); }
    padL.on = S.k; pumpL.on = S.k * 0.7;
    const sw = T * 0.9; camLs[0].t[0] = X + 26 + 3.6 * Math.sin(sw); camLs[1].t[0] = X + 34 + 3.6 * Math.sin(sw + 2.2); for (const l of camLs) l.on = 1 - S.k;
    if (!S.pump && near && P.y < 2.4 && (Math.abs(P.x - camLs[0].t[0]) < 1.5 || Math.abs(P.x - camLs[1].t[0]) < 1.5)) HX.alert = Math.max(HX.alert, 0.5);
    if (near) { AUD.pump = S.k * sstep(30, 5, Math.abs(P.x - PUMP)); AUD.water = Math.max(AUD.water, S.k * 0.6 * sstep(22, 3, Math.min(Math.abs(P.x - PUMP), Math.abs(P.x - LEAK)))); AUD.buzz = sstep(12, 2, Math.abs(P.x - coil.x)); }
    S.grow = damp(S.grow, S.pump ? 1 : 0, 0.5, dt);
    // 接水：水泵转着，铁盘停在漏水处的正下方
    if (S.pump && Math.abs(lid.x - LEAK) < 0.45 && S.fill < 1) { S.fill = Math.min(1, S.fill + dt / 2.4); if (S.fill >= 1) fx('ok'); }
    // 小猫和幸存者
    S.shoo = Math.max(0, S.shoo - dt);
    if (STORY.cat && state === 'play') {
      if (S.ph === 0 && P.x > GATE + 3 && CAT.state === 'follow') { S.ph = 1; catHold(MAN - 1.3, 0, 'idle', 1); }
      else if (S.ph === 1 && CAT.x > MAN - 1.7) { S.ph = 2; S.shoo = 1.7; S.t = 0; fx('meow'); }
      else if (S.ph === 2) {
        S.t += dt; if (S.t > 0.45 && (!CAT.hold || CAT.hold.x !== PERCH)) { catHold(PERCH, 1.05, 'sit', 1); CAT.hold.z = -0.9; }
        if (CAT.x > MAN - 2.2 && S.shoo < 0.2) S.shoo = 0.6;
        if (S.fill >= 1 && lid.x >= Z0 && Math.abs(P.x - lid.x) > 3.2 && P.mode !== 'push') { S.ph = 3; S.t = 0; }
      } else if (S.ph === 3) { S.t += dt; S.morsel = sstep(0.8, 2.4, S.t); if (S.t > 2.6) { S.ph = 4; S.t = 0; catHold(lid.x - 0.62, 0, 'drink', 1); } }
      else if (S.ph === 4) { S.t += dt; if (S.t > 6.5) { S.ph = 5; STORY.water = true; saveGame(); catFollow(); fx('meow'); } }
      if (S.ph >= 1 && S.ph <= 2 && P.x > X + 70) { S.ph = 9; catFollow(); }                              // 没管这件事就走了：小猫还是跟上来
      if (S.ph >= 2 && S.ph <= 4 && S.fill >= 1 && lid.x >= Z0 && Math.abs(P.x - lid.x) < 11) camOvr = { d: 21, yo: 1.9, xo: clamp((lid.x + 1.2 - P.x) * 0.55, -5.5, 5.5) };   // 镜头把 07 和那两位都留在画面里
    }

    const v = V; if (!v) return;
    v.coil.position.x = coil.x; v.reel.rotation.z = -coil.x / 0.36;
    v.padGlow.material.opacity = 0.8 * S.k * (0.8 + 0.2 * Math.sin(T * 30));
    v.pumpLeds.forEach((m, i) => m.material.color.setHex(S.k > 0.5 && (T * 3 + i) % 3 < 2 ? 0x8fe6ff : 0x1c2a30));
    v.camLeds.forEach(m => m.material.color.setHex(S.k < 0.5 ? 0xff3a2a : 0x2a1210));
    v.cams.forEach((c, i) => { c.power(1 - S.k); if (S.k < 0.5) c.aim(camLs[i].t[0], 0.3, 0); else c.aim(c.g.position.x - 1.4, 1.2, 0); c.alert(0); });   // 没电了：镜头垂下去
    v.door.sync(door); v.dLamp.color.setHex(S.k < 0.5 ? 0xff3a2a : 0x2a1210); v.dGlow.material.opacity = 0.8 * (1 - S.k);
    v.stream.visible = S.k > 0.3; v.stream.scale.x = v.stream.scale.z = 0.7 + 0.3 * Math.sin(T * 23); v.basin.position.y = lerp(0.08, 0.3, S.grow);
    v.wins.material.opacity = S.grow; v.sprouts.forEach((m, i) => { m.scale.y = 0.5 + 1.1 * S.grow; m.rotation.z = 0.25 * Math.sin(T * 1.5 + i) * S.grow; });
    v.leak.visible = S.k > 0.3 || (T % 1.3) < 0.12; v.leak.scale.x = v.leak.scale.z = S.k > 0.3 ? 1 : 0.6;
    v.lid.position.x = lid.x; v.lidWater.visible = S.fill > 0.02; v.lidWater.position.y = lerp(0.24, 0.345, S.fill); v.lidWater.scale.setScalar(lerp(0.9, 1.07, S.fill));
    if (!near) return;
    // 居民：水来了就弯腰接水
    const Rs = v.res; Rs.pose = S.k > 0.5 ? { bow: 0.5, reach: { x: PUMP + 0.75, y: 0.6, k: 0.9 } } : { look: clamp((P.x - Rs.x) / 6, -0.8, 0.8) }; Rs.step(dt);
    // 幸存者：坐在地上守着那点东西。猫靠近就回头挥手；水放好、07 走开以后，他把一小块食物推到盘子边上
    const Mn = v.man, turn = S.ph >= 3 || S.shoo > 0;
    Mn.facing = S.ph >= 3 ? -1 : 1;
    Mn.pose = { sit: 1, sitH: 0.16, sitLeg: 1.5, bow: S.ph >= 3 ? 0.3 + 0.35 * Math.sin(Math.PI * clamp(S.t / 2.6, 0, 1)) * (S.ph === 3 ? 1 : 0) : 0.38, look: S.shoo > 0 ? -2.2 : undefined,
      arms: S.shoo > 0 ? [undefined, { a: -1.5 + 0.5 * Math.sin(T * 13), b: 0.5 }] : undefined,
      reach: S.ph === 3 ? { x: lerp(MAN - 0.3, lid.x + 0.7, S.morsel), y: 0.2, i: 0, k: sstep(0, 0.8, S.t) * (1 - sstep(2.3, 2.6, S.t)) } : undefined };
    Mn.step(dt);
    const mx = S.ph >= 3 ? lerp(MAN - 0.3, lid.x + 0.62, S.morsel) : MAN + 0.35;
    v.morsel.position.set(mx, S.ph >= 3 ? 0.04 : 0.34, -0.45); v.morsel.visible = !(S.ph >= 4 && S.t > 4) && S.ph !== 5;
  }
  function reset() { placeBox(coil, PAD_A); placeBox(lid, X + 46.6); setGate(door, 0); Object.assign(S, { pump: false, k: 0, fill: 0, ph: 0, t: 0, shoo: 0, morsel: 0, grow: 0 }); }
  function solve() { placeBox(coil, PAD_B); placeBox(lid, STORY.water ? Z1 - 0.4 : X + 46.6); setGate(door, 1); Object.assign(S, { pump: true, k: 1, fill: STORY.water ? 1 : 0, ph: STORY.water ? 5 : 9, t: 9, shoo: 0, morsel: 1, grow: 1 }); }
  return defZone({ n: 6, vis: [X - 6, X7 + 6], build, update, reset, solve, unbuild() { V = null; }, coil, lid, door, S });
})();
