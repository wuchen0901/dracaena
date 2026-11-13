
// ============================================================
//  手机触屏：纯手势，屏幕上不画按钮（像 INSIDE 的手机版）
//  按住屏幕左右滑 = 走（滑得近是慢走，滑得远是跑）　往上一划 = 跳 / 攀爬
//  长按（按住不动一会儿）= 抓住身边的东西，接着左右滑就推拉，松手放开　点一下 = 操作机关
//  在水里：手指往哪边滑就往哪边游（往下滑住不放 = 潜下去），松开手人慢慢浮上去
//  右上角的黑边里三个小图标：选择章节 / 回到存档点 / 声音。竖着拿手机时盖一层“请把手机横过来”，游戏停住
//  手势最后都折算成和键盘一样的 keys / pressed，玩家控制那边不用改。
//  黑边和图标画在游戏画布里（不新加网页元素），以后搬到没有网页元素的小游戏平台上也能用
// ============================================================
const TOUCH_Q = new URLSearchParams(location.search).get('touch');     // 地址后面加 ?touch=1：电脑上用鼠标当手指，试触屏玩法
let touchMode = TOUCH_Q === '1' || (typeof matchMedia === 'function' && matchMedia('(hover: none) and (pointer: coarse)').matches);
let rotBlock = false;                                // 竖着拿手机：游戏停住，等横过来
// 手势的尺寸按屏幕短边的百分之几来算（u），大手机小手机手感一样：
// dead 滑出这么远才算走，run 滑出这么远就跑，leash 摇杆中心最多落后手指这么远（所以往回滑一点就能掉头），
// still 手指挪动不超过这么远算“没动”，hold 按住不动多少秒算长按，flick 140 毫秒里往上划这么远算“往上一划”，vDead 水里上下滑的死区
const TG = { dead: 2.5, run: 5, leash: 8, still: 2.5, hold: 0.3, flick: 7, flickMs: 140, vDead: 3 };
const TOUCHES = new Map();                           // 现在按在屏幕上的手指
let tOrder = 0, tHeld = new Set(), touchJump = false, touchTap = false, jHold = 0, swimWas = false;
const tUnit = () => Math.min(innerWidth || 1280, innerHeight || 720) / 100;
const tNow = () => performance.now();

function tStart(id, x, y, now) {
  if (menuOpen || rotBlock) return;
  const icon = hudIconAt(x, y);
  TOUCHES.set(id, { id, x, y, x0: x, y0: y, ox: x, oy: y, t0: now, hist: [[now, x, y]], still: true, grab: false, used: false, flicked: false, lock: false, icon, order: ++tOrder });
  if (icon < 0) anyKey = true;                       // 标题画面上点一下就开始
}
function tMove(id, x, y, now) {
  const t = TOUCHES.get(id); if (!t) return;
  const u = tUnit(); t.x = x; t.y = y;
  t.hist.push([now, x, y]); while (t.hist.length > 2 && now - t.hist[0][0] > 250) t.hist.shift();
  if (Math.hypot(x - t.x0, y - t.y0) > TG.still * u) t.still = false;
  const L = TG.leash * u; t.ox = clamp(t.ox, x - L, x + L); t.oy = clamp(t.oy, y - L, y + L);   // 摇杆中心被手指拖着走
  if (t.icon >= 0) return;
  const since = ms => { for (const h of t.hist) if (now - h[0] <= ms) return h; return t.hist[t.hist.length - 1]; };   // 这么多毫秒之前手指在哪
  if (t.lock) { if (since(80)[2] - y < 1.2 * u) t.lock = false; }           // 划完停下来或者往回走了：可以再划一次
  else { const a = since(TG.flickMs), up = a[2] - y; if (up >= TG.flick * u && up >= 1.2 * Math.abs(x - a[1])) { t.lock = t.flicked = true; touchJump = true; } }
}
function tEnd(id, x, y, now) {
  const t = TOUCHES.get(id); if (!t) return;
  tMove(id, x, y, now); TOUCHES.delete(id);
  if (t.icon >= 0) { if (hudIconAt(x, y) === t.icon) hudPress(t.icon); return; }     // 在同一个图标上抬起手指才算点了它
  if (t.still && !t.flicked && !t.grab && !t.used && now - t.t0 < TG.hold * 1000 && state !== 'title') touchTap = true;   // 点一下：操作机关
}
function touchClear() { TOUCHES.clear(); for (const k of tHeld) keys.delete(k); tHeld = new Set(); touchJump = touchTap = false; jHold = 0; }

