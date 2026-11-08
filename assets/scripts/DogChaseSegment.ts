/** Reusable chase beat: the dog has no jump action and never crosses the gap. */
export const DOG_LAYOUT = { origin: 5300, floor: -140, approach: 40, trigger: 160, gap: 650, gapWidth: 90, speed: 185 };
export class DogChaseSegment {
  readonly layout: typeof DOG_LAYOUT;
  x = 0; active = false; barking = false; caught = false; cleared = false;
  clock = 0;
  constructor(layout = DOG_LAYOUT) { this.layout = { ...layout }; this.reset(); }
  get approachX() { return this.layout.origin + this.layout.approach; }
  get triggerX() { return this.layout.origin + this.layout.trigger; }
  get gapLeft() { return this.layout.origin + this.layout.gap; }
  get gapRight() { return this.gapLeft + this.layout.gapWidth; }
  get stopX() { return this.gapLeft - 58; }
  get exitX() { return this.gapRight + 70; }
  get frame() { return this.barking ? 4 + Math.floor((this.clock % 1.6) / .4) : Math.floor(this.clock * 10) % 4; }
  groundAt(x: number): number | null { return x > this.gapLeft && x < this.gapRight ? -650 : null; }
  walls() { return [
    { edge: this.gapLeft, top: this.layout.floor, right: false },
    { edge: this.gapRight, top: this.layout.floor, right: true },
  ]; }
  reset(cleared = false) {
    this.x = cleared ? this.stopX : this.triggerX - 260;
    this.active = cleared; this.barking = cleared; this.caught = false; this.cleared = cleared; this.clock = 0;
  }
  step(dt: number, playerX: number, playerY: number, grounded: boolean) {
    if (this.caught) return;
    const slice = Math.max(0, Math.min(.25, dt));
    if (!this.active && playerX >= this.triggerX) this.active = true;
    if (!this.active) return;
    if (playerX >= this.gapRight + 15 && grounded && Math.abs(playerY - this.layout.floor) < 2) this.cleared = true;
    if (this.barking) { this.clock += slice; return; }
    this.clock += slice;
    this.x = Math.min(this.stopX, this.x + this.layout.speed * slice);
    if (this.x >= this.stopX) { this.barking = true; this.clock = 0; }
    if (!this.cleared && playerX < this.gapLeft && Math.abs(playerX - this.x) < 48 && playerY < this.layout.floor + 65) this.caught = true;
    if (playerX >= this.gapRight + 15 && grounded && Math.abs(playerY - this.layout.floor) < 2) this.cleared = true;
  }
}
