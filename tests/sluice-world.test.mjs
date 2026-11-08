import assert from 'node:assert/strict';
import test from 'node:test';
import { CHANNEL as c, readSave, SluiceWorld } from '../assets/scripts/SluiceWorld.ts';

function advance(world, seconds, direction = 0, dt = 1 / 60) {
  for (let elapsed = 0; elapsed < seconds - 1e-8;) {
    const slice = Math.min(dt, seconds - elapsed);
    world.step(slice, direction); elapsed += slice;
  }
}
function atLever() {
  const w = new SluiceWorld(); w.restore({ version: 1, checkpoint: 'sluice', opened: false });
  w.x = c.leverX; return w;
}
function walkTo(w, x, dt) {
  for (let i = 0; i < 2000 && w.x < x; i++) w.step(dt, 1);
  assert.ok(w.x >= x, `Could not reach ${x}: x=${w.x}, y=${w.y}`);
}

test('lever works only nearby, on shore, and remains open', () => {
  const w = new SluiceWorld(); assert.equal(w.interact(), false);
  w.x = c.leverX; w.y = c.bed; assert.equal(w.interact(), false);
  w.y = c.near; assert.equal(w.interact(), true); assert.equal(w.interact(), false);
  advance(w, 3.5); assert.ok(Math.abs(w.fill - .5) < .001);
  advance(w, 20); assert.equal(w.fill, 1); assert.equal(w.logY, c.logHigh);
});

test('a grounded rider rises with the timber without sliding or falling', () => {
  const w = atLever(); w.interact(); w.x = 1550; w.y = w.logY;
  for (let i = 0; i < 600; i++) {
    w.step(1 / 60, 0);
    assert.equal(w.grounded, true); assert.ok(Math.abs(w.y - w.logY) < .001);
  }
  assert.equal(w.y, c.logHigh);
});

for (const dt of [1 / 30, 1 / 60, 1 / 144]) {
  test(`shore → timber → far bank works at walking speed, dt=${dt}`, () => {
    const w = atLever(); w.interact(); advance(w, 8, 0, dt);
    walkTo(w, 1370, dt); w.jump(); advance(w, 1, 1, dt);
    assert.ok(w.x >= c.logLeft && w.x <= c.logRight);
    assert.equal(w.grounded, true); assert.equal(w.y, c.logHigh);
    walkTo(w, 1660, dt); w.jump(); advance(w, 1.4, 1, dt);
    assert.ok(w.x > c.right + 50); assert.equal(w.y, c.far);
    assert.equal(w.checkpoint, 'far-bank');
    const restored = new SluiceWorld(); restored.restore(readSave(JSON.stringify(w.save())));
    assert.equal(restored.x, 1880); assert.equal(restored.y, c.far);
    assert.equal(restored.opened, true); assert.equal(restored.fill, 1);
    advance(restored, 12, 1, dt); assert.ok(restored.x > 3000, 'Road continues beyond the puzzle');
  });
}

test('closed gate cannot be bypassed by jumping from the low timber', () => {
  const w = atLever(); w.x = 1680; w.y = c.logLow;
  for (let i = 0; i < 8; i++) { w.jump(); advance(w, 1.2, 1); }
  assert.ok(w.x < c.right); assert.equal(w.checkpoint, 'sluice');
});

test('walking into the high bank never teleports the player upward', () => {
  const w = atLever(); w.opened = true; w.fill = 1; w.x = 1680; w.y = w.logY;
  advance(w, 3, 1); assert.ok(w.x < c.right); assert.ok(w.y < c.far);
});

test('missed landing into deep water returns to safe shore and retains gate state', () => {
  const w = atLever(); w.interact(); advance(w, 8);
  w.x = 1420; w.y = c.bed; w.grounded = true;
  w.step(1 / 60, 0);
  assert.equal(w.x, 1190); assert.equal(w.y, c.near); assert.equal(w.opened, true);
});

test('checkpoint before the puzzle is automatic and restoration clears motion', () => {
  const w = new SluiceWorld(); advance(w, 9, 1);
  assert.equal(w.checkpoint, 'sluice');
  w.jump(); w.restore(w.save());
  assert.equal(w.x, 1190); assert.equal(w.vx, 0); assert.equal(w.vy, 0);
  w.step(1 / 60, 0); assert.equal(w.grounded, true);
});

test('invalid, obsolete and inconsistent saves are rejected', () => {
  for (const raw of [null, 'bad json', 'null', '{}', '[]', '{"version":2}',
    '{"version":1,"checkpoint":"far-bank","opened":false}',
    '{"version":1,"checkpoint":"sluice","opened":"false"}',
    '{"version":1,"checkpoint":"unknown","opened":true}']) {
    assert.equal(readSave(raw), null);
  }
  const save = { version: 1, checkpoint: 'sluice', opened: true };
  assert.deepEqual(readSave(JSON.stringify(save)), save);
});

test('player can board while filling, ride up, then leave without a timed jump', () => {
  const w = atLever(); w.interact();
  walkTo(w, 1370, 1 / 60); w.jump(); advance(w, 1.4, 1);
  assert.ok(w.x > c.logLeft && w.x < c.logRight);
  assert.equal(w.grounded, true); assert.ok(w.fill < 1);
  advance(w, 8); assert.equal(w.y, c.logHigh);
  walkTo(w, 1660, 1 / 60); w.jump(); advance(w, 1.4, 1);
  assert.equal(w.checkpoint, 'far-bank');
});
