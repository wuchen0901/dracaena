
// ============================================================
//  第七章 · 管理花园：让野地重新得到水
//  系统修出来的“生态”：标准树列一模一样，枝叶剪成同一个高度；旁边那片不在规划里的野地干得开裂。
//  一台修剪机不停地剪掉一根挡住镜头的藤。
//  把倒在地上的树枝沿着压痕推到机械臂下面 → 刀片卡住，藤长上去，把维护门撑开 →
//  转动旧阀门，把一部分水从标准树列引到野地 → 野花和灌木慢慢长起来，盖住地面传感器 → 通往中继站的闸门打开
//
//  画面：这一章是大自然，颜色是鲜艳的（和前面几章的灰暗分开）—— 晴朗的春天：蓝天白云、嫩绿的草木、一垄一垄的花。
//  花园里的东西都是“规整”的：一模一样的球形树、笔直的树篱、一垄一个颜色的花、割出条纹的草坪、一直在喷的水。
//  野地和花园外面是“乱”的：每一棵树都不一样，花混着开。系统自己的东西（高杆上的镜头、水管）还是冷的深色。
// ============================================================
const CH7 = (() => {
  const X = X7, ENTRY = X + 1.2, ARM = X + 31.0, DOOR = X + 34.4, VALVE = X + 41, SENSOR = X + 56, GATE = X + 61.5, W0 = X + 46.5, W1 = X + 60;
  const C = chapter({ n: 7, x0: X + 0.5, start: X + 3, name: '管理花园', sub: '让野地重新得到水' });
  terrain([X8, 0]);
  ground(X + 2, 0x80bd56); ground(X + 44.5, 0x80bd56); ground(X + 47, 0xc2a05c); ground(X + 60, 0xc2a05c); ground(X + 64, 0x7fbb4c); ground(X8 - 4, 0x7fbb4c);
  const branch = pushable({ id: 'branch', x: X + 21.5, w: 1.7, h: 0.5, min: X + 20.4, max: X + 30.4, grip: 0.72 });
  const door = gate({ id: 'door7', x: DOOR, w: 0.6, h: 3.4, T: 4 });
  const relay = gate({ id: 'relay7', x: GATE, w: 0.8, h: 3.6, T: 1.8 });
  // jam 刀片卡住了 / vine 藤长到哪（0..1）/ valve 阀门有没有拨向野地 / g 野地的植物长到哪（0..1）
  const S = { jam: false, snipT: 0, snip: 0, vine: 0.15, valve: 0, vk: 0, g: 0, cat: 0 };
  usable({ id: 'valve', x: VALVE, r: 1.0, on() { S.valve = 1 - S.valve; fx('valve'); } });
  checkpoint(X + 3); checkpoint(X + 24); checkpoint(DOOR + 2.6); checkpoint(GATE + 2.5); checkpoint(X + 100);
  camKeys([X + 2, 19, 1.8, 0], [X + 16, 20, 2.2, 1], [X + 28, 20.5, 2.5, 1.5], [X + 38, 19.5, 2.0, 0.5], [X + 50, 20.5, 2.1, 1.5], [GATE + 1, 19.5, 1.9, 0.5], [X + 78, 23, 2.8, 3], [X + 100, 20, 2.0, 0], [X8 - 3, 18.5, 1.8, -1.2]);
  // 进了花园的门：晴朗的春天。太阳在左上方、略微偏后，影子朝右前方落在草地上；四角的暗角也放轻
  const SUN = [-0.42, 0.78, -0.28];
  env(X + 5, { fog: 0xd6ecf2, fogD: 0.006, hemiS: 0xeaf6ff, hemiG: 0x86b060, hemiI: 1.15, keyC: 0xfff4dc, keyI: 2.3, keyDir: SUN, rimI: 0.25, dustC: 0xffffff, dustO: 0.22,
    sky: [0x2f78c8, 0x4a94dc, 0x62aae8, 0xa3d2f2, 0xe2f1ee, 0xb9d8a0], sunX: -0.3, sunY: 0.36, sunP: 0.5, sunC: 0xfffbe8, cloud: 0.35, cloudC: 0xffffff, birds: 1, vig: 0.45 });
  env(X + 62, {});
  // 走出花园已是黄昏：太阳落到身后，天边烧成橘红
  env(X + 92, { fog: 0xf0c296, fogD: 0.007, hemiS: 0xffe0c4, hemiG: 0x5a5a38, hemiI: 0.95, keyC: 0xffc080, keyI: 2.3, keyDir: [-0.74, 0.3, -0.5], rimI: 0.3, dustC: 0xffe2b8, dustO: 0.4, wind: -0.5,
    sky: [0x35478a, 0x6b6fb4, 0xc487a6, 0xf5a878, 0xffd392, 0xb98a62], sunX: -0.38, sunY: 0.05, sunP: 1, sunC: 0xffe2b0, cloud: 1, cloudC: 0xffc9a0, birds: 0.4, flies: 0.5, vig: 0.6 });
  env(X8 - 13, {});
  // 快到中枢了：天色和暗角回到原来的样子（下一章没有写的项是从这里接过去的）
  env(X8 - 1.5, { sky: [0x33414f, 0x66717a, 0xb09a88, 0xe6b184, 0xf3c48c, 0xa77f60], cloudC: 0xffd9b4, birds: 0.3, flies: 0, vig: 1 });

  hint(() => !S.jam && Math.abs(P.x - branch.x) < 2.6 && P.y < 0.5 && P.mode !== 'push', '按住 <b>E</b> 推这根树枝 —— 地上的压痕通向机械臂下面');
  hint(() => !S.jam && P.x > ARM - 1 && P.x < DOOR && P.mode !== 'push', '修剪机一刻不停地剪那根藤。得有什么东西卡住它的刀片');
  hint(() => S.jam && door.open < 0.9 && P.x > ARM - 3 && P.x < DOOR, '刀片卡住了。藤在往门上长');
  hint(() => S.g < 1 && !S.valve && Math.abs(P.x - VALVE) < 1.6, '按 <b>E</b> 转动旧阀门');
  hint(() => S.g < 1 && !S.valve && P.x > SENSOR - 4 && P.x < GATE, '地面传感器还在扫 —— 旁边这片野地一滴水也分不到');
  hint(() => S.g < 1 && S.valve && P.x > W0 - 2 && P.x < GATE, '水在往野地里流。等它们长起来');

  const armL = pointLight({ p: [ARM - 0.3, 3.2, 0.2], c: 0xdfeef2, i: 4, d: 7, dec: 2 });
  const sensL = pointLight({ p: [SENSOR, 0.7, 0.4], c: 0xff3a22, i: 3, d: 6, dec: 2 });
  const ringL = pointLight({ p: [X + 84, 2.2, -7], c: 0x9fd6ff, i: 9, d: 14, dec: 1.6 });

  // ---- 配色（春天的嫩绿）----
  const PAL = { cloud: '#ffffff', cloudS: '#d9e6f2', mt1: ['#9dc0e2', '#c4dcee'], mt2: ['#78abcf', '#a9cedd'], mt3: ['#5fa487', '#8cc292'], haze: '#e6f4f6',
    midG: '#6ab552', mid: { base: '#58aa4a', shade: '#3f9046', light: '#8bcb5c', trunk: '#7a6650', trunkD: '#5f4f40' },
    near: { base: '#42a23e', shade: '#2b8438', light: '#93d552', trunk: '#6e553c', trunkD: '#4f3d2c' },
    hedge: { front: '#37943a', top: '#86cc52', low: '#2a7c35' }, mast: '#4a5860', shadow: 'rgba(8,50,30,.3)',
    wild: [{ base: '#4a9c42', shade: '#2f7a3c', light: '#86c852' }, { base: '#3a8a4a', shade: '#256a44', light: '#6fb85a' }, { base: '#6aa83a', shade: '#467f34', light: '#a6d24e' }].map(c => ({ ...c, trunk: '#6b4f38', trunkD: '#4a3526' })),
    pine: [{ base: '#3f8f52', shade: '#2a7048', light: '#6cb46a', trunk: '#5a4632' }, { base: '#35806a', shade: '#235f56', light: '#5ea888', trunk: '#4f4234' }], shrub: '#3c8a3c', shrubL: '#6fb84c', dryRidge: '#b79a5c', dead: '#6b5238',
    grass: ['#74b24c', '#8fd060', '#63a244', '#a2dc6a'], straw: ['#c9a85a', '#b08e48', '#d8bd72'], meadow: ['#6fae46', '#8cc85a', '#5a9a40', '#a6d466', '#c8d870'],
    fore: '#1f6a2c', fore2: '#2f8236', foreBranch: '#3a2c1f', foreFlower: ['#ffffff', '#ffd84a', '#ff8fb4'], flower: ['#e8443a', '#f4c932', '#ffffff', '#4f7fe0', '#ee7fb4', '#9a62d8', '#f28a2e'] };
  // 花田的每一垄：深度、花的颜色、亮一点的花。离路最近的一垄正好在主角身后，用深一些的红，米白的上衣才分得出来
  const ROWS = [[-3.4, '#d93a34', '#f0625a'], [-4.5, '#f08a2c', '#f8ae58'], [-5.6, '#f6cf3a', '#fbe27a'], [-6.7, '#f2efe4', '#ffffff'], [-7.8, '#9a6fd6', '#b894e6']];
  const NEAR = { step: 5.2, y: 1.4, h: 5.4 }, MID = { step: 4.2, y: 0.6, h: 6 };      // 两排标准树：间距、树根的高度、树高
  // 这一章自己的材质：修剪机是黄的，两道门是蓝绿的，围墙刷成白的，藤和灌木的叶子比别处鲜
  const M = { yellow: lam(0xedb630), teal: lam(0x2f8c94), teal2: lam(0x256f78), wall: lam(0xe6dfcb), leaf: lam(0x4fa83a), leaf2: lam(0x86cc4a), beak: lam(0xf0a030), eye: unlit(0x14181a) };
  const BIRD_COLS = [[0xf2c230, 0xfff0b8, 0xb98a1c], [0x4a90d9, 0xf4ecd8, 0x2f64a8], [0xe8683a, 0xf9e4c8, 0xa8442a], [0xe6e6de, 0xfafaf4, 0xa9b2b6], [0x58656c, 0xb9c4c6, 0x39444a]];   // 背、肚子、翅膀
  sfx.flutter = () => { for (let i = 0; i < 6; i++) hit(R2(1700, 2600), 1.2, 0.045, 0.05, 'bandpass', i * 0.05); };   // 一群鸟扑棱棱飞起来

  // ---- 画法 ----
  const hexOf = c => parseInt(c.slice(1), 16);
  const mix = (a, b, t) => { const A = hex3(hexOf(a)), B = hex3(hexOf(b)); return '#' + A.map((v, i) => Math.round(lerp(v, B[i], t) * 255).toString(16).padStart(2, '0')).join(''); };
  const rgba = (c, a) => { const [r, g, b] = hex3(hexOf(c)).map(v => Math.round(v * 255)); return `rgba(${r},${g},${b},${a})`; };
  const hash = n => { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); };
  const LIGHT = [-0.62, 0.78];                                     // 画在板子上的东西，亮面朝哪边：左上
  // 一团枝叶：边上一圈小叶团，里面的叶团朝光的一面浅、背光的一面深。c: { shade 背光, base 本色, light 受光 }
  // same = true 时每一团都从同一个种子画起 —— 标准树真的一模一样；野地里的树不这样，每一团都不同
  function leafBall(g, x, y, r, c, same = true, n = 340) {
    const s0 = _seed; if (same) _seed = 4242;
    const blobs = [[0, 0, 0.9]]; for (let i = 0; i < 26; i++) { const a = i / 26 * 6.2832 + rr(-0.08, 0.08); blobs.push([Math.cos(a) * 0.84, Math.sin(a) * 0.84, rr(0.13, 0.2)]); }
    g.save(); g.beginPath(); for (const [bx_, by, br] of blobs) { g.moveTo(x + (bx_ + br) * r, y + by * r); g.arc(x + bx_ * r, y + by * r, br * r, 0, 6.2832); } g.clip();
    g.fillStyle = c.shade; g.fillRect(x - 1.2 * r, y - 1.2 * r, 2.4 * r, 2.4 * r);
    g.fillStyle = c.base; disc(g, x + LIGHT[0] * 0.22 * r, y + LIGHT[1] * 0.22 * r, r * 0.98);
    const hi = mix(c.light, '#fffbe0', 0.3), mid = mix(c.base, c.light, 0.5), low = mix(c.base, c.shade, 0.5);
    for (let i = 0; i < n; i++) {
      const a = rr(0, 6.2832), d = Math.sqrt(rnd()), px = Math.cos(a) * d, py = Math.sin(a) * d, lit = px * LIGHT[0] + py * LIGHT[1] + rr(-0.3, 0.3);
      g.fillStyle = lit > 0.72 ? hi : lit > 0.42 ? c.light : lit > 0.1 ? mid : lit > -0.2 ? c.base : lit > -0.5 ? low : c.shade;
      disc(g, x + px * r, y + py * r, r * rr(0.04, 0.095) * Math.sqrt(340 / n));
    }
    g.restore(); if (same) _seed = s0;
  }
  // 标准树：一模一样的树干 + 一模一样的球
  function stdTree(g, x, y, h, c) {
    const r = h * 0.26, cy_ = y + h * 0.74, tw = Math.max(0.1, h * 0.03);
    g.fillStyle = c.trunk; poly(g, [[x - tw * 0.6, y], [x + tw * 0.6, y], [x + tw * 0.42, cy_], [x - tw * 0.42, cy_]]);
    g.fillStyle = c.trunkD; poly(g, [[x + tw * 0.1, y], [x + tw * 0.6, y], [x + tw * 0.42, cy_], [x + tw * 0.08, cy_]]);
    leafBall(g, x, cy_, r, c);
  }
  // 没人修剪过的树：树干歪一点、分着杈，顶上几团大小不一的枝叶
  function wildTree(g, x, y, h, c, n = 150) {
    const w = h * 0.035 + 0.07, lean = rr(-0.06, 0.06) * h, ty = y + h * 0.64;
    g.fillStyle = c.trunk; poly(g, [[x - w * 1.5, y], [x + w * 1.5, y], [x + lean + w * 0.6, ty], [x + lean - w * 0.6, ty]]);
    g.fillStyle = c.trunkD; poly(g, [[x + w * 0.2, y], [x + w * 1.5, y], [x + lean + w * 0.6, ty], [x + lean + w * 0.1, ty]]);
    setInk(g, c.trunk); for (let i = 0; i < 2; i++) { const a = rr(0.5, 1.0) * (i ? 1 : -1), by = y + h * rr(0.36, 0.52); line(g, [[x + lean * 0.6, by], [x + lean * 0.6 + Math.sin(a) * h * 0.2, by + Math.cos(a) * h * 0.2]], w * 0.7); }
    const lobes = [[x + lean, y + h * 0.78, h * 0.22]]; for (let i = 0, k = 4 + Math.floor(rr(0, 3)); i < k; i++) lobes.push([x + lean + rr(-0.26, 0.26) * h, y + h * rr(0.58, 0.9), h * rr(0.13, 0.2)]);
    lobes.sort((a, b) => a[1] - b[1]);                             // 低的先画，高的压在上面
    for (const [lx, ly, lr] of lobes) leafBall(g, lx, ly, lr, c, false, n);
  }
  // 针叶树：一层层的枝，左半边受光、右半边背光（两棵挨在一起也分得出是两棵）
  function pineTree(g, x, y, h, c) {
    const w = h * 0.03 + 0.06;
    g.fillStyle = c.trunk; poly(g, [[x - w, y], [x + w, y], [x + w * 0.3, y + h * 0.5], [x - w * 0.3, y + h * 0.5]]);
    for (let i = 0; i < 7; i++) {
      const k = i / 7, yy = y + h * (0.16 + 0.84 * k), r = h * 0.2 * (1 - k * 0.85) * rr(0.85, 1.15), top = yy + h * 0.24;
      g.fillStyle = c.shade; poly(g, [[x, yy - h * 0.012], [x + r, yy], [x + r * 0.1, top], [x, top]]);
      g.fillStyle = c.base; poly(g, [[x, yy - h * 0.012], [x - r, yy], [x - r * 0.1, top], [x, top]]);
      g.fillStyle = c.light; poly(g, [[x - r * 0.55, yy + h * 0.035], [x - r, yy], [x - r * 0.1, top]]);
    }
  }
  // 一朵云：一个扁的主体，上面叠几团；底下留一点偏冷的暗部。整层再虚化一下，边缘是软的
  function cloud(g, x, y, w) {
    const puffs = [[0, 0, w * 0.5, w * 0.1]];
    for (let i = 0, n = 3 + Math.floor(w / 16); i < n; i++) { const k = (i + 0.5) / n - 0.5, e = 1 - Math.abs(k) * 1.7; puffs.push([k * w * 0.72, w * (0.05 + 0.07 * e) * rr(0.7, 1.2), w * rr(0.12, 0.2) * (0.6 + 0.5 * e), w * rr(0.08, 0.13) * (0.6 + 0.6 * e)]); }
    g.fillStyle = PAL.cloudS; for (const [dx, dy, rx, ry] of puffs) { g.beginPath(); g.ellipse(x + dx, y + dy - ry * 0.25, rx, ry, 0, 0, 6.2832); g.fill(); }
    g.fillStyle = PAL.cloud; for (const [dx, dy, rx, ry] of puffs) { g.beginPath(); g.ellipse(x + dx - rx * 0.05, y + dy + ry * 0.12, rx * 0.97, ry * 0.9, 0, 0, 6.2832); g.fill(); }
  }
  // 剪得笔直的树篱：正面一片细碎的叶团，越往上越亮，顶上一道受光的边
  function hedge(g, x1, x2, top, c) {
    setInk(g, c.front); box(g, x1, -3, x2 - x1, top + 3);
    setInk(g, vgrad(g, top * 0.7, -0.1, rgba(c.low, 0), rgba(c.low, 1))); box(g, x1, -3, x2 - x1, top * 0.7 + 3);
    const lt = mix(c.front, c.top, 0.55), dk = mix(c.front, c.low, 0.6);
    for (let i = 0, n = Math.round((x2 - x1) * 170); i < n; i++) { const x = rr(x1, x2), y = rr(0, top - 0.03), k = y / top + rr(-0.4, 0.4); g.fillStyle = k > 0.8 ? lt : k < 0.35 ? dk : c.front; disc(g, x, y, rr(0.03, 0.07)); }
    setInk(g, c.top); box(g, x1, top - 0.16, x2 - x1, 0.16);
  }
  // 一排草叶：高度 h0..h1，每米 dens 根，cols 是几种深浅；f(x) 给出这里的草有多高（0..1，0 就是不长），用来画出一丛一丛的样子
  function blades(g, x1, x2, h0, h1, dens, cols, f) {
    for (let x = x1; x < x2; x += rr(0.5, 1.5) / dens) {
      const e = f ? f(x) : 1, h = rr(h0, h1) * e, l = rr(-0.3, 0.3) * h, w = rr(0.012, 0.022), c = cols[Math.floor(rr(0, cols.length))];
      if (e < 0.12) continue;
      g.fillStyle = c; poly(g, [[x - w, 0], [x + w, 0], [x + l, h]]);
    }
  }
  // 一丛一丛：k 换一个数就换一种分布，cover 是长草的地方占多少
  const patchy = (k, cover) => x => clamp((0.5 + 0.3 * Math.sin(x * 1.9 + k * 2.7) + 0.2 * Math.sin(x * 0.53 + k * 5.1) - (1 - cover)) * 4, 0, 1);
  // 混着开的野花：高高低低的草，里面插着各种颜色的花（一朵的、一串的）
  function wildflowers(g, x1, x2, hMax, dens = 1) {
    blades(g, x1, x2, hMax * 0.3, hMax * 0.75, 30 * dens, PAL.meadow);
    for (let x = x1 + 0.05; x < x2 - 0.05; x += rr(0.08, 0.3) / dens) {
      const h = hMax * rr(0.45, 1), c = PAL.flower[Math.floor(rr(0, PAL.flower.length))], l = rr(-0.08, 0.08), r = rr(0.03, 0.055), t = rnd();
      g.strokeStyle = '#4c9a3c'; g.lineWidth = 0.014; g.beginPath(); g.moveTo(x, 0); g.quadraticCurveTo(x + l * 0.3, h * 0.6, x + l, h - r); g.stroke();
      g.fillStyle = c;
      if (t < 0.25) for (let k = 0; k < 5; k++) disc(g, x + l * (1 - k * 0.06), h - r - k * r * 1.1, r * (0.75 - k * 0.07));
      else { disc(g, x + l, h - r, r); g.fillStyle = t < 0.6 ? '#f6d24a' : mix(c, '#000000', 0.35); disc(g, x + l, h - r, r * 0.38); }
    }
  }
  // 受光照的布景板：用 backdrop 的 lit（吃灯光、接得住影子），再把法线改成朝上，明暗就和地面一致（草、花用）
  function litBoard(x1, x2, y1, y2, z, ppm, draw, o = {}) {
    const m = backdrop(x1, x2, y1, y2, z, ppm, draw, { ...o, lit: true }), n = m.geometry.attributes.normal;
    for (let i = 0; i < n.count; i++) n.setXYZ(i, 0, 1, 0);
    return m;
  }
  // 把一块板子的原点挪到底边：之后缩放就是“从地里长出来”
  function rooted(m) { const h = m.geometry.parameters.height; m.geometry.translate(0, h / 2, 0); m.position.y -= h / 2; return m; }

  // ---- 鸟 ----
  // 落着的小鸟：flee 是主角走到多近它就飞走（0 = 不怕人），飞远了、主角也走远了再落回来；wait = true 的先不出现，等野地长好了才飞来
  function mkBird(R, i, x, y, z, o = {}) {
    const [c1, c2, c3] = BIRD_COLS[i % BIRD_COLS.length], m1 = lam(c1, { emissive: c1, emissiveIntensity: 0.15 }), m2 = lam(c2, { emissive: c2, emissiveIntensity: 0.15 }), m3 = lam(c3, { emissive: c3, emissiveIntensity: 0.15 });
    const g = grp(R, x, y, z); g.scale.setScalar(o.s ?? 1.25);
    const body = grp(g, 0, 0.085, 0);
    add(body, new THREE.SphereGeometry(0.07, 8, 6), m1, 0, 0, 0, false).scale.set(1.45, 1, 0.9);
    add(body, new THREE.SphereGeometry(0.055, 8, 6), m2, 0.025, -0.022, 0, false).scale.set(1.35, 0.8, 0.86);
    const head = grp(body, 0.085, 0.06, 0); add(head, new THREE.SphereGeometry(0.046, 8, 6), m1, 0, 0, 0, false);
    add(head, new THREE.ConeGeometry(0.014, 0.05, 5), M.beak, 0.062, -0.004, 0, false).rotation.z = -Math.PI / 2;
    for (const sz of [-1, 1]) add(head, new THREE.SphereGeometry(0.009, 5, 4), M.eye, 0.026, 0.012, sz * 0.04, false);
    add(body, bx(0.15, 0.012, 0.05), m3, -0.155, 0.02, 0, false).rotation.z = 0.32;
    const wings = [-1, 1].map(sz => { const w = grp(body, -0.01, 0.035, sz * 0.05), geo = bx(0.13, 0.012, 0.17); geo.translate(-0.015, 0, sz * 0.085); add(w, geo, m3, 0, 0, 0, false); return w; });
    for (const sz of [-1, 1]) add(g, cy(0.005, 0.005, 0.05, 4), M.beak, 0.01, 0.025, sz * 0.022, false);
    const b = { g, body, head, wings, x0: x, y0: y, z0: z, st: 'perch', t: 0, seed: i * 1.37 + x * 0.61, face: o.face ?? (i % 2 ? 1 : -1), flee: o.flee ?? 2.8, ground: y < 0.1, wait: !!o.wait, vx: 0, vy: 0, vz: 0, fx: 1 };
    g.rotation.y = b.face > 0 ? 0 : Math.PI; return b;
  }
  const flap = (b, up) => b.wings.forEach((w, i) => { w.rotation.x = (i ? -1 : 1) * up; w.scale.z = up < -1 ? 0.62 : 1; });   // up > 0 翅膀抬起；-1.45 是收着，贴在身子两侧
  function birdOff(b, quiet) { b.st = 'fly'; b.t = 0; b.fx = b.x0 >= P.x ? 1 : -1; b.vx = b.fx * 1.2; b.vy = 2.6; b.vz = 0; b.g.rotation.y = b.fx > 0 ? 0.5 : Math.PI - 0.5; if (!quiet) fx('flutter'); }
  function stepBird(b, dt) {
    const g = b.g; b.t += dt;
    if (b.wait) { g.visible = false; if (S.g >= 1) { b.wait = false; b.st = 'come'; b.t = 0; g.visible = true; } return; }
    if (b.st === 'perch') {                               // 落着：每隔一会儿做一件小事 —— 啄一下、蹦一下、扭头看看
      const q = T * 0.7 + b.seed, n = Math.floor(q), f = q - n, h = hash(n + b.seed * 7);
      const peck = b.ground && h < 0.45 ? Math.sin(Math.min(1, f * 2.2) * Math.PI) : 0, hop = h > 0.8 ? Math.sin(clamp(f * 3, 0, 1) * Math.PI) : 0;
      b.body.rotation.z = -0.9 * peck; b.head.rotation.y = h > 0.5 && h < 0.8 ? 1.0 * sstep(0, 0.2, f) * (1 - sstep(0.7, 0.9, f)) : 0;
      g.position.set(b.x0, b.y0 + 0.05 * hop, b.z0); flap(b, -1.45);
      if (b.flee > 0 && state === 'play' && Math.abs(P.x - b.x0) < b.flee && Math.abs(P.y - b.y0) < 4.2) birdOff(b);
    } else if (b.st === 'fly') {                          // 飞走：背着主角，往上、往树那边
      b.vx = damp(b.vx, b.fx * 4.4, 3, dt); b.vy = damp(b.vy, 2.2, 2, dt); b.vz = damp(b.vz, -2.4, 2, dt);
      g.position.x += b.vx * dt; g.position.y += (b.vy + 0.6 * Math.sin(b.t * 9)) * dt; g.position.z += b.vz * dt;
      b.body.rotation.z = 0.3; b.head.rotation.y = 0; flap(b, 0.15 + 1.0 * Math.sin(b.t * 30 + b.seed));
      if (b.t > 5 || g.position.y > 12) { b.st = 'gone'; b.t = 0; g.visible = false; }
    } else if (b.st === 'gone') {                         // 主角走远了（已经在画面外）再落回原处
      if (b.t > 4 && Math.abs(P.x - b.x0) > 13) { b.st = 'perch'; g.visible = true; g.rotation.y = b.face > 0 ? 0 : Math.PI; }
    } else if (b.st === 'come') {                         // 飞来：从右上方落到自己的位置上
      const k = Math.min(1, b.t / 3.2), e = 1 - (1 - k) * (1 - k), a = 1 - e;
      g.position.set(b.x0 + a * 9, b.y0 + a * 5 + 0.9 * Math.sin(a * 3.1), b.z0 - a * 5); g.rotation.y = Math.PI - 0.4 * a;
      b.body.rotation.z = 0.25 * a; flap(b, 0.15 + (0.5 + 0.5 * a) * Math.sin(b.t * 28 + b.seed));
      if (k >= 1) { b.st = 'perch'; g.rotation.y = b.face > 0 ? 0 : Math.PI; }
    }
  }
  // 天上成群飞过的鸟：隔得远，只画两片扇动的翅膀
  function mkFlock(R, n, hex, y, z, v, x1, x2) {
    const mat = unlit(hex, { side: THREE.DoubleSide, fog: false }), birds = [];
    for (let i = 0; i < n; i++) {
      const g = grp(R, 0, 0, z), row = Math.ceil(i / 2), side = i % 2 ? 1 : -1;
      const wings = [-1, 1].map(sx => { const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, sx * 0.62, 0.06, 0, sx * 0.28, -0.17, 0], 3)); const w = new THREE.Mesh(geo, mat); g.add(w); return w; });
      birds.push({ g, wings, dx: -Math.sign(v) * row * 1.5 + rr(-0.3, 0.3), dy: row * side * 0.55 + rr(-0.2, 0.2), ph: rr(0, 6) });
    }
    return { birds, y, v, x1, x2 };
  }
  function stepFlock(F) {
    const L = F.x2 - F.x1, x = F.v > 0 ? F.x1 + (T * F.v) % L : F.x2 - (T * -F.v) % L;
    for (const b of F.birds) { b.g.position.x = x + b.dx; b.g.position.y = F.y + b.dy + 0.3 * Math.sin(T * 0.8 + b.ph); const a = 0.12 + 0.55 * Math.sin(T * 6.5 + b.ph); b.wings[0].rotation.z = -a; b.wings[1].rotation.z = a; }
  }

  let V = null;
  const VPTS = [[X + 31.25, 0], [X + 31.4, 0.7], [X + 31.9, 1.5], [X + 32.7, 2.2], [X + 33.4, 2.75], [X + 34.0, 3.2], [X + 34.5, 3.45], [X + 35.1, 3.2]];   // 藤从水泥缝里一路长到门顶
  function* build(R) {
    const v = { tint: [], birds: [], flocks: [], out: [] };
    // 到了黄昏那一段，这些不受光照的板子跟着镜头一起染上暮色（乘上去的颜色）
    const dusk = (m, hex) => { m.userData.dusk = new THREE.Color(hex); v.tint.push(m); return m; };
    // 这一章有两层画得很远，一直伸到中枢的背后（云、远山）。镜头进了中枢就把它们收起来：
    // 不然从中枢另一头走出去的时候，这一章还没卸载，它们会出现在下一章的天上，过一会儿又突然消失
    const far = m => { v.out.push([m, m.material.opacity]); return m; }, outK = () => 1 - sstep(X8 + 3, X8 + 24, camera.position.x);
    // 云：很远的一层，几乎不跟着镜头动；从城市那边走过来时是慢慢显出来的
    far(dusk(backdrop(X - 150, X8 + 260, 24, 100, -420, 4, g => { for (let x = X - 140; x < X8 + 250; x += rr(52, 96)) cloud(g, x, rr(36, 70), rr(30, 62)); },
      { fog: false, order: -3000, blur: 3, opacity: 0.95, fadeL: 110, fadeR: 60 }), 0xffb48a));
    yield;
    // 远山：三道，越远越淡、越蓝。左头和第六章那层远景交叠着淡入淡出
    far(dusk(backdrop(X - 60, X8 + 70, -6, 50, -149, 10, g => {
      const a = X - 60, b = X8 + 70;
      setInk(g, vgrad(g, 27, 3, ...PAL.mt1)); ridge(g, a, b, -6, x => 17 + 6 * Math.sin(x / 31) + 3 * Math.sin(x / 11 + 2) + 1.2 * Math.sin(x / 4.7) + rr(-0.4, 0.4), 1.5);
      setInk(g, vgrad(g, 15, 3, ...PAL.mt2)); ridge(g, a, b, -6, x => 10 + 3.6 * Math.sin(x / 19 + 1) + 1.8 * Math.sin(x / 6.3) + rr(-0.4, 0.4), 1.2);
      setInk(g, vgrad(g, 8, 3, ...PAL.mt3)); ridge(g, a, b, -6, x => 5.6 + 1.6 * Math.sin(x / 13 + 4) + 0.9 * Math.sin(x / 3.7) + rr(-0.3, 0.3), 0.7);
    }, { fog: false, order: -1999, fadeL: 44, fadeR: 44 }), 0xd8a2b6));
    for (const [m, a] of v.out) { m.material.opacity = a * outK(); m.visible = outK() > 0.01; }      // 搭的时候镜头已经在中枢里：一开始就是收起来的
    yield;
    // 中景（花园）：一排一模一样的标准树，隔几棵一根架着镜头的高杆。底下那道矮坡正好挡住它后面远处的地面
    dusk(backdrop(X + 1.4, X + 64, -4, 14, -40, 28, g => {
      setInk(g, PAL.midG); ridge(g, X + 1.4, X + 64, -4, x => 2.7 + rr(0, 0.3), 2);
      for (let x = X + 8; x < X + 62; x += 14) { setInk(g, PAL.mast); poly(g, [[x - 0.14, 0], [x + 0.14, 0], [x + 0.09, 10.5], [x - 0.09, 10.5]]); box(g, x - 0.85, 10.1, 1.0, 0.4); box(g, x - 1.0, 10.16, 0.2, 0.28); setInk(g, '#f0503c'); disc(g, x - 0.74, 10.3, 0.09); }
      for (let x = X + 4.6; x < X + 62; x += MID.step) stdTree(g, x, MID.y, MID.h, PAL.mid);
    }, { fadeR: 2 }), 0xcfae96);
    yield;
    // 中景（花园外）：自己长的林子，每一棵都不一样
    dusk(backdrop(X + 62, X8 + 20, -4, 34, -40, 20, g => {
      setInk(g, PAL.midG); ridge(g, X + 62, X8 + 20, -4, x => 2.7 + rr(0, 0.8), 2);
      for (let x = X + 66; x < X8 + 18; x += rr(2.6, 5.5)) { if (rnd() < 0.3) pineTree(g, x, 0.5, rr(11, 20), PAL.pine[Math.floor(rr(0, 2))]); else wildTree(g, x, 0.5, rr(11, 18), PAL.wild[Math.floor(rr(0, 3))], 90); }
    }, { fadeL: 3, fadeR: 12 }), 0xa08a6c);
    yield;
    // 两排树之间的一层薄雾：把前后两排分开
    dusk(backdrop(X - 30, X8 - 2, 0, 9, -24, 2, g => { g.fillStyle = vgrad(g, 8.5, 0.5, rgba(PAL.haze, 0), rgba(PAL.haze, 0.5)); g.fillRect(X - 30, 0, X8 - X + 28, 9); }, { fog: false, fadeL: 26, fadeR: 14 }), 0xffc49a);   // 到中枢的墙为止：再往右它就挡在中枢的后墙前面了
    // 近一层（花园）：剪得笔直的树篱，树篱后面一排标准树。从进门的那道墙开始
    backdrop(ENTRY, X + 44.4, -3, 9, -9, 56, g => {
      for (let x = X + 6.4; x < X + 44; x += NEAR.step) stdTree(g, x, NEAR.y, NEAR.h, PAL.near);
      hedge(g, ENTRY, X + 44, 1.6, PAL.hedge);
    }, { order: -35 });
    yield;
    // 近一层（野地和花园外）：野地里是枯树；出了花园是没人管的树和灌木
    dusk(backdrop(X + 43.6, X8 + 8, -3, 20, -9, 30, g => {
      setInk(g, PAL.dryRidge); ridge(g, X + 44, X + 62, -3, x => 0.35 + rr(0, 0.25), 0.7);
      setInk(g, PAL.dead); for (const x of [X + 48.5, X + 53, X + 58.6]) tree(g, x, 0.2, rr(3.5, 5.5), 'dead');
      const top = x => 0.8 + 0.6 * Math.sin(x / 2.9);
      setInk(g, PAL.shrub); ridge(g, X + 62, X8 + 8, -3, x => top(x) + rr(0, 0.9), 0.8);
      for (let i = 0; i < 900; i++) { const x = rr(X + 62, X8 + 8); g.fillStyle = rnd() < 0.4 ? PAL.shrubL : mix(PAL.shrub, '#1c5a2c', 0.5); disc(g, x, rr(0.1, top(x) + 0.5), rr(0.06, 0.16)); }
      for (let x = X + 64; x < X8 + 6; x += rr(3, 7)) { const c = PAL.wild[Math.floor(rr(0, 3))]; if (rnd() < 0.45) wildTree(g, x, 0.4, rr(6, 12), c); else for (let k = 0; k < 5; k++) leafBall(g, x + rr(-1.2, 1.2), 1.4 + rr(0, 1), rr(0.7, 1.4), c, false, 110); }
      setInk(g, PAL.shrub); grass(g, X + 62, X8 + 6, () => 0.7, 0.4, 1.3, 330); setInk(g, PAL.shrubL); grass(g, X + 62, X8 + 6, () => 0.7, 0.4, 1.2, 170);
    }, { order: -35, fadeR: 6 }), 0x9c8466);
    yield;

    // ---- 花园的地面 ----
    // 草坪：割草机留下的一道道深浅；树篱和树冠落在草地上的影子。要先画：立在草地上的花垄得盖在它上面
    decal(R, ENTRY + 0.2, X + 44.5, -9, 9.6, 0, 14, g => {             // 往镜头这边一直铺到画面外（镜头最低的时候，能看到 z = 8.9）
      for (let x = X - 2, i = 0; x < X + 44.5; x += 1.3, i++) { g.fillStyle = i % 2 ? 'rgba(255,255,255,.06)' : 'rgba(0,40,10,.06)'; g.fillRect(x, -9, 1.3, 18.6); }
      g.fillStyle = PAL.shadow; g.fillRect(ENTRY, -9, X + 44.5 - ENTRY, 1.6 * -SUN[2] / SUN[1]);
      const hC = NEAR.y + NEAR.h * 0.74, r = NEAR.h * 0.26, k = Math.hypot(SUN[0], SUN[2]) / SUN[1];
      for (let x = X + 6.4; x < X + 44; x += NEAR.step) { g.beginPath(); g.ellipse(x - SUN[0] / SUN[1] * hC, -9 - SUN[2] / SUN[1] * hC, r * Math.hypot(1, k), r, Math.atan2(-SUN[2], -SUN[0]), 0, 6.2832); g.fill(); }
    }).renderOrder = -40;
    // 修剪机脚下的一块水泥地：藤就是从它的裂缝里长出来的
    decal(R, ARM - 4.1, ARM + 1.1, -1.9, 0.8, 0.001, 36, g => {
      g.fillStyle = '#d4cfc0'; g.fillRect(ARM - 4.1, -1.9, 5.2, 2.7);
      g.strokeStyle = 'rgba(120,112,96,.45)'; g.lineWidth = 0.03; for (const x of [ARM - 2.8, ARM - 1.5, ARM - 0.2]) { g.beginPath(); g.moveTo(x, -1.9); g.lineTo(x, 0.8); g.stroke(); }
      g.strokeStyle = 'rgba(120,112,96,.3)'; g.lineWidth = 0.05; g.strokeRect(ARM - 4.08, -1.88, 5.16, 2.66);
      g.strokeStyle = '#3c3a34'; g.lineWidth = 0.05; g.beginPath(); g.moveTo(X + 31.3, -0.75); g.lineTo(X + 31.18, -0.3); g.lineTo(X + 31.3, 0.1); g.lineTo(X + 31.2, 0.45); g.lineTo(X + 31.27, 0.8); g.stroke();   // 裂缝
    }).renderOrder = 1;
    // 树枝压出来的两道印子：草被压倒了，露出一点土
    decal(R, X + 20.4, ARM + 0.6, -0.8, 0.8, 0.002, 40, g => {
      g.fillStyle = 'rgba(206,222,140,.22)'; g.fillRect(X + 20.7, -0.32, ARM - 4.1 - X - 20.7, 0.64);
      for (const dz of [-0.2, 0.2]) for (let i = 0; i < 4; i++) { g.strokeStyle = `rgba(74,70,40,${0.16 + 0.1 * i})`; g.lineWidth = 0.15 - i * 0.035; g.beginPath(); g.moveTo(X + 20.9, dz + (i - 2) * 0.012); g.lineTo(ARM + 0.2, dz - (i - 2) * 0.012); g.stroke(); }
    });
    // 规整的花田：路的里侧一垄一垄的花，一垄一个颜色，垄距一样宽
    for (const [z, c1, c2] of ROWS) litBoard(X + 1.6, X + 44, 0, 0.62, z, 56, g => {
      setInk(g, PAL.near.shade); box(g, X + 1.6, 0, 42.4, 0.2);
      setInk(g, PAL.near.base); for (let x = X + 1.6; x < X + 44; x += 0.07) poly(g, [[x - 0.05, 0.12], [x + 0.05, 0.12], [x + rr(-0.03, 0.03), rr(0.28, 0.4)]]);
      for (let x = X + 1.6; x < X + 44; x += 0.085) { g.fillStyle = rnd() < 0.35 ? c2 : c1; disc(g, x + rr(-0.02, 0.02), rr(0.36, 0.54), rr(0.045, 0.06)); }
    });
    yield;
    // 脚下的草：一排排立着的草叶，前后错开、一丛一丛的，合起来就是一片草地。贴着主角走的这一条最密，正好没过鞋底；
    // 越往镜头这边越稀。水泥地上不长，树枝压过的地方矮一截。[深度, 最高多高, 每米几根, 长草的地方占多少]
    const onPad = x => x > ARM - 4.15 && x < ARM + 1.15, onTrack = x => x > X + 20.6 && x < ARM - 4.1;
    const LAWN = [[-2.9, 0.16, 30, 0.45], [-1.95, 0.16, 30, 0.5], [-1.5, 0.15, 34, 0.6], [-1.0, 0.15, 34, 0.65], [-0.55, 0.14, 36, 0.7], [-0.2, 0.13, 36, 0.7], [0.28, 0.13, 36, 0.75], [0.62, 0.14, 36, 0.7],
      [1.0, 0.15, 34, 0.65], [1.45, 0.16, 32, 0.6], [2.0, 0.17, 28, 0.4], [2.7, 0.17, 28, 0.35], [3.5, 0.18, 26, 0.32], [4.4, 0.18, 26, 0.3], [5.4, 0.19, 24, 0.3], [6.5, 0.2, 24, 0.3]];
    for (let i = 0; i < LAWN.length; i++) {
      const [z, h1, dens, cover] = LAWN[i], f = patchy(i, cover);
      litBoard(ENTRY + 0.2, X + 44.4, 0, 0.24, z, 90, g => blades(g, ENTRY + 0.2, X + 44.4, 0.06, h1, dens, PAL.grass, x => z > -1.95 && z < 0.8 && onPad(x) ? 0 : f(x) * (Math.abs(z) < 0.5 && onTrack(x) ? 0.45 : 1)));
      if (i % 6 === 5) yield;
    }
    yield;

    // ---- 花园里的东西 ----
    // 进花园的门：一道白墙、一个没有门扇的门洞，门洞上方一只小镜头
    add(R, bx(0.4, 3.4, 30), M.wall, ENTRY, 1.7, -16.6); add(R, bx(0.4, 3.4, 4), M.wall, ENTRY, 1.7, 3.6);
    for (const z of [-1.4, 1.4]) add(R, bx(0.5, 3.6, 0.24), MAT.steel, ENTRY, 1.8, z);
    add(R, bx(0.5, 0.3, 3.0), MAT.steel, ENTRY, 3.65, 0);
    add(R, bx(0.26, 0.2, 0.3), MAT.dark, ENTRY + 0.4, 3.3, 0.9); add(R, new THREE.SphereGeometry(0.04, 6, 5), unlit(0xff3a2a, { fog: false }), ENTRY + 0.55, 3.32, 1.0, false);
    // 滴灌管：沿着标准树列的一根细管，隔一段一个滴头
    add(R, cy(0.05, 0.05, 41, 6), MAT.steel, X + 22, 0.3, -2.3).rotation.z = Math.PI / 2;
    v.drips = []; for (let x = X + 2; x < X + 42; x += 4.2) { add(R, cy(0.03, 0.03, 0.3, 5), MAT.dark, x, 0.15, -2.3, false); v.drips.push(add(R, new THREE.SphereGeometry(0.035, 6, 5), unlit(0xbfe6f0, { fog: false }), x, 0.06, -2.2, false)); }
    // 喷灌：标准树这一侧隔一段一只喷头，细细的水线向两边甩开；隔两只有一只的水雾里挂着一小段彩虹。水拨给野地以后就小下去
    v.spr = [];
    for (let x = X + 3.6, i = 0; x < X + 44; x += 6.3, i++) v.spr.push({ x, m: rooted(backdrop(x - 2.7, x + 2.7, 0, 4.2, -5.1, 40, g => {
      setInk(g, '#56646a'); box(g, x - 0.03, 0, 0.06, 0.62); box(g, x - 0.08, 0.58, 0.16, 0.08);
      const gr = g.createRadialGradient(x, 0.9, 0.1, x, 0.9, 2.5); gr.addColorStop(0, 'rgba(255,255,255,.34)'); gr.addColorStop(0.55, 'rgba(255,255,255,.14)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.beginPath(); g.ellipse(x, 0.9, 2.5, 1.5, 0, 0, 6.2832); g.fill();
      g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 0.022;
      for (let k = 0; k < 9; k++) { const dx = (k - 4) * 0.52, top = 1.9 - Math.abs(k - 4) * 0.2; g.beginPath(); g.moveTo(x, 0.64); g.quadraticCurveTo(x + dx * 0.55, 0.64 + top * 1.5, x + dx, 0.5); g.stroke(); }
      if (i % 3 === 2) ['236,84,84', '244,160,70', '246,226,96', '120,208,124', '96,166,240', '150,116,226'].forEach((c, k) => {
        const a0 = Math.PI * 0.2, a1 = Math.PI * 0.52, r = 2.25 - k * 0.06, gr2 = g.createLinearGradient(x + 0.3 + r * Math.cos(a0), 0, x + 0.3 + r * Math.cos(a1), 0);
        gr2.addColorStop(0, `rgba(${c},0)`); gr2.addColorStop(0.3, `rgba(${c},.5)`); gr2.addColorStop(0.75, `rgba(${c},.5)`); gr2.addColorStop(1, `rgba(${c},0)`);
        g.strokeStyle = gr2; g.lineWidth = 0.06; g.beginPath(); g.arc(x + 0.3, 0.1, r, a0, a1); g.stroke(); });
    }, { fog: false })) });
    { // 沿着水线飞的水珠
      const n = v.spr.length * 54, geo = new THREE.BufferGeometry(); v.dropPos = new Float32Array(n * 3); geo.setAttribute('position', new THREE.BufferAttribute(v.dropPos, 3));
      v.drops = new THREE.Points(geo, new THREE.PointsMaterial({ map: GLOW, color: 0xffffff, size: 0.08, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
      v.drops.frustumCulled = false; v.drops.renderOrder = -19; R.add(v.drops);
    }
    // 修剪机：一根立柱、一条横臂、一只垂下来的刀头。刷成黄的，在一片绿里一眼看得见
    add(R, cy(0.12, 0.16, 3.6, 10), M.yellow, ARM - 3.4, 1.8, -1.3); add(R, bx(3.9, 0.2, 0.2), M.yellow, ARM - 1.55, 3.5, -1.3);
    tube(R, [[ARM - 3.4, 3.5, -1.3], [ARM - 0.2, 3.5, -1.3], [ARM, 3.3, -0.3]], 0.07, M.yellow, 12);
    v.head = grp(R, ARM, 0.95, -0.15); add(v.head, cy(0.05, 0.05, 2.4, 6), MAT.dark, 0, 1.25, 0); add(v.head, bx(0.3, 0.26, 0.3), M.yellow, 0, 0.12, 0);
    v.blades = [1, -1].map(sx => { const b = grp(v.head, 0, 0, 0.16); const m = add(b, bx(0.62, 0.07, 0.03), MAT.pale, sx * 0.3, 0, 0, false); m.rotation.z = sx * 0.08; return b; });
    v.armLamp = unlit(0xdfeef2, { fog: false }); add(R, new THREE.SphereGeometry(0.07, 8, 6), v.armLamp, ARM - 0.3, 3.3, -1.1, false);
    v.sparks = glow(R, 0xffd9a0, 1.2, 0, ARM, 0.9, 0.1);
    // 树枝（两头各翘着一截，正好当把手）
    v.branch = grp(R, branch.x, 0, 0);
    add(v.branch, cy(0.2, 0.25, 1.7, 8), MAT.wood2, 0, 0.25, 0).rotation.z = Math.PI / 2;
    for (const sx of [-1, 1]) { add(v.branch, cy(0.05, 0.09, 0.62, 6), MAT.wood2, sx * 0.78, 0.6, 0.1).rotation.z = -sx * 0.25; add(v.branch, cy(0.03, 0.05, 0.4, 5), MAT.wood2, sx * 0.4, 0.5, -0.25).rotation.set(0.5, 0, sx * 0.7); }
    // 维护门：门框上一只小镜头；水泥缝里那根藤
    for (const z of [-1.4, 1.4]) add(R, bx(0.5, 3.6, 0.24), MAT.steel, DOOR, 1.8, z);
    add(R, bx(0.5, 0.3, 3.0), MAT.steel, DOOR, 3.65, 0);
    v.door = add(R, bx(0.22, 3.4, 2.56), M.teal, DOOR, 1.7, 0); for (const y of [-1, 0, 1]) add(v.door, bx(0.26, 0.1, 2.58), M.teal2, 0, y, 0, false);
    add(R, bx(0.4, 3.4, 30), M.wall, DOOR, 1.7, -16.6);                                                     // 围着花园的墙
    add(R, bx(0.26, 0.2, 0.3), MAT.dark, DOOR - 0.4, 3.3, 0.9); v.camLed = unlit(0xff3a2a, { fog: false }); add(R, new THREE.SphereGeometry(0.04, 6, 5), v.camLed, DOOR - 0.55, 3.32, 1.0, false);
    v.vine = [];
    for (let i = 0; i < VPTS.length - 1; i++) {
      const a = V3(VPTS[i][0], VPTS[i][1], 0.25), b = V3(VPTS[i + 1][0], VPTS[i + 1][1], 0.25 + 0.1 * (i % 2)), len = a.distanceTo(b), g = grp(R, a.x, a.y, a.z);
      g.quaternion.setFromUnitVectors(V3(0, 1, 0), b.clone().sub(a).normalize());
      add(g, cy(0.035, 0.05, len, 6), M.leaf, 0, len / 2, 0);
      for (let k = 0; k < 3; k++) add(g, new THREE.SphereGeometry(0.11, 6, 5), k % 2 ? M.leaf2 : M.leaf, rr(-0.14, 0.14), len * (0.2 + 0.3 * k), rr(-0.14, 0.14)).scale.set(1.3, 0.5, 0.9);
      v.vine.push(g);
    }
    yield;
    // 旧阀门：标准树列的水管在这里分出一根生锈的支管，通向野地
    add(R, bx(0.5, 0.9, 0.5), MAT.steel, VALVE, 0.45, -0.9); add(R, cy(0.07, 0.07, 6, 8), MAT.rust, VALVE + 3, 0.5, -1.0).rotation.z = Math.PI / 2;
    tube(R, [[VALVE - 0.3, 0.3, -2.3], [VALVE - 0.2, 0.5, -1.4], [VALVE, 0.6, -0.95]], 0.05, MAT.steel, 10);
    v.wheel = grp(R, VALVE, 1.02, -0.6); add(v.wheel, new THREE.TorusGeometry(0.26, 0.035, 6, 18), lam(0xc8452e)); for (let i = 0; i < 3; i++) add(v.wheel, bx(0.5, 0.04, 0.04), lam(0xc8452e), 0, 0, 0, false).rotation.z = i * 1.047;
    add(R, cy(0.03, 0.03, 0.34, 6), MAT.dark, VALVE, 1.02, -0.76).rotation.x = Math.PI / 2;
    v.spout = add(R, bx(0.05, 0.5, 0.05), unlit(0xcfe6ee, { transparent: true, opacity: 0.75 }), W0 - 0.45, 0.25, -1.0, false);

    // ---- 野地 ----
    // 干裂的地面；浇到水以后一片湿痕慢慢铺开，草、野花、灌木依次长出来
    decal(R, W0 - 0.6, W1 + 0.6, -6, 9.6, 0, 18, g => { g.strokeStyle = 'rgba(92,64,34,.55)'; g.lineWidth = 0.035; for (let i = 0; i < 130; i++) { let x = rr(W0, W1), z = rr(-5.6, 9.4); g.beginPath(); g.moveTo(x, z); for (let k = 0; k < 4; k++) { x += rr(-0.7, 0.7); z += rr(-0.6, 0.6); g.lineTo(x, z); } g.stroke(); } });
    v.wet = decal(R, W0 - 0.6, W1 + 0.6, -6, 9.6, 0.004, 10, g => { const gr = g.createLinearGradient(W0 - 0.6, 0, W1 + 0.6, 0); gr.addColorStop(0, 'rgba(96,160,66,0)'); gr.addColorStop(0.06, 'rgba(84,150,62,.92)'); gr.addColorStop(0.85, 'rgba(96,160,66,.88)'); gr.addColorStop(1, 'rgba(96,160,66,0)'); g.fillStyle = gr; g.fillRect(W0 - 0.6, -6, W1 - W0 + 1.2, 15.6); }, { opacity: 0 });
    // 没浇水的时候：稀稀拉拉几根干草茬
    for (const z of [-1.2, -0.4, 0.5, 1.4, 2.6]) litBoard(X + 45.4, X + 61, 0, 0.2, z, 80, g => blades(g, X + 45.4, X + 61, 0.04, 0.15, 7, PAL.straw));
    // 长出来的野花：前后十排，每排从左到右分三段，水流到哪里哪里先长。主角跟前的两排矮一些，不挡他
    v.bloom = [];
    const BLOOM = [-4.6, -3.3, -2.0, -0.75, 0.55, 1.5, 2.6, 3.7, 5.0, 6.6];
    for (let ri = 0; ri < BLOOM.length; ri++) {
      const z = BLOOM[ri], hMax = z > 2 ? 0.34 + 0.03 * z : z > 0 ? 0.4 : lerp(0.95, 0.6, (z + 4.6) / 3.85);
      for (let k = 0; k < 3; k++) {
        const x1 = W0 + 0.1 + k * 4.4, x2 = Math.min(x1 + 4.6, W1 + 0.1), m = rooted(litBoard(x1, x2, 0, hMax + 0.06, z, 64, g => wildflowers(g, x1, x2, hMax)));
        m.scale.y = 0.001; v.bloom.push({ m, at: 0.06 + 0.25 * k + 0.018 * ri });
      }
      if (ri === 4) yield;
    }
    yield;
    // 传感器旁边的灌木：最后长起来，把它盖住
    v.plants = [];
    [[-1.45, 0.58], [-0.85, 0.66], [-0.3, 0.74]].forEach(([z, at], i) => {
      const m = rooted(backdrop(SENSOR - 2.3, SENSOR + 2.3, 0, 1.5, z, 64, g => { for (let k = 0; k < 6; k++) leafBall(g, SENSOR + rr(-1.5, 1.5), rr(0.3, 0.75), rr(0.38, 0.6), PAL.wild[(i + k) % 3], false, 120); }));
      m.scale.set(0.001, 0.001, 1); v.plants.push({ m, at });
    });
    // 花开了以后飞来的蝴蝶
    v.flut = [0xffd84a, 0xffffff, 0xff9a3c, 0x8fc4ff, 0xff8fb4, 0xfff0a0].map((hex, i) => {
      const g = grp(R, 0, 0, 0), m = unlit(hex, { side: THREE.DoubleSide });
      const wings = [-1, 1].map(sz => { const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0.075, 0, sz * 0.095, -0.065, 0, sz * 0.08], 3)); const w = new THREE.Mesh(geo, m); g.add(w); return w; });
      g.visible = false; return { g, wings, i };
    });
    // 地面传感器：一只矮桩，贴着地面来回扫一道红线；它连着通往中继站的闸门
    add(R, cy(0.09, 0.12, 0.55, 8), MAT.dark, SENSOR, 0.275, -0.9); v.sLed = unlit(0xff3a2a, { fog: false }); add(R, new THREE.SphereGeometry(0.06, 8, 6), v.sLed, SENSOR, 0.6, -0.85, false);
    v.scan = add(R, bx(0.05, 0.02, 3.4), unlit(0xff4030, { transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, fog: false, depthWrite: false }), SENSOR, 0.03, 0, false); v.scanGlow = glow(R, 0xff3a22, 1.1, 0.7, SENSOR, 0.62, -0.8);
    add(R, bx(0.5, 3.6, 30), M.wall, GATE, 1.8, -16.6); add(R, bx(0.5, 3.6, 4), M.wall, GATE, 1.8, 3.6);
    v.relay = mkGateDoor(R, relay, { mat: M.teal, band: M.teal2 });
    v.rLamp = unlit(0xff3a2a, { fog: false }); add(R, new THREE.SphereGeometry(0.1, 10, 8), v.rLamp, GATE - 0.5, 3.95, 1.25, false); v.rGlow = glow(R, 0xff3a22, 1.6, 0.8, GATE - 0.55, 3.95, 1.3);
    yield;

    // ---- 花园外面 ----
    // 草地：半埋在土里的机械拱环，根缠在上面，里面透出一点冷光；远处是被藤缠住的中继塔
    for (const [x, r, z, t] of [[X + 80, 3.4, -8, 0.2], [X + 86.5, 2.6, -6.5, -0.3], [X + 93, 4.2, -10, 0.1]]) {
      const ring = add(R, new THREE.TorusGeometry(r, 0.28, 8, 28, Math.PI * 1.15), MAT.steel, x, -0.3, z); ring.rotation.set(0, t, -0.25);
      for (let i = 0; i < 5; i++) { const a = 0.3 + i * 0.6; add(R, cy(0.04, 0.07, 1.6, 5), MAT.wood2, x + Math.cos(a) * r, Math.sin(a) * r - 0.3, z + 0.25).rotation.z = a + rr(-0.5, 0.5); }
      glow(R, 0x9fd6ff, r * 1.5, 0.22, x, r * 0.4, z - 0.3);
    }
    add(R, cy(0.14, 0.3, 13, 8), MAT.dark, X + 70, 6.5, -16); add(R, bx(2.2, 0.2, 0.2), MAT.dark, X + 70, 12.6, -16); dusk(backdrop(X + 68.4, X + 71.6, 0, 13.6, -15.7, 30, g => { for (let i = 0; i < 17; i++) leafBall(g, X + 70 + rr(-0.42, 0.42), 0.7 + i * 0.74 + rr(-0.15, 0.15), rr(0.36, 0.62), PAL.wild[i % 3], false, 70); }), 0x9c8466);   // 一路缠上去的藤
    // 脚下的草：没人割，高高低低，里面夹着野花。靠镜头的几排矮一些，不挡主角
    for (const [z, hMax, dens] of [[-2.3, 0.6, 0.5], [-1.3, 0.5, 0.6], [-0.5, 0.36, 0.6], [0.5, 0.3, 0.5], [1.4, 0.36, 0.45], [2.7, 0.4, 0.3]])
      litBoard(GATE + 0.6, X8 + 1, 0, hMax + 0.06, z, 72, g => wildflowers(g, GATE + 0.6, X8 + 1, hMax, dens));
    yield;

    // ---- 前景：离镜头最近的一层，略微虚焦 ----
    // 贴着画面下沿的几丛草和花。放得够近，它前面那一段地面正好落在画面外（原来那层放在 z = 6，成了横在画面里的一道黑带）
    const tufts = (x1, x2, gap0, gap1, h0, h1, cols, flowers) => g => {
      for (let x0 = x1 + 2; x0 < x2 - 1.8; x0 += rr(gap0, gap1)) for (let j = 0, n = Math.floor(rr(4, 8)); j < n; j++) {      // 两头留出一丛的宽度，不然会被板子的边切齐
        const x = x0 + rr(-1.1, 1.1), h = rr(h0, h1), w = rr(0.25, 0.5); setInk(g, cols[Math.floor(rr(0, cols.length))]);
        for (let k = 0; k < 12; k++) { const l = rr(-0.5, 0.5) * h, bx_ = x + rr(-w, w); poly(g, [[bx_ - 0.07, 0], [bx_ + 0.07, 0], [bx_ + l, h * rr(0.6, 1)]]); }
        if (flowers && rnd() < 0.6) { g.fillStyle = flowers[Math.floor(rr(0, flowers.length))]; for (let k = 0; k < 4; k++) disc(g, x + rr(-w, w), h * rr(0.7, 1.0), rr(0.06, 0.1)); }
      }
    };
    backdrop(ENTRY + 0.4, X + 45, 0, 2.2, 8.7, 36, tufts(ENTRY + 0.4, X + 45, 3.6, 6.5, 0.7, 1.25, [PAL.fore, PAL.fore2], PAL.foreFlower), { fog: false, blur: 1.3, order: 4000 });
    backdrop(X + 45, GATE, 0, 2.2, 8.7, 36, tufts(X + 45, GATE, 7, 12, 0.45, 0.8, ['#b99a58', '#cdb06a']), { fog: false, blur: 1.3, order: 4000, opacity: 0.8 });
    dusk(backdrop(GATE, X8 + 2, 0, 2.6, 8.7, 36, tufts(GATE, X8 + 2, 2.2, 4.2, 0.9, 1.7, [PAL.fore, PAL.fore2], PAL.flower), { fog: false, blur: 1.3, order: 4000 }), 0x70583c);
    // 从画面上角伸进来的一枝叶子
    const twigIn = (x0, s, tintHex) => {
      const m = backdrop(x0 - 0.2, x0 + 5.2, 3.6, 6.2, 10.2, 40, g => {
        const px = k => x0 + (s > 0 ? k : 5 - k);
        setInk(g, PAL.foreBranch); line(g, [[px(0.2), 5.75], [px(2.2), 5.05], [px(3.8), 4.72]], 0.1); line(g, [[px(2.2), 5.05], [px(2.7), 4.45]], 0.055); line(g, [[px(1.2), 5.4], [px(1.5), 4.7]], 0.05);
        for (let i = 0; i < 120; i++) { const t = rnd(), lx = px(lerp(0.3, 4.0, t)), ly = lerp(5.65, 4.68, t) + rr(-0.75, 0.3); g.fillStyle = rnd() < 0.45 ? PAL.fore : PAL.fore2; g.beginPath(); g.ellipse(lx, ly, rr(0.14, 0.26), rr(0.06, 0.1), s * rr(-1.2, 0.4), 0, 6.2832); g.fill(); }
      }, { fog: false, blur: 1.6, order: 4001 });
      return tintHex ? dusk(m, tintHex) : m;
    };
    twigIn(X + 8.6, -1); twigIn(X + 26.2, 1); twigIn(X + 39.5, -1); twigIn(X + 70, 1, 0x70583c); twigIn(X + 86, -1, 0x70583c); twigIn(X + 101, 1, 0x70583c);
    yield;

    // ---- 鸟 ----
    let bi = 0; const bird = (x, y, z, o) => v.birds.push(mkBird(R, bi++, x, y, z, o));
    for (const [x, z] of [[X + 9.2, 1.3], [X + 9.9, 0.9], [X + 15.6, -1.1], [X + 25.2, 1.5], [X + 26.0, 1.0], [X + 38.6, 1.2]]) bird(x, 0, z);     // 草地上啄食的
    bird(ARM - 2.5, 3.6, -1.3, { flee: 2.3 }); bird(ARM - 1.9, 3.6, -1.3, { flee: 2.3, face: 1 });                                               // 修剪机横臂上的两只
    bird(ENTRY, 3.4, -2.2, { flee: 0 }); bird(ENTRY, 3.4, 2.6, { flee: 0, face: 1 });                                                             // 墙头上的不怕人
    bird(DOOR, 3.4, -2.3, { flee: 1.5 }); bird(DOOR, 3.4, -4.4, { flee: 1.5 }); bird(DOOR, 3.4, -7.5, { flee: 1.5, face: 1 });
    bird(X + 51, 0, 2.1, { wait: true }); bird(X + 57.2, 0, 2.3, { wait: true, face: -1 }); bird(GATE, 3.6, -2.2, { wait: true, flee: 1.5 }); bird(GATE, 3.6, -3.4, { wait: true, flee: 1.5 });   // 野地长好了才飞来
    bird(X + 79.6, 3.38, -8, { flee: 3.4 }); bird(X + 80.5, 3.38, -8, { flee: 3.4, face: 1 }); bird(X + 93, 4.18, -10, { flee: 3.4 }); bird(X + 69.5, 12.7, -16, { flee: 0 });   // 拱环和中继塔上的
    for (const [x, z] of [[X + 68.5, 1.4], [X + 97, 1.2], [X + 103.5, -1.0]]) bird(x, 0, z);
    for (const b of v.birds) if (b.wait && S.g >= 1) b.wait = false;
    v.flocks.push(mkFlock(R, 6, 0xfbfbf6, 14.5, -70, 1.7, X - 40, X + 90), mkFlock(R, 7, 0x2c2632, 17, -95, -1.4, X + 40, X8 + 60));               // 白天的一群往右飞；黄昏的一群排成人字，朝落日飞
    V = v;
  }

  const WHITE = new THREE.Color(0xffffff);
  function update(dt) {
    const near = Math.abs(P.x - (X + 45)) < 70;
    // 修剪机：每隔两秒半剪一刀。树枝垫在刀头下面的时候，下一刀就卡死了
    if (!S.jam && near) {
      S.snipT += dt; const k = S.snipT % 2.6; S.snip = k < 0.18 ? k / 0.18 : k < 0.5 ? 1 - (k - 0.18) / 0.32 : 0;
      S.vine = Math.min(0.26, S.vine + dt * 0.045);
      if (k < dt) { if (state === 'play') fx('snip', sstep(26, 4, Math.abs(P.x - ARM))); if (branch.x >= X + 30.15) { S.jam = true; S.snip = 0.55; fx('spark'); fx('powerDown'); if (V) for (const b of V.birds) if (b.st === 'perch' && !b.wait && b.flee > 0 && Math.abs(b.x0 - ARM) < 7) birdOff(b, true); } else S.vine = 0.12; }
    }
    if (S.jam) { S.vine = Math.min(1, S.vine + dt / 7.5); if (S.vine >= 0.999 && door.want === 0) { door.want = 1; fx('grow'); } }
    // 阀门可以来回拨；水流向野地的时候植物才长，长出来的不会缩回去
    S.vk = damp(S.vk, S.valve, 2.5, dt);
    if (S.valve && S.g < 1) { const was = S.g; S.g = Math.min(1, S.g + dt / 10); if (Math.floor(S.g * 5) !== Math.floor(was * 5)) fx('grow'); if (S.g >= 1) { STORY.wild = true; saveGame(); fx('ok'); } }
    relay.want = S.g >= 1 ? 1 : 0;
    const scanOn = S.g < 1 ? 1 : 0;
    armL.on = S.jam ? 0 : 1; sensL.on = scanOn * (0.6 + 0.4 * Math.sin(T * 6));
    if (near) { AUD.water = Math.max(AUD.water, 0.5 * S.vk * sstep(26, 4, Math.abs(P.x - W0)), 0.16 * lerp(1, 0.4, S.vk) * sstep(52, 20, Math.abs(P.x - (X + 22)))); AUD.hum = Math.max(AUD.hum, S.jam ? 0 : 0.02 * sstep(22, 4, Math.abs(P.x - ARM))); }
    // 走到拱环附近：小猫先停下来，朝那边看了一会儿
    if (STORY.cat && state === 'play') {
      if (S.cat === 0 && P.x > X + 76 && P.x < X + 82 && CAT.state === 'follow') { S.cat = 0.01; catHold(X + 79, 0, 'sit', 1); }
      else if (S.cat > 0 && S.cat < 9) { S.cat += dt; if (S.cat > 4 || P.x > X + 86) { S.cat = 9; catFollow(); } }
    }

    const v = V; if (!v) return;
    v.branch.position.x = branch.x;
    const jamA = S.jam ? 0.2 : 0;
    v.head.position.y = lerp(1.5, 0.78, S.jam ? 1 : sstep(0, 0.5, S.snip)) + (S.jam && S.vine < 0.5 ? 0.02 * Math.sin(T * 37) : 0);
    v.blades.forEach((b, i) => { b.rotation.z = (i ? -1 : 1) * lerp(0.75, jamA, S.jam ? 1 : S.snip); });
    v.armLamp.color.setHex(S.jam ? 0x2a2f30 : 0xdfeef2); v.sparks.material.opacity = S.jam && S.vine < 0.45 ? (Math.sin(T * 50) > 0.3 ? 0.9 : 0) : 0;
    const n = v.vine.length, L = S.vine * n;
    v.vine.forEach((g, i) => { const k = clamp(L - i, 0, 1); g.visible = k > 0.02; g.scale.set(0.6 + 0.4 * k, k, 0.6 + 0.4 * k); });
    v.door.position.y = 1.7 + sstep(0, 1, door.open) * 3.35; v.camLed.color.setHex(S.vine > 0.8 ? 0x2a1210 : 0xff3a2a);
    v.wheel.rotation.z = S.vk * 4.2; v.spout.visible = S.vk > 0.2;
    v.drips.forEach((m, i) => { m.visible = (T * 1.2 + i * 0.37) % 1 < lerp(0.5, 0.2, S.vk); });
    // 喷灌：水拨给野地以后，标准树这一侧的水就小下去
    const flow = lerp(1, 0.4, S.vk), dp = v.dropPos; let j = 0;
    v.spr.forEach((s, si) => {
      s.m.scale.set(flow, flow, 1);
      for (let k = 0; k < 9; k++) { const dx = (k - 4) * 0.52 * flow, top = (1.9 - Math.abs(k - 4) * 0.2) * flow; for (let d = 0; d < 6; d++) {
        const t = (T * 0.75 + d / 6 + k * 0.137 + si * 0.31) % 1, a = 1 - t;
        dp[j++] = s.x + 2 * a * t * dx * 0.55 + t * t * dx; dp[j++] = a * a * 0.64 * flow + 2 * a * t * (0.64 * flow + top * 1.5) + t * t * 0.5 * flow; dp[j++] = -5.1 + (d % 3 - 1) * 0.06;
      } }
    });
    v.drops.geometry.attributes.position.needsUpdate = true;
    // 野地：湿痕铺开，野花一段一段长起来，灌木最后盖住传感器；花开了，蝴蝶和鸟就来了
    v.wet.material.opacity = sstep(0, 0.5, S.g);
    for (const b of v.bloom) b.m.scale.y = Math.max(0.001, sstep(b.at, Math.min(1, b.at + 0.3), S.g * 1.05));
    for (const p of v.plants) { const k = Math.max(0.001, sstep(p.at, Math.min(1, p.at + 0.3), S.g * 1.05)); p.m.scale.set(k, k, 1); }
    const fk = sstep(0.7, 1, S.g);
    for (const f of v.flut) {
      f.g.visible = fk > 0.01; if (!f.g.visible) continue;
      const i = f.i, a = T * 0.5 + i * 2.1, up = 0.25 + 0.95 * Math.abs(Math.sin(T * 11 + i));
      f.g.scale.setScalar(fk * 1.5); f.g.position.set(W0 + 2 + i * 1.9 + 1.3 * Math.sin(a), 0.6 + 0.22 * Math.sin(T * 1.3 + i) + 0.1 * Math.sin(T * 3.1 + i * 1.7), -1.4 + (i % 3) * 1.1 + 0.7 * Math.sin(T * 0.37 + i * 1.3));
      f.g.rotation.y = Math.cos(a) > 0 ? 0 : Math.PI; f.wings[0].rotation.x = up; f.wings[1].rotation.x = -up;
    }
    v.sLed.color.setHex(scanOn ? 0xff3a2a : 0x2a1210); v.scan.visible = !!scanOn; v.scanGlow.material.opacity = 0.7 * scanOn;
    v.scan.position.x = SENSOR + 4.6 * Math.sin(T * 1.6);
    v.relay.sync(relay); v.rLamp.color.setHex(scanOn ? 0xff3a2a : 0x2a1210); v.rGlow.material.opacity = 0.8 * scanOn;
    for (const b of v.birds) stepBird(b, dt);
    for (const F of v.flocks) stepFlock(F);
    const dk = sstep(X + 62, X + 92, camera.position.x);                // 暮色：和环境的那两个关键点走同一段路
    for (const m of v.tint) m.material.color.copy(WHITE).lerp(m.userData.dusk, dk);
    const ok = 1 - sstep(X8 + 3, X8 + 24, camera.position.x);            // 进了中枢：把伸到它背后的云和远山收起来
    for (const [m, a] of v.out) { m.material.opacity = a * ok; m.visible = ok > 0.01; }
  }
  function reset() { placeBox(branch, X + 21.5); setGate(door, 0); setGate(relay, 0); Object.assign(S, { jam: false, snipT: 0, snip: 0, vine: 0.15, valve: 0, vk: 0, g: 0, cat: 0 }); if (V) for (const b of V.birds) { b.st = 'perch'; b.g.visible = true; b.g.rotation.y = b.face > 0 ? 0 : Math.PI; b.wait = b.wait || b.x0 > X + 46 && b.x0 < GATE + 0.5; } }
  function solve() { placeBox(branch, X + 30.4); setGate(door, 1); setGate(relay, 1); Object.assign(S, { jam: true, snipT: 0, snip: 0.55, vine: 1, valve: 1, vk: 1, g: 1, cat: 9 }); if (V) for (const b of V.birds) if (b.wait) { b.wait = false; b.st = 'perch'; b.g.visible = true; } }
  return defZone({ n: 7, vis: [X - 6, X8 + 4], build, update, reset, solve, unbuild() { V = null; }, branch, door, relay, S });
})();
