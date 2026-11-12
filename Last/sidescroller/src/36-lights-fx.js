
// ============================================================
//  灯光 / 天空 / 尘埃 / 沿路渐变的环境
// ============================================================
function glowTex(stops) {
  const [c, g] = mkCanvas(128, 128), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  stops.forEach(([p, col]) => gr.addColorStop(p, col)); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  return canvasTex(c);
}
const GLOW = glowTex([[0, 'rgba(255,255,255,1)'], [0.22, 'rgba(255,255,255,.5)'], [1, 'rgba(255,255,255,0)']]);
// 大光晕用的另一张：中心一个亮核，外面一圈衰减得很慢的晕，一直淡到看不出边（上面那张放大以后，边缘是一条看得出来的圆）
const GLOW_SOFT = (() => {
  const [c, g] = mkCanvas(256, 256), im = g.createImageData(256, 256);
  for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
    const r = Math.hypot(x - 127.5, y - 127.5) / 127.5, a = r >= 1 ? 0 : 0.62 * Math.pow(1 - r, 2.6) + 0.5 * Math.exp(-r * r * 46), i = (y * 256 + x) * 4;
    im.data[i] = im.data[i + 1] = im.data[i + 2] = 255; im.data[i + 3] = Math.min(255, a * 255);
  }
  g.putImageData(im, 0, 0); return canvasTex(c);
})();
function glow(parent, color, size, opacity, x = 0, y = 0, z = 0, map = GLOW) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map, color, opacity, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  s.scale.setScalar(size); s.position.set(x, y, z); s.renderOrder = 50; parent.add(s); return s;
}

// ---- 固定的一套灯 ----
// 灯的数量从头到尾不变（数量一变，所有材质的着色器都要重新编译，画面会卡一下）。
// 各章节只是登记“这里要一盏什么样的灯”，每一帧把离镜头最近的几盏分配给下面这些真正的灯
const hemi = new THREE.HemisphereLight(0x9fb6bd, 0x1c2224, 0.6); scene.add(hemi);
const key = new THREE.DirectionalLight(0xd4e6ec, 0.85); key.castShadow = true;
key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0006; key.shadow.normalBias = 0.02;
Object.assign(key.shadow.camera, { left: -17, right: 17, top: 13, bottom: -9, near: 1, far: 110 });
scene.add(key, key.target);
const rim = new THREE.DirectionalLight(0xa9cdd8, 0.7); rim.position.set(-6, 5, -10); scene.add(rim, rim.target);
const keyDir = V3(0.22, 1, 0.32).normalize();
// 探照灯：唯一一盏带影子的聚光灯（第一章的那台机器用它）
const beam = new THREE.SpotLight(0xe2eef2, 0, 80, 0.118, 0.4, 0); beam.castShadow = true;
beam.shadow.mapSize.set(1024, 1024); beam.shadow.camera.near = 6; beam.shadow.camera.far = 40; beam.shadow.bias = -0.0015;
beam.position.set(71, 3.7, -19); scene.add(beam, beam.target);

const SPOTS = [], POINTS = [], LIGHTS = [];
for (let i = 0; i < 5; i++) { const s = new THREE.SpotLight(0xffffff, 0, 40, 0.3, 0.95, 0); scene.add(s, s.target); SPOTS.push(s); }
for (let i = 0; i < 5; i++) { const p = new THREE.PointLight(0xffffff, 0, 10, 1.6); scene.add(p); POINTS.push(p); }
// 登记一盏灯。聚光灯 { p: [x,y,z] 位置, t: [x,y,z] 照向哪里, c 颜色, i 亮度, d 距离, a 张角, pen 边缘柔和 }；
// 点光源 { p, c, i, d, dec 衰减 }。on（0..1）可以随时改，用来开关、闪烁
function spotLight(o) { o.spot = true; o.c = new THREE.Color(o.c ?? 0xcfe6ee); o.i ??= 3.1; o.d ??= 40; o.a ??= 0.3; o.pen ??= 0.95; o.on ??= 1; LIGHTS.push(o); return o; }
function pointLight(o) { o.c = new THREE.Color(o.c ?? 0xffffff); o.i ??= 4; o.d ??= 10; o.dec ??= 1.6; o.on ??= 1; LIGHTS.push(o); return o; }
function assignLights(cx) {                              // 越远越暗，暗到零以后才换手，所以看不出来
  let si = 0, pi = 0;
  const near = LIGHTS.filter(l => l.on > 0.001 && Math.abs(l.p[0] - cx) < 36).sort((a, b) => Math.abs(a.p[0] - cx) - Math.abs(b.p[0] - cx));
  for (const l of near) {
    const f = sstep(36, 25, Math.abs(l.p[0] - cx)) * l.on;
    if (l.spot) { if (si >= SPOTS.length) continue; const s = SPOTS[si++]; s.position.set(l.p[0], l.p[1], l.p[2]); s.target.position.set(l.t[0], l.t[1], l.t[2]); s.color.copy(l.c); s.intensity = l.i * f; s.distance = l.d; s.angle = l.a; s.penumbra = l.pen; }
    else { if (pi >= POINTS.length) continue; const p = POINTS[pi++]; p.position.set(l.p[0], l.p[1], l.p[2]); p.color.copy(l.c); p.intensity = l.i * f; p.distance = l.d; p.decay = l.dec; }
  }
  for (; si < SPOTS.length; si++) SPOTS[si].intensity = 0;
  for (; pi < POINTS.length; pi++) POINTS[pi].intensity = 0;
}

