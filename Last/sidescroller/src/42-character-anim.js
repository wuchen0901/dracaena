
// ---- 程序化动画：不用预先做好的动作，每帧根据速度、是否腾空等状态算出姿势 ----
// 两节肢体的反向运动学：从关节 (hx,hy) 伸向目标 (tx,ty)，返回 [上段角度, 下段相对角度]
function ik2(hx, hy, tx, ty, l1, l2, bendFwd) {
  const dx = tx - hx, dy = ty - hy, d = clamp(Math.hypot(dx, dy), Math.abs(l1 - l2) + 1e-3, l1 + l2 - 1e-3);
  const base = Math.atan2(dx, -dy);
  const a1 = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
  const c = Math.acos(clamp((l1 * l1 + l2 * l2 - d * d) / (2 * l1 * l2), -1, 1));
  return bendFwd ? [base + a1, -(Math.PI - c)] : [base - a1, Math.PI - c];    // 膝盖向前弯，手肘向后弯
}

const KNEE = [[0, 0], [0, 0]];                                              // 这一帧两个膝盖在角色坐标里的位置
const _bv = [0, 1, 2, 3, 4].map(() => new THREE.Vector3()), wrapA = a => a - Math.round(a / 6.2832) * 6.2832;
const hash1 = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };   // 0..1 的固定“随机”数
const _v = new THREE.Vector3();                                           // 量骨头位置用的临时向量
function lowestY(model, step = 6) {                                     // 模型此刻最低的一点有多高（世界坐标）：每隔几个顶点量一个，滚翻的那半秒里才用
  let m = Infinity;
  model.traverse(o => { if (!o.isSkinnedMesh) return; const n = o.geometry.attributes.position.count; for (let i = 0; i < n; i += step) { o.getVertexPosition(i, _v).applyMatrix4(o.matrixWorld); if (_v.y < m) m = _v.y; } });
  return m;
}

const NOPOSE = {}, NOBR = { chest: 0.45, ex: 0, bend: 0 };

