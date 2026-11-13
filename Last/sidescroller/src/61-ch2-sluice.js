
// ============================================================
//  第二章 · 林地水闸：恢复水道
//  走出工厂，翻过一道坡，看见地平线上停机的巨像；下坡进入林地边缘。
//  一条废弃的引水渠拦在路上：扳动闸杆 → 闸门升起 → 水位慢慢涨上来，卡在石槽里的木梁浮起、漂向对岸 →
//  踩着木梁过去。掉进水里只会回到岸上，闸门不会关回去
// ============================================================
const CH2 = (() => {
  const X = X2, CX0 = X + 104, CX1 = CX0 + 5.2, BED = -3.6, LOW = -3.25, HIGH = -0.42;      // 水渠的两岸、渠底、低水位、高水位
  const C = chapter({ n: 2, x0: X + 0.6, start: X + 3.5, name: '林地水闸', sub: '恢复水道' });
  C.ground = 'dirt';                                                               // 脚步声：坡上是土路，林子里是土上一层落叶（forest），路上两片湿泥（见 FAR_SIDE 后面）
  terrain([X + 2.1, 0.0875], [X + 6, 0.25], [X + 14, 1.0], [X + 20, 1.3], [X + 26, 2.6], [X + 32, 3.0], [X + 46, 3.0], [X + 54, 2.2], [X + 64, 0.9], [X + 76, 0.2], [X + 82, 0],
    [CX0, 0], [CX0 + 0.01, BED], [CX1 - 0.01, BED], [CX1, 0], [X3, 0]);
  ground(X + 0.1, 0x574839); ground(X + 60, 0x574839); ground(X + 84, 0x33341e); ground(X3 - 8, 0x3c381d);      // 林子里的地：枯草的暗褐色
  solid({ id: 'bankL', x1: CX0 - 0.6, x2: CX0, y1: BED, y2: 0 }); solid({ id: 'bankR', x1: CX1, x2: CX1 + 0.6, y1: BED, y2: 0 });
  const TL = 3.7, timber = solid({ id: 'timber', x: CX0 + 1.95, w: TL, x1: 0, x2: 0, y1: 0, y2: 0, plat: true, snd: 'wood' });
  const W = { open: false, t: 0, k: 0, level: LOW, lamp: 0, flown: 0, bank: -1 };      // flown：闸上那几只鸟飞走多久了（0 = 还停着）；bank：主角最后站在哪边岸上（-1 左岸，1 右岸）
  const LEVER_X = CX0 - 4.2;
  function placeTimber() {                               // 木梁：水位低时卡在石槽里；水涨起来就浮着，慢慢漂向对岸
    timber.x = lerp(CX0 + 1.95, CX0 + 2.6, sstep(0.2, 0.92, W.k)); syncBox(timber);
    timber.y2 = Math.max(BED + 0.55, W.level + 0.14); timber.y1 = timber.y2 - 0.42;
  }
  placeTimber();
  usable({ id: 'sluice', x: LEVER_X, r: 0.95, can: () => !W.open, on() { W.open = true; fx('lever'); fx('doorStop'); fx('flutter'); } });     // flutter：闸上的鸟被惊飞
  // 掉进水渠：送回刚才站的那边岸上。不能按离哪边近来送 —— 闸门没开时用力一跳，落到渠底的木梁上又过了中线，就会被直接送到对岸，不用解题
  pit({ x1: CX0 + 0.05, x2: CX1 - 0.05, y: () => Math.max(W.level + 0.05, P.grounded ? -1.5 : -99), back: () => W.bank < 0 ? CX0 - 1.6 : CX1 + 1.6, sfx: 'splash' });
  checkpoint(X + 3.5); checkpoint(X + 38); checkpoint(X + 88); checkpoint(CX1 + 2.2);
  camKeys([X + 3.5, 17, 1.6, 2.5], [X + 14, 24, 2.6, 5], [X + 28, 32, 4.6, 8.5], [X + 42, 34, 5, 9], [X + 58, 26, 3.2, 5], [X + 76, 20, 2.0, 1.5],
    [X + 92, 20, 1.8, 1.5],
    // 水闸这一段镜头抬高、往下看：水渠在地面以下，平视的话渠底那根木梁落在画面外面，玩家看不到这道题要用的东西
    [CX0 - 5, 22, 0.3, 2.8, 2.3], [CX0, 22, 0.3, 2.8, 2.3], [CX1 + 0.5, 22, 0.5, 1.2, 2.0], [CX1 + 5, 20, 1.8, 0.5],
    [X + 135, 19, 1.8, 0], [X3 - 2, 19, 1.8, 0]);
  // 室外的清晨：上冷下暖的天，低垂的太阳。
  // 往林子里走：光从林子后面透过来（逆光），远处是一片发白的亮雾；近处的环境光压暗，只留枝叶间漏下来的几束暖光；颜色是枯褐 —— 灰褐的树，干黄的草
  const DAWN = { fog: 0xc9a47c, fogD: 0.0052, hemiS: 0xffe6c4, hemiG: 0x4a4038, hemiI: 0.95, keyC: 0xffc48a, keyI: 2.3, keyDir: [0.74, 0.34, -0.5], rimI: 0.25,
    dustC: 0xffe2b8, dustO: 0.38, wind: -0.9, ext: 1, sky: [0x2d3d46, 0x5d7074, 0xa99a82, 0xe2b680, 0xf1c88b, 0xa37d5c], sunX: 0.36, sunY: 0.04, sunC: 0xfff0cd, sunP: 1, cloud: 1, cloudC: 0xffe1be,
    aRoom: 0, aHum: 0, aDrip: 0, rvHall: 0, rvOut: 1, aWind: 0.75, aLeaf: 0.15, leafDry: 0.85, aFar: 0.5, birds: 0.45 };   // 声音：坡上的晨风，零星几只鸟
  env(X + 2.1, DAWN); env(X + 50, {});
  env(X + 80, { fog: 0xd9d2c0, fogD: 0.016, hemiS: 0xd8d0c0, hemiG: 0x2a2620, hemiI: 0.42, keyC: 0xf6ead6, keyI: 1.2, keyDir: [-0.15, 0.45, -0.85], rimI: 1.0, dustC: 0xe8e0d0, dustO: 0.5, wind: -0.25,
    sky: [0x9c9a90, 0xc8c3b2, 0xe6e0cc, 0xf2ecd8, 0xf5efdb, 0xa39a86], sunX: 0.05, sunY: 0.13, sunP: 1, sunC: 0xfff6e0, cloud: 0.5, cloudC: 0xf2f0dc, birds: 1,
    aWind: 0.45, aLeaf: 0.9, aBug: 0.12, aFar: 0.7 });                                 // 声音：林子里风吹枯叶，鸟多起来，远处啄木鸟、乌鸦、断枝
  env(X3 - 12, {});

  hint(() => !W.open && Math.abs(P.x - LEVER_X) < 1.7, '按 <b>E</b> 扳动闸杆');
  hint(() => !W.open && P.x > CX0 - 2.2 && P.x < CX0 + 0.3 && P.y > -0.5, '水渠太宽，跳不过去 —— 木梁卡在渠底的石槽里');
  hint(() => W.open && W.k < 0.75 && P.x > CX0 - 6 && P.x < CX0 + 0.3, '水位在涨。等木梁浮上来');
  hint(() => W.k >= 0.75 && P.x > CX0 - 3 && P.x < CX0 + 0.3 && P.y > -0.1, '跳上木梁，再跳到对岸');

  for (const x of [X + 86, CX0 - 6, CX1 + 9]) spotLight({ p: [x + 2.5, 13, 2.5], t: [x, 0, -0.6], c: 0xffe9c0, i: 5.2, a: 0.26 });   // 枝叶间漏下来的光：四周暗，这几块地是亮的
  const farLamp = pointLight({ p: [X + 139, 8.6, -22], c: 0xcfeaff, i: 30, d: 30, dec: 1.4, on: 0 });

  let V = null;
  // ---------------- 地上的东西：林子里，水闸那一屏的两边各一段 ----------------
  // 每一样一组，各自挂在自己的节点下（v.gd.stones……），可以一组一组开关（出效果图用）。每一段、每一样用自己的种子，不动这一章别处的随机数。
  // layers 是近处、中间、远处三排树的布景板：水洼里映的就是它们
  const GD_KINDS = ['mud', 'water', 'leaves', 'stones', 'sticks', 'grass', 'fore', 'animals'];
  const pathZ = x => 0.2 * Math.sin(x * 0.33) + 0.1 * Math.sin(x * 0.9 + 1);                        // 踩出来的那条路：在前后方向上弯弯曲曲
  const offPath = (x, z, w = 0.55) => 1 - Math.exp(-(((z - pathZ(x)) / w) ** 2));                   // 离路越近越接近 0
  // 林地里的颜色（植物的图集是灰白的，摆的时候染上）。这一章的林子是枯褐的：干黄的草，蕨大半已经枯成锈褐色，剩下一些暗橄榄绿
  const GREEN = { grass: 0x857a4a, dry: 0x9c8c5a, fern: 0x6e5232, fern2: 0x55553a, reed: 0x807449 };
  const FROG = [0x76703e, 0x8a7c46];                                                                // 青蛙：橄榄褐、黄褐（这片林子里没有鲜绿的东西）
  const ROWZ = [-8.3, -7.4, -6.6, -5.8, -5.1, -4.4, -3.8, -3.2, -2.7, -2.2, -1.75, -1.35, -1.0, -0.68, -0.4, 0.3, 0.6, 0.95, 1.35, 1.8, 2.3, 2.85, 3.45, 4.1, 4.8, 5.6, 6.5, 7.5, 8.6];
  // 林子里的一段：从 A0 到 A1。S 是这一段自己的布置：水洼和它们占的那一块地、近处那排大树干、蕨丛、泥地、石头、倒木、树桩、大一些的树枝、不长草的地方、小动物
  function* woods(v, layers, A0, A1, S, seed) {
    const gd = v.gd, life = v.life, gy = groundY, ends = x => sstep(A0 - 0.5, A0 + 2.5, x) * sstep(A1 + 0.5, A1 - 4, x);   // 两头慢慢稀下去
    // 水：每一摊是一个大椭圆，边上再叠一圈小的，轮廓才不规整
    const POOLS = withSeed(seed, () => S.pools.flatMap(([x, z, rx, rz]) => {
      const out = [[x, z, rx * 0.82, rz * 0.85]]; for (let i = 0; i < 7; i++) { const a = i / 7 * 6.2832 + rr(-0.3, 0.3); out.push([x + Math.cos(a) * rx * rr(0.5, 0.78), z + Math.sin(a) * rz * rr(0.4, 0.7), rx * rr(0.22, 0.42), rz * rr(0.3, 0.55)]); }
      return out;
    }));
    const inPool = (x, z, m = 0) => POOLS.some(([px, pz, rx, rz]) => ((x - px) / (rx + m)) ** 2 + ((z - pz) / (rz + m)) ** 2 < 1);
    const litter = (x, z) => {                                                                      // 落叶有多密：树下厚，镜头跟前被风扫成一道，路上被踩散了
      let d = 0.12; for (const t of S.trunks) d = Math.max(d, 0.95 * Math.exp(-(((x - t - 0.6) / 3.0) ** 2) - ((z + 3.0) / 3.2) ** 2));
      d = Math.max(d, 0.8 * Math.exp(-(((z - 4.6 - 0.9 * Math.sin(x * 0.37)) / 1.3) ** 2)) * (0.55 + 0.45 * Math.sin(x * 0.71 + 2)));
      return d * (0.35 + 0.65 * offPath(x, z, 0.5)) * ends(x);
    };
    // 泥：踩出来的一条湿路，水洼周围和镜头跟前各一片泥地
    withSeed(seed + 1, () => mudPath(gd.mud, life, layers, A0 + 1, A1 - 0.2, pathZ, { patches: S.mud }));
    yield;
    // 水洼
    const pud = puddles(gd.water, life, ...S.poolBox, POOLS, layers);
    yield;
    // 落叶：铺在地上的一层 + 镜头跟前和路边翘起来的一些 + 飘下来的几片
    withSeed(seed + 2, () => {
      leafLitter(gd.leaves, A0, A1, -6, 10, litter);
      const pts = []; for (let i = 0; i < (A1 - A0) * 85 && pts.length < (A1 - A0) * 17; i++) { const x = rr(A0 + 0.5, A1 - 0.5), z = rr(-3.2, 9.4); if (rnd() < litter(x, z) * (z > 2 ? 1 : 0.6)) pts.push([x, z]); }
      leaves3d(gd.leaves, pts);
    });
    fallingLeaves(gd.leaves, life, [A0 + 2, A1 - 1]);
    yield;
    // 石头：几块半埋的大石头，路边和大石头脚下散着小石子
    const rocks = withSeed(seed + 3, () => {
      const out = S.rocks.map(([x, z, sz, o]) => rock(gd.stones, x, z, sz, o)), pts = [];
      for (let i = 0; i < (A1 - A0) * 5.5; i++) {
        const t = rnd(), x = rr(A0 + 0.5, A1 - 0.4); let z;
        if (t < 0.55) z = pathZ(x) + (rnd() < 0.5 ? -1 : 1) * rr(0.45, 1.5); else if (t < 0.8) z = rr(2, 9); else z = rr(-5, -1);
        if (!inPool(x, z, 0.05) && rnd() < ends(x)) pts.push([x, z, rnd() < 0.12 ? rr(0.07, 0.11) : rr(0.02, 0.055)]);
      }
      for (const [rx, rz, sz] of S.rocks) if (sz > 0.35) for (let i = 0, n = Math.round(sz * 16); i < n; i++) { const a = rr(0, 6.28), d = rr(0.45, 0.95); pts.push([rx + Math.cos(a) * d, rz + Math.sin(a) * d * 0.7, rr(0.02, 0.06)]); }
      pebbles(gd.stones, pts);
      return out;
    });
    yield;
    // 树枝：倒木、树桩，四处掉着的枯枝
    const onLog = (x, z) => S.logs.some(([lx, lz, len, r]) => Math.abs(x - lx) < len / 2 + 0.1 && Math.abs(z - lz) < r * 1.7);
    withSeed(seed + 4, () => {
      for (const a of S.logs) fallenLog(gd.sticks, ...a); for (const a of S.stumps) stump(gd.sticks, ...a);
      for (let i = 0, n = Math.round((A1 - A0) * 1.1); i < n; i++) {
        const x = rr(A0 + 0.6, A1 - 1), z = rnd() < 0.5 ? rr(-5, -0.7) : rr(0.8, 8.6), len = rr(0.3, 1.25), yaw = rr(0, 3.14);
        if (offPath(x, z, 0.6) > 0.6 && !inPool(x, z, 0.4) && !onLog(x, z) && !S.bare(x, z)) stick(gd.sticks, x, z, len, yaw);
      }
      for (const [x, z, len, yaw] of S.bigSticks) stick(gd.sticks, x, z, len, yaw, { r: 0.032 });
    });
    yield;
    // 草和蕨：一丛一丛的，前后错开 —— 合起来是一片一片的，看不出是一排一排。
    // 蕨成片地长在几个地方（倒木后面、大石头后面、树根下、镜头跟前的两角）；草也是一片片的；路上踩秃了，只剩贴地的几根；靠镜头的高一些，靠路的矮
    const fernK = (x, z) => { let k = 0; for (const [fx, fz, rx, rz] of S.ferns) k = Math.max(k, Math.exp(-(((x - fx) / rx) ** 2) - ((z - fz) / rz) ** 2)); return k; };
    const veg = (x, z) => clamp((0.5 + 0.3 * Math.sin(x * 0.83 + 1.4 * Math.sin(z * 0.7 + 1)) + 0.26 * Math.sin(x * 0.31 - z * 0.9 + 2.2) - 0.44) * 2.4, 0, 1);   // 这里草有多密（0..1）
    const bare = (x, z) => inPool(x, z, 0.1) || onLog(x, z) || S.bare(x, z);
    const col = (hex, a = 0.9, b = 1.1) => new THREE.Color(hex).multiplyScalar(rr(a, b)), list = [];
    withSeed(seed + 5, () => {
      for (const z0 of ROWZ) {
        const hM = z0 < -0.9 ? Math.min(0.72, 0.24 + 0.075 * -z0) : z0 < 0.8 ? 0.1 : Math.min(0.6, 0.07 + 0.062 * z0);
        for (let x = A0 + 0.3; x < A1 - 0.3; x += rr(0.1, 0.3)) {
          const z = z0 + rr(-0.12, 0.12), y = gy(x) - 0.012 + rr(0, 0.028), fk = fernK(x, z), vk = veg(x, z) * (0.12 + 0.88 * offPath(x, z, 0.75)), t = rnd(), u = rnd() / ends(x), hh = hM * rr(0.45, 1);
          if (bare(x, z)) continue;
          if (hM >= 0.26 && u < fk * 0.42) list.push([x, y, z, 'fern', hM * rr(0.8, 1.35), col(rnd() < 0.65 ? GREEN.fern : GREEN.fern2)]);
          else if (u < vk * 0.5) {
            if (t > 0.965 && hM > 0.14) list.push([x, y, z, 'seed', hh * 1.2, col(GREEN.dry)]);       // 一两根结了籽的草茎
            else list.push([x, y, z, t > 0.86 ? 'dry' : 'grass', hh, col(t > 0.86 ? GREEN.dry : GREEN.grass)]);
          }
          if (z < -2.5 && rnd() < (0.012 + 0.03 * fk) * ends(x)) list.push([x + rr(-0.2, 0.2), y, z, 'mush', rr(0.08, 0.11), rnd() < 0.5 ? 0xcfc4a8 : 0xa88258]);   // 蕨丛里的几朵蘑菇
        }
      }
      for (const [px, pz, rx, rz] of S.pools) for (let x = px - rx * 0.85; x < px + rx * 0.85; x += rr(0.16, 0.38)) if (rnd() < 0.5) list.push([x, gy(x) - 0.01, pz - rz * rr(0.8, 1.05), 'reed', rr(0.18, 0.42), col(GREEN.reed)]);   // 水洼后沿的一排水草
    });
    withSeed(seed + 6, () => plants(gd.grass, list));
    yield;
    // 小动物
    S.animals(gd.animals, life, pud, rocks);
    yield;
  }
  // 从镜头这边水平地看过去，石头朝镜头的那一面在哪里、朝哪边（蜥蜴贴在这一面上）
  const face = (m, x, y) => {
    m.updateMatrixWorld(true); const hit = new THREE.Raycaster(V3(x, y, 9), V3(0, 0, -1)).intersectObject(m)[0];
    return hit ? { p: hit.point, n: hit.face.normal.clone().transformDirection(m.matrixWorld) } : { p: V3(x, y, m.position.z), n: V3(0, 0, 1) };
  };
  // 水渠这一边：从林子边到水闸那一屏。水一摊在路的外侧（青蛙蹲在它边上），一摊横在路上（走过去要踩进去），一摊在远处的树下，
  // 一摊在镜头跟前 —— 水洼离主角越远（越靠近镜头），里面映出来的东西越高：这一摊映得出后面的树干和走过去的主角的上半身
  const NEAR_SIDE = {
    pools: [[194.8, 1.55, 1.3, 0.42], [198.7, 0.18, 0.9, 0.36], [189.9, -3.7, 1.35, 0.4], [191.2, 5.5, 1.9, 0.62]], poolBox: [186.4, 201, -4.5, 6.6],
    trunks: [178, 186.5, 193, 199.5],
    ferns: [[186.6, -4.0, 2.2, 1.4], [192.7, -6.4, 1.7, 1.0], [196.9, -4.5, 1.6, 1.1], [180.5, -4.2, 2.2, 1.2], [184.6, 5.6, 2.6, 1.8], [197.6, 6.6, 3.0, 1.7]],
    mud: [[198.7, 0.2, 2.2, 0.9], [194.6, 1.5, 2.0, 0.8], [191.4, 5.5, 3.0, 1.2]],
    rocks: [[191.9, -1.5, 0.5, { seed: 11, flat: 0.82, sink: 0.28, sx: 1.15, sz: 0.9, yaw: 0.4 }], [191.05, -2.05, 0.22, { seed: 12, flat: 0.8 }], [196.5, -2.9, 0.62, { seed: 13, flat: 0.95, sink: 0.3, sx: 1.0, sz: 0.85, yaw: 1.3 }],
      [188.3, 3.3, 0.36, { seed: 14, flat: 0.75 }], [199.6, 4.6, 0.5, { seed: 15, flat: 0.7, sx: 1.3 }], [181.6, -3.1, 0.55, { seed: 16, flat: 0.85 }], [183.2, 1.9, 0.24, { seed: 17 }],
      [196.0, 5.9, 0.3, { seed: 20, flat: 0.7 }]],
    logs: [[186.9, -2.6, 3.0, 0.21, 0.1]], stumps: [[184.0, -1.9, 0.3, 0.34]],
    bigSticks: [[198.4, -3.3, 1.6, 0.3], [199.0, -3.0, 1.1, 1.2], [192.6, 2.9, 1.3, 2.7], [185.3, 4.8, 1.5, 0.5]],
    bare: () => false,
    animals(g, life, pud, rocks) {
      mkFrog(g, life, 193.25, 1.3, { yaw: 0.5, water: [194.75, 1.6, pud.y + 0.014], pool: pud, col: FROG[0] });
      mkFrog(g, life, 197.55, 0.62, { yaw: -2.6, water: [198.7, 0.2, pud.y + 0.014], pool: pud, s: 1.25, col: FROG[1] });
      mkFrog(g, life, 205.7, 1.15, { yaw: 2.4, flee: 2.1, water: () => [209.0, 0.95, W.level + 0.02], via: [[206.8, 1.1], [207.6, 1.05]], col: FROG[0] });   // 渠边的这一只：两下跳到岸沿，再一头扎进渠里
      const perch = face(rocks[0], 191.85, 0.17);                                                    // 贴在大石头朝镜头的那一面上，头朝右上
      mkLizard(g, life, perch.p.x, perch.p.y, perch.p.z + 0.004, { yaw: 0.75, normal: perch.n, path: [[192.45, 0.03, -0.9], [193.0, 0.012, -1.9], [193.3, 0.012, -3.0], [193.5, 0.012, -3.9]], path2: [[191.3, 0.03, -0.95], [190.7, 0.012, -2.0], [190.3, 0.012, -3.2]] });
      mkBugs(g, life, 195.75, -0.78, 6, { s: 2.2 });
    } };
  // 水渠那一边：从水闸那一屏往右到这一章的尽头。同一片林子，换一种摆法；对岸渠沿上蹲着一只青蛙，主角踩着木梁过来时它跳进渠里
  const FAR_SIDE = {
    pools: [[229.6, 0.12, 0.95, 0.36], [223.6, 5.3, 1.75, 0.6], [241.2, -3.8, 1.3, 0.4], [250.6, 1.5, 0.8, 0.3]], poolBox: [221, 252.5, -4.6, 6.4],
    trunks: [220.5, 227, 236, 247, 256],
    ferns: [[220.6, -4.3, 2.2, 1.3], [226.4, -6.0, 2.0, 1.1], [233.9, -4.7, 1.8, 1.1], [238.2, -6.6, 2.4, 1.2], [245.5, -4.8, 2.2, 1.3], [252.6, -5.4, 2.0, 1.2], [231.6, 6.5, 2.8, 1.7], [247.9, 5.7, 2.6, 1.7]],
    mud: [[229.6, 0.2, 2.2, 0.9], [223.6, 5.4, 2.8, 1.2], [250.6, 1.5, 1.6, 0.7], [245.0, 3.4, 1.4, 0.7]],
    rocks: [[233.2, -1.65, 0.55, { seed: 31, flat: 0.85, sink: 0.28, sx: 1.1, sz: 0.9, yaw: 0.9 }], [232.25, -2.2, 0.22, { seed: 32, flat: 0.8 }], [240.6, 4.3, 0.45, { seed: 33, flat: 0.72 }], [221.0, -2.9, 0.5, { seed: 34, flat: 0.9 }],
      [249.9, -2.3, 0.62, { seed: 35, flat: 0.95, sx: 1.05, sz: 0.85 }], [226.3, 2.5, 0.26, { seed: 36 }], [254.3, 2.0, 0.3, { seed: 37, flat: 0.8 }], [244.0, 6.6, 0.34, { seed: 38, flat: 0.7 }]],
    logs: [[244.6, -3.4, 3.4, 0.24, -0.15]], stumps: [[251.4, -1.7, 0.34, 0.4], [221.4, -3.7, 0.26, 0.28]],
    bigSticks: [[236.4, 3.2, 1.5, 0.5], [242.2, -2.9, 1.3, 2.2], [256.0, 2.6, 1.4, 1.0], [227.8, -3.4, 1.2, 0.9]],
    bare: () => false,
    animals(g, life, pud, rocks) {
      mkFrog(g, life, 214.9, 1.35, { yaw: 2.8, flee: 2.2, water: () => [212.3, 1.0, W.level + 0.02], via: [[214.35, 1.3]], col: FROG[1] });   // 对岸的这一只：跳到岸沿，扎进渠里
      mkFrog(g, life, 228.35, 0.85, { yaw: 0.4, water: [229.4, 0.15, pud.y + 0.014], pool: pud, col: FROG[0] });
      mkFrog(g, life, 222.1, 4.75, { yaw: -0.6, water: [223.4, 5.3, pud.y + 0.014], pool: pud, s: 1.3, col: FROG[1] });
      const perch = face(rocks[0], 233.1, 0.17);
      mkLizard(g, life, perch.p.x, perch.p.y, perch.p.z + 0.004, { yaw: 0.6, normal: perch.n, path: [[233.75, 0.03, -1.0], [234.3, 0.012, -2.0], [234.6, 0.012, -3.1], [234.8, 0.012, -4.0]], path2: [[232.5, 0.03, -1.05], [231.9, 0.012, -2.1], [231.5, 0.012, -3.3]] });
      mkBugs(g, life, 237.4, -0.72, 6, { s: 2.2 });
    } };
  // 脚步声：林子里（从林子边到这一章的尽头）是土上一层落叶；路上那两片湿泥（上面 mud 里的大椭圆在 z = 0 处的那一段）是泥
  surface(X + 61, X3 + 1, 'forest');
  for (const S of [NEAR_SIDE, FAR_SIDE]) for (const [x, z, rx, rz] of S.mud) if (Math.abs(z) < rz) { const w = rx * Math.sqrt(1 - (z / rz) ** 2); surface(x - w, x + w, 'mud'); }
  function* groundDetails(R, v, layers) {
    v.gd = {}; v.life = groundLife(R, 2);
    for (const k of GD_KINDS) { const g = new THREE.Group(); g.name = k; R.add(g); v.gd[k] = g; }
    // 水闸那一屏（x 约 200.5 到 219.5）不铺：那里的枯草、落叶、小石头、碎光斑是水闸标杆画面第三步定下来的（见上面）。两段在这两头慢慢淡进去
    yield* woods(v, layers, 176, 200.5, NEAR_SIDE, 2100);
    yield* woods(v, layers, 219.5, 257.5, FAR_SIDE, 2300);
    // 路边会被拨开的植物（48-brush.js）：主角走过去，伸手把挡路的叶子拨开。水闸那一屏不摆；避开水洼、石头、青蛙、蜥蜴和虫子
    brushRow(R, [['fern', 182.6, -0.4, 1.05], ['leaf', 189.5, 0.42, 1.35], ['branch', 224.6, -0.75, 1], ['grass', 238.6, 0.35, 1], ['leaf', 246.2, 0.42, 1.25, 1.45], ['fern', 252.8, 0.4, 1.0]], null, 2207);
    yield;
    // 前景：贴着画面下沿的几丛草和蕨，深色、略微虚焦。从林子边一直到这一章的尽头（渠上没有：那里的地面低下去，这几丛落到画面外了）
    ROOT = v.gd.fore; withSeed(2105, () => foreTufts(165, 262, 9.7, { skip: [[202, 216.5]] }));          // 水闸那一屏的四个角已经有设计好的前景（枯枝、芦苇），这里不再画
    yield;
  }
  function* build(R) {
    const S = 14, gy = groundY;                          // 这些室外布景原来是按“大门在 x = 90”画的，整体往右挪 14 米
    // 地平线上的巨像：一台跪坐着停机的巨型机器人，只剩一只眼睛还亮着
    backdrop(150 + S, 300 + S, -6, 76, -240, 7, g => {
      const gr = g.createLinearGradient(0, 0, 0, 112); gr.addColorStop(0, '#b69a7c'); gr.addColorStop(0.3, '#93826f'); gr.addColorStop(1, '#5d6264');
      setInk(g, gr);
      const Xc = 232; g.translate(213 + S, 0); g.scale(0.5, 0.5); g.translate(-Xc, 0);
      poly(g, [[Xc - 46, -6], [Xc - 44, 14], [Xc - 30, 30], [Xc - 6, 34], [Xc + 14, 26], [Xc + 30, 10], [Xc + 34, -6]]);          // 盘坐的腿和基座
      poly(g, [[Xc - 24, 28], [Xc - 30, 62], [Xc - 22, 82], [Xc + 2, 88], [Xc + 20, 78], [Xc + 22, 50], [Xc + 14, 28]]);          // 前倾的躯干
      poly(g, [[Xc - 30, 78], [Xc - 44, 72], [Xc - 52, 44], [Xc - 50, 12], [Xc - 42, 10], [Xc - 38, 42], [Xc - 26, 60]]);         // 垂下的左臂
      poly(g, [[Xc + 18, 78], [Xc + 36, 66], [Xc + 50, 40], [Xc + 62, 4], [Xc + 70, -6], [Xc + 52, -6], [Xc + 42, 34], [Xc + 22, 56]]); // 撑地的右臂
      poly(g, [[Xc - 4, 86], [Xc - 2, 96], [Xc + 8, 104], [Xc + 24, 104], [Xc + 30, 92], [Xc + 26, 82], [Xc + 12, 80]]);          // 低垂的头
      line(g, [[Xc + 4, 102], [Xc - 6, 118]], 0.9); line(g, [[Xc + 16, 104], [Xc + 18, 114]], 0.6);                            // 天线
      for (const [x1, y1, x2, y2] of [[Xc - 20, 84, Xc - 60, -6], [Xc + 14, 84, Xc + 84, -6], [Xc - 46, 60, Xc - 76, -6]]) cable(g, x1, y1, x2, y2, 9, 0.35);
    }, { fog: false, order: -3000 });
    glow(R, 0xffb24a, 10, 0.95, 224 + S, 46.4, -239).renderOrder = -2990;      // 巨像还亮着的那只眼睛
    yield;
    // 远处的天际线：断塔、烟囱、歪斜的吊臂
    backdrop(30, 236, -6, 70, -150, 8, g => {
      const gr = g.createLinearGradient(0, 0, 0, 46); gr.addColorStop(0, '#b4987a'); gr.addColorStop(1, '#5e5b58');
      setInk(g, gr);
      heap(g, 30, 236, 0, 0.5, 4, 9);
      for (let x = 36; x < 232; x += rr(9, 26)) {
        const w = rr(4, 13), h = rr(8, 44) * (x > 176 ? 0.4 : 1), t = rnd();
        if (t < 0.4) { poly(g, [[x, -6], [x, h * rr(0.7, 0.95)], [x + w * rr(0.3, 0.6), h], [x + w, h * rr(0.5, 0.85)], [x + w, -6]]); }                // 断塔
        else if (t < 0.6) { poly(g, [[x, -6], [x + w * 0.22, h * 1.1], [x + w * 0.5, h * 1.1], [x + w * 0.72, -6]]); }                                // 冷却塔 / 烟囱
        else if (t < 0.8) { box(g, x, -6, 1.3, h + 6); line(g, [[x + 0.6, h], [x + rr(9, 18), h * rr(0.55, 0.85)]], 0.8); truss(g, x - 3, x + 4, h * 0.6, 1.6, 0.4); }   // 吊塔
        else { for (let i = 0; i < 4; i++) box(g, x + i * 2.8, -6, 1.1, h * rr(0.3, 0.8) + 6); box(g, x - 1, h * 0.28, 12, 1.1); }                    // 管廊
      }
    }, { fog: false, order: -2000, fadeR: 54 });
    yield;
    // 林地后面的远山：两层淡淡的山脊
    backdrop(168, 330, -6, 60, -150, 6, g => {
      setInk(g, vgrad(g, 34, 0, '#93a295', '#768678')); ridge(g, 168, 330, -6, x => 21 + 7 * Math.sin(x / 23) + 3.5 * Math.sin(x / 8.3 + 1) + rr(-0.5, 0.5), 1.5);
      setInk(g, vgrad(g, 22, 0, '#748576', '#5b6b5e')); ridge(g, 168, 330, -6, x => 11 + 5 * Math.sin(x / 17 + 2) + 2.4 * Math.sin(x / 5.1) + rr(-0.7, 0.7), 1.2);
    }, { fog: false, order: -1900, fadeL: 46, fadeR: 40 });
    yield;
    // 中景：高压线塔、倒下的步行机械
    backdrop(98, 236, -4, 36, -52, 18, g => {
      setInk(g, '#1e1d1f');
      ridge(g, 98, 236, -4, x => gy(x) + rr(0.3, 1.6), 3);
      const pylon = (x, h, lean) => {
        const t = [x + lean * h, h];
        line(g, [[x - 1.7, -1], t, [x + 1.7, -1]], 0.22);
        for (let k = 0.2; k < 1; k += 0.2) line(g, [[lerp(x - 1.7, t[0], k), lerp(-1, h, k)], [lerp(x + 1.7, t[0], k + 0.1), lerp(-1, h, k + 0.1)], [lerp(x - 1.7, t[0], k + 0.2), lerp(-1, h, k + 0.2)]], 0.12);
        for (const f of [0.72, 0.9]) line(g, [[t[0] - 3.4 * f, h * f], [t[0] + 3.4 * f, h * f]], 0.2);
        return t;
      };
      const tops = [[100 + S, 21, 0.02], [134 + S, 24, -0.06], [171 + S, 19, 0.16], [208 + S, 17, 0.3]].map(a => pylon(...a));
      for (let i = 1; i < tops.length; i++) for (const d of [-3, 3]) cable(g, tops[i - 1][0] + d, tops[i - 1][1] * 0.9, tops[i][0] + d, tops[i][1] * 0.9, 5 + i, 0.07);
      // 倒下的步行机械：一条拱起的腿和半埋的机身
      g.translate(S, 1.2);
      g.lineWidth = 1.5; g.beginPath(); g.moveTo(146, -1); g.quadraticCurveTo(150, 15, 160, 9); g.stroke();
      line(g, [[160, 9], [168, -1]], 1.1); disc(g, 160, 9, 1.5);
      poly(g, [[150, -1], [152, 5], [163, 6.5], [176, 3], [181, -1]]);
    }, { fadeR: 26 });
    yield;
    // 近景：歪斜的杆子、铁丝网、矮废料堆
    backdrop(102, 192, -3, 14, -11, 30, g => {
      setInk(g, '#151516');
      ridge(g, 102, 192, -3, x => gy(x) + rr(-0.2, 0.32), 1.1);
      const base = x => gy(x) - 0.3;
      for (const [x0, h, lean] of [[97, 5.5, 0.12], [103.5, 4.2, -0.2], [112.4, 6.4, 0.05], [125, 5.2, -0.1], [133, 7, 0.08], [146, 5, 0.2]]) {
        const x = x0 + S; line(g, [[x, base(x)], [x + lean * h, base(x) + h]], 0.2);
        line(g, [[x + lean * h - 0.8, base(x) + h * 0.86], [x + lean * h + 0.8, base(x) + h * 0.9]], 0.12);
      }
      for (let x = 105 + S; x < 121 + S; x += 2.2) line(g, [[x, base(x)], [x + 0.15, base(x) + 1.7]], 0.09);        // 铁丝网的桩
      for (const h of [0.7, 1.15, 1.55]) cable(g, 105 + S, base(105 + S) + h, 121 + S, base(121 + S) + h, 0.25, 0.035);
      const b = base(127 + S); poly(g, [[127 + S, b], [128.5 + S, b + 2.3], [131.2 + S, b + 2.9], [134.6 + S, b + 1.2], [136 + S, b]]);   // 半埋的机壳
      for (const [x, h] of [[166, 6], [173, 8.5], [181, 7]]) tree(g, x, base(x), h, 'dead');                    // 林子边上最先看到的几棵枯树
    }, { fadeR: 8 });
    yield;

    // ---------------- 林地 ----------------
    const far40 = backdrop(166, 322, -3, 34, -40, 13, g => {            // 远处的一排树（水洼里映着它，所以留个名字）
      setInk(g, '#6b7a62'); ridge(g, 166, 322, -3, x => 12.5 + 2.5 * Math.sin(x / 6.3) + rr(-1.2, 1.6), 1.3);       // 连成一片的树冠，后面的东西透不出来。颜色淡：隔着雾，它快融进后面的亮光里了
      for (let x = 168; x < 320; x += rr(2.2, 4.6)) tree(g, x, 0.6, rr(15, 24), rnd() < 0.3 ? 'pine' : 'round');
    }, { fadeL: 16, fadeR: 30 });
    yield;
    const far22 = backdrop(170, 300, -3, 26, -22, 17, g => {            // 再近一排
      setInk(g, '#262b20'); ridge(g, 170, 300, -3, x => 1.6 + 0.8 * Math.sin(x / 3.7) + rr(0, 0.9), 1.1);
      for (let x = 174; x < 298; x += rr(3.6, 7.5)) if (x < 203 || x > 218) tree(g, x, 0.4, rr(10, 17), rnd() < 0.25 ? 'pine' : 'round');
      for (let i = 0; i < 40; i++) { const x = rr(172, 298); for (let k = 0; k < 3; k++) disc(g, x + rr(-0.9, 0.9), 1.6 + rr(0, 0.9), rr(0.6, 1.3)); }   // 灌木
    }, { fadeL: 12, fadeR: 30 });
    yield;
    const near9 = backdrop(174, 282, -3, 18, -9, 25, g => {             // 近处的大树干：一直伸出画面上沿，只看得见树干和最低的几根枝
      setInk(g, '#0e120c'); ridge(g, 174, 282, -3, x => gy(x) - 0.25 + rr(-0.1, 0.25), 0.8);
      for (const [x, w] of [[178, 0.8], [186.5, 1.1], [193, 0.7], [199.5, 0.9], [220.5, 1.0], [227, 0.75], [236, 1.15], [247, 0.8], [256, 1.0], [268, 0.9], [277, 0.7]]) {
        poly(g, [[x - w * 0.75, gy(x) - 0.3], [x + w * 0.75, gy(x) - 0.3], [x + w * 0.42, 18], [x - w * 0.42, 18]]);
        for (let i = 0; i < 3; i++) twig(g, x, rr(5, 13), rr(0.5, 1.3) * (rnd() < 0.5 ? -1 : 1), rr(2, 4.5), w * 0.22, 2);
        for (let i = 0; i < 5; i++) disc(g, x + rr(-3.5, 3.5), rr(14, 18), rr(1.4, 2.6));
      }
      grass(g, 176, 280, x => gy(x) - 0.2, 0.3, 0.9, 420);
      for (let i = 0; i < 34; i++) { const x = rr(176, 280); if (x < 204 || x > 217) for (let k = 0; k < 3; k++) disc(g, x + rr(-0.5, 0.5), gy(x) + rr(-0.1, 0.3), rr(0.3, 0.7)); }
    }, { fadeL: 6, fadeR: 14 });
    yield;
    backdrop(176, 268, -0.5, 17, -2.6, 12, g => {         // 林间的光柱
      for (const [x, w, a] of [[188, 3.2, 0.16], [201, 4.4, 0.2], [216, 3.6, 0.15], [231, 2.8, 0.12], [246, 4, 0.14]]) {
        const gr = g.createLinearGradient(0, 17, 0, 0); gr.addColorStop(0, `rgba(255,255,255,${a})`); gr.addColorStop(0.7, `rgba(255,255,255,${a * 0.5})`); gr.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = gr; poly(g, [[x + 3.6, 17], [x + 5, 17], [x + w / 2, 0], [x - w / 2, 0]]);
      }
    }, { additive: true, fog: false, blur: 10, order: 40 });
    yield;
    // 前景：离镜头最近的一层，全黑、略微虚焦。
    // （原来沿着画面下沿还有一道草丛的剪影；从镜头的高度看过去它前面还露着一截地面，成了横在画面中间的一道黑带，到了水闸还把水渠挡住，去掉了）
    backdrop(180, 264, 6, 11, 6, 22, g => {
      setInk(g, '#040607');
      for (let x = 182; x < 262; x += rr(7, 13)) { const y = rr(8.2, 9.6); for (let i = 0; i < 9; i++) disc(g, x + rr(-2.2, 2.2), y + rr(-0.5, 1.2), rr(0.35, 0.8)); twig(g, x + 2.5, 10.4, 2.2 + rr(-0.3, 0.3), rr(2, 3.2), 0.12, 1); }   // 垂下来的枝叶
    }, { fog: false, blur: 2.2, order: 4000 });
    // 水闸这一屏的前景：上面两角垂下来的枯枝，下面两角几丛芦苇。只占四个角，不做成横贯画面的一条
    const seeded = s => () => { s = (s * 16807) % 2147483647; return s / 2147483647; };          // 自带种子的随机数：形状不跟着这一章里别的随机数变
    backdrop(202, 216.5, -3, 6.3, 9, 60, g => {
      setInk(g, '#060807'); const rn = seeded(31);
      const twigs = (x, y, a, len, w, depth) => {
        const x2 = x + Math.sin(a) * len, y2 = y - Math.cos(a) * len; line(g, [[x, y], [x2, y2]], w);
        if (depth > 0) for (let i = 0, n = 2 + (rn() < 0.5 ? 1 : 0); i < n; i++) { const k = 0.35 + 0.6 * rn(); twigs(x + (x2 - x) * k, y + (y2 - y) * k, a + (rn() - 0.5) * 1.6, len * (0.4 + 0.3 * rn()), w * 0.6, depth - 1); }
      };
      twigs(203.4, 6.3, 0.5, 2.5, 0.09, 3); twigs(204.7, 6.3, 0.15, 1.4, 0.06, 2);
      twigs(214.9, 6.3, -0.45, 2.1, 0.08, 3); twigs(213.6, 6.3, -0.1, 1.2, 0.05, 2);
      const reeds = (x1, x2, hMax) => {
        for (let i = 0; i < 46; i++) {
          const x = x1 + rn() * (x2 - x1), h = hMax * (0.45 + 0.55 * rn()), lean = (rn() - 0.5) * 0.5; poly(g, [[x - 0.03, -3], [x + 0.03, -3], [x + lean * h, -0.25 + h]]);
          if (rn() < 0.25) { g.beginPath(); g.ellipse(x + lean * h, -0.25 + h, 0.035, 0.13, 0, 0, 6.2832); g.fill(); }
        }
      };
      reeds(203.4, 205.6, 1.15); reeds(212.9, 215, 0.95);
    }, { fog: false, blur: 2.2, order: 4000 });
    yield;

    // ---------------- 水渠、水闸 ----------------
    const v = {};
    // 这一带的石头、木头、铁件都比别处暗一档、偏一点灰褐：逆光下它们是近处的暗部。这几种材质别的章节也在用，所以在这里另配一份
    const M2 = {};
    for (const [k, hex] of [['stone', 0x3c3b32], ['stone2', 0x2c2d26], ['wood', 0x3b2b1b], ['wood2', 0x241b12], ['dark', 0x080b0b], ['rust', 0x452a1c], ['pale', 0x5b5a53], ['steel', 0x23292a]]) { M2[k] = lam(hex); M2[k].userData.own = true; }
    // 水渠朝镜头这边一直修到地面的尽头（z = 14）：镜头往下看以后，画面下沿能看到水渠的近端
    for (const [x, sx] of [[CX0, -1], [CX1, 1]]) {
      add(R, bx(0.6, 3.66, 32), M2.stone, x + sx * 0.3, BED / 2 + 0.03, -2);                        // 渠壁
      add(R, bx(1.0, 0.1, 32), M2.stone2, x + sx * 0.5, 0.01, -2);                                  // 岸顶的石沿
      add(R, bx(0.04, 0.16, 32), M2.pale, x - sx * 0.01, HIGH + 0.02, -2, false);                   // 渠壁上的旧水位线
      for (let z = -15; z < 13.5; z += 2.1) add(R, bx(0.62, 0.05, 0.05), M2.dark, x + sx * 0.3, rr(-3.2, -0.8), z, false);
    }
    for (const x of [CX0 + 0.25, CX0 + 3.55]) add(R, bx(0.3, 0.42, 1.1), M2.stone2, x, BED + 0.21, 0);                  // 卡住木梁的石槽
    // 闸门：在水渠的上游（画面深处）。两座石墩、一道横梁、一扇木闸板
    const GZ = -7.2;
    for (const x of [CX0 - 0.5, CX1 + 0.5]) add(R, bx(1.4, 7.4, 1.8), M2.stone, x, 0.1, GZ);
    add(R, bx(8.4, 0.7, 1.5), M2.stone2, (CX0 + CX1) / 2, 3.95, GZ);
    v.gate = add(R, bx(5.2, 3.2, 0.26), M2.wood, (CX0 + CX1) / 2, BED + 1.6, GZ);
    for (let y = -1.4; y < 1.6; y += 0.7) add(v.gate, bx(5.22, 0.07, 0.3), M2.wood2, 0, y, 0, false);
    for (const x of [-1.6, 1.6]) add(v.gate, cy(0.05, 0.05, 6.4, 6), M2.dark, x, 4.6, 0, false);                         // 吊着闸板的两根铁杆
    add(R, cy(0.42, 0.42, 0.2, 14), M2.rust, CX0 + 0.9, 4.75, GZ).rotation.x = Math.PI / 2;                                // 绞盘
    v.winch = add(R, bx(0.9, 0.1, 0.1), M2.dark, CX0 + 0.9, 4.75, GZ + 0.16, false);
    add(R, bx(5.2, 3.3, 34), unlit(0xb9b4a4), (CX0 + CX1) / 2, HIGH - 1.67, GZ - 17.3, false);                              // 闸门后面蓄着的水：和水塘是同一片，同一个颜色
    // 闸后的水塘：水闸拦着的不只是一条渠，而是林子里的一片浅水。水面映着雾，是画面里最亮的一条 —— 闸门和主角的上半身都衬在它前面。
    // 远岸一道深色是树的倒影，水里立着一排旧木桩。水面铺在地上：左头收成一个水湾，右头渐渐淡掉
    const POSTS = [[197.2, 1.5, 0.04], [199.4, 1.9, -0.03], [201.6, 1.3, 0.06], [203.8, 1.7, 0], [206, 1.1, -0.08], [209.6, 1.2, 0.1], [211.9, 0.9, -0.05],
      [215.1, 1.6, 0.05], [217.3, 1.2, -0.04], [219.5, 1.8, 0.03], [221.7, 1.4, -0.06]];                // [x, 露出水面多高, 歪多少]：水闸这一屏里的几根是摆好的
    { const rn = seeded(41); for (let x = 188.4; x < 247; x += 2.2) if ((x < 196 || x > 223) && rn() > 0.25) POSTS.push([x + (rn() - 0.5) * 0.5, 0.9 + rn() * 1.1, (rn() - 0.5) * 0.16]); }   // 两边接着排下去，随机缺几根
    backdrop(168, 252, -21.5, -9.4, 0, 22, g => {
      const gr = g.createLinearGradient(0, -21.5, 0, -9.4), rn = seeded(5);
      gr.addColorStop(0, '#77726a'); gr.addColorStop(0.16, '#aaa596'); gr.addColorStop(0.55, '#c8c2b1'); gr.addColorStop(1, '#b0ab9c');
      g.fillStyle = gr; g.fillRect(168, -21.5, 84, 12.1);
      for (let i = 0; i < 26; i++) {                                                                      // 远岸树干的倒影：一道道朝着镜头淡下去的深色
        const x = 170 + rn() * 80, w = 0.5 + rn() * 1.2, g2 = g.createLinearGradient(0, -21.5, 0, -10);
        g2.addColorStop(0, `rgba(60,57,50,${(0.3 + 0.2 * rn()).toFixed(2)})`); g2.addColorStop(1, 'rgba(60,57,50,0)'); g.fillStyle = g2; g.fillRect(x, -21.5, w, 11.5);
      }
      for (let i = 0; i < 160; i++) { g.fillStyle = rn() < 0.5 ? 'rgba(255,255,250,.16)' : 'rgba(70,66,58,.12)'; g.fillRect(168 + rn() * 84, -21 + rn() * 11, 1 + rn() * 5, 0.035 + rn() * 0.05); }   // 水纹
      for (const [x] of POSTS) { const g2 = g.createLinearGradient(0, -14, 0, -9.4); g2.addColorStop(0, 'rgba(40,38,34,.5)'); g2.addColorStop(1, 'rgba(40,38,34,.08)'); g.fillStyle = g2; g.fillRect(x - 0.11, -14, 0.22, 4.6); }   // 木桩的倒影
      // 近岸不是一条直线：沿岸擦掉一圈高低不平的边。左头收成一个弯进去的水湾，一直收到远岸 —— 不然水面会被坡地齐齐地切出一条直边
      const shore = x => { const k = clamp((x - 185.8) / 9.2, 0, 1); return -21.6 + 11.85 * Math.sqrt(1 - (1 - k) * (1 - k)); };
      g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000'; g.beginPath(); g.moveTo(168, -9.3);
      for (let x = 168; x <= 252; x += 0.6) g.lineTo(x, shore(x) - 0.35 * rn() - 0.25 * Math.sin(x * 0.9));
      g.lineTo(252, -9.3); g.closePath(); g.fill(); g.globalCompositeOperation = 'source-over';
    }, { floor: 0.02, order: -44, fadeR: 8 });
    { const post = lam(0x1c1814); post.userData.own = true; for (const [x, h, t] of POSTS) add(R, bx(0.2, h, 0.2), post, x, h / 2, -14, false).rotation.z = t; }
    yield;
    // 水面：一块会升高的半透明平面 + 一层流动的反光
    v.water = add(R, bx(5.2, 0.02, 21.2), new THREE.MeshLambertMaterial({ color: 0x203334, transparent: true, opacity: 0.84, emissive: 0x0e1a1c }), (CX0 + CX1) / 2, LOW, GZ + 10.6, false);
    v.water.receiveShadow = true;
    { const [c, g] = mkCanvas(64, 256); g.fillStyle = '#000'; g.fillRect(0, 0, 64, 256);
      for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(255,255,255,${rr(0.05, 0.3)})`; g.fillRect(rr(0, 64), rr(0, 256), rr(6, 30), rr(1, 3)); }
      v.sheenTex = new THREE.CanvasTexture(c); v.sheenTex.wrapS = v.sheenTex.wrapT = THREE.RepeatWrapping; v.sheenTex.repeat.set(1.5, 3);
      const m = new THREE.MeshBasicMaterial({ map: v.sheenTex, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, color: 0xcfe6e0 }); m.userData.own = true;
      v.sheen = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 21.2), m); v.sheen.rotation.x = -Math.PI / 2; v.sheen.position.set((CX0 + CX1) / 2, LOW + 0.02, GZ + 10.6); v.sheen.renderOrder = 20; R.add(v.sheen);
      // 从闸板底下涌出来的水
      const fm = new THREE.MeshBasicMaterial({ map: v.sheenTex, transparent: true, opacity: 0, color: 0xdfeeea, depthWrite: false, side: THREE.DoubleSide });
      v.fall = new THREE.Mesh(new THREE.PlaneGeometry(5.1, 1), fm); v.fall.position.set((CX0 + CX1) / 2, 0, GZ + 0.3); v.fall.renderOrder = 21; R.add(v.fall);
    }
    // 木梁
    v.timber = grp(R, timber.x, timber.y2, 0);
    add(v.timber, bx(TL, 0.42, 0.66), M2.wood, 0, -0.21, 0);
    for (const x of [-TL / 2 + 0.03, TL / 2 - 0.03]) add(v.timber, bx(0.07, 0.44, 0.68), M2.wood2, x, -0.21, 0, false);
    for (const x of [-1.1, 0.2, 1.3]) add(v.timber, bx(0.05, 0.02, 0.66), M2.wood2, x, 0.005, 0, false);
    // 闸杆（在近岸）和连到闸门的拉索
    v.lever = mkLever(R, LEVER_X, 0, -0.55);
    v.lever.g.traverse(o => { if (!o.isMesh) return; if (o.material === MAT.steel) o.material = M2.steel; else if (o.material === MAT.dark) o.material = M2.dark; else if (o.material.isMeshLambertMaterial) o.material.color.setHex(0x752918); });   // 闸杆也跟着压暗
    tube(R, [[LEVER_X, 0.5, -0.9], [LEVER_X + 1.5, 0.25, -3.5], [CX0 - 0.6, 2.2, GZ + 0.6], [CX0 + 0.4, 4.6, GZ + 0.3]], 0.03, M2.dark);
    for (const [x, z, a, l] of [[CX0 - 2.2, 0.9, 0.4, 1.6], [CX0 - 1.4, -1.6, -0.7, 1.2], [CX0 - 3.1, -2.2, 1.2, 0.9]]) { const b = add(R, cy(0.045, 0.06, l, 6), M2.wood2, x, 0.06, z); b.rotation.set(Math.PI / 2, 0, a); }   // 被水冲到岸边的树枝
    // 对岸一盏熄着的小灯，和远处指向旧城方向的检修灯
    add(R, cy(0.05, 0.07, 2.6, 6), M2.dark, CX1 + 3.4, 1.3, -2.2); add(R, bx(0.34, 0.26, 0.34), M2.dark, CX1 + 3.4, 2.7, -2.2);
    add(R, cy(0.12, 0.2, 9.2, 8), M2.dark, X + 139, 4.6, -24); add(R, bx(1.3, 0.14, 0.14), M2.dark, X + 139.5, 8.9, -24);
    v.farGlow = glow(R, 0xcfeaff, 7, 0, X + 139.9, 8.7, -23.8); v.farLens = add(R, new THREE.SphereGeometry(0.22, 10, 8), unlit(0x2c3a40, { fog: false }), X + 139.9, 8.7, -23.8, false);
    v.nearGlow = glow(R, 0xcfeaff, 1.6, 0, CX1 + 3.4, 2.7, -2.0);
    yield;
    // 看得见的光柱：五束光从左上方的枝叶间斜着漏下来，落在闸杆、水闸和对岸；地上各有一块亮斑
    const BEAMS = [[202.6, 2.6, 0.5], [206.3, 1.3, 0.26], [210.4, 2.8, 0.38], [214.2, 1.1, 0.22], [217.4, 2.2, 0.32]];     // [落在哪里, 落地时多宽, 多亮]
    backdrop(190, 228, -1, 16, -1.6, 16, g => {
      for (const [x, w, a] of BEAMS) {
        const gr = g.createLinearGradient(0, 16, 0, 0); gr.addColorStop(0, `rgba(255,238,200,${a})`); gr.addColorStop(0.75, `rgba(255,238,200,${a * 0.6})`); gr.addColorStop(1, `rgba(255,238,200,${a * 0.12})`);
        g.fillStyle = gr; poly(g, [[x - 7.2 - w * 0.2, 16], [x - 7.2 + w * 0.2, 16], [x + w / 2, 0], [x - w / 2, 0]]);
      }
    }, { additive: true, fog: false, blur: 4, order: 40 });
    backdrop(196, 222, -4, 3.5, 0, 14, g => {
      for (const [x, w, a] of BEAMS) {
        g.save(); g.translate(x, -0.4); g.scale(w * 0.62, 1.7);
        const gr = g.createRadialGradient(0, 0, 0, 0, 0, 1); gr.addColorStop(0, `rgba(255,236,196,${a * 0.5})`); gr.addColorStop(1, 'rgba(255,236,196,0)'); g.fillStyle = gr; g.fillRect(-1, -1, 2, 2); g.restore();
      }
    }, { floor: 0.015, additive: true, fog: false, order: -20 });
    // 闸上停着的几只鸟：横梁上三只，对岸的灯杆上一只。扳动闸杆、闸板升起来的时候它们一起飞走。
    // 每只是一小块朝着镜头的薄片，三张贴图轮换：停着、翅膀朝上、翅膀朝下
    const crowTex = pose => {
      const [c, g] = mkCanvas(128, 96); g.setTransform(128, 0, 0, -128, 64, 84); setInk(g, '#0b0d0c');               // 以米为单位画，原点在两脚之间
      if (pose === 0) {
        g.beginPath(); g.ellipse(0, 0.17, 0.2, 0.115, -0.25, 0, 6.2832); g.fill(); disc(g, 0.17, 0.3, 0.075);          // 身子、头
        poly(g, [[0.23, 0.32], [0.36, 0.29], [0.23, 0.26]]); poly(g, [[-0.14, 0.2], [-0.4, 0.06], [-0.36, 0], [-0.1, 0.1]]);   // 喙、尾
        line(g, [[-0.02, 0.08], [-0.03, 0]], 0.022); line(g, [[0.05, 0.08], [0.06, 0]], 0.022);                      // 腿
      } else {
        g.beginPath(); g.ellipse(0, 0.3, 0.2, 0.075, 0, 0, 6.2832); g.fill(); disc(g, 0.2, 0.32, 0.065);               // 飞的时候身子放平
        poly(g, [[0.26, 0.34], [0.38, 0.32], [0.26, 0.29]]); poly(g, [[-0.16, 0.33], [-0.42, 0.3], [-0.16, 0.26]]);
        poly(g, pose === 1 ? [[-0.1, 0.33], [0.12, 0.33], [-0.02, 0.62], [-0.2, 0.58]] : [[-0.1, 0.28], [0.12, 0.28], [0.0, 0.02], [-0.18, 0.06]]);   // 翅膀
      }
      return canvasTex(c);
    };
    const crowTexs = [0, 1, 2].map(crowTex);
    v.crows = [[210.3, 4.31, -6.4, 1, 1], [210.95, 4.31, -6.4, 0.92, -1], [212.6, 4.31, -6.4, 1.05, 1], [CX1 + 3.42, 2.84, -2.0, 1, -1]].map(([x, y, z, s, dir], i) => {
      const m = new THREE.MeshBasicMaterial({ map: crowTexs[0], transparent: true, depthWrite: false }); m.userData.own = true;
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.75), m); mesh.scale.set(dir * s, s, 1); mesh.renderOrder = 30; R.add(mesh);
      return { mesh, x, y, z, s, dir, wait: 0.05 + 0.13 * i, vx: dir * (2.2 + 0.5 * i), vy: 2.3 + 0.25 * (i % 2), vz: -1.2 - 0.4 * i };     // wait：听到动静以后隔多久起飞
    });
    v.crowTexs = crowTexs;
    yield;
    // ---------------- 水闸这一屏的细节（标杆画面第三步，2 到 8 全选）----------------
    // 闸门：漏水、旧痕、铁梯和铁链；水渠：石块和青苔、水里的倒影和落叶；地上：枯草和落叶、碎光斑。
    // 样子和 tools/look-sheet.html?ch=2&step=3 里的各版一样；会动的几样（漏水、水面上的东西、倒影）在 update() 里
    const oval = (g, x, y, rx, ry, a = 0) => { g.beginPath(); g.ellipse(x, y, rx, ry, a, 0, 6.2832); g.fill(); };
    const drip = (g, x, y, len, w, col, rn) => {                                                     // 一道往下挂的流痕：上宽下尖，略微弯
      const Lf = [], Rt = [], ph = rn() * 6;
      for (let i = 0; i <= 7; i++) { const t = i / 7, xx = x + Math.sin(ph + t * 4) * 0.025, ww = w * (1 - 0.85 * t) / 2; Lf.push([xx - ww, y - t * len]); Rt.push([xx + ww, y - t * len]); }
      g.fillStyle = col; poly(g, Lf.concat(Rt.reverse()));
    };
    const leaf = (g, x, y, s, a, col) => { g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = col; g.beginPath(); g.moveTo(-s, 0); g.quadraticCurveTo(0, -s * 0.5, s, 0); g.quadraticCurveTo(0, s * 0.5, -s, 0); g.fill(); g.restore(); };
    const LEAFC = ['rgba(120,86,40,.95)', 'rgba(142,102,48,.92)', 'rgba(96,68,34,.95)', 'rgba(150,118,60,.9)', 'rgba(78,56,28,.95)'];
    const own = m => { m.userData.own = true; return m; };
    v.gz = GZ;

    // 闸门 · 漏水：闸板的几道缝里往外喷细水，逆光下发亮，落进渠里溅起白沫。
    // 水柱的形状画在一张透明度贴图上，上面再贴一层一直往下滚的明暗，看起来水在流；闸板一升起来就停了
    const LEAKS = [[209.2, -1.3, 1, 0.2], [210.35, -2.0, 0.75, -0.12], [211.75, -1.3, 0.7, 0.14], [212.5, -2.0, 1, -0.2], [210.95, -2.7, 1.15, 0.06], [208.7, -2.7, 0.6, 0.12]];   // [x, 哪道缝（高度）, 水有多大, 往哪边偏]
    {
      const x1 = 207.9, x2 = 213.3, y1 = -3.45, y2 = -0.3, s = 160, [mc, g] = mkCanvas(Math.round((x2 - x1) * s), Math.round((y2 - y1) * s)), rn = seeded(52);
      g.fillStyle = '#000'; g.fillRect(0, 0, mc.width, mc.height);
      g.setTransform(s, 0, 0, -s, -x1 * s, y2 * s); setInk(g, '#fff');
      blurDraw(g, 1.6, g => { for (const [x, y, k, lean] of LEAKS) {
        const ey = LOW - 0.03, n = k > 0.9 ? 2 : 1;
        for (let j = 0; j < n; j++) {                                                                   // 从缝里冲出来，越往下越散，到了下面断成水珠
          const lj = lean + (j - (n - 1) / 2) * 0.09 * k + (rn() - 0.5) * 0.04, pts = [];
          for (let i = 0; i <= 24; i++) { const t = i / 24; pts.push([x + (j - (n - 1) / 2) * 0.03 + lj * Math.pow(t, 0.7), y - (y - ey) * Math.pow(t, 1.5)]); }
          for (let i = 1; i < pts.length; i++) { const t = i / 24; if (t > 0.72 && rn() < 0.3) continue; g.globalAlpha = (0.75 - 0.45 * t) * (j ? 0.6 : 1); line(g, [pts[i - 1], pts[i]], (0.012 + 0.03 * t) * k); }
        }
        g.globalAlpha = 1; g.save(); g.translate(x, y); g.scale(0.16 * k, 0.035);                    // 缝口一点亮
        const sp = g.createRadialGradient(0, 0, 0, 0, 0, 1); sp.addColorStop(0, `rgba(255,255,255,${0.55 * k})`); sp.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = sp; g.fillRect(-1, -1, 2, 2); g.restore();
        for (let i = 0; i < 9; i++) { g.globalAlpha = 0.25 + 0.4 * rn(); oval(g, x + lean + (rn() - 0.5) * 0.3 * k, ey + 0.03 + rn() * 0.16 * k, 0.012 + 0.012 * rn(), 0.012 + 0.02 * rn()); }   // 溅起来的水珠
        g.globalAlpha = 1; setInk(g, '#fff');
      } });
      const mask = canvasTex(mc); mask.colorSpace = THREE.NoColorSpace;                                    // 透明度贴图：按画出来的数值用，不做 sRGB 换算（换算会把中间调压得很暗）
      const [fc, fg] = mkCanvas(32, 128); fg.fillStyle = '#dcdcdc'; fg.fillRect(0, 0, 32, 128);              // 水流：大体是亮的，夹着一道道更亮的和暗一些的，一直往下滚
      { const rf = seeded(53); for (let i = 0; i < 36; i++) { fg.fillStyle = rf() < 0.6 ? '#fff' : '#6a6a6a'; fg.fillRect(rf() * 32, rf() * 128, 2 + rf() * 4, 6 + rf() * 20); } }
      v.flowTex = canvasTex(fc); v.flowTex.colorSpace = THREE.NoColorSpace; v.flowTex.wrapS = v.flowTex.wrapT = THREE.RepeatWrapping; v.flowTex.repeat.set(12, 3);
      v.jets = add(R, new THREE.PlaneGeometry(x2 - x1, y2 - y1), own(new THREE.MeshBasicMaterial({ map: v.flowTex, alphaMap: mask, color: 0xe8eee4, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })), (x1 + x2) / 2, (y1 + y2) / 2, GZ + 0.25, false);
      v.jets.renderOrder = 25;
    }
    v.mist = backdrop(207.9, 213.3, -3.45, -2.3, GZ + 0.5, 40, g => { g.fillStyle = vgrad(g, -3.3, -2.4, 'rgba(230,234,226,.22)', 'rgba(230,234,226,0)'); g.fillRect(207.9, -3.45, 5.4, 1.15); },   // 闸板脚下飘着的一层水雾
      { additive: true, fog: false, blur: 6, order: 24 });
    v.foam = backdrop(CX0, CX1, -7.1, -5.3, 0, 120, g => {                                             // 水落下去的地方：一团团白沫、一圈圈水纹（跟着水位走）
      const rn = seeded(51);
      for (const [x, y, k, lean] of LEAKS) {
        const fx = x + lean, fz = -6.8 + (y + 3.25) * 0.06;
        for (let i = 0; i < 10; i++) { g.fillStyle = `rgba(226,230,220,${((0.12 + 0.28 * rn()) * k).toFixed(3)})`; oval(g, fx + (rn() - 0.5) * 0.45 * k, fz + (rn() - 0.3) * 0.25, 0.04 + 0.12 * rn() * k, 0.025 + 0.05 * rn()); }
        g.strokeStyle = `rgba(220,226,214,${(0.22 * k).toFixed(3)})`; g.lineWidth = 0.022;
        for (const r of [0.22, 0.42, 0.66]) { g.beginPath(); g.ellipse(fx, fz + 0.05, r * k, r * 0.5 * k, 0, 0, 6.2832); g.stroke(); }
      }
      g.fillStyle = vgrad(g, -7.1, -6.4, 'rgba(225,230,220,.35)', 'rgba(225,230,220,0)'); g.fillRect(CX0, -7.1, 5.2, 0.7);
    }, { floor: LOW + 0.035, fog: false, order: 22 });
    // 闸板：木板缝、两道铁箍和铆钉、漏水的地方湿着；水线以上一截颜色深，水线上一圈青苔。贴在闸板上，跟着闸板一起升起来
    v.gate.attach(backdrop(CX0, CX1, -3.6, -0.4, GZ + 0.155, 90, g => {
      const rn = seeded(94);
      for (let y = -0.4; y > -3.6; y -= 0.27) { g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(CX0, y - 0.012, 5.2, 0.022); }
      for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(${rn() < 0.5 ? '0,0,0' : '200,180,150'},${(0.05 + 0.1 * rn()).toFixed(3)})`; g.fillRect(CX0 + rn() * 5.2, -3.3 + rn() * 2.9, 0.2 + rn() * 1.2, 0.02 + rn() * 0.05); }   // 木纹
      for (const [x, y, k] of LEAKS) { g.fillStyle = vgrad(g, y, -3.3, 'rgba(0,0,0,.55)', 'rgba(0,0,0,.2)'); g.fillRect(x - 0.2 * k, -3.3, 0.4 * k, y + 3.3); }
      for (const x of [209.0, 212.2]) { g.fillStyle = 'rgba(14,14,12,.92)'; g.fillRect(x - 0.07, -3.6, 0.14, 3.2); g.fillStyle = 'rgba(170,150,120,.6)'; for (let y = -0.6; y > -3.5; y -= 0.27) oval(g, x, y, 0.022, 0.022); }
      g.fillStyle = vgrad(g, -3.3, -2.2, 'rgba(0,0,0,.5)', 'rgba(0,0,0,0)'); g.fillRect(CX0, -3.6, 5.2, 1.4);
      g.fillStyle = 'rgba(50,62,26,.8)'; g.beginPath(); g.moveTo(CX0, -3.6); for (let x = CX0; x <= CX1; x += 0.08) g.lineTo(x, -3.16 + rn() * 0.12); g.lineTo(CX1, -3.6); g.closePath(); g.fill();
    }, { lit: true, order: 21 }));
    yield;

    // 闸门 · 旧痕：石墩上挂着白色的钙化流痕（水从横梁上几处漏下来，流痕就挂在这几处）和深色水渍，脚下一圈青苔，棱角缺了几块
    for (const [x1, x2, seed] of [[CX0 - 1.2, CX0 + 0.2, 91], [CX1 - 0.2, CX1 + 1.2, 92]]) backdrop(x1 - 0.02, x2 + 0.02, -0.5, 3.62, GZ + 0.915, 90, g => {
      const rn = seeded(seed), spots = [0, 1, 2].map(() => x1 + 0.15 + rn() * (x2 - x1 - 0.3));
      for (let i = 0; i < 8; i++) drip(g, x1 + 0.06 + rn() * (x2 - x1 - 0.12), 3.62 - rn() * 1.5, 0.8 + rn() * 2.2, 0.05 + rn() * 0.12, `rgba(6,7,4,${(0.18 + 0.25 * rn()).toFixed(2)})`, rn);
      for (let i = 0; i < 10; i++) drip(g, spots[i % 3] + (rn() - 0.5) * 0.25, 3.62, 0.4 + Math.pow(rn(), 2) * 3.2, 0.05 + rn() * 0.12, `rgba(222,216,196,${(0.3 + 0.3 * rn()).toFixed(2)})`, rn);
      g.fillStyle = 'rgba(62,78,30,.92)'; g.beginPath(); g.moveTo(x1 - 0.02, -0.5);
      for (let x = x1 - 0.02; x <= x2 + 0.02; x += 0.06) g.lineTo(x, 0.08 + 0.3 * rn() + 0.22 * Math.sin(x * 7 + seed));
      g.lineTo(x2 + 0.02, -0.5); g.closePath(); g.fill();
      for (let i = 0; i < 80; i++) { g.fillStyle = `rgba(104,120,52,${(0.35 + 0.45 * rn()).toFixed(2)})`; oval(g, x1 + rn() * (x2 - x1), 0.05 + rn() * 0.45, 0.02 + rn() * 0.05, 0.015 + rn() * 0.035); }
      for (let i = 0; i < 4; i++) { const ex = rn() < 0.5 ? x1 : x2, sd = ex === x1 ? 1 : -1, y = 0.6 + rn() * 2.8, d = 0.06 + rn() * 0.14, h = 0.12 + rn() * 0.3; g.fillStyle = 'rgba(0,0,0,.5)'; poly(g, [[ex, y], [ex + sd * d, y - h * 0.3], [ex + sd * d * 0.7, y - h], [ex, y - h * 1.1]]); }
    }, { lit: true, order: 6 });
    // 横梁：上沿挂下来的白色流痕，下沿一道黑，顶上长着几丛草（衬在后面的亮雾前面是一圈剪影；鸟站的地方空着）
    backdrop(CX0 - 1.62, CX1 + 1.62, 3.58, 4.8, GZ + 0.765, 90, g => {
      const rn = seeded(93);
      for (let i = 0; i < 26; i++) drip(g, CX0 - 1.5 + rn() * 8.2, 4.3, 0.15 + rn() * 0.55, 0.04 + rn() * 0.1, `rgba(222,216,196,${(0.3 + 0.3 * rn()).toFixed(2)})`, rn);
      g.fillStyle = vgrad(g, 3.6, 3.78, 'rgba(0,0,0,.5)', 'rgba(0,0,0,0)'); g.fillRect(CX0 - 1.62, 3.58, 8.44, 0.2);
      for (let i = 0; i < 9; i++) {
        const x = CX0 - 1.4 + rn() * 8.0, n = 5 + Math.floor(rn() * 6);
        if ([210.3, 210.95, 212.6].some(c => Math.abs(c - x) < 0.4)) continue;
        g.fillStyle = '#1a1a10';
        for (let j = 0; j < n; j++) { const bx0 = x + (rn() - 0.5) * 0.3, h = 0.12 + rn() * 0.38, lean = (rn() - 0.5) * 0.25; poly(g, [[bx0 - 0.018, 4.3], [bx0 + 0.018, 4.3], [bx0 + lean, 4.3 + h]]); }
      }
    }, { lit: true, order: 6 });

    // 闸门 · 铁梯和铁链：左边石墩上一架检修用的铁梯，一直爬到横梁上面（几十根铁条拼成一个网格，一次画完）
    {
      const z = GZ + 1.03, list = [], pos = [], nor = [];
      for (const x of [207.12, 207.62]) list.push([0.045, 4.9, 0.045, x, -0.05, z], [0.045, 0.045, 0.5, x, 4.82, z - 0.22]);      // 两根扶手，上头往后弯到横梁顶上
      for (let y = 0.3; y < 4.8; y += 0.3) list.push([0.5, 0.032, 0.032, 207.37, y, z]);
      for (const y of [0.7, 2.1, 3.3]) for (const x of [207.12, 207.62]) list.push([0.03, 0.03, 0.14, x, y, z - 0.07]);                // 钉在石墩上的卡子
      for (const [w, h, d, x, y, zz] of list) { const b = bx(w, h, d).toNonIndexed(); b.translate(x, y + h / 2, zz); pos.push(...b.attributes.position.array); nor.push(...b.attributes.normal.array); b.dispose(); }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
      add(R, geo, own(lam(0x141716)));
    }
    // 铁链：从绞盘上垂下来，兜着挂到横梁前面的钩子上，钩子上再垂下一截，衬在闸门里的亮光前面
    backdrop(208.3, 212.3, 2.6, 5.0, GZ + 0.84, 200, g => {
      setInk(g, '#0b0c0b'); g.lineWidth = 0.014;
      const chain = pts => {                                                                           // 沿着折线每 9 厘米一节，一节扁一节立
        let k = 0;
        for (let i = 1; i < pts.length; i++) {
          const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], d = Math.hypot(x1 - x0, y1 - y0), a = Math.atan2(y1 - y0, x1 - x0);
          for (let t = 0; t < d; t += 0.09, k++) {
            g.save(); g.translate(x0 + (x1 - x0) * t / d, y0 + (y1 - y0) * t / d); g.rotate(a);
            if (k % 2) g.fillRect(-0.055, -0.009, 0.11, 0.018); else { g.beginPath(); g.ellipse(0, 0, 0.055, 0.032, 0, 0, 6.2832); g.stroke(); }
            g.restore();
          }
        }
      };
      const sagPts = []; for (let i = 0; i <= 24; i++) { const t = i / 24; sagPts.push([208.95 + t * 2.55, 4.45 - t * 0.25 - 0.55 * Math.sin(Math.PI * t)]); }
      chain(sagPts); chain([[211.5, 4.2], [211.52, 3.4], [211.5, 2.86]]);
      g.fillRect(211.46, 4.16, 0.08, 0.14); g.lineWidth = 0.025; g.beginPath(); g.arc(211.5, 4.12, 0.06, Math.PI, 2 * Math.PI); g.stroke();   // 钩子
      g.lineWidth = 0.02; g.beginPath(); g.ellipse(211.5, 2.82, 0.05, 0.07, 0, 0, 6.2832); g.stroke();                                      // 最下面一节大一点的环
    }, { order: 26 });
    // 锈铁牌：横梁上钉着的一块，喷着闸门的编号，锈水顺着往下流
    backdrop(212.15, 213.55, 3.58, 4.22, GZ + 0.77, 160, g => {
      const rn = seeded(97);
      g.fillStyle = '#6a3b20'; g.fillRect(212.25, 3.72, 1.2, 0.46);
      g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(212.25, 3.72, 1.2, 0.04); g.fillRect(212.25, 3.72, 0.04, 0.46);
      for (let i = 0; i < 30; i++) { g.fillStyle = `rgba(${rn() < 0.5 ? '140,74,34' : '30,18,10'},${(0.2 + 0.4 * rn()).toFixed(2)})`; oval(g, 212.27 + rn() * 1.16, 3.74 + rn() * 0.42, 0.02 + rn() * 0.06, 0.015 + rn() * 0.04); }   // 锈斑
      g.fillStyle = 'rgba(160,130,96,.85)'; for (const [x, y] of [[212.31, 3.78], [213.39, 3.78], [212.31, 4.12], [213.39, 4.12]]) oval(g, x, y, 0.022, 0.022);   // 铆钉
      g.save(); g.translate(212.85, 3.84); g.scale(0.01, -0.01); g.font = '700 24px -apple-system,"PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif'; g.textAlign = 'center'; g.fillStyle = 'rgba(220,210,180,.85)'; g.fillText('闸 07', 0, 0); g.restore();
      for (let i = 0; i < 7; i++) drip(g, 212.3 + rn() * 1.1, 3.72, 0.05 + rn() * 0.07, 0.02 + rn() * 0.05, `rgba(110,58,26,${(0.35 + 0.3 * rn()).toFixed(2)})`, rn);   // 锈水
    }, { lit: true, order: 7 });
    yield;

    // 渠壁 · 石块和青苔：一层层砌的石块；高水位以下泡过水，深一档、偏青；现在的水面上方一道湿的深色，水线上一层青苔。贴在两面渠壁朝里的那一面
    const wall = seed => g => {
      const rn = seeded(seed), top = 0.06, bot = -3.32;
      for (let y = top; y > bot; y -= 0.42) {                                                          // 每层 0.42 米高，每块 0.8 到 1.4 米长，上下两层的缝错开
        let z = -6.25 - rn() * 0.8;
        while (z < 14) {
          const len = 0.8 + rn() * 0.6;
          g.fillStyle = rn() < 0.5 ? `rgba(0,0,0,${(0.05 + 0.18 * rn()).toFixed(3)})` : `rgba(235,230,210,${(0.03 + 0.07 * rn()).toFixed(3)})`; g.fillRect(z, y - 0.42, len, 0.42);
          g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(z - 0.014, y - 0.42, 0.028, 0.42); z += len;
        }
        g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(-6.25, y - 0.434, 20.25, 0.028);
      }
      g.fillStyle = 'rgba(26,34,16,.4)'; g.fillRect(-6.25, bot, 20.25, HIGH - bot);
      for (let i = 0; i < 90; i++) { const z = -6.2 + rn() * 20, len = 0.15 + rn() * 0.9; g.fillStyle = `rgba(44,56,22,${(0.3 + 0.35 * rn()).toFixed(2)})`; g.fillRect(z, HIGH - len, 0.03 + rn() * 0.08, len); }   // 旧水位线下面挂着的青苔
      g.fillStyle = vgrad(g, -3.3, -2.6, 'rgba(0,0,0,.5)', 'rgba(0,0,0,0)'); g.fillRect(-6.25, bot, 20.25, 0.72);
      g.fillStyle = 'rgba(62,76,30,.85)'; g.beginPath(); g.moveTo(-6.25, bot); for (let z = -6.25; z <= 14; z += 0.15) g.lineTo(z, -3.2 + rn() * 0.14); g.lineTo(14, bot); g.closePath(); g.fill();   // 水线上的青苔
      for (let i = 0; i < 30; i++) { const z = -6 + rn() * 19.8, w = 0.15 + rn() * 0.4, h = 0.08 + rn() * 0.3; g.fillStyle = `rgba(56,66,28,${(0.5 + 0.4 * rn()).toFixed(2)})`; poly(g, [[z, top], [z + w, top], [z + w * 0.6, top - h], [z + w * 0.3, top - h * 0.7]]); }   // 岸顶垂下来的苔藓
    };
    backdrop(-6.25, 14, -3.32, 0.06, CX1 - 0.01, 48, wall(61), { side: -1, lit: true, order: 5 });
    backdrop(-6.25, 14, -3.32, 0.06, CX0 + 0.01, 48, wall(62), { side: 1, lit: true, order: 5 });
    // 岸顶的石沿：一块块的，靠水渠那边缺了几块，外沿长着一小团一小团的苔藓
    for (const [x1, x2, seed] of [[CX0 - 1, CX0, 63], [CX1, CX1 + 1, 64]]) backdrop(x1, x2, -6.25, 14, 0, 60, g => {
      const rn = seeded(seed), inner = x1 < 210 ? x2 : x1, out = x1 < 210 ? -1 : 1, outer = x1 < 210 ? x1 : x2;
      for (let z = -6.25; z < 14;) { const len = 0.9 + rn() * 0.5; g.fillStyle = rn() < 0.5 ? `rgba(0,0,0,${(0.06 + 0.16 * rn()).toFixed(3)})` : `rgba(230,225,205,${(0.04 + 0.07 * rn()).toFixed(3)})`; g.fillRect(x1, z, 1, len); g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(x1, z - 0.016, 1, 0.032); z += len; }
      for (let i = 0; i < 4; i++) { const z = -5 + rn() * 18, d = 0.15 + rn() * 0.25, l = 0.3 + rn() * 0.5; g.fillStyle = 'rgba(0,0,0,.55)'; poly(g, [[inner, z], [inner + out * d, z + l * 0.3], [inner + out * d * 0.6, z + l], [inner, z + l * 1.1]]); }
      for (let i = 0; i < 70; i++) { const z = -6 + rn() * 20, cx = outer - out * rn() * 0.26; g.fillStyle = `rgba(40,50,22,${(0.4 + 0.4 * rn()).toFixed(2)})`; for (let j = 0; j < 3; j++) oval(g, cx + (rn() - 0.5) * 0.12, z + (rn() - 0.5) * 0.3, 0.03 + rn() * 0.07, 0.05 + rn() * 0.14, rn() * 3); }
    }, { floor: 0.065, lit: true, order: -10 });
    yield;

    // 水面 · 倒影：闸门里那片亮光倒映在近处的水里，被水纹切成一道道。它落在水面的哪一块，每一帧按镜头和水位重新算（placeMirror）：
    // 一块四个角的平面，贴图上头是靠闸门的一边，下头是靠镜头的一边
    {
      const [mc, g] = mkCanvas(256, 512), rn = seeded(71);
      g.setTransform(256, 0, 0, 512, 0, 0);                                                            // 以 0..1 为单位画
      g.fillStyle = vgrad(g, 0, 0.35, 'rgba(190,186,170,0)', 'rgba(190,186,170,.3)'); g.fillRect(0, 0, 1, 1);
      for (let y = 0.02; y < 1; y += 0.012 + y * 0.03 + rn() * 0.015) {
        const a = Math.min(1, y / 0.3) * (0.1 + 0.2 * rn()), th = 0.004 + y * 0.008 + rn() * 0.006;
        for (let x = 0; x < 1;) { const len = 0.1 + rn() * 0.45; g.fillStyle = `rgba(200,196,180,${a.toFixed(3)})`; g.fillRect(x, y, Math.min(len, 1 - x), th); x += len + rn() * 0.1; }
      }
      g.globalCompositeOperation = 'destination-out';                                                  // 左右两边淡掉：贴着的是石墩的倒影
      for (const [a, b] of [[0, 0.24], [1, 0.76]]) { const e = g.createLinearGradient(a, 0, b, 0); e.addColorStop(0, 'rgba(0,0,0,1)'); e.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = e; g.fillRect(Math.min(a, b), 0, 0.24, 1); }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(new Array(12).fill(0), 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute([0, 1, 1, 1, 0, 0, 1, 0], 2)); geo.setIndex([0, 2, 1, 1, 2, 3]);
      v.mirror = new THREE.Mesh(geo, own(new THREE.MeshBasicMaterial({ map: canvasTex(mc), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, side: THREE.DoubleSide })));
      v.mirror.renderOrder = 18; v.mirror.frustumCulled = false; R.add(v.mirror);
    }
    // 水面 · 落叶：零零散散地漂着，在木梁两头、渠壁跟前积得多（跟着水位走）
    v.floatLeaves = backdrop(CX0, CX1, -7.07, 5.5, 0, 90, g => {
      const rn = seeded(72), put = (x, z) => leaf(g, x, z, 0.05 + rn() * 0.05, rn() * 6.28, LEAFC[Math.floor(rn() * LEAFC.length)]);
      for (let i = 0; i < 70; i++) put(211.9 + rn() ** 1.5 * 0.9, 0.3 + rn() * 0.5 - (rn() < 0.5 ? 0.6 : 0));
      for (let i = 0; i < 40; i++) put(CX0 + 0.05 + rn() ** 2 * 0.35, -0.2 + rn() * 1.2);
      for (let i = 0; i < 60; i++) { const side = rn() < 0.5; put(side ? CX0 + 0.05 + rn() ** 2 * 0.5 : CX1 - 0.05 - rn() ** 2 * 0.5, -6.8 + rn() * 12); }
      for (let i = 0; i < 45; i++) put(CX0 + 0.2 + rn() * 4.8, -6.8 + rn() * 12);
    }, { floor: LOW + 0.02, order: 19 });
    yield;

    // 地上 · 枯草：渠边、闸杆和灯杆脚下、水塘边上一丛丛枯草，草尖被逆光照亮（水塘边的一排衬在亮水面前面是剪影）。
    // 四种草丛画在一张 2×2 的贴图上，所有草丛拼成一个网格，一次画完；从远到近排好，叠在一起时前面的盖住后面的
    {
      const [ac, g] = mkCanvas(384, 288);
      for (let t = 0; t < 4; t++) {
        const rn = seeded(101 + t); g.save(); g.translate((t % 2) * 192, Math.floor(t / 2) * 144); g.beginPath(); g.rect(0, 0, 192, 144); g.clip();
        for (let i = 0; i < 16; i++) {
          const x0 = 96 + (rn() - 0.5) * 70, h = 50 + rn() * 90, lean = (rn() - 0.5) * 90, w = 2.5 + rn() * 3, x1 = x0 + lean, y1 = 144 - h;
          const gr = g.createLinearGradient(0, 144, 0, y1); gr.addColorStop(0, '#141309'); gr.addColorStop(0.55, '#2b2816'); gr.addColorStop(1, '#5d553a');
          g.fillStyle = gr; g.beginPath(); g.moveTo(x0 - w, 144); g.quadraticCurveTo(x0 + lean * 0.3 - w * 0.5, 144 - h * 0.6, x1, y1); g.quadraticCurveTo(x0 + lean * 0.3 + w * 0.5, 144 - h * 0.6, x0 + w, 144); g.closePath(); g.fill();
          if (rn() < 0.45) { g.strokeStyle = 'rgba(238,222,176,.75)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(x1, y1); g.quadraticCurveTo(x0 + lean * 0.75, 144 - h * 0.82, x0 + lean * 0.55 + w * 0.3, 144 - h * 0.6); g.stroke(); }   // 草尖被逆光照亮的一边
        }
        g.restore();
      }
      const rn = seeded(105), quads = [], pos = [], uv = [], idx = [];
      for (let z = -5.8; z < 11.5; z += 0.55 + rn() * 0.5) { quads.push([CX0 - 1.45 + rn() * 0.42, z, 0.35 + rn() * 0.45]); quads.push([CX1 + 1.05 + rn() * 0.42, z + rn() * 0.3, 0.35 + rn() * 0.45]); }   // 两边渠沿外面
      for (const [x, z] of [[LEVER_X - 0.4, -0.3], [LEVER_X + 0.4, -0.2], [LEVER_X - 0.05, -0.95], [CX1 + 3.1, -1.95], [CX1 + 3.7, -2.4]]) quads.push([x, z, 0.4 + rn() * 0.3]);   // 闸杆、灯杆脚下
      const shoreZ = x => -21.6 + 11.85 * Math.sqrt(1 - (1 - clamp((x - 185.8) / 9.2, 0, 1)) ** 2);           // 水塘近岸在哪（和上面水塘那块板的岸线一样：左头是一个弯进去的水湾）
      for (let x = 186; x < 230; x += 0.5 + rn() * 0.7) {                                                        // 水塘边上：顺着岸线长，两头渐渐变稀、变矮
        const p = sstep(186, 194, x) * (1 - sstep(222, 230, x));
        if ((x > CX0 - 1.4 && x < CX1 + 1.4) || rn() > p) continue;
        quads.push([x, shoreZ(x) + 0.45 - rn() * 0.5, (0.8 + rn() * 0.9) * (0.55 + 0.45 * p)]);
      }
      for (let i = 0; i < 16; i++) { const left = rn() < 0.55, x = left ? 199.5 + rn() * 5.5 : 215 + rn() * 4.5, z = -6 + rn() * 9; if (left && x > 204.6 && z > -0.8) continue; quads.push([x, z, 0.3 + rn() * 0.35]); }   // 两岸地上零散的几丛（主角站的地方空着）
      quads.sort((a, b) => a[1] - b[1]).forEach(([x, z, w], i) => {
        const h = w * 0.75, t = Math.floor(rn() * 4), u0 = (t % 2) * 0.5, v0 = t < 2 ? 0.5 : 0, k = i * 4;
        pos.push(x - w / 2, -0.02, z, x + w / 2, -0.02, z, x - w / 2, h - 0.02, z, x + w / 2, h - 0.02, z);
        uv.push(u0, v0, u0 + 0.5, v0, u0, v0 + 0.5, u0 + 0.5, v0 + 0.5); idx.push(k, k + 1, k + 2, k + 2, k + 1, k + 3);
      });
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx);
      const m = add(R, geo, own(new THREE.MeshBasicMaterial({ map: canvasTex(ac), transparent: true, depthWrite: false })), 0, 0, 0, false); m.renderOrder = 12;
    }
    // 地上 · 落叶和小石头：渠沿、水塘边上多，路中间少
    backdrop(198, 221, -9.4, 12.5, 0, 36, g => {
      const rn = seeded(106);
      for (let i = 0; i < 1400; i++) {
        const x = 198 + rn() * 23, z = -9.3 + rn() * 21.7;
        if (x > CX0 && x < CX1) continue;
        const nearEdge = Math.min(Math.abs(x - (CX0 - 1)), Math.abs(x - (CX1 + 1))) < 0.9 || z < -8.4;
        if (!nearEdge && rn() < 0.6) continue;
        leaf(g, x, z, 0.06 + rn() * 0.06, rn() * 6.28, LEAFC[Math.floor(rn() * 4)]);
      }
      for (let i = 0; i < 50; i++) {
        const x = 198 + rn() * 23, z = -9 + rn() * 21, r = 0.04 + rn() * 0.1; if (x > CX0 - 1 && x < CX1 + 1) continue;
        g.fillStyle = 'rgba(18,18,12,.85)'; oval(g, x, z, r, r * 0.7); g.fillStyle = 'rgba(150,145,125,.35)'; oval(g, x - r * 0.2, z - r * 0.25, r * 0.6, r * 0.35);
      }
    }, { floor: 0.012, lit: true, order: -24 });
    // 地上 · 碎光斑：枝叶间漏下来的光落在地上，被树叶的影子切成一块块。先把原来那几团光压暗，再在一个个空隙里把光留下来、提亮一点；
    // 空隙成团成片（几道正弦叠出一张起伏的疏密图），小的多、大的少
    {
      const POOLS = [[X + 86, -0.6, 3.1, 2.4], [CX0 - 5.9, -0.6, 3.1, 2.4], [202.6, -0.4, 1.7, 1.6], [206.3, -0.4, 0.95, 1.4], [214.4, -0.4, 0.8, 1.4], [217.4, -0.4, 1.5, 1.6], [CX1 + 8.4, -0.6, 3.1, 2.4]];   // 地上原来亮的那几块：[x, z, 横半径, 纵半径]
      const nz = (x, z) => Math.sin(x * 1.3 + 1.3) * Math.sin(z * 1.9 + 0.7) + 0.6 * Math.sin(x * 3.1 + z * 2.3 + 2.1) + 0.4 * Math.sin(x * 0.7 - z * 3.7 + 0.4);
      const spots = [], rn = seeded(111);
      for (const [x, z, rx, rz] of POOLS) for (let i = 0, n = Math.round(rx * rz * 60); i < n; i++) {
        const a = rn() * 6.2832, r = Math.sqrt(rn()), sx = x + Math.cos(a) * r * rx, sz = z + Math.sin(a) * r * rz;
        if (nz(sx, sz) < -0.3 + rn() * 1.2) continue;
        const s = 0.04 + 0.3 * Math.pow(rn(), 2.4); spots.push([sx, sz, s * (0.8 + 0.5 * rn()), s * (0.6 + 0.4 * rn()), rn() * 3.14]);
      }
      backdrop(186.5, 225, -3.6, 2.6, 0, 40, g => {
        for (const [x, z, rx, rz] of POOLS) { g.save(); g.translate(x, z); g.scale(rx * 1.15, rz * 1.15); const gr = g.createRadialGradient(0, 0, 0, 0, 0, 1); gr.addColorStop(0, 'rgba(0,0,0,.42)'); gr.addColorStop(0.7, 'rgba(0,0,0,.34)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(-1, -1, 2, 2); g.restore(); }
        g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000';
        for (const [x, z, rx, rz, a] of spots) oval(g, x, z, rx, rz, a);
      }, { floor: 0.016, fog: false, blur: 2, order: -19 });
      backdrop(186.5, 225, -3.6, 2.6, 0, 40, g => { g.fillStyle = 'rgba(255,236,196,.14)'; for (const [x, z, rx, rz, a] of spots) oval(g, x, z, rx * 0.8, rz * 0.8, a); },
        { floor: 0.017, additive: true, fog: false, blur: 2, order: -18 });
    }
    yield;
    yield* groundDetails(R, v, [near9, far22, far40]);                 // 地上的东西（石头、落叶、草、树枝、泥、水洼、小动物）
    V = v;
  }

  function update(dt) {
    const on = standingOn(timber), ox = timber.x;
    if (P.grounded && P.y > -0.1 && (P.x < CX0 || P.x > CX1)) W.bank = P.x < CX0 ? -1 : 1;           // 记下主角最后站在哪边岸上：掉进水渠时送回这边
    if (W.open && W.t < 7) { W.t = Math.min(7, W.t + dt); if (W.t >= 7) fx('ok'); }               // 水位涨七秒
    W.k = W.t / 7; W.level = lerp(LOW, HIGH, sstep(0, 1, W.k) * 0.7 + W.k * 0.3);
    placeTimber();
    if (on) { P.x += timber.x - ox; P.y = timber.y2; }                                             // 站在木梁上：跟着它一起漂
    W.lamp = damp(W.lamp, W.k >= 1 ? 1 : 0, 1.2, dt); farLamp.on = W.lamp;
    const near = sstep(40, 8, Math.abs(P.x - (CX0 + 2.6)));
    AUD.water = near * (W.open ? lerp(1, 0.45, sstep(0.9, 1, W.k)) : 0.12);
    if (W.open) W.flown += dt;
    const v = V; if (!v) return;
    // 闸上的鸟：闸板一动，一只接一只起飞，往斜上方、往林子深处飞，越飞越小，几秒以后就看不见了
    for (const b of v.crows) {
      const t = W.flown - b.wait, m = b.mesh;
      if (t <= 0) { m.visible = true; m.material.map = v.crowTexs[0]; m.position.set(b.x, b.y + 0.281 * b.s, b.z); m.scale.set(b.dir * b.s, b.s, 1); }
      else if (t < 7) {
        const k = b.s * Math.max(0.35, 1 - t * 0.09);
        m.visible = true; m.material.map = v.crowTexs[1 + (Math.floor(t * 9 + b.wait * 30) & 1)];              // 翅膀一上一下
        m.position.set(b.x + b.vx * t, b.y + 0.3 + b.vy * t, b.z + b.vz * t); m.scale.set(b.dir * k, k, 1);
      } else m.visible = false;
    }
    const gk = sstep(0, 0.22, W.k);                                                                // 闸板在头一两秒升起来
    v.gate.position.y = BED + 1.6 + 3.55 * gk; v.winch.rotation.z = gk * 9;
    v.lever.set(W.open ? Math.min(1, W.t * 3.5) : 0);
    v.water.position.y = W.level; v.sheen.position.y = W.level + 0.02;
    v.sheenTex.offset.y -= dt * (W.open ? lerp(0.5, 0.12, W.k) : 0.02);
    const drop = Math.max(0, HIGH - W.level) * gk;
    v.fall.visible = drop > 0.05; v.fall.scale.y = Math.max(0.05, drop + 0.3); v.fall.position.y = W.level + (drop + 0.3) / 2; v.fall.material.opacity = 0.5 * sstep(0, 0.6, drop);
    v.timber.position.set(timber.x, timber.y2 + (W.k > 0.1 ? 0.012 * Math.sin(T * 1.7) : 0), 0); v.timber.rotation.z = W.k > 0.1 ? 0.012 * Math.sin(T * 1.1) : -0.03;
    v.farGlow.material.opacity = 0.9 * W.lamp; v.farLens.material.color.setHex(W.lamp > 0.5 ? 0xe8f6ff : 0x2c3a40); v.nearGlow.material.opacity = 0.5 * W.lamp;

    // 第三步的细节：闸板一动，漏水就停了；水面上的白沫、落叶跟着水位走；近处水里那片亮光的倒影按镜头和水位重新摆
    const leak = 1 - sstep(0, 0.04, W.k);
    for (const o of [v.jets, v.mist, v.foam]) { o.visible = leak > 0.01; o.material.opacity = leak; }
    v.flowTex.offset.y += dt * 1.4;
    v.foam.position.y = W.level + 0.035; v.floatLeaves.position.y = W.level + 0.02;
    placeMirror(v);
    v.life.step(dt);                                                                               // 地上会动的那些：落叶、水洼、小动物
  }
  // 闸门里那片亮光在近处水面上的倒影，照镜子的道理：把亮着的那一段（闸板上沿到横梁底；闸板升起来以后是水面到闸板下沿，哪段大用哪段）
  // 按水面翻到水下，从镜头看过去，视线穿过水面的地方就是倒影落的地方。四个角各算一次；镜头偏左，倒影也就偏左、比闸门窄
  function placeMirror(v) {
    const C = camera.position, L = W.level, top = v.gate.position.y + 1.6, bot = v.gate.position.y - 1.6;
    const up = top < 3.6 ? 3.6 - Math.max(top, L) : 0, low = bot > L ? Math.min(bot, 3.6) - L : 0;
    const [yA, yB] = up >= low ? [Math.max(top, L), 3.6] : [L, Math.min(bot, 3.6)], m = v.mirror;
    m.visible = yB - yA > 0.05 && C.y > L + 0.5; if (!m.visible) return;
    const zg = v.gz + 0.3, p = m.geometry.attributes.position;
    [[CX0 + 0.2, yA], [CX1 - 0.2, yA], [CX0 + 0.2, yB], [CX1 - 0.2, yB]].forEach(([xo, yo], i) => {
      const t = (C.y - L) / (C.y - (2 * L - yo));
      p.setXYZ(i, clamp(C.x + t * (xo - C.x), CX0 + 0.02, CX1 - 0.02), L + 0.012, Math.min(13.9, C.z + t * (zg - C.z)));
    });
    p.needsUpdate = true;
  }
  function reset() { Object.assign(W, { open: false, t: 0, k: 0, level: LOW, lamp: 0, flown: 0, bank: -1 }); placeTimber(); if (V) V.life.reset(); }
  function solve() { Object.assign(W, { open: true, t: 7, k: 1, level: HIGH, lamp: 1, flown: 99, bank: 1 }); placeTimber(); }
  // 卸载：乌鸦的三张姿势是轮流换到材质上的，卸载时材质上只挂着其中一张（跟着材质一起释放），另外两张要在这里释放
  return defZone({ n: 2, vis: [X, X3 + 4], build, update, reset, solve, unbuild() { if (V) for (const t of V.crowTexs) t.dispose(); V = null; }, W, timber, view: () => V });
})();
