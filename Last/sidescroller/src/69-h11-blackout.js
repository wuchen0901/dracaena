// ============================================================
//  第 35 章 · 停电的车间（工厂深处之十一）
//  整个车间停了电，只剩几盏转着的橙色警示灯。劳动者还站在黑暗里，一动不动 ——
//  可是灯每转过来一圈，他们的姿势都和上一圈不一样，离路也近了一点。
//  玩法：地上缺了几块铁板，底下是黑洞，只有警示灯的光扫过去的那一下看得见。看准了洞在哪，在黑里跳过去。
//  掉下去就回到存档点。劳动者不会碰你，只是看着你
// ============================================================
const H11 = (() => {
  const k = 10, X = hX(k), LEN = 64;
  hChapter(k, { name: '停电', sub: '灯转过来的时候看', ground: 'metal', len: LEN, tint: 0x040302 });
  const HOLES = [[11.2, 12.8], [17.6, 19.2], [27.4, 29.0], [33.0, 34.4], [40.6, 42.2], [46.4, 48.0]].map(([a, b]) => [X + a, X + b]);
  const tp = [[X - 14, 0]]; for (const [a, b] of HOLES) tp.push([a, 0], [a + 0.02, -5], [b - 0.02, -5], [b, 0]); tp.push([X + LEN + 4, 0]);
  terrain(...tp);
  ground(X - 14, 0x1c1a18); ground(X + LEN + 4, 0x1a1816);
  for (const [a, b] of HOLES) { groundFront(a, b, null); pit({ x1: a, x2: b, y: -0.6 }); }
  hCut(X - 14, X + LEN + 4);
  checkpoint(X + 2); checkpoint(X + 23); checkpoint(X + 38);
  camKeys([X - 14, 15.5, 1.5, 1, 0.8], [X + LEN + 4, 15.5, 1.5, 1, 0.8]);
  hEnv(k, { fog: 0x030202, fogD: 0.05, hemiS: 0x40342a, hemiG: 0x020101, hemiI: 0.1, keyC: 0xffa060, keyI: 0.0, rimC: 0xff8a40, rimI: 0.05, dustC: 0xffb070, dustO: 0.25, aRoom: 0.5, roomF: 60, aHum: 0, aDrip: 0.3, vig: 1.3 }, LEN);
  FAR[HN(k)] = ['relay', 'creak', 'knock', 'drip'];
  // 警示灯：杆子顶上一盏，光沿着一个圆扫地面（圆心在路后面一点），转一圈 3.2 秒
  const BEA = [8, 24, 40, 56].map((dx, i) => ({ x: X + dx, z: -2.2, y: 4.3, r: 5.6, ph: i * 1.7, w: 2 * Math.PI / 3.2,
    L: spotLight({ p: [X + dx, 4.3, -2.2], t: [X + dx, 0, 0], c: 0xff8a2a, i: 34, a: 0.5, d: 14, pen: 0.3 }) }));
  const beaAng = b => b.ph + b.w * T;
  const spotOf = b => { const a = beaAng(b); return [b.x + b.r * Math.cos(a), b.z + b.r * Math.sin(a)]; };
  const litAt = (x, z, rad = 2.6) => BEA.some(b => { const [sx, sz] = spotOf(b); return Math.hypot(sx - x, sz - z) < rad; });
  hint(() => P.x > X + 2 && P.x < X + 9, '地上有洞。灯扫过去的时候看清楚');

  let V = null;
  function* build(R) {
    const v = {};
    hHall(X, LEN, { far: '#0a0806', win: '#120d08', mid: '#070504', near: '#030202' }, { cols: [X + 4, X + 30, X + 58], fore: [X + 14, X + 46] });
    hCutFace(R, X - 14, X + LEN + 4, 0);
    yield;
    // 地面的铁板：一块块拼起来（洞的地方空着），洞底下黑的
    const pm = lam(0x4a423a);
    let x0 = X - 14;
    for (const [a, b] of [...HOLES, [X + LEN + 4, X + LEN + 4]]) { for (let x = x0; x < a - 0.01; x += 1.6) add(R, bx(Math.min(1.58, a - x), 0.04, 3.6), pm, x + Math.min(1.58, a - x) / 2, 0.02, -0.2); x0 = b; }
    for (const [a, b] of HOLES) { add(R, bx(b - a, 5, 3.6), MAT.black, (a + b) / 2, -2.6, -0.2, false); add(R, bx(0.08, 0.15, 3.6), lam(0x5a4030), a, -0.05, -0.2); add(R, bx(0.08, 0.15, 3.6), lam(0x5a4030), b, -0.05, -0.2); }
    // 机床：一排一排的黑块
    for (let x = X - 8; x < X + LEN; x += rr(4, 7)) add(R, bx(rr(1.4, 2.6), rr(1.0, 1.8), 1.4), lam(0x22201d), x, 0.6, rr(-7.5, -4.5));
    yield;
    v.bea = BEA.map(b => {
      add(R, cy(0.08, 0.1, b.y, 6), MAT.dark, b.x, b.y / 2, b.z);
      const lamp = add(R, cy(0.22, 0.26, 0.35, 10), new THREE.MeshBasicMaterial({ color: 0xff7a20 }), b.x, b.y + 0.15, b.z, false);
      const cone = mkCone(R, 0.5, { c: 0xff8a2a, op: 0.12 }), gl = glow(R, 0xff8a2a, 2.4, 0.6, b.x, b.y + 0.15, b.z + 0.3, GLOW_SOFT);
      return { lamp, cone, gl };
    });
    // 劳动者：站在黑暗里，每被光扫过一次换一个样子，往路这边挪一点
    v.crowd = mkCrowd(R, 14);
    v.men = [];
    for (let i = 0; i < 12; i++) {
      const x = X + 6 + i * 4.6 + rr(-1, 1), z = rr(-6.5, -3.5), f = v.crowd.add(fig('gray', x, { z, act: 'stand', face: rnd() < 0.5 ? 1 : -1 }));
      v.men.push({ f, z0: z, lit: false, n: 0 });
    }
    v.crowd.addAll([]);
    V = v;
  }
  const POSES = ['stand', 'hunch', 'point', 'stand', 'lean', 'reach'];
  function update(dt) {
    HERO_RIM.uRimK.value = 0.22;                         // 黑里也留一道轮廓
    for (const b of BEA) { const [sx, sz] = spotOf(b); b.L.t[0] = sx; b.L.t[2] = sz; }
    const v = V; if (!v) return;
    BEA.forEach((b, i) => {
      const o = v.bea[i], [sx, sz] = spotOf(b), a = beaAng(b), face = Math.max(0, Math.sin(a));   // 朝着镜头这边的时候亮得刺眼
      o.cone.aim(b.x, b.y + 0.1, b.z, sx, 0, sz); o.gl.material.opacity = 0.35 + 0.6 * face * face; o.gl.scale.setScalar(2 + 4 * face * face);
    });
    for (const m of v.men) {
      const f = m.f, lit = litAt(f.x, f.z, 2.4);
      if (m.lit && !lit) {                               // 光刚离开：在黑里换一个样子，往路这边挪一点，转过来对着主角
        m.n++; f.z = Math.min(-1.2, f.z + rr(0.3, 0.7)); f.face = P.x > f.x ? 1 : -1; f.tx = P.x; f.ty = P.y + 1.2; f.arm = 0;
        figAct(f, m.n > 3 && Math.abs(P.x - f.x) < 10 ? 'point' : POSES[m.n % POSES.length]); figSnap(f);
      }
      m.lit = lit; f.still = true; f.dirty = true;
    }
    v.crowd.draw();
  }
  function reset() { if (V) for (const m of V.men) { m.f.z = m.z0; m.n = 0; figAct(m.f, 'stand'); figSnap(m.f); } }
  return defZone({ n: HN(k), vis: [X - 14, X + LEN + 4], build, update, reset, solve() {}, unbuild() { V = null; }, HOLES, BEA, litAt });
})();
