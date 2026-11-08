import test from 'node:test';
import assert from 'node:assert/strict';
import { DogChaseSegment } from '../assets/scripts/DogChaseSegment.ts';
import { PushBoxSegment } from '../assets/scripts/PushBoxSegment.ts';
import { SluiceWorld, readProgress } from '../assets/scripts/SluiceWorld.ts';
function create() {
  const dog = new DogChaseSegment(), w = new SluiceWorld(new PushBoxSegment(), dog);
  w.restore({ version: 1, checkpoint: 'dog-approach', opened: true, box: { position: 1, solved: true } });
  return w;
}
function tick(w, dt, dir) { w.step(dt, dir); w.dog.step(dt, w.x, w.y, w.grounded); }
for (const fps of [30, 60, 144]) {
  test(`walk, jump the gap, leave the dog barking at the near edge at ${fps} FPS`, () => {
    const w = create(), d = w.dog, dt = 1 / fps;
    for (let i = 0; i < 20 * fps && w.x < d.gapLeft - 20; i++) tick(w, dt, 1);
    assert.equal(d.caught, false); assert.equal(d.active, true);
    w.jump();
    for (let i = 0; i < fps * 2; i++) tick(w, dt, 1);
    assert(w.x > d.gapRight + 15); assert.equal(w.y, d.layout.floor);
    assert.equal(d.cleared, true); assert.equal(d.caught, false);
    for (let i = 0; i < fps * 4; i++) tick(w, dt, 1);
    assert.equal(d.x, d.stopX); assert.equal(d.barking, true);
    assert(d.x + 56 < d.gapLeft); assert(d.frame >= 4);
  });
}
test('waiting in the chase allows the dog to catch up; failure stays latched', () => {
  const w = create(), d = w.dog; w.x = d.triggerX;
  for (let i = 0; i < 200; i++) tick(w, 1 / 60, 0);
  assert.equal(d.caught, true); assert.equal(d.cleared, false);
});
test('missing the jump restores the pre-chase checkpoint and resets the dog', () => {
  const w = create(), d = w.dog; w.x = d.gapLeft - 20;
  for (let i = 0; i < 160 && !w.recoverySerial; i++) w.step(1 / 60, 1);
  assert(w.recoverySerial > 0); assert.equal(w.x, d.approachX);
  assert.equal(w.y, d.layout.floor); assert.equal(d.active, false);
});
test('completed saves restore on the far side with a dog that stays barking', () => {
  const w = create(), d = w.dog;
  const saved = readProgress(JSON.stringify({ ...w.save(), checkpoint: 'dog-cleared', night: 1, escaped: true, alarm: true }));
  assert(saved); w.restore(saved);
  assert.equal(w.x, d.exitX); assert.equal(d.barking, true);
  for (let i = 0; i < 400; i++) tick(w, 1 / 60, 1);
  assert.equal(d.x, d.stopX); assert.equal(d.caught, false);
  assert.equal(readProgress(JSON.stringify({ ...saved, box: { position: 1, solved: false } })), null);
});
test('reloading an earlier wall save resets the chase instead of leaving a barking dog ahead', () => {
  const w = create(); w.dog.reset(true);
  w.restore({ version: 1, checkpoint: 'crate-cleared', opened: true, box: { position: 1, solved: true } });
  assert.equal(w.dog.active, false); assert.equal(w.dog.cleared, false);
});
