// 给人物模型瘦身：去掉自带的动画（游戏里的动作都是现算的，用不上），去掉贴图坐标、切线、顶点色，只留网格、骨架和材质，重新打包成 GLB。
// 顶点上的数也存得省一些：法线每个分量一个字节（KHR_mesh_quantization），跟哪几节骨头走、各占几成也各用一个字节。
// 输入可以是 .glb，也可以是把数据用 base64 写在里面的 .gltf。Quaternius 的人物一个 1.4 MB，瘦身以后 0.4 MB 上下。
// 用法：node Last/tools/slim-glb.mjs <输入.glb|.gltf> <输出.glb>
// 只依赖 Node 自带的模块。
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const [src, out] = process.argv.slice(2);
if (!src || !out) { console.error('用法：node slim-glb.mjs <输入.glb|.gltf> <输出.glb>'); process.exit(2); }
const raw = readFileSync(src);
let json, buffers;
if (raw.readUInt32LE(0) === 0x46546c67) {                    // 'glTF'：二进制的 GLB
  const n = raw.readUInt32LE(12); json = JSON.parse(raw.subarray(20, 20 + n).toString('utf8'));
  const at = 20 + n; buffers = [raw.length > at ? raw.subarray(at + 8, at + 8 + raw.readUInt32LE(at)) : Buffer.alloc(0)];
} else {
  json = JSON.parse(raw.toString('utf8'));
  buffers = (json.buffers || []).map(b => b.uri.startsWith('data:') ? Buffer.from(b.uri.slice(b.uri.indexOf(',') + 1), 'base64') : readFileSync(join(dirname(src), decodeURIComponent(b.uri))));
}
delete json.animations; delete json.cameras;
for (const m of json.meshes || []) for (const p of m.primitives) { for (const k of Object.keys(p.attributes)) if (/^(TEXCOORD|TANGENT|COLOR)_/.test(k)) delete p.attributes[k]; delete p.targets; }
if (!(json.materials || []).some(m => JSON.stringify(m).includes('"index"'))) { delete json.textures; delete json.images; delete json.samplers; }   // 没有哪个材质用贴图：贴图也不留
else if (json.images?.length) { console.error('这个模型带贴图：这个工具只管不带贴图的'); process.exit(1); }

// 还用得着的数据（网格的顶点、三角形，骨架的绑定矩阵）一块一块抄出来，重新排
const SIZE = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 }, COUNT = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT2: 4, MAT3: 9, MAT4: 16 };
const remap = new Map(), accessors = [], views = [], parts = []; let at = 0;
let quant = false;
function keep(i, target, as) {
  if (i === undefined) return undefined;
  if (remap.has(i)) return remap.get(i);
  const a = json.accessors[i]; if (a.sparse) { console.error('不支持稀疏的 accessor'); process.exit(1); }
  const v = json.bufferViews[a.bufferView], el = SIZE[a.componentType] * COUNT[a.type], stride = v.byteStride || el, buf = buffers[v.buffer], base = (v.byteOffset || 0) + (a.byteOffset || 0);
  let data = Buffer.alloc(el * a.count), n = { ...a }, view = {};
  for (let k = 0; k < a.count; k++) buf.copy(data, k * el, base + k * stride, base + k * stride + el);
  const src = data, f32 = k => src.readFloatLE(k * 4), four = Buffer.alloc(4 * a.count);
  if (as === 'NORMAL' && a.componentType === 5126) {          // 法线：三个字节，补一个字节凑成四个
    for (let k = 0; k < a.count; k++) for (let c = 0; c < 3; c++) four.writeInt8(Math.max(-127, Math.min(127, Math.round(f32(3 * k + c) * 127))), 4 * k + c);
    data = four; n.componentType = 5120; n.normalized = true; delete n.min; delete n.max; view.byteStride = 4; quant = true;
  } else if (as === 'WEIGHTS_0' && a.componentType === 5126) { // 权重：四个加起来正好是 255
    for (let k = 0; k < a.count; k++) {
      const w = [0, 1, 2, 3].map(c => Math.max(0, f32(4 * k + c))), sum = w[0] + w[1] + w[2] + w[3] || 1, q = w.map(x => Math.round(x / sum * 255));
      q[q.indexOf(Math.max(...q))] += 255 - (q[0] + q[1] + q[2] + q[3]);
      for (let c = 0; c < 4; c++) four.writeUInt8(q[c], 4 * k + c);
    }
    data = four; n.componentType = 5121; n.normalized = true; delete n.min; delete n.max;
  } else if (as === 'JOINTS_0' && a.componentType === 5123) {  // 骨头的序号：不到 256 节就用一个字节
    let big = false; for (let k = 0; k < 4 * a.count; k++) { const j = src.readUInt16LE(2 * k); if (j > 255) big = true; else four.writeUInt8(j, k); }
    if (!big) { data = four; n.componentType = 5121; delete n.min; delete n.max; }
  }
  const pad = (4 - at % 4) % 4; if (pad) { parts.push(Buffer.alloc(pad)); at += pad; }
  views.push({ buffer: 0, byteOffset: at, byteLength: data.length, ...view, ...(target ? { target } : {}) }); parts.push(data); at += data.length;
  n.bufferView = views.length - 1; delete n.byteOffset; accessors.push(n);
  remap.set(i, accessors.length - 1); return accessors.length - 1;
}
for (const m of json.meshes || []) for (const p of m.primitives) { for (const k of Object.keys(p.attributes)) p.attributes[k] = keep(p.attributes[k], 34962, k); if (p.indices !== undefined) p.indices = keep(p.indices, 34963); }
for (const s of json.skins || []) if (s.inverseBindMatrices !== undefined) s.inverseBindMatrices = keep(s.inverseBindMatrices);
const pad = (4 - at % 4) % 4; if (pad) { parts.push(Buffer.alloc(pad)); at += pad; }
if (quant) for (const k of ['extensionsUsed', 'extensionsRequired']) json[k] = [...new Set([...(json[k] || []), 'KHR_mesh_quantization'])];
json.accessors = accessors; json.bufferViews = views; json.buffers = [{ byteLength: at }];
json.asset = { ...json.asset, generator: (json.asset?.generator ?? '') + ' + slim-glb.mjs' };

let text = Buffer.from(JSON.stringify(json), 'utf8'); if (text.length % 4) text = Buffer.concat([text, Buffer.alloc(4 - text.length % 4, 0x20)]);
const bin = Buffer.concat(parts), head = Buffer.alloc(12), h1 = Buffer.alloc(8), h2 = Buffer.alloc(8);
head.writeUInt32LE(0x46546c67, 0); head.writeUInt32LE(2, 4); head.writeUInt32LE(12 + 8 + text.length + 8 + bin.length, 8);
h1.writeUInt32LE(text.length, 0); h1.writeUInt32LE(0x4e4f534a, 4); h2.writeUInt32LE(bin.length, 0); h2.writeUInt32LE(0x004e4942, 4);
writeFileSync(out, Buffer.concat([head, h1, text, h2, bin]));
console.log(`${src}（${(raw.length / 1024).toFixed(0)} KB）→ ${out}（${((28 + text.length + bin.length) / 1024).toFixed(0)} KB）`);
