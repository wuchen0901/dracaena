// ============================================================
//  第 25 章 · 浸泡槽（工厂深处之一）
//  改造室底下：一长条冒泡的绿色药水。后面一排吊钩挂着人，一个接一个沉进药水里，过一会儿再提起来 ——
//  进去的人还在挣扎、穿着各色的衣服，提出来的人不动了、一身灰（回答“劳动者为什么只听铃”）。
//  玩法：药水上面吊着六只铁托架，铃一响就有一只往下沉，在药水里泡一会儿再提上来。跳着托架过去，脚下这只开始抖就跳到还在上面的那一只
// ============================================================
const H1 = (() => {
  const k = 0, X = hX(k), LEN = 60;
  hChapter(k, { name: '浸泡槽', sub: '铃一响就往下沉', ground: 'metal', len: LEN, tint: 0x0d1a0c });
  const V1 = X + 8, V2 = X + 26, SURF = -0.8, BOT = -4;
  terrain([X - 14, 0], [V1, 0], [V1 + 0.02, BOT], [V2 - 0.02, BOT], [V2, 0], [X + LEN + 4, 0]);
  ground(X - 14, 0x1f2620); ground(X + LEN + 4, 0x1c231d);
  groundBack(V1, V2, -6.4); groundFront(V1, V2, 1.6); hCut(X - 14, X + LEN + 4);
  const VAT = ooze({ x1: V1, x2: V2, y: SURF, bot: BOT, z1: -6, z2: 1.6, kind: 'green', rate: 1.6, big: 0.08 });
  checkpoint(X + 2); checkpoint(V2 + 2);
  camKeys([X - 14, 16.5, 1.6, 1, 1], [V1 - 2, 18, 1.4, 1.5, 2.6], [V2 + 1, 18, 1.4, 1.5, 2.6], [X + 40, 16.5, 1.6, 1, 0.8], [X + LEN + 4, 16, 1.6, 1, 0]);
  hEnv(k, { fog: 0x0c160c, fogD: 0.028, hemiS: 0x6f8a70, hemiG: 0x0a120a, hemiI: 0.5, keyC: 0xb8e0b0, keyI: 0.2, rimC: 0x9cff7a, rimI: 0.45, dustC: 0xb6f0a0, dustO: 0.3, aDrip: 0.5 }, LEN);
  FAR[HN(k)] = ['steam', 'chain', 'clank', 'hum2'];

  // ---- 六只托架：一个周期 8.8 秒，各自错开。u：0–0.8 抖（要沉了）/ 0.8–1.8 往下沉 / 1.8–2.8 泡在药水里 / 2.8–3.8 提上来 / 后面停在上面。
  //      挨着的两只至少有一秒多同时在上面（错开 4.4 秒的两只：重叠 1.4 秒；错开 2.2 秒的：3.6 秒）
  const PER = 8.8, TOP = 0.3, LOW = -1.7, OFF = [0, 4.4, 2.2, 6.6, 0.9, 5.3];
  const TRAYS = [10, 12.9, 15.8, 18.7, 21.6, 24.5].map((dx, i) => ({ i, x: X + dx, ph: OFF[i], y: TOP, shake: 0,
    s: solid({ x1: X + dx - 0.8, x2: X + dx + 0.8, y1: TOP - 0.14, y2: TOP, plat: true, snd: 'metal' }) }));
  const S = { t: 0 };
  const phase = (tr, t) => ((t - tr.ph) % PER + PER) % PER;
  function trayY(u) {
    if (u < 0.8) return TOP; if (u < 1.8) return lerp(TOP, LOW, sstep(0.8, 1.8, u)); if (u < 2.8) return LOW; if (u < 3.8) return lerp(LOW, TOP, sstep(2.8, 3.8, u)); return TOP;
  }
  hint(() => P.x > X + 3 && P.x < V1 + 0.5 && P.y > -0.5, '铃一响，就有一只托架往药水里沉。跳上还在上面的那一只');
  hint(() => P.x > V1 && P.x < V2 && TRAYS.some(tr => standingOn(tr.s) && tr.shake > 0), '脚下在抖 —— 快跳');

  let V = null;
  function* build(R) {
    const v = {};
    hHall(X, LEN, { far: '#121a12', win: '#2c4a26', mid: '#0d140d', near: '#070a07' }, { cols: [X + 4, X + 32, X + 52], fore: [X + 6, X + 36, X + 55] });
    hCutFace(R, X - 14, V1 - 0.5, 0); hCutFace(R, V2 + 0.5, X + LEN + 4, 0);   // 池子那一段不挡：前面是液体切开的那一面
    yield;
    VAT.build(R); poolShell(R, VAT, { mat: lam(0x2b332c) });
    add(R, bx(V2 - V1 + 1, 0.2, 24), lam(0x262d27), (V1 + V2) / 2, -0.1, -18.6);           // 池子后面的地面
    yield;
    // 头顶两道轨：前面一道吊托架，后面一道吊人
    for (const z of [0, -3.6]) { add(R, bx(V2 - V1 + 12, 0.35, 0.3), MAT.steel, (V1 + V2) / 2, 7, z); add(R, bx(V2 - V1 + 12, 0.08, 0.5), MAT.dark, (V1 + V2) / 2, 6.8, z); }
    for (const x of [V1 - 4, V2 + 4]) add(R, bx(0.5, 8, 0.5), MAT.dark, x, 3, -1.8);
    v.trays = TRAYS.map(tr => {
      const g = grp(R, tr.x, TOP, 0);
      add(g, bx(1.6, 0.1, 1.3), lam(0x3c4544), 0, -0.07, 0);
      for (const sx of [-1, 1]) add(g, bx(0.06, 0.25, 1.3), lam(0x2e3534), sx * 0.78, 0.05, 0);
      for (const sz of [-1, 1]) add(g, bx(1.6, 0.25, 0.06), lam(0x2e3534), 0, 0.05, sz * 0.63);
      for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const r = add(g, cy(0.015, 0.015, 1.7, 4), MAT.dark, sx * 0.4, 0.9, sz * 0.3, false); r.rotation.z = -sx * 0.42; r.rotation.x = sz * 0.3; }
      add(g, new THREE.TorusGeometry(0.16, 0.035, 6, 12, 4.5), MAT.steel, 0, 1.85, 0, false);
      const chain = add(R, cy(0.03, 0.03, 1, 5), MAT.dark, tr.x, 0, 0, false);
      return { g, chain };
    });
    yield;
    // 后面那道轨上吊着的人：从左边进来，在药水上面沉下去，提上来时换了一身灰，往右边出去
    v.crowd = mkCrowd(R, 12);
    v.hung = [];
    for (let i = 0; i < 8; i++) {
      const f = v.crowd.add(fig('civ', 0, { act: 'struggle', face: 1, z: -3.6 }));
      const hook = add(R, new THREE.TorusGeometry(0.13, 0.03, 6, 12, 4.4), MAT.steel, 0, 0, -3.6, false), line = add(R, cy(0.02, 0.02, 1, 4), MAT.dark, 0, 0, -3.6, false);
      v.hung.push({ f, hook, line, x: X - 2 + i * 4.6, gray: false, col: { ...f.col } });
    }
    v.crowd.addAll([]);
    // 两边的地上：几台旧机器，一只灰色工服的推车（右边，往右运）
    v.carts = [mkCart(R, V2 + 6, -1.6, 'clothes'), mkCart(R, V2 + 8.2, -1.8, 'clothes')];
    add(R, bx(2.4, 2.2, 1.6), lam(0x252c27), X + 3, 1.1, -3.4); add(R, bx(1.2, 3.4, 1.2), lam(0x1d231f), X + 5.4, 1.7, -4.2);
    pipe(R, X + 5.4, 3.4, X + 5.4, 7, -4.2, 0.18); pipe(R, X + 5.4, 6.5, V1 + 2, 6.5, -5.5, 0.12);
    for (let x = V1 + 3; x < V2; x += 5) pipe(R, x, 6.5, x, 0.2, -5.6, 0.06);                 // 往池子里滴药的细管
    V = v;
  }
  function update(dt) {
    const play = state === 'play';
    const t0 = S.t; S.t += dt;
    for (const tr of TRAYS) {
      const u = phase(tr, S.t), u0 = phase(tr, t0);
      if (u < u0 && Math.abs(tr.x - P.x) < 30) fx('hbell', 0.55);                        // 铃：这一只要沉了
      const y = trayY(u), dy = y - tr.y; tr.y = y; tr.shake = u < 0.8 ? 1 : 0;
      tr.s.y1 = y - 0.14; tr.s.y2 = y;
      if (u > 1.5 && u < 1.6 && Math.abs(tr.x - P.x) < 20 && Math.random() < 0.3) VAT.burst(tr.x, 1.6, 0);
      if (dy < -0.001 && standingOn(tr.s)) P.y = y;                                       // 往下沉的时候人跟着
    }
    VAT.step(dt);
    const v = V; if (!v) return;
    TRAYS.forEach((tr, i) => {
      const o = v.trays[i], j = tr.shake ? 0.035 * Math.sin(T * 47 + i) : 0;
      o.g.position.set(tr.x + j, tr.y, 0);
      const top = 6.8, bot = tr.y + 1.95; o.chain.scale.y = top - bot; o.chain.position.set(tr.x + j * 0.5, (top + bot) / 2, 0);
    });
    // 后面吊着的人
    for (const h of v.hung) {
      h.x += 0.55 * dt; if (h.x > V2 + 9) { h.x -= 8 * 4.6; if (h.gray) { h.gray = false; figRecolor(v.crowd, h.f, h.col); } }
      const dip = sstep(V1 + 4, V1 + 7, h.x) * (1 - sstep(V2 - 7, V2 - 4, h.x)), hy = lerp(6.0, 0.4, dip), mid = (V1 + V2) / 2;
      if (!h.gray && h.x > mid) { h.gray = true; figRecolor(v.crowd, h.f, GRAY_COL); VAT.burst(h.x, 2.2, -3.6); }
      figAct(h.f, h.gray ? 'handsup' : 'struggle');
      h.f.x = h.x; h.f.y = hy - h.f.H * 1.12; h.f.z = -3.6; h.f.hide = h.x < X - 4 || h.x > V2 + 8.5; h.f.dirty = true;
      if (dip > 0.95 && Math.random() < 0.6 * dt) VAT.burst(h.x + rr(-0.3, 0.3), 0.8, -3.6);
      h.hook.position.set(h.x, hy + 0.1, -3.6); h.line.scale.y = 6.8 - hy - 0.2; h.line.position.set(h.x, (6.8 + hy + 0.2) / 2, -3.6);
      h.hook.visible = h.line.visible = !h.f.hide;
      figStep(h.f, dt);
    }
    v.crowd.draw();
  }
  function reset() { S.t = 0; }
  return defZone({ n: HN(k), vis: [X - 14, X + LEN + 4], build, update, reset, solve() {}, unbuild() { V = null; VAT.unbuild(); }, TRAYS, S, VAT, trayY, phase, PER });
})();
