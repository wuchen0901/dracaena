
// ============================================================
//  空中的细节（一）：画法和公用的几种东西
//  飞落的尘埃、飘荡的落叶、风沙、纸片和塑料袋、蠓虫、飞蛾、苍蝇、蜻蜓、蝴蝶、远处的鸟群、萤火虫。
//  这些小东西都用“点”来画：一个点就是一张面朝镜头的小贴图，一整团只占一次绘制。
//  每一颗有自己的大小（米）、透明度、转角、翻面（叶子翻过来的时候变窄，负数是左右镜像）、颜色，用贴图集里的哪一格。
//  近处会被惊飞的鸟是立体的小模型（71-air-birds.js）；每一章摆什么在 72-air-chapters.js 里。
//  运行时的随机数一律用 Math.random（ar），不碰搭场景用的那一套固定种子
// ============================================================
const ar = (a, b) => a + (b - a) * Math.random();
const AIR_SCALE = { value: 1000 };                       // 一米大的东西放在一米远处，画出来是多少个像素（随画布大小和视角变，每帧更新）
const TAN_HALF = () => Math.tan(camera.fov * Math.PI / 360);
const viewTop = z => camera.position.y + (camera.position.z - z) * TAN_HALF();                 // 深度 z 处，画面上沿有多高
const viewHalfW = z => (camera.position.z - z) * TAN_HALF() * camera.aspect;                   // 深度 z 处，画面有多宽（一半）
const inView = (x, z, m = 1) => Math.abs(x - camera.position.x) < viewHalfW(z) + m;
function airTick() { AIR_SCALE.value = renderer.domElement.height / (2 * TAN_HALF()); }
const _cols = new Map();
const airCol = h => { if (!_cols.has(h)) _cols.set(h, new THREE.Color(h)); return _cols.get(h); };   // 0xRRGGBB → 线性空间的颜色（同一个颜色只建一次）
const pickOf = arr => arr[Math.floor(Math.random() * arr.length)];

