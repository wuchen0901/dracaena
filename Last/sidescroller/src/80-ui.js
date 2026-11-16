
// ============================================================
//  界面：提示 / 章节卡 / 章节菜单 / 存档 / 结局
// ============================================================
// 所有章节用一份存档。2026-11-15 删掉《逃出工厂》的第一章（焚化炉）以后章节号都往前挪了一位，存档换成 v2：
// 原来那份（escape-factory-save-v1）和旧原型单独的那份（rust-glimmer-save-v1）章节号都对不上了，不再读
const SAVE_KEY = 'escape-factory-save-v3';   // v3：2026-11-16 加了“雾”一章，后面的章节号都挪了一位，v2 的存档对不上
function saveGame() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(STORY)); } catch (e) { /* 存不了也照常玩 */ } }
function loadGame() {
  try { const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); if (s && s.ch >= 1 && s.ch <= CHAPTERS.length) Object.assign(STORY, STORY0, s); } catch (e) { /* 读不出来就从头开始 */ }
}

const hintEl = $('hint'); let hintNow = '';
function updateHint() {
  let h = ''; if (state === 'play' && ctl && !menuOpen) for (const [c, html] of HINTS) if (c()) { h = html; break; }
  if (h && touchMode) h = touchText(h);              // 触屏：把按键换成手势的说法
  if (h !== hintNow) { hintNow = h; if (h) hintEl.innerHTML = h; hintEl.style.opacity = h ? 1 : 0; }
}

// ---- 章节卡 ----
const CN = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十', '二十一', '二十二', '二十三', '二十四', '二十五', '二十六', '二十七', '二十八', '二十九', '三十', '三十一', '三十二', '三十三', '三十四', '三十五', '三十六'];
const chapEl = $('chap'); let chapT = 0;
function showChapter(c) { chapEl.innerHTML = `<i>${c.label ?? `第${CN[c.n - 1]}章`}</i><b>${c.name}</b><span>${c.sub}</span>`; chapEl.classList.add('on'); chapT = 4.5; }
function stepChapterCard(dt) { if (chapT > 0 && (chapT -= dt) <= 0) chapEl.classList.remove('on'); }

// ---- 声音开关的提示：右上角的黑边里淡淡地出现一会儿（现阶段默认静音，开始游戏时提醒一次按 M 打开）----
const sndEl = $('snd'); let sndTO = 0;
function soundNote(first) {
  sndEl.innerHTML = !muted ? '声音 开' : first ? (touchMode ? '声音关着　点最右边的小喇叭打开' : '声音关着　按 <b>M</b> 打开') : '声音 关';
  sndEl.classList.add('on'); clearTimeout(sndTO); sndTO = setTimeout(() => sndEl.classList.remove('on'), first ? 5000 : 1800);
}

// ---- 从某一章的开头开始 ----
// 跳过去的章节按“都帮了”来算；这一章和后面的章节回到初始状态
// 下面是旧原型的几章（OLD + k）：旧第十二章（凿记号）跳过去，就算灯泡已经揣在怀里；旧第十三章（机房）回到选择之前。《逃出工厂》的一条在 escape/85-fixups.js
const SKIP = { [OLD + 3]: s => { s.cat = true; }, [OLD + 4]: s => { s.fed = true; }, [OLD + 5]: s => { s.cleaner = s.cleaner || 1; }, [OLD + 6]: s => { s.pump = true; s.water = true; }, [OLD + 7]: s => { s.wild = true; },
  [OLD + 12]: s => { s.bulb = true; } };
const UNDO = { [OLD + 3]: s => { s.cat = false; }, [OLD + 4]: s => { s.fed = false; }, [OLD + 5]: s => { s.cleaner = 0; }, [OLD + 6]: s => { s.pump = false; s.water = false; }, [OLD + 7]: s => { s.wild = false; },
  [OLD + 8]: s => { s.ending = 0; }, [OLD + 12]: s => { s.bulb = false; }, [OLD + 13]: s => { s.room = 0; } };
