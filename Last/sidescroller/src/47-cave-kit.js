
// ============================================================
//  山洞的布景套件（第九章用）：横着剖开的一条山洞
//  最前面是岩石的剖面（一整块黑，z = 2.4）；洞顶的底面和脚下的地面是真的三维面，从剖面一直伸到后墙，受灯光；
//  后墙（z = -7）是画出来的石头；中间一层是石笋、石柱、潭底的大石头的剪影；
//  水：主角前面一层水色（越深越浓）、水面那一道会闪的亮线、潭底的焦散；光：光柱、水下的光线、光晕、水里悬着的颗粒。
//  形状全由洞顶（ceiling()）和地面（terrain()）两条折线决定，碰撞也是它们，所以画出来的岩石和挡住人的岩石是同一个
// ============================================================
const CZ = { cut: 2.4, front: 2.2, surf: 2.25, mid: -3.4, wall: -7, back: -7.4 };
const rockNoise = (x, y) => { const w = x * 1.7 + y * 2.3; return 0.9 * Math.sin(w * 2.1 + 1.3) + 0.6 * Math.sin(w * 5.3 + 0.4) + 0.35 * Math.sin(w * 11.7) + 0.2 * Math.sin(w * 23.1 + 2.0); };

// 一条折线（地面或洞顶）在 [x1, x2] 里的那一段：切细，按法线方向抖一抖（两头不抖，和相邻的一段接得上）
function roughLine(pts, f, x1, x2, amp, step = 0.08) {
  const src = [[x1, f(x1)], ...pts.filter(p => p[0] > x1 + 1e-6 && p[0] < x2 - 1e-6), [x2, f(x2)]], out = [];
  for (let i = 0; i < src.length - 1; i++) {
    const [ax, ay] = src[i], [bx, by] = src[i + 1], L = Math.hypot(bx - ax, by - ay) || 1e-6, n = Math.max(1, Math.round(L / step)), nx = -(by - ay) / L, ny = (bx - ax) / L;
    for (let k = 0; k < n; k++) { const t = k / n, px = lerp(ax, bx, t), py = lerp(ay, by, t), j = i === 0 && k === 0 ? 0 : amp * rockNoise(px, py) * 0.5; out.push([px + nx * j, py + ny * j]); }
  }
  out.push(src[src.length - 1]); return out;
}

// ---- 1 岩石的剖面：洞顶以上、地面以下各一整块黑 ----
function caveCut(R, x1, x2, o = {}) {
  const mat = new THREE.MeshBasicMaterial({ color: o.color ?? 0x030506, fog: false }); mat.userData.own = true;
  const V = (x, y) => new THREE.Vector2(x, y);
  const top = roughLine(CEIL, ceilY, x1, x2, 0.07), bot = roughLine(TERRAIN, groundY, x1, x2, 0.05);
  for (const pts of [[V(x1, 40), ...top.map(([x, y]) => V(x, y)), V(x2, 40)], [V(x1, -40), ...bot.map(([x, y]) => V(x, y)), V(x2, -40)]]) {
    const m = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape(pts)), mat); m.position.z = CZ.cut; m.renderOrder = 900; R.add(m);
  }
  // 剖面上挂着的钟乳石、岸边冒出来的小石笋（也是一整块黑）
  const tri = [];
  for (let x = x1 + rr(0.3, 1.2); x < x2 - 0.3; x += rr(0.5, 1.7)) {
    const y = ceilY(x); if (y - groundY(x) < 2.4 || Math.abs(ceilY(x + 0.3) - ceilY(x - 0.3)) > 0.25 || (o.skip && o.skip(x))) continue;
    const h = rr(0.15, 0.7), w = rr(0.12, 0.34); tri.push([[x - w / 2, y + 0.15], [x + w / 2, y + 0.15], [x + w * 0.08, y - h], [x - w * 0.05, y - h * 0.9]]);
  }
  for (let x = x1 + rr(0.5, 2); x < x2 - 0.3; x += rr(0.8, 2.4)) {
    const y = groundY(x); if (waterAt(x) || Math.abs(groundY(x + 0.3) - groundY(x - 0.3)) > 0.1 || ceilY(x) - y < 2.6) continue;
    const h = rr(0.05, 0.28), w = rr(0.2, 0.5); tri.push([[x - w / 2, y - 0.1], [x + w / 2, y - 0.1], [x + w * 0.1, y + h], [x - w * 0.1, y + h]]);
  }
  for (const t of tri) { const m = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape(t.map(([x, y]) => V(x, y)))), mat); m.position.z = CZ.cut; m.renderOrder = 900; R.add(m); }
}