// ---- 环境：沿着 x 的一串关键点，镜头走到哪里就取哪里的插值。没写的项沿用上一个关键点 ----
// fog 雾色 / fogD 雾的浓度 / hemi* 环境光 / key* 主光 / rim* 轮廓光 / dust* 尘埃 / wind 风 / ext 室外程度（0..1，管声音和门口的光）
// sky 六个颜色：从天顶到地平线再到地平线以下 / sun* 太阳的位置、颜色、强度 / stars 星星 / cloud 云 / birds 鸟叫 / flies 萤火虫 /
// vig 画面四角的暗角有多重（1 = 平常；明亮的章节放轻一些）
const ENV0 = { fog: 0x25343a, fogD: 0.026, hemiS: 0x9fb6bd, hemiG: 0x1c2224, hemiI: 0.6, keyC: 0xd4e6ec, keyI: 0.85, keyDir: [0.22, 1, 0.32], rimC: 0xa9cdd8, rimI: 0.7,
  dustC: 0xcfe2e6, dustO: 0.5, wind: 0.04, ext: 0, sky: [0x2d3d46, 0x5d7074, 0xa99a82, 0xe2b680, 0xf1c88b, 0xa37d5c], sunX: 0.36, sunY: 0.04, sunC: 0xfff0cd, sunP: 0,
  stars: 0, cloud: 0, cloudC: 0xffe1be, birds: 0, flies: 0, vig: 1 };
const ENV_NUM = ['fogD', 'hemiI', 'keyI', 'rimI', 'dustO', 'wind', 'ext', 'sunX', 'sunY', 'sunP', 'stars', 'cloud', 'birds', 'flies', 'vig'];
const ENV_COL = ['fog', 'hemiS', 'hemiG', 'keyC', 'rimC', 'dustC'], ENV_RAW = ['sunC', 'cloudC'];
const ENVKEYS = [];
function env(x, o = {}) {
  const prev = ENVKEYS[ENVKEYS.length - 1], raw = { ...(prev ? prev.raw : ENV0), ...o }, k = { x, raw };
  for (const f of ENV_NUM) k[f] = raw[f];
  for (const f of ENV_COL) k[f] = new THREE.Color(raw[f]);
  for (const f of ENV_RAW) k[f] = hex3(raw[f]);
  k.sky = raw.sky.map(hex3); k.keyDir = V3(...raw.keyDir).normalize();
  ENVKEYS.push(k); return k;
}
const E = { sky: [0, 1, 2, 3, 4, 5].map(() => [0, 0, 0]), sunC: [0, 0, 0], cloudC: [0, 0, 0], keyDir: V3(0, 1, 0), ext: 0 };
for (const f of ENV_COL) E[f] = new THREE.Color();
let envMod = null;                                       // 结局用：在插值结果上再改一道（比如让天慢慢黑下来）
let vigNow = 1;                                          // 暗角那一层网页元素现在的不透明度
function applyEnv(x) {
  let i = 1; while (i < ENVKEYS.length - 1 && x > ENVKEYS[i].x) i++;
  const a = ENVKEYS[i - 1], b = ENVKEYS[i], t = clamp((x - a.x) / (b.x - a.x), 0, 1);
  for (const f of ENV_NUM) E[f] = lerp(a[f], b[f], t);
  for (const f of ENV_COL) E[f].lerpColors(a[f], b[f], t);
  for (const f of ENV_RAW) for (let j = 0; j < 3; j++) E[f][j] = lerp(a[f][j], b[f][j], t);
  for (let s = 0; s < 6; s++) for (let j = 0; j < 3; j++) E.sky[s][j] = lerp(a.sky[s][j], b.sky[s][j], t);
  E.keyDir.lerpVectors(a.keyDir, b.keyDir, t).normalize();
  if (envMod) envMod(E);
  scene.fog.color.copy(E.fog); scene.background.copy(E.fog); scene.fog.density = E.fogD;
  hemi.color.copy(E.hemiS); hemi.groundColor.copy(E.hemiG); hemi.intensity = E.hemiI;
  key.color.copy(E.keyC); key.intensity = E.keyI; keyDir.copy(E.keyDir);
  rim.color.copy(E.rimC); rim.intensity = E.rimI;
  dustMat.color.copy(E.dustC); dustMat.opacity = E.dustO;
  if (Math.abs(E.vig - vigNow) > 0.002) $('vig').style.opacity = vigNow = E.vig;
}

