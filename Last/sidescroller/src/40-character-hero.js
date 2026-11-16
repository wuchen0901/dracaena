
// ============================================================
//  主角（models/hero.glb）载入以后重新整形。模型文件本身不动，改的都在这里：
//    1 身体磨平：原来三千来个三角面、一面一个朝向，一棱一棱的。按位置把顶点焊起来，做一遍 Loop 细分，法线算成连续的
//    2 不用贴图：贴图只有五块平涂的颜色，接缝处还漏白道。每个面按贴图认出是哪一块（皮肤 / 头发 / 上衣 / 裤子 / 鞋），直接写成顶点色
//    3 鞋、手、头是另做的（原来是一块砖、一个拳头大的方块、一大团盖住耳朵的头发）：
//      鞋 —— 圆头的矮帮鞋，鞋底浅一号；手 —— 四指并着、拇指单独分开；头 —— 短发，耳朵露在外面，没有五官，只留鼻子和下巴的轮廓
//  坐标都是模型自己的绑定姿势：身高 1.7，脚底 y = 0，面朝 +z，左手在 +x。骨头的权重直接写在顶点上，动画不用改
//  前半截（到 heroMesh 为止）只算数组，不碰 THREE；后半截（“==== THREE ====”以下）把结果换到载入的模型上
// ============================================================
const HERO_COL = {                                   // sRGB，0–255
  skin: [240, 217, 198], skinDark: [205, 172, 152], hair: [27, 24, 23], top: [194, 188, 174], pants: [22, 22, 23],
  shoe: [66, 65, 66], sole: [128, 124, 116], sock: [104, 101, 96],
};
const HERO_HEAD_K = 1.12;                            // 头比原模型的脸大一圈：头发剪短以后头显小，放大了远看才像个孩子
const HERO_CLS = ['skin', 'hair', 'top', 'pants', 'shoe'];     // 面的分类编号

// ---- 一遍 Loop 细分。M = { n 顶点数, pos, wt 每个顶点对每根骨头的权重（nb 个一行）, nb, tri, cls 每个面的分类 } ----
// 只有一个面的边（剪开以后的口子：裤脚、袖口、领口）和两边颜色不一样的边（衣摆和裤腰的分界）沿着自己那条线磨，不被旁边的面拉走
function heroLoop(M) {
  const { n, pos, wt, nb, tri, cls } = M, m = cls.length, key = (a, b) => a < b ? a * n + b : b * n + a;
  const edges = new Map();
  for (let t = 0; t < m; t++) for (let k = 0; k < 3; k++) {
    const a = tri[3 * t + k], b = tri[3 * t + (k + 1) % 3], c = tri[3 * t + (k + 2) % 3], q = key(a, b);
    let e = edges.get(q); if (!e) edges.set(q, e = { a, b, opp: [], id: 0, k: cls[t], hard: false }); e.opp.push(c); if (cls[t] !== e.k) e.hard = true;
  }
  const nbr = Array.from({ length: n }, () => []), crease = Array.from({ length: n }, () => []);
  let ne = 0;
  for (const e of edges.values()) {
    e.id = n + ne++; nbr[e.a].push(e.b); nbr[e.b].push(e.a);
    if (e.opp.length !== 2) e.hard = true;
    if (e.hard) { crease[e.a].push(e.b); crease[e.b].push(e.a); }
  }
  const N = n + ne, pos2 = new Float64Array(3 * N), wt2 = new Float32Array(nb * N);
  const acc = (dst, src, k) => { for (let i = 0; i < 3; i++) pos2[3 * dst + i] += pos[3 * src + i] * k; for (let i = 0; i < nb; i++) wt2[nb * dst + i] += wt[nb * src + i] * k; };
  for (let v = 0; v < n; v++) {
    const cr = crease[v], k = nbr[v].length;
    if (cr.length === 2) { acc(v, v, 0.75); acc(v, cr[0], 0.125); acc(v, cr[1], 0.125); }
    else if (cr.length > 2 || k < 3) acc(v, v, 1);
    else { const beta = k === 3 ? 3 / 16 : 3 / (8 * k); acc(v, v, 1 - k * beta); for (const o of nbr[v]) acc(v, o, beta); }
  }
  for (const e of edges.values()) {
    if (!e.hard) { acc(e.id, e.a, 0.375); acc(e.id, e.b, 0.375); acc(e.id, e.opp[0], 0.125); acc(e.id, e.opp[1], 0.125); }
    else { acc(e.id, e.a, 0.5); acc(e.id, e.b, 0.5); }
  }
  const tri2 = new Int32Array(12 * m), cls2 = new Uint8Array(4 * m);
  for (let t = 0; t < m; t++) {
    const a = tri[3 * t], b = tri[3 * t + 1], c = tri[3 * t + 2], ab = edges.get(key(a, b)).id, bc = edges.get(key(b, c)).id, ca = edges.get(key(c, a)).id;
    tri2.set([a, ab, ca, ab, b, bc, ca, bc, c, ab, bc, ca], 12 * t); cls2.fill(cls[t], 4 * t, 4 * t + 4);
  }
  return { n: N, pos: pos2, wt: wt2, nb, tri: tri2, cls: cls2 };
}

