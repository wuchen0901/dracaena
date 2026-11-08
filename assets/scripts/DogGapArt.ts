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

/** The frightened kitten's broken wall perch and the crate the player can climb to block the dog. */
export function drawCatRescueProps(g: Graphics, dog: DogChaseSegment, camera: number) {
  g.clear();
  const x = (value: number) => value - camera, floor = dog.layout.floor;
  // A broken outer wall gives the kitten a high but exposed perch.
  g.fillColor = new Color(62, 76, 65);
  g.rect(x(dog.catPerchLeft), floor - 4, dog.catPerchRight - dog.catPerchLeft, dog.catPerchTop - floor + 4); g.fill();
  g.fillColor = new Color(114, 125, 91);
  g.rect(x(dog.catPerchLeft - 7), dog.catPerchTop - 5, dog.catPerchRight - dog.catPerchLeft + 14, 10); g.fill();
  g.strokeColor = new Color(41, 57, 48); g.lineWidth = 3;
  for (let i = 1; i < 4; i++) {
    const sx = dog.catPerchLeft + i * 24;
    g.moveTo(x(sx), floor + 3); g.lineTo(x(sx - 5), dog.catPerchTop - 8); g.stroke();
  }
  // Moss and small roots make the perch feel abandoned rather than purpose-built.
  g.strokeColor = new Color(93, 127, 77); g.lineWidth = 3;
  g.moveTo(x(dog.catPerchLeft + 8), dog.catPerchTop + 1);
  g.quadraticCurveTo(x(dog.catPerchLeft + 24), dog.catPerchTop - 14, x(dog.catPerchLeft + 35), dog.catPerchTop - 7); g.stroke();
  // The loose shipping crate is wedged at the gap edge. The player can jump onto it; the dog cannot.
  g.fillColor = new Color(91, 76, 52);
  g.rect(x(dog.blockerLeft), floor, dog.blockerWidth, dog.blockerTop - floor); g.fill();
  g.strokeColor = new Color(151, 126, 82); g.lineWidth = 4;
  g.moveTo(x(dog.blockerLeft + 3), floor + 3); g.lineTo(x(dog.blockerLeft + 3), dog.blockerTop - 3);
  g.moveTo(x(dog.blockerRight - 3), floor + 3); g.lineTo(x(dog.blockerRight - 3), dog.blockerTop - 3);
  g.moveTo(x(dog.blockerLeft + 2), floor + 25); g.lineTo(x(dog.blockerRight - 2), floor + 25);
  g.moveTo(x(dog.blockerLeft + 2), floor + 62); g.lineTo(x(dog.blockerRight - 2), floor + 62); g.stroke();
  g.strokeColor = new Color(46, 55, 43); g.lineWidth = 2;
  g.moveTo(x(dog.blockerLeft + 9), floor + 7); g.lineTo(x(dog.blockerRight - 10), dog.blockerTop - 8);
  g.moveTo(x(dog.blockerRight - 11), floor + 6); g.lineTo(x(dog.blockerLeft + 12), dog.blockerTop - 8); g.stroke();
}