const energyFor = n => [1, 1, 0.94, 0.86, 0.78, 0.7, 0.62, 0.54, 0.54, 0.54, 0.54][origN(n) - 1] ?? 0.54;      // 07 的灯：每帮别人一次，暗一档（按章节原来的编号）
let endZone = null;                                     // 是哪一章演的结局（按 R 回到哪一章的最后选择）；没有登记就是旧原型的第八章
function startChapter(n, o = {}) {
  const c = CHAPTERS[n - 1];
  for (let k = 1; k <= CHAPTERS.length; k++) { if (k < n) { if (k > (STORY.done ?? 0) && SKIP[k]) SKIP[k](STORY); } else if (UNDO[k]) UNDO[k](STORY); }
  STORY.done = n - 1; STORY.ch = n; saveGame();
  for (const z of ZONES) { if (z.n < n) z.solve(); else z.reset(); }
  const at = o.at ?? c.start, walk = o.at !== undefined;   // walk：是从上一章一路走进来的（见下面的 walkInto），不是从菜单、存档进来的 —— 人放在这一章的入口，不放在出生点
  placePlayer(at); P.cp = cpAt(c.start + 0.01); resetPant();
  const first = localN(n) === 1 && !walk;               // 两个故事的第一章：操作提示从头教一遍（走进来的已经会了）
  Object.assign(P, { moved: !first, jumped: !first, pushed: !first, used: !first });
  // 小猫是旧原型里的：旧第三章救下以后跟着走；《逃出工厂》的章节里没有它
  if (STORY.cat) catPlace(at - 0.9, floorY(at - 0.9, P.y + 0.1)); else if (n > OLD + 3 || n <= OLD) CAT.state = 'none';
  ctl = true; autoDir = 0; state = 'play'; envMod = null; camOvr = null; fadeThen = null; endZone = null;
  $('end').classList.add('hide'); $('end').classList.remove('bare', 'white'); $('fade').style.opacity = 0; $('white').style.opacity = 0;
  if (!walk) { MIST.k = 0; MIST.go = MIST.arr = MIST.pre = null; }
  if (c.intro) c.intro();
  if (walk) placePlayer(at);                            // 开场的摆法（比如工厂那一章从上层掉下来）是给“从这一章开始”用的；走进来的人就在地上
  snapCamera(); applyEnv(camera.position.x); dropFarZones(cam.x); streamZones(cam.x, true);
  if (!o.quiet) showChapter(c);
}

