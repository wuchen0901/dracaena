
// ============================================================
//  第二章 · 林地水闸：恢复水道
//  走出工厂，翻过一道坡，看见地平线上停机的巨像；下坡进入林地边缘。
//  一条废弃的引水渠拦在路上：扳动闸杆 → 闸门升起 → 水位慢慢涨上来，卡在石槽里的木梁浮起、漂向对岸 →
//  踩着木梁过去。掉进水里只会回到岸上，闸门不会关回去
// ============================================================
const CH2 = (() => {
  const X = X2, CX0 = X + 104, CX1 = CX0 + 5.2, BED = -3.6, LOW = -3.25, HIGH = -0.42;      // 水渠的两岸、渠底、低水位、高水位
  const C = chapter({ n: 2, x0: X + 0.6, start: X + 3.5, name: '林地水闸', sub: '恢复水道' });
  terrain([X + 2.1, 0.0875], [X + 6, 0.25], [X + 14, 1.0], [X + 20, 1.3], [X + 26, 2.6], [X + 32, 3.0], [X + 46, 3.0], [X + 54, 2.2], [X + 64, 0.9], [X + 76, 0.2], [X + 82, 0],
    [CX0, 0], [CX0 + 0.01, BED], [CX1 - 0.01, BED], [CX1, 0], [X3, 0]);
  ground(X + 0.1, 0x574839); ground(X + 60, 0x574839); ground(X + 84, 0x3d4430); ground(X3 - 8, 0x47482f);
  solid({ id: 'bankL', x1: CX0 - 0.6, x2: CX0, y1: BED, y2: 0 }); solid({ id: 'bankR', x1: CX1, x2: CX1 + 0.6, y1: BED, y2: 0 });
  const TL = 3.7, timber = solid({ id: 'timber', x: CX0 + 1.95, w: TL, x1: 0, x2: 0, y1: 0, y2: 0, plat: true });
  const W = { open: false, t: 0, k: 0, level: LOW, lamp: 0 };
  const LEVER_X = CX0 - 4.2;
  function placeTimber() {                               // 木梁：水位低时卡在石槽里；水涨起来就浮着，慢慢漂向对岸
    timber.x = lerp(CX0 + 1.95, CX0 + 2.6, sstep(0.2, 0.92, W.k)); syncBox(timber);
    timber.y2 = Math.max(BED + 0.55, W.level + 0.14); timber.y1 = timber.y2 - 0.42;
  }
  placeTimber();
  usable({ id: 'sluice', x: LEVER_X, r: 0.95, can: () => !W.open, on() { W.open = true; fx('lever'); fx('doorStop'); } });
  pit({ x1: CX0 + 0.05, x2: CX1 - 0.05, y: () => Math.max(W.level + 0.05, P.grounded ? -1.5 : -99), back: () => P.x < (CX0 + CX1) / 2 ? CX0 - 1.6 : CX1 + 1.6, sfx: 'splash' });
  checkpoint(X + 3.5); checkpoint(X + 38); checkpoint(X + 88); checkpoint(CX1 + 2.2);
  camKeys([X + 3.5, 17, 1.6, 2.5], [X + 14, 24, 2.6, 5], [X + 28, 32, 4.6, 8.5], [X + 42, 34, 5, 9], [X + 58, 26, 3.2, 5], [X + 76, 20, 2.0, 1.5],
    [X + 92, 20, 1.8, 1.5], [CX0 - 3, 21, 1.9, 2.8], [CX1 + 1.5, 20, 1.8, 0.5], [X + 135, 19, 1.8, 0], [X3 - 2, 19, 1.8, 0]);
  // 室外的清晨：上冷下暖的天，低垂的太阳；往林子里走，雾变成灰绿色，光从枝叶间漏下来
  const DAWN = { fog: 0xc9a47c, fogD: 0.0052, hemiS: 0xffe6c4, hemiG: 0x4a4038, hemiI: 0.95, keyC: 0xffc48a, keyI: 2.3, keyDir: [0.74, 0.34, -0.5], rimI: 0.25,
    dustC: 0xffe2b8, dustO: 0.38, wind: -0.9, ext: 1, sky: [0x2d3d46, 0x5d7074, 0xa99a82, 0xe2b680, 0xf1c88b, 0xa37d5c], sunX: 0.36, sunY: 0.04, sunC: 0xfff0cd, sunP: 1, cloud: 1, cloudC: 0xffe1be };
  env(X + 2.1, DAWN); env(X + 50, {});
  env(X + 80, { fog: 0x9dab94, fogD: 0.0115, hemiS: 0xe2ead4, hemiG: 0x3c4431, hemiI: 1.0, keyC: 0xfff1d6, keyI: 1.35, keyDir: [0.45, 0.8, 0.1], rimI: 0.3, dustC: 0xeaf0d0, dustO: 0.3, wind: -0.25,
    sky: [0x587278, 0x86998f, 0xb4bfa4, 0xd3d0aa, 0xe2d9b2, 0x8f9c82], sunX: 0.2, sunY: 0.2, sunP: 0.5, sunC: 0xfff6dc, cloud: 0.5, cloudC: 0xf2f0dc, birds: 1 });
  env(X3 - 12, {});

  hint(() => !W.open && Math.abs(P.x - LEVER_X) < 1.7, '按 <b>E</b> 扳动闸杆');
  hint(() => !W.open && P.x > CX0 - 2.2 && P.x < CX0 + 0.3 && P.y > -0.5, '水渠太宽，跳不过去 —— 木梁卡在渠底的石槽里');
  hint(() => W.open && W.k < 0.75 && P.x > CX0 - 6 && P.x < CX0 + 0.3, '水位在涨。等木梁浮上来');
  hint(() => W.k >= 0.75 && P.x > CX0 - 3 && P.x < CX0 + 0.3 && P.y > -0.1, '跳上木梁，再跳到对岸');

  for (const x of [X + 86, CX0 - 6, CX1 + 9]) spotLight({ p: [x + 2.5, 13, 2.5], t: [x, 0, -0.6], c: 0xfff3cf, i: 2.0, a: 0.26 });   // 枝叶间漏下来的光
  const farLamp = pointLight({ p: [X + 139, 8.6, -22], c: 0xcfeaff, i: 30, d: 30, dec: 1.4, on: 0 });

  let V = null;
  function* build(R) {
    const S = 14, gy = groundY;                          // 这些室外布景原来是按“大门在 x = 90”画的，整体往右挪 14 米
    // 地平线上的巨像：一台跪坐着停机的巨型机器人，只剩一只眼睛还亮着
    backdrop(150 + S, 300 + S, -6, 76, -240, 7, g => {
      const gr = g.createLinearGradient(0, 0, 0, 112); gr.addColorStop(0, '#b69a7c'); gr.addColorStop(0.3, '#93826f'); gr.addColorStop(1, '#5d6264');
      setInk(g, gr);
      const Xc = 232; g.translate(213 + S, 0); g.scale(0.5, 0.5); g.translate(-Xc, 0);
      poly(g, [[Xc - 46, -6], [Xc - 44, 14], [Xc - 30, 30], [Xc - 6, 34], [Xc + 14, 26], [Xc + 30, 10], [Xc + 34, -6]]);          // 盘坐的腿和基座
      poly(g, [[Xc - 24, 28], [Xc - 30, 62], [Xc - 22, 82], [Xc + 2, 88], [Xc + 20, 78], [Xc + 22, 50], [Xc + 14, 28]]);          // 前倾的躯干
      poly(g, [[Xc - 30, 78], [Xc - 44, 72], [Xc - 52, 44], [Xc - 50, 12], [Xc - 42, 10], [Xc - 38, 42], [Xc - 26, 60]]);         // 垂下的左臂
      poly(g, [[Xc + 18, 78], [Xc + 36, 66], [Xc + 50, 40], [Xc + 62, 4], [Xc + 70, -6], [Xc + 52, -6], [Xc + 42, 34], [Xc + 22, 56]]); // 撑地的右臂
      poly(g, [[Xc - 4, 86], [Xc - 2, 96], [Xc + 8, 104], [Xc + 24, 104], [Xc + 30, 92], [Xc + 26, 82], [Xc + 12, 80]]);          // 低垂的头
      line(g, [[Xc + 4, 102], [Xc - 6, 118]], 0.9); line(g, [[Xc + 16, 104], [Xc + 18, 114]], 0.6);                            // 天线
      for (const [x1, y1, x2, y2] of [[Xc - 20, 84, Xc - 60, -6], [Xc + 14, 84, Xc + 84, -6], [Xc - 46, 60, Xc - 76, -6]]) cable(g, x1, y1, x2, y2, 9, 0.35);
    }, { fog: false, order: -3000 });
    glow(R, 0xffb24a, 10, 0.95, 224 + S, 46.4, -239).renderOrder = -2990;      // 巨像还亮着的那只眼睛
    yield;
    // 远处的天际线：断塔、烟囱、歪斜的吊臂
    backdrop(30, 236, -6, 70, -150, 8, g => {
      const gr = g.createLinearGradient(0, 0, 0, 46); gr.addColorStop(0, '#b4987a'); gr.addColorStop(1, '#5e5b58');
      setInk(g, gr);
      heap(g, 30, 236, 0, 0.5, 4, 9);
      for (let x = 36; x < 232; x += rr(9, 26)) {
        const w = rr(4, 13), h = rr(8, 44) * (x > 176 ? 0.4 : 1), t = rnd();
        if (t < 0.4) { poly(g, [[x, -6], [x, h * rr(0.7, 0.95)], [x + w * rr(0.3, 0.6), h], [x + w, h * rr(0.5, 0.85)], [x + w, -6]]); }                // 断塔
        else if (t < 0.6) { poly(g, [[x, -6], [x + w * 0.22, h * 1.1], [x + w * 0.5, h * 1.1], [x + w * 0.72, -6]]); }                                // 冷却塔 / 烟囱
        else if (t < 0.8) { box(g, x, -6, 1.3, h + 6); line(g, [[x + 0.6, h], [x + rr(9, 18), h * rr(0.55, 0.85)]], 0.8); truss(g, x - 3, x + 4, h * 0.6, 1.6, 0.4); }   // 吊塔
        else { for (let i = 0; i < 4; i++) box(g, x + i * 2.8, -6, 1.1, h * rr(0.3, 0.8) + 6); box(g, x - 1, h * 0.28, 12, 1.1); }                    // 管廊
      }
    }, { fog: false, order: -2000, fadeR: 54 });
    yield;
    // 林地后面的远山：两层淡淡的山脊
    backdrop(168, 330, -6, 60, -150, 6, g => {
      setInk(g, vgrad(g, 34, 0, '#93a295', '#768678')); ridge(g, 168, 330, -6, x => 21 + 7 * Math.sin(x / 23) + 3.5 * Math.sin(x / 8.3 + 1) + rr(-0.5, 0.5), 1.5);
      setInk(g, vgrad(g, 22, 0, '#748576', '#5b6b5e')); ridge(g, 168, 330, -6, x => 11 + 5 * Math.sin(x / 17 + 2) + 2.4 * Math.sin(x / 5.1) + rr(-0.7, 0.7), 1.2);
    }, { fog: false, order: -1900, fadeL: 46, fadeR: 40 });
    yield;
    // 中景：高压线塔、倒下的步行机械
    backdrop(98, 236, -4, 36, -52, 18, g => {
      setInk(g, '#1e1d1f');
      ridge(g, 98, 236, -4, x => gy(x) + rr(0.3, 1.6), 3);
      const pylon = (x, h, lean) => {
        const t = [x + lean * h, h];
        line(g, [[x - 1.7, -1], t, [x + 1.7, -1]], 0.22);
        for (let k = 0.2; k < 1; k += 0.2) line(g, [[lerp(x - 1.7, t[0], k), lerp(-1, h, k)], [lerp(x + 1.7, t[0], k + 0.1), lerp(-1, h, k + 0.1)], [lerp(x - 1.7, t[0], k + 0.2), lerp(-1, h, k + 0.2)]], 0.12);
        for (const f of [0.72, 0.9]) line(g, [[t[0] - 3.4 * f, h * f], [t[0] + 3.4 * f, h * f]], 0.2);
        return t;
      };
      const tops = [[100 + S, 21, 0.02], [134 + S, 24, -0.06], [171 + S, 19, 0.16], [208 + S, 17, 0.3]].map(a => pylon(...a));
      for (let i = 1; i < tops.length; i++) for (const d of [-3, 3]) cable(g, tops[i - 1][0] + d, tops[i - 1][1] * 0.9, tops[i][0] + d, tops[i][1] * 0.9, 5 + i, 0.07);
      // 倒下的步行机械：一条拱起的腿和半埋的机身
      g.translate(S, 1.2);
      g.lineWidth = 1.5; g.beginPath(); g.moveTo(146, -1); g.quadraticCurveTo(150, 15, 160, 9); g.stroke();
      line(g, [[160, 9], [168, -1]], 1.1); disc(g, 160, 9, 1.5);
      poly(g, [[150, -1], [152, 5], [163, 6.5], [176, 3], [181, -1]]);
    }, { fadeR: 26 });
    yield;
    // 近景：歪斜的杆子、铁丝网、矮废料堆
    backdrop(102, 192, -3, 14, -11, 30, g => {
      setInk(g, '#151516');
      ridge(g, 102, 192, -3, x => gy(x) + rr(-0.2, 0.32), 1.1);
      const base = x => gy(x) - 0.3;
      for (const [x0, h, lean] of [[97, 5.5, 0.12], [103.5, 4.2, -0.2], [112.4, 6.4, 0.05], [125, 5.2, -0.1], [133, 7, 0.08], [146, 5, 0.2]]) {
        const x = x0 + S; line(g, [[x, base(x)], [x + lean * h, base(x) + h]], 0.2);
        line(g, [[x + lean * h - 0.8, base(x) + h * 0.86], [x + lean * h + 0.8, base(x) + h * 0.9]], 0.12);
      }
      for (let x = 105 + S; x < 121 + S; x += 2.2) line(g, [[x, base(x)], [x + 0.15, base(x) + 1.7]], 0.09);        // 铁丝网的桩
      for (const h of [0.7, 1.15, 1.55]) cable(g, 105 + S, base(105 + S) + h, 121 + S, base(121 + S) + h, 0.25, 0.035);
      const b = base(127 + S); poly(g, [[127 + S, b], [128.5 + S, b + 2.3], [131.2 + S, b + 2.9], [134.6 + S, b + 1.2], [136 + S, b]]);   // 半埋的机壳
      for (const [x, h] of [[166, 6], [173, 8.5], [181, 7]]) tree(g, x, base(x), h, 'dead');                    // 林子边上最先看到的几棵枯树
    }, { fadeR: 8 });
    yield;

    // ---------------- 林地 ----------------
    backdrop(166, 322, -3, 34, -40, 13, g => {            // 远处的一排树
      setInk(g, '#4a5a4b'); ridge(g, 166, 322, -3, x => 12.5 + 2.5 * Math.sin(x / 6.3) + rr(-1.2, 1.6), 1.3);       // 连成一片的树冠，后面的东西透不出来
      for (let x = 168; x < 320; x += rr(2.2, 4.6)) tree(g, x, 0.6, rr(15, 24), rnd() < 0.3 ? 'pine' : 'round');
    }, { fadeL: 16, fadeR: 30 });
    yield;
    backdrop(170, 300, -3, 26, -22, 17, g => {            // 再近一排
      setInk(g, '#2c382e'); ridge(g, 170, 300, -3, x => 1.6 + 0.8 * Math.sin(x / 3.7) + rr(0, 0.9), 1.1);
      for (let x = 174; x < 298; x += rr(3.6, 7.5)) if (x < 203 || x > 218) tree(g, x, 0.4, rr(10, 17), rnd() < 0.25 ? 'pine' : 'round');
      for (let i = 0; i < 40; i++) { const x = rr(172, 298); for (let k = 0; k < 3; k++) disc(g, x + rr(-0.9, 0.9), 1.6 + rr(0, 0.9), rr(0.6, 1.3)); }   // 灌木
    }, { fadeL: 12, fadeR: 30 });
    yield;
    backdrop(174, 282, -3, 18, -9, 25, g => {             // 近处的大树干：一直伸出画面上沿，只看得见树干和最低的几根枝
      setInk(g, '#172019'); ridge(g, 174, 282, -3, x => gy(x) - 0.25 + rr(-0.1, 0.25), 0.8);
      for (const [x, w] of [[178, 0.8], [186.5, 1.1], [193, 0.7], [199.5, 0.9], [220.5, 1.0], [227, 0.75], [236, 1.15], [247, 0.8], [256, 1.0], [268, 0.9], [277, 0.7]]) {
        poly(g, [[x - w * 0.75, gy(x) - 0.3], [x + w * 0.75, gy(x) - 0.3], [x + w * 0.42, 18], [x - w * 0.42, 18]]);
        for (let i = 0; i < 3; i++) twig(g, x, rr(5, 13), rr(0.5, 1.3) * (rnd() < 0.5 ? -1 : 1), rr(2, 4.5), w * 0.22, 2);
        for (let i = 0; i < 5; i++) disc(g, x + rr(-3.5, 3.5), rr(14, 18), rr(1.4, 2.6));
      }
      grass(g, 176, 280, x => gy(x) - 0.2, 0.3, 0.9, 420);
      for (let i = 0; i < 34; i++) { const x = rr(176, 280); if (x < 204 || x > 217) for (let k = 0; k < 3; k++) disc(g, x + rr(-0.5, 0.5), gy(x) + rr(-0.1, 0.3), rr(0.3, 0.7)); }
    }, { fadeL: 6, fadeR: 14 });
    yield;
    backdrop(176, 268, -0.5, 17, -2.6, 12, g => {         // 林间的光柱
      for (const [x, w, a] of [[188, 3.2, 0.16], [201, 4.4, 0.2], [216, 3.6, 0.15], [231, 2.8, 0.12], [246, 4, 0.14]]) {
        const gr = g.createLinearGradient(0, 17, 0, 0); gr.addColorStop(0, `rgba(245,240,200,${a})`); gr.addColorStop(0.7, `rgba(245,240,200,${a * 0.5})`); gr.addColorStop(1, 'rgba(245,240,200,0)');
        g.fillStyle = gr; poly(g, [[x + 3.6, 17], [x + 5, 17], [x + w / 2, 0], [x - w / 2, 0]]);
      }
    }, { additive: true, fog: false, blur: 10, order: 40 });
    yield;
    // 前景：离镜头最近的一层，全黑、略微虚焦
    backdrop(104.6, 264, -3, 10, 6, 22, g => {
      setInk(g, '#040607');
      const top = [[104.6, -5]];
      for (let x = 104.6; x <= 264; x += rr(0.4, 1.3)) {
        const h = Math.max(-0.4, gy(104 + (x - 104) * 0.985 + 1)) * 0.72 + rr(0.25, 0.6);
        top.push([x, h]); if (rnd() < 0.5) top.push([x + 0.05, h + rr(0.25, x > 180 ? 1.0 : 0.7)], [x + 0.12, h]);        // 草叶
      }
      top.push([264, -5]); poly(g, top);
      for (let x = 182; x < 262; x += rr(7, 13)) { const y = rr(8.2, 9.6); for (let i = 0; i < 9; i++) disc(g, x + rr(-2.2, 2.2), y + rr(-0.5, 1.2), rr(0.35, 0.8)); twig(g, x + 2.5, 10.4, 2.2 + rr(-0.3, 0.3), rr(2, 3.2), 0.12, 1); }   // 垂下来的枝叶
    }, { fog: false, blur: 2.2, order: 4000 });
    yield;

    // ---------------- 水渠、水闸 ----------------
    const v = {};
    for (const [x, sx] of [[CX0, -1], [CX1, 1]]) {
      add(R, bx(0.6, 3.66, 30), MAT.stone, x + sx * 0.3, BED / 2 + 0.03, -3);                        // 渠壁
      add(R, bx(1.0, 0.1, 30), MAT.stone2, x + sx * 0.5, 0.01, -3);                                  // 岸顶的石沿
      add(R, bx(0.04, 0.16, 30), MAT.pale, x - sx * 0.01, HIGH + 0.02, -3, false);                   // 渠壁上的旧水位线
      for (let z = -15; z < 11; z += 2.1) add(R, bx(0.62, 0.05, 0.05), MAT.dark, x + sx * 0.3, rr(-3.2, -0.8), z, false);
    }
    for (const x of [CX0 + 0.25, CX0 + 3.55]) add(R, bx(0.3, 0.42, 1.1), MAT.stone2, x, BED + 0.21, 0);                  // 卡住木梁的石槽
    // 闸门：在水渠的上游（画面深处）。两座石墩、一道横梁、一扇木闸板
    const GZ = -7.2;
    for (const x of [CX0 - 0.5, CX1 + 0.5]) add(R, bx(1.4, 7.4, 1.8), MAT.stone, x, 0.1, GZ);
    add(R, bx(8.4, 0.7, 1.5), MAT.stone2, (CX0 + CX1) / 2, 3.95, GZ);
    v.gate = add(R, bx(5.2, 3.2, 0.26), MAT.wood, (CX0 + CX1) / 2, BED + 1.6, GZ);
    for (let y = -1.4; y < 1.6; y += 0.7) add(v.gate, bx(5.22, 0.07, 0.3), MAT.wood2, 0, y, 0, false);
    for (const x of [-1.6, 1.6]) add(v.gate, cy(0.05, 0.05, 6.4, 6), MAT.dark, x, 4.6, 0, false);                         // 吊着闸板的两根铁杆
    add(R, cy(0.42, 0.42, 0.2, 14), MAT.rust, CX0 + 0.9, 4.75, GZ).rotation.x = Math.PI / 2;                                // 绞盘
    v.winch = add(R, bx(0.9, 0.1, 0.1), MAT.dark, CX0 + 0.9, 4.75, GZ + 0.16, false);
    add(R, bx(5.2, 3.3, 34), unlit(0x1d2a2c), (CX0 + CX1) / 2, HIGH - 1.67, GZ - 17.3, false);                              // 闸门后面蓄着的水
    // 水面：一块会升高的半透明平面 + 一层流动的反光
    v.water = add(R, bx(5.2, 0.02, 20), new THREE.MeshLambertMaterial({ color: 0x35535a, transparent: true, opacity: 0.84, emissive: 0x0e1a1c }), (CX0 + CX1) / 2, LOW, GZ + 10.1, false);
    v.water.receiveShadow = true;
    { const [c, g] = mkCanvas(64, 256); g.fillStyle = '#000'; g.fillRect(0, 0, 64, 256);
      for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(255,255,255,${rr(0.05, 0.3)})`; g.fillRect(rr(0, 64), rr(0, 256), rr(6, 30), rr(1, 3)); }
      v.sheenTex = new THREE.CanvasTexture(c); v.sheenTex.wrapS = v.sheenTex.wrapT = THREE.RepeatWrapping; v.sheenTex.repeat.set(1.5, 3);
      const m = new THREE.MeshBasicMaterial({ map: v.sheenTex, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, color: 0xcfe6e0 }); m.userData.own = true;
      v.sheen = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 20), m); v.sheen.rotation.x = -Math.PI / 2; v.sheen.position.set((CX0 + CX1) / 2, LOW + 0.02, GZ + 10.1); v.sheen.renderOrder = 20; R.add(v.sheen);
      // 从闸板底下涌出来的水
      const fm = new THREE.MeshBasicMaterial({ map: v.sheenTex, transparent: true, opacity: 0, color: 0xdfeeea, depthWrite: false, side: THREE.DoubleSide });
      v.fall = new THREE.Mesh(new THREE.PlaneGeometry(5.1, 1), fm); v.fall.position.set((CX0 + CX1) / 2, 0, GZ + 0.3); v.fall.renderOrder = 21; R.add(v.fall);
    }
    // 木梁
    v.timber = grp(R, timber.x, timber.y2, 0);
    add(v.timber, bx(TL, 0.42, 0.66), MAT.wood, 0, -0.21, 0);
    for (const x of [-TL / 2 + 0.03, TL / 2 - 0.03]) add(v.timber, bx(0.07, 0.44, 0.68), MAT.wood2, x, -0.21, 0, false);
    for (const x of [-1.1, 0.2, 1.3]) add(v.timber, bx(0.05, 0.02, 0.66), MAT.wood2, x, 0.005, 0, false);
    // 闸杆（在近岸）和连到闸门的拉索
    v.lever = mkLever(R, LEVER_X, 0, -0.55);
    tube(R, [[LEVER_X, 0.5, -0.9], [LEVER_X + 1.5, 0.25, -3.5], [CX0 - 0.6, 2.2, GZ + 0.6], [CX0 + 0.4, 4.6, GZ + 0.3]], 0.03, MAT.dark);
    for (const [x, z, a, l] of [[CX0 - 2.2, 0.9, 0.4, 1.6], [CX0 - 1.4, -1.6, -0.7, 1.2], [CX0 - 3.1, -2.2, 1.2, 0.9]]) { const b = add(R, cy(0.045, 0.06, l, 6), MAT.wood2, x, 0.06, z); b.rotation.set(Math.PI / 2, 0, a); }   // 被水冲到岸边的树枝
    // 对岸一盏熄着的小灯，和远处指向旧城方向的检修灯
    add(R, cy(0.05, 0.07, 2.6, 6), MAT.dark, CX1 + 3.4, 1.3, -2.2); add(R, bx(0.34, 0.26, 0.34), MAT.dark, CX1 + 3.4, 2.7, -2.2);
    add(R, cy(0.12, 0.2, 9.2, 8), MAT.dark, X + 139, 4.6, -24); add(R, bx(1.3, 0.14, 0.14), MAT.dark, X + 139.5, 8.9, -24);
    v.farGlow = glow(R, 0xcfeaff, 7, 0, X + 139.9, 8.7, -23.8); v.farLens = add(R, new THREE.SphereGeometry(0.22, 10, 8), unlit(0x2c3a40, { fog: false }), X + 139.9, 8.7, -23.8, false);
    v.nearGlow = glow(R, 0xcfeaff, 1.6, 0, CX1 + 3.4, 2.7, -2.0);
    V = v;
  }

  function update(dt) {
    const on = standingOn(timber), ox = timber.x;
    if (W.open && W.t < 7) { W.t = Math.min(7, W.t + dt); if (W.t >= 7) fx('ok'); }               // 水位涨七秒
    W.k = W.t / 7; W.level = lerp(LOW, HIGH, sstep(0, 1, W.k) * 0.7 + W.k * 0.3);
    placeTimber();
    if (on) { P.x += timber.x - ox; P.y = timber.y2; }                                             // 站在木梁上：跟着它一起漂
    W.lamp = damp(W.lamp, W.k >= 1 ? 1 : 0, 1.2, dt); farLamp.on = W.lamp;
    const near = sstep(40, 8, Math.abs(P.x - (CX0 + 2.6)));
    AUD.water = near * (W.open ? lerp(1, 0.45, sstep(0.9, 1, W.k)) : 0.12);
    const v = V; if (!v) return;
    const gk = sstep(0, 0.22, W.k);                                                                // 闸板在头一两秒升起来
    v.gate.position.y = BED + 1.6 + 3.55 * gk; v.winch.rotation.z = gk * 9;
    v.lever.set(W.open ? Math.min(1, W.t * 3.5) : 0);
    v.water.position.y = W.level; v.sheen.position.y = W.level + 0.02;
    v.sheenTex.offset.y -= dt * (W.open ? lerp(0.5, 0.12, W.k) : 0.02);
    const drop = Math.max(0, HIGH - W.level) * gk;
    v.fall.visible = drop > 0.05; v.fall.scale.y = Math.max(0.05, drop + 0.3); v.fall.position.y = W.level + (drop + 0.3) / 2; v.fall.material.opacity = 0.5 * sstep(0, 0.6, drop);
    v.timber.position.set(timber.x, timber.y2 + (W.k > 0.1 ? 0.012 * Math.sin(T * 1.7) : 0), 0); v.timber.rotation.z = W.k > 0.1 ? 0.012 * Math.sin(T * 1.1) : -0.03;
    v.farGlow.material.opacity = 0.9 * W.lamp; v.farLens.material.color.setHex(W.lamp > 0.5 ? 0xe8f6ff : 0x2c3a40); v.nearGlow.material.opacity = 0.5 * W.lamp;
  }
  function reset() { Object.assign(W, { open: false, t: 0, k: 0, level: LOW, lamp: 0 }); placeTimber(); }
  function solve() { Object.assign(W, { open: true, t: 7, k: 1, level: HIGH, lamp: 1 }); placeTimber(); }
  return defZone({ n: 2, vis: [X, X3 + 4], build, update, reset, solve, unbuild() { V = null; }, W, timber });
})();
