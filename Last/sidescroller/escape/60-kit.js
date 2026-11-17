
// ============================================================
//  《逃出工厂》灰模：几章共用的东西
//  故事见 design/environmental-escape-story.md。原来是七章加结尾，第一章“焚化炉”2026-11-15 删掉了，2026-11-16 在大门后面加了一章“雾”，现在七章加结尾是游戏的第 1–8 章，
//  后面接旧原型的十四章（第 9–22 章，见 20-world.js 的 OLD）。这一组文件的文件名、注释里的“第几章”还是故事文档里原来的编号。
//  画面是灰模：先看故事的顺序、每一章的规矩走不走得通，造型都还没定。
//  这个文件里：整段的位置、页面上的字、主角的衣服、路上的人（“小人”）、推车 / 铁栏杆 / 卡车、手电和探照灯、厂房的墙和远景、几样声音
// ============================================================
// 整段放在哪：旧原型的十三章从 x = -60 起往右排，这几章挪到它们左边，中间空出一千来米。各章的原点都从 EX 算起
// （删掉的焚化炉原来在 EX - 60 到 EX + 80，那一段现在空着：分拣从 EX + 80 开始，位置没动）
const EX = -1038;                                    // 2026-11-17 从 -2000 挪到这里：结尾的坡顶往右接一段下山的路（src/69-zz-links.js 第 8 → 9 章），正好走到旧原型工厂（第 9 章）左墙的门口
const ex = x => x - EX;                                    // 换回挪过来之前的 x：照 x 算的花样（远山的山脊线、地上的波纹）用它，整段挪了位置，样子还是原来的
// 关卡那一套随机数（10-core.js 的 _seed）走到哪了：这几章载入时会用掉一些，载完在 69-e9-ending.js 里拨回来，旧原型的章节载入时拿到的随机数和原来一样
const ESC_SEED = _seed;
document.title = '逃出工厂 · 故事灰模';
{ const t = $('title');                                   // 结局画面上的字写在结尾那一章（69-e9-ending.js 的 end）
  t.querySelector('h1').textContent = '逃出工厂'; t.querySelector('.sub').textContent = '故事灰模 · 三十六章（第 9 章起是旧原型、试验关和工厂深处）';
  t.querySelector('.keys').innerHTML = '<b>←</b><b>→</b> 或 <b>A</b><b>D</b> 移动　　<b>空格</b> 跳跃 / 攀爬　　按住 <b>E</b> 推拉　·　按 <b>E</b> 操作　　按住 <b>Shift</b> 慢走<br>' +
    '<b>Esc</b> 选择章节　　<b>R</b> 回到存档点　　<b>V</b> 近看主角　　<b>M</b> 打开声音　　<b>C</b> 换主角衣服的颜色'; }
// 跨章节要记住的事：own 主角自己的衣服是哪一种颜色（按 C 换）/ freed 第七章拉开了囚车的锁扣
Object.assign(STORY0, { own: 0, freed: false }); Object.assign(STORY, { own: 0, freed: false });

// ---- 主角的衣服 ----
// 自己的衣服：一车白色里唯一的颜色。定哪一种还没定（故事文档第九节第 4 条），先用蓝的，按 C 可以换着看。
// 第四章在工服推车上套上灰色工服（WEAR.want = 1），第五章末脱掉
const HERO_OWN = [[0x3d6fa8, '蓝'], [0xb0452e, '砖红'], [0xc79a3a, '土黄'], [0x5d8a57, '绿']];
const GRAY_TOP = new THREE.Color(0x767c7b);
const WEAR = { want: 0, k: 0 };

