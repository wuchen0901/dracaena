
// ============================================================
//  《长夜》的灯泡，和把它揣在怀里（原型 C 先用：第十二章凿记号、第十三章机房）
//  灯泡：天上当星星用的蓄光灯泡，个头不小 —— 连灯头约 18 厘米高，灯头外面箍着一圈 8～9 厘米宽的金属套，记号凿穿在这圈套上（约 6 厘米）。
//    灯泡总是灯头朝上（和挂在天上灯座里的方向一样，原点在灯头顶上）。灯亮着，光从镂空里漏出来，记号是一个亮的形状；灯暗着，镂空是一个黑的缺口。
//    几种记号只在轮廓上不同（缺了一角的方框 / 圆 / 三角 / 尖角），不靠颜色分
//    亮度 glow：0 报废（强光也激不亮）/ 0.12 离开灯座以后的余光 / 1 接上灯座的电 / 1.5 以上被强光激亮
//  揣在怀里：平时灯泡用布包好，塞在上衣里面、肚子前头，身上看不见它，也看不见光；
//    被强光照中时，光透过布和衣服（CARRY.excite：主角这里的光有多强，章节每帧给）。
//    原来这里是一只灰模占位的斜挎包（挎在胯上、带子斜过胸前），2026-11-16 去掉了：主角身上不挂东西，侧面的剪影才干净。
//    代码里的名字还是原来的（state 'bag'、CARRY.B、bagLight …）：都指“揣在怀里”
//  CARRY.state：none 身上没有灯泡 / bag 揣在怀里 / out 拿在手上 / set 放在别处（工作台、灯座里：位置由章节给 CARRY.at）
//  CARRY.act：正在做的一段动作（out 从怀里取出、in 揣回去），由章节开始（carryStart），这里每帧往前推、算出两只手放在哪
// ============================================================
const CARRY = { bag: false, state: 'none', act: null, holdAt: null, at: null, excite: 0, power: 0, wrap: 1, spin: 0, bulb: null, B: null, light: null, bagLight: null, near: 1 };
let _carrySeed = 4242;
const crand = () => { _carrySeed = _carrySeed * 16807 % 2147483647; return _carrySeed / 2147483647; };   // 自己的随机数：不动关卡那一套

