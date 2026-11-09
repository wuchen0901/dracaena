import test from 'node:test';
import assert from 'node:assert/strict';
import { FACTORY_ESCAPE_LAYOUT, FactoryEscapePuzzle } from '../assets/scripts/FactoryEscapePuzzle.ts';
import { readSave, SluiceWorld } from '../assets/scripts/SluiceWorld.ts';

function makeWorld() {
  const factory = new FactoryEscapePuzzle();
  const world = new SluiceWorld(undefined, undefined, undefined, undefined, undefined, factory);
  return { factory, world };
}

test('push the factory crate to the cutoff, climb it, and persist the opened route', () => {
  const { factory, world } = makeWorld();
  const dt = 1 / 60;
  while (world.x < factory.left - 12) world.step(dt, 1);
  assert.equal(factory.canGrab(world.x, world.y, world.grounded), true);
  for (let i = 0; i < 600 && factory.crateX < FACTORY_ESCAPE_LAYOUT.crateTarget; i++) world.step(dt, 1, false, true);
  assert.equal(factory.crateX, FACTORY_ESCAPE_LAYOUT.crateTarget);

  world.x = factory.crateX; world.y = FACTORY_ESCAPE_LAYOUT.floor; world.grounded = true;
  world.jump();
  for (let i = 0; i < 120; i++) world.step(dt, 0);
  assert.equal(world.y, factory.crateTop);
  assert.equal(world.canInteractFactory, true);
  assert.equal(world.interact(), true);
  assert.equal(factory.poweredOff, true);
  assert.equal(world.checkpoint, 'factory-solved');

  const restored = readSave(JSON.stringify(world.save()));
  assert.equal(restored?.factory?.poweredOff, true);
  assert.equal(restored?.factory?.crateX, FACTORY_ESCAPE_LAYOUT.crateTarget);
  const resumed = makeWorld(); resumed.world.restore(restored);
  assert.equal(resumed.factory.poweredOff, true);
  assert.equal(resumed.factory.crateX, FACTORY_ESCAPE_LAYOUT.crateTarget);
  assert.equal(resumed.world.x, -2990);
});

test('the raised cutoff gate cannot be bypassed with an ordinary jump', () => {
  const { factory, world } = makeWorld();
  world.x = FACTORY_ESCAPE_LAYOUT.gateX - 100;
  world.y = FACTORY_ESCAPE_LAYOUT.floor;
  world.grounded = true;
  world.jump();
  for (let i = 0; i < 240; i++) world.step(1 / 60, 1);
  assert(world.x <= FACTORY_ESCAPE_LAYOUT.gateX - 12);
  assert.equal(factory.poweredOff, false);
});
