
// ============================================================
//  主角：面数很少、没有五官，靠轮廓和一块颜色认人。所有外形共用同一副骨架
//  角色的局部坐标：面朝 +x，y 向上；所有关节只在侧视平面内转动
// ============================================================
const SKINS = {
  R: { H: 1.24, robot: true },                                                                                // 07：现在的主角，见文件末尾
  O: { H: 1.24, robot: true },                                                                                // 旧版小机器人：只留着做对比
  A: { H: 1.12, skin: 0xe4c5ae, hair: 0x2b2523, top: 0xd98d88, leg: 0x23262a, shoe: 0xb7a996, coat: true },   // 小拾荒者：玫瑰粉连帽外套
  B: { H: 1.24, skin: 0xe4c5ae, hair: 0x3b2c24, top: 0xece6da, leg: 0xb8552a, shoe: 0x1b1b1f, bib: true },    // 学徒：白短袖 + 锈橙背带裤
  C: { H: 1.40, skin: 0xddbaa1, hair: 0x231e1d, top: 0xe5decb, leg: 0x596042, shoe: 0x1b1b1f, mech: true },   // 机械臂：马尾 + 右臂机械臂
  // ---- 路上遇到的人（都是大人：头按比例缩小；颜色压得很灰，不和 07 的灯抢）----
  W: { H: 1.62, skin: 0xcdb09a, hair: 0x2a2624, top: 0x77858a, leg: 0x3d4a52, shoe: 0x1b1b1f, bib: true, hairStyle: 'B', headK: .72, band: 0x7fbf7a },   // 登记劳工：手臂上一圈绿色标记
  E: { H: 1.46, skin: 0xcbb2a0, hair: 0xb9b6ae, top: 0x6f6a60, leg: 0x3a3833, shoe: 0x2a2622, coat: true, hairStyle: 'A', headK: .76, cane: true },      // 被拒绝配给的老人：拄杖
  G: { H: 1.5, skin: 0xcbb2a0, hair: 0xc9c6bd, top: 0x5f6b63, leg: 0x3a3d3a, shoe: 0x2a2622, coat: true, hairStyle: 'B', headK: .76 },                   // 照看清洁机器人的老人
  S: { H: 1.62, skin: 0xb89f8c, hair: 0x3a332d, top: 0x5a5247, leg: 0x34302b, shoe: 0x1f1c19, coat: true, hairStyle: 'B', headK: .72 },                  // 废城里的幸存者
  N: { H: 1.56, skin: 0xd2b6a2, hair: 0x2f2a27, top: 0x7c7468, leg: 0x41443f, shoe: 0x1f1c19, hairStyle: 'C', headK: .74 },                               // 街区的居民
};
const sph = (r, ws = 14, hs = 10) => new THREE.SphereGeometry(r, ws, hs);

