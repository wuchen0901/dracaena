
// ============================================================
//  第四章 · 配给街：让镜头看不见
//  配给机前，拄杖的老人一伸手就亮起红色的拒绝信号；领到食物的工人想分他一半，可高处的监控镜头正对着他们 ——
//  光束扫过来，工人就把食物藏回身后。
//  把运输箱沿着滚痕拉到镜头立柱下面的标记上 → 跳上箱子，拉下垂着的绳头，遮阳布落下来罩住镜头 →
//  工人把食物放到老人手边；封锁门上和镜头连着的卷帘升起，再把箱子推过去当台阶翻过封锁门
// ============================================================
// 旧城：接近正午，铁灰色的薄霾（后面两章的街道也用这一套）
const CITY_ENV = { fog: 0xaeb5b4, fogD: 0.0085, hemiS: 0xeef2f1, hemiG: 0x4a4d4e, hemiI: 1.05, keyC: 0xfffaf0, keyI: 2.0, keyDir: [0.3, 0.9, -0.15], rimI: 0.2, dustC: 0xe8ecec, dustO: 0.3, wind: -0.4,
  sky: [0x7890a0, 0x9fb0b8, 0xc0c8c8, 0xd4d6d0, 0xdcdcd4, 0xa9aeac], sunX: -0.05, sunY: 0.5, sunP: 0.3, cloud: 0.8, cloudC: 0xf4f6f6,
  aWind: 0.45, aWhis: 0, aLeaf: 0, aBug: 0, aCity: 0.8, aFar: 0.7, aRoom: 0, aHum: 0, aDrip: 0, aFlow: 0, rvOut: 1, rvHall: 0.12, rvCave: 0, birds: 0 };   // 声音：楼群之间的风，城市很低的远声，远处的广播提示音、卷帘门、鸽子
