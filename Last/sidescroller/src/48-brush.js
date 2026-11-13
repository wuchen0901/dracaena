
// ============================================================
//  路边会被拨开的植物
//  长在路边、叶子伸到路上的一丛：大叶子（牛蒡一类）、高草、蕨、从小树上垂到路上的枝条。
//  主角走到跟前，用靠镜头的那只手把挡路的叶子拨开（高草用两只手分开，蕨往下按，枝条托起来、低头钻过去）；
//  手一松，叶子弹回来，晃几下才停。
//  每一片叶子（一根草、一片蕨叶、一根枝条）是一根能弯的长条：根不动，弯多少由一个带阻尼的弹簧算；
//  碰到主角的手、前臂、身子、头，就被推到刚好碰不到的地方 —— 推得太弯了就从手边滑开，弹回去。
//  手往哪里伸由这里算好放进 HX.brush，42-character-anim.js 照着摆手臂；叶子怎么被推开，看的是手和身子实际在哪里。
// ============================================================
const BRUSH = { list: [], tex: null, mat: null, cells: {} };

// ---- 图集：灰白的一张，摆的时候每一条染上自己的颜色。每一格竖着画一条：根在底边中点，梢朝上 ----
function brushAtlas() {
  if (BRUSH.tex) return BRUSH.tex;
  const S = 1024, [c, g] = mkCanvas(S, S);
  const cell = (kind, x, y, w, h, draw) => {
    g.save(); g.beginPath(); g.rect(x + 1, y + 1, w - 2, h - 2); g.clip();
    g.setTransform(1, 0, 0, -1, x + w / 2, y + h - 3); g.lineCap = 'round'; g.lineJoin = 'round';        // 原点在根上，y 朝上，单位是像素
    draw(g, w / 2 - 4, h - 6); g.restore();
    (BRUSH.cells[kind] ??= []).push([x / S, 1 - (y + h - 3) / S, w / S, (h - 6) / S]);                    // [u0, 根的 v, 宽, 长]
  };
  withSeed(5311, () => {
    for (let i = 0; i < 3; i++) cell('leaf', i * 192, 0, 192, 512, (g, W, H) => bigLeaf(g, W, H, i));
    for (let i = 0; i < 2; i++) cell('frond', 576 + i * 192, 0, 192, 512, fernFrond);
    for (let i = 0; i < 2; i++) cell('blade', 960 + i * 32, 0, 32, 512, grassBlade);
    for (let i = 0; i < 2; i++) cell('twig', i * 256, 512, 256, 512, leafyTwig);
    for (let i = 0; i < 3; i++) cell('plume', 512 + i * 64, 512, 64, 512, plumeStem);
    for (let i = 0; i < 4; i++) cell('leaflet', 704 + i * 64, 512, 64, 96, smallLeaf);
  });
  BRUSH.tex = sharedTex(canvasTex(c)); BRUSH.tex.anisotropy = 8; renderer.initTexture(BRUSH.tex);
  return BRUSH.tex;
}
// 一片大叶子（牛蒡、款冬一类）：长叶柄，心形的叶片，基部两片耳朵；中脉和侧脉浅一些，叶缘暗一些，有一两个虫子咬的洞
function bigLeaf(g, W, H, v) {
  const st = H * (0.38 + 0.03 * v), L = H - st, a = st + 0.06 * L, w = W * (0.94 - 0.05 * v);
  setInk(g, '#adadad'); line(g, [[0, 0], [1.5, st * 0.55], [0, a + 6]], 8);
  const outline = () => {
    g.beginPath(); g.moveTo(0, a);
    g.bezierCurveTo(-0.24 * w, a - 0.13 * L, -0.88 * w, a - 0.14 * L, -0.98 * w, a + 0.15 * L);
    g.bezierCurveTo(-1.05 * w, a + 0.47 * L, -0.5 * w, a + 0.83 * L, 0, H);
    g.bezierCurveTo(0.5 * w, a + 0.83 * L, 1.05 * w, a + 0.47 * L, 0.98 * w, a + 0.15 * L);
    g.bezierCurveTo(0.88 * w, a - 0.14 * L, 0.24 * w, a - 0.13 * L, 0, a); g.closePath();
  };
  outline(); g.fillStyle = '#b0b0b0'; g.fill();
  g.save(); outline(); g.clip();
  g.fillStyle = '#c6c6c6'; g.fillRect(0, a - 0.2 * L, W + 4, H);                                      // 叶片顺着中脉微微折起来：一半亮、一半暗
  setInk(g, '#8e8e8e'); outline(); g.lineWidth = 7; g.stroke();                                       // 叶缘
  setInk(g, '#e0e0e0'); line(g, [[0, a - 4], [0, H - 0.05 * L]], 4.5);                               // 中脉
  g.lineWidth = 2.4;
  for (let i = 0; i < 6; i++) {                                                                       // 侧脉：从中脉斜着伸向叶缘
    const t = 0.05 + i * 0.145, y0 = a + t * L * 0.95, s = 1 - t * 0.75;
    for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(0, y0); g.quadraticCurveTo(sd * w * 0.38 * s, y0 + 0.04 * L, sd * w * 0.8 * s, y0 + 0.17 * L * s); g.stroke(); }
  }
  g.restore();
  g.save(); g.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 1 + v % 2; i++) { g.beginPath(); g.ellipse(rr(-0.55, 0.55) * w, a + rr(0.25, 0.7) * L, rr(4, 9), rr(3, 6), rr(0, 3), 0, 6.2832); g.fill(); }
  g.restore();
}
// 一片蕨叶：直的叶轴，两边一对对小叶，中间长、两头短；小叶边上几道浅浅的缺刻
function fernFrond(g, W, H) {
  setInk(g, '#a4a4a4'); line(g, [[0, 0], [0, H - 2]], 5);
  const n = 18;
  for (let i = 0; i < n; i++) {
    const t = 0.1 + 0.9 * i / (n - 1), y = t * H, len = W * 0.98 * Math.pow(Math.sin(Math.PI * (0.06 + 0.94 * t)), 0.6) * (1 - 0.3 * t), bw = H / n * 0.36;
    for (const sd of [-1, 1]) {
      g.fillStyle = sd < 0 ? '#bebebe' : '#d6d6d6';
      const d = [sd * Math.sin(1.1), Math.cos(1.1)], nu = sd > 0 ? [-d[1], d[0]] : [d[1], -d[0]], pts = [];        // 小叶斜着朝上伸出去；nu 指向小叶靠上的那条边
      for (let j = 0; j <= 6; j++) { const k = j / 6, hw = bw * Math.pow(1 - k, 0.7) * (1 + 0.18 * Math.sin(k * 19)); pts.push([d[0] * len * k + nu[0] * hw, y + d[1] * len * k + nu[1] * hw]); }
      for (let j = 6; j >= 0; j--) { const k = j / 6, hw = bw * Math.pow(1 - k, 0.7) * (1 + 0.18 * Math.sin(k * 19 + 1.5)); pts.push([d[0] * len * k - nu[0] * hw, y + d[1] * len * k - nu[1] * hw]); }
      poly(g, pts);
    }
  }
}
// 一根草叶：根上宽，一路收到尖
function grassBlade(g, W, H) {
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#9a9a9a'); gr.addColorStop(0.55, '#cecece'); gr.addColorStop(1, '#eaeaea');
  g.fillStyle = gr; g.beginPath(); g.moveTo(-W * 0.85, 0); g.quadraticCurveTo(-W * 0.6, H * 0.62, 0, H); g.quadraticCurveTo(W * 0.5, H * 0.56, W * 0.85, 0); g.closePath(); g.fill();
}
// 一根结了穗的草茎（芒草一类）：细茎，梢上一蓬毛茸茸的穗
function plumeStem(g, W, H) {
  setInk(g, '#b8b8b8'); line(g, [[0, 0], [0, H - 3]], 3);
  for (let i = 0; i < 60; i++) {
    const t = rr(0.58, 0.985), y = t * H, l = W * Math.sin(Math.PI * Math.min(1, (t - 0.55) / 0.45)) * rr(0.45, 1), sd = rnd() < 0.5 ? -1 : 1;
    setInk(g, pick(['#dcdcdc', '#f0f0f0', '#cccccc'])); line(g, [[0, y - 4], [sd * l * 0.55, y + l * 0.5], [sd * l * 0.9, y + l * 1.3]], 1.8);
  }
}
// 一根带叶子的细枝：从根往梢渐细、有几个小折角；叶子互生，越到梢上越密，梢上一簇
function leafyTwig(g, W, H) {
  const n = 7, pts = [[0, 0]]; for (let i = 1; i <= n; i++) pts.push([rr(-0.06, 0.06) * W, i / n * H * 0.94]);
  setInk(g, '#767676'); for (let i = 0; i < n; i++) line(g, [pts[i], pts[i + 1]], lerp(11, 3, i / n));
  const at = t => { const f = t * n, i = Math.min(n - 1, Math.floor(f)), k = f - i; return [lerp(pts[i][0], pts[i + 1][0], k), lerp(pts[i][1], pts[i + 1][1], k)]; };
  const L = [];
  for (let i = 0; i < 15; i++) { const t = 0.2 + 0.78 * Math.pow(i / 14, 0.8), sd = i % 2 ? 1 : -1; L.push([...at(t), sd * rr(0.55, 1.05), rr(0.15, 0.2) * H * (0.75 + 0.25 * t)]); }
  for (let i = 0; i < 3; i++) L.push([...at(0.97), rr(-0.5, 0.5), rr(0.14, 0.18) * H]);
  for (const [x, y, ang, len] of L) { g.fillStyle = pick(['#bababa', '#d4d4d4', '#a4a4a4', '#e2e2e2']); leafShape(g, x, y, ang, len, len * 0.36); }
}
function leafShape(g, x, y, ang, len, wid) {                                                         // 一片尖头的叶子，从 (x, y) 朝 ang（从竖直往右偏）长出去
  g.save(); g.translate(x, y); g.rotate(-ang);
  g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(wid * 1.1, len * 0.42, 0, len); g.quadraticCurveTo(-wid * 1.1, len * 0.42, 0, 0); g.fill();
  g.restore();
}
function smallLeaf(g, W, H) { g.fillStyle = pick(['#c6c6c6', '#dcdcdc', '#b2b2b2']); leafShape(g, 0, 2, 0, H - 6, W * 0.75); setInk(g, '#eaeaea'); line(g, [[0, 3], [0, H - 12]], 1.5); }

