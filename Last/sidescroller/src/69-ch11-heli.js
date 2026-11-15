
// ============================================================
//  第十一章 · 夜搜：直升机在找主角
//  （和第九、第十章一样先单独放在最后，从章节菜单进；故事定下来以后再挪到该放的地方）
//  夜里，一条荒废的公路穿过野地。远处传来旋翼声：一架直升机飞过来，机头下面的探照灯罩着一块地面，沿着公路来回地找；
//  远处的野地上还有六架，前后错开排着，各扫各的一条地 —— 是在一片一片地搜。
//  路边有四处灯照不进去的地方：候车亭、锈穿了一面的集装箱、铁皮棚、断桥底下。等灯扫过去，跑到下一处；
//  在没遮没挡的地方被灯罩住半秒多，就算被发现，回到最近的存档点（每一处里面都有一个）。
//  躲进断桥底下以后，直升机压低了在桥头来回找一阵；找不到，掉头飞走。风停了，蟋蟀和萤火虫又回来
// ============================================================
const X11 = 1800;
const CH11 = (() => {
  const X = X11;
  const C = chapter({ n: OLD + 11, x0: X - 40, start: X + 3, name: '夜搜', sub: '躲开直升机的灯',
    intro() { CAT.state = 'none'; } });                    // 这一章先不带小猫（故事还没定它这时候在不在）
  C.ground = 'grass';                                                              // 脚步声：公路是水泥的那一种，过了断桥是土路，再往前是林子里的地
  terrain([X - 70, 0], [X - 8, 0], [X + 6, 0.22], [X + 16, 0.08], [X + 26, 0], [X + 104, 0], [X + 114, 0.35], [X + 128, 1.0], [X + 150, 1.3], [X + 200, 1.3]);
  ground(X - 70, 0x2f3a2e); ground(X + 200, 0x2f3a2e);
  surface(X - 8, X + 106, 'concrete'); surface(X + 106, X + 126, 'dirt'); surface(X + 126, X + 200, 'forest');
  solid({ x1: X - 8.5, x2: X - 7.5, y1: -2, y2: 30, noclimb: true });   // 身后是来的方向，不往回走
  solid({ x1: X + 152, x2: X + 154, y1: -2, y2: 30, noclimb: true });   // 进了林子以后先到这里为止

  // 灯照不进去的四处，各占一段 x：候车亭、集装箱、铁皮棚、断桥底下。每一处都有顶，后面有一面墙 —— 灯是从后上方照过来的，
  // 影子是那盏灯自己投出来的（见下面的 build），看着躲好了才算躲好了。搭出来的顶和墙比这里登记的一段左右各宽出三四十厘米：
  // 灯从侧后方斜着照过来时影子会偏，宽出来的这一截正好补上
  const COVERS = [[38.0, 41.6], [54.0, 60.0], [73.6, 77.6], [92.5, 99.5]].map(([a, b]) => [X + a, X + b]);
  const coverAt = x => COVERS.findIndex(([a, b]) => x > a + 0.15 && x < b - 0.15);     // 0.15：主角半个身子的宽度
  const inCover = x => coverAt(x) >= 0;
  // 每一处的顶和后墙在哪：[顶的左边, 顶的右边, 顶有多高, 后墙的 z, 顶的前沿的 z]。看得见的那束光柱照到顶上就到此为止，不会穿过去落进里面（见 update 最后）
  const ROOFS = [[-0.65, 0.65, 2.5, -1.15, 1.4], [-0.38, 0.38, 2.55, -1.45, 1.06], [-0.85, 0.85, 2.3, -1.3, 1.5], [-0.4, 0.4, 3.3, -3.0, 1.6]].map(([da, db, y, zb, zf], i) => [COVERS[i][0] + da, COVERS[i][1] + db, y, zb, zf]);
  const CLIP = [0, 1, 2, 3, 4].map(() => new THREE.Plane(V3(0, 1, 0), 1e4));               // 五个面围出顶下面的那一块影子：左、右、顶、后墙、从顶的前沿顺着光斜下去的那一面
  // 灯来回扫的那一段 [最左, 最右]：主角还没到第一处时，它在候车亭前后扫；到过第 k 处以后，就在第 k 处和下一处之间扫
  // （两头各多扫出去五米半，两处都罩得到）；最后一项是主角躲进桥下以后，灯就在桥头两边找。
  // 扫一趟是从一头慢慢起步、中间最快、到另一头慢慢停下，再掉头。主角每到一处新的，灯就改成先朝这一处的左边扫过来（从他头顶过去），
  // 再掉头往右扫过下一段路 —— 所以在哪一处都是同一个办法：等灯从头顶过去、往右走远了，跟在它后面跑。
  // （原来是一条正弦，换一段的时候中心慢慢挪过去：灯看着在往右走，其实马上要折回来，照着它跑会被罩个正着）
  const SWEEP = [[X + 34, X + 58]];
  for (let k = 0; k < COVERS.length - 1; k++) SWEEP.push([COVERS[k][1] - 5.5, COVERS[k + 1][0] + 5.5]);
  SWEEP.push([X + 91.4, X + 100.6]);
  // 直升机：st —— calm 还没来 / hunt 在找 / leave 飞走 / gone 走了。stage 主角到过第几处了（0 = 一处都没到），live 灯落到公路上了没有，lx 灯这一趟扫到哪了（l0 → l1，ls 走了几成，lD 这一趟要多久），bx 灯罩着公路上的哪一点，c 直升机来回飞的那一段的中点，
  // r 罩住的那一块有多宽（半径），exposure 被罩住多久了（0..1），caught 被发现以后过了多久，hid 在桥下躲了多久，low 压低了多少，
  // k 它离得有多近（0..1：蟋蟀和萤火虫跟着它安静下去），near 旋翼的风有多大（0..1），lamp / tgt / on 灯在哪、照着哪、亮不亮（空中的灰要用）
  const T_IN = 8, T_HID = 9, T_OUT = 11, V_SWEEP = 2.8, V_PROBE = 2.8, ANG = 0.15, CONE_L = 26;     // 飞来要多久 / 在桥下躲多久它才走 / 飞走要多久 / 灯扫一趟平均多快（米每秒：平时、在桥头找的时候）/ 光柱的半张角
  const FAR_IN = [X + 70, 34, -210], FAR_OUT = [X - 50, 26, -300];               // 从哪里飞来，往哪里飞走（往左后方：那边是开阔的野地，看得见它越飞越远；右边是林子，会被树挡住）
  const H = { st: 'calm', t: 0, stage: 0, live: false, lx: X + 47, l0: X + 47, l1: X + 47, ls: 0, lD: 1, c: X + 46, bx: X + 47, r: 2.3, exposure: 0, caught: 0, hid: 0, low: 0, k: 0, near: 0, gust: false,
    pos: V3(...FAR_IN), vel: V3(), p0: V3(), aim: V3(X + 62, 0, -120), aim0: V3(), yaw: -1.57, roll: 0, pitch: 0, lamp: [0, 0, 0], tgt: [0, 0, 0], on: 0 };

  // 不止一架：远处的野地上还有六架，前后错开排着，各沿着自己的一条地来回扫 —— 是在一片一片地搜，不是专门冲着主角来的。
  // 每一架来回飞得不宽，离中点也不远：画面里同时看得见四五架
  // 它们只是画面和声音，照不到公路上。[离头顶那一架来回飞的中点多远, 多高, 多深, 来回飞多宽, 错开多少]；跟着头顶那一架一起来、一起往前挪、一起走
  const WING = [[-22, 13, -44, 14, 0.0], [20, 15, -52, 14, 5.2], [36, 16, -66, 16, 1.2], [-34, 17, -74, 18, 2.1], [6, 18, -84, 16, 3.3], [-10, 21, -108, 22, 4.0]]
    .map(([dx, y, z, span, ph]) => ({ dx, y, z, span, ph, pos: V3(), aim: V3(), p0: V3(), yaw: -1.57, sp: 0, left: false }));
  function stepWing(w, dt, arr, hunt) {
    const s = T * 0.22 + w.ph, sx = H.c + w.dx + w.span / 2 * Math.sin(s), sy = w.y + 0.5 * Math.sin(T * 0.6 + w.ph), sz = w.z + 3 * Math.sin(T * 0.17 + w.ph * 2), px = w.pos.x, pz = w.pos.z;
    if (hunt) {
      w.left = false;
      if (arr < 1) w.pos.set(lerp(FAR_IN[0] + w.dx * 1.6, sx, arr), lerp(FAR_IN[1] + 8, sy, arr), lerp(FAR_IN[2] + w.z * 0.7, sz, arr));
      else { w.pos.x = damp(w.pos.x, sx, 1.2, dt); w.pos.y = damp(w.pos.y, sy, 1.2, dt); w.pos.z = damp(w.pos.z, sz, 1.2, dt); }
    } else {
      if (!w.left) { w.left = true; w.p0.copy(w.pos); }
      const k = H.t / T_OUT, e = Math.pow(clamp(k, 0, 1), 2.2);
      w.pos.set(lerp(w.p0.x, FAR_OUT[0] + w.dx * 1.6, e), lerp(w.p0.y, FAR_OUT[1] + 8, sstep(0, 1, k)), lerp(w.p0.z, FAR_OUT[2] + w.z * 0.7, e));
    }
    const vx = (w.pos.x - px) / Math.max(dt, 1e-4), vz = (w.pos.z - pz) / Math.max(dt, 1e-4);
    w.yaw = damp(w.yaw, Math.atan2(-vz - (hunt ? 2.5 : 0), vx), 1.6, dt); w.sp = Math.hypot(vx, vz);
    w.aim.set(w.pos.x + 7 * Math.cos(s) + 3 * Math.sin(T * 0.9 + w.ph), 0, w.pos.z + 9 + 5 * Math.sin(T * 0.5 + w.ph));   // 灯照着它前下方的地，晃来晃去
  }

  checkpoint(X + 3); checkpoint(X + 29);
  for (const [a, b] of COVERS) checkpoint((a + b) / 2);                             // 每一处里面一个：被发现以后回到的地方一定是安全的
  checkpoint(X + 108); checkpoint(X + 126);
  // 直升机一来，镜头就拉远、抬高：主角小了，但直升机、光柱和它罩着的那块地都在画面里
  camKeys([X - 12, 19, 1.8, 0.5], [X + 8, 19.5, 1.9, 1.2], [X + 18, 21, 2.4, 2], [X + 30, 27, 4.2, 2.5], [X + 86, 27, 4.2, 2.5], [X + 96, 25, 3.7, 0], [X + 103, 25, 3.7, 1.5],
    [X + 116, 21, 2.3, 1.5], [X + 150, 20, 2.0, 0]);
  // 夜：月亮在左后方，光是冷的、暗的，影子朝着镜头；天边一层发亮的雾，山和树都是比天暗的剪影。画面里最亮的东西是那盏探照灯
  env(X - 60, { fog: 0x1a2738, fogD: 0.0075, hemiS: 0x7a98c8, hemiG: 0x0e1218, hemiI: 0.6, keyC: 0xa8c0e8, keyI: 0.6, keyDir: [-0.5, 0.75, -0.6], rimC: 0x8fb0e0, rimI: 0.45,
    dustC: 0xb8c8e0, dustO: 0.22, wind: -0.25, ext: 1, sky: [0x070c18, 0x0c1426, 0x15223a, 0x1f3050, 0x2a3f60, 0x121b2a], sunX: -0.33, sunY: 0.13, sunC: 0xe4ecff, sunP: 0.5,
    stars: 1.5, cloud: 0.4, cloudC: 0x3c4e6c, birds: 0, flies: 0.75, vig: 1,
    aWind: 0.4, aWhis: 0, aLeaf: 0.4, leafDry: 0.35, aBug: 0.9, aDrip: 0, aFlow: 0, aRoom: 0, roomF: 210, aHum: 0, aCity: 0, aFar: 0.45, rvOut: 1, rvHall: 0, rvCave: 0 });   // 声音：夜风吹着草，满地的蟋蟀，远处一只猫头鹰
  env(X + 200, {});

  hint(() => H.st === 'hunt' && H.stage === 0 && P.x > X + 23 && P.x < COVERS[0][0], '躲进候车亭里，等灯扫过去');
  hint(() => H.st === 'hunt' && H.stage === 1 && inCover(P.x), '等灯扫过去，再跑到下一处有顶的地方');
  hint(() => H.st === 'hunt' && H.stage === COVERS.length && inCover(P.x), '躲着别出去，等它飞走');

  const lampL = pointLight({ p: [X + 11.6, 4.7, -1.2], c: 0xffb060, i: 140, d: 11, dec: 1.8 });                  // 路口一盏还亮着的路灯
  const bounceL = pointLight({ p: [X, 1.5, 0.5], c: 0xdcecf4, i: 2.4, d: 13, dec: 1.4, on: 0 });     // 探照灯罩着的那块地反上来的光：跟着灯走。躲在顶下面的主角就靠这点光看得见
  pointLight({ p: [X + 96, 2.3, 3.2], c: 0x7f9cc8, i: 4, d: 8, dec: 1.2 });                        // 断桥底下：从镜头这边漏进去的一点天光

  let V = null;                                          // 画面上的东西（这一章被卸载时清空）
  const C_CALM = new THREE.Color(0xe2eef2), C_ALERT = new THREE.Color(0xff5030), _a = V3(), _b = V3(), _c = V3(), _d = V3();
  // 直升机在的时候，环境跟着变：蟋蟀不叫了，萤火虫不见了，旋翼的风把灰往两边吹
  const mod = E_ => { const k = H.k; E_.aBug *= 1 - 0.94 * k; E_.flies *= 1 - k; E_.aFar *= 1 - k; E_.wind = lerp(E_.wind, 2.4 * clamp((camera.position.x - H.pos.x) / 8, -1, 1), H.near); };

  function* build(R) {
    const v = {}, own = m => { m.userData.own = true; return m; }, M = (c, o) => own(lam(c, o));
    const PAL = { far: '#182840', mid: '#111f33', wood: '#0a1524', near: '#070f1a' };
    // ---------------- 布景板：夜里的山谷 ----------------
    // 最远的一层山
    backdrop(X - 330, X + 540, -8, 60, -380, 2, g => {
      setInk(g, PAL.far); ridge(g, X - 330, X + 540, -8, x => 20 + 11 * Math.sin(x * 0.0105 + 1) + 6 * Math.sin(x * 0.027) + 3 * Math.sin(x * 0.071 + 2), 4);
    }, { fog: false });
    // 近一层的丘陵，上面一排高压线塔
    backdrop(X - 230, X + 420, -6, 42, -190, 3, g => {
      const top = x => 8 + 5 * Math.sin(x * 0.019 + 2) + 3 * Math.sin(x * 0.047) + 1.2 * Math.sin(x * 0.13);
      setInk(g, PAL.mid); ridge(g, X - 230, X + 420, -6, top, 3);
      const pylon = (x, y, h) => {
        const w = h * 0.15, leg = t => w * (t < 0.72 ? 1 - 0.75 * t / 0.72 : 0.25 * (1 - (t - 0.72) / 0.28));
        for (const s of [-1, 1]) line(g, [[x + s * w, y], [x + s * leg(0.72), y + h * 0.72], [x, y + h]], 0.22);
        for (let k = 0; k < 5; k++) { const t0 = 0.72 * k / 5, t1 = 0.72 * (k + 1) / 5; for (const s of [-1, 1]) line(g, [[x - s * leg(t0), y + h * t0], [x + s * leg(t1), y + h * t1]], 0.1); }
        line(g, [[x - h * 0.26, y + h * 0.72], [x + h * 0.26, y + h * 0.72]], 0.2); line(g, [[x - h * 0.19, y + h * 0.86], [x + h * 0.19, y + h * 0.86]], 0.2);
      };
      const xs = []; for (let x = X - 205; x < X + 410; x += 62) xs.push(x);
      for (const x of xs) pylon(x, top(x) - 1.5, 24);
      for (let i = 1; i < xs.length; i++) for (const [k, dx] of [[0.72, -0.26], [0.72, 0.26], [0.86, -0.19], [0.86, 0.19]])
        cable(g, xs[i - 1] + dx * 24, top(xs[i - 1]) - 1.5 + k * 24, xs[i] + dx * 24, top(xs[i]) - 1.5 + k * 24, 2.6, 0.1);
    }, { fog: false });
    yield;
    // 野地尽头的一排林子
    backdrop(X - 210, X + 380, -3, 26, -125, 6, g => {
      setInk(g, PAL.wood); ridge(g, X - 210, X + 380, -3, x => 3 + 1.5 * Math.sin(x * 0.05) + rr(0, 0.8), 2);
      for (let x = X - 206; x < X + 376; x += rr(2.6, 6.5)) tree(g, x, 1.5, rr(9, 16), rnd() < 0.45 ? 'pine' : 'round');
    }, { fog: false });
    yield;
    // 田埂：一道长满灌木的土坎，几棵孤零零的树；塌了一半的谷仓和一座水塔
    backdrop(X - 70, X + 210, -2, 17, -26, 14, g => {
      setInk(g, PAL.near);
      ridge(g, X - 70, X + 210, -2, x => 0.9 + 0.5 * Math.sin(x * 0.21) + rr(0, 0.35), 0.7);
      for (let x = X - 64; x < X + 206; x += rr(14, 34)) if (x < X + 58 || x > X + 110) tree(g, x, 0.6, rr(4, 8), pick(['round', 'dead', 'round', 'pine']));
      poly(g, [[X + 62, 0.5], [X + 62, 4.6], [X + 65.2, 7.4], [X + 68.4, 5.2], [X + 70.2, 4.1], [X + 70.2, 0.5]]);            // 谷仓：一边的屋顶塌下去了
      g.clearRect(X + 63.4, 0.8, 1.9, 2.5); g.clearRect(X + 64.6, 4.7, 1.0, 0.9); for (let x = X + 66.4; x < X + 69.8; x += 0.55) g.clearRect(x, 1.2, 0.12, rr(1.6, 3.2));
      box(g, X + 74.2, 6.2, 3.4, 2.7); poly(g, [[X + 74, 8.9], [X + 77.8, 8.9], [X + 75.9, 10.2]]);                            // 水塔
      for (const x of [X + 74.5, X + 77.3]) line(g, [[x, 0.5], [x + (x < X + 76 ? 0.3 : -0.3), 6.2]], 0.16);
      line(g, [[X + 74.6, 2.2], [X + 77.2, 4.4]], 0.08); line(g, [[X + 77.2, 2.2], [X + 74.6, 4.4]], 0.08);
    });
    yield;
    // 公路另一侧的铁丝网和路边的长草（断桥那一段让开）
    for (const [a, b] of [[X - 22, X + 89], [X + 103, X + 152]]) backdrop(a, b, -0.4, 1.9, -3.1, 36, g => {
      setInk(g, PAL.near); fence(g, a + 0.6, b - 0.6, groundY, 1.25, 2.6); grass(g, a, b, groundY, 0.25, 0.75, Math.round((b - a) * 5));
    });
    // 过了断桥，路钻进林子：三排树，一排比一排近；最前面几棵树干离镜头很近，略微虚焦
    for (const [z, x0, col, h0, h1, gap] of [[-17, X + 104, '#0a1422', 9, 16, 3.2], [-9.5, X + 110, '#08101b', 8, 14, 4.4], [-5, X + 118, '#060c15', 7, 12, 6]]) {
      backdrop(x0 - 4, X + 190, -1, 20, z, 16, g => {
        setInk(g, col);
        for (let x = x0; x < X + 188; x += rr(gap * 0.6, gap * 1.5)) tree(g, x, groundY(x) - 0.2, rr(h0, h1) * sstep(x0 - 6, x0 + 14, x) + 3, rnd() < 0.3 ? 'pine' : 'round');
        grass(g, x0, X + 188, x => groundY(x) - 0.05, 0.3, 0.9, 260);
      }, { fadeL: 3 });
      yield;
    }
    backdrop(X + 120, X + 176, -2, 12, 6.5, 22, g => {
      setInk(g, '#03070c');
      for (const [x, w] of [[X + 127.5, 0.55], [X + 138, 0.8], [X + 147, 0.5], [X + 158, 0.9], [X + 168, 0.6]]) { poly(g, [[x - w * 1.5, -2], [x + w * 1.5, -2], [x + w / 2, 3], [x + w / 2, 12], [x - w / 2, 12], [x - w / 2, 3]]); twig(g, x, 5.5, rr(-1.2, 1.2), 2.6, 0.16, 2); }
    }, { fog: false, blur: 2.2, order: 4000 });
    // 来的方向：路被倒下的树和一人多高的灌木堵死了
    backdrop(X - 34, X - 4.5, -0.6, 9, -0.9, 24, g => {
      setInk(g, '#060c15'); ridge(g, X - 34, X - 5.5, -0.6, x => 2.3 + 0.8 * Math.sin(x * 0.9) + rr(0, 0.9) - 2.2 * sstep(X - 9, X - 5.5, x), 0.4);
      for (let i = 0; i < 9; i++) twig(g, rr(X - 30, X - 8), rr(0.5, 2.2), rr(-1.3, 1.3), rr(1.2, 3), 0.12, 3);
      line(g, [[X - 21, 0.4], [X - 6.6, 2.4]], 0.5); line(g, [[X - 14, 1.4], [X - 12.6, 4.2]], 0.16);
    });
    backdrop(X - 34, X - 7.6, -0.6, 7, 1.3, 24, g => {                                         // 它有一半伸到路这边来：主角走到跟前就过不去了
      setInk(g, '#04080e'); ridge(g, X - 34, X - 8.4, -0.6, x => 1.7 + 0.6 * Math.sin(x * 1.1 + 1) + rr(0, 0.8) - 1.6 * sstep(X - 10.5, X - 8.4, x), 0.4);
      for (let i = 0; i < 7; i++) twig(g, rr(X - 30, X - 10.5), rr(0.4, 1.6), rr(-1.3, 1.3), rr(1, 2.4), 0.1, 3);
    }, { fog: false });
    for (const [a, b] of [[X - 30, X + 36], [X + 36, X + 102], [X + 102, X + 168]]) foreTufts(a, b, 8.7, { cols: ['#050a0f', '#070d13', '#04080c'], h: 1.0, fern: 0.15 });
    yield;

    // ---------------- 地面：一条荒废的公路 ----------------
    // 沥青的边被草一点点吃进来；一块块深浅不一的补丁，褪了色的中线和边线，裂缝
    for (const [a, b] of [[X - 26, X + 42], [X + 42, X + 108]]) groundDecal(a, b, -2.8, 3.0, 40, g => {
      g.fillStyle = 'rgba(44,48,53,0.95)'; g.beginPath(); g.moveTo(a, -2.3);
      for (let x = a; x <= b; x += 0.5) g.lineTo(x, -2.3 + 0.16 * Math.sin(x * 1.3) + 0.1 * Math.sin(x * 3.1 + 1));
      for (let x = b; x >= a; x -= 0.5) g.lineTo(x, 2.5 + 0.2 * Math.sin(x * 0.9 + 2) + 0.12 * Math.sin(x * 2.7));
      g.closePath(); g.fill();
      for (let i = 0; i < (b - a) * 0.5; i++) { g.fillStyle = rnd() < 0.5 ? `rgba(0,0,0,${rr(0.08, 0.22).toFixed(2)})` : `rgba(140,150,156,${rr(0.04, 0.1).toFixed(2)})`; g.fillRect(rr(a, b), rr(-2.0, 1.6), rr(0.6, 2.6), rr(0.3, 1.2)); }
      g.fillStyle = 'rgba(196,198,186,0.36)'; for (let x = Math.ceil(a / 6) * 6; x < b - 3; x += 6) if (rnd() < 0.8) g.fillRect(x, 0.62, 3, 0.13);
      g.fillStyle = 'rgba(196,198,186,0.2)'; g.fillRect(a, -2.02, b - a, 0.09); g.fillRect(a, 2.16, b - a, 0.09);
      g.strokeStyle = 'rgba(8,10,12,0.8)';
      for (let i = 0; i < (b - a) * 0.7; i++) { let x = rr(a, b), z = rr(-2.2, 2.4); g.lineWidth = rr(0.02, 0.05); g.beginPath(); g.moveTo(x, z); for (let k = 0; k < 5; k++) { x += rr(-0.5, 0.9); z += rr(-0.45, 0.45); g.lineTo(x, z); } g.stroke(); }
    }, { fadeL: a < X ? 6 : 0, fadeR: b > X + 100 ? 5 : 0 });
    // 过了断桥，沥青没了，只剩两道车辙
    groundDecal(X + 103, X + 152, -2.2, 2.4, 30, g => {
      for (const z0 of [-0.75, 0.75]) { g.strokeStyle = 'rgba(20,18,14,0.5)'; g.lineWidth = 0.55; g.beginPath(); for (let x = X + 103; x <= X + 152; x += 0.6) { const z = z0 + 0.25 * Math.sin(x * 0.4) + 0.1 * Math.sin(x * 1.3); x === X + 103 ? g.moveTo(x, z) : g.lineTo(x, z); } g.stroke(); }
    }, { fadeL: 4, fadeR: 4 });
    yield;
    // 野地里的草：路边矮，越往远处越高；路上的裂缝里也钻出来几丛。受光照 —— 探照灯扫到哪，哪里的草就亮起来
    const EMB = [COVERS[3][0] - 3.6, COVERS[3][1] + 3.6];                                           // 断桥后面的路堤占着的那一段
    const bare = (x, z) => (z < -2.9 && x > EMB[0] && x < EMB[1]) || (z > -1.7 && z < 1.5 && COVERS.some(([a, b]) => x > a - 0.9 && x < b + 0.9));
    const gcol = () => new THREE.Color(pick([0x4c5c3c, 0x56664a, 0x435236, 0x5f6a48])).multiplyScalar(rr(0.85, 1.1));
    for (const [z0, z1, per, h0, h1] of [[-2.7, -5, 3.2, 0.35, 0.8], [-5, -12, 5, 0.6, 1.1], [-12, -29, 5, 0.9, 1.6], [2.9, 5, 3, 0.35, 0.75], [5, 9.6, 3, 0.5, 1.0], [-2.2, 2.4, 0.4, 0.14, 0.3]]) {
      const list = [];
      for (let i = 0, n = Math.round(230 * per); i < n; i++) {
        const x = rr(X - 58, X + 172), z = rr(z0, z1), k = rnd(); if (bare(x, z) || (z0 === -2.2 && (Math.abs(z) < 0.3 || x > X + 104))) continue;
        list.push([x, groundY(x), z, k < 0.68 ? 'grass' : k < 0.84 ? 'dry' : k < 0.97 ? 'seed' : 'fern', rr(h0, h1), gcol()]);
      }
      plants(R, list); yield;
    }
    // 路边几块半埋的石头，路上的碎石
    for (const [x, z, s] of [[X + 7.5, -2.9, 0.5], [X + 20.4, 3.3, 0.6], [X + 47, -3.2, 0.45], [X + 67.2, 3.4, 0.7], [X + 86.5, -3.0, 0.5], [X + 112, 2.6, 0.6], [X + 133, -2.4, 0.8]]) rock(R, x, z, s, { moss: 0.4 });
    { const pts = []; for (let i = 0; i < 380; i++) { const x = rr(X - 20, X + 150), z = rnd() < 0.5 ? rr(-2.6, -1.7) : rr(1.8, 2.9); pts.push([x, z, rr(0.02, 0.06)]); } pebbles(R, pts); }
    yield;

    // ---------------- 路边的东西 ----------------
    const conc = M(0x5a6368), conc2 = M(0x454d52), rust = M(0x6a4634), rust2 = M(0x4a3a31), tin = M(0x4a4640), wood = M(0x4c3c2c), poleM = M(0x1b1a18), earth = M(0x2a3428), tar = M(0x2a2e33);
    // 电线杆：一路排过去，有的歪了；电线垂着，有一档断了，耷拉到地上
    const POLES = [X - 2, X + 16, X + 34, X + 50, X + 66, X + 84, X + 106, X + 124, X + 142].map((x, i) => [x, [0.03, -0.05, 0.02, 0.09, -0.03, 0.04, -0.12, 0.05, -0.02][i]]);
    const armAt = ([x, lean], s) => [x - Math.sin(lean) * 6.3 + s * 0.7, groundY(x) + Math.cos(lean) * 6.3, -4.4];
    for (const [x, lean] of POLES) {
      const g = grp(R, x, groundY(x), -4.4); g.rotation.z = lean;
      add(g, cy(0.085, 0.12, 6.9, 8), poleM, 0, 3.45, 0); add(g, bx(1.7, 0.1, 0.1), poleM, 0, 6.3, 0);
      for (const s of [-0.7, 0.7]) add(g, cy(0.035, 0.035, 0.14, 6), MAT.pale, s, 6.42, 0, false);
    }
    for (let i = 1; i < POLES.length; i++) for (const s of [-1, 1]) {
      const a = armAt(POLES[i - 1], s), b = armAt(POLES[i], s), pts = [];
      if (i === 4 && s > 0) { tube(R, [a, [a[0] + 2.2, 2.6, -4.3], [a[0] + 3.4, 0.3, -4.0], [a[0] + 5.5, 0.06, -3.6]], 0.012, MAT.dark, 20); continue; }   // 断了的那一档
      for (let t = 0; t <= 1.001; t += 0.125) pts.push([lerp(a[0], b[0], t), lerp(a[1], b[1], t) - 1.1 * 4 * t * (1 - t), -4.4]);
      tube(R, pts, 0.012, MAT.dark, 24);
    }
    yield;
    // 路口的路灯：还亮着，一闪一闪
    add(R, cy(0.06, 0.09, 5, 8), poleM, X + 12.4, groundY(X + 12.4) + 2.5, -2.4); add(R, bx(1.3, 0.07, 0.07), poleM, X + 11.85, 4.95, -2.0).rotation.y = -0.6;
    add(R, bx(0.5, 0.1, 0.22), poleM, X + 11.5, 4.9, -1.5, false);
    v.lampGlow = glow(R, 0xffb868, 2.4, 0.85, X + 11.5, 4.8, -1.45, GLOW_SOFT); v.lampCore = glow(R, 0xffe2b0, 0.5, 0.95, X + 11.5, 4.82, -1.4);
    // 一块歪了的路牌
    { const g = grp(R, X + 25.6, 0, 2.7); g.rotation.z = -0.13; add(g, cy(0.035, 0.035, 2.3, 6), poleM, 0, 1.15, 0); add(g, bx(0.62, 0.62, 0.03), M(0x596066), 0, 2.2, 0).rotation.z = Math.PI / 4; }
    // 一 候车亭：水泥的后墙和顶板，两头各半堵侧墙（只到主角走的那条线后面），前面两根细柱子；里面一条长凳，旁边一根站牌
    { const a = COVERS[0][0] - 0.3, b = COVERS[0][1] + 0.3, cx = (a + b) / 2, w = b - a;
      add(R, bx(w + 0.3, 2.5, 0.2), conc, cx, 1.25, -1.25); add(R, bx(w + 0.7, 0.16, 2.9), conc, cx, 2.58, -0.05);
      for (const x of [a - 0.05, b + 0.05]) add(R, bx(0.18, 2.5, 0.8), conc, x, 1.25, -0.85);
      for (const x of [a + 0.05, b - 0.05]) add(R, cy(0.045, 0.045, 2.5, 8), MAT.dark, x, 1.25, 1.2);
      add(R, bx(w - 0.8, 0.07, 0.42), wood, cx, 0.46, -0.85); for (const x of [a + 0.7, b - 0.7]) add(R, bx(0.08, 0.46, 0.38), MAT.dark, x, 0.23, -0.85);
      add(R, cy(0.035, 0.035, 2.7, 8), poleM, b + 1.3, 1.35, -1.0); add(R, bx(0.5, 0.5, 0.04), M(0x3f4c5a), b + 1.3, 2.45, -1.0).rotation.z = 0.06;
    }
    yield;
    // 二 集装箱：朝镜头的那块侧板早就锈穿、掉在地上了，两头的门也没了，只剩后面的波纹板、顶和四根角柱
    { const a = COVERS[1][0] - 0.35, b = COVERS[1][1] + 0.35, cx = (a + b) / 2, w = b - a, z0 = -1.45, z1 = 1.0, h = 2.6;
      add(R, bx(w, h, 0.08), rust, cx, h / 2, z0); add(R, bx(w + 0.06, 0.1, z1 - z0 + 0.12), rust2, cx, h, (z0 + z1) / 2);
      for (let x = a + 0.15; x < b; x += 0.3) add(R, bx(0.12, h - 0.2, 0.05), rust2, x, h / 2, z0 + 0.06, false);                 // 波纹板的竖棱
      for (const x of [a, b]) { for (const z of [z0, z1]) add(R, bx(0.14, h, 0.14), MAT.dark, x, h / 2, z); add(R, bx(0.12, 0.14, z1 - z0), MAT.dark, x, h - 0.07, (z0 + z1) / 2, false); }
      for (const z of [z0, z1]) add(R, bx(w, 0.16, 0.12), MAT.dark, cx, 0.08, z, false);
      const fallen = add(R, bx(w - 0.6, 0.05, 2.3), rust, cx + 0.4, 0.06, 2.9); fallen.rotation.set(0.03, 0.08, 0.01);            // 掉下来的那块侧板
      add(R, bx(0.9, 0.5, 0.03), M(0x7c7466), a + 1.3, 1.9, z0 + 0.1, false);                                                      // 一块褪了色的铭牌
    }
    yield;
    // 三 铁皮棚：四根木柱撑着一面前高后低的波纹铁皮，后面钉着一排木板；里面两只旧轮胎、一只木箱
    { const a = COVERS[2][0] - 0.4, b = COVERS[2][1] + 0.4, cx = (a + b) / 2, w = b - a;
      add(R, bx(w + 0.9, 0.05, 3.3), tin, cx, 2.5, -0.1).rotation.x = -0.16;
      for (let x = a - 0.35; x < b + 0.4; x += 0.42) add(R, bx(0.05, 0.03, 3.3), M(0x38352f), x, 2.535, -0.1, false).rotation.x = -0.16;   // 铁皮的棱
      for (let x = a - 0.05; x < b; x += 0.27) add(R, bx(0.25, rr(2.05, 2.25), 0.04), wood, x + 0.13, 1.08, -1.32);
      for (const x of [a, b]) { add(R, bx(0.12, 2.72, 0.12), wood, x, 1.36, 1.3); add(R, bx(0.12, 2.3, 0.12), wood, x, 1.15, -1.4); }
      for (const [x, y, r] of [[b - 0.8, 0.12, 0], [b - 0.72, 0.36, 0.1]]) { const t = add(R, new THREE.TorusGeometry(0.3, 0.115, 8, 18), MAT.dark, x, y, -0.78); t.rotation.set(Math.PI / 2, 0, r); }
      add(R, bx(0.75, 0.6, 0.7), wood, a + 0.75, 0.3, -0.85).rotation.y = 0.2;
    }
    yield;
    // 四 断桥：一条从远处的路堤上过来、横跨在公路上面的旧桥。靠镜头的那一半早塌了，只剩后面的桥台、一截桥面和前面两根桥墩；
    // 塌下来的桥板躺在公路前面的草里
    { const a = COVERS[3][0] - 0.4, b = COVERS[3][1] + 0.4, cx = (a + b) / 2, w = b - a, top = 3.9, th = 0.6;
      add(R, bx(w, th, 5.6), conc2, cx, top - th / 2, -1.2);                                                                      // 桥面：z 从 -4 到 1.6
      add(R, bx(w + 0.5, top - th, 1.0), conc2, cx, (top - th) / 2, -3.5);                                                         // 桥台
      for (const x of [a + 0.6, b - 0.6]) { add(R, cy(0.34, 0.34, top - th, 14), conc2, x, (top - th) / 2, 1.1); add(R, bx(1.0, 0.24, 1.0), conc2, x, top - th - 0.12, 1.1, false); }
      const sh = new THREE.Shape(); sh.moveTo(-(w / 2 + 3.3), 0); sh.lineTo(w / 2 + 3.3, 0); sh.lineTo(w / 2 + 0.25, top - th); sh.lineTo(-(w / 2 + 0.25), top - th); sh.closePath();
      add(R, new THREE.ExtrudeGeometry(sh, { depth: 46, bevelEnabled: false }), earth, cx, 0, -50);                                // 路堤：伸到远处
      add(R, bx(w - 0.5, 0.06, 47), tar, cx, top - th + 0.02, -27.5).receiveShadow = true;                                         // 路堤上的路面，接到桥面上
      for (const x of [a + 0.14, b - 0.14]) {                                                                                      // 两边的护栏
        for (let z = 1.3; z > -30; z -= 2.2) add(R, bx(0.07, 0.75, 0.07), MAT.dark, x, top + 0.37, z, false);
        add(R, bx(0.06, 0.09, 31.6), MAT.steel, x, top + 0.62, -14.4, false);
      }
      for (let i = 0; i < 7; i++) { const r = add(R, cy(0.018, 0.018, rr(0.5, 1.1), 5), MAT.rust, a + 0.6 + i * 0.95 + rr(-0.2, 0.2), top - rr(0.15, 0.45), 1.75, false); r.rotation.x = Math.PI / 2 + rr(0.2, 1.0); }   // 断口露出来的钢筋
      const slab = add(R, bx(4.6, 0.55, 3.0), conc2, cx + 1.4, 0.3, 6.6); slab.rotation.set(0.06, 0.25, 0.09);
      add(R, bx(1.5, 0.5, 1.2), conc2, cx - 2.9, 0.18, 5.2).rotation.set(0.3, 0.6, 0.2); add(R, bx(0.9, 0.4, 0.8), conc2, cx + 3.9, 0.15, 3.8).rotation.set(0.2, 1.1, 0.4);
      // 桥上：一根歪了的灯杆，一辆扔在那里的车
      { const g = grp(R, b - 0.5, top, -6.5); g.rotation.z = -0.14; add(g, cy(0.06, 0.08, 4.6, 8), poleM, 0, 2.3, 0); add(g, bx(1.2, 0.06, 0.06), poleM, -0.55, 4.55, 0, false); }
      add(R, bx(1.75, 0.62, 3.9), MAT.dark, cx - 1.2, top + 0.52, -13); add(R, bx(1.6, 0.5, 1.9), MAT.dark, cx - 1.2, top + 1.05, -13.3);
    }
    yield;

    // ---------------- 直升机 ----------------
    const hull = M(0x1c242a), hull2 = M(0x0e1418), glass = M(0x0a1117, { emissive: 0x0c1826, emissiveIntensity: 0.6 });
    // 搭一架：主角头顶那一架和远处的几架是同一个样子
    const mkHeli = () => { const o = {}, heli = grp(R), tilt = grp(heli);                 // heli：在哪、朝哪；tilt：机头压下去多少、侧倾多少。机头朝 +x
    add(tilt, new THREE.SphereGeometry(1, 20, 14), hull, 0.5, 0, 0, false).scale.set(2.3, 1.15, 1.2);
    add(tilt, new THREE.SphereGeometry(1, 16, 12), glass, 1.75, -0.12, 0, false).scale.set(1.25, 0.92, 1.08);                       // 座舱的玻璃
    add(tilt, bx(1.9, 0.5, 0.95), hull2, -0.1, 1.05, 0, false); add(tilt, cy(0.09, 0.09, 0.5, 8), hull2, 0.2, 1.5, 0, false);       // 发动机罩、旋翼轴
    add(tilt, cy(0.15, 0.36, 5.0, 10), hull, -4.0, 0.42, 0, false).rotation.z = Math.PI / 2 - 0.08;                                 // 尾梁
    add(tilt, bx(0.9, 1.5, 0.08), hull, -6.4, 1.1, 0, false).rotation.z = -0.35; add(tilt, bx(0.7, 0.06, 1.8), hull, -5.5, 0.66, 0, false);   // 垂尾、平尾
    for (const z of [-0.95, 0.95]) {                                                                                               // 滑橇
      add(tilt, cy(0.05, 0.05, 3.7, 6), hull2, 0.5, -1.45, z, false).rotation.z = Math.PI / 2;
      for (const x of [-0.4, 1.4]) add(tilt, bx(0.07, 0.8, 0.07), hull2, x, -1.08, z * 0.82, false).rotation.x = -Math.sign(z) * 0.38;
    }
    const blade = own(new THREE.MeshBasicMaterial({ color: 0x0a0f14, transparent: true, opacity: 0.55, depthWrite: false }));
    const disc = own(new THREE.MeshBasicMaterial({ color: 0x0a0f14, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide }));
    o.rotor = grp(tilt, 0.2, 1.78, 0);                                                                                             // 旋翼：三片桨叶 + 一个淡淡的圆盘（转起来的那一团影子）
    for (let i = 0; i < 3; i++) { const g = grp(o.rotor); g.rotation.y = i * 2.0944; add(g, bx(5.3, 0.04, 0.28), blade, 2.65, 0, 0, false); }
    add(o.rotor, new THREE.CircleGeometry(5.3, 40), disc, 0, 0.02, 0, false).rotation.x = -Math.PI / 2;
    o.tailRotor = grp(tilt, -6.55, 1.2, 0.2); add(o.tailRotor, bx(1.7, 0.1, 0.03), blade, 0, 0, 0, false); add(o.tailRotor, new THREE.CircleGeometry(0.85, 20), disc, 0, 0, 0, false);
    o.pod = grp(tilt, 1.9, -1.05, 0);                                                                                              // 机头下面的探照灯
    add(o.pod, new THREE.SphereGeometry(0.26, 12, 10), hull2, 0, 0, 0, false); add(o.pod, new THREE.CircleGeometry(0.2, 16), unlit(0xeaf4f6, { fog: false }), 0, 0, 0.27, false);
    o.navR = glow(tilt, 0xff3a28, 0.9, 0.9, 0.6, -0.1, 1.24); o.navG = glow(tilt, 0x3cff7a, 0.9, 0.9, 0.6, -0.1, -1.24);           // 两侧的航行灯
    o.strobe = glow(tilt, 0xffffff, 2.2, 0, -6.7, 1.8, 0); o.beacon = glow(tilt, 0xff3020, 1.6, 0.1, 0.3, -1.25, 0);               // 尾巴上的频闪灯、肚子下面的防撞灯
    heli.visible = false; o.heli = heli; o.tilt = tilt; return o; };
    Object.assign(v, mkHeli());
    v.cones = [];                                          // 看得见的光柱：两层半透明的圆锥叠在一起
    for (const [k, op] of [[1, 0.07], [0.55, 0.085]]) {
      const geo = new THREE.ConeGeometry(Math.tan(ANG) * CONE_L * k, CONE_L, 28, 1, true); geo.translate(0, -CONE_L / 2, 0); geo.rotateX(-Math.PI / 2);
      const m = new THREE.Mesh(geo, own(new THREE.MeshBasicMaterial({ map: beamGradTex(), color: 0xd8ecf2, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false, clippingPlanes: CLIP, clipIntersection: true })));
      m.renderOrder = 60; m.userData.a = op; m.visible = false; R.add(m); v.cones.push(m);
    }
    v.glare = glow(R, 0xdfeef2, 6, 0, 0, 0, 0, GLOW_SOFT); v.core = glow(R, 0xffffff, 1.3, 0, 0, 0, 0);                             // 灯头正对着镜头时的那一团眩光
    // 灯扫在远处野地上的那一块亮斑（离得太远，真的灯光照不到那里）
    v.spot = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), own(new THREE.MeshBasicMaterial({ map: GLOW, color: 0xcfe2ea, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })));
    v.spot.rotation.x = -Math.PI / 2; v.spot.renderOrder = 3; v.spot.visible = false; R.add(v.spot);
    // 远处的几架：一字排开，各扫各的一条地。真的灯光照不到那么远，只画光柱、灯头的光和地上的亮斑
    v.wing = WING.map(() => {
      const o = mkHeli(), geo = new THREE.ConeGeometry(Math.tan(ANG) * CONE_L, CONE_L, 20, 1, true); geo.translate(0, -CONE_L / 2, 0); geo.rotateX(-Math.PI / 2);
      o.cone = new THREE.Mesh(geo, own(new THREE.MeshBasicMaterial({ map: beamGradTex(), color: 0xd8ecf2, transparent: true, opacity: 0.075, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false })));
      o.cone.renderOrder = 60; o.cone.visible = false; R.add(o.cone);
      o.glare = glow(R, 0xdfeef2, 4, 0, 0, 0, 0, GLOW_SOFT);
      o.spot = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), own(new THREE.MeshBasicMaterial({ map: GLOW, color: 0xcfe2ea, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })));
      o.spot.rotation.x = -Math.PI / 2; o.spot.renderOrder = 3; o.spot.visible = false; R.add(o.spot);
      return o;
    });
    renderer.localClippingEnabled = true;                  // 只有光柱的材质带着裁剪面，别的东西不受影响
    v.tower = glow(R, 0xff3828, 5, 0.9, X + 118, 47, -379);                                                                        // 远山上一座铁塔顶上的红灯
    V = v;
  }

  // 直升机不在的时候：把它留下的东西收干净
  function quiet(dt) {
    H.k = damp(H.k, 0, 1.5, dt); H.near = 0; H.on = 0; H.exposure = 0;
    if (H.gust) { GUST.force = undefined; H.gust = false; }
    if (envMod === mod && H.k < 0.002) envMod = null;
    if (H.st === 'calm' && state === 'play') { AUD.heli = 0.045 * sstep(X + 4, X + 20, P.x); AUD.heliLP = 0.1; AUD.heliPan = 0.5; }   // 还没看见它，先听见很远的旋翼声
    bounceL.on = 0;
    if (V) { V.heli.visible = false; for (const c of V.cones) c.visible = false; V.glare.material.opacity = V.core.material.opacity = 0; V.spot.visible = false; for (const o of V.wing) { o.heli.visible = o.cone.visible = o.spot.visible = false; o.glare.material.opacity = 0; } }
  }
  // 灯的下一趟：从现在的位置扫到 to。路程短，用的时间也短
  function leg(to) { H.l0 = H.lx; H.l1 = to; H.ls = 0; H.lD = Math.max(1.2, Math.abs(to - H.lx) / (H.stage === COVERS.length ? V_PROBE : V_SWEEP)); }
  function update(dt) {
    const play = state === 'play', v = V;
    lampL.i = 140 * (0.9 + 0.1 * Math.sin(T * 17) * Math.sin(T * 5.3)) * (hash1(Math.floor(T * 9)) < 0.06 ? 0.3 : 1);         // 路灯：电压不稳
    if (v) { v.lampGlow.material.opacity = 0.85 * lampL.i / 140; v.lampCore.material.opacity = 0.95 * lampL.i / 140; v.tower.material.opacity = (T % 2.4 < 1.2 ? 0.9 : 0.12) * (1 - sstep(X + 100, X + 110, camera.position.x)); }   // 进了林子就被树挡住了
    if (H.st === 'calm' && play && P.x > X + 20) { H.st = 'hunt'; H.t = 0; H.live = false; H.lx = H.bx = X + 47; H.pos.set(...FAR_IN); H.vel.set(0, 0, 0); }   // 走到这里，它就来了。灯会落在候车亭右边几米的公路上，再朝主角这边扫过来
    if (H.st === 'calm' || H.st === 'gone') { quiet(dt); return; }
    H.t += dt; envMod = mod;
    // 主角到过哪一处了
    const ci = coverAt(P.x), hunt = H.st === 'hunt', arr = hunt ? sstep(0, T_IN, H.t) : 1, hot = hunt && arr >= 1;   // hot：灯已经罩到公路上了
    if (hunt && P.grounded && ci + 1 > H.stage) { H.stage = ci + 1; if (H.live) leg(H.lx > SWEEP[H.stage][0] + 0.5 ? SWEEP[H.stage][0] : SWEEP[H.stage][1]); }   // 到了新的一处：灯先朝这一处的左边扫过来
    if (hot && !H.live) { H.live = true; leg(SWEEP[H.stage][0]); }
    const probe = hunt && H.stage === COVERS.length, [xl, xr] = SWEEP[H.stage];
    H.c = damp(H.c, (xl + xr) / 2, 0.8, dt);
    // 灯来回扫；罩住没遮没挡的主角就开始“盯住”，盯满了就算被发现
    if (H.caught > 0) { H.caught += dt; if (H.caught > 1.25 && play) respawn(); }
    else if (hunt) {
      if (H.live) {
        H.ls += dt / H.lD * (1 - 0.85 * H.exposure);                                                                              // 罩住人的时候慢下来
        if (H.ls >= 1) { H.lx = H.l1; leg(Math.abs(H.l1 - xl) < Math.abs(H.l1 - xr) ? xr : xl); }                                // 扫到头了：掉头
        else H.lx = lerp(H.l0, H.l1, 0.5 - 0.5 * Math.cos(Math.PI * H.ls));
      }
      H.bx = H.lx + (H.live ? 0.3 * Math.sin(T * 1.9) : 0);                                                                       // 手不稳：微微晃着
      const seen = play && hot && Math.abs(P.x - H.bx) < H.r * 0.9 && !inCover(P.x);
      H.exposure = clamp(H.exposure + (seen ? dt / 0.65 : -dt / 0.9), 0, 1);
      if (H.exposure >= 1) { H.caught = 1e-3; ctl = false; fx('alarm'); }
      else if (probe && ci === COVERS.length - 1 && (H.hid += dt) >= T_HID) { H.st = 'leave'; H.t = 0; H.p0.copy(H.pos); H.aim0.copy(H.aim); H.exposure = 0; }   // 找不到：走了
    }
    // 灯照着哪里
    const locked = H.caught > 0, kx = locked ? 1 : sstep(0.15, 1, H.exposure);
    if (H.st === 'hunt') {                                   // 刚来的时候，灯先在远处的野地上扫，一路扫到公路上
      const e = sstep(0.2, 1, H.t / T_IN);
      H.aim.set(lerp(X + 62 + 14 * Math.sin(H.t * 0.9), lerp(H.bx, P.x, kx), e), lerp(0, lerp(0.25, P.y + 0.6, kx), e), lerp(-120, 0.45 * Math.sin(T * 0.9) * (1 - kx), e));
    } else {                                                 // 飞走：灯甩到远处的山坡上去
      const e = sstep(0, 0.45, H.t / T_OUT);
      H.aim.set(lerp(H.aim0.x, X + 40 + 22 * Math.sin(H.t * 0.6), e), lerp(H.aim0.y, 0, e), lerp(H.aim0.z, -150, e));
    }
    // 直升机自己：跟着灯来回飞（飞得没有灯扫得远）；主角躲进桥下以后压低、靠近
    H.low = damp(H.low, probe ? 1 : 0, 0.6, dt);
    const sx = H.c + (probe ? 0.55 : 0.72) * (H.bx - H.c), sy = lerp(9.6, 7.3, H.low) + 0.3 * Math.sin(T * 0.8), sz = lerp(-13.5, -11.5, H.low) + 0.8 * Math.sin(T * 0.37);
    _a.copy(H.pos);
    if (hunt) {
      if (arr < 1) H.pos.set(lerp(FAR_IN[0], sx, arr), lerp(FAR_IN[1], sy, arr), lerp(FAR_IN[2], sz, arr));
      else { H.pos.x = damp(H.pos.x, sx, 1.6, dt); H.pos.y = damp(H.pos.y, sy, 1.2, dt); H.pos.z = damp(H.pos.z, sz, 1.2, dt); }
    } else {
      const e = Math.pow(clamp(H.t / T_OUT, 0, 1), 2.2);
      H.pos.set(lerp(H.p0.x, FAR_OUT[0], e), lerp(H.p0.y, FAR_OUT[1], sstep(0, 1, H.t / T_OUT)), lerp(H.p0.z, FAR_OUT[2], e));
      if (H.t >= T_OUT) { H.st = 'gone'; quiet(dt); return; }
    }
    H.vel.copy(H.pos).sub(_a).divideScalar(Math.max(dt, 1e-4));
    // 机头朝着飞的方向；来回找的时候掉头总是从朝着镜头的那一边转过去。飞得越快机头压得越低，转弯时侧倾
    const y0 = H.yaw; H.yaw = damp(H.yaw, Math.atan2(-H.vel.z - (hunt ? 2.5 : 0), H.vel.x), 1.6, dt);
    H.roll = damp(H.roll, clamp(-(H.yaw - y0) / Math.max(dt, 1e-4) * 0.35, -0.35, 0.35), 3, dt);
    H.pitch = damp(H.pitch, -0.05 - clamp(Math.hypot(H.vel.x, H.vel.z) * 0.02, 0, 0.3), 2, dt);
    const lx = H.pos.x + 1.9 * Math.cos(H.yaw), ly = H.pos.y - 1.05, lz = H.pos.z - 1.9 * Math.sin(H.yaw);                  // 灯头在哪
    const fade = hunt ? 1 : 1 - sstep(0.55, 0.92, H.t / T_OUT);                                                               // 飞远了，灯也看不见了
    for (const w of WING) stepWing(w, dt, arr, hunt);
    beam.position.set(lx, ly, lz); beam.target.position.copy(H.aim); beam.angle = ANG; beam.penumbra = 0.45;
    beam.intensity = 34 * fade; beam.color.lerpColors(C_CALM, C_ALERT, kx);
    H.lamp[0] = lx; H.lamp[1] = ly; H.lamp[2] = lz; H.aim.toArray(H.tgt); H.on = fade;
    bounceL.p[0] = H.aim.x; bounceL.p[1] = H.aim.y + 1.4; bounceL.p[2] = H.aim.z + 0.6; bounceL.on = fade * sstep(-30, -8, H.aim.z); bounceL.c.copy(beam.color);
    // 离得多近：声音、风、蟋蟀都跟着它
    const dist = Math.hypot(H.pos.x - P.x, H.pos.y - P.y, H.pos.z);
    H.k = damp(H.k, sstep(260, 70, dist), 1.5, dt); H.near = sstep(30, 12, dist) * sstep(14, 6, H.pos.y);
    GUST.force = H.near > 0.02 ? lerp(gustAt(T), 3.2, H.near) : undefined; H.gust = H.near > 0.02;
    AUD.heli = clamp(20 / (dist + 5) + 0.12 * H.k, 0, 1);   /* 远处那几架也听得见 */ AUD.heliPan = 0.8 * clamp((H.pos.x - cam.x) / 16, -1, 1); AUD.heliLP = clamp(1.25 - dist / 150, 0.12, 1);
    // 躲在有顶的地方、灯又扫到附近时：站住不动的主角会缩起身子
    HX.hide = play && hot && ci >= 0 ? sstep(9, 4, Math.abs(P.x - H.bx)) * sstep(2.4, 0.9, Math.abs(P.vx)) : 0;
    if (HX.hide > 0) HX.pose = { sit: 0.75 * HX.hide, sitH: 0.25, sitLeg: 0.35, bow: 0.3 * HX.hide };                          // 蹲下去，两手拢在胸前
    HX.alert = H.exposure;
    if (H.st === 'leave' && H.t < 8) camOvr = { d: 28, yo: 5.0, xo: -5 };                                                     // 镜头往左上方让一让：看着它飞走

    if (!v) return;
    v.heli.visible = true; v.heli.position.copy(H.pos); v.heli.rotation.y = H.yaw; v.tilt.rotation.set(H.roll, 0, H.pitch);
    v.rotor.rotation.y += dt * 41; v.tailRotor.rotation.z += dt * 63;
    _a.set(lx, ly, lz); const len = _a.distanceTo(H.aim) + 0.8;
    for (const c of v.cones) { c.visible = fade > 0.01; c.position.copy(_a); c.lookAt(H.aim); c.scale.setScalar(len / CONE_L); c.material.color.copy(beam.color); c.material.opacity = c.userData.a * fade; }
    v.pod.lookAt(H.aim);
    // 光柱照到哪一处的顶上，就把顶下面那一块影子里的光柱切掉（影子的左、右、前三个面都顺着光的方向斜下去）
    const rf = ROOFS.find(r => H.aim.x > r[0] - 6 && H.aim.x < r[1] + 6 && H.aim.z > -8);
    if (!rf) CLIP[2].set(_b.set(0, 1, 0), 1e4);            // 附近没有顶：围出来的那一块挪到地底下去
    else {
      const [x1, x2, ry, zb, zf] = rf, cx = (x1 + x2) / 2, L = _c;
      L.set(x1, ry, 0).sub(_a).normalize(); CLIP[0].setFromNormalAndCoplanarPoint(_b.set(L.y, -L.x, 0).normalize(), L.set(x1, ry, 0));
      L.set(x2, ry, 0).sub(_a).normalize(); CLIP[1].setFromNormalAndCoplanarPoint(_b.set(-L.y, L.x, 0).normalize(), L.set(x2, ry, 0));
      CLIP[2].setFromNormalAndCoplanarPoint(_b.set(0, 1, 0), L.set(cx, ry, 0)); CLIP[3].setFromNormalAndCoplanarPoint(_b.set(0, 0, -1), L.set(cx, 0, zb));
      L.set(cx, ry, zf).sub(_a).normalize(); CLIP[4].setFromNormalAndCoplanarPoint(_b.set(0, L.z, -L.y).normalize(), L.set(cx, ry, zf));
    }
    const face = Math.max(0, _b.copy(camera.position).sub(_a).normalize().dot(_c.copy(H.aim).sub(_a).normalize()));           // 灯头有多正对着镜头
    v.glare.position.copy(_a); v.core.position.copy(_a); v.glare.material.color.copy(beam.color);
    v.glare.material.opacity = fade * (0.3 + 0.6 * face ** 3); v.glare.scale.setScalar(lerp(3, 8.5, face ** 4)); v.core.material.opacity = fade * (0.5 + 0.5 * face);
    const el = clamp((ly - H.aim.y) / len, 0.08, 1), rs = len * Math.tan(ANG) * 2.6;                                          // 远处的亮斑：灯压得越低，拉得越长
    v.spot.visible = H.aim.z < -9; v.spot.position.set(H.aim.x, groundY(H.aim.x) + 0.06, H.aim.z); v.spot.scale.set(rs, rs / el, 1); v.spot.material.opacity = 0.5 * fade * sstep(-9, -28, H.aim.z);
    v.wing.forEach((o, i) => {
      const w = WING[i], wl = _b.set(w.pos.x + 1.9 * Math.cos(w.yaw), w.pos.y - 1.05, w.pos.z - 1.9 * Math.sin(w.yaw)), wn = wl.distanceTo(w.aim) + 0.8, we = clamp((wl.y - w.aim.y) / wn, 0.08, 1), wr = wn * Math.tan(ANG) * 2.6;
      o.heli.visible = true; o.heli.position.copy(w.pos); o.heli.rotation.y = w.yaw; o.tilt.rotation.set(0, 0, -0.05 - clamp(w.sp * 0.02, 0, 0.3));
      o.rotor.rotation.y += dt * 41; o.tailRotor.rotation.z += dt * 63; o.pod.lookAt(w.aim);
      o.cone.visible = fade > 0.01; o.cone.position.copy(wl); o.cone.lookAt(w.aim); o.cone.scale.setScalar(wn / CONE_L); o.cone.material.opacity = 0.075 * fade;
      o.glare.position.copy(wl); o.glare.material.opacity = 0.75 * fade;
      o.spot.visible = fade > 0.01; o.spot.position.set(w.aim.x, groundY(w.aim.x) + 0.06, w.aim.z); o.spot.scale.set(wr, wr / we, 1); o.spot.material.opacity = 0.45 * fade;
      const b2 = (T + i * 0.37) % 1.3; o.strobe.material.opacity = b2 < 0.06 || (b2 > 0.16 && b2 < 0.22) ? 1 : 0; o.beacon.material.opacity = (T + i * 0.3) % 0.9 < 0.12 ? 0.95 : 0.1;
    });
    const bl = T % 1.3; v.strobe.material.opacity = bl < 0.06 || (bl > 0.16 && bl < 0.22) ? 1 : 0; v.beacon.material.opacity = T % 0.9 < 0.12 ? 0.95 : 0.1;
  }
  // 这一点照不照得到（1 照得到，0 在顶下面的影子里）：空中的灰用。五个面都在它们的背面，就是在影子里
  const lit = (x, y, z) => { _d.set(x, y, z); for (const p of CLIP) if (p.distanceToPoint(_d) >= 0) return 1; return 0; };
  function reset() {
    Object.assign(H, { st: 'calm', t: 0, stage: 0, live: false, lx: X + 47, l0: X + 47, l1: X + 47, ls: 0, lD: 1, c: X + 46, bx: X + 47, exposure: 0, caught: 0, hid: 0, low: 0, k: 0, near: 0, on: 0, yaw: -1.57, roll: 0, pitch: 0 });
    H.pos.set(...FAR_IN); H.vel.set(0, 0, 0);
    if (H.gust) { GUST.force = undefined; H.gust = false; }
    if (envMod === mod) envMod = null;
  }
  function solve() { reset(); H.st = 'gone'; }
  return defZone({ n: OLD + 11, vis: [X - 30, X + 170], build, update, reset, solve, unbuild() { V = null; },
    // 回到存档点：灯从这一段的最右边重新朝这边扫过来
    respawn(c) { if (c.x > X - 10 && c.x < X + 160) { Object.assign(H, { exposure: 0, caught: 0, hid: Math.min(H.hid, 3) }); if (H.live) { H.lx = SWEEP[H.stage][1]; leg(SWEEP[H.stage][0]); } } }, H, COVERS, SWEEP, lit });
})();
