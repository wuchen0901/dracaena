import { Color, Graphics } from 'cc';
import type { FactoryEscapePuzzle } from './FactoryEscapePuzzle';
import { FACTORY_ESCAPE_LAYOUT } from './FactoryEscapePuzzle';

export const FACTORY_PANIC_LAYOUT = {
  startX: -3550, checkpointX: -2600, runnerStartX: -3460, runnerSpacing: 120,
  runnerSpeedRatio: .9, beltY: -20, pitStart: -2750, pitEnd: -2575,
};
export const RECLAMATION_SIGNAL_PERIOD = 6;
/** The three short warning flashes repeat in both the opening and the later batch line. */
export function reclamationSignal(time: number) {
  const phase = ((time % RECLAMATION_SIGNAL_PERIOD) + RECLAMATION_SIGNAL_PERIOD) % RECLAMATION_SIGNAL_PERIOD;
  for (const start of [.14, .49, .84]) {
    const t = phase - start;
    if (t >= 0 && t < .2) return Math.sin(Math.PI * t / .2);
  }
  return 0;
}

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
export function drawFactoryPanic(g: Graphics, time: number, camera: number, puzzle?: FactoryEscapePuzzle) {
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
  const machineTime = puzzle?.poweredOff ? 0 : time;
  const pulse = puzzle?.poweredOff ? 0 : reclamationSignal(time);

  // Heavy overhead gantries and a warning line make the same-model crowd read as factory workers.
  rect(-3550, 178, 1040, 11, new Color(29, 40, 40));
  for (const x of [-3480, -3230, -2980, -2730]) {
    rect(x, 0, 13, 180, new Color(39, 49, 45));
    rect(x - 18, 170, 48, 8, new Color(98, 76, 52));
  }
  line(-3550, 132, -2510, 132, new Color(81, 60, 48), 2);
  for (const x of [-3420, -3120, -2820]) {
    rect(x, 133, 28, 19, new Color(130 + Math.round(pulse * 105), 36, 26, 230));
    g.fillColor = new Color(224, 48, 31, Math.round(18 + pulse * 34));
    g.circle(sx(x + 14), 142, 44); g.fill();
  }

  // The marked conveyor looks like the route the identical units are following.
  rect(beltStart, beltY, beltEnd - beltStart, 28, new Color(46, 50, 43));
  rect(beltStart, beltY + 22, beltEnd - beltStart, 8, new Color(127, 94, 57));
  line(beltStart, beltY - 4, beltEnd, beltY - 4, new Color(151, 119, 69), 4);
  const offset = (machineTime * 58) % 72;
  for (let x = beltStart - 72 + offset; x < beltEnd; x += 72) {
    line(x, beltY + 2, x + 24, beltY + 21, new Color(170, 115, 59, 190), 4);
  }
  // Amber chevrons look like an evacuation route, but point directly toward the chute.
  for (let x = beltStart + 35; x < beltEnd - 30; x += 112) {
    const alpha = Math.round(72 + pulse * 170);
    line(x, beltY + 43, x + 16, beltY + 34, new Color(209, 167, 77, alpha), 4);
    line(x + 16, beltY + 34, x + 31, beltY + 43, new Color(209, 167, 77, alpha), 4);
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
    const flow = (x + Math.floor(machineTime * 42) % 145 + 145) % 145;
    line(x + flow, -136, x + flow + 28, -136, new Color(141, 73, 46, 135), 3);
  }
  if (puzzle) {
    const c = FACTORY_ESCAPE_LAYOUT, floor = c.floor;
    // Drag marks and the worn stop guide the player toward the box's useful position.
    line(c.crateMin - 15, floor + 2, c.crateTarget + 7, floor + 2, new Color(169, 140, 87, 115), 3);
    line(c.crateMin - 8, floor - 4, c.crateTarget + 10, floor - 4, new Color(92, 77, 55, 165), 2);
    rect(c.crateMin - 20, floor, 12, 16, new Color(79, 86, 78));
    rect(puzzle.left, floor, c.crateWidth, c.crateHeight, new Color(118, 91, 57));
    rect(puzzle.left + 8, floor + 8, c.crateWidth - 16, c.crateHeight - 16, new Color(101, 78, 51));
    line(puzzle.left + 12, floor + 16, puzzle.right - 12, floor + 16, new Color(158, 125, 76), 3);
    line(puzzle.crateX, floor + 10, puzzle.crateX, floor + c.crateHeight - 10, new Color(78, 64, 47), 2);
    // The waist-high service rail opens only after the nearby cutoff handle is pulled.
    if (!puzzle.poweredOff) {
      rect(c.gateX - 8, floor, 16, c.gateHeight, new Color(65, 78, 73));
      for (let y = floor + 10; y < floor + c.gateHeight; y += 26) line(c.gateX - 7, y, c.gateX + 7, y + 9, new Color(139, 132, 101), 2);
    } else {
      rect(c.gateX - 15, floor + c.gateHeight - 14, 30, 14, new Color(65, 78, 73));
    }
    rect(c.leverX - 16, floor, 9, 88, new Color(63, 75, 70));
    rect(c.leverX - 28, floor + 77, 34, 8, new Color(107, 96, 65));
    line(c.leverX - 11, floor + 82, c.leverX + (puzzle.poweredOff ? 18 : -20), floor + (puzzle.poweredOff ? 53 : 66), new Color(209, 177, 105), 5);
    rect(c.leverX - 24, floor + 98, 44, 24, new Color(puzzle.poweredOff ? 84 : 161, puzzle.poweredOff ? 151 : 54, puzzle.poweredOff ? 91 : 35));
    if (puzzle.poweredOff) {
      rect(-3370, floor + 182, 170, 6, new Color(95, 143, 99, 130));
    }
  }
}
