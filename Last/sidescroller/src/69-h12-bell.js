// ============================================================
//  第 36 章 · 铃（工厂深处之十二，最后一章）
//  整座工厂都听这口铃。走廊尽头是一间高高的屋子，屋顶下吊着一口大铜铃，旁边一台机器，一根长长的锤臂。
//  机器自己不会动：锤臂上拴着一根绳子，一个穿灰色工服、头发全白的老人站在底下，隔一会儿拉一下 —— 铃就响一声。
//  后墙的高窗外面是劳动车间，铃一响，窗里的人影同时停下；再一响，同时转身。
//  玩法：爬上机器旁边的架子，按 E 把一根铁杠别进锤臂的齿轮里。老人再拉，锤子不动了，铃不响了。
//  他又拉了两下，回过头来看着你，然后坐下来。窗外的人影一个一个停在原地，不再转身。
//  右边的门开了，外面是白的。走出去，就是这一组的结尾。
//  2026-11-17：结尾画面上按 → 接着往前走（cont）：白光退下去，门外那一片白原来是雾，往右走进第 37 章“草地”（src/69-m01-meadow.js，中间的路在 69-zz-links.js）
// ============================================================
const H12 = (() => {
  const k = 11, X = hX(k), LEN = HLEN[k];
  const ZC = hChapter(k, { name: '铃', sub: '整座工厂都听它的', ground: 'concrete', len: LEN, tint: 0x0d0f10 });
  ZC.end = { h1: '工厂深处', go: '按 R 再听一次铃　·　Esc 选择章节' }; ZC.endTint = 0xf3f1ea;
  terrain([X - 14, 0], [X + LEN + 4, 0]);
  ground(X - 14, 0x24282a); ground(X + LEN + 4, 0x2a2e30);
  hCut(X - 14, X + LEN + 4);
  const BX = X + 34, DOOR_X = X + 48;
  const SHELF = solid({ x1: X + 27, x2: X + 31.2, y1: 0, y2: 1.3, snd: 'metal' });
  const DOOR = gate({ x: DOOR_X, w: 0.5, h: 3.6, T: 2.2 });
  checkpoint(X + 2); checkpoint(X + 24);
  camKeys([X - 14, 15, 1.5, 1, 0.4], [X + 20, 16, 1.8, 2, 0.4], [X + 30, 19, 3.2, 2, 0.4], [X + 44, 18, 2.2, 1, 0.4], [X + LEN + 4, 15, 1.5, 1, 0]);
  hEnv(k, { fog: 0x0c0e0f, fogD: 0.026, hemiS: 0x8a9298, hemiG: 0x101213, hemiI: 0.5, keyC: 0xe8e0d0, keyI: 0.35, keyDir: [-0.3, 0.8, 0.4], rimC: 0xc8d0d8, rimI: 0.3, dustC: 0xe0e4e8, dustO: 0.5, aRoom: 0.7, roomF: 110, aHum: 0, aDrip: 0.2, aFar: 0.3 }, DOOR_X - X - 3);   // 厂房里的光登记到门口为止（以前登记到 X + LEN + 2，和门外那一片白重在一处：出了门先暗下去一截才变白）
  const W6 = [0xd8dcd8, 0xd8dcd8, 0xd8dcd8, 0xd8dcd8, 0xd8dcd8, 0xd8dcd8], W6b = W6.map(() => 0xf0f0ec);   // 门外的天也是白的（以前是厂房里的黑天：门外没东西挡着的地方露出一块黑）
  env(DOOR_X - 1, { fog: 0x0c0e0f }); env(DOOR_X + 8, { fog: 0xd8dcd8, fogD: 0.09, hemiS: 0xffffff, hemiI: 1.6, dustO: 0.1, sky: W6 }); env(X + LEN + 2, { fog: 0xf0f0ec, fogD: 0.12, hemiS: 0xffffff, hemiI: 2.0, sky: W6b });
  FAR[HN(k)] = ['creak', 'knock', 'creak'];
  const winL = spotLight({ p: [BX - 6, 9, -9], t: [BX, 0, 0], c: 0xd8e4f0, i: 3, a: 0.5, d: 22, pen: 0.8 });
  // S.ph：0 铃照常响 / 1 别住了，老人还在拉 / 2 老人回头、坐下 / 3 门开了 / 4 走出去了（结尾画面）。cont：结尾画面上按了接着往前走（不再演结尾）
  const S = { ph: 0, t: 0, ring: 0, pull: 0, swing: 0, tries: 0, end: 0, cont: 0 };
  const RING_T = 6;
  usable({ x: BX - 3.1, r: 0.9, y0: 1.2, y1: 1.5, can: () => S.ph === 0 && S.pull < 0.2, on() { S.ph = 1; S.t = 0; fx('clang', 1.2); fx('lever'); } });
  hint(() => S.ph === 0 && P.x > X + 20 && P.x < SHELF.x1, '爬上机器旁边的架子');
  hint(() => S.ph === 0 && P.y > 1.2 && P.x > SHELF.x1 + 2, '按 <b>E</b> 把铁杠别进齿轮里');

  let V = null, ZONE = null;
  function* build(R) {
    const v = {};
    hHall(X, LEN, { far: '#15181a', win: '#4a5660', mid: '#0f1112', near: '#070809' }, { cols: [X + 4, X + 52], fore: [X + 10, X + 42], top: 30, winGap: 7 });
    hCutFace(R, X - 14, X + LEN + 4, 0);
    yield;
    // 屋子：高高的后墙上一排窗，窗外是劳动车间（一排人影）
    add(R, bx(30, 16, 0.6), lam(0x2a2e30), BX - 4, 8, -8.4);
    v.win = [];
    for (let i = 0; i < 5; i++) {
      const wx = BX - 14 + i * 5; add(R, bx(3, 3.2, 0.1), new THREE.MeshBasicMaterial({ color: 0x8a9aa6 }), wx, 9, -8.05, false);
      for (let j = 0; j < 2; j++) add(R, bx(0.08, 3.2, 0.12), MAT.dark, wx - 0.5 + j, 9, -8.0, false);
      v.win.push(wx);
    }
    v.crowd = mkCrowd(R, 22);
    v.shadows = [];
    for (const wx of v.win) for (let j = 0; j < 3; j++) { const f = v.crowd.add(fig('gray', wx - 1 + j, { y: 7.7, z: -8.6, act: 'work', face: 1, H: 1.3 })); v.shadows.push({ f, flip: 0, stop: rr(0.5, 4) }); }
    yield;
    // 铃：吊在屋顶下面；机器：一个铁箱子，一根锤臂，一个大齿轮；锤臂上拴着一根绳子垂下来
    v.bell = grp(R, BX - 0.3, 6.9, -1.0);
    const bronze = lam(0x8a6a3a); add(v.bell, cy(0.55, 1.15, 1.6, 20), bronze, 0, -0.8, 0); add(v.bell, cy(1.2, 1.2, 0.12, 20), bronze, 0, -1.6, 0); add(v.bell, cy(0.12, 0.12, 0.4, 8), MAT.dark, 0, 0.2, 0);
    add(R, bx(0.3, 0.3, 4), MAT.dark, BX - 0.3, 7.3, -1.0); add(R, bx(9, 0.4, 0.4), MAT.dark, BX - 2, 7.5, -1.0);
    add(R, bx(2.4, 3.0, 2), lam(0x3a3836), BX - 3.6, 1.5, -2.2);
    v.gear = add(R, cy(0.9, 0.9, 0.2, 18), lam(0x5a5450), BX - 3.6, 3.4, -1.1); v.gear.rotation.x = Math.PI / 2;
    for (let i = 0; i < 12; i++) add(v.gear, bx(0.18, 0.2, 0.18), lam(0x5a5450), Math.cos(i * 0.52) * 0.95, 0, Math.sin(i * 0.52) * 0.95, false);
    v.arm = grp(R, BX - 3.6, 3.4, -1.0); add(v.arm, bx(3.6, 0.18, 0.18), lam(0x4a4440), 1.8, 0, 0); add(v.arm, bx(0.5, 0.5, 0.5), lam(0x2a2826), 3.5, 0, 0);
    v.bar = add(R, bx(0.08, 1.6, 0.08), lam(0x8a7a6a), BX - 3.1, 2.0, -0.4); v.bar.rotation.z = 0.5;
    v.rope = add(R, cy(0.025, 0.025, 1, 5), lam(0x8a7a5a), BX - 1.2, 0, -1.0, false);
    add(R, bx(SHELF.x2 - SHELF.x1, 0.1, 1.4), lam(0x3a3e40), (SHELF.x1 + SHELF.x2) / 2, SHELF.y2 - 0.05, -0.2);
    for (const x of [SHELF.x1 + 0.1, SHELF.x2 - 0.1]) add(R, bx(0.1, SHELF.y2, 1.4), MAT.dark, x, SHELF.y2 / 2, -0.2);
    // 老人：头发全白，穿着灰色工服，站在绳子底下
    v.old = v.crowd.add(fig('worn', BX - 1.0, { z: -0.95, act: 'stand', face: -1 }));
    v.old.col.hair = 0xd8d6d0; figRecolor(v.crowd, v.old, { hair: 0xd8d6d0 });
    // 门：一扇铁门，门外是白的
    v.door = add(R, bx(0.5, 3.6, 3), lam(0x2c3032), DOOR_X, 1.8, -1.2);
    add(R, bx(0.6, 12, 6), MAT.dark, DOOR_X, 9.6, -1.2); add(R, bx(0.6, 16, 20), MAT.dark, DOOR_X, 8, -14.2);
    v.white = glow(R, 0xffffff, 8, 0, DOOR_X + 3, 1.8, -0.5, GLOW_SOFT);
    v.crowd.addAll([]);
    V = v;
  }
  function ring() { S.swing = 1; if (Math.abs(P.x - BX) < 60) { fx('hbell', 1.4); fx('ebellFar', 1); } if (V) for (const s of V.shadows) s.flip = 1 - s.flip; }
  function update(dt) {
    const play = state === 'play';
    S.t += dt;
    // 老人拉绳：每 RING_T 秒一次（拉下去 0.6 秒，松回来 0.8 秒）；别住以后锤子不动
    S.ring += dt;
    if (S.ph < 2 && S.ring > RING_T) { S.ring = 0; if (S.ph === 1) S.tries++; }
    const u = S.ring, pullK = S.ph >= 2 ? 0 : u < 0.6 ? sstep(0, 0.6, u) : u < 1.4 ? 1 - sstep(0.6, 1.4, u) : 0;
    if (S.ph === 0 && u >= 0.75 && u - dt < 0.75) ring();                         // 拉下去、一松手，锤臂弹上去打在铃口上
    if (S.ph === 1 && u >= 0.6 && u - dt < 0.6) fx('clunk');
    S.pull = pullK;
    if (S.ph === 1 && S.tries >= 2 && S.ring > 2) { S.ph = 2; S.t = 0; }
    if (S.ph === 2 && S.t > 6) { S.ph = 3; S.t = 0; DOOR.want = 1; fx('doorStop'); }
    if (S.ph >= 3 && play && P.x > DOOR_X + 6 && !S.end) { S.end = 1; S.ph = 4; ctl = false; autoDir = 1; fadeWhite(); }
    if (S.end && !S.cont) { S.end += dt; if (S.end > 3.2 && state === 'play') { autoDir = 0; showEndBare(ZONE, true); } }
    S.swing = Math.max(0, S.swing - dt * 0.35);
    const v = V; if (!v) return;
    v.bell.rotation.z = 0.12 * S.swing * Math.sin(S.t * 5);
    // 锤臂：平时斜着 0.45；拉下去压到 0.15；一松手弹到 0.66（锤头打在铃口上），再慢慢落回去。别住以后一动不动
    const armA = S.ph >= 1 ? 0.45 : u < 0.6 ? lerp(0.45, 0.15, sstep(0, 0.6, u)) : u < 0.75 ? lerp(0.15, 0.66, (u - 0.6) / 0.15) : lerp(0.66, 0.45, sstep(0.75, 1.8, u));
    v.arm.rotation.z = armA; v.gear.rotation.y = armA * 2;
    v.bar.visible = S.ph >= 1; if (S.ph >= 1) { v.bar.position.set(BX - 3.3, 3.3, -0.95); v.bar.rotation.z = 0.9; }
    const rx_ = BX - 3.6 + 2.4 * Math.cos(armA), top = 3.4 + Math.sin(armA) * 2.4, bot = S.ph >= 2 ? 0.3 : 1.55;   // 绳子拴在锤臂上，下头在老人手里（坐下以后垂在地上）
    v.rope.scale.y = Math.max(0.1, top - bot); v.rope.position.set(rx_, (top + bot) / 2, -1.0);
    const o = v.old;
    if (S.ph < 2) { figAct(o, 'reach'); o.face = -1; o.arm = 0; o.tx = rx_; o.ty = S.ph === 1 ? lerp(2.2, 2.0, pullK) : lerp(2.2, 1.6, pullK); o.x = rx_ + 0.45; }
    else if (S.t < 2.5) { figAct(o, 'stand'); o.face = P.x > o.x ? 1 : -1; o.yawT = o.face > 0 ? -1.1 : -Math.PI + 1.1; }
    else { figAct(o, 'sit'); o.yawT = undefined; o.face = -1; o.y = 0; }
    figStep(o, dt);
    // 窗外的人影：铃一响同时转身；不响了以后一个一个停住
    for (const s of v.shadows) { const f = s.f; f.face = s.flip ? -1 : 1; if (S.ph >= 2 && S.t > s.stop) figAct(f, 'stand'); figStep(f, dt); }
    v.door.position.y = 1.8 + DOOR.open * 3.7;
    v.white.material.opacity = 0.9 * DOOR.open; v.white.scale.setScalar(8 + 6 * DOOR.open);
    v.crowd.draw();
    winL.on = 0.8;
  }
  function fadeWhite() { const w = $('white'); if (w) { w.style.transition = 'opacity 3s ease'; w.style.opacity = 1; } }
  function reset() { Object.assign(S, { ph: 0, t: 0, ring: 0, pull: 0, swing: 0, tries: 0, end: 0, cont: 0 }); setGate(DOOR, 0); const w = $('white'); if (w) w.style.opacity = 0; }
  // 结尾画面上按了接着往前走（80-ui.js 的 continueFromEnd）：盖着的白慢慢退掉，人站在门外的白雾里，接着往右走
  function cont() { S.cont = 1; P.facing = 1; const w = $('white'); if (w) { w.style.transition = 'opacity 3s ease'; w.style.opacity = 0; } }
  function retry() {                                     // 结局画面上按 R：回到别铁杠之前，再听一次铃
    reset(); placePlayer(X + 24); P.cp = cpAt(P.x); ctl = true; autoDir = 0; state = 'play'; camOvr = null;
    $('end').classList.add('hide'); $('end').classList.remove('bare', 'white'); $('fade').style.opacity = 0; snapCamera(); applyEnv(camera.position.x); streamZones(cam.x, true);
  }
  // solve：从后面的章节开始（或者往回走到这里）—— 铃已经别住、门开着，结尾也算演过了（不然一走近门口就又演一遍）
  ZONE = defZone({ n: HN(k), vis: [X - 14, X + LEN + 4], build, update, reset, retry, cont, solve() { S.ph = 3; S.end = 4; S.cont = 1; setGate(DOOR, 1); }, unbuild() { V = null; }, S, DOOR, SHELF });
  return ZONE;
})();
