// ============================================================
//  工厂深处（第 25–36 章，2026-11-16）：十二个试验场景共用的东西
//  一组“恐怖工厂”的灰模：冒泡的绿色药水、暗红的沉淀池、熔渣、漏液、晾衣场、冷库、停电的车间、敲铃的地方……
//  接在第 24 章“水下实验室”后面，从第 25 章起每章占 130 米（x = 3000 起），章与章之间用“雾里的路”接起来（20-world.js 的 chapterExit）。
//  这一组的文件名是 69-h01 … 69-h12（h 排在 ch 后面，拼页面时在旧原型和试验关后面），章节号是 HN(k) = OLD + 17 + k。
//  讲法照《逃出工厂》的规矩（design/environmental-escape-story.md 第二节）：只讲看得见的东西，没有带字的招牌，远看靠剪影、颜色和光
//  这个文件里：每章的骨架（hChapter）、一池会冒泡的液体（ooze）、拿手电扫的看守（hWatch）、几样声音
// ============================================================
const HX0 = 3000, HSTEP = 130;
const hX = k => HX0 + HSTEP * k;                      // 第 25 + k 章的原点
const HN = k => OLD + 17 + k;                         // 第 25 + k 章的章节号
const HLAST = 11;                                     // 一共十二章：k = 0 … 11

// ---- 每章的骨架：登记章节、两头的空气墙、出口的雾 ----
// o：name / sub / ground 脚下默认的声音 / len 这一章多长（空气墙在 X + len）/ tint 出口那段雾的颜色 / start 出生点（相对 X）
function hChapter(k, o) {
  const X = hX(k), n = HN(k), len = o.len ?? 60;
  const c = chapter({ n, x0: X - 10, start: X + (o.start ?? 2), name: o.name, sub: o.sub, ground: o.ground ?? 'concrete', enter: o.enter ?? [X - 6.5, X + 0.5], grp: 'deep',
    intro() { CAT.state = 'none'; if (o.intro) o.intro(); } });
  solid({ x1: X - 8.6, x2: X - 7.6, y1: -30, y2: 40, noclimb: true });
  solid({ x1: X + len, x2: X + len + 1, y1: -30, y2: 40, noclimb: true });
  if (k < HLAST) chapterExit(n, { a0: X + len - 13, a1: X + len - 1.2, tint: o.tint ?? 0x0a0d0f, when: o.when ?? null });
  BIRDS[n] = [['bird', 0]];                             // 厂房里没有鸟
  return c;
}
// 一章的环境：在章首和章尾各登记一次（fresh：不接着前一章的光）。base 是这一组共用的“厂房里”的底子
const H_IN = { fogD: 0.03, hemiI: 0.45, keyI: 0.25, rimI: 0.35, dustO: 0.35, wind: 0.02, ext: 0, sunP: 0, stars: 0, cloud: 0, birds: 0, flies: 0, vig: 1.15,
  aWind: 0, aWhis: 0.1, aLeaf: 0, aBug: 0, aDrip: 0.3, aFlow: 0, aRoom: 0.8, roomF: 120, aHum: 0.3, aCity: 0, aFar: 0.7, rvOut: 0, rvHall: 1, rvCave: 0 };
function hEnv(k, o, len = 60) { const X = hX(k), e = { ...H_IN, ...o }; env(X - 12, e, true); env(X + len + 2, e); return e; }

