
// ============================================================
//  配角的现成模型（2026-11-16）
//  路上的人原来都是拿圆柱、圆球搭出来的（40-character-build.js 的 buildBody、escape/60-kit.js 的“小人”）。
//  这里把他们换成带骨架的现成模型：动作还是原来那一套（每帧现算的角度），只是不再摆圆柱，改成转模型的骨头。
//  模型是 Quaternius 的 Ultimate Modular Men / Women（CC0），文件在 Last/models/cast/（来源、授权、怎么再加一个见那里的 README.md）。
//  谁用哪个模型、穿什么颜色，在下面的 CAST_ROLE 里改。
//  地址后面加 ?cast=0 回到原来搭出来的人（对比用）。模型没读到的时候也是原来的人：先画搭出来的，模型到了再换上去。
// ============================================================
const CAST_ON = new URLSearchParams(location.search).get('cast') !== '0';
// 模型的每一块按“是什么”分成几类，上色的时候一类一个颜色（同一个模型换一套颜色就是另一个人）：
//   keep 不动（眼睛、面罩）/ skin 皮肤 / hair 头发、眉毛、胡子 / top 上衣 / leg 裤子、裙子 / shoe 鞋 / gear 头上戴的（头盔、帽子）/ top2 上衣上的第二种颜色（衬衫、背心、领带）
// 哪一块是哪一类，照网格的名字（Head / Body / Legs / Feet）和材质的名字猜（castPart）；猜不对的在 CAST_LIB 里写明：'哪一块/材质名' → 哪一类
const CAST_PARTS = ['keep', 'skin', 'hair', 'top', 'leg', 'shoe', 'gear', 'top2'];
const CAST_LIB = {
  'woman-formal.glb': { parts: { 'head/Red': 'hair', 'body/LimeGreen': 'top', 'legs/LimeGreen': 'top', 'feet/Red': 'shoe' } },   // 红头发、一条连衣裙
  'farmer.glb': { parts: { 'body/LightBlue': 'leg' } },                                                                      // 背带裤：胸前那一块跟着裤子
};
// 谁用哪个模型。小人按 kind 分（guard 看守 / gray、worn 劳动者 / civ 刚被抓来的人 / body 尸体），旧原型的路人按 SKINS 里的字母。
// file 写几个就轮着用。look(c)：这个人各类的颜色（没写的那一类用模型自己的，all 是模型自己的颜色整个乘上的一个颜色）；c 是这个人原来的颜色（小人的 f.col，路人的 SKINS）
const CAST_CIV = ['casual.glb', 'woman-casual.glb', 'hoodie.glb', 'woman-suit.glb', 'suit.glb', 'woman-formal.glb'];
const CAST_UNIFORM = ['casual.glb', 'woman-casual.glb', 'suit.glb', 'woman-suit.glb'];        // 穿长裤的几个：工服是一整身
const CAST_ROLE = {
  // 看守：SWAT 的制服、头盔、面罩，看不见脸。模型自己的灰蓝迷彩整个压暗（all），远看还是一个深色的人影
  guard: { file: ['swat.glb'], look: c => ({ all: 0x8e949a, skin: 0x8a7868 }) },
  // 劳动者：从头到脚同一身灰色工服
  gray: { file: CAST_UNIFORM, look: c => ({ skin: c.skin, hair: c.hair, top: c.top, top2: c.top, leg: c.leg, shoe: c.shoe, gear: c.top }) },
  worn: { file: CAST_UNIFORM, look: c => ({ skin: c.skin, hair: c.hair, top: c.top, top2: c.top, leg: c.leg, shoe: c.shoe, gear: c.top }) },
  // 尸体：工服剥掉了，只剩白色内衣，光着脚
  body: { file: CAST_CIV, look: c => ({ skin: c.skin, hair: c.hair, top: c.top, top2: c.top, leg: c.leg, shoe: c.skin, gear: c.hair }) },
  // 刚被抓来的人：各人各色的衣服
  civ: { file: CAST_CIV, look: c => ({ skin: c.skin, hair: c.hair, top: c.top, leg: c.leg, shoe: c.shoe }) },
  // 旧原型的路人（颜色都照 SKINS 里原来的，压得很灰）
  W: { file: ['worker.glb'], look: c => ({ skin: c.skin, hair: c.hair, top: c.top, top2: 0x8a6a3a, leg: c.leg, shoe: c.shoe, gear: 0x9a8a4a }) },   // 登记劳工：安全帽、背心
  E: { file: ['suit.glb'], look: c => ({ skin: c.skin, hair: c.hair, top: c.top, top2: 0x8c877a, leg: c.leg, shoe: c.shoe }) },                     // 拄杖的老人：花白头发
  G: { file: ['farmer.glb'], look: c => ({ skin: c.skin, hair: c.hair, top: c.top, top2: c.top, leg: c.leg, shoe: c.shoe, gear: 0x6a6558 }) },      // 照看机器人的老人：草帽、背带裤、手套
  S: { file: ['hoodie.glb'], look: c => ({ skin: c.skin, hair: c.hair, top: c.top, leg: c.leg, shoe: c.shoe }) },                                   // 废城里的幸存者
  N: { file: ['woman-casual.glb'], look: c => ({ skin: c.skin, hair: c.hair, top: c.top, leg: c.leg, shoe: c.shoe }) },                             // 街区的居民
};
function castRole(kind, n, col) {                         // n：这个人自己的一个固定的数，同一种人里挑哪个模型用
  const r = CAST_ON ? CAST_ROLE[kind] : null; if (!r) return null;
  return { file: r.file[Math.floor(Math.abs(n)) % r.file.length], look: r.look(col) };
}
const figRole = f => castRole(f.kind, f.seed * 7.3, f.col);
// 小人里谁用模型：镜头左右 CAST_NEAR 米以内的，最多 CAST_MAX 个（地址后面加 ?castmax=60 可以改；见 escape/60-kit.js 的 mkCrowd）
const CAST_NEAR = 24, CAST_MAX = +(new URLSearchParams(location.search).get('castmax') ?? 36);
const CAST = new Map();                                   // 文件名 → { state: 1 在读 / 2 读好了 / -1 读不到, tpl, wait: [] }
const CAST_ARM_OUT = 0.13;                                // 垂手站着时手臂往外张开多少（弧度）：贴着身子会插进衣服里

