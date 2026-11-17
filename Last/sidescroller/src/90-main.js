
// ============================================================
//  镜头 / 主循环
// ============================================================
const cam = { x: 2, y: 1.3, d: 14.5, look: 0.8, az: 0, lift: 0, pz: 0 };   // pz：镜头在前后方向上追到了哪（路往前后弯的时候，见 20-world.js 的 pathZ）     // lift：镜头比平常再抬高多少（往下看）
let closeUp = false;                               // 按 V：把镜头拉到主角跟前，慢慢左右绕着看
let camJit = null;                                 // 镜头轻微的漂移（像手持）：{ x, y } 米，章节每一帧自己给，不给就没有
let camOvr = null;                                 // 过场时由章节临时接管镜头：{ d 距离, yo 高度偏移, xo 水平偏移, lift 抬高（不写就是 0）}
function placeCamera() {
  const pz = cam.pz;                               // 路往前后弯：镜头追着主角在前后方向上走（慢一拍），人的大小基本不变
  camera.position.set(cam.x + Math.sin(cam.az) * cam.d, cam.y + cam.d * 0.05 + cam.lift, Math.cos(cam.az) * cam.d + pz); if (camJit) { camera.position.x += camJit.x; camera.position.y += camJit.y; } camera.lookAt(cam.x, cam.y, pz);
  key.target.position.set(cam.x, P.y, pz); key.position.copy(key.target.position).addScaledVector(keyDir, 55);   // 影子跟着主角走
  rim.target.position.set(cam.x, P.y, pz); rim.position.set(cam.x - 6, P.y + 5, pz - 10);
}
function updateCamera(dt) {
  const [d, yo, xo, lift = 0] = closeUp ? [5.4, 0.66, 0] : camOvr ? [camOvr.d, camOvr.yo, camOvr.xo, camOvr.lift ?? 0] : camKey(P.x);
  cam.look = damp(cam.look, closeUp ? 0 : P.facing * 0.8 + clamp(P.vx * 0.3, -1, 1), 1.5, dt);   // 镜头略微领先于前进方向
  cam.az = damp(cam.az, closeUp ? 0.62 * Math.sin(T * 0.4) : 0, 2.5, dt);
  const ty = (P.mode === 'swim' ? P.y + SWIM.c - 0.45 : P.grounded || P.mode === 'mantle' || P.mode === 'rope' ? P.y : lerp(P.gy ?? P.y, P.y, 0.4)) + yo;   // 跳起来时镜头只跟一小半；游泳、爬绳子时整个跟着
  cam.x = damp(cam.x, P.x + xo + cam.look, 3, dt); cam.y = damp(cam.y, ty, 2.6, dt); cam.d = damp(cam.d, d, closeUp ? 3.2 : 1.6, dt); cam.lift = damp(cam.lift, lift, 1.6, dt); cam.pz = damp(cam.pz, pathZ(P.x + cam.look * 1.6), 1.3, dt);   // 往前看一点：路要往哪边弯，镜头先往那边靠
  placeCamera();
}
function snapCamera() { const [d, yo, xo, lift] = camKey(P.x); closeUp = false; cam.az = 0; cam.x = P.x + xo + cam.look; cam.y = P.y + yo; cam.d = d; cam.lift = lift; cam.pz = pathZ(P.x); placeCamera(); }

