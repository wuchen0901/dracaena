
// ============================================================
//  玩家控制：移动 / 跳跃 / 攀爬 / 推车 / 拉杆 / 探照灯
// ============================================================
const GRAV = 23, JUMP_V = 7.5, RUN = 3.3, WALK = 1.25, PUSH = 1.25;
let hero = makeCharacter('B'), state = 'title', T = 0, ctl = true, autoDir = 0;
const sfx = {};                                   // 音效函数在后面的音频部分填进来
const fx = (name, ...a) => { if (sfx[name]) sfx[name](...a); };
function fitHero() { P.H = hero.H; P.hh = hero.H * 0.9; }
fitHero();
function setSkin(k) {
  if (hero.kind !== k) { const prev = hero; prev.dispose(); hero = makeCharacter(k, prev); fitHero(); }
  document.querySelectorAll('#skins button').forEach(b => b.classList.toggle('on', b.dataset.k === hero.kind));
}

function startMantle(s, side) {                   // 抓住方块 s 的边缘翻上去；side = 1 表示方块在右边
  const ex = side > 0 ? s.x1 : s.x2, h = s.y2 - P.y;
  P.mantle = { x0: P.x, y0: P.y, x1: ex + side * (P.hw + 0.12), top: s.y2, ex, T: 0.5 + 0.3 * clamp(h / 1.5, 0, 1) };
  P.mode = 'mantle'; P.modeT = 0; P.vx = P.vy = 0; P.facing = side; fx('grab');
}

function stepPlayer(dt) {
  const d = ctl ? (keys.has('R') ? 1 : 0) - (keys.has('L') ? 1 : 0) : autoDir;      // autoDir：结尾时自动往前走几步
  P.impact = 0;
  if (ctl && pressed.has('J')) P.jumpBuf = 0.13;
  P.jumpBuf -= dt; P.coyote -= dt;

  if (P.mode === 'mantle') {                      // 攀爬是一段固定的动作：先向上，再翻过去
    const m = P.mantle; P.modeT += dt; const k = P.modeT / m.T, e = sstep(0, 1, Math.min(1, k / 0.8));
    P.y = lerp(m.y0, m.top, e); P.x = lerp(m.x0, m.x1, sstep(0.45, 1, k));
    if (k >= 1) { P.mode = 'normal'; P.grounded = true; P.y = m.top; P.vy = 0; P.coyote = 0; }
    return;
  }

  if (P.mode === 'push') {                        // 抓着推车：人和车一起慢慢移动
    const side = P.grab, want = (side > 0 ? cart.x1 : cart.x2) - side * (P.hw + 0.2);
    if (!keys.has('E') || !ctl || !P.grounded) { P.mode = 'normal'; cart.v = 0; return; }
    cart.v = damp(cart.v, d * PUSH, 7, dt);
    let nx = clamp(cart.x + cart.v * dt, cart.min, cart.max), dx = nx - cart.x;
    cart.off = true; if (sideHit(P.x + dx, P.y)) dx = 0; cart.off = false;     // 人被别的东西挡住，车也就拉不动了
    if (dx === 0) cart.v = damp(cart.v, 0, 20, dt);
    cart.x += dx; syncCart();
    P.x = damp(P.x + dx, want + dx, 14, dt); P.vx = dx / dt; P.facing = side;
    if (Math.abs(dx) > 1e-5) P.pushed = true;
    return;
  }

  // ---- 普通状态 ----
  const speed = keys.has('S') || !ctl ? WALK : RUN;
  P.vx = damp(P.vx, d * speed, P.grounded ? (d ? 9 : 14) : 3.5, dt);
  if (d) { P.facing = d; P.moved = true; }
  if (Math.abs(P.vx) < 0.02 && !d) P.vx = 0;

  if (P.jumpBuf > 0 && (P.grounded || P.coyote > 0)) {
    P.vy = JUMP_V; P.grounded = false; P.jumpBuf = 0; P.coyote = 0; P.jumped = true; fx('jump');
  }
  if (!P.grounded && P.vy > 0 && !(ctl && keys.has('J'))) P.vy -= GRAV * 1.3 * dt;   // 松开跳跃键就跳得矮一些

  // 水平移动，被方块侧面挡住
  let nx = P.x + P.vx * dt; const hit = sideHit(nx, P.y);
  if (hit) {
    const side = P.vx > 0 ? 1 : -1;
    nx = side > 0 ? hit.x1 - P.hw - 1e-3 : hit.x2 + P.hw + 1e-3;
    const h = hit.y2 - P.y;                      // 腾空时贴着墙、够得着边缘就攀上去
    if (!P.grounded && d === side && h > 0.25 && h < 1.2 * P.H && P.vy < 4.5 && hit.x2 - hit.x1 > 0.6) { P.x = nx; startMantle(hit, side); return; }
    P.vx = 0;
  }
  P.x = nx;

  // 垂直方向：贴地行走，或者受重力下落
  const f = floorY(P.x, P.y);
  if (P.grounded) {
    if (f < P.y - 0.3) { P.grounded = false; P.coyote = 0.1; P.gy = P.y; } else P.y = f;
  }
  if (!P.grounded) {
    P.vy -= GRAV * dt; const ny = P.y + P.vy * dt;
    if (P.vy <= 0 && ny <= f) { P.y = f; P.impact = -P.vy; P.vy = 0; P.grounded = true; fx('land', P.impact); }
    else P.y = ny;
  } else { P.vy = 0; P.gy = P.y; }

  // 抓推车 / 拉拉杆
  if (ctl && P.grounded && keys.has('E')) {
    const gr = cart.x1 - (P.x + P.hw), gl = (P.x - P.hw) - cart.x2;
    if (Math.abs(P.y - cart.y1) < 0.06 && ((gr > -0.06 && gr < 0.45) || (gl > -0.06 && gl < 0.45))) { P.mode = 'push'; P.grab = gr > -0.06 && gr < 0.45 ? 1 : -1; P.facing = P.grab; cart.v = 0; }
    else if (!LEVER.pulled && Math.abs(P.x - LEVER.x) < 0.95 && pressed.has('E')) { LEVER.pulled = true; door.opening = true; fx('lever'); }
  }
  for (let i = CHECKPOINTS.length - 1; i > P.cp; i--) if (P.grounded && P.x >= CHECKPOINTS[i]) { P.cp = i; break; }
}

