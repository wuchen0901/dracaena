
// ============================================================
//  主角脚边的东西（二）：会动的那些 —— 老鼠、蚂蚱、被跑过去带起来的纸片和叶子、被踢开的易拉罐
//  都挂进 groundLife()（46-ground.js）里，跟着章节每帧推进；calm = true 时都不动（出效果图用）
// ============================================================

// ---- 老鼠：蹲在箱子边、墙根下，嗅来嗅去；主角走到 flee 米以内，就沿着 path（[x, z] 一串点）窜过去，到最后一个点钻进去不见了；
// 主角走远了再出来。模型面朝 +x，比真的老鼠大一点（这么远看过去，真的老鼠只有十来个像素）
function mkRat(parent, L, x, z, path, o = {}) {
  const c = o.col ?? 0x5a504a, fur = lam(c, { emissive: c, emissiveIntensity: o.glow ?? 0.18 }), pink = lam(0x8a6a64, { emissive: 0x8a6a64, emissiveIntensity: 0.15 });
  const sph = (r, a = 8, b = 6) => new THREE.SphereGeometry(r, a, b);
  const g = grp(parent, x, groundY(x), z), body = grp(g, 0, 0, 0); g.scale.setScalar(o.s ?? 1.5);
  add(body, sph(0.055), fur, 0, 0.05, 0, false).scale.set(1.9, 0.8, 0.95);
  add(body, sph(0.05), fur, -0.045, 0.054, 0, false).scale.set(1.2, 0.95, 1.05);
  const head = grp(body, 0.1, 0.05, 0);
  add(head, new THREE.ConeGeometry(0.032, 0.09, 8), fur, 0.03, 0, 0, false).rotation.z = -Math.PI / 2;
  for (const sz of [-1, 1]) add(head, sph(0.017, 6, 4), pink, 0.0, 0.032, sz * 0.022, false).scale.set(0.45, 1, 1);
  const tail = add(body, new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V3(-0.1, 0.04, 0), V3(-0.2, 0.02, 0.02), V3(-0.3, 0.012, 0.0), V3(-0.38, 0.01, -0.03)]), 8, 0.0065, 4), pink, 0, 0, 0, false);
  const legs = []; for (const sx of [-1, 1]) for (const sz of [-1, 1]) legs.push(add(body, bx(0.014, 0.03, 0.014), fur, sx * 0.055, 0.015, sz * 0.03, false));
  const pts = path.map(([px, pz]) => [px, pz]);
  const R = { x, z, yaw: o.yaw ?? (rnd() < 0.5 ? 0 : Math.PI), st: 'idle', t: 0, away: 0, k: 1, seg: 0, pause: 0, tx: x, tz: z, flee: o.flee ?? 3.2, sp: o.speed ?? 3.6, home: [x, z] };
  R.reset = () => { R.x = R.tx = x; R.z = R.tz = z; R.yaw = o.yaw ?? R.yaw; R.st = 'idle'; R.t = 0; R.k = 1; R.seg = 0; R.away = 0; g.visible = true; };
  R.step = dt => {
    R.t += dt;
    if (R.st === 'gone') { R.away = Math.abs(P.x - x) > 11 ? R.away + dt : 0; if (R.away > 5) R.reset(); return; }
    let run = 0;
    if (R.st === 'idle') {
      if (!L.calm && heroNear(x, R.flee)) { R.st = 'flee'; R.t = 0; R.seg = 0; if (o.sound !== false) fx('skitter'); }
      else {                                                // 嗅一嗅、挪两步、转个身
        R.pause -= dt; const dx = R.tx - R.x, dz = R.tz - R.z, d = Math.hypot(dx, dz);
        if (d < 0.01) { if (R.pause < 0 && !L.calm) { R.tx = x + L.rr(-0.25, 0.25); R.tz = z + L.rr(-0.08, 0.08); R.pause = L.rr(0.6, 3); } }
        else { const st = Math.min(d, 0.5 * dt); R.x += dx / d * st; R.z += dz / d * st; R.yaw += wrapPi(Math.atan2(-dz, dx) - R.yaw) * (1 - Math.exp(-10 * dt)); run = 0.4; }
        head.rotation.z = L.calm ? 0 : Math.sin(R.t * 13) * 0.08 * (Math.sin(R.t * 1.3) > 0.2 ? 1 : 0);
      }
    }
    if (R.st === 'flee') {
      const [tx, tz] = pts[Math.min(R.seg, pts.length - 1)], dx = tx - R.x, dz = tz - R.z, d = Math.hypot(dx, dz), st = R.sp * dt;
      if (d <= st) { R.x = tx; R.z = tz; R.seg++; if (R.seg >= pts.length) R.st = 'hide'; }
      else { R.x += dx / d * st; R.z += dz / d * st; R.yaw += wrapPi(Math.atan2(-dz, dx) - R.yaw) * (1 - Math.exp(-25 * dt)); }
      run = 1;
    }
    if (R.st === 'hide') { R.k = Math.max(0, R.k - dt * 7); if (R.k <= 0) { R.st = 'gone'; R.away = 0; g.visible = false; } }
    const bob = run ? Math.abs(Math.sin(R.t * 26)) * 0.012 * run : 0;
    g.position.set(R.x, groundY(R.x) + bob, R.z); g.rotation.y = R.yaw; g.scale.setScalar((o.s ?? 1.5) * Math.max(0.02, R.k));
    for (let i = 0; i < 4; i++) legs[i].scale.y = run ? 0.5 + 0.5 * Math.abs(Math.sin(R.t * 26 + i * 1.6)) : 1;
    tail.rotation.y = Math.sin(R.t * (run ? 18 : 2)) * (run ? 0.25 : 0.08);
  };
  R.reset(); R.step(0); return L.add(R);
}

