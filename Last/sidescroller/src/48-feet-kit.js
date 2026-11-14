
// ============================================================
//  主角脚边的东西（一）：道具
//  以前摆的东西不是贴着画面下沿（前景），就是在十几米外的布景板上；主角走的那条线前后一两米是空的。
//  这里是摆在那一带的小道具：电缆、螺母、纸箱、托盘、油桶、水桶、椅子、轮胎、管子、沙袋、隔离桩……
//  都是很多小零件拼起来的，再“烘”成一个网格（每个零件的颜色写在顶点上），一组东西只画一次，手机上也吃得消。
//  各章摆什么、摆在哪里在 73-feet-chapters.js
// ============================================================
const FEET_MAT = lam(0xffffff, { vertexColors: true });

// 把很多小零件烘成一个网格。用法：B.at(x, y, z, 朝向) 定好一件东西的原点，再往上加零件（坐标都相对这个原点），
// 最后 B.mesh(父节点) 把攒下来的零件做成一个网格（攒的东西清空，可以接着攒下一批）
function baker() {
  let P = [], N = [], C = [];
  const base = new THREE.Matrix4(), m4 = new THREE.Matrix4(), n3 = new THREE.Matrix3(), v = V3(), q = new THREE.Quaternion(), e = new THREE.Euler(0, 0, 0, 'YXZ'), sc = V3(), col = new THREE.Color(), vc = new THREE.Color();
  const B = {
    vary: 0.08,                                          // 每个零件的颜色深浅随机差多少
    // 原点放在 (x, y, z)，绕竖轴转 yaw；rx、rz 是整件东西先倾斜多少（倒在地上的桶、歪着的牌子）
    at(x, y, z, yaw = 0, rx = 0, rz = 0) { e.set(rx, yaw, rz); base.compose(v.set(x, y, z), q.setFromEuler(e), sc.set(1, 1, 1)); return B; },
    // 一个零件：g 用完就释放；s 是一个数或 [sx, sy, sz]
    part(g, hex, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, s = 1) {
      e.set(rx, ry, rz); q.setFromEuler(e); if (Array.isArray(s)) sc.set(s[0], s[1], s[2]); else sc.set(s, s, s);
      m4.compose(v.set(x, y, z), q, sc).premultiply(base); n3.getNormalMatrix(m4);
      const gg = g.index ? g.toNonIndexed() : g, p = gg.attributes.position, n = gg.attributes.normal, gc = gg.attributes.color;
      col.set(hex); if (B.vary) col.multiplyScalar(1 + B.vary * (rnd() * 2 - 1));
      for (let i = 0; i < p.count; i++) {
        v.fromBufferAttribute(p, i).applyMatrix4(m4); P.push(v.x, v.y, v.z);
        v.fromBufferAttribute(n, i).applyMatrix3(n3).normalize(); N.push(v.x, v.y, v.z);
        if (gc) { vc.fromBufferAttribute(gc, i).multiply(col); C.push(vc.r, vc.g, vc.b); } else C.push(col.r, col.g, col.b);
      }
      if (gg !== g) gg.dispose(); g.dispose(); return B;
    },
    box(w, h, d, hex, x, y, z, rx, ry, rz) { return B.part(new THREE.BoxGeometry(w, h, d), hex, x, y, z, rx, ry, rz); },
    cyl(rt, rb, h, seg, hex, x, y, z, rx, ry, rz) { return B.part(new THREE.CylinderGeometry(rt, rb, h, seg), hex, x, y, z, rx, ry, rz); },
    ball(r, hex, x, y, z, s = 1, det = 1) { return B.part(new THREE.IcosahedronGeometry(r, det), hex, x, y, z, 0, rnd() * 6.28, 0, s); },
    torus(R, r, hex, x, y, z, rx, ry, rz, arc = 6.2832, seg = 16) { return B.part(new THREE.TorusGeometry(R, r, 6, seg, arc), hex, x, y, z, rx, ry, rz); },
    // 一根沿着几个点弯过去的管子 / 缆线（点是相对原点的）
    tube(pts, r, hex, seg = 0, rad = 6) { const c = new THREE.CatmullRomCurve3(pts.map(p => V3(p[0], p[1], p[2])), false, 'catmullrom', 0.3); return B.part(new THREE.TubeGeometry(c, seg || Math.max(4, Math.round(c.getLength() * 6)), r, rad, false), hex); },
    // 一根直杆：从 a 到 b（相对原点），半径 r
    rod(a, b, r, hex, seg = 6) {
      const d = V3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), L = d.length(), g = new THREE.CylinderGeometry(r, r, L, seg);
      g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), d.normalize())); g.translate((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
      return B.part(g, hex);
    },
    count: () => P.length / 9,
    mesh(parent, o = {}) {
      if (!P.length) return null;
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
      g.computeBoundingSphere(); P = []; N = []; C = [];
      const m = new THREE.Mesh(g, o.mat ?? FEET_MAT); m.castShadow = o.shadow !== false; m.receiveShadow = true; parent.add(m); return m;
    },
  };
  return B;
}

// ---- 地上的线：电缆、水管 ----
// 贴着地面从 x1 拐到 x2 的一根线：z 在 z1、z2 之间慢慢摆动。r 粗细；loops 中途盘一圈；o.lift 某几段离地（搭在别的东西上）
function floorLine(B, x1, z1, x2, z2, r, hex, o = {}) {
  const n = Math.max(3, Math.round(Math.abs(x2 - x1) / 0.45)), pts = [], wob = o.wob ?? 0.25, ph = rnd() * 6.28, f = rr(1.2, 2.2);
  for (let i = 0; i <= n; i++) {
    const t = i / n, x = lerp(x1, x2, t), z = lerp(z1, z2, sstep(0, 1, t)) + Math.sin(t * f * 3.14 + ph) * wob * Math.sin(t * 3.14);
    pts.push([x, groundY(x) + r * 0.95 + (o.lift ? o.lift(t) : 0), z]);
  }
  B.at(0, 0, 0).tube(pts, r, hex);
  if (o.loop) { const [lx, , lz] = pts[Math.floor(n * o.loop)], y = groundY(lx) + r; B.at(lx, y, lz).torus(o.loopR ?? 0.22, r, hex, 0, 0, 0, Math.PI / 2, 0, 0); B.at(lx + 0.06, y + r * 2, lz - 0.03).torus((o.loopR ?? 0.22) * 0.85, r, hex, 0, 0, 0, Math.PI / 2, 0, 0); }
  return pts;
}

// ---- 散在地上的小东西：螺母、短铁条、瓶盖、碎玻璃……一把一把撒 ----
// kinds：nut 螺母 / bar 短铁条 / chip 碎片 / butt 烟头 / cap 瓶盖。cols 几种颜色
function scatter(B, x, z, n, rad, kinds, cols) {
  for (let i = 0; i < n; i++) {
    const a = rnd() * 6.28, d = Math.sqrt(rnd()) * rad, xx = x + Math.cos(a) * d, zz = z + Math.sin(a) * d * 0.8, y = groundY(xx), k = pick(kinds), c = pick(cols);
    B.at(xx, y, zz, rnd() * 6.28);
    if (k === 'nut') B.cyl(0.035, 0.035, 0.03, 6, c, 0, 0.015, 0);
    else if (k === 'bar') B.box(rr(0.18, 0.4), 0.025, 0.03, c, 0, 0.0125, 0);
    else if (k === 'chip') B.box(rr(0.05, 0.12), 0.012, rr(0.04, 0.09), c, 0, 0.006, 0);
    else if (k === 'cap') B.cyl(0.03, 0.03, 0.015, 8, c, 0, 0.008, 0);
    else if (k === 'stone') B.ball(rr(0.025, 0.06), c, 0, 0.012, 0, [1.2, 0.6, 1], 0);
  }
}

