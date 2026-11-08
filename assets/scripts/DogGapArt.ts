import { Color, Graphics } from 'cc';
import type { DogChaseSegment } from './DogChaseSegment';
export function drawDogGap(g: Graphics, dog: DogChaseSegment, camera: number) {
  g.clear(); const left = dog.gapLeft - camera, right = dog.gapRight - camera, y = dog.layout.floor;
  g.fillColor = new Color(12, 24, 26, 225); g.rect(left, -600, right - left, y + 600); g.fill();
  for (const edge of [left - 22, right]) {
    g.fillColor = new Color(77, 88, 76); g.rect(edge, y - 95, 22, 95); g.fill();
    g.strokeColor = new Color(119, 131, 104); g.lineWidth = 3;
    g.moveTo(edge - 4, y); g.lineTo(edge + 26, y); g.stroke();
    g.strokeColor = new Color(39, 54, 49); g.lineWidth = 2;
    for (let i = 1; i < 4; i++) { g.moveTo(edge, y - i * 24); g.lineTo(edge + 22, y - i * 24); g.stroke(); }
  }
  // Broken path markings foreshadow the interruption before the player reaches its edge.
  g.strokeColor = new Color(173, 165, 122, 160); g.lineWidth = 2;
  for (const x of [left - 90, left - 55, right + 35, right + 70]) { g.moveTo(x, y - 1); g.lineTo(x + 14, y - 1); g.stroke(); }
}
