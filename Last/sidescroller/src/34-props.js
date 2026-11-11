
// ============================================================
//  3D 道具：地面、障碍、推车、矮墙、拉杆、大门（都受光照、有影子）
// ============================================================
const MAT = {
  concrete: lam(0x2a3336), dark: lam(0x12181a), rust: lam(0x6a4634), rust2: lam(0x4a3a31), steel: lam(0x39444a),
  sheet: lam(0x40372f), edge: lam(0x4a585e), black: new THREE.MeshBasicMaterial({ color: 0x030506, fog: false, side: THREE.DoubleSide }),
};
const bx = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const cy = (rt, rb, h, seg = 16) => new THREE.CylinderGeometry(rt, rb, h, seg);

{ // 地面：把地形折线沿 z 方向拉成一条很宽的带子。室内是深色水泥，室外是土色
  const pos = [], col = [], cIn = new THREE.Color(0x1c2529), cOut = new THREE.Color(0x574839), Z0 = -450, Z1 = 14;
  for (let i = 1; i < TERRAIN.length; i++) {
    const [ax, ay] = TERRAIN[i - 1], [bxx, by] = TERRAIN[i], c = (ax + bxx) / 2 < 92.1 ? cIn : cOut;
    pos.push(ax, ay, Z1, bxx, by, Z1, bxx, by, Z0, ax, ay, Z1, bxx, by, Z0, ax, ay, Z0);
    for (let k = 0; k < 6; k++) col.push(c.r, c.g, c.b);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true })); m.receiveShadow = true; scene.add(m);
  // 地面的伸缩缝：一道道伸向远处的细线，增强纵深感
  for (let x = -18; x < 88; x += 5.5) if (x < 46 || x > 58) add(scene, bx(0.07, 0.012, 34), MAT.dark, x, 0.004, -8, false).receiveShadow = true;
  for (const z of [3.2, -4.5]) add(scene, bx(110, 0.012, 0.07), MAT.dark, 33, 0.004, z, false);
}

// 倒在地上的工字钢、水泥台、高台
add(scene, bx(1.3, 0.45, 2.7), MAT.rust, 9.65, 0.225, -0.15).rotation.y = 0.07;
add(scene, bx(1.36, 0.07, 2.76), MAT.rust2, 9.65, 0.45, -0.15).rotation.y = 0.07;
add(scene, bx(4, 0.9, 4.4), MAT.concrete, 17, 0.45, -0.7);
add(scene, bx(4.04, 0.06, 0.1), MAT.edge, 17, 0.9, 1.48, false);
add(scene, bx(1.7, 0.55, 1.5), MAT.concrete, 20.3, 0.27, -2.2).rotation.y = 0.5;
for (const [x, h] of [[15.5, 0.5], [16.1, 0.8], [18.6, 0.6]]) add(scene, cy(0.02, 0.02, h, 5), MAT.rust, x, 0.9 + h / 2, -2.6).rotation.z = rr(-0.3, 0.3);   // 露出的钢筋
add(scene, bx(10, 3, 8.6), MAT.concrete, 43, 1.5, -2.05);
add(scene, bx(10.04, 0.08, 0.12), MAT.edge, 43, 3.0, 2.22, false);
for (let x = 38.6; x < 48; x += 2.35) add(scene, bx(0.5, 2.5, 0.14), MAT.dark, x + 0.5, 1.35, 2.26, false);       // 高台正面的凹槽
for (let x = 38.3; x <= 57.2; x += 1.6) add(scene, cy(0.03, 0.03, 1.05, 6), MAT.dark, x, groundY(Math.max(x, 48.05)) + 0.52, -3.4);   // 栏杆
{ const pts = []; for (let x = 38.3; x <= 57.2; x += 1.6) pts.push(V3(x, groundY(Math.max(x, 48.05)) + 1.05, -3.4));
  add(scene, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.05), 60, 0.03, 5), MAT.dark); }

