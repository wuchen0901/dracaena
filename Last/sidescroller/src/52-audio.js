// ============================================================
//  声音：全部现场合成（配方在 51-sound-synth.js），不加载任何音频文件
//  分三路：amb 环境（每一章的底子和远处的声音）/ fol 主角自己（脚步、呼吸、划水）/ sfx 机关和别的东西。
//  三路都送进混响。混响有三种空间：室外 out / 大厂房 hall / 山洞 cave，用多少由环境关键帧（36-lights-fx.js 的 env）里的 rvOut / rvHall / rvCave 决定；
//  每一章的底子也写在环境关键帧里：aWind 风、aWhis 风哨、aLeaf 树叶（leafDry 枯 / 嫩）、birds 鸟、aBug 蟋蟀、aDrip 滴水、aFlow 流水、
//  aRoom 室内的低鸣（roomF 多低）、aHum 电流声、aCity 城市的远声、aFar 远处偶尔一下的声音有多勤（是什么见下面的 FAR）。
//  章节之间跟着画面一起过渡。脚下是什么地面见 20-world.js 的 surface()
// ============================================================
let AC = null, master = null, MX = null, noiseBuf = null, muted = true;   // 现阶段默认静音：每次打开游戏都是静音，玩家按 M 自己打开
const loops = {};
// 各章节每一帧往这里写“这个持续的声音现在该多响”（0..1），下面统一平滑地跟过去
const AUD = { hum: 0, humF: 52, belt: 0, water: 0, pump: 0, buzz: 0, sweep: 0, spray: 0, heli: 0, heliPan: 0, heliLP: 0, wheels: 0 };   // heli 直升机多响 / heliPan 在左边还是右边 / heliLP 离得多近（远了就闷）/ wheels 别人推着的推车的轮子声
// voice：主角的呼吸声 —— A 只有气声 / B 带一点嗓音（“哈、哈”）/ C 闭着嘴，闷一些、轻一些。vol：几样东西各自的音量（听声音的工具页里可以调）
const SND = { voice: 'A', vol: { amb: 1, step: 1, breath: 1, far: 1, bird: 1, brush: 1 } };
const RV = { out: 0.22, hall: 0.4, cave: 0.55 };       // 三种空间各自的混响量（再乘上环境关键帧里的比例）
const SR = () => AC.sampleRate, seed = () => SY.rng(Math.random() * 2147483647 | 0);
const R2 = (a, b) => a + (b - a) * Math.random();   // 声音用的随机数：不动关卡那一套固定种子