// ---- 二十四章接成一条路：一直往右走，就从第 1 章走到第 24 章 ----
// 世界里挨着的章节（第 1–8 章、第 9–16 章）本来就是一条路。不挨着的几处（中间隔着空气墙和几百米空地）用一段“雾里的路”接起来：
// 人走到这一章的尽头，越往前雾越浓（暗处就是越走越黑），浓到什么都看不见的那一步，把人挪到下一章的入口，接着走，雾又散开。
// 人一直在走、一直听玩家的，没有黑屏，也不停下来。出口登记在章节文件里（20-world.js 的 chapterExit），入口是章节对象上的 enter。
// 演结局的三章（第 8 章结尾、第 16 章生态中枢、第 21 章机房）在结局画面上按一下 → / 回车 / 空格 / E（触屏点一下），同样起一阵雾，人出现在下一章的入口。
// MIST（20-world.js）：k 雾有多浓（0..1）/ tint 颜色 / pre 快到了的下一章入口在哪（它的布景提前搭好，见 38-stream.js）/ arr 刚到下一章，雾还没散 / go 结局画面上按了继续
const chapLabel = c => c.label ?? `第${CN[c.n - 1]}章`;
const mistEl = $('mist');
// 工具页（Last/tools/）把游戏装在 iframe 里、一章一章单独摆主角截图：在那里走到一章的尽头不接下一章，和接起来以前一样。地址后面加 ?link=1 / ?link=0 可以硬开、硬关
const LINK = (new URLSearchParams(location.search).get('link') ?? (window.parent === window ? '1' : '0')) === '1';
const enterOf = c => c.enter ?? [c.start - 5, c.start];
function mistTint(hex) { MIST.tint.setHex(hex); MIST.sky = hex3(hex); mistEl.style.background = '#' + hex.toString(16).padStart(6, '0'); }
function walkInto(n) {                                  // 从第 n - 1 章走进第 n 章
  const c = CHAPTERS[n - 1], [b0, b1] = enterOf(c), vx = P.vx, face = P.facing;
  STORY.done = Math.max(STORY.done ?? 0, n - 1);        // 先记下上一章已经走完：startChapter 不再按“跳过去”替它补故事进度
  const keep = { ...STORY };
  startChapter(n, { at: b0 });
  // 前面几章的故事进度照实际玩的留着：startChapter 把走完的章节摆成“已经通过”的样子时，有的会顺手把自己的结局清掉（选了哪个结局）
  Object.assign(STORY, keep, { ch: n, done: n - 1 }); for (let k = n; k <= CHAPTERS.length; k++) if (UNDO[k]) UNDO[k](STORY); saveGame();
  P.vx = Math.max(0, vx); P.facing = face > 0 ? 1 : P.facing;   // 脚下不停：接着往右走
  MIST.arr = { b0, b1, t: 0 }; MIST.pre = null; MIST.k = 1;
}
function stepMist(dt) {
  let k = 0;
  if (MIST.go) {                                        // 结局画面上按了继续：雾自己起来（人这时候不归玩家管）
    const g = MIST.go; g.t += dt; k = sstep(0, 1.2, g.t);
    if (g.t >= 1.35) { MIST.go = null; walkInto(g.n + 1); k = 1; }
  } else if (MIST.arr) {                                // 刚到下一章：往前走雾就散；站着不动，过一会儿也散
    const a = MIST.arr; a.t += dt;
    k = Math.min(sstep(a.b1, a.b0, P.x), 1 - sstep(0.3, 2.8, a.t));
    if (k <= 0) MIST.arr = null;
  } else if (state === 'play' || state === 'fade') {
    const n = chapterAt(P.x).n; MIST.pre = null;
    if (LINK) for (const e of EXITS) if (e.n === n && n < CHAPTERS.length && P.x > e.a0 && (!e.when || e.when())) {
      k = sstep(e.a0, e.a1, P.x); mistTint(e.tint); MIST.pre = enterOf(CHAPTERS[n])[0];
      if (P.x >= e.a1 && state === 'play') { walkInto(n + 1); k = 1; }
      break;
    }
  }
  MIST.k = k; MIST.d = Math.max(8, cam.d);
  const op = sstep(0.3, 1, k); if (Math.abs(op - MIST.op) > 0.002 || (op === 0) !== (MIST.op === 0)) mistEl.style.opacity = MIST.op = op;
}
let endAt = -1e9;                                       // 结局画面是什么时候出来的：刚出来的一会儿不接受“继续”，免得手上正按着的键把它跳过去
const endChapter = () => (endZone ?? chapterAt(P.x)).n;
function continueFromEnd() {
  const n = endChapter(); if (state !== 'end' || T - endAt < 1.5 || MIST.go || n >= CHAPTERS.length) return;
  $('end').classList.add('hide');
  mistTint($('end').classList.contains('white') ? 0xf3f1ea : CHAPTERS[n - 1].endTint ?? 0x0a0d0f);     // 拉闸的结局画面已经全白：雾也是白的
  MIST.go = { n, t: 0 }; MIST.pre = enterOf(CHAPTERS[n])[0];
}