function buildBody(kind, o = {}) {
  if (kind === 'R') return buildRobot07(o);
  if (kind === 'O') return buildOldRobot();
  const S = SKINS[kind], u = S.H, hs = S.hairStyle ?? kind;
  const self = c => lam(c, { emissive: c, emissiveIntensity: 0.2 });
  const M = { skin: self(S.skin), hair: lam(S.hair), top: self(S.top), leg: self(S.leg), shoe: lam(S.shoe), metal: lam(0x2a2e33) };
  const D = { thigh: 0.235 * u, shin: 0.235 * u, uarm: 0.158 * u, farm: 0.158 * u, ankle: 0.04 * u, hipY: 0.518 * u, hipZ: 0.058 * u, shY: 0.275 * u, shZ: 0.112 * u };
  const root = new THREE.Group(), pelvis = grp(root, 0, D.hipY, 0), spine = grp(pelvis), chest = grp(spine, 0, D.shY, 0), head = grp(chest, 0, 0.03 * u, 0);
  // 一节肢体：关节处一个小球 + 一段上粗下细的圆柱，从关节向下伸出 len
  const seg = (parent, len, r1, r2, mat) => { add(parent, sph(r1, 10, 8), mat); return add(parent, cy(r1, r2, len, 10), mat, 0, -len / 2, 0); };

  // 躯干、骨盆、脖子、头
  const torso = add(spine, new THREE.CapsuleGeometry(0.082 * u, 0.17 * u, 5, 14), M.top, 0, 0.142 * u, 0); torso.scale.set(0.8, 1, 1.2);
  add(pelvis, sph(0.086 * u), M.leg, 0, 0.005 * u, 0).scale.set(0.86, 0.72, 1.14);
  add(chest, cy(0.027 * u, 0.03 * u, 0.06 * u, 8), M.skin, 0, 0.02 * u, 0);
  const skull = add(head, sph(0.108 * u, 20, 14), M.skin, 0.004 * u, 0.105 * u, 0); skull.scale.set(1, 1.08, 0.94);
  const hc = [0.004 * u, 0.105 * u, 0];                                  // 头的中心
  const cap = (r, theta, tilt) => { const m = add(head, new THREE.SphereGeometry(r, 20, 12, 0, 6.2832, 0, theta), M.hair, ...hc); m.rotation.z = tilt; m.scale.set(1.02, 1.08, 0.98); return m; };
  let tail = null;
  if (hs === 'A') {              // 齐下巴的波波头
    cap(0.119 * u, Math.PI * 0.61, 1.22);
    add(head, sph(0.09 * u), M.hair, -0.04 * u, 0.065 * u, 0).scale.set(0.9, 1.05, 1.22);
  } else if (hs === 'B') {       // 乱糟糟的短发
    cap(0.117 * u, Math.PI * 0.56, 1.1);
    for (const [x, y, z, r] of [[0.05, 0.215, 0.02, 0.04], [0.0, 0.232, -0.03, 0.045], [-0.05, 0.222, 0.03, 0.045], [-0.09, 0.185, -0.02, 0.04], [0.075, 0.185, -0.03, 0.032], [-0.1, 0.13, 0.03, 0.035]])
      add(head, sph(r * u, 8, 6), M.hair, x * u, y * u, z * u);
  } else {                       // 马尾：发根一个小结，后面一条会甩动的辫子
    cap(0.117 * u, Math.PI * 0.58, 1.15);
    add(head, sph(0.034 * u, 8, 6), M.hair, -0.1 * u, 0.15 * u, 0);
    tail = grp(head, -0.112 * u, 0.15 * u, 0);
    add(tail, cy(0.034 * u, 0.022 * u, 0.13 * u, 8), M.hair, 0, -0.065 * u, 0);
    const t2 = grp(tail, 0, -0.13 * u, 0); add(t2, sph(0.022 * u, 8, 6), M.hair); add(t2, cy(0.022 * u, 0.006 * u, 0.13 * u, 8), M.hair, 0, -0.065 * u, 0);
    tail.userData.t2 = t2;
  }

  // 衣服上的大色块
  if (S.coat) {                  // 大了好几号的外套：下摆散开，背后一个兜帽
    const c = add(spine, cy(0.09 * u, 0.138 * u, 0.36 * u, 16), M.top, 0, 0.118 * u, 0); c.scale.set(0.84, 1, 1.1);
    add(spine, sph(0.09 * u), M.top, 0, 0.298 * u, 0).scale.set(0.84, 0.45, 1.1);
    add(spine, sph(0.078 * u), M.top, -0.07 * u, 0.292 * u, 0).scale.set(0.85, 0.95, 1.2);
  }
  if (S.bib) {                   // 背带裤：腰以上一圈 + 前后两块 + 两条背带
    add(spine, cy(0.087 * u, 0.088 * u, 0.15 * u, 16), M.leg, 0, 0.072 * u, 0).scale.set(0.82, 1, 1.22);
    add(spine, bx(0.014 * u, 0.1 * u, 0.115 * u), M.leg, 0.064 * u, 0.185 * u, 0);
    add(spine, bx(0.014 * u, 0.07 * u, 0.115 * u), M.leg, -0.064 * u, 0.17 * u, 0);
    for (const z of [-0.048, 0.048]) add(spine, new THREE.TorusGeometry(0.068 * u, 0.008 * u, 5, 14, Math.PI), M.leg, 0, 0.225 * u, z * u);
  }

  // 手臂（i = 0 是角色的右侧，朝右走时靠近镜头）
  const arms = [0, 1].map(i => {
    const z = i ? -D.shZ : D.shZ, mech = S.mech && i === 0, up = mech ? M.metal : S.coat ? M.top : M.skin, r = S.coat ? 0.037 : mech ? 0.03 : 0.029;
    const sh = grp(chest, 0, -0.012 * u, z); seg(sh, D.uarm, r * u, (r - 0.004) * u, up);
    if (S.bib) add(sh, cy(0.036 * u, 0.037 * u, 0.075 * u, 10), M.top, 0, -0.03 * u, 0);                    // 短袖
    const el = grp(sh, 0, -D.uarm, 0); seg(el, D.farm, (r - 0.003) * u, (r - (S.coat ? 0.004 : 0.008)) * u, up);
    if (mech) {
      add(el, sph(0.036 * u, 10, 8), M.metal);
      add(el, sph(0.014 * u, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffb648 }), 0, 0, 0.034 * u, false); glow(el, 0xffb040, 0.2 * u, 0.7, 0, 0, 0.05 * u);
    }
    add(el, sph(0.027 * u, 10, 8), mech ? M.metal : M.skin, 0, -D.farm - 0.01 * u, 0);                       // 手
    return { sh, el };
  });

  // 腿和脚
  const legs = [0, 1].map(i => {
    const z = i ? -D.hipZ : D.hipZ, r1 = S.coat ? 0.04 : 0.05, r2 = S.coat ? 0.033 : S.bib ? 0.045 : 0.043, r3 = S.coat ? 0.027 : S.bib ? 0.041 : 0.037;
    const hip = grp(pelvis, 0, -0.005 * u, z); seg(hip, D.thigh, r1 * u, r2 * u, M.leg);
    const knee = grp(hip, 0, -D.thigh, 0); seg(knee, D.shin, r2 * u, r3 * u, M.leg);
    const foot = grp(knee, 0, -D.shin, 0);
    const shoe = add(foot, sph(0.046 * u, 12, 8), M.shoe, 0.03 * u, -D.ankle + 0.029 * u, 0); shoe.scale.set(S.coat ? 1.75 : 1.6, S.coat ? 0.74 : 0.63, S.coat ? 1.08 : 0.95);
    if (S.coat) add(foot, cy(0.04 * u, 0.045 * u, 0.075 * u, 10), M.shoe, 0, 0.012 * u, 0);                  // 靴筒
    return { hip, knee, foot };
  });
  if (S.headK) head.scale.setScalar(S.headK);
  if (S.band) for (const A of arms) add(A.sh, cy(0.035 * u, 0.035 * u, 0.032 * u, 10), lam(S.band, { emissive: S.band, emissiveIntensity: 0.35 }), 0, -0.085 * u, 0);
  if (S.cane) add(root, cy(0.012 * u, 0.012 * u, 0.62 * u, 6), M.metal, 0.27 * u, 0.31 * u, 0.1 * u);              // 拐杖立在身前，手搭在上面（见 caneHand）
  return { S, u, D, root, pelvis, spine, chest, head, tail, arms, legs };
}

