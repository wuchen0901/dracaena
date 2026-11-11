
// ============================================================
//  探照灯机器 / 灯光 / 尘埃 / 室内外切换
// ============================================================
function glowTex(stops) {
  const [c, g] = mkCanvas(128, 128), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  stops.forEach(([p, col]) => gr.addColorStop(p, col)); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  return canvasTex(c);
}
const GLOW = glowTex([[0, 'rgba(255,255,255,1)'], [0.22, 'rgba(255,255,255,.5)'], [1, 'rgba(255,255,255,0)']]);
function glow(parent, color, size, opacity, x = 0, y = 0, z = 0) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color, opacity, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  s.scale.setScalar(size); s.position.set(x, y, z); s.renderOrder = 50; parent.add(s); return s;
}

glow(scene, 0xffb24a, 10, 0.95, 224, 46.4, -239).renderOrder = -2990;      // 巨像还亮着的那只眼睛

// ---- 探照灯机器：三条长腿撑着一个会转动的“头”----
const watcher = grp(scene, WATCH.ex, 0, WATCH.ez);
for (const [x, z] of [[-2.8, -1.6], [2.8, -1.6], [0, 2.4]]) {
  const a = V3(x, 0, z), b = V3(x * 0.12, 3.1, z * 0.12), leg = add(watcher, cy(0.09, 0.14, a.distanceTo(b), 8), MAT.dark);
  leg.position.copy(a).add(b).multiplyScalar(0.5); leg.quaternion.setFromUnitVectors(V3(0, 1, 0), b.clone().sub(a).normalize());
}
add(watcher, cy(0.5, 0.62, 0.5, 12), MAT.dark, 0, 3.1, 0);
add(watcher, cy(0.05, 0.05, 4.2, 6), MAT.dark, -0.5, 5.6, -0.4);
const wHead = grp(watcher, 0, WATCH.ey, 0);
add(wHead, bx(1.25, 0.85, 1.5), MAT.dark, 0, 0, -0.1);
add(wHead, cy(0.36, 0.42, 0.4, 16), MAT.steel, 0, 0, 0.72).rotation.x = Math.PI / 2;
const eyeMat = new THREE.MeshBasicMaterial({ color: 0xeaf4f6, fog: false });
add(wHead, new THREE.CircleGeometry(0.3, 20), eyeMat, 0, 0, 0.93, false);
const eyeGlow = glow(wHead, 0xdfeef2, 5.5, 0.85, 0, 0, 1.0);

const beam = new THREE.SpotLight(0xe2eef2, 30, 80, 0.118, 0.4, 0);
beam.position.set(WATCH.ex, WATCH.ey, WATCH.ez + 0.95); beam.castShadow = true;
beam.shadow.mapSize.set(1024, 1024); beam.shadow.camera.near = 6; beam.shadow.camera.far = 40; beam.shadow.bias = -0.0015;
scene.add(beam, beam.target);
// 看得见的光柱：两层半透明的圆锥叠在一起
const beamCones = [];
{ const [c, g] = mkCanvas(8, 128), gr = g.createLinearGradient(0, 0, 0, 128);
  gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.5, '#5a5a5a'); gr.addColorStop(1, '#161616'); g.fillStyle = gr; g.fillRect(0, 0, 8, 128);
  const map = canvasTex(c), len = 26;
  for (const [k, op] of [[1, 0.075], [0.55, 0.09]]) {
    const geo = new THREE.ConeGeometry(Math.tan(0.118) * len * k, len, 28, 1, true); geo.translate(0, -len / 2, 0); geo.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map, color: 0xd8ecf2, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
    m.position.copy(beam.position); m.renderOrder = 60; scene.add(m); beamCones.push(m);
  }
}
const C_CALM = new THREE.Color(0xe2eef2), C_ALERT = new THREE.Color(0xff5030);
function aimWatcher(tx, ty, alert) {
  beam.target.position.set(tx, ty, 0);
  const len = Math.hypot(tx - beam.position.x, ty - beam.position.y, beam.position.z) + 1.2;
  for (const c of beamCones) { c.lookAt(tx, ty, 0); c.scale.setScalar(len / 26); c.material.color.lerpColors(C_CALM, C_ALERT, alert); }
  wHead.lookAt(tx, ty, 0);
  beam.color.lerpColors(C_CALM, C_ALERT, alert); eyeMat.color.copy(beam.color); eyeGlow.material.color.copy(beam.color);
}

// ---- 灯光 ----
const hemi = new THREE.HemisphereLight(0x9fb6bd, 0x1c2224, 0.6); scene.add(hemi);
const key = new THREE.DirectionalLight(0xd4e6ec, 0.85); key.castShadow = true;
key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0006; key.shadow.normalBias = 0.02;
Object.assign(key.shadow.camera, { left: -17, right: 17, top: 13, bottom: -9, near: 1, far: 110 });
scene.add(key, key.target);
const rim = new THREE.DirectionalLight(0xa9cdd8, 0.7); rim.position.set(-6, 5, -10); scene.add(rim, rim.target);
const KEY_IN = V3(0.22, 1, 0.32).normalize(), KEY_OUT = V3(0.74, 0.34, -0.5).normalize(), keyDir = KEY_IN.clone();

