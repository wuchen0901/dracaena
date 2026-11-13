
// ============================================================
//  第九章 · 山洞与暗河：一条横着剖开的长山洞，一路有水，要跳下去游过去，潜到岩石底下钻过去，再从另一边浮上来、爬上岸
//  （故事还在重写，这一章先单独放在最后，从章节菜单进；以后按剧情挪到该放的地方，也可以删掉其中几段）
//  八段，每段一种光和颜色（山洞画面图 generated_images/scene-cave-01-looks.png 的八格，用户说“都做，连在一起”）：
//    一 冷青的雾（洞口，第一个水潭在水面上游过去）  二 别人留下的灯（一串旧灯泡通到水边，第一次潜水）
//    三 天窗 + 沉在水底的灯（画面图第 8 格）        四 天窗（高高的洞厅，一束光落进水潭）
//    五 浑浊的绿水（一段长长的、看不清的潜水）       六 铁锈水（旧矿洞：锈痕、木头支架）
//    七 发光的水（最深最黑的地方，两段潜水，中间一口气） 八 洞口的天光（水被外面的光照成绿的，走出山洞）
//  形状全由地面（terrain）和洞顶（ceiling）两条折线决定：画出来的岩石就是挡住人的岩石
// ============================================================
const X9 = 1100;
const CH9 = (() => {
  const X = X9;
  const C = chapter({ n: 9, x0: X + 0.5, start: X + 3, name: '山洞与暗河', sub: '潜下去，游到有光的地方',
    intro() { CAT.state = 'none'; } });                    // 小猫不进山洞（它怕水）
  C.ground = 'rock';                                                               // 脚步声：湿的岩石
  const A = (pts) => pts.map(([x, y]) => [X + x, y]);
  // ---- 地面（脚下的岩石、潭底）----
  terrain(...A([[-30, 0], [9.5, 0], [9.9, -0.6], [10.3, -2.4], [11.2, -3.1], [16, -3.3], [21.5, -3.1], [22.6, -2.2], [23.1, -0.7], [23.35, 0.3], [30, 0.3], [34, 0.2],
    [40, 0], [47, 0], [47.4, -0.6], [47.8, -2.8], [48.6, -3.9], [55, -4.2], [60, -4.0], [61.2, -3.1], [61.7, -1.4], [62.0, -0.5], [62.25, 0.3], [70, 0.3],
    [80, 0.1], [85.2, 0], [85.55, -0.8], [85.75, -2.4], [86.1, -3.6], [86.8, -4.3], [89, -4.5], [92, -4.6], [95, -4.45], [96.8, -4.3], [97.6, -3.9], [98.15, -3.0], [98.4, -1.8], [98.55, -0.6], [98.65, 0.3], [104, 0.3], [110, 0.35],
    [118, 0.3], [122, 0.3], [122.4, -0.5], [123, -2.6], [124, -3.5], [130, -3.8], [136, -3.6], [137.4, -2.5], [137.9, -0.9], [138.2, 0.6], [146, 0.6],
    [150, 0.5], [155, 0.4], [155.4, -0.5], [155.9, -2.6], [156.8, -3.8], [160, -4.2], [164, -5.0], [168, -5.1], [171, -4.6], [174, -4.0], [175.3, -3.0], [175.8, -1.5], [176.1, -0.4], [176.35, 0.3], [184, 0.3],
    [192, 0.2], [197, 0.2], [197.4, -0.5], [197.8, -2.2], [198.6, -3.2], [204, -3.4], [208, -3.3], [209.2, -2.4], [209.7, -0.8], [210.0, 0.4], [216, 0.4], [224, 0.3],
    [232, 0.2], [236, 0], [236.4, -0.6], [236.9, -2.8], [237.8, -4.0], [242, -4.6], [247, -4.8], [252, -4.7], [257, -4.9], [262, -4.6], [266, -4.2], [267.3, -3.2], [267.8, -1.6], [268.1, -0.4], [268.35, 0.3], [274, 0.3],
    [280, 0.2], [285, 0.2], [285.4, -0.5], [285.9, -2.4], [286.8, -3.3], [292, -3.6], [298, -3.4], [299.4, -2.4], [299.9, -0.8], [300.2, 0.3], [306, 0.4], [312, 0.8], [318, 1.3], [324, 1.6], [360, 1.6]]));
  // ---- 洞顶：往下压进水里的地方就是要潜过去的岩石；第七段中间抬起来一点，是一个能换气的小气室 ----
  ceiling(...A([[-30, 14], [-10, 10], [-7, 6.5], [-5, 4.6], [-2.5, 3.9], [1, 3.6], [6, 3.4], [9, 3.9], [13, 4.4], [17, 4.6], [21, 4.0], [25, 3.5], [29, 3.2], [33, 3.0], [36.5, 3.1],
    [40, 3.3], [44, 3.2], [46.5, 3.1], [49.5, 2.95], [50.6, 2.1], [51.2, 0.7], [51.6, -0.8], [52.1, -1.7], [53, -1.95], [55.5, -2.05], [56.6, -1.8], [57.2, -1.0], [57.6, 0.3], [58.2, 1.9], [59, 2.9], [62, 3.3], [66, 3.4], [72, 3.2],
    [80, 3.3], [85, 2.9], [87.2, 2.85], [88.1, 2.6], [88.6, 1.8], [88.9, 0.6], [89.2, -0.6], [89.55, -1.45], [90.1, -1.9], [91.3, -2.0], [92.6, -2.05], [93.3, -1.85], [93.75, -1.3], [94.1, -0.3], [94.4, 0.9], [94.8, 2.0], [95.4, 2.9], [96.4, 3.3], [98, 3.45], [104, 3.6], [110, 3.5],
    [118, 3.6], [121, 4.2], [124, 5.5], [127, 6.4], [129.5, 6.7], [131.5, 6.6], [134, 6.0], [137, 4.8], [140, 3.9], [145, 3.4],
    [150, 3.2], [154, 3.0], [157.5, 2.8], [158.4, 1.6], [158.9, 0.2], [159.4, -1.3], [160.2, -2.4], [163, -2.9], [166, -3.0], [169, -2.8], [171.5, -2.2], [172.6, -1.4], [173.2, -0.2], [173.8, 1.4], [174.6, 2.6], [176, 3.2], [184, 3.3],
    [192, 3.1], [197, 3.0], [200.5, 2.9], [201.3, 1.4], [201.7, -0.4], [202.1, -1.5], [203.5, -1.65], [204.6, -1.5], [205.1, -0.5], [205.5, 1.2], [206.2, 2.6], [208, 3.0], [214, 3.1], [222, 3.0],
    [232, 3.0], [236, 3.2], [238.5, 3.0], [239.3, 1.6], [239.8, 0.0], [240.3, -1.4], [241.2, -2.2], [244, -2.4], [246.5, -2.3], [247.3, -1.5], [247.8, -0.6], [248.2, 0.8], [249.5, 1.2], [251, 0.9], [251.5, -0.5], [252.1, -1.6], [253, -2.3], [257, -2.5], [261, -2.3], [262.5, -1.6], [263.1, -0.4], [263.6, 1.2], [264.5, 2.6], [266, 3.2], [272, 3.3],
    [280, 3.1], [285, 3.3], [288.5, 3.0], [289.3, 1.5], [289.8, -0.2], [290.3, -1.4], [291.2, -1.9], [293.5, -2.0], [294.4, -1.5], [294.9, -0.3], [295.4, 1.4], [296.2, 2.8], [298, 3.6], [303, 4.6], [308, 5.8], [312, 7.6], [316, 10], [320, 14], [330, 20], [360, 24]]));
  const W = [[9.62, 23.3, -3.3], [47.12, 62.2, -4.2], [85.35, 98.6, -4.6], [122.15, 138.15, -3.8], [155.1, 176.3, -5.1], [197.12, 209.95, -3.4], [236.12, 268.3, -4.9], [285.12, 300.15, -3.6]]
    .map(([a, b, bot]) => water({ x1: X + a, x2: X + b, y: -0.35, bot }));
  groundFront(X - 30, X + 360, null);                     // 共用的地面这一段不铺：山洞自己搭（前面是岩石的剖面）
  solid({ x1: X + 338, x2: X + 340, y1: -2, y2: 30, noclimb: true });   // 走出山洞以后先到这里为止
  solid({ x1: X - 7.5, x2: X - 6.5, y1: -2, y2: 30, noclimb: true });   // 身后是进来的洞口，不往回走
  ground(X - 30, 0x1c2224); ground(X + 360, 0x1c2224);
  for (const x of [3, 25.5, 41, 63.5, 81, 100, 119, 139.5, 151, 177.5, 193, 211, 233, 269.5, 281, 301.5, 320]) checkpoint(X + x);
  // 镜头压到和主角的头差不多高、平着看（抬高量是负的：眼睛往下挪，看的还是同一点），水面、地面、洞顶都只是窄窄的一条，和剖面图一样
  camKeys([X - 20, 20, 1.3, 0.5, -1.0], [X + 116, 20, 1.3, 0.5, -1.0], [X + 124, 21.5, 1.9, 0.5, -0.9], [X + 140, 21.5, 1.9, 0.5, -0.9], [X + 148, 20, 1.3, 0.5, -1.0],
    [X + 304, 20.5, 1.4, 0.8, -1.0], [X + 314, 22, 2.0, 1.5, -0.6], [X + 360, 22, 2.0, 1.5, -0.6]);

  hint(() => P.x > X + 5.5 && P.x < X + 9.6 && P.grounded && P.cp <= 1, '跳下去，<b>← →</b> 游泳');
  hint(() => P.mode === 'swim' && P.x > X + 10 && P.x < X + 23.3 && !P.under, '游到对岸，往岸边一推，就撑上去了');
  hint(() => P.mode === 'swim' && P.x > X + 47.2 && P.x < X + 51.6 && !P.under, '按住 <b>↓</b> 潜下去，从岩石底下游过去');
  hint(() => P.mode === 'swim' && P.x > X + 50 && P.x < X + 58 && P.under, '<b>空格</b> 往上，<b>↓</b> 往下；什么都不按，人会慢慢浮上去');
  hint(() => P.mode === 'swim' && P.x > X + 244 && P.x < X + 248.2 && P.under && P.air < 15, '前面头顶上有一口气');

  // ============================================================
  //  八段的光和颜色（数值来自 Last/tools/cave-sheet.html 的八格；位置换成了这一章的坐标）
  //  amb / ambW 后墙在水上、水下的底色；lights 后墙上的光斑 [x, y, 半径, 'r,g,b', 强度]；tint / tint2 主角前面的水 / 七米深处的水 [r,g,b,不透明度]（水面处 → 潭底）；
  //  surf(x) 水面那道亮线多亮；floorC / ceilC 地面、洞顶的颜色（0..1）；mid / rim 中间一层剪影的颜色和亮边；fill 跟着主角的补光；env 这一段的环境；pts 照主角的灯
  // ============================================================
  const exp2 = (x, c, w) => Math.exp(-((x - c) ** 2) / w);
  const SEC = [
    { x1: -16, x2: 40, name: '冷青的雾', amb: '#2a393d', ambW: '#22302f', mid: '#141d20', rim: '#5c7074', fill: 0xa9c2c4,
      lights: [[-9, 3, 9, '125,155,160', 0.6], [5, 2, 9, '80,100,104', 0.3], [17, 2.5, 10, '75,95,98', 0.26], [32, 2, 8, '60,78,80', 0.22]],
      tint: [[62, 86, 88, 0.42], [30, 44, 47, 0.68]], tint2: [[58, 80, 82, 0.58], [28, 40, 43, 0.88]], surf: () => 0.5, surfC: [200, 220, 222],
      floorC: [0.36, 0.4, 0.4], ceilC: [0.26, 0.3, 0.31], mist: ['150,176,178', 0.26], specks: { n: 220, c: 0xbfd6d6, a: 0.4 }, mouthL: true,
      env: { fog: 0x2a3a3e, fogD: 0.012, hemiS: 0x9fb6bd, hemiG: 0x1c2224, hemiI: 0.6, keyC: 0xd4e6ec, keyI: 0.35, keyDir: [-0.5, 1, 0.45], rimI: 0.25 } },
    { x1: 40, x2: 80, name: '别人留下的灯', amb: '#0a0e11', ambW: '#080e10', mid: '#05080a', rim: '#7a5434', fill: 0xc8a07a,
      lights: [[42.7, 1.9, 2.6, '255,165,90', 0.34], [46, 1.85, 2.6, '255,165,90', 0.34], [48.6, 2.05, 2.6, '255,165,90', 0.34], [50, 0.95, 2.8, '255,170,95', 0.5], [62, 1.5, 6, '40,55,60', 0.1], [73, 1.5, 6, '40,55,60', 0.1]],
      tint: [[22, 42, 42, 0.38], [6, 14, 16, 0.68]], tint2: [[16, 32, 32, 0.52], [5, 10, 12, 0.88]], surf: x => 0.15 + 0.7 * exp2(x, 50, 2), surfC: [255, 205, 150],
      floorC: [0.2, 0.18, 0.16], ceilC: [0.15, 0.13, 0.12], specks: { n: 200, c: 0xffcf96, a: 0.4 }, lamps: true,
      env: { fog: 0x07090b, hemiS: 0x1a2a30, hemiG: 0x07090a, hemiI: 0.3, keyI: 0.05, keyDir: [0.2, 1, 0.3], rimI: 0 },
      pts: [[42.7, 1.85, -4.6, 0xffa860, 2.2, 6], [46, 1.8, -4.6, 0xffa860, 2.2, 6], [48.6, 2.0, -3.7, 0xffa860, 2.2, 6], [50, 0.9, -2.2, 0xffb46a, 2.8, 7]] },
    { x1: 80, x2: 118, name: '天窗与沉灯', amb: '#0c1215', ambW: '#0b1517', mid: '#070b0d', rim: '#90b4b4', fill: 0x8fc6c4,
      lights: [[96.6, 1.4, 5.5, '120,160,165', 0.55], [96.6, 3.1, 1.8, '210,235,235', 0.65], [94.9, -4.0, 3.0, '230,150,70', 0.5], [83, 1.6, 7, '40,55,60', 0.12], [96.4, -2.6, 4.5, '50,130,130', 0.42], [108, 1.6, 7, '50,70,74', 0.15]],
      tint: [[34, 88, 90, 0.32], [5, 20, 24, 0.66]], tint2: [[24, 70, 72, 0.42], [4, 15, 18, 0.86]], surf: x => 0.25 + 0.75 * exp2(x, 96.6, 6), surfC: [220, 245, 245],
      floorC: [0.22, 0.24, 0.24], ceilC: [0.15, 0.17, 0.17], specks: { n: 300, c: 0xafe1e1, a: 0.5 }, sky: { x: 96.6, w0: 0.75, w1: 2.0, rays: 7, spread: [93, 100.3] }, sunk: [94.9, -0.9],
      env: { fog: 0x0b1214, hemiS: 0x2a4246, hemiG: 0x080c0e, hemiI: 0.35, keyI: 0.08, keyDir: [0.1, 1, 0.2], rimI: 0 },
      pts: [[94.9, -4.05, -0.5, 0xffa850, 3.6, 7], [96, -2.0, 1.6, 0x63bcb8, 2.2, 8]] },
    { x1: 118, x2: 150, name: '天窗', amb: '#0c1215', ambW: '#0b1517', mid: '#070b0d', rim: '#96bebe', fill: 0x8fc6c4,
      lights: [[130.6, 2.5, 7, '120,160,165', 0.6], [130.6, 6.2, 2.4, '210,235,235', 0.7], [121, 1.6, 6, '60,82,88', 0.18], [130.4, -2.4, 6, '50,130,130', 0.5], [143, 1.5, 6, '60,82,88', 0.2]],
      tint: [[34, 88, 90, 0.32], [5, 20, 24, 0.66]], tint2: [[24, 70, 72, 0.42], [4, 15, 18, 0.86]], surf: x => 0.25 + 0.75 * exp2(x, 130.6, 8), surfC: [220, 245, 245],
      floorC: [0.24, 0.26, 0.26], ceilC: [0.16, 0.18, 0.18], specks: { n: 380, c: 0xafe1e1, a: 0.5 }, sky: { x: 130.6, w0: 1.0, w1: 2.7, rays: 9, spread: [125.5, 136] },
      env: { fog: 0x0c1416, hemiS: 0x355458, hemiG: 0x0a1012, hemiI: 0.42, keyI: 0.12, keyDir: [0.1, 1, 0.2], rimI: 0 },
      pts: [[129.5, -2.2, 1.6, 0x63bcb8, 2.6, 8]] },
    { x1: 150, x2: 192, name: '浑浊的绿水', amb: '#1d1e17', ambW: '#1a1d12', mid: '#0d0e0a', rim: '#6e6e50', fill: 0xb4bc8c,
      lights: [[150, 3.5, 9, '120,120,95', 0.3], [166, 2.5, 9, '110,112,88', 0.25], [183, 3, 8, '110,112,88', 0.25]],
      tint: [[60, 72, 38, 0.5], [22, 30, 14, 0.82]], tint2: [[52, 62, 32, 0.86], [20, 26, 12, 0.97]], frontK: 0.55, surf: () => 0.4, surfC: [200, 210, 160], murk: [90, 105, 60, 0.2],
      floorC: [0.3, 0.29, 0.22], ceilC: [0.2, 0.2, 0.15], specks: { n: 650, c: 0xaab978, a: 0.4, size: 0.022 },
      env: { fog: 0x1d1f16, hemiS: 0x7a8a5a, hemiG: 0x1a1c12, hemiI: 0.5, keyI: 0.08, keyDir: [-0.2, 1, 0.3], rimI: 0 } },
    { x1: 192, x2: 232, name: '铁锈水', amb: '#1a1a19', ambW: '#1d1611', mid: '#0b0a09', rim: '#7a8488', fill: 0xc49c80,
      lights: [[200, 3.0, 6, '140,160,165', 0.35], [214, 2.5, 7, '95,100,102', 0.25], [204, -2.5, 7, '120,60,25', 0.3], [226, 2, 7, '95,100,102', 0.2]],
      tint: [[84, 48, 28, 0.42], [34, 18, 10, 0.76]], tint2: [[74, 40, 22, 0.62], [28, 14, 7, 0.92]], surf: () => 0.45, surfC: [230, 190, 150],
      floorC: [0.3, 0.24, 0.2], ceilC: [0.22, 0.2, 0.19], specks: { n: 300, c: 0xdca06e, a: 0.35 }, rust: true, timbers: [203, 212, 216.5, 221, 225.5, 230],
      env: { fog: 0x1a1512, hemiS: 0x8a6a50, hemiG: 0x1a0f08, hemiI: 0.42, keyI: 0.1, keyDir: [-0.3, 1, 0.3], rimI: 0 },
      pts: [[200, 2.6, 0.5, 0xa8bcc0, 2.0, 10]] },
    { x1: 232, x2: 280, name: '发光的水', amb: '#05080b', ambW: '#04090d', mid: '#04070a', rim: '#2a6c80', fill: 0x5fc8ee,
      lights: [[244, -0.2, 9, '25,90,115', 0.4], [258, -0.2, 9, '25,90,115', 0.4], [244, -4.2, 9, '15,105,135', 0.55], [258, -4.2, 9, '15,105,135', 0.55], [249.5, 0.6, 2.5, '40,140,170', 0.4], [235, 1.5, 6, '20,50,65', 0.12], [274, 1.5, 6, '20,50,65', 0.12]],
      tint: [[6, 30, 46, 0.3], [4, 42, 62, 0.45]], tint2: [[4, 24, 40, 0.5], [5, 48, 70, 0.62]], surf: () => 0.55, surfC: [120, 220, 255],
      floorC: [0.07, 0.17, 0.21], ceilC: [0.05, 0.09, 0.11], specks: { n: 900, c: 0x78ebff, a: 0.85, glow: true, size: 0.035 }, algae: true,
      env: { fog: 0x04080b, hemiS: 0x0d2630, hemiG: 0x050a0c, hemiI: 0.28, keyI: 0.02, keyDir: [0, 1, 0.3], rimI: 0 },
      pts: [[242, -4.4, 0.5, 0x3fd2ff, 2.6, 6], [249.5, -1.0, 0.5, 0x3fd2ff, 2.2, 5], [257, -4.5, 0.5, 0x3fd2ff, 2.6, 6], [264, -4.2, 0.5, 0x3fd2ff, 2.4, 6]] },
    { x1: 280, x2: 350, name: '洞口的天光', amb: '#10171a', ambW: '#0d1a19', mid: '#080c0d', rim: '#90b4a8', fill: 0x9cd0bc,
      lights: [[314, 2.5, 8, '115,145,145', 0.5], [305, 1.5, 8, '90,120,118', 0.4], [296, -2.4, 9, '45,120,100', 0.55], [282, 1.5, 6, '45,60,64', 0.15]],
      tint: [[42, 100, 88, 0.36], [7, 26, 24, 0.66]], tint2: [[34, 90, 78, 0.45], [6, 22, 20, 0.85]], surf: x => 0.22 + 0.78 * sstep(286, 299, x), surfC: [200, 232, 220], scat: [60, 160, 130],
      floorC: [0.28, 0.31, 0.3], ceilC: [0.18, 0.21, 0.21], specks: { n: 300, c: 0xaae1cd, a: 0.45 }, mouthR: true, glowW: [[298, -1.6, 8, 0x3ca082, 0.3]],
      env: { fog: 0x1a2524, hemiS: 0x40605a, hemiG: 0x0b1210, hemiI: 0.45, keyI: 0.2, keyDir: [0.6, 1, 0.3], rimI: 0 },
      pts: [[296.5, -2.4, 1.5, 0x5aa890, 3.2, 9], [312, 3, 0, 0xb8cccc, 3, 16]] },
  ];
  // 环境：每一段一组，段与段之间几米里慢慢换过去
  const ENVC = { dustO: 0, wind: 0, ext: 0, sky: [0x05080a, 0x05080a, 0x05080a, 0x05080a, 0x05080a, 0x05080a], sunP: 0, stars: 0, cloud: 0, birds: 0, flies: 0, vig: 1, rimC: 0x9fb6bd,
    aWind: 0, aLeaf: 0, aBug: 0, aCity: 0, aHum: 0, aRoom: 0.7, roomF: 120, aDrip: 1, aFlow: 0.5, aFar: 0.8, rvCave: 1, rvHall: 0, rvOut: 0 };   // 声音：山洞的低鸣，到处滴水（带回声），暗河在远处流，偶尔滚下几颗石子
  for (const S of SEC) { env(X + S.x1 + (S.x1 > 0 ? 2 : 0), { ...ENVC, ...S.env }); env(X + Math.min(S.x2 - 2, 304), {}); }
  env(X + 316, { fog: 0x6a7c7a, hemiS: 0xc8d6d4, hemiG: 0x2a3433, hemiI: 0.85, keyI: 0.45,
    rvCave: 0.35, rvOut: 0.7, aRoom: 0.2, aWind: 0.35, aDrip: 0.2, aFlow: 0.3, birds: 0.35, aLeaf: 0.3, leafDry: 0.3 });   // 洞口：外面的风和鸟   // 洞口外面亮起来
  // 照主角的灯（各段登记好，离镜头近的几盏才真的亮）；另有一盏跟着主角走的补光，颜色跟着段落换
  for (const S of SEC) for (const [x, y, z, c, i, d] of S.pts || []) pointLight({ p: [X + x, y, z], c, i, d });
  const skyL = SEC.filter(S => S.sky).map(S => spotLight({ p: [X + S.sky.x, 9, 0.5], t: [X + S.sky.x - 0.4, -3.5, 0], c: 0xd8eef0, i: 6, d: 16, a: 0.32, pen: 0.8 }));
  spotLight({ p: [X + 324, 9, -3], t: [X + 300, -1, 0], c: 0xc0d6d0, i: 4.5, d: 34, a: 0.45, pen: 0.9 });
  const fillL = pointLight({ p: [X, 0, 3.2], c: 0x9fc4c4, i: 1.5, d: 7 });
  const secAt = x => { for (const S of SEC) if (x < X + S.x2) return S; return SEC[SEC.length - 1]; };
  // 地面、洞顶的颜色在两段交界前后各 4 米里慢慢换过去；照在上面的光斑用全章的（相邻一段的光也照得过来）
  const ALL_LIGHTS = SEC.flatMap(S => S.lights.map(([x, y, r, c, a]) => [X + x, y, r, c, a])), lumAll = lumOf(ALL_LIGHTS);
  const secCol = (x, key) => {
    const i = SEC.indexOf(secAt(x)), S = SEC[i], a = S[key], d1 = x - (X + S.x1), d2 = X + S.x2 - x;
    const N = d1 < 4 && i > 0 ? SEC[i - 1] : d2 < 4 && i < SEC.length - 1 ? SEC[i + 1] : null; if (!N) return a;
    const t = 0.5 * (1 - Math.min(d1, d2) / 4), b = N[key]; return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  };

  // ============================================================
  //  搭一段
  // ============================================================
  function* buildSec(R, S, k) {
    const x1 = X + S.x1, x2 = X + S.x2, ws = W.filter(w => w.x2 > x1 && w.x1 < x2);
    const lights = S.lights.map(([x, y, r, c, a]) => [X + x, y, r, c, a]), lum = lumAll;
    const hex = c => '#' + c.toString(16).padStart(6, '0');
    // 1 岩石的剖面、地面、洞顶
    caveCut(R, x1, x2, { skip: x => ws.some(w => x > w.x1 - 0.5 && x < w.x2 + 0.5 && ceilY(x) < 2) });
    const wfog = (x, y, z, base) => {                         // 水下的地面沉进水色里：越深、越往里越看不清
      const w = waterAt(x); if (!w || y > w.y) return base;
      const d = S.tint2[1], f = clamp(1 - Math.exp(-(Math.max(0, -z) * 0.32 + (w.y - y) * 0.12)), 0, 0.92);
      return [lerp(base[0], d[0] / 255, f), lerp(base[1], d[1] / 255, f), lerp(base[2], d[2] / 255, f)];
    };
    caveSurface(R, TERRAIN, groundY, x1, x2, (x, y, z) => { const fc = secCol(x, 'floorC'), L = clamp(lum(x, y + 0.8), 0, 1.2), b = [fc[0] * (0.7 + 0.5 * L), fc[1] * (0.7 + 0.5 * L), fc[2] * (0.7 + 0.5 * L)]; return wfog(x, y, z, b.map(v => v * (z < -5 ? 0.8 : 1))); }, false);
    caveSurface(R, CEIL, ceilY, x1, x2, (x, y) => { const cc = secCol(x, 'ceilC'), L = clamp(lum(x, y - 0.8), 0, 1.2); return [cc[0] * (0.6 + 0.6 * L), cc[1] * (0.6 + 0.6 * L), cc[2] * (0.6 + 0.6 * L)]; }, true);
    yield;
    // 2 后墙
    caveWall(R, { x1, x2, y1: -7, y2: S.mouthR ? 16 : 8, ppm: 50, amb: S.amb, ambW: S.ambW, lights, tint2: S.tint2, waters: ws, fadeL: k ? 6 : 0, order: -2800 + k,
      draw(g) {
        if (S.mouthL) {                                       // 洞口：左边透进来外面的雾
          g.save(); g.filter = 'blur(6px)'; const gr = g.createLinearGradient(X - 4, 0, X - 12, 0); gr.addColorStop(0, 'rgba(170,196,198,0)'); gr.addColorStop(1, 'rgba(176,200,202,.95)'); g.fillStyle = gr;
          g.beginPath(); g.moveTo(X - 3, -1); g.quadraticCurveTo(X - 5, 3, X - 4, 8); g.lineTo(X - 22, 8); g.lineTo(X - 22, -1); g.closePath(); g.fill(); g.restore();
        }
        if (S.mouthR) {                                       // 出口：岩壁上开着一个大洞口，外面是阴天：灰白的天，雾里两层山，近处几棵树的影子；洞口边上的岩石是暗的
          const mouth = () => { g.beginPath(); g.moveTo(X + 309.5, 0.5); g.bezierCurveTo(X + 310.3, 3.6, X + 312.4, 6.6, X + 316.5, 8.4); g.bezierCurveTo(X + 321, 10.2, X + 330, 11.2, X + 358, 11.6); g.lineTo(X + 358, 0.5); g.closePath(); };
          g.save(); g.filter = 'blur(14px)'; g.fillStyle = 'rgba(120,145,142,.55)'; mouth(); g.fill(); g.restore();          // 洞口周围的岩石被外面的光照亮一圈
          g.save(); mouth(); g.clip();
          const sky = g.createLinearGradient(0, 11.6, 0, 0.5); sky.addColorStop(0, '#8b9fa2'); sky.addColorStop(0.55, '#aebcbb'); sky.addColorStop(1, '#c3ccc8'); g.fillStyle = sky; g.fillRect(X + 305, 0, 56, 12);
          g.filter = 'blur(3px)';
          for (const [h, a, f, col] of [[3.6, 1.3, 0.13, 'rgba(146,162,160,.75)'], [2.3, 0.9, 0.29, 'rgba(118,136,132,.85)']]) {
            g.fillStyle = col; g.beginPath(); g.moveTo(X + 306, 0.4); for (let x = X + 306; x <= X + 358; x += 0.4) g.lineTo(x, h + a * Math.sin(x * f + h) + 0.35 * a * Math.sin(x * f * 2.7)); g.lineTo(X + 358, 0.4); g.closePath(); g.fill();
          }
          g.fillStyle = 'rgba(70,86,82,.9)';                    // 近处的几棵树和灌木
          for (const [x, h] of [[314.2, 2.6], [316.8, 3.4], [318.1, 2.2], [323.5, 3.8], [326.4, 2.7], [331, 3.2], [335.5, 2.4]]) { g.fillRect(X + x - 0.06, 0.4, 0.12, h * 0.55); for (let k = 0; k < 7; k++) { const a = k / 7 * 6.28; g.beginPath(); g.ellipse(X + x + Math.cos(a) * h * 0.18, 0.4 + h * 0.62 + Math.sin(a) * h * 0.16, h * 0.2, h * 0.17, 0, 0, 6.283); g.fill(); } }
          g.restore();
          g.save(); g.filter = 'blur(5px)'; g.strokeStyle = 'rgba(10,14,15,.85)'; g.lineWidth = 0.6; mouth(); g.stroke(); g.restore();   // 洞口的边：一圈暗的岩石
        }
        if (S.rust) {                                         // 锈：岩石上一片片发红，水线上一圈沉积，几道细细往下渗的锈水
          for (let i = 0; i < 60; i++) { const x = rr(x1 - 6, x2 + 6), y = rr(0, 3.2); g.save(); g.globalCompositeOperation = 'multiply'; caveBlob(g, x, y, rr(0.6, 1.8), '200,120,80', rr(0.35, 0.7)); g.restore(); }
          for (const w of ws) { g.save(); g.globalCompositeOperation = 'multiply'; const b = g.createLinearGradient(0, w.y + 0.9, 0, w.y); b.addColorStop(0, 'rgba(210,130,90,0)'); b.addColorStop(1, 'rgba(190,105,60,.85)'); g.fillStyle = b; g.fillRect(w.x1 - 4, w.y, w.x2 - w.x1 + 8, 0.9); g.restore(); }
          g.save(); g.filter = 'blur(0.8px)'; for (let i = 0; i < 24; i++) { const x = rr(x1 - 6, x2 + 6), y0 = rr(1.2, 3.0), y1 = rr(-0.2, 0.6), sw = rr(-0.08, 0.08); g.strokeStyle = `rgba(120,56,22,${rr(0.18, 0.35)})`; g.lineWidth = rr(0.025, 0.06); g.beginPath(); g.moveTo(x, y0); g.quadraticCurveTo(x + sw, (y0 + y1) / 2, x + sw * 2, y1); g.stroke(); } g.restore();
        }
        if (S.sky) {                                          // 天窗下面：水面把光反射到岩壁上，一道道晃动的细亮线
          const cx = X + S.sky.x; g.save(); g.globalCompositeOperation = 'lighter'; g.filter = 'blur(1.3px)';
          for (let i = 0; i < 110; i++) { const y0 = -0.35 + rr(0.1, 2.2), x0 = cx + rr(-4, 4), len = rr(0.25, 1.1), f = Math.exp(-(((x0 - cx) / 3.6) ** 2) * 2 - (((y0 - 0.7) / 1.1) ** 2) * 2); if (f < 0.05) continue;
            g.strokeStyle = `rgba(170,235,225,${0.5 * f * rr(0.35, 1)})`; g.lineWidth = rr(0.012, 0.03); g.beginPath(); for (let t = 0; t <= 1.001; t += 0.1) { const x = x0 + len * t, y = y0 + 0.035 * Math.sin(t * 8 + i * 1.7) * Math.sin(t * 3.14); t ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); }
          g.restore();
        }
      } });
    yield;
    // 3 中间一层：岸上的石笋、洞顶的钟乳石、石柱、潭底的大石头、旧矿洞的木头支架
    const shapes = [];
    for (let x = x1 + rr(1, 3); x < x2 - 1; x += rr(2.5, 6)) {
      const g0 = groundY(x), c0 = ceilY(x); if (c0 - g0 < 2.2) continue;
      if (waterAt(x)) { if (rnd() < 0.6) shapes.push([boulderShape(x, g0, rr(0.8, 2.2), rr(0.35, 1.0))]); }
      else if (rnd() < 0.4 && x < X + 306 && Math.abs(groundY(x + 0.5) - groundY(x - 0.5)) < 0.15) shapes.push([spikeShape(x, g0, rr(0.3, 1.0), rr(0.35, 0.7), true)]);
      if (c0 - g0 > 2.6 && rnd() < 0.6 && Math.abs(ceilY(x + 0.5) - ceilY(x - 0.5)) < 0.3) shapes.push([spikeShape(x + rr(-1, 1), ceilY(x) + 0.1, rr(0.4, 1.2), rr(0.3, 0.6), false)]);
    }
    if (S.timbers) for (const t of S.timbers) {                   // 旧矿洞的支架：两根立柱、一根横梁（有的歪了）
      const x = X + t, g0 = groundY(x), c0 = Math.min(ceilY(x), 3.2), lean = rr(-0.08, 0.08), col = '#1d140d';
      if (waterAt(x)) { shapes.push([[[x - 0.12, g0 - 0.3], [x + 0.1, g0 - 0.3], [x + 0.35, c0 - 0.6], [x + 0.13, c0 - 0.55]], col]); continue; }   // 断在水里的一根
      for (const dx of [-0.75, 0.75]) shapes.push([[[x + dx - 0.11, g0 - 0.3], [x + dx + 0.11, g0 - 0.3], [x + dx + 0.11 + lean, c0 - 0.15], [x + dx - 0.11 + lean, c0 - 0.15]], col]);
      shapes.push([[[x - 1.05 + lean, c0 - 0.42], [x + 1.05 + lean, c0 - 0.38], [x + 1.05 + lean, c0 - 0.15], [x - 1.05 + lean, c0 - 0.19]], col]);
    }
    caveShapes(R, shapes, { col: S.mid, rim: S.rim, rimDx: -0.035, waterTint: hex((S.tint2[1][0] << 16) | (S.tint2[1][1] << 8) | S.tint2[1][2]), waterK: 0.6 });
    yield;
    // 4 水
    const V = { caus: [], beams: [], glows: [], clouds: [] };
    for (const w of ws) {
      waterFront(R, w, { tint: S.tint, frontK: S.frontK, lum: (x, y) => 0.6 * lum(x, y), scat: S.scat ?? [30, 60, 60] });
      waterSheet(R, w, { col: S.tint2[0].slice(0, 3).map(v => v * 0.7), a: 0.55, under: S.surfC.map((v, i) => lerp(v, S.tint[0][i], 0.5)), ua: 0.2 });
      waterSurface(R, w, { surf: x => S.surf(x - X), surfC: S.surfC });
      V.clouds.push(caveSpecks(R, S.specks.n, [w.x1, w.x2, w.bot + 0.1, w.y - 0.05, -3, 1.6], (x, y) => 0.15 + lum(x, y), { c: S.specks.c, a: S.specks.a, glow: S.specks.glow, size: S.specks.size }));
      if (S.murk) { const [r, g, b, a] = S.murk; V.glows.push(bandMesh(R, w.x1 - 0.4, w.x2 + 0.4, w.y, w.y - 2.2, [r, g, b, a], [r, g, b, 0], CZ.front + 0.01, 885, true)); }
    }
    if (S.mist) V.glows.push(bandMesh(R, x1 - 2, x2 - 1, 1.4, -0.4, [...S.mist[0].split(',').map(Number), 0], S.mist[0].split(',').map(Number).concat(S.mist[1]), 1.4, 300, false, 6));
    yield;
    // 5 光
    if (S.sky) {                                              // 天窗：洞顶一道亮的裂缝、一束光柱落进水里，水下散成一根根光线，潭底和岩壁上晃着焦散
      const sx = X + S.sky.x, top = ceilY(sx), w = waterAt(sx);
      glow(R, 0xe6f6f6, 3.2, 0.55, sx, top - 0.05, -2.2, GLOW_SOFT); glow(R, 0xffffff, 0.9, 0.85, sx, top - 0.02, -2.2);
      V.beams.push(lightBeam(R, [sx, top, S.sky.w0], [sx + 0.3, w.y, S.sky.w1], 0xc8e8e8, 0.34, -0.6, 0.55));
      V.beams.push(lightBeam(R, [sx, top, S.sky.w0 * 0.6], [sx + 0.25, w.y, S.sky.w1 * 0.6], 0xe6f6f6, 0.2, 1.0, 0.5, 61));
      for (let i = 0; i < S.sky.rays; i++) {
        const f = (i + 0.5) / S.sky.rays, x0 = sx + 0.3 + lerp(-S.sky.w1 * 0.42, S.sky.w1 * 0.42, f), xb = X + lerp(S.sky.spread[0], S.sky.spread[1], f) + rr(-0.25, 0.25);
        V.beams.push(lightBeam(R, [x0, w.y, rr(0.12, 0.32)], [xb, w.bot, rr(0.5, 1.1)], 0xc8e8e8, 0.11 * rr(0.6, 1.2), i % 3 === 1 ? 0.9 : -0.9, 1));
      }
      V.caus.push(causticPatch(R, sx + 0.3, groundY(sx) + 0.03, 3.4, 3.2, 0xaee8e0, 0.42, { flat: true, z: -2.4 }));
      V.caus.push(causticPatch(R, sx + 0.2, w.y + 1.1, 4.2, 1.2, 0xaee8e0, 0.32, { squash: 3, dx: 0.04, dy: 0.012 }));
      V.clouds.push(caveSpecks(R, 120, [sx - 1.4, sx + 1.4, w.y + 0.1, top - 0.2, -2.5, 1.5], (x, y) => Math.exp(-((x - sx - 0.3 * (1 - (y - w.y) / (top - w.y))) ** 2) / 0.5), { c: 0xdff2f2, a: 0.7, size: 0.022, sink: 0.04 }));
    }
    if (S.sunk) {                                             // 沉在水底的工作灯：躺倒的灯身、铁丝罩子、还亮着的灯泡
      const [lx, lz] = S.sunk, x = X + lx, y = groundY(x) + 0.09, gL = grp(R, x, y, lz);
      add(gL, cy(0.065, 0.075, 0.2, 10), MAT.dark, -0.12, 0, 0).rotation.z = Math.PI / 2;
      add(gL, new THREE.SphereGeometry(0.07, 12, 10), unlit(0xffe9c4), 0.04, 0, 0, false);
      for (const a of [0, 1.05, 2.1]) { const r = add(gL, new THREE.TorusGeometry(0.09, 0.006, 4, 18), MAT.dark, 0.04, 0, 0, false); r.rotation.set(0, Math.PI / 2, a); }
      add(gL, new THREE.TorusGeometry(0.09, 0.006, 4, 18), MAT.dark, 0.13, 0, 0, false).rotation.y = Math.PI / 2;
      tube(R, [[x - 0.2, y - 0.04, lz], [x - 0.6, y - 0.08, lz - 0.3], [x - 1.4, y - 0.08, lz - 0.2]], 0.012, MAT.dark, 12);
      V.glows.push(glow(R, 0xffb060, 2.6, 0.5, x + 0.05, y + 0.1, lz + 0.05, GLOW_SOFT), glow(R, 0xffe2b0, 0.5, 0.95, x + 0.05, y, lz + 0.1));
    }
    if (S.lamps) {                                            // 一串旧灯泡：电线挂在钉进岩壁的钩子上，最后一只吊在水面上方
      const hooks = [[41, 2.7, -5], [44.4, 2.35, -5], [47.6, 2.5, -4.5], [49.6, 2.75, -3.2]].map(([x, y, z]) => [X + x, y, z]), pts = [];
      for (let i = 0; i < hooks.length - 1; i++) { const [a, b, c] = hooks[i], [d, e, f] = hooks[i + 1]; for (let t = 0; t < 1; t += 0.125) pts.push([lerp(a, d, t), lerp(b, e, t) - 0.55 * 4 * t * (1 - t), lerp(c, f, t)]); }
      pts.push(hooks[hooks.length - 1]); tube(R, pts, 0.012, MAT.dark, 80);
      tube(R, [hooks[3], [X + 49.9, 1.9, -2.6], [X + 50, 1.0, -2.2]], 0.01, MAT.dark, 16);
      for (const [x, y, z] of [[42.7, 1.92, -5], [46, 1.86, -5], [48.6, 2.03, -3.85], [50, 0.95, -2.2]]) {
        add(R, new THREE.SphereGeometry(0.05, 10, 8), unlit(0xffd9a0), X + x, y - 0.06, z, false);
        V.glows.push(glow(R, 0xffb46a, 1.6, 0.42, X + x, y - 0.06, z + 0.05, GLOW_SOFT), glow(R, 0xffe0b8, 0.32, 0.85, X + x, y - 0.06, z + 0.06));
      }
    }
    if (S.algae) {                                            // 发光的藻：贴在潭底和水下的岩壁上，一点一点的蓝光，一明一灭
      for (const w of ws) V.clouds.push(airCloud(R, 420, { add: true, order: 47, name: 'algae',
        init(s) { s.x = rr(w.x1 + 0.3, w.x2 - 0.3); if (rnd() < 0.6) { s.z = rr(-6.6, 1.8); s.y = groundY(s.x) + 0.03; } else { s.z = CZ.wall + 0.2; s.y = rr(w.bot - 0.5, w.y - 0.6); }
          s.size = rr(0.03, 0.1); s.ph = rr(0, 6.28); s.tw = rr(0.3, 1.2); s.b = rr(0.3, 1); s.tile = 0; s.c = airCol(rnd() < 0.8 ? 0x45d8ff : 0x7affd8); },
        step(s) { s.a = s.b * (0.35 + 0.65 * Math.max(0, Math.sin(T * s.tw + s.ph))); } }));
    }
    for (const [gx, gy, r, c, a] of S.glowW || []) V.glows.push(glow(R, c, r, a, X + gx, gy, -1.5, GLOW_SOFT));
    S.V = V;
  }
  // 一条上下渐变的带子（雾、浑水里光散开的那一层）：colTop / colBot 是 [r, g, b, 不透明度]；左右两头各有 fade 米慢慢淡掉
  function bandMesh(R, x1, x2, yTop, yBot, cT, cB, z, order, additive, fade = 3) {
    const xs = [x1, x1 + fade, x2 - fade, x2], ka = [0, 1, 1, 0], pos = [], cl = [], idx = [], c = (v, i) => i < 3 ? v / 255 : v;
    xs.forEach((x, i) => { pos.push(x, yTop, z, x, yBot, z); const t = cT.map(c), b = cB.map(c); t[3] *= ka[i]; b[3] *= ka[i]; cl.push(...t, ...b); });
    for (let i = 0; i < 3; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 2, a + 1, a + 3); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(cl, 4)); g.setIndex(idx);
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending }));
    m.material.userData.own = true; m.renderOrder = order; m.frustumCulled = false; R.add(m); return m;
  }
  SEC.forEach((S, k) => defZone({ n: 9, vis: [X + S.x1, X + S.x2], *build(R) { yield* buildSec(R, S, k); },
    update(dt) { const V = S.V; if (!V) return; stepCaustics(V.caus, dt); for (const c of V.clouds) c.step(dt); for (const b of V.beams) b.material.opacity = b.userData.a * (0.85 + 0.15 * Math.sin(T * 0.7 + b.id)); },
    reset() {}, solve() {}, unbuild() { S.V = null; } }));
  // 整章：补光跟着主角走、颜色跟着段落换；水面亮线闪动的时间
  const fillC = new THREE.Color();
  defZone({ n: 9, vis: [X - 16, X + 350], *build() {}, reset() {}, solve() {},
    update(dt) {
      SURF_U.uT.value = T;
      const S = secAt(P.x); fillC.setHex(S.fill); fillL.c.lerp(fillC, 1 - Math.exp(-3 * dt));
      fillL.p[0] = P.x; fillL.p[1] = P.y + 0.9; fillL.p[2] = 3.2; fillL.i = P.mode === 'swim' ? 1.8 : 1.3;
    } });
  return { X, SEC, W, skyL };
})();
