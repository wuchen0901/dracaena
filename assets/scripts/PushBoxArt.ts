import { Color, Graphics } from 'cc';
import type { PushBoxSegment } from './PushBoxSegment';

export function drawPushBox(g: Graphics, puzzle: PushBoxSegment, camera: number) {
  g.clear(); const c = puzzle.layout, base = c.origin - camera;
  const rect = (x: number, y: number, w: number, h: number, color: Color) => { g.fillColor = color; g.rect(base + x, c.floor + y, w, h); g.fill(); };
  const line = (x: number, y: number, x2: number, y2: number, color: Color, width = 2) => {
    g.strokeColor = color; g.lineWidth = width; g.moveTo(base + x, c.floor + y); g.lineTo(base + x2, c.floor + y2); g.stroke();
  };
  const stone = new Color(61, 75, 70), moss = new Color(111, 135, 91), wood = new Color(139, 116, 77);
  rect(c.wall, 0, c.platformEnd - c.wall, c.height, stone);
  g.fillColor = stone; g.moveTo(base + c.platformEnd, c.floor);
  g.lineTo(base + c.platformEnd, c.floor + c.height); g.lineTo(base + c.rampEnd, c.floor); g.close(); g.fill();
  line(c.wall, c.height, c.platformEnd, c.height, moss, 5);
  line(c.platformEnd, c.height, c.rampEnd, 0, moss, 5);
  for (let y = 26; y < c.height; y += 32) {
    line(c.wall, y, c.platformEnd, y, new Color(38, 53, 48));
    for (let x = c.wall + (y % 64 === 26 ? 40 : 90); x < c.platformEnd; x += 100) line(x, y, x, y + 30, new Color(41, 56, 51));
  }
  // Wear and a drag track hint at the relationship without spelling out the solution.
  line(c.boxMin - 20, 2, c.wall - 6, 2, new Color(159, 146, 104, 120), 3);
  line(c.boxMin, -5, c.wall - 8, -5, new Color(85, 76, 53), 2);
  rect(c.boxMin - c.boxWidth / 2 - 12, 0, 12, 16, stone);
  for (let y = 40; y < 175; y += 32) line(c.wall + 2, y, c.wall + 20, y + 8, new Color(142, 143, 109), 3);
  const box = puzzle.x - c.origin, half = c.boxWidth / 2;
  rect(box - half, 0, c.boxWidth, c.boxHeight, wood);
  for (let x = box - half + 10; x < box + half; x += 24) line(x, 5, x, c.boxHeight - 5, new Color(91, 75, 50), 2);
  rect(box - half, 0, c.boxWidth, 8, new Color(72, 82, 73));
  rect(box - half, c.boxHeight - 8, c.boxWidth, 8, new Color(98, 111, 89));
  line(box - half + 7, 10, box + half - 7, c.boxHeight - 10, new Color(183, 157, 108), 7);
  line(box + half - 7, 10, box - half + 7, c.boxHeight - 10, new Color(183, 157, 108), 7);
  // Warm light at the destination keeps the night route readable.
  rect(c.wall + 190, c.height, 6, 112, new Color(42, 57, 51));
  for (const radius of [42, 26, 12]) { g.fillColor = new Color(238, 196, 114, 14); g.circle(base + c.wall + 193, c.floor + c.height + 110, radius); g.fill(); }
  rect(c.wall + 185, c.height + 102, 16, 16, new Color(239, 204, 131));
}
