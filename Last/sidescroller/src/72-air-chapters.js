
// ============================================================
//  空中的细节（三）：每一章摆什么
//  每一章一组，和那一章的画面占同一段 x，跟着那一章一起搭建、释放。组里每样东西有个名字：
//  dust 光里的尘埃 / leaves 落叶 / seeds 草籽的绒毛 / scraps 纸片和塑料袋 / sand 风沙 / birds 会被惊飞的鸟 / flock 远处的鸟群 /
//  gnats 蠓虫 / moths 飞蛾 / flies 苍蝇 / dragonflies 蜻蜓 / butterflies 蝴蝶 / swallows 燕子。
//  看图工具（Last/tools/air-sheet.html）可以整组关掉，或者只留其中几样来比较
// ============================================================
// show：镜头在这一段 x 里才显示（每一章的出入口有一面黑墙，镜头穿过它的时候换成下一章的光，空中的东西也跟着换）
function airZone(n, vis, show, make) {
  const S = { sys: [], on: true, keep: null };
  const apply = () => { for (const s of S.sys) { const v = S.on && (!S.keep || S.keep.includes(s.name)); if (s.pts) s.pts.visible = v; if (s.root) s.root.visible = v; } };
  const z = defZone({ n: OLD + n, vis, air: true,                                     // n 是旧原型的章节号
    *build(R) { S.sys = []; yield* make(R, S.sys); apply(); },
    update(dt) { if (!z.root) return; z.root.visible = camera.position.x > show[0] && camera.position.x < show[1]; if (z.root.visible) for (const s of S.sys) s.step(dt); },
    reset() { for (const s of S.sys) if (s.reset) s.reset(); }, solve() { z.reset(); },
    unbuild() { for (const s of S.sys) if (s.dispose) s.dispose(); S.sys = []; },
    show(on) { S.on = on; apply(); }, only(names) { S.keep = names; apply(); } });
  return z;
}
// 停在布景板上画出来的东西顶上的一排鸟（剪影）。o.near：在 x 左右这么宽的范围里找最高的那一处（树枝的梢）；o.minY 比这还低的就不放
function flat(zoneN, z, xs, o = {}) {
  const top = x => boardTop(OLD + zoneN, z, x, o.yMax ?? 99, o.solid ?? 170);        // zoneN 是旧原型的章节号
  return xs.map(x0 => {
    let x = x0, y = top(x0);
    if (o.near) for (let d = -o.near; d <= o.near; d += 0.08) { const yy = top(x0 + d); if (yy !== null && (y === null || yy > y + 0.02)) { x = x0 + d; y = yy; } }
    return [o.kind ?? 'crow', x, y, z + 0.08, { flat: o.c, s: o.s ?? 1.3, flee: o.flee ?? 4, dy: o.dy ?? 30, toZ: o.toZ ?? -4, face: x0 % 2 > 1 ? 1 : -1 }];
  }).filter(b => b[2] !== null && b[2] > (o.minY ?? -99));
}

