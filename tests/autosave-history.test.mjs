import test from 'node:test';
import assert from 'node:assert/strict';
import { appendAutosave, emptyArchive, readArchive, saveName, sameMilestone, SluiceWorld } from '../assets/scripts/SluiceWorld.ts';
const initial = { version: 1, checkpoint: 'reclamation', opened: false, night: 0, escaped: false, alarm: false };

test('every milestone retains a named timestamped snapshot, including repeated visits', () => {
  let a = appendAutosave(emptyArchive(), initial, 1000);
  a = appendAutosave(a, { ...initial, checkpoint: 'forest', alarm: true }, 2000);
  a = appendAutosave(a, initial, 3000);
  assert.equal(a.entries.length, 3); assert.equal(a.entries[0].createdAt, 1000);
  assert.equal(a.entries[0].name, '回收站 · 待处理区');
  assert.equal(a.entries[1].name, '踏入森林');
  assert.deepEqual(a.entries.map(e => e.id), [1, 2, 3]);
  assert.deepEqual(readArchive(JSON.stringify(a)), a);
});
test('loading an older entry preserves future saves and resumes that chosen entry after reload', () => {
  let a = appendAutosave(emptyArchive(), initial, 1000);
  a = appendAutosave(a, { ...initial, checkpoint: 'patrol-cleared', opened: true, night: 1, escaped: true, alarm: true }, 2000);
  a.activeId = a.entries[0].id;
  const loaded = readArchive(JSON.stringify(a));
  assert.equal(loaded.entries.length, 2);
  const world = new SluiceWorld(); world.restore(loaded.entries.find(e => e.id === loaded.activeId).progress);
  assert.equal(world.x, -2050); assert.equal(world.opened, false);
  a = appendAutosave(loaded, { ...initial, checkpoint: 'station-exit', alarm: true }, 3000);
  assert.equal(a.entries.length, 3); assert.equal(a.entries[1].progress.escaped, true);
});
test('archive reads in chronological order, skips corrupt records and keeps imported time unknown', () => {
  let a = appendAutosave(emptyArchive(), initial, null);
  a = appendAutosave(a, { ...initial, checkpoint: 'forest', alarm: true }, 2000);
  a.entries.reverse();
  a.entries.push({ id: 3, createdAt: -1, progress: initial });
  a.entries.push({ id: 4, createdAt: 3000, progress: { ...initial, night: 8 } });
  a.entries.push(a.entries[0]);
  const restored = readArchive(JSON.stringify(a));
  assert.deepEqual(restored.entries.map(e => e.id), [1, 2]);
  assert.equal(restored.entries[0].createdAt, null);
  assert.equal(readArchive('invalid'), null);
});
test('lighting does not flood history; gate opening and alarm are separate named milestones', () => {
  assert.equal(sameMilestone(initial, { ...initial, night: .02 }), true);
  assert.equal(sameMilestone(initial, { ...initial, alarm: true }), false);
  assert.equal(saveName({ ...initial, checkpoint: 'sluice', opened: true }), '水闸已开启');
  assert.equal(saveName({ ...initial, alarm: true }), '回收站 · 警报响起');
});
