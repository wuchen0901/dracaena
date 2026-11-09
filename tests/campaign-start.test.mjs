import test from 'node:test';
import assert from 'node:assert/strict';
import { CHANNEL, SluiceWorld } from '../assets/scripts/SluiceWorld.ts';

for (const fps of [30, 60, 144]) {
  test(`factory start stays in place and moves continuously at ${fps} FPS`, () => {
    const world = new SluiceWorld();
    world.step(1 / fps, 0);
    assert.equal(world.x, -3550);
    assert.equal(world.y, CHANNEL.near);
    for (let frame = 0; frame < fps * 2; frame++) {
      const before = world.x;
      world.step(1 / fps, 1);
      assert.ok(world.x >= before);
      assert.ok(world.x - before <= 146 / fps, 'walking must not teleport past the opening');
    }
    assert.ok(world.x < -3200);
    assert.equal(world.checkpoint, 'reclamation');
  });
  test(`factory left boundary includes the current opening at ${fps} FPS`, () => {
    const world = new SluiceWorld();
    for (let frame = 0; frame < fps * 4; frame++) world.step(1 / fps, -1);
    assert.equal(world.x, -3750);
    assert.equal(world.grounded, true);
  });
}