// 旧版小机器人（方脑袋 + 细杆四肢）。只为了在同一个场景里和 07 对比，确定不要了可以整段删掉
function buildOldRobot() {
 const S=SKINS.O,u=S.H;
 const D={thigh:.25*u,shin:.25*u,uarm:.158*u,farm:.158*u,ankle:.04*u,hipY:.548*u,hipZ:.05*u,shY:.235*u,shZ:.085*u};
 const root=new THREE.Group(),pelvis=grp(root,0,D.hipY,0),spine=grp(pelvis),chest=grp(spine,0,D.shY,0),head=grp(chest,.015*u,.035*u,0);
 const shell=lam(0xcac5b5,{emissive:0xcac5b5,emissiveIntensity:.12}),joint=lam(0x414746);
 const round=(p,w,h,d,x,y,z,m=shell)=>add(p,new THREE.CapsuleGeometry(1,1,4,12),m,x,y,z).scale.set(w/2,h/3,d/2);
 // Rounded rectangular shells made from beveled extruded outlines.
 function plate(p,w,h,d,r,x,y,z,m=shell){
  const shape=new THREE.Shape();shape.moveTo(-w/2+r,-h/2);shape.lineTo(w/2-r,-h/2);shape.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);shape.lineTo(w/2,h/2-r);shape.quadraticCurveTo(w/2,h/2,w/2-r,h/2);shape.lineTo(-w/2+r,h/2);shape.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);shape.lineTo(-w/2,-h/2+r);shape.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);
  const geo=new THREE.ExtrudeGeometry(shape,{depth:d-2*r,bevelEnabled:true,bevelThickness:r,bevelSize:r*.35,bevelSegments:3,steps:1,curveSegments:5});geo.translate(0,0,-(d-2*r)/2);return add(p,geo,m,x,y,z);
 }
 plate(spine,.12*u,.19*u,.15*u,.015*u,0,.12*u,0);
 round(pelvis,.12*u,.06*u,.12*u,0,0,0,joint);
 add(chest,cy(.021*u,.021*u,.07*u,10),joint,0,.02*u,0);
 plate(head,.195*u,.175*u,.245*u,.025*u,0,.105*u,0);
 for(const sign of [-1,1])add(head,sph((sign>0?.013:.010)*u),joint,.104*u,.085*u,sign*.059*u).scale.set(.35,1,1);
 const lamp=new THREE.MeshBasicMaterial({color:0xe5bd79});add(spine,sph(.012*u),lamp,.067*u,.15*u,.026*u).scale.set(.4,1,1);
 function segment(p,len,r){add(p,sph(r*1.15),joint);add(p,cy(r*.8,r*.8,len*.78,10),shell,0,-len/2,0);}
 const arms=[0,1].map(i=>{const sh=grp(chest,0,-.012*u,(i?-1:1)*D.shZ);segment(sh,D.uarm,.021*u);const el=grp(sh,0,-D.uarm,0);segment(el,D.farm,.02*u);round(el,.049*u,.058*u,.046*u,0,-D.farm,0);
  // A single thumb keeps the mitten silhouette legible at gameplay scale.
  round(el,.024*u,.032*u,.026*u,.025*u,-D.farm+.012*u,0);return {sh,el};});
 const legs=[0,1].map(i=>{const hip=grp(pelvis,0,-.005*u,(i?-1:1)*D.hipZ);segment(hip,D.thigh,.023*u);const knee=grp(hip,0,-D.thigh,0);segment(knee,D.shin,.021*u);const foot=grp(knee,0,-D.shin,0);round(foot,.125*u,.048*u,.079*u,.03*u,-D.ankle+.024*u,0);return {hip,knee,foot};});
 return {S,u,D,root,pelvis,spine,chest,head,tail:null,arms,legs};
}