// ---- 2 洞顶的底面、脚下的地面：顺着折线拉成一条，从剖面伸到后墙后面一点。颜色 col(x, y, z) 给（水下的部分沉进水色里）----
let CAVE_TILE = null;
function caveTile() {                                    // 一小块能平铺的石头地：明暗斑驳、碎石、细裂缝（乘在顶点颜色上）
  if (CAVE_TILE) return CAVE_TILE;
  const [c, g] = mkCanvas(256, 256); g.fillStyle = '#b4b4b4'; g.fillRect(0, 0, 256, 256);
  const s0 = _seed; _seed = 4242;
  for (let i = 0; i < 90; i++) { const x = rr(0, 256), y = rr(0, 256), r = rr(10, 60), v = rr(120, 235) | 0; for (const ox of [-256, 0, 256]) for (const oy of [-256, 0, 256]) { const gr = g.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r); gr.addColorStop(0, `rgba(${v},${v},${v},.45)`); gr.addColorStop(1, `rgba(${v},${v},${v},0)`); g.fillStyle = gr; g.fillRect(x + ox - r, y + oy - r, 2 * r, 2 * r); } }
  for (let i = 0; i < 260; i++) { const x = rr(0, 256), y = rr(0, 256), r = rr(1.5, 6), v = rnd() < 0.5 ? rr(50, 100) | 0 : rr(200, 255) | 0; g.fillStyle = `rgba(${v},${v},${v},${rr(0.3, 0.6)})`; g.beginPath(); g.ellipse(x, y, r * 1.3, r, rr(0, 3), 0, 6.283); g.fill(); }
  g.strokeStyle = 'rgba(40,40,40,.45)'; g.lineWidth = 1.2; for (let i = 0; i < 14; i++) { let x = rr(0, 256), y = rr(0, 256); g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += rr(-14, 14); y += rr(4, 16); g.lineTo(x, y); } g.stroke(); }
  _seed = s0;
  const t = sharedTex(canvasTex(c)); t.wrapS = t.wrapT = THREE.RepeatWrapping; return CAVE_TILE = t;
}
function caveSurface(R, pts, f, x1, x2, col, down) {
  const xs = []; for (const p of pts) if (p[0] > x1 && p[0] < x2) xs.push(p[0]);
  for (let x = x1; x < x2; x += 0.5) xs.push(x); xs.push(x2); xs.sort((a, b) => a - b);
  const X = xs.filter((x, i) => i === 0 || x - xs[i - 1] > 0.02), Zs = [CZ.cut, 1.4, 0.2, -1.2, -2.8, -4.6, CZ.back];
  const pos = [], cl = [], uv = [], idx = [], nz = Zs.length, c = new THREE.Color();
  for (const x of X) {
    const y = f(x), st = clamp((Math.abs(f(x + 0.08) - f(x - 0.08)) / 0.16 - 0.8) / 2.5, 0, 1), dk = 1 - 0.72 * st;   // 陡的地方（潭壁、压进水里的岩石的侧面）是背光的岩壁，暗下去
    for (const z of Zs) { pos.push(x, y, z); const k = col(x, y, z); c.setRGB(k[0] * dk, k[1] * dk, k[2] * dk, THREE.SRGBColorSpace); cl.push(c.r, c.g, c.b); uv.push(x * 0.45, z * 0.45); }
  }
  for (let i = 0; i < X.length - 1; i++) for (let j = 0; j < nz - 1; j++) {
    if (Math.abs(f(X[i + 1]) - f(X[i])) > 2.2 * (X[i + 1] - X[i])) continue;   // 陡的一段（潭壁、压进水里的岩石的侧面）不往里拉：只留最前面的剖面，后面直接看见后墙，和剖面图一样
    if (down) { const w = waterAt((X[i] + X[i + 1]) / 2); if (w && Math.max(f(X[i]), f(X[i + 1])) < w.y + 0.8) continue; }   // 压到水面附近的洞顶（要潜过去的那块岩石）也一样，只留剖面
    const a = i * nz + j, b = a + 1, d = a + nz, e = d + 1;
    if (down) idx.push(a, b, d, b, e, d); else idx.push(a, d, b, b, d, e);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(cl, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true, map: caveTile() })); m.material.userData.own = true; m.receiveShadow = true; m.frustumCulled = false; R.add(m); return m;
}