// ---- 第一章 · 工厂 ----
// 天窗漏下来的光里、探照灯扫过的光束里，飘着慢慢往下落的灰；天花板上几处一直漏着细细的一缕灰；压机砸下去，上面震下一阵灰。
// 推车上那盏暖色吊灯边绕着几只飞蛾。鸽子停在行车梁上、上层通道的栏杆上（机器人跑过去就飞）、输送带的罩子上（压机一砸就飞几只）、
// 探照灯场地后面高高的桁架上（警报一响就飞）
airZone(1, [-40, 105], [-60, 104.6], function* (R, sys) {
  const L = [];
  for (const [x, w, a] of [[3.5, 3.4, 0.2], [30.5, 3.8, 0.17], [44.5, 3.4, 0.15], [18.5, 2.6, 0.1], [89.4, 3.2, 0.13]])        // 和天窗光柱那块布景板上的五道光对齐
    L.push({ k: 'slab', x0: x + 0.1, x1: x + 1.65, y0: 0, y1: 9, w0: w / 2 + 0.1, w1: lerp(w / 2 + 0.1, 0.45, 0.56), z0: -2.6, z1: 2.2, c: 0xcfe2e6, a: a * 4 });
  L.push({ k: 'cone', at: () => [beam.position.toArray(), beam.target.position.toArray(), beam.intensity > 0 ? 1 : 0], ang: 0.125, c: 0xe8f3f5, a: 1.2, w: 4 });
  L.push({ k: 'ball', p: [33, 5.3, -2.8], r: 2.6, c: 0xffc27a, a: 0.9, w: 0.6 });
  for (const [x, y, z] of [[12.4, 7, -1.4], [38.6, 7.5, -2.2], [69.2, 8, -7], [74.6, 8, -4], [96.6, 8, -3]]) L.push({ k: 'drip', p: [x, y, z], spread: 0.06, c: 0xb8c8cc, a: 0.55, w: 0.3 });
  const slam = () => CH1.LINE.phase === 'slam' || (CH1.LINE.phase === 'rise' && CH1.LINE.t < 1);
  for (const dx of [-1, 0, 1]) L.push({ k: 'drip', p: [101.9 + dx, 8.2, -5.2], spread: 0.55, c: 0xc4ccc8, a: 0.7, w: 4, on: slam });
  sys.push(litDust(R, 520, L)); yield;
  sys.push(airMoths(R, [[33, 5.55, -3.05, 5]], { c: 0xffd29a }));
  const B = [];
  for (const [x, f] of [[14.6, 1], [15.2, -1], [23.0, 1], [23.6, -1], [24.3, 1], [36.4, -1], [37.1, 1]]) B.push(['pigeon', x, 5.76, -3.12, { face: f, dy: 7, toZ: -3 }]);        // 行车梁
  for (const [x, f] of [[6.5, 1], [7.2, -1], [28.1, -1], [28.8, 1]]) B.push(['pigeon', x, 4.43, -5.0, { face: f }]);                                          // 上层通道的栏杆
  for (const x of [82.7, 83.4, 84.1]) B.push(['pigeon', x, 7.1, -5.2, { dy: 8, flee: 2.5 }]);                                                               // 输送带的罩子
  for (const x of [64.2, 64.9, 65.5, 76.4, 77.2]) B.push(['pigeon', x, 9.55, -24.9, { flee: 0, flat: 0x0a1012, s: 1.4, toZ: -2 }]);                         // 高处的行车桁架
  const birds = airBirds(R, B, { spread: 5 }); sys.push(birds);
  sys.push({ name: 'birds', step() { if (state === 'play') for (const r of CH1.RUN1.list) if (r.live) birds.scare(r.x, 1.8, 1, 4.4, 1); } });   // 机器人从栏杆边跑过去：只惊动栏杆上的
});