// ============================================================
//  07：量产的旧劳动机器人（主角）。设计说明见 design/protagonist-07.md
//  三条规矩：先看侧面剪影；没有脸；全身只有胸口那盏灯是暖色
//  关节约定和其他外形完全一样，所以行走 / 推车 / 攀爬的动画直接沿用
// ============================================================
// 侧面轮廓 → 实体：在 x-y 平面（x 向前、y 向上）画一圈带圆角的轮廓，再沿身体的左右方向挤出厚度
// pts 里每个点是 [x, y] 或 [x, y, 这个角的圆角半径]
function profileShape(pts, r) {
  const sh = new THREE.Shape(), n = pts.length;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i + n - 1) % n], p1 = pts[i], p2 = pts[(i + 1) % n];
    const a = V3(p0[0] - p1[0], p0[1] - p1[1], 0), b = V3(p2[0] - p1[0], p2[1] - p1[1], 0);
    const k = Math.min(p1[2] ?? r, a.length() / 2, b.length() / 2); a.setLength(k); b.setLength(k);
    sh[i ? 'lineTo' : 'moveTo'](p1[0] + a.x, p1[1] + a.y);
    sh.quadraticCurveTo(p1[0], p1[1], p1[0] + b.x, p1[1] + b.y);
  }
  sh.closePath(); return sh;
}
// 挤出来的模型每个三角面各有各的法线，看上去一棱一棱的。这里把夹角小的相邻面抹平，真正的棱角保留
function smoothNormals(geo, crease = 0.7) {
  const pos = geo.attributes.position, n = pos.count, fn = [], byPos = new Map(), keys = [];
  const a = V3(), b = V3(), c = V3();
  for (let i = 0; i < n; i++) {
    const key = `${Math.round(pos.getX(i) * 2e4)},${Math.round(pos.getY(i) * 2e4)},${Math.round(pos.getZ(i) * 2e4)}`;
    keys.push(key); if (!byPos.has(key)) byPos.set(key, []); byPos.get(key).push(Math.floor(i / 3));
  }
  for (let i = 0; i < n; i += 3) {
    a.fromBufferAttribute(pos, i); b.fromBufferAttribute(pos, i + 1); c.fromBufferAttribute(pos, i + 2);
    const w = b.clone().sub(a).cross(c.clone().sub(a));                 // 长度是面积的两倍，正好用来加权
    fn.push({ w, d: w.clone().normalize() });
  }
  const out = new Float32Array(n * 3), s = V3();
  for (let i = 0; i < n; i++) {
    const me = fn[Math.floor(i / 3)].d; s.set(0, 0, 0);
    for (const f of byPos.get(keys[i])) if (fn[f].d.dot(me) > crease) s.add(fn[f].w);
    s.normalize(); out[i * 3] = s.x; out[i * 3 + 1] = s.y; out[i * 3 + 2] = s.z;
  }
  geo.setAttribute('normal', new THREE.BufferAttribute(out, 3)); return geo;
}
function slab(parent, pts, r, width, mat, bevel = width * 0.16) {
  const geo = new THREE.ExtrudeGeometry(profileShape(pts, r), { depth: width - 2 * bevel, bevelEnabled: true, bevelThickness: bevel,
    bevelSize: bevel, bevelOffset: -bevel, bevelSegments: 3, curveSegments: 6, steps: 1 });
  geo.translate(0, 0, -(width - 2 * bevel) / 2);
  return add(parent, smoothNormals(geo), mat);
}