// ---- 3 后墙：画在画布上的石头。光斑铺底、乘上石头的纹理，再加各种东西（draw 由章节给），水面以下沉进水色里；左边一段渐隐，和前一段的后墙接上 ----
function rockTexInto(g, w, h, ppm) {                     // 往一张画布上乘一层石头的纹理（灰度）：大块明暗、有棱角的岩面、断断续续的岩层、裂缝、小坑
  const [c, t] = mkCanvas(w, h); t.fillStyle = '#ababab'; t.fillRect(0, 0, w, h);
  for (let i = 0, n = w * h / (ppm * ppm) * 0.9; i < n; i++) { const x = rr(0, w), y = rr(0, h), r = rr(0.5, 2.6) * ppm, v = rr(90, 245) | 0, gr = t.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${v},${v},${v},.42)`); gr.addColorStop(0.45, `rgba(${v},${v},${v},.19)`); gr.addColorStop(1, `rgba(${v},${v},${v},0)`); t.fillStyle = gr; t.fillRect(x - r, y - r, 2 * r, 2 * r); }
  for (let i = 0, n = w * h / (ppm * ppm) * 0.5; i < n; i++) {
    const x = rr(0, w), y = rr(0, h), r = rr(0.35, 1.5) * ppm, k = rr(4, 7) | 0, a0 = rr(0, 6.28), v = rnd() < 0.5 ? rr(70, 130) | 0 : rr(185, 250) | 0;
    t.beginPath(); for (let j = 0; j < k; j++) { const a = a0 + j / k * 6.283 + rr(-0.3, 0.3), rj = r * rr(0.55, 1); t[j ? 'lineTo' : 'moveTo'](x + Math.cos(a) * rj, y + Math.sin(a) * rj * rr(0.45, 0.8)); } t.closePath();
    t.fillStyle = `rgba(${v},${v},${v},${rr(0.16, 0.34)})`; t.fill(); if (rnd() < 0.5) { t.strokeStyle = `rgba(30,30,30,${rr(0.2, 0.45)})`; t.lineWidth = rr(0.8, 1.8) * ppm / 90; t.stroke(); }
  }
  t.lineCap = 'round';
  for (let i = 0, n = h / ppm * 2.4; i < n; i++) {
    const v = rr(45, 110) | 0, a = rr(-0.18, 0.1), al = rr(0.18, 0.45); t.lineWidth = rr(0.8, 2.6) * ppm / 90;
    let x = rr(-0.2, 0.9) * w, y = rr(0, h); const len = rr(0.05, 0.3) * w, ph = rr(0, 6);
    for (let k = 0; k < len; k += ppm * 0.2) { const nx = x + ppm * 0.2, ny = y + a * ppm * 0.2 + Math.sin(k / ppm * 0.9 + ph) * ppm * 0.03; if (Math.sin(k / ppm * 1.3 + ph * 3) > -0.35) { t.strokeStyle = `rgba(${v},${v},${v},${al})`; t.beginPath(); t.moveTo(x, y); t.lineTo(nx, ny); t.stroke(); } x = nx; y = ny; }
  }
  for (let i = 0, n = w / ppm * 0.5; i < n; i++) { t.strokeStyle = `rgba(20,20,20,${rr(0.3, 0.6)})`; t.lineWidth = rr(0.8, 2) * ppm / 90; let x = rr(0, w), y = rr(0, h); t.beginPath(); t.moveTo(x, y); for (let k = 0, m = rr(3, 9); k < m; k++) { x += rr(-0.3, 0.3) * ppm; y += rr(0.08, 0.35) * ppm; t.lineTo(x, y); } t.stroke(); }
  for (let i = 0, n = w * h / 700; i < n; i++) { const v = rnd() < 0.5 ? rr(40, 90) | 0 : rr(200, 255) | 0; t.fillStyle = `rgba(${v},${v},${v},${rr(0.2, 0.5)})`; t.fillRect(rr(0, w), rr(0, h), rr(1, 3), rr(1, 3)); }
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'multiply'; g.drawImage(c, 0, 0); g.restore();
}
function caveBlob(g, x, y, r, c, a) { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${c},${a})`); gr.addColorStop(0.45, `rgba(${c},${a * 0.45})`); gr.addColorStop(1, `rgba(${c},0)`); g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r); }
// S：{ x1, x2 这一段的范围, y1, y2 后墙画多高, ppm, amb 岩石在空气里的底色, ambW 水下的底色, lights 光斑 [[x, y, 半径, 'r,g,b', 强度]], tint2 七米深处的水色 [[水面处 r,g,b,不透明度], [潭底]], fadeL 左边渐隐多宽, order, draw(g) 再加的东西 }
function caveWall(R, S) {
  const x1 = S.x1 - 7, x2 = S.x2 + 7, y1 = S.y1 ?? -7, y2 = S.y2 ?? 7, ppm = S.ppm ?? 52;
  return backdrop(x1, x2, y1, y2, CZ.wall, ppm, g => {
    g.fillStyle = S.amb; g.fillRect(x1, y1, x2 - x1, y2 - y1);
    for (const w of S.waters) { g.fillStyle = S.ambW; g.fillRect(w.x1 - 4, y1, w.x2 - w.x1 + 8, w.y - y1); }
    g.globalCompositeOperation = 'lighter'; for (const [x, y, r, c, a] of S.lights) caveBlob(g, x, y, r, c, a); g.globalCompositeOperation = 'source-over';
    rockTexInto(g, g.canvas.width, g.canvas.height, g.canvas.width / (x2 - x1));
    for (const w of S.waters) {                         // 水线上一道湿的、颜色深一些的岩石
      const gr = g.createLinearGradient(0, w.y + 0.6, 0, w.y); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.35)'); g.fillStyle = gr; g.fillRect(w.x1 - 4, w.y, w.x2 - w.x1 + 8, 0.6);
    }
    if (S.draw) S.draw(g);
    for (const [a, b] of [[S.x1 - 7, S.x1 + 5], [S.x2 + 7, S.x2 - 5]]) {   // 两头暗下去：和相邻一段的后墙在暗处交接，看不出接缝
      const gr = g.createLinearGradient(a, 0, b, 0); gr.addColorStop(0, 'rgba(0,0,0,.82)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(Math.min(a, b), y1, Math.abs(b - a), y2 - y1);
    }
    // 水面以下：七米深的水把石头盖得只剩一点影子
    const [s, d] = S.tint2;
    for (const w of S.waters) {
      g.save(); g.globalCompositeOperation = 'source-atop';
      const gr = g.createLinearGradient(0, w.y, 0, w.y - 4.5); gr.addColorStop(0, `rgba(${s[0]},${s[1]},${s[2]},${s[3]})`); gr.addColorStop(1, `rgba(${d[0]},${d[1]},${d[2]},${d[3]})`);
      const ex = 4;
      g.fillStyle = gr; g.beginPath(); g.rect(w.x1 - ex, y1, w.x2 - w.x1 + 2 * ex, w.y - y1); g.fill(); g.restore();
    }
  }, { fog: false, order: S.order ?? -2800, fadeL: S.fadeL ?? 0 });
}

