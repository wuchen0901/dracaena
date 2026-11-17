// ============================================================
//  第 29 章 · 竖井（工厂深处之五）
//  走廊尽头是一口方形的竖井。一进去，身后的闸门落下来，井底的排水口往外翻绿色的药水，液面一点一点往上涨，一直冒泡、冒雾。
//  玩法：整章只有一件事 —— 往上爬，别被液面追上。踩着一层层的铁架子跳上去、扒上去；
//  半路有一层够不着，要把架子上那只箱子推到边上垫脚；再往上跳起来抓住一根吊着的绳子爬到上一层，最后翻进顶上的出口。
//  被追上就回到存档点：井底，或者半路那一层（到过那一层以后，液面从那一层下面重新涨）
// ============================================================
const H5 = (() => {
  const k = 4, X = hX(k), LEN = HLEN[k];
  hChapter(k, { name: '竖井', sub: '往上爬', ground: 'metal', len: LEN, tint: 0x0c180b, start: 1 });
  const S1 = X + 6, S2 = X + 18, FLOOR = -2, TOPF = 15;
  terrain([X - 14, FLOOR], [X + LEN + 4, FLOOR]);                                                  // 走廊和井底一样高：从井底走进去
  ground(X - 14, 0x1d221d); ground(X + LEN + 4, 0x1b201b);
  groundFront(S1, S2, 1.6); groundBack(S1, S2, -4.2); hCut(X - 14, X + LEN + 4);
  ceiling([X - 14, FLOOR + 3.2], [S1 - 0.7, FLOOR + 3.2]);                                                         // 走廊的顶
  const S = { y: FLOOR - 2.4, on: false, t: 0, mid: false, top: false };
  const LIQ = ooze({ x1: S1, x2: S2, y: () => S.y, bot: FLOOR - 2.6, z1: -4, z2: 1.6, kind: 'green', rate: 2.5, big: 0.1, haze: 0.16, li: 2.6, ld: 12, when: () => S.on });
  // 墙：井的左墙（走廊顶以上）、右墙（顶上出口以下是一整块实心的岩石）
  solid({ x1: S1 - 0.7, x2: S1, y1: FLOOR + 3.2, y2: 30, noclimb: true });
  const ROCK = solid({ x1: S2, x2: X + LEN + 1, y1: FLOOR, y2: TOPF, snd: 'concrete' });
  const DOOR = gate({ x: S1 - 1.3, y0: FLOOR, h: 3.2, w: 0.5, T: 0.8 });
  // 一层层的铁架子 [x1, x2, 顶面]（相对 X）。p5 上搁着箱子；p6 比 p5 高 2.3 米，要垫箱子；p6 头顶吊着绳子 → p7 → p8 → 出口
  const L = [[12.2, 18, -0.7], [6, 11, 0.6], [12.2, 16, 1.9], [6, 11, 3.2], [12.2, 18, 4.5], [6, 10.8, 6.8], [11.4, 18, 12.4], [14, 16.5, 13.7]];   // 左右两摞之间隔 1.2 米，一层比一层高 1.3 米（跳起来扒得住）
  const LV = L.map(([a, b, y], i) => solid({ id: 'shaft' + i, x1: X + a, x2: X + b, y1: y - 0.25, y2: y, plat: true, ledge: true, snd: 'metal' }));
  const P5 = LV[4], CW = 1.05;
  const crate = pushable({ id: 'crate29', x: X + 15.5, y1: P5.y2, w: CW, h: CW, plat: true, snd: 'wood', lo: () => P5.x1 + CW / 2, hi: () => P5.x2 - CW / 2 });
  const ROPE = rope({ x: X + 10.3, top: 14.8, bot: 7.9 });
  checkpoint(X + 1);
  checkpoint(S2 + 3, { y: TOPF });
  camKeys([X - 14, 16, 1.4, 1, 0.5], [S1 - 2, 17, 1.2, 1.5, 0.8], [S1 + 1, 19, 1.0, 0, 0.6], [S2 - 1, 19, 1.0, 0, 0.6], [S2 + 3, 17, 1.4, 1, 0.5], [X + LEN + 4, 16, 1.4, 1, 0]);
  hEnv(k, { fog: 0x0b140b, fogD: 0.03, hemiS: 0x6f8a70, hemiG: 0x0a120a, hemiI: 0.42, keyC: 0xb8e0b0, keyI: 0.25, rimC: 0x9cff7a, rimI: 0.4, dustC: 0xb6f0a0, dustO: 0.35, aRoom: 0.9, roomF: 90, aDrip: 0.6 }, LEN);
  FAR[HN(k)] = ['steam', 'clank', 'gurgle', 'chain'];
  const RISE = 0.2, CAP = TOPF - 1.2;
  const beacon = pointLight({ p: [X + 12, 16, 0], c: 0xff3a20, i: 0, d: 18 });
  hint(() => S.on && P.y < -1 && P.x > S1, '往上爬');
  hint(() => P.y > 4.3 && P.y < 4.7 && P.x > X + 11 && crate.x > P5.x1 + CW / 2 + 0.2, '够不着上一层 —— 把箱子推到左边，踩着它跳');
  hint(() => P.y > 6.7 && P.y < 7.0 && P.mode === 'normal' && P.x < X + 11, '跳起来抓住绳子，爬上去');
  hint(() => P.mode === 'rope', '<b>空格</b> 往上爬，到了上一层的高度按 <b>→</b> 翻上去');

  let V = null;
  function* build(R) {
    const v = {};
    hHall(X, LEN, { far: '#0f150f', win: '#1e2c1c', mid: '#0b100b', near: '#060906' }, { cols: [X - 6, X + 30], fore: [X - 2, X + 34], top: 34 });
    hCutFace(R, X - 14, S1 - 0.7, FLOOR); hCutFace(R, S2 + 0.7, X + LEN + 4, FLOOR);
    yield;
    LIQ.build(R);
    const wm = lam(0x283028), wd = lam(0x1a201a);
    add(R, bx(S2 - S1 + 1.4, 22, 0.5), wm, (S1 + S2) / 2, 9, -4.45);                       // 井的后墙
    for (const [x, w] of [[S1 - 0.35, 0.7], [S2 + 0.35, 0.7]]) add(R, bx(w, 24, 6.1), MAT.dark, x, 8, -1.2);
    add(R, bx(S2 - S1, 0.5, 6.1), wd, (S1 + S2) / 2, FLOOR - 0.25, -1.2);
    add(R, bx(S1 - X + 14, 0.4, 6), wd, (X - 14 + S1 - 0.7) / 2, FLOOR + 3.4, -1.2);                // 走廊的顶
    add(R, bx(X + LEN - S2, TOPF - FLOOR, 6), MAT.dark, (S2 + X + LEN) / 2, (TOPF + FLOOR) / 2, -1.2);
    add(R, bx(X + LEN - S2, 0.1, 6), lam(0x2d342d), (S2 + X + LEN) / 2, TOPF - 0.05, -1.2);
    for (let x = S1 + 1; x < S2; x += 2.6) add(R, bx(0.9, 0.06, 0.9), MAT.dark, x, FLOOR + 0.01, -1.5, false);   // 井底的排水箅子
    yield;
    for (const s of LV) {
      grating(R, s.x1, s.x2, s.y2, -3.5, 1.1, lam(0x3b443f));
      for (const x of [s.x1 + 0.2, s.x2 - 0.2]) { const wall = x < (S1 + S2) / 2 ? S1 : S2; add(R, bx(Math.abs(x - wall) + 0.1, 0.12, 0.12), MAT.dark, (x + wall) / 2, s.y2 - 0.3, -3.3, false); }
    }
    v.crateG = mkCrate(R, crate, 'wood');
    ropeReset(ROPE); ropeMesh(R, ROPE);
    add(R, bx(0.6, 0.3, 0.6), MAT.steel, ROPE.x, ROPE.top + 0.1, 0);
    v.door = add(R, bx(0.5, 3.2, 3), lam(0x3a2c22), DOOR.x, FLOOR + 1.6, -1.2);
    v.beacon = glow(R, 0xff3a20, 2.2, 0, X + 12, 16.2, -3.8);
    add(R, cy(0.25, 0.3, 0.4, 10), lam(0x6a1a10), X + 12, 16.2, -4.1);
    V = v;
  }
  function update(dt) {
    const play = state === 'play';
    if (!S.on && play && P.x > S1 + 0.6) { S.on = true; S.t = 0; DOOR.want = 0; fx('alarm'); fx('rush', 0.8); }
    if (S.on) { S.t += dt; S.y = Math.min(CAP, S.y + RISE * dt); if (Math.random() < dt * 3) LIQ.burst(rr(S1 + 0.5, S2 - 0.5), 1.0); }
    if (!S.mid && standingOn(P5)) S.mid = true;
    if (P.y > TOPF - 0.1 && P.x > S2) S.top = true;
    LIQ.step(dt);
    stepRopes([ROPE], dt);
    beacon.on = S.on && !S.top ? 0.5 + 0.5 * Math.sin(T * 6) : 0; beacon.i = 3;
    const v = V; if (!v) return;
    v.crateG.position.x = crate.x;
    v.door.position.y = FLOOR + 1.6 + DOOR.open * 3.3;
    v.beacon.material.opacity = beacon.on * 0.8;
    if (S.on && !S.top) camJit = { x: 0, y: 0.02 * Math.sin(T * 37) };
  }
  function reset() { Object.assign(S, { y: FLOOR - 2.4, on: false, t: 0, mid: false, top: false }); setGate(DOOR, 1); placeBox(crate, X + 15.5); }
  reset();
  return defZone({ n: HN(k), vis: [X - 14, X + LEN + 4], build, update, reset, solve() { S.top = true; },
    unbuild() { V = null; LIQ.unbuild(); },
    // 回到存档点：到过半路那一层就回到那一层，液面从它下面三米重新涨；没到过就回到走廊里，闸门打开，液面落回去
    respawn(c) {
      if (c.x < X - 10 || c.x > X + LEN) return;
      if (S.top) return;
      if (S.mid) { placePlayer(X + 16.5, P5.y2); S.y = P5.y2 - 3.5; S.on = true; }
      else { S.y = FLOOR - 2.4; S.on = false; setGate(DOOR, 1); }   // 液面先在井底下面涨十来秒，才漫过脚面
    }, S, LV, crate, ROPE });
})();
