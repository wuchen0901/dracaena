
// ---- 动作捕捉的走和跑（试验，拿来和上面程序化的走、跑对比）----
// 地址后面加 ?mocap=1 才打开；不加的时候这一段什么都不做，游戏和原来一模一样。对比页：Last/tools/mocap-compare.html
// 动作来自 Mixamo（three.js 示例里 Xbot.glb 的 walk / run），Last/tools/mocap-extract.mjs 取出来存在 models/mocap-xbot.json。
// 做法（“重定向”）：Xbot 的骨架和主角的骨架长短、绑定姿势都不一样，不能直接把每节骨头的旋转抄过来 ——
//   先把主角每节骨头在绑定姿势里转一下，让它和 Xbot 绑定姿势里那一节指向同一个方向；
//   以后每一帧，Xbot 那一节骨头（在整个人的坐标里）比它的绑定姿势多转了多少，主角这一节也多转多少。
//   胯的位置（上下颠、前后晃）按两个人胯的高度之比缩放。
// 只管在地上走和跑：站着、腾空、攀爬、游泳、推箱子、落地缓冲、剧情动作的时候淡出，照旧用程序化的。
// 步子按走过的距离推进（和程序化的一样），所以脚踩在地上不打滑；走一步多远是从动作本身量出来的（支撑脚往后退得多快），所以跑得快慢不改动作本身的样子，只改节奏。
const MOCAP = { on: new URLSearchParams(location.search).get('mocap') === '1', data: null, loading: false };
// 量骨头朝哪：从这一节指向它的哪个子节点（主角的脊椎是倒着编号的：Hips → Spine02 → Spine01 → Spine → neck，见 mocap-extract.mjs）
const MC_CHILD = { Hips: 'Spine02', Spine02: 'Spine01', Spine01: 'Spine', Spine: 'neck', neck: 'Head', Head: 'head_end' };
for (const s of ['Left', 'Right']) Object.assign(MC_CHILD, { [s + 'Shoulder']: s + 'Arm', [s + 'Arm']: s + 'ForeArm', [s + 'ForeArm']: s + 'Hand', [s + 'UpLeg']: s + 'Leg', [s + 'Leg']: s + 'Foot', [s + 'Foot']: s + 'ToeBase' });
// 程序化的那一段每帧都会重新摆的骨头（42-character-anim.js 的 poseBone）：动捕在它们摆好的姿势上往动捕的姿势混；
// 其余几节（肩、手、脚尖）程序化的不碰，动捕从绑定姿势混过去，淡出时放回绑定姿势
const MC_PROC = new Set(['Hips', 'Spine', 'Spine01', 'Spine02', 'neck', 'Head', 'LeftUpLeg', 'LeftLeg', 'LeftFoot', 'RightUpLeg', 'RightLeg', 'RightFoot', 'LeftArm', 'LeftForeArm', 'RightArm', 'RightForeArm']);

function mocapLoad() {
  if (MOCAP.loading) return; MOCAP.loading = true;
  fetch(new URL('models/mocap-xbot.json', import.meta.url).href).then(r => r.json()).then(d => { MOCAP.data = d; }).catch(e => console.warn('models/mocap-xbot.json 读不到：动捕对比关着', e));
}
if (MOCAP.on) mocapLoad();