// 每一帧开头：把手指折算成按住了哪些键
function touchInput(dt) {
  if (!TOUCHES.size && !tHeld.size && !touchJump && !touchTap && jHold <= 0) return;
  const u = tUnit(), now = tNow(), want = new Set(), swim = P.mode === 'swim';
  if (swim !== swimWas) { swimWas = swim; for (const t of TOUCHES.values()) t.oy = t.y; }   // 掉进水里 / 爬上岸：上下从手指现在的位置重新算
  let mx = null, my = null;                          // 最新的、滑出了死区的那根手指说了算
  for (const t of TOUCHES.values()) {
    if (t.icon >= 0) continue;
    if (Math.abs(t.x - t.ox) > TG.dead * u && (!mx || t.order > mx.order)) mx = t;
    if (Math.abs(t.y - t.oy) > TG.vDead * u && (!my || t.order > my.order)) my = t;
  }
  if (mx) { const dx = mx.x - mx.ox; want.add(dx > 0 ? 'R' : 'L'); if (Math.abs(dx) < TG.run * u) want.add('S'); }
  if (swim && my) want.add(my.y < my.oy ? 'J' : 'DOWN');          // 水里：往上滑往上游，往下滑潜下去
  let jNew = false;
  if (touchJump) { touchJump = false; jHold = 0.34; jNew = true; }  // 往上一划：“跳”按住 0.34 秒，跳满高度
  if (jHold > 0) { want.add('J'); jHold -= dt; }
  // 长按：身边有能推拉的东西就抓住（手指不松就一直抓着），旁边是机关就操作一下
  if (state === 'play' && ctl) for (const t of TOUCHES.values()) {
    if (t.icon >= 0 || t.grab || t.used || !t.still || now - t.t0 < TG.hold * 1000 || !P.grounded) continue;
    if (P.mode === 'push' || (P.mode === 'normal' && findGrab())) t.grab = true;
    else if (P.mode === 'normal' && findUse()) { t.used = true; touchTap = true; }
  }
  for (const t of TOUCHES.values()) if (t.grab) want.add('E');
  if (touchTap) { touchTap = false; want.add('E'); }               // 点一下：E 按下一帧
  for (const k of want) if (!tHeld.has(k)) { if (!keys.has(k)) pressed.add(k); keys.add(k); }
  if (jNew) pressed.add('J');
  for (const k of tHeld) if (!want.has(k)) keys.delete(k);
  tHeld = want;
}

