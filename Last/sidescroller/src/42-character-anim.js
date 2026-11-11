
// ---- 程序化动画：不用预先做好的动作，每帧根据速度、是否腾空等状态算出姿势 ----
// 两节肢体的反向运动学：从关节 (hx,hy) 伸向目标 (tx,ty)，返回 [上段角度, 下段相对角度]
function ik2(hx, hy, tx, ty, l1, l2, bendFwd) {
  const dx = tx - hx, dy = ty - hy, d = clamp(Math.hypot(dx, dy), Math.abs(l1 - l2) + 1e-3, l1 + l2 - 1e-3);
  const base = Math.atan2(dx, -dy);
  const a1 = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
  const c = Math.acos(clamp((l1 * l1 + l2 * l2 - d * d) / (2 * l1 * l2), -1, 1));
  return bendFwd ? [base + a1, -(Math.PI - c)] : [base - a1, Math.PI - c];    // 膝盖向前弯，手肘向后弯
}

function makeCharacter(kind, prev) {
  const B = buildBody(kind), { u, D, root, pelvis, spine, chest, head, tail, arms, legs } = B;
  // 动画的内部状态（换外形时沿用上一个角色的，避免跳变）
  const A = prev ? prev.A : { ph: 0, yaw: 0, run: 0, mv: 0, air: 0, lean: 0, sq: 0, sqv: 0, pvx: 0, acc: 0, grip: 0, tuck: 0, ta: -0.5, tv: 0, look: 0 };
  scene.add(root);

  function update(dt, s) {
    const dir = s.facing, sp = Math.abs(s.vx), fwd = s.vx * dir, t = s.t;
    const push = s.mode === 'push', mant = s.mode === 'mantle';
    A.yaw = damp(A.yaw, dir > 0 ? 0 : -Math.PI, 13, dt); root.rotation.y = A.yaw;
    root.position.set(s.x, s.y, 0);
    A.run = damp(A.run, sstep(1.5, 3.0, sp), 8, dt);
    A.mv = damp(A.mv, sstep(0.04, 0.5, sp), 12, dt);
    A.air = damp(A.air, s.grounded || mant ? 0 : 1, s.grounded ? 24 : 12, dt);
    A.grip = damp(A.grip, push || (mant && s.modeT < 0.72) ? 1 : 0, 14, dt);
    A.tuck = damp(A.tuck, mant ? (s.modeT < 0.8 ? 1 : 0) : 0, 12, dt);
    A.acc = damp(A.acc, clamp((s.vx - A.pvx) / Math.max(dt, 1e-4) * dir, -30, 30), 10, dt); A.pvx = s.vx;

    // 步态：按“走过的距离”推进相位，所以脚踩在地上时不会打滑
    const duty = lerp(0.62, 0.37, A.run), stride = lerp(0.4, 0.5, A.run) * u;
    A.ph = ((A.ph + fwd * dt * duty / stride) % 1 + 1) % 1;
    const bobPh = Math.cos(4 * Math.PI * (A.ph - duty / 2));
    const bob = lerp(0.012, -0.03, A.run) * u * bobPh * A.mv * (1 - A.air);
    if (s.impact > 0) A.sqv -= s.impact * 0.28;                              // 落地：重心被压下去再弹回
    A.sqv += (-A.sq * 230 - A.sqv * 21) * dt; A.sq = clamp(A.sq + A.sqv * dt, -0.2 * u, 0.04 * u);
    const hipY = D.hipY - 0.006 * u - 0.026 * u * A.run * A.mv + bob + A.sq - (push ? 0.035 * u : 0) - 0.06 * u * A.tuck;
    pelvis.position.set(0, hipY, 0);

    // 上身前倾：跑得越快、加速越猛就越前倾；推车时压低身体，拉车时后仰
    let leanT = (lerp(0.05, 0.2, A.run) * A.mv + clamp(A.acc * 0.011, -0.12, 0.16)) * (fwd < -0.05 ? -0.4 : 1);
    if (push) leanT = fwd > 0.1 ? 0.42 : fwd < -0.1 ? -0.2 : 0.16;
    if (mant) leanT = 0.3;
    leanT = lerp(leanT, 0.1 - clamp(s.vy * 0.02, -0.12, 0.12), A.air);
    if (B.S.robot && !push && !mant) leanT += 0.055 * (1 - A.air);
    A.lean = damp(A.lean, leanT, 9, dt);
    spine.rotation.z = -A.lean;
    spine.position.y = 0.004 * u * Math.sin(t * 1.7) * (1 - A.mv);           // 站着时的呼吸
    chest.rotation.y = 0.2 * A.mv * lerp(0.5, 1, A.run) * Math.sin(2 * Math.PI * A.ph) * (1 - A.grip);

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
      const L = legs[i], [th, kn] = ik2(0, hipY - 0.005 * u, tx, ty, D.thigh, D.shin, true);
      L.hip.rotation.z = th; L.knee.rotation.z = kn; L.foot.rotation.z = -(th + kn) + pitch;
    }

    // 手臂：平时前后摆动；推车 / 攀爬时用 IK 伸向抓握点
    const shX = Math.sin(A.lean) * D.shY, shY = hipY + Math.cos(A.lean) * D.shY - 0.012 * u;
    for (let i = 0; i < 2; i++) {
      const sw = -Math.cos(2 * Math.PI * (A.ph + i * 0.5) - 0.35);            // 和同侧的腿反着摆
      let a = (lerp(0.32, 0.95, A.run) * sw + lerp(0, 0.1, A.run)) * A.mv + 0.03 * Math.sin(t * 1.3 + i * 2) * (1 - A.mv);
      let b = lerp(0.14, lerp(0.3, 1.5, A.run), A.mv) + 0.3 * Math.max(0, sw) * A.mv;
      a = lerp(a, i ? lerp(0.5, -0.45, rise) : lerp(0.75, 1.25, rise), A.air); b = lerp(b, 0.7, A.air);
      if (A.grip > 0.01 && s.hand) {
        const [ua, fa] = ik2(shX, shY, (s.hand.x - s.x) * dir, s.hand.y - s.y + (i ? 0 : 0.012 * u), D.uarm, D.farm + 0.02 * u, false);
        a = lerp(a, ua + A.lean, A.grip); b = lerp(b, fa, A.grip);
      } else a += A.lean * 0.5;
      const R = arms[i]; R.sh.rotation.z = a; R.el.rotation.z = b; R.sh.rotation.x = (i ? 1 : -1) * (0.1 + 0.28 * A.air) * (1 - A.grip);
    }

    // 头：保持水平；站着时偶尔左右看看；被灯照到时扭头看向光源
    A.look = damp(A.look, s.alert > 0.05 ? dir * 1.0 : 0.3 * Math.sin(t * 0.37) * Math.sin(t * 0.13 + 1) * (1 - A.mv), 6, dt);
    head.rotation.set(0, A.look, A.lean * 0.62 + 0.03 * bobPh * A.mv - (B.S.robot ? 0.10 : 0));
    if (tail) {                                                              // 马尾：一个小弹簧，跑起来向后飘，下落时扬起
      const target = -0.5 - clamp(fwd * 0.2, -0.3, 0.75) + clamp(s.vy * 0.07, -0.6, 0.5) + 0.18 * bobPh * A.mv;
      A.tv += ((target - A.ta) * 70 - A.tv * 8) * dt; A.ta = clamp(A.ta + A.tv * dt, -2.2, 0.4);
      tail.rotation.z = A.ta - A.lean * 0.6; tail.userData.t2.rotation.z = (A.ta - target) * 0.7 - 0.25;
    }
  }
  function dispose() { scene.remove(root); root.traverse(o => { if (o.geometry) o.geometry.dispose(); }); }
  return { kind, B, A, root, H: u, update, dispose };
}
