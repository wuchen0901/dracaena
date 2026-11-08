import assert from 'node:assert/strict';
import test from 'node:test';
import { CharacterAnimation, CHARACTER_COLUMNS as columns } from '../assets/scripts/CharacterAnimation.ts';

function framesAt(speed, seconds = 2, dt = 1 / 60) {
  const animation = new CharacterAnimation(), seen = new Set();
  for (let t = 0; t < seconds; t += dt) seen.add(animation.frame(dt, speed, 0, true));
  return [...seen].sort((a, b) => a - b);
}

test('all eight distinct frames play in idle, walk and run loops', () => {
  for (const [speed, row] of [[0, 0], [145, 1], [240, 2]]) {
    assert.deepEqual(framesAt(speed), Array.from({ length: columns }, (_, i) => row * columns + i));
  }
});

test('walk/run transitions retain the matching foot phase in both directions', () => {
  const animation = new CharacterAnimation();
  assert.equal(animation.frame(.15625, 145, 0, true), 10);
  assert.equal(animation.frame(0, 240, 0, true), 18);
  assert.equal(animation.frame(0, 145, 0, true), 10);
});

test('run hysteresis prevents row flicker around the old speed threshold', () => {
  const animation = new CharacterAnimation();
  animation.frame(.1, 190, 0, true); assert.equal(animation.motion, 'run');
  for (const speed of [174, 176, 170, 180]) {
    animation.frame(.016, speed, 0, true); assert.equal(animation.motion, 'run');
  }
  animation.frame(.016, 160, 0, true); assert.equal(animation.motion, 'walk');
  animation.frame(.016, 180, 0, true); assert.equal(animation.motion, 'walk');
});

test('jump follows vertical motion and landing plays the two recovery poses', () => {
  const animation = new CharacterAnimation();
  for (const [vy, index] of [[610, 24], [450, 25], [180, 26], [0, 27], [-200, 28], [-500, 29]]) {
    assert.equal(animation.frame(.04, 145, vy, false), index);
  }
  assert.equal(animation.frame(.08, 145, 0, true), 30);
  assert.equal(animation.frame(.08, 145, 0, true), 31);
  const walking = animation.frame(.016, 145, 0, true);
  assert.ok(walking >= 8 && walking < 16);
});

test('jumping during landing responds immediately and reset clears animation state', () => {
  const animation = new CharacterAnimation();
  animation.frame(.2, 0, -200, false); animation.frame(.016, 0, 0, true);
  assert.equal(animation.motion, 'land');
  assert.equal(animation.frame(.016, 0, 610, false), 24);
  animation.reset(); assert.equal(animation.frame(0, 0, 0, true), 0);
});

test('cycle timing is independent of display frame rate', () => {
  const phases = [30, 60, 144].map(fps => {
    const animation = new CharacterAnimation();
    for (let i = 0; i < fps; i++) animation.frame(1 / fps, 117, 0, true);
    return animation.frame(0, 117, 0, true);
  });
  assert.equal(new Set(phases).size, 1);
});