// ---- 画布里的黑边和右上角的图标（从左到右：选择章节、回到存档点、声音）----
const HUD = { scene: new THREE.Scene(), cam: new THREE.OrthographicCamera(0, 1, 1, 0, -10, 10), cx: [0, 0, 0], flash: [0, 0, 0], key: '' };
{
  const geo = new THREE.PlaneGeometry(1, 1), bar = new THREE.MeshBasicMaterial({ color: 0x040607, depthTest: false, depthWrite: false, fog: false });
  HUD.top = new THREE.Mesh(geo, bar); HUD.bot = new THREE.Mesh(geo, bar);
  HUD.icon = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ transparent: true, depthTest: false, depthWrite: false, fog: false }));
  HUD.icon.renderOrder = 1; HUD.scene.add(HUD.top, HUD.bot, HUD.icon);
}
const hudShown = i => i !== 1 || state !== 'title';   // 标题画面上没有“回到存档点”
function hudLayout() {                               // 坐标用网页像素，y 朝上
  const w = innerWidth || 1280, h = innerHeight || 720, pr = renderer.getPixelRatio();
  const bh = h * 0.06, gs = clamp(Math.round(bh * 0.58), 12, 22), gap = Math.max(36, Math.round(gs * 2.6));   // 黑边高 6%（和网页里的黑边一样）
  Object.assign(HUD, { w, h, bh, gs, gap, pr });
  HUD.cam.right = w; HUD.cam.top = h; HUD.cam.updateProjectionMatrix();
  HUD.top.scale.set(w, bh, 1); HUD.top.position.set(w / 2, h - bh / 2, 0);
  HUD.bot.scale.set(w, bh, 1); HUD.bot.position.set(w / 2, bh / 2, 0);
  const c2 = w - 22 - gs / 2; HUD.cx = [c2 - 2 * gap, c2 - gap, c2];
  const x0 = Math.floor((HUD.cx[0] - gs) * pr) / pr, cw = Math.ceil((w - x0) * pr), ch = Math.ceil(bh * pr);   // 图标贴图只盖右上角那一段黑边
  HUD.x0 = x0;
  if (!HUD.c || HUD.c.width !== cw || HUD.c.height !== ch) {
    [HUD.c, HUD.g] = mkCanvas(cw, ch);
    if (HUD.tex) HUD.tex.dispose();
    HUD.tex = new THREE.CanvasTexture(HUD.c); HUD.tex.colorSpace = THREE.SRGBColorSpace; HUD.tex.generateMipmaps = false; HUD.tex.minFilter = THREE.LinearFilter;
    HUD.icon.material.map = HUD.tex; HUD.icon.material.needsUpdate = true;
  }
  HUD.icon.scale.set(cw / pr, ch / pr, 1); HUD.icon.position.set(x0 + cw / pr / 2, h - ch / pr / 2, 0);
  HUD.key = '';
  sndEl.style.right = touchMode ? Math.round(w - HUD.cx[0] + gs * 1.2) + 'px' : '';   // 声音提示挪到图标左边
}
function drawHudIcons() {
  const { g, c, pr, gs, x0 } = HUD, r = gs / 2, y = HUD.bh / 2, P2 = Math.PI;
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, c.width, c.height);
  g.setTransform(pr, 0, 0, pr, 0, 0); g.lineCap = g.lineJoin = 'round'; g.lineWidth = Math.max(1.4, gs * 0.11);
  for (let i = 0; i < 3; i++) {
    if (!hudShown(i)) continue;
    const x = HUD.cx[i] - x0;
    g.strokeStyle = g.fillStyle = HUD.flash[i] > 0 ? '#ffc56e' : 'rgba(223,231,229,0.85)';   // 点到的那一下亮成暖黄
    g.beginPath();
    if (i === 0) {                                   // 三道横线：选择章节
      for (const k of [-0.62, 0, 0.62]) { g.moveTo(x - 0.85 * r, y + k * r); g.lineTo(x + 0.85 * r, y + k * r); }
      g.stroke();
    } else if (i === 1) {                            // 逆时针的圆箭头：回到存档点
      const rr = 0.8 * r, a0 = -0.35 * P2, px = x + rr * Math.cos(a0), py = y + rr * Math.sin(a0), vx = Math.sin(a0), vy = -Math.cos(a0);
      g.arc(x, y, rr, a0, 1.25 * P2); g.stroke(); g.beginPath();
      for (const s of [-0.62, 0.62]) { const cs = Math.cos(s), sn = Math.sin(s); g.moveTo(px, py); g.lineTo(px - (vx * cs - vy * sn) * 0.55 * r, py - (vx * sn + vy * cs) * 0.55 * r); }
      g.stroke();
    } else {                                         // 小喇叭：开着有两道声波，关着打个叉
      g.moveTo(x - 0.95 * r, y - 0.3 * r); g.lineTo(x - 0.5 * r, y - 0.3 * r); g.lineTo(x + 0.02 * r, y - 0.78 * r);
      g.lineTo(x + 0.02 * r, y + 0.78 * r); g.lineTo(x - 0.5 * r, y + 0.3 * r); g.lineTo(x - 0.95 * r, y + 0.3 * r); g.closePath(); g.fill();
      g.beginPath();
      if (muted) { g.moveTo(x + 0.4 * r, y - 0.32 * r); g.lineTo(x + 1.0 * r, y + 0.32 * r); g.moveTo(x + 1.0 * r, y - 0.32 * r); g.lineTo(x + 0.4 * r, y + 0.32 * r); }
      else { g.arc(x + 0.02 * r, y, 0.48 * r, -0.75, 0.75); g.moveTo(x + 0.02 * r + 0.9 * r * Math.cos(-0.8), y + 0.9 * r * Math.sin(-0.8)); g.arc(x + 0.02 * r, y, 0.9 * r, -0.8, 0.8); }
      g.stroke();
    }
  }
  HUD.tex.needsUpdate = true;
}
function hudIconAt(x, y) {                           // 手指落在哪个图标上（网页坐标，y 朝下）；点的范围比画出来的大，好点
  if (!touchMode || !HUD.c || y > Math.max(46, HUD.bh + 22)) return -1;
  let best = -1, bd = HUD.gap / 2 + 4;
  for (let i = 0; i < 3; i++) if (hudShown(i)) { const d = i === 2 && x > HUD.cx[2] ? 0 : Math.abs(x - HUD.cx[i]); if (d < bd) { bd = d; best = i; } }
  return best;
}
function hudPress(i) {
  HUD.flash[i] = 0.3;
  if (i === 0) rawKeys.add('Escape');                // 和 Esc 一样：下一帧打开 / 关上章节菜单
  else if (i === 1) pressed.add('RESET');            // 和 R 一样：回到存档点（结局画面上是回到最后的选择）
  else { setMuted(!muted); soundNote(); }            // 直接在手指抬起的这一下里开声音：iOS 只许在触摸事件里开始放声音
}
function hudRender(dt) {                             // 画完场景以后叠在上面
  if (!touchMode) return;
  let f = 0; for (let i = 0; i < 3; i++) { if (HUD.flash[i] > 0) HUD.flash[i] -= dt; f = f * 2 + (HUD.flash[i] > 0 ? 1 : 0); }
  const key = `${HUD.w}x${HUD.h} ${muted} ${state === 'title'} ${f}`;
  if (key !== HUD.key) { HUD.key = key; drawHudIcons(); }
  renderer.autoClear = false; renderer.render(HUD.scene, HUD.cam); renderer.autoClear = true;
}