// ---- 贴图集：4×4 格，每格 64 像素，全是白色的形状（颜色由每一颗自己乘上去）----
// 0 圆点  1 一道细长的沙痕  2–5 四种叶子  6 纸片  7 塑料袋  8 一朵草籽的绒毛  9 / 10 蜻蜓（翅膀上 / 下）
// 11 / 12 蝴蝶（张开 / 合上）  13 飞蛾  14 / 15 远处的鸟（翅膀往下 / 往上）
const AIR_TEX = (() => {
  const [c, g] = mkCanvas(256, 256);
  const tile = (i, fn) => { g.save(); g.translate((i % 4) * 64 + 32, Math.floor(i / 4) * 64 + 32); g.scale(32, 32); g.fillStyle = g.strokeStyle = '#fff'; g.lineCap = g.lineJoin = 'round'; fn(); g.restore(); };
  const ell = (x, y, rx, ry, a = 0, gg = g) => { gg.beginPath(); gg.ellipse(x, y, rx, ry, a, 0, 6.2832); gg.fill(); };
  const path = (pts, close = true, gg = g) => { gg.beginPath(); pts.forEach(([x, y], k) => gg[k ? 'lineTo' : 'moveTo'](x, y)); if (close) gg.closePath(); };
  tile(0, () => { const gr = g.createRadialGradient(0, 0, 0, 0, 0, 0.92); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.3, 'rgba(255,255,255,.85)'); gr.addColorStop(0.6, 'rgba(255,255,255,.28)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(-1, -1, 2, 2); });
  tile(1, () => { const gr = g.createLinearGradient(-0.9, 0, 0.9, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.3, 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; ell(0, 0, 0.9, 0.07); });
  tile(2, () => { path([[0, -0.82], [0.36, -0.3], [0.32, 0.25], [0, 0.6], [-0.32, 0.25], [-0.36, -0.3]]); g.fill(); g.lineWidth = 0.07; path([[0, -0.6], [0, 0.88]], false); g.stroke(); });
  tile(3, () => { g.beginPath(); for (let k = 0; k <= 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? 0.34 : 0.78; g[k ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r - 0.05); } g.closePath(); g.fill(); g.lineWidth = 0.07; path([[0, 0.2], [0.05, 0.85]], false); g.stroke(); });
  tile(4, () => { g.beginPath(); g.moveTo(0, -0.86); g.quadraticCurveTo(0.3, 0, 0.02, 0.84); g.quadraticCurveTo(-0.16, 0, 0, -0.86); g.fill(); });
  tile(5, () => { path([[0, -0.62], [0.3, -0.36], [0.4, 0.05], [0.24, 0.38], [0, 0.46], [-0.24, 0.38], [-0.4, 0.05], [-0.3, -0.36]]); g.fill(); g.lineWidth = 0.06; path([[0, 0.4], [0, 0.8]], false); g.stroke(); });
  tile(6, () => { path([[-0.62, -0.42], [0.5, -0.6], [0.66, 0.38], [-0.5, 0.56]]); g.fill(); g.fillStyle = 'rgba(150,150,150,1)'; path([[-0.05, -0.52], [0.66, 0.38], [0.1, -0.5]]); g.fill(); });
  tile(7, () => { g.globalAlpha = 0.72; g.beginPath(); g.moveTo(-0.5, -0.3); g.bezierCurveTo(-0.7, 0.4, -0.2, 0.75, 0.2, 0.62); g.bezierCurveTo(0.7, 0.45, 0.62, -0.2, 0.45, -0.32); g.closePath(); g.fill();
    g.lineWidth = 0.1; for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(sx * 0.3, -0.48, 0.14, 0.24, 0, 0, 6.2832); g.stroke(); } });
  tile(8, () => { g.lineWidth = 0.035; for (let k = 0; k < 16; k++) { const a = k / 16 * 6.2832 - Math.PI / 2; g.beginPath(); g.moveTo(0, 0.1); g.lineTo(Math.cos(a) * 0.62, Math.sin(a) * 0.55 - 0.08); g.stroke(); ell(Math.cos(a) * 0.62, Math.sin(a) * 0.55 - 0.08, 0.06, 0.06); } ell(0, 0.12, 0.1, 0.1); g.lineWidth = 0.05; path([[0, 0.12], [0.02, 0.8]], false); g.stroke(); });
  const dragon = up => { g.globalAlpha = 0.55; for (const [x, rx] of [[0.22, 0.5], [-0.04, 0.46]]) ell(x - 0.12, up ? -0.3 : 0.26, rx * 0.36, 0.11, up ? -0.5 : 0.35); g.globalAlpha = 1; g.lineWidth = 0.09; path([[-0.88, 0.02], [0.62, 0]], false); g.stroke(); ell(0.68, 0, 0.12, 0.1); };
  tile(9, () => dragon(true)); tile(10, () => dragon(false));
  tile(11, () => { for (const sx of [-1, 1]) { ell(sx * 0.36, -0.16, 0.36, 0.3, sx * 0.4); ell(sx * 0.26, 0.28, 0.24, 0.2, -sx * 0.3); } g.lineWidth = 0.08; path([[0, -0.36], [0, 0.4]], false); g.stroke(); });
  tile(12, () => { ell(0.02, -0.32, 0.2, 0.42, 0.15); g.lineWidth = 0.08; path([[-0.42, 0.12], [0.46, 0.1]], false); g.stroke(); });
  tile(13, () => blurDraw(g, 1.2, t => { path([[0, -0.1], [-0.72, -0.42], [-0.62, 0.32], [0, 0.18], [0.62, 0.32], [0.72, -0.42]], true, t); t.fill(); ell(0, 0, 0.1, 0.36, 0, t); }));
  tile(14, () => { g.lineWidth = 0.16; g.beginPath(); g.moveTo(-0.84, 0.32); g.quadraticCurveTo(-0.4, -0.12, 0, 0.04); g.quadraticCurveTo(0.4, -0.12, 0.84, 0.32); g.stroke(); ell(0, 0.06, 0.2, 0.12); });
  tile(15, () => { g.lineWidth = 0.16; g.beginPath(); g.moveTo(-0.82, -0.5); g.quadraticCurveTo(-0.36, -0.06, 0, 0.12); g.quadraticCurveTo(0.36, -0.06, 0.82, -0.5); g.stroke(); ell(0, 0.12, 0.2, 0.12); });
  const t = sharedTex(canvasTex(c)); t.anisotropy = 1; return t;
})();

// ---- 画这些点的着色器 ----
const AIR_VS = `
  attribute float aSize; attribute float aAlpha; attribute float aRot; attribute float aFlip; attribute float aTile; attribute vec3 aCol;
  uniform float uScale;
  varying float vA; varying float vF; varying float vT; varying vec3 vC; varying vec2 vR;
  #include <fog_pars_vertex>
  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    float px = aSize * uScale / max(-mvPosition.z, 0.1);
    gl_PointSize = clamp(px, 1.0, 300.0);
    vA = aAlpha * clamp(px * px, 0.0, 1.0);              // 比一个像素还小的：画成一个像素，但淡下去
    vF = aFlip; vT = aTile; vC = aCol; vR = vec2(cos(aRot), sin(aRot));
    #include <fog_vertex>
  }`;
const AIR_FS = `
  uniform sampler2D uTex;
  varying float vA; varying float vF; varying float vT; varying vec3 vC; varying vec2 vR;
  #include <fog_pars_fragment>
  void main() {
    vec2 p = gl_PointCoord - 0.5;
    p = vec2(vR.x * p.x + vR.y * p.y, -vR.y * p.x + vR.x * p.y);
    p.x /= (vF < 0.0 ? -1.0 : 1.0) * max(abs(vF), 0.06);
    if (abs(p.x) > 0.5 || abs(p.y) > 0.5) discard;
    vec2 cell = vec2(mod(vT, 4.0), floor(vT / 4.0));
    vec4 t = texture2D(uTex, vec2((cell.x + p.x + 0.5) / 4.0, 1.0 - (cell.y + p.y + 0.5) / 4.0));
    float a = t.a * vA; if (a < 0.003) discard;
    gl_FragColor = vec4(vC * t.rgb, a);
    #include <fog_fragment>
    #include <colorspace_fragment>
  }`;

// ---- 一团点：o.init(s) 出生时摆好，o.step(s, dt) 每帧动一下；o.pre(dt) 每帧先算一次大家共用的东西 ----
// s 上要填：x y z 位置，size 大小（米），a 透明度，rot 转角，flip 翻面，tile 贴图格，c 颜色（airCol 给的）
// o.add 叠加发光（尘埃、萤火虫；不受雾影响），否则是普通的半透明、受雾影响；o.order 绘制次序；o.tex 换一张自己的贴图集（也是 4×4 格）
function airCloud(R, n, o) {
  const geo = new THREE.BufferGeometry(), at = {};
  for (const [k, w] of [['position', 3], ['aSize', 1], ['aAlpha', 1], ['aRot', 1], ['aFlip', 1], ['aTile', 1], ['aCol', 3]]) {
    at[k] = new THREE.BufferAttribute(new Float32Array(n * w), w); at[k].setUsage(THREE.DynamicDrawUsage); geo.setAttribute(k, at[k]);
  }
  const mat = new THREE.ShaderMaterial({ uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTex: { value: o.tex ?? AIR_TEX }, uScale: AIR_SCALE },
    vertexShader: AIR_VS, fragmentShader: AIR_FS, transparent: true, depthWrite: false, fog: !o.add && o.fog !== false, blending: o.add ? THREE.AdditiveBlending : THREE.NormalBlending });
  mat.userData.own = true;
  const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; pts.renderOrder = o.order ?? 46; R.add(pts);
  const list = [];
  for (let i = 0; i < n; i++) { const s = { i, x: 0, y: -60, z: 0, size: 0.05, a: 0, rot: 0, flip: 1, tile: 0, c: airCol(0xffffff) }; o.init(s); list.push(s); }
  const C = { pts, list, k: 1, name: o.name, step(dt) {
    if (!pts.visible) return;
    if (o.pre) o.pre(dt);
    const P_ = at.position.array, S_ = at.aSize.array, A_ = at.aAlpha.array, Ro = at.aRot.array, F_ = at.aFlip.array, Ti = at.aTile.array, Co = at.aCol.array;
    for (const s of list) {
      o.step(s, dt);
      const i = s.i, j = i * 3; P_[j] = s.x; P_[j + 1] = s.y; P_[j + 2] = s.z; S_[i] = s.size; A_[i] = s.a * C.k; Ro[i] = s.rot; F_[i] = s.flip; Ti[i] = s.tile;
      Co[j] = s.c.r; Co[j + 1] = s.c.g; Co[j + 2] = s.c.b;
    }
    for (const k in at) at[k].needsUpdate = true;
  } };
  return C;
}

// ---- 光里的尘埃：一颗颗在光里出生，慢慢往下落，飘出光就暗了。lights 是一组“光的范围”----
//   slab 斜着的一道光（天窗、枝叶间漏下来的）{ x0 落地处的中心, x1 顶上的中心, y0, y1, w0 / w1 底下 / 顶上的半宽, z0, z1 }
//   cone 一束聚光（探照灯、监控、吊灯）{ at() 返回 [灯的位置 [x,y,z], 照向的点 [x,y,z], 亮度 0..1], ang 半张角 }
//   ball 一团灯光 { p: [x,y,z], r 半径 }
//   back 逆光：尘埃挡在一面发光的墙前面的时候亮 { z 墙在哪, lum(x, y) 墙上这一点多亮（0..1）, box: [x1, x2, y1, y2, z1, z2] 在哪里出生（x 只在镜头看得见的那一段里取）}
//   drip 从高处一缕一缕漏下来的灰 { p: [x, y, z], spread 横着散开多宽 }
//   每一种都可以带 c 颜色、a 亮度、w 分到多少颗（数字或者返回数字的函数）、on() 现在有没有
function litDust(R, n, lights, o = {}) {
  const ax = V3(0, 0, 0), u = V3(0, 0, 0), w = V3(0, 0, 0), v = V3(0, 0, 0);
  const cone = L => { if (!L._f) { const [p, q, k] = L.at(); L._p = p; L._q = q; L._k = k; L._f = true; } return L; };
  function level(L, s) {
    if (L.k === 'slab') { const t = (s.y - L.y0) / (L.y1 - L.y0); if (t < 0 || t > 1) return 0; const cx = lerp(L.x0, L.x1, t), hw = lerp(L.w0, L.w1, t);
      return (1 - sstep(hw * 0.5, hw, Math.abs(s.x - cx))) * (1 - sstep(0, 1, Math.max(L.z0 - s.z, s.z - L.z1))) * lerp(0.45, 1, t); }
    if (L.k === 'cone') { cone(L); if (L._k <= 0) return 0; const p = L._p, q = L._q; ax.set(q[0] - p[0], q[1] - p[1], q[2] - p[2]); const len = ax.length(); ax.divideScalar(len);
      v.set(s.x - p[0], s.y - p[1], s.z - p[2]); const d = v.dot(ax); if (d <= 0) return 0; const r = v.addScaledVector(ax, -d).length(), rr_ = d * Math.tan(L.ang);
      return L._k * (1 - sstep(rr_ * 0.4, rr_ * 1.05, r)) * (1 - sstep(len * 0.92, len * 1.12, d)); }
    if (L.k === 'ball') return Math.pow(Math.max(0, 1 - Math.hypot(s.x - L.p[0], s.y - L.p[1], s.z - L.p[2]) / L.r), 1.6);
    if (L.k === 'back') { const c = camera.position, k = (L.z - c.z) / (s.z - c.z); return L.lum(c.x + (s.x - c.x) * k, c.y + (s.y - c.y) * k); }
    return 1;
  }
  function sample(L, s) {                                // 在这道光里找一个出生的地方
    if (L.k === 'slab') { const t = ar(0.03, 0.95), hw = lerp(L.w0, L.w1, t); s.y = lerp(L.y0, L.y1, t); s.x = lerp(L.x0, L.x1, t) + ar(-hw, hw) * 0.85; s.z = ar(L.z0, L.z1); }
    else if (L.k === 'cone') { const p = L._p, q = L._q; ax.set(q[0] - p[0], q[1] - p[1], q[2] - p[2]); const len = ax.length(); ax.divideScalar(len);
      u.set(0, 1, 0).cross(ax); if (u.lengthSq() < 1e-4) u.set(1, 0, 0).cross(ax); u.normalize(); w.crossVectors(ax, u);
      const d = len * Math.sqrt(ar(0.04, 1.02)), r = d * Math.tan(L.ang) * Math.sqrt(Math.random()) * 0.9, a = ar(0, 6.2832), ca = Math.cos(a) * r, sa = Math.sin(a) * r;
      s.x = p[0] + ax.x * d + u.x * ca + w.x * sa; s.y = p[1] + ax.y * d + u.y * ca + w.y * sa; s.z = p[2] + ax.z * d + u.z * ca + w.z * sa; }
    else if (L.k === 'ball') { const a = ar(0, 6.2832), b = Math.acos(ar(-1, 1)), r = L.r * Math.cbrt(Math.random()) * 0.9; s.x = L.p[0] + r * Math.sin(b) * Math.cos(a); s.y = L.p[1] + r * Math.cos(b); s.z = L.p[2] + r * Math.sin(b) * Math.sin(a); }
    else if (L.k === 'back') { const B = L.box; s.z = ar(B[4], B[5]); s.x = clamp(camera.position.x + ar(-1, 1) * (viewHalfW(s.z) + 1), B[0], B[1]); s.y = ar(B[2], B[3]); }
    else { s.x = L.p[0] + ar(-1, 1) * (L.spread ?? 0.1); s.y = L.p[1]; s.z = L.p[2] + ar(-0.08, 0.08); }
  }
  const wOf = L => (L.on && !L.on()) || (L.k === 'cone' && cone(L)._k <= 0) ? 0 : typeof L.w === 'function' ? L.w() : L.w ?? 1;
  function born(s) {
    s.age = 0; s.life = 0.25; s.L = null;
    let tot = 0; for (const L of lights) tot += L._w = wOf(L);
    if (tot <= 0) return;
    let r = Math.random() * tot, L = lights[0]; for (const l of lights) if ((r -= l._w) <= 0) { L = l; break; }
    sample(L, s);
    const drip = L.k === 'drip';
    if (!inView(s.x, s.z, 1.5) || (!drip && (s.y > viewTop(s.z) + 0.5 || s.y < groundY(s.x) + 0.05))) return;   // 落在画面外面的不要，过一会儿再试（漏下来的灰可以从画面上面开始落）
    s.L = L; s.life = drip ? 9 : ar(3, 7); s.ph = ar(0, 6.28); s.tw = ar(2, 7); s.b = ar(0.45, 1); s.fall = drip ? 0 : ar(0.03, 0.13); s.vy = drip ? ar(-0.4, -0.1) : 0;
    s.size = (drip ? ar(0.035, 0.06) : ar(0.06, 0.12)) * (o.size ?? 1); s.c = airCol(L.c ?? o.c ?? 0xdfeef2);
  }
  return airCloud(R, n, { add: o.add ?? true, order: o.order ?? 47, name: o.name ?? 'dust',   // o.add = false：画成暗色的小点（挡在很亮的东西前面的灰）
    pre() { for (const L of lights) L._f = false; },
    init(s) { s.age = 0; s.life = 0; s.tile = 0; },
    step(s, dt) {
      s.age += dt; if (s.age >= s.life) born(s);
      const L = s.L; if (!L) { s.a = 0; return; }
      if (L.k === 'drip') { s.vy = Math.max(-2.6, s.vy - 3.2 * dt); s.x += 0.05 * Math.sin(T * 3 + s.ph) * dt; s.y += s.vy * dt; if (s.y < groundY(s.x) + 0.05) s.age = s.life; }
      else { s.x += (0.07 * Math.sin(T * 0.7 + s.ph) + E.wind * 0.25) * dt; s.y += (-s.fall + 0.05 * Math.sin(T * 0.9 + s.ph * 1.3)) * dt; s.z += 0.05 * Math.cos(T * 0.6 + s.ph) * dt; }
      const life = sstep(0, 0.7, s.age) * (1 - sstep(s.life - 0.9, s.life, s.age));
      s.a = life * level(L, s) * (L.a ?? 1) * s.b * (0.6 + 0.4 * Math.sin(T * s.tw + s.ph));
    } });
}

// ---- 飘落的叶子（也用来画纸片、塑料袋、草籽的绒毛这些被风带着走的东西）----
// o: n 几片, xs: [[x1, x2], ...] 只在这几段 x 的上空落（树底下）, z: [z1, z2], cols 颜色, tiles 用哪几格贴图, size [小, 大]（米）,
//    fall [慢, 快]（米/秒）, wind() 风（米/秒，负的往左；不写就跟着环境里的风）, a 透明度, on() 现在有没有新的落下来,
//    drift: true 不往下落，随风贴着地面飘（纸片、塑料袋、绒毛）：lo / hi 离地多高，lift 被风托起来多少
function airLeaves(R, o) {
  const wind = o.wind ?? (() => E.wind * 1.6), xs = o.xs, Z = o.z ?? [-6, 4], fall = o.fall ?? [0.35, 0.8], size = o.size ?? [0.06, 0.11];
  const okX = x => !xs || xs.some(([a, b]) => x > a && x < b);
  function born(s, first) {
    s.a = 0; s.land = 0; s.age = 0; s.wait = 0;
    if (o.on && !o.on()) { s.wait = ar(0.5, 2); return; }
    s.z = ar(Z[0], Z[1]); const hw = viewHalfW(s.z) + 1.5, cx = camera.position.x;
    if (o.drift) s.x = first ? cx + ar(-hw, hw) : cx - Math.sign(wind() || -1) * hw;
    else { let k = 0; do s.x = cx + ar(-hw, hw); while (!okX(s.x) && ++k < 10); if (!okX(s.x)) { s.wait = ar(0.3, 1); return; } }
    const g = groundY(s.x);
    s.y = o.drift ? g + ar(o.lo ?? 0.1, o.hi ?? 1.6) : first ? ar(g + 0.3, viewTop(s.z)) : viewTop(s.z) + ar(0.1, 1.2);
    s.fall = ar(fall[0], fall[1]); s.f = ar(1.4, 2.6); s.ph = ar(0, 6.28); s.sw = ar(0.25, 0.7); s.spin = Math.random() < 0.3 ? ar(-4, 4) : 0;
    s.tile = pickOf(o.tiles ?? [2, 3, 4, 5]); s.c = airCol(pickOf(o.cols ?? [0x8a6a3a])); s.size = ar(size[0], size[1]); s.r0 = ar(-1, 1); s.k = ar(0.8, 1.2);
  }
  return airCloud(R, o.n ?? 30, { name: o.name ?? 'leaves', order: o.order ?? 45,
    init(s) { born(s, true); },
    step(s, dt) {
      if (s.wait > 0) { s.wait -= dt; s.a = 0; if (s.wait <= 0) born(s); return; }
      s.age += dt; s.ph += dt * s.f; const sw = Math.sin(s.ph), wnd = wind() * s.k, g = groundY(s.x);
      if (o.drift) {
        s.x += (wnd + 0.3 * sw) * dt; s.y += (0.5 * Math.sin(s.ph * 0.37 + s.i) + (o.lift ?? 0.1) * Math.abs(wnd) * Math.sin(T * 0.3 + s.i)) * dt;
        s.y = clamp(s.y, g + (o.lo ?? 0.05), g + (o.hi ?? 2)); s.rot = s.r0 + s.age * (s.spin || 1.2) * Math.sign(wnd || 1); s.flip = Math.cos(s.ph * 0.8);
      } else if (s.land > 0) { s.land += dt; s.x += wnd * 0.1 * dt; }
      else {
        s.x += (wnd + sw * s.sw) * dt; s.y -= s.fall * (0.45 + 0.55 * sw * sw) * dt; s.rot = s.r0 + 0.55 * Math.cos(s.ph) + s.spin * s.age; s.flip = Math.cos(s.ph * 0.75 + s.i);
        if (s.y < g + 0.03) { s.y = g + 0.03; s.land = 0.001; s.flip = 0.3; }
      }
      s.a = (o.a ?? 1) * (s.land > 0 ? 1 - sstep(0.4, 1.6, s.land) : sstep(0, 0.5, s.age));
      if (s.land > 1.6 || Math.abs(s.x - camera.position.x) > viewHalfW(s.z) + 2.5) born(s);
    } });
}

// ---- 风沙：贴着地面被风吹着走的沙粒（一道道细长的痕），一跳一跳的；刮阵风的时候又多又快 ----
// o: n, wind 风速（米/秒，负的往左）, gust() 现在风有多大（0..1.5）, z, h 最高吹到离地多高, cols, a
function airSand(R, o) {
  const Z = o.z ?? [-7, 6];
  const born = (s, first) => { s.z = ar(Z[0], Z[1]); const hw = viewHalfW(s.z) + 2, cx = camera.position.x; s.x = first ? cx + ar(-hw, hw) : cx - Math.sign(o.wind) * hw * ar(0.85, 1);
    s.h = (o.h ?? 1.4) * Math.pow(Math.random(), 2.4); s.k = ar(0.65, 1.35); s.hp = ar(0, 6.28); s.hh = ar(0.02, 0.22); s.a0 = ar(0.15, 0.55); s.len = ar(0.1, 0.32); s.c = airCol(pickOf(o.cols ?? [0xd8c6a0, 0xc9b48c, 0xe6d8b8])); };
  return airCloud(R, o.n ?? 500, { name: 'sand', order: o.order ?? 44,
    init(s) { s.tile = 1; born(s, true); },
    step(s, dt) {
      const gst = o.gust(), v = o.wind * s.k * (0.45 + 0.7 * gst);
      s.x += v * dt; s.hp += dt * s.k * (5 + 4 * gst);
      const up = Math.sin(s.hp); s.y = groundY(s.x) + s.h + Math.abs(up) * s.hh; s.rot = 0.3 * Math.cos(s.hp) * Math.sign(up) * Math.sign(o.wind);
      s.size = s.len * (0.6 + 0.6 * gst); s.a = s.a0 * clamp(0.2 + 0.8 * gst, 0, 1.2) * (o.a ?? 1);
      if (Math.abs(s.x - camera.position.x) > viewHalfW(s.z) + 2.5) born(s);
    } });
}
// 地上一片片被风推着流走的沙：一块贴着地面的面，上面是一道道很淡的沙纹，跟着风往一边流
function sandSheet(R, x1, x2, z1, z2, o) {
  const [c, g] = mkCanvas(512, 256);
  for (let i = 0; i < 220; i++) { const x = rr(0, 512), y = rr(0, 256), w = rr(40, 190), h = rr(0.8, 3); g.fillStyle = `rgba(255,255,255,${rr(0.12, 0.55)})`; for (const ox of [-512, 0, 512]) for (const oy of [-256, 0, 256]) { g.beginPath(); g.ellipse(x + ox, y + oy, w / 2, h, 0, 0, 6.2832); g.fill(); } }
  const tex = new THREE.CanvasTexture(c); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set((x2 - x1) / 8, (z2 - z1) / 4);
  const mat = new THREE.MeshBasicMaterial({ map: tex, color: o.c ?? 0xe0d0ac, transparent: true, opacity: 0, depthWrite: false }); mat.userData.own = true;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(x2 - x1, z2 - z1), mat); m.rotation.x = -Math.PI / 2; m.position.set((x1 + x2) / 2, (o.y ?? 0) + 0.014, (z1 + z2) / 2); m.renderOrder = 3; R.add(m);
  return { name: 'sand', pts: m, step(dt) { const gst = o.gust(); tex.offset.x -= o.wind * (0.5 + 0.8 * gst) * dt / 8; mat.opacity = (o.a ?? 0.22) * clamp(gst, 0, 1.2); } };
}

