
// ============================================================
//  小孩（K）：照 INSIDE 那一类角色的“做法”搭的人形 —— 造型是我们自己的，不是那个游戏里的男孩
//  做法只有四条：真实的儿童比例；没有脸；几块平涂的颜色；身体是一整张连续的表面
//  （手肘、膝盖弯起来没有球、没有缝：靠蒙皮 —— 每个顶点记着自己跟哪几根骨头走、各占几成）
//  骨架的节点和其他外形一模一样，所以走 / 跑 / 跳 / 推 / 爬的动画直接沿用
//  造型按定稿草图（generated_images/concept-inside-style-10.png）来：4 号“乱发”、6 号“连帽衫”、长裤靴子、手露在外面、
//  连帽衫是米白色、不带灯。之前试过的“短裤光腿”和另外三种颜色还留着，按 X / C 可以切换着看
// ============================================================

// 连帽衫的颜色定的是米白（按 C 还能轮换着看别的）；除此之外全身只有肤色、深色的头发、深色的裤子和靴子
const KID_TINTS = [[0x466a98, '工装蓝'], [0x6b8f58, '嫩芽绿'], [0xcfc8b8, '米白'], [0x2c3236, '深灰']];
const KID_LEGS = ['长裤靴子', '短裤光腿'];
let kidTint = 2, kidLegs = 0;                                              // 定稿：米白、长裤靴子
const KID_HEAD = 1.18;                                                     // 头比真实比例大一圈：定稿草图是四个头高，远看才认得出人

// 一张表面：往里加一片片网格，最后一次生成几何体。坐标都以身高为单位，scale 是身高
function kidSurf(scale) {
  const pos = [], col = [], bi = [], bw = [], tris = [];
  let skinned = false;
  const vert = (p, bones) => {
    pos.push(p[0] * scale, p[1] * scale, p[2] * scale); const s = p[3] ?? 1; col.push(s, s, s);
    let sum = 0; if (bones) { skinned = true; for (const b of bones) sum += b[1]; }
    for (let i = 0; i < 4; i++) { const b = bones && bones[i]; bi.push(b ? b[0] : 0); bw.push(b ? b[1] / sum : 0); }
    return pos.length / 3 - 1;
  };
  // 一片网格：rows 圈、每圈 n 个点，pt(i, k) 返回第 i 圈第 k 个点 [x, y, z, 明暗]；o.bones(i, k) 给出这个点跟哪些骨头走。
  // 面朝哪边由走向决定：圈从上往下排、每圈从 +x 转向 +z，面就朝外。o.top / o.bot 用一个点把两头封上
  function grid(rows, n, pt, o = {}) {
    const base = pos.length / 3, bones = (i, k) => typeof o.bones === 'function' ? o.bones(i, k) : o.bones;
    for (let i = 0; i < rows; i++) for (let k = 0; k < n; k++) vert(pt(i, k), bones(i, k));
    for (let i = 0; i < rows - 1; i++) for (let k = 0; k < n; k++) {
      const a = base + i * n + k, b = base + i * n + (k + 1) % n, c = a + n, d = b + n;
      tris.push(a, b, d, a, d, c);
    }
    if (o.top) { const t = vert(o.top, bones(0, 0)); for (let k = 0; k < n; k++) tris.push(t, base + (k + 1) % n, base + k); }
    if (o.bot) { const t = vert(o.bot, bones(rows - 1, 0)), r = base + (rows - 1) * n; for (let k = 0; k < n; k++) tris.push(t, r + k, r + (k + 1) % n); }
  }
  // 一只球（可以被 fn 捏成别的形状）：fn(从头顶往下的角度, 绕竖轴的角度) 返回 [x, y, z, 明暗]
  function ball(rows, n, fn, bones) {
    grid(rows, n, (i, k) => fn(Math.PI * (i + 1) / (rows + 1), 6.2832 * k / n), { top: fn(0, 0), bot: fn(Math.PI, 0), bones });
  }
  function geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    if (skinned) { g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(bi, 4)); g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(bw, 4)); }
    g.setIndex(tris); g.computeVertexNormals(); return g;
  }
  return { grid, ball, geometry };
}

