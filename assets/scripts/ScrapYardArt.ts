import { Color, Graphics } from 'cc';
import { SALVAGE } from './SluiceWorld';

/** A silent processing line that reveals the protagonist is one of many marked for erasure. */
export function drawScrapYard(g: Graphics, camera: number, time: number) {
  g.clear();
  const sx = (x: number) => x - camera;
  const rect = (x: number, y: number, w: number, h: number, color: Color) => {
    g.fillColor = color; g.rect(sx(x), y, w, h); g.fill();
  };
  const line = (x: number, y: number, x2: number, y2: number, color: Color, width = 3) => {
    g.strokeColor = color; g.lineWidth = width; g.moveTo(sx(x), y); g.lineTo(sx(x2), y2); g.stroke();
  };
  const c = SALVAGE;
  const steel = new Color(53, 67, 61), edge = new Color(104, 119, 94), dark = new Color(20, 31, 30);
  const vine = new Color(82, 114, 73), amber = new Color(221, 168, 75);
  // Bent gantry and cable runs.
  for (const x of [c.origin + 65, c.origin + 430, c.origin + 810, c.origin + 1110]) {
    rect(x, -20, 22, 275, steel); rect(x - 18, 238, 58, 14, edge);
    line(x + 10, 205, x + 10, 278, dark, 7);
  }
  line(c.origin + 75, 246, c.origin + 1125, 246, edge, 8);
  line(c.origin + 75, 229, c.origin + 1125, 229, dark, 5);
  // The rollers and torn belt keep moving even though the line has been abandoned.
  rect(c.origin + 18, -133, 1150, 25, dark);
  line(c.origin + 20, -108, c.origin + 1170, -108, edge, 5);
  for (let x = c.origin + 35; x < c.origin + 1170; x += 38) {
    const y = -121 + Math.sin(x * .04 + time * 5) * 2;
    g.fillColor = new Color(97, 110, 88); g.circle(sx(x), y, 5); g.fill();
    const stripeX = c.origin + 25 + ((x - c.origin + time * 65) % 52);
    line(stripeX, -130, stripeX + 16, -110, new Color(136, 146, 109, 180), 2);
  }
  // Bent piles of casing, limbs and panels on their way to the press.
  for (let i = 0; i < 6; i++) {
    const x = c.origin + 170 + i * 150;
    const tilt = Math.sin(i * 2.1) * 8;
    g.fillColor = i === 2 ? new Color(104, 104, 76) : steel;
    g.roundRect(sx(x) - 40, -103 + tilt, 78, 46, 8); g.fill();
    g.fillColor = dark; g.roundRect(sx(x) - 26, -88 + tilt, 47, 21, 7); g.fill();
    g.fillColor = i === 2 ? amber : new Color(91, 117, 89);
    g.circle(sx(x) - 12, -78 + tilt, 4); g.fill();
    line(x - 25, -101 + tilt, x - 56, -126, edge, 8);
    line(x + 28, -99 + tilt, x + 54, -125, edge, 8);
  }
  // The crusher pauses above the belt, its red status lamp long dead.
  const pressX = c.origin + 1040, pressOffset = 7 + Math.sin(time * 1.4) * 5;
  rect(pressX, 180, 105, 26, steel); rect(pressX + 18, 26 - pressOffset, 69, 145, edge);
  rect(pressX - 5, -3 - pressOffset, 116, 29, new Color(89, 91, 68));
  rect(pressX + 42, 206, 20, 12, new Color(112, 68, 47));
  for (let i = 0; i < 4; i++) line(pressX + i * 24, 186, pressX + i * 24 + 13, 175, new Color(178, 151, 85), 4);
  // Nature has started to pull the machine apart.
  for (const x of [c.origin + 115, c.origin + 508, c.origin + 905]) {
    line(x, 246, x + 8, 191, vine, 5); line(x + 8, 212, x + 34, 199, vine, 3);
    g.fillColor = vine; g.ellipse(sx(x + 34), 200, 10, 5); g.fill();
  }
  // A small surviving beacon points beyond the salvage line.
  const bx = c.beacon, pulse = .55 + .35 * Math.sin(time * 3);
  rect(bx - 8, -108, 16, 178, steel); rect(bx - 28, 64, 56, 13, edge);
  g.fillColor = new Color(234, 183, 87, Math.round(110 + 120 * pulse));
  g.circle(sx(bx), 95, 10 + pulse * 3); g.fill();
  g.strokeColor = new Color(234, 183, 87, 100); g.lineWidth = 2;
  g.ellipse(sx(bx), 95, 27 + pulse * 7, 9 + pulse * 2); g.stroke();
}
