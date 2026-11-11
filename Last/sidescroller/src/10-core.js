import * as THREE from 'three';

// ============================================================
//  基础：渲染器 / 场景 / 相机 / 小工具 / 输入
// ============================================================
const $ = id => document.getElementById(id);
const canvas = $('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;   // 不做色调映射：画出来的颜色就是看到的颜色
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0e1518);
scene.fog = new THREE.FogExp2(0x0e1518, 0.026);
const camera = new THREE.PerspectiveCamera(28, 1, 0.5, 900);

function resize() {
  const w = innerWidth || 1280, h = innerHeight || 720;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.fov = w / h < 1.2 ? 40 : 28;      // 窄屏时放宽视野
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize); resize();

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const damp = (a, b, k, dt) => lerp(a, b, 1 - Math.exp(-k * dt));   // 与帧率无关的平滑
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

let _seed = 20261111;
function rnd() {   // 固定种子的随机数：每次打开画面都一样
  _seed = _seed + 0x6D2B79F5 | 0;
  let t = Math.imul(_seed ^ _seed >>> 15, 1 | _seed);
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
  return ((t ^ t >>> 14) >>> 0) / 4294967296;
}
const rr = (a, b) => a + (b - a) * rnd();
const pick = arr => arr[Math.floor(rnd() * arr.length)];

function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
function canvasTex(c) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t.generateMipmaps = true;
  return t;
}
function add(parent, geo, mat, x = 0, y = 0, z = 0, shadow = true) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z);
  m.castShadow = m.receiveShadow = shadow; parent.add(m); return m;
}
function grp(parent, x = 0, y = 0, z = 0) { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; }
const lam = (color, o = {}) => new THREE.MeshLambertMaterial({ color, ...o });

// ---- 输入 ----
const keys = new Set(), pressed = new Set();
const MAP = { ArrowLeft: 'L', KeyA: 'L', ArrowRight: 'R', KeyD: 'R', Space: 'J', ArrowUp: 'J', KeyW: 'J',
  KeyE: 'E', KeyK: 'E', ShiftLeft: 'S', ShiftRight: 'S', KeyR: 'RESET', KeyM: 'MUTE', Digit1: 'A', Digit2: 'B', Digit3: 'C' };
let anyKey = false;
addEventListener('keydown', e => {
  const k = MAP[e.code]; anyKey = true;
  if (k) { if (!keys.has(k)) pressed.add(k); keys.add(k); e.preventDefault(); }
});
addEventListener('keyup', e => { const k = MAP[e.code]; if (k) keys.delete(k); });
addEventListener('blur', () => keys.clear());
addEventListener('pointerdown', () => { anyKey = true; });
