// 夜搜专用造型。真实几何接受场景灯光；不把概念图当作背景或游戏画面。
// o.lit(材质) / o.basic(材质)：章节给受光的材质、不受光的材质（旋翼）套上自己的着色（雾里的剪影：见 69-ch11-heli.js 的 shade11 / haze11）
function searchAircraft(parent, detail = true, o_ = {}) {
  const own = m => { m.userData.own = true; return m; }, L = m => (o_.lit ? o_.lit(own(m)) : own(m)), B = m => (o_.basic ? o_.basic(own(m)) : own(m));
  const metal = L(new THREE.MeshStandardMaterial({ color: 0x5c6164, roughness: 0.58, metalness: 0.18 }));
  const dark = L(new THREE.MeshStandardMaterial({ color: 0x2a2e31, roughness: 0.7, metalness: 0.12 }));
  const edge = L(new THREE.MeshStandardMaterial({ color: 0x868b8e, roughness: 0.46, metalness: 0.25 }));
  const glass = L(new THREE.MeshStandardMaterial({ color: 0x1b2023, roughness: 0.22, metalness: 0.25, emissive: 0x20262a, emissiveIntensity: 0.38, side: THREE.DoubleSide }));
  const o = {}, heli = grp(parent), tilt = grp(heli);
  const body = [[-2.05, 0.2, 0.2, 0.22], [-1.55, 0.06, 0.55, 0.57], [-0.85, 0.02, 0.74, 0.8],
    [0.25, 0.02, 0.8, 0.84], [1.05, -0.02, 0.76, 0.79], [1.65, -0.12, 0.62, 0.66], [2.2, -0.28, 0.37, 0.43], [2.5, -0.34, 0.09, 0.12], [2.54, -0.34, 0.005, 0.005]];
  const at = (x, a, offset = 0) => {
    let i = 1; while (i < body.length - 1 && x > body[i][0]) i++;
    const b = body[i - 1], c = body[i], t = clamp((x - b[0]) / (c[0] - b[0]), 0, 1);
    return [x, lerp(b[1], c[1], t) + Math.cos(a) * (lerp(b[2], c[2], t) + offset), Math.sin(a) * (lerp(b[3], c[3], t) + offset)];
  };
  const skin = (rows, mat) => {
    const p = [], uv = [], ix = [], N = 32;
    rows.forEach(([x, y, ry, rz], j) => {
      for (let i = 0; i <= N; i++) { const a = i / N * Math.PI * 2; p.push(x, y + Math.cos(a) * ry, Math.sin(a) * rz); uv.push(j / (rows.length - 1), i / N); }
    });
    for (let j = 1; j < rows.length; j++) for (let i = 0; i < N; i++) { const a = (j - 1) * (N + 1) + i, b = a + N + 1; ix.push(a, a + 1, b, a + 1, b + 1, b); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(ix); g.computeVertexNormals();
    return add(tilt, g, mat, 0, 0, 0, false);
  };
  skin(body, metal);
  skin([[-7.0, 0.9, 0.065, 0.065], [-6.3, 0.8, 0.11, 0.1], [-4.2, 0.49, 0.2, 0.18], [-1.7, 0.16, 0.31, 0.3]], metal);
  // 座舱玻璃贴着机身的曲面，用窗框分出前窗和舱门，避免黑色球形鼻子。
  const pane = (x0, x1, a0, a1) => {
    const p = [], ix = [], nx = 5, na = 5;
    for (let x = 0; x <= nx; x++) for (let a = 0; a <= na; a++) p.push(...at(lerp(x0, x1, x / nx), lerp(a0, a1, a / na), 0.015));
    for (let x = 0; x < nx; x++) for (let a = 0; a < na; a++) { const i = x * (na + 1) + a; ix.push(i, i + 1, i + na + 1, i + 1, i + na + 2, i + na + 1); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); geo.setIndex(ix); geo.computeVertexNormals(); add(tilt, geo, glass, 0, 0, 0, false);
    if (detail) {
      const pts = [];
      for (let k = 0; k <= 5; k++) pts.push(at(lerp(x0, x1, k / 5), a0, 0.035));
      for (let k = 1; k <= 5; k++) pts.push(at(x1, lerp(a0, a1, k / 5), 0.035));
      for (let k = 1; k <= 5; k++) pts.push(at(lerp(x1, x0, k / 5), a1, 0.035));
      for (let k = 1; k <= 5; k++) pts.push(at(x0, lerp(a1, a0, k / 5), 0.035));
      tube(tilt, pts, 0.024, edge, 36);
    }
  };
  for (const s of [-1, 1]) {
    pane(1.13, 2.12, s * 0.47, s * 1.49);
    pane(0.3, 1.02, s * 0.63, s * 1.66);
    pane(-0.95, 0.15, s * 0.73, s * 1.68);
    if (detail) {
      const seam = [];
      for (let k = 0; k <= 10; k++) seam.push(at(lerp(-1.1, 0.2, k / 10), s * 2.22, 0.025));
      seam.push(at(0.2, s * 1.7, 0.025)); tube(tilt, seam, 0.012, dark, 20);
      const handle = at(-0.75, s * 1.94, 0.04); add(tilt, bx(0.17, 0.028, 0.035), edge, ...handle, false);
      for (let k = 0; k < 12; k++) {
        const q = at(-1.3 + k * 0.25, s * 2.0, 0.022); add(tilt, new THREE.SphereGeometry(0.014, 5, 3), edge, ...q, false);
      }
    }
    // 发动机整流罩、排气管和散热格栅。
    add(tilt, new THREE.SphereGeometry(1, 16, 10), metal, -0.5, 0.86, s * 0.38, false).scale.set(1.14, 0.29, 0.27);
    add(tilt, cy(0.12, 0.14, 0.48, 12, 1, true), dark, -1.45, 0.87, s * 0.4, false).rotation.z = Math.PI / 2;
    if (detail) for (let k = 0; k < 7; k++) add(tilt, bx(0.025, 0.16, 0.025), dark, -0.8 + k * 0.075, 0.94, s * 0.63, false).rotation.z = -0.3;
    const skid = [[-1.3, -1.07, s * 0.9], [-0.9, -1.22, s * 0.95], [1.65, -1.22, s * 0.95], [2.0, -1.13, s * 0.95], [2.15, -0.99, s * 0.92]];
    tube(tilt, skid, 0.045, edge, 24);
    for (const x of [-0.6, 1.1]) tube(tilt, [[x, -0.48, s * 0.57], [x - 0.14, -0.99, s * 0.83], [x - 0.12, -1.2, s * 0.95]], 0.038, dark, 12);
  }
  const fin = new THREE.Shape(); fin.moveTo(-6.75, 0.72); fin.lineTo(-7.1, 2.1); fin.lineTo(-7.47, 2.23); fin.lineTo(-7.23, 0.66); fin.lineTo(-7.35, 0.12); fin.lineTo(-6.92, 0.19); fin.closePath();
  add(tilt, new THREE.ExtrudeGeometry(fin, { depth: 0.075, bevelEnabled: true, bevelSegments: 1, steps: 1, bevelSize: 0.025, bevelThickness: 0.02 }), metal, 0, 0, -0.0375, false);
  add(tilt, bx(0.7, 0.045, 1.8), metal, -5.9, 0.64, 0, false).rotation.z = 0.08;
  add(tilt, cy(0.065, 0.09, 0.55, 12), edge, -0.15, 1.3, 0, false);
  add(tilt, new THREE.SphereGeometry(0.18, 12, 8), dark, -0.15, 1.54, 0, false).scale.y = 0.5;
  const blade = B(new THREE.MeshBasicMaterial({ color: 0x1b1e20, transparent: true, opacity: 0.7, depthWrite: false }));
  const [rotorCanvas, rg] = mkCanvas(128, 128), blur = rg.createRadialGradient(64, 64, 0, 64, 64, 64);
  blur.addColorStop(0, 'rgba(255,255,255,0)'); blur.addColorStop(0.18, 'rgba(255,255,255,.12)');
  blur.addColorStop(0.7, 'rgba(255,255,255,.4)'); blur.addColorStop(0.94, 'rgba(255,255,255,.2)'); blur.addColorStop(1, 'rgba(255,255,255,0)');
  rg.fillStyle = blur; rg.fillRect(0, 0, 128, 128);
  const disc = B(new THREE.MeshBasicMaterial({ map: canvasTex(rotorCanvas), color: 0x8a8f92, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide }));
  o.rotor = grp(tilt, -0.15, 1.57, 0);
  for (let i = 0; i < 4; i++) { const g = grp(o.rotor); g.rotation.y = i * Math.PI / 2; add(g, bx(4.9, 0.018, 0.17), blade, 2.55, 0, 0, false).rotation.y = 0.025; }
  add(o.rotor, new THREE.CircleGeometry(5.0, 48), disc, 0, 0.015, 0, false).rotation.x = -Math.PI / 2;
  o.tailRotor = grp(tilt, -7.07, 0.97, 0.16);
  for (let i = 0; i < 4; i++) { const m = add(o.tailRotor, bx(1.5, 0.075, 0.025), blade, 0, 0, 0, false); m.rotation.z = i * Math.PI / 2; }
  add(o.tailRotor, new THREE.CircleGeometry(0.75, 24), disc, 0, 0, 0, false);
  if (detail) {
    tube(tilt, [[-0.95, 0.69, 0], [-1.28, 1.3, 0]], 0.014, dark, 8);
    tube(tilt, [[-0.55, -0.71, 0], [-0.75, -1.03, 0]], 0.016, dark, 8);
  }
  o.pod = grp(tilt, 1.75, -0.78, 0);
  add(o.pod, new THREE.SphereGeometry(0.23, 16, 12), dark, 0, 0, 0, false);
  add(o.pod, new THREE.CircleGeometry(0.17, 20), own(unlit(0xeaf4f6, { fog: false })), 0, 0, 0.22, false);
  o.navR = glow(tilt, 0xff3a28, 0.26, 0.85, -0.3, 0.11, 0.84);
  o.navG = glow(tilt, 0x3cff7a, 0.23, 0.45, -0.3, 0.11, -0.84);
  o.strobe = glow(tilt, 0xffffff, 0.8, 0, -7.37, 2.21, 0);
  o.beacon = glow(tilt, 0xff3020, 0.6, 0.1, -0.7, 1.12, 0);
  heli.visible = false; o.heli = heli; o.tilt = tilt; return o;
}

// 合并成一批真实草叶，不使用重复的透明方片。根部保持不动，叶尖随阵风摆动。
function searchMeadow(parent, list) {
  const pos = [], col = [], normal = [], root = [], indices = [], color = new THREE.Color();
  withSeed(11163 + list.length, () => {
    for (const [x, y, z, kind, size, tint] of list) {
      const density = 0.55 + 0.22 * Math.sin(x * 0.61 + z * 0.7) + 0.22 * Math.sin(x * 1.57 - z * 1.1);
      if (rnd() > density) continue;
      for (let b = 0; b < 5; b++) {
        const h = size * rr(0.35, 1.2), lean = rr(-0.6, 0.6) * h, width = h * rr(0.016, 0.035), xx = x + rr(-0.2, 0.2), zz = z + rr(-0.13, 0.13), off = pos.length / 3;
        color.copy(tint).multiplyScalar(rr(0.75, 1.25));
        for (let k = 0; k <= 3; k++) {
          const t = k / 3, cx = xx + lean * t * t, cy = y + h * t, w = width * (1 - t) + 0.0002;
          for (const s of [-1, 1]) { pos.push(cx + s * w, cy, zz); normal.push(0, 0.7, 0.7); root.push(y); col.push(color.r * (0.55 + 0.45 * t), color.g * (0.55 + 0.45 * t), color.b * (0.55 + 0.45 * t)); }
          if (k < 3) { const i = off + k * 2; indices.push(i, i + 1, i + 2, i + 1, i + 3, i + 2); }
        }
        if (kind === 'seed' && b < 2) for (let k = 0; k < 4; k++) {
          const t = 0.78 + k * 0.045, cx = xx + lean * t * t, cy = y + h * t, i = pos.length / 3, s = k % 2 ? 1 : -1;
          pos.push(cx, cy, zz, cx + s * h * 0.035, cy + h * 0.04, zz, cx, cy + h * 0.025, zz);
          for (let j = 0; j < 3; j++) { normal.push(0, 1, 0); root.push(y); col.push(color.r * 1.3, color.g * 1.25, color.b * 1.1); } indices.push(i, i + 1, i + 2);
        }
      }
    }
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(normal, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.setAttribute('aRoot', new THREE.Float32BufferAttribute(root, 1)); geo.setIndex(indices);
  const mat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }); mat.userData.own = true;
  const time = { value: 0 }, wind = { value: 0 };
  mat.onBeforeCompile = sh => {
    sh.uniforms.uMeadowT = time; sh.uniforms.uMeadowWind = wind;
    sh.vertexShader = 'attribute float aRoot; uniform float uMeadowT, uMeadowWind;\n' + sh.vertexShader;
    sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      float h = max(0.0, position.y - aRoot);
      transformed.x += h * h * uMeadowWind * sin(uMeadowT * 1.4 + position.x * 1.7 + position.z * 0.8);`);
  };
  mat.customProgramCacheKey = () => 'search-meadow-v1';
  const mesh = new THREE.Mesh(geo, mat); mesh.receiveShadow = true;
  mesh.onBeforeRender = () => { time.value = T; wind.value = 0.045 * (0.7 + 0.46 * GUST.v); }; parent.add(mesh); return mesh;
}

// ---- 雾里的剪影：几样合成一个网格的立体东西（照第二十一章的做法；颜色、明暗交给章节的着色） ----
// 往一份合并的顶点表里加一个几何体（用完就释放）
function mergePut(A, geo, m) {
  if (m) geo.applyMatrix4(m);
  const g = geo.index ? geo.toNonIndexed() : geo; if (!g.attributes.normal) g.computeVertexNormals();
  const a = g.attributes.position.array, n = g.attributes.normal.array; for (let i = 0; i < a.length; i++) { A.p.push(a[i]); A.n.push(n[i]); }
  geo.dispose(); if (g !== geo) g.dispose();
}
function mergedGeo(A) {
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(A.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(A.n, 3)); g.computeBoundingSphere(); return g;
}
// 枯树：一根微微歪着的树干，四到八根弯的枝，有的再分一杈（和第二十一章 tree3 一样）。o.thick 树干粗细的倍数 / o.branch 枝的多少的倍数
function deadTree(A, x, y, z, h, o = {}) {
  const r = h * rr(0.022, 0.032) * (o.thick ?? 1), lean = rr(-0.08, 0.08), m4 = new THREE.Matrix4();
  const tg = new THREE.CylinderGeometry(r * 0.35, r, h, 7); tg.translate(0, h / 2, 0);
  mergePut(A, tg, m4.makeRotationZ(lean).setPosition(x, y, z));
  for (let k = 0, nb = Math.floor(rr(4, 8) * (o.branch ?? 1)); k < nb; k++) {
    const t = rr(0.35, 0.92), bx = x - Math.sin(lean) * h * t, by = y + h * t, a = rr(0, 6.28), L = h * rr(0.15, 0.32) * (1.1 - t * 0.5);
    const p0 = V3(bx, by, z), p1 = V3(bx + Math.cos(a) * L * 0.5, by + L * rr(0.2, 0.5), z + Math.sin(a) * L * 0.3), p2 = V3(bx + Math.cos(a) * L, by + L * rr(0.5, 0.9), z + Math.sin(a) * L * 0.5);
    mergePut(A, new THREE.TubeGeometry(new THREE.CatmullRomCurve3([p0, p1, p2]), 5, r * rr(0.25, 0.4), 5));
    if (rnd() < 0.6) { const q0 = p1.clone().lerp(p2, 0.5), b = a + rr(-1, 1); mergePut(A, new THREE.TubeGeometry(new THREE.CatmullRomCurve3([q0, V3(q0.x + Math.cos(b) * L * 0.3, q0.y + L * 0.3, q0.z), V3(q0.x + Math.cos(b) * L * 0.5, q0.y + L * 0.55, q0.z + rr(-0.3, 0.3))]), 4, r * 0.15, 4)); }
  }
}
// 高压线塔：四条腿往上收，横撑和交叉的斜撑，顶上两层横担。h 塔高
function pylon(A, x, y, z, h) {
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = V3(0, 1, 0);
  const bar = (a, b, w) => { const d = b.clone().sub(a), L = d.length(); q.setFromUnitVectors(up, d.normalize()); mergePut(A, new THREE.BoxGeometry(w, L, w), m4.compose(a.clone().lerp(b, 0.5), q, V3(1, 1, 1))); };
  const half = t => h * 0.15 * (t < 0.72 ? 1 - 0.75 * t / 0.72 : 0.25 * (1 - 0.6 * (t - 0.72) / 0.28)), P_ = (t, sx, sz) => V3(x + sx * half(t), y + h * t, z + sz * half(t));
  const C4 = [[-1, -1], [1, -1], [1, 1], [-1, 1]], TS = [0, 0.18, 0.34, 0.48, 0.6, 0.72, 0.86, 1];
  for (const [sx, sz] of C4) for (let i = 1; i < TS.length; i++) bar(P_(TS[i - 1], sx, sz), P_(TS[i], sx, sz), 0.22);
  for (let i = 1; i < TS.length - 1; i++) for (let s = 0; s < 4; s++) {
    const [ax, az] = C4[s], [bx2, bz] = C4[(s + 1) % 4];
    bar(P_(TS[i], ax, az), P_(TS[i], bx2, bz), 0.1);
    bar(P_(TS[i - 1], ax, az), P_(TS[i], bx2, bz), 0.07); bar(P_(TS[i - 1], bx2, bz), P_(TS[i], ax, az), 0.07);
  }
  for (const [t, w] of [[0.72, 0.26], [0.86, 0.19]]) { bar(V3(x - h * w, y + h * t, z), V3(x + h * w, y + h * t, z), 0.18); for (const s of [-1, 1]) bar(V3(x + s * h * w, y + h * t, z), P_(t - 0.08, s, 0), 0.08); }
}
// 雾里的石头：圆润、风化过，几个劈开的平面（和第二十一章的 rockS 一样，只是搬到这里给夜搜用；第二十一章还用它自己的那一份）
function fogRockGeo(seed, o = {}) {
  const g = new THREE.IcosahedronGeometry(1, o.sd ?? 2), p = g.attributes.position, amp = o.amp ?? 0.25, flat = o.flat ?? 0.7, mk = o.moss ?? 0.5;
  const hh = (x, y, z) => { const t = Math.sin(x * 127.1 + y * 311.7 + z * 74.7 + seed * 13.17) * 43758.5453; return t - Math.floor(t); };
  const vn3 = (x, y, z) => { const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z), fx = x - ix, fy = y - iy, fz = z - iz, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), w = fz * fz * (3 - 2 * fz);
    const L = (a, b, t) => a + (b - a) * t, c = (dx, dy, dz) => hh(ix + dx, iy + dy, iz + dz);
    return L(L(L(c(0, 0, 0), c(1, 0, 0), u), L(c(0, 1, 0), c(1, 1, 0), u), v), L(L(c(0, 0, 1), c(1, 0, 1), u), L(c(0, 1, 1), c(1, 1, 1), u), v), w); };
  const nv = new Float32Array(p.count), CUTS = [];
  for (let j = 0, nc = 2 + Math.floor(hh(seed, 3, 1) * 3); j < nc; j++) { const a = hh(j, seed, 5) * 6.2832, e = (hh(seed, j, 9) - 0.25) * 1.6; CUTS.push([Math.cos(a) * Math.cos(e), Math.sin(e), Math.sin(a) * Math.cos(e), 0.55 + 0.3 * hh(j, 7, seed)]); }
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const n = 0.48 * vn3(x * 1.4 + 3, y * 1.4, z * 1.4) + 0.26 * vn3(x * 3.2, y * 3.2 + 7, z * 3.2) + 0.16 * vn3(x * 7, y * 7, z * 7 + 2) + 0.1 * vn3(x * 15, y * 15 + 4, z * 15);
    const k = 1 + amp * (2 * n - 1); let px = x * k, yy = y * k * flat, pz = z * k; if (yy < -0.25 * flat) yy = -0.25 * flat + (yy + 0.25 * flat) * 0.35;
    for (const [cx, cy2, cz, d] of CUTS) { const t = px * cx + yy * cy2 + pz * cz - d; if (t > 0) { px -= cx * t * 0.92; yy -= cy2 * t * 0.92; pz -= cz * t * 0.92; } }
    p.setXYZ(i, px, yy, pz); nv[i] = n;
  }
  const key = i => Math.round(p.getX(i) * 1e4) + ',' + Math.round(p.getY(i) * 1e4) + ',' + Math.round(p.getZ(i) * 1e4), acc = new Map(), a = V3(0, 0, 0), b = V3(0, 0, 0), c = V3(0, 0, 0);
  for (let i = 0; i < p.count; i += 3) {
    a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i + 1); c.fromBufferAttribute(p, i + 2);
    const fn = b.clone().sub(a).cross(c.clone().sub(a));
    for (let j = 0; j < 3; j++) { const kk = key(i + j); const v = acc.get(kk); if (v) v.add(fn); else acc.set(kk, fn.clone()); }
  }
  const TINT = new THREE.Color(hh(seed, 2, 2) < 0.5 ? 0x5a4f44 : 0x434a50);
  const nrm = new Float32Array(p.count * 3), col = new Float32Array(p.count * 3), base = new THREE.Color(o.col ?? 0x4a4945), moss = new THREE.Color(o.mossCol ?? 0x45602a), cc = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const tri = i - i % 3; a.fromBufferAttribute(p, tri); b.fromBufferAttribute(p, tri + 1); c.fromBufferAttribute(p, tri + 2);
    const fnn = b.clone().sub(a).cross(c.clone().sub(a)).normalize(), v = acc.get(key(i)).clone().normalize().lerp(fnn, 0.7).normalize(); nrm.set([v.x, v.y, v.z], i * 3);
    const m = sstep(0.35, 0.8, v.y) * mk * sstep(0.45, 0.65, nv[i] + 0.15 * hh(i, 1, 2));
    cc.copy(base).lerp(TINT, 0.35).multiplyScalar((0.78 + 0.4 * nv[i]) * (0.5 + 0.5 * sstep(-0.32, 0.28, p.getY(i)))).lerp(moss, m); col.set([cc.r, cc.g, cc.b], i * 3);
  }
  g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); return g;
}
