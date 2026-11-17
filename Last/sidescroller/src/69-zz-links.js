// ============================================================
//  两章之间的路（2026-11-17）：三十六章在世界里接成一条连着的路，从第 1 章一直往右走，走得到第 36 章
//  以前不挨着的几处（第 8 → 9、16 → 17 …… 35 → 36 章）中间隔着空气墙和几百米空地，走到头起一阵雾、把人挪过去；
//  现在两章挨着摆（各章的原点 X9、X10 …、HX0 都是照前一章算的），两章之间铺一段真的路（20-world.js 的 link）：
//  下山的坡、往下的坡道、门、窄巷、走廊、带门的隔墙。中间没有空气墙，往回走也走得回去。
//  每一段：a 左边那一章的路走到哪 / b 右边那一章从哪开始 / pts 中间的地形 / build 这一段自己的布景（灰模：方块、剖面、几块布景板）
//  这个文件拼在所有章节后面（文件名 69-zz 排在 69-h 后面）：用得到各章的原点
// ============================================================

// ---- 布景的小零件 ----
const lkMat = (col, o = {}) => { const m = lam(col, o); m.userData.own = true; return m; };   // 这一段自己的材质：卸载时释放
// 一块朝着镜头的剖面（地面、斜坡被剖开的那一面）：上沿跟着 top(x)，下到 yb
function lkFace(R, x1, x2, z, mat, yb = -8, top = groundY, step = 0.25) {
  const s = new THREE.Shape(), up = 0.03; s.moveTo(x1, yb);                 // up：上沿比地面高一点点，和地面那一条压住，接缝里不漏天
  for (let x = x1; x < x2; x += step) s.lineTo(x, top(x) + up);
  s.lineTo(x2, top(x2) + up); s.lineTo(x2, yb); s.closePath();
  return add(R, new THREE.ShapeGeometry(s), mat, 0, 0, z, false);
}
// 一块平铺在 y 高度的地面（剖面前后那一截低处的地）
function lkFlat(R, x1, x2, z1, z2, y, mat) {
  const m = add(R, new THREE.PlaneGeometry(x2 - x1, z2 - z1), mat, (x1 + x2) / 2, y, (z1 + z2) / 2, false); m.rotation.x = -Math.PI / 2; m.receiveShadow = true; return m;
}
// 一块沿着折线 prof(x) 的厚板（斜着的走廊顶）：在 [x1, x2] 上，下沿是 prof(x)，厚 th，从 z1 到 z2
function lkSlab(R, x1, x2, prof, th, z1, z2, mat, step = 0.5) {
  const s = new THREE.Shape(); s.moveTo(x1, prof(x1));
  for (let x = x1 + step; x < x2; x += step) s.lineTo(x, prof(x));
  s.lineTo(x2, prof(x2)); s.lineTo(x2, prof(x2) + th);
  for (let x = x2 - step; x > x1; x -= step) s.lineTo(x, prof(x) + th);
  s.lineTo(x1, prof(x1) + th); s.closePath();
  return add(R, new THREE.ExtrudeGeometry(s, { depth: z2 - z1, bevelEnabled: false }), mat, 0, 0, z1);
}
// 一道带门的墙（剖开的样子）：墙在 x，厚 w；门洞从地面 y0 高 door，前后在 zd..zf（人走的那一条 z = 0 在里面）；
// 门洞后面（zb..zd）整面到顶，门洞上面（zd..zf）是门楣
function lkDoorWall(R, x, o = {}) {
  const { y0 = 0, door = 2.6, top = 10, w = 0.5, zb = -6, zd = -1.2, zf = 1.6, mat = MAT.dark } = o;
  add(R, bx(w, top - y0, zd - zb), mat, x, (top + y0) / 2, (zb + zd) / 2);
  add(R, bx(w, top - y0 - door, zf - zd), mat, x, (top + y0 + door) / 2, (zd + zf) / 2);
  if (o.frame) for (const z of [zd + 0.06, zf - 0.06]) add(R, bx(w + 0.08, door, 0.1), o.frame, x, y0 + door / 2, z);
}
// 远山和中景：一条山脊、一排树。a..b 两头渐隐（和两边章节的远景接上时看不出边）
function lkHills(a, b, o = {}) {
  const f = o.ridge ?? (x => 14 + 5 * Math.sin(x * 0.021) + 2.5 * Math.sin(x * 0.067 + 1));
  backdrop(a - 30, b + 30, -10, 60, o.zFar ?? -220, 2, g => { setInk(g, o.far ?? '#38404a'); ridge(g, a - 30, b + 30, -10, f, 3); }, { fadeL: 40, fadeR: 40 });
  if (o.trees !== false) backdrop(a, b, -4, 22, o.zMid ?? -36, 6, g => {
    setInk(g, o.mid ?? '#20272a'); ridge(g, a, b, -4, x => groundY(x) + 0.3 + 0.4 * Math.sin(x * 0.3), 1);
    for (let x = a + 3; x < b - 3; x += rr(6, 14)) tree(g, x, groundY(x), rr(5, 10), pick(o.kinds ?? ['round', 'pine', 'dead']));
  }, { fadeL: 6, fadeR: 6 });
}
// 地上的一把草（plants 的格式）：x1..x2，前后 z1..z2
function lkGrass(R, x1, x2, z1, z2, n, cols = [0x4c5c3c, 0x56664a, 0x5f6a48], kinds = ['grass', 'grass', 'dry']) {
  const list = []; for (let i = 0; i < n; i++) { const x = rr(x1, x2); list.push([x, groundY(x), rr(z1, z2), pick(kinds), rr(0.35, 0.9), pick(cols)]); }
  plants(R, list);
}