// ---- 金属套上的记号：一张绕着套子一圈的贴图，记号凿穿的地方是透明的，透出里面的芯 ----
const MARK_TEX = {};
function markTex(kind) {
  if (MARK_TEX[kind]) return MARK_TEX[kind];
  const W = 512, H = 128, [c, g] = mkCanvas(W, H);
  g.fillStyle = '#6e6656'; g.fillRect(0, 0, W, H);                                     // 旧黄铜（压暗一点：灯亮着时漏光的记号要比套子亮得多）
  for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(${crand() < 0.5 ? '38,32,24' : '214,204,172'},${0.05 + 0.1 * crand()})`; g.fillRect(crand() * W, crand() * H, 4 + 36 * crand(), 1 + 2 * crand()); }
  g.fillStyle = 'rgba(30,26,20,.55)'; g.fillRect(0, 0, W, 7); g.fillRect(0, H - 7, W, 7);   // 上下两道箍边
  g.globalCompositeOperation = 'destination-out'; g.strokeStyle = '#000'; g.lineWidth = 15; g.lineCap = 'butt'; g.lineJoin = 'miter';
  const cx = 256, cy = 64, r = 44; g.beginPath();                                      // 记号在贴图正中（套子转半圈以后正对镜头）
  if (kind === 'square') { g.moveTo(cx + r - 30, cy - r); g.lineTo(cx - r, cy - r); g.lineTo(cx - r, cy + r); g.lineTo(cx + r, cy + r); g.lineTo(cx + r, cy - r + 30); }   // 缺了右上角的方框：主角的
  else if (kind === 'circle') g.arc(cx, cy, r - 2, 0, 6.2832);
  else if (kind === 'triangle') { g.moveTo(cx, cy - r); g.lineTo(cx + r * 1.05, cy + r * 0.85); g.lineTo(cx - r * 1.05, cy + r * 0.85); g.closePath(); }
  else if (kind === 'chevron') { g.moveTo(cx - r, cy + r * 0.75); g.lineTo(cx, cy - r * 0.75); g.lineTo(cx + r, cy + r * 0.75); }   // 尖角：老人的
  g.stroke();
  return MARK_TEX[kind] = sharedTex(canvasTex(c));
}
// 平面上的同一个记号（工具上打的钢印、屏幕上的图）：白色线条，透明底
const MARK_ICON = {};
function markIcon(kind) {
  if (MARK_ICON[kind]) return MARK_ICON[kind];
  const [c, g] = mkCanvas(128, 128); g.strokeStyle = '#fff'; g.lineWidth = 15; g.lineCap = 'butt'; g.lineJoin = 'miter';
  const cx = 64, cy = 64, r = 40; g.beginPath();
  if (kind === 'square') { g.moveTo(cx + r - 27, cy - r); g.lineTo(cx - r, cy - r); g.lineTo(cx - r, cy + r); g.lineTo(cx + r, cy + r); g.lineTo(cx + r, cy - r + 27); }
  else if (kind === 'circle') g.arc(cx, cy, r - 2, 0, 6.2832);
  else if (kind === 'triangle') { g.moveTo(cx, cy - r); g.lineTo(cx + r * 1.05, cy + r * 0.85); g.lineTo(cx - r * 1.05, cy + r * 0.85); g.closePath(); }
  else if (kind === 'chevron') { g.moveTo(cx - r, cy + r * 0.75); g.lineTo(cx, cy - r * 0.75); g.lineTo(cx + r, cy + r * 0.75); }
  g.stroke();
  return MARK_ICON[kind] = sharedTex(canvasTex(c));
}

// ---- 一只灯泡。parent 挂在哪；mark 记号；o.glow 一开始多亮。set(k) 改亮度，cut(k) 记号凿出来几成（凿记号的那一下用）----
const BULB_C = { dead: new THREE.Color(0x1d1b17), res: new THREE.Color(0x7a5a30), lit: new THREE.Color(0xfff1d2), core0: new THREE.Color(0x000000), coreR: new THREE.Color(0x9a6a26), coreL: new THREE.Color(0xfff6e2) };
function makeBulb(parent, mark, o = {}) {
  const g = new THREE.Group(); parent.add(g);
  const own = m => { m.userData.own = true; return m; };
  const sMat = own(new THREE.MeshLambertMaterial({ map: mark ? markTex(mark) : null, color: mark ? 0xffffff : 0x6e6656, alphaTest: 0.5, side: THREE.DoubleSide }));
  const sleeve = add(g, new THREE.CylinderGeometry(0.043, 0.043, 0.065, 28, 1, true), sMat, 0, -0.0325, 0, false); sleeve.rotation.y = Math.PI;
  const coreMat = own(new THREE.MeshBasicMaterial({ color: 0x000000 }));
  add(g, new THREE.CylinderGeometry(0.035, 0.035, 0.063, 18), coreMat, 0, -0.0325, 0, false);           // 套子里面的芯：亮着就从记号里漏出来
  add(g, new THREE.CylinderGeometry(0.043, 0.043, 0.004, 28), MAT.steel, 0, -0.0005, 0, false);          // 套子顶上封口
  add(g, cy(0.019, 0.023, 0.016, 14), MAT.steel, 0, 0.008, 0, false);                                    // 螺口和触点
  const gMat = own(new THREE.MeshBasicMaterial({ color: 0x1d1b17, transparent: true, opacity: 0.92 }));
  const glass = add(g, new THREE.SphereGeometry(0.057, 22, 16), gMat, 0, -0.114, 0, false); glass.scale.y = 1.12;
  add(g, new THREE.CylinderGeometry(0.03, 0.043, 0.02, 20), gMat, 0, -0.072, 0, false);                 // 玻璃收进套子的那一截
  const halo = glow(g, 0xffe4b8, 0.3, 0, 0, -0.125, 0.02); halo.renderOrder = 61;    // 光晕只围着玻璃，不盖住上面的套子和记号
  const cloth = add(g, new THREE.IcosahedronGeometry(0.105, 1), own(new THREE.MeshLambertMaterial({ color: 0x8b8470 })), 0, -0.075, 0, false);   // 包着的布
  cloth.scale.set(1, 1.2, 1); cloth.visible = false;
  // 记号凿到一半：用一块和套子一样颜色的“盖子”挡住还没凿开的那一部分（只有凿记号的那一下用）
  // （记号在贴图正中，套子转了半圈，所以记号朝着 +z，也就是 theta = 0 附近那一段）
  const LID0 = -0.72, LIDW = 1.44, lidGeo = k => new THREE.CylinderGeometry(0.0436, 0.0436, 0.066, 20, 1, true, LID0 + LIDW * k, LIDW * (1 - k) + 1e-3);
  const lid = add(g, lidGeo(0), own(new THREE.MeshLambertMaterial({ color: 0x6e6656, side: THREE.DoubleSide })), 0, -0.0325, 0, false);
  lid.visible = false; let lidK = 0;
  const api = { g, glass, halo, cloth, lid, k: -1, mark,
    set(k) {
      if (Math.abs(k - api.k) < 0.002) return; api.k = k;
      if (k <= 0.12) { gMat.color.copy(BULB_C.dead).lerp(BULB_C.res, k / 0.12); coreMat.color.copy(BULB_C.core0).lerp(BULB_C.coreR, k / 0.12); }
      else { const t = clamp((k - 0.12) / 0.88, 0, 1); gMat.color.copy(BULB_C.res).lerp(BULB_C.lit, t); coreMat.color.copy(BULB_C.coreR).lerp(BULB_C.coreL, t); }
      gMat.opacity = k > 0.3 ? 1 : 0.92;
      halo.material.opacity = Math.min(1, 0.22 * sstep(0.04, 0.14, k) + 0.75 * sstep(0.2, 1, k)); halo.scale.setScalar(0.17 + 0.2 * Math.min(k, 3));
    },
    wrap(w) { cloth.visible = w > 0.02; cloth.scale.set(w, 1.2 * w, w); },
    cut(k) { lid.visible = k < 0.999; if (Math.abs(k - lidK) < 0.02 && k < 0.999 && k > 0) return; lidK = k; lid.geometry.dispose(); lid.geometry = lidGeo(clamp(k, 0, 1)); } };
  api.set(o.glow ?? 0.12);
  return api;
}

// ---- 怀里透出来的光：主角的模型载入以后挂到他身上（换外形、重新搭一遍以后自己重挂）。身上没有别的东西 ----
function buildBag(h) {
  const tv = h.B.traveler; if (!tv || !tv.group) return null;
  const g = new THREE.Group(); h.root.add(g);
  const mouth = glow(g, 0xffe8c0, 0.32, 0, 0.0, 0.0, 0.03); mouth.renderOrder = 62;
  return { g, mouth, h };
}
const _cv = [0, 1, 2, 3, 4, 5].map(() => new THREE.Vector3()), _up = new THREE.Vector3(0, 1, 0);
function placeSeg(m, a, b) {                                                           // 把一根细杆摆成从 a 到 b 的一段（机房里垂着的电线用）
  _cv[5].subVectors(b, a); const L = _cv[5].length(); m.scale.set(1, Math.max(L, 1e-3), 1);
  m.position.addVectors(a, b).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(_up, _cv[5].normalize());
}

// 开始一段动作：kind 'out' 从怀里取出（hold 最后举到哪，世界坐标 {x, y}；不给就拿在胸前）/ 'in' 揣回怀里
function carryStart(kind, hold) { CARRY.act = { kind, t: 0, T: kind === 'out' ? 1.7 : 1.3, hold: hold ?? null }; if (kind === 'out') { CARRY.state = 'out'; CARRY.wrap = 1; } fx('cloth'); }
const carryBusy = () => !!CARRY.act;

// 在 hero.update 之前：按正在做的动作，算出两只手放在哪（合进 HX.pose）
function poseCarry(dt) {
  const A = CARRY.act; if (!A && CARRY.state !== 'out') return;
  const dir = P.facing, near = dir > 0 ? 1 : 0, far = 1 - near; CARRY.near = near;
  const bagPt = { x: P.x + dir * 0.09, y: P.y + 0.6 }, chest = { x: P.x + dir * 0.21, y: P.y + 0.7 };
  const hold = (A ? A.hold : CARRY.holdAt) ?? chest;
  const L = (p, q, t) => ({ x: lerp(p.x, q.x, t), y: lerp(p.y, q.y, t) });
  const hands = [null, null]; let wrap = CARRY.wrap;
  if (A) {
    A.t += dt; const t = A.t;
    if (A.kind === 'out') {
      if (t < 0.35) hands[near] = { ...bagPt, k: sstep(0, 0.35, t) };
      else if (t < 0.7) hands[near] = { ...L(bagPt, chest, sstep(0.35, 0.7, t)), k: 1 };
      else if (t < 1.3) { hands[near] = { ...chest, k: 1 }; hands[far] = { x: chest.x + dir * 0.05, y: chest.y + 0.1, k: sstep(0.7, 0.9, t) * (1 - sstep(1.15, 1.3, t)) }; wrap = 1 - sstep(0.8, 1.2, t); }
      else hands[near] = { ...L(chest, hold, sstep(1.3, 1.7, t)), k: 1 };
      CARRY.visible = t > 0.33;
      if (t >= A.T) { CARRY.act = null; CARRY.holdAt = A.hold; wrap = 0; }
    } else {
      const from = CARRY.holdAt ?? chest;
      if (t < 0.35) hands[near] = { ...L(from, chest, sstep(0, 0.35, t)), k: 1 };
      else if (t < 0.85) { hands[near] = { ...chest, k: 1 }; hands[far] = { x: chest.x + dir * 0.05, y: chest.y + 0.1, k: sstep(0.35, 0.5, t) * (1 - sstep(0.75, 0.85, t)) }; wrap = sstep(0.4, 0.8, t); }
      else hands[near] = { ...L(chest, bagPt, sstep(0.85, 1.15, t)), k: 1 - sstep(1.15, 1.3, t) };
      CARRY.visible = t < 1.17;
      if (t >= A.T) { CARRY.act = null; CARRY.state = 'bag'; CARRY.holdAt = null; wrap = 1; }
    }
  } else { hands[near] = { ...hold, k: 1 }; CARRY.visible = true; wrap = 0; }
  CARRY.wrap = wrap;
  const q = HX.pose || {}, hs = q.hands ? q.hands.slice() : [null, null];
  for (let i = 0; i < 2; i++) if (hands[i]) hs[i] = hands[i];
  HX.pose = { ...q, hands: hs, look: q.look ?? 0 };
}

// 在 hero.update 之后：把灯泡放到手里（或者章节给的地方）；揣在怀里被强光照中时，从衣服里透出光
function stepCarry(dt) {
  const inLN = chapterAt(P.x).n >= OLD + 12 && chapterAt(P.x).grp !== 'deep';   // 灯泡只在《长夜》的章节里有（旧原型的第十二、十三章起）；工厂深处（第 25 章起）没有
  const showBag = inLN && state !== 'title';
  if (!CARRY.B || CARRY.B.h !== hero) { if (CARRY.B) { CARRY.B.g.parent?.remove(CARRY.B.g); } CARRY.B = hero.B.traveler?.group ? buildBag(hero) : null; }
  if (!CARRY.light) { CARRY.light = pointLight({ p: [0, 0, 0], c: 0xffe6c4, i: 5, d: 4, dec: 1.7, on: 0 }); CARRY.bagLight = pointLight({ p: [0, 0, 0], c: 0xffe2b6, i: 4, d: 3.2, dec: 1.7, on: 0 }); }
  const B = CARRY.B, has = CARRY.state !== 'none';
  // 灯泡揣在怀里、布包着：只有强光才透得出来
  const ex = CARRY.excite, inBag = CARRY.state === 'bag' || (CARRY.act && !CARRY.visible);
  const bagGlow = has && inBag ? sstep(0.3, 1, ex) : 0;
  CARRY.bagLight.on = 0;
  if (B) {
    B.g.visible = showBag && bagGlow > 0.01;
    if (B.g.visible) {
      const R = hero.root; R.updateMatrixWorld(true);
      const hip = R.worldToLocal(hero.B.traveler.bones.get('Hips').node.getWorldPosition(_cv[0]));
      B.g.position.set(hip.x + 0.12, hip.y + 0.07, hip.z + 0.04);                       // 肚子前头、衣服外面一点
      B.mouth.material.opacity = bagGlow; B.mouth.scale.setScalar(0.25 + 0.35 * bagGlow);
      B.g.getWorldPosition(_cv[5]); CARRY.bagLight.p = [_cv[5].x, _cv[5].y, _cv[5].z + 0.2]; CARRY.bagLight.on = bagGlow;
    }
  }
  // 灯泡
  const b = CARRY.bulb; CARRY.light.on = 0; if (!b) return;
  const vis = inLN && has && state !== 'title' && (CARRY.state === 'set' || (CARRY.state === 'out' && CARRY.visible !== false) || (CARRY.act && CARRY.visible));
  b.g.visible = vis; if (!vis) return;
  if (CARRY.state === 'set' && CARRY.at) { b.g.position.set(CARRY.at.x, CARRY.at.y, CARRY.at.z ?? 0); b.g.rotation.set(0, CARRY.spin, 0); }
  else {
    const tv = hero.B.traveler; if (!tv?.model) return;
    const side = CARRY.near ? 'Right' : 'Left', hand = tv.bones.get(side + 'Hand').node.getWorldPosition(_cv[0]), fore = tv.bones.get(side + 'ForeArm').node.getWorldPosition(_cv[1]);
    const d = _cv[2].subVectors(hand, fore).normalize();
    b.g.position.set(hand.x + d.x * 0.035, hand.y + d.y * 0.035 + 0.19, hand.z + d.z * 0.035 + 0.02); b.g.rotation.set(0, CARRY.spin, 0);
  }
  b.wrap(CARRY.wrap);
  const k = Math.max(CARRY.power, 0.12 + 1.7 * ex) * (1 - 0.92 * sstep(0.2, 0.7, CARRY.wrap));   // 布包着的时候一点光也透不出来
  b.set(k);
  if (k > 0.3) { CARRY.light.p = [b.g.position.x, b.g.position.y - 0.32, b.g.position.z + 0.35]; CARRY.light.on = clamp((k - 0.3) / 1.2, 0, 1.4); }   // 在灯泡下前方：照亮手和脸，不把套子照白
}
