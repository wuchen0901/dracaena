
// ============================================================
//  3D 道具的公共部分：材质、地面，以及各章节都会用到的几种机关的造型（都受光照、有影子）
// ============================================================
const MAT = {
  concrete: lam(0x2a3336), dark: lam(0x12181a), rust: lam(0x6a4634), rust2: lam(0x4a3a31), steel: lam(0x39444a),
  sheet: lam(0x40372f), edge: lam(0x4a585e), black: new THREE.MeshBasicMaterial({ color: 0x030506, fog: false, side: THREE.DoubleSide }),
  stone: lam(0x5d6058), stone2: lam(0x464a44), wood: lam(0x5c4833), wood2: lam(0x3b2f24), wall: lam(0x4c5356), wall2: lam(0x3a4144),
  pale: lam(0x8a8f8c), copper: lam(0xa06c3a), cloth: lam(0x8a836c, { side: THREE.DoubleSide }), coat: lam(0x6b5a48, { side: THREE.DoubleSide }),
  leaf: lam(0x4c6638), leaf2: lam(0x6f8c46), dry: lam(0x7a6a4c), hub: lam(0x232e36), hub2: lam(0x364651), white: lam(0xb9c0bd),
};
const bx = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const cy = (rt, rb, h, seg = 16) => new THREE.CylinderGeometry(rt, rb, h, seg);
const unlit = (color, o = {}) => new THREE.MeshBasicMaterial({ color, ...o });

// 地面：把地形折线沿 z 方向拉成一条很宽的带子，颜色跟着 GROUND 里的关键点渐变
function buildGround() {
  const pts = [], pos = [], col = [], Z0 = -450, Z1 = 14, ca = new THREE.Color(), cb = new THREE.Color();
  for (let i = 1; i < TERRAIN.length; i++) {            // 长的线段每 4 米切一刀，颜色才能平滑过渡
    const [ax, ay] = TERRAIN[i - 1], [bxx, by] = TERRAIN[i], n = Math.max(1, Math.ceil((bxx - ax) / 4));
    for (let k = 0; k < n; k++) pts.push([lerp(ax, bxx, k / n), lerp(ay, by, k / n)]);
  }
  pts.push(TERRAIN[TERRAIN.length - 1]);
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1], [bxx, by] = pts[i], mid = (ax + bxx) / 2, cut = GROUND_BACK.find(c => mid >= c[0] && mid <= c[1]), zb = cut ? cut[2] : Z0;
    const front = GROUND_FRONT.find(c => mid >= c[0] && mid <= c[1]), zf = front ? front[2] : Z1;
    if (zf === null) continue;                           // 这一段的地面由章节自己搭
    pos.push(ax, ay, zf, bxx, by, zf, bxx, by, zb, ax, ay, zf, bxx, by, zb, ax, ay, zb);
    groundColor(ax, ca); groundColor(bxx, cb);
    for (const c of [ca, cb, cb, ca, cb, ca]) col.push(c.r, c.g, c.b);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true })); m.receiveShadow = true; m.frustumCulled = false; scene.add(m); return m;
}

// 贴在地上的一块画：拖痕、扫痕、水渍。draw(g) 里 x 是世界 x，y 是世界 z
function decal(parent, x1, x2, z1, z2, y, ppm, draw, o = {}) {
  const [c, g] = mkCanvas(Math.round((x2 - x1) * ppm), Math.round((z2 - z1) * ppm));
  g.setTransform(ppm, 0, 0, ppm, -x1 * ppm, -z1 * ppm); g.lineCap = 'round'; draw(g);
  const mat = new (o.unlit ? THREE.MeshBasicMaterial : THREE.MeshLambertMaterial)({ map: canvasTex(c), transparent: true, depthWrite: false, opacity: o.opacity ?? 1 });
  mat.userData.own = true;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(x2 - x1, z2 - z1), mat); m.rotation.x = -Math.PI / 2; m.position.set((x1 + x2) / 2, y + 0.008, (z1 + z2) / 2);
  m.receiveShadow = true; m.renderOrder = 2; parent.add(m); return m;
}
// 箱子在地上磨出来的两道拖痕：从 x1 一直拖到 x2
function dragMarks(parent, x1, x2, y = 0, z = 0, half = 0.42) {
  return decal(parent, x1 - 0.4, x2 + 0.4, z - 0.8, z + 0.8, y, 40, g => {
    for (const dz of [-half, half]) for (let i = 0; i < 5; i++) {
      g.strokeStyle = `rgba(150,160,158,${0.05 + 0.05 * i})`; g.lineWidth = 0.16 - i * 0.03;
      g.beginPath(); g.moveTo(x1, z + dz + (i - 2) * 0.012); g.lineTo(x2, z + dz - (i - 2) * 0.012); g.stroke();
    }
  });
}
// 一块面朝镜头的小牌子 / 图标（不受光照，自己发亮）
function plate(parent, tex, w, h, x, y, z, color = 0xffffff, o = {}) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, color, fog: o.fog ?? false, opacity: o.opacity ?? 1 }));
  m.position.set(x, y, z); m.renderOrder = o.order ?? 30; parent.add(m); return m;
}
// 沿着几个点弯过去的一根管子 / 缆线
function tube(parent, pts, r, mat, seg = 24) {
  return add(parent, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => V3(...p)), false, 'catmullrom', 0.2), seg, r, 6), mat);
}

