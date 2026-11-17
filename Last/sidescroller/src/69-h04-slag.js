// ============================================================
//  第 28 章 · 熔渣池（工厂深处之四）
//  焚化炉底下：炉底流出来的熔渣汇成一条橙红发亮的河，表面结一层黑壳，过一会儿又裂开发光。头顶的溜槽隔一阵倒下来一股，溅起一片火星。
//  玩法：河面上漂着几块结住的黑壳，踩上去就开始裂（裂缝越来越亮），一秒多以后碎掉沉下去，过几秒又结上。
//  一块一块往前跳，别在一块上站着不走。中间两块自己也会裂开、再结上：先站在它前面那只铁锭模子上（不会裂），看准了再跳
// ============================================================
const H4 = (() => {
  const k = 3, X = hX(k), LEN = HLEN[k];
  hChapter(k, { name: '熔渣池', sub: '踩上去就裂', ground: 'gravel', len: LEN, tint: 0x1a0904 });
  const V1 = X + 9, V2 = X + 30, SURF = -0.7, BOT = -3, TOPY = -0.42;
  terrain([X - 14, 0], [V1, 0], [V1 + 0.02, BOT], [V2 - 0.02, BOT], [V2, 0], [X + LEN + 4, 0]);
  ground(X - 14, 0x2a1d16); ground(X + LEN + 4, 0x261a14);
  groundBack(V1, V2, -6.4); groundFront(V1, V2, 1.6); hCut(X - 14, X + LEN + 4);
  const LAVA = ooze({ x1: V1, x2: V2, y: SURF, bot: BOT, z1: -6, z2: 1.6, kind: 'lava', rate: 2.2, big: 0.05, haze: 0.18, li: 3.2, ld: 16 });
  checkpoint(X + 2); checkpoint(V2 + 2);
  camKeys([X - 14, 16.5, 1.6, 1, 1], [V1 - 2, 18, 1.4, 1.5, 2.4], [V2 + 1, 18, 1.4, 1.5, 2.4], [X + 42, 16.5, 1.6, 1, 0.8], [X + LEN + 4, 16, 1.6, 1, 0]);
  hEnv(k, { fog: 0x1a0a05, fogD: 0.024, hemiS: 0xb07050, hemiG: 0x200a04, hemiI: 0.45, keyC: 0xffa060, keyI: 0.3, keyDir: [0.1, 0.3, 0.5], rimC: 0xff8040, rimI: 0.6, dustC: 0xffa050, dustO: 0.6, aRoom: 1, roomF: 70, aDrip: 0, aHum: 0.2 }, LEN);
  FAR[HN(k)] = ['rumble', 'steam', 'clank', 'rumble'];
  const chuteL = pointLight({ p: [X + 18, 5, -4], c: 0xff7a2a, i: 0, d: 14 });

  // ---- 黑壳：c 裂到哪了（0 结实，1 碎了）/ st：solid 结实 / crack 正在裂 / gone 沉下去了 / form 正在结上 ----
  // 种类：n 踩上去就裂 / a 自己隔 7 秒裂一次（auto）/ r 一只沉在河里的铁锭模子，露出一截，不会裂（在它上面等）
  const KIND = 'nnranran';
  const PL = [...KIND].map((kd, i) => ({ i, kd, x: X + 10.2 + 2.5 * i, st: 'solid', c: 0, t: 0, y: kd === 'r' ? TOPY + 0.2 : TOPY, auto: kd === 'a' ? 7 : 0, aph: i > 4 ? 3.5 : 0,
    s: solid({ x1: X + 10.2 + 2.5 * i - 0.75, x2: X + 10.2 + 2.5 * i + 0.75, y1: TOPY - 0.2, y2: kd === 'r' ? TOPY + 0.2 : TOPY, plat: true, noclimb: true, snd: kd === 'r' ? 'metal' : 'gravel' }) }));
  const CRACK = 1.6, GONE = 3.5, FORM = 1.0;
  function setSt(p, st) { p.st = st; p.t = 0; if (st === 'crack') fx('crack', Math.abs(p.x - P.x) < 15 ? 0.7 : 0.2); if (st === 'gone') { fx('sizzle', 0.5); LAVA.plunge(p.x); } }
  const S = { t: 0, chute: 6, pour: 0 };
  hint(() => P.x > X + 3 && P.x < V1 + 0.2 && P.y > -0.2, '黑壳踩上去就裂。一块一块往前跳，别停');
  hint(() => P.x > V1 && P.x < V2 && PL.some(p => p.kd === 'r' && standingOn(p.s)), '前面那一块自己也会裂。等它裂开、重新结上，再跳');

  let V = null;
  function* build(R) {
    const v = {};
    hHall(X, LEN, { far: '#1f0e07', win: '#6a2a0c', mid: '#170a05', near: '#0b0503' }, { cols: [X + 4, X + 34, X + 54], fore: [X + 5, X + 38], winGap: 6 });
    hCutFace(R, X - 14, V1 - 0.5, 0); hCutFace(R, V2 + 0.5, X + LEN + 4, 0);   // 池子那一段不挡：前面是液体切开的那一面
    yield;
    LAVA.build(R); poolShell(R, LAVA, { mat: lam(0x2a1c16) });
    add(R, bx(V2 - V1 + 1, 0.2, 24), lam(0x22160f), (V1 + V2) / 2, -0.1, -18.6);
    // 后墙上的炉口：一排烧得发亮的方洞，上面一道溜槽斜着伸到河上
    for (let i = 0; i < 3; i++) { add(R, bx(2.2, 1.6, 0.3), MAT.dark, V1 + 3 + i * 6, 3.6, -9.6); glow(R, 0xff6a1a, 4.5, 0.55, V1 + 3 + i * 6, 3.6, -9.3, GLOW_SOFT); add(R, bx(1.7, 1.1, 0.1), new THREE.MeshBasicMaterial({ color: 0xff8a2a }), V1 + 3 + i * 6, 3.6, -9.4, false); }
    add(R, bx(9, 0.5, 1.8), lam(0x2d211a), X + 21, 6.2, -4).rotation.z = -0.35;
    add(R, bx(12, 18, 1), lam(0x1d140f), X + 18, 14, -10.4);
    v.pour = add(R, bx(0.5, 1, 0.5), new THREE.MeshBasicMaterial({ color: 0xffa040 }), X + 17, 0, -4, false);
    v.pourG = glow(R, 0xff7a2a, 6, 0, X + 17, 2, -3.5, GLOW_SOFT);
    yield;
    v.pl = PL.map(p => {
      if (p.kd === 'r') {                                // 铁锭模子：一只方方正正的铁槽，斜着插在熔渣里，边上烧得发红
        const m = lam(0x2a2826, { emissive: new THREE.Color(0xff4a10), emissiveIntensity: 0.25 }); m.userData.own = true;
        const g = grp(R, p.x, p.y, 0); add(g, bx(1.5, 1.2, 1.4), m, 0, -0.6, 0).rotation.z = 0.05; add(g, bx(1.2, 0.05, 1.1), MAT.dark, 0, 0.005, 0, false);
        return { g, m, rock: true };
      }
      const m = lam(0x1a1210, { emissive: new THREE.Color(0xff5a10), emissiveIntensity: 0 }); m.userData.own = true;
      const g = grp(R, p.x, TOPY, 0);
      add(g, bx(1.5, 0.22, 1.6), m, 0, -0.11, 0);
      for (let j = 0; j < 4; j++) add(g, bx(rr(0.3, 0.6), rr(0.1, 0.2), rr(0.3, 0.6)), m, rr(-0.6, 0.6), -0.02, rr(-0.6, 0.6)).rotation.y = rr(0, 3);
      return { g, m };
    });
    v.emb = [];
    for (let i = 0; i < 40; i++) { const s = glow(R, 0xffa040, 0.12, 0, 0, 0, 0); v.emb.push({ s, t: 9, life: 1 }); }
    V = v;
  }
  function ember(x, y, z, n = 1, up = 1) {
    if (!V) return;
    for (let i = 0; i < n; i++) { const e = V.emb.find(e => e.t >= e.life); if (!e) return; Object.assign(e, { t: 0, life: rr(0.8, 2.2), x, y, z, vx: rr(-0.6, 0.6), vy: rr(0.8, 2.6) * up, vz: rr(-0.3, 0.3) }); }
  }
  function update(dt) {
    S.t += dt;
    for (const p of PL) {
      if (p.kd === 'r') continue;
      const on = standingOn(p.s);
      p.t += dt;
      if (p.st === 'solid') {
        if (on) setSt(p, 'crack');
        else if (p.auto && ((S.t + p.aph) % p.auto) < dt) setSt(p, 'crack');
      } else if (p.st === 'crack') { p.c = p.t / CRACK; if (p.t > CRACK) setSt(p, 'gone'); if (Math.random() < dt * 8) ember(p.x + rr(-0.6, 0.6), TOPY, rr(-0.5, 0.5)); }
      else if (p.st === 'gone') { p.c = 1; if (p.t > (p.auto ? 2.0 : GONE)) setSt(p, 'form'); }
      else if (p.st === 'form') { p.c = 1 - p.t / FORM; if (p.t > FORM) { setSt(p, 'solid'); p.c = 0; } }
      const sunk = p.st === 'gone' || (p.st === 'form' && p.t < FORM * 0.6);
      p.y = p.st === 'gone' ? TOPY - 0.6 : p.st === 'form' ? lerp(TOPY - 0.6, TOPY, sstep(0, FORM, p.t)) : TOPY;
      p.s.off = sunk; p.s.y2 = p.y; p.s.y1 = p.y - 0.2;
    }
    // 溜槽：隔一阵倒下来一股熔渣
    S.chute -= dt; if (S.chute <= 0) { S.chute = rr(7, 11); S.pour = 2.2; if (Math.abs(P.x - X - 17) < 30) fx('rush', 0.5); }
    if (S.pour > 0) { S.pour -= dt; if (Math.random() < dt * 20) { LAVA.burst(X + 17 + rr(-0.4, 0.4), 1.4, -4); ember(X + 17, SURF, -4, 2, 1.6); } }
    chuteL.on = sstep(0, 0.4, S.pour) * 1.0; chuteL.i = 4;
    if (Math.random() < dt * 6) ember(rr(V1, V2), SURF, rr(-5, 1));
    LAVA.step(dt);
    const v = V; if (!v) return;
    PL.forEach((p, i) => { const o = v.pl[i]; if (o.rock) return; o.g.position.y = p.y; o.g.visible = p.y > TOPY - 0.55; o.m.emissiveIntensity = p.c * p.c * 2.2 + (p.st === 'crack' ? 0.3 * Math.sin(T * 30) * p.c : 0); o.g.position.x = p.x + (p.st === 'crack' ? 0.02 * Math.sin(T * 50) * p.c : 0); });
    const po = sstep(0, 0.4, S.pour); v.pour.visible = po > 0.01; v.pour.scale.set(0.6 + 0.4 * po, 6.4 - SURF, 1); v.pour.position.y = (6.4 + SURF) / 2; v.pourG.material.opacity = 0.6 * po;
    for (const e of v.emb) {
      if (e.t >= e.life) { e.s.visible = false; continue; }
      e.t += dt; e.vy -= 0.5 * dt; e.x += e.vx * dt; e.y += e.vy * dt; e.z += e.vz * dt;
      e.s.visible = true; e.s.position.set(e.x, e.y, e.z); e.s.material.opacity = 0.9 * (1 - e.t / e.life);
    }
  }
  function reset() { S.t = 0; S.chute = 5; S.pour = 0; for (const p of PL) { p.st = 'solid'; p.c = 0; p.t = 0; } }
  reset();
  return defZone({ n: HN(k), vis: [X - 14, X + LEN + 4], build, update, reset, solve() {}, unbuild() { V = null; LAVA.unbuild(); }, respawn() { for (const p of PL) if (!p.auto) { p.st = 'solid'; p.c = 0; p.t = 0; } }, PL, S });
})();
