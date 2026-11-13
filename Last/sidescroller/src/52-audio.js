
// ============================================================
//  声音：全部用 WebAudio 现场合成，不加载任何音频文件
// ============================================================
let AC = null, master = null, noiseBuf = null, muted = true;   // 现阶段默认静音：每次打开游戏都是静音，玩家按 M 自己打开
const loops = {};
// 各章节每一帧往这里写“这个持续的声音现在该多响”（0..1），下面统一平滑地跟过去
const AUD = { hum: 0, humF: 52, belt: 0, water: 0, pump: 0, buzz: 0, sweep: 0 };
function initAudio() {
  if (muted) return;                                // 静音的时候不建立 WebAudio，第一次打开声音时再建
  if (AC) { if (AC.state === 'suspended') AC.resume(); return; }
  try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
  master = AC.createGain(); master.gain.value = 0.6; master.connect(AC.destination);
  noiseBuf = AC.createBuffer(1, AC.sampleRate * 2, AC.sampleRate);
  const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const loopNoise = (type, freq, q) => {            // 一直循环的滤波噪声，音量由游戏状态控制
    const src = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain();
    src.buffer = noiseBuf; src.loop = true; f.type = type; f.frequency.value = freq; f.Q.value = q; g.gain.value = 0;
    src.connect(f).connect(g).connect(master); src.start(); return { f, g };
  };
  const loopOsc = (type, freq, lp) => {
    const o = AC.createOscillator(), f = AC.createBiquadFilter(), g = AC.createGain();
    o.type = type; o.frequency.value = freq; f.type = 'lowpass'; f.frequency.value = lp; g.gain.value = 0;
    o.connect(f).connect(g).connect(master); o.start(); return { o, f, g };
  };
  loops.room = loopNoise('lowpass', 210, 0.4);      // 厂房里的低沉底噪
  loops.wind = loopNoise('bandpass', 420, 0.7);     // 室外的风
  loops.cart = loopNoise('bandpass', 95, 1.4);      // 推东西的滚动声
  loops.door = loopNoise('lowpass', 120, 1.0);      // 闸门升起的轰隆声
  loops.belt = loopNoise('bandpass', 170, 0.9);     // 输送带
  loops.water = loopNoise('bandpass', 1300, 0.5);   // 水流
  loops.sweep = loopNoise('bandpass', 2600, 1.2);   // 清洁机器人的刷子
  loops.hum = loopOsc('sawtooth', 52, 240);         // 探照灯 / 监控的嗡鸣
  loops.pump = loopOsc('triangle', 46, 180);        // 水泵
  loops.buzz = loopOsc('square', 100, 520);         // 通电的线路
  loops.drone = loopOsc('sine', 41, 400);
}
const setGain = (l, v, k = 0.08) => { if (AC && loops[l]) loops[l].g.gain.setTargetAtTime(v, AC.currentTime, k); };
function setMuted(m) {                              // M 键：打开 / 关掉声音；总音量淡入淡出一下，不会“咔”的一声
  muted = m; initAudio();
  if (master) master.gain.setTargetAtTime(m ? 0 : 0.6, AC.currentTime, 0.05);
}