// ---- 第二章 · 林地水闸 ----
// 坡上：清晨的逆光里飘着草籽的绒毛；一群乌鸦远远地朝巨像那边飞；近处电线杆的横担上、远处的高压线上停着乌鸦，走近了就飞起来。
// 林子里：叶子一片片往下落（大半是地上那一层自己飘的）；枝叶间漏下来的光里有灰、有一团团发亮的蠓虫；林子边上枯树上停着乌鸦，地上几只麻雀在啄食。
// 水闸：水面上几只蜻蜓，悬停一下、猛地一窜
airZone(2, [X2, X3 + 4], [X2 + 0.7, X3 + 2], function* (R, sys) {
  const cx = () => camera.position.x;
  sys.push(airLeaves(R, { name: 'seeds', n: 18, drift: true, tiles: [8], cols: [0xfff3df, 0xffe8c8], size: [0.08, 0.13], z: [-4, 5], lo: 0.3, hi: 3.2, lift: 0.25, wind: () => -1.1, on: () => cx() < X2 + 74, a: 0.9 }));
  sys.push(airFlock(R, [{ x1: X2 + 10, x2: X2 + 160, y: 24, z: -95, v: 2.6, n: 7, gap: 18, s: 1.7, c: 0x2e2a28 }], { on: () => 1 - sstep(X2 + 70, X2 + 82, cx()) }));
  sys.push(airLeaves(R, { n: 18, xs: [[199, 221], [256, 284]], cols: [0x9a7a3c, 0x7a5e2e, 0xb08a48, 0x6a5a30], z: [-5, 5] })); yield;   // 林子里另外两段的落叶是地上那一层自己飘的（46-ground.js 的 fallingLeaves），这里只补水闸那一屏和更远的一段
  const L = [];
  for (const [x, w, a] of [[188, 3.2, 0.16], [201, 4.4, 0.2], [216, 3.6, 0.15], [231, 2.8, 0.12], [246, 4, 0.14]])                                       // 林间的光柱（z = -2.6 那块板）
    L.push({ k: 'slab', x0: x, x1: x + 2.28, y0: 0, y1: 9, w0: w / 2, w1: lerp(w / 2, 0.7, 0.53), z0: -3.6, z1: -1.6, c: 0xfff0d0, a: a * 5 });
  for (const [x, w, a] of [[202.6, 2.6, 0.5], [206.3, 1.3, 0.26], [210.4, 2.8, 0.38], [214.2, 1.1, 0.22], [217.4, 2.2, 0.32]])                             // 水闸那一屏的五束光（z = -1.6）
    L.push({ k: 'slab', x0: x, x1: x - 4.05, y0: 0, y1: 9, w0: w / 2, w1: lerp(w / 2, w * 0.2, 0.56), z0: -2.6, z1: -0.6, c: 0xffeccc, a: a * 2.6 });
  sys.push(litDust(R, 340, L, { c: 0xfff0d0 }));
  sys.push(airGnats(R, [[187.4, 2.4, -2.4, 14], [201.6, 1.9, -1.4, 16], [209.4, 2.2, -1.8, 14], [216.5, 1.6, -1.1, 12], [231.6, 2.1, -2.2, 12]], { add: false, c: 0x2a2620, a: 0.8, size: 1.5 }));   // 背后是发白的雾：画成小黑点才看得见
  sys.push(airDarters(R, 4, [206.4, 215.5, 0.25, 1.4, -9, -0.5], { kind: 'dragon', abs: true, cols: [0x2f6f86, 0x3f6f3a, 0x8a3a2a] })); yield;
  const B = [];
  for (const [xc, k] of [[116.66, [0.5]], [126.72, [-0.55, 0.5]], [147.56, [-0.5, 0.55]]]) for (const d of k) B.push(...flat(2, -11, [xc + d], { c: 0x151516, s: 1.25, flee: 4.5, yMax: 14 }));   // 电线杆的横担
  B.push(...flat(2, -52, [128, 129.2, 130.1, 136.5, 137.4], { c: 0x1e1d1f, s: 1.6, flee: 7, yMax: 30, solid: 60, toZ: -6 }));                                // 高压线
  B.push(...flat(2, -11, [166.2, 172.2, 174.0, 181.0], { c: 0x151516, s: 1.3, flee: 4.5, yMax: 14, near: 0.7, minY: 3 }));                                                       // 林子边上的枯树
  for (const [x, z] of [[181.2, 1.2], [181.8, 0.9], [182.6, 1.5], [189.7, -0.8], [190.3, -0.5]]) B.push(['sparrow', x, null, z, { flee: 3, s: 1.25 }]);   // 地上啄食的麻雀
  sys.push(airBirds(R, B, { spread: 5 }));
});

