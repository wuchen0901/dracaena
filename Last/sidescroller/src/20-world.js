
// ============================================================
//  世界数据与碰撞（单位：米；x 向右，y 向上，玩法平面 z = 0）
//  整段旅程是一条连续向右的路：八个章节各占一段 x，在各自的文件（60-ch*.js）里
//  往这里登记地形、方块、可推的东西、闸门、机关和存档点
// ============================================================
const X1 = 0, X2 = 104, X3 = 260, X4 = 392, X5 = 478, X6 = 542, X7 = 656, X8 = 772;      // 各章的原点（世界 x）
// 一共三十六章，在世界里接成一条连着的路（两章之间的路见下面的 link 和 src/69-zz-links.js）：第 1–8 章是《逃出工厂》（escape/，整段在世界的最左边，见 escape/60-kit.js 的 EX），
// 第 9–22 章是旧原型《铁锈与微光》的十四章（src/6*-ch*.js，前八章还在原来的位置，从 x = -60 起；后面的原点 X9 … 照前一章算）；第 23 章“高台”（src/69-ch15-drop.js）是 2026-11-16 加在最后的一关试验关；第 24 章“水下实验室”（src/69-ch16-lab.js）接在它右边。
// 旧原型的第 k 章现在是第 OLD + k 章；旧文件里写章节号的地方都写成 OLD + k，文件名、注释里的“第几章”还是旧的编号。
// 《逃出工厂》原来有八章，第一章“焚化炉”2026-11-15 删掉了，后面七章往前挪了一位：escape/ 的文件名（62-e2 …）、变量名（E4X …）、
// 注释里的“第几章”还是故事文档里原来的编号（文档里的第二章“分拣”是游戏的第 1 章）。2026-11-16 在大门和结尾中间加了一章“雾”（escape/68-e8-fog.js，游戏的第 7 章），
// 结尾成了第 8 章，旧原型往后挪一位（OLD 从 7 改成 8）
const OLD = 8;
const localN = n => n > OLD ? n - OLD : n;           // 这一章在它自己那个故事里排第几：两个故事的第一章从头教操作
const origN = n => n > OLD ? n - OLD : n === 7 ? 15 : n === 8 ? 8 : n + 1;   // 这一章原来的编号（《逃出工厂》删掉焚化炉以前是第几章）：布景的随机数种子、07 的灯按它算，删了一章、加了一章样子都不变。
                                                     // 后加的“雾”没有原来的编号，给它一个谁都没用过的 15（旧原型只到 14）
const CHAPTERS = [];                                 // { n, x0: 这一章从哪里算起, start: 出生点, name, sub }
function chapter(o) {                                // 章节号必须就是它在表里的位置（startChapter、菜单都按这个找）
  if (o.n !== CHAPTERS.length + 1) console.error(`章节号不对：《${o.name}》写的是第 ${o.n} 章，排在第 ${CHAPTERS.length + 1} 个`);
  CHAPTERS.push(o); return o;
}
const chapterAt = x => { let c = CHAPTERS[0]; for (const k of CHAPTERS) if (x >= k.x0) c = k; return c; };

// 故事进度：跨章节要记住的事（存进 localStorage，下次打开接着走）
//   cat 救下了小猫 / fed 老人拿到了食物 / cleaner 1 = 电池给了清洁机器人，2 = 给了门 /
//   pump 水泵通了电 / water 给幸存者和猫留了水 / wild 野地得到了水 / ending 1 = 修复，2 = 旁路
//   《长夜》原型：bulb 灯泡揣在怀里（旧第十二章凿好记号以后）/ room 机房的结局：1 拧回去，2 拉闸
//   《逃出工厂》加的两样在 escape/60-kit.js
const STORY0 = { ch: 1, done: 0, cat: false, fed: false, cleaner: 0, pump: false, water: false, wild: false, ending: 0, bulb: false, room: 0 };
const STORY = { ...STORY0 };