// ============================================================
//  路上的人：全是“小人”—— 比例照 40-character-build.js 的大人，但每种零件（躯干、上臂、小腿……）只有一个网格、
//  所有人共用（InstancedMesh）：一章里几十个人，一共只多十来次绘制。姿势每帧现算，只在侧视平面里转
//  身份靠衣服的颜色认（故事文档第三节）：灰色工服 / 白色内衣 / 各色的衣服 / 深色制服和兜帽
// ============================================================
const FG = { hipY: 0.518, thigh: 0.235, shin: 0.235, ankle: 0.04, shY: 0.275, shZ: 0.112, hipZ: 0.058, uarm: 0.158, farm: 0.158 };
function geoJoin(...gs) {                                 // 把几块几何体并成一块（只留位置和法线）
  const P = [], N = [];
  for (const g0 of gs) { const g = g0.index ? g0.toNonIndexed() : g0; for (const v of g.attributes.position.array) P.push(v); for (const v of g.attributes.normal.array) N.push(v); if (g !== g0) g.dispose(); g0.dispose(); }
  const o = new THREE.BufferGeometry(); o.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); o.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); return o;
}
let FIG_GEO = null, FIG_MAT = null;
function figKit() {
  if (FIG_GEO) return FIG_GEO;
  const S = (r, w = 8, h = 6) => new THREE.SphereGeometry(r, w, h), C = (rt, rb, len, seg = 8) => new THREE.CylinderGeometry(rt, rb, len, seg);
  const at = (g, x, y, z = 0, sx = 1, sy = 1, sz = 1, rz = 0) => { if (rz) g.rotateZ(rz); g.scale(sx, sy, sz); g.translate(x, y, z); return g; };
  const HK = 0.76;                                        // 大人的头按比例缩小
  FIG_GEO = {
    torso: at(new THREE.CapsuleGeometry(0.082, 0.17, 4, 10), 0, 0.142, 0, 0.8, 1, 1.2),
    pelvis: at(S(0.086, 10, 8), 0, 0.005, 0, 0.86, 0.72, 1.14),
    head: geoJoin(at(C(0.027, 0.03, 0.07), 0, -0.012), at(S(0.108 * HK, 12, 9), 0.004, 0.105 * HK, 0, 1, 1.08, 0.94)),
    hair: at(new THREE.SphereGeometry(0.117 * HK, 12, 7, 0, 6.2832, 0, Math.PI * 0.58), 0.004, 0.105 * HK, 0, 1.02, 1.08, 0.98, 1.12),
    uarm: geoJoin(S(0.031), at(C(0.029, 0.025, FG.uarm), 0, -FG.uarm / 2)),
    farm: geoJoin(S(0.027), at(C(0.026, 0.021, FG.farm), 0, -FG.farm / 2)),
    hand: at(S(0.027), 0, -FG.farm - 0.01),
    thigh: geoJoin(S(0.05), at(C(0.05, 0.043, FG.thigh), 0, -FG.thigh / 2)),
    shin: geoJoin(S(0.043), at(C(0.043, 0.037, FG.shin), 0, -FG.shin / 2)),
    shoe: at(S(0.046), 0.03, -FG.ankle + 0.029, 0, 1.6, 0.63, 0.95),
    stick: at(C(0.011, 0.011, 0.5, 6), 0, -0.2),         // 看守手里的棍子
  };
  return FIG_GEO;
}
function figMat() {                                       // 每个人自己的颜色写在实例上；带一点自发光，场景再暗身体也不会掉成一团黑
  if (FIG_MAT) return FIG_MAT;
  FIG_MAT = lam(0xffffff);
  FIG_MAT.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n\ttotalEmissiveRadiance += diffuseColor.rgb * 0.2;'); };
  FIG_MAT.customProgramCacheKey = () => 'escape-fig-1';
  return FIG_MAT;
}
const SKIN_C = [0xcdb09a, 0xb89f8c, 0xd2b6a2, 0xa98a74], HAIR_C = [0x2a2624, 0x3a332d, 0x4a3c30, 0xb9b6ae];
const CIV_TOP = [0x9a5a3c, 0x4f7a8c, 0xb08d3e, 0x6d8a55, 0x8a4f6a, 0x556a9c, 0xa8743a, 0x7b7f4a, 0xa34b45, 0x4e8576], CIV_LEG = [0x3d4650, 0x4a4238, 0x2f3a44, 0x54504a];
let _figSeed = 9001;
const frand = () => { _figSeed = _figSeed * 16807 % 2147483647; return _figSeed / 2147483647; };   // 自己的随机数：不动关卡那一套
// 一个人。kind：gray 劳动者 / worn 干不动的劳动者（同样的灰色工服）/ body 尸体（白色内衣）/ guard 看守 / civ 刚被抓来的人（o.c 指定哪一种颜色）
// 位置 x y z，face 朝左朝右，act 在做什么（见下面的 FIG_ACT），tx / ty 伸手、指、抓的那一点。hide 不画，still 摆好以后不再动（省得每帧重算）
function fig(kind, x, o = {}) {
  const r = frand, skin = SKIN_C[Math.floor(r() * 4)], hair = HAIR_C[Math.floor(r() * 4)];
  const f = { kind, x, y: o.y ?? 0, z: o.z ?? 0, face: o.face ?? 1, turn: o.turn ?? 0.18 + 0.2 * r(), yaw: 0, yawT: o.yawT, H: o.H ?? (kind === 'guard' ? 1.84 : 1.54 + 0.16 * r()),
    act: o.act ?? 'stand', seed: r() * 50, ph: r(), vx: 0, t: 0, at: 0, k: 10, hide: !!o.hide, still: !!o.still, stick: kind === 'guard', dirty: true, tx: 0, ty: 0, arm: 0, vr: o.vr ?? r(),
    p: { drop: 0, tilt: 0, lean: 0, head: 0, a: [0, 0], b: [0.1, 0.1], th: [0, 0], kn: [0, 0], ft: [0, 0] } };
  if (kind === 'gray' || kind === 'worn') f.col = { top: 0x727877, leg: 0x666c6b, arm: 0x727877, fore: 0x727877, shin: 0x666c6b, shoe: 0x2b2d2f, skin, hair: kind === 'worn' && r() < 0.5 ? 0xb9b6ae : hair };
  else if (kind === 'body') f.col = { top: 0xdcd9ce, leg: 0xd2cfc4, arm: skin, fore: skin, shin: skin, shoe: skin, skin, hair };
  else if (kind === 'guard') f.col = { top: 0x1d2327, leg: 0x15191c, arm: 0x1d2327, fore: 0x1d2327, shin: 0x15191c, shoe: 0x0b0d0e, skin: 0x0d1012, hair: 0x0a0c0d };   // 脸和头发都是黑的：远看就是一只兜帽
  else { const top = CIV_TOP[o.c ?? Math.floor(r() * CIV_TOP.length)], leg = CIV_LEG[Math.floor(r() * CIV_LEG.length)]; f.col = { top, leg, arm: top, fore: r() < 0.3 ? skin : top, shin: leg, shoe: 0x231f1c, skin, hair: o.old ? 0xb9b6ae : hair }; }
  f.yaw = f.yawT ?? (f.face > 0 ? -f.turn : -Math.PI + f.turn);
  figSnap(f); return f;
}
// ---- 在做什么 → 这一刻该摆成什么样。q 先摆成站直的样子，各个动作只改自己要改的 ----
// 角度：drop 胯比站直时低多少（身高的几成）/ tilt 整个人往后放倒多少（π/2 = 仰面躺平，负的是趴着）/ lean 上身前倾 / head 低头 /
// a、b 两条手臂的肩和肘（0 垂着，正的往前抬）/ th、kn 两条腿的胯和膝（正的往前抬，膝盖弯是负的）
const FQ = { drop: 0, tilt: 0, lean: 0, head: 0, a: [0, 0], b: [0, 0], th: [0, 0], kn: [0, 0] };
function figAim(f, q, s, wig = 0) {                       // 手臂 s 伸直了指向 (f.tx, f.ty)
  const sx = f.x + f.face * Math.sin(q.lean) * FG.shY * f.H, sy = f.y + (FG.hipY - q.drop + Math.cos(q.lean) * FG.shY - 0.012) * f.H;
  q.a[s] = Math.atan2((f.tx - sx) * f.face, sy - f.ty) + q.lean + wig; q.b[s] = 0.05;
}
function figLegs(f, q, A, armK = 0.8) {                   // 迈步：两条腿一前一后，手臂反着摆
  const w = 6.2832 * f.ph;
  for (let s = 0; s < 2; s++) { const ph = w + s * Math.PI; q.th[s] = A * Math.sin(ph); q.kn[s] = -0.1 - 1.9 * A * Math.max(0, Math.cos(ph)); q.a[s] = -armK * A * Math.sin(ph) + q.lean; q.b[s] = 0.22; }
}
const FIG_ACT = {
  stand(f, q, t) { q.lean = 0.03; q.a[0] = 0.05 + 0.02 * Math.sin(t * 1.1); q.a[1] = -0.03; q.b[0] = q.b[1] = 0.14; },
  walk(f, q) { q.lean = 0.06; figLegs(f, q, f.gait ?? 0.42); },
  march(f, q) { q.lean = 0.02; figLegs(f, q, 0.36, 0.25); q.b[0] = q.b[1] = 0.06; },                                    // 劳动者：步子一样，手臂几乎不摆
  run(f, q) { q.lean = 0.24; figLegs(f, q, 0.8, 1.0); q.b[0] = q.b[1] = 1.2; },
  shuffle(f, q) { q.lean = 0.42; q.head = 0.36; q.drop = 0.02; figLegs(f, q, 0.2, 0.15); q.a[0] = q.a[1] = 0.42; q.b[0] = q.b[1] = 0.08; },   // 干不动的人：驼着背，拖着脚
  hunch(f, q, t) { q.lean = 0.4 + 0.02 * Math.sin(t * 0.9); q.head = 0.38; q.drop = 0.015; q.a[0] = q.a[1] = 0.4; q.b[0] = q.b[1] = 0.08; },
  work(f, q) {                                           // 所有人同一个动作、同一个拍子（照全局的时间算）
    const w = T * 2.6; q.lean = 0.2 + 0.06 * Math.sin(w); q.head = 0.12;
    q.a[0] = 0.95 + 0.42 * Math.sin(w); q.b[0] = 0.85 - 0.3 * Math.sin(w); q.a[1] = 0.95 - 0.42 * Math.sin(w); q.b[1] = 0.85 + 0.3 * Math.sin(w); q.th[0] = 0.08; q.th[1] = -0.06;
  },
  sit(f, q) { q.drop = FG.hipY - 0.17; q.th[0] = 1.95; q.kn[0] = -1.56; q.th[1] = 1.7; q.kn[1] = -0.88; q.lean = -0.12 + 0.3 * f.vr; q.head = 0.42; q.a[0] = 0.9; q.a[1] = 0.8; q.b[0] = q.b[1] = 0.6; },
  cower(f, q, t) { q.drop = FG.hipY - 0.2; q.th[0] = q.th[1] = 1.75; q.kn[0] = q.kn[1] = -2.29; q.lean = 0.85 + 0.02 * Math.sin(t * 31); q.head = 0.5; q.a[0] = 2.4; q.a[1] = 2.3; q.b[0] = q.b[1] = 1.6; },
  lean(f, q) { q.lean = -0.1; q.th[0] = 0.2; q.kn[0] = -0.25; q.th[1] = -0.05; q.head = 0.3; q.a[0] = q.a[1] = -0.1; q.b[0] = q.b[1] = 0.1; },
  bars(f, q, t) { q.lean = 0.1; q.head = -0.06; q.a[0] = 1.35 + 0.03 * Math.sin(t * 0.8); q.a[1] = 1.3; q.b[0] = q.b[1] = 0.45; },              // 扒着栏杆
  reach(f, q, t) { q.lean = 0.16; q.head = -0.1; figAim(f, q, f.arm, 0.03 * Math.sin(t * 6)); q.a[1 - f.arm] = 1.3; q.b[1 - f.arm] = 0.45; },   // 伸出整条手臂
  point(f, q) { figAim(f, q, f.arm); q.a[1 - f.arm] = 0.02; q.b[1 - f.arm] = 0.1; },                                                           // 伸直手臂指过去
  shoo(f, q, t) { q.lean = -0.1; q.head = -0.05; figAim(f, q, f.arm, 0.3 * Math.sin(t * 10)); q.b[f.arm] = 0.25 + 0.2 * Math.sin(t * 10 + 1); q.a[1 - f.arm] = 0.1; q.b[1 - f.arm] = 0.2; },   // 挥手让他走开
  cling(f, q, t) { q.lean = -0.36 + 0.05 * Math.sin(t * 14); q.head = -0.2; figAim(f, q, 0); figAim(f, q, 1, 0.06); q.th[0] = 0.5; q.kn[0] = -0.3; q.th[1] = 0.15; q.kn[1] = -0.5; },      // 抓着栏杆不放
  lie(f, q) { q.tilt = 1.5708; q.a[0] = lerp(-0.25, 0.55, f.vr); q.a[1] = lerp(0.3, -0.2, f.vr); q.b[0] = q.b[1] = 0.2; q.th[0] = 0.08; q.th[1] = -0.05 + 0.3 * f.vr; q.kn[0] = -0.1; q.kn[1] = -0.2 - 0.5 * f.vr; q.head = -0.15; },
  prone(f, q) { q.tilt = -1.5708; q.a[0] = 2.6; q.a[1] = 0.4; q.b[0] = 0.5; q.b[1] = 0.3; q.th[1] = 0.3; q.kn[1] = -0.5; },                     // 趴着倒在地上
  dragged(f, q) { q.tilt = 1.5708; q.a[0] = 3.0; q.a[1] = 2.9; q.b[0] = q.b[1] = 0.15; q.kn[1] = -0.15; },                                     // 被人拽着两只手拖着走
  push(f, q) { q.lean = 0.22; figLegs(f, q, 0.36, 0); q.a[0] = q.a[1] = 1.0 + q.lean; q.b[0] = q.b[1] = 0.35; },                                // 推着推车
  pull(f, q) { q.lean = -0.22; figLegs(f, q, 0.3, 0); q.a[0] = q.a[1] = 0.75; q.b[0] = q.b[1] = 0.2; },                                         // 倒退着拖
  poke(f, q, t) { q.lean = 0.18; q.head = 0.2; figAim(f, q, 0, 0.12 * Math.sin(t * 5)); q.b[0] = 0.25; },                                       // 用棍子拨
  strike(f, q) { const k = sstep(0.22, 0.36, f.at); q.lean = lerp(-0.1, 0.4, k); q.a[0] = lerp(2.9, 0.7, k); q.b[0] = lerp(0.9, 0.15, k); },    // 抡起来打下去
  struggle(f, q, t) { q.lean = -0.25 + 0.22 * Math.sin(t * 8.3); q.head = -0.25 + 0.2 * Math.sin(t * 7); q.a[0] = 1.4 + 0.9 * Math.sin(t * 11); q.a[1] = 1.0 + 0.9 * Math.sin(t * 9 + 2); q.b[0] = q.b[1] = 0.6; q.th[0] = 0.45; q.kn[0] = -0.2; q.th[1] = -0.25; q.kn[1] = -0.45; },
  handsup(f, q) { q.a[0] = q.a[1] = 2.9; q.b[0] = q.b[1] = 0.35; },
  sitpoint(f, q) {                                       // 躺着的人半撑起身子，伸直手臂指向 (tx, ty)
    const t = 0.62; q.tilt = t; q.drop = FG.hipY - 0.1; q.th[0] = 1.5708 - t; q.th[1] = 1.3 - t; q.kn[1] = -0.5; q.head = -0.1;
    const sx = f.x - f.face * Math.sin(t) * FG.shY * f.H, sy = f.y + (0.1 + Math.cos(t) * FG.shY) * f.H;
    q.a[0] = Math.atan2((f.tx - sx) * f.face, sy - f.ty) - t; q.b[0] = 0.04; q.a[1] = -0.5 - t; q.b[1] = 0.3;
  },
  bend(f, q, t) { q.lean = 0.85 + 0.1 * Math.sin(t * 2.2); q.head = 0.2; q.a[0] = 0.5 + 0.5 * Math.sin(t * 2.2); q.a[1] = 0.6 - 0.4 * Math.sin(t * 2.2); q.b[0] = q.b[1] = 0.3; q.th[0] = 0.15; q.th[1] = -0.1; },   // 弯着腰在推车里翻
  lift(f, q) { q.lean = 0.5; q.a[0] = q.a[1] = 1.2; q.b[0] = q.b[1] = 0.5; q.th[0] = 0.4; q.kn[0] = -0.6; q.th[1] = -0.1; q.kn[1] = -0.5; q.drop = 0.06; },
};
function figPose(f, q, t) {
  q.drop = q.tilt = q.lean = q.head = 0; q.a[0] = q.a[1] = 0; q.b[0] = q.b[1] = 0.1; q.th[0] = q.th[1] = q.kn[0] = q.kn[1] = 0;
  const fn = FIG_ACT[f.act]; if (fn) fn(f, q, t);
}
function figFeet(p) { const k = 1 - Math.min(1, Math.abs(p.tilt) / 1.2); for (let s = 0; s < 2; s++) p.ft[s] = -(p.th[s] + p.kn[s]) * k; }   // 站着、坐着脚掌放平；躺着脚尖朝上
function figSnap(f) {                                     // 一下子摆成现在这个动作的样子（刚放下的人、不会动的尸体）
  figPose(f, FQ, f.t + f.seed); const p = f.p;
  p.drop = FQ.drop; p.tilt = FQ.tilt; p.lean = FQ.lean; p.head = FQ.head;
  for (let s = 0; s < 2; s++) { p.a[s] = FQ.a[s]; p.b[s] = FQ.b[s]; p.th[s] = FQ.th[s]; p.kn[s] = FQ.kn[s]; }
  figFeet(p); f.yaw = f.yawT ?? (f.face > 0 ? -f.turn : -Math.PI + f.turn); f.dirty = true;
}
function figAct(f, act, o) { if (f.act !== act) { f.act = act; f.at = 0; } if (o) Object.assign(f, o); }
// 每帧：照现在的动作慢慢摆过去。act = 'freeze' 的人停在这一刻的样子上不动（铃一响，所有人同时停住）
function figStep(f, dt) {
  if (f.hide || f.still) return;
  f.t += dt; f.at += dt;
  const yT = f.yawT ?? (f.face > 0 ? -f.turn : -Math.PI + f.turn);
  if (Math.abs(yT - f.yaw) > 1e-3) { f.yaw = damp(f.yaw, yT, f.yk ?? 8, dt); f.dirty = true; }
  if (f.act === 'freeze') return;
  if (f.vx) f.ph = ((f.ph + f.vx * f.face * dt / (0.77 * f.H)) % 1 + 1) % 1;
  figPose(f, FQ, f.t + f.seed);
  const p = f.p, k = 1 - Math.exp(-f.k * dt);
  p.drop += (FQ.drop - p.drop) * k; p.tilt += (FQ.tilt - p.tilt) * k; p.lean += (FQ.lean - p.lean) * k; p.head += (FQ.head - p.head) * k;
  for (let s = 0; s < 2; s++) { p.a[s] += (FQ.a[s] - p.a[s]) * k; p.b[s] += (FQ.b[s] - p.b[s]) * k; p.th[s] += (FQ.th[s] - p.th[s]) * k; p.kn[s] += (FQ.kn[s] - p.kn[s]) * k; }
  figFeet(p); f.dirty = true;
}
// 走向 tx：到了返回 true。back：倒退着走（脸不朝着走的方向）
function figGo(f, tx, speed, dt, back = false) {
  const d = tx - f.x; if (Math.abs(d) < 0.03) { f.vx = 0; return true; }
  const dir = Math.sign(d); f.face = back ? -dir : dir; f.vx = dir * Math.min(speed, Math.abs(d) / Math.max(dt, 1e-4)); f.x += f.vx * dt; return false;
}
// ---- 画出来：一章一组实例。C.add(f) 把一个人登记进来，C.draw() 每帧把动过的人重新摆一遍 ----
const _fm = Array.from({ length: 8 }, () => new THREE.Matrix4()), _ft = new THREE.Matrix4(), _fq = new THREE.Quaternion(), _fp = V3(), _fs = V3(), _fUp = V3(0, 1, 0), _fc = new THREE.Color();
const FIG_ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
const FIG_PARTS = [['torso', 1], ['pelvis', 1], ['head', 1], ['hair', 1], ['uarm', 2], ['farm', 2], ['hand', 2], ['thigh', 2], ['shin', 2], ['shoe', 2], ['stick', 1]];
function figJoint(out, parent, x, y, z, rz) { _ft.makeRotationZ(rz).setPosition(x, y, z); return out.multiplyMatrices(parent, _ft); }
function mkCrowd(R, cap) {
  const G = figKit(), I = {}, figs = [];
  for (const [k, n] of FIG_PARTS) {
    const m = new THREE.InstancedMesh(G[k], figMat(), cap * n); m.castShadow = k !== 'hand' && k !== 'stick' && k !== 'hair' && k !== 'shoe'; m.receiveShadow = true; m.frustumCulled = false;
    for (let i = 0; i < cap * n; i++) { m.setMatrixAt(i, FIG_ZERO); m.setColorAt(i, _fc.set(0xffffff)); }
    R.add(m); I[k] = m;
  }
  const paint = f => {
    const i = f.ci, c = f.col, set = (k, j, hex) => I[k].setColorAt(j, _fc.set(hex));
    set('torso', i, c.top); set('pelvis', i, c.leg); set('head', i, c.skin); set('hair', i, c.hair); set('stick', i, 0x0c0e0f);
    for (let s = 0; s < 2; s++) { const j = 2 * i + s; set('uarm', j, c.arm); set('farm', j, c.fore); set('hand', j, c.skin); set('thigh', j, c.leg); set('shin', j, c.shin); set('shoe', j, c.shoe); }
  };
  const zero = f => { const i = f.ci; for (const [k, n] of FIG_PARTS) for (let s = 0; s < n; s++) I[k].setMatrixAt(n * i + s, FIG_ZERO); };
  const place = f => {
    const i = f.ci, p = f.p, [ROOT_, PEL, SPN, CH, A, B_, C_] = _fm, lie = Math.min(1, Math.abs(p.tilt) / 1.5708);
    ROOT_.compose(_fp.set(f.x, f.y, f.z), _fq.setFromAxisAngle(_fUp, f.yaw), _fs.setScalar(f.H));
    figJoint(PEL, ROOT_, 0, lerp(FG.hipY - p.drop, 0.1, lie), 0, p.tilt); I.pelvis.setMatrixAt(i, PEL);
    figJoint(SPN, PEL, 0, 0, 0, -p.lean); I.torso.setMatrixAt(i, SPN);
    figJoint(CH, SPN, 0, FG.shY, 0, 0);
    figJoint(A, CH, 0, 0.03, 0, -p.head); I.head.setMatrixAt(i, A); I.hair.setMatrixAt(i, A);
    for (let s = 0; s < 2; s++) {
      const j = 2 * i + s;
      figJoint(A, CH, 0, -0.012, s ? -FG.shZ : FG.shZ, p.a[s]); I.uarm.setMatrixAt(j, A);
      figJoint(B_, A, 0, -FG.uarm, 0, p.b[s]); I.farm.setMatrixAt(j, B_); I.hand.setMatrixAt(j, B_);
      if (s === 0) { if (f.stick) { figJoint(C_, B_, 0, -FG.farm - 0.01, 0, f.stickA ?? 1.35); I.stick.setMatrixAt(i, C_); } else I.stick.setMatrixAt(i, FIG_ZERO); }
      figJoint(A, PEL, 0, -0.005, s ? -FG.hipZ : FG.hipZ, p.th[s]); I.thigh.setMatrixAt(j, A);
      figJoint(B_, A, 0, -FG.thigh, 0, p.kn[s]); I.shin.setMatrixAt(j, B_);
      figJoint(C_, B_, 0, -FG.shin, 0, p.ft[s]); I.shoe.setMatrixAt(j, C_);
    }
  };
  // 现成的模型（src/45-cast.js）：镜头附近的人换成带骨架的模型，远处的还是上面这几块零件（一章里可能有上百个人，全用模型太重）。
  // 谁用模型每帧挑一遍：左右 CAST_NEAR 米以内的，最多 CAST_MAX 个，多了先紧着离得近、站得靠前的。模型走近了才克隆，一帧只花几毫秒克隆，多的下一帧接着来。
  // 模型读不到、或者地址里写了 ?cast=0，就一直是搭出来的
  const near = [];
  const cast = f => { f.m = null; f.tpl = null; f.lod = false; f.role = figRole(f); if (f.role) castLoad(f.role.file, tpl => { f.tpl = tpl; }); };
  R.addEventListener('removed', () => { for (const f of figs) { if (f.m) f.m.root.traverse(o => { if (o.isSkinnedMesh) o.skeleton.dispose(); }); f.m = null; f.lod = false; } });   // 这一章卸掉了：没挂在场景里的那些克隆也要释放
  const C = { I, figs, cap,
    add(f) { if (figs.length >= cap) { console.warn('crowd full'); return f; } f.ci = figs.length; figs.push(f); paint(f); f.dirty = true; f.shown = false; cast(f); return f; },
    addAll(list) { for (const f of list) C.add(f); for (const k in I) if (I[k].instanceColor) I[k].instanceColor.needsUpdate = true; },
    draw() {
      const cx = camera.position.x; let any = false, t0 = 0;
      near.length = 0;
      for (const f of figs) { f.want = false; if (f.tpl && !f.hide) { const d = Math.abs(f.x - cx); if (d < CAST_NEAR + (f.lod ? 4 : 0)) { f.sc = d - 1.5 * f.z - (f.lod ? 3 : 0); near.push(f); } } }
      if (near.length > CAST_MAX) { near.sort((a, b) => a.sc - b.sc); near.length = CAST_MAX; }
      for (const f of near) f.want = true;
      for (const f of figs) {
        if (f.want && !f.m) { if (!t0) t0 = performance.now(); else if (performance.now() - t0 > 4) f.want = false; if (f.want) f.m = castSpawn(f.tpl, f.role.look, { stick: f.stick }); }
        if (f.want) {                                                    // 用模型的人
          if (!f.lod) { f.lod = true; R.add(f.m.root); zero(f); any = true; f.shown = false; }
          if (f.dirty || !f.shown) { castPose(f.m, f); f.dirty = false; f.shown = true; }
          continue;
        }
        if (f.lod) { f.lod = false; R.remove(f.m.root); f.shown = false; }   // 走远了、藏起来了：模型从场景里拿下来，换回零件
        if (f.hide) { if (f.shown) { zero(f); f.shown = false; any = true; } continue; }
        if (!f.dirty && f.shown) continue;
        if (Math.abs(f.x - cx) > 60 && f.shown) continue;                // 离得远的先不管，走近了再摆
        place(f); f.dirty = false; f.shown = true; any = true;
      }
      if (any) for (const k in I) I[k].instanceMatrix.needsUpdate = true;
    } };
  return C;
}

