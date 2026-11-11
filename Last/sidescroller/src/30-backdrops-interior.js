
// ============================================================
//  布景板：用 2D 画布“画”出剪影，贴在不同深度的平面上，镜头移动时自然产生视差
// ============================================================
const FOG_IN = new THREE.Color(0x25343a), FOG_OUT = new THREE.Color(0xc9a47c);
scene.background.copy(FOG_IN); scene.fog.color.copy(FOG_IN);

// 世界范围 [x1,x2]×[y1,y2]，深度 z。draw(g) 里直接以“米”为单位、y 轴向上
function backdrop(x1, x2, y1, y2, z, ppm, draw, o = {}) {
  let W = (x2 - x1) * ppm, Hh = (y2 - y1) * ppm;
  const k = Math.min(1, 4096 / W, 4096 / Hh), s = ppm * k;
  const [c, g] = mkCanvas(Math.round(W * k), Math.round(Hh * k));
  if (o.blur && 'filter' in g) g.filter = `blur(${o.blur}px)`;
  g.setTransform(s, 0, 0, -s, -x1 * s, y2 * s);
  draw(g);
  const mat = new THREE.MeshBasicMaterial({ map: canvasTex(c), transparent: true, depthWrite: false, fog: o.fog !== false, opacity: o.opacity ?? 1 });
  if (o.additive) mat.blending = THREE.AdditiveBlending;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(x2 - x1, y2 - y1), mat);
  m.position.set((x1 + x2) / 2, (y1 + y2) / 2, z); m.renderOrder = o.order ?? Math.round(z * 4);
  scene.add(m); return m;
}

// ---- 画笔小工具（坐标都是米，y 向上）----
const box = (g, x, y, w, h) => g.fillRect(x, y, w, h);
function poly(g, pts) { g.beginPath(); pts.forEach(([x, y], i) => g[i ? 'lineTo' : 'moveTo'](x, y)); g.closePath(); g.fill(); }
function line(g, pts, lw) { g.lineWidth = lw; g.beginPath(); pts.forEach(([x, y], i) => g[i ? 'lineTo' : 'moveTo'](x, y)); g.stroke(); }
function cable(g, x1, y1, x2, y2, sag, lw = 0.05) {      // 下垂的缆线
  g.lineWidth = lw; g.beginPath(); g.moveTo(x1, y1); g.quadraticCurveTo((x1 + x2) / 2, (y1 + y2) / 2 - 2 * sag, x2, y2); g.stroke();
}
function truss(g, x1, x2, y, h, lw = 0.09) {             // 桁架梁：上下弦 + 斜撑
  box(g, x1, y, x2 - x1, lw * 1.6); box(g, x1, y + h - lw * 1.6, x2 - x1, lw * 1.6);
  const n = Math.max(2, Math.round((x2 - x1) / h)), pts = [];
  for (let i = 0; i <= n; i++) pts.push([x1 + (x2 - x1) * i / n, y + (i % 2 ? h : 0)]);
  line(g, pts, lw);
}
function ring(g, x, y, r, lw) { g.lineWidth = lw; g.beginPath(); g.arc(x, y, r, 0, 6.2832); g.stroke(); }
function disc(g, x, y, r) { g.beginPath(); g.arc(x, y, r, 0, 6.2832); g.fill(); }
function fan(g, x, y, r) {                               // 大型排风扇
  ring(g, x, y, r, r * 0.16); disc(g, x, y, r * 0.2);
  for (let i = 0; i < 6; i++) { const a = i / 6 * 6.2832 + 0.3; poly(g, [[x, y], [x + Math.cos(a) * r, y + Math.sin(a) * r], [x + Math.cos(a + 0.42) * r, y + Math.sin(a + 0.42) * r]]); }
}
function heap(g, x1, x2, y0, hMin, hMax, step = 0.5) {   // 高低不平的废料堆
  const pts = [[x1, y0 - 4]];
  for (let x = x1; x <= x2; x += step * rr(0.5, 1.5)) pts.push([x, y0 + rr(hMin, hMax)]);
  pts.push([x2, y0 - 4]); poly(g, pts);
}
function setInk(g, col) { g.fillStyle = col; g.strokeStyle = col; g.lineCap = 'round'; g.lineJoin = 'round'; }