// ---- 骨头的名字：各家的叫法不一样，都改成主角骨架的叫法（Hips / Spine02 → Spine01 → Spine / neck / Head / LeftArm …）----
// 脊椎不看名字、看位置：从胯往上到脖子之间的几节，最下面一节是 Spine02，最上面一节是 Spine（主角的脊椎是倒着编号的）
const CAST_BONE = { hips: 'Hips', pelvis: 'Hips', neck: 'neck', neck1: 'neck', neck01: 'neck', head: 'Head' };
const CAST_LIMB = { shoulder: 'Shoulder', clavicle: 'Shoulder', arm: 'Arm', upperarm: 'Arm', forearm: 'ForeArm', lowerarm: 'ForeArm', hand: 'Hand', wrist: 'Hand', fist: 'Hand',
  upleg: 'UpLeg', upperleg: 'UpLeg', thigh: 'UpLeg', leg: 'Leg', lowerleg: 'Leg', calf: 'Leg', shin: 'Leg', foot: 'Foot', toebase: 'ToeBase', toe: 'ToeBase', toes: 'ToeBase' };
function castBoneName(raw) {
  let n = raw.replace(/^mixamorig\d*:?/i, ''), side = '', m;
  if ((m = n.match(/^(left|right)[._ -]?(.+)$/i))) { side = m[1]; n = m[2]; }
  else if ((m = n.match(/^(.+?)[._ -]?(left|right)$/i))) { side = m[2]; n = m[1]; }
  else if ((m = n.match(/^(.+)[._ -]([lr])$/i))) { side = m[2]; n = m[1]; }
  else if ((m = n.match(/^(.+[a-z])([LR])$/))) { side = m[2]; n = m[1]; }       // UpperArmL：GLTFLoader 读进来时把名字里的点去掉了（原来是 UpperArm.L）
  const k = n.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (side) return CAST_LIMB[k] ? (/^l/i.test(side) ? 'Left' : 'Right') + CAST_LIMB[k] : null;
  return CAST_BONE[k] ?? null;
}
function castRename(src) {
  const by = new Map(), below = (b, a) => { for (let p = b.parent; p; p = p.parent) if (p === a) return true; return false; };
  src.traverse(o => { if (!o.isBone) return; const n = castBoneName(o.name); if (n && !by.has(n)) { o.name = n; by.set(n, o); } });
  const hips = by.get('Hips'), top = by.get('neck') ?? by.get('Head');
  if (hips && top) {                                      // 脊椎：从脖子往下数到胯
    const chain = []; for (let b = top.parent; b && b !== hips && b.isBone; b = b.parent) chain.unshift(b);
    const pick = chain.length >= 3 ? [chain[0], chain[chain.length >> 1], chain[chain.length - 1]] : chain.length === 2 ? [chain[0], null, chain[1]] : [null, null, chain[0]];
    ['Spine02', 'Spine01', 'Spine'].forEach((n, i) => { if (pick[i]) { pick[i].name = n; by.set(n, pick[i]); } });
  }
  // Quaternius 的骨架是给动画软件用的：大腿挂在胯的上一级，脚是单独的一节（反向运动学的目标），不跟着小腿。
  // 游戏里是一节带一节地转，所以把大腿挂回胯上、脚挂回小腿上（位置不变）
  src.updateMatrixWorld(true);
  for (const s of ['Left', 'Right']) {
    const up = by.get(s + 'UpLeg'), leg = by.get(s + 'Leg'), foot = by.get(s + 'Foot');
    if (hips && up && !below(up, hips)) hips.attach(up);
    if (leg && foot && !below(foot, leg)) leg.attach(foot);
  }
  return by;
}