// ============================================================
//  推车：全游戏只有一种 —— 低矮的铁框，四个轮子（故事文档第三节）。装身体和装工服用的是同一辆
// ============================================================
const CART = { L: 1.6, W: 0.92, bed: 0.32, rail: 0.82 };
let CART_GEO = null, CLOTH_GEO = [null, null];
function bakeGeo(fn) { const B = baker(), tmp = new THREE.Group(); fn(B); const m = B.mesh(tmp); return m.geometry; }
function cartGeo() {
  if (CART_GEO) return CART_GEO;
  return CART_GEO = withSeed(4101, () => bakeGeo(B => {
    const { L, W, bed, rail } = CART, c1 = 0x444b4f, c2 = 0x2f3437, c3 = 0x17191b, hx = L / 2 - 0.025, hz = W / 2 - 0.025, mid = (bed + rail) / 2;
    B.vary = 0.06; B.at(0, 0, 0);
    B.box(L, 0.05, W, c2, 0, bed - 0.025, 0);                                                                                     // 底板
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) B.box(0.05, rail - bed + 0.02, 0.05, c1, sx * hx, mid, sz * hz);          // 四根角柱
    for (const sz of [-1, 1]) { B.box(L, 0.045, 0.045, c1, 0, rail, sz * hz); B.box(L, 0.03, 0.03, c1, 0, mid, sz * hz); for (let x = -L / 2 + 0.2; x < L / 2 - 0.1; x += 0.2) B.box(0.02, rail - bed, 0.02, c1, x, mid, sz * hz); }
    for (const sx of [-1, 1]) { B.box(0.045, 0.045, W, c1, sx * hx, rail, 0); B.box(0.03, 0.03, W, c1, sx * hx, mid, 0); for (let z = -W / 2 + 0.2; z < W / 2 - 0.1; z += 0.2) B.box(0.02, rail - bed, 0.02, c1, sx * hx, mid, z); }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { B.cyl(0.13, 0.13, 0.07, 10, c3, sx * (L / 2 - 0.3), 0.13, sz * (W / 2 - 0.07), Math.PI / 2, 0, 0); B.box(0.05, 0.18, 0.05, c2, sx * (L / 2 - 0.3), 0.22, sz * (W / 2 - 0.12)); }   // 四个轮子
  }));
}
function clothGeo(tall) {                                 // 车上叠好的灰色工服：一摞一摞。tall：堆得比人高（第二章拿它当会走的掩体）
  const k = tall ? 1 : 0; if (CLOTH_GEO[k]) return CLOTH_GEO[k];
  return CLOTH_GEO[k] = withSeed(4102 + k, () => bakeGeo(B => {
    B.vary = 0.1; B.at(0, 0, 0);
    for (let ix = 0; ix < 4; ix++) for (let iz = 0; iz < 2; iz++) {
      const n = tall ? 17 + Math.floor(rr(0, 6)) : 4 + Math.floor(rr(0, 5)), x = -0.57 + ix * 0.38, z = -0.2 + iz * 0.4;
      for (let j = 0; j < n; j++) B.box(0.34, 0.068, 0.34, rnd() < 0.5 ? 0x767c7b : 0x6c7271, x + rr(-0.015, 0.015), CART.bed + 0.036 + j * 0.07, z + rr(-0.015, 0.015), 0, rr(-0.06, 0.06), 0);
    }
  }));
}
// 一辆推车：g 是它的节点（挪 g.position.x 就是推着走）。load：'clothes' 低低的几摞工服 / 'stack' 堆得比人高 / 不写就是空车（身体另外用小人摆进去）
function mkCart(R, x, z = 0, load = null, y = 0) {
  const g = grp(R, x, y, z); add(g, cartGeo(), FEET_MAT);
  if (load) add(g, clothGeo(load === 'stack'), FEET_MAT);
  return g;
}
// 往一辆推车里摆几具身体：返回这几个人（还要自己登记进人群）。它们跟着推车走：每帧调 cartBodies(list, x, y)
function bodiesFor(n, o = {}) {
  const list = [];
  for (let i = 0; i < n; i++) {
    const f = fig(o.kind ?? 'body', 0, { act: 'lie', face: frand() < 0.5 ? 1 : -1, turn: lerp(-0.5, 0.5, frand()) });
    f.dx = (f.face > 0 ? -1 : 1) * 0.42 + lerp(-0.14, 0.14, frand()); f.dy = CART.bed + 0.02 + i * 0.15; f.dz = lerp(-0.2, 0.2, frand()); f.k = 30;
    list.push(f);
  }
  return list;
}
function cartBodies(list, x, y, z = 0) { for (const f of list) { f.x = x + f.dx; f.y = y + f.dy; f.z = z + f.dz; f.dirty = true; } }

