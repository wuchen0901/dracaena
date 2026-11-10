/** Player-operated mirror of the reclamation cycle seen at the beginning. */
export const DISMANTLE_ROOM = {
  startX: 27800,
  endX: 30200,
  consoleX: 28660,
  revealX: 29600,
  maxStep: 4,
};

export class FactoryDismantle {
  stepIndex = 0;
  get solved() { return this.stepIndex >= DISMANTLE_ROOM.maxStep; }
  canInteract(x: number, y: number, grounded: boolean) {
    return !this.solved && grounded && Math.abs(y + 140) < 8 && Math.abs(x - DISMANTLE_ROOM.consoleX) < 105;
  }
  interact(x: number, y: number, grounded: boolean) {
    if (!this.canInteract(x, y, grounded)) return false;
    this.stepIndex = Math.min(DISMANTLE_ROOM.maxStep, this.stepIndex + 1);
    return true;
  }
  restore(stepIndex = 0) {
    this.stepIndex = Number.isInteger(stepIndex) ? Math.max(0, Math.min(DISMANTLE_ROOM.maxStep, stepIndex)) : 0;
  }
  save() { return { stepIndex: this.stepIndex }; }
  walls() {
    return this.solved ? [] : [{ edge: DISMANTLE_ROOM.endX, top: 900, right: true }];
  }
}