// ---- 第三章 · 围墙与废料场 ----
// 出了林子，风大起来：贴着地面一阵阵刮过去的沙，地上一片片流动的沙纹，刮阵风的时候更密更快；纸片和塑料袋顺着风翻滚。
// 残墙顶上停着两只乌鸦，翻上墙头就飞；墙外枯树上也有几只；废料场上空几只乌鸦在慢慢盘旋
airZone(3, [X3 - 6, X4 + 6], [X3 - 4, X4 + 1], function* (R, sys) {
  const where = () => sstep(X3 + 16, X3 + 34, camera.position.x) * (1 - sstep(X4 - 16, X4 - 3, camera.position.x));   // 风沙从林子外面开始，进旧城以前停下
  const gust = () => where() * gustAt(T);                                  // 和风声、树叶声同一阵风（36-lights-fx.js 的 gustAt）
  const wind = { wind: -3.8, gust };
  sys.push(airSand(R, { n: 520, ...wind }));
  sys.push(sandSheet(R, X3 + 10, X3 + 56.3, -8, 9, wind), sandSheet(R, X3 + 58.9, X4, -8, 9, wind)); yield;
  sys.push(airLeaves(R, { name: 'scraps', n: 4, drift: true, tiles: [6, 6, 7], cols: [0xe8e2d4, 0xd8d0c0, 0xcfd6d0], size: [0.22, 0.4], z: [-5, 4], lo: 0.05, hi: 2.4, lift: 0.3, wind: () => -2.4 * (0.4 + gust()), on: () => where() > 0.5 }));
  sys.push(airFlock(R, [{ orbit: [X3 + 86, 15, 9], z: -38, v: 3.2, n: 3, s: 1.5, c: 0x2a2622 }], { on: where }));
  const W = X3 + 44, B = [['crow', W + 3.6, 2.3, -0.9, { flee: 2.6, noise: 0, face: -1 }], ['crow', W + 4.3, 2.3, -0.4, { flee: 2.6, noise: 0, face: 1 }]];   // 残墙顶上（追犬一直在叫，它们听惯了）
  B.push(...flat(3, -13, [X3 + 63.5, X3 + 64.6, X3 + 71.1], { c: 0x39352f, s: 1.3, flee: 5, yMax: 16, near: 0.6, minY: 2.5 }));
  sys.push(airBirds(R, B, { spread: 3 }));
});

// ---- 第四章 · 配给街 ----
// 街上一群群鸽子在啄食，走近了呼啦一下飞上楼（慢慢走能凑得更近）；监控连到卷帘的那根线上也停着几只，遮阳布一落下来就飞；
// 纸片顺着街吹过来；监控的光束扫到哪，哪里的灰就亮起来
airZone(4, [X4 - 6, X5 + 6], [X4 - 4, X5 + 1], function* (R, sys) {
  const POLE = X4 + 24, BARR = X4 + 37;
  const camL = LIGHTS.find(l => l.spot && Math.abs(l.p[0] - (POLE - 0.85)) < 0.01 && Math.abs(l.p[1] - 4.9) < 0.01);
  if (camL) sys.push(litDust(R, 150, [{ k: 'cone', at: () => [camL.p, camL.t, camL.on], ang: 0.15, c: 0xe2eef2, a: 1.1 }]));
  sys.push(airLeaves(R, { name: 'scraps', n: 3, drift: true, tiles: [6], cols: [0xe6e8e4, 0xd8dcd8], size: [0.2, 0.32], z: [-4, 4], lo: 0.02, hi: 1.4, lift: 0.2, wind: () => -1.3 }));
  const wire = new THREE.CatmullRomCurve3([[POLE, 5.2, -1.6], [POLE + 4, 6.6, -1.7], [POLE + 9, 6.2, -1.7], [BARR + 0.3, 6.5, -1.2]].map(p => V3(...p)), false, 'catmullrom', 0.2);   // 和那一章的那根线一样
  const B = [];
  for (const [x, z] of [[5.4, 1.4], [6.1, 0.9], [6.6, 1.9], [7.4, 1.2], [8.3, 1.6], [8.9, 0.8], [27.6, 1.0], [28.3, 1.6], [29.0, 0.7], [46, 1.2], [46.8, 0.6], [47.5, 1.7], [52, 1.0], [52.7, 1.5]])
    B.push(['pigeon', X4 + x, null, z, { flee: 2.8, face: x % 1.4 > 0.7 ? 1 : -1 }]);
  for (const t of [0.24, 0.29, 0.34, 0.58, 0.63]) { const p = wire.getPoint(t); B.push(['pigeon', p.x, p.y + 0.035, p.z, { dy: 8, flee: 2.4, face: t > 0.5 ? -1 : 1 }]); }
  sys.push(airBirds(R, B, { spread: 4 }));
});