// ---- 平躺在地上的一张：纸板、胶合板、铁皮、纸。中间折一下，不是一块死平的板 ----
function flatSheet(B, x, z, w, d, yaw, hex, o = {}) {
  const y = groundY(x) + 0.006, bend = o.bend ?? rr(0.05, 0.22), t = o.t ?? 0.012;
  B.at(x, y, z, yaw);
  B.box(w * 0.55, t, d, hex, -w * 0.225, t / 2, 0);
  B.box(w * 0.47, t, d, hex, w * 0.26 - 0.01, t / 2 + Math.sin(bend) * w * 0.2, 0, 0, 0, bend);
}

// ---- 纸箱：带一圈胶带；open 盖子翻开；crush 被压瘪了一点 ----
function cardBox(B, x, z, w, h, d, yaw, o = {}) {
  const y = (o.y ?? groundY(x)), c = o.col ?? 0x8a7354, tape = o.tape ?? 0x6f5c42, k = o.crush ?? 0;
  B.at(x, y, z, yaw, 0, k * 0.15);
  B.box(w, h * (1 - k * 0.3), d, c, 0, h * (1 - k * 0.3) / 2, 0);
  B.box(w + 0.004, 0.05, d * 0.25, tape, 0, h * (1 - k * 0.3) - 0.02, 0);
  if (o.open) for (const s of [-1, 1]) B.box(w * 0.98, 0.01, d * 0.5, c, 0, h * (1 - k * 0.3) + Math.sin(o.open) * d * 0.25, s * (d / 2 + Math.cos(o.open) * d * 0.25 - d * 0.25), s * o.open * -1, 0, 0);
}

// ---- 托盘：五块面板 + 三根垫木；n 摞几层；tilt 靠在什么上面斜着 ----
function pallet(B, x, z, yaw, n = 1, o = {}) {
  const c = o.col ?? 0x6b5a44, c2 = o.col2 ?? 0x54473a, y0 = o.y ?? groundY(x);
  for (let k = 0; k < n; k++) {
    B.at(x + rr(-0.04, 0.04), y0 + k * 0.145, z + rr(-0.03, 0.03), yaw + rr(-0.06, 0.06));
    for (let i = 0; i < 5; i++) B.box(1.2, 0.022, 0.13, c, 0, 0.134, -0.34 + i * 0.17);
    for (const sz of [-0.34, 0, 0.34]) B.box(1.2, 0.1, 0.09, c2, 0, 0.073, sz);
    for (const sz of [-0.34, 0.34]) B.box(1.2, 0.022, 0.12, c, 0, 0.011, sz);
  }
}

// ---- 铁皮油桶：两道箍、桶盖和小盖；tip 倒在地上（滚的方向 yaw）；dent 凹了一块 ----
function drum(B, x, z, o = {}) {
  const c = o.col ?? 0x4a5458, r = 0.29, h = 0.88, rib = o.rib ?? 0x3b4447, top = o.top ?? 0x2d3437, y = o.y ?? groundY(x);
  if (o.tip) { B.at(x, y + r, z, o.yaw ?? 0, 0, Math.PI / 2); }
  else B.at(x, y, z, o.yaw ?? rnd() * 6.28);
  const oy = o.tip ? -h / 2 : 0;
  B.cyl(r, r, h, 16, c, 0, oy + h / 2, 0);
  for (const k of [0.33, 0.66]) B.cyl(r + 0.012, r + 0.012, 0.03, 16, rib, 0, oy + h * k, 0);
  for (const k of [0.015, 0.985]) B.cyl(r + 0.008, r + 0.008, 0.03, 16, rib, 0, oy + h * k, 0);
  B.cyl(r - 0.01, r - 0.01, 0.012, 16, top, 0, oy + h + 0.004, 0);
  B.cyl(0.035, 0.035, 0.02, 8, rib, r * 0.55, oy + h + 0.012, 0.05);
}

// ---- 水桶：上口敞着（里面暗一点）、一根提手；tip 倒着 ----
function bucket(B, x, z, o = {}) {
  const c = o.col ?? 0x6e787a, s = o.s ?? 1, y = o.y ?? groundY(x), h = 0.3 * s, rt = 0.155 * s, rb = 0.12 * s;
  if (o.tip) B.at(x, y + rt * 0.92, z, o.yaw ?? 0, 0, Math.PI / 2 - 0.12); else B.at(x, y, z, o.yaw ?? rnd() * 6.28);
  const oy = o.tip ? -h / 2 : 0;
  B.part(new THREE.CylinderGeometry(rt, rb, h, 14, 1, true), c, 0, oy + h / 2, 0);
  B.cyl(rb, rb, 0.01, 14, c, 0, oy + 0.005, 0);
  B.cyl(rt - 0.008, rt - 0.008, 0.008, 14, o.inside ?? 0x1c2224, 0, oy + h - 0.03 * s, 0);     // 里面看下去的暗处
  B.torus(rt * 0.95, 0.006 * s, o.handle ?? 0x2a3133, 0, oy + h, 0, o.tip ? 0 : 0.5, 0, 0, Math.PI);
}

// ---- 椅子：四条腿、座面、靠背；tip 倒在地上（侧躺） ----
function chair(B, x, z, yaw, o = {}) {
  const c = o.col ?? 0x4b3f33, m = o.leg ?? 0x2f3436, y = o.y ?? groundY(x);
  if (o.tip) B.at(x, y + 0.21, z, yaw, Math.PI / 2 * 0.98, 0); else B.at(x, y, z, yaw);
  const oz = o.tip ? -0.2 : 0;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) B.box(0.03, 0.45, 0.03, m, sx * 0.19, 0.225, oz + sz * 0.18);
  B.box(0.44, 0.03, 0.42, c, 0, 0.46, oz);
  for (const sx of [-1, 1]) B.box(0.03, 0.46, 0.03, m, sx * 0.19, 0.69, oz - 0.18);
  B.box(0.42, 0.16, 0.02, c, 0, 0.84, oz - 0.19);
}

// ---- 轮胎：flat 平躺 / 竖着半埋在土里（bury 埋多深）/ stack 摞几只 ----
function tire(B, x, z, o = {}) {
  const c = o.col ?? 0x1e2122, R = (o.R ?? 0.3), r = R * 0.38, y = o.y ?? groundY(x);
  if (o.stand) { B.at(x, y + R + r - (o.bury ?? 0), z, o.yaw ?? 0); B.torus(R, r, c, 0, 0, 0, 0, 0, 0); B.cyl(R - r * 0.6, R - r * 0.6, r * 1.4, 14, o.hub ?? 0x15181a, 0, 0, 0, Math.PI / 2, 0, 0); return; }
  for (let k = 0; k < (o.stack ?? 1); k++) { B.at(x + rr(-0.05, 0.05), y + r + k * r * 1.9, z + rr(-0.05, 0.05), rnd() * 6.28, rr(-0.05, 0.05)); B.torus(R, r, c, 0, 0, 0, Math.PI / 2, 0, 0); }
}

