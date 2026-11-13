
// ============================================================
//  分区加载：每一章的布景只在走近时才搭建，走远了就释放
//  （整条路一次全搭出来，光是布景板的贴图就要占掉几百兆显存）
// ============================================================
function disposeTree(root) {
  root.traverse(o => {
    if (o.geometry) o.geometry.dispose();
    if (o.isInstancedMesh) o.dispose();                  // 实例的位置、颜色是另外几块缓冲区
    const m = o.material; if (m && m.userData && m.userData.own) { if (m.map) m.map.dispose(); m.dispose(); }
  });
  if (root.parent) root.parent.remove(root);
}
function zoneStep(z) {                                   // 搭建过程是一个生成器：每帧只推进一小步，走路时不会卡
  const s0 = _seed, t0 = performance.now(); _seed = z._seed; ROOT = z.root;
  let r; try { r = z.gen.next(); } finally { z._seed = _seed; _seed = s0; ROOT = scene; }
  z.ms.push(Math.round(performance.now() - t0));      // 每一步花了多久（调试用：__g.zone(n).ms）
  if (r.done) { z.gen = null; z.built = true; }
}
function streamZones(cx, sync = false) {
  let stepped = false;
  for (const z of ZONES) {
    const want = cx > z.vis[0] - 75 && cx < z.vis[1] + 75;
    if (want && !z.root) { z.root = new THREE.Group(); scene.add(z.root); z._seed = 1000 + z.n * 7919; z.ms = []; z.gen = z.build(z.root); }
    if (z.gen && (sync || !stepped)) { do zoneStep(z); while (sync && z.gen); stepped = true; }
    if (!want && z.root && !z.gen && (cx < z.vis[0] - 140 || cx > z.vis[1] + 140)) { if (z.unbuild) z.unbuild(); disposeTree(z.root); z.root = null; z.built = false; }
  }
}