// ---- 攒一个零件：一圈一圈的点连成面。w 是这个点跟哪些骨头走 [[骨头编号, 权重], …]，c 是颜色 ----
function heroPart() {
  const pos = [], col = [], bw = [], tris = [];
  const vert = (p, c, w) => { pos.push(p[0], p[1], p[2]); col.push(c); bw.push(w); return pos.length / 3 - 1; };
  const ring = (pts, c, w) => pts.map((p, k) => vert(p, typeof c === 'function' ? c(k) : c, typeof w === 'function' ? w(p, k) : w));
  const quad = (a, b, c, d) => { tris.push(a, b, c, a, c, d); };
  const loft = rings => { for (let i = 0; i < rings.length - 1; i++) { const A = rings[i], B = rings[i + 1], n = A.length; for (let k = 0; k < n; k++) quad(A[k], A[(k + 1) % n], B[(k + 1) % n], B[k]); } };
  const fan = (c, R) => { for (let k = 0; k < R.length; k++) tris.push(c, R[k], R[(k + 1) % R.length]); };
  // 一块形状攒完了：去掉没有面积的面；要是里外翻了（按它自己的体积是正是负看）就整块翻回来
  const out = []; let v0 = 0;
  const close = () => {
    const n = pos.length / 3 - v0, t0 = out.length; let vol = 0, cx = 0, cy = 0, cz = 0;
    for (let i = v0; i < v0 + n; i++) { cx += pos[3 * i] / n; cy += pos[3 * i + 1] / n; cz += pos[3 * i + 2] / n; }
    for (let t = 0; t < tris.length; t += 3) {
      const [a, b, c] = [tris[t], tris[t + 1], tris[t + 2]].map(i => [pos[3 * i] - cx, pos[3 * i + 1] - cy, pos[3 * i + 2] - cz]);
      const nx = (b[1] - a[1]) * (c[2] - a[2]) - (b[2] - a[2]) * (c[1] - a[1]), ny = (b[2] - a[2]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[2] - a[2]), nz = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
      if (nx * nx + ny * ny + nz * nz < 1e-20) continue;
      vol += a[0] * nx + a[1] * ny + a[2] * nz; out.push(tris[t], tris[t + 1], tris[t + 2]);
    }
    if (vol < 0) for (let t = t0; t < out.length; t += 3) { const s = out[t + 1]; out[t + 1] = out[t + 2]; out[t + 2] = s; }
    tris.length = 0; v0 = pos.length / 3;
  };
  const done = () => { close(); return { pos, col, bw, tris: out }; };
  return { vert, ring, loft, fan, close, done, at: i => [pos[3 * i], pos[3 * i + 1], pos[3 * i + 2]] };
}
const heroPow = (v, e) => Math.sign(v) * Math.abs(v) ** e;
function heroKeys(keys, s) {                           // keys 每行 [s, 值, …]：s 处各列的平滑插值（和 kidSpline 一个算法）
  let i = 0; while (i < keys.length - 2 && s > keys[i + 1][0]) i++;
  const k0 = keys[Math.max(i - 1, 0)], k1 = keys[i], k2 = keys[i + 1], k3 = keys[Math.min(i + 2, keys.length - 1)];
  const h = k2[0] - k1[0], t = Math.min(1, Math.max(0, (s - k1[0]) / h)), t2 = t * t, t3 = t2 * t, out = [];
  for (let j = 1; j < k1.length; j++) {
    const m1 = (k2[j] - k0[j]) / (k2[0] - k0[0]) * h, m2 = (k3[j] - k1[j]) / (k3[0] - k1[0]) * h;
    out.push((2 * t3 - 3 * t2 + 1) * k1[j] + (t3 - 2 * t2 + t) * m1 + (3 * t2 - 2 * t3) * k2[j] + (t3 - t2) * m2);
  }
  return out;
}
const heroStep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// ---- 鞋：圆头的矮帮鞋。side = 1 左脚（+x），-1 右脚；(cx, cz) 是裤脚口的中心；B 是骨头编号 ----
// 一圈圈横截面从鞋跟排到鞋头：底是平的，鞋底一道浅色的边，鞋面是拱起来的；两头收成圆的。脚踝上套一截袜子，伸进裤腿里
function heroShoePart(side, cx, cz, B) {
  const P = heroPart(), C = HERO_COL, L = 0.228, z0 = cz - 0.07, N = 26, SOLE = 0.017, foot = [[B.foot, 1]];
  //            t     里侧半宽  外侧半宽  鞋面高   中线往里偏
  const K = [[0, 0.030, 0.031, 0.070, 0], [0.12, 0.034, 0.035, 0.086, 0], [0.30, 0.036, 0.038, 0.092, 0], [0.44, 0.037, 0.041, 0.086, 0.001],
    [0.58, 0.040, 0.046, 0.066, 0.003], [0.72, 0.041, 0.048, 0.052, 0.005], [0.86, 0.039, 0.044, 0.046, 0.007], [1, 0.034, 0.037, 0.042, 0.008]];
  const rings = [];
  for (let i = 0; i < N; i++) {
    const t = 0.5 - 0.5 * Math.cos(Math.PI * i / (N - 1)), [wi, wo, h, off] = heroKeys(K, t);
    const eh = t < 0.16 ? Math.sqrt(Math.max(0, 1 - (1 - t / 0.16) ** 2)) : 1, et = t > 0.78 ? Math.sqrt(Math.max(0, 1 - ((t - 0.78) / 0.22) ** 2)) : 1, e = Math.min(eh, et);
    const yc = t < 0.5 ? 0.034 : 0.022, ev = e ** 0.8, y0 = yc * (1 - ev), y1 = yc + (h - yc) * ev, sole = SOLE * ev, z = z0 + L * t, xc = cx - side * off;
    const pts = [], cols = [], put = (dx, y, c) => { pts.push([xc + side * dx, y, z]); cols.push(c); };
    const a = wi * e, b = wo * e;                      // 这一圈里侧、外侧各多宽（dx：外侧为正）
    for (let k = 0; k <= 6; k++) { const q = -1 + 2 * k / 6; put(q < 0 ? q * a * 0.9 : q * b * 0.9, y0, C.sole); }          // 鞋底
    put(b, y0 + sole * 0.35, C.sole); put(b, y0 + sole, C.sole); put(b - 0.0015 * e, y0 + sole, C.shoe);                            // 外侧的鞋底边
    for (let k = 1; k < 14; k++) { const g = Math.PI * k / 14, c = Math.cos(g), s = Math.sin(g); put((c > 0 ? b : a) * heroPow(c, 0.8) * 0.985, y0 + sole + (y1 - y0 - sole) * heroPow(s, 0.9), C.shoe); }   // 鞋面
    put(-a + 0.0015 * e, y0 + sole, C.shoe); put(-a, y0 + sole, C.sole); put(-a, y0 + sole * 0.35, C.sole);                         // 里侧的鞋底边
    rings.push(P.ring(pts, k => cols[k], foot));
  }
  P.loft(rings); P.close();
  // 鞋口和袜子：从鞋里伸出来，往上进裤腿。最下面一截是鞋口（和鞋面一个颜色，接缝看不出来），再往上是袜子。脚踝以下跟脚走，以上跟小腿走
  const sock = [];
  for (let i = 0; i <= 5; i++) {
    const y = [0.06, 0.1, 0.1, 0.13, 0.17, 0.21][i], k = heroStep(0.075, 0.15, y), w = k <= 0 ? foot : k >= 1 ? [[B.leg, 1]] : [[B.foot, 1 - k], [B.leg, k]], pts = [];
    for (let j = 0; j < 14; j++) { const g = 6.2832 * j / 14; pts.push([cx + (i < 2 ? 0.033 : 0.03) * Math.cos(g), y, cz - 0.004 + (i < 2 ? 0.039 : 0.036) * Math.sin(g)]); }
    sock.push(P.ring(pts, i < 2 ? C.shoe : C.sock, w));
  }
  P.loft(sock);
  return P.done();
}

