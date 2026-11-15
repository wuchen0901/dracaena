
// ============================================================
//  第八章 · 生态中枢：分配最后的能源
//  中枢里只有一路电，三样负载：居民水泵、监控网、野地灌溉。前面三段都没有惩罚，只是让玩家看清电是怎么换手的：
//    一 · 扳一下开关，电从监控换到水泵，被监控锁着的门就开了；
//    二 · 推动导电桥，它停在哪块触点上电就送到哪里 —— 这扇卡死的门要靠灌溉让门边的藤长起来顶开；
//    三 · 两只导电桥、三块触点：让监控熄灭、水泵有电，通往核心的门才开。
//  核心里是最后一块电池：推进左边的维修座，07 得到修复，带着小猫离开，中枢照旧运转；
//  推进右边的区域配电盘，附近的灯逐个亮起，水流进野地，07 的灯慢慢暗下去，小猫留在它身边
//  画面：中枢里是逆光 —— 后墙发着冷光，机柜和人都是剪影，前三间屋子暗，核心最亮：后墙上一盏半沉在地面以下的圆灯，
//  磨光的地面把它映成一个整圆，电池正在圆心下面。出了门是暮色里的谷地；旁路结局里先是山后的余晖，灯亮齐以后余晖褪成满天星
// ============================================================
const CH8 = (() => {
  const X = X8, D1 = X + 20, D2 = X + 44, D3 = X + 70, EX = X + 96, DOCK = X + 79, SOCK_L = X + 80.65, SOCK_R = X + 90.4, OUT = X + 98.2;
  const C = chapter({ n: 8, x0: X + 0.5, start: X + 4, name: '生态中枢', sub: '分配最后的能源' });
  C.ground = 'concrete';                                                           // 脚步声：中枢里是磨光的地面；出了门是坡上的草（见下面）；导电桥、电池是铁的
  terrain([EX + 2.1, 0], [X + 104, 0.4], [X + 116, 1.6], [X + 126, 2.4], [X + 140, 2.6], [X + 220, 2.6]);
  ground(X - 0.2, 0x556040); ground(X + 0.2, 0x1e282e); ground(EX + 0.6, 0x1e282e); ground(EX + 1, 0x3f4636); ground(X + 220, 0x3f4636);
  groundBack(X + 60, EX + 2.1, -32); groundBack(EX + 2.1, X + 220, -5);   // 中枢的地面只铺到后墙后面；出了门是一道坡，坡的背后低下去，是一片谷地
  const P2 = [X + 28, X + 32.7, X + 37.4], P3 = [X + 52, X + 57, X + 62];                 // 第二段触点：监控 / 水泵 / 灌溉；第三段：监控 / 灌溉 / 水泵
  const b2 = pushable({ id: 'bridge2', x: P2[0], w: 0.9, h: 0.8, min: P2[0], max: P2[2], grip: 0.7, snd: 'metal' });
  const c1 = pushable({ id: 'bridge3a', x: P3[0], w: 0.9, h: 0.8, min: P3[0], max: P3[2], grip: 0.7, snd: 'metal' });
  const c2 = pushable({ id: 'bridge3b', x: P3[1], w: 0.9, h: 0.8, min: P3[0], max: P3[2], grip: 0.7, snd: 'metal' });
  c1.hi = () => c2.x - 1.15; c2.lo = () => c1.x + 1.15;                                     // 两只桥在同一条轨上，互相越不过去
  const batt = pushable({ id: 'last', x: X + 85.5, w: 0.9, h: 0.8, min: SOCK_L, max: SOCK_R, grip: 0.7, snd: 'metal' });
  surface(EX + 1, X + 230, 'grass');
  const d1 = gate({ id: 'd81', x: D1, w: 0.6, h: 3.4, T: 1.6 }), d2 = gate({ id: 'd82', x: D2, w: 0.6, h: 3.4, T: 3 }), d3 = gate({ id: 'd83', x: D3, w: 0.6, h: 3.4, T: 1.8 }), d4 = gate({ id: 'd84', x: EX, w: 0.9, h: 3.6 });
  // 三段各自的负载状态：eye 监控 / drop 水泵 / leaf 灌溉
  const S = { eye1: true, lv: 0, st: [{ eye: 1, drop: 0, leaf: 0 }, { eye: 1, drop: 0, leaf: 0 }, { eye: 1, drop: 0, leaf: 1 }], v2: 0, open2: false, k: [[1, 0, 0], [1, 0, 0], [1, 0, 1]] };
  // 结局：choice 1 修复 / 2 旁路；t 选了以后过了多久；t2 走出中枢以后过了多久；night、deep 天色变到哪一步（见下面的 nightfall）
  const END = { choice: 0, t: 0, t2: 0, energy: 0.54, sit: 0, night: 0, deep: 0, shown: false, lights: 0 };
  const near = (a, x) => Math.abs(a - x) < 0.3;
  const SUNX = X + 85.5, SUNR = 7.9;                     // 核心后墙上那盏圆灯：圆心正对着最后一块电池，左边是维修座，右边是配电盘
  const MASTS = [[X + 104, 14], [X + 172, 16], [X + 201, 11]];                              // 谷地里的三座中继塔：[x, 高]
  // 谷底那条河在布景板上的走向：t 从 0 到 1，返回 [x, y, 半宽]。近处宽，绕几道弯，远远地细下去
  const rv = t => { t = clamp(t, 0, 1); return [lerp(EX - 38, X + 190, t) + 3.2 * Math.sin(t * 17), -1.5 + 4.3 * Math.pow(t, 0.75) + (0.5 * Math.sin(t * 17 + 1.3) + 0.2 * Math.sin(t * 41 + 0.5)) * (1 - 0.5 * t), lerp(0.6, 0.04, Math.pow(t, 0.55))]; };
  const rvy = x => rv((x - (EX - 38)) / (X + 190 - (EX - 38)))[1];
  function bareTree(g, x, y, h) {                         // 一棵落光了叶子的大树：主干往上分成几股，越分越细
    const limb = (x, y, a, len, w, d) => {
      a = clamp(a, -1.45, 1.45); const x2 = x + Math.sin(a) * len, y2 = y + Math.cos(a) * len; line(g, [[x, y], [x2, y2]], w);
      if (d <= 0) return;
      limb(x2, y2, a - rr(0.2, 0.6), len * rr(0.62, 0.8), w * 0.66, d - 1); limb(x2, y2, a + rr(0.2, 0.6), len * rr(0.62, 0.8), w * 0.66, d - 1);
      if (rnd() < 0.5) limb(lerp(x, x2, 0.55), lerp(y, y2, 0.55), a + (rnd() < 0.5 ? -1 : 1) * rr(0.6, 1.0), len * 0.5, w * 0.5, d - 2);
    };
    poly(g, [[x - h * 0.04, y - 0.3], [x + h * 0.04, y - 0.3], [x + h * 0.021, y + h * 0.3], [x - h * 0.021, y + h * 0.3]]);
    limb(x, y + h * 0.27, rr(-0.08, 0.08), h * 0.19, h * 0.04, 6);
  }
  const FLOOR = { name: 'HubFloor', uniforms: { color: { value: null }, tDiffuse: { value: null }, textureMatrix: { value: null }, uK: { value: 0.62 } },
    vertexShader: `uniform mat4 textureMatrix; varying vec4 vUv; varying vec3 vW;
      void main() { vUv = textureMatrix * vec4(position, 1.0); vW = (modelMatrix * vec4(position, 1.0)).xyz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform vec3 color; uniform sampler2D tDiffuse; uniform float uK; varying vec4 vUv; varying vec3 vW;
      void main() {
        vec2 uv = vUv.xy / vUv.w; vec3 c = vec3(0.);
        for (int i = -4; i <= 4; i++) c += texture2D(tDiffuse, uv + vec2(0., float(i) * 0.006)).rgb;      // 上下抹开一点：地面是磨光的，不是镜子
        vec3 v = normalize(cameraPosition - vW); float f = pow(1. - clamp(v.y, 0., 1.), 3.);               // 看得越斜，映得越清楚
        gl_FragColor = vec4(c / 9. * color * uK * (0.25 + 0.75 * f), 1.);
        #include <colorspace_fragment>
      }` };

  usable({ id: 'sw1', x: X + 12, r: 1.0, on() { S.eye1 = !S.eye1; fx('lever'); fx(S.eye1 ? 'deny' : 'ok'); } });
  checkpoint(X + 4); checkpoint(D1 + 2.5); checkpoint(D2 + 2.5); checkpoint(D3 + 3);
  camKeys([X + 0.6, 18, 1.7, -1.0], [X + 3.5, 17.5, 1.7, 2.4], [X + 10, 19, 2.0, 1], [X + 30, 20, 2.2, 1], [X + 56, 20.5, 2.2, 1], [D3 + 2, 19.5, 2.0, 0.5], [X + 84, 21, 2.3, 0],
    [EX - 2.5, 19, 1.9, -1.8], [EX + 0.4, 18, 1.7, -1.2], [EX + 3.5, 17, 1.6, 2.5], [X + 110, 24, 2.6, 5], [X + 124, 30, 4.2, 7], [X + 140, 32, 4.6, 8]);
  // 中枢里的光只有一种颜色：冷白。hi / mid / lo 从最亮到最暗，wall 是不发光的墙，dark 是挡在光前面的东西
  const INK = { hi: '#eefafd', mid: '#bfe4ee', lo: '#7fb6c8', wall: '#0e171c', dark: '#060b0e', rgb: '190,228,238' };
  const mixc = (a, b, t) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), t).getHexString();
  // 逆光：主光从最远的那面墙照过来，影子朝着镜头；环境光压暗，轮廓光提亮
  const HUB = { fog: 0x1a2932, fogD: 0.026, hemiS: 0x9fc4d6, hemiG: 0x141c24, hemiI: 0.42, keyC: 0xcfe8ff, keyI: 0.6, keyDir: [0.08, 0.5, -1], rimC: 0xa8d8ee, rimI: 1.1, dustC: 0xcfe6f2, dustO: 0.45, wind: 0.03, ext: 0, sunP: 0, cloud: 0, birds: 0,
    aWind: 0, aLeaf: 0, aBug: 0, aCity: 0, aDrip: 0, aRoom: 0.8, roomF: 260, aHum: 1, aFar: 0.9, rvHall: 1.25, rvOut: 0 };   // 声音：机房的低鸣和电流声，继电器、远处机器转起来又停下；又高又空
  env(X - 0.05, HUB); env(EX + 0.7, {});
  // 走出中枢：天快黑了
  env(EX + 2.1, { fog: 0x8a7f86, fogD: 0.006, hemiS: 0xd9c8d6, hemiG: 0x3a3840, hemiI: 0.8, keyC: 0xffb48a, keyI: 1.3, keyDir: [-0.8, 0.22, -0.5], rimC: 0xa9cdd8, rimI: 0.35, dustC: 0xffd9c0, dustO: 0.3, wind: -0.4, ext: 1,
    sky: [0x232c44, 0x4a4f6c, 0x8c7488, 0xd29a86, 0xeab08a, 0x7a6660], sunX: -0.42, sunY: 0.0, sunP: 0.8, sunC: 0xffc9a0, stars: 0.25, cloud: 0.8, cloudC: 0xe9b9a8,
    aRoom: 0, aHum: 0, aDrip: 0, aCity: 0, rvHall: 0, rvOut: 1, aWind: 0.5, aLeaf: 0.3, leafDry: 0.5, aBug: 0.85, aFar: 0.5 });   // 出了门：傍晚的风，满坡的蟋蟀，远处一只猫头鹰
  env(X + 220, {});
  // 旁路结局里天色分两步变。先是余晖（END.night）：天顶黑下来，山后面留着一线橙红，谷地的灯在这时候一盏一盏亮起来；
  // 灯亮齐以后余晖慢慢褪掉（END.deep），剩下满天的星。dim：远山和谷地那几层画出来的布景跟着暗到几成（乘的是线性亮度，所以数字很小）
  const skyOf = n => ({ ...n, fog: new THREE.Color(n.fog), hemiS: new THREE.Color(n.hemiS), hemiG: new THREE.Color(n.hemiG), keyC: new THREE.Color(n.keyC), dustC: new THREE.Color(n.dustC), sky: n.sky.map(hex3) });
  const EMBER = skyOf({ fog: 0x2b2330, hemiS: 0xa898a6, hemiG: 0x1a161c, keyC: 0xffb48c, dustC: 0xe6c8c0, sky: [0x0c1224, 0x1c2644, 0x6a4a5c, 0xc8704e, 0xe89058, 0x2c2228], hemiI: 0.72, keyI: 0.5, stars: 0.7, fogD: 0.008, dim: [0.07, 0.06, 0.09] });
  const DEEP = skyOf({ fog: 0x10151f, hemiS: 0x7f94b8, hemiG: 0x0e1218, keyC: 0x9fb8dc, dustC: 0xb4c6e0, sky: [0x04060e, 0x080d1a, 0x0f1828, 0x18233a, 0x202c44, 0x0c1018], hemiI: 0.7, keyI: 0.5, stars: 2.4, fogD: 0.008, dim: [0.03, 0.04, 0.07] });
  function nightfall(E_) {
    const k = END.night; if (k <= 0) return;
    for (const [N, t] of [[EMBER, k], [DEEP, END.deep]]) {
      if (t <= 0) continue;
      for (const f of ['fog', 'hemiS', 'hemiG', 'keyC', 'dustC']) E_[f].lerp(N[f], t);
      for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) E_.sky[i][j] = lerp(E_.sky[i][j], N.sky[i][j], t);
      E_.hemiI = lerp(E_.hemiI, N.hemiI, t); E_.keyI = lerp(E_.keyI, N.keyI, t); E_.stars = lerp(E_.stars, N.stars, t); E_.fogD = lerp(E_.fogD, N.fogD, t);
    }
    E_.sunP *= 1 - k; E_.cloud *= 1 - 0.7 * k; E_.flies = k;
  }

  const inHub = () => P.x > X && P.x < EX;
  hint(() => inHub() && S.eye1 && Math.abs(P.x - (X + 12)) < 1.6, '按 <b>E</b> 扳动开关');
  hint(() => inHub() && S.eye1 && P.x > D1 - 3 && P.x < D1, '门被监控锁着 —— 回头看看那只开关把电送去了哪里');
  hint(() => inHub() && !S.open2 && Math.abs(P.x - b2.x) < 2.4 && P.mode !== 'push', '按住 <b>E</b> 推动导电桥 —— 它停在哪块触点上，电就送到哪里');
  hint(() => inHub() && !S.open2 && S.st[1].leaf && P.x > D2 - 9 && P.x < D2, '花槽里有水了。藤在长');
  hint(() => inHub() && !S.open2 && P.x > D2 - 3.4 && P.x < D2, '这扇门卡死了。门边的花槽是干的');
  hint(() => inHub() && d3.want === 0 && P.x > D3 - 3.4 && P.x < D3, '这扇门要两样：监控熄灭，水泵有电');
  hint(() => inHub() && d3.want === 0 && P.x > P3[0] - 2.5 && P.x < P3[2] + 2 && P.mode !== 'push', '两只导电桥在同一条轨上，谁也越不过谁');
  hint(() => inHub() && !END.choice && Math.abs(P.x - batt.x) < 2.6 && P.mode !== 'push', '最后一块电池 —— 左边是 07 的维修座，右边是区域配电盘');

  for (const x of [X + 8, X + 16, X + 32, X + 57, X + 85]) spotLight({ p: [x + 1, 9, 2.5], t: [x, 0.3, -0.5], c: 0xcfe6f2, i: 2.3, a: 0.34 });
  const dockL = pointLight({ p: [DOCK, 1.6, 0.2], c: 0xdff3ff, i: 6, d: 7, dec: 1.8, on: 0.25 });
  const panL = pointLight({ p: [X + 91.6, 2.2, 0.2], c: 0x9fe0ff, i: 6, d: 8, dec: 1.8, on: 0.25 });
  const outL = pointLight({ p: [EX - 1.0, 1.5, 0.5], c: 0xffc0a0, i: 12, d: 16, dec: 1.3, on: 0 });

  let V = null;
  // 一块显示三样负载的屏：三个图标灯 + 一幅会动的简图。draw(k, t) 里 k = [监控, 水泵, 灌溉] 各自通电的程度
  function mkPanel(R, x, y, z, w = 4.2) {
    const [c, g] = mkCanvas(384, 112), tex = canvasTex(c), mat = new THREE.MeshBasicMaterial({ map: tex, fog: false }); mat.userData.own = true;
    const h = w * 112 / 384; add(R, bx(w + 0.3, h + 1.1, 0.12), MAT.dark, x, y + 0.3, z - 0.08, false);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.position.set(x, y, z); R.add(m);
    const lamps = ['eye', 'drop', 'leaf'].map((kind, i) => mkIconLamp(R, kind, 0.42, x + (i - 1) * w / 3, y + h / 2 + 0.42, z, kind === 'eye' ? 0xff6a50 : kind === 'drop' ? 0x8fd8ff : 0xa8e08a));
    let last = -1, grow = 0;
    return { draw(k, t) {
      lamps.forEach((l, i) => l.on(k[i])); grow = clamp(grow + (k[2] > 0.5 ? 0.012 : -0.004), 0, 1);
      if (t - last < 0.09) return; last = t;
      g.fillStyle = '#0d151a'; g.fillRect(0, 0, 384, 112); g.lineWidth = 2.5; g.lineCap = 'round';
      const ink = (on, col) => { g.strokeStyle = g.fillStyle = on > 0.5 ? col : '#33414a'; };
      // 监控：一只镜头扫过三个小人，给他们打上“可以 / 不可以”的记号
      ink(k[0], '#ff7a5c'); g.beginPath(); g.rect(18, 14, 26, 14); g.stroke();
      const sx = 34 + 60 * (0.5 + 0.5 * Math.sin(t * 1.4)) * (k[0] > 0.5 ? 1 : 0.4);
      g.globalAlpha = k[0] > 0.5 ? 0.35 : 0.1; g.beginPath(); g.moveTo(34, 28); g.lineTo(sx - 14, 96); g.lineTo(sx + 14, 96); g.closePath(); g.fill(); g.globalAlpha = 1;
      for (let i = 0; i < 3; i++) { const px = 32 + i * 30; g.beginPath(); g.arc(px, 78, 5, 0, 6.2832); g.moveTo(px, 83); g.lineTo(px, 98); g.stroke(); if (k[0] > 0.5) { g.beginPath(); if (i === 1) { g.moveTo(px - 4, 62); g.lineTo(px + 4, 70); g.moveTo(px + 4, 62); g.lineTo(px - 4, 70); } else { g.moveTo(px - 4, 66); g.lineTo(px - 1, 70); g.lineTo(px + 5, 62); } g.stroke(); } }
      // 水泵：水龙头滴水，水槽里的水涨起来
      ink(k[1], '#9fe0ff'); g.beginPath(); g.moveTo(150, 22); g.lineTo(196, 22); g.lineTo(196, 36); g.moveTo(162, 22); g.lineTo(162, 96); g.stroke();
      g.beginPath(); g.rect(176, 74, 46, 22); g.stroke();
      if (k[1] > 0.5) { for (let i = 0; i < 3; i++) { const yy = 40 + ((t * 60 + i * 13) % 36); g.beginPath(); g.arc(196, yy, 2.4, 0, 6.2832); g.fill(); } g.globalAlpha = 0.5; g.fillRect(178, 84, 42, 11); g.globalAlpha = 1; }
      // 灌溉：几株苗，有水就慢慢长
      ink(k[2], '#b4ea94'); g.beginPath(); g.moveTo(268, 96); g.lineTo(368, 96); g.stroke();
      for (let i = 0; i < 4; i++) { const px = 282 + i * 24, hh = 8 + 44 * grow * (0.6 + 0.4 * ((i * 37) % 5) / 5); g.beginPath(); g.moveTo(px, 96); g.lineTo(px, 96 - hh); g.stroke(); if (hh > 18) { g.beginPath(); g.ellipse(px + 6, 96 - hh * 0.6, 6, 3, -0.5, 0, 6.2832); g.ellipse(px - 6, 96 - hh * 0.8, 6, 3, 0.5, 0, 6.2832); g.fill(); } }
      tex.needsUpdate = true;
    } };
  }
  function mkBridge(parent, o) {                         // 导电桥：一只小车，顶上横着一根铜排
    const g = grp(parent, o.x, 0, 0);
    add(g, bx(0.86, 0.1, 0.72), MAT.dark, 0, 0.12, 0); add(g, bx(0.7, 0.42, 0.5), MAT.hub2, 0, 0.4, 0); add(g, bx(0.9, 0.09, 0.2), MAT.copper, 0, 0.66, 0);
    for (const sx of [-1, 1]) { add(g, bx(0.06, 0.5, 0.2), MAT.copper, sx * 0.42, 0.36, 0); add(g, bx(0.05, 0.05, 0.56), MAT.steel, sx * 0.44, 0.78, 0, false); add(g, bx(0.04, 0.2, 0.04), MAT.steel, sx * 0.44, 0.7, 0.26, false); add(g, bx(0.04, 0.2, 0.04), MAT.steel, sx * 0.44, 0.7, -0.26, false); }
    return { g, glow: glow(g, 0x8fd8ff, 1.3, 0, 0, 0.3, 0.4) };
  }
  function mkPads(R, xs, kinds) {                        // 一排触点：地上的铜板 + 墙上的图标灯
    for (const z of [-0.24, 0.24]) add(R, bx(xs[xs.length - 1] - xs[0] + 1.4, 0.05, 0.06), MAT.steel, (xs[0] + xs[xs.length - 1]) / 2, 0.025, z, false);
    return xs.map((x, i) => { add(R, bx(0.9, 0.03, 0.74), MAT.copper, x, 0.03, 0, false); tube(R, [[x, 0.05, -0.4], [x, 0.3, -1.6], [x, 1.9, -2.0]], 0.03, MAT.dark, 8); return mkIconLamp(R, kinds[i], 0.5, x, 2.3, -1.95, kinds[i] === 'eye' ? 0xff6a50 : kinds[i] === 'drop' ? 0x8fd8ff : 0xa8e08a); });
  }
  function mkDoor(R, g, kinds) {                         // 一扇门，门楣上挂着它等的条件
    for (const z of [-1.4, 1.4]) add(R, bx(0.6, 3.6, 0.24), MAT.hub2, g.x, 1.8, z);
    add(R, bx(0.6, 0.3, 3.0), MAT.hub2, g.x, 3.65, 0);
    add(R, bx(0.5, 12, 30), MAT.hub, g.x, 6, -16.6); add(R, bx(0.5, 8.2, 3.2), MAT.hub, g.x, 7.9, 0);
    const m = add(R, bx(0.24, 3.4, 2.56), MAT.steel, g.x, 1.7, 0); for (const y of [-1, 0, 1]) add(m, bx(0.28, 0.08, 2.58), MAT.dark, 0, y, 0, false);
    return { m, lamps: kinds.map((k, i) => mkIconLamp(R, k, 0.4, g.x - 0.4, 4.2, (i - (kinds.length - 1) / 2) * 0.6 + 0.5, k === 'eye' ? 0xff6a50 : k === 'drop' ? 0x8fd8ff : 0xa8e08a)) };
  }
  function* build(R) {
    const v = {};
    // ---------------- 中枢内部 ----------------
    // 逆光：最亮的是最远的那面墙。它不受雾影响，画上去是什么颜色，看到的就是什么颜色；站在它前面的东西都成了剪影。
    // 前三间屋子的后墙是一整面冷光，一间比一间亮；核心的后墙是黑的，光全在那盏圆灯上
    const ROOMS = [[X - 2, D1, 0.3], [D1, D2, 0.42], [D2, D3, 0.56]];
    backdrop(X - 2, EX + 2, -2, 30, -26, 14, g => {
      setInk(g, INK.wall); box(g, X - 2, -2, EX - X + 4, 32);
      for (const [a, b, k] of ROOMS) {                     // 一整面发光的墙：下半截最亮，往上暗下去；窄缝把它分成一格一格
        const gr = g.createLinearGradient(0, 0, 0, 20);
        gr.addColorStop(0, mixc(INK.wall, INK.mid, 0.85 * k)); gr.addColorStop(0.2, mixc(INK.wall, INK.mid, 0.95 * k)); gr.addColorStop(0.55, mixc(INK.wall, INK.lo, 0.55 * k)); gr.addColorStop(1, mixc(INK.wall, INK.lo, 0.12 * k));
        g.fillStyle = gr; box(g, a, -2, b - a, 32);
        setInk(g, INK.wall); for (let x = a + 1.4; x < b; x += 2.75) box(g, x - 0.08, -2, 0.16, 32);
        for (let y = 3.4; y < 22; y += 3.6) box(g, a, y, b - a, 0.1);
      }
    }, { fog: false });
    yield;
    // 人造太阳：核心的后墙上一盏半沉在地面以下的巨大圆灯。圆心在地面上，露出来的是上半个圆，下半个由地面的倒影补上
    backdrop(D3 + 0.25, EX - 0.2, -2, 12, -25.9, 40, g => {
      const gr = g.createRadialGradient(SUNX, 1.0, 0.3, SUNX, 0, SUNR);
      gr.addColorStop(0, INK.hi); gr.addColorStop(0.4, mixc(INK.hi, INK.mid, 0.55)); gr.addColorStop(0.8, INK.mid); gr.addColorStop(0.975, INK.lo); gr.addColorStop(1, `rgba(${INK.rgb},0)`);
      g.fillStyle = gr; disc(g, SUNX, 0, SUNR);
      g.save(); g.beginPath(); g.arc(SUNX, 0, SUNR, 0, 6.2832); g.clip();
      g.fillStyle = 'rgba(8,16,20,.2)'; for (let y = 0.85; y < SUNR; y += 0.85) box(g, SUNX - SUNR, y, SUNR * 2, 0.07);   // 灯面上一道道横格栅
      g.restore();
    }, { fog: false, order: -103 });
    backdrop(D3 + 0.25, EX - 0.2, -2, 22, -25.85, 8, g => {            // 灯外面的一圈光晕，照亮它周围的墙
      const gr = g.createRadialGradient(SUNX, 0, SUNR * 0.9, SUNX, 0, SUNR * 1.95);
      gr.addColorStop(0, `rgba(${INK.rgb},.36)`); gr.addColorStop(0.3, `rgba(${INK.rgb},.14)`); gr.addColorStop(1, `rgba(${INK.rgb},0)`);
      g.fillStyle = gr; box(g, D3, -2, EX - D3, 24);
    }, { fog: false, additive: true, order: -102 });
    yield;
    // 挡在光墙前面的一排排机柜：只剩下轮廓，柜子之间漏出一道道光。机柜只排到核心的门口 —— 核心是一间空的大厅
    const racks = fn => { let i = 0; for (let x = X + 0.5; x < D3 - 2; x += 3.2, i++) fn(x, i); };
    backdrop(X - 2, EX + 2, -1, 22, -11, 20, g => {
      setInk(g, INK.dark);
      racks((x, i) => { const h = [7.6, 9.4, 8.4, 10.4][i % 4]; box(g, x, -1, 2.45, h + 1); box(g, x + 0.3, h, 1.85, 0.3); });
      box(g, D3 + 0.3, -1, 2.5, 11.4); box(g, D3 + 3.0, -1, 2.3, 8.6); box(g, D3 + 5.5, -1, 0.9, 5.2); box(g, EX - 1.5, -1, 1.3, 10.4);   // 核心的两侧各留一组高低错落的机柜，正中让给那盏灯
      for (const [a, b, sg] of [[SUNX - 12.4, SUNX + 9.6, 2.6], [SUNX - 9, SUNX + 10.2, 1.6]]) cable(g, a, 9.6, b, 9.2, sg, 0.06);      // 几根横过灯面的缆线
      truss(g, X - 2, EX + 2, 12.6, 1.1, 0.1);
    });
    backdrop(X - 2, EX + 2, -1, 6, -10.9, 16, g => {       // 机柜上的指示灯：每只柜子同一个高度的一小排（原来是满墙的彩色碎点）
      g.fillStyle = `rgba(${INK.rgb},.85)`;
      racks((x, i) => { for (let k = 0; k < 3; k++) if ((i * 7 + k * 3) % 5) box(g, x + 0.5 + k * 0.32, 1.5, 0.16, 0.05); });
    }, { additive: true, fog: false, order: -40 });
    yield;
    backdrop(X - 2, EX + 2, -1, 15, -3.2, 30, g => {       // 近处的立柱和线槽
      setInk(g, INK.dark);
      for (const x of [X + 6, X + 24, X + 40, X + 48, X + 66, X + 75, X + 94]) { box(g, x - 0.35, -1, 0.7, 16); box(g, x - 0.6, -1, 1.2, 1.3); }
      box(g, X - 2, 6.6, EX - X + 4, 0.5); for (let x = X; x < EX; x += 2.2) box(g, x, 6.2, 0.1, 0.4);
    });
    // 前景：只有从画面顶上垂下来的缆线，和三根经过时扫过画面的立柱。原来沿着画面下沿的那一条不要了：它在地面上成了一道横着的黑带
    backdrop(X - 2, EX + 0.6, -3, 10, 6, 22, g => {
      setInk(g, '#030506');
      for (const x of [X + 22.6, X + 46.6, X + 72.6]) box(g, x, -3, 0.42, 13);
      for (let x = X; x < EX - 4; x += rr(7, 13)) cable(g, x, 6.8, x + rr(5, 10), 6.8, rr(1.6, 2.3), 0.07);
    }, { fog: false, blur: 2.2, order: 4000 });
    yield;
    // 地面。从这个镜头看过去，主角背后是地面而不是墙，所以地面得亮，人才衬得出来。两层：
    // 一层是画上去的 —— 光墙和圆灯落在地上的那一片亮，靠墙的一头亮，朝镜头这一头淡下去；
    const spill = decal(R, X + 1.5, EX - 0.8, -26, -1.5, 0.012, 6, g => {
      for (const [a, b, k] of ROOMS) {
        const gr = g.createLinearGradient(0, -26, 0, -2.5); gr.addColorStop(0, `rgba(${INK.rgb},${0.153 * k})`); gr.addColorStop(1, `rgba(${INK.rgb},0)`);
        g.fillStyle = gr; g.fillRect(a + 0.4, -26, b - a - 0.8, 24.5);
      }
      g.save(); g.beginPath(); g.rect(D3 + 0.4, -26, EX - D3 - 0.8, 24.5); g.clip(); g.translate(SUNX, -26); g.scale(1, 2.4);
      const gr = g.createRadialGradient(0, 0, 0, 0, 0, 10.5); gr.addColorStop(0, `rgba(${INK.rgb},.36)`); gr.addColorStop(1, `rgba(${INK.rgb},0)`);
      g.fillStyle = gr; g.fillRect(-14, 0, 28, 11); g.restore();
    }, { unlit: true });
    spill.material.blending = THREE.AdditiveBlending; spill.material.fog = false;
    // 一层是真的倒影 —— 磨光的地面映出后墙的光和站在上面的东西。倒影是叠加在地面原来的明暗上的，影子和灯下的亮斑都还在
    v.mir = new Reflector(new THREE.PlaneGeometry(EX - X - 2.2, 39), { textureWidth: 768, textureHeight: 432, clipBias: 0.003, shader: FLOOR, color: 0xe6f4fa });
    v.mir.rotation.x = -Math.PI / 2; v.mir.position.set((X + EX) / 2 + 0.35, 0.02, -6.5); v.mir.renderOrder = -120;
    Object.assign(v.mir.material, { transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
    R.add(v.mir);
    yield;
    // 入口：一面水泥墙上开着一个门洞。靠镜头这一侧是一整面黑墙，镜头穿过它时换成室内的光
    const conc = lam(0x5c6156);
    add(R, bx(1.4, 48, 30.7), conc, X + 0.7, 23, -16.65); add(R, bx(1.4, 44.4, 2.6), conc, X + 0.7, 3.6 + 22.2, 0); add(R, bx(1.4, 70, 40), MAT.black, X - 0.7, 30, 21.3, false);
    for (const z of [-1.32, 1.32]) add(R, bx(1.7, 3.7, 0.24), MAT.steel, X + 0.7, 1.85, z);
    for (let x = X + 5; x < EX; x += 5.5) add(R, bx(0.07, 0.012, 30), MAT.dark, x, 0.004, -8, false);
    yield;
    // 一 · 开关
    v.sw = mkLever(R, X + 12, 0, -0.6, { red: 0xff6a50, green: 0x8fd8ff });
    v.pan1 = mkPanel(R, X + 15.4, 2.6, -2.0); tube(R, [[X + 12, 0.9, -0.85], [X + 12.4, 3.4, -1.9], [X + 13.4, 3.5, -2.0]], 0.03, MAT.dark, 8);
    v.d1 = mkDoor(R, d1, ['eye']);
    // 二 · 一只导电桥，三块触点；门边一只干着的花槽和一根藤
    v.pads2 = mkPads(R, P2, ['eye', 'drop', 'leaf']); v.b2 = mkBridge(R, b2); v.pan2 = mkPanel(R, X + 40.6, 2.9, -2.0, 3.6);
    v.d2 = mkDoor(R, d2, ['leaf']);
    add(R, bx(1.6, 0.4, 0.6), MAT.hub2, D2 - 1.3, 0.2, -1.0); tube(R, [[P2[2], 1.9, -2.0], [D2 - 3, 0.5, -1.6], [D2 - 1.9, 0.3, -1.0]], 0.03, MAT.dark, 10);
    v.vine2 = [];
    for (let i = 0; i < 7; i++) { const g = grp(R, D2 - 1.3 + i * 0.16, 0.4 + i * 0.44, -1.0 + i * 0.13); g.rotation.z = -0.5 + 0.12 * i; add(g, cy(0.03, 0.045, 0.5, 5), MAT.leaf, 0, 0.25, 0); for (let k = 0; k < 2; k++) add(g, new THREE.SphereGeometry(0.1, 6, 5), k ? MAT.leaf2 : MAT.leaf, rr(-0.12, 0.12), 0.2 + 0.2 * k, rr(-0.1, 0.1)).scale.set(1.3, 0.5, 0.9); v.vine2.push(g); }
    yield;
    // 三 · 两只导电桥
    v.pads3 = mkPads(R, P3, ['eye', 'leaf', 'drop']); v.c1 = mkBridge(R, c1); v.c2 = mkBridge(R, c2); v.pan3 = mkPanel(R, X + 66.2, 2.9, -2.0, 3.4);
    v.d3 = mkDoor(R, d3, ['eye', 'drop']);
    yield;
    // 核心：左边是维修座，右边是区域配电盘，中间一条轨上是最后一块电池
    add(R, bx(2.2, 3.4, 0.5), MAT.hub2, DOCK - 0.4, 1.7, -1.5); add(R, bx(1.3, 2.3, 0.2), MAT.dark, DOCK - 0.4, 1.4, -1.22);
    v.clamps = [-1, 1].map(s => { const g = grp(R, DOCK - 0.4 + s * 0.62, 1.5, -1.05); add(g, bx(0.12, 0.9, 0.16), MAT.steel, 0, 0, 0.3); add(g, bx(0.12, 0.16, 0.5), MAT.steel, 0, 0, 0.05); return g; });
    v.dockLamp = glow(R, 0xdff3ff, 3.2, 0.2, DOCK - 0.4, 2.2, -1.0);
    add(R, bx(1.5, 0.82, 0.08), MAT.dark, DOCK - 0.4, 3.75, -1.2);
    plate(R, iconTex('bot'), 0.44, 0.44, DOCK - 0.9, 3.75, -1.14, 0xff6a50, { order: 1 }); plate(R, textTex('07\n维修期限已过', { w: 256, h: 128, size: 34, color: '#ffb8a6' }), 0.86, 0.43, DOCK - 0.12, 3.75, -1.14, 0xffffff, { order: 1 });
    add(R, bx(0.5, 1.0, 0.5), MAT.steel, SOCK_L - 0.7, 0.5, -0.45); v.sockL = unlit(0xff4a2a, { fog: false }); add(R, new THREE.SphereGeometry(0.06, 8, 6), v.sockL, SOCK_L - 0.7, 1.1, -0.18, false);
    plate(R, textTex('人工旁路', { w: 256, h: 72, size: 40, color: '#cfe0e6', worn: 9 }), 0.9, 0.25, SOCK_L - 0.7, 1.45, -0.6, 0x9fb0b6, { fog: true, order: 1 });
    for (const z of [-0.26, 0.26]) add(R, bx(SOCK_R - SOCK_L + 1.4, 0.05, 0.06), MAT.steel, (SOCK_L + SOCK_R) / 2, 0.025, z, false);
    v.batt = grp(R, batt.x, 0, 0);
    add(v.batt, bx(0.86, 0.1, 0.72), MAT.dark, 0, 0.12, 0); add(v.batt, bx(0.78, 0.5, 0.6), lam(0x3c4a44), 0, 0.43, 0); add(v.batt, bx(0.8, 0.07, 0.62), MAT.copper, 0, 0.36, 0, false); add(v.batt, bx(0.3, 0.08, 0.3), MAT.copper, 0, 0.72, 0);
    for (const sx of [-1, 1]) { add(v.batt, bx(0.04, 0.34, 0.5), MAT.steel, sx * 0.43, 0.6, 0, false); add(v.batt, bx(0.05, 0.05, 0.56), MAT.steel, sx * 0.43, 0.78, 0, false); }
    v.cells = [0, 1, 2].map(i => add(v.batt, bx(0.1, 0.07, 0.02), unlit(0x8fe6ff, { fog: false }), -0.16 + i * 0.16, 0.5, 0.31, false));
    add(R, bx(0.5, 1.0, 0.5), MAT.steel, SOCK_R + 0.7, 0.5, -0.45); v.sockR = unlit(0xff4a2a, { fog: false }); add(R, new THREE.SphereGeometry(0.06, 8, 6), v.sockR, SOCK_R + 0.7, 1.1, -0.18, false);
    v.pan4 = mkPanel(R, X + 92.4, 3.0, -1.9, 4.4);
    tube(R, [[SOCK_L - 0.7, 0.9, -0.7], [SOCK_L - 0.9, 1.4, -1.3], [DOCK + 0.2, 1.0, -1.3]], 0.07, MAT.dark, 10); tube(R, [[SOCK_R + 0.7, 0.9, -0.7], [SOCK_R + 1.2, 2.0, -1.5], [X + 92.4, 2.3, -1.9]], 0.07, MAT.dark, 10);
    // 出口：和第一章一样，一面墙、一扇闸门、镜头一侧的黑墙
    add(R, bx(1.4, 48, 30.7), MAT.hub, EX, 23, -16.65); add(R, bx(1.4, 44.4, 2.6), MAT.hub, EX, 3.6 + 22.2, 0); add(R, bx(1.4, 70, 40), MAT.black, EX + 1.4, 30, 21.3, false);
    v.d4 = mkGateDoor(R, d4);
    v.outGlow = new THREE.MeshBasicMaterial({ color: 0xffc8a8, transparent: true, opacity: 0, fog: false, depthWrite: false });
    add(R, new THREE.PlaneGeometry(2.44, 3.6), v.outGlow, EX + 0.62, 1.8, 0, false).rotation.y = -Math.PI / 2;
    yield;

    // ---------------- 中枢外面：一道缓坡，坡的背后低下去，是一片谷地 ----------------
    // 地面只铺到坡的背面（z = -5），再往后都是画出来的：远山、对面的山坡、谷底的河和屋子、坡下探上来的树梢。
    // 这几层都从中枢的墙后面就开始画，走出门的那一刻墙边不会露出一条空缝
    const gy = groundY, VX1 = EX - 40, VX2 = X + 192, gyc = x => gy(clamp(x, EX + 2.2, X + 219.5));
    const strips = (x1, x2, n, fn) => { for (let i = 0; i < n; i++) fn(lerp(x1, x2, i / n), lerp(x1, x2, (i + 1) / n)); };   // 太长的一层切成几段画，贴图才够清楚
    v.dim = [];                                            // 天黑以后要跟着暗下去的那几层
    v.dim.push(backdrop(EX - 60, X + 235, -30, 44, -150, 12, g => {     // 远山：两道。压得比原来低，给天留出地方
      setInk(g, vgrad(g, 26, -4, '#6d6a80', '#4f4d62')); ridge(g, EX - 60, X + 235, -30, x => 13.5 + 6 * Math.sin(x / 33) + 2.4 * Math.sin(x / 12 + 1) + rr(-0.3, 0.3), 1.2);
      setInk(g, vgrad(g, 14, -4, '#55546a', '#403f52')); ridge(g, EX - 60, X + 235, -30, x => 6 + 3.6 * Math.sin(x / 21 + 2) + 1.6 * Math.sin(x / 6.7) + rr(-0.35, 0.35), 1);
    }, { fog: false, order: -2000 }));
    yield;
    const LAMPS = [];                                      // 谷地里每一扇会亮的窗：[x, y, 远近]
    v.dim.push(backdrop(VX1, VX2, -8, 22, -60, 28, g => {
      // 对面的山坡：越往下越淡，像沉着一层暮霭；山脊上一线树
      const far = x => 6.4 + 1.3 * Math.sin(x / 23) + 0.5 * Math.sin(x / 7.3 + 2), sc = y => clamp(lerp(1.25, 0.5, (y + 1) / 4), 0.5, 1.3);
      setInk(g, vgrad(g, 8, 0.5, '#3a394b', '#6a6478')); ridge(g, VX1, VX2, -8, far, 0.5);
      setInk(g, '#3a394b'); for (let x = VX1; x < VX2; x += rr(0.25, 0.7)) disc(g, x, far(x) + rr(-0.05, 0.12), rr(0.16, 0.42));
      // 谷底：几块田、一条映着天光的河
      setInk(g, vgrad(g, 3.4, -2.4, '#625c70', '#34323f')); ridge(g, VX1, VX2, -8, x => 3.1 + 0.35 * Math.sin(x / 17 + 2), 1);
      for (let i = 0; i < 46; i++) { g.fillStyle = i % 2 ? 'rgba(255,240,250,.05)' : 'rgba(10,8,16,.1)'; const y = rr(-1.4, 2.8), k = 1 - (y + 1.4) / 4.2; box(g, rr(VX1, VX2), y, rr(4, 12) * (0.4 + k), 0.04 + 0.1 * k); }
      const bank = []; for (let i = 0; i <= 100; i++) { const [x, y, w] = rv(i / 100); bank.push([x, y + w]); } for (let i = 100; i >= 0; i--) { const [x, y, w] = rv(i / 100); bank.push([x, y - w]); }
      setInk(g, vgrad(g, 3, -1.5, '#d8b8ac', '#a9a2b6')); poly(g, bank);
      // 屋子：三三两两挨着河。越靠上越远，画得越小
      const house = (x, y, k) => {
        const w = rr(1.5, 2.5) * k, h = rr(0.75, 1.2) * k, r = rr(0.45, 0.8) * k;
        box(g, x, y - 0.1, w, h + 0.1); poly(g, [[x - 0.14 * k, y + h], [x + w / 2, y + h + r], [x + w + 0.14 * k, y + h]]);
        if (rnd() < 0.5) box(g, x + w * rr(0.6, 0.8), y + h, 0.14 * k, r + 0.25 * k);
        LAMPS.push([x + w * rr(0.25, 0.75), y + h * 0.52, k]); if (rnd() < 0.5) LAMPS.push([x + w * rr(0.08, 0.2), y + h * 0.5, k]);
      };
      setInk(g, '#262531');
      for (const [hx, off, n] of [[EX + 7, -1.0, 3], [X + 107, -1.1, 4], [X + 122, 0.9, 7], [X + 141, -1.2, 3], [X + 156, 1.1, 6], [X + 172, -0.9, 4], [X + 186, 1.3, 5]])   // 几个小村子：[中心, 在河的哪一侧, 几户]
        for (let i = 0; i < n; i++) { const x = hx + rr(-5.5, 5.5), y = rvy(x) + off + rr(-0.45, 0.45), k = sc(y); house(x, y, k); }
      for (let i = 0; i < 6; i++) { const x = rr(EX + 4, X + 188), y = rvy(x) + (rnd() < 0.5 ? rr(1.5, 2.6) : -rr(1.6, 2.3)); house(x, y, sc(y)); }   // 几户散户
      // 靠近中枢的一侧是一排排一模一样的标准树，远离中枢的一侧是没人管的林子
      setInk(g, '#2b2a37');
      for (let x = VX1 + 3; x < X + 120; x += rr(9, 16)) { const y = rvy(x) + rr(1.4, 2.2), k = sc(y); for (let i = 0; i < 6; i++) { g.save(); g.translate(x + i * 0.95 * k, y); g.scale(k, k); tree(g, 0, 0, 1.9, 'trim'); g.restore(); } }
      for (let x = X + 124; x < VX2; x += rr(0.8, 2.6)) { const y = rvy(x) + (rnd() < 0.6 ? rr(0.5, 2.2) : -rr(0.8, 2)), k = sc(y); disc(g, x, y + 0.7 * k, rr(0.45, 0.9) * k); disc(g, x + 0.5 * k, y + 0.5 * k, rr(0.35, 0.7) * k); box(g, x - 0.05, y - 0.1, 0.1, 0.8 * k); }
      // 中继塔
      setInk(g, '#22212b');
      for (const [x, h] of MASTS) { const y = rvy(x) + 1.1; line(g, [[x, y - 0.5], [x, y + h]], 0.16); line(g, [[x - 1.1, y + h - 1], [x + 1.1, y + h - 1]], 0.1); line(g, [[x - 0.7, y + h - 2.2], [x + 0.7, y + h - 2.2]], 0.08); line(g, [[x - 2.6, y - 0.4], [x, y + h * 0.7], [x + 2.6, y - 0.4]], 0.035); }
      // 这一侧的山坡：最暗的一片树冠，大半藏在坡顶后面
      const near = x => -2.3 + 0.8 * Math.sin(x / 17) + 0.35 * Math.sin(x / 5.1);
      setInk(g, '#1b1a24'); ridge(g, VX1, VX2, -8, near, 0.6); for (let x = VX1; x < VX2; x += rr(0.5, 1.3)) disc(g, x, near(x) + rr(-0.1, 0.25), rr(0.45, 1.0));
    }));
    yield;
    backdrop(EX - 6, X + 232, -6, 14, -24, 16, g => {      // 坡背后探上来的几丛树梢
      setInk(g, '#08090b');
      for (const [x, h, w] of [[EX + 5, 6.5, 5], [X + 109, 2.6, 3.4], [X + 151, 2.3, 4], [X + 176, 2.6, 3.6], [X + 200, 4.5, 8]]) {
        const top = xx => gyc(x) - 1.6 + h * Math.cos(clamp((xx - x) / w, -1, 1) * 1.45);
        ridge(g, x - w, x + w, -6, top, 0.5); for (let xx = x - w; xx < x + w; xx += rr(0.5, 1.2)) disc(g, xx, top(xx) + rr(-0.2, 0.3), rr(0.6, 1.3));
      }
    });
    strips(EX + 1.8, X + 222, 2, (a, b) => backdrop(a, b, -3, 9, -5.15, 34, g => {        // 坡背面的草边：正好盖住地面的尽头
      setInk(g, '#0c0e0e'); ridge(g, a, b, -3, x => gyc(x) + rr(0.02, 0.14), 0.3);
      grass(g, a, b, x => gyc(x) - 0.02, 0.2, 0.75, 750);
      for (let x = a + rr(2, 6); x < b; x += rr(4, 11)) { const y = gyc(x); for (let k = 0; k < 5; k++) disc(g, x + rr(-0.9, 0.9), y + rr(0.05, 0.5), rr(0.3, 0.7)); }
    }));
    yield;
    // 脚边的草：主角身后一层、身前一层，走过去的时候脚陷在草里
    for (const [z, n, hh, col] of [[-1.3, 150, 0.5, '#0f1110'], [1.5, 90, 0.34, '#070908']]) strips(EX + 2.4, X + 220, 3, (a, b) => backdrop(a, b, -1, 5, z, 44, g => {
      setInk(g, col);
      for (let i = 0; i < n; i++) { const x = rr(a + 0.3, b - 0.3), y = gyc(x); for (let k = 0; k < 5; k++) poly(g, [[x - 0.025, y - 0.04], [x + 0.025, y - 0.04], [x + rr(-0.18, 0.18), y + rr(0.45, 1) * hh]]); }
    }, z > 0 ? { blur: 0.8 } : {}));
    // 坡顶的一棵老树：叶子落光了
    backdrop(X + 127, X + 142, 1.5, 14, -3.4, 44, g => { setInk(g, '#0a0b0a'); bareTree(g, X + 134.5, gy(X + 134.5) - 0.1, 9.4); });
    backdrop(EX + 1.6, X + 230, -3, 10, 6, 22, g => {      // 前景
      setInk(g, '#040607'); const top = [[EX + 1.6, -5]];
      for (let x = EX + 1.6; x <= X + 230; x += rr(0.4, 1.2)) { const h = gy(EX + (x - EX) * 0.985 + 1) * 0.72 + rr(0.25, 0.6); top.push([x, h]); if (rnd() < 0.55) top.push([x + 0.05, h + rr(0.3, 1.1)], [x + 0.13, h]); }
      top.push([X + 230, -5]); poly(g, top);
    }, { fog: false, blur: 2.2, order: 4000 });
    yield;
    // 谷地里的灯：屋子的窗。旁路结局里从坡下最近的一扇开始，一盏一盏往远处亮。帮过的人越多，亮的越多
    LAMPS.sort((a, b) => Math.abs(a[0] - (X + 128)) - Math.abs(b[0] - (X + 128)));
    v.lamps = LAMPS.map(([x, y, k], i) => ({ s: glow(R, i % 6 === 5 ? 0xcfeaff : 0xffc98a, 0.8 * k + 0.3, 0, x, y, -59.7), at: 1.5 + i * 0.26 + rr(0, 0.3), tier: i % 4 }));
    for (const L of v.lamps) L.s.renderOrder = -230;
    // 中继塔顶上的红灯和监控光：修复结局里它们一直在扫，旁路结局里天黑以前就灭了
    const mastTop = ([x, h]) => rvy(x) + 1.1 + h;
    v.mastLamps = MASTS.map(m => { const l = glow(R, 0xff5a40, 1.5, 0.8, m[0], mastTop(m), -59.8); l.renderOrder = -229; return l; });
    v.beams = MASTS.map(m => { const b = grp(R, m[0], mastTop(m) - 1, -60), len = 30;
      for (const k of [1, 0.62, 0.3]) { const geo = new THREE.ConeGeometry(Math.tan(0.075) * len * k, len, 20, 1, true); geo.translate(0, -len / 2, 0); geo.rotateX(-Math.PI / 2);
        const c = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: beamGradTex(), color: 0xd8ecf2, transparent: true, opacity: 0.034, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false })); c.renderOrder = -228; b.add(c); }
      return b; });
    // 旁路以后流进野地的水：从河上分出一股，绕着弯流向近处那片没人管的林子。和河是一个颜色，只是新来的水更亮一些
    v.water = backdrop(X + 122, VX2, -5, 5, -59.9, 28, g => {
      const x0 = X + 128, y0 = rvy(x0), band = [], at = t => [lerp(x0, X + 188, t) + 1.6 * Math.sin(t * 9), y0 - 0.1 - 2.7 * Math.pow(t, 1.15) + 0.3 * Math.sin(t * 9 + 1.4) * (0.3 + t), lerp(0.04, 0.34, t)];
      for (let i = 0; i <= 60; i++) { const [x, y, w] = at(i / 60); band.push([x, y + w]); } for (let i = 60; i >= 0; i--) { const [x, y, w] = at(i / 60); band.push([x, y - w]); }
      setInk(g, vgrad(g, 1, -3, '#d8b8ac', '#b9b2c6')); poly(g, band);
    }, { opacity: 0, order: -239 });                       // 次序要明说：它和谷地那一层几乎一样远，不然会被谷地盖住
    v.galaxy = backdrop(X - 80, X + 330, 20, 110, -400, 5, g => {     // 星河：斜着横过天顶的一条。余晖褪掉以后才显出来
      const ax = t => [lerp(X - 60, X + 320, t), lerp(34, 96, t)];
      for (let i = 0; i < 40; i++) { const [x, y] = ax(i / 39), gr = g.createRadialGradient(x, y, 0, x, y, 26); gr.addColorStop(0, 'rgba(150,170,220,.06)'); gr.addColorStop(1, 'rgba(150,170,220,0)'); g.fillStyle = gr; g.fillRect(x - 26, y - 26, 52, 52); }
      for (let i = 0; i < 3400; i++) { const [x, y] = ax(rnd()), d = (rnd() + rnd() + rnd() - 1.5) * 22, a = rr(0.25, 1); g.fillStyle = `rgba(${rnd() < 0.2 ? '255,236,214' : '214,228,255'},${a})`; const r = rnd() < 0.04 ? 0.3 : rr(0.08, 0.17); g.fillRect(x - d * 0.16 - r, y + d - r, r * 2, r * 2); }
    }, { additive: true, fog: false, opacity: 0, order: -2100 });
    v.sprout = grp(R, 0, 0, 0.3); add(v.sprout, cy(0.012, 0.018, 0.22, 5), MAT.leaf2, 0, 0.11, 0, false); for (const s of [-1, 1]) add(v.sprout, new THREE.SphereGeometry(0.05, 6, 5), MAT.leaf2, s * 0.05, 0.2, 0, false).scale.set(1.5, 0.4, 0.8);
    v.sprout.visible = false;
    V = v;
  }

  function choose(c) {
    END.choice = c; END.t = 0; batt.locked = true; STORY.ending = c; saveGame(); fx('dock');
    if (c === 1) { ctl = false; autoDir = 0; } else fx('powerUp');
  }
  const ch7Root = () => { const z = ZONES.find(z => z.n === 7); return z && z.root; };
  function update(dt) {
    // 镜头进了中枢以后把第七章的布景整个藏起来：它的树一直画到门里面，远山一直画到中枢背后（出了门会在天上留一道残影）
    { const r = ch7Root(); if (r) r.visible = camera.position.x < X + 2.5; }
    // ---- 三段线路 ----
    S.lv = damp(S.lv, S.eye1 ? 0 : 1, 6, dt);
    const s1 = S.st[0], s2 = S.st[1], s3 = S.st[2];
    s1.eye = S.eye1 ? 1 : 0; s1.drop = S.eye1 ? 0 : 1; s1.leaf = 0;
    s2.eye = near(b2.x, P2[0]) ? 1 : 0; s2.drop = near(b2.x, P2[1]) ? 1 : 0; s2.leaf = near(b2.x, P2[2]) ? 1 : 0;
    const on3 = x => near(c1.x, x) || near(c2.x, x) ? 1 : 0; s3.eye = on3(P3[0]); s3.leaf = on3(P3[1]); s3.drop = on3(P3[2]);
    S.st.forEach((s, i) => { const k = S.k[i], was = k[0] + k[1] * 2 + k[2] * 4; k[0] = s.eye; k[1] = s.drop; k[2] = s.leaf; if (state === 'play' && inHub() && was !== k[0] + k[1] * 2 + k[2] * 4 && i > 0) fx('dock'); });
    d1.want = S.eye1 ? 0 : 1;
    if (s2.leaf && !S.open2) { const was = S.v2; S.v2 = Math.min(1, S.v2 + dt / 3); if (Math.floor(S.v2 * 3) !== Math.floor(was * 3)) fx('grow'); if (S.v2 >= 1) { S.open2 = true; fx('ok'); } }
    d2.want = S.open2 ? 1 : 0;
    d3.want = !s3.eye && s3.drop ? 1 : 0;
    if (inHub()) AUD.buzz = 0.6;

    // ---- 最后的选择 ----
    if (!END.choice && state === 'play') { if (batt.x <= SOCK_L + 0.02) choose(1); else if (batt.x >= SOCK_R - 0.02) choose(2); }
    const E1 = END.choice === 1, E2 = END.choice === 2;
    if (END.choice) { END.t += dt; if (END.t > 0.9) batt.off = true; }                              // 电池滑进插座里，不再挡路
    const t = END.t;
    if (E1) {
      // 修复：07 自己走进维修座，夹具合上，灯一点点亮回来；然后门开了，它带着小猫离开
      if (t < 8.4) { ctl = false; autoDir = t > 0.8 && P.x > DOCK - 0.3 ? -1 : 0; if (t > 1.2 && autoDir === 0) P.facing = 1; }
      else if (state === 'play' && !ctl && P.x < EX + 20) { ctl = true; autoDir = 0; d4.want = 1; fx('ok'); }
      END.energy = lerp(0.54, 1.25, sstep(3.2, 7.6, t));
      if (t > 3 && t < 7.8) { HX.pose = { arms: [{ a: 0.2, b: 0.1 }, { a: 0.2, b: 0.1 }], look: 0 }; if (Math.floor(t * 2) !== Math.floor((t - dt) * 2)) fx('servo'); }
      if (state === 'play' && ctl && P.x > X + 122) { ctl = false; autoDir = 1; }                    // 走上坡顶：最后一段自己走完
      if (P.x > X + 122) { END.t2 += dt; if (P.x > X + 133) autoDir = 0; if (END.t2 > 6 && !END.shown) { END.shown = true; state = 'end'; showEnd('结局 · 修复', '07 带着小猫离开了。<br>中枢照旧运转：水泵、镜头和修剪机，仍然只为算得清的生命工作。'); } }
    } else if (E2) {
      // 旁路：三样负载里，水泵和灌溉亮起来，监控熄灭。07 走出门去，越走越慢，灯越来越暗
      if (t > 2.6 && d4.want === 0) { d4.want = 1; fx('powerDown'); }
      const far = sstep(EX - 4, X + 126, P.x);
      END.energy = Math.min(END.energy, lerp(0.5, 0.16, far));
      if (END.sit === 0) { P.speedK = lerp(1, 0.16, sstep(EX + 6, X + 126, P.x)); if (P.x > X + 125.5 && P.grounded && state === 'play') { END.sit = 0.001; ctl = false; autoDir = 0; catHold(P.x + 0.62, P.y, 'curl', -1); } }
      else {
        END.sit = Math.min(1, END.sit + dt / 2.2); END.t2 += dt; END.energy = lerp(0.16, 0.02, sstep(2, 11, END.t2));
        if (END.t2 > 19 && !END.shown) { END.shown = true; state = 'end'; showEnd('结局 · 微光', '附近的灯一盏一盏亮起来，水流进了野地。<br>07 的灯暗了下去。小猫留在它身边。'); }
      }
      if (END.sit > 0) HX.pose = { sit: END.sit, sitH: 0.2, sitLeg: 1.25, limp: sstep(4, 10, END.t2), bow: 0.1 * END.sit, look: 0 };
      END.night = sstep(EX + 10, X + 126, P.x) * 0.35 + 0.65 * sstep(0, 13, END.t2); END.deep = sstep(14, 34, END.t2);
      envMod = nightfall;
    }
    if (END.choice && P.x > X + 60) HX.energy = END.energy;
    if (END.choice && P.x > X + 112 && state !== 'title') { const k = E2 ? sstep(1.5, 9, END.t2) : 0; camOvr = { d: lerp(30, 19, k), yo: lerp(3.6, 1.6, k), xo: lerp(5.5, 3.2, k) }; }   // 坐下以后镜头慢慢靠近
    outL.on = E.ext > 0.5 ? 0 : d4.open;
    dockL.on = E1 ? 0.3 + 0.7 * sstep(1, 3, t) : 0.25; panL.on = E2 ? 1 : 0.25;

    const v = V; if (!v) return;
    v.mir.visible = camera.position.x > X - 1.4 && camera.position.x < EX + 1.4;   // 倒影要把整个场景再画一遍：镜头在中枢外面（隔着黑墙看不见地面）的时候就不画了
    if (P.x < X - 30 || P.x > X + 230) return;
    v.sw.set(S.lv); v.pan1.draw(S.k[0], T); v.pan2.draw(S.k[1], T); v.pan3.draw(S.k[2], T);
    v.d1.m.position.y = 1.7 + sstep(0, 1, d1.open) * 3.35; v.d1.lamps[0].on(s1.eye);
    v.d2.m.position.y = 1.7 + sstep(0, 1, d2.open) * 3.35; v.d2.lamps[0].on(s2.leaf || S.open2 ? 1 : 0);
    v.d3.m.position.y = 1.7 + sstep(0, 1, d3.open) * 3.35; v.d3.lamps[0].on(s3.eye); v.d3.lamps[1].on(s3.drop);
    v.pads2.forEach((l, i) => l.on([s2.eye, s2.drop, s2.leaf][i])); v.pads3.forEach((l, i) => l.on([s3.eye, s3.leaf, s3.drop][i]));
    v.b2.g.position.x = b2.x; v.b2.glow.material.opacity = 0.7 * (s2.eye || s2.drop || s2.leaf);
    v.c1.g.position.x = c1.x; v.c1.glow.material.opacity = 0.7 * (P3.some(x => near(c1.x, x)) ? 1 : 0);
    v.c2.g.position.x = c2.x; v.c2.glow.material.opacity = 0.7 * (P3.some(x => near(c2.x, x)) ? 1 : 0);
    v.vine2.forEach((g, i) => { const k = clamp(S.v2 * 7.5 - i, 0, 1); g.visible = k > 0.02; g.scale.set(0.6 + 0.4 * k, k, 0.6 + 0.4 * k); });
    v.batt.position.x = batt.x; v.batt.position.z = END.choice ? -0.78 * sstep(0.5, 1.5, t) : 0; v.cells.forEach((m, i) => m.material.color.setHex(END.choice && t > 0.6 + i * 0.7 ? 0x1a2a30 : 0x8fe6ff));
    v.sockL.color.setHex(E1 ? 0x6dff9a : 0xff4a2a); v.sockR.color.setHex(E2 ? 0x6dff9a : 0xff4a2a);
    const clampK = E1 ? sstep(2.6, 3.4, t) * (1 - sstep(7.6, 8.4, t)) : 0;
    v.clamps.forEach((g, i) => { g.rotation.y = (i ? 1 : -1) * lerp(1.1, 0.0, clampK); });
    v.dockLamp.material.opacity = E1 ? 0.25 + 0.6 * sstep(1, 3, t) * (0.8 + 0.2 * Math.sin(T * 9)) : 0.2;
    // 配电盘：选旁路以后，水泵和灌溉先后亮起，最后监控熄灭
    v.pan4.draw(E2 ? [t > 2.4 ? 0 : 1, t > 0.7 ? 1 : 0, t > 1.5 ? 1 : 0] : [1, 0, 0], T);
    v.d4.sync(d4); v.outGlow.opacity = E.ext > 0.5 ? 0 : 0.9 * sstep(0.02, 0.8, d4.open);
    // 外面
    const want = (STORY.fed ? 1 : 0) + (STORY.pump ? 1 : 0) + (STORY.cleaner === 1 || STORY.water ? 1 : 0);          // 一路上帮过的人：亮起的灯多几层
    for (const L of v.lamps) L.s.material.opacity = damp(L.s.material.opacity, E2 && END.t2 > L.at && L.tier <= want ? 1 : 0, 1.5, dt);
    const nk = E2 ? END.night : 0, dk = E2 ? END.deep : 0, dimTo = j => lerp(lerp(1, EMBER.dim[j], nk), DEEP.dim[j], dk);
    for (const m of v.dim) m.material.color.setRGB(dimTo(0), dimTo(1), dimTo(2));
    v.beams.forEach((b, i) => { b.visible = !E2 || END.night < 0.3; for (const c of b.children) c.material.opacity = 0.034 * (E2 ? 1 - END.night / 0.3 : 1); b.lookAt(b.position.x + 16 * Math.sin(T * 0.35 + i * 2.1), -6, -46); });
    v.mastLamps.forEach((l, i) => { l.material.opacity = (E2 ? 1 - sstep(0, 0.3, END.night) : 1) * (Math.sin(T * 2.2 + i * 1.7) > 0 ? 0.85 : 0.2); });
    v.water.material.opacity = E2 ? sstep(4, 10, END.t2) * (STORY.wild ? 1 : 0.5) : 0; v.water.material.color.setRGB(Math.min(1, dimTo(0) * 2.4), Math.min(1, dimTo(1) * 2.4), Math.min(1, dimTo(2) * 2.4));
    v.galaxy.material.opacity = sstep(0.3, 1, dk);
    v.sprout.visible = E2 && END.t2 > 12; if (v.sprout.visible) { v.sprout.position.set(P.x + 0.34, P.y, 0.3); v.sprout.scale.setScalar(sstep(12, 17, END.t2)); }
  }
  function resetEnd() { placeBox(batt, X + 85.5); batt.locked = false; batt.off = false; setGate(d4, 0); Object.assign(END, { choice: 0, t: 0, t2: 0, energy: 0.54, sit: 0, night: 0, deep: 0, shown: false }); envMod = null; P.speedK = 1; STORY.ending = 0; }
  function reset() {
    { const r = ch7Root(); if (r) r.visible = true; }       // 从菜单跳到别的章节时，把上面藏起来的布景还回去
    S.eye1 = true; S.lv = 0; S.v2 = 0; S.open2 = false; placeBox(b2, P2[0]); placeBox(c1, P3[0]); placeBox(c2, P3[1]);
    for (const g of [d1, d2, d3]) setGate(g, 0); resetEnd();
  }
  function solve() { reset(); }
  // 结局以后按 R：回到核心，重新做最后的选择
  function retry() {
    resetEnd(); S.eye1 = false; S.open2 = true; S.v2 = 1; placeBox(b2, P2[2]); placeBox(c1, P3[1]); placeBox(c2, P3[2]); for (const g of [d1, d2, d3]) setGate(g, 1);
    placePlayer(D3 + 3); P.cp = cpAt(P.x); if (STORY.cat) catPlace(P.x - 0.9, 0); ctl = true; autoDir = 0; state = 'play'; camOvr = null;
    $('end').classList.add('hide'); $('fade').style.opacity = 0; saveGame(); snapCamera(); applyEnv(camera.position.x); streamZones(cam.x, true);
  }
  return defZone({ n: 8, vis: [X - 6, X + 232], build, update, reset, solve, retry, unbuild() { if (V && V.mir) V.mir.dispose(); V = null; }, S, END, batt, b2, c1, c2, d1, d2, d3, d4 });
})();
function retryEnding() { (endZone ?? CH8).retry(); }
