import { Color, Graphics } from 'cc';
import { GUARD_POST } from './TreeCover';

/** A raised inner-yard watch post sweeps a light over the hiding place. */
export function drawGuardPostSearch(g: Graphics, camera: number, time: number) {
  g.clear();
  const x = (GUARD_POST.x - camera) * .55;
  const rect = (left: number, bottom: number, width: number, height: number, color: Color) => {
    g.fillColor = color; g.rect(x + left, bottom, width, height); g.fill();
  };
  const dark = new Color(22, 36, 34), steel = new Color(55, 70, 61), moss = new Color(91, 116, 78);
  // Platform, braces and a narrow ladder.
  rect(-92, 105, 188, 17, steel); rect(-76, 87, 14, 18, dark); rect(67, 87, 14, 18, dark);
  rect(-65, -5, 10, 92, steel); rect(55, -5, 10, 92, steel);
  for (let i = 0; i < 5; i++) rect(-58, 10 + i * 17, 30, 5, moss);
  // Guard silhouette and lamp housing.
  g.fillColor = dark; g.circle(x - 12, 150, 10); g.fill();
  rect(-20, 119, 18, 29, dark); rect(-18, 111, 8, 10, dark); rect(-4, 116, 17, 6, dark);
  rect(16, 132, 22, 11, new Color(108, 103, 68));
  g.fillColor = new Color(230, 208, 143, 190); g.circle(x + 39, 137, 4); g.fill();
  // Pale, moving cone marks the watched area; it is visual only.
  const angle = Math.PI + Math.sin(time * .7) * .55, length = 275, spread = .2;
  for (let band = 0; band < 3; band++) {
    const a = angle - spread - band * .04, b = angle + spread + band * .04;
    g.fillColor = new Color(209, 222, 177, 8 - band * 2);
    g.moveTo(x + 39, 137);
    g.lineTo(x + 39 + Math.cos(a) * length, 137 + Math.sin(a) * length);
    g.lineTo(x + 39 + Math.cos(b) * length, 137 + Math.sin(b) * length);
    g.close(); g.fill();
  }
  // Vines on the old watch structure tie it to the reclaimed industrial yard.
  g.strokeColor = moss; g.lineWidth = 4;
  g.moveTo(x - 69, 250); g.quadraticCurveTo(x - 44, 212, x - 58, 170); g.stroke();
  g.moveTo(x + 62, 250); g.quadraticCurveTo(x + 45, 213, x + 72, 185); g.stroke();
}
