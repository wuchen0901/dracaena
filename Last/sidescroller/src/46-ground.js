
// ============================================================
//  地上的东西：石头、落叶、草丛和蕨、树枝和倒木、泥、水洼，还有会被吓跑的小动物
//  各章节搭建时调用这里的函数，把东西摆到自己那一段地面上；东西挂在调用时给的节点（或当前的 ROOT）下面，章节卸载时一起释放。
//  会动的那些（飘落的叶子、水洼里的倒影和水圈、青蛙、蜥蜴、虫子）收在 groundLife() 里，章节每帧调一次它的 step(dt)
// ============================================================
// 换一颗种子跑一段，再换回来：这里的形状不跟着章节里别的随机数变，章节原有的布景也不会因为多摆了这些东西而变样
function withSeed(seed, fn) { const s0 = _seed; _seed = seed; try { return fn(); } finally { _seed = s0; } }

// 贴着地面的一层画：draw(g) 里 x 是世界 x，y 是世界 z（画布上方是远处）。它跟着地形起伏，受灯光、接得住影子。
// o: order 绘制次序（要排在立在它上面的板子之前）/ lift 离地多高 / fadeL、fadeR 两端渐隐多少米 / opacity
function groundDecal(x1, x2, z1, z2, ppm, draw, o = {}) {
  const W = (x2 - x1) * ppm, D = (z2 - z1) * ppm, k = Math.min(1, 4096 / W, 4096 / D), s = ppm * k, [c, g] = mkCanvas(Math.round(W * k), Math.round(D * k));
  const place = () => g.setTransform(s, 0, 0, s, -x1 * s, -z1 * s);
  place(); g.lineCap = 'round'; draw(g);
  place(); if ('filter' in g) g.filter = 'none'; g.globalAlpha = 1; g.globalCompositeOperation = 'destination-out';
  for (const [w, a, b] of [[o.fadeL, x1, 1], [o.fadeR, x2, -1]]) if (w) {
    const gr = g.createLinearGradient(a, 0, a + b * w, 0); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(Math.min(a, a + b * w), z1, w, z2 - z1);
  }
  const tex = canvasTex(c), mat = new THREE.MeshLambertMaterial({ map: tex, transparent: true, depthWrite: false, opacity: o.opacity ?? 1 }); mat.userData.own = true;
  const m = new THREE.Mesh(groundGeo(x1, x2, z1, z2, o.lift ?? 0.008), mat); m.receiveShadow = true; m.renderOrder = o.order ?? -30; (o.parent ?? ROOT).add(m); renderer.initTexture(tex); return m;
}
// 一块贴着地面、跟着地形起伏的面：在地形的每个折点切一刀。uv 和画布对得上（画布上方 = 远处 = z1）
function groundGeo(x1, x2, z1, z2, lift) {
  const xs = [x1]; for (const [tx] of TERRAIN) if (tx > x1 + 0.02 && tx < x2 - 0.02) xs.push(tx); xs.push(x2);
  const pos = [], uv = [];
  for (let i = 1; i < xs.length; i++) {
    const a = xs[i - 1], b = xs[i]; if (b - a < 0.05) continue;                                                      // 坑壁那样的陡坎不铺
    const ya = groundY(a + 1e-3) + lift, yb = groundY(b - 1e-3) + lift, ua = (a - x1) / (x2 - x1), ub = (b - x1) / (x2 - x1);
    pos.push(a, ya, z2, b, yb, z2, b, yb, z1, a, ya, z2, b, yb, z1, a, ya, z1); uv.push(ua, 0, ub, 0, ub, 1, ua, 0, ub, 1, ua, 1);
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.computeVertexNormals();
  return geo;
}
// 受光照的布景板：用 backdrop 的 lit（吃灯光、接得住影子），再把法线改成朝上，明暗就和地面一致（立在地上的草、花用）
function litBoard(x1, x2, y1, y2, z, ppm, draw, o = {}) {
  const m = backdrop(x1, x2, y1, y2, z, ppm, draw, { ...o, lit: true }), n = m.geometry.attributes.normal;
  for (let i = 0; i < n.count; i++) n.setXYZ(i, 0, 1, 0);
  return m;
}
// 把一块板子的原点挪到底边：之后缩放就是“从地里长出来”
function rooted(m) { const h = m.geometry.parameters.height; m.geometry.translate(0, h / 2, 0); m.position.y -= h / 2; return m; }

// ---- 石头 ----
// 形状：正二十面体细分一次，每个顶点沿着半径推进推出一点（同一个位置推得一样，面和面才接得上），再压扁。
// 颜色写在顶点上：朝上的面盖着青苔，侧面是石头本色，每个面深浅略有不同
const ROCK_MAT = lam(0xffffff, { vertexColors: true });
function rockGeo(seed, o = {}) {
  const g = new THREE.IcosahedronGeometry(1, o.detail ?? 1), p = g.attributes.position, amp = o.amp ?? 0.24, flat = o.flat ?? 0.7;
  const h = (a, b, c) => { const s = Math.sin(Math.round(a * 500) * 12.9898 + Math.round(b * 500) * 78.233 + Math.round(c * 500) * 37.719 + seed * 3.17) * 43758.5453; return s - Math.floor(s); };
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = 1 + amp * (h(x, y, z) * 2 - 1); p.setXYZ(i, x * k, y * k * flat, z * k); }
  g.computeVertexNormals();
  const n = g.attributes.normal, col = new Float32Array(p.count * 3), c = new THREE.Color(), base = new THREE.Color(o.col ?? 0x7f8077), moss = new THREE.Color(o.mossCol ?? 0x55583a), mk = o.moss ?? 1;
  for (let f = 0; f < p.count; f += 3) {
    const m = clamp((n.getY(f) - 0.5) / 0.35, 0, 1) * mk * (h(f, 1.7, 0.3) < 0.72 ? 1 : 0.15);                        // 青苔不是每个朝上的面都有
    c.copy(base).multiplyScalar(0.82 + 0.36 * h(f, 0.9, 2.1)).lerp(moss, m);
    for (let j = 0; j < 3; j++) { col[(f + j) * 3] = c.r; col[(f + j) * 3 + 1] = c.g; col[(f + j) * 3 + 2] = c.b; }
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); return g;
}
// 一块半埋在土里的石头：s 是大致的半宽。o: flat 多扁 / sink 埋进去多少 / moss 青苔多少 / col 颜色 / yaw
function rock(parent, x, z, s, o = {}) {
  const flat = o.flat ?? rr(0.6, 0.9), m = add(parent, rockGeo(o.seed ?? Math.floor(rr(0, 9999)), { ...o, flat }), ROCK_MAT, x, (o.y ?? groundY(x)) - s * flat * (o.sink ?? 0.3), z);
  m.scale.set(s * (o.sx ?? rr(0.95, 1.3)), s, s * (o.sz ?? rr(0.75, 1.05))); m.rotation.y = o.yaw ?? rr(0, 6.28); m.userData.top = m.position.y + s * flat * 0.95; return m;
}
// 一把小石子：一个带实例的网格。pts 是 [x, z, 大小]；cols 是几种深浅
function pebbles(parent, pts, o = {}) {
  const geo = rockGeo(o.seed ?? 5, { detail: 0, amp: 0.22, flat: 0.75, moss: 0, col: 0xffffff }), mesh = new THREE.InstancedMesh(geo, ROCK_MAT, pts.length);
  const M = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), c = new THREE.Color(), cols = o.cols ?? [0x7f8077, 0x6d6f68, 0x8f8f84, 0x5f6258, 0x8a8472];
  pts.forEach(([x, z, s], i) => {
    e.set(rr(-0.5, 0.5), rr(0, 6.28), rr(-0.5, 0.5)); q.setFromEuler(e);
    M.compose(V3(x, groundY(x) + s * 0.2, z), q, V3(s * rr(0.9, 1.4), s * rr(0.5, 0.85), s * rr(0.8, 1.2))); mesh.setMatrixAt(i, M); mesh.setColorAt(i, c.set(pick(cols)).multiplyScalar(rr(0.85, 1.15)));
  });
  mesh.instanceMatrix.needsUpdate = true; mesh.instanceColor.needsUpdate = true; mesh.computeBoundingSphere(); mesh.castShadow = mesh.receiveShadow = true; parent.add(mesh); return mesh;
}

