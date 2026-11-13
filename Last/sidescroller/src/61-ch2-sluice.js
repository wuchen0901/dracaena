
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
  ground(X + 0.1, 0x574839); ground(X + 60, 0x574839); ground(X + 84, 0x33341e); ground(X3 - 8, 0x3c381d);      // 林子里的地：枯草的暗褐色
  solid({ id: 'bankL', x1: CX0 - 0.6, x2: CX0, y1: BED, y2: 0 }); solid({ id: 'bankR', x1: CX1, x2: CX1 + 0.6, y1: BED, y2: 0 });
  const TL = 3.7, timber = solid({ id: 'timber', x: CX0 + 1.95, w: TL, x1: 0, x2: 0, y1: 0, y2: 0, plat: true });
  const W = { open: false, t: 0, k: 0, level: LOW, lamp: 0, flown: 0, bank: -1 };      // flown：闸上那几只鸟飞走多久了（0 = 还停着）；bank：主角最后站在哪边岸上（-1 左岸，1 右岸）
  const LEVER_X = CX0 - 4.2;
  function placeTimber() {                               // 木梁：水位低时卡在石槽里；水涨起来就浮着，慢慢漂向对岸
    timber.x = lerp(CX0 + 1.95, CX0 + 2.6, sstep(0.2, 0.92, W.k)); syncBox(timber);
    timber.y2 = Math.max(BED + 0.55, W.level + 0.14); timber.y1 = timber.y2 - 0.42;
  }
  placeTimber();
  usable({ id: 'sluice', x: LEVER_X, r: 0.95, can: () => !W.open, on() { W.open = true; fx('lever'); fx('doorStop'); fx('flutter'); } });     // flutter：闸上的鸟被惊飞
  // 掉进水渠：送回刚才站的那边岸上。不能按离哪边近来送 —— 闸门没开时用力一跳，落到渠底的木梁上又过了中线，就会被直接送到对岸，不用解题
  pit({ x1: CX0 + 0.05, x2: CX1 - 0.05, y: () => Math.max(W.level + 0.05, P.grounded ? -1.5 : -99), back: () => W.bank < 0 ? CX0 - 1.6 : CX1 + 1.6, sfx: 'splash' });
  checkpoint(X + 3.5); checkpoint(X + 38); checkpoint(X + 88); checkpoint(CX1 + 2.2);
  camKeys([X + 3.5, 17, 1.6, 2.5], [X + 14, 24, 2.6, 5], [X + 28, 32, 4.6, 8.5], [X + 42, 34, 5, 9], [X + 58, 26, 3.2, 5], [X + 76, 20, 2.0, 1.5],
    [X + 92, 20, 1.8, 1.5],
    // 水闸这一段镜头抬高、往下看：水渠在地面以下，平视的话渠底那根木梁落在画面外面，玩家看不到这道题要用的东西
    [CX0 - 5, 22, 0.3, 2.8, 2.3], [CX0, 22, 0.3, 2.8, 2.3], [CX1 + 0.5, 22, 0.5, 1.2, 2.0], [CX1 + 5, 20, 1.8, 0.5],
    [X + 135, 19, 1.8, 0], [X3 - 2, 19, 1.8, 0]);
  // 室外的清晨：上冷下暖的天，低垂的太阳。
  // 往林子里走：光从林子后面透过来（逆光），远处是一片发白的亮雾；近处的环境光压暗，只留枝叶间漏下来的几束暖光；颜色是枯褐 —— 灰褐的树，干黄的草
  const DAWN = { fog: 0xc9a47c, fogD: 0.0052, hemiS: 0xffe6c4, hemiG: 0x4a4038, hemiI: 0.95, keyC: 0xffc48a, keyI: 2.3, keyDir: [0.74, 0.34, -0.5], rimI: 0.25,
    dustC: 0xffe2b8, dustO: 0.38, wind: -0.9, ext: 1, sky: [0x2d3d46, 0x5d7074, 0xa99a82, 0xe2b680, 0xf1c88b, 0xa37d5c], sunX: 0.36, sunY: 0.04, sunC: 0xfff0cd, sunP: 1, cloud: 1, cloudC: 0xffe1be };
  env(X + 2.1, DAWN); env(X + 50, {});
  env(X + 80, { fog: 0xd9d2c0, fogD: 0.016, hemiS: 0xd8d0c0, hemiG: 0x2a2620, hemiI: 0.42, keyC: 0xf6ead6, keyI: 1.2, keyDir: [-0.15, 0.45, -0.85], rimI: 1.0, dustC: 0xe8e0d0, dustO: 0.5, wind: -0.25,
    sky: [0x9c9a90, 0xc8c3b2, 0xe6e0cc, 0xf2ecd8, 0xf5efdb, 0xa39a86], sunX: 0.05, sunY: 0.13, sunP: 1, sunC: 0xfff6e0, cloud: 0.5, cloudC: 0xf2f0dc, birds: 1 });
  env(X3 - 12, {});

  hint(() => !W.open && Math.abs(P.x - LEVER_X) < 1.7, '按 <b>E</b> 扳动闸杆');
  hint(() => !W.open && P.x > CX0 - 2.2 && P.x < CX0 + 0.3 && P.y > -0.5, '水渠太宽，跳不过去 —— 木梁卡在渠底的石槽里');
  hint(() => W.open && W.k < 0.75 && P.x > CX0 - 6 && P.x < CX0 + 0.3, '水位在涨。等木梁浮上来');
  hint(() => W.k >= 0.75 && P.x > CX0 - 3 && P.x < CX0 + 0.3 && P.y > -0.1, '跳上木梁，再跳到对岸');

  for (const x of [X + 86, CX0 - 6, CX1 + 9]) spotLight({ p: [x + 2.5, 13, 2.5], t: [x, 0, -0.6], c: 0xffe9c0, i: 5.2, a: 0.26 });   // 枝叶间漏下来的光：四周暗，这几块地是亮的
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
      setInk(g, '#6b7a62'); ridge(g, 166, 322, -3, x => 12.5 + 2.5 * Math.sin(x / 6.3) + rr(-1.2, 1.6), 1.3);       // 连成一片的树冠，后面的东西透不出来。颜色淡：隔着雾，它快融进后面的亮光里了
      for (let x = 168; x < 320; x += rr(2.2, 4.6)) tree(g, x, 0.6, rr(15, 24), rnd() < 0.3 ? 'pine' : 'round');
    }, { fadeL: 16, fadeR: 30 });
    yield;
    backdrop(170, 300, -3, 26, -22, 17, g => {            // 再近一排
      setInk(g, '#262b20'); ridge(g, 170, 300, -3, x => 1.6 + 0.8 * Math.sin(x / 3.7) + rr(0, 0.9), 1.1);
      for (let x = 174; x < 298; x += rr(3.6, 7.5)) if (x < 203 || x > 218) tree(g, x, 0.4, rr(10, 17), rnd() < 0.25 ? 'pine' : 'round');
      for (let i = 0; i < 40; i++) { const x = rr(172, 298); for (let k = 0; k < 3; k++) disc(g, x + rr(-0.9, 0.9), 1.6 + rr(0, 0.9), rr(0.6, 1.3)); }   // 灌木
    }, { fadeL: 12, fadeR: 30 });
    yield;
    backdrop(174, 282, -3, 18, -9, 25, g => {             // 近处的大树干：一直伸出画面上沿，只看得见树干和最低的几根枝
      setInk(g, '#0e120c'); ridge(g, 174, 282, -3, x => gy(x) - 0.25 + rr(-0.1, 0.25), 0.8);
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
        const gr = g.createLinearGradient(0, 17, 0, 0); gr.addColorStop(0, `rgba(255,255,255,${a})`); gr.addColorStop(0.7, `rgba(255,255,255,${a * 0.5})`); gr.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = gr; poly(g, [[x + 3.6, 17], [x + 5, 17], [x + w / 2, 0], [x - w / 2, 0]]);
      }
    }, { additive: true, fog: false, blur: 10, order: 40 });
    yield;
    // 前景：离镜头最近的一层，全黑、略微虚焦。
    // （原来沿着画面下沿还有一道草丛的剪影；从镜头的高度看过去它前面还露着一截地面，成了横在画面中间的一道黑带，到了水闸还把水渠挡住，去掉了）
    backdrop(180, 264, 6, 11, 6, 22, g => {
      setInk(g, '#040607');
      for (let x = 182; x < 262; x += rr(7, 13)) { const y = rr(8.2, 9.6); for (let i = 0; i < 9; i++) disc(g, x + rr(-2.2, 2.2), y + rr(-0.5, 1.2), rr(0.35, 0.8)); twig(g, x + 2.5, 10.4, 2.2 + rr(-0.3, 0.3), rr(2, 3.2), 0.12, 1); }   // 垂下来的枝叶
    }, { fog: false, blur: 2.2, order: 4000 });
    // 水闸这一屏的前景：上面两角垂下来的枯枝，下面两角几丛芦苇。只占四个角，不做成横贯画面的一条
    const seeded = s => () => { s = (s * 16807) % 2147483647; return s / 2147483647; };          // 自带种子的随机数：形状不跟着这一章里别的随机数变
    backdrop(202, 216.5, -3, 6.3, 9, 60, g => {
      setInk(g, '#060807'); const rn = seeded(31);
      const twigs = (x, y, a, len, w, depth) => {
        const x2 = x + Math.sin(a) * len, y2 = y - Math.cos(a) * len; line(g, [[x, y], [x2, y2]], w);
        if (depth > 0) for (let i = 0, n = 2 + (rn() < 0.5 ? 1 : 0); i < n; i++) { const k = 0.35 + 0.6 * rn(); twigs(x + (x2 - x) * k, y + (y2 - y) * k, a + (rn() - 0.5) * 1.6, len * (0.4 + 0.3 * rn()), w * 0.6, depth - 1); }
      };
      twigs(203.4, 6.3, 0.5, 2.5, 0.09, 3); twigs(204.7, 6.3, 0.15, 1.4, 0.06, 2);
      twigs(214.9, 6.3, -0.45, 2.1, 0.08, 3); twigs(213.6, 6.3, -0.1, 1.2, 0.05, 2);
      const reeds = (x1, x2, hMax) => {
        for (let i = 0; i < 46; i++) {
          const x = x1 + rn() * (x2 - x1), h = hMax * (0.45 + 0.55 * rn()), lean = (rn() - 0.5) * 0.5; poly(g, [[x - 0.03, -3], [x + 0.03, -3], [x + lean * h, -0.25 + h]]);
          if (rn() < 0.25) { g.beginPath(); g.ellipse(x + lean * h, -0.25 + h, 0.035, 0.13, 0, 0, 6.2832); g.fill(); }
        }
      };
      reeds(203.4, 205.6, 1.15); reeds(212.9, 215, 0.95);
    }, { fog: false, blur: 2.2, order: 4000 });
    yield;

    // ---------------- 水渠、水闸 ----------------
    const v = {};
    // 这一带的石头、木头、铁件都比别处暗一档、偏一点灰褐：逆光下它们是近处的暗部。这几种材质别的章节也在用，所以在这里另配一份
    const M2 = {};
    for (const [k, hex] of [['stone', 0x3c3b32], ['stone2', 0x2c2d26], ['wood', 0x3b2b1b], ['wood2', 0x241b12], ['dark', 0x080b0b], ['rust', 0x452a1c], ['pale', 0x5b5a53], ['steel', 0x23292a]]) { M2[k] = lam(hex); M2[k].userData.own = true; }
    // 水渠朝镜头这边一直修到地面的尽头（z = 14）：镜头往下看以后，画面下沿能看到水渠的近端
    for (const [x, sx] of [[CX0, -1], [CX1, 1]]) {
      add(R, bx(0.6, 3.66, 32), M2.stone, x + sx * 0.3, BED / 2 + 0.03, -2);                        // 渠壁
      add(R, bx(1.0, 0.1, 32), M2.stone2, x + sx * 0.5, 0.01, -2);                                  // 岸顶的石沿
      add(R, bx(0.04, 0.16, 32), M2.pale, x - sx * 0.01, HIGH + 0.02, -2, false);                   // 渠壁上的旧水位线
      for (let z = -15; z < 13.5; z += 2.1) add(R, bx(0.62, 0.05, 0.05), M2.dark, x + sx * 0.3, rr(-3.2, -0.8), z, false);
    }
    for (const x of [CX0 + 0.25, CX0 + 3.55]) add(R, bx(0.3, 0.42, 1.1), M2.stone2, x, BED + 0.21, 0);                  // 卡住木梁的石槽
    // 闸门：在水渠的上游（画面深处）。两座石墩、一道横梁、一扇木闸板
    const GZ = -7.2;
    for (const x of [CX0 - 0.5, CX1 + 0.5]) add(R, bx(1.4, 7.4, 1.8), M2.stone, x, 0.1, GZ);
    add(R, bx(8.4, 0.7, 1.5), M2.stone2, (CX0 + CX1) / 2, 3.95, GZ);
    v.gate = add(R, bx(5.2, 3.2, 0.26), M2.wood, (CX0 + CX1) / 2, BED + 1.6, GZ);
    for (let y = -1.4; y < 1.6; y += 0.7) add(v.gate, bx(5.22, 0.07, 0.3), M2.wood2, 0, y, 0, false);
    for (const x of [-1.6, 1.6]) add(v.gate, cy(0.05, 0.05, 6.4, 6), M2.dark, x, 4.6, 0, false);                         // 吊着闸板的两根铁杆
    add(R, cy(0.42, 0.42, 0.2, 14), M2.rust, CX0 + 0.9, 4.75, GZ).rotation.x = Math.PI / 2;                                // 绞盘
    v.winch = add(R, bx(0.9, 0.1, 0.1), M2.dark, CX0 + 0.9, 4.75, GZ + 0.16, false);
    add(R, bx(5.2, 3.3, 34), unlit(0xb9b4a4), (CX0 + CX1) / 2, HIGH - 1.67, GZ - 17.3, false);                              // 闸门后面蓄着的水：和水塘是同一片，同一个颜色
    // 闸后的水塘：水闸拦着的不只是一条渠，而是林子里的一片浅水。水面映着雾，是画面里最亮的一条 —— 闸门和主角的上半身都衬在它前面。
    // 远岸一道深色是树的倒影，水里立着一排旧木桩。水面铺在地上：左头收成一个水湾，右头渐渐淡掉
    const POSTS = [[197.2, 1.5, 0.04], [199.4, 1.9, -0.03], [201.6, 1.3, 0.06], [203.8, 1.7, 0], [206, 1.1, -0.08], [209.6, 1.2, 0.1], [211.9, 0.9, -0.05],
      [215.1, 1.6, 0.05], [217.3, 1.2, -0.04], [219.5, 1.8, 0.03], [221.7, 1.4, -0.06]];                // [x, 露出水面多高, 歪多少]：水闸这一屏里的几根是摆好的
    { const rn = seeded(41); for (let x = 188.4; x < 247; x += 2.2) if ((x < 196 || x > 223) && rn() > 0.25) POSTS.push([x + (rn() - 0.5) * 0.5, 0.9 + rn() * 1.1, (rn() - 0.5) * 0.16]); }   // 两边接着排下去，随机缺几根
    backdrop(168, 252, -21.5, -9.4, 0, 22, g => {
      const gr = g.createLinearGradient(0, -21.5, 0, -9.4), rn = seeded(5);
      gr.addColorStop(0, '#77726a'); gr.addColorStop(0.16, '#aaa596'); gr.addColorStop(0.55, '#c8c2b1'); gr.addColorStop(1, '#b0ab9c');
      g.fillStyle = gr; g.fillRect(168, -21.5, 84, 12.1);
      for (let i = 0; i < 26; i++) {                                                                      // 远岸树干的倒影：一道道朝着镜头淡下去的深色
        const x = 170 + rn() * 80, w = 0.5 + rn() * 1.2, g2 = g.createLinearGradient(0, -21.5, 0, -10);
        g2.addColorStop(0, `rgba(60,57,50,${(0.3 + 0.2 * rn()).toFixed(2)})`); g2.addColorStop(1, 'rgba(60,57,50,0)'); g.fillStyle = g2; g.fillRect(x, -21.5, w, 11.5);
      }
      for (let i = 0; i < 160; i++) { g.fillStyle = rn() < 0.5 ? 'rgba(255,255,250,.16)' : 'rgba(70,66,58,.12)'; g.fillRect(168 + rn() * 84, -21 + rn() * 11, 1 + rn() * 5, 0.035 + rn() * 0.05); }   // 水纹
      for (const [x] of POSTS) { const g2 = g.createLinearGradient(0, -14, 0, -9.4); g2.addColorStop(0, 'rgba(40,38,34,.5)'); g2.addColorStop(1, 'rgba(40,38,34,.08)'); g.fillStyle = g2; g.fillRect(x - 0.11, -14, 0.22, 4.6); }   // 木桩的倒影
      // 近岸不是一条直线：沿岸擦掉一圈高低不平的边。左头收成一个弯进去的水湾，一直收到远岸 —— 不然水面会被坡地齐齐地切出一条直边
      const shore = x => { const k = clamp((x - 185.8) / 9.2, 0, 1); return -21.6 + 11.85 * Math.sqrt(1 - (1 - k) * (1 - k)); };
      g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000'; g.beginPath(); g.moveTo(168, -9.3);
      for (let x = 168; x <= 252; x += 0.6) g.lineTo(x, shore(x) - 0.35 * rn() - 0.25 * Math.sin(x * 0.9));
      g.lineTo(252, -9.3); g.closePath(); g.fill(); g.globalCompositeOperation = 'source-over';
    }, { floor: 0.02, order: -44, fadeR: 8 });
    { const post = lam(0x1c1814); post.userData.own = true; for (const [x, h, t] of POSTS) add(R, bx(0.2, h, 0.2), post, x, h / 2, -14, false).rotation.z = t; }
    yield;
    // 水面：一块会升高的半透明平面 + 一层流动的反光
    v.water = add(R, bx(5.2, 0.02, 21.2), new THREE.MeshLambertMaterial({ color: 0x203334, transparent: true, opacity: 0.84, emissive: 0x0e1a1c }), (CX0 + CX1) / 2, LOW, GZ + 10.6, false);
    v.water.receiveShadow = true;
    { const [c, g] = mkCanvas(64, 256); g.fillStyle = '#000'; g.fillRect(0, 0, 64, 256);
      for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(255,255,255,${rr(0.05, 0.3)})`; g.fillRect(rr(0, 64), rr(0, 256), rr(6, 30), rr(1, 3)); }
      v.sheenTex = new THREE.CanvasTexture(c); v.sheenTex.wrapS = v.sheenTex.wrapT = THREE.RepeatWrapping; v.sheenTex.repeat.set(1.5, 3);
      const m = new THREE.MeshBasicMaterial({ map: v.sheenTex, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, color: 0xcfe6e0 }); m.userData.own = true;
      v.sheen = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 21.2), m); v.sheen.rotation.x = -Math.PI / 2; v.sheen.position.set((CX0 + CX1) / 2, LOW + 0.02, GZ + 10.6); v.sheen.renderOrder = 20; R.add(v.sheen);
      // 从闸板底下涌出来的水
      const fm = new THREE.MeshBasicMaterial({ map: v.sheenTex, transparent: true, opacity: 0, color: 0xdfeeea, depthWrite: false, side: THREE.DoubleSide });
      v.fall = new THREE.Mesh(new THREE.PlaneGeometry(5.1, 1), fm); v.fall.position.set((CX0 + CX1) / 2, 0, GZ + 0.3); v.fall.renderOrder = 21; R.add(v.fall);
    }
    // 木梁
    v.timber = grp(R, timber.x, timber.y2, 0);
    add(v.timber, bx(TL, 0.42, 0.66), M2.wood, 0, -0.21, 0);
    for (const x of [-TL / 2 + 0.03, TL / 2 - 0.03]) add(v.timber, bx(0.07, 0.44, 0.68), M2.wood2, x, -0.21, 0, false);
    for (const x of [-1.1, 0.2, 1.3]) add(v.timber, bx(0.05, 0.02, 0.66), M2.wood2, x, 0.005, 0, false);
    // 闸杆（在近岸）和连到闸门的拉索
    v.lever = mkLever(R, LEVER_X, 0, -0.55);
    v.lever.g.traverse(o => { if (!o.isMesh) return; if (o.material === MAT.steel) o.material = M2.steel; else if (o.material === MAT.dark) o.material = M2.dark; else if (o.material.isMeshLambertMaterial) o.material.color.setHex(0x752918); });   // 闸杆也跟着压暗
    tube(R, [[LEVER_X, 0.5, -0.9], [LEVER_X + 1.5, 0.25, -3.5], [CX0 - 0.6, 2.2, GZ + 0.6], [CX0 + 0.4, 4.6, GZ + 0.3]], 0.03, M2.dark);
    for (const [x, z, a, l] of [[CX0 - 2.2, 0.9, 0.4, 1.6], [CX0 - 1.4, -1.6, -0.7, 1.2], [CX0 - 3.1, -2.2, 1.2, 0.9]]) { const b = add(R, cy(0.045, 0.06, l, 6), M2.wood2, x, 0.06, z); b.rotation.set(Math.PI / 2, 0, a); }   // 被水冲到岸边的树枝
    // 对岸一盏熄着的小灯，和远处指向旧城方向的检修灯
    add(R, cy(0.05, 0.07, 2.6, 6), M2.dark, CX1 + 3.4, 1.3, -2.2); add(R, bx(0.34, 0.26, 0.34), M2.dark, CX1 + 3.4, 2.7, -2.2);
    add(R, cy(0.12, 0.2, 9.2, 8), M2.dark, X + 139, 4.6, -24); add(R, bx(1.3, 0.14, 0.14), M2.dark, X + 139.5, 8.9, -24);
    v.farGlow = glow(R, 0xcfeaff, 7, 0, X + 139.9, 8.7, -23.8); v.farLens = add(R, new THREE.SphereGeometry(0.22, 10, 8), unlit(0x2c3a40, { fog: false }), X + 139.9, 8.7, -23.8, false);
    v.nearGlow = glow(R, 0xcfeaff, 1.6, 0, CX1 + 3.4, 2.7, -2.0);
    yield;
    // 看得见的光柱：五束光从左上方的枝叶间斜着漏下来，落在闸杆、水闸和对岸；地上各有一块亮斑
    const BEAMS = [[202.6, 2.6, 0.5], [206.3, 1.3, 0.26], [210.4, 2.8, 0.38], [214.2, 1.1, 0.22], [217.4, 2.2, 0.32]];     // [落在哪里, 落地时多宽, 多亮]
    backdrop(190, 228, -1, 16, -1.6, 16, g => {
      for (const [x, w, a] of BEAMS) {
        const gr = g.createLinearGradient(0, 16, 0, 0); gr.addColorStop(0, `rgba(255,238,200,${a})`); gr.addColorStop(0.75, `rgba(255,238,200,${a * 0.6})`); gr.addColorStop(1, `rgba(255,238,200,${a * 0.12})`);
        g.fillStyle = gr; poly(g, [[x - 7.2 - w * 0.2, 16], [x - 7.2 + w * 0.2, 16], [x + w / 2, 0], [x - w / 2, 0]]);
      }
    }, { additive: true, fog: false, blur: 4, order: 40 });
    backdrop(196, 222, -4, 3.5, 0, 14, g => {
      for (const [x, w, a] of BEAMS) {
        g.save(); g.translate(x, -0.4); g.scale(w * 0.62, 1.7);
        const gr = g.createRadialGradient(0, 0, 0, 0, 0, 1); gr.addColorStop(0, `rgba(255,236,196,${a * 0.5})`); gr.addColorStop(1, 'rgba(255,236,196,0)'); g.fillStyle = gr; g.fillRect(-1, -1, 2, 2); g.restore();
      }
    }, { floor: 0.015, additive: true, fog: false, order: -20 });
    // 闸上停着的几只鸟：横梁上三只，对岸的灯杆上一只。扳动闸杆、闸板升起来的时候它们一起飞走。
    // 每只是一小块朝着镜头的薄片，三张贴图轮换：停着、翅膀朝上、翅膀朝下
    const crowTex = pose => {
      const [c, g] = mkCanvas(128, 96); g.setTransform(128, 0, 0, -128, 64, 84); setInk(g, '#0b0d0c');               // 以米为单位画，原点在两脚之间
      if (pose === 0) {
        g.beginPath(); g.ellipse(0, 0.17, 0.2, 0.115, -0.25, 0, 6.2832); g.fill(); disc(g, 0.17, 0.3, 0.075);          // 身子、头
        poly(g, [[0.23, 0.32], [0.36, 0.29], [0.23, 0.26]]); poly(g, [[-0.14, 0.2], [-0.4, 0.06], [-0.36, 0], [-0.1, 0.1]]);   // 喙、尾
        line(g, [[-0.02, 0.08], [-0.03, 0]], 0.022); line(g, [[0.05, 0.08], [0.06, 0]], 0.022);                      // 腿
      } else {
        g.beginPath(); g.ellipse(0, 0.3, 0.2, 0.075, 0, 0, 6.2832); g.fill(); disc(g, 0.2, 0.32, 0.065);               // 飞的时候身子放平
        poly(g, [[0.26, 0.34], [0.38, 0.32], [0.26, 0.29]]); poly(g, [[-0.16, 0.33], [-0.42, 0.3], [-0.16, 0.26]]);
        poly(g, pose === 1 ? [[-0.1, 0.33], [0.12, 0.33], [-0.02, 0.62], [-0.2, 0.58]] : [[-0.1, 0.28], [0.12, 0.28], [0.0, 0.02], [-0.18, 0.06]]);   // 翅膀
      }
      return canvasTex(c);
    };
    const crowTexs = [0, 1, 2].map(crowTex);
    v.crows = [[210.3, 4.31, -6.4, 1, 1], [210.95, 4.31, -6.4, 0.92, -1], [212.6, 4.31, -6.4, 1.05, 1], [CX1 + 3.42, 2.84, -2.0, 1, -1]].map(([x, y, z, s, dir], i) => {
      const m = new THREE.MeshBasicMaterial({ map: crowTexs[0], transparent: true, depthWrite: false }); m.userData.own = true;
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.75), m); mesh.scale.set(dir * s, s, 1); mesh.renderOrder = 30; R.add(mesh);
      return { mesh, x, y, z, s, dir, wait: 0.05 + 0.13 * i, vx: dir * (2.2 + 0.5 * i), vy: 2.3 + 0.25 * (i % 2), vz: -1.2 - 0.4 * i };     // wait：听到动静以后隔多久起飞
    });
    v.crowTexs = crowTexs;
    V = v;
  }

  function update(dt) {
    const on = standingOn(timber), ox = timber.x;
    if (P.grounded && P.y > -0.1 && (P.x < CX0 || P.x > CX1)) W.bank = P.x < CX0 ? -1 : 1;           // 记下主角最后站在哪边岸上：掉进水渠时送回这边
    if (W.open && W.t < 7) { W.t = Math.min(7, W.t + dt); if (W.t >= 7) fx('ok'); }               // 水位涨七秒
    W.k = W.t / 7; W.level = lerp(LOW, HIGH, sstep(0, 1, W.k) * 0.7 + W.k * 0.3);
    placeTimber();
    if (on) { P.x += timber.x - ox; P.y = timber.y2; }                                             // 站在木梁上：跟着它一起漂
    W.lamp = damp(W.lamp, W.k >= 1 ? 1 : 0, 1.2, dt); farLamp.on = W.lamp;
    const near = sstep(40, 8, Math.abs(P.x - (CX0 + 2.6)));
    AUD.water = near * (W.open ? lerp(1, 0.45, sstep(0.9, 1, W.k)) : 0.12);
    if (W.open) W.flown += dt;
    const v = V; if (!v) return;
    // 闸上的鸟：闸板一动，一只接一只起飞，往斜上方、往林子深处飞，越飞越小，几秒以后就看不见了
    for (const b of v.crows) {
      const t = W.flown - b.wait, m = b.mesh;
      if (t <= 0) { m.visible = true; m.material.map = v.crowTexs[0]; m.position.set(b.x, b.y + 0.281 * b.s, b.z); m.scale.set(b.dir * b.s, b.s, 1); }
      else if (t < 7) {
        const k = b.s * Math.max(0.35, 1 - t * 0.09);
        m.visible = true; m.material.map = v.crowTexs[1 + (Math.floor(t * 9 + b.wait * 30) & 1)];              // 翅膀一上一下
        m.position.set(b.x + b.vx * t, b.y + 0.3 + b.vy * t, b.z + b.vz * t); m.scale.set(b.dir * k, k, 1);
      } else m.visible = false;
    }
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
  function reset() { Object.assign(W, { open: false, t: 0, k: 0, level: LOW, lamp: 0, flown: 0, bank: -1 }); placeTimber(); }
  function solve() { Object.assign(W, { open: true, t: 7, k: 1, level: HIGH, lamp: 1, flown: 99, bank: 1 }); placeTimber(); }
  return defZone({ n: 2, vis: [X, X3 + 4], build, update, reset, solve, unbuild() { V = null; }, W, timber });
})();
