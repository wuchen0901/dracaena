
// ============================================================
//  镜头 / 主循环
// ============================================================
const cam = { x: 2, y: 1.3, d: 14.5, look: 0.8, az: 0 };
let closeUp = false;                               // 按 V：把镜头拉到主角跟前，慢慢左右绕着看
let camOvr = null;                                 // 过场时由章节临时接管镜头：{ d 距离, yo 高度偏移, xo 水平偏移 }
function placeCamera() {
  camera.position.set(cam.x + Math.sin(cam.az) * cam.d, cam.y + cam.d * 0.05, Math.cos(cam.az) * cam.d); camera.lookAt(cam.x, cam.y, 0);
  key.target.position.set(cam.x, P.y, 0); key.position.copy(key.target.position).addScaledVector(keyDir, 55);   // 影子跟着主角走
  rim.target.position.set(cam.x, P.y, 0); rim.position.set(cam.x - 6, P.y + 5, -10);
}
function updateCamera(dt) {
  const [d, yo, xo] = closeUp ? [5.4, 0.66, 0] : camOvr ? [camOvr.d, camOvr.yo, camOvr.xo] : camKey(P.x);
  cam.look = damp(cam.look, closeUp ? 0 : P.facing * 0.8 + clamp(P.vx * 0.3, -1, 1), 1.5, dt);   // 镜头略微领先于前进方向
  cam.az = damp(cam.az, closeUp ? 0.62 * Math.sin(T * 0.4) : 0, 2.5, dt);
  const ty = (P.grounded || P.mode === 'mantle' ? P.y : lerp(P.gy ?? P.y, P.y, 0.4)) + yo;      // 跳起来时镜头只跟一小半
  cam.x = damp(cam.x, P.x + xo + cam.look, 3, dt); cam.y = damp(cam.y, ty, 2.6, dt); cam.d = damp(cam.d, d, closeUp ? 3.2 : 1.6, dt);
  placeCamera();
}
function snapCamera() { const [d, yo, xo] = camKey(P.x); closeUp = false; cam.az = 0; cam.x = P.x + xo + cam.look; cam.y = P.y + yo; cam.d = d; placeCamera(); }

let prevPh = 0;
function sim(dt) {
  T += dt;
  if (rawKeys.has('Escape') || rawKeys.has('KeyP')) toggleMenu();
  if (menuOpen) { menuInput(); pressed.clear(); rawKeys.clear(); anyKey = false; return; }
  if (state === 'title' && anyKey) begin();
  for (const k of ['A', 'B', 'C']) if (pressed.has(k)) setSkin(k);
  if (pressed.has('SKIN_R')) setSkin('R'); if (pressed.has('SKIN_O')) setSkin('O');
  if (pressed.has('VIEW') && state !== 'title') closeUp = !closeUp;
  if (pressed.has('MUTE')) { muted = !muted; if (master) master.gain.value = muted ? 0 : 0.6; }
  if (pressed.has('RESET')) { if (state === 'play' && ctl) respawn(); else if (state === 'end') retryEnding(); }

  // 这些每一帧都清零，由走到的那一章重新填写
  HX.hide = 0; HX.alert = 0; HX.pose = null; HX.energy = energyFor(STORY.ch); camOvr = null;
  for (const k in AUD) AUD[k] = 0; AUD.humF = 52; beam.intensity = 0;

  let impact = 0; const n = Math.max(1, Math.ceil(dt * 120));            // 物理按不超过 1/120 秒一小步来走
  if (state !== 'title') for (let i = 0; i < n; i++) { stepPlayer(dt / n); impact = Math.max(impact, P.impact); pressed.delete('J'); pressed.delete('E'); }
  stepGates(dt);
  for (const z of ZONES) if (P.x > z.vis[0] - 30 && P.x < z.vis[1] + 30) z.update(dt);
  stepPits(); stepFade(dt); stepChapterCard(dt);
  if (state === 'play') { const c = chapterAt(P.x); if (c.n > STORY.ch) { STORY.done = c.n - 1; STORY.ch = c.n; saveGame(); showChapter(c); } }

  const onTerrain = P.grounded && P.y - groundY(P.x) < 0.02, o = P.grabObj;
  hero.update(dt, { x: P.x, y: P.y, vx: P.vx, vy: P.vy, grounded: P.grounded, facing: P.facing, mode: P.mode, t: T, impact, hide: HX.hide,
    modeT: P.mode === 'mantle' ? P.modeT / P.mantle.T : 0, slope: onTerrain ? groundSlope(P.x) : 0, alert: HX.alert, energy: HX.energy, pose: HX.pose,
    hand: P.mode === 'mantle' ? { x: P.mantle.ex, y: P.mantle.top } : P.mode === 'push' ? { x: P.grab > 0 ? o.x1 : o.x2, y: o.y1 + (o.grip ?? 0.82) } : null });
  const ph = hero.A.ph, stepNow = P.grounded && Math.abs(P.vx) > 0.4 && Math.floor(ph * 2) !== Math.floor(prevPh * 2); prevPh = ph;
  stepCat(dt);

  updateCamera(dt);
  applyEnv(camera.position.x); assignLights(cam.x); streamZones(cam.x); updateSky(T, cam.az);
  updateDust(dt, T, cam.x, cam.y, E.wind); updateFlies(dt, T, cam.x, groundY(cam.x), E.flies);
  updateHint(); updateAudio(dt, stepNow);
  pressed.clear(); rawKeys.clear(); anyKey = false;
}

