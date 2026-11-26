// 把小游戏页面里的规则（<script id="core">）拿出来，对每一关跑求解器。
// 用法：node tools/check.mjs
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
function core(file, names) {
  const html = readFileSync(join(here, '..', 'games', file), 'utf8');
  const m = html.match(/<script id="core">([\s\S]*?)<\/script>/);
  if (!m) throw new Error(file + ': no core script');
  return new Function(m[1] + `\nreturn { ${names.join(', ')} };`)();
}

let bad = 0;

{
  const { LEVELS, parseLevel, trace, solve, rotateDef } = core('prism.html', ['LEVELS', 'parseLevel', 'trace', 'solve', 'rotateDef']);
  console.log('棱光');
  LEVELS.forEach((def, i) => {
    const lv = parseLevel(def);
    const widths = new Set(def.map.map(r => r.length));
    const startSolved = trace(lv, lv.init).solved;
    const s = solve(lv, lv.init);
    // 手机竖屏时关卡转 90°，转过来的也要一样能解、解法一样多
    const rl = parseLevel(rotateDef(def)), rs = solve(rl, rl.init);
    const rotOk = !trace(rl, rl.init).solved && rs.best && rs.count === s.count;
    const ok = widths.size === 1 && !startSolved && s.best && rotOk;
    if (!ok) bad++;
    console.log(`  ${ok ? 'ok ' : 'BAD'} ${String(i + 1).padStart(2)} ${def.name.padEnd(6, '　')} ${lv.w}x${lv.h}  可转 ${lv.pieces.length}  最少点 ${s.cost} 下  解法 ${s.count} 种${startSolved ? '  一开始就是解开的' : ''}${widths.size > 1 ? '  行宽不一样' : ''}${rotOk ? '' : '  转 90° 以后不一样'}`);
  });
}