let prevPh = 0;
function sim(dt) {
  T += dt;
  touchInput(dt);                                  // 触屏：手指折算成按键
  if (rawKeys.has('Escape') || rawKeys.has('KeyP')) toggleMenu();
  if (menuOpen) { menuInput(); pressed.clear(); rawKeys.clear(); anyKey = false; return; }
  if (state === 'title' && anyKey) begin();
  if (pressed.has('TINT') && hero.B.tint) hero.B.tint();                 // 小孩：换一块连帽衫的颜色看看
  if (pressed.has('LEGS') && hero.kind === 'K') { kidLegs = (kidLegs + 1) % KID_LEGS.length; rebuildHero(); }   // 小孩：长裤靴子 / 短裤光腿
  if (pressed.has('VIEW') && state !== 'title') closeUp = !closeUp;
  if (pressed.has('MUTE')) { setMuted(!muted); soundNote(); }
  if (pressed.has('RESET')) { if (state === 'play' && ctl) respawn(); else if (state === 'end' && !MIST.go) retryEnding(); }
  if (state === 'end' && (pressed.has('R') || pressed.has('E') || pressed.has('J') || rawKeys.has('Enter') || rawKeys.has('Space'))) continueFromEnd();   // 结局画面：接着往前走，走进下一章

  // 这些每一帧都清零，由走到的那一章重新填写
  HX.hide = 0; HX.alert = 0; HX.pose = null; HX.energy = energyFor(STORY.ch); camOvr = null; camJit = null;
  for (const k in AUD) AUD[k] = 0; AUD.humF = 52; beam.intensity = 0; beam.angle = 0.118; beam.penumbra = 0.4;   // 探照灯的张角：第一章用原样的，第十一章的直升机自己改宽

  let impact = 0; const n = Math.max(1, Math.ceil(dt * 120));            // 物理按不超过 1/120 秒一小步来走
  if (state !== 'title') for (let i = 0; i < n; i++) { stepPlayer(dt / n); impact = Math.max(impact, P.impact); pressed.delete('J'); pressed.delete('E'); }
  stepHolds(dt); stepGates(dt); stepBreath(); stepWaterFx(dt);
  for (const z of ZONES) if (P.x > z.vis[0] - 30 && P.x < z.vis[1] + 30) z.update(dt);
  stepBrush(dt);                                                         // 路边的植物：叶子被推开、弹回来，主角伸手去拨
  stepPits(); stepFade(dt); stepMist(dt); stepChapterCard(dt);
  if (state === 'play') { const c = chapterAt(P.x); if (c.n > STORY.ch) { STORY.done = c.n - 1; STORY.ch = c.n; saveGame(); showChapter(c); } }

  GUST.v = GUST.force ?? gustAt(T); stepPant(dt, impact);                   // 阵风（force：工具页里硬给一阵风）/ 喘气（声音和动作都用）
  poseCarry(dt);                                                         // 《长夜》：从怀里取灯泡、揣回去时两只手放在哪（43-carry.js）
  const onTerrain = P.grounded && P.y - groundY(P.x) < 0.02, o = P.grabObj;
  hero.update(dt, { prep: P.prep > 0 ? 1 - P.prep / P.prepT : -1, x: P.x, y: P.y, z: pathZ(P.x), yawOff: -Math.atan((pathZ(P.x + 0.05) - pathZ(P.x - 0.05)) / 0.1), vx: P.vx, vy: P.vy, grounded: P.grounded, facing: P.facing, mode: P.mode, t: T, impact, hide: HX.hide,
    modeT: P.mode === 'mantle' ? clamp(mantleK(P.mantle), 0, 1) : 0, mant: P.mode === 'mantle' ? P.mantle : null, land: P.land, slope: onTerrain ? groundSlope(P.x) : 0, alert: HX.alert, energy: HX.energy, pose: HX.pose, br: BR, brush: HX.brush,
    tired: TIRED.k, tiredMix: TIRED.mix, rest: TIRED.rest, wipeT: TIRED.wipeT, lookT: TIRED.lookT, stbT: TIRED.stbT,
    hand: P.mode === 'mantle' ? { x: P.mantle.ex, y: P.mantle.top } : P.mode === 'push' ? { x: P.grab > 0 ? o.x1 : o.x2, y: o.y1 + (o.grip ?? 0.82) } : null,
    swim: P.mode === 'swim' ? { ph: P.stroke, vx: P.vx, vy: P.vy, c: SWIM.c, top: sstep(0.12, 0.02, P.water.y - SWIM.top - (P.y + SWIM.c)), panic: sstep(0.55, 1, 1 - P.air / SWIM.breath) } : null,
    rope: P.mode === 'rope' ? ropeAnim() : null });
  const ph = hero.A.ph, stepNow = P.grounded && Math.abs(P.vx) > 0.4 && Math.floor(ph * 2) !== Math.floor(prevPh * 2); prevPh = ph;
  stepCarry(dt);                                                         // 灯泡放到手里；揣在怀里被强光照中时透出光
  stepCat(dt);

  updateCamera(dt);
  applyEnv(camera.position.x); assignLights(cam.x); streamZones(cam.x, false, MIST.pre ?? cam.x); updateSky(T, cam.az, 0.05 + cam.lift / cam.d);
  updateDust(dt, T, cam.x, cam.y, E.wind); updateFlies(dt, T, cam.x, groundY(cam.x), E.flies);
  updateHint(); updateAudio(dt, stepNow);
  pressed.clear(); rawKeys.clear(); anyKey = false;
}