// ---- 第五章 · 维修巷 ----
// 三盏吊灯的光里飘着灰，每盏灯边绕着几只飞蛾；后墙的管子上停着几只鸽子
airZone(5, [X5 - 4, X6 + 4], [X5 - 3, X6 + 1], function* (R, sys) {
  const LAMPS = [X5 + 10, X5 + 24, X5 + 34];                                              // 和那一章的吊灯一样
  sys.push(litDust(R, 140, LAMPS.map(x => ({ k: 'cone', at: () => [[x, 5.6, 0.6], [x, 0, -0.5], 1], ang: 0.45, c: 0xcfe2ea, a: 0.65 })), { size: 0.7 }));   // 灯就在主角头顶：灰离镜头近，画小一点、少一点
  sys.push(airMoths(R, LAMPS.map(x => [x, 5.5, 0.2, 4]), { c: 0xe6f0f4 }));
  sys.push(airBirds(R, [['pigeon', X5 + 12.4, 3.89, -4.3, { dy: 6, face: -1 }], ['pigeon', X5 + 13.0, 3.89, -4.3, { dy: 6, face: 1 }], ['pigeon', X5 + 28.6, 3.89, -4.3, { dy: 6 }],
    ['pigeon', X5 + 41.5, 6.83, -4.3, { dy: 9 }], ['pigeon', X5 + 42.1, 6.83, -4.3, { dy: 9, face: 1 }]], { spread: 3 }));
});

// ---- 第六章 · 供水街区 ----
// 两只监控的光束里有灰；死猪上空一团苍蝇乱冲，时不时落下来；漏水的管子边一团小黑虫；长管子上停着一排麻雀，街上几只鸽子。
// 走到城市的边缘：草籽的绒毛和几片叶子飘起来，草上有了蝴蝶，一群鸟朝花园那边飞
airZone(6, [X6 - 6, X7 + 6], [X6 - 4, X7 + 1.1], function* (R, sys) {
  const MAN = X6 + 61.6, LEAK = X6 + 50, cx = () => camera.position.x;
  const cams = [X6 + 27, X6 + 35].map(x => LIGHTS.find(l => l.spot && Math.abs(l.p[0] - (x - 0.85)) < 0.01 && Math.abs(l.p[1] - 4.7) < 0.01)).filter(Boolean);
  sys.push(litDust(R, 200, cams.map(l => ({ k: 'cone', at: () => [l.p, l.t, l.on], ang: 0.16, c: 0xe2eef2, a: 1.1 }))));
  sys.push(airFlies(R, 10, [MAN + 1.15, 0.66, -0.62, 0.6, 0.3, 0.35], { land: 0.47, size: 1.6 }));   // 真的苍蝇在这个距离上不到一个像素：放大到看得见
  sys.push(airGnats(R, [[LEAK + 0.7, 1.1, -0.3, 16]], { add: false, c: 0x161818, a: 0.85, size: 1.3 }));
  sys.push(airLeaves(R, { name: 'seeds', n: 12, drift: true, tiles: [8], cols: [0xfff6e6], size: [0.08, 0.12], z: [-4, 4], lo: 0.4, hi: 3, lift: 0.2, wind: () => -0.8, on: () => cx() > X6 + 72, a: 0.9 }));
  sys.push(airLeaves(R, { n: 14, xs: [[X6 + 80, X7 - 2]], cols: [0x9ab04a, 0xc8b04a, 0x7a9a3a], z: [-5, 3] }));
  sys.push(airDarters(R, 5, [X6 + 84, X7 - 3, 0.3, 1.2, -2.5, 2.5], { cols: [0xffffff, 0xf4d24a, 0xffffff, 0xf0a040], size: 1.5 }));
  sys.push(airFlock(R, [{ x1: X6 + 50, x2: X7 + 30, y: 17, z: -70, v: 2.4, n: 6, gap: 22, s: 1.5, c: 0x3a3a3c }]));
  const B = [];
  for (const [x, f] of [[44.6, 1], [45.1, -1], [45.7, 1], [53.4, -1], [54.0, 1]]) B.push(['sparrow', X6 + x, 3.19, -0.7, { dy: 5, face: f, s: 1.3 }]);   // 长管子上
  for (const [x, z] of [[23.2, 1.2], [23.9, 0.8], [24.6, 1.7], [25.4, 1.1]]) B.push(['pigeon', X6 + x, null, z, { flee: 2.8 }]);
  sys.push(airBirds(R, B, { spread: 3 }));
});

