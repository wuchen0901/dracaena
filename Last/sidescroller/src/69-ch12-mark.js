
// ============================================================
//  第十二章 · 作坊一角：在灯头上凿一个记号（《长夜》原型 C 的开头，设计见 design/long-night-story.md 第九节、第十一节第 4 条）
//  原型 C（机房与选择）要玩家认得记号，开头先垫一小段凿记号 —— 是第一章“作坊与落星”开头几拍的缩写：
//    一 · 按 E 修灯：按下接点，把松开的部件归位，灯亮了
//    二 · 按 E 凿记号：小錾子在灯头的金属套上凿出一个缺了一角的方框，光从凿穿的地方漏出来；镜头推近到灯跟前
//    三 · 按 E 取下来：取下来以后只剩一团低低的余光；举到检验光底下，突然亮了一下，旁边筐里待修的坏灯一点反应也没有；
//         用布包好，余光一点也透不出来，收进斜挎包
//  然后右边的门开了，走出去黑一下，直接到第十三章机房的门口（中间九章还没做）
//  （故事里第一章凿完记号是把灯放进周转箱、推上输送带送走的，夜里它从天上掉下来，孩子在门廊里才把它收进包里；这里为了接上机房，直接收进包里）
// ============================================================
const X12 = 2200;
const CH12 = (() => {
  const X = X12, BENCH = X + 4.2, INSP = BENCH + 0.5, DOOR = X + 9.4, STAND = BENCH - 0.42;
  const FIX = { x: BENCH, y: 1.0, z: 0.02 };                                         // 工作台上的检测灯座：灯泡挂在它下面（灯头朝上）
  const C = chapter({ n: OLD + 12, x0: X - 4, start: X + 1.2, name: '作坊一角', sub: '在灯头上凿一个记号', ground: 'wood',
    intro() { CAT.state = 'none'; } });
  terrain([X - 60, 0], [X + 60, 0]);
  ground(X - 60, 0x3a2f25); ground(X + 60, 0x3a2f25);
  solid({ x1: X - 1.6, x2: X - 0.6, y1: -2, y2: 30, noclimb: true });              // 身后是作坊里面
  const door = gate({ id: 'd121', x: DOOR, w: 0.5, h: 2.6, T: 1.4 });
  solid({ x1: DOOR + 2.2, x2: DOOR + 3.2, y1: -2, y2: 30, noclimb: true });
  checkpoint(X + 1.2);
  camKeys([X - 3, 9.6, 1.25, 1.6], [X + 2, 9.6, 1.25, 1.2], [BENCH, 9.2, 1.2, 0.4], [DOOR - 1, 9.6, 1.25, -0.4], [DOOR + 3, 10, 1.3, -1.2]);
  // 作坊的暖光：头顶一盏吊灯，工作台上一盏冷白的检验灯。门外是夜里
  env(X - 6, { fog: 0x17110c, fogD: 0.03, hemiS: 0xb39876, hemiG: 0x1a130e, hemiI: 0.42, keyC: 0xffd8a8, keyI: 0.55, keyDir: [-0.3, 1, 0.45], rimC: 0xffc890, rimI: 0.35,
    dustC: 0xffe0b8, dustO: 0.4, wind: 0.02, ext: 0, sky: [0x0a0c12, 0x0a0c12, 0x0a0c12, 0x0a0c12, 0x0a0c12, 0x0a0c12], sunP: 0, stars: 0, cloud: 0, birds: 0, flies: 0, vig: 1,
    aWind: 0, aWhis: 0, aLeaf: 0, aBug: 0, aDrip: 0, aFlow: 0, aRoom: 0.45, roomF: 190, aHum: 0.25, aCity: 0.15, aFar: 0.5, rvOut: 0, rvHall: 0.5, rvCave: 0 });
  env(DOOR + 0.5, {});
  env(DOOR + 2.5, { fog: 0x090c12, hemiS: 0x55627a, hemiG: 0x08090c, hemiI: 0.3, keyC: 0x8fa2c0, keyI: 0.2, aRoom: 0.1, aHum: 0, aCity: 0.4, rvHall: 0.1, rvOut: 0.6 });
  env(X + 60, {});
  spotLight({ p: [BENCH - 0.4, 3.2, 0.8], t: [BENCH, 0.8, -0.3], c: 0xffcf96, i: 3.2, a: 0.62, d: 9 });       // 头顶的吊灯
  const inspL = spotLight({ p: [INSP, 1.62, -0.2], t: [INSP, 0.7, -0.3], c: 0xe8f4ff, i: 9, a: 0.4, pen: 0.5, d: 3 });   // 检验光：冷白、很亮、只照一小块
  pointLight({ p: [X + 1.0, 2.4, -1.4], c: 0xffb070, i: 1.6, d: 6 });

  // 进度：step 0 等着修 / 1 灯亮了，等着凿 / 2 凿好了，等着取 / 3 收进包里了。t 这一步开始以后过了多久（做动作的时候用）
  const S = { step: 0, act: 0, t: 0, cut: 0, power: 0, insp: 0, look: 0, took: false };
  let V = null;
  const nearB = () => Math.abs(P.x - STAND) < 0.9 && P.y < 0.3;
  usable({ x: STAND, r: 0.9, can: () => !S.act && S.step < 3, on() { S.act = S.step + 1; S.t = 0; ctl = false; } });
  hint(() => state === 'play' && nearB() && !S.act && S.step === 0, '按 <b>E</b> 修灯');
  hint(() => state === 'play' && nearB() && !S.act && S.step === 1, '按 <b>E</b> 凿记号');
  hint(() => state === 'play' && nearB() && !S.act && S.step === 2, '按 <b>E</b> 取下来');
  Object.assign(sfx, {
    tap: () => { hit(3400, 4, 0.09, 0.04); hit(1200, 2, 0.06, 0.06); tone(2400, 2300, 0.02, 0.05, 'square'); },
    contact: () => { hit(2200, 3, 0.1, 0.04); tone(420, 380, 0.05, 0.08, 'square'); },
  });

  function* build(R) {
    const v = {};
    // 后墙：旧灰泥，架子上一排排灯泡；一扇侧窗；输送带从后墙的洞里进来
    backdrop(X - 3, DOOR + 1, -0.5, 5.5, -2.7, 40, g => {
      setInk(g, '#3b3025'); box(g, X - 3, -0.5, DOOR - X + 4, 6);
      g.fillStyle = 'rgba(0,0,0,.25)'; for (let x = X - 2.6; x < DOOR; x += 1.9) box(g, x, -0.5, 0.06, 6);
      setInk(g, '#231b14'); for (const y of [1.5, 2.15, 2.8]) box(g, X - 1.8, y, 3.4, 0.07);            // 架子
      for (const y of [1.5, 2.15, 2.8]) for (let x = X - 1.6; x < X + 1.5; x += 0.24) { g.fillStyle = '#1c1611'; disc(g, x, y - 0.13, 0.075); box(g, x - 0.035, y - 0.05, 0.07, 0.05); }
      setInk(g, '#120d09'); box(g, BENCH - 1.4, 0.95, 3.2, 0.5);                                         // 输送带进来的墙洞
      setInk(g, '#2a2119'); box(g, X + 6.2, 1.5, 1.4, 1.5); setInk(g, '#0b0d12'); box(g, X + 6.3, 1.6, 1.2, 1.3);   // 侧窗，外面是夜
      setInk(g, '#4a3a2c'); for (let y = 2.4; y < 2.9; y += 0.08) box(g, X + 6.25, y, 1.3, 0.05);        // 卷起来的卷帘
    }, { fog: false });
    yield;
    // 工作台：在走道后面，台面和孩子胸口差不多高；检测灯座的臂从台子上伸到走道上方
    const wood = lam(0x5a4532), dark = lam(0x241c15);
    add(R, bx(2.6, 0.08, 0.9), wood, BENCH + 0.9, 0.8, -0.75); for (const [dx, dz] of [[-0.35, -0.35], [2.1, -0.35], [-0.35, -1.15], [2.1, -1.15]]) add(R, bx(0.08, 0.8, 0.08), dark, BENCH + dx, 0.4, -0.75 + dz + 0.4);
    add(R, bx(0.06, 0.72, 0.06), MAT.steel, BENCH + 0.12, 1.2, -0.4); add(R, bx(0.06, 0.06, 0.5), MAT.steel, BENCH + 0.12, 1.55, -0.15);
    tube(R, [[BENCH + 0.12, 1.55, 0.08], [BENCH + 0.05, 1.4, 0.06], [FIX.x, 1.12, FIX.z]], 0.018, MAT.steel, 10);
    v.fix = grp(R, FIX.x, FIX.y, FIX.z); add(v.fix, cy(0.05, 0.055, 0.1, 16), MAT.dark, 0, 0.06, 0); add(v.fix, cy(0.06, 0.06, 0.02, 16), MAT.steel, 0, 0.005, 0);
    v.fixLamp = unlit(0x3a1a10); add(v.fix, new THREE.SphereGeometry(0.014, 8, 6), v.fixLamp, 0.06, 0.07, 0.03, false);   // 接点上的小灯
    // 检验灯：一只罩子，底下一束冷光
    v.insp = grp(R, INSP, 1.62, -0.2); add(v.insp, cy(0.05, 0.13, 0.12, 16), MAT.steel, 0, 0, 0); add(R, bx(0.04, 0.9, 0.04), MAT.steel, INSP + 0.05, 1.2, -0.7); add(R, bx(0.04, 0.04, 0.5), MAT.steel, INSP + 0.05, 1.65, -0.45);
    v.inspGlow = glow(v.insp, 0xe8f4ff, 0.5, 0.8, 0, -0.07, 0);
    const len = 0.95, geo = new THREE.ConeGeometry(0.24, len, 20, 1, true); geo.translate(0, -len / 2, 0);   // 尖朝上、口朝下：从灯罩往下照
    const cone = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: beamGradTex(), color: 0xdfeeff, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
    cone.material.userData.own = true; cone.position.y = -0.06; v.insp.add(cone);
    // 筐里待修的坏灯：就在检验光底下，灰的，照着也不亮
    add(R, new THREE.CylinderGeometry(0.2, 0.16, 0.18, 14, 1, true), lam(0x6a5a40, { side: THREE.DoubleSide }), INSP + 0.16, 0.93, -0.5);
    for (const [dx, dz, rz] of [[-0.07, -0.05, 2.6], [0.07, 0.03, 2.2], [0.0, 0.08, 3.0], [0.1, -0.07, 1.9]]) { const b = makeBulb(R, null, { glow: 0 }); b.g.position.set(INSP + 0.16 + dx, 0.99, -0.5 + dz); b.g.rotation.z = rz; }
    // 錾子和小锤
    v.chisel = grp(R, BENCH + 0.6, 0.86, -0.4); add(v.chisel, cy(0.006, 0.008, 0.11, 6), MAT.steel, 0, 0.055, 0, false); add(v.chisel, cy(0.011, 0.011, 0.07, 8), wood, 0, 0.13, 0, false);
    v.chisel.rotation.z = Math.PI / 2;
    // 输送带：从墙洞里出来，横在台子后面，几只坏灯慢慢地挪过去
    add(R, bx(3.4, 0.12, 0.42), MAT.dark, BENCH + 0.3, 1.02, -1.55); for (let x = BENCH - 1.3; x < BENCH + 2; x += 0.5) add(R, cy(0.05, 0.05, 0.44, 8), MAT.steel, x, 1.02, -1.55).rotation.x = Math.PI / 2;
    v.belt = [0, 1, 2].map(i => { const b = makeBulb(R, null, { glow: 0 }); b.g.rotation.z = Math.PI / 2; b.g.position.set(0, 1.14, -1.55); return { b, o: i * 1.15 }; });
    // 周转箱、凳子、墙边的布
    mkCrate(R, { x: X + 1.6, y1: 0, w: 0.7, h: 0.5 }, 'wood').position.z = -1.4;
    add(R, cy(0.16, 0.18, 0.46, 10), dark, STAND - 0.9, 0.23, -0.9);
    // 门：一面墙、一扇往上升的门；门外是夜
    add(R, bx(0.5, 40, 6), lam(0x3b3025), DOOR, 22.6, -3.2); add(R, bx(0.5, 2.6, 2.4), lam(0x3b3025), DOOR, 2.6 + 1.3 + 0.1, 0);
    v.door = mkGateDoor(R, door, { depth: 2.0, mat: lam(0x4a3a2a), band: lam(0x2a2018) });
    v.out = glow(R, 0x6070a0, 2.2, 0, DOOR + 0.6, 1.3, 0.1);
    // 前景：一根柱子、几根垂下来的电线
    backdrop(X - 3, DOOR + 3, -1, 6, 4.5, 20, g => { setInk(g, '#050404'); box(g, X + 2.7, -1, 0.35, 7); for (let x = X - 2; x < DOOR + 2; x += rr(2.5, 4)) cable(g, x, 5.4, x + rr(1.5, 3), 5.4, rr(0.6, 1.1), 0.05); }, { fog: false, blur: 1.6, order: 4000 });
    V = v;
  }

  function update(dt) {
    const here = P.x > X - 6 && P.x < DOOR + 4;
    if (!here) return;
    CARRY.bag = true;
    if (!CARRY.bulb) CARRY.bulb = makeBulb(scene, 'square', { glow: 0.12 });
    const dir = P.facing, near = dir > 0 ? 1 : 0, far = 1 - near;
    S.t += dt; const t = S.t;
    // 灯泡还挂在检测灯座上的时候（第三下取下来以后就归包管）
    if (S.step < 2 || (S.step === 2 && S.act !== 3)) { CARRY.state = 'set'; CARRY.at = FIX; }
    CARRY.power = S.power;
    CARRY.bulb && CARRY.bulb.cut(S.cut);
    // 检验光照着灯泡的程度：灯泡离光柱中心多近
    const b = CARRY.bulb, bx_ = b ? b.g.position.x : 0, by_ = b ? b.g.position.y : 0;
    S.insp = CARRY.state === 'out' && CARRY.wrap < 0.3 ? sstep(0.22, 0.06, Math.abs(bx_ - INSP)) * sstep(0.45, 0.9, by_) : 0;
    CARRY.excite = S.insp;
    let pose = null;
    if (S.act === 1) {                                         // 修灯：两手伸到灯座上，按下接点、拨正部件；灯亮了
      P.facing = 1; P.x = damp(P.x, STAND, 8, dt);
      const k = sstep(0, 0.4, t) * (1 - sstep(1.6, 2.0, t)), wob = 0.02 * Math.sin(t * 13);
      pose = { hands: [null, null] }; pose.hands[1] = { x: FIX.x - 0.03, y: FIX.y + 0.03 + wob, k }; pose.hands[0] = { x: FIX.x - 0.06, y: FIX.y - 0.08, k: k * sstep(0.3, 0.6, t) };
      if (t > 0.7 && t - dt <= 0.7) fx('contact');
      if (t > 1.1 && t - dt <= 1.1) { fx('ok'); }
      S.power = sstep(1.05, 1.35, t);
      if (t > 2.1) { S.act = 0; S.step = 1; ctl = true; }
    } else if (S.act === 2) {                                  // 凿记号：錾子抵在金属套上，一下一下地敲，记号一点点凿开、光漏出来；凿完镜头推到灯跟前
      P.facing = 1; P.x = damp(P.x, STAND, 8, dt);
      const k = sstep(0, 0.4, t) * (1 - sstep(2.6, 3.0, t)), tap = Math.max(0, Math.sin(t * 14)) * sstep(0.5, 0.7, t) * (1 - sstep(2.3, 2.5, t));
      pose = { hands: [null, null] }; pose.hands[1] = { x: FIX.x - 0.075, y: FIX.y - 0.03, k }; pose.hands[0] = { x: FIX.x - 0.14 - 0.04 * tap, y: FIX.y + 0.02 + 0.05 * tap, k };
      if (t > 0.5 && t < 2.4 && Math.floor(t * 14 / 6.2832) !== Math.floor((t - dt) * 14 / 6.2832)) { fx('tap'); sparkAt(FIX.x - 0.04, FIX.y - 0.03); }
      S.cut = sstep(0.55, 2.35, t);
      if (V) { const hb = hero.B.traveler?.bones.get('RightHand')?.node; if (hb && k > 0.2) { hb.getWorldPosition(_cv[0]); V.chisel.position.set(_cv[0].x + 0.04, _cv[0].y + 0.02, _cv[0].z); V.chisel.rotation.set(0, 0, -1.25); } }
      S.look = sstep(2.4, 3.0, t) * (1 - sstep(5.4, 6.2, t));            // 推近：看清灯头上漏光的方框
      if (t > 6.4) { S.act = 0; S.step = 2; ctl = true; if (V) { V.chisel.position.set(BENCH + 0.6, 0.86, -0.4); V.chisel.rotation.set(0, 0, Math.PI / 2); } }
    } else if (S.act === 3) {                                  // 取下来：只剩余光 → 举到检验光底下，骤亮；筐里的坏灯不亮 → 包好，收进包里
      if (t < 0.6) { P.facing = 1; pose = { hands: [null, null] }; pose.hands[1] = { x: FIX.x - 0.03, y: FIX.y - 0.15, k: sstep(0, 0.4, t) }; S.power = 1 - sstep(0.35, 0.5, t); }
      if (t > 0.5 && !S.took) { S.took = true; CARRY.state = 'out'; CARRY.holdAt = { x: FIX.x - 0.05, y: FIX.y - 0.2 }; CARRY.wrap = 0; S.power = 0; fx('contact'); }
      if (t > 0.6 && t < 1.5) { autoDir = P.x < INSP - 0.34 ? 1 : 0; CARRY.holdAt = { x: P.x + 0.24, y: 0.82 }; }
      if (t > 1.5 && t < 3.3) { autoDir = 0; P.facing = 1; CARRY.holdAt = { x: lerp(P.x + 0.24, INSP - 0.03, sstep(1.5, 2.0, t)), y: lerp(0.82, 1.06, sstep(1.5, 2.0, t)) }; }
      if (t > 3.3 && !CARRY.act && CARRY.state === 'out') carryStart('in');
      if (t > 3.3 && CARRY.state === 'bag' && !CARRY.act) { S.act = 0; S.step = 3; ctl = true; STORY.bulb = true; door.want = 1; fx('ok'); }
      S.look = sstep(1.8, 2.2, t) * (1 - sstep(3.4, 3.9, t)) * 0.6;
    }
    if (pose) HX.pose = pose;
    // 推近的镜头：对着检测灯座 / 检验灯
    if (S.look > 0.001) { const fx_ = S.act === 3 ? INSP - 0.1 : FIX.x, fy = S.act === 3 ? 1.0 : FIX.y - 0.06, d = lerp(9.4, S.act === 3 ? 4.2 : 2.5, S.look);
      camOvr = { d, yo: lerp(1.2, fy - P.y, S.look), xo: lerp(0.4, fx_ - P.x - cam.look, S.look) }; }
    inspL.on = 1;
    // 走出门：黑一下，到机房门口
    if (state === 'play' && S.step === 3 && P.x > DOOR + 0.9) fadeOut(() => { startChapter(OLD + 13, { keepBulb: true }); }, 1.2);
    const v = V; if (!v) return;
    v.fixLamp.color.setHex(S.power > 0.5 ? 0x9cff9a : 0x3a1a10);
    v.door.sync(door); v.out.material.opacity = 0.5 * door.open;
    for (const B_ of v.belt) { const x = BENCH - 1.2 + ((T * 0.18 + B_.o) % 3.3); B_.b.g.position.x = x; B_.b.g.visible = x < BENCH + 1.9; }
  }
  // 錾子敲下去的火星：几颗很小的亮点，一闪就灭
  const sparks = [];
  function sparkAt(x, y) { if (!V) return; for (let i = 0; i < 3; i++) { const s = glow(scene, 0xffd9a0, 0.05, 0.9, x, y, 0.08); sparks.push({ s, vx: rr(-0.6, 0.3), vy: rr(0.2, 1.1), t: 0 }); } }
  function stepSparks(dt) { for (let i = sparks.length - 1; i >= 0; i--) { const p = sparks[i]; p.t += dt; p.vy -= 4 * dt; p.s.position.x += p.vx * dt; p.s.position.y += p.vy * dt; p.s.material.opacity = 0.9 * (1 - p.t / 0.35); if (p.t > 0.35) { scene.remove(p.s); p.s.material.dispose(); sparks.splice(i, 1); } } }
  function reset() {
    Object.assign(S, { step: 0, act: 0, t: 0, cut: 0, power: 0, insp: 0, look: 0, took: false }); setGate(door, 0);
    if (CARRY.bulb) CARRY.bulb.cut(0);
    CARRY.state = 'set'; CARRY.at = FIX; CARRY.act = null; CARRY.holdAt = null; CARRY.wrap = 0; STORY.bulb = false;
  }
  function solve() { Object.assign(S, { step: 3, act: 0, t: 0, cut: 1, power: 0, insp: 0, look: 0, took: true }); setGate(door, 1); if (CARRY.bulb) CARRY.bulb.cut(1); }
  return defZone({ n: OLD + 12, vis: [X - 6, DOOR + 6], build, update(dt) { update(dt); stepSparks(dt); }, reset, solve, unbuild() { V = null; }, S, door });
})();