// ---- 一排铁栏杆（牢房、铁笼的正面）：竖着的铁条，上下两道横档。攒进 B 里，和别的零件烘成一个网格 ----
function barsInto(B, x1, x2, z, h, o = {}) {
  const c = o.c ?? 0x23282b, gap = o.gap ?? 0.2;
  B.at(0, 0, 0);
  for (let x = x1; x <= x2 + 1e-3; x += gap) if (!(o.skip && x > o.skip[0] && x < o.skip[1])) B.box(0.035, h, 0.035, c, x, h / 2, z);
  B.box(x2 - x1, 0.06, 0.06, c, (x1 + x2) / 2, h - 0.03, z); B.box(x2 - x1, 0.06, 0.06, c, (x1 + x2) / 2, 0.12, z); B.box(x2 - x1, 0.05, 0.05, c, (x1 + x2) / 2, h * 0.55, z);
  for (const x of [x1, x2]) B.box(0.09, h, 0.09, c, x, h / 2, z);
}
// ---- 一辆卡车：车头朝 dir。box：true 封死的铁皮车厢（囚车）；否则是敞着后面、蒙着篷布的车厢。原点在车厢正中的地面上 ----
const TRUCK = { L: 6.4, bedY: 1.3, W: 2.3 };
function truckInto(B, x, z, dir, o = {}) {
  const c1 = o.c ?? 0x2b3134, c2 = 0x1c2022, c3 = 0x101213, tarp = o.tarp ?? 0x4a4f48, { L, bedY, W } = TRUCK;
  B.at(x, 0, z, dir > 0 ? 0 : Math.PI);
  B.box(L, 0.16, W, c2, 0, bedY - 0.08, 0);                                                                    // 车厢底板（下面是空的：人钻得进去）
  B.box(L + 2.6, 0.2, 0.9, c3, 1.3, bedY - 0.3, 0);                                                            // 大梁
  if (o.box) { B.box(L, 2.3, W, c1, 0, bedY + 1.15, 0); for (let i = -2; i <= 2; i++) B.box(0.06, 2.2, W + 0.04, c2, i * 1.3, bedY + 1.15, 0); }
  else { for (const sz of [-1, 1]) B.box(L, 0.7, 0.06, c1, 0, bedY + 0.35, sz * (W / 2 - 0.03)); B.box(0.06, 0.7, W, c1, L / 2 - 0.03, bedY + 0.35, 0);
    B.box(L - 0.3, 1.5, W - 0.1, tarp, 0.15, bedY + 1.45, 0); B.box(L - 0.6, 0.3, W - 0.5, tarp, 0.15, bedY + 2.3, 0); }   // 篷布：后面敞着
  B.box(2.2, 2.2, W - 0.1, c1, L / 2 + 1.25, bedY + 0.75, 0); B.box(1.1, 0.9, W - 0.2, c1, L / 2 + 2.85, bedY + 0.1, 0);   // 驾驶室、车头
  B.box(0.06, 0.8, W - 0.5, 0x0a1117, L / 2 + 2.32, bedY + 1.35, 0);                                           // 挡风玻璃
  for (const wx of [-L / 2 + 1.0, -L / 2 + 2.2, L / 2 + 2.3]) for (const sz of [-1, 1]) B.cyl(0.52, 0.52, 0.34, 14, c3, wx, 0.52, sz * (W / 2 - 0.12), Math.PI / 2, 0, 0);   // 轮子
}

