
// ============================================================
//  世界数据与碰撞（单位：米；x 向右，y 向上，玩法平面 z = 0）
//  整段旅程是一条连续向右的路：八个章节各占一段 x，在各自的文件（60-ch*.js）里
//  往这里登记地形、方块、可推的东西、闸门、机关和存档点
// ============================================================
const X1 = 0, X2 = 104, X3 = 260, X4 = 392, X5 = 478, X6 = 542, X7 = 656, X8 = 772;      // 各章的原点（世界 x）
const CHAPTERS = [];                                 // { n, x0: 这一章从哪里算起, start: 出生点, name, sub }
function chapter(o) { CHAPTERS.push(o); return o; }
const chapterAt = x => { let c = CHAPTERS[0]; for (const k of CHAPTERS) if (x >= k.x0) c = k; return c; };

// 故事进度：跨章节要记住的事（存进 localStorage，下次打开接着走）
//   cat 救下了小猫 / fed 老人拿到了食物 / cleaner 1 = 电池给了清洁机器人，2 = 给了门 /
//   pump 水泵通了电 / water 给幸存者和猫留了水 / wild 野地得到了水 / ending 1 = 修复，2 = 旁路
const STORY0 = { ch: 1, done: 0, cat: false, fed: false, cleaner: 0, pump: false, water: false, wild: false, ending: 0 };
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
// 镜头关键帧：[x, 距离, 目标高度偏移, 目标水平偏移]
function camKeys(...k) { CAMKEYS.push(...k); }
function camKey(x) {
  for (let i = 1; i < CAMKEYS.length; i++) {
    const a = CAMKEYS[i - 1], b = CAMKEYS[i];
    if (x <= b[0]) { const t = sstep(a[0], b[0], x); return [lerp(a[1], b[1], t), lerp(a[2], b[2], t), lerp(a[3], b[3], t)]; }
  }
  return CAMKEYS[CAMKEYS.length - 1].slice(1);
}
function hint(cond, html) { HINTS.push([cond, html]); }
// 一个章节的画面和逻辑：{ n, vis: [x1, x2] 画面占的范围, build*(R) 搭建, update(dt) 每帧, reset() 回到初始, solve() 当作已经通过 }
function defZone(z) { z.root = null; z.gen = null; z.built = false; ZONES.push(z); return z; }

// ---- 玩家状态 ----
const P = { x: 2, y: 0, vx: 0, vy: 0, grounded: true, facing: 1, hw: 0.19, hh: 1.1, H: 1.24, coyote: 0, jumpBuf: 0,
  mode: 'normal', modeT: 0, grab: 0, grabObj: null, impact: 0, cp: 0, mantle: null, moved: false, jumped: false, pushed: false, used: false, speedK: 1 };
// 每一帧由各章节填写、交给主角动画的“表演指令”：hide 捂灯，alert 被灯照到，energy 灯还剩多少电，pose 额外姿势
const HX = { hide: 0, alert: 0, energy: 1, pose: null };

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
