// ---- 画面最后统一过一遍：远处轻微模糊、统一调色、胶片颗粒 ----
// 东一章西一章、来源不一样的布景，最后都过同一层，看起来才像一套（design/visual-style.md 第 8 条）。
// 做法：主画面（scene + camera）先画进一张离屏的图（连深度），再用一个全屏着色器画到屏幕上。别的 render（反射、HUD、模糊小工具）照旧直接画。
// 那张离屏的图按“屏幕”的规矩画（isXRRenderTarget，8 位、着色器自己编码成 sRGB、在 sRGB 里混合），所以三个旋钮都是 0 时和原来一模一样：
// 自己写的着色器（天空、洞里的水面……）不用改。
// 暗角原来就有（网页里的 #vig，每章的 E.vig 管浓淡），这里不再加一层。
// 网址后面加 ?post=0 关掉；玩的时候按 G 开 / 关，好对比；控制台里 __g.post.blur / grade / grain 可以调（0 到 1，默认 1）。
const POST = { on: new URLSearchParams(location.search).get('post') !== '0', blur: 1, grade: 1, grain: 1 };
{
  const RT = new THREE.WebGLRenderTarget(1, 1, { samples: 4, depthTexture: new THREE.DepthTexture(1, 1) });
  RT.texture.colorSpace = THREE.SRGBColorSpace; RT.isXRRenderTarget = true;        // 当成屏幕画：输出编码、色调映射都和直接画到画布上一样
  RT.texture.internalFormat = 'RGBA8';            // 存的就是编码好的值，不让显卡再转一道 sRGB（不写的话贴图是 SRGB8_ALPHA8，和多重采样的缓冲对不上，拷不过去）
  const U = { tCol: { value: RT.texture }, tDep: { value: RT.depthTexture }, res: { value: new THREE.Vector2(1, 1) }, cn: { value: 0.5 }, cf: { value: 900 },
    focus: { value: 20 }, blurPx: { value: 2.4 }, gradeK: { value: 1 }, grainK: { value: 1 }, grainCell: { value: 1 }, seed: { value: 0 } };
  const mat = new THREE.ShaderMaterial({ uniforms: U, depthTest: false, depthWrite: false, toneMapped: false,
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: `
      uniform sampler2D tCol, tDep; uniform vec2 res; uniform float cn, cf, focus, blurPx, gradeK, grainK, grainCell, seed;
      varying vec2 vUv;
      float lin(float d) { return cn * cf / (cf - d * (cf - cn)); }                            // 深度图 → 离镜头几米
      float coc(vec2 uv) { return smoothstep(focus + 3.0, focus + 45.0, lin(texture2D(tDep, uv).x)); }   // 这一点该糊多少：人身后三米起，四十多米外糊满
      float h12(vec2 p) { vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
      void main() {
        vec3 c = texture2D(tCol, vUv).rgb;
        // 1. 远处轻微模糊：一圈一圈往外取几个点；取到的点自己越清楚（比如孩子、近处的东西）分量越小，不会把人晕到背景上
        float c0 = coc(vUv) * blurPx;
        if (c0 > 0.05) {
          vec3 acc = c; float wsum = 1.0;
          for (int i = 0; i < 10; i++) {
            float fi = float(i), r = sqrt((fi + 0.5) / 10.0) * c0, a = fi * 2.39996;
            vec2 uv = vUv + vec2(cos(a), sin(a)) * r / res;
            float w = coc(uv);
            acc += texture2D(tCol, uv).rgb * w; wsum += w;
          }
          c = acc / wsum;
        }
        // 2. 统一调色：去掉一点颜色，暗部偏青，亮部微微偏冷，轻轻加一点对比。纯黑基本还是黑
        float l = dot(c, vec3(0.299, 0.587, 0.114));
        vec3 g = mix(vec3(l), c, 0.86);
        float sh = 1.0 - smoothstep(0.0, 0.45, l), hi = smoothstep(0.55, 1.0, l);
        g = mix(g, g * vec3(0.91, 1.0, 1.05) + vec3(0.0, 0.004, 0.007), sh);
        g = mix(g, g * vec3(0.98, 1.0, 1.025), hi);
        g = mix(g, g * g * (3.0 - 2.0 * g), 0.1);
        c = mix(c, g, gradeK);
        // 3. 胶片颗粒：每帧换一张；中间调最明显，纯黑上几乎没有（不把黑抬灰）
        float n = h12(floor(gl_FragCoord.xy / grainCell) + seed) - 0.5;
        c += n * grainK * 0.055 * smoothstep(0.0, 0.1, l) * (1.0 - 0.5 * l);
        gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
      }` });
  const QS = new THREE.Scene(), QC = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat); quad.frustumCulled = false; QS.add(quad);
  const _render = renderer.render.bind(renderer), sz = new THREE.Vector2(), _d = new THREE.Vector3(), _h = new THREE.Vector3();
  let seed = 0;
  const grainEl = () => document.getElementById('grain');
  POST.sync = () => { const g = grainEl(); if (g) g.style.display = POST.on ? 'none' : ''; };   // 开着的时候颗粒由着色器画，网页上那层颗粒藏起来
  renderer.render = (s, c) => {
    if (!POST.on || s !== scene || c !== camera || renderer.getRenderTarget() !== null) { _render(s, c); return; }
    renderer.getDrawingBufferSize(sz);
    if (RT.width !== sz.x || RT.height !== sz.y) RT.setSize(sz.x, sz.y);
    renderer.setRenderTarget(RT); _render(s, c); renderer.setRenderTarget(null);
    camera.getWorldDirection(_d); _h.set(P.x, P.y + 0.6, pathZ(P.x)).sub(camera.position);
    U.focus.value = Math.max(2, _h.dot(_d)); U.cn.value = camera.near; U.cf.value = camera.far;
    U.res.value.copy(sz); U.blurPx.value = 2.4 * sz.y / 1080 * POST.blur; U.gradeK.value = POST.grade; U.grainK.value = POST.grain;
    U.grainCell.value = Math.max(1, Math.round(sz.y / 900)); U.seed.value = (seed = (seed + 37.17) % 997);
    _render(QS, QC);
  };
  addEventListener('keydown', e => { if (e.code === 'KeyG' && !e.repeat) { POST.on = !POST.on; POST.sync(); } });
  addEventListener('DOMContentLoaded', POST.sync); POST.sync();
}
