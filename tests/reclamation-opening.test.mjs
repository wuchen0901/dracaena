import test from 'node:test';
import assert from 'node:assert/strict';
import { CHANNEL, SluiceWorld, readSave } from '../assets/scripts/SluiceWorld.ts';

test('a fresh journey starts inside reclamation and walking reaches the existing forest and sluice', () => {
  for (const fps of [30, 60, 144]) {
    const world = new SluiceWorld();
    assert.equal(world.x, -2050); assert.equal(world.checkpoint, 'reclamation');
    for (let i = 0; i < fps * 14; i++) world.step(1 / fps, 1);
    assert(world.x > -200); assert.equal(world.checkpoint, 'forest');
    assert.equal(world.y, CHANNEL.near); assert.equal(world.grounded, true);
    for (let i = 0; i < fps * 8; i++) world.step(1 / fps, 1);
    assert.equal(world.checkpoint, 'sluice');
  }
});
test('opening checkpoint survives reload and older forest saves retain their position', () => {
  const fresh = new SluiceWorld(), restored = new SluiceWorld();
  restored.restore(readSave(JSON.stringify(fresh.save())));
  assert.equal(restored.x, fresh.x);
  restored.restore({ version: 1, checkpoint: 'forest', opened: false });
  assert.equal(restored.x, -90);
  restored.restore({ version: 1, checkpoint: 'reclamation', opened: false });
  for (let i = 0; i < 600; i++) restored.step(1 / 60, -1);
  assert.equal(restored.x, -2350);
});