// ---- 声音 ----
Object.assign(sfx, {
  sizzle: (v = 1) => { hit(3200, 0.4, 0.22 * v, 1.1); hit(900, 0.6, 0.18 * v, 0.6); snd('gurgle', { gain: 0.5 * v, rate: 0.7, wet: 0.7 }); },        // 掉进药水、熔渣里
  burn: (v = 1) => { hit(5200, 0.5, 0.2 * v, 0.5); hit(1800, 0.8, 0.12 * v, 0.3); },                                                                   // 一滴落在身上
  hplop: (v = 1) => { snd('plop', { bus: 'amb', gain: 0.22 * v, rate: 0.55 + 0.3 * Math.random(), wet: 0.9 }); },                                   // 液面上冒一个泡
  bigplop: (v = 1) => { snd('plop', { bus: 'amb', gain: 0.5 * v, rate: 0.35, wet: 1.2 }); tone(80, 40, 0.15 * v, 0.6); },                          // 一个大泡
  hbell: (v = 1) => fx('ebell', v),
  hiss: (v = 1) => { hit(6000, 0.3, 0.12 * v, 0.9); hit(2500, 0.5, 0.06 * v, 1.2); },
  crack: (v = 1) => { hit(2400, 2, 0.3 * v, 0.12); hit(500, 1, 0.25 * v, 0.2); hit(4000, 3, 0.15 * v, 0.06, 'bandpass', 0.08); },
  shatter: (v = 1) => { for (let i = 0; i < 6; i++) hit(2000 + 3000 * Math.random(), 3, 0.18 * v, 0.15, 'bandpass', i * 0.05); hit(200, 0.6, 0.5 * v, 0.8, 'lowpass'); },
  rush: (v = 1) => { hit(300, 0.4, 0.5 * v, 2.6, 'lowpass'); hit(1200, 0.5, 0.2 * v, 2.2); },
  grind: (v = 1) => { tone(60, 55, 0.12 * v, 0.5, 'sawtooth'); hit(300, 2, 0.1 * v, 0.4); },
});