// 轨道 + 推车
for (const z of [-0.42, 0.42]) add(scene, bx(16.6, 0.07, 0.07), MAT.steel, 30.3, 0.035, z, false).receiveShadow = true;
for (let x = 22.4; x < 38.6; x += 0.8) add(scene, bx(0.16, 0.03, 1.25), MAT.dark, x, 0.016, 0, false).receiveShadow = true;
const cartG = grp(scene, cart.x, 0, 0), wheels = [];
add(cartG, bx(cart.w, 0.56, 1.15), MAT.rust, 0, 0.67, 0);
add(cartG, bx(cart.w + 0.06, 0.07, 1.21), MAT.rust2, 0, 0.92, 0);
add(cartG, bx(cart.w + 0.04, 0.1, 1.19), MAT.dark, 0, 0.42, 0);
add(cartG, bx(0.5, 0.3, 1.17), lam(0x8a7a5c), 0.2, 0.68, 0);                     // 褪色的黄色标记
for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
  const w = add(cartG, cy(0.19, 0.19, 0.1, 14), MAT.dark, sx * 0.48, 0.19, sz * 0.5); w.rotation.x = Math.PI / 2; wheels.push(w);
  add(w, bx(0.3, 0.12, 0.04), MAT.steel, 0, 0, 0, false);
}

// 探照灯场地上的矮墙：一块块生锈的铁皮
for (const [a, b] of WATCH.walls) {
  add(scene, bx(b - a, WATCH.wallH, 0.14), MAT.sheet, (a + b) / 2, WATCH.wallH / 2, WATCH.wallZ);
  add(scene, bx(b - a + 0.1, 0.08, 0.2), MAT.rust2, (a + b) / 2, WATCH.wallH, WATCH.wallZ);
  for (const x of [a + 0.08, (a + b) / 2, b - 0.08]) add(scene, bx(0.12, WATCH.wallH + 0.25, 0.12), MAT.dark, x, WATCH.wallH / 2 + 0.1, WATCH.wallZ - 0.12);
}

// 拉杆 + 指示灯
add(scene, bx(0.5, 0.95, 0.42), MAT.steel, LEVER.x, 0.47, -0.8);
const leverArm = grp(scene, LEVER.x, 0.86, -0.55); leverArm.rotation.z = 0.7;
add(leverArm, cy(0.03, 0.03, 0.62, 8), MAT.dark, 0, 0.31, 0);
add(leverArm, new THREE.SphereGeometry(0.075, 12, 8), lam(0xb0452e), 0, 0.64, 0);
const leverLampMat = new THREE.MeshBasicMaterial({ color: 0xff4a2a });
add(scene, new THREE.SphereGeometry(0.07, 10, 8), leverLampMat, LEVER.x, 1.05, -0.62, false);
const leverLight = new THREE.PointLight(0xff4a2a, 2.2, 5, 2); leverLight.position.set(LEVER.x, 1.2, 0.1); scene.add(leverLight);

// 厂房尽头的墙和大门。靠镜头这一侧是一整面黑墙：镜头穿过它时正好切换室内 / 室外的光线
add(scene, bx(1.4, 48, 30.7), MAT.concrete, 90, 23, -16.65);
add(scene, bx(1.4, 44.4, 2.6), MAT.concrete, 90, 3.6 + 22.2, 0);
add(scene, bx(1.4, 70, 40), MAT.black, 91.4, 30, 21.3, false);
for (const z of [-1.32, 1.32]) add(scene, bx(1.6, 3.7, 0.22), MAT.steel, 90, 1.85, z);
const doorMesh = add(scene, bx(0.5, 3.6, 2.44), MAT.rust2, 90, 1.8, 0);
for (const y of [-1.2, 0, 1.2]) add(doorMesh, bx(0.56, 0.16, 2.46), MAT.rust, 0, y, 0, false);
// 门外的天光：门升起来以后，门洞里是一片过曝的暖光
const doorGlowMat = new THREE.MeshBasicMaterial({ color: 0xffdcaa, transparent: true, opacity: 0, fog: false, depthWrite: false });
add(scene, new THREE.PlaneGeometry(2.44, 3.6), doorGlowMat, 90.62, 1.8, 0, false).rotation.y = -Math.PI / 2;
const doorLight = new THREE.PointLight(0xffc98a, 0, 18, 1.3); doorLight.position.set(89.0, 1.5, 0.5); scene.add(doorLight);
