
// ============================================================
//  主角脚边的东西（三）：每一章摆什么
//  每一章四组，都在主角走的那条线（z = 0）前后两三米以内：
//    floor 脚下 —— 贴着地面的：电缆、纸、螺母、油渍、排队的地标……主角从上面走过去
//    behind 身后 —— 主角背后一两米、立着的：托盘、油桶、纸箱、推车……主角从它们前面走过
//    front 身前 —— 主角和镜头之间一两米、矮矮的：管道、倒下的椅子、隔离桩……走过去时挡住一点脚
//    alive 会动的 —— 老鼠、被跑过去带起来的纸片、被踢开的易拉罐
//  看图工具（Last/tools/feet-sheet.html）可以一组一组地开关。种子是各章自己的，不动章节原有布景的随机数
// ============================================================
const FEET_GROUPS = ['floor', 'behind', 'front', 'alive'];
const FEET_OFF = new URLSearchParams(location.search).get('feet') === '0';      // 地址后面加 ?feet=0：脚边的东西一样都不摆（对比用）
function feetZone(n, vis, make) {
  const S = { groups: {}, life: null, on: null };
  const apply = () => { for (const k in S.groups) S.groups[k].visible = !S.on || S.on.includes(k); };
  const z = defZone({ n, vis, feet: true,
    *build(R) {
      S.groups = {}; for (const k of FEET_GROUPS) { const g = new THREE.Group(); g.name = 'feet-' + k; R.add(g); S.groups[k] = g; }
      S.life = groundLife(S.groups.alive, n * 31 + 7);
      _seed = 7700 + n * 131;                            // 自己的种子：以后别的章节多摆了东西，这里的样子也不变
      if (!FEET_OFF) yield* make(S.groups, S.life);
      S.groups.floor.traverse(o => { if (o.isMesh) o.castShadow = false; });   // 贴着地面的东西薄得投不出看得见的影子：不进影子贴图，省一遍绘制
      apply();
    },
    update(dt) { if (z.root && S.life) S.life.step(dt); },
    reset() { if (S.life) S.life.reset(); }, solve() { z.reset(); },
    unbuild() { S.groups = {}; S.life = null; },
    only(names) { S.on = names; apply(); },
    view: () => S });
  return z;
}
// 地上的一片油渍 / 水渍 / 补过的水泥：几团叠在一起的深色，边缘发虚
function stains(parent, x1, x2, z1, z2, spots, o = {}) {
  return groundDecal(x1, x2, z1, z2, o.ppm ?? 48, g => {
    const rgb = o.rgb ?? '6,9,10';
    for (const [x, z, rx, rz, a0] of spots) {
      const a = Math.min(0.8, a0 * (o.k ?? 1.7)), gr = g.createRadialGradient(x, z, 0, x, z, 1);
      gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(0.55, `rgba(${rgb},${a * 0.85})`); gr.addColorStop(0.8, `rgba(${rgb},${a * 0.4})`); gr.addColorStop(1, `rgba(${rgb},0)`);
      g.save(); g.translate(x, z); g.scale(rx, rz); g.translate(-x, -z); g.fillStyle = gr; g.beginPath(); g.arc(x, z, 1, 0, 6.2832); g.fill(); g.restore();
    }
  }, { parent, order: o.order ?? -29 });
}

// ---- 第一章 · 工厂 ----
// 脚下：从上面掉下来时踩塌的那块格栅碎在落脚的地方；几根粗电缆横穿过去（探照灯那台机器也有一根拖到场地前面）；地沟的铁箅子、油渍、散落的螺母和短铁条、压扁的纸板。
// 身后：摞起来的托盘、倒着的油桶、工具推车、一排钢瓶、成箱的零件 —— 都在主角背后一到两米半；探照灯场地里不摆（会多出影子，躲没躲好的判定不算它们）。
// 身前：一段贴地的管道（中间一只红色的阀门手轮）、一把倒在地上的椅子、一摞钢管、一只水桶。
// 会动的：托盘底下、钢瓶后面、纸箱边上各有一只老鼠，走近了就窜进去；地上几张纸，跑过去带起来
feetZone(1, [-40, 105], function* (G, L) {
  const C = { steel: 0x3a4448, dark: 0x22292c, rust: 0x5e3e2e, rust2: 0x4a3a31, wood: 0x5a4a38, wood2: 0x473b2e, card: 0x6e5c44, cable: 0x101416, paper: 0xc4c9c4, red: 0x7a2e22 };
  // ---------------- 脚下 ----------------
  let B = baker();
  // 落脚的地方：踩塌的格栅碎成几块（上面那一截还挂在通道边上）
  for (const [x, z, w, d, yaw] of [[1.6, 0.55, 0.9, 0.55, 0.3], [2.9, -0.35, 0.6, 0.45, -0.5], [3.7, 0.95, 0.5, 0.3, 1.1]]) {
    const y = groundY(x) + 0.015; B.at(x, y, z, yaw, rr(-0.05, 0.05), rr(-0.08, 0.08));
    for (const s of [-1, 1]) { B.box(w, 0.03, 0.03, C.steel, 0, 0, s * d / 2); B.box(0.03, 0.03, d, C.steel, s * w / 2, 0, 0); }
    for (let i = 1; i < Math.round(w / 0.09); i++) B.box(0.012, 0.025, d, C.steel, -w / 2 + i * w / Math.round(w / 0.09), 0, 0);
  }
  scatter(B, 2.4, 0.3, 14, 1.3, ['nut', 'bar', 'chip'], [C.steel, C.dark, C.rust]);
  // 电缆：开头那间屋子横穿一根；推车轨道前后各一根；探照灯机器拖出来一根，弯弯曲曲穿过场地；压机前面两根并排
  B.vary = 0.04;
  floorLine(B, -6.5, -2.6, 8.2, 1.2, 0.034, C.cable, { wob: 0.7, loop: 0.55 });
  floorLine(B, 10.8, 2.6, 14.6, -2.4, 0.03, C.cable, { wob: 0.2 });
  floorLine(B, 39.5, 2.8, 23.2, 1.05, 0.03, C.cable, { wob: 0.2 });
  floorLine(B, 69.5, -15.5, 64.5, 3.2, 0.04, C.cable, { wob: 0.6 });
  floorLine(B, 82.5, -2.2, 99.5, 2.9, 0.032, C.cable, { wob: 0.3 }); floorLine(B, 83.0, -2.0, 99.0, 3.1, 0.022, C.cable, { wob: 0.35 });
  B.vary = 0.08;
  grate(B, 6.4, 1.25, 1.1, 0.42, 0.02); grate(B, 21.6, 1.75, 0.9, 0.4, -0.04); grate(B, 85.2, 1.4, 1.1, 0.42, 0.03);
  flatSheet(B, -3.2, 0.9, 0.9, 0.62, 0.4, C.card); flatSheet(B, 12.6, -0.75, 0.75, 0.55, -0.7, C.card); flatSheet(B, 91.4, 1.0, 0.8, 0.6, 2.4, C.card);
  scatter(B, 13.4, 0.6, 9, 0.9, ['nut', 'bar'], [C.steel, C.dark]); scatter(B, 87.5, -0.9, 10, 1.1, ['nut', 'bar', 'chip'], [C.steel, C.rust, C.dark]);
  scatter(B, 66.5, 1.4, 8, 1.2, ['nut', 'chip'], [C.steel, C.dark]); scatter(B, 33.5, 1.9, 7, 0.8, ['nut', 'bar'], [C.steel, C.rust]);
  B.mesh(G.floor);
  stains(G.floor, -7, 24, -3.2, 3.2, [[1.2, 0.2, 1.4, 0.55, 0.32], [7.2, 1.3, 0.9, 0.35, 0.4], [13.2, -0.4, 1.1, 0.4, 0.28], [21.4, 1.8, 0.8, 0.3, 0.4], [-4.5, -1.6, 1.3, 0.5, 0.3]]);
  stains(G.floor, 80, 100, -3.2, 3.2, [[85.3, 1.4, 1.0, 0.38, 0.42], [89.5, -0.8, 1.5, 0.5, 0.3], [95.6, 1.2, 1.1, 0.4, 0.3], [98.8, -1.5, 0.9, 0.5, 0.35]]);
  yield;
  // ---------------- 身后 ----------------
  B = baker();
  pallet(B, -1.1, -1.95, 0.1, 4); pallet(B, 0.4, -2.35, -0.25, 2); drum(B, 1.45, -1.5, { tip: true, yaw: 0.9, col: 0x3c4f56 }); drum(B, -4.6, -2.2, { col: 0x5b3c2c });
  toolCart(B, 5.5, -1.75, 0.15); bucket(B, 6.4, -1.3, { col: 0x58626a });
  drum(B, 12.0, -2.1, { col: 0x5b3c2c }); drum(B, 12.7, -2.35, { col: 0x3c4f56 }); bucket(B, 13.4, -1.6, { tip: true, yaw: 2.2 });
  for (const [x, z, w, h, d, yaw, k] of [[22.9, -2.0, 0.7, 0.5, 0.55, 0.1, 0], [23.5, -2.3, 0.6, 0.45, 0.5, -0.2, 0], [23.1, -2.1, 0.55, 0.4, 0.45, 0.3, 0.5]])
    cardBox(B, x, z, w, h, d, yaw, { col: C.card, y: k ? groundY(x) + 0.5 : undefined });
  cylinders(B, 28.6, -2.05, 3, { cols: [0x3e5458, 0x56463a, 0x3a3f42] });
  drum(B, 33.6, -2.1, { col: 0x3c4f56 }); drum(B, 34.25, -2.35, { col: 0x3c4f56 }); drum(B, 34.9, -2.1, { col: 0x5b3c2c }); pallet(B, 36.4, -2.2, 1.45, 1, { y: groundY(36.4) });
  toolCart(B, 83.6, -1.8, -0.2, { box: 0x3f4d52 });
  for (const [x, z, w, h, d, yaw, y] of [[89.6, -1.9, 0.8, 0.55, 0.6, 0.05, 0], [90.5, -2.2, 0.7, 0.5, 0.55, -0.15, 0], [89.9, -2.0, 0.6, 0.45, 0.5, 0.25, 0.55], [92.6, -1.7, 0.55, 0.4, 0.45, 0.6, 0]])
    cardBox(B, x, z, w, h, d, yaw, { col: C.card, y: groundY(x) + y, open: y ? 0.9 : 0 });
  pallet(B, 94.6, -2.1, -0.08, 3);
  B.mesh(G.behind);
  yield;
  // ---------------- 身前 ----------------
  B = baker();
  pipeRun(B, -2.4, 3.9, 2.0, 0.3, 0.075, { valve: 1.0, step: 2.4, wheel: C.red, dive: true });
  pipeRun(B, -9.5, -5.2, 2.6, 0.26, 0.06, { step: 2.0, dive: true });
  chair(B, 11.6, 1.75, 0.6, { tip: true, col: 0x4a3a2c });
  stickPile(B, 30.2, 1.95, 6, 2.6, 0.045, C.steel, 0.05); bucket(B, 26.4, 1.55, { col: 0x58626a });
  pallet(B, 59.6, 2.3, 0.12, 1); bucket(B, 73.8, 2.0, { tip: true, yaw: -0.6, col: 0x58626a });
  pallet(B, 86.2, 1.95, -0.15, 2); bucket(B, 93.4, 1.6, { col: 0x5b3c2c }); chair(B, 96.6, 1.9, -0.5, { col: 0x4a3a2c });
  B.mesh(G.front);
  yield;
  // ---------------- 会动的 ----------------
  mkRat(G.alive, L, 2.35, -1.1, [[0.6, -1.45], [-0.4, -1.7], [-1.1, -1.95]], { yaw: Math.PI });     // 一落地就窜进托盘底下
  mkRat(G.alive, L, 31.6, -1.6, [[29.6, -1.75], [28.9, -2.1]], { yaw: Math.PI });                   // 窜到钢瓶后面
  mkRat(G.alive, L, 91.6, -1.4, [[90.9, -1.6], [90.4, -2.2]], { yaw: Math.PI * 0.9 });              // 钻到纸箱后面
  mkLoose(G.alive, L, [[4.2, 0.35, 'paper', C.paper], [7.6, -0.4, 'paper', C.paper], [8.3, 0.6, 'paper', 0xb6b8ad], [-1.2, -0.3, 'paper', C.paper],
    [27.8, 0.85, 'paper', C.paper], [31.1, -0.95, 'paper', 0xb6b8ad], [84.4, 0.4, 'paper', C.paper], [88.0, -0.3, 'paper', 0xb6b8ad], [92.5, 0.5, 'paper', C.paper]], { glow: 0.05 });
});