// ---- 蚂蚱 / 蟋蟀：趴在地上不动，主角走近就一蹦老远，落下来要是还近就再蹦；走远了回到原处 ----
// list: [x, z]；o.col 颜色（枯草里是黄褐的，山洞里是灰白的）
function mkHoppers(parent, L, list, o = {}) {
  const c = o.col ?? 0x8a7a48, m = lam(c, { emissive: c, emissiveIntensity: o.glow ?? 0.2 }), s = o.s ?? 2.4;
  const items = list.map(([x, z]) => {
    const g = grp(parent, x, groundY(x), z); g.scale.setScalar(s);
    add(g, bx(0.05, 0.014, 0.013), m, 0, 0.012, 0, false); add(g, bx(0.016, 0.016, 0.014), m, 0.03, 0.014, 0, false);
    for (const sz of [-1, 1]) { const leg = add(g, bx(0.035, 0.005, 0.004), m, -0.008, 0.02, sz * 0.009, false); leg.rotation.z = 0.7; }
    return { g, hx: x, hz: z, x, z, y: 0, vx: 0, vy: 0, vz: 0, air: false, yaw: L.rr(0, 6.28), cool: 0 };
  });
  const H = { st: 'idle', away: 0, items };
  H.reset = () => { H.away = 0; for (const h of items) { h.x = h.hx; h.z = h.hz; h.air = false; h.cool = 0; h.g.visible = true; } };
  H.step = dt => {
    let far = true;
    for (const h of items) {
      if (Math.abs(P.x - h.x) < 11) far = false;
      h.cool -= dt;
      if (!h.air && !L.calm && h.cool < 0 && heroNear(h.x, o.flee ?? 1.7) && Math.abs(h.z) < 2.5) {
        const dir = Math.sign(h.x - P.x) || 1, dist = L.rr(0.7, 1.5), T = L.rr(0.32, 0.45);
        h.vx = dir * dist / T; h.vz = L.rr(-0.6, 0.6); h.vy = 4.9 * T * L.rr(0.9, 1.2); h.air = true; h.yaw = dir > 0 ? 0 : Math.PI; h.cool = L.rr(0.1, 0.3);
      }
      if (h.air) {
        h.x += h.vx * dt; h.z += h.vz * dt; h.vy -= 9.8 * dt; h.y += h.vy * dt;
        if (h.y <= 0 && h.vy < 0) { h.y = 0; h.air = false; }
      }
      h.g.position.set(h.x, groundY(h.x) + Math.max(0, h.y), h.z); h.g.rotation.y = h.yaw; h.g.rotation.z = h.air ? clamp(h.vy * 0.12, -0.5, 0.5) : 0;
    }
    H.away = far ? H.away + dt : 0; if (H.away > 5) H.reset();
  };
  H.reset(); return L.add(H);
}

