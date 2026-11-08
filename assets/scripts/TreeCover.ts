/** Automatic cover uses the existing movement input, with no interaction key. */
export const COVER = { left: 3160, right: 3410, treeX: 3280 };
export class TreeCover {
  amount = 0;
  private phase = 0;
  contains(x: number, grounded: boolean) { return grounded && x >= COVER.left && x <= COVER.right; }
  reset() { this.amount = this.phase = 0; }
  frame(dt: number, x: number, grounded: boolean, speed: number): number | null {
    const target = this.contains(x, grounded) ? 1 : 0;
    const step = Math.max(0, Math.min(dt, .25)) / .22;
    this.amount = target ? Math.min(1, this.amount + step) : Math.max(0, this.amount - step);
    if (!grounded || this.amount === 0) { this.amount = 0; return null; }
    if (this.amount < .35) return 0;
    if (this.amount < .85) return 1;
    if (Math.abs(speed) < 4) return 3;
    this.phase = (this.phase + dt * Math.abs(speed) / 72 * 1.6) % 1;
    return 4 + Math.floor(this.phase * 4);
  }
}
