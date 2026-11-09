import { Color, Graphics } from 'cc';

/** A calm downstream crossing: steer right and let the current carry the boat. */
export const RIVER_LAYOUT = {
  origin: 8460, approach: 0, waterStart: 150, boardOffset: 60, waterEnd: 1030, exit: 1180,
  deckY: -78, waterY: -116, rowingSpeed: 190,
};

export class RiverCrossing {
  readonly layout = { ...RIVER_LAYOUT };
  get approachX() { return this.layout.origin + this.layout.approach; }
  get waterLeft() { return this.layout.origin + this.layout.waterStart; }
  get waterRight() { return this.layout.origin + this.layout.waterEnd; }
  get boardX() { return this.waterLeft - this.layout.boardOffset; }
  get disembarkX() { return this.waterRight - 55; }
  get exitX() { return this.layout.origin + this.layout.exit; }
  get launchBoatX() { return this.boardX + 25; }
  get landingBoatX() { return this.disembarkX + 25; }
  isOnBoat(x: number) { return x >= this.boardX && x < this.disembarkX; }
  isOnRamp(x: number) { return x >= this.disembarkX && x <= this.exitX; }
  rampY(x: number) {
    const t = Math.max(0, Math.min(1, (x - this.disembarkX) / (this.exitX - this.disembarkX)));
    return this.layout.deckY + (-140 - this.layout.deckY) * t;
  }
}

export function drawRiverCrossing(g: Graphics, river: RiverCrossing, camera: number, time: number, boatX: number) {
  g.clear();
  const c = river.layout, sx = (x: number) => x - camera;
  const left = river.waterLeft, right = river.waterRight;
  const rect = (x: number, y: number, w: number, h: number, color: Color) => {
    g.fillColor = color; g.rect(sx(x), y, w, h); g.fill();
  };
  const line = (x: number, y: number, x2: number, y2: number, color: Color, width = 2) => {
    g.strokeColor = color; g.lineWidth = width; g.moveTo(sx(x), y); g.lineTo(sx(x2), y2); g.stroke();
  };

  // A wide, dark river interrupts the ruined road. The crossing is visible before the player reaches it.
  rect(left, -430, right - left, 338, new Color(28, 53, 53));
  rect(left, c.waterY - 9, right - left, 12, new Color(67, 104, 91));
  line(left + 3, c.waterY, right - 3, c.waterY, new Color(137, 153, 119, 190), 3);
  for (let band = 0; band < 4; band++) {
    const y = c.waterY - 32 - band * 48;
    const offset = (time * (28 + band * 9)) % 150;
    for (let x = left - 150 + offset; x < right; x += 150) {
      line(x, y, Math.min(x + 60, right), y + Math.sin(time * 1.4 + x * .01 + band) * 3, new Color(103, 131, 111, 105), 2);
    }
  }
  // Uneven masonry banks and a few reeds frame the simple, safe route.
  for (const bankX of [left - 20, right - 28]) {
    rect(bankX, -154, 44, 46, new Color(86, 76, 61));
    rect(bankX + 5, -146, 34, 13, new Color(123, 103, 72));
    for (let i = 0; i < 3; i++) {
      const x = bankX + 7 + i * 14;
      line(x, -109, x + Math.sin(time + i) * 7, -65 - (i % 2) * 14, new Color(95, 125, 78), 3);
    }
  }

  const bob = Math.sin(time * 2.2) * 2;
  const deck = c.deckY + bob;
  // A battered skiff, plank seams, and two animated oars make the crossing readable at a glance.
  g.fillColor = new Color(68, 64, 49);
  g.moveTo(sx(boatX - 86), deck - 10); g.lineTo(sx(boatX - 64), deck - 39);
  g.lineTo(sx(boatX + 65), deck - 39); g.lineTo(sx(boatX + 88), deck - 10);
  g.close(); g.fill();
  g.strokeColor = new Color(145, 113, 70); g.lineWidth = 4;
  g.moveTo(sx(boatX - 84), deck - 8); g.lineTo(sx(boatX + 85), deck - 8); g.stroke();
  for (let plank = -2; plank <= 2; plank++) {
    line(boatX + plank * 27, deck - 13, boatX + plank * 22, deck - 35, new Color(111, 91, 62), 2);
  }
  const stroke = Math.sin(time * 4.2) * 9;
  for (const side of [-1, 1]) {
    const pivotX = boatX + side * 26, tipX = boatX + side * (68 + stroke);
    line(pivotX, deck - 2, tipX, deck - 37, new Color(153, 130, 89), 5);
    line(tipX - 9, deck - 36, tipX + 9, deck - 39, new Color(128, 111, 75), 7);
  }

  // Short gangways make boarding on the near bank and stepping ashore on the far bank legible.
  if (boatX <= left + 100 || boatX >= right - 130) {
    const nearDock = boatX <= left + 100;
    const rampStart = nearDock ? left - 135 : right + 130;
    const rampEnd = nearDock ? boatX - 55 : boatX + 55;
    const groundY = -140, deckY = deck - 8;
    g.fillColor = new Color(96, 81, 57);
    g.moveTo(sx(rampStart), groundY); g.lineTo(sx(rampStart + 18), groundY - 1);
    g.lineTo(sx(rampEnd + 8), deckY - 5); g.lineTo(sx(rampEnd - 9), deckY - 5); g.close(); g.fill();
    line(rampStart, groundY + 3, rampEnd, deckY - 3, new Color(151, 126, 81), 3);
    line(rampStart + 12, groundY - 1, rampEnd + 12, deckY - 3, new Color(57, 53, 42), 2);
  }
}

/** Draw the near gunwale over the rider's lower body so they read as seated inside the boat. */
export function drawRiverBoatFront(g: Graphics, river: RiverCrossing, camera: number, time: number, playerX: number, onBoat: boolean) {
  g.clear();
  if (!onBoat) return;
  const x = playerX + 25 - camera, deck = river.layout.deckY + Math.sin(time * 2.2) * 2;
  g.fillColor = new Color(76, 66, 48);
  g.moveTo(x - 58, deck - 5); g.lineTo(x - 46, deck - 28); g.lineTo(x + 46, deck - 28); g.lineTo(x + 58, deck - 5); g.close(); g.fill();
  g.strokeColor = new Color(156, 124, 74); g.lineWidth = 4;
  g.moveTo(x - 58, deck - 5); g.lineTo(x + 58, deck - 5); g.stroke();
  g.strokeColor = new Color(43, 47, 37); g.lineWidth = 2;
  g.moveTo(x - 32, deck - 10); g.lineTo(x - 28, deck - 24); g.moveTo(x + 30, deck - 10); g.lineTo(x + 25, deck - 24); g.stroke();
}