// ---- 第四章 · 配给街 ----
// 脚下：配给机前地上画着一格一格排队站的位置（漆磨掉了一半）、一张张领完扔掉的包装纸、易拉罐、路边的雨水箅子和一只井盖。
// 身后：配给机左边一堆黑色垃圾袋和纸箱、右边摞着空的周转箱；街边一辆支着的自行车、一道沙袋垒的矮墙、一只小方凳。
// 身前：排队用的立柱和带子，主角正好从队伍的通道里走过去（有一根被碰倒了）；街边一排隔离桩。
// 会动的：跑过去带起来的纸片；走过去会被踢开的易拉罐
feetZone(4, [X4 - 6, X5 + 6], function* (G, L) {
  const X = X4, K = X + 12, C = { bag: 0x272c2e, card: 0x8f7a5a, crate: 0x5a6f7a, crate2: 0x6f7a6a, post: 0x55595a, belt: 0x6e3a33, bol: 0x3f4446, paper: 0xdedbd0, wrap: 0xb8a878 };
  // ---------------- 脚下 ----------------
  let B = baker();
  grate(B, X + 6.2, 1.5, 0.9, 0.36, 0, { col: 0x3a3f41 }); grate(B, X + 44.5, 1.5, 0.9, 0.36, 0, { col: 0x3a3f41 }); grate(B, X + 63, 1.5, 0.9, 0.36, 0, { col: 0x3a3f41 });
  B.at(X + 52.4, groundY(X + 52.4), -0.9); B.cyl(0.38, 0.38, 0.014, 20, 0x3a3e40, 0, 0.007, 0); B.torus(0.3, 0.01, 0x2c3032, 0, 0.012, 0, Math.PI / 2, 0, 0); B.torus(0.18, 0.01, 0x2c3032, 0, 0.012, 0, Math.PI / 2, 0, 0);
  for (const [x, z, n] of [[K - 3.5, 0.2, 7], [X + 34, 0.3, 4], [X + 50, -0.2, 5], [X + 70, 0.4, 5]]) scatter(B, x, z, n, 1.6, ['cap', 'chip'], [0x8a8a80, 0x6a6e70, C.wrap]);
  for (const [x, z, yaw] of [[K - 5.2, 0.9, 0.3], [K + 1.8, 1.0, -0.6], [X + 33.5, -0.8, 1.2], [X + 47.5, 0.95, 2.4], [X + 58.3, -0.7, 0.5]]) flatSheet(B, x, z, 0.32, 0.22, yaw, C.wrap, { t: 0.006 });
  B.mesh(G.floor);
  // 排队的地标：配给机前面一格一格往左排，漆磨掉了一半
  groundDecal(K - 9.5, K + 0.4, -1.0, 1.0, 64, g => {
    let s = 77; const rn = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    for (let i = 0; i < 10; i++) {
      const x = K - 0.6 - i * 0.92, a = 0.55 - i * 0.035;
      g.fillStyle = `rgba(214,206,170,${a})`; g.fillRect(x - 0.24, -0.34, 0.48, 0.07); g.fillRect(x - 0.24, 0.27, 0.48, 0.07); g.fillRect(x - 0.24, -0.34, 0.06, 0.68); g.fillRect(x + 0.18, -0.34, 0.06, 0.68);
      g.globalCompositeOperation = 'destination-out'; for (let k = 0; k < 40; k++) { g.fillStyle = `rgba(0,0,0,${0.4 + rn() * 0.6})`; g.fillRect(x - 0.3 + rn() * 0.6, -0.4 + rn() * 0.8, 0.03 + rn() * 0.1, 0.02 + rn() * 0.05); } g.globalCompositeOperation = 'source-over';
    }
    g.fillStyle = 'rgba(214,206,170,0.5)'; g.fillRect(K - 0.2, -0.9, 0.09, 1.8);       // 配给机前那道停止线
  }, { parent: G.floor, order: -29 });
  stains(G.floor, X + 2, X + 72, -2, 2.4, [[X + 6.2, 1.55, 0.9, 0.3, 0.3], [K - 1, -0.2, 1.3, 0.5, 0.18], [X + 44.5, 1.5, 0.8, 0.3, 0.3], [X + 63, 1.55, 0.9, 0.3, 0.3], [X + 39, -0.5, 1.5, 0.45, 0.15]]);
  yield;
  // ---------------- 身后 ----------------
  B = baker();
  bags(B, K - 3.4, -2.0, 5, { cols: [C.bag, 0x2f3638, 0x353b36] }); cardBox(B, K - 2.4, -2.25, 0.6, 0.45, 0.5, 0.3, { col: C.card, crush: 0.6 }); cardBox(B, K - 4.3, -2.4, 0.55, 0.4, 0.45, -0.4, { col: C.card, open: 1.1 });
  crates(B, K + 1.3, -2.1, 3, { col: C.crate }); crates(B, K + 1.95, -2.35, 2, { col: C.crate2, yaw: 0.2 }); crates(B, K + 1.6, -1.55, 1, { col: C.crate, yaw: -0.3 });
  stool(B, X + 19.6, -1.6, 0.4, { col: 0x5c4833 });
  bike(B, X + 41.5, -1.9, 0.05); sandbags(B, X + 48.2, -2.3, 5, 3, 0, { col: 0x8a8068 });
  bags(B, X + 57.2, -2.1, 4, { cols: [C.bag, 0x2f3638] }); cardBox(B, X + 58.3, -2.3, 0.7, 0.5, 0.55, 0.15, { col: C.card });
  crates(B, X + 66.5, -1.9, 2, { col: C.crate2, yaw: -0.15 });
  B.mesh(G.behind);
  yield;
  // ---------------- 身前 ----------------
  B = baker();
  stanchions(B, K - 8.8, K - 0.9, 1.15, 5, { col: C.post, belt: C.belt });
  stanchions(B, K - 8.8, K - 0.9, -1.15, 5, { col: C.post, belt: C.belt, broken: 2, yaw: 0.6 });
  for (const x of [X + 2.2, X + 5.4, X + 34.0, X + 39.6, X + 45.2, X + 50.8, X + 56.4, X + 62.0, X + 67.6]) bollard(B, x, 2.05, { col: C.bol });
  trafficCone(B, X + 53.3, 1.5, { tip: true, yaw: 0.8 }); crates(B, X + 60.2, 1.6, 1, { col: C.crate, yaw: 0.4 });
  B.mesh(G.front);
  yield;
  // ---------------- 会动的 ----------------
  const pp = []; for (const [x0, x1, n] of [[X + 1, K - 1, 9], [X + 31, X + 74, 12]]) for (let i = 0; i < n; i++) pp.push([lerp(x0, x1, (i + rnd()) / n), rr(-0.9, 1.0), rnd() < 0.7 ? 'paper' : 'card', rnd() < 0.5 ? C.paper : rnd() < 0.5 ? C.wrap : undefined]);
  mkLoose(G.alive, L, pp);
  mkCans(G.alive, L, [[K - 6.1, 0.12, 'can'], [X + 44.0, -0.1, 'tin'], [X + 52.9, 0.15, 'can', 0x4a6a8a], [X + 65.7, 0.05, 'bottle']], { lo: X + 1, hi: X5 - 2 });
});

