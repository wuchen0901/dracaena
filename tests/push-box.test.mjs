import test from 'node:test';
import assert from 'node:assert/strict';
import { PushBoxSegment, PUSH_BOX_LAYOUT } from '../assets/scripts/PushBoxSegment.ts';
import { SluiceWorld, readProgress } from '../assets/scripts/SluiceWorld.ts';
function create(layout = PUSH_BOX_LAYOUT) {
  const box = new PushBoxSegment(layout), w = new SluiceWorld(box);
  w.restore({ version: 1, checkpoint: 'patrol-cleared', opened: true });
  w.x = box.entryX; w.y = box.layout.floor;
  return w;
}
function advance(w, seconds, dir = 0, grab = false, fps = 60) {
  for (let i = 0; i < Math.round(seconds * fps); i++) w.step(1 / fps, dir, false, grab);
}
for (const fps of [30, 60, 144]) {
  test(`push box, climb it, reach the high ledge and descend the ramp at ${fps} FPS`, () => {
    const w = create(), box = w.box;
    advance(w, 2, 1, false, fps);
    assert(Math.abs(w.x - (box.left - 12)) < .1, 'crate blocks ordinary movement');
    const before = box.x;
    advance(w, 6, 1, true, fps);
    assert(box.x > before); assert.equal(box.x, box.maximum);
    advance(w, .3, 0, false, fps);
    w.jump(); advance(w, .9, 1, false, fps);
    assert.equal(w.grounded, true); assert.equal(w.y, box.layout.floor + box.layout.boxHeight);
    advance(w, .2, 0, false, fps);
    w.jump(); advance(w, 1.2, 1, false, fps);
    assert(w.x > box.wallX + 35); assert.equal(w.y, box.top);
    assert.equal(w.checkpoint, 'crate-cleared'); assert.equal(box.solved, true);
    advance(w, 5, 1, false, fps); assert(w.x > box.layout.origin + box.layout.rampEnd);
    assert.equal(w.y, box.layout.floor);
  });
}
test('high ledge cannot be reached directly, even with repeated running jumps', () => {
  const w = create(), box = w.box;
  w.x = box.wallX - 13;
  for (let i = 0; i < 5; i++) { w.jump(); for (let j = 0; j < 90; j++) w.step(1 / 60, 1, true); }
  assert(w.x < box.wallX); assert.equal(box.solved, false);
});
test('pulling is reversible, range limited, and cannot move the box while standing on it', () => {
  const w = create(), box = w.box;
  w.x = box.left - 12;
  advance(w, 1, 1, true); const pushed = box.x;
  advance(w, 1, -1, true); assert(box.x < pushed);
  advance(w, 8, -1, true); assert.equal(box.x, box.minimum);
  w.x = box.x; w.y = box.layout.floor + box.layout.boxHeight; w.vx = 0;
  advance(w, .2, 1, true); assert.equal(box.x, box.minimum);
});
test('box position and solved checkpoint restore from an archived progress snapshot', () => {
  const w = create(); advance(w, .1); w.x = w.box.left - 12; advance(w, 1, 1, true);
  const save = readProgress(JSON.stringify({ ...w.save(), night: 1, escaped: true, alarm: true }));
  const restored = create(); restored.restore(save);
  assert.equal(restored.box.x, w.box.x); assert.equal(restored.x, restored.box.entryX);
  const solved = readProgress(JSON.stringify({ ...save, checkpoint: 'crate-cleared', box: { position: 1, solved: true } }));
  restored.restore(solved); assert.equal(restored.box.solved, true); assert.equal(restored.y, restored.box.top);
  assert.equal(readProgress(JSON.stringify({ ...save, box: { position: 2, solved: false } })), null);
  assert.equal(readProgress(JSON.stringify({ ...save, checkpoint: 'crate-cleared', box: { position: 1, solved: false } })), null);
});
test('relocating the segment keeps local geometry and saved box placement intact', () => {
  const shifted = { ...PUSH_BOX_LAYOUT, origin: 6100 };
  const a = create(), b = create(shifted);
  a.box.move(100); b.box.restore(a.box.save());
  assert.equal(b.box.x - a.box.x, 2000); assert.equal(b.box.wallX - a.box.wallX, 2000);
  assert.equal(b.box.groundAt(b.box.wallX + 40), a.box.top);
});
