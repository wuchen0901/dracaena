
// ============================================================
//  世界数据与碰撞（单位：米；x 向右，y 向上，玩法平面 z = 0）
//  整段旅程是一条连续向右的路：八个章节各占一段 x，在各自的文件（60-ch*.js）里
//  往这里登记地形、方块、可推的东西、闸门、机关和存档点
// ============================================================
const X1 = 0, X2 = 104, X3 = 260, X4 = 392, X5 = 478, X6 = 542, X7 = 656, X8 = 772;      // 各章的原点（世界 x）
// 一共二十章，排成一条路：第 1–7 章是《逃出工厂》（escape/，整段在世界的最左边，见 escape/60-kit.js 的 EX），
// 第 8–20 章是旧原型《铁锈与微光》的十三章（src/6*-ch*.js，还在原来的位置，从 x = -60 起）。
// 旧原型的第 k 章现在是第 OLD + k 章；旧文件里写章节号的地方都写成 OLD + k，文件名、注释里的“第几章”还是旧的编号。
// 《逃出工厂》原来有八章，第一章“焚化炉”2026-11-15 删掉了，后面七章往前挪了一位：escape/ 的文件名（62-e2 …）、变量名（E4X …）、
// 注释里的“第几章”还是故事文档里原来的编号（文档里的第二章“分拣”是游戏的第 1 章）
const OLD = 7;
const localN = n => n > OLD ? n - OLD : n;           // 这一章在它自己那个故事里排第几：两个故事的第一章从头教操作
const origN = n => n > OLD ? n - OLD : n + 1;         // 这一章原来的编号（《逃出工厂》删掉焚化炉以前是第几章）：布景的随机数种子、07 的灯按它算，删了一章样子也不变
const CHAPTERS = [];                                 // { n, x0: 这一章从哪里算起, start: 出生点, name, sub }
function chapter(o) {                                // 章节号必须就是它在表里的位置（startChapter、菜单都按这个找）
  if (o.n !== CHAPTERS.length + 1) console.error(`章节号不对：《${o.name}》写的是第 ${o.n} 章，排在第 ${CHAPTERS.length + 1} 个`);
  CHAPTERS.push(o); return o;
}
const chapterAt = x => { let c = CHAPTERS[0]; for (const k of CHAPTERS) if (x >= k.x0) c = k; return c; };

// 故事进度：跨章节要记住的事（存进 localStorage，下次打开接着走）
//   cat 救下了小猫 / fed 老人拿到了食物 / cleaner 1 = 电池给了清洁机器人，2 = 给了门 /
//   pump 水泵通了电 / water 给幸存者和猫留了水 / wild 野地得到了水 / ending 1 = 修复，2 = 旁路
//   《长夜》原型：bulb 灯泡在包里（旧第十二章凿好记号以后）/ room 机房的结局：1 拧回去，2 拉闸
//   《逃出工厂》加的两样在 escape/60-kit.js
const STORY0 = { ch: 1, done: 0, cat: false, fed: false, cleaner: 0, pump: false, water: false, wild: false, ending: 0, bulb: false, room: 0 };
const STORY = { ...STORY0 };

// ---- 地形：一条折线，坡度都很缓；陡的台阶、坑壁用 SOLIDS 里的方块表示 ----
const TERRAIN = [];
function terrain(...pts) { for (const p of pts) TERRAIN.push(p); }
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
function groundBack(x1, x2, z) { GROUND_BACK.push([x1, x2, z]); }
// 地面往镜头这边铺到哪里：登记过的一段 [x1, x2] 只铺到 z 为止；z 写 null 就整段不铺（山洞自己搭地面，前面是岩石的剖面）
const GROUND_FRONT = [];
function groundFront(x1, x2, z) { GROUND_FRONT.push([x1, x2, z]); }
// ---- 洞顶：折线（只在有顶的地方登记）。头顶碰到它就停；压下来挡在人身边的那一段就是一面墙 ----
// 每调用一次 ceiling() 是单独的一段，两段之间没有顶（第六章卡车底下一段、旧原型山洞一段，中间隔着好几章）
const CEIL = [];
function ceiling(...pts) { if (CEIL.length && pts.length) pts[0].gap = true; for (const p of pts) CEIL.push(p); }
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
function zpath(x1, x2, f) { ZPATH.push([x1, x2, f]); }
const pathZ = x => { for (const p of ZPATH) if (x >= p[0] && x <= p[1]) return p[2](x); return 0; };
const GROUND = [];                                   // 地面颜色的关键点 [x, 颜色]，中间线性过渡
function ground(x, hex) { GROUND.push([x, new THREE.Color(hex)]); }
function groundColor(x, out) {
  for (let i = 1; i < GROUND.length; i++) if (x <= GROUND[i][0]) return out.lerpColors(GROUND[i - 1][1], GROUND[i][1], clamp((x - GROUND[i - 1][0]) / (GROUND[i][0] - GROUND[i - 1][0]), 0, 1));
  return out.copy(GROUND[GROUND.length - 1][1]);
}

