// 夜搜专用造型。真实几何接受场景灯光；不把概念图当作背景或游戏画面。
function searchAircraft(parent, detail = true) {
  const own = m => { m.userData.own = true; return m; };
  const metal = own(new THREE.MeshStandardMaterial({ color: 0x596972, roughness: 0.58, metalness: 0.18 }));
  const dark = own(new THREE.MeshStandardMaterial({ color: 0x26343e, roughness: 0.7, metalness: 0.12 }));
  const edge = own(new THREE.MeshStandardMaterial({ color: 0x81929a, roughness: 0.46, metalness: 0.25 }));
  const glass = own(new THREE.MeshStandardMaterial({ color: 0x152e3c, roughness: 0.22, metalness: 0.25, emissive: 0x172b39, emissiveIntensity: 0.38, side: THREE.DoubleSide }));
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
  const blade = own(new THREE.MeshBasicMaterial({ color: 0x18232a, transparent: true, opacity: 0.7, depthWrite: false }));
  const [rotorCanvas, rg] = mkCanvas(128, 128), blur = rg.createRadialGradient(64, 64, 0, 64, 64, 64);
  blur.addColorStop(0, 'rgba(255,255,255,0)'); blur.addColorStop(0.18, 'rgba(255,255,255,.12)');
  blur.addColorStop(0.7, 'rgba(255,255,255,.4)'); blur.addColorStop(0.94, 'rgba(255,255,255,.2)'); blur.addColorStop(1, 'rgba(255,255,255,0)');
  rg.fillStyle = blur; rg.fillRect(0, 0, 128, 128);
  const disc = own(new THREE.MeshBasicMaterial({ map: canvasTex(rotorCanvas), color: 0x81959e, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide }));
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
