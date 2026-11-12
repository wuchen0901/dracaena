// 给主角换上衣颜色：把颜色贴图里的中灰区域（脚上的除外，鞋子保持原样）改成指定颜色，写回 GLB。
// 用法：node Last/tools/recolor-glb-top.mjs <生成工具导出的原模型.glb> <缩过贴图的模型.glb> <输出.glb> [目标色=C4BEB0 米白]
// 先用 shrink-glb-textures.mjs 缩贴图，再用这个脚本换色。需要本机装有 ImageMagick，不依赖任何 npm 包。
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
const HERE = mkdtempSync(join(tmpdir(), 'glb-recolor-'));
const [srcPath, heroPath, outPath, hex = 'C4BEB0'] = process.argv.slice(2);
if (!srcPath || !heroPath || !outPath) { console.error('用法：node recolor-glb-top.mjs <原模型.glb> <缩过贴图的模型.glb> <输出.glb> [目标色]'); process.exit(2); }
const N = 1024, OUT = 512;
const parse = p => { const buf = readFileSync(p), jl = buf.readUInt32LE(12); return { buf, json: JSON.parse(buf.subarray(20, 20 + jl).toString('utf8')), bin: 20 + jl + 8 }; };
const view = (g, i) => { const v = g.json.bufferViews[i]; return g.buf.subarray(g.bin + (v.byteOffset || 0), g.bin + (v.byteOffset || 0) + v.byteLength); };

// 1. 原模型的颜色贴图 -> 1024 的原始 RGB
const src = parse(srcPath), m = src.json.materials[0];
const colorImg = src.json.textures[m.pbrMetallicRoughness.baseColorTexture.index].source;
writeFileSync(join(HERE, 'c.png'), view(src, src.json.images[colorImg].bufferView));
execFileSync('magick', [join(HERE, 'c.png'), '-resize', `${N}x${N}!`, '-depth', '8', `rgb:${join(HERE, 'c.raw')}`]);
const px = readFileSync(join(HERE, 'c.raw'));

// 2. 用网格给贴图分区：三角形重心高于 0.12 米的算身体（1），其余算脚（2）
const prim = src.json.meshes[0].primitives[0], acc = src.json.accessors;
const read = (a, n) => { const A = acc[a], v = src.json.bufferViews[A.bufferView], o = src.bin + (v.byteOffset || 0) + (A.byteOffset || 0), st = v.byteStride || n * 4; return i => Array.from({ length: n }, (_, k) => src.buf.readFloatLE(o + i * st + k * 4)); };
const P = read(prim.attributes.POSITION, 3), UV = read(prim.attributes.TEXCOORD_0, 2);
const IA = acc[prim.indices], iv = src.json.bufferViews[IA.bufferView], io = src.bin + (iv.byteOffset || 0) + (IA.byteOffset || 0);
const idx = i => IA.componentType === 5125 ? src.buf.readUInt32LE(io + i * 4) : src.buf.readUInt16LE(io + i * 2);
const lab = new Uint8Array(N * N);
let nBody = 0;
for (let t = 0; t < IA.count / 3; t++) {
  const v = [0, 1, 2].map(k => idx(t * 3 + k)), y = (P(v[0])[1] + P(v[1])[1] + P(v[2])[1]) / 3, L = y < 0.12 ? 2 : 1;
  if (L === 1) nBody++;
  const [a, b, c] = v.map(i => { const u = UV(i); return [u[0] * N, u[1] * N]; });
  const x0 = Math.max(0, Math.floor(Math.min(a[0], b[0], c[0])) - 1), x1 = Math.min(N - 1, Math.ceil(Math.max(a[0], b[0], c[0])) + 1);
  const y0 = Math.max(0, Math.floor(Math.min(a[1], b[1], c[1])) - 1), y1 = Math.min(N - 1, Math.ceil(Math.max(a[1], b[1], c[1])) + 1);
  const d = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]); if (Math.abs(d) < 1e-9) continue;
  const e = 0.6 / Math.sqrt(Math.abs(d));
  for (let yy = y0; yy <= y1; yy++) for (let xx = x0; xx <= x1; xx++) {
    const l1 = ((b[1] - c[1]) * (xx + .5 - c[0]) + (c[0] - b[0]) * (yy + .5 - c[1])) / d, l2 = ((c[1] - a[1]) * (xx + .5 - c[0]) + (a[0] - c[0]) * (yy + .5 - c[1])) / d, l3 = 1 - l1 - l2;
    if (l1 >= -e && l2 >= -e && l3 >= -e) lab[yy * N + xx] = L;
  }
}
// 岛与岛之间的留边不属于任何三角形，按离得最近的岛来算。
// 留边要是还留着原来的灰色，贴图缩小或者远看的时候会在接缝上透出灰线。
for (let front = Array.from(lab.keys()).filter(i => lab[i]); front.length;) {
  const next = [];
  for (const i of front) {
    const x = i % N, L = lab[i];
    if (x > 0 && !lab[i - 1]) { lab[i - 1] = L; next.push(i - 1); }
    if (x < N - 1 && !lab[i + 1]) { lab[i + 1] = L; next.push(i + 1); }
    if (i >= N && !lab[i - N]) { lab[i - N] = L; next.push(i - N); }
    if (i < N * (N - 1) && !lab[i + N]) { lab[i + N] = L; next.push(i + N); }
  }
  front = next;
}