// ---- 哪一块是哪一类（返回 CAST_PARTS 里的序号）。region：head / body / legs / feet；main：这一块里除了皮肤以外顶点最多的材质 ----
function castPart(def, region, mat, main) {
  const fix = def.parts?.[region + '/' + mat]; if (fix) return CAST_PARTS.indexOf(fix);
  if (/^skin/i.test(mat)) return 1;
  if (/^(hair|eyebrow|moustache|beard)/i.test(mat) || (region === 'head' && /^brown$/i.test(mat))) return 2;
  if (/^(eye|visor)/i.test(mat)) return 0;
  return region === 'head' ? 6 : region === 'feet' ? 5 : region === 'legs' ? 4 : region === 'body' ? (mat === main ? 3 : 7) : 0;
}
// ---- 一个人的几块网格（头、身子、腿、脚，每块又按材质分成几片，一共十来片）并成一块：一个人只画一次。
//      每个顶点记下原来的颜色（color）和它是哪一类（castPart），上色在着色器里做（castLookMat）----
function castMerge(src, def) {
  const meshes = []; src.traverse(o => { if (o.isSkinnedMesh) meshes.push(o); });
  if (!meshes.length) throw new Error('模型里没有带骨架的网格');
  if (meshes.some(m => m.material.map)) throw new Error('只支持不带贴图、一块一个颜色的模型');
  const regionOf = m => { const n = m.name + '|' + (m.parent?.name ?? ''); return /head/i.test(n) ? 'head' : /feet|shoe/i.test(n) ? 'feet' : /legs|pants/i.test(n) ? 'legs' : /body|torso/i.test(n) ? 'body' : ''; };
  const main = {}; for (const m of meshes) { const r = regionOf(m), n = m.geometry.attributes.position.count; if (/^skin/i.test(m.material.name)) continue; if (!main[r] || n > main[r][1]) main[r] = [m.material.name, n]; }
  const ref = meshes[0].skeleton, at = new Map(ref.bones.map((b, i) => [b, i]));
  const P = [], N = [], SI = [], SW = [], C = [], PT = [], IX = [], v = new THREE.Vector3(), M = new THREE.Matrix4(), NM = new THREE.Matrix3();
  for (const m of meshes) {
    const g = m.geometry, A = g.attributes, sk = m.skeleton, base = P.length / 3, col = m.material.color, r = regionOf(m), part = castPart(def, r, m.material.name, main[r]?.[0]);
    const map = sk.bones.map(b => at.get(b)); if (map.some(i => i === undefined)) throw new Error('几块网格用的不是同一副骨架');
    M.copy(ref.boneInverses[map[0]]).invert().multiply(sk.boneInverses[0]); NM.getNormalMatrix(M);       // 这一块的绑定姿势换到第一块的坐标里（一般就是单位矩阵）
    for (let i = 0; i < A.position.count; i++) {
      v.fromBufferAttribute(A.position, i).applyMatrix4(M); P.push(v.x, v.y, v.z);
      v.fromBufferAttribute(A.normal, i).applyMatrix3(NM).normalize(); N.push(v.x, v.y, v.z);
      SI.push(map[A.skinIndex.getX(i)], map[A.skinIndex.getY(i)], map[A.skinIndex.getZ(i)], map[A.skinIndex.getW(i)]);
      SW.push(A.skinWeight.getX(i), A.skinWeight.getY(i), A.skinWeight.getZ(i), A.skinWeight.getW(i));
      C.push(col.r, col.g, col.b); PT.push(part);
    }
    if (g.index) for (let i = 0; i < g.index.count; i++) IX.push(base + g.index.getX(i)); else for (let i = 0; i < A.position.count; i++) IX.push(base + i);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(SI, 4)); geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(SW, 4));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); geo.setAttribute('castPart', new THREE.Float32BufferAttribute(PT, 1));
  geo.setIndex(IX); geo.userData.shared = true;                           // 所有克隆共用：哪一章卸载都不释放（38-stream.js 的 disposeTree）
  const mesh = new THREE.SkinnedMesh(geo, castLookMat(null));
  mesh.name = 'cast'; mesh.frustumCulled = false; mesh.castShadow = true; mesh.receiveShadow = true; mesh.userData.travelerShared = true;
  for (const m of meshes) { const p = m.parent; p.remove(m); m.geometry.dispose(); m.skeleton.dispose(); if (p !== src && !p.children.length) p.parent?.remove(p); }
  src.add(mesh); mesh.bind(new THREE.Skeleton(ref.bones, ref.boneInverses.map(b => b.clone())), new THREE.Matrix4());
  return mesh;
}
// 一套颜色一个材质（穿一样衣服的人共用）。只有漫反射，带一点自发光：场景再暗身体也不会掉成一团黑（和小人的 figMat 一样）
const CAST_MAT = new Map(), CAST_STICK = { geo: null, mat: null };       // 棍子：所有看守共用一个网格
function castLookMat(look) {
  const key = look ? [...CAST_PARTS, 'all'].map(p => look[p] ?? '').join(',') : '';
  let m = CAST_MAT.get(key); if (m) return m;
  const pal = CAST_PARTS.map(p => new THREE.Color(look?.[p] ?? 0)), use = CAST_PARTS.map(p => look?.[p] !== undefined ? 1 : 0), all = new THREE.Color(look?.all ?? 0xffffff);
  m = new THREE.MeshLambertMaterial({ vertexColors: true });
  m.onBeforeCompile = sh => {
    sh.uniforms.castPal = { value: pal }; sh.uniforms.castUse = { value: use }; sh.uniforms.castAll = { value: all };
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float castPart;\nuniform vec3 castPal[8];\nuniform float castUse[8];\nuniform vec3 castAll;')
      .replace('#include <color_vertex>', '#include <color_vertex>\n\t{ int cp = int(castPart + 0.5); vColor.rgb = mix(vColor.rgb * castAll, castPal[cp], castUse[cp]); }');
    sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n\ttotalEmissiveRadiance += diffuseColor.rgb * 0.2;');
  };
  m.customProgramCacheKey = () => 'cast-pal-1';
  CAST_MAT.set(key, m); return m;
}