// ---- 一组一组算好的声音：第一次要用的时候先算一个马上放，剩下的排队，每一帧抽几毫秒慢慢算 ----
// rec(n 一组几个, fn 一口气算一个, steps 可以不给：一层一层算的版本 —— 排队的时候每次只算一层，一层只要一两毫秒)
const RECIPE = {}, BANKS = {}, JOBS = [];
const rec = (n, fn, steps) => ({ n, fn, steps });
Object.assign(RECIPE, {
  bird: rec(10, r => SY.songbird(SR(), r)), dove: rec(3, r => SY.coo(SR(), r)), pigeon: rec(3, r => SY.coo(SR(), r, { pigeon: true })), crow: rec(4, r => SY.crow(SR(), r)),
  woodpecker: rec(3, r => SY.woodpecker(SR(), r)), bee: rec(3, r => SY.bee(SR(), r)), owl: rec(2, r => SY.owl(SR(), r)),
  clank: rec(4, r => SY.clank(SR(), r)), chain: rec(3, r => SY.chain(SR(), r)), steam: rec(2, r => SY.steam(SR(), r)), creak: rec(4, r => SY.creak(SR(), r)), rattle: rec(4, r => SY.rattle(SR(), r)),
  twig: rec(3, r => SY.twig(SR(), r)), chime: rec(1, r => SY.chime(SR(), r)), shutter: rec(2, r => SY.shutter(SR(), r)), knock: rec(4, r => SY.knock(SR(), r)), zap: rec(3, r => SY.zap(SR(), r)),
  relay: rec(4, r => SY.relay(SR(), r)), hum2: rec(2, r => SY.hum2(SR(), r)), pebbles: rec(3, r => SY.pebbles(SR(), r)), rumble: rec(2, r => SY.rumble(SR(), r)), plop: rec(3, r => SY.plop(SR(), r)),
  gurgle: rec(3, r => SY.gurgle(SR(), r)), drip: rec(8, r => SY.drip(SR(), r)),
  stroke: rec(4, r => SY.stroke(SR(), r)), strokeU: rec(4, r => SY.stroke(SR(), r, { under: true })), blub: rec(5, r => SY.blub(SR(), r)), heart: rec(1, r => SY.heart(SR(), r)),
  splash: rec(3, r => SY.splash(SR(), r)), slip: rec(3, r => SY.splash(SR(), r, { k: 0.35 })),
});
for (const k of Object.keys(SY.SURF)) {                 // 脚步：每种地面 × 走 / 跑 / 蹑着脚 / 落地
  RECIPE[`st:${k}:w`] = rec(6, r => SY.step(SR(), r, k, { run: 0 })); RECIPE[`st:${k}:r`] = rec(6, r => SY.step(SR(), r, k, { run: 1 }));
  RECIPE[`st:${k}:s`] = rec(4, r => SY.step(SR(), r, k, { soft: 1 })); RECIPE[`st:${k}:l`] = rec(4, r => SY.step(SR(), r, k, { land: 1 }));
}
function sbuf(name) {
  let b = BANKS[name];
  if (!b) {
    const R = RECIPE[name]; if (!R || !AC) return null;
    b = BANKS[name] = { list: [MX.toBuf(R.fn(seed()))], last: -1 };
    if (R.n > 1) JOBS.push(fillJob(R, b));
  }
  if (!b.list.length) return null;                  // 还在排队算（prepBank）
  let i = Math.floor(Math.random() * b.list.length); if (b.list.length > 2 && i === b.last) i = (i + 1) % b.list.length;
  b.last = i; return b.list[i];
}
// 先排上队、不在这一帧算：离得还远就开始准备，等真要响的时候已经算好了，不会在那一刻卡一下
function prepBank(name) {
  if (BANKS[name] || !RECIPE[name] || !AC) return;
  const R = RECIPE[name], b = BANKS[name] = { list: [], last: -1 };
  JOBS.push(fillJob(R, b));
}
// 排队的活：往 b 里一个一个地补，补够 R.n 个为止（返回 true 表示还没完）
function fillJob(R, b) {
  let it = null;
  return () => {
    if (!R.steps) b.list.push(MX.toBuf(R.fn(seed())));
    else { it = it || R.steps(seed()); const st = it.next(); if (st.done) { b.list.push(MX.toBuf(st.value)); it = null; } }
    return b.list.length < R.n;
  };
}
function pumpJobs(ms = 4) { const t0 = performance.now(); while (JOBS.length && performance.now() - t0 < ms) if (!JOBS[0]()) JOBS.shift(); }
// 放一组里的一个：o 同 SY.mixer 的 play（gain / rate / pan / lp / wet / bus / delay）
function snd(name, o = {}) { if (!AC || muted) return null; const b = sbuf(name); return b ? MX.play(b, o) : null; }