// 3. 身体区域里的中灰像素 -> 目标色（保留原有的明暗比例）
const T = [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16));
let sum = 0;
const grey = [];
for (let i = 0; i < N * N; i++) {
  const r = px[i * 3], g = px[i * 3 + 1], b = px[i * 3 + 2], lum = (r + g + b) / 3, sat = Math.max(r, g, b) - Math.min(r, g, b);
  if (lab[i] === 1 && lum > 52 && lum < 125 && sat < 22) grey.push(i), sum += lum;
}
const mean = sum / grey.length;
for (const i of grey) { const k = Math.min(1.25, ((px[i * 3] + px[i * 3 + 1] + px[i * 3 + 2]) / 3) / mean); for (let c = 0; c < 3; c++) px[i * 3 + c] = Math.min(255, Math.round(T[c] * k)); }
writeFileSync(join(HERE, 'c2.raw'), px);
execFileSync('magick', ['-size', `${N}x${N}`, '-depth', '8', `rgb:${join(HERE, 'c2.raw')}`, '-resize', `${OUT}x${OUT}`, '-quality', '90', join(HERE, 'color-recolored.jpg')]);

// 4. 换掉模型里的颜色贴图，重新打包
const hero = parse(heroPath), hm = hero.json.materials[0];
const target = hero.json.images[hero.json.textures[hm.pbrMetallicRoughness.baseColorTexture.index].source].bufferView;
const parts = []; let at = 0;
hero.json.bufferViews.forEach((v, i) => {
  const data = i === target ? readFileSync(join(HERE, 'color-recolored.jpg')) : Buffer.from(view(hero, i));
  const pad = (4 - at % 4) % 4; if (pad) { parts.push(Buffer.alloc(pad)); at += pad; }
  v.byteOffset = at; v.byteLength = data.length; parts.push(data); at += data.length;
});
const tail = (4 - at % 4) % 4; if (tail) { parts.push(Buffer.alloc(tail)); at += tail; }
hero.json.buffers = [{ byteLength: at }];
let js = Buffer.from(JSON.stringify(hero.json), 'utf8'); if (js.length % 4) js = Buffer.concat([js, Buffer.alloc(4 - js.length % 4, 0x20)]);
const head = Buffer.alloc(12), h1 = Buffer.alloc(8), h2 = Buffer.alloc(8);
head.writeUInt32LE(0x46546C67, 0); head.writeUInt32LE(2, 4); head.writeUInt32LE(28 + js.length + at, 8);
h1.writeUInt32LE(js.length, 0); h1.writeUInt32LE(0x4E4F534A, 4); h2.writeUInt32LE(at, 0); h2.writeUInt32LE(0x004E4942, 4);
writeFileSync(outPath, Buffer.concat([head, h1, js, h2, ...parts]));
if (process.env.KEEP_TEXTURE) writeFileSync(process.env.KEEP_TEXTURE, readFileSync(join(HERE, 'color-recolored.jpg')));
rmSync(HERE, { recursive: true, force: true });
console.log(`身体三角形 ${nBody}/${IA.count / 3}，改色的贴图像素 ${grey.length}（${(grey.length / N / N * 100).toFixed(1)}%），原来的平均灰度 ${mean.toFixed(0)}，写出 ${outPath}（${28 + js.length + at} 字节）`);