// keys 每行 [s, 值, 值, …]（s 递增）；返回 s 处各列的平滑插值
function kidSpline(keys, s) {
  let i = 0; while (i < keys.length - 2 && s > keys[i + 1][0]) i++;
  const k0 = keys[Math.max(i - 1, 0)], k1 = keys[i], k2 = keys[i + 1], k3 = keys[Math.min(i + 2, keys.length - 1)];
  const h = k2[0] - k1[0], t = clamp((s - k1[0]) / h, 0, 1), t2 = t * t, t3 = t2 * t, out = [];
  for (let j = 1; j < k1.length; j++) {
    const m1 = (k2[j] - k0[j]) / (k2[0] - k0[0]) * h, m2 = (k3[j] - k1[j]) / (k3[0] - k1[0]) * h;
    out.push((2 * t3 - 3 * t2 + 1) * k1[j] + (t3 - 2 * t2 + t) * m1 + (3 * t2 - 2 * t3) * k2[j] + (t3 - t2) * m2);
  }
  return out;
}

// 竖着的一根管子（袖子、裤腿、躯干都是它）。keys 每行 [s, cx, f, b, w, 倾斜]：
//   s 从 o.y 往下量；cx 这一圈的中心前后偏多少；f / b 朝前、朝后的半径；w 左右的半宽；倾斜（可以不写）= 前面抬高多少、后面压低多少
// o: x y z 起点 / rows 加密成多少圈 / n 每圈几个点 / bones(s, 朝前的程度, 朝右的程度) 这个点跟哪些骨头走 / shade(s) 明暗
//    rim、hem: [缩进比例, 深度, 里圈的比例] —— 上口、下口向里翻一道边，看得出布料的厚度
function kidTube(S, keys, o) {
  const s0 = keys[0][0], s1 = keys[keys.length - 1][0], rows = o.rows ?? 24, n = o.n ?? 20, R = [];
  for (let i = 0; i < rows; i++) {
    const s = lerp(s0, s1, i / (rows - 1)), [cx, f, b, w, ty = 0] = kidSpline(keys, s);
    R.push({ s, cx, f: Math.max(f, 0), b: Math.max(b, 0), w: Math.max(w, 0), ty, sh: o.shade ? o.shade(s) : 1 });
  }
  const lip = (r, [k, d, k2 = k * 0.96], dir) => [{ ...r, f: r.f * k, b: r.b * k, w: r.w * k, sh: 0.5 }, { ...r, s: r.s + dir * d, f: r.f * k2, b: r.b * k2, w: r.w * k2, sh: 0.3 }];
  if (o.rim) R.unshift(...lip(R[0], o.rim, 1).reverse());                 // 上口：先在里面往上走，翻过口沿再往下
  if (o.hem) R.push(...lip(R[R.length - 1], o.hem, -1));                  // 下口：走到底以后翻进去往上
  S.grid(R.length, n, (i, k) => {
    const r = R[i], a = 6.2832 * k / n, ca = Math.cos(a), sa = Math.sin(a);
    return [(o.x ?? 0) + r.cx + (ca > 0 ? r.f : r.b) * ca, (o.y ?? 0) - r.s + r.ty * ca, (o.z ?? 0) + r.w * sa, r.sh];
  }, { bones: (i, k) => o.bones(R[i].s, Math.cos(6.2832 * k / n), Math.sin(6.2832 * k / n)) });
}