// ============================================================
//  第 8 章（结尾）→ 第 9 章（旧原型 · 工厂）：坡顶往右是一道长长的下坡，下到平地，旧厂房的山墙上开着一道门
// ============================================================
{
  const T8 = E7_X + E8_L, A = T8 + 300, B = -10;                    // T8：结尾那一章的原点（escape/69-e9-ending.js 的 X）；坡顶在 T8 + 264，往右一直是平的
  link(8, { a: A, b: B,
    pts: [[A + 8, 9.55], [A + 18, 9.0], [A + 30, 7.2], [A + 42, 4.6], [A + 54, 2.0], [A + 64, 0.6], [A + 72, 0.08]],
    col: [[A + 46, 0x46503a], [B - 8, 0x2a302c]],
    surf: x => x > B - 7 ? 'concrete' : 'grass',
    env: [[B - 14, 'A']],                                                // 一直是天快亮的野地，走到厂房门口才进到厂房里的光
    cam: [[A + 36, 20.5, 2.3, 1.2], [B - 6, 16, 1.6, 0.6]],
    vis: [A - 8, B + 2],
    build: function* (R) {
      lkHills(A, B, { far: '#3d4658', mid: '#232b2c', zFar: -300 });
      foreTufts(A, B - 14, 8.7, { cols: ['#0c1210', '#101814', '#0a0f0d'], h: 1.0, fern: 0.1 });
      yield;
      lkGrass(R, A, B - 10, -2.4, -16, 420); lkGrass(R, A, B - 10, 2.2, 8, 200);
      for (const [x, z, s] of [[A + 14, -2.6, 0.7], [A + 47, 2.2, 0.5], [A + 66, -3.4, 0.9], [B - 18, 2.6, 0.6]]) rock(R, x, z, s, { moss: 0.3 });
      yield;
      // 旧厂房的山墙（左墙，厚两米）：底下一道门，门上一盏旧灯
      const wall = lkMat(0x1d2528), frame = lkMat(0x39444a);
      lkDoorWall(R, -8, { door: 2.6, top: 16, w: 2, zb: -32.5, zd: -1.3, zf: 2.2, mat: wall, frame });
      add(R, bx(2.6, 0.12, 0.5), frame, -9.3, 2.75, 0.2);
      glow(R, 0xffd9a0, 1.6, 0.7, -9.5, 3.05, 0.6);
    } });
  pointLight({ p: [-9.6, 3.0, 0.9], c: 0xffd9a0, i: 2.2, d: 7 });
}

