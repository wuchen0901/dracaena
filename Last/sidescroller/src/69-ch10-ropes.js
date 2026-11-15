
// ============================================================
//  第十章 · 吊绳与高台：一级比一级高的大水泥台阶，太高了跳不上去；台阶边上一排排旧吊臂，垂下一根根绳子
//  跳起来抓住绳子 → 往上爬 → 往台阶那边按方向，翻上去。三根能抓的绳子：
//    一 在平地上跳起来抓住，爬上第一级（3.6 米）
//    二 第一级和第二级之间是一道很深的水沟，绳子挂在沟的正上方：助跑，从台阶边上跳过去抓住，爬上第二级（6.8 米）。掉进沟里回到沟边
//    三 一根长绳子，从第三级顶上的吊车一直垂到第二级的台面上方，爬很长一段，上到最高的一级（11.8 米），走到边上，往下看得见走过来的路
//  往远处去，每一级台阶的边上都还有一排同样的吊臂（布景）：有的绳子还在，有的割断了，有的只剩一只空滑轮
//  （故事还在重写，这一章先单独放在最后，从章节菜单进；以后按剧情挪到该放的地方）
// ============================================================
const X10 = 1500;
const CH10 = (() => {
  const X = X10;
  const C = chapter({ n: OLD + 10, x0: X + 0.5, start: X + 3, name: '吊绳与高台', sub: '跳起来抓住绳子，爬上去', ground: 'gravel',   // 脚步声：地上是碎石，台阶上是水泥
    intro() { CAT.state = 'none'; } });
  const H1 = 3.6, H2 = 6.8, H3 = 11.8, DITCH = -2.6, WATER_Y = -1.05, ZF = 1.6, DEEP = 92, END = X + 100.5;
  terrain([X - 30, 0], [X + 29.9, 0], [X + 30.1, DITCH], [X + 32.85, DITCH], [X + 33.05, 0], [X + 150, 0]);
  ground(X - 30, 0x2c3231); ground(X + 150, 0x2c3231);
  solid({ x1: X - 8.4, x2: X - 7, y1: -2, y2: 40, noclimb: true });                   // 身后：一堵塌了半截的墙
  const S1 = solid({ id: 'step1', x1: X + 14, x2: X + 30, y1: DITCH, y2: H1, snd: 'concrete' });
  const S2 = solid({ id: 'step2', x1: X + 32.95, x2: X + 60, y1: DITCH, y2: H2, snd: 'concrete' });
  const S3 = solid({ id: 'step3', x1: X + 60, x2: END, y1: 0, y2: H3, snd: 'concrete' });
  solid({ x1: END - 1.35, x2: END - 0.9, y1: H3, y2: 40, noclimb: true });             // 最高一级的边上有一道矮墙和栏杆，走到这里为止
  // 三根能抓的绳子：挂在吊臂顶端的滑轮下面，离台阶的墙一米
  const R1 = rope({ x: X + 13.0, top: H1 + 1.95, bot: 1.95 });
  const R2 = rope({ x: X + 31.95, top: H2 + 1.95, bot: 3.35 });
  const R3 = rope({ x: X + 59.0, top: H3 + 2.6, bot: H2 + 1.85 });
  const NEAR = [[R1, S1, H1], [R2, S2, H2], [R3, S3, H3]];
  // 往远处去的那几排吊臂：[离镜头这边多远 z, 绳子多长（0 = 只剩空滑轮，'ground' = 一直垂到底下）]
  const ROWS = [[-15, 'ground'], [-26, 1.3], [-39, 0], [-55, 2.6], [-74, 'ground']], DECO = [];
  NEAR.forEach(([, S, top], k) => ROWS.forEach(([z, len], j) => {
    const arm = top + 2.33, rx = S.x1 - 1.0, L = (k + j) % 3 === 2 && len !== 'ground' ? (len ? len * 0.6 : 1.6) : len;   // 每一级排得不一样
    const below = (k === 0 ? 0 : k === 1 ? WATER_Y : H2) + 0.4;                         // 垂到底下：落在地上 / 水里 / 下一级的台面上
    const r = L ? rope({ x: rx, top: arm - 0.38, bot: L === 'ground' ? below - 1.2 : arm - 0.38 - L, z, deco: true, r: 0.034, windK: 1.3 }) : null;
    DECO.push({ S, top, z, rx, arm, r });
  }));
  pit({ x1: X + 30.02, x2: X + 32.93, y: WATER_Y + 0.15, sfx: 'splash' });
  pointLight({ p: [S3.x1 + 0.3, R3.top - 0.3, 0.1], c: 0xffb46a, i: 3.4, d: 7.5, dec: 1.6 });          // 最高一级吊车上那盏旧工作灯
  for (const x of [3, 16, 27, 35, 56, 63]) checkpoint(X + x);
  camKeys([X - 20, 19.5, 2.2, 0.8], [X + 8, 20, 2.3, 1.0], [X + 22, 20, 2.0, 1.6], [X + 31, 20.5, 2.0, 0.6], [X + 40, 21, 2.2, 1.2], [X + 54, 23, 3.5, 0.2],
    [X + 62, 23, 1.8, 2.5, 0.8], [X + 88, 24, 1.7, 4.0, 1.0], [X + 104, 24, 1.7, 4.0, 1.0]);
  // 阴天，起了雾。光从右上方、台阶的后面来：台面是亮的，朝着镜头的墙面都背着光
  env(X - 30, { fog: 0x6f7b78, fogD: 0.016, hemiS: 0xa9b6b3, hemiG: 0x1d2423, hemiI: 0.62, keyC: 0xdfe6df, keyI: 0.55, keyDir: [0.5, 1, -0.6], rimC: 0xbfd0cb, rimI: 0.75,
    dustC: 0xd2dcd8, dustO: 0.3, wind: 0.45, ext: 1, sky: [0x3a4547, 0x55625f, 0x7a8581, 0x98a19a, 0xa2aaa3, 0x5f6965], sunX: 0.34, sunY: 0.24, sunC: 0xe4e9e2, sunP: 0.32,
    stars: 0, cloud: 0.6, cloudC: 0xb4bdb8, birds: 0.12, flies: 0, vig: 1 });
  env(X + 150, {});

  const onRope = r => P.mode === 'rope' && P.rope === r;
  hint(() => P.mode === 'normal' && P.grounded && P.y < 0.5 && P.x > X + 10.2 && P.x < X + 14, '<b>空格</b> 跳起来，抓住绳子');
  hint(() => onRope(R1) && P.y < H1 - 0.95, '按住 <b>↑</b> 往上爬');
  hint(() => onRope(R1) && P.y >= H1 - 0.95, '按 <b>→</b> 爬上台阶');
  hint(() => P.mode === 'normal' && P.grounded && Math.abs(P.y - H1) < 0.05 && P.x > X + 25.5 && P.x < X + 30, '助跑，跳过去抓住绳子');
  hint(() => onRope(R2) && P.y < H2 - 0.95, '按住 <b>↑</b> 往上爬，<b>↓</b> 往下滑');

  // ---- 水泥墙面：大块的深浅、模板的拼缝、对拉螺栓的孔、从顶上往下流的水渍、泛白的碱、墙根返潮、顶边磕掉的角、吊臂底下淌下来的锈 ----
  // a..b 横着的范围（正面是 x，侧面是 z），y1..y2 竖着的范围
  function concrete(g, a, b, y1, y2, o = {}) {
    const W = b - a, Hh = y2 - y1, off = o.off ?? 0.4;
    for (let i = 0; i < W * Hh / 4; i++) caveBlob(g, rr(a, b), rr(y1, y2), rr(0.8, 2.8), rnd() < 0.65 ? '16,22,22' : '205,212,208', rr(0.05, 0.14));
    for (let x = a + off; x < b - 0.05; x += 1.2) { g.fillStyle = 'rgba(10,14,14,.3)'; g.fillRect(x - 0.008, y1, 0.016, Hh); }
    for (let y = y2 - 0.9; y > y1 + 0.1; y -= 0.9) { g.fillStyle = 'rgba(10,14,14,.34)'; g.fillRect(a, y, W, 0.018); g.fillStyle = 'rgba(220,226,222,.07)'; g.fillRect(a, y - 0.035, W, 0.028); }
    g.fillStyle = 'rgba(6,8,8,.6)';
    for (let x = a + off + 0.6; x < b - 0.1; x += 1.2) for (let y = y2 - 0.45; y > y1 + 0.2; y -= 0.9) { g.beginPath(); g.arc(x + rr(-0.02, 0.02), y + rr(-0.02, 0.02), 0.028, 0, 6.283); g.fill(); }
    for (let i = 0; i < W * 1.5; i++) {
      const x = rr(a, b), w = rr(0.03, 0.42), len = rr(0.4, Hh * 0.92), al = rr(0.08, 0.34), gr = g.createLinearGradient(0, y2, 0, y2 - len);
      gr.addColorStop(0, `rgba(10,14,14,${al})`); gr.addColorStop(1, 'rgba(10,14,14,0)'); g.fillStyle = gr; g.fillRect(x, y2 - len, w, len);
    }
    for (let i = 0; i < W * 0.8; i++) {
      const x = rr(a, b), y0 = y2 - 0.9 * Math.floor(rr(1, Math.max(1.01, Hh / 0.9))), len = rr(0.15, 0.7), gr = g.createLinearGradient(0, y0, 0, y0 - len);
      gr.addColorStop(0, 'rgba(225,230,224,.2)'); gr.addColorStop(1, 'rgba(225,230,224,0)'); g.fillStyle = gr; g.fillRect(x, y0 - len, rr(0.02, 0.09), len);
    }
    if (o.damp) { const gr = g.createLinearGradient(0, o.damp, 0, o.damp + 1.1); gr.addColorStop(0, 'rgba(8,12,12,.6)'); gr.addColorStop(1, 'rgba(8,12,12,0)'); g.fillStyle = gr; g.fillRect(a, y1, W, o.damp + 1.1 - y1); }
    g.fillStyle = 'rgba(8,10,10,.55)'; for (let x = a; x < b; x += rr(0.3, 1.6)) { const w = rr(0.05, 0.32), h = rr(0.02, 0.12); poly(g, [[x, y2 + 0.01], [x + w, y2 + 0.01], [x + w * 0.6, y2 - h]]); }
    for (const rx of o.rust ?? []) for (let i = 0; i < 6; i++) {
      const x = rx + rr(-0.3, 0.3), len = rr(0.6, Math.min(2.6, Hh)), gr = g.createLinearGradient(0, y2, 0, y2 - len);
      gr.addColorStop(0, 'rgba(118,58,26,.5)'); gr.addColorStop(1, 'rgba(118,58,26,0)'); g.fillStyle = gr; g.fillRect(x, y2 - len, rr(0.02, 0.08), len);
    }
  }
  // ---- 台面：脏的斑块、伸缩缝、裂缝、积着天光的水洼、靠边磨亮的一道；远处慢慢淡掉 ----
  function deck(g, a, b, z1, z2, o = {}) {
    g.fillStyle = 'rgba(22,28,27,.3)'; g.fillRect(a, z1, b - a, z2 - z1);
    for (let i = 0; i < (b - a) * (z2 - z1) / 6; i++) caveBlob(g, rr(a, b), rr(z1, z2), rr(0.6, 3), rnd() < 0.7 ? '18,22,20' : '200,206,198', rr(0.06, 0.2));
    g.fillStyle = 'rgba(12,16,16,.4)'; for (let x = a + 3; x < b - 1; x += 6) g.fillRect(x, z1, 0.03, z2 - z1);
    for (let z = z2 - 4.5; z > z1; z -= 6) g.fillRect(a, z, b - a, 0.03);
    g.strokeStyle = 'rgba(10,12,12,.5)'; g.lineCap = 'round';
    for (let i = 0; i < (b - a) * 0.5; i++) { let x = rr(a, b), z = rr(z1, z2); g.lineWidth = rr(0.012, 0.03); g.beginPath(); g.moveTo(x, z); for (let k = 0; k < 6; k++) { x += rr(-0.5, 0.5); z += rr(-0.6, 0.6); g.lineTo(x, z); } g.stroke(); }
    for (const [px, pz, rx, rz] of o.puddles ?? []) {
      g.fillStyle = 'rgba(178,190,186,.55)'; g.beginPath();
      for (let k = 0; k <= 24; k++) { const t = k / 24 * 6.283, f = 1 + 0.18 * Math.sin(t * 3 + px) + 0.1 * Math.sin(t * 5 + pz); g[k ? 'lineTo' : 'moveTo'](px + Math.cos(t) * rx * f, pz + Math.sin(t) * rz * f); }
      g.fill(); g.strokeStyle = 'rgba(30,36,34,.5)'; g.lineWidth = 0.03; g.stroke();
    }
    const gr = g.createLinearGradient(0, z2, 0, z2 - 0.5); gr.addColorStop(0, 'rgba(210,216,210,.22)'); gr.addColorStop(1, 'rgba(210,216,210,0)'); g.fillStyle = gr; g.fillRect(a, z2 - 0.5, b - a, 0.5);
    g.globalCompositeOperation = 'destination-out';
    const fade = g.createLinearGradient(0, z1, 0, z1 + 14); fade.addColorStop(0, 'rgba(0,0,0,1)'); fade.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = fade; g.fillRect(a, z1, b - a, 14);
    g.globalCompositeOperation = 'source-over';
  }
  // ---- 吊臂：一根粗铁管从台面上立起来，往台阶外面弯过去（像一根弯脖子的路灯），管头吊着一只滑车，绳子从滑车下面垂下来；
  //      管脚一只绞盘，绳子的另一头顺着管子绕回来缠在上面。px 立管，top 台面，rx 滑车（绳子），arm 管头的高度，z 在哪一排；big：最高那一级上的大吊臂 ----
  function hoist(R, M, px, top, rx, arm, z, o = {}) {
    // back：立管和绞盘往里挪多少（挂着能爬的绳子的那几根：立管站在主角走的那条线后面，管子一边往外弯一边往前伸，滑车正好吊在主角面前）
    const g = grp(R, 0, 0, z), side = Math.sign(rx - px), k = o.big ? 1.4 : 1, rad = 0.065 * k, Rc = 0.62 * k, tip = rx + side * 0.07, bz = -(o.back ?? 0), pts = [];
    for (let y = top; y < arm - Rc - 0.01; y += 0.15) pts.push([px, y, bz]);
    const n0 = pts.length;
    for (let i = 0; i <= 10; i++) { const t = i / 10 * Math.PI / 2; pts.push([px + side * Rc * (1 - Math.cos(t)), arm - Rc + Rc * Math.sin(t), 0]); }
    for (let x = px + side * (Rc + 0.15); side * (tip - x) > 0.05; x += side * 0.15) pts.push([x, arm, 0]);
    pts.push([tip, arm, 0]);
    const L = pts.length - n0; for (let i = n0; i < pts.length; i++) pts[i][2] = bz * (1 - sstep(0, 1, (i - n0) / (L - 1)));   // 弯过去的那一段从后面慢慢伸到前面
    const pipe = (r, mat) => add(g, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(([x, y, zz]) => V3(x, y, zz)), false, 'catmullrom', 0.1), pts.length * 3, r, 8), mat);
    pipe(rad, M.steel);
    add(g, new THREE.SphereGeometry(rad * 1.05, 10, 8), M.steel, tip, arm, 0);
    add(g, cy(rad * 2.5, rad * 2.8, 0.06, 14), M.dark, px, top + 0.03, bz);                // 底座的法兰
    add(g, cy(rad * 1.3, rad * 1.3, 0.34, 12), M.dark, px, top + 0.22, bz);
    const bk = grp(g, rx, arm - rad, 0);                                                   // 滑车：一只吊钩挂着两片夹板，中间一只轮子
    add(bk, cy(0.012, 0.012, 0.09, 5), M.dark, 0, -0.045, 0);
    add(bk, new THREE.TorusGeometry(0.034, 0.01, 5, 12), M.dark, 0, -0.11, 0);
    add(bk, bx(0.11, 0.2, 0.1), M.dark, 0, -0.24, 0);
    const wh = add(bk, cy(0.085, 0.085, 0.05, 14), M.rust, 0, -0.23, 0); wh.rotation.x = Math.PI / 2;
    const dx = px - side * 0.36, dz = bz - (o.back ? 0.25 : 0), drum = add(g, cy(0.11, 0.11, 0.34, 12), M.rust2, dx, top + 0.34, dz); drum.rotation.x = Math.PI / 2;   // 绞盘
    for (const s of [-1, 1]) add(g, bx(0.04, 0.44, 0.05), M.dark, dx, top + 0.22, dz + s * 0.2);
    const cr = add(g, bx(0.03, 0.22, 0.03), M.dark, dx, top + 0.42, dz + 0.24); cr.rotation.z = 0.6;
    if (o.big) {                                                                          // 大吊臂：后面一根拉杆、一块配重
      const ax = px - side * 1.0, ay = top + 0.5, bx_ = px + side * Rc * 0.3, by_ = arm - Rc * 0.25, len = Math.hypot(bx_ - ax, by_ - ay);
      const st = add(g, cy(0.025, 0.025, len, 6), M.steel, (ax + bx_) / 2, (ay + by_) / 2, bz); st.rotation.z = -Math.atan2(bx_ - ax, by_ - ay);
      add(g, bx(0.6, 0.55, 0.5), M.rust2, ax, top + 0.27, bz - 0.2);
    }
    if (!o.empty) {                                                                       // 绳子的另一头：从绞盘顺着管子上去，绕过管头，进滑车
      const rp = [[dx + side * 0.05, top + 0.45, dz + 0.02], [px - side * 0.02, top + 0.9, bz + rad + 0.025], ...pts.filter(([x, y]) => y > top + 1.0).map(([x, y, zz]) => [x, y + rad + 0.02, zz + rad * 0.6]), [tip + side * 0.04, arm - 0.02, 0.02], [rx, arm - 0.16, 0]];
      tube(g, rp, 0.02, ropeMat(), rp.length * 3);
    }
    return g;
  }

  let V = null;
  function* build(R) {
    const v = { ropes: [R1, R2, R3, ...DECO.map(d => d.r).filter(Boolean)], lamp: null };
    const M = { conc: lam(0x5f6766), steel: lam(0x2b3132), rust: lam(0x5e4535), rust2: lam(0x483629), dark: lam(0x151a1b), wall: lam(0x3c4342), wood: lam(0x4b463d), wood2: lam(0x343029) };
    for (const m of Object.values(M)) m.userData.own = true;

    // ---------------- 远景：雾里一级级更大的台阶，往右上方一直升进云里；台阶的边上细细的吊臂 ----------------
    backdrop(X - 150, X + 320, -30, 120, -230, 3.2, g => {
      let x = X - 150, h = 3; const st = [];
      while (x < X + 320) { const w = rr(32, 46); st.push([x, x + w, h]); x += w; h += rr(4.5, 7.5); }
      const sil = vgrad(g, 70, 0, '#7a847e', '#6c7671');
      setInk(g, sil); poly(g, [[X - 150, -30], ...st.flatMap(([a, b, hh]) => [[a, hh], [b, hh]]), [X + 320, -30]]);
      g.fillStyle = 'rgba(214,220,212,.4)'; for (const [a, b, hh] of st) g.fillRect(a, hh - 0.5, b - a, 0.5);          // 台面的边沿着天光亮一线
      setInk(g, '#636d68');
      for (const [a, b, hh] of st) for (let xx = a + rr(1, 4); xx < b - 2; xx += rr(4, 9)) { line(g, [[xx, hh], [xx, hh + 1.6]], 0.16); line(g, [[xx - 0.1, hh + 1.6], [xx - 0.9, hh + 1.6]], 0.12); line(g, [[xx - 0.85, hh + 1.6], [xx - 0.85, hh + 0.4]], 0.05); }
      g.globalCompositeOperation = 'source-atop';                                         // 越往上越淡，钻进云里
      const cl = g.createLinearGradient(0, 34, 0, 92); cl.addColorStop(0, 'rgba(176,186,181,0)'); cl.addColorStop(1, 'rgba(176,186,181,.95)'); g.fillStyle = cl; g.fillRect(X - 150, 28, 470, 92);
      const hz = g.createLinearGradient(0, -30, 0, 6); hz.addColorStop(0, 'rgba(160,170,165,.9)'); hz.addColorStop(1, 'rgba(160,170,165,0)'); g.fillStyle = hz; g.fillRect(X - 150, -30, 470, 36);
      g.globalCompositeOperation = 'source-over';
      for (let i = 0; i < 18; i++) caveBlob(g, rr(X - 150, X + 320), rr(30, 90), rr(10, 26), '190,198,193', rr(0.12, 0.3));   // 云
    }, { fog: false, order: -2600 });
    yield;
    // ---------------- 中景：雾里几座更近的吊塔、一根烟囱、高压线 ----------------
    backdrop(X - 90, X + 220, -20, 60, -125, 5, g => {
      setInk(g, '#68736f');
      for (const [x, h, arm] of [[X - 38, 30, 16], [X + 74, 36, 20], [X + 168, 33, 14]]) {   // 格构的吊塔：细细的塔身上一道道斜撑、一条长臂、臂上垂下来的钩子
        const w = 0.9; line(g, [[x - w / 2, -2], [x - w / 2, h]], 0.14); line(g, [[x + w / 2, -2], [x + w / 2, h]], 0.14);
        for (let y = -2; y < h - 1; y += 1.4) { line(g, [[x - w / 2, y], [x + w / 2, y + 1.4]], 0.07); line(g, [[x + w / 2, y], [x - w / 2, y + 1.4]], 0.07); }
        truss(g, x - 4, x + arm, h, 0.9, 0.08); line(g, [[x, h + 4], [x - 4, h + 0.9]], 0.06); line(g, [[x, h + 4], [x + arm, h + 0.9]], 0.06); box(g, x - 0.3, h, 0.6, 4);
        line(g, [[x + arm * 0.7, h], [x + arm * 0.7, h - rr(5, 12)]], 0.05);
      }
      box(g, X + 22, -2, 1.6, 40); box(g, X + 21.8, 37, 2.0, 0.8);                          // 烟囱
      for (const [x, h] of [[X - 70, 18], [X - 5, 18], [X + 60, 18], [X + 125, 18], [X + 190, 18]]) { line(g, [[x - 2, -2], [x, h], [x + 2, -2]], 0.3); line(g, [[x - 3.5, h - 2], [x + 3.5, h - 2]], 0.25); }
      g.strokeStyle = '#68736f'; for (let x = X - 70; x < X + 190; x += 65) for (const dy of [-2, -1.2]) cable(g, x - 3.2, 18 + dy, x + 61.8, 18 + dy, 3, 0.06);
      g.globalCompositeOperation = 'source-atop';
      const hz = g.createLinearGradient(0, -20, 0, 14); hz.addColorStop(0, 'rgba(140,150,146,.95)'); hz.addColorStop(1, 'rgba(140,150,146,0)'); g.fillStyle = hz; g.fillRect(X - 90, -20, 310, 34);
      g.globalCompositeOperation = 'source-over';
    }, { fog: false, order: -2400 });
    yield;
    // ---------------- 台阶：三大块水泥，一直伸进远处的雾里 ----------------
    for (const [S, y1] of [[S1, DITCH], [S2, DITCH], [S3, 0]]) {
      const w = S.x2 - S.x1, h = S.y2 - y1;
      add(R, bx(w, h, DEEP), M.conc, (S.x1 + S.x2) / 2, y1 + h / 2, ZF - DEEP / 2);
    }
    for (const [S, y1, rows] of [[S1, -0.4, 0], [S2, DITCH, 1], [S3, -0.3, 2]]) {
      backdrop(S.x1, S.x2, y1, S.y2, ZF + 0.012, 34, g => concrete(g, S.x1, S.x2, y1, S.y2, { off: 0.3 + rows * 0.37, damp: S === S1 ? 0 : S === S2 ? WATER_Y : H2 }), { lit: true, order: 6 });
      yield;
      backdrop(-60, ZF, (S === S1 ? 0 : S === S2 ? WATER_Y - 0.3 : H2) - 0.2, S.y2, S.x1 - 0.012, 24, g => concrete(g, -60, ZF, (S === S1 ? 0 : S === S2 ? WATER_Y - 0.3 : H2) - 0.2, S.y2,
        { off: 0.2, damp: S === S1 ? 0 : S === S2 ? WATER_Y : H2, rust: [0, ...ROWS.map(([z]) => z)] }), { side: -1, lit: true, order: 5, fadeL: 20 });
      yield;
      const pud = S === S1 ? [[X + 19.5, -1.4, 1.3, 0.5], [X + 25.2, -6, 2.4, 0.8]] : S === S2 ? [[X + 41, -2.2, 1.6, 0.6], [X + 50.5, -9, 3, 1]] : [[X + 70, -3, 2, 0.7], [X + 84, -1.6, 1.4, 0.5], [X + 92, -10, 3, 1.1]];
      backdrop(S.x1, S.x2, -46, ZF, 0, 20, g => deck(g, S.x1, S.x2, -46, ZF, { puddles: pud }), { floor: S.y2 + 0.006, lit: true, order: 4 });
      yield;
    }
    // 第一级和第二级之间那道沟的右壁（朝 +x 的那面：从第二级上看得见）
    backdrop(-60, ZF, DITCH, H1, S1.x2 + 0.012, 24, g => { concrete(g, -60, ZF, DITCH, H1, { off: 0.5, damp: WATER_Y }); const d = g.createLinearGradient(0, H1, 0, DITCH); d.addColorStop(0, 'rgba(8,12,12,.25)'); d.addColorStop(1, 'rgba(8,12,12,.85)'); g.fillStyle = d; g.fillRect(-60, DITCH, 61.6, H1 - DITCH); }, { side: 1, lit: true, order: 5, fadeL: 20 });
    yield;
    // 沟往里几米，一道横着的水泥墙和一扇锈死的闸门把沟截断：往沟里看是黑的，不是一直通到远处的雾里
    {
      const zw = -9, w = S2.x1 - S1.x2;
      add(R, bx(w + 0.1, H1 - DITCH, 1.2), M.wall, (S1.x2 + S2.x1) / 2, (H1 + DITCH) / 2, zw);
      add(R, bx(w - 0.5, 2.2, 0.16), M.rust2, (S1.x2 + S2.x1) / 2, WATER_Y + 0.9, zw + 0.66);
      for (const dx of [-0.9, 0, 0.9]) add(R, bx(0.08, 2.3, 0.08), M.rust, (S1.x2 + S2.x1) / 2 + dx, WATER_Y + 0.95, zw + 0.76);
      backdrop(S1.x2, S2.x1, DITCH, H1, zw + 0.61, 30, g => { concrete(g, S1.x2, S2.x1, DITCH, H1, { damp: WATER_Y }); g.fillStyle = 'rgba(6,9,9,.55)'; g.fillRect(S1.x2, DITCH, w, H1 - DITCH); }, { lit: true, order: 5 });
    }
    // ---------------- 沟里的水：深色，映着一线天光 ----------------
    {
      const [c, g] = mkCanvas(64, 512), gr = g.createLinearGradient(0, 0, 0, 512);
      gr.addColorStop(0, '#46514f'); gr.addColorStop(0.5, '#1d2525'); gr.addColorStop(1, '#0e1414'); g.fillStyle = gr; g.fillRect(0, 0, 64, 512);
      g.fillStyle = 'rgba(150,162,158,.16)'; g.fillRect(29, 0, 6, 512);
      const wm = new THREE.MeshBasicMaterial({ map: canvasTex(c) }); wm.userData.own = true;
      const water = add(R, new THREE.PlaneGeometry(S2.x1 - S1.x2 + 0.3, DEEP + 12), wm, (S1.x2 + S2.x1) / 2, WATER_Y, ZF + 6 - (DEEP + 12) / 2, false); water.rotation.x = -Math.PI / 2;
    }
    yield;
    // ---------------- 吊臂和绳子 ----------------
    for (const [r, S, top] of NEAR) {
      const big = r === R3, arm = r.top + 0.38;
      hoist(R, M, S.x1 + (big ? 0.62 : 0.45), top, r.x, arm, 0, { big, back: big ? 0.95 : 0.75 });
    }
    for (const d of DECO) hoist(R, M, d.S.x1 + 0.45, d.top, d.rx, d.arm, d.z, { empty: !d.r });
    // 台面上的东西（都在主角走的那条线后面）：几只旧木箱、盘成一卷的绳子
    for (const [x, top, z, w, h] of [[X + 21.5, H1, -2.6, 1.1, 0.9], [X + 22.6, H1, -3.4, 0.8, 0.7], [X + 45.2, H2, -2.2, 1.2, 1.0], [X + 78, H3, -2.8, 1.1, 0.9], [X + 79.1, H3, -2.0, 0.7, 0.6]])
      { const c = mkCrate(R, { x, y1: top, w, h }, 'wood'); c.position.z = z; c.rotation.y = rr(-0.25, 0.25); c.traverse(o => { if (o.isMesh) o.material = o.material === MAT.wood ? M.wood : M.wood2; }); }
    for (const [x, top, z] of [[X + 15.6, H1, -1.1], [X + 34.4, H2, -1.3], [X + 62.3, H3, -1.4], [X + 87, H3, -3.5]]) {
      for (let i = 0; i < 4; i++) { const t = add(R, new THREE.TorusGeometry(0.26 - i * 0.035, 0.032, 6, 20), ropeMat(), x + rr(-0.03, 0.03), top + 0.035 + i * 0.05, z); t.rotation.x = Math.PI / 2; t.scale.set(1, 1.15, 1); }
    }
    yield;
    for (const r of v.ropes) { ropeReset(r); ropeMesh(R, r, { shadow: Math.abs(r.z) < 20 }); }
    for (let i = 0; i < 50; i++) for (const r of v.ropes) if (r.deco) ropeSim(r, 1 / 30);   // 垂到底下的那几根：先让它们落好、堆在地上
    for (const r of v.ropes) ropeDraw(r);
    yield;
    // 最高那一级吊车上挂着一盏旧工作灯，还亮着
    {
      const lx = S3.x1 + 0.62 - 0.32, ly = R3.top + 0.38 - 0.62, lz = -0.66, g = grp(R, lx, ly, lz);
      add(g, cy(0.008, 0.008, 0.42, 4), M.dark, 0, 0.23, 0, false);
      add(g, cy(0.06, 0.09, 0.1, 10), M.dark, 0, 0, 0);
      add(g, new THREE.SphereGeometry(0.05, 10, 8), unlit(0xffe2b4), 0, -0.07, 0, false);
      for (let a = 0; a < 6; a++) { const s = add(g, bx(0.006, 0.13, 0.006), M.dark, Math.cos(a) * 0.065, -0.1, Math.sin(a) * 0.065, false); s.rotation.z = Math.cos(a) * 0.3; }
      v.lampG = [glow(R, 0xffb066, 2.4, 0.42, lx, ly - 0.07, lz + 0.1, GLOW_SOFT), glow(R, 0xffe0b0, 0.42, 0.9, lx, ly - 0.07, lz + 0.12)];
    }
    // ---------------- 开头：身后半截塌了的墙；地上的石头、草 ----------------
    {
      add(R, bx(1.4, 2.7, 2.6), M.wall, X - 7.7, 1.35, -0.4); add(R, bx(1.4, 1.1, 2.0), M.wall, X - 7.7, 3.1, -0.9).rotation.z = 0.12;
      add(R, bx(1.3, 4.2, 2.2), M.wall, X - 8.3, 2.1, -5); for (let i = 0; i < 5; i++) add(R, cy(0.012, 0.012, rr(0.4, 0.9), 4), M.rust2, X - 7.7 + rr(-0.5, 0.5), 2.95 + rr(0, 0.6), rr(-1, 0.6), false).rotation.z = rr(-0.6, 0.6);
      for (const [x, z, s] of [[X - 4, 0.6, 0.35], [X + 1.5, -2.6, 0.5], [X + 5.6, 1.4, 0.22], [X + 8.8, -1.2, 0.3], [X + 11.6, 1.1, 0.18]]) rock(R, x, z, s, { moss: 0.2, col: 0x6e716b });
      pebbles(R, Array.from({ length: 50 }, () => [X + rr(-6, 13.6), rr(-4, 1.8), rr(0.03, 0.08)]));
      const P_ = [];
      for (let i = 0; i < 70; i++) { const x = X + rr(-6.5, 13.8), z = rr(-6, 1.8); P_.push([x, 0, z, rnd() < 0.6 ? 'dry' : 'grass', rr(0.25, 0.6), rnd() < 0.6 ? 0x6a6753 : 0x4c5540]); }
      for (const [S, top] of [[S1, H1], [S2, H2], [S3, H3]]) for (let i = 0; i < 26; i++) { const x = rr(S.x1 + 1, Math.min(S.x2, END - 1.5) - 1), z = rnd() < 0.5 ? rr(-1.2, 1.4) : rr(-12, -2); P_.push([x, top, z, 'dry', rr(0.18, 0.45), 0x66644f]); }
      plants(R, P_);
    }
    yield;
    // ---------------- 最高一级的尽头：一道矮墙、上面一道锈栏杆 ----------------
    {
      const x0 = END - 0.9; add(R, bx(0.9, 0.85, DEEP), M.conc, x0 + 0.45, H3 + 0.42, ZF - DEEP / 2);
      for (let z = ZF - 0.3; z > -40; z -= 2.2) add(R, cy(0.025, 0.025, 0.9, 6), M.rust2, x0 + 0.3, H3 + 1.3, z);
      for (const y of [H3 + 1.72, H3 + 1.3]) add(R, bx(0.05, 0.05, 42), M.rust2, x0 + 0.3, y, ZF - 21.3);
    }
    // ---------------- 前景：最近处的枯草（在地上）、斜着穿过画面上方的几根电线（在高处） ----------------
    backdrop(X - 24, X + 116, -1.5, 24, 7.5, 26, g => {
      setInk(g, '#0b0f0f');
      for (let x = X - 22; x < X + 114; x += rr(1.4, 4.5)) { const y = -0.3; for (let k = 0; k < 9; k++) blade(g, x + rr(-0.4, 0.4), y, rr(0.5, 1.4), rr(-0.4, 0.4), 0.04); }
      g.strokeStyle = '#0b0f0f'; cable(g, X + 44, 24.5, X + 92, 20.5, 1.6, 0.045);
    }, { fog: false, blur: 2.4, blurOnce: true, order: 4000, fadeL: 6, fadeR: 6 });
    // ---------------- 雾：贴着地面、沟里、台阶脚下的一层低雾 ----------------
    backdrop(X - 40, X + 160, -3, 5, -26, 8, g => {
      for (let i = 0; i < 40; i++) caveBlob(g, rr(X - 40, X + 160), rr(-1, 2.2), rr(3, 9), '178,188,184', rr(0.15, 0.35));
    }, { fog: false, order: -900, fadeL: 10, fadeR: 10, opacity: 0.8 });
    yield;
    V = v;
  }
  function update(dt) {
    if (!V) return;
    stepRopes(V.ropes, dt);
    const f = 0.9 + 0.1 * Math.sin(T * 13) * Math.sin(T * 5.3);                       // 旧灯泡：微微地抖
    for (const s of V.lampG) s.material.opacity = s.userData.a0 * f;
  }
  function reset() { for (const r of [R1, R2, R3]) ropeReset(r); }
  return defZone({ n: OLD + 10, vis: [X - 10, END + 4], build: function* (R) { yield* build(R); for (const s of V.lampG) s.userData.a0 = s.material.opacity; }, update, reset, solve() {},
    unbuild() { V = null; }, R1, R2, R3, S1, S2, S3, DECO, NEAR });
})();
