import { Color, Graphics } from 'cc';

/** A compact factory puzzle: a weight plate drives a sliding service bridge. */
export const PRESS_LAYOUT = {
  origin: 7650, floor: -140, entry: 50, crateStart: 230, crateWidth: 82, crateHeight: 78,
  plate: 326, gapLeft: 410, gapRight: 690, bridgeStart: 340, bridgeEnd: 555,
  bridgeWidth: 170, bridgeHeight: 84, travelSeconds: 2.4, retractSeconds: 2.8, exit: 760,
};

export class IndustrialPressSegment {
  readonly layout = { ...PRESS_LAYOUT };
  crateX = this.layout.origin + this.layout.crateStart;
  bridgeX = this.layout.origin + this.layout.bridgeStart;
  pressure = 0;
  solved = false;
  moving = false;

  get left() { return this.crateX - this.layout.crateWidth / 2; }
  get right() { return this.crateX + this.layout.crateWidth / 2; }
  get plateX() { return this.layout.origin + this.layout.plate; }
  get entryX() { return this.layout.origin + this.layout.entry; }
  get exitX() { return this.layout.origin + this.layout.exit; }
  get bridgeTop() { return this.layout.floor + this.layout.bridgeHeight; }
  canGrab(x: number, y: number, grounded: boolean) {
    const distance = Math.abs(x - this.crateX);
    return grounded && Math.abs(y - this.layout.floor) < 3 && distance >= this.layout.crateWidth / 2 && distance <= this.layout.crateWidth / 2 + 36;
  }

  moveCrate(delta: number) {
    const before = this.crateX;
    this.crateX = Math.max(this.layout.origin + 155, Math.min(this.plateX + 12, this.crateX + delta));
    this.moving = this.moving || Math.abs(this.crateX - before) > .0001;
    return this.crateX - before;
  }

  tick(dt: number, playerX: number, playerY: number, grounded: boolean) {
    const boxOnPlate = this.right >= this.plateX - 18 && this.left <= this.plateX + 18;
    const playerOnPlate = grounded && Math.abs(playerY - this.layout.floor) < 5 && Math.abs(playerX - this.plateX) < 27;
    const pressed = boxOnPlate || playerOnPlate;
    this.pressure = Math.max(0, Math.min(1, this.pressure + (pressed ? dt / this.layout.travelSeconds : -dt / this.layout.retractSeconds)));
    const oldX = this.bridgeX;
    this.bridgeX = this.layout.origin + this.layout.bridgeStart + (this.layout.bridgeEnd - this.layout.bridgeStart) * this.pressure;
    this.moving = Math.abs(this.bridgeX - oldX) > .01 || this.moving;
    if (boxOnPlate && this.pressure === 1) this.solved = true;
  }

  carriedDelta(x: number, y: number, grounded: boolean, previousX: number) {
    const half = this.layout.bridgeWidth / 2;
    return grounded && Math.abs(y - this.bridgeTop) < 3 && x >= previousX - half && x <= previousX + half
      ? this.bridgeX - previousX : 0;
  }

  groundAt(x: number): number | null {
    if (x >= this.layout.origin + this.layout.gapLeft && x <= this.layout.origin + this.layout.gapRight) {
      return Math.abs(x - this.bridgeX) <= this.layout.bridgeWidth / 2 ? this.bridgeTop : null;
    }
    return null;
  }

  walls(includeCrate = true) {
    return includeCrate ? [
      { edge: this.left, top: this.layout.floor + this.layout.crateHeight, right: true },
      { edge: this.right, top: this.layout.floor + this.layout.crateHeight, right: false },
    ] : [];
  }

  save() { return { crate: (this.crateX - (this.layout.origin + 155)) / (this.plateX + 12 - (this.layout.origin + 155)), pressure: this.pressure, solved: this.solved }; }
  restore(state?: { crate: number; pressure: number; solved: boolean }) {
    this.crateX = this.layout.origin + 155 + Math.max(0, Math.min(1, state?.crate ?? ((this.layout.crateStart - 155) / (this.layout.plate + 12 - 155)))) * (this.layout.plate + 12 - 155);
    this.pressure = Math.max(0, Math.min(1, state?.pressure ?? 0));
    this.bridgeX = this.layout.origin + this.layout.bridgeStart + (this.layout.bridgeEnd - this.layout.bridgeStart) * this.pressure;
    this.solved = state?.solved ?? false; this.moving = false;
  }
}