// ---- 一团团蠓虫：围着一个点乱飞。在逆光里是一粒粒亮点（add），在暗处是小黑点 ----
// spots: [[x, y, z, 几只], ...]；o: lit(x, y, z) 那里有多亮（0..1）, c 颜色, a, size, on()
function airGnats(R, spots, o = {}) {
  const who = []; spots.forEach((sp, k) => { for (let i = 0; i < sp[3]; i++) who.push(k); });
  return airCloud(R, who.length, { add: o.add ?? true, order: 47, name: o.name ?? 'gnats',
    init(s) { s.k = who[s.i]; s.p = [ar(0, 6.28), ar(0, 6.28), ar(0, 6.28)]; s.f = [ar(1.5, 3.5), ar(1.2, 3), ar(1, 2.6)]; s.r = ar(0.15, 0.55); s.tile = 0; s.size = ar(0.022, 0.035) * (o.size ?? 1); s.c = airCol(o.c ?? 0xfff0c8); s.b = ar(0.5, 1); },
    step(s) {
      const [x, y, z] = spots[s.k], bob = 0.25 * Math.sin(T * 0.4 + s.k * 1.7);
      s.x = x + s.r * Math.sin(T * s.f[0] + s.p[0]) + 0.08 * Math.sin(T * 13 + s.i); s.y = y + bob + s.r * 0.7 * Math.sin(T * s.f[1] + s.p[1]) + 0.06 * Math.sin(T * 11 + s.i * 3); s.z = z + s.r * 0.6 * Math.cos(T * s.f[2] + s.p[2]);
      s.a = s.b * (o.a ?? 0.8) * (o.lit ? o.lit(s.x, s.y, s.z) : 1) * (o.on ? o.on() : 1);
    } });
}
// ---- 飞蛾：绕着灯乱转，离灯越近越亮，时不时一头撞向灯罩。lamps: [[x, y, z, 几只], ...]；o.on(k) 第 k 盏灯亮不亮 ----
function airMoths(R, lamps, o = {}) {
  const who = []; lamps.forEach((l, k) => { for (let i = 0; i < l[3]; i++) who.push(k); });
  return airCloud(R, who.length, { add: true, order: 48, name: 'moths',
    init(s) { s.k = who[s.i]; s.ph = ar(0, 6.28); s.w = ar(2.2, 4.5) * (Math.random() < 0.5 ? -1 : 1); s.r = ar(0.3, 0.85); s.tile = 13; s.size = ar(0.07, 0.1) * (o.size ?? 1); s.c = airCol(o.c ?? 0xffe2b0); s.j = [0, 0, 0]; },
    step(s, dt) {
      const [x, y, z] = lamps[s.k], on = o.on ? o.on(s.k) : 1;
      s.ph += s.w * dt * (0.7 + 0.6 * Math.sin(T * 1.7 + s.i)); const r = s.r * (0.75 + 0.35 * Math.sin(T * 2.3 + s.i * 2)) * (Math.sin(T * 0.9 + s.i * 2.7) > 0.94 ? 0.25 : 1);
      for (let k = 0; k < 3; k++) s.j[k] = damp(s.j[k], ar(-0.25, 0.25), 6, dt);
      s.x = x + Math.cos(s.ph) * r + s.j[0]; s.y = y - 0.12 + Math.sin(s.ph * 1.3) * r * 0.5 + s.j[1]; s.z = z + Math.sin(s.ph) * r * 0.8 + s.j[2];
      s.a = on * (0.35 + 0.65 * (1 - sstep(0.1, 1.2, Math.hypot(s.x - x, s.y - y, s.z - z)))) * ar(0.7, 1); s.flip = Math.cos(T * 37 + s.i) > 0 ? 1 : 0.55; s.rot = 0.4 * Math.sin(s.ph);
    } });
}
// ---- 苍蝇：围着一样东西乱飞，一下一下地冲，有时候落下来停一会儿。box: [x, y, z, 半宽, 半高, 半深]，o.land 落下来停在多高 ----
function airFlies(R, n, box, o = {}) {
  return airCloud(R, n, { order: 48, name: o.name ?? 'flies',
    init(s) { s.x = box[0]; s.y = box[1]; s.z = box[2]; s.t = 0; s.v = [0, 0, 0]; s.rest = 0; s.tile = 0; s.size = ar(0.05, 0.065) * (o.size ?? 1); s.c = airCol(o.c ?? 0x0c0e0e); },
    step(s, dt) {
      s.t -= dt;
      if (s.t <= 0) { s.rest = Math.random() < 0.2 ? ar(0.6, 2.4) : 0; s.t = s.rest || ar(0.15, 0.7);
        s.tx = box[0] + ar(-1, 1) * box[3]; s.ty = s.rest ? (o.land ?? box[1] - box[4]) : box[1] + ar(-1, 1) * box[4]; s.tz = box[2] + ar(-1, 1) * box[5]; }
      const k = s.rest ? 5 : 9; s.v[0] = damp(s.v[0], (s.tx - s.x) * k, 10, dt); s.v[1] = damp(s.v[1], (s.ty - s.y) * k, 10, dt); s.v[2] = damp(s.v[2], (s.tz - s.z) * k, 10, dt);
      s.x += s.v[0] * dt; s.y += s.v[1] * dt; s.z += s.v[2] * dt; s.a = (o.a ?? 0.9) * (o.on ? o.on() : 1);
    } });
}
// ---- 蜻蜓和蝴蝶：在一块地方上空飞。蜻蜓悬停一会儿、猛地一窜；蝴蝶一上一下地扑腾、慢慢挪 ----
// box: [x1, x2, 离地 y1, 离地 y2, z1, z2]（o.abs 时 y 就是高度，不是离地多高）；o.kind 'dragon' 蜻蜓 / 不写是蝴蝶；cols, size, on()
function airDarters(R, n, box, o = {}) {
  const dragon = o.kind === 'dragon';
  const aim = s => { s.tx = ar(box[0], box[1]); s.ty = ar(box[2], box[3]); s.tz = ar(box[4], box[5]); };
  return airCloud(R, n, { order: 48, name: dragon ? 'dragonflies' : 'butterflies',
    init(s) { aim(s); s.x = s.tx; s.y = (o.abs ? 0 : groundY(s.tx)) + s.ty; s.z = s.tz; s.t = ar(0, 2); s.face = 1; s.ph = ar(0, 6.28);
      s.size = (dragon ? ar(0.2, 0.26) : ar(0.13, 0.18)) * (o.size ?? 1); s.c = airCol(pickOf(o.cols ?? (dragon ? [0x2f6f86, 0x3f6f3a, 0x8a3a2a] : [0xffffff, 0xf4d24a, 0xf0a040]))); },
    step(s, dt) {
      s.t -= dt; if (s.t <= 0) { aim(s); s.t = dragon ? ar(0.6, 2.6) : ar(1.5, 4); }
      const kk = dragon ? 7 : 1.3, nx = damp(s.x, s.tx, kk, dt);
      if (Math.abs(nx - s.x) > 2e-3) s.face = nx > s.x ? 1 : -1;
      s.x = nx; s.y = damp(s.y, (o.abs ? 0 : groundY(s.tx)) + s.ty, kk, dt) + (dragon ? 0.015 * Math.sin(T * 9 + s.i) : 0.5 * Math.sin(T * 7 + s.ph) * dt * 4); s.z = damp(s.z, s.tz, kk, dt);
      s.tile = dragon ? (Math.floor(T * 30 + s.i) % 2 ? 9 : 10) : (Math.sin(T * 13 + s.ph) > -0.2 ? 11 : 12);
      s.flip = s.tile === 11 ? 0.9 : s.face; s.rot = dragon ? 0 : 0.25 * Math.sin(T * 3 + s.i); s.a = o.on ? o.on() : 1;
    } });
}
// ---- 远处成群飞过的鸟：一个个扇着翅膀的“v”，排成松散的一队 ----
// routes: [{ x1, x2 从哪飞到哪, y, z, v 速度（米/秒，负的往左）, n 几只, gap 飞完一趟隔几秒再来, t0 错开, s 大小, c 颜色, rise 一边飞一边升多少, a }]
//   或者在一处上空盘旋：{ orbit: [cx, cy, 半径], z, v, n, s, c }
function airFlock(R, routes, o = {}) {
  const who = []; routes.forEach((r, k) => { for (let i = 0; i < r.n; i++) who.push([k, i]); });
  return airCloud(R, who.length, { order: o.order ?? 45, name: o.name ?? 'flock',
    init(s) { const [k, i] = who[s.i], r = routes[k], row = Math.ceil(i / 2), side = i % 2 ? 1 : -1, sp = r.sp ?? 1.6; s.r = r;
      s.dx = -Math.sign(r.v) * row * sp + ar(-0.4, 0.4); s.dy = row * side * sp * 0.45 + ar(-0.3, 0.3); s.ph = ar(0, 6.28); s.size = (r.s ?? 0.9) * ar(0.85, 1.15); s.c = airCol(r.c ?? 0x1a1a1e); },
    step(s) {
      const r = s.r;
      if (r.orbit) { const [cx, cy, rad] = r.orbit, a = T * r.v / rad + s.i * 2.4; s.x = cx + Math.cos(a) * rad * (0.8 + 0.2 * Math.sin(s.ph)); s.y = cy + 0.3 * rad * Math.sin(a * 0.7 + s.ph); s.z = r.z;
        s.tile = Math.sin(T * 0.4 + s.ph) > 0.75 ? (Math.sin(T * 7 + s.ph) > 0 ? 15 : 14) : 14; s.flip = -Math.sin(a) >= 0 ? 1 : -1; s.a = (o.on ? o.on() : 1) * (r.a ?? 1); return; }
      const L = Math.abs(r.x2 - r.x1), per = L / Math.abs(r.v) + (r.gap ?? 0), t = (T + (r.t0 ?? 0)) % per, d = t * Math.abs(r.v);
      s.x = (r.v > 0 ? r.x1 + d : r.x2 - d) + s.dx; s.y = r.y + s.dy + 0.4 * Math.sin(T * 0.8 + s.ph) + (r.rise ?? 0) * d; s.z = r.z;
      s.tile = Math.sin(T * 0.5 + s.ph) > 0.5 ? 14 : Math.sin(T * (r.flap ?? 7) + s.ph) > 0 ? 15 : 14; s.flip = Math.sign(r.v) || 1;
      s.a = d > L ? 0 : (o.on ? o.on() : 1) * (r.a ?? 1);
    } });
}
// ---- 燕子：贴着草地兜大圈，忽高忽低，飞得很快 ----
function airSwallows(R, n, cx, cz, o = {}) {
  return airCloud(R, n, { order: 48, name: 'swallows',
    init(s) { s.ph = ar(0, 6.28); s.w = ar(0.45, 0.75) * (s.i % 2 ? 1 : -1); s.rx = ar(6, 10); s.rz = ar(1.5, 3.5); s.size = o.size ?? 0.3; s.c = airCol(o.c ?? 0x1c2030); },
    step(s, dt) {
      s.ph += s.w * dt; s.x = cx + Math.cos(s.ph) * s.rx + 2.5 * Math.sin(s.ph * 2.3); s.z = cz + Math.sin(s.ph) * s.rz;
      s.y = groundY(s.x) + 0.9 + 0.6 * Math.sin(s.ph * 3.1 + s.i) + 0.9 * Math.max(0, Math.sin(s.ph * 1.3));
      s.tile = Math.sin(T * 15 + s.i) > 0.3 ? 15 : 14; s.flip = -Math.sin(s.ph) * s.w >= 0 ? 1 : -1; s.rot = 0.3 * Math.sin(s.ph * 3.1 + s.i); s.a = o.on ? o.on() : 1;
    } });
}