// 一丛丛野草：沿着 x 撒开，z 在 z1..z2 之间；kinds 种类（plants 图集里的：grass / dry / seed / fern）；cols 几种颜色
function weeds(parent, x1, x2, z1, z2, n, kinds, cols, hMin = 0.18, hMax = 0.42) {
  const list = []; for (let i = 0; i < n; i++) { const x = rr(x1, x2); list.push([x, groundY(x), rr(z1, z2), pick(kinds), rr(hMin, hMax), pick(cols)]); }
  return plants(parent, list);
}
// 一只手提的工具箱
function toolbox(B, x, z, yaw, o = {}) {
  const c = o.col ?? 0x7a3a2a, y = groundY(x);
  B.at(x, y, z, yaw); B.box(0.48, 0.2, 0.22, c, 0, 0.1, 0); B.box(0.5, 0.025, 0.24, c, 0, 0.2, 0); B.box(0.2, 0.03, 0.03, 0x22282a, 0, 0.25, 0); for (const s of [-1, 1]) B.box(0.025, 0.05, 0.025, 0x22282a, s * 0.1, 0.225, 0);
}

// ---- 第三章 · 围墙与废料场 ----
// 脚下：碎水泥块和石子、钢筋头和铁皮片、油渍、一道车辙；墙外的荒地上长着枯草。
// 身后：一摞摞旧轮胎、生锈的油桶、侧躺的洗衣机、斜靠着的车门、一堆堆带钢筋的水泥块 —— 回收线那边扔出来的东西。
// 身前：竖着半埋在土里的轮胎、翘着钢筋的水泥块、躺倒的油桶、弯管子。
// 会动的：跑过去就被带着飞一阵的塑料袋和纸、油桶边的老鼠、枯草里的蚂蚱。
// 墙脚到断桥那一段（追犬在那里来回跑）什么都不摆
feetZone(3, [X3 - 6, X4 + 6], function* (G, L) {
  const X = X3, C = { conc: 0x8a857a, conc2: 0x77736a, rust: 0x7a4a32, rust2: 0x5e4232, blue: 0x4f6670, tire: 0x2a2826, steel: 0x6d6a62, card: 0x8f7a5a, wood: 0x6e5a42 };
  const YARD = [X + 3, X + 43], WASTE = [X + 61, X4 - 3];
  // ---------------- 脚下 ----------------
  let B = baker();
  for (const [a, b] of [YARD, WASTE]) for (let x = a; x < b; x += rr(1.6, 3.2)) { const z = rr(-1.4, 1.8); if (Math.abs(z) < 0.45) continue; chunk(B, x, z, rr(0.06, 0.13), { col: pick([C.conc, C.conc2]), rebar: rnd() < 0.3 }); }
  for (const [a, b] of [YARD, WASTE]) for (let x = a; x < b; x += rr(3, 6)) scatter(B, x, rr(-1, 1.2), 10, 1.2, ['stone', 'chip', 'bar'], [C.conc2, C.conc, C.rust2, 0x5a564e]);
  for (const [x, z, w, d, yaw, c] of [[X + 8.5, 1.1, 0.8, 0.5, 0.5, C.steel], [X + 15.4, -0.9, 0.7, 0.55, -0.3, C.card], [X + 36.2, 1.3, 0.9, 0.5, 1.9, C.steel], [X + 66, -0.8, 0.8, 0.6, 0.2, C.steel], [X + 83.5, 1.2, 0.7, 0.45, 2.6, C.rust2], [X + 104, -0.9, 0.9, 0.55, 0.8, C.steel], [X + 121.5, 1.0, 0.7, 0.5, -0.6, C.card]]) flatSheet(B, x, z, w, d, yaw, c);
  B.vary = 0.04; floorLine(B, X + 19.5, -6.2, X + 24.5, 2.4, 0.03, 0x1e2022, { wob: 0.4 }); B.vary = 0.08;     // 回收线拖出来的一根电缆
  B.mesh(G.floor);
  stains(G.floor, X + 2, X + 44, -2.5, 2.5, [[X + 10, 0.6, 1.2, 0.4, 0.3], [X + 23, -0.7, 1.6, 0.5, 0.25], [X + 37, 1.2, 1.1, 0.4, 0.3]]);
  // 荒地上的车辙：两道压实了的深色印子，弯弯地往右去
  groundDecal(WASTE[0], WASTE[1], -1.6, 2.4, 22, g => { for (const dz of [-0.55, 1.05]) { g.strokeStyle = 'rgba(52,44,34,0.55)'; g.lineWidth = 0.36; g.beginPath(); for (let x = WASTE[0]; x <= WASTE[1]; x += 0.5) { const z = dz + Math.sin(x * 0.07) * 0.35; x === WASTE[0] ? g.moveTo(x, z) : g.lineTo(x, z); } g.stroke(); } }, { parent: G.floor, order: -29, fadeL: 6, fadeR: 6 });
  // 枯草：一簇一簇的，不是均匀撒开（荒地上的草长在石头边、车辙外面）
  const tufts = []; for (let x = WASTE[0]; x < WASTE[1]; x += rr(1.2, 2.6)) { const z = rnd() < 0.5 ? rr(-2.6, -0.75) : rr(0.75, 2.8), n = 3 + Math.floor(rnd() * 6); for (let i = 0; i < n; i++) { const xx = x + rr(-0.35, 0.35); tufts.push([xx, groundY(xx), z + rr(-0.15, 0.15), pick(['dry', 'dry', 'seed']), rr(0.14, 0.42), pick([0xa08c5c, 0x8a7448, 0xb09a68, 0x7a6a48])]); } }
  plants(G.floor, tufts);
  yield;
  // ---------------- 身后 ----------------
  B = baker();
  tire(B, X + 7.8, -2.0, { stack: 3, col: C.tire }); tire(B, X + 8.7, -2.4, { stack: 2, col: C.tire }); tire(B, X + 9.6, -1.6, { stand: true, yaw: 0.4, col: C.tire });
  drum(B, X + 12.5, -2.2, { col: C.rust }); drum(B, X + 13.2, -2.5, { col: C.blue }); drum(B, X + 13.9, -1.9, { tip: true, yaw: -0.4, col: C.rust });
  pallet(B, X + 18.4, -2.1, 0.3, 2, { col: 0x7a6650, col2: 0x5e4e3c }); washer(B, X + 23.5, -2.2, -0.3, { tip: true });
  for (const [x, n] of [[X + 32.5, 5], [X + 39.5, 4]]) for (let i = 0; i < n; i++) chunk(B, x + rr(-0.9, 0.9), rr(-2.8, -1.7), rr(0.18, 0.38), { col: pick([C.conc, C.conc2]) });
  carDoor(B, X + 35.6, -2.1, 0.15, { col: 0x5a6a72 });
  for (const [x, kind] of [[X + 63.5, 'chunks'], [X + 73.2, 'tires'], [X + 85.2, 'door'], [X + 92.3, 'washer'], [X + 101.5, 'chunks'], [X + 111.4, 'tires'], [X + 118.6, 'drums']]) {
    if (kind === 'chunks') for (let i = 0; i < 5; i++) chunk(B, x + rr(-1, 1), rr(-2.9, -1.6), rr(0.18, 0.42), { col: pick([C.conc, C.conc2]) });
    if (kind === 'tires') { tire(B, x, -2.1, { stack: 4, col: C.tire }); tire(B, x + 0.8, -1.7, { stand: true, yaw: -0.3, bury: 0.12, col: C.tire }); drum(B, x - 0.9, -2.4, { col: C.rust }); }
    if (kind === 'door') { carDoor(B, x, -2.0, -0.1, { col: 0x6a5a4e }); bentPipe(B, x + 1.1, -1.6, 1.6, 0.05, 0.4, C.rust2); }
    if (kind === 'washer') { washer(B, x, -2.2, 0.2); chunk(B, x + 0.8, -1.8, 0.2, { col: C.conc }); }
    if (kind === 'drums') { drum(B, x, -2.3, { col: C.rust }); drum(B, x + 0.62, -2.0, { tip: true, yaw: 0.6, col: C.blue }); drum(B, x - 0.6, -2.6, { col: C.rust2 }); }
  }
  B.mesh(G.behind);
  yield;
  // ---------------- 身前 ----------------
  B = baker();
  tire(B, X + 5.6, 1.8, { stand: true, yaw: 0.25, bury: 0.15, col: C.tire }); chunk(B, X + 16.2, 1.7, 0.24, { col: C.conc }); drum(B, X + 25.4, 2.2, { tip: true, yaw: 0.3, col: C.rust }); bentPipe(B, X + 33.8, 1.5, 1.8, 0.05, -0.2, C.rust2);
  for (const [x, kind, z] of [[X + 62.6, 'chunk', 1.5], [X + 66.4, 'tire', 1.7], [X + 72.5, 'pipe', 2.2], [X + 76.4, 'chunk', 1.5], [X + 79.2, 'chunk', 1.9], [X + 84.2, 'flat', 2.2], [X + 89.3, 'pipe', 1.4], [X + 94.6, 'tire', 1.9],
    [X + 99.2, 'flat', 2.0], [X + 104.4, 'chunk', 2.3], [X + 108.4, 'chunk', 1.6], [X + 112.6, 'pipe', 2.0], [X + 116.8, 'drum', 2.1], [X + 122.2, 'tire', 1.6], [X + 127.5, 'chunk', 1.8]]) {
    if (kind === 'tire') tire(B, x, z, { stand: true, yaw: -0.3, bury: 0.15, col: C.tire });
    if (kind === 'chunk') chunk(B, x, z, rr(0.2, 0.28), { col: pick([C.conc, C.conc2]) });
    if (kind === 'pipe') bentPipe(B, x, z, 1.6, 0.05, 0.9, C.rust2);
    if (kind === 'flat') tire(B, x, z, { col: C.tire });
    if (kind === 'drum') drum(B, x, z, { tip: true, yaw: -0.5, col: C.rust });
  }
  B.mesh(G.front);
  yield;
  // ---------------- 会动的 ----------------
  const pp = []; for (let x = YARD[0]; x < YARD[1]; x += rr(2.5, 4.5)) pp.push([x, rr(-0.9, 1.0), rnd() < 0.5 ? 'paper' : 'card', rnd() < 0.5 ? 0xcfc8b6 : undefined]);
  for (let x = WASTE[0]; x < WASTE[1]; x += rr(5, 9)) pp.push([x, rr(-0.8, 0.9), rnd() < 0.6 ? 'bag' : 'paper', rnd() < 0.5 ? 0xd2d4cc : 0xb8c4c8]);
  mkLoose(G.alive, L, pp);
  mkRat(G.alive, L, X + 14.8, -1.45, [[X + 14.2, -1.8], [X + 13.6, -2.2]], { yaw: Math.PI, col: 0x5e544a });
  mkRat(G.alive, L, X + 74.4, -1.5, [[X + 73.6, -1.8], [X + 73.1, -2.2]], { yaw: Math.PI * 0.9, col: 0x5e544a });
  const hp = []; for (let x = WASTE[0] + 2; x < WASTE[1]; x += rr(2.2, 4.5)) hp.push([x, rr(-1.6, 1.8)]);
  mkHoppers(G.alive, L, hp, { col: 0x9a8650 });
});

