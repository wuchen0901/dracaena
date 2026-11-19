// 把小游戏页面里的规则（<script id="core">）拿出来，对每一关跑求解器。
// 用法：node mini/tools/check.mjs
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
    console.log(`  ${ok ? 'ok ' : 'BAD'} ${String(i + 1).padStart(2)} ${def.name.padEnd(6, '　')} ${lv.w}x${lv.h}  可转 ${lv.pieces.length}  最少点 ${s.cost} 下  解法 ${s.count} 种${startSolved ? '  (一开始就是解开的)' : ''}${widths.size > 1 ? '  (行宽不一样)' : ''}${rotOk ? '' : '  (转 90° 以后不对)'}`);
  });
}

try {
  const { START, solve } = core('house.html', ['START', 'solve']);
  console.log('夜里的房子');
  const s = solve(START, () => true, true);
  // 解法里点到的每一处，少点哪一处都应该走不出去（不然就是有捷径）
  const skip = s.path ? [...new Set(s.path.map(m => m.spot))].filter(id => solve(START, m => m.spot !== id).path) : [];
  const ok = !!s.path && s.dead === 0 && !skip.length;
  if (!ok) bad++;
  console.log(`  ${ok ? 'ok ' : 'BAD'}  最少点 ${s.path ? s.path.length : '-'} 下  局面 ${s.states} 个  死路 ${s.dead} 个  ${s.path ? s.path.map(m => (m.held ? m.held + '→' : '') + m.spot).join(' ') : ''}${skip.length ? '  (不点 ' + skip.join('、') + ' 也能走出去)' : ''}`);
} catch (e) { if (e.code !== 'ENOENT') throw e; }

process.exit(bad ? 1 : 0);