// ---------------- 室内：废弃的巨型厂房 ----------------
// 最远的后墙：一排高窗透进冷光
backdrop(-90, 90, -2, 46, -32, 9, g => {
  setInk(g, '#131b1e'); box(g, -90, -2, 180, 48);
  for (let x = -84; x < 90; x += 8.5) {
    const gr = g.createLinearGradient(0, 28, 0, 5); gr.addColorStop(0, '#93aab0'); gr.addColorStop(1, '#2b3a3f');
    g.fillStyle = gr; box(g, x, 5, 1.7, 23);
    setInk(g, '#131b1e'); for (let y = 8; y < 28; y += 3.2) box(g, x - 0.1, y, 1.9, 0.28);
  }
});
// 高窗与天窗漏下来的光（叠加发光，不受雾影响）
backdrop(-60, 92, -1, 26, -30, 7, g => {
  for (let x = -84 + 8.5 * 3; x < 90; x += 8.5) {
    const gr = g.createLinearGradient(0, 26, 0, 2); gr.addColorStop(0, 'rgba(150,185,192,.30)'); gr.addColorStop(1, 'rgba(150,185,192,0)');
    g.fillStyle = gr; box(g, x - 1.4, 2, 4.5, 24);
  }
}, { additive: true, fog: false, blur: 6 });

// 远景：一排高大的拱廊；探照灯机器站在中间那个大开口后面
backdrop(-50, 92, -1, 26, -16, 20, g => {
  setInk(g, '#0d1416');
  g.beginPath(); g.rect(-50, -1, 142, 27);
  const arch = (x1, x2, top) => { const r = (x2 - x1) / 2; g.moveTo(x1, -1); g.lineTo(x1, top - r); g.arc(x1 + r, top - r, r, Math.PI, 0, true); g.lineTo(x2, -1); g.closePath(); };
  for (const x of [-46, -36, -26, -16, -6, 4, 14, 24, 34, 44]) arch(x, x + 7.2, 13);
  g.moveTo(56.5, -1); g.lineTo(56.5, 11); g.lineTo(58.5, 13.5); g.lineTo(83.5, 13.5); g.lineTo(85.5, 11); g.lineTo(85.5, -1); g.closePath();
  for (const x of [-11, 9, 29, 49]) { g.moveTo(x + 3.4, 19.5); g.arc(x + 0.6, 19.5, 2.8, 0, 6.2832); }   // 排风扇的圆洞
  g.fill('evenodd');
  for (const x of [-11, 9, 29, 49]) fan(g, x + 0.6, 19.5, 2.6);         // 洞里的扇叶
  truss(g, 56.5, 85.5, 13.5, 1.4, 0.12);
  for (const x of [61, 66.5, 75, 81]) cable(g, x, 13.6, x + rr(2, 4), 13.6, rr(1.5, 4), 0.07);
});

