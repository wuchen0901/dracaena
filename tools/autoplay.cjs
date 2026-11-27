// 夜里的房子：在无头浏览器里自己玩（要装了 playwright；自己起一个只读的小服务器，不用另外开）。
// 规则走不走得通查 check.mjs；这个查的是页面：照游戏自己的“下一步”（nextStep，和 ?auto=1 一样）一关一关走，看走不走得完、被怪物抓了几次、拽住了几次、有没有报错。
// 手动走帧（?paused=1，每帧 1/30 秒），不等真实时间，一关几秒钟。
//
//   node tools/autoplay.cjs sim [关，如 3 或 1-22，默认 1-22]
//       每关照“下一步”走一遍。2026-11-26 的结果：都走得完；除了第 6 关披风蝠那一次（设计如此）被抓 0 次、拽住 0 次
//   node tools/autoplay.cjs fuzz [关，默认 2-22] [每关几组，默认 4] [每组几步，默认 60]
//       乱来：随机点能点的地方（带或不带东西）、随机走、随机等，每帧查 NaN；乱来完照“下一步”接着走，要走得出这一关。
//       已知走不出的两组（第 3 关种子 4、第 18 关种子 1）：孩子走回了上一关，被会自己变的门挡在那边，“下一步”不会带他回头（2026-11-26 以前就这样）
//   加 V=1 每组都打一行；改了怪物以后两样都跑一遍，和改之前比。
const http = require('node:http'), fs = require('node:fs'), path = require('node:path');
const { chromium } = require('playwright');

const root = path.join(__dirname, '..', 'games');
const serve = () => new Promise(res => {
  const srv = http.createServer((q, a) => {
    if (q.url === "/favicon.ico") { a.writeHead(204); return a.end(); }
    const f = path.join(root, path.normalize(decodeURIComponent(q.url.split('?')[0])).replace(/^([/\\])+/, '') || 'index.html');
    if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { a.writeHead(404); return a.end(); }
    a.writeHead(200, { 'content-type': f.endsWith('.html') ? 'text/html; charset=utf-8' : 'application/octet-stream' }); fs.createReadStream(f).pipe(a);
  }).listen(0, '127.0.0.1', () => res(srv));
});
const range = (s, d) => { const [a, b] = (s || d).split('-').map(Number); return [a, b || a]; };

// 在页面里跑的：照“下一步”走，直到走出这一关（或者到时间）。和页面里 ?auto=1 的那个定时器是一样的逻辑，每 0.6 秒点一下
const playOut = maxSec => {
  const h = window.__house, n0 = h.curLevel().n; let t = 0, c0 = h.catches; const who = [];
  for (let i = 0; i < maxSec * 30; i++) {
    h.tick(1 / 30); t += 1 / 30;
    if (h.catches !== c0) { c0 = h.catches; who.push(h.V.caughtBy + '@' + t.toFixed(1)); }
    const L = h.curLevel(); if (!L || L.n !== n0) return { done: true, t, who };
    if (i % 18 !== 17) continue;
    const step = h.won ? null : h.nextStep(); h.autoStep = step;
    if (step && step.spot === 'bBtnH' && !h.autoLift()) continue;   // 货梯的按钮要看时候按
    if (!step || ['yLure', 'cFullH', 'cFloodH'].includes(step.spot) || h.kid.mode !== 'idle' || h.flying) continue;   // 这几步不是点出来的：等页面自己记上
    h.tap(step.spot, step.held);
  }
  const st = h.nextStep(); return { done: false, t, who, kid: [Math.round(h.kid.x), Math.round(h.kid.y), h.kid.mode], step: st ? (st.held ? st.held + '→' : '') + st.spot : null };
};