// ============================================================
//  第 16 章（生态中枢）→ 第 17 章（山洞与暗河）：中枢门外的坡顶往右下到一面石壁，洞口在石壁底下
// ============================================================
{
  const A = X8 + 212, B = X9 - 16;
  link(16, { a: A, b: B,
    pts: [[A + 10, 2.45], [A + 20, 1.6], [A + 28, 0.6], [A + 34, 0.1]],
    col: [[B - 10, 0x2e3330]], back: -6,                                // 坡的背后低下去（和中枢门外一样是一片谷地，由布景板来画）
    surf: x => x > B - 9 ? 'rock' : 'grass',
    vis: [A - 4, B + 4],
    build: function* (R) {
      // 洞口所在的那面石壁：从坡脚往右越来越高，接上山洞自己的岩石
      backdrop(A + 6, B + 22, -2, 40, -6.4, 10, g => {
        setInk(g, '#1a1f20'); ridge(g, A + 6, B + 22, -2, x => 2 + 34 * sstep(A + 8, B + 2, x) + 1.4 * Math.sin(x * 0.9), 0.5);
        g.fillStyle = 'rgba(120,150,150,.08)'; for (let i = 0; i < 40; i++) { const x = rr(A + 14, B + 20); box(g, x, rr(0, 30) * sstep(A + 8, B, x), rr(0.6, 2.4), 0.08); }
      }, { fadeL: 6 });
      lkGrass(R, A, B - 8, -2, -5.5, 160, [0x3f4636, 0x4a5236, 0x56603e]); lkGrass(R, A, B - 8, 2, 7, 90, [0x3f4636, 0x4a5236, 0x56603e]);
      for (const [x, z, s] of [[B - 9, -2.2, 0.9], [B - 6, 2.0, 1.1], [B - 3, -3.6, 1.4], [B - 1, 2.8, 0.8]]) rock(R, x, z, s, { moss: 0.1 });
      yield;
    } });
}

// ============================================================
//  第 17 章（山洞）→ 第 18 章（吊绳与高台）：出了洞口，一道缓坡下到碎石地
// ============================================================
{
  const A = X9 + 356, B = X10 - 24;
  link(17, { a: A, b: B, pts: [[A + 3, 1.45], [A + 8, 0.4]], surf: 'gravel', vis: [A, B],
    build: function* (R) { for (const [x, z, s] of [[A + 2, -2.4, 1.2], [A + 6, 2.4, 0.8], [A + 9, -4, 1.6]]) rock(R, x, z, s, { moss: 0.2 }); yield; } });
}