// 调试接口：在控制台里用 __g.ch(章) 跳章节、__g.tp(x) 传送、__g.step(秒) 手动推进、__g.hold(['R'], 秒) 模拟按住按键
const DBG = window.__g = { P, POST, STORY, CAT, E, HX, AUD, BR, BREATH, SND, GUST, ZONES, EXITS, SOLIDS, PUSHABLES, GATES, USES, HOLDS, CARRY, CPS, CHAPTERS, LIGHTS, WATERS, SWIM, LAND, TURN, TIRED, MOCAP, ROPES, ROPE, enterRope, groundY, ceilY, floorY, cam, keys, pressed, paused: false, setSkin, begin, respawn,
  closeUp(on = !closeUp) { closeUp = on; }, legs(n) { kidLegs = n; if (hero.kind === 'K') rebuildHero(); }, hero: () => hero, state: () => state, ctl: () => ctl, scene, camera, renderer, THREE,
  ch(n) { if (state === 'title') { $('title').classList.add('hide'); $('skins').classList.add('on'); } startChapter(n); renderer.render(scene, camera); },
  view(d, yo = 0.6, xo = 0) { camera.position.set(P.x + xo, P.y + yo + d * 0.05, d); camera.lookAt(P.x + xo, P.y + yo, 0); renderer.render(scene, camera); },   // 近看主角
  step(sec, dt = 1 / 60) { for (let i = 0, n = Math.round(sec / dt); i < n; i++) sim(dt); renderer.render(scene, camera); DBG.redraw = true; },
  hold(ks, sec, dt = 1 / 60) { ks = [].concat(ks); for (const k of ks) { if (!keys.has(k)) pressed.add(k); keys.add(k); } DBG.step(sec, dt); for (const k of ks) keys.delete(k); },
  tap(k) { pressed.add(k); keys.add(k); sim(1 / 60); keys.delete(k); renderer.render(scene, camera); },
  tp(x) { placePlayer(x); P.cp = cpAt(x); snapCamera(); applyEnv(camera.position.x); streamZones(cam.x, true); renderer.render(scene, camera); },
  brush: { BRUSH, BRK, BRV, plant: (kind, x, z, o) => brushPlant(scene, kind, x, z, o), drop(Pl) { for (const m of [Pl.mesh, ...Pl.extra, ...Pl.drops.map(d => d.m)]) { m.parent?.remove(m); m.geometry.dispose(); } BRUSH.list.splice(BRUSH.list.indexOf(Pl), 1); } },
  zone: n => ZONES.find(z => z.n === n), MIST, walk(n) { walkInto(n); renderer.render(scene, camera); },   // walk(n)：像从上一章一路走过来那样进第 n 章（人在入口，雾还没散）
  touch: TOUCH_DBG, touchMode: on => setTouchMode(on),
  kit: { fig, figAct, figStep, figSnap, mkCrowd, makeNPC, FIG_ACT, SKINS, CAST, CAST_ROLE, CAST_LIB, castLoad, castSpawn },   // 配角：小人、路人、现成的模型（工具页 cast-sheet.html 用）
  // 声音：sound(true) 打开；play('st:leaves:w') 放一组里的一个（名字见 52-audio.js 的 RECIPE）；breath('in', 0.4, 1) 现算一口气；audio() 看现在的状态
  sound(on = true) { if (muted === on) { setMuted(!on); soundNote(); } }, play: (name, o) => snd(name, o), breath: (dir, len, k, o) => breathSound(dir, len, k, o),
  audio: () => ({ AC, MX, master, loops, jobs: JOBS.length, banks: Object.keys(BANKS).length, surface: surfaceUnder() }),
  // 量一量声音（听不到的时候用）：meter(秒) → 总输出 out 和三路 amb / fol / sfx 各自的 RMS 和峰值（dBFS）。250 赫兹以下不算：小喇叭放不出来的低音不计
  meter(sec = 2) {
    if (!AC) return Promise.resolve(null);
    if (!DBG._an) { DBG._an = {}; for (const [k, n] of [['out', master], ['amb', MX.bus.amb], ['fol', MX.bus.fol], ['sfx', MX.bus.sfx]]) { const f = AC.createBiquadFilter(), a = AC.createAnalyser(); f.type = 'highpass'; f.frequency.value = 250; a.fftSize = 2048; n.connect(f).connect(a); DBG._an[k] = a; } }
    const acc = {}, buf = new Float32Array(2048), t0 = performance.now(); for (const k in DBG._an) acc[k] = [0, 0, 0];
    return new Promise(res => { const tick = () => {
      for (const k in DBG._an) { DBG._an[k].getFloatTimeDomainData(buf); const A = acc[k]; for (const v of buf) { A[0] += v * v; A[2] = Math.max(A[2], Math.abs(v)); } A[1] += buf.length; }
      if (performance.now() - t0 < sec * 1000) requestAnimationFrame(tick);
      else { const o = {}; for (const k in acc) { const [ss, n, pk] = acc[k]; o[k] = [+(10 * Math.log10(ss / n + 1e-18)).toFixed(1), +(20 * Math.log10(pk + 1e-9)).toFixed(1)]; } res(o); } };
      requestAnimationFrame(tick); });
  } };
