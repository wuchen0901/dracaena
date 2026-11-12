// 用无头 Chrome 打开一个页面，等它把 window.__sheetDone 设成 true，再截成 PNG。
// 用法：node Last/tools/shot.mjs <网址> <输出.png> [宽=1920] [高=1080] [最长等待秒数=180]
// 例子：node Last/tools/shot.mjs "http://127.0.0.1:8765/tools/model-sheet.html" generated_images/model-kid-01.png
// 需要本机装有 Google Chrome 和 Node 22 以上（用到自带的 WebSocket），不依赖任何 npm 包。
import { spawn } from 'node:child_process';
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const [url, out, W = '1920', H = '1080', maxSec = '180'] = process.argv.slice(2);
if (!url || !out) { console.error('用法：node shot.mjs <网址> <输出.png> [宽] [高] [最长等待秒数]'); process.exit(2); }
const chrome = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const port = 9300 + Math.floor(Math.random() * 600);
const profile = mkdtempSync(join(process.env.SHOT_TMP || tmpdir(), 'shot-chrome-'));
const proc = spawn(chrome, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--hide-scrollbars', '--mute-audio',
  '--force-device-scale-factor=1', `--window-size=${W},${H}`, '--autoplay-policy=no-user-gesture-required', '--no-first-run', '--no-default-browser-check',
  ...(process.env.SHOT_FLAGS ? process.env.SHOT_FLAGS.split(' ') : []), 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const quit = code => { try { proc.kill('SIGKILL'); } catch (e) { /* 已经退出了 */ } try { rmSync(profile, { recursive: true, force: true }); } catch (e) { /* 留着也无妨 */ } process.exit(code); };

let page = null;
for (let i = 0; i < 100 && !page; i++) {
  await sleep(150);
  try { page = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(t => t.type === 'page'); } catch (e) { /* Chrome 还没起来 */ }
}
if (!page) { console.error('连不上 Chrome 的调试端口'); quit(1); }

const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((ok, bad) => { ws.onopen = ok; ws.onerror = bad; });
let seq = 0; const waiting = new Map();
ws.onmessage = ev => {
  const m = JSON.parse(ev.data);
  if (m.id && waiting.has(m.id)) { waiting.get(m.id)(m); waiting.delete(m.id); return; }
  if (m.method === 'Runtime.consoleAPICalled') console.log('[页面]', m.params.args.map(a => a.value ?? a.description ?? '').join(' '));
  if (m.method === 'Runtime.exceptionThrown') console.log('[页面出错]', m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text);
};
const send = (method, params = {}) => new Promise(ok => { const id = ++seq; waiting.set(id, ok); ws.send(JSON.stringify({ id, method, params })); });

await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: +W, height: +H, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url });
const t0 = Date.now(); let done = false;
while (!done && Date.now() - t0 < +maxSec * 1000) {
  await sleep(250);
  const r = await send('Runtime.evaluate', { expression: 'window.__sheetDone === true', returnByValue: true });
  done = r.result?.result?.value === true;
}
if (!done) console.log(`等了 ${maxSec} 秒页面还没说画完，照样截一张`);
await sleep(200);
const shot = await send('Page.captureScreenshot', { format: 'png' });
if (!shot.result?.data) { console.error('截图失败', JSON.stringify(shot).slice(0, 300)); quit(1); }
writeFileSync(out, Buffer.from(shot.result.data, 'base64'));
console.log(`${done ? '完成' : '超时'}：${out}（${((Date.now() - t0) / 1000).toFixed(1)} 秒）`);
quit(done ? 0 : 3);
