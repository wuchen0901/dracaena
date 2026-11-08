/** Reusable chase beat: the dog has no jump action and never crosses the gap. */
export const DOG_LAYOUT = { origin: 6300, floor: -140, approach: 40, trigger: 160, gap: 650, gapWidth: 90, speed: 185 };
export class DogChaseSegment {
  readonly layout: typeof DOG_LAYOUT;
  x = 0; active = false; barking = false; caught = false; cleared = false;
  catRescued = false; catX = 0; catY = 0;
  clock = 0; private catClock = 0; private catJumpElapsed = -1; private catJumpStartX = 0;
  constructor(layout = DOG_LAYOUT) { this.layout = { ...layout }; this.reset(); }
  get approachX() { return this.layout.origin + this.layout.approach; }
  get triggerX() { return this.layout.origin + this.layout.trigger; }
  get gapLeft() { return this.layout.origin + this.layout.gap; }
  get gapRight() { return this.gapLeft + this.layout.gapWidth; }
  get catPerchLeft() { return this.layout.origin + 70; }
  get catPerchRight() { return this.layout.origin + 190; }
  get catPerchTop() { return this.layout.floor + 100; }
  get catPerchX() { return (this.catPerchLeft + this.catPerchRight) / 2; }
  get blockerWidth() { return 94; }
  get blockerLeft() { return this.gapLeft - 94; }
  get blockerRight() { return this.blockerLeft + this.blockerWidth; }
  get blockerTop() { return this.layout.floor + 92; }
  get blockerX() { return (this.blockerLeft + this.blockerRight) / 2; }
  get stopX() { return this.blockerLeft - 82; }
  get exitX() { return this.gapRight + 70; }
  get frame() { return this.barking ? 4 + Math.floor((this.clock % 1.6) / .4) : Math.floor(this.clock * 10) % 4; }
  get catFrame() { return this.catRescued ? 4 + Math.floor(this.catClock * 9) % 4 : Math.floor(this.catClock * 3) % 4; }
  groundAt(x: number): number | null {
    if (x > this.gapLeft && x < this.gapRight) return -650;
    if (x >= this.catPerchLeft && x <= this.catPerchRight) return this.catPerchTop;
    if (x >= this.blockerLeft && x <= this.blockerRight) return this.blockerTop;
    return null;
  }
  walls() { return [
    { edge: this.gapLeft, top: this.layout.floor, right: false },
    { edge: this.gapRight, top: this.layout.floor, right: true },
    { edge: this.catPerchLeft, top: this.catPerchTop, right: true },
    { edge: this.catPerchRight, top: this.catPerchTop, right: false },
    { edge: this.blockerLeft, top: this.blockerTop, right: true },
    { edge: this.blockerRight, top: this.blockerTop, right: false },
  ]; }
  reset(cleared = false, catRescued = cleared, playerX?: number) {
    this.x = cleared ? this.stopX : this.triggerX - 260;
    this.active = cleared || catRescued; this.barking = cleared; this.caught = false; this.cleared = cleared; this.clock = this.catClock = 0;
    this.catJumpElapsed = -1; this.catJumpStartX = this.gapLeft - 22;
    this.catRescued = catRescued;
    const followX = playerX === undefined ? undefined : playerX - 78;
    this.catX = catRescued && followX !== undefined
      ? (playerX !== undefined && playerX >= this.gapRight + 15 ? Math.max(this.gapRight + 20, followX) : followX)
      : this.catPerchX;
    this.catY = catRescued ? this.layout.floor : this.catPerchTop;
  }
  step(dt: number, playerX: number, playerY: number, grounded: boolean) {
    if (this.caught) return;
    const slice = Math.max(0, Math.min(.25, dt));
    if (!this.active && playerX >= this.approachX) { this.active = true; this.barking = true; this.clock = 0; }
    if (!this.active) return;
    if (!this.catRescued && grounded && playerX >= this.catPerchLeft && playerX <= this.catPerchRight && Math.abs(playerY - this.catPerchTop) < 2) {
      this.catRescued = true; this.barking = false; this.clock = 0; this.catX = playerX - 42; this.catY = this.layout.floor;
    }
    if (this.barking && !this.catRescued && (playerX >= this.triggerX || this.clock >= 3.5)) { this.barking = false; this.clock = 0; }
    if (playerX >= this.gapRight + 15 && grounded && Math.abs(playerY - this.layout.floor) < 2) this.cleared = true;
    if (this.barking) { this.clock += slice; this.followCat(slice, playerX, grounded); return; }
    this.clock += slice;
    this.x = Math.min(this.stopX, this.x + this.layout.speed * slice);
    if (this.x >= this.stopX) { this.barking = true; this.clock = 0; }
    if (!this.cleared && playerX < this.gapLeft && Math.abs(playerX - this.x) < 48 && playerY < this.layout.floor + 65) this.caught = true;
    if (playerX >= this.gapRight + 15 && grounded && Math.abs(playerY - this.layout.floor) < 2) this.cleared = true;
    this.followCat(slice, playerX, grounded);
  }
  private followCat(dt: number, playerX: number, grounded: boolean) {
    this.catClock += dt;
    if (!this.catRescued) return;
    if (playerX >= this.gapRight + 15 && grounded && this.catX <= this.gapLeft) {
      if (this.catJumpElapsed < 0) { this.catJumpElapsed = 0; this.catJumpStartX = this.gapLeft - 22; this.catX = this.catJumpStartX; }
    }
    if (this.catJumpElapsed >= 0) {
      this.catJumpElapsed += dt;
      const t = Math.min(1, this.catJumpElapsed / .62);
      this.catX = this.catJumpStartX + (this.gapRight + 20 - this.catJumpStartX) * t;
      this.catY = this.layout.floor + 78 * 4 * t * (1 - t);
      if (t >= 1) { this.catJumpElapsed = -1; this.catX = Math.max(this.gapRight + 20, playerX - 78); this.catY = this.layout.floor; }
      return;
    }
    if (playerX < this.gapRight + 15 && this.catX > this.gapLeft - 22 && this.catX < this.gapRight) this.catX = this.gapLeft - 22;
    else this.catX += Math.max(-260 * dt, Math.min(260 * dt, playerX - 78 - this.catX));
    const floor = this.groundAt(this.catX);
    this.catY = floor !== null && floor > this.layout.floor ? floor : this.layout.floor;
  }
}
