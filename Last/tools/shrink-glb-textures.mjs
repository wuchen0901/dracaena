// 把 GLB 里的贴图缩小后重新打包（网格、骨骼、动画原样保留）。
// 用法：node Last/tools/shrink-glb-textures.mjs <输入.glb> <输出.glb> [贴图边长=512] [JPEG 质量=88]
// 需要本机装有 ImageMagick（magick 命令），不依赖任何 npm 包。
import { readFileSync, writeFileSync, mkdtempSync, rmSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';

const [src, out, size = '512', quality = '88'] = process.argv.slice(2);
if (!src || !out) { console.error('用法：node shrink-glb-textures.mjs <输入.glb> <输出.glb> [贴图边长] [JPEG 质量]'); process.exit(2); }
const buf = readFileSync(src);
const jsonLen = buf.readUInt32LE(12), json = JSON.parse(buf.subarray(20, 20 + jsonLen).toString('utf8')), bin = 20 + jsonLen + 8;
const tmp = mkdtempSync(join(tmpdir(), 'glb-tex-'));
const replaced = new Map();                                  // bufferView 序号 -> 缩小后的图片
(json.images || []).forEach((im, i) => {
  if (im.bufferView === undefined) return;
  const v = json.bufferViews[im.bufferView], a = join(tmp, `in-${i}`), b = join(tmp, `out-${i}.jpg`);
  writeFileSync(a, buf.subarray(bin + (v.byteOffset || 0), bin + (v.byteOffset || 0) + v.byteLength));
  execFileSync('magick', [a, '-resize', `${size}x${size}>`, '-quality', quality, b]);
  replaced.set(im.bufferView, readFileSync(b)); im.mimeType = 'image/jpeg';
});
const parts = []; let at = 0;
json.bufferViews.forEach((v, i) => {
  const data = replaced.get(i) || buf.subarray(bin + (v.byteOffset || 0), bin + (v.byteOffset || 0) + v.byteLength);
  const pad = (4 - at % 4) % 4; if (pad) { parts.push(Buffer.alloc(pad)); at += pad; }
  v.byteOffset = at; v.byteLength = data.length; v.buffer = 0; parts.push(data); at += data.length;
});
const tail = (4 - at % 4) % 4; if (tail) { parts.push(Buffer.alloc(tail)); at += tail; }
json.buffers = [{ byteLength: at }];
let js = Buffer.from(JSON.stringify(json), 'utf8'); if (js.length % 4) js = Buffer.concat([js, Buffer.alloc(4 - js.length % 4, 0x20)]);
const head = Buffer.alloc(12), h1 = Buffer.alloc(8), h2 = Buffer.alloc(8);
head.writeUInt32LE(0x46546C67, 0); head.writeUInt32LE(2, 4); head.writeUInt32LE(12 + 8 + js.length + 8 + at, 8);
h1.writeUInt32LE(js.length, 0); h1.writeUInt32LE(0x4E4F534A, 4); h2.writeUInt32LE(at, 0); h2.writeUInt32LE(0x004E4942, 4);
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, Buffer.concat([head, h1, js, h2, ...parts]));
rmSync(tmp, { recursive: true, force: true });
console.log(`${src}：${(buf.length / 1e6).toFixed(2)} MB -> ${out}：${((12 + 16 + js.length + at) / 1e6).toFixed(2)} MB（${replaced.size} 张贴图缩到 ${size}）`);
