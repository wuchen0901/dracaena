
// ============================================================
//  第五章 · 改造室
//  检修道经过一间屋子的上方，从格栅往下看。屋子两头各有一扇门：右边的门进来的人穿着各色衣服，挣扎着被押进来；
//  左边的门出去的人穿着灰色工服，一个接一个，排着队，步子一样。屋子中间一座封死的机器，里面做了什么看不清，只听见它响。
//  右门边堆着一大堆各色的衣服，左门边停着一车叠好的灰色工服 —— 就是第二章往右运走的那种车。
//  怎么通过：在检修道上往右走，不能惊动下面：按住 Shift 轻轻走，跑起来、跳起来铁板会响，下面的看守就抬头。
//  这一章短，是停下来看的地方。检修道尽头，主角把灰色工服脱下来，扔在那里，露出自己的衣服。
//  看到的：灰衣服的人原来也是穿着自己衣服的普通人。留下的问题：这些人是从哪里来的？
// ============================================================
const E5 = (() => {
  const X = E4_END, END = X + 58, LZ = -4.6, DL = X + 8, DR = X + 44, BOOTH = [X + 19, X + 31], ROOM = [X + 7, X + 45];     // 屋里的人走的那条线；左门、右门；中间那座机器
  const C = chapter({ n: 5, x0: X + 0.5, start: X + 2, name: '改造室', sub: '从上面往下看', ground: 'metal' });
  terrain([END, 0]); ground(X + 1, 0x20262a); ground(END, 0x20262a);
  solid({ id: 'e5step1', x1: E4X + 127, x2: E4X + 129, y1: 0, y2: 3.5, snd: 'wood' });     // 检修道尽头：两摞货箱当台阶下去
  solid({ id: 'e5step2', x1: E4X + 129, x2: E4X + 131, y1: 0, y2: 1.75, snd: 'wood' });
  const S = { t: 0, undress: 0, dropX: 0, done: false }, W = { ex: 0, caught: 0 };
  // 进来的人（各色衣服）和出去的人（灰色工服）：各四个，循环着用。每 5.6 秒进去一个、出来一个
  const PERIOD = 5.6, V_IN = 0.75, V_OUT = 1.0, N = 4;
  const INS = [0, 1, 2, 3].map(i => fig('civ', 0, { z: LZ, face: -1, c: (i * 3 + 1) % 10, old: i === 2, H: i === 1 ? 1.32 : undefined })), OUTS = [0, 1, 2, 3].map(() => fig('gray', 0, { z: LZ, face: -1, act: 'march' }));
  const GD = [fig('guard', DR - 1.6, { z: LZ - 1.5, face: -1, turn: 0.5 }), fig('guard', BOOTH[1] + 1.4, { z: LZ + 1.4, face: 1, turn: 0.4 }), fig('guard', DL + 1.8, { z: LZ - 1.5, face: 1, turn: 0.5 }), fig('guard', 0, { z: LZ + 0.5, face: -1 })];
  const FIGS = [...INS, ...OUTS, ...GD];

  for (const x of [2, 24, 46]) checkpoint(X + x, { y: CAT_Y }); checkpoint(X + 56.5);
  camKeys([X + 4, 25, -2.2, 0.5, 3.2], [X + 44, 25, -2.2, 0, 3.2], [X + 50, 23, -1.2, 1, 2], [X + 54, 21, 1.6, 1.5, 0.6], [END, 19.5, 1.9, 0.5]);
  // 光：屋里是冷的，走廊的灯从两头的门里切进来；机器的缝里一闪一闪
  env(X + 0.7, { fog: 0x1d2327, fogD: 0.02, hemiS: 0xa8b8c0, hemiG: 0x161b1e, hemiI: 0.72, keyC: 0xdfeaf2, keyI: 0.45, keyDir: [0.1, 1, 0.3], rimC: 0xb0c8d6, rimI: 0.5,
    dustC: 0xd8e6ee, dustO: 0.32, wind: 0.01, ext: 0, vig: 1.08, aRoom: 1, roomF: 120, aHum: 1, aDrip: 0, aFar: 0.8, rvHall: 1 });
  env(END - 0.7, {});

  const over = () => P.x > ROOM[0] && P.x < ROOM[1] + 1 && P.y > CAT_Y - 0.1;
  hint(() => over() && W.ex < 0.25 && P.x < X + 14, '下面有人 —— 按住 <b>Shift</b> 轻轻走，别让铁板响');
  hint(() => over() && W.ex >= 0.25, '太响了 —— 站住');

  const boothL = pointLight({ p: [(BOOTH[0] + BOOTH[1]) / 2, 2.4, LZ + 2.6], c: 0xbfe6ff, i: 10, d: 10, dec: 1.4 });
  for (const x of [DL + 0.6, DR - 0.6]) pointLight({ p: [x, 2.2, LZ], c: 0xdfeaf2, i: 12, d: 11, dec: 1.4 });      // 两扇门里切进来的走廊的光

  let V = null;
  function* build(R) {
    const v = {}, B = baker(); B.vary = 0.07;
    hallLayers(X - 2, END + 1.5, { far: '#161c20', win: '#4a5b66', mid: '#0f1418', near: '#0a0e11', near2: '#182026' }, { cols: [], fore: [X + 15.5, X + 37.4], zMid: -16, zFar: -28, beam: false, farK: 1.4 });
    yield;
    // 屋子：后墙、左右两堵带门的墙；地上一条磨出来的路，从右门到机器、从机器到左门
    add(R, bx(40, 9, 0.5), lam(0x283036), X + 26, 4.5, -9.4);
    for (const x of [DL - 0.5, DR + 0.5]) { add(R, bx(0.6, 9, 3.6), lam(0x242b30), x, 4.5, -7.4); add(R, bx(0.6, 9, 2.6), lam(0x242b30), x, 4.5, -1.9); add(R, bx(0.6, 6.2, 2.4), lam(0x242b30), x, 2.8 + 3.1, LZ);
      const gl = add(R, new THREE.PlaneGeometry(2.3, 2.8), unlit(0xbfd4de, { fog: false, transparent: true, opacity: 0.5 }), x + (x < X + 20 ? -0.2 : 0.2), 1.4, LZ, false); gl.rotation.y = x < X + 20 ? Math.PI / 2 : -Math.PI / 2; }
    decal(R, DL, DR, LZ - 0.7, LZ + 0.7, 0, 30, g => { g.fillStyle = 'rgba(190,205,212,.1)'; g.fillRect(DL, LZ - 0.5, DR - DL, 1.0); });
    // 中间的机器：一座封死的铁屋子，两头各一个挂着帘子的口；缝里透出一闪一闪的光，顶上几根粗管子
    add(R, bx(BOOTH[1] - BOOTH[0], 4.2, 4.4), lam(0x1b2126), (BOOTH[0] + BOOTH[1]) / 2, 2.1, LZ - 0.4);
    for (const x of BOOTH) add(R, bx(0.12, 2.6, 1.7), lam(0x0c0f11), x + (x === BOOTH[0] ? -0.03 : 0.03), 1.3, LZ, false);
    v.slits = unlit(0x9fd8ff, { fog: false }); v.slits.userData.own = true;
    for (let x = BOOTH[0] + 1.2; x < BOOTH[1] - 0.6; x += 1.5) add(R, bx(0.5, 0.12, 0.05), v.slits, x, 3.1, LZ + 1.83, false);
    for (const x of [BOOTH[0] + 2.5, BOOTH[1] - 2.5]) add(R, cy(0.45, 0.45, 6, 12), lam(0x232a30), x, 6.6, LZ - 1.2);
    v.boothGlow = glow(R, 0x9fd8ff, 7, 0.3, (BOOTH[0] + BOOTH[1]) / 2, 3.0, LZ + 2.0, GLOW_SOFT);
    yield;
    // 右门边：一大堆各色的衣服。左门边：一车叠好的灰色工服
    B.at(DR - 3.2, 0, LZ - 2.6);
    for (let i = 0; i < 90; i++) { const a = rr(0, 6.28), r = Math.sqrt(rnd()) * 1.9, h = (1 - r / 1.9) * 1.3; B.box(rr(0.3, 0.6), rr(0.06, 0.14), rr(0.25, 0.5), pick(CIV_TOP), Math.cos(a) * r, rr(0.03, h + 0.06), Math.sin(a) * r * 0.7, rr(-0.5, 0.5), rr(0, 3), rr(-0.5, 0.5)); }
    v.grayCart = mkCart(R, DL + 2.6, LZ - 2.4, 'clothes'); mkCart(R, DL + 4.5, LZ - 2.7, 'stack');
    // 检修道：一道铁格栅，两边栏杆，底下几根细柱子；尽头两摞货箱
    add(R, bx(58, 0.12, 1.5), MAT.steel, X + 23, CAT_Y - 0.06, 0);
    for (let x = X + 1; x < X + 52; x += 0.5) add(R, bx(0.05, 0.02, 1.5), MAT.dark, x, CAT_Y + 0.004, 0, false);
    for (let x = X + 0.8; x < X + 52; x += 1.6) for (const z of [-0.72, 0.72]) add(R, cy(0.025, 0.025, 1.0, 5), MAT.dark, x, CAT_Y + 0.5, z, false);
    for (const z of [-0.72, 0.72]) add(R, bx(52, 0.05, 0.05), MAT.dark, X + 26, CAT_Y + 1.0, z, false);
    for (let x = X + 4; x < X + 52; x += 8) for (const z of [-0.7, 0.7]) add(R, bx(0.12, CAT_Y - 0.1, 0.12), MAT.dark, x, (CAT_Y - 0.1) / 2, z);
    B.at(E4X + 128, 0, 0); for (let j = 0; j < 4; j++) B.box(1.96, 0.86, 1.3, j % 2 ? 0x4a4338 : 0x554b3c, rr(-0.02, 0.02), 0.44 + j * 0.875, rr(-0.04, 0.04));
    B.at(E4X + 130, 0, 0); for (let j = 0; j < 2; j++) B.box(1.96, 0.86, 1.3, j % 2 ? 0x554b3c : 0x4a4338, rr(-0.02, 0.02), 0.44 + j * 0.875, rr(-0.04, 0.04));
    B.mesh(R);
    v.cloth = add(R, bx(0.5, 0.08, 0.42), lam(0x767c7b), 0, -5, 0); v.cloth.rotation.y = 0.4;
    v.cones = [mkCone(R, 0.2, { c: 0xfff0d0, op: 0 }), mkCone(R, 0.2, { c: 0xfff0d0, op: 0 })];
    divider(R, END);
    v.crowd = mkCrowd(R, FIGS.length + 2); v.crowd.addAll(FIGS);
    V = v;
  }

  function update(dt) {
    const play = state === 'play'; S.t += dt;
    // 屋里：穿着各色衣服的人从右门被押进来，走到机器的口里不见了；灰衣服的人从机器另一头出来，排着队走出左门
    const span = DR - BOOTH[1], spanO = BOOTH[0] - DL, base = S.t / (N * PERIOD);
    INS.forEach((f, i) => {
      const u = (base + i / N) % 1, a = 0.3, b = 0.52, slow = i % 2 === 0;                                // u：从进门到走进机器，走了几成的时间
      const k = !slow ? u : u < a ? u * 1.25 : u < b ? a * 1.25 + (u - a) * 0.25 : a * 1.25 + (b - a) * 0.25 + (u - b) * (1 - a * 1.25 - (b - a) * 0.25) / (1 - b), balk = slow && u > a && u < b;   // 有的人走到半路不肯往前，被推着才接着走
      f.hide = u > 0.985; f.x = DR - (span + 0.4) * k; f.vx = balk ? -0.15 : -V_IN; f.face = -1;
      figAct(f, balk ? 'struggle' : i === 3 ? 'shuffle' : 'walk', { gait: 0.3 });
    });
    const push = INS[0], g3 = GD[3]; g3.hide = push.hide; g3.x = push.x + 0.75; g3.vx = push.act === 'struggle' ? -0.2 : -V_IN; figAct(g3, 'push');   // 押着最前面那个的看守
    OUTS.forEach((f, i) => { const d = ((base + i / N + 0.07) % 1) * N * PERIOD * V_OUT; f.hide = d > spanO + 0.5; f.x = BOOTH[0] - d; f.vx = -V_OUT; figAct(f, 'march'); });
    const fl = 0.55 + 0.45 * Math.sin(S.t * 31) * Math.sin(S.t * 7.3), pulse = sstep(0.75, 1, (base * N) % 1) + sstep(0.2, 0, (base * N) % 1);   // 每进去一个人，里面亮一下
    boothL.on = 0.25 + 0.75 * pulse * fl;
    if (play && Math.abs(P.x - (X + 25)) < 40) AUD.hum = Math.max(AUD.hum, 0.03 + 0.05 * pulse), AUD.humF = 70 + 50 * pulse;
    // 响动：在屋子上方跑、跳，铁板就响，下面的看守抬头打手电；响久了就被发现
    const loud = over() && play && (Math.abs(P.vx) > 1.9 || !P.grounded);
    if (loud && Math.floor(S.t * 5) !== Math.floor((S.t - dt) * 5)) fx('clang', 0.5);
    watchStep(W, loud, dt, 1.25, 1.6); HX.alert = sstep(0.4, 1, W.ex);
    const look = sstep(0.15, 0.6, W.ex);
    for (const g of [GD[0], GD[1]]) { g.p.head = damp(g.p.head, -0.5 * look, 6, dt); g.dirty = true; }
    // 检修道尽头：把灰色工服脱下来，扔在那里
    if (play && !S.done && P.x > X + 47.5 && P.grounded && P.y > CAT_Y - 0.1 && WEAR.want === 1) { S.done = true; S.undress = 1.5; S.dropX = P.x + 0.35; ctl = false; fx('cloth'); }
    if (S.undress > 0) {
      const t = 1.5 - (S.undress -= dt), k = sstep(0, 0.4, t) * (1 - sstep(0.75, 1.2, t)); P.vx = 0;
      HX.pose = { arms: [{ a: 2.6, b: 1.2, k }, { a: 2.4, b: 1.4, k }], bow: 0.2 * k, turn: 0 };
      if (t > 0.55) WEAR.want = 0;
      if (S.undress <= 0 && state === 'play') ctl = true;
    }
    for (const f of FIGS) figStep(f, dt);
    const v = V; if (!v) return;
    v.slits.color.setRGB(0.62 * (0.3 + 0.7 * pulse * fl), 0.85 * (0.3 + 0.7 * pulse * fl), 1.0 * (0.3 + 0.7 * pulse * fl)); v.boothGlow.material.opacity = 0.12 + 0.4 * pulse * fl;
    v.cones.forEach((c, i) => { const g = GD[i]; c.m.material.opacity = 0.11 * look; c.aim(g.x + g.face * 0.3, 1.35, g.z, P.x, P.y + 0.3, 0); });
    if (S.done) { const t = 1.5 - Math.max(0, S.undress), k = sstep(0.6, 1.1, t); v.cloth.visible = t > 0.6; v.cloth.position.set(S.dropX + 0.25 * k, CAT_Y + 0.05 + 1.0 * (1 - k) * (1 - k), 0.15); } else v.cloth.visible = false;
    v.crowd.draw();
  }
  function reset() { Object.assign(S, { t: 0, undress: 0, dropX: 0, done: false }); Object.assign(W, { ex: 0, caught: 0 }); }
  function solve() { reset(); S.done = true; S.dropX = X + 48; WEAR.want = 0; WEAR.k = 0; }
  return defZone({ n: 5, vis: [X - 2, END + 1], build, update, reset, solve, unbuild() { V = null; },
    respawn(c) { if (c.x > X && c.x < END) { Object.assign(W, { ex: 0, caught: 0 }); if (!S.done) WEAR.want = 1; } }, S, W, over });
})();
