import test from 'node:test';
import assert from 'node:assert/strict';
import { TreeCover, COVER } from '../assets/scripts/TreeCover.ts';

test('walking through the tree automatically lowers, holds and rises at different frame rates', () => {
  for (const fps of [30, 60, 144]) {
    const cover = new TreeCover(); const dt = 1 / fps;
    assert.equal(cover.frame(dt, COVER.left - 10, true, 145), null);
    for (let i = 0; i < fps; i++) cover.frame(dt, COVER.treeX, true, 72);
    assert.equal(cover.amount, 1);
    assert.equal(cover.frame(dt, COVER.treeX, true, 0), 3);
    const moving = new Set();
    for (let i = 0; i < fps; i++) moving.add(cover.frame(dt, COVER.treeX, true, 72));
    assert.deepEqual([...moving].sort(), [4, 5, 6, 7]);
    for (let i = 0; i < fps; i++) cover.frame(dt, COVER.right + 10, true, 145);
    assert.equal(cover.amount, 0);
    assert.equal(cover.frame(dt, COVER.right + 10, true, 145), null);
  }
});
test('jumping and checkpoint reset release the crouch', () => {
  const cover = new TreeCover(); cover.frame(.25, COVER.treeX, true, 0);
  assert.equal(cover.frame(.016, COVER.treeX, false, 0), null);
  cover.frame(.25, COVER.treeX, true, 0); cover.reset();
  assert.equal(cover.amount, 0);
});
