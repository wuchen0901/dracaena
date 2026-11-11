
// ============================================================
//  声音：全部用 WebAudio 现场合成，不加载任何音频文件
// ============================================================
let AC = null, master = null, noiseBuf = null, muted = false;
const loops = {};
function initAudio() {
  if (AC) { if (AC.state === 'suspended') AC.resume(); return; }
  try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
  master = AC.createGain(); master.gain.value = muted ? 0 : 0.6; master.connect(AC.destination);
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
  loops.cart = loopNoise('bandpass', 95, 1.4);      // 推车的滚动声
  loops.door = loopNoise('lowpass', 120, 1.0);      // 大门升起的轰隆声
  loops.hum = loopOsc('sawtooth', 52, 240);         // 探照灯机器的嗡鸣
  loops.drone = loopOsc('sine', 41, 400);
}
const setGain = (l, v, k = 0.08) => { if (AC && loops[l]) loops[l].g.gain.setTargetAtTime(v, AC.currentTime, k); };

function hit(freq, q, vol, dur, type = 'bandpass') { // 一下短促的噪声：脚步、落地、碰撞
  if (!AC) return;
  const src = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain(), t = AC.currentTime;
  src.buffer = noiseBuf; src.loop = true; f.type = type; f.frequency.value = freq; f.Q.value = q;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  src.connect(f).connect(g).connect(master); src.start(t, Math.random() * 1.5); src.stop(t + dur + 0.02);
}
function tone(f0, f1, vol, dur, type = 'sine', delay = 0) {
  if (!AC) return;
  const o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime + delay;
  o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(0.0008, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  o.connect(g).connect(master); o.start(t); o.stop(t + dur + 0.02);
}
Object.assign(sfx, {
  step: (out, soft) => hit(out ? rr(900, 1500) : rr(520, 820), 1.1, soft ? 0.035 : 0.075, out ? 0.09 : 0.065),
  jump: () => hit(760, 0.9, 0.05, 0.07),
  grab: () => hit(420, 1.2, 0.09, 0.09),
  land: v => { hit(170, 0.7, clamp(v * 0.045, 0.08, 0.4), 0.2, 'lowpass'); tone(85, 48, clamp(v * 0.02, 0.03, 0.16), 0.16); },
  lever: () => { hit(1400, 2, 0.16, 0.05); tone(190, 70, 0.2, 0.22, 'square', 0.04); },
  doorStop: () => { hit(110, 0.6, 0.5, 0.5, 'lowpass'); tone(60, 34, 0.25, 0.5); },
  alarm: () => { for (let i = 0; i < 3; i++) tone(620, 330, 0.11, 0.26, 'sawtooth', i * 0.3); },
});
function updateAudio(ext, stepNow) {
  if (!AC) return;
  setGain('room', ext ? 0 : 0.2, 0.4); setGain('drone', ext ? 0.015 : 0.05, 0.4); setGain('wind', ext ? 0.085 + 0.03 * Math.sin(T * 0.6) : 0, 0.5);
  setGain('cart', P.mode === 'push' ? clamp(Math.abs(cart.v) * 0.45, 0, 0.5) : 0, 0.05);
  setGain('door', door.opening && door.open < 1 ? 0.5 : 0, 0.12);
  const near = ext ? 0 : sstep(34, 6, Math.abs(P.x - WATCH.cx));
  setGain('hum', near * (0.02 + 0.05 * WATCH.exposure), 0.2);
  loops.hum.o.frequency.setTargetAtTime(52 + 60 * WATCH.exposure, AC.currentTime, 0.1);
  if (stepNow) sfx.step(ext, keys.has('S') || P.mode === 'push');
}
