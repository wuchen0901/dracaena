
// ============================================================
//  第十三章 · 机房（《长夜》原型 C：机房与选择。故事见 design/long-night-story.md 第三节“第十章 · 机房”和第四节“两个结局”）
//  先单独放在最后，从章节菜单进（和第九到第十一章一样）；灰模，先验证信息的顺序，美术以后再说。
//  一屏宽的小屋子，老人一直坐在里面，不站起来拦人。孩子从左往右走，三段线路把三层事实依次显出来，每一段只是一次很短的操作：
//    一 · 合上第一道闸刀：观察窗的检修机构有了电。按住检修柄往下带 —— 屋里先断电，锁销退出，配重把小遮板拉开一道缝。
//         白光挤进来，照出窗边的旧焦痕；包里的灯泡被照透，屋里备用的灯泡一齐亮起来，只有老人桌边那只旧灯没亮。
//         一松手，弹簧把手柄和遮板带回去，电又来了。老人一直望着那道光
//    二 · 合上第二道闸刀：控制台醒过来，屏幕一块块亮出孩子认得的地方（侧窗、钟表街、断桥），巡逻图上来路封着、去机房的维护通道留空；
//         旁边一排释放杆，有一根扳在释放的位置，连着停在检修位的那只空灯座（夹口朝下张着），旁边一块小屏画着落星的滑道。
//         在空灯座底下按 E 取出灯泡对一下：规格一样
//    三 · 合上第三道闸刀：头顶一片星灯稳下来。安静一会儿，另一处故障又跳起来，一段传动卡着走不顺；老人伸手去够调整杆，手停在半路。
//         孩子把接点按回去，抖动停了，另一排磨损的部件还在慢慢地转
//  老人身后是生活角落：窄床、饭盒、挂着的三件旧工作服（最小的一件和孩子身上的一样）、从孩子的高度往上长的身高刻痕、打着另一个记号的旧工具。
//  老人手边那只擦得很干净的旧灯泡是暗的：站到桌前，镜头推过去，灯头上镂空的轮廓和工具上打的记号是同一个。
//  最后两件装置：检修位的空灯座（拧回去）和右墙边的应急开罩手柄（拉闸）。两边都是按住到底才算数，中途松手原样退回；
//  后半程明显更慢、更重，有自己的声音和画面（夹口在合、锁销在退），拉闸的后半程老人撑起半个身子，举起挡光片。选择前没有倒计时。
//    拧回去：夹口咬死，那根释放杆自己弹回去，灯座沿着缆索升上去补齐钩形星群。旁边又一处故障亮起来。淡出 ——
//         椅子上坐着的是孩子，调整杆拉近了，椅背上搭着老人的外套。工作铃，城里的窗一扇扇亮起来；下一次宵禁，一个屋顶上的卷帘抬起了一条缝
//    拉闸：锁销脱出，配重落下去，外壳的遮光板慢慢分开，白光从越来越宽的缝里涌进来。孩子和老人成了剪影，包里的灯泡雪亮，
//         刚断了电的星灯也一排排自己亮起来。画面全白，只剩风声
//  结局后面不写结局名和说明；按 R 回到选择之前
// ============================================================
const X13 = 2300;
const CH13 = (() => {
  const X = X13;
  const L1 = X + 1.3, WIN = X + 2.75, WIN_Y = 2.72, LEV = X + 3.9, L2 = X + 5.4, CON = X + 7.5, SOCK = X + 10.45, SOCK_Y = 1.32, L3 = X + 11.8, FAULT = X + 12.6,
    ADJ = X + 13.2, CHAIR = X + 13.95, TABLE = X + 14.7, CLO = X + 16.0, MARKS = X + 16.9, MAIN = X + 17.45, RW = X + 18.35, CEIL = 4.2, TIP = 5.6, ROOMC = X + 9.15, SEAM = X + 9.6, CITY = X + 92;
  const BACK = -3.0, CH_Z = -0.72;                                                      // 后墙在哪；老人和椅子在走道后面一点（孩子从他身前走过去）
  const C = chapter({ n: OLD + 13, x0: X - 10, start: X - 3.2, name: '机房', sub: '一张椅子，一个老人', ground: 'metal', enter: [X - 8.2, X - 3.4],
    intro() { CAT.state = 'none'; } });
  terrain([X - 40, 0], [X + 140, 0]);
  ground(X - 40, 0x1b1f22); ground(X + 140, 0x1b1f22);
  solid({ x1: X - 9.6, x2: X - 8.6, y1: -2, y2: 30, noclimb: true });              // 身后：爬上来的台阶（还没做），不往回走
  solid({ x1: X - 0.2, x2: X + 0.2, y1: 2.38, y2: 30, noclimb: true });             // 左墙：门洞以上是墙
  solid({ x1: RW - 0.2, x2: RW + 0.8, y1: -2, y2: 30, noclimb: true });              // 右墙
  checkpoint(X - 3.2); checkpoint(X + 4.8); checkpoint(X + 11.1); checkpoint(X + 15.5);
  camKeys([X - 14, 20, 3.4, 2], [X + 24, 20.5, 3.6, 0]);                             // 机房里每一帧由下面的 roomCam 接管
  // 机房：窄、冷白；后墙之外是外面（白光），头顶是星灯的背面，再往上是外壳
  const ROOM = { fog: 0x0b1013, fogD: 0.016, hemiS: 0x8a99a4, hemiG: 0x10141a, hemiI: 0.62, keyC: 0xd8e6ee, keyI: 0.42, keyDir: [0.05, 0.55, -1], rimC: 0xbfd6e2, rimI: 0.8,
    dustC: 0xd4e2ea, dustO: 0.32, wind: 0.01, ext: 0, sky: [0x06080b, 0x06080b, 0x07090c, 0x080a0d, 0x090b0e, 0x06080b], sunP: 0, stars: 0, cloud: 0, birds: 0, flies: 0, vig: 1,
    aWind: 0.06, aWhis: 0, aLeaf: 0, aBug: 0, aDrip: 0, aFlow: 0, aRoom: 0.7, roomF: 150, aHum: 0.45, aCity: 0, aFar: 0.7, rvOut: 0, rvHall: 0.55, rvCave: 0 };
  env(X - 14, { ...ROOM, aRoom: 0.35, rvHall: 0.25, rvOut: 0.3, aWind: 0.35 }); env(X - 0.6, ROOM); env(X + 40, ROOM);
  // 城里（拧回去的结局最后两个镜头）：长夜里的街区
  const CITYE = { ...ROOM, fog: 0x0d1220, fogD: 0.01, hemiS: 0x6a7898, hemiG: 0x0a0c12, hemiI: 0.42, keyC: 0x9fb2d6, keyI: 0.3, keyDir: [-0.3, 0.7, 0.4], rimC: 0x8fa6cc, rimI: 0.4,
    sky: [0x03050c, 0x060a16, 0x0b1222, 0x121a2c, 0x182236, 0x0a0e18], stars: 1.3, aRoom: 0, aHum: 0, aCity: 0.6, rvHall: 0, rvOut: 1, aWind: 0.25, aFar: 0 };
  env(X + 62, CITYE); env(X + 140, CITYE);
  const workL = spotLight({ p: [X + 9.6, 4.0, 0.8], t: [X + 9.6, 0, -0.9], c: 0xe6f0f4, i: 3.4, a: 0.85, d: 10 });         // 顶上的工作灯：屋子中间一盏，靠门一盏（窄窄的冷白光）
  const workL2 = spotLight({ p: [X + 2.6, 4.0, 0.8], t: [X + 2.8, 0, -1.0], c: 0xe6f0f4, i: 2.6, a: 0.8, d: 9 });
  const winL = spotLight({ p: [WIN, WIN_Y, -2.7], t: [WIN + 0.7, 0, 1.4], c: 0xffffff, i: 16, a: 0.44, pen: 0.55, d: 12, on: 0 });   // 小窗漏进来的白光
  const scrL = pointLight({ p: [CON, 2.6, -1.9], c: 0x8fd8e8, i: 3.2, d: 6.5, on: 0 });                                    // 屏幕的光（第二道闸刀合上以后）
  const tableL = pointLight({ p: [TABLE + 0.05, 1.45, -0.2], c: 0xffe2b8, i: 2.2, d: 4.2 });                                // 老人桌上的小灯
  const skyL = pointLight({ p: [ROOMC, 6.6, 0.6], c: 0xffe6c0, i: 2.4, d: 14, dec: 1 });                                     // 头顶星灯的漫光
  const pinL = pointLight({ p: [X + 15.3, 7.2, -1.6], c: 0xffa040, i: 5, d: 7, on: 0 });                                        // 拉闸的后半程：大锁销旁边一盏警示灯
  const cityL = [[CITY - 6, 4.2], [CITY + 3, 5.5], [CITY + 10, 3.6]].map(([x, y]) => pointLight({ p: [x, y, -6], c: 0xffc98a, i: 3, d: 12, on: 0 }));

  // ---- 进度 ----
  // l[i] 三道闸刀合上没有，lt[i] 合上以后过了多久；seen1 小窗打开过；cmp 对过灯泡；cmpT 对灯泡这一段走到哪（-1 没在做）；
  // fault 0 还没坏 / 1 正坏着 / 2 按回去了，ft 这一段过了多久；done3 第三段做完（两件装置可以用了）；look 推近镜头的程度；lookAt 推近到哪
  const S = { l: [0, 0, 0], lt: [9, 9, 9], seen1: false, cmp: false, cmpT: -1, fault: 0, ft: 0, ft0: 0, done3: false, win: 0, locked: false, look: 0, lookAt: 'table', still: 0, winSnd: false, sk0: 0, pk0: 0 };
  // 结局：c 1 拧回去 / 2 拉闸，t 过了多久
  const END = { c: 0, t: 0, shown: false, step: 0 };
  let V = null;
  const busy = () => !!CARRY.act || S.cmpT >= 0;
  const near = (x, r = 0.9) => Math.abs(P.x - x) < r && P.y < 0.4;
  const inRoom = () => state === 'play' && ctl && P.x > X - 10 && P.x < RW && !END.c;

  // ---- 机关 ----
  const brk = [L1, L2, L3].map((x, i) => usable({ x, r: 0.75, can: () => !S.l[i] && !END.c && !busy() && (i === 0 || (i === 1 ? S.seen1 : S.cmp)), on() { S.l[i] = 1; S.lt[i] = 0; fx('knife'); } }));
  const lever = holdable({ x: LEV, r: 0.8, stand: LEV - 0.15, face: 1, keep: true, can: () => S.l[0] && !busy() && !END.c && CARRY.state === 'bag', rate: () => 0.68, back: () => 2.6, start() { fx('lever'); } });
  usable({ x: SOCK, r: 0.75, can: () => S.l[1] && CARRY.state === 'bag' && !busy() && !END.c, on() { takeOut(); } });
  usable({ x: FAULT, r: 0.75, can: () => S.fault === 1 && !busy() && !END.c, on() { S.fault = 2; S.ft = 0; fx('knife'); fx('ok'); } });
  // 拧灯：前半段灯泡往上拧进灯座、接上电亮起来（松手就拧出来）；后半段夹口一点点合拢（松手还会张开）；拧到头夹口咬死
  const screw = holdable({ x: SOCK, r: 0.75, stand: SOCK - 0.24, face: 1, can: () => S.done3 && CARRY.state === 'out' && !CARRY.act && !END.c,
    rate: k => k < 0.5 ? 0.34 : 0.14, back: k => k < 0.5 ? 0.7 : 0.32, done() { choose(1); } });
  // 拉闸：前半程断电，星灯一排排熄灭（松手就复位、灯重新亮）；后半程粗拉索绷紧、锁销一截一截往外退（松手还会滑回去）；拉到底锁销脱出
  const pull = holdable({ x: MAIN, r: 0.8, stand: MAIN - 0.16, face: 1, can: () => S.done3 && CARRY.state === 'bag' && !busy() && !END.c,
    rate: k => k < 0.5 ? 0.34 : 0.12, back: k => k < 0.5 ? 0.9 : 0.3, start() { fx('lever'); }, done() { choose(2); } });
  function takeOut() {
    P.facing = 1;
    if (!S.done3) { S.cmpT = 0; carryStart('out', { x: SOCK - 0.03, y: SOCK_Y - 0.2 - 0.04 }); }       // 对一下：举到空灯座底下
    else carryStart('out', { x: SOCK - 0.03, y: SOCK_Y - 0.2 - 0.12 });                                // 准备拧：先拿在灯座底下
  }
  hint(() => inRoom() && !S.l[0] && near(L1), '按 <b>E</b> 合上闸刀');
  hint(() => inRoom() && S.l[0] && !S.seen1 && near(LEV), '按住 <b>E</b> 往下带');
  hint(() => inRoom() && S.seen1 && !S.l[1] && near(L2), '按 <b>E</b> 合上闸刀');
  hint(() => inRoom() && S.l[1] && CARRY.state === 'bag' && !busy() && near(SOCK, 0.8), '按 <b>E</b> 取出灯泡');
  hint(() => inRoom() && S.cmp && !S.l[2] && near(L3), '按 <b>E</b> 合上闸刀');
  hint(() => inRoom() && S.fault === 1 && near(FAULT), '按 <b>E</b> 把接点按回去');
  hint(() => inRoom() && S.done3 && CARRY.state === 'out' && !CARRY.act && near(SOCK, 0.8), '按住 <b>E</b> 拧进去　松手就退回来');
  hint(() => inRoom() && S.done3 && CARRY.state === 'bag' && near(MAIN), '按住 <b>E</b> 往下拉　松手就退回来');
  Object.assign(sfx, {
    knife: () => { hit(2600, 3, 0.12, 0.05); tone(150, 80, 0.2, 0.18, 'square'); for (let i = 0; i < 4; i++) hit(R2(3000, 6000), 2, 0.06, 0.03, 'bandpass', 0.05 + i * 0.04); },
    spring: () => { hit(700, 2, 0.16, 0.08); tone(420, 160, 0.12, 0.16, 'square'); },
    ratchet: () => { hit(2400, 4, 0.07, 0.025); hit(800, 2, 0.05, 0.04); },
    bite: () => { hit(160, 1, 0.5, 0.35, 'lowpass'); tone(110, 70, 0.25, 0.3, 'square'); hit(1900, 2, 0.12, 0.1); },
    pinStep: () => { hit(140, 0.8, 0.45, 0.6, 'lowpass'); tone(75, 48, 0.3, 0.55); hit(900, 1.5, 0.12, 0.2); snd('creak', { gain: 0.25, rate: 0.6, wet: 0.8 }); },
    boom: () => { hit(70, 0.6, 0.9, 2.2, 'lowpass'); tone(48, 26, 0.45, 2.4); snd('rumble', { gain: 0.6, wet: 1 }); },
    clank13: () => snd('clank', { gain: 0.35, rate: 0.85, wet: 0.6 }),
    relayOff: () => { hit(1800, 3, 0.08, 0.03); tone(260, 120, 0.05, 0.12, 'square'); },
    fit: () => { hit(1500, 3, 0.08, 0.04); tone(880, 880, 0.03, 0.12); },
    bell: (f = 740, v = 1) => { for (let n = 0; n < 3; n++) for (const [m, a] of [[1, 0.1], [2.4, 0.045], [4.1, 0.025], [5.9, 0.012]]) tone(f * m, f * m * 0.996, a * v, 2.6, 'sine', n * 0.95); },
  });
  FAR[OLD + 13] = ['relay', 'creak', 'hum2', 'relay'];

  // ---- 头顶的星灯：几排等距的灯座挂在缆索上，一起慢慢往右挪；钩形星群在机房正上方，少了钩尖那一颗 ----
  // rows：[高, 深, 间距]；HOOK：钩形星群各颗的位置（相对 SOCK），最后一颗（钩尖）是空的 —— 它的灯座就是检修位上那只
  const ROWS = [[5.15, -2.0, 1.15], [6.85, -2.6, 1.2], [8.3, -3.0, 1.25]];
  const HOOK = [[-1.55, 7.4], [-0.8, 7.57], [-0.08, 7.37], [0.38, 6.85], [0.46, 6.2]];
  const LAMP = { rows: [], hook: [], speed: 0.1, run: 1, off: [0, 0, 0, 0], jit: 0, flick: 1, pos: 0 };

  function* build(R) {
    const v = {}, own = m => { m.userData.own = true; return m; };
    const plate_ = lam(0x2a3338), plate2 = lam(0x222a2f), dark = MAT.dark;
    // ---------------- 屋子：后墙、左右墙、顶 ----------------
    // 后墙：一块块铁板，铆钉；小窗那里是一道缝（画布上挖空，后面是白光），四周一圈旧焦痕
    backdrop(X - 0.3, RW + 0.4, 0, CEIL + 0.1, BACK, 40, g => {
      setInk(g, '#202a30'); box(g, X - 0.3, 0, RW - X + 0.7, CEIL + 0.1);
      for (let x = X; x < RW; x += 1.6) { g.fillStyle = 'rgba(0,0,0,.35)'; box(g, x, 0, 0.04, CEIL); g.fillStyle = 'rgba(160,190,200,.06)'; box(g, x + 0.04, 0, 0.03, CEIL); }
      for (const y of [1.1, 2.3, 3.5]) { g.fillStyle = 'rgba(0,0,0,.3)'; box(g, X - 0.3, y, RW - X + 0.7, 0.035); }
      g.fillStyle = 'rgba(150,170,175,.18)'; for (let x = X + 0.2; x < RW; x += 0.4) for (const y of [0.25, 1.25, 2.45, 3.65]) disc(g, x, y, 0.018);
      // 焦痕：从缝里往外烧黑的一圈，越靠近越黑
      for (let i = 0; i < 9; i++) { const gr = g.createRadialGradient(WIN, WIN_Y, 0.2, WIN, WIN_Y, 0.6 + i * 0.14); gr.addColorStop(0, 'rgba(8,6,4,.32)'); gr.addColorStop(1, 'rgba(8,6,4,0)'); g.fillStyle = gr; g.fillRect(WIN - 2, WIN_Y - 2, 4, 4); }
      g.strokeStyle = 'rgba(10,8,6,.55)'; g.lineWidth = 0.025; for (let i = 0; i < 18; i++) { const a = rr(0, 6.28), r0 = rr(0.5, 0.6); line(g, [[WIN + Math.cos(a) * r0, WIN_Y + Math.sin(a) * r0 * 0.6], [WIN + Math.cos(a) * (r0 + rr(0.2, 0.6)), WIN_Y + Math.sin(a) * (r0 + rr(0.15, 0.4)) * 0.6]], 0.02); }
      g.clearRect(WIN - 0.48, WIN_Y - 0.12, 0.96, 0.24);                                // 观察缝
    }, { lit: true });
    const outside = add(R, new THREE.PlaneGeometry(1.4, 0.6), own(new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false })), WIN, WIN_Y, BACK - 0.12, false);   // 缝外面：白光
    v.outside = outside;
    // 白光挤进来：缝口一圈亮（亮里面焦痕是暗的，看得出来）、一束光斜着落到地上
    v.slitGlow = glow(R, 0xffffff, 3.4, 0, WIN, WIN_Y, BACK + 0.25); v.slitGlow.renderOrder = 55;
    { const len = 5.2, geo = new THREE.ConeGeometry(0.75, len, 24, 1, true); geo.translate(0, -len / 2, 0); geo.rotateX(-Math.PI / 2);
      v.ray = new THREE.Mesh(geo, own(new THREE.MeshBasicMaterial({ map: beamGradTex(), color: 0xf4f6f2, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false })));
      v.ray.position.set(WIN, WIN_Y, BACK + 0.1); v.ray.lookAt(WIN + 0.8, 0, 1.6); v.ray.scale.set(1, 0.35, 1); v.ray.renderOrder = 56; R.add(v.ray); }
    yield;
    add(R, bx(0.4, CEIL + 0.3 - 2.38, 4.6), plate_, X, 2.38 + (CEIL + 0.3 - 2.38) / 2, BACK + 2.3);   // 左墙门洞以上
    add(R, bx(0.4, CEIL + 0.3, 1.6), plate_, X, (CEIL + 0.3) / 2, BACK + 0.8);         // 左墙门洞后面的一截
    add(R, bx(0.12, 2.38, 0.12), MAT.steel, X + 0.18, 1.19, -1.4); add(R, bx(0.12, 2.38, 0.12), MAT.steel, X + 0.18, 1.19, 1.0);    // 门框
    add(R, bx(0.4, CEIL + 0.3, 4.6), plate_, RW, (CEIL + 0.3) / 2, BACK + 2.3);       // 右墙
    add(R, bx(RW - X + 0.6, 0.26, 4.6), plate2, ROOMC, CEIL + 0.13, BACK + 2.3);       // 顶（剖开的这一面朝着镜头）
    for (let x = X + 1.6; x < RW; x += 3.2) add(R, bx(0.14, 0.3, 4.6), dark, x, CEIL - 0.12, BACK + 2.3);
    // 地上一圈磨亮的走道
    decal(R, X - 9, RW, -2.6, 1.6, 0, 12, g => { g.fillStyle = 'rgba(150,170,180,.06)'; g.fillRect(X - 9, -0.6, RW - X + 9, 1.2); g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 0.03; for (let x = X - 9; x < RW; x += 1.2) { g.beginPath(); g.moveTo(x, -2.6); g.lineTo(x, 1.6); g.stroke(); } });
    yield;
    // ---------------- 外面：维护台和栏杆；头顶的外壳 ----------------
    for (let x = X - 8.6; x < X - 0.4; x += 1.4) add(R, bx(0.05, 1.0, 0.05), MAT.steel, x, 0.5, 1.2);
    add(R, bx(8.4, 0.05, 0.05), MAT.steel, X - 4.6, 1.0, 1.2); add(R, bx(8.4, 0.05, 0.05), MAT.steel, X - 4.6, 0.55, 1.2);
    // 外壳：从后墙往上，一整片暗的遮光板，接缝、肋。在 SEAM 处有一道竖着的接缝 —— 拉闸以后从这里分开
    const shellDraw = (x1, x2) => g => {
      setInk(g, '#11171b'); box(g, x1, CEIL - 0.2, x2 - x1, 40);
      for (let x = Math.ceil(x1 / 3.4) * 3.4; x < x2; x += 3.4) { g.fillStyle = 'rgba(0,0,0,.5)'; box(g, x, CEIL, 0.07, 40); g.fillStyle = 'rgba(120,150,160,.05)'; box(g, x + 0.07, CEIL, 0.05, 40); }
      for (let y = CEIL + 2.2; y < 40; y += 2.8) { g.fillStyle = 'rgba(0,0,0,.45)'; box(g, x1, y, x2 - x1, 0.06); }
      g.fillStyle = 'rgba(0,0,0,.6)'; for (let x = Math.ceil(x1 / 6.8) * 6.8; x < x2; x += 6.8) box(g, x - 0.25, CEIL, 0.5, 40);   // 肋
    };
    v.shellL = backdrop(X - 40, SEAM, CEIL - 0.2, 36, -3.4, 8, shellDraw(X - 40, SEAM), { fog: false });
    v.shellR = backdrop(SEAM, X + 60, CEIL - 0.2, 36, -3.4, 8, shellDraw(SEAM, X + 60), { fog: false });
    v.shellL.userData.x0 = v.shellL.position.x; v.shellR.userData.x0 = v.shellR.position.x;
    v.white = add(R, new THREE.PlaneGeometry(90, 40), own(new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false, transparent: true, opacity: 0 })), SEAM, CEIL + 18, -3.7, false);
    v.white.renderOrder = -20;
    v.flood = add(R, new THREE.PlaneGeometry(RW - X + 1, CEIL), own(new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })), ROOMC, CEIL / 2, BACK + 0.05, false);   // 白光泼进屋里：后墙一片亮
    yield;
    // ---------------- 头顶的星灯 ----------------
    const sockGeo = cy(0.05, 0.06, 0.1, 8), coreGeo = new THREE.SphereGeometry(0.075, 10, 8);
    LAMP.rows = ROWS.map(([y, z, gap], r) => {
      add(R, bx(80, 0.025, 0.025), dark, X + 10, y + 0.22, z, false);                  // 缆索
      const mat = own(new THREE.MeshBasicMaterial({ color: 0xfff0d0 })), list = [];
      for (let x = X - 26; x < X + 46; x += gap) {
        const g = grp(R, x, y, z); add(g, sockGeo, dark, 0, 0.09, 0, false); add(g, bx(0.01, 0.12, 0.01), dark, 0, 0.18, 0, false); add(g, coreGeo, mat, 0, -0.02, 0, false);
        const s = glow(g, 0xffe2b0, lerp(1.0, 0.75, r / 2), 0.7, 0, -0.02, 0.02); s.renderOrder = 40;
        list.push({ g, s, x0: x, ph: rr(0, 6.28) });
      }
      return { y, z, gap, mat, list };
    });
    LAMP.hook = HOOK.map(([dx, y]) => { const g = grp(R, SOCK + dx, y, 0); add(g, sockGeo, dark, 0, 0.09, 0, false); add(g, bx(0.012, 0.3, 0.012), dark, 0, 0.3, 0, false);
      const core = add(g, coreGeo, own(new THREE.MeshBasicMaterial({ color: 0xfff2d8 })), 0, -0.02, 0, false); core.scale.setScalar(1.25); const s = glow(g, 0xffe8c0, 1.35, 0.95, 0, -0.02, 0.03); s.renderOrder = 41; return { g, s, core }; });
    yield;
    // ---------------- 一 · 观察窗：遮板、锁销、配重都露在外面；检修柄通过拉索连着锁销 ----------------
    v.knife = [L1, L2, L3].map(x => {                                                // 闸刀：一只铁盒，一把会扳上去的刀
      const g = grp(R, x, 0, -1.25); add(g, bx(0.08, 1.1, 0.08), MAT.steel, 0, 0.55, -0.1); add(g, bx(0.36, 0.46, 0.2), plate2, 0, 1.25, 0);
      for (const dx of [-0.07, 0.07]) add(g, bx(0.03, 0.08, 0.06), MAT.copper, dx, 1.12, 0.12, false);
      const arm = grp(g, 0, 1.12, 0.14); add(arm, bx(0.03, 0.2, 0.03), MAT.copper, 0, 0.1, 0, false); add(arm, cy(0.022, 0.022, 0.1, 8), lam(0x6a2a20), 0, 0.23, 0, false);
      const lamp = unlit(0x2a1210); add(g, new THREE.SphereGeometry(0.035, 8, 6), lamp, 0.12, 1.42, 0.11, false);
      return { g, arm, lamp };
    });
    tube(R, [[L1, 1.5, -1.3], [L1 + 0.2, 3.3, -2.8], [WIN - 0.9, 3.3, -2.9], [WIN - 0.6, WIN_Y + 0.3, -2.9]], 0.022, dark, 12);      // 第一条线：到小窗的机构
    tube(R, [[L2, 1.5, -1.3], [L2 + 0.4, 1.0, -2.6], [CON - 1.2, 1.0, -2.0]], 0.022, dark, 10);                                     // 第二条线：到控制台
    tube(R, [[L3, 1.5, -1.3], [L3, 3.4, -2.8], [L3 - 0.5, CEIL - 0.1, -2.6]], 0.022, dark, 10);                                       // 第三条线：往上，到星灯回路
    v.pulse = [0, 1, 2].map(() => glow(R, 0xbfe8ff, 0.35, 0, 0, 0, 0));
    v.pulsePath = [[[L1, 1.5, -1.3], [L1 + 0.2, 3.3, -2.8], [WIN - 0.9, 3.3, -2.9], [WIN - 0.6, WIN_Y + 0.3, -2.85]], [[L2, 1.5, -1.3], [L2 + 0.4, 1.0, -2.6], [CON - 1.2, 1.0, -2.0]], [[L3, 1.5, -1.3], [L3, 3.4, -2.8], [L3 - 0.5, CEIL - 0.1, -2.6]]].map(p => new THREE.CatmullRomCurve3(p.map(q => V3(...q))));
    // 小窗的机构
    add(R, bx(1.3, 0.1, 0.08), plate2, WIN, WIN_Y + 0.22, BACK + 0.06); add(R, bx(1.3, 0.1, 0.08), plate2, WIN, WIN_Y - 0.22, BACK + 0.06);   // 上下几层压着的铁板
    for (const dx of [-0.62, 0.62]) add(R, bx(0.08, 0.6, 0.1), plate2, WIN + dx, WIN_Y, BACK + 0.07);
    v.shut = add(R, bx(1.12, 0.34, 0.05), plate_, WIN, WIN_Y, BACK + 0.13);               // 遮板
    for (const y of [-0.1, 0, 0.1]) add(v.shut, bx(1.12, 0.012, 0.055), dark, 0, y, 0, false);
    v.pin = add(R, cy(0.035, 0.035, 0.32, 10), MAT.steel, WIN + 0.72, WIN_Y + 0.04, BACK + 0.2); v.pin.rotation.z = Math.PI / 2;   // 锁销：横着插在遮板边上
    add(R, bx(0.12, 0.14, 0.1), plate2, WIN + 0.82, WIN_Y + 0.04, BACK + 0.12);
    add(R, cy(0.07, 0.07, 0.04, 14), MAT.steel, WIN - 0.75, 3.55, BACK + 0.2).rotation.x = Math.PI / 2;     // 滑轮
    v.cw = add(R, bx(0.16, 0.24, 0.12), lam(0x4a4036), WIN - 0.82, 3.0, BACK + 0.22);   // 配重
    v.cwRope = add(R, bx(0.01, 1, 0.01), dark, WIN - 0.82, 3.3, BACK + 0.22, false);
    add(R, bx(0.5, 0.01, 0.01), dark, WIN - 0.5, 3.6, BACK + 0.2, false);
    // 检修柄：一只铁盒在右边，手柄朝左伸出来，往下带
    add(R, bx(0.32, 1.0, 0.3), plate2, LEV + 0.47, 0.5, -0.35); v.lev = grp(R, LEV + 0.42, 0.85, -0.12);
    add(v.lev, bx(0.45, 0.05, 0.05), MAT.steel, -0.225, 0, 0, false); add(v.lev, cy(0.03, 0.03, 0.16, 8), lam(0x8a3a28), -0.45, 0, 0, false).rotation.x = Math.PI / 2;
    tube(R, [[LEV + 0.46, 1.1, -0.4], [LEV + 0.5, 3.0, -2.7], [WIN + 1.0, 3.0, -2.85], [WIN + 0.88, WIN_Y + 0.06, -2.82]], 0.012, dark, 10);   // 拉索：从检修柄到锁销
    // 备用的灯泡：窗下一箱，老人桌子上方的架子上三只（白光进来时一齐亮起来）
    mkCrate(R, { x: X + 4.75, y1: 0, w: 0.7, h: 0.42 }, 'wood').position.z = -1.7;
    v.spares = [];
    for (let i = 0; i < 5; i++) { const b = makeBulb(R, null, { glow: 0.12 }); b.g.position.set(X + 4.5 + i * 0.13, 0.62, -1.7 + (i % 2) * 0.12); b.g.rotation.z = 0.2 * (i % 3 - 1); v.spares.push(b); }
    add(R, bx(0.9, 0.04, 0.26), lam(0x3a3028), TABLE - 0.95, 2.0, BACK + 0.2);
    for (let i = 0; i < 3; i++) { const b = makeBulb(R, null, { glow: 0.12 }); b.g.position.set(TABLE - 1.25 + i * 0.3, 2.02 + 0.175, BACK + 0.22); v.spares.push(b); }
    yield;
    // ---------------- 二 · 控制台、屏幕、释放杆、检修位的空灯座 ----------------
    add(R, bx(3.1, 0.95, 0.75), plate2, CON, 0.475, -2.2); add(R, bx(3.2, 0.06, 0.85), MAT.steel, CON, 0.97, -2.15);
    for (let i = 0; i < 9; i++) add(R, bx(0.06, 0.02, 0.06), lam(0x6a7a80), CON - 1.3 + i * 0.32, 1.01, -1.95, false);
    v.screens = [];
    const SCR = [['window', CON - 1.08, 2.95, 1.0, 0.62], ['clock', CON, 2.95, 1.0, 0.62], ['bridge', CON + 1.08, 2.95, 1.0, 0.62], ['map', CON, 2.08, 3.16, 0.62]];
    for (const [kind, x, y, w, h] of SCR) {
      add(R, bx(w + 0.12, h + 0.12, 0.08), dark, x, y, BACK + 0.08);
      const mat = own(new THREE.MeshBasicMaterial({ map: screenTex(kind), color: 0x000000, fog: false }));
      const m = add(R, new THREE.PlaneGeometry(w, h), mat, x, y, BACK + 0.13, false); v.screens.push({ m, mat, kind });
    }
    { const x = SOCK + 0.95, y = 2.55; add(R, bx(0.64, 0.46, 0.08), dark, x, y, BACK + 0.08); const mat = own(new THREE.MeshBasicMaterial({ map: screenTex('chute'), color: 0x000000, fog: false }));
      v.screens.push({ m: add(R, new THREE.PlaneGeometry(0.56, 0.38), mat, x, y, BACK + 0.13, false), mat, kind: 'chute' }); }
    // 一排释放杆：每一根连着维护轨道上的一只灯座。第 4 根扳在释放的位置 —— 连着检修位上的那只
    v.rel = [];
    for (let i = 0; i < 7; i++) {
      const x = SOCK - 0.9 + i * 0.3, g = grp(R, x, 1.62, BACK + 0.12); add(g, bx(0.12, 0.2, 0.06), plate2, 0, 0, 0); const arm = grp(g, 0, 0, 0.05);
      add(arm, bx(0.03, 0.34, 0.03), MAT.steel, 0, 0.17, 0, false); add(arm, new THREE.SphereGeometry(0.035, 8, 6), lam(0x8a3a28), 0, 0.34, 0, false);
      const lamp = unlit(0x1a1410); add(g, new THREE.SphereGeometry(0.025, 8, 6), lamp, 0, -0.16, 0.04, false);
      add(R, bx(0.012, CEIL - 1.9, 0.012), dark, x, (CEIL + 1.9) / 2, BACK + 0.14, false);      // 连杆：往上通到维护轨道
      v.rel.push({ arm, lamp, rel: i === 3 });
    }
    add(R, bx(2.6, 0.08, 0.1), MAT.steel, SOCK + 0.0, CEIL - 0.25, BACK + 0.4); add(R, bx(0.06, 0.06, Math.abs(BACK) - 0.3), MAT.steel, SOCK, CEIL - 0.25, BACK / 2 + 0.2);   // 维护轨道，拐到检修位上方
    // 检修位：灯座挂在缆索上，被一只卡扣停住；灯头的夹口朝下张开
    v.sockCable = add(R, bx(0.016, 1, 0.016), dark, SOCK, 3, 0, false);
    v.sock = grp(R, SOCK, SOCK_Y, 0);
    add(v.sock, cy(0.07, 0.078, 0.17, 16), plate2, 0, 0.085, 0); add(v.sock, cy(0.05, 0.05, 0.02, 16), MAT.steel, 0, 0.005, 0, false);
    v.jaws = [-1, 1].map(s => { const j = grp(v.sock, s * 0.055, 0.01, 0); add(j, bx(0.018, 0.075, 0.07), MAT.steel, 0, -0.035, 0, false); add(j, bx(0.03, 0.012, 0.07), MAT.steel, -s * 0.01, -0.07, 0, false); return j; });
    v.sockLamp = unlit(0x2a1210); add(v.sock, new THREE.SphereGeometry(0.018, 8, 6), v.sockLamp, 0.075, 0.12, 0.03, false);
    v.tipGlow = glow(R, 0xffe8c0, 1.35, 0, SOCK, TIP - 0.12, 0.05); v.tipGlow.renderOrder = 41;     // 灯座升到钩尖以后：和旁边几颗一样亮的一团光
    v.clip = grp(R, SOCK, SOCK_Y + 0.45, 0); add(v.clip, bx(0.14, 0.06, 0.08), lam(0x9a8a3a), 0, 0, 0); add(v.clip, bx(0.5, 0.03, 0.03), MAT.steel, -0.3, 0, -0.02, false);   // 维护卡扣
    yield;
    // ---------------- 三 · 故障指示、传动、调整杆 ----------------
    add(R, bx(0.55, 0.7, 0.08), plate2, FAULT, 1.75, BACK + 0.08);
    v.faultLamp = unlit(0x2a1210); add(R, new THREE.SphereGeometry(0.05, 10, 8), v.faultLamp, FAULT, 1.95, BACK + 0.15, false); v.faultGlow = glow(R, 0xff5a3a, 0.7, 0, FAULT, 1.95, BACK + 0.2);
    add(R, bx(0.3, 1.0, 0.3), plate2, FAULT, 0.5, -1.2); v.contact = add(R, bx(0.12, 0.08, 0.12), MAT.copper, FAULT, 1.04, -1.2, false);   // 接点：按回去
    v.gears = [[FAULT - 0.15, 3.2, 0.42, 1], [FAULT + 0.55, 3.45, 0.28, -1], [X + 13.6, 3.3, 0.36, 1], [X + 14.25, 3.55, 0.22, -1]].map(([x, y, r, s], i) => {
      const g = grp(R, x, y, BACK + 0.15); add(g, cy(r, r, 0.06, 18), i < 2 ? MAT.steel : MAT.rust, 0, 0, 0).rotation.x = Math.PI / 2;
      for (let k = 0; k < 10; k++) { const a = k / 10 * 6.2832; add(g, bx(0.06, 0.08, 0.06), i < 2 ? MAT.steel : MAT.rust, Math.cos(a) * r, Math.sin(a) * r, 0, false).rotation.z = a; }
      add(g, bx(r * 1.6, 0.04, 0.07), dark, 0, 0, 0.02, false); return { g, r, s, a: 0 };
    });
    v.fault2 = unlit(0x2a1a08); add(R, new THREE.SphereGeometry(0.045, 10, 8), v.fault2, SOCK + 1.55, 3.55, BACK + 0.15, false); v.fault2Glow = glow(R, 0xffb040, 0.6, 0, SOCK + 1.55, 3.55, BACK + 0.2);
    add(R, bx(0.18, 0.14, 0.18), plate2, ADJ, 0.07, CH_Z + 0.05); v.adj = grp(R, ADJ, 0.12, CH_Z + 0.05); add(v.adj, cy(0.02, 0.02, 0.95, 8), MAT.steel, 0, 0.47, 0, false); add(v.adj, new THREE.SphereGeometry(0.04, 8, 6), lam(0x8a3a28), 0, 0.95, 0, false);
    v.adj.rotation.z = 0.12;
    v.adjExt = add(R, cy(0.016, 0.016, 0.7, 6), MAT.steel, ADJ + 0.36, 1.0, CH_Z + 0.05, false); v.adjExt.rotation.z = Math.PI / 2 - 0.1; v.adjExt.visible = false;   // 拉近了的调整杆（结局）
    yield;
    // ---------------- 老人、椅子、桌子、生活角落 ----------------
    v.chair = grp(R, CHAIR, 0, CH_Z);
    const wd = lam(0x3c3128); add(v.chair, bx(0.5, 0.05, 0.48), wd, 0.04, 0.45, 0); add(v.chair, bx(0.05, 0.62, 0.46), wd, 0.3, 0.76, 0);
    for (const [dx, dz] of [[-0.18, -0.2], [0.26, -0.2], [-0.18, 0.2], [0.26, 0.2]]) add(v.chair, bx(0.04, 0.45, 0.04), dark, dx, 0.22, dz);
    v.coat = grp(v.chair, 0.31, 0.95, 0); add(v.coat, bx(0.13, 0.5, 0.5), lam(0x5f6b63, { side: THREE.DoubleSide }), 0.02, -0.12, 0); add(v.coat, bx(0.08, 0.36, 0.2), lam(0x56615a), 0.08, -0.4, 0.2); v.coat.visible = false;
    v.old = makeNPC('G', R, { x: CHAIR, z: CH_Z, facing: -1 });
    // 桌子：旧灯泡（暗的，擦得很干净，立在一只小圈座上）、叠着的挡光片、修过很多次的护目镜、饭盒
    add(R, bx(0.7, 0.04, 0.5), wd, TABLE, 0.72, -0.85); for (const dx of [-0.3, 0.3]) for (const dz of [-0.2, 0.2]) add(R, bx(0.035, 0.72, 0.035), dark, TABLE + dx, 0.36, -0.85 + dz);
    add(R, cy(0.035, 0.04, 0.02, 14), MAT.steel, TABLE + 0.2, 0.75, -0.6, false);
    v.oldBulb = makeBulb(R, 'chevron', { glow: 0 }); v.oldBulb.g.position.set(TABLE + 0.2, 0.76 + 0.168, -0.6);
    v.shields = []; for (let i = 0; i < 4; i++) { const m = add(R, bx(0.34, 0.012, 0.42), lam(0x15191b), TABLE - 0.12, 0.75 + i * 0.014, -0.98, false); m.rotation.y = 0.05 * i; v.shields.push(m); }
    v.shield = grp(R, 0, 0, 0); add(v.shield, bx(0.012, 0.42, 0.34), lam(0x15191b), 0, 0, 0); add(v.shield, bx(0.02, 0.1, 0.04), lam(0x3a3028), 0.02, -0.2, 0); v.shield.visible = false;   // 举起来的那一片
    { const g = grp(R, TABLE - 0.18, 0.79, -0.68); add(g, bx(0.2, 0.05, 0.08), lam(0x2a2a26), 0, 0, 0); for (const dx of [-0.055, 0.055]) add(g, cy(0.04, 0.04, 0.04, 12), lam(0x4a5658), dx, 0, 0.05).rotation.x = Math.PI / 2; add(g, bx(0.24, 0.015, 0.02), lam(0x6a6050), 0, 0.02, -0.045); }
    add(R, bx(0.24, 0.1, 0.15), lam(0x6a7070), TABLE + 0.22, 0.79, -1.0);             // 饭盒
    // 工具板：在桌子正后面的墙上，几件旧工具，每一件都打着同一个记号（尖角）；中间一块铜牌上打着大的
    v.tools = plate(R, toolTex(), 1.0, 0.7, TABLE + 0.05, 1.78, BACK + 0.11, 0xb8b8b8, { fog: true, order: 2 });   // 透明的那一类、排在后墙后面画（不然会被后墙盖住）
    // 挂着的旧工作服：一件比一件小，最小的一件和孩子身上的一样（米白的毛衣）
    for (const [dx, s, col] of [[-0.55, 1.15, 0x5f6b63], [0, 0.95, 0x8f8a7e], [0.5, 0.72, 0xc4beb0]]) {
      const g = grp(R, CLO + dx, 1.98, BACK + 0.2); add(g, cy(0.008, 0.008, 0.06, 6), MAT.steel, 0, 0.03, 0, false);
      const m = lam(col); add(g, bx(0.34 * s, 0.46 * s, 0.07), m, 0, -0.25 * s, 0); for (const sx of [-1, 1]) { const sl = add(g, bx(0.09 * s, 0.4 * s, 0.06), m, sx * 0.2 * s, -0.22 * s, 0); sl.rotation.z = sx * 0.12; }
    }
    // 身高刻痕：从孩子头顶的高度开始，一道一道往上长到大人的个子
    plate(R, heightTex(), 0.5, 1.0, MARKS, 1.4, BACK + 0.11, 0xffffff, { fog: true, order: 2 });
    // 窄床
    add(R, bx(2.1, 0.32, 0.78), dark, X + 16.3, 0.16, -2.45); add(R, bx(2.0, 0.12, 0.72), MAT.cloth, X + 16.3, 0.38, -2.45); add(R, bx(1.2, 0.07, 0.74), lam(0x4a4f48), X + 16.6, 0.47, -2.43); add(R, bx(0.4, 0.1, 0.5), lam(0xa8a290), X + 15.45, 0.48, -2.5);
    yield;
    // ---------------- 应急开罩手柄（拉闸）和它连着的大锁销、配重 ----------------
    add(R, bx(0.42, 1.4, 0.4), plate2, MAIN + 0.55, 0.7, -0.45); add(R, bx(0.5, 0.1, 0.46), lam(0x8a6a2a), MAIN + 0.55, 1.4, -0.45);   // 手柄的座（顶上一道黄色的警示漆）
    for (let i = 0; i < 4; i++) add(R, bx(0.43, 0.05, 0.41), i % 2 ? lam(0x1a1a18) : lam(0x8a6a2a), MAIN + 0.55, 0.2 + i * 0.1, -0.45, false);
    v.main = grp(R, MAIN + 0.48, 0.95, -0.18); add(v.main, bx(0.5, 0.08, 0.08), MAT.steel, -0.25, 0, 0, false); add(v.main, cy(0.045, 0.045, 0.24, 8), lam(0x9a2a1e), -0.5, 0, 0, false).rotation.x = Math.PI / 2;
    tube(R, [[MAIN + 0.6, 1.3, -0.5], [RW - 0.3, 1.5, -0.8], [RW - 0.3, CEIL - 0.1, -1.6]], 0.045, dark, 10);       // 粗拉索：顺着右墙上去，穿过顶
    // 外壳基座上的大锁销：横着插在一只大支架里，挡着配重的锁扣；粗拉索从右边连过来
    const PX = X + 15.9, PY = 6.1, PZ = -3.05;
    add(R, bx(0.5, 1.5, 0.6), plate2, PX, PY, PZ); add(R, bx(0.5, 1.5, 0.6), plate2, PX - 1.5, PY, PZ);
    v.bigPin = grp(R, PX - 0.6, PY, PZ + 0.1); add(v.bigPin, cy(0.26, 0.26, 2.6, 18), MAT.steel, 0, 0, 0).rotation.z = Math.PI / 2;
    for (let i = 0; i < 5; i++) add(v.bigPin, cy(0.29, 0.29, 0.06, 18), dark, -1.0 + i * 0.42, 0, 0, false).rotation.z = Math.PI / 2;   // 一截一截的刻环
    v.cwBig = grp(R, PX - 0.75, PY - 1.4, PZ - 0.1); add(v.cwBig, bx(1.3, 1.6, 0.6), lam(0x3a3631), 0, 0, 0); add(v.cwBig, bx(0.3, 0.4, 0.3), dark, 0, 0.95, 0);
    v.cwChain = add(R, bx(0.05, 1, 0.05), dark, PX - 0.75, 0, PZ - 0.1, false);
    v.bigCable = [0, 1, 2, 3, 4, 5, 6, 7].map(() => add(R, cy(0.045, 0.045, 1, 8), dark, 0, 0, 0, false));
    v.cableA = V3(RW - 0.3, CEIL + 0.1, -1.8); v.cableB = V3(PX + 1.2, PY, PZ + 0.1);
    v.dust = []; for (let i = 0; i < 24; i++) { const s = glow(R, 0x8a8a84, 0.12, 0, 0, 0, 0); v.dust.push({ s, t: 9, vx: 0, vy: 0 }); }
    yield;
    // ---------------- 城里（拧回去的结局最后两个镜头）----------------
    backdrop(CITY - 30, CITY + 30, -2, 30, -60, 6, g => {                              // 远处的钩形星群（补齐了）和几排房顶
      setInk(g, '#0a0e18'); for (let x = CITY - 30; x < CITY + 30; x += rr(2, 5)) box(g, x, -2, rr(2, 5), rr(4, 9));
    }, { fog: false, order: -2000 });
    v.cityHook = [[-1.6, 13.3], [-0.8, 13.5], [0, 13.3], [0.5, 12.8], [0.6, 12.1], [0.2, 11.6]].map(([dx, y]) => glow(R, 0xffe6c0, 1.3, 0.95, CITY + 6 + dx * 1.3, y, -40));
    const B = [[CITY - 15, 7.5, 5.5], [CITY - 9.2, 9.6, 6], [CITY - 2.8, 8.2, 5.2], [CITY + 2.8, 10.5, 6.4], [CITY + 9.6, 7.8, 5.6]];
    backdrop(CITY - 16, CITY + 16, -1, 12, -10, 20, g => {
      setInk(g, '#151a22'); for (const [x, h, w] of B) { box(g, x, -1, w, h + 1); setInk(g, '#0d1117'); box(g, x - 0.1, h, w + 0.2, 0.25); setInk(g, '#151a22'); }
      g.fillStyle = '#06080b'; for (const [x, h, w] of B) for (let y = 1.4; y < h - 1; y += 1.7) for (let xx = x + 0.6; xx < x + w - 1; xx += 1.3) box(g, xx, y, 0.7, 0.95);
    }, { lit: false });
    v.win = [0, 1, 2].map(k => backdrop(CITY - 16, CITY + 16, -1, 12, -9.9, 20, g => {     // 亮起来的窗：分三批，有的窗里有人
      let n = 0;
      for (const [x, h, w] of B) for (let y = 1.4; y < h - 1; y += 1.7) for (let xx = x + 0.6; xx < x + w - 1; xx += 1.3) {
        if ((n++ * 7 + k * 3) % 5 !== 0 && (n * 11) % 3 !== k) continue;
        g.fillStyle = '#e9b874'; box(g, xx, y, 0.7, 0.95);
        const who = (n * 13 + k) % 7; g.fillStyle = '#2a1c10';
        if (who === 0) { disc(g, xx + 0.3, y + 0.62, 0.09); box(g, xx + 0.2, y, 0.2, 0.52); box(g, xx + 0.4, y + 0.34, 0.16, 0.05); disc(g, xx + 0.55, y + 0.38, 0.06); }       // 端着碗
        else if (who === 1) { box(g, xx + 0.42, y + 0.25, 0.18, 0.5); disc(g, xx + 0.51, y + 0.8, 0.03); }                                                            // 挂起来的围裙
        else if (who === 2) { disc(g, xx + 0.22, y + 0.66, 0.09); box(g, xx + 0.12, y, 0.2, 0.56); disc(g, xx + 0.5, y + 0.46, 0.07); box(g, xx + 0.43, y, 0.14, 0.38); box(g, xx + 0.3, y + 0.4, 0.16, 0.04); }   // 大人把孩子拉回屋里
      }
    }, { additive: true, fog: false, opacity: 0 }));
    // 前景：一片屋顶，上面一间小屋，正面一扇卷帘
    add(R, bx(9, 0.3, 4), lam(0x1a1d22), CITY - 6.5, 3.35, -2.5); add(R, bx(9, 0.25, 0.15), lam(0x22262c), CITY - 6.5, 3.62, -0.5);   // 屋顶和矮矮的一道女儿墙（矮，不挡住后面卷帘底下那道缝）
    add(R, bx(2.0, 2.1, 1.6), lam(0x30353d), CITY - 4.2, 4.6, -2.8); add(R, bx(2.0, 0.2, 1.6), lam(0x30353d), CITY - 4.2, 3.6, -2.8);
    v.roofGlow = add(R, new THREE.PlaneGeometry(1.4, 1.2), own(new THREE.MeshBasicMaterial({ color: 0xffc27a, fog: false })), CITY - 4.2, 4.3, -1.99, false);
    v.roofShut = add(R, bx(1.5, 1.3, 0.05), lam(0x4a5058), CITY - 4.2, 4.35, -1.95); for (let y = -0.55; y < 0.6; y += 0.12) add(v.roofShut, bx(1.5, 0.02, 0.06), lam(0x3a3f46), 0, y, 0, false);
    v.crackGlow = glow(R, 0xffc27a, 1.1, 0, CITY - 4.2, 3.76, -1.85);
    V = v;
  }

  // ---- 屏幕上的画：单色的监控画面。孩子认得的三个地方，一张巡逻图，一张落星滑道的小图 ----
  function screenTex(kind) {
    const [c, g] = mkCanvas(320, 200), ink = '#9fe4ef', dim = 'rgba(159,228,239,.35)', red = '#ff8a6a';
    g.fillStyle = '#061015'; g.fillRect(0, 0, 320, 200); g.strokeStyle = g.fillStyle = ink; g.lineWidth = 3; g.lineCap = g.lineJoin = 'round';
    const L = pts => { g.beginPath(); pts.forEach(([x, y], i) => g[i ? 'lineTo' : 'moveTo'](x, y)); g.stroke(); };
    if (kind === 'window') {                                   // 作坊的侧窗：墙、一扇拉下一半的卷帘、屋顶的边；一束巡逻灯扫过来
      L([[40, 190], [40, 70], [200, 70], [200, 190]]); L([[30, 70], [210, 70]]); g.strokeRect(95, 105, 60, 50);
      for (let y = 108; y < 130; y += 6) L([[97, y], [153, y]]);
      g.fillStyle = 'rgba(159,228,239,.18)'; g.beginPath(); g.moveTo(300, 20); g.lineTo(150, 190); g.lineTo(230, 190); g.closePath(); g.fill();
      g.fillStyle = ink; g.beginPath(); g.arc(300, 20, 8, 0, 6.28); g.fill();
    } else if (kind === 'clock') {                             // 钟表街：橱窗里一排旧钟，指针都停在同一刻；遮阳布；封锁门
      L([[20, 190], [20, 60], [210, 60], [210, 190]]); for (let i = 0; i < 6; i++) L([[20 + i * 32, 60], [36 + i * 32, 40], [52 + i * 32, 60]]);
      for (let i = 0; i < 4; i++) { const x = 52 + i * 44, y = 120; g.beginPath(); g.arc(x, y, 16, 0, 6.28); g.stroke(); L([[x, y], [x - 8, y - 9]]); L([[x, y], [x + 10, y - 4]]); }
      L([[230, 190], [230, 90]]); L([[300, 190], [300, 90]]); for (let i = 0; i < 4; i++) { g.fillStyle = i % 2 ? red : ink; g.fillRect(230, 110 + i * 14, 70, 7); }
    } else if (kind === 'bridge') {                            // 断桥：桥面从中间断开；上面一架直升机罩着一块地
      L([[0, 140], [120, 140]]); L([[175, 140], [320, 140]]); L([[120, 140], [130, 150]]); L([[175, 140], [168, 152]]);
      for (const x of [40, 90, 210, 270]) L([[x, 140], [x, 195]]);
      L([[180, 40], [240, 40]]); L([[160, 30], [260, 30]]); g.beginPath(); g.ellipse(210, 48, 26, 12, 0, 0, 6.28); g.stroke();
      g.fillStyle = 'rgba(159,228,239,.16)'; g.beginPath(); g.moveTo(205, 58); g.lineTo(150, 140); g.lineTo(240, 140); g.closePath(); g.fill();
    } else if (kind === 'map') {                               // 巡逻图：一条往右的路，来路一段段封着（红），去机房的那一段维护通道留空
      const segs = [0, 1, 2, 3, 4, 5], w = 44, x0 = 14;
      for (const i of segs) { const x = x0 + i * (w + 4); if (i < 5) { g.fillStyle = 'rgba(255,138,106,.45)'; g.fillRect(x, 70, w, 60); g.strokeStyle = red; g.strokeRect(x, 70, w, 60); for (let k = -60; k < w; k += 10) L([[x + Math.max(0, k), 70 + Math.max(0, -k)], [x + Math.min(w, k + 60), 130 - Math.max(0, k + 60 - w)]]); g.strokeStyle = ink; } }
      g.setLineDash([6, 8]); L([[x0 + 5 * (w + 4), 100], [292, 100]]); g.setLineDash([]);
      g.strokeRect(292, 82, 22, 36);                            // 机房
      g.fillStyle = ink; for (const [x, k] of [[36, 'lamp'], [134, 'dog'], [182, 'heli']]) { if (k === 'lamp') { g.beginPath(); g.arc(x, 52, 6, 0, 6.28); g.fill(); L([[x, 52], [x - 12, 66]]); L([[x, 52], [x + 12, 66]]); } else if (k === 'dog') { g.fillRect(x - 10, 48, 18, 7); g.fillRect(x + 6, 44, 6, 6); } else { L([[x - 12, 46], [x + 12, 46]]); g.beginPath(); g.ellipse(x, 52, 9, 5, 0, 0, 6.28); g.fill(); } }
      g.fillStyle = dim; g.fillRect(14, 150, 300, 3); g.fillRect(14, 150, 230, 3);
    } else if (kind === 'chute') {                             // 落星的滑道：钩形星群，钩尖的夹口张开；一条虚线落到一个帆布棚和一只筐里
      for (const [x, y] of [[60, 40], [95, 32], [130, 40], [150, 62], [152, 90]]) { g.beginPath(); g.arc(x, y, 7, 0, 6.28); g.fill(); }
      L([[130, 112], [140, 104]]); L([[150, 112], [140, 104]]);
      g.setLineDash([5, 7]); g.beginPath(); g.moveTo(140, 116); g.quadraticCurveTo(150, 170, 240, 160); g.stroke(); g.setLineDash([]);
      L([[205, 165], [275, 150]]); L([[205, 165], [205, 190]]); g.strokeRect(245, 165, 30, 22);
    }
    for (let y = 0; y < 200; y += 4) { g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(0, y, 320, 1.5); }     // 扫描线
    return canvasTex(c);
  }
  function toolTex() {                                         // 工具板：钉在墙上的几件旧工具，每一件上都打着一个尖角
    const [c, g] = mkCanvas(400, 280); g.fillStyle = '#3b3328'; g.fillRect(0, 0, 400, 280);
    g.fillStyle = 'rgba(0,0,0,.35)'; for (let x = 12; x < 400; x += 24) for (let y = 12; y < 280; y += 24) { g.beginPath(); g.arc(x, y, 2.2, 0, 6.28); g.fill(); }
    const stamp = (x, y, s, col = '#1a140e') => { g.strokeStyle = col; g.lineWidth = s * 0.22; g.lineCap = 'butt'; g.lineJoin = 'miter'; g.beginPath(); g.moveTo(x - s, y + s * 0.75); g.lineTo(x, y - s * 0.75); g.lineTo(x + s, y + s * 0.75); g.stroke(); };
    g.fillStyle = '#8a8476'; g.fillRect(40, 40, 18, 150); g.fillStyle = '#5a4532'; g.fillRect(36, 170, 26, 70); stamp(49, 205, 9);                  // 錾子
    g.fillStyle = '#8a8476'; g.fillRect(100, 40, 70, 30); g.fillStyle = '#5a4532'; g.fillRect(126, 70, 18, 160); stamp(135, 160, 9);                // 小锤
    g.fillStyle = '#8a8476'; g.beginPath(); g.moveTo(210, 40); g.lineTo(240, 150); g.lineTo(226, 240); g.lineTo(214, 240); g.lineTo(222, 150); g.fill(); g.beginPath(); g.moveTo(262, 40); g.lineTo(232, 150); g.lineTo(246, 240); g.lineTo(258, 240); g.lineTo(250, 150); g.fill(); stamp(236, 200, 8);   // 钳子
    g.fillStyle = '#b08a4a'; g.fillRect(296, 70, 80, 80); g.strokeStyle = '#6a5228'; g.lineWidth = 4; g.strokeRect(296, 70, 80, 80); stamp(336, 112, 24, '#2a1c0c');   // 铜牌：打着大的尖角
    g.fillStyle = '#8a8476'; g.fillRect(310, 180, 52, 12); g.fillStyle = '#5a4532'; g.fillRect(300, 176, 14, 20); stamp(336, 186, 6);                 // 小起子
    return canvasTex(c);
  }
  function heightTex() {                                       // 身高刻痕：最低一道正好在孩子头顶，往上一道比一道高
    const [c, g] = mkCanvas(80, 200); g.clearRect(0, 0, 80, 200);
    const yOf = h => 200 - (h - 0.9) / 1.0 * 200;              // 贴图从 0.9 米到 1.9 米
    g.strokeStyle = 'rgba(196,190,176,.9)'; g.lineWidth = 3.5; g.lineCap = 'round';           // 刻进漆里，露出底下的铁：比墙亮
    [1.24, 1.29, 1.33, 1.38, 1.42, 1.46, 1.5].forEach((h, i) => { const y = yOf(h); g.beginPath(); g.moveTo(10, y); g.lineTo(58, y); g.stroke(); g.lineWidth = 2; g.beginPath(); g.moveTo(62, y - 4); g.lineTo(64 + (i % 3) * 4, y - 4); g.moveTo(62, y + 2); g.lineTo(62 + (i % 2) * 6 + 3, y + 2); g.stroke(); g.lineWidth = 3.5; });
    return canvasTex(c);
  }

  // ---- 结局 ----
  function choose(c) {
    END.c = c; END.t = 0; END.step = 0; STORY.room = c; saveGame(); ctl = false; autoDir = 0;
    if (c === 1) { fx('bite'); CARRY.state = 'set'; CARRY.power = 1; } else fx('boom');
  }
  // 镜头：老人一直在画面里。整间屋子放得下（宽屏）就对着屋子正中；放不下（窄屏）就把孩子和老人一起框进去，屏幕越窄退得越远
  const camF = { x: 0, y: 3.6, d: 20 };
  function roomCam() {
    const half = Math.tan(camera.fov * Math.PI / 360) * camera.aspect, fit = 9.4 / half;
    if (P.x > X + 0.4 && fit <= 22) return { x: ROOMC, y: 3.55, d: Math.max(19.5, fit) };
    const a = Math.min(P.x, CHAIR) - 1.8, b = Math.max(P.x, CHAIR) + 1.8;            // 还在门外，或者屏幕太窄：把孩子和老人一起框进去
    return { x: (a + b) / 2, y: 3.55, d: clamp((b - a) / 2 / half, 19.5, 26) };
  }
  function setCam(f) { camOvr = { d: f.d, yo: f.y - P.y, xo: f.x - P.x - cam.look }; }

  function update(dt) {
    const here = P.x > X - 12 && P.x < RW + 2;
    if (!here && !END.c) return;
    if (!CARRY.bulb) CARRY.bulb = makeBulb(scene, 'square', { glow: 0.12 });
    if (CARRY.state === 'none' || (CARRY.state === 'set' && !END.c)) { CARRY.state = 'bag'; CARRY.at = null; }
    for (let i = 0; i < 3; i++) S.lt[i] += dt;
    // 控制：取放灯泡、对灯、结局的时候不能动
    const lock = busy() || END.c > 0;
    if (state === 'play') { if (lock) { ctl = false; S.locked = true; } else if (S.locked) { ctl = true; S.locked = false; } }
    // 灯泡拿在手上，按方向键就先收回包里
    if (CARRY.state === 'out' && !CARRY.act && P.mode !== 'hold' && !END.c && S.cmpT < 0 && (keys.has('L') || keys.has('R') || keys.has('J'))) carryStart('in');

    // ---- 一 · 小窗 ----
    const lk = lever.k; S.win = sstep(0.55, 1, lk); if (S.win > 0.6) S.seen1 = true;
    const cut = sstep(0, 0.3, lk);                                                          // 屋里先断电
    if (lever.on && lk > 0.98 && !S.winSnd) { S.winSnd = true; fx('clank13'); }
    if (!lever.on && S.winSnd && lk < 0.5) { S.winSnd = false; fx('spring'); }
    // 白光照到孩子身上：灯泡透过布和包亮起来
    const inBeam = sstep(1.6, 0.6, Math.abs(P.x - (WIN + 0.9)));
    let excite = S.win * lerp(0.55, 1.35, inBeam);
    // ---- 二 · 对灯泡 ----
    if ((S.cmpT >= 0 || CARRY.act) && near(SOCK, 1.0) && !END.c) { P.x = damp(P.x, SOCK - 0.24, 8, dt); P.facing = 1; }
    if (S.cmpT >= 0) {
      if (!CARRY.act) S.cmpT += dt;
      if (S.cmpT > 0.05 && S.cmpT - dt <= 0.05) fx('fit');
      if (S.cmpT > 3.8 && CARRY.state === 'out' && !CARRY.act) carryStart('in');
      if (S.cmpT > 3.8 && CARRY.state === 'bag' && !CARRY.act) { S.cmpT = -1; S.cmp = true; }
    }
    // ---- 三 · 星灯回路、故障、老人伸手 ----
    if (S.l[2] && S.fault === 0 && S.lt[2] > 4.5) { S.fault = 1; S.ft = 0; fx('deny'); }
    S.ft += dt; if (S.fault >= 1) S.ft0 += dt;
    if (S.fault === 2 && S.ft > 1.2) S.done3 = true;
    // ---- 拧灯 / 拉闸的过程 ----
    const sk = screw.k, pk = pull.k;
    if (P.mode === 'hold' && P.holdObj === screw || (sk > 0 && !END.c)) {
      CARRY.holdAt = { x: SOCK - 0.02, y: lerp(SOCK_Y - 0.2 - 0.12, SOCK_Y - 0.2, sstep(0, 0.42, sk)) };
      CARRY.spin = sk * 16; CARRY.power = sstep(0.32, 0.46, sk);
      if (screw.on && Math.floor(sk * 14) !== Math.floor(S.sk0 * 14) && sk > 0.5) fx('ratchet');
      if (screw.on && sk > 0.45 && S.sk0 <= 0.45) fx('fit');
    } else if (!END.c) { CARRY.spin = 0; CARRY.power = 0; }
    if (pull.on && Math.floor(pk * 10) !== Math.floor(S.pk0 * 10) && pk > 0.5) { fx('pinStep'); dustBurst(); }
    if (pull.on && pk < 0.5 && Math.floor(pk * 8) !== Math.floor(S.pk0 * 8)) fx('relayOff');
    S.sk0 = sk; S.pk0 = pk;
    // 星灯：拉闸的前半程一排排熄灭、传动停下；第三段线路以前，机房上面那一片一闪一闪
    LAMP.run = 1 - sstep(0.05, 0.45, pk);
    for (let r = 0; r < 4; r++) LAMP.off[r] = sstep(0.08 + r * 0.1, 0.16 + r * 0.1, pk);
    LAMP.flick = S.l[2] ? 0 : 1; LAMP.jit = S.fault === 1 ? 1 : 0;

    // ---- 老人 ----
    const OM = { sit: 1, bow: 0.1, look: 0, nod: 0.1 };
    if (S.win > 0.05) OM.nod = 0.1 + 0.12 * S.win;                                         // 望着那道光
    if (S.fault >= 1) {                                                                      // 伸手去够调整杆，手停在半路，慢慢收回来
      const t = S.ft0, k = sstep(0.8, 2.0, t) * (1 - sstep(3.6, 4.8, t));
      if (k > 0.01) { OM.reach = { x: ADJ, y: 1.07, i: 1, k: 0.48 * k }; OM.bow = 0.1 + 0.18 * k; }
    }
    const rise = sstep(0.6, 0.85, pk) || (END.c === 2 ? 1 : 0);
    if (rise > 0) {                                                                          // 拉闸的后半程：撑起半个身子，没能站起来；举起挡光片
      OM.sit = 1 - 0.38 * rise; OM.bow = 0.1 + 0.3 * rise; const sh = sstep(0.72, 0.9, pk) || (END.c === 2 ? 1 : 0);
      if (sh > 0) { OM.reach = { x: CHAIR - 0.32, y: 1.22 + 0.12 * (1 - OM.sit), k: sh }; OM.nod = 0.25 * sh; }
    }
    // ---- 结局 ----
    if (END.c) END.t += dt;
    const E1 = END.c === 1, E2 = END.c === 2, t = END.t;
    let sockY = SOCK_Y, white = 0, flood = 0, relit = 0, tableau = false, cityK = 0;
    if (E1) {
      if (t > 0.6 && END.step === 0) { END.step = 1; fx('spring'); }                       // 释放杆自己弹回去
      if (t > 1.4 && END.step === 1) { END.step = 2; fx('clank13'); }                      // 卡扣松开
      sockY = SOCK_Y + (TIP - SOCK_Y) * sstep(1.6, 7.0, t);                                 // 灯座沿着缆索升上去，补上钩尖
      CARRY.at = { x: SOCK, y: sockY, z: 0 }; CARRY.power = 1;
      if (t > 7.0 && END.step === 2) { END.step = 3; fx('ok'); }
      if (t > 10.6 && END.step === 3) { END.step = 4; fx('deny'); }                         // 旁边又一处故障亮起来
      if (t > 12 && END.step === 4) { END.step = 5; $('fade').style.opacity = 1; }
      if (t > 13.6 && END.step === 5) { END.step = 6; placePlayer(CHAIR, 0); P.facing = -1; snapCam({ x: CHAIR - 0.5, y: 1.3, d: 8.5 }); }
      if (t > 14 && END.step === 6) { END.step = 7; $('fade').style.opacity = 0; }
      tableau = t > 13.6;
      if (t > 18.6 && END.step === 7) { END.step = 8; fx('bell', 740, 1); }                 // 工作铃
      if (t > 19.4 && END.step === 8) { END.step = 9; $('fade').style.opacity = 1; }
      if (t > 21 && END.step === 9) { END.step = 10; snapCam({ x: CITY - 1.5, y: 6.6, d: 17 }); $('fade').style.opacity = 0; }
      if (t > 26 && END.step === 10) { END.step = 11; $('fade').style.opacity = 1; }
      if (t > 27.6 && END.step === 11) { END.step = 12; fx('bell', 520, 0.8); $('fade').style.opacity = 0; }   // 睡觉铃：下一次宵禁
      cityK = t > 21 && t < 27.6 ? sstep(21.2, 24.5, t) : 0;
      if (t > 33 && !END.shown) { END.shown = true; showEndBare(ZONE, false); }
    } else if (E2) {
      if (t > 0.9 && END.step === 0) { END.step = 1; fx('pinStep'); }
      white = sstep(2.6, 9.0, t); flood = sstep(3.0, 8.0, t); relit = t;
      excite = Math.max(excite, 2.2 * sstep(1.6, 4.0, t));
      if (t > 7 && END.step === 1) { END.step = 2; $('white').style.opacity = 1; }
      if (t > 11 && !END.shown) { END.shown = true; showEndBare(ZONE, true); }
    }
    CARRY.excite = excite;
    if (E2) envMod = (e => {                                                                    // 白光：雾和环境光变白，主光从后上方压过来，人成了剪影；风声起来，屋里的嗡嗡声没了
      const k = white; e.fog.lerp(_white, k); e.fogD = lerp(e.fogD, 0.05, k); e.hemiI = lerp(e.hemiI, 0.18, k); e.keyI = lerp(e.keyI, 2.4, k); e.rimI = lerp(e.rimI, 2.2, k);
      e.keyC.lerp(_white, k); e.rimC.lerp(_white, k); e.aWind = lerp(e.aWind, 3.2, k); e.aRoom *= 1 - k; e.aHum *= 1 - k; e.rvOut = lerp(e.rvOut, 1, k); e.rvHall *= 1 - k; e.aFar = 0; });
    // 镜头
    if (here || END.c) {
      let f = roomCam();
      if (S.cmpT >= 0) f = blendCam(f, { x: SOCK - 0.1, y: SOCK_Y - 0.12, d: 3.2 }, sstep(0, 0.5, S.cmpT + (CARRY.act ? 0.25 : 0)) * (1 - sstep(3.6, 4.3, S.cmpT)));
      if (S.l[1] && S.lt[1] < 6.5) f = blendCam(f, { x: CON, y: 2.5, d: 7.2 }, sstep(0.3, 1.2, S.lt[1]) * (1 - sstep(5.4, 6.4, S.lt[1])));     // 屏幕一块块亮起来
      if (S.l[2] && S.lt[2] < 4.5) f = blendCam(f, { x: SOCK, y: 5.6, d: 13 }, sstep(0.2, 1.2, S.lt[2]) * (1 - sstep(3.4, 4.4, S.lt[2])));     // 头顶那一片稳下来
      // 站到桌前、站到挂着的衣服前：推近
      const stillNow = P.grounded && Math.abs(P.vx) < 0.05 && P.mode === 'normal' && !busy() && !END.c;
      S.still = stillNow ? S.still + dt : 0;
      const atT = near(TABLE - 0.35, 0.6), atC = near(CLO + 0.3, 0.6);
      S.look = damp(S.look, (atT || atC) && S.still > 0.45 ? 1 : 0, 2.2, dt);
      if (atT || atC) S.lookAt = atT ? 'table' : 'clo';
      if (S.look > 0.002) f = blendCam(f, S.lookAt === 'table' ? { x: TABLE + 0.08, y: 1.32, d: 3.6 } : { x: CLO + 0.5, y: 1.5, d: 4.4 }, sstep(0, 1, S.look));
      // 按住的时候，镜头带出这件东西连着什么：拧灯 —— 先看清灯接上电，后半段顺着缆索抬上去，看钩尖那个空位；拉闸 —— 粗拉索、大锁销和配重
      if (sk > 0.002 && !END.c) { const u = sstep(0.5, 1, sk); f = blendCam(f, { x: SOCK + lerp(0.1, 2.2, u), y: lerp(1.9, 4.0, u), d: lerp(6.5, 16.6, u) }, sstep(0, 0.12, sk)); }
      if (pk > 0.002 && !END.c) { const u = sstep(0.45, 0.7, pk); f = blendCam(f, { x: lerp(ROOMC + 2, X + 15.3, u), y: lerp(4.4, 3.3, u), d: lerp(20.5, 15.2, u) }, sstep(0, 0.12, pk)); }   // 后半程：老人、孩子、上面的大锁销都在画面里，老人不压在提示字底下
      if (E1 && t < 12) f = blendCam(f, { x: SOCK, y: lerp(3.6, sockY + 0.6, sstep(1.6, 4, t)), d: lerp(14, 12, sstep(5, 7, t)) }, sstep(1.0, 2.6, t) * (1 - sstep(8.8, 10.4, t)));
      if (E1 && tableau && t < 21) f = { x: CHAIR - 0.5, y: 1.3, d: 8.5 };
      if (E1 && t >= 21) f = { x: CITY - 1.5, y: 6.6, d: 17 };
      if (E2) f = blendCam(f, { x: ROOMC + 2, y: 4.2, d: 23 }, sstep(0.5, 6, t));
      setCam(f);
    }
    // 孩子的动作：握着手柄 / 拧灯 / 坐在椅子上
    if (P.mode === 'hold' && P.holdObj === lever) HX.pose = { hands: handsAt(levHand(lk)) };
    if (P.mode === 'hold' && P.holdObj === pull || (E2 && t < 9)) HX.pose = { hands: handsAt(mainHand(E2 ? 1 : pk)) };
    if (tableau) HX.pose = { sit: 1, sitH: 0.37, sitLeg: 0.95, bow: 0.06, look: 0 };
    stepDust(dt);

    const v = V; if (!v) return;
    // 闸刀和线
    v.knife.forEach((K, i) => { const k = sstep(0, 0.25, S.l[i] ? S.lt[i] : 0) * S.l[i]; K.arm.rotation.z = lerp(-1.2, 0, k); K.lamp.color.setHex(S.l[i] ? 0x7dff9a : 0x2a1210); });
    v.pulse.forEach((p, i) => { const k = S.l[i] ? S.lt[i] / 0.9 : 2; p.material.opacity = k < 1 ? 0.9 : 0; if (k < 1) p.position.copy(v.pulsePath[i].getPointAt(clamp(k, 0, 1))); });
    // 小窗
    v.shut.position.y = WIN_Y + 0.3 * S.win; v.pin.position.x = WIN + 0.72 + 0.17 * sstep(0.3, 0.55, lk); v.cw.position.y = 3.0 - 0.3 * S.win; v.cwRope.scale.y = 0.6 - 0.3 * S.win; v.cwRope.position.y = 3.3 + 0.15 - (0.6 - 0.3 * S.win) / 2;
    v.lev.rotation.z = lerp(-0.55, 0.5, lk);
    winL.on = S.win; v.slitGlow.material.opacity = 0.5 * S.win; v.ray.material.opacity = 0.16 * S.win;
    const pw = (1 - 0.85 * cut) * (E2 ? 1 - white : 1);                                     // 屋里的电：检修柄往下带的那一下先断开
    workL.on = pw; workL2.on = pw; tableL.on = pw; pinL.on = (E2 ? 1 - white : sstep(0.48, 0.56, pk)) * (0.6 + 0.4 * Math.sin(T * 7)); scrL.on = S.l[1] ? pw : 0; skyL.on = (1 - sstep(0.05, 0.45, pk)) * (E2 ? sstep(3.5, 6, t) : 1);
    for (const b of v.spares) b.set(0.12 + 1.6 * Math.max(S.win, E2 ? sstep(1.4, 2.6, t) : 0));   // 白光进来：备用的灯泡一齐亮了（老人那只除外）
    v.oldBulb.set(0);                                                                         // 老人那只旧灯：报废了，强光也激不亮
    // 屏幕：一块一块亮起来，闪两下
    v.screens.forEach((s, i) => { const t0 = 0.4 + i * 0.8, k = S.l[1] ? sstep(t0, t0 + 0.25, S.lt[1]) : 0, fl = S.l[1] && S.lt[1] < t0 + 0.5 && S.lt[1] > t0 ? (Math.sin(S.lt[1] * 60) > 0 ? 1 : 0.4) : 1; s.mat.color.setScalar(k * fl * pw); });
    // 释放杆：第 4 根扳在释放的位置，指示灯一闪一闪；拧回去以后自己弹回来
    v.rel.forEach(r => { const down = r.rel && !(E1 && t > 0.6); r.arm.rotation.z = down ? Math.PI - 0.35 : 0.05; r.lamp.color.setHex(S.l[1] ? (down ? (Math.sin(T * 6) > 0 ? 0xff6a4a : 0x3a1410) : 0x5ad070) : 0x1a1410); });
    // 检修位的灯座：夹口跟着拧灯的后半程合拢；拧回去以后灯座沿着缆索升上去
    const jaw = E1 ? 1 : sstep(0.5, 1, sk);
    v.jaws.forEach((j, i) => { j.rotation.z = (i ? 1 : -1) * lerp(0.75, 0, jaw); });
    v.sock.position.y = sockY; v.tipGlow.position.y = sockY - 0.12; v.tipGlow.material.opacity = E1 ? 0.95 * sstep(5.2, 7.0, t) : 0; v.clip.visible = !(E1 && t > 1.4); v.sockLamp.color.setHex(sk > 0.4 || E1 ? 0x7dff9a : S.l[1] ? 0xff6a4a : 0x2a1210);
    v.sockCable.scale.y = Math.max(0.05, TIP + 0.4 - (sockY + 0.17)); v.sockCable.position.y = (TIP + 0.4 + sockY + 0.17) / 2;
    // 故障和传动
    v.faultLamp.color.setHex(S.fault === 1 && Math.sin(T * 9) > 0 ? 0xff5a3a : 0x2a1210); v.faultGlow.material.opacity = S.fault === 1 && Math.sin(T * 9) > 0 ? 0.8 : 0;
    v.contact.position.y = S.fault === 2 ? 1.0 : 1.06;
    const f2 = E1 && t > 10.6 ? (Math.sin(T * 7) > 0 ? 1 : 0) : 0; v.fault2.color.setHex(f2 ? 0xffb040 : 0x2a1a08); v.fault2Glow.material.opacity = 0.8 * f2;
    v.gears.forEach((G, i) => {
      let w = (i < 2 ? 0.9 : 0.25) * G.s * LAMP.run * (E2 ? 0 : 1) * pw;
      if (i < 2 && S.fault === 1) w *= Math.sin(T * 5) > 0.3 ? 0 : 2.2;                        // 卡着走不顺
      if (i >= 2) w *= 0.8 + 0.4 * Math.sin(T * 1.3 + i);                                   // 磨损的那一排：慢慢地、一下一下地转
      G.a += w * dt; G.g.rotation.z = G.a + (i < 2 && S.fault === 1 ? 0.03 * Math.sin(T * 40) : 0);
    });
    if (S.fault === 1 && Math.floor(T * 1.6) !== Math.floor((T - dt) * 1.6)) fx('clunk');
    // 调整杆、椅子、外套：拧回去的最后一个镜头
    v.adjExt.visible = tableau; v.coat.visible = tableau; v.old.ch.root.visible = !tableau; v.chair.position.z = tableau ? 0 : CH_Z;
    // 老人
    const o = v.old; o.pose = { sit: OM.sit, sitH: 0.31, sitLeg: 1.1, bow: OM.bow, look: OM.look, nod: OM.nod, reach: OM.reach }; o.step(dt);
    v.shield.visible = rise > 0 && (sstep(0.72, 0.9, pk) > 0.05 || E2);
    if (v.shield.visible) { const hk = sstep(0.72, 0.9, pk) || 1; v.shield.position.set(lerp(TABLE + 0.14, CHAIR - 0.36, hk), lerp(0.8, 1.26, hk), lerp(-0.95, CH_Z + 0.05, hk)); v.shield.rotation.z = lerp(Math.PI / 2, 0.25, hk); }
    v.shields[3].visible = !v.shield.visible;
    // 大锁销和配重：拉闸的后半程一截一截往外退；拉到底以后配重落下去
    const step5 = Math.floor(sstep(0.5, 1, pk) * 5) / 5, pinOut = E2 ? 1 : step5;
    v.bigPin.position.x = X + 15.9 - 0.6 + 1.9 * pinOut;
    v.cwBig.position.y = 6.1 - 1.4 - (E2 ? 9 * Math.pow(sstep(0.8, 3.4, t), 2) : 0);
    v.cwChain.scale.y = 9.6 - v.cwBig.position.y - 0.8; v.cwChain.position.y = (9.6 + v.cwBig.position.y + 0.8) / 2;
    // 粗拉索：拉得越紧越直
    const ten = E2 ? 1 : sstep(0.35, 0.75, pk), A_ = v.cableA, B_ = v.cableB.clone(); B_.x += 1.9 * pinOut;
    for (let i = 0; i < 8; i++) { const a = i / 8, b = (i + 1) / 8, sag = s => 0.9 * (1 - ten) * Math.sin(Math.PI * s);
      const p = V3(lerp(A_.x, B_.x, a), lerp(A_.y, B_.y, a) - sag(a), lerp(A_.z, B_.z, a)), q = V3(lerp(A_.x, B_.x, b), lerp(A_.y, B_.y, b) - sag(b), lerp(A_.z, B_.z, b)); placeSeg(v.bigCable[i], p, q); }
    v.main.rotation.z = lerp(-0.5, 0.6, E2 ? 1 : pk);
    // 外壳分开、白光涌进来
    const open = E2 ? Math.pow(sstep(1.0, 10, t), 1.4) : 0;
    v.shellL.position.x = v.shellL.userData.x0 - open * 26; v.shellR.position.x = v.shellR.userData.x0 + open * 26;
    v.white.material.opacity = Math.min(1, open * 4); v.flood.material.opacity = 0.75 * flood;
    // 星灯
    const ex2 = s => E2 ? sstep(1.9 + s * 0.55, 2.4 + s * 0.55, relit) : 0;                  // 被白光照得自己亮起来（一排一排；赶在画面变白之前，看得出来）
    LAMP.rows.forEach((row, r) => {
      const off = Math.max(LAMP.off[r], E2 ? 1 - ex2(2 - r) : 0), lit = (1 - off) + (E2 ? ex2(2 - r) * 0.6 : 0);
      for (const L of row.list) {
        L.g.position.x = X - 26 + ((L.x0 - (X - 26) + LAMP.pos) % 72 + 72) % 72;
        let k = lit;
        if (LAMP.flick && Math.abs(L.g.position.x - (X + 9)) < 6) k *= 0.35 + 0.65 * (Math.sin(T * 7 + L.ph * 3) > 0.2 ? 1 : 0.15);
        if (LAMP.jit && r === 0) L.g.position.y = row.y + 0.04 * Math.sin(T * 30 + L.ph);
        else L.g.position.y = row.y;
        L.s.material.opacity = 0.62 * k;
      }
      row.mat.color.setRGB(lit, lit * 0.94, lit * 0.82);
    });
    LAMP.pos += LAMP.speed * LAMP.run * (E2 ? 0 : 1) * dt;
    LAMP.hook.forEach(h => { const k = 1 - Math.max(LAMP.off[3], E2 ? 1 - ex2(3) : 0) + (E2 ? ex2(3) * 0.5 : 0); h.s.material.opacity = 0.95 * k; h.core.material.color.setRGB(k, k * 0.95, k * 0.85); });
    // 城里：工作铃以后窗一批批亮起来；下一次宵禁全黑，一个屋顶上的卷帘抬起一条缝
    v.win.forEach((m, k) => { m.material.opacity = sstep(k * 0.28, k * 0.28 + 0.3, cityK); });
    cityL.forEach((l, k) => { l.on = sstep(k * 0.28, k * 0.28 + 0.3, cityK); });
    const crack = E1 ? sstep(29.2, 31.2, t) : 0; v.roofShut.position.y = 4.35 + 0.15 * crack; v.roofGlow.material.color.setHex(0xffc27a).multiplyScalar(0.3 + 0.7 * crack); v.crackGlow.material.opacity = 0.55 * crack;
    v.roofGlow.visible = crack > 0.01;
  }
  const _white = new THREE.Color(0xf3f1ea);
  function blendCam(a, b, k) { return k <= 0 ? a : { x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), d: lerp(a.d, b.d, k) }; }
  function snapCam(f) { setCam(f); cam.d = f.d; cam.y = f.y; cam.x = f.x; cam.look = 0; camOvr.xo = f.x - P.x; placeCamera(); }
  // 手搭在手柄上：两只手一前一后握着
  const levHand = k => { const a = lerp(-0.55, 0.5, k); return { x: LEV + 0.42 - 0.45 * Math.cos(a), y: 0.85 - 0.45 * Math.sin(a) }; };
  const mainHand = k => { const a = lerp(-0.5, 0.6, k); return { x: MAIN + 0.48 - 0.5 * Math.cos(a), y: 0.95 - 0.5 * Math.sin(a) }; };
  const handsAt = p => [{ x: p.x - 0.02, y: p.y - 0.01, k: 1 }, { x: p.x + 0.03, y: p.y + 0.01, k: 1 }];
  // 锁销退一截，灰从销孔里落下来
  function dustBurst() { if (!V) return; let n = 0; for (const d of V.dust) if (d.t > 1.4 && n < 6) { n++; d.t = 0; d.s.position.set(X + 15.9 - 0.3 + rr(-0.3, 0.3), 6.1 + rr(-0.2, 0.2), -2.9); d.vx = rr(-0.3, 0.3); d.vy = rr(-0.2, 0.3); } }
  function stepDust(dt) { if (!V) return; for (const d of V.dust) { if (d.t > 1.4) { d.s.material.opacity = 0; continue; } d.t += dt; d.vy -= 1.6 * dt; d.s.position.x += d.vx * dt; d.s.position.y += d.vy * dt; d.s.material.opacity = 0.5 * (1 - d.t / 1.4); } }

  function resetEnd() {
    if (END.c) { CARRY.state = 'bag'; CARRY.act = null; CARRY.at = null; CARRY.power = 0; CARRY.spin = 0; }   // 灯泡回到包里（只在演过结局以后：从菜单跳到第十二章时不要动它）
    Object.assign(END, { c: 0, t: 0, shown: false, step: 0 }); STORY.room = 0;
    screw.k = 0; screw.locked = false; screw.on = false; pull.k = 0; pull.locked = false; pull.on = false;
    envMod = null; { const w = $('white'); w.style.transition = 'none'; w.style.opacity = 0; void w.offsetWidth; w.style.transition = ''; } $('fade').style.opacity = 0; $('end').classList.add('hide'); $('end').classList.remove('bare', 'white');
  }
  function reset() {
    Object.assign(S, { l: [0, 0, 0], lt: [9, 9, 9], seen1: false, cmp: false, cmpT: -1, fault: 0, ft: 0, ft0: 0, done3: false, win: 0, locked: false, look: 0, still: 0, winSnd: false, sk0: 0, pk0: 0 });
    lever.k = 0; resetEnd(); if (CARRY.state === 'out' || CARRY.act) { CARRY.act = null; CARRY.state = 'bag'; }
  }
  function solve() { reset(); }
  // 结局以后按 R：回到选择之前（三段线路都已经走过）
  function retry() {
    reset(); Object.assign(S, { l: [1, 1, 1], lt: [9, 9, 9], seen1: true, cmp: true, fault: 2, ft: 9, ft0: 9, done3: true });
    placePlayer(X + 12.3); P.facing = 1; P.cp = cpAt(P.x); ctl = true; autoDir = 0; state = 'play'; camOvr = null; S.locked = false;
    saveGame(); snapCamera(); applyEnv(camera.position.x); streamZones(cam.x, true);
  }
  function respawn() { if (CARRY.state === 'out' || CARRY.act) { CARRY.act = null; CARRY.state = 'bag'; } S.cmpT = -1; }
  const ZONE = defZone({ n: OLD + 13, vis: [X - 12, CITY + 18], build, update, reset, solve, retry, respawn, unbuild() { V = null; }, S, END, lever, screw, pull });
  return ZONE;
})();
