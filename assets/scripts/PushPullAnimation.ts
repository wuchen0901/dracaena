/** Timing and facing for the dedicated push (row 0) / backward pull (row 1) atlas. */
const FOOT = [.096847, .094595, .094595, .096847, .094808, .094808, .094808, .094808];
// Palm contact planes measured visually within each cell; anchor keeps hands on the box face.
const HAND = [.818, .836, .88, .89, .735, .74, .735, .738];
export const PUSH_PULL_CANVAS = 112;
export class PushPullAnimation {
  private phase = 0;
  private row = 0;
  reset() { this.phase = 0; this.row = 0; }
  frame(dt: number, active: boolean, boxOffset: number, velocity: number, moving: boolean, contactDistance: number) {
    if (!active) { this.reset(); return null; }
    const facing = boxOffset >= 0 ? 1 : -1;
    if (Math.abs(velocity) > 1) this.row = velocity * facing < 0 ? 1 : 0;
    if (moving && Math.abs(velocity) > 1) this.phase = (this.phase + Math.max(0, Math.min(dt, .25)) * Math.abs(velocity) / 72 * 1.5) % 1;
    const index = this.row * 4 + Math.floor(this.phase * 4);
    return { index, facing, anchorX: HAND[index] - contactDistance / PUSH_PULL_CANVAS, anchorY: FOOT[index] };
  }
}
