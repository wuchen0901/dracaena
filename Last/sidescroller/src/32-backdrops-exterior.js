
// ---------------- 室外：黄昏的废土 ----------------
// 天空：上冷下暖的渐变 + 几道薄云 + 低垂的太阳
backdrop(-300, 700, -60, 260, -430, 1.6, g => {
  const gr = g.createLinearGradient(0, 260, 0, -60);
  [[0, '#2d3d46'], [0.36, '#5d7074'], [0.58, '#a99a82'], [0.72, '#e2b680'], [0.8, '#f1c88b'], [0.9, '#c79a6e'], [1, '#a37d5c']].forEach(([p, c]) => gr.addColorStop(p, c));
  g.fillStyle = gr; box(g, -300, -60, 1000, 320);
  const sun = g.createRadialGradient(292, 16, 0, 292, 16, 190);
  sun.addColorStop(0, 'rgba(255,240,205,.95)'); sun.addColorStop(0.07, 'rgba(255,226,170,.75)'); sun.addColorStop(0.3, 'rgba(255,205,140,.28)'); sun.addColorStop(1, 'rgba(255,200,140,0)');
  g.fillStyle = sun; box(g, 60, -60, 500, 320);
  for (let i = 0; i < 26; i++) {                         // 薄云
    const x = rr(-250, 650), y = rr(30, 150), w = rr(60, 190), h = rr(1.5, 5);
    const c = g.createLinearGradient(x, 0, x + w, 0); const a = rr(0.05, 0.16);
    c.addColorStop(0, 'rgba(255,225,190,0)'); c.addColorStop(0.5, `rgba(255,225,190,${a})`); c.addColorStop(1, 'rgba(255,225,190,0)');
    g.fillStyle = c; g.beginPath(); g.ellipse(x + w / 2, y, w / 2, h, 0, 0, 6.2832); g.fill();
  }
}, { fog: false, order: -4000 });

// 地平线上的巨像：一台跪坐着停机的巨型机器人，只剩一只眼睛还亮着
backdrop(150, 300, -6, 76, -240, 7, g => {
  const gr = g.createLinearGradient(0, 0, 0, 112); gr.addColorStop(0, '#b69a7c'); gr.addColorStop(0.3, '#93826f'); gr.addColorStop(1, '#5d6264');
  setInk(g, gr);
  const X = 232; g.translate(213, 0); g.scale(0.5, 0.5); g.translate(-X, 0);
  poly(g, [[X - 46, -6], [X - 44, 14], [X - 30, 30], [X - 6, 34], [X + 14, 26], [X + 30, 10], [X + 34, -6]]);          // 盘坐的腿和基座
  poly(g, [[X - 24, 28], [X - 30, 62], [X - 22, 82], [X + 2, 88], [X + 20, 78], [X + 22, 50], [X + 14, 28]]);          // 前倾的躯干
  poly(g, [[X - 30, 78], [X - 44, 72], [X - 52, 44], [X - 50, 12], [X - 42, 10], [X - 38, 42], [X - 26, 60]]);         // 垂下的左臂
  poly(g, [[X + 18, 78], [X + 36, 66], [X + 50, 40], [X + 62, 4], [X + 70, -6], [X + 52, -6], [X + 42, 34], [X + 22, 56]]); // 撑地的右臂
  poly(g, [[X - 4, 86], [X - 2, 96], [X + 8, 104], [X + 24, 104], [X + 30, 92], [X + 26, 82], [X + 12, 80]]);          // 低垂的头
  line(g, [[X + 4, 102], [X - 6, 118]], 0.9); line(g, [[X + 16, 104], [X + 18, 114]], 0.6);                            // 天线
  for (const [x1, y1, x2, y2] of [[X - 20, 84, X - 60, -6], [X + 14, 84, X + 84, -6], [X - 46, 60, X - 76, -6]]) cable(g, x1, y1, x2, y2, 9, 0.35);
}, { fog: false, order: -3000 });

// 远处的天际线：断塔、烟囱、歪斜的吊臂
backdrop(-40, 470, -6, 70, -150, 8, g => {
  const gr = g.createLinearGradient(0, 0, 0, 46); gr.addColorStop(0, '#b4987a'); gr.addColorStop(1, '#5e5b58');
  setInk(g, gr);
  heap(g, -40, 470, 0, 0.5, 4, 9);
  for (let x = -30; x < 460; x += rr(9, 26)) {
    const w = rr(4, 13), h = rr(8, 44) * (x > 170 && x < 300 ? 0.45 : 1), t = rnd();
    if (t < 0.4) { poly(g, [[x, -6], [x, h * rr(0.7, 0.95)], [x + w * rr(0.3, 0.6), h], [x + w, h * rr(0.5, 0.85)], [x + w, -6]]); }                // 断塔
    else if (t < 0.6) { poly(g, [[x, -6], [x + w * 0.22, h * 1.1], [x + w * 0.5, h * 1.1], [x + w * 0.72, -6]]); }                                // 冷却塔 / 烟囱
    else if (t < 0.8) { box(g, x, -6, 1.3, h + 6); line(g, [[x + 0.6, h], [x + rr(9, 18), h * rr(0.55, 0.85)]], 0.8); truss(g, x - 3, x + 4, h * 0.6, 1.6, 0.4); }   // 吊塔
    else { for (let i = 0; i < 4; i++) box(g, x + i * 2.8, -6, 1.1, h * rr(0.3, 0.8) + 6); box(g, x - 1, h * 0.28, 12, 1.1); }                    // 管廊
  }
}, { fog: false, order: -2000 });

