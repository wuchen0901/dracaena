
// ============================================================
//  第一章 · 工厂：关闭回收线
//  警报里，同型号的机器人沿着上层的通道往前跑；07 掉进了下层的维修通道。
//  推车上高台 → 躲过探照灯 → 发现上层的输送带把队伍送进了压机 →
//  把空箱沿着拖痕推到断电杆下面，站上去拉下断电杆：输送带和压机停下，安全闸门升起
// ============================================================
const CH1 = (() => {
  const C = chapter({ n: OLD + 1, x0: -60, start: 2, name: '工厂', sub: '关闭回收线', enter: [-6.5, 0.5] });   // enter：从《逃出工厂》的结尾一路走进来时，人出现在左墙里面（20-world.js 的 chapterExit）
  C.ground = 'concrete';                                                           // 脚步声：水泥地；铁梁、推车是铁的，空箱是木头的
  C.intro = () => { P.y = 3.3; P.vy = 0; P.grounded = false; P.gy = 0.6; };       // 开场：从上层断开的格栅掉下来
  if (TERRAIN.length) groundFront(TERRAIN[TERRAIN.length - 1][0], -60, null);     // 左边接着《逃出工厂》那条路的尽头：中间空着的一千来米不铺地面
  terrain([-60, 0], [47.9, 0], [48, 3], [49.2, 3], [57, 0], [104, 0]);
  ground(-60, 0x1c2529); ground(103.9, 0x1c2529);
  solid({ id: 'wallL', x1: -9, x2: -7, y1: 0, y2: 12 });
  solid({ id: 'beam', x1: 9.0, x2: 10.3, y1: 0, y2: 0.45, snd: 'metal' });
  solid({ id: 'slab', x1: 15, x2: 19, y1: 0, y2: 0.9, snd: 'concrete' });
  solid({ id: 'terrace', x1: 38, x2: 48, y1: 0, y2: 3.0, snd: 'concrete' });
  const cart = pushable({ id: 'cart', x: 25.4, w: 1.5, h: 0.95, min: 23.4, max: 37.15, snd: 'metal' });
  const crate = pushable({ id: 'crate1', x: 88.6, w: 1.15, h: 0.95, min: 86.3, max: 97.0, snd: 'wood' });      // 轮挡正好把它停在断电杆下面
  const door = gate({ id: 'door1', x: 104 });
  const LEVER = { x: 97.0, pulled: false, t: 0, reach: 0 };
  // 探照灯：机器在背景深处（z < 0），光束扫过场地；玩家躲在一处处铁柜前面的影子里
  const WATCH = { ex: 71, ey: 3.7, ez: -20, cx: 71, amp: 10.6, w: 0.5, r: 2.15, t: 0.6, bx: 71, exposure: 0, caught: 0,
    walls: [[60.6, 62.6], [66.4, 68.4], [72.4, 74.4], [78.4, 80.2]] };     // 能躲的四处，各占一段 x
  // 每一处是并排的三只配电柜：[占这一处宽度的几成, 高, 深]。正面齐平在 z = CAB_Z，高矮、深浅不一；单数的那几处左右反过来摆。
  // 最矮的一只也有 1.65 米，比主角高出一截
  const CAB = [[0.36, 1.76, 0.5], [0.27, 1.65, 0.42], [0.37, 1.86, 0.54]], CAB_Z = -0.7;
  const cabinets = i => i % 2 ? CAB.slice().reverse() : CAB;
  // 铁柜的影子投到玩法平面 z = 0 上的区间。灯是点光源，影子朝背着灯的方向偏：
  // 离灯远的那一端是那只柜子的背面投出来的（偏得多），离灯近的那一端是正面投出来的（偏得少）。照实际的柜子算，看着躲好了才算躲好了
  const LAMP_Z = WATCH.ez + 0.95, shift = z => -z / (z - LAMP_Z);
  WATCH.shadows = WATCH.walls.map(([a, b], i) => {
    const c = cabinets(i), near = shift(CAB_Z), farL = shift(CAB_Z - c[0][2]), farR = shift(CAB_Z - c[2][2]);
    return a < WATCH.ex ? [a + (a - WATCH.ex) * farL, b + (b - WATCH.ex) * near] : [a + (a - WATCH.ex) * near, b + (b - WATCH.ex) * farR];
  });
  const inShadow = x => WATCH.shadows.some(([a, b]) => x > a + 0.22 && x < b - 0.22);     // 0.22：主角半个身子的宽度，再留一点余量
  // 回收线：上层输送带把同型号的机器人一台台送进压机。下压前，侧面的检修灯固定亮三次
  const BELT_Y = 3.9, BELT_Z = -5.2, BAY = 101.9, GAP = 5.6;
  const LINE = { on: true, v: 0.95, spd: 0.95, phase: 'move', t: 0, ram: 0, lamp: 0, parts: 3, hit: false, bots: [0, 1, 2, 3].map(i => ({ x: BAY - 2.2 - i * GAP })) };
  // 开场从上层通道跑过去的队伍
  const CAT_Y = 3.4, CAT_Z = -4.4, SCHED = [0.2, 0.7, 1.1, 1.9, 2.4, 3.3, 15, 16.2, 18, 21, 25, 30];
  const RUN1 = { t: -1, i: 0, list: [0, 1, 2, 3, 4, 5].map(() => ({ x: 0, v: 0, live: false })) };

  usable({ id: 'breaker', x: LEVER.x, r: 0.85, y0: 0.6, can: () => !LEVER.pulled,
    on() { LEVER.pulled = true; LEVER.reach = 0.7; door.want = 1; LINE.on = false; fx('lever'); fx('powerDown'); } });
  checkpoint(2); checkpoint(40.2); checkpoint(56.6); checkpoint(85); checkpoint(99.5);
  camKeys([-10, 14.5, 1.25, 0], [12, 15.5, 1.35, 0], [24, 18.5, 2.0, 1.5], [40, 18.5, 1.7, 0], [52, 19.5, 1.7, 1], [58, 20.5, 2.0, 2], [83, 20.5, 2.0, 0],
    [89, 21.5, 2.5, 2.5], [96, 21.5, 2.6, 0.8], [99.5, 21, 2.5, -0.2], [102, 19, 1.9, -1.8], [104.4, 18, 1.7, -1.2]);
  // 整章的光：逆光。颜色还是默认的冷青灰，但环境光和主光压暗、从背后来的轮廓光提亮；
  // 最远的后墙和高窗比雾亮（见下面的布景板），站在它前面的东西都成了剪影
  env(-60, { fog: 0x26353c, hemiI: 0.45, keyI: 0.5, rimI: 1.1,                     // true：旧原型的第一个关键帧，从默认的光算起，不接着《逃出工厂》结尾的光
    aRoom: 1, roomF: 200, aHum: 0.6, aDrip: 0.25, aFar: 1, rvHall: 1 }, true);              // 声音：空厂房的低鸣和电流声，远处的铁器、铁链、泄气，零星的滴水；大厂房的混响
  env(104.7, {});                                        // 一直保持到出口那面黑墙；镜头穿过黑墙时换成第二章的晨光

  hint(() => !P.moved && chapterAt(P.x) === C, '<b>←</b><b>→</b> 移动');                        // 只在这一章：《逃出工厂》的第一章也从头教
  hint(() => P.x > 5.5 && P.x < 9 && !P.jumped, '<b>空格</b> 跳跃');
  hint(() => !P.pushed && P.y < 0.5 && Math.abs(P.x - cart.x) < 2.6 && P.mode !== 'push', '按住 <b>E</b> 抓住推车，再按方向键推或拉');
  hint(() => P.y < 1.2 && cart.x > 36.6 && P.x > 32 && P.x < 38 && P.mode !== 'push', '跳上推车，再跳向高台的边缘');
  hint(() => P.x > 55.5 && P.x < 60.4 && P.cp < 3, '躲进矮墙的影子里，等光束扫过去');
  hint(() => !LEVER.pulled && P.y > 0.6 && Math.abs(P.x - LEVER.x) < 0.85, '按 <b>E</b> 拉下断电杆');
  hint(() => !LEVER.pulled && crate.x >= 96 && P.x > 93 && P.x < 99 && P.y < 0.5 && P.mode !== 'push', '跳上箱子');
  hint(() => !LEVER.pulled && crate.x < 96 && P.x > 95.6 && P.x < 98.6 && P.y < 0.5, '断电杆太高了，够不着');
  hint(() => !LEVER.pulled && crate.x < 95 && P.x > 85.5 && P.x < 93 && Math.abs(P.x - crate.x) < 2.4 && P.mode !== 'push', '按住 <b>E</b> 推箱子 —— 地上的拖痕通向断电杆');

  // 灯
  for (const [x, y, ty] of [[3.5, 10, 0.3], [30.5, 11, 0.3], [44.5, 12, 3.2], [18.5, 10, 0.9]]) spotLight({ p: [x + 1.6, y, 2.5], t: [x, ty, -0.4] });   // 天窗漏下来的冷光
  spotLight({ p: [91, 10, 2.5], t: [89.4, 0.3, -0.4] });
  spotLight({ p: [93, 9.5, -1.5], t: [96, 4.4, BELT_Z], i: 2.6, a: 0.52 });                         // 打在输送带上的一束
  const bulb = pointLight({ p: [33, 5.0, -1.6], c: 0xffb463, i: 9, d: 11 });                        // 推车上方一盏暖色的吊灯
  const leverL = pointLight({ p: [LEVER.x, 2.9, 0.2], c: 0xff4a2a, i: 2.2, d: 5, dec: 2 });
  const doorL = pointLight({ p: [103.0, 1.5, 0.5], c: 0xffc98a, i: 16, d: 18, dec: 1.3, on: 0 });
  const pressL = pointLight({ p: [100.0, 5.3, -4.2], c: 0xffa23a, i: 7, d: 7, on: 0 });             // 压机侧面的检修灯
  const beacons = [pointLight({ p: [3.2, 4.6, -2.4], c: 0xff3a22, i: 5, d: 10 }), pointLight({ p: [26.6, 4.6, -2.4], c: 0xff3a22, i: 5, d: 10 })];

  let V = null;                                          // 画面上的东西（这一章被卸载时清空）
  const C_CALM = new THREE.Color(0xe2eef2), C_ALERT = new THREE.Color(0xff5030);
  function aimWatcher(tx, ty, alert) {
    beam.target.position.set(tx, ty, 0);
    beam.color.lerpColors(C_CALM, C_ALERT, alert);
    if (!V) return;
    const len = Math.hypot(tx - beam.position.x, ty - beam.position.y, beam.position.z) + 1.2;
    for (const c of V.cones) { c.lookAt(tx, ty, 0); c.scale.setScalar(len / 26); c.material.color.copy(beam.color); }
    V.wHead.lookAt(tx, ty, 0); V.eyeMat.color.copy(beam.color); V.eyeGlow.material.color.copy(beam.color);
  }

  function* build(R) {
    // ---------------- 布景板：废弃的巨型厂房 ----------------
    // 最远的后墙：一排高窗透进冷光。逆光的关键在这里 —— 整块板提亮 30 倍，隔着八成多的雾，墙和窗还是比雾亮
    const backWall = (x1, x2) => backdrop(x1, x2, -2, 46, -32, 9, g => {
      setInk(g, '#131b1e'); box(g, -90, -2, 196, 48);
      for (let x = -84; x < 104; x += 8.5) {
        const gr = g.createLinearGradient(0, 28, 0, 5); gr.addColorStop(0, '#93aab0'); gr.addColorStop(1, '#2b3a3f');
        g.fillStyle = gr; box(g, x, 5, 1.7, 23);
        setInk(g, '#131b1e'); for (let y = 8; y < 28; y += 3.2) box(g, x - 0.1, y, 1.9, 0.28);
      }
    });
    backWall(-90, 104.7).material.color.setScalar(30);
    backWall(104.7, 106);                                 // 出口那面墙外侧露出的一小段不提亮：从第二章回头看，它只是厂房的一条暗边
    yield;
    // 高窗照进来的光：朝着镜头、斜着向下穿过雾，从每扇窗往左下铺开一片。
    // 它是紧贴在后墙前面的一层发光的薄片，不是立体的光柱：真的光柱要往镜头这边走十几米才落地，会罩在远处那排柱子和
    // 探照灯前面，把它们的剪影冲淡。每一片的形状 = 从定稿那一屏的镜头看过去，那道光柱的轮廓落在后墙上的样子
    // （离那一屏很远的窗子，就当镜头在它的斜对面）。坡道上方那一扇（x = 52）不画：它的光会落在远处的坡面上，成了一块亮斑
    const WINS = []; for (let x = -58.5; x < 100; x += 8.5) if (Math.abs(x - 52) > 1) WINS.push(x);
    const REF = [69.43, 3.025, 20.5], LD = [-0.16, -0.83, 0.53];   // 定稿那一屏（主角站在 x = 67.25）的镜头位置；光的方向
    backdrop(-90, 106, -2, 29, -31.9, 10, g => {
      const gr = g.createLinearGradient(0, 6.66, 0, -0.98);         // 窗子下面最亮，越往地面越淡
      gr.addColorStop(0, 'rgba(190,222,230,.22)'); gr.addColorStop(0.55, 'rgba(190,222,230,.1)'); gr.addColorStop(1, 'rgba(190,222,230,.02)');
      g.fillStyle = gr;
      for (const x of WINS) {
        const cx = clamp(REF[0], x - 17, x + 9), pts = [];
        for (const [wx, wy] of [[x, 5], [x + 1.7, 5], [x, 28], [x + 1.7, 28]]) {                 // 窗子的四个角，和从每个角出发的光落到地上的那一点
          const t = wy / -LD[1], fx = wx + LD[0] * t, fz = -32 + LD[2] * t, k = (-32 - REF[2]) / (fz - REF[2]);
          pts.push([wx, wy], [cx + (fx - cx) * k, REF[1] * (1 - k)]);                             // 落地点沿着视线投到后墙上
        }
        poly(g, hull(pts));
      }
    }, { additive: true, fog: false, blur: 4, order: -127 });
    // 光落在地上的那一块：靠墙的一头亮，朝镜头这一头淡下去
    backdrop(-90, 106, -31, -11, 0, 5, g => {
      g.fillStyle = vgrad(g, -29, -13, 'rgba(190,222,230,.15)', 'rgba(190,222,230,.03)');
      for (const x of WINS) poly(g, [[x - 0.96, -28.8], [x + 0.74, -28.8], [x - 3.7, -14.1], [x - 5.4, -14.1]]);
    }, { floor: 0.03, additive: true, fog: false, blur: 2, order: -100 });
    yield;
    // 高窗与天窗漏下来的光（叠加发光，不受雾影响）
    backdrop(-60, 106, -1, 26, -30, 7, g => {
      for (let x = -84 + 8.5 * 3; x < 104; x += 8.5) {
        const gr = g.createLinearGradient(0, 26, 0, 2); gr.addColorStop(0, 'rgba(150,185,192,.30)'); gr.addColorStop(1, 'rgba(150,185,192,0)');
        g.fillStyle = gr; box(g, x - 1.4, 2, 4.5, 24);
      }
    }, { additive: true, fog: false, blur: 6 });
    yield;
    // 远景：一排高大的拱廊；探照灯机器站在中间那个大开口后面
    backdrop(-50, 106, -1, 26, -16, 20, g => {
      setInk(g, '#0d1416');
      g.beginPath(); g.rect(-50, -1, 156, 27);
      const arch = (x1, x2, top) => { const r = (x2 - x1) / 2; g.moveTo(x1, -1); g.lineTo(x1, top - r); g.arc(x1 + r, top - r, r, Math.PI, 0, true); g.lineTo(x2, -1); g.closePath(); };
      for (const x of [-46, -36, -26, -16, -6, 4, 14, 24, 34, 44]) arch(x, x + 7.2, 13);
      g.moveTo(56.5, -1); g.lineTo(56.5, 11); g.lineTo(58.5, 13.5); g.lineTo(83.5, 13.5); g.lineTo(85.5, 11); g.lineTo(85.5, -1); g.closePath();
      for (const x of [-11, 9, 29, 49, 94.5]) { g.moveTo(x + 3.4, 19.5); g.arc(x + 0.6, 19.5, 2.8, 0, 6.2832); }   // 排风扇的圆洞
      g.fill('evenodd');
      for (const x of [-11, 9, 29, 49, 94.5]) fan(g, x + 0.6, 19.5, 2.6);   // 洞里的扇叶
      truss(g, 56.5, 85.5, 13.5, 1.4, 0.12);
      for (const x of [61, 66.5, 75, 81]) cable(g, x, 13.6, x + rr(2, 4), 13.6, rr(1.5, 4), 0.07);
    });
    yield;
    // 拱廊后面的大厅：一排阶形柱（下半截粗，到了托行车梁的肩部收窄，上半截细）。
    // 前半章只能从拱洞里看到它们；到了探照灯场地，拱廊让开一个大口，整排柱子露出来，中间两根正好一左一右夹着那台机器。
    // 探照灯的眼睛在 z = -19，光束扫的是它前面的三角形：高的东西要么像这一排站在它后面，要么像下面那两根近柱靠在两侧
    const pillar = (x, z, shadow) => {
      add(R, bx(1.5, 8.6, 1.5), MAT.concrete, x, 3.3, z, shadow); add(R, bx(1.95, 0.5, 1.95), MAT.concrete, x, 7.85, z, shadow);
      add(R, bx(1.0, 40, 1.0), MAT.concrete, x, 28.1, z, shadow); add(R, bx(2.1, 1.1, 2.1), MAT.concrete, x, 0.55, z, shadow);   // 柱身、肩、上柱、柱脚
    };
    for (let x = -35; x < 103; x += 8.5) pillar(x, -26, false);
    // 行车梁：一道桁架，架在这排柱子的肩上，从坡道后面那根柱子一直到厂房尽头的墙。
    // （没有往前半章延伸：那边近处已经有一道桁架，两道叠在一起看着乱）
    backdrop(49.2, 103.3, 3, 11.5, -25, 48, g => {
      setInk(g, '#0a1012');
      truss(g, 49.2, 103.3, 8.15, 1.25, 0.11); box(g, 49.2, 9.4, 54.1, 0.14);
      // 探照灯场地左边那一跨停着行车的小车：两股链条吊着滑轮组和钩子，从定稿那一屏看过去正好垂在一扇高窗前面
      box(g, 61.25, 7.45, 2.4, 0.72); box(g, 60.95, 8.02, 3.0, 0.2); disc(g, 61.6, 8.22, 0.2); disc(g, 63.3, 8.22, 0.2);
      line(g, [[62.3, 7.45], [62.3, 6.5]], 0.06); line(g, [[62.6, 7.45], [62.6, 6.5]], 0.06);
      box(g, 62.08, 5.75, 0.74, 0.8); g.beginPath(); g.ellipse(62.45, 5.75, 0.37, 0.2, 0, 0, 6.2832); g.fill();
      g.lineWidth = 0.13; g.beginPath(); g.moveTo(62.45, 5.6); g.lineTo(62.45, 5.25); g.arc(62.2, 5.25, 0.25, 0, Math.PI, true); g.stroke();
    });
    yield;
    // 中景：机器残骸、龙门架、楼梯
    backdrop(-30, 106, -1, 20, -8, 26, g => {
      setInk(g, '#0a1012');
      // 熔炉 + 烟道
      box(g, -1, 0, 7, 4.6); box(g, 0.2, 4.6, 1.5, 15.4); box(g, -1.4, 3.9, 7.8, 0.5); box(g, 3.2, 4.6, 2.2, 1.3);
      for (const x of [0, 2, 4]) { g.clearRect(x + 0.35, 1.2, 1.1, 0.16); g.clearRect(x + 0.35, 1.6, 1.1, 0.16); }
      // 储罐与箱堆
      g.beginPath(); g.moveTo(13.5, 0); g.lineTo(13.5, 3.2); g.arc(15.4, 3.2, 1.9, Math.PI, 0, true); g.lineTo(17.3, 0); g.fill();
      box(g, 14.9, 5.1, 0.35, 14.9); box(g, 18.2, 0, 1.9, 1.5); box(g, 18.5, 1.5, 1.4, 1.2); box(g, 20.4, 0, 1.3, 1.0);
      // 龙门吊：两条腿 + 横梁 + 小车 + 吊钩
      box(g, 26.2, 0, 0.55, 8.6); box(g, 35.6, 0, 0.55, 8.6); truss(g, 25, 37.6, 8.4, 1.1, 0.1);
      box(g, 29.4, 7.7, 1.8, 0.75); line(g, [[30.3, 7.7], [30.3, 4.3]], 0.06); ring(g, 30.3, 3.9, 0.36, 0.13); g.clearRect(30.25, 3.9, 0.6, 0.5);
      // 夹层的支架和栏杆（对应前景那段高台）
      for (const x of [39, 43, 47, 51]) box(g, x, 0, 0.4, 5.2);
      box(g, 38.4, 5.0, 13.8, 0.35); line(g, [[38.4, 6.3], [52.2, 6.3]], 0.07);
      for (let x = 38.5; x <= 52.2; x += 1.25) line(g, [[x, 5.3], [x, 6.3]], 0.05);
      // 探照灯场地：只放低矮的杂物，别挡住机器
      heap(g, 57, 86, 0, 0.1, 0.7, 0.8); box(g, 63.2, 0, 1.6, 1.1); box(g, 77, 0, 2.2, 0.9);
      // 回收大厅：配电柜、管束、成排的料斗
      box(g, 87.4, 0, 2.6, 5.4); for (const x of [87.8, 88.5, 89.2]) box(g, x, 5.4, 0.3, 14.6);
      for (const x of [91.6, 94.4, 97.2]) { poly(g, [[x, 2.6], [x + 2.2, 2.6], [x + 1.6, 0.9], [x + 0.6, 0.9]]); box(g, x + 0.2, 0, 0.16, 2.6); box(g, x + 1.84, 0, 0.16, 2.6); }
      heap(g, 90, 104, 0, 0.1, 0.6, 0.7);
      // 天花板垂下的链条和缆线
      for (const [x, y] of [[8, 9.2], [10.6, 6.4], [22.5, 7.8], [41, 10.5], [54.5, 8.4], [91, 9.5]]) { line(g, [[x, 20], [x, y]], 0.05); ring(g, x, y - 0.3, 0.3, 0.1); }
      for (let x = -28; x < 100; x += rr(7, 12)) cable(g, x, 20, x + rr(5, 9), 20, rr(2, 6), 0.06);
    });
    yield;
    // 近景：一排工字钢立柱 + 吊车梁 + 管道（场地和回收大厅那两段不放柱子）
    backdrop(-25, 106, -1, 15, -3.2, 34, g => {
      const col = (x, w = 0.85) => {
        const gr = g.createLinearGradient(x - w / 2, 0, x + w / 2, 0); gr.addColorStop(0, '#070b0d'); gr.addColorStop(0.75, '#0b1215'); gr.addColorStop(1, '#172226');
        g.fillStyle = gr; box(g, x - w / 2, -1, w, 16);
        setInk(g, '#070b0d'); box(g, x - w * 0.9, -1, w * 1.8, 1.45); box(g, x - w * 0.8, 6.3, w * 1.6, 0.4);
        poly(g, [[x + w / 2, 5.2], [x + w * 1.5, 6.3], [x + w / 2, 6.3]]); poly(g, [[x - w / 2, 5.2], [x - w * 1.5, 6.3], [x - w / 2, 6.3]]);
      };
      setInk(g, '#070b0d');
      truss(g, -25, 55, 6.7, 0.9, 0.08); box(g, 11.6, 5.55, 32, 0.2); box(g, 11.6, 5.15, 32, 0.14);
      for (const x of [-4, 11.6, 27, 43.5, 54.5, 84.4]) col(x);
      setInk(g, '#070b0d');
      for (const [x, y] of [[3, 5.9], [18.5, 5.4], [33, 5.9]]) { line(g, [[x, 6.7], [x, y]], 0.04); box(g, x - 0.28, y - 0.22, 0.56, 0.22); }   // 吊灯
      cable(g, 16, 6.7, 24, 6.7, 1.3); cable(g, 45, 6.7, 53.5, 6.7, 1.8); cable(g, -2, 6.7, 9, 6.7, 0.9);
    });
    yield;
    // 前景：离镜头最近的一层，全黑、略微虚焦，不挡住主角。
    // （原来沿着画面下沿还有一道废料堆的剪影；以这个镜头的高度看过去，它前面还露着一截地面，成了横在地面中间的一道黑带，去掉了）
    backdrop(-22, 104.6, -3, 10, 6, 22, g => {
      setInk(g, '#040607');
      for (const [x, w] of [[7.2, 0.34], [52.4, 0.5]]) box(g, x, -3, w, 13);                       // 两根近处的柱子：经过时扫过画面
      for (let x = -20; x < 100; x += rr(9, 17)) cable(g, x, 10, x + rr(6, 12), 10, rr(1.6, 2.5), 0.09);  // 顶上垂下的缆线
    }, { fog: false, blur: 2.2, order: 4000 });
    // 探照灯场地的前景：更靠近镜头的地方垂着几根链条，左边一根挂着环，右边一根挂着带滑轮的吊钩。只占画面上半。
    // 它们随着镜头移动会从探照灯机器前面扫过去，所以最低也要停在它的头顶以上，不能挡住那只“眼睛”
    backdrop(62, 77, -1.2, 6.4, 8, 60, g => {
      setInk(g, '#05080a');
      const chain = (x, y) => { g.setLineDash([0.075, 0.05]); line(g, [[x, 6.4], [x, y]], 0.05); g.setLineDash([]); };
      chain(72.55, 4.45); box(g, 72.38, 4.02, 0.34, 0.44); g.beginPath(); g.ellipse(72.55, 4.02, 0.17, 0.1, 0, 0, 6.2832); g.fill();
      g.lineWidth = 0.065; g.beginPath(); g.moveTo(72.55, 3.95); g.lineTo(72.55, 3.8); g.arc(72.43, 3.8, 0.12, 0, Math.PI, true); g.stroke();
      chain(65.2, 4.25); ring(g, 65.2, 4.13, 0.12, 0.05);
      chain(73.9, 4.9);
      cable(g, 61.5, 5.75, 68.6, 6.5, 0.55, 0.05); cable(g, 70.2, 6.5, 77.5, 5.5, 0.75, 0.05); cable(g, 66.5, 6.5, 74.5, 6.5, 0.45, 0.035);
    }, { fog: false, blur: 2.4, order: 4000 });
    yield;
    // 光束本身：几块斜着的发光薄片
    backdrop(-6, 104, -0.5, 16, -2.2, 12, g => {
      for (const [x, w, a] of [[3.5, 3.4, 0.2], [30.5, 3.8, 0.17], [44.5, 3.4, 0.15], [18.5, 2.6, 0.1], [89.4, 3.2, 0.13]]) {
        const gr = g.createLinearGradient(0, 16, 0, 0); gr.addColorStop(0, `rgba(190,222,230,${a})`); gr.addColorStop(0.75, `rgba(190,222,230,${a * 0.55})`); gr.addColorStop(1, 'rgba(190,222,230,0)');
        g.fillStyle = gr; poly(g, [[x + 2.4, 16], [x + 3.3, 16], [x + w / 2 + 0.2, 0], [x - w / 2, 0]]);
      }
    }, { additive: true, fog: false, blur: 9, order: 40 });
    yield;

    // ---------------- 3D 道具 ----------------
    const v = {};
    // 地面的伸缩缝：一道道伸向远处的细线，增强纵深感
    for (let x = -18; x < 102; x += 5.5) if (x < 46 || x > 58) add(R, bx(0.07, 0.012, 34), MAT.dark, x, 0.004, -8, false).receiveShadow = true;
    for (const z of [3.2, -4.5]) add(R, bx(124, 0.012, 0.07), MAT.dark, 40, 0.004, z, false);
    yield;
    // ---------------- 探照灯场地的地面 ----------------
    // 一层贴在地上、跟着灯光和影子明暗的薄片。上面画着：每块水泥板略有不同的深浅、油渍、零星的黑点、几块补过的地方、拖痕；
    // 再上面是一摊摊浅水 —— 水面比干的地方暗。形状用自带种子的随机数，不跟着这一章里别的随机数变
    const seeded = s => () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    const pools = [];                                    // 每一摊水由四个椭圆叠成 [x, z, 半长, 半宽]
    { const rn = seeded(23); for (let i = 0; i < 60; i++) { const x = 55 + rn() * 31, z = -7 + rn() * 16, r = 0.6 + rn() * 1.6; for (let k = 0; k < 4; k++) pools.push([x + (rn() - 0.5) * r * 2.4, z + (rn() - 0.5) * r * 0.9, r * (0.5 + rn()), r * (0.25 + 0.35 * rn())]); } }
    const water = g => { g.beginPath(); for (const [x, z, rx, rz] of pools) { g.moveTo(x + rx, z); g.ellipse(x, z, rx, rz, 0, 0, 6.2832); } g.fill(); };
    backdrop(53.5, 87, -26, 12, 0, 40, g => {
      const rn = seeded(7), xs = [53.5, 59, 64.5, 70, 75.5, 81, 86.5], zs = [-26, -19.5, -12, -4.5, 3.2, 12];
      for (let i = 0; i < xs.length - 1; i++) for (let j = 0; j < zs.length - 1; j++) {           // 水泥板：沿着伸缩缝一格一格
        g.fillStyle = rn() < 0.55 ? `rgba(0,0,0,${(0.08 + 0.3 * rn()).toFixed(3)})` : `rgba(150,172,178,${(0.03 + 0.08 * rn()).toFixed(3)})`;
        g.fillRect(xs[i], zs[j], xs[i + 1] - xs[i], zs[j + 1] - zs[j]);
      }
      const blot = (x, z, r, sx, a) => {                                                          // 一团污渍：中间一大片是实的，只有边上一圈晕开
        const gr = g.createRadialGradient(0, 0, 0, 0, 0, r); gr.addColorStop(0, `rgba(0,0,0,${a})`); gr.addColorStop(0.78, `rgba(0,0,0,${a * 0.9})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
        g.save(); g.translate(x, z); g.scale(sx, 1); g.fillStyle = gr; g.fillRect(-r, -r, 2 * r, 2 * r); g.restore();
      };
      for (let i = 0; i < 30; i++) { const x = 55 + rn() * 30, z = -9 + rn() * 17, r = 0.2 + rn() * 0.7, a = 0.1 + 0.13 * rn(); for (let k = 0; k < 3; k++) blot(x + (rn() - 0.5) * r * 2, z + (rn() - 0.5) * r, r * (0.5 + 0.6 * rn()), 1 + rn() * 1.6, a); }
      for (let i = 0; i < 700; i++) { g.fillStyle = `rgba(0,0,0,${(0.2 + 0.35 * rn()).toFixed(2)})`; g.fillRect(55 + rn() * 30, -9 + rn() * 17, 0.03 + rn() * 0.09, 0.03 + rn() * 0.06); }
      for (const [a, b] of WATCH.walls) blot((a + b) / 2, -0.75, 0.7, 1.9, 0.3);                  // 铁柜脚下积着的黑
      for (const [x, z, w, d] of [[61.2, 1.0, 1.7, 1.1], [72.3, -2.6, 2.3, 1.3], [78.6, 5.2, 1.5, 1.8]]) { g.fillStyle = 'rgba(160,180,186,.11)'; g.fillRect(x, z, w, d); }   // 补过的几块
      g.strokeStyle = 'rgba(0,0,0,.3)'; g.lineCap = 'round';
      for (let i = 0; i < 9; i++) { const x = 56 + rn() * 24, z = -3 + rn() * 7; g.lineWidth = 0.04 + rn() * 0.07; g.beginPath(); g.moveTo(x, z); g.quadraticCurveTo(x + 2 + rn() * 2, z + (rn() - 0.5) * 0.6, x + 4 + rn() * 5, z + (rn() - 0.5) * 0.9); g.stroke(); }   // 拖痕
      blurDraw(g, 3, g => { g.fillStyle = 'rgba(4,7,10,.45)'; water(g); });                      // 水
    }, { floor: 0.006, lit: true, order: -30, fadeL: 2.5, fadeR: 2.5 });                           // 两头渐渐淡掉，和场地外面干净的地面接上时看不出一条边
    yield;
    // 探照灯在水里的倒影：一道朝着镜头拉长的亮光，只留在有水的地方。
    // 它落在哪里取决于镜头在哪里（灯关于地面的镜像和镜头的连线穿过地面的那一点），所以这一块面上叠了两张贴图：
    // 水的形状是不动的；光的那一张每一帧在 update 里平移、旋转到该在的位置。没有用材质自带的高光 —— 这盏灯太亮，贴着地面看过去高光会白成平平的一大片
    {
      const [lc, lg] = mkCanvas(64, 512), gr = lg.createRadialGradient(0, 0, 0, 0, 0, 1);
      gr.addColorStop(0, 'rgba(215,232,238,.8)'); gr.addColorStop(0.35, 'rgba(215,232,238,.42)'); gr.addColorStop(1, 'rgba(215,232,238,0)');
      lg.setTransform(30, 0, 0, 254, 32, 256); lg.fillStyle = gr; lg.fillRect(-1, -1, 2, 2);       // 四周留一圈透明的边，贴图外面才是空的
      const [mc, mg] = mkCanvas(858, 520);
      mg.setTransform(26, 0, 0, 26, -54 * 26, 9 * 26); mg.fillStyle = '#fff'; blurDraw(mg, 2, water);
      const light = canvasTex(lc), mask = canvasTex(mc); light.matrixAutoUpdate = false; mask.colorSpace = THREE.NoColorSpace;
      light.generateMipmaps = false; light.minFilter = THREE.LinearFilter;                          // 不要缩小用的那几级贴图：贴着地面看过去它们会把这道光抹平、抹宽，四周那圈透明的边也会被抹掉
      const mat = new THREE.MeshBasicMaterial({ map: light, alphaMap: mask, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
      mat.userData.own = true;
      v.glint = new THREE.Mesh(new THREE.PlaneGeometry(33, 20), mat);                              // 铺在 x = 54 … 87、z = -9 … 11 这一片地上
      v.glint.rotation.x = -Math.PI / 2; v.glint.position.set(70.5, 0.008, 1); v.glint.renderOrder = -28; R.add(v.glint);
      renderer.initTexture(light); renderer.initTexture(mask);
    }
    // 倒在地上的工字钢、水泥台、高台
    add(R, bx(1.3, 0.45, 2.7), MAT.rust, 9.65, 0.225, -0.15).rotation.y = 0.07;
    add(R, bx(1.36, 0.07, 2.76), MAT.rust2, 9.65, 0.45, -0.15).rotation.y = 0.07;
    add(R, bx(4, 0.9, 4.4), MAT.concrete, 17, 0.45, -0.7);
    add(R, bx(4.04, 0.06, 0.1), MAT.edge, 17, 0.9, 1.48, false);
    add(R, bx(1.7, 0.55, 1.5), MAT.concrete, 20.3, 0.27, -2.2).rotation.y = 0.5;
    for (const [x, h] of [[15.5, 0.5], [16.1, 0.8], [18.6, 0.6]]) add(R, cy(0.02, 0.02, h, 5), MAT.rust, x, 0.9 + h / 2, -2.6).rotation.z = rr(-0.3, 0.3);   // 露出的钢筋
    add(R, bx(10, 3, 8.6), MAT.concrete, 43, 1.5, -2.05);
    add(R, bx(10.04, 0.08, 0.12), MAT.edge, 43, 3.0, 2.22, false);
    for (let x = 38.6; x < 48; x += 2.35) add(R, bx(0.5, 2.5, 0.14), MAT.dark, x + 0.5, 1.35, 2.26, false);       // 高台正面的凹槽
    for (let x = 38.3; x <= 57.2; x += 1.6) add(R, cy(0.03, 0.03, 1.05, 6), MAT.dark, x, groundY(Math.max(x, 48.05)) + 0.52, -3.4);   // 栏杆
    { const pts = []; for (let x = 38.3; x <= 57.2; x += 1.6) pts.push(V3(x, groundY(Math.max(x, 48.05)) + 1.05, -3.4));
      add(R, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.05), 60, 0.03, 5), MAT.dark); }
    // 轨道 + 推车
    for (const z of [-0.42, 0.42]) add(R, bx(16.6, 0.07, 0.07), MAT.steel, 30.3, 0.035, z, false).receiveShadow = true;
    for (let x = 22.4; x < 38.6; x += 0.8) add(R, bx(0.16, 0.03, 1.25), MAT.dark, x, 0.016, 0, false).receiveShadow = true;
    v.cartG = grp(R, cart.x, 0, 0); v.wheels = [];
    add(v.cartG, bx(cart.w, 0.56, 1.15), MAT.rust, 0, 0.67, 0);
    add(v.cartG, bx(cart.w + 0.06, 0.07, 1.21), MAT.rust2, 0, 0.92, 0);
    add(v.cartG, bx(cart.w + 0.04, 0.1, 1.19), MAT.dark, 0, 0.42, 0);
    add(v.cartG, bx(0.5, 0.3, 1.17), lam(0x8a7a5c), 0.2, 0.68, 0);                     // 褪色的黄色标记
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const w = add(v.cartG, cy(0.19, 0.19, 0.1, 14), MAT.dark, sx * 0.48, 0.19, sz * 0.5); w.rotation.x = Math.PI / 2; v.wheels.push(w);
      add(w, bx(0.3, 0.12, 0.04), MAT.steel, 0, 0, 0, false);
    }
    v.bulbGlow = glow(R, 0xffbe72, 2.6, 0.9, 33, 5.62, -3.15);
    yield;
    // 探照灯场地两侧的两根近柱：和远处那一排同一个样子，站在光束扫不到的地方，把这一屏的画面收住
    pillar(62, -12, true); pillar(79.5, -12, true);
    // 探照灯场地上能躲的地方：一处处并排站着的配电柜，每只底下垫着一圈缩进去的深色底座
    const cabM = lam(0x2c363b); cabM.userData.own = true;
    WATCH.walls.forEach(([a, b], i) => {
      let x = a;
      for (const [k, h, d] of cabinets(i)) {
        const w = (b - a) * k, z = CAB_Z - d / 2;
        add(R, bx(w, h - 0.08, d), cabM, x + w / 2, 0.08 + (h - 0.08) / 2, z); add(R, bx(w - 0.08, 0.08, d - 0.08), MAT.dark, x + w / 2, 0.04, z);
        x += w;
      }
    });
    // 探照灯机器：三条长腿撑着一个会转动的“头”
    const watcher = grp(R, WATCH.ex, 0, WATCH.ez);
    for (const [x, z] of [[-2.8, -1.6], [2.8, -1.6], [0, 2.4]]) {
      const a = V3(x, 0, z), b = V3(x * 0.12, 3.1, z * 0.12), leg = add(watcher, cy(0.09, 0.14, a.distanceTo(b), 8), MAT.dark);
      leg.position.copy(a).add(b).multiplyScalar(0.5); leg.quaternion.setFromUnitVectors(V3(0, 1, 0), b.clone().sub(a).normalize());
    }
    add(watcher, cy(0.5, 0.62, 0.5, 12), MAT.dark, 0, 3.1, 0);
    add(watcher, cy(0.05, 0.05, 4.2, 6), MAT.dark, -0.5, 5.6, -0.4);
    v.wHead = grp(watcher, 0, WATCH.ey, 0);
    add(v.wHead, bx(1.25, 0.85, 1.5), MAT.dark, 0, 0, -0.1);
    add(v.wHead, cy(0.36, 0.42, 0.4, 16), MAT.steel, 0, 0, 0.72).rotation.x = Math.PI / 2;
    v.eyeMat = unlit(0xeaf4f6, { fog: false });
    add(v.wHead, new THREE.CircleGeometry(0.3, 20), v.eyeMat, 0, 0, 0.93, false);
    v.eyeGlow = glow(v.wHead, 0xdfeef2, 8, 0.85, 0, 0, 1.0, GLOW_SOFT);   // 眼睛外面一大圈柔和的光晕
    v.cones = [];                                        // 看得见的光柱：两层半透明的圆锥叠在一起
    for (const [k, op] of [[1, 0.075], [0.55, 0.09]]) {
      const geo = new THREE.ConeGeometry(Math.tan(0.118) * 26 * k, 26, 28, 1, true); geo.translate(0, -13, 0); geo.rotateX(-Math.PI / 2);
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: beamGradTex(), color: 0xd8ecf2, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
      m.position.set(WATCH.ex, WATCH.ey, WATCH.ez + 0.95); m.renderOrder = 60; R.add(m); v.cones.push(m);
    }
    yield;

    // 上层的通道：警报响起后，同一批次的机器人沿着它往前跑。07 就是从那截断开的格栅掉下来的
    add(R, bx(62, 0.14, 1.3), MAT.steel, 6, CAT_Y - 0.07, CAT_Z);
    for (let x = -24; x <= 36; x += 2.5) { add(R, cy(0.025, 0.025, 1.0, 5), MAT.dark, x, CAT_Y + 0.5, CAT_Z - 0.6, false); add(R, cy(0.03, 0.03, 5, 5), MAT.dark, x, CAT_Y + 2.5, CAT_Z - 0.62, false); }
    add(R, bx(62, 0.05, 0.05), MAT.dark, 6, CAT_Y + 1.0, CAT_Z - 0.6, false);
    add(R, bx(3.4, 3.2, 2.6), MAT.dark, 38.4, CAT_Y + 1.5, CAT_Z);                                     // 通道尽头的罩子：队伍跑进去就看不见了
    add(R, bx(1.5, 0.12, 3.3), MAT.steel, 2.0, CAT_Y - 0.06, CAT_Z + 2.2).rotation.z = -0.05;          // 伸向前方的一截格栅
    add(R, bx(0.9, 0.06, 1.0), MAT.dark, 2.45, CAT_Y - 0.42, -0.95).rotation.set(0.25, 0.1, -1.05);     // 踩塌的那一块，还挂在边上
    v.beacons = [3.2, 26.6, 50.2].map(x => { add(R, bx(0.22, 0.3, 0.22), MAT.dark, x, 4.6, -2.85, false); return glow(R, 0xff3a22, 1.9, 0.9, x, 4.6, -2.7); });
    yield;
    v.runners = [];
    for (let i = 0; i < RUN1.list.length; i++) { v.runners.push(makeNPC('R', R, { y: CAT_Y, z: CAT_Z, visible: false })); if (i % 2) yield; }
    yield;

    // 回收大厅：上层的输送带、压机、料斗
    add(R, bx(17.2, 0.3, 1.5), MAT.dark, 92.6, BELT_Y - 0.15, BELT_Z);
    add(R, bx(17.2, 0.06, 1.3), MAT.steel, 92.6, BELT_Y + 0.02, BELT_Z).receiveShadow = true;
    v.rollers = []; for (let x = 84.6; x <= 100.8; x += 1.35) { const r = add(R, cy(0.16, 0.16, 1.6, 10), MAT.steel, x, BELT_Y - 0.2, BELT_Z, false); r.rotation.x = Math.PI / 2; v.rollers.push(r); }
    for (const x of [88, 93, 98]) for (const z of [-0.85, 0.85]) add(R, cy(0.045, 0.045, 12, 5), MAT.dark, x, BELT_Y + 6, BELT_Z + z, false);   // 吊杆
    add(R, bx(2.6, 3.4, 2.6), MAT.dark, 83.4, BELT_Y + 1.5, BELT_Z);                                    // 输送带从这只罩子里出来
    for (const x of [100.5, 103.3]) add(R, bx(0.5, 9.2, 2.2), MAT.steel, x, 4.6, BELT_Z);              // 压机的两根立柱
    add(R, bx(3.5, 1.1, 2.4), MAT.steel, 101.9, 8.2, BELT_Z);
    add(R, bx(2.3, 0.5, 1.9), MAT.dark, 101.9, BELT_Y - 0.25, BELT_Z);                                  // 砧座
    v.ram = add(R, bx(2.2, 1.5, 1.8), MAT.rust2, 101.9, 6.5, BELT_Z);
    add(v.ram, cy(0.22, 0.22, 2.4, 10), MAT.steel, 0, 1.6, 0, false);
    add(v.ram, bx(2.26, 0.14, 1.86), MAT.rust, 0, -0.7, 0, false);
    add(R, bx(0.3, 0.42, 0.3), MAT.dark, 100.2, 5.3, BELT_Z + 1.2, false);
    v.pressLamp = glow(R, 0xffa23a, 1.7, 0, 100.2, 5.3, BELT_Z + 1.4);
    v.pressLens = add(R, new THREE.SphereGeometry(0.1, 10, 8), unlit(0x3a2410, { fog: false }), 100.2, 5.3, BELT_Z + 1.38, false);
    // 料斗：压机下面一只敞口的铁箱，里面是拆下来的外壳和零件
    for (const [w, d, x, z] of [[2.7, 0.12, 101.9, BELT_Z + 1.25], [2.7, 0.12, 101.9, BELT_Z - 1.25], [0.12, 2.5, 100.6, BELT_Z], [0.12, 2.5, 103.2, BELT_Z]]) add(R, bx(w, 1.25, d), MAT.sheet, x, 0.625, z);
    const shellM = lam(0x7c8c82, { emissive: 0x7c8c82, emissiveIntensity: 0.08 }), jointM = lam(0x1b1f20);
    v.parts = [];
    for (let i = 0; i < 14; i++) {
      const k = i % 4, geo = k === 0 ? new THREE.SphereGeometry(0.2, 10, 6, 0, 6.2832, 0, Math.PI / 2) : k === 1 ? cy(0.06, 0.07, 0.5, 8) : k === 2 ? bx(0.36, 0.3, 0.3) : cy(0.07, 0.09, 0.42, 8);
      const m = add(R, geo, k === 3 ? jointM : shellM, 101.9 + rr(-0.95, 0.95), 1.05 + 0.035 * i + rr(0, 0.12), BELT_Z + rr(-0.8, 0.9));
      m.rotation.set(rr(-1.5, 1.5), rr(0, 3), rr(-1.5, 1.5)); v.parts.push(m);
    }
    yield;
    v.bots = []; for (let i = 0; i < LINE.bots.length; i++) { v.bots.push(makeNPC('R', R, { y: BELT_Y + 0.05, z: BELT_Z, pose: { limp: 1 } })); if (i % 2) yield; }
    yield;
    // 断电杆：装在一根立柱高处的闸刀 —— 站在地上够不着
    add(R, bx(0.34, 7, 0.34), MAT.steel, LEVER.x, 3.5, -0.78);
    add(R, bx(0.5, 0.7, 0.3), MAT.dark, LEVER.x, 2.35, -0.5);
    v.leverArm = grp(R, LEVER.x, 2.36, -0.3);
    add(v.leverArm, cy(0.03, 0.03, 0.56, 8), MAT.dark, 0, 0.28, 0); add(v.leverArm, new THREE.SphereGeometry(0.075, 12, 8), lam(0xb0452e), 0, 0.58, 0);
    v.leverLamp = unlit(0xff4a2a); add(R, new THREE.SphereGeometry(0.075, 10, 8), v.leverLamp, LEVER.x, 2.92, -0.46, false);
    tube(R, [[LEVER.x, 2.7, -0.7], [LEVER.x + 0.3, 5.5, -1.8], [LEVER.x + 1.6, 7.4, -3.6], [100.4, 8.4, BELT_Z + 0.6]], 0.035, MAT.dark);   // 通向压机的电缆
    // 空箱、拖痕、轮挡
    v.crateG = mkCrate(R, crate, 'wood');
    dragMarks(R, 88.2, 97.3);
    add(R, bx(0.22, 0.14, 1.0), MAT.rust, 97.72, 0.07, 0).rotation.z = 0.5;
    yield;
    // 厂房尽头的墙和安全闸门。靠镜头这一侧是一整面黑墙：镜头穿过它时正好切换室内 / 室外的光线
    add(R, bx(1.4, 48, 30.7), MAT.concrete, 104, 23, -16.65);
    add(R, bx(1.4, 44.4, 2.6), MAT.concrete, 104, 3.6 + 22.2, 0);
    add(R, bx(1.4, 70, 40), MAT.black, 105.4, 30, 21.3, false);
    v.door = mkGateDoor(R, door);
    // 门外的天光：门升起来以后，门洞里是一片过曝的暖光
    v.doorGlow = new THREE.MeshBasicMaterial({ color: 0xffdcaa, transparent: true, opacity: 0, fog: false, depthWrite: false });
    add(R, new THREE.PlaneGeometry(2.44, 3.6), v.doorGlow, 104.62, 1.8, 0, false).rotation.y = -Math.PI / 2;
    V = v;
  }

  function stepLine(dt) {
    const L = LINE; if (Math.abs(P.x - 94) > 45) return;
    const vol = sstep(30, 9, Math.abs(P.x - 98)) * (1 - E.ext);
    L.spd = damp(L.spd, L.on ? L.v : 0, 2.5, dt);
    let lead = L.bots[0]; for (const b of L.bots) if (b.x > lead.x) lead = b;
    if (L.phase === 'move') {
      const dx = Math.min(L.spd * dt, BAY - lead.x); for (const b of L.bots) b.x += dx;
      if (L.on && lead.x >= BAY - 1e-4) { L.phase = 'warn'; L.t = 0; fx('tick3', vol); }
    } else if (L.phase === 'warn') {                     // 三次灯号，然后下压
      L.t += dt; L.lamp = L.t < 1.5 && L.t % 0.5 < 0.26 ? 1 : 0;
      if (!L.on) { L.phase = 'move'; L.lamp = 0; } else if (L.t >= 1.6) { L.phase = 'slam'; L.t = 0; L.hit = false; }
    } else if (L.phase === 'slam') {
      L.t += dt; L.ram = Math.min(1, L.t / 0.2);
      if (L.t >= 0.2 && !L.hit) { L.hit = true; fx('press', vol); lead.x -= GAP * L.bots.length; L.parts++; }
      if (L.t >= 0.8) { L.phase = 'rise'; L.t = 0; }
    } else { L.t += dt; L.ram = Math.max(0, 1 - L.t / 1.1); if (L.t >= 1.1) L.phase = 'move'; }
    AUD.belt = vol * clamp(L.spd / L.v, 0, 1);
  }
  function stepRunners(dt) {
    const Q = RUN1; if (Q.t < 0 || state === 'title') return;
    Q.t += dt;
    while (Q.i < SCHED.length && Q.t >= SCHED[Q.i]) { const r = Q.list.find(r => !r.live); if (r) { r.live = true; r.x = clamp(cam.x - 12.5, -23, 22); r.v = lerp(3.9, 4.7, hash1(Q.i * 7.3)); } Q.i++; }
    for (const r of Q.list) if (r.live) { r.x += r.v * dt; if (r.x > 36.9) r.live = false; }
  }
  function update(dt) {
    if (LEVER.pulled) LEVER.t = Math.min(1, LEVER.t + dt * 3.5);
    LEVER.reach = Math.max(0, LEVER.reach - dt);
    if (LEVER.reach > 0) HX.pose = { reach: { x: LEVER.x - 0.36, y: lerp(2.2, 2.8, LEVER.reach / 0.7), k: sstep(0, 0.25, LEVER.reach) } };
    // 探照灯：来回扫；照到没有遮挡的玩家就开始“盯住”，盯满了就算被发现
    const W = WATCH, inHall = P.x < 104.5;
    beam.position.set(W.ex, W.ey, W.ez + 0.95); beam.intensity = inHall && E.ext < 0.5 ? 30 : 0;
    if (W.caught > 0) { W.caught += dt; aimWatcher(P.x, P.y + 0.6, 1); if (W.caught > 1.25 && state === 'play') respawn(); }
    else {
      W.t += dt * W.w * (1 - 0.85 * W.exposure); W.bx = W.cx + W.amp * Math.sin(W.t);
      const inYard = P.x > W.cx - W.amp - W.r && P.x < W.cx + W.amp + W.r && P.y < 2.4;
      const lit = state === 'play' && inYard && Math.abs(P.x - W.bx) < W.r * 0.9 && !inShadow(P.x);
      W.exposure = clamp(W.exposure + (lit ? dt / 0.55 : -dt / 0.9), 0, 1);
      if (W.exposure >= 1) { W.caught = 1e-3; ctl = false; fx('alarm'); }
      const k = sstep(0.15, 1, W.exposure); aimWatcher(lerp(W.bx, P.x, k), lerp(0.35, P.y + 0.6, k), k);
    }
    // 躲在矮墙的影子里、光束又扫到附近时：站住不动的 07 会捂住胸口的灯
    const nearYard = P.x > W.cx - W.amp - 4 && P.x < W.cx + W.amp + 4 && P.y < 2.4;
    if (nearYard && inHall) TIRED.rushT = 0.5;                              // 探照灯底下：顾不上累
    HX.hide = state === 'play' && nearYard && inShadow(P.x) ? sstep(8, 4, Math.abs(P.x - W.bx)) * sstep(2.4, 0.9, Math.abs(P.vx)) : 0;
    HX.alert = W.exposure;
    if (inHall) { AUD.hum = (1 - E.ext) * sstep(34, 6, Math.abs(P.x - W.cx)) * (0.02 + 0.05 * W.exposure); AUD.humF = 52 + 60 * W.exposure; }
    stepLine(dt); stepRunners(dt);
    // 警报：固定的三声，红灯跟着闪；离出口越近越远
    const al = T % 4.6, pulse = al < 0.26 || (al > 0.3 && al < 0.56) || (al > 0.6 && al < 0.86) ? 1 : 0;
    if (state === 'play' && inHall && Math.floor(T / 4.6) !== Math.floor((T - dt) / 4.6)) fx('alarmFar', (1 - E.ext) * lerp(1, 0.3, sstep(0, 100, P.x)));
    for (const b of beacons) b.on = 0.2 + 0.8 * pulse;
    bulb.i = 9 * (0.93 + 0.07 * Math.sin(T * 13) * Math.sin(T * 7.3));     // 吊灯微微闪烁
    leverL.c.set(LEVER.t > 0.5 ? 0x6dff9a : 0xff4a2a);
    doorL.on = E.ext > 0.5 ? 0 : door.open;
    pressL.on = LINE.lamp;

    const v = V; if (!v) return;
    v.cartG.position.x = cart.x; for (const w of v.wheels) w.rotation.y = -cart.x / 0.19;
    v.crateG.position.x = crate.x;
    v.leverArm.rotation.z = lerp(0.95, 2.35, sstep(0, 1, LEVER.t)); v.leverLamp.color.set(LEVER.t > 0.5 ? 0x6dff9a : 0xff4a2a);
    v.door.sync(door);
    v.doorGlow.opacity = E.ext > 0.5 ? 0 : 0.96 * sstep(0.02, 0.8, door.open);
    const lit = E.ext < 0.5; v.bulbGlow.visible = lit; for (const c of v.cones) c.visible = lit;
    // 水里的倒影跟着镜头走：把光的那张贴图挪到“灯关于地面的镜像和镜头的连线穿过地面”的那一点，长轴朝着镜头。
    // 光束正扫向这一点时最亮，平时只剩淡淡的一道；颜色跟着光束（盯上人的时候发红）
    {
      const cp = camera.position, lx = W.ex, ly = W.ey, lz = W.ez + 0.95, k = cp.y / (cp.y + ly), mx = cp.x + k * (lx - cp.x), mz = cp.z + k * (lz - cp.z);
      const th = Math.atan2(lx - cp.x, cp.z - lz), c = Math.cos(th), s = Math.sin(th), WS = 1.3227, LS = 13.747;      // 这道光有多宽、多长（米）
      v.glint.material.map.matrix.set(33 * c / WS, -20 * s / WS, ((54 - mx) * c + (11 - mz) * s) / WS + 0.5,           // 从这块面上的位置换算到光的贴图上
        -33 * s / LS, -20 * c / LS, (-(54 - mx) * s + (11 - mz) * c) / LS + 0.5, 0, 0, 1);
      v.glint.visible = lit; v.glint.material.opacity = lerp(0.4, 1, sstep(5, 1.5, Math.abs(beam.target.position.x - mx))); v.glint.material.color.copy(beam.color);
    }
    for (const b of v.beacons) b.material.opacity = 0.15 + 0.75 * pulse;
    v.ram.position.y = lerp(6.5, 4.78, LINE.ram);
    v.pressLamp.material.opacity = 0.95 * LINE.lamp; v.pressLens.material.color.setHex(LINE.lamp ? 0xffc070 : 0x3a2410);
    for (const r of v.rollers) r.rotation.y += LINE.spd * dt / 0.16;
    v.parts.forEach((m, i) => { m.visible = i < LINE.parts; });
    LINE.bots.forEach((b, i) => { const n = v.bots[i]; n.ch.root.visible = b.x > 84.2; if (n.ch.root.visible) { n.x = b.x; n.step(dt); } });
    RUN1.list.forEach((r, i) => { const n = v.runners[i]; n.ch.root.visible = r.live; if (r.live) { n.x = r.x; n.vx = r.v; n.step(dt); } });
  }
  function reset() {
    placeBox(cart, 25.4); placeBox(crate, 88.6); setGate(door, 0);
    Object.assign(LEVER, { pulled: false, t: 0, reach: 0 }); Object.assign(WATCH, { exposure: 0, caught: 0, t: 0.6 });
    Object.assign(LINE, { on: true, spd: LINE.v, phase: 'move', t: 0, ram: 0, lamp: 0, parts: 3, hit: false }); LINE.bots.forEach((b, i) => { b.x = BAY - 2.2 - i * GAP; });
    Object.assign(RUN1, { t: 0, i: 0 }); RUN1.list.forEach(r => { r.live = false; });
  }
  function solve() {
    reset(); placeBox(cart, 37.15); placeBox(crate, 97.0); LEVER.pulled = true; LEVER.t = 1; setGate(door, 1);
    LINE.on = false; LINE.spd = 0; RUN1.t = -1;
  }
  return defZone({ n: OLD + 1, vis: [-40, 105], build, update, reset, solve, unbuild() { V = null; },
    respawn(c) { if (c.x >= -60 && c.x < 104) Object.assign(WATCH, { exposure: 0, caught: 0, t: 1.2 }); }, cart, crate, door, LEVER, WATCH, LINE, RUN1 });
})();
