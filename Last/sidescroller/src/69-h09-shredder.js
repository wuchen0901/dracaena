// ============================================================
//  第 33 章 · 进料带（工厂深处之九）
//  一条长长的传送带，把“用不上的东西”往右送进一张黑洞洞的嘴里：一捆捆白色的内衣，一个个不动的人。嘴里两排带齿的辊子一直转。
//  传送带中段有一个检查口：玻璃亭子里坐着一个看守，一盏灯从上面照着带子，站着的东西一眼就看得出来。
//  玩法：跳上传送带，到检查口之前按 ↓ 躺下，混在货里让它把你送过去（躺着的时候不能走，按方向键起来）。
//  过了检查口马上起来，在被卷进那张嘴以前跳上右上方的走道
// ============================================================
const H9 = (() => {
  const k = 8, X = hX(k), LEN = 64;
  hChapter(k, { name: '进料带', sub: '躺下', ground: 'metal', len: LEN, tint: 0x100c0c });
  const B1 = X + 6, B2 = X + 40, BT = 0.6, SPD = 1.0, M1 = B2, M2 = B2 + 3.2;
  terrain([X - 14, 0], [M1, 0], [M1 + 0.02, -3], [M2 - 0.02, -3], [M2, 0], [X + LEN + 4, 0]);
  ground(X - 14, 0x221d1c); ground(X + LEN + 4, 0x201b1a);
  hCut(X - 14, X + LEN + 4);
  const BELT = solid({ id: 'belt', x1: B1, x2: B2, y1: 0, y2: BT, snd: 'metal' });
  const WALK = solid({ id: 'walk33', x1: X + 36.4, x2: X + LEN + 1, y1: 1.85, y2: 2.05, plat: true, snd: 'metal' });    // 右上方的走道：从嘴的上面过去（站在带子上头碰不到，跳起来扒得住）
  const HOUSE = solid({ x1: M2, x2: M2 + 3, y1: 0, y2: 1.8, noclimb: true });                                              // 嘴右边的机壳（走道下面）
  pit({ x1: M1, x2: M2, y: 0.4, sfx: 'grind', on() { fx('rush', 0.6); } });
  checkpoint(X + 2); checkpoint(X + 44, { y: 2.05 });
  camKeys([X - 14, 16.5, 1.6, 1, 0.6], [X + 20, 17, 1.4, 2, 1], [X + 40, 17, 1.8, 1, 1], [X + LEN + 4, 16.5, 1.8, 1, 0.6]);
  hEnv(k, { fog: 0x0f0b0b, fogD: 0.028, hemiS: 0x8a7a76, hemiG: 0x120c0c, hemiI: 0.48, keyC: 0xe0d0c8, keyI: 0.25, rimC: 0xd0a090, rimI: 0.3, dustC: 0xd8c8c0, dustO: 0.35, aRoom: 1, roomF: 80, aHum: 0.5 }, LEN);
  FAR[HN(k)] = ['clank', 'relay', 'chain', 'knock'];
  const BOOTH = X + 23, LIT1 = X + 18.5, LIT2 = X + 28.5;
  const boothL = spotLight({ p: [BOOTH, 4.6, 0.2], t: [BOOTH, 0, 0], c: 0xfff2d8, i: 7, a: 0.62, d: 12, pen: 0.4 });
  const mouthL = pointLight({ p: [M1 + 1.6, 1.4, 0.8], c: 0xff3020, i: 1.6, d: 6 });
  const L = { on: false, k: 0 }, W = { ex: 0, caught: 0 };
  const onBelt = () => P.grounded && P.y > BT - 0.05 && P.y < BT + 0.05 && P.x > B1 && P.x < B2;
  hint(() => P.x > X + 1 && P.x < B1 - 0.2, '跳上传送带');
  hint(() => onBelt() && !L.on && P.x < LIT1 - 0.3, '前面有人看着。按 <b>↓</b> 躺下，混在货里');
  hint(() => L.on && P.x < LIT2, '别动');
  hint(() => P.x > LIT2 + 0.5 && P.x < M1 && P.y < 1.5, L.on ? '起来（按 <b>→</b>），跳上右上方的走道' : '跳上右上方的走道');

  let V = null;
  function* build(R) {
    const v = {};
    hHall(X, LEN, { far: '#151110', win: '#2c2220', mid: '#0f0c0b', near: '#080606' }, { cols: [X + 3, X + 52], fore: [X + 12, X + 48] });
    hCutFace(R, X - 14, M1 - 0.2, 0); hCutFace(R, M2 + 0.2, X + LEN + 4, 0);
    yield;
    // 传送带：两头的滚筒、一段段的皮带（贴图往右走）、下面的支腿
    const [c, gc] = mkCanvas(256, 64); gc.fillStyle = '#1e1c1b'; gc.fillRect(0, 0, 256, 64); gc.fillStyle = '#2c2928'; for (let i = 0; i < 256; i += 16) gc.fillRect(i, 0, 6, 64);
    const bt = canvasTex(c); bt.wrapS = THREE.RepeatWrapping; bt.repeat.set((B2 - B1) / 1.2, 1); bt.userData.shared = false;
    const bm = new THREE.MeshLambertMaterial({ map: bt }); bm.userData.own = true; v.bt = bt;
    add(R, bx(B2 - B1, 0.06, 1.5), bm, (B1 + B2) / 2, BT - 0.03, 0);
    add(R, bx(B2 - B1, BT - 0.06, 1.3), lam(0x2a2625), (B1 + B2) / 2, (BT - 0.06) / 2, 0);
    for (const z of [-0.8, 0.8]) add(R, bx(B2 - B1, 0.16, 0.08), lam(0x4a3f3a), (B1 + B2) / 2, BT + 0.02, z);
    v.rollers = [];
    for (const [x, z] of [[M1 + 0.9, 0], [M1 + 2.2, 0]]) {
      const r = add(R, cy(0.55, 0.55, 2.0, 12), lam(0x3a3230), x, 0.0, z); r.rotation.x = Math.PI / 2;
      for (let i = 0; i < 10; i++) add(r, bx(0.16, 2.0, 0.16), lam(0x5a4a40), Math.cos(i * 0.63) * 0.58, 0, Math.sin(i * 0.63) * 0.58, false);
      v.rollers.push(r);
    }
    // 嘴：上面压着一整块机壳，嘴里黑洞洞的，底下透出一点红光
    add(R, bx(M2 - M1 + 3.6, 6, 3.2), lam(0x1d1817), (M1 + M2 + 3) / 2, 6.0, -2.4);
    add(R, bx(3, 1.8, 3.2), lam(0x1d1817), M2 + 1.5, 0.9, -0.9);
    add(R, bx(M2 - M1, 0.05, 1.6), new THREE.MeshBasicMaterial({ color: 0x220404 }), (M1 + M2) / 2, -1.2, 0, false);
    glow(R, 0xff3020, 3.5, 0.35, M1 + 1.6, 0.4, 0.6, GLOW_SOFT);
    grating(R, WALK.x1, WALK.x2, WALK.y2, -0.9, 0.9, lam(0x3e3a38));
    for (let x = WALK.x1 + 0.3; x < WALK.x2; x += 4) add(R, bx(0.12, 1.85, 0.12), MAT.dark, x, 0.925, -0.95, false);
    yield;
    // 检查口：玻璃亭子，里面坐着一个看守；顶上一盏灯照着带子
    add(R, bx(4, 3.2, 2.4), lam(0x2a2524), BOOTH, 1.6, -3.4); add(R, bx(3.2, 1.4, 0.05), new THREE.MeshLambertMaterial({ color: 0x9ab0b0, transparent: true, opacity: 0.3 }), BOOTH, 2.2, -2.18, false);
    add(R, bx(4.2, 0.2, 2.6), lam(0x1d1918), BOOTH, 3.3, -3.4);
    add(R, cy(0.3, 0.45, 0.4, 12), MAT.dark, BOOTH, 4.8, 0.2); v.lampG = glow(R, 0xfff2d8, 2.2, 0.8, BOOTH, 4.6, 0.3);
    v.pool = add(R, new THREE.PlaneGeometry(LIT2 - LIT1, 1.6), new THREE.MeshBasicMaterial({ map: GLOW_SOFT, color: 0xfff2d8, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false }), BOOTH, BT + 0.02, 0, false);
    v.pool.rotation.x = -Math.PI / 2; v.pool.renderOrder = 44;
    v.crowd = mkCrowd(R, 14);
    v.guard = v.crowd.add(fig('guard', BOOTH - 0.4, { z: -3.0, act: 'sit', face: 1 }));
    // 货：一捆捆白色的东西、几个不动的人，等距地排在带子上往右走
    v.cargo = [];
    for (let i = 0; i < 9; i++) {
      const kind = i % 3 === 1 ? 'body' : 'bundle', o = { kind, x: B1 + 0.5 + i * ((B2 - B1) / 9), z: rr(-0.3, 0.3) };
      if (kind === 'body') o.f = v.crowd.add(fig('body', o.x, { y: BT, z: o.z, act: 'lie', face: rnd() < 0.5 ? 1 : -1 }));
      else { o.g = grp(R, o.x, BT, o.z); for (let j = 0; j < 4; j++) add(o.g, bx(rr(0.4, 0.7), rr(0.15, 0.3), rr(0.4, 0.7)), lam(j % 2 ? 0xcfccc2 : 0xb8b4a8), rr(-0.15, 0.15), 0.1 + j * 0.12, rr(-0.15, 0.15)).rotation.y = rr(0, 3); }
      v.cargo.push(o);
    }
    v.crowd.addAll([]);
    V = v;
  }
  function update(dt) {
    const play = state === 'play';
    // 带子：人站在上面就跟着往右走
    if (onBelt()) carryOn(BELT, SPD * dt);
    if (Math.abs(P.x - (B1 + B2) / 2) < 30) AUD.belt = 0.6;
    // 躺下 / 起来
    if (play && ctl && onBelt() && !L.on && pressed.has('DOWN')) { L.on = true; fx('cloth'); }
    if (L.on && (!onBelt() || (ctl && (keys.has('L') || keys.has('R') || keys.has('J'))) && L.k > 0.6)) { L.on = false; }
    L.k = damp(L.k, L.on ? 1 : 0, 5, dt);
    if (L.on) { P.speedK = 0; P.vx = 0; } else if (P.speedK === 0 && chapterAt(P.x).n === HN(k)) P.speedK = 1;
    if (L.k > 0.02) HX.pose = { sit: L.k, sitH: 0.06, sitLeg: 1.4, lie: L.k, look: 0 };
    // 检查口：灯照着的那一段，站着的、在走的都会被看见
    const seen = play && P.x > LIT1 && P.x < LIT2 && P.y < 2 && !(L.on && L.k > 0.8);
    HX.alert = watchStep(W, seen, dt, 0.35, 1.0);
    if (Math.random() < dt * 1.2 && Math.abs(P.x - M1) < 25) fx('grind', 0.5);
    boothL.c.setRGB(1, 0.95 - 0.6 * W.ex, 0.85 - 0.7 * W.ex);
    const v = V; if (!v) return;
    v.bt.offset.x -= SPD * dt / 1.2;
    for (const r of v.rollers) r.rotation.y += dt * 2.4;
    for (const o of v.cargo) {
      o.x += SPD * dt; let y = BT;
      if (o.x > B2) y = BT - (o.x - B2) * 2.2;
      if (o.x > B2 + 1.4) { o.x = B1 + 0.3; }
      if (o.f) { o.f.x = o.x; o.f.y = y; o.f.dirty = true; o.f.hide = y < -0.6; figStep(o.f, dt); }
      else { o.g.position.set(o.x, y, o.z); o.g.visible = y > -0.6; }
    }
    figAct(v.guard, W.ex > 0.3 ? 'point' : 'sit'); v.guard.tx = P.x; v.guard.ty = P.y + 1; figStep(v.guard, dt);
    v.crowd.draw();
    v.pool.material.color.copy(boothL.c);
  }
  function reset() { L.on = false; L.k = 0; Object.assign(W, { ex: 0, caught: 0 }); }
  return defZone({ n: HN(k), vis: [X - 14, X + LEN + 4], build, update, reset, solve() {}, unbuild() { V = null; }, respawn() { reset(); P.speedK = 1; }, L, W, BELT });
})();