// ---- 第五章 · 维修巷 ----
// 脚下：一摊摊油渍、散落的螺丝和铁屑、服务站拖出来的一根电缆、雨水箅子、压扁的纸板。
// 身后：靠墙的零件箱、一张带台钳的工作台、一摞旧轮胎、成对的钢瓶、纸箱、工具推车 —— 巷子里的人在这里修东西。
// 身前：工具箱、油壶、水桶、平躺的轮胎、一段贴地的管子、倒下的方凳。
// 会动的：工作台下面、轮胎边上的老鼠；地上的纸片
feetZone(5, [X5 - 4, X6 + 4], function* (G, L) {
  const X = X5, C = { steel: 0x4a5458, dark: 0x2a3033, rust: 0x6a4a36, wood: 0x5c4833, card: 0x7e6c52, tire: 0x1e2122, paper: 0xd0d0c6 };
  // ---------------- 脚下 ----------------
  let B = baker();
  for (const [x, z, n] of [[X + 9, 0.8, 9], [X + 25, 1.3, 8], [X + 45, -0.8, 9], [X + 55, 1.0, 7]]) scatter(B, x, z, n, 1.0, ['nut', 'bar', 'chip'], [C.steel, C.dark, C.rust]);
  B.vary = 0.04; floorLine(B, X + 7.2, -1.3, X + 12.5, 1.6, 0.03, 0x111416, { wob: 0.35, loop: 0.7, loopR: 0.18 }); B.vary = 0.08;
  grate(B, X + 20.2, 1.35, 1.0, 0.4, 0, { col: 0x30373a }); grate(B, X + 49, 1.25, 1.0, 0.4, 0, { col: 0x30373a });
  flatSheet(B, X + 4.4, 0.8, 0.8, 0.6, 0.3, C.card); flatSheet(B, X + 40.5, 0.7, 0.75, 0.55, -1.1, C.card);
  B.mesh(G.floor);
  stains(G.floor, X + 1, X + 62, -2.6, 2.6, [[X + 5, 0.4, 1.2, 0.45, 0.35], [X + 11, -0.6, 1.5, 0.5, 0.3], [X + 22, 1.2, 1.0, 0.4, 0.35], [X + 28, -0.4, 1.4, 0.5, 0.25], [X + 42, 0.9, 1.1, 0.4, 0.35], [X + 53, -0.7, 1.6, 0.55, 0.3]]);
  yield;
  // ---------------- 身后 ----------------
  B = baker();
  partsBin(B, X + 3.6, -2.2, 0.1); tire(B, X + 5.2, -2.3, { stack: 3, col: C.tire });
  workbench(B, X + 10.6, -2.6, 0.03); cardBox(B, X + 12.4, -2.1, 0.6, 0.45, 0.5, -0.2, { col: C.card }); cardBox(B, X + 12.6, -2.3, 0.5, 0.4, 0.45, 0.3, { col: C.card, y: groundY(X + 12.6) + 0.45 });
  drum(B, X + 22.4, -2.5, { col: 0x3c4f56 }); drum(B, X + 23.1, -2.2, { col: C.rust }); partsBin(B, X + 26.2, -2.3, -0.15, { w: 0.7 }); cylinders(B, X + 29.6, -2.6, 2, { cols: [0x3e5458, 0x5a4a3a] });
  toolCart(B, X + 39.4, -2.0, -0.1); workbench(B, X + 45.2, -2.7, -0.02); tire(B, X + 51.0, -2.2, { stack: 4, col: C.tire }); tire(B, X + 51.9, -1.8, { stand: true, yaw: 0.3, col: C.tire });
  partsBin(B, X + 56.8, -2.3, 0.2); cardBox(B, X + 58.4, -2.2, 0.7, 0.5, 0.55, 0.1, { col: C.card, open: 1.0 });
  B.mesh(G.behind);
  yield;
  // ---------------- 身前 ----------------
  B = baker();
  toolbox(B, X + 8.6, 1.6, 0.3); jerrycan(B, X + 12.6, 1.8, -0.4, { col: 0x6a3a2c }); bucket(B, X + 24.2, 1.5, { col: 0x5e686c });
  tire(B, X + 30.4, 2.1, { col: C.tire }); pipeRun(B, X + 40.2, X + 45.6, 2.2, 0.26, 0.06, { dive: true, step: 2.2 });
  stool(B, X + 54.8, 1.7, 0.4, { tip: true, col: C.wood }); jerrycan(B, X + 59.6, 1.5, 0.6, { tip: true, col: 0x5a6b4a });
  B.mesh(G.front);
  yield;
  // ---------------- 会动的 ----------------
  mkRat(G.alive, L, X + 12.8, -1.5, [[X + 11.6, -1.9], [X + 10.9, -2.5]], { yaw: Math.PI, col: 0x605650 });
  mkRat(G.alive, L, X + 52.6, -1.4, [[X + 51.6, -1.8], [X + 51.1, -2.2]], { yaw: Math.PI * 0.95, col: 0x605650 });
  const pp = []; for (const [a, b] of [[X + 2, X + 17], [X + 36, X + 62]]) for (let x = a; x < b; x += rr(2, 4)) pp.push([x, rr(-0.9, 1.0), rnd() < 0.7 ? 'paper' : 'card', rnd() < 0.5 ? C.paper : undefined]);
  mkLoose(G.alive, L, pp);
});