// ---- 落叶 ----
const LEAF_COLS = [0xb08238, 0x94592a, 0x74502f, 0xbd9c4a, 0x84663a, 0x9c6a2c, 0x6a6638, 0x5e4a30, 0x8a7448];
const LEAF_MAT = lam(0xffffff, { side: THREE.DoubleSide });
function leafGeo() {                                     // 一片叶子：沿着中脉对折了一点的菱形，长 1
  const g = new THREE.BufferGeometry(), A = [-0.5, 0, 0], B = [0.5, 0, 0], C = [0.02, 0.07, 0.24], D = [0.02, 0.07, -0.24];
  g.setAttribute('position', new THREE.Float32BufferAttribute([...A, ...C, ...B, ...A, ...B, ...D], 3)); g.computeVertexNormals(); return g;
}
// 铺在地上的一层落叶：dens(x, z) 给出这里有多密（0..1），per 是最密的地方每平方米多少片。一片片都是同一个网格的实例，平躺着
function leafLitter(parent, x1, x2, z1, z2, dens, o = {}) {
  const pts = [], n = Math.round((x2 - x1) * (z2 - z1) * (o.per ?? 30));
  for (let i = 0; i < n; i++) { const x = rr(x1, x2), z = rr(z1, z2); if (rnd() < dens(x, z)) pts.push([x, z]); }
  return leaves3d(parent, pts, { ...o, flat: true });
}
// 立体的落叶：一片片带实例的小叶子，大多平躺着，少数翘起来（flat：全都平躺着，颜色深浅差得多一些）。pts 是 [x, z]
function leaves3d(parent, pts, o = {}) {
  const mesh = new THREE.InstancedMesh(leafGeo(), LEAF_MAT, pts.length), M = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(0, 0, 0, 'YXZ'), c = new THREE.Color(), cols = o.cols ?? LEAF_COLS, flat = !!o.flat;
  pts.forEach(([x, z], i) => {
    const s = (flat ? rr(0.08, 0.15) : rr(0.07, 0.12)) * (o.s ?? 1), up = flat ? rr(-0.06, 0.06) : rnd() < 0.25 ? rr(0.3, 0.9) : rr(-0.15, 0.15);
    e.set(rr(-0.5, 0.5) * (flat ? 0.15 : 1), rr(0, 6.28), up); q.setFromEuler(e);
    M.compose(V3(x, groundY(x) + (flat ? 0.009 : 0.012) + Math.abs(Math.sin(up)) * s * 0.5, z), q, V3(s, s * (flat ? 0.4 : 1), s)); mesh.setMatrixAt(i, M); mesh.setColorAt(i, c.set(pick(cols)).multiplyScalar(flat ? rr(0.6, 1.05) : rr(0.85, 1.2)));
  });
  mesh.instanceMatrix.needsUpdate = true; mesh.instanceColor.needsUpdate = true; mesh.computeBoundingSphere(); mesh.receiveShadow = true; parent.add(mesh); return mesh;
}
// 从树上飘下来的叶子：几片，围着镜头循环。area: [x1, x2] 只在这一段里飘
function fallingLeaves(parent, L, area, o = {}) {
  const n = o.n ?? 8, mesh = new THREE.InstancedMesh(leafGeo(), LEAF_MAT, n), M = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), c = new THREE.Color(), cols = o.cols ?? LEAF_COLS, S = [];
  for (let i = 0; i < n; i++) { S.push({ x: 0, y: -9, z: 0, wait: L.rr(0, 7), a: L.rr(0, 6.28), w: L.rr(1.6, 3.2), s: L.rr(0.08, 0.11), v: L.rr(0.5, 0.85), ph: L.rr(0, 6.28) }); mesh.setColorAt(i, c.set(cols[i % cols.length])); }
  mesh.instanceColor.needsUpdate = true; mesh.frustumCulled = false; parent.add(mesh);
  const hide = new THREE.Matrix4().makeScale(0, 0, 0);
  return L.add({ mesh, step(dt) {
    S.forEach((f, i) => {
      if (f.y < -1) {                                    // 还没出场：等一会儿，从镜头附近的高处出来
        f.wait -= dt; mesh.setMatrixAt(i, hide);
        if (f.wait < 0) { f.x = clamp(cam.x + L.rr(-9, 10), area[0], area[1]); f.y = groundY(f.x) + L.rr(5.5, 7.5); f.z = L.rr(-4.5, 5); f.gy = groundY(f.x) + 0.02; }
        return;
      }
      f.y -= f.v * dt * (0.75 + 0.25 * Math.sin(L.t * f.w * 2 + f.ph)); f.x += (E.wind * 0.25 + 0.4 * Math.sin(L.t * f.w + f.ph)) * dt; f.a += dt * 2.2;
      if (f.y <= f.gy) { f.y = -9; f.wait = L.rr(2, 9); mesh.setMatrixAt(i, hide); return; }
      e.set(Math.sin(L.t * f.w + f.ph) * 1.1, f.a, 0.5 + 0.6 * Math.cos(L.t * f.w * 1.3 + f.ph)); q.setFromEuler(e); M.compose(V3(f.x, f.y, f.z), q, V3(f.s, f.s, f.s)); mesh.setMatrixAt(i, M);
    });
    mesh.instanceMatrix.needsUpdate = true;
  } });
}

// ---- 草和蕨（画在立着的板子上；坐标是米，y 向上）----
// 一片弯着的草叶：从 (x, y) 长到 h 高，叶尖往一边歪 lean
function blade(g, x, y, h, lean, w) {
  g.beginPath(); g.moveTo(x - w, y); g.quadraticCurveTo(x - w * 0.5 + lean * 0.2, y + h * 0.62, x + lean, y + h);
  g.quadraticCurveTo(x + w * 0.5 + lean * 0.34, y + h * 0.55, x + w, y); g.closePath(); g.fill();
}
// 一丛草：n 片叶子从同一个地方散开，中间的高、两边的矮
function tuft(g, x, y, h, n, cols, spread = 0.55) {
  for (let i = 0; i < n; i++) {
    const k = n > 1 ? i / (n - 1) * 2 - 1 : 0, hh = h * rr(0.55, 1) * (1 - 0.4 * Math.abs(k));
    g.fillStyle = pick(cols); blade(g, x + k * h * 0.1, y, hh, k * hh * spread + rr(-0.08, 0.08) * h, Math.max(0.007, h * 0.03));
  }
}
// 一片蕨叶：一根弯下去的叶轴，两边一对对越来越短的小叶。a 是起始方向（从竖直往右偏多少弧度），bend 是一路弯过去多少
function frond(g, x, y, len, a, bend, col) {
  const n = Math.max(8, Math.round(len * 34)), st = len / n, pts = [], y0 = y + st * 0.6; let px = x, py = y, d = a;
  for (let i = 0; i <= n; i++) { pts.push([px, py, d, i / n]); px += Math.sin(d) * st; py = Math.max(y0, py + Math.cos(d) * st); d += bend / n * (0.4 + 1.2 * i / n); }   // 垂到地面就贴着地面走，不往地底下钻
  setInk(g, col); line(g, pts.map(p => [p[0], p[1]]), Math.max(0.006, len * 0.02));
  for (const [qx, qy, dd, t] of pts) {
    if (t < 0.1) continue;
    const L = len * 0.23 * Math.pow(Math.sin(Math.PI * (0.06 + 0.94 * t)), 0.7) * (1 - 0.25 * t), ax = Math.sin(dd), ay = Math.cos(dd), bw = st * 0.46;
    for (const s of [-1, 1]) poly(g, [[qx - ax * bw, qy - ay * bw], [qx + ax * bw, qy + ay * bw], [qx + ay * s * L + ax * L * 0.35, Math.max(y, qy - ax * s * L + ay * L * 0.35)]]);
  }
}
// 一丛蕨：几片蕨叶从同一个地方朝四周垂开，后面的深、前面的浅
function fernClump(g, x, y, s, cols, n = 6) {
  const fr = []; for (let i = 0; i < n; i++) { const a = (i + 0.5) / n * 2.5 - 1.25 + rr(-0.15, 0.15); fr.push([a, Math.abs(a)]); }
  fr.sort((p, q) => q[1] - p[1]);                          // 两边的先画，中间的压在上面
  fr.forEach(([a, k], i) => frond(g, x + a * s * 0.05, y, s * rr(0.7, 1) * (1 - 0.18 * k), a * 0.85, a * 1.1 + Math.sign(a) * 0.35, cols[Math.min(cols.length - 1, Math.floor(i / n * cols.length))]));
}
// 一朵小蘑菇
function mushroom(g, x, y, s, cap, stem = '#d9d3c0') {
  g.fillStyle = stem; box(g, x - s * 0.1, y, s * 0.2, s * 0.62);
  g.fillStyle = cap; g.beginPath(); g.ellipse(x, y + s * 0.58, s * 0.46, s * 0.4, 0, 0, Math.PI); g.closePath(); g.fill();
}
// 贴着画面下沿的前景：几丛离镜头最近、略微虚焦的草和蕨。放在够近的深度上，它前面那一段地面正好落在画面外
function foreTufts(x1, x2, z, o = {}) {
  const cols = o.cols ?? ['#131b12', '#18221a', '#101710'], h1 = o.h ?? 1.0;
  return backdrop(x1, x2, -0.6, h1 * 1.3 + 0.5, z, 40, g => {
    for (let x0 = x1 + 2; x0 < x2 - 2; x0 += rr(o.gap0 ?? 3.6, o.gap1 ?? 7.5)) {                                      // 两头留出一丛的宽度，不然会被板子的边切齐
      const y = groundY(x0) - 0.2;
      if ((o.skip ?? []).some(([a, b]) => x0 > a - 1.2 && x0 < b + 1.2)) continue;
      if (rnd() < (o.fern ?? 0.3)) fernClump(g, x0 + rr(-0.6, 0.6), y, rr(0.9, 1.25) * h1, cols, 7);
      for (let j = 0, n = Math.floor(rr(2, 5)); j < n; j++) { const x = x0 + rr(-0.8, 0.8), h = rr(0.55, 1.1) * h1; setInk(g, pick(cols)); for (let k = 0; k < 9; k++) { const l = rr(-0.45, 0.45) * h; blade(g, x + rr(-0.28, 0.28), y, h * rr(0.5, 1), l, 0.035); } }
    }
  }, { fog: false, blur: o.blur ?? 1.1, blurOnce: true, order: 4000 });
}

