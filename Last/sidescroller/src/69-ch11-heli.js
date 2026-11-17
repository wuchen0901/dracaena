
// ============================================================
//  第十一章 · 夜搜：直升机在找主角
//  （和第九、第十章一样先单独放在最后，从章节菜单进；故事定下来以后再挪到该放的地方）
//  夜里起了雾，一条荒废的公路穿过野地。远处传来旋翼声：一架直升机飞过来，机头下面的探照灯罩着一块地面，沿着公路来回地找；
//  雾里还有五架，前后错开，各扫各的一条地 —— 是在一片一片地搜。
//  路边有四处灯照不进去的地方：候车亭、锈穿了一面的集装箱、铁皮棚、断桥底下。等灯扫过去，跑到下一处；
//  在没遮没挡的地方被灯罩住半秒多，就算被发现，回到最近的存档点（每一处里面都有一个）。
//  躲进断桥底下以后，直升机压低了在桥头来回找一阵；找不到，掉头飞走。风停了，蟋蟀和萤火虫又回来
//  画面照 design/visual-style.md（雾里的剪影，第二十一章试出来的）：光只给孩子周围；近处没有理由地黑；远处被浅灰的雾抬亮、吞掉；
//    颜色几乎全去掉，只留孩子的红上衣、落叶和直升机的航行灯；没有路灯，没有前景道具；远处是雾里一层比一层浅的枯树、谷仓、高压线塔。
//    探照灯不受这些管：它扫到哪里，哪里就亮 —— 画面里最亮的东西还是那盏灯
// ============================================================
const X11 = X10 + 173;                                     // 从吊绳那一章最高一级的豁口下坡，坡脚往右几步就是这一章的公路（src/69-zz-links.js）
const CH11 = (() => {
  const X = X11;
  const C = chapter({ n: OLD + 11, x0: X - 30, start: X + 3, name: '夜搜', sub: '躲开直升机的灯', nocat: true });   // 这一章先不带小猫（故事还没定它这时候在不在）
  const G0 = X - 30, G1 = X + 165;                                                 // 这一章自己铺的地面从哪到哪：两头接着前后两段连接的路（src/69-zz-links.js），那里是共用的地面
  C.ground = 'grass';                                                              // 脚步声：公路是水泥的那一种，过了断桥是土路，再往前是林子里的地
  terrain([X - 70, 0], [X - 8, 0], [X + 6, 0.22], [X + 16, 0.08], [X + 26, 0], [X + 104, 0], [X + 114, 0.35], [X + 128, 1.0], [X + 150, 1.3], [X + 200, 1.3]);
  ground(X - 70, 0x1e2b30); ground(X + 200, 0x1e2b30);
  groundFront(G0, G1, null);                                              // 共用的地面这一段不铺：这一章自己铺（路两边要有起伏，远处要跟着雾）
  surface(X - 8, X + 106, 'concrete'); surface(X + 106, X + 126, 'dirt'); surface(X + 126, X + 200, 'forest');

  // ---------------- 画面：雾里的剪影（照第二十一章的做法，见 design/visual-style.md）----------------
  // 地面的起伏：路面那一条（z 在 RB..RF）是平的，跟着物理地形走；路后面是野地，离路越远起伏越大、越远越高（丘陵在孩子身后，不挡人）；
  //   路前面（往镜头这边）只往下走：一道路沟，再往前是低下去的野地 —— 反正沉在黑里，只管让暗下去的那条边弯弯曲曲
  const RF = 2.7, RB = -2.6;
  const vh = (a, b) => { const t = Math.sin(a * 127.1 + b * 311.7 + 17.3) * 43758.5453; return t - Math.floor(t); };
  const vn2 = (x, z) => { const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz, u = fx * fx * (3 - 2 * fx), w = fz * fz * (3 - 2 * fz);
    return lerp(lerp(vh(ix, iz), vh(ix + 1, iz), u), lerp(vh(ix, iz + 1), vh(ix + 1, iz + 1), u), w); };
  const DET = (x, z) => {
    if (z > RF) { const zr = z - RF, ridge = 1 - Math.abs(2 * vn2(x * 0.6 + 3, z * 0.7) - 1), amp = 0.25 + 0.25 * sstep(2, 9, zr);
      const verge = 0.16 * sstep(0, 0.35, zr) * (1 - sstep(1.0, 2.2, zr)) * (1.5 * vn2(x * 1.3, z * 1.1 + 9) - 0.45);   // 紧挨着路沿的一溜小土包、草墩：顶上接一点光，暗下去的边跟着它们一拱一拱的（不高过路面多少，挡不住人）
      return verge + sstep(0, 1.2, zr) * Math.min(-0.1 * zr, amp * (1.5 * (vn2(x * 0.32, z * 0.4) - 0.5) + 0.7 * (ridge - 0.5) + 0.35 * (vn2(x * 2.2, z * 2.4 + 5) - 0.5)) - 0.12 * zr); }
    if (z < RB) { const dz = RB - z, A = 0.3 + 0.07 * Math.min(dz, 80);
      const hills = A * (1.5 * (vn2(x * 0.04, z * 0.035) - 0.45) + 0.5 * (vn2(x * 0.15 + 3, z * 0.13) - 0.5) + 0.15 * (vn2(x * 0.7, z * 0.7 + 2) - 0.5));
      return sstep(2.2, 5.5, dz) * Math.max(dz > 6 ? Math.min(0.5, 0.02 * dz) : -0.25, Math.min(dz * 0.06, 7) + hills); }   // 电线杆、铁丝网那一溜还是平的（杆上歇着乌鸦）；远处不低于共用的地面（这一章两头外面还铺着它）
    return 0;
  };
  const gy = (x, z) => groundY(x) + DET(x, z);
  // 着色。lite11：天光和月光（环境光、平行光）在这一点还剩多少 —— 只照孩子周围两三米，跟着孩子走；往镜头这边两米之内压到纯黑，
  //   暗下去的边顺着地面起伏弯过去；往远处很快暗下去（远处交给雾）。探照灯（聚光灯）和它照在地上反上来的那点光（点光源）不受它管：灯扫到哪里，哪里就亮
  // haze11：浅灰的雾 —— 离路越远越被抬亮、越看不清；贴着地的雾浓，高处淡一些（天上那几架直升机还看得出影子）
  const HAZE = 0x3c4146;
  const NU = { uT: { value: 0 }, uHX: { value: 0 }, uHaze: { value: new THREE.Color(HAZE) } };
  const haze11 = (dz, y) => { const d = (Math.max(0, dz) + 6) * 0.032; return (1 - Math.exp(-d * d)) * lerp(1, 0.6, sstep(6, 28, y)); };
  const HAZE_GL = 'float haze11(vec3 q) { float d = (max(0., -q.z) + 6.) * 0.032; return (1. - exp(-d * d)) * mix(1., 0.6, smoothstep(6., 28., q.y)); }';
  const v3 = h => { const c = new THREE.Color(h); return `vec3(${c.r.toFixed(4)}, ${c.g.toFixed(4)}, ${c.b.toFixed(4)})`; };
  const GL11 = `varying vec3 vWP; varying vec3 vWN; uniform float uT, uHX; uniform vec3 uHaze;
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
    ${HAZE_GL}
    float lite11(vec3 q, float hy) {
      float qz = q.z, dz = max(0., -qz);
      float base = 0.05 + 0.95 * exp(-max(0., dz - 1.2) / 6.5);
      base *= 1. - smoothstep(0.3, 2.8, qz - 3.5 * hy + 1.6 * (n2(q.xz * vec2(0.28, 0.4)) - .5) + 0.6 * (n2(q.xz * vec2(0.9, 1.1) + 3.) - .5) + 2.0 * (n2(vec2(q.x * 0.11, 7.)) - .5));   // 最后一项：沿着路一段段往前、往后挪，暗下去的边不是一条直线
      float hx = q.x - uHX, pool = mix(0.1, 1., exp(-hx * hx / 9.)) * mix(1., 0.4, smoothstep(2.6, 7., q.y));   // 孩子周围两三米；高处（电线杆顶、桥面）照不到多少
      return base * mix(pool, 1., smoothstep(6., 18., dz));
    }`;
  const SURF11 = [
    // 0 水泥（候车亭、断桥）：颗粒、小坑、从顶沿流下来的雨痕、墙根返潮发暗、长一点青苔
    `float fd = 1. - smoothstep(4., 30., max(0., -q.z));
    float g1 = n3(q * 23.), g2 = n3(q * 5.7 + 1.7), g3 = n3(q * 70. + 4.2);
    diffuseColor.rgb *= mix(1., 0.8 + 0.3 * g2 + 0.2 * (g1 - .5) + 0.14 * (g3 - .5) - 0.25 * smoothstep(0.8, 0.93, n3(q * 40. + 9.)), fd);
    float up = smoothstep(0.6, 0.9, vWN.y), side = 1. - up;
    diffuseColor.rgb *= 1. - 0.38 * side * smoothstep(0.55, 0.85, n2(vec2((q.x + q.z) * 7., q.y * 0.6)));
    diffuseColor.rgb *= 1. - 0.35 * side * (1. - smoothstep(0.02, 0.6, q.y)) * smoothstep(0.35, 0.7, n2(q.xz * 1.3 + 4.));
    diffuseColor.rgb = mix(diffuseColor.rgb, ${v3(0x3f5a26)}, side * (1. - smoothstep(0.02, 0.35, q.y)) * smoothstep(0.45, 0.72, n3(q * 4. + 7.)) * 0.6);
    diffuseColor.rgb = mix(diffuseColor.rgb, ${v3(0x4a5030)}, up * smoothstep(0.5, 0.75, n3(q * 3. + 2.)) * 0.5);`,
    // 1 锈铁（集装箱、铁皮）：一片片的锈斑、往下流的锈痕
    `float r1 = n3(q * vec3(2.2, 0.7, 2.2)), r2 = n3(q * 13. + 2.), r3 = n3(q * 47.);
    diffuseColor.rgb *= 0.72 + 0.45 * r1 + 0.16 * (r2 - .5) + 0.12 * (r3 - .5);
    diffuseColor.rgb = mix(diffuseColor.rgb, ${v3(0x7a4a2c)}, smoothstep(0.55, 0.82, n3(q * vec3(3., 0.9, 3.) + 9.)) * 0.55);
    diffuseColor.rgb *= 1. - 0.3 * smoothstep(0.6, 0.85, n2(vec2((q.x + q.z) * 11., q.y * 0.45)));`,
    // 2 木头（板子、木柱、电线杆、长凳）：顺着板子的木纹，一块块深浅不一
    'diffuseColor.rgb *= 0.78 + 0.3 * n2(vec2((q.x + q.z) * 34., q.y * 1.3)) + 0.12 * (n3(q * 9.) - .5);',
    // 3 其它：只跟着压暗
    '',
    // 4 地面：野地 —— 枯草和泥土深浅不一；凹处发暗、积着水（映出一点雾的灰白）；远处细节淡掉，只剩成片的深浅
    `float fd = 1. - smoothstep(3., 26., max(0., -q.z) + max(0., q.z - 6.));
    vec2 g = q.xz;
    float big = n2(g * 0.12) * 0.6 + n2(g * 0.45 + 3.) * 0.4, mid = n2(g * 1.7 + 1.3), fine = n3(vec3(g * 9., 0.5)), fine2 = n3(vec3(g * 31., 1.5));
    vec3 c = mix(${v3(0x353330)}, ${v3(0x57544a)}, smoothstep(0.3, 0.8, big));
    c = mix(c, ${v3(0x2c2b28)}, smoothstep(0.55, 0.85, mid) * 0.5);
    c *= mix(1., 0.74 + 0.36 * fine + 0.22 * (fine2 - .5), fd);
    float patchK = smoothstep(0.35, 0.72, n2(g * vec2(0.35, 0.45) + 40.));
    c *= 1. - 0.4 * smoothstep(0.7, 0.86, n2(g * 4.5 + 17.)) * patchK * (1. - fd);
    c = mix(c, ${v3(0x6a5a34)}, smoothstep(0.82, 0.92, n2(g * 3.7 + 29.)) * patchK * (1. - fd) * 0.5);
    c = mix(c, c * 0.55, smoothstep(-0.03, -0.16, vDet));
    wet11 = smoothstep(-0.07, -0.2, vDet) * smoothstep(0.5, 0.72, n2(g * vec2(1.1, 1.6) + 4.));
    c = mix(c, c * 0.45, wet11);
    diffuseColor.rgb = c;`,
    // 5 路面（沥青、补丁、裂缝画在贴图上）：再加一层细的颗粒
    'diffuseColor.rgb *= 0.86 + 0.24 * n3(q * 11.) + 0.1 * (n3(q * 37. + 3.) - .5);',
    // 6 石头：颗粒、小坑、地衣、雨水流下来的暗痕；表面的凹凸在 normal_fragment_maps 那一段里打（和第二十一章一样）
    `float fd = 1. - smoothstep(4., 24., max(0., -q.z));
    float ck11 = (1. - smoothstep(0., 0.03, rockCrack(q * vec3(1.1, 0.8, 1.1) + 11.))) * smoothstep(0.55, 0.75, n3(q * 0.9 + 4.)) * smoothstep(0.35, 0.6, n3(q * 3.5 + 1.));
    diffuseColor.rgb *= 1. - 0.55 * ck11 * (0.4 + 0.6 * fd);
    diffuseColor.rgb *= 0.92 + 0.08 * sin(q.y * 16. + q.x * 3. + q.z * 2. + n3(q * 2.) * 5.);
    float g1 = n3(q * 9.), g2 = n3(q * 31. + 2.), g3 = n3(q * 85. + 5.);
    diffuseColor.rgb *= mix(1., 0.74 + 0.34 * g1 + 0.2 * (g2 - .5) + 0.16 * (g3 - .5), 0.35 + 0.65 * fd);
    diffuseColor.rgb = mix(diffuseColor.rgb, ${v3(0x8f9284)}, smoothstep(0.62, 0.8, n3(q * 4.5 + 9.) * 0.7 + n3(q * 16. + 3.) * 0.3) * smoothstep(0.2, 0.7, vWN.y + 0.3) * 0.22);
    diffuseColor.rgb *= 1. - 0.3 * smoothstep(0.62, 0.86, n2(vec2((q.x + q.z) * 5., q.y * 0.9))) * (1. - smoothstep(0.5, 0.9, vWN.y));`,
    // 7 湿路面上零碎的反光（自发光的贴图）：只在亮着的地方（见 emissivemap 那一段）
    '',
  ];
  const BUMP11 = `
    { float bh = rockH(q, ck11) * 0.014 * (0.25 + 0.75 * fd);
      vec3 sX = dFdx(-vViewPosition), sY = dFdy(-vViewPosition), N = normal, R1 = cross(sY, N), R2 = cross(N, sX); float det = dot(sX, R1);
      vec2 dH = vec2(dFdx(bh), dFdy(bh)); normal = normalize(abs(det) * N - sign(det) * (dH.x * R1 + dH.y * R2)); }`;
  const cacheKey = m => m.customProgramCacheKey === THREE.Material.prototype.customProgramCacheKey ? '' : m.customProgramCacheKey();
  // 给受光的材质套上这一章的明暗：kind 是表面是什么（见 SURF11），sat 留多少颜色（0 全灰，1 原样）。材质原来自己的 onBeforeCompile（比如草的摆动）照样跑
  function shade11(mat, kind, sat = 0.4) {
    mat.userData.own = true;
    const prev = mat.onBeforeCompile, pk = cacheKey(mat);
    mat.customProgramCacheKey = () => 'ch11-' + kind + '-' + sat + pk;
    mat.onBeforeCompile = (sh, r) => {
      prev.call(mat, sh, r);
      sh.uniforms.uT = NU.uT; sh.uniforms.uHX = NU.uHX; sh.uniforms.uHaze = NU.uHaze;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP; varying vec3 vWN;' + (kind === 4 ? ' attribute float aDet; varying float vDet;' : ''))
        .replace('#include <fog_vertex>', `#include <fog_vertex>
          vec4 wp11 = vec4(transformed, 1.0); vec3 wn11 = objectNormal;
          #ifdef USE_INSTANCING
            wp11 = instanceMatrix * wp11; wn11 = mat3(instanceMatrix) * wn11;
          #endif
          vWP = (modelMatrix * wp11).xyz; vWN = normalize(mat3(modelMatrix) * wn11);${kind === 4 ? ' vDet = aDet;' : ''}`);
      const lb = THREE.ShaderChunk.lights_fragment_begin, hook = 'getDirectionalLightInfo( directionalLight, directLight );';
      if (!lb.includes(hook)) console.warn('第十八章（夜搜）：three.js 的光照代码变了，月光不会跟着压暗');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + GL11 + (kind === 4 ? '\nvarying float vDet;' : ''))
        .replace('#include <color_fragment>', `#include <color_fragment>
          float wet11 = 0.; vec3 q = vWP - vec3(${X.toFixed(1)}, 0., 0.); float wD = lite11(q, ${kind === 4 ? 'vDet' : '0.'});
          ${SURF11[kind]}
          diffuseColor.rgb = mix(vec3(dot(diffuseColor.rgb, vec3(.299, .587, .114))), diffuseColor.rgb, ${sat.toFixed(2)});   // 去掉大部分颜色`)
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
          ${kind === 7 ? 'totalEmissiveRadiance *= wD;' : ''}
          totalEmissiveRadiance += uHaze * wet11 * (0.25 + 0.75 * pow(1. - max(dot(normalize(cameraPosition - vWP), vec3(0., 1., 0.)), 0.), 3.)) * 0.6 * smoothstep(0.15, 0.7, wD);`)   // 积水映出雾
        .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>' + (kind === 6 ? BUMP11 : ''))
        .replace('#include <lights_fragment_begin>', lb.replace(hook, hook + ' directLight.color *= wD;'))
        .replace('#include <lights_fragment_end>', '#include <lights_fragment_end>\n reflectedLight.indirectDiffuse *= wD;')
        .replace('#include <opaque_fragment>', `{ float gL = dot(outgoingLight, vec3(.299, .587, .114)); outgoingLight *= mix(vec3(0.9, 0.98, 1.1), vec3(1.07, 1.0, 0.9), smoothstep(0.015, 0.2, gL)); }   // 调色：暗处偏一点冷，亮处偏一点暖
          outgoingLight = mix(outgoingLight, uHaze, haze11(q));
          #include <opaque_fragment>`);
    };
    return mat;
  }
  // 不受光的材质（旋翼的虚影这类）：只跟着雾
  function hazeOnly(mat) {
    mat.userData.own = true;
    const prev = mat.onBeforeCompile, pk = cacheKey(mat);
    mat.customProgramCacheKey = () => 'ch11-haze' + pk;
    mat.onBeforeCompile = (sh, r) => {
      prev.call(mat, sh, r); sh.uniforms.uHaze = NU.uHaze;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP11;')
        .replace('#include <fog_vertex>', `#include <fog_vertex>
          { vec4 w11 = vec4(transformed, 1.0);
          #ifdef USE_INSTANCING
            w11 = instanceMatrix * w11;
          #endif
          vWP11 = (modelMatrix * w11).xyz; }`);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP11; uniform vec3 uHaze;\n' + HAZE_GL)
        .replace('#include <opaque_fragment>', `outgoingLight = mix(outgoingLight, uHaze, haze11(vWP11 - vec3(${X.toFixed(1)}, 0., 0.)));\n#include <opaque_fragment>`);
    };
    return mat;
  }

  // 灯照不进去的四处，各占一段 x：候车亭、集装箱、铁皮棚、断桥底下。每一处都有顶，后面有一面墙 —— 灯是从后上方照过来的，
  // 影子是那盏灯自己投出来的（见下面的 build），看着躲好了才算躲好了。搭出来的顶和墙比这里登记的一段左右各宽出三四十厘米：
  // 灯从侧后方斜着照过来时影子会偏，宽出来的这一截正好补上
  const COVERS = [[38.0, 41.6], [54.0, 60.0], [73.6, 77.6], [92.5, 99.5]].map(([a, b]) => [X + a, X + b]);
  const coverAt = x => COVERS.findIndex(([a, b]) => x > a + 0.15 && x < b - 0.15);     // 0.15：主角半个身子的宽度
  const inCover = x => coverAt(x) >= 0;
  // 每一处的顶和后墙在哪：[顶的左边, 顶的右边, 顶有多高, 后墙的 z, 顶的前沿的 z]。看得见的那束光柱照到顶上就到此为止，不会穿过去落进里面（见 update 最后）
  const ROOFS = [[-0.65, 0.65, 2.5, -1.15, 1.4], [-0.38, 0.38, 2.55, -1.45, 1.06], [-0.85, 0.85, 2.3, -1.3, 1.5], [-0.4, 0.4, 3.3, -3.0, 1.6]].map(([da, db, y, zb, zf], i) => [COVERS[i][0] + da, COVERS[i][1] + db, y, zb, zf]);
  const CLIP = [0, 1, 2, 3, 4].map(() => new THREE.Plane(V3(0, 1, 0), 1e4));               // 五个面围出顶下面的那一块影子：左、右、顶、后墙、从顶的前沿顺着光斜下去的那一面
  // 灯来回扫的那一段 [最左, 最右]：主角还没到第一处时，它在候车亭前后扫；到过第 k 处以后，就在第 k 处和下一处之间扫
  // （两头各多扫出去五米半，两处都罩得到）；最后一项是主角躲进桥下以后，灯就在桥头两边找。
  // 扫一趟是从一头慢慢起步、中间最快、到另一头慢慢停下，再掉头。主角每到一处新的，灯就改成先朝这一处的左边扫过来（从他头顶过去），
  // 再掉头往右扫过下一段路 —— 所以在哪一处都是同一个办法：等灯从头顶过去、往右走远了，跟在它后面跑。
  // （原来是一条正弦，换一段的时候中心慢慢挪过去：灯看着在往右走，其实马上要折回来，照着它跑会被罩个正着）
  const SWEEP = [[X + 34, X + 58]];
  for (let k = 0; k < COVERS.length - 1; k++) SWEEP.push([COVERS[k][1] - 5.5, COVERS[k + 1][0] + 5.5]);
  SWEEP.push([X + 91.4, X + 100.6]);
  // 直升机：st —— calm 还没来 / hunt 在找 / leave 飞走 / gone 走了。stage 主角到过第几处了（0 = 一处都没到），live 灯落到公路上了没有，lx 灯这一趟扫到哪了（l0 → l1，ls 走了几成，lD 这一趟要多久），bx 灯罩着公路上的哪一点，c 直升机来回飞的那一段的中点，
  // r 罩住的那一块有多宽（半径），exposure 被罩住多久了（0..1），caught 被发现以后过了多久，hid 在桥下躲了多久，low 压低了多少，
  // k 它离得有多近（0..1：蟋蟀和萤火虫跟着它安静下去），near 旋翼的风有多大（0..1），lamp / tgt / on 灯在哪、照着哪、亮不亮（空中的灰要用）
  const T_IN = 8, T_HID = 9, T_OUT = 11, V_SWEEP = 2.8, V_PROBE = 2.8, ANG = 0.15, CONE_L = 26;     // 飞来要多久 / 在桥下躲多久它才走 / 飞走要多久 / 灯扫一趟平均多快（米每秒：平时、在桥头找的时候）/ 光柱的半张角
  const FAR_IN = [X + 70, 34, -210], FAR_OUT = [X - 50, 26, -300];               // 从哪里飞来，往哪里飞走（往左后方：那边是开阔的野地，看得见它越飞越远；右边是林子，会被树挡住）
  const H = { st: 'calm', t: 0, stage: 0, live: false, lx: X + 47, l0: X + 47, l1: X + 47, ls: 0, lD: 1, c: X + 46, bx: X + 47, r: 2.3, exposure: 0, caught: 0, hid: 0, low: 0, k: 0, near: 0, gust: false,
    pos: V3(...FAR_IN), vel: V3(), p0: V3(), aim: V3(X + 62, 0, -120), aim0: V3(), yaw: -1.57, roll: 0, pitch: 0, lamp: [0, 0, 0], tgt: [0, 0, 0], on: 0 };

  // 不止一架：远处的野地上还有五架，前后错开，各沿着自己的一条地来回扫。
  // 按 generated_images/heli-search-target.png 的层次错开高度与深度，留出天空的空隙，
  // 地上的光斑从近到远分成不同搜索带，近处主机仍是视觉中心。
  // 它们只是画面和声音，照不到公路上。[离头顶那一架来回飞的中点多远, 多高, 多深, 来回飞多宽, 错开多少]；跟着头顶那一架一起来、一起往前挪、一起走
  const WING = [[25, 13, -65, 8, 0.0], [-30, 20, -78, 10, 5.2], [48, 16, -135, 12, 1.2], [-23, 30, -148, 12, 2.1], [3, 29, -205, 14, 3.3]]
    .map(([dx, y, z, span, ph]) => ({ dx, y, z, span, ph, pos: V3(), aim: V3(), p0: V3(), yaw: -1.57, sp: 0, left: false }));
  function stepWing(w, dt, arr, hunt) {
    const s = T * 0.22 + w.ph, sx = H.c + w.dx + w.span / 2 * Math.sin(s), sy = w.y + 0.5 * Math.sin(T * 0.6 + w.ph), sz = w.z + 3 * Math.sin(T * 0.17 + w.ph * 2), px = w.pos.x, pz = w.pos.z;
    if (hunt) {
      w.left = false;
      if (arr < 1) w.pos.set(lerp(FAR_IN[0] + w.dx * 1.6, sx, arr), lerp(FAR_IN[1] + 8, sy, arr), lerp(FAR_IN[2] + w.z * 0.7, sz, arr));
      else { w.pos.x = damp(w.pos.x, sx, 1.2, dt); w.pos.y = damp(w.pos.y, sy, 1.2, dt); w.pos.z = damp(w.pos.z, sz, 1.2, dt); }
    } else {
      if (!w.left) { w.left = true; w.p0.copy(w.pos); }
      const k = H.t / T_OUT, e = Math.pow(clamp(k, 0, 1), 2.2);
      w.pos.set(lerp(w.p0.x, FAR_OUT[0] + w.dx * 1.6, e), lerp(w.p0.y, FAR_OUT[1] + 8, sstep(0, 1, k)), lerp(w.p0.z, FAR_OUT[2] + w.z * 0.7, e));
    }
    const vx = (w.pos.x - px) / Math.max(dt, 1e-4), vz = (w.pos.z - pz) / Math.max(dt, 1e-4);
    w.yaw = damp(w.yaw, Math.atan2(-vz - (hunt ? 2.5 : 0), vx), 1.6, dt); w.sp = Math.hypot(vx, vz);
    w.aim.set(w.pos.x + 7 * Math.cos(s) + 3 * Math.sin(T * 0.9 + w.ph), 0, w.pos.z + 9 + 5 * Math.sin(T * 0.5 + w.ph)); w.aim.y = gy(w.aim.x, w.aim.z);   // 灯照着它前下方的地，晃来晃去
  }

  checkpoint(X + 3); checkpoint(X + 29);
  for (const [a, b] of COVERS) checkpoint((a + b) / 2);                             // 每一处里面一个：被发现以后回到的地方一定是安全的
  checkpoint(X + 108); checkpoint(X + 126);
  // 直升机一来，镜头就拉远、抬高：主角小了，但直升机、光柱和它罩着的那块地都在画面里
  camKeys([X - 12, 19, 1.8, 0.5], [X + 8, 19.5, 1.9, 1.2], [X + 18, 21, 2.4, 2], [X + 30, 27, 4.2, 2.5], [X + 86, 27, 4.2, 2.5], [X + 96, 25, 3.7, 0], [X + 103, 25, 3.7, 1.5],
    [X + 116, 21, 2.3, 1.5], [X + 150, 20, 2.0, 0]);
  // 夜里起了雾：月光很淡、从头顶来（只照孩子周围，见 lite11）；天和雾都是浅灰的，左上角画面外有一团光晕。画面里最亮的东西是那盏探照灯
  const NIGHT = { fog: HAZE, fogD: 0.006, hemiS: 0x8a949c, hemiG: 0x15171a, hemiI: 1.0, keyC: 0xc4ccd4, keyI: 1.45, keyDir: [-0.25, 0.9, -0.35], rimC: 0x8090b0, rimI: 0,
    dustC: 0xa0a8ae, dustO: 0.16, wind: -0.25, ext: 1, sky: [0x22262a, 0x292d31, 0x2f3338, 0x363a3f, HAZE, HAZE], sunX: -0.52, sunY: 0.2, sunC: 0xd2d8da, sunP: 0.6,
    stars: 0, cloud: 0, cloudC: HAZE, birds: 0, flies: 0.75, vig: 1.1,
    aWind: 0.4, aWhis: 0, aLeaf: 0.4, leafDry: 0.35, aBug: 0.9, aDrip: 0, aFlow: 0, aRoom: 0, roomF: 210, aHum: 0, aCity: 0, aFar: 0.45, rvOut: 1, rvHall: 0, rvCave: 0 };   // 声音：夜风吹着草，满地的蟋蟀，远处一只猫头鹰
  // 往右进了林子，雾越来越浓，把前面的路吞掉（右边那堵空气墙藏在浓雾里）
  env(X - 60, NIGHT); env(X + 126, NIGHT); env(X + 152, { ...NIGHT, fogD: 0.04, hemiI: 1.15 }); env(X + 200, { ...NIGHT, fogD: 0.04, hemiI: 1.15 });

  hint(() => H.st === 'hunt' && H.stage === 0 && P.x > X + 23 && P.x < COVERS[0][0], '躲进候车亭里，等灯扫过去');
  hint(() => H.st === 'hunt' && H.stage === 1 && inCover(P.x), '等灯扫过去，再跑到下一处有顶的地方');
  hint(() => H.st === 'hunt' && H.stage === COVERS.length && inCover(P.x), '躲着别出去，等它飞走');

  // 没有路灯，也不为哪里亮、哪里暗去找理由（见 design/visual-style.md）。只留探照灯照在地上反上来的那一点光：跟着灯走
  const bounceL = pointLight({ p: [X, 1.5, 0.5], c: 0xdce4e8, i: 2.4, d: 13, dec: 1.4, on: 0 });

  let V = null;                                          // 画面上的东西（这一章被卸载时清空）
  const C_CALM = new THREE.Color(0xe2eef2), C_ALERT = new THREE.Color(0xff5030), _a = V3(), _b = V3(), _c = V3(), _d = V3();
  // 直升机在的时候，环境跟着变：蟋蟀不叫了，萤火虫不见了，旋翼的风把灰往两边吹
  const mod = E_ => { const k = H.k; E_.aBug *= 1 - 0.94 * k; E_.flies *= 1 - k; E_.aFar *= 1 - k; E_.wind = lerp(E_.wind, 2.4 * clamp((camera.position.x - H.pos.x) / 8, -1, 1), H.near); };

  function* build(R) {
    const v = {}, own = m => { m.userData.own = true; return m; };
    const LOW = new URLSearchParams(location.search).get('low') === '1' || (typeof touchMode !== 'undefined' && touchMode);   // 手机（触屏）上降一档；地址后面加 ?low=1 在电脑上也能看这一档
    const S = (c, kind = 3, sat = 0.4, o) => shade11(lam(c, o), kind, sat);                       // 这一章自己的材质，走这一章的明暗
    const M4 = new THREE.Matrix4(), qq = new THREE.Quaternion(), ee = new THREE.Euler(0, 0, 0, 'YXZ'), cc = new THREE.Color(), UP = V3(0, 1, 0);
    const behindCover = (x, k) => COVERS.some(([a, b]) => x > a - k && x < b + k);
    const EMB = [COVERS[3][0] - 3.6, COVERS[3][1] + 3.6];                                           // 断桥后面的路堤占着的那一段
    const rod = (A, a, b, r, seg = 7) => { const d = b.clone().sub(a), L = d.length(); mergePut(A, new THREE.CylinderGeometry(r * 0.75, r, L, seg), M4.compose(a.clone().lerp(b, 0.5), qq.setFromUnitVectors(UP, d.normalize()), V3(1, 1, 1))); };

    // ---------------- 地面：一整块，颜色、明暗在着色器里算 ----------------
    // 近处一块细的、远处一块粗的，用同一个高度函数；远处那块挨着近处的那一排压低一点、塞在近处那块底下，接缝里不漏
    {
      const groundMat = S(0xffffff, 4, 0.5);
      const kinks = TERRAIN.map(p => p[0]).filter(x => x > G0 && x < G1);              // 物理地形的折点：路面那一条要和它分毫不差（路面的贴图是按折点切的）
      const span = (a, b, d, extra = []) => { const o = []; for (let x = a; x < b + d / 2; x += d) o.push(x); o.push(...extra); o.sort((p, q) => p - q); return o.filter((x, i) => i === 0 || x - o[i - 1] > 0.05); };
      // 一块网格地面，按 x 切成一条条（每条 cw 米）：镜头只看得到其中两三条，看不到的不画。法线按整块算好再切，接缝处的明暗对得上
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
      grid(span(G0, G1, LOW ? 0.8 : 0.4, kinks), span(-12, 16, LOW ? 0.6 : 0.35), 20);
      yield;
      const zs = []; for (let z = -11.9, st = 0.5; z > -420; z -= st, st = Math.min(8, st * 1.06)) zs.push(z);
      grid(span(G0, G1, LOW ? 3.2 : 1.6), zs.reverse(), 80, 0.04);                                // 远处也只铺这一章这一段：两头是共用的地面（一直铺到看不见的地方）
    }
    yield;

    // ---------------- 路：一条荒废的公路 ----------------
    // 沥青的边被草一点点吃进来；一块块深浅不一的补丁，褪了色的中线和边线，裂缝（画在贴图上；明暗、颜色走这一章的着色）
    for (const [a, b] of [[X - 26, X + 42], [X + 42, X + 108]]) shade11(groundDecal(a, b, -2.8, 3.0, 40, g => {
      g.fillStyle = 'rgba(46,47,49,0.95)'; g.beginPath(); g.moveTo(a, -2.3);
      for (let x = a; x <= b; x += 0.5) g.lineTo(x, -2.3 + 0.16 * Math.sin(x * 1.3) + 0.1 * Math.sin(x * 3.1 + 1));
      for (let x = b; x >= a; x -= 0.5) g.lineTo(x, 2.5 + 0.2 * Math.sin(x * 0.9 + 2) + 0.12 * Math.sin(x * 2.7));
      g.closePath(); g.fill();
      for (let i = 0; i < (b - a) * 0.5; i++) { g.fillStyle = rnd() < 0.5 ? `rgba(0,0,0,${rr(0.08, 0.22).toFixed(2)})` : `rgba(146,148,148,${rr(0.04, 0.1).toFixed(2)})`; g.fillRect(rr(a, b), rr(-2.0, 1.6), rr(0.6, 2.6), rr(0.3, 1.2)); }
      g.fillStyle = 'rgba(196,196,188,0.36)'; for (let x = Math.ceil(a / 6) * 6; x < b - 3; x += 6) if (rnd() < 0.8) g.fillRect(x, 0.62, 3, 0.13);
      g.fillStyle = 'rgba(196,196,188,0.2)'; g.fillRect(a, -2.02, b - a, 0.09); g.fillRect(a, 2.16, b - a, 0.09);
      g.strokeStyle = 'rgba(8,9,10,0.8)';
      for (let i = 0; i < (b - a) * 0.7; i++) { let x = rr(a, b), z = rr(-2.2, 2.4); g.lineWidth = rr(0.02, 0.05); g.beginPath(); g.moveTo(x, z); for (let k = 0; k < 5; k++) { x += rr(-0.5, 0.9); z += rr(-0.45, 0.45); g.lineTo(x, z); } g.stroke(); }
    }, { fadeL: a < X ? 6 : 0, fadeR: b > X + 100 ? 5 : 0 }).material, 5, 0.5);
    // 过了断桥，沥青没了，只剩两道车辙
    shade11(groundDecal(X + 103, X + 152, -2.2, 2.4, 30, g => {
      for (const z0 of [-0.75, 0.75]) { g.strokeStyle = 'rgba(20,18,14,0.5)'; g.lineWidth = 0.55; g.beginPath(); for (let x = X + 103; x <= X + 152; x += 0.6) { const z = z0 + 0.25 * Math.sin(x * 0.4) + 0.1 * Math.sin(x * 1.3); x === X + 103 ? g.moveTo(x, z) : g.lineTo(x, z); } g.stroke(); }
    }, { fadeL: 4, fadeR: 4 }).material, 5, 0.5);
    // 湿的路面上零碎的反光：只画细小、不连续的亮纹，让路仍然是粗糙的沥青；只在孩子周围亮着的那一块看得见（见 SURF11 的 7）
    withSeed(11308, () => {
      const wetRoad = groundDecal(X + 26, X + 104, -1.9, 3.0, 60, g => {
        for (let i = 0; i < 1700; i++) {
          const x = rr(X + 26, X + 104), z = rr(-1.8, 2.9);
          if (Math.sin(x * 1.7 + z * 4) + Math.sin(x * 0.5 - z * 7) < 0.3) continue;
          g.fillStyle = `rgba(172,177,180,${rr(0.15, 0.5)})`;
          g.fillRect(x, z, rr(0.04, 1.2), rr(0.012, 0.045));
        }
      }, { lift: 0.018, fadeL: 3, fadeR: 3 });
      wetRoad.material.emissive.setHex(0x7d8589); wetRoad.material.emissiveIntensity = 0.28; wetRoad.material.emissiveMap = wetRoad.material.map;
      shade11(wetRoad.material, 7, 0.4);
    });
    yield;

    // ---------------- 野地里的草：路后面一大片，越往远处越高；路上的裂缝里也钻出来几丛 ----------------
    // 路前面（往镜头这边）不种：那里沉在黑里（前景不放东西，见 design/visual-style.md 第 7 条）。受光照 —— 探照灯扫到哪，哪里的草就亮起来
    const bare = (x, z) => (z < -2.9 && x > EMB[0] && x < EMB[1]) || (z > -1.7 && z < 1.5 && behindCover(x, 0.9));
    const gcol = () => new THREE.Color(pick([0x6c6e66, 0x7b7a6c, 0x5a5e5a, 0x86806c])).multiplyScalar(rr(0.8, 1.05));
    for (const [z0, z1, per, h0, h1] of [[-2.7, -5, 4, 0.25, 0.75], [-5, -12, 4, 0.4, 1.0], [-12, -29, 4, 0.6, 1.4], [-2.2, 2.4, 0.25, 0.1, 0.22]]) {
      const list = [];
      for (let i = 0, n = Math.round(230 * per * (LOW ? 0.6 : 1)); i < n; i++) {
        const x = rr(X - 58, X + 172), z = rr(z0, z1), k = rnd(); if (bare(x, z) || (z0 === -2.2 && (Math.abs(z) < 0.3 || x > X + 104))) continue;
        list.push([x, gy(x, z), z, k < 0.68 ? 'grass' : k < 0.84 ? 'dry' : k < 0.97 ? 'seed' : 'fern', rr(h0, h1), gcol()]);
      }
      shade11(searchMeadow(R, list).material, 3, 0.45); yield;
    }

    // ---------------- 地上的东西：石块、碎石子、落叶、枯枝 ----------------
    //   成片成堆的（大尺度的噪声决定哪里一片、哪里空着），多在路后沿沥青破了的那条边、野地里靠路的一两米，凹处多一些；离路越远越稀，到哪为止各处不一样，没有一条边。
    //   落叶是画面里少有的几点颜色（黄的、褐的）；路前沿也撒一点，只在暗下去的那条边上露出几片
    {
      const rockMat = S(0xffffff, 6, 0.6, { vertexColors: true }), leafMat = S(0xffffff, 3, 0.95, { side: THREE.DoubleSide });
      const clump = (x, z) => sstep(0.35, 0.72, vn2(x * 0.35 + 40, z * 0.45)) * 0.85 + 0.15;
      const spot = (onRoad, reach = 3.5) => {                    // 随便找一处：onRoad 在路面上，不然在路两边（多半在后面）
        for (let tries = 0; ; tries++) {
          const x = rr(X - 12, X + 150); let z, dr = 0;
          if (onRoad) z = rr(-2.2, 2.4);
          else { const back = rnd() < 0.78; dr = Math.pow(rnd(), 1.25) * reach * (back ? 1.5 : 0.5); z = back ? RB + 0.3 - dr : RF - 0.2 + dr; }
          if (z > -1.8 && z < 1.7 && behindCover(x, 0.4)) continue;                            // 掩体里面不放
          const lim = reach * (0.7 + 0.6 * vn2(x * 0.25 + 7, 3));                              // 到哪为止：沿着路各处不一样
          const p = onRoad ? 1 : clump(x, z) * sstep(lim * 1.4, lim * 0.6, dr) * (DET(x, z) < -0.04 ? 1.6 : 1);
          if (tries > 60 || rnd() < p) return [x, z];
        }
      };
      // 大一点的石块：半埋在土里。几种形状轮流用（带实例的网格）
      {
        const geos = [3, 17, 29, 41].map(sd => fogRockGeo(sd, { sd: 1, amp: 0.32, flat: 0.75, moss: 0.5, mossCol: 0x4f6a2e, col: 0x4a4945 })), pts = [];   // 都不大，细分一次就够（表面的凹凸在着色器里）
        for (let i = 0, n = LOW ? 110 : 220; i < n; i++) { const [x, z] = spot(false); if (Math.abs(z) > 0.8) pts.push([x, z, rr(0.06, 0.24) * (rnd() < 0.15 ? 1.7 : 1)]); }
        geos.forEach((geo, gi) => {
          const part = pts.filter((_, i) => i % geos.length === gi), mesh = new THREE.InstancedMesh(geo, rockMat, part.length);
          part.forEach(([x, z, sz], i) => { ee.set(rr(-0.2, 0.2), rr(0, 6.28), rr(-0.2, 0.2)); qq.setFromEuler(ee);
            M4.compose(V3(x, gy(x, z) - sz * 0.22, z), qq, V3(sz * rr(0.9, 1.4), sz * rr(0.7, 1.0), sz * rr(0.7, 1.1))); mesh.setMatrixAt(i, M4); mesh.setColorAt(i, cc.setScalar(rr(0.75, 1.1))); });
          mesh.instanceMatrix.needsUpdate = mesh.instanceColor.needsUpdate = true; mesh.computeBoundingSphere(); mesh.castShadow = mesh.receiveShadow = true; mesh.frustumCulled = false; R.add(mesh);
        });
      }
      // 碎石子：路上也有一些
      {
        const n = LOW ? 700 : 1500, mesh = new THREE.InstancedMesh(fogRockGeo(11, { sd: 0, amp: 0.25, flat: 0.7, moss: 0, col: 0xffffff }), rockMat, n);
        for (let i = 0; i < n; i++) {
          const [x, z] = spot(rnd() < 0.2), sz = rr(0.012, 0.05);
          ee.set(rr(-0.4, 0.4), rr(0, 6.28), rr(-0.4, 0.4)); qq.setFromEuler(ee);
          M4.compose(V3(x, gy(x, z) + sz * 0.15, z), qq, V3(sz * rr(0.9, 1.5), sz * rr(0.5, 0.8), sz * rr(0.8, 1.2))); mesh.setMatrixAt(i, M4);
          mesh.setColorAt(i, cc.set(pick([0x4a4945, 0x3f3e3b, 0x55524b, 0x353431])).multiplyScalar(rr(0.8, 1.15)));
        }
        mesh.instanceMatrix.needsUpdate = mesh.instanceColor.needsUpdate = true; mesh.computeBoundingSphere(); mesh.receiveShadow = true; mesh.frustumCulled = false; R.add(mesh);   // 碎石子太小，影子看不出来：不进影子贴图
      }
      yield;
      // 落叶：平躺着，少数翘起来一点；积在路沿、掩体墙脚，过了断桥以后林子边上多
      {
        const n = LOW ? 1200 : 2600, mesh = new THREE.InstancedMesh(leafGeo(), leafMat, n);
        for (let i = 0; i < n; i++) {
          let x, z; const u = rnd();
          if (u < 0.22) { x = rr(X + 102, X + 152); z = rr(-6, 2.8); }
          else if (u < 0.45) { x = rr(X - 12, X + 152); z = rnd() < 0.75 ? RB + rr(-0.7, 0.5) : RF + rr(-0.5, 0.4); }
          else [x, z] = spot(rnd() < 0.15);
          const sz = rr(0.08, 0.16), up = rnd() < 0.2 ? rr(0.2, 0.7) : rr(-0.08, 0.08);
          ee.set(rr(-0.08, 0.08), rr(0, 6.28), up); qq.setFromEuler(ee);
          M4.compose(V3(x, gy(x, z) + 0.012 + Math.abs(Math.sin(up)) * sz * 0.4, z), qq, V3(sz, sz * 0.5, sz)); mesh.setMatrixAt(i, M4);
          mesh.setColorAt(i, cc.set(pick([0xc8962e, 0xd4a83a, 0xb87a2a, 0xa8642a, 0x8a5a30, 0xc0a040, 0x7a6a38])).multiplyScalar(rr(0.6, 1.05)));   // 黄的、橙黄的、褐的
        }
        mesh.instanceMatrix.needsUpdate = mesh.instanceColor.needsUpdate = true; mesh.computeBoundingSphere(); mesh.receiveShadow = true; mesh.frustumCulled = false; R.add(mesh);
      }
      // 枯树枝：细细的、弯的，有的带一两根分杈
      {
        const A = { p: [], n: [] };
        for (let i = 0; i < (LOW ? 60 : 120); i++) {
          const [x, z] = spot(rnd() < 0.06), L = rr(0.15, 0.75) * (rnd() < 0.1 ? 1.8 : 1), a = rr(0, 6.28), r = rr(0.005, 0.014) * (L > 0.8 ? 1.5 : 1), dx = Math.cos(a), dz = Math.sin(a), bend = rr(-0.12, 0.12);
          const pts = [0, 0.33, 0.66, 1].map(t => { const px = x + dx * L * (t - 0.5) - dz * bend * Math.sin(t * 3.14), pz = z + dz * L * (t - 0.5) + dx * bend * Math.sin(t * 3.14); return V3(px, gy(px, pz) + r + 0.004 + 0.02 * Math.sin(t * 3.14) * rnd(), pz); });
          mergePut(A, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 6, r, 5));
          for (let k = 0, nb = rnd() < 0.5 ? Math.floor(rr(1, 3)) : 0; k < nb; k++) {
            const b0 = pts[1 + Math.floor(rnd() * 2)], ba = a + (rnd() < 0.5 ? -1 : 1) * rr(0.4, 0.9), bl = L * rr(0.2, 0.45);
            const b1 = V3(b0.x + Math.cos(ba) * bl, 0, b0.z + Math.sin(ba) * bl); b1.y = gy(b1.x, b1.z) + r * 0.7 + rr(0, 0.05);
            mergePut(A, new THREE.TubeGeometry(new THREE.CatmullRomCurve3([b0, b0.clone().lerp(b1, 0.5).add(V3(0, rr(0, 0.03), 0)), b1]), 6, r * 0.6, 5));
          }
        }
        const m = new THREE.Mesh(mergedGeo(A), S(0x5a3d26, 3, 0.85)); m.castShadow = m.receiveShadow = true; m.frustumCulled = false; R.add(m);
      }
    }
    yield;

    // ---------------- 雾里的剪影：几层枯树，一座塌了半边的谷仓和一座水塔，再远一排高压线塔 —— 一层比一层浅（浅是雾抬的，见 haze11）----------------
    //   掩体正后面不放：掩体的轮廓要干干净净地立在雾前面；路堤那一段也让开
    {
      const A = { p: [], n: [] }, BARN = [X + 61.5, X + 70.7], TOWER = [X + 73.6, X + 78.2];
      for (const [z0, n, h0, h1] of [[-17, 5, 5, 9], [-26, 7, 8, 13], [-37, 10, 10, 15], [-54, 12, 12, 17]]) for (let i = 0; i < n; i++) {
        const z = z0 + rr(-4, 4), x = rr(X - 40 + z0 * 0.4, X + 104 - z0 * 0.2);
        if (behindCover(x, 3 - z * 0.08) || (x > EMB[0] - 3 && x < EMB[1] + 3) || (z > -36 && z < -22 && x > BARN[0] - 2 && x < TOWER[1] + 2)) continue;
        deadTree(A, x, gy(x, z) - 0.3, z, rr(h0, h1));
      }
      yield;
      // 谷仓：一边的屋顶塌下去了，门洞、阁楼窗，后半截的墙板一块块掉了
      { const sh = new THREE.Shape(); [[BARN[0] + 0.5, -0.6], [BARN[0] + 0.5, 4.1], [BARN[0] + 3.7, 6.9], [BARN[0] + 6.9, 4.7], [BARN[1] - 0.5, 3.6], [BARN[1] - 0.5, -0.6]].forEach(([x, y], i) => sh[i ? 'lineTo' : 'moveTo'](x, y));
        const hole = (x1, y1, x2, y2) => { const p = new THREE.Path(); p.moveTo(x1, y1); p.lineTo(x2, y1); p.lineTo(x2, y2); p.lineTo(x1, y2); p.closePath(); sh.holes.push(p); };
        hole(BARN[0] + 1.9, 0.2, BARN[0] + 3.8, 2.8); hole(BARN[0] + 3.1, 4.2, BARN[0] + 4.1, 5.1);
        for (let x = BARN[0] + 4.9; x < BARN[1] - 1; x += 0.55) hole(x, rr(0.5, 1.2), x + 0.12, rr(2.0, 3.3));
        const g = new THREE.ExtrudeGeometry(sh, { depth: 6.5, bevelEnabled: false }); g.translate(-(BARN[0] + BARN[1]) / 2, 0, 0);
        mergePut(A, g, M4.compose(V3((BARN[0] + BARN[1]) / 2, gy((BARN[0] + BARN[1]) / 2, -30), -33.5), qq.setFromEuler(ee.set(0, 0.12, 0)), V3(1, 1, 1))); }
      // 水塔：四条腿、交叉的拉条，上面一只圆罐、尖顶
      { const tx = (TOWER[0] + TOWER[1]) / 2, tz = -29, ty = gy(tx, tz);
        mergePut(A, new THREE.CylinderGeometry(1.7, 1.7, 2.7, 14), M4.makeTranslation(tx, ty + 7.5, tz)); mergePut(A, new THREE.ConeGeometry(1.9, 1.3, 14), M4.makeTranslation(tx, ty + 9.5, tz));
        const legs = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sz]) => [V3(tx + sx * 1.6, ty - 0.3, tz + sz * 1.6), V3(tx + sx * 1.1, ty + 6.2, tz + sz * 1.1)]);
        for (const [a, b] of legs) rod(A, a, b, 0.12, 6);
        for (let s = 0; s < 4; s++) { const [a0, a1] = legs[s], [b0, b1] = legs[(s + 1) % 4]; rod(A, a0.clone().lerp(a1, 0.15), b0.clone().lerp(b1, 0.6), 0.04, 4); rod(A, b0.clone().lerp(b1, 0.15), a0.clone().lerp(a1, 0.6), 0.04, 4); } }
      // 高压线塔和它们之间垂着的线：雾里只剩一点影子
      { const PY = [[X - 24, 23], [X + 40, 25], [X + 108, 24], [X + 172, 23]].map(([x, h]) => [x, gy(x, -48), h]), tips = [];
        for (const [x, y, h] of PY) { pylon(A, x, y, -48, h); tips.push([[-0.26, 0.72], [0.26, 0.72], [-0.19, 0.86], [0.19, 0.86]].map(([w, t]) => V3(x + w * h, y + t * h, -48))); }
        for (let i = 0; i < tips.length + 1; i++) for (let k = 0; k < 4; k++) {
          const a = i ? tips[i - 1][k] : tips[0][k].clone().add(V3(-64, -3, 0)), b = i < tips.length ? tips[i][k] : tips[tips.length - 1][k].clone().add(V3(64, -3, 0)), pts = [];
          for (let t = 0; t <= 1.001; t += 0.1) pts.push(a.clone().lerp(b, t).add(V3(0, -2.6 * 4 * t * (1 - t), 0)));
          mergePut(A, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.05, 4));
        } }
      const m = new THREE.Mesh(mergedGeo(A), S(0x24272a, 3, 0.3)); m.frustumCulled = false; R.add(m);
    }
    yield;
    // 过了断桥，路钻进林子：一排排枯了的树干，越往里越密；路边那几棵，孩子走过的时候被他周围的光照到
    {
      const A = { p: [], n: [] };
      for (const [z0, z1, gap, h0, h1, th] of [[-4.2, -7.5, 7, 12, 17, 1.05], [-7.5, -15, 4.2, 13, 19, 1.0], [-15, -27, 3.0, 14, 21, 0.95], [-27, -46, 2.4, 15, 22, 0.9]]) {
        for (let x = X + 100 + rr(0, gap); x < X + 196; x += rr(gap * 0.6, gap * 1.4)) {
          if (rnd() > sstep(X + 100, X + 124, x) || (x < EMB[1] + 1.5 && z0 > -46)) continue;        // 林子边上稀；路堤那里让开
          const z = rr(z1, z0); deadTree(A, x, gy(x, z) - 0.3, z, rr(h0, h1), { thick: th, branch: 0.7 });
        }
        yield;
      }
      const m = new THREE.Mesh(mergedGeo(A), S(0x2b2a27, 2, 0.3)); m.castShadow = m.receiveShadow = true; R.add(m);   // 林子不在镜头里（还在前面的野地上）的时候不画
    }
    // 来的方向：一棵倒下的大树横在路上，树冠的枝杈堆得一人多高（路被它堵死了）；树根那头翘起一盘根土，旁边几块石头
    {
      // 树干从野地里斜着躺过路面，细的那头伸进镜头前的黑里（看不到断口）；树冠的粗枝大多往两边、往前后摊开，少数往上戳，压塌的枝杈堆在路上
      const A = { p: [], n: [] }, root = V3(X - 13.8, 0, -6.8), tip = V3(X - 9.3, 0.3, 3.8);
      root.y = gy(root.x, root.z) + 0.55;
      { const d = tip.clone().sub(root), L = d.length(); mergePut(A, new THREE.CylinderGeometry(0.1, 0.55, L, 10), M4.compose(root.clone().lerp(tip, 0.5), qq.setFromUnitVectors(UP, d.normalize()), V3(1, 1, 1))); }
      const rm = S(0xffffff, 6, 0.6, { vertexColors: true }), soil = S(0xffffff, 6, 0.4, { vertexColors: true });
      { const d = tip.clone().sub(root).normalize(), side = V3(d.z, 0, -d.x), o = root.clone().addScaledVector(d, -0.45).add(V3(0, 0.55, 0));   // 根盘：一大块翘起来的根土，带几根翘出来的根
        const clod = add(R, fogRockGeo(4242, { sd: 2, amp: 0.38, flat: 1, moss: 0.25, mossCol: 0x45502a, col: 0x2f2a24 }), soil, o.x, o.y, o.z);
        clod.quaternion.setFromUnitVectors(UP, d); clod.scale.set(1.45, 0.42, 1.25);
        for (let k = 0; k < 11; k++) { const a = k / 11 * 6.28 + rr(-0.2, 0.2), e = o.clone().addScaledVector(side, Math.cos(a) * rr(1.3, 2.1)).add(V3(0, Math.sin(a) * rr(1.0, 1.7), 0)).addScaledVector(d, -rr(0.1, 0.6));
          if (e.y < 0.05) e.y = 0.05; const mid = o.clone().lerp(e, 0.5).add(V3(rr(-0.2, 0.2), rr(-0.2, 0.2), rr(-0.3, 0.1)));
          mergePut(A, new THREE.TubeGeometry(new THREE.CatmullRomCurve3([o.clone().addScaledVector(d, 0.2), mid, e]), 6, rr(0.03, 0.07), 4)); } }
      for (let k = 0; k < 22; k++) {                                                               // 树冠
        const t = rr(0.42, 0.95), p0 = root.clone().lerp(tip, t).add(V3(0, 0.15, 0)), a = rr(0, 6.28), up = rnd() < 0.3 ? rr(0.6, 1.1) : rr(0.15, 0.5), L = rr(1.2, 3.0) * (1.15 - t * 0.35);
        const dir = V3(Math.cos(a), up, Math.sin(a) * 0.8).normalize();
        const p1 = p0.clone().addScaledVector(dir, L * 0.5).add(V3(0, rr(0, 0.3), 0)), p2 = p0.clone().addScaledVector(dir, L).add(V3(rr(-0.3, 0.3), rr(-0.4, 0.2), rr(-0.3, 0.3)));
        for (const p of [p1, p2]) { if (p.x > X - 7.75) p.x = X - 7.75 - rr(0, 0.25); p.y = Math.max(p.y, gy(p.x, p.z) + 0.05); }   // 不戳到孩子站的那一边，也不扎进地里
        mergePut(A, new THREE.TubeGeometry(new THREE.CatmullRomCurve3([p0, p1, p2]), 6, rr(0.035, 0.08), 5));
        for (let j = 0; j < 3; j++) { const q0 = p1.clone().lerp(p2, rr(0.2, 0.9)), q1 = q0.clone().add(V3(rr(-0.7, 0.5), rr(0.1, 0.7), rr(-0.6, 0.6))); if (q1.x > X - 7.75) q1.x = X - 7.75; mergePut(A, new THREE.TubeGeometry(new THREE.CatmullRomCurve3([q0, q0.clone().lerp(q1, 0.5).add(V3(0, 0.08, 0)), q1]), 4, 0.018, 4)); }
      }
      const m = new THREE.Mesh(mergedGeo(A), S(0x2e2a25, 2, 0.35)); m.castShadow = m.receiveShadow = true; R.add(m);
      for (const [x, z, s] of [[X - 12.4, -4.2, 0.6], [X - 10.6, -3.1, 0.35], [X - 12.9, 1.0, 0.45], [X - 13.6, -1.6, 0.7]]) {
        const r = add(R, fogRockGeo(Math.round(x * 7 + z * 13), { sd: 2, amp: 0.3, flat: 0.8, moss: 0.6, mossCol: 0x45602a, col: 0x46453f }), rm, x, gy(x, z) + s * 0.25, z); r.scale.set(s * 1.2, s, s); r.rotation.y = rr(0, 6.28);
      }
    }
    yield;

    // ---------------- 路边的东西（明暗、颜色都走这一章的着色）----------------
    const conc = S(0x5a6368, 0, 0.35), conc2 = S(0x454d52, 0, 0.35), rust = S(0x6a4634, 1, 0.5), rust2 = S(0x4a3a31, 1, 0.5), tin = S(0x4a4640, 1, 0.35), wood = S(0x4c3c2c, 2, 0.45);
    const poleM = S(0x1b1a18, 2, 0.4), dark = S(0x12181a, 3, 0.3), pale = S(0x8a8f8c, 3, 0.4), steel = S(0x39444a, 3, 0.3), rustM = S(0x6a4634, 1, 0.5), earth = S(0x2e2f2a, 3, 0.4), tar = S(0x2a2e33, 5, 0.4);
    withSeed(11039, () => {
      const [c, g] = mkCanvas(512, 512);
      g.fillStyle = '#89918e'; g.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 8500; i++) {
        g.fillStyle = rnd() < 0.5 ? `rgba(17,29,30,${rr(0.03, 0.16)})` : `rgba(223,224,211,${rr(0.02, 0.16)})`;
        g.fillRect(rr(0, 512), rr(0, 512), rr(1, 9), rr(1, 5));
      }
      for (let i = 0; i < 85; i++) {
        const x = rr(0, 512), y = rr(0, 60), h = rr(25, 400), gr = g.createLinearGradient(0, y, 0, y + h);
        gr.addColorStop(0, 'rgba(14,28,26,.13)'); gr.addColorStop(1, 'rgba(14,28,26,0)');
        g.fillStyle = gr; g.fillRect(x, y, rr(1, 6), h);
      }
      conc.map = canvasTex(c);
    });
    // 电线杆：一路排过去，有的歪了；电线垂着，有一档断了，耷拉到地上
    const POLES = [X - 2, X + 16, X + 34, X + 50, X + 66, X + 84, X + 106, X + 124, X + 142].map((x, i) => [x, [0.03, -0.05, 0.02, 0.09, -0.03, 0.04, -0.12, 0.05, -0.02][i]]);
    const armAt = ([x, lean], s) => [x - Math.sin(lean) * 6.3 + s * 0.7, gy(x, -4.4) + Math.cos(lean) * 6.3, -4.4];
    const wireM = S(0x101214, 3, 0.3);
    for (const [x, lean] of POLES) {
      const g = grp(R, x, gy(x, -4.4), -4.4); g.rotation.z = lean;
      add(g, cy(0.085, 0.12, 6.9, 8), poleM, 0, 3.45, 0); add(g, bx(1.7, 0.1, 0.1), poleM, 0, 6.3, 0);
      for (const s of [-0.7, 0.7]) add(g, cy(0.035, 0.035, 0.14, 6), pale, s, 6.42, 0, false);
    }
    for (let i = 1; i < POLES.length; i++) for (const s of [-1, 1]) {
      const a = armAt(POLES[i - 1], s), b = armAt(POLES[i], s), pts = [];
      if (i === 4 && s > 0) { tube(R, [a, [a[0] + 2.2, 2.6, -4.3], [a[0] + 3.4, 0.3, -4.0], [a[0] + 5.5, 0.06, -3.6]], 0.012, wireM, 20); continue; }   // 断了的那一档
      for (let t = 0; t <= 1.001; t += 0.125) pts.push([lerp(a[0], b[0], t), lerp(a[1], b[1], t) - 1.1 * 4 * t * (1 - t), -4.4]);
      tube(R, pts, 0.012, wireM, 24);
    }
    // 公路另一侧的铁丝网：木桩有的歪了、有的没了，三道铁丝耷拉着，有几档断了（断桥那一段没有，过了路堤再接上一小段）
    {
      const A = { p: [], n: [] };
      for (const [a, b] of [[X - 22, X + 88], [X + 106, X + 126]]) {
        let prev = null;
        for (let x = a; x <= b; x += rr(2.3, 2.9)) {
          if (rnd() < 0.08) { prev = null; continue; }                                         // 少了一根
          const z = -3.3 + rr(-0.08, 0.08), lean = rr(-0.1, 0.1), h = rr(1.15, 1.3), y = gy(x, z);
          mergePut(A, new THREE.BoxGeometry(0.07, h + 0.3, 0.07), M4.compose(V3(x - Math.sin(lean) * (h - 0.3) / 2, y + (h - 0.3) / 2, z), qq.setFromEuler(ee.set(0, 0, lean)), V3(1, 1, 1)));
          const at = k => V3(x - Math.sin(lean) * h * k, y + h * k, z);
          if (prev && rnd() > 0.07) for (const k of [0.36, 0.58, 0.8]) { const p0 = prev(k), p1 = at(k), pts = []; for (let t = 0; t <= 1.001; t += 0.25) pts.push(p0.clone().lerp(p1, t).add(V3(0, -0.06 * 4 * t * (1 - t), 0))); mergePut(A, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 6, 0.01, 3)); }
          prev = at;
        }
      }
      const m = new THREE.Mesh(mergedGeo(A), S(0x2b2723, 2, 0.35)); m.castShadow = m.receiveShadow = true; m.frustumCulled = false; R.add(m);
    }
    yield;
    // 一块歪了的路牌（在路的另一边：路这一边是镜头前的黑，不放东西）
    { const g = grp(R, X + 25.6, gy(X + 25.6, -2.95), -2.95); g.rotation.z = -0.13; add(g, cy(0.035, 0.035, 2.3, 6), poleM, 0, 1.15, 0); add(g, bx(0.62, 0.62, 0.03), S(0x596066, 3, 0.3), 0, 2.2, 0).rotation.z = Math.PI / 4; }
    // 一 候车亭：水泥的后墙和顶板，两头各半堵侧墙（只到主角走的那条线后面），前面两根细柱子；里面一条长凳，旁边一根站牌
    { const a = COVERS[0][0] - 0.3, b = COVERS[0][1] + 0.3, cx = (a + b) / 2, w = b - a;
      add(R, bx(w + 0.3, 2.5, 0.2), conc, cx, 1.25, -1.25); add(R, bx(w + 0.7, 0.16, 2.9), conc, cx, 2.58, -0.05);
      for (const x of [a - 0.05, b + 0.05]) add(R, bx(0.18, 2.5, 0.8), conc, x, 1.25, -0.85);
      for (const x of [a + 0.05, b - 0.05]) add(R, cy(0.045, 0.045, 2.5, 8), dark, x, 1.25, 1.2);
      add(R, bx(w - 0.8, 0.07, 0.42), wood, cx, 0.46, -0.85); for (const x of [a + 0.7, b - 0.7]) add(R, bx(0.08, 0.46, 0.38), dark, x, 0.23, -0.85);
      add(R, cy(0.035, 0.035, 2.7, 8), poleM, b + 1.3, 1.35, -1.0); add(R, bx(0.5, 0.5, 0.04), S(0x3f4c5a, 3, 0.3), b + 1.3, 2.45, -1.0).rotation.z = 0.06;
      // 脱落的旧告示、积水污痕和破损顶沿，给藏身处一个可辨认的尺度
      shade11(backdrop(a, b, 0.05, 2.48, -1.135, 90, g => withSeed(11040, () => {
        g.fillStyle = 'rgba(183,181,157,.3)'; poly(g, [[a + 0.35, 1.15], [a + 0.95, 1.12], [a + 0.98, 2.0], [a + 0.38, 2.04]]);
        g.fillStyle = 'rgba(23,36,33,.55)';
        for (let i = 0; i < 80; i++) g.fillRect(rr(a, b), 0.05, rr(0.01, 0.08), rr(0.04, 0.3));
        g.strokeStyle = 'rgba(9,18,21,.6)'; line(g, [[b - 0.8, 2.4], [b - 0.95, 2.0], [b - 0.85, 1.8], [b - 1.1, 1.5]], 0.014);
      }), { lit: true }).material, 3, 0.3);
      withSeed(11041, () => { for (let i = 0; i < 24; i++) add(R, bx(rr(0.03, 0.18), rr(0.015, 0.05), 0.04), conc2, rr(a, b), 2.51, 1.42, false); });
    }
    yield;
    // 二 集装箱：朝镜头的那块侧板早就锈穿、掉了，两头的门也没了，只剩后面的波纹板、顶和四根角柱
    { const a = COVERS[1][0] - 0.35, b = COVERS[1][1] + 0.35, cx = (a + b) / 2, w = b - a, z0 = -1.45, z1 = 1.0, h = 2.6;
      add(R, bx(w, h, 0.08), rust, cx, h / 2, z0); add(R, bx(w + 0.06, 0.1, z1 - z0 + 0.12), rust2, cx, h, (z0 + z1) / 2);
      for (let x = a + 0.15; x < b; x += 0.3) add(R, bx(0.12, h - 0.2, 0.05), rust2, x, h / 2, z0 + 0.06, false);                 // 波纹板的竖棱
      for (const x of [a, b]) { for (const z of [z0, z1]) add(R, bx(0.14, h, 0.14), dark, x, h / 2, z); add(R, bx(0.12, 0.14, z1 - z0), dark, x, h - 0.07, (z0 + z1) / 2, false); }
      for (const z of [z0, z1]) add(R, bx(w, 0.16, 0.12), dark, cx, 0.08, z, false);
      add(R, bx(0.9, 0.5, 0.03), S(0x7c7466, 3, 0.3), a + 1.3, 1.9, z0 + 0.1, false);                                               // 一块褪了色的铭牌
    }
    yield;
    // 三 铁皮棚：四根木柱撑着一面前高后低的波纹铁皮，后面钉着一排木板；里面两只旧轮胎、一只木箱
    { const a = COVERS[2][0] - 0.4, b = COVERS[2][1] + 0.4, cx = (a + b) / 2, w = b - a;
      add(R, bx(w + 0.9, 0.05, 3.3), tin, cx, 2.5, -0.1).rotation.x = -0.16;
      for (let x = a - 0.35; x < b + 0.4; x += 0.42) add(R, bx(0.05, 0.03, 3.3), tin, x, 2.535, -0.1, false).rotation.x = -0.16;   // 铁皮的棱
      for (let x = a - 0.05; x < b; x += 0.27) add(R, bx(0.25, rr(2.05, 2.25), 0.04), wood, x + 0.13, 1.08, -1.32);
      for (const x of [a, b]) { add(R, bx(0.12, 2.72, 0.12), wood, x, 1.36, 1.3); add(R, bx(0.12, 2.3, 0.12), wood, x, 1.15, -1.4); }
      for (const [x, y, r] of [[b - 0.8, 0.12, 0], [b - 0.72, 0.36, 0.1]]) { const t = add(R, new THREE.TorusGeometry(0.3, 0.115, 8, 18), dark, x, y, -0.78); t.rotation.set(Math.PI / 2, 0, r); }
      add(R, bx(0.75, 0.6, 0.7), wood, a + 0.75, 0.3, -0.85).rotation.y = 0.2;
    }
    yield;
    // 四 断桥：一条从远处的路堤上过来、横跨在公路上面的旧桥。靠镜头的那一半早塌了，只剩后面的桥台、一截桥面和前面两根桥墩
    //   （塌下来的桥板原来躺在路前面的草里 —— 那是前景，拿掉了）
    { const a = COVERS[3][0] - 0.4, b = COVERS[3][1] + 0.4, cx = (a + b) / 2, w = b - a, top = 3.9, th = 0.6;
      add(R, bx(w, th, 5.6), conc2, cx, top - th / 2, -1.2);                                                                      // 桥面：z 从 -4 到 1.6
      add(R, bx(w + 0.5, top - th, 1.0), conc2, cx, (top - th) / 2, -3.5);                                                         // 桥台
      for (const x of [a + 0.6, b - 0.6]) { add(R, cy(0.34, 0.34, top - th, 14), conc2, x, (top - th) / 2, 1.1); add(R, bx(1.0, 0.24, 1.0), conc2, x, top - th - 0.12, 1.1, false); }
      const sh = new THREE.Shape(); sh.moveTo(-(w / 2 + 3.3), 0); sh.lineTo(w / 2 + 3.3, 0); sh.lineTo(w / 2 + 0.25, top - th); sh.lineTo(-(w / 2 + 0.25), top - th); sh.closePath();
      add(R, new THREE.ExtrudeGeometry(sh, { depth: 46, bevelEnabled: false }), earth, cx, 0, -50);                                // 路堤：伸到远处，远处慢慢埋进起伏的野地里
      add(R, bx(w - 0.5, 0.06, 47), tar, cx, top - th + 0.02, -27.5).receiveShadow = true;                                         // 路堤上的路面，接到桥面上
      for (const x of [a + 0.14, b - 0.14]) {                                                                                      // 两边的护栏
        for (let z = 1.3; z > -30; z -= 2.2) add(R, bx(0.07, 0.75, 0.07), dark, x, top + 0.37, z, false);
        add(R, bx(0.06, 0.09, 31.6), steel, x, top + 0.62, -14.4, false);
      }
      for (let i = 0; i < 7; i++) { const r = add(R, cy(0.018, 0.018, rr(0.5, 1.1), 5), rustM, a + 0.6 + i * 0.95 + rr(-0.2, 0.2), top - rr(0.15, 0.45), 1.75, false); r.rotation.x = Math.PI / 2 + rr(0.2, 1.0); }   // 断口露出来的钢筋
      // 桥上：一根歪了的灯杆（早不亮了），一辆扔在那里的车
      { const g = grp(R, b - 0.5, top, -6.5); g.rotation.z = -0.14; add(g, cy(0.06, 0.08, 4.6, 8), poleM, 0, 2.3, 0); add(g, bx(1.2, 0.06, 0.06), poleM, -0.55, 4.55, 0, false); }
      add(R, bx(1.75, 0.62, 3.9), dark, cx - 1.2, top + 0.52, -13); add(R, bx(1.6, 0.5, 1.9), dark, cx - 1.2, top + 1.05, -13.3);
    }
    yield;

    // ---------------- 雾片：几层半透明的雾，在孩子身后慢慢横着飘（和第二十一章一样：一段段钉在世界里，只有花纹随风往右飘）----------------
    {
      const [c, gx] = mkCanvas(1024, 256);
      for (let i = 0; i < 70; i++) {
        const x = rr(0, 1024), y = rr(60, 250), w = rr(60, 220), a = rr(0.08, 0.26);
        for (const ox of [-1024, 0, 1024]) { const gr = gx.createRadialGradient(x + ox, y, 0, x + ox, y, w); gr.addColorStop(0, `rgba(255,255,255,${a})`); gr.addColorStop(1, 'rgba(255,255,255,0)');
          gx.save(); gx.translate(0, y); gx.scale(1, 0.35); gx.translate(0, -y); gx.fillStyle = gr; gx.fillRect(x + ox - w, y - w, 2 * w, 2 * w); gx.restore(); }
      }
      gx.globalCompositeOperation = 'destination-in'; const fade = gx.createLinearGradient(0, 0, 0, 256); fade.addColorStop(0, 'rgba(0,0,0,0)'); fade.addColorStop(0.55, 'rgba(0,0,0,1)'); fade.addColorStop(1, 'rgba(0,0,0,0.85)'); gx.fillStyle = fade; gx.fillRect(0, 0, 1024, 256);
      const tex = canvasTex(c); tex.wrapS = THREE.RepeatWrapping;
      const LAY = [[-3, 3, 0.08, 0.35], [-7, 5, 0.12, 0.25], [-14, 8, 0.15, 0.16], [-25, 12, 0.17, 0.1], [-42, 18, 0.17, 0.07]].slice(0, LOW ? 3 : 5);
      const [mc, mg] = mkCanvas(128, 8); { const gr = mg.createLinearGradient(0, 0, 128, 0); gr.addColorStop(0, '#000'); gr.addColorStop(0.25, '#fff'); gr.addColorStop(0.75, '#fff'); gr.addColorStop(1, '#000'); mg.fillStyle = gr; mg.fillRect(0, 0, 128, 8); }
      const sideFade = new THREE.CanvasTexture(mc); sideFade.channel = 1;                         // 两头淡出：用第二套 UV（每一段自己的 0..1）
      v.fogs = LAY.map(([z, h, op, sp], i) => {
        const t = tex.clone(); t.needsUpdate = true; t.wrapS = THREE.RepeatWrapping;
        const mat = own(new THREE.MeshBasicMaterial({ map: t, alphaMap: sideFade, color: 0x9aa2a8, transparent: true, opacity: op, depthWrite: false, fog: true }));
        for (let xc = X - 50; xc < X + 205; xc += 24) {
          const geo = new THREE.PlaneGeometry(36, h), uv = geo.attributes.uv, pos = geo.attributes.position;
          geo.setAttribute('uv1', uv.clone());
          for (let k = 0; k < uv.count; k++) uv.setX(k, (pos.getX(k) + xc) / 140);                 // 花纹按世界 x 取：几段接起来是连着的
          const m = new THREE.Mesh(geo, mat); m.position.set(xc, gy(xc, z) + h / 2 - 0.6, z); m.renderOrder = 30 + i; R.add(m);
        }
        return { t, sp, ph: rr(0, 1) };
      });
    }
    yield;

    // ---------------- 直升机 ----------------
    const mkHeli = (detail = true) => searchAircraft(R, detail, { lit: m => shade11(m, 3, 0.3), basic: hazeOnly });
    Object.assign(v, mkHeli());
    // 沿视线看圆锥表面的夹角淡出边缘，去掉硬三角形轮廓；保留原有的屋顶裁剪。
    // 只改本章材质，不影响别处的探照灯。缓慢变化的条纹让光穿过薄雾。
    v.beamTime = { value: 0 };
    const softenBeam = mat => {
      mat.onBeforeCompile = shader => {
        shader.uniforms.uSearchTime = v.beamTime;
        shader.vertexShader = 'varying vec3 vSearchNormal, vSearchView; varying vec2 vSearchUv;\n' + shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
          vSearchNormal = normalize(normalMatrix * normal);
          vSearchView = -(modelViewMatrix * vec4(position, 1.0)).xyz;
          vSearchUv = uv;`);
        shader.fragmentShader = 'uniform float uSearchTime; varying vec3 vSearchNormal, vSearchView; varying vec2 vSearchUv;\n' + shader.fragmentShader;
        shader.fragmentShader = shader.fragmentShader.replace('#include <alphamap_fragment>', `#include <alphamap_fragment>
          float facing = abs(dot(normalize(vSearchNormal), normalize(vSearchView)));
          float edge = smoothstep(0.02, 0.5, facing);
          float veil = 0.77 + 0.13 * sin(vSearchUv.y * 48.0 + sin(vSearchUv.x * 31.0) * 2.0 - uSearchTime * 0.65)
            + 0.1 * sin(vSearchUv.y * 113.0 + vSearchUv.x * 57.0 + uSearchTime * 0.4);
          diffuseColor.a *= edge * veil * smoothstep(0.0, 0.12, vSearchUv.y);`);
      };
      mat.customProgramCacheKey = () => 'heli-soft-beam-v1';
      return mat;
    };
    v.cones = [];                                          // 看得见的光柱：两层半透明的圆锥叠在一起（雾里的光柱）
    for (const [k, op] of [[1, 0.16], [0.55, 0.075]]) {                // 宽而柔的外层，亮芯也不留硬边
      const geo = new THREE.ConeGeometry(Math.tan(ANG) * CONE_L * k, CONE_L, 28, 1, true); geo.translate(0, -CONE_L / 2, 0); geo.rotateX(-Math.PI / 2);
      const m = new THREE.Mesh(geo, own(new THREE.MeshBasicMaterial({ map: beamGradTex(), color: 0xdce4e8, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false, clippingPlanes: CLIP, clipIntersection: true })));
      softenBeam(m.material); m.renderOrder = 60; m.userData.a = op; m.visible = false; R.add(m); v.cones.push(m);
    }
    v.glare = glow(R, 0xdfe6ea, 6, 0, 0, 0, 0, GLOW_SOFT); v.core = glow(R, 0xffffff, 1.3, 0, 0, 0, 0);                             // 灯头正对着镜头时的那一团眩光
    // 灯扫在远处野地上的那一块亮斑（离得太远，真的灯光照不到那里；雾里只剩一团）
    v.spot = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), own(new THREE.MeshBasicMaterial({ map: GLOW, color: 0xd6dcdf, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })));
    v.spot.rotation.x = -Math.PI / 2; v.spot.renderOrder = 3; v.spot.visible = false; R.add(v.spot);
    // 雾里的几架：各扫各的一条地。真的灯光照不到那么远，只画光柱、灯头的光和地上的亮斑；离得越远越被雾吞掉（见 update）
    v.wing = WING.map(() => {
      const o = mkHeli(false), geo = new THREE.ConeGeometry(Math.tan(ANG) * CONE_L, CONE_L, 20, 1, true); geo.translate(0, -CONE_L / 2, 0); geo.rotateX(-Math.PI / 2);
      o.cone = new THREE.Mesh(geo, own(new THREE.MeshBasicMaterial({ map: beamGradTex(), color: 0xdce4e8, transparent: true, opacity: 0.075, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false })));
      softenBeam(o.cone.material); o.cone.renderOrder = 60; o.cone.visible = false; R.add(o.cone);
      o.glare = glow(R, 0xdfe6ea, 4, 0, 0, 0, 0, GLOW_SOFT);
      o.spot = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), own(new THREE.MeshBasicMaterial({ map: GLOW, color: 0xd6dcdf, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })));
      o.spot.rotation.x = -Math.PI / 2; o.spot.renderOrder = 3; o.spot.visible = false; R.add(o.spot);
      return o;
    });
    // 搜索灯照在路上的破碎倒光；亮斑沿光的落点移动，在屋顶下熄灭
    withSeed(11042, () => {
      const [c, g] = mkCanvas(256, 256);
      for (let i = 0; i < 450; i++) {
        const x = rr(0, 256), y = rr(0, 256), a = Math.pow(Math.max(0, 1 - Math.abs(x - 128) / 128), 2);
        g.fillStyle = `rgba(214,218,220,${a * rr(0.1, 0.65)})`; g.fillRect(x, y, rr(1, 16), rr(0.5, 2));
      }
      v.wet = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), own(new THREE.MeshBasicMaterial({ map: canvasTex(c), color: 0xd2d8da, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })));
      v.wet.rotation.x = -Math.PI / 2; v.wet.scale.set(5.5, 4, 1); v.wet.renderOrder = 4; R.add(v.wet);
    });
    renderer.localClippingEnabled = true;                  // 只有光柱的材质带着裁剪面，别的东西不受影响
    V = v;
  }

  // 直升机不在的时候：把它留下的东西收干净
  function quiet(dt) {
    H.k = damp(H.k, 0, 1.5, dt); H.near = 0; H.on = 0; H.exposure = 0;
    if (H.gust) { GUST.force = undefined; H.gust = false; }
    if (envMod === mod && H.k < 0.002) envMod = null;
    if (H.st === 'calm' && state === 'play') { AUD.heli = 0.045 * sstep(X + 4, X + 20, P.x); AUD.heliLP = 0.1; AUD.heliPan = 0.5; }   // 还没看见它，先听见很远的旋翼声
    bounceL.on = 0;
    if (V) { V.heli.visible = false; for (const c of V.cones) c.visible = false; V.glare.material.opacity = V.core.material.opacity = 0; V.spot.visible = false; V.wet.material.opacity = 0; for (const o of V.wing) { o.heli.visible = o.cone.visible = o.spot.visible = false; o.glare.material.opacity = 0; } }
  }
  // 灯的下一趟：从现在的位置扫到 to。路程短，用的时间也短
  function leg(to) { H.l0 = H.lx; H.l1 = to; H.ls = 0; H.lD = Math.max(1.2, Math.abs(to - H.lx) / (H.stage === COVERS.length ? V_PROBE : V_SWEEP)); }
  function update(dt) {
    const play = state === 'play', v = V;
    NU.uT.value = T; NU.uHX.value = P.x - X;                                                                                    // 着色：孩子在哪（光只照他周围）
    if (v) v.hideK = damp(v.hideK || 0, coverAt(P.x) >= 0 ? 1 : 0, 3, dt);
    // 孩子的上衣：暗红（全画面唯一一块鲜一点的颜色）；身上一圈淡淡的边缘亮光，把轮廓从雾里勾出来（和第二十一章一样）。
    //   逃出工厂那几章的衣服逻辑在 escape/60-kit.js，它先跑、到了旧原型的章节会关掉；这里在它后面再打开
    HERO_TOP.uTop.value.setHex(0x4e1a15); HERO_TOP.uTopK.value = 1; HERO_RIM.uRimK.value = 0.1 + 0.18 * (V ? V.hideK : 0);   // 躲在顶下面（尤其是桥底下）的时候轮廓亮一点，不至于整个人看不见
    { const k = cam.d / 10.5; camJit = { x: k * (0.045 * Math.sin(T * 0.37) + 0.025 * Math.sin(T * 0.91 + 2)), y: k * (0.03 * Math.sin(T * 0.53 + 1) + 0.015 * Math.sin(T * 1.27)) }; }   // 镜头轻轻地漂，像手持（镜头离得比第二十一章远，漂得多一点，看上去一样）
    if (v && v.fogs) for (const f of v.fogs) f.t.offset.x = T * f.sp * (0.6 + GUST.v) / 140 + f.ph;                         // 雾片的位置是固定的，只有花纹随风慢慢往右飘
    if (H.st === 'calm' && play && P.x > X + 20) { H.st = 'hunt'; H.t = 0; H.live = false; H.lx = H.bx = X + 47; H.pos.set(...FAR_IN); H.vel.set(0, 0, 0); }   // 走到这里，它就来了。灯会落在候车亭右边几米的公路上，再朝主角这边扫过来
    if (H.st === 'calm' || H.st === 'gone') { quiet(dt); return; }
    H.t += dt; envMod = mod;
    // 主角到过哪一处了
    const ci = coverAt(P.x), hunt = H.st === 'hunt', arr = hunt ? sstep(0, T_IN, H.t) : 1, hot = hunt && arr >= 1;   // hot：灯已经罩到公路上了
    if (hunt && P.grounded && ci + 1 > H.stage) { H.stage = ci + 1; if (H.live) leg(H.lx > SWEEP[H.stage][0] + 0.5 ? SWEEP[H.stage][0] : SWEEP[H.stage][1]); }   // 到了新的一处：灯先朝这一处的左边扫过来
    if (hot && !H.live) { H.live = true; leg(SWEEP[H.stage][0]); }
    const probe = hunt && H.stage === COVERS.length, [xl, xr] = SWEEP[H.stage];
    H.c = damp(H.c, (xl + xr) / 2, 0.8, dt);
    // 灯来回扫；罩住没遮没挡的主角就开始“盯住”，盯满了就算被发现
    if (H.caught > 0) { H.caught += dt; if (H.caught > 1.25 && play) respawn(); }
    else if (hunt) {
      if (H.live) {
        H.ls += dt / H.lD * (1 - 0.85 * H.exposure);                                                                              // 罩住人的时候慢下来
        if (H.ls >= 1) { H.lx = H.l1; leg(Math.abs(H.l1 - xl) < Math.abs(H.l1 - xr) ? xr : xl); }                                // 扫到头了：掉头
        else H.lx = lerp(H.l0, H.l1, 0.5 - 0.5 * Math.cos(Math.PI * H.ls));
      }
      H.bx = H.lx + (H.live ? 0.3 * Math.sin(T * 1.9) : 0);                                                                       // 手不稳：微微晃着
      const seen = play && hot && Math.abs(P.x - H.bx) < H.r * 0.9 && !inCover(P.x);
      H.exposure = clamp(H.exposure + (seen ? dt / 0.65 : -dt / 0.9), 0, 1);
      if (H.exposure >= 1) { H.caught = 1e-3; ctl = false; fx('alarm'); }
      else if (probe && ci === COVERS.length - 1 && (H.hid += dt) >= T_HID) { H.st = 'leave'; H.t = 0; H.p0.copy(H.pos); H.aim0.copy(H.aim); H.exposure = 0; }   // 找不到：走了
    }
    // 灯照着哪里
    const locked = H.caught > 0, kx = locked ? 1 : sstep(0.15, 1, H.exposure);
    if (H.st === 'hunt') {                                   // 刚来的时候，灯先在远处的野地上扫，一路扫到公路上
      const e = sstep(0.2, 1, H.t / T_IN);
      H.aim.set(lerp(X + 62 + 14 * Math.sin(H.t * 0.9), lerp(H.bx, P.x, kx), e), lerp(0, lerp(0.25, P.y + 0.6, kx), e), lerp(-120, 0.45 * Math.sin(T * 0.9) * (1 - kx), e));
    } else {                                                 // 飞走：灯甩到远处的山坡上去
      const e = sstep(0, 0.45, H.t / T_OUT);
      H.aim.set(lerp(H.aim0.x, X + 40 + 22 * Math.sin(H.t * 0.6), e), lerp(H.aim0.y, 0, e), lerp(H.aim0.z, -150, e));
    }
    // 直升机自己：跟着灯来回飞（飞得没有灯扫得远）；主角躲进桥下以后压低、靠近
    H.low = damp(H.low, probe ? 1 : 0, 0.6, dt);
    const sx = H.c + (probe ? 0.55 : 0.72) * (H.bx - H.c), sy = lerp(9.6, 7.3, H.low) + 0.3 * Math.sin(T * 0.8), sz = lerp(-13.5, -11.5, H.low) + 0.8 * Math.sin(T * 0.37);
    _a.copy(H.pos);
    if (hunt) {
      if (arr < 1) H.pos.set(lerp(FAR_IN[0], sx, arr), lerp(FAR_IN[1], sy, arr), lerp(FAR_IN[2], sz, arr));
      else { H.pos.x = damp(H.pos.x, sx, 1.6, dt); H.pos.y = damp(H.pos.y, sy, 1.2, dt); H.pos.z = damp(H.pos.z, sz, 1.2, dt); }
    } else {
      const e = Math.pow(clamp(H.t / T_OUT, 0, 1), 2.2);
      H.pos.set(lerp(H.p0.x, FAR_OUT[0], e), lerp(H.p0.y, FAR_OUT[1], sstep(0, 1, H.t / T_OUT)), lerp(H.p0.z, FAR_OUT[2], e));
      if (H.t >= T_OUT) { H.st = 'gone'; quiet(dt); return; }
    }
    H.vel.copy(H.pos).sub(_a).divideScalar(Math.max(dt, 1e-4));
    // 机头朝着飞的方向；来回找的时候掉头总是从朝着镜头的那一边转过去。飞得越快机头压得越低，转弯时侧倾
    const y0 = H.yaw;
    // 搜索时侧向悬停，灯头自己转动；避免每次扫描折返都把机身变成一个圆。
    const heading = hunt ? -Math.PI + 0.38 + Math.sin(T * 0.23) * 0.12 : Math.atan2(-H.vel.z, H.vel.x);
    H.yaw = damp(H.yaw, heading, 1.6, dt);
    H.roll = damp(H.roll, clamp(-(H.yaw - y0) / Math.max(dt, 1e-4) * 0.35, -0.35, 0.35), 3, dt);
    H.pitch = damp(H.pitch, -0.05 - clamp(Math.hypot(H.vel.x, H.vel.z) * 0.02, 0, 0.3), 2, dt);
    const lx = H.pos.x + 1.75 * Math.cos(H.yaw), ly = H.pos.y - 0.78, lz = H.pos.z - 1.75 * Math.sin(H.yaw);                  // 灯头在哪
    const fade = hunt ? 1 : 1 - sstep(0.55, 0.92, H.t / T_OUT);                                                               // 飞远了，灯也看不见了
    for (const w of WING) stepWing(w, dt, arr, hunt);
    beam.position.set(lx, ly, lz); beam.target.position.copy(H.aim); beam.angle = ANG; beam.penumbra = 0.45;
    beam.intensity = 34 * fade; beam.color.lerpColors(C_CALM, C_ALERT, kx);
    H.lamp[0] = lx; H.lamp[1] = ly; H.lamp[2] = lz; H.aim.toArray(H.tgt); H.on = fade;
    bounceL.p[0] = H.aim.x; bounceL.p[1] = H.aim.y + 1.4; bounceL.p[2] = H.aim.z + 0.6; bounceL.on = fade * sstep(-30, -8, H.aim.z); bounceL.c.copy(beam.color);
    // 离得多近：声音、风、蟋蟀都跟着它
    const dist = Math.hypot(H.pos.x - P.x, H.pos.y - P.y, H.pos.z);
    H.k = damp(H.k, sstep(260, 70, dist), 1.5, dt); H.near = sstep(30, 12, dist) * sstep(14, 6, H.pos.y);
    GUST.force = H.near > 0.02 ? lerp(gustAt(T), 3.2, H.near) : undefined; H.gust = H.near > 0.02;
    AUD.heli = clamp(20 / (dist + 5) + 0.12 * H.k, 0, 1);   /* 远处那几架也听得见 */ AUD.heliPan = 0.8 * clamp((H.pos.x - cam.x) / 16, -1, 1); AUD.heliLP = clamp(1.25 - dist / 150, 0.12, 1);
    // 躲在有顶的地方、灯又扫到附近时：站住不动的主角会缩起身子
    HX.hide = play && hot && ci >= 0 ? sstep(9, 4, Math.abs(P.x - H.bx)) * sstep(2.4, 0.9, Math.abs(P.vx)) : 0;
    if (HX.hide > 0) HX.pose = { sit: 0.75 * HX.hide, sitH: 0.25, sitLeg: 0.35, bow: 0.3 * HX.hide };                          // 蹲下去，两手拢在胸前
    HX.alert = H.exposure;
    if (H.st === 'leave' && H.t < 8) camOvr = { d: 28, yo: 5.0, xo: -5 };                                                     // 镜头往左上方让一让：看着它飞走

    if (!v) return;
    v.beamTime.value = T;
    v.wet.position.set(H.aim.x, groundY(H.aim.x) + 0.035, 0.5);
    v.wet.material.color.copy(beam.color);
    v.wet.material.opacity = fade * 0.4 * sstep(-10, -2, H.aim.z) * (inCover(H.aim.x) ? 0 : 1);
    v.heli.visible = true; v.heli.position.copy(H.pos); v.heli.rotation.y = H.yaw; v.tilt.rotation.set(H.roll, 0, H.pitch);
    v.rotor.rotation.y += dt * 41; v.tailRotor.rotation.z += dt * 63;
    _a.set(lx, ly, lz); const len = _a.distanceTo(H.aim) + 0.8;
    for (const c of v.cones) { c.visible = fade > 0.01; c.position.copy(_a); c.lookAt(H.aim); c.scale.setScalar(len / CONE_L); c.material.color.copy(beam.color); c.material.opacity = c.userData.a * fade; }
    v.pod.lookAt(H.aim);
    // 光柱照到哪一处的顶上，就把顶下面那一块影子里的光柱切掉（影子的左、右、前三个面都顺着光的方向斜下去）
    const rf = ROOFS.find(r => H.aim.x > r[0] - 6 && H.aim.x < r[1] + 6 && H.aim.z > -8);
    if (!rf) CLIP[2].set(_b.set(0, 1, 0), 1e4);            // 附近没有顶：围出来的那一块挪到地底下去
    else {
      const [x1, x2, ry, zb, zf] = rf, cx = (x1 + x2) / 2, L = _c;
      L.set(x1, ry, 0).sub(_a).normalize(); CLIP[0].setFromNormalAndCoplanarPoint(_b.set(L.y, -L.x, 0).normalize(), L.set(x1, ry, 0));
      L.set(x2, ry, 0).sub(_a).normalize(); CLIP[1].setFromNormalAndCoplanarPoint(_b.set(-L.y, L.x, 0).normalize(), L.set(x2, ry, 0));
      CLIP[2].setFromNormalAndCoplanarPoint(_b.set(0, 1, 0), L.set(cx, ry, 0)); CLIP[3].setFromNormalAndCoplanarPoint(_b.set(0, 0, -1), L.set(cx, 0, zb));
      L.set(cx, ry, zf).sub(_a).normalize(); CLIP[4].setFromNormalAndCoplanarPoint(_b.set(0, L.z, -L.y).normalize(), L.set(cx, ry, zf));
    }
    const face = Math.max(0, _b.copy(camera.position).sub(_a).normalize().dot(_c.copy(H.aim).sub(_a).normalize()));           // 灯头有多正对着镜头
    v.glare.position.copy(_a); v.core.position.copy(_a); v.glare.material.color.copy(beam.color);
    v.glare.material.opacity = fade * (0.3 + 0.6 * face ** 3); v.glare.scale.setScalar(lerp(3, 8.5, face ** 4)); v.core.material.opacity = fade * (0.5 + 0.5 * face);
    const el = clamp((ly - H.aim.y) / len, 0.08, 1), rs = len * Math.tan(ANG) * 2.6;                                          // 远处的亮斑：灯压得越低，拉得越长
    v.spot.visible = H.aim.z < -9; v.spot.position.set(H.aim.x, gy(H.aim.x, H.aim.z) + 0.06, H.aim.z); v.spot.scale.set(rs, rs / el, 1); v.spot.material.opacity = 0.8 * fade * sstep(-9, -28, H.aim.z) * (1 - 0.8 * haze11(-H.aim.z, 0));   // 雾里只剩一团
    v.wing.forEach((o, i) => {
      const w = WING[i], wl = _b.set(w.pos.x + 1.75 * Math.cos(w.yaw), w.pos.y - 0.78, w.pos.z - 1.75 * Math.sin(w.yaw)), wn = wl.distanceTo(w.aim) + 0.8, we = clamp((wl.y - w.aim.y) / wn, 0.08, 1), wr = wn * Math.tan(ANG) * 2.6;
      o.heli.visible = true; o.heli.position.copy(w.pos); o.heli.rotation.y = w.yaw; o.tilt.rotation.set(0, 0, -0.05 - clamp(w.sp * 0.02, 0, 0.3));
      o.rotor.rotation.y += dt * 41; o.tailRotor.rotation.z += dt * 63; o.pod.lookAt(w.aim);
      const hz = haze11(-w.pos.z, w.pos.y), hs = haze11(-w.aim.z, 0);                                                          // 雾把远处的几架吞掉多少：机身在着色器里，光柱、灯头、亮斑在这里跟着淡
      o.cone.visible = fade > 0.01; o.cone.position.copy(wl); o.cone.lookAt(w.aim); o.cone.scale.setScalar(wn / CONE_L); o.cone.material.opacity = 0.17 * fade * (1 - i * 0.09) * (1 - 0.6 * hz);
      o.glare.position.copy(wl); o.glare.material.opacity = 0.75 * fade * (1 - 0.45 * hz);
      o.spot.visible = fade > 0.01; o.spot.position.set(w.aim.x, gy(w.aim.x, w.aim.z) + 0.06, w.aim.z); o.spot.scale.set(wr * 1.4, wr * 1.4 / we, 1); o.spot.material.opacity = 0.8 * fade * (1 - 0.8 * hs);
      const b2 = (T + i * 0.37) % 1.3; o.strobe.material.opacity = b2 < 0.06 || (b2 > 0.16 && b2 < 0.22) ? 1 : 0; o.beacon.material.opacity = (T + i * 0.3) % 0.9 < 0.12 ? 0.95 : 0.1;
    });
    const bl = T % 1.3; v.strobe.material.opacity = bl < 0.06 || (bl > 0.16 && bl < 0.22) ? 1 : 0; v.beacon.material.opacity = T % 0.9 < 0.12 ? 0.95 : 0.1;
  }
  // 这一点照不照得到（1 照得到，0 在顶下面的影子里）：空中的灰用。五个面都在它们的背面，就是在影子里
  const lit = (x, y, z) => { _d.set(x, y, z); for (const p of CLIP) if (p.distanceToPoint(_d) >= 0) return 1; return 0; };
  function reset() {
    Object.assign(H, { st: 'calm', t: 0, stage: 0, live: false, lx: X + 47, l0: X + 47, l1: X + 47, ls: 0, lD: 1, c: X + 46, bx: X + 47, exposure: 0, caught: 0, hid: 0, low: 0, k: 0, near: 0, on: 0, yaw: -1.57, roll: 0, pitch: 0 });
    H.pos.set(...FAR_IN); H.vel.set(0, 0, 0);
    if (H.gust) { GUST.force = undefined; H.gust = false; }
    if (envMod === mod) envMod = null;
  }
  function solve() { reset(); H.st = 'gone'; }
  return defZone({ n: OLD + 11, vis: [X - 30, X + 170], build, update, reset, solve, unbuild() { V = null; },
    // 回到存档点：灯从这一段的最右边重新朝这边扫过来
    respawn(c) { if (c.x > X - 10 && c.x < X + 160) { Object.assign(H, { exposure: 0, caught: 0, hid: Math.min(H.hid, 3) }); if (H.live) { H.lx = SWEEP[H.stage][1]; leg(SWEEP[H.stage][0]); } } }, H, COVERS, SWEEP, lit });
})();