// ---- 第六章 · 供水街区 ----
// 脚下：从水泵拖过来的一根水管、水泵和漏水的管子底下湿了一大片、雨水箅子、井盖、瓶盖；街尾长出了草。
// 身后：水泵边排着一溜等水的水壶、水桶和盆；监控杆之间一张旧椅子和几盆菜苗；闸门后面漏水的管子底下摆着接水的桶和盆；街尾的旧轮胎、生锈的油桶。
// 身前：接水管的盆、一箱空瓶子、一段贴地的管子、油壶、倒着的水桶、方凳；街尾的草丛。
// 会动的：地上的纸片、被踢开的易拉罐、街尾草里的蚂蚱
feetZone(6, [X6 - 6, X7 + 6], function* (G, L) {
  const X = X6, PUMP = X + 18.5, C = { steel: 0x4f585c, blue: 0x4f6a7a, green: 0x56704e, yellow: 0x9a8a4a, red: 0x7a3e34, white: 0xb8bcb4, card: 0x8f7a5a, wood: 0x6a5640, tire: 0x262829, hose: 0x2e4a3a };
  const GRASS = [X + 73, X7 - 2];
  // ---------------- 脚下 ----------------
  let B = baker();
  B.vary = 0.04; floorLine(B, PUMP + 0.4, -0.85, PUMP + 4.6, 1.45, 0.022, C.hose, { wob: 0.35 }); B.vary = 0.08;           // 水泵拖出来的水管，通到前面的盆里
  grate(B, X + 26.2, 1.4, 0.9, 0.36, 0, { col: 0x3a4144 }); grate(B, X + 47.6, 1.4, 0.9, 0.36, 0, { col: 0x3a4144 });
  B.at(X + 31.4, groundY(X + 31.4), -0.85); B.cyl(0.38, 0.38, 0.014, 20, 0x3a3f42, 0, 0.007, 0); B.torus(0.3, 0.01, 0x2c3134, 0, 0.012, 0, Math.PI / 2, 0, 0);
  for (const [x, z, n] of [[X + 4, 0.6, 6], [X + 23, -0.4, 6], [X + 37, 0.8, 5], [X + 52, -0.7, 5], [X + 66, 0.6, 5]]) scatter(B, x, z, n, 1.4, ['cap', 'chip', 'stone'], [0x8a8a80, 0x5a6266, C.blue, 0x6a6e70]);
  B.mesh(G.floor);
  stains(G.floor, X + 14, X + 30, -2.4, 2.4, [[PUMP + 1, -0.6, 2.2, 0.8, 0.42], [PUMP + 3.8, 1.3, 1.2, 0.5, 0.4], [PUMP - 1.5, 0.2, 1.0, 0.4, 0.25], [X + 26.2, 1.4, 0.9, 0.35, 0.35]], { rgb: '14,22,28' });
  stains(G.floor, X + 44, X + 62, -2.4, 2.4, [[X + 50, -0.4, 2.0, 0.9, 0.42], [X + 51.5, 0.9, 1.2, 0.5, 0.35], [X + 47.6, 1.4, 0.9, 0.35, 0.3]], { rgb: '14,22,28' });
  weeds(G.floor, GRASS[0], GRASS[1], -2.6, -0.6, 90, ['grass', 'seed', 'grass'], [0x6a8a48, 0x7f9a52, 0x5e7a40], 0.15, 0.42);
  weeds(G.floor, GRASS[0], GRASS[1], 0.6, 2.4, 70, ['grass', 'seed'], [0x6a8a48, 0x7f9a52, 0x5e7a40], 0.12, 0.36);
  yield;
  // ---------------- 身后 ----------------
  B = baker();
  // 等水的一溜：水壶、水桶、盆，挨个排着，排到了监控杆底下
  let qx = PUMP + 2.3; for (const k of ['jerry', 'bucket', 'jerry', 'basin', 'bucket', 'jerry', 'bucket', 'jerry', 'basin', 'bucket']) {
    const z = -1.65 + rr(-0.08, 0.08);
    if (k === 'jerry') { jerrycan(B, qx, z, rr(-0.2, 0.2), { col: pick([C.blue, C.green, C.yellow, C.red]) }); qx += 0.42; }
    else if (k === 'bucket') { bucket(B, qx, z, { col: pick([C.blue, C.white, C.red, C.steel]) }); qx += 0.4; }
    else { basin(B, qx + 0.12, z, { col: pick([C.blue, C.steel]), water: false }); qx += 0.72; }
  }
  chair(B, X + 31.2, -2.0, 0.3, { col: 0x5a4a3a }); for (const [x, z] of [[X + 29.6, -2.3], [X + 30.1, -2.6], [X + 32.6, -2.4]]) pot(B, x, z, { s: 1.1 });
  handCart(B, X + 38.6, -2.1, 0.2, { drum: C.blue });
  for (const [x, k] of [[X + 49.4, 'bucket'], [X + 50.1, 'basin'], [X + 51.1, 'bucket'], [X + 51.8, 'jerry']]) { if (k === 'bucket') bucket(B, x, -1.7, { col: pick([C.white, C.blue]) }); else if (k === 'basin') basin(B, x, -1.75, { col: C.steel }); else jerrycan(B, x, -1.75, 0.2, { col: C.green }); }
  cardBox(B, X + 64.5, -2.1, 0.6, 0.45, 0.5, 0.2, { col: C.card }); bags(B, X + 67.2, -2.2, 3);
  tire(B, X + 78.5, -2.1, { stack: 3, col: C.tire }); drum(B, X + 88.6, -2.3, { col: 0x6a4a36 }); drum(B, X + 89.3, -2.0, { tip: true, yaw: 0.5, col: C.blue });
  pallet(B, X + 99.8, -2.2, 0.15, 2, { col: 0x6a5a46 }); chair(B, X + 107.5, -2.0, -0.4, { tip: true, col: 0x5a4a3a });
  B.mesh(G.behind);
  yield;
  // ---------------- 身前 ----------------
  B = baker();
  bucket(B, X + 10.4, 1.6, { col: C.steel }); basin(B, PUMP + 4.9, 1.55, { col: C.blue }); crates(B, X + 28.8, 1.8, 1, { col: 0x5a6f7a });
  for (let i = 0; i < 6; i++) B.at(X + 28.8 + (i % 3 - 1) * 0.15, groundY(X + 28.8) + 0.32, 1.8 + (i < 3 ? -0.08 : 0.08)).cyl(0.035, 0.035, 0.2, 8, pick([0x6a8a7a, 0x8a9a8a, 0x4a6a5a]), 0, 0.1, 0);   // 箱子里插着几只空瓶
  pipeRun(B, X + 33.6, X + 39.4, 2.2, 0.26, 0.06, { dive: true, step: 2.2 });
  jerrycan(B, X + 46.4, 1.6, -0.5, { col: C.yellow }); bucket(B, X + 57.4, 1.8, { tip: true, yaw: 2.2, col: C.white }); stool(B, X + 64.2, 1.7, 0.3, { col: C.wood });
  B.mesh(G.front);
  weeds(G.front, GRASS[0], GRASS[1], 1.2, 2.8, 40, ['grass', 'seed'], [0x5e7a40, 0x6a8a48], 0.35, 0.65);
  yield;
  // ---------------- 会动的 ----------------
  const pp = []; for (const [a, b] of [[X + 2, X + 8], [X + 22, X + 40], [X + 44, X + 72]]) for (let x = a; x < b; x += rr(2.2, 4.2)) pp.push([x, rr(-0.9, 1.0), rnd() < 0.7 ? 'paper' : 'card', rnd() < 0.5 ? 0xd6d4ca : undefined]);
  mkLoose(G.alive, L, pp);
  mkCans(G.alive, L, [[X + 24.6, 0.1, 'can', 0x4a6a8a], [X + 36.2, -0.05, 'tin'], [X + 68.5, 0.1, 'bottle']], { lo: X + 1, hi: X7 - 3 });
  const hp = []; for (let x = GRASS[0] + 1; x < GRASS[1]; x += rr(2.5, 5)) hp.push([x, rr(-1.6, 1.8)]);
  mkHoppers(G.alive, L, hp, { col: 0x7a8a48 });
});