// ---- 触屏 / 键盘两套说法：标题、章节菜单、结局、操作提示 ----
const KEY_TEXT = { title: $('title').querySelector('.keys').innerHTML, menu: $('menu').querySelector('.keys').innerHTML, end: $('end').querySelector('.go').innerHTML };
const TOUCH_TEXT = {
  title: '<b>按住屏幕 左右滑</b> 移动　　<b>往上一划</b> 跳跃 / 攀爬　　<b>长按</b> 抓住东西，再滑就推拉<br>' +
    '<b>点一下</b> 操作机关　　在水里 <b>往下滑住</b> 潜下去　　右上角：选择章节 · 回到存档点 · 声音',
  menu: '点一章，从这一章的开头开始　　点空白处返回',
  end: '点右上角的 ↺ 回到最后的选择　·　☰ 选择章节',
};
const TOUCH_HINT = {                                 // 换个说法读着更顺的几条；其余的按下面的规则替换
  '<b>←</b><b>→</b> 移动': '<b>按住屏幕 左右滑</b> 移动',
  '<b>空格</b> 跳跃': '<b>往上一划</b> 跳跃',
  '按住 <b>E</b> 抓住推车，再按方向键推或拉': '<b>长按</b> 抓住推车，再左右滑，推或拉',
  '跳下去，<b>← →</b> 游泳': '跳下去，<b>按住滑动</b> 游泳',
  '按住 <b>↓</b> 潜下去，从岩石底下游过去': '<b>往下滑住不放</b> 潜下去，从岩石底下游过去',
  '<b>空格</b> 往上，<b>↓</b> 往下；什么都不按，人会慢慢浮上去': '<b>往上滑</b> 往上，<b>往下滑</b> 往下；松开手，人会慢慢浮上去',
};
function touchText(h) {
  return TOUCH_HINT[h] ?? h.replace(/按住 <b>E<\/b>/g, '<b>长按</b>').replace(/按 <b>E<\/b>/g, '<b>点一下</b>').replace(/<b>空格<\/b>/g, '<b>往上一划</b>')
    .replace(/<b>↓<\/b>/g, '<b>往下滑</b>').replace(/<b>←<\/b><b>→<\/b>|<b>← →<\/b>/g, '<b>左右滑</b>').replace(/方向键/g, '左右滑');
}
function goText() {
  const k = touchMode ? '点一下' : '按任意键';
  return STORY.ch > 1 ? `${k}继续 · 第${CN[STORY.ch - 1]}章 ${CHAPTERS[STORY.ch - 1].name}` : `${k}开始`;
}
function applyInputTexts() {
  $('title').querySelector('.keys').innerHTML = touchMode ? TOUCH_TEXT.title : KEY_TEXT.title;
  $('menu').querySelector('.keys').innerHTML = touchMode ? TOUCH_TEXT.menu : KEY_TEXT.menu;
  $('end').querySelector('.go').innerHTML = touchMode ? TOUCH_TEXT.end : KEY_TEXT.end;
  $('go').textContent = goText();
}
function setTouchMode(on) {                          // 摸了屏幕就换成触屏，按了键盘就换回键盘
  if (on === touchMode) return;
  touchMode = on; if (!on) touchClear();
  document.body.classList.toggle('touch', on); applyInputTexts(); touchResize(); hintNow = null;   // 提示也换成对应的说法
}
function touchResize() {
  hudLayout();
  const b = touchMode && (innerHeight || 0) > (innerWidth || 0);
  if (b === rotBlock) return;
  rotBlock = b; document.body.classList.toggle('portrait', b); touchClear();
  if (master) master.gain.setTargetAtTime(b || muted ? 0 : 0.6, AC.currentTime, 0.05);   // 竖着停住的时候声音也停
}

