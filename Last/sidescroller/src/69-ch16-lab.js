// 第 24 章 · 水下实验室：海床闸门 → 潜水通道 → 内部水井 → 干燥实验区。
// 接在第 23 章“高台”（69-ch15-drop.js）右边：翻过高墙往太阳那边走，下到海边；?ch=24
const X16 = X15 + 82;                                      // 货运站往右下到海边（src/69-zz-links.js）
const CH16 = (() => {
  const X = X16;
  chapter({ n: OLD + 16, x0: X - 10, start: X + 2, name: '水下实验室', sub: '入口在水底', ground: 'metal', nocat: true });
  terrain([X - 30, 0], [X + 5, 0], [X + 6, -6], [X + 22, -6], [X + 23, -2.6], [X + 42, -2.6]);
  ground(X - 30, 0x152c30); ground(X + 42, 0x243a40);
  const sea = water({ x1: X + 5.05, x2: X + 18, y: -0.4, bot: -6 });
  const well = water({ x1: X + 18, x2: X + 23, y: -3, bot: -6 });
  const hatch = gate({ x: X + 15, y0: -6, h: 2.5, w: 0.5, T: 1.2 });
  // 屋顶和外墙连成实体，不能从水面绕过入口。
  solid({ x1: X + 14.7, x2: X + 18.5, y1: -3.5, y2: 8, noclimb: true });
  solid({ x1: X + 18.5, x2: X + 40, y1: 0.5, y2: 8, noclimb: true });
  solid({ x1: X + 39, x2: X + 40, y1: 0.5, y2: 12, noclimb: true });                // 右墙：门以上（门在下面，见 exitDoor）
  const exitDoor = gate({ id: 'labExit', x: X + 39.5, y0: -2.6, w: 1, h: 3.1, T: 1.6 });   // 往实验室深处去的门：电源恢复以后才开（门外是往上去工厂深处的走廊，src/69-zz-links.js）
  checkpoint(X + 2); checkpoint(X + 24);
  camKeys([X - 20, 20, 1, 1, 0], [X + 8, 20, 0.5, 2, 0], [X + 24, 17, 1.2, 1, 0], [X + 42, 17, 1.2, 1, 0]);
  env(X - 20, { fog: 0x102b35, fogD: 0.025, hemiS: 0x83b5c0, hemiG: 0x102022, hemiI: 0.65, keyI: 0.4 }, true);
  let doorMesh, lamp, exitMesh, powered = false;
  // 阀门：贴着海底（按住 ↓ 时人会沉到 y ≈ -6.3）也够得着
  usable({ x: X + 13.9, r: 1.1, y0: -7, y1: -4.4, can: () => !hatch.want, on() { hatch.want = 1; fx('lever'); } });
  usable({ x: X + 31, r: 1.3, y0: -3, y1: -2, can: () => !powered, on() { powered = true; exitDoor.want = 1; fx('lever'); } });
  hint(() => P.x > X && P.x < X + 8, '入口在水底。<b>↓</b> 下潜，<b>空格</b> 上浮，注意换气');
  hint(() => P.x > X + 12 && P.x < X + 15 && P.y < -4.4 && !hatch.want, '按 <b>E</b> 转动阀门，打开水下入口');
  hint(() => P.x > X + 15 && P.x < X + 23, '沿通道向右游，从水井按 <b>空格</b> 上浮');
  hint(() => P.x > X + 24 && !powered, '已经进入实验室。到控制台按 <b>E</b> 恢复电源');
  hint(() => P.x > X + 24 && P.x < X + 32 && powered, '实验室电源已恢复，往里面走');
  function* build(R) {
    const block = (x,y,w,h,d,color,z=-1) => { const m = new THREE.Mesh(bx(w,h,d), lam(color)); m.position.set(X+x,y,z); R.add(m); return m; };
    backdrop(X-5,X+41,-8,10,-9,25,g=>{   // 左头渐隐：从海边走过来，它是雾里慢慢显出来的一大块（src/69-zz-links.js）
      setInk(g,'#102d39'); box(g,X-5,-8,46,18);
      for(let i=0;i<18;i++){ setInk(g,i%2?'#153842':'#1b4149'); box(g,X+i*2.7,-7,1,5+(i%4)); }
      setInk(g,'#283e43'); box(g,X+18,-6,22,7);
      for(let i=0;i<4;i++){setInk(g,'#0b222c');box(g,X+24+i*3.5,-1.4,2.5,1.3);setInk(g,'#407279');box(g,X+24+i*3.5,-1.45,2.5,.06);}
    }, { fadeL: 8 });
    block(16.6,2.25,3.8,11.5,3,0x293f42);
    block(29.2,.7,21.5,.4,5,0x263c41);
    block(31,-2.85,16,.5,5,0x34474b);
    block(16.5,-6.25,5,.5,4,0x34474b);
    doorMesh = block(15,-4.75,.5,2.5,2.8,0x826747,0);
    exitMesh = block(39.5,-1.05,1,3.1,3,0x4a5a5c,-0.3);                    // 往深处去的门（右墙上）
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(.32,.055,8,24),lam(0xd09a51)); wheel.position.set(X+13.95,-4.8,.7); R.add(wheel);
    block(13.95,-5.1,.1,1.4,.15,0x58676a,.4);
    for(let x=24;x<39;x+=3.5){ block(x,-1.9,2.5,.18,1.4,0x788c8b);block(x,-2.25,.12,.7,1,0x34484b);block(x,-1.5,.4,.65,.4,0x4c8c88); }
    block(31,-1.3,1.4,.8,.3,0x102428,.1);
    lamp = new THREE.Mesh(bx(1.2,.5,.05),unlit(0x19483f)); lamp.position.set(X+31,-1.3,.3); R.add(lamp);
    for(let x=20;x<39;x+=5){const l=new THREE.PointLight(0x8edfd3,1.8,8);l.position.set(X+x,-.1,1);R.add(l);block(x,.15,1.2,.08,.2,0x9accc4);}
    yield;
  }
  return defZone({ n: OLD+16, vis:[X-10,X+44], build, update() {
    if(doorMesh) doorMesh.position.y = -4.75+hatch.open*(hatch.h+.15);
    if(lamp) lamp.material.color.setHex(powered?0x91ffe1:0x19483f);
    if(exitMesh) exitMesh.position.y = -1.05 + exitDoor.open * 3.25;
    // 两个水面高度不同，穿过通道时切换到对应水体。
    if(P.mode==='swim' && P.x>X+5 && P.x<X+23) P.water=P.x>=X+18?well:sea;
  }, reset(){setGate(hatch,0);setGate(exitDoor,0);powered=false;}, solve(){setGate(hatch,1);setGate(exitDoor,1);powered=true;}, unbuild(){doorMesh=null;lamp=null;exitMesh=null;} });
})();