// ---- 草、蕨、草籽、蘑菇、水草：画在一张各章共用的图集上，每一丛是一个小方片（同一个网格里的一个实例）----
// 图集是灰白的，摆的时候每一丛染上自己的颜色：同一张图，在林地里是绿的，到了荒地就是枯黄的。
// 一格 256×128 像素，画一丛：底边中点是根，横向 -1..1、竖向 0..1（单位是米）；摆的时候按要多高缩放。
// 方片是不透明的：照着贴图的透明度挖掉空的地方，边缘靠多重采样抹平 —— 不用排前后次序，也不用一排排各占一张大贴图（原来一段 31 米的林地光草就要 58 MB）。
// 顶上跟着风轻轻摆
const PLANT_KINDS = {}, PLANT_U = { uT: { value: 0 }, uSway: { value: 0.035 } };
let PLANT_TEX = null, PLANT_MAT = null;
const P_CW = 256, P_CH = 128, P_COLS = 8, P_ROWS = 8;
function plantAtlas() {
  if (PLANT_TEX) return PLANT_TEX;
  const [c, g] = mkCanvas(P_CW * P_COLS, P_CH * P_ROWS);
  let n = 0;
  const cell = (kind, h0, draw) => {                       // h0：画在这一格里的这一丛有多大（摆的时候按它换算缩放）
    const i = n++, cx = (i % P_COLS) * P_CW, cy = Math.floor(i / P_COLS) * P_CH;
    g.save(); g.beginPath(); g.rect(cx + 3, cy + 3, P_CW - 6, P_CH - 6); g.clip();
    g.setTransform(P_CW / 2 - 6, 0, 0, -(P_CH - 10), cx + P_CW / 2, cy + P_CH - 4); g.lineCap = 'round'; g.lineJoin = 'round';
    draw(g); g.restore();
    (PLANT_KINDS[kind] ??= []).push([i, h0]);
  };
  // 灰度按原来那几种颜色之间的深浅比例定：染上颜色以后，一丛里照样有深有浅
  const G4 = ['#cfcfcf', '#ebebeb', '#b3b3b3', '#ffffff'], F3 = ['#b4b4b4', '#d6d6d6', '#ffffff'], D2 = ['#e8e8e8', '#ffffff'];
  withSeed(4711, () => {
    for (let k = 0; k < 12; k++) cell('grass', 0.85, g => tuft(g, 0, 0, 0.85, 4 + k % 5, G4, rr(0.4, 0.7)));
    for (let k = 0; k < 5; k++) cell('dry', 0.85, g => tuft(g, 0, 0, 0.85, 4 + k % 4, D2, rr(0.4, 0.7)));
    for (let k = 0; k < 10; k++) cell('fern', 0.7, g => fernClump(g, 0, 0, 0.7, F3, 5 + k % 3));
    for (let k = 0; k < 3; k++) cell('seed', 0.9, g => { setInk(g, D2[0]); for (let j = 0, n = 2 + k % 2; j < n; j++) { const x = (j - (n - 1) / 2) * 0.09, l = rr(-0.12, 0.12), h = rr(0.7, 0.88); line(g, [[x, 0], [x + l * 0.4, h * 0.6], [x + l, h]], 0.022); g.beginPath(); g.ellipse(x + l, h, 0.03, 0.08, -l * 2, 0, 6.2832); g.fill(); } });
    for (let k = 0; k < 3; k++) cell('mush', 0.4, g => { for (let j = 0; j < 3; j++) mushroom(g, (j - 1) * 0.22 + rr(-0.04, 0.04), 0, rr(0.24, 0.4), j % 2 ? '#c8c8c8' : '#e6e6e6', '#ffffff'); });
    for (let k = 0; k < 3; k++) cell('reed', 0.9, g => { for (let j = 0; j < 4; j++) { g.fillStyle = G4[j]; blade(g, (j - 1.5) * 0.07, 0, rr(0.55, 0.88), rr(-0.15, 0.15), 0.02); } });
  });
  PLANT_TEX = canvasTex(c); PLANT_TEX.anisotropy = 8; renderer.initTexture(PLANT_TEX);
  return PLANT_TEX;
}
function plantMat() {
  if (PLANT_MAT) return PLANT_MAT;
  const m = PLANT_MAT = new THREE.MeshLambertMaterial({ map: plantAtlas(), alphaTest: 0.05, alphaToCoverage: true });
  m.onBeforeCompile = sh => {
    sh.uniforms.uT = PLANT_U.uT; sh.uniforms.uSway = PLANT_U.uSway;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec4 aCell;\nuniform float uT, uSway;')
      .replace('#include <uv_vertex>', '#include <uv_vertex>\n\tvMapUv = vMapUv * aCell.zw + aCell.xy;')                                  // 每一丛取图集里自己那一格
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n\tfloat swayH = max(position.y, 0.0);\n\ttransformed.x += swayH * swayH * uSway * sin(uT * 1.7 + instanceMatrix[3].x * 1.3 + instanceMatrix[3].z * 0.7);');   // 根不动，越往上摆得越多
  };
  m.customProgramCacheKey = () => 'ground-plants-1';
  return m;
}
// 摆一批植物：list 里每一项 [x, y, z, 种类, 多大, 颜色]（种类：grass 草 / dry 枯草 / fern 蕨 / seed 结了籽的草茎 / mush 一小簇蘑菇 / reed 水草；多大：和图集里那一格的 h0 同一个量）
function plants(parent, list) {
  plantAtlas();
  const W = 2 * P_CW / (P_CW - 12), H = P_CH / (P_CH - 10), geo = new THREE.PlaneGeometry(W, H); geo.translate(0, H / 2 - 4 / (P_CH - 10), 0);   // 方片和图集里的一格一样大：画的时候的 1 米就是 1 米
  const nm = geo.attributes.normal; for (let i = 0; i < nm.count; i++) nm.setXYZ(i, 0, 1, 0);                    // 法线朝上：明暗和地面一致
  const n = list.length, cells = new Float32Array(n * 4), mesh = new THREE.InstancedMesh(geo, plantMat(), n), M = new THREE.Matrix4(), c = new THREE.Color(), du = 1 / P_COLS, dv = 1 / P_ROWS;
  list.forEach(([x, y, z, kind, h, col], i) => {
    const v = PLANT_KINDS[kind], [ci, h0] = v[Math.floor(rnd() * v.length)], s = h / h0, u0 = (ci % P_COLS) * du, v0 = 1 - (Math.floor(ci / P_COLS) + 1) * dv;
    M.makeScale(s, s, 1).setPosition(x, y, z); mesh.setMatrixAt(i, M); mesh.setColorAt(i, c.set(col));
    cells.set(rnd() < 0.5 ? [u0, v0, du, dv] : [u0 + du, v0, -du, dv], i * 4);                                   // 一半左右翻过来
  });
  geo.setAttribute('aCell', new THREE.InstancedBufferAttribute(cells, 4));
  mesh.instanceMatrix.needsUpdate = true; if (n) { mesh.instanceColor.needsUpdate = true; mesh.computeBoundingSphere(); }
  mesh.receiveShadow = true; mesh.onBeforeRender = () => { PLANT_U.uT.value = T; PLANT_U.uSway.value = 0.035 * (0.7 + 0.46 * GUST.v); };   // 阵风来了摆得大一些（和风吹树叶的声音一起）
  parent.add(mesh); return mesh;
}