// ---- 一段贴地的管道：几只矮支架托着，两头和中间有法兰；valve 中间装一只阀门手轮 ----
function pipeRun(B, x1, x2, z, h, r, o = {}) {
  const c = o.col ?? 0x3d474b, cs = o.stand ?? 0x2a3133, step = o.step ?? 2.2;
  const xs = []; for (let x = x1 + (o.dive ? 0.9 : 0.3); x < x2 - (o.dive ? 0.7 : 0.2); x += step) xs.push(x);
  const yA = groundY(x1) + h, yB = groundY(x2) + h, e = o.dive ? Math.min(0.16, h * 0.6) : 0;
  B.at(0, 0, 0).rod([x1 + e, yA, z], [x2 - e, yB, z], r, c, 12);
  if (o.dive) for (const [x, s] of [[x1, 1], [x2, -1]]) {        // 两头拐个弯钻进地里，地面上一圈法兰
    const y = groundY(x); B.at(x + s * e, y, z).torus(e, r, c, 0, h - e, 0, 0, 0, s > 0 ? Math.PI / 2 : 0, Math.PI / 2, 8);
    B.at(x, y, z); B.cyl(r, r, h - e + 0.05, 12, c, 0, (h - e) / 2 - 0.025, 0); B.cyl(r * 1.7, r * 1.8, 0.04, 12, cs, 0, 0.02, 0);
  }
  for (const x of xs) { const y = groundY(x); B.at(x, y, z); B.box(0.08, h - r * 0.6, 0.08, cs, 0, (h - r * 0.6) / 2, 0); B.box(0.3, 0.03, 0.2, cs, 0, 0.015, 0); B.torus(r + 0.004, 0.012, cs, 0, h, 0, 0, Math.PI / 2, 0); }
  for (const x of o.dive ? [(x1 + x2) / 2] : [x1 + 0.05, (x1 + x2) / 2, x2 - 0.05]) { const y = lerp(yA, yB, (x - x1) / (x2 - x1)); B.at(x, y, z).cyl(r * 1.5, r * 1.5, 0.05, 12, cs, 0, 0, 0, 0, 0, Math.PI / 2); }
  if (o.valve) { const x = o.valve, y = lerp(yA, yB, (x - x1) / (x2 - x1)); B.at(x, y, z); B.cyl(r * 1.3, r * 1.3, 0.14, 10, cs, 0, 0, 0, 0, 0, Math.PI / 2); B.box(0.03, 0.22, 0.03, cs, 0, 0.12, 0); B.torus(0.11, 0.012, o.wheel ?? 0x7a3a2a, 0, 0.24, 0, Math.PI / 2, 0, 0); B.box(0.2, 0.012, 0.012, o.wheel ?? 0x7a3a2a, 0, 0.24, 0); B.box(0.012, 0.012, 0.2, o.wheel ?? 0x7a3a2a, 0, 0.24, 0); }
}

// ---- 黑色的垃圾袋：鼓鼓囊囊的一包，顶上扎着口；n 只堆在一起 ----
function bags(B, x, z, n, o = {}) {
  const cols = o.cols ?? [0x1b1f21, 0x22282b, 0x2b3236];
  for (let i = 0; i < n; i++) {
    const s = rr(0.2, 0.3), xx = x + rr(-0.45, 0.45), zz = z + rr(-0.3, 0.3), y = groundY(xx) + (i > 2 ? 0.3 : 0), c = pick(cols);
    B.at(xx, y, zz, rnd() * 6.28, rr(-0.2, 0.2), rr(-0.2, 0.2)); B.ball(s, c, 0, s * 0.72, 0, [1.05, 0.82, 0.92]); B.ball(s * 0.2, c, 0, s * 1.4, 0, [0.8, 1.3, 0.8], 0);
  }
}

// ---- 铁皮水壶（方形的油壶）----
function jerrycan(B, x, z, yaw, o = {}) {
  const c = o.col ?? 0x5a6b4a, y = o.y ?? groundY(x);
  if (o.tip) B.at(x, y + 0.085, z, yaw, Math.PI / 2, 0); else B.at(x, y, z, yaw);
  const oz = o.tip ? -0.22 : 0;
  B.box(0.34, 0.45, 0.17, c, 0, 0.225, oz); B.box(0.3, 0.02, 0.19, c, 0, 0.3, oz);
  for (const sx of [-0.1, 0, 0.1]) B.box(0.025, 0.07, 0.03, c, sx, 0.48, oz); B.box(0.24, 0.025, 0.03, c, 0, 0.51, oz);
  B.cyl(0.03, 0.03, 0.06, 8, o.cap ?? 0x2b2f2a, 0.13, 0.47, oz, 0, 0, -0.5);
}

// ---- 交通锥 ----
function trafficCone(B, x, z, o = {}) {
  const c = o.col ?? 0xc0562a, y = o.y ?? groundY(x);
  if (o.tip) B.at(x, y + 0.1, z, o.yaw ?? 0, 0, Math.PI / 2 - 0.2); else B.at(x, y, z, rnd() * 6.28);
  B.box(0.34, 0.03, 0.34, 0x1e2223, 0, 0.015, 0);
  B.cyl(0.03, 0.14, 0.5, 12, c, 0, 0.28, 0); B.cyl(0.075, 0.098, 0.08, 12, o.band ?? 0xd8dad2, 0, 0.3, 0);
}

// ---- 沙袋：一排一排垒起来 ----
function sandbags(B, x, z, n, rows, yaw = 0, o = {}) {
  const c = o.col ?? 0x8a7d62, y = groundY(x);
  for (let r = 0; r < rows; r++) for (let i = 0; i < n - r; i++) {
    B.at(x, y, z, yaw); B.part(new THREE.CapsuleGeometry(0.11, 0.32, 3, 8), c, (i - (n - r - 1) / 2) * 0.52 + rr(-0.03, 0.03), 0.1 + r * 0.17, rr(-0.04, 0.04), 0, rr(-0.1, 0.1), Math.PI / 2, [1, 1, 0.75]);
  }
}

// ---- 打碎的水泥块，露着几根钢筋 ----
const CHUNK_GEOS = [];
function chunk(B, x, z, s, o = {}) {
  if (!CHUNK_GEOS.length) for (let i = 0; i < 4; i++) CHUNK_GEOS.push(rockGeo(37 + i * 11, { detail: 0, amp: 0.3, flat: 0.62, moss: 0, col: 0xffffff }));
  const y = groundY(x) - s * 0.12, c = o.col ?? 0x7d7b74;
  B.at(x, y, z, rnd() * 6.28); B.part(pick(CHUNK_GEOS).clone(), c, 0, s * 0.45, 0, rr(-0.2, 0.2), 0, rr(-0.2, 0.2), [s * rr(1, 1.4), s, s * rr(0.8, 1.1)]);
  if (o.rebar !== false) for (let i = 0, n = 1 + Math.floor(rnd() * 3); i < n; i++) { const a = rnd() * 6.28, L = rr(0.25, 0.7) * s / 0.3; B.rod([Math.cos(a) * s * 0.4, s * 0.55, Math.sin(a) * s * 0.3], [Math.cos(a) * (s * 0.4 + L * 0.7), s * 0.55 + rr(0.05, 0.45) * L, Math.sin(a) * (s * 0.3 + L * 0.4)], 0.009, o.bar ?? 0x5a3e30, 4); }
}