// ============================================================
//  一池液体：表面一层慢慢翻动的光（自己发光，场景再暗也看得清），靠镜头那一面切开，看得见里面的深度和往上冒的泡；
//  液面上一层同色的低雾，隔一会儿冒一个泡，偶尔冒一个特别大的
//  kind：green 绿色药水 / blood 暗红 / lava 熔渣（表面结黑壳）/ sludge 灰褐的污泥 / murk 浑浊的黄绿
//  o：x1, x2 左右 / y 液面高度（可以是函数：涨起来的液面）/ bot 池底 / z1, z2 前后（z2 是靠镜头那一面）/ rate 每秒冒几个泡 / big 大泡的机会
// ============================================================
const OOZE_KIND = {
  green: { c: 0x1d4a12, g: 0x9cff3a, glow: 1.0, fog: 0x63ff2a, light: 0x7dff3c },
  blood: { c: 0x2a0406, g: 0x8a1410, glow: 0.55, fog: 0x7a0e0c, light: 0xff3a2a },
  lava: { c: 0x1a0802, g: 0xff7a1a, glow: 1.3, fog: 0xff5a10, light: 0xff6a20, crust: 1 },
  sludge: { c: 0x1e1a12, g: 0x5c5236, glow: 0.35, fog: 0x4a4430, light: 0x9a8a5a },
  murk: { c: 0x23301c, g: 0x8fa85a, glow: 0.6, fog: 0x7a9a50, light: 0xb8d070 },
};
const OOZE_VS = `varying vec3 vW; void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const OOZE_NOISE = `
  float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
    return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
  float fbm(vec2 p) { float s = 0., a = .5; for (int i = 0; i < 4; i++) { s += a * vn(p); p = p * 2.03 + 1.7; a *= .5; } return s; }`;
const OOZE_FOG = `float fd = length(vW - cameraPosition); float ff = 1. - exp(-uFogD * uFogD * fd * fd); col = mix(col, uFogC, clamp(ff, 0., 1.));`;
function oozeMat(kd, side) {
  const u = { uT: { value: 0 }, uC: { value: new THREE.Color(kd.c) }, uG: { value: new THREE.Color(kd.g) }, uGlow: { value: kd.glow }, uCrust: { value: kd.crust ?? 0 },
    uFogC: { value: new THREE.Color() }, uFogD: { value: 0 }, uTop: { value: 0 }, uBot: { value: -3 } };
  const fs = side ? `
    uniform float uT, uGlow, uFogD, uTop, uBot; uniform vec3 uC, uG, uFogC; varying vec3 vW; ${OOZE_NOISE}
    void main() {                                   // 切开的那一面：越往下越暗，靠近液面那一条最亮；里面一缕一缕慢慢往上翻
      float d = clamp((uTop - vW.y) / max(.1, uTop - uBot), 0., 1.);
      float n = fbm(vec2(vW.x * .8, vW.y * 1.4 - uT * .25));
      vec3 col = mix(uG * uGlow, uC, smoothstep(0., .5, d)) * (.75 + .5 * n);
      col += uG * uGlow * .9 * smoothstep(.08, 0., uTop - vW.y);
      col *= 1. - .55 * d;
      ${OOZE_FOG}
      gl_FragColor = vec4(col, 1.);
    }` : `
    uniform float uT, uGlow, uFogD, uCrust; uniform vec3 uC, uG, uFogC; varying vec3 vW; ${OOZE_NOISE}
    void main() {                                   // 液面：两层噪声错开着慢慢流，亮的地方是翻上来的
      vec2 p = vW.xz * .55;
      float n = fbm(p + vec2(uT * .04, uT * .025)), m = fbm(p * 2.3 - vec2(uT * .06, -uT * .03));
      float k = smoothstep(.35, .9, n * .7 + m * .45);
      vec3 col = mix(uC, uG, k) * mix(1., uGlow * 1.4, k);
      if (uCrust > .5) {                            // 熔渣：大片结成黑壳，裂缝里透出橙红
        float c = fbm(p * 1.3 + uT * .01), cr = smoothstep(.04, 0., abs(fract(fbm(p * 3.1) * 5.) - .5) - .45);
        col = mix(col, vec3(.05, .03, .02), smoothstep(.45, .6, c)) + uG * cr * smoothstep(.45, .7, c) * .8;
      }
      ${OOZE_FOG}
      gl_FragColor = vec4(col, 1.);
    }`;
  const m = new THREE.ShaderMaterial({ uniforms: u, vertexShader: OOZE_VS, fragmentShader: fs, side: THREE.DoubleSide });
  m.userData.own = true; return m;
}
let BUBBLE_TEX = null;
function bubbleTex() {                                 // 一个泡：边上一圈亮，中间半透，左上一点高光
  if (BUBBLE_TEX) return BUBBLE_TEX;
  const [c, g] = mkCanvas(128, 128), gr = g.createRadialGradient(64, 64, 20, 64, 64, 62);
  gr.addColorStop(0, 'rgba(255,255,255,.18)'); gr.addColorStop(0.78, 'rgba(255,255,255,.35)'); gr.addColorStop(0.92, 'rgba(255,255,255,.95)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.beginPath(); g.arc(64, 64, 62, 0, 6.2832); g.fill();
  g.fillStyle = 'rgba(255,255,255,.9)'; g.beginPath(); g.ellipse(46, 42, 12, 7, -0.6, 0, 6.2832); g.fill();
  return BUBBLE_TEX = sharedTex(canvasTex(c));
}
// 登记一池（在章节文件的最外层调：掉进去算死，回到存档点）。返回的对象在 build 里调 .build(R)，每帧调 .step(dt)
function ooze(o) {
  const kd = OOZE_KIND[o.kind ?? 'green'], Y = typeof o.y === 'function' ? o.y : () => o.y;
  const P0 = { ...o, kd, Y, z1: o.z1 ?? -6, z2: o.z2 ?? 1.6, bot: o.bot ?? -3, rate: o.rate ?? 1.2, big: o.big ?? 0.06, V: null, splashes: [] };
  if (!o.safe) pit({ x1: o.x1, x2: o.x2, y: () => Y() + (o.pad ?? -0.15), sfx: o.sfx ?? 'sizzle', when: o.when, on() { P0.plunge(P.x); if (o.on) o.on(); } });
  if (o.light !== false) P0.light = pointLight({ p: [(o.x1 + o.x2) / 2, Y() + 1.2, (P0.z1 + P0.z2) / 2 + 1], c: kd.light, i: o.li ?? 2.2, d: o.ld ?? Math.max(10, (o.x2 - o.x1) * 0.9), dec: 1.2 });
  P0.build = R => {
    const v = { bub: [], haze: [] }, w = o.x2 - o.x1, d = P0.z2 - P0.z1, y = Y();
    v.top = add(R, o.circle ? new THREE.CircleGeometry(o.circle, 72) : new THREE.PlaneGeometry(w, d, 1, 1), oozeMat(kd, false), (o.x1 + o.x2) / 2, y, (P0.z1 + P0.z2) / 2, false); v.top.rotation.x = -Math.PI / 2;   // circle：圆的池子（半径）
    if (o.cut !== false) {                             // 靠镜头的那一面：切开的剖面，像隔着一层玻璃看进池子里
      v.side = add(R, new THREE.PlaneGeometry(w, 1, 1, 1), oozeMat(kd, true), (o.x1 + o.x2) / 2, 0, P0.z2, false);
      v.rim = add(R, bx(w + 0.3, 0.12, 0.25), MAT.dark, (o.x1 + o.x2) / 2, y, P0.z2 + 0.1);
    }
    const bm = new THREE.SpriteMaterial({ map: bubbleTex(), color: kd.g, transparent: true, depthWrite: false, fog: false });
    for (let i = 0; i < (o.nb ?? 22); i++) { const s = new THREE.Sprite(bm.clone()); s.visible = false; s.renderOrder = 41; R.add(s); v.bub.push({ s, t: 9, life: 1 }); }
    for (let i = 0; i < (o.nh ?? Math.ceil(w / 3)); i++) {
      const s = glow(R, kd.fog, rr(3, 5.5), 0.12, rr(o.x1, o.x2), y + 0.5, rr(P0.z1 + 1, P0.z2 - 0.5), GLOW_SOFT); s.renderOrder = 42; s.material.blending = THREE.NormalBlending;
      v.haze.push({ s, x0: s.position.x, ph: rr(0, 6.28), sp: rr(0.1, 0.3) });
    }
    v.rise = [];                                        // 剖面里往上升的小泡
    if (o.cut !== false) for (let i = 0; i < (o.nr ?? Math.ceil(w * 1.2)); i++) { const s = new THREE.Sprite(bm.clone()); s.material.opacity = 0.7; s.renderOrder = 43; R.add(s); v.rise.push({ s, x: rr(o.x1 + 0.2, o.x2 - 0.2), y: rr(o.bot, y), v: rr(0.25, 0.8), r: rr(0.05, 0.16) }); }
    P0.V = v;
  };
  P0.unbuild = () => { P0.V = null; };
  P0.burst = (x, k = 1, z) => {                         // 在 x 冒一个泡（k > 1 是大泡）
    const v = P0.V; if (!v) return;
    const b = v.bub.find(b => b.t >= b.life); if (!b) return;
    Object.assign(b, { t: 0, life: rr(0.8, 1.3) * (0.7 + 0.5 * k), x, z: z ?? rr(P0.z1 + 0.6, P0.z2 - 0.4), r: rr(0.18, 0.35) * k, k });
    if (Math.abs(x - P.x) < 14) fx(k > 1.5 ? 'bigplop' : 'hplop', k > 1.5 ? 1 : 0.6);
  };
  P0.plunge = x => { for (let i = 0; i < 6; i++) P0.burst(x + rr(-0.6, 0.6), rr(0.6, 1.4), rr(-0.4, 0.6)); };   // 有东西掉进去：一串泡
  P0.step = dt => {
    const v = P0.V, y = Y();
    if (P0.light) P0.light.p[1] = y + 1.2;
    if (!v) return;
    v.top.position.y = y;
    for (const m of [v.top.material, v.side?.material]) if (m) { const u = m.uniforms; u.uT.value = T; u.uFogC.value.copy(scene.fog.color); u.uFogD.value = scene.fog.density; u.uTop.value = y; u.uBot.value = o.bot ?? -3; }
    if (v.side) { const h = Math.max(0.05, y - P0.bot); v.side.scale.y = h; v.side.position.y = P0.bot + h / 2; v.rim.position.y = y + 0.04; }
    if (Math.random() < P0.rate * dt) P0.burst(rr(o.x1 + 0.4, o.x2 - 0.4), Math.random() < P0.big ? rr(2.4, 3.4) : rr(0.6, 1.2));
    for (const b of v.bub) {
      if (b.t >= b.life) { b.s.visible = false; continue; }
      b.t += dt; const k = b.t / b.life, pop = k > 0.86;
      b.s.visible = !pop || k < 0.95; b.s.position.set(b.x, y + b.r * 0.35 * sstep(0, 0.6, k), b.z);
      b.s.scale.setScalar(b.r * 2 * (pop ? lerp(1.15, 1.6, (k - 0.86) / 0.14) : sstep(0, 0.8, k) * (1 + 0.04 * Math.sin(T * 9))));
      b.s.material.opacity = pop ? 0.6 * (1 - (k - 0.86) / 0.14) : 0.85;
    }
    for (const h of v.haze) { h.s.position.set(h.x0 + 1.2 * Math.sin(T * h.sp + h.ph), y + 0.45 + 0.12 * Math.sin(T * 0.7 + h.ph), h.s.position.z); h.s.material.opacity = (o.haze ?? 0.13) * (0.7 + 0.3 * Math.sin(T * 0.5 + h.ph)); }
    for (const r of v.rise) {
      r.y += r.v * dt; r.x += 0.05 * Math.sin(T * 3 + r.v * 20) * dt;
      if (r.y > y - 0.05) { r.y = P0.bot + rr(0, 0.3); r.x = rr(o.x1 + 0.2, o.x2 - 0.2); }
      r.s.position.set(r.x, r.y, P0.z2 + 0.02); r.s.scale.setScalar(r.r * 2); r.s.visible = r.y > P0.bot;
    }
  };
  return P0;
}
// 池壁：池子左右两道矮墙（玩法里是池边），后面一道墙，底下一块底板。只是样子
function poolShell(R, p, o = {}) {
  const m = o.mat ?? MAT.concrete, top = o.top ?? 0, bot = p.bot - 0.3, d = p.z2 - p.z1;
  add(R, bx(p.x2 - p.x1, 0.3, d), m, (p.x1 + p.x2) / 2, bot + 0.15, (p.z1 + p.z2) / 2);
  add(R, bx(p.x2 - p.x1 + 0.6, top - bot, 0.4), m, (p.x1 + p.x2) / 2, (top + bot) / 2, p.z1 - 0.2);
  for (const x of [p.x1 - 0.25, p.x2 + 0.25]) add(R, bx(0.5, top - bot, d + 0.2), MAT.dark, x, (top + bot) / 2, (p.z1 + p.z2) / 2 - 0.1);   // 左右两面是剖开的池壁：黑的，和前面切开的液体齐平
}

// ============================================================
//  拿手电扫的看守：站在路后面（或者高处的走道上），手电的光斑沿着主角走的那条线来回扫。
//  rule：'move' 照到身上时在动才算被看见（站住就没事）/ 'any' 照到就算（要躲在影子里，或者 hidden() 说藏好了）
//  o：gx, gy, gz 人站在哪 / l0, l1 光斑扫的范围 / sp 扫多快 / r 光斑多大 / hold 两头停多久 / hidden() 这一刻算不算藏好了 / when() 什么时候在扫
//  W：{ ex, caught }（和 escape/60-kit.js 的 watchStep 一样）。光斑的位置在 lx，照不照得到主角在 hit
// ============================================================
const hMoving = () => Math.abs(P.vx) > 0.35 || !P.grounded || P.mode === 'mantle' || P.mode === 'push';
function hWatch(o) {
  const w = { ...o, lx: o.lx0 ?? o.l0, dir: 1, wait: 0, on: 0, W: { ex: 0, caught: 0 }, hit: false, lock: 0, f: null, vis: null, sp: o.sp ?? 1.6, r: o.r ?? 1.1, hold: o.hold ?? 1.2, rule: o.rule ?? 'move' };
  w.reset = () => { Object.assign(w, { lx: o.lx0 ?? o.l0, dir: 1, wait: 0, hit: false, lock: 0 }); w.W.ex = 0; w.W.caught = 0; };
  w.lamp = () => V3(w.gx + (w.f ? w.f.face * 0.3 : 0.3), w.gy + 1.45, w.gz + 0.2);
  w.build = (R, crowd) => {
    w.f = crowd.add(fig('guard', w.gx, { y: w.gy, z: w.gz, face: 1, act: 'point', turn: 0.5 }));
    w.vis = { cone: mkCone(R, 0.13, { c: 0xdfe8ea, op: 0.16 }), core: glow(R, 0xffffff, 0.4, 0.8), glare: glow(R, 0xe8eef0, 1.6, 0.4, 0, 0, 0, GLOW_SOFT),
      spot: (() => { const m = add(R, new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: GLOW_SOFT, color: 0xdfe8ea, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }), 0, 0, 0, false); m.rotation.x = -Math.PI / 2; m.renderOrder = 44; return m; })() };
  };
  w.unbuild = () => { w.f = null; w.vis = null; };
  // 每帧：play 这一刻能不能被看见；返回这一帧的曝光
  w.step = (dt, play) => {
    const active = !w.when || w.when();
    w.on = damp(w.on, active ? 1 : 0, 3, dt);
    if (active) {
      if (w.W.ex > 0.15 && w.hit) w.lx = damp(w.lx, P.x, 3, dt);                     // 照到了在动的东西：光斑跟过去
      else if (w.wait > 0) w.wait -= dt;
      else if (w.path) w.lx = w.path(T, w);                                            // 自己写的扫法
      else { w.lx += w.dir * w.sp * dt; if (w.lx > w.l1) { w.lx = w.l1; w.dir = -1; w.wait = w.hold; } if (w.lx < w.l0) { w.lx = w.l0; w.dir = 1; w.wait = w.hold; } }
    }
    const ty = w.ty ? w.ty(w.lx) : floorY(w.lx, P.y + 0.5);
    w.ty0 = ty;
    w.hit = play && active && w.on > 0.5 && Math.abs(P.x - w.lx) < w.r && Math.abs(P.y - ty) < 2.2 && !(w.hidden && w.hidden());
    const seen = w.hit && (w.rule === 'any' || hMoving());
    return watchStep(w.W, seen, dt, o.up ?? 0.55, 0.9);
  };
  w.draw = (best) => {                                   // best：这一盏用带影子的真灯
    const v = w.vis; if (!v || !w.f) return;
    const L = w.lamp(), on = w.on, tx = w.lx, ty = w.ty0 ?? 0, tz = 0;
    w.f.face = tx > w.gx ? 1 : -1; w.f.tx = tx; w.f.ty = ty; w.f.dirty = true;
    v.cone.m.visible = v.core.visible = v.glare.visible = v.spot.visible = on > 0.02;
    v.cone.aim(L.x, L.y, L.z, tx, ty, tz); v.cone.m.material.opacity = 0.16 * on;
    v.core.position.copy(L); v.glare.position.copy(L); v.core.material.opacity = 0.8 * on; v.glare.material.opacity = 0.4 * on;
    const col = v.cone.m.material.color.lerpColors(C_CALM, C_ALERT, sstep(0.1, 1, w.W.ex));
    v.spot.position.set(tx, ty + 0.03, tz); v.spot.scale.setScalar(w.r * 3.2); v.spot.material.opacity = 0.55 * on; v.spot.material.color.copy(col); v.glare.material.color.copy(col);
    if (best) useBeam(L.x, L.y, L.z, tx, ty, tz, { ang: 0.14, pen: 0.5, i: 26 * on, alert: sstep(0.1, 1, w.W.ex) });
  };
  return w;
}
// 几个看守一起：每帧走一遍，曝光取最大的那个；离主角最近的那一盏用带影子的真灯
function hWatchAll(list, dt, play) {
  let ex = 0, best = null, bd = 1e9;
  for (const w of list) { ex = Math.max(ex, w.step(dt, play)); const d = Math.abs(w.lx - P.x); if (w.on > 0.05 && d < bd) { bd = d; best = w; } }
  for (const w of list) w.draw(w === best && bd < 25);
  HX.alert = ex;
  return ex;
}

// ---- 一些小零件 ----
// 一段管子：从 (x1, y1) 到 (x2, y2)，在 z
function pipe(R, x1, y1, x2, y2, z, r = 0.12, mat = MAT.steel) {
  const L = Math.hypot(x2 - x1, y2 - y1), m = add(R, cy(r, r, L, 10), mat, (x1 + x2) / 2, (y1 + y2) / 2, z);
  m.rotation.z = Math.atan2(x1 - x2, y2 - y1); return m;
}
// 一段格栅走道：只是样子（玩法另外登记 solid）
function grating(R, x1, x2, y, z1 = -0.9, z2 = 0.9, mat = MAT.steel) {
  add(R, bx(x2 - x1, 0.06, z2 - z1), mat, (x1 + x2) / 2, y - 0.03, (z1 + z2) / 2);
  for (const z of [z1, z2]) { add(R, bx(x2 - x1, 0.05, 0.05), mat, (x1 + x2) / 2, y + 1.0, z, false); add(R, bx(x2 - x1, 0.04, 0.04), mat, (x1 + x2) / 2, y + 0.5, z, false);
    for (let x = x1; x <= x2 + 0.01; x += 1.5) add(R, bx(0.05, 1.0, 0.05), mat, x, y + 0.5, z, false); }
}
// 一套“厂房里”的背景：后墙、中景的柱子和管束、近处的柱子、前景的黑剪影（借 escape/60-kit.js 的 hallLayers）
function hHall(X, len, pal, o = {}) { hallLayers(X - 14, X + len + 6, pal, { cols: o.cols ?? [X + 6, X + len * 0.5, X + len - 6], fore: o.fore ?? [X + 14, X + len * 0.62], lamps: o.lamps ?? [], ...o }); }
// 给一个“小人”换衣服的颜色（比如从药水里提上来，换成灰色）
function figRecolor(C, f, col) {
  Object.assign(f.col, col); const i = f.ci, set = (k, j, hex) => C.I[k].setColorAt(j, _fc.set(hex));
  set('torso', i, f.col.top); set('pelvis', i, f.col.leg); set('head', i, f.col.skin); set('hair', i, f.col.hair);
  for (let s = 0; s < 2; s++) { const j = 2 * i + s; set('uarm', j, f.col.arm); set('farm', j, f.col.fore); set('hand', j, f.col.skin); set('thigh', j, f.col.leg); set('shin', j, f.col.shin); set('shoe', j, f.col.shoe); }
  for (const k in C.I) if (C.I[k].instanceColor) C.I[k].instanceColor.needsUpdate = true;
}
const GRAY_COL = { top: 0x727877, leg: 0x666c6b, arm: 0x727877, fore: 0x727877, shin: 0x666c6b, shoe: 0x2b2d2f };
// 站在方块 s 上的人跟着它横着挪 dx（漂着的东西、传送带）
function carryOn(s, dx) { if (standingOn(s) && P.mode === 'normal') { const nx = P.x + dx; if (!sideHit(nx, P.y)) P.x = nx; } }
// 剖面：地面只铺到 z = 1.8，靠镜头那一面是一道黑的切口（和液体切开的那一面一样，整章像一个剖开的模型）。
// hCut 在章节文件的最外层、各章自己的 groundFront 后面调（先登记的优先）；hCutFace 在 build 里调，画出那道黑面
const H_CUT = 1.8;
function hCut(x1, x2) { groundFront(x1, x2, H_CUT); }
function hCutFace(R, x1, x2, top = 0, deep = 8) { add(R, bx(x2 - x1, deep, 0.3), MAT.black, (x1 + x2) / 2, top - deep / 2 - 0.005, H_CUT + 0.15, false); }
