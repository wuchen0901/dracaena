import test from 'node:test';
import assert from 'node:assert/strict';
import { TreeCover, COVER } from '../assets/scripts/TreeCover.ts';
import { SluiceWorld } from '../assets/scripts/SluiceWorld.ts';
import { SearchEscape } from '../assets/scripts/SearchEscape.ts';

test('patrol leaves only after cover, then marks the encounter clear at all frame rates', () => {
  for (const fps of [30, 60, 144]) {
    const s = new SearchEscape(), dt = 1 / fps;
    for (let i = 0; i < fps * 10; i++) s.step(dt, false);
    assert.equal(s.active, false); assert.equal(s.departure, 0);
    for (let i = 0; i < fps * 3; i++) s.step(dt, true);
    assert.equal(s.active, true); assert.equal(s.departure, 0);
    for (let i = 0; i < fps * 2; i++) s.step(dt, true);
    assert(s.departure > 0 && s.departure < 1); assert.equal(s.active, true);
    for (let i = 0; i < fps * 3; i++) s.step(dt, true);
    assert.equal(s.cleared, true); assert.equal(s.active, false); assert.equal(s.departure, 1);
    s.step(dt, true); assert.equal(s.active, false);
  }
});
test('airborne passage does not trigger cover and reset clears an unfinished encounter', () => {
  const s = new SearchEscape(); s.step(.25, false);
  assert.equal(s.started, false);
  s.step(.25, true); assert.equal(s.active, true);
  s.reset(); assert.equal(s.started, false); assert.equal(s.elapsed, 0);
});


test('stopping where the robot first crouches starts the patrol departure countdown', () => {
  for (const x of [COVER.left, COVER.left + 1, COVER.treeX - 60, COVER.treeX, COVER.right]) {
    const cover = new TreeCover(), escape = new SearchEscape();
    for (let i = 0; i < 8 * 60; i++) {
      cover.frame(1 / 60, x, true, 0);
      escape.step(1 / 60, cover.contains(x, true));
    }
    assert.equal(escape.cleared, true, `patrol still present at x=${x}`);
    assert.equal(escape.departure, 1);
  }
});


test('leaving cover at either edge or jumping before patrol departure causes a persistent failure', () => {
  for (const dt of [1 / 30, 1 / 60, 1 / 144]) {
    for (const seconds of [1, 5, 6.9]) {
      const s = new SearchEscape();
      for (let elapsed = 0; elapsed < seconds; elapsed += dt) s.step(dt, true);
      s.step(dt, false);
      assert.equal(s.caught, true); assert.equal(s.cleared, false);
      for (let i = 0; i < 1000; i++) s.step(dt, true);
      assert.equal(s.cleared, false);
      s.reset(); assert.equal(s.caught, false); assert.equal(s.started, false);
    }
  }
});
test('jumping past the cover entry is exposure; leaving after departure is safe', () => {
  const airborne = new SearchEscape(); airborne.step(.016, false, true);
  assert.equal(airborne.caught, true);
  const safe = new SearchEscape();
  for (let i = 0; i < 32; i++) safe.step(.25, true);
  safe.step(.25, false, true);
  assert.equal(safe.caught, false); assert.equal(safe.cleared, true);
});


test('holding right actually moves out of cover and fails instead of locking movement', () => {
  for (const fps of [30, 60, 144]) {
    const world = new SluiceWorld(), cover = new TreeCover(), encounter = new SearchEscape();
    world.restore({ version: 1, checkpoint: 'far-bank', opened: true });
    world.x = COVER.left + 5; world.y = 40; world.grounded = true;
    const initial = world.x;
    for (let i = 0; i < fps * 6 && !encounter.caught; i++) {
      const covered = cover.contains(world.x, world.grounded);
      world.step(1 / fps, covered ? .5 : 1);
      encounter.step(1 / fps, cover.contains(world.x, world.grounded), world.x >= COVER.left);
    }
    assert(world.x > initial); assert(world.x > COVER.right);
    assert.equal(encounter.caught, true); assert.equal(encounter.cleared, false);
  }
});
