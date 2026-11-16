
// ============================================================
//  第八章 · 雾（2026-11-16 加的一章；游戏里的第 7 章，排在大门和结尾中间）
//  出了林子，路往山上去，起了雾。工厂放出来的看守打着手电，从山下一个一个跟上来，在雾里往上搜；狗在远处叫。
//  规矩：雾里的手电照不清人，只看得见动的东西 —— 光照到身上时站住别动，就和雾里的石头、枯树一样；在光里走、跑、跳，就被盯上，盯满了被抓。
//    劳动车间里铃一响要站住，是为了和他们一样；这里站住，是为了什么都不像。
//  看到的：半路上，一块石头后面蹲着另一个逃出来的人，穿着自己的衣服。灯扫过来，他跳起来就跑，几盏灯一齐落到他身上；
//    他站住、举起手。两个看守把他夹在中间，从主角身后押下山去，往工厂的方向。
//    （第七章拉开过囚车的锁扣，他就是那时候跑进野地里的人之一，衣服的颜色对得上；没拉开，他就是别处逃出来的一个人）
//  怎么通过：一 上坡，一个看守的手电沿路来回扫，中间横着一棵倒下的枯树要跳过去；二 那个人被押走，押他的两盏灯从身后扫过来；
//    三 一道旧的干砌石墙（跳一下就过去），前后两个看守，一个在路后面，一个在高处，两盏灯交错着扫。过了这一段，路往下走，出了雾就是结尾那片野地
//  留下的问题：被押回去的人会怎么样？（玩家已经知道）还有多少人没跑掉？—— 结尾：天亮时回头看，又一串车灯开进大门
//  画面照 design/visual-style.md（雾里的剪影，“墙”那一章（src/69-ch14-wall.js）试出来的；着色的写法照“夜搜”那一章（src/69-ch11-heli.js）那一份抄过来，改成跟着一条前后弯的路）：
//    光只给孩子周围；近处没有理由地黑；远处被浅灰的雾抬亮、吞掉；颜色几乎去掉，只留孩子自己的衣服、那个人的衣服、落叶。手电不受这些管：照到哪里，哪里就亮
// ============================================================
const E8_L = 124;                                          // 这一章多长（米）。结尾整个往右挪了这么多（69-e9-ending.js）
const E8_X = E7_X + 196;                                   // 从大门那一章的林子尽头接下去
const E8 = (() => {
  const X = E8_X, END = X + E8_L;
  const C = chapter({ n: 7, x0: X, start: X + 2, name: '雾', sub: '光照过来，就别动', ground: 'gravel' });   // 游戏里的第 7 章
  // ---- 路：往上走到半山，再下来。前后弯一点（±2 米），高低起伏一点 ----
  const PZ_ = x => { const u = x - X; return sstep(3, 16, u) * (1 - sstep(E8_L - 16, E8_L - 3, u)) * (1.5 * Math.sin(u * 0.11 + 0.3) + 0.6 * Math.sin(u * 0.047 + 2.2)); };
  zpath(X, END, PZ_);
  const HY = x => { const u = x - X, k = clamp(u / E8_L, 0, 1); return 1.3 + 4.6 * Math.pow(Math.sin(Math.PI * k), 1.6) + sstep(4, 14, u) * (1 - sstep(E8_L - 14, E8_L - 4, u)) * (0.3 * Math.sin(u * 0.36 + 0.5) + 0.12 * Math.sin(u * 0.83 + 2.1)); };
  { const pts = []; for (let x = X; x <= END + 1e-3; x += 0.3) pts.push([x, HY(x)]); terrain(...pts); }
  ground(X, 0x2f3a2e); ground(END, 0x2f3a2e);
  groundFront(X, END, null);                                // 共用的地面这一段不铺：这一章自己铺（路两边要有起伏，远处要跟着雾）
  surface(X, END, 'gravel');
  // ---- 两处要跳的：一棵横在路上的倒树，一道旧的干砌石墙 ----
  const TX = X + 30, WX = X + 84, WH = 0.8;
  solid({ x1: TX - 0.27, x2: TX + 0.27, y1: -2, y2: groundY(TX) + 0.48, snd: 'wood' });
  solid({ x1: WX - 0.27, x2: WX + 0.27, y1: -2, y2: groundY(WX) + WH, snd: 'rock' });

  // ---- 地面的起伏（照“夜搜”的 DET，改成按离那条弯路多远算）：路面那一条是平的；路前面（往镜头这边）只往下走，沉在黑里；
  //   路后面是山坡，离路越远越高（看守走在上面，比路高一两米，往下照）。这一章两头收回 0，接上共用的地面 ----
  const RF = 1.7, RB = -1.9;
  const vh = (a, b) => { const t = Math.sin(a * 127.1 + b * 311.7 + 17.3) * 43758.5453; return t - Math.floor(t); };
  const vn2 = (x, z) => { const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz, u = fx * fx * (3 - 2 * fx), w = fz * fz * (3 - 2 * fz);
    return lerp(lerp(vh(ix, iz), vh(ix + 1, iz), u), lerp(vh(ix, iz + 1), vh(ix + 1, iz + 1), u), w); };
  const ENV8 = x => sstep(X, X + 14, x) * (1 - sstep(END - 14, END, x));
  const DET = (x, z) => {
    const zr = z - PZ_(x), e = ENV8(x); if (e <= 0) return 0;
    if (zr > RF) { const d = zr - RF, ridge = 1 - Math.abs(2 * vn2(x * 0.6 + 3, z * 0.7) - 1), amp = 0.25 + 0.25 * sstep(2, 9, d);
      const verge = 0.16 * sstep(0, 0.35, d) * (1 - sstep(1.0, 2.2, d)) * (1.5 * vn2(x * 1.3, z * 1.1 + 9) - 0.45);
      return e * (verge + sstep(0, 1.2, d) * Math.min(-0.1 * d, amp * (1.5 * (vn2(x * 0.32, z * 0.4) - 0.5) + 0.7 * (ridge - 0.5) + 0.35 * (vn2(x * 2.2, z * 2.4 + 5) - 0.5)) - 0.14 * d)); }
    if (zr < RB) { const d = RB - zr, A = 0.3 + 0.09 * Math.min(d, 60);
      const hills = A * (1.5 * (vn2(x * 0.05, z * 0.045) - 0.45) + 0.5 * (vn2(x * 0.17 + 3, z * 0.15) - 0.5) + 0.2 * (vn2(x * 0.8, z * 0.8 + 2) - 0.5));
      return e * sstep(0.8, 4.5, d) * Math.max(-0.2, Math.min(d * 0.13, 18) + hills); }
    return 0;
  };
  const gy = (x, z) => groundY(x) + DET(x, z);
  const pz = PZ_;

  // ---- 着色（照“夜搜”的 lite11 / haze11 / shade11 抄过来，改成跟着弯路）----
  // lite8：天光和月光在这一点还剩多少 —— 只照孩子周围两三米，跟着孩子走；往镜头这边两米之内压到纯黑，暗下去的边顺着地面起伏弯过去；往远处很快暗下去（交给雾）
  // haze8：浅灰的雾 —— 离路越远越被抬亮、越看不清。这一章的雾比“夜搜”浓：镜头近（十五米上下），十米开外的看守只剩影子，二三十米外的枯树只剩一层灰
  const HAZE = 0x41464b;
  const NU = { uT: { value: 0 }, uHX: { value: 0 }, uHY: { value: 0 }, uHaze: { value: new THREE.Color(HAZE) } };
  const haze8 = dz => { const d = (Math.max(0, dz) + 5) * 0.042; return 1 - Math.exp(-d * d); };
  const PZ_GL = `float pzf(float u) { return smoothstep(3., 16., u) * (1. - smoothstep(${(E8_L - 16).toFixed(1)}, ${(E8_L - 3).toFixed(1)}, u)) * (1.5 * sin(u * 0.11 + 0.3) + 0.6 * sin(u * 0.047 + 2.2)); }
    float haze8(vec3 q) { float d = (max(0., -(q.z - pzf(q.x))) + 5.) * 0.042; return (1. - exp(-d * d)) * mix(1., 0.75, smoothstep(14., 40., q.y)); }`;
  const v3 = h => { const c = new THREE.Color(h); return `vec3(${c.r.toFixed(4)}, ${c.g.toFixed(4)}, ${c.b.toFixed(4)})`; };
  const GL8 = `varying vec3 vWP; varying vec3 vWN; uniform float uT, uHX, uHY; uniform vec3 uHaze;
    float h21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
    float h31(vec3 p) { p = fract(p * vec3(.1031, .1030, .0973)); p += dot(p, p.yxz + 33.33); return fract((p.x + p.y) * p.z); }
    float n2(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
      return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
    float n3(vec3 p) { vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
      return mix(mix(mix(h31(i), h31(i + vec3(1, 0, 0)), f.x), mix(h31(i + vec3(0, 1, 0)), h31(i + vec3(1, 1, 0)), f.x), f.y),
                 mix(mix(h31(i + vec3(0, 0, 1)), h31(i + vec3(1, 0, 1)), f.x), mix(h31(i + vec3(0, 1, 1)), h31(i + vec3(1, 1, 1)), f.x), f.y), f.z); }
    float rockCrack(vec3 p) {
      vec3 i = floor(p), f = fract(p); float d1 = 9., d2 = 9.;
      for (int z = -1; z <= 1; z++) for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
        vec3 o = vec3(float(x), float(y), float(z)), r = o + vec3(h31(i + o), h31(i + o + 3.1), h31(i + o + 7.7)) - f; float d = dot(r, r);
        if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d;
      }
      return sqrt(d2) - sqrt(d1);
    }
    float rockH(vec3 q, float ck) { return 0.55 * n3(q * 7.) + 0.3 * n3(q * 19. + 2.) + 0.15 * n3(q * 48. + 5.) - 1.1 * ck; }
    ${PZ_GL}
    float lite8(vec3 q, float hy) {
      float qz = q.z - pzf(q.x), dz = max(0., -qz);
      float base = 0.05 + 0.95 * exp(-max(0., dz - 1.2) / 6.);
      base *= 1. - smoothstep(0.3, 2.8, qz - 3.5 * hy + 1.6 * (n2(q.xz * vec2(0.28, 0.4)) - .5) + 0.6 * (n2(q.xz * vec2(0.9, 1.1) + 3.) - .5) + 1.6 * (n2(vec2(q.x * 0.11, 7.)) - .5));   // 往镜头这边压黑；最后一项让暗下去的边沿着路一段段前后挪，不是一条直线
      float hx = q.x - uHX, pool = mix(0.1, 1., exp(-hx * hx / 9.)) * mix(1., 0.45, smoothstep(2.6, 7., q.y - uHY));   // 孩子周围两三米；比孩子高出很多的地方照不到多少
      return base * mix(pool, 1., smoothstep(6., 18., dz));
    }`;
  const SURF8 = [
    // 0 地面：山坡上的碎石土 —— 深浅大片慢慢变；近处有颗粒；凹处发暗、积着一点水（映出雾的灰白）
    `float fd = 1. - smoothstep(3., 26., max(0., -(q.z - pzf(q.x))) + max(0., q.z - pzf(q.x) - 6.));
    vec2 g = q.xz;
    float big = n2(g * 0.12) * 0.6 + n2(g * 0.45 + 3.) * 0.4, mid = n2(g * 1.7 + 1.3), fine = n3(vec3(g * 9., 0.5)), fine2 = n3(vec3(g * 31., 1.5));
    vec3 c = mix(${v3(0x3a3936)}, ${v3(0x5b5850)}, smoothstep(0.3, 0.8, big));
    c = mix(c, ${v3(0x2c2b28)}, smoothstep(0.55, 0.85, mid) * 0.5);
    c *= mix(1., 0.74 + 0.36 * fine + 0.22 * (fine2 - .5), fd);
    c = mix(c, ${v3(0x8a8d80)}, smoothstep(0.62, 0.8, n3(vec3(g * 3.5, 2.)) * 0.7 + n3(vec3(g * 13., 6.)) * 0.3) * 0.16);
    c = mix(c, c * 0.55, smoothstep(-0.03, -0.16, vDet));
    wet8 = smoothstep(-0.07, -0.2, vDet) * smoothstep(0.5, 0.72, n2(g * vec2(1.1, 1.6) + 4.));
    c = mix(c, c * 0.45, wet8);
    float steep8 = 1. - smoothstep(0.35, 0.8, normalize(vWN).y);
    c *= 1. - 0.4 * steep8 * (0.8 + 0.4 * n3(vec3(g * 9., q.y * 20.)));
    diffuseColor.rgb = c;`,
    // 1 石头：颗粒、小坑、地衣、雨水流下来的暗痕；表面的凹凸在 normal_fragment_maps 那一段里打
    `float fd = 1. - smoothstep(4., 24., max(0., -(q.z - pzf(q.x))));
    float ck8 = (1. - smoothstep(0., 0.03, rockCrack(q * vec3(1.1, 0.8, 1.1) + 11.))) * smoothstep(0.55, 0.75, n3(q * 0.9 + 4.)) * smoothstep(0.35, 0.6, n3(q * 3.5 + 1.));
    diffuseColor.rgb *= 1. - 0.55 * ck8 * (0.4 + 0.6 * fd);
    diffuseColor.rgb *= 0.92 + 0.08 * sin(q.y * 16. + q.x * 3. + q.z * 2. + n3(q * 2.) * 5.);
    float g1 = n3(q * 9.), g2 = n3(q * 31. + 2.), g3 = n3(q * 85. + 5.);
    diffuseColor.rgb *= mix(1., 0.74 + 0.34 * g1 + 0.2 * (g2 - .5) + 0.16 * (g3 - .5), 0.35 + 0.65 * fd);
    diffuseColor.rgb = mix(diffuseColor.rgb, ${v3(0x8f9284)}, smoothstep(0.62, 0.8, n3(q * 4.5 + 9.) * 0.7 + n3(q * 16. + 3.) * 0.3) * smoothstep(0.2, 0.7, vWN.y + 0.3) * 0.22);
    diffuseColor.rgb *= 1. - 0.3 * smoothstep(0.62, 0.86, n2(vec2((q.x + q.z) * 5., q.y * 0.9))) * (1. - smoothstep(0.5, 0.9, vWN.y));`,
    // 2 木头（倒树）：顺着树干的纹，一块块深浅不一
    'diffuseColor.rgb *= 0.78 + 0.3 * n2(vec2((q.x + q.z) * 30., q.y * 1.3)) + 0.12 * (n3(q * 9.) - .5);',
    // 3 其它：只跟着压暗
    '',
  ];
  const BUMP8 = `
    { float bh = rockH(q, ck8) * 0.014 * (0.25 + 0.75 * fd);
      vec3 sX = dFdx(-vViewPosition), sY = dFdy(-vViewPosition), N = normal, R1 = cross(sY, N), R2 = cross(N, sX); float det = dot(sX, R1);
      vec2 dH = vec2(dFdx(bh), dFdy(bh)); normal = normalize(abs(det) * N - sign(det) * (dH.x * R1 + dH.y * R2)); }`;
  const cacheKey = m => m.customProgramCacheKey === THREE.Material.prototype.customProgramCacheKey ? '' : m.customProgramCacheKey();
  function shade8(mat, kind, sat = 0.4) {
    mat.userData.own = true;
    const prev = mat.onBeforeCompile, pk = cacheKey(mat);
    mat.customProgramCacheKey = () => 'e8-' + kind + '-' + sat + pk;
    mat.onBeforeCompile = (sh, r) => {
      prev.call(mat, sh, r);
      sh.uniforms.uT = NU.uT; sh.uniforms.uHX = NU.uHX; sh.uniforms.uHY = NU.uHY; sh.uniforms.uHaze = NU.uHaze;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP; varying vec3 vWN;' + (kind === 0 ? ' attribute float aDet; varying float vDet;' : ''))
        .replace('#include <fog_vertex>', `#include <fog_vertex>
          vec4 wp8 = vec4(transformed, 1.0); vec3 wn8 = objectNormal;
          #ifdef USE_INSTANCING
            wp8 = instanceMatrix * wp8; wn8 = mat3(instanceMatrix) * wn8;
          #endif
          vWP = (modelMatrix * wp8).xyz; vWN = normalize(mat3(modelMatrix) * wn8);${kind === 0 ? ' vDet = aDet;' : ''}`);
      const lb = THREE.ShaderChunk.lights_fragment_begin, hook = 'getDirectionalLightInfo( directionalLight, directLight );';
      if (!lb.includes(hook)) console.warn('雾（第七章）：three.js 的光照代码变了，月光不会跟着压暗');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + GL8 + (kind === 0 ? '\nvarying float vDet;' : ''))
        .replace('#include <color_fragment>', `#include <color_fragment>
          float wet8 = 0.; vec3 q = vWP - vec3(${X.toFixed(1)}, 0., 0.); float wD = lite8(q, ${kind === 0 ? 'vDet' : '0.'});
          ${SURF8[kind]}
          diffuseColor.rgb = mix(vec3(dot(diffuseColor.rgb, vec3(.299, .587, .114))), diffuseColor.rgb, ${sat.toFixed(2)});   // 去掉大部分颜色`)
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
          totalEmissiveRadiance += uHaze * wet8 * (0.25 + 0.75 * pow(1. - max(dot(normalize(cameraPosition - vWP), vec3(0., 1., 0.)), 0.), 3.)) * 0.6 * smoothstep(0.15, 0.7, wD);`)
        .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>' + (kind === 1 ? BUMP8 : ''))
        .replace('#include <lights_fragment_begin>', lb.replace(hook, hook + ' directLight.color *= wD;'))
        .replace('#include <lights_fragment_end>', '#include <lights_fragment_end>\n reflectedLight.indirectDiffuse *= wD;')
        .replace('#include <opaque_fragment>', `{ float gL = dot(outgoingLight, vec3(.299, .587, .114)); outgoingLight *= mix(vec3(0.9, 0.98, 1.1), vec3(1.07, 1.0, 0.9), smoothstep(0.015, 0.2, gL)); }   // 调色：暗处偏一点冷，亮处偏一点暖
          outgoingLight = mix(outgoingLight, uHaze, haze8(q));
          #include <opaque_fragment>`);
    };
    return mat;
  }

  // ---- 看守：打着手电，从山下的雾里一个一个跟上来，站在路后面的山坡上往下照 ----
  // 每一个：灯在路上来回扫的那一段 [l0, l1]，人站在哪（gx，离路多远 gz，负的是往后），灯扫多快（v 米每秒），主角走到 wake 它才上来
  // 手电的规矩：灯罩住主角（离灯的落点 R 米以内），主角又在动（走、跑、跳、翻），就开始“盯住”；站住不动就看不出来
  const R_SPOT = 1.25, T_UP = 5;
  const mkS = o => ({ ...o, f: fig('guard', o.gx, { face: -1, act: 'torch', hide: true }), lx: o.l1, p0: o.l1, p1: o.l1, ls: 1, lD: 1, wait: 0, on: 0, up: 0, zr: -24,
    ax: o.l1, ay: 0, az: 0, lamp: V3(), mode: 'off', seeK: 0 });
  const SR = [
    mkS({ l0: X + 15, l1: X + 46, gx: X + 34, gz: -9.5, v: 2.3, wake: X + 11 }),      // 一：上坡那一段（倒树前后）
    mkS({ l0: X + 52, l1: X + 74, gx: X + 72, gz: -12.5, v: 1.7, wake: X + 40 }),     // 二：石头后面蹲着那个人的那一段（早一点上来：主角走到跟前之前，灯已经在扫了）
    mkS({ l0: X + 66, l1: X + 93, gx: X + 80, gz: -8.5, v: 2.5, wake: X + 48, from: 'l0' }),   // 三：石墙前后，路后面。那一场开始的时候就上来了，从左头扫起：那个人被押走的时候，前面的路也走不得
    mkS({ l0: X + 86, l1: X + 106, gx: X + 99, gz: -16, v: 2.0, wake: X + 78 }),      // 四：高处，往下照得远
  ];
  // 那个逃出来的人：第七章拉开过囚车的锁扣，就是那时候跑掉的人里的一个（67-e7-gate.js 的 FREED，第二个，蓝灰的那件）；没拉开，是另一个人
  const RX = X + 64, RZ = -2.4;
  const RUN = [fig('civ', RX, { face: -1, act: 'cower', c: 5, hide: true }), fig('civ', RX, { face: -1, act: 'cower', c: 3, hide: true })];
  // 押送：ph —— 0 还没到 / 1 蹲在石头后面 / 2 跳起来跑 / 3 站住、举手 / 4 两个看守走过去 / 5 押着他下山 / 6 走远了。t 这一段过了多久，gx 押着走到哪了
  const S = { ph: 0, t: 0, gx: RX, bark: 4 };
  const W = { ex: 0, caught: 0 };
  const C_TORCH = new THREE.Color(0xe8eef0);
  FIG_ACT.torch = (f, q, t) => { q.lean = 0.04; q.head = 0.08; if (Math.abs(f.vx) > 0.05) figLegs(f, q, 0.36, 0.4); figAim(f, q, 0, 0.015 * Math.sin(t * 2.3)); q.b[0] = 0.04; q.a[1] = 0.08; q.b[1] = 0.2; };   // 一只手举着手电照着 (tx, ty)
  FIG_ACT.led = (f, q) => { q.lean = 0.3; q.head = 0.42; figLegs(f, q, 0.3, 0.05); q.a[0] = q.a[1] = 0.5; q.b[0] = q.b[1] = 1.0; };   // 被押着走：低着头，两只手在身前

  for (const x of [2, 14, 33, 49, 70, 88, 106]) checkpoint(X + x);
  // 镜头：比大门那一章近（十五米上下），压低一点 —— 雾里的东西要看得出一层层
  camKeys([X + 1, 21, 2.2, 1], [X + 9, 15.5, 1.75, 1.3], [END - 12, 15.5, 1.75, 1.3]);
  // 光：夜里起了雾。月光很淡（只照孩子周围，见 lite8）；天和雾都是浅灰的。往前走，雾慢慢浓起来；下山的时候又淡下去，接上结尾那片野地（夜里，天快亮）
  const FOG = { fog: HAZE, fogD: 0.014, hemiS: 0x8a949c, hemiG: 0x15171a, hemiI: 1.0, keyC: 0xc4ccd4, keyI: 1.45, keyDir: [-0.25, 0.9, -0.35], rimC: 0x8090b0, rimI: 0,
    dustC: 0xa0a8ae, dustO: 0.18, wind: 0.05, ext: 1, sky: [0x24282c, 0x2b2f33, 0x33373b, 0x3a3e43, HAZE, HAZE], sunX: -0.52, sunY: 0.2, sunC: 0xd2d8da, sunP: 0.5,
    stars: 0, cloud: 0, cloudC: HAZE, birds: 0, flies: 0, vig: 1.15,
    aWind: 0.6, aWhis: 0.06, aLeaf: 0.25, leafDry: 1, aBug: 0.15, aDrip: 0, aFlow: 0, aRoom: 0, roomF: 210, aHum: 0, aCity: 0, aFar: 0.6, rvOut: 1, rvHall: 0, rvCave: 0 };   // 声音：山坡上的风、风刮过枯枝，偶尔一声乌鸦、几颗碎石滚下去
  env(X + 6, FOG); env(X + 40, { ...FOG, fogD: 0.017 }); env(END - 24, { ...FOG, fogD: 0.017 }); env(END - 4, { ...FOG, fogD: 0.011, hemiI: 0.85 });

  const inBeam = s => s.on > 0.5 && Math.abs(P.x - s.ax) < R_SPOT && P.y - groundY(P.x) < 1.8;
  const moving = () => Math.abs(P.vx) > 0.3 || !P.grounded || P.mode === 'mantle';
  hint(() => SR[0].on > 0.5 && P.x > X + 13 && P.x < X + 27 && W.ex < 0.3, '光照过来的时候，站住别动');

  const bounceL = pointLight({ p: [X, 1.5, 0.5], c: 0xdce4e8, i: 2.0, d: 11, dec: 1.4, on: 0 });   // 手电照在地上反上来的那一点光：跟着灯走
  const _a = V3(), _b = V3();
  let V = null;
  function* build(R) {
    const v = {};
    const LOW = new URLSearchParams(location.search).get('low') === '1' || (typeof touchMode !== 'undefined' && touchMode);   // 手机（触屏）上降一档；?low=1 在电脑上也能看
    const Sm = (c, kind = 3, sat = 0.4, o) => shade8(lam(c, o), kind, sat);
    const M4 = new THREE.Matrix4(), qq = new THREE.Quaternion(), ee = new THREE.Euler(0, 0, 0, 'YXZ'), cc = new THREE.Color(), UP = V3(0, 1, 0);

    // ---------------- 地面：一整块，颜色、明暗在着色器里算（照“夜搜”：近处一块细的、远处一块粗的，按 x 切成一条条，镜头外的不画）----------------
    {
      const groundMat = Sm(0xffffff, 0, 0.5);
      const grid = (xs, zs, cw, drop = 0) => {
        const pos = [], det = [], nx = xs.length;
        zs.forEach((z, j) => { for (const x of xs) { const d = DET(x, z); pos.push(x, groundY(x) + d - (j === zs.length - 1 ? drop : 0), z); det.push(d); } });
        const all = new THREE.BufferGeometry(), idx = []; all.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        for (let j = 0; j < zs.length - 1; j++) for (let i = 0; i < nx - 1; i++) { const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1; idx.push(a, c, b, b, c, d); }
        all.setIndex(idx); all.computeVertexNormals(); const nrm = all.attributes.normal.array; all.dispose();
        for (let i0 = 0; i0 < nx - 1;) {
          let i1 = i0 + 1; while (i1 < nx - 1 && xs[i1] - xs[i0] < cw) i1++;
          const w = i1 - i0 + 1, P2 = [], N2 = [], D2 = [], I2 = [];
          for (let j = 0; j < zs.length; j++) for (let i = i0; i <= i1; i++) { const k = j * nx + i; P2.push(pos[k * 3], pos[k * 3 + 1], pos[k * 3 + 2]); N2.push(nrm[k * 3], nrm[k * 3 + 1], nrm[k * 3 + 2]); D2.push(det[k]); }
          for (let j = 0; j < zs.length - 1; j++) for (let i = 0; i < w - 1; i++) { const a = j * w + i, b = a + 1, c = a + w, d = c + 1; I2.push(a, c, b, b, c, d); }
          const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P2, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N2, 3)); g.setAttribute('aDet', new THREE.Float32BufferAttribute(D2, 1)); g.setIndex(I2); g.computeBoundingSphere();
          const m = new THREE.Mesh(g, groundMat); m.receiveShadow = true; R.add(m);
          i0 = i1;
        }
      };
      const xs = TERRAIN.map(p => p[0]).filter((x, i) => x >= X - 1e-3 && x <= END + 1e-3 && (!LOW || i % 2 === 0));   // 和物理地形的折点分毫不差：路面就是孩子踩的那一条
      const zs0 = []; for (let z = -14; z <= 16.001; z += LOW ? 0.6 : 0.35) zs0.push(z);
      grid(xs, zs0, 18);
      yield;
      const zs = []; for (let z = -13.9, st = 0.5; z > -420; z -= st, st = Math.min(8, st * 1.06)) zs.push(z);
      grid(xs.filter((x, i) => i % 4 === 0 || x >= END - 0.2), zs.reverse(), 60, 0.04);
    }
    yield;

    // ---------------- 地上的东西：石块、碎石子、落叶、枯枝（照“夜搜”）。路前面只撒在暗下去的那条边上，前景不放东西 ----------------
    {
      const rockMat = Sm(0xffffff, 1, 0.6, { vertexColors: true }), leafMat = Sm(0xffffff, 3, 0.95, { side: THREE.DoubleSide });
      const clump = (x, z) => sstep(0.35, 0.72, vn2(x * 0.35 + 40, z * 0.45)) * 0.85 + 0.15;
      const nearJump = x => Math.abs(x - TX) < 1.0 || Math.abs(x - WX) < 1.0 || Math.abs(x - RX) < 1.6;
      const spot = (onRoad, reach = 3.5) => {
        for (let tries = 0; ; tries++) {
          const x = rr(X + 2, END - 2); let zr, dr = 0;
          if (onRoad) zr = rr(RB + 0.2, RF - 0.2);
          else { const back = rnd() < 0.78; dr = Math.pow(rnd(), 1.25) * reach * (back ? 1.5 : 0.5); zr = back ? RB + 0.3 - dr : RF - 0.2 + dr; }
          const z = pz(x) + zr, lim = reach * (0.7 + 0.6 * vn2(x * 0.25 + 7, 3));
          const p = onRoad ? (nearJump(x) ? 0 : 1) : clump(x, z) * sstep(lim * 1.4, lim * 0.6, dr) * (DET(x, z) < -0.04 ? 1.6 : 1);
          if (tries > 60 || rnd() < p) return [x, z];
        }
      };
      {
        const geos = [3, 17, 29, 41].map(sd => fogRockGeo(sd, { sd: 1, amp: 0.32, flat: 0.75, moss: 0.5, mossCol: 0x4f6a2e, col: 0x4a4945 })), pts = [];
        for (let i = 0, n = LOW ? 130 : 260; i < n; i++) { const [x, z] = spot(false); if (Math.abs(z - pz(x)) > 1.1) pts.push([x, z, rr(0.06, 0.26) * (rnd() < 0.18 ? 1.8 : 1)]); }
        geos.forEach((geo, gi) => {
          const part = pts.filter((_, i) => i % geos.length === gi), mesh = new THREE.InstancedMesh(geo, rockMat, part.length);
          part.forEach(([x, z, sz], i) => { ee.set(rr(-0.2, 0.2), rr(0, 6.28), rr(-0.2, 0.2)); qq.setFromEuler(ee);
            M4.compose(V3(x, gy(x, z) - sz * 0.22, z), qq, V3(sz * rr(0.9, 1.4), sz * rr(0.7, 1.0), sz * rr(0.7, 1.1))); mesh.setMatrixAt(i, M4); mesh.setColorAt(i, cc.setScalar(rr(0.75, 1.1))); });
          mesh.instanceMatrix.needsUpdate = mesh.instanceColor.needsUpdate = true; mesh.computeBoundingSphere(); mesh.castShadow = mesh.receiveShadow = true; mesh.frustumCulled = false; R.add(mesh);
        });
      }
      {
        const n = LOW ? 800 : 1700, mesh = new THREE.InstancedMesh(fogRockGeo(11, { sd: 0, amp: 0.25, flat: 0.7, moss: 0, col: 0xffffff }), rockMat, n);
        for (let i = 0; i < n; i++) {
          const [x, z] = spot(rnd() < 0.25), sz = rr(0.012, 0.05);
          ee.set(rr(-0.4, 0.4), rr(0, 6.28), rr(-0.4, 0.4)); qq.setFromEuler(ee);
          M4.compose(V3(x, gy(x, z) + sz * 0.15, z), qq, V3(sz * rr(0.9, 1.5), sz * rr(0.5, 0.8), sz * rr(0.8, 1.2))); mesh.setMatrixAt(i, M4);
          mesh.setColorAt(i, cc.set(pick([0x4a4945, 0x3f3e3b, 0x55524b, 0x353431])).multiplyScalar(rr(0.8, 1.15)));
        }
        mesh.instanceMatrix.needsUpdate = mesh.instanceColor.needsUpdate = true; mesh.computeBoundingSphere(); mesh.receiveShadow = true; mesh.frustumCulled = false; R.add(mesh);
      }
      yield;
      {
        const n = LOW ? 900 : 2000, mesh = new THREE.InstancedMesh(leafGeo(), leafMat, n);
        for (let i = 0; i < n; i++) {
          let x, z; const u = rnd();
          if (u < 0.35) { x = rr(X + 2, END - 2); z = pz(x) + (rnd() < 0.75 ? RB + rr(-0.7, 0.5) : RF + rr(-0.5, 0.4)); }
          else if (u < 0.45) { x = rr(TX - 1.5, TX + 1.5); z = pz(x) + rr(-5, 1); }           // 倒树底下积了一堆
          else [x, z] = spot(rnd() < 0.15);
          const sz = rr(0.08, 0.16), up = rnd() < 0.2 ? rr(0.2, 0.7) : rr(-0.08, 0.08);
          ee.set(rr(-0.08, 0.08), rr(0, 6.28), up); qq.setFromEuler(ee);
          M4.compose(V3(x, gy(x, z) + 0.012 + Math.abs(Math.sin(up)) * sz * 0.4, z), qq, V3(sz, sz * 0.5, sz)); mesh.setMatrixAt(i, M4);
          mesh.setColorAt(i, cc.set(pick([0xc8962e, 0xd4a83a, 0xb87a2a, 0xa8642a, 0x8a5a30, 0xc0a040, 0x7a6a38])).multiplyScalar(rr(0.6, 1.05)));   // 黄的、橙黄的、褐的：画面里少有的几点颜色
        }
        mesh.instanceMatrix.needsUpdate = mesh.instanceColor.needsUpdate = true; mesh.computeBoundingSphere(); mesh.receiveShadow = true; mesh.frustumCulled = false; R.add(mesh);
      }
      {
        const A = { p: [], n: [] };
        for (let i = 0; i < (LOW ? 60 : 130); i++) {
          const [x, z] = spot(rnd() < 0.05), L = rr(0.15, 0.75) * (rnd() < 0.1 ? 1.8 : 1), a = rr(0, 6.28), r = rr(0.005, 0.014) * (L > 0.8 ? 1.5 : 1), dx = Math.cos(a), dz = Math.sin(a), bend = rr(-0.12, 0.12);
          const pts = [0, 0.33, 0.66, 1].map(t => { const px = x + dx * L * (t - 0.5) - dz * bend * Math.sin(t * 3.14), pz_ = z + dz * L * (t - 0.5) + dx * bend * Math.sin(t * 3.14); return V3(px, gy(px, pz_) + r + 0.004 + 0.02 * Math.sin(t * 3.14) * rnd(), pz_); });
          mergePut(A, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 6, r, 5));
        }
        const m = new THREE.Mesh(mergedGeo(A), Sm(0x5a3d26, 3, 0.85)); m.castShadow = m.receiveShadow = true; m.frustumCulled = false; R.add(m);
      }
    }
    yield;

    // ---------------- 雾里的剪影：一层层的枯树、几块大岩石，越远越高（山坡）—— 一层比一层浅（浅是雾抬的，见 haze8）----------------
    {
      const A = { p: [], n: [] };
      for (const [z0, gap, h0, h1] of [[-5.5, 9, 6, 10], [-11, 6, 8, 13], [-19, 5, 10, 15], [-30, 4.5, 11, 17], [-46, 4, 12, 18], [-66, 4, 13, 19]]) {
        for (let x = X - 6 + rr(0, gap); x < END + 6; x += rr(gap * 0.6, gap * 1.4)) {
          if (z0 > -12 && (Math.abs(x - RX) < 4 || Math.abs(x - WX) < 2.5 || Math.abs(x - TX) < 3)) continue;   // 那个人躲着的那块石头、石墙、倒树后面让开
          const z = pz(x) + z0 + rr(-3, 3); deadTree(A, x, gy(x, z) - 0.3, z, rr(h0, h1), { thick: 1.0, branch: 0.8 });
        }
        yield;
      }
      const m = new THREE.Mesh(mergedGeo(A), Sm(0x2b2a27, 2, 0.3)); m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; R.add(m);
    }
    {
      const rm = Sm(0xffffff, 1, 0.5, { vertexColors: true });
      // 山坡上的大岩石：有的半埋在土里，有的一块块立着（雾里的“石头的样子”：站住不动的人和它们分不出来）
      for (const [x, zr, s, hy] of [[X + 8, -7, 1.6, 0.8], [X + 21, -5.2, 0.9, 1.1], [X + 39, -14, 2.4, 1.6], [X + 47, -6.5, 1.1, 1.3], [X + 58, -9, 1.8, 0.9], [X + 77, -20, 3.2, 2.2],
        [X + 92, -5.8, 1.0, 1.2], [X + 101, -24, 3.6, 1.8], [X + 112, -11, 1.9, 1.0], [X + 26, -28, 4.0, 2.4], [X + 66, -34, 4.4, 2.6], [X + 118, -36, 4.0, 2.0]]) {
        const z = pz(x) + zr, r = add(R, fogRockGeo(Math.round(x * 3 + zr * 17), { sd: 2, amp: 0.3, flat: 0.85, moss: 0.4, mossCol: 0x45602a, col: 0x46453f }), rm, x, gy(x, z) + s * 0.2, z);
        r.scale.set(s * rr(0.9, 1.3), s * hy, s * rr(0.8, 1.1)); r.rotation.y = rr(0, 6.28);
      }
      // 那个人躲着的那块石头：在路后面一点，一人来高的一半
      { const z = pz(RX - 0.7) - 1.6, r = add(R, fogRockGeo(6401, { sd: 2, amp: 0.28, flat: 0.8, moss: 0.5, mossCol: 0x45602a, col: 0x4a4945 }), rm, RX - 0.7, gy(RX - 0.7, z) + 0.2, z); r.scale.set(0.85, 0.72, 0.7); r.rotation.y = 0.6; }
    }
    yield;

    // ---------------- 倒树：一棵枯树倒下来，斜着横过路面，树根那头翘在山坡上，细的那头伸进镜头前的黑里 ----------------
    {
      const A = { p: [], n: [] }, root = V3(TX - 0.6, 0, pz(TX) - 6.5), tip = V3(TX + 0.35, 0, pz(TX) + 2.6);
      root.y = gy(root.x, root.z) + 0.42; tip.y = gy(tip.x, tip.z) + 0.12;
      const mid = V3(TX, groundY(TX) + 0.24, pz(TX));
      mergePut(A, new THREE.TubeGeometry(new THREE.CatmullRomCurve3([root, root.clone().lerp(mid, 0.5).add(V3(0, 0.05, 0)), mid, tip]), 18, 0.24, 9));
      for (let k = 0; k < 9; k++) {                                                   // 断掉的枝杈：都在树根那一半，往上、往两边戳；孩子跳过去的那一截是光溜溜的树干
        const t = rr(0.05, 0.6), p0 = root.clone().lerp(mid, t).add(V3(0, 0.15, 0)), a = rr(-2.6, -0.5), L = rr(0.6, 1.6);
        const p1 = p0.clone().add(V3(Math.cos(a) * 0.3 * L, rr(0.4, 0.9) * L, Math.sin(a) * 0.5 * L));
        mergePut(A, new THREE.TubeGeometry(new THREE.CatmullRomCurve3([p0, p0.clone().lerp(p1, 0.5).add(V3(rr(-0.1, 0.1), 0.05, 0)), p1]), 5, rr(0.03, 0.06), 5));
      }
      const m = new THREE.Mesh(mergedGeo(A), Sm(0x3a3229, 2, 0.4)); m.castShadow = m.receiveShadow = true; R.add(m);
    }
    // ---------------- 干砌石墙：一块块扁石头码起来的旧田埂墙，从路前沿一直伸到雾里看不见；越往后越塌 ----------------
    {
      const geos = [7, 19, 31].map(sd => fogRockGeo(sd + 900, { sd: 1, amp: 0.22, flat: 0.55, moss: 0.6, mossCol: 0x4a6a2e, col: 0x4c4b46 })), pts = [];
      for (let z = pz(WX) + 1.15; z > pz(WX) - 46; z -= rr(0.3, 0.42)) {
        const far = pz(WX) - z, lost = far > 8 ? sstep(0.4, 0.8, vn2(z * 0.18, 4)) : 0;            // 后面一段段塌掉了
        const rows = lost > 0.5 ? 1 : 3;
        for (let r = 0; r < rows; r++) pts.push([WX + rr(-0.06, 0.06), gy(WX, z) + 0.12 + r * 0.25 + (r === 2 ? 0.03 : 0), z + rr(-0.05, 0.05), rr(0.2, 0.3), rr(0.12, 0.16), rr(0.16, 0.24)]);
        if (rows === 3 && rnd() < 0.7) pts.push([WX + rr(-0.04, 0.04), gy(WX, z) + 0.78, z, rr(0.18, 0.24), rr(0.06, 0.09), rr(0.2, 0.28)]);   // 压顶的几块立着、斜着
      }
      geos.forEach((geo, gi) => {
        const part = pts.filter((_, i) => i % geos.length === gi), mesh = new THREE.InstancedMesh(geo, Sm(0xffffff, 1, 0.55, { vertexColors: true }), part.length);
        part.forEach(([x, y, z, sx, sy, sz], i) => { ee.set(rr(-0.15, 0.15), rr(0, 6.28), rr(-0.15, 0.15)); qq.setFromEuler(ee); M4.compose(V3(x, y, z), qq, V3(sx, sy, sz)); mesh.setMatrixAt(i, M4); mesh.setColorAt(i, cc.setScalar(rr(0.75, 1.1))); });
        mesh.instanceMatrix.needsUpdate = mesh.instanceColor.needsUpdate = true; mesh.computeBoundingSphere(); mesh.castShadow = mesh.receiveShadow = true; mesh.frustumCulled = false; R.add(mesh);
      });
    }
    yield;

    // ---------------- 雾片：几层半透明的雾，在孩子身后慢慢横着飘（和“夜搜”一样：一段段钉在世界里，只有花纹随风往右飘）----------------
    {
      const [c, gx] = mkCanvas(1024, 256);
      for (let i = 0; i < 70; i++) {
        const x = rr(0, 1024), y = rr(60, 250), w = rr(60, 220), a = rr(0.08, 0.26);
        for (const ox of [-1024, 0, 1024]) { const gr = gx.createRadialGradient(x + ox, y, 0, x + ox, y, w); gr.addColorStop(0, `rgba(255,255,255,${a})`); gr.addColorStop(1, 'rgba(255,255,255,0)');
          gx.save(); gx.translate(0, y); gx.scale(1, 0.35); gx.translate(0, -y); gx.fillStyle = gr; gx.fillRect(x + ox - w, y - w, 2 * w, 2 * w); gx.restore(); }
      }
      gx.globalCompositeOperation = 'destination-in'; const fade = gx.createLinearGradient(0, 0, 0, 256); fade.addColorStop(0, 'rgba(0,0,0,0)'); fade.addColorStop(0.55, 'rgba(0,0,0,1)'); fade.addColorStop(1, 'rgba(0,0,0,0.85)'); gx.fillStyle = fade; gx.fillRect(0, 0, 1024, 256);
      const tex = canvasTex(c); tex.wrapS = THREE.RepeatWrapping;
      const LAY = [[-3.2, 3, 0.1, 0.35], [-7, 5, 0.13, 0.25], [-13, 8, 0.16, 0.16], [-22, 12, 0.18, 0.1], [-36, 18, 0.18, 0.07]].slice(0, LOW ? 3 : 5);
      const [mc, mg] = mkCanvas(128, 8); { const gr = mg.createLinearGradient(0, 0, 128, 0); gr.addColorStop(0, '#000'); gr.addColorStop(0.25, '#fff'); gr.addColorStop(0.75, '#fff'); gr.addColorStop(1, '#000'); mg.fillStyle = gr; mg.fillRect(0, 0, 128, 8); }
      const sideFade = new THREE.CanvasTexture(mc); sideFade.channel = 1;
      v.fogs = LAY.map(([z, h, op, sp], i) => {
        const t = tex.clone(); t.needsUpdate = true; t.wrapS = THREE.RepeatWrapping;
        const mat = new THREE.MeshBasicMaterial({ map: t, alphaMap: sideFade, color: 0x9aa2a8, transparent: true, opacity: op, depthWrite: false, fog: true }); mat.userData.own = true;
        for (let xc = X + 4; xc < END + 10; xc += 24) {
          const geo = new THREE.PlaneGeometry(36, h), uv = geo.attributes.uv, pos = geo.attributes.position;
          geo.setAttribute('uv1', uv.clone());
          for (let k = 0; k < uv.count; k++) uv.setX(k, (pos.getX(k) + xc) / 140);
          const zz = pz(xc) + z, m = new THREE.Mesh(geo, mat); m.position.set(xc, gy(xc, zz) + h / 2 - 0.6, zz); m.renderOrder = 30 + i; R.add(m);
        }
        return { t, sp, ph: rr(0, 1) };
      });
    }
    yield;

    // ---------------- 人：看守和那个逃出来的人。走这一章的明暗和雾（远处的看守只剩影子，灯照到的才亮）----------------
    {
      const FIGS = [...SR.map(s => s.f), ...RUN];
      v.crowd = mkCrowd(R, FIGS.length + 1); v.crowd.addAll(FIGS);
      const fm = lam(0xffffff);
      fm.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n\ttotalEmissiveRadiance += diffuseColor.rgb * 0.12;'); };
      fm.customProgramCacheKey = () => 'e8-fig-1';
      shade8(fm, 3, 0.6);
      for (const k in v.crowd.I) v.crowd.I[k].material = fm;
      // 手电：灯头的一团光、看得见的光柱、照在地上的一块亮斑（真的带影子的灯只给离主角最近的那一盏，见 update）
      v.lamps = SR.map(() => ({ glare: glow(R, 0xe8eef0, 1.5, 0, 0, 0, 0, GLOW_SOFT), core: glow(R, 0xffffff, 0.35, 0, 0, 0, 0), cone: mkCone(R, 0.11, { c: 0xdce4e8, op: 0.2 }),
        spot: (() => { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: GLOW, color: 0xd6dcdf, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
          m.material.userData.own = true; m.rotation.x = -Math.PI / 2; m.renderOrder = 3; R.add(m); return m; })() }));
      for (const o of v.lamps) o.cone.m.material.userData.own = true;
    }
    V = v;
  }

  // ---- 每一帧 ----
  function leg(s, to) { s.p0 = s.lx; s.p1 = to; s.ls = 0; s.lD = Math.max(1.2, Math.abs(to - s.lx) / s.v); }
  function sweep(s, dt, k) {                                 // 灯在 [l0, l1] 里来回扫：从一头慢慢起步、中间最快、到另一头慢慢停下，站一下再掉头。罩住了人就慢下来
    if (s.wait > 0) { s.wait -= dt; return; }
    s.ls += dt / s.lD * (1 - 0.85 * k);
    if (s.ls >= 1) { s.lx = s.p1; s.wait = 0.7; leg(s, Math.abs(s.p1 - s.l0) < Math.abs(s.p1 - s.l1) ? s.l1 : s.l0); }
    else s.lx = lerp(s.p0, s.p1, 0.5 - 0.5 * Math.cos(Math.PI * s.ls));
  }
  // 一个看守朝 (tx, 离路 zr) 走过去；到了返回 true
  function walkTo(s, tx, zr, speed, dt) {
    const f = s.f, done = figGo(f, tx, speed, dt);
    s.zr = damp(s.zr, zr, speed * 0.6, dt);
    return done && Math.abs(s.zr - zr) < 0.25;
  }
  // 摆好：站在山坡上，身子朝着灯照的那一点；手电的灯头在手上
  function poseGuard(s, dt) {
    const f = s.f; f.z = pz(f.x) + s.zr; f.y = gy(f.x, f.z);
    const dx = s.ax - f.x, dz = s.az - f.z, hd = Math.hypot(dx, dz);
    if (Math.abs(f.vx) > 0.05) { const dir = Math.sign(f.vx); f.face = dir; f.yawT = dir > 0 ? -0.55 : -Math.PI + 0.55; f.tx = f.x + dir * Math.max(1, Math.abs(dx) + 0.6 * dz); }
    else { f.face = 1; f.yawT = Math.atan2(-dz, dx); f.tx = f.x + hd; }
    f.ty = s.ay; f.yk = 4; figAct(f, 'torch');
    const shy = f.y + 0.79 * f.H; _a.set(s.ax - f.x, s.ay - shy, s.az - f.z).normalize();
    s.lamp.set(f.x + _a.x * 0.37 * f.H, shy + _a.y * 0.37 * f.H, f.z + _a.z * 0.37 * f.H);
  }
  function runner() { return RUN[STORY.freed ? 0 : 1]; }
  // 两头邻章画在布景板上的远景（大门那一章夜里的山谷、林子，结尾的丘陵和树）不受这一章的雾管，在雾里是一块块发蓝的画：镜头进了这一章就把它们淡掉，出了雾再淡回来。
  //   它们还要留着：结尾回头看的那一眼里，大门那一章的远山、林子在工厂后面
  function fadeBoards(n, k) {
    const z = ZONES.find(z => z.n === n); if (!z || !z.root) return;
    for (const m of z.root.children) if (m.isMesh && m.geometry.type === 'PlaneGeometry' && m.material.map && m.material.transparent && m.position.z < -3) {
      m.userData.op0 ??= m.material.opacity; m.material.opacity = m.userData.op0 * k; m.visible = k > 0.01; }
  }
  function update(dt) {
    const play = state === 'play', v = V;
    NU.uT.value = T; NU.uHX.value = P.x - X; NU.uHY.value = P.y;
    HERO_RIM.uRimK.value = 0.14;                                                      // 一圈淡淡的轮廓光，把孩子从雾里勾出来（和“夜搜”一样）
    { const k = cam.d / 10.5; camJit = { x: k * (0.045 * Math.sin(T * 0.37) + 0.025 * Math.sin(T * 0.91 + 2)), y: k * (0.03 * Math.sin(T * 0.53 + 1) + 0.015 * Math.sin(T * 1.27)) }; }   // 镜头轻轻地漂，像手持
    if (v && v.fogs) for (const f of v.fogs) f.t.offset.x = T * f.sp * (0.6 + GUST.v) / 140 + f.ph;
    const R0 = runner(); RUN[STORY.freed ? 1 : 0].hide = true;
    // 看守一个一个上来：主角走到 wake，它从山下的雾里走上来，站到自己的位置，灯打开
    for (const s of SR) if (s.mode === 'off' && (S.ph < 1 || (s !== SR[0] && s !== SR[1])) && P.x > s.wake && play) {   // 押着人下山的那两个，演完了就不再上来
      s.mode = 'up'; s.up = 0; s.f.hide = false; s.f.x = s.gx - 7; s.zr = -24; s.lx = s.p0 = s.p1 = s.from === 'l0' ? s.l0 : s.l1; s.ls = 1; s.wait = 0;
    }
    // ---- 押送那一场 ----
    S.t += dt;
    const go = (ph) => { S.ph = ph; S.t = 0; };
    if (S.ph === 0 && P.x > X + 44 && play) { go(1); R0.hide = false; Object.assign(R0, { x: RX, face: -1, vx: 0 }); figAct(R0, 'cower'); }
    const B = SR[1], A = SR[0];
    if (S.ph === 1) {
      if (B.mode === 'sweep' && Math.abs(B.lx - RX) < 2.6 && P.x > X + 50) { go(2); fx('bark', 0.9); }   // 主角走近了（看得见），灯又扫到石头边上：他跳起来就跑
    } else if (S.ph === 2) {
      figAct(R0, 'run'); figGo(R0, RX + 6, 3.4, dt); R0.zr = lerp(RZ, -7.5, sstep(0, 1.6, S.t));
      if (S.t > 1.7) { go(3); figAct(R0, 'handsup'); R0.face = -1; R0.vx = 0; }
    } else if (S.ph === 3) {
      if (S.t > 1.4) go(4);
    } else if (S.ph === 4) {                                                            // 两个看守走过去，一前一后夹住他
      const a = walkTo(A, R0.x - 1.1, R0.zr + 0.3, 4.0, dt), b = walkTo(B, R0.x + 1.0, R0.zr - 0.2, 2.0, dt);
      if ((a && b) || S.t > 9) { go(5); S.gx = R0.x; }
    } else if (S.ph === 5) {                                                            // 押着他下山：从主角身后过去，往左，往工厂的方向
      S.gx -= 1.1 * dt;
      figAct(R0, 'led'); figGo(R0, S.gx, 1.6, dt); R0.zr = damp(R0.zr, -3.7, 0.6, dt);
      walkTo(A, S.gx - 1.2, R0.zr + 0.1, 1.6, dt); walkTo(B, S.gx + 1.1, R0.zr - 0.1, 1.6, dt);
      if (S.gx < X - 6) { go(6); R0.hide = true; A.f.hide = B.f.hide = true; A.mode = B.mode = 'off'; }
    }
    if (S.ph >= 1 && S.ph <= 5) { R0.z = pz(R0.x) + (R0.zr ?? RZ); R0.y = gy(R0.x, R0.z); }
    if (S.ph === 1) R0.zr = RZ;
    // ---- 每个看守：上来 / 扫 / 照着那个人 / 押着他走 ----
    let seen = false;
    for (let i = 0; i < SR.length; i++) {
      const s = SR[i];
      if (s.mode === 'off') { s.on = damp(s.on, 0, 3, dt); continue; }
      const lock = (s === A || s === B) && S.ph >= 2 && S.ph <= 4, esc = (s === A || s === B) && S.ph === 5;
      if (lock || esc) s.mode = 'scene';                                             // 那一场里：照着那个人、押着他走（不再自己扫）
      if (s.mode === 'up') { if (walkTo(s, s.gx, s.gz, 1.5, dt) || (s.up += dt) > T_UP + 4) s.mode = 'sweep'; s.on = damp(s.on, sstep(-20, -12, s.zr), 2, dt); }
      else s.on = damp(s.on, 1, 2, dt);
      const kx = s.seeK;
      if (lock) { s.lx = damp(s.lx, R0.x, 6, dt); s.ax = s.lx; s.ay = R0.y + 0.8; s.az = R0.z; }
      else {
        if (esc) { s.lx = (s === A ? S.gx - 3.4 : S.gx + 0.8) + 2.4 * Math.sin(T * (s === B ? 1.1 : 0.8) + i); }   // 押着人走的时候：灯照着前面的路，左右晃
        else if (s.mode === 'sweep') { sweep(s, dt, kx); if (S.ph < 1 || s !== B) figGo(s.f, s.gx + 0.35 * (s.lx - (s.l0 + s.l1) / 2), 0.8, dt); }
        const bx = lerp(s.lx, P.x, sstep(0.15, 1, W.ex) * s.seeK);
        s.ax = bx + 0.12 * Math.sin(T * 1.9 + i); s.ay = groundY(s.ax); s.az = pz(s.ax) + 0.35 * Math.sin(T * 0.8 + i * 2);
      }
      poseGuard(s, dt);
      const hit = play && !lock && inBeam(s);
      s.seeK = damp(s.seeK, hit && moving() ? 1 : 0, 4, dt);
      if (hit && moving()) seen = true;
    }
    watchStep(W, seen, dt, 0.55, 0.9);
    HX.alert = W.ex;
    // 站住不动、灯又照到附近的时候：缩起身子（和雾里的石头一样）
    const near = SR.reduce((m, s) => s.on > 0.3 ? Math.min(m, Math.abs(P.x - s.lx)) : m, 99);
    if (play && P.grounded && Math.abs(P.vx) < 1.6 && near < 4.5) HX.pose = crouchPose(sstep(4.5, 1.8, near) * sstep(1.6, 0.4, Math.abs(P.vx)));
    // 远处的狗叫：看守上来以后隔一阵叫两声
    if (SR.some(s => s.mode !== 'off') && play && (S.bark -= dt) <= 0) { S.bark = 6 + 5 * (0.5 + 0.5 * Math.sin(T * 1.7)); fx('bark', 0.18 + 0.12 * Math.sin(T * 0.7) ** 2); }
    // 押送那一场：镜头退一点，把那个人和主角都放进画面
    if (S.ph >= 1 && S.ph <= 4) camOvr = { d: 18, yo: 2.3, xo: clamp((R0.x - P.x) * 0.45, -1, 5) - cam.look };
    // 真的灯（带影子）：给照着的地方离主角最近的那一盏；它照在地上反上来一点光
    let best = null, bd = 1e9;
    for (const s of SR) if (s.on > 0.05) { const d = Math.abs(s.ax - P.x) - ((s === A || s === B) && S.ph >= 2 && S.ph <= 4 ? 6 : 0); if (d < bd) { bd = d; best = s; } }
    const kAlert = sstep(0.15, 1, W.ex);
    if (best && bd < 30) {
      useBeam(best.lamp.x, best.lamp.y, best.lamp.z, best.ax, best.ay, best.az, { ang: 0.11, pen: 0.55, i: 30 * best.on, c: C_TORCH, alert: best.seeK * kAlert });
      bounceL.on = best.on * sstep(30, 12, bd); bounceL.p[0] = best.ax; bounceL.p[1] = best.ay + 1.3; bounceL.p[2] = best.az + 0.5; bounceL.c.copy(beam.color);
    } else bounceL.on = 0;
    for (const s of SR) figStep(s.f, dt);
    for (const r of RUN) figStep(r, dt);
    { const cx = camera.position.x; fadeBoards(6, 1 - sstep(X - 12, X + 6, cx)); fadeBoards(8, sstep(END - 8, END + 14, cx)); }
    if (!v) return;
    v.crowd.draw();
    SR.forEach((s, i) => {
      const o = v.lamps[i], on = s.on, hz = haze8(-(s.f.z - pz(s.f.x))), hs = haze8(-(s.az - pz(s.ax))), col = s === best ? beam.color : C_TORCH;
      o.glare.visible = o.core.visible = o.cone.m.visible = o.spot.visible = on > 0.01;
      if (on <= 0.01) return;
      o.glare.position.copy(s.lamp); o.core.position.copy(s.lamp);
      const face = Math.max(0, _a.copy(camera.position).sub(s.lamp).normalize().dot(_b.set(s.ax, s.ay, s.az).sub(s.lamp).normalize()));   // 灯头有多正对着镜头
      o.glare.material.opacity = on * (0.35 + 0.5 * face ** 2) * (1 - 0.55 * hz); o.glare.scale.setScalar(lerp(1.2, 3.2, face ** 3)); o.core.material.opacity = on * (0.6 + 0.4 * face) * (1 - 0.4 * hz);
      o.glare.material.color.copy(col);
      o.cone.aim(s.lamp.x, s.lamp.y, s.lamp.z, s.ax, s.ay, s.az); o.cone.m.material.opacity = o.cone.op * on * (1 - 0.5 * hz); o.cone.m.material.color.copy(col);
      const len = s.lamp.distanceTo(_b.set(s.ax, s.ay, s.az)), el = clamp((s.lamp.y - s.ay) / len, 0.12, 1), rs = len * Math.tan(0.11) * 2.6;
      o.spot.visible = s !== best; o.spot.position.set(s.ax, gy(s.ax, s.az) + 0.05, s.az); o.spot.scale.set(rs, rs / el, 1); o.spot.material.opacity = 0.55 * on * (1 - 0.7 * hs); o.spot.material.color.copy(col);
    });
  }
  function resetScene() {
    Object.assign(S, { ph: 0, t: 0, gx: RX });
    for (const r of RUN) Object.assign(r, { hide: true, x: RX, vx: 0, face: -1, zr: RZ });
    for (const s of [SR[0], SR[1]]) Object.assign(s, { mode: 'off', on: 0, zr: -24, seeK: 0 }), s.f.hide = true, s.f.x = s.gx;
  }
  function reset() {
    resetScene(); Object.assign(W, { ex: 0, caught: 0 }); S.bark = 4;
    for (const s of SR) { Object.assign(s, { mode: 'off', on: 0, zr: -24, seeK: 0, wait: 0, lx: s.l1, p0: s.l1, p1: s.l1, ls: 1 }); s.f.hide = true; s.f.x = s.gx; }
  }
  function solve() { reset(); S.ph = 6; }
  reset();
  return defZone({ n: 7, vis: [X - 4, END + 4], build, update, reset, solve, unbuild() { V = null; },
    // 回到存档点：扫着的灯从离存档点远的那一头重新扫过来；那一场还没演完就从头再演
    respawn(c) {
      if (c.x < X || c.x > END) return;
      Object.assign(W, { ex: 0, caught: 0 });
      if (S.ph >= 1 && S.ph <= 5) resetScene();
      for (const s of SR) if (s.mode === 'sweep') { const far = Math.abs(c.x - s.l0) > Math.abs(c.x - s.l1) ? s.l0 : s.l1; Object.assign(s, { lx: far, p0: far, p1: far, ls: 1, wait: 1.0, seeK: 0 }); }
    }, S, W, SR, RUN });
})();