// 天窗漏下来的几束冷光（打在地上是一圈亮斑），和推车上方一盏暖色的吊灯
const pools = [[3.5, 10, 0.3], [30.5, 11, 0.3], [44.5, 12, 3.2], [18.5, 10, 0.9]].map(([x, y, ty]) => {
  const s = new THREE.SpotLight(0xcfe6ee, 3.1, 40, 0.3, 0.95, 0); s.position.set(x + 1.6, y, 2.5); s.target.position.set(x, ty, -0.4);
  scene.add(s, s.target); return s;
});
const bulb = new THREE.PointLight(0xffb463, 9, 11, 1.6); bulb.position.set(33, 5.0, -1.6); scene.add(bulb);
const bulbGlow = glow(scene, 0xffbe72, 2.6, 0.9, 33, 5.62, -3.15);
// 光束本身：几块斜着的发光薄片
backdrop(-6, 52, -0.5, 16, -2.2, 12, g => {
  for (const [x, w, a] of [[3.5, 3.4, 0.2], [30.5, 3.8, 0.17], [44.5, 3.4, 0.15], [18.5, 2.6, 0.1]]) {
    const gr = g.createLinearGradient(0, 16, 0, 0); gr.addColorStop(0, `rgba(190,222,230,${a})`); gr.addColorStop(0.75, `rgba(190,222,230,${a * 0.55})`); gr.addColorStop(1, 'rgba(190,222,230,0)');
    g.fillStyle = gr; poly(g, [[x + 2.4, 16], [x + 3.3, 16], [x + w / 2 + 0.2, 0], [x - w / 2, 0]]);
  }
}, { additive: true, fog: false, blur: 9, order: 40 });

// ---- 空气里的尘埃 ----
const DUST_N = 520, dustPos = new Float32Array(DUST_N * 3), dustVel = [];
for (let i = 0; i < DUST_N; i++) {
  dustPos.set([rr(-24, 24), rr(-0.5, 11), rr(-10, 7)], i * 3);
  dustVel.push([rr(-0.12, 0.12), rr(-0.07, 0.03), rr(0.4, 1.6)]);        // [vx, vy, 相位]
}
const dustGeo = new THREE.BufferGeometry(); dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
const dustMat = new THREE.PointsMaterial({ map: GLOW, color: 0xcfe2e6, size: 0.085, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
const dust = new THREE.Points(dustGeo, dustMat); dust.frustumCulled = false; dust.renderOrder = 45; scene.add(dust);
function updateDust(dt, t, camX, wind) {
  for (let i = 0; i < DUST_N; i++) {
    const v = dustVel[i], j = i * 3;
    let x = dustPos[j] + (v[0] + wind) * dt + Math.sin(t * v[2] + i) * 0.0016, y = dustPos[j + 1] + v[1] * dt;
    if (x < camX - 24) x += 48; else if (x > camX + 24) x -= 48;
    if (y < -0.5) y = 11; else if (y > 11) y = -0.5;
    dustPos[j] = x; dustPos[j + 1] = y;
  }
  dustGeo.attributes.position.needsUpdate = true;
}

// ---- 室内 ↔ 室外：镜头穿过那面黑墙的瞬间切换 ----
const HEMI_IN = [new THREE.Color(0x9fb6bd), new THREE.Color(0x1c2224)], HEMI_OUT = [new THREE.Color(0xffe6c4), new THREE.Color(0x4a4038)];
const KEYC_IN = new THREE.Color(0xd4e6ec), KEYC_OUT = new THREE.Color(0xffc48a), DUST_IN = new THREE.Color(0xcfe2e6), DUST_OUT = new THREE.Color(0xffe2b8);
let zoneExt = -1;
function applyZone(e) {
  if (Math.abs(e - zoneExt) < 1e-3) return; zoneExt = e;
  scene.fog.color.lerpColors(FOG_IN, FOG_OUT, e); scene.background.copy(scene.fog.color);
  scene.fog.density = lerp(0.026, 0.0052, e);
  hemi.color.lerpColors(HEMI_IN[0], HEMI_OUT[0], e); hemi.groundColor.lerpColors(HEMI_IN[1], HEMI_OUT[1], e); hemi.intensity = lerp(0.6, 0.95, e);
  key.color.lerpColors(KEYC_IN, KEYC_OUT, e); key.intensity = lerp(0.85, 2.3, e); keyDir.lerpVectors(KEY_IN, KEY_OUT, e).normalize();
  rim.intensity = lerp(0.7, 0.25, e);
  dustMat.color.lerpColors(DUST_IN, DUST_OUT, e); dustMat.opacity = lerp(0.5, 0.38, e);
  for (const s of pools) s.visible = e < 0.5;
  bulb.visible = bulbGlow.visible = beam.visible = e < 0.5; for (const c of beamCones) c.visible = e < 0.5;
}