// ---- 4 中间一层的剪影：石笋、石柱、大石头。shapes: [[点...], 颜色(可选)]，朝光的那边亮一道边 ----
function caveShapes(R, shapes, o) {
  const mk = (pts, col, z, order) => { const m = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)))), new THREE.MeshBasicMaterial({ color: col, fog: false })); m.material.userData.own = true; m.position.z = z; m.renderOrder = order; R.add(m); return m; };
  for (const [pts, col] of shapes) {
    const under = o.waterTint && pts.every(([x, y]) => { const w = waterAt(x); return w && y < w.y; });
    const body = new THREE.Color(col ?? o.col); if (under) body.lerp(new THREE.Color(o.waterTint), o.waterK ?? 0.55);
    if (o.rim) { const rc = new THREE.Color(o.rim).lerp(body, 0.55); if (under) rc.lerp(new THREE.Color(o.waterTint), 0.6); mk(pts.map(([x, y]) => [x + (o.rimDx ?? -0.035), y + 0.02]), rc, (o.z ?? CZ.mid) - 0.02, -1410); }
    mk(pts, body, o.z ?? CZ.mid, -1400);
  }
}
function spikeShape(x, y0, h, w, up) {                   // 一根石笋（up）或钟乳石
  const pts = []; for (let i = 0; i <= 7; i++) { const t = i / 7, hh = h * Math.pow(1 - Math.abs(t * 2 - 1), 1.7) * rr(0.85, 1.1); pts.push([x - w / 2 + w * t, y0 + (up ? hh : -hh)]); }
  pts.push([x + w / 2, y0 + (up ? -0.4 : 0.4)], [x - w / 2, y0 + (up ? -0.4 : 0.4)]); return pts;
}
function boulderShape(x, y0, w, h) { const pts = []; for (let a = 0; a <= Math.PI + 1e-3; a += Math.PI / 12) pts.push([x + Math.cos(a) * w / 2 * rr(0.9, 1.05), y0 - 0.3 + Math.sin(a) * h * rr(0.85, 1.05)]); return pts; }

