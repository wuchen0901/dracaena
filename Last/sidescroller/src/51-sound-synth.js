// ============================================================
//  声音的配方：所有声音都是现算出来的波形，不加载任何音频文件
//  这里只有纯计算，不碰游戏状态：游戏（52-audio.js）打开声音时用它算好一批放进缓冲区；node 里的检查脚本也直接用这一份。
//  每个配方 (sr 采样率, r 随机数, o 参数) → Float32Array（单声道）。最后的 mixer() 是 WebAudio 的那一部分：总线、混响、怎么放一个声音
// ============================================================
const SY = (() => {
  const TAU = Math.PI * 2, mix = (a, b, t) => a + (b - a) * t, cl = (x, a, b) => Math.min(b, Math.max(a, x));
  function rng(seed) { let s = seed | 0 || 7; return () => { s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const U = (r, a, b) => a + (b - a) * r();
  const buf = (sr, sec) => new Float32Array(Math.max(1, Math.ceil(sr * sec)));

  // ---- 滤波：双二阶（RBJ 的公式）。lp 低通 / hp 高通 / bp 带通（峰值 0 dB）/ pk 峰值均衡 ----
  function BQ(sr, type, f, q = 0.707, db = 0) {
    let b0 = 1, b1 = 0, b2 = 0, a1 = 0, a2 = 0, x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    const F = {
      set(f, qq = q) {
        const w = TAU * cl(f, 10, sr * 0.46) / sr, c = Math.cos(w), al = Math.sin(w) / (2 * qq), A = Math.pow(10, db / 40);
        let B0, B1, B2, A0 = 1 + al, A1 = -2 * c, A2 = 1 - al;
        if (type === 'lp') { B1 = 1 - c; B0 = B2 = B1 / 2; }
        else if (type === 'hp') { B1 = -(1 + c); B0 = B2 = (1 + c) / 2; }
        else if (type === 'bp') { B0 = al; B1 = 0; B2 = -al; }
        else { B0 = 1 + al * A; B1 = A1; B2 = 1 - al * A; A0 = 1 + al / A; A2 = 1 - al / A; }
        b0 = B0 / A0; b1 = B1 / A0; b2 = B2 / A0; a1 = A1 / A0; a2 = A2 / A0; return F;
      },
      run(x) { const y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2; x2 = x1; x1 = x; y2 = y1; y1 = y; return y; },
    };
    return F.set(f, q);
  }
  // ---- 噪声：白 / 粉红（低处多一些，听着软）/ 褐（更低更闷）；wander：慢慢游走的随机数（-1..1），大约每 1/f 秒换一个方向 ----
  const whiteGen = r => () => r() * 2 - 1;
  function pinkGen(r) { let b0 = 0, b1 = 0, b2 = 0; return () => { const w = r() * 2 - 1; b0 = 0.99765 * b0 + w * 0.099046; b1 = 0.963 * b1 + w * 0.2965164; b2 = 0.57 * b2 + w * 1.0526913; return (b0 + b1 + b2 + w * 0.1848) * 0.22; }; }
  function brownGen(r) { let b = 0; return () => (b = (b + 0.02 * (r() * 2 - 1)) / 1.02) * 3.5; }
  function wander(sr, r, f) { let a = U(r, -1, 1), b = U(r, -1, 1), t = r(); const d = f / sr; return () => { if ((t += d) >= 1) { t -= 1; a = b; b = U(r, -1, 1); } return a + (b - a) * (1 - Math.cos(Math.PI * t)) / 2; }; }
  const bsaw = (ph, n) => { let s = 0; for (let k = 1; k <= n; k++) s += Math.sin(TAU * k * ph) / k; return s * 0.6; };   // 不混叠的锯齿波（前 n 个谐波）

  // ---- 往一段波形里叠东西 ----
  // 一段噪声：t 开始（秒）/ a 音量 / att 起音 / dec 衰减（指数的时间常数）/ len 最长多久 / hp、lp 高通、低通 / bp [频率, Q] 带通 / sweep [起, 止, 用多久] 带通滑过去 / pink 粉红噪声
  function noise(out, sr, r, o) {
    const i0 = Math.round((o.t ?? 0) * sr); if (i0 >= out.length) return;
    const att = Math.max(1, (o.att ?? 0.0004) * sr), dec = (o.dec ?? 0.03) * sr, n = Math.min(out.length - i0, Math.ceil((o.len ?? (o.att ?? 0) + (o.dec ?? 0.03) * 7) * sr));
    const gen = o.pink ? pinkGen(r) : whiteGen(r), hp = o.hp && BQ(sr, 'hp', o.hp, 0.7), lp = o.lp && BQ(sr, 'lp', o.lp, 0.7), bp = o.bp && BQ(sr, 'bp', o.bp[0], o.bp[1]), sw = o.sweep, a = o.a ?? 1;
    for (let i = 0; i < n; i++) {
      if (sw && (i & 15) === 0) bp.set(sw[0] * Math.pow(sw[1] / sw[0], Math.min(1, i / (sw[2] * sr))), o.bp[1]);
      let x = gen(); if (hp) x = hp.run(x); if (lp) x = lp.run(x); if (bp) x = bp.run(x);
      out[i0 + i] += a * x * (i < att ? i / att : Math.exp(-(i - att) / dec));
    }
  }
  // 一声正弦：f0 → f1（指数地滑）/ len / a / att / dec / h2 二次谐波
  function sine(out, sr, o) {
    const i0 = Math.round((o.t ?? 0) * sr); if (i0 >= out.length) return;
    const n = Math.min(out.length - i0, Math.ceil(o.len * sr)), att = Math.max(1, (o.att ?? 0.002) * sr), dec = (o.dec ?? o.len / 4) * sr, a = o.a ?? 1, h2 = o.h2 ?? 0, k = Math.pow((o.f1 ?? o.f0) / o.f0, 1 / n);
    let ph = 0, f = o.f0;
    for (let i = 0; i < n; i++) { ph += TAU * f / sr; f *= k; out[i0 + i] += a * (i < att ? i / att : Math.exp(-(i - att) / dec)) * (Math.sin(ph) + h2 * Math.sin(2 * ph)); }
  }
  // 敲在一块东西上：这块东西自己的几个“音”一起响、各自衰减。modes: [[频率, 衰减的时间常数, 音量], ...]
  function modes(out, sr, o) {
    const i0 = Math.round((o.t ?? 0) * sr); if (i0 >= out.length) return;
    for (const [f, tau, amp] of o.modes) {
      const n = Math.min(out.length - i0, Math.ceil(tau * 6 * sr)), w = TAU * Math.min(f, sr * 0.45) / sr, c = Math.cos(w), s = Math.sin(w), d = Math.exp(-1 / (tau * sr));
      let re = 1, im = 0, g = (o.a ?? 1) * amp;
      for (let i = 0; i < n; i++) { const nr = re * c - im * s; im = re * s + im * c; re = nr; out[i0 + i] += g * im; g *= d; }
    }
  }
  const jit = (r, M, k) => M.map(([f, t, a]) => [f * (1 + k * (r() * 2 - 1)), t, a]);      // 同一种东西，每一块的音高略有不同
  // 一阵细碎的声音：n 颗很短的噪声颗粒散在 t0..t1 之间（shape(u) 决定前密后疏，u 从 0 到 1），整串再过一遍滤波
  function grains(out, sr, r, o) { const it = grainsSteps(out, sr, r, o); while (!it.next().done); }
  function* grainsSteps(out, sr, r, o) {                            // 同 grains，只是算一段停一下（游戏里每一帧只算一小段，见 brushSteps）
    const i0 = Math.round(o.t0 * sr), span = Math.max(1, (o.t1 - o.t0) * sr), tmp = new Float32Array(Math.ceil(span + 0.012 * sr)), gen = whiteGen(r), p = o.pow ?? 2;
    for (let k = 0; k < o.n; k++) {
      let u; do u = r(); while (o.shape && r() > o.shape(u));
      const j = Math.floor(u * span), a = Math.pow(r(), p), dec = U(r, o.dec[0], o.dec[1]) * sr, m = Math.min(tmp.length - j, Math.ceil(dec * 5));
      for (let i = 0, g = a, q = Math.exp(-1 / dec); i < m; i++, g *= q) tmp[j + i] += g * gen();   // 指数地落：每个点乘同一个系数，不必每个点算一次 exp
      if ((k & 511) === 511) yield;
    }
    const hp = o.hp && BQ(sr, 'hp', o.hp, 0.7), lp = o.lp && BQ(sr, 'lp', o.lp, 0.7), bp = o.bp && BQ(sr, 'bp', o.bp[0], o.bp[1]), a = o.a ?? 1;
    for (let i = 0; i < tmp.length && i0 + i < out.length; i++) { let x = tmp[i]; if (hp) x = hp.run(x); if (lp) x = lp.run(x); if (bp) x = bp.run(x); out[i0 + i] += a * x; if ((i & 32767) === 32767) yield; }
  }
  // 一串小石子相碰：每一颗是一声很短的、有音高的“嗒”
  function ticks(out, sr, r, o) {
    for (let k = 0; k < o.n; k++) {
      let u; do u = r(); while (o.shape && r() > o.shape(u));
      const f = o.f[0] * Math.pow(o.f[1] / o.f[0], r()), d = U(r, o.dec[0], o.dec[1]);
      modes(out, sr, { t: o.t0 + u * (o.t1 - o.t0), a: (o.a ?? 1) * Math.pow(r(), o.pow ?? 2), modes: [[f, d, 1], [f * U(r, 1.9, 2.7), d * 0.6, 0.4]] });
    }
  }
  // 一个小水泡：一声往上滑的“咕”（越小的泡越高、越短）
  function bubble(out, sr, o) {
    const i0 = Math.round(o.t * sr); if (i0 >= out.length) return;
    const tau = o.tau, n = Math.min(out.length - i0, Math.ceil(tau * 5 * sr)), rise = o.rise ?? 1.6, a = o.a ?? 1, at = 0.0006 * sr;
    let re = 1, im = 0, c = 1, s = 0, g = a;
    const d = Math.exp(-1 / (tau * sr));
    for (let i = 0; i < n; i++) {
      if ((i & 7) === 0) { const w = TAU * o.f * (1 + (rise - 1) * Math.min(1, i / sr / (tau * 2.5))) / sr; c = Math.cos(w); s = Math.sin(w); }
      const nr = re * c - im * s; im = re * s + im * c; re = nr; out[i0 + i] += g * (i < at ? i / at : 1) * im; g *= d;
    }
  }
  // 鸟叫、虫叫的一个音：频率按 f(u) 走（u 从 0 到 1），两头圆滑
  function note(out, sr, o) {
    const i0 = Math.round(o.t * sr); if (i0 >= out.length) return;
    const n = Math.min(out.length - i0, Math.ceil(o.len * sr)), att = o.att ?? 0.2, rel = o.rel ?? 0.35, a = o.a ?? 1, h2 = o.h2 ?? 0.12;
    let ph = 0;
    for (let i = 0; i < n; i++) { const u = i / n; ph += TAU * o.f(u) / sr; const e = Math.sin(Math.PI / 2 * cl(Math.min(u / att, (1 - u) / rel), 0, 1)) ** 2; out[i0 + i] += a * e * (Math.sin(ph) + h2 * Math.sin(2 * ph + 0.5)); }
  }

  // ---- 收尾 ----
  function peak(x) { let m = 0; for (let i = 0; i < x.length; i++) m = Math.max(m, Math.abs(x[i])); return m; }
  function rms(x) { let s = 0; for (let i = 0; i < x.length; i++) s += x[i] * x[i]; return Math.sqrt(s / x.length); }
  function gain(x, k) { for (let i = 0; i < x.length; i++) x[i] *= k; return x; }
  const normPeak = (x, p = 0.9) => gain(x, p / Math.max(peak(x), 1e-9));
  const normRms = (x, v) => gain(x, v / Math.max(rms(x), 1e-9));
  function fadeOut(x, sr, sec = 0.01) { const n = Math.min(x.length, Math.ceil(sec * sr)); for (let i = 0; i < n; i++) x[x.length - 1 - i] *= i / n; return x; }
  function dcBlock(x, sr, f = 20) { const k = Math.exp(-TAU * f / sr); let px = 0, py = 0; for (let i = 0; i < x.length; i++) { const y = x[i] - px + k * py; px = x[i]; py = y; x[i] = y; } return x; }
  // 首尾接好：最后 sec 秒叠到开头上（等功率交叉淡化）再截掉，循环播放时听不出接缝
  function loopable(x, sr, sec) { const L = Math.ceil(sec * sr), n = x.length - L, y = new Float32Array(n); for (let i = 0; i < n; i++) y[i] = i < L ? x[i] * Math.sqrt(i / L) + x[n + i] * Math.sqrt(1 - i / L) : x[i]; return y; }
  const trim = (x, sr, sec) => fadeOut(x.slice(0, Math.min(x.length, Math.ceil(sec * sr))), sr, 0.02);
  const done = (x, sr, p = 0.9) => normPeak(fadeOut(dcBlock(x, sr, 25), sr, 0.02), p);      // 一次性的声音：去直流、末尾淡出、峰值归一（多响由放的时候决定）

  // ============================================================
  //  脚步
  //  一步 = 脚跟落地 + 脚掌落地（走路时隔得开，跑起来几乎连在一起）+ 鞋底蹭了一下地 + 这种地面自己的声音。
  //  主角是个穿靴子的瘦小孩子：分量不重，鞋底是硬的。o: { run 0..1 跑, soft 0..1 蹑着脚, land 0..1 从高处落下（两只脚一起，重）}
  // ============================================================
  const METAL = [[310, 0.12, 0.18], [745, 0.09, 0.18], [1290, 0.07, 0.15], [1960, 0.06, 0.16], [2830, 0.045, 0.12], [4100, 0.03, 0.08]];
  const WOOD = [[220, 0.04, 0.35], [460, 0.03, 0.3], [720, 0.022, 0.22], [1150, 0.016, 0.15], [1800, 0.01, 0.1]];
  // 落地的分量：一下闷的（鞋底拍在地上）+ 一点很低的“咚”。低音只放一点点：笔记本和手机的喇叭放不出 150 赫兹以下，脚步声得靠中高频认出来
  const thud = (out, sr, r, s, t, k, f = 90, lp = 900) => {
    noise(out, sr, r, { t, a: 0.55 * k, lp, hp: 160, att: 0.0012, dec: 0.011, len: 0.07 });
    sine(out, sr, { t, f0: f * 1.3, f1: f * 0.85, len: 0.07, a: 0.06 * k * Math.min(s.heavy, 1.6), att: 0.0015, dec: 0.016 });
  };
  const slap = (out, sr, r, s, t, k, f = 1700) => noise(out, sr, r, { t, a: 0.32 * k * s.bright, bp: [f, 0.9], att: 0.0006, dec: 0.006, len: 0.035 });   // 硬鞋底“啪”的那一下
  const SURF = {
    concrete(out, sr, r, s) {                                     // 水泥地：脆的“嗒”，地上有点砂
      for (const [t, k] of [[0, 1], [s.gap, s.toe]]) { noise(out, sr, r, { t, a: 0.55 * k * s.bright, hp: 1400, lp: 9000, dec: 0.0025, len: 0.02 }); slap(out, sr, r, s, t, k); thud(out, sr, r, s, t, k, 95, 1100); }
      noise(out, sr, r, { t: 0.004, a: 0.07 * (1 + s.run), bp: [2600, 0.8], att: 0.012, dec: 0.03, len: 0.12 });
      grains(out, sr, r, { t0: 0, t1: s.gap + 0.05, n: 5 + (r() * 6 | 0), a: 0.14, dec: [0.0002, 0.0006], hp: 3500 });
    },
    metal(out, sr, r, s) {                                        // 铁板：磕上去“当”的一点余音，松了的地方跟着哐啷一下
      const M = jit(r, METAL, 0.03);
      for (const [t, k] of [[0, 1], [s.gap, s.toe]]) { noise(out, sr, r, { t, a: 0.45 * k * s.bright, hp: 1800, lp: 10000, dec: 0.0018, len: 0.015 }); slap(out, sr, r, s, t, k * 0.8, 2300); thud(out, sr, r, s, t, k * 0.7, 115, 1300); modes(out, sr, { t, a: 0.55 * k, modes: M }); }
      for (let i = 0, n = r() * 3 | 0; i < n; i++) modes(out, sr, { t: s.gap + U(r, 0.012, 0.05), a: U(r, 0.08, 0.2), modes: M.map(([f, t, a]) => [f * 1.37, t * 0.4, a]) });
    },
    wood(out, sr, r, s) {                                         // 木头：空空的“咚”
      const M = jit(r, WOOD, 0.05);
      for (const [t, k] of [[0, 1], [s.gap, s.toe]]) { noise(out, sr, r, { t, a: 0.3 * k * s.bright, hp: 900, lp: 6000, dec: 0.003, len: 0.02 }); slap(out, sr, r, s, t, k, 1300); modes(out, sr, { t, a: 0.6 * k, modes: M }); thud(out, sr, r, s, t, k * 0.6, 105, 800); }
      noise(out, sr, r, { t: 0.01, a: 0.04, bp: [1800, 0.9], att: 0.01, dec: 0.03, len: 0.1 });
    },
    dirt(out, sr, r, s) {                                         // 土路：软的“噗”，土里几颗小石子
      for (const [t, k] of [[0, 1], [s.gap, s.toe]]) { thud(out, sr, r, s, t, k, 82, 700); slap(out, sr, r, s, t, k * 0.55, 1200); }
      grains(out, sr, r, { t0: 0, t1: s.gap + 0.06, n: 8 + (r() * 10 | 0), a: 0.16, dec: [0.0003, 0.0012], bp: [3000, 0.6] });
      noise(out, sr, r, { t: 0.01, a: 0.09, bp: [1300, 0.6], att: 0.015, dec: 0.04, len: 0.14 });
    },
    leaves(out, sr, r, s) {                                       // 干落叶：踩上去一片片碎开，叶子落回去还沙沙两下
      SURF.dirt(out, sr, r, { ...s, heavy: s.heavy * 0.7 });
      const n = Math.round(U(r, 50, 90) * (1 + 0.5 * s.run + s.land));
      grains(out, sr, r, { t0: 0, t1: s.gap + U(r, 0.08, 0.16), n, a: 0.35, pow: 2.2, dec: [0.0002, 0.0009], hp: 1800, lp: 9000, shape: u => Math.exp(-u * 2.2) });
      noise(out, sr, r, { t: 0.02, a: 0.05, bp: [4200, 0.7], att: 0.02, dec: 0.06, len: 0.25 });
    },
    forest(out, sr, r, s) {                                       // 林子里的土路：土上一层不厚的落叶，踩上去碎几片
      SURF.dirt(out, sr, r, s);
      grains(out, sr, r, { t0: 0, t1: s.gap + U(r, 0.06, 0.12), n: Math.round(U(r, 18, 35) * (1 + 0.5 * s.run + s.land)), a: 0.24, pow: 2.2, dec: [0.0002, 0.0008], hp: 1800, lp: 9000, shape: u => Math.exp(-u * 2.5) });
    },
    grass(out, sr, r, s) {                                        // 草地：草叶擦过鞋面的“唰”，底下是软土
      for (const [t, k] of [[0, 1], [s.gap, s.toe * 0.8]]) { thud(out, sr, r, s, t, k * 0.8, 78, 600); slap(out, sr, r, s, t, k * 0.25, 1100); }
      noise(out, sr, r, { t: 0, a: 0.24 * (1 + 0.4 * s.run), hp: 2000, lp: 9000, bp: [3900, 0.6], att: 0.025, dec: 0.05, len: 0.25 });
      grains(out, sr, r, { t0: 0.005, t1: s.gap + 0.08, n: 14 + (r() * 10 | 0), a: 0.12, dec: [0.0003, 0.001], bp: [2600, 0.7] });
    },
    gravel(out, sr, r, s) {                                       // 碎石：一颗颗石子互相磕、滚开
      for (const [t, k] of [[0, 1], [s.gap, s.toe]]) { thud(out, sr, r, s, t, k * 0.8, 88, 700); slap(out, sr, r, s, t, k * 0.3, 1400); }
      const n = Math.round(U(r, 35, 60) * (1 + 0.6 * s.run + s.land));
      ticks(out, sr, r, { t0: 0, t1: s.gap + U(r, 0.07, 0.13), n, a: 0.3, f: [1100, 4800], dec: [0.0008, 0.0025], shape: u => Math.exp(-u * 2) });
      grains(out, sr, r, { t0: 0, t1: s.gap + 0.1, n: Math.round(n * 0.6), a: 0.12, dec: [0.0005, 0.002], bp: [1400, 0.6] });
    },
    sand(out, sr, r, s) {                                         // 沙土：被踩实的“嚓”，很细
      for (const [t, k] of [[0, 1], [s.gap, s.toe]]) thud(out, sr, r, s, t, k * 0.8, 75, 600);
      noise(out, sr, r, { t: 0, a: 0.24, hp: 900, lp: 3200, att: 0.01, dec: 0.045, len: 0.2 });
      grains(out, sr, r, { t0: 0, t1: s.gap + 0.08, n: 70, a: 0.05, dec: [0.0001, 0.0004], hp: 2500, lp: 7000 });
    },
    mud(out, sr, r, s) {                                          // 湿泥：“咕叽”一下，泥里冒几个小泡，抬脚时“啵”的一点吸力
      for (const [t, k] of [[0, 1], [s.gap, s.toe * 0.7]]) {
        thud(out, sr, r, s, t, k * 0.8, 72, 600);
        noise(out, sr, r, { t: t + 0.004, a: 0.45 * k, bp: [900, 2.5], sweep: [900, 320, 0.09], att: 0.006, dec: 0.04, len: 0.16 });
      }
      for (let i = 0, n = 2 + (r() * 4 | 0); i < n; i++) bubble(out, sr, { t: U(r, 0.02, 0.12), f: U(r, 500, 1300), a: U(r, 0.05, 0.12), tau: U(r, 0.006, 0.014) });
      noise(out, sr, r, { t: s.gap + U(r, 0.12, 0.18), a: 0.14, bp: [320, 3], sweep: [320, 900, 0.07], att: 0.02, dec: 0.03, len: 0.12 });
    },
    rock(out, sr, r, s) {                                         // 山洞里湿的岩石：硬的“嗒”，贴着石头一点水声
      for (const [t, k] of [[0, 1], [s.gap, s.toe]]) {
        noise(out, sr, r, { t, a: 0.5 * k * s.bright, hp: 1700, lp: 9000, dec: 0.002, len: 0.015 });
        noise(out, sr, r, { t, a: 0.3 * k, bp: [1100, 1.2], dec: 0.008, len: 0.05 });
        slap(out, sr, r, s, t, k * 0.7, 1900); thud(out, sr, r, s, t, k * 0.7, 105, 900);
        noise(out, sr, r, { t: t + 0.002, a: 0.12 * k, bp: [1700, 1.2], att: 0.002, dec: 0.02, len: 0.08 });
      }
      grains(out, sr, r, { t0: 0, t1: 0.05, n: 3 + (r() * 4 | 0), a: 0.1, dec: [0.0002, 0.0006], hp: 3000 });
    },
    puddle(out, sr, r, s) {                                       // 水洼：水被踩开，一串小水泡，溅起来的水珠落回来
      SURF.dirt(out, sr, r, { ...s, heavy: s.heavy * 0.6, bright: s.bright * 0.5 });
      noise(out, sr, r, { t: 0, a: 0.4, bp: [1700, 0.8], att: 0.002, dec: 0.05, len: 0.25 });
      noise(out, sr, r, { t: s.gap, a: 0.22, bp: [2400, 0.8], att: 0.002, dec: 0.04, len: 0.2 });
      for (let i = 0, n = 4 + (r() * 5 | 0); i < n; i++) bubble(out, sr, { t: U(r, 0, 0.12), f: U(r, 450, 1600), a: U(r, 0.06, 0.16), tau: U(r, 0.008, 0.025), rise: U(r, 1.3, 2.2) });
      for (let i = 0, n = 6 + (r() * 8 | 0); i < n; i++) bubble(out, sr, { t: U(r, 0.08, 0.32), f: U(r, 2000, 4500), a: U(r, 0.015, 0.05), tau: U(r, 0.003, 0.008), rise: 1.4 });
    },
    wade(out, sr, r, s) {                                         // 蹚水（水到小腿）：腿推开水的“哗”，水的分量，很多水泡
      noise(out, sr, r, { t: 0, a: 0.45, bp: [900, 0.7], att: 0.012, dec: 0.08, len: 0.4 });
      noise(out, sr, r, { t: 0.02, a: 0.3, bp: [2200, 0.7], att: 0.006, dec: 0.06, len: 0.32 });
      noise(out, sr, r, { t: 0, a: 0.3, lp: 350, att: 0.03, dec: 0.08, len: 0.32 });
      for (let i = 0, n = 8 + (r() * 8 | 0); i < n; i++) bubble(out, sr, { t: U(r, 0, 0.25), f: U(r, 300, 1300), a: U(r, 0.06, 0.18), tau: U(r, 0.01, 0.03), rise: U(r, 1.3, 2) });
      for (let i = 0, n = 8 + (r() * 8 | 0); i < n; i++) bubble(out, sr, { t: U(r, 0.12, 0.42), f: U(r, 1800, 4200), a: U(r, 0.015, 0.05), tau: U(r, 0.003, 0.008), rise: 1.4 });
    },
  };
  function step(sr, r, kind, o = {}) {
    const run = o.run ?? 0, land = o.land ?? 0, soft = o.soft ?? 0, out = buf(sr, 0.5 + 0.25 * land);
    const s = { run, land, soft,
      gap: land ? U(r, 0.01, 0.028) : mix(U(r, 0.07, 0.1), U(r, 0.022, 0.04), run),        // 脚跟到脚掌隔多久
      toe: land ? U(r, 0.75, 0.95) : mix(0.62, 0.38, run) * U(r, 0.8, 1.15),                // 脚掌那一下有多重
      heavy: (1 + 0.45 * run + 1.3 * land) * (1 - 0.5 * soft),                               // 落地的分量
      bright: (1 + 0.25 * run + 0.2 * land) * (1 - 0.55 * soft) };                           // 磕地那一下有多脆
    (SURF[kind] ?? SURF.concrete)(out, sr, r, s);
    if (land) noise(out, sr, r, { t: 0.012, a: 0.1 * land, bp: [1300, 0.6], att: 0.012, dec: 0.05, len: 0.25 });   // 衣服跟着一抖
    return done(out, sr);
  }

  // ============================================================
  //  呼吸
  //  气声：噪声经过口腔的几个共振峰（小孩的，比大人高）；吸气窄一些、嘶嘶声多，呼气张着嘴像“哈”。
  //  o: { dir 'in' | 'out', len 秒, k 0..1 用力（累）的程度, voice 0..1 带多少嗓音, nose 0..1 闭着嘴用鼻子, att / rel 起、落各占多少, f0 嗓音的音高 }
  // ============================================================
  function breath(sr, r, o) {
    const len = o.len, k = o.k ?? 0.5, inh = o.dir === 'in', out = buf(sr, len + 0.02), N = Math.floor(len * sr);
    const F = inh ? [[1000, 2.2, 0.55], [1850, 3, 0.75], [3200, 3.5, 1], [4700, 3, 0.75]] : [[860, 2, 1], [1560, 2.8, 0.8], [2950, 3.5, 0.55], [4400, 3, 0.3]];
    const sh = U(r, 0.94, 1.06), fs = F.map(([f, q]) => BQ(sr, 'bp', f * sh, q)), nl = BQ(sr, 'lp', inh ? 1700 : 1100, 0.9), nb = BQ(sr, 'bp', inh ? 3600 : 2800, 1.2), hp = BQ(sr, 'hp', 160, 0.7);
    const pink = pinkGen(r), white = whiteGen(r), flut = wander(sr, r, 28), slow = wander(sr, r, 3.2), vib = wander(sr, r, 6);
    const att = o.att ?? (inh ? mix(0.42, 0.3, k) : mix(0.16, 0.1, k)), rel = o.rel ?? (inh ? 0.22 : mix(0.62, 0.5, k));
    const swp = inh ? 1.07 : 0.96, voice = o.voice ?? 0, nose = o.nose ?? 0, f0b = (o.f0 ?? (inh ? 430 : 300)) * U(r, 0.95, 1.05);
    let gph = 0, gPrev = 0;
    for (let i = 0; i < N; i++) {
      const u = i / N;
      const e = (u < att ? Math.sin(Math.PI / 2 * u / att) ** 2 : u > 1 - rel ? Math.sin(Math.PI / 2 * (1 - u) / rel) ** 2 : 1) * (1 + 0.2 * flut() + 0.08 * slow());   // 一口气的形状，气流本身是抖的
      if ((i & 31) === 0) for (let j = 0; j < 4; j++) fs[j].set(F[j][0] * sh * mix(1, swp, u), F[j][1]);
      let src = 0.65 * pink() + 0.35 * white();
      if (voice > 0) {                                            // 嗓音：声门一开一合的脉冲（用它的变化量当激励），只在一口气的中段；带嗓音时气声也跟着一开一合
        const f0 = f0b * (1 + (inh ? 0.12 : -0.08) * u) * (1 + 0.025 * vib());
        gph += f0 / sr; if (gph >= 1) gph -= 1;
        const g = gph < 0.4 ? 0.5 - 0.5 * Math.cos(Math.PI * gph / 0.4) : gph < 0.56 ? Math.cos(Math.PI / 2 * (gph - 0.4) / 0.16) : 0;
        const v = (g - gPrev) * (sr / f0) * 0.12, ve = voice * Math.sin(Math.PI * u) ** 2 * (0.5 + 0.5 * k); gPrev = g;
        src = src * (1 - 0.5 * ve * (1 - g)) + v * ve * 2.2;
      }
      let y = 0; for (let j = 0; j < 4; j++) y += F[j][2] * fs[j].run(src);
      if (nose > 0) y = mix(y, 1.6 * nl.run(src) + 0.5 * nb.run(white()) * (inh ? 1 : 0.6), nose);   // 鼻息：低处闷闷的一团 + 鼻孔里一点嘶嘶声
      out[i] = hp.run(y) * e;
    }
    return normPeak(fadeOut(out, sr, 0.01), 0.9);
  }

  // ============================================================
  //  环境的底子（循环用）：风吹树叶、流水、蟋蟀、喷灌头
  // ============================================================
  // 风吹树叶：沙沙的一层 + 叶子互相碰的细碎声；一阵一阵。dry 0 = 嫩叶（软，“唰唰”），1 = 枯叶（脆，“沙啦啦”）
  function rustle(sr, r, o = {}) {
    const len = o.len ?? 7, dry = o.dry ?? 0.5, out = buf(sr, len + 0.6), white = whiteGen(r), m1 = wander(sr, r, 0.7), m2 = wander(sr, r, 3), m3 = wander(sr, r, 11);
    const hp = BQ(sr, 'hp', 700, 0.6), lp = BQ(sr, 'lp', mix(4200, 7500, dry), 0.6), cr = [BQ(sr, 'bp', 2300, 1.2), BQ(sr, 'bp', 4100, 1.4), BQ(sr, 'bp', 6800, 1.5)];
    const dens = mix(160, 900, dry) / sr, g = [0, 0, 0], gd = [0, 0, 0];
    for (let i = 0; i < out.length; i++) {
      const a = cl(0.55 + 0.35 * m1() + 0.12 * m2() + 0.06 * m3(), 0.05, 1.2);
      let x = lp.run(hp.run(white())) * a * a * mix(1.0, 0.55, dry);
      for (let j = 0; j < 3; j++) {
        if (r() < dens * a * a * (j === 2 ? 0.6 : 1)) { g[j] = Math.pow(r(), 2.5) * (j ? 0.8 : 1); gd[j] = Math.exp(-1 / (sr * U(r, 0.0002, 0.0012))); }
        x += cr[j].run(white() * g[j]) * mix(0.6, 1.4, dry); g[j] *= gd[j]; if (g[j] < 1e-6) g[j] = 0;
      }
      out[i] = x;
    }
    const y = normRms(loopable(out, sr, 0.6), 0.18); for (let i = 0; i < y.length; i++) y[i] = 0.5 * Math.tanh(y[i] / 0.5);
    return normRms(y, 0.18);
  }
  // 流水：很多个小水泡（每个“咕”一声往上滑）+ 一层哗哗的底子。lo / hi 水泡的音高范围，rate 每秒多少个
  function babble(sr, r, o = {}) {
    const len = o.len ?? 7, out = buf(sr, len + 0.5), rate = o.rate ?? 260, lo = o.lo ?? 350, hi = o.hi ?? 2600, white = whiteGen(r), bp = BQ(sr, 'bp', 700, 0.6), lp = BQ(sr, 'lp', 380, 0.7), m = wander(sr, r, 2);
    for (let i = 0; i < out.length; i++) { const w = white(); out[i] = (0.35 * bp.run(w) + 0.5 * lp.run(w)) * (0.8 + 0.2 * m()); }
    for (let t = 0; t < len + 0.4; t += -Math.log(1 - r() * 0.999) / rate) {
      const f = lo * Math.pow(hi / lo, Math.pow(r(), 1.6));
      bubble(out, sr, { t, f, a: U(r, 0.2, 1) * Math.pow(lo / f, 0.3) * 0.5, tau: cl(0.9 / f, 0.002, 0.02) * U(r, 0.7, 1.4), rise: U(r, 1.2, 1.9) });
    }
    return normRms(loopable(out, sr, 0.5), 0.15);
  }
  // 一片蟋蟀：每一只隔一会儿“唧唧唧”一串（每串三五下），音高、快慢、远近各不相同
  function crickets(sr, r, o = {}) {
    const len = o.len ?? 9, out = buf(sr, len + 0.6), n = o.n ?? 7;
    for (let c = 0; c < n; c++) {
      const f = U(r, 3900, 5300), per = U(r, 0.45, 1.2), pulses = 3 + (r() * 3 | 0), pr = U(r, 28, 46), pl = U(r, 0.009, 0.016), a = U(r, 0.25, 1) ** 2;
      for (let t = U(r, 0, per); t < len + 0.5; t += per * U(r, 0.92, 1.08)) {
        if (r() < 0.12) continue;                                 // 偶尔歇一下
        for (let p = 0; p < pulses; p++) note(out, sr, { t: t + p / pr, len: pl, a: a * (p ? 1 : 0.7), h2: 0.05, att: 0.3, rel: 0.4, f: () => f });
      }
    }
    return normRms(loopable(out, sr, 0.5), 0.12);
  }
  // 喷灌头：一直“嘶——”地喷，转着的那一种还一下下“嚓嚓嚓”
  function sprinkler(sr, r) {
    const len = 6, out = buf(sr, len + 0.4), white = whiteGen(r), hp = BQ(sr, 'hp', 2500, 0.7), bp = BQ(sr, 'bp', 6000, 0.5), w = wander(sr, r, 1.5);
    for (let i = 0; i < out.length; i++) out[i] = 0.5 * bp.run(hp.run(white())) * (0.8 + 0.2 * w());
    for (let t = 0.05; t < len + 0.3; t += 1 / U(r, 6.5, 7.5)) noise(out, sr, r, { t, a: 0.6, hp: 2000, bp: [4500, 1], att: 0.002, dec: 0.012, len: 0.05 });
    return normRms(loopable(out, sr, 0.4), 0.1);
  }

  // ============================================================
  //  鸟、虫
  // ============================================================
  function songbird(sr, r, o = {}) {                              // 一只小鸟叫一句（四种叫法）
    const type = o.type ?? (r() * 4 | 0), out = buf(sr, 2.4);
    let t = 0.02;
    if (type === 0) {                                             // 一串颤音：同一个短音很快地重复
      const n = 7 + (r() * 9 | 0), f0 = U(r, 4200, 5800), d = U(r, 0.045, 0.065), drop = U(r, 0.25, 0.4);
      for (let i = 0; i < n; i++, t += d) note(out, sr, { t, len: d * 0.7, a: Math.sin(Math.PI * (i + 1) / (n + 1)) ** 0.5, f: u => f0 * (1 - drop * u) });
    } else if (type === 1) {                                      // 两个音一组，重复几遍（“嘀—啾”）
      const n = 2 + (r() * 3 | 0), fa = U(r, 3600, 4600), fb = fa * U(r, 0.68, 0.8);
      for (let i = 0; i < n; i++) { note(out, sr, { t, len: 0.09, f: u => fa * (1 + 0.04 * u) }); note(out, sr, { t: t + 0.13, len: 0.11, f: u => fb * (1 - 0.1 * u) }); t += U(r, 0.3, 0.36); }
    } else if (type === 2) {                                      // 几声往上挑的短叫
      for (let i = 0, n = 2 + (r() * 4 | 0); i < n; i++) { const f = U(r, 2800, 4200), k = U(r, 1.2, 1.45); note(out, sr, { t, len: U(r, 0.05, 0.08), f: u => f * (1 + (k - 1) * u) }); t += U(r, 0.09, 0.2); }
    } else {                                                      // 一句婉转的：高低起伏，有的音带一点颤
      for (let i = 0, n = 4 + (r() * 5 | 0); i < n; i++) {
        const f = U(r, 2600, 5200), g = U(r, 0.75, 1.3), v = r() < 0.4 ? U(r, 25, 45) : 0, len = U(r, 0.06, 0.16);
        note(out, sr, { t, len, f: u => f * (1 + (g - 1) * u) * (1 + (v ? 0.06 * Math.sin(TAU * v * u * len) : 0)) }); t += len + U(r, 0.02, 0.07);
      }
    }
    return done(trim(out, sr, t + 0.1), sr);
  }
  function coo(sr, r, o = {}) {                                   // 斑鸠“咕—咕咕—咕”（低、软，带一点气）；pigeon：鸽子，更低，喉咙里打着滚
    const pg = !!o.pigeon, out = buf(sr, 2.2), f0 = pg ? U(r, 340, 400) : U(r, 480, 560), white = whiteGen(r), lp = BQ(sr, 'lp', 900, 0.7);
    const pat = pg ? [[0, 0.5], [0.62, 0.35]] : [[0, 0.32], [0.45, 0.55], [1.12, 0.36]];
    for (const [t, len] of pat) {
      note(out, sr, { t, len, a: 0.8, h2: 0.28, att: 0.3, rel: 0.45, f: u => f0 * (1.02 - 0.06 * u) * (pg ? 1 + 0.03 * Math.sin(TAU * 26 * u * len) : 1) });
      const i0 = Math.round(t * sr), n = Math.round(len * sr); for (let i = 0; i < n; i++) out[i0 + i] += 0.05 * lp.run(white()) * Math.sin(Math.PI * i / n);
    }
    return done(trim(out, sr, pg ? 1.1 : 1.6), sr);
  }
  function crow(sr, r) {                                          // 乌鸦“呱——”：粗哑。很多谐波 + 一点噪声，过两三个共振峰；音高先往上再往下
    const n = 1 + (r() * 3 | 0), out = buf(sr, n * 0.7 + 0.3), white = whiteGen(r);
    const fA = BQ(sr, 'bp', 1250 * U(r, 0.9, 1.1), 3), fB = BQ(sr, 'bp', 2500 * U(r, 0.9, 1.1), 4), fC = BQ(sr, 'bp', 700, 2);
    let t = 0.02;
    for (let c = 0; c < n; c++) {
      const len = U(r, 0.26, 0.36), f0 = U(r, 480, 600), i0 = Math.round(t * sr), N = Math.round(len * sr); let ph = 0;
      for (let i = 0; i < N; i++) {
        const u = i / N, f = f0 * (u < 0.25 ? 1 + u : 1.25 - 0.4 * (u - 0.25) / 0.75); ph += f / sr; ph -= Math.floor(ph);
        const src = (bsaw(ph, 12) * 0.8 + 0.45 * white()) * (1 + 0.5 * Math.sin(TAU * 70 * i / sr)), e = Math.min(1, u / 0.08) * Math.pow(1 - u, 0.7);
        out[i0 + i] += e * (fA.run(src) + 0.6 * fB.run(src) + 0.5 * fC.run(src));
      }
      t += len + U(r, 0.22, 0.34);
    }
    return done(trim(out, sr, t), sr);
  }
  function woodpecker(sr, r) {                                    // 啄木鸟：一阵很快的“笃笃笃”，越来越弱
    const n = 12 + (r() * 10 | 0), rate = U(r, 15, 19), out = buf(sr, n / rate * 1.3 + 0.2), M = jit(r, [[1150, 0.006, 1], [2350, 0.004, 0.55], [3700, 0.0025, 0.3]], 0.05);
    for (let i = 0; i < n; i++) { const t = 0.01 + i / rate * (1 + 0.012 * i), a = (1 - 0.7 * i / n) * U(r, 0.85, 1); modes(out, sr, { t, a, modes: M }); noise(out, sr, r, { t, a: 0.25 * a, hp: 2500, dec: 0.0008, len: 0.006 }); }
    return done(out, sr);
  }
  function bee(sr, r) {                                           // 一只蜜蜂嗡嗡地飞过去：音高微微抖，过来的时候高一点、走的时候低一点
    const len = U(r, 1.4, 2.2), out = buf(sr, len), f0 = U(r, 200, 240), w = wander(sr, r, 5), lp = BQ(sr, 'lp', 2200, 0.7); let ph = 0;
    for (let i = 0, N = out.length; i < N; i++) {
      const u = i / N; ph += f0 * (1 + 0.035 * (0.5 - u)) * (1 + 0.025 * w()) / sr; ph -= Math.floor(ph);
      out[i] = lp.run(bsaw(ph, 10)) * Math.sin(Math.PI * u) ** 2 * (1 + 0.15 * Math.sin(TAU * 18 * i / sr));
    }
    return done(out, sr);
  }
  function owl(sr, r) {                                           // 猫头鹰“呼——，呼呼”
    const out = buf(sr, 2), f0 = U(r, 360, 400), white = whiteGen(r), lp = BQ(sr, 'lp', 700, 0.7);
    for (const [t, len, k] of [[0, 0.5, 1], [0.85, 0.22, 0.85], [1.15, 0.4, 0.9]]) {
      note(out, sr, { t, len, a: k * 0.7, h2: 0.08, att: 0.25, rel: 0.5, f: u => f0 * (1 + 0.04 * Math.sin(Math.PI * u)) });
      const i0 = Math.round(t * sr), n = Math.round(len * sr); for (let i = 0; i < n; i++) out[i0 + i] += 0.06 * k * lp.run(white()) * Math.sin(Math.PI * i / n);
    }
    return done(out, sr);
  }

  // ============================================================
  //  远处的、偶尔一下的声音（每一章一组，见 52-audio.js 的 FAR）
  // ============================================================
  function clank(sr, r) {                                         // 远处一声铁器相撞：低的几个音拖得长
    const out = buf(sr, 1.6), M = jit(r, [[170, 0.45, 0.5], [415, 0.32, 0.4], [860, 0.22, 0.28], [1390, 0.15, 0.18], [2210, 0.1, 0.1], [3300, 0.06, 0.05]], 0.08);
    noise(out, sr, r, { t: 0, a: 0.5, lp: 3000, dec: 0.006, len: 0.04 }); modes(out, sr, { t: 0, a: 0.8, modes: M });
    if (r() < 0.5) modes(out, sr, { t: U(r, 0.12, 0.3), a: U(r, 0.2, 0.4), modes: M });
    return done(out, sr);
  }
  function chain(sr, r) {                                         // 铁链晃了一下：几声细碎的“叮铃”
    const out = buf(sr, 1.0);
    for (let t = 0.01, i = 0, n = 6 + (r() * 6 | 0); i < n; i++, t += U(r, 0.03, 0.12)) modes(out, sr, { t, a: U(r, 0.3, 1), modes: jit(r, [[1900, 0.03, 1], [3100, 0.02, 0.6], [4600, 0.012, 0.3]], 0.1) });
    return done(out, sr);
  }
  function steam(sr, r) {                                         // 管子泄了一口气：“嗤——”
    const out = buf(sr, 1.4);
    noise(out, sr, r, { t: 0, a: 1, hp: 1200, bp: [3500, 0.5], att: 0.06, dec: 0.35, len: 1.3 }); noise(out, sr, r, { t: 0, a: 0.4, lp: 400, att: 0.05, dec: 0.3, len: 1.2 });
    return done(out, sr);
  }
  function creak(sr, r) {                                         // “吱——”：一下下很密的摩擦（快慢在变），每一下敲响铁皮 / 木头的几个音
    const len = U(r, 0.7, 1.4), out = buf(sr, len + 0.15), M = jit(r, [[340, 0.02, 1], [790, 0.014, 0.6], [1420, 0.01, 0.35], [2300, 0.007, 0.2]], 0.1), p1 = r(), p2 = r();
    for (let t = 0; t < len;) { const u = t / len; modes(out, sr, { t, a: 0.3 * Math.sin(Math.PI * u) ** 0.7 * U(r, 0.7, 1), modes: M }); t += 1 / (38 + 18 * Math.sin(TAU * (0.6 * u + p1)) + 9 * Math.sin(TAU * (2.1 * u + p2))); }
    return done(out, sr);
  }
  function rattle(sr, r) {                                        // 风刮得铁皮哐哐响：几下很快的磕碰
    const out = buf(sr, 1.3), M = jit(r, [[520, 0.06, 0.6], [1280, 0.04, 0.45], [2450, 0.025, 0.3], [3900, 0.015, 0.15]], 0.06);
    for (let t = 0.01, i = 0, n = 3 + (r() * 8 | 0); i < n; i++, t += U(r, 0.03, 0.11)) { modes(out, sr, { t, a: U(r, 0.3, 1), modes: M }); noise(out, sr, r, { t, a: 0.3, hp: 1500, dec: 0.002, len: 0.01 }); }
    return done(out, sr);
  }
  function twig(sr, r) {                                          // 一根枯枝“咔”地断了
    const out = buf(sr, 0.3), M = [[U(r, 1500, 2200), 0.01, 1], [U(r, 2900, 3800), 0.006, 0.6]];
    noise(out, sr, r, { t: 0, a: 0.6, hp: 1400, dec: 0.003, len: 0.02 }); modes(out, sr, { t: 0, a: 0.5, modes: M });
    noise(out, sr, r, { t: U(r, 0.025, 0.05), a: 0.25, hp: 1800, dec: 0.002, len: 0.015 });
    return done(out, sr);
  }
  function chime(sr, r) {                                         // 广播前的提示音“叮——咚——”
    const out = buf(sr, 3);
    for (const [t, f] of [[0, 659.3], [0.55, 523.3]]) { sine(out, sr, { t, f0: f, len: 2.2, a: 0.5, att: 0.006, dec: 0.6, h2: 0.25 }); sine(out, sr, { t, f0: f * 3.01, len: 0.8, a: 0.08, att: 0.004, dec: 0.15 }); }
    return done(out, sr);
  }
  function shutter(sr, r) {                                       // 远处一扇卷帘门拉下来：一长串很密的铁皮磕碰，最后“哐”一下
    const len = U(r, 0.9, 1.5), out = buf(sr, len + 0.9), M = jit(r, [[380, 0.03, 0.5], [920, 0.025, 0.4], [1700, 0.02, 0.3], [2900, 0.012, 0.15]], 0.05);
    for (let t = 0; t < len; t += U(r, 0.018, 0.032)) modes(out, sr, { t, a: 0.15 * U(r, 0.5, 1), modes: M });
    modes(out, sr, { t: len, a: 0.8, modes: jit(r, [[140, 0.25, 0.6], [330, 0.18, 0.4], [700, 0.12, 0.25]], 0.05) });
    return done(out, sr);
  }
  function knock(sr, r) {                                         // 管子里“咚”的一声（水锤）
    const out = buf(sr, 0.9), M = jit(r, [[190, 0.14, 0.7], [480, 0.09, 0.4], [930, 0.05, 0.2], [1600, 0.03, 0.1]], 0.06);
    noise(out, sr, r, { t: 0, a: 0.3, lp: 1500, dec: 0.006, len: 0.03 }); modes(out, sr, { t: 0, a: 0.8, modes: M });
    if (r() < 0.6) modes(out, sr, { t: U(r, 0.12, 0.2), a: 0.35, modes: M });
    return done(out, sr);
  }
  function zap(sr, r) {                                           // 电线打火：一串很碎的噼啪 + 一下 100 赫兹的嗡
    const out = buf(sr, 0.7);
    grains(out, sr, r, { t0: 0, t1: U(r, 0.15, 0.35), n: 25 + (r() * 30 | 0), a: 0.8, dec: [0.0001, 0.0005], hp: 2000, pow: 1.5 });
    for (let i = 0, n = Math.round(0.3 * sr); i < n; i++) out[i] += 0.12 * bsaw(100 * i / sr, 20) * Math.exp(-i / (0.08 * sr));
    return done(out, sr);
  }
  function relay(sr, r) {                                         // 继电器“咔哒”
    const out = buf(sr, 0.2);
    for (const [t, a] of [[0, 1], [U(r, 0.04, 0.07), 0.5]]) { noise(out, sr, r, { t, a: 0.6 * a, hp: 2500, dec: 0.0008, len: 0.005 }); modes(out, sr, { t, a: 0.3 * a, modes: [[U(r, 2200, 2800), 0.006, 1], [U(r, 4800, 5600), 0.003, 0.5]] }); }
    return done(out, sr);
  }
  function hum2(sr, r) {                                          // 远处一台机器转起来又停下：低低的“嗡——”
    const len = U(r, 1.6, 2.6), out = buf(sr, len), f = U(r, 70, 110); let ph = 0;
    for (let i = 0, N = out.length; i < N; i++) { const u = i / N; ph += f * (0.9 + 0.2 * Math.sin(Math.PI * u)) / sr; ph -= Math.floor(ph); out[i] = bsaw(ph, 8) * Math.sin(Math.PI * u) ** 2; }
    return done(out, sr);
  }
  function pebbles(sr, r) {                                       // 几颗小石子从岩壁上滚下来：一下下弹跳，越来越快、越来越轻
    const out = buf(sr, 1.4); let t = 0.01, gap = U(r, 0.16, 0.24), a = 1;
    for (let i = 0, n = 4 + (r() * 5 | 0); i < n; i++) { ticks(out, sr, r, { t0: t, t1: t + 0.01, n: 1 + (r() * 2 | 0), a, f: [1400, 3800], dec: [0.003, 0.008], pow: 0.5 }); t += gap; gap *= U(r, 0.6, 0.8); a *= U(r, 0.6, 0.85); }
    return done(out, sr);
  }
  function rumble(sr, r) {                                        // 很远很深的一阵隆隆
    const len = U(r, 2, 3.2), out = buf(sr, len), b = brownGen(r), lp = BQ(sr, 'lp', 110, 0.7), lp2 = BQ(sr, 'lp', 110, 0.7);
    for (let i = 0, N = out.length; i < N; i++) out[i] = lp2.run(lp.run(b())) * Math.sin(Math.PI * i / N) ** 1.5;
    return done(out, sr);
  }
  function plop(sr, r) {                                          // 有什么掉进了水里
    const out = buf(sr, 0.5);
    bubble(out, sr, { t: 0.002, f: U(r, 350, 700), a: 0.7, tau: U(r, 0.03, 0.06), rise: 1.8 }); noise(out, sr, r, { t: 0, a: 0.25, bp: [1100, 0.8], dec: 0.04, len: 0.2 });
    for (let i = 0; i < 4; i++) bubble(out, sr, { t: U(r, 0.06, 0.25), f: U(r, 1500, 3500), a: 0.08, tau: 0.006, rise: 1.4 });
    return done(out, sr);
  }
  function gurgle(sr, r) {                                        // 管子里的水“咕噜咕噜”
    const out = buf(sr, 1.0);
    for (let i = 0, n = 12 + (r() * 12 | 0); i < n; i++) bubble(out, sr, { t: U(r, 0, 0.7), f: U(r, 180, 600), a: U(r, 0.2, 0.6), tau: U(r, 0.02, 0.05), rise: U(r, 1.3, 1.9) });
    return done(out, sr);
  }
  function drip(sr, r, o = {}) {                                  // 一滴水落进水里：“叮”的一下往上滑
    const out = buf(sr, 0.25), f = U(r, 1100, 2800) * (o.k ?? 1);
    noise(out, sr, r, { t: 0, a: 0.15, hp: 3000, dec: 0.0006, len: 0.004 }); bubble(out, sr, { t: 0.001, f, a: 0.7, tau: U(r, 0.012, 0.03), rise: U(r, 1.5, 2.3) });
    return done(out, sr);
  }

  // ============================================================
  //  水里
  // ============================================================
  function stroke(sr, r, o = {}) {                                // 划一下水：在水面上“哗”，在水下闷闷的“呼”
    const out = buf(sr, 0.6);
    if (o.under) { noise(out, sr, r, { t: 0, a: 0.6, lp: 500, att: 0.08, dec: 0.12, len: 0.5, pink: true }); for (let i = 0; i < 3; i++) bubble(out, sr, { t: U(r, 0.05, 0.3), f: U(r, 200, 500), a: 0.2, tau: 0.03, rise: 1.4 }); }
    else {
      noise(out, sr, r, { t: 0, a: 0.4, bp: [1100, 0.7], att: 0.05, dec: 0.1, len: 0.5 }); noise(out, sr, r, { t: 0.05, a: 0.25, bp: [2600, 0.8], att: 0.03, dec: 0.08, len: 0.4 });
      for (let i = 0, n = 3 + (r() * 4 | 0); i < n; i++) bubble(out, sr, { t: U(r, 0.02, 0.25), f: U(r, 500, 1500), a: U(r, 0.05, 0.12), tau: U(r, 0.008, 0.02), rise: 1.6 });
      for (let i = 0; i < 5; i++) bubble(out, sr, { t: U(r, 0.1, 0.45), f: U(r, 2000, 4200), a: 0.03, tau: 0.004, rise: 1.4 });
    }
    return done(out, sr);
  }
  function blub(sr, r) {                                          // 嘴边冒出一个气泡（在水下听到的）
    const out = buf(sr, 0.15); bubble(out, sr, { t: 0.002, f: U(r, 250, 600), a: 0.8, tau: U(r, 0.015, 0.03), rise: 1.5 }); return done(out, sr);
  }
  function heart(sr, r) {                                         // 心跳“咚—咚”
    const out = buf(sr, 0.5); sine(out, sr, { t: 0, f0: 62, f1: 44, len: 0.14, a: 1, att: 0.004, dec: 0.04 }); sine(out, sr, { t: 0.24, f0: 55, f1: 40, len: 0.12, a: 0.65, att: 0.004, dec: 0.035 }); return done(out, sr);
  }
  function splash(sr, r, o = {}) {                                // 掉进水里：一大把水花，水下翻起一团气泡
    const k = o.k ?? 1, out = buf(sr, 1.0);
    noise(out, sr, r, { t: 0, a: 0.6, bp: [900, 0.7], att: 0.003, dec: 0.12 * k, len: 0.7 }); noise(out, sr, r, { t: 0.01, a: 0.4, bp: [2500, 0.8], att: 0.003, dec: 0.08, len: 0.5 });
    noise(out, sr, r, { t: 0, a: 0.4, lp: 300, att: 0.004, dec: 0.06, len: 0.3 });
    for (let i = 0, n = Math.round(8 + 12 * k); i < n; i++) bubble(out, sr, { t: U(r, 0.01, 0.35), f: U(r, 300, 1600), a: U(r, 0.06, 0.2), tau: U(r, 0.01, 0.035), rise: U(r, 1.3, 2.1) });
    for (let i = 0, n = Math.round(8 + 10 * k); i < n; i++) bubble(out, sr, { t: U(r, 0.15, 0.7), f: U(r, 1800, 4500), a: U(r, 0.02, 0.06), tau: U(r, 0.003, 0.008), rise: 1.4 });
    return done(out, sr);
  }

  // ============================================================
  //  路边的植物被拨开（48-brush.js）：清脆的“沙啦”（2026-11-14 用户从四种听感里挑的 B）
  //  kind：leaf 大叶子 / grass 高草 / fern 蕨 / branch 小树枝；dry 0 嫩叶、1 枯叶
  //  ev：rub 被推着、贴着身子擦过去时一直响的那一段（循环用；多响由推得多快决定）/ back 一松开，叶子弹回去轻轻“唰”一下 / drop 枝条上抖落几片叶子
  //  brushSteps 一层一层地算，算完一层停一下：游戏里每一帧只算一两层，主角走近植物的时候不会卡一下。brush 一口气算完（检查脚本、声音样板页用）
  // ============================================================
  // 一个鼓包（线性地起、指数地落）叠到 x[i0..i0+m) 上：落的那一段每个点乘同一个系数，不必每个点都算一次 exp
  function decay(x, i0, m, a, at, dc) {
    const ia = Math.min(m, Math.ceil(at)), k = Math.exp(-1 / dc);
    for (let i = 0; i < ia; i++) x[i0 + i] += a * (i / at);
    for (let i = ia, g = a * Math.exp(-(ia - at) / dc); i < m; i++, g *= k) x[i0 + i] += g;
  }
  // 擦的声音：一串软的小鼓包（每个 att 起、dec 落）当包络，乘上一段滤过的噪声。rate 每秒几个 / floor 包络底下垫多少（连着不断的那一层）/
  // t0..t1 鼓包出现在哪一段，shape(u) 前密后疏
  function* puffs(out, sr, r, o) {
    const n = out.length, env = new Float32Array(n), gen = o.pink ? pinkGen(r) : whiteGen(r), t0 = o.t0 ?? 0, t1 = o.t1 ?? n / sr, fl = o.floor ?? 0;
    for (let t = t0 + U(r, 0, 1 / o.rate); t < t1; t += -Math.log(1 - r() * 0.999) / o.rate) {
      if (o.shape && r() > o.shape((t - t0) / (t1 - t0))) continue;
      const i0 = Math.floor(t * sr), a = Math.pow(r(), o.pow ?? 1.5), at = Math.max(1, U(r, o.att[0], o.att[1]) * sr), dc = U(r, o.dec[0], o.dec[1]) * sr, m = Math.min(n - i0, Math.ceil(at + dc * 5));
      decay(env, i0, m, a, at, dc);
    }
    yield;
    const hp = o.hp && BQ(sr, 'hp', o.hp, 0.7), lp = o.lp && BQ(sr, 'lp', o.lp, 0.7), bp = o.bp && BQ(sr, 'bp', o.bp[0], o.bp[1]), a = o.a ?? 1, i0 = Math.round(t0 * sr), i1 = o.floorEnd ? Math.round(o.floorEnd * sr) : n;
    for (let i = 0; i < n; i++) { let x = gen() * (env[i] + (i >= i0 && i < i1 ? fl : 0)); if (hp) x = hp.run(x); if (lp) x = lp.run(x); if (bp) x = bp.run(x); out[i] += a * x; if ((i & 32767) === 32767) yield; }   // 先乘包络再滤波：鼓包起得再快，也不会漏出低音
  }
  // 一片叶子从袖子上滑开、拍回去：很短的“嗒”（叶片自己的一两个音）+ 一点擦的噪声
  function* flicks(out, sr, r, o) {
    const tmp = new Float32Array(out.length), gen = whiteGen(r);
    for (let k = 0; k < o.n; k++) {
      let u; do u = r(); while (o.shape && r() > o.shape(u));
      const t = o.t0 + u * (o.t1 - o.t0), a = (o.a ?? 1) * Math.pow(r(), o.pow ?? 1.4), f = o.f[0] * Math.pow(o.f[1] / o.f[0], r()), d = U(r, o.dec[0], o.dec[1]);
      modes(out, sr, { t, a: 0.6 * a, modes: [[f, d, 1], [f * U(r, 1.6, 2.4), d * 0.5, 0.35]] });
      const j = Math.round(t * sr), at = 0.0004 * sr, dc = U(r, 0.0015, 0.004) * sr, m = Math.min(tmp.length - j, Math.ceil(at + dc * 5));
      for (let i = 0; i < m; i++) tmp[j + i] += 0.5 * a * gen() * (i < at ? i / at : Math.exp(-(i - at) / dc));
    }
    yield;
    const hp = BQ(sr, 'hp', o.hp ?? 1800, 0.7), lp = BQ(sr, 'lp', o.lp ?? 9000, 0.7);
    for (let i = 0; i < out.length; i++) { out[i] += lp.run(hp.run(tmp[i])); if ((i & 32767) === 32767) yield; }
  }
  // 挑定的听感：puff 擦的那一层 / floor 连着的底子 / att 鼓包起得快慢 / hp、lp 频带整体往上挪 / crack 脆的碎响（这一种的主角）/
  // body 叶片扇动的“呼” / flick 偶尔一片拍开的“嗒”
  const BMIX = { puff: 0.6, floor: 0.1, att: 0.8, hp: 1.2, lp: 1.1, crack: 1.7, body: 0.2, flick: 0.12 };
  // 四种植物：hp、lp 擦的频带 / rate 每秒几个鼓包，att、dec 每个多长 / cr [嫩, 枯] 每秒多少下脆响，crHp 脆响多高 / body 叶片扇动的分量，bodyLp 多低 /
  // scrape 树枝每秒刮几下 / fl 一片片“嗒”的音高，fn 每秒几下 / sw 弹回去那一下“唰”从多高滑到多低，bd 拖多长
  const BKIND = {
    leaf: { hp: 800, lp: 5200, rate: 26, att: [0.003, 0.009], dec: [0.015, 0.04], cr: [40, 260], crHp: 2000, body: 0.55, bodyLp: 950, scrape: 0, fl: [1100, 3000], fn: 12, sw: [2000, 900], bd: 0.11 },
    grass: { hp: 2400, lp: 10500, rate: 90, att: [0.001, 0.003], dec: [0.004, 0.014], cr: [70, 420], crHp: 3000, body: 0.08, bodyLp: 1700, scrape: 0, fl: [2600, 5600], fn: 30, sw: [6000, 3200], bd: 0.06 },
    fern: { hp: 1300, lp: 7200, rate: 60, att: [0.002, 0.006], dec: [0.008, 0.024], cr: [40, 220], crHp: 2400, body: 0.25, bodyLp: 1150, scrape: 0, fl: [1800, 4200], fn: 22, sw: [3600, 1800], bd: 0.09 },
    branch: { hp: 1000, lp: 6200, rate: 40, att: [0.002, 0.006], dec: [0.01, 0.03], cr: [60, 320], crHp: 2200, body: 0.3, bodyLp: 1000, scrape: 32, fl: [1300, 3500], fn: 16, sw: [3000, 1300], bd: 0.08 },
  };
  function* brushSteps(sr, r, o = {}) {
    const K = BKIND[o.kind] ?? BKIND.leaf, S = BMIX, dry = o.dry ?? 0.5, ev = o.ev ?? 'rub';
    const lpK = S.lp * mix(0.85, 1.15, dry), crHp = K.crHp * mix(0.85, 1.15, dry) * S.hp, crDec = dry > 0.5 ? [0.00012, 0.0007] : [0.0003, 0.0014], crLp = mix(6500, 11000, dry);
    if (ev === 'rub') {
      const len = 2.6, T = len + 0.5, out = buf(sr, T);
      yield* puffs(out, sr, r, { a: S.puff, rate: K.rate, att: K.att.map(v => v * S.att), dec: K.dec, floor: S.floor, hp: K.hp * S.hp, lp: Math.min(16000, K.lp * lpK) });   // 叶子贴着衣服滑过去
      const crN = Math.round(mix(K.cr[0], K.cr[1], dry) * S.crack * T);                                                                                  // 叶子边上脆的碎响（枯叶多、嫩叶少）
      if (crN) yield* grainsSteps(out, sr, r, { t0: 0, t1: T, n: crN, a: 0.9 * mix(0.5, 1, dry), pow: 2.2, dec: crDec, hp: crHp, lp: crLp });
      yield* puffs(out, sr, r, { a: 1.6 * K.body * S.body, rate: 6, att: [0.015, 0.04], dec: [0.05, 0.12], pow: 1.2, hp: 180, lp: K.bodyLp, pink: 1 });   // 叶片扇过来的“呼”
      if (K.scrape) ticks(out, sr, r, { t0: 0, t1: T, n: Math.round(K.scrape * T), a: 0.45, f: [1100, 3400], dec: [0.002, 0.006], pow: 1.6 });          // 树枝刮过衣服
      yield* flicks(out, sr, r, { t0: 0, t1: T, n: Math.round(K.fn * S.flick * T), a: 1, f: K.fl, dec: dry > 0.5 ? [0.0012, 0.003] : [0.002, 0.005], hp: crHp * 0.8, lp: crLp });   // 偶尔一片拍开
      yield;
      return normRms(loopable(dcBlock(out, sr, 25), sr, 0.5), 0.15);
    }
    if (ev === 'back') {                                          // 一松开：叶子扫过空气、擦过别的叶子，“唰”一下；剩下的叶子还沙沙地抖两下
      const out = buf(sr, 0.8), bd = K.bd * S.att;
      noise(out, sr, r, { t: 0, a: 0.9 * (1 - 0.6 * S.flick), bp: [K.sw[0] * S.hp, 1.0], sweep: [K.sw[0] * S.hp, K.sw[1] * S.hp, 0.14], att: bd * 0.35, dec: bd, len: 0.5 });
      yield* puffs(out, sr, r, { t0: 0.01, t1: 0.42, shape: u => Math.exp(-u * 3.5), a: 0.6 * S.puff, rate: K.rate * 0.8, att: K.att.map(v => v * S.att), dec: K.dec, hp: K.hp * S.hp, lp: Math.min(16000, K.lp * lpK) });
      const crN = Math.round(mix(K.cr[0], K.cr[1], dry) * S.crack * 0.3);
      if (crN) yield* grainsSteps(out, sr, r, { t0: 0.01, t1: 0.4, n: crN, a: 0.8 * mix(0.5, 1, dry), pow: 2.2, dec: crDec, hp: crHp, lp: crLp, shape: u => Math.exp(-u * 3) });
      noise(out, sr, r, { t: 0, a: 0.5 * K.body * S.body, lp: K.bodyLp, hp: 180, att: bd * 0.5, dec: bd * 1.2, len: 0.4, pink: true });
      if (K.scrape) ticks(out, sr, r, { t0: 0.005, t1: 0.2, n: 2 + (r() * 3 | 0), a: 0.5, f: [900, 2400], dec: [0.003, 0.008], pow: 1 });   // 树枝晃回去，枝条磕一两下
      yield* flicks(out, sr, r, { t0: 0, t1: 0.3, n: 2 + (r() * 3 | 0), a: 1.2 * S.flick, f: K.fl, dec: [0.0015, 0.004], hp: crHp * 0.8, lp: crLp, shape: u => Math.exp(-u * 3), pow: 1 });
      return done(out, sr);
    }
    // drop：枝条一抖，几片叶子掉下来 —— 先是一小把碎响（叶柄断开、叶子互相碰），再零零星星几下（落下去的路上碰到别的叶子）
    const out = buf(sr, 1.1);
    yield* grainsSteps(out, sr, r, { t0: 0, t1: 0.22, n: Math.round(mix(30, 90, dry) * (0.4 + S.crack)), a: 0.9, pow: 2, dec: crDec, hp: crHp, lp: crLp, shape: u => Math.exp(-u * 3) });
    yield* puffs(out, sr, r, { t0: 0, t1: 0.3, shape: u => Math.exp(-u * 4), a: 0.5 * S.puff, rate: 50, att: [0.002, 0.006], dec: [0.006, 0.02], hp: 1500 * S.hp, lp: Math.min(16000, 8000 * lpK) });
    yield* flicks(out, sr, r, { t0: 0.12, t1: 0.95, n: 3 + (r() * 4 | 0), a: mix(0.35, 0.6, dry) * 1.5, f: [1600, 4200], dec: dry > 0.5 ? [0.001, 0.0025] : [0.002, 0.004], hp: crHp, lp: crLp, pow: 1.2 });
    return done(out, sr);
  }
  function brush(sr, r, o) { const it = brushSteps(sr, r, o); let s; do s = it.next(); while (!s.done); return s.value; }

  // ============================================================
  //  混响：一段脉冲响应（左右两路互不相关的噪声，指数衰减，越往后越闷）+ 几下早期反射
  //  len 长度 / t60 衰减到 -60 dB 用多久 / f0 → f1 一开始和最后的低通 / pre 预延迟 / er 早期反射 [[时间, 音量], ...]
  // ============================================================
  const SPACE = {
    out: { len: 0.9, t60: 0.6, f0: 7000, f1: 2500, pre: 0.008, er: [[0.011, 0.35], [0.023, 0.2], [0.041, 0.12]] },                              // 室外：几乎只有地面和近处东西的一点反射
    hall: { len: 3.0, t60: 2.4, f0: 5500, f1: 900, pre: 0.025, er: [[0.031, 0.4], [0.047, 0.3], [0.071, 0.25], [0.097, 0.2], [0.13, 0.14]] },      // 大厂房、中枢：又高又空
    cave: { len: 3.8, t60: 3.2, f0: 4000, f1: 700, pre: 0.04, er: [[0.052, 0.5], [0.11, 0.35], [0.19, 0.28], [0.29, 0.2], [0.42, 0.12]] },        // 山洞：更暗、更长，能听出一下下的回声
  };
  function ir(sr, kind) {
    const S = SPACE[kind], r = rng(kind.length * 7919 + 13), N = Math.ceil(S.len * sr), out = [new Float32Array(N), new Float32Array(N)];
    for (const ch of out) {
      let y = 0;
      for (let i = Math.round(S.pre * sr); i < N; i++) {
        const t = i / sr, k = 1 - Math.exp(-TAU * S.f0 * Math.pow(S.f1 / S.f0, Math.min(1, t / S.t60)) / sr);
        y += k * ((r() * 2 - 1) - y); ch[i] = y * Math.pow(10, -3 * t / S.t60) * Math.min(1, (t - S.pre) / 0.004);
      }
      for (const [t, a] of S.er) { const j = Math.round(t * U(r, 0.92, 1.08) * sr); for (let d = 0; d < 40 && j + d < N; d++) ch[j + d] += a * (r() * 2 - 1) * Math.exp(-d / 8); }
    }
    let e = 0; for (const ch of out) for (let i = 0; i < N; i++) e += ch[i] * ch[i];
    const g = 1 / Math.sqrt(e / 2); for (const ch of out) for (let i = 0; i < N; i++) ch[i] *= g;
    return out;
  }

  // ============================================================
  //  调音台（WebAudio）：三路总线（amb 环境 / fol 主角自己 / sfx 别的东西）→ 水下的低通 → 压缩 → 总音量；
  //  一个混响的入口，后面并着三种空间，各自一个音量（由环境关键帧决定走到哪里是哪种空间）
  // ============================================================
  function mixer(AC, dest) {
    const sr = AC.sampleRate, comp = AC.createDynamicsCompressor();
    comp.threshold.value = -20; comp.knee.value = 10; comp.ratio.value = 3.5; comp.attack.value = 0.004; comp.release.value = 0.2;
    const trim = AC.createGain(); trim.gain.value = 0.5; comp.connect(trim).connect(dest);   // 压缩器自己会把声音整体抬高 6 分贝左右，这里压回去：总的响度和原来差不多
    const uw = AC.createBiquadFilter(); uw.type = 'lowpass'; uw.frequency.value = 18000; uw.Q.value = 0.6; uw.connect(comp);
    const mk = () => { const g = AC.createGain(); g.connect(uw); return g; };
    const bus = { amb: mk(), fol: mk(), sfx: mk() }, send = AC.createGain(), rv = {};
    const toBuf = (x, n = 1) => { const b = AC.createBuffer(n, (n > 1 ? x[0] : x).length, sr); for (let c = 0; c < n; c++) b.getChannelData(c).set(n > 1 ? x[c] : x); return b; };
    for (const k in SPACE) { const cv = AC.createConvolver(), g = AC.createGain(); cv.normalize = false; cv.buffer = toBuf(ir(sr, k), 2); g.gain.value = 0; send.connect(g).connect(cv).connect(uw); rv[k] = g; }
    // 放一个声音：gain 音量 / rate 快慢（也就是音高）/ pan 左右 / lp 再过一道低通（远处的声音闷一些）/ wet 送多少去混响 / bus 走哪一路 / delay 晚多久
    function play(b, o = {}) {
      const s = AC.createBufferSource(), g = AC.createGain(); s.buffer = b; s.playbackRate.value = o.rate ?? 1; g.gain.value = o.gain ?? 1;
      let n = s.connect(g);
      if (o.lp) { const f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; n = n.connect(f); }
      if (o.pan && AC.createStereoPanner) { const p = AC.createStereoPanner(); p.pan.value = cl(o.pan, -1, 1); n = n.connect(p); }
      n.connect(bus[o.bus ?? 'sfx']);
      if (o.wet) { const w = AC.createGain(); w.gain.value = o.wet; n.connect(w).connect(send); }
      s.start(AC.currentTime + (o.delay ?? 0)); return { s, g };
    }
    return { comp, uw, bus, send, rv, toBuf, play };
  }

  return { rng, BQ, wander, noise, sine, modes, grains, ticks, bubble, note, peak, rms, normPeak, normRms, loopable, step, SURF, breath, rustle, babble, crickets, sprinkler,
    songbird, coo, crow, woodpecker, bee, owl, clank, chain, steam, creak, rattle, twig, chime, shutter, knock, zap, relay, hum2, pebbles, rumble, plop, gurgle, drip,
    stroke, blub, heart, splash, brush, brushSteps, SPACE, ir, mixer };
})();