// ---- 地上的纸片、塑料袋、落叶、花瓣：主角跑过去带起来的风把它们掀起来，翻几个跟头，再落回地上（落在新的地方）----
// list: [x, z, 种类]；种类：paper 纸 / card 小块纸板 / bag 塑料袋 / leaf 叶子 / petal 花瓣 / clip 草屑
// 只有跑起来才掀得动（慢慢走过去它们不动）；风大的地方（E.wind）飞得远一点
const LOOSE_KINDS = {
  paper: { w: 0.21, d: 0.28, col: 0xd9d6cb, lift: 1, drag: 2.2 }, card: { w: 0.3, d: 0.22, col: 0x8f7a5a, lift: 0.55, drag: 1.6 },
  bag: { w: 0.32, d: 0.3, col: 0xc9cfcd, lift: 1.5, drag: 2.8 }, leaf: { w: 0.09, d: 0.13, col: 0x9a6a30, lift: 1.1, drag: 3 },
  petal: { w: 0.05, d: 0.06, col: 0xe8a6b4, lift: 1.2, drag: 3.4 }, clip: { w: 0.03, d: 0.12, col: 0x7fa04a, lift: 1, drag: 3.2 },
};
function mkLoose(parent, L, list, o = {}) {
  const mats = {}, items = list.map(([x, z, kind, col]) => {
    const K = LOOSE_KINDS[kind], key = kind + (col ?? '');
    const mat = mats[key] ??= lam(col ?? K.col, { side: THREE.DoubleSide, emissive: col ?? K.col, emissiveIntensity: o.glow ?? 0.1 });
    const geo = new THREE.PlaneGeometry(K.w * (o.s ?? 1), K.d * (o.s ?? 1), 2, 2), p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) p.setZ(i, (Math.abs(p.getX(i)) > 0.01 ? 0.02 : 0) * (kind === 'bag' ? 3 : 1) * (o.s ?? 1) + (Math.abs(p.getY(i)) > 0.01 ? 0.008 : 0));   // 边角翘起来一点
    geo.computeVertexNormals();
    const m = add(parent, geo, mat, x, groundY(x) + 0.004, z, false); m.receiveShadow = true;
    return { m, K, hx: x, hz: z, x, z, y: 0, v: V3(), spin: V3(), air: false, yaw: L.rr(0, 6.28), t: L.rr(0, 9) };
  });
  const lay = it => { it.m.rotation.set(-Math.PI / 2, 0, it.yaw); it.m.position.set(it.x, groundY(it.x) + 0.004, it.z); };
  const S = { st: 'idle', items };
  S.reset = () => { for (const it of items) { it.x = it.hx; it.z = it.hz; it.air = false; it.y = 0; lay(it); } };
  S.step = dt => {
    const sp = Math.abs(P.vx);
    for (const it of items) {
      it.t += dt;
      if (!it.air && !L.calm && sp > (o.minSpeed ?? 2.2) && state === 'play' && Math.abs(P.x - it.x) < 0.75 && Math.abs(it.z) < 1.3 && P.y - groundY(P.x) < 0.6) {
        const k = it.K.lift * clamp(sp / 3.3, 0.5, 1.2);
        it.air = true; it.y = 0.01; it.v.set(P.vx * L.rr(0.35, 0.75), L.rr(0.9, 1.9) * k, L.rr(-0.5, 0.5)); it.spin.set(L.rr(-9, 9), L.rr(-6, 6), L.rr(-9, 9));
      }
      if (!it.air) continue;
      const dr = Math.exp(-it.K.drag * dt);
      it.v.x = it.v.x * dr + (E.wind ?? 0) * 0.8 * dt; it.v.z *= dr; it.v.y = it.v.y * Math.exp(-it.K.drag * 0.5 * dt) - 3.2 * dt;
      it.x += it.v.x * dt + Math.sin(it.t * 7) * 0.25 * dt; it.z += it.v.z * dt; it.y += it.v.y * dt;
      it.m.rotation.x += it.spin.x * dt; it.m.rotation.y += it.spin.y * dt; it.m.rotation.z += it.spin.z * dt; it.spin.multiplyScalar(Math.exp(-0.8 * dt));
      if (it.y <= 0 && it.v.y < 0) { it.air = false; it.y = 0; it.yaw = L.rr(0, 6.28); lay(it); continue; }
      it.m.position.set(it.x, groundY(it.x) + 0.004 + it.y, it.z);
    }
  };
  S.reset(); return L.add(S);
}