// ---- 一摞木条 / 钢管（横着堆在地上）----
function stickPile(B, x, z, n, len, r, hex, yaw = 0) {
  const y = groundY(x);
  for (let i = 0; i < n; i++) { const row = i < n * 0.6 ? 0 : 1, k = row ? i - Math.ceil(n * 0.6) : i; B.at(x + rr(-0.15, 0.15), y, z, yaw + rr(-0.05, 0.05)); B.cyl(r, r, len * rr(0.85, 1), 8, hex, 0, r + row * r * 1.8, (k - (row ? n * 0.2 : n * 0.3)) * r * 2.05, 0, 0, Math.PI / 2); }
}

// ---- 地沟的铁箅子：黑洞洞的一格，上面是一根根铁条 ----
function grate(B, x, z, w, d, yaw = 0, o = {}) {
  const c = o.col ?? 0x2b3134, y = groundY(x);
  B.at(x, y, z, yaw);
  B.box(w, 0.006, d, o.hole ?? 0x07090a, 0, 0.003, 0);
  for (const s of [-1, 1]) { B.box(w + 0.06, 0.02, 0.03, c, 0, 0.01, s * (d / 2 + 0.015)); B.box(0.03, 0.02, d, c, s * (w / 2 + 0.015), 0.01, 0); }
  for (let i = 1; i < Math.round(w / 0.07); i++) B.box(0.018, 0.016, d, c, -w / 2 + i * w / Math.round(w / 0.07), 0.012, 0);
}

// ---- 工具推车：两层铁架、四只小轮、一个把手，上面放着工具箱 ----
function toolCart(B, x, z, yaw, o = {}) {
  const c = o.col ?? 0x3b4448, y = groundY(x);
  B.at(x, y, z, yaw);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { B.box(0.03, 0.82, 0.03, c, sx * 0.38, 0.49, sz * 0.22); B.cyl(0.04, 0.04, 0.03, 8, 0x111416, sx * 0.38, 0.04, sz * 0.22, Math.PI / 2, 0, 0); }
  for (const yy of [0.22, 0.86]) B.box(0.82, 0.03, 0.5, c, 0, yy, 0);
  B.rod([-0.42, 0.86, -0.2], [-0.52, 1.0, -0.2], 0.012, c); B.rod([-0.42, 0.86, 0.2], [-0.52, 1.0, 0.2], 0.012, c); B.rod([-0.52, 1.0, -0.2], [-0.52, 1.0, 0.2], 0.014, c);
  B.box(0.4, 0.16, 0.2, o.box ?? 0x7a3a2a, 0.12, 0.96, 0); B.box(0.3, 0.03, 0.06, 0x222628, 0.12, 1.05, 0);
  B.box(0.3, 0.12, 0.25, o.box2 ?? 0x5a4a38, -0.15, 0.3, 0.02); B.box(0.22, 0.02, 0.04, 0x8a8a84, 0.2, 0.25, 0.1, 0, 0.5, 0);
}

// ---- 几只钢瓶（立着，用一根链子拴着）----
function cylinders(B, x, z, n, o = {}) {
  const y = groundY(x), cols = o.cols ?? [0x3e5458, 0x5a4a3a, 0x3a3f42];
  for (let i = 0; i < n; i++) { const xx = x + (i - (n - 1) / 2) * 0.27, c = pick(cols); B.at(xx, y, z + rr(-0.03, 0.03), rnd() * 6.28, rr(-0.03, 0.03)); B.cyl(0.11, 0.11, 1.2, 12, c, 0, 0.6, 0); B.part(new THREE.SphereGeometry(0.11, 12, 6, 0, 6.28, 0, Math.PI / 2), c, 0, 1.2, 0); B.cyl(0.03, 0.03, 0.12, 8, 0x8a8478, 0, 1.33, 0); }
  B.at(x, y, z).box(n * 0.27, 0.02, 0.02, 0x262a2c, 0, 0.85, 0.12);
}

// ---- 一卷电缆盘（木头的大线轴）----
function reel(B, x, z, R, yaw = 0, o = {}) {
  const c = o.col ?? 0x6b5a44, w = R * 0.8, y = groundY(x);
  B.at(x, y + R, z, yaw);
  for (const s of [-1, 1]) B.cyl(R, R, 0.05, 18, c, 0, 0, s * w / 2, Math.PI / 2, 0, 0);
  B.cyl(R * 0.75, R * 0.75, w - 0.04, 18, o.wire ?? 0x1c1f20, 0, 0, 0, Math.PI / 2, 0, 0);
  B.cyl(R * 0.2, R * 0.2, w + 0.12, 10, c, 0, 0, 0, Math.PI / 2, 0, 0);
}