{
  // 夜里的房子：一关一关地搜（每关的规则是单独的一段，见 house.html 的“一关一段”）
  const { START, solve, LEVELS, solveL, traceBeam, bpBeam17, bpAng17, BPO, START17 } = core('house.html', ['START', 'solve', 'LEVELS', 'solveL', 'traceBeam', 'bpBeam17', 'bpAng17', 'BPO', 'START17']);
  console.log('夜里的房子');
  const fmt = s => `最少点 ${s.path ? s.path.length : '-'} 下  局面 ${s.states} 个  死路 ${s.dead} 个  ${s.path ? s.path.map(m => (m.held ? m.held + '→' : '') + m.spot).join(' ') : ''}`;
  // 第 1 关原来那一套（没有 L 的）照旧跑一遍：这一行要和分关以前一字不差
  {
    const s = solve(START, () => true, true);
    // 解法里点到的每一处，少点哪一处都应该走不出去（不然就是有捷径）
    const skip = s.path ? [...new Set(s.path.map(m => m.spot))].filter(id => solve(START, m => m.spot !== id).path) : [];
    const ok = !!s.path && s.dead === 0 && !skip.length;
    if (!ok) bad++;
    console.log(`  ${ok ? 'ok ' : 'BAD'}  ${fmt(s)}${skip.length ? '  不点也走得出去：' + skip.join(' ') : ''}`);
  }
  // 名字全游戏不能重（页面上只有一个并起来的局面，点、东西、门也都只认名字）：这一关的名字不能出现在别的关里。
  // 每关的局面编成一个三进制的数，最多 33 项、每项最多 3 个值
  const owner = new Map(), dup = [];
  for (const L of LEVELS) for (const name of new Set([...L.KEYS, ...L.SPOTS, ...L.ITEMS, ...Object.keys(L.GATES)])) {
    if (owner.has(name)) dup.push(`${name}（第 ${owner.get(name)} 关、第 ${L.n} 关）`); else owner.set(name, L.n);
  }
  if (dup.length) { bad++; console.log(`  BAD  重名：${dup.join('、')}`); }
  const depth = [];
  for (const L of LEVELS) {
    const s = solveL(L, L.START, () => true, true);
    if (s.path) depth.push({ n: L.n, name: L.name, taps: s.path.length, states: s.states });
    const skip = s.path ? [...new Set(s.path.map(m => m.spot))].filter(id => solveL(L, L.START, m => m.spot !== id).path) : [];
    // 走出这一关的时候身上不带东西（进下一关物品栏是空的）
    const carry = s.ends.filter(e => L.ITEMS.some(it => e[it] === 'inv')).length;
    // 不是点出来、到时候自己变的（TIMED）：每个搜得到的局面变过去以后，也都走得出去
    let timed = 0, timedBad = 0;
    for (const st of s.all) for (const f of L.TIMED || []) { const r = f(st); if (!r) continue; timed++; if (!s.canWin.has(L.skey(r.s)) && !solveL(L, r.s).path) timedBad++; }
    const fits = L.RAD.reduce((a, b) => a * b, 1) <= Number.MAX_SAFE_INTEGER;   // 局面编成一个数（每项按自己的进制，最少 3），不能超过 2^53
    const ok = !!s.path && s.dead === 0 && !skip.length && !carry && !timedBad && fits;
    if (!ok) bad++;
    console.log(`  ${ok ? 'ok ' : 'BAD'}  第 ${L.n} 关 ${L.name}  ${fmt(s)}${skip.length ? '  不点也走得出去：' + skip.join(' ') : ''}${carry ? `  带着东西走出去的局面 ${carry} 个` : ''}${timed ? `  自己变的 ${timed} 处${timedBad ? `，其中 ${timedBad} 处变了就走不出去` : ''}` : ''}${fits ? '' : `  编不下：${L.KEYS.length} 项、最多 ${wide} 个值`}`);
  }
  // 镜子的光路（第 17 关，2026-11-26 起光是按反射定律算的）：先拿几个能心算的例子验一下 traceBeam，再把试衣镜每一格的光落在哪儿列出来
  {
    const near = (a, b) => Math.abs(a - b) < 1e-6, box = [0, 0, 1000, 1000], errs = [];
    // 水平的镜子，光从左上 45° 往下射：反射成右上 45°，一直射到天花板
    let r = traceBeam(0, 0, Math.PI / 4, [{ x: 400, y: 400, a: 0, r: 50 }], box, null);
    if (!(r.bounces === 1 && r.end === 'ceil' && near(r.pts[2][0], 800) && near(r.pts[2][1], 0))) errs.push('水平镜子：' + JSON.stringify(r.pts));
    // 竖着的镜子：光从左上 45° 往下射，反射回来朝左下 45°，先撞到左边的墙（0, 800）
    r = traceBeam(0, 0, Math.PI / 4, [{ x: 400, y: 400, a: Math.PI / 2, r: 50 }], box, null);
    if (!(r.bounces === 1 && r.end === 'wall' && near(r.pts[2][0], 0) && near(r.pts[2][1], 800))) errs.push('竖镜子：' + JSON.stringify(r.pts));
    // 镜子比光偏了：光擦着镜子边过去（|u| > 半长），没有反射
    r = traceBeam(0, 0, Math.PI / 4, [{ x: 400, y: 400 + 80, a: 0, r: 50 }], box, null);
    if (r.bounces !== 0) errs.push('偏了还反射：' + JSON.stringify(r.pts));
    // 目标矩形：从镜子反射出去穿过它算命中，穿不过不算
    r = traceBeam(0, 0, Math.PI / 4, [{ x: 400, y: 400, a: 0, r: 50 }], box, [590, 190, 620, 220]);
    const r2 = traceBeam(0, 0, Math.PI / 4, [{ x: 400, y: 400, a: 0, r: 50 }], box, [590, 290, 620, 320]);
    if (!(r.hit && !r2.hit)) errs.push('目标：' + r.hit + ' ' + r2.hit);
    if (errs.length) bad++;
    console.log(`  ${errs.length ? 'BAD' : 'ok '}  光路函数（反射、擦过、命中）${errs.length ? '  ' + errs.join('；') : ''}`);
  }
  {
    const deg = a => (a * 180 / Math.PI).toFixed(1), errs = [], base = { ...START17, bSw: 1, bMir: 1 }, hits = [];
    console.log(`  第 17 关试衣镜：射灯朝 ${deg(BPO.ray)}°（往下为正），一格 ${deg(BPO.step)}°，${BPO.n} 格；起点第 ${START17.bAng} 格`);
    for (let k = 0; k < BPO.n; k++) {
      const b = bpBeam17({ ...base, bAng: k }), last = b.pts[b.pts.length - 1], out = Math.atan2(last[1] - b.pts[1][1], last[0] - b.pts[1][0]);
      if (b.hit) hits.push(k);
      console.log(`      第 ${k} 格 镜面 ${deg(bpAng17(k)).padStart(6)}°  反射朝 ${deg(out).padStart(6)}°  落在 ${b.end === 'head' ? '店员的头' : ({ floor: '地上', ceil: '天花板', wall: '墙上' })[b.end]} (${Math.round(last[0])}, ${Math.round(last[1])})${b.hit ? '  ← 命中' : ''}`);
    }
    // 只有第 0 格命中；起点不能一推进去就命中；镜子没推进光里、开关没扳，都不能命中；第 0 格的前后两格偏得很开（命中的那一片不会同时罩住两格）
    if (hits.join() !== '0') errs.push('命中的格不对：' + hits.join());
    if (hits.includes(START17.bAng)) errs.push('起点就命中');
    if (bpBeam17({ ...base, bMir: 0, bAng: 0 }).hit) errs.push('镜子没推进去也命中');
    if (bpBeam17({ ...base, bSw: 0, bAng: 0 }) !== null) errs.push('开关没扳也有光');
    const a = bpBeam17({ ...base, bAng: 0 }), h = BPO.head, ys = [h[0], h[2]].map(x => a.pts[1][1] + (x - a.pts[1][0]) * Math.tan(Math.atan2(BPO.aim[1] - a.pts[1][1], BPO.aim[0] - a.pts[1][0])));
    if (!(ys[0] > h[1] && ys[0] < h[3] && ys[1] > h[1] && ys[1] < h[3])) errs.push('正中的一格不是整片头都罩得到');
    if (errs.length) bad++;
    console.log(`  ${errs.length ? 'BAD' : 'ok '}  试衣镜每一格的光${errs.length ? '：' + errs.join('；') : '：只有第 0 格照到夜班店员的头，别的格落在天花板、地上、陈列台那边'}`);
  }
  // 深浅（只是报个数，不算 BAD）：docs/night-rules.md 说一关最少点 20–30 下。“岔开” = 局面 ÷（最少点 + 1）：
  // 1.0 是一条直线（每一刻只有一件事做得成）；几件事能换着先后做、同时开着几条线，它就往上涨（第 1 关几百）
  const MIN_TAPS = 15, LINE = 1.5, fork = d => d.states / (d.taps + 1);
  console.log('深浅（一关最少点 20–30 下；岔开 = 局面 ÷（最少点 + 1），1.0 是一条直线）');
  for (const d of depth) console.log(`  第 ${String(d.n).padStart(2)} 关 ${d.name.padEnd(8, '　')} 最少点 ${String(d.taps).padStart(2)} 下  岔开 ${fork(d).toFixed(1)}`);
  const short = depth.filter(d => d.taps < MIN_TAPS).map(d => d.n), line = depth.filter(d => fork(d) < LINE).map(d => d.n);
  console.log(`  最少点不到 ${MIN_TAPS} 下：${short.length ? '第 ' + short.join('、') + ' 关（' + short.length + ' 关）' : '没有'}`);
  console.log(`  差不多一条直线（岔开不到 ${LINE}）：${line.length ? '第 ' + line.join('、') + ' 关（' + line.length + ' 关）' : '没有'}`);
}

process.exit(bad ? 1 : 0);