// ============================================================
//  第 18 章（吊绳与高台）→ 第 19 章（夜搜）：最高一级的矮墙在靠镜头这一头有个豁口，外面是一道土坡，一直下到公路
//  坡是地形（20-world.js 的 terrain），靠镜头那一面剖开（和台阶的正面齐平），坡前面的低处另铺一块平地
// ============================================================
{
  const END = X10 + 100.5, H3 = 11.8, ZF = 1.6, A = END - 0.05, B = X11 - 30, FOOT = END + 38;
  const prof = [[END - 0.03, H3], [END + 1.5, 11.78], [END + 6, 11.1], [END + 12, 9.0], [END + 20, 5.7], [END + 28, 2.5], [END + 34, 0.6], [FOOT, 0.05]];
  link(10 + OLD, { a: A, b: B, pts: prof,                               // 台阶底下的地形在 A 处往上一跳（藏在台阶里面），接上坡顶
    front: [[A, FOOT, ZF]],                                              // 坡只铺到台阶正面那么靠前，前面剖开
    col: [[END + 2, 0x3a3a30], [FOOT, 0x2a3030]],
    surf: x => x < END + 4 ? 'gravel' : 'dirt',
    cam: [[END + 18, 21.5, 2.6, 1.2]],
    vis: [A - 2, B + 2],
    build: function* (R) {
      const earth = lkMat(0x2a2620), low = lkMat(0x262c2c);
      lkFace(R, END, FOOT, ZF, earth, -0.5);                             // 坡被剖开的那一面
      lkFlat(R, END, FOOT, ZF, 14, 0.002, low);                          // 坡前面的低处（坡脚往右是共用的地面）
      lkGrass(R, END + 2, FOOT, -1.5, -12, 260, [0x55553e, 0x63604a, 0x4a4c38], ['dry', 'grass', 'seed']);
      lkGrass(R, FOOT, B, -2, -10, 60, [0x3a463a, 0x445040], ['grass', 'dry']);
      // 坡边上一排歪了的木桩和一道断了的铁丝
      const wood = lkMat(0x3b2f24);
      for (let x = END + 3; x < FOOT - 2; x += 3.4) { const m = add(R, bx(0.12, 1.1, 0.12), wood, x, groundY(x) + 0.45, ZF - 0.35); m.rotation.z = rr(-0.15, 0.15); }
      lkHills(A, B, { far: '#4a5552', mid: '#2a3231', zFar: -240, kinds: ['dead', 'pine'] });
      yield;
    } });
}

// ============================================================
//  第 19 章（夜搜）→ 第 20 章（作坊一角）：林子里的雾往前走，林子边上是一间作坊，侧面开着一道门
// ============================================================
{
  const A = X11 + 165, W = X12 - 3.4, B = W;
  link(11 + OLD, { a: A, b: B,
    pts: [[A + 6, 1.15], [A + 13, 0.3], [A + 17, 0.02]],
    col: [[B - 2.5, 0x22282a]],
    surf: x => x > B - 0.6 ? 'wood' : 'forest',
    env: [[A + 6, 'A'], [B - 1.2, { fogD: 0.03 }]],                    // 一直是林子里的雾，进了门才是屋里的光
    cam: [[A + 8, 19, 1.9, 0.8], [B - 3, 11, 1.35, 0.6]],
    vis: [A - 4, X12 + 13],
    build: function* (R) {
      backdrop(A - 6, B, -2, 22, -7, 12, g => {                          // 林子边上最后几棵树
        setInk(g, '#16191c'); for (let x = A - 4; x < B - 4; x += rr(2.5, 5)) tree(g, x, groundY(x) - 0.1, rr(8, 16), pick(['pine', 'dead', 'round']));
      }, { fadeL: 6, fadeR: 3 });
      // 作坊：外面看是一间矮房子（剖开的），左边山墙上一道门，门口一盏小灯
      backdrop(W - 0.8, X12 + 10.6, -0.5, 7.4, -3.05, 24, g => {
        setInk(g, '#1c1712'); box(g, W - 0.2, -0.5, X12 + 10.4 - W, 5.4);
        poly(g, [[W - 0.6, 4.8], [X12 + 10.6, 4.8], [X12 + 6.4, 7.3], [W + 3, 7.3]]);
      }, { fog: false });
      lkDoorWall(R, W + 0.2, { door: 2.3, top: 5.2, w: 0.4, zb: -3.1, zd: -1.05, zf: 1.4, mat: lkMat(0x2b221a), frame: lkMat(0x4a3a2c) });
      add(R, bx(X12 + 10.6 - W, 0.25, 4.8), lkMat(0x17120e), (W + X12 + 10.6) / 2, 5.3, -0.7);   // 屋顶（剖开的那一面朝着镜头）
      glow(R, 0xffcf96, 1.0, 0.75, W - 0.45, 2.6, 0.7);
      lkGrass(R, A, B - 2, -1.6, -6, 120, [0x26302a, 0x2c3530, 0x323a30]);
      yield;
    } });
  pointLight({ p: [W - 0.6, 2.55, 0.9], c: 0xffcf96, i: 1.8, d: 6 });
}