// ---- 从高处落地 ----
// 原地跳一下，落差约 1.2 米，落地只是膝盖一软（下面的 A.sq 弹簧）；再高就做一个落地的动作，落差越大做得越重。
// 做哪一种看情况（landStyle）：站着或慢慢走着掉下来 —— 不太高就 1 蹲下缓冲，很高（high 米以上）就 2 单手撑地；
// 跑着冲下来（往前的速度在 run 以上）—— 不太高就 3 踉跄几步，很高就 4 前滚翻。
// 网址后面加 ?land=2 让每次落地都用同一种（对比、调动作的时候用）
const LAND = { force: +new URLSearchParams(location.search).get('land') || 0, high: 2.6, run: 2, names: ['', '蹲下缓冲', '单手撑地', '踉跄几步', '前滚翻'] };
const landHard = impact => clamp((impact * impact / (2 * GRAV) - 1.4) / 1.5, 0, 1) ** 0.75;   // 落得多重：原地跳的落差（1.2 米）是 0，2 米一半，2.9 米以上是 1
function landStyle(impact, v) {                                          // 按落差和落地时往前冲的速度，挑一种落地的样子
  if (LAND.force) return LAND.force;
  const high = impact * impact / (2 * GRAV) >= LAND.high;
  return Math.abs(v) >= LAND.run ? (high ? 4 : 3) : (high ? 2 : 1);
}
const NOLAND = { c: 0, hold: 0, hand: 0, trip: 0, tuck: 0, roll: 0, push: null, ctl: 1, style: 0, done: true };
// 落地以后第 L.t 秒：c 蹲下去多少，hold 玩家被拖住多少（走不快、跳不起来），hand 手撑在地上的程度，trip 往前踉跄的程度，
// tuck 滚翻时抱成一团的程度，roll 滚了几分之几圈，push 被惯性带着往前的速度（null 就是照玩家的按键走），ctl 这时按键能管几成
function landAt(L) {
  const k = L.k, t = L.t, st = L.style === 4 && Math.abs(L.v) < 1.2 ? 1 : L.style, o = { ...NOLAND, style: st, done: false };
  const curve = (dn, hd, up) => t < dn ? 1 - (1 - t / dn) ** 2 : 1 - sstep(dn + hd, dn + hd + up, t);   // 很快蹲到底，停一下，再慢慢站起来
  if (st === 1 || st === 2) {
    const two = st === 2, dn = 0.08 + 0.03 * k, hd = two ? 0.12 + 0.22 * k : 0.05 + 0.17 * k, up = (two ? 0.36 : 0.28) + 0.3 * k;
    o.c = k * curve(dn, hd, up); o.hold = o.c * sstep(0.3, 1, k);           // 拖住玩家只在落得很重的时候：两米来高蹲一下，照样走得动、跳得起来
    if (two) o.hand = sstep(0.25, 0.6, k) * (t < dn ? sstep(0.2 * dn, dn, t) : 1 - sstep(dn + hd, dn + hd + 0.55 * up, t));   // 落得不够高就只蹲不撑
    o.done = t > dn + hd + up;
  } else if (st === 3) {
    o.c = 0.7 * k * curve(0.07, 0.03, 0.32 + 0.2 * k);
    o.trip = k * sstep(0, 0.08, t) * (1 - sstep(0.32, 0.85, t));
    o.push = L.dir * Math.max(Math.abs(L.v) * 0.85, 1.5) * (1 - sstep(0.12, 0.75, t)); o.ctl = lerp(1, sstep(0.3, 0.75, t), sstep(0.15, 0.5, k));   // 落得不重就不怎么拽着玩家
    o.done = t > 0.9;
  } else if (st === 4) {
    const t0 = 0.06, T = 0.5, p = clamp((t - t0) / T, 0, 1);
    o.roll = lerp(p, p * p * (3 - 2 * p), 0.4);
    o.tuck = sstep(0, t0 + 0.1, t) * (1 - sstep(t0 + T - 0.16, t0 + T + 0.06, t));
    o.c = 0.6 * k * sstep(0, t0, t) * (1 - sstep(t0, t0 + 0.12, t)) + 0.35 * sstep(t0 + T - 0.1, t0 + T, t) * (1 - sstep(t0 + T, t0 + T + 0.3, t));
    if (t < t0 + T) { o.push = L.dir * Math.max(Math.abs(L.v), 2.8); o.ctl = 0; }
    o.done = t > t0 + T + 0.3;
  }
  return o;
}
// 各种落地蹲到最低时（c = 1）的样子：drop 重心降多少（身高的几成）、pitch 上身前倾多少（弧度）、head 头抬回来几成、
// feet 两只脚踩在哪（[前脚, 后脚]，身高的几成）、heel 后脚跟抬起多少、arms 两只手臂在世界里的角度 [肩, 肘]（0 垂直往下，正的往前）
const LAND_POSE = {
  1: { drop: 0.2, pitch: 0.62, head: 0.85, feet: [0.06, -0.035], heel: 0.022, arms: [[0.8, 0.45], [0.55, 0.6]] },
  2: { drop: 0.24, pitch: 1.05, head: 0.5, feet: [0.05, -0.045], heel: 0.03, arms: [[0.45, 0.35], [0, 0]] },     // 靠镜头的那只手（1 号）撑地
  3: { drop: 0.17, pitch: 0.45, head: 0.6, arms: null },
  4: { drop: 0.15, pitch: 0.5, head: 0.6, arms: null },
};
// ---- 身子朝哪 ----
// 人不是一张纸片：只有推东西、攀爬的时候才是正侧面，别的时候身子都朝镜头转过来一些（下面的数是弧度，0 是正侧面，正的朝镜头，负的背过去朝画面里面）。
// 站着：四分之三侧身，隔几秒换一个站法（stand 是刚停下来的站法，idle 是后面轮着换的几种 —— 有的是背过身去看远处）；
// 走、跑、跳：身子转得少一些，上身再多拧一点（chest：上身比胯多转几成），头转回去看着前面的路；
// 走和跑的时候肩和胯反着拧（sway：走 / 跑时拧多少）；原地转身、换站法的时候两只脚跟着一下一下挪。
// 网址后面加 ?turn=0 回到原来的正侧面（对比的时候用），?turn=0.5 就是只转一半
const TURN = { k: +(new URLSearchParams(location.search).get('turn') ?? 1), stand: 0.5, idle: [0.32, 0.72, -0.45, 0.58, 0.96, 0.4, -0.3, 0.66], walk: 0.34, run: 0.24, air: 0.3, float: 0.6, chest: 0.5, sway: [0.16, 0.26] };
const _shv = new THREE.Vector3();                                         // 拨叶子时量肩膀的位置（48-brush.js）
function armLengths(tv) {                                                    // 模型手臂的长度（肩到肘、肘到腕），和姿势无关
  const p = n => tv.bones.get(n).node.getWorldPosition(new THREE.Vector3()), s = p('RightArm'), e = p('RightForeArm'), h = p('RightHand');
  return { l1: s.distanceTo(e), l2: e.distanceTo(h) };
}
// ---- 累了的样子（什么时候累、累到什么程度、哪个小动作什么时候出来，由 50-player.js 的 TIRED 决定）----
// 三种走法组合着用（s.tiredMix 是三者的比重）：
//   0 弓背低头：上身往前弓、头垂着看脚下，手臂几乎不摆，步子小，每一步落下去都往下一沉，再慢慢撑起来
//   1 双手撑大腿：腰弯得更深，迈上去的那条腿，同一边的手按在大腿上，借着手把自己往上推；两只手轮流（坡陡的地方用）
//   2 拖着脚：脚抬不起来、蹭着地走，手臂松松地晚半拍才甩过来
// 这三种都是走路的样子；跑起来（A.run）腿上的样子收掉大半（不然步子又碎又密，腿像在空转），弓腰收一些，手臂还是要摆，只是垂低一些、摆小一些
// 几个小动作：站住了两手撑着膝盖喘气（s.rest），抬手抹一下额头（s.wipeT），抬头望一眼坡顶、叹口气（s.lookT），脚尖绊一下（s.stbT）
// 累只是样子，不改走路的快慢（50-player.js）：每步往下一沉、绊一下往前一扑，都只在身子上做
// stoop 腰往前弓多少（弧度）；droop 头垂多少；swing / elbow 手臂摆幅和手肘弯度；stride / lift 步长和抬脚高度（乘在原来的上面）；
// low / dip 身子压低多少、每步落地沉多少（身高的比例）；back 屁股往后坐多少
const TIRED_GAIT = [
  { stoop: 0.4, droop: 0.3, swing: 0.1, elbow: 0.12, stride: 0.8, lift: 0.5, low: 0.02, dip: 0.035, back: 0.01 },
  { stoop: 0.66, droop: 0.06, swing: 0.1, elbow: 0.15, stride: 0.76, lift: 0.6, low: 0.035, dip: 0.03, back: 0.035 },
  { stoop: 0.32, droop: 0.26, swing: 0.26, elbow: 0.08, stride: 0.82, lift: 0.16, low: 0.02, dip: 0.03, back: 0.01 },
];
const TL_MIX = { ...TIRED_GAIT[0], thighs: 0, drag: 0 };                    // 按比重混出来的一套（每帧重算，不另外分配）
function mixGait(w) {
  const n = w[0] + w[1] + w[2] || 1;
  for (const k in TIRED_GAIT[0]) TL_MIX[k] = (w[0] * TIRED_GAIT[0][k] + w[1] * TIRED_GAIT[1][k] + w[2] * TIRED_GAIT[2][k]) / n;
  TL_MIX.thighs = w[1] / n; TL_MIX.drag = w[2] / n; return TL_MIX;
}
const _tv = new THREE.Vector3();                                            // 累的时候手按到身上：量骨头位置用的临时向量
// o.npc：路上的其他角色（不带光源）；o.parent：挂到哪个节点下（章节卸载时一起清掉）
function makeCharacter(kind, prev, o = {}) {
  const B = buildBody(kind, o), { u, D, root, pelvis, spine, chest, head, tail, arms, legs } = B;
  // 动画的内部状态（换外形时沿用上一个角色的，避免跳变）
  const A = prev ? prev.A : { ph: 0, yaw: 0, run: 0, mv: 0, air: 0, lean: 0, sq: 0, sqv: 0, pvx: 0, acc: 0, grip: 0, tuck: 0, ta: -0.5, tv: 0, look: 0 };
  A.cover ??= 0; A.dip ??= 0;                                               // 07 专用：捂灯的程度、落地时灯被震暗的程度
  A.swim ??= 0; A.pitch ??= 0;                                              // 游泳：在水里的程度、身子放平了多少（0 竖着，π/2 平躺）
  A.bend ??= 0;                                                             // 累坏了弯腰、两手撑着膝盖的程度
  A.turn ??= 0; A.twist ??= 0; A.tph ??= 0; A.pivot ??= 0; A.restT ??= 0; A.stN ??= 0; A.st ??= -1; A.stNext ??= 3;   // 身子朝镜头转了多少、上身又多拧了多少、挪步的相位和程度、站了多久、站法
  // 累：tk 累的样子有多重，rk 停下来撑着膝盖的程度，stoop 腰弓了多少
  A.tk ??= 0; A.rk ??= 0; A.stoop ??= 0;
  const npcTurn = o.npc ? 0.26 + 0.3 * hash1(root.id) : null;              // 路上的人：各有各的站法，不换
  (o.parent ?? scene).add(root);

  function update(dt, s) {
    const dir = s.facing, sp = Math.abs(s.vx), fwd = s.vx * dir, t = s.t;
    const push = s.mode === 'push', mant = s.mode === 'mantle';
    // 额外的姿势（NPC 的表演，以及结局里的 07）：sit 坐下 / bow 弯腰 / limp 断电垂头 / arms 直接给手臂角度 / reach 伸手够某一点 / look 头转向
    const q = s.pose || NOPOSE, sit = q.sit || 0, limp = q.limp || 0, lie = q.lie || 0, lieA = lie * Math.PI / 2;   // lie：仰面躺着（1 = 放平）。上身从胯那里往后放倒，腿照 sit 摆在身前
    const brush = s.brush && s.mode !== 'swim' ? s.brush : null;             // 拨开路边的植物（48-brush.js 算好的）：手伸到身前 (hx, hy)，k 多大程度，hands 一只手还是两只，turn 手臂往外翻，bow 低头弯腰
    root.position.set(s.x, s.y, s.z ?? 0);
    A.run = damp(A.run, sstep(1.5, 3.0, sp), 8, dt);
    A.mv = damp(A.mv, sstep(0.04, 0.5, sp), 12, dt);
    A.air = damp(A.air, s.grounded || mant ? 0 : 1, s.grounded ? 24 : 12, dt);
    A.grip = damp(A.grip, push || (mant && s.modeT < 0.72) ? 1 : 0, 14, dt);
    A.tuck = damp(A.tuck, mant ? (s.modeT < 0.8 ? 1 : 0) : 0, 12, dt);
    A.cover = damp(A.cover, B.lamp ? clamp(s.hide || 0, 0, 1) * (1 - A.air) * (1 - A.grip) : 0, 6, dt);   // 躲藏：弓起身子，用手捂住胸口的灯
    A.acc = damp(A.acc, clamp((s.vx - A.pvx) / Math.max(dt, 1e-4) * dir, -30, 30), 10, dt); A.pvx = s.vx;
    A.swim = damp(A.swim, s.mode === 'swim' ? 1 : 0, s.mode === 'swim' ? 6 : 9, dt);
    if (s.mode !== 'swim') A.pitch = damp(A.pitch, 0, 9, dt);
    A.rope = damp(A.rope ?? 0, s.mode === 'rope' ? 1 : 0, s.mode === 'rope' ? 16 : 7, dt);   // 抓着绳子的程度
    if (s.rope) A.lastRope = s.rope;
    A.tilt = damp(A.tilt ?? 0, s.rope ? s.rope.th : 0, 18, dt);                          // 跟着绳子斜多少
    // 从高处落地（见上面的 landAt）：蹲下去多少、手撑地、踉跄、滚翻时抱成一团
    const ld = s.land && s.mode === 'normal' ? landAt(s.land) : NOLAND; if (ld.style) A.lst = ld.style;
    const LP = LAND_POSE[A.lst ?? 1];
    A.lc = damp(A.lc ?? 0, ld.c, 40, dt); A.hand = damp(A.hand ?? 0, ld.hand, 30, dt); A.trip = damp(A.trip ?? 0, ld.trip, 30, dt); A.ltuck = damp(A.ltuck ?? 0, ld.tuck, 40, dt);
    const landDrop = (LP.drop * A.lc + 0.16 * A.ltuck) * u, landPitch = LP.pitch * A.lc + 0.4 * A.trip + 0.6 * A.ltuck;
    // 身子朝哪（见上面的 TURN）。摆好的姿势（坐下、弯腰、伸手够东西）都是照正侧面排的，这时候不转；q.turn 可以直接指定
    const posed = !!(q.sit || q.bow || q.reach || q.arms || q.hands || limp || lie), sw = s.swim || A.lastSwim;
    const rest = s.grounded && sp < 0.05 && s.mode === 'normal' && !posed && !o.npc;
    if (rest) {                                                              // 站了一会儿就换个站法（不和上一个重样）
      A.restT += dt;
      if (A.restT > A.stNext) { A.stN++; A.st = (Math.max(A.st, 0) + 1 + Math.floor(hash1(A.stN * 7.31) * (TURN.idle.length - 1))) % TURN.idle.length; A.stNext = A.restT + 5 + 6 * hash1(A.stN * 3.17 + 1); }
    } else { A.restT = 0; A.st = -1; A.stNext = 3.5 + 3 * hash1(A.stN * 5.3 + 2); }
    let turnT = npcTurn ?? (A.st < 0 ? TURN.stand : TURN.idle[A.st]);
    turnT = lerp(lerp(turnT, lerp(TURN.walk, TURN.run, A.run), A.mv), TURN.air, A.air);
    turnT *= (1 - A.grip) * (1 - A.tuck) * (1 - A.cover) * (1 - 0.6 * A.ltuck) * (1 - A.rope);   // 抓着绳子也是正侧面
    if (A.swim > 0.002 && sw) turnT = lerp(turnT, TURN.float * sw.top * (1 - sstep(0.15, 0.9, Math.hypot(sw.vx, sw.vy))), A.swim);   // 在水里只有浮在水面上踩水时才转过来
    if (posed) turnT = 0;
    A.turn = damp(A.turn, (q.turn ?? turnT) * TURN.k, rest ? 2.6 : 7, dt);
    const yaw0 = A.yaw; A.yaw = damp(A.yaw, dir > 0 ? -A.turn : -Math.PI + A.turn, 12, dt); root.rotation.y = A.yaw + (s.yawOff ?? 0);   // yawOff：路往前后弯的时候，顺着路的方向转一点
    const dYaw = Math.abs(A.yaw - yaw0);                                     // 原地转：转得越快脚抬得越高，每转过 100 度左右两只脚各挪一步
    A.tph = (A.tph + dYaw / 1.75) % 1; A.pivot = damp(A.pivot, clamp(dYaw / Math.max(dt, 1e-4) / 1.4, 0, 1) * (1 - A.mv) * (1 - A.air) * (1 - A.swim), 16, dt);
    // 喘气（53-breath.js）：br.chest 肺里有多满，br.ex 有多累，br.bend 要不要弯下腰撑着膝盖。
    // heave：一呼一吸 —— 吸气时上身挺起来、头抬一点，呼气时塌下去；越累起伏越大，走着跑着的时候小一些
    const br = s.br || NOBR, still = (1 - A.mv) * (1 - A.air) * (1 - A.grip) * (1 - A.swim) * (1 - A.tuck) * (q.sit ? 0 : 1) * (1 - Math.min(1, A.lc + A.trip + A.ltuck));   // 落地缓冲的那一下不弯腰
    const wantBend = br.bend * still;
    A.bend = damp(A.bend, wantBend, wantBend > A.bend ? 2.4 : 9, dt);       // 慢慢弯下去，一动就直起来
    const heave = (br.chest - 0.45) * lerp(0.25, 1, br.ex) * (1 - 0.6 * A.mv) * (1 - A.swim) * (1 - A.air);
    const bl = A.bend * (0.85 - 0.08 * heave), hv = 0.075 * heave;           // bl 弯腰的角度（呼气时再低一点）/ hv 上身随呼吸挺起多少

    const slope = clamp(s.slope * dir, -0.6, 0.6);                            // 脚下的坡：正的是上坡

    // ---- 累了（见 TIRED_GAIT）：慢慢累起来、慢慢缓过来；腾空、游泳、抓着东西、吊在绳子上、落地缓冲的时候不算，演剧情动作（坐下之类）的时候也收起来。
    //      喘气用的是上面 53-breath.js 的那一口一口（累的时候它喘得也凶：BR.ex 不低于累的程度），这里不另外算 ----
    const TL = s.tiredMix ? mixGait(s.tiredMix) : null, calm = (1 - A.air) * (1 - A.swim) * (1 - A.grip) * (1 - A.rope) * (1 - Math.min(1, A.lc + A.trip + A.ltuck));
    A.tk = damp(A.tk, TL && !s.pose ? clamp(s.tired ?? 0, 0, 1) : 0, 2.5, dt);
    A.rk = damp(A.rk, TL && s.rest && !s.pose ? 1 : 0, s.rest ? 3.2 : 4.5, dt);     // 停下来：先弯腰、两手撑住膝盖；起身的时候快一点
    const tk = TL ? A.tk * calm : 0, restK = TL ? A.rk * calm : 0;
    const tkL = tk * (1 - 0.9 * A.run), tkA = tk * (1 - 0.6 * A.run);       // 腿上、手臂上累的样子：跑起来收掉大半 / 收掉一些
    // 小动作（时间从 50-player.js 来，-1 是没在做）：抹额头 1.45 秒，抬头望坡顶 2.3 秒（最后叹一口气），绊一下 0.7 秒
    const wT = s.wipeT ?? -1, lT = s.lookT ?? -1, bT = s.stbT ?? -1;
    const wipe = wT < 0 ? 0 : sstep(0, 0.4, wT) * (1 - sstep(1.05, 1.45, wT)) * calm, wipeX = wT < 0 ? 0 : sstep(0.4, 1.0, wT);
    const gUp = lT < 0 ? 0 : sstep(0, 0.35, lT) * (1 - sstep(1.1, 1.5, lT)) * calm, sigh = lT < 0 ? 0 : sstep(1.25, 1.5, lT) * (1 - sstep(1.5, 2.3, lT)) * calm;
    const stb = bT < 0 ? 0 : sstep(0, 0.1, bT) * (1 - sstep(0.22, 0.7, bT)) * tk;

    // 步态：按“走过的距离”推进相位，所以脚踩在地上时不会打滑
    let duty = lerp(0.62, 0.37, A.run), stride = lerp(0.4, 0.5, A.run) * u * (1 - 0.35 * A.trip);   // 踉跄的时候步子又碎又急
    if (tkL > 0) { duty = lerp(duty, 0.68, tkL); stride *= lerp(1, TL.stride, tkL); }      // 累：步子小，两只脚同时着地的时间长（跑起来只小一点）
    A.ph = ((A.ph + fwd * dt * duty / stride) % 1 + 1) % 1;
    const bobPh = Math.cos(4 * Math.PI * (A.ph - duty / 2));
    const bob = lerp(0.012, -0.03, A.run) * u * bobPh * A.mv * (1 - A.air);
    if (s.impact > 0) A.sqv -= s.impact * 0.28 * (1 - 0.6 * landHard(s.impact));   // 落地：重心被压下去再弹回（从高处落下时主要靠下面的蹲下来缓，弹簧只带一点震）
    A.sqv += (-A.sq * 230 - A.sqv * 21) * dt; A.sq = clamp(A.sq + A.sqv * dt, -0.2 * u, 0.04 * u);
    const breathY = -0.045 * u * A.bend + 0.006 * u * heave;                // 弯腰撑着大腿时膝盖弯一些、重心低下来；吸气时整个人微微往上一提
    // 累：身子压低，每只脚踩上去以后往下一沉；停下来喘气时膝盖弯得更深、屁股往后坐
    const sink = TL ? -(tk * (TL.low + TL.dip * A.mv * Math.pow(0.5 + 0.5 * Math.cos(4 * Math.PI * (A.ph - 0.07)), 2)) + 0.05 * restK + 0.035 * stb) * u : 0;
    const hipX = TL ? -(tk * TL.back + 0.065 * restK) * u : 0;
    let hipY = D.hipY - 0.006 * u - 0.026 * u * A.run * A.mv + bob + A.sq - (push ? 0.035 * u : 0) - 0.06 * u * A.tuck - 0.03 * u * A.cover + breathY - landDrop + sink;
    const hipStand = hipY;
    if (sit) hipY = lerp(hipY, (q.sitH ?? 0.3) * u, sit);
    const sitDrop = hipY - hipStand;                                          // 坐下时重心降了多少（主角的模型不挂在骨盆上，要自己跟着降）
    pelvis.position.set(hipX, hipY, 0);

    // 上身前倾：跑得越快、加速越猛就越前倾；推车时压低身体，拉车时后仰
    let leanT = (lerp(0.05, 0.2, A.run) * A.mv + clamp(A.acc * 0.011, -0.12, 0.16)) * (fwd < -0.05 ? -0.4 : 1);
    if (push) leanT = fwd > 0.1 ? 0.42 : fwd < -0.1 ? -0.2 : 0.16;
    if (mant) leanT = 0.3;
    leanT = lerp(leanT, 0.1 - clamp(s.vy * 0.02, -0.12, 0.12), A.air);
    if (B.S.robot && !push && !mant) leanT += 0.055 * (1 - A.air);
    if (B.S.slouch && !push && !mant) leanT += B.S.slouch * (1 - A.air) * (1 - A.run);
    leanT += 0.2 * A.cover + (q.bow || 0) + 0.22 * limp + (brush ? brush.bow * (1 - A.air) : 0);
    leanT += 0.1 * br.ex * (1 - A.run) * (1 - A.air) * (1 - A.grip) * (1 - tk);   // 累了：站着、走着都微微弓着背（累得显出样子来时，换成下面的弓腰）
    leanT *= (1 - A.swim) * (1 - A.rope);
    A.lean = damp(A.lean, leanT, 9, dt);
    // 累：弓腰 —— 只弯上身，不带着腿（主角模型上分到胯和三节脊椎上，见最后）。坡越陡弓得越低；停下来撑膝盖时弓得最深，跟着喘气一起一伏
    let stoopT = TL ? tk * (TL.stoop * (1 - 0.4 * A.run) + 0.5 * Math.max(0, slope)) : 0;   // 跑起来本来就往前倾，弓得少一点
    stoopT = lerp(stoopT, 0.92, restK) - 0.08 * heave * restK + 0.24 * stb + 0.08 * sigh - lerp(0.08, 0.14, restK) * gUp;
    A.stoop = damp(A.stoop, stoopT, 8, dt);
    spine.rotation.z = -(A.lean + bl + landPitch + A.stoop) + hv + lieA;
    // 上身绕竖直方向拧多少：走和跑的时候肩跟着同侧的手臂一前一后（胯反着来），再加上朝镜头多转的那一点
    const sway = -lerp(TURN.sway[0], TURN.sway[1], A.run) * A.mv * Math.cos(2 * Math.PI * A.ph - 0.35) * (1 - A.grip) * (1 - A.air) * (1 - A.swim) * TURN.k;
    A.twist = -dir * A.turn * TURN.chest * Math.max(A.mv, A.air) * (1 - A.swim);
    chest.rotation.y = A.twist + sway;
    if (B.traveler?.group) {
      // 主角的模型不挂在骨盆上：落地时重心往下压，要让整个模型跟着降下去，脚才踩得住地（不然腿一弯，脚就往上缩）；累了身子往下沉、屁股往后坐，也是整个模型跟着挪
      B.traveler.group.position.y = B.traveler.baseY + bob + sitDrop + breathY + A.sq - landDrop + sink;
      B.traveler.group.position.x = hipX + 0.05 * u * Math.sin(0.65 * landPitch);     // 上身从胯那里往前折，两条腿的根会往后挪一点：整个模型往前补回来
      B.traveler.group.rotation.z = -A.lean;
      if (lieA) {                                                          // 躺下：整个模型绕着胯往后放平（胯留在原地），两条腿在下面按这个角度补回来
        const h = B.traveler.hipH ?? D.hipY;
        B.traveler.group.rotation.z = -A.lean * (1 - lie) + lieA; B.traveler.group.position.x += h * Math.sin(lieA);
        B.traveler.group.position.y += h * (1 - Math.cos(lieA)) - (h - hipStand) * lie;   // 模型的胯比骨架的高一点：躺平了按模型的来，背才贴得住底下
      }
    }

    // 腿：先算出脚踝的目标位置，再用 IK 解出大腿和膝盖的角度
    const rise = sstep(-2.5, 3.5, s.vy), lift = lerp(0.055, 0.2, A.run) * u * (TL ? lerp(1, TL.lift, tkL) * (1 - 0.25 * tk * A.run) : 1);   // 累：脚抬得低（跑起来膝盖也提得低一些）
    for (let i = 0; i < 2; i++) {
      const p = (A.ph + i * 0.5) % 1; let fx, fy, pitch;
      if (p < duty) {                                                        // 支撑期：脚相对身体匀速向后
        const k = p / duty, toe = sstep(0.68, 1, k) * (0.35 + 0.65 * A.run) * (1 - 0.6 * tkL);   // 累：脚掌平平地抬起来，不怎么踮脚尖
        fx = lerp(0.42, -0.58, k) * stride; fy = toe * 0.04 * u; pitch = -toe * 0.6;
      } else {                                                               // 摆动期：抬脚向前迈
        const k = (p - duty) / (1 - duty), e = k * k * (3 - 2 * k);
        fx = lerp(-0.58, 0.42, e) * stride; fy = lift * 4 * k * (1 - k) * (1.35 - 0.7 * k); pitch = lerp(-0.7, 0.28, k) * (0.3 + 0.7 * A.run);
        if (TL?.drag) pitch = lerp(pitch, lerp(-0.3, 0.05, sstep(0.55, 1, k)), tkL * TL.drag);   // 拖着脚：脚尖垂着往前蹭
      }
      const idleX = (i ? -0.03 : 0.034) * u;
      fx = lerp(idleX, fx, A.mv); fy *= A.mv; pitch = pitch * A.mv + Math.atan(slope);
      fy += 0.04 * u * A.pivot * Math.max(0, Math.sin(6.2832 * (A.tph + i * 0.5)));       // 原地转身：两只脚轮着抬起来挪一下
      let tx = fx, ty = fy + fx * slope + D.ankle;
      // 腾空：一条腿屈膝在前，一条腿拖在后；下落时两腿伸开准备着地
      const ax = i ? lerp(-0.07, -0.12, rise) : lerp(0.06, 0.14, rise), ay = i ? lerp(-0.455, -0.4, rise) : lerp(-0.43, -0.3, rise);
      const tyG = ty; tx = lerp(tx, ax * u, A.air); ty = lerp(ty, hipY + ay * u, A.air); pitch = lerp(pitch, -0.45, s.grounded ? 0 : A.air);
      if (s.grounded) ty = Math.max(ty, tyG);                  // 刚着地那几帧，伸长的腿不能插进地里
      // 攀爬：收腿
      tx = lerp(tx, (i ? 0.03 : 0.12) * u, A.tuck); ty = lerp(ty, hipY + (i ? -0.4 : -0.27) * u, A.tuck);
      if (A.lc > 0.001 && LP.feet) {                                         // 落地蹲下：两只脚一前一后踩稳，后脚跟抬起来
        tx = lerp(tx, LP.feet[i] * u, A.lc); ty = lerp(ty, D.ankle + (i ? LP.heel * u : 0), A.lc); pitch = lerp(pitch, i ? -0.5 : 0, A.lc);
      }
      if (sit) { tx = lerp(tx, (i ? 0.19 : 0.26) * u * (q.sitLeg ?? 1), sit); ty = lerp(ty, D.ankle, sit); pitch = lerp(pitch, 0, sit); }   // 坐着：两只脚搁在身前的地上
      if (lie) { tx = lerp(tx, hipX + (D.thigh + D.shin) * (i ? 0.95 : 0.995), lie); ty = lerp(ty, hipY - 0.005 * u + (i ? 0.03 * u : 0), lie); }   // 躺着：两条腿伸直，和身子在一条线上
      const L = legs[i], [th, kn] = ik2(hipX, hipY - 0.005 * u, tx, ty, D.thigh, D.shin, true);
      L.hip.rotation.z = th; L.knee.rotation.z = kn; L.foot.rotation.z = -(th + kn) * (1 - lie) + pitch;   // 躺着的时候脚尖朝上，不去找平
      KNEE[i][0] = hipX + Math.sin(th) * D.thigh; KNEE[i][1] = hipY - 0.005 * u - Math.cos(th) * D.thigh;      // 膝盖在哪（弯腰撑膝盖时手放这里）
      if (A.ltuck > 0.001) {                                                 // 滚翻：两腿收到胸前
        const w = A.ltuck; L.hip.rotation.z = lerp(th, i ? 2.45 : 2.3, w); L.knee.rotation.z = lerp(kn, -2.55, w); L.foot.rotation.z = lerp(L.foot.rotation.z, 0.7, w);
      }
    }

    // 手臂：平时前后摆动；推车 / 攀爬时用 IK 伸向抓握点
    const LB = A.lean + bl + landPitch + A.stoop - lieA, shX = hipX + Math.sin(LB) * D.shY, shY = hipY + Math.cos(LB) * D.shY - 0.012 * u;   // LB：上身一共往前倾了多少（累坏了弯腰、落地蹲下、累了弓腰）
    // 主角模型的上身一共往前倾了多少：整个模型前倾 lean，胯和三节脊椎再弯 lean 的三成五、弯腰、蹲下、弓腰，吸气时挺回来一点（见最后的 poseBone）。
    // 累了手臂顺着重力垂下来，要按这个把“垂直往下”换成相对上身的角度
    const tilt = 1.35 * A.lean + A.stoop + bl + landPitch - hv;
    const cl = Math.cos(A.lean), sl = Math.sin(A.lean), Lm = B.lamp;         // 灯在角色坐标里的位置（跟着上身前倾）
    const lampX = Lm ? Lm.x * cl + Lm.y * sl : 0, lampY = Lm ? hipY + Lm.y * cl - Lm.x * sl : 0;
    const near = B.traveler?.model ? (dir > 0 ? 1 : 0) : (dir > 0 ? 0 : 1);   // 靠镜头的那只手（模型的右手在 +z 那边，骨架的 0 号手在 +z 那边）
    for (let i = 0; i < 2; i++) {
      const sw = -Math.cos(2 * Math.PI * (A.ph + i * 0.5) - 0.35);            // 和同侧的腿反着摆
      let a = (lerp(0.32, 0.95, A.run) * sw + lerp(0, 0.1, A.run)) * A.mv + 0.03 * Math.sin(t * 1.3 + i * 2) * (1 - A.mv);
      let b = lerp(0.14, lerp(0.3, 1.5, A.run), A.mv) + 0.3 * Math.max(0, sw) * A.mv;
      a = lerp(a, i ? lerp(0.5, -0.45, rise) : lerp(0.75, 1.25, rise), A.air); b = lerp(b, 0.7, A.air);
      if (A.grip > 0.01 && s.hand) {
        const [ua, fa] = ik2(shX, shY, (s.hand.x - s.x) * dir, s.hand.y - s.y + (i ? 0 : 0.012 * u), D.uarm, D.farm + 0.02 * u, false);
        a = lerp(a, ua + A.lean, A.grip); b = lerp(b, fa, A.grip);
      } else a += A.lean * 0.5;
      if (A.bend > 0.01) {                                                   // 两手撑在大腿上、膝盖上面一点（主角的模型手臂比骨架短，按模型的长度来算）
        const glb = !!B.traveler?.model, [ua, fa] = ik2(shX, shY, KNEE[i][0] + 0.03 * u, KNEE[i][1] + 0.09 * u, glb ? 0.135 * u : D.uarm, glb ? 0.135 * u : D.farm + 0.02 * u, false);
        a = lerp(a, ua + LB, A.bend); b = lerp(b, fa, A.bend);
      }
      a -= 0.6 * hv * (1 - A.bend);                                          // 吸气时手臂跟着肩膀微微往后
      if (A.cover > 0.01) {                                                  // 两只手一上一下拢在灯前面
        const [ua, fa] = ik2(shX, shY, lampX + (i ? 0.03 : 0.042) * u, lampY + (i ? -0.03 : 0.01) * u, D.uarm, D.farm + 0.02 * u, false);
        a = lerp(a, ua + A.lean, A.cover); b = lerp(b, fa, A.cover);
      }
      if (tk > 0.001) {                                                      // 累：手臂顺着重力垂下来，摆得很小（跑起来还摆着，只是垂低一些、摆小一些）
        const sw2 = lerp(sw, -Math.cos(2 * Math.PI * (A.ph + i * 0.5) - 1.5), TL.drag * (1 - A.run));   // 拖着脚：手臂松着，跟不上身子，晚半拍才甩过来
        const fling = (i === (dir > 0 ? 1 : 0) ? 1.0 : 0.6) * stb;           // 绊一下：两只手往前一甩（靠镜头的那只甩得多）
        a = lerp(a, tilt * 0.92 + TL.swing * sw2 * A.mv, tkA) + fling * tk; b = lerp(b, TL.elbow + 0.08 * Math.max(0, sw2) * A.mv, tkA) + 0.6 * fling * tk;
      }
      if (limp) { a = lerp(a, A.lean, limp); b = lerp(b, 0.06, limp); }      // 断电：手臂直直垂着
      if (q.reach && (q.reach.i === undefined || q.reach.i === i)) {         // 伸手去够世界里的一点
        const [ua, fa] = ik2(shX, shY, (q.reach.x - s.x) * dir, q.reach.y - s.y, D.uarm, D.farm + 0.02 * u, false), k = q.reach.k ?? 1;
        a = lerp(a, ua + A.lean, k); b = lerp(b, fa, k);
      }
      if (q.arms && q.arms[i]) { const o = q.arms[i], k = o.k ?? 1; a = lerp(a, o.a, k); b = lerp(b, o.b, k); }
      let turn = 0;
      if (brush && brush.k > 0.002 && (brush.hands === 2 || i === near)) {   // 拨叶子：手伸到身前那一点
        const tv = B.traveler, glb = !!tv?.model;
        let sx = shX, sy = shY, l1 = D.uarm, l2 = D.farm + 0.02 * u, off = LB, bend = 0;
        if (glb) {                                                           // 模型的手臂比骨架的短：用模型自己的肩膀位置和手臂长度来算
          tv.arm ??= armLengths(tv);
          tv.bones.get(i ? 'RightArm' : 'LeftArm').node.getWorldPosition(_shv);
          sx = (_shv.x - s.x) * dir; sy = _shv.y - s.y; l1 = tv.arm.l1; l2 = tv.arm.l2 + 0.05; off = 0.35 * A.lean + A.stoop; bend = -0.14;   // 模型的胳膊肘本来就弯着一点；累了弓着腰，肩膀跟着往前倾
        }
        const [ua, fa] = ik2(sx, sy, brush.hx, brush.hy - (i === near ? 0 : 0.04), l1, l2, false), k = brush.k * (1 - restK);   // 累得停下来撑着膝盖时不去拨
        a = lerp(a, ua + off, k); b = lerp(b, fa + bend, k);
        // 手臂往外翻：靠镜头的手往镜头这边翻，另一只往里翻。身子朝镜头转过来的那一点（A.turn）先减掉，手伸到头时手臂在画面里的方向和正侧面时一样
        turn = k * ((i === near ? -dir : dir) * brush.turn + dir * A.turn);
      }
      // 从高处落地：两手往前伸着保持平衡 / 一只手撑到身前的地上 / 踉跄时两手往前乱抓 / 滚翻时抱住小腿
      if (A.lc > 0.001 && LP.arms) { const [aw, bw] = LP.arms[i]; a = lerp(a, aw + LB, A.lc); b = lerp(b, bw, A.lc); }
      if (A.hand > 0.001 && i === 1) { const [ua, fa] = ik2(shX, shY, 0.2 * u, 0.012 * u, D.uarm, D.farm + 0.02 * u, false); a = lerp(a, ua + LB, A.hand); b = lerp(b, fa, A.hand); }
      if (A.trip > 0.001) { a = lerp(a, 0.6 + (i ? 0.2 : -0.1) + 0.18 * Math.sin(t * 17 + i * 2.1) + LB, A.trip); b = lerp(b, 0.55 + 0.2 * Math.sin(t * 13 + i), A.trip); }
      if (A.ltuck > 0.001) { a = lerp(a, 1.0 + LB, A.ltuck); b = lerp(b, 1.7, A.ltuck); }
      const R = arms[i]; R.sh.rotation.z = a; R.el.rotation.z = b; R.turn = turn * (1 - Math.min(1, A.lc + A.hand + A.trip + A.ltuck));   // 落地的姿势盖过来时，手臂的外翻也跟着收回
      R.sh.rotation.x = (i ? 1 : -1) * (0.1 + 0.28 * A.air) * (1 - A.grip) * (1 - A.cover); R.sh.rotation.y = (i ? -1 : 1) * 0.45 * A.cover;
    }

    // 头：保持水平；站着时偶尔左右看看；被灯照到时扭头看向光源
    A.look = damp(A.look, q.look !== undefined ? q.look : s.alert > 0.05 ? dir * 1.0 : A.cover > 0.3 ? dir * 0.5 : 0.3 * Math.sin(t * 0.37) * Math.sin(t * 0.13 + 1) * (1 - A.mv) * (1 - limp), 6, dt);
    // 身子朝镜头转过来了，头要转回去一些：走着跑着看前面的路，站着就介于身子和正侧面之间；背过身去看远处时头转得比身子还多
    const lookFix = dir * A.turn * (A.turn < 0 ? -0.35 : lerp(0.45, 0.75, Math.max(A.mv, A.air))) - A.twist * 0.8;
    let headZ = A.lean * 0.62 + 0.03 * bobPh * A.mv - (B.S.robot ? 0.10 : B.S.slouch ? 1.4 * B.S.slouch * (1 - A.run) : 0) - 0.12 * A.cover - 0.5 * limp + (q.nod || 0)
      + 0.72 * bl + 0.9 * hv                                                // 弯着腰也抬着头看前面一点；吸气时头微微一抬
      + LP.pitch * A.lc * LP.head + 0.2 * A.trip - 0.6 * A.ltuck;         // 落地蹲下时把头抬回来看着前面；滚翻时低头
    if (TL) {                                                                // 累：头垂着看脚下（弓腰时头只抬回来一半）；绊一下时头往前一磕
      headZ += 0.6 * A.stoop - tk * TL.droop - 0.2 * stb;
      headZ = lerp(headZ, 1.35 * A.lean + A.stoop + 0.28, gUp);                   // 抬头望坡顶：视线往上
    }
    head.rotation.set(0, A.look + lookFix, headZ);
    // ---- 游泳：在水下身子放平，蛙泳 —— 两手往前伸直、往两边划回胸前，两腿收起来再往后一蹬，然后滑一下；
    //      浮在水面上身子竖起来，两手在身前一前一后地拨水，两腿像蹬自行车一样踩水；在水下停着不动就斜着身子慢慢划 ----
    if (A.swim > 0.002) {
      const k = A.swim, w = s.swim || A.lastSwim || { ph: 0, vx: 0, vy: 0, c: 0.6, top: 0, panic: 0 }; if (s.swim) A.lastSwim = s.swim;
      const p = w.ph, mv = sstep(0.15, 0.9, Math.hypot(w.vx, w.vy)), top = w.top, still = (1 - mv) * (1 - top), tread = top * (1 - mv);
      const flat = clamp(Math.PI / 2 - 0.9 * Math.atan2(w.vy, Math.abs(w.vx) + 0.12), 0.35, 2.3);         // 往上游时抬起身子，往下潜时头朝下
      if (s.mode === 'swim') A.pitch = damp(A.pitch, lerp(lerp(0.75, flat, mv), lerp(0.18, 1.0, mv), top), 4.5, dt);
      // 蛙泳的一圈：0–0.32 两手划回胸前（手肘弯起来），0.32–0.48 两手往前伸直；0.18–0.42 收腿，0.42–0.56 往后蹬；剩下的滑行
      const pull = p < 0.32 ? sstep(0, 0.32, p) : 1 - sstep(0.32, 0.48, p), bend = p < 0.32 ? sstep(0.05, 0.3, p) : 1 - sstep(0.38, 0.48, p);
      const tuck = p < 0.18 ? 0 : p < 0.42 ? sstep(0.18, 0.42, p) : 1 - sstep(0.42, 0.56, p);
      for (let i = 0; i < 2; i++) {
        const R = arms[i], L = legs[i], o = i ? 1 : -1, ph = p * 6.2832 + i * Math.PI;
        let a = lerp(3.0, 1.15, pull) + o * 0.03, b = lerp(0.1, 1.75, bend);
        a = lerp(a, 1.15 + 0.32 * Math.sin(ph), tread); b = lerp(b, 1.05 + 0.3 * Math.sin(ph + 1.2), tread);
        a = lerp(a, 1.8 + 0.4 * Math.sin(ph), still * 0.7); b = lerp(b, 0.9, still * 0.7);
        if (w.panic > 0) { a += w.panic * 0.45 * Math.sin(t * 9 + i * 2); b += w.panic * 0.3 * Math.sin(t * 11 + i); }      // 憋不住了：手乱划
        R.sh.rotation.z = lerp(R.sh.rotation.z, a, k); R.el.rotation.z = lerp(R.el.rotation.z, b, k); R.sh.rotation.x = lerp(R.sh.rotation.x, o * 0.12 * (1 - pull), k); R.sh.rotation.y = lerp(R.sh.rotation.y, 0, k);
        let th = lerp(-0.05, 0.6, tuck) + o * 0.04, kn = lerp(-0.05, -1.95, tuck), ft = lerp(-1.2, 0.05, tuck);
        th = lerp(th, 0.5 + 0.35 * Math.sin(ph), tread); kn = lerp(kn, -1.05 - 0.5 * Math.sin(ph + 0.7), tread); ft = lerp(ft, -0.5, tread);
        th = lerp(th, 0.15 + 0.15 * Math.sin(ph * 0.7), still * 0.7); kn = lerp(kn, -0.5 - 0.3 * Math.sin(ph * 0.7 + 1), still * 0.7);
        L.hip.rotation.z = lerp(L.hip.rotation.z, th, k); L.knee.rotation.z = lerp(L.knee.rotation.z, kn, k); L.foot.rotation.z = lerp(L.foot.rotation.z, ft, k);
      }
      spine.rotation.z = lerp(spine.rotation.z, (0.25 + 0.2 * Math.sin(p * 6.2832) * mv) * clamp(A.pitch / 1.5, 0, 1), k);   // 背微微拱起来
      head.rotation.z = lerp(head.rotation.z, 0.8 * A.pitch, k); head.rotation.y = lerp(head.rotation.y, 0, k);                // 抬着头往前看
    }
    // ---- 绳子：两手举过头抓着绳子，两腿弯起来夹住，人跟着绳子一起斜。这里只摆出大致的样子；
    //      手和脚准确地落到绳子上，是下面给主角模型摆骨头时另算的（51-rope.js 的 ropeIK）----
    if (A.rope > 0.002) {
      const k = A.rope;
      for (let i = 0; i < 2; i++) {
        const R = arms[i], L = legs[i];
        R.sh.rotation.z = lerp(R.sh.rotation.z, 2.7, k); R.el.rotation.z = lerp(R.el.rotation.z, 0.7, k); R.sh.rotation.x = lerp(R.sh.rotation.x, 0, k); R.sh.rotation.y = lerp(R.sh.rotation.y, 0, k);
        L.hip.rotation.z = lerp(L.hip.rotation.z, 0.75, k); L.knee.rotation.z = lerp(L.knee.rotation.z, -1.2, k); L.foot.rotation.z = lerp(L.foot.rotation.z, -0.35, k);
      }
      spine.rotation.z = lerp(spine.rotation.z, -0.1, k);                                // 身子微微往绳子那边弓
      head.rotation.z = lerp(head.rotation.z, 0.3 - 0.12 * clamp((A.lastRope?.rv ?? 0) / ROPE.down, 0, 1), k); head.rotation.y = lerp(head.rotation.y, 0, k);   // 抬头往上看；往下滑时低一点
    }
    // 整个人绕着身体的中点转（不在水里时 A.pitch 回到 0）；抓着绳子时绕着脚底跟着绳子斜（人的位置已经按斜过的样子算好了）
    root.rotation.z = -A.pitch + A.tilt * A.rope * Math.cos(A.yaw);
    if (A.pitch > 1e-4) { const c = s.swim?.c ?? A.lastSwim?.c ?? 0.6, sp = Math.sin(A.pitch) * c; root.position.x -= sp * Math.cos(A.yaw); root.position.z += sp * Math.sin(A.yaw); root.position.y += c - Math.cos(A.pitch) * c; }
    if (ld.roll > 1e-4 && ld.roll < 1 && !B.traveler?.model) {             // 前滚翻（搭出来的骨架）：抱成一团，绕着胯往前滚一圈。主角的模型在最后单独转
      const a = ld.roll * 6.2832, c = hipY, sp = Math.sin(a) * c;
      root.rotation.z -= a; root.position.x -= sp * Math.cos(A.yaw); root.position.z += sp * Math.sin(A.yaw); root.position.y += c - Math.cos(a) * c;
    }
    if (tail) {                                                              // 马尾：一个小弹簧，跑起来向后飘，下落时扬起
      const target = -0.5 - clamp(fwd * 0.2, -0.3, 0.75) + clamp(s.vy * 0.07, -0.6, 0.5) + 0.18 * bobPh * A.mv;
      A.tv += ((target - A.ta) * 70 - A.tv * 8) * dt; A.ta = clamp(A.ta + A.tv * dt, -2.2, 0.4);
      tail.rotation.z = A.ta - A.lean * 0.6; tail.userData.t2.rotation.z = (A.ta - target) * 0.7 - 0.25;
    }
    if (Lm) {                                                                // 07 胸口的灯：它的“表情”全在这盏灯上
      A.dip = Math.max(damp(A.dip, 0, 7, dt), clamp((s.impact - 5) * 0.14, 0, 1));   // 普通跳跃落地只晃一下，从高处摔下来才会暗得厉害
      const en = s.energy ?? 1, steady = en > 1.05;                          // 剩余电量：一路上帮别人，灯一档一档暗下去；修复以后稳稳地亮着
      let L = 1 + 0.07 * Math.sin(t * 1.7);                                  // 平时：跟着呼吸一明一暗
      const slot = Math.floor(t / 0.85);                                     // 老了，电压不稳：隔几秒闪两下；电越少闪得越勤
      if (!steady && hash1(slot) < 0.14 + 0.3 * clamp(1 - en, 0, 1) && t / 0.85 - slot < 0.34) L *= hash1(Math.floor(t * 31)) < 0.5 ? 0.3 : 0.9;
      L *= Math.min(en, 1.15);
      L *= 1 - 0.75 * A.dip * (0.55 + 0.45 * Math.sin(t * 71));              // 重重落地：被震得一暗
      L = lerp(L, 0.5 + 0.8 * hash1(Math.floor(t * 26) + 7), sstep(0.05, 0.6, s.alert || 0));   // 被探照灯盯上：慌乱地闪
      const k = clamp(L, 0, 1), out = L * lerp(1, 0.14, A.cover), ko = clamp(out, 0, 1);       // out：捂住以后漏出来的光
      Lm.lens.material.color.copy(Lm.dim).lerp(Lm.lit, k);
      Lm.halo.material.opacity = 0.9 * ko; Lm.halo.scale.setScalar(Lm.haloSize * (0.8 + 0.25 * out));
      Lm.aura.material.opacity = Lm.auraOp * sstep(0.2, 1, out); Lm.aura.position.z = Math.cos(A.yaw) * 0.14 * u;
      Lm.beam.intensity = Lm.I * out; Lm.fill.intensity = Lm.fillI * out;
    }
    if (B.traveler?.model) {
      const traveler = B.traveler;
      // Convert the mesh's side-view swing axis into each bone parent's local space.
      const worldAxis = new THREE.Vector3(1, 0, 0).applyQuaternion(traveler.model.getWorldQuaternion(new THREE.Quaternion()));
      const up = new THREE.Vector3(0, 1, 0);
      const poseBone = (name, angle, turn = 0) => {
        const entry = traveler.bones.get(name);
        if (!entry) return;
        const parentQ = entry.node.parent.getWorldQuaternion(new THREE.Quaternion()).invert();
        const axis = worldAxis.clone().applyQuaternion(parentQ).normalize();
        entry.node.quaternion.copy(entry.rest).premultiply(new THREE.Quaternion().setFromAxisAngle(axis, -angle));
        if (turn) entry.node.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(up.clone().applyQuaternion(parentQ).normalize(), turn));   // 左右转：绕竖直方向
        entry.node.updateWorldMatrix(false, true);
      };
      // 弯腰、落地蹲下：大半在胯上（骨盆往前倾，两条大腿反着转回来，腿不跟着歪），剩下的分给三节脊椎；呼吸的起伏在胸口那两节；滚翻时整个背拱起来。累了弓腰只有三成五在胯上，剩下的分给三节脊椎，背是圆的
      // 上身的拧转（见上面的 sway / A.twist）：胯反着转一点，三节脊椎一节一节拧过去
      const tw = chest.rotation.y;
      const bh = bl * .55 + landPitch * .65 + A.stoop * .35; poseBone('Hips', -bh, -.3 * sway);
      poseBone('Spine02', -bl * .2 - landPitch * .2 - A.stoop * .2, tw * .3 + .3 * sway); poseBone('Spine01', -bl * .15 - landPitch * .15 - A.stoop * .22 + hv * .5, tw * .35);
      poseBone('Spine', -A.lean * .35 - bl * .1 - A.stoop * .23 + hv * .5 - A.ltuck * .35, tw * .35);
      poseBone('neck', head.rotation.z * .35 * A.swim, head.rotation.y * .35);   // 站着张望、被灯照到时扭头：脖子先带三成，头转剩下的（游泳时抬头也分给脖子三成）
      poseBone('Head', head.rotation.z * (1 - .35 * A.swim), head.rotation.y * .65);
      for (let i = 0; i < 2; i++) {
        const side = i ? 'Right' : 'Left';
        poseBone(side + 'UpLeg', legs[i].hip.rotation.z + bh - lieA);                 // 胯折过去多少，大腿就补回来多少
        poseBone(side + 'Leg', legs[i].knee.rotation.z);
        poseBone(side + 'Foot', legs[i].foot.rotation.z);
      }
      // 累的时候手按到身上某一点（按大腿、撑膝盖、抹额头）：在模型自己的骨骼上解 IK，手才真的落在那里。
      // at() 把一节骨头的位置换成侧视平面里的坐标（往前多远、离地多高）—— 身子朝镜头转过来了，也照身子自己的朝向量
      const cy = Math.cos(A.yaw), sy = Math.sin(A.yaw), r0 = root.position;
      const at = name => { const p = traveler.bones.get(name).node.getWorldPosition(_tv); return [(p.x - r0.x) * cy - (p.z - r0.z) * sy, p.y - r0.y]; };
      const ang = (p, q) => Math.atan2(q[0] - p[0], p[1] - q[1]);             // 从 p 指向 q 的方向：0 竖直往下，正的往前
      for (let i = 0; i < 2; i++) {
        const side = i ? 'Right' : 'Left';
        poseBone(side + 'Arm', arms[i].sh.rotation.z, arms[i].turn || 0); poseBone(side + 'ForeArm', arms[i].el.rotation.z);
        let k = 0, tx = 0, ty = 0, bulge = 0;
        let kT = 0;                                                          // 撑大腿：这条腿迈上去的时候按住，腿往后走了就松开
        if (TL && TL.thighs > 0.001) { const p = (A.ph + i * 0.5) % 1; kT = tk * (1 - A.run) * TL.thighs * lerp(1, p > 0.5 ? sstep(0.84, 0.97, p) : 1 - sstep(0.24, 0.36, p), A.mv); }
        if (kT > 0.001 || restK > 0.001) {                                   // 手掌按在大腿前面：走着的时候按在大腿中段，停下来撑在膝盖上面
          const [hx, hy] = at(side + 'UpLeg'), [kx, ky] = at(side + 'Leg'), lx = kx - hx, ly = ky - hy, n = Math.hypot(lx, ly) || 1, f = lerp(0.7, 0.86, restK / (restK + kT));
          tx = hx + lx * f - ly / n * 0.07; ty = hy + ly * f + lx / n * 0.07 + 0.035; k = Math.max(kT, restK);
        } else if (wipe > 0.001 && i === near) {                             // 抹额头：靠镜头的那只手，手背抹过额头
          // 额头：脸前面那节骨头（headfront）往头顶的方向挪六成；手腕停在额头的前下方，手背正好贴着眉毛，抹的时候往后上方带一下
          const [fx, fy] = at('headfront'), [hx, hy] = at('Head'), [ex, ey] = at('head_end');
          k = wipe; bulge = 0.015; tx = fx + 0.6 * (ex - hx) + 0.065 - 0.045 * wipeX; ty = fy + 0.6 * (ey - hy) - 0.05 + 0.02 * wipeX;
        }
        // 剧情里直接给手腕的位置（世界坐标）：q.hands[i] = { x, y, k }。从包里取灯泡、举起来对照、拧进灯座、握住手柄（见 43-carry.js 和机房一章）
        const hq = q.hands && q.hands[i];
        if (hq && (hq.k ?? 1) > 0.001) { k = hq.k ?? 1; tx = (hq.x - s.x) * dir; ty = hq.y - s.y; bulge = hq.bulge ?? 0; }
        if (brush && brush.k > 0.002 && (brush.hands === 2 || i === near)) k *= 1 - brush.k * (1 - restK);   // 这只手正伸出去拨路边的叶子：先拨叶子（停下来撑膝盖的时候除外）
        if (k > 0.001) {
          // 手不是一下子跳过去的：从它现在的位置沿着身前移过去，每一刻都重新解 IK，手肘自然地弯着。
          // 上臂、前臂多长、现在朝哪都从模型身上量（和落地手撑地一样），要转的就是 IK 算出的方向减去现在的方向
          let S = at(side + 'Arm'), E = at(side + 'ForeArm'), W = at(side + 'Hand');
          const e = k * k * (3 - 2 * k), [U, F] = ik2(S[0], S[1], lerp(W[0], tx, e) + bulge * Math.sin(Math.PI * e), lerp(W[1], ty, e), Math.hypot(E[0] - S[0], E[1] - S[1]), Math.hypot(W[0] - E[0], W[1] - E[1]), false);
          arms[i].sh.rotation.z += wrapA(U - ang(S, E)); poseBone(side + 'Arm', arms[i].sh.rotation.z, arms[i].turn || 0);
          E = at(side + 'ForeArm'); W = at(side + 'Hand');
          arms[i].el.rotation.z += wrapA(U + F - ang(E, W)); poseBone(side + 'ForeArm', arms[i].el.rotation.z);
        }
      }
      if (A.bend > 0.01) {
        // 累坏了弯着腰：模型是在自己的几节脊椎上弯的（比骨架的骨盆高），手臂也比骨架短，所以这里直接按模型的骨头摆 ——
        // 先让脚别离地：膝盖一弯，脚尖比站直时高出多少，整个人就往下放多少
        const B2 = n => traveler.bones.get(n)?.node, X = v => (v.x - s.x) * dir, Y = v => v.y - s.y;
        let lift = Infinity; for (const n of ['LeftToeBase', 'RightToeBase']) { const b = B2(n); if (b) lift = Math.min(lift, Y(b.getWorldPosition(_bv[0]))); }
        if (lift < Infinity && lift > 0.035 * u) { traveler.group.position.y -= (lift - 0.035 * u) * A.bend; traveler.group.updateMatrixWorld(true); }
        // 再让两只手撑在大腿上（膝盖往上三成的地方）：先把手臂放回模型自己的姿势，量出上臂、前臂原来朝哪、多长，再用两节的反向运动学算该转多少
        for (let i = 0; i < 2; i++) {
          const side = i ? 'Right' : 'Left', arm = B2(side + 'Arm'), fore = B2(side + 'ForeArm'), hand = B2(side + 'Hand'), knee = B2(side + 'Leg'), hip = B2(side + 'UpLeg');
          if (!arm || !fore || !hand || !knee || !hip) continue;
          poseBone(side + 'Arm', 0); poseBone(side + 'ForeArm', 0);
          const S = arm.getWorldPosition(_bv[0]), El = fore.getWorldPosition(_bv[1]), H = hand.getWorldPosition(_bv[2]), K = knee.getWorldPosition(_bv[3]), Hp = hip.getWorldPosition(_bv[4]);
          const ux = X(El) - X(S), uy = Y(El) - Y(S), fx = X(H) - X(El), fy = Y(H) - Y(El);
          const r1 = Math.atan2(ux, -uy), r2 = Math.atan2(fx, -fy);           // 上臂、前臂现在朝哪（从竖直往下量，往前为正）
          const [w1, w2] = ik2(X(S), Y(S), lerp(X(K), X(Hp), 0.3) + 0.035 * u, lerp(Y(K), Y(Hp), 0.3) + 0.05 * u, Math.hypot(ux, uy), Math.hypot(fx, fy), false);   // 腕子在大腿前上方一点：手掌正好搭在腿上
          const al = wrapA(w1 - r1), be = wrapA(w1 + w2 - (r2 + al));
          poseBone(side + 'Arm', lerp(arms[i].sh.rotation.z, al, A.bend), (arms[i].turn || 0) * (1 - A.bend)); poseBone(side + 'ForeArm', lerp(arms[i].el.rotation.z, be, A.bend));
        }
      }
      // 上面的角度是照搭出来的那副骨架算的，模型自己的腿和胳膊长短不太一样：落地蹲下、手撑地时再照模型本身对一遍
      if (A.lc > 0.001 && LP.feet && traveler.footY !== undefined) {   // 前脚踝比平平地踩在地上时高了多少，整个模型就往下补多少
        const f = traveler.bones.get('LeftFoot');
        if (f) { traveler.group.position.y -= (f.node.getWorldPosition(_v).y - root.position.y - traveler.footY - 0.011) * A.lc; traveler.group.updateMatrixWorld(true); }   // 0.011：蹲下时脚掌微微前倾，脚踝要比绑定姿势高一点
      }
      if (A.hand > 0.001) {                                                  // 手撑地：用模型自己的胳膊长短重新解一遍，让手腕落到身前的地面上
        const b0 = traveler.bones.get('RightArm'), b1 = traveler.bones.get('RightForeArm'), b2 = traveler.bones.get('RightHand');
        if (b0 && b1 && b2) {
          const cy = Math.cos(A.yaw), sy = Math.sin(A.yaw), r = root.position;
          const sideOf = n => { n.getWorldPosition(_v); return [(_v.x - r.x) * cy - (_v.z - r.z) * sy, _v.y - r.y]; };   // 侧面里的坐标：往前多远、离地多高
          const ang = (p, q) => Math.atan2(q[0] - p[0], p[1] - q[1]);       // 从 p 指向 q 的方向：0 竖直往下，正的往前
          let S = sideOf(b0.node), E = sideOf(b1.node), W = sideOf(b2.node);
          const [ua, fa] = ik2(S[0], S[1], 0.24, 0.1, Math.hypot(E[0] - S[0], E[1] - S[1]), Math.hypot(W[0] - E[0], W[1] - E[1]), false);
          poseBone('RightArm', arms[1].sh.rotation.z + (ua - ang(S, E)) * A.hand, (arms[1].turn || 0) * (1 - A.hand));
          E = sideOf(b1.node); W = sideOf(b2.node);
          poseBone('RightForeArm', arms[1].el.rotation.z + (ua + fa - ang(E, W)) * A.hand);
        }
      }
      if (ld.roll > 1e-4 && ld.roll < 1) {                                  // 前滚翻：抱成一团以后，绕着身体的中心往前滚一圈，最低的地方一直贴着地面
        const G_ = traveler.group, loc = n => root.worldToLocal(traveler.bones.get(n).node.getWorldPosition(new THREE.Vector3()));
        const C = loc('Hips').lerp(loc('Spine01'), 0.5), a = -ld.roll * 6.2832, cs = Math.cos(a), sn = Math.sin(a), dx = G_.position.x - C.x, dy = G_.position.y - C.y;
        G_.position.x = C.x + dx * cs - dy * sn; G_.position.y = C.y + dx * sn + dy * cs; G_.rotation.z += a; G_.updateMatrixWorld(true);
        G_.position.y -= lowestY(traveler.model) - root.position.y; G_.updateMatrixWorld(true);
      }
      if (A.rope > 0.01 && A.lastRope) ropeIK(traveler, A.lastRope, A.rope);         // 手抓在绳子上、脚夹在绳子上
    }
  }
  function dispose() { root.parent && root.parent.remove(root); root.traverse(o => { if (o.geometry && !o.userData.travelerShared) o.geometry.dispose(); if (o.userData.travelerOwned) { for (const material of (Array.isArray(o.material) ? o.material : [o.material])) material.dispose(); } if (o.isSkinnedMesh) o.skeleton.dispose(); }); }
  return { kind, B, A, root, H: u, update, dispose };
}