// ---- 手：四指并着（指尖一长一短，指缝压暗一道），拇指单独分开。side = 1 左手；W 是袖口的中心 ----
// 手自己的三个方向：d 顺着手指，f 朝身体前面（拇指那一侧），n 朝身体（手心）
function heroHandPart(side, W, B) {
  const P = heroPart(), C = HERO_COL, hand = [[B.hand, 1]];
  const nrm = v => { const l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; };
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const d = nrm([side * 0.07, -1, 0.03]);
  let f = nrm(cross(cross(d, [-side * 0.42, 0, 1]), d)), n = nrm(cross(d, f)); if (n[0] * side > 0) n = n.map(v => -v);   // 手背略朝前：手心斜着对着大腿
  const at = (o, s, q, r) => [o[0] + d[0] * s + f[0] * q + n[0] * r, o[1] + d[1] * s + f[1] * q + n[1] * r, o[2] + d[2] * s + f[2] * q + n[2] * r];
  const O = at(W, -0.012, 0, 0), SK = 0.08, LEN = 0.148;
  //            s      半宽    半厚   往拇指那边偏
  const K = [[-0.03, 0.022, 0.018, 0], [0.0, 0.024, 0.0165, 0], [0.03, 0.035, 0.0165, 0.003], [0.058, 0.040, 0.0155, 0.003], [0.082, 0.040, 0.0135, 0.002],
    [0.112, 0.0385, 0.012, 0.001], [0.136, 0.036, 0.0105, 0], [0.148, 0.033, 0.009, 0]];
  const FL = [0.8, 0.95, 1, 0.92], M = 40, R = 18, rings = [];
  for (let i = 0; i < R; i++) {
    const s0 = -0.03 + (LEN + 0.03) * i / (R - 1), pts = [], cols = [];
    for (let k = 0; k < M; k++) {
      const g = 6.2832 * k / M, cq = heroPow(Math.cos(g), 0.62), sr = heroPow(Math.sin(g), 0.75);
      // 过了指根：每根手指各有各的长短，指尖是圆的
      const u = (cq + 1) * 2, j = Math.min(3, Math.floor(u)), fr = Math.abs(2 * (u - j) - 1), len = FL[j] - 0.075 * fr ** 2.6;
      const s = s0 <= SK ? s0 : SK + (s0 - SK) * len, [a, b, off] = heroKeys(K, s0), tip = s0 > LEN - 0.022 ? Math.sqrt(Math.max(0, 1 - ((s0 - LEN + 0.022) / 0.022) ** 2)) : 1;
      const curl = 0.42 * heroStep(0.05, 0.2, s) * (s - 0.05);                         // 手指往手心那边蜷一点
      pts.push(at(O, s - 0.3 * curl, off + a * cq, b * sr * (0.4 + 0.6 * tip) + curl));
      cols.push(s0 > SK + 0.006 && fr > 0.8 && u > 0.5 && u < 3.5 ? C.skinDark : C.skin);
    }
    rings.push(P.ring(pts, k => cols[k], hand));
  }
  P.loft(rings);
  { const c = [0, 0, 0], E = rings[R - 1]; for (const i of E) for (let q = 0; q < 3; q++) c[q] += P.at(i)[q] / E.length; P.fan(P.vert(at(c, 0.003, 0, 0), C.skin, hand), E); }
  P.close();
  // 拇指：从掌根靠前的一侧斜着伸出去，和食指之间留一道缝
  const t0 = at(O, 0.026, 0.026, 0.006), td = nrm([0, 1, 2].map(i => d[i] * 0.8 + f[i] * 0.55 + n[i] * 0.22)), tu = nrm(cross(td, n)), tv = nrm(cross(td, tu)), th = [];
  for (let i = 0; i <= 8; i++) {
    const s = 0.062 * i / 8, r = (0.0155 - 0.004 * i / 8) * (i > 5 ? Math.sqrt(Math.max(0.04, 1 - ((i - 5) / 3.15) ** 2)) : 1), pts = [];
    for (let k = 0; k < 12; k++) { const g = 6.2832 * k / 12; pts.push([0, 1, 2].map(q => t0[q] + td[q] * s + (tu[q] * Math.cos(g) * 1.15 + tv[q] * Math.sin(g) * 0.9) * r)); }
    th.push(P.ring(pts, C.skin, hand));
  }
  P.loft(th); P.fan(P.vert([0, 1, 2].map(q => t0[q] + td[q] * 0.065), C.skin, hand), th[8]); P.close();
  return P.done();
}

