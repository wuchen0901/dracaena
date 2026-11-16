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
    aWind: 0.62, aWhis: 0.08, aLeaf: 0.22, leafDry: 1, aBug: 0, aDrip: 0, aFlow: 0, aRoom: 0, aHum: 0, aCity: 0, aFar: 0.7,   // 声音：山坡上的风、风刮过枯枝，偶尔一声乌鸦、几颗碎石滚下去
    rvOut: 1, rvHall: 0, rvCave: 0 };
  // 往右走到头：雾越来越浓，把路吞掉（右边那堵空气墙藏在浓雾里）
  env(X - 20, NIGHT); env(X + 19, NIGHT); env(X + 30, { ...NIGHT, fogD: 0.085, hemiI: 1.2 }); env(X + 60, { ...NIGHT, fogD: 0.085, hemiI: 1.2 });
  FAR[OLD + 14] = ['crow', 'twig', 'pebbles', 'crow', 'twig', 'pebbles'];


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
    float rockCrack(vec3 p) {                                               // 石头上的裂缝：三维的格子，越靠近两格交界越接近 0
      vec3 i = floor(p), f = fract(p); float d1 = 9., d2 = 9.;
      for (int z = -1; z <= 1; z++) for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
        vec3 o = vec3(float(x), float(y), float(z)), r = o + vec3(h31(i + o), h31(i + o + 3.1), h31(i + o + 7.7)) - f; float d = dot(r, r);
        if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d;
      }
      return sqrt(d2) - sqrt(d1);
    }
    float rockH(vec3 q, float ck) { return 0.55 * n3(q * 7.) + 0.3 * n3(q * 19. + 2.) + 0.15 * n3(q * 48. + 5.) - 1.1 * ck; }   // 石头表面的高低：几层起伏，裂缝处陷下去
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
    // 4 石头：颗粒、小坑、地衣斑点、雨水流下来的暗痕（不是光溜溜的）；表面的凹凸在 normal_fragment_maps 那一段里打
    `float fd = 1. - smoothstep(4., 24., distance(vWP, cameraPosition));
    float ck14 = (1. - smoothstep(0., 0.03, rockCrack(q * vec3(1.1, 0.8, 1.1) + 11.))) * smoothstep(0.55, 0.75, n3(q * 0.9 + 4.)) * smoothstep(0.35, 0.6, n3(q * 3.5 + 1.));   // 裂缝：只在少数地方有几道，断断续续，不是满石头的网格
    diffuseColor.rgb *= 1. - 0.55 * ck14 * (0.4 + 0.6 * fd);
    diffuseColor.rgb *= 0.92 + 0.08 * sin(q.y * 16. + q.x * 3. + q.z * 2. + n3(q * 2.) * 5.);   // 很淡的岩层纹路
    float g1 = n3(q * 9.), g2 = n3(q * 31. + 2.), g3 = n3(q * 85. + 5.);
    diffuseColor.rgb *= mix(1., 0.74 + 0.34 * g1 + 0.2 * (g2 - .5) + 0.16 * (g3 - .5), 0.35 + 0.65 * fd);
    diffuseColor.rgb *= 1. - 0.38 * smoothstep(0.76, 0.9, n3(q * 46. + 1.)) * fd;
    diffuseColor.rgb = mix(diffuseColor.rgb, ${v3(0x8f9284)}, smoothstep(0.62, 0.8, n3(q * 4.5 + 9.) * 0.7 + n3(q * 16. + 3.) * 0.3) * smoothstep(0.2, 0.7, vWN.y + 0.3) * 0.22);   // 地衣：一片片淡淡的，不是一颗颗白点
    diffuseColor.rgb *= 1. - 0.3 * smoothstep(0.62, 0.86, n2(vec2((q.x + q.z) * 5., q.y * 0.9))) * (1. - smoothstep(0.5, 0.9, vWN.y));`,
    // 5 岩板：几乎不画纹理 —— 像样子全靠形状和光（朝上的平面接天光、侧面暗、板缝里的 AO 烘在顶点色里）。表面只有很淡的大片深浅、近处一点颗粒、
    //   朝上的面一片片淡淡的地衣、侧面雨水流下来的暗痕
    `float fd = 1. - smoothstep(4., 24., distance(vWP, cameraPosition));
    float up5 = smoothstep(0.55, 0.9, vWN.y), sd5 = 1. - up5;
    diffuseColor.rgb *= 0.88 + 0.18 * n3(q * 0.8 + 3.) + 0.1 * (n3(q * 2.9 + 8.) - .5);
    diffuseColor.rgb *= mix(1., 0.93 + 0.1 * n3(q * 24. + 1.) + 0.05 * (n3(q * 75. + 6.) - .5), 0.3 + 0.7 * fd);
    diffuseColor.rgb = mix(diffuseColor.rgb, ${v3(0x9a9c92)}, up5 * smoothstep(0.6, 0.78, n3(q * 2.2 + 5.) * 0.7 + n3(q * 9. + 2.) * 0.3) * 0.16);
    diffuseColor.rgb *= 1. - 0.3 * sd5 * smoothstep(0.55, 0.85, n2(vec2((q.x + q.z) * 3.5, q.y * 0.6) + 7.));`,
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
        .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>' + (kind === 4 ? `
          { float bh = rockH(q, ck14) * 0.014 * (0.25 + 0.75 * fd);
            vec3 sX = dFdx(-vViewPosition), sY = dFdy(-vViewPosition), N = normal, R1 = cross(sY, N), R2 = cross(N, sX); float det = dot(sX, R1);
            vec2 dH = vec2(dFdx(bh), dFdy(bh)); normal = normalize(abs(det) * N - sign(det) * (dH.x * R1 + dH.y * R2)); }   // 石头表面的凹凸：光照下每个小凸起一边亮一边暗，裂缝里暗` : kind === 5 ? `
          { float bh = (0.6 * n3(q * 4.) + 0.4 * n3(q * 15. + 3.)) * 0.006 * (0.3 + 0.7 * fd);
            vec3 sX = dFdx(-vViewPosition), sY = dFdy(-vViewPosition), N = normal, R1 = cross(sY, N), R2 = cross(N, sX); float det = dot(sX, R1);
            vec2 dH = vec2(dFdx(bh), dFdy(bh)); normal = normalize(abs(det) * N - sign(det) * (dH.x * R1 + dH.y * R2)); }   // 岩板：很浅的起伏，平面还是平的` : ''))
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
    // 石头：圆润、风化过的样子（公共的 rockGeo 是一个个平面，棱角太硬）。几层大小不同的起伏叠出形状，法线按共用的顶点平均 —— 表面是平滑过渡的；
    //   底部压平（坐在地上），颜色随起伏有深浅，朝上的地方长青苔。sd：细分几次（近处 2–3，远处、成堆的、手机上 1）
    const rockS = (seed, o = {}) => {
      const g = new THREE.IcosahedronGeometry(1, o.sd ?? 2), p = g.attributes.position, amp = o.amp ?? 0.25, flat = o.flat ?? 0.7, mk = o.moss ?? 0.5;
      const hh = (x, y, z) => { const t = Math.sin(x * 127.1 + y * 311.7 + z * 74.7 + seed * 13.17) * 43758.5453; return t - Math.floor(t); };
      const vn3 = (x, y, z) => { const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z), fx = x - ix, fy = y - iy, fz = z - iz, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), w = fz * fz * (3 - 2 * fz);
        const L = (a, b, t) => a + (b - a) * t, c = (dx, dy, dz) => hh(ix + dx, iy + dy, iz + dz);
        return L(L(L(c(0, 0, 0), c(1, 0, 0), u), L(c(0, 1, 0), c(1, 1, 0), u), v), L(L(c(0, 0, 1), c(1, 0, 1), u), L(c(0, 1, 1), c(1, 1, 1), u), v), w); };
      const nv = new Float32Array(p.count);
      // 几个劈开的平面：方向随机（偏向侧面和上面），切在离中心 0.55–0.85 的地方 —— 每块石头有两三个平的断面和清楚的棱
      const CUTS = []; for (let j = 0, nc = 2 + Math.floor(hh(seed, 3, 1) * 3); j < nc; j++) { const a = hh(j, seed, 5) * 6.2832, e = (hh(seed, j, 9) - 0.25) * 1.6, cx = Math.cos(a) * Math.cos(e), cy = Math.sin(e), cz = Math.sin(a) * Math.cos(e); CUTS.push([cx, cy, cz, 0.55 + 0.3 * hh(j, 7, seed)]); }
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
        const n = 0.48 * vn3(x * 1.4 + 3, y * 1.4, z * 1.4) + 0.26 * vn3(x * 3.2, y * 3.2 + 7, z * 3.2) + 0.16 * vn3(x * 7, y * 7, z * 7 + 2) + 0.1 * vn3(x * 15, y * 15 + 4, z * 15);
        const k = 1 + amp * (2 * n - 1); let px = x * k, yy = y * k * flat, pz = z * k; if (yy < -0.25 * flat) yy = -0.25 * flat + (yy + 0.25 * flat) * 0.35;   // 底部压平
        for (const [cx, cy, cz, d] of CUTS) { const t = px * cx + yy * cy + pz * cz - d; if (t > 0) { px -= cx * t * 0.92; yy -= cy * t * 0.92; pz -= cz * t * 0.92; } }   // 断开的平面：石头被劈掉一块的样子
        p.setXYZ(i, px, yy, pz); nv[i] = n;
      }
      // 平滑的法线：同一个位置的几个顶点（相邻的面各有一份）把面法线加起来再平均
      const key = i => Math.round(p.getX(i) * 1e4) + ',' + Math.round(p.getY(i) * 1e4) + ',' + Math.round(p.getZ(i) * 1e4), acc = new Map(), a = V3(0, 0, 0), b = V3(0, 0, 0), c = V3(0, 0, 0);
      for (let i = 0; i < p.count; i += 3) {
        a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i + 1); c.fromBufferAttribute(p, i + 2);
        const fn = b.clone().sub(a).cross(c.clone().sub(a));
        for (let j = 0; j < 3; j++) { const kk = key(i + j); const v = acc.get(kk); if (v) v.add(fn); else acc.set(kk, fn.clone()); }
      }
      const TINT = new THREE.Color(hh(seed, 2, 2) < 0.5 ? 0x5a4f44 : 0x434a50);   // 每块石头偏一点暖或偏一点冷
      const nrm = new Float32Array(p.count * 3), col = new Float32Array(p.count * 3), base = new THREE.Color(o.col ?? 0x4a4945), moss = new THREE.Color(o.mossCol ?? 0x45602a), cc = new THREE.Color();
      for (let i = 0; i < p.count; i++) {
        const tri = i - i % 3; a.fromBufferAttribute(p, tri); b.fromBufferAttribute(p, tri + 1); c.fromBufferAttribute(p, tri + 2);
        const fnn = b.clone().sub(a).cross(c.clone().sub(a)).normalize();
        const v = acc.get(key(i)).clone().normalize().lerp(fnn, 0.7).normalize(); nrm.set([v.x, v.y, v.z], i * 3);   // 一半按面、一半平滑：棱看得出来，又不是硬邦邦的多边形
        const m = sstep(0.35, 0.8, v.y) * mk * sstep(0.45, 0.65, nv[i] + 0.15 * hh(i, 1, 2));
        cc.copy(base).lerp(TINT, 0.35).multiplyScalar((0.78 + 0.4 * nv[i]) * (0.5 + 0.5 * sstep(-0.32, 0.28, p.getY(i)))).lerp(moss, m); col.set([cc.r, cc.g, cc.b], i * 3);   // 贴地的地方暗：被泥土和潮气染过
      }
      g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); return g;
    };
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
      const rockMat = shade(lam(0xffffff, { vertexColors: true }), 4, 0.6), leafMat = shade(lam(0xffffff, { side: THREE.DoubleSide }), 3, 0.95);
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
      // ---- 岩板：一层层的基岩从坡里露出来，一块块平的、有直边的厚板，顺着同一个倾角一排排叠上去（像瓦片，后一排压着前一排） ----
      //   像不像真的，靠的是形状和光，不是纹理：大平面朝上接天光是浅灰，侧面背光是暗的；上沿一圈窄窄的倒角斜着接光，勾出每块板的边；
      //   板缝里、压在别的板底下的地方暗下去（环境遮蔽，按真的几何算好烘进顶点色）；整片岩层倾角一致，看起来是一整块地层裂开的，不是随手摆的石头
      const slabMat = shade(lam(0xffffff, { vertexColors: true }), 5, 0.5);
      const HEMI = []; for (let i = 0, nh = LOW ? 8 : 14; i < nh; i++) { const t = (i + 0.5) / nh, r = Math.sqrt(t), a = i * 2.39996; HEMI.push([r * Math.cos(a), Math.sqrt(1 - t), r * Math.sin(a)]); }   // 半球上的方向（按余弦分布）：算 AO 用
      const hull2 = pts => {                                           // 平面上一圈点的凸包（逆时针）
        pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
        const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
        for (const p of pts) { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
        for (const p of pts.slice().reverse()) { while (up.length > 1 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
        return lo.slice(0, -1).concat(up.slice(0, -1));
      };
      // o：x, z 第一排在哪；ux, uz 往哪个方向叠上去；w 横着多宽；rows 几排；run 每排往里退多少；rise 每排高多少；h0 第一排高出地面多少；
      //    s 石板大小；dip 往外倾多少（弧度）；zr 给了就是沿着弯路：每块板的 z 跟着路走（路后面 zr 米）；loose 上面再散几块松动的薄板；col 颜色
      const slabBank = o => {
        const S = [], cxv = -o.uz, czv = o.ux, yaw = Math.atan2(-o.ux, -o.uz), s = o.s ?? 1;
        const slab = (x, z, yTop, sw, sd, D, dip, yawJ, roll, lift = 0) => {   // 一块板：本地坐标里顶面在 y = 0，往下 D 米
          let poly; do { const n = 4 + Math.floor(rnd() * 3), P = [];
            for (let i = 0; i < n; i++) { const a = (i + rr(-0.42, 0.42)) / n * 6.2832 + 0.4; P.push([Math.cos(a) * sw / 2 * rr(0.85, 1.2), Math.sin(a) * sd / 2 * rr(0.85, 1.2)]); }
            poly = hull2(P); } while (poly.length < 4);
          const m = new THREE.Matrix4().compose(V3(x, yTop + lift, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(dip, yaw + yawJ, roll, 'YXZ')), V3(1, 1, 1));
          const rad = Math.max(sw, sd) / 2;
          S.push({ poly, D, m, inv: m.clone().invert(), c: V3(0, -D / 2, 0).applyMatrix4(m), r: Math.hypot(rad, D / 2) + 0.05, tone: rr(0.85, 1.12), warm: rnd() < 0.5 });
        };
        const ground0 = gy(o.x, o.z), DIP = o.dip ?? Math.atan2(o.rise, o.run) * 0.85;   // 板顺着坡躺：倾角差不多就是坡的角度，顶面才朝着镜头、接得到天光
        for (let r = 0; r < o.rows; r++) {
          const wr = o.w * (1 - r * (o.taper ?? 0.07));
          for (let c = -wr / 2 + rr(-0.2, 0.2) * s; c < wr / 2;) {
            const sw = rr(0.8, 2.1) * s, sd = o.run * rr(1.3, 1.8), mid = c + sw / 2, along = r * o.run + sd * 0.3 + rr(-0.08, 0.08) * s;
            let x = o.x + o.ux * along + cxv * mid, z = o.z + o.uz * along + czv * mid;
            if (o.zr !== undefined) z = PZ_(x) + o.zr + o.uz * along;
            const g = gy(x, z), yTop = Math.max(ground0 + (o.h0 ?? 0.2) + r * o.rise + rr(-0.3, 0.3) * o.rise, g + 0.12);
            slab(x, z, yTop, sw, sd, yTop - g + 0.7, DIP + rr(-0.08, 0.08), rr(-0.2, 0.2), rr(-0.1, 0.1));
            c += sw * rr(0.72, 0.95);
          }
        }
        // 碎下来的：坡脚几块薄板，平躺在地上；上面几块松动的，斜得厉害一点
        for (let k = 0, nk = o.rubble ?? 5; k < nk; k++) {
          const c = rr(-0.5, 0.5) * o.w, back = rr(-0.9, -0.2) * o.run, sw = rr(0.25, 0.6) * s, x = o.x + o.ux * back + cxv * c;
          const z = o.zr !== undefined ? PZ_(x) + o.zr + o.uz * back : o.z + o.uz * back + czv * c, g = gy(x, z), t = rr(0.06, 0.14) * s;
          slab(x, z, g + t * 0.6, sw, sw * rr(0.6, 1), t + 0.08, rr(-0.15, 0.25), rr(-1.5, 1.5), rr(-0.15, 0.15));
        }
        for (let k = 0, nk = o.loose ?? 2; k < nk && S.length; k++) {
          const b = S[Math.floor(rnd() * Math.min(S.length, 4 * o.rows))], p = V3(rr(-0.2, 0.2), 0, rr(-0.1, 0.25)).applyMatrix4(b.m), t = rr(0.07, 0.16) * s, sw = rr(0.4, 0.9) * s;
          slab(p.x, p.z, p.y + t * 0.5, sw, sw * rr(0.6, 0.9), t, rr(0.2, 0.45), rr(-1, 1), rr(-0.2, 0.2));
        }
        // 每块板的点在不在里面：变回这块板的本地坐标，看高度和平面上的凸多边形
        const inside = (b, p) => {
          const l = p.clone().applyMatrix4(b.inv); if (l.y > 0 || l.y < -b.D) return false;
          const P = b.poly; for (let i = 0; i < P.length; i++) { const a = P[i], c = P[(i + 1) % P.length]; if ((c[0] - a[0]) * (l.z - a[1]) - (c[1] - a[1]) * (l.x - a[0]) < 0) return false; }
          return true;
        };
        // 搭网格：顶面（分几圈，AO 才有地方落）、倒角、侧面（横竖都分几段）。平的法线，每个面一个
        const pos = [], nor = [], col = [], tri = [], base = new THREE.Color(o.col ?? 0x777671), WARM = new THREE.Color(0x5e5348), COOL = new THREE.Color(0x4a5258);
        S.forEach((b, bi) => {
          const P = b.poly, n = P.length, bev = Math.min(0.045 * s, b.D * 0.3), cx = P.reduce((a, p) => a + p[0], 0) / n, cz = P.reduce((a, p) => a + p[1], 0) / n;
          const T = P.map(([x, z]) => { const dx = x - cx, dz = z - cz, l = Math.hypot(dx, dz) || 1; return [x - dx / l * bev * 1.3, z - dz / l * bev * 1.3]; });
          const L = (x, y, z) => V3(x, y, z).applyMatrix4(b.m), mid = L(cx, -b.D / 2, cz);
          const quad = (a, c, d, e) => { tri.push([a, c, d, bi, mid], [a, d, e, bi, mid]); };
          const ring = f => T.map(([x, z]) => L(cx + (x - cx) * f, 0, cz + (z - cz) * f)), r0 = L(cx, 0, cz), r1 = ring(0.45), r2 = ring(0.8), r3 = ring(1);
          for (let i = 0; i < n; i++) { const j = (i + 1) % n; tri.push([r0, r1[i], r1[j], bi, mid]); quad(r1[i], r2[i], r2[j], r1[j]); quad(r2[i], r3[i], r3[j], r2[j]); }
          const ys = [-bev, -bev - 0.12, -bev - 0.35, -bev - 0.8].filter((y, k) => k === 0 || y > -b.D + 0.03); ys.push(-b.D);
          for (let i = 0; i < n; i++) {
            const j = (i + 1) % n, a = P[i], c = P[j], m2 = [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2];
            quad(r3[i], L(a[0], -bev, a[1]), L(c[0], -bev, c[1]), r3[j]);                       // 倒角
            for (let k = 0; k < ys.length - 1; k++) for (const [u, v] of [[a, m2], [m2, c]]) quad(L(u[0], ys[k], u[1]), L(u[0], ys[k + 1], u[1]), L(v[0], ys[k + 1], v[1]), L(v[0], ys[k], v[1]));
          }
        });
        const e1 = V3(0, 0, 0), e2 = V3(0, 0, 0), fn = V3(0, 0, 0), tq = V3(0, 0, 0), bt = V3(0, 0, 0), sp = V3(0, 0, 0), cc2 = new THREE.Color(), aoCache = new Map();
        const ao = (p, nv, own) => {                                    // 这一点四周有多少被别的板、地面挡住：沿半球上的方向走几步，看落在不在别的板里、地底下
          const key = [p.x * 200, p.y * 200, p.z * 200, nv.x * 3, nv.y * 3, nv.z * 3].map(Math.round).join() + ',' + own; if (aoCache.has(key)) return aoCache.get(key);
          tq.set(Math.abs(nv.y) < 0.9 ? 0 : 1, Math.abs(nv.y) < 0.9 ? 1 : 0, 0).cross(nv).normalize(); bt.copy(nv).cross(tq);
          let hit = 0, tot = 0;
          for (const [hx, hy, hz] of HEMI) for (const d of (LOW ? [0.15, 0.5] : [0.1, 0.28, 0.6])) {
            sp.copy(p).addScaledVector(tq, hx * d).addScaledVector(nv, hy * d + 0.01).addScaledVector(bt, hz * d); tot++;
            if (sp.y < gy(sp.x, sp.z) - 0.02) { hit++; continue; }
            for (let k = 0; k < S.length; k++) { const b = S[k]; if (k === own || b.c.distanceToSquared(sp) > b.r * b.r) continue; if (inside(b, sp)) { hit++; break; } }
          }
          const v = 1 - hit / tot; aoCache.set(key, v); return v;
        };
        for (const [a, b, c, bi, mid] of tri) {
          e1.subVectors(b, a); e2.subVectors(c, a); fn.crossVectors(e1, e2).normalize();
          let A = [a, b, c]; if (fn.dot(e1.set((a.x + b.x + c.x) / 3 - mid.x, (a.y + b.y + c.y) / 3 - mid.y, (a.z + b.z + c.z) / 3 - mid.z)) < 0) { A = [a, c, b]; fn.negate(); }   // 法线朝外
          const sb = S[bi];
          for (const p of A) {
            pos.push(p.x, p.y, p.z); nor.push(fn.x, fn.y, fn.z);
            const occ = ao(p, fn, bi), soil = 0.55 + 0.45 * sstep(0, 0.4, p.y - gy(p.x, p.z));   // 贴地的地方被泥土和潮气染暗
            cc2.copy(base).lerp(sb.warm ? WARM : COOL, 0.3).multiplyScalar(sb.tone * soil * (0.22 + 0.78 * Math.pow(occ, 1.25)));
            col.push(cc2.r, cc2.g, cc2.b);
          }
        }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
        const mesh = new THREE.Mesh(g, slabMat); mesh.castShadow = mesh.receiveShadow = true; mesh.frustumCulled = false; R.add(mesh); return mesh;
      };
      // 左边到头：一面层层的岩坡挡住路，往左一排排高上去（左边那堵空气墙就在它跟前）；只放在路上和路后面：放到镜头跟前会把人挡住
      slabBank({ x: X - 12.2, z: PZ_(X - 12) - 1.6, ux: -1, uz: 0, w: 5.6, rows: 5, run: 0.65, rise: 0.45, h0: 0.2, s: 1.2, loose: 3, rubble: 7 }); yield;
      // 路后面露出来的几片岩层：孩子走过时，灯光正好照到它们
      slabBank({ x: X + 1, z: 0, zr: -1.7, ux: 0, uz: -1, w: 4.6, rows: 4, run: 0.75, rise: 0.42, h0: 0.1, s: 1.1 }); yield;
      slabBank({ x: X + 17, z: 0, zr: -2.1, ux: 0, uz: -1, w: 6, rows: 5, run: 0.8, rise: 0.5, h0: 0.12, s: 1.3, loose: 3 }); yield;
      slabBank({ x: X + 27, z: 0, zr: -1.5, ux: 0, uz: -1, w: 3.8, rows: 3, run: 0.7, rise: 0.38, h0: 0.08, s: 1 });
      yield;
      // 中景、远景的石头：一团一团的，越远越稀、越大（小的到那么远本来就看不清）；墙两边让开
      {
        const pts = [];
        for (let k = 0, nk = LOW ? 22 : 34; k < nk; k++) {
          const dz = 6 + Math.pow(rnd(), 1.3) * 55, cx = rr(X - 30 - dz * 0.3, X + 60 + dz * 0.3), cz = -dz;
          if (Math.abs(cx - WX) < 2.5 + dz * 0.12) continue;
          for (let j = 0, nj = Math.floor(rr(2, 7)); j < nj; j++) { const x = cx + rr(-1.5, 1.5) * (1 + dz * 0.03), z = cz + rr(-1.2, 1.2) * (1 + dz * 0.03);
            pts.push([x, z, rr(0.18, 0.5) * (1 + dz * 0.03) * (j ? rr(0.4, 1) : 1)]); }
        }
        const geos = [7, 19, 31].map(sdd => rockS(sdd, { sd: 1, amp: 0.35, flat: 0.65, moss: 0.4, mossCol: 0x45602a, col: 0x46453f })), per = Math.ceil(pts.length / 3);
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
        const m = add(R, rockS(Math.floor(rr(0, 9999)), { sd: LOW ? 1 : 2, flat, amp: rr(0.25, 0.42), moss: rr(0.1, 0.8), mossCol: 0x4f6a2e, col: pick([0x4a4945, 0x3f3e3b, 0x524f4a, 0x3a3936]) }), rockMat, x, gy(x, z) - sz * flat * 0.3, z);
        m.scale.set(sz * rr(0.9, 1.4), sz, sz * rr(0.7, 1.1)); m.rotation.y = rr(0, 6.28);
      }
      // 碎石子：一个带实例的网格，路上也有一些
      {
        const n = LOW ? 450 : 900, geo = rockS(11, { sd: 0, amp: 0.25, flat: 0.7, moss: 0, col: 0xffffff }), mesh = new THREE.InstancedMesh(geo, rockMat, n);
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
        const geo = rockS(23, { sd: LOW ? 1 : 2, amp: 0.22, flat: 0.75, moss: 0.9, mossCol: 0x45602a, col: 0x4c4b46 }), mesh = new THREE.InstancedMesh(geo, rockMat, pts.length);
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
        const spire = (x, y, z, h) => { const w = h * rr(0.35, 0.6); put(rockS(Math.floor(rr(0, 9999)), { sd: 2, amp: 0.38, flat: 1, moss: 0 }), m4.compose(V3(x, y + h * 0.3, z), qq.setFromEuler(ee.set(rr(-0.15, 0.15), rr(0, 6.28), rr(-0.15, 0.15))), V3(w, h * 0.55, w * rr(0.6, 1)))); };   // 一堆坑坑洼洼的岩石，矮而宽
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
      // 每一层雾由一段段固定在世界里的雾片拼成（沿着这一章排开，两头淡出、互相叠着接上），位置完全不跟镜头动；只有花纹自己随风往右飘
      const [mc, mg] = mkCanvas(128, 8); { const gr = mg.createLinearGradient(0, 0, 128, 0); gr.addColorStop(0, '#000'); gr.addColorStop(0.25, '#fff'); gr.addColorStop(0.75, '#fff'); gr.addColorStop(1, '#000'); mg.fillStyle = gr; mg.fillRect(0, 0, 128, 8); }
      const sideFade = new THREE.CanvasTexture(mc); sideFade.channel = 1;                 // 两头淡出：用第二套 UV（每一段自己的 0..1）
      v.fogs = LAY.map(([dz, h, op, sp], i) => {
        const t = tex.clone(); t.needsUpdate = true; t.wrapS = THREE.RepeatWrapping;
        const mat = new THREE.MeshBasicMaterial({ map: t, alphaMap: sideFade, color: 0x9aa2a8, transparent: true, opacity: op, depthWrite: false, fog: true }); mat.userData.own = true;
        const W = 36;
        for (let xc = X - 45; xc < X + 85; xc += 24) {
          const z = PZ_(xc) + dz, geo = new THREE.PlaneGeometry(W, h), uv = geo.attributes.uv, pos = geo.attributes.position;
          geo.setAttribute('uv1', uv.clone());                                             // 每一段自己的 0..1：给两头淡出用
          for (let k = 0; k < uv.count; k++) uv.setX(k, (pos.getX(k) + xc) / 140);         // 花纹按世界 x 取：几段接起来是连着的
          const m = new THREE.Mesh(geo, mat); m.position.set(xc, v.gy(xc, z) + h / 2 - 0.6, z); m.renderOrder = 30 + i; R.add(m);
        }
        return { t, sp, ph: rr(0, 1) };
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

  const VAULT = { on: false, t: 0, d: 1, x0: 0, y0: 0 };
  const _pm4 = new THREE.Matrix4(), _pq = new THREE.Quaternion(), _pq2 = new THREE.Quaternion(), _pe = new THREE.Euler(), _ps = new THREE.Vector3(), _pv = new THREE.Vector3();
  function update(dt) {
    const here = P.x > X - 16 && P.x < X + 36;
    if (!here) return;
    WU.uT.value = T; WU.uHX.value = P.x - WX;
    // 镜头不越过墙：离墙近的时候，镜头留在孩子这一边（不然墙伸到镜头跟前的那一段会挡住人）
    if (Math.abs(P.x - WX) < 4) { const L = cam.look; camOvr = { d: 10.5, yo: 0.95, lift: -0.32, xo: P.x < WX ? Math.min(0.5, WX - 1.3 - P.x - L) : Math.max(0.5, WX + 1.3 - P.x - L) }; }
    // 孩子的上衣：暗红（全画面唯一一块有颜色的地方）。逃出工厂那几章的衣服逻辑在 escape/60-kit.js，它先跑、到了旧原型的章节会关掉；这里在它后面再打开
    HERO_TOP.uTop.value.setHex(0x4e1a15); HERO_TOP.uTopK.value = 1;
    HERO_RIM.uRimK.value = 0.1;
    camJit = { x: 0.045 * Math.sin(T * 0.37) + 0.025 * Math.sin(T * 0.91 + 2), y: 0.03 * Math.sin(T * 0.53 + 1) + 0.015 * Math.sin(T * 1.27) };   // 镜头轻轻地漂，像手持
    // 翻墙：在墙跟前起跳，就换成一段翻越 —— 两手撑住墙头，身子从上面过去，另一边落地（落地交给平常的物理和落地动作）
    {
      const near = Math.abs(P.x - WX) < 1.05 && Math.abs(P.x - WX) > 0.25, dirW = Math.sign(WX - P.x);
      if (!VAULT.on && near && dirW === P.facing && P.vy > 6 && !P.grounded && P.y - groundY(P.x) < 0.25 && state === 'play') {
        Object.assign(VAULT, { on: true, t: 0, d: dirW, x0: P.x, y0: P.y }); ctl = false; fx('grab');
      }
      if (VAULT.on) {
        const V_ = VAULT, d = V_.d; V_.t += dt; const t = V_.t, top = TOP;
        const e1 = sstep(0, 0.28, t), e2 = sstep(0.24, 0.56, t);
        const x = lerp(lerp(V_.x0, WX - d * 0.42, e1), WX + d * 0.5, e2), y = lerp(V_.y0, top + 0.04, e1) + Math.sin(Math.PI * e2) * 0.1 - e2 * 0.05;
        P.x = x; P.y = y; P.vx = 0; P.vy = 0; P.grounded = false; P.facing = d;
        const hk = sstep(0.1, 0.24, t) * (1 - sstep(0.5, 0.62, t));
        HX.pose = { sit: 0.75 * sstep(0.12, 0.3, t) * (1 - sstep(0.48, 0.62, t)), hands: [{ x: WX - d * 0.06, y: top + 0.03, k: hk }, { x: WX + d * 0.04, y: top + 0.03, k: hk }] };   // 两只手撑在墙头上，腿收起来往前送，蹲着翻过去
        if (t >= 0.56) { V_.on = false; ctl = true; P.vx = d * 2.4; P.vy = 0.6; }                                   // 放手：往前一送，自己落下去
      }
    }                       // 孩子身上一圈淡淡的边缘亮光：把轮廓从雾里勾出来（只画在孩子身上，不照亮别的）
    const v = V; if (!v || !v.fogs) return;
    for (const sh of v.shafts) { sh.m.position.set(sh.ox, 9, sh.dz); sh.m.material.opacity = sh.op * (0.65 + 0.35 * Math.sin(T * 0.13 + sh.ph)); }   // 位置固定；亮度只随时间慢慢地起伏，和人怎么动无关
    const g = GUST.v ?? 0.6, hz = pathZ(P.x), M4 = _pm4, Q = _pq, S = _ps;
    // 雾片：跟着镜头，花纹钉在世界上、再慢慢地往右飘
    for (const f of v.fogs) f.t.offset.x = T * f.sp * (0.6 + g) / 140 + f.ph;   // 雾片的位置是固定的，只有花纹随风慢慢往右飘
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
  return defZone({ n: OLD + 14, vis: [X - 20, X + 40], build, update, reset() {}, solve() {}, unbuild() { V = null; VAULT.on = false; } });
})();
