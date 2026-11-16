// ============================================================
//  第二十一章 · 墙（试验关：一堵从镜头跟前一直伸到看不见的地方去的旧砖墙，跳一下就翻过去）
//  这一关只试一件事：近处做细，远处压暗，而且暗得有层次，不让人一眼望到头。
//    近处（镜头后面到 z = -42）：一块一块的砖，有倒角、顺砖丁砖、灰缝缩进去一点、砖面的颗粒和小坑、
//         墙顶一排立砌的压顶砖、豁口是一阶一阶塌下去的，塌下来的砖散在墙脚
//    远处（z = -42 往后）：一整条墙体，砖缝在着色器里画；豁口的轮廓还在
//  画面：参考“雾里的剪影”那种做法 —— 雾是浅灰的，越远越被雾抬亮、越看不清；近处没有雾，前景是平的近黑剪影（不受光、没有纹理）；
//    光是柔和的顶光，聚在孩子走的那一带，往镜头这边慢慢沉下去；颜色几乎全去掉，只有孩子身上有颜色；中景是雾里一层层的枯树、断柱。
//  光：只有月光（不靠路灯，哪一章都能这样打光）。月亮在画面深处偏左、压得很低（高度角约 11°，影子拖出去是高度的五倍多），带影子：
//    朝着镜头的面全是背光面；前景里靠近孩子的那一排废料高、往镜头这边的矮，前排的影子往镜头这边拖，盖住后面 —— 画面下半部分留黑。
//    wallD 只管往远处：天光、月光往后很快暗下去，云缝里漏下来的几块月光慢慢飘过去
//  先单独放在最后，从章节菜单进（或者地址后面加 ?ch=21）
// ============================================================
const X14 = 2600;
const CH14 = (() => {
  const X = X14, WX = X + 8;                                   // 墙的中线在哪个 x
  const T = 0.34, BL = 0.215, BH = 0.065, BD = 0.1025, J = 0.011, PZ = BL + J, PY = BH + J, NC = 11, CAPH = 0.1;
  const TOP = NC * PY + J + CAPH;                              // 墙顶（压顶砖的上沿）多高：0.95 米，跳一下就过去
  const Z1 = 18, ZN = -42, Z0 = -330;                          // 墙从镜头后面 Z1 一直到 Z0；ZN 以前一块块砖搭，以后是一整条
  const MI = 0.016;                                            // 灰缝比砖面缩进去多少
  const C = chapter({ n: OLD + 14, x0: X - 12, start: X + 2, name: '墙', sub: '翻过去', ground: 'gravel',   // 脚步声：山上的碎石
    intro() { CAT.state = 'none'; } });
  ground(X - 60, 0x2a2520); ground(X + 60, 0x2a2520);
  groundFront(X - 60, X + 60, null);                           // 共用的地面这一段不铺：这一章自己铺（远处要跟着压暗）
  solid({ x1: X - 12.6, x2: X - 11.6, y1: -2, y2: 30, noclimb: true });
  solid({ x1: X + 30, x2: X + 31, y1: -2, y2: 30, noclimb: true });
  solid({ x1: WX - T / 2 - 0.015, x2: WX + T / 2 + 0.015, y1: -1, y2: TOP, snd: 'concrete' });   // 墙在玩法平面上的那一截
  checkpoint(X + 2); checkpoint(WX + 1.4);
  // 路在前后方向上慢慢地弯：有时往镜头这边靠，有时往远处去（±3 米）。这一章两头收回到 0，和别的章节接上。着色器里有一份一样的（pzf）
  const PZ_ = x => { const u = x - WX; return sstep(-22, -16, u) * (1 - sstep(20, 26, u)) * 2.2 * (0.9 * Math.sin(u * 0.21 + 0.6) + 0.5 * Math.sin(u * 0.083 + 2.0)); };
  zpath(X - 14, X + 34, PZ_);
  // 大起伏：整片地面（连孩子走的那条路）一起高低起伏，沿路高低差一米多，一个坡十来米长；墙脚附近收平（墙是平着砌的），章节两头收回 0。
  //   孩子脚下的物理地形就按它登记（沿着那条弯路取值），所以走起来是真的上坡下坡。细碎的起伏只在路两边（见 build 里的 hFront / hBack）
  const vh = (a, b) => { const t = Math.sin(a * 127.1 + b * 311.7 + 17.3) * 43758.5453; return t - Math.floor(t); };
  const vn2 = (x, z) => { const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz, u = fx * fx * (3 - 2 * fx), w = fz * fz * (3 - 2 * fz);
    return lerp(lerp(vh(ix, iz), vh(ix + 1, iz), u), lerp(vh(ix, iz + 1), vh(ix + 1, iz + 1), u), w); };
  const BIG = (x, z) => { const u = x - WX; return sstep(-22, -16, u) * (1 - sstep(20, 26, u)) * sstep(0.4, 3.2, Math.abs(u)) * (2.0 * (vn2(x * 0.11, z * 0.14) - 0.5) + 0.5 * (vn2(x * 0.37 + 5, z * 0.4) - 0.5)); };
  { const pts = []; for (let x = X - 60; x <= X + 60.001; x += 0.5) pts.push([x, BIG(x, PZ_(x))]); terrain(...pts); }
  // 地面用的大起伏：孩子身前（往镜头这边）不许高过脚下这条路 —— 只能往下走，不挡人；身后照样起伏
  const BIGG = (x, z) => { const b = BIG(x, z), zr = z - PZ_(x); if (zr <= 0) return b; const bp = BIG(x, PZ_(x)); return lerp(b, Math.min(b, bp - 0.15 * zr), sstep(0, 1.2, zr)); };
  camKeys([X - 12, 10.5, 0.95, 0.5, -0.32], [X + 30, 10.5, 0.95, 0.5, -0.32]);   // 镜头压低到差不多孩子眼睛的高度：墙才看得出是墙，不是一条路
  const NIGHT = { fog: 0x2f3439, fogD: 0.034, hemiS: 0x8a949c, hemiG: 0x15171a, hemiI: 1.0, keyC: 0xc4ccd4, keyI: 1.5, keyDir: [-0.25, 0.9, -0.35], rimC: 0x8090b0, rimI: 0,
    dustC: 0xa0a8ae, dustO: 0.22, wind: 0.03, ext: 1, sky: [0x1f2327, 0x262a2f, 0x2c3136, 0x30353a, 0x2f3439, 0x2f3439], sunX: -0.52, sunY: 0.2, sunC: 0xd2d8da, sunP: 0.85,   // 光源在画面左上边缘外：只透进来一团光晕，看不到圆盘
    stars: 0, cloud: 0, birds: 0, flies: 0, vig: 1.15,
    aWind: 0.22, aWhis: 0, aLeaf: 0.08, aBug: 0.55, aDrip: 0, aFlow: 0, aRoom: 0, aHum: 0, aCity: 0.08, aFar: 0.5, rvOut: 1, rvHall: 0, rvCave: 0 };
  env(X - 20, NIGHT); env(X + 60, NIGHT);
  FAR[OLD + 14] = ['owl', 'twig', 'owl'];


  // ---- 豁口：{ z 在哪, w 半宽, d 塌下去几层, p 形状（小于 1 圆，大于 1 尖）} ----
  // 玩法平面（z = 0）上那一截要整整齐齐，跳过去的高度才是定的
  const NOTCH = [{ z: -3.9, w: 0.42, d: 2, p: 0.8 }, { z: -9.6, w: 1.35, d: 6, p: 1.1 }, { z: -15.8, w: 0.5, d: 3, p: 1.6 },
    { z: -21.5, w: 0.9, d: 2, p: 0.7 }, { z: -27, w: 1.7, d: 7, p: 1.2 }];
  withSeed(14141, () => { for (let z = -34; z > Z0; z -= rr(5, 15)) NOTCH.push({ z, w: rr(0.3, 1.7), d: Math.round(rr(1, 7)), p: rr(0.7, 1.6) }); });
  const hsh = (a, b, c = 0) => { const s = Math.sin(a * 127.1 + b * 311.7 + c * 74.7) * 43758.5453; return s - Math.floor(s); };
  // 从上往下数第 t 层（0 是压顶砖，1 是最上面一层砖）在 z 处还在不在。jit：每块砖自己的一点出入，豁口的边才是参差的
  function gone(t, z, jit) {
    for (const n of NOTCH) {
      const u = Math.abs(z - n.z) / n.w; if (u > 1.7) continue;
      if (t === 0 ? u < 1.12 + 0.18 * jit : t <= n.d * (1 - Math.pow(Math.min(u, 1), n.p)) + 0.45 * jit) return true;
    }
    return false;
  }
  const notchU = z => { let m = 9; for (const n of NOTCH) m = Math.min(m, Math.abs(z - n.z) / n.w); return m; };

  // ---- 着色：这一章的墙、地面、灯杆都走这一套 ----
  // wallD：天光和月光（环境光、平行光）在这一点还剩多少。灯（聚光灯、点光源）不受它管，所以远处的灯照到的那一小块还是亮的
  const WU = { uT: { value: 0 }, uHX: { value: 0 } };   // uHX：孩子在墙的哪一边、离墙多远（x - WX）
  const v3 = h => { const c = new THREE.Color(h); return `vec3(${c.r.toFixed(4)}, ${c.g.toFixed(4)}, ${c.b.toFixed(4)})`; };
  const GL_COMMON = `varying vec3 vWP; varying vec3 vWN; uniform float uT, uHX;
    float h21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
    float h31(vec3 p) { p = fract(p * vec3(.1031, .1030, .0973)); p += dot(p, p.yxz + 33.33); return fract((p.x + p.y) * p.z); }
    float n2(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
      return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
    float n3(vec3 p) { vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
      return mix(mix(mix(h31(i), h31(i + vec3(1, 0, 0)), f.x), mix(h31(i + vec3(0, 1, 0)), h31(i + vec3(1, 1, 0)), f.x), f.y),
                 mix(mix(h31(i + vec3(0, 0, 1)), h31(i + vec3(1, 0, 1)), f.x), mix(h31(i + vec3(0, 1, 1)), h31(i + vec3(1, 1, 1)), f.x), f.y), f.z); }
    float pzf(float u) { return smoothstep(-22., -16., u) * (1. - smoothstep(20., 26., u)) * 2.2 * (0.9 * sin(u * 0.21 + 0.6) + 0.5 * sin(u * 0.083 + 2.0)); }
    float wallD(vec3 q, float hy) {                                          // hy：高出周围大起伏多少（地面传细起伏的高度，别的传 q.y）
      float qz = q.z - pzf(q.x);                                             // 离那条弯路多远（往镜头这边为正）
      float dz = max(0., -qz);
      // 光就是不打：没有理由，画面要哪里黑哪里就黑
      float base = 0.04 + 0.96 * exp(-max(0., dz - 1.) / 6.);               // 孩子走的那一带最亮，往后很快暗下去
      base *= 1. - smoothstep(0.3, 2.8, qz - 3.5 * hy + 1.6 * (n2(q.xz * vec2(0.28, 0.4)) - .5) + 0.6 * (n2(q.xz * vec2(0.9, 1.1) + 3.) - .5));   // 往镜头这边：两米之内压到纯黑。鼓起来的地方多接一点光、凹下去的先黑，暗的边顺着地面起伏弯过去
      float hx = q.x - uHX;
      base *= mix(mix(0.1, 1., exp(-hx * hx / 7.)), 1., smoothstep(6., 18., dz));   // 近处只照孩子周围两三米（跟着孩子走）；远处不管
      vec2 c2 = vec2(q.x * 0.03 + uT * 0.016, q.z * 0.045);                  // 云缝：几块月光，慢慢飘过去
      float cl = n2(c2) * 0.65 + n2(c2 * 2.3 + 7.1) * 0.35;
      float gap = smoothstep(0.56, 0.7, cl) * smoothstep(14., 30., dz) * exp(-dz / 80.);
      return (base + 1.4 * gap) * (1. - smoothstep(80., 210., dz));
    }`;
  const SURF = [
    // 0 一块块的砖、灰缝、塌下来的砖：颗粒、小坑、朝上的面长青苔、墙面上的雨痕和地衣、墙脚泛白的盐霜
    `float fd = 1. - smoothstep(5., 30., distance(vWP, cameraPosition));
    float g1 = n3(q * 46.), g2 = n3(q * 11. + 1.7), g3 = n3(q * 150. + 4.2);
    float gr = 0.8 + 0.3 * g2 + 0.22 * (g1 - .5) + 0.14 * (g3 - .5) - 0.32 * smoothstep(0.8, 0.93, n3(q * 70. + 9.));
    diffuseColor.rgb *= mix(1., gr, 0.15 + 0.85 * fd);
    float up = smoothstep(0.6, 0.9, vWN.y), side = 1. - up;
    float mo = n3(q * 6. + 2.) * 0.7 + n3(q * 25.) * 0.3;
    diffuseColor.rgb = mix(diffuseColor.rgb, ${v3(0x4a5030)} * (0.7 + 0.6 * g1), up * smoothstep(0.48, 0.68, mo) * 0.85);
    float st = smoothstep(0.5, 0.85, n2(vec2(q.z * 7. + q.x * 3., q.y * 0.8))) * smoothstep(${(TOP - 0.75).toFixed(3)}, ${(TOP - 0.05).toFixed(3)}, q.y);
    diffuseColor.rgb *= 1. - 0.45 * st * side;
    diffuseColor.rgb = mix(diffuseColor.rgb, ${v3(0x8a9078)}, smoothstep(0.72, 0.8, n3(q * 14. + 5.)) * side * 0.5);
    diffuseColor.rgb = mix(diffuseColor.rgb, ${v3(0xb0aca0)}, smoothstep(0.55, 0.8, n2(vec2(q.z * 3., q.y * 9.) + q.x)) * (1. - smoothstep(0.05, 0.4, q.y)) * side * 0.3);
    diffuseColor.rgb = mix(diffuseColor.rgb, ${v3(0x3f5a26)}, side * (1. - smoothstep(0.05, 0.38, q.y)) * smoothstep(0.42, 0.7, n3(q * 5. + 7.)) * 0.65);   // 墙根长着青苔
    diffuseColor.rgb *= 1. - 0.38 * smoothstep(0.5, 0.75, n2(vec2(q.z * 0.6, q.y * 1.4) + 3.)) * side;   // 大片的水渍：一块块发暗
    diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 1.35 + 0.02, smoothstep(0.7, 0.82, n2(vec2(q.z * 1.8, q.y * 3.) + 11.)) * side * 0.55);   // 砖面剥落：一片片露出里面浅一点的砖胎`,
    // 1 远处的整条墙：砖缝画在侧面上（按屏幕上多宽来抗锯齿，越远越糊成一片）
    `if (abs(vWN.x) > 0.5) {
      float r = q.y / ${PY.toFixed(4)}, row = floor(r), zz = q.z / ${PZ.toFixed(4)} - mod(row, 2.) * 0.5, col = floor(zz);
      vec2 f = vec2(fract(zz), fract(r)), aa = fwidth(vec2(zz, r)) + 1e-4;
      vec2 jw = vec2(${(J / PZ / 2).toFixed(4)}, ${(J / PY).toFixed(4)});
      float m = smoothstep(jw.x - aa.x, jw.x + aa.x, min(f.x, 1. - f.x)) * smoothstep(jw.y - aa.y, jw.y + aa.y, f.y);
      diffuseColor.rgb *= mix(0.62, 0.8 + 0.4 * h21(vec2(row, col)), m);
      diffuseColor.rgb *= 1. - 0.4 * smoothstep(0.5, 0.85, n2(vec2(q.z * 7., q.y * 0.8))) * smoothstep(${(TOP - 0.75).toFixed(3)}, ${TOP.toFixed(3)}, q.y);
    }
    diffuseColor.rgb *= 0.65 + 0.35 * smoothstep(0., 0.35, q.y);`,
    // 2 地面：山上的岩石 —— 灰色岩面、岩层的纹理、裂开的石缝、地衣斑点；凹处积着碎石和水
    `float fd = 1. - smoothstep(4., 26., distance(vWP, cameraPosition));
    vec2 g = q.xz;
    float big = n2(g * 0.16) * 0.6 + n2(g * 0.5 + 3.) * 0.4, mid = n2(g * 2.1 + 1.3), fine = n3(vec3(g * 24., 0.5)), fine2 = n3(vec3(g * 70., 1.5));
    vec3 c = mix(${v3(0x45454a)}, ${v3(0x5c5b57)}, smoothstep(0.3, 0.8, big));                 // 岩面：深浅不一的灰
    c = mix(c, ${v3(0x3a3936)}, smoothstep(0.55, 0.85, mid) * 0.6);
    float steep = 1. - smoothstep(0.55, 0.9, vWN.y);                                                   // 陡的面上看得到岩层
    float strata = smoothstep(0.75, 0.95, abs(sin(q.y * 9. + q.x * 0.6 + n2(g * 0.8) * 4.)));
    c *= 1. - 0.35 * strata * (0.3 + 0.7 * steep);
    c *= mix(1., 0.72 + 0.4 * fine + 0.25 * (fine2 - .5), fd);                                        // 石面的颗粒
    // 石缝：一格格裂开，近处看得清
    vec2 cg = g * vec2(1.3, 2.1) + 1.1 * vec2(n2(g * 0.7), n2(g * 0.7 + 5.)), ci = floor(cg), cf = fract(cg); float d1 = 9., d2 = 9.;   // 扭过的格子：裂缝长短不一、方向不齐
    for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
      vec2 o = vec2(float(i), float(j)), p = o + vec2(h21(ci + o), h21(ci + o + 7.3)) - cf; float d = dot(p, p);
      if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d;
    }
    float crack = (1. - smoothstep(0., 0.012 + 0.035 * n2(g * 2.3), sqrt(d2) - sqrt(d1))) * smoothstep(0.4, 0.65, n2(g * vec2(0.45, 0.6) + 9.)) * smoothstep(0.3, 0.55, n2(g * 3.7 + 2.));   // 只在一部分地方裂开，一条条断断续续，不像铺的石板
    c *= 1. - 0.6 * crack * (0.4 + 0.6 * fd);
    c = mix(c, ${v3(0x8a8d80)}, smoothstep(0.88, 0.94, n3(vec3(g * 6., 2.))) * (1. - steep) * 0.2);   // 地衣：浅色的斑点，长在朝上的石面
    c = mix(c, ${v3(0x2c2b29)}, smoothstep(-0.03, -0.12, vDet) * 0.6);                             // 凹处积着碎石，暗一些
    // 远处：真的碎石、落叶不放了，纹理里画出它们的印象 —— 深色的碎石点、零星的黄褐色斑点，成片出现；近处的真东西淡出时，这些正好浮现
    float farK = 1. - fd, patchK = smoothstep(0.35, 0.72, n2(g * vec2(0.35, 0.45) + 40.));
    c *= 1. - 0.45 * smoothstep(0.72, 0.86, n2(g * 4.5 + 17.)) * patchK * farK;
    c = mix(c, ${v3(0x6a4a24)}, smoothstep(0.8, 0.9, n2(g * 3.7 + 29.)) * patchK * farK * 0.55);
    float wall = abs(q.x) - ${(T / 2).toFixed(3)};
    c *= mix(0.5, 1., smoothstep(0., 0.42, wall));
    // 水：积在凹下去的石窝里，一块一块的；从低角度看映出一点雾的灰白（见下面 emissivemap 那一段）
    wet14 = clamp(0.7 * smoothstep(-0.06, -0.18, vDet) + 0.6 * smoothstep(0.82, 0.9, n2(g * 0.45 + 21.)), 0., 1.) * smoothstep(0.55, 0.75, n2(g * vec2(1.1, 1.6) + 4.)) * smoothstep(0.35, 0.6, n2(g * 0.7 + 13.));
    c = mix(c, c * 0.4, wet14);
    diffuseColor.rgb = c;`,
    // 3 其它（灯杆）：只跟着压暗
    ``,
  ];
  function shade(mat, kind, sat = 0.35) {          // sat：保留多少颜色（0 全灰，1 原样）。大部分东西都很灰；落叶、树枝这些小东西留一点颜色
    mat.userData.own = true;
    mat.customProgramCacheKey = () => 'ch14-' + kind + '-' + sat;
    mat.onBeforeCompile = sh => {
      sh.uniforms.uT = WU.uT; sh.uniforms.uHX = WU.uHX;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP; varying vec3 vWN;' + (kind === 2 ? ' attribute float aDet; varying float vDet;' : ''))
        .replace('#include <fog_vertex>', `#include <fog_vertex>
          vec4 wp14 = vec4(transformed, 1.0); vec3 wn14 = objectNormal;
          #ifdef USE_INSTANCING
            wp14 = instanceMatrix * wp14; wn14 = mat3(instanceMatrix) * wn14;
          #endif
          vWP = (modelMatrix * wp14).xyz; vWN = normalize(mat3(modelMatrix) * wn14);${kind === 2 ? ' vDet = aDet;' : ''}`);
      const lb = THREE.ShaderChunk.lights_fragment_begin, hook = 'getDirectionalLightInfo( directionalLight, directLight );';
      if (!lb.includes(hook)) console.warn('第二十一章：three.js 的光照代码变了，月光不会跟着压暗');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + GL_COMMON + (kind === 2 ? '\nvarying float vDet;' : ''))
        .replace('#include <color_fragment>', `#include <color_fragment>
          float wet14 = 0.; vec3 q = vWP - vec3(${WX.toFixed(2)}, 0., 0.); float wD = wallD(q, ${kind === 2 ? 'vDet' : 'q.y'});
          ${SURF[kind]}
          diffuseColor.rgb = mix(vec3(dot(diffuseColor.rgb, vec3(.299, .587, .114))), diffuseColor.rgb, ${sat.toFixed(2)});   // 去掉大部分颜色：只留一点点，小东西上的颜色看得出区别`)
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
          totalEmissiveRadiance += fogColor * wet14 * (0.2 + 0.8 * pow(1. - max(dot(normalize(cameraPosition - vWP), vec3(0., 1., 0.)), 0.), 4.)) * 0.22 * smoothstep(0.15, 0.7, wD);`)   // 水渍映出雾
        .replace('#include <lights_fragment_begin>', lb.replace(hook, hook + ' directLight.color *= wD;'))
        .replace('#include <lights_fragment_end>', '#include <lights_fragment_end>\n reflectedLight.indirectDiffuse *= wD;')
        .replace('#include <opaque_fragment>', '{ float gL = dot(outgoingLight, vec3(.299, .587, .114)); outgoingLight *= mix(vec3(0.9, 0.98, 1.1), vec3(1.07, 1.0, 0.9), smoothstep(0.015, 0.2, gL)); }   // 调色：暗处偏一点冷青，亮处偏一点暖\n#include <opaque_fragment>');
    };
    return mat;
  }

  // ---- 几何：带倒角的方块（倒角让砖棱接住灯光）。e = 0 就是普通的方块 ----
  const _e = new THREE.Euler(), _m = new THREE.Matrix4(), _a = V3(0, 0, 0), _b = V3(0, 0, 0), _c = V3(0, 0, 0), _n = V3(0, 0, 0), _o = V3(0, 0, 0);
  function boxTris(hx, hy, hz, e) {
    const h = [hx, hy, hz], out = [];
    const Pt = (a, va, b, vb, c, vc) => { const p = [0, 0, 0]; p[a] = va; p[b] = vb; p[c] = vc; return p; };
    const quad = (p0, p1, p2, p3) => out.push(p0, p1, p2, p0, p2, p3);
    for (let a = 0; a < 3; a++) {
      const b = (a + 1) % 3, c = (a + 2) % 3, hb = h[b] - e, hc = h[c] - e;
      for (const s of [-1, 1]) {
        quad(Pt(a, s * h[a], b, -hb, c, -hc), Pt(a, s * h[a], b, hb, c, -hc), Pt(a, s * h[a], b, hb, c, hc), Pt(a, s * h[a], b, -hb, c, hc));
        if (e > 0) for (const t of [-1, 1]) quad(Pt(a, s * h[a], b, t * hb, c, -hc), Pt(a, s * (h[a] - e), b, t * h[b], c, -hc), Pt(a, s * (h[a] - e), b, t * h[b], c, hc), Pt(a, s * h[a], b, t * hb, c, hc));
      }
    }
    if (e > 0) for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1])
      out.push([sx * hx, sy * (hy - e), sz * (hz - e)], [sx * (hx - e), sy * hy, sz * (hz - e)], [sx * (hx - e), sy * (hy - e), sz * hz]);
    return out;
  }
  // 往一份顶点表里加一块：中心 (x, y, z)，半尺寸，倒角，转角 [rx, ry, rz]，颜色
  function pushBox(A, x, y, z, hx, hy, hz, e, rot, col) {
    const tr = boxTris(hx, hy, hz, e);
    _m.makeRotationFromEuler(_e.set(rot[0], rot[1], rot[2])); _m.setPosition(x, y, z); _o.set(x, y, z);
    for (let i = 0; i < tr.length; i += 3) {
      _a.fromArray(tr[i]).applyMatrix4(_m); _b.fromArray(tr[i + 1]).applyMatrix4(_m); _c.fromArray(tr[i + 2]).applyMatrix4(_m);
      _n.subVectors(_b, _a).cross(V3(_c.x - _a.x, _c.y - _a.y, _c.z - _a.z));
      const mid = V3((_a.x + _b.x + _c.x) / 3 - x, (_a.y + _b.y + _c.y) / 3 - y, (_a.z + _b.z + _c.z) / 3 - z);
      let p1 = _b, p2 = _c; if (_n.dot(mid) < 0) { p1 = _c; p2 = _b; _n.negate(); }
      _n.normalize();
      for (const p of [_a, p1, p2]) { A.p.push(p.x, p.y, p.z); A.n.push(_n.x, _n.y, _n.z); if (col) { const k = A.mottle ? 0.88 + 0.24 * hsh(p.x * 37, p.y * 91, p.z * 53) : 1; A.c.push(col.r * k, col.g * k, col.b * k); } }   // 每块砖的几个角深浅不一，砖面是斑驳的
    }
  }
  function meshOf(A, mat) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(A.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(A.n, 3));
    if (A.c.length) g.setAttribute('color', new THREE.Float32BufferAttribute(A.c, 3));
    g.computeBoundingSphere();
    const m = new THREE.Mesh(g, mat); m.castShadow = m.receiveShadow = true; m.frustumCulled = false; return m;
  }

  // 砖的颜色：烧得深浅不一的旧红砖，夜里看都偏暗偏灰
  const BRICK = [0x7a4a3a, 0x6e4234, 0x83523d, 0x5e3a2f, 0x8a5a44, 0x6a4a3c, 0x4e3a33, 0x75503e, 0x5a4136].map(h => new THREE.Color(h));
  const CLINKER = new THREE.Color(0x3a2a2a), PATCH = new THREE.Color(0x6a5e4c);
  const brickCol = (y, k = 1) => { const u = rnd(), c = (u < 0.05 ? CLINKER.clone() : u < 0.065 ? PATCH.clone() : pick(BRICK).clone()).multiplyScalar(rr(0.82, 1.12) * k); return c.multiplyScalar(0.62 + 0.38 * sstep(0, 0.3, y)); };   // 偶尔一块过火的深色砖、一块后来补上的灰黄砖；墙脚返潮，暗下去

  let V = null;
  function* build(R) {
    const v = {};
    // 手机（触屏）上降一档：地面网格放粗、砖不倒角、地上的东西减量、雾片少两层。地址后面加 ?low=1 在电脑上也能看这一档
    const LOW = new URLSearchParams(location.search).get('low') === '1' || (typeof touchMode !== 'undefined' && touchMode);
    const A = { p: [], n: [], c: [], mottle: true }, M = { p: [], n: [], c: [] }, F = { p: [], n: [], c: [] };
    // ---- 近处：一层一层地砌。第 5 层是丁砖（砖头朝外），其余是顺砖，上下错开半块 ----
    for (let r = 0; r < NC; r++) {
      const t = NC - r, header = r === 5, pitch = header ? BD + J : PZ, len = header ? BD : BL, off = header ? 0 : (r % 2) * PZ / 2, runs = [];
      for (const f of [-1, 1]) {
        const k0 = Math.floor((ZN - off) / pitch), k1 = Math.ceil((Z1 - off) / pitch);
        for (let k = k0; k <= k1; k++) {
          const zc = off + (k + 0.5) * pitch; if (zc < ZN || zc > Z1) continue;
          if (gone(t, zc, hsh(k, r, f) * 2 - 1)) continue;
          const spall = rnd() < 0.05, hx = header ? 0.085 : BD / 2, rec = spall ? rr(0.005, 0.012) : rr(0, 0.0035);
          const hy = BH / 2 - rr(0, 0.0025) - (spall ? 0.003 : 0), hz = len / 2 - rr(0.0005, 0.004) - (spall ? 0.004 : 0);
          const loose = notchU(zc) < 1.25 && t <= 2 ? 1 : 0;                                   // 豁口边上的砖有点松动
          const y = r * PY + J + BH / 2 + rr(-0.0015, 0.0015), bow = (y / TOP) * (0.008 * Math.sin(zc * 0.31 + 1) + 0.006 * Math.exp(-Math.pow((zc + 7) / 1.6, 2)) - 0.005 * Math.exp(-Math.pow((zc - 4.5) / 1.3, 2))), x = WX + f * (T / 2 - hx - rec) + bow + rr(-0.002, 0.002);   // bow：墙这里往一边歪一点、那里鼓出来一点
          pushBox(A, x, y, zc + rr(-0.003, 0.003), hx, hy, hz, !LOW && zc > -14 ? 0.0065 : 0,
            [rr(-0.006, 0.006) + loose * rr(-0.03, 0.03), rr(-0.012, 0.012) + loose * rr(-0.05, 0.05), rr(-0.006, 0.006) + loose * rr(-0.04, 0.04)], brickCol(y, spall ? 0.85 : 1));
          runs.push([zc - len / 2, zc + len / 2]);
        }
      }
      // 灰缝：这一层还有砖的地方连成一段段，比砖面缩进去 MI
      runs.sort((a, b) => a[0] - b[0]);
      const merged = []; for (const s of runs) { const l = merged[merged.length - 1]; if (l && s[0] <= l[1] + J * 1.5) l[1] = Math.max(l[1], s[1]); else merged.push([...s]); }
      for (const [z0, z1] of merged) pushBox(M, WX, r * PY + PY / 2, (z0 + z1) / 2, T / 2 - MI, PY / 2, (z1 - z0) / 2 + J / 2, 0, [0, 0, 0],
        new THREE.Color(0x77736a).multiplyScalar(rr(0.6, 0.85) * (0.6 + 0.4 * sstep(0, 0.3, r * PY))));
      if (r % 3 === 2) yield;
    }
    // ---- 压顶：一排立着砌的砖，横跨墙顶分成两块，比墙面挑出来一点。豁口边上的歪着、挪了位，零星缺一两块 ----
    {
      const pc = BH + J, hxc = (T + 0.03) / 4 - J / 2, runs = [];
      for (let k = Math.floor(ZN / pc); k <= Math.ceil(Z1 / pc); k++) {
        const zc = (k + 0.5) * pc; if (zc < ZN || zc > Z1) continue;
        if (gone(0, zc, hsh(k, 77) * 2 - 1) || (hsh(k, 99) < 0.02 && Math.abs(zc) > 0.6)) continue;
        const u = notchU(zc), loose = u < 1.5 ? sstep(1.5, 1.1, u) : 0;
        for (const s of [-1, 1]) {
          const hy = 0.05 + rr(-0.003, 0.003), y = NC * PY + J + hy + loose * rr(0, 0.02);
          pushBox(A, WX + s * (hxc + J / 2) + loose * rr(-0.03, 0.03), y, zc + rr(-0.002, 0.002) + loose * rr(-0.015, 0.015), hxc + rr(-0.002, 0.002), hy, BH / 2 - rr(0.0005, 0.002), !LOW && zc > -14 ? 0.006 : 0,
            [rr(-0.01, 0.01) + loose * rr(-0.12, 0.12), rr(-0.015, 0.015) + loose * rr(-0.2, 0.2), rr(-0.01, 0.01) + loose * rr(-0.15, 0.15)], brickCol(1, 0.78).lerp(new THREE.Color(0x5a5650), 0.25));
        }
        runs.push([zc - BH / 2, zc + BH / 2]);
      }
      const merged = []; for (const s of runs) { const l = merged[merged.length - 1]; if (l && s[0] <= l[1] + J * 1.5) l[1] = Math.max(l[1], s[1]); else merged.push([...s]); }
      for (const [z0, z1] of merged) pushBox(M, WX, NC * PY + (J + CAPH) / 2, (z0 + z1) / 2, (T + 0.03) / 2 - MI, (J + CAPH) / 2 - 0.004, (z1 - z0) / 2 + J / 2, 0, [0, 0, 0], new THREE.Color(0x6e6a62).multiplyScalar(0.7));
    }
    yield;
    // ---- 塌下来的砖：散在豁口底下的墙脚两边，有整块的也有断成半截的，有的竖着插在土里 ----
    for (const n of NOTCH) {
      if (n.z < ZN + 2) continue;
      const cnt = Math.round(n.w * n.d * 2.2 + 2);
      for (let i = 0; i < cnt; i++) {
        const s = rnd() < 0.5 ? -1 : 1, d = Math.pow(rnd(), 1.6) * 1.1, x = WX + s * (T / 2 + 0.06 + d), z = n.z + rr(-1.25, 1.25) * n.w;
        if (Math.abs(z) < 0.5 && Math.abs(x - WX) < 1.4) continue;                                // 不挡着脚下的路
        const half = rnd() < 0.4, hz = half ? rr(0.04, 0.08) : BL / 2, edge = rnd() < 0.18;
        const hy = edge ? BD / 2 : BH / 2, hx = edge ? BH / 2 : BD / 2;
        pushBox(A, x, hy - rr(0.005, 0.02), z, hx, hy, hz, 0.006, [rr(-0.12, 0.12), rr(0, 6.28), rr(-0.1, 0.1)], brickCol(0.05, 0.9));
        if (rnd() < 0.5) pushBox(A, x + rr(-0.25, 0.25), 0.012, z + rr(-0.25, 0.25), rr(0.015, 0.035), rr(0.01, 0.02), rr(0.015, 0.04), 0.004, [rr(-0.3, 0.3), rr(0, 6.28), rr(-0.3, 0.3)], brickCol(0.05, 0.8));   // 碎渣
      }
    }
    yield;
    // ---- 远处：一整条墙体，豁口的轮廓按一块砖的宽度一段段地算（不带每块砖自己的出入），合并成大块 ----
    {
      const cols = [];
      for (let z = ZN; z > Z0; z -= PZ) {
        const zc = z - PZ / 2; let lim = 0;
        for (const n of NOTCH) { const u = Math.abs(zc - n.z) / n.w; if (u < 1) lim = Math.max(lim, n.d * (1 - Math.pow(u, n.p))); }
        cols.push([z, NC - Math.floor(lim), !gone(0, zc, 0)]);
      }
      for (let i = 0; i < cols.length;) {
        let j = i; while (j + 1 < cols.length && cols[j + 1][1] === cols[i][1] && cols[j + 1][2] === cols[i][2]) j++;
        const za = cols[i][0], zb = cols[j][0] - PZ, cnt = cols[i][1], h = cnt * PY;
        if (cnt > 0) pushBox(F, WX, h / 2, (za + zb) / 2, T / 2 - 0.004, h / 2, (za - zb) / 2, 0, [0, 0, 0], null);
        if (cols[i][2] && cnt === NC) pushBox(F, WX, NC * PY + (J + CAPH) / 2, (za + zb) / 2, (T + 0.03) / 2, (J + CAPH) / 2, (za - zb) / 2, 0, [0, 0, 0], null);
        i = j + 1;
      }
    }
    const brickMat = shade(lam(0xffffff, { vertexColors: true }), 0, 0.45);
    v.wall = meshOf(A, brickMat); R.add(v.wall);
    v.mortar = meshOf(M, brickMat); R.add(v.mortar);
    v.far = meshOf(F, shade(lam(0x6a4436), 1)); R.add(v.far);
    yield;
    // ---- 地面：一整块，颜色在着色器里算（越远越暗也在那里） ----
    // 地面：近处（z > -6）一块细的、远处一块粗的，用同一个高度函数，接缝对得上
    const groundMat = shade(lam(0xffffff, { flatShading: true }), 2, 0.5);   // 一个个平的小面：看上去是棱角分明的岩面
    {
      const vn = (x, z) => { const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz, u = fx * fx * (3 - 2 * fx), w = fz * fz * (3 - 2 * fz);
        return lerp(lerp(hsh(ix, iz, 3), hsh(ix + 1, iz, 3), u), lerp(hsh(ix, iz + 1, 3), hsh(ix + 1, iz + 1, 3), u), w); };
      // 孩子身前（z > 0）：土包、浅坑、一道道压出来的辙，越靠镜头起伏越大（不能高到挡住孩子的脚）。孩子走的那条路和墙脚保持平
      const hFront = (x, z) => {
        const k = sstep(0.35, 1.4, z) * sstep(0.35, 1.3, Math.abs(x - WX)), amp = 0.4 + 0.25 * sstep(3, 9, z);
        const ridge = 1 - Math.abs(2 * vn(x * 0.6 + 3, z * 0.7) - 1);                                  // 山脊一样的尖棱
        return k * amp * (1.5 * (vn(x * 0.32, z * 0.4) - 0.5) + 0.7 * (ridge - 0.5) + 0.35 * (vn(x * 2.2, z * 2.4 + 5) - 0.5));
      };
      // 孩子身后（z < 0）：越远越高的丘陵（不会挡住人，可以高）。沿着墙留一条平地，越远越宽 —— 墙顺着一道谷地伸向远处
      const hBack = (x, z) => {
        const dz = -z, s = sstep(0.7, 3.5, dz) * sstep(0.8, 3.5 + dz * 0.15, Math.abs(x - WX)), A = 0.35 + 0.07 * Math.min(dz, 90);
        const hills = A * (1.5 * (vn(x * 0.045, z * 0.035) - 0.45) + 0.5 * (vn(x * 0.16 + 3, z * 0.14) - 0.5) + 0.15 * (vn(x * 0.7, z * 0.7 + 2) - 0.5));
        const crag = A * 0.5 * Math.pow(1 - Math.abs(2 * vn(x * 0.09 + 11, z * 0.08) - 1), 3);          // 一道道突出来的岩脊
        return s * Math.max(-0.25, Math.min(dz * 0.06, 7) + hills + crag);
      };
      const DET = (x, z) => { const zr = z - PZ_(x); return zr >= 0 ? hFront(x, zr) : hBack(x, zr); };   // 细起伏：按离那条弯路多远来算，路上是 0
      const grid = (xs, zs) => {                                       // 按给定的一列列 x、一排排 z 搭一块网格地面
        const pos = [], det = [], idx = [], nx = xs.length;
        for (const z of zs) for (const x of xs) { const d = DET(x, z); pos.push(x, BIGG(x, z) + d, z); det.push(d); }
        for (let j = 0; j < zs.length - 1; j++) for (let i = 0; i < nx - 1; i++) { const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1; idx.push(a, c, b, b, c, d); }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aDet', new THREE.Float32BufferAttribute(det, 1)); g.setIndex(idx); g.computeVertexNormals();
        const m = new THREE.Mesh(g, groundMat); m.receiveShadow = m.castShadow = true; m.frustumCulled = false; R.add(m); return m;
      };
      const span = (a, b, d) => { const o = []; for (let v = a; v < b + d / 2; v += d) o.push(v); return o; };
      const gd = LOW ? 0.4 : 0.25; grid(span(X - 80, X + 120, gd), span(-6, 20, gd));   // 近处
      const zs = []; for (let z = -6, st = 0.25; z > -420; z -= st, st = Math.min(8, st * 1.06)) zs.push(z);   // 远处：越远越稀
      grid(span(X - 160, X + 240, LOW ? 1.6 : 1), zs.reverse());
      // ---- 地上的东西：石块、碎石子、落叶。贴着起伏的地面放，材质也走这一章的明暗（镜头跟前照样是黑的） ----
      //   沿着路散开：路两边多，路中间少（中间只有零星的小石子和几片叶子）；墙脚两边各一溜
      const gy = (x, z) => BIGG(x, z) + DET(x, z);
      const rockMat = shade(lam(0xffffff, { vertexColors: true }), 3, 0.6), leafMat = shade(lam(0xffffff, { side: THREE.DoubleSide }), 3, 0.95);
      const M4 = new THREE.Matrix4(), qq = new THREE.Quaternion(), ee = new THREE.Euler(0, 0, 0, 'YXZ'), cc = new THREE.Color();
      // 撒东西的密度：成片成堆的（大尺度的噪声决定哪里一片、哪里空着），凹处多一些；离路越远越稀，到哪为止各处不一样，没有一条边
      const clump = (x, z) => sstep(0.35, 0.72, vn(x * 0.35 + 40, z * 0.45)) * 0.85 + 0.15;
      const spot = (onPath, reach = 4.5) => {                          // 随便找一处：x 在这一章里，z 在那条弯路前后几米
        for (let tries = 0; ; tries++) {
          const x = rr(X - 15, X + 34), zr = onPath ? rr(-0.45, 0.45) : (rnd() < 0.5 ? -1 : 1) * (0.45 + Math.pow(rnd(), 1.2) * reach * 1.4);
          if (Math.abs(x - WX) < 0.3 && Math.abs(zr) < 1) continue;   // 翻墙的地方空着
          const z = PZ_(x) + zr, edge = reach * (0.7 + 0.6 * vn(x * 0.25 + 7, 3));   // 到哪为止：沿着路各处不一样
          const p = onPath ? 1 : clump(x, z) * sstep(edge, edge * 0.6, Math.abs(zr)) * (DET(x, z) < -0.04 ? 1.6 : 1);
          if (tries > 60 || rnd() < p) return [x, z];
        }
      };
      // 中景、远景的石头：一团一团的，越远越稀、越大（小的到那么远本来就看不清）；墙两边让开
      {
        const pts = [];
        for (let k = 0, nk = LOW ? 22 : 34; k < nk; k++) {
          const dz = 6 + Math.pow(rnd(), 1.3) * 55, cx = rr(X - 30 - dz * 0.3, X + 60 + dz * 0.3), cz = -dz;
          if (Math.abs(cx - WX) < 2.5 + dz * 0.12) continue;
          for (let j = 0, nj = Math.floor(rr(2, 7)); j < nj; j++) { const x = cx + rr(-1.5, 1.5) * (1 + dz * 0.03), z = cz + rr(-1.2, 1.2) * (1 + dz * 0.03);
            pts.push([x, z, rr(0.18, 0.5) * (1 + dz * 0.03) * (j ? rr(0.4, 1) : 1)]); }
        }
        const geos = [7, 19, 31].map(sd => rockGeo(sd, { detail: 0, amp: 0.35, flat: 0.65, moss: 0.4, mossCol: 0x45602a, col: 0x46453f })), per = Math.ceil(pts.length / 3);
        geos.forEach((geo, gi) => {
          const part = pts.slice(gi * per, gi * per + per), mesh = new THREE.InstancedMesh(geo, rockMat, part.length);
          part.forEach(([x, z, sz], i) => { ee.set(rr(-0.2, 0.2), rr(0, 6.28), rr(-0.2, 0.2)); qq.setFromEuler(ee);
            M4.compose(V3(x, gy(x, z) + sz * 0.15, z), qq, V3(sz * rr(1, 1.5), sz * rr(0.6, 0.9), sz * rr(0.8, 1.2))); mesh.setMatrixAt(i, M4); mesh.setColorAt(i, cc.setScalar(rr(0.75, 1.1))); });
          mesh.instanceMatrix.needsUpdate = mesh.instanceColor.needsUpdate = true; mesh.computeBoundingSphere(); mesh.castShadow = mesh.receiveShadow = true; mesh.frustumCulled = false; R.add(mesh);
        });
      }
      // 大一点的石块：一块块单独的，半埋在土里
      for (let i = 0, nb = LOW ? 90 : 150; i < nb; i++) {
        const [x, z] = spot(false), sz = rr(0.06, 0.26) * (rnd() < 0.15 ? 1.6 : 1), flat = rr(0.5, 0.85);
        const m = add(R, rockGeo(Math.floor(rr(0, 9999)), { detail: rnd() < 0.6 ? 0 : 1, flat, amp: rr(0.25, 0.42), moss: rr(0.1, 0.8), mossCol: 0x4f6a2e, col: pick([0x4a4945, 0x3f3e3b, 0x524f4a, 0x3a3936]) }), rockMat, x, gy(x, z) - sz * flat * 0.3, z);
        m.scale.set(sz * rr(0.9, 1.4), sz, sz * rr(0.7, 1.1)); m.rotation.y = rr(0, 6.28);
      }
      // 碎石子：一个带实例的网格，路上也有一些
      {
        const n = LOW ? 450 : 900, geo = rockGeo(11, { detail: 0, amp: 0.25, flat: 0.7, moss: 0, col: 0xffffff }), mesh = new THREE.InstancedMesh(geo, rockMat, n);
        for (let i = 0; i < n; i++) {
          const [x, z] = spot(rnd() < 0.18), sz = rr(0.012, 0.05);
          ee.set(rr(-0.4, 0.4), rr(0, 6.28), rr(-0.4, 0.4)); qq.setFromEuler(ee);
          M4.compose(V3(x, gy(x, z) + sz * 0.15, z), qq, V3(sz * rr(0.9, 1.5), sz * rr(0.5, 0.8), sz * rr(0.8, 1.2))); mesh.setMatrixAt(i, M4);
          mesh.setColorAt(i, cc.set(pick([0x4a4945, 0x3f3e3b, 0x55524b, 0x353431])).multiplyScalar(rr(0.8, 1.15)));
        }
        mesh.instanceMatrix.needsUpdate = mesh.instanceColor.needsUpdate = true; mesh.computeBoundingSphere(); mesh.castShadow = mesh.receiveShadow = true; mesh.frustumCulled = false; R.add(mesh);
      }
      // 落叶：平躺着，少数翘起来一点；成片地堆在土坑、墙脚，路上稀
      {
        const n = LOW ? 700 : 1400, mesh = new THREE.InstancedMesh(leafGeo(), leafMat, n), LV = [];   // 山上叶子不多，大都被风吹到路两边、石头脚下
        for (let i = 0; i < n; i++) {
          let x, z;
          if (rnd() < 0.2) { x = WX + (rnd() < 0.5 ? -1 : 1) * rr(0.2, 0.7); z = PZ_(x) + rr(-5, 4); }      // 墙脚积了一溜
          else if (rnd() < 0.6) { x = rr(X - 15, X + 34); z = PZ_(x) + (rnd() < 0.5 ? -1 : 1) * rr(0.3, 1.8); }   // 多半在路两边一两米之内（被照亮的那一带）
          else [x, z] = spot(rnd() < 0.12);
          const sz = rr(0.08, 0.16), up = rnd() < 0.2 ? rr(0.2, 0.7) : rr(-0.08, 0.08);
          ee.set(rr(-0.08, 0.08), rr(0, 6.28), up); qq.setFromEuler(ee);
          M4.compose(V3(x, gy(x, z) + 0.012 + Math.abs(Math.sin(up)) * sz * 0.4, z), qq, V3(sz, sz * 0.5, sz)); mesh.setMatrixAt(i, M4);
          LV.push({ i, x, z, y: gy(x, z) + 0.012, s: sz, q: qq.clone(), k: null });
          mesh.setColorAt(i, cc.set(pick([0xc8962e, 0xd4a83a, 0xb87a2a, 0xa8642a, 0x8a5a30, 0xc0a040, 0x7a6a38])).multiplyScalar(rr(0.6, 1.05)));   // 黄的、橙黄的、褐的
        }
        mesh.instanceMatrix.needsUpdate = mesh.instanceColor.needsUpdate = true; mesh.computeBoundingSphere(); mesh.receiveShadow = true; mesh.frustumCulled = false; R.add(mesh);
        LV.sort((a, b) => a.x - b.x); v.leaves = { mesh, list: LV, live: [] };
      }
      v.gy = gy; v.leafMat = leafMat;
      // ---- 墙基：墙脚两边垫着一溜山石，上面长青苔 —— 墙是坐在山上的，不是摆在一条平地上 ----
      {
        const pts = [];
        for (const sd of [-1, 1]) for (let z = ZN; z < Z1; z += rr(0.22, 0.4)) {
          if (Math.abs(z - PZ_(WX)) < 0.7) continue;                     // 翻墙的地方空着，不然脚下有石头
          pts.push([WX + sd * (T / 2 + rr(0.0, 0.1)), z, rr(0.13, 0.24), rr(0.06, 0.16)]);
          if (rnd() < 0.18) pts.push([WX + sd * (T / 2 + rr(0.15, 0.45)), z + rr(-0.2, 0.2), rr(0.18, 0.4), rr(0.1, 0.25)]);   // 偶尔一块大的靠在墙脚
        }
        const geo = rockGeo(23, { detail: 0, amp: 0.22, flat: 0.75, moss: 0.9, mossCol: 0x45602a, col: 0x4c4b46 }), mesh = new THREE.InstancedMesh(geo, rockMat, pts.length);
        pts.forEach(([x, z, w, h], i) => {
          ee.set(rr(-0.15, 0.15), rr(0, 6.28), rr(-0.15, 0.15)); qq.setFromEuler(ee);
          M4.compose(V3(x, gy(x, z) + h * 0.35, z), qq, V3(w * rr(0.9, 1.3), h, w * rr(0.8, 1.1))); mesh.setMatrixAt(i, M4); mesh.setColorAt(i, cc.setScalar(rr(0.75, 1.1)));
        });
        mesh.instanceMatrix.needsUpdate = mesh.instanceColor.needsUpdate = true; mesh.computeBoundingSphere(); mesh.castShadow = mesh.receiveShadow = true; mesh.frustumCulled = false; R.add(mesh);
      }
      // ---- 雾里的枯树和岩柱（立体的，代替原来画在布景板上的）：几层，越远越被雾抬浅 ----
      {
        const P_ = [], N_ = [], m4 = new THREE.Matrix4();
        const put = (geo, m) => { geo.applyMatrix4(m); const g = geo.index ? geo.toNonIndexed() : geo; if (!g.attributes.normal) g.computeVertexNormals();
          const a = g.attributes.position.array, n = g.attributes.normal.array; for (let i = 0; i < a.length; i++) { P_.push(a[i]); N_.push(n[i]); } geo.dispose(); if (g !== geo) g.dispose(); };
        const tree3 = (x, y, z, h) => {
          const r = h * rr(0.022, 0.032), lean = rr(-0.08, 0.08);
          const tg = new THREE.CylinderGeometry(r * 0.35, r, h, 7); tg.translate(0, h / 2, 0);
          put(tg, m4.makeRotationZ(lean).setPosition(x, y, z));
          for (let k = 0, nb = Math.floor(rr(4, 8)); k < nb; k++) {
            const t = rr(0.35, 0.92), bx = x - Math.sin(lean) * h * t, by = y + h * t, a = rr(0, 6.28), L = h * rr(0.15, 0.32) * (1.1 - t * 0.5);
            const p0 = V3(bx, by, z), p1 = V3(bx + Math.cos(a) * L * 0.5, by + L * rr(0.2, 0.5), z + Math.sin(a) * L * 0.3), p2 = V3(bx + Math.cos(a) * L, by + L * rr(0.5, 0.9), z + Math.sin(a) * L * 0.5);
            put(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([p0, p1, p2]), 5, r * rr(0.25, 0.4), 5), m4.identity());
            if (rnd() < 0.6) { const q0 = p1.clone().lerp(p2, 0.5), b = a + rr(-1, 1); put(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([q0, V3(q0.x + Math.cos(b) * L * 0.3, q0.y + L * 0.3, q0.z), V3(q0.x + Math.cos(b) * L * 0.5, q0.y + L * 0.55, q0.z + rr(-0.3, 0.3))]), 4, r * 0.15, 4), m4.identity()); }
          }
        };
        const spire = (x, y, z, h) => { const w = h * rr(0.35, 0.6); put(rockGeo(Math.floor(rr(0, 9999)), { detail: 1, amp: 0.38, flat: 1, moss: 0 }), m4.compose(V3(x, y + h * 0.3, z), qq.setFromEuler(ee.set(rr(-0.15, 0.15), rr(0, 6.28), rr(-0.15, 0.15))), V3(w, h * 0.55, w * rr(0.6, 1)))); };   // 一堆坑坑洼洼的岩石，矮而宽
        for (const [z0, n] of [[-13, 9], [-24, 11], [-42, 13], [-70, 15]]) for (let i = 0; i < n; i++) {
          const z = z0 + rr(-4, 4), x = rr(X - 18 + z0 * 0.35, X + 40 - z0 * 0.35);
          if (Math.abs(x - WX) < 2.5 + (-z) * 0.12) continue;             // 墙两边让开，墙一路伸进雾里
          const y = gy(x, z) - 0.3;
          if (z0 > -20 || rnd() < 0.68) tree3(x, y, z, rr(8, 15)); else spire(x, y, z, rr(2.5, 6));   // 岩堆只放在远的几层，近的那层太抢眼
        }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P_, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N_, 3));
        const m = new THREE.Mesh(g, shade(lam(0x24272a), 3, 0.3)); m.frustumCulled = false; R.add(m);
      }
      // 枯树枝：细细的、弯的，有的带一两根分杈，散在路两边，墙脚多一点。全部合成一个网格
      {
        const P = [], N = [];
        const twig = (pts, r) => {
          const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 6, r, 5).toNonIndexed(), a = g.attributes.position.array, n = g.attributes.normal.array;
          for (let i = 0; i < a.length; i++) { P.push(a[i]); N.push(n[i]); } g.dispose();
        };
        for (let i = 0; i < 50; i++) {
          let x, z; if (rnd() < 0.25) { x = WX + (rnd() < 0.5 ? -1 : 1) * rr(0.25, 0.9); z = PZ_(x) + rr(-5, 4); } else [x, z] = spot(rnd() < 0.06);
          const L = rr(0.15, 0.75) * (rnd() < 0.1 ? 1.8 : 1), a = rr(0, 6.28), r = rr(0.005, 0.014) * (L > 0.8 ? 1.5 : 1), dx = Math.cos(a), dz = Math.sin(a), bend = rr(-0.12, 0.12);
          const pts = [0, 0.33, 0.66, 1].map(t => { const px = x + dx * L * (t - 0.5) - dz * bend * Math.sin(t * 3.14), pz = z + dz * L * (t - 0.5) + dx * bend * Math.sin(t * 3.14); return V3(px, gy(px, pz) + r + 0.004 + 0.02 * Math.sin(t * 3.14) * rnd(), pz); });
          twig(pts, r);
          for (let k = 0, nb = rnd() < 0.5 ? Math.floor(rr(1, 3)) : 0; k < nb; k++) {   // 分杈
            const b0 = pts[1 + Math.floor(rnd() * 2)], ba = a + (rnd() < 0.5 ? -1 : 1) * rr(0.4, 0.9), bl = L * rr(0.2, 0.45);
            const b1 = V3(b0.x + Math.cos(ba) * bl, 0, b0.z + Math.sin(ba) * bl); b1.y = gy(b1.x, b1.z) + r * 0.7 + rr(0, 0.05);
            twig([b0, b0.clone().lerp(b1, 0.5).add(V3(0, rr(0, 0.03), 0)), b1], r * 0.6);
          }
        }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
        const m = new THREE.Mesh(g, shade(lam(0x5a3d26), 3, 0.85)); m.castShadow = m.receiveShadow = true; m.frustumCulled = false; R.add(m);
      }
    }
    yield;
    // 很远的地方一排树的剪影，比天边那一点点亮光再黑一点：挡住视线，看不到头
    backdrop(X - 120, X + 140, -2, 20, -215, 5, g => {
      setInk(g, '#030405'); box(g, X - 120, -2, 260, 2.6);
      // 一整片林子：树冠一团团挤在一起，顶上参差不齐，偶尔冒出一棵高一点的针叶树；糊一点，和天几乎分不开
      for (let x = X - 120; x < X + 140; x += rr(0.8, 1.8)) { const h = 5 + 3.5 * Math.sin(x * 0.05) + 2.5 * Math.sin(x * 0.17 + 1) + rr(-1, 1.5); disc(g, x, h - rr(0.5, 1.5), rr(1.2, 2.6)); box(g, x - 1, -2, 2.2, h - 1); }
      for (let x = X - 115; x < X + 135; x += rr(9, 26)) tree(g, x, 0, rr(10, 14), 'pine');
    }, { fog: true, blur: 2.5, blurOnce: true });
    // ---- 雾片：几层半透明的雾，在孩子身后慢慢横着飘（跟着镜头，但花纹钉在世界上，所以走过去是一片片经过的） ----
    {
      const [c, gx] = mkCanvas(1024, 256);
      for (let i = 0; i < 70; i++) {
        const x = rr(0, 1024), y = rr(60, 250), w = rr(60, 220), a = rr(0.08, 0.26);
        for (const ox of [-1024, 0, 1024]) { const gr = gx.createRadialGradient(x + ox, y, 0, x + ox, y, w); gr.addColorStop(0, `rgba(255,255,255,${a})`); gr.addColorStop(1, 'rgba(255,255,255,0)');
          gx.save(); gx.translate(0, y); gx.scale(1, 0.35); gx.translate(0, -y); gx.fillStyle = gr; gx.fillRect(x + ox - w, y - w, 2 * w, 2 * w); gx.restore(); }
      }
      gx.globalCompositeOperation = 'destination-in'; const fade = gx.createLinearGradient(0, 0, 0, 256); fade.addColorStop(0, 'rgba(0,0,0,0)'); fade.addColorStop(0.55, 'rgba(0,0,0,1)'); fade.addColorStop(1, 'rgba(0,0,0,0.85)'); gx.fillStyle = fade; gx.fillRect(0, 0, 1024, 256);
      const tex = canvasTex(c); tex.wrapS = THREE.RepeatWrapping;
      const LAY = [[-2.5, 2.4, 0.1, 0.35], [-6, 4, 0.15, 0.25], [-12, 6.5, 0.18, 0.16], [-22, 10, 0.2, 0.1], [-38, 14, 0.2, 0.07]].slice(0, LOW ? 3 : 5);
      v.fogs = LAY.map(([dz, h, op, sp], i) => {
        const t = tex.clone(); t.needsUpdate = true; t.wrapS = THREE.RepeatWrapping;
        const mat = new THREE.MeshBasicMaterial({ map: t, color: 0x9aa2a8, transparent: true, opacity: op, depthWrite: false, fog: true }); mat.userData.own = true;
        const m = new THREE.Mesh(new THREE.PlaneGeometry(140, h), mat); m.renderOrder = 30 + i; m.frustumCulled = false; R.add(m);
        return { m, t, dz, h, sp, ph: rr(0, 1) };
      });
    }
    // ---- 风吹起来的几片叶子、脚下扬起的灰：先把物件备好，每一帧在 update 里动 ----
    {
      const n = 14, mesh = new THREE.InstancedMesh(leafGeo(), v.leafMat, n), cc = new THREE.Color();
      for (let i = 0; i < n; i++) mesh.setColorAt(i, cc.set(pick([0xc8962e, 0xd4a83a, 0xb87a2a, 0xa8642a])).multiplyScalar(rr(0.7, 1)));
      mesh.instanceColor.needsUpdate = true; mesh.frustumCulled = false; R.add(mesh);
      v.blow = { mesh, list: Array.from({ length: n }, () => ({ on: false, t: 0 })), next: 1 };
      v.puffs = Array.from({ length: 24 }, () => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW_SOFT, color: 0xa4aaae, transparent: true, opacity: 0, depthWrite: false, fog: true }));
        sp.material.userData.own = true; sp.visible = false; R.add(sp); return { sp, t: 9, life: 1, vx: 0, vy: 0, s0: 0.2, s1: 0.6, a: 0.2 }; });
      v.ph = 0; v.air = false;
      // 光柱：从左上那团亮光斜着透下来几道，很淡，在雾里慢慢明灭
      const [c, g] = mkCanvas(64, 256);
      for (let y = 0; y < 256; y++) { const a = Math.pow(Math.sin(Math.PI * y / 256), 0.7) * (1 - y / 300); const gr = g.createLinearGradient(0, 0, 64, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, `rgba(255,255,255,${a})`); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, y, 64, 1); }
      const st = canvasTex(c);
      // 钉在世界里固定的位置（沿着这一章一路排开），人走过去它们留在原地
      v.shafts = [[X - 10, -20, 4, 0.06], [X - 2, -27, 6, 0.05], [X + 7, -22, 5, 0.055], [X + 14, -33, 7, 0.045], [X + 22, -24, 4, 0.05], [X + 31, -30, 6, 0.045], [X + 40, -26, 5, 0.05]].map(([ox, dz, w, op], i) => {
        const mat = new THREE.MeshBasicMaterial({ map: i ? st.clone() : st, color: 0xd6dcdc, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, side: THREE.DoubleSide });
        mat.userData.own = true; if (i) mat.map.needsUpdate = true;
        const m = new THREE.Mesh(new THREE.PlaneGeometry(w, 34), mat); m.rotation.z = -0.42; m.renderOrder = 36; m.frustumCulled = false; R.add(m);
        return { m, ox, dz, op, ph: rr(0, 6.28) };
      });
    }
    V = v;
  }

  const _pm4 = new THREE.Matrix4(), _pq = new THREE.Quaternion(), _pq2 = new THREE.Quaternion(), _pe = new THREE.Euler(), _ps = new THREE.Vector3(), _pv = new THREE.Vector3();
  function update(dt) {
    const here = P.x > X - 16 && P.x < X + 36;
    if (!here) return;
    WU.uT.value = T; WU.uHX.value = P.x - WX;
    // 镜头不越过墙：离墙近的时候，镜头留在孩子这一边（不然墙伸到镜头跟前的那一段会挡住人）
    if (Math.abs(P.x - WX) < 4) { const L = cam.look; camOvr = { d: 10.5, yo: 0.95, lift: -0.32, xo: P.x < WX ? Math.min(0.5, WX - 1.3 - P.x - L) : Math.max(0.5, WX + 1.3 - P.x - L) }; }
    // 孩子的上衣：暗红（全画面唯一一块有颜色的地方）。逃出工厂那几章的衣服逻辑在 escape/60-kit.js，它先跑、到了旧原型的章节会关掉；这里在它后面再打开
    HERO_TOP.uTop.value.setHex(0x4e1a15); HERO_TOP.uTopK.value = 1;
    HERO_RIM.uRimK.value = 0.1;                        // 孩子身上一圈淡淡的边缘亮光：把轮廓从雾里勾出来（只画在孩子身上，不照亮别的）
    const v = V; if (!v || !v.fogs) return;
    for (const sh of v.shafts) { sh.m.position.set(sh.ox, 9, sh.dz); sh.m.material.opacity = sh.op * (0.65 + 0.35 * Math.sin(T * 0.13 + sh.ph)); }   // 位置固定；亮度只随时间慢慢地起伏，和人怎么动无关
    const g = GUST.v ?? 0.6, hz = pathZ(P.x), M4 = _pm4, Q = _pq, S = _ps;
    // 雾片：跟着镜头，花纹钉在世界上、再慢慢地往右飘
    for (const f of v.fogs) { f.m.position.set(cam.x, f.h / 2 - 0.6 + Math.max(0, -f.dz) * 0.05, cam.pz + f.dz); f.t.offset.x = (cam.x + T * f.sp * (0.6 + g)) / 140 + f.ph; }
    // 风吹起来的叶子：从画面左边进来，一边翻一边往右飘，落到地上就收走
    const B = v.blow; B.next -= dt * (0.4 + g);
    if (B.next <= 0) { B.next = rr(0.4, 2.2); const b = B.list.find(o => !o.on); if (b) Object.assign(b, { on: true, t: 0, x: cam.x - 8, y: rr(0.6, 2.6), z: cam.pz + rr(-4, -0.5), vx: rr(1.6, 3.2), vy: rr(-0.2, 0.3), sp: rr(3, 9), ph: rr(0, 6.28) }); }
    B.list.forEach((b, i) => {
      if (!b.on) { M4.makeScale(0, 0, 0); B.mesh.setMatrixAt(i, M4); return; }
      b.t += dt; b.vx = damp(b.vx, 1.2 + 2.4 * g, 1.5, dt); b.vy = damp(b.vy, -0.35 + 0.5 * Math.sin(b.t * 2.3 + b.ph), 2, dt);
      b.x += b.vx * dt; b.y += b.vy * dt; b.z += 0.2 * Math.sin(b.t * 1.7 + b.ph) * dt;
      if (b.x > cam.x + 9 || b.y < v.gy(b.x, b.z) + 0.02) b.on = false;
      Q.setFromEuler(_pe.set(b.t * b.sp, b.t * b.sp * 0.6 + b.ph, b.t * b.sp * 0.8)); M4.compose(S.set(b.x, b.y, b.z), Q, _pv.setScalar(0.12)); B.mesh.setMatrixAt(i, M4);
    });
    B.mesh.instanceMatrix.needsUpdate = true;
    // 脚下扬起的灰：跑起来每一步一小团，落地时一大团
    const puff = (n, k) => { for (let j = 0; j < n; j++) { const p = v.puffs.find(o => o.t >= o.life); if (!p) return;
      Object.assign(p, { t: 0, life: rr(0.6, 1.1) * (0.7 + k * 0.5), x: P.x - P.facing * rr(0, 0.15) + rr(-0.15, 0.15) * k, y: P.y + 0.05, z: hz + rr(-0.12, 0.12), vx: -P.vx * rr(0.05, 0.15) + rr(-0.4, 0.4) * k, vy: rr(0.1, 0.35) * (0.6 + k * 0.6), s0: 0.15 + 0.1 * k, s1: rr(0.45, 0.8) * (0.7 + k * 0.6), a: 0.12 + 0.1 * k }); p.sp.visible = true; } };
    const ph = hero.A.ph, step = P.grounded && Math.abs(P.vx) > 2.2 && Math.floor(ph * 2) !== Math.floor(v.ph * 2); v.ph = ph;
    if (step) puff(1, 0);
    if (v.air && P.grounded && P.impact > 4) puff(5, clamp((P.impact - 4) / 5, 0.3, 1));
    v.air = !P.grounded;
    for (const p of v.puffs) { if (p.t >= p.life) { p.sp.visible = false; continue; }
      p.t += dt; const k = p.t / p.life; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 1 - dt * 1.5; p.vy *= 1 - dt * 1.2;
      p.sp.position.set(p.x, p.y, p.z); p.sp.scale.setScalar(lerp(p.s0, p.s1, Math.sqrt(k))); p.sp.material.opacity = p.a * Math.sin(Math.PI * Math.min(1, k * 1.4)) * (1 - k); }
    // 跑过落叶：脚边的几片被踢起来，翻两下落到前面去
    const L = v.leaves, list = L.list; let lo = 0, hi = list.length;
    while (lo < hi) { const m = (lo + hi) >> 1; if (list[m].x < P.x - 0.4) lo = m + 1; else hi = m; }
    if (P.grounded && Math.abs(P.vx) > 1.6) for (let i = lo; i < list.length && list[i].x < P.x + 0.4; i++) { const o = list[i];
      if (!o.k && Math.abs(o.z - hz) < 0.4 && rnd() < 0.6) { o.k = { vx: P.vx * rr(0.25, 0.55), vy: rr(0.6, 1.5), vz: rr(-0.5, 0.5), sp: rr(6, 14), t: 0 }; L.live.push(o); } }
    for (let j = L.live.length - 1; j >= 0; j--) { const o = L.live[j], k = o.k; k.t += dt; k.vy -= 7 * dt; o.x += k.vx * dt; o.z += k.vz * dt; o.y += k.vy * dt; k.vx *= 1 - dt * 1.5;
      const gy = v.gy(o.x, o.z) + 0.012; if (o.y <= gy && k.vy < 0) { o.y = gy; o.k = null; L.live.splice(j, 1); }
      Q.copy(o.q); if (o.k) Q.multiply(_pq2.setFromEuler(_pe.set(k.t * k.sp, 0, k.t * k.sp * 0.7)));
      M4.compose(S.set(o.x, o.y, o.z), Q, _pv.set(o.s, o.s * 0.5, o.s)); L.mesh.setMatrixAt(o.i, M4); L.mesh.instanceMatrix.needsUpdate = true; }

  }
  return defZone({ n: OLD + 14, vis: [X - 20, X + 40], build, update, reset() {}, solve() {}, unbuild() { V = null; } });
})();