function initAudio() {
  if (muted) return;                                // 静音的时候不建立 WebAudio，第一次打开声音时再建
  if (AC) { if (AC.state === 'suspended') AC.resume(); return; }
  try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
  master = AC.createGain(); master.gain.value = 0.6; master.connect(AC.destination);
  MX = SY.mixer(AC, master);
  noiseBuf = AC.createBuffer(1, AC.sampleRate * 2, AC.sampleRate);
  const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const out = (g, bus, wet) => { g.connect(MX.bus[bus]); if (wet) { const w = AC.createGain(); w.gain.value = wet; g.connect(w).connect(MX.send); } };
  const loopNoise = (type, freq, q, bus = 'sfx', wet = 0) => {      // 一直循环的滤波噪声，音量由游戏状态控制
    const src = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain();
    src.buffer = noiseBuf; src.loop = true; f.type = type; f.frequency.value = freq; f.Q.value = q; g.gain.value = 0;
    src.connect(f).connect(g); out(g, bus, wet); src.start(0, Math.random() * 1.9); return { f, g };
  };
  const loopOsc = (type, freq, lp, bus = 'sfx', wet = 0) => {
    const o = AC.createOscillator(), f = AC.createBiquadFilter(), g = AC.createGain();
    o.type = type; o.frequency.value = freq; f.type = 'lowpass'; f.frequency.value = lp; g.gain.value = 0;
    o.connect(f).connect(g); out(g, bus, wet); o.start(); return { o, f, g };
  };
  // 一段算好的底子（风吹树叶、流水、蟋蟀、喷灌头）循环着放：先把音量建好（0），第一次要它响的时候才去算（见 setGain），算好了再接上。
  // pans：同一段错开几处起点、摆到左右，听着宽
  const loopTex = (make, o = {}) => {
    const g = AC.createGain(); g.gain.value = 0; let f = null, head = g, queued = false;
    if (o.lp) { f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; f.connect(g); head = f; }
    out(g, o.bus ?? 'amb', o.wet ?? 0);
    const start = () => { if (queued) return; queued = true; JOBS.push(() => {
      const b = MX.toBuf(make(seed()));
      (o.pans ?? [0]).forEach((p, i) => { const s = AC.createBufferSource(); s.buffer = b; s.loop = true; let n = s; if (p && AC.createStereoPanner) { const pn = AC.createStereoPanner(); pn.pan.value = p; n = s.connect(pn); } n.connect(head); s.start(0, (0.13 + i * 0.47) % 1 * b.duration); });
      return false;
    }); };
    return { g, f, start };
  };
  // ---- 机关和别的东西（各章节通过 AUD 控制）----
  loops.cart = loopNoise('bandpass', 95, 1.4, 'sfx', 0.3);     // 推东西的滚动声
  loops.door = loopNoise('lowpass', 120, 1.0, 'sfx', 0.5);     // 闸门升起的轰隆声
  loops.belt = loopNoise('bandpass', 170, 0.9, 'sfx', 0.5);    // 输送带
  loops.water = loopNoise('bandpass', 1300, 0.5, 'sfx', 0.3);  // 水流（哗哗的那一层；咕噜咕噜的那一层在 flow 里）
  loops.sweep = loopNoise('bandpass', 2600, 1.2, 'sfx', 0.3);  // 清洁机器人的刷子
  loops.hum = loopOsc('sawtooth', 52, 240, 'sfx', 0.4);        // 探照灯 / 监控的嗡鸣
  loops.pump = loopOsc('triangle', 46, 180, 'sfx', 0.3);       // 水泵
  loops.buzz = loopOsc('square', 100, 520, 'sfx', 0.3);        // 通电的线路
  { // 直升机（第十一章）：旋翼一下一下拍打空气 —— 低、中、高三层噪声，被每秒十几下的锯齿波切开（每一下起得猛、落得慢）；上面一层发动机的啸叫不跟着拍子。
    // 整个再过一道低通：离得远只剩闷闷的“突突”，飞到头顶才又脆又吵
    const g = AC.createGain(), lp = AC.createBiquadFilter(), pan = AC.createStereoPanner ? AC.createStereoPanner() : null, chop = AC.createGain(), lfo = AC.createOscillator(), dep = AC.createGain();
    g.gain.value = 0; lp.type = 'lowpass'; lp.frequency.value = 400; lp.Q.value = 0.5; chop.gain.value = 0.45; lfo.type = 'sawtooth'; lfo.frequency.value = 12.5; dep.gain.value = -0.45;
    lfo.connect(dep).connect(chop.gain); lfo.start();
    for (const [type, f, q, k, at] of [['lowpass', 190, 0.8, 1, 0.3], ['bandpass', 620, 0.9, 1.6, 1.1], ['bandpass', 1500, 0.8, 0.7, 0.5]]) {
      const s = AC.createBufferSource(), bf = AC.createBiquadFilter(), kg = AC.createGain(); s.buffer = noiseBuf; s.loop = true; bf.type = type; bf.frequency.value = f; bf.Q.value = q; kg.gain.value = k;
      s.connect(bf).connect(kg).connect(chop); s.start(0, at);
    }
    const ws = AC.createBufferSource(), wf = AC.createBiquadFilter(), wg = AC.createGain(); ws.buffer = noiseBuf; ws.loop = true; wf.type = 'bandpass'; wf.frequency.value = 2300; wf.Q.value = 7; wg.gain.value = 0.1;
    ws.connect(wf).connect(wg).connect(lp); ws.start(0, 0.7);
    chop.connect(lp); lp.connect(g); out(pan ? g.connect(pan) : g, 'sfx', 0.35);
    loops.heli = { g, f: lp, pan, lfo };
  }
  // ---- 环境的底子 ----
  loops.room = loopNoise('lowpass', 210, 0.4, 'amb');          // 室内的低鸣（工厂、中枢、山洞）
  loops.drone = loopOsc('sine', 41, 400, 'amb');
  loops.mains = loopOsc('sawtooth', 50, 170, 'amb');           // 电流的嗡嗡
  loops.wind = loopNoise('bandpass', 420, 0.8, 'amb');         // 风：中间那一层“呼——”，阵风来了声音变高
  loops.windLo = loopNoise('lowpass', 160, 0.7, 'amb');        // 风：低的那一层，阵风来了才有
  loops.whistle = loopNoise('bandpass', 880, 14, 'amb');       // 风从铁皮缝里钻过去的哨声（废料场）
  loops.city = loopNoise('lowpass', 150, 0.7, 'amb');          // 城市的远声：很低的一层隆隆
  loops.uw = loopNoise('lowpass', 260, 0.7, 'amb');            // 水下：耳朵里闷闷的一层
  loops.leafD = loopTex(r => SY.rustle(SR(), r, { dry: 1 }), { pans: [-0.55, 0.55] });   // 风吹枯叶
  loops.leafG = loopTex(r => SY.rustle(SR(), r, { dry: 0 }), { pans: [-0.55, 0.55] });   // 风吹嫩叶
  loops.flow = loopTex(r => SY.babble(SR(), r), { pans: [-0.3, 0.3], lp: 3000 });         // 流水 / 暗河
  loops.bugs = loopTex(r => SY.crickets(SR(), r), { pans: [-0.6, 0.6] });                  // 蟋蟀
  loops.spray = loopTex(r => SY.sprinkler(SR(), r), { wet: 0.2 });                         // 喷灌头
}
const setGain = (l, v, k = 0.08) => { const L = AC && loops[l]; if (!L) return; L.g.gain.setTargetAtTime(v, AC.currentTime, k); if (L.start && v > 0.0005) L.start(); };
const setFreq = (l, v, k = 0.3) => { if (AC && loops[l]) (loops[l].f ?? loops[l].o).frequency.setTargetAtTime(v, AC.currentTime, k); };
function setMuted(m) {                              // M 键：打开 / 关掉声音；总音量淡入淡出一下，不会“咔”的一声
  muted = m; initAudio();
  if (master) master.gain.setTargetAtTime(m ? 0 : 0.6, AC.currentTime, 0.05);
}