function hit(freq, q, vol, dur, type = 'bandpass', delay = 0) { // 一下短促的噪声：脚步、落地、碰撞
  if (!AC || muted || vol <= 0) return;
  const src = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain(), t = AC.currentTime + delay;
  src.buffer = noiseBuf; src.loop = true; f.type = type; f.frequency.value = freq; f.Q.value = q;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  src.connect(f).connect(g).connect(master); src.start(t, Math.random() * 1.5); src.stop(t + dur + 0.02);
}
function tone(f0, f1, vol, dur, type = 'sine', delay = 0) {
  if (!AC || muted || vol <= 0) return;
  const o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime + delay;
  o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(0.0008, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  o.connect(g).connect(master); o.start(t); o.stop(t + dur + 0.02);
}
const R2 = (a, b) => a + (b - a) * Math.random();   // 声音用的随机数：不动关卡那一套固定种子
Object.assign(sfx, {
  step: (out, soft) => hit(out ? R2(900, 1500) : R2(520, 820), 1.1, soft ? 0.035 : 0.075, out ? 0.09 : 0.065),
  jump: () => hit(760, 0.9, 0.05, 0.07),
  grab: () => hit(420, 1.2, 0.09, 0.09),
  land: v => { hit(170, 0.7, clamp(v * 0.045, 0.08, 0.4), 0.2, 'lowpass'); tone(85, 48, clamp(v * 0.02, 0.03, 0.16), 0.16); },
  lever: () => { hit(1400, 2, 0.16, 0.05); tone(190, 70, 0.2, 0.22, 'square', 0.04); },
  doorStop: () => { hit(110, 0.6, 0.5, 0.5, 'lowpass'); tone(60, 34, 0.25, 0.5); },
  alarm: () => { for (let i = 0; i < 3; i++) tone(620, 330, 0.11, 0.26, 'sawtooth', i * 0.3); },
  alarmFar: v => { for (let i = 0; i < 3; i++) tone(620, 330, 0.05 * v, 0.26, 'sawtooth', i * 0.3); },      // 工厂的警报：固定的三声
  tick3: v => { for (let i = 0; i < 3; i++) tone(880, 860, 0.05 * v, 0.1, 'square', i * 0.5); },           // 压机下压前的三次灯号
  press: v => { hit(90, 0.6, 0.7 * v, 0.6, 'lowpass'); tone(70, 30, 0.3 * v, 0.5); hit(2000, 1, 0.1 * v, 0.1); },
  clunk: () => { hit(260, 1.2, 0.25, 0.12); tone(120, 80, 0.12, 0.1); },
  dock: () => { hit(300, 1.5, 0.3, 0.1); tone(140, 90, 0.2, 0.16, 'square'); tone(520, 780, 0.07, 0.3, 'sine', 0.12); },
  spark: () => { for (let i = 0; i < 6; i++) hit(R2(3000, 6000), 2, 0.12, 0.04, 'bandpass', i * R2(0.03, 0.07)); },
  splash: () => { hit(900, 0.6, 0.35, 0.5); hit(300, 0.7, 0.3, 0.6, 'lowpass'); },
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
  chirp: () => { const f = R2(2200, 3400); for (let i = 0, n = 2 + Math.floor(Math.random() * 3); i < n; i++) tone(f, f * R2(1.15, 1.4), 0.016, 0.07, 'sine', i * 0.1); },
});
function updateAudio(dt, stepNow) {
  if (!AC) return;
  const ext = E.ext;
  setGain('room', (1 - ext) * 0.2, 0.4); setGain('drone', lerp(0.05, 0.015, ext), 0.4); setGain('wind', ext * (0.085 + 0.03 * Math.sin(T * 0.6)), 0.5);
  setGain('cart', P.mode === 'push' && P.grabObj ? clamp(Math.abs(P.grabObj.v) * 0.45, 0, 0.5) : 0, 0.05);
  let dg = 0; for (const g of GATES) if (g.open !== g.want && Math.abs(g.x - P.x) < 30) dg = 0.5;
  setGain('door', dg, 0.12);
  setGain('hum', AUD.hum, 0.2); loops.hum.o.frequency.setTargetAtTime(AUD.humF, AC.currentTime, 0.1);
  setGain('belt', AUD.belt * 0.35, 0.2); setGain('water', AUD.water * 0.16, 0.3); setGain('pump', AUD.pump * 0.12, 0.2);
  setGain('buzz', AUD.buzz * 0.012, 0.15); setGain('sweep', AUD.sweep * 0.05, 0.1);
  if (stepNow) sfx.step(ext > 0.5, keys.has('S') || P.mode === 'push');
  if (E.birds > 0.01 && Math.random() < E.birds * dt * 0.45) sfx.chirp();
}