// ---- 树枝、倒木、树桩 ----
const WOOD = { bark: lam(0x4f4133), bark2: lam(0x6b5b48), cut: lam(0x9c865e), moss: lam(0x55583a), cap: lam(0xd8cdb2) };
// 一根掉在地上的树枝：两截带一点折角，多半还带一个杈
function stick(parent, x, z, len, yaw, o = {}) {
  const r = o.r ?? rr(0.013, 0.026), mat = o.mat ?? pick([WOOD.bark, WOOD.bark2]), g = grp(parent, x, groundY(x), z); g.rotation.y = yaw;
  const seg = (sx, sz, a, l, rad) => { const m = add(g, cy(rad, rad * 0.65, l, 5), mat, sx + Math.cos(a) * l / 2, rad * 0.9, sz - Math.sin(a) * l / 2); m.rotation.set(0, a, Math.PI / 2); return [sx + Math.cos(a) * l, sz - Math.sin(a) * l]; };
  const l1 = len * rr(0.5, 0.7), a1 = rr(-0.12, 0.12), [ex, ez] = seg(-len / 2, 0, a1, l1, r);
  seg(ex, ez, a1 + rr(-0.4, 0.4), len - l1, r * 0.7);
  if (len > 0.45 && rnd() < 0.75) { const k = rr(0.35, 0.75), s = rnd() < 0.5 ? 1 : -1; seg(-len / 2 + Math.cos(a1) * l1 * k, -Math.sin(a1) * l1 * k, a1 + s * rr(0.5, 0.95), len * rr(0.25, 0.45), r * 0.6); }
  return g;
}
// 一根倒木：两头是断面，带两截残枝；朝上的一面长着青苔，朝镜头的一侧生着几朵菌子
function fallenLog(parent, x, z, len, r, yaw) {
  const g = grp(parent, x, groundY(x), z), cy0 = r * 0.86; g.rotation.y = yaw;
  add(g, cy(r * 0.9, r, len, 9), WOOD.bark, 0, cy0, 0).rotation.z = Math.PI / 2;
  for (const s of [-1, 1]) add(g, cy(r * (s > 0 ? 0.86 : 0.76), r * (s > 0 ? 0.86 : 0.76), 0.02, 9), WOOD.cut, s * (len / 2 + 0.006), cy0, 0, false).rotation.z = Math.PI / 2;
  for (const [k, l, a0, da] of [[-0.2, 0.44, 0.75, 1.75], [0.27, 0.3, 1.0, 1.3]]) { const moss = add(g, new THREE.CylinderGeometry(r * 0.93 + 0.012, r * 0.97 + 0.012, len * l, 9, 1, true, Math.PI / 2 - a0, da), WOOD.moss, k * len, cy0, 0, false); moss.rotation.z = Math.PI / 2; moss.receiveShadow = true; }
  for (const [k, a, l] of [[0.22, 0.5, 0.42], [-0.18, -0.9, 0.3]]) { const m = add(g, cy(r * 0.14, r * 0.24, l, 5), WOOD.bark, k * len, cy0 + r * 0.6 + l * 0.3, a * r * 0.5); m.rotation.set(a * 0.7, 0, a * 0.5); }
  for (const [k, yy, s] of [[-0.3, 0.9, 1], [-0.24, 1.15, 0.7], [0.12, 0.8, 0.85]]) add(g, new THREE.SphereGeometry(0.055 * s, 8, 5, 0, 6.2832, 0, 1.6), WOOD.cap, k * len, r * yy, r * 0.82, false).scale.y = 0.6;
  return g;
}
// 一只树桩：顶上是锯过的断面，脚下露着几条树根
function stump(parent, x, z, r, h) {
  const g = grp(parent, x, groundY(x), z);
  add(g, cy(r * 0.86, r * 1.1, h, 9), WOOD.bark, 0, h / 2, 0); add(g, cy(r * 0.8, r * 0.8, 0.016, 9), WOOD.cut, 0, h + 0.006, 0, false).receiveShadow = true;
  for (let i = 0; i < 5; i++) { const a = i / 5 * 6.2832 + rr(-0.3, 0.3), m = add(g, cy(r * 0.3, r * 0.14, r * 1.3, 5), WOOD.bark, Math.cos(a) * r * 1.3, r * 0.2, Math.sin(a) * r * 1.3); m.rotation.set(0, -a, Math.PI / 2 - 0.3); }
  add(g, new THREE.SphereGeometry(r * 0.5, 7, 5, 0, 6.2832, 0, 1.5), WOOD.moss, -r * 0.5, h * 0.55, r * 0.55, false).scale.set(1.2, 0.5, 1);
  return g;
}

// ---- 泥 ----
// 一条踩出来的泥路：沿着 zc(x) 弯弯曲曲的一道湿土，边缘不齐；o.patches 是另外几片泥地 [x, z, 半长, 半宽]（水洼周围、镜头跟前）。
// 泥是湿的：上面一道道反光的水痕用的是水洼那一套倒影（映着天和后面的树干），只是淡得多、碎得多 —— 从这么低的镜头看过去，泥要靠这点反光才认得出来
function mudPath(parent, L, layers, x1, x2, zc, o = {}) {
  const w = o.w ?? 0.85, z1 = o.z1 ?? -2.6, z2 = o.z2 ?? 7.6, patches = o.patches ?? [], X1 = x1 - 1, X2 = x2 + 1;
  const blob = (g, x, z, rx, rz, col, a = 0) => { g.fillStyle = col; g.beginPath(); g.ellipse(x, z, rx, rz, a, 0, 6.2832); g.fill(); };
  const soft = (g, px) => { if ('filter' in g) g.filter = px ? `blur(${px}px)` : 'none'; };
  const spots = [];                                        // 泥地由一团团椭圆叠成 [x, z, 半长, 半宽]
  for (let x = x1; x < x2; x += rr(0.16, 0.34)) spots.push([x, zc(x) + rr(-0.25, 0.25) * w, rr(0.45, 1.0), w * rr(0.5, 1.0)]);
  for (const [px, pz, rx, rz] of patches) for (let i = 0, n = Math.round(rx * rz * 10) + 6; i < n; i++) { const a = rr(0, 6.28), d = Math.sqrt(rnd()); spots.push([px + Math.cos(a) * d * rx * 0.8, pz + Math.sin(a) * d * rz * 0.8, rr(0.35, 0.8) * Math.min(1, rx * 0.6), rr(0.12, 0.3) * Math.min(1.4, rz * 1.6)]); }
  const wet = spots.filter(() => rnd() < 0.22).map(([x, z, rx, rz]) => [x + rr(-0.2, 0.2), z + rr(-0.08, 0.08), rx * rr(0.3, 0.65), rz * rr(0.2, 0.45)]);
  const decal = groundDecal(X1, X2, z1, z2, 40, g => {
    soft(g, 8); for (const [x, z, rx, rz] of spots) blob(g, x, z, rx, rz, o.col ?? 'rgba(42,29,14,0.38)');                   // 湿土
    soft(g, 3); for (const [x, z, rx, rz] of wet) blob(g, x, z, rx, rz, 'rgba(16,11,6,0.5)');                                 // 更湿、更黑的地方
    soft(g, 0);
    for (const [x, z, rx, rz] of spots) if (rnd() < 0.6) for (let k = 0; k < 5; k++) blob(g, x + rr(-rx, rx), z + rr(-rz, rz) * 0.8, rr(0.015, 0.045), rr(0.01, 0.03), rnd() < 0.5 ? 'rgba(110,98,74,0.55)' : 'rgba(10,7,4,0.55)');   // 翻起来的土粒
    for (let x = x1 + 0.4, i = 0; x < x2 - 0.4; x += rr(0.3, 0.42), i++) { const z = zc(x) + (i % 2 ? 0.1 : -0.1) + rr(-0.04, 0.04); g.save(); g.translate(x, z); g.rotate(rr(-0.2, 0.2)); blob(g, 0, 0, 0.13, 0.055, 'rgba(8,6,3,0.55)'); blob(g, 0.04, 0, 0.07, 0.035, 'rgba(70,62,44,0.35)'); g.restore(); }   // 一串脚印
  }, { order: -31, lift: 0.006, fadeL: 2, fadeR: 2, parent });
  const sheen = puddles(parent, L, X1, X2, z1, z2, [], layers, { rim: false, pool: false, soft: true, ppm: 30, k: o.k ?? 0.5, bed: 0x1e160c, mask: g => {
    soft(g, 1.2);
    for (const [x, z, rx, rz] of wet) for (let k = 0; k < 2; k++) { g.globalAlpha = rr(0.45, 0.95); blob(g, x + rr(-rx, rx) * 0.6, z + rr(-rz, rz) * 0.5, rr(0.08, 0.26) * Math.max(0.6, rx), rr(0.025, 0.05), '#fff'); }   // 一道道横着的细水痕
    for (let x = x1 + 0.4, i = 0; x < x2 - 0.4; x += rr(0.3, 0.42), i++) if (rnd() < 0.18) { g.globalAlpha = 0.6; blob(g, x, zc(x) + (i % 2 ? 0.1 : -0.1), 0.09, 0.03, '#fff'); }   // 积了水的脚印
    g.globalAlpha = 1;
  } });
  return { decal, sheen };
}

