// ============================================================
//  第 27 章 · 刮泥桥（工厂深处之三）
//  污水厂那种圆形的沉淀池：一个巨大的圆池，一座桥架绕着池心慢慢转，桥下拖着刮泥的耙子，池面全是灰褐的浮渣，隔很久翻上来一个泡。
//  桥的另一头站着一个看守，打着手电往池面上照。两个人绕着同一个圆转，谁也碰不到谁。没有怪物，只有一台自己转的机器。
//  玩法：桥转到和路对齐的时候，才能踩着它走；转开以后，离池心越远的地方越早“离开”脚下。
//  在岸边等它转过来，上去就往池心跑；在池心等半圈，等另一头转过来，再往对岸跑
//  （桥在路上的那一段：池心往两边各 L = min(半径, 2 / |sin θ|) 米，θ 是桥和路的夹角；52 秒转一圈，每 26 秒对齐一次。
//   对齐前后各 1.7 秒桥一直伸到岸边；从池心往外跑，要在对齐前 4 到 1.5 秒之间起跑）
// ============================================================
const H3 = (() => {
  const k = 2, X = hX(k), LEN = 64;
  hChapter(k, { name: '刮泥桥', sub: '等它转过来', ground: 'concrete', len: LEN, tint: 0x14130e });
  const CX = X + 19, RAD = 9.5, SURF = -0.55, BOT = -3, OM = 2 * Math.PI / 52, HALFW = 2.0, TOPY = 0.02;   // 桥面和岸一样高：走上去不用跳
  terrain([X - 14, 0], [CX - RAD - 0.3, 0], [CX - RAD - 0.28, BOT], [CX + RAD + 0.28, BOT], [CX + RAD + 0.3, 0], [X + LEN + 4, 0]);
  ground(X - 14, 0x24231d); ground(X + LEN + 4, 0x22211c);
  groundFront(CX - RAD - 0.3, CX + RAD + 0.3, null);                 // 池子这一段的地面自己搭（地上一块挖了圆洞的板子）
  const MUD = ooze({ x1: CX - RAD, x2: CX + RAD, y: SURF, bot: BOT, z1: -RAD, z2: RAD, kind: 'sludge', circle: RAD, cut: false, rate: 0.35, big: 0.25, haze: 0.08, nh: 5, li: 1.2 });
  const BRIDGE = solid({ x1: CX - 1, x2: CX + 1, y1: TOPY - 0.2, y2: TOPY, plat: true, noclimb: true, snd: 'metal' });
  const HUB = solid({ x1: CX - 1.1, x2: CX + 1.1, y1: BOT, y2: TOPY, noclimb: true, snd: 'metal' });
  checkpoint(X + 2); checkpoint(CX, { y: TOPY }); checkpoint(CX + RAD + 2);
  camKeys([X - 14, 17, 1.6, 1, 1], [CX - RAD - 2, 21, 1.2, 2, 4], [CX + RAD + 2, 21, 1.2, 0, 4], [X + 46, 17, 1.6, 1, 0.8], [X + LEN + 4, 16, 1.6, 1, 0]);
  hEnv(k, { fog: 0x12120d, fogD: 0.022, hemiS: 0x8a8670, hemiG: 0x141410, hemiI: 0.5, keyC: 0xcfc8a8, keyI: 0.3, rimC: 0xd0c090, rimI: 0.3, dustC: 0xd8d0b0, dustO: 0.3, aRoom: 0.5, aHum: 0.5, aFlow: 0.2 }, LEN);
  FAR[HN(k)] = ['creak', 'chain', 'hum2', 'gurgle'];
  const hubL = pointLight({ p: [CX, 3.4, 0.5], c: 0xffc27a, i: 2.4, d: 9 });

  const S = { t: 0, th: 0, L: 0 };
  const theta = t => OM * (t - 7);                              // 一开始离对齐还有七秒（桥正转过来）
  hint(() => P.x > X + 2 && P.x < CX - RAD && S.L < RAD - 0.5, '桥会转过来。等它和路对上');
  hint(() => P.x > X + 2 && P.x < CX - RAD && S.L >= RAD - 0.5, '上去，往池心跑');
  hint(() => Math.abs(P.x - CX) < 1.2 && P.y > -0.1 && !(S.L >= 4 && Math.sin(S.th) * Math.cos(S.th) < 0), '在池心等。桥的另一头一伸过来就往对岸跑');
  hint(() => Math.abs(P.x - CX) < 1.2 && P.y > -0.1 && S.L >= 4 && Math.sin(S.th) * Math.cos(S.th) < 0, '跑');

  let V = null;
  function* build(R) {
    const v = {};
    hHall(X, LEN, { far: '#17160f', win: '#2f2c20', mid: '#100f0b', near: '#080806' }, { cols: [X + 4, X + 40, X + 58], fore: [X + 3, X + 42], top: 26 });
    yield;
    MUD.build(R);
    // 地面：一块挖了圆洞的板子；池壁是一圈开口的圆筒
    const sh = new THREE.Shape(); sh.moveTo(-RAD - 0.3, -24); sh.lineTo(RAD + 0.3, -24); sh.lineTo(RAD + 0.3, 14); sh.lineTo(-RAD - 0.3, 14); sh.closePath();
    const hole = new THREE.Path(); hole.absarc(0, 0, RAD + 0.3, 0, Math.PI * 2, true); sh.holes.push(hole);
    const floor = add(R, new THREE.ShapeGeometry(sh, 64), lam(0x24231d, { side: THREE.DoubleSide }), CX, 0, 0, false); floor.rotation.x = Math.PI / 2; floor.receiveShadow = true;
    const wall = add(R, new THREE.CylinderGeometry(RAD + 0.3, RAD + 0.3, -BOT + 0.35, 72, 1, true), lam(0x3a382e, { side: THREE.DoubleSide }), CX, (BOT + 0.35) / 2, 0);
    add(R, new THREE.TorusGeometry(RAD + 0.4, 0.12, 6, 72), lam(0x4a473a), CX, 0.35, 0).rotation.x = Math.PI / 2;
    add(R, new THREE.CylinderGeometry(RAD + 0.3, RAD + 0.3, 0.2, 48), lam(0x15140f), CX, BOT, 0);
    // 池心的柱子和顶上的机器（在路后面一点）
    add(R, cy(1.1, 1.2, TOPY - BOT, 20), lam(0x3c3b33), CX, (TOPY + BOT) / 2, 0);
    yield;
    // 桥：一根直径那么长的桁架，绕着池心转。桥下拖着两排耙子，桥上一个看守
    v.rot = grp(R, CX, 0, 0);
    const bm = lam(0x4b4a40), bm2 = lam(0x2b2a24);
    add(v.rot, bx(RAD * 2 + 0.2, 0.16, 1.3), bm, 0, TOPY - 0.08, 0);
    for (const z of [-0.62, 0.62]) { add(v.rot, bx(RAD * 2, 0.05, 0.05), bm2, 0, TOPY + 1.0, z, false); add(v.rot, bx(RAD * 2, 0.04, 0.04), bm2, 0, TOPY + 0.5, z, false);
      for (let x = -RAD; x <= RAD + 0.01; x += 1.2) add(v.rot, bx(0.05, 1.0, 0.05), bm2, x, TOPY + 0.5, z, false); }
    for (let x = -RAD + 0.8; x < RAD - 0.5; x += 1.6) if (Math.abs(x) > 1.4) { const a = add(v.rot, bx(0.08, 1.2, 0.08), bm2, x, TOPY - 0.7, 0.75, false); add(v.rot, bx(0.7, 0.4, 0.05), bm2, x + 0.2, TOPY - 1.25, 0.75, false).rotation.y = 0.6; }
    add(v.rot, bx(2.2, 1.8, 1.8), lam(0x3a3930), 0, TOPY + 2.4, -1.4);                         // 驱动的机器：桥中间、路后面
    add(v.rot, cy(0.08, 0.08, 1.8, 6), MAT.dark, 0, TOPY + 3.6, -1.4);
    v.hubLamp = glow(R, 0xffc27a, 1.4, 0.7, CX, TOPY + 3.4, -0.4);
    v.crowd = mkCrowd(R, 2);
    v.guard = v.crowd.add(fig('guard', CX, { y: TOPY, face: 1, act: 'point', turn: 0.4 }));
    v.cone = mkCone(R, 0.14, { c: 0xdfe8ea, op: 0.14 }); v.gl = glow(R, 0xffffff, 0.35, 0.8);
    v.spot = add(R, new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: GLOW_SOFT, color: 0xdfe8ea, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }), 0, SURF + 0.03, 0, false);
    v.spot.rotation.x = -Math.PI / 2; v.spot.scale.setScalar(3); v.spot.renderOrder = 44;
    // 浮渣：一块块灰白的东西漂在池面上，跟着耙子慢慢转
    v.scum = grp(R, CX, SURF + 0.03, 0);
    for (let i = 0; i < 40; i++) { const r = rr(1.6, RAD - 0.4), a = rr(0, 6.283); add(v.scum, bx(rr(0.2, 0.7), 0.04, rr(0.2, 0.6)), lam(pick([0x5a5444, 0x6c6552, 0x4a4538])), r * Math.cos(a), 0, r * Math.sin(a), false).rotation.y = rr(0, 3); }
    V = v;
  }
  function update(dt) {
    const play = state === 'play';
    S.t += dt; S.th = theta(S.t);
    const sn = Math.abs(Math.sin(S.th)); S.L = Math.min(RAD + 0.25, HALFW / Math.max(1e-3, sn));
    BRIDGE.x1 = CX - S.L; BRIDGE.x2 = CX + S.L;
    if (Math.floor((S.t - 7) / 26) !== Math.floor((S.t - dt - 7) / 26) && Math.abs(P.x - CX) < 30) fx('clang', 0.5);   // 对齐的那一刻：桥轴“咔”一声
    if (Math.random() < dt * 0.4 && Math.abs(P.x - CX) < 25) fx('grind', 0.4);
    MUD.step(dt);
    const v = V; if (!v) return;
    v.rot.rotation.y = S.th; v.scum.rotation.y = S.th * 0.92;
    // 看守站在 +x 那一头，手电照着他前面的池面
    const gr = RAD - 1.2, c = Math.cos(S.th), s = Math.sin(S.th), gx = CX + gr * c, gz = -gr * s, f = v.guard;
    f.x = gx; f.z = gz; f.y = TOPY; f.yawT = S.th; f.dirty = true; figStep(f, dt);
    const lx = gx - 0.3 * c + 0.4 * s, lz = gz + 0.3 * s + 0.4 * c, tx = CX + (RAD - 3.5) * c + 1.6 * s, tz = -(RAD - 3.5) * s + 1.6 * c;
    f.tx = tx; f.ty = SURF;
    v.cone.aim(lx, TOPY + 1.45, lz, tx, SURF, tz); v.gl.position.set(lx, TOPY + 1.45, lz); v.spot.position.set(tx, SURF + 0.03, tz);
    v.crowd.draw();
    hubL.on = 0.8 + 0.2 * Math.sin(T * 3);
  }
  function reset() { S.t = 0; }
  return defZone({ n: HN(k), vis: [X - 14, X + LEN + 4], build, update, reset, solve() {}, unbuild() { V = null; MUD.unbuild(); }, S, CX, RAD, BRIDGE, theta });
})();