// 一下短促的噪声（机关、碰撞）和一声音调：走 sfx 那一路，送一点去混响
function hit(freq, q, vol, dur, type = 'bandpass', delay = 0) {
  if (!AC || muted || vol <= 0) return;
  const src = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain(), w = AC.createGain(), t = AC.currentTime + delay;
  src.buffer = noiseBuf; src.loop = true; f.type = type; f.frequency.value = freq; f.Q.value = q; w.gain.value = 0.5;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  src.connect(f).connect(g).connect(MX.bus.sfx); g.connect(w).connect(MX.send); src.start(t, Math.random() * 1.5); src.stop(t + dur + 0.02);
}
function tone(f0, f1, vol, dur, type = 'sine', delay = 0) {
  if (!AC || muted || vol <= 0) return;
  const o = AC.createOscillator(), g = AC.createGain(), w = AC.createGain(), t = AC.currentTime + delay;
  o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur); w.gain.value = 0.5;
  g.gain.setValueAtTime(0.0008, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  o.connect(g).connect(MX.bus.sfx); g.connect(w).connect(MX.send); o.start(t); o.stop(t + dur + 0.02);
}

// ---- 脚步：脚下是什么就是什么声音 ----
let wetStep = -9;                                   // 这一步踩进了水洼（46-ground.js 的 groundLife 发现的），记下时间
function surfaceUnder() {
  if (T - wetStep < 0.1) return 'puddle';
  const w = waterAt(P.x); if (w && P.y < w.y - 0.06) return 'wade';
  if (P.y > groundY(P.x) + 0.03) for (const s of SOLIDS) if (!s.off && P.x + 0.13 > s.x1 && P.x - 0.13 < s.x2 && Math.abs(P.y - s.y2) < 0.06) return s.snd ?? chapterAt(P.x).box ?? 'wood';
  return surfaceAt(P.x);
}
function footstep() {
  const run = Math.abs(P.vx) > 2.2, quiet = !run && (keys.has('S') || P.mode === 'push');
  snd(`st:${surfaceUnder()}:${run ? 'r' : quiet ? 's' : 'w'}`, { bus: 'fol', gain: (run ? 0.5 : quiet ? 0.3 : 0.38) * R2(0.82, 1.08) * SND.vol.step, rate: R2(0.95, 1.05), wet: 0.35 });
}

// ---- 呼吸：一口气现算（长短正好对上动作），见 53-breath.js ----
const VOICE = { A: { voice: 0, nose: 0.25, vol: 1 }, B: { voice: 0.4, nose: 0, vol: 1 }, C: { voice: 0, nose: 0.75, vol: 0.7 } };
// dir 'in' | 'out'，len 秒，k 0..1 累的程度；o 可以改 att / rel / f0 / voice（再乘上这一种声音的嗓音多少）/ gain
function breathSound(dir, len, k, o = {}) {
  if (!AC || muted || len < 0.06) return;
  const V = VOICE[SND.voice] ?? VOICE.A;
  const x = SY.breath(SR(), seed(), { dir, len, k, ...o, voice: (o.voice ?? sstep(0.45, 0.95, k)) * V.voice + (o.voiceAll ?? 0), nose: V.nose * (1 - sstep(0.3, 0.75, k)) });
  MX.play(MX.toBuf(x), { bus: 'fol', gain: (o.gain ?? lerp(0.03, 0.12, Math.pow(k, 1.4))) * V.vol * SND.vol.breath, rate: R2(0.97, 1.03), wet: 0.25 });
}