// ---- 第七章 · 管理花园 ----
// 白天：花垄上飞着蝴蝶，阳光里飘着草籽的绒毛，几只燕子贴着草坪兜圈子，树篱前面有蜻蜓。
// 黄昏：野林子里的叶子往下落，低低的阳光里一团团发亮的蠓虫（萤火虫在环境里，天一暗就出来）
airZone(7, [X7 - 6, X8 + 4], [X7 - 3, X8 + 1], function* (R, sys) {
  const cx = () => camera.position.x, day = () => 1 - sstep(X7 + 66, X7 + 86, cx()), dusk = () => sstep(X7 + 58, X7 + 72, cx());
  sys.push(airDarters(R, 8, [X7 + 3, X7 + 43, 0.7, 1.5, -7.6, -3.3], { cols: [0xffffff, 0xfff3a0, 0xffd84a, 0xf0a040, 0xffffff], size: 1.6 }));   // 飞得比花高一点，衬在深绿的树篱前面
  sys.push(airLeaves(R, { name: 'seeds', n: 14, drift: true, tiles: [8], cols: [0xffffff], size: [0.09, 0.13], z: [-6, 5], lo: 0.3, hi: 1.8, lift: 0.2, wind: () => -0.5, on: () => day() > 0.5, a: 0.95 }));   // 低一些：衬在树篱和草地前面才看得见（天是亮的）
  sys.push(airSwallows(R, 3, X7 + 22, -4.5, { on: day }));
  sys.push(airDarters(R, 3, [X7 + 6, X7 + 42, 0.6, 1.6, -5.2, -2.6], { kind: 'dragon', cols: [0x2f7fa0, 0x3a8a4a] }));
  sys.push(airLeaves(R, { n: 26, xs: [[X7 + 62, X8 - 8]], cols: [0xc8a048, 0xd88a3a, 0x8aa040, 0xa86a30], z: [-5, 4], on: () => dusk() > 0.5 }));
  sys.push(airGnats(R, [[X7 + 70, 1.4, -1.5, 14], [X7 + 88, 1.8, -2.5, 16], [X7 + 101, 1.3, -1.2, 12]], { c: 0xffd9a0, a: 0.85, on: dusk }));
});

// ---- 第八章 · 生态中枢 ----
// 中枢里：挡在发光的墙和那盏大圆灯前面的灰，逆着光一粒粒发亮。
// 出了门：坡顶那棵落光了叶子的老树上停着几只乌鸦，最后几片叶子往下掉；一群乌鸦朝着余晖飞回去（天黑透以前）
airZone(8, [X8 - 6, X8 + 232], [X8 + 1, X8 + 240], function* (R, sys) {
  const D1 = X8 + 20, D2 = X8 + 44, D3 = X8 + 70, EX = X8 + 96, SUNX = X8 + 85.5, SUNR = 7.9, ROOMS = [[X8 - 2, D1, 0.3], [D1, D2, 0.42], [D2, D3, 0.56]];   // 和那一章一样
  const lum = (x, y) => {                                 // 后墙上这一点有多亮：核心是那盏圆灯（下半个圆在地面以下），前三间是一整面光墙
    if (y < -0.3) return 0;
    if (x > D3) { const d = Math.hypot(x - SUNX, y) / SUNR; return d < 0.97 ? 0 : 0.9 * (1 - sstep(0.97, 1.9, d)); }       // 灯面本身已经白透了，亮的灰只在它边上的那一圈
    for (const [a, b, k] of ROOMS) if (x > a && x < b) return k * 1.6 * lerp(1, 0.15, clamp(y / 20, 0, 1));
    return 0;
  };
  sys.push(litDust(R, 260, [{ k: 'back', z: -25.9, lum, box: [X8 + 1, EX - 0.8, 0.05, 6.5, -5, 3], c: 0xeefafd, a: 1, on: () => camera.position.x < EX + 1 }]));
  const disc = (x, y) => y > -0.3 && Math.hypot(x - SUNX, y) < SUNR * 0.97 ? 1 : 0;                                         // 挡在圆灯前面的灰：逆着白光是一粒粒暗点
  sys.push(litDust(R, 120, [{ k: 'back', z: -25.9, lum: disc, box: [D3 + 2, EX - 1, 0.05, 6.5, -5, 3], c: 0x22323a, a: 1.4, on: () => camera.position.x > D3 - 6 && camera.position.x < EX + 1 }], { add: false, size: 0.8 }));
  sys.push(airLeaves(R, { n: 5, xs: [[X8 + 129, X8 + 140]], cols: [0x5a4430, 0x6e5236, 0x3e3024], fall: [0.3, 0.55], z: [-3.8, -2.9], size: [0.07, 0.1], wind: () => -0.35 }));
  sys.push(airFlock(R, [{ x1: X8 + 70, x2: X8 + 230, y: 19, z: -85, v: -3, n: 9, gap: 20, s: 1.5, c: 0x1c1a24 }], { on: () => 1 - CH8.END.deep }));
  sys.push(airBirds(R, flat(8, -3.4, [X8 + 131.6, X8 + 133.2, X8 + 136.0, X8 + 137.8], { c: 0x0a0b0a, s: 1.15, flee: 3, dy: 12, yMax: 14, toZ: -3, near: 0.6, minY: 6 }).map(b => (b[4].back = 25, b))));
});

