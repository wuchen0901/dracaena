
// ============================================================
//  关卡数据与碰撞（单位：米；x 向右，y 向上，玩法平面 z = 0）
// ============================================================
// 地形：一条折线，坡度都很缓；陡的台阶用 SOLIDS 里的方块表示
const TERRAIN = [[-60, 0], [47.9, 0], [48, 3], [49.2, 3], [57, 0], [90, 0], [92.1, 0.0875], [96, 0.25], [104, 1.0], [110, 1.3],
  [116, 2.6], [122, 3.0], [460, 3.0]];
function groundY(x) {
  for (let i = 1; i < TERRAIN.length; i++) {
    const a = TERRAIN[i - 1], b = TERRAIN[i];
    if (x <= b[0]) return a[1] + (b[1] - a[1]) * clamp((x - a[0]) / (b[0] - a[0]), 0, 1);
  }
  return TERRAIN[TERRAIN.length - 1][1];
}
const groundSlope = x => (groundY(x + 0.15) - groundY(x - 0.15)) / 0.3;

// 实心方块（从 y1 到 y2）。玩家会被侧面挡住，可以站在顶上
const SOLIDS = [
  { id: 'wallL', x1: -9, x2: -7, y1: 0, y2: 12 },
  { id: 'beam', x1: 9.0, x2: 10.3, y1: 0, y2: 0.45 },
  { id: 'slab', x1: 15, x2: 19, y1: 0, y2: 0.9 },
  { id: 'terrace', x1: 38, x2: 48, y1: 0, y2: 3.0 },
];
const cart = { id: 'cart', x: 25.4, w: 1.5, h: 0.95, y1: 0, min: 23.4, max: 37.15, v: 0, x1: 0, x2: 0, y2: 0.95 };
function syncCart() { cart.x1 = cart.x - cart.w / 2; cart.x2 = cart.x + cart.w / 2; }
syncCart(); SOLIDS.push(cart);
const door = { id: 'door', x1: 89.55, x2: 90.45, y1: 0, y2: 3.6, open: 0, opening: false };
SOLIDS.push(door);

const LEVER = { x: 86.2, pulled: false, t: 0 };
// 探照灯：机器在背景深处（z < 0），光束扫过场地；玩家躲在矮墙前面的影子里
const WATCH = { ex: 71, ey: 3.7, ez: -20, cx: 71, amp: 10.6, w: 0.5, r: 2.15, t: 0.6, bx: 71, exposure: 0, caught: 0,
  wallZ: -0.9, wallH: 1.65, walls: [[60.6, 62.6], [66.4, 68.4], [72.4, 74.4], [78.4, 80.2]] };
// 矮墙的影子投到玩法平面 z = 0 上的区间（点光源，所以会随位置略微偏移）
const kShadow = -WATCH.wallZ / (WATCH.wallZ - WATCH.ez);
WATCH.shadows = WATCH.walls.map(([a, b]) => [a + (a - WATCH.ex) * kShadow, b + (b - WATCH.ex) * kShadow]);
const inShadow = x => WATCH.shadows.some(([a, b]) => x > a + 0.22 && x < b - 0.22);

const CHECKPOINTS = [2, 40.2, 56.6, 85];
const END_X = 121.5;

// 镜头关键帧：[x, 距离, 目标高度偏移, 目标水平偏移]
const CAMKEYS = [[-10, 14.5, 1.25, 0], [12, 15.5, 1.35, 0], [24, 18.5, 2.0, 1.5], [40, 18.5, 1.7, 0], [52, 19.5, 1.7, 1],
  [58, 20.5, 2.0, 2], [83, 20.5, 2.0, 0], [87.5, 19, 1.8, -2.4], [90.4, 18, 1.7, -1.2], [93.5, 17, 1.6, 2.5], [104, 24, 2.6, 5], [118, 32, 4.6, 8.5], [130, 34, 5, 9]];
function camKey(x) {
  for (let i = 1; i < CAMKEYS.length; i++) {
    const a = CAMKEYS[i - 1], b = CAMKEYS[i];
    if (x <= b[0]) { const t = sstep(a[0], b[0], x); return [lerp(a[1], b[1], t), lerp(a[2], b[2], t), lerp(a[3], b[3], t)]; }
  }
  return CAMKEYS[CAMKEYS.length - 1].slice(1);
}

// 玩家状态
const P = { x: 2, y: 0, vx: 0, vy: 0, grounded: true, facing: 1, hw: 0.19, hh: 1.1, H: 1.24, coyote: 0, jumpBuf: 0,
  mode: 'normal', modeT: 0, grab: 0, impact: 0, cp: 0, mantle: null, moved: false, jumped: false, pushed: false };

function sideHit(nx, y) {      // 位置 (nx, y) 是否撞进某个方块的侧面
  for (const s of SOLIDS) if (!s.off && nx + P.hw > s.x1 && nx - P.hw < s.x2 && y + 0.03 < s.y2 && y + P.hh > s.y1 + 0.03) return s;
  return null;
}
function floorY(x, y) {        // 脚下的支撑面高度（地形或方块顶面）
  let f = groundY(x);
  for (const s of SOLIDS) if (!s.off && x + 0.13 > s.x1 && x - 0.13 < s.x2 && s.y2 <= y + 0.28 && s.y1 <= f + 0.01) f = Math.max(f, s.y2);
  return f;
}