// ---- 易拉罐 / 小瓶子：横躺在主角走的那条线上，被脚碰到就骨碌碌滚出去，慢慢停下 ----
// list: [x, z, 种类]；种类：can 易拉罐 / tin 罐头盒 / bottle 小玻璃瓶。lo、hi：滚到哪里为止（别滚进机关里）
function mkCans(parent, L, list, o = {}) {
  const items = list.map(([x, z, kind, col]) => {
    const g = grp(parent, x, 0, z), s = o.s ?? 1.5, c = col ?? (kind === 'bottle' ? 0x4a6a58 : kind === 'tin' ? 0x8a8a80 : 0xa04a3a), m = lam(c, { emissive: c, emissiveIntensity: 0.12 });
    const r = (kind === 'tin' ? 0.042 : kind === 'bottle' ? 0.03 : 0.033) * s, h = (kind === 'tin' ? 0.09 : kind === 'bottle' ? 0.2 : 0.12) * s;
    const body = add(g, cy(r, r, h, 12), m, 0, r, 0); body.rotation.x = Math.PI / 2;
    if (kind === 'bottle') add(body, cy(r * 0.4, r * 0.7, h * 0.35, 8), m, 0, h * 0.6, 0);
    else add(body, cy(r * 0.95, r * 0.95, h * 0.08, 12), lam(0xb8bab4), 0, h * 0.5, 0, false);
    return { g, body, r, hx: x, x, vx: 0, rot: L.rr(0, 6.28), still: true };
  });
  const S = { st: 'idle', items };
  S.reset = () => { for (const it of items) { it.x = it.hx; it.vx = 0; it.still = true; it.g.position.set(it.x, groundY(it.x), it.g.position.z); } };
  S.step = dt => {
    for (const it of items) {
      const foot = P.x + P.facing * 0.12;
      if (!L.calm && state === 'play' && P.grounded && Math.abs(P.vx) > 0.4 && Math.abs(foot - it.x) < 0.16 && Math.abs(it.g.position.z) < 0.35 && Math.sign(it.x - P.x) === Math.sign(P.vx)) {
        it.vx = P.vx * L.rr(1.15, 1.6) + Math.sign(P.vx) * 0.4; it.still = false;
      }
      if (it.still) continue;
      it.x += it.vx * dt; it.vx *= Math.exp(-1.1 * dt); if (Math.abs(it.vx) < 0.08) { it.vx = 0; it.still = true; }
      if (o.lo !== undefined && it.x < o.lo) { it.x = o.lo; it.vx = Math.abs(it.vx) * 0.3; }
      if (o.hi !== undefined && it.x > o.hi) { it.x = o.hi; it.vx = -Math.abs(it.vx) * 0.3; }
      it.rot -= it.vx / it.r * dt; it.g.position.x = it.x; it.g.position.y = groundY(it.x); it.g.rotation.z = it.rot;
    }
  };
  S.reset(); return L.add(S);
}
