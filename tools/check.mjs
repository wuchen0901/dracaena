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
    console.log(`  ${ok ? 'ok ' : 'BAD'} ${String(i + 1).padStart(2)} ${def.name.padEnd(6, '　')} ${lv.w}x${lv.h}  可转 ${lv.pieces.length}  最少点 ${s.cost} 下  解法 ${s.count} 种${startSolved ? '  一开始就是解开的' : ''}${rotOk ? '' : '  转 90° 以后不一样'}`);
  });
}

{
  // 夜里的房子：一关一关地搜（每关的规则是单独的一段，见 house.html 的“一关一段”）
  const { START, solve, LEVELS, solveL } = core('house.html', ['START', 'solve', 'LEVELS', 'solveL']);
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
  for (const L of LEVELS) {
    const s = solveL(L, L.START, () => true, true);
    const skip = s.path ? [...new Set(s.path.map(m => m.spot))].filter(id => solveL(L, L.START, m => m.spot !== id).path) : [];
    // 走出这一关的时候身上不带东西（进下一关物品栏是空的）
    const carry = s.ends.filter(e => L.ITEMS.some(it => e[it] === 'inv')).length;
    // 不是点出来、到时候自己变的（TIMED）：每个搜得到的局面变过去以后，也都走得出去
    let timed = 0, timedBad = 0;
    for (const st of s.all) for (const f of L.TIMED || []) { const r = f(st); if (!r) continue; timed++; if (!s.canWin.has(L.skey(r.s)) && !solveL(L, r.s).path) timedBad++; }
    const wide = Math.max(...L.KEYS.map(k => (L.VALUES[k] || [0, 1]).length)), fits = L.KEYS.length <= 33 && wide <= 3;
    const ok = !!s.path && s.dead === 0 && !skip.length && !carry && !timedBad && fits;
    if (!ok) bad++;
    console.log(`  ${ok ? 'ok ' : 'BAD'}  第 ${L.n} 关 ${L.name}  ${fmt(s)}${skip.length ? '  不点也走得出去：' + skip.join(' ') : ''}${carry ? `  带着东西走出去的局面 ${carry} 个` : ''}${timed ? `  自己变的 ${timed} 处${timedBad ? `，其中 ${timedBad} 处变了就走不出去` : ''}` : ''}${fits ? '' : `  编不下：${L.KEYS.length} 项、最多 ${wide} 个值`}`);
  }
}

process.exit(bad ? 1 : 0);