// ---- 天空：一块永远铺满屏幕、画在最底下的面。颜色只跟视线的仰角有关，所以走多远都不会“走出”天空 ----
const skyU = { uTan: { value: new THREE.Vector2(1, 1) }, uPitch: { value: -0.05 }, uAz: { value: 0 }, uC: { value: [0, 1, 2, 3, 4, 5].map(() => V3()) },
  uSun: { value: new THREE.Vector4(0.36, 0.04, 0, 0.44) }, uSunC: { value: V3() }, uStars: { value: 0 }, uCloud: { value: 0 }, uCloudC: { value: V3() },
  uTex: { value: null }, uCamX: { value: 0 }, uT: { value: 0 } };
{ // 薄云：一张可以横向平铺的贴图，上面是一道道很淡的长条
  const [c, g] = mkCanvas(1024, 256); g.fillStyle = '#000'; g.fillRect(0, 0, 1024, 256);
  for (let i = 0; i < 46; i++) {
    const x = rr(0, 1024), y = rr(20, 236), w = rr(120, 420), h = rr(2, 9), a = rr(0.1, 0.36);
    for (const ox of [-1024, 0, 1024]) { const gr = g.createRadialGradient(x + ox, y, 0, x + ox, y, w / 2); gr.addColorStop(0, `rgba(255,255,255,${a})`); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.save(); g.translate(0, y); g.scale(1, h / (w / 2)); g.translate(0, -y); g.fillStyle = gr; g.fillRect(x + ox - w / 2, y - w / 2, w, w); g.restore(); }
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = THREE.RepeatWrapping; t.colorSpace = THREE.NoColorSpace; skyU.uTex.value = t;
}
const sky = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ uniforms: skyU, depthTest: false, depthWrite: false, fog: false, toneMapped: false,
  vertexShader: 'varying vec2 vN; void main() { vN = position.xy; gl_Position = vec4(position.xy, 1.0, 1.0); }',
  fragmentShader: `
    varying vec2 vN; uniform vec2 uTan; uniform float uPitch, uAz, uStars, uCloud, uCamX, uT; uniform vec3 uC[6]; uniform vec4 uSun; uniform vec3 uSunC, uCloudC; uniform sampler2D uTex;
    void main() {
      vec2 q = vec2(vN.x * uTan.x + uAz, vN.y * uTan.y + uPitch);      // 视线方向的正切：q.y = 0 就是地平线
      float e = q.y;
      vec3 col = e > .34 ? mix(uC[1], uC[0], clamp((e - .34) / .26, 0., 1.)) : e > .17 ? mix(uC[2], uC[1], (e - .17) / .17) : e > .07 ? mix(uC[3], uC[2], (e - .07) / .1)
        : e > 0. ? mix(uC[4], uC[3], e / .07) : mix(uC[4], uC[5], clamp(-e / .14, 0., 1.));
      float cl = texture2D(uTex, vec2(q.x * .32 + uCamX * .00035, clamp(e * 1.9 + .08, 0., 1.))).r * smoothstep(-.02, .06, e);
      col = mix(col, uCloudC, clamp(cl * uCloud, 0., 1.));
      float r = length(q - uSun.xy) / uSun.w;
      float a = .95 * exp(-r * r * 180.) + .6 * exp(-r * 9.) + .35 * exp(-r * 2.2);
      col = mix(col, uSunC, clamp(a * uSun.z, 0., 1.));
      vec2 gq = q * 110.; vec2 id = floor(gq); vec2 f = fract(gq) - .5; float h = fract(sin(dot(id, vec2(127.1, 311.7))) * 43758.5453);
      float st = step(.972, h) * smoothstep(.16, .0, length(f + (vec2(fract(h * 37.), fract(h * 91.)) - .5) * .5)) * (.55 + .45 * sin(uT * (1. + h * 3.) + h * 40.));
      col += uStars * st * smoothstep(.02, .22, e) * vec3(.85, .92, 1.);
      gl_FragColor = vec4(col, 1.);
    }` }));
