import test from 'node:test';
import assert from 'node:assert/strict';
import { readProgress, SluiceWorld } from '../assets/scripts/SluiceWorld.ts';
import { SearchEscape } from '../assets/scripts/SearchEscape.ts';

test('progress restores world, lighting and story flags together', () => {
  const save = { version: 1, checkpoint: 'patrol-cleared', opened: true, night: 1, escaped: true, alarm: true };
  const loaded = readProgress(JSON.stringify(save)); assert.deepEqual(loaded, save);
  const world = new SluiceWorld(); world.restore(loaded);
  assert.equal(world.x, 3280); assert.equal(world.y, 40);
  world.step(.25, 1); assert.equal(world.checkpoint, 'patrol-cleared');
});
test('safe checkpoint before police remains outside cover after loading', () => {
  const world = new SluiceWorld(); world.restore({ version: 1, checkpoint: 'far-bank', opened: true });
  for (let i = 0; i < 510; i++) world.step(1 / 60, 1);
  assert.equal(world.checkpoint, 'patrol-approach');
  const safe = JSON.stringify({ ...world.save(), night: .95, escaped: false, alarm: true });
  const encounter = new SearchEscape(); encounter.step(.25, true); encounter.step(.25, false);
  assert.equal(encounter.caught, true);
  world.restore(readProgress(safe)); encounter.reset();
  assert.equal(world.x, 3080); assert.equal(world.grounded, true); assert.equal(encounter.caught, false);
  world.step(.25, 0); assert.equal(world.checkpoint, 'patrol-approach');
});
test('old saves migrate and corrupt atmosphere/story fields are rejected', () => {
  const old = { version: 1, checkpoint: 'forest', opened: false };
  assert.deepEqual(readProgress(JSON.stringify(old)), { ...old, night: 0, escaped: false, alarm: true });
  for (const patch of [{ night: -1 }, { night: 2 }, { night: 'dark' }, { escaped: 1 }, { alarm: 'yes' },
    { checkpoint: 'patrol-cleared', opened: true, escaped: false }, { checkpoint: 'patrol-approach', opened: false }]) {
    assert.equal(readProgress(JSON.stringify({ ...old, ...patch })), null);
  }
});
test('station exit is saved without replaying the entire interior', () => {
  const w = new SluiceWorld(); w.x = -1005; w.step(.2, 1);
  assert.equal(w.checkpoint, 'station-exit'); w.restore(w.save()); assert.equal(w.x, -980);
});