function buildKid() {
  const S = SKINS.K, u = S.H, shorts = kidLegs === 1;
  // 比例：头连头发约占身高的五分之一，髋在一半略低，手垂到大腿中段。站直时膝盖几乎是直的
  const D = { thigh: 0.218 * u, shin: 0.218 * u, uarm: 0.165 * u, farm: 0.15 * u, ankle: 0.05 * u, hipY: 0.494 * u, hipZ: 0.05 * u, shY: 0.263 * u, shZ: 0.098 * u };
  const root = new THREE.Group(), pelvis = grp(root, 0, D.hipY, 0), spine = grp(pelvis), chest = grp(spine, 0, D.shY, 0), head = grp(chest, 0.004 * u, 0.038 * u, 0);
  head.scale.setScalar(KID_HEAD);
  const arms = [0, 1].map(i => { const sh = grp(chest, 0, -0.012 * u, (i ? -1 : 1) * D.shZ), el = grp(sh, 0, -D.uarm, 0); return { sh, el }; });
  const legs = [0, 1].map(i => { const hip = grp(pelvis, 0, -0.005 * u, (i ? -1 : 1) * D.hipZ), knee = grp(hip, 0, -D.thigh, 0), foot = grp(knee, 0, -D.shin, 0); return { hip, knee, foot }; });
  // 骨头的编号（顶点的权重里用）
  const bones = [pelvis, spine, chest, head, arms[0].sh, arms[0].el, arms[1].sh, arms[1].el, legs[0].hip, legs[0].knee, legs[0].foot, legs[1].hip, legs[1].knee, legs[1].foot];
  const SPINE = 1, CHEST = 2, HEAD = 3, SH = i => 4 + i * 2, EL = i => 5 + i * 2, HIP = i => 8 + i * 3, KNEE = i => 9 + i * 3, FOOT = i => 10 + i * 3;
  const mix = (a, b, t) => t <= 0 ? [[a, 1]] : t >= 1 ? [[b, 1]] : [[a, 1 - t], [b, t]];   // 关节附近：两根骨头各占一部分
  // 各个关节在“绑定姿势”（站直、手臂垂着）里的高度，以身高为单位
  const PY = 0.494, HJ = PY - 0.005, AY = HJ - 0.436, CY = PY + 0.263, SY = CY - 0.012, NY = CY + 0.038;

  // 颜色都带一点自发光：场景再暗，身体也不会掉成一团黑；褶皱里的暗处写在顶点色里，自发光也跟着暗下去
  const paint = (c, e = 0.2) => {
    const m = lam(c, { emissive: c, emissiveIntensity: e, vertexColors: true });
    m.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n\ttotalEmissiveRadiance *= vColor.rgb;'); };
    return m;
  };
  const M = { skin: paint(0xd8c2b3), hair: paint(0x2e2825, 0.13), top: paint(KID_TINTS[kidTint][0]), bottom: paint(0x282e34, 0.18), boot: paint(0x3a413d, 0.16) };
  const rigid = (parent, S_, mat, x = 0, y = 0, z = 0) => add(parent, S_.geometry(), mat, x * u, y * u, z * u);

  // ---- 蒙皮的部分：连帽衫（躯干 + 口袋 + 两只袖子）、皮肤（脖子，短裤时还有两条腿）、裤子、靴筒 ----
  const top = kidSurf(u), skin = kidSurf(u), bottom = kidSurf(u), boot = kidSurf(u);
  // 连帽衫各处跟着谁动：肩膀跟胸，往下跟腰；下摆有一半跟着同一侧的大腿 —— 迈腿时衣角被顶起来，而不是让腿从布里穿出去
  const hoodie = (s, ca, sa) => {
    const k = 0.5 * sstep(0.205, 0.341, s), r = sstep(-0.35, 0.35, sa);
    return k > 0 ? [[SPINE, 1 - k], [HIP(0), k * r], [HIP(1), k * (1 - r)]] : mix(CHEST, SPINE, sstep(0.045, 0.195, s));
  };
  // 躯干：大一号，直直地垂到胯下，站姿带一点 S 形（挺着肚子、后腰收进去），下摆收一道边
  kidTube(top, [[0, -0.004, 0.036, 0.04, 0.04, -0.006], [0.012, -0.004, 0.044, 0.05, 0.066, -0.003], [0.029, -0.001, 0.058, 0.066, 0.116, 0], [0.049, 0, 0.064, 0.072, 0.118, 0],
    [0.089, 0.001, 0.067, 0.073, 0.104, 0], [0.155, 0.004, 0.068, 0.068, 0.098, 0], [0.225, 0.006, 0.07, 0.064, 0.098, 0], [0.295, 0.004, 0.071, 0.072, 0.102, 0],
    [0.327, 0.003, 0.071, 0.075, 0.104, 0], [0.341, 0.002, 0.066, 0.07, 0.098, 0]],
    { y: NY + 0.002, rows: 38, n: 28, rim: [0.84, 0.012], hem: [0.93, 0.004, 0.5], bones: hoodie });
  // 肚子前面的口袋：一块略微鼓出来、颜色深一点的圆角方块，跟着它底下的那片布一起动
  top.ball(8, 16, (th, ph) => {
    const st = Math.sin(th), ct = Math.cos(th), q = st * Math.sin(ph);
    return [0.07 + 0.012 * st * Math.cos(ph), NY - 0.25 + 0.03 * Math.sign(ct) * Math.pow(Math.abs(ct), 0.6), 0.052 * Math.sign(q) * Math.pow(Math.abs(q), 0.6), 0.84];
  }, hoodie(0.252, 1, 0));
  for (const i of [0, 1]) {
    const z = (i ? -1 : 1) * 0.098, lz = (i ? -1 : 1) * 0.05, knee = s => mix(HIP(i), KNEE(i), sstep(0.18, 0.256, s));
    // 袖子：肩头是一个以肩关节为中心的圆顶（手臂怎么甩，肩膀的轮廓都不变），袖口收一道边，手露在外面
    kidTube(top, [[-0.035, 0, 0, 0, 0], [-0.031, 0, 0.015, 0.015, 0.015], [-0.022, 0, 0.026, 0.026, 0.026], [-0.008, 0, 0.033, 0.033, 0.033], [0.012, 0, 0.035, 0.036, 0.035],
      [0.06, 0, 0.034, 0.035, 0.034], [0.12, 0, 0.032, 0.034, 0.032], [0.165, 0, 0.031, 0.033, 0.031], [0.23, 0, 0.031, 0.033, 0.031], [0.285, 0, 0.032, 0.034, 0.032], [0.305, 0, 0.031, 0.032, 0.031], [0.318, 0, 0.027, 0.028, 0.027]],
      { y: SY, z, rows: 30, n: 18, bones: s => mix(SH(i), EL(i), sstep(0.13, 0.2, s)), hem: [0.84, 0.016] });
    if (shorts) {
      // 光着的腿：细，小腿肚朝后鼓一点；短裤底下和靴口里各压一道影子
      kidTube(skin, [[0.095, 0, 0.039, 0.043, 0.039], [0.14, 0.002, 0.036, 0.039, 0.036], [0.2, 0.004, 0.033, 0.033, 0.033], [0.218, 0.005, 0.032, 0.031, 0.032],
        [0.25, 0.003, 0.028, 0.033, 0.031], [0.3, 0, 0.026, 0.037, 0.032], [0.36, -0.001, 0.023, 0.03, 0.027], [0.41, 0, 0.021, 0.024, 0.022], [0.445, 0, 0.02, 0.022, 0.02]],
        { y: HJ, z: lz, rows: 36, n: 16, bones: knee, shade: s => lerp(0.5, 1, sstep(0.105, 0.165, s)) * lerp(1, 0.6, sstep(0.3, 0.335, s)) });
    } else {
      // 长裤：直筒，裤脚塞进靴筒里
      kidTube(bottom, [[0.095, 0, 0.046, 0.05, 0.046], [0.14, 0.002, 0.043, 0.046, 0.043], [0.2, 0.004, 0.039, 0.04, 0.039], [0.218, 0.005, 0.038, 0.038, 0.038], [0.25, 0.003, 0.035, 0.039, 0.037],
        [0.3, 0, 0.033, 0.04, 0.037], [0.36, -0.001, 0.031, 0.035, 0.033], [0.41, 0, 0.03, 0.031, 0.03], [0.445, 0, 0.03, 0.031, 0.03]],
        { y: HJ, z: lz, rows: 36, n: 16, bones: knee, shade: s => lerp(1, 0.6, sstep(0.3, 0.335, s)) });
    }
    // 裤腰到大腿的一截：腰那里跟着身体，往下才跟着大腿（和连帽衫的下摆一起动，两层布不会互相穿出来）。
    // 短裤到膝盖上面收一道边；长裤在这里和裤腿接平
    kidTube(bottom, [[-0.036, 0, 0, 0, 0], [-0.031, 0, 0.022, 0.025, 0.02], [-0.016, 0, 0.04, 0.044, 0.037], [0.01, 0, 0.048, 0.052, 0.044], [0.05, 0, 0.052, 0.056, 0.046],
      ...(shorts ? [[0.11, 0.001, 0.054, 0.056, 0.0465], [0.125, 0.001, 0.0545, 0.056, 0.047]] : [[0.1, 0.001, 0.0485, 0.052, 0.046], [0.125, 0.001, 0.045, 0.0485, 0.044]])],
      { y: HJ, z: lz * 0.92, rows: 18, n: 20, bones: s => mix(SPINE, HIP(i), sstep(-0.03, 0.1, s)), hem: shorts ? [0.86, 0.014] : null });
    // 靴筒：比小腿粗一圈，看得见靴口和腿之间的空隙；脚踝那一段跟着脚一起弯
    kidTube(boot, [[0, -0.002, 0.037, 0.041, 0.037], [0.027, -0.002, 0.036, 0.04, 0.036], [0.072, 0, 0.034, 0.037, 0.034], [0.112, 0.002, 0.034, 0.036, 0.033], [0.142, 0.004, 0.033, 0.033, 0.032]],
      { y: AY + 0.112, z: lz, rows: 14, n: 28, bones: s => mix(KNEE(i), FOOT(i), sstep(0.075, 0.13, s)), rim: [0.84, 0.022] });
  }
  // 脖子：上半截跟着头，下半截跟着肩膀
  kidTube(skin, [[0, 0.008, 0.03, 0.03, 0.03], [0.02, 0.005, 0.0295, 0.0295, 0.0295], [0.04, 0.001, 0.03, 0.0305, 0.031], [0.062, -0.003, 0.031, 0.032, 0.033]],
    { y: NY + 0.035, rows: 8, n: 16, bones: s => mix(HEAD, CHEST, sstep(0.012, 0.04, s)), shade: s => lerp(0.62, 0.84, sstep(0, 0.022, s)) * lerp(1, 0.6, sstep(0.034, 0.05, s)) });

  root.updateMatrixWorld(true);                                             // 骨头此刻的位置就是“绑定姿势”
  const skeleton = new THREE.Skeleton(bones);
  for (const [S_, mat] of [[top, M.top], [skin, M.skin], [bottom, M.bottom], [boot, M.boot]]) {
    const m = new THREE.SkinnedMesh(S_.geometry(), mat); m.castShadow = m.receiveShadow = true; m.frustumCulled = false;
    root.add(m); m.bind(skeleton);
  }

  // ---- 硬的部分：直接挂在骨头上 ----
  // 帽子：绕着脖子的一圈帽口（前面细、后面粗、前低后高），加上摊在后背上的一团帽兜
  const cowl = kidSurf(u), CN = 30, CM = 12;
  cowl.grid(CN + 1, CM, (i, k) => {
    const a = Math.PI + 6.2832 * i / CN, b = 6.2832 * k / CM, ca = Math.cos(a), sa = Math.sin(a), back = (1 - ca) / 2;
    const r = lerp(0.011, 0.026, back * back), out = r * Math.cos(b);
    return [-0.008 + (0.045 + out) * ca, lerp(0.039, 0.05, back) + r * Math.sin(b), (0.05 + out) * sa];
  });
  rigid(chest, cowl, M.top);
  const hood = kidSurf(u); hood.ball(10, 18, (th, ph) => [0.03 * Math.sin(th) * Math.cos(ph), 0.05 * Math.cos(th), 0.072 * Math.sin(th) * Math.sin(ph)]);
  rigid(chest, hood, M.top, -0.066, -0.004, 0).rotation.z = -0.24;
  // 头：一只前后略长的蛋，下半截收窄成下巴 —— 不画眼睛和嘴，只在眼窝的位置压一点很淡的影子
  const HC = [0.02, 0.11];                                                  // 头的中心（相对脖子上的转轴）
  const egg = (th, ph, grow = 0) => {
    const st = Math.sin(th), ct = Math.cos(th), cp = Math.cos(ph), sp = Math.sin(ph);
    let x = (0.084 + grow) * st * cp, y = (0.0936 + grow) * ct, z = (0.0707 + grow) * st * sp;
    if (ct < 0) { const t = -ct; y *= 0.92; z *= 1 - 0.2 * Math.pow(t, 1.6); x *= cp > 0 ? 1 - 0.06 * t * t : 1 - 0.36 * t; }
    return [x + HC[0], y + HC[1], z];
  };
  const wrap = ph => Math.atan2(Math.sin(ph), Math.cos(ph)), tri = x => Math.abs((x % 1 + 1) % 1 - 0.5) * 2;   // tri：0…1 的三角波
  // 发际线：前额是几个参差的尖角，两鬓停在耳朵上方，后面盖到后颈
  const fringe = ph => { const w = wrap(ph), a = Math.abs(w); return 1.2 + 0.2 * tri(w / 0.6 + 0.2) * sstep(1.05, 0.55, a) + 0.38 * sstep(0.6, 1.2, a) + 0.3 * sstep(1.7, 2.9, a); };
  const bump = (a, th, amp, a0, th0, sth) => amp * Math.exp(-((a / a0) ** 2) - ((th - th0) / sth) ** 2);
  const face = kidSurf(u);
  face.ball(64, 48, (th, ph) => {
    const p = egg(th, ph), a = wrap(ph);
    // 只在侧面的剪影里看得出来的起伏：鼻子、嘴的位置上一点点、下巴。正面看仍然是一张空白的脸
    const jaw = bump(a, th, 0.009, 0.55, 2.4, 0.2);
    p[0] += bump(a, th, 0.012, 0.2, 1.8, 0.12) + bump(a, th, 0.003, 0.22, 2.1, 0.1) + jaw * 0.8; p[1] -= jaw * 0.45;
    p[3] = lerp(0.72, 1, sstep(-0.05, 0.3, th - fringe(ph))) * (1 - bump(Math.abs(a) - 0.4, th, 0.13, 0.17, 1.62, 0.09));   // 刘海底下的影子 × 两个眼窝
    return p;
  });
  rigid(head, face, M.skin);
  // 头发（4 号“乱发”）：一层贴着头皮的短发，上面支着十来撮往后翘的尖
  const hair = kidSurf(u), HR = 12, HN = 64;
  hair.grid(HR + 3, HN, (i, k) => {
    const ph = 6.2832 * k / HN, t = Math.min(i, HR) / HR, grow = i <= HR ? 0.01 + 0.004 * t : i === HR + 1 ? 0.005 : -0.003;   // 最后两圈：从发梢翻回到头皮上
    const p = egg(Math.max(fringe(ph) * t - (i > HR ? 0.04 * (i - HR) : 0), 0.001), ph, grow);
    p[3] = i <= HR ? 1 : i === HR + 1 ? 0.6 : 0.35;
    return p;
  }, { top: egg(0, 0, 0.01) });
  const TUFTS = [[0.1, 0.3, 0.04, 0.034], [0.5, 0.45, 0.04, 0.03], [0.48, -0.8, 0.038, 0.03], [0.55, 1.9, 0.044, 0.034], [0.52, -2.1, 0.046, 0.034], [0.6, 3.14, 0.05, 0.036],
    [0.95, 1.3, 0.036, 0.03], [0.98, -1.4, 0.036, 0.03], [1.05, 2.5, 0.044, 0.033], [1.08, -2.6, 0.042, 0.033], [1.4, 3.3, 0.036, 0.03]];   // 每一撮：[从头顶往下的角度, 绕竖轴的角度, 长, 根部半径]
  for (const [th, ph, len, r0] of TUFTS) {
    const c = egg(th, ph, 0.004), ax = V3(c[0] - HC[0], c[1] - HC[1] - 0.01, c[2]).normalize().add(V3(-0.28, 0.12, 0)).normalize();   // 从头皮往外长，再整体往后上方偏一点
    const e1 = V3().crossVectors(ax, Math.abs(ax.y) > 0.9 ? V3(1, 0, 0) : V3(0, 1, 0)).normalize(), e2 = V3().crossVectors(ax, e1), TR = 6, TN = 10;
    const at = t => [c[0] + ax.x * len * t - 0.014 * t * t, c[1] + ax.y * len * t - 0.004 * t * t, c[2] + ax.z * len * t];              // 尖儿略微往后弯
    hair.grid(TR, TN, (i, k) => {
      const t = i / TR, r = r0 * Math.pow(1 - t, 0.85), a = 6.2832 * k / TN, o = at(t), p = Math.cos(a) * r, q = Math.sin(a) * r;
      return [o[0] + e1.x * p + e2.x * q, o[1] + e1.y * p + e2.y * q, o[2] + e1.z * p + e2.z * q];
    }, { bot: at(1) });
  }
  rigid(head, hair, M.hair);
  for (const side of [1, -1]) {                                             // 耳朵
    const ear = kidSurf(u); ear.ball(6, 10, (th, ph) => [0.009 * Math.sin(th) * Math.cos(ph), 0.018 * Math.cos(th), 0.006 * Math.sin(th) * Math.sin(ph), 0.9]);
    rigid(head, ear, M.skin, HC[0] - 0.012, HC[1] - 0.024, side * 0.066).rotation.z = 0.2;
  }
  // 胯：两条裤腿中间的那一块
  const hips = kidSurf(u); hips.ball(10, 18, (th, ph) => [0.054 * Math.sin(th) * Math.cos(ph), 0.055 * Math.cos(th), 0.082 * Math.sin(th) * Math.sin(ph)]);
  rigid(pelvis, hips, M.bottom, 0, -0.014, 0);
  for (const i of [0, 1]) {
    // 手：没有手指，一只小小的连指手套形，外加一个拇指
    const hand = kidSurf(u);
    hand.ball(8, 12, (th, ph) => [0.025 * Math.sin(th) * Math.cos(ph), 0.04 * Math.cos(th), 0.014 * Math.sin(th) * Math.sin(ph)]);
    hand.ball(5, 8, (th, ph) => [0.024 + 0.009 * Math.sin(th) * Math.cos(ph), 0.008 + 0.017 * Math.cos(th), 0.009 * Math.sin(th) * Math.sin(ph)]);
    rigid(arms[i].el, hand, M.skin, 0.002, -0.15 - 0.034, 0);
    // 靴子的脚：从脚跟到脚尖一圈圈摆过去，底是平的
    const FK = [[-0.05, -0.02, 0.01, 0.01, 0.012], [-0.044, -0.017, 0.026, 0.026, 0.025], [-0.024, -0.012, 0.042, 0.037, 0.034], [0, -0.01, 0.046, 0.0395, 0.036], [0.019, -0.016, 0.04, 0.0335, 0.037],
      [0.041, -0.024, 0.03, 0.0255, 0.039], [0.067, -0.03, 0.024, 0.0195, 0.04], [0.088, -0.033, 0.021, 0.0165, 0.037], [0.103, -0.036, 0.016, 0.0135, 0.028], [0.111, -0.039, 0.009, 0.0105, 0.014]];
    const shoe = kidSurf(u), FR = 34;
    shoe.grid(FR, 28, (r, k) => {
      const x = lerp(-0.05, 0.111, r / (FR - 1)), [yc, ht, hb, w] = kidSpline(FK, x), a = 6.2832 * k / 28, ca = Math.cos(a), sa = Math.sin(a);
      return [x, Math.max(yc + (ca > 0 ? ht * ca : -hb * Math.pow(-ca, 0.6)), -0.05), w * Math.sign(sa) * Math.pow(Math.abs(sa), 0.85)];
    }, { top: [-0.053, -0.02, 0], bot: [0.114, -0.04, 0] });
    rigid(legs[i].foot, shoe, M.boot);
  }

  const tint = (k = (kidTint + 1) % KID_TINTS.length) => { kidTint = k; M.top.color.setHex(KID_TINTS[k][0]); M.top.emissive.setHex(KID_TINTS[k][0]); return KID_TINTS[k][1]; };
  return { S, u, D, M, root, pelvis, spine, chest, head, tail: null, arms, legs, tint };
}