(async () => {
  const [mode = 'sim', a1, a2 = '4', a3 = '60'] = process.argv.slice(2);
  const srv = await serve(), base = `http://127.0.0.1:${srv.address().port}/house.html?paused=1`, br = await chromium.launch();
  const open = async lv => {
    const pg = await br.newPage({ viewport: { width: 1280, height: 720 } }), errs = [];
    pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await pg.goto(base + (lv > 1 ? '&lv=' + lv : '&nosave=1')); await pg.waitForTimeout(700);
    return { pg, errs };
  };
  let bad = 0;
  if (mode === 'sim') {
    const [a, b] = range(a1, '1-22');
    for (let lv = a; lv <= b; lv++) {
      const { pg, errs } = await open(lv);
      const r = await pg.evaluate(`(${playOut})(${lv === 1 ? 900 : 500})`), h = await pg.evaluate(() => ({ catches: window.__house.catches, holds: window.__house.V.holds || 0 }));
      if (!r.done || errs.length) bad++;
      console.log(`第 ${lv} 关  ${r.done ? '走完' : '没走完'}  ${r.t.toFixed(1)} 秒  被抓 ${h.catches} 次${r.who.length ? '（' + r.who.join(' ') + '）' : ''}  拽住 ${h.holds} 次${r.done ? '' : '  孩子在 ' + r.kid + '，下一步 ' + r.step}${errs.length ? '  报错 ' + errs.slice(0, 2).join(' | ') : ''}`);
      await pg.close();
    }
  } else if (mode === 'fuzz') {
    const [a, b] = range(a1, '2-22'); let runs = 0, steps = 0, catches = 0, holds = 0;
    for (let lv = a; lv <= b; lv++) for (let seed = 1; seed <= +a2; seed++) {
      const { pg, errs } = await open(lv);
      const f = await pg.evaluate(({ seed, n, lv }) => {
        const h = window.__house, n0 = h.curLevel().n, bad = []; let s = seed * 7919 + lv * 104729, steps = 0;
        const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
        const run = sec => { for (let i = 0; i < Math.round(sec * 30) && bad.length < 4; i++) { h.tick(1 / 30); if (!(h.kid.x === h.kid.x) || !(h.kid.y === h.kid.y)) bad.push('孩子 NaN'); for (const k in h.mon) if (!(h.mon[k].x === h.mon[k].x) || !(h.mon[k].rise === h.mon[k].rise)) bad.push(k + ' NaN'); if (h.V.hold && Math.abs(h.kid.x - h.mon[h.V.hold.k].x) > 420) bad.push(h.V.hold.k + ' 拽着却离得很远'); } };
        run(2.6);
        for (let i = 0; i < n && h.curLevel() && h.curLevel().n === n0 && bad.length < 4; i++) {
          const u = rnd(); steps++;
          if (u < 0.45) { const sp = h.spots(), near = sp.filter(q => Math.abs(q.stand.x - h.kid.x) < 1600), from = near.length ? near : sp; if (from.length) { const q = from[Math.floor(rnd() * from.length)], bag = h.bag; h.tap(q.id, bag.length && rnd() < 0.5 ? bag[Math.floor(rnd() * bag.length)] : null); } }
          else if (u < 0.85) h.walkTo(h.kid.x + (rnd() - 0.42) * 900, h.kid.y);
          run(0.4 + rnd() * 2.4);
        }
        return { steps, bad, left: !h.curLevel() || h.curLevel().n !== n0 };
      }, { seed, n: +a3, lv });
      const r = f.left ? { done: true, t: 0, who: [] } : await pg.evaluate(`(${playOut})(420)`), h = await pg.evaluate(() => ({ catches: window.__house.catches, holds: window.__house.V.holds || 0 }));
      const ok = r.done && !f.bad.length && !errs.length; runs++; steps += f.steps; catches += h.catches; holds += h.holds; if (!ok) bad++;
      if (!ok || process.env.V) console.log(`第 ${lv} 关 种子 ${seed}：${r.done ? '走完' : '没走完'}（乱来 ${f.steps} 步，接着走 ${Math.round(r.t)} 秒）被抓 ${h.catches} 拽住 ${h.holds}${f.bad.length ? '  坏：' + f.bad.join('、') : ''}${r.done ? '' : '  孩子在 ' + r.kid + '，下一步 ' + r.step}${errs.length ? '  报错 ' + errs.slice(0, 2).join(' | ') : ''}`);
      await pg.close();
    }
    console.log(`共 ${runs} 组、乱来 ${steps} 步：有问题的 ${bad} 组；被抓 ${catches} 次，拽住 ${holds} 次`);
  } else console.log('用法：node tools/autoplay.cjs sim [关] | fuzz [关] [组数] [步数]');
  await br.close(); srv.close();
  process.exit(bad && mode === 'sim' ? 1 : 0);
})();
