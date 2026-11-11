
// ============================================================
//  镜头 / 提示 / 界面 / 主循环
// ============================================================
const cam = { x: 2, y: 1.3, d: 14.5, look: 0.8 };
function placeCamera() {
  camera.position.set(cam.x, cam.y + cam.d * 0.05, cam.d); camera.lookAt(cam.x, cam.y, 0);
  key.target.position.set(cam.x, P.y, 0); key.position.copy(key.target.position).addScaledVector(keyDir, 55);   // 影子跟着主角走
  rim.target.position.set(cam.x, P.y, 0); rim.position.set(cam.x - 6, P.y + 5, -10);
}
function updateCamera(dt) {
  const [d, yo, xo] = camKey(P.x);
  cam.look = damp(cam.look, P.facing * 0.8 + clamp(P.vx * 0.3, -1, 1), 1.5, dt);                // 镜头略微领先于前进方向
  const ty = (P.grounded || P.mode === 'mantle' ? P.y : lerp(P.gy ?? P.y, P.y, 0.4)) + yo;      // 跳起来时镜头只跟一小半
  cam.x = damp(cam.x, P.x + xo + cam.look, 3, dt); cam.y = damp(cam.y, ty, 2.6, dt); cam.d = damp(cam.d, d, 1.6, dt);
  placeCamera();
}
function snapCamera() { const [d, yo, xo] = camKey(P.x); cam.x = P.x + xo + cam.look; cam.y = P.y + yo; cam.d = d; placeCamera(); }

const hintEl = $('hint'); let hintNow = '';
const HINTS = [
  [() => !P.moved, '<b>←</b><b>→</b> 移动'],
  [() => P.x > 5.5 && P.x < 9 && !P.jumped, '<b>空格</b> 跳跃'],
  [() => !P.pushed && P.y < 0.5 && Math.abs(P.x - cart.x) < 2.6 && P.mode !== 'push', '按住 <b>E</b> 抓住推车，再按方向键推或拉'],
  [() => P.y < 1.2 && cart.x > 36.6 && P.x > 32 && P.x < 38 && P.mode !== 'push', '跳上推车，再跳向高台的边缘'],
  [() => P.x > 55.5 && P.x < 60.4 && P.cp < 3, '躲进矮墙的影子里，等光束扫过去'],
  [() => !LEVER.pulled && Math.abs(P.x - LEVER.x) < 1.7, '按 <b>E</b> 拉下拉杆'],
];
function updateHint() {
  let h = ''; if (state === 'play') for (const [c, html] of HINTS) if (c()) { h = html; break; }
  if (h !== hintNow) { hintNow = h; if (h) hintEl.innerHTML = h; hintEl.style.opacity = h ? 1 : 0; }
}

