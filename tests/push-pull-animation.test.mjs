import test from 'node:test';
import assert from 'node:assert/strict';
import { PushPullAnimation, PUSH_PULL_CANVAS } from '../assets/scripts/PushPullAnimation.ts';

test('push and pull select different rows while facing the crate on either side', () => {
  for (const facing of [-1, 1]) {
    const a = new PushPullAnimation();
    const push = a.frame(.1, true, facing * 67, facing * 72, true, 12);
    assert(push.index < 4); assert.equal(push.facing, facing);
    const pull = a.frame(.1, true, facing * 67, -facing * 72, true, 12);
    assert(pull.index >= 4); assert.equal(pull.facing, facing);
  }
});
test('stationary gripping freezes the planted pose and release clears the animation', () => {
  const a = new PushPullAnimation(); a.frame(.2, true, 67, -72, true, 12);
  const hold = a.frame(.1, true, 67, 0, false, 12);
  for (let i = 0; i < 50; i++) assert.equal(a.frame(.1, true, 67, 0, false, 12).index, hold.index);
  assert.equal(a.frame(.1, false, 67, 0, false, 12), null);
  assert.equal(a.frame(0, true, 67, 0, false, 12).index, 0);
});
test('all gait frames play with equal timing at 30/60/144 FPS', () => {
  for (const fps of [30, 60, 144]) {
    const a = new PushPullAnimation(), frames = new Set();
    for (let i = 0; i < fps; i++) frames.add(a.frame(1 / fps, true, 67, 72, true, 12).index);
    assert.deepEqual([...frames].sort(), [0, 1, 2, 3]);
  }
});
test('changing grip distance compensates the hand anchor without shifting the contact plane', () => {
  const a = new PushPullAnimation();
  const near = a.frame(0, true, 67, 0, false, 12);
  const far = a.frame(0, true, 85, 0, false, 30);
  assert(Math.abs((near.anchorX - far.anchorX) * PUSH_PULL_CANVAS - 18) < 1e-6);
});