// ---- 水洼 ----
// 一片浅水：水面映着后面的树、天和主角。pools 是一个个椭圆 [x, z, 半长, 半宽]（几个叠成一摊）；
// layers 是要映进水里的布景板（backdrop 返回的那几块，近的在前）。
// 倒影不是另画的：水面上的每一点，沿着视线在水面上反弹回去的方向找，碰到哪一层布景板就取那一层贴图上的颜色 ——
// 所以镜头一动，倒影跟着走；主角站在水洼后面，水里就有他的影子。越贴着水面看，映得越清楚（近处的水更透，看得见水底）
// o: mask(g) 自己画水的形状（不用 pools 的椭圆）/ rim false 不要水边那圈湿土 / k 整体淡到多少 / pool false 不算作能踩出水花的水洼 / bed 水底的颜色
function puddles(parent, L, x1, x2, z1, z2, pools, layers, o = {}) {
  const y = o.y ?? groundY((x1 + x2) / 2), ppm = o.ppm ?? 44, k = Math.min(1, 4096 / ((x2 - x1) * ppm), 4096 / ((z2 - z1) * ppm)), [mc, mg] = mkCanvas(Math.round((x2 - x1) * ppm * k), Math.round((z2 - z1) * ppm * k));
  const shape = (g, grow) => { g.beginPath(); for (const [x, z, rx, rz] of pools) { g.moveTo(x + rx + grow, z); g.ellipse(x, z, rx + grow, rz + grow * 0.7, 0, 0, 6.2832); } g.fill(); };
  mg.fillStyle = '#000'; mg.fillRect(0, 0, mc.width, mc.height);                                // 先铺满黑的：形状图要不透明，红色通道才是真的深浅（透明画布传给显卡时，只要沾了一点边，颜色就是满的）
  if ('filter' in mg) mg.filter = 'blur(2px)'; mg.setTransform(ppm * k, 0, 0, ppm * k, -x1 * ppm * k, -z1 * ppm * k); mg.fillStyle = '#fff';
  if (o.mask) o.mask(mg); else shape(mg, 0);
  const mask = canvasTex(mc); mask.colorSpace = THREE.NoColorSpace;
  if (o.rim !== false) groundDecal(x1, x2, z1, z2, ppm, g => { if ('filter' in g) g.filter = 'blur(4px)'; g.fillStyle = o.rimCol ?? 'rgba(22,18,11,0.55)'; shape(g, 0.16); }, { order: -30.5, lift: 0.007, parent });   // 水边一圈湿土
  const U = { uMask: { value: mask }, uSky: { value: new THREE.Color() }, uFog: { value: new THREE.Color() }, uBed: { value: new THREE.Color(o.bed ?? 0x1c1a12) }, uCam: { value: V3() }, uK: { value: o.k ?? 1 }, uLin: { value: o.soft ? 1 : 0 },
    uHero: { value: new THREE.Vector4() }, uT: { value: 0 }, uRip: { value: [0, 1, 2, 3].map(() => new THREE.Vector4(0, 0, 9, 0)) } };
  for (let i = 0; i < 3; i++) { U['uL' + i] = { value: null }; U['uR' + i] = { value: new THREE.Vector4() }; U['uZ' + i] = { value: V3() }; }
  layers.slice(0, 3).forEach((m, i) => { const p = m.geometry.parameters; U['uL' + i].value = m.material.map; U['uR' + i].value.set(m.position.x - p.width / 2, m.position.y - p.height / 2, 1 / p.width, 1 / p.height); });
  const mat = new THREE.ShaderMaterial({ uniforms: U, transparent: true, depthWrite: false,
    vertexShader: 'varying vec2 vUv; varying vec3 vW; void main() { vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `
      uniform sampler2D uMask, uL0, uL1, uL2; uniform vec4 uR0, uR1, uR2, uHero, uRip[4]; uniform vec3 uZ0, uZ1, uZ2, uSky, uFog, uBed, uCam; uniform float uT, uK, uLin;
      varying vec2 vUv; varying vec3 vW;
      vec3 layer(vec3 col, sampler2D tex, vec4 rc, vec3 zf, vec3 r) {           // zf：这一层的深度、它身上的雾有多重、不透明度（0 = 没有这一层）
        float s = (zf.x - vW.z) / r.z; vec2 uv = (vW.xy + r.xy * s - rc.xy) * rc.zw;
        if (zf.z < 0.01 || s <= 0.0 || uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return col;
        vec4 t = texture2D(tex, uv); return mix(col, mix(t.rgb, uFog, zf.y), t.a * zf.z);
      }
      void main() {
        float m = texture2D(uMask, vUv).r; if (m < 0.02) discard;
        vec3 d = normalize(vW - uCam), r = vec3(d.x, -d.y, d.z);
        float wob = 0.0, ring = 0.0;
        for (int i = 0; i < 4; i++) {                                              // 水圈：一圈圈往外走，把倒影推歪一点
          vec4 rp = uRip[i]; float dist = length((vW.xz - rp.xy) * vec2(1.0, 1.6)), rad = 0.04 + rp.z * 0.55, q = (dist - rad) / 0.05, w = exp(-q * q) * rp.w * max(0.0, 1.0 - rp.z / 1.4);
          wob += w * sin((dist - rad) * 70.0); ring += w;
        }
        r.x += wob * 0.06 + 0.0022 * sin(vW.x * 3.1 + uT * 1.3) + 0.0016 * sin(vW.z * 5.0 - uT * 0.9); r.y *= 1.0 + wob * 0.5;     // 风吹的一点点晃动（太密了会在倒影的边上抖出锯齿）
        vec3 col = uSky;
        col = layer(col, uL2, uR2, uZ2, r); col = layer(col, uL1, uR1, uZ1, r); col = layer(col, uL0, uR0, uZ0, r);
        if (uHero.w > 0.0 && vW.z > 0.03) {                                       // 主角的倒影：按他的身形粗粗地分三段 —— 深色的腿、浅色的上衣、深色的头
          float s = -vW.z / r.z, hy = (vW.y + r.y * s - uHero.y) / uHero.z, dx = abs(vW.x + r.x * s - uHero.x);
          if (hy > 0.0 && hy < 1.0) {
            float wd = hy > 0.86 ? 0.1 : (hy > 0.47 ? 0.15 : 0.11);
            vec3 hc = hy > 0.86 ? vec3(0.02, 0.02, 0.024) : (hy > 0.47 ? vec3(0.4, 0.38, 0.32) : vec3(0.03, 0.034, 0.04));
            col = mix(col, hc, smoothstep(wd, wd - 0.05, dx) * uHero.w);
          }
        }
        float F = 0.02 + 0.98 * pow(1.0 - clamp(-d.y, 0.0, 1.0), 5.0);
        float edge = smoothstep(0.06, 0.28, m) * (1.0 - smoothstep(0.28, 0.7, m));                    // 水边一圈细细的亮线
        col = mix(uBed, col, clamp(F * 1.7, 0.0, 1.0)) + (ring * 0.1 + edge * 0.1) * uSky;
        gl_FragColor = vec4(col, mix(smoothstep(0.02, 0.55, m), m, uLin) * uK);
        #include <colorspace_fragment>
      }` });
  mat.userData.own = true;
  const mesh = new THREE.Mesh(groundGeo(x1, x2, z1, z2, 0.012), mat); mesh.renderOrder = -28; mesh.frustumCulled = false; parent.add(mesh);
  renderer.initTexture(mask);
  const sky = new THREE.Color(), sky2 = new THREE.Color(); let rip = 0;
  const P_ = { mesh, y, pools, x1, x2,
    at: (x, z) => pools.some(([px, pz, rx, rz]) => ((x - px) / rx) ** 2 + ((z - pz) / rz) ** 2 < 1),             // 这一点在不在水里
    ripple(x, z, amp = 1) { U.uRip.value[rip++ % 4].set(x, z, 0, amp); },
    step(dt) {
      for (const v of U.uRip.value) v.z += dt;
      if (Math.abs(cam.x - (x1 + x2) / 2) > (x2 - x1) / 2 + 16) return;
      U.uT.value = L.t; U.uCam.value.copy(camera.position); U.uFog.value.copy(scene.fog.color);
      sky.setRGB(...E.sky[2], THREE.SRGBColorSpace); sky2.setRGB(...E.sky[1], THREE.SRGBColorSpace); U.uSky.value.copy(sky).lerp(sky2, 0.35);     // 贴着水面看过去，映的是地平线上方不高的那一带天
      layers.slice(0, 3).forEach((m, i) => { const f = scene.fog.density * (camera.position.z - m.position.z); U['uZ' + i].value.set(m.position.z, m.material.fog === false ? 0 : 1 - Math.exp(-f * f), m.visible ? m.material.opacity : 0); });
      U.uHero.value.set(P.x, P.y, hero.H, state === 'title' ? 0 : 1);
    } };
  if (o.pool !== false) L.pools.push(P_);
  return L.add(P_);
}

// ---- 会动的那些：每一章把自己摆的收在一起，每帧推进一次 ----
// calm = true 时小动物不逃（出效果图用）。它自己带一套随机数，不动关卡搭建用的那一套
function groundLife(parent, seed = 1) {
  let s = Math.imul(seed, 2654435761) | 0, prevPh = 0;
  const L = { items: [], pools: [], surf: [], calm: false, t: 0,
    rn() { s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; },
    rr: (a, b) => a + (b - a) * L.rn(),
    add(it) { L.items.push(it); return it; },
    pool: (x, z) => L.pools.find(p => p.at(x, z)),
    reset() { for (const it of L.items) if (it.reset) it.reset(); },
    step(dt) {
      L.t += dt; for (const it of L.items) it.step(dt);
      // 主角的脚落在什么上面：踩进水洼起一圈水纹、溅几滴水
      const ph = hero.A.ph, foot = P.grounded && Math.abs(P.vx) > 0.4 && Math.floor(ph * 2) !== Math.floor(prevPh * 2); prevPh = ph;
      if (foot && state !== 'title') { const fz = Math.floor(ph * 2) % 2 ? 0.07 : -0.07, fxp = P.x + P.facing * 0.1, p = L.pool(fxp, fz); if (p && Math.abs(P.y - p.y) < 0.1) { p.ripple(fxp, fz, 0.8); L.splash(fxp, p.y, fz + 0.05, 0.7); fx('puddle'); } }
    } };
  // 溅起来的几滴水
  const drops = []; for (let i = 0; i < 12; i++) { const sp = glow(parent, 0xe6f2ea, 0.045, 0); sp.visible = false; sp.renderOrder = 31; drops.push({ sp, t: 9, v: V3() }); }
  L.splash = (x, y, z, k = 1) => { let n = 0; for (const d of drops) { if (d.sp.visible || n >= 5) continue; n++; d.t = 0; d.sp.position.set(x + L.rr(-0.03, 0.03), y + 0.02, z); d.v.set(L.rr(-0.5, 0.5) * k, L.rr(0.9, 1.7) * k, L.rr(-0.25, 0.25) * k); d.sp.visible = true; } };
  L.add({ step(dt) { for (const d of drops) { if (!d.sp.visible) continue; d.t += dt; d.v.y -= 7 * dt; d.sp.position.addScaledVector(d.v, dt); d.sp.material.opacity = 0.8 * (1 - d.t / 0.42); if (d.t > 0.42) d.sp.visible = false; } } });
  return L;
}
const wrapPi = a => a - Math.round(a / 6.2832) * 6.2832;
const heroNear = (x, r) => state === 'play' && Math.abs(P.x - x) < r && P.y - groundY(P.x) < 1.8;

// ---- 青蛙 ----
// 蹲在水边，喉咙一鼓一鼓，偶尔叫两声、挪一下；主角走到 flee 米以内，它就连蹦几下扎进水里（o.water: [x, z, 水面高度]，o.pool: 那一摊水），
// 主角走远了再回到原处。模型面朝 +x
function mkFrog(parent, L, x, z, o = {}) {
  const c1 = o.col ?? 0x7f9c44, back = lam(c1, { emissive: c1, emissiveIntensity: 0.2 }), belly = lam(0xdde0ae, { emissive: 0xdde0ae, emissiveIntensity: 0.25 }), dark = unlit(0x0c100a);
  const sph = (r, a = 8, b = 6) => new THREE.SphereGeometry(r, a, b);
  const g = grp(parent, x, groundY(x), z), body = grp(g, 0, 0.03, 0); g.scale.setScalar(o.s ?? 1.4);
  add(body, sph(0.03), back, 0, 0.004, 0, false).scale.set(1.5, 0.85, 1.1);
  add(body, sph(0.027), belly, 0.008, -0.007, 0, false).scale.set(1.45, 0.72, 1.0);
  const head = grp(body, 0.036, 0.01, 0); add(head, sph(0.022), back, 0.004, 0, 0, false).scale.set(1.25, 0.8, 1.15);
  const throat = add(head, sph(0.015), belly, 0.006, -0.012, 0, false);
  for (const sz of [-1, 1]) { add(head, sph(0.0095, 6, 5), back, 0.002, 0.017, sz * 0.015, false); add(head, sph(0.0055, 5, 4), dark, 0.007, 0.0195, sz * 0.0185, false); }   // 鼓出来的眼睛
  const legs = [-1, 1].map(sz => {                       // 后腿：蹲着时缩成一团，跳起来蹬直，拖在身后；前腿撑着地，跳起来收到身侧
    const haunch = add(body, sph(0.02), back, -0.02, -0.01, sz * 0.027, false), hip = grp(body, -0.03, -0.008, sz * 0.024), arm = grp(body, 0.026, -0.008, sz * 0.02);
    add(hip, cy(0.0045, 0.0075, 0.085, 5), back, -0.0425, 0, 0, false).rotation.z = Math.PI / 2; add(hip, bx(0.03, 0.005, 0.018), back, -0.092, 0, 0, false);
    add(arm, cy(0.004, 0.0045, 0.034, 5), back, 0, -0.017, 0, false);
    return { haunch, hip, arm };
  });
  const f = { g, x, z, y: groundY(x), home: [x, z, o.yaw ?? 0], st: 'sit', t: L.rr(0, 4), next: L.rr(3, 8), yaw: o.yaw ?? 0, yawT: o.yaw ?? 0, flee: o.flee ?? 1.9, ext: 0, pitch: 0.38, hop: null, queue: [], away: 0, croak: 0, wait: 0 };
  const hopTo = (tx, tz, ty, dive) => { const d = Math.hypot(tx - f.x, tz - f.z); f.hop = { x0: f.x, z0: f.z, y0: f.y, x1: tx, z1: tz, y1: ty, h: 0.06 + 0.3 * d, T: 0.2 + 0.22 * d + 0.12 * Math.sqrt(Math.abs(ty - f.y)), t: 0, dive }; f.st = 'hop'; if (d > 0.03) f.yawT = Math.atan2(-(tz - f.z), tx - f.x); };
  const escape = () => {                                   // 逃：朝水那边连跳几下（o.via 是中途要落脚的几个点），最后一下扎进去
    const [wx, wz, wy] = (typeof o.water === 'function' ? o.water() : o.water) ?? [f.x + (f.x >= P.x ? 1.8 : -1.8), f.z - 1.5, f.y];
    let cx = f.x, cz = f.z; f.queue = [];
    const leg = (tx, tz, keep) => { const d = Math.hypot(tx - cx, tz - cz) - keep, n = Math.ceil(d / 0.66); for (let i = 1; i <= n; i++) { const k = i / n * d / (d + keep); f.queue.push([lerp(cx, tx, k) + L.rr(-0.06, 0.06), lerp(cz, tz, k) + L.rr(-0.06, 0.06), null, false]); } if (n > 0) [cx, cz] = f.queue[f.queue.length - 1]; };
    for (const [vx, vz] of o.via ?? []) leg(vx, vz, 0);
    if (!o.via) leg(wx, wz, 0.75);                         // 离水还远：先蹦近一些，留最后一大步
    f.queue.push([wx, wz, wy, true]); f.st = 'ready'; f.wait = 0.04;
  };
  f.reset = () => { Object.assign(f, { x: f.home[0], z: f.home[1], y: groundY(f.home[0]), yaw: f.home[2], yawT: f.home[2], st: 'sit', t: 0, queue: [], away: 0, ext: 0, pitch: 0.38 }); g.visible = true; };
  f.step = dt => {
    f.t += dt; f.croak = Math.max(0, f.croak - dt);
    if (f.st === 'gone') { f.away = Math.abs(P.x - f.home[0]) > 11 ? f.away + dt : 0; if (f.away > 5) f.reset(); return; }
    if (f.st === 'sit') {
      if (!L.calm && heroNear(f.x, f.flee)) escape();
      else if (f.t > f.next) {                             // 闲着：叫两声，或者原地挪一下
        f.t = 0; f.next = L.rr(4, 10); const far = Math.abs(P.x - f.x);
        if (L.rn() < 0.55) { f.croak = 0.9; if (far < 13 && state === 'play') fx('croak', sstep(13, 3, far)); } else if (!L.calm) { const a = f.yaw + L.rr(-1, 1); hopTo(f.x + Math.cos(a) * 0.07, f.z - Math.sin(a) * 0.07, f.y, false); f.hop.h = 0.03; f.hop.T = 0.16; f.yawT = a; }
      }
    } else if (f.st === 'ready') {
      f.wait -= dt; if (f.wait <= 0) { const q = f.queue.shift(); if (q) { hopTo(q[0], q[1], q[2] ?? groundY(q[0]), q[3]); if (Math.abs(P.x - f.x) < 12) fx('frogHop'); } else f.st = 'sit'; }
    } else if (f.st === 'hop') {
      const H = f.hop; H.t += dt; const k = Math.min(1, H.t / H.T);
      f.x = lerp(H.x0, H.x1, k); f.z = lerp(H.z0, H.z1, k); f.y = lerp(H.y0, H.y1, H.dive ? k * k : k) + 4 * H.h * k * (1 - k);
      f.ext = sstep(0, 0.22, k) * (1 - sstep(0.72, 1, k) * (H.dive ? 0.3 : 1)); f.pitch = lerp(0.38, Math.atan2((H.y1 - H.y0 + 4 * H.h * (1 - 2 * k)) / H.T, Math.hypot(H.x1 - H.x0, H.z1 - H.z0) / H.T + 0.01), sstep(0, 0.15, k) * (1 - (H.dive ? 0 : sstep(0.85, 1, k))));
      if (k >= 1) {
        if (H.dive) { f.st = 'gone'; f.away = 0; g.visible = false; if (o.pool) o.pool.ripple(f.x, f.z, 1.2); L.splash(f.x, f.y, f.z, 1); if (Math.abs(P.x - f.x) < 14) fx('plop', sstep(14, 2, Math.abs(P.x - f.x))); }
        else { f.st = f.queue.length ? 'ready' : 'sit'; f.wait = L.rr(0.05, 0.11); f.ext = 0; f.pitch = 0.38; f.t = 0; }
      }
    }
    f.yaw += wrapPi(f.yawT - f.yaw) * (1 - Math.exp(-22 * dt));
    g.position.set(f.x, f.y, f.z); g.rotation.y = f.yaw; body.rotation.z = f.pitch;
    const sit = f.st === 'sit' ? 1 : 0;
    throat.scale.setScalar(1 + sit * (0.2 * Math.max(0, Math.sin(L.t * 6.5 + x * 3)) + (f.croak > 0 ? 0.9 * Math.abs(Math.sin(f.croak * 14)) : 0)));
    for (const l of legs) { l.hip.scale.x = 0.2 + 0.8 * f.ext; l.hip.rotation.z = lerp(0.5, -0.1, f.ext); l.haunch.scale.set(lerp(1.35, 0.85, f.ext), lerp(0.9, 0.6, f.ext), 0.75); l.arm.rotation.z = lerp(0.35, -1.25, f.ext); }
  };
  f.step(0); return L.add(f);
}

// ---- 蜥蜴 ----
// 趴在石头上晒太阳，偶尔扭一下头；主角走近就顺着 path（[x, y, z] 一串点）窜走，到最后一个点钻进去不见了，走远了再回来。模型面朝 +x。
// o.normal：趴着的那一面朝哪边（贴在石头朝镜头的那一面上，镜头才看得见它整个背、四条腿和尾巴；趴在石头顶上只剩一条线）；yaw 是在那一面上头朝哪边
function mkLizard(parent, L, x, y, z, o = {}) {
  // 造型比真的蜥蜴夸张：身子扁而宽、头是一块楔子、四条腿往两边撑开再折向前后、尾巴弯成 S 形 —— 照真的比例，这么远看过去只是一根小树枝
  const c1 = o.col ?? 0x55552f, skin = lam(c1, { emissive: c1, emissiveIntensity: 0.25 }), stripe = lam(0xa8a26a, { emissive: 0xa8a26a, emissiveIntensity: 0.25 }), eye = unlit(0x0c0c08);
  const tilt = grp(parent, x, y, z), g = grp(tilt), body = grp(g, 0, 0.011, 0), SC = o.s ?? 1.45, up = V3(0, 1, 0), qSlope = new THREE.Quaternion().setFromUnitVectors(up, o.normal ?? up), qFlat = new THREE.Quaternion(); g.scale.setScalar(SC);
  const torso = add(body, new THREE.CapsuleGeometry(0.016, 0.056, 3, 8), skin, 0, 0, 0, false); torso.rotation.z = Math.PI / 2; torso.scale.set(0.62, 1, 1);
  add(body, bx(0.062, 0.003, 0.007), stripe, -0.004, 0.0098, 0, false);                                             // 背上一道浅色的纹
  const head = grp(body, 0.043, 0.001, 0); add(head, new THREE.SphereGeometry(0.015, 8, 6), skin, 0.009, 0, 0, false).scale.set(1.6, 0.62, 1.05);
  for (const sz of [-1, 1]) add(head, new THREE.SphereGeometry(0.0034, 5, 4), eye, 0.013, 0.006, sz * 0.0095, false);
  const tails = []; let tp = grp(body, -0.042, 0, 0);
  for (let i = 0; i < 5; i++) { const l = 0.031 - i * 0.002, r = 0.011 * (1 - i * 0.17); add(tp, cy(r * 0.75, r, l, 5), skin, -l / 2, 0, 0, false).rotation.z = Math.PI / 2; tails.push(tp); tp = grp(tp, -l, 0, 0); }
  const legs = [];
  for (const [lx, front] of [[0.025, 1], [-0.03, 0]]) for (const sz of [-1, 1]) {
    const h = grp(body, lx, -0.002, sz * 0.009);
    add(h, cy(0.0043, 0.005, 0.026, 5), skin, 0, 0, sz * 0.013, false).rotation.x = Math.PI / 2;                       // 上半截：往两边撑开
    const knee = grp(h, 0, -0.001, sz * 0.026), a = front ? -1.9 : 1.9, dx = -Math.sin(a), dy = Math.cos(a);
    add(knee, cy(0.0034, 0.0042, 0.022, 5), skin, dx * 0.011, dy * 0.011, 0, false).rotation.z = a;                    // 下半截：前腿折向前、后腿折向后
    add(knee, new THREE.SphereGeometry(0.0052, 5, 4), skin, dx * 0.022, dy * 0.022, 0, false).scale.set(1.3, 0.5, 1.3);   // 脚掌
    legs.push({ h, ph: (front ? 0 : 0.5) + (sz > 0 ? 0 : 0.5) });
  }
  const z0 = { x, y, z, yaw: o.yaw ?? 0 }; let path = o.path ?? [[x + 1.2, y - 0.2, z - 0.8]];                      // path2：主角从右边来的时候走的另一条路
  const f = { g, ...z0, st: 'bask', t: L.rr(0, 3), next: L.rr(2, 6), flee: o.flee ?? 2.3, i: 0, away: 0, look: 0, lookT: 0, run: 0 };
  f.reset = () => { Object.assign(f, z0, { st: 'bask', t: 0, i: 0, away: 0, run: 0 }); g.visible = true; tilt.quaternion.copy(qSlope); };
  f.step = dt => {
    f.t += dt;
    if (f.st === 'gone') { f.away = Math.abs(P.x - z0.x) > 11 ? f.away + dt : 0; if (f.away > 5) f.reset(); return; }
    if (f.st === 'bask') {
      if (!L.calm && heroNear(f.x, f.flee)) { f.st = 'run'; f.i = 0; f.t = 0; path = P.x > f.x && o.path2 ? o.path2 : o.path ?? path; if (Math.abs(P.x - f.x) < 12) fx('skitter'); }
      else if (f.t > f.next) { f.t = 0; f.next = L.rr(2, 6); f.lookT = L.rr(-0.8, 0.8); }
      f.look = damp(f.look, f.lookT, 9, dt);
    } else {                                               // 窜：一段一段贴着地面跑，身子和尾巴左右甩
      const [tx, ty, tz] = path[f.i], dx = tx - f.x, dz = tz - f.z, d = Math.hypot(dx, dz), stepLen = (o.speed ?? 2.6) * dt;
      f.yaw += wrapPi(Math.atan2(-dz, dx) - f.yaw) * (1 - Math.exp(-30 * dt)); f.run += dt;
      if (d <= stepLen) { f.x = tx; f.z = tz; f.y = ty; if (++f.i >= path.length) { f.st = 'gone'; f.away = 0; g.visible = false; } }
      else { f.x += dx / d * stepLen; f.z += dz / d * stepLen; f.y = damp(f.y, ty, 14, dt); }
      f.look = 0;
    }
    const w = f.st === 'run' ? Math.sin(f.run * 46) : 0;
    if (f.st === 'run') tilt.quaternion.slerp(qFlat, 1 - Math.exp(-10 * dt));                                              // 一跑起来就不再顺着石头的坡面了
    tilt.position.set(f.x, f.y, f.z); g.rotation.y = f.yaw + 0.22 * w; head.rotation.y = f.look - 0.2 * w;
    tails.forEach((t, i) => { t.rotation.y = f.st === 'run' ? 0.4 * Math.sin(f.run * 46 - 1 - i * 0.9) : [0.32, 0.28, -0.22, -0.4, -0.3][i] + 0.05 * Math.sin(L.t * 1.3 + i); });   // 趴着的时候尾巴弯成 S 形
    for (const l of legs) l.h.rotation.y = f.st === 'run' ? 0.9 * Math.sin(f.run * 46 + l.ph * 6.2832) : 0;
  };
  f.reset(); f.step(0); return L.add(f);
}

// ---- 一小群虫子（红黑相间的蝽）----
// 聚在一处慢慢爬，走走停停；主角走近就四散逃开、钻进落叶里不见了，走远了再出来
function mkBugs(parent, L, x, z, n, o = {}) {
  const red = lam(o.col ?? 0xc8482a, { emissive: o.col ?? 0xc8482a, emissiveIntensity: 0.35 }), blk = lam(0x18130f), s = o.s ?? 1.5, y = groundY(x) + 0.006, R = o.r ?? 0.32;
  const bugs = []; for (let i = 0; i < n; i++) {
    const g = grp(parent, x, y, z); add(g, new THREE.SphereGeometry(0.011, 7, 5), red, 0, 0.005, 0, false).scale.set(1.5, 0.6, 1.0); add(g, new THREE.SphereGeometry(0.006, 6, 4), blk, 0.016, 0.004, 0, false); add(g, bx(0.012, 0.004, 0.02), blk, -0.002, 0.0095, 0, false);
    const a = L.rr(0, 6.28), d = Math.sqrt(L.rn()) * R; bugs.push({ g, hx: x + Math.cos(a) * d, hz: z + Math.sin(a) * d * 0.7, x: 0, z: 0, tx: 0, tz: 0, yaw: L.rr(0, 6.28), pause: L.rr(0, 2), v: L.rr(0.07, 0.13), k: 1, fa: 0 });
  }
  const B = { bugs, st: 'idle', t: 0, away: 0, flee: o.flee ?? 1.5 };
  B.reset = () => { B.st = 'idle'; B.t = 0; B.away = 0; for (const b of bugs) { b.x = b.tx = b.hx; b.z = b.tz = b.hz; b.k = 1; b.g.visible = true; } };
  B.step = dt => {
    B.t += dt;
    if (B.st === 'gone') { B.away = Math.abs(P.x - x) > 9 ? B.away + dt : 0; if (B.away > 5) B.reset(); return; }
    if (B.st === 'idle' && !L.calm && heroNear(x, B.flee)) { B.st = 'flee'; B.t = 0; for (const b of bugs) { b.fa = Math.atan2(-(b.z - 0 + L.rr(-0.6, 0.6)), (b.x - P.x) + L.rr(-0.5, 0.5)); b.v = L.rr(0.9, 1.4); b.pause = L.rr(0, 0.12); } }
    let left = 0;
    for (const b of bugs) {
      if (B.st === 'idle') {
        b.pause -= dt; const dx = b.tx - b.x, dz = b.tz - b.z, d = Math.hypot(dx, dz);
        if (d < 0.01) { if (b.pause < 0) { const a = L.rr(0, 6.28), r = L.rr(0.05, 0.2); b.tx = clamp(b.x + Math.cos(a) * r, b.hx - R, b.hx + R); b.tz = clamp(b.z + Math.sin(a) * r, b.hz - R * 0.7, b.hz + R * 0.7); b.pause = L.rr(0.4, 2.6); } }
        else if (b.pause < 0.3) { const st = Math.min(d, b.v * dt); b.x += dx / d * st; b.z += dz / d * st; b.yaw += wrapPi(Math.atan2(-dz, dx) - b.yaw) * (1 - Math.exp(-12 * dt)); }
      } else {
        b.pause -= dt; if (b.pause < 0) { b.x += Math.cos(b.fa) * b.v * dt; b.z -= Math.sin(b.fa) * b.v * dt; b.yaw = b.fa + 0.3 * Math.sin(B.t * 40 + b.hx * 9); }
        if (B.t > 0.7) b.k = Math.max(0, b.k - dt * 3.5);                                                             // 钻进落叶里
        if (b.k > 0) left++;
      }
      b.g.position.set(b.x, y, b.z); b.g.rotation.y = b.yaw; b.g.scale.setScalar(s * b.k); b.g.visible = b.k > 0.02;
    }
    if (B.st === 'flee' && !left) { B.st = 'gone'; B.away = 0; }
  };
  B.reset(); B.step(0); return L.add(B);
}