// ---- 街上的：隔离桩、排队用的伸缩带立柱、塑料周转箱、自行车 ----
function bollard(B, x, z, o = {}) {
  const c = o.col ?? 0x3f4446, y = groundY(x);
  B.at(x, y, z); B.cyl(0.085, 0.095, 0.82, 12, c, 0, 0.41, 0); B.part(new THREE.SphereGeometry(0.085, 12, 6, 0, 6.28, 0, Math.PI / 2), c, 0, 0.82, 0); B.cyl(0.088, 0.088, 0.07, 12, o.band ?? 0xc9ccc4, 0, 0.66, 0);
}
// 一排立柱，柱子之间拉着带子（带子微微往下垂）；broken：其中一根倒在地上，带子拖在地上
function stanchions(B, x1, x2, z, n, o = {}) {
  const c = o.col ?? 0x55595a, belt = o.belt ?? 0x8a3a30, H = 0.92, pts = [];
  for (let i = 0; i < n; i++) {
    const x = lerp(x1, x2, i / (n - 1)), y = groundY(x), down = o.broken === i;
    if (down) {                                            // 倒在地上的那根：柱头倒向 yaw 那边，带子跟着拖到地上
      const yw = o.yaw ?? 0.4, rl = Math.PI / 2 - 0.05; B.at(x, y + 0.03, z, yw, 0, rl); B.cyl(0.026, 0.026, H, 8, c, 0, H / 2, 0); B.cyl(0.17, 0.17, 0.03, 14, c, 0, 0.015, 0);
      const hx = -H * Math.sin(rl); pts.push([x + hx * Math.cos(yw), y + 0.03 + H * Math.cos(rl), z - hx * Math.sin(yw)]); continue;
    }
    B.at(x, y, z); B.cyl(0.17, 0.18, 0.03, 14, c, 0, 0.015, 0); B.cyl(0.026, 0.026, H, 8, c, 0, H / 2, 0); B.cyl(0.04, 0.04, 0.07, 8, c, 0, H, 0);
    pts.push([x, y + H - 0.04, z]);
  }
  for (let i = 1; i < pts.length; i++) {
    if (o.broken === i - 1) {                              // 倒下的那根后面：带子脱了钩，从下一根柱子上垂下来一截
      const [bx_, by, bz] = pts[i]; B.at(0, 0, 0).part(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(V3(bx_, by, bz), V3(bx_ - 0.12, by - 0.35, bz), V3(bx_ - 0.1, by - 0.6, bz + 0.02)), 8, 0.022, 3), belt, 0, 0, 0, 0, 0, 0, [1, 1, 0.35]);
      continue;
    }
    const [ax, ay, az] = pts[i - 1], [bx_, by, bz] = pts[i], sag = (ay > 0.5 && by > 0.5) ? 0.06 : 0, m = [(ax + bx_) / 2, Math.max(0.03, (ay + by) / 2 - sag - (ay < 0.5 || by < 0.5 ? 0.25 : 0)), (az + bz) / 2];
    B.at(0, 0, 0).part(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(V3(ax, ay, az), V3(...m), V3(bx_, by, bz)), 10, 0.022, 3), belt, 0, 0, 0, 0, 0, 0, [1, 1, 0.35]);
  }
}
// 塑料周转箱：四面有一排排长方孔（画成深色的横条），n 只摞起来
function crates(B, x, z, n, o = {}) {
  const c = o.col ?? 0x5a6f7a, w = 0.6, h = 0.32, d = 0.4, y0 = groundY(x);
  for (let k = 0; k < n; k++) {
    B.at(x + rr(-0.04, 0.04), y0 + k * (h - 0.02), z + rr(-0.03, 0.03), (o.yaw ?? 0) + rr(-0.08, 0.08));
    B.box(w, h, d, c, 0, h / 2, 0);
    for (const yy of [0.12, 0.22]) for (const s of [-1, 1]) B.box(w * 0.82, 0.045, 0.004, o.hole ?? 0x22292c, 0, yy, s * (d / 2 + 0.002));
    B.box(0.14, 0.04, 0.004, 0x1a1f21, 0, h - 0.06, d / 2 + 0.003);
  }
}
// 自行车：两只轮子、三角车架、车把、座子，用脚撑立着（稍微歪一点）
function bike(B, x, z, yaw = 0, o = {}) {
  const c = o.col ?? 0x2f3a3f, t = 0x141718, y = groundY(x), R = 0.33;
  B.at(x, y, z, yaw, 0, 0.12);
  for (const sx of [-0.52, 0.52]) { B.torus(R, 0.022, t, sx, R, 0, 0, 0, 0, 6.2832, 20); B.cyl(0.03, 0.03, 0.06, 8, c, sx, R, 0, Math.PI / 2, 0, 0); }
  const P_ = { rw: [-0.52, R, 0], fw: [0.52, R, 0], bb: [-0.05, R - 0.02, 0], st: [-0.2, R + 0.5, 0], hd: [0.38, R + 0.5, 0] };
  for (const [a, b] of [['rw', 'bb'], ['bb', 'st'], ['st', 'rw'], ['st', 'hd'], ['bb', 'hd'], ['hd', 'fw']]) B.rod(P_[a], P_[b], 0.017, c);
  B.rod([-0.2, R + 0.5, 0], [-0.24, R + 0.62, 0], 0.016, c); B.box(0.22, 0.04, 0.09, t, -0.25, R + 0.64, 0);
  B.rod([0.38, R + 0.5, 0], [0.34, R + 0.66, 0], 0.016, c); B.rod([0.34, R + 0.66, -0.22], [0.34, R + 0.66, 0.22], 0.014, c);
  B.rod([-0.05, R - 0.02, 0.03], [-0.15, 0.0, 0.22], 0.012, c);
}
// 一只倒着的板凳 / 小方凳
function stool(B, x, z, yaw, o = {}) {
  const c = o.col ?? 0x5c4833, y = groundY(x);
  if (o.tip) B.at(x, y + 0.16, z, yaw, 0, Math.PI / 2); else B.at(x, y, z, yaw);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) B.box(0.035, 0.42, 0.035, c, sx * 0.13, 0.21, sz * 0.13);
  B.box(0.34, 0.035, 0.34, c, 0, 0.43, 0); B.box(0.28, 0.025, 0.025, c, 0, 0.14, 0.13); B.box(0.28, 0.025, 0.025, c, 0, 0.14, -0.13);
}