function stepWorld(dt) {
  // 推车的轮子、拉杆、大门
  cartG.position.x = cart.x; for (const w of wheels) w.rotation.y = -cart.x / 0.19;
  if (LEVER.pulled) { LEVER.t = Math.min(1, LEVER.t + dt * 3.5); leverArm.rotation.z = lerp(0.7, -0.7, sstep(0, 1, LEVER.t)); leverLampMat.color.set(0x6dff9a); leverLight.color.set(0x6dff9a); }
  if (door.opening && door.open < 1) {
    door.open = Math.min(1, door.open + dt / 2.8); door.y1 = door.open * 3.75; doorMesh.position.y = 1.8 + sstep(0, 1, door.open) * 3.55;
    if (door.open >= 1) fx('doorStop');
  }
  doorGlowMat.opacity = zoneExt > 0.5 ? 0 : 0.96 * sstep(0.02, 0.8, door.open); doorLight.intensity = zoneExt > 0.5 ? 0 : 16 * door.open;
  // 探照灯：来回扫；照到没有遮挡的玩家就开始“盯住”，盯满了就算被发现
  const W = WATCH;
  if (W.caught > 0) {
    W.caught += dt; aimWatcher(P.x, P.y + 0.6, 1);
    if (W.caught > 1.25 && state === 'play') respawn();
    return;
  }
  W.t += dt * W.w * (1 - 0.85 * W.exposure);
  W.bx = W.cx + W.amp * Math.sin(W.t);
  const inYard = P.x > W.cx - W.amp - W.r && P.x < W.cx + W.amp + W.r && P.y < 2.4;
  const lit = state === 'play' && inYard && Math.abs(P.x - W.bx) < W.r * 0.9 && !inShadow(P.x);
  W.exposure = clamp(W.exposure + (lit ? dt / 0.55 : -dt / 0.9), 0, 1);
  if (W.exposure >= 1) { W.caught = 1e-3; ctl = false; fx('alarm'); }
  const k = sstep(0.15, 1, W.exposure);
  aimWatcher(lerp(W.bx, P.x, k), lerp(0.35, P.y + 0.6, k), k);
}

function respawn() {                               // 被发现：黑屏，回到最近的存档点
  state = 'fade'; $('fade').style.opacity = 1;
  setTimeout(() => {
    Object.assign(P, { x: CHECKPOINTS[P.cp], vx: 0, vy: 0, grounded: true, mode: 'normal', facing: 1 }); P.y = floorY(P.x, 50);
    Object.assign(WATCH, { exposure: 0, caught: 0, t: 1.2 });
    snapCamera(); ctl = true; state = 'play'; $('fade').style.opacity = 0;
  }, 1100);
}