// ---- 地形：一条折线，坡度都很缓；陡的台阶、坑壁用 SOLIDS 里的方块表示 ----
// 登记的东西都记着是哪一章登记的（c：登记时 CHAPTERS 里已经有几章，也就是正在登记的那一章）—— 两章接起来的地方（下面的 link）按这个把各自伸出去的那一截剪掉
const regC = () => CHAPTERS.length;
const TERRAIN = [];
function terrain(...pts) { for (const p of pts) { p.c ??= regC(); TERRAIN.push(p); } }
let _gi = 1;
function groundY(x) {
  const n = TERRAIN.length; let i = clamp(_gi, 1, n - 1);
  while (i > 1 && x < TERRAIN[i - 1][0]) i--;
  while (i < n - 1 && x > TERRAIN[i][0]) i++;
  _gi = i; const a = TERRAIN[i - 1], b = TERRAIN[i];
  return a[1] + (b[1] - a[1]) * clamp((x - a[0]) / (b[0] - a[0]), 0, 1);
}
const groundSlope = x => (groundY(x + 0.15) - groundY(x - 0.15)) / 0.3;
// 地面往远处铺到哪里：平时一直铺到看不见的地方；登记过的一段 [x1, x2] 只铺到 z 为止 —— 后面是低下去的谷地，由布景板来画
const GROUND_BACK = [];
function groundBack(x1, x2, z) { const r = [x1, x2, z]; r.c = regC(); GROUND_BACK.push(r); }
// 地面往镜头这边铺到哪里：登记过的一段 [x1, x2] 只铺到 z 为止；z 写 null 就整段不铺（山洞自己搭地面，前面是岩石的剖面）
const GROUND_FRONT = [];
function groundFront(x1, x2, z) { const r = [x1, x2, z]; r.c = regC(); GROUND_FRONT.push(r); }
// ---- 洞顶：折线（只在有顶的地方登记）。头顶碰到它就停；压下来挡在人身边的那一段就是一面墙 ----
// 每调用一次 ceiling() 是单独的一段，两段之间没有顶（第六章卡车底下一段、旧原型山洞一段，中间隔着好几章）。
// 一段一段记在 CEILS 里（按左端排好），CEIL 是把它们首尾接成的一条折线：每段的第一个点标着 gap（和前一段之间没有顶）
const CEILS = [], CEIL = [];
function ceiling(...pts) { if (pts.length) { CEILS.push({ c: regC(), pts }); joinCeil(); } }
function joinCeil() {
  CEILS.sort((a, b) => a.pts[0][0] - b.pts[0][0]); CEIL.length = 0;
  for (const s of CEILS) s.pts.forEach((p, i) => { if (i === 0) { if (CEIL.length) p.gap = true; else delete p.gap; } CEIL.push(p); });
}
let _ci = 1;
function ceilY(x) {                                  // 头顶的岩石有多低；没有洞顶的地方是无穷高
  const n = CEIL.length; if (n < 2 || x < CEIL[0][0] || x > CEIL[n - 1][0]) return Infinity;
  let i = clamp(_ci, 1, n - 1);
  while (i > 1 && x < CEIL[i - 1][0]) i--;
  while (i < n - 1 && x > CEIL[i][0]) i++;
  _ci = i; const a = CEIL[i - 1], b = CEIL[i];
  if (b.gap) return x >= b[0] ? b[1] : Infinity;     // 落在两段之间
  return a[1] + (b[1] - a[1]) * clamp((x - a[0]) / (b[0] - a[0]), 0, 1);
}
// ---- 能游泳的水：{ x1, x2, y 水面的高度 }。掉进去不再回到岸上，而是游起来（见 50-player.js）----
const WATERS = [];
function water(o) { WATERS.push(o); return o; }
const waterAt = x => { for (const w of WATERS) if (x > w.x1 && x < w.x2) return w; return null; };
// ---- 路在前后（z）方向上的弯：各章登记 [x1, x2, f(x)]，f 给出这一段路往镜头这边（+）或往远处（-）偏多少米 ----
// 玩法照旧只管 x、y（碰撞不变）；画面里主角、镜头、影子跟着路弯。没登记的地方是 0
const ZPATH = [];
function zpath(x1, x2, f) { const r = [x1, x2, f]; r.c = regC(); ZPATH.push(r); }
const pathZ = x => { for (const p of ZPATH) if (x >= p[0] && x <= p[1]) return p[2](x); return 0; };
const GROUND = [];                                   // 地面颜色的关键点 [x, 颜色]，中间线性过渡
function ground(x, hex) { const r = [x, new THREE.Color(hex)]; r.c = regC(); GROUND.push(r); }
function groundColor(x, out) {
  for (let i = 1; i < GROUND.length; i++) if (x <= GROUND[i][0]) return out.lerpColors(GROUND[i - 1][1], GROUND[i][1], clamp((x - GROUND[i - 1][0]) / (GROUND[i][0] - GROUND[i - 1][0]), 0, 1));
  return out.copy(GROUND[GROUND.length - 1][1]);
}