// ---- 第十章 · 吊绳与高台 ----
// 风从右边吹过来：雾里飘着草籽的绒毛；远处一群乌鸦往台阶深处飞。
// 能爬的那三根吊臂的管头上停着乌鸦：主角在下面走过去不理他，爬到快够着管头了才飞走；往里第一排吊臂上、最高一级尽头的栏杆上也停着几只
airZone(10, [X10 - 10, X10 + 104], [X10 - 8, X10 + 150], function* (R, sys) {
  sys.push(airLeaves(R, { name: 'seeds', n: 16, drift: true, tiles: [8], cols: [0xe6e8e2, 0xd8dcd4], size: [0.07, 0.11], z: [-4, 5], lo: 0.3, hi: 4, lift: 0.3, wind: () => -1.0, a: 0.85 }));
  sys.push(airFlock(R, [{ x1: X10 - 20, x2: X10 + 150, y: 26, z: -110, v: 2.2, n: 9, gap: 16, s: 1.8, c: 0x3a4240 }])); yield;
  const B = [];
  for (const [r, S] of CH10.NEAR) {                      // 管头上（离滑车不远的那一段平管）
    const big = r === CH10.R3, k = big ? 1.4 : 1, arm = r.top + 0.38, y = arm + 0.065 * k;
    for (const d of big ? [0.3, 0.95] : r === CH10.R1 ? [0.5] : [0.32]) B.push(['crow', r.x + d, y, 0, { face: d > 0.5 ? 1 : -1, flee: 2.4, dy: 2.2, toZ: -5 }]);
  }
  for (const d of CH10.DECO) if (d.z === -15 && d.S !== CH10.S1) B.push(['crow', d.rx + 0.45, d.arm + 0.065, d.z, { flee: 5, dy: 4, toZ: -12 }]);
  for (const [dz, f] of [[-3.6, 1], [-5.1, -1]]) B.push(['crow', X10 + 99.9, 11.8 + 1.72 + 0.03, dz, { face: f, flee: 3.5, dy: 3, toZ: -14 }]);   // 尽头的栏杆
  sys.push(airBirds(R, B, { spread: 3 }));
});