// ---- 箱子：wood 旧木箱 / steel 带小轮子的运输箱 ----
function mkCrate(parent, o, style = 'wood') {
  const g = grp(parent, o.x, o.y1, 0), w = o.w, h = o.h, d = 1.05, m1 = style === 'wood' ? MAT.wood : MAT.sheet, m2 = style === 'wood' ? MAT.wood2 : MAT.rust2;
  const lift = style === 'steel' ? 0.16 : 0, hh = h - lift;
  add(g, bx(w - 0.06, hh - 0.06, d - 0.06), m1, 0, lift + hh / 2, 0);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(g, bx(0.09, hh, 0.09), m2, sx * (w / 2 - 0.045), lift + hh / 2, sz * (d / 2 - 0.045));
  for (const sy of [lift + 0.045, h - 0.045]) {
    for (const sz of [-1, 1]) add(g, bx(w, 0.09, 0.09), m2, 0, sy, sz * (d / 2 - 0.045));
    for (const sx of [-1, 1]) add(g, bx(0.09, 0.09, d), m2, sx * (w / 2 - 0.045), sy, 0);
  }
  add(g, bx(0.07, Math.hypot(w, hh) * 0.84, 0.04), m2, 0, lift + hh / 2, d / 2 - 0.01).rotation.z = Math.atan2(w, hh);     // 正面的斜撑
  if (style === 'steel') for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(g, cy(0.12, 0.12, 0.08, 12), MAT.dark, sx * (w / 2 - 0.2), 0.12, sz * (d / 2 - 0.1)).rotation.x = Math.PI / 2;
  return g;
}

// ---- 拉杆：一只铁盒 + 一根会扳动的杆 + 一盏指示灯。set(t)：0 = 没拉，1 = 拉到底 ----
function mkLever(parent, x, y, z, o = {}) {
  const g = grp(parent, x, y, z), red = o.red ?? 0xff4a2a, green = o.green ?? 0x6dff9a;
  add(g, bx(0.5, 0.95, 0.42), MAT.steel, 0, 0.47, -0.25);
  const arm = grp(g, 0, 0.86, 0); arm.rotation.z = 0.7;
  add(arm, cy(0.03, 0.03, 0.62, 8), MAT.dark, 0, 0.31, 0);
  add(arm, new THREE.SphereGeometry(0.075, 12, 8), lam(0xb0452e), 0, 0.64, 0);
  const lampMat = unlit(red); add(g, new THREE.SphereGeometry(0.07, 10, 8), lampMat, 0, 1.05, -0.07, false);
  return { g, arm, lampMat, set(t) { arm.rotation.z = lerp(0.7, -0.7, sstep(0, 1, t)); lampMat.color.set(t > 0.5 ? green : red); } };
}

// ---- 闸门：两根门柱 + 一扇向上升起的门板。sync(g) 把门板摆到 g.open 对应的位置 ----
function mkGateDoor(parent, g, o = {}) {
  const h = g.h, d = o.depth ?? 2.44, mat = o.mat ?? MAT.rust2, grpG = grp(parent, g.x, g.y0, 0);
  for (const z of [-d / 2 - 0.1, d / 2 + 0.1]) add(grpG, bx(g.w + 0.7, h + 0.1, 0.22), o.post ?? MAT.steel, 0, (h + 0.1) / 2, z);
  const m = add(grpG, bx(Math.min(0.5, g.w), h, d), mat, 0, h / 2, 0);
  if (o.bars) { m.visible = false; for (let z = -d / 2 + 0.12; z < d / 2; z += 0.26) add(grpG, cy(0.03, 0.03, h, 6), mat, 0, h / 2, z).userData.bar = 1; }
  else for (let y = -h / 2 + 0.6; y < h / 2; y += 1.2) add(m, bx(Math.min(0.56, g.w + 0.06), 0.16, d + 0.02), o.band ?? MAT.rust, 0, y, 0, false);
  const bars = grpG.children.filter(c => c.userData.bar);
  return { g: grpG, m, sync(gt) { const y = h / 2 + sstep(0, 1, gt.open) * (h - 0.05); m.position.y = y; for (const b of bars) b.position.y = y; } };
}