let _stencil07 = null;
function stencil07() {                                  // 头盔侧面喷的出厂编号：玩的时候只是一小块深色，拉近了才看得清
  if (_stencil07) return _stencil07;
  const [c, g] = mkCanvas(192, 128);
  let seed = 7; const rn = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };   // 自己的随机数，不动关卡用的那一套
  g.fillStyle = 'rgba(30,34,34,.82)'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = '900 108px "Arial Narrow","Helvetica Neue","PingFang SC",Arial,sans-serif';
  g.fillText('07', 96, 70);
  g.globalCompositeOperation = 'destination-out';
  g.fillStyle = '#000'; g.fillRect(0, 62, 192, 7);                                                     // 喷漆模板中间那道“桥”
  for (let i = 0; i < 320; i++) { g.globalAlpha = 0.25 + 0.7 * rn(); g.fillRect(rn() * 192, rn() * 128, 1 + rn() * 5, 1 + rn() * 2.5); }   // 磨掉的漆
  return _stencil07 = canvasTex(c);
}

function buildRobot07(o = {}) {
  const S = SKINS.R, u = S.H, npc = !!o.npc;            // npc：同一批次的其他机器人 —— 和 07 一模一样，只是灯灭着
  // 孩子的比例：腿占身高不到一半，头占五分之一，手垂下来到大腿中段
  const D = { thigh: .205 * u, shin: .205 * u, uarm: .17 * u, farm: .155 * u, ankle: .05 * u, hipY: .461 * u, hipZ: .046 * u, shY: .255 * u, shZ: .1 * u };   // hipY 比腿长略短：站着时膝盖总是微微弯着
  const root = new THREE.Group(), pelvis = grp(root, 0, D.hipY, 0), spine = grp(pelvis), chest = grp(spine, 0, D.shY, 0), head = grp(chest, .02 * u, .027 * u, 0);
  // 外壳带一点自发光：场景再暗，身体的明度也不会掉到看不清；照到强光时又不至于发白
  const paint = c => lam(c, { emissive: c, emissiveIntensity: npc ? .09 : .22 });
  // 只有三个明度：机床灰绿的外壳、深一号的检修盖和靴子、近乎黑的关节 / 手 / 面罩。没有任何别的颜色
  const M = { shell: paint(0x85988b), panel: paint(0x5c6c62), dark: lam(0x1b1f20), visor: lam(0x08090a), sole: lam(0x121415) };
  const U = pts => pts.map(([x, y, r]) => r === undefined ? [x * u, y * u] : [x * u, y * u, r * u]);        // 轮廓坐标都以身高为单位

  // 躯干：上宽下窄，胸口微鼓，背上隆起一块装电池的“驼背”—— 侧面看像个弓着背的小工人
  slab(spine, U([[-.05, .04], [.046, .04], [.07, .13], [.068, .225], [.042, .285], [-.05, .285], [-.108, .238, .04], [-.112, .16, .04], [-.066, .095, .03]]), .026 * u, .17 * u, M.shell);
  slab(spine, U([[-.1, .135], [-.052, .135], [-.052, .222], [-.1, .222]]), .012 * u, .176 * u, M.panel, .004 * u);   // 电池舱的检修盖（两侧各露出一块）
  slab(pelvis, U([[-.04, -.03], [.036, -.03], [.042, .046], [-.046, .046]]), .02 * u, .1 * u, M.dark);
  // 驼背顶上的吊环 —— 回收线就是钩着这只环把它们一台台吊走的
  const eye = add(spine, new THREE.TorusGeometry(.02 * u, .006 * u, 6, 16), M.dark, -.083 * u, .273 * u, 0); eye.rotation.z = .7;

  // 胸口的灯：一颗凸出来的琥珀色指示灯，从侧面也看得见。亮度 = 它还剩多少能量
  const lx = .069 * u, ly = .185 * u;
  add(spine, cy(.031 * u, .031 * u, .014 * u, 18), M.dark, lx - .002 * u, ly, 0).rotation.z = Math.PI / 2;             // 灯座
  const lens = add(spine, sph(.024 * u, 16, 12), new THREE.MeshBasicMaterial({ color: npc ? 0x2e1c10 : 0xffc67e, fog: !npc ? false : true }), lx + .004 * u, ly, 0, false);
  lens.scale.set(.75, 1, 1);
  let lamp = null;
  if (!npc) {
  const halo = glow(spine, 0xffa040, .27 * u, .85, lx + .02 * u, ly, 0);      // 近处的光晕：会被身体和手挡住
  const aura = glow(spine, 0xff9a3c, .62 * u, .16, lx + .02 * u, ly, 0);      // 一圈很淡的大光晕，转身时挪到朝镜头的一侧
  // 真正照亮东西的是两盏灯：一盏朝前下方的射灯（照亮身前的地面和手里的东西，不照自己的胸口），
  // 一盏很弱的点光（让帽檐底下和胸口沾一点暖色）
  const beam = new THREE.SpotLight(0xffab52, 2.4, 4.6, 1.0, 1, 2); beam.position.set(lx + .03 * u, ly, 0);
  beam.target.position.set(lx + .9 * u, ly - .5 * u, 0); spine.add(beam, beam.target);
  const fill = new THREE.PointLight(0xffab52, .1, 1.2, 2); fill.position.set(lx + .1 * u, ly, 0); spine.add(fill);
  lamp = { lens, halo, aura, beam, fill, x: lx + .02 * u, y: ly, I: 2.4, fillI: .1, haloSize: .27 * u, auraOp: .16, dim: new THREE.Color(0x6e3410), lit: new THREE.Color(0xffc67e) };
  }

  // 头：一只扣着安全帽的“桶”。帽檐只往前伸，帽檐下面是一整块深色面罩 —— 没有眼睛，也就没有表情
  add(head, cy(.023 * u, .023 * u, .06 * u, 10), M.dark, 0, .012 * u, 0);                                                 // 脖子
  add(head, cy(.104 * u, .094 * u, .1 * u, 28), M.shell, 0, .085 * u, 0);
  add(head, new THREE.SphereGeometry(.104 * u, 28, 12, 0, 6.2832, 0, Math.PI / 2), M.shell, 0, .135 * u, 0).scale.y = .86;
  const brim = add(head, new THREE.CylinderGeometry(.109 * u, .109 * u, .013 * u, 24, 1, false, 0, Math.PI), M.shell, 0, .134 * u, 0);   // 只有前半圈
  brim.scale.x = 1.56; brim.rotation.z = -.12;
  add(head, new THREE.CylinderGeometry(.1044 * u, .0969 * u, .075 * u, 20, 1, true, .175, 2.79), M.visor, 0, .0895 * u, 0);
  for (const side of [0, 1]) {                                                                                          // 两侧各喷一个编号
    const m = new THREE.MeshLambertMaterial({ map: stencil07(), transparent: true, depthWrite: false });
    add(head, new THREE.CylinderGeometry(.1032 * u, .0977 * u, .055 * u, 8, 1, true, side ? 3.281 : -.838, .698), m, 0, .0875 * u, 0, false);
  }

  // 四肢：细，关节只露出一道深色的缝；越往手脚越粗 —— 像戴着大一号的手套、穿着大一号的靴子
  // gap0 / gap1：这一节外壳的上端、下端各让出多少给关节
  const limb = (p, len, r1, r2, jr, gap0 = .55, gap1 = .45) => {
    add(p, sph(jr, 12, 8), M.dark);
    const y0 = -jr * gap0, y1 = -len + jr * gap1;
    return add(p, cy(r1, r2, y0 - y1, 14), M.shell, 0, (y0 + y1) / 2, 0);
  };
  const arms = [0, 1].map(i => {
    const sh = grp(chest, 0, -.012 * u, (i ? -1 : 1) * D.shZ); limb(sh, D.uarm, .024 * u, .021 * u, .024 * u, .2);
    const el = grp(sh, 0, -D.uarm, 0); limb(el, D.farm, .02 * u, .03 * u, .02 * u, .6, 0);
    add(el, sph(.029 * u, 12, 8), M.dark, .003 * u, -D.farm - .022 * u, 0).scale.set(.8, 1.08, .64);                    // 连指手套一样的手
    add(el, sph(.012 * u, 8, 6), M.dark, .024 * u, -D.farm - .012 * u, 0);                                              // 拇指
    return { sh, el };
  });
  const legs = [0, 1].map(i => {
    const hip = grp(pelvis, 0, -.005 * u, (i ? -1 : 1) * D.hipZ); limb(hip, D.thigh, .034 * u, .028 * u, .03 * u, .35);
    const knee = grp(hip, 0, -D.thigh, 0); limb(knee, D.shin, .026 * u, .035 * u, .027 * u, .6, 0);
    const foot = grp(knee, 0, -D.shin, 0);
    slab(foot, U([[-.048, -.05], [.098, -.05], [.104, -.03], [.066, .002], [.032, .014], [-.044, .014]]), .014 * u, .08 * u, M.panel);
    slab(foot, U([[-.051, -.05], [.106, -.05], [.106, -.037], [-.051, -.037]]), .005 * u, .084 * u, M.sole, .008 * u);
    return { hip, knee, foot };
  });
  return { S, u, D, M, root, pelvis, spine, chest, head, tail: null, arms, legs, lamp };
}