Object.assign(sfx, {
  jump: () => snd(`st:${surfaceUnder()}:s`, { bus: 'fol', gain: 0.2 * SND.vol.step, rate: 1.12, wet: 0.2 }),          // 起跳：脚底一蹬
  grab: () => { hit(420, 1.2, 0.07, 0.09); hit(1300, 0.6, 0.04, 0.2); },                                                    // 手扒住边缘，衣服一擦
  land: v => snd(`st:${surfaceUnder()}:l`, { bus: 'fol', gain: lerp(0.22, 0.8, clamp((v - 3) / 9, 0, 1)) * SND.vol.step, rate: R2(0.95, 1.03), wet: 0.4 }),
  lever: () => { hit(1400, 2, 0.16, 0.05); tone(190, 70, 0.2, 0.22, 'square', 0.04); },
  doorStop: () => { hit(110, 0.6, 0.5, 0.5, 'lowpass'); tone(60, 34, 0.25, 0.5); },
  alarm: () => { for (let i = 0; i < 3; i++) tone(620, 330, 0.11, 0.26, 'sawtooth', i * 0.3); },
  alarmFar: v => { for (let i = 0; i < 3; i++) tone(620, 330, 0.05 * v, 0.26, 'sawtooth', i * 0.3); },      // 工厂的警报：固定的三声
  tick3: v => { for (let i = 0; i < 3; i++) tone(880, 860, 0.05 * v, 0.1, 'square', i * 0.5); },           // 压机下压前的三次灯号
  press: v => { hit(90, 0.6, 0.7 * v, 0.6, 'lowpass'); tone(70, 30, 0.3 * v, 0.5); hit(2000, 1, 0.1 * v, 0.1); snd('clank', { gain: 0.25 * v, rate: 0.7, wet: 0.8 }); },
  clunk: () => { hit(260, 1.2, 0.25, 0.12); tone(120, 80, 0.12, 0.1); },
  dock: () => { hit(300, 1.5, 0.3, 0.1); tone(140, 90, 0.2, 0.16, 'square'); tone(520, 780, 0.07, 0.3, 'sine', 0.12); },
  spark: () => { for (let i = 0; i < 6; i++) hit(R2(3000, 6000), 2, 0.12, 0.04, 'bandpass', i * R2(0.03, 0.07)); },
  splash: k => { snd('splash', { bus: 'fol', gain: 0.55 * (k ?? 1), wet: 0.4 }); },                                         // 掉进 / 跳进水里
  fall: () => { hit(200, 0.7, 0.3, 0.4, 'lowpass'); },
  bark: v => { for (const d of [0, 0.34]) { hit(700, 1.4, 0.3 * v, 0.13, 'bandpass', d); tone(430, 170, 0.22 * v, 0.14, 'sawtooth', d); } },
  meow: () => { tone(720, 1080, 0.07, 0.16, 'triangle'); tone(1080, 760, 0.07, 0.24, 'triangle', 0.15); },
  catHop: () => hit(1800, 1.5, 0.02, 0.05),
  deny: () => { for (const d of [0, 0.22]) tone(300, 290, 0.1, 0.16, 'square', d); },
  ok: () => { tone(660, 660, 0.08, 0.14); tone(990, 990, 0.08, 0.26, 'sine', 0.12); },
  servo: () => tone(480, 720, 0.03, 0.22, 'square'),
  powerDown: () => { tone(220, 38, 0.2, 1.3, 'sawtooth'); hit(140, 0.7, 0.3, 0.9, 'lowpass'); },
  powerUp: () => { tone(60, 250, 0.14, 0.9, 'sawtooth'); tone(520, 780, 0.06, 0.4, 'sine', 0.7); },
  valve: () => { for (const d of [0, 0.2, 0.42]) tone(R2(900, 1100), R2(1300, 1500), 0.04, 0.16, 'triangle', d); hit(320, 1, 0.15, 0.5); },
  grow: () => tone(300, 520, 0.035, 1.3),
  cloth: () => { hit(600, 0.5, 0.2, 0.5); hit(1800, 0.6, 0.08, 0.35); },
  snip: v => { hit(3200, 3, 0.1 * v, 0.05); hit(2400, 3, 0.08 * v, 0.05, 'bandpass', 0.09); },
  chirp: () => snd('bird', { bus: 'amb', gain: 0.1 * SND.vol.bird, pan: R2(-0.8, 0.8), wet: 0.5 }),
  // 地上的小动物和水洼（46-ground.js）
  croak: v => { for (const d of [0, 0.19]) tone(R2(170, 190), 120, 0.035 * v, 0.13, 'square', d); },                  // 青蛙叫两声
  frogHop: () => hit(1500, 1.4, 0.014, 0.05),
  plop: v => snd('plop', { bus: 'amb', gain: 0.3 * v, wet: 0.4 }),                                                      // 扎进水里
  skitter: () => { for (let i = 0; i < 5; i++) hit(R2(3200, 4400), 2.5, 0.012, 0.025, 'bandpass', i * 0.045); },        // 蜥蜴窜走
  puddle: () => { wetStep = T; },                                                                                       // 一脚踩进水洼：这一步的脚步声换成踩水
  wade: () => snd('st:wade:w', { bus: 'fol', gain: 0.45, wet: 0.3 }),                                                   // 从水里撑上岸
  blub: () => snd('blub', { bus: 'fol', gain: R2(0.08, 0.16), rate: R2(0.85, 1.2), wet: 0.3 }),                         // 嘴边冒出一个气泡
});