sky.frustumCulled = false; sky.renderOrder = -5000; scene.add(sky);
function updateSky(t, az) {
  const th = Math.tan(camera.fov * Math.PI / 360);
  skyU.uTan.value.set(th * camera.aspect, th); skyU.uAz.value = -az; skyU.uT.value = t; skyU.uCamX.value = camera.position.x;
  for (let i = 0; i < 6; i++) skyU.uC.value[i].set(...E.sky[i]);
  skyU.uSun.value.set(E.sunX, E.sunY, E.sunP, 0.44); skyU.uSunC.value.set(...E.sunC);
  skyU.uStars.value = E.stars; skyU.uCloud.value = E.cloud; skyU.uCloudC.value.set(...E.cloudC);
}

// ---- 空气里的尘埃（跟着镜头走）----
const DUST_N = 520, dustPos = new Float32Array(DUST_N * 3), dustVel = [];
for (let i = 0; i < DUST_N; i++) {
  dustPos.set([rr(-24, 24), rr(-0.5, 11), rr(-10, 7)], i * 3);
  dustVel.push([rr(-0.12, 0.12), rr(-0.07, 0.03), rr(0.4, 1.6)]);        // [vx, vy, 相位]
}
const dustGeo = new THREE.BufferGeometry(); dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
const dustMat = new THREE.PointsMaterial({ map: GLOW, color: 0xcfe2e6, size: 0.085, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
const dust = new THREE.Points(dustGeo, dustMat); dust.frustumCulled = false; dust.renderOrder = 45; scene.add(dust);
function updateDust(dt, t, camX, camY, wind) {
  for (let i = 0; i < DUST_N; i++) {
    const v = dustVel[i], j = i * 3;
    let x = dustPos[j] + (v[0] + wind) * dt + Math.sin(t * v[2] + i) * 0.0016, y = dustPos[j + 1] + v[1] * dt;
    if (x < camX - 24) x += 48; else if (x > camX + 24) x -= 48;
    if (y < camY - 3) y += 12; else if (y > camY + 9) y -= 12;
    dustPos[j] = x; dustPos[j + 1] = y;
  }
  dustGeo.attributes.position.needsUpdate = true;
}
// ---- 萤火虫：两组错开明灭的光点，只在夜里出现 ----
const flies = [0, 1].map(k => {
  const n = 46, pos = new Float32Array(n * 3), ph = [];
  for (let i = 0; i < n; i++) { pos.set([rr(-20, 20), rr(0.2, 4.5), rr(-9, 4)], i * 3); ph.push([rr(0, 6.28), rr(0.3, 0.9), rr(0.2, 0.7)]); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({ map: GLOW, color: 0xd9f08a, size: 0.2, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; pts.renderOrder = 46; pts.visible = false; scene.add(pts);
  return { pos, ph, geo, mat, pts, k };
});
function updateFlies(dt, t, camX, baseY, amount) {
  for (const F of flies) {
    F.pts.visible = amount > 0.01; if (!F.pts.visible) continue;
    F.mat.opacity = amount * (0.35 + 0.65 * Math.max(0, Math.sin(t * 1.3 + F.k * Math.PI)));
    for (let i = 0; i < F.ph.length; i++) {
      const p = F.ph[i], j = i * 3;
      let x = F.pos[j] + Math.sin(t * p[1] + p[0]) * p[2] * dt, y = F.pos[j + 1] + Math.cos(t * p[1] * 1.3 + p[0]) * 0.3 * dt;
      if (x < camX - 20) x += 40; else if (x > camX + 20) x -= 40;
      F.pos[j] = x; F.pos[j + 1] = clamp(y, baseY + 0.2, baseY + 5);
    }
    F.geo.attributes.position.needsUpdate = true;
  }
}