// ---- 头：一层层水平的切片，从头顶排到下巴。每层 [高度, 中心前后, 朝前的半径, 朝后的半径, 左右半宽] ----
const HERO_HEAD = (() => {
  const K = [], Y0 = 1.562, TOP = 0.105;                                       // Y0：头最宽的那一层；再往上是半个椭球
  for (const a of [0, 0.2, 0.42, 0.66, 0.92, 1.2, 1.5708]) { const s = Math.sin(a); K.push([Y0 + TOP * Math.cos(a), -0.012, 0.108 * s, 0.118 * s, 0.107 * s]); }
  // 侧面的轮廓是孩子的：额头鼓，往下脸一路往后收，下巴小
  K.push([1.525, -0.010, 0.1085, 0.117, 0.1055], [1.488, -0.008, 0.1065, 0.110, 0.1015], [1.455, -0.005, 0.1005, 0.094, 0.094], [1.428, 0.0, 0.093, 0.072, 0.082],
    [1.406, 0.010, 0.078, 0.056, 0.066], [1.392, 0.022, 0.058, 0.045, 0.045], [1.385, 0.030, 0.036, 0.035, 0.026], [1.382, 0.034, 0, 0, 0]);
  return K.map((k, i) => [i / (K.length - 1), ...k]);
})();
function heroSkull(s, phi) {                         // 头皮上的一点：s 从头顶 0 到下巴 1，phi 绕竖轴（0 正前，往左手那边转）
  const [y, cz, f, b, w] = heroKeys(HERO_HEAD, s), c = Math.cos(phi), sn = Math.sin(phi); phi = phi > Math.PI ? phi - 6.2832 : phi;
  let z = cz + (c > 0 ? f : b) * heroPow(c, c > 0 ? 0.86 : 0.94);
  // 鼻子：只是正前方一个很浅的小鼓包 —— 不是为了近看好看，是远处的侧面剪影里看得出脸朝哪边，又不戳出来一个尖
  z += 0.012 * Math.exp(-((phi / 0.26) ** 2)) * Math.exp(-(((y - 1.466) / (y > 1.466 ? 0.032 : 0.016)) ** 2));
  return [w * heroPow(sn, 0.9) * (c < 0 ? 1 + 0.42 * c * heroStep(1.5, 1.41, y) : 1), y, z];     // 后脑勺往下收窄，接到脖子上
}
// 发际线：绕头一圈各处的头发长到多低。正面是齐的短刘海，鬓角在耳朵前面收住，耳朵上面绕过去（耳朵整个露在外面），脑后到后颈
const HERO_HAIRLINE = [[0, 1.588], [0.5, 1.59], [0.95, 1.584], [1.09, 1.578], [1.17, 1.552], [1.24, 1.538], [1.36, 1.537], [1.45, 1.549], [1.56, 1.558], [1.82, 1.558], [2.0, 1.522], [2.2, 1.465], [2.5, 1.425], [3.1416, 1.41]];
function heroSkullPart(B) {
  const P = heroPart(), C = HERO_COL, head = [[B.head, 1]], N = 64, R = 40, TAU = 6.2832;
  const PHI = k => { const q = k / N; return TAU * q + 0.4 * Math.sin(2 * TAU * q) / 2; };   // 绕头一圈的点两侧密、前后疏：发际线在耳朵周围拐的弯多
  // 头皮和脸
  const rings = [];
  for (let i = 1; i < R; i++) { const s = i / R, pts = []; for (let k = 0; k < N; k++) pts.push(heroSkull(s, PHI(k))); rings.push(P.ring(pts, C.skin, head)); }
  P.loft(rings); P.fan(P.vert(heroSkull(0, 0), C.skin, head), rings[0].slice().reverse()); P.fan(P.vert(heroSkull(1, 0), C.skin, head), rings[R - 2]); P.close();
  // 头发：贴着头皮往外垫一层，头顶和刘海厚一点，发际线那里收一道边
  const sAt = y => { let a = 0, b = 1; for (let i = 0; i < 30; i++) { const m = (a + b) / 2; if (heroKeys(HERO_HEAD, m)[0] > y) a = m; else b = m; } return (a + b) / 2; };
  const HR = 15, hair = [];
  for (let i = 1; i <= HR + 1; i++) {
    const pts = [];
    for (let k = 0; k < N; k++) {
      const phi = PHI(k), ap = Math.abs(phi > Math.PI ? phi - TAU : phi), sw = phi > Math.PI ? -1 : 1;
      const front = heroStep(1.0, 0.35, ap), yl = heroKeys(HERO_HAIRLINE, ap)[0] - 0.007 * front * (0.5 + 0.5 * sw * Math.sin(ap * 2.2));   // 刘海往一边偏一点
      const sl = sAt(yl), u = Math.min(1, i / HR), s = sl * (1 - (1 - u) ** 1.25), p = heroSkull(s, phi), [y, cz] = heroKeys(HERO_HEAD, s);
      const th = i > HR ? 0.0008 : 0.0075 + 0.0115 * heroStep(0, 0.4, 1 - u) + 0.007 * front * heroStep(0.0, 0.5, u) + 0.004 * heroStep(2.3, 3.1, ap) * u;
      const nx = p[0] / 0.107 ** 2, ny = (p[1] - 1.5) / 0.16 ** 2 * heroStep(0.75, 0.2, u), nz = (p[2] - cz) / 0.112 ** 2, l = Math.hypot(nx, ny, nz) || 1;
      pts.push([p[0] + nx / l * th, p[1] + ny / l * th + (i > HR ? 0.004 : -0.004 * front * heroStep(0.7, 1, u)), p[2] + nz / l * th]);   // 刘海的发梢比发际线再垂下来一点
    }
    hair.push(P.ring(pts, C.hair, head));
  }
  P.loft(hair);
  { const p = heroSkull(0, 0); P.fan(P.vert([p[0], p[1] + 0.019, p[2]], C.hair, head), hair[0].slice().reverse()); }
  P.close();
  // 耳朵：一片压扁的小圆饼，后缘往外翘，中间凹进去一点、颜色深一号
  for (const sd of [1, -1]) {
    const E = [], ca = Math.cos(0.55), sa = Math.sin(0.55), ex = 0.0995, ey = 1.5, ez = -0.014;
    for (let i = 1; i < 9; i++) {
      const a = Math.PI * i / 9, pts = [], cols = [];
      for (let k = 0; k < 14; k++) {
        const g = TAU * k / 14, out = Math.cos(g);                               // out > 0：朝外的那一面
        let x = 0.01 * Math.sin(a) * out, y = 0.035 * Math.cos(a) * (1 + 0.12 * Math.sin(g)), z = 0.022 * Math.sin(a) * Math.sin(g);
        const dent = out > 0 ? Math.exp(-((y / 0.021) ** 2 + ((z + 0.002) / 0.011) ** 2)) : 0; x -= 0.009 * dent;
        z -= 0.006 * (y / 0.035);                                                 // 上半截往后斜
        pts.push([sd * (ex + x * ca - z * sa + 0.006), ey + y, ez + z * ca + x * sa]); cols.push(dent > 0.45 ? C.skinDark : C.skin);
      }
      E.push(P.ring(pts, k => cols[k], head));
    }
    P.loft(E);
    P.fan(P.vert([sd * (ex + 0.006), ey + 0.035, ez - 0.006], C.skin, head), E[0].slice().reverse()); P.fan(P.vert([sd * (ex + 0.006), ey - 0.035, ez + 0.006], C.skin, head), E[7]); P.close();
  }
  const out = P.done(), K = HERO_HEAD_K, pv = [0, 1.39, -0.012];               // 整个头放大一圈（绕着脖子顶上那一点）
  for (let i = 0; i < out.pos.length; i++) out.pos[i] = pv[i % 3] + (out.pos[i] - pv[i % 3]) * K;
  return out;
}
// ---- 脖子：从领口里面一直伸进头里。下面跟着脖子和肩，上面跟着头 ----
function heroNeckPart(c, B) {
  const P = heroPart(), rings = [];
  for (let i = 0; i <= 8; i++) {
    const y = 1.262 + 0.024 * i, k = heroStep(1.3, 1.385, y), w = [[B.head, k], [B.neck, (1 - k) * 0.8], [B.spine, (1 - k) * 0.2]].filter(v => v[1] > 0.001), pts = [];
    const r = 0.047 + 0.006 * heroStep(1.32, 1.262, y), zc = c[2] + 0.004 + 0.09 * (y - 1.3);
    for (let j = 0; j < 18; j++) { const g = 6.2832 * j / 18; pts.push([c[0] + r * 0.96 * Math.cos(g), y, zc + r * 1.06 * Math.sin(g)]); }
    rings.push(P.ring(pts, HERO_COL.skin, w));
  }
  P.loft(rings); return P.done();
}