// ============================================================
//  第 20 章（作坊一角）→ 第 21 章（机房）：出了作坊的门，一条夜里的窄巷，尽头一段铁楼梯平台就是机房的门口
// ============================================================
{
  const A = X12 + 15, B = X13 - 12;
  link(12 + OLD, { a: A, b: B, surf: 'concrete', vis: [A - 6, B],
    build: function* (R) {
      backdrop(A - 6, B, -0.5, 12, -3.2, 20, g => {                       // 巷子的后墙：砖墙、一扇亮着的小窗、管子
        setInk(g, '#15171c'); box(g, A - 6, -0.5, B - A + 6, 12.5);
        g.fillStyle = 'rgba(0,0,0,.35)'; for (let y = 0; y < 12; y += 0.3) box(g, A - 6, y, B - A + 6, 0.02);
        setInk(g, '#2a3038'); box(g, A + 3, 3.4, 1.0, 1.3); g.fillStyle = '#d8b07a'; box(g, A + 3.1, 3.5, 0.8, 1.1);
        setInk(g, '#22262c'); box(g, A + 8.6, -0.5, 0.12, 12.5); box(g, A + 8.2, 6.4, 0.9, 0.1);
      }, { fog: false });
      add(R, bx(0.9, 0.7, 0.8), lkMat(0x2a2620), A + 6.2, 0.35, -2.2); add(R, bx(0.7, 0.5, 0.6), lkMat(0x23201b), A + 6.9, 0.25, -2.0);
      yield;
    } });
  pointLight({ p: [A + 3.6, 3.6, -1.6], c: 0xffc98a, i: 1.4, d: 6 });
}

// ============================================================
//  第 21 章（机房）→ 第 22 章（墙）：机房右墙的门出去，一块铁格栅的平台，下几步到山坡上的碎石路，往夜里的雾里走
// ============================================================
{
  const RW = X13 + 18.35, A = RW + 1.6, B = X14 - 20;
  link(13 + OLD, { a: A, b: B,
    col: [[A + 1, 0x1b1f22], [A + 6, 0x2a2520]],
    surf: x => x < A + 4 ? 'metal' : 'gravel',
    env: [[A + 1.5, 'A']],                                               // 出了门几步还是机房里的光
    cam: [[A + 6, 14, 1.4, 0.8]],
    vis: [RW, B + 2],
    build: function* (R) {
      add(R, bx(4.2, 0.12, 3), lkMat(0x3a4448), RW + 2.5, -0.06, -0.3);  // 门外的格栅平台
      for (const x of [RW + 0.9, RW + 4.4]) add(R, bx(0.08, 1.0, 0.08), MAT.steel, x, 0.5, 1.0);
      add(R, bx(3.6, 0.06, 0.06), MAT.steel, RW + 2.65, 1.0, 1.0);
      backdrop(RW + 0.4, B + 6, -2, 14, -4.6, 12, g => {                 // 机房外壳的一角，往右是夜里的山坡
        setInk(g, '#11151a'); poly(g, [[RW + 0.4, -2], [RW + 0.4, 14], [RW + 3, 14], [RW + 6, 6], [RW + 7.5, -2]]);
      }, { fog: false, fadeR: 4 });
      lkHills(A, B, { far: '#232830', mid: '#15191b', zFar: -200, kinds: ['dead', 'dead', 'pine'] });
      for (const [x, z, s] of [[A + 6, -2.4, 0.6], [A + 10, 2.4, 0.5], [B - 3, -3, 0.9]]) rock(R, x, z, s, { moss: 0 });
      yield;
    } });
  pointLight({ p: [RW + 1.2, 2.6, 0.6], c: 0xd8e6ee, i: 1.6, d: 6 });
}