// ============================================================
//  手电和探照灯
//  规矩和旧原型的探照灯一样：灯罩住没遮没挡的主角就开始“盯住”（曝光慢慢涨），盯满了就算被发现，回到最近的存档点。
//  灯都是从后面、上面照过来的；挡在灯和主角中间的东西（推车、大桶、柱子）在主角走的那条线上投下一段影子，站在影子里就照不到。
//  真的灯用那盏带影子的聚光灯（36-lights-fx.js 的 beam），所以影子是它自己投出来的，看着躲好了才算躲好了
// ============================================================
const C_CALM = new THREE.Color(0xe2eef2), C_WARM = new THREE.Color(0xffe2b0), C_ALERT = new THREE.Color(0xff5030);
beam.shadow.camera.near = 1.5; beam.shadow.camera.updateProjectionMatrix();          // 灯离得近：影子从一米半开始算（旧原型是六米）
function useBeam(sx, sy, sz, tx, ty, tz, o = {}) {
  beam.position.set(sx, sy, sz); beam.target.position.set(tx, ty, tz); beam.intensity = o.i ?? 30; beam.angle = o.ang ?? 0.16; beam.penumbra = o.pen ?? 0.5;
  beam.color.lerpColors(o.c ?? C_CALM, C_ALERT, o.alert ?? 0);
}
// 看得见的光柱：一只半透明的圆锥。aim(灯在哪, 照着哪)
function mkCone(R, ang, o = {}) {
  const L = 10, geo = new THREE.ConeGeometry(Math.tan(ang) * L, L, 24, 1, true); geo.translate(0, -L / 2, 0); geo.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: beamGradTex(), color: o.c ?? 0xd8ecf2, transparent: true, opacity: o.op ?? 0.085, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
  m.renderOrder = 60; R.add(m);
  return { m, op: o.op ?? 0.085, aim(sx, sy, sz, tx, ty, tz) { m.position.set(sx, sy, sz); m.lookAt(tx, ty, tz); m.scale.setScalar((Math.hypot(tx - sx, ty - sy, tz - sz) + 0.6) / L); } };
}
// 挡光的东西 [a, b]（左右两边）在主角走的那条线（z = 0）上投下的影子是哪一段。灯在 (xs, zs)，东西从 zb（背面，离灯近）到 zf（正面）。
// 影子朝背着灯的方向偏：离灯远的那一头是背面的角投出来的（偏得多），离灯近的那一头是正面的角投出来的（偏得少）
function shadowSpan(a, b, zb, zf, xs, zs) {
  const kb = -zs / (zb - zs), kf = -zs / (zf - zs);
  return [xs + (a - xs) * (a < xs ? kb : kf), xs + (b - xs) * (b > xs ? kb : kf)];
}
function inShadow(x, covers, xs, zs, pad = 0.2) {         // covers：[{ a, b, zb, zf }]
  for (const c of covers) { const [s1, s2] = shadowSpan(c.a, c.b, c.zb ?? -1.5, c.zf ?? -0.6, xs, zs); if (x > s1 + pad && x < s2 - pad) return true; }
  return false;
}
// 被盯上：W = { ex 曝光 0..1, caught 被发现以后过了多久 }。seen 这一帧照不照得到；up / down 多久盯满、多久缓过来
function watchStep(W, seen, dt, up = 0.6, down = 0.9) {
  if (W.caught > 0) { W.caught += dt; if (W.caught > 1.2 && state === 'play') respawn(); return 1; }
  W.ex = clamp(W.ex + (seen && state === 'play' ? dt / up : -dt / down), 0, 1);
  if (W.ex >= 1 && state === 'play') { W.caught = 1e-3; ctl = false; fx('alarm'); }
  return W.ex;
}
function caughtNow(sound = 'alarm') { if (state !== 'play') return; ctl = false; fx(sound); respawn(); }      // 一下子就完了的（被火燎到、被狗追上、被门口的看守看见）
// 躲着的时候缩起身子（和旧原型夜搜一章的样子一样）
const crouchPose = k => ({ sit: 0.75 * k, sitH: 0.25, sitLeg: 0.35, bow: 0.3 * k });

