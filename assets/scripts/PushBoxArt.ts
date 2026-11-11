import { Color, Graphics } from 'cc';
import type { PushBoxSegment } from './PushBoxSegment';

export function drawPushBox(g: Graphics, puzzle: PushBoxSegment, camera: number) {
  g.clear(); const c = puzzle.layout, base = c.origin - camera;
  const rect = (x: number, y: number, w: number, h: number, color: Color) => { g.fillColor = color; g.rect(base + x, c.floor + y, w, h); g.fill(); };
  const line = (x: number, y: number, x2: number, y2: number, color: Color, width = 2) => {
    g.strokeColor = color; g.lineWidth = width; g.moveTo(base + x, c.floor + y); g.lineTo(base + x2, c.floor + y2); g.stroke();
  };
  const stone = new Color(102, 111, 109), moss = new Color(104, 127, 87);
  // Thick prison perimeter wall: vertical faces, narrow coping, clear outside landing.
  rect(c.wall, 0, c.wallEnd - c.wall, c.height, stone);
  rect(c.wallEnd - 18, 0, 18, c.height, new Color(69, 83, 82));
  rect(c.wall - 4, c.height - 8, c.wallEnd - c.wall + 8, 8, new Color(151, 154, 140));
  for (let y = 34; y < c.height - 10; y += 46) line(c.wall, y, c.wallEnd - 18, y, new Color(70, 82, 81));
  for (const x of [c.wall + 12, c.wallEnd - 36]) {
    rect(x, 0, 8, c.height - 8, new Color(79, 92, 89));
    for (let y = 15; y < c.height; y += 42) rect(x + 2, y, 4, 4, new Color(159, 157, 133));
  }
  rect(c.wall + 28, 87, c.wallEnd - c.wall - 64, 53, new Color(37, 55, 52));
  // Interior perimeter fence and a distant watch post establish the prison context.
  for (let x = c.wall - 510; x < c.wall - 80; x += 86) {
    line(x, 0, x, 143, new Color(73, 89, 84), 3);
    line(x, 126, x + 80, 126, new Color(87, 101, 90));
    for (let y = 14; y < 120; y += 24) line(x, y, x + 80, y + 22, new Color(96, 114, 101, 100));
    line(x, 143, x + 80, 143, new Color(70, 84, 81));
    for (let thorn = 8; thorn < 80; thorn += 18) line(x + thorn, 138, x + thorn + 5, 148, new Color(70, 84, 81));
  }
  const tower = c.wall - 240;
  rect(tower, 0, 11, 233, new Color(63, 83, 79, 180));
  rect(tower + 63, 0, 11, 233, new Color(63, 83, 79, 180));
  rect(tower - 10, 227, 95, 49, new Color(76, 93, 85, 200));
  rect(tower - 17, 275, 109, 9, new Color(44, 65, 60, 210));
  rect(tower + 6, 240, 61, 22, new Color(31, 52, 49, 190));
  for (let x = tower + 18; x < tower + 66; x += 16) rect(x, 240, 3, 22, new Color(118, 128, 103));
  // Wear and a drag track hint at the relationship without spelling out the solution.
  line(c.boxMin - 20, 2, c.wall - 6, 2, new Color(159, 146, 104, 120), 3);
  line(c.boxMin, -5, c.wall - 8, -5, new Color(85, 76, 53), 2);
  rect(c.boxMin - c.boxWidth / 2 - 12, 0, 12, 16, stone);
  for (let y = 40; y < 175; y += 32) line(c.wall + 2, y, c.wall + 20, y + 8, new Color(142, 143, 109), 3);
  // Guard floodlight is mounted on the inside edge, clear of the climbable coping.
  rect(c.wall - 28, 0, 6, c.height + 72, new Color(42, 57, 51));
  rect(c.wall - 42, c.height + 62, 34, 15, new Color(61, 73, 64));
  rect(c.wall - 38, c.height + 64, 26, 7, new Color(235, 216, 160));
  line(c.wallEnd + 24, 1, c.wallEnd + 230, 1, moss, 4);
}