// ============================================================
//  第 22 章（墙）→ 第 23 章（高台）：翻过第二道墙往前走，雾越来越浓，走出雾是傍晚的货运站
// ============================================================
{
  const A = X14 + 62, B = X15 - 22;
  link(14 + OLD, { a: A, b: B, surf: 'gravel',
    env: [[A + 5, { fogD: 0.09 }], [B - 4, { fogD: 0.06 }]],          // 雾最浓的地方在中间
    col: [[A + 8, 0x3a3128]],
    vis: [A, B],
    build: function* (R) { for (const [x, z, s] of [[A + 3, -2, 0.7], [A + 9, 2.2, 0.5], [A + 13, -3.2, 1.0]]) rock(R, x, z, s, { moss: 0 }); lkGrass(R, A, B, -2, -8, 80, [0x4a4636, 0x5a5440]); yield; } });
}

// ============================================================
//  第 23 章（高台）→ 第 24 章（水下实验室）：朝落下去的太阳走，下到海边
// ============================================================
{
  const A = X15 + 56, B = X16 - 12;
  link(15 + OLD, { a: A, b: B, surf: x => x < B - 6 ? 'gravel' : 'sand',
    col: [[B - 6, 0x3a3a34]],
    vis: [A, B],
    build: function* (R) {
      const wood = lkMat(0x3b2f24);
      for (let x = A + 2; x < B - 4; x += 2.6) { const m = add(R, bx(0.1, 1.0, 0.1), wood, x, groundY(x) + 0.42, -1.4); m.rotation.z = rr(-0.2, 0.2); }   // 一排歪了的栅栏桩
      for (const [x, z, s] of [[A + 6, 2.4, 0.6], [B - 3, -2.4, 0.9], [B - 1, 2.6, 0.7]]) rock(R, x, z, s, { moss: 0.2 });
      lkGrass(R, A, B - 5, -2, -9, 90, [0x6a5a40, 0x7a6a48, 0x5a5038], ['dry', 'seed', 'grass']);
      yield;
    } });
}

// ============================================================
//  第 24 章（水下实验室）→ 第 25 章（工厂深处 · 浸泡槽）：电源恢复以后右墙的门打开，一条往上去的走廊（-2.6 米上到地面）
// ============================================================
const lkCorridor = (R, a, b, floor, ceil, o = {}) => {                  // 剖开的走廊：后墙、顶（跟着 ceil(x)）、前面黑的切口（跟着地面往下）
  const wall = lkMat(o.wall ?? 0x1f2a2a), top = lkMat(o.top ?? 0x161e1e);
  lkFace(R, a, b, o.zb ?? -3.2, wall, -6, x => ceil(x) + (o.up ?? 12));               // 后墙一直到顶上很高的地方：上面不漏天
  lkSlab(R, a, b, ceil, 0.35, o.zb ?? -3.2, H_CUT, top);
  lkFace(R, a, b, H_CUT + 0.01, MAT.black, -10, floor);
  for (let x = a + 1.5; x < b; x += 3.2) add(R, bx(0.08, 0.06, 4.6), lkMat(o.rib ?? 0x2c3838), x, ceil(x) - 0.04, -0.7, false);   // 顶上的一道道肋
};
{
  const A = X16 + 40.2, B = HX0 - 14;
  const ceil = [[A, 0.5], [A + 2, 0.6], [A + 10.5, 3.1], [B, 3.2]], cy = x => { for (let i = 1; i < ceil.length; i++) if (x <= ceil[i][0]) return lerp(ceil[i - 1][1], ceil[i][1], clamp((x - ceil[i - 1][0]) / (ceil[i][0] - ceil[i - 1][0]), 0, 1)); return 3.2; };
  link(16 + OLD, { a: A, b: B,
    pts: [[A + 1.3, -2.6], [A + 3.5, -2.45], [A + 9.5, -0.25], [A + 11.5, 0]],
    ceil: [ceil], front: H_CUT, back: -3.4, surf: 'metal',
    col: [[A + 1, 0x243a40], [B, 0x1d241d]],
    vis: [A, B],
    build: function* (R) { lkCorridor(R, A, B, groundY, cy, { wall: 0x1e3034, rib: 0x355054 }); yield; } });
  pointLight({ p: [A + 6, 1.4, 0.4], c: 0x8edfd3, i: 1.6, d: 7 });
  pointLight({ p: [B - 2, 2.7, 0.4], c: 0x9cff7a, i: 1.2, d: 6 });
}