// ---- 废料场、维修巷、居民街上的 ----
// 一台旧洗衣机（方盒子 + 前面一圈圆门）；tip 侧躺着
function washer(B, x, z, yaw, o = {}) {
  const c = o.col ?? 0xa8a89c, y = groundY(x);
  if (o.tip) B.at(x, y + 0.3, z, yaw, 0, Math.PI / 2); else B.at(x, y, z, yaw, rr(-0.04, 0.04));
  const oy = o.tip ? -0.42 : 0;
  B.box(0.6, 0.84, 0.58, c, 0, oy + 0.42, 0); B.box(0.6, 0.1, 0.58, o.top ?? 0x8a8a80, 0, oy + 0.79, 0);
  B.torus(0.17, 0.035, 0x3a3e40, 0, oy + 0.42, 0.29, 0, 0, 0); B.cyl(0.15, 0.15, 0.02, 16, 0x1e2426, 0, oy + 0.42, 0.29, Math.PI / 2, 0, 0);
}
// 一扇拆下来的车门：外板 + 窗框，斜靠着（lean 往后倒多少）或者平躺
function carDoor(B, x, z, yaw, o = {}) {
  const c = o.col ?? 0x5a6a72, y = groundY(x), lean = o.flat ? Math.PI / 2 - 0.02 : (o.lean ?? 0.35);
  B.at(x, y, z, yaw, -lean, 0);
  B.box(1.05, 0.62, 0.06, c, 0, 0.31, 0); B.box(1.0, 0.04, 0.07, 0x2c3236, 0, 0.6, 0);
  for (const [a, b] of [[[-0.48, 0.62, 0], [-0.4, 1.05, 0]], [[-0.4, 1.05, 0], [0.32, 1.05, 0]], [[0.32, 1.05, 0], [0.5, 0.62, 0]]]) B.rod(a, b, 0.025, 0x2c3236, 5);
  B.box(0.16, 0.035, 0.05, 0x8a8a84, 0.32, 0.45, 0.04);
}
// 一根弯过的旧管子（躺在地上）
function bentPipe(B, x, z, len, r, yaw, hex) {
  const y = groundY(x) + r, a = rr(0.4, 0.9);
  B.at(x, y, z, yaw).tube([[-len / 2, 0, 0], [0, 0, 0], [Math.cos(a) * len * 0.45, 0, Math.sin(a) * len * 0.45]], r, hex, 12, 8);
}
// 一张工作台：桌面、四条腿、下层隔板，桌上一只台钳和几件工具
function workbench(B, x, z, yaw, o = {}) {
  const c = o.col ?? 0x5c4833, m = o.leg ?? 0x2f3436, y = groundY(x);
  B.at(x, y, z, yaw);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) B.box(0.05, 0.86, 0.05, m, sx * 0.72, 0.43, sz * 0.28);
  B.box(1.6, 0.05, 0.7, c, 0, 0.88, 0); B.box(1.5, 0.03, 0.6, c, 0, 0.2, 0);
  B.box(0.16, 0.12, 0.14, 0x3a4448, 0.55, 0.96, 0.22); B.box(0.05, 0.04, 0.22, 0x3a4448, 0.55, 0.98, 0.34);
  B.box(0.3, 0.02, 0.04, 0x8a8a84, -0.2, 0.915, 0.1, 0, 0.4, 0); B.box(0.24, 0.025, 0.05, 0x7a3a2a, -0.45, 0.915, -0.1, 0, -0.3, 0);
  B.box(0.4, 0.16, 0.25, o.box ?? 0x5a4a38, -0.3, 0.3, 0); B.box(0.3, 0.2, 0.2, 0x3e4a4e, 0.35, 0.32, 0.05);
}
// 一只敞口的零件箱：木箱里堆着管头、齿轮、方块
function partsBin(B, x, z, yaw, o = {}) {
  const c = o.col ?? 0x5c4833, y = groundY(x), w = o.w ?? 0.8, d = 0.55, h = 0.42;
  B.at(x, y, z, yaw);
  for (const s of [-1, 1]) { B.box(w, h, 0.03, c, 0, h / 2, s * d / 2); B.box(0.03, h, d, c, s * w / 2, h / 2, 0); }
  B.box(w, 0.03, d, c, 0, 0.015, 0);
  const cols = o.parts ?? [0x4a5458, 0x6a4a36, 0x3a3f42, 0x7a7a70];
  for (let i = 0; i < 9; i++) { const px_ = rr(-w * 0.4, w * 0.4), pz = rr(-d * 0.35, d * 0.35), py = h - rr(0.02, 0.12); const k = rnd(); if (k < 0.35) B.cyl(0.04, 0.04, rr(0.15, 0.3), 8, pick(cols), px_, py, pz, rr(0, 1.5), rr(0, 3), rr(0, 1.5)); else if (k < 0.65) B.torus(0.06, 0.02, pick(cols), px_, py, pz, rr(0, 3), rr(0, 3), 0, 6.28, 10); else B.box(rr(0.06, 0.14), rr(0.06, 0.12), rr(0.06, 0.14), pick(cols), px_, py, pz, 0, rr(0, 3), 0); }
}
// 一只宽口的洗衣盆 / 水盆（里面有一点水，颜色浅一点）
function basin(B, x, z, o = {}) {
  const c = o.col ?? 0x6a7a80, y = groundY(x), r = o.r ?? 0.32;
  B.at(x, y, z, rnd() * 6.28); B.part(new THREE.CylinderGeometry(r, r * 0.8, 0.18, 18, 1, true), c, 0, 0.09, 0); B.cyl(r * 0.8, r * 0.8, 0.01, 18, c, 0, 0.005, 0);
  B.torus(r, 0.015, c, 0, 0.18, 0, Math.PI / 2, 0, 0, 6.2832, 18);
  if (o.water !== false) B.cyl(r * 0.92, r * 0.92, 0.008, 18, o.water ?? 0x8aa4aa, 0, 0.13, 0);
}
// 花盆：盆、土、一棵小苗（几团叶子）；dead 枯了（只剩一根杆）
function pot(B, x, z, o = {}) {
  const c = o.col ?? 0x8a5a3e, y = groundY(x), s = o.s ?? 1;
  B.at(x, y, z, rnd() * 6.28); B.cyl(0.14 * s, 0.1 * s, 0.24 * s, 12, c, 0, 0.12 * s, 0); B.cyl(0.15 * s, 0.15 * s, 0.035 * s, 12, c, 0, 0.235 * s, 0); B.cyl(0.13 * s, 0.13 * s, 0.01, 12, 0x2e261e, 0, 0.245 * s, 0);
  if (o.dead) { B.rod([0, 0.24 * s, 0], [0.03, 0.55 * s, 0.02], 0.008, 0x5a4a38); return; }
  B.rod([0, 0.24 * s, 0], [0, (0.3 + (o.h ?? 0.25)) * s, 0], 0.01, 0x4a5a30);
  for (let i = 0; i < (o.n ?? 5); i++) B.ball(rr(0.05, 0.09) * s, pick(o.leaf ?? [0x4c6a38, 0x5f8040, 0x3e5a2e]), rr(-0.08, 0.08) * s, (0.32 + (o.h ?? 0.25) * rr(0.6, 1.1)) * s, rr(-0.08, 0.08) * s, [1, 0.8, 1], 0);
}
// 手推的两轮小车，车上绑着一只水桶
function handCart(B, x, z, yaw, o = {}) {
  const c = o.col ?? 0x3a4448, y = groundY(x);
  B.at(x, y, z, yaw, 0, -0.35);
  for (const sz of [-0.22, 0.22]) { B.rod([0, 0.08, sz], [0, 1.25, sz], 0.018, c); B.torus(0.12, 0.035, 0x161a1b, 0.05, 0.12, sz * 1.25, 0, 0, 0, 6.28, 12); }
  B.box(0.3, 0.025, 0.5, c, 0.13, 0.04, 0); B.rod([0, 1.25, -0.22], [0, 1.25, 0.22], 0.018, c);
  B.cyl(0.2, 0.2, 0.62, 14, o.drum ?? 0x4f6670, 0.2, 0.36, 0);
}

// ---- 野外的：石头、瓷瓶（电线杆上掉下来的绝缘子）、一卷铁丝、歪着的牌子、倒下的栅栏 ----
// 一块石头（烘进网格里；颜色来自 rockGeo 的顶点色：朝上的面带一点青苔）
function stone(B, x, z, s, o = {}) {
  const flat = o.flat ?? rr(0.55, 0.85), g = rockGeo(o.seed ?? Math.floor(rr(0, 9999)), { flat, col: o.col ?? 0x7a7468, mossCol: o.moss ?? 0x6a6a44, moss: o.mk ?? 0.6, detail: o.detail ?? (s < 0.2 ? 0 : 1) });   // 小石头用最粗的那一档，省三角形
  B.at(x, groundY(x) - s * flat * 0.3, z, rnd() * 6.28).part(g, 0xffffff, 0, 0, 0, 0, 0, 0, [s * rr(1, 1.3), s, s * rr(0.8, 1.05)]);
}
// 绝缘子：一串叠起来的瓷碟（白的，或者褐釉的），歪在草里
function insulator(B, x, z, o = {}) {
  const c = o.col ?? 0xd8d6cc, y = groundY(x), n = o.n ?? 3;
  B.at(x, y + 0.06, z, rnd() * 6.28, 0, Math.PI / 2 - rr(0, 0.3));
  for (let i = 0; i < n; i++) { B.cyl(0.07, 0.07, 0.025, 12, c, 0, i * 0.06, 0); B.cyl(0.035, 0.035, 0.06, 8, c, 0, i * 0.06 + 0.03, 0); }
}
// 一卷生锈的铁丝：几圈叠在一起的细环
function wireCoil(B, x, z, R = 0.3, o = {}) {
  const c = o.col ?? 0x4a3a2e, y = groundY(x);
  for (let i = 0; i < 5; i++) B.at(x + rr(-0.04, 0.04), y + 0.01 + i * 0.012, z + rr(-0.04, 0.04), rnd() * 6.28, rr(-0.12, 0.12), rr(-0.12, 0.12)).torus(R * rr(0.85, 1.05), 0.006, c, 0, 0, 0, Math.PI / 2, 0, 0, 6.2832, 20);
}
// 一块歪着的旧牌子：一根短桩，顶上钉着一块铁皮
function sign(B, x, z, yaw, o = {}) {
  const y = groundY(x); B.at(x, y, z, yaw, 0, o.tilt ?? 0.18);
  B.box(0.07, 1.1, 0.07, o.post ?? 0x4a3e32, 0, 0.55, 0); B.box(0.6, 0.42, 0.02, o.col ?? 0x8a5a3a, 0, 1.0, 0.045); B.box(0.5, 0.06, 0.022, o.band ?? 0xb8b0a0, 0, 1.06, 0.046);
}
// 倒下的一段栅栏：两根桩（一根还斜插在地里，一根倒在地上）、几道松垮的铁丝
function fallenFence(B, x, z, len, yaw = 0, o = {}) {
  const c = o.post ?? 0x5a4a3a, w = o.wire ?? 0x2e2a26, y = groundY(x);
  B.at(x, y, z, yaw, 0, -0.45); B.box(0.08, 1.2, 0.08, c, 0, 0.6, 0);
  const tx = len * 0.95; B.at(x + tx, groundY(x + tx) + 0.05, z, yaw, 0, Math.PI / 2 - 0.05); B.box(0.08, 1.2, 0.08, c, 0, -0.6, 0);
  const top = [x - Math.sin(0.45) * 1.15, y + Math.cos(0.45) * 1.15];
  for (const k of [0.45, 0.75, 1]) B.at(0, 0, 0).part(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(V3(x - Math.sin(0.45) * 1.15 * k, y + Math.cos(0.45) * 1.15 * k, z), V3(x + tx * 0.5, groundY(x + tx * 0.5) + 0.02, z + 0.25), V3(x + tx - 1.1 * k + 0.6, groundY(x + tx) + 0.06, z)), 14, 0.007, 4), w);
  return top;
}