// ---- 总装。src = { pos, index, uv, joints（每个顶点四个骨头编号）, weights, bones（骨头名字，按编号）, pixel(u, v) → [r, g, b] } ----
// 返回 { pos, nor, col（线性空间的顶点色）, top（是不是上衣：换衣服颜色的着色器用）, joints, weights, index, H（原模型的身高）}
function heroMesh(src) {
  const nv = src.pos.length / 3, nb = src.bones.length, B = n => src.bones.indexOf(n);
  let H = 0; for (let i = 0; i < nv; i++) H = Math.max(H, src.pos[3 * i + 1]);
  // 1 按位置焊顶点（原模型在贴图接缝处把同一个点拆成了好几个）
  const ids = new Map(), weld = new Int32Array(nv), wp = [], ww = [];
  for (let i = 0; i < nv; i++) {
    const q = `${Math.round(src.pos[3 * i] * 2e4)},${Math.round(src.pos[3 * i + 1] * 2e4)},${Math.round(src.pos[3 * i + 2] * 2e4)}`;
    let id = ids.get(q);
    if (id === undefined) {
      id = wp.length / 3; ids.set(q, id); wp.push(src.pos[3 * i], src.pos[3 * i + 1], src.pos[3 * i + 2]);
      const row = new Float32Array(nb); for (let k = 0; k < 4; k++) row[src.joints[4 * i + k]] += src.weights[4 * i + k]; ww.push(row);
    }
    weld[i] = id;
  }
  // 2 每个面是哪一块：在面里取七个点看贴图的颜色，取中间的那个
  const tri = [], cls = [], SMP = [[0.34, 0.33, 0.33], [0.6, 0.2, 0.2], [0.2, 0.6, 0.2], [0.2, 0.2, 0.6], [0.45, 0.45, 0.1], [0.1, 0.45, 0.45], [0.45, 0.1, 0.45]];
  const headW = v => ww[v][B('Head')] + ww[v][B('head_end')] + ww[v][B('headfront')];
  for (let t = 0; t < src.index.length; t += 3) {
    const [a, b, c] = [src.index[t], src.index[t + 1], src.index[t + 2]], w = [weld[a], weld[b], weld[c]];
    if (w[0] === w[1] || w[1] === w[2] || w[0] === w[2]) continue;
    const px = SMP.map(([i, j, k]) => src.pixel(i * src.uv[2 * a] + j * src.uv[2 * b] + k * src.uv[2 * c], i * src.uv[2 * a + 1] + j * src.uv[2 * b + 1] + k * src.uv[2 * c + 1]));
    const med = ch => px.map(p => p[ch]).sort((x, y) => x - y)[3], r = med(0), g = med(1), bl = med(2), mx = Math.max(r, g, bl);
    const y = (wp[3 * w[0] + 1] + wp[3 * w[1] + 1] + wp[3 * w[2] + 1]) / 3, x = (wp[3 * w[0]] + wp[3 * w[1]] + wp[3 * w[2]]) / 3;
    const hw = (headW(w[0]) + headW(w[1]) + headW(w[2])) / 3;
    let k = mx < 110 ? (y > 0.8 * H ? 1 : mx >= 50 && y < 0.06 * H ? 4 : 3) : r - bl > 25 ? 0 : 2;
    if (y < 0.03 * H || (k === 2 && y < 0.06 * H)) k = 4;
    if (k === 2 && y < 0.4 * H) k = 3;
    if (k === 2 && hw > 0.5 && y > 0.82 * H) k = 1;                               // 头发上有几块发白的面
    // 3 剪掉要另做的几块：头和脖子、两只手、两只鞋
    if (k === 4 || k === 1 || (k === 0 && (y > 0.72 * H || Math.abs(x) > 0.12 * H))) continue;
    if (k === 0) k = 3;                                                            // 剩下零星认成皮肤的（裤子上的反光）：当裤子
    tri.push(w[0], w[1], w[2]); cls.push(k);
  }
  // 原模型有四片只靠一条边挂在表面上的碎面（另外两条边都悬空）：去掉
  { const cnt = new Map(), ek = (a, b) => a < b ? a * 1e5 + b : b * 1e5 + a;
    for (let t = 0; t < tri.length; t += 3) for (let k = 0; k < 3; k++) { const q = ek(tri[t + k], tri[t + (k + 1) % 3]); cnt.set(q, (cnt.get(q) || 0) + 1); }
    for (let t = tri.length - 3; t >= 0; t -= 3) { let free = 0, over = 0; for (let k = 0; k < 3; k++) { const c = cnt.get(ek(tri[t + k], tri[t + (k + 1) % 3])); if (c === 1) free++; if (c > 2) over++; } if (free === 2 && over === 1) { tri.splice(t, 3); cls.splice(t / 3, 1); } } }
  // 4 细分一遍
  const flat = new Float32Array(nb * ww.length); ww.forEach((r, i) => flat.set(r, nb * i));
  const body = heroLoop({ n: wp.length / 3, pos: Float64Array.from(wp), wt: flat, nb, tri: Int32Array.from(tri), cls: Uint8Array.from(cls) });
  // 5 量一量剪开的口子：一圈只属于一个面的边。两个裤脚口、两个袖口、一个领口
  const cnt = new Map(), ek = (a, b) => a < b ? a * body.n + b : b * body.n + a;
  for (let t = 0; t < body.tri.length; t += 3) for (let k = 0; k < 3; k++) { const q = ek(body.tri[t + k], body.tri[t + (k + 1) % 3]); cnt.set(q, (cnt.get(q) || 0) + 1); }
  const parent = new Map(), find = v => { while (parent.get(v) !== v) { parent.set(v, parent.get(parent.get(v))); v = parent.get(v); } return v; };
  for (const [q, c] of cnt) if (c === 1) { const a = Math.floor(q / body.n), b = q % body.n; for (const v of [a, b]) if (!parent.has(v)) parent.set(v, v); parent.set(find(a), find(b)); }
  const loops = new Map();
  for (const v of parent.keys()) { const r = find(v); let L = loops.get(r); if (!L) loops.set(r, L = { n: 0, c: [0, 0, 0] }); L.n++; for (let i = 0; i < 3; i++) L.c[i] += body.pos[3 * v + i]; }
  const open = [...loops.values()].filter(L => L.n >= 8).map(L => ({ n: L.n, c: L.c.map(v => v / L.n) }));
  const pick = ok => open.filter(L => ok(L.c)).sort((a, b) => b.n - a.n)[0]?.c;
  // 6 另做的零件
  const parts = [];
  for (const sd of [1, -1]) {
    const S = sd > 0 ? 'Left' : 'Right';
    const hem = pick(c => c[1] < 0.12 * H && c[0] * sd > 0) ?? [sd * 0.124, 0.08, -0.008];
    parts.push(heroShoePart(sd, hem[0], hem[2], { foot: B(S + 'Foot'), leg: B(S + 'Leg') }));
    const cuff = pick(c => c[1] > 0.38 * H && c[1] < 0.56 * H && c[0] * sd > 0.1) ?? [sd * 0.29, 0.79, -0.016];
    parts.push(heroHandPart(sd, cuff, { hand: B(S + 'Hand') }));
  }
  const collar = pick(c => c[1] > 0.7 * H) ?? [0, 1.3, -0.02];
  parts.push(heroNeckPart([0, collar[1], -0.019], { head: B('Head'), neck: B('neck'), spine: B('Spine') }), heroSkullPart({ head: B('Head') }));
  // 7 拼成一个网格。身体：同一个位置上颜色不同的面各用各的顶点，法线共用（颜色的分界是硬的，表面是连续的）
  const pos = [], nor = [], col = [], top = [], joints = [], weights = [], index = [];
  const lin = c => c.map(v => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  const PAL = HERO_CLS.map(n => lin(HERO_COL[n]));
  const smooth = (p, t, n) => {                        // 连续的法线：每个面按面积摊给三个顶点
    const out = new Float64Array(3 * n);
    for (let i = 0; i < t.length; i += 3) {
      const a = t[i], b = t[i + 1], c = t[i + 2], ux = p[3 * b] - p[3 * a], uy = p[3 * b + 1] - p[3 * a + 1], uz = p[3 * b + 2] - p[3 * a + 2], vx = p[3 * c] - p[3 * a], vy = p[3 * c + 1] - p[3 * a + 1], vz = p[3 * c + 2] - p[3 * a + 2];
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      for (const v of [a, b, c]) { out[3 * v] += nx; out[3 * v + 1] += ny; out[3 * v + 2] += nz; }
    }
    for (let i = 0; i < n; i++) { const l = Math.hypot(out[3 * i], out[3 * i + 1], out[3 * i + 2]) || 1; out[3 * i] /= l; out[3 * i + 1] /= l; out[3 * i + 2] /= l; }
    return out;
  };
  const push = (p, n, c, isTop, w) => {
    pos.push(p[0], p[1], p[2]); nor.push(n[0], n[1], n[2]); col.push(c[0], c[1], c[2]); top.push(isTop);
    const s = w.slice().sort((a, b) => b[1] - a[1]).slice(0, 4), sum = s.reduce((a, v) => a + v[1], 0) || 1;
    for (let k = 0; k < 4; k++) { joints.push(s[k] ? s[k][0] : 0); weights.push(s[k] ? s[k][1] / sum : 0); }
    return pos.length / 3 - 1;
  };
  {
    const bn = smooth(body.pos, body.tri, body.n), seen = new Map();
    for (let t = 0; t < body.tri.length; t += 3) for (let k = 0; k < 3; k++) {
      const v = body.tri[t + k], c = body.cls[t / 3], q = v * 8 + c;
      let id = seen.get(q);
      if (id === undefined) {
        const w = []; for (let b = 0; b < nb; b++) if (body.wt[nb * v + b] > 0.004) w.push([b, body.wt[nb * v + b]]);
        id = push([body.pos[3 * v], body.pos[3 * v + 1], body.pos[3 * v + 2]], [bn[3 * v], bn[3 * v + 1], bn[3 * v + 2]], PAL[c], c === 2 ? 1 : 0, w); seen.set(q, id);
      }
      index.push(id);
    }
  }
  for (const part of parts) {
    // 零件里同一个位置的点（颜色交界处是成对的）法线也共用
    const n = part.pos.length / 3, ids2 = new Map(), w2 = new Int32Array(n), p2 = [];
    for (let i = 0; i < n; i++) { const q = `${Math.round(part.pos[3 * i] * 1e5)},${Math.round(part.pos[3 * i + 1] * 1e5)},${Math.round(part.pos[3 * i + 2] * 1e5)}`; let id = ids2.get(q); if (id === undefined) { id = p2.length / 3; ids2.set(q, id); p2.push(part.pos[3 * i], part.pos[3 * i + 1], part.pos[3 * i + 2]); } w2[i] = id; }
    const pn = smooth(p2, part.tris.map(i => w2[i]), p2.length / 3), base = [];
    for (let i = 0; i < n; i++) base.push(push([part.pos[3 * i], part.pos[3 * i + 1], part.pos[3 * i + 2]], [pn[3 * w2[i]], pn[3 * w2[i] + 1], pn[3 * w2[i] + 2]], lin(part.col[i]), 0, part.bw[i]));
    for (const i of part.tris) index.push(base[i]);
  }
  return { pos, nor, col, top, joints, weights, index, H };
}

// ==== THREE ====
// 把整形后的网格换到载入的模型上。同一份模型只算一次（结果记在原来的几何体上），重搭主角时直接拿来用；
// 几何体和材质是大家共用的，所以不标 travelerOwned —— 主角换掉、重搭时不会把它们释放掉
let heroMaterial = null;
function refineTravelerAppearance(model) {
  model.traverse(mesh => {
    if (!mesh.isSkinnedMesh) return;
    const g0 = mesh.geometry;
    if (!g0.userData.hero) {
      const A = g0.attributes, n = A.position.count, img = mesh.material.map.image, [cv, cx] = mkCanvas(img.width, img.height); cx.drawImage(img, 0, 0);
      const px = cx.getImageData(0, 0, img.width, img.height).data, W = img.width, Hh = img.height;
      const flat = (a, k) => { const o = new Array(n * k), get = ['getX', 'getY', 'getZ', 'getW']; for (let i = 0; i < n; i++) for (let j = 0; j < k; j++) o[i * k + j] = a[get[j]](i); return o; };
      const M = heroMesh({ pos: flat(A.position, 3), uv: flat(A.uv, 2), index: Array.from(g0.index.array), joints: flat(A.skinIndex, 4), weights: flat(A.skinWeight, 4), bones: mesh.skeleton.bones.map(b => b.name),
        pixel(u, v) { const x = clamp(Math.floor((u - Math.floor(u)) * W), 0, W - 1), y = clamp(Math.floor((v - Math.floor(v)) * Hh), 0, Hh - 1), o = 4 * (y * W + x); return [px[o], px[o + 1], px[o + 2]]; } });
      const g = new THREE.BufferGeometry(), nv = M.pos.length / 3, read = new Float32Array(nv);
      for (let i = 0; i < nv; i++) {                    // 头和肩略微提亮一点：暗处先认出这两处（和原来一样）
        const h = M.pos[3 * i + 1] / M.H, head = sstep(.80, .88, h), shoulders = sstep(.63, .72, h) * (1 - head);
        read[i] = Math.max(head, shoulders * (.5 + .3 * (1 - sstep(-.02, .06, M.pos[3 * i + 2]))));
      }
      g.setAttribute('position', new THREE.Float32BufferAttribute(M.pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(M.nor, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(M.col, 3)); g.setAttribute('heroTop', new THREE.Float32BufferAttribute(M.top, 1));
      g.setAttribute('characterReadability', new THREE.BufferAttribute(read, 1));
      g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(M.joints, 4)); g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(M.weights, 4));
      g.setIndex(M.index); g.computeBoundingBox(); g.computeBoundingSphere();
      g0.userData.hero = { geo: g, H: M.H };
    }
    if (!heroMaterial) {
      heroMaterial = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });   // 只有漫反射：磨平以后，带高光的材质会在轮廓边上（尤其是黑裤子）泛出一道亮线
      heroMaterial.onBeforeCompile = shader => {
        shader.uniforms.uTop = HERO_TOP.uTop; shader.uniforms.uTopK = HERO_TOP.uTopK; shader.uniforms.uRim = HERO_RIM.uRim; shader.uniforms.uRimK = HERO_RIM.uRimK;
        shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nattribute float characterReadability;\nattribute float heroTop;\nvarying float vCharacterReadability;\nvarying float vHeroTop;')
          .replace('#include <begin_vertex>', '#include <begin_vertex>\nvCharacterReadability = characterReadability;\nvHeroTop = heroTop;');
        shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vCharacterReadability;\nvarying float vHeroTop;\nuniform vec3 uTop;\nuniform float uTopK;\nuniform vec3 uRim;\nuniform float uRimK;')
          .replace('#include <color_fragment>', '#include <color_fragment>\n{ float tK = uTopK * step(0.5, vHeroTop);\ndiffuseColor.rgb = mix(diffuseColor.rgb, uTop * 0.95, tK);\ntotalEmissiveRadiance += uTop * 0.95 * tK * 0.3; }')   // 上衣那一块换成章节给的颜色；换上去的颜色带三成自发光：再暗的地方也认得出这一块颜色
          .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ndiffuseColor.rgb *= 1.0 + 0.12 * vCharacterReadability;\ntotalEmissiveRadiance += vec3(0.012, 0.013, 0.014) * vCharacterReadability;\ntotalEmissiveRadiance += uRim * uRimK * pow(1.0 - abs(dot(normalize(normal), normalize(-vViewPosition))), 5.0);');
      };
      heroMaterial.customProgramCacheKey = () => 'traveler-readability-v5';
    }
    mesh.geometry = g0.userData.hero.geo; mesh.material = heroMaterial;
    model.userData.heroH = g0.userData.hero.H;           // 原模型的身高：头发剪短、头放大以后，整个人的大小还按原来的算
  });
}
