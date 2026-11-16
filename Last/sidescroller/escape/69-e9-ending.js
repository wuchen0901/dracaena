
// ============================================================
//  结尾
//  天快亮了。主角跑过田野、林子和水渠，爬上一处高坡，回头看。
//  远处的工厂烟囱在冒烟。一串车灯正从另一个方向（左边远处，贴着围墙外面）开进大门。画面停在这里。
//  （地形接在“雾”那一章后面：下了山是一片野地，一道浅水渠，然后是一道长坡。天从夜里慢慢亮起来 —— 光是跟着路走的）
//  2026-11-16 在大门和这里中间加了“雾”（68-e8-fog.js），这一章整个往右挪了 E8_L 米；里面的位置还是照挪之前、从大门（E7_X）算的写法
// ============================================================
const E9 = (() => {
  const X = E7_X + E8_L, TOP = X + 264, VZ = -118, FX = X + 214, FY = 2.6, SC = 0.5;   // VZ：远处那片谷地画在多深的地方（排在第七章那排远树前面）；FX、FY：工厂在哪；SC：工厂照这个比例缩小了画（画得近，看着远）
  const vx = x => FX + (x - FX) * SC, vy = y => FY + (y - FY) * SC;
  const C = chapter({ n: 8, x0: X + 196, start: X + 198, name: '结尾', sub: '天快亮了', ground: 'grass', label: '结尾', tag: '尾',   // 游戏里的第 8 章
    end: { h1: '逃出工厂', go: '按 R 再看一遍结尾　·　Esc 选择章节' } });             // 结局画面上的字（80-ui.js 的 endTexts；旧原型的写在网页里）
  terrain([X + 200, 1.3], [X + 206, 1.3], [X + 208.5, 0.55], [X + 212, 0.55], [X + 214.5, 1.4], [X + 228, 2.0], [X + 252, 7.6], [X + 264, 9.2], [X + 278, 9.6], [X + 360, 9.6]);   // 野地、水渠、一道长坡
  ground(X + 200, 0x2f3a2e); ground(X + 240, 0x4a5236); ground(X + 360, 0x4a5236);
  surface(X + 208.4, X + 212.1, 'wade');
  // st：0 还在路上 / 1 到了坡顶，回头看。t 回头以后过了多久
  const S = { st: 0, t: 0, shown: false };
  for (const x of [198, 216, 232, 250]) checkpoint(X + x);
  camKeys([X + 200, 21, 2.2, 1], [X + 215, 22, 2.4, 1.5], [X + 232, 22, 2.6, 2], [X + 262, 21, 2.2, 1], [X + 300, 21, 2.2, 1]);
  // 光：夜 → 天快亮 → 天亮。太阳从左后方的地平线下面上来，正好在工厂后面
  env(X + 205, { fog: 0x283344, fogD: 0.0075, hemiS: 0x93a6c6, hemiG: 0x14181c, hemiI: 0.72, keyC: 0xb8c6e0, keyI: 0.62, rimC: 0xa0b4d8, rimI: 0.45, dustC: 0xc0cce0, dustO: 0.2,
    sky: [0x101a30, 0x1c2a48, 0x34466a, 0x5a6480, 0x8a7a80, 0x2a3040], sunX: -0.3, sunY: -0.02, sunC: 0xffc9a0, sunP: 0.25, stars: 0.8, cloud: 0.5, cloudC: 0x5a5a78, flies: 0.3, birds: 0.15, aBug: 0.5, aWind: 0.45, aLeaf: 0.45 });
  env(X + 256, { fog: 0x8f939c, fogD: 0.0056, hemiS: 0xc8cfdc, hemiG: 0x3a3f38, hemiI: 0.95, keyC: 0xffd9b8, keyI: 1.0, keyDir: [-0.7, 0.36, -0.5], rimC: 0xffc9a0, rimI: 0.5, dustC: 0xffe6cc, dustO: 0.3,
    sky: [0x3b4f78, 0x6a80a8, 0xb8a8a8, 0xf0b890, 0xffd0a0, 0x6a6058], sunX: -0.3, sunY: 0.035, sunC: 0xffe2b8, sunP: 0.85, stars: 0, cloud: 0.55, cloudC: 0xffc8a8, flies: 0, birds: 0.6, aBug: 0, aWind: 0.5, aLeaf: 0.5, vig: 0.9 });
  env(X + 360, {});

  let V = null;
  function* build(R) {
    const v = {}, own = m => { m.userData.own = true; return m; };
    // 远处：一层层的丘陵；近一些是野地边上的树篱、几棵孤零零的树（朝工厂那一面是开阔的：不挡住回头看的那一眼）
    backdrop(X + 120, X + 420, -10, 70, -420, 2, g => { setInk(g, '#3d4658'); ridge(g, X + 120, X + 420, -10, x => 26 + 9 * Math.sin(ex(x) * 0.012 + 2) + 5 * Math.sin(ex(x) * 0.031), 4); }, { fog: false, fadeL: 30 });
    backdrop(X + 180, X + 340, -4, 24, -70, 6, g => { setInk(g, '#232b2c'); ridge(g, X + 180, X + 340, -4, x => groundY(x) + 0.6 + 0.5 * Math.sin(ex(x) * 0.2) + rr(0, 0.4), 1.2); for (let x = X + 186; x < X + 336; x += rr(9, 22)) if (x > X + 244 || x < X + 190) tree(g, x, groundY(x) + 0.2, rr(5, 10), pick(['round', 'round', 'pine', 'dead'])); }, { fadeL: 8 });
    backdrop(X + 196, X + 300, -2, 14, -9, 14, g => { setInk(g, '#151b1a'); for (const x of [X + 203, X + 243, X + 272, X + 281]) tree(g, x, groundY(x) - 0.1, rr(6, 10), x > X + 260 ? 'dead' : 'round'); grass(g, X + 196, X + 300, x => groundY(x) - 0.05, 0.3, 0.9, 360); }, { fadeL: 4 });
    for (const [a, b] of [[X + 190, X + 250], [X + 250, X + 310]]) foreTufts(a, b, 8.7, { cols: ['#0c1210', '#101814', '#0a0f0d'], h: 1.0, fern: 0.1 });
    yield;
    // 野地里的草：越往坡上越稀、越黄
    for (const [z0, z1, n] of [[-2.4, -14, 520], [2.2, 9, 300], [-14, -40, 420]]) {
      const list = []; for (let i = 0; i < n; i++) { const x = rr(X + 192, X + 310), z = rr(z0, z1); if (x > X + 208 && x < X + 212.4) continue; const k = sstep(X + 225, X + 262, x);
        list.push([x, groundY(x), z, rnd() < 0.7 ? 'grass' : rnd() < 0.6 ? 'dry' : 'seed', rr(0.4, 1.1) * (1 - 0.3 * k), new THREE.Color(pick([0x4c5c3c, 0x56664a, 0x5f6a48])).lerp(new THREE.Color(0x8a8458), 0.6 * k)]); }
      plants(R, list); yield;
    }
    // 水渠：一道浅水，天光照在上面
    v.water = add(R, new THREE.PlaneGeometry(3.9, 26), own(new THREE.MeshBasicMaterial({ color: 0x4a5a76, transparent: true, opacity: 0.6, fog: true })), X + 210.25, 0.95, -5, false); v.water.rotation.x = -Math.PI / 2;
    for (const [x, z, s] of [[X + 207.2, -1.4, 0.5], [X + 213.4, 1.6, 0.6], [X + 236, -2.2, 0.8], [X + 258, 2.4, 0.7], [X + 268.5, -1.8, 0.9]]) rock(R, x, z, s, { moss: 0.3 });
    yield;
    // 回头看见的那片谷地：平原上一座工厂，一根烟囱，围墙上一排灯；一条路从右边远处通到大门。平时不画，到了坡顶才慢慢显出来
    v.valley = backdrop(X + 110, X + 340, -6, 60, VZ, 4, g => {
      setInk(g, '#2a3138'); ridge(g, X + 110, X + 340, -6, x => 3.2 + 1.2 * Math.sin(ex(x) * 0.03) + 0.6 * Math.sin(ex(x) * 0.11), 3);
      g.save(); g.translate(FX, FY); g.scale(SC, SC); g.translate(-FX, -FY);
      setInk(g, '#12161b');
      box(g, FX - 34, FY, 68, 7.5); box(g, FX - 28, FY + 7.5, 22, 5); box(g, FX + 2, FY + 7.5, 26, 3.4); box(g, FX - 44, FY, 96, 3.2);            // 厂房、围墙
      for (let x = FX - 26; x < FX + 26; x += 6.5) poly(g, [[x, FY + 12.5], [x + 3.2, FY + 15], [x + 3.2, FY + 12.5]]);                           // 锯齿形的屋顶
      box(g, FX - 9, FY, 4.2, 34); box(g, FX - 9.6, FY + 33, 5.4, 1.2); box(g, FX + 22, FY, 2.6, 20);                                             // 烟囱
      for (const x of [FX - 40, FX - 12, FX + 30, FX + 50]) { box(g, x, FY, 2.2, 6.5); poly(g, [[x - 0.8, FY + 6.5], [x + 3, FY + 6.5], [x + 1.1, FY + 8.2]]); }   // 岗楼
      g.fillStyle = '#c9b48a'; for (let x = FX - 42; x < FX + 52; x += 4.6) g.fillRect(x, FY + 2.2, 0.5, 0.5);                                    // 围墙上的灯
      g.fillStyle = '#8a7c66'; for (let i = 0; i < 26; i++) g.fillRect(FX - 30 + rr(0, 58), FY + 3.6 + rr(0, 6), 0.8, 0.5);
      g.strokeStyle = '#3a4048'; g.lineWidth = 0.9; g.beginPath(); g.moveTo(X + 112, FY + 3.2); g.quadraticCurveTo(FX - 60, FY - 0.9, FX + 50, FY - 0.6); g.stroke();   // 路：从左边远处过来，贴着围墙外面通到大门
      g.restore();
    }, { fog: false });
    v.valley.material.opacity = 0;
    v.smoke = [0, 1, 2, 3, 4, 5, 6].map(i => { const s = new THREE.Sprite(own(new THREE.SpriteMaterial({ map: GLOW, color: 0x3a3f48, opacity: 0, depthWrite: false, fog: false }))); s.renderOrder = Math.round(VZ * 4) + 2; R.add(s); return s; });
    v.cars = [0, 1, 2, 3, 4, 5, 6].map(() => glow(R, 0xffe2b0, 2.6, 0, 0, 0, VZ + 1)); for (const c of v.cars) c.renderOrder = Math.round(VZ * 4) + 3;
    v.glowF = glow(R, 0xffb070, 34, 0, FX - 2, FY + 4, VZ + 0.3, GLOW_SOFT); v.glowF.renderOrder = Math.round(VZ * 4) + 1;
    V = v;
  }
  function update(dt) {
    const play = state === 'play';
    if (S.st === 0 && play && P.grounded && P.x > TOP - 1) { S.st = 1; S.t = 0; ctl = false; autoDir = 1; }
    if (S.st === 1) {
      const t = S.t += dt; TIRED.rushT = 0;
      if (P.x > TOP + 1.6 || t > 2.5) autoDir = 0;
      if (t > 2.6) P.facing = -1;                                              // 回头
      const k = sstep(2.2, 10, t);
      camOvr = { d: lerp(21, 46, k), yo: lerp(2.2, 5.2, k), xo: lerp(1, -19, k) - cam.look };
      if (t > 15 && !S.shown && (play || state === 'end')) { S.shown = true; showEndBare(ZONE, false); }
    }
    const v = V; if (!v) return;
    const k = S.st === 1 ? sstep(1.8, 6.5, S.t) : 0;
    v.valley.material.opacity = k; v.valley.visible = k > 0.001; v.glowF.material.opacity = 0.28 * k;
    v.smoke.forEach((s, i) => { const u = (T * 0.035 + i / 7) % 1; s.position.set(vx(FX - 6.9 + 26 * u * u + 2 * Math.sin(T * 0.2 + i)), vy(FY + 35 + 30 * u), VZ + 0.5); s.scale.setScalar((7 + 30 * u) * SC); s.material.opacity = 0.75 * k * Math.sin(Math.PI * u) ** 0.6; });
    v.cars.forEach((c, i) => {                                                  // 一串车灯：沿着那条路，从右边远处往大门开
      const u = (T * 0.012 + i * 0.07) % 1, a = 1 - u, x = u * u * (FX + 50) + 2 * a * u * (FX - 60) + a * a * (X + 112), y = u * u * (FY - 0.6) + 2 * a * u * (FY - 0.9) + a * a * (FY + 3.2);
      c.position.set(vx(x), vy(y + 0.7), VZ + 1); c.material.opacity = 0.95 * k * sstep(0, 0.04, u) * sstep(1, 0.96, u);
    });
  }
  function reset() { Object.assign(S, { st: 0, t: 0, shown: false }); }
  function retry() {                                     // 结局画面上按 R：从坡脚再走一遍
    reset(); placePlayer(X + 240); P.cp = cpAt(P.x); ctl = true; autoDir = 0; state = 'play'; camOvr = null; $('end').classList.add('hide'); snapCamera();
  }
  const ZONE = defZone({ n: 8, vis: [X + 186, X + 330], build, update, reset, solve() { reset(); }, retry, unbuild() { V = null; }, S });
  return ZONE;
})();
// 《逃出工厂》到这里载完。关卡随机数拨回到这几章载入之前（见 60-kit.js 的 ESC_SEED），后面旧原型的章节和单独拼的时候拿到一样的随机数
_seed = ESC_SEED;