// ---- 5 水：主角前面一层水色（顶点颜色带透明度，越深越浓；有光的地方淡、亮一些）----
function waterFront(R, w, o) {
  const xs = []; for (let x = w.x1 - 0.4; x < w.x2 + 0.4; x += 0.5) xs.push(x); xs.push(w.x2 + 0.4);
  const bot = w.bot ?? -6, ys = [w.y, w.y - 0.5, w.y - 1.3, w.y - 2.3, w.y - 3.5, bot - 1];
  const [s, d] = o.tint, k = o.frontK ?? 0.62, pos = [], cl = [], idx = [], n = ys.length;
  for (const x of xs) for (const y of ys) {
    const t = clamp((w.y - y) / 4.2, 0, 1), L = o.lum ? o.lum(x, y) : 0;
    const r = lerp(s[0], d[0], t), g = lerp(s[1], d[1], t), b = lerp(s[2], d[2], t), a = lerp(s[3], d[3], t) * k * (1 - 0.35 * clamp(L, 0, 1));
    const lc = o.scat ?? [0, 0, 0]; pos.push(x, y, CZ.front); cl.push(Math.min(1, (r + lc[0] * L) / 255), Math.min(1, (g + lc[1] * L) / 255), Math.min(1, (b + lc[2] * L) / 255), a);
  }
  for (let i = 0; i < xs.length - 1; i++) for (let j = 0; j < n - 1; j++) { const a = i * n + j; idx.push(a, a + n, a + 1, a + 1, a + n, a + n + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  const ca = new THREE.Float32BufferAttribute(cl, 4); g.setAttribute('color', ca); g.setIndex(idx);
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide }));
  m.material.userData.own = true; m.renderOrder = 880; m.frustumCulled = false; R.add(m); return m;
}
// 水面：一整张水的颜色，从剖面一直铺到后墙（镜头在水面上方时看得见它，透过它看见的水下的东西都蒙上一层水色）
function waterSheet(R, w, o) {
  // 左右正好到潭壁和水面相交的地方（再往外就伸到岸底下去了）
  let xa = w.x1, xb = w.x2; for (let n = 0; n < 200 && groundY(xa) > w.y; n++) xa += 0.01; for (let n = 0; n < 200 && groundY(xb) > w.y; n++) xb -= 0.01;
  const [r, g, b] = o.col, m = new THREE.Mesh(new THREE.PlaneGeometry(xb - xa, CZ.front - CZ.back), new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(r / 255, g / 255, b / 255, THREE.SRGBColorSpace), transparent: true, opacity: o.a ?? 0.6, depthWrite: false, fog: false, side: THREE.DoubleSide }));
  m.material.userData.own = true; m.rotation.x = -Math.PI / 2; m.position.set((xa + xb) / 2, w.y + 0.004, (CZ.front + CZ.back) / 2); m.renderOrder = 870; R.add(m);
  m.material.side = THREE.FrontSide;                     // 从上面看：暗的水面；从水下往上看：水面像一面镜子，是亮一些的（另一张，只朝下）
  const u = o.under ?? [150, 190, 190], m2 = new THREE.Mesh(m.geometry, new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(u[0] / 255, u[1] / 255, u[2] / 255, THREE.SRGBColorSpace), transparent: true, opacity: o.ua ?? 0.22, depthWrite: false, fog: false, side: THREE.BackSide }));
  m2.material.userData.own = true; m2.rotation.copy(m.rotation); m2.position.copy(m.position); m2.renderOrder = 871; R.add(m2); return m;
}
// 水面那一道亮线，和它下面一窄条反光（从水下看水面像一面镜子）。亮度 o.surf(x)（0..1），会慢慢地闪
const SURF_U = { uT: { value: 0 } };
let SURF_MAT = null;
function surfMat() {
  if (SURF_MAT) return SURF_MAT;
  return SURF_MAT = new THREE.ShaderMaterial({ uniforms: SURF_U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    vertexShader: 'attribute vec4 aC; varying vec4 vC; varying float vX; void main() { vC = aC; vX = position.x; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform float uT; varying vec4 vC; varying float vX; void main() { float s = 0.7 + 0.3 * sin(vX * 3.1 + uT * 1.7) * sin(vX * 7.3 - uT * 2.3); gl_FragColor = vec4(vC.rgb, vC.a * s); }' });
}
function waterSurface(R, w, o) {
  const xs = []; for (let x = w.x1 - 0.2; x < w.x2 + 0.2; x += 0.2) xs.push(x); xs.push(w.x2 + 0.2);
  const rows = [[0.014, 1], [-0.014, 1], [-0.018, 0.3], [-0.3, 0]], col = o.surfC.map(v => v / 255), pos = [], cl = [], idx = [], n = rows.length;
  for (const x of xs) { const k = clamp(o.surf(x), 0, 1) * 0.85; for (const [dy, a] of rows) { pos.push(x, w.y + dy, CZ.surf); cl.push(...col, k * a); } }
  for (let i = 0; i < xs.length - 1; i++) for (let j = 0; j < n - 1; j++) { const a = i * n + j; idx.push(a, a + n, a + 1, a + 1, a + n, a + n + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aC', new THREE.Float32BufferAttribute(cl, 4)); g.setIndex(idx);
  const m = new THREE.Mesh(g, surfMat()); m.renderOrder = 890; m.frustumCulled = false; R.add(m); return m;
}

// ---- 6 光：光柱 / 水下的光线（一块梯形，贴一张两边虚、往下渐淡的贴图）、焦散 ----
let BEAM_TEX = null;
function beamTex() {
  if (BEAM_TEX) return BEAM_TEX;
  const [c, g] = mkCanvas(64, 256), im = g.createImageData(64, 256);
  for (let y = 0; y < 256; y++) for (let x = 0; x < 64; x++) { const u = (x + 0.5) / 64 * 2 - 1, v = y / 255, a = Math.exp(-u * u * 3.2) * (1 - v) * (0.75 + 0.25 * (1 - v)), i = (y * 64 + x) * 4; im.data[i] = im.data[i + 1] = im.data[i + 2] = 255; im.data[i + 3] = Math.round(255 * a); }
  g.putImageData(im, 0, 0); return BEAM_TEX = sharedTex(canvasTex(c));
}
// top / bot: [中心 x, y, 宽]；v1：贴图用到多下面（1 = 一直淡到没有，0.6 = 到底还剩四成亮）
function lightBeam(R, top, bot, col, a, z, v1 = 1, order = 60) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([top[0] - top[2] / 2, top[1], z, top[0] + top[2] / 2, top[1], z, bot[0] - bot[2] / 2, bot[1], z, bot[0] + bot[2] / 2, bot[1], z], 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 1, 1, 1, 0, 1 - v1, 1, 1 - v1], 2)); g.setIndex([0, 2, 1, 1, 2, 3]);
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: beamTex(), color: col, transparent: true, opacity: a, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, side: THREE.DoubleSide }));
  m.material.userData.own = true; m.renderOrder = order; m.frustumCulled = false; m.userData.a = a; R.add(m); return m;
}
// 焦散：一张能平铺的亮线网（两个最近的随机点距离差很小的地方就是亮线），慢慢地挪，像水面在晃
let CAUSTIC_TEX = null;
function causticTex() {
  if (CAUSTIC_TEX) return CAUSTIC_TEX;
  const N = 256, cell = 32, [c, g] = mkCanvas(N, N), im = g.createImageData(N, N), m = N / cell, pts = [];
  const s0 = _seed; _seed = 777; for (let j = 0; j < m; j++) for (let i = 0; i < m; i++) pts.push([(i + rr(0.1, 0.9)) * cell, (j + rr(0.1, 0.9)) * cell]); _seed = s0;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const ci = Math.floor(x / cell), cj = Math.floor(y / cell); let f1 = 1e9, f2 = 1e9;
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const ii = (ci + di + m) % m, jj = (cj + dj + m) % m, p = pts[jj * m + ii], px = p[0] + (ci + di - ii) * cell, py = p[1] + (cj + dj - jj) * cell, d = Math.hypot(x - px, y - py); if (d < f1) { f2 = f1; f1 = d; } else if (d < f2) f2 = d; }
    const v = Math.pow(1 - clamp((f2 - f1) / (cell * 0.12), 0, 1), 2), i = (y * N + x) * 4; im.data[i] = im.data[i + 1] = im.data[i + 2] = 255; im.data[i + 3] = Math.round(255 * v);
  }
  g.putImageData(im, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return CAUSTIC_TEX = t;
}
// 一块焦散：平铺在地上（flat）或者贴在后墙上；中心 (x, y)、半径 rx、ry，颜色、亮度；每一块自己一张贴图（共用画布），自己挪
function causticPatch(R, x, y, rx, ry, col, a, o = {}) {
  const tex = causticTex().clone(); tex.needsUpdate = true; tex.repeat.set(rx * 2 / (o.cell ?? 1.3), ry * 2 / (o.cell ?? 1.3) * (o.squash ?? 1));
  const seg = 12, pos = [], uv = [], cl = [], idx = [];
  for (let j = 0; j <= seg; j++) for (let i = 0; i <= seg; i++) {
    const u = i / seg * 2 - 1, v = j / seg * 2 - 1, f = Math.max(0, 1 - (u * u + v * v)) ** 1.5;
    if (o.flat) pos.push(x + u * rx, y, (o.z ?? -2.5) + v * ry); else pos.push(x + u * rx, y + v * ry, o.z ?? CZ.wall + 0.1);
    uv.push(i / seg, j / seg); cl.push(1, 1, 1, f);
  }
  for (let j = 0; j < seg; j++) for (let i = 0; i < seg; i++) { const a0 = j * (seg + 1) + i; idx.push(a0, a0 + 1, a0 + seg + 1, a0 + 1, a0 + seg + 2, a0 + seg + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(cl, 4)); g.setIndex(idx);
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: tex, color: col, vertexColors: true, transparent: true, opacity: a, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, side: THREE.DoubleSide }));
  m.material.userData.own = true; m.renderOrder = o.order ?? -1300; m.frustumCulled = false; m.userData.drift = [o.dx ?? 0.025, o.dy ?? 0.018]; R.add(m);
  return m;
}
function stepCaustics(list, dt) { for (const m of list) { const t = m.material.map; t.offset.x += m.userData.drift[0] * dt; t.offset.y += m.userData.drift[1] * dt; } }

