// Run with dependencies installed in LAST_MODEL_DEPS (three@0.170.0, @napi-rs/canvas).
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
const base = path.resolve(process.env.LAST_MODEL_DEPS || '/private/tmp/last-model-export');
const require = createRequire(path.join(base, 'package.json'));
const THREE = await import(pathToFileURL(path.join(base,'node_modules/three/build/three.module.js')));
const { RoundedBoxGeometry } = await import(pathToFileURL(path.join(base,'node_modules/three/examples/jsm/geometries/RoundedBoxGeometry.js')));
const { mergeVertices } = await import(pathToFileURL(path.join(base,'node_modules/three/examples/jsm/utils/BufferGeometryUtils.js')));
const { GLTFExporter } = await import(pathToFileURL(path.join(base,'node_modules/three/examples/jsm/exporters/GLTFExporter.js')));
const { createCanvas, ImageData, Image } = require('@napi-rs/canvas');
globalThis.ImageData = ImageData;
globalThis.HTMLCanvasElement = createCanvas(1,1).constructor;
globalThis.HTMLImageElement = Image;
globalThis.document = {createElement(name) {
  if (name !== 'canvas') throw Error(name);
  const c = createCanvas(1,1);
  c.toBlob = (cb, type) => cb(new Blob([c.toBuffer(type || 'image/png')], {type:type || 'image/png'}));
  return c;
}};
globalThis.FileReader = class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then(data => {this.result=data; this.onloadend?.();}); }
  readAsDataURL(blob) { blob.arrayBuffer().then(data => {this.result=`data:${blob.type};base64,${Buffer.from(data).toString('base64')}`;this.onloadend?.();}); }
};
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root,'keeper-3d.html'),'utf8');
const source = html.slice(html.indexOf('let _seed ='), html.indexOf('const robot = buildRobot();'));
const build = new Function('THREE','RoundedBoxGeometry','mergeVertices', source + '\nreturn buildRobot();');
const robot = build(THREE,RoundedBoxGeometry,mergeVertices);
robot.traverse(o => {if(o.isSprite) o.visible=false;});
robot.position.y -= new THREE.Box3().setFromObject(robot).min.y;
// Metres: approximately 1.35 m tall.
robot.scale.setScalar(0.135);
robot.updateMatrixWorld(true);
const data = await new GLTFExporter().parseAsync(robot,{binary:true,onlyVisible:true});
const output = path.join(root,'models/simple-robot-v5.glb');
fs.writeFileSync(output,Buffer.from(data));
console.log(output, data.byteLength, 'bytes');