// ---- 鸟、滴水、远处偶尔一下的声音：每一章一组（这里写的是旧原型的章节，OLD + k；《逃出工厂》的在 escape/85-fixups.js）----
const BIRDS = { [OLD + 2]: [['bird', 0.55], ['dove', 0.3], ['woodpecker', 0.15]], [OLD + 7]: [['bird', 0.82], ['dove', 0.18]], [OLD + 9]: [['bird', 1]] };
const FAR = { [OLD + 1]: ['clank', 'chain', 'steam', 'creak', 'hum2'], [OLD + 2]: ['woodpecker', 'crow', 'twig'], [OLD + 3]: ['crow', 'rattle', 'creak', 'crow'], [OLD + 4]: ['chime', 'shutter', 'pigeon'],
  [OLD + 5]: ['knock', 'zap', 'clank', 'pigeon'], [OLD + 6]: ['gurgle', 'knock', 'pigeon'], [OLD + 7]: ['bee', 'woodpecker', 'bee'], [OLD + 8]: ['relay', 'zap', 'hum2', 'relay'], [`${OLD + 8}o`]: ['owl', 'twig'],
  [OLD + 9]: ['pebbles', 'rumble', 'plop', 'pebbles'], [OLD + 11]: ['owl', 'twig', 'owl'] };
const FARV = { clank: 0.2, chain: 0.13, steam: 0.08, creak: 0.11, hum2: 0.1, woodpecker: 0.13, crow: 0.13, twig: 0.11, rattle: 0.15, chime: 0.09, shutter: 0.1, pigeon: 0.1,
  knock: 0.16, zap: 0.06, gurgle: 0.13, bee: 0.08, relay: 0.12, owl: 0.1, pebbles: 0.15, rumble: 0.3, plop: 0.13 };
const pickW = list => { let s = 0; for (const [, w] of list) s += w; let u = Math.random() * s; for (const [n, w] of list) if ((u -= w) <= 0) return n; return list[0][0]; };
let farT = 5, strokePh = 0, heartT = 0, leafK = 0.5;
function stepAmbient(dt) {
  const ch = chapterAt(P.x).n;
  const birds = BIRDS[ch] ?? (ch > OLD ? BIRDS[OLD + 9] : null);         // 旧原型里没单写的章节用山洞那一组；《逃出工厂》没写的章节没有鸟叫
  if (birds && E.birds > 0.01 && Math.random() < E.birds * dt * 0.32) {
    const b = pickW(birds);
    snd(b, { bus: 'amb', gain: R2(0.05, 0.14) * (b === 'dove' ? 0.8 : 1) * SND.vol.bird, pan: R2(-0.9, 0.9), lp: R2(5000, 11000), wet: R2(0.3, 0.9), rate: R2(0.94, 1.06) });
  }
  if (E.aDrip > 0.01 && Math.random() < E.aDrip * dt * 1.3) snd('drip', { bus: 'amb', gain: R2(0.03, 0.11) * SND.vol.amb, pan: R2(-0.8, 0.8), wet: 1.3, rate: R2(0.8, 1.25) });
  if (E.aFar > 0.01 && (farT -= dt * E.aFar) <= 0) {
    farT = R2(6, 14); const pool = FAR[ch === OLD + 8 && E.ext > 0.5 ? `${OLD + 8}o` : ch];   // 旧第八章出了门是夜里的野外
    if (pool) { const n = pool[Math.floor(Math.random() * pool.length)]; snd(n, { bus: 'amb', gain: (FARV[n] ?? 0.1) * R2(0.6, 1) * SND.vol.far, pan: R2(-0.85, 0.85), lp: R2(1800, 6000), wet: R2(0.9, 1.5), rate: R2(0.94, 1.06) }); }
  }
}
// ---- 水里：划水、心跳 ----
function stepSwimSound(dt) {
  if (P.mode !== 'swim') { strokePh = 0; return; }
  const ph = P.stroke ?? 0, moving = Math.abs(P.vx) + Math.abs(P.vy) > 0.3;
  if (strokePh < 0.36 && ph >= 0.36 && (moving || !P.under)) snd(P.under ? 'strokeU' : 'stroke', { bus: 'fol', gain: (P.under ? 0.3 : 0.24) * R2(0.8, 1.1), rate: R2(0.92, 1.08), wet: 0.3 });
  strokePh = ph;
  const panic = P.under ? sstep(0.5, 1, 1 - P.air / SWIM.breath) : 0;              // 憋不住了：心跳一下下响起来，越来越快
  if (panic > 0.01 && (heartT -= dt) <= 0) { heartT = lerp(1.1, 0.45, panic); snd('heart', { bus: 'fol', gain: 0.5 * panic, wet: 0 }); }
}