// 中景：高压线塔、倒下的步行机械、支架上的管道
backdrop(84, 300, -4, 36, -52, 18, g => {
  setInk(g, '#1e1d1f');
  { const pts = [[84, -4]]; for (let x = 84; x <= 300; x += rr(1.5, 4.5)) pts.push([x, groundY(x) + rr(0.3, 1.6)]); pts.push([300, -4]); poly(g, pts); }
  const pylon = (x, h, lean) => {
    const t = [x + lean * h, h];
    line(g, [[x - 1.7, -1], t, [x + 1.7, -1]], 0.22);
    for (let k = 0.2; k < 1; k += 0.2) line(g, [[lerp(x - 1.7, t[0], k), lerp(-1, h, k)], [lerp(x + 1.7, t[0], k + 0.1), lerp(-1, h, k + 0.1)], [lerp(x - 1.7, t[0], k + 0.2), lerp(-1, h, k + 0.2)]], 0.12);
    for (const f of [0.72, 0.9]) line(g, [[t[0] - 3.4 * f, h * f], [t[0] + 3.4 * f, h * f]], 0.2);
    return t;
  };
  const tops = [[100, 21, 0.02], [134, 24, -0.06], [171, 19, 0.16], [215, 23, 0.0], [262, 22, -0.03]].map(a => pylon(...a));
  for (let i = 1; i < tops.length; i++) for (const d of [-3, 3]) cable(g, tops[i - 1][0] + d, tops[i - 1][1] * 0.9, tops[i][0] + d, tops[i][1] * 0.9, 5 + i, 0.07);
  // 倒下的步行机械：一条拱起的腿和半埋的机身
  g.translate(0, 2.8);
  g.lineWidth = 1.5; g.beginPath(); g.moveTo(146, -1); g.quadraticCurveTo(150, 15, 160, 9); g.stroke();
  line(g, [[160, 9], [168, -1]], 1.1); disc(g, 160, 9, 1.5);
  poly(g, [[150, -1], [152, 5], [163, 6.5], [176, 3], [181, -1]]);
  // 支架上的管道
  box(g, 186, 5.2, 62, 1.1); box(g, 186, 3.6, 62, 0.6);
  for (let x = 188; x < 248; x += 7.5) { box(g, x, -1, 0.5, 6.4); line(g, [[x - 1.6, -1], [x + 0.25, 4]], 0.2); }
});

// 近景：歪斜的杆子、铁丝网、矮废料堆
backdrop(88, 170, -3, 14, -11, 30, g => {
  setInk(g, '#151516');
  { const pts = [[88, -3]]; for (let x = 88; x <= 170; x += rr(0.6, 1.6)) pts.push([x, groundY(x) + rr(-0.2, 0.32)]); pts.push([170, -3]); poly(g, pts); }
  const base = x => groundY(x) - 0.3;
  for (const [x, h, lean] of [[97, 5.5, 0.12], [103.5, 4.2, -0.2], [112.4, 6.4, 0.05], [125, 5.2, -0.1], [133, 7, 0.08], [146, 5, 0.2]]) {
    line(g, [[x, base(x)], [x + lean * h, base(x) + h]], 0.2);
    line(g, [[x + lean * h - 0.8, base(x) + h * 0.86], [x + lean * h + 0.8, base(x) + h * 0.9]], 0.12);
  }
  for (let x = 105; x < 121; x += 2.2) line(g, [[x, base(x)], [x + 0.15, base(x) + 1.7]], 0.09);        // 铁丝网的桩
  for (const h of [0.7, 1.15, 1.55]) cable(g, 105, base(105) + h, 121, base(121) + h, 0.25, 0.035);
  poly(g, [[127, base(127)], [128.5, base(127) + 2.3], [131.2, base(127) + 2.9], [134.6, base(127) + 1.2], [136, base(127)]]);   // 半埋的机壳
});

// 前景：离镜头最近的一层，全黑、略微虚焦。只占画面最下沿和最上沿，不挡住主角
backdrop(-22, 150, -3, 10, 6, 22, g => {
  setInk(g, '#040607');
  const top = [[-22, -5]];
  for (let x = -22; x <= 150; x += rr(0.4, 1.3)) {
    const out = x > 91, h = out ? groundY(Math.max(x, 91) * 0.985 + 1) * 0.72 + rr(0.25, 0.6) : rr(0.1, 0.62);
    top.push([x, h]);
    if (rnd() < (out ? 0.5 : 0.1)) { top.push([x + 0.05, h + rr(0.25, out ? 0.7 : 1.3)], [x + 0.12, h]); }        // 草叶 / 钢筋
  }
  top.push([150, -5]); poly(g, top);
  for (const [x, w] of [[7.2, 0.34], [52.4, 0.5]]) box(g, x, -3, w, 13);                       // 两根近处的柱子：经过时扫过画面
  for (let x = -20; x < 88; x += rr(9, 17)) cable(g, x, 10, x + rr(6, 12), 10, rr(1.6, 2.5), 0.09);  // 顶上垂下的缆线
}, { fog: false, blur: 2.2, order: 4000 });