export function drawIndustrialPress(g: Graphics, puzzle: IndustrialPressSegment, camera: number, time: number) {
  g.clear(); const c = puzzle.layout, sx = (x: number) => x - camera;
  const rect = (x: number, y: number, w: number, h: number, color: Color) => { g.fillColor = color; g.rect(sx(x), c.floor + y, w, h); g.fill(); };
  const line = (x: number, y: number, x2: number, y2: number, color: Color, width = 2) => { g.strokeColor = color; g.lineWidth = width; g.moveTo(sx(x), c.floor + y); g.lineTo(sx(x2), c.floor + y2); g.stroke(); };
  const steel = new Color(48, 59, 56), edge = new Color(107, 117, 98), rust = new Color(132, 76, 48), amber = new Color(220, 168, 75);
  // Low machine gantry frames the gap; the lit plate teaches the pressure interaction.
  for (const x of [c.origin + 180, c.origin + 390, c.origin + 680]) {
    rect(x, 0, 18, 215, steel); rect(x - 22, 208, 63, 12, edge);
    rect(x + 5, 36, 6, 110, rust);
  }
  line(c.origin + 190, 214, c.origin + 690, 214, edge, 9);
  line(c.origin + 193, 202, c.origin + 690, 202, steel, 4);
  // Visible rails show that the bridge is meant to travel horizontally.
  line(c.origin + 330, 108, c.origin + 675, 108, edge, 7);
  line(c.origin + 330, 93, c.origin + 675, 93, steel, 4);
  const half = c.bridgeWidth / 2;
  rect(puzzle.bridgeX - half, 66, c.bridgeWidth, 18, steel);
  rect(puzzle.bridgeX - half + 8, 84, c.bridgeWidth - 16, 7, edge);
  for (let x = puzzle.bridgeX - half + 12; x < puzzle.bridgeX + half - 5; x += 23) line(x, 68, x + 10, 82, rust, 2);
  rect(c.origin + c.plate - 28, 1, 56, 7, new Color(31, 37, 35));
  const lamp = .45 + .45 * Math.sin(time * 4);
  rect(c.origin + c.plate - 19, 8, 38, 8, puzzle.pressure > 0 ? amber : new Color(91, 84, 61));
  g.fillColor = new Color(255, 188, 70, Math.round(90 + 130 * lamp * puzzle.pressure));
  g.circle(sx(c.origin + c.plate), c.floor + 12, 13 + lamp * 3); g.fill();
  // Deep machinery trench and striped caution edges read clearly in silhouette.
  rect(c.origin + c.gapLeft, -50, c.gapRight - c.gapLeft, 50, new Color(20, 27, 26));
  for (let x = c.origin + c.gapLeft + 10; x < c.origin + c.gapRight; x += 34) line(x, -46, x + 17, -35, rust, 3);
  const box = puzzle.crateX, boxHalf = c.crateWidth / 2;
  rect(box - boxHalf, 0, c.crateWidth, c.crateHeight, new Color(106, 83, 56));
  rect(box - boxHalf + 7, 7, c.crateWidth - 14, c.crateHeight - 14, new Color(122, 96, 60));
  for (let x = box - boxHalf + 12; x < box + boxHalf - 4; x += 20) line(x, 8, x, c.crateHeight - 8, new Color(69, 61, 46), 2);
  rect(box - boxHalf, 8, c.crateWidth, 6, edge); rect(box - boxHalf, c.crateHeight - 14, c.crateWidth, 6, edge);
  line(c.origin + c.gapLeft - 28, 0, c.origin + c.gapLeft + 2, 0, amber, 3);
  line(c.origin + c.gapRight - 2, 0, c.origin + c.gapRight + 30, 0, amber, 3);
}