// ---- 路边的植物被拨开（48-brush.js 的 stepPlant 每帧报上来：rub 挨着主角的叶子被带着走得多快、back 刚松开的叶子弹回去多快、drop 枝条抖落了几片）----
// 清脆的“沙啦”（配方在 51-sound-synth.js 的 brushSteps）。擦：一段循环的沙沙声，推得越快越响、越亮；弹回去：轻轻“唰”一下；抖落：零零星星几下碎响。
// 叶子是枯是嫩看这一章的环境关键帧（leafDry）。这几组都是一层一层算的：一丛植物离主角还有二十几米、头一次报上来的时候就排上队，等走到跟前早就算好了
for (const k of ['leaf', 'grass', 'fern', 'branch']) for (const d of [0, 1]) {
  const R = (n, ev) => rec(n, r => SY.brush(SR(), r, { kind: k, dry: d, ev }), r => SY.brushSteps(SR(), r, { kind: k, dry: d, ev }));
  RECIPE[`br:${k}:${d}:rub`] = R(1, 'rub'); RECIPE[`br:${k}:${d}:back`] = R(4, 'back');
  if (k === 'branch') RECIPE[`br:${k}:${d}:drop`] = R(3, 'drop');
}
// n：走着穿过这一丛时擦得最快的那几下有多快（实测，拿来归一：草一次挨着十几根，数大）/ g 擦的音量 / gb 弹回去的音量 / gap 同一丛两声弹回去至少隔多久 / gd 抖落叶子的音量
const BRK = { leaf: { n: 15, g: 0.23, gb: 0.2, gap: 0.07 }, grass: { n: 105, g: 0.31, gb: 0.13, gap: 0.1 }, fern: { n: 21, g: 0.25, gb: 0.18, gap: 0.07 }, branch: { n: 9, g: 0.42, gb: 0.2, gap: 0.08, gd: 0.16 } };
const BRV = new Map();                                // 正在响的“擦”：每一丛一个
let brFrame = 0;
function brushSound(Pl, dt, rub, back, drop) {
  if (!AC || muted) return;
  const K = BRK[Pl.kind], dk = E.leafDry > 0.5 ? 1 : 0, now = AC.currentTime, V = SND.vol.brush;
  if (Pl.sk?.d !== dk) {                              // 这一丛用哪几组（枯叶 / 嫩叶）；头一次报上来就排队去算
    const k = `br:${Pl.kind}:${dk}`; Pl.sk = { d: dk, rub: k + ':rub', back: k + ':back', drop: k + ':drop' };
    prepBank(Pl.sk.rub); prepBank(Pl.sk.back); if (K.gd) prepBank(Pl.sk.drop);
  }
  const N = Pl.sk;
  // 擦：推得越快越响（压一压，跑起来不至于太冲），也越亮；一碰就起来，松开以后落得慢一点
  const lvl = Math.pow(Math.min(rub / K.n, 3.5), 0.7);
  Pl.rubL = lerp(Pl.rubL ?? 0, lvl, 1 - Math.exp(-dt / (lvl > (Pl.rubL ?? 0) ? 0.03 : 0.09)));
  let v = BRV.get(Pl);
  if (v && v.key !== N.rub) { v.g.gain.setTargetAtTime(0, now, 0.04); v.s.stop(now + 0.3); BRV.delete(Pl); v = null; }   // 叶子从枯换成嫩（走进了另一章的环境）
  if (!v && Pl.rubL > 0.02) {
    const b = BANKS[N.rub]?.list[0];
    if (b) {
      const s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain(), w = AC.createGain();
      s.buffer = b; s.loop = true; f.type = 'lowpass'; f.Q.value = 0.5; f.frequency.value = 6000; g.gain.value = 0; w.gain.value = 0.3;
      s.connect(f).connect(g).connect(MX.bus.fol); g.connect(w).connect(MX.send); s.start(0, Math.random() * b.duration);
      BRV.set(Pl, v = { s, f, g, key: N.rub, idle: 0 });
    }
  }
  if (v) {
    v.seen = brFrame;
    v.g.gain.setTargetAtTime(K.g * Pl.rubL * V, now, 0.02);
    v.f.frequency.setTargetAtTime(lerp(2800, 12000, clamp(rub / K.n / 2.5, 0, 1)), now, 0.05);
    v.idle = Pl.rubL < 0.01 ? v.idle + dt : 0;
    if (v.idle > 1) { v.g.gain.setTargetAtTime(0, now, 0.03); v.s.stop(now + 0.3); BRV.delete(Pl); }
  }
  // 弹回去：刚松开的叶子里弹得最快的那一片，轻轻“唰”一下；同一丛隔一小会儿才响下一声（草叶多，隔得长一些）
  Pl.bk = Math.max((Pl.bk ?? 0) * Math.exp(-dt / 0.08), back);
  if (Pl.bk > 3 && T - (Pl.bkT ?? -9) > K.gap) {
    snd(N.back, { bus: 'fol', gain: K.gb * Math.pow(clamp((Pl.bk - 3) / 12, 0, 1.4), 0.8) * R2(0.85, 1.1) * V, rate: R2(0.92, 1.08), wet: 0.35 });
    Pl.bkT = T; Pl.bk = 0;
  }
  // 枝条抖落叶子
  for (let i = 0; i < drop; i++) snd(N.drop, { bus: 'fol', gain: K.gd * R2(0.8, 1.1) * V, rate: R2(0.92, 1.08), wet: 0.4, delay: i * R2(0.05, 0.12) });
}
function stepBrushVoices() {                          // 这一帧没再报上来的（那一丛离远了、那一章卸载了、声音关了）：淡出、停掉
  for (const [Pl, v] of BRV) if (v.seen !== brFrame) { v.g.gain.setTargetAtTime(0, AC.currentTime, 0.04); v.s.stop(AC.currentTime + 0.3); BRV.delete(Pl); }
  brFrame++;
}

