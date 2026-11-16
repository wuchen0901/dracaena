// 从一个 Mixamo 骨架的 GLB 里取出几段动作，存成游戏能直接读的小 JSON（Last/models/mocap-xbot.json）。
// 用法：node Last/tools/mocap-extract.mjs <源.glb> <输出.json> run walk
// 源文件用的是 three.js 示例里的 Xbot.glb（examples/models/gltf/Xbot.glb，动作来自 Mixamo）。
// 只留跟主角骨架对得上的那几节骨头：每节骨头的绑定姿势（本地的位置、旋转），每段动作每一帧的本地旋转，和胯的位置。
// 名字换成主角模型（models/hero.glb）里的叫法；HeadTop_End、Toe_End 只拿来量骨头朝哪，动画里不用。
// 不依赖任何 npm 包。
import { readFileSync, writeFileSync } from 'node:fs';

const [src, out, ...want] = process.argv.slice(2);
if (!src || !out || !want.length) { console.error('用法：node mocap-extract.mjs <源.glb> <输出.json> <动作名>…'); process.exit(2); }
const b = readFileSync(src), n = b.readUInt32LE(12), j = JSON.parse(b.subarray(20, 20 + n)), bin = b.subarray(20 + n + 8);
const acc = i => {
  const a = j.accessors[i], v = j.bufferViews[a.bufferView], k = { SCALAR: 1, VEC3: 3, VEC4: 4 }[a.type], off = bin.byteOffset + (v.byteOffset || 0) + (a.byteOffset || 0);
  return new Float32Array(bin.buffer.slice(off, off + a.count * k * 4));
};
// Mixamo 的名字 → 主角模型的名字。注意脊椎三节在主角模型里是倒着编号的：Hips → Spine02 → Spine01 → Spine → neck（Spine 挨着脖子，肩膀挂在它上面），
// Mixamo 是 Hips → Spine → Spine1 → Spine2 → Neck。按名字直接对，胸口的转动就套到腰上了
const NAME = {
  Hips: 'Hips', Spine: 'Spine02', Spine1: 'Spine01', Spine2: 'Spine', Neck: 'neck', Head: 'Head', HeadTop_End: 'head_end',
};
for (const s of ['Left', 'Right']) for (const p of ['Shoulder', 'Arm', 'ForeArm', 'Hand', 'UpLeg', 'Leg', 'Foot', 'ToeBase']) NAME[s + p] = s + p;
for (const s of ['Left', 'Right']) NAME[s + 'Toe_End'] = null;   // 只量方向：主角没有这一节，脚尖的方向拿 ToeBase 的子节点量不到，留着给源这一边用
const parent = {}; j.nodes.forEach((nd, i) => (nd.children || []).forEach(c => parent[c] = i));
const idx = {}; j.nodes.forEach((nd, i) => { const m = /^mixamorig:(.+)$/.exec(nd.name || ''); if (m && m[1] in NAME) idx[m[1]] = i; });
const r4 = x => Math.round(x * 1e4) / 1e4;
const bones = Object.keys(idx).map(k => {
  const nd = j.nodes[idx[k]], pk = Object.keys(idx).find(q => idx[q] === parent[idx[k]]) ?? null;
  return { src: k, name: NAME[k] ?? k, parent: pk ? (NAME[pk] ?? pk) : null, t: (nd.translation || [0, 0, 0]).map(r4), r: (nd.rotation || [0, 0, 0, 1]).map(r4) };
});
// 胯上面那一层（Armature）的缩放：骨头的长度都是按它之前的单位记的
const arm = j.nodes[parent[idx.Hips]], scale = arm?.scale?.[0] ?? 1;
const clips = {};
for (const name of want) {
  const an = j.animations.find(a => a.name === name);
  if (!an) { console.error('没有这段动作：' + name + '（有：' + j.animations.map(a => a.name).join(' ') + '）'); process.exit(1); }
  const C = { frames: 0, fps: 30, q: {}, hips: [] };
  for (const c of an.channels) {
    const k = Object.keys(idx).find(q => idx[q] === c.target.node);
    if (!k || NAME[k] === null || k === 'HeadTop_End') continue;
    const s = an.samplers[c.sampler], t = acc(s.input), v = acc(s.output);
    let f = t.length;
    // 最后一帧和第一帧是同一个姿势（循环接口）：去掉，免得接口处停一帧
    if (c.target.path === 'rotation') {
      const d = Math.abs(v[0] * v[4 * (f - 1)] + v[1] * v[4 * (f - 1) + 1] + v[2] * v[4 * (f - 1) + 2] + v[3] * v[4 * (f - 1) + 3]);
      if (k === 'Hips') C.dup = d > 0.9999;
    }
    if (c.target.path === 'rotation') C.q[NAME[k]] = Array.from(v).map(r4);
    if (c.target.path === 'translation' && k === 'Hips') C.hips = Array.from(v).map(x => Math.round(x * 100) / 100);
    C.frames = f; C.fps = Math.round(1 / (t[1] - t[0]));
  }
  if (C.dup) { C.frames -= 1; for (const k in C.q) C.q[k].length = C.frames * 4; C.hips.length = C.frames * 3; }
  delete C.dup;
  clips[name] = C;
}
const res = { note: 'Mixamo 动作（取自 three.js 示例 Xbot.glb），供 42-character-anim.js 的 MOCAP 对比用；生成：Last/tools/mocap-extract.mjs', unit: scale, bones, clips };
writeFileSync(out, JSON.stringify(res));
console.log(out, JSON.stringify(res).length, 'bytes;', Object.entries(clips).map(([k, c]) => `${k} ${c.frames} 帧 @${c.fps}`).join(', '));
