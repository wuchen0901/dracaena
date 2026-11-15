// ============================================================
//  第二十一章 · 墙（试验关：一堵从镜头跟前一直伸到看不见的地方去的旧砖墙，跳一下就翻过去）
//  这一关只试一件事：近处做细，远处压暗，而且暗得有层次，不让人一眼望到头。
//    近处（镜头后面到 z = -42）：一块一块的砖，有倒角、顺砖丁砖、灰缝缩进去一点、砖面的颗粒和小坑、
//         墙顶一排立砌的压顶砖、豁口是一阶一阶塌下去的，塌下来的砖散在墙脚
//    远处（z = -42 往后）：一整条墙体，砖缝在着色器里画；豁口的轮廓还在
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
  const C = chapter({ n: OLD + 14, x0: X - 12, start: X + 2, name: '墙', sub: '翻过去', ground: 'dirt',
    intro() { CAT.state = 'none'; } });
  terrain([X - 60, 0], [X + 60, 0]);
  ground(X - 60, 0x2a2520); ground(X + 60, 0x2a2520);
  groundFront(X - 60, X + 60, null);                           // 共用的地面这一段不铺：这一章自己铺（远处要跟着压暗）
  solid({ x1: X - 12.6, x2: X - 11.6, y1: -2, y2: 30, noclimb: true });
  solid({ x1: X + 30, x2: X + 31, y1: -2, y2: 30, noclimb: true });
  solid({ x1: WX - T / 2 - 0.015, x2: WX + T / 2 + 0.015, y1: -1, y2: TOP, snd: 'concrete' });   // 墙在玩法平面上的那一截
  checkpoint(X + 2); checkpoint(WX + 1.4);
  camKeys([X - 12, 10.5, 0.95, 0.5, -0.32], [X + 30, 10.5, 0.95, 0.5, -0.32]);   // 镜头压低到差不多孩子眼睛的高度：墙才看得出是墙，不是一条路
  const NIGHT = { fog: 0x07090d, fogD: 0.011, hemiS: 0x4a5a78, hemiG: 0x100f0d, hemiI: 0.45, keyC: 0xb8c8e6, keyI: 3.8, keyDir: [-0.35, 0.2, -0.92], rimC: 0x8090b0, rimI: 0,
    dustC: 0xc8b89a, dustO: 0.1, wind: 0.03, ext: 1, sky: [0x04060a, 0x060810, 0x0a0e17, 0x0f141d, 0x0b0e14, 0x07090d], sunP: 0, stars: 0.55, cloud: 0, birds: 0, flies: 0, vig: 1.15,
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
  const WU = { uT: { value: 0 } };
  const v3 = h => { const c = new THREE.Color(h); return `vec3(${c.r.toFixed(4)}, ${c.g.toFixed(4)}, ${c.b.toFixed(4)})`; };
  const GL_COMMON = `varying vec3 vWP; varying vec3 vWN; uniform float uT;
    float h21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
    float h31(vec3 p) { p = fract(p * vec3(.1031, .1030, .0973)); p += dot(p, p.yxz + 33.33); return fract((p.x + p.y) * p.z); }
    float n2(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
      return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
    float n3(vec3 p) { vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
      return mix(mix(mix(h31(i), h31(i + vec3(1, 0, 0)), f.x), mix(h31(i + vec3(0, 1, 0)), h31(i + vec3(1, 1, 0)), f.x), f.y),
                 mix(mix(h31(i + vec3(0, 0, 1)), h31(i + vec3(1, 0, 1)), f.x), mix(h31(i + vec3(0, 1, 1)), h31(i + vec3(1, 1, 1)), f.x), f.y), f.z); }
    float wallD(vec3 q) {
      float dz = max(0., -q.z);
      float base = 0.04 + 0.96 * exp(-max(0., dz - 2.) / 9.);               // 孩子走的那一带最亮，往后很快暗下去
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
    diffuseColor.rgb = mix(diffuseColor.rgb, ${v3(0xb0aca0)}, smoothstep(0.55, 0.8, n2(vec2(q.z * 3., q.y * 9.) + q.x)) * (1. - smoothstep(0.05, 0.4, q.y)) * side * 0.3);`,
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
    // 2 地面：土、干草根、碎石，一条踩实了的小路（玩法平面上），墙脚又湿又暗
    `float fd = 1. - smoothstep(4., 26., distance(vWP, cameraPosition));
    vec2 g = q.xz;
    float big = n2(g * 0.16) * 0.6 + n2(g * 0.5 + 3.) * 0.4, mid = n2(g * 2.1 + 1.3), fine = n3(vec3(g * 24., 0.5)), fine2 = n3(vec3(g * 70., 1.5));
    vec3 c = mix(${v3(0x342b23)}, ${v3(0x463b2c)}, smoothstep(0.35, 0.8, big));
    c = mix(c, ${v3(0x34332f)}, smoothstep(0.5, 0.9, mid) * 0.45);
    c = mix(c, ${v3(0x3a3329)}, (1. - smoothstep(0.3, 1.1, abs(q.z + 0.05 + 0.2 * (n2(g * 0.9) - .5)))) * 0.55);
    c *= mix(1., 0.75 + 0.35 * fine + 0.2 * (fine2 - .5), fd);
    float wall = abs(q.x) - ${(T / 2).toFixed(3)};
    c *= mix(0.45, 1., smoothstep(0., 0.42, wall));
    diffuseColor.rgb = c;`,
    // 3 其它（灯杆）：只跟着压暗
    ``,
  ];
  function shade(mat, kind) {
    mat.userData.own = true;
    mat.customProgramCacheKey = () => 'ch14-' + kind;
    mat.onBeforeCompile = sh => {
      sh.uniforms.uT = WU.uT;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP; varying vec3 vWN;')
        .replace('#include <fog_vertex>', `#include <fog_vertex>
          vec4 wp14 = vec4(transformed, 1.0); vec3 wn14 = objectNormal;
          #ifdef USE_INSTANCING
            wp14 = instanceMatrix * wp14; wn14 = mat3(instanceMatrix) * wn14;
          #endif
          vWP = (modelMatrix * wp14).xyz; vWN = normalize(mat3(modelMatrix) * wn14);`);
      const lb = THREE.ShaderChunk.lights_fragment_begin, hook = 'getDirectionalLightInfo( directionalLight, directLight );';
      if (!lb.includes(hook)) console.warn('第二十一章：three.js 的光照代码变了，月光不会跟着压暗');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + GL_COMMON)
        .replace('#include <color_fragment>', `#include <color_fragment>
          vec3 q = vWP - vec3(${WX.toFixed(2)}, 0., 0.); float wD = wallD(q);
          ${SURF[kind]}`)
        .replace('#include <lights_fragment_begin>', lb.replace(hook, hook + ' directLight.color *= wD;'))
        .replace('#include <lights_fragment_end>', '#include <lights_fragment_end>\n reflectedLight.indirectDiffuse *= wD;');
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
          const y = r * PY + J + BH / 2 + rr(-0.0015, 0.0015), x = WX + f * (T / 2 - hx - rec) + rr(-0.002, 0.002);
          pushBox(A, x, y, zc + rr(-0.003, 0.003), hx, hy, hz, zc > -14 ? 0.0065 : 0,
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
          pushBox(A, WX + s * (hxc + J / 2) + loose * rr(-0.03, 0.03), y, zc + rr(-0.002, 0.002) + loose * rr(-0.015, 0.015), hxc + rr(-0.002, 0.002), hy, BH / 2 - rr(0.0005, 0.002), zc > -14 ? 0.006 : 0,
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
    // ---- 前景：镜头跟前一整条建筑废料，照不到灯，几乎全黑，只勉强看得出轮廓 ----
    //   高度不能挡住孩子的脚：从镜头看过去，z 处的东西矮于 hmax(z) 就在孩子脚底下的画面里（离镜头越近，能越高）；
    //   隔一段才有一样高的（断砖垛、斜靠的板子、竖着的钢筋），离镜头很近，走过去一晃就过去了
    const CZ = 10.5, hmax = z => 1.17 - 0.111 * (CZ - z), hknee = z => 0.16 + 0.096 * z;   // hmax：不挡孩子的脚；hknee：顶多挡到孩子的脚踝
    const C = { p: [], n: [], c: [] }, conc = () => new THREE.Color(0x5a5852).multiplyScalar(rr(0.7, 1.05));
    const concMat = shade(lam(0xffffff, { vertexColors: true }), 3), rust = shade(lam(0x3a2a20), 3);
    const rebar = (pts, r = 0.009) => tube(R, pts, r, rust, 10);
    const mound = (x, z, r, h, col) => { const m = add(R, rockGeo(Math.floor(rr(0, 9999)), { detail: 1, amp: 0.2, flat: 1, moss: 0.15, col }), concMat, x, 0, z); m.scale.set(r, h, r * rr(0.6, 0.9)); m.rotation.y = rr(0, 6.28); };
    const heap = (cx, cz, r, h) => {                                // 一堆碎砖：底下一个土堆垫着，上面乱码着整砖、半截砖
      mound(cx, cz, r * 0.85, h * 0.75, 0x3e3830);
      for (let i = 0, n = Math.round(r * r * 70 + 8); i < n; i++) {
        const a = rr(0, 6.28), d = Math.sqrt(rnd()) * r, x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d * 0.75, top = h * (1 - (d / r) * (d / r));
        pushBox(A, x, rr(top * 0.55, Math.max(0.03, top)) + 0.02, z, BD / 2, BH / 2, rnd() < 0.35 ? rr(0.04, 0.09) : BL / 2, 0, [rr(-0.7, 0.7), rr(0, 6.28), rr(-0.7, 0.7)], brickCol(0.1, 0.85));
      }
    };
    // 板面朝镜头这边倾斜（rx > 0）：背着月亮，板面是暗的
    const slab = (x, z, w, d, th, rx, rz, bars) => {               // 一块断了的钢筋混凝土板，半埋着、歪着，断口那边戳出几根弯了的钢筋
      const y = th / 2 + Math.abs(Math.sin(rx)) * d * 0.5 + Math.abs(Math.sin(rz)) * w * 0.5 - rr(0.02, 0.08), ry = rr(0, 6.28);
      pushBox(C, x, y, z, w / 2, th / 2, d / 2, 0.01, [rx, ry, rz], conc());
      const m = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(rx, ry, rz)).setPosition(x, y, z);
      for (let i = 0; i < bars; i++) {
        const u = rr(-0.4, 0.4) * d, p0 = V3(w / 2 - 0.05, rr(-0.3, 0.3) * th, u), dir = V3(1, rr(-0.2, 0.6), rr(-0.4, 0.4)).normalize(), L = rr(0.2, 0.45);
        const p1 = p0.clone().addScaledVector(dir, L * 0.45), p2 = p1.clone().addScaledVector(dir, L * 0.3).add(V3(0, rr(-0.25, 0.3), rr(-0.2, 0.2))), p3 = p2.clone().add(V3(rr(0, 0.2), rr(-0.3, 0.1), rr(-0.15, 0.15)));
        rebar([p0, p1, p2, p3].map(p => p.applyMatrix4(m).toArray()));
      }
    };
    const chunk = (x, z, s) => { const m = add(R, rockGeo(Math.floor(rr(0, 9999)), { detail: 0, amp: 0.35, flat: 0.7, moss: 0, col: 0x6e6b64 }), concMat, x, s * 0.25, z); m.scale.set(s * rr(1, 1.6), s, s * rr(0.8, 1.2)); m.rotation.set(rr(-0.4, 0.4), rr(0, 6.28), rr(-0.4, 0.4)); };
    const pier = (x, z, h) => {                                     // 断了的砖垛：一层两块，上面几层缺东少西
      for (let r = 0, n = Math.round(h / PY); r < n; r++) for (const k of [-1, 1]) {
        if (r > n - 4 && rnd() < 0.35 + (r - n + 4) * 0.15) continue;
        const along = r % 2 ? [BL / 2, BD / 2] : [BD / 2, BL / 2], o = r % 2 ? [0, k * 0.058] : [k * 0.058, 0];
        pushBox(A, x + o[0] + rr(-0.004, 0.004), r * PY + J + BH / 2, z + o[1], along[0], BH / 2, along[1], 0, [0, rr(-0.03, 0.03), 0], brickCol(r * PY, 0.85));
      }
    };
    const wallX = (x0, x1, zc, top) => {                           // 沿着 x 的一段残墙，只剩墙根，两皮砖厚，上沿参差
      for (let r = 0; r < 9; r++) for (const k of [-1, 1]) {
        const off = (r % 2) * PZ / 2;
        for (let x = x0 + off; x < x1; x += PZ) if (r < top(x) + rr(-0.6, 0.6))
          pushBox(A, x + PZ / 2, r * PY + J + BH / 2, zc + k * 0.056, BL / 2 - rr(0, 0.003), BH / 2, BD / 2 - 0.002, 0, [0, rr(-0.01, 0.01), 0], brickCol(r * PY, 0.85));
      }
    };
    // 近处那一截墙脚下两边：堆着的碎砖
    for (let z = 3.6; z < 10; z += rr(0.7, 1.4)) for (const sd of [-1, 1]) if (rnd() < 0.8) { const r = rr(0.35, 0.75); heap(WX + sd * (T / 2 + r * 0.6), z, r, Math.min(hmax(z) * 0.85, r * 0.6)); }
    // 整条路的前景
    //   连成一片：碎砖堆、断板一个挨一个，高度贴着“不挡孩子脚”的那条视线（hmax），在画面下沿连成一条黑色的剪影
    for (let x = X - 16; x < X + 36; x += rr(0.35, 0.8)) {
      if (Math.abs(x - WX) < 1.2) continue;
      //   两排：前排（靠近孩子，z 2.6–4.4）高，贴着“顶多挡到脚踝”的视线；后排（靠镜头，z 4.4–8.4）矮，落在前排的影子里
      const front = rnd() < 0.3, z = front ? rr(2.6, 4.4) : 4.4 + 4 * Math.sqrt(rnd()), u = rnd(), hm = front ? hknee(z) : hmax(z) * 0.7;   // 离镜头至少 2 米
      if (u < 0.5) { const r = rr(0.5, 1.3); heap(x, z, r, Math.min((front ? hknee(z + r * 0.75) : hmax(z + r * 0.75) * 0.7) * rr(0.8, 0.95), r * 0.9)); }   // 堆的近边也不能高过那条视线
      else if (u < 0.78) { const th = rr(0.1, 0.18), d = rr(0.4, 0.7), w = rr(0.8, 1.8), rz = (rnd() < 0.5 ? -1 : 1) * Math.asin(Math.min(0.95, (hm - 0.15) * rr(0.6, 0.85) / w)); slab(x, z, w, d, th, rr(0.3, 0.55), rz, Math.floor(rr(2, 6))); }
      else { chunk(x, z, rr(0.12, Math.min(0.35, hm * 0.5))); chunk(x + rr(-0.5, 0.5), z + rr(-0.4, 0.4), rr(0.08, 0.2)); }
      if (rnd() < 0.5) chunk(x + rr(-0.6, 0.6), rr(2.6, 9.2), rr(0.04, 0.1));
    }
    // 前排：靠近孩子的一道连续的碎砖垄（z 2.6–3.8），贴着“顶多挡到脚踝”的视线，影子往镜头这边拖，盖住后面
    for (let x = X - 16; x < X + 36; x += rr(0.3, 0.6)) {
      if (Math.abs(x - WX) < 0.9) continue;
      const z = rr(2.6, 3.8), r = rr(0.45, 0.85);
      heap(x, z, r, Math.min(hknee(z + r * 0.75) * rr(0.82, 0.95), r * 0.95));
    }
    // 一段只剩墙根的房子的墙，横在前景里，有几处断开
    for (const [x0, x1] of [[X - 15, X - 9.5], [X - 7.8, X - 3], [X + 12, X + 17.5], [X + 20, X + 27]]) wallX(x0, x1, 6.4, x => 4 + 5 * (0.5 + 0.5 * Math.sin(x * 0.7)) * sstep(x0, x0 + 1.2, x) * sstep(x1, x1 - 1.2, x));
    // 隔一段一样高的东西：离镜头很近，一晃就过去
    const TALL = []; for (let x = X - 15, i = 0; x < X + 36; x += rr(7, 11), i++) if (Math.abs(x - WX) > 1.5) TALL.push([x, ['pier', 'slab', 'bars', 'pier', 'slab'][i % 5]]);
    for (const [x, kind] of TALL) {
      const z = rr(6.0, 6.8);
      if (kind === 'pier') pier(x, z, rr(0.75, 0.92));
      else if (kind === 'slab') { const th = 0.14, w = 0.9, h = 0.95, y = h / 2 * Math.cos(0.45) - 0.05;   // 斜靠着的一块板，上沿断口戳出钢筋
        pushBox(C, x, y, z, w / 2, h / 2, th / 2, 0.01, [-0.45, rr(-0.3, 0.3), rr(-0.1, 0.1)], conc());
        for (let i = 0; i < 5; i++) { const bx0 = x + rr(-0.45, 0.45), by0 = h * Math.cos(0.45) - 0.08, bz0 = z - h / 2 * Math.sin(0.45); rebar([[bx0, by0, bz0], [bx0 + rr(-0.05, 0.05), by0 + rr(0.15, 0.3), bz0 - rr(0, 0.1)], [bx0 + rr(-0.25, 0.25), by0 + rr(0.25, 0.5), bz0 + rr(-0.2, 0.15)]], 0.011); }
        heap(x + rr(-0.3, 0.3), z + 0.4, 0.6, 0.35); }
      else { mound(x, z, 0.5, 0.25, 0x5a5850); for (let i = 0; i < 7; i++) { const bx0 = x + rr(-0.35, 0.35), bz0 = z + rr(-0.2, 0.2), hh = rr(0.5, 0.9); rebar([[bx0, 0.1, bz0], [bx0 + rr(-0.05, 0.05), hh * 0.6, bz0], [bx0 + rr(-0.3, 0.3), hh, bz0 + rr(-0.2, 0.2)], [bx0 + rr(-0.5, 0.5), hh - rr(0, 0.3), bz0 + rr(-0.2, 0.2)]], 0.012); } }
    }
    v.debris = meshOf(C, concMat); R.add(v.debris);
    const brickMat = shade(lam(0xffffff, { vertexColors: true }), 0);
    v.wall = meshOf(A, brickMat); R.add(v.wall);
    v.mortar = meshOf(M, brickMat); R.add(v.mortar);
    v.far = meshOf(F, shade(lam(0x6a4436), 1)); R.add(v.far);
    yield;
    // ---- 地面：一整块，颜色在着色器里算（越远越暗也在那里） ----
    const gm = add(R, new THREE.PlaneGeometry(260, 430), shade(lam(0xffffff), 2), X + 70, 0, -197, false);
    gm.rotation.x = -Math.PI / 2; gm.receiveShadow = true;
    // 墙脚的小石子（只放在近处：它们不跟着压暗）
    { const pts = []; for (let i = 0; i < 140; i++) { const s = rnd() < 0.5 ? -1 : 1; pts.push([WX + s * (T / 2 + Math.pow(rnd(), 2) * 1.4 + 0.02), rr(-10, 10), rr(0.012, 0.035)]); }
      pebbles(R, pts.filter(([x, z]) => !(Math.abs(z) < 0.45 && Math.abs(x - WX) < 1.3)), { cols: [0x5a5650, 0x4c4842, 0x625c52, 0x3f3b36] }); }
    yield;
    // 很远的地方一排树的剪影，比天边那一点点亮光再黑一点：挡住视线，看不到头
    backdrop(X - 120, X + 140, -2, 20, -215, 5, g => {
      setInk(g, '#030405'); box(g, X - 120, -2, 260, 2.6);
      // 一整片林子：树冠一团团挤在一起，顶上参差不齐，偶尔冒出一棵高一点的针叶树；糊一点，和天几乎分不开
      for (let x = X - 120; x < X + 140; x += rr(0.8, 1.8)) { const h = 5 + 3.5 * Math.sin(x * 0.05) + 2.5 * Math.sin(x * 0.17 + 1) + rr(-1, 1.5); disc(g, x, h - rr(0.5, 1.5), rr(1.2, 2.6)); box(g, x - 1, -2, 2.2, h - 1); }
      for (let x = X - 115; x < X + 135; x += rr(9, 26)) tree(g, x, 0, rr(10, 14), 'pine');
    }, { fog: false, blur: 2.5, blurOnce: true });
    V = v;
  }

  function update(dt) {
    const here = P.x > X - 16 && P.x < X + 36;
    if (!here) return;
    WU.uT.value = T;
    // 镜头不越过墙：离墙近的时候，镜头留在孩子这一边（不然墙伸到镜头跟前的那一段会挡住人）
    if (Math.abs(P.x - WX) < 4) { const L = cam.look; camOvr = { d: 10.5, yo: 0.95, lift: -0.32, xo: P.x < WX ? Math.min(0.5, WX - 1.3 - P.x - L) : Math.max(0.5, WX + 1.3 - P.x - L) }; }

  }
  return defZone({ n: OLD + 14, vis: [X - 20, X + 40], build, update, reset() {}, solve() {}, unbuild() { V = null; } });
})();
