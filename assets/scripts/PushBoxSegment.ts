/** A self-contained puzzle in local coordinates. Move origin to relocate the segment. */
export const PUSH_BOX_LAYOUT = {
  origin: 4100, floor: -140, entry: 60, boxStart: 310, boxMin: 180,
  boxWidth: 110, boxHeight: 100, wall: 660, height: 205,
  platformEnd: 960, rampEnd: 1260, pushSpeed: 72,
};
export class PushBoxSegment {
  readonly layout: typeof PUSH_BOX_LAYOUT;
  x: number;
  solved = false;
  moving = false;
  constructor(layout = PUSH_BOX_LAYOUT) { this.layout = { ...layout }; this.x = layout.origin + layout.boxStart; }
  get left() { return this.x - this.layout.boxWidth / 2; }
  get right() { return this.x + this.layout.boxWidth / 2; }
  get wallX() { return this.layout.origin + this.layout.wall; }
  get top() { return this.layout.floor + this.layout.height; }
  get entryX() { return this.layout.origin + this.layout.entry; }
  get exitX() { return this.wallX + 100; }
  get minimum() { return this.layout.origin + this.layout.boxMin; }
  get maximum() { return this.wallX - this.layout.boxWidth / 2; }
  canGrab(x: number, y: number, grounded: boolean) {
    const distance = Math.abs(x - this.x);
    return grounded && Math.abs(y - this.layout.floor) < 2 &&
      distance >= this.layout.boxWidth / 2 && distance <= this.layout.boxWidth / 2 + 34;
  }
  move(delta: number) {
    const before = this.x; this.x = Math.max(this.minimum, Math.min(this.maximum, this.x + delta));
    this.moving = this.moving || Math.abs(this.x - before) > .0001; return this.x - before;
  }
  groundAt(x: number): number | null {
    const c = this.layout, local = x - c.origin;
    if (local >= c.wall && local <= c.platformEnd) return this.top;
    if (local > c.platformEnd && local < c.rampEnd) return c.floor + c.height * (c.rampEnd - local) / (c.rampEnd - c.platformEnd);
    if (x >= this.left - 3 && x <= this.right + 3) return c.floor + c.boxHeight;
    return null;
  }
  walls() { return [
    { edge: this.wallX, top: this.top, right: true },
    { edge: this.left, top: this.layout.floor + this.layout.boxHeight, right: true },
    { edge: this.right, top: this.layout.floor + this.layout.boxHeight, right: false },
  ]; }
  save() { return { position: (this.x - this.minimum) / (this.maximum - this.minimum), solved: this.solved }; }
  restore(state?: { position: number; solved: boolean }) {
    this.x = state ? this.minimum + Math.max(0, Math.min(1, state.position)) * (this.maximum - this.minimum) : this.layout.origin + this.layout.boxStart;
    this.solved = state ? state.solved : false; this.moving = false;
  }
}
