// ============================================================
//  第 37 章 · 草地（2026-11-17）
//  铃那一章的门外面是白的：往外走，白光一点点退下去，原来是雾 —— 夜里的一片草地，月亮在左上方，地上铺着浅浅的一层白雾（齐膝）。
//  草其实不多：只有零零星星几根长的伸出雾来（有的带穗），矮的都没在雾里，看不见。远远看过去，雾底下像是一整片草坪，
//  其实就那么几根长草 —— 雾把空着的地方都“补”上了。矮草只在离镜头近、雾薄的地方隐约看得见一点影子。
//  没有谜题，是一段走过去的路：一道半截泡在雾里的矮石墙要跳过去；洼地里雾深一些，长草也只露出个尖；一棵枯树；坡顶是路的尽头。
//  雾（mdMist）：贴着地面一层层叠起来的半透明薄片，跟着地形起伏。每一片有多浓，按“视线在这一层里走了多远”算 ——
//    镜头底下往下看，视线很快穿过去，雾是薄的；往远处看，视线贴着雾面走好长一段，雾就浓得看不透。雾顶照着一张噪声图高高低低、慢慢飘，人走过去搅开一点。
//    远处的布景板（树、山）也在雾里：透明的东西不写深度，只能靠先后次序，所以雾按深度切成三段，和布景板一段隔一段地画。
//  草（mdBlade）：一根根细长的叶子、带穗的草茎（叶面总朝着镜头，从侧面看就是一笔弯线），跟着风摆，人走过去往两边让。
//  章节号是 HN(HLAST) + 1；从铃那一章的门到这里的路在 src/69-zz-links.js
// ============================================================
const MD_A = hX(HLAST) + HLEN[HLAST] + 4;                 // 铃那一章的地面到这里为止：往右是白茫茫的一段路（69-zz-links.js 的 link）
const XM = MD_A + 56;                                      // 这一章的原点
const MD_N = HN(HLAST) + 1;                                // 第 37 章

// ---- 一张能平铺的噪声图：r 是大的起伏，g 是小的，b 是中等的一团团（雾顶的高低、浓淡照它慢慢飘）----
const MD_NOISE = (() => {
  const S = 128, data = new Uint8Array(S * S * 4);
  const lattice = (seed, n) => { const a = new Float32Array(n * n); let s = seed; for (let i = 0; i < n * n; i++) { s = (s * 16807) % 2147483647; a[i] = s / 2147483647; } return a; };
  const at = (L, n, x, y) => {                             // 能平铺的值噪声：格点在 n × n 上绕回来
    const fx = x * n, fy = y * n, ix = Math.floor(fx), iy = Math.floor(fy), tx = fx - ix, ty = fy - iy, u = tx * tx * (3 - 2 * tx), v = ty * ty * (3 - 2 * ty);
    const g = (i, j) => L[(j % n) * n + (i % n)];
    return lerp(lerp(g(ix, iy), g(ix + 1, iy), u), lerp(g(ix, iy + 1), g(ix + 1, iy + 1), u), v);
  };
  const fbm = (octs, x, y) => { let s = 0, t = 0, w = 0.5; for (const [n, L] of octs) { s += w * at(L, n, x, y); t += w; w *= 0.5; } return s / t; };
  const A = [4, 8, 16, 32].map((n, i) => [n, lattice(101 + i * 7, n)]), B = [8, 16, 32].map((n, i) => [n, lattice(503 + i * 11, n)]), Cc = [12, 24, 48].map((n, i) => [n, lattice(907 + i * 13, n)]);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const i = (y * S + x) * 4; data[i] = fbm(A, x / S, y / S) * 255; data[i + 1] = fbm(B, x / S, y / S) * 255; data[i + 2] = fbm(Cc, x / S, y / S) * 255; data[i + 3] = 255; }
  const t = new THREE.DataTexture(data, S, S); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true; t.colorSpace = THREE.NoColorSpace; t.needsUpdate = true;
  return sharedTex(t);
})();

