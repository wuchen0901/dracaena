import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';
import { Reflector } from 'three/addons/objects/Reflector.js';

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
const approach = (a, b, s) => a < b ? Math.min(b, a + s) : Math.max(b, a - s);   // 匀速靠近
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const hex3 = h => [(h >> 16 & 255) / 255, (h >> 8 & 255) / 255, (h & 255) / 255];   // 0xRRGGBB → [r, g, b]（不做色彩空间转换）
const css = h => '#' + h.toString(16).padStart(6, '0');

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

// ---- 柔边：不靠 ctx.filter 的模糊 ----
// 画布自带的 ctx.filter = 'blur()' 在 iPhone 上没有（2026-11-13 在 iOS 27.0.1 上实测，Mac 上的 WebKit 也没有），那里的柔边会全变成硬边。
// blurDraw(g, px, draw, once)：px 和 CSS 的 blur(px) 一样，是画布上的像素，不跟着 g 当前的缩放变；px 是 0 就直接画在 g 上。
//   默认逐笔虚化，和原来 ctx.filter 一样：每一笔各自模糊，叠在一起的地方留着各自的边。用画布的阴影来做 ——
//     笔画本身挪到画布外面老远的地方，只让它的影子落回原处。影子是 shadowBlur = 2σ 的高斯，Chrome 和 WebKit 量出来都和 blur(σ) 一样大。
//     影子只有一种颜色：每画一笔之前把 shadowColor 设成这一笔的颜色（不带透明度，透明度由笔画自己带）。
//     所以 draw 里要用纯色，或者各色标同一种颜色、只是深浅不同的渐变；颜色不一样的渐变和图案只能取第一个色标的颜色。
//     draw 里不要用 clip()（裁剪框会跟着笔画挪到画布外面去），也不要自己设影子。碰到这些都会记进 window.__blurStats.odd。
//     draw(t) 里的 t 就是 g，只是 setTransform / resetTransform / getTransform / clearRect 照常用，挪开的那一段自动算进去。
//   once 为真：整块清清楚楚地画好，再用显卡整张模糊一次（笔画成千上万的时候用）。画出画布的部分不算，和原来一样贴着边会淡掉
const BLUR = new THREE.ShaderMaterial({
  uniforms: { map: { value: null }, size: { value: new THREE.Vector2() }, dir: { value: new THREE.Vector2() }, sigma: { value: 1 }, R: { value: 1 } },
  vertexShader: 'void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }',
  fragmentShader: `uniform sampler2D map; uniform vec2 size, dir; uniform float sigma; uniform int R;
    void main() {                                  // 沿 dir 方向的一维高斯。贴图里是预乘过透明度的颜色，画布外面算作全透明
      vec4 s = vec4(0.0); float ws = 0.0;
      for (int i = -64; i <= 64; i++) {
        if (i < -R || i > R) continue;
        float w = exp(-float(i * i) / (2.0 * sigma * sigma)); vec2 p = gl_FragCoord.xy + dir * float(i);
        ws += w;
        if (p.x > 0.0 && p.y > 0.0 && p.x < size.x && p.y < size.y) s += w * texture2D(map, p / size);
      }
      gl_FragColor = s / ws;
    }`,
  depthTest: false, depthWrite: false, blending: THREE.NoBlending,
});
const BLUR_SCENE = new THREE.Scene(), BLUR_CAM = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
{ const m = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), BLUR); m.frustumCulled = false; BLUR_SCENE.add(m); }
function blurCanvas(c, px) {                       // 把画布 c 整张原地模糊：横着一遍、竖着一遍，再读回画布
  const W = c.width, H = c.height, U = BLUR.uniforms, nearest = { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, generateMipmaps: false };
  const src = new THREE.CanvasTexture(c); Object.assign(src, nearest, { colorSpace: THREE.NoColorSpace, premultiplyAlpha: true, flipY: false });
  const rt = [0, 1].map(() => new THREE.WebGLRenderTarget(W, H, { ...nearest, depthBuffer: false }));
  const prev = renderer.getRenderTarget();
  U.size.value.set(W, H); U.sigma.value = px; U.R.value = Math.min(64, Math.ceil(px * 3));
  U.map.value = src; U.dir.value.set(1, 0); renderer.setRenderTarget(rt[0]); renderer.render(BLUR_SCENE, BLUR_CAM);
  U.map.value = rt[0].texture; U.dir.value.set(0, 1); renderer.setRenderTarget(rt[1]); renderer.render(BLUR_SCENE, BLUR_CAM);
  const buf = new Uint8Array(W * H * 4); renderer.readRenderTargetPixels(rt[1], 0, 0, W, H, buf);
  renderer.setRenderTarget(prev); U.map.value = null; src.dispose(); rt.forEach(r => r.dispose());
  const g = c.getContext('2d'), img = g.createImageData(W, H), d = img.data;    // 读回来的颜色是预乘过透明度的，画布要的是没预乘的
  for (let i = 0; i < d.length; i += 4) { const a = buf[i + 3]; if (a) { const k = 255 / a; d[i] = buf[i] * k; d[i + 1] = buf[i + 1] * k; d[i + 2] = buf[i + 2] * k; d[i + 3] = a; } }
  g.putImageData(img, 0, 0);
}
// 整块模糊一次：画在一张四周多留 3 倍 px 的临时画布上（变换照搬 g 的），把画出 g 的那一圈擦掉，模糊，再叠回 g
function blurOnce(g, px, draw) {
  const cw = g.canvas.width, chh = g.canvas.height, m = Math.ceil(px * 3), max = renderer.capabilities.maxTextureSize;
  if (cw + 2 * m > max || chh + 2 * m > max) { draw(g); return; }   // 显卡放不下这么大的贴图：只好不虚化
  const [tc, t] = mkCanvas(cw + 2 * m, chh + 2 * m), st = t.setTransform.bind(t), gt = t.getTransform.bind(t);
  t.setTransform = (a, b, c, d, e, f) => { if (typeof a === 'object') ({ a, b, c, d, e, f } = a); st(a, b, c, d, e + m, f + m); };
  t.resetTransform = () => st(1, 0, 0, 1, m, m);
  t.getTransform = () => { const M = gt(); M.e -= m; M.f -= m; return M; };
  t.setTransform(g.getTransform());
  for (const k of ['fillStyle', 'strokeStyle', 'lineWidth', 'lineCap', 'lineJoin', 'globalAlpha', 'font', 'textAlign', 'textBaseline']) t[k] = g[k];
  draw(t);
  st(1, 0, 0, 1, 0, 0); t.clearRect(0, 0, tc.width, m); t.clearRect(0, m + chh, tc.width, m); t.clearRect(0, 0, m, tc.height); t.clearRect(m + cw, 0, m, tc.height);
  blurCanvas(tc, px);
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.shadowColor = 'rgba(0,0,0,0)'; g.drawImage(tc, m, m, cw, chh, 0, 0, cw, chh); g.restore();
}
// 逐笔虚化用的小工具：一笔的颜色（不带透明度）；渐变记下各个色标的颜色
const BLUR_STATS = window.__blurStats = { strokes: 0, odd: {} };
const _css = document.createElement('canvas').getContext('2d'), _ink = new Map(), GRAD_INK = new WeakMap();
function blurOdd(kind) { const o = BLUR_STATS.odd[kind] ??= { n: 0, at: new Error().stack.split('\n').slice(3, 6).join(' / ') }; o.n++; }
function inkOf(style) {
  if (typeof style !== 'string') {
    const s = GRAD_INK.get(style); if (s && s.size === 1) return s.values().next().value;
    blurOdd(s ? '颜色不一样的渐变' : '图案或不认识的渐变'); return s ? s.values().next().value : '#808080';
  }
  let v = _ink.get(style);
  if (!v) { _css.fillStyle = '#000'; _css.fillStyle = style; const n = _css.fillStyle; v = n[0] === '#' ? n : n.replace(/^rgba\(([^,]+),([^,]+),([^,]+),[^)]*\)$/, 'rgb($1,$2,$3)'); _ink.set(style, v); }
  return v;
}
const BLUR_PAINT = { fill: 'fillStyle', fillRect: 'fillStyle', fillText: 'fillStyle', stroke: 'strokeStyle', strokeRect: 'strokeStyle', strokeText: 'strokeStyle' };
const BLUR_OWN = new Set(['shadowBlur', 'shadowColor', 'shadowOffsetX', 'shadowOffsetY', 'filter']);
function blurStrokes(g, px, draw) {
  const D = g.canvas.width + 20000, st = g.setTransform.bind(g), gt = g.getTransform.bind(g);
  g.save();
  g.shadowBlur = 2 * px; g.shadowOffsetX = -D; g.shadowOffsetY = 0;
  { const M = gt(); st(M.a, M.b, M.c, M.d, M.e + D, M.f); }
  const P = new Proxy(g, {
    get(o, k) {
      if (k in BLUR_PAINT) return (...a) => { o.shadowColor = inkOf(o[BLUR_PAINT[k]]); BLUR_STATS.strokes++; return o[k](...a); };
      switch (k) {
        case 'setTransform': return (a, b, c, d, e, f) => { if (typeof a === 'object') ({ a, b, c, d, e, f } = a); st(a, b, c, d, e + D, f); };
        case 'resetTransform': return () => st(1, 0, 0, 1, D, 0);
        case 'getTransform': return () => { const M = gt(); M.e -= D; return M; };
        case 'clearRect': return (...a) => { const M = gt(); st(M.a, M.b, M.c, M.d, M.e - D, M.f); o.clearRect(...a); st(M.a, M.b, M.c, M.d, M.e, M.f); };
        case 'createLinearGradient': case 'createRadialGradient': case 'createConicGradient': return (...a) => {
          const gr = o[k](...a), inks = new Set(), add = gr.addColorStop.bind(gr);
          gr.addColorStop = (t, c) => { add(t, c); inks.add(inkOf(c)); }; GRAD_INK.set(gr, inks); return gr;
        };
        case 'drawImage': return (...a) => {         // 图片的影子只有一种颜色：这一张单独整块模糊一次再叠上来
          blurOdd('drawImage'); const M = gt(); M.e -= D;
          blurOnce(o, px, t => { t.setTransform(M); t.drawImage(...a); });
        };
        case 'clip': return (...a) => { blurOdd('clip'); return o.clip(...a); };
      }
      const v = o[k]; return typeof v === 'function' ? v.bind(o) : v;
    },
    set(o, k, v) { if (BLUR_OWN.has(k)) blurOdd('设了 ' + k); else o[k] = v; return true; },
  });
  try { draw(P); } finally { g.restore(); }
}
function blurDraw(g, px, draw, once = false) {
  if (!(px > 0)) draw(g); else if (once) blurOnce(g, px, draw); else blurStrokes(g, px, draw);
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
  KeyE: 'E', KeyK: 'E', ShiftLeft: 'S', ShiftRight: 'S', KeyR: 'RESET', KeyM: 'MUTE', KeyV: 'VIEW',
  KeyC: 'TINT', KeyX: 'LEGS',
  Escape: 'MENU', KeyP: 'MENU', Enter: 'OK', ArrowDown: 'DOWN', KeyS: 'DOWN' };
const rawKeys = new Set();                        // 这一帧新按下的键（原始键码），菜单用
let anyKey = false;
addEventListener('keydown', e => {
  const k = MAP[e.code]; if (e.code !== 'Escape' && e.code !== 'KeyP') anyKey = true;
  if (!e.repeat) rawKeys.add(e.code);
  if (k) { if (!keys.has(k)) pressed.add(k); keys.add(k); e.preventDefault(); }
});
addEventListener('keyup', e => { const k = MAP[e.code]; if (k) keys.delete(k); });
addEventListener('blur', () => keys.clear());
addEventListener('pointerdown', e => { if (e.pointerType !== 'touch' && TOUCH_Q !== '1') anyKey = true; });   // 手指交给触屏那一段（82-touch.js）去管
