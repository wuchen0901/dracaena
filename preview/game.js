(() => {
  const canvas = document.querySelector('#game');
  const ctx = canvas.getContext('2d');
  const W = 960, H = 540, floor = 430;
  const keys = new Set();
  const seedStart = { x: 343, y: floor - 12 };
  const relay = { x: 670, y: floor - 44 };
  const gate = { x: 859, y: floor - 82 };
  const player = { x: 125, y: floor, vx: 0, vy: 0, onGround: true, facing: 1 };
  let seed = { x: seedStart.x, y: seedStart.y, carried: false, placed: false };
  let lit = false, won = false, last = performance.now(), toastTimer = 0;
  let particles = Array.from({ length: 54 }, (_, i) => ({
    x: (i * 191 + 31) % W, y: (i * 113 + 42) % 420, r: .6 + (i % 4) * .35,
    phase: i * .81, speed: .35 + (i % 5) * .12
  }));
  const objectiveText = document.querySelector('#objective-text');
  const toastEl = document.querySelector('#toast');
  const winEl = document.querySelector('#win-screen');
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const dist = (a,b) => Math.hypot(a.x-b.x, a.y-b.y);
  const rounded = (x,y,w,h,r) => { ctx.beginPath(); ctx.roundRect(x,y,w,h,r); };

  function reset() {
    player.x=125; player.y=floor; player.vx=0; player.vy=0; player.onGround=true;
    seed={x:seedStart.x,y:seedStart.y,carried:false,placed:false}; lit=false; won=false;
    winEl.classList.remove('visible'); objectiveText.textContent='Find the light'; toast('');
  }
  function toast(text) {
    toastEl.textContent=text;
    toastEl.classList.toggle('show',!!text);
    clearTimeout(toastTimer);
    if(text) toastTimer=setTimeout(()=>toastEl.classList.remove('show'),1800);
  }
  function interact() {
    if(won) return;
    if(!seed.carried && !seed.placed && dist(player,{x:seed.x,y:floor-15})<66) {
      seed.carried=true; objectiveText.textContent='Wake the old relay'; toast('A little warmth, held close.'); return;
    }
    if(seed.carried && !lit && dist(player,{x:relay.x,y:floor})<83) {
      seed.carried=false; seed.placed=true; lit=true; seed.x=relay.x; seed.y=relay.y-36;
      objectiveText.textContent='The gate is open'; toast('The greenhouse remembers the light.'); return;
    }
    if(lit && player.x>gate.x-48) { won=true; objectiveText.textContent='Keep walking'; winEl.classList.add('visible'); }
  }
  window.addEventListener('keydown', e => {
    if(['ArrowLeft','ArrowRight','ArrowUp',' ','Space'].includes(e.key)) e.preventDefault();
    keys.add(e.code);
    if((e.code==='Space'||e.code==='ArrowUp'||e.code==='KeyW')&&!e.repeat&&player.onGround&&!won){player.vy=-460;player.onGround=false;}
    if(e.code==='KeyE'&&!e.repeat) interact();
    if(e.code==='KeyR'&&!e.repeat) reset();
  });
  window.addEventListener('keyup', e=>keys.delete(e.code));
  document.querySelector('#reset').addEventListener('click',reset);
  document.querySelector('#again').addEventListener('click',reset);
  for(const button of document.querySelectorAll('[data-key]')) {
    const code=button.dataset.key;
    button.addEventListener('pointerdown',e=>{e.preventDefault();keys.add(code);if(code==='KeyE')interact();if(code==='Space'&&player.onGround){player.vy=-460;player.onGround=false;}});
    for(const ev of ['pointerup','pointerleave','pointercancel'])button.addEventListener(ev,()=>keys.delete(code));
  }

  function drawBackground(t) {
    const sky=ctx.createLinearGradient(0,0,0,H); sky.addColorStop(0,'#122824');sky.addColorStop(.52,'#19332d');sky.addColorStop(1,'#101e19');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
    const moon=ctx.createRadialGradient(696,128,4,696,128,190);moon.addColorStop(0,'#c4d0aa32');moon.addColorStop(1,'#c4d0aa00');ctx.fillStyle=moon;ctx.fillRect(480,0,430,390);
    // Tall, fog-soft greenhouse ribs.
    ctx.save(); ctx.globalAlpha=.34; ctx.strokeStyle='#879b7b'; ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(35,330);ctx.lineTo(82,148);ctx.quadraticCurveTo(480,-34,878,148);ctx.lineTo(925,330);ctx.stroke();
    for(let i=0;i<8;i++){const x=88+i*112;const peak=145+Math.sin(i*.46)*24;ctx.globalAlpha=.11;ctx.beginPath();ctx.moveTo(x,332);ctx.quadraticCurveTo(480+(x-480)*.45,peak,x+43,332);ctx.stroke();}
    ctx.globalAlpha=.1;ctx.lineWidth=1;for(let y=180;y<340;y+=44){ctx.beginPath();ctx.moveTo(65,y);ctx.lineTo(895,y);ctx.stroke();}ctx.restore();
    // distant overgrown silhouettes
    ctx.fillStyle='#12231e';ctx.beginPath();ctx.moveTo(0,350);for(let x=0;x<=W;x+=24){const y=337+Math.sin(x*.019)*18+Math.sin(x*.051)*7;ctx.lineTo(x,y);}ctx.lineTo(W,floor);ctx.lineTo(0,floor);ctx.fill();
    ctx.fillStyle='#172a22';for(let i=0;i<15;i++){let x=(i*79+12)%W;let y=319+(i%4)*15;ctx.beginPath();ctx.ellipse(x,y,11+(i%3)*4,34+(i%4)*7,-.3+i*.08,0,Math.PI*2);ctx.fill();}
    // hanging vines
    ctx.strokeStyle='#344c36';ctx.lineWidth=3;for(let i=0;i<12;i++){const x=i*87+25;ctx.beginPath();ctx.moveTo(x,0);ctx.bezierCurveTo(x+10,75,x-20,120+(i%3)*38,x+5,184+(i%4)*22);ctx.stroke();leaf(x+5,170+(i%4)*22,7,12,'#395039',.3);}
    // cold shafts of light
    ctx.save();ctx.globalCompositeOperation='screen';for(const [x,w,a] of [[205,46,.036],[675,70,.045],[790,40,.025]]){const beam=ctx.createLinearGradient(x,110,x+20,floor);beam.addColorStop(0,`rgba(208,220,167,${a})`);beam.addColorStop(1,'rgba(208,220,167,0)');ctx.fillStyle=beam;ctx.beginPath();ctx.moveTo(x,120);ctx.lineTo(x+w,120);ctx.lineTo(x+w+90,floor);ctx.lineTo(x-90,floor);ctx.fill();}ctx.restore();
    // foreground floor
    const ground=ctx.createLinearGradient(0,floor,0,H);ground.addColorStop(0,'#29392a');ground.addColorStop(1,'#121e19');ctx.fillStyle=ground;ctx.fillRect(0,floor,W,H-floor);
    ctx.fillStyle='#65724d';ctx.fillRect(0,floor,W,2);ctx.strokeStyle='#495b40';ctx.lineWidth=1;for(let x=0;x<W;x+=26){ctx.beginPath();ctx.moveTo(x,floor+10);ctx.lineTo(x+9,floor+((x%3)*4));ctx.stroke();}
    // distant stars / motes
    for(const p of particles){const flicker=.25+.55*(.5+.5*Math.sin(t*p.speed+p.phase));ctx.globalAlpha=flicker;ctx.fillStyle='#d9e4b3';ctx.beginPath();ctx.arc(p.x+(t*.8*p.speed)%W,p.y,p.r,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;
  }
  function leaf(x,y,rx,ry,color,rot=0){ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(0,0,rx,ry,0,0,Math.PI*2);ctx.fill();ctx.restore();}
  function drawPlant(x,y,t,color='#5b7350') {
    ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x-5,y-18,x+2,y-35);ctx.stroke();
    leaf(x-8,y-21,5,11,color,-.8);leaf(x+7,y-30,5,10,color,.8);leaf(x+7,y-9,4,8,color,.9);
    ctx.beginPath();ctx.ellipse(x+2,y-37,5,8,.1,0,Math.PI*2);ctx.fillStyle='#89945c';ctx.fill();
  }
  function drawRelay(t) {
    ctx.save();if(lit){const g=ctx.createRadialGradient(relay.x,relay.y-35,3,relay.x,relay.y-35,95);g.addColorStop(0,'#dfcf8e62');g.addColorStop(1,'#dfcf8e00');ctx.fillStyle=g;ctx.fillRect(relay.x-100,relay.y-130,200,200);}
    ctx.fillStyle='#334036';rounded(relay.x-20,relay.y-16,40,16,4);ctx.fill();ctx.fillStyle='#657051';rounded(relay.x-14,relay.y-29,28,15,3);ctx.fill();
    ctx.strokeStyle=lit?'#e3d391':'#5c704d';ctx.lineWidth=2;ctx.beginPath();ctx.arc(relay.x,relay.y-37,9,0,Math.PI*2);ctx.stroke();
    if(lit){ctx.shadowBlur=22;ctx.shadowColor='#f1d987';ctx.fillStyle='#f5e6aa';ctx.beginPath();ctx.arc(relay.x,relay.y-37,4,0,Math.PI*2);ctx.fill();}else{ctx.fillStyle='#3a4938';ctx.beginPath();ctx.arc(relay.x,relay.y-37,4,0,Math.PI*2);ctx.fill();}
    ctx.restore();
  }
  function drawGate(t) {
    const x=gate.x;
    if(lit){ctx.save();ctx.globalAlpha=.24;const glow=ctx.createRadialGradient(x,floor-42,3,x,floor-42,115);glow.addColorStop(0,'#d8d19a');glow.addColorStop(1,'#d8d19a00');ctx.fillStyle=glow;ctx.fillRect(x-120,floor-170,240,170);ctx.restore();}
    ctx.strokeStyle=lit?'#a8a77b':'#37483a';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(x-36,floor);ctx.lineTo(x-36,floor-94);ctx.quadraticCurveTo(x,floor-136,x+36,floor-94);ctx.lineTo(x+36,floor);ctx.stroke();
    if(!lit){ctx.fillStyle='#1b2922';ctx.fillRect(x-31,floor-84,62,84);ctx.strokeStyle='#455644';ctx.lineWidth=2;for(let i=-20;i<=20;i+=20){ctx.beginPath();ctx.moveTo(x+i,floor-84);ctx.lineTo(x+i,floor);ctx.stroke();}}
    else{ctx.save();ctx.globalAlpha=.36;ctx.fillStyle='#f5df9a';ctx.fillRect(x-25,floor-65,50,65);ctx.restore();}
  }
  function drawSeed(t) {
    const x=seed.x,y=seed.y;
    const g=ctx.createRadialGradient(x,y,1,x,y,47);g.addColorStop(0,'#f9e5a6a8');g.addColorStop(1,'#f9e5a600');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,47,0,Math.PI*2);ctx.fill();
    ctx.save();ctx.translate(x,y);ctx.rotate(.35*Math.sin(t*1.3));ctx.shadowBlur=19;ctx.shadowColor='#ffe6a2';ctx.fillStyle='#f5e5ad';ctx.beginPath();ctx.ellipse(0,0,7,11,0,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle='#fff5d4';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,7);ctx.quadraticCurveTo(-1,-3,2,-9);ctx.stroke();ctx.restore();
  }
  function drawPlayer(t) {
    const x=player.x,y=player.y;const run=Math.abs(player.vx)>10&&!won;const bob=player.onGround?Math.sin(t*13)* (run?2.5:.7):0;
    ctx.save();ctx.translate(x,y+bob);ctx.scale(player.facing,1);
    ctx.fillStyle='#0a1110';ctx.beginPath();ctx.ellipse(0,0,13,3,0,0,Math.PI*2);ctx.fill();
    const leg=run?Math.sin(t*14)*5:0;ctx.strokeStyle='#111a18';ctx.lineWidth=5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-3,-19);ctx.lineTo(-5+leg,-3);ctx.moveTo(4,-19);ctx.lineTo(5-leg,-3);ctx.stroke();
    ctx.fillStyle='#18211f';ctx.beginPath();ctx.moveTo(-8,-40);ctx.quadraticCurveTo(-11,-28,-7,-17);ctx.lineTo(7,-17);ctx.quadraticCurveTo(10,-30,7,-40);ctx.closePath();ctx.fill();
    ctx.fillStyle='#1b2421';ctx.beginPath();ctx.ellipse(0,-47,8.5,10,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#bdc49f';ctx.globalAlpha=.65;ctx.beginPath();ctx.arc(3,-49,1.3,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
    if(seed.carried){ctx.strokeStyle='#29332d';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(5,-34);ctx.lineTo(13,-40);ctx.stroke();}ctx.restore();
  }
  function drawPrompt() {
    let label='';let x=player.x,y=player.y-89;
    if(!seed.carried&&!seed.placed&&dist(player,{x:seed.x,y:floor})<92){label='E  TAKE THE LIGHT';x=seed.x;}
    else if(seed.carried&&!lit&&dist(player,{x:relay.x,y:floor})<108){label='E  OFFER THE LIGHT';x=relay.x;}
    else if(lit&&player.x>gate.x-110){label='WALK INTO THE DAWN';x=gate.x;}
    if(!label)return;
    ctx.save();ctx.font='9px monospace';ctx.textAlign='center';const width=ctx.measureText(label).width+20;ctx.fillStyle='#0a1512dc';ctx.strokeStyle='#eee5bd28';ctx.lineWidth=1;rounded(x-width/2,y-10,width,23,3);ctx.fill();ctx.stroke();ctx.fillStyle='#ddd4ae';ctx.fillText(label,x,y+5);ctx.restore();
  }
  function drawForeground() {
    ctx.fillStyle='#0d1b16';for(let i=0;i<10;i++){let x=(i*113+16)%W;drawPlant(x,floor+12,0,i%2?'#304433':'#40503b');}
    // close soft leaves frame the lower corners
    ctx.save();ctx.globalAlpha=.72;for(let i=0;i<5;i++){leaf(i*18-8,H-14-i*5,15,48,'#14251b',-.27+i*.09);leaf(W-i*18+8,H-10-i*3,16,53,'#15271c',.3-i*.09);}ctx.restore();
  }
  function frame(now) {
    const dt=Math.min((now-last)/1000,.033);last=now;const t=now/1000;
    if(!won){const d=(keys.has('ArrowRight')||keys.has('KeyD')?1:0)-(keys.has('ArrowLeft')||keys.has('KeyA')?1:0);player.vx=d*188;if(d)player.facing=d;player.x=clamp(player.x+player.vx*dt,28,W-26);player.vy+=1080*dt;player.y+=player.vy*dt;if(player.y>=floor){player.y=floor;player.vy=0;player.onGround=true;}if(lit&&player.x>gate.x-37)interact();}
    if(seed.carried){seed.x=player.x+player.facing*18;seed.y=player.y-63;}
    drawBackground(t);for(let x=52;x<W;x+=108)drawPlant(x,floor+1,t);drawGate(t);drawRelay(t);if(!seed.placed)drawSeed(t);else drawSeed(t);drawPlayer(t);drawPrompt();drawForeground();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