// ============================================================
//  工厂深处（第 25–36 章）一章接一章：两个厂房中间一道带门的隔墙（门上一盏灯）
//  第 28 章（熔渣池）→ 第 29 章（竖井）：竖井的走廊低两米，过了门往下走一段；
//  第 29 章（竖井）→ 第 30 章（玻璃大罐）：从竖井顶上的出口出来，一道长长的斜坡走廊往下 15 米
// ============================================================
for (let k = 0; k < HLAST; k++) {
  const A = hX(k) + HLEN[k] + 4, B = hX(k + 1) - 14, n = HN(k);
  if (k === 4) {                                                           // 竖井 → 玻璃大罐
    const X5 = hX(4), TOPF = 15, A2 = X5 + HLEN[4] + 0.9, F = A2 + 41;    // A2：竖井顶上那块岩石（到 X + LEN + 1）里面一点，地形在这里往上一跳，接上岩石顶
    const pts = [[A2 + 0.02, TOPF], [A2 + 1.5, 14.95], [A2 + 6, 14.0], [A2 + 14, 10.5], [A2 + 24, 5.6], [A2 + 32, 2.0], [A2 + 38, 0.3], [F, 0]];
    const cy = x => groundY(x) + (x < A2 + 1.5 ? 3.6 : 3.4);
    link(n, { a: A2, b: B, pts, front: H_CUT, back: [[A2, F, -4.4]], surf: 'metal',
      col: [[A2 + 1, 0x1b201b], [B, 0x1d221d]],
      cam: [[A2 + 20, 17, 1.4, 1.2]],
      vis: [A2 - 1, B + 1],
      build: function* (R) {
        lkCorridor(R, A2, F, groundY, cy, { zb: -4.4, wall: 0x1a221a, top: 0x121812, rib: 0x2a342a });
        lkFace(R, F, B, H_CUT + 0.01, MAT.black, -10);
        lkDoorWall(R, B - 1.5, { door: 2.9, top: 16, w: 0.8, zb: -27, zd: -1.2, zf: H_CUT, mat: MAT.dark });
        glow(R, 0xffb070, 0.9, 0.7, B - 1.5, 3.2, H_CUT - 0.2);
        yield;
      } });
    for (const x of [A2 + 8, A2 + 22, A2 + 36]) pointLight({ p: [x, groundY(x) + 2.9, 0.4], c: 0x9cff7a, i: 1.1, d: 6 });
    continue;
  }
  const M = (A + B) / 2, down = k === 3;                                     // down：熔渣池 → 竖井（竖井的走廊在 -2 米）
  link(n, { a: A, b: B, front: H_CUT, surf: 'concrete',
    pts: down ? [[M + 0.6, 0], [B - 0.6, -2]] : [],
    ceil: down ? [[[M + 0.4, 2.9], [B, 1.2]]] : undefined,
    vis: [A, B],
    build: function* (R) {
      lkFace(R, A, B, H_CUT + 0.01, MAT.black, -10);
      lkDoorWall(R, M, { door: 2.9, top: 16, w: 0.8, zb: -27, zd: -1.2, zf: H_CUT, mat: MAT.dark });
      glow(R, 0xffb070, 0.9, 0.7, M, 3.2, H_CUT - 0.2);
      if (down) lkSlab(R, M + 0.4, B, x => lerp(2.9, 1.2, (x - M - 0.4) / (B - M - 0.4)), 0.3, -4, H_CUT, MAT.dark);
      yield;
    } });
  pointLight({ p: [M - 0.6, 3.1, 1.0], c: 0xffb070, i: 1.4, d: 6 });
}