function brushMat() {
  if (BRUSH.mat) return BRUSH.mat;
  return BRUSH.mat = new THREE.MeshLambertMaterial({ map: brushAtlas(), vertexColors: true, alphaTest: 0.05, alphaToCoverage: true, side: THREE.DoubleSide });
}

// ---- 一条能弯的长条 ----
// o: x, y, z 根 / th 根部朝哪边（从竖直往 +x 偏多少弧度）/ k0 一路再弯过去多少 / L 长 / dz 梢比根往镜头那边多出来多少 /
// q 弯在哪里（<1 多半在根上转，像叶柄；>1 越到梢上越弯，像草叶）/ f 回弹的频率（次/秒）、zeta 阻尼比 / lim 最多被推弯多少，再推就滑开 /
// tw 被手推开时朝侧面翻过去多少 / touch 伸没伸到路上（伸到了才会碰到主角）/ col 颜色 / ws 宽窄 / n 分几节 /
// pad 宽的叶片（大叶子、蕨叶、枝条）离手和身子要留出半个叶片宽的多少，叶片才不会盖在主角身上；p0 从多长以后才算叶片（前面是叶柄）
function brushEl(kind, o) {
  const cs = BRUSH.cells[kind], uv = cs[o.cell ?? Math.floor(rnd() * cs.length)], f = o.f ?? 1.5, zeta = o.zeta ?? 0.15, w0 = 2 * Math.PI * f;
  return { kind, rx: o.x, ry: o.y, rz: o.z, dz: o.dz ?? 0, th0: o.th, k0: o.k0 ?? 0, L: o.L, w: o.L * uv[2] / uv[3] * (o.ws ?? 1), q: o.q ?? 1, n: o.n ?? 8, uv, flip: o.flip ?? rnd() < 0.5,
    col: new THREE.Color(o.col), touch: o.touch ?? true, K: w0 * w0, C: 2 * zeta * w0, lim: o.lim ?? 1.2, twMax: o.tw ?? 0, twSign: (o.z + (o.dz ?? 0)) >= 0 ? 1 : -1,
    sway: o.sway ?? 0.035, ph: rnd() * 6.2832, d: 0, dv: 0, tw: 0, tv: 0, slip: false, dir: 0, v0: 0, pad: (o.pad ?? 0) * o.L * uv[2] / uv[3] * (o.ws ?? 1) / 2, p0: o.p0 ?? 0.3 };
}
// 这一条弯成 d 的时候，各节末端在哪里（只算 x、y：碰撞在侧视平面里算）
const _nx = new Float32Array(24), _ny = new Float32Array(24);
function elNodes(e, d) {
  let x = e.rx, y = e.ry; const n = e.n, st = e.L / n;
  for (let k = 0; k < n; k++) { const t = (k + 0.5) / n, a = e.th0 + e.k0 * t + d * Math.pow(t, e.q); x += Math.sin(a) * st; y += Math.cos(a) * st; _nx[k] = x; _ny[k] = y; }
}
function segDist(px, py, o) {                                                                        // 点到一段胶囊中轴的距离
  const dx = o.bx - o.ax, dy = o.by - o.ay, l2 = dx * dx + dy * dy, t = l2 > 1e-9 ? clamp(((px - o.ax) * dx + (py - o.ay) * dy) / l2, 0, 1) : 0;
  return Math.hypot(px - o.ax - dx * t, py - o.ay - dy * t);
}
let _penHand = false;
function elPen(e, d, obs) {                                                                          // 弯成 d 时戳进主角的手、身子里最深多少米（<= 0 就是碰不到）
  elNodes(e, d); let m = -1; _penHand = false;
  for (let k = Math.floor(e.n * e.p0); k < e.n; k++) { const r = (k + 1) / e.n > e.p0 + 0.08 ? e.pad : e.pad * 0.3; for (const o of obs) { const v = o.r + r - segDist(_nx[k], _ny[k], o); if (v > m) { m = v; _penHand = o.hand; } } }
  return m;
}
// 碰到了：往碰不到的那边推，推到刚好碰不到为止（先一步步找，再对半找准）；推到 lim 还躲不开，就从手边、身边滑过去
function elContact(e, obs, dt) {
  if (elPen(e, e.d, obs) <= 0) { e.dir = 0; return 0; }
  const hand = _penHand;
  let dir = e.dir;
  if (!dir) { const pp = elPen(e, e.d + 0.05, obs), pm = elPen(e, e.d - 0.05, obs); dir = pp < pm ? 1 : pm < pp ? -1 : (e.th0 >= 0 ? 1 : -1); }
  let lo = 0, hi = -1;
  for (let s = 0.06; Math.abs(e.d + dir * s) <= e.lim + 0.06; s += 0.06) { if (elPen(e, e.d + dir * s, obs) <= 0) { hi = s; break; } lo = s; }
  if (hi < 0 || Math.abs(e.d + dir * hi) > e.lim) { e.slip = true; e.dir = 0; return 0; }           // 滑开以后穿过去，直到不再挨着主角才重新算碰撞
  for (let i = 0; i < 4; i++) { const m = (lo + hi) / 2; if (elPen(e, e.d + dir * m, obs) <= 0) hi = m; else lo = m; }
  const nd = e.d + dir * hi, v = (nd - e.d) / Math.max(dt, 1e-3);
  e.dv = clamp(dir > 0 ? Math.max(e.dv, v) : Math.min(e.dv, v), -12, 12); e.d = nd; e.dir = dir;
  return hand ? 2 : 1;
}

