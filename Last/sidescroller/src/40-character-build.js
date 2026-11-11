
// ============================================================
//  主角：面数很少、没有五官，靠轮廓和一块颜色认人。三套外形共用同一副骨架
//  角色的局部坐标：面朝 +x，y 向上；所有关节只在侧视平面内转动
// ============================================================
const SKINS = {
  R: { H: 1.24, robot: true },
  A: { H: 1.12, skin: 0xe4c5ae, hair: 0x2b2523, top: 0xd98d88, leg: 0x23262a, shoe: 0xb7a996, coat: true },   // 小拾荒者：玫瑰粉连帽外套
  B: { H: 1.24, skin: 0xe4c5ae, hair: 0x3b2c24, top: 0xece6da, leg: 0xb8552a, shoe: 0x1b1b1f, bib: true },    // 学徒：白短袖 + 锈橙背带裤
  C: { H: 1.40, skin: 0xddbaa1, hair: 0x231e1d, top: 0xe5decb, leg: 0x596042, shoe: 0x1b1b1f, mech: true },   // 机械臂：马尾 + 右臂机械臂
};
const sph = (r, ws = 14, hs = 10) => new THREE.SphereGeometry(r, ws, hs);

function buildBody(kind) {
  if (kind === 'R') return buildSimpleRobot();
  const S = SKINS[kind], u = S.H;
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
  if (kind === 'A') {            // 齐下巴的波波头
    cap(0.119 * u, Math.PI * 0.61, 1.22);
    add(head, sph(0.09 * u), M.hair, -0.04 * u, 0.065 * u, 0).scale.set(0.9, 1.05, 1.22);
  } else if (kind === 'B') {     // 乱糟糟的短发
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
  return { S, u, D, root, pelvis, spine, chest, head, tail, arms, legs };
}

// Same joint contract as the existing player, preserving walking and interaction IK.
function buildSimpleRobot() {
 const S=SKINS.R,u=S.H;
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
