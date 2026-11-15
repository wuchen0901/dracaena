
// ============================================================
//  第四章 · 劳动车间
//  一个很大的车间。几十个穿灰色工服的人站成排，重复同一个动作。头顶的信号灯一变，铃一响，所有人同时停下，同时转身，同时走向下一台机器。
//  一个人倒下了，旁边的人继续干活，没有人看他一眼；看守把他拖上推车（开场那种），往左推走。
//  怎么通过：入口的工服推车上拿一件灰色工服套上，混进队伍。规矩和他们一样 ——
//    干活的时候：站在一台机器前面，面朝机器（朝左），别动；
//    铃响（红灯）：站住；
//    灯变（黄灯）：转身，跟着他们走到下一台（按住 Shift 慢走正好是他们的步子，跑起来就错了）。
//  慢了、动错了，高处看守台的聚光灯就落到他身上，停久了就被发现。走过最后一台机器，躲进大机器后面，抓着链条爬上检修道。
//  队伍里的人都不看他。只有一个人，在铃响以后所有人都停住的那一下，整个人朝他转过来，站了一下，又转回去。
//  看到的：灰衣服的人是在这里被用掉的。留下的问题：他们本来就是这样的吗？
// ============================================================
const E4X = EX + 290, E4_END = E4X + 75, CAT_Y = 5.2;             // CAT_Y：检修道的高度（第五章接着用）
const E4 = (() => {
  const X = E4X, END = E4_END, ST0 = X + 18, GAPS = 5, NST = 9, NS = 12, ZONE = [X + 14.5, X + 61.5];      // 九台机器，隔 5 米；NS：一排人一共占几个位置（多出来的在门外）
  const T_WORK = 5.0, T_STOP = 1.5, T_MOVE = 4.2, V_LINE = 1.25, ROWZ = [-0.5, -2.8, -5.1, -7.4, -9.7];
  const C = chapter({ n: 3, x0: X + 0.5, start: X + 3, name: '劳动车间', sub: '只听铃声', ground: 'concrete' });   // 游戏里的第 3 章（焚化炉删掉以后）
  terrain([END, 0]); ground(X + 1, 0x24292b); ground(END, 0x24292b);
  solid({ id: 'e4block', x1: X + 67, x2: X + 127, y1: 0, y2: CAT_Y, snd: 'metal' });                     // 检修道：从这里一直通到第五章的尽头（下面是别的屋子，过不去）
  const CHAIN = rope({ x: X + 66, top: 8.4, bot: 1.85, r: 0.035, windK: 0.3 });
  const slotX = s => ST0 + GAPS * s;
  // ph：work 干活 / stop 铃响，全停 / move 灯变，转身走到下一台。ct 这一段过了多久，cyc 第几轮；grace 刚进来的几秒不算
  const S = { ph: 'work', ct: 0, cyc: 0, grace: 0, entered: false, dress: 0, fall: 0, fallT: 0, turned: 0, turnT: 0, why: '' }, W = { ex: 0, caught: 0 };
  const TOWER = { x: X + 40, y: 8.2, z: -14.5, ax: X + 40, az: -5 };
  // 人：五排。最前面一排隔一个位置站一个（空着的那些，主角可以站）；后面四排几乎站满
  const WK = [];
  ROWZ.forEach((z, r) => { for (let s0 = 0; s0 < NS; s0++) { if (r === 0 ? s0 % 2 : (s0 * 7 + r * 3) % 11 === 0) continue; const f = fig('gray', 0, { z, face: -1, act: 'work', turn: 0.22 }); f.k = 14; WK.push({ f, r, s0, out: false }); } });
  const CG = fig('guard', X + 64, { z: -1.65, face: -1, hide: true });
  const FIGS = [...WK.map(w => w.f), CG];
  const slotOf = w => ((w.s0 + S.cyc) % NS + NS) % NS - 2;                                   // -2、-1 在门外等着，0..8 在机器前面，9 走出去了

  usable({ id: 'e4wear', x: X + 8, r: 1.2, can: () => WEAR.want === 0 && S.dress <= 0, on() { S.dress = 1.0; fx('cloth'); } });
  for (const x of [3, 9.5, 23, 38, 53, 63.5, 70]) checkpoint(X + x, x > 66 ? { y: CAT_Y } : {});
  camKeys([X + 1, 19.5, 1.9, 1], [X + 12, 21, 2.1, 2], [X + 17, 25, 3.0, 1.5, 2.2], [X + 58, 25, 3.0, 0.5, 2.2], [X + 64, 23, 3.4, 0.8, 1.2], [X + 68, 23, 2.2, 1.5, 0.5], [END, 24, -1.6, 1, 2.6]);
  // 光：惨白的高处顶灯，冷，整齐
  env(X + 0.7, { fog: 0x1f2426, fogD: 0.024, hemiS: 0xa9b6ba, hemiG: 0x171c1e, hemiI: 0.8, keyC: 0xe6f0f4, keyI: 0.5, keyDir: [0.12, 1, 0.3], rimC: 0xbfd6e0, rimI: 0.5,
    dustC: 0xdfeaee, dustO: 0.3, wind: 0.01, ext: 0, vig: 1.05, aRoom: 1, roomF: 230, aHum: 0.8, aDrip: 0, aFar: 0.7, rvHall: 1 });
  env(X + 13, {});
  env(X + 17, { fog: 0x2b3336, fogD: 0.019, hemiS: 0xd3dfe4, hemiG: 0x242b2e, hemiI: 1.08, keyC: 0xeef6fa, keyI: 0.8, rimI: 0.45, vig: 1.0 });
  env(END - 0.7, {});

  const inZone = () => P.x > ZONE[0] && P.x < ZONE[1] && P.y < 1.5;
  const stationAt = () => { const k = clamp(Math.round((P.x - ST0) / GAPS), 0, NST - 1); return Math.abs(P.x - slotX(k)) < 1.0 ? k : -1; };
  hint(() => WEAR.want === 0 && S.dress <= 0 && Math.abs(P.x - (X + 8)) < 1.2, '按 <b>E</b> 套上一件灰色工服');
  hint(() => WEAR.want === 0 && P.x > X + 10.5 && P.x < X + 16, '穿着自己的衣服进去，一眼就会被认出来');
  hint(() => inZone() && S.grace > 0, '混进队伍：站到一台空着的机器前面，面朝机器（朝左）');
  hint(() => inZone() && S.ph === 'stop', '铃响了 —— 站住别动');
  hint(() => inZone() && S.ph === 'move' && S.ct < 3.4, '灯变了 —— 转身，跟着他们走到下一台（按住 <b>Shift</b> 慢走）');
  hint(() => inZone() && S.ph === 'work' && S.ct > 1 && stationAt() < 0, '站到一台机器前面去');
  hint(() => inZone() && S.ph === 'work' && S.ct > 1.8 && stationAt() >= 0 && P.facing > 0, '面朝机器（朝左）');
  hint(() => P.x > X + 62 && P.x < X + 66.8 && P.y < 1 && P.mode !== 'rope', '<b>空格</b> 跳起来抓住链条，按住 <b>↑</b> 往上爬');
  hint(() => P.mode === 'rope' && P.rope === CHAIN && P.y >= CAT_Y - 0.95, '按 <b>→</b> 翻上检修道');

  // 灯：五盏信号灯（颜色跟着铃声变）；入口那辆推车上方一盏
  const SIGX = [22, 32, 42, 52, 62].map(x => X + x), SIG_C = { work: new THREE.Color(0xdfe8ea), stop: new THREE.Color(0xff3a2a), move: new THREE.Color(0xffb23a) };
  const sigL = [SIGX[0], SIGX[2], SIGX[4]].map(x => pointLight({ p: [x, 5.6, -3.5], c: 0xdfe8ea, i: 16, d: 17, dec: 1.3 }));
  pointLight({ p: [X + 8, 3.2, -0.4], c: 0xffd9a0, i: 7, d: 8, dec: 1.6 });

  let V = null;
  function* build(R) {
    const v = {}, B = baker(); B.vary = 0.06;
    hallLayers(X - 1.5, END + 2, { far: '#1b2225', win: '#5f7279', mid: '#11171a', near: '#0c1012', near2: '#1a2226' }, { cols: [X + 5.5, X + 66.2], fore: [X + 27.3, X + 49.1], zMid: -17, zFar: -30, winGap: 6.5, beam: false, farK: 1.6 });
    yield;
    floorSeams(R, X + 2, X + 66);
    // 入口：一辆装着灰色工服的推车，一道带门洞的隔断
    v.wearCart = mkCart(R, X + 8, -1.0, 'clothes');
    add(R, bx(0.6, 9, 12), MAT.wall2, X + 13, 4.5, -7.6); add(R, bx(0.6, 5.4, 3.0), MAT.wall2, X + 13, 3.6 + 2.7, -0.1); add(R, bx(0.6, 9, 3), MAT.wall2, X + 13, 4.5, 2.9);
    // 机器：每个位置左边一台，一只铁柜、一块斜着的台面、一根杆
    ROWZ.forEach(z => { for (let k = 0; k < NST; k++) { B.at(slotX(k) - 0.82, 0, z - 0.02); B.box(0.62, 1.05, 0.9, 0x353d41, 0, 0.525, 0); B.box(0.5, 0.06, 0.8, 0x4a555a, 0.16, 1.1, 0, 0, 0, -0.5); B.box(0.07, 0.5, 0.07, 0x1d2224, -0.1, 1.3, 0.2); } });
    for (let k = 0; k < NST; k++) { B.at(slotX(k), 0, 0); B.box(0.9, 0.012, 0.9, 0x3d474b, 0, 0.008, 0.02); }                   // 最前面一排地上的站位
    B.mesh(R);
    yield;
    // 信号灯：吊在头顶的五只大灯
    const sigM = unlit(0xdfe8ea, { fog: false }); sigM.userData.own = true; v.sigM = sigM;
    v.sig = SIGX.map(x => { add(R, cy(0.03, 0.03, 6, 6), MAT.dark, x, 9.2, -3.5, false); add(R, cy(0.55, 0.4, 0.5, 14), MAT.dark, x, 6.35, -3.5, false); add(R, new THREE.SphereGeometry(0.34, 14, 10), sigM, x, 6.0, -3.5, false); return glow(R, 0xdfe8ea, 3.4, 0.7, x, 6.0, -3.3); });
    for (let x = X + 16; x < X + 66; x += 5) glow(R, 0xe8f2f6, 1.5, 0.5, x, 9.6, -9);                                            // 高处一排惨白的顶灯
    // 看守台：后墙前面一座架高的小屋，一盏聚光灯
    for (const sx of [-1.6, 1.6]) add(R, bx(0.25, 6.6, 0.25), MAT.dark, TOWER.x + sx, 3.3, TOWER.z - 0.6);
    add(R, bx(4.4, 0.25, 3), MAT.dark, TOWER.x, 6.7, TOWER.z - 0.8); add(R, bx(4.0, 2.2, 2.4), lam(0x1b2023), TOWER.x, 7.9, TOWER.z - 1.2);
    add(R, new THREE.PlaneGeometry(3.2, 0.7), unlit(0x8fa6ad, { fog: true }), TOWER.x, 8.2, TOWER.z + 0.02, false);
    v.eye = glow(R, 0xeaf4f6, 5, 0.85, TOWER.x, TOWER.y, TOWER.z + 0.4, GLOW_SOFT);
    v.cone = mkCone(R, 0.13, { op: 0.075 });
    yield;
    // 车间尽头：一台大机器挡住看守台的视线；后面一根链条垂下来，上面是检修道
    add(R, bx(3.4, 7.5, 5), lam(0x2a3236), X + 63.6, 3.75, -4.2); add(R, bx(2.2, 2.4, 2.2), lam(0x20272a), X + 63.2, 8.7, -4.4);
    add(R, bx(0.5, 0.5, 4.6), MAT.steel, X + 66, 8.65, -1.6);                                                                    // 吊链条的横梁
    ropeMesh(R, CHAIN, { mat: lam(0x394145) });
    add(R, bx(60, 0.14, 1.5), MAT.steel, X + 97, CAT_Y - 0.07, 0); add(R, bx(0.3, CAT_Y, 9), lam(0x20262a), X + 67.15, CAT_Y / 2, -4.6);   // 检修道的铁板；下面一堵墙
    for (let x = X + 67.2; x < END + 2; x += 1.6) add(R, cy(0.025, 0.025, 1.0, 5), MAT.dark, x, CAT_Y + 0.5, -0.72, false);
    add(R, bx(END + 2 - X - 67, 0.05, 0.05), MAT.dark, (X + 67 + END + 2) / 2, CAT_Y + 1.0, -0.72, false);
    v.cart = mkCart(R, X + 64, -1.65);
    v.crowd = mkCrowd(R, FIGS.length + 2); v.crowd.addAll(FIGS);
    V = v;
  }

  function ring(v = 1) { fx('ebell', v * sstep(70, 20, Math.abs(P.x - (X + 38)))); }
  function stepLine(dt) {
    S.ct += dt;
    if (S.ph === 'work' && S.ct >= T_WORK) { S.ph = 'stop'; S.ct = 0; ring(); }
    else if (S.ph === 'stop' && S.ct >= T_STOP) { S.ph = 'move'; S.ct = 0; ring(0.8); }
    else if (S.ph === 'move' && S.ct >= T_MOVE) { S.ph = 'work'; S.ct = 0; S.cyc++; }
    const u = S.ph === 'move' ? clamp(S.ct * V_LINE / GAPS, 0, 1) : 0, walking = S.ph === 'move' && u < 1;
    for (const w of WK) {
      const f = w.f; if (w.out) continue;
      const s = slotOf(w), x = slotX(s) + GAPS * u;
      f.hide = x < X + 13.4 || x > X + 62.3; f.x = x;
      if (S.ph === 'stop') { if (w !== S.turner) f.act = 'freeze'; f.vx = 0; }
      else if (walking) { figAct(f, 'march'); f.face = 1; f.vx = V_LINE; }
      else { figAct(f, 'work'); f.face = -1; f.vx = 0; }
    }
  }
  function stepEvents(dt) {
    const hk = stationAt();
    // 一个人倒下了：主角走到第四台以后的某一轮，他斜后方那个人干着干着栽倒在地上。下一轮看守推着车来，把他拖上车，往左推走
    if (S.fall === 0 && hk >= 3 && S.ph === 'work' && S.ct > 1.6 && S.ct < 2.2 && inZone()) {
      const w = WK.find(w => w.r === 1 && !w.out && slotOf(w) === hk + 1) || WK.find(w => w.r === 1 && !w.out && slotOf(w) === hk + 2);
      if (w) { S.fall = 1; S.fallT = 0; S.faller = w; w.out = true; figAct(w.f, 'prone', { k: 4.5, vx: 0 }); fx('thud', 0.5); }
    }
    if (S.fall >= 1 && S.fall < 5) {
      const f = S.faller.f, t = S.fallT += dt;
      if (S.fall === 1 && t > 7) { S.fall = 2; Object.assign(CG, { x: X + 63.5, hide: false, face: -1 }); figAct(CG, 'push'); S.cartX = X + 62.2; }
      else if (S.fall === 2) { AUD.wheels = Math.max(AUD.wheels, 0.35 * sstep(30, 8, Math.abs(P.x - S.cartX))); S.cartX -= 1.4 * dt; CG.x = S.cartX + 1.25; CG.vx = -1.4; if (S.cartX < f.x + 1.5) { S.fall = 3; S.fallT = 0; } }
      else if (S.fall === 3) {                         // 抬起来，扔上车
        figAct(CG, 'lift'); CG.vx = 0; const k = sstep(0.4, 1.3, t); f.x = lerp(f.x, S.cartX, k); f.z = lerp(f.z, -1.65, k); f.y = (CART.bed + 0.03) * k + 0.45 * Math.sin(Math.PI * k);
        if (k >= 1) { figAct(f, 'lie', { k: 9, face: 1 }); if (t > 1.6) { S.fall = 4; fx('clunk'); figAct(CG, 'push'); } }
      } else if (S.fall === 4) { AUD.wheels = Math.max(AUD.wheels, 0.35 * sstep(30, 8, Math.abs(P.x - S.cartX))); S.cartX -= 1.3 * dt; CG.x = S.cartX + 1.25; CG.vx = -1.3; f.x = S.cartX - 0.05; if (S.cartX < X + 11) { S.fall = 5; CG.hide = true; f.hide = true; } }
    }
    // 只有一个人：铃响以后所有人都停住的那一下，主角身后那个人整个人朝他转过来，站了一下，又转回去
    if (S.turned === 0 && S.fall >= 3 && hk >= 5 && S.ph === 'stop' && S.ct > 0.2 && inZone()) {
      const w = WK.find(w => w.r === 1 && !w.out && slotOf(w) === hk) || WK.find(w => w.r === 1 && !w.out && Math.abs(slotOf(w) - hk) === 1);
      if (w) { S.turned = 1; S.turner = w; figAct(w.f, 'stand', { yawT: -1.5708, yk: 5 }); }
    }
    if (S.turned === 1 && (S.ph !== 'stop' || S.ct > T_STOP - 0.35)) { S.turned = 2; S.turner.f.yawT = undefined; S.turner.f.yk = 8; S.turner = null; }
  }
  function stepRules(dt) {
    // 主角守不守规矩。why：这一刻错在哪（调试、提示用）
    let bad = 0; S.why = '';
    if (inZone()) {
      if (!S.entered) { S.entered = true; S.grace = 7; }
      S.grace = Math.max(0, S.grace - dt); TIRED.rushT = 0.5;
      const sp = Math.abs(P.vx), k = stationAt();
      if (WEAR.k < 0.5) { bad = 2; S.why = 'clothes'; }
      else if (S.grace > 0) { if (sp > 2.0) { bad = 1; S.why = 'run'; } }
      else if (S.ph === 'work') { if (S.ct > 1.4 && (k < 0 || sp > 0.35)) { bad = 1; S.why = k < 0 ? 'place' : 'moving'; } else if (S.ct > 2.2 && P.facing > 0) { bad = 0.5; S.why = 'facing'; } }
      else if (S.ph === 'stop') { if (S.ct > 0.5 && sp > 0.25) { bad = 1; S.why = 'bell'; } }
      else if (P.vx < -0.3 || sp > 2.0) { bad = 1; S.why = P.vx < 0 ? 'back' : 'run'; }
    }
    if (W.caught > 0) watchStep(W, true, dt);
    else { W.ex = clamp(W.ex + (bad && state === 'play' ? bad * dt / 2.2 : -dt / 4), 0, 1); if (W.ex >= 1 && state === 'play') { W.caught = 1e-3; ctl = false; fx('alarm'); } }
    HX.alert = sstep(0.3, 1, W.ex);
    // 和他们做一样的动作：站在机器前面、面朝机器、没在动，两只手就跟着大家的拍子干活
    if (inZone() && S.ph === 'work' && stationAt() >= 0 && P.facing < 0 && Math.abs(P.vx) < 0.1 && P.grounded && state === 'play') {
      const w = T * 2.6; HX.pose = { arms: [{ a: 0.95 + 0.42 * Math.sin(w), b: 0.85 - 0.3 * Math.sin(w) }, { a: 0.95 - 0.42 * Math.sin(w), b: 0.85 + 0.3 * Math.sin(w) }], bow: 0.12, turn: 0 };
    }
  }
  function update(dt) {
    const near = Math.abs(P.x - (X + 38)) < 80;
    if (near) { stepLine(dt); stepEvents(dt); }
    stepRules(dt);
    // 套上工服
    if (S.dress > 0) { S.dress -= dt; if (S.dress < 0.5) WEAR.want = 1; HX.pose = { reach: { x: X + 8, y: 0.95, k: sstep(1.0, 0.75, S.dress) * sstep(0, 0.3, S.dress) }, bow: 0.25 * sstep(1.0, 0.7, S.dress) * sstep(0, 0.3, S.dress) }; P.vx = 0; }
    // 看守台的聚光灯：平时慢慢扫着后面几排；主角一出错就转过来
    const kx = sstep(0.12, 0.7, W.ex), sx = X + 40 + 17 * Math.sin(T * 0.23), sz = -5 + 3 * Math.sin(T * 0.31 + 1);
    TOWER.ax = damp(TOWER.ax, lerp(sx, P.x, kx), 3, dt); TOWER.az = damp(TOWER.az, lerp(sz, 0, kx), 3, dt);
    if (near) useBeam(TOWER.x, TOWER.y, TOWER.z + 0.5, TOWER.ax, lerp(0.3, P.y + 0.7, kx), TOWER.az, { ang: 0.085, i: 38, alert: sstep(0.5, 1, W.ex) });
    const c = SIG_C[S.ph]; for (const l of sigL) l.c.copy(c);
    if (V) stepRopes([CHAIN], dt);
    for (const f of FIGS) figStep(f, dt);
    const v = V; if (!v) return;
    v.sigM.color.copy(c); for (const g of v.sig) g.material.color.copy(c);
    v.cone.aim(TOWER.x, TOWER.y, TOWER.z + 0.5, TOWER.ax, 0.2, TOWER.az); v.cone.m.material.color.copy(beam.color); v.eye.material.color.copy(beam.color);
    v.cart.visible = S.fall >= 2 && S.fall < 5; if (v.cart.visible) v.cart.position.x = S.cartX;
    v.crowd.draw();
  }
  function reset() {
    Object.assign(S, { ph: 'work', ct: 0, cyc: 0, grace: 0, entered: false, dress: 0, fall: 0, fallT: 0, turned: 0, turnT: 0, faller: null, turner: null, cartX: X + 62 }); Object.assign(W, { ex: 0, caught: 0 });
    for (const w of WK) { w.out = false; Object.assign(w.f, { y: 0, z: ROWZ[w.r], yawT: undefined, yk: 8, k: 14, hide: false, face: -1, vx: 0 }); figAct(w.f, 'work'); w.f.x = slotX(slotOf(w)); figSnap(w.f); }
    CG.hide = true; WEAR.want = 0; ropeReset(CHAIN);
  }
  function solve() { reset(); WEAR.want = 1; WEAR.k = 1; S.entered = true; S.fall = 5; S.turned = 2; }
  return defZone({ n: 3, vis: [X - 2, END + 1], build, update, reset, solve, unbuild() { V = null; },
    respawn(c) { if (c.x > X && c.x < END) { Object.assign(W, { ex: 0, caught: 0 }); S.grace = 6; if (c.x > X + 9.2) { WEAR.want = 1; } } }, S, W, WK, CHAIN, TOWER, slotX, slotOf, stationAt, T_WORK, T_STOP, T_MOVE });
})();