// ============================================================
//  厂房：两章之间的墙、后墙、一层层的剪影
// ============================================================
// 两章之间的一道墙：后面一直砌到远处，主角走的那条线上留一个门洞；靠镜头这一侧是一整面黑墙 —— 镜头穿过它的时候正好换光
function divider(R, x, o = {}) {
  const h = o.door ?? 3.6, mat = o.mat ?? MAT.concrete;
  add(R, bx(1.4, 48, 30.7), mat, x, 23, -16.65); add(R, bx(1.4, 48 - h, 2.6), mat, x, h + (48 - h) / 2, 0); add(R, bx(1.4, 70, 40), MAT.black, x, 30, 21.3, false);
}
// 厂房的几层布景板。pal：far 后墙 / win 高窗的光 / mid 中景的剪影 / near 近处的柱子。o.lamps：吊灯的位置（中景里画出灯罩，灯光另外登记）
function hallLayers(x1, x2, pal, o = {}) {
  const top = o.top ?? 30;
  backdrop(x1, x2, -2, top, o.zFar ?? -26, 8, g => {                                   // 最远的后墙：一排窄窄的高窗
    setInk(g, pal.far); box(g, x1, -2, x2 - x1, top + 2);
    for (let x = x1 + 3; x < x2 - 2; x += o.winGap ?? 8.5) {
      const gr = g.createLinearGradient(0, 24, 0, 6); gr.addColorStop(0, pal.win); gr.addColorStop(1, pal.far); g.fillStyle = gr; box(g, x, 6, 1.5, 18);
      setInk(g, pal.far); for (let y = 8; y < 24; y += 3) box(g, x - 0.1, y, 1.7, 0.26);
    }
  }).material.color.setScalar(o.farK ?? 1);
  backdrop(x1, x2, -1, 22, o.zMid ?? -13, 14, g => {                                   // 中景：柱子、行车梁、管束、吊着的链条
    setInk(g, pal.mid);
    for (let x = x1 + 4; x < x2 - 2; x += 9) { box(g, x - 0.6, -1, 1.2, 23); box(g, x - 1.0, 9.2, 2.0, 0.5); }
    truss(g, x1, x2, 9.7, 1.2, 0.11); box(g, x1, 12.4, x2 - x1, 0.3); box(g, x1, 13.1, x2 - x1, 0.2);
    for (let x = x1 + 2; x < x2 - 6; x += rr(7, 13)) cable(g, x, 22, x + rr(5, 9), 22, rr(2, 6), 0.06);
    for (let x = x1 + 6; x < x2 - 4; x += rr(9, 17)) { const y = rr(5.5, 8.5); line(g, [[x, 22], [x, y]], 0.05); ring(g, x, y - 0.3, 0.3, 0.1); }
    if (o.mid) o.mid(g);
  });
  backdrop(x1, x2, -1, 15, -3.6, 26, g => {                                            // 近景：几根工字钢柱、一道梁、垂下来的缆线
    for (const x of o.cols ?? []) { const gr = g.createLinearGradient(x - 0.4, 0, x + 0.4, 0); gr.addColorStop(0, pal.near); gr.addColorStop(1, pal.near2 ?? pal.near); g.fillStyle = gr; box(g, x - 0.4, -1, 0.8, 16); setInk(g, pal.near); box(g, x - 0.75, -1, 1.5, 1.4); box(g, x - 0.7, 6.3, 1.4, 0.4); }
    setInk(g, pal.near); if (o.beam !== false) truss(g, x1, x2, 6.8, 0.85, 0.08);
    for (const x of o.lamps ?? []) { line(g, [[x, 6.8], [x, 5.5]], 0.04); poly(g, [[x - 0.34, 5.28], [x + 0.34, 5.28], [x + 0.16, 5.52], [x - 0.16, 5.52]]); }
    if (o.near) o.near(g);
  });
  backdrop(x1, x2, -3, 10, 6, 20, g => {                                               // 前景：离镜头最近，全黑、略微虚焦
    setInk(g, '#040506');
    for (const x of o.fore ?? []) box(g, x, -3, 0.42, 13);
    for (let x = x1 + 2; x < x2 - 8; x += rr(10, 18)) cable(g, x, 10, x + rr(6, 12), 10, rr(1.5, 2.4), 0.09);
  }, { fog: false, blur: 2.2, order: 4000 });
}
// 地面上一道道伸向远处的伸缩缝
function floorSeams(R, x1, x2, step = 5.5) {
  for (let x = x1; x < x2; x += step) add(R, bx(0.07, 0.012, 34), MAT.dark, x, 0.004, -8, false).receiveShadow = true;
  for (const z of [3.2, -4.6]) add(R, bx(x2 - x1, 0.012, 0.07), MAT.dark, (x1 + x2) / 2, 0.004, z, false);
}
// 一排吊着的工作灯：灯罩画在近景那层布景板上（hallLayers 的 lamps），这里登记往下照的灯光（各章在最外层调，只登记一次）；
// 光晕在搭建的时候用 lampGlows 加上
function workLamps(xs, o = {}) { return xs.map(x => spotLight({ p: [x, 5.4, -3.2], t: [x + (o.dx ?? 0.3), 0, o.tz ?? -0.6], c: o.c ?? 0xffc070, i: o.i ?? 2.6, a: o.a ?? 0.62, d: 16, pen: 1 })); }
function lampGlows(R, xs, c = 0xffc070, size = 2.0) { return xs.map(x => glow(R, c, size, 0.8, x, 5.3, -3.5)); }