// ---- 登记表 ----
const SOLIDS = [], PUSHABLES = [], GATES = [], USES = [], PITS = [], CPS = [], ZONES = [], HINTS = [], CAMKEYS = [];
// 实心方块（从 y1 到 y2）。玩家会被侧面挡住，可以站在顶上。plat: 悬空也能站（漂在水上的木梁）
// thru: 箱子、推车这类摆在路上的东西 —— 平时不挡路：人在地上走着碰到它，就从它前面（离镜头近的那一侧）绕过去，不用跳（2026-11-17）。
//   跳起来朝它撞过去照旧是实心的（扒得住就爬上去），从前面跳起来也能落到它顶上。只在它放在地面上（不是搁在台子、架子上）的时候才绕得过去。
//   zf：它的前脸离路中间有多远（米，不写就是 0.55，一只普通的木箱），人绕过去时让到这前面一点。pushable() 推得动的东西都默认 thru
function solid(o) { SOLIDS.push(o); if (o.thru) THRU.push(o); return o; }
const THRU = [];                                     // 登记过 thru 的东西；pass：人这会儿正从它前面走过去（这时它不挡人）
const thruOnGround = s => Math.abs(s.y1 - groundY((s.x1 + s.x2) / 2)) < 0.08;
function syncBox(o) { o.x1 = o.x - o.w / 2; o.x2 = o.x + o.w / 2; }
// 可以按住 E 推拉的东西：{ id, x, w, h, min, max }。只能放在平地上；lo() / hi() 可以给出会变的活动范围
function pushable(o) { o.v = 0; o.x0 = o.x; o.y1 ??= groundY(o.x); o.y2 = o.y1 + o.h; o.thru ??= true; syncBox(o); solid(o); PUSHABLES.push(o); return o; }
function placeBox(o, x) { o.x = x; o.v = 0; syncBox(o); }
// 向上升起的闸门：want = 1 打开，0 关上
function gate(o) {
  o.w ??= 0.9; o.h ??= 3.6; o.T ??= 2.8; o.y0 ??= groundY(o.x); o.open = 0; o.want = 0;
  o.x1 = o.x - o.w / 2; o.x2 = o.x + o.w / 2; o.y1 = o.y0; o.y2 = o.y0 + o.h; SOLIDS.push(o); GATES.push(o); return o;
}
function setGate(g, open) { g.open = g.want = open; g.y1 = g.y0 + g.open * (g.h + 0.15); }
// 按 E 操作的固定机关：{ x, r: 左右多远够得着, y0 / y1: 脚要站在多高（够不着的拉杆要先垫箱子）, can(), on() }
function usable(o) { USES.push(o); return o; }
// 掉下去就回到岸上的坑 / 水：{ x1, x2, y: 低于这个高度算掉下去, back(): 回到哪个 x }
function pit(o) { PITS.push(o); return o; }
function checkpoint(x, o = {}) { CPS.push({ x, ...o }); }
function cpAt(x) { let k = 0; for (let i = 0; i < CPS.length; i++) if (x >= CPS[i].x - 0.01) k = i; return k; }
// 镜头关键帧：[x, 距离, 目标高度偏移, 目标水平偏移, 抬高多少（不写就是 0）]
// 抬高：镜头在原来的位置上再升高这么多米，对着的还是同一点，于是从平视变成往下看（要看清地面以下的东西时用，比如水渠里面）
function camKeys(...k) { for (const e of k) { e.c ??= regC(); CAMKEYS.push(e); } }
function camKey(x) {
  for (let i = 1; i < CAMKEYS.length; i++) {
    const a = CAMKEYS[i - 1], b = CAMKEYS[i];
    if (x <= b[0]) { const t = sstep(a[0], b[0], x); return [lerp(a[1], b[1], t), lerp(a[2], b[2], t), lerp(a[3], b[3], t), lerp(a[4] ?? 0, b[4] ?? 0, t)]; }
  }
  const k = CAMKEYS[CAMKEYS.length - 1]; return [k[1], k[2], k[3], k[4] ?? 0];
}
function hint(cond, html) { HINTS.push([cond, html]); }
// ---- 两章接起来的地方 ----
// 三十六章在世界里排成一条路，从第 1 章一直往右走就走到第 36 章，中间没有空气墙、不传送（2026-11-17 以前不挨着的几处是“雾里的路”：走到头把人挪到下一章）。
// 本来就挨着的（第 1–8 章、第 9–16 章）照旧；其余每一处登记一段连接的路：link(n, { a, b, ... }) —— 第 n 章的路走到 x = a 为止，第 n + 1 章从 x = b 开始，
// 中间 a..b 是这一段自己的：地形 pts（[x, y]，a、b 两头的高度照两章各自的地形自动接上）、洞顶 ceil（一段或几段折线）、地面颜色 col（[x, 色]）、
// 镜头 cam（camKeys 的格式）、光 env（[x, 改哪几项]，没写的项是两头之间的插值；写 'A' / 'B' 就是左 / 右那一章在接口处的光）、脚下的声音 surf、
// 地面往前后铺到哪 front / back（一个 z 管整段，或者几段 [x1, x2, z]）、搭布景的 build(R)（vis 是它占的范围，不写就是 a..b）。
// 两章各自伸出去的那一截（地形、洞顶、地面颜色、镜头和光的关键帧、地面往前后铺到哪、路的弯、脚下的声音）在 a、b 剪掉（stitch，主循环开始以前做一次）。
// 章节自己搭的布景不剪：两章挨得多近，要照着两边的布景（vis）来定
const LINKS = [];
function link(n, o) {
  const L = { n, cam: [], env: [], pts: [], col: [], ...o }; LINKS.push(L);
  if (L.build) L.zone = defZone({ n, link: true, vis: L.vis ?? [L.a, L.b], build: L.build, update: L.update ?? (() => {}), reset: L.reset ?? (() => {}), solve: L.solve ?? (() => {}), unbuild: L.unbuild });
  return L;
}
// 剪接：每一处按章节号从左到右做。lt / rt：是不是这一处左边 / 右边那几章登记的；中间这一段自己的东西记成 n + 0.5（左右两处都不会再剪到它）
function stitch() {
  const byX = (p, q) => p[0] - q[0], at = (list, x, f) => { const l = list.slice().sort(byX); return f(l, x); };
  const lin = (l, x, g) => { if (!l.length) return null; let i = 1; while (i < l.length - 1 && x > l[i][0]) i++; if (l.length === 1) return g(l[0], l[0], 0); const p = l[i - 1], q = l[i]; return g(p, q, clamp((x - p[0]) / ((q[0] - p[0]) || 1), 0, 1)); };
  const cutPts = (list, n, a, b) => { for (let i = list.length - 1; i >= 0; i--) { const e = list[i], x = e.x ?? e[0]; if ((e.c <= n && x > a) || (e.c > n && x < b)) list.splice(i, 1); } };
  const cutRange = (list, n, a, b) => { for (let i = list.length - 1; i >= 0; i--) { const e = list[i];
    if (e.c <= n) { if (e[0] >= a) list.splice(i, 1); else e[1] = Math.min(e[1], a); } else if (e[1] <= b) list.splice(i, 1); else e[0] = Math.max(e[0], b); } };
  for (const L of LINKS.slice().sort((p, q) => p.n - q.n)) {
    const { n, a, b } = L, mid = n + 0.5, lt = e => e.c <= n, rt = e => e.c > n, tag = e => { e.c = mid; return e; };
    // 地形：两头的高度照两章各自的地形
    const gy = (l, x) => lin(l, x, (p, q, t) => p[1] + (q[1] - p[1]) * t);
    const yA = at(TERRAIN.filter(lt), a, gy), yB = at(TERRAIN.filter(rt), b, gy);
    cutPts(TERRAIN, n, a, b); TERRAIN.push(...[[a, yA], ...L.pts, [b, yB]].map(tag)); TERRAIN.sort(byX);
    // 地面颜色
    const gc = (l, x) => lin(l, x, (p, q, t) => new THREE.Color().lerpColors(p[1], q[1], t));
    const cA = at(GROUND.filter(lt), a, gc), cB = at(GROUND.filter(rt), b, gc);
    cutPts(GROUND, n, a, b); GROUND.push(...[[a, cA], ...L.col.map(([x, h]) => [x, new THREE.Color(h)]), [b, cB]].filter(e => e[1]).map(tag)); GROUND.sort(byX);
    // 镜头
    const ck = (l, x) => { if (!l.length) return null; for (let i = 1; i < l.length; i++) { const p = l[i - 1], q = l[i]; if (x <= q[0]) { const t = sstep(p[0], q[0], x); return [x, lerp(p[1], q[1], t), lerp(p[2], q[2], t), lerp(p[3], q[3], t), lerp(p[4] ?? 0, q[4] ?? 0, t)]; } }
      const k = l[l.length - 1]; return [x, k[1], k[2], k[3], k[4] ?? 0]; };
    const kA = at(CAMKEYS.filter(lt), a, ck), kB = at(CAMKEYS.filter(rt), b, ck);
    cutPts(CAMKEYS, n, a, b); CAMKEYS.push(...[kA, ...L.cam, kB].filter(Boolean).map(tag)); CAMKEYS.sort(byX);
    // 光：两头照两章各自的关键帧；中间登记的几项改在两头的插值上
    const ek = (l, x) => { const s = l.slice().sort((p, q) => p.x - q.x); if (!s.length) return null; let i = 1; while (i < s.length - 1 && x > s[i].x) i++;
      if (s.length === 1) return { ...s[0].raw }; const p = s[i - 1], q = s[i]; return envMixRaw(p.raw, q.raw, clamp((x - p.x) / ((q.x - p.x) || 1), 0, 1)); };
    const eA = ek(ENVKEYS.filter(lt), a), eB = ek(ENVKEYS.filter(rt), b) ?? eA;
    cutPts(ENVKEYS, n, a, b);
    const mixAt = x => envMixRaw(eA, eB, clamp((x - a) / (b - a), 0, 1));
    ENVKEYS.push(tag(envKey(a, eA)), ...L.env.map(([x, o]) => tag(envKey(x, o === 'A' ? eA : o === 'B' ? eB : { ...mixAt(x), ...o }))), tag(envKey(b, eB)));
    ENVKEYS.sort((p, q) => p.x - q.x);
    // 地面往前后铺到哪、路的弯、脚下的声音：两章各自的剪到 a、b；这一段自己的排在最前面（先登记的优先）
    for (const R of [GROUND_BACK, GROUND_FRONT, ZPATH, SURFS]) cutRange(R, n, a, b);
    const spans = v => v === undefined ? [] : Array.isArray(v) ? v : [[a, b, v]];     // 一个数：整段都是；也可以是几段 [x1, x2, z]
    for (const r of spans(L.front)) GROUND_FRONT.unshift(tag([...r]));
    for (const r of spans(L.back)) GROUND_BACK.unshift(tag([...r]));
    if (L.zp) ZPATH.unshift(tag([a, b, L.zp]));
    if (L.surf) SURFS.push(tag([a, b, L.surf]));
    // 洞顶：伸过来的那一段剪到 a、b（剪开的地方补一个点）
    for (let i = CEILS.length - 1; i >= 0; i--) {
      const S = CEILS[i], P0 = S.pts, cy = x => gy(P0, x);
      if (S.c <= n && P0[P0.length - 1][0] > a) { const k = P0.filter(p => p[0] < a); S.pts = k.length && k[0][0] < a ? [...k, [a, cy(a)]] : []; }
      else if (S.c > n && P0[0][0] < b) { const k = P0.filter(p => p[0] > b); S.pts = k.length && k[k.length - 1][0] > b ? [[b, cy(b)], ...k] : []; }
      if (S.pts.length < 2) CEILS.splice(i, 1);
    }
    for (const pts of L.ceil ?? []) CEILS.push({ c: mid, pts });
    joinCeil();
  }
}
// 脚下是什么（脚步声用，见 52-audio.js）：每一章一个默认的（章节对象上的 ground），这里登记例外的几段 [x1, x2, 种类]，种类也可以是 x => 种类。
// 后登记的盖住先登记的。站在方块上时看方块自己的 snd（没写就是 wood）。种类：concrete 水泥 / metal 铁板 / wood 木头 / dirt 土路 / forest 林子里的地 /
// leaves 干落叶 / grass 草地 / gravel 碎石 / sand 沙土 / mud 湿泥 / rock 湿岩石 / puddle 水洼 / wade 蹚水
const SURFS = [];
function surface(x1, x2, kind) { const r = [x1, x2, kind]; r.c = regC(); SURFS.push(r); }
function surfaceAt(x) {
  for (let i = SURFS.length - 1; i >= 0; i--) { const s = SURFS[i]; if (x >= s[0] && x < s[1]) return typeof s[2] === 'function' ? s[2](x) : s[2]; }
  return chapterAt(x).ground ?? 'concrete';
}
// 一个章节的画面和逻辑：{ n, vis: [x1, x2] 画面占的范围, build*(R) 搭建, update(dt) 每帧, reset() 回到初始, solve() 当作已经通过 }
function defZone(z) { z.root = null; z.gen = null; z.built = false; ZONES.push(z); return z; }