// ---- 第二章 · 林地水闸（坡上那一段；林子里和水闸那一屏已经有自己的地面了）----
// 脚下：路两边一簇簇枯草、几块石头和碎石、从电线杆上掉下来的白瓷绝缘子、一根垂到地上横过小路的旧电线。
// 身后：倒了一半的栅栏、一只木头电缆盘、一块歪着的旧牌子、一堆拔下来的栅栏桩。
// 身前：高一点的枯草和蓟、一块石头、一卷生锈的铁丝。
// 会动的：草里的蚂蚱（走近就蹦开）、跑过去带起来的枯叶
feetZone(2, [X2, X2 + 76], function* (G, L) {
  const X = X2, A = X + 2.5, Bx = X + 72, C = { dry: [0xb09a68, 0x8a7448, 0xa08c5c, 0x9a8058], stone: 0x7a7266, wood: 0x5a4a3a, wire: 0x2a2622 };
  const dens = x => 1 - 0.65 * sstep(X + 18, X + 30, x) * sstep(X + 62, X + 50, x);       // 坡顶那几十米镜头拉得很远，摆得稀一点
  // ---------------- 脚下 ----------------
  let B = baker();
  for (let x = A; x < Bx; x += rr(2.2, 4.5) / dens(x)) { const z = rnd() < 0.5 ? rr(-2.4, -0.7) : rr(0.7, 2.4); stone(B, x, z, rr(0.06, 0.16), { col: C.stone }); if (rnd() < 0.6) scatter(B, x + rr(-0.5, 0.5), z, 6, 0.6, ['stone'], [0x8a8478, 0x6a645a]); }
  for (const [x, z] of [[X + 6.8, 1.0], [X + 9.2, -0.9], [X + 15.5, 1.3], [X + 58.5, -1.1], [X + 66.2, 0.9]]) insulator(B, x, z, { col: rnd() < 0.7 ? 0xd8d6cc : 0x6a4a36 });
  // 旧电线：从后面一根歪掉的电线杆上垂下来，横过小路，拖到前面的草里
  B.vary = 0.03; floorLine(B, X + 10.8, -5.5, X + 13.6, 2.6, 0.012, C.wire, { wob: 0.25 }); B.vary = 0.08;
  B.mesh(G.floor);
  const tufts = []; for (let x = A; x < Bx; x += rr(0.7, 1.6) / dens(x)) { const z = rnd() < 0.5 ? rr(-2.8, -0.6) : rr(0.6, 3.0), n = 3 + Math.floor(rnd() * 5); for (let i = 0; i < n; i++) { const xx = x + rr(-0.35, 0.35); tufts.push([xx, groundY(xx), z + rr(-0.12, 0.12), pick(['dry', 'dry', 'seed', 'grass']), rr(0.14, 0.4), pick(C.dry)]); } }
  plants(G.floor, tufts);
  yield;
  // ---------------- 身后 ----------------
  B = baker();
  oldFence(B, X + 3.2, X + 9.8, -1.9, { broken: 2 }); reel(B, X + 11.6, -2.2, 0.48, 0.3); sign(B, X + 15.2, -1.7, 0.2, { tilt: -0.22 });
  stickPile(B, X + 21.5, -2.0, 7, 1.8, 0.05, C.wood, 0.35); oldFence(B, X + 33.5, X + 40.5, -2.1, { broken: 1 });
  for (const [x, z, s] of [[X + 27.2, -2.4, 0.42], [X + 44.6, -2.2, 0.5], [X + 57.4, -2.0, 0.38]]) stone(B, x, z, s, { col: C.stone });
  reel(B, X + 52.5, -2.3, 0.42, -0.4); oldFence(B, X + 60.5, X + 67, -2.0, { broken: 3 }); sign(B, X + 69.4, -1.8, -0.3, { tilt: 0.25, col: 0x6a5a48 });
  B.mesh(G.behind);
  yield;
  // ---------------- 身前 ----------------
  B = baker();
  for (const [x, z, s] of [[X + 8.1, 1.9, 0.22], [X + 24.4, 2.2, 0.28], [X + 47.8, 1.8, 0.24], [X + 64.3, 2.0, 0.26]]) stone(B, x, z, s, { col: C.stone });
  wireCoil(B, X + 13.2, 1.7, 0.32); wireCoil(B, X + 55.6, 1.5, 0.28);
  B.mesh(G.front);
  const tall = []; for (let x = A; x < Bx; x += rr(1.8, 3.6) / dens(x)) { const z = rr(1.2, 2.8), n = 3 + Math.floor(rnd() * 4); for (let i = 0; i < n; i++) { const xx = x + rr(-0.3, 0.3); tall.push([xx, groundY(xx), z + rr(-0.1, 0.1), pick(['dry', 'seed', 'seed']), rr(0.4, 0.75), pick(C.dry)]); } }
  plants(G.front, tall);
  yield;
  // ---------------- 会动的 ----------------
  const hp = []; for (let x = A + 1; x < Bx; x += rr(1.8, 3.5) / dens(x)) hp.push([x, rr(-1.4, 1.6)]);
  mkHoppers(G.alive, L, hp, { col: 0xa08a52 });
  const lv = []; for (let x = A; x < Bx; x += rr(1.5, 3) / dens(x)) lv.push([x, rr(-1.0, 1.1), 'leaf', pick([0x9a6a30, 0x8a5a2a, 0xa88040])]);
  mkLoose(G.alive, L, lv, { minSpeed: 2.0 });
});

