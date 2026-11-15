
// ============================================================
//  第五章 · 维修巷：分配备用电池
//  巷口的服务站扫了 07 一眼：停产型号，不予维修。
//  巷子里有一块备用电池，卡在一条滑轨中间。左边尽头是一台被淘汰的清洁机器人（照看它的老人把外套搭在它身上），
//  右边尽头是维护门的电源插座。把电池推到哪一头，就把电给了谁：
//    给清洁机器人 —— 它醒过来，先扫掉老人脚边的灰，再从栅栏底下钻过去，扫开门另一侧的卡扣；
//    给门 —— 门直接升起，老人把外套重新盖回机器人身上。
//  两条路都能继续往前走
// ============================================================
const CH5 = (() => {
  const X = X5, BOT0 = X + 17.0, L_END = X + 17.95, R_END = X + 33.2, DOOR = X + 35.2, ELDER = X + 15.0, STATION = X + 7;
  const C = chapter({ n: OLD + 5, x0: X + 0.5, start: X + 3, name: '维修巷', sub: '分配备用电池' });
  C.ground = 'concrete';
  terrain([X6, 0]);
  ground(X + 4, 0x3f4446); ground(X6 - 6, 0x44494a);
  const batt = pushable({ id: 'battery', x: X + 25.5, w: 0.9, h: 0.8, min: L_END, max: R_END, grip: 0.7, snd: 'metal' });
  const door = gate({ id: 'door5', x: DOOR, w: 0.6, h: 3.4 });
  // choice：0 还没选 / 1 给了清洁机器人 / 2 给了门。t：选了以后过了多久
  const S = { choice: 0, t: 0, scan: -1, bx: BOT0, bz: -0.45, bface: 1, spin: 0, lamp: 0, coat: 0, es: 1, ex: ELDER };
  checkpoint(X + 3); checkpoint(X + 20); checkpoint(DOOR + 3);
  camKeys([X + 2, 18.5, 1.75, 0], [X + 14, 19, 1.85, 1.5], [X + 26, 20, 1.9, 0], [DOOR, 19.5, 1.85, 0.5], [X6 - 2, 19, 1.8, 0]);
  env(X + 5, { fog: 0x7c8588, fogD: 0.014, hemiS: 0xd6dede, hemiG: 0x3a3e40, hemiI: 0.8, keyI: 1.05, keyDir: [0.15, 1, 0.1], dustO: 0.42, wind: -0.1, sunP: 0.1,
    aWind: 0.2, aCity: 0.5, aDrip: 0.45, aHum: 0.25, aFar: 0.8, rvHall: 0.35 });   // 声音：巷子里风小，管子滴水、电箱的嗡嗡，墙之间有回声   // 两排楼夹着的窄巷：暗一些
  env(X6 - 12, {}); env(X6 - 2, CITY_ENV);

  hint(() => !S.choice && Math.abs(P.x - batt.x) < 2.4 && P.y < 0.5 && P.mode !== 'push', '按住 <b>E</b> 推电池 —— 滑轨一头通向清洁机器人，一头通向维护门');
  hint(() => !S.choice && P.x > DOOR - 2.4 && P.x < DOOR && P.mode !== 'push', '维护门断电了。插座就在门边');

  for (const x of [X + 10, X + 24, X + 34]) spotLight({ p: [x, 5.6, 0.6], t: [x, 0, -0.5], c: 0xcfe2ea, i: 2.6, a: 0.5, d: 14 });       // 巷子里几盏吊灯
  const botL = pointLight({ p: [BOT0, 0.7, 0.3], c: 0xbfeaff, i: 3, d: 5, dec: 2, on: 0 });
  const sockL = pointLight({ p: [R_END + 0.8, 1.3, 0.3], c: 0xff4a2a, i: 1.6, d: 4, dec: 2 });
  const stL = pointLight({ p: [STATION, 1.8, -0.4], c: 0x9fd6ff, i: 2.4, d: 5, dec: 2 });

  let V = null;
  function mkCleaner(parent) {                           // 清洁机器人：一只矮矮的圆桶，前面一把圆刷，头顶一颗镜头
    const g = grp(parent), body = grp(g, 0, 0.12, 0), shell = lam(0xaab0aa, { emissive: 0xaab0aa, emissiveIntensity: 0.1 });
    add(g, cy(0.27, 0.29, 0.12, 16), MAT.dark, 0, 0.08, 0);
    add(body, cy(0.24, 0.27, 0.34, 16), shell, 0, 0.19, 0); add(body, new THREE.SphereGeometry(0.24, 16, 8, 0, 6.2832, 0, Math.PI / 2), shell, 0, 0.36, 0).scale.y = 0.6;
    add(body, bx(0.06, 0.16, 0.2), MAT.dark, 0.25, 0.2, 0, false);                                    // 胸口的电池接口
    const lens = unlit(0x1e2628, { fog: false }); add(body, new THREE.SphereGeometry(0.055, 10, 8), lens, 0.17, 0.42, 0, false);
    const halo = glow(body, 0xbfeaff, 0.9, 0, 0.2, 0.42, 0.05);
    add(body, cy(0.008, 0.008, 0.22, 4), MAT.dark, -0.12, 0.6, 0.06, false);
    const brush = grp(g, 0.33, 0.045, 0); add(brush, cy(0.19, 0.19, 0.05, 14), MAT.rust2, 0, 0, 0);
    for (let i = 0; i < 10; i++) { const a = i / 10 * 6.2832; add(brush, bx(0.09, 0.03, 0.02), MAT.dry, Math.cos(a) * 0.2, -0.01, Math.sin(a) * 0.2, false).rotation.y = -a; }
    return { g, body, brush, lens, halo };
  }
  function* build(R) {
    const v = {};
    backdrop(X - 30, X6 + 30, -6, 80, -150, 6, g => {     // 巷子上方露出的高楼
      setInk(g, vgrad(g, 66, 0, '#b3b9b9', '#8e9496'));
      for (let x = X - 28; x < X6 + 28; x += rr(5, 10)) building(g, x, -6, rr(5, 12), rr(22, 70), { holes: 0.38, gx: 2.6, gy: 3.6, win: 1.1, winH: 1.5, base: 8 });
    }, { fog: false, order: -2000, fadeL: 26, fadeR: 26 });
    yield;
    backdrop(X - 8, X6 + 8, -3, 40, -20, 14, g => {       // 巷子后面一排更高的楼
      setInk(g, '#4b5254');
      for (let x = X - 6; x < X6 + 6; x += rr(7, 12)) building(g, x, -3, rr(7, 12), rr(24, 38), { holes: 0.4, gx: 2.3, gy: 3.2, base: 12 });
    }, { fadeL: 6, fadeR: 6 });
    yield;
    // 巷子的后墙：一整面旧砖墙，高低不齐；上面是管线、通风机、关死的门
    backdrop(X - 4, X6 + 4, -3, 22, -4.4, 26, g => {
      setInk(g, '#2b3133');
      ridge(g, X - 4, X6 + 4, -3, x => 13.5 + 3.5 * Math.sin(x / 9.3) + (Math.floor(x / 7) % 2) * 2.4, 0.5);
      setInk(g, '#23282a');
      for (let x = X; x < X6; x += rr(5, 9)) { box(g, x, 0, 1.3, 2.5); box(g, x - 0.1, 2.5, 1.5, 0.14); }                                       // 门
      for (let i = 0; i < 12; i++) { const x = rr(X, X6), y = rr(4, 10); box(g, x, y, 1.4, 1.0); for (let k = 0; k < 4; k++) box(g, x + 0.1 + k * 0.32, y + 0.12, 0.2, 0.76); }
      setInk(g, '#1c2123');
      for (const y of [3.3, 3.75, 6.6]) box(g, X - 4, y, X6 - X + 8, y > 5 ? 0.22 : 0.14);                                                       // 沿墙的管子
      for (let x = X + 3; x < X6; x += rr(6, 11)) { box(g, x, 0, 0.2, 13); box(g, x - 0.12, rr(2, 9), 0.44, 0.3); }
      for (let i = 0; i < 26; i++) { const x = rr(X, X6), y = rr(3, 12); g.clearRect(x, y, 0.9, 1.2); }                                         // 墙上零星的窗洞
      setInk(g, '#1c2123'); for (let x = X + 1; x < X6; x += rr(8, 14)) { for (let y = 6; y < 13; y += 2.6) { box(g, x, y, 3.2, 0.12); line(g, [[x, y], [x + 3.2, y + 2.6]], 0.07); } box(g, x, 6, 0.1, 7.6); box(g, x + 3.1, 6, 0.1, 7.6); }   // 消防梯
    }, { fadeL: 3, fadeR: 3 });
    yield;
    backdrop(X - 4, X6 + 4, -3, 10, 6, 22, g => {         // 前景：垃圾箱、杆子、头顶的缆线
      setInk(g, '#040607');
      const top = [[X - 4, -5]];
      for (let x = X - 4; x <= X6 + 4; x += rr(0.5, 1.6)) { const h = rr(0.15, 0.5); top.push([x, h]); }
      top.push([X6 + 4, -5]); poly(g, top);
      for (const x of [X - 1.5, X + 44]) { box(g, x, -3, 2.4, 4.3); box(g, x - 0.15, 1.2, 2.7, 0.22); }
      box(g, X + 21.4, -3, 0.3, 13);
      for (let x = X - 2; x < X6; x += rr(6, 11)) cable(g, x, 10, x + rr(6, 11), 10, rr(1.2, 2.6), 0.09);
    }, { fog: false, blur: 2.2, order: 4000 });
    yield;
    for (const x of [X + 10, X + 24, X + 34]) { add(R, cy(0.012, 0.012, 6, 4), MAT.dark, x, 8.7, 0.2, false); add(R, cy(0.05, 0.28, 0.2, 10), MAT.dark, x, 5.7, 0.2, false); glow(R, 0xcfe6f0, 1.5, 0.75, x, 5.55, 0.2); }

    // 巷口的服务站：一只带屏幕的立柜
    add(R, bx(1.2, 2.2, 0.7), MAT.wall2, STATION, 1.1, -1.5); add(R, bx(1.4, 0.1, 0.9), MAT.steel, STATION, 2.25, -1.5);
    add(R, bx(0.9, 0.62, 0.06), MAT.dark, STATION, 1.62, -1.13);
    v.stIdle = plate(R, iconTex('bot'), 0.42, 0.42, STATION, 1.62, -1.09, 0x9fd6ff, { fog: true, order: 1 });
    v.stNo = grp(R, STATION, 1.62, -1.09);
    plate(v.stNo, iconTex('cross'), 0.36, 0.36, -0.22, 0, 0, 0xff5a44); plate(v.stNo, textTex('07\n停产', { w: 128, h: 128, size: 44, color: '#ffb0a0' }), 0.4, 0.4, 0.2, 0, 0, 0xffffff);
    plate(R, textTex('服务站', { w: 256, h: 80, size: 50, color: '#d5dedc', worn: 3 }), 1.0, 0.32, STATION, 2.55, -1.12, 0x9aa4a2, { fog: true, order: 1 });
    v.scan = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.05), new THREE.MeshBasicMaterial({ color: 0x9fe0ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    v.scan.renderOrder = 70; R.add(v.scan);
    // 滑轨、电池、两头的接口
    for (const z of [-0.26, 0.26]) add(R, bx(R_END - L_END + 1.4, 0.05, 0.06), MAT.steel, (L_END + R_END) / 2, 0.025, z, false).receiveShadow = true;
    for (let x = L_END - 0.4; x < R_END + 0.6; x += 1.1) add(R, bx(0.12, 0.02, 0.8), MAT.dark, x, 0.012, 0, false);
    v.batt = grp(R, batt.x, 0, 0);
    add(v.batt, bx(0.86, 0.1, 0.72), MAT.dark, 0, 0.12, 0); add(v.batt, bx(0.78, 0.5, 0.6), lam(0x3c4a44), 0, 0.43, 0);
    add(v.batt, bx(0.8, 0.07, 0.62), MAT.copper, 0, 0.36, 0, false); add(v.batt, bx(0.3, 0.08, 0.3), MAT.copper, 0, 0.72, 0);
    for (const sx of [-1, 1]) { add(v.batt, bx(0.04, 0.34, 0.5), MAT.steel, sx * 0.43, 0.6, 0, false); add(v.batt, bx(0.05, 0.05, 0.56), MAT.steel, sx * 0.43, 0.78, 0, false); }
    v.cells = [0, 1, 2].map(i => add(v.batt, bx(0.1, 0.07, 0.02), unlit(0x8fe6ff, { fog: false }), -0.16 + i * 0.16, 0.5, 0.31, false));
    plate(v.batt, iconTex('bolt'), 0.2, 0.2, 0.28, 0.5, 0.305, 0xe8c070, { fog: true, order: 1 });
    add(R, bx(0.5, 1.2, 0.5), MAT.steel, R_END + 0.75, 0.6, -0.45); add(R, bx(0.08, 0.2, 0.26), MAT.dark, R_END + 0.48, 0.42, -0.2, false);     // 门边的电源插座
    v.sockLamp = unlit(0xff4a2a, { fog: false }); add(R, new THREE.SphereGeometry(0.06, 8, 6), v.sockLamp, R_END + 0.75, 1.3, -0.18, false);
    tube(R, [[R_END + 0.9, 1.2, -0.6], [R_END + 1.2, 3.2, -1.2], [DOOR, 3.7, -1.4]], 0.03, MAT.dark);
    plate(R, iconTex('bolt'), 0.3, 0.3, R_END + 0.75, 0.85, -0.19, 0x8a9a98, { fog: true, order: 1 });
    // 维护门：一道栅栏门，底下留着一条矮缝
    for (const z of [-1.4, 1.4]) add(R, bx(0.5, 3.6, 0.24), MAT.steel, DOOR, 1.8, z);
    add(R, bx(0.5, 0.3, 3.0), MAT.steel, DOOR, 3.65, 0);
    v.gate = grp(R, DOOR, 0, 0);
    for (let z = -1.2; z <= 1.21; z += 0.24) add(v.gate, cy(0.028, 0.028, 2.7, 6), MAT.rust2, 0, 2.05, z);
    for (const y of [0.72, 2.0, 3.35]) add(v.gate, bx(0.08, 0.08, 2.56), MAT.rust2, 0, y, 0);
    add(R, bx(0.3, 0.2, 0.3), MAT.steel, DOOR + 0.5, 0.5, -1.15); v.latch = add(R, bx(0.34, 0.07, 0.07), MAT.rust, DOOR + 0.42, 0.5, -0.95);     // 门另一侧的卡扣
    add(R, bx(0.4, 3.4, 34), lam(0x3a4042), DOOR, 1.7, -18.6);                                           // 巷子在这里被一道墙隔断
    // 清洁机器人、老人、外套，和墙上的维修终端
    decal(R, BOT0 - 2.6, BOT0 + 2.2, -2.2, 1.6, 0, 30, g => { g.strokeStyle = 'rgba(170,180,178,.16)'; for (let i = 0; i < 9; i++) { g.lineWidth = 0.05 + 0.02 * (i % 3); g.beginPath(); g.arc(BOT0 - 0.4, -0.4, 0.5 + i * 0.2, Math.PI * 0.75, Math.PI * 1.8); g.stroke(); } });   // 反复扫出来的弧形痕迹
    v.bot = mkCleaner(R);
    v.coat = grp(R, BOT0, 0.5, -0.45); add(v.coat, bx(0.62, 0.05, 0.6), MAT.coat, 0, 0, 0); add(v.coat, bx(0.05, 0.42, 0.6), MAT.coat, -0.3, -0.2, 0); add(v.coat, bx(0.4, 0.05, 0.12), MAT.coat, -0.05, -0.02, 0.34).rotation.x = 0.9;
    add(R, bx(0.7, 0.45, 0.6), MAT.wood, ELDER, 0.225, -0.6);                                            // 老人坐的箱子
    add(R, bx(0.5, 0.4, 0.08), MAT.dark, BOT0 - 0.2, 2.1, -2.3); v.term = plate(R, iconTex('cross'), 0.26, 0.26, BOT0 - 0.2, 2.1, -2.24, 0xff5a44, { fog: true, order: 1 });
    add(R, bx(1.0, 0.5, 0.05), MAT.dark, L_END - 0.2, 1.5, -2.3); plate(R, iconTex('bot'), 0.3, 0.3, L_END - 0.2, 1.5, -2.26, 0x8a9a98, { fog: true, order: 1 });
    v.puffs = [0, 1, 2, 3].map(() => glow(R, 0xb9b3a4, 0.5, 0, 0, 0, 0));
    yield;
    v.elder = makeNPC('G', R, { x: ELDER, y: 0, z: -0.6, facing: 1 });
    V = v;
  }

  function choose(c) { S.choice = c; S.t = 0; batt.locked = true; STORY.cleaner = c; saveGame(); fx('dock'); if (c === 2) { door.want = 1; fx('powerUp'); } }
  function update(dt) {
    const near = Math.abs(P.x - (X + 22)) < 44;
    // 服务站：07 走到跟前，一道光从头扫到脚，然后亮出红叉
    if (S.scan < 0 && state === 'play' && P.x > STATION - 1.6 && P.x < STATION + 3) { S.scan = 0; fx('servo'); }
    if (S.scan >= 0 && S.scan < 9) { const was = S.scan; S.scan += dt; if (was < 1.7 && S.scan >= 1.7) fx('deny'); if (S.scan < 1.7 && Math.abs(P.x - STATION) < 4) HX.alert = Math.max(HX.alert, 0.3); }
    stL.c.set(S.scan >= 1.7 ? 0xff5a44 : 0x9fd6ff);
    // 电池推到哪一头，就算选了哪一头
    if (!S.choice && state === 'play') { if (batt.x <= L_END + 0.02) choose(1); else if (batt.x >= R_END - 0.02) choose(2); }
    if (S.choice) { S.t += dt; if (S.t > 0.9) batt.off = true; }                                    // 电池接上以后滑到墙边，不再挡路
    const t = S.t;
    if (S.choice === 1) {
      // 清洁机器人：亮灯 → 转过去扫掉老人脚边的灰 → 沿着墙根开到门前，从栅栏底下钻过去 → 扫开卡扣 → 门升起
      S.lamp = damp(S.lamp, t > 0.4 ? (t < 1.2 && Math.sin(t * 40) > 0 ? 0.3 : 1) : 0, 14, dt);
      let tx = BOT0, tz = -0.45, sp = 0;
      if (t > 1.3 && t < 4.4) { tx = ELDER + 0.75; tz = -0.25; sp = 0.9; }
      else if (t >= 4.4) { tx = t < 5 ? BOT0 : DOOR + 0.9; tz = -0.95; sp = 2.7; }
      const dx = tx - S.bx; if (Math.abs(dx) > 0.03) { const s = Math.sign(dx) * Math.min(sp, Math.abs(dx) / Math.max(dt, 1e-4)); S.bx += s * dt; S.bface = Math.sign(dx); }
      S.bz = damp(S.bz, tz, 3, dt);
      const atLatch = S.bx > DOOR + 0.85; if (atLatch && !S.latchT) { S.latchT = t; fx('spark'); }
      if (S.latchT && t > S.latchT + 1.2 && door.want === 0) { door.want = 1; fx('clunk'); }
      if (S.latchT && t > S.latchT + 2.4) { S.bx = damp(S.bx, DOOR + 2.6 + 0.9 * Math.sin(t * 0.5), 1.2, dt); S.bface = Math.cos(t * 0.5) > 0 ? 1 : -1; }      // 之后就在门那边慢慢扫
      S.spin += dt * (t > 1.3 ? 16 : 0);
      AUD.sweep = t > 1.3 ? sstep(26, 4, Math.abs(P.x - S.bx)) : 0;
      S.coat = damp(S.coat, t > 1.0 ? 1 : 0, 3, dt);                                                 // 外套滑下来，老人把它接到膝上
    } else if (S.choice === 2) {
      // 给了门：老人起身，把外套重新盖回机器人身上，再坐回去
      const up = sstep(1.0, 1.8, t) * (1 - sstep(6.4, 7.2, t)); S.es = 1 - up;
      S.ex = t < 1.6 ? ELDER : t < 3.6 ? Math.min(BOT0 - 0.75, S.ex + 0.5 * dt) : t < 5.2 ? S.ex : Math.max(ELDER, S.ex - 0.5 * dt);
      S.coat = -sstep(3.6, 4.8, t);
    }
    botL.on = S.lamp; botL.p[0] = S.bx; botL.p[2] = S.bz + 0.6;
    sockL.c.set(S.choice === 2 ? 0x6dff9a : 0xff4a2a);

    const v = V; if (!v) return;
    v.batt.position.x = batt.x; v.batt.position.z = S.choice ? -0.78 * sstep(0.5, 1.5, S.t) : 0;
    v.cells.forEach((m, i) => m.material.color.setHex(S.choice && S.t > 0.5 + i * 0.5 ? 0x1a2a30 : 0x8fe6ff));     // 电量一格一格送出去
    v.sockLamp.color.setHex(S.choice === 2 ? 0x6dff9a : 0xff4a2a);
    v.gate.position.y = sstep(0, 1, door.open) * 3.35;
    v.latch.rotation.z = door.want ? 1.2 : 0;
    v.stIdle.visible = S.scan < 1.7; v.stNo.visible = S.scan >= 1.7 && (S.scan > 2.6 || Math.sin(T * 14) > 0);
    const sk = S.scan >= 0 && S.scan < 1.7 ? S.scan / 1.7 : -1;
    v.scan.material.opacity = sk >= 0 ? 0.8 : 0; if (sk >= 0) v.scan.position.set(P.x, P.y + lerp(1.5, 0.05, sk), 0.3);
    v.term.visible = Math.sin(T * 5) > -0.3;
    // 清洁机器人
    const B = v.bot; B.g.position.set(S.bx, 0, S.bz); B.g.rotation.y = S.bface > 0 ? 0 : Math.PI;
    B.body.position.y = 0.12 + (S.lamp > 0.5 ? 0.03 + 0.008 * Math.sin(T * 9) : -0.04); B.body.rotation.z = S.lamp > 0.5 ? 0 : 0.16;       // 断电时歪着
    B.brush.rotation.y = S.spin; B.lens.color.setHex(S.lamp > 0.5 ? 0xdff6ff : 0x1e2628); B.halo.material.opacity = 0.7 * S.lamp;
    const sweeping = S.choice === 1 && ((t > 2.0 && t < 4.4) || (S.latchT && t < S.latchT + 1.4));
    v.puffs.forEach((p, i) => { const k = (T * 1.6 + i * 0.25) % 1; p.material.opacity = sweeping ? 0.35 * (1 - k) : 0; p.position.set(S.bx + S.bface * (0.4 + 0.5 * k), 0.1 + 0.35 * k, S.bz + 0.2 * Math.sin(i * 2.4)); p.scale.setScalar(0.3 + 0.6 * k); });
    // 外套：0 搭在机器人背上 / 1 在老人膝上 / -1 把机器人整个盖住
    const cz = S.coat;
    if (cz >= 0) { v.coat.position.set(lerp(BOT0 - 0.02, ELDER + 0.2, cz), lerp(0.52, 0.62, cz) + 0.3 * Math.sin(Math.PI * cz), lerp(-0.45, -0.55, cz)); v.coat.rotation.z = lerp(0.12, 0.05, cz); v.coat.scale.setScalar(1); }
    else { v.coat.position.set(BOT0 + 0.06 * -cz, 0.52 - 0.04 * -cz, -0.45 + 0.1 * -cz); v.coat.rotation.z = lerp(0.12, -0.25, -cz); v.coat.scale.set(1 + 0.25 * -cz, 1, 1 + 0.15 * -cz); }
    // 老人
    const El = v.elder; El.x = S.ex; El.vx = S.choice === 2 && ((t > 1.6 && t < 3.6 && S.ex < BOT0 - 0.76) || (t > 5.2 && S.ex > ELDER + 0.01)) ? (t < 4 ? 0.5 : -0.5) : 0;
    El.facing = S.choice === 2 && t > 5.2 && t < 7.2 && S.ex > ELDER + 0.05 ? -1 : 1;
    const watch = S.choice === 1 && t > 1.3 ? clamp((S.bx - ELDER) / 6, -0.9, 0.9) : undefined;
    El.pose = { sit: S.es, sitH: 0.34, bow: 0.18 + (S.choice === 2 ? 0.45 * sstep(3.4, 4.2, t) * (1 - sstep(4.8, 5.4, t)) : 0), look: watch,
      reach: S.choice === 2 && t > 3.3 && t < 5.2 ? { x: BOT0 - 0.1, y: 0.6, k: sstep(3.3, 3.9, t) * (1 - sstep(4.8, 5.2, t)) } : !S.choice && Math.abs(P.x - batt.x) < 3 ? { x: BOT0 - 0.25, y: 0.56, i: 0, k: 0.8 } : undefined };
    if (near) El.step(dt);
  }
  function reset() { placeBox(batt, X + 25.5); batt.locked = false; batt.off = false; setGate(door, 0); Object.assign(S, { choice: 0, t: 0, scan: -1, bx: BOT0, bz: -0.45, bface: 1, spin: 0, lamp: 0, coat: 0, es: 1, ex: ELDER, latchT: 0 }); }
  function solve() {
    reset(); const c = STORY.cleaner || 1; S.choice = c; S.t = 60; S.scan = 9; batt.locked = true; batt.off = true; setGate(door, 1); placeBox(batt, c === 1 ? L_END : R_END);
    if (c === 1) Object.assign(S, { bx: DOOR + 2.6, bz: -0.95, lamp: 1, coat: 1, latchT: 1 }); else S.coat = -1;
  }
  return defZone({ n: OLD + 5, vis: [X - 4, X6 + 4], build, update, reset, solve, unbuild() { V = null; }, batt, door, S });
})();
