
// ============================================================
//  分区加载：每一章的布景只在走近时才搭建，走远了就释放
//  （整条路一次全搭出来，光是布景板的贴图就要占掉几百兆显存）
// ============================================================
// 卸载一章：几何体全部释放；材质只释放标了 userData.own 的（这一章自己建的），连同它身上的每一张贴图 ——
// 不只是 map，还有 alphaMap 这类，以及自己写的着色器 uniforms 里的贴图（比如水洼的形状图）。
// 好几章共用、只画一次的贴图（图标、图集）用 sharedTex() 标出来，卸载哪一章都不释放它
function disposeTree(root) {
  root.traverse(o => {
    if (o.geometry) o.geometry.dispose();
    if (o.isInstancedMesh) o.dispose();                  // 实例的位置、颜色是另外几块缓冲区
    const m = o.material; if (m && m.userData && m.userData.own) { for (const t of texturesOf(m)) if (!t.userData.shared) t.dispose(); m.dispose(); }
  });
  if (root.parent) root.parent.remove(root);
}
function texturesOf(m) {
  const out = [];
  for (const k in m) if (m[k] && m[k].isTexture) out.push(m[k]);
  if (m.uniforms) for (const k in m.uniforms) { const v = m.uniforms[k].value; if (v && v.isTexture) out.push(v); }
  return out;
}
function sharedTex(t) { t.userData.shared = true; return t; }
function zoneStep(z) {                                   // 搭建过程是一个生成器：每帧只推进一小步，走路时不会卡
  const s0 = _seed, t0 = performance.now(); _seed = z._seed; ROOT = z.root;
  let r; try { r = z.gen.next(); } finally { z._seed = _seed; _seed = s0; ROOT = scene; }
  z.ms.push(Math.round(performance.now() - t0));      // 每一步花了多久（调试用：__g.zone(n).ms）
  if (r.done) { z.gen = null; z.built = true; }
}
// cx2：另一处也要搭好的地方 —— 人正走在两章之间那段雾里的时候，下一章入口那一带的布景提前搭（一帧一小步），人到了不用现搭、不会卡一下
function streamZones(cx, sync = false, cx2 = cx) {
  let stepped = false;
  for (const z of ZONES) {
    const near = d => (cx > z.vis[0] - d && cx < z.vis[1] + d) || (cx2 > z.vis[0] - d && cx2 < z.vis[1] + d), want = near(75);
    if (want && !z.root) { z.root = new THREE.Group(); scene.add(z.root); z._seed = 1000 + origN(z.n) * 7919; z.ms = []; z.gen = z.build(z.root); }   // 种子按章节原来的编号（20-world.js 的 origN）：旧原型挪到第 8–20 章、《逃出工厂》删掉第一章，布景的样子都不变
    if (z.gen && (sync || !stepped)) { do zoneStep(z); while (sync && z.gen); stepped = true; }
    if (!want && z.root && !z.gen && !near(140)) { if (z.unbuild) z.unbuild(); disposeTree(z.root); z.root = null; z.built = false; }
  }
}
// 换了章节（从菜单跳、从上一章一路走进来）：离得远的章节马上卸掉，不等走出 140 米 ——
// 不挨着的两章在世界里只隔几十米，上一章不受雾影响的远景会露在这一章的布景板外面
function dropFarZones(cx) {
  for (const z of ZONES) if (z.root && !z.gen && (cx < z.vis[0] - 75 || cx > z.vis[1] + 75)) { if (z.unbuild) z.unbuild(); disposeTree(z.root); z.root = null; z.built = false; }
}
