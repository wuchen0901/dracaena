// ============================================================
//  第 31 章 · 漏液（工厂深处之七）
//  一条低矮的走廊，头顶的管道一路往下滴绿色的药水。落到地上冒一股白烟，地面上留下一圈一圈的蚀痕 ——
//  蚀痕就是“前面有人没躲过”的痕迹，只讲结果不讲原因。
//  玩法：看准节奏穿过去。每个漏点先在管子底下鼓出一滴（越鼓越大），然后落下来；有几处是一股一股往下浇的，浇一阵、停一阵。
//  被浇到、滴到就回到存档点。快到头的时候，身后一整段管子爆开，药水哗地浇下来 —— 别回头
// ============================================================
const H7 = (() => {
  const k = 6, X = hX(k), LEN = 60, CEIL_Y = 4;
  hChapter(k, { name: '漏液', sub: '看准了再走', ground: 'concrete', len: LEN, tint: 0x0c140c });
  terrain([X - 14, 0], [X + LEN + 4, 0]);
  ground(X - 14, 0x1e221d); ground(X + LEN + 4, 0x1c201b);
  hCut(X - 14, X + LEN + 4);
  ceiling([X - 14, CEIL_Y], [X + LEN + 4, CEIL_Y]);
  checkpoint(X + 2); checkpoint(X + 21.2); checkpoint(X + 34);
  camKeys([X - 14, 15, 1.4, 1, 0.6], [X + LEN + 4, 15, 1.4, 1, 0.6]);
  hEnv(k, { fog: 0x0b100b, fogD: 0.032, hemiS: 0x6a7a68, hemiG: 0x0a0f0a, hemiI: 0.42, keyC: 0xb8d8b0, keyI: 0.15, rimC: 0x9cff7a, rimI: 0.35, dustC: 0xb6f0a0, dustO: 0.25, aDrip: 1, aRoom: 0.6, roomF: 140 }, LEN);
  FAR[HN(k)] = ['drip', 'steam', 'knock', 'drip'];
  // 漏点：d 一滴一滴（p 周期，ph 错开）/ s 一股一股浇（on 浇多久，off 停多久）
  const LEAK = [
    { x: 8, d: 1, p: 1.6, ph: 0 }, { x: 11, d: 1, p: 1.1, ph: 0.4 },
    { x: 14.5, s: 1, on: 1.6, off: 2.4, ph: 0 },
    { x: 18, d: 1, p: 0.95, ph: 0.2 }, { x: 19.7, d: 1, p: 1.3, ph: 0.9 },
    { x: 24, s: 1, on: 2.0, off: 2.0, ph: 1 },
    { x: 27, d: 1, p: 0.85, ph: 0.3 },
    { x: 30, s: 1, on: 1.4, off: 2.6, ph: 2.0 }, { x: 31.8, d: 1, p: 1.2, ph: 0.6 },
  ].map(o => ({ ...o, x: X + o.x }));
  const TOP = CEIL_Y - 0.55, G_ = 9.8, TF = Math.sqrt(2 * TOP / G_);         // 一滴从管子底下落到地上要多久
  const S = { t: 0, burst: 0 };
  const BURST_X = X + 36.5;
  const dropsOf = L => { const out = [], u = S.t + L.ph, kk = Math.floor(u / L.p); for (let j = 0; j < 3; j++) { const age = u - (kk - j) * L.p; if (age >= 0 && age < TF) out.push(TOP - 0.5 * G_ * age * age); } return out; };
  const swell = L => ((S.t + L.ph) % L.p) / L.p;                                // 这一滴鼓到多大了（0 刚落下去，1 马上要落）
  const pouring = L => ((S.t + L.ph) % (L.on + L.off)) < L.on;
  const soon = L => { const u = (S.t + L.ph) % (L.on + L.off); return u > L.on + L.off - 0.6; };
  hint(() => P.x > X + 2 && P.x < X + 7, '药水从管子上往下滴。看准了再走');
  hint(() => S.burst > 0 && S.burst < 3 && P.x > BURST_X, '别回头');

  let V = null;
  function* build(R) {
    const v = {};
    hHall(X, LEN, { far: '#0e120e', win: '#141c14', mid: '#0a0d0a', near: '#050705' }, { cols: [X + 4, X + 44], fore: [X + 10, X + 30, X + 50], beam: false, top: 8 });
    hCutFace(R, X - 14, X + LEN + 4, 0);
    yield;
    const tile = lam(0x2c332c), tile2 = lam(0x262c26);
    add(R, bx(LEN + 18, CEIL_Y + 0.5, 0.3), tile, X + LEN / 2 - 5, (CEIL_Y + 0.5) / 2, -2.6);                    // 后墙
    for (let x = X - 14; x < X + LEN + 4; x += 1.2) add(R, bx(0.02, CEIL_Y, 0.02), MAT.dark, x, CEIL_Y / 2, -2.44, false);
    add(R, bx(LEN + 18, 0.02, 0.02), MAT.dark, X + LEN / 2 - 5, 1.2, -2.44, false);
    add(R, bx(LEN + 18, 0.4, 4.6), tile2, X + LEN / 2 - 5, CEIL_Y + 0.2, -0.4);                                   // 顶
    for (const [z, r] of [[0, 0.16], [-0.8, 0.22], [-1.7, 0.12]]) pipe(R, X - 14, CEIL_Y - 0.35 - r * 0.5, X + LEN + 4, CEIL_Y - 0.35 - r * 0.5, z, r, z === 0 ? lam(0x3a4038) : MAT.steel);
    for (let x = X - 10; x < X + LEN; x += 4.5) add(R, bx(0.1, 0.5, 2.2), MAT.dark, x, CEIL_Y - 0.3, -0.7, false);   // 管卡
    yield;
    // 每个漏点：管子上一块锈出来的斑，底下鼓着的一滴，往下落的几滴（或者一股），地上一圈蚀痕和一股烟
    const dm = new THREE.SpriteMaterial({ map: GLOW, color: 0xb8ff6a, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
    const sm = new THREE.MeshBasicMaterial({ color: 0x8cf04a, transparent: true, opacity: 0.75 }); sm.userData.own = true;
    v.leaks = LEAK.map(L => {
      const o = { L };
      add(R, cy(0.2, 0.2, 0.06, 10), lam(0x6a5a2a), L.x, TOP + 0.12, 0, false).rotation.x = Math.PI / 2;
      o.bead = new THREE.Sprite(dm.clone()); o.bead.position.set(L.x, TOP, 0.05); R.add(o.bead);
      o.drops = [0, 1, 2].map(() => { const s = new THREE.Sprite(dm.clone()); s.scale.set(0.14, 0.26, 1); R.add(s); return s; });
      if (L.s) { o.col = add(R, bx(0.22, 1, 0.22), sm, L.x, 0, 0, false); o.col.visible = false; }
      decal(R, L.x - 1.2, L.x + 1.2, -1.2, 1.2, 0, 60, g => {
        for (let i = 0; i < 4; i++) { g.strokeStyle = `rgba(20,26,12,${0.5 - i * 0.1})`; g.lineWidth = 0.06; g.beginPath(); g.ellipse(L.x + rr(-0.1, 0.1), rr(-0.1, 0.1), 0.25 + i * 0.22, 0.2 + i * 0.2, rr(0, 3), 0, 6.283); g.stroke(); }
        g.fillStyle = 'rgba(30,40,14,.65)'; g.beginPath(); g.ellipse(L.x, 0, 0.3, 0.26, 0, 0, 6.283); g.fill();
      });
      o.smoke = glow(R, 0xd8e0d0, 1.4, 0, L.x, 0.4, 0.1, GLOW_SOFT); o.smoke.material.blending = THREE.NormalBlending; o.hiss = 0;
      return o;
    });
    // 快到头的那一段管子：爆开以后哗地浇下来
    v.burst = add(R, bx(1.4, 1, 1.2), sm, BURST_X, 0, 0, false); v.burst.visible = false;
    v.burstS = glow(R, 0xd8e0d0, 4, 0, BURST_X, 0.8, 0.2, GLOW_SOFT); v.burstS.material.blending = THREE.NormalBlending;
    // 地上：一只倒着的鞋、一件烧穿的灰色工服，扔在蚀痕边上
    add(R, bx(1.0, 0.04, 0.6), lam(0x5d6362), X + 27.6, 0.02, -0.9, false).rotation.y = 0.4;
    add(R, bx(0.26, 0.1, 0.1), lam(0x2b2d2f), X + 18.8, 0.05, 0.5, false).rotation.y = 1.1;
    V = v;
  }
  function update(dt) {
    const play = state === 'play';
    S.t += dt;
    let hit = false;
    const body = (x, w) => Math.abs(P.x - x) < w;
    for (const L of LEAK) {
      if (L.d) { for (const y of dropsOf(L)) if (body(L.x, 0.26) && y > P.y + 0.1 && y < P.y + P.H) hit = true; }
      else if (pouring(L) && body(L.x, 0.38) && P.y < TOP) hit = true;
    }
    if (!S.burst && P.x > BURST_X + 1.5 && play) { S.burst = 1e-3; fx('shatter', 0.6); fx('rush', 1.2); fx('hiss', 1.2); }
    if (S.burst) { S.burst += dt; if (S.burst < 6 && body(BURST_X, 0.9)) hit = true; }   // 浇六秒，然后只剩滴答
    if (hit && play) { fx('burn'); fx('hiss'); caughtNow('fall'); }
    const v = V; if (!v) return;
    for (const o of v.leaks) {
      const L = o.L;
      if (L.d) {
        const sw = swell(L); o.bead.scale.setScalar(0.08 + 0.14 * sw); o.bead.material.opacity = 0.9;
        const ys = dropsOf(L); o.drops.forEach((s, i) => { s.visible = i < ys.length; if (s.visible) s.position.set(L.x, ys[i], 0.05); });
        const age = (S.t + L.ph) % L.p; if (age > TF && age - dt <= TF && Math.abs(L.x - P.x) < 10) { o.hiss = 1; if (Math.random() < 0.5) fx('hiss', 0.25); }
      } else {
        const on = pouring(L), pre = soon(L); o.col.visible = on || pre;
        o.col.scale.set(on ? 1 : 0.25, TOP, on ? 1 : 0.25); o.col.position.y = TOP / 2;
        o.bead.scale.setScalar(on ? 0.4 : 0.15 + (pre ? 0.15 : 0)); if (on) o.hiss = 1;
        o.drops.forEach(s => { s.visible = false; });
      }
      o.hiss = Math.max(0, o.hiss - dt * 0.8); o.smoke.material.opacity = 0.18 * o.hiss + 0.04; o.smoke.position.y = 0.4 + 0.6 * (1 - o.hiss);
    }
    const b = S.burst; v.burst.visible = b > 0 && b < 6.5; if (b) { v.burst.scale.set(1 + 0.1 * Math.sin(T * 20), TOP, 1); v.burst.position.y = TOP / 2; v.burstS.material.opacity = 0.3; }
  }
  function reset() { S.t = 0; S.burst = 0; }
  return defZone({ n: HN(k), vis: [X - 14, X + LEN + 4], build, update, reset, solve() { S.burst = 9; }, unbuild() { V = null; }, respawn() { if (S.burst < 6) S.burst = 0; }, LEAK, S, dropsOf, pouring, TF });
})();