// ---- 登记表 ----
const SOLIDS = [], PUSHABLES = [], GATES = [], USES = [], PITS = [], CPS = [], ZONES = [], HINTS = [], CAMKEYS = [];
// 实心方块（从 y1 到 y2）。玩家会被侧面挡住，可以站在顶上。plat: 悬空也能站（漂在水上的木梁）
function solid(o) { SOLIDS.push(o); return o; }
function syncBox(o) { o.x1 = o.x - o.w / 2; o.x2 = o.x + o.w / 2; }
// 可以按住 E 推拉的东西：{ id, x, w, h, min, max }。只能放在平地上；lo() / hi() 可以给出会变的活动范围
function pushable(o) { o.v = 0; o.x0 = o.x; o.y1 ??= groundY(o.x); o.y2 = o.y1 + o.h; syncBox(o); SOLIDS.push(o); PUSHABLES.push(o); return o; }
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
function camKeys(...k) { CAMKEYS.push(...k); }
function camKey(x) {
  for (let i = 1; i < CAMKEYS.length; i++) {
    const a = CAMKEYS[i - 1], b = CAMKEYS[i];
    if (x <= b[0]) { const t = sstep(a[0], b[0], x); return [lerp(a[1], b[1], t), lerp(a[2], b[2], t), lerp(a[3], b[3], t), lerp(a[4] ?? 0, b[4] ?? 0, t)]; }
  }
  const k = CAMKEYS[CAMKEYS.length - 1]; return [k[1], k[2], k[3], k[4] ?? 0];
}
function hint(cond, html) { HINTS.push([cond, html]); }
// 脚下是什么（脚步声用，见 52-audio.js）：每一章一个默认的（章节对象上的 ground），这里登记例外的几段 [x1, x2, 种类]，种类也可以是 x => 种类。
// 后登记的盖住先登记的。站在方块上时看方块自己的 snd（没写就是 wood）。种类：concrete 水泥 / metal 铁板 / wood 木头 / dirt 土路 / forest 林子里的地 /
// leaves 干落叶 / grass 草地 / gravel 碎石 / sand 沙土 / mud 湿泥 / rock 湿岩石 / puddle 水洼 / wade 蹚水
const SURFS = [];
function surface(x1, x2, kind) { SURFS.push([x1, x2, kind]); }
function surfaceAt(x) {
  for (let i = SURFS.length - 1; i >= 0; i--) { const s = SURFS[i]; if (x >= s[0] && x < s[1]) return typeof s[2] === 'function' ? s[2](x) : s[2]; }
  return chapterAt(x).ground ?? 'concrete';
}
// 一个章节的画面和逻辑：{ n, vis: [x1, x2] 画面占的范围, build*(R) 搭建, update(dt) 每帧, reset() 回到初始, solve() 当作已经通过 }
function defZone(z) { z.root = null; z.gen = null; z.built = false; ZONES.push(z); return z; }

// ---- 玩家状态 ----
const P = { x: 2, y: 0, vx: 0, vy: 0, grounded: true, facing: 1, hw: 0.19, hh: 1.1, H: 1.24, coyote: 0, jumpBuf: 0,
  mode: 'normal', modeT: 0, grab: 0, grabObj: null, impact: 0, cp: 0, mantle: null, moved: false, jumped: false, pushed: false, used: false, speedK: 1 };
// 每一帧由各章节填写、交给主角动画的“表演指令”：hide 捂灯，alert 被灯照到，energy 灯还剩多少电，pose 额外姿势，brush 拨开路边的植物（48-brush.js）
const HX = { hide: 0, alert: 0, energy: 1, pose: null, brush: null };

function sideHit(nx, y) {      // 位置 (nx, y) 是否撞进某个方块的侧面
  for (const s of SOLIDS) if (!s.off && nx + P.hw > s.x1 && nx - P.hw < s.x2 && y + 0.03 < s.y2 && y + P.hh > s.y1 + 0.03) return s;
  return null;
}
function floorY(x, y) {        // 脚下的支撑面高度（地形或方块顶面）
  let f = groundY(x);
  for (const s of SOLIDS) if (!s.off && x + 0.13 > s.x1 && x - 0.13 < s.x2 && s.y2 <= y + 0.28 && (s.plat || s.y1 <= f + 0.01)) f = Math.max(f, s.y2);
  return f;
}
const standingOn = s => P.grounded && P.x + 0.13 > s.x1 && P.x - 0.13 < s.x2 && Math.abs(P.y - s.y2) < 0.03;