// 工具页（Last/tools/）都是为旧原型做的，里面的章节号还按旧原型的 1–13 写：它们用 __g.old —— 和 __g 是同一个接口，只是 ch(n)、zone(n) 的 n 按旧原型算。
// 要拿章节号自己比的地方（CHAPTERS、ZONES 里的 n、STORY.ch）加上 OLD
DBG.OLD = OLD;
DBG.old = new Proxy(DBG, { get: (t, k) => k === 'ch' ? n => t.ch(n + OLD) : k === 'zone' ? n => t.zone(n + OLD) : t[k] });

let lastT = performance.now(), frameN = 0;
function frame(now) {
  const dt = clamp((now - lastT) / 1000, 0.001, 0.05); lastT = now;
  if (rotBlock) { /* 竖着拿手机：游戏停住，等横过来 */ }
  else if (!DBG.paused) { sim(dt); renderer.render(scene, camera); hudRender(dt); } else if (DBG.redraw) { DBG.redraw = false; renderer.render(scene, camera); hudRender(0); }
  if (++frameN % 2 === 0) $('grain').style.backgroundPosition = `${Math.random() * 256 | 0}px ${Math.random() * 256 | 0}px`;
  requestAnimationFrame(frame);
}

document.querySelectorAll('#skins button').forEach(b => b.addEventListener('click', () => { setSkin(b.dataset.k); b.blur(); canvas.focus(); }));
CAMKEYS.sort((a, b) => a[0] - b[0]); CPS.sort((a, b) => a.x - b.x);
buildGround();
CAT.crit = makeCritter('cat', scene); CAT.crit.root.visible = false;
setSkin('R'); loadGame();                               // 主角使用 models/hero.glb（3K 面的少年）
{ const n = +new URLSearchParams(location.search).get('ch'); if (n >= 1 && n <= CHAPTERS.length) STORY.ch = n; }   // 地址后面加 ?ch=5 直接从第五章开始
{ const c = CHAPTERS[STORY.ch - 1], intro = c.intro; c.intro = null; startChapter(STORY.ch, { quiet: true }); c.intro = intro; state = 'title'; }
applyInputTexts();                                      // 标题上的操作说明和“按任意键开始”：触屏和键盘各一套
$('title').classList.remove('hide'); $('fade').style.opacity = 0.42; $('msg').remove();
window.__ready = true;
requestAnimationFrame(frame);