// ---- 玩家状态 ----
const P = { x: 2, y: 0, vx: 0, vy: 0, grounded: true, facing: 1, hw: 0.19, hh: 1.1, H: 1.24, coyote: 0, jumpBuf: 0,
  mode: 'normal', modeT: 0, grab: 0, grabObj: null, impact: 0, cp: 0, mantle: null, moved: false, jumped: false, pushed: false, used: false, speedK: 1, zo: 0, zv: 0 };
// 每一帧由各章节填写、交给主角动画的“表演指令”：hide 捂灯，alert 被灯照到，energy 灯还剩多少电，pose 额外姿势，brush 拨开路边的植物（48-brush.js）
const HX = { hide: 0, alert: 0, energy: 1, pose: null, brush: null };

function sideHit(nx, y) {      // 位置 (nx, y) 是否撞进某个方块的侧面
  for (const s of SOLIDS) if (!s.off && !s.pass && nx + P.hw > s.x1 && nx - P.hw < s.x2 && y + 0.03 < s.y2 && y + P.hh > s.y1 + 0.03) return s;
  return null;
}
function floorY(x, y) {        // 脚下的支撑面高度（地形或方块顶面）
  let f = groundY(x);
  for (const s of SOLIDS) if (!s.off && x + 0.13 > s.x1 && x - 0.13 < s.x2 && s.y2 <= y + 0.28 && (s.plat || s.y1 <= f + 0.01)) f = Math.max(f, s.y2);
  return f;
}
const standingOn = s => P.grounded && P.x + 0.13 > s.x1 && P.x - 0.13 < s.x2 && Math.abs(P.y - s.y2) < 0.03;