// ---- 雾：贴着地面一层层叠起来的薄片 ----
// 每一片在一根竖线上占 dh 那么厚；视线往下斜得越平，在这一片里走得越远：不透明度 = 1 - exp(-浓度 × dh / 视线往下斜的正弦)。
// 每个顶点带 aM：x 这一层离地是雾顶的几倍，y 这里的雾顶有多高（米，洼地里高、坡顶上低）。雾顶再照噪声图在 0.78 到 1.28 倍之间起伏
const MD_TOPK = 1.35;                                      // 最上面一层离地是雾顶的几倍（雾顶最高到 1.28 倍，上面留一点空）
const MD_MIST_U = { uN: { value: MD_NOISE }, uT: { value: 0 }, uD: { value: 0.62 }, uDh: { value: 0.1 }, uC: { value: new THREE.Color() }, uC2: { value: new THREE.Color() },
  uFogC: { value: new THREE.Color() }, uFogD: { value: 0 }, uFogK: { value: 0.85 }, uMoon: { value: new THREE.Vector2(-0.3, -1).normalize() }, uX: { value: new THREE.Vector4() },
  uW: { value: [0, 1, 2].map(() => new THREE.Vector4(0, 0, 1, 0)) } };
function mdMistMat() {
  const m = new THREE.ShaderMaterial({ uniforms: MD_MIST_U, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: `attribute vec2 aM; varying vec3 vW; varying vec2 vM;
      void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vM = aM; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `
      uniform sampler2D uN; uniform float uT, uD, uDh, uFogD, uFogK; uniform vec3 uC, uC2, uFogC; uniform vec2 uMoon; uniform vec4 uX, uW[3];
      varying vec3 vW; varying vec2 vM;
      void main() {
        vec3 V = vW - cameraPosition; float dist = length(V); vec3 v = V / dist;
        vec2 p = vW.xz;
        vec4 t1 = texture2D(uN, p * 0.021 + vec2(uT * 0.0021, uT * 0.0008));     // r：雾顶大的起伏 / b：一团一团浓的、淡的
        float n2 = texture2D(uN, p * 0.083 + vec2(-uT * 0.0055, uT * 0.0021)).g, n3 = t1.b;
        float n = 0.7 * smoothstep(0.3, 0.7, t1.r) + 0.3 * smoothstep(0.25, 0.75, n2);
        float top = vM.y * (0.78 + 0.5 * n), r = vM.x * vM.y / top;              // r：这一层在这一点的雾里有多高（1 = 雾顶）
        float dens = uD * (0.5 + 1.0 * smoothstep(0.3, 0.72, n3)) * (smoothstep(1.0, 0.45, r) * (1.25 - 0.5 * r) + 0.06 * smoothstep(1.3, 1.0, r));   // 雾顶软软的没有边，越往下越浓；雾顶上面还飘着薄薄一层
        for (int i = 0; i < 3; i++) { vec2 d = p - uW[i].xy; dens *= 1.0 - uW[i].w * exp(-dot(d, d) / uW[i].z); }   // 人走过去搅开一点
        float a = 1.0 - exp(-dens * uDh * vM.y / max(-v.y, 0.03));
        a *= smoothstep(uX.x, uX.y, vW.x) * (1.0 - smoothstep(uX.z, uX.w, vW.x)) * smoothstep(-166.0, -120.0, vW.z);   // 两头、最远处淡掉
        if (a < 0.003) discard;
        float fw = pow(max(dot(normalize(v.xz), uMoon), 0.0), 8.0);              // 朝着月亮那一边的雾亮一些
        vec3 col = uC * (0.78 + 0.36 * clamp(r, 0.0, 1.0)) + uC2 * fw;
        col = mix(col, uFogC, (1.0 - exp(-uFogD * uFogD * dist * dist)) * uFogK);
        gl_FragColor = vec4(col, a);
        #include <colorspace_fragment>
      }` });
  m.userData.own = true; return m;
}
// 一段雾（z1..z2 那么宽），N 层，从下往上排：同一次绘制里先画的在底下，镜头总在雾上面，所以正好是从远到近
function mdMistSlab(R, mat, xs, Hm, z1, z2, N, order) {
  const pos = [], am = [], idx = [];
  for (let i = 0; i < N; i++) {
    const f = (i + 0.5) / N * MD_TOPK, b = pos.length / 3;
    for (const x of xs) { const hm = Hm(x), y = groundY(x) + f * hm; pos.push(x, y, z1, x, y, z2); am.push(f, hm, f, hm); }
    for (let j = 0; j < xs.length - 1; j++) { const a = b + j * 2; idx.push(a, a + 1, a + 2, a + 2, a + 1, a + 3); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aM', new THREE.Float32BufferAttribute(am, 2));
  g.setIndex(idx); g.computeBoundingSphere();
  const m = new THREE.Mesh(g, mat); m.renderOrder = order; R.add(m); return m;
}

// ---- 草：一根根的叶子和草茎，合成几个网格 ----
// aB：根的 x、z，这一点离根多远（米，顺着叶子量），摆动的相位。风：越往梢摆得越多；人：根离人不到 0.7 米的往外让、往下压一点（人跳起来就不让了）
const MD_GRASS_U = { uT: { value: 0 }, uWind: { value: 1 }, uPl: { value: V3(0, 9, 0) } };
function mdGrassMat() {
  const m = new THREE.MeshLambertMaterial({ vertexColors: true });
  m.onBeforeCompile = sh => {
    for (const k in MD_GRASS_U) sh.uniforms[k] = MD_GRASS_U[k];
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec4 aB;\nuniform float uT, uWind;\nuniform vec3 uPl;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        float s2 = aB.z * aB.z, ph = uT * 1.35 + aB.x * 0.31 + aB.y * 0.17 + aB.w;
        transformed.x += s2 * uWind * (0.07 * sin(ph) + 0.03 * sin(ph * 2.7 + 1.3) + 0.04);
        transformed.z += s2 * uWind * 0.035 * sin(ph * 0.73 + 2.1);
        vec2 dp = aB.xy - uPl.xz; float dl = length(dp), pk = smoothstep(0.7, 0.12, dl) * (1.0 - smoothstep(0.35, 0.9, uPl.y));
        transformed.xz += dp / max(dl, 0.05) * pk * s2 * 0.6; transformed.y -= pk * s2 * 0.3;`);
  };
  m.customProgramCacheKey = () => 'meadow-grass-1';
  m.userData.own = true; return m;
}
// 往草的顶点表 B（{ p, c, b, i }）里加一根：根在 (x, y, z)，长 L，根部宽 w；ang 往哪边歪（弧度，0 是 +x）；a0 根部斜多少、bend 一路弯过去多少（弧度）；c0 / c1 根和梢的颜色。
// 宽的方向在画面平面里、垂直于叶子的走向：叶面总朝着镜头（只画正面），侧面看过去是一笔细细的弯线。返回梢的位置和方向（草穗接着长）
const _mdA = new THREE.Color(), _mdB = new THREE.Color();
function mdBlade(B, x, y, z, L, w, ang, a0, bend, c0, c1, o = {}) {
  const K = o.k ?? 5, ph = o.ph ?? 0, dx = Math.cos(ang), dz = Math.sin(ang), st = L / K, b0 = B.p.length / 3, rx = o.rx ?? x, rz = o.rz ?? z;
  _mdA.set(c0); _mdB.set(c1);
  let u = 0, v = 0, th = a0;
  for (let i = 0; i <= K; i++) {
    const s = i / K, tx = Math.sin(th) * dx, ty = Math.cos(th);
    const wl = Math.hypot(ty, tx) || 1, wx = ty / wl, wy = -tx / wl;
    const hw = (o.prof ? o.prof(s) : Math.pow(1 - s, o.wp ?? 0.8)) * w / 2, cx = x + u * dx, cy = y + v, cz = z + u * dz;
    B.p.push(cx - wx * hw, cy - wy * hw, cz, cx + wx * hw, cy + wy * hw, cz);
    const r = lerp(_mdA.r, _mdB.r, s), g = lerp(_mdA.g, _mdB.g, s), b = lerp(_mdA.b, _mdB.b, s), sm = (o.s0 ?? 0) + s * L;
    B.c.push(r, g, b, r, g, b); B.b.push(rx, rz, sm, ph, rx, rz, sm, ph);
    if (i > 0) { const a = b0 + (i - 1) * 2; B.i.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    if (i < K) { u += Math.sin(th) * st; v += Math.cos(th) * st; th = Math.min(1.35, th + bend / K * (0.5 + 1.5 * s)); }   // 越往梢弯得越厉害；最多弯到快平着
  }
  return [x + u * dx, y + v, z + u * dz, th];
}
function mdGrassMesh(R, B, mat) {
  const g = new THREE.BufferGeometry(), n = B.p.length / 3, nrm = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) nrm.set([0, 0.8, 0.6], i * 3);                                   // 法线朝上偏一点朝镜头：明暗和地面差不多
  g.setAttribute('position', new THREE.Float32BufferAttribute(B.p, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(B.c, 3)); g.setAttribute('aB', new THREE.Float32BufferAttribute(B.b, 4));
  g.setIndex(B.i); g.computeBoundingSphere();
  const m = new THREE.Mesh(g, mat); R.add(m); return m;
}
const mdHash = (a, b) => { const t = Math.sin(a * 127.1 + b * 311.7 + 7.7) * 43758.5453; return t - Math.floor(t); };
const mdVN = (x, z) => { const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz, u = fx * fx * (3 - 2 * fx), w = fz * fz * (3 - 2 * fz);
  return lerp(lerp(mdHash(ix, iz), mdHash(ix + 1, iz), u), lerp(mdHash(ix, iz + 1), mdHash(ix + 1, iz + 1), u), w); };

// ---- 干砌的矮石墙：一层层大大小小的石块，顶上一溜竖着、歪着的压顶石。横穿草地，一头伸到镜头跟前，一头伸进远处的雾里（远处塌了几段）----
// 每块石头是一个捏扁、捏歪了的二十面体（一面一面的，和别处的石头一个样子），合成一个网格
function mdStoneWall(R, x, z1, z2, mat) {
  const pos = [], nrm = [], col = [], M = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), c = new THREE.Color();
  const base = new THREE.IcosahedronGeometry(0.5, 0), bp = base.attributes.position;
  const put = (cx, cy, cz, sx, sy, sz, ry, rz, hex, seed) => {
    const g = base.clone(), p = g.attributes.position;
    const h = (a, b, cc) => { const t = Math.sin(Math.round(a * 400) * 12.9898 + Math.round(b * 400) * 78.233 + Math.round(cc * 400) * 37.719 + seed) * 43758.5453; return t - Math.floor(t); };
    for (let i = 0; i < p.count; i++) { const vx = bp.getX(i), vy = bp.getY(i), vz = bp.getZ(i), k = 0.82 + 0.36 * h(vx, vy, vz); p.setXYZ(i, vx * k * sx, Math.max(-0.42, Math.min(0.42, vy * k)) * sy, vz * k * sz); }   // 上下压平一点：码得住
    g.computeVertexNormals(); g.applyMatrix4(M.compose(V3(cx, cy, cz), q.setFromEuler(e.set(0, ry, rz)), V3(1, 1, 1)));
    const pa = g.attributes.position.array, na = g.attributes.normal.array; c.set(hex).multiplyScalar(0.85 + 0.3 * h(seed, 1, 2));
    for (let i = 0; i < pa.length; i += 3) { pos.push(pa[i], pa[i + 1], pa[i + 2]); nrm.push(na[i], na[i + 1], na[i + 2]); col.push(c.r, c.g, c.b); }
    g.dispose();
  };
  const stone = [0x5d605c, 0x6b6c66, 0x52564f, 0x75766f, 0x63665e], moss = 0x48503c, y0 = groundY(x) - 0.08;
  let seed = 1;
  for (let z = z1; z < z2;) {
    const len = rr(0.9, 2.4), broken = z < -26 && mdVN(z * 0.12, 9.3) > 0.62, lift = rr(-0.06, 0.06);   // 远处几段塌了：只剩底下一两层
    for (let zz = z; zz < Math.min(z2, z + len);) {
      const courses = broken ? (rnd() < 0.5 ? 1 : 2) : 3, lz = rr(0.3, 0.62);
      let y = y0;
      for (let k = 0; k < courses; k++) {
        const hy = rr(0.2, 0.3), th = lerp(0.66, 0.48, k / 2) * rr(0.88, 1.05), l = lz * rr(0.8, 1.15);
        put(x + rr(-0.04, 0.04), y + hy * 0.42, zz + l / 2 + rr(-0.05, 0.05), th, hy, l, rr(-0.15, 0.15), rr(-0.08, 0.08), k === courses - 1 && rnd() < 0.25 ? moss : pick(stone), seed++);
        y += hy * 0.78;
      }
      if (!broken) for (let zc = zz; zc < zz + lz; zc += rr(0.16, 0.26)) {                     // 压顶石：竖着、斜着靠在一起
        const hy = rr(0.2, 0.32) + lift, l = rr(0.12, 0.2);
        put(x + rr(-0.03, 0.03), y + hy * 0.36, zc + l / 2, rr(0.36, 0.46), hy, l, rr(-0.2, 0.2), rr(-0.25, 0.25), rnd() < 0.3 ? moss : pick(stone), seed++);
      }
      zz += lz * rr(0.85, 1.0);
    }
    z += len;
  }
  base.dispose();
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.computeBoundingSphere();
  const m = new THREE.Mesh(g, mat); m.castShadow = m.receiveShadow = true; R.add(m); return m;
}

