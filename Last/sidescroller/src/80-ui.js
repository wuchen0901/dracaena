
// ============================================================
//  界面：提示 / 章节卡 / 章节菜单 / 存档 / 结局
// ============================================================
const SAVE_KEY = 'rust-glimmer-save-v1';
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
const CN = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];
const chapEl = $('chap'); let chapT = 0;
function showChapter(c) { chapEl.innerHTML = `<i>第${CN[c.n - 1]}章</i><b>${c.name}</b><span>${c.sub}</span>`; chapEl.classList.add('on'); chapT = 4.5; }
function stepChapterCard(dt) { if (chapT > 0 && (chapT -= dt) <= 0) chapEl.classList.remove('on'); }

// ---- 声音开关的提示：右上角的黑边里淡淡地出现一会儿（现阶段默认静音，开始游戏时提醒一次按 M 打开）----
const sndEl = $('snd'); let sndTO = 0;
function soundNote(first) {
  sndEl.innerHTML = !muted ? '声音 开' : first ? (touchMode ? '声音关着　点最右边的小喇叭打开' : '声音关着　按 <b>M</b> 打开') : '声音 关';
  sndEl.classList.add('on'); clearTimeout(sndTO); sndTO = setTimeout(() => sndEl.classList.remove('on'), first ? 5000 : 1800);
}

// ---- 从某一章的开头开始 ----
// 跳过去的章节按“都帮了”来算；这一章和后面的章节回到初始状态
const SKIP = { 3: s => { s.cat = true; }, 4: s => { s.fed = true; }, 5: s => { s.cleaner = s.cleaner || 1; }, 6: s => { s.pump = true; s.water = true; }, 7: s => { s.wild = true; } };
const UNDO = { 3: s => { s.cat = false; }, 4: s => { s.fed = false; }, 5: s => { s.cleaner = 0; }, 6: s => { s.pump = false; s.water = false; }, 7: s => { s.wild = false; }, 8: s => { s.ending = 0; } };
const energyFor = n => [1, 1, 0.94, 0.86, 0.78, 0.7, 0.62, 0.54, 0.54][n - 1];      // 07 的灯：每帮别人一次，暗一档
function startChapter(n, o = {}) {
  const c = CHAPTERS[n - 1];
  for (let k = 1; k <= CHAPTERS.length; k++) { if (k < n) { if (k > (STORY.done ?? 0) && SKIP[k]) SKIP[k](STORY); } else if (UNDO[k]) UNDO[k](STORY); }
  STORY.done = n - 1; STORY.ch = n; saveGame();
  for (const z of ZONES) { if (z.n < n) z.solve(); else z.reset(); }
  placePlayer(c.start); P.cp = cpAt(c.start + 0.01); resetPant();
  Object.assign(P, { moved: n > 1, jumped: n > 1, pushed: n > 1, used: n > 1 });
  if (STORY.cat) catPlace(c.start - 0.9, floorY(c.start - 0.9, P.y + 0.1)); else if (n > 3) CAT.state = 'none';
  ctl = true; autoDir = 0; state = 'play'; envMod = null; camOvr = null; fadeThen = null;
  $('end').classList.add('hide'); $('fade').style.opacity = 0;
  if (c.intro) c.intro();
  snapCamera(); applyEnv(camera.position.x); streamZones(cam.x, true);
  if (!o.quiet) showChapter(c);
}

// ---- 章节菜单（Esc）----
let menuOpen = false, menuSel = 0;
const menuEl = $('menu'), menuList = $('menulist');
function drawMenu() { menuList.innerHTML = CHAPTERS.map((c, i) => `<div class="it${i === menuSel ? ' sel' : ''}" data-i="${i}"><i>${CN[i]}</i><b>${c.name}</b><span>${c.sub}</span></div>`).join(''); }
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
function showEnd(sub, txt) {
  $('endsub').textContent = sub; $('endtxt').innerHTML = txt; $('end').classList.remove('hide'); $('fade').style.opacity = 0.5;
}

{ // 胶片颗粒：一张噪点图铺满屏幕，每隔一帧随机挪一下位置
  const [c, g] = mkCanvas(256, 256), im = g.createImageData(256, 256);
  for (let i = 0; i < im.data.length; i += 4) { const v = Math.random() * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
  g.putImageData(im, 0, 0); $('grain').style.backgroundImage = `url(${c.toDataURL()})`;
}
