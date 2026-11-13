// ============================================================
//  喘气：跑得越久越累（BR.ex 0..1），呼吸越快、越重；停下来慢慢缓过来。累坏了又站着不动，就弯下腰、两手撑着膝盖喘（BR.bend）。
//  爬坡爬久了、一口气跑太久累了（50-player.js 的 TIRED），也喘得这么凶：BR.ex 不低于累的程度。
//  一呼一吸（BR.chest：肺里有多满，0..1）同时交给声音和主角的动作（42-character-anim.js），听到的吸气、呼气和看到的起伏是对得上的。
//  另外几下：起跳、翻上高处、推起重东西时使一下劲；从高处落下“呃”一声；被探照灯照到倒吸一口气；
//  躲在暗处、光扫过来时屏住气，光过去了长长地呼一口；在水下憋着（没有呼吸声），浮上来大口地喘。
//  声音关着的时候这里照样算（动作要用），只是不出声
// ============================================================
const BR = { ex: 0, ph: 0.6, chest: 0.3, bend: 0, still: 0, hold: 0, under: 0, alert: 0, gasp: -9, effort: -9, pushT: -9, skip: null, mode: 'normal', ground: true };
// 一口气的节奏：每秒几口（不累时四秒一口，最累时一秒一口半）；吸气、呼气各占多少，剩下的是两口气之间停一下
const brRate = ex => lerp(0.24, 1.45, Math.pow(ex, 0.85));
const brIn = ex => lerp(0.36, 0.46, ex), brOut = ex => lerp(0.42, 0.54, ex);
// 单独的几口气（听声音的工具页也直接用这几个）。k 累的程度，v 轻重
const BREATH = {
  hup: (k, v = 1) => breathSound('out', 0.16, 0.6 + 0.4 * k, { att: 0.05, rel: 0.3, f0: 320, gain: lerp(0.09, 0.24, k) * v }),     // 起跳：“嘿”
  oof: (k, v = 1) => breathSound('out', 0.24, 1, { att: 0.04, rel: 0.5, f0: 290, gain: 0.3 * v }),                                  // 从高处落下：“呃”
  strain: (k, v = 1) => breathSound('out', 0.38, 0.9, { att: 0.14, rel: 0.4, f0: 280, gain: lerp(0.14, 0.28, k) * v }),            // 翻上高处、抓住重东西：使一下劲
  gasp: () => breathSound('in', 0.42, 1, { att: 0.08, rel: 0.35, f0: 480, voiceAll: 0.15, gain: 0.36 }),                            // 被照到：倒吸一口气
  surface: lack => breathSound('in', 0.5, 1, { att: 0.06, rel: 0.3, f0: 500, voiceAll: 0.2, gain: lerp(0.3, 0.5, lack) }),          // 浮上水面：大口吸一口
  sigh: () => breathSound('out', 1.3, 0.35, { att: 0.12, rel: 0.75, f0: 260, gain: 0.2 }),                                          // 光过去了：长长地呼一口
};
function effort(kind, v = 1) {                                    // 使一下劲：一口短短的、用力的呼气，接着很快吸一口
  if (T - BR.effort < 0.35) return; BR.effort = T;
  const k = BR.ex, f = brRate(k), a = brIn(k), b = brOut(k);
  BREATH[kind](k, v);
  BR.ph = clamp(a + b - 0.25 * f, a, 0.999); BR.skip = null;      // 跳到这一口呼气的末尾：马上接着吸
}
function stepPant(dt, impact) {
  const play = state === 'play', swim = P.mode === 'swim';
  const run = P.mode === 'normal' && P.grounded && Math.abs(P.vx) > 2.2, moving = Math.abs(P.vx) > 0.3 || (swim && Math.abs(P.vy) > 0.3);
  // ---- 累：跑起来慢慢累上去（一口气跑四五十秒才到最累），推、游也累；被盯上的时候心跳得厉害。走着、站着慢慢缓过来 ----
  let up = run ? 0.022 : P.mode === 'push' && moving ? 0.02 : swim && moving ? 0.024 : 0;
  if (play && HX.alert > 0.3) up += 0.05;
  BR.ex = up ? Math.min(1, BR.ex + up * dt) : Math.max(0, BR.ex - dt * (moving ? 0.022 : 0.05) * (BR.bend ? 1.3 : 1));
  BR.ex = Math.max(BR.ex, 0.9 * TIRED.k);                         // 累得显出样子来了，就喘得和一口气跑了四十来秒一样凶；缓过来以后按上面的慢慢平下来
  // ---- 单独的几下 ----
  if (play) {
    if (!P.grounded && BR.ground && P.vy > 5 && P.mode === 'normal') { BR.ex = Math.min(1, BR.ex + 0.03); if (BR.ex > 0.28 || Math.random() < 0.3) effort('hup'); }   // 起跳
    if (impact > 9.5) { BR.ex = Math.min(1, BR.ex + 0.05); effort('oof', clamp((impact - 9) / 5, 0.5, 1)); }                                                      // 从高处落下
    if (P.mode === 'mantle' && BR.mode !== 'mantle') { BR.ex = Math.min(1, BR.ex + 0.05); if (P.mantle.top - P.mantle.y0 > 0.7) effort('strain'); }             // 翻上高处
    if (P.mode === 'push' && BR.mode !== 'push' && T - BR.pushT > 5) { BR.pushT = T; effort('strain', 0.6); }                                                   // 抓住重东西
  }
  BR.ground = P.grounded; BR.mode = P.mode;
  // ---- 被照到：倒吸一口气 ----
  const alert = play ? HX.alert : 0;
  if (alert > 0.3 && BR.alert <= 0.3 && T - BR.gasp > 15) { BR.gasp = T; BREATH.gasp(); BR.ph = brIn(BR.ex); BR.ex = Math.max(BR.ex, 0.45); }
  BR.alert = alert;
  // ---- 憋着：在水下 / 躲着、光扫过来 ----
  const under = play && swim && P.under, hide = play && HX.hide > 0.35 && alert < 0.3;
  if (under) BR.under += dt;
  else if (BR.under > 0) {                                         // 浮上来了：憋得越久，喘得越凶
    if (BR.under > 1.5) { const lack = 1 - P.air / SWIM.breath; BREATH.surface(lack); BR.ex = Math.max(BR.ex, 0.4 + 0.6 * lack); BR.ph = brIn(BR.ex); }
    BR.under = 0;
  }
  if (hide) BR.hold += dt;
  else if (BR.hold > 0) {                                          // 光过去了：长长地呼一口
    if (BR.hold > 1.2) { BREATH.sigh(); BR.ph = brIn(BR.ex); BR.skip = 'out'; }
    BR.hold = 0;
  }
  // ---- 一口一口地呼吸 ----
  const f = brRate(BR.ex), a = brIn(BR.ex), b = brOut(BR.ex), held = under || hide;
  if (!held) {
    const p0 = BR.ph; BR.ph += dt * f;
    const sound = play || state === 'end';
    if (p0 < a && BR.ph >= a) { if (BR.skip === 'out') BR.skip = null; else if (sound) breathSound('out', b / f * 0.95, BR.ex); }       // 呼气
    if (BR.ph >= 1) { BR.ph -= 1; if (sound) breathSound('in', a / f * 0.95, BR.ex); }                                                // 吸气
  }
  const p = BR.ph, fill = p < a ? sstep(0, a, p) : p < a + b ? 1 - sstep(a, a + b, p) : 0;
  BR.chest = held ? damp(BR.chest, 0.8, 3, dt) : fill;
  // ---- 累坏了：站住不动一会儿，就弯下腰、两手撑着膝盖喘；缓过来一些，或者一动，就直起来。
  //      爬坡、长跑累的这一阵（TIRED.ep）里站住，撑膝盖由累的那一套来做（TIRED.rest），这里不弯，免得两种弯腰叠在一起 ----
  const standing = play && P.mode === 'normal' && P.grounded && Math.abs(P.vx) < 0.05 && !TIRED.ep;
  BR.still = standing ? BR.still + dt : 0;
  BR.bend = standing && (BR.bend ? BR.ex > 0.42 : BR.ex > 0.72 && BR.still > 0.7) ? 1 : 0;
}
function resetPant() { Object.assign(BR, { ex: 0, ph: 0.6, chest: 0.3, bend: 0, still: 0, hold: 0, under: 0, skip: null }); }