// ---- 事件：手指；?touch=1 时鼠标也当手指 ----
const tOpt = { passive: false };
addEventListener('touchstart', e => {
  setTouchMode(true);
  if (menuOpen) return;                              // 章节菜单是网页元素，点击交给它自己
  for (const t of e.changedTouches) tStart(t.identifier, t.clientX, t.clientY, tNow());
  e.preventDefault();                                // 不要滚动、缩放、长按弹菜单，也不要再补发一次鼠标点击
}, tOpt);
addEventListener('touchmove', e => { for (const t of e.changedTouches) tMove(t.identifier, t.clientX, t.clientY, tNow()); if (!menuOpen) e.preventDefault(); }, tOpt);
addEventListener('touchend', e => { for (const t of e.changedTouches) tEnd(t.identifier, t.clientX, t.clientY, tNow()); if (!menuOpen) e.preventDefault(); }, tOpt);
addEventListener('touchcancel', e => { for (const t of e.changedTouches) TOUCHES.delete(t.identifier); }, tOpt);
if (TOUCH_Q === '1') {
  let md = false;
  addEventListener('mousedown', e => { if (e.button || menuOpen) return; md = true; tStart(-1, e.clientX, e.clientY, tNow()); });
  addEventListener('mousemove', e => { if (md) tMove(-1, e.clientX, e.clientY, tNow()); });
  addEventListener('mouseup', e => { if (md) { md = false; tEnd(-1, e.clientX, e.clientY, tNow()); } });
}
addEventListener('keydown', () => { if (TOUCH_Q !== '1') setTouchMode(false); });
addEventListener('blur', touchClear);
document.addEventListener('visibilitychange', () => { if (document.hidden) touchClear(); });
addEventListener('contextmenu', e => { if (touchMode) e.preventDefault(); });   // 安卓上长按会弹出菜单
addEventListener('gesturestart', e => e.preventDefault());                     // iOS 上两根手指捏一下会缩放网页
addEventListener('resize', touchResize);
addEventListener('orientationchange', () => setTimeout(touchResize, 150));
menuEl.addEventListener('click', e => { if (touchMode && menuOpen && !e.target.closest('.it')) toggleMenu(false); });   // 触屏：点空白处返回
document.body.classList.toggle('touch', touchMode); touchResize();
const TOUCH_DBG = {                                  // 调试：__g.touch.start(1, x, y) / move / end，模拟手指
  start: (id, x, y) => tStart(id, x, y, tNow()), move: (id, x, y) => tMove(id, x, y, tNow()), end: (id, x, y) => tEnd(id, x, y, tNow()),
  list: () => [...TOUCHES.values()], held: () => [...tHeld], icons: () => ({ cx: HUD.cx, y: HUD.bh / 2, gs: HUD.gs }),
  draw: () => { renderer.render(scene, camera); hudRender(0); } };   // 停住时连黑边和图标一起重画一帧