// ---- 第七章 · 管理花园（花园里那一段；墙外的野地脚下已经有花和草）----
// 脚下：草坪上一根黄色的水管弯弯地穿过去、路边一排冒出来的喷头、一溜踏脚石、刚剪下来的草屑和花瓣。
// 身后：花垄前面停着一辆装着土的独轮车，耙子靠在车上；一排一模一样的花盆里种着一模一样的小苗，插着白色标签；几袋肥料、两只喷壶。
// 身前：修成方块的小灌木、一只倒着的喷壶、一盘水管。
// 会动的：跑过去带起来的草屑和花瓣
feetZone(7, [X7 - 4, X8 - 4], function* (G, L) {
  const X = X7, C = { hose: 0xd8a830, pot: 0xb06a42, sapl: [0x4e8a3a, 0x5f9a44, 0x3e7a32], hedge: 0x2f6a3a, can: 0x3f7a9a };
  const SPANS = [[X + 2.2, X + 20], [X + 36.5, X + 45.5]];                 // 推树枝那一段、修剪机和门、阀门旁边都空着
  // ---------------- 脚下 ----------------
  let B = baker();
  B.vary = 0.03; floorLine(B, X + 3.2, -2.6, X + 17.5, 2.2, 0.028, C.hose, { wob: 0.7, loop: 0.35, loopR: 0.26 }); floorLine(B, X + 37.5, 2.4, X + 44.8, -2.2, 0.028, C.hose, { wob: 0.5 }); B.vary = 0.08;
  for (const [a, b] of SPANS) for (let x = a + 0.6; x < b; x += 2.9) sprinkler(B, x, 1.25);
  for (let i = 0, x = X + 6.4; i < 9; i++, x += rr(0.62, 0.78)) steppingStone(B, x, rr(-0.12, 0.12), rr(0.22, 0.27));
  B.mesh(G.floor);
  // 草屑和花瓣：撒在花垄前面和小路上（一张贴地的画）
  groundDecal(X + 2, X + 46, -3.2, 2.6, 40, g => {
    let s = 91; const rn = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    for (let i = 0; i < 1400; i++) { const x = X + 2 + rn() * 44, z = -3.2 + rn() * 5.8; if (x > X + 20 && x < X + 36.5) continue; const near = Math.exp(-(((z + 2.9) / 0.6) ** 2)); if (rn() > 0.25 + near) continue;
      g.fillStyle = rn() < 0.75 ? `rgba(${60 + rn() * 40 | 0},${110 + rn() * 50 | 0},${40 + rn() * 20 | 0},0.8)` : pick(['rgba(232,80,72,0.8)', 'rgba(246,200,60,0.8)', 'rgba(248,246,236,0.85)', 'rgba(240,140,60,0.8)']);
      g.save(); g.translate(x, z); g.rotate(rn() * 6.28); g.fillRect(-0.045, -0.012, 0.09, 0.024); g.restore(); }
  }, { parent: G.floor, order: -29 });
  yield;
  // ---------------- 身后 ----------------
  B = baker();
  wheelbarrow(B, X + 5.2, -2.2, 0.2); rake(B, X + 6.3, -2.6, 0.1, { lean: 0.32 }); sack(B, X + 7.6, -2.4, 0.3); sack(B, X + 8.2, -2.2, -0.4, { lie: true });
  for (let i = 0; i < 9; i++) { const x = X + 10.5 + i * 0.62; pot(B, x, -2.25, { col: C.pot, h: 0.26, leaf: C.sapl, n: 4 }); stake(B, x + 0.05, -2.05); }      // 一模一样的花盆、一模一样的小苗
  wateringCan(B, X + 17.0, -2.0, 0.6, { col: C.can }); wateringCan(B, X + 17.6, -2.3, -0.3, { col: C.can });
  wheelbarrow(B, X + 39.4, -2.3, -0.3, { col: 0x8a3a2a }); for (let i = 0; i < 5; i++) pot(B, X + 41.2 + i * 0.62, -2.2, { col: C.pot, h: 0.26, leaf: C.sapl, n: 4 });
  B.mesh(G.behind);
  yield;
  // ---------------- 身前 ----------------
  B = baker();
  for (const [x, z] of [[X + 3.6, 1.9], [X + 9.8, 2.1], [X + 13.4, 1.8], [X + 18.6, 2.0], [X + 38.6, 1.9], [X + 43.8, 2.1]]) boxHedge(B, x, z, 0.62, 0.52);
  wateringCan(B, X + 15.6, 1.6, 2.2, { tip: true, col: C.can });
  for (let i = 0; i < 6; i++) B.at(X + 41.2, groundY(X + 41.2) + 0.02 + i * 0.03, 1.6).torus(0.3 - i * 0.012, 0.02, C.hose, 0, 0, 0, Math.PI / 2, 0, 0, 6.2832, 20);   // 一盘水管
  B.mesh(G.front);
  yield;
  // ---------------- 会动的 ----------------
  const pp = []; for (const [a, b] of SPANS) for (let x = a; x < b; x += rr(0.8, 1.6)) pp.push([x, rr(-1.1, 1.2), rnd() < 0.6 ? 'clip' : 'petal', rnd() < 0.6 ? undefined : pick([0xe8504a, 0xf6c83c, 0xf8f6ec, 0xf08c3c])]);
  mkLoose(G.alive, L, pp, { minSpeed: 2.0 });
});