// ---- 路边的一丛 ----
// kind：leaf 大叶子 / grass 高草（路两边各一丛）/ fern 蕨 / branch 路后面一棵小树，枝条垂到路上。
// z：长在路的哪一边（正的靠镜头）；o.cols 换一套颜色（默认是第二章林子里的枯褐色）；o.s 整体大小
const BR_COLS = {
  leaf: [0x5a5630, 0x6a6034, 0x4e4c2c, 0x726036],
  grass: [0x9c8c5a, 0x857a4a, 0xa89a68, 0x8e7f4c], plume: [0xcabd98, 0xbfb08a],
  fern: [0x6e5232, 0x7c5c36, 0x5f4a2e, 0x55553a],
  twig: [0x9a7436, 0x8a6a34, 0xa8843e, 0x6e6438], bark: 0x4f4133,
};
// 手怎么拨。手走的路是按“身子走到哪里”排的几个点：rel 是身子离叶子还有多远（负的是还没走到手碰到叶子的地方），
// 每个点 [rel, 手在身前多远, 手离地多高, 手臂往外翻多少]；k [开始抬手, 抬到位, 开始放下, 放完] 也按 rel 排；
// hands 用几只手 / gh 手碰到叶子的高度 / bow 低头弯腰多少
const BR_GEST = {
  leaf: { hands: 1, gh: 0.86, keys: [[-0.5, 0.44, 0.92, 0], [0, 0.46, 0.88, 0.15], [0.35, 0.42, 0.8, 0.55], [0.7, 0.24, 0.62, 1.0]], k: [-1.1, -0.55, 0.65, 1.0], bow: 0.03 },
  grass: { hands: 2, gh: 0.88, keys: [[-0.5, 0.38, 0.92, 0], [0, 0.4, 0.88, 0.2], [0.35, 0.38, 0.84, 0.6], [0.7, 0.2, 0.7, 1.0]], k: [-1.1, -0.55, 0.65, 1.0], bow: 0.05 },
  fern: { hands: 1, gh: 0.62, keys: [[-0.5, 0.38, 0.7, 0], [0, 0.38, 0.6, 0.1], [0.35, 0.34, 0.5, 0.3], [0.65, 0.2, 0.5, 0.5]], k: [-1.1, -0.55, 0.6, 0.95], bow: 0.12 },
  branch: { hands: 1, gh: 1.16, keys: [[-0.5, 0.3, 1.14, 0], [0, 0.26, 1.24, 0.05], [0.4, 0.14, 1.3, 0.2], [0.8, 0.04, 1.3, 0.3]], k: [-0.95, -0.45, 0.8, 1.15], bow: 0.22 },
};
function brushPlant(parent, kind, x, z, o = {}) {
  brushAtlas();
  const s = o.s ?? 1, y = groundY(x), C = { ...BR_COLS, ...o.cols }, Pl = { kind, x, y, z, els: [], gest: BR_GEST[kind], drops: [], shed: 0, extra: [] };
  const E = (k, eo) => Pl.els.push(brushEl(k, eo));
  if (kind === 'leaf') {
    // 七八片大叶子从同一个地方朝四周散开：中间的高，两边的低垂；叶梢朝路这边伸
    const n = 8;
    for (let i = 0; i < n; i++) {
      const k = (i + 0.5) / n * 2 - 1, th = k * 1.15 + rr(-0.12, 0.12), L = rr(0.8, 1.02) * s * (1 - 0.2 * Math.abs(k));
      E('leaf', { x: x + rr(-0.06, 0.06), y, z: z + rr(-0.12, 0.12), dz: -z * rr(0.8, 1.3), th, k0: th * 0.4, L, q: 0.55, f: rr(1.0, 1.3), zeta: 0.12, lim: 1.35, tw: 1.15, pad: 0.75, p0: 0.4, col: pick(C.leaf), touch: Math.abs(k) < 0.85 });
    }
  } else if (kind === 'grass') {
    // 高草：路两边各一丛，草叶朝外拱、梢垂到路上；几根结了穗
    for (const zz of [z, -z * 0.85]) for (let i = 0; i < 26; i++) {
      const th = rr(-0.55, 0.55);
      E('blade', { x: x + rr(-0.32, 0.32), y, z: zz + rr(-0.1, 0.1), dz: -Math.sign(zz) * 0.15, th, k0: Math.sign(th || 1) * rr(0.15, 0.6), L: rr(0.85, 1.3) * s, q: 1.6, f: rr(1.6, 2.2), zeta: 0.16, lim: 1.15, n: 7, col: pick(C.grass), ws: rr(0.9, 1.3) });
      if (i % 6 === 0) E('plume', { x: x + rr(-0.3, 0.3), y, z: zz + rr(-0.08, 0.08), th: rr(-0.35, 0.35), k0: rr(-0.4, 0.4), L: rr(1.15, 1.4) * s, q: 1.4, f: rr(1.3, 1.7), zeta: 0.14, lim: 1.1, col: pick(C.plume) });
    }
  } else if (kind === 'fern') {
    // 一丛大蕨：十来片蕨叶从根上朝四周拱出去、梢垂下来，伸到路上的那几片在腰那么高
    const n = 10;
    for (let i = 0; i < n; i++) {
      const k = (i + 0.5) / n * 2 - 1, th = k * 1.0 + rr(-0.1, 0.1), L = rr(0.85, 1.1) * s * (1 - 0.15 * Math.abs(k));
      E('frond', { x: x + rr(-0.05, 0.05), y, z: z + rr(-0.12, 0.12), dz: -z * rr(0.8, 1.2), th, k0: th * 1.25 + Math.sign(th) * 0.25, L, q: 1.15, f: rr(1.3, 1.7), zeta: 0.13, lim: 1.3, tw: 0.5, pad: 0.5, p0: 0.25, col: pick(C.fern) });
    }
  } else if (kind === 'branch') {
    // 路后面一棵小树：树干在一人多高的地方分成两杈，树冠是一圈带叶的枝条；几根枝条从分杈下面朝路两边伸出去、往下垂，梢在主角的头那么高
    const H = 1.75 * s, bark = lam(C.bark), limb = (x0, y0, a, len, r0, r1) => {                   // 一截树枝：从 (x0, y0) 朝 a（从竖直往右偏）长 len
      const m = add(parent, new THREE.CylinderGeometry(r1, r0, len, 6), bark, x0 + Math.sin(a) * len / 2, y0 + Math.cos(a) * len / 2, z); m.rotation.z = -a; Pl.extra.push(m);
      return [x0 + Math.sin(a) * len, y0 + Math.cos(a) * len];
    };
    limb(x, y - 0.05, 0.03, H + 0.05, 0.075 * s, 0.05 * s);
    const tops = [limb(x, y + H, -0.42, 0.95 * s, 0.045 * s, 0.026 * s), limb(x, y + H, 0.36, 1.05 * s, 0.05 * s, 0.03 * s), limb(x, y + H * 0.9, 0.05, 1.3 * s, 0.04 * s, 0.022 * s)];
    for (const [h, th, L] of [[1.45, -1.92, 1.4], [1.32, -2.12, 1.1], [1.58, 1.95, 1.25], [1.36, 2.15, 1.0]])
      E('twig', { x, y: y + h * s, z: z + rr(0.04, 0.12), dz: -z * 0.75, th: th + rr(-0.06, 0.06), k0: Math.sign(th) * 0.3, L: L * s, q: 0.8, f: rr(1.1, 1.4), zeta: 0.1, lim: 0.95, tw: 0.3, pad: 0.45, p0: 0.25, col: pick(C.twig) });
    for (const [tx, ty] of tops) for (let i = 0; i < 5; i++) {                                           // 树冠：每一杈的梢上一圈枝条，朝上、朝两边散开
      const th = rr(-1.6, 1.6);
      E('twig', { x: tx, y: ty - rr(0, 0.25), z: z + rr(-0.15, 0.15), th, k0: Math.sign(th) * rr(0.1, 0.4), L: rr(0.75, 1.1) * s, q: 0.9, f: rr(0.8, 1.1), zeta: 0.12, touch: false, sway: 0.06, col: pick(C.twig) });
    }
  }
  // 手从哪里开始碰到叶子：伸到路上的那几条，在手的高度上的那些点里，靠来路的那一头（去掉最外面一成零星的叶尖）——往右走用左边那一头，往左走用右边那一头
  const gy = y + Pl.gest.gh, band = []; let wl = x, wr = x;
  for (const e of Pl.els) {
    if (!e.touch) continue; elNodes(e, 0);
    for (let k = Math.floor(e.n * 0.3); k < e.n; k++) { wl = Math.min(wl, _nx[k]); wr = Math.max(wr, _nx[k]); if (k >= e.n * 0.4 && Math.abs(_ny[k] - gy) < 0.22) band.push(_nx[k]); }
  }
  band.sort((a, b) => a - b); const pc = f => band[Math.min(band.length - 1, Math.floor(f * band.length))];
  Pl.gx = band.length ? [pc(0.12), pc(0.88)] : [x - 0.3, x + 0.3]; Pl.gy = gy; Pl.span = Math.max(x - wl, wr - x, 0.5);
  if (o.lit) for (const e of Pl.els) e.col.multiplyScalar(o.lit);
  for (const m of Pl.extra) m.material.userData.own = true;                                              // 树干的材质是这一丛自己的：章节卸载时一起释放
  brushMesh(Pl); parent.add(Pl.mesh); brushShape(Pl); BRUSH.list.push(Pl);
  const bs = Pl.mesh.geometry; bs.computeBoundingSphere(); bs.boundingSphere.radius += 0.6;              // 叶子会动：包围球放大一圈，不用每帧重算
  return Pl;
}
// 沿路摆几丛：list 里每一项 [种类, x, z, 大小, 亮度]；cols 这一章的颜色（不给就是第二章林子里的枯褐色，见 BR_COLS）；亮度：摆在暗处的那一丛调亮一些，不然和地面糊在一起
function brushRow(parent, list, cols, seed = 1) { return withSeed(seed, () => list.map(([k, x, z, s, lit]) => brushPlant(parent, k, x, z, { s, cols, lit }))); }
// 一丛的网格：所有长条合在一个网格里，每一条 n 节、2(n+1) 个顶点。法线朝上（明暗和地面一致），根上暗一些
function brushMesh(Pl) {
  let nv = 0, ni = 0; for (const e of Pl.els) { e.v0 = nv; nv += (e.n + 1) * 2; ni += e.n * 6; }
  const pos = new Float32Array(nv * 3), uv = new Float32Array(nv * 2), col = new Float32Array(nv * 3), nrm = new Float32Array(nv * 3), idx = new Uint16Array(ni);
  let ii = 0;
  for (const e of Pl.els) {
    const [u0, v0, du, dv] = e.uv;
    for (let k = 0; k <= e.n; k++) {
      const t = k / e.n, sh = 0.55 + 0.45 * sstep(0, 0.55, t);
      for (let sd = 0; sd < 2; sd++) {
        const vi = e.v0 + k * 2 + sd;
        uv[vi * 2] = u0 + du * (e.flip ? 1 - sd : sd); uv[vi * 2 + 1] = v0 + dv * t;
        col[vi * 3] = e.col.r * sh; col[vi * 3 + 1] = e.col.g * sh; col[vi * 3 + 2] = e.col.b * sh; nrm[vi * 3 + 1] = 1;
      }
      if (k < e.n) { const a = e.v0 + k * 2; idx.set([a, a + 1, a + 2, a + 1, a + 3, a + 2], ii); ii += 6; }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nrm, 3)); geo.setIndex(new THREE.BufferAttribute(idx, 1));
  Pl.mesh = new THREE.Mesh(geo, brushMat()); Pl.mesh.receiveShadow = true; Pl.pos = pos; Pl.posAttr = geo.attributes.position;
}
// 按每一条现在弯了多少，重新摆它的顶点：中轴一节节接下去，宽度方向和中轴垂直，被推开时朝侧面翻过去（tw）
function brushShape(Pl) {
  const p = Pl.pos;
  for (const e of Pl.els) {
    let x = e.rx, y = e.ry; const n = e.n, st = e.L / n, hw = e.w / 2, ct = Math.cos(e.tw), stw = Math.sin(e.tw) * e.twSign;
    for (let k = 0; k <= n; k++) {
      const t = k / n, a = e.th0 + e.k0 * t + e.d * Math.pow(t, e.q), z = e.rz + e.dz * t;
      const nx = Math.cos(a) * ct, ny = -Math.sin(a) * ct, nz = stw, vi = (e.v0 + k * 2) * 3;
      p[vi] = x - nx * hw; p[vi + 1] = y - ny * hw; p[vi + 2] = z - nz * hw;
      p[vi + 3] = x + nx * hw; p[vi + 4] = y + ny * hw; p[vi + 5] = z + nz * hw;
      if (k < n) { const tm = (k + 0.5) / n, am = e.th0 + e.k0 * tm + e.d * Math.pow(tm, e.q); x += Math.sin(am) * st; y += Math.cos(am) * st; }
    }
  }
  Pl.posAttr.needsUpdate = true;
}
// 玩的时候用的随机数（抖不抖下叶子、抖下哪一片）：自己一套，不动搭关卡用的那一套
let _brs = 977;
const brn = () => { _brs = _brs * 16807 % 2147483647; return _brs / 2147483647; };
// 从枝条上抖下来的一片叶子：一个小方片，打着旋飘下来，落到地上躺平。每一丛最多留 6 片，再抖下来的就拿最早落地的那片来用
function brushDrop(Pl, e) {
  let d = Pl.drops.length >= 6 ? Pl.drops.reduce((a, b) => (b.t0 < a.t0 ? b : a)) : null;
  if (!d) {
    const c = BRUSH.cells.leaflet[Math.floor(brn() * BRUSH.cells.leaflet.length)], [u0, v0, du, dv] = c, geo = new THREE.PlaneGeometry(0.075, 0.11), uv = geo.attributes.uv, cl = new Float32Array(12);
    for (let i = 0; i < 4; i++) { uv.setXY(i, u0 + du * uv.getX(i), v0 + dv * uv.getY(i)); cl.set([e.col.r, e.col.g, e.col.b], i * 3); }
    geo.setAttribute('color', new THREE.BufferAttribute(cl, 3));
    d = { m: new THREE.Mesh(geo, brushMat()) }; Pl.mesh.parent.add(d.m); Pl.drops.push(d);
  }
  const t = 0.45 + 0.5 * brn(), k = Math.min(e.n - 1, Math.floor(t * e.n)); elNodes(e, e.d);
  Object.assign(d, { x: _nx[k], y: _ny[k], z: e.rz + e.dz * t + 0.05, vx: e.dv * 0.05, ph: brn() * 6.28, t: 0, t0: T, lie: false });
}
function stepDrops(Pl, dt) {
  for (const d of Pl.drops) {
    if (d.lie) continue;
    d.t += dt; d.vx = damp(d.vx, 0.25 * Math.sin(d.t * 3.1 + d.ph), 2, dt);
    d.x += d.vx * dt; d.y -= (0.42 + 0.18 * Math.sin(d.t * 6.2 + d.ph)) * dt;
    const gy = groundY(d.x) + 0.012;
    if (d.y <= gy) { d.y = gy; d.lie = true; d.m.rotation.set(-Math.PI / 2, 0, d.ph); }
    else d.m.rotation.set(0.6 * Math.sin(d.t * 4 + d.ph), d.t * 2.5 + d.ph, 0.9 * Math.sin(d.t * 3.1 + d.ph));
    d.m.position.set(d.x, d.y, d.z);
  }
}
function stepPlant(Pl, dt, obs) {
  let rub = 0, back = 0, drop = 0;                                                                   // 给声音的（52-audio.js 的 brushSound）：擦得多快、弹回去多快、抖落了几片
  for (const e of Pl.els) {
    const d0 = e.d, sw = e.sway * (0.7 + 0.46 * GUST.v) * (Math.sin(T * 1.7 + e.ph) + 0.4 * Math.sin(T * 2.9 + e.ph * 1.7));   // 风：阵风来了摆得大一些，和地上的草、风吹树叶的声音同一阵（36-lights-fx.js 的 GUST）
    e.dv += (-e.K * (e.d - sw) - e.C * e.dv) * dt; e.d += e.dv * dt;
    e.tv += (-e.K * 0.8 * e.tw - e.C * e.tv) * dt; e.tw += e.tv * dt;
    if (!obs || !e.touch) { e.slip = false; continue; }
    if (e.slip) { if (elPen(e, e.d, obs) <= 0) e.slip = false; continue; }
    const was = e.dir, hit = elContact(e, obs, dt);
    if (hit) rub += Math.abs(e.d - d0) * e.L;                                                          // 挨着主角的这一条，这一帧被带着走了多远（量在梢上）；站着不动、叶子贴着不动就是 0
    else if (was) back = Math.max(back, Math.abs(e.d) * Math.sqrt(e.K) * e.L);                         // 刚松开：弹回去的时候梢上最快有多快
    if (hit === 2 && e.twMax) { e.tw = damp(e.tw, e.twMax, 7, dt); e.tv = 0; }                        // 被手推着：朝侧面翻过去
    if (Pl.kind === 'branch' && was && !hit && Pl.shed < 3 && Math.abs(e.dv) > 1.2 && brn() < 0.7) { brushDrop(Pl, e); Pl.shed++; drop++; }   // 一松手枝条弹回去，抖下一两片叶子
  }
  stepDrops(Pl, dt);
  brushShape(Pl);
  brushSound(Pl, dt, rub / dt, back, drop);
}
// 主角身上会碰到叶子的地方，侧视平面里的几段胶囊：身子、头、两条前臂和两只手。用的是模型上一帧的骨头位置
const _bo = [V3(), V3(), V3()];
function heroObstacles() {
  const out = [], tv = hero.B.traveler, cap = (ax, ay, bx, by, r, hand = false) => out.push({ ax, ay, bx, by, r, hand });
  if (tv?.model) {
    const b = n => tv.bones.get(n).node, hip = b('Hips').getWorldPosition(_bo[0]), nk = b('neck').getWorldPosition(_bo[1]);
    cap(hip.x, P.y + 0.22, nk.x, nk.y - 0.04, 0.12);
    const hd = b('Head').getWorldPosition(_bo[0]); cap(hd.x + 0.02 * P.facing, hd.y + 0.08, hd.x + 0.02 * P.facing, hd.y + 0.08, 0.11);
    for (const sd of ['Left', 'Right']) {
      const el = b(sd + 'ForeArm').getWorldPosition(_bo[0]), wr = b(sd + 'Hand').getWorldPosition(_bo[1]), dx = wr.x - el.x, dy = wr.y - el.y, l = Math.hypot(dx, dy) || 1;
      const px = wr.x + dx / l * 0.05, py = wr.y + dy / l * 0.05;
      cap(el.x, el.y, px, py, 0.05, true); cap(px, py, px, py, 0.08, true);
    }
  } else cap(P.x, P.y + 0.22, P.x, P.y + 1.1, 0.14);
  return out;
}
// 走近哪一丛，手就照那一丛的要求伸出去：抬手伸向叶子，碰到了往前推，再往外、往下一拨，手臂回到平常的摆动。
// 手的位置是相对身子给的（手臂怎么摆都好看）；叶子被推开看的是手实际在哪里
function brushGesture(Pl) {
  const g = Pl.gest; if (!g || P.mode !== 'normal' || !P.grounded) return null;
  const dir = P.facing, rel = (P.x - (dir > 0 ? Pl.gx[0] : Pl.gx[1])) * dir + 0.42, [r0, r1, r2, r3] = g.k;     // rel = 0：伸直的手刚好碰到叶子
  if (rel < r0 || rel > r3) return null;
  const K = g.keys, j = rel <= K[0][0] ? 0 : rel >= K[K.length - 1][0] ? K.length - 2 : K.findIndex((p, i) => rel >= p[0] && rel < K[i + 1][0]);
  const a = K[Math.max(0, j)], b = K[Math.min(K.length - 1, j + 1)], t = sstep(a[0], b[0], rel);
  return { hands: g.hands, k: sstep(r0, r1, rel) * (1 - sstep(r2, r3, rel)), hx: lerp(a[1], b[1], t), hy: lerp(a[2], b[2], t), turn: lerp(a[3], b[3], t), bow: g.bow * sstep(r0 + 0.2, r1, rel) * (1 - sstep(r2, r3, rel)) };
}
const inScene = o => { while (o) { if (o === scene) return true; o = o.parent; } return false; };
// 每帧一次（各章更新之后、主角动画之前）：推进画面附近的每一丛，挑出主角正在拨的那一丛
function stepBrush(dt) {
  HX.brush = null;
  if (!BRUSH.list.length) return;
  const play = state === 'play';
  let best = null, obs = null;                                                                       // 主角身上的那几段胶囊：有一丛挨着主角了才去算
  for (let i = BRUSH.list.length - 1; i >= 0; i--) {
    const Pl = BRUSH.list[i];
    if (!inScene(Pl.mesh)) { BRUSH.list.splice(i, 1); continue; }                                        // 那一章已经卸载了
    if (Math.abs(Pl.x - cam.x) > 24) continue;                                                       // 不在画面附近：不动
    const near = play && Math.abs(Pl.x - P.x) < Pl.span + 1.3 && Math.abs(P.y - Pl.y) < 1.5;
    if (!near && Math.abs(Pl.x - P.x) > Pl.span + 4) Pl.shed = 0;
    if (near) obs ??= heroObstacles();
    stepPlant(Pl, dt, near ? obs : null);
    if (near) { const g = brushGesture(Pl); if (g && (!best || g.k > best.k)) best = g; }
  }
  HX.brush = best;
}
