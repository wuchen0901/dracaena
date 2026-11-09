/** First interactive factory beat: use a crate to reach the belt's manual cutoff. */
export const FACTORY_ESCAPE_LAYOUT = {
  crateStart: -3240,
  crateMin: -3290,
  crateTarget: -3060,
  crateWidth: 84,
  crateHeight: 80,
  pushSpeed: 72,
  leverX: -3015,
  gateX: -2895,
  gateHeight: 240,
  floor: -140,
  exitX: -2630,
};

export type FactoryEscapeSave = { crateX: number; poweredOff: boolean; stopX?: number };

export class FactoryEscapePuzzle {
  crateX = FACTORY_ESCAPE_LAYOUT.crateStart;
  poweredOff = false;
  stopX = -3100;
  moving = false;

  get left() { return this.crateX - FACTORY_ESCAPE_LAYOUT.crateWidth / 2; }
  get right() { return this.crateX + FACTORY_ESCAPE_LAYOUT.crateWidth / 2; }
  get crateTop() { return FACTORY_ESCAPE_LAYOUT.floor + FACTORY_ESCAPE_LAYOUT.crateHeight; }
  get pushSpeed() { return FACTORY_ESCAPE_LAYOUT.pushSpeed; }

  restore(save?: FactoryEscapeSave, solvedFallback = false) {
    this.crateX = Math.max(FACTORY_ESCAPE_LAYOUT.crateMin, Math.min(FACTORY_ESCAPE_LAYOUT.crateTarget, save?.crateX ?? FACTORY_ESCAPE_LAYOUT.crateStart));
    this.poweredOff = save?.poweredOff ?? solvedFallback;
    this.stopX = save?.stopX ?? -3100;
    this.moving = false;
  }

  save(): FactoryEscapeSave { return { crateX: this.crateX, poweredOff: this.poweredOff, stopX: this.stopX }; }

  canGrab(playerX: number, playerY: number, grounded: boolean) {
    return !this.poweredOff && grounded && Math.abs(playerY - FACTORY_ESCAPE_LAYOUT.floor) < 6 &&
      Math.abs(playerX - this.crateX) >= FACTORY_ESCAPE_LAYOUT.crateWidth / 2 &&
      Math.abs(playerX - this.crateX) <= FACTORY_ESCAPE_LAYOUT.crateWidth / 2 + 38;
  }

  move(delta: number) {
    const before = this.crateX;
    this.crateX = Math.max(FACTORY_ESCAPE_LAYOUT.crateMin, Math.min(FACTORY_ESCAPE_LAYOUT.crateTarget, before + delta));
    this.moving = Math.abs(this.crateX - before) > 1e-6;
    return this.crateX - before;
  }

  nearLever(playerX: number, grounded: boolean) {
    return !this.poweredOff && grounded && Math.abs(playerX - FACTORY_ESCAPE_LAYOUT.leverX) < 105;
  }

  canInteract(playerX: number, playerY: number, grounded: boolean) {
    return this.nearLever(playerX, grounded) && playerY >= this.crateTop - 4;
  }

  interact(playerX: number, playerY: number, grounded: boolean) {
    if (!this.canInteract(playerX, playerY, grounded)) return false;
    this.poweredOff = true;
    this.stopX = playerX;
    return true;
  }

  groundAt(x: number) {
    return Math.abs(x - this.crateX) <= FACTORY_ESCAPE_LAYOUT.crateWidth / 2
      ? this.crateTop : null;
  }

  walls(includeCrate = true) {
    return [
      ...(!this.poweredOff ? [{ edge: FACTORY_ESCAPE_LAYOUT.gateX, top: FACTORY_ESCAPE_LAYOUT.floor + FACTORY_ESCAPE_LAYOUT.gateHeight, right: true }] : []),
      ...(includeCrate ? [
        { edge: this.left, top: this.crateTop, right: true },
        { edge: this.right, top: this.crateTop, right: false },
      ] : []),
    ];
  }
}