// ---- 读进来以后整理一遍，存成“样板”：以后要几个人就照样板克隆几个 ----
//   1 骨头改名、改挂法；2 两只手臂从斜着张开（A 字、T 字站姿）放下来，垂在身子两边 —— 游戏里的角度都是“比垂手站着多转多少”；
//   3 网格并成一块；4 套两层：root 用小人的坐标（面朝 +x，脚底在 0，身高 1），model 是转过 90 度、缩放过的那一层；
//   5 每节要转的骨头记下两样：垂手站着时的朝向 rest，还有“在侧面里转”的那根轴在它父节点坐标里是哪个方向 ax
//     （小人的骨头都只绕这根轴转，所以父节点怎么转，这根轴在父节点坐标里的方向都不变 —— 摆姿势的时候不用再量世界坐标）
const CAST_DRIVE = ['Hips', 'Spine02', 'Spine01', 'Spine', 'neck', 'Head', ...['Left', 'Right'].flatMap(s => ['Arm', 'ForeArm', 'UpLeg', 'Leg', 'Foot'].map(n => s + n))];
function castPrep(src, def) {
  const V = () => new THREE.Vector3(), Q = () => new THREE.Quaternion();
  const model = new THREE.Group(), root = new THREE.Group(); model.add(src); model.rotation.y = Math.PI / 2; root.add(model);
  const B = castRename(src);
  for (const n of ['Hips', 'Head', 'LeftArm', 'LeftForeArm', 'RightArm', 'RightForeArm', 'LeftUpLeg', 'LeftLeg', 'RightUpLeg', 'RightLeg']) if (!B.has(n)) throw new Error('模型里找不到骨头 ' + n);
  root.updateMatrixWorld(true);
  const aim = (b, c, dir) => {                             // 把骨头 b 转到“指向子节点 c 的方向 = dir”
    const d = c.getWorldPosition(V()).sub(b.getWorldPosition(V())).normalize(), w = Q().setFromUnitVectors(d, dir).multiply(b.getWorldQuaternion(Q()));
    b.quaternion.copy(b.parent.getWorldQuaternion(Q()).invert().multiply(w)); b.updateMatrixWorld(true);
  };
  const hz = B.get('Hips').getWorldPosition(V()).z;
  for (const s of ['Left', 'Right']) {
    const arm = B.get(s + 'Arm'), fore = B.get(s + 'ForeArm'), hand = B.get(s + 'Hand') ?? fore.children.find(c => c.isBone);
    const sz = Math.sign(arm.getWorldPosition(V()).z - hz) || 1, dir = V().set(0, -Math.cos(CAST_ARM_OUT), sz * Math.sin(CAST_ARM_OUT));
    aim(arm, fore, dir); if (hand) aim(fore, hand, dir);
  }
  const mesh = castMerge(src, def);
  root.updateMatrixWorld(true); mesh.skeleton.update(); mesh.computeBoundingBox();
  const box = mesh.boundingBox.clone().applyMatrix4(mesh.matrixWorld), k = 1 / Math.max(1e-6, box.max.y - box.min.y), hp = B.get('Hips').getWorldPosition(V());
  model.scale.setScalar(k); model.position.set(-hp.x * k, -box.min.y * k, -hp.z * k); model.userData.y0 = model.position.y;
  root.updateMatrixWorld(true);
  const rig = new Map(), zAx = V().set(0, 0, 1);
  for (const n of CAST_DRIVE) { const b = B.get(n); if (b) rig.set(n, { rest: b.quaternion.clone(), ax: zAx.clone().applyQuaternion(b.parent.getWorldQuaternion(Q()).invert()).normalize() }); }
  const y = n => B.get(n)?.getWorldPosition(V()).y;
  // 看守手里的棍子：挂在右手那节骨头上。垂手站着时棍子的样子照小人的摆（从手里往前伸，见 60-kit.js 的 stick），换算成右手骨头里的坐标
  const hand = B.get('RightHand'); let stick = null;
  if (hand) { const hw = hand.getWorldPosition(V()); stick = new THREE.Matrix4().makeRotationZ(1.35).setPosition(hw.x, hw.y - 0.035, hw.z).premultiply(hand.matrixWorld.clone().invert()); }
  return { def, root, rig, hipH: y('Hips'), footY: y('LeftFoot') ?? 0.05, stick };
}
function castLoad(file, done) {
  let e = CAST.get(file);
  if (!e) {
    CAST.set(file, e = { state: 1, tpl: null, wait: [] });
    new GLTFLoader().load(new URL('models/cast/' + file, import.meta.url).href, gltf => {
      try { e.tpl = castPrep(gltf.scene, CAST_LIB[file] ?? {}); e.state = 2; } catch (err) { console.warn('配角模型 ' + file + ' 用不了，还用搭出来的人', err); e.state = -1; }
      for (const f of e.wait.splice(0)) if (e.state === 2) f(e.tpl);
    }, undefined, err => { console.warn('配角模型 ' + file + ' 读不到，还用搭出来的人', err); e.state = -1; e.wait.length = 0; });
  }
  if (e.state === 2) done(e.tpl); else if (e.state === 1) e.wait.push(done);
}
// 照样板克隆一个人，穿上 look 这一套颜色。返回 { root 挂到场景里的那一层（小人的坐标：面朝 +x、身高 1）, tilt 往后放倒时转的那一层（原点在胯上）, model, bones, tpl }
function castSpawn(tpl, look, o = {}) {
  const root = cloneSkeleton(tpl.root), model = root.children[0], bones = new Map(), mat = castLookMat(look);
  root.traverse(n => { if (n.isBone && !bones.has(n.name)) bones.set(n.name, n); if (n.isSkinnedMesh) n.material = mat; });
  const tilt = new THREE.Group(); root.remove(model); tilt.add(model); root.add(tilt);
  tilt.position.y = tpl.hipH; model.position.y = model.userData.y0 - tpl.hipH;
  const inst = { root, tilt, model, bones, tpl, stick: null };
  if (o.stick && tpl.stick && bones.has('RightHand')) {
    if (!CAST_STICK.geo) { CAST_STICK.geo = new THREE.CylinderGeometry(0.011, 0.011, 0.5, 6).translate(0, -0.2, 0); CAST_STICK.geo.userData.shared = true; CAST_STICK.mat = lam(0x0c0e0f); }
    const m = new THREE.Mesh(CAST_STICK.geo, CAST_STICK.mat); tpl.stick.decompose(m.position, m.quaternion, m.scale); bones.get('RightHand').add(m); inst.stick = m;
  }
  return inst;
}