// 把动作换到主角的骨架上，一帧一帧算好存起来（第一次用的时候算一次）
function mocapRig(tv) {
  if (tv.mocap) return tv.mocap;
  const D = MOCAP.data, model = tv.model, Q = () => new THREE.Quaternion(), V = () => new THREE.Vector3();
  // Xbot 的骨架：照绑定姿势搭一副空的骨头
  const S = {}, sroot = new THREE.Object3D(); sroot.scale.setScalar(D.unit);
  for (const b of D.bones) { const o = new THREE.Object3D(); o.position.fromArray(b.t); o.quaternion.fromArray(b.r); S[b.name] = o; }
  for (const b of D.bones) (b.parent ? S[b.parent] : sroot).add(S[b.name]);
  const depth = n => { let k = 0; for (let b = D.bones.find(x => x.name === n); b && b.parent; b = D.bones.find(x => x.name === b.parent)) k++; return k; };
  const names = D.bones.map(b => b.name).filter(n => tv.bones.has(n) && n !== 'head_end').sort((a, b) => depth(a) - depth(b));   // 从胯往下一节一节算
  const parentOf = n => D.bones.find(b => b.name === n).parent;
  sroot.updateMatrixWorld(true);
  const sRest = {}; for (const n of names) sRest[n] = S[n].getWorldQuaternion(Q());
  const sPos = n => sroot.worldToLocal(S[n].getWorldPosition(V()));
  // 主角：先放回绑定姿势，量每节骨头在整个人的坐标里朝哪
  const save = new Map(); for (const [n, e] of tv.bones) { save.set(n, [e.node.quaternion.clone(), e.node.position.clone()]); e.node.quaternion.copy(e.rest); }
  const hips = tv.bones.get('Hips').node, hipsRest = hips.position.clone();
  model.updateMatrixWorld(true);
  const mInv = model.getWorldQuaternion(Q()).invert(), tPos = n => model.worldToLocal(tv.bones.get(n).node.getWorldPosition(V()));
  const tRest = {}; for (const n of names) {
    const node = tv.bones.get(n).node, q = mInv.clone().multiply(node.getWorldQuaternion(Q())), c = MC_CHILD[n];
    if (c && tv.bones.has(c) && S[c]) q.premultiply(Q().setFromUnitVectors(tPos(c).sub(tPos(n)).normalize(), sPos(c).sub(sPos(n)).normalize()));   // 转到和 Xbot 指向同一个方向
    tRest[n] = q;
  }
  const hipsParent = mInv.clone().multiply(hips.parent.getWorldQuaternion(Q()));
  const hipK = hipsRest.y / D.bones.find(b => b.name === 'Hips').t[1], sHips = new THREE.Vector3().fromArray(D.bones.find(b => b.name === 'Hips').t);
  const restAnkle = Math.min(tPos('LeftFoot').y, tPos('RightFoot').y), mScale = model.getWorldScale(V()).y;
  const R = { ph: 0, lastW: 0, clips: {} };
  for (const [cn, C] of Object.entries(D.clips)) {
    const frames = [], foot = [];
    // 胯的位置：上下按 Xbot 的绑定姿势比；左右、前后按这段动作自己的平均位置比（walk 整段都比绑定姿势靠后 15 厘米，那是录的时候站的地方，不是动作）
    let mx = 0, mz = 0; for (let f = 0; f < C.frames; f++) { mx += C.hips[3 * f] / C.frames; mz += C.hips[3 * f + 2] / C.frames; }
    const sRef = new THREE.Vector3(mx, sHips.y, mz);
    for (let f = 0; f < C.frames; f++) {
      for (const n in C.q) if (S[n]) S[n].quaternion.fromArray(C.q[n], 4 * f);
      S.Hips.position.fromArray(C.hips, 3 * f); sroot.updateMatrixWorld(true);
      const W = {}, L = {};
      for (const n of names) {
        W[n] = S[n].getWorldQuaternion(Q()).multiply(sRest[n].clone().invert()).multiply(tRest[n]);   // 比 Xbot 的绑定姿势多转了多少，主角也多转多少
        const p = parentOf(n), pw = p && W[p] ? W[p] : hipsParent;
        L[n] = pw.clone().invert().multiply(W[n]);
      }
      const hp = hipsRest.clone().add(new THREE.Vector3().fromArray(C.hips, 3 * f).sub(sRef).multiplyScalar(hipK));
      frames.push({ q: L, hp });
      // 摆到主角身上量一量两只脚踝：哪只低哪只就是踩在地上的
      for (const n of names) tv.bones.get(n).node.quaternion.copy(L[n]); hips.position.copy(hp); model.updateMatrixWorld(true);
      foot.push([tPos('LeftFoot'), tPos('RightFoot')]);
    }
    const low = Math.min(...foot.map(p => Math.min(p[0].y, p[1].y)));                               // 最低的时候脚踝比站着时低多少：整个人往上补回来，脚不插进地里
    // 走一步多远：踩在地上的那只脚相对身子往后退得多快（模型自己的坐标里 +z 朝前）。只算脚踝离最低点不到 4 厘米的帧（跑的时候有一段两只脚都在空中）
    const v = []; for (let f = 0; f < C.frames; f++) { const g = (f + 1) % C.frames, a = foot[f], b = foot[g]; for (let i = 0; i < 2; i++) if (a[i].y < low + 0.04 && b[i].y < low + 0.04) v.push((a[i].z - b[i].z) * C.fps); }
    v.sort((a, b) => a - b);
    const speed = v[v.length >> 1] * mScale, len = speed * C.frames / C.fps;                       // 一个循环（两步）走多远，世界里的米
    let f0 = 0; for (let f = 1; f < C.frames; f++) if (foot[f][0].z > foot[f0][0].z) f0 = f;      // 左脚迈到最前面（刚要踩下去）的那一帧当相位 0：走和跑对齐了才能混
    R.clips[cn] = { frames, n: C.frames, len, f0, lift: (restAnkle - low) * mScale, speed };
  }
  for (const [n, e] of tv.bones) { e.node.quaternion.copy(save.get(n)[0]); e.node.position.copy(save.get(n)[1]); }
  hips.position.copy(hipsRest); R.hipsRest = hipsRest; model.updateMatrixWorld(true);
  return (tv.mocap = R);
}