function updateAudio(dt, stepNow) {
  if (!AC) return;
  pumpJobs();
  stepBrushVoices();
  const t = AC.currentTime, g = GUST.v, V = SND.vol.amb;
  // 空间：走到哪里就是哪里的混响
  MX.rv.out.gain.setTargetAtTime(E.rvOut * RV.out, t, 0.3); MX.rv.hall.gain.setTargetAtTime(E.rvHall * RV.hall, t, 0.3); MX.rv.cave.gain.setTargetAtTime(E.rvCave * RV.cave, t, 0.3);
  // 底子
  setGain('room', E.aRoom * 0.15 * V, 0.5); setFreq('room', E.roomF, 0.5); setGain('drone', E.aRoom * 0.03 * V, 0.5); setGain('mains', E.aHum * 0.038 * V, 0.5);
  setGain('wind', E.aWind * (0.035 + 0.11 * g) * V, 0.4); setFreq('wind', 260 + 300 * g, 0.5);
  setGain('windLo', E.aWind * 0.15 * Math.pow(g, 1.6) * V, 0.5);
  setGain('whistle', E.aWhis * 0.12 * sstep(0.7, 1.3, g) * V, 0.6); setFreq('whistle', 820 + 160 * Math.sin(T * 0.13) + 120 * g, 0.4);
  setGain('city', E.aCity * 0.18 * V, 0.6);
  leafK = damp(leafK, g, 1.5, dt);                                                     // 树叶：阵风过来以后慢半拍才响起来
  const lv = E.aLeaf * (0.02 + 0.17 * Math.pow(clamp(leafK * 0.85 + 0.12, 0, 1.4), 1.6)) * V;
  setGain('leafD', lv * E.leafDry, 0.25); setGain('leafG', lv * 0.6 * (1 - E.leafDry), 0.25);     // 嫩叶那一段本身响一些，压一点
  setGain('bugs', E.aBug * 0.12 * V, 0.8);
  setGain('flow', (E.aFlow * 0.115 + AUD.water * 0.1) * V, 0.4);
  setGain('spray', AUD.spray * 0.15, 0.3);
  // 机关和别的东西
  setGain('cart', Math.max(P.mode === 'push' && P.grabObj ? clamp(Math.abs(P.grabObj.v) * 0.45, 0, 0.5) : 0, AUD.wheels), 0.05);
  let dg = 0; for (const gt of GATES) if (gt.open !== gt.want && Math.abs(gt.x - P.x) < 30) dg = 0.5;
  setGain('door', dg, 0.12);
  setGain('hum', AUD.hum, 0.2); loops.hum.o.frequency.setTargetAtTime(AUD.humF, t, 0.1);
  setGain('belt', AUD.belt * 0.35, 0.2); setGain('water', AUD.water * 0.12, 0.3); setGain('pump', AUD.pump * 0.12, 0.2);
  setGain('buzz', AUD.buzz * 0.012, 0.15); setGain('sweep', AUD.sweep * 0.05, 0.1);
  setGain('heli', AUD.heli * 1.3, 0.25); setFreq('heli', lerp(280, 5200, AUD.heliLP * AUD.heliLP), 0.3);          // 直升机：越近越响、越脆，旋翼的拍子也快一点
  if (loops.heli.pan) loops.heli.pan.pan.setTargetAtTime(clamp(AUD.heliPan, -1, 1), t, 0.2);
  loops.heli.lfo.frequency.setTargetAtTime(11.5 + 2 * AUD.heliLP, t, 0.5);
  // 水下：什么都闷下去，耳朵里只剩一层低低的嗡
  const uw = P.mode === 'swim' && P.under && state !== 'title' ? 1 : 0;
  MX.uw.frequency.setTargetAtTime(uw ? 480 : 18000, t, uw ? 0.05 : 0.12); setGain('uw', uw * 0.12, 0.15);
  if (stepNow) footstep();
  stepSwimSound(dt);
  if (state !== 'title') stepAmbient(dt);
}