// ---- 7 水里悬着的颗粒（也可以是自己发光的小虫）：一团慢慢漂的点，在光里亮、暗处几乎看不见 ----
// box: [x1, x2, y1, y2, z1, z2]；lum(x, y) 这里有多亮（0..1）；o.glow：自己发光（一明一灭）；o.c 颜色；o.size
function caveSpecks(R, n, box, lum, o = {}) {
  const [x1, x2, y1, y2, z1, z2] = box, col = airCol(o.c ?? 0xcfe6e6);
  return airCloud(R, n, { add: true, order: o.order ?? 48, name: o.name ?? 'specks',
    init(s) { s.x = rr(x1, x2); s.y = rr(y1, y2); s.z = rr(z1, z2); s.ph = rr(0, 6.28); s.tw = rr(0.6, 2.2); s.b = rr(0.3, 1); s.size = rr(0.6, 1.4) * (o.size ?? 0.03); s.tile = 0; s.c = col;
      s.k = Math.pow(clamp(lum(s.x, s.y), 0, 1.4), o.glow ? 0 : 1.5); },
    step(s, dt) {
      s.x += 0.04 * Math.sin(T * 0.3 + s.ph) * dt; s.y += (0.025 * Math.sin(T * 0.45 + s.ph * 1.7) - (o.sink ?? 0.004)) * dt;
      if (s.y < y1) s.y = y2; if (s.y > y2) s.y = y1;
      if (Math.random() < 0.002) s.k = Math.pow(clamp(lum(s.x, s.y), 0, 1.4), o.glow ? 0 : 1.5);
      s.a = (o.a ?? 0.6) * s.b * s.k * (o.glow ? 0.35 + 0.65 * Math.max(0, Math.sin(T * s.tw + s.ph)) : 0.75 + 0.25 * Math.sin(T * s.tw + s.ph));
    } });
}
// 光斑（[x, y, 半径, 'r,g,b', 强度]）合起来在 (x, y) 这里有多亮
const lumOf = lights => (x, y) => { let s = 0; for (const [lx, ly, r, , a] of lights) s += a * Math.exp(-((x - lx) ** 2 + (y - ly) ** 2) / (r * r * 0.35)); return s; };