const _mq = [new THREE.Quaternion(), new THREE.Quaternion()], _mp = [new THREE.Vector3(), new THREE.Vector3()];
function mocapSample(c, ph, n, out) {                                       // 动作 c 在相位 ph 时骨头 n 的本地旋转（相邻两帧之间球面插值）
  const x = ((ph + c.f0 / c.n) % 1) * c.n, i = Math.floor(x) % c.n, j = (i + 1) % c.n;
  return out.copy(c.frames[i].q[n]).slerp(c.frames[j].q[n], x - Math.floor(x));
}
function mocapHips(c, ph, out) {
  const x = ((ph + c.f0 / c.n) % 1) * c.n, i = Math.floor(x) % c.n, j = (i + 1) % c.n;
  return out.copy(c.frames[i].hp).lerp(c.frames[j].hp, x - Math.floor(x));
}

// 每帧在程序化的姿势摆好以后调用。w：这一刻动捕占几成（42-character-anim.js 按状态算好，站着、腾空……都是 0）；bob：程序化那边加在整个模型上的上下颠，动捕自己有，要扣掉
function mocapApply(tv, A, dt, fwd, w, bob) {
  if (!MOCAP.on || !tv.model) return;
  if (!MOCAP.data) { mocapLoad(); return; }
  const R = mocapRig(tv), cw = R.clips.walk, cr = R.clips.run, kr = sstep(0.2, 0.8, A.run);     // 走和跑按程序化那边的“跑了几成”混
  R.ph = ((R.ph + fwd * dt / lerp(cw.len, cr.len, kr)) % 1 + 1) % 1;
  if (w < 1e-3 && R.lastW < 1e-3) return;
  R.lastW = w;
  for (const [n, e] of tv.bones) {
    if (!cw.frames[0].q[n]) continue;
    const q = mocapSample(cw, R.ph, n, _mq[0]).slerp(mocapSample(cr, R.ph, n, _mq[1]), kr);
    if (MC_PROC.has(n)) e.node.quaternion.slerp(q, w); else e.node.quaternion.copy(e.rest).slerp(q, w);
  }
  const hp = mocapHips(cw, R.ph, _mp[0]).lerp(mocapHips(cr, R.ph, _mp[1]), kr);
  tv.bones.get('Hips').node.position.copy(R.hipsRest).lerp(hp, w);
  tv.group.position.y += (lerp(cw.lift, cr.lift, kr) - bob) * w;
  tv.group.rotation.z *= 1 - w;                                             // 程序化的前倾整个人一起歪；动捕的前倾在胯和脊椎里
  tv.model.updateMatrixWorld(true);
}
