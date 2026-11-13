
// ---- 程序化动画：不用预先做好的动作，每帧根据速度、是否腾空等状态算出姿势 ----
// 两节肢体的反向运动学：从关节 (hx,hy) 伸向目标 (tx,ty)，返回 [上段角度, 下段相对角度]
function ik2(hx, hy, tx, ty, l1, l2, bendFwd) {
  const dx = tx - hx, dy = ty - hy, d = clamp(Math.hypot(dx, dy), Math.abs(l1 - l2) + 1e-3, l1 + l2 - 1e-3);
  const base = Math.atan2(dx, -dy);
  const a1 = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
  const c = Math.acos(clamp((l1 * l1 + l2 * l2 - d * d) / (2 * l1 * l2), -1, 1));
  return bendFwd ? [base + a1, -(Math.PI - c)] : [base - a1, Math.PI - c];    // 膝盖向前弯，手肘向后弯
}

const hash1 = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };   // 0..1 的固定“随机”数

const NOPOSE = {};
// o.npc：路上的其他角色（不带光源）；o.parent：挂到哪个节点下（章节卸载时一起清掉）
function makeCharacter(kind, prev, o = {}) {
  const B = buildBody(kind, o), { u, D, root, pelvis, spine, chest, head, tail, arms, legs } = B;
  // 动画的内部状态（换外形时沿用上一个角色的，避免跳变）
  const A = prev ? prev.A : { ph: 0, yaw: 0, run: 0, mv: 0, air: 0, lean: 0, sq: 0, sqv: 0, pvx: 0, acc: 0, grip: 0, tuck: 0, ta: -0.5, tv: 0, look: 0 };
  A.cover ??= 0; A.dip ??= 0;                                               // 07 专用：捂灯的程度、落地时灯被震暗的程度
  A.swim ??= 0; A.pitch ??= 0;                                              // 游泳：在水里的程度、身子放平了多少（0 竖着，π/2 平躺）
  (o.parent ?? scene).add(root);

  function update(dt, s) {
    const dir = s.facing, sp = Math.abs(s.vx), fwd = s.vx * dir, t = s.t;
    const push = s.mode === 'push', mant = s.mode === 'mantle';
    // 额外的姿势（NPC 的表演，以及结局里的 07）：sit 坐下 / bow 弯腰 / limp 断电垂头 / arms 直接给手臂角度 / reach 伸手够某一点 / look 头转向
    const q = s.pose || NOPOSE, sit = q.sit || 0, limp = q.limp || 0;
    A.yaw = damp(A.yaw, dir > 0 ? 0 : -Math.PI, 13, dt); root.rotation.y = A.yaw;
    root.position.set(s.x, s.y, s.z ?? 0);
    A.run = damp(A.run, sstep(1.5, 3.0, sp), 8, dt);
    A.mv = damp(A.mv, sstep(0.04, 0.5, sp), 12, dt);
    A.air = damp(A.air, s.grounded || mant ? 0 : 1, s.grounded ? 24 : 12, dt);
    A.grip = damp(A.grip, push || (mant && s.modeT < 0.72) ? 1 : 0, 14, dt);
    A.tuck = damp(A.tuck, mant ? (s.modeT < 0.8 ? 1 : 0) : 0, 12, dt);
    A.cover = damp(A.cover, B.lamp ? clamp(s.hide || 0, 0, 1) * (1 - A.air) * (1 - A.grip) : 0, 6, dt);   // 躲藏：弓起身子，用手捂住胸口的灯
    A.acc = damp(A.acc, clamp((s.vx - A.pvx) / Math.max(dt, 1e-4) * dir, -30, 30), 10, dt); A.pvx = s.vx;
    A.swim = damp(A.swim, s.mode === 'swim' ? 1 : 0, s.mode === 'swim' ? 6 : 9, dt);
    if (s.mode !== 'swim') A.pitch = damp(A.pitch, 0, 9, dt);

    // 步态：按“走过的距离”推进相位，所以脚踩在地上时不会打滑
    const duty = lerp(0.62, 0.37, A.run), stride = lerp(0.4, 0.5, A.run) * u;
    A.ph = ((A.ph + fwd * dt * duty / stride) % 1 + 1) % 1;
    const bobPh = Math.cos(4 * Math.PI * (A.ph - duty / 2));
    const bob = lerp(0.012, -0.03, A.run) * u * bobPh * A.mv * (1 - A.air);
    if (s.impact > 0) A.sqv -= s.impact * 0.28;                              // 落地：重心被压下去再弹回
    A.sqv += (-A.sq * 230 - A.sqv * 21) * dt; A.sq = clamp(A.sq + A.sqv * dt, -0.2 * u, 0.04 * u);
    let hipY = D.hipY - 0.006 * u - 0.026 * u * A.run * A.mv + bob + A.sq - (push ? 0.035 * u : 0) - 0.06 * u * A.tuck - 0.03 * u * A.cover;
    const hipStand = hipY;
    if (sit) hipY = lerp(hipY, (q.sitH ?? 0.3) * u, sit);
    const sitDrop = hipY - hipStand;                                          // 坐下时重心降了多少（主角的模型不挂在骨盆上，要自己跟着降）
    pelvis.position.set(0, hipY, 0);

    // 上身前倾：跑得越快、加速越猛就越前倾；推车时压低身体，拉车时后仰
    let leanT = (lerp(0.05, 0.2, A.run) * A.mv + clamp(A.acc * 0.011, -0.12, 0.16)) * (fwd < -0.05 ? -0.4 : 1);
    if (push) leanT = fwd > 0.1 ? 0.42 : fwd < -0.1 ? -0.2 : 0.16;
    if (mant) leanT = 0.3;
    leanT = lerp(leanT, 0.1 - clamp(s.vy * 0.02, -0.12, 0.12), A.air);
    if (B.S.robot && !push && !mant) leanT += 0.055 * (1 - A.air);
    if (B.S.slouch && !push && !mant) leanT += B.S.slouch * (1 - A.air) * (1 - A.run);
    leanT += 0.2 * A.cover + (q.bow || 0) + 0.22 * limp;
    leanT *= 1 - A.swim;
    A.lean = damp(A.lean, leanT, 9, dt);
    spine.rotation.z = -A.lean;
    spine.position.y = 0.004 * u * Math.sin(t * 1.7) * (1 - A.mv) * (1 - limp);   // 站着时的呼吸
    chest.rotation.y = 0.2 * A.mv * lerp(0.5, 1, A.run) * Math.sin(2 * Math.PI * A.ph) * (1 - A.grip);
    if (B.traveler?.group) {
      B.traveler.group.position.y = B.traveler.baseY + bob + sitDrop;
      B.traveler.group.rotation.z = -A.lean;
    }

    // 腿：先算出脚踝的目标位置，再用 IK 解出大腿和膝盖的角度
    const slope = clamp(s.slope * dir, -0.6, 0.6), rise = sstep(-2.5, 3.5, s.vy), lift = lerp(0.055, 0.2, A.run) * u;
    for (let i = 0; i < 2; i++) {
      const p = (A.ph + i * 0.5) % 1; let fx, fy, pitch;
      if (p < duty) {                                                        // 支撑期：脚相对身体匀速向后
        const k = p / duty, toe = sstep(0.68, 1, k) * (0.35 + 0.65 * A.run);
        fx = lerp(0.42, -0.58, k) * stride; fy = toe * 0.04 * u; pitch = -toe * 0.6;
      } else {                                                               // 摆动期：抬脚向前迈
        const k = (p - duty) / (1 - duty), e = k * k * (3 - 2 * k);
        fx = lerp(-0.58, 0.42, e) * stride; fy = lift * 4 * k * (1 - k) * (1.35 - 0.7 * k); pitch = lerp(-0.7, 0.28, k) * (0.3 + 0.7 * A.run);
      }
      const idleX = (i ? -0.03 : 0.034) * u;
      fx = lerp(idleX, fx, A.mv); fy *= A.mv; pitch = pitch * A.mv + Math.atan(slope);
      let tx = fx, ty = fy + fx * slope + D.ankle;
      // 腾空：一条腿屈膝在前，一条腿拖在后；下落时两腿伸开准备着地
      const ax = i ? lerp(-0.07, -0.12, rise) : lerp(0.06, 0.14, rise), ay = i ? lerp(-0.455, -0.4, rise) : lerp(-0.43, -0.3, rise);
      tx = lerp(tx, ax * u, A.air); ty = lerp(ty, hipY + ay * u, A.air); pitch = lerp(pitch, -0.45, A.air);
      // 攀爬：收腿
      tx = lerp(tx, (i ? 0.03 : 0.12) * u, A.tuck); ty = lerp(ty, hipY + (i ? -0.4 : -0.27) * u, A.tuck);
      if (sit) { tx = lerp(tx, (i ? 0.19 : 0.26) * u * (q.sitLeg ?? 1), sit); ty = lerp(ty, D.ankle, sit); pitch = lerp(pitch, 0, sit); }   // 坐着：两只脚搁在身前的地上
      const L = legs[i], [th, kn] = ik2(0, hipY - 0.005 * u, tx, ty, D.thigh, D.shin, true);
      L.hip.rotation.z = th; L.knee.rotation.z = kn; L.foot.rotation.z = -(th + kn) + pitch;
    }

    // 手臂：平时前后摆动；推车 / 攀爬时用 IK 伸向抓握点
    const shX = Math.sin(A.lean) * D.shY, shY = hipY + Math.cos(A.lean) * D.shY - 0.012 * u;
    const cl = Math.cos(A.lean), sl = Math.sin(A.lean), Lm = B.lamp;         // 灯在角色坐标里的位置（跟着上身前倾）
    const lampX = Lm ? Lm.x * cl + Lm.y * sl : 0, lampY = Lm ? hipY + Lm.y * cl - Lm.x * sl : 0;
    for (let i = 0; i < 2; i++) {
      const sw = -Math.cos(2 * Math.PI * (A.ph + i * 0.5) - 0.35);            // 和同侧的腿反着摆
      let a = (lerp(0.32, 0.95, A.run) * sw + lerp(0, 0.1, A.run)) * A.mv + 0.03 * Math.sin(t * 1.3 + i * 2) * (1 - A.mv);
      let b = lerp(0.14, lerp(0.3, 1.5, A.run), A.mv) + 0.3 * Math.max(0, sw) * A.mv;
      a = lerp(a, i ? lerp(0.5, -0.45, rise) : lerp(0.75, 1.25, rise), A.air); b = lerp(b, 0.7, A.air);
      if (A.grip > 0.01 && s.hand) {
        const [ua, fa] = ik2(shX, shY, (s.hand.x - s.x) * dir, s.hand.y - s.y + (i ? 0 : 0.012 * u), D.uarm, D.farm + 0.02 * u, false);
        a = lerp(a, ua + A.lean, A.grip); b = lerp(b, fa, A.grip);
      } else a += A.lean * 0.5;
      if (A.cover > 0.01) {                                                  // 两只手一上一下拢在灯前面
        const [ua, fa] = ik2(shX, shY, lampX + (i ? 0.03 : 0.042) * u, lampY + (i ? -0.03 : 0.01) * u, D.uarm, D.farm + 0.02 * u, false);
        a = lerp(a, ua + A.lean, A.cover); b = lerp(b, fa, A.cover);
      }
      if (limp) { a = lerp(a, A.lean, limp); b = lerp(b, 0.06, limp); }      // 断电：手臂直直垂着
      if (q.reach && (q.reach.i === undefined || q.reach.i === i)) {         // 伸手去够世界里的一点
        const [ua, fa] = ik2(shX, shY, (q.reach.x - s.x) * dir, q.reach.y - s.y, D.uarm, D.farm + 0.02 * u, false), k = q.reach.k ?? 1;
        a = lerp(a, ua + A.lean, k); b = lerp(b, fa, k);
      }
      if (q.arms && q.arms[i]) { const o = q.arms[i], k = o.k ?? 1; a = lerp(a, o.a, k); b = lerp(b, o.b, k); }
      const R = arms[i]; R.sh.rotation.z = a; R.el.rotation.z = b;
      R.sh.rotation.x = (i ? 1 : -1) * (0.1 + 0.28 * A.air) * (1 - A.grip) * (1 - A.cover); R.sh.rotation.y = (i ? -1 : 1) * 0.45 * A.cover;
    }

    // 头：保持水平；站着时偶尔左右看看；被灯照到时扭头看向光源
    A.look = damp(A.look, q.look !== undefined ? q.look : s.alert > 0.05 ? dir * 1.0 : A.cover > 0.3 ? dir * 0.5 : 0.3 * Math.sin(t * 0.37) * Math.sin(t * 0.13 + 1) * (1 - A.mv) * (1 - limp), 6, dt);
    head.rotation.set(0, A.look, A.lean * 0.62 + 0.03 * bobPh * A.mv - (B.S.robot ? 0.10 : B.S.slouch ? 1.4 * B.S.slouch * (1 - A.run) : 0) - 0.12 * A.cover - 0.5 * limp + (q.nod || 0));
    // ---- 游泳：在水下身子放平，蛙泳 —— 两手往前伸直、往两边划回胸前，两腿收起来再往后一蹬，然后滑一下；
    //      浮在水面上身子竖起来，两手在身前一前一后地拨水，两腿像蹬自行车一样踩水；在水下停着不动就斜着身子慢慢划 ----
    if (A.swim > 0.002) {
      const k = A.swim, w = s.swim || A.lastSwim || { ph: 0, vx: 0, vy: 0, c: 0.6, top: 0, panic: 0 }; if (s.swim) A.lastSwim = s.swim;
      const p = w.ph, mv = sstep(0.15, 0.9, Math.hypot(w.vx, w.vy)), top = w.top, still = (1 - mv) * (1 - top), tread = top * (1 - mv);
      const flat = clamp(Math.PI / 2 - 0.9 * Math.atan2(w.vy, Math.abs(w.vx) + 0.12), 0.35, 2.3);         // 往上游时抬起身子，往下潜时头朝下
      if (s.mode === 'swim') A.pitch = damp(A.pitch, lerp(lerp(0.75, flat, mv), lerp(0.18, 1.0, mv), top), 4.5, dt);
      // 蛙泳的一圈：0–0.32 两手划回胸前（手肘弯起来），0.32–0.48 两手往前伸直；0.18–0.42 收腿，0.42–0.56 往后蹬；剩下的滑行
      const pull = p < 0.32 ? sstep(0, 0.32, p) : 1 - sstep(0.32, 0.48, p), bend = p < 0.32 ? sstep(0.05, 0.3, p) : 1 - sstep(0.38, 0.48, p);
      const tuck = p < 0.18 ? 0 : p < 0.42 ? sstep(0.18, 0.42, p) : 1 - sstep(0.42, 0.56, p);
      for (let i = 0; i < 2; i++) {
        const R = arms[i], L = legs[i], o = i ? 1 : -1, ph = p * 6.2832 + i * Math.PI;
        let a = lerp(3.0, 1.15, pull) + o * 0.03, b = lerp(0.1, 1.75, bend);
        a = lerp(a, 1.15 + 0.32 * Math.sin(ph), tread); b = lerp(b, 1.05 + 0.3 * Math.sin(ph + 1.2), tread);
        a = lerp(a, 1.8 + 0.4 * Math.sin(ph), still * 0.7); b = lerp(b, 0.9, still * 0.7);
        if (w.panic > 0) { a += w.panic * 0.45 * Math.sin(t * 9 + i * 2); b += w.panic * 0.3 * Math.sin(t * 11 + i); }      // 憋不住了：手乱划
        R.sh.rotation.z = lerp(R.sh.rotation.z, a, k); R.el.rotation.z = lerp(R.el.rotation.z, b, k); R.sh.rotation.x = lerp(R.sh.rotation.x, o * 0.12 * (1 - pull), k); R.sh.rotation.y = lerp(R.sh.rotation.y, 0, k);
        let th = lerp(-0.05, 0.6, tuck) + o * 0.04, kn = lerp(-0.05, -1.95, tuck), ft = lerp(-1.2, 0.05, tuck);
        th = lerp(th, 0.5 + 0.35 * Math.sin(ph), tread); kn = lerp(kn, -1.05 - 0.5 * Math.sin(ph + 0.7), tread); ft = lerp(ft, -0.5, tread);
        th = lerp(th, 0.15 + 0.15 * Math.sin(ph * 0.7), still * 0.7); kn = lerp(kn, -0.5 - 0.3 * Math.sin(ph * 0.7 + 1), still * 0.7);
        L.hip.rotation.z = lerp(L.hip.rotation.z, th, k); L.knee.rotation.z = lerp(L.knee.rotation.z, kn, k); L.foot.rotation.z = lerp(L.foot.rotation.z, ft, k);
      }
      spine.rotation.z = lerp(spine.rotation.z, (0.25 + 0.2 * Math.sin(p * 6.2832) * mv) * clamp(A.pitch / 1.5, 0, 1), k);   // 背微微拱起来
      head.rotation.z = lerp(head.rotation.z, 0.8 * A.pitch, k); head.rotation.y = lerp(head.rotation.y, 0, k);                // 抬着头往前看
    }
    // 整个人绕着身体的中点转（不在水里时 A.pitch 回到 0）
    root.rotation.z = -A.pitch;
    if (A.pitch > 1e-4) { const c = s.swim?.c ?? A.lastSwim?.c ?? 0.6, sp = Math.sin(A.pitch) * c; root.position.x -= sp * Math.cos(A.yaw); root.position.z += sp * Math.sin(A.yaw); root.position.y += c - Math.cos(A.pitch) * c; }
    if (tail) {                                                              // 马尾：一个小弹簧，跑起来向后飘，下落时扬起
      const target = -0.5 - clamp(fwd * 0.2, -0.3, 0.75) + clamp(s.vy * 0.07, -0.6, 0.5) + 0.18 * bobPh * A.mv;
      A.tv += ((target - A.ta) * 70 - A.tv * 8) * dt; A.ta = clamp(A.ta + A.tv * dt, -2.2, 0.4);
      tail.rotation.z = A.ta - A.lean * 0.6; tail.userData.t2.rotation.z = (A.ta - target) * 0.7 - 0.25;
    }
    if (Lm) {                                                                // 07 胸口的灯：它的“表情”全在这盏灯上
      A.dip = Math.max(damp(A.dip, 0, 7, dt), clamp((s.impact - 5) * 0.14, 0, 1));   // 普通跳跃落地只晃一下，从高处摔下来才会暗得厉害
      const en = s.energy ?? 1, steady = en > 1.05;                          // 剩余电量：一路上帮别人，灯一档一档暗下去；修复以后稳稳地亮着
      let L = 1 + 0.07 * Math.sin(t * 1.7);                                  // 平时：跟着呼吸一明一暗
      const slot = Math.floor(t / 0.85);                                     // 老了，电压不稳：隔几秒闪两下；电越少闪得越勤
      if (!steady && hash1(slot) < 0.14 + 0.3 * clamp(1 - en, 0, 1) && t / 0.85 - slot < 0.34) L *= hash1(Math.floor(t * 31)) < 0.5 ? 0.3 : 0.9;
      L *= Math.min(en, 1.15);
      L *= 1 - 0.75 * A.dip * (0.55 + 0.45 * Math.sin(t * 71));              // 重重落地：被震得一暗
      L = lerp(L, 0.5 + 0.8 * hash1(Math.floor(t * 26) + 7), sstep(0.05, 0.6, s.alert || 0));   // 被探照灯盯上：慌乱地闪
      const k = clamp(L, 0, 1), out = L * lerp(1, 0.14, A.cover), ko = clamp(out, 0, 1);       // out：捂住以后漏出来的光
      Lm.lens.material.color.copy(Lm.dim).lerp(Lm.lit, k);
      Lm.halo.material.opacity = 0.9 * ko; Lm.halo.scale.setScalar(Lm.haloSize * (0.8 + 0.25 * out));
      Lm.aura.material.opacity = Lm.auraOp * sstep(0.2, 1, out); Lm.aura.position.z = Math.cos(A.yaw) * 0.14 * u;
      Lm.beam.intensity = Lm.I * out; Lm.fill.intensity = Lm.fillI * out;
    }
    if (B.traveler?.model) {
      const traveler = B.traveler;
      // Convert the mesh's side-view swing axis into each bone parent's local space.
      const worldAxis = new THREE.Vector3(1, 0, 0).applyQuaternion(traveler.model.getWorldQuaternion(new THREE.Quaternion()));
      const up = new THREE.Vector3(0, 1, 0);
      const poseBone = (name, angle, turn = 0) => {
        const entry = traveler.bones.get(name);
        if (!entry) return;
        const parentQ = entry.node.parent.getWorldQuaternion(new THREE.Quaternion()).invert();
        const axis = worldAxis.clone().applyQuaternion(parentQ).normalize();
        entry.node.quaternion.copy(entry.rest).premultiply(new THREE.Quaternion().setFromAxisAngle(axis, -angle));
        if (turn) entry.node.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(up.clone().applyQuaternion(parentQ).normalize(), turn));   // 左右转：绕竖直方向
        entry.node.updateWorldMatrix(false, true);
      };
      poseBone('Spine', spine.rotation.z * .35);
      poseBone('neck', head.rotation.z * .35 * A.swim, head.rotation.y * .35);   // 站着张望、被灯照到时扭头：脖子先带三成，头转剩下的（游泳时抬头也分给脖子三成）
      poseBone('Head', head.rotation.z * (1 - .35 * A.swim), head.rotation.y * .65);
      for (let i = 0; i < 2; i++) {
        const side = i ? 'Right' : 'Left';
        poseBone(side + 'UpLeg', legs[i].hip.rotation.z);
        poseBone(side + 'Leg', legs[i].knee.rotation.z);
        poseBone(side + 'Foot', legs[i].foot.rotation.z);
        poseBone(side + 'Arm', arms[i].sh.rotation.z);
        poseBone(side + 'ForeArm', arms[i].el.rotation.z);
      }
    }
  }
  function dispose() { root.parent && root.parent.remove(root); root.traverse(o => { if (o.geometry && !o.userData.travelerShared) o.geometry.dispose(); if (o.userData.travelerOwned) { for (const material of (Array.isArray(o.material) ? o.material : [o.material])) material.dispose(); } if (o.isSkinnedMesh) o.skeleton.dispose(); }); }
  return { kind, B, A, root, H: u, update, dispose };
}