// 调试接口：在控制台里用 __g.ch(章) 跳章节、__g.tp(x) 传送、__g.step(秒) 手动推进、__g.hold(['R'], 秒) 模拟按住按键
const DBG = window.__g = { P, STORY, CAT, E, HX, AUD, ZONES, SOLIDS, PUSHABLES, GATES, USES, CPS, CHAPTERS, LIGHTS, cam, keys, pressed, paused: false, setSkin, begin, respawn,
  closeUp(on = !closeUp) { closeUp = on; }, hero: () => hero, state: () => state, ctl: () => ctl, scene, camera, renderer, THREE,
  ch(n) { if (state === 'title') { $('title').classList.add('hide'); $('skins').classList.add('on'); } startChapter(n); renderer.render(scene, camera); },
  view(d, yo = 0.6, xo = 0) { camera.position.set(P.x + xo, P.y + yo + d * 0.05, d); camera.lookAt(P.x + xo, P.y + yo, 0); renderer.render(scene, camera); },   // 近看主角
  step(sec, dt = 1 / 60) { for (let i = 0, n = Math.round(sec / dt); i < n; i++) sim(dt); renderer.render(scene, camera); DBG.redraw = true; },
  hold(ks, sec, dt = 1 / 60) { ks = [].concat(ks); for (const k of ks) { if (!keys.has(k)) pressed.add(k); keys.add(k); } DBG.step(sec, dt); for (const k of ks) keys.delete(k); },
  tap(k) { pressed.add(k); keys.add(k); sim(1 / 60); keys.delete(k); renderer.render(scene, camera); },
  tp(x) { placePlayer(x); P.cp = cpAt(x); snapCamera(); applyEnv(camera.position.x); streamZones(cam.x, true); renderer.render(scene, camera); },
  zone: n => ZONES.find(z => z.n === n) };

let lastT = performance.now(), frameN = 0;
function frame(now) {
  const dt = clamp((now - lastT) / 1000, 0.001, 0.05); lastT = now;
  if (!DBG.paused) { sim(dt); renderer.render(scene, camera); } else if (DBG.redraw) { DBG.redraw = false; renderer.render(scene, camera); }
  if (++frameN % 2 === 0) $('grain').style.backgroundPosition = `${Math.random() * 256 | 0}px ${Math.random() * 256 | 0}px`;
  requestAnimationFrame(frame);
}

document.querySelectorAll('#skins button').forEach(b => b.addEventListener('click', () => { setSkin(b.dataset.k); b.blur(); canvas.focus(); }));
CAMKEYS.sort((a, b) => a[0] - b[0]); CPS.sort((a, b) => a.x - b.x);
buildGround();
CAT.crit = makeCritter('cat', scene); CAT.crit.root.visible = false;
setSkin('R'); loadGame();
{ const n = +new URLSearchParams(location.search).get('ch'); if (n >= 1 && n <= CHAPTERS.length) STORY.ch = n; }   // 地址后面加 ?ch=5 直接从第五章开始
{ const c = CHAPTERS[STORY.ch - 1], intro = c.intro; c.intro = null; startChapter(STORY.ch, { quiet: true }); c.intro = intro; state = 'title'; }
$('go').textContent = STORY.ch > 1 ? `按任意键继续 · 第${CN[STORY.ch - 1]}章 ${CHAPTERS[STORY.ch - 1].name}` : '按任意键开始';
$('title').classList.remove('hide'); $('fade').style.opacity = 0.42; $('msg').remove();
window.__ready = true;
requestAnimationFrame(frame);
