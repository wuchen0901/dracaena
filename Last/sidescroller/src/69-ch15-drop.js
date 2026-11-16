// ============================================================
//  第二十三章 · 高台：箱子在上面（试验关，2026-11-16）
//  傍晚，一座废弃的货运站。路被一堵高墙挡住，光靠跳够不着墙头；墙脚是空的，唯一的一只箱子搁在路边的旧站台上。
//  先踩着一垛枕木跳上站台头上的水泥墩，再落到站台上 → 按住 E 把箱子往右推，推过站台的边，它翻下去、砸在地上 →
//  跳下去，把箱子推到墙脚 → 踩着箱子翻过墙头。墙那边是落下去的太阳
//  够得着够不着（50-player.js：起跳 7.5 米/秒、重力 23，跳起来脚最高离地 1.22 米；扒得住的边比脚高不过 1.2 个身高）：
//    地面 → 枕木（1.45）可以；地面 → 站台（2.9）、水泥墩（3.25）、墙头（3.4）都不行；枕木 → 水泥墩可以；箱子顶（1.05）→ 墙头可以
//  先单独放在最后，从章节菜单进（或者地址后面加 ?ch=23）
// ============================================================
const X15 = 2760;
const CH15 = (() => {
  const X = X15;
  const C = chapter({ n: OLD + 15, x0: X - 12, start: X + 1, name: '高台', sub: '箱子在上面', ground: 'gravel',
    intro() { CAT.state = 'none'; } });
  terrain([X - 40, 0], [X + 80, 0]);
  ground(X - 40, 0x5b4d40); ground(X + 26, 0x5e5142); ground(X + 80, 0x655743);
  solid({ x1: X - 12.6, x2: X - 11.6, y1: -2, y2: 30, noclimb: true });            // 两头的空气墙
  solid({ x1: X + 44, x2: X + 45, y1: -2, y2: 30, noclimb: true });
  chapterExit(OLD + 15, () => P.x > X + 41);                                        // 翻过高墙、走到头：黑一下，接到下一章（水下实验室）
  // 一垛枕木（踩上去的第一阶）→ 站台头上的水泥墩（第二阶；也把箱子挡在站台上，推不到左边去）→ 站台 → 高墙
  const STEP = solid({ id: 'sleepers', x1: X + 5.2, x2: X + 6.8, y1: 0, y2: 1.45, snd: 'wood' });
  const K = solid({ id: 'pier', x1: X + 6.8, x2: X + 7.6, y1: 0, y2: 3.25, snd: 'concrete' });
  const B = solid({ id: 'platform', x1: X + 7.6, x2: X + 15.5, y1: 0, y2: 2.9, snd: 'concrete' });
  const W = solid({ id: 'hwall', x1: X + 25, x2: X + 26.4, y1: 0, y2: 3.4, snd: 'concrete' });
  const BW = 1.05, X0 = K.x2 + 2.4;                                               // 箱子多大（方的：翻一个身还是一样的大小），一开始搁在哪
  const S = { st: 'top', a: 0, w: 0, cx: 0, cy: 0, vx: 0, vy: 0, slide: 0, bump: 0, shake: 0, over: false };   // st：top 在站台上 / tip 正翻过边 / fall 往下掉 / down 落到了地上；slide 落地后还往前蹭多快
  const onTop = () => S.st === 'top';
  const crate = pushable({ id: 'crate15', x: X0, y1: B.y2, w: BW, h: BW, plat: true, snd: 'wood',
    lo: () => onTop() ? K.x2 + BW / 2 + 0.01 : B.x2 + BW / 2 + 0.01,
    hi: () => onTop() ? B.x2 + 0.05 : W.x1 - BW / 2 });
  checkpoint(X + 1); checkpoint(W.x2 + 2.2);
  camKeys([X - 12, 16.5, 1.9, 0.5], [X + 3, 17, 2.1, 1.5], [X + 11, 18, 2.0, 2.2], [X + 20, 18.5, 2.2, 1.2], [X + 27, 17.5, 2.0, 1.5], [X + 44, 16.5, 1.8, 0.5]);
  // 傍晚：太阳压在墙那边，低低的暖光从右边斜着照过来；空气里一层黄灰
  const DUSK = { fog: 0x8c7869, fogD: 0.011, hemiS: 0xe6c2a2, hemiG: 0x3b2f29, hemiI: 0.85, keyC: 0xffc48c, keyI: 2.0, keyDir: [0.66, 0.42, 0.42], rimC: 0xffb070, rimI: 0.55,
    dustC: 0xf4cc9c, dustO: 0.42, wind: 0.35, ext: 1, sky: [0x3a3d57, 0x6b6175, 0xb58472, 0xe8a46c, 0xf5c27f, 0x775847], sunX: 0.34, sunY: 0.05, sunC: 0xffd8a0, sunP: 0.8,
    stars: 0, cloud: 0.45, cloudC: 0xffc7a0, birds: 0.25, flies: 0, vig: 1,
    aWind: 0.65, aWhis: 0.35, aLeaf: 0.15, leafDry: 1, aBug: 0.35, aDrip: 0, aFlow: 0, aRoom: 0, roomF: 210, aHum: 0, aCity: 0, aFar: 0.8, rvOut: 1, rvHall: 0, rvCave: 0 };
  env(X - 20, DUSK, true); env(X + 22, DUSK);
  env(X + 30, { ...DUSK, fogD: 0.008, hemiI: 1.0, keyI: 2.3, sunY: 0.08, sunP: 1.1, dustO: 0.5 }); env(X + 80, { ...DUSK, fogD: 0.008, hemiI: 1.0, keyI: 2.3, sunY: 0.08, sunP: 1.1, dustO: 0.5 });
  FAR[OLD + 15] = ['crow', 'rattle', 'creak', 'twig', 'crow'];
  // 箱子翻下去：先是一声木头蹭着水泥边的吱嘎，落地是闷闷的一下
  sfx.crateTip = () => { hit(700, 1.1, 0.12, 0.3); tone(240, 170, 0.05, 0.35, 'sawtooth'); };
  sfx.crateDrop = () => { hit(110, 0.6, 0.75, 0.55, 'lowpass'); tone(70, 30, 0.4, 0.5); hit(900, 1.2, 0.18, 0.12); snd('st:wood:l', { bus: 'fol', gain: 0.9, rate: 0.72, wet: 0.6 }); };

  const nearCrate = () => Math.abs(P.x - crate.x) < 2.6, atWall = () => crate.x >= W.x1 - BW / 2 - 0.9;
  hint(() => onTop() && P.y < 0.5 && P.x > W.x1 - 3.4 && P.x < W.x1, '墙太高了，跳不上去 —— 站台上搁着一只箱子');
  hint(() => onTop() && P.y < 0.5 && P.x > STEP.x1 - 2.4 && P.x < STEP.x2, '先跳上枕木，再跳上站台');
  hint(() => onTop() && P.y > 2.8 && P.mode !== 'push' && nearCrate(), '按住 <b>E</b> 推着箱子往右走，把它推下站台');
  hint(() => S.st === 'down' && !atWall() && P.y > 2.5 && P.x < B.x2 + 0.3, '跳下去，把箱子推到墙脚');
  hint(() => S.st === 'down' && !atWall() && P.y < 0.5 && P.x > B.x2 && P.x < W.x1 && P.mode !== 'push' && nearCrate(), '按住 <b>E</b> 把箱子推到墙脚');
  hint(() => S.st === 'down' && atWall() && P.x > W.x1 - 4.5 && P.x < W.x1 && P.y < 1.2 && P.mode !== 'push', '跳上箱子，再跳向墙头');

  let V = null;
  function* build(R) {
    const v = {};
    // ---- 远景：天边一溜矮山和旧城，几座高压线塔 ----
    backdrop(X - 130, X + 170, -6, 62, -170, 4, g => {
      setInk(g, vgrad(g, 22, 0, '#b48b7a', '#946f62'));
      ridge(g, X - 130, X + 170, -6, x => 9 + 4 * Math.sin(x / 19) + 2.2 * Math.sin(x / 6.7 + 2) + rr(-0.3, 0.3), 1.5);
      setInk(g, vgrad(g, 34, 0, '#a07e72', '#7b6159'));
      for (let x = X - 125; x < X + 60; x += rr(4, 10)) building(g, x, -6, rr(4, 9), rr(7, 26) * sstep(X + 70, X - 40, x), { holes: 0.25, gx: 2.6, gy: 3.6, win: 1.1, winH: 1.5, base: 8 });
      g.lineWidth = 0.35;
      for (const x of [X - 70, X - 8, X + 56, X + 120]) {                       // 高压线塔：一个细高的梯形，两道横担
        const h = rr(24, 30); line(g, [[x - 3, -6], [x - 0.6, h], [x + 0.6, h], [x + 3, -6]], 0.45);
        for (const k of [0.62, 0.82]) line(g, [[x - 4.5, h * k], [x + 4.5, h * k]], 0.4);
        line(g, [[x - 2.2, 0], [x + 1.4, h * 0.5], [x - 1.0, h * 0.62]], 0.3);
      }
      for (const [a, b] of [[X - 70, X - 8], [X - 8, X + 56], [X + 56, X + 120]]) for (const k of [0.62, 0.82]) cable(g, a - 4.5, 27 * k, b - 4.5, 27 * k, 1.4, 0.18);
    }, { fog: false, order: -2000, fadeL: 30, fadeR: 30 });
    yield;
    // ---- 中景：断掉的高架铁路、水塔、信号桥 ----
    backdrop(X - 60, X + 95, -4, 30, -48, 11, g => {
      setInk(g, '#6d5550');
      ridge(g, X - 60, X + 95, -4, x => 0.4 + rr(0, 0.9), 2.5);
      const deck = 7.4, end = X + 12;                                             // 高架的桥面：从左边伸过来，在站台后面断掉
      box(g, X - 60, deck, end - X + 60, 1.1);
      poly(g, [[end, deck], [end + 1.6, deck + 0.3], [end + 0.8, deck + 0.8], [end + 1.4, deck + 1.1], [end, deck + 1.1]]);
      g.lineWidth = 0.08; for (let i = 0; i < 7; i++) { const x = end + 0.4 + i * 0.25; line(g, [[x, deck + 0.4], [x + rr(-0.3, 0.6), deck - rr(0.6, 2.4)]], 0.08); }   // 断口上耷拉下来的钢筋
      for (let x = X - 54; x < end - 2; x += 9) { box(g, x - 0.6, 0, 1.2, deck); g.beginPath(); g.moveTo(x + 0.6, deck); g.quadraticCurveTo(x + 4.5, deck - 2.4, x + 8.4, deck); g.lineTo(x + 8.4, deck + 0.01); g.closePath(); g.fill(); }
      for (let x = X - 58; x < end; x += 1.3) line(g, [[x, deck + 1.1], [x, deck + 1.9]], 0.06);
      line(g, [[X - 60, deck + 1.75], [end - 0.4, deck + 1.75]], 0.08);
      // 水塔
      const tx = X + 36; for (const dx of [-2, 2]) line(g, [[tx + dx * 1.3, 0], [tx + dx * 0.8, 11]], 0.3);
      line(g, [[tx - 2.4, 4], [tx + 2.0, 8]], 0.12); line(g, [[tx + 2.4, 4], [tx - 2.0, 8]], 0.12);
      box(g, tx - 2.6, 11, 5.2, 4.2); poly(g, [[tx - 2.8, 15.2], [tx, 17], [tx + 2.8, 15.2]]); line(g, [[tx + 2.6, 14], [tx + 4.2, 14], [tx + 4.2, 4]], 0.1);
      // 信号桥：两根柱子架一道桁架，挂着几盏不亮的灯
      for (const x of [X - 30, X - 14]) box(g, x, 0, 0.5, 9);
      truss(g, X - 30, X - 13.5, 8.2, 1.1, 0.12);
      for (let x = X - 27; x < X - 15; x += 3) { box(g, x, 7.0, 0.5, 1.2); }
      // 墙那边：一片荒草地，一棵孤树
      tree(g, X + 64, 0.3, 9, 'round'); tree(g, X + 78, 0.3, 6, 'dead');
    }, { fadeL: 10, fadeR: 14 });
    yield;
    // ---- 近一层：道砟堆、一节没了轮子的车厢、电线杆 ----
    backdrop(X - 30, X + 62, -3, 16, -15, 20, g => {
      setInk(g, '#3b2f2d');
      ridge(g, X - 30, X + 62, -3, x => rr(0.05, 0.5), 0.8);
      heap(g, X - 26, X - 12, 0.2, 0.3, 1.9, 0.7); heap(g, X + 17, X + 23.5, 0.2, 0.2, 1.4, 0.6);
      // 车厢：箱体、门的轮廓镂空一圈细缝、底下的轮对
      box(g, X - 8, 0.9, 11, 3.6); g.clearRect(X - 3.6, 1.2, 2.2, 0.06); g.clearRect(X - 3.6, 1.2, 0.06, 3.0); g.clearRect(X - 1.46, 1.2, 0.06, 3.0);
      for (const x of [X - 6.6, X - 5.2, X + 0.2, X + 1.6]) disc(g, x, 0.55, 0.5);
      for (const x of [X - 14, X + 30, X + 50]) { line(g, [[x, 0], [x + rr(-0.2, 0.2), 9]], 0.22); line(g, [[x - 1.2, 8.2], [x + 1.2, 8.3]], 0.14); }
      cable(g, X - 14, 8.2, X + 30, 8.25, 1.2, 0.04); cable(g, X + 30, 8.25, X + 50, 8.3, 0.7, 0.04);
      grass(g, X - 30, X + 62, () => 0.2, 0.2, 0.9, 260);
    }, { fadeL: 6, fadeR: 8 });
    yield;
    // ---- 前景：贴着镜头的一溜草和一根歪了的桩子，虚的、近黑 ----
    backdrop(X - 22, X + 52, -3, 8, 6, 22, g => {
      setInk(g, '#0a0706');
      const top = [[X - 22, -5]];
      for (let x = X - 22; x <= X + 52; x += rr(0.4, 1.2)) { const h = rr(0.15, 0.5); top.push([x, h]); if (rnd() < 0.35) top.push([x + 0.05, h + rr(0.2, 0.8)], [x + 0.12, h]); }
      top.push([X + 52, -5]); poly(g, top);
      for (const x of [X + 4.5, X + 31.5]) { line(g, [[x, -2], [x + 0.6, 4.5]], 0.22); }
    }, { fog: false, blur: 2.2, order: 4000, fadeL: 6, fadeR: 6 });
    yield;

    // ---------------- 站台 ----------------
    const conc = lam(0x8a7d70), conc2 = lam(0x6e645a), edgeM = lam(0x9a8a4c), ZB = -4.2, ZF = 0.9, D = ZF - ZB, ZM = (ZB + ZF) / 2;
    add(R, bx(B.x2 - B.x1, B.y2, D), conc, (B.x1 + B.x2) / 2, B.y2 / 2, ZM);
    add(R, bx(B.x2 - B.x1 + 0.12, 0.16, D + 0.12), conc2, (B.x1 + B.x2) / 2, B.y2 - 0.08, ZM);                   // 站台沿上那一圈压顶
    add(R, bx(B.x2 - B.x1 + 0.1, 0.012, 0.22), edgeM, (B.x1 + B.x2) / 2, B.y2 + 0.004, ZF - 0.16, false);         // 磨淡了的黄线
    for (let x = B.x1 + 1.6; x < B.x2 - 0.5; x += 1.6) add(R, bx(0.03, B.y2 - 0.2, 0.02), MAT.wall2, x, (B.y2 - 0.2) / 2, ZF + 0.005, false);   // 站台前脸的伸缩缝
    for (let i = 0; i < 7; i++) add(R, bx(rr(0.2, 0.7), rr(0.5, 1.6), 0.02), lam(0x7d7064), rr(B.x1 + 0.5, B.x2 - 0.8), rr(0.4, 1.8), ZF + 0.008, false);   // 雨水冲出来的污渍
    // 站台上：后面一条锈了的铁轨（在玩法平面后面，箱子不碰它），枕木一根根露着
    for (const z of [-1.7, -3.1]) add(R, bx(B.x2 - B.x1 - 0.2, 0.12, 0.08), MAT.rust, (B.x1 + B.x2) / 2, B.y2 + 0.14, z);
    for (let x = B.x1 + 0.3; x < B.x2 - 0.2; x += 0.62) add(R, bx(0.22, 0.08, 2.0), MAT.wood2, x + rr(-0.04, 0.04), B.y2 + 0.04, -2.4).rotation.y = rr(-0.06, 0.06);
    // 站台头上的水泥墩：上面立着一根旧信号杆（在路后面）
    add(R, bx(K.x2 - K.x1, K.y2, D), conc2, (K.x1 + K.x2) / 2, K.y2 / 2, ZM);
    add(R, bx(K.x2 - K.x1 + 0.1, 0.12, D + 0.1), conc, (K.x1 + K.x2) / 2, K.y2 - 0.06, ZM);
    add(R, cy(0.07, 0.08, 4.2, 8), MAT.dark, (K.x1 + K.x2) / 2, K.y2 + 2.1, -1.6);
    { const arm = add(R, bx(1.3, 0.22, 0.05), lam(0x8c3a2a), (K.x1 + K.x2) / 2 + 0.55, K.y2 + 3.6, -1.52); arm.rotation.z = -0.5; }   // 垂下来的信号臂
    add(R, bx(0.36, 0.5, 0.3), MAT.steel, (K.x1 + K.x2) / 2, K.y2 + 1.4, -1.45);
    // 一块站牌
    add(R, bx(0.06, 1.9, 0.06), MAT.dark, B.x1 + 4.6, B.y2 + 0.95, -0.95); add(R, bx(0.06, 1.9, 0.06), MAT.dark, B.x1 + 6.2, B.y2 + 0.95, -0.95);
    add(R, bx(1.9, 0.55, 0.05), lam(0x2f4a4a), B.x1 + 5.4, B.y2 + 1.85, -0.92);
    plate(R, textTex('货运三站台', { w: 384, h: 96, size: 56, color: '#d8d6c6', worn: 15 }), 1.7, 0.43, B.x1 + 5.4, B.y2 + 1.85, -0.89, 0xb9b2a0, { fog: true, order: 1 });
    dragMarks(R, X0 - 0.2, B.x2 - 0.1, B.y2 + 0.005);
    yield;
    // ---------------- 枕木垛：五层，一层顺着放、一层横着放 ----------------
    for (let i = 0; i < 5; i++) {
      const y = 0.145 + i * 0.29, cross = i % 2 === 0;
      if (cross) for (let k = 0; k < 6; k++) add(R, bx(0.25, 0.27, 2.4), k % 2 ? MAT.wood : MAT.wood2, STEP.x1 + 0.14 + k * 0.265 + rr(-0.02, 0.02), y, -0.3 + rr(-0.12, 0.12)).rotation.y = rr(-0.04, 0.04);
      else for (let k = 0; k < 8; k++) add(R, bx(1.75, 0.27, 0.25), k % 3 ? MAT.wood2 : MAT.wood, (STEP.x1 + STEP.x2) / 2 + rr(-0.08, 0.08), y, -1.45 + k * 0.29).rotation.y = rr(-0.05, 0.05);
    }
    yield;
    // ---------------- 高墙：一直伸到远处的水泥墙，墙头一溜铁丝网 ----------------
    const wc = lam(0x7a7066), wz0 = -36, wz1 = 1.8;
    add(R, bx(W.x2 - W.x1, W.y2, wz1 - wz0), wc, (W.x1 + W.x2) / 2, W.y2 / 2, (wz0 + wz1) / 2);
    add(R, bx(W.x2 - W.x1 + 0.08, 0.1, wz1 - wz0 + 0.04), MAT.pale, (W.x1 + W.x2) / 2, W.y2, (wz0 + wz1) / 2, false);
    // 铁丝网：路上这一段被人剪开了（两头的断线耷拉下来），翻墙的地方是空的
    const wcut = -1.5;
    for (let z = wz0 + 1; z < wcut; z += 2.6) add(R, cy(0.025, 0.025, 0.8, 5), MAT.dark, W.x1 + 0.2, W.y2 + 0.36, z, false).rotation.z = 0.45;
    for (const [dx, dy] of [[-0.02, 0.26], [-0.18, 0.6]]) {
      add(R, bx(0.02, 0.02, wcut - wz0 - 1), MAT.dark, W.x1 + 0.2 + dx, W.y2 + dy, (wz0 + 1 + wcut) / 2, false);
      add(R, bx(0.016, 0.016, 0.5 + dy * 0.6), MAT.dark, W.x1 + 0.14 + dx, W.y2 + dy - 0.15, wcut + 0.15, false).rotation.x = 1.0 + dy;   // 断头垂下来
    }
    for (let z = wz0 + 2; z < wz1; z += rr(3, 7)) add(R, bx(0.02, rr(0.6, 2.2), rr(0.4, 1.6)), lam(0x5f564d), W.x1 - 0.005, rr(0.6, 2.2), z, false);   // 墙面上一道道的水渍
    for (let i = 0; i < 3; i++) add(R, bx(0.12, 0.3, 0.03), MAT.dark, W.x1 - 0.02, 1.4 + i * 0.55 + rr(-0.1, 0.1), rr(-0.4, 0.5), false).rotation.x = rr(-0.3, 0.3);   // 墙面上蹬出来的鞋印：以前有人从这里翻过去
    yield;
    // ---------------- 箱子：方的旧木箱，绕着自己的中心转（翻下去时要转） ----------------
    v.pivot = grp(R, crate.x, crate.y1 + BW / 2, 0);
    v.crateG = mkCrate(v.pivot, { x: 0, y1: -BW / 2, w: BW, h: BW }, 'wood');
    v.dust = [];
    for (let i = 0; i < 16; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW_SOFT, color: 0xcfb79a, transparent: true, opacity: 0, depthWrite: false }));
      s.visible = false; s.renderOrder = 40; R.add(s); v.dust.push({ s, t: 9, life: 1 });
    }
    // 路边的草：墙那边多一些
    brushRow(R, [['grass', X + 2.6, 0.55, 1.0], ['grass', X + 18.5, -0.45, 1.1], ['leaf', X + 21.5, 0.5, 1.1], ['grass', X + 29.5, 0.45, 1.05], ['branch', X + 33.5, -2.4, 0.95], ['grass', X + 37.5, 0.5, 1.15]], {
      leaf: [0x6a6440, 0x77704a, 0x5e5a3a, 0x847a4e], grass: [0xb09a6a, 0xa38e5e, 0xc0aa7a, 0x947f56], plume: [0xdcc8a0, 0xcdb890],
      fern: [0x76663f, 0x82704a], twig: [0x7e7652, 0x6e6a48, 0x8e8458, 0x787048], bark: 0x4c4036 }, 3315);
    V = v;
  }

  function puff(n, x, y, k) {                            // 落地扬起来的一团灰
    const v = V; if (!v) return;
    for (let i = 0; i < n; i++) {
      const d = v.dust.find(o => o.t >= o.life); if (!d) return;
      const side = i % 2 ? 1 : -1;
      Object.assign(d, { t: 0, life: rr(0.9, 1.6), x: x + side * rr(0.3, 0.7), y: y + rr(0.02, 0.15), z: rr(-0.6, 0.6), vx: side * rr(0.6, 1.8) * k, vy: rr(0.15, 0.6) * k, s0: rr(0.3, 0.5), s1: rr(1.0, 1.8) * k, a: rr(0.35, 0.6) });
    }
  }
  function startTip() {                                  // 箱子的重心过了站台的边：松开人的手，绕着边角往下翻
    S.st = 'tip'; S.a = 0; S.w = 0.8; crate.locked = true; fx('crateTip');
  }
  const GB = 20;                                         // 箱子掉下去用的重力（比人的 23 小一点，显得沉、慢一些）
  function stepCrate(dt) {
    if (S.st === 'top') { if (crate.x >= B.x2 - 0.005) startTip(); return; }
    const h2 = BW / 2;
    if (S.st === 'tip') {                                // 绕站台的边角转：重心离边越远，转得越快
      const r0x = crate.x - B.x2, r0y = h2, c = Math.cos(S.a), s = Math.sin(S.a);
      const rx = r0x * c + r0y * s, ry = -r0x * s + r0y * c;
      S.w += GB * rx / ((BW * BW * 2) / 3) * dt; S.a += S.w * dt;
      S.cx = B.x2 + rx; S.cy = B.y2 + ry;
      if (S.a > 0.6) {                                   // 翻过去一个角度，离开站台的边，自己往下掉
        S.st = 'fall'; S.vx = Math.max(1.8, 0.9 * PUSH + S.w * ry); S.vy = -S.w * rx;   // 推着它走的那股劲还在：往外抛出去一点，落地时离站台有一人宽的空，人才站得到它左边去推
        crate.off = true;
        const t = (S.vy + Math.sqrt(S.vy * S.vy + 2 * GB * (S.cy - h2))) / GB;   // 落地还要多久：照这个把转速定下来，落地时正好转过 90°
        S.w = (Math.PI / 2 - S.a) / Math.max(0.15, t);
      }
      return;
    }
    if (S.st === 'fall') {
      S.vy -= GB * dt; S.cx += S.vx * dt; S.cy += S.vy * dt; S.a = Math.min(Math.PI / 2, S.a + S.w * dt);
      const f = groundY(S.cx);
      if (S.cy - h2 <= f) {                               // 落地
        const lo = B.x2 + h2 + 0.01, hi = W.x1 - h2, x = clamp(S.cx, lo, hi);
        S.st = 'down'; S.a = 0; S.cy = f + h2; S.bump = 1; S.shake = 0.35; S.slide = 0.45 * S.vx;
        crate.y1 = f; crate.y2 = f + BW; crate.off = false; crate.locked = false; placeBox(crate, x);
        if (P.x + P.hw > crate.x1 && P.x - P.hw < crate.x2 && P.y < crate.y2 && P.y > crate.y1 - 0.5) { P.y = crate.y2; P.vy = 0; }   // 人正好在底下：放到箱子顶上，不卡进箱子里
        fx('crateDrop'); puff(12, x, f, 1); saveGame();
      }
      return;
    }
    if (S.slide > 0) {                                   // 落地后往前蹭一小段，被地面磨停
      const hi = W.x1 - h2, x = Math.min(hi, crate.x + S.slide * dt);
      S.slide = x >= hi ? 0 : Math.max(0, S.slide - 3 * dt);
      if (!(P.x - P.hw < crate.x2 + 0.05 && P.x > crate.x && P.y < crate.y2 - 0.05)) placeBox(crate, x); else S.slide = 0;   // 前面站着人就停住
    }
  }
  function update(dt) {
    stepCrate(dt);
    if (!S.over && P.grounded && P.x > W.x2 + 0.4) { S.over = true; saveGame(); }
    const v = V; if (!v) return;
    // 箱子的样子：在站台上、在地上就跟着推拉走；翻下去时按算出来的位置和角度摆
    if (S.st === 'tip' || S.st === 'fall') { v.pivot.position.set(S.cx, S.cy, 0); v.pivot.rotation.z = -S.a; }
    else {
      S.bump = Math.max(0, S.bump - dt * 3.2);           // 落地后颠一下、晃一晃才停稳
      const b = S.bump, wob = Math.sin((1 - b) * 14) * b;
      v.pivot.position.set(crate.x, crate.y1 + BW / 2 + 0.05 * Math.max(0, wob), 0); v.pivot.rotation.z = 0.05 * wob;
    }
    // 箱子掉下去的时候、人还在站台上的时候：镜头往后退、往下压，看得见地上的箱子和墙脚
    if (P.y > 2.4 && P.x > B.x1 - 0.2 && P.x < B.x2 + 0.6 && (S.st === 'tip' || S.st === 'fall' || (S.st === 'down' && !atWall()))) camOvr = { d: 20, yo: -0.5, xo: 2.6 };
    if (S.shake > 0) { S.shake = Math.max(0, S.shake - dt); const k = S.shake / 0.35; camJit = { x: 0.05 * k * Math.sin(T * 61), y: 0.07 * k * Math.sin(T * 47 + 1) }; }
    for (const d of v.dust) {
      if (d.t >= d.life) { d.s.visible = false; continue; }
      d.t += dt; const k = d.t / d.life; d.x += d.vx * dt; d.y += d.vy * dt; d.vx *= 1 - dt * 2.2; d.vy *= 1 - dt * 1.5;
      d.s.visible = true; d.s.position.set(d.x, d.y, d.z); d.s.scale.setScalar(lerp(d.s0, d.s1, Math.sqrt(k))); d.s.material.opacity = d.a * Math.sin(Math.PI * Math.min(1, k * 1.6)) * (1 - k);
    }
  }
  function putTop() { S.st = 'top'; S.a = 0; S.bump = 0; crate.locked = false; crate.off = false; crate.y1 = B.y2; crate.y2 = B.y2 + BW; placeBox(crate, X0); }
  function putDown(x) { S.st = 'down'; S.a = 0; S.bump = 0; crate.locked = false; crate.off = false; crate.y1 = 0; crate.y2 = BW; placeBox(crate, x); }
  function reset() { putTop(); S.over = false; S.shake = 0; }
  function solve() { putDown(W.x1 - BW / 2); S.over = true; }
  return defZone({ n: OLD + 15, vis: [X - 20, X + 50], build, update, reset, solve, unbuild() { V = null; }, crate, S, STEP, K, B, W });
})();
