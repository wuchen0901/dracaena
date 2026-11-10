/** A silent rescue that the player can verify by operating the same switch. */
export const SHADOW_RESCUE = {
  entryX: 19100,
  trapX: 19460,
  switchX: 19940,
  exitX: 20120,
};

export class ShadowRescueSegment {
  stage = 0; // approaching, trapped, passage opened, switch confirmed
  trappedSeconds = 0;
  toggleSeconds = 0;

  get active() { return this.stage > 0 && this.stage < 3; }
  get rescued() { return this.stage >= 2; }
  get confirmed() { return this.stage >= 3; }

  tick(dt: number, playerX: number) {
    this.toggleSeconds = Math.max(0, this.toggleSeconds - dt);
    if (this.stage === 0 && playerX >= SHADOW_RESCUE.trapX - 13) {
      this.stage = 1;
      this.trappedSeconds = 0;
    }
    if (this.stage === 1) {
      this.trappedSeconds += dt;
      if (this.trappedSeconds >= 2.3) this.stage = 2;
    }
  }

  canInteract(x: number, y: number, grounded: boolean) {
    return this.stage === 2 && grounded && Math.abs(y + 140) < 8 && Math.abs(x - SHADOW_RESCUE.switchX) < 100;
  }

  interact(x: number, y: number, grounded: boolean) {
    if (!this.canInteract(x, y, grounded)) return false;
    this.stage = 3;
    this.toggleSeconds = 1.2;
    return true;
  }

  restore(stage = 0) {
    this.stage = Number.isInteger(stage) ? Math.max(0, Math.min(3, stage)) : 0;
    this.trappedSeconds = 0;
    this.toggleSeconds = 0;
  }

  save() { return { stage: this.stage }; }

  walls() {
    const walls: { edge: number; top: number; right: boolean }[] = [];
    if (this.stage < 2) walls.push({ edge: SHADOW_RESCUE.trapX, top: 220, right: true });
    if (this.stage < 3) walls.push({ edge: SHADOW_RESCUE.exitX, top: 220, right: true });
    if (this.stage >= 3) walls.push({ edge: SHADOW_RESCUE.trapX, top: 220, right: false });
    return walls;
  }
}