const MEADOW = (() => {
  const X = XM, A = MD_A, END = X + 130;
  const C = chapter({ n: MD_N, x0: X - 8, start: X + 2, name: '草地', sub: '雾贴着地', ground: 'grass', grp: 'out', nocat: true });
  // 地形：缓缓的起伏 —— 一道矮石墙（X + 36），一处洼地（X + 70 一带，雾在这里深一些），往右慢慢上到坡顶（X + 118 起），坡顶就是路的尽头
  terrain([X - 8, 0], [X + 6, 0.05], [X + 18, 0.32], [X + 30, 0.42], [X + 42, 0.3], [X + 52, 0], [X + 61, -0.62], [X + 70, -0.9], [X + 79, -0.68], [X + 90, -0.05],
    [X + 104, 0.62], [X + 118, 1.12], [X + 128, 1.2], [X + 146, 0.95], [X + 190, 0.4], [X + 240, 0.2]);
  ground(X - 8, 0x1b2420); ground(X + 60, 0x18211d); ground(X + 120, 0x1d2520); ground(X + 240, 0x1b2420);
  const WX = X + 36, WALL = solid({ id: 'mdWall', x1: WX - 0.3, x2: WX + 0.3, y1: groundY(WX) - 0.05, y2: groundY(WX) + 0.8, snd: 'concrete' });
  solid({ x1: END, x2: END + 1, y1: -30, y2: 40, noclimb: true });          // 整条路的尽头（空气墙）：坡顶往前是一大片雾
  checkpoint(X + 2); checkpoint(WX + 3); checkpoint(X + 96);
  camKeys([X - 8, 16.5, 1.7, 1.0], [X + 30, 17, 1.65, 1.3], [X + 66, 18, 1.55, 1.4], [X + 100, 17.5, 1.6, 1.3], [X + 124, 19.5, 1.5, 2.6]);
  // 夜：月亮在左上方（天上那一团光就是 sun*），月光从身后斜着照过来；天边一道发灰的亮（远处的雾）。蟋蟀叫成一片，远处一只猫头鹰
  const NIGHT = { fog: 0x2e3a4a, fogD: 0.0055, hemiS: 0x7a8ca6, hemiG: 0x141a20, hemiI: 0.8, keyC: 0xc4d2e8, keyI: 1.05, keyDir: [-0.45, 0.72, -0.55], rimC: 0x9fb4d4, rimI: 0.6,
    dustC: 0xc0cede, dustO: 0.12, wind: 0.08, ext: 1, sky: [0x070b14, 0x0c1320, 0x141d2c, 0x1f2a3b, 0x334052, 0x2a3646], sunX: -0.33, sunY: 0.16, sunC: 0xdbe4f0, sunP: 0.55,
    stars: 0.75, cloud: 0.1, cloudC: 0x34404f, birds: 0, flies: 0.25, vig: 1.15,
    aWind: 0.3, aWhis: 0, aLeaf: 0.12, leafDry: 0.3, aBug: 0.9, aDrip: 0, aFlow: 0, aRoom: 0, roomF: 210, aHum: 0, aCity: 0, aFar: 0.45, rvOut: 1, rvHall: 0, rvCave: 0 };
  env(X - 8, NIGHT, true); env(END + 60, NIGHT);
  BIRDS[MD_N] = [['bird', 0]]; FAR[MD_N] = ['owl', 'twig', 'owl'];
  // 雾顶有多高（米）：平常齐膝，洼地里深，坡顶上浅
  const Hm = x => 0.42 + 0.42 * sstep(X + 50, X + 62, x) * sstep(X + 88, X + 77, x) - 0.08 * sstep(X + 104, X + 118, x);
  const MX1 = A - 2, MX2 = END + 70;                                         // 雾铺到哪：从铃那一章的门外（白光里）一直到坡顶外面
  const NIGHT_MIST = new THREE.Color(0x8a9ab0), FWD = new THREE.Color(0x1c2633), _c = new THREE.Color();

  let V = null;
  function* build(R) {
    const v = {}, LOW = (typeof touchMode !== 'undefined' && touchMode) || new URLSearchParams(location.search).get('low') === '1';   // 手机上雾少几层、草少一些
    // ---- 远山：两道矮山，越远越淡；山脚泡在雾气里 ----
    backdrop(A - 60, X + 260, -10, 40, -170, 6, g => {
      setInk(g, '#202a38'); ridge(g, A - 60, X + 260, -10, x => 9 + 4.5 * Math.sin(x * 0.013 + 1) + 2.4 * Math.sin(x * 0.041) + 0.8 * Math.sin(x * 0.13), 1);
      setInk(g, '#18202c'); ridge(g, A - 60, X + 260, -10, x => 3.5 + 2.2 * Math.sin(x * 0.024 + 2) + 1.1 * Math.sin(x * 0.07 + 0.5), 1);
      g.fillStyle = vgrad(g, 5, -1, 'rgba(118,136,160,0)', 'rgba(118,136,160,0.6)'); box(g, A - 60, -10, X + 320 - A, 15);
    }, { fadeL: 40, fadeR: 40 });
    yield;
    // ---- 远处的一溜树篱和几棵树：树脚淡成雾的颜色 ----
    backdrop(A - 20, X + 185, -2, 18, -90, 10, g => {
      setInk(g, '#111720');
      for (let x = A - 18; x < X + 183; x += rr(0.8, 1.8)) if (mdVN(x * 0.045, 3.1) > 0.45) disc(g, x, rr(0.3, 0.9), rr(0.8, 1.6));
      for (let x = A - 12; x < X + 180; x += rr(9, 26)) tree(g, x, 0, rr(6, 12), pick(['round', 'round', 'pine', 'dead']));
      g.fillStyle = vgrad(g, 2.4, -0.5, 'rgba(140,156,178,0)', 'rgba(140,156,178,0.85)'); box(g, A - 20, -2, X + 205 - A, 4.4);
    }, { fadeL: 20, fadeR: 20 });
    yield;
    // ---- 雾：三段，夹在两块布景板中间（远山 z = -170 → 远雾 → 树篱 z = -90 → 中间的雾 → 近处的雾）----
    {
      const N = LOW ? 6 : 10, xs = [];          // 层数：多了雾里的东西（桩子、腿）上看不出一道道的台阶，少了省力（每一层都要把大半个画面画一遍）
      for (let x = MX1; x < MX2; x += 0.6) xs.push(x);
      for (const [tx] of TERRAIN) if (tx > MX1 && tx < MX2) xs.push(tx);
      xs.push(MX2); xs.sort((p, q) => p - q);
      const mat = mdMistMat();
      MD_MIST_U.uDh.value = MD_TOPK / N; MD_MIST_U.uX.value.set(MX1, MX1 + 12, MX2 - 30, MX2);
      v.mist = [mdMistSlab(R, mat, xs, Hm, -168, -90, N, -500), mdMistSlab(R, mat, xs, Hm, -90, -40, N, -300), mdMistSlab(R, mat, xs, Hm, -40, 13, N, -100)];
    }
    yield;
    // ---- 草：长的稀稀拉拉，一小片一小片；矮的藏在雾里 ----
    const GR0 = 0x18211a, GR1 = 0x5a6a5b, DRY0 = 0x24251a, DRY1 = 0x857f62, ST0 = 0x262d22, ST1 = 0x6e705a, HD0 = 0x8a8468, HD1 = 0xa9a184, SH0 = 0x141b15, SH1 = 0x34402f;
    const gmat = mdGrassMat(), K = LOW ? 0.6 : 1;
    const tallD = z => (z > 1.2 ? 0.15 : z > -1.2 ? 0.09 : z > -12 ? 0.13 : z > -35 ? 0.07 : 0.035) * K;
    const patch = (x, z) => 0.25 + 1.5 * sstep(0.3, 0.75, mdVN(x * 0.18, z * 0.25));
    const clear = (x, z) => Math.abs(x - WX) < 0.55 || (Math.abs(x - (X + 71)) < 0.6 && Math.abs(z + 15) < 0.6);   // 石墙里、树干上不长
    const side = () => (rnd() < 0.5 ? 0 : Math.PI) + rr(-0.6, 0.6);
    for (let c0 = A + 4; c0 < END + 40; c0 += 40) {
      const B = { p: [], c: [], b: [], i: [] }, c1 = Math.min(END + 40, c0 + 40);
      for (const [z1, z2] of [[1.2, 9], [-1.2, 1.2], [-12, -1.2], [-35, -12], [-80, -35]]) {
        const dm = tallD((z1 + z2) / 2), n = Math.round((c1 - c0) * (z2 - z1) * dm * 1.6);
        for (let k = 0; k < n; k++) {
          const x = rr(c0, c1), z = rr(z1, z2);
          if (rnd() > patch(x, z) / 1.6 * (x < A + 16 ? sstep(A + 4, A + 16, x) : 1) || clear(x, z)) continue;
          const y = groundY(x) - 0.02, ph = rr(0, 6.28);
          if (rnd() < 0.22) {                                                          // 带穗的草茎：一两根
            for (let j = 0, m = rnd() < 0.6 ? 1 : 2; j < m; j++) {
              const L = rr(0.72, 1.12), ang = side(), xr = x + rr(-0.04, 0.04), zr = z + rr(-0.04, 0.04);
              const tip = mdBlade(B, xr, y, zr, L, rr(0.008, 0.011), ang, rr(-0.06, 0.12), rr(0.05, 0.35), ST0, ST1, { k: 5, wp: 0.3, ph });
              mdBlade(B, tip[0], tip[1], tip[2], rr(0.07, 0.13), rr(0.02, 0.028), ang, tip[3], rr(0, 0.15), HD0, HD1, { k: 3, prof: s => Math.sin(Math.PI * (0.08 + 0.84 * s)), s0: L, rx: xr, rz: zr, ph });
            }
          } else {                                                                     // 一根到四五根叶子从同一个地方长出来
            const m = 1 + Math.floor(Math.pow(rnd(), 1.6) * 4.5), L0 = 0.42 + 0.62 * Math.pow(rnd(), 0.9), dry = rnd() < 0.3;
            for (let j = 0; j < m; j++) mdBlade(B, x + rr(-0.03, 0.03), y, z + rr(-0.03, 0.03), L0 * rr(0.62, 1), rr(0.016, 0.03), side(), rr(0.02, 0.28), rr(0.1, 0.9),
              dry ? DRY0 : GR0, dry ? DRY1 : GR1, { k: 5, ph: ph + j * 0.4 });
          }
        }
      }
      // 矮草：一丛丛不到膝盖高，都没在雾里（只在镜头跟前、雾薄的地方隐约看得见）
      for (let k = 0, n = Math.round((c1 - c0) * 22 * 0.15 * K); k < n; k++) {
        const x = rr(c0, c1), z = rr(-14, 8.5); if (clear(x, z)) continue;
        const y = groundY(x) - 0.01, L0 = rr(0.1, 0.25), ph = rr(0, 6.28);
        for (let j = 0, m = 3 + Math.floor(rnd() * 4); j < m; j++) mdBlade(B, x + rr(-0.05, 0.05), y, z + rr(-0.05, 0.05), L0 * rr(0.6, 1), rr(0.012, 0.02), rr(0, 6.28), rr(0.05, 0.4), rr(0.2, 0.8), SH0, SH1, { k: 3, ph });
      }
      mdGrassMesh(R, B, gmat);
      yield;
    }
    // ---- 矮石墙 ----
    { const m = lam(0xffffff, { vertexColors: true }); m.userData.own = true; mdStoneWall(R, WX, -62, 7.5, m); }
    yield;
    // ---- 一棵枯树（洼地里）、两道旧栅栏、几块石头 ----
    {
      const T3 = { p: [], n: [] };
      deadTree(T3, X + 71, groundY(X + 71) - 0.2, -15, 6.4, { thick: 0.9, branch: 1.8 });
      deadTree(T3, X + 142, groundY(X + 142) - 0.2, -26, 6.0);
      const tm = lam(0x1d2024); tm.userData.own = true;
      const t = new THREE.Mesh(mergedGeo(T3), tm); t.castShadow = true; R.add(t);
      const wood = lam(0x3a332b), wire = lam(0x3c4044); wood.userData.own = true; wire.userData.own = true;
      const post = (x, z, h = 1.1) => { const p = add(R, bx(0.09, h, 0.09), wood, x, groundY(x) + h / 2 - 0.12, z); p.rotation.z = rr(-0.12, 0.12); p.rotation.x = rr(-0.08, 0.08); return p; };
      // 路后面一道旧栅栏：木桩、两道下垂的铁丝，有几根桩没了、铁丝断了
      let px = null;
      for (let x = X + 3; x < WX - 1; x += rr(2.6, 3.2)) {
        if (rnd() < 0.15) { px = null; continue; }
        post(x, -3.4);
        if (px !== null && rnd() < 0.85) for (const h of [0.55, 0.85]) tube(R, [[px, groundY(px) + h, -3.4], [(px + x) / 2, (groundY(px) + groundY(x)) / 2 + h - 0.12, -3.4], [x, groundY(x) + h, -3.4]], 0.005, wire, 8);
        px = x;
      }
      // 坡上一排木桩斜着往远处去，一根比一根没在雾里深
      for (let k = 0; k < 24; k++) { const t2 = k / 23, x = lerp(X + 98, X + 128, t2), z = lerp(-2.6, -75, t2); if (rnd() < 0.15) continue; post(x + rr(-0.2, 0.2), z, rr(1.0, 1.25)); }
      for (const [x, z, s] of [[X + 12, -5.5, 0.5], [X + 48, -7, 0.6], [X + 84, -4.5, 0.45], [X + 110, -9, 0.7]]) rock(R, x, z, s, { moss: 0.25, col: 0x5c605c, sink: 0.45 });   // 几块石头，大半没在雾里
    }
    yield;
    V = v;
  }

  // 人走过去搅开的那一点雾：腿边一圈，身后留两团慢慢合上
  const trail = [{ x: 0, z: 0, t: -99 }, { x: 0, z: 0, t: -99 }]; let trailT = 0;
  function update(dt) {
    const U = MD_MIST_U, dense = sstep(0.025, 0.08, E.fogD);              // dense：还在门外那一片白里（雾色本身就是白的）
    U.uT.value = T; U.uFogC.value.copy(scene.fog.color); U.uFogD.value = scene.fog.density; U.uFogK.value = lerp(0.85, 1, dense);
    U.uC.value.copy(NIGHT_MIST).lerp(_c.copy(scene.fog.color), dense); U.uC2.value.copy(FWD).multiplyScalar(1 - dense);
    U.uMoon.value.set(E.sunX, -1).normalize();
    const pz = pathZ(P.x) + (P.zo ?? 0), inMist = P.y - groundY(P.x) < 0.5 ? 1 : 0;
    trailT += dt; if (P.grounded && Math.abs(P.vx) > 0.4 && trailT > 0.35) { trailT = 0; trail.unshift({ x: P.x, z: pz, t: T }); trail.length = 2; }
    U.uW.value[0].set(P.x, pz, 0.1, 0.3 * inMist);
    for (let i = 0; i < 2; i++) { const age = T - trail[i].t; U.uW.value[i + 1].set(trail[i].x, trail[i].z, 0.1 + 0.25 * age, 0.45 * Math.exp(-age / 1.3)); }
    MD_GRASS_U.uT.value = T; MD_GRASS_U.uWind.value = 0.55 + 0.5 * GUST.v; MD_GRASS_U.uPl.value.set(P.x, P.y - groundY(P.x), pz);
  }
  return defZone({ n: MD_N, vis: [A - 2, END + 40], build, update, reset() {}, solve() {}, unbuild() { V = null; }, WALL, Hm, END });
})();