// ---- 第八章 · 生态中枢（前面三间屋子里，和出了门的那一道坡）----
// 脚下：沿着地面走向机柜的成束电缆、地上的通风箅子、几张打印出来又被丢掉的纸。
// 身后：一辆辆育苗小推车，盘里冒着小苗 —— 冷冰冰的中枢里唯一的绿；一排样品罐、一张方凳。
// 身前：贴着地面的走线槽和接线盒、一盘电缆。核心那一屋（大圆灯）不摆，留给那一屏。
// 出了门：脚下是碎石和枯草，身后是几根旧栅栏桩，身前是高一点的草；草里有蟋蟀，走近就蹦开
feetZone(8, [X8 - 4, X8 + 150], function* (G, L) {
  const X = X8, D1 = X + 20, D2 = X + 44, D3 = X + 70, EX = X + 96, C = { dark: 0x24303a, steel: 0x3a4a54, cable: 0x0e1418, paper: 0xb8c4c8, dry: [0x6a6a48, 0x7a7650, 0x5a5a3c], stone: 0x5a5c58 };
  const ROOMS = [[X + 2.2, X + 10.8], [X + 13.4, D1 - 1.6], [D1 + 1.6, X + 27.2], [X + 38.6, D2 - 2.4], [D2 + 1.6, X + 51.2], [X + 63.2, D3 - 1.6]];   // 开关、导电桥和触点、门都空出来
  // ---------------- 脚下 ----------------
  let B = baker(); B.vary = 0.04;
  for (const [a, b] of ROOMS) floorLine(B, a + 0.3, rr(1.2, 2.4), b - 0.3, -rr(1.6, 2.6), 0.035, C.cable, { wob: 0.4 });
  floorLine(B, X + 3, 2.0, X + 10, -2.2, 0.025, C.cable, { wob: 0.6, loop: 0.5, loopR: 0.2 });
  B.vary = 0.08;
  for (const x of [X + 6.4, D1 + 4.2, X + 48.6, X + 66]) grate(B, x, 1.4, 1.0, 0.45, 0, { col: 0x2a3640 });
  for (const [x, z, yaw] of [[X + 8.2, 0.7, 0.4], [D1 + 2.6, -0.8, -0.6], [X + 40.2, 0.9, 2.1], [D2 + 3.4, -0.6, 1.2]]) flatSheet(B, x, z, 0.21, 0.29, yaw, C.paper, { t: 0.004, bend: 0.05 });
  B.mesh(G.floor);
  yield;
  // ---------------- 身后 ----------------
  B = baker();
  const CARTS = [[X + 4.4, -1.9], [X + 15.6, -2.0], [D1 + 5.4, -1.9], [X + 41.0, -2.0], [D2 + 4.6, -1.9], [X + 65.4, -2.0]];
  for (const [x, z] of CARTS) seedCart(B, x, z, rr(-0.06, 0.06));
  jars(B, X + 7.6, -1.7, 5, { y: 0 }); stool(B, X + 17.6, -1.6, 0.4, { col: 0x3a4a54 }); jars(B, X + 49.4, -1.7, 4); stool(B, X + 67.8, -1.7, -0.3, { col: 0x3a4a54 });
  B.mesh(G.behind);
  for (const [x, z] of CARTS) { glow(G.behind, 0xe0c8ff, 1.3, 0.32, x, groundY(x) + 0.62, z + 0.2); glow(G.behind, 0xc8f0b0, 0.8, 0.22, x, groundY(x) + 0.82, z + 0.25); }   // 补光灯照着苗：一小团偏紫的光
  yield;
  // ---------------- 身前 ----------------
  B = baker();
  for (const [a, b] of ROOMS) conduit(B, a + 0.4, Math.min(b - 0.4, a + 5.5), 1.9);
  for (let i = 0; i < 5; i++) B.at(X + 9.2, groundY(X + 9.2) + 0.02 + i * 0.035, 1.5).torus(0.28 - i * 0.015, 0.03, C.cable, 0, 0, 0, Math.PI / 2, 0, 0, 6.2832, 18);
  B.mesh(G.front);
  yield;
  // ---------------- 出了门：一道坡 ----------------
  const O = [EX + 4, X + 140];
  B = baker();
  for (let x = O[0]; x < O[1]; x += rr(2, 4)) { const z = rnd() < 0.5 ? rr(-2.4, -0.7) : rr(0.7, 2.2); stone(B, x, z, rr(0.06, 0.15), { col: C.stone, moss: 0x4a4e3a }); }
  B.mesh(G.floor);
  const tf = []; for (let x = O[0]; x < O[1]; x += rr(0.8, 1.6)) { const z = rnd() < 0.5 ? rr(-2.8, -0.6) : rr(0.6, 2.8); for (let i = 0, n = 3 + Math.floor(rnd() * 5); i < n; i++) { const xx = x + rr(-0.35, 0.35); tf.push([xx, groundY(xx), z + rr(-0.12, 0.12), pick(['dry', 'grass', 'seed']), rr(0.14, 0.42), pick(C.dry)]); } }
  plants(G.floor, tf);
  B = baker(); oldFence(B, O[0] + 3, O[0] + 12, -2.0, { broken: 2, post: 0x3e3830 }); oldFence(B, O[0] + 22, O[0] + 30, -2.2, { post: 0x3e3830 }); B.mesh(G.behind);
  const tall = []; for (let x = O[0]; x < O[1]; x += rr(1.6, 3.2)) for (let i = 0, n = 3 + Math.floor(rnd() * 4); i < n; i++) { const xx = x + rr(-0.3, 0.3); tall.push([xx, groundY(xx), rr(1.3, 2.6), pick(['seed', 'grass', 'dry']), rr(0.4, 0.7), pick(C.dry)]); }
  plants(G.front, tall);
  yield;
  // ---------------- 会动的 ----------------
  const pp = []; for (const [a, b] of ROOMS) for (let x = a; x < b; x += rr(2.5, 4.5)) pp.push([x, rr(-0.9, 1.0), 'paper', C.paper]);
  mkLoose(G.alive, L, pp, { glow: 0.05 });
  const hp = []; for (let x = O[0] + 1; x < O[1]; x += rr(2, 4)) hp.push([x, rr(-1.4, 1.6)]);
  mkHoppers(G.alive, L, hp, { col: 0x8a8a6a });
});

// ---- 第九章 · 山洞与暗河（只摆在干的岩石上：水潭、潜水的地方都空着）----
// 脚下：碎石和小石子、湿了的几片地、一截旧绳子。
// 身后：大大小小的石头和石笋；第二段（别人留下的灯）有一只锈了的水桶、一盘绳子、一盏熄了的马灯；第六段（铁锈水）倒着几根旧矿洞的木支架。
// 身前：剖面前面那一点地上的小石笋和石头（剖面在 z = 2.4，东西只能放到 2 以内）。
// 会动的：洞里的蟋蟀（灰白色），走近就蹦开
feetZone(9, [X9 - 8, X9 + 345], function* (G, L) {
  const X = X9, C = { rock: 0x4e5256, rock2: 0x5a5a56, spike: 0x55595a, rust: 0x6a4a36, wood: 0x4e3e2e };
  const DRY = [[-5, 9], [23.8, 46.6], [62.7, 84.8], [99.1, 121.6], [138.6, 154.6], [176.8, 196.6], [210.4, 235.6], [268.8, 284.6], [300.6, 334]].map(([a, b]) => [X + a, X + b]);
  const ok = x => { const w = waterAt(x); return (!w || groundY(x) > w.y + 0.05) && ceilY(x) - groundY(x) > 1.9 && Math.abs(groundSlope(x)) < 0.35; };
  // ---------------- 脚下 ----------------
  let B = baker();
  for (const [a, b] of DRY) for (let x = a + 0.4; x < b - 0.4; x += rr(1.4, 3)) if (ok(x)) { const z = rnd() < 0.55 ? rr(-2.4, -0.6) : rr(0.6, 1.8); stone(B, x, z, rr(0.05, 0.13), { col: pick([C.rock, C.rock2]), moss: 0x4a5048, mk: 0.3 }); scatter(B, x, z, 6, 0.5, ['stone'], [0x6a6c6a, 0x52565a]); }
  ropeCoil(B, X + 33.5, 0.9, { col: 0x7a6a4c });
  B.mesh(G.floor);
  for (const [a, b] of DRY) stains(G.floor, a, b, -2.6, 2.2, Array.from({ length: Math.max(1, Math.round((b - a) / 8)) }, () => [rr(a + 1, b - 1), rr(-1.8, 1.4), rr(0.8, 1.6), rr(0.3, 0.6), 0.25]), { rgb: '10,14,16', k: 1.4 });
  yield;
  // ---------------- 身后 ----------------
  B = baker();
  for (const [a, b] of DRY) for (let x = a + 1; x < b - 1; x += rr(3, 6)) if (ok(x)) {
    const t = rnd(), z = rr(-2.8, -1.3);
    if (t < 0.45) stone(B, x, z, rr(0.25, 0.55), { col: pick([C.rock, C.rock2]), moss: 0x4a5048, mk: 0.4 });
    else if (t < 0.85) { stalagmite(B, x, z, rr(0.5, 1.3), { col: C.spike }); if (rnd() < 0.5) stalagmite(B, x + rr(0.3, 0.6), z + rr(-0.3, 0.3), rr(0.25, 0.6), { col: C.spike }); }
    else stone(B, x, z, rr(0.15, 0.3), { col: C.rock });
  }
  bucket(B, X + 29.2, -1.7, { col: C.rust, tip: true, yaw: 0.8 }); lantern(B, X + 31.6, -1.5, { tip: true }); ropeCoil(B, X + 36.8, -1.9, { col: 0x7a6a4c }); lantern(B, X + 40.4, -1.6);
  for (const [x, z, len, yaw, tilt] of [[X + 214.5, -2.0, 2.4, 0.2, 0], [X + 219.2, -1.8, 2.0, -0.4, 0.15], [X + 226.4, -2.2, 2.6, 0.1, 0], [X + 272.5, -1.9, 2.2, 0.3, 0.1]]) timber(B, x, z, len, yaw, { tilt, col: C.wood });
  B.mesh(G.behind);
  yield;
  // ---------------- 身前 ----------------
  B = baker();
  for (const [a, b] of DRY) for (let x = a + 1.5; x < b - 1; x += rr(4, 8)) if (ok(x)) { if (rnd() < 0.5) stalagmite(B, x, rr(1.0, 1.7), rr(0.25, 0.55), { col: C.spike }); else stone(B, x, rr(0.9, 1.7), rr(0.14, 0.26), { col: pick([C.rock, C.rock2]), mk: 0.2 }); }
  B.mesh(G.front);
  yield;
  // ---------------- 会动的 ----------------
  const hp = []; for (const [a, b] of DRY) for (let x = a + 1; x < b - 1; x += rr(3, 6)) if (ok(x)) hp.push([x, rr(-1.6, 1.4)]);
  mkHoppers(G.alive, L, hp, { col: 0xb8b0a0, glow: 0.3, s: 2.6 });
});