// ---- 第十一章 · 夜搜 ----
// 探照灯的光柱里一粒粒发亮的灰。直升机压低了的时候，旋翼的风从它正下方贴着地面往四周吹：一道道灰、草屑和叶子被刮得满地跑。
// 路灯边绕着几只飞蛾，野地里飘着草籽的绒毛；电线杆上、候车亭顶上歇着几只乌鸦，直升机一来就全飞了。
// （萤火虫在环境里：直升机一来就不见了，它飞走以后再出来）
airZone(11, [X11 - 30, X11 + 170], [X11 - 60, X11 + 200], function* (R, sys) {
  const H = CH11.H, wash = () => 7 * H.near * clamp((camera.position.x - H.pos.x) / 7, -1, 1);       // 旋翼的风：背着直升机往两边吹
  sys.push(litDust(R, 420, [{ k: 'cone', at: () => [H.lamp, H.tgt, H.on], ang: 0.16, c: 0xe8f3f5, a: 1.25, shade: s => CH11.lit(s.x, s.y, s.z) }])); yield;   // 顶下面的灰照不到，不亮
  const ax = V3(), d = V3();
  sys.push(airCloud(R, 240, { name: 'wash', order: 44,
    init(s) { s.tile = 1; s.age = 1; s.life = 0; s.c = airCol(0x7f8c9a); },
    step(s, dt) {
      s.age += dt;
      if (s.age >= s.life) {                                 // 在直升机正下方的一圈里出生，朝外吹出去
        if (Math.random() > H.near) { s.a = 0; return; }
        const a = ar(0, 6.2832), r = ar(1.5, 4.5);
        s.x = H.pos.x + Math.cos(a) * r; s.z = H.pos.z + Math.sin(a) * r * 0.8; s.dx = Math.cos(a); s.dz = Math.sin(a); s.v = ar(6, 11);
        s.h = 0.04 + 0.9 * Math.pow(Math.random(), 2.2); s.age = 0; s.life = ar(1.0, 2.1); s.len = ar(0.14, 0.4); s.a0 = ar(0.25, 0.6); s.hp = ar(0, 6.28);
      }
      s.x += s.dx * s.v * dt; s.z += s.dz * s.v * dt; s.v *= Math.exp(-0.7 * dt); s.hp += dt * 9;
      s.y = groundY(s.x) + s.h + 0.05 * Math.abs(Math.sin(s.hp)); s.rot = 0.25 * Math.cos(s.hp) * Math.sign(s.dx || 1); s.size = s.len * (0.7 + 0.5 * H.near);
      ax.set(H.tgt[0] - H.lamp[0], H.tgt[1] - H.lamp[1], H.tgt[2] - H.lamp[2]).normalize(); d.set(s.x - H.lamp[0], s.y - H.lamp[1], s.z - H.lamp[2]);
      const t = d.dot(ax), inBeam = t > 0 ? 1 - sstep(0.5, 1.1, d.addScaledVector(ax, -t).length() / (t * Math.tan(0.16))) : 0;   // 吹进光柱里的那几道亮起来
      s.a = s.a0 * (0.35 + 1.1 * inBeam * H.on * CH11.lit(s.x, s.y, s.z)) * sstep(0, 0.15, s.age) * (1 - sstep(s.life - 0.6, s.life, s.age));
    } })); yield;
  sys.push(airLeaves(R, { name: 'seeds', n: 14, drift: true, tiles: [8], cols: [0xb9c6d8, 0xa8b6cc], size: [0.07, 0.11], z: [-5, 5], lo: 0.3, hi: 2.6, lift: 0.25, wind: () => -0.5 + wash(), a: 0.5 }));
  sys.push(airLeaves(R, { name: 'scraps', n: 16, drift: true, tiles: [2, 3, 4, 5], cols: [0x2e3a2a, 0x3a4630, 0x26301f], size: [0.06, 0.12], z: [-4, 4], lo: 0.05, hi: 1.8, lift: 0.3, wind: () => 1.4 * wash(), on: () => H.near > 0.25, a: 0.9 }));
  sys.push(airMoths(R, [[X11 + 11.5, 4.75, -1.35, 5]], { c: 0xffd29a })); yield;
  const B = [];
  for (const [x, f] of [[33.25, 1], [33.9, -1], [34.5, 1]]) B.push(['crow', X11 + x, 6.36, -4.4, { face: f, flee: 0, s: 1.3, toZ: -5, back: 9999 }]);     // 第三根电线杆的横担上
  for (const [x, f] of [[38.9, -1], [40.6, 1]]) B.push(['crow', X11 + x, 2.66, -0.6, { face: f, flee: 2.6, dy: 5, toZ: -4, back: 9999 }]);                           // 候车亭顶上
  const birds = airBirds(R, B, { spread: 8 }); sys.push(birds);
  sys.push({ name: 'birds', step() { if (H.st === 'hunt' && H.k > 0.35) birds.scare(X11 + 37, 12, 1); } });                 // 直升机飞近了：全惊飞
});
