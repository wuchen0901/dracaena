
// ============================================================
//  布景板：用 2D 画布“画”出剪影，贴在不同深度的平面上，镜头移动时自然产生视差
// ============================================================
let ROOT = scene;                                   // 布景板当前挂到哪个节点下（各章节搭建时会换成自己的）

// 世界范围 [x1,x2]×[y1,y2]，深度 z。draw(g) 里直接以“米”为单位、y 轴向上
// o: blur 虚焦 / additive 叠加发光 / fog 受不受雾影响 / order 绘制次序 / fadeL、fadeR 左右两端渐隐多少米 /
//    floor 平铺在地上，值是离地多高（这时 y1、y2 是 z 的范围，画的时候 y 就是 z，z 那个参数不用；要自己给 order）/
//    lit 受场景里的灯光和影子影响（地上的污渍、积水要跟着明暗走；默认的布景板是自己发色的，不看灯光）/
//    side 贴在一面朝 ±x 的竖墙上（比如水渠的内壁）：这时 x1、x2 是 z 的范围，z 那个参数是墙在哪个 x，画的时候横坐标就是 z；-1 朝 -x，+1 朝 +x（要自己给 order）/
//    blurOnce 先清清楚楚地画好，再整张虚化一次（默认是每一笔各自虚化 —— 笔画成千上万的时候太慢）。虚化都走 10-core.js 的 blurDraw，不靠浏览器的 ctx.filter，iPhone 上也一样
function backdrop(x1, x2, y1, y2, z, ppm, draw, o = {}) {
  let W = (x2 - x1) * ppm, Hh = (y2 - y1) * ppm;
  const k = Math.min(1, 4096 / W, 4096 / Hh), s = ppm * k, flat = o.floor !== undefined, side = o.side ?? 0;
  const [c, g] = mkCanvas(Math.round(W * k), Math.round(Hh * k));
  const place = (gg = g) => flat ? gg.setTransform(s, 0, 0, s, -x1 * s, -y1 * s) : side > 0 ? gg.setTransform(-s, 0, 0, -s, x2 * s, y2 * s) : gg.setTransform(s, 0, 0, -s, -x1 * s, y2 * s);   // 平铺时画布上方是远处；朝 +x 的那面，画布从左到右是 z 从大到小
  g.save(); place(); blurDraw(g, o.blur, draw, o.blurOnce); g.restore(); place();
  g.globalCompositeOperation = 'destination-out';
  for (const [w, a, b] of [[o.fadeL, x1, 1], [o.fadeR, x2, -1]]) if (w) {     // 两端渐隐：和相邻章节的远景接上时看不出边
    const gr = g.createLinearGradient(a, 0, a + b * w, 0); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(Math.min(a, a + b * w), y1, w, y2 - y1);
  }
  const tex = canvasTex(c);
  const mat = o.lit ? new THREE.MeshLambertMaterial({ map: tex, transparent: true, depthWrite: false, opacity: o.opacity ?? 1 })
    : new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, fog: o.fog !== false, opacity: o.opacity ?? 1 });
  if (o.additive) mat.blending = THREE.AdditiveBlending;
  mat.userData.own = true;                          // 这一章被卸载时，连同贴图一起释放
  const m = new THREE.Mesh(new THREE.PlaneGeometry(x2 - x1, y2 - y1), mat); m.receiveShadow = !!o.lit;
  if (flat) { m.rotation.x = -Math.PI / 2; m.position.set((x1 + x2) / 2, o.floor, (y1 + y2) / 2); }
  else if (side) { m.rotation.y = side < 0 ? -Math.PI / 2 : Math.PI / 2; m.position.set(z, (y1 + y2) / 2, (x1 + x2) / 2); }
  else m.position.set((x1 + x2) / 2, (y1 + y2) / 2, z);
  m.renderOrder = o.order ?? Math.round(z * 4);
  ROOT.add(m); renderer.initTexture(tex); return m;
}
// 让一块布景板按它画出来的形状投下真的影子（太阳很低时，树篱和树的长影子用）：一个看不见的替身，用同一张贴图做透明测试，只进影子贴图。
// 返回原来那块板子。贴图和几何体是共用的，卸载时会释放两次，没有关系
function castShadowFrom(m) {
  const mat = new THREE.MeshBasicMaterial({ map: m.material.map, alphaTest: 0.5, colorWrite: false, depthWrite: false, side: THREE.DoubleSide });
  mat.userData.own = true;
  const p = new THREE.Mesh(m.geometry, mat); p.position.copy(m.position); p.rotation.copy(m.rotation); p.castShadow = true;
  m.parent.add(p); return m;
}