// ---- 声音：铃（劳动者只听它）、炉口喷火、闷响 ----
Object.assign(sfx, {
  ebell: (v = 1) => { for (const [m, a] of [[1, 0.15], [2.01, 0.07], [2.99, 0.035], [4.2, 0.02]]) tone(1180 * m, 1174 * m, a * v, 1.5, 'sine'); hit(2600, 3, 0.06 * v, 0.05); },
  ebellFar: (v = 1) => { for (const [m, a] of [[1, 0.03], [2.01, 0.01]]) tone(1180 * m, 1174 * m, a * v, 2.2, 'sine'); },
  whoosh: (v = 1) => { hit(240, 0.5, 0.5 * v, 1.5, 'lowpass'); hit(900, 0.6, 0.12 * v, 1.1); },
  thud: (v = 1) => { hit(120, 0.8, 0.5 * v, 0.25, 'lowpass'); hit(700, 1, 0.1 * v, 0.08); },
  engine: (v = 1) => { tone(46, 62, 0.2 * v, 2.4, 'sawtooth'); hit(110, 0.7, 0.3 * v, 2.2, 'lowpass'); },
  clang: (v = 1) => { snd('clank', { gain: 0.3 * v, rate: 0.8, wet: 0.9 }); hit(1500, 2, 0.1 * v, 0.08); },
});