// ---- 监控摄像头：一根杆子顶上伸出一只会转的“头”，带一束看得见的扫描光 ----
// aim(x, y, z) 对准世界里的一点；power(k) 通电程度；alert(k) 0 = 平静的冷白，1 = 发现目标的红
function mkCamPole(parent, x, y, z, h, o = {}) {
  const g = grp(parent, x, y, z), dir = o.dir ?? -1, len = o.len ?? 12, ang = o.ang ?? 0.11;
  add(g, cy(0.06, 0.09, h, 8), MAT.dark, 0, h / 2, 0);
  add(g, bx(0.9, 0.07, 0.07), MAT.dark, dir * 0.42, h - 0.06, 0);
  const head = grp(g, dir * 0.85, h - 0.3, 0);
  add(head, bx(0.26, 0.24, 0.52), MAT.steel, 0, 0, -0.05); add(head, cy(0.09, 0.11, 0.14, 12), MAT.dark, 0, 0, 0.26).rotation.x = Math.PI / 2;
  const lensMat = unlit(0xdfeef2, { fog: false }); add(head, new THREE.CircleGeometry(0.075, 14), lensMat, 0, 0, 0.335, false);
  const ledMat = unlit(0xff3a2a, { fog: false }); add(head, new THREE.SphereGeometry(0.03, 8, 6), ledMat, 0.1, 0.14, 0.1, false);
  const geo = new THREE.ConeGeometry(Math.tan(ang) * len, len, 24, 1, true); geo.translate(0, -len / 2, 0); geo.rotateX(-Math.PI / 2);
  const cone = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: beamGradTex(), color: 0xd8ecf2, transparent: true, opacity: 0.085, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
  cone.renderOrder = 60; head.add(cone);
  const halo = glow(head, 0xdfeef2, 1.5, 0.7, 0, 0, 0.36);
  const cCalm = new THREE.Color(o.calm ?? 0xe2eef2), cAlert = new THREE.Color(0xff5030), tmp = V3();
  const api = { g, head, cone, ledMat, len, k: 1, al: 0, tx: x, ty: y,
    aim(tx, ty, tz = 0) { api.tx = tx; api.ty = ty; head.lookAt(tx, ty, tz); head.getWorldPosition(tmp); cone.scale.setScalar((tmp.distanceTo(V3(tx, ty, tz)) + 0.6) / len); },
    power(k) { api.k = k; cone.visible = k > 0.02; cone.material.opacity = 0.085 * k; halo.material.opacity = 0.7 * k; lensMat.color.copy(cCalm).lerp(cAlert, api.al).multiplyScalar(0.12 + 0.88 * k); ledMat.color.setHex(k > 0.5 ? 0xff3a2a : 0x2a1210); },
    alert(a) { api.al = a; cone.material.color.copy(cCalm).lerp(cAlert, a); halo.material.color.copy(cone.material.color); lensMat.color.copy(cone.material.color).multiplyScalar(0.12 + 0.88 * api.k); } };
  return api;
}
let _beamGrad = null;
function beamGradTex() {                                 // 光柱的贴图：靠近灯头亮，越远越淡
  if (_beamGrad) return _beamGrad;
  const [c, g] = mkCanvas(8, 128), gr = g.createLinearGradient(0, 0, 0, 128);
  gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.5, '#5a5a5a'); gr.addColorStop(1, '#161616'); g.fillStyle = gr; g.fillRect(0, 0, 8, 128);
  return _beamGrad = canvasTex(c);
}

// ---- 带图标的指示灯：on(k) 亮起来的程度 ----
function mkIconLamp(parent, kind, size, x, y, z, color = 0x9fe8ff) {
  const g = grp(parent, x, y, z);
  add(g, bx(size * 1.25, size * 1.25, 0.08), MAT.dark, 0, 0, -0.05, false);
  const m = plate(g, iconTex(kind), size, size, 0, 0, 0.0), halo = glow(g, color, size * 2.6, 0, 0, 0, 0.05), cOn = new THREE.Color(color), cOff = new THREE.Color(0x2c3438);
  const api = { g, k: -1, on(k) { if (Math.abs(k - api.k) < 0.004) return; api.k = k; m.material.color.copy(cOff).lerp(cOn, k); halo.material.opacity = 0.5 * k; } };
  api.on(0); return api;
}
