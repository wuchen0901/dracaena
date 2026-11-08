import { Color, Graphics } from 'cc';

/** Room surfaces hide the forest until the maintenance doorway opens onto it. */
export function drawReclamationOpening(g: Graphics, time: number, alarm: boolean) {
  g.clear();
  const rect = (x: number, y: number, w: number, h: number, color: Color) => {
    g.fillColor = color; g.rect(x, y, w, h); g.fill();
  };
  const metal = new Color(36, 48, 47), rust = new Color(85, 73, 56);
  rect(-3000, -140, 1900, 520, new Color(17, 26, 29));
  for (let x = -2460; x < -1100; x += 160) {
    rect(x, -140, 9, 500, metal); rect(x + 12, 230, 130, 6, rust);
    rect(x + 40, 175, 65, 10, new Color(106, 120, 107, 90));
    rect(x + 40, -140, 75, 8, new Color(75, 83, 65));
  }
  // A conveyor and hanging dismantling tool remain visibly active behind the holding area.
  rect(-2460, -30, 260, 24, metal);
  for (let i = 0; i < 9; i++) {
    g.fillColor = rust; g.circle(-2450 + i * 29, -20, 8); g.fill();
  }
  rect(-2385, 100 + Math.sin(time * 1.5) * 12, 44, 70, rust);
  rect(-2368, 170, 10, 180, metal);
  // A damaged unit is carried under the press; its red rejection mark echoes the city kiosk.
  const cycle = time % 12;
  const unitX = -2445 + Math.min(1, cycle / 5) * 84;
  if (cycle < 9) {
    rect(unitX - 12, -5, 28, 38, new Color(97, 105, 91));
    rect(unitX - 9, 36, 23, 20, new Color(124, 129, 108));
    rect(unitX - 20, -15, 12, 22, rust); rect(unitX + 9, -15, 12, 22, rust);
    rect(unitX - 21, 4, 8, 26, rust);
    rect(unitX - 3, 8, 9, 9, new Color(207, 64, 44));
    const drop = Math.max(0, Math.min(1, (cycle - 5) / 1.5));
    rect(-2385, 100 - drop * 65, 44, 12, metal);
  } else {
    for (let i = 0; i < 5; i++) rect(-2380 + i * 13, -6 + i % 2 * 5, 9, 8, rust);
  }
  // Door is raised enough to pass underneath; daylight is visible beyond its frame.
  rect(-1120, -140, 18, 450, metal); rect(-1110, -15, 65, 325, new Color(64, 75, 68));
  for (let y = 0; y < 295; y += 28) rect(-1105, y, 55, 3, rust);
  rect(-1128, -140, 95, 5, new Color(153, 163, 119));
  // The fence ends at an existing pedestrian gap rather than blocking movement.
  for (const x of [-830, -710, -590, -280, -160]) {
    rect(x, -140, 5, 110, metal);
    g.strokeColor = new Color(79, 96, 75, 130); g.lineWidth = 1;
    for (let y = -125; y < -30; y += 18) {
      g.moveTo(x, y); g.lineTo(x + 100, y + 18); g.stroke();
    }
  }
  const pulse = alarm ? .5 + .5 * Math.sin(time * 7) : .05;
  rect(-1138, 175, 22, 17, new Color(230, 65, 42, Math.round(70 + pulse * 180)));
  if (alarm) {
    g.fillColor = new Color(245, 67, 38, Math.round(24 * pulse));
    g.circle(-1127, 183, 80); g.fill();
  }
  // Worn safety stripes reinforce the doorway and the exit direction.
  for (let x = -1200; x < -1030; x += 24) rect(x, -140, 12, 4, new Color(165, 144, 79));
}