// ---- 每帧都要做的：主角的衣服（换上、脱下是慢慢过渡的）；按 C 换自己衣服的颜色 ----
// 只在《逃出工厂》这几章里。到了旧原型的章节，主角穿模型原来的衣服，按 C 也不管
defZone({ n: 0, vis: [-1e9, 1e9], *build() {}, reset() {}, solve() {},
  update(dt) {
    HERO_RIM.uRimK.value = 0;                          // 轮廓光：默认关着，要的章节在自己的 update 里打开（它们在这一段后面跑）
    if (chapterAt(P.x).n > OLD) { HERO_TOP.uTopK.value = 0; return; }
    if (pressed.has('TINT') && state !== 'title') {
      STORY.own = (STORY.own + 1) % HERO_OWN.length; saveGame();
      sndEl.innerHTML = '主角自己的衣服：' + HERO_OWN[STORY.own][1]; sndEl.classList.add('on'); clearTimeout(sndTO); sndTO = setTimeout(() => sndEl.classList.remove('on'), 1800);
    }
    WEAR.k = damp(WEAR.k, WEAR.want, 5, dt);
    HERO_TOP.uTop.value.setHex(HERO_OWN[STORY.own % HERO_OWN.length][0]).lerp(GRAY_TOP, WEAR.k); HERO_TOP.uTopK.value = 1;
  } });
