
// ============================================================
//  第八章 · 生态中枢：分配最后的能源
//  中枢里只有一路电，三样负载：居民水泵、监控网、野地灌溉。前面三段都没有惩罚，只是让玩家看清电是怎么换手的：
//    一 · 扳一下开关，电从监控换到水泵，被监控锁着的门就开了；
//    二 · 推动导电桥，它停在哪块触点上电就送到哪里 —— 这扇卡死的门要靠灌溉让门边的藤长起来顶开；
//    三 · 两只导电桥、三块触点：让监控熄灭、水泵有电，通往核心的门才开。
//  核心里是最后一块电池：推进左边的维修座，07 得到修复，带着小猫离开，中枢照旧运转；
//  推进右边的区域配电盘，附近的灯逐个亮起，水流进野地，07 的灯慢慢暗下去，小猫留在它身边
// ============================================================
const CH8 = (() => {
  const X = X8, D1 = X + 20, D2 = X + 44, D3 = X + 70, EX = X + 96, DOCK = X + 79, SOCK_L = X + 80.65, SOCK_R = X + 90.4, OUT = X + 98.2;
  const C = chapter({ n: 8, x0: X + 0.5, start: X + 4, name: '生态中枢', sub: '分配最后的能源' });
  terrain([EX + 2.1, 0], [X + 104, 0.4], [X + 116, 1.6], [X + 126, 2.4], [X + 140, 2.6], [X + 220, 2.6]);
  ground(X - 0.2, 0x556040); ground(X + 0.2, 0x1e282e); ground(EX + 0.6, 0x1e282e); ground(EX + 1, 0x3f4636); ground(X + 220, 0x3f4636);
  const P2 = [X + 28, X + 32.7, X + 37.4], P3 = [X + 52, X + 57, X + 62];                 // 第二段触点：监控 / 水泵 / 灌溉；第三段：监控 / 灌溉 / 水泵
  const b2 = pushable({ id: 'bridge2', x: P2[0], w: 0.9, h: 0.8, min: P2[0], max: P2[2], grip: 0.7 });
  const c1 = pushable({ id: 'bridge3a', x: P3[0], w: 0.9, h: 0.8, min: P3[0], max: P3[2], grip: 0.7 });
  const c2 = pushable({ id: 'bridge3b', x: P3[1], w: 0.9, h: 0.8, min: P3[0], max: P3[2], grip: 0.7 });
  c1.hi = () => c2.x - 1.15; c2.lo = () => c1.x + 1.15;                                     // 两只桥在同一条轨上，互相越不过去
  const batt = pushable({ id: 'last', x: X + 85.5, w: 0.9, h: 0.8, min: SOCK_L, max: SOCK_R, grip: 0.7 });
  const d1 = gate({ id: 'd81', x: D1, w: 0.6, h: 3.4, T: 1.6 }), d2 = gate({ id: 'd82', x: D2, w: 0.6, h: 3.4, T: 3 }), d3 = gate({ id: 'd83', x: D3, w: 0.6, h: 3.4, T: 1.8 }), d4 = gate({ id: 'd84', x: EX, w: 0.9, h: 3.6 });
  // 三段各自的负载状态：eye 监控 / drop 水泵 / leaf 灌溉
  const S = { eye1: true, lv: 0, st: [{ eye: 1, drop: 0, leaf: 0 }, { eye: 1, drop: 0, leaf: 0 }, { eye: 1, drop: 0, leaf: 1 }], v2: 0, open2: false, k: [[1, 0, 0], [1, 0, 0], [1, 0, 1]] };
  // 结局：choice 1 修复 / 2 旁路；t 选了以后过了多久；t2 走出中枢以后过了多久
  const END = { choice: 0, t: 0, t2: 0, energy: 0.54, sit: 0, night: 0, shown: false, lights: 0 };
  const near = (a, x) => Math.abs(a - x) < 0.3;

  usable({ id: 'sw1', x: X + 12, r: 1.0, on() { S.eye1 = !S.eye1; fx('lever'); fx(S.eye1 ? 'deny' : 'ok'); } });
  checkpoint(X + 4); checkpoint(D1 + 2.5); checkpoint(D2 + 2.5); checkpoint(D3 + 3);
  camKeys([X + 0.6, 18, 1.7, -1.0], [X + 3.5, 17.5, 1.7, 2.4], [X + 10, 19, 2.0, 1], [X + 30, 20, 2.2, 1], [X + 56, 20.5, 2.2, 1], [D3 + 2, 19.5, 2.0, 0.5], [X + 84, 21, 2.3, 0],
    [EX - 2.5, 19, 1.9, -1.8], [EX + 0.4, 18, 1.7, -1.2], [EX + 3.5, 17, 1.6, 2.5], [X + 110, 24, 2.6, 5], [X + 124, 30, 4.2, 7], [X + 140, 32, 4.6, 8]);
  const HUB = { fog: 0x1b2730, fogD: 0.028, hemiS: 0x9fc4d6, hemiG: 0x16202a, hemiI: 0.6, keyC: 0xcfe8ff, keyI: 0.8, keyDir: [0.2, 1, 0.3], rimC: 0x9fd0e8, rimI: 0.7, dustC: 0xcfe6f2, dustO: 0.4, wind: 0.03, ext: 0, sunP: 0, cloud: 0, birds: 0 };
  env(X - 0.05, HUB); env(EX + 0.7, {});
  // 走出中枢：天快黑了
  env(EX + 2.1, { fog: 0x8a7f86, fogD: 0.006, hemiS: 0xd9c8d6, hemiG: 0x3a3840, hemiI: 0.8, keyC: 0xffb48a, keyI: 1.3, keyDir: [-0.8, 0.22, -0.5], rimC: 0xa9cdd8, rimI: 0.35, dustC: 0xffd9c0, dustO: 0.3, wind: -0.4, ext: 1,
    sky: [0x232c44, 0x4a4f6c, 0x8c7488, 0xd29a86, 0xeab08a, 0x7a6660], sunX: -0.42, sunY: 0.0, sunP: 0.8, sunC: 0xffc9a0, stars: 0.25, cloud: 0.8, cloudC: 0xe9b9a8 });
  env(X + 220, {});
  const NIGHT = { fog: new THREE.Color(0x1c2536), hemiS: new THREE.Color(0x8fa6c8), hemiG: new THREE.Color(0x141a22), keyC: new THREE.Color(0xa9c4e6), dustC: new THREE.Color(0xbfd0e6),
    sky: [0x0a1020, 0x121b30, 0x1c2a42, 0x2a3a52, 0x3a4a5e, 0x1a2430].map(hex3) };
  function nightfall(E_) {                               // 旁路结局：天慢慢黑下来，星星和萤火虫出来
    const k = END.night; if (k <= 0) return;
    for (const f of ['fog', 'hemiS', 'hemiG', 'keyC', 'dustC']) E_[f].lerp(NIGHT[f], k);
    for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) E_.sky[i][j] = lerp(E_.sky[i][j], NIGHT.sky[i][j], k);
    E_.hemiI = lerp(E_.hemiI, 0.8, k); E_.keyI = lerp(E_.keyI, 0.55, k); E_.sunP *= 1 - k; E_.stars = lerp(E_.stars, 1, k); E_.cloud *= 1 - 0.7 * k; E_.flies = k; E_.fogD = lerp(E_.fogD, 0.009, k);
  }

  const inHub = () => P.x > X && P.x < EX;
  hint(() => inHub() && S.eye1 && Math.abs(P.x - (X + 12)) < 1.6, '按 <b>E</b> 扳动开关');
  hint(() => inHub() && S.eye1 && P.x > D1 - 3 && P.x < D1, '门被监控锁着 —— 回头看看那只开关把电送去了哪里');
  hint(() => inHub() && !S.open2 && Math.abs(P.x - b2.x) < 2.4 && P.mode !== 'push', '按住 <b>E</b> 推动导电桥 —— 它停在哪块触点上，电就送到哪里');
  hint(() => inHub() && !S.open2 && S.st[1].leaf && P.x > D2 - 9 && P.x < D2, '花槽里有水了。藤在长');
  hint(() => inHub() && !S.open2 && P.x > D2 - 3.4 && P.x < D2, '这扇门卡死了。门边的花槽是干的');
  hint(() => inHub() && d3.want === 0 && P.x > D3 - 3.4 && P.x < D3, '这扇门要两样：监控熄灭，水泵有电');
  hint(() => inHub() && d3.want === 0 && P.x > P3[0] - 2.5 && P.x < P3[2] + 2 && P.mode !== 'push', '两只导电桥在同一条轨上，谁也越不过谁');
  hint(() => inHub() && !END.choice && Math.abs(P.x - batt.x) < 2.6 && P.mode !== 'push', '最后一块电池 —— 左边是 07 的维修座，右边是区域配电盘');

  for (const x of [X + 8, X + 16, X + 32, X + 57, X + 85]) spotLight({ p: [x + 1, 9, 2.5], t: [x, 0.3, -0.5], c: 0xcfe6f2, i: 2.8, a: 0.34 });
  const dockL = pointLight({ p: [DOCK, 1.6, 0.2], c: 0xdff3ff, i: 6, d: 7, dec: 1.8, on: 0.25 });
  const panL = pointLight({ p: [X + 91.6, 2.2, 0.2], c: 0x9fe0ff, i: 6, d: 8, dec: 1.8, on: 0.25 });
  const outL = pointLight({ p: [EX - 1.0, 1.5, 0.5], c: 0xffc0a0, i: 12, d: 16, dec: 1.3, on: 0 });

  let V = null;
  // 一块显示三样负载的屏：三个图标灯 + 一幅会动的简图。draw(k, t) 里 k = [监控, 水泵, 灌溉] 各自通电的程度
  function mkPanel(R, x, y, z, w = 4.2) {
    const [c, g] = mkCanvas(384, 112), tex = canvasTex(c), mat = new THREE.MeshBasicMaterial({ map: tex, fog: false }); mat.userData.own = true;
    const h = w * 112 / 384; add(R, bx(w + 0.3, h + 1.1, 0.12), MAT.dark, x, y + 0.3, z - 0.08, false);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.position.set(x, y, z); R.add(m);
    const lamps = ['eye', 'drop', 'leaf'].map((kind, i) => mkIconLamp(R, kind, 0.42, x + (i - 1) * w / 3, y + h / 2 + 0.42, z, kind === 'eye' ? 0xff6a50 : kind === 'drop' ? 0x8fd8ff : 0xa8e08a));
    let last = -1, grow = 0;
    return { draw(k, t) {
      lamps.forEach((l, i) => l.on(k[i])); grow = clamp(grow + (k[2] > 0.5 ? 0.012 : -0.004), 0, 1);
      if (t - last < 0.09) return; last = t;
      g.fillStyle = '#0d151a'; g.fillRect(0, 0, 384, 112); g.lineWidth = 2.5; g.lineCap = 'round';
      const ink = (on, col) => { g.strokeStyle = g.fillStyle = on > 0.5 ? col : '#33414a'; };
      // 监控：一只镜头扫过三个小人，给他们打上“可以 / 不可以”的记号
      ink(k[0], '#ff7a5c'); g.beginPath(); g.rect(18, 14, 26, 14); g.stroke();
      const sx = 34 + 60 * (0.5 + 0.5 * Math.sin(t * 1.4)) * (k[0] > 0.5 ? 1 : 0.4);
      g.globalAlpha = k[0] > 0.5 ? 0.35 : 0.1; g.beginPath(); g.moveTo(34, 28); g.lineTo(sx - 14, 96); g.lineTo(sx + 14, 96); g.closePath(); g.fill(); g.globalAlpha = 1;
      for (let i = 0; i < 3; i++) { const px = 32 + i * 30; g.beginPath(); g.arc(px, 78, 5, 0, 6.2832); g.moveTo(px, 83); g.lineTo(px, 98); g.stroke(); if (k[0] > 0.5) { g.beginPath(); if (i === 1) { g.moveTo(px - 4, 62); g.lineTo(px + 4, 70); g.moveTo(px + 4, 62); g.lineTo(px - 4, 70); } else { g.moveTo(px - 4, 66); g.lineTo(px - 1, 70); g.lineTo(px + 5, 62); } g.stroke(); } }
      // 水泵：水龙头滴水，水槽里的水涨起来
      ink(k[1], '#9fe0ff'); g.beginPath(); g.moveTo(150, 22); g.lineTo(196, 22); g.lineTo(196, 36); g.moveTo(162, 22); g.lineTo(162, 96); g.stroke();
      g.beginPath(); g.rect(176, 74, 46, 22); g.stroke();
      if (k[1] > 0.5) { for (let i = 0; i < 3; i++) { const yy = 40 + ((t * 60 + i * 13) % 36); g.beginPath(); g.arc(196, yy, 2.4, 0, 6.2832); g.fill(); } g.globalAlpha = 0.5; g.fillRect(178, 84, 42, 11); g.globalAlpha = 1; }
      // 灌溉：几株苗，有水就慢慢长
      ink(k[2], '#b4ea94'); g.beginPath(); g.moveTo(268, 96); g.lineTo(368, 96); g.stroke();
      for (let i = 0; i < 4; i++) { const px = 282 + i * 24, hh = 8 + 44 * grow * (0.6 + 0.4 * ((i * 37) % 5) / 5); g.beginPath(); g.moveTo(px, 96); g.lineTo(px, 96 - hh); g.stroke(); if (hh > 18) { g.beginPath(); g.ellipse(px + 6, 96 - hh * 0.6, 6, 3, -0.5, 0, 6.2832); g.ellipse(px - 6, 96 - hh * 0.8, 6, 3, 0.5, 0, 6.2832); g.fill(); } }
      tex.needsUpdate = true;
    } };
  }
  function mkBridge(parent, o) {                         // 导电桥：一只小车，顶上横着一根铜排
    const g = grp(parent, o.x, 0, 0);
    add(g, bx(0.86, 0.1, 0.72), MAT.dark, 0, 0.12, 0); add(g, bx(0.7, 0.42, 0.5), MAT.hub2, 0, 0.4, 0); add(g, bx(0.9, 0.09, 0.2), MAT.copper, 0, 0.66, 0);
    for (const sx of [-1, 1]) { add(g, bx(0.06, 0.5, 0.2), MAT.copper, sx * 0.42, 0.36, 0); add(g, bx(0.05, 0.05, 0.56), MAT.steel, sx * 0.44, 0.78, 0, false); add(g, bx(0.04, 0.2, 0.04), MAT.steel, sx * 0.44, 0.7, 0.26, false); add(g, bx(0.04, 0.2, 0.04), MAT.steel, sx * 0.44, 0.7, -0.26, false); }
    return { g, glow: glow(g, 0x8fd8ff, 1.3, 0, 0, 0.3, 0.4) };
  }
  function mkPads(R, xs, kinds) {                        // 一排触点：地上的铜板 + 墙上的图标灯
    for (const z of [-0.24, 0.24]) add(R, bx(xs[xs.length - 1] - xs[0] + 1.4, 0.05, 0.06), MAT.steel, (xs[0] + xs[xs.length - 1]) / 2, 0.025, z, false);
    return xs.map((x, i) => { add(R, bx(0.9, 0.03, 0.74), MAT.copper, x, 0.03, 0, false); tube(R, [[x, 0.05, -0.4], [x, 0.3, -1.6], [x, 1.9, -2.0]], 0.03, MAT.dark, 8); return mkIconLamp(R, kinds[i], 0.5, x, 2.3, -1.95, kinds[i] === 'eye' ? 0xff6a50 : kinds[i] === 'drop' ? 0x8fd8ff : 0xa8e08a); });
  }
  function mkDoor(R, g, kinds) {                         // 一扇门，门楣上挂着它等的条件
    for (const z of [-1.4, 1.4]) add(R, bx(0.6, 3.6, 0.24), MAT.hub2, g.x, 1.8, z);
    add(R, bx(0.6, 0.3, 3.0), MAT.hub2, g.x, 3.65, 0);
    add(R, bx(0.5, 12, 30), MAT.hub, g.x, 6, -16.6); add(R, bx(0.5, 8.2, 3.2), MAT.hub, g.x, 7.9, 0);
    const m = add(R, bx(0.24, 3.4, 2.56), MAT.steel, g.x, 1.7, 0); for (const y of [-1, 0, 1]) add(m, bx(0.28, 0.08, 2.58), MAT.dark, 0, y, 0, false);
    return { m, lamps: kinds.map((k, i) => mkIconLamp(R, k, 0.4, g.x - 0.4, 4.2, (i - (kinds.length - 1) / 2) * 0.6 + 0.5, k === 'eye' ? 0xff6a50 : k === 'drop' ? 0x8fd8ff : 0xa8e08a)) };
  }
  function* build(R) {
    const v = {};
    // ---------------- 中枢内部 ----------------
    backdrop(X - 2, EX + 2, -2, 40, -26, 9, g => {         // 最远的墙：一道道竖着的冷光
      setInk(g, '#0f171c'); box(g, X - 2, -2, EX - X + 4, 42);
      for (let x = X + 2; x < EX; x += 5.5) { const gr = g.createLinearGradient(0, 26, 0, 2); gr.addColorStop(0, '#7fb4c8'); gr.addColorStop(1, '#1c2c34'); g.fillStyle = gr; box(g, x, 2, 0.5, 24); }
    });
    yield;
    backdrop(X - 2, EX + 2, -1, 22, -11, 18, g => {        // 一排排机柜
      setInk(g, '#0a1115');
      for (let x = X; x < EX; x += 3.1) { const h = 7 + 2 * ((x * 7) % 3); box(g, x, -1, 2.5, h + 1); for (let y = 0.6; y < h - 0.6; y += 0.5) g.clearRect(x + 0.3, y, 1.9, 0.07); }
      truss(g, X - 2, EX + 2, 13, 1.2, 0.1); for (let x = X + 3; x < EX; x += rr(6, 11)) cable(g, x, 13, x + rr(4, 8), 13, rr(1, 3), 0.07);
    });
    backdrop(X - 2, EX + 2, -1, 14, -10.9, 10, g => {      // 机柜上明灭的指示灯
      for (let i = 0; i < 420; i++) { g.fillStyle = rnd() < 0.15 ? 'rgba(255,120,90,.8)' : `rgba(150,220,245,${rr(0.3, 0.9)})`; box(g, X + rr(0, EX - X), rr(0.5, 8.5), 0.09, 0.05); }
    }, { additive: true, fog: false, order: -40 });
    yield;
    backdrop(X - 2, EX + 2, -1, 15, -3.2, 30, g => {       // 近处的立柱和线槽
      setInk(g, '#060b0e');
      for (const x of [X + 6, X + 24, X + 40, X + 48, X + 66, X + 75, X + 94]) { box(g, x - 0.35, -1, 0.7, 16); box(g, x - 0.6, -1, 1.2, 1.3); }
      box(g, X - 2, 6.6, EX - X + 4, 0.5); for (let x = X; x < EX; x += 2.2) box(g, x, 6.2, 0.1, 0.4);
    });
    backdrop(X - 2, EX + 0.6, -3, 10, 6, 22, g => {        // 前景
      setInk(g, '#030506'); const top = [[X - 2, -5]]; for (let x = X - 2; x <= EX + 0.6; x += rr(0.6, 1.8)) top.push([x, rr(0.12, 0.4)]); top.push([EX + 0.6, -5]); poly(g, top);
      for (let x = X; x < EX - 4; x += rr(9, 16)) cable(g, x, 10, x + rr(6, 12), 10, rr(1.4, 2.4), 0.1);
    }, { fog: false, blur: 2.2, order: 4000 });
    yield;
    // 入口：一面水泥墙上开着一个门洞。靠镜头这一侧是一整面黑墙，镜头穿过它时换成室内的光
    const conc = lam(0x5c6156);
    add(R, bx(1.4, 48, 30.7), conc, X + 0.7, 23, -16.65); add(R, bx(1.4, 44.4, 2.6), conc, X + 0.7, 3.6 + 22.2, 0); add(R, bx(1.4, 70, 40), MAT.black, X - 0.7, 30, 21.3, false);
    for (const z of [-1.32, 1.32]) add(R, bx(1.7, 3.7, 0.24), MAT.steel, X + 0.7, 1.85, z);
    for (let x = X + 5; x < EX; x += 5.5) add(R, bx(0.07, 0.012, 30), MAT.dark, x, 0.004, -8, false);
    yield;
    // 一 · 开关
    v.sw = mkLever(R, X + 12, 0, -0.6, { red: 0xff6a50, green: 0x8fd8ff });
    v.pan1 = mkPanel(R, X + 15.4, 2.6, -2.0); tube(R, [[X + 12, 0.9, -0.85], [X + 12.4, 3.4, -1.9], [X + 13.4, 3.5, -2.0]], 0.03, MAT.dark, 8);
    v.d1 = mkDoor(R, d1, ['eye']);
    // 二 · 一只导电桥，三块触点；门边一只干着的花槽和一根藤
    v.pads2 = mkPads(R, P2, ['eye', 'drop', 'leaf']); v.b2 = mkBridge(R, b2); v.pan2 = mkPanel(R, X + 40.6, 2.9, -2.0, 3.6);
    v.d2 = mkDoor(R, d2, ['leaf']);
    add(R, bx(1.6, 0.4, 0.6), MAT.hub2, D2 - 1.3, 0.2, -1.0); tube(R, [[P2[2], 1.9, -2.0], [D2 - 3, 0.5, -1.6], [D2 - 1.9, 0.3, -1.0]], 0.03, MAT.dark, 10);
    v.vine2 = [];
    for (let i = 0; i < 7; i++) { const g = grp(R, D2 - 1.3 + i * 0.16, 0.4 + i * 0.44, -1.0 + i * 0.13); g.rotation.z = -0.5 + 0.12 * i; add(g, cy(0.03, 0.045, 0.5, 5), MAT.leaf, 0, 0.25, 0); for (let k = 0; k < 2; k++) add(g, new THREE.SphereGeometry(0.1, 6, 5), k ? MAT.leaf2 : MAT.leaf, rr(-0.12, 0.12), 0.2 + 0.2 * k, rr(-0.1, 0.1)).scale.set(1.3, 0.5, 0.9); v.vine2.push(g); }
    yield;
    // 三 · 两只导电桥
    v.pads3 = mkPads(R, P3, ['eye', 'leaf', 'drop']); v.c1 = mkBridge(R, c1); v.c2 = mkBridge(R, c2); v.pan3 = mkPanel(R, X + 66.2, 2.9, -2.0, 3.4);
    v.d3 = mkDoor(R, d3, ['eye', 'drop']);
    yield;
    // 核心：左边是维修座，右边是区域配电盘，中间一条轨上是最后一块电池
    add(R, bx(2.2, 3.4, 0.5), MAT.hub2, DOCK - 0.4, 1.7, -1.5); add(R, bx(1.3, 2.3, 0.2), MAT.dark, DOCK - 0.4, 1.4, -1.22);
    v.clamps = [-1, 1].map(s => { const g = grp(R, DOCK - 0.4 + s * 0.62, 1.5, -1.05); add(g, bx(0.12, 0.9, 0.16), MAT.steel, 0, 0, 0.3); add(g, bx(0.12, 0.16, 0.5), MAT.steel, 0, 0, 0.05); return g; });
    v.dockLamp = glow(R, 0xdff3ff, 3.2, 0.2, DOCK - 0.4, 2.2, -1.0);
    add(R, bx(1.5, 0.82, 0.08), MAT.dark, DOCK - 0.4, 3.75, -1.2);
    plate(R, iconTex('bot'), 0.44, 0.44, DOCK - 0.9, 3.75, -1.14, 0xff6a50, { order: 1 }); plate(R, textTex('07\n维修期限已过', { w: 256, h: 128, size: 34, color: '#ffb8a6' }), 0.86, 0.43, DOCK - 0.12, 3.75, -1.14, 0xffffff, { order: 1 });
    add(R, bx(0.5, 1.0, 0.5), MAT.steel, SOCK_L - 0.7, 0.5, -0.45); v.sockL = unlit(0xff4a2a, { fog: false }); add(R, new THREE.SphereGeometry(0.06, 8, 6), v.sockL, SOCK_L - 0.7, 1.1, -0.18, false);
    plate(R, textTex('人工旁路', { w: 256, h: 72, size: 40, color: '#cfe0e6', worn: 9 }), 0.9, 0.25, SOCK_L - 0.7, 1.45, -0.6, 0x9fb0b6, { fog: true, order: 1 });
    for (const z of [-0.26, 0.26]) add(R, bx(SOCK_R - SOCK_L + 1.4, 0.05, 0.06), MAT.steel, (SOCK_L + SOCK_R) / 2, 0.025, z, false);
    v.batt = grp(R, batt.x, 0, 0);
    add(v.batt, bx(0.86, 0.1, 0.72), MAT.dark, 0, 0.12, 0); add(v.batt, bx(0.78, 0.5, 0.6), lam(0x3c4a44), 0, 0.43, 0); add(v.batt, bx(0.8, 0.07, 0.62), MAT.copper, 0, 0.36, 0, false); add(v.batt, bx(0.3, 0.08, 0.3), MAT.copper, 0, 0.72, 0);
    for (const sx of [-1, 1]) { add(v.batt, bx(0.04, 0.34, 0.5), MAT.steel, sx * 0.43, 0.6, 0, false); add(v.batt, bx(0.05, 0.05, 0.56), MAT.steel, sx * 0.43, 0.78, 0, false); }
    v.cells = [0, 1, 2].map(i => add(v.batt, bx(0.1, 0.07, 0.02), unlit(0x8fe6ff, { fog: false }), -0.16 + i * 0.16, 0.5, 0.31, false));
    add(R, bx(0.5, 1.0, 0.5), MAT.steel, SOCK_R + 0.7, 0.5, -0.45); v.sockR = unlit(0xff4a2a, { fog: false }); add(R, new THREE.SphereGeometry(0.06, 8, 6), v.sockR, SOCK_R + 0.7, 1.1, -0.18, false);
    v.pan4 = mkPanel(R, X + 92.4, 3.0, -1.9, 4.4);
    tube(R, [[SOCK_L - 0.7, 0.9, -0.7], [SOCK_L - 0.9, 1.4, -1.3], [DOCK + 0.2, 1.0, -1.3]], 0.07, MAT.dark, 10); tube(R, [[SOCK_R + 0.7, 0.9, -0.7], [SOCK_R + 1.2, 2.0, -1.5], [X + 92.4, 2.3, -1.9]], 0.07, MAT.dark, 10);
    // 出口：和第一章一样，一面墙、一扇闸门、镜头一侧的黑墙
    add(R, bx(1.4, 48, 30.7), MAT.hub, EX, 23, -16.65); add(R, bx(1.4, 44.4, 2.6), MAT.hub, EX, 3.6 + 22.2, 0); add(R, bx(1.4, 70, 40), MAT.black, EX + 1.4, 30, 21.3, false);
    v.d4 = mkGateDoor(R, d4);
    v.outGlow = new THREE.MeshBasicMaterial({ color: 0xffc8a8, transparent: true, opacity: 0, fog: false, depthWrite: false });
    add(R, new THREE.PlaneGeometry(2.44, 3.6), v.outGlow, EX + 0.62, 1.8, 0, false).rotation.y = -Math.PI / 2;
    yield;

    // ---------------- 中枢外面：一道缓坡，坡下是一片谷地 ----------------
    const gy = groundY;
    backdrop(EX - 30, X + 300, -8, 70, -150, 6, g => {     // 远山
      setInk(g, vgrad(g, 44, 0, '#6d6a80', '#4c4a5e')); ridge(g, EX - 30, X + 300, -8, x => 24 + 10 * Math.sin(x / 33) + 4 * Math.sin(x / 12 + 1) + rr(-0.5, 0.5), 1.5);
      setInk(g, vgrad(g, 26, 0, '#55546a', '#3c3b4e')); ridge(g, EX - 30, X + 300, -8, x => 10 + 6 * Math.sin(x / 21 + 2) + 2.6 * Math.sin(x / 6.7) + rr(-0.6, 0.6), 1.2);
    }, { fog: false, order: -2000, fadeL: 20 });
    yield;
    backdrop(EX + 2, X + 260, -10, 30, -52, 14, g => {     // 谷地：散落的房子、中继塔、一排排标准树，和没人管的林子
      setInk(g, '#2c2b38'); ridge(g, EX + 2, X + 260, -10, x => 1 + 1.6 * Math.sin(x / 13) + rr(0, 0.7), 2);
      for (let x = EX + 8; x < X + 256; x += rr(5, 11)) { const t = rnd(), y = 1 + 1.6 * Math.sin(x / 13); if (t < 0.4) { const w = rr(3, 6), h = rr(3, 7); box(g, x, y - 1, w, h + 1); poly(g, [[x - 0.4, y + h], [x + w / 2, y + h + rr(1, 2.4)], [x + w + 0.4, y + h]]); } else if (t < 0.7) tree(g, x, y - 0.4, rr(6, 12), 'round'); else for (let k = 0; k < 3; k++) tree(g, x + k * 3, y - 0.4, 8, 'trim'); }
      for (const x of [X + 132, X + 168, X + 204]) { line(g, [[x, 0], [x, 22]], 0.4); line(g, [[x - 2.4, 20], [x + 2.4, 20]], 0.3); }
    }, { fadeL: 4 });
    yield;
    backdrop(EX + 1.8, X + 230, -3, 14, -11, 26, g => {    // 近处的草坡和灌木
      setInk(g, '#16171c'); ridge(g, EX + 1.8, X + 230, -3, x => gy(x) + rr(-0.1, 0.4), 0.9);
      grass(g, EX + 2, X + 228, x => gy(x) - 0.1, 0.4, 1.2, 700);
      for (let x = EX + 6; x < X + 226; x += rr(5, 12)) for (let k = 0; k < 4; k++) disc(g, x + rr(-1, 1), gy(x) + 0.3 + rr(0, 0.7), rr(0.5, 1.1));
      for (const x of [X + 112, X + 150]) tree(g, x, gy(x) - 0.2, rr(7, 10), 'round');
    }, { fadeL: 2 });
    backdrop(EX + 1.6, X + 230, -3, 10, 6, 22, g => {
      setInk(g, '#040607'); const top = [[EX + 1.6, -5]];
      for (let x = EX + 1.6; x <= X + 230; x += rr(0.4, 1.2)) { const h = gy(EX + (x - EX) * 0.985 + 1) * 0.72 + rr(0.25, 0.6); top.push([x, h]); if (rnd() < 0.55) top.push([x + 0.05, h + rr(0.3, 1.1)], [x + 0.13, h]); }
      top.push([X + 230, -5]); poly(g, top);
    }, { fog: false, blur: 2.2, order: 4000 });
    yield;
    // 谷地里的灯：旁路结局里一盏一盏亮起来。帮过的人越多，亮的越多
    v.lamps = []; for (let i = 0; i < 26; i++) { const x = EX + 14 + i * 5.6 + rr(-2, 2), far = i % 3 === 0; v.lamps.push({ s: glow(R, i % 5 === 0 ? 0xcfeaff : 0xffd9a8, far ? 2.6 : 1.9, 0, x, (far ? 5 : 2.2) + rr(0, 2.5), far ? -70 : -51.5), at: 1.5 + i * 0.75 + rr(0, 0.5), tier: i % 4 }); }
    // 修复结局里还在扫的三束监控光
    v.beams = [X + 132, X + 168, X + 204].map(x => { const len = 34, geo = new THREE.ConeGeometry(Math.tan(0.1) * len, len, 20, 1, true); geo.translate(0, -len / 2, 0); geo.rotateX(-Math.PI / 2);
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: beamGradTex(), color: 0xd8ecf2, transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false })); m.position.set(x, 21, -52); m.renderOrder = 60; R.add(m); return m; });
    v.stream = add(R, bx(120, 0.05, 1.2), unlit(0x9fc8e0, { transparent: true, opacity: 0, fog: false }), X + 180, 0.4, -40, false);   // 流进野地的水
    v.sprout = grp(R, 0, 0, 0.3); add(v.sprout, cy(0.012, 0.018, 0.22, 5), MAT.leaf2, 0, 0.11, 0, false); for (const s of [-1, 1]) add(v.sprout, new THREE.SphereGeometry(0.05, 6, 5), MAT.leaf2, s * 0.05, 0.2, 0, false).scale.set(1.5, 0.4, 0.8);
    v.sprout.visible = false;
    V = v;
  }

  function choose(c) {
    END.choice = c; END.t = 0; batt.locked = true; STORY.ending = c; saveGame(); fx('dock');
    if (c === 1) { ctl = false; autoDir = 0; } else fx('powerUp');
  }
  function update(dt) {
    // ---- 三段线路 ----
    S.lv = damp(S.lv, S.eye1 ? 0 : 1, 6, dt);
    const s1 = S.st[0], s2 = S.st[1], s3 = S.st[2];
    s1.eye = S.eye1 ? 1 : 0; s1.drop = S.eye1 ? 0 : 1; s1.leaf = 0;
    s2.eye = near(b2.x, P2[0]) ? 1 : 0; s2.drop = near(b2.x, P2[1]) ? 1 : 0; s2.leaf = near(b2.x, P2[2]) ? 1 : 0;
    const on3 = x => near(c1.x, x) || near(c2.x, x) ? 1 : 0; s3.eye = on3(P3[0]); s3.leaf = on3(P3[1]); s3.drop = on3(P3[2]);
    S.st.forEach((s, i) => { const k = S.k[i], was = k[0] + k[1] * 2 + k[2] * 4; k[0] = s.eye; k[1] = s.drop; k[2] = s.leaf; if (state === 'play' && inHub() && was !== k[0] + k[1] * 2 + k[2] * 4 && i > 0) fx('dock'); });
    d1.want = S.eye1 ? 0 : 1;
    if (s2.leaf && !S.open2) { const was = S.v2; S.v2 = Math.min(1, S.v2 + dt / 3); if (Math.floor(S.v2 * 3) !== Math.floor(was * 3)) fx('grow'); if (S.v2 >= 1) { S.open2 = true; fx('ok'); } }
    d2.want = S.open2 ? 1 : 0;
    d3.want = !s3.eye && s3.drop ? 1 : 0;
    if (inHub()) AUD.buzz = 0.6;

    // ---- 最后的选择 ----
    if (!END.choice && state === 'play') { if (batt.x <= SOCK_L + 0.02) choose(1); else if (batt.x >= SOCK_R - 0.02) choose(2); }
    const E1 = END.choice === 1, E2 = END.choice === 2;
    if (END.choice) { END.t += dt; if (END.t > 0.9) batt.off = true; }                              // 电池滑进插座里，不再挡路
    const t = END.t;
    if (E1) {
      // 修复：07 自己走进维修座，夹具合上，灯一点点亮回来；然后门开了，它带着小猫离开
      if (t < 8.4) { ctl = false; autoDir = t > 0.8 && P.x > DOCK - 0.3 ? -1 : 0; if (t > 1.2 && autoDir === 0) P.facing = 1; }
      else if (state === 'play' && !ctl && P.x < EX + 20) { ctl = true; autoDir = 0; d4.want = 1; fx('ok'); }
      END.energy = lerp(0.54, 1.25, sstep(3.2, 7.6, t));
      if (t > 3 && t < 7.8) { HX.pose = { arms: [{ a: 0.2, b: 0.1 }, { a: 0.2, b: 0.1 }], look: 0 }; if (Math.floor(t * 2) !== Math.floor((t - dt) * 2)) fx('servo'); }
      if (state === 'play' && ctl && P.x > X + 122) { ctl = false; autoDir = 1; }                    // 走上坡顶：最后一段自己走完
      if (P.x > X + 122) { END.t2 += dt; if (P.x > X + 133) autoDir = 0; if (END.t2 > 6 && !END.shown) { END.shown = true; state = 'end'; showEnd('结局 · 修复', '07 带着小猫离开了。<br>中枢照旧运转：水泵、镜头和修剪机，仍然只为算得清的生命工作。'); } }
    } else if (E2) {
      // 旁路：三样负载里，水泵和灌溉亮起来，监控熄灭。07 走出门去，越走越慢，灯越来越暗
      if (t > 2.6 && d4.want === 0) { d4.want = 1; fx('powerDown'); }
      const far = sstep(EX - 4, X + 126, P.x);
      END.energy = Math.min(END.energy, lerp(0.5, 0.16, far));
      if (END.sit === 0) { P.speedK = lerp(1, 0.16, sstep(EX + 6, X + 126, P.x)); if (P.x > X + 125.5 && P.grounded && state === 'play') { END.sit = 0.001; ctl = false; autoDir = 0; catHold(P.x + 0.62, P.y, 'curl', -1); } }
      else {
        END.sit = Math.min(1, END.sit + dt / 2.2); END.t2 += dt; END.energy = lerp(0.16, 0.02, sstep(2, 11, END.t2));
        if (END.t2 > 19 && !END.shown) { END.shown = true; state = 'end'; showEnd('结局 · 微光', '附近的灯一盏一盏亮起来，水流进了野地。<br>07 的灯暗了下去。小猫留在它身边。'); }
      }
      if (END.sit > 0) HX.pose = { sit: END.sit, sitH: 0.2, sitLeg: 1.25, limp: sstep(4, 10, END.t2), bow: 0.1 * END.sit, look: 0 };
      END.night = sstep(EX + 10, X + 126, P.x) * 0.35 + 0.65 * sstep(0, 13, END.t2);
      envMod = nightfall;
    }
    if (END.choice && P.x > X + 60) HX.energy = END.energy;
    if (END.choice && P.x > X + 112 && state !== 'title') { const k = E2 ? sstep(1.5, 9, END.t2) : 0; camOvr = { d: lerp(30, 19, k), yo: lerp(3.6, 2.3, k), xo: lerp(5.5, 3.2, k) }; }   // 坐下以后镜头慢慢靠近
    outL.on = E.ext > 0.5 ? 0 : d4.open;
    dockL.on = E1 ? 0.3 + 0.7 * sstep(1, 3, t) : 0.25; panL.on = E2 ? 1 : 0.25;

    const v = V; if (!v) return;
    if (P.x < X - 30 || P.x > X + 230) return;
    v.sw.set(S.lv); v.pan1.draw(S.k[0], T); v.pan2.draw(S.k[1], T); v.pan3.draw(S.k[2], T);
    v.d1.m.position.y = 1.7 + sstep(0, 1, d1.open) * 3.35; v.d1.lamps[0].on(s1.eye);
    v.d2.m.position.y = 1.7 + sstep(0, 1, d2.open) * 3.35; v.d2.lamps[0].on(s2.leaf || S.open2 ? 1 : 0);
    v.d3.m.position.y = 1.7 + sstep(0, 1, d3.open) * 3.35; v.d3.lamps[0].on(s3.eye); v.d3.lamps[1].on(s3.drop);
    v.pads2.forEach((l, i) => l.on([s2.eye, s2.drop, s2.leaf][i])); v.pads3.forEach((l, i) => l.on([s3.eye, s3.leaf, s3.drop][i]));
    v.b2.g.position.x = b2.x; v.b2.glow.material.opacity = 0.7 * (s2.eye || s2.drop || s2.leaf);
    v.c1.g.position.x = c1.x; v.c1.glow.material.opacity = 0.7 * (P3.some(x => near(c1.x, x)) ? 1 : 0);
    v.c2.g.position.x = c2.x; v.c2.glow.material.opacity = 0.7 * (P3.some(x => near(c2.x, x)) ? 1 : 0);
    v.vine2.forEach((g, i) => { const k = clamp(S.v2 * 7.5 - i, 0, 1); g.visible = k > 0.02; g.scale.set(0.6 + 0.4 * k, k, 0.6 + 0.4 * k); });
    v.batt.position.x = batt.x; v.batt.position.z = END.choice ? -0.78 * sstep(0.5, 1.5, t) : 0; v.cells.forEach((m, i) => m.material.color.setHex(END.choice && t > 0.6 + i * 0.7 ? 0x1a2a30 : 0x8fe6ff));
    v.sockL.color.setHex(E1 ? 0x6dff9a : 0xff4a2a); v.sockR.color.setHex(E2 ? 0x6dff9a : 0xff4a2a);
    const clampK = E1 ? sstep(2.6, 3.4, t) * (1 - sstep(7.6, 8.4, t)) : 0;
    v.clamps.forEach((g, i) => { g.rotation.y = (i ? 1 : -1) * lerp(1.1, 0.0, clampK); });
    v.dockLamp.material.opacity = E1 ? 0.25 + 0.6 * sstep(1, 3, t) * (0.8 + 0.2 * Math.sin(T * 9)) : 0.2;
    // 配电盘：选旁路以后，水泵和灌溉先后亮起，最后监控熄灭
    v.pan4.draw(E2 ? [t > 2.4 ? 0 : 1, t > 0.7 ? 1 : 0, t > 1.5 ? 1 : 0] : [1, 0, 0], T);
    v.d4.sync(d4); v.outGlow.opacity = E.ext > 0.5 ? 0 : 0.9 * sstep(0.02, 0.8, d4.open);
    // 外面
    const want = (STORY.fed ? 1 : 0) + (STORY.pump ? 1 : 0) + (STORY.cleaner === 1 || STORY.water ? 1 : 0);          // 一路上帮过的人：亮起的灯多几层
    for (const L of v.lamps) L.s.material.opacity = damp(L.s.material.opacity, E2 && END.t2 > L.at && L.tier <= want ? 0.85 : 0, 1.5, dt);
    v.beams.forEach((b, i) => { b.visible = !E2 || END.night < 0.3; b.material.opacity = 0.1 * (E2 ? 1 - END.night / 0.3 : 1); b.lookAt(b.position.x + 14 * Math.sin(T * 0.35 + i * 2.1), 0, -44); });
    v.stream.material.opacity = E2 ? 0.5 * sstep(4, 10, END.t2) * (STORY.wild ? 1 : 0.5) : 0;
    v.sprout.visible = E2 && END.t2 > 12; if (v.sprout.visible) { v.sprout.position.set(P.x + 0.34, P.y, 0.3); v.sprout.scale.setScalar(sstep(12, 17, END.t2)); }
  }
  function resetEnd() { placeBox(batt, X + 85.5); batt.locked = false; batt.off = false; setGate(d4, 0); Object.assign(END, { choice: 0, t: 0, t2: 0, energy: 0.54, sit: 0, night: 0, shown: false }); envMod = null; P.speedK = 1; STORY.ending = 0; }
  function reset() {
    S.eye1 = true; S.lv = 0; S.v2 = 0; S.open2 = false; placeBox(b2, P2[0]); placeBox(c1, P3[0]); placeBox(c2, P3[1]);
    for (const g of [d1, d2, d3]) setGate(g, 0); resetEnd();
  }
  function solve() { reset(); }
  // 结局以后按 R：回到核心，重新做最后的选择
  function retry() {
    resetEnd(); S.eye1 = false; S.open2 = true; S.v2 = 1; placeBox(b2, P2[2]); placeBox(c1, P3[1]); placeBox(c2, P3[2]); for (const g of [d1, d2, d3]) setGate(g, 1);
    placePlayer(D3 + 3); P.cp = cpAt(P.x); if (STORY.cat) catPlace(P.x - 0.9, 0); ctl = true; autoDir = 0; state = 'play'; camOvr = null;
    $('end').classList.add('hide'); $('fade').style.opacity = 0; saveGame(); snapCamera(); applyEnv(camera.position.x); streamZones(cam.x, true);
  }
  return defZone({ n: 8, vis: [X - 6, X + 232], build, update, reset, solve, retry, unbuild() { V = null; }, S, END, batt, b2, c1, c2, d1, d2, d3, d4 });
})();
function retryEnding() { CH8.retry(); }