// 中景：机器残骸、龙门架、楼梯
backdrop(-30, 92, -1, 20, -8, 26, g => {
  setInk(g, '#0a1012');
  // 熔炉 + 烟道
  box(g, -1, 0, 7, 4.6); box(g, 0.2, 4.6, 1.5, 15.4); box(g, -1.4, 3.9, 7.8, 0.5); box(g, 3.2, 4.6, 2.2, 1.3);
  for (const x of [0, 2, 4]) { g.clearRect(x + 0.35, 1.2, 1.1, 0.16); g.clearRect(x + 0.35, 1.6, 1.1, 0.16); }
  // 储罐与箱堆
  g.beginPath(); g.moveTo(13.5, 0); g.lineTo(13.5, 3.2); g.arc(15.4, 3.2, 1.9, Math.PI, 0, true); g.lineTo(17.3, 0); g.fill();
  box(g, 14.9, 5.1, 0.35, 14.9); box(g, 18.2, 0, 1.9, 1.5); box(g, 18.5, 1.5, 1.4, 1.2); box(g, 20.4, 0, 1.3, 1.0);
  // 龙门吊：两条腿 + 横梁 + 小车 + 吊钩
  box(g, 26.2, 0, 0.55, 8.6); box(g, 35.6, 0, 0.55, 8.6); truss(g, 25, 37.6, 8.4, 1.1, 0.1);
  box(g, 29.4, 7.7, 1.8, 0.75); line(g, [[30.3, 7.7], [30.3, 4.3]], 0.06); ring(g, 30.3, 3.9, 0.36, 0.13); g.clearRect(30.25, 3.9, 0.6, 0.5);
  // 夹层的支架和栏杆（对应前景那段高台）
  for (const x of [39, 43, 47, 51]) box(g, x, 0, 0.4, 5.2);
  box(g, 38.4, 5.0, 13.8, 0.35); line(g, [[38.4, 6.3], [52.2, 6.3]], 0.07);
  for (let x = 38.5; x <= 52.2; x += 1.25) line(g, [[x, 5.3], [x, 6.3]], 0.05);
  // 探照灯场地：只放低矮的杂物，别挡住机器
  heap(g, 57, 86, 0, 0.1, 0.7, 0.8); box(g, 63.2, 0, 1.6, 1.1); box(g, 77, 0, 2.2, 0.9);
  // 大门旁边的配电柜和管束
  box(g, 86.2, 0, 2.6, 5.4); for (const x of [86.6, 87.3, 88]) box(g, x, 5.4, 0.3, 14.6);
  // 天花板垂下的链条和缆线
  for (const [x, y] of [[8, 9.2], [10.6, 6.4], [22.5, 7.8], [41, 10.5], [54.5, 8.4]]) { line(g, [[x, 20], [x, y]], 0.05); ring(g, x, y - 0.3, 0.3, 0.1); }
  for (let x = -28; x < 56; x += rr(7, 12)) cable(g, x, 20, x + rr(5, 9), 20, rr(2, 6), 0.06);
});

// 近景：一排工字钢立柱 + 吊车梁 + 管道（场地那段不放柱子）
backdrop(-25, 92, -1, 15, -3.2, 34, g => {
  const col = (x, w = 0.85) => {
    const gr = g.createLinearGradient(x - w / 2, 0, x + w / 2, 0); gr.addColorStop(0, '#070b0d'); gr.addColorStop(0.75, '#0b1215'); gr.addColorStop(1, '#172226');
    g.fillStyle = gr; box(g, x - w / 2, -1, w, 16);
    setInk(g, '#070b0d'); box(g, x - w * 0.9, -1, w * 1.8, 1.45); box(g, x - w * 0.8, 6.3, w * 1.6, 0.4);
    poly(g, [[x + w / 2, 5.2], [x + w * 1.5, 6.3], [x + w / 2, 6.3]]); poly(g, [[x - w / 2, 5.2], [x - w * 1.5, 6.3], [x - w / 2, 6.3]]);
  };
  setInk(g, '#070b0d');
  truss(g, -25, 55, 6.7, 0.9, 0.08); box(g, 11.6, 5.55, 32, 0.2); box(g, 11.6, 5.15, 32, 0.14);
  for (const x of [-4, 11.6, 27, 43.5, 54.5, 87.3]) col(x);
  setInk(g, '#070b0d');
  for (const [x, y] of [[3, 5.9], [18.5, 5.4], [33, 5.9]]) { line(g, [[x, 6.7], [x, y]], 0.04); box(g, x - 0.28, y - 0.22, 0.56, 0.22); }   // 吊灯
  cable(g, 16, 6.7, 24, 6.7, 1.3); cable(g, 45, 6.7, 53.5, 6.7, 1.8); cable(g, -2, 6.7, 9, 6.7, 0.9);
});