// ---- 画笔小工具（坐标都是米，y 向上）----
const box = (g, x, y, w, h) => g.fillRect(x, y, w, h);
function poly(g, pts) { g.beginPath(); pts.forEach(([x, y], i) => g[i ? 'lineTo' : 'moveTo'](x, y)); g.closePath(); g.fill(); }
function line(g, pts, lw) { g.lineWidth = lw; g.beginPath(); pts.forEach(([x, y], i) => g[i ? 'lineTo' : 'moveTo'](x, y)); g.stroke(); }
function cable(g, x1, y1, x2, y2, sag, lw = 0.05) {      // 下垂的缆线
  g.lineWidth = lw; g.beginPath(); g.moveTo(x1, y1); g.quadraticCurveTo((x1 + x2) / 2, (y1 + y2) / 2 - 2 * sag, x2, y2); g.stroke();
}
function truss(g, x1, x2, y, h, lw = 0.09) {             // 桁架梁：上下弦 + 斜撑
  box(g, x1, y, x2 - x1, lw * 1.6); box(g, x1, y + h - lw * 1.6, x2 - x1, lw * 1.6);
  const n = Math.max(2, Math.round((x2 - x1) / h)), pts = [];
  for (let i = 0; i <= n; i++) pts.push([x1 + (x2 - x1) * i / n, y + (i % 2 ? h : 0)]);
  line(g, pts, lw);
}
function ring(g, x, y, r, lw) { g.lineWidth = lw; g.beginPath(); g.arc(x, y, r, 0, 6.2832); g.stroke(); }
function disc(g, x, y, r) { g.beginPath(); g.arc(x, y, r, 0, 6.2832); g.fill(); }
function fan(g, x, y, r) {                               // 大型排风扇
  ring(g, x, y, r, r * 0.16); disc(g, x, y, r * 0.2);
  for (let i = 0; i < 6; i++) { const a = i / 6 * 6.2832 + 0.3; poly(g, [[x, y], [x + Math.cos(a) * r, y + Math.sin(a) * r], [x + Math.cos(a + 0.42) * r, y + Math.sin(a + 0.42) * r]]); }
}
function heap(g, x1, x2, y0, hMin, hMax, step = 0.5) {   // 高低不平的废料堆
  const pts = [[x1, y0 - 4]];
  for (let x = x1; x <= x2; x += step * rr(0.5, 1.5)) pts.push([x, y0 + rr(hMin, hMax)]);
  pts.push([x2, y0 - 4]); poly(g, pts);
}
function setInk(g, col) { g.fillStyle = col; g.strokeStyle = col; g.lineCap = 'round'; g.lineJoin = 'round'; }
function hull(pts) {                                     // 一堆点的外轮廓（凸包），按顺序给出，可以直接交给 poly
  const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
  for (const q of p) { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (const q of p.reverse()) { while (up.length > 1 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}
function vgrad(g, y0, y1, c0, c1) { const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, c0); gr.addColorStop(1, c1); return gr; }

// 沿着高度函数 f(x) 起伏的一条轮廓，下面一直填到 y0
function ridge(g, x1, x2, y0, f, step = 1) {
  const pts = [[x1, y0]]; for (let x = x1; x < x2; x += step) pts.push([x, f(x)]);
  pts.push([x2, f(x2)], [x2, y0]); poly(g, pts);
}
// 一根带分叉的枯枝
function twig(g, x, y, a, len, w, depth) {
  const x2 = x + Math.sin(a) * len, y2 = y + Math.cos(a) * len; line(g, [[x, y], [x2, y2]], w);
  if (depth > 0) for (let i = 0, n = rnd() < 0.5 ? 2 : 3; i < n; i++) { const k = rr(0.45, 1); twig(g, lerp(x, x2, k), lerp(y, y2, k), a + rr(-0.95, 0.95), len * rr(0.45, 0.7), w * 0.62, depth - 1); }
}
// 树的剪影：round 阔叶树 / pine 针叶树 / dead 枯树 / trim 被修剪成一个样子的“标准树”
function tree(g, x, y, h, kind = 'round') {
  const w = h * 0.03 + 0.06;
  if (kind === 'pine') {
    poly(g, [[x - w, y], [x + w, y], [x + w * 0.3, y + h], [x - w * 0.3, y + h]]);
    for (let i = 0; i < 7; i++) { const k = i / 7, yy = y + h * (0.2 + 0.8 * k), r = h * 0.19 * (1 - k * 0.85) * rr(0.8, 1.15); poly(g, [[x - r, yy], [x + r, yy], [x + r * 0.12, yy + h * 0.2], [x - r * 0.12, yy + h * 0.2]]); }
    return;
  }
  if (kind === 'trim') {                                 // 一模一样的树干 + 一模一样的球
    box(g, x - 0.09, y, 0.18, h * 0.62); disc(g, x, y + h * 0.74, h * 0.26); return;
  }
  poly(g, [[x - w * 1.6, y], [x + w * 1.6, y], [x + w * 0.7, y + h * 0.6], [x - w * 0.7, y + h * 0.6]]);
  if (kind === 'dead') { twig(g, x, y + h * 0.5, rr(-0.15, 0.15), h * 0.42, w * 1.2, 3); twig(g, x, y + h * 0.35, rr(0.5, 1) * (rnd() < 0.5 ? -1 : 1), h * 0.3, w * 0.8, 2); return; }
  for (let i = 0; i < 3; i++) twig(g, x, y + h * rr(0.35, 0.58), rr(-0.9, 0.9), h * rr(0.2, 0.32), w * 0.8, 1);
  for (let i = 0, n = 9 + Math.floor(h * 0.5); i < n; i++) { const a = rr(0, 6.2832), r = Math.sqrt(rnd()); disc(g, x + Math.cos(a) * r * h * 0.3, y + h * 0.74 + Math.sin(a) * r * h * 0.2, h * rr(0.09, 0.17)); }
}
// 一栋楼的剪影：窗洞是镂空的，能透出后面一层。holes 镂空的比例，roof 楼顶要不要加杂物
function building(g, x, y, w, h, o = {}) {
  box(g, x, y, w, h);
  const ww = o.win ?? 0.9, wh = o.winH ?? 1.25, gx = o.gx ?? 2.2, gy = o.gy ?? 3.1;
  for (let yy = y + (o.base ?? 3.6); yy < y + h - wh - 0.5; yy += gy) for (let xx = x + 0.8; xx < x + w - ww - 0.4; xx += gx)
    if (rnd() < (o.holes ?? 0.45)) g.clearRect(xx, yy, ww, wh);
  if (o.roof === false) return;
  const t = rnd();
  if (t < 0.3) { box(g, x + w * rr(0.1, 0.55), y + h, w * 0.24, rr(0.8, 2.2)); line(g, [[x + w * 0.8, y + h], [x + w * 0.8, y + h + rr(2, 5)]], 0.1); }
  else if (t < 0.55) { for (let i = 0; i < 3; i++) line(g, [[x + w * rr(0.1, 0.9), y + h], [x + w * rr(0.1, 0.9), y + h + rr(1, 4)]], 0.1); }
  else if (t < 0.8) poly(g, [[x, y + h], [x + w * rr(0.15, 0.45), y + h + rr(1, 3.5)], [x + w * rr(0.5, 0.8), y + h + rr(0.2, 1.2)], [x + w, y + h]]);   // 塌了一角的顶
}
function grass(g, x1, x2, yf, hMin, hMax, n) {           // 一丛丛草叶
  for (let i = 0; i < n; i++) { const x = rr(x1, x2), y = yf(x), h = rr(hMin, hMax), l = rr(-0.35, 0.35) * h; poly(g, [[x - 0.035, y - 0.06], [x + 0.035, y - 0.06], [x + l, y + h]]); }
}
function fence(g, x1, x2, yf, h, step = 2.2, wires = [0.45, 0.72, 0.95]) {   // 铁丝网：桩 + 几道线
  for (let x = x1; x <= x2; x += step) line(g, [[x, yf(x) - 0.2], [x + rr(-0.1, 0.1), yf(x) + h]], 0.09);
  for (const k of wires) for (let x = x1; x < x2 - 0.01; x += step) { const b = Math.min(x2, x + step); cable(g, x, yf(x) + h * k, b, yf(b) + h * k, 0.05, 0.03); }
}

// ---- 带字 / 带图标的小贴图：只用来标出机器的状态 ----
function textTex(str, o = {}) {
  const w = o.w ?? 256, h = o.h ?? 64, [c, g] = mkCanvas(w, h);
  if (o.bg) { g.fillStyle = o.bg; g.fillRect(0, 0, w, h); }
  g.fillStyle = o.color ?? '#d8e2e2'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `${o.weight ?? 700} ${o.size ?? Math.round(h * 0.56)}px "PingFang SC","Hiragino Sans GB","Microsoft YaHei","Arial Narrow",Arial,sans-serif`;
  const lines = String(str).split('\n'); lines.forEach((s, i) => g.fillText(s, w / 2, h * (i + 0.5) / lines.length + (o.dy ?? 0)));
  if (o.worn) {                                          // 磨掉一些漆
    let seed = o.worn; const rn = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000';
    for (let i = 0; i < w * h / 70; i++) { g.globalAlpha = 0.2 + 0.6 * rn(); g.fillRect(rn() * w, rn() * h, 1 + rn() * 4, 1 + rn() * 2); }
  }
  return canvasTex(c);
}
const _icons = {};
function iconTex(kind) {                                 // 白色线条图标：drop 水 / eye 监控 / leaf 灌溉 / bolt 电 / cross 拒绝 / tick 通过 / bot 机器人
  if (_icons[kind]) return _icons[kind];
  const [c, g] = mkCanvas(128, 128); g.strokeStyle = g.fillStyle = '#fff'; g.lineWidth = 9; g.lineCap = g.lineJoin = 'round';
  g.translate(64, 64);
  if (kind === 'drop') { g.beginPath(); g.moveTo(0, -42); g.bezierCurveTo(30, -4, 34, 14, 0, 40); g.bezierCurveTo(-34, 14, -30, -4, 0, -42); g.closePath(); g.stroke(); g.beginPath(); g.arc(-4, 12, 12, 1.2, 2.6); g.stroke(); }
  else if (kind === 'eye') { g.beginPath(); g.moveTo(-46, 0); g.quadraticCurveTo(0, -42, 46, 0); g.quadraticCurveTo(0, 42, -46, 0); g.closePath(); g.stroke(); g.beginPath(); g.arc(0, 0, 13, 0, 6.2832); g.fill(); }
  else if (kind === 'leaf') { g.beginPath(); g.moveTo(-4, 44); g.lineTo(-4, 4); g.stroke(); g.beginPath(); g.moveTo(-4, 6); g.quadraticCurveTo(-46, 0, -40, -38); g.quadraticCurveTo(-2, -30, -4, 6); g.closePath(); g.stroke(); g.beginPath(); g.moveTo(-4, 20); g.quadraticCurveTo(36, 18, 38, -16); g.quadraticCurveTo(4, -12, -4, 20); g.closePath(); g.stroke(); }
  else if (kind === 'bolt') { g.beginPath(); g.moveTo(12, -46); g.lineTo(-22, 6); g.lineTo(2, 6); g.lineTo(-12, 46); g.lineTo(24, -8); g.lineTo(0, -8); g.closePath(); g.fill(); }
  else if (kind === 'cross') { g.lineWidth = 14; g.beginPath(); g.moveTo(-32, -32); g.lineTo(32, 32); g.moveTo(32, -32); g.lineTo(-32, 32); g.stroke(); }
  else if (kind === 'tick') { g.lineWidth = 14; g.beginPath(); g.moveTo(-36, 2); g.lineTo(-10, 30); g.lineTo(38, -30); g.stroke(); }
  else if (kind === 'bot') { g.beginPath(); g.arc(0, -22, 20, Math.PI, 0); g.lineTo(20, -8); g.lineTo(-20, -8); g.closePath(); g.stroke(); g.strokeRect(-17, 2, 34, 34); g.beginPath(); g.moveTo(-9, 36); g.lineTo(-9, 50); g.moveTo(9, 36); g.lineTo(9, 50); g.stroke(); }
  return _icons[kind] = sharedTex(canvasTex(c));
}