// ---- 花园里的：独轮车、耙子、喷壶、标签牌、肥料袋、喷头、踏脚石、修成方块的小灌木 ----
function wheelbarrow(B, x, z, yaw, o = {}) {   // 独轮车：斜着的四面斗、里面一斗土，前面一只轮子，后面两根把手
  const c = o.col ?? 0x3a6a8a, y = groundY(x);
  B.at(x, y, z, yaw);
  B.box(0.66, 0.03, 0.46, c, 0, 0.36, 0);
  B.box(0.03, 0.32, 0.6, c, 0.42, 0.5, 0, 0, 0, -0.45); B.box(0.03, 0.3, 0.56, c, -0.38, 0.5, 0, 0, 0, 0.3);
  for (const s of [-1, 1]) B.box(0.86, 0.3, 0.03, c, 0.02, 0.5, s * 0.28, s * 0.3, 0, 0);
  B.box(0.8, 0.05, 0.5, o.soil ?? 0x4a3a2a, 0.02, 0.6, 0);
  B.torus(0.17, 0.045, 0x1c1e1e, 0.66, 0.18, 0, 0, 0, 0, 6.2832, 12); B.cyl(0.03, 0.03, 0.1, 8, 0x4a4a44, 0.66, 0.18, 0, Math.PI / 2, 0, 0);
  for (const s of [-1, 1]) { B.rod([0.66, 0.18, s * 0.05], [-0.95, 0.62, s * 0.27], 0.018, 0x4a4a44); B.rod([-0.25, 0.38, s * 0.22], [-0.3, 0, s * 0.24], 0.016, 0x4a4a44); }
}
function rake(B, x, z, yaw, o = {}) {   // 靠在什么上面：lean 往后倒多少
  const y = groundY(x); B.at(x, y, z, yaw, -(o.lean ?? 0.3), 0);
  B.box(0.03, 1.5, 0.03, o.col ?? 0x8a6a44, 0, 0.75, 0); B.box(0.42, 0.04, 0.04, 0x4a4e4a, 0, 1.5, 0); for (let i = 0; i < 9; i++) B.box(0.012, 0.09, 0.012, 0x4a4e4a, -0.19 + i * 0.0475, 1.46, 0.02);
}
function wateringCan(B, x, z, yaw, o = {}) {
  const c = o.col ?? 0x4f8a6a, y = groundY(x);
  if (o.tip) B.at(x, y + 0.13, z, yaw, 0, Math.PI / 2); else B.at(x, y, z, yaw);
  const oy = o.tip ? -0.14 : 0;
  B.cyl(0.13, 0.14, 0.28, 14, c, 0, oy + 0.14, 0); B.rod([0.1, oy + 0.08, 0], [0.38, oy + 0.32, 0], 0.018, c); B.cyl(0.035, 0.02, 0.05, 8, c, 0.39, oy + 0.33, 0, 0, 0, -0.9);
  B.torus(0.11, 0.014, c, -0.04, oy + 0.3, 0, 0, 0, 0, Math.PI, 10);
}
function stake(B, x, z, o = {}) {   // 插在土里的白色标签牌
  const y = groundY(x); B.at(x, y, z, rr(-0.1, 0.1), rr(-0.08, 0.08), rr(-0.08, 0.08)); B.box(0.015, 0.3, 0.01, o.col ?? 0xe8e8e0, 0, 0.15, 0); B.box(0.08, 0.06, 0.01, o.col ?? 0xe8e8e0, 0, 0.3, 0);
}
function sack(B, x, z, yaw, o = {}) {   // 一袋肥料 / 土：鼓鼓的软袋子立着（lie 平躺），口子折下来，正面一道色带
  const c = o.col ?? 0xd8d4c4, y = groundY(x); B.at(x, y, z, yaw, o.lie ? Math.PI / 2 - 0.08 : -0.12, 0);
  const oy = o.lie ? -0.13 : 0;
  B.box(0.42, 0.5, 0.2, c, 0, oy + 0.25, 0); B.ball(0.2, c, 0, oy + 0.06, 0, [1.05, 0.4, 0.55]); B.box(0.36, 0.08, 0.16, c, 0, oy + 0.52, -0.02, -0.5, 0, 0);
  B.box(0.43, 0.09, 0.205, o.band ?? 0x4a8a4a, 0, oy + 0.3, 0);
}
function sprinkler(B, x, z, o = {}) {   // 草坪上冒出来的一只喷头
  const y = groundY(x); B.at(x, y, z); B.cyl(0.05, 0.06, 0.06, 10, o.col ?? 0x2a2e2c, 0, 0.03, 0); B.cyl(0.025, 0.025, 0.05, 8, 0x8a8e88, 0, 0.08, 0);
}
function steppingStone(B, x, z, s = 0.28, o = {}) {
  const y = groundY(x); B.at(x, y, z, rnd() * 6.28); B.part(new THREE.CylinderGeometry(s, s * 1.04, 0.05, 9), o.col ?? 0xb8b2a2, 0, 0.012, 0, 0, 0, 0, [1, 1, rr(0.75, 0.95)]);
}
function boxHedge(B, x, z, w = 0.55, h = 0.45, o = {}) {   // 修剪成一个方墩的小灌木：一团团叶子挤在一起，顶上剪平了、向着太阳的那一面亮
  const y = groundY(x), c = o.col ?? 0x3c7a3e, c2 = o.col2 ?? 0x4f8a44;
  B.at(x, y, z, rr(-0.1, 0.1));
  for (let i = 0; i < 9; i++) { const r = rr(0.14, 0.2); B.ball(r, rnd() < 0.5 ? c : c2, rr(-w / 2 + r * 0.7, w / 2 - r * 0.7), rr(r * 0.8, h - r * 0.9), rr(-w / 2 + r * 0.7, w / 2 - r * 0.7), 1, 0); }
  B.box(w * 0.92, 0.05, w * 0.92, o.top ?? 0x8ab858, 0, h - 0.04, 0);
}
// 一段还立着的旧栅栏：几根歪歪斜斜的木桩，三道往下垂的铁丝；broken 那一跨断了，铁丝垂到地上
function oldFence(B, x1, x2, z, o = {}) {
  const c = o.post ?? 0x5a4a3a, w = o.wire ?? 0x2e2a26, n = Math.max(2, Math.round((x2 - x1) / (o.step ?? 2.3)) + 1), tops = [];
  for (let i = 0; i < n; i++) {
    const x = lerp(x1, x2, i / (n - 1)) + rr(-0.2, 0.2), y = groundY(x), h = rr(1.0, 1.25), lz = rr(-0.22, 0.22), lx = rr(-0.08, 0.08);
    B.at(x, y - 0.1, z + rr(-0.08, 0.08), 0, lx, lz); B.box(0.08, h + 0.1, 0.08, c, 0, (h + 0.1) / 2, 0);
    tops.push([x - Math.sin(lz) * h, y - 0.1 + Math.cos(lz) * h, z + Math.sin(lx) * h, h]);
  }
  for (let i = 1; i < tops.length; i++) for (const k of [0.45, 0.72, 0.96]) {
    const [ax, ay, az] = tops[i - 1], [bx_, by, bz] = tops[i], ya = groundY(ax) + (ay - groundY(ax)) * k, yb = groundY(bx_) + (by - groundY(bx_)) * k;
    if (o.broken === i) { B.at(0, 0, 0).part(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(V3(ax, ya, az), V3(ax + 0.35, ya - 0.5, az + 0.1), V3(ax + 0.9 + k * 0.4, groundY(ax + 1) + 0.02, az + 0.25)), 10, 0.007, 4), w); continue; }
    B.at(0, 0, 0).part(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(V3(ax, ya, az), V3((ax + bx_) / 2, (ya + yb) / 2 - 0.12, (az + bz) / 2), V3(bx_, yb, bz)), 12, 0.007, 4), w);
  }
}