const CH4 = (() => {
  const X = X4, KIOSK = X + 12, ELDER = X + 13.7, WORKER = X + 16.6, POLE = X + 24, MARK = X + 22.4, BARR = X + 37;
  const C = chapter({ n: 4, x0: X + 0.5, start: X + 3, name: '配给街', sub: '让镜头看不见' });
  C.ground = 'concrete';                                                           // 脚步声：路面；运输箱是铁的
  terrain([X5, 0]);
  ground(X + 4, 0x55585a); ground(X5 - 4, 0x4d5052);
  const crate = pushable({ id: 'crate4', x: X + 30, w: 1.2, h: 1.0, min: MARK, max: BARR - 0.6, snd: 'metal' });      // 往左最多拉到标记上（轮挡）
  const barr = solid({ id: 'barr', x1: BARR, x2: BARR + 0.9, y1: 0, y2: 3.0, noclimb: true, snd: 'concrete' });
  const shutter = gate({ id: 'shutter', x: BARR + 0.45, w: 0.9, h: 3.0, y0: 3.0, T: 2.2 });
  const S = { down: false, t: 0, bx: X + 15, hide: 0, deny: 3, pack: [0, 0, 0] };
  usable({ id: 'awning', x: MARK, r: 0.8, y0: 0.7, can: () => !S.down, on() { S.down = true; S.t = 0; STORY.fed = true; saveGame(); fx('cloth'); fx('servo'); } });
  checkpoint(X + 3); checkpoint(X + 27); checkpoint(BARR + 3);
  camKeys([X + 2, 19, 1.8, 0], [X + 10, 20, 2.2, 2.5], [X + 22, 21.5, 2.9, 0.5], [X + 32, 21, 2.6, 1.5], [BARR + 3, 19.5, 2.0, 0.5], [X5 - 2, 19, 1.8, 0]);
  env(X + 6, CITY_ENV); env(X5 - 8, {});

  hint(() => !S.down && P.y > 0.7 && Math.abs(P.x - MARK) < 0.8, '按 <b>E</b> 拉下遮阳布');
  hint(() => !S.down && crate.x <= MARK + 0.05 && P.x > MARK - 3 && P.x < MARK + 3 && P.y < 0.5 && P.mode !== 'push', '跳上箱子，够那截垂下来的绳头');
  hint(() => !S.down && crate.x > MARK + 0.05 && Math.abs(P.x - crate.x) < 2.4 && P.y < 0.5 && P.mode !== 'push', '按住 <b>E</b> 把运输箱拉到镜头立柱下面的标记上');
  hint(() => !S.down && P.x > BARR - 2.6 && P.x < BARR && P.y < 1.2, '封锁门上的卷帘和那只监控镜头连着');
  hint(() => S.down && crate.x < BARR - 1 && P.x > MARK - 3 && P.x < BARR && Math.abs(P.x - crate.x) < 3 && P.y < 0.5 && P.mode !== 'push', '把箱子推到封锁门下面，踩着它翻过去');
  hint(() => S.down && crate.x >= BARR - 1 && P.x > BARR - 4 && P.x < BARR && P.y < 1.2 && P.mode !== 'push', '跳上箱子，再跳向封锁门的顶上');

  const camL = spotLight({ p: [POLE - 0.85, 4.9, -1.6], t: [X + 15, 0.4, 0], c: 0xe2eef2, i: 5.5, d: 22, a: 0.14, pen: 0.5 });
  const kioskL = pointLight({ p: [KIOSK + 0.5, 1.9, -0.6], c: 0xff3a22, i: 2.5, d: 5, dec: 2 });

  let V = null;
  function* build(R) {
    const v = {};
    // 远景：一片高楼的残影和架在空中的旧轨道
    backdrop(X - 60, X5 + 70, -6, 80, -150, 6, g => {
      setInk(g, vgrad(g, 66, 0, '#b3b9b9', '#8e9496'));
      for (let x = X - 58; x < X5 + 68; x += rr(5, 10)) building(g, x, -6, rr(5, 12), rr(18, 66), { holes: 0.38, gx: 2.6, gy: 3.6, win: 1.1, winH: 1.5, base: 8 });
      line(g, [[X - 60, 33], [X5 + 70, 31]], 0.7); for (let x = X - 56; x < X5 + 70; x += 13) box(g, x, -6, 1.2, 38);
    }, { fog: false, order: -2000, fadeL: 44, fadeR: 44 });
    yield;
    // 中景：街对面的楼
    backdrop(X - 14, X5 + 20, -4, 44, -44, 13, g => {
      setInk(g, '#6f7678');
      for (let x = X - 12; x < X5 + 18; x += rr(9, 15)) { const w = rr(8, 13); building(g, x, -4, w, rr(16, 40), { holes: 0.5, gx: 2.4, gy: 3.3 }); }
      for (let x = X - 10; x < X5 + 18; x += rr(16, 26)) cable(g, x, rr(14, 20), x + rr(10, 18), rr(12, 18), rr(1, 3), 0.08);
    }, { fadeL: 8, fadeR: 12 });
    yield;
    // 近处的一排楼面：底层的卷帘门、招牌、管线，窗洞镂空
    backdrop(X - 6, X5 + 10, -3, 30, -9, 20, g => {
      setInk(g, '#3d4244');
      let x = X - 5;
      while (x < X5 + 8) {
        const w = rr(7, 12), h = rr(11, 26); building(g, x, -3, w, h + 3, { holes: 0.55, gx: 2.1, gy: 3.0, base: 7.4 });
        for (let d = x + 1; d < x + w - 2.2; d += rr(2.6, 4)) { g.clearRect(d, 0.2, 1.7, 2.7); setInk(g, '#2c3032'); for (let y = 0.4; y < 2.8; y += 0.4) box(g, d, y, 1.7, 0.12); setInk(g, '#3d4244'); }   // 卷帘门
        box(g, x + rr(0.5, w - 4), 3.4, rr(2, 3.4), 0.9); box(g, x + w - 0.5, 0, 0.3, h); line(g, [[x + 1.2, 4.6], [x + 1.2, h]], 0.14);
        x += w + (rnd() < 0.3 ? rr(1.5, 3.5) : 0);
      }
      for (let i = 0; i < 9; i++) { const xx = rr(X, X5); cable(g, xx, rr(8, 12), xx + rr(6, 12), rr(8, 12), rr(0.6, 1.6), 0.06); }
    }, { fadeL: 4, fadeR: 6 });
    yield;
    backdrop(X - 6, X5 + 10, -1, 30, -8.9, 9, g => {       // 零星几扇还亮着的窗
      for (let i = 0; i < 16; i++) { const x = rr(X - 2, X5 + 6), y = rr(7.5, 20); g.fillStyle = `rgba(200,225,235,${rr(0.25, 0.6)})`; box(g, x, y, 0.9, 1.2); }
    }, { additive: true, fog: false, blur: 2, order: -30 });
    backdrop(X - 4, X5 + 6, -3, 10, 6, 22, g => {         // 前景
      setInk(g, '#040607');
      const top = [[X - 4, -5]];
      for (let x = X - 4; x <= X5 + 6; x += rr(0.5, 1.6)) { const h = rr(0.15, 0.5); top.push([x, h]); if (rnd() < 0.16) top.push([x + 0.05, h + rr(0.3, 1.1)], [x + 0.14, h]); }
      top.push([X5 + 6, -5]); poly(g, top);
      for (const x of [X + 6.5, X + 44]) { box(g, x, -3, 0.34, 13); box(g, x - 1.4, 8.4, 3, 0.2); }
      for (let x = X; x < X5; x += rr(10, 18)) cable(g, x, 10, x + rr(7, 13), 10, rr(1.4, 2.4), 0.08);
    }, { fog: false, blur: 2.2, order: 4000 });
    yield;

    // 路面：褪色的车道线
    decal(R, X, X5, -4.2, 2.6, 0, 12, g => { g.fillStyle = 'rgba(190,196,196,.22)'; for (let x = X + 1; x < X5; x += 5.2) g.fillRect(x, -1.6, 2.4, 0.14); g.fillStyle = 'rgba(190,196,196,.12)'; g.fillRect(X, 2.2, X5 - X, 0.12); });
    // 配给机：一只立柜，取物口上方一盏信号灯；机顶的牌子写着规则
    add(R, bx(1.1, 2.4, 0.8), MAT.wall2, KIOSK, 1.2, -1.5); add(R, bx(0.74, 0.5, 0.1), MAT.dark, KIOSK + 0.05, 1.05, -1.06);
    add(R, bx(1.3, 0.12, 1.0), MAT.steel, KIOSK, 2.46, -1.5);
    v.kLamp = unlit(0x4a1410, { fog: false }); add(R, new THREE.SphereGeometry(0.09, 10, 8), v.kLamp, KIOSK + 0.3, 1.9, -1.06, false);
    v.kGlow = glow(R, 0xff3a22, 1.4, 0, KIOSK + 0.3, 1.9, -1.0);
    plate(R, textTex('配给\n仅限登记劳工', { w: 256, h: 128, size: 40, color: '#dfe6e4' }), 1.5, 0.75, KIOSK, 3.05, -1.4, 0xb9c2c0, { fog: true, order: 1 });
    add(R, bx(1.66, 0.9, 0.08), MAT.dark, KIOSK, 3.05, -1.46);
    // 监控立柱、镜头，和卷在它上方的遮阳布
    v.cam = mkCamPole(R, POLE, 0, -1.6, 5.2, { dir: -1, len: 13, ang: 0.12 });
    add(R, cy(0.03, 0.03, 4.2, 5), MAT.dark, POLE - 0.9, 5.95, -1.2, false).rotation.z = Math.PI / 2;                 // 挑出来的横杆
    v.roll = add(R, cy(0.15, 0.15, 2.5, 10), MAT.cloth, POLE - 0.9, 5.74, -1.2); v.roll.rotation.z = Math.PI / 2;
    v.cloth = grp(R, POLE - 0.9, 5.7, -1.02);
    const clothM = lam(0x9a927a, { emissive: 0x9a927a, emissiveIntensity: 0.28, side: THREE.DoubleSide });
    add(v.cloth, new THREE.PlaneGeometry(2.5, 2.1), clothM, 0, -1.05, 0); add(v.cloth, new THREE.PlaneGeometry(2.5, 2.1), clothM, 0, -1.05, -1.1);
    add(v.cloth, bx(2.54, 0.07, 0.07), MAT.wood2, 0, -2.1, 0, false);
    v.rope = add(R, cy(0.016, 0.016, 3.1, 5), MAT.pale, MARK + 0.1, 4.1, -0.9, false); v.knot = add(R, new THREE.SphereGeometry(0.06, 8, 6), MAT.pale, MARK, 2.55, -0.9, false);
    // 地上的标记：一个方框和两只轮挡；滚痕从箱子一直通到这里
    decal(R, MARK - 1.2, MARK + 1.2, -0.9, 0.9, 0, 40, g => { g.strokeStyle = 'rgba(215,205,150,.6)'; g.lineWidth = 0.07; g.strokeRect(MARK - 0.72, -0.62, 1.44, 1.24); g.setLineDash([0.16, 0.12]); g.strokeRect(MARK - 0.9, -0.8, 1.8, 1.6); });
    for (const z of [-0.45, 0.45]) add(R, bx(0.2, 0.12, 0.26), MAT.rust, MARK - 0.74, 0.06, z).rotation.z = -0.5;
    dragMarks(R, MARK, X + 30.4, 0, 0, 0.43);
    v.crateG = mkCrate(R, crate, 'steel');
    // 封锁门：一道水泥墩墙，上面是和镜头连着的卷帘
    const conc = lam(0x676a63);
    add(R, bx(0.9, 3.0, 34), conc, BARR + 0.45, 1.5, -14.4); add(R, bx(0.96, 0.1, 34.04), MAT.pale, BARR + 0.45, 3.0, -14.4, false);
    for (const z of [-1.5, 1.5]) add(R, bx(0.5, 3.4, 0.24), MAT.steel, BARR + 0.45, 4.7, z);
    add(R, bx(0.7, 0.4, 3.3), MAT.steel, BARR + 0.45, 6.4, 0);
    v.shut = add(R, bx(0.34, 3.0, 2.76), MAT.sheet, BARR + 0.45, 4.5, 0); for (let y = -1.3; y < 1.4; y += 0.3) add(v.shut, bx(0.38, 0.05, 2.78), MAT.rust2, 0, y, 0, false);
    v.sLamp = unlit(0xff3a2a, { fog: false }); add(R, new THREE.SphereGeometry(0.1, 10, 8), v.sLamp, BARR - 0.02, 6.4, 1.2, false); v.sGlow = glow(R, 0xff3a22, 1.6, 0.8, BARR - 0.1, 6.4, 1.25);
    tube(R, [[POLE, 5.2, -1.6], [POLE + 4, 6.6, -1.7], [POLE + 9, 6.2, -1.7], [BARR + 0.3, 6.5, -1.2]], 0.03, MAT.dark);     // 从镜头连到卷帘的线
    yield;
    v.elder = makeNPC('E', R, { x: ELDER, z: -0.55, facing: -1 }); yield;
    v.worker = makeNPC('W', R, { x: WORKER, z: -0.5, facing: -1 });
    v.pack = add(R, bx(0.24, 0.15, 0.17), lam(0xcfd3c4, { emissive: 0xcfd3c4, emissiveIntensity: 0.15 }), WORKER, 1, -0.3);
    V = v;
  }

  function update(dt) {
    const near = Math.abs(P.x - (X + 20)) < 46;
    // 镜头：在两个人和箱子之间来回扫；被布罩住以后只能对着布乱转
    S.bx = X + 15.5 + 7.5 * Math.sin(T * 0.5);
    const blind = S.down ? sstep(0.1, 0.9, S.t) : 0;
    if (S.down) { S.t += dt; if (S.t > 1.3) shutter.want = 1; }
    barr.noclimb = shutter.open < 0.9;
    camL.on = 1 - blind; camL.t[0] = S.bx;
    if (!S.down && Math.abs(S.bx - P.x) < 1.4 && P.y < 2.2 && near) HX.alert = Math.max(HX.alert, 0.35);     // 光束扫过 07：它的灯慌了一下
    if (near) { AUD.hum = Math.max(AUD.hum, (1 - blind) * 0.03 * sstep(30, 6, Math.abs(P.x - POLE))); AUD.humF = 70; }
    // 配给机：老人每隔一阵伸一次手，亮起红色的拒绝信号
    S.deny -= dt; if (S.deny < -1.3) S.deny = S.t > 5 ? 1e9 : 6.5;
    const reach = S.deny < 0 ? Math.sin(Math.PI * clamp(-S.deny / 1.3, 0, 1)) : 0, red = S.deny < -0.45 && S.deny > -1.2 ? 1 : 0.18;
    if (near && state === 'play' && S.deny < -0.45 && S.deny + dt >= -0.45) fx('deny');
    kioskL.on = red;
    // 工人：光束离得远才敢把食物递出去；扫近了就藏到身后
    S.hide = damp(S.hide, !S.down && Math.abs(S.bx - WORKER) < 4.2 ? 1 : 0, 5, dt);

    const v = V; if (!v) return;
    v.crateG.position.x = crate.x;
    v.kLamp.color.setHex(red > 0.5 ? 0xff5a3a : 0x4a1410); v.kGlow.material.opacity = red > 0.5 ? 0.9 : 0.12;
    v.cam.power(1 - blind); v.cam.alert(0);
    if (!S.down) v.cam.aim(S.bx, 0.5, 0); else v.cam.aim(POLE - 3 + 2 * Math.sin(T * 2.3), 2.6 + 1.2 * Math.sin(T * 1.7), 0);
    const drop = S.down ? sstep(0, 0.8, S.t) : 0;
    v.cloth.scale.y = lerp(0.04, 1, drop); v.cloth.rotation.z = 0.03 * Math.sin(T * 1.3) * drop; v.roll.scale.setScalar(lerp(1, 0.45, drop)); v.roll.scale.y = 1;
    v.rope.position.y = 4.1 - 0.9 * drop; v.knot.position.y = 2.55 - 0.9 * drop;
    v.shut.position.y = 4.5 + sstep(0, 1, shutter.open) * 2.9;
    const lampOn = 1 - blind; v.sLamp.color.setHex(lampOn > 0.5 ? 0xff3a2a : 0x2a1210); v.sGlow.material.opacity = 0.8 * lampOn;
    if (!near) return;
    // 两个人的表演
    const E_ = v.elder, Wk = v.worker, t = S.t, eu = 1.46, wu = 1.62;
    let pk;                                               // 食物现在在哪
    if (!S.down) {
      E_.facing = -1; E_.pose = { bow: 0.22, reach: reach > 0.02 ? { x: KIOSK + 0.45, y: 1.1, i: 1, k: reach } : { x: E_.x - 0.27 * eu, y: 0.62 * eu, i: 0, k: 1 } };
      if (reach > 0.02) E_.pose.arms = [{ a: 0.5, b: 0.5 }];
      Wk.x = WORKER; Wk.facing = -1; Wk.vx = 0;
      Wk.pose = { arms: [S.hide > 0.5 ? { a: -0.55, b: 0.25 } : { a: 0.95, b: 0.7 }], look: S.hide > 0.5 ? 0.9 : 0 };
      pk = S.hide > 0.5 ? [Wk.x + 0.2, 0.93, -0.72] : [Wk.x - 0.4, 1.08, -0.3];
      for (let i = 0; i < 3; i++) S.pack[i] = damp(S.pack[i], pk[i], 9, dt);
    } else {
      // 布落下来以后：工人走过去，把食物放到老人手边；老人弯腰拿起来
      if (t < 1.0) { Wk.pose = { arms: [{ a: 0.95, b: 0.7 }], look: 0.6 }; pk = [Wk.x - 0.4, 1.08, -0.3]; }
      else if (t < 3.4) { Wk.walkTo(ELDER + 1.15, 0.9, dt); Wk.pose = { arms: [{ a: 0.95, b: 0.7 }] }; pk = [Wk.x - 0.4, 1.08, -0.3]; }
      else if (t < 4.6) { const k = sstep(3.4, 4.2, t); Wk.vx = 0; Wk.pose = { bow: 0.75 * k, reach: { x: ELDER + 0.55, y: 0.2, i: 0, k } }; pk = [lerp(Wk.x - 0.4, ELDER + 0.55, k), lerp(1.08, 0.08, k), -0.3]; }
      else { if (t < 6.2) Wk.walkTo(ELDER + 1.9, 0.8, dt); else { Wk.vx = 0; Wk.facing = -1; } Wk.pose = { look: t > 6.6 && t < 9 ? 0.9 : 0, nod: t > 6.6 && t < 7.4 ? 0.2 * Math.sin((t - 6.6) * 8) : 0 }; pk = [ELDER + 0.55, 0.08, -0.3]; }
      if (t > 4.9) {
        const k = sstep(4.9, 5.7, t), up = sstep(5.9, 6.7, t); E_.facing = 1;
        E_.pose = { bow: 0.22 + 0.6 * k * (1 - up), reach: { x: ELDER + 0.5, y: lerp(0.2, 0.95, up), i: 1, k }, arms: [{ a: 0.5, b: 0.55 }] };
        if (t > 5.8) pk = [ELDER + lerp(0.55, 0.36, up), lerp(0.08, 0.98, up), -0.4];
      } else E_.pose = { bow: 0.22, reach: { x: E_.x - 0.27 * eu, y: 0.62 * eu, i: 0, k: 1 } };
      for (let i = 0; i < 3; i++) S.pack[i] = pk[i];
    }
    v.pack.position.set(S.pack[0], S.pack[1], S.pack[2]);
    E_.step(dt); Wk.step(dt);
  }
  function reset() { placeBox(crate, X + 30); setGate(shutter, 0); barr.noclimb = true; Object.assign(S, { down: false, t: 0, hide: 0, deny: 3, pack: [WORKER - 0.4, 1.08, -0.3] }); }
  function solve() { placeBox(crate, BARR - 0.6); setGate(shutter, 1); barr.noclimb = false; Object.assign(S, { down: true, t: 60, hide: 0, deny: 1e9, pack: [ELDER + 0.36, 0.98, -0.4] }); }
  return defZone({ n: 4, vis: [X - 6, X5 + 6], build, update, reset, solve, unbuild() { V = null; }, crate, shutter, S });
})();