// ---- 章节菜单（Esc）----
// 二十章排成两列：左边《逃出工厂》（第 1–7 章），右边旧原型（第 8–20 章）。上下键按章节号顺着走，走到头接回第一章
let menuOpen = false, menuSel = 0;
const menuEl = $('menu'), menuList = $('menulist');
function drawMenu() {
  const it = i => { const c = CHAPTERS[i]; return `<div class="it${i === menuSel ? ' sel' : ''}" data-i="${i}"><i>${c.tag ?? CN[i]}</i><b>${c.name}</b><span>${c.sub}</span></div>`; };
  const col = (title, a, b) => `<div class="col"><div class="grp">${title}</div>${Array.from({ length: b - a }, (_, k) => it(a + k)).join('')}</div>`;
  const deep = CHAPTERS.findIndex(c => c.grp === 'deep'), d0 = deep < 0 ? CHAPTERS.length : deep;   // 第三列：工厂深处（第 25 章起，src/69-h*.js）
  menuList.innerHTML = col('逃出工厂', 0, OLD) + col('铁锈与微光 · 旧原型', OLD, d0) + (d0 < CHAPTERS.length ? col('工厂深处', d0, CHAPTERS.length) : '');
}
function toggleMenu(on = !menuOpen) {
  menuOpen = on; if (on) { menuSel = (state === 'title' ? STORY.ch : chapterAt(P.x).n) - 1; drawMenu(); }
  menuEl.classList.toggle('hide', !on);
  if (state === 'title') $('title').classList.toggle('hide', on);      // 标题画面上打开菜单：先把标题让开
}
function menuGo(i) {
  toggleMenu(false);
  if (state === 'title') { $('title').classList.add('hide'); $('skins').classList.add('on'); initAudio(); if (muted) soundNote(true); }
  startChapter(i + 1);
}
function menuInput() {
  const n = CHAPTERS.length;
  if (rawKeys.has('ArrowUp') || rawKeys.has('KeyW')) { menuSel = (menuSel + n - 1) % n; drawMenu(); }
  if (rawKeys.has('ArrowDown') || rawKeys.has('KeyS')) { menuSel = (menuSel + 1) % n; drawMenu(); }
  if (rawKeys.has('Enter') || rawKeys.has('Space') || rawKeys.has('KeyE')) menuGo(menuSel);
}
menuList.addEventListener('click', e => { const it = e.target.closest('.it'); if (it) menuGo(+it.dataset.i); });

function begin() {
  if (state !== 'title') return;
  $('title').classList.add('hide'); $('skins').classList.add('on'); initAudio(); if (muted) soundNote(true); startChapter(STORY.ch);
}
// 结局画面上的大标题和最底下那一行：网页里写的是旧原型的；哪一章自己写了 end: { h1, go } 就换成它的（《逃出工厂》的结尾）
const END_TXT = { h1: $('end').querySelector('h1').textContent, go: $('end').querySelector('.go').innerHTML };
function endTexts() {
  const t = chapterAt(P.x).end ?? END_TXT; endAt = T;
  const nx = CHAPTERS[endChapter()], go = nx ? ` 接着往前走 · ${chapLabel(nx)} ${nx.name}` : '';   // 后面还有章节：最底下一行先写怎么接下去
  $('end').querySelector('h1').textContent = t.h1;
  KEY_TEXT.end = (go ? `按 →${go}　·　` : '') + t.go; TOUCH_TEXT.end0 ??= TOUCH_TEXT.end; TOUCH_TEXT.end = (go ? `点一下${go}　·　` : '') + TOUCH_TEXT.end0; applyInputTexts();   // 键盘、触屏两套说法（82-touch.js）
}
function showEnd(sub, txt) {
  endTexts();
  $('endsub').textContent = sub; $('endtxt').innerHTML = txt; $('end').classList.remove('hide'); $('fade').style.opacity = 0.5;
}
// 《长夜》的结局后面不写结局名、不写说明，只留“按 R 回到最后的选择”。white：画面已经全白（拉闸），字换成深色
function showEndBare(zone, white) {
  endTexts(); endZone = zone; state = 'end';
  const el = $('end'); el.classList.add('bare'); el.classList.toggle('white', !!white); el.classList.remove('hide');
}

{ // 胶片颗粒：一张噪点图铺满屏幕，每隔一帧随机挪一下位置
  const [c, g] = mkCanvas(256, 256), im = g.createImageData(256, 256);
  for (let i = 0; i < im.data.length; i += 4) { const v = Math.random() * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
  g.putImageData(im, 0, 0); $('grain').style.backgroundImage = `url(${c.toDataURL()})`;
}
