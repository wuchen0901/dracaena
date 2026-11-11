
// ============================================================
//  第七章 · 管理花园：让野地重新得到水
//  系统修出来的“生态”：标准树列一模一样，枝叶剪成同一个高度；旁边那片不在规划里的野地干得开裂。
//  一台修剪机不停地剪掉一根挡住镜头的藤。
//  把倒在地上的树枝沿着压痕推到机械臂下面 → 刀片卡住，藤长上去，把维护门撑开 →
//  转动旧阀门，把一部分水从标准树列引到野地 → 野花和灌木慢慢长起来，盖住地面传感器 → 通往中继站的闸门打开
// ============================================================
const CH7 = (() => {
  const X = X7, ARM = X + 31.0, DOOR = X + 34.4, VALVE = X + 41, SENSOR = X + 56, GATE = X + 61.5, W0 = X + 46.5, W1 = X + 60;
  const C = chapter({ n: 7, x0: X + 0.5, start: X + 3, name: '管理花园', sub: '让野地重新得到水' });
  terrain([X8, 0]);
  ground(X + 2, 0x4c5540); ground(X + 44.5, 0x4c5540); ground(X + 47, 0x7b6d51); ground(X + 60, 0x7b6d51); ground(X + 64, 0x556040); ground(X8 - 4, 0x556040);
  const branch = pushable({ id: 'branch', x: X + 21.5, w: 1.7, h: 0.5, min: X + 20.4, max: X + 30.4, grip: 0.72 });
  const door = gate({ id: 'door7', x: DOOR, w: 0.6, h: 3.4, T: 4 });
  const relay = gate({ id: 'relay7', x: GATE, w: 0.8, h: 3.6, T: 1.8 });
  // jam 刀片卡住了 / vine 藤长到哪（0..1）/ valve 阀门有没有拨向野地 / g 野地的植物长到哪（0..1）
  const S = { jam: false, snipT: 0, snip: 0, vine: 0.15, valve: 0, vk: 0, g: 0, cat: 0 };
  usable({ id: 'valve', x: VALVE, r: 1.0, on() { S.valve = 1 - S.valve; fx('valve'); } });
  checkpoint(X + 3); checkpoint(X + 24); checkpoint(DOOR + 2.6); checkpoint(GATE + 2.5); checkpoint(X + 100);
  camKeys([X + 2, 19, 1.8, 0], [X + 16, 20, 2.2, 1], [X + 28, 20.5, 2.5, 1.5], [X + 38, 19.5, 2.0, 0.5], [X + 50, 20.5, 2.1, 1.5], [GATE + 1, 19.5, 1.9, 0.5], [X + 78, 23, 2.8, 3], [X + 100, 20, 2.0, 0], [X8 - 3, 18.5, 1.8, -1.2]);
  env(X + 62, {});
  // 走出花园已是黄昏：太阳落到身后
  env(X + 92, { fog: 0xd6b98c, fogD: 0.007, hemiS: 0xffe9c8, hemiG: 0x4f4a38, hemiI: 0.95, keyC: 0xffc98e, keyI: 2.2, keyDir: [-0.74, 0.3, -0.5], rimI: 0.3, dustC: 0xffe2b8, dustO: 0.4, wind: -0.5,
    sky: [0x33414f, 0x66717a, 0xb09a88, 0xe6b184, 0xf3c48c, 0xa77f60], sunX: -0.38, sunY: 0.05, sunP: 1, sunC: 0xffe2b0, cloud: 1, cloudC: 0xffd9b4, birds: 0.3 });
  env(X8 - 1.5, {});

  hint(() => !S.jam && Math.abs(P.x - branch.x) < 2.6 && P.y < 0.5 && P.mode !== 'push', '按住 <b>E</b> 推这根树枝 —— 地上的压痕通向机械臂下面');
  hint(() => !S.jam && P.x > ARM - 1 && P.x < DOOR && P.mode !== 'push', '修剪机一刻不停地剪那根藤。得有什么东西卡住它的刀片');
  hint(() => S.jam && door.open < 0.9 && P.x > ARM - 3 && P.x < DOOR, '刀片卡住了。藤在往门上长');
  hint(() => S.g < 1 && !S.valve && Math.abs(P.x - VALVE) < 1.6, '按 <b>E</b> 转动旧阀门');
  hint(() => S.g < 1 && !S.valve && P.x > SENSOR - 4 && P.x < GATE, '地面传感器还在扫 —— 旁边这片野地一滴水也分不到');
  hint(() => S.g < 1 && S.valve && P.x > W0 - 2 && P.x < GATE, '水在往野地里流。等它们长起来');

  const armL = pointLight({ p: [ARM - 0.3, 3.2, 0.2], c: 0xdfeef2, i: 4, d: 7, dec: 2 });
  const sensL = pointLight({ p: [SENSOR, 0.7, 0.4], c: 0xff3a22, i: 3, d: 6, dec: 2 });
  const ringL = pointLight({ p: [X + 84, 2.2, -7], c: 0x9fd6ff, i: 9, d: 14, dec: 1.6 });

  let V = null;
  const VPTS = [[X + 31.25, 0], [X + 31.4, 0.7], [X + 31.9, 1.5], [X + 32.7, 2.2], [X + 33.4, 2.75], [X + 34.0, 3.2], [X + 34.5, 3.45], [X + 35.1, 3.2]];   // 藤从水泥缝里一路长到门顶
  function* build(R) {
    const v = {}, gy = groundY;
    backdrop(X - 60, X8 + 70, -6, 70, -150, 6, g => {     // 远山
      setInk(g, vgrad(g, 44, 0, '#a9b3a2', '#869180')); ridge(g, X - 60, X8 + 70, -6, x => 22 + 9 * Math.sin(x / 31) + 4 * Math.sin(x / 11 + 2) + rr(-0.5, 0.5), 1.5);
      setInk(g, vgrad(g, 26, 0, '#8d9a86', '#6f7c6b')); ridge(g, X - 60, X8 + 70, -6, x => 11 + 6 * Math.sin(x / 19 + 1) + 2.6 * Math.sin(x / 6.3) + rr(-0.6, 0.6), 1.2);
    }, { fog: false, order: -2000, fadeL: 44, fadeR: 44 });
    yield;
    backdrop(X - 10, X8 + 20, -4, 34, -40, 13, g => {     // 中景：左半边是一排排一模一样的标准树，右半边是自己长的林子
      setInk(g, '#56644f'); ridge(g, X - 10, X8 + 20, -4, x => 1 + rr(0, 0.8), 2);
      for (let x = X - 8; x < X + 62; x += 4.2) tree(g, x, 0.6, 12, 'trim');
      for (let x = X + 66; x < X8 + 18; x += rr(2.6, 5.5)) tree(g, x, 0.5, rr(11, 20), rnd() < 0.3 ? 'pine' : 'round');
      for (let x = X - 6; x < X + 62; x += 14) { box(g, x, 0, 0.3, 17); box(g, x - 0.5, 17, 1.3, 0.5); }           // 架着镜头的高杆
    }, { fadeL: 8, fadeR: 12 });
    yield;
    backdrop(X - 6, X8 + 8, -3, 20, -9, 20, g => {        // 近一层：剪得笔直的树篱和标准树；野地之后是没人管的灌木
      setInk(g, '#2f3a2c');
      box(g, X - 6, -3, 50, 4.6);                          // 树篱：一条直线
      for (let x = X - 4; x < X + 44; x += 5.2) tree(g, x, 1.4, 8.5, 'trim');
      ridge(g, X + 44, X + 62, -3, x => 0.35 + rr(0, 0.25), 0.7);
      for (const x of [X + 48.5, X + 53, X + 58.6]) tree(g, x, 0.2, rr(3.5, 5.5), 'dead');
      ridge(g, X + 62, X8 + 8, -3, x => 0.8 + 0.6 * Math.sin(x / 2.9) + rr(0, 0.9), 0.8);
      for (let x = X + 64; x < X8 + 6; x += rr(3, 7)) { if (rnd() < 0.45) tree(g, x, 0.4, rr(6, 12), 'round'); else for (let k = 0; k < 5; k++) disc(g, x + rr(-1.2, 1.2), 1.4 + rr(0, 1), rr(0.7, 1.4)); }
      grass(g, X + 62, X8 + 6, () => 0.7, 0.4, 1.3, 500);
    }, { fadeL: 4, fadeR: 6 });
    yield;
    backdrop(X - 4, X8 + 2, -3, 10, 6, 22, g => {         // 前景：花园里的草剪得齐齐的；出了门就长得乱了
      setInk(g, '#040607');
      const top = [[X - 4, -5]];
      for (let x = X - 4; x <= X8 + 2; x += rr(0.4, 1.2)) { const wild = x > X + 62 ? 1 : 0, h = wild ? rr(0.3, 0.7) : 0.42; top.push([x, h]); if (wild && rnd() < 0.6) top.push([x + 0.05, h + rr(0.3, 1.2)], [x + 0.13, h]); }
      top.push([X8 + 2, -5]); poly(g, top);
      for (const x of [X + 13.5, X + 44.6]) { box(g, x, -3, 0.26, 13); disc(g, x + 0.13, 9.2, 1.9); }               // 近处两棵标准树
    }, { fog: false, blur: 2.2, order: 4000 });
    yield;

    // 滴灌管：沿着标准树列的一根细管，隔一段一个滴头
    add(R, cy(0.05, 0.05, 46, 6), MAT.steel, X + 20, 0.3, -2.3).rotation.z = Math.PI / 2;
    v.drips = []; for (let x = X + 2; x < X + 42; x += 4.2) { add(R, cy(0.03, 0.03, 0.3, 5), MAT.dark, x, 0.15, -2.3, false); v.drips.push(add(R, new THREE.SphereGeometry(0.035, 6, 5), unlit(0xbfe6f0, { fog: false }), x, 0.06, -2.2, false)); }
    // 修剪机：一根立柱、一条横臂、一只垂下来的刀头
    add(R, cy(0.12, 0.16, 3.6, 10), MAT.steel, ARM - 3.4, 1.8, -1.3); add(R, bx(3.9, 0.2, 0.2), MAT.steel, ARM - 1.55, 3.5, -1.3);
    tube(R, [[ARM - 3.4, 3.5, -1.3], [ARM - 0.2, 3.5, -1.3], [ARM, 3.3, -0.3]], 0.07, MAT.steel, 12);
    v.head = grp(R, ARM, 0.95, -0.15); add(v.head, cy(0.05, 0.05, 2.4, 6), MAT.dark, 0, 1.25, 0); add(v.head, bx(0.3, 0.26, 0.3), MAT.steel, 0, 0.12, 0);
    v.blades = [1, -1].map(sx => { const b = grp(v.head, 0, 0, 0.16); const m = add(b, bx(0.62, 0.07, 0.03), MAT.pale, sx * 0.3, 0, 0, false); m.rotation.z = sx * 0.08; return b; });
    v.armLamp = unlit(0xdfeef2, { fog: false }); add(R, new THREE.SphereGeometry(0.07, 8, 6), v.armLamp, ARM - 0.3, 3.3, -1.1, false);
    v.sparks = glow(R, 0xffd9a0, 1.2, 0, ARM, 0.9, 0.1);
    // 树枝（两头各翘着一截，正好当把手）和地上的压痕
    v.branch = grp(R, branch.x, 0, 0);
    add(v.branch, cy(0.2, 0.25, 1.7, 8), MAT.wood2, 0, 0.25, 0).rotation.z = Math.PI / 2;
    for (const sx of [-1, 1]) { add(v.branch, cy(0.05, 0.09, 0.62, 6), MAT.wood2, sx * 0.78, 0.6, 0.1).rotation.z = -sx * 0.25; add(v.branch, cy(0.03, 0.05, 0.4, 5), MAT.wood2, sx * 0.4, 0.5, -0.25).rotation.set(0.5, 0, sx * 0.7); }
    dragMarks(R, X + 21, ARM + 0.2, 0, 0, 0.2);
    // 维护门：门框上一只小镜头；水泥缝里那根藤
    for (const z of [-1.4, 1.4]) add(R, bx(0.5, 3.6, 0.24), MAT.steel, DOOR, 1.8, z);
    add(R, bx(0.5, 0.3, 3.0), MAT.steel, DOOR, 3.65, 0);
    v.door = add(R, bx(0.22, 3.4, 2.56), MAT.sheet, DOOR, 1.7, 0); for (const y of [-1, 0, 1]) add(v.door, bx(0.26, 0.1, 2.58), MAT.rust2, 0, y, 0, false);
    add(R, bx(0.4, 3.4, 30), lam(0x5c6156), DOOR, 1.7, -16.6);                                              // 围着花园的墙
    add(R, bx(0.26, 0.2, 0.3), MAT.dark, DOOR - 0.4, 3.3, 0.9); v.camLed = unlit(0xff3a2a, { fog: false }); add(R, new THREE.SphereGeometry(0.04, 6, 5), v.camLed, DOOR - 0.55, 3.32, 1.0, false);
    add(R, bx(0.5, 0.03, 1.4), MAT.dark, X + 31.25, 0.012, 0.1, false);                                      // 水泥缝
    v.vine = [];
    for (let i = 0; i < VPTS.length - 1; i++) {
      const a = V3(VPTS[i][0], VPTS[i][1], 0.25), b = V3(VPTS[i + 1][0], VPTS[i + 1][1], 0.25 + 0.1 * (i % 2)), len = a.distanceTo(b), g = grp(R, a.x, a.y, a.z);
      g.quaternion.setFromUnitVectors(V3(0, 1, 0), b.clone().sub(a).normalize());
      add(g, cy(0.035, 0.05, len, 6), MAT.leaf, 0, len / 2, 0);
      for (let k = 0; k < 3; k++) add(g, new THREE.SphereGeometry(0.11, 6, 5), k % 2 ? MAT.leaf2 : MAT.leaf, rr(-0.14, 0.14), len * (0.2 + 0.3 * k), rr(-0.14, 0.14)).scale.set(1.3, 0.5, 0.9);
      v.vine.push(g);
    }
    yield;
    // 旧阀门：标准树列的水管在这里分出一根生锈的支管，通向野地
    add(R, bx(0.5, 0.9, 0.5), MAT.steel, VALVE, 0.45, -0.9); add(R, cy(0.07, 0.07, 6, 8), MAT.rust, VALVE + 3, 0.5, -1.0).rotation.z = Math.PI / 2;
    tube(R, [[VALVE - 0.3, 0.3, -2.3], [VALVE - 0.2, 0.5, -1.4], [VALVE, 0.6, -0.95]], 0.05, MAT.steel, 10);
    v.wheel = grp(R, VALVE, 1.02, -0.6); add(v.wheel, new THREE.TorusGeometry(0.26, 0.035, 6, 18), lam(0xa0452e)); for (let i = 0; i < 3; i++) add(v.wheel, bx(0.5, 0.04, 0.04), lam(0xa0452e), 0, 0, 0, false).rotation.z = i * 1.047;
    add(R, cy(0.03, 0.03, 0.34, 6), MAT.dark, VALVE, 1.02, -0.76).rotation.x = Math.PI / 2;
    v.spout = add(R, bx(0.05, 0.5, 0.05), unlit(0xcfe6ee, { transparent: true, opacity: 0.75 }), W0 - 0.45, 0.25, -1.0, false);
    // 野地：干裂的地面；浇到水以后一片湿痕慢慢铺开，草、野花、灌木依次长出来
    decal(R, W0 - 0.6, W1 + 0.6, -6, 2.4, 0, 18, g => { g.strokeStyle = 'rgba(60,48,34,.5)'; g.lineWidth = 0.035; for (let i = 0; i < 70; i++) { let x = rr(W0, W1), z = rr(-5.6, 2.2); g.beginPath(); g.moveTo(x, z); for (let k = 0; k < 4; k++) { x += rr(-0.7, 0.7); z += rr(-0.6, 0.6); g.lineTo(x, z); } g.stroke(); } });
    v.wet = decal(R, W0 - 0.6, W1 + 0.6, -6, 2.4, 0.004, 10, g => { const gr = g.createLinearGradient(W0, 0, W1, 0); gr.addColorStop(0, 'rgba(52,62,40,.9)'); gr.addColorStop(0.85, 'rgba(58,66,42,.85)'); gr.addColorStop(1, 'rgba(58,66,42,0)'); g.fillStyle = gr; g.fillRect(W0 - 0.6, -6, W1 - W0 + 1.2, 8.4); }, { opacity: 0 });
    v.plants = [];
    const petal = [0xd9c36a, 0xc98fa6, 0xe6e0d0, 0x9fb7d8];
    for (let i = 0; i < 46; i++) {
      const x = rr(W0 + 0.4, W1 - 0.2), z = rr(-4.5, 1.6), bush = i < 9, g = grp(R, bush ? SENSOR + rr(-1.5, 1.5) : x, 0, bush ? rr(-1.5, -0.2) : z), at = bush ? 0.55 + 0.04 * i : rr(0.05, 0.75);
      if (bush) for (let k = 0; k < 4; k++) add(g, new THREE.SphereGeometry(rr(0.3, 0.5), 8, 6), k % 2 ? MAT.leaf : MAT.leaf2, rr(-0.4, 0.4), rr(0.25, 0.75), rr(-0.3, 0.3));
      else { const h = rr(0.25, 0.7); add(g, cy(0.012, 0.02, h, 4), MAT.leaf2, 0, h / 2, 0, false).rotation.z = rr(-0.2, 0.2); for (let k = 0; k < 3; k++) add(g, new THREE.ConeGeometry(0.03, h * rr(0.5, 0.9), 4), MAT.leaf, rr(-0.08, 0.08), h * 0.3, rr(-0.08, 0.08), false).rotation.z = rr(-0.5, 0.5);
        if (i % 3 === 0) add(g, new THREE.SphereGeometry(0.055, 6, 5), lam(petal[i % 4], { emissive: petal[i % 4], emissiveIntensity: 0.25 }), 0, h + 0.03, 0, false); }
      g.scale.setScalar(0.001); v.plants.push({ g, at });
    }
    // 地面传感器：一只矮桩，贴着地面来回扫一道红线；它连着通往中继站的闸门
    add(R, cy(0.09, 0.12, 0.55, 8), MAT.dark, SENSOR, 0.275, -0.9); v.sLed = unlit(0xff3a2a, { fog: false }); add(R, new THREE.SphereGeometry(0.06, 8, 6), v.sLed, SENSOR, 0.6, -0.85, false);
    v.scan = add(R, bx(0.05, 0.02, 3.4), unlit(0xff4030, { transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, fog: false, depthWrite: false }), SENSOR, 0.03, 0, false); v.scanGlow = glow(R, 0xff3a22, 1.1, 0.7, SENSOR, 0.62, -0.8);
    add(R, bx(0.5, 3.6, 30), lam(0x5c6156), GATE, 1.8, -16.6); add(R, bx(0.5, 3.6, 4), lam(0x5c6156), GATE, 1.8, 3.6);
    v.relay = mkGateDoor(R, relay, { mat: MAT.sheet, band: MAT.rust2 });
    v.rLamp = unlit(0xff3a2a, { fog: false }); add(R, new THREE.SphereGeometry(0.1, 10, 8), v.rLamp, GATE - 0.5, 3.95, 1.25, false); v.rGlow = glow(R, 0xff3a22, 1.6, 0.8, GATE - 0.55, 3.95, 1.3);
    yield;
    // 花园外的草地：半埋在土里的机械拱环，根缠在上面，里面透出一点冷光；远处是被藤缠住的中继塔
    for (const [x, r, z, t] of [[X + 80, 3.4, -8, 0.2], [X + 86.5, 2.6, -6.5, -0.3], [X + 93, 4.2, -10, 0.1]]) {
      const ring = add(R, new THREE.TorusGeometry(r, 0.28, 8, 28, Math.PI * 1.15), MAT.steel, x, -0.3, z); ring.rotation.set(0, t, -0.25);
      for (let i = 0; i < 5; i++) { const a = 0.3 + i * 0.6; add(R, cy(0.04, 0.07, 1.6, 5), MAT.wood2, x + Math.cos(a) * r, Math.sin(a) * r - 0.3, z + 0.25).rotation.z = a + rr(-0.5, 0.5); }
      glow(R, 0x9fd6ff, r * 1.5, 0.22, x, r * 0.4, z - 0.3);
    }
    add(R, cy(0.14, 0.3, 13, 8), MAT.dark, X + 70, 6.5, -16); add(R, bx(2.2, 0.2, 0.2), MAT.dark, X + 70, 12.6, -16); for (let i = 0; i < 6; i++) add(R, new THREE.SphereGeometry(rr(0.4, 0.8), 6, 5), MAT.leaf, X + 70 + rr(-0.5, 0.5), 2 + i * 1.7, -15.8);
    V = v;
  }

  function update(dt) {
    const near = Math.abs(P.x - (X + 45)) < 70;
    // 修剪机：每隔两秒半剪一刀。树枝垫在刀头下面的时候，下一刀就卡死了
    if (!S.jam && near) {
      S.snipT += dt; const k = S.snipT % 2.6; S.snip = k < 0.18 ? k / 0.18 : k < 0.5 ? 1 - (k - 0.18) / 0.32 : 0;
      S.vine = Math.min(0.26, S.vine + dt * 0.045);
      if (k < dt) { if (state === 'play') fx('snip', sstep(26, 4, Math.abs(P.x - ARM))); if (branch.x >= X + 30.15) { S.jam = true; S.snip = 0.55; fx('spark'); fx('powerDown'); } else S.vine = 0.12; }
    }
    if (S.jam) { S.vine = Math.min(1, S.vine + dt / 7.5); if (S.vine >= 0.999 && door.want === 0) { door.want = 1; fx('grow'); } }
    // 阀门可以来回拨；水流向野地的时候植物才长，长出来的不会缩回去
    S.vk = damp(S.vk, S.valve, 2.5, dt);
    if (S.valve && S.g < 1) { const was = S.g; S.g = Math.min(1, S.g + dt / 10); if (Math.floor(S.g * 5) !== Math.floor(was * 5)) fx('grow'); if (S.g >= 1) { STORY.wild = true; saveGame(); fx('ok'); } }
    relay.want = S.g >= 1 ? 1 : 0;
    const scanOn = S.g < 1 ? 1 : 0;
    armL.on = S.jam ? 0 : 1; sensL.on = scanOn * (0.6 + 0.4 * Math.sin(T * 6));
    if (near) { AUD.water = Math.max(AUD.water, 0.5 * S.vk * sstep(26, 4, Math.abs(P.x - W0))); AUD.hum = Math.max(AUD.hum, S.jam ? 0 : 0.02 * sstep(22, 4, Math.abs(P.x - ARM))); }
    // 走到拱环附近：小猫先停下来，朝那边看了一会儿
    if (STORY.cat && state === 'play') {
      if (S.cat === 0 && P.x > X + 76 && P.x < X + 82 && CAT.state === 'follow') { S.cat = 0.01; catHold(X + 79, 0, 'sit', 1); }
      else if (S.cat > 0 && S.cat < 9) { S.cat += dt; if (S.cat > 4 || P.x > X + 86) { S.cat = 9; catFollow(); } }
    }

    const v = V; if (!v) return;
    v.branch.position.x = branch.x;
    const jamA = S.jam ? 0.2 : 0;
    v.head.position.y = lerp(1.5, 0.78, S.jam ? 1 : sstep(0, 0.5, S.snip)) + (S.jam && S.vine < 0.5 ? 0.02 * Math.sin(T * 37) : 0);
    v.blades.forEach((b, i) => { b.rotation.z = (i ? -1 : 1) * lerp(0.75, jamA, S.jam ? 1 : S.snip); });
    v.armLamp.color.setHex(S.jam ? 0x2a2f30 : 0xdfeef2); v.sparks.material.opacity = S.jam && S.vine < 0.45 ? (Math.sin(T * 50) > 0.3 ? 0.9 : 0) : 0;
    const n = v.vine.length, L = S.vine * n;
    v.vine.forEach((g, i) => { const k = clamp(L - i, 0, 1); g.visible = k > 0.02; g.scale.set(0.6 + 0.4 * k, k, 0.6 + 0.4 * k); });
    v.door.position.y = 1.7 + sstep(0, 1, door.open) * 3.35; v.camLed.color.setHex(S.vine > 0.8 ? 0x2a1210 : 0xff3a2a);
    v.wheel.rotation.z = S.vk * 4.2; v.spout.visible = S.vk > 0.2;
    v.drips.forEach((m, i) => { m.visible = (T * 1.2 + i * 0.37) % 1 < lerp(0.5, 0.2, S.vk); });
    v.wet.material.opacity = sstep(0, 0.5, S.g);
    for (const p of v.plants) { const k = sstep(p.at, Math.min(1, p.at + 0.3), S.g * 1.05); p.g.scale.setScalar(Math.max(0.001, k)); p.g.rotation.z = 0.05 * Math.sin(T * 1.3 + p.at * 20) * k; }
    v.sLed.color.setHex(scanOn ? 0xff3a2a : 0x2a1210); v.scan.visible = !!scanOn; v.scanGlow.material.opacity = 0.7 * scanOn;
    v.scan.position.x = SENSOR + 4.6 * Math.sin(T * 1.6);
    v.relay.sync(relay); v.rLamp.color.setHex(scanOn ? 0xff3a2a : 0x2a1210); v.rGlow.material.opacity = 0.8 * scanOn;
  }
  function reset() { placeBox(branch, X + 21.5); setGate(door, 0); setGate(relay, 0); Object.assign(S, { jam: false, snipT: 0, snip: 0, vine: 0.15, valve: 0, vk: 0, g: 0, cat: 0 }); }
  function solve() { placeBox(branch, X + 30.4); setGate(door, 1); setGate(relay, 1); Object.assign(S, { jam: true, snipT: 0, snip: 0.55, vine: 1, valve: 1, vk: 1, g: 1, cat: 9 }); }
  return defZone({ n: 7, vis: [X - 6, X8 + 4], build, update, reset, solve, unbuild() { V = null; }, branch, door, relay, S });
})();
