
// ============================================================
//  第一章 · 焚化炉
//  黑屏里先听到轮子声和远处的铃声。画面亮起：输送带从右往左，载着一辆辆推车送向左边的炉口，炉门隔一阵打开、喷火、关上。
//  主角躺在其中一辆推车里，身边是穿白色内衣的身体 —— 一车白色里只有他有颜色。一个看守走过来，用棍子拨了拨这一车，走开了；
//  他走远以后，主角坐了起来。
//  怎么通过：跳出推车，逆着输送带往右走，翻过一辆辆推车；炉门一开，火顺着输送带卷过来，躲到推车右边贴着它（站在车上也烧不到）。
//  下了输送带，把空箱推到断电杆下面，站上去拉下杆子：输送带停住，检修门打开。
//  看到的：这些身体正在被送进炉子，他自己也在里面。留下的问题：这些穿白衣服的人是谁？
// ============================================================
const E1 = (() => {
  const MOUTH = 8, LIFT = 50, END = 80, V_BELT = 0.55, GAP = 7, NC = 7, LOOP = GAP * NC, RUN = LIFT - MOUTH, REACH = 40, HERO = 2;   // RUN：一辆车在输送带上走多远；HERO：主角躺在第几辆车里
  const C = chapter({ n: 1, x0: -60, start: 28, name: '焚化炉', sub: '醒来', ground: 'concrete' });
  terrain([-60, 0], [END, 0]);
  ground(-60, 0x1b1a19); ground(END, 0x1b1a19);
  surface(MOUTH, LIFT + 2, 'metal');
  solid({ id: 'furnace', x1: -10, x2: MOUTH - 0.9, y1: 0, y2: 14, noclimb: true });
  // 输送带上的推车：s 从升降台落到带子上以后走了多远。走到炉口（s = RUN）就进了炉子；剩下的一段（RUN..LOOP）它在升降台上从顶上放下来
  const S0 = [35.5, 28.5, 21.5, 14.5, 7.5, 0.5, 42.5];
  const CARTS = S0.map((s, i) => solid({ id: 'bcart' + i, s, x: 0, y: 0, x1: 0, x2: 0, y1: 0, y2: CART.rail, off: false, snd: 'metal', fired: false }));
  const crate = pushable({ id: 'e1crate', x: 60.5, w: 1.15, h: 0.95, min: 58.5, max: 70.0, snd: 'wood' });
  const door = gate({ id: 'e1door', x: END });
  const LEVER = { x: 70.0, pulled: false, t: 0, reach: 0 };
  // st：sleep 还没开始（标题画面）/ intro 开场 / free 可以动了。t 开场过了多久；grace 回到存档点以后几秒里火烧不到
  const S = { st: 'sleep', t: 0, grace: 0, lie: 1, sit: 1 };
  const BELT = { v: 0, off: 0 };
  // 炉子：ph —— idle 关着 / warn 门开了 / fire 火卷出来 / cool 收回去。front 火头到哪了；next 离下一次自己喷还有多久（推车进炉的那一下另算）
  const FUR = { ph: 'idle', t: 0, front: MOUTH, next: 6.3, open: 0, heat: 0 };
  const BODS = CARTS.map((c, i) => bodiesFor(i === HERO ? 2 : 3));
  const G = fig('guard', 17, { z: -1.75, hide: true });
  const FIGS = [...BODS.flat(), G];
  C.intro = () => { S.st = 'intro'; S.t = 0; ctl = false; $('fade').style.opacity = 1; };

  usable({ id: 'e1breaker', x: LEVER.x, r: 0.85, y0: 0.6, can: () => !LEVER.pulled,
    on() { LEVER.pulled = true; LEVER.reach = 0.7; door.want = 1; fx('lever'); fx('powerDown'); } });
  checkpoint(26); checkpoint(38); checkpoint(54); checkpoint(66); checkpoint(76);
  camKeys([-20, 22, 2.0, 3], [14, 22, 2.0, 2.6], [30, 21, 1.9, 1.2], [50, 21, 2.0, 1], [62, 21, 2.3, 1.5], [72, 21, 2.6, 0], [78, 19, 1.9, -1.2], [END + 0.4, 18.5, 1.8, -1]);
  // 光：暗，脏。主光几乎没有，炉口一阵一阵的红光是这一章最亮的东西
  env(-60, { fog: 0x201816, fogD: 0.028, hemiS: 0x9c908c, hemiG: 0x18110e, hemiI: 0.8, keyC: 0xffd8bc, keyI: 0.5, keyDir: [0.2, 1, 0.35], rimC: 0xff9a6a, rimI: 0.95,
    dustC: 0xffc9a0, dustO: 0.45, wind: -0.03, ext: 0, vig: 1.12, aRoom: 1, roomF: 150, aHum: 0.35, aDrip: 0, aFar: 1, rvHall: 1 });
  env(END - 0.7, {});

  const onBelt = () => P.x > MOUTH && P.x < LIFT + 1 && P.y < 1.0;
  const shielded = () => CARTS.some(c => !c.off && P.x > c.x2 - 0.05 && P.x < c.x2 + 1.8);
  hint(() => S.st === 'free' && !P.moved, '<b>←</b><b>→</b> 移动　　<b>空格</b> 跳出推车');
  hint(() => S.st === 'free' && onBelt() && P.y < 0.5 && P.x < REACH && (FUR.ph === 'warn' || FUR.ph === 'fire' || FUR.open > 0.4) && !shielded(), '炉门开了 —— 躲到推车右边，贴着它');
  hint(() => S.st === 'free' && onBelt() && P.x < 20 && P.x > MOUTH + 3 && !LEVER.pulled, '输送带在把你往炉口带 —— 往右走');
  hint(() => !LEVER.pulled && P.y > 0.6 && Math.abs(P.x - LEVER.x) < 0.85, '按 <b>E</b> 拉下断电杆');
  hint(() => !LEVER.pulled && crate.x >= 69 && P.x > 66 && P.x < 72 && P.y < 0.5 && P.mode !== 'push', '跳上箱子');
  hint(() => !LEVER.pulled && crate.x < 69 && P.x > 68.6 && P.x < 71.6 && P.y < 0.5, '断电杆太高了，够不着');
  hint(() => !LEVER.pulled && crate.x < 68 && P.x > 57.5 && P.x < 66 && Math.abs(P.x - crate.x) < 2.4 && P.mode !== 'push', '按住 <b>E</b> 推箱子 —— 地上的拖痕通向断电杆');

  // 灯：炉口的红光、跟着火头走的一团光；输送带上方几盏昏暗的吊灯；断电杆上的小红灯；检修门外的光
  const furL = pointLight({ p: [MOUTH + 0.8, 1.5, 0.4], c: 0xff5a22, i: 26, d: 26, dec: 1.3 });
  const flameL = pointLight({ p: [MOUTH, 1.1, 0.5], c: 0xff8a3a, i: 70, d: 13, dec: 1.4, on: 0 });
  const leverL = pointLight({ p: [LEVER.x, 2.9, 0.2], c: 0xff4a2a, i: 2.2, d: 5, dec: 2 });
  const doorL = pointLight({ p: [END - 1.0, 1.5, 0.5], c: 0xffc070, i: 6, d: 12, dec: 1.4, on: 0 });
  const LAMPS = [20, 34, 48, 62, 73];
  workLamps(LAMPS, { c: 0xffb070, i: 4.5 });

  let V = null;
  function* build(R) {
    const v = {}, brick = lam(0x2b221e), brick2 = lam(0x1d1715); brick.userData.own = brick2.userData.own = true;
    hallLayers(-36, END + 1.5, { far: '#140e0d', win: '#3a1c14', mid: '#0c0808', near: '#080606', near2: '#1a100c' }, { lamps: LAMPS, cols: [14.5, 44.5, 56, 75.5], fore: [31.5, 64.2],
      mid(g) { box(g, -6, 9, 9, 13); box(g, -8, 8.2, 13, 1.0); for (const x of [57, 66]) { poly(g, [[x, 4.2], [x + 3, 4.2], [x + 2.2, 1.8], [x + 0.8, 1.8]]); box(g, x + 0.2, 0, 0.2, 4.2); box(g, x + 2.6, 0, 0.2, 4.2); } } });
    yield;
    floorSeams(R, -20, END - 1);
    // 炉子：一整块砖砌的炉体，朝右开着一个口，输送带伸进去。口里面是一片烧红的光；门是一块往上提的铁板
    add(R, bx(15.9, 12, 12), brick, MOUTH - 8.95, 6, 0); add(R, bx(1.0, 12, 4.85), brick, MOUTH - 0.5, 6, -3.575); add(R, bx(1.0, 12, 4.85), brick, MOUTH - 0.5, 6, 3.575);
    add(R, bx(1.0, 9.4, 2.3), brick, MOUTH - 0.5, 2.6 + 4.7, 0); add(R, bx(0.5, 0.5, 2.9), brick2, MOUTH + 0.12, 2.85, 0); for (const z of [-1.4, 1.4]) add(R, bx(0.5, 2.6, 0.5), brick2, MOUTH + 0.12, 1.3, z);
    v.inner = add(R, new THREE.PlaneGeometry(2.3, 2.6), unlit(0xff6a22, { fog: false, transparent: true }), MOUTH - 0.98, 1.3, 0, false); v.inner.rotation.y = Math.PI / 2;
    v.plate = add(R, bx(0.16, 2.6, 2.34), MAT.rust2, MOUTH + 0.1, 1.3, 0);
    v.mouthGlow = glow(R, 0xff5a20, 9, 0.5, MOUTH + 0.5, 1.3, 0.6, GLOW_SOFT);
    v.flames = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => glow(R, i % 2 ? 0xffa040 : 0xff5a1c, 3.6 - i * 0.26, 0, MOUTH, 0.7, 0.2));
    yield;
    // 输送带：和地面齐平的一条带子，上面一道道横条跟着带子走；两边各一道矮沿，后面是看守走的一条窄道
    { const [c, g] = mkCanvas(64, 32); g.fillStyle = '#17191a'; g.fillRect(0, 0, 64, 32); g.fillStyle = '#2b2f31'; g.fillRect(0, 0, 9, 32); g.fillStyle = '#0c0d0e'; g.fillRect(9, 0, 3, 32);
      const t = canvasTex(c); t.wrapS = THREE.RepeatWrapping; t.repeat.set((RUN + 2) / 1.4, 1);
      const mat = new THREE.MeshLambertMaterial({ map: t }); mat.userData.own = true;
      v.belt = new THREE.Mesh(new THREE.PlaneGeometry(RUN + 2, 2.3), mat); v.belt.rotation.x = -Math.PI / 2; v.belt.position.set((LIFT + MOUTH) / 2, 0.012, 0); v.belt.receiveShadow = true; R.add(v.belt); }
    for (const z of [-1.2, 1.2]) add(R, bx(RUN + 2, 0.14, 0.1), MAT.steel, (LIFT + MOUTH) / 2, 0.07, z);
    add(R, bx(RUN + 14, 0.02, 0.9), MAT.dark, (LIFT + MOUTH) / 2 + 6, 0.012, -1.75, false).receiveShadow = true;
    add(R, cy(0.3, 0.3, 2.3, 14), MAT.steel, LIFT + 1.05, -0.12, 0).rotation.x = Math.PI / 2;                           // 带子尽头的滚筒
    // 升降台：四根立柱，推车从顶上被四股链条放下来（上游把车送到这里）
    for (const sx of [-1.15, 1.15]) for (const sz of [-0.75, 0.75]) add(R, bx(0.14, 9, 0.14), MAT.steel, LIFT + sx, 4.5, sz);
    add(R, bx(2.6, 0.3, 1.8), MAT.dark, LIFT, 9, 0);
    v.chains = grp(R, LIFT, 0, 0); for (const sx of [-0.7, 0.7]) for (const sz of [-0.38, 0.38]) add(v.chains, bx(0.03, 1, 0.03), MAT.dark, sx, -0.5, sz, false);
    yield;
    v.carts = CARTS.map(c => mkCart(R, 0, 0));
    v.crowd = mkCrowd(R, FIGS.length + 2); v.crowd.addAll(FIGS);
    yield;
    // 断电杆：装在一根立柱高处的闸刀，站在地上够不着；空箱、拖痕、轮挡
    add(R, bx(0.34, 7, 0.34), MAT.steel, LEVER.x, 3.5, -0.78); add(R, bx(0.5, 0.7, 0.3), MAT.dark, LEVER.x, 2.35, -0.5);
    v.leverArm = grp(R, LEVER.x, 2.36, -0.3);
    add(v.leverArm, cy(0.03, 0.03, 0.56, 8), MAT.dark, 0, 0.28, 0); add(v.leverArm, new THREE.SphereGeometry(0.075, 12, 8), lam(0xb0452e), 0, 0.58, 0);
    v.leverLamp = unlit(0xff4a2a); add(R, new THREE.SphereGeometry(0.075, 10, 8), v.leverLamp, LEVER.x, 2.92, -0.46, false);
    tube(R, [[LEVER.x, 2.7, -0.7], [LEVER.x - 0.4, 5.6, -1.8], [LEVER.x - 3, 7.2, -3.2], [LIFT + 1, 8.6, -0.9]], 0.035, MAT.dark);
    v.crateG = mkCrate(R, crate, 'wood'); dragMarks(R, 60.1, 70.3);
    add(R, bx(0.22, 0.14, 1.0), MAT.rust, 70.72, 0.07, 0).rotation.z = 0.5;
    v.lampG = lampGlows(R, LAMPS, 0xffb070, 1.8);
    // 厂房尽头的墙和检修门
    divider(R, END); v.door = mkGateDoor(R, door);
    v.doorGlow = new THREE.MeshBasicMaterial({ color: 0xffb060, transparent: true, opacity: 0, fog: false, depthWrite: false });
    add(R, new THREE.PlaneGeometry(2.44, 3.6), v.doorGlow, END + 0.62, 1.8, 0, false).rotation.y = -Math.PI / 2;
    V = v;
  }

  function burn() { if (state === 'play' && S.st === 'free' && S.grace <= 0) { S.grace = 9; caughtNow('fall'); } }
  function stepIntro(dt) {
    const t = S.t += dt, HC = CARTS[HERO];
    if (t > 2.2) $('fade').style.opacity = 0;
    camOvr = { d: 25, yo: 2.3, xo: lerp(-5.5, -2, sstep(15, 20, t)) };
    if (t > 3 && t < 15.5 && (keys.has('J') || keys.has('E'))) { S.t = 15.5; G.hide = true; }              // 看过了：按一下跳过看守这一段
    // 看守：从炉口那边沿着输送带走过来，在这一车旁边站住，用棍子拨两下，接着往右走远
    if (t > 2.4 && t < 15.5) {
      G.hide = false;
      if (!G.met) { figAct(G, 'walk'); G.yawT = undefined; if (G.x > HC.x - 1.3) { G.met = t; G.vx = 0; } else figGo(G, 99, 1.3, dt); }
      else if (t < G.met + 2.9) { figAct(G, 'poke', { tx: P.x + 0.25, ty: P.y + 0.12, yawT: -0.95 }); G.vx = 0; }
      else { figAct(G, 'walk'); G.yawT = undefined; figGo(G, 70, 1.35, dt); }
    } else G.hide = true;
    S.lie = 1 - sstep(16.6, 18.4, t); S.sit = 1 - sstep(19.0, 19.9, t);
    if (t > 20) { S.st = 'free'; ctl = true; camOvr = null; G.hide = true; FUR.next = 5.2; }
  }
  function update(dt) {
    const play = state === 'play', run = state !== 'title';
    S.grace = Math.max(0, S.grace - dt);
    if (S.st === 'intro' && run) stepIntro(dt);
    // 输送带和上面的推车
    BELT.v = damp(BELT.v, LEVER.pulled || !run ? 0 : V_BELT, 2.5, dt);
    const ds = BELT.v * dt; BELT.off += ds;
    let near = false;
    for (const c of CARTS) {
      c.s = (c.s + ds) % LOOP;
      if (c.s < RUN) { c.x = LIFT - c.s; c.y = 0; if (c.s < 1) c.fired = false; }
      else { c.x = LIFT; c.y = lerp(8.6, 0, sstep(0.3, 1, (c.s - RUN) / GAP)); }
      c.off = c.y > 0.01 || c.x < MOUTH + 0.9; c.x1 = c.x - CART.L / 2; c.x2 = c.x + CART.L / 2;
      if (c.s < RUN && c.x < MOUTH + 1.65) near = true;                                          // 有车快到炉口了：门提前一秒多打开等它（和自己喷火之前开门的时间一样长）
      if (c.s < RUN && c.x < MOUTH + 1.0 && !c.fired) { c.fired = true; FUR.ph = 'fire'; FUR.t = 0; FUR.next = 3.4; fx('whoosh', sstep(60, 12, Math.abs(P.x - MOUTH))); }   // 车进了炉子：火卷出来
    }
    // 炉子
    FUR.t += dt;
    if (FUR.ph === 'idle') { if (S.st === 'free' && BELT.v > 0.3 && (FUR.next -= dt) <= 0) { FUR.ph = 'warn'; FUR.t = 0; fx('doorStop'); } }
    else if (FUR.ph === 'warn') { if (FUR.t > 1.1) { FUR.ph = 'fire'; FUR.t = 0; FUR.next = 1e9; fx('whoosh', sstep(60, 12, Math.abs(P.x - MOUTH))); } }
    else if (FUR.ph === 'fire') { FUR.front = MOUTH + 0.6 + 20 * FUR.t; if (FUR.front >= REACH) { FUR.ph = 'cool'; FUR.t = 0; } }
    else if (FUR.t > 0.9) FUR.ph = 'idle';
    if (LEVER.pulled) { if (FUR.ph === 'warn') FUR.ph = 'idle'; FUR.next = 1e9; }
    const fire = FUR.ph === 'fire', open = !LEVER.pulled && (near || FUR.ph === 'warn' || fire);
    FUR.open = damp(FUR.open, open ? 1 : 0, open ? 7 : 3, dt);
    FUR.heat = damp(FUR.heat, LEVER.pulled ? 0.25 : fire ? 1 : 0.35 + 0.4 * FUR.open, 5, dt);
    furL.i = (10 + 34 * FUR.heat) * (0.9 + 0.1 * Math.sin(T * 17) * Math.sin(T * 6.1));
    flameL.on = fire ? 1 : 0; if (fire) flameL.p[0] = FUR.front - 1.2;
    // 主角：还躺在车里的时候跟着车走；站在输送带上被带着往左；被火燎到、被带进炉口就完了
    if (S.st !== 'free') {
      const HC = CARTS[HERO]; P.x = HC.x - 0.12; P.y = CART.rail; P.vx = P.vy = 0; P.grounded = true; P.facing = 1;
      if (S.st === 'sleep') { S.lie = 1; S.sit = 1; }
      HX.pose = { lie: S.lie, sit: S.sit, sitH: 0.115, sitLeg: lerp(1.0, 1.6, S.lie), limp: S.lie, nod: 0.5 * S.lie, turn: 0 };
    } else if (play && P.x < END) {
      if (P.grounded && onBelt() && P.mode === 'normal' && ds > 0 && !sideHit(P.x - ds, P.y)) P.x -= ds;
      const low = P.y < 0.5, sh = shielded();
      if (onBelt() && P.x < MOUTH + 0.95) burn();
      if (fire && low && onBelt() && P.x < FUR.front && P.x > FUR.front - 4.5 && !sh) burn();
      if (onBelt() && low && sh && (fire || FUR.ph === 'warn' || FUR.open > 0.5) && Math.abs(P.vx) < 1.2) HX.pose = crouchPose(sstep(0.3, 1, FUR.open));
      if (onBelt()) TIRED.rushT = 0.5;
    }
    AUD.belt = Math.max(AUD.belt, sstep(46, 8, Math.abs(P.x - 26)) * clamp(BELT.v / V_BELT, 0, 1) * (1 - E.ext));
    if (S.st === 'intro' && S.t < 15 && Math.floor(S.t / 4.2) !== Math.floor((S.t - dt) / 4.2)) fx('ebellFar', 1);        // 开场：远处隐约的铃声
    if (S.st === 'intro') AUD.wheels = 0.22 * (1 - sstep(1.5, 6, S.t));
    // 断电杆
    if (LEVER.pulled) LEVER.t = Math.min(1, LEVER.t + dt * 3.5);
    LEVER.reach = Math.max(0, LEVER.reach - dt);
    if (LEVER.reach > 0) HX.pose = { reach: { x: LEVER.x - 0.36, y: lerp(2.2, 2.8, LEVER.reach / 0.7), k: sstep(0, 0.25, LEVER.reach) } };
    leverL.c.set(LEVER.t > 0.5 ? 0x6dff9a : 0xff4a2a); doorL.on = E.ext > 0.5 ? 0 : door.open;
    for (const f of FIGS) figStep(f, dt);
    CARTS.forEach((c, i) => { if (ds > 0 || c.y > 0 || !BODS[i][0].shown) cartBodies(BODS[i], c.x, c.y); for (const f of BODS[i]) f.hide = c.s >= RUN && c.y > 8.4; });

    const v = V; if (!v) return;
    CARTS.forEach((c, i) => { const g = v.carts[i]; g.visible = !(c.s >= RUN && c.y > 8.4); g.position.set(c.x, c.y, 0); });
    const lift = CARTS.find(c => c.s >= RUN && c.y < 8.4);
    v.chains.visible = !!lift; if (lift) { const len = Math.max(0.05, 9 - (lift.y + CART.rail)); v.chains.scale.y = len; v.chains.position.y = 9; }
    v.belt.material.map.offset.x = BELT.off / 1.4;
    v.plate.position.y = 1.3 + 2.55 * sstep(0, 1, FUR.open);
    v.inner.material.opacity = 0.35 + 0.65 * FUR.heat; v.mouthGlow.material.opacity = (0.16 + 0.5 * FUR.heat) * FUR.open + 0.05;
    v.flames.forEach((s, i) => {                                                                // 火头：一串越往后越小的火团，贴着输送带卷过去
      const x = FUR.front - i * 0.5, k = fire ? clamp((x - MOUTH) / 1.5, 0, 1) * (1 - sstep(REACH - 6, REACH, FUR.front) * 0.7) : 0;
      s.material.opacity = 0.8 * k * (0.75 + 0.25 * Math.sin(T * 40 + i * 2.1)); s.position.set(x, 0.5 + 0.22 * Math.sin(T * 23 + i * 1.7) + 0.05 * i, 0.3);
    });
    v.crateG.position.x = crate.x;
    v.leverArm.rotation.z = lerp(0.95, 2.35, sstep(0, 1, LEVER.t)); v.leverLamp.color.set(LEVER.t > 0.5 ? 0x6dff9a : 0xff4a2a);
    v.door.sync(door); v.doorGlow.opacity = 0.22 * sstep(0.02, 0.8, door.open);
    v.crowd.draw();
  }
  function reset() {
    CARTS.forEach((c, i) => { c.s = S0[i]; c.fired = false; }); BODS.forEach((b, i) => cartBodies(b, LIFT - S0[i], 0));
    placeBox(crate, 60.5); setGate(door, 0); Object.assign(LEVER, { pulled: false, t: 0, reach: 0 });
    Object.assign(S, { st: 'sleep', t: 0, grace: 0, lie: 1, sit: 1 }); Object.assign(FUR, { ph: 'idle', t: 0, front: MOUTH, next: 6.3, open: 0, heat: 0 });
    Object.assign(G, { x: 17, hide: true, met: 0, vx: 0, yawT: undefined }); figAct(G, 'walk'); BELT.v = 0;
  }
  function solve() { reset(); S.st = 'free'; LEVER.pulled = true; LEVER.t = 1; placeBox(crate, 70.0); setGate(door, 1); }
  return defZone({ n: 1, vis: [-36, END + 1], build, update, reset, solve, unbuild() { V = null; },
    respawn(c) { if (c.x < END) { S.grace = 3.5; if (FUR.ph !== 'fire') { FUR.ph = 'idle'; FUR.next = 5; } } }, S, FUR, CARTS, LEVER, crate, door, G });
})();