{ // 胶片颗粒：一张噪点图铺满屏幕，每隔一帧随机挪一下位置
  const [c, g] = mkCanvas(256, 256), im = g.createImageData(256, 256);
  for (let i = 0; i < im.data.length; i += 4) { const v = Math.random() * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
  g.putImageData(im, 0, 0); $('grain').style.backgroundImage = `url(${c.toDataURL()})`;
}

function begin() {
  if (state !== 'title') return;
  state = 'play'; $('title').classList.add('hide'); $('fade').style.opacity = 0; $('skins').classList.add('on'); initAudio();
}
let endT = 0, prevPh = 0;
function reset() {
  Object.assign(P, { x: 2, y: 0, vx: 0, vy: 0, grounded: true, facing: 1, mode: 'normal', cp: 0, moved: false, jumped: false, pushed: false });
  cart.x = 25.4; cart.v = 0; syncCart();
  Object.assign(door, { y1: 0, open: 0, opening: false }); doorMesh.position.y = 1.8;
  Object.assign(LEVER, { pulled: false, t: 0 }); leverArm.rotation.z = 0.7; leverLampMat.color.set(0xff4a2a); leverLight.color.set(0xff4a2a);
  Object.assign(WATCH, { exposure: 0, caught: 0, t: 0.6 });
  ctl = true; autoDir = 0; endT = 0; state = 'play'; $('end').classList.add('hide'); $('fade').style.opacity = 0; snapCamera();
}

function sim(dt) {
  T += dt;
  if (state === 'title' && anyKey) begin();
  for (const k of ['A', 'B', 'C']) if (pressed.has(k)) setSkin(k);
  if (pressed.has('MUTE')) { muted = !muted; if (master) master.gain.value = muted ? 0 : 0.6; }
  if (pressed.has('RESET') && state !== 'title' && state !== 'fade') reset();

  let impact = 0; const n = Math.max(1, Math.ceil(dt * 120));            // 物理按不超过 1/120 秒一小步来走
  if (state !== 'title') for (let i = 0; i < n; i++) { stepPlayer(dt / n); impact = Math.max(impact, P.impact); pressed.delete('J'); pressed.delete('E'); }
  stepWorld(dt);
  if (state === 'play' && P.x > END_X) { state = 'end'; ctl = false; autoDir = 1; }
  if (state === 'end') {
    endT += dt; if (P.x > 124.4) autoDir = 0;
    if (endT > 3.6 && $('end').classList.contains('hide')) { $('end').classList.remove('hide'); $('fade').style.opacity = 0.45; }
  }

  const onTerrain = P.grounded && P.y - groundY(P.x) < 0.02;
  hero.update(dt, { x: P.x, y: P.y, vx: P.vx, vy: P.vy, grounded: P.grounded, facing: P.facing, mode: P.mode, t: T, impact,
    modeT: P.mode === 'mantle' ? P.modeT / P.mantle.T : 0, slope: onTerrain ? groundSlope(P.x) : 0, alert: WATCH.exposure,
    hand: P.mode === 'mantle' ? { x: P.mantle.ex, y: P.mantle.top } : P.mode === 'push' ? { x: P.grab > 0 ? cart.x1 : cart.x2, y: 0.82 } : null });
  const ph = hero.A.ph, stepNow = P.grounded && Math.abs(P.vx) > 0.4 && Math.floor(ph * 2) !== Math.floor(prevPh * 2); prevPh = ph;

  updateCamera(dt);
  applyZone(camera.position.x > 91.4 ? 1 : 0);
  updateDust(dt, T, cam.x, zoneExt > 0.5 ? -0.9 : 0.04);
  bulb.intensity = 9 * (0.93 + 0.07 * Math.sin(T * 13) * Math.sin(T * 7.3));     // 吊灯微微闪烁
  updateHint(); updateAudio(zoneExt > 0.5, stepNow);
  pressed.clear(); anyKey = false;
}

// 调试接口：在控制台里用 __g.step(秒) 手动推进、__g.tp(x) 传送
const DBG = window.__g = { P, cart, WATCH, door, LEVER, cam, keys, pressed, paused: false, setSkin, begin, reset,
  hero: () => hero, state: () => state, scene, camera, renderer,
  view(d, yo = 0.6, xo = 0) { camera.position.set(P.x + xo, P.y + yo + d * 0.05, d); camera.lookAt(P.x + xo, P.y + yo, 0); renderer.render(scene, camera); },   // 近看主角
  step(sec, dt = 1 / 60) { for (let i = 0, n = Math.round(sec / dt); i < n; i++) sim(dt); renderer.render(scene, camera); },
  tp(x) { Object.assign(P, { x, vx: 0, vy: 0, grounded: true, mode: 'normal' }); P.y = floorY(x, 50); for (let i = 0; i < CHECKPOINTS.length; i++) if (x >= CHECKPOINTS[i]) P.cp = i; snapCamera(); } };

let lastT = performance.now(), frameN = 0;
function frame(now) {
  const dt = clamp((now - lastT) / 1000, 0.001, 0.05); lastT = now;
  if (!DBG.paused) { sim(dt); renderer.render(scene, camera); }
  if (++frameN % 2 === 0) $('grain').style.backgroundPosition = `${Math.random() * 256 | 0}px ${Math.random() * 256 | 0}px`;
  requestAnimationFrame(frame);
}

document.querySelectorAll('#skins button').forEach(b => b.addEventListener('click', () => { setSkin(b.dataset.k); b.blur(); canvas.focus(); }));
setSkin('R'); snapCamera(); applyZone(0); aimWatcher(WATCH.bx, 0.35, 0);
$('title').classList.remove('hide'); $('fade').style.opacity = 0.42; $('msg').remove();
window.__ready = true;
requestAnimationFrame(frame);
