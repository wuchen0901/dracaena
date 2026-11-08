import test from 'node:test';
import assert from 'node:assert/strict';
import { SluiceWorld, roadHeight, ROAD, CHANNEL } from '../assets/scripts/SluiceWorld.ts';
import { PushBoxSegment } from '../assets/scripts/PushBoxSegment.ts';
import { cameraHeight } from '../assets/scripts/WorldCamera.ts';

test('canal exit returns smoothly to the opening forest floor and stays level indefinitely', () => {
  assert.equal(roadHeight(ROAD.descentStart), CHANNEL.far);
  assert.equal(roadHeight(ROAD.descentEnd), CHANNEL.near);
  for (const x of [3000, 4100, 6000, 100000]) assert.equal(roadHeight(x), CHANNEL.near);
  const box = new PushBoxSegment(); assert.equal(box.layout.floor, CHANNEL.near);
  assert.equal(box.groundAt(box.layout.origin + box.layout.wallEnd + 1), null);
});
test('walking the descent at 30/60/144 FPS stays grounded with no accumulated elevation', () => {
  for (const fps of [30, 60, 144]) {
    const w = new SluiceWorld(); w.restore({ version: 1, checkpoint: 'far-bank', opened: true });
    for (let i = 0; i < 8 * fps; i++) {
      w.step(1 / fps, 1); assert.equal(w.grounded, true);
      assert(Math.abs(w.y - roadHeight(w.x)) < 1e-6);
    }
    assert.equal(w.y, CHANNEL.near);
    w.restore({ version: 1, checkpoint: 'patrol-approach', opened: true });
    assert.equal(w.y, CHANNEL.near);
  }
});
test('camera keeps whole actor within margins during sudden climbs, jumps and descents', () => {
  for (const fps of [30, 60, 144]) {
    let camera = 0;
    for (const feet of [-140, -40, 65, 198, 600, 900, 250, -140]) {
      camera = cameraHeight(camera, feet, 1 / fps);
      assert(feet - camera <= 150); assert(feet - camera >= -230);
      assert(feet - camera + 112 < 295, 'robot head stays within the clipped viewport');
    }
  }
});