// ---- 小人（escape/60-kit.js）的姿势 → 模型的骨头 ----
// 小人的角度：drop 胯降多少、tilt 整个人往后放倒、lean 上身前倾、head 低头、a / b 肩和肘、th / kn / ft 胯、膝、脚踝（见 60-kit.js 的 FIG_ACT）。
// 上身前倾：一半多在胯上（骨盆往前倾，两条大腿反着补回来），剩下的分给几节脊椎，背是圆的
const _cq = new THREE.Quaternion();
function castTurn(inst, name, a) {                         // 这节骨头比垂手站着多转 a（在侧面里：正的是往前抬）
  const b = inst.bones.get(name), r = inst.tpl.rig.get(name); if (!b || !r) return false;
  b.quaternion.copy(r.rest).premultiply(_cq.setFromAxisAngle(r.ax, a)); return true;
}
function castPose(inst, f) {
  const p = f.p, T = inst.tpl, lie = Math.min(1, Math.abs(p.tilt) / 1.5708), k = T.hipH / FG.hipY;
  inst.root.position.set(f.x, f.y, f.z); inst.root.rotation.y = f.yaw; inst.root.scale.setScalar(f.H);
  inst.tilt.position.y = lerp(T.hipH - p.drop * k, 0.1, lie); inst.tilt.rotation.z = p.tilt;
  const hipK = 0.55, sp = ['Spine02', 'Spine01', 'Spine'].filter(n => inst.bones.has(n) && T.rig.has(n));
  castTurn(inst, 'Hips', -hipK * p.lean); for (const n of sp) castTurn(inst, n, -(1 - hipK) * p.lean / sp.length);
  if (castTurn(inst, 'neck', -0.35 * p.head)) castTurn(inst, 'Head', -0.65 * p.head); else castTurn(inst, 'Head', -p.head);
  for (let s = 0; s < 2; s++) {                           // 小人的 0 号手脚在 +z 那边：模型的右边
    const S = s ? 'Left' : 'Right';
    castTurn(inst, S + 'Arm', p.a[s]); castTurn(inst, S + 'ForeArm', p.b[s]);
    castTurn(inst, S + 'UpLeg', p.th[s] + hipK * p.lean); castTurn(inst, S + 'Leg', p.kn[s]); castTurn(inst, S + 'Foot', p.ft[s]);
  }
}

// ---- 旧原型的路人（40-character-build.js 的 buildBody）：和主角一样，搭出来的骨架照旧算角度，最后转模型的骨头（42-character-anim.js 最后一段）----
// 返回的东西和主角的 traveler 是同一个样子；模型读到以前 model 是空的，画的还是搭出来的人
function castTraveler(root, u, kind, S) {
  const role = castRole(kind, 0, S); if (!role) return undefined;
  const tv = { group: null, baseY: 0, model: null, bones: new Map() };
  castLoad(role.file, tpl => {
    const inst = castSpawn(tpl, role.look);
    for (const c of root.children) if (!c.userData.castKeep) c.visible = false;      // 搭出来的身体藏起来（拐杖这类手里的东西留着）
    const group = grp(root); inst.root.scale.setScalar(u); group.add(inst.root);
    tv.group = group; tv.model = inst.model; tv.footY = tpl.footY * u; tv.hipH = tpl.hipH * u;
    for (const [n, node] of inst.bones) tv.bones.set(n, { node, rest: node.quaternion.clone() });
  });
  return tv;
}
