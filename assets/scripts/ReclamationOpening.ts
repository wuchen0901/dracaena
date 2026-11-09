import { Color, Graphics } from 'cc';

export const FACTORY_PANIC_LAYOUT = {
  startX: -3550, checkpointX: -2600, runnerStartX: -3460, runnerSpacing: 120,
  runnerSpeedRatio: .9, beltY: -20, pitStart: -2750, pitEnd: -2575,
};

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

/** A frightened batch follows the lit conveyor toward the scrap chute while the player has a lower service path. */
export function drawFactoryPanic(g: Graphics, time: number, camera: number) {
  g.clear();
  const sx = (x: number) => x - camera;
  const rect = (x: number, y: number, w: number, h: number, color: Color) => {
    g.fillColor = color; g.rect(sx(x), y, w, h); g.fill();
  };
  const line = (x: number, y: number, x2: number, y2: number, color: Color, width = 3) => {
    g.strokeColor = color; g.lineWidth = width; g.moveTo(sx(x), y); g.lineTo(sx(x2), y2); g.stroke();
  };
  const beltStart = -3480, beltEnd = FACTORY_PANIC_LAYOUT.pitStart, pitStart = FACTORY_PANIC_LAYOUT.pitStart;
  const pitEnd = FACTORY_PANIC_LAYOUT.pitEnd, beltY = FACTORY_PANIC_LAYOUT.beltY;
  const pulse = .5 + .5 * Math.sin(time * 8.5);

  // Heavy overhead gantries and a warning line make the same-model crowd read as factory workers.
  rect(-3550, 178, 1040, 11, new Color(29, 40, 40));
  for (const x of [-3480, -3230, -2980, -2730]) {
    rect(x, 0, 13, 180, new Color(39, 49, 45));
    rect(x - 18, 170, 48, 8, new Color(98, 76, 52));
  }
  line(-3550, 132, -2510, 132, new Color(81, 60, 48), 2);
  for (const x of [-3420, -3120, -2820]) {
    rect(x, 133, 28, 19, new Color(170 + Math.round(pulse * 65), 42, 28, 230));
    g.fillColor = new Color(224, 48, 31, Math.round(18 + pulse * 34));
    g.circle(sx(x + 14), 142, 44); g.fill();
  }

  // The marked conveyor looks like the route the identical units are following.
  rect(beltStart, beltY, beltEnd - beltStart, 28, new Color(46, 50, 43));
  rect(beltStart, beltY + 22, beltEnd - beltStart, 8, new Color(127, 94, 57));
  line(beltStart, beltY - 4, beltEnd, beltY - 4, new Color(151, 119, 69), 4);
  const offset = (time * 58) % 72;
  for (let x = beltStart - 72 + offset; x < beltEnd; x += 72) {
    line(x, beltY + 2, x + 24, beltY + 21, new Color(170, 115, 59, 190), 4);
  }
  // Below the belt is a deep receiving pit; scattered shells imply what happened to earlier units.
  rect(pitStart, -315, pitEnd - pitStart, 295, new Color(8, 14, 16));
  rect(pitStart - 13, beltY + 21, 15, 18, new Color(136, 81, 47));
  rect(pitEnd - 2, beltY + 21, 15, 18, new Color(136, 81, 47));
  line(pitStart, beltY + 25, pitStart, -295, new Color(82, 62, 45), 5);
  line(pitEnd, beltY + 25, pitEnd, -295, new Color(82, 62, 45), 5);
  for (let i = 0; i < 5; i++) {
    const x = pitStart + 28 + i * 27;
    rect(x, -285 + (i % 2) * 12, 18, 5, new Color(85, 83, 65, 170));
    rect(x + 8, -278 + (i % 2) * 12, 5, 13, new Color(88, 85, 65, 155));
  }
  // The lower maintenance lane remains open, so the intro is tense without becoming a platform challenge.
  for (let x = -3490; x < -2610; x += 145) {
    const flow = (x + Math.floor(time * 42) % 145 + 145) % 145;
    line(x + flow, -136, x + flow + 28, -136, new Color(141, 73, 46, 135), 3);
  }
}
