// ============================================================
//  第 34 章 · 冷库（工厂深处之十）
//  一排排挂钩吊着白布包，白雾贴着地面流。唯一的声音是制冷机的嗡嗡声 —— 突然停了，整个冷库一下子安静下来。
//  一个看守在布包中间慢慢走，手电垂着照地。
//  玩法：制冷机响着的时候，脚步声被盖住，可以走（他的光扫过来的时候也站住，等他走过去）。它要停之前会咳几下、灯闪几下；
//  一停下来就站住别动 —— 这时候走一步，他就听见了，手电一下子转过来。等它重新响起来再走
// ============================================================
const H10 = (() => {
  const k = 9, X = hX(k), LEN = HLEN[k];
  hChapter(k, { name: '冷库', sub: '安静的时候别动', ground: 'concrete', len: LEN, tint: 0xc0ccd0 });
  terrain([X - 14, 0], [X + LEN + 4, 0]);
  ground(X - 14, 0x3a4246); ground(X + LEN + 4, 0x384044);
  hCut(X - 14, X + LEN + 4);
  checkpoint(X + 2); checkpoint(X + 26);
  camKeys([X - 14, 16, 1.6, 1, 0.6], [X + LEN + 4, 16, 1.6, 1, 0.6]);
  const COLD = { fog: 0x6a7a80, fogD: 0.04, hemiS: 0xc8dce4, hemiG: 0x2a3438, hemiI: 0.62, keyC: 0xd8eef4, keyI: 0.3, rimC: 0xb8d8e8, rimI: 0.4, dustC: 0xe8f4f8, dustO: 0.7, wind: 0.03, aRoom: 0.4, roomF: 160, aHum: 0, aDrip: 0, aFar: 0.4 };
  hEnv(k, COLD, LEN);
  FAR[HN(k)] = ['creak', 'chain', 'creak'];
  const lights = [X + 6, X + 20, X + 34, X + 48].map(x => spotLight({ p: [x, 5.2, -1.5], t: [x, 0, -0.5], c: 0xd8f0ff, i: 2.4, a: 0.7, d: 12, pen: 0.8 }));
  // 制冷机：run 响着（6–9 秒）→ cough 要停了（1.2 秒）→ quiet 停了（4–6 秒）→ 又响起来
  const M = { st: 'run', t: 0, dur: 7, hum: 1 };
  const W = { ex: 0, caught: 0 };
  const PAT = { x: X + 30, dir: -1, wait: 0, snap: 0 };
  const G = hWatch({ gx: PAT.x, gy: 0, gz: -1.3, l0: X + 4, l1: X + 52, r: 1.1, rule: 'move', path: () => PAT.snap > 0 ? P.x : PAT.x + PAT.dir * 2.2 });
  hint(() => P.x > X + 2 && P.x < X + 10 && M.st !== 'quiet', '制冷机响着的时候可以走。它一停，就站住别动');
  hint(() => M.st === 'quiet' && P.x > X + 2, '别动');
  function next(st) { M.st = st; M.t = 0; M.dur = st === 'run' ? rr(6, 9) : st === 'cough' ? 1.2 : rr(4, 6); if (Math.abs(P.x - X - 30) < 40) fx(st === 'quiet' ? 'powerDown' : st === 'run' ? 'powerUp' : 'clunk'); }

  let V = null;
  function* build(R) {
    const v = {};
    hHall(X, LEN, { far: '#5e6a70', win: '#8a9aa0', mid: '#4a565c', near: '#2c3438' }, { cols: [X + 3, X + 54], fore: [X + 16, X + 44], lamps: [X + 6, X + 20, X + 34, X + 48], top: 14 });
    hCutFace(R, X - 14, X + LEN + 4, 0);
    yield;
    // 后墙上三台制冷机：大风扇
    v.fans = [X + 12, X + 30, X + 48].map(x => {
      add(R, bx(4, 4, 1), lam(0x4a5458), x, 3.4, -9.6);
      const f = grp(R, x, 3.4, -9.0); for (let i = 0; i < 5; i++) { const b = add(f, bx(0.5, 1.6, 0.05), lam(0x2a3236), 0, 0.8, 0, false); b.parent.remove(b); const p = grp(f, 0, 0, 0); p.rotation.z = i * 1.2566; p.add(b); }
      add(R, cy(0.3, 0.3, 0.2, 12), MAT.dark, x, 3.4, -8.9).rotation.x = Math.PI / 2;
      return f;
    });
    // 布包：一排排挂钩吊着的白布包（不看清里面是什么）
    const bag = new THREE.CapsuleGeometry(0.3, 0.9, 4, 8);
    const list = [];
    for (const z of [-1.9, -3.3, -4.8, -6.5, -8.2]) for (let x = X - 12; x < X + LEN + 2; x += rr(1.1, 1.8)) list.push({ x, z, y: rr(1.5, 1.8), ph: rr(0, 6.3), s: rr(0.85, 1.15) });
    const bm = lam(0xd8dcd8); bm.userData.own = true;
    v.bags = new THREE.InstancedMesh(bag, bm, list.length); v.bags.castShadow = true; R.add(v.bags); v.list = list;
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
    list.forEach((b, i) => { m4.compose(V3(b.x, b.y, b.z), q.setFromAxisAngle(V3(0, 0, 1), 0.04 * Math.sin(b.ph)), V3(b.s, b.s, b.s)); v.bags.setMatrixAt(i, m4); v.bags.setColorAt(i, new THREE.Color().setHSL(0.1, 0.05, rr(0.7, 0.82))); });
    for (const z of [-1.9, -3.3, -4.8, -6.5, -8.2]) add(R, bx(LEN + 16, 0.06, 0.06), MAT.steel, X + LEN / 2 - 5, 3.2, z, false);
    for (const b of list) if (rnd() < 0.5) add(R, cy(0.01, 0.01, 3.2 - b.y - 0.75, 3), MAT.dark, b.x, (3.2 + b.y + 0.75) / 2, b.z, false);
    yield;
    // 地上的白雾：一层贴地的软光，慢慢往右流
    v.mist = [];
    for (let i = 0; i < 26; i++) { const s = glow(R, 0xe8f4f8, rr(3, 6), 0.22, rr(X - 10, X + LEN), rr(0.1, 0.4), rr(-6, 1.4), GLOW_SOFT); s.material.blending = THREE.NormalBlending; s.scale.y *= 0.35; v.mist.push(s); }
    v.breath = glow(R, 0xffffff, 0.4, 0, 0, 0, 0, GLOW_SOFT); v.breath.material.blending = THREE.NormalBlending;
    v.crowd = mkCrowd(R, 1); G.build(R, v.crowd); v.crowd.addAll([]);
    V = v;
  }
  function update(dt) {
    const play = state === 'play';
    M.t += dt; if (M.t > M.dur) next(M.st === 'run' ? 'cough' : M.st === 'cough' ? 'quiet' : 'run');
    M.hum = damp(M.hum, M.st === 'run' ? 1 : M.st === 'cough' ? 0.6 + 0.4 * Math.sin(T * 9) : 0, M.st === 'quiet' ? 3 : 2, dt);
    AUD.hum = 0.6 * M.hum; AUD.humF = 46 + 8 * M.hum;
    // 停下来以后（给半秒反应）：一动就被听见，手电一下子转过来
    const quiet = M.st === 'quiet' && M.t > 0.5;
    const heard = play && quiet && hMoving();
    if (heard) PAT.snap = 1.5;
    PAT.snap = Math.max(0, PAT.snap - dt);
    if (PAT.snap <= 0 && M.st !== 'quiet') {
      if (PAT.wait > 0) PAT.wait -= dt;
      else { PAT.x += PAT.dir * 0.8 * dt; if (PAT.x < X + 6) { PAT.x = X + 6; PAT.dir = 1; PAT.wait = 2; } if (PAT.x > X + 50) { PAT.x = X + 50; PAT.dir = -1; PAT.wait = 2; } }
    }
    G.gx = PAT.x;
    const ex = hWatchAll([G], dt, play);
    HX.alert = Math.max(ex, watchStep(W, heard, dt, 0.35, 1.2));
    if (G.f) { const f = G.f; f.x = PAT.x; figAct(f, PAT.snap > 0 || M.st === 'quiet' || PAT.wait > 0 ? 'point' : 'walk'); f.vx = f.act === 'walk' ? PAT.dir * 0.8 : 0; figStep(f, dt); }
    for (const l of lights) l.on = M.st === 'cough' ? (Math.sin(T * 23 + l.p[0]) > 0 ? 1 : 0.2) : M.st === 'quiet' ? 0.55 : 1;
    const v = V; if (!v) return;
    for (const f of v.fans) f.rotation.z -= dt * 9 * M.hum;
    for (const s of v.mist) { s.position.x += dt * 0.25; if (s.position.x > X + LEN) s.position.x = X - 10; }
    // 安静的时候：呼出来的一团白气
    const bk = M.st === 'quiet' ? 1 : 0.3, ph = (T * 0.45) % 1;
    v.breath.position.set(P.x + P.facing * (0.15 + 0.3 * ph), P.y + P.H * 0.9 + 0.2 * ph, 0.2); v.breath.material.opacity = 0.25 * bk * Math.sin(Math.PI * ph); v.breath.scale.setScalar(0.25 + 0.5 * ph);
    v.crowd.draw();
  }
  function reset() { Object.assign(M, { st: 'run', t: 0, dur: 7, hum: 1 }); Object.assign(PAT, { x: X + 30, dir: -1, wait: 0, snap: 0 }); Object.assign(W, { ex: 0, caught: 0 }); G.reset(); }
  return defZone({ n: HN(k), vis: [X - 14, X + LEN + 4], build, update, reset, solve() {}, unbuild() { V = null; G.unbuild(); },
    respawn() { Object.assign(W, { ex: 0, caught: 0 }); PAT.snap = 0; G.reset(); next('run'); M.dur = 6; }, M, PAT, G, W });
})();
