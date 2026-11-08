import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyArchive, readArchive, saveName, sameMilestone, SluiceWorld, upsertAutosave } from '../assets/scripts/SluiceWorld.ts';
const initial = { version: 1, checkpoint: 'reclamation', opened: false, night: 0, escaped: false, alarm: false };

test('each progress point has one named slot and repeat saves update that slot', () => {
  let a = upsertAutosave(emptyArchive(), initial, 1000);
  a = upsertAutosave(a, { ...initial, checkpoint: 'reclamation', alarm: true }, 1500);
  a = upsertAutosave(a, { ...initial, checkpoint: 'forest', alarm: true }, 2000);
  a = upsertAutosave(a, { ...initial, checkpoint: 'forest', alarm: false }, 3000);
  assert.equal(a.entries.length, 3);
  assert.equal(a.entries[0].createdAt, 1000);
  assert.equal(a.entries[0].name, '回收站 · 待处理区');
  assert.equal(a.entries[1].name, '回收站 · 警报响起');
  assert.equal(a.entries[2].name, '踏入森林');
  assert.equal(a.entries[2].createdAt, 3000);
  assert.equal(new Set(a.entries.map(e => e.progress.checkpoint + ':' + e.progress.alarm)).size, a.entries.length);
  assert.deepEqual(readArchive(JSON.stringify(a)), a);
});
test('loading an older entry keeps the timeline until the next point, then replaces that branch', () => {
  let a = upsertAutosave(emptyArchive(), initial, 1000);
  a = upsertAutosave(a, { ...initial, checkpoint: 'station-exit', alarm: true }, 1500);
  a = upsertAutosave(a, { ...initial, checkpoint: 'forest', alarm: true }, 2000);
  a = upsertAutosave(a, { ...initial, checkpoint: 'patrol-cleared', opened: true, night: 1, escaped: true, alarm: true }, 3000);
  a.activeId = a.entries[0].id;
  const loaded = readArchive(JSON.stringify(a));
  assert.equal(loaded.entries.length, 4);
  const world = new SluiceWorld(); world.restore(loaded.entries.find(e => e.id === loaded.activeId).progress);
  assert.equal(world.x, -2050); assert.equal(world.opened, false);
  const replacedId = loaded.entries[1].id;
  a = upsertAutosave(loaded, { ...initial, checkpoint: 'station-exit', alarm: true, night: .2 }, 4000);
  assert.equal(a.entries.length, 2);
  assert.equal(a.entries[1].id, replacedId);
  assert.equal(a.entries[1].progress.night, .2);
});
test('legacy archive collapses repeated saves into progress order and skips corrupt records', () => {
  let a = upsertAutosave(emptyArchive(), initial, null);
  a = upsertAutosave(a, { ...initial, checkpoint: 'forest', alarm: true }, 2000);
  a.entries.push({ id: 3, name: 'legacy duplicate', createdAt: 3000, progress: initial });
  a.activeId = 3;
  a.entries.reverse();
  a.entries.push({ id: 4, createdAt: -1, progress: initial });
  a.entries.push({ id: 5, createdAt: 3000, progress: { ...initial, night: 8 } });
  a.entries.push(a.entries[0]);
  const restored = readArchive(JSON.stringify(a));
  assert.deepEqual(restored.entries.map(e => e.id), [3, 2]);
  assert.equal(restored.entries[0].id, 3);
  assert.equal(restored.entries[0].createdAt, 3000);
  assert.equal(restored.activeId, 3);
  assert.equal(readArchive('invalid'), null);
});
test('lighting does not flood history; gate opening and alarm are separate named milestones', () => {
  assert.equal(sameMilestone(initial, { ...initial, night: .02 }), true);
  assert.equal(sameMilestone(initial, { ...initial, alarm: true }), false);
  assert.equal(saveName({ ...initial, checkpoint: 'sluice', opened: true }), '水闸已开启');
  assert.equal(saveName({ ...initial, alarm: true }), '回收站 · 警报响起');
});