// ---- 中枢里的：育苗盘小推车、样品罐、走线槽 ----
// 一辆矮推车，两层托着育苗盘，盘里一格一格冒着小苗（中枢里唯一的绿）
function seedCart(B, x, z, yaw, o = {}) {
  const c = o.col ?? 0x3a4a52, y = groundY(x), g = o.green ?? [0x7aaa58, 0x8aba62, 0x6a9a4a];
  B.at(x, y, z, yaw);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { B.box(0.03, 0.72, 0.03, c, sx * 0.48, 0.42, sz * 0.24); B.cyl(0.035, 0.035, 0.03, 8, 0x111416, sx * 0.48, 0.035, sz * 0.24, Math.PI / 2, 0, 0); }
  for (const yy of [0.3, 0.74]) { B.box(1.0, 0.03, 0.52, c, 0, yy, 0); B.box(0.96, 0.06, 0.46, o.tray ?? 0x2a3236, 0, yy + 0.045, 0);
    for (let i = 0; i < 8; i++) for (let k = 0; k < 4; k++) if (rnd() < 0.85) { const h = rr(0.04, 0.1), px_ = -0.42 + i * 0.12, pz = -0.16 + k * 0.107; B.box(0.008, h, 0.008, 0x4a6a3a, px_, yy + 0.075 + h / 2, pz); B.ball(rr(0.028, 0.04), pick(g), px_, yy + 0.075 + h, pz, [1.3, 0.6, 1.1], 0); } }
  B.box(0.9, 0.02, 0.06, o.lamp ?? 0xd8d0e8, 0, 0.71, 0.18);                    // 上层隔板底下的一根补光灯管
}
// 一排样品罐：玻璃罐（浅色、半透的样子画成浅灰绿）、黑盖子
function jars(B, x, z, n, o = {}) {
  const y = groundY(x) + (o.y ?? 0);
  for (let i = 0; i < n; i++) { const xx = x + (i - (n - 1) / 2) * 0.13; B.at(xx, y, z + rr(-0.02, 0.02)); B.cyl(0.05, 0.05, 0.16, 10, o.col ?? 0x7a9a96, 0, 0.08, 0); B.cyl(0.052, 0.052, 0.03, 10, 0x1a2024, 0, 0.175, 0); }
}
// 贴着地面的一段走线槽：方的盒子，隔一段一个接线盒
function conduit(B, x1, x2, z, o = {}) {
  const c = o.col ?? 0x2e3a42, y = groundY(x1);
  B.at((x1 + x2) / 2, y, z).box(x2 - x1, 0.09, 0.16, c, 0, 0.045, 0);
  for (let x = x1 + 0.6; x < x2 - 0.3; x += o.step ?? 2.6) B.at(x, y, z).box(0.26, 0.2, 0.22, o.box ?? 0x3e4c56, 0, 0.1, 0);
}

// ---- 山洞里的：石笋、一盘旧绳子、熄了的旧马灯、倒在地上的木支架 ----
function stalagmite(B, x, z, h, o = {}) {   // 石笋：几块越往上越细的疙瘩石头摞成一根，顶上一个尖
  const c = o.col ?? 0x55595a, y = groundY(x) - 0.04, r = h * rr(0.2, 0.28), n = 2 + Math.round(h * 2.2);
  B.at(x, y, z, rnd() * 6.28, rr(-0.05, 0.05), rr(-0.05, 0.05));
  for (let i = 0; i < n; i++) { const t = i / n, rk = r * (1 - t * 0.75), hk = h / n * 1.5; B.part(rockGeo(Math.floor(rr(0, 9999)), { detail: 0, amp: 0.28, flat: 1, moss: 0, col: 0xffffff }), c, rr(-0.02, 0.02) * h, t * h * 0.92 + hk * 0.35, rr(-0.02, 0.02) * h, 0, rnd() * 6.28, 0, [rk, hk * 0.62, rk]); }
  B.part(new THREE.ConeGeometry(r * 0.3, h * 0.22, 6), c, 0, h * 0.98, 0);
  if (rnd() < 0.5) B.part(rockGeo(7, { detail: 0, amp: 0.3, flat: 0.8, moss: 0, col: 0xffffff }), c, r * 1.3, r * 0.4, rr(-0.1, 0.1), 0, rnd() * 6.28, 0, [r * 0.7, r * 0.6, r * 0.7]);
}
function ropeCoil(B, x, z, o = {}) {
  const c = o.col ?? 0x8a7a58, y = groundY(x);
  for (let i = 0; i < 4; i++) B.at(x + rr(-0.03, 0.03), y + 0.015 + i * 0.022, z + rr(-0.03, 0.03), rnd() * 6.28).torus(0.2 - i * 0.01, 0.018, c, 0, 0, 0, Math.PI / 2, 0, 0, 6.2832, 16);
  B.at(0, 0, 0).tube([[x + 0.2, y + 0.02, z], [x + 0.5, y + 0.02, z + 0.15], [x + 0.85, y + 0.02, z + 0.05]], 0.016, c, 8, 5);
}
function lantern(B, x, z, o = {}) {
  const y = groundY(x), c = o.col ?? 0x4a3e32;
  if (o.tip) B.at(x, y + 0.08, z, rnd() * 6.28, 0, Math.PI / 2); else B.at(x, y, z, rnd() * 6.28);
  B.cyl(0.08, 0.09, 0.04, 10, c, 0, 0.02, 0); B.cyl(0.06, 0.07, 0.15, 10, o.glass ?? 0x6a6458, 0, 0.115, 0); B.cyl(0.05, 0.08, 0.05, 10, c, 0, 0.215, 0);
  B.torus(0.07, 0.008, c, 0, 0.26, 0, 0, 0, 0, Math.PI, 8);
}
function timber(B, x, z, len, yaw, o = {}) {
  const y = groundY(x); B.at(x, y + 0.09, z, yaw, 0, o.tilt ?? 0).box(len, 0.18, 0.18, o.col ?? 0x4e3e2e, 0, 0, 0);
}