// ---- 萤火虫（环境里的 flies 是多少就有多少）：每一只自己一明一灭，亮的时候慢慢往上飘，暗下去以后换个地方再亮 ----
// 主循环每帧都会调 updateFlies，所以各种点的“一米画成多少像素”也在这里更新
let flyAmt = 0, flyCx = 0, flyBase = 0;
const FIREFLIES = airCloud(scene, 90, { add: true, order: 46, name: 'fireflies',
  init(s) { s.ph = ar(0, 10); s.per = ar(2.4, 5.5); s.on = ar(0.5, 1.3); s.tile = 0; s.c = airCol(0xd9f08a); s.size = ar(0.12, 0.2); s.x = ar(-20, 20); s.y = ar(0.2, 3); s.z = ar(-9, 4); s.dark = true; },
  step(s, dt) {
    s.ph += dt; const c = s.ph % s.per, lit = c < s.on, p = lit ? Math.sin(Math.PI * c / s.on) : 0;
    if (!lit && !s.dark) { s.dark = true; if (Math.random() < 0.35) { s.x = flyCx + ar(-20, 20); s.y = flyBase + ar(0.15, 2.2); s.z = ar(-9, 4); } }
    if (lit) s.dark = false;
    s.x += 0.22 * Math.sin(T * 0.3 + s.i) * dt; s.y += (0.06 + 0.12 * Math.sin(T * 0.7 + s.i * 2)) * dt; s.z += 0.14 * Math.cos(T * 0.25 + s.i) * dt;
    if (s.x < flyCx - 20) s.x += 40; else if (s.x > flyCx + 20) s.x -= 40;
    if (s.y > flyBase + 4.2 && !lit) s.y = flyBase + 0.2;
    s.a = flyAmt * (0.06 + 0.94 * p * p);
  } });
function updateFlies(dt, t, camX, baseY, amount) {
  airTick(); flyAmt = amount; flyCx = camX; flyBase = baseY;
  FIREFLIES.pts.visible = amount > 0.01; FIREFLIES.step(dt);
}
