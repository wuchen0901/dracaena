import { Color, Graphics } from 'cc';

/** Four short, playable environmental stories after the river crossing. */
export type CityStorySave = {
  rationBox: number; battery: number; pumpOn: boolean; waterBowl: number;
  pruningBranch?: number; wildWater?: boolean; relayPanel?: number; powerSwitches?: number;
};
export const CITY_STORY = {
  ration: { box: 9860, target: 10080, gate: 10430, worker: 10155, elder: 10215 },
  repair: { battery: 10870, target: 11120, gate: 11500, robot: 11220 },
  pump: { switchX: 12100, gate: 12700, cameraX: 12315, pumpX: 12480 },
  cat: { bowl: 13120, target: 13435, catX: 13510, survivorX: 13610, gate: 14120 },
  garden: {
    branch: 14540, branchTarget: 14825, pruningGate: 15220,
    valve: 15700, waterGate: 16220,
    panel: 16620, panelTarget: 16970, relay: 17120, signalGate: 17520,
    powerGate: 18580, switches: [17770, 18020, 18270], finish: 19050,
  },
  floor: -140, propW: 82, propH: 74, pushSpeed: 112,
};
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));

export class CityStoryLevels {
  rationBox = CITY_STORY.ration.box;
  battery = CITY_STORY.repair.battery;
  pumpOn = false;
  waterBowl = CITY_STORY.cat.bowl;
  pruningBranch = CITY_STORY.garden.branch;
  wildWater = false;
  relayPanel = CITY_STORY.garden.panel;
  rationSolved = false; repairSolved = false; catSolved = false;
  pruningSolved = false; signalSolved = false;
  powerSwitches = 0;
  private held: 'ration' | 'battery' | 'bowl' | 'branch' | 'panel' | null = null;

  restore(save?: CityStorySave) {
    this.rationBox = clamp(save?.rationBox ?? CITY_STORY.ration.box, CITY_STORY.ration.box, CITY_STORY.ration.target);
    this.battery = clamp(save?.battery ?? CITY_STORY.repair.battery, CITY_STORY.repair.battery, CITY_STORY.repair.target);
    this.pumpOn = save?.pumpOn ?? false;
    this.waterBowl = clamp(save?.waterBowl ?? CITY_STORY.cat.bowl, CITY_STORY.cat.bowl, CITY_STORY.cat.target);
    this.pruningBranch = clamp(save?.pruningBranch ?? CITY_STORY.garden.branch, CITY_STORY.garden.branch, CITY_STORY.garden.branchTarget);
    this.wildWater = save?.wildWater ?? false;
    this.relayPanel = clamp(save?.relayPanel ?? CITY_STORY.garden.panel, CITY_STORY.garden.panel, CITY_STORY.garden.panelTarget);
    this.rationSolved = this.rationBox >= CITY_STORY.ration.target;
    this.repairSolved = this.battery >= CITY_STORY.repair.target;
    this.catSolved = this.waterBowl >= CITY_STORY.cat.target;
    this.pruningSolved = this.pruningBranch >= CITY_STORY.garden.branchTarget;
    this.signalSolved = this.relayPanel >= CITY_STORY.garden.panelTarget;
    this.powerSwitches = (save?.powerSwitches ?? 0) & 7;
    this.held = null;
  }
  save(): CityStorySave { return { rationBox: this.rationBox, battery: this.battery, pumpOn: this.pumpOn, waterBowl: this.waterBowl, pruningBranch: this.pruningBranch, wildWater: this.wildWater, relayPanel: this.relayPanel, powerSwitches: this.powerSwitches }; }
  private activeProp(playerX: number, grounded: boolean, grabbing: boolean) {
    if (!grounded || !grabbing) return null;
    const props: ['ration' | 'battery' | 'bowl' | 'branch' | 'panel', number, boolean, number][] = [
      ['ration', this.rationBox, !this.rationSolved, CITY_STORY.propW], ['battery', this.battery, !this.repairSolved, CITY_STORY.propW], ['bowl', this.waterBowl, !this.catSolved, CITY_STORY.propW],
      ['branch', this.pruningBranch, !this.pruningSolved, 148], ['panel', this.relayPanel, !this.signalSolved, CITY_STORY.propW],
    ];
    for (const [id, x, available, width] of props) {
      if (!available) continue;
      if (Math.abs(playerX - x) >= width / 2 && Math.abs(playerX - x) <= width / 2 + 38) return id;
    }
    return null;
  }
  beginMove(playerX: number, grounded: boolean, grabbing: boolean) { this.held = this.activeProp(playerX, grounded, grabbing); return this.held !== null; }
  moveProp(delta: number) {
    if (!this.held) return 0;
    const key = this.held;
    const before = key === 'ration' ? this.rationBox : key === 'battery' ? this.battery : key === 'bowl' ? this.waterBowl : key === 'branch' ? this.pruningBranch : this.relayPanel;
    const minimum = key === 'ration' ? CITY_STORY.ration.box : key === 'battery' ? CITY_STORY.repair.battery : key === 'bowl' ? CITY_STORY.cat.bowl : key === 'branch' ? CITY_STORY.garden.branch : CITY_STORY.garden.panel;
    const target = key === 'ration' ? CITY_STORY.ration.target : key === 'battery' ? CITY_STORY.repair.target : key === 'bowl' ? CITY_STORY.cat.target : key === 'branch' ? CITY_STORY.garden.branchTarget : CITY_STORY.garden.panelTarget;
    const next = clamp(before + delta, minimum, target);
    if (key === 'ration') this.rationBox = next;
    else if (key === 'battery') this.battery = next;
    else if (key === 'bowl') this.waterBowl = next;
    else if (key === 'branch') this.pruningBranch = next;
    else this.relayPanel = next;
    this.rationSolved ||= this.rationBox >= CITY_STORY.ration.target;
    this.repairSolved ||= this.battery >= CITY_STORY.repair.target;
    this.catSolved ||= this.waterBowl >= CITY_STORY.cat.target;
    this.pruningSolved ||= this.pruningBranch >= CITY_STORY.garden.branchTarget;
    this.signalSolved ||= this.relayPanel >= CITY_STORY.garden.panelTarget;
    return next - before;
  }
  endMove() { this.held = null; }
  movableXNear(playerX: number, grounded: boolean) {
    const props: [number, boolean, number][] = [[this.rationBox, !this.rationSolved, CITY_STORY.propW], [this.battery, !this.repairSolved, CITY_STORY.propW], [this.waterBowl, !this.catSolved, CITY_STORY.propW], [this.pruningBranch, !this.pruningSolved, 148], [this.relayPanel, !this.signalSolved, CITY_STORY.propW]];
    let nearest = Infinity;
    for (const [x, available, width] of props) if (available && grounded && Math.abs(playerX - x) >= width / 2 && Math.abs(playerX - x) <= width / 2 + 38 && Math.abs(playerX - x) < Math.abs(playerX - nearest)) nearest = x;
    return Number.isFinite(nearest) ? nearest : null;
  }
  interact(playerX: number, grounded: boolean) {
    if (grounded && Math.abs(playerX - CITY_STORY.pump.switchX) < 95 && !this.pumpOn) { this.pumpOn = true; return true; }
    if (grounded && Math.abs(playerX - CITY_STORY.garden.valve) < 95 && !this.wildWater) { this.wildWater = true; return true; }
    if (grounded && this.signalSolved && !this.powerGateOpen) {
      const i = CITY_STORY.garden.switches.findIndex((x, n) => !(this.powerSwitches & (1 << n)) && Math.abs(playerX - x) < 95);
      if (i >= 0) { this.powerSwitches |= 1 << i; return true; }
    }
    return false;
  }
  get powerGateOpen() { return this.powerSwitches === 7; }
  get checkpoint(): 'river-cleared' | 'city-ration' | 'city-repair' | 'city-pump' | 'city-cat' | 'city-cleared' {
    if (this.catSolved) return 'city-cleared';
    if (this.pumpOn && this.repairSolved && this.rationSolved) return 'city-cat';
    if (this.pumpOn && this.repairSolved) return 'city-pump';
    if (this.repairSolved) return 'city-repair';
    if (this.rationSolved) return 'city-ration';
    return 'river-cleared';
  }
  canGrab(playerX: number, grounded: boolean, grabbing = true) { return this.activeProp(playerX, grounded, grabbing) !== null; }
  walls(includeProps = true) {
    const s = CITY_STORY;
    return [
      ...(!this.rationSolved ? [{ edge: s.ration.gate, top: 240, right: true }] : []),
      ...(!this.repairSolved ? [{ edge: s.repair.gate, top: 240, right: true }] : []),
      ...(!this.pumpOn ? [{ edge: s.pump.gate, top: 240, right: true }] : []),
      ...(!this.catSolved ? [{ edge: s.cat.gate, top: 240, right: true }] : []),
      ...(!this.pruningSolved ? [{ edge: s.garden.pruningGate, top: 240, right: true }] : []),
      ...(!this.wildWater ? [{ edge: s.garden.waterGate, top: 240, right: true }] : []),
      ...(!this.signalSolved ? [{ edge: s.garden.signalGate, top: 240, right: true }] : []),
      ...(this.signalSolved && !this.powerGateOpen ? [{ edge: s.garden.powerGate, top: 240, right: true }] : []),
      ...(includeProps && !this.rationSolved ? this.propWall(this.rationBox) : []),
      ...(includeProps && !this.repairSolved ? this.propWall(this.battery) : []),
      ...(includeProps && !this.catSolved ? this.propWall(this.waterBowl) : []),
      ...(includeProps && !this.pruningSolved ? this.propWall(this.pruningBranch, 148, 30) : []),
      ...(includeProps && !this.signalSolved ? this.propWall(this.relayPanel) : []),
    ];
  }
  private propWall(x: number, width = CITY_STORY.propW, height = CITY_STORY.propH) { return [
    { edge: x - width / 2, top: CITY_STORY.floor + height, right: true },
    { edge: x + width / 2, top: CITY_STORY.floor + height, right: false },
  ]; }
  groundAt(x: number): number | null {
    for (const [box, solved, width, height] of [[this.rationBox, this.rationSolved, CITY_STORY.propW, CITY_STORY.propH], [this.battery, this.repairSolved, CITY_STORY.propW, CITY_STORY.propH], [this.waterBowl, this.catSolved, CITY_STORY.propW, CITY_STORY.propH], [this.pruningBranch, this.pruningSolved, 148, 30], [this.relayPanel, this.signalSolved, CITY_STORY.propW, 52]] as [number, boolean, number, number][]) {
      if (!solved && Math.abs(x - box) <= width / 2) return CITY_STORY.floor + height;
    }
    return null;
  }
}

/** Icons and silhouettes carry the story; no dialogue or explanatory text. */
export function drawCityStories(g: Graphics, world: CityStoryLevels, camera: number, time: number) {
  g.clear(); const s = CITY_STORY, sx = (x: number) => x - camera, floor = s.floor;
  const rect = (x: number, y: number, w: number, h: number, c: Color) => { g.fillColor = c; g.rect(sx(x), y, w, h); g.fill(); };
  const line = (x: number, y: number, xx: number, yy: number, c: Color, width = 3) => { g.strokeColor = c; g.lineWidth = width; g.moveTo(sx(x), y); g.lineTo(sx(xx), yy); g.stroke(); };
  const person = (x: number, color: Color, posture = 0) => {
    const lean = posture ? -12 : 0;
    g.fillColor = new Color(161, 145, 114); g.circle(sx(x + lean), floor + 70 + (posture ? -3 : 0), 9); g.fill();
    line(x, floor + 59, x + lean, floor + 26, color, 17);
    line(x + lean, floor + 26, x - 12, floor + 3, color, 6); line(x + lean, floor + 26, x + 13, floor + 3, color, 6);
  };
  const crate = (x: number, kind: 'wood' | 'cell' | 'bowl' | 'metal') => {
    const half = s.propW / 2;
    const base = kind === 'wood' ? new Color(116, 87, 55) : kind === 'cell' ? new Color(69, 94, 84) : kind === 'metal' ? new Color(77, 102, 88) : new Color(120, 113, 84);
    rect(x - half, floor, s.propW, kind === 'bowl' ? 18 : kind === 'metal' ? 52 : s.propH, base);
    if (kind === 'wood') { line(x - half + 8, floor + 8, x + half - 8, floor + s.propH - 8, new Color(76, 64, 45), 4); line(x - half + 8, floor + s.propH - 8, x + half - 8, floor + 8, new Color(76, 64, 45), 4); }
    if (kind === 'cell') { rect(x - 24, floor + 28, 48, 18, new Color(191, 163, 81)); g.fillColor = new Color(232, 197, 85, Math.round(160 + 80 * Math.sin(time * 4))); g.circle(sx(x), floor + 38, 10); g.fill(); }
    if (kind === 'metal') { line(x - 29, floor + 8, x + 29, floor + 44, new Color(155, 168, 126), 4); line(x - 29, floor + 44, x + 29, floor + 8, new Color(155, 168, 126), 4); }
    if (kind === 'bowl') { line(x - half, floor + 16, x - half + 8, floor + 1, base, 3); line(x - half + 8, floor + 1, x + half - 8, floor + 1, base, 3); line(x + half - 8, floor + 1, x + half, floor + 16, base, 3); }
  };
  // A loading crate can be pushed into the camera's blind wedge so the worker can share food.
  rect(9785, floor, 10, 230, new Color(61, 64, 56)); line(9785, floor + 215, 9920, floor + 215, new Color(61, 64, 56), 10);
  rect(9895, floor + 190, 92, 29, new Color(36, 44, 40));
  g.fillColor = new Color(208, 72, 45, Math.round(155 + 75 * Math.sin(time * 2))); g.circle(sx(9885), floor + 202, 5); g.fill();
  line(9885, floor + 197, 10080, floor + 55, new Color(208, 72, 45, 38 + Math.round(25 * Math.sin(time * 2))), 2);
  crate(world.rationBox, 'wood'); person(s.ration.worker, new Color(67, 77, 67)); person(s.ration.elder, new Color(81, 76, 68), 1);
  if (world.rationSolved) { rect(s.ration.elder - 22, floor + 42, 17, 9, new Color(190, 158, 95)); rect(9810, floor + 195, 10, 5, new Color(50, 54, 47)); }
  else { g.fillColor = new Color(230, 176, 83); g.circle(sx(world.rationBox), floor + 106, 7); g.fill(); }
  // A discarded cleaner receives power and becomes the one that lifts the service shutter.
  rect(10650, floor, 15, 194, new Color(54, 63, 58)); rect(10745, floor, 125, 13, new Color(62, 71, 65));
  crate(world.battery, 'cell');
  rect(s.repair.robot - 42, floor + 5, 84, 48, world.repairSolved ? new Color(91, 111, 82) : new Color(48, 57, 53));
  g.fillColor = new Color(133, 176, 113, Math.round(world.repairSolved ? 195 : 55)); g.circle(sx(s.repair.robot + 29), floor + 38, 5); g.fill();
  for (let i = 0; i < 3; i++) line(s.repair.robot - 28 + i * 22, floor + 7, s.repair.robot - 18 + i * 22, floor + 18 + (world.repairSolved ? Math.sin(time * 5 + i) * 3 : 0), new Color(133, 143, 115), 2);
  if (world.repairSolved) rect(s.repair.gate - 10, floor, 20, 65, new Color(93, 111, 86));
  // One tactile switch redirects the live cable from surveillance to the public pump.
  line(11880, floor + 174, s.pump.switchX, floor + 174, new Color(71, 78, 66), 8);
  line(s.pump.switchX, floor + 174, s.pump.switchX, floor + 42, new Color(71, 78, 66), 8);
  rect(s.pump.switchX - 22, floor + 30, 44, 20, new Color(68, 68, 52));
  line(s.pump.switchX, floor + 44, s.pump.switchX + (world.pumpOn ? 26 : -16), floor + (world.pumpOn ? 68 : 71), new Color(183, 153, 82), 6);
  rect(s.pump.cameraX - 17, floor + 163, 34, 23, new Color(38, 49, 43));
  if (!world.pumpOn) { g.fillColor = new Color(209, 74, 48, 190); g.circle(sx(s.pump.cameraX), floor + 174, 4); g.fill(); }
  rect(s.pump.pumpX - 32, floor + 3, 64, 70, new Color(54, 65, 58));
  g.fillColor = new Color(89, 154, 148, world.pumpOn ? 215 : 50); g.circle(sx(s.pump.pumpX), floor + 67 + (world.pumpOn ? Math.sin(time * 5) * 2 : 0), 7); g.fill();
  if (world.pumpOn) { line(s.pump.pumpX, floor + 74, s.pump.pumpX + 62, floor + 101 + Math.sin(time * 4) * 2, new Color(103, 164, 142, 170), 3); person(12540, new Color(63, 79, 64)); }
  // A water pan leads the kitten to the food without forcing the player to command either life.
  line(13040, floor + 164, 13160, floor + 164, new Color(89, 91, 70), 8);
  line(13160, floor + 164, 13160, floor + 26, new Color(89, 91, 70), 8);
  crate(world.waterBowl, 'bowl');
  if (world.catSolved) { g.fillColor = new Color(119, 151, 142, 190); g.circle(sx(world.waterBowl), floor + 14, 5); g.fill(); rect(s.cat.catX + 8, floor + 44, 12, 7, new Color(181, 145, 86)); }
  // Success state opens the final gate with no text card or cutscene.
  for (const [x, solved] of [[s.ration.gate, world.rationSolved], [s.repair.gate, world.repairSolved], [s.pump.gate, world.pumpOn], [s.cat.gate, world.catSolved]] as [number, boolean][]) {
    rect(x - 8, floor, 16, solved ? 38 : 198, solved ? new Color(80, 100, 76) : new Color(49, 57, 53));
    if (!solved) for (let y = floor + 15; y < floor + 190; y += 31) line(x - 8, y, x + 8, y + 14, new Color(104, 92, 66), 3);
  }
  // Compact interaction glyphs replace written objectives.
  for (const [x, solved, kind] of [[s.ration.target, world.rationSolved, 0], [s.repair.target, world.repairSolved, 1], [s.pump.switchX, world.pumpOn, 2], [s.cat.target, world.catSolved, 3]] as [number, boolean, number][]) {
    if (solved || Math.abs(x - camera) > 730) continue;
    g.strokeColor = new Color(220, 202, 143, 210); g.lineWidth = 2;
    g.circle(sx(x), floor + 147, 13); g.stroke();
    g.fillColor = new Color(220, 202, 143, 230);
    if (kind === 0) { g.rect(sx(x) - 6, floor + 144, 12, 7); g.fill(); }
    else if (kind === 1) { g.moveTo(sx(x) - 4, floor + 147); g.lineTo(sx(x), floor + 155); g.lineTo(sx(x) + 6, floor + 140); g.stroke(); }
    else if (kind === 2) { g.circle(sx(x), floor + 147, 5); g.fill(); }
    else { g.ellipse(sx(x), floor + 146, 6, 4); g.fill(); }
  }
  // A fallen branch jams the pruning arm and leaves one wild plant untouched.
  const garden = s.garden;
  line(14445, floor + 218, 14885, floor + 218, new Color(68, 78, 57), 12);
  rect(14870, floor + 8, 24, 190, new Color(52, 62, 51));
  line(14882, floor + 185, 14882, floor + 103 + Math.sin(time * 2.3) * (world.pruningSolved ? 0 : 12), new Color(84, 91, 67), 16);
  line(14840, floor + 105, 14928, floor + 105, new Color(116, 108, 77), 11);
  line(14872, floor + 98, 14905, floor + 106, world.pruningSolved ? new Color(119, 158, 91) : new Color(76, 79, 61), world.pruningSolved ? 14 : 7);
  rect(14900, floor, 18, world.pruningSolved ? 35 : 190, new Color(48, 58, 51));
  rect(world.pruningBranch - 74, floor + 5, 148, 30, new Color(96, 76, 49));
  line(world.pruningBranch - 60, floor + 8, world.pruningBranch + 61, floor + 32, new Color(125, 99, 62), 4);
  if (world.pruningSolved) {
    line(14910, floor + 9, 14928, floor + 48, new Color(83, 125, 66), 5);
    line(14926, floor + 31, 14945, floor + 42, new Color(109, 157, 77), 4);
  } else { g.fillColor = new Color(211, 122, 64, Math.round(125 + 90 * Math.sin(time * 7))); g.circle(sx(14900), floor + 30, 4); g.fill(); }
  // The valve diverts some water away from identical rows and into an unplanned patch.
  line(15370, floor + 56, 15700, floor + 56, new Color(68, 83, 75), 12);
  line(15700, floor + 56, 15700, floor + 116, new Color(68, 83, 75), 12);
  rect(garden.valve - 22, floor + 37, 44, 20, new Color(62, 73, 62));
  line(garden.valve, floor + 48, garden.valve + (world.wildWater ? 24 : -24), floor + 78, new Color(185, 161, 101), 6);
  for (let i = 0; i < 5; i++) {
    const x = 15830 + i * 70;
    line(x, floor + 2, x, floor + 34, new Color(88, 117, 72), 4);
    line(x, floor + 24, x - 13, floor + 35, new Color(108, 142, 79), 4);
    line(x, floor + 19, x + 12, floor + 30, new Color(108, 142, 79), 4);
  }
  line(15700, floor + 40, 16075, floor + 40, new Color(72, 88, 73), 6);
  if (world.wildWater) {
    for (let i = 0; i < 6; i++) {
      const t = (time * 70 + i * 42) % 360;
      g.fillColor = new Color(119, 176, 153, 190); g.circle(sx(15725 + t), floor + 43 + Math.sin(time * 4 + i) * 2, 3); g.fill();
    }
    line(16080, floor + 3, 16080, floor + 50, new Color(73, 129, 70), 5);
    line(16080, floor + 35, 16058, floor + 46, new Color(121, 168, 80), 5);
    line(16080, floor + 27, 16102, floor + 41, new Color(121, 168, 80), 5);
    g.fillColor = new Color(195, 188, 126, 220); g.circle(sx(16080), floor + 53, 6); g.fill();
  } else {
    line(16080, floor + 3, 16080, floor + 20, new Color(89, 98, 68), 3);
    line(16080, floor + 18, 16062, floor + 27, new Color(98, 105, 69), 3);
  }
  // A redirected scanner illuminates the grass instead of tracking the traveler.
  rect(17190, floor + 3, 22, 250, new Color(48, 58, 53));
  rect(17162, floor + 224, 78, 32, new Color(58, 75, 65));
  g.fillColor = new Color(211, 79, 54, world.signalSolved ? 55 : Math.round(150 + 65 * Math.sin(time * 3)));
  g.circle(sx(17174), floor + 239, 7); g.fill();
  const beamY = world.signalSolved ? floor + 248 : floor + 35 + Math.sin(time * 1.7) * 12;
  line(17174, floor + 239, world.signalSolved ? 17325 : 17625, beamY, new Color(210, 77, 54, world.signalSolved ? 32 : 72), 4);
  line(17300, floor, 17328, floor + 125, new Color(67, 84, 67), 8);
  line(17328, floor + 125, 17404, floor + 155, new Color(67, 84, 67), 8);
  line(17404, floor + 155, 17438, floor + 50, new Color(67, 84, 67), 8);
  crate(world.relayPanel, 'metal');
  if (world.signalSolved) {
    line(17405, floor + 155, 17530, floor + 234, new Color(137, 175, 113, 145), 4);
    for (const x of [17480, 17520, 17560]) {
      g.strokeColor = new Color(116, 155, 103, 185); g.lineWidth = 3; g.circle(sx(x), floor + 5, 22 + (x % 3)); g.stroke();
    }
    line(17570, floor + 1, 17582, floor + 31, new Color(81, 127, 66), 5);
    line(17582, floor + 25, 17601, floor + 35, new Color(122, 167, 80), 4);
  }
  for (const [x, solved] of [[garden.pruningGate, world.pruningSolved], [garden.waterGate, world.wildWater], [garden.signalGate, world.signalSolved]] as [number, boolean][]) {
    rect(x - 8, floor, 16, solved ? 38 : 198, solved ? new Color(76, 109, 73) : new Color(47, 57, 51));
    if (!solved) for (let y = floor + 15; y < floor + 190; y += 31) line(x - 8, y, x + 8, y + 14, new Color(100, 104, 71), 3);
  }
  for (const [x, solved, icon] of [[garden.branchTarget, world.pruningSolved, 0], [garden.valve, world.wildWater, 1], [garden.panelTarget, world.signalSolved, 2]] as [number, boolean, number][]) {
    if (solved || Math.abs(x - camera) > 730) continue;
    g.strokeColor = new Color(214, 211, 155, 215); g.lineWidth = 2; g.circle(sx(x), floor + 148, 13); g.stroke();
    if (icon === 0) line(x - 6, floor + 145, x + 6, floor + 151, new Color(214, 211, 155), 3);
    else if (icon === 1) { line(x, floor + 142, x, floor + 154, new Color(214, 211, 155), 2); line(x - 6, floor + 148, x + 6, floor + 148, new Color(214, 211, 155), 2); }
    else line(x - 6, floor + 148, x + 6, floor + 148, new Color(214, 211, 155), 3);
  }
  // The power gate blocks the route until all three wall switches feed it.
  const gateOpen = world.powerGateOpen;
  rect(garden.powerGate - 14, floor, 28, gateOpen ? 34 : 220, gateOpen ? new Color(74, 108, 75) : new Color(43, 54, 51));
  if (!gateOpen) for (let y = floor + 12; y < floor + 216; y += 34) {
    line(garden.powerGate - 14, y, garden.powerGate + 14, y + 18, new Color(94, 104, 78), 4);
    line(garden.powerGate + 14, y, garden.powerGate - 14, y + 18, new Color(94, 104, 78), 4);
  }
  // Three isolated wall switches route power to the gate indicator.
  for (let i = 0; i < garden.switches.length; i++) {
    const x = garden.switches[i], on = !!(world.powerSwitches & (1 << i));
    rect(x - 20, floor + 98, 40, 58, new Color(48, 61, 56));
    line(x, floor + 108, x, floor + 145, new Color(111, 119, 91), 5);
    line(x, floor + 126, x + (on ? 10 : -10), floor + (on ? 141 : 111), new Color(176, 163, 111), 5);
    g.fillColor = on ? new Color(89, 196, 106, 220) : new Color(194, 70, 52, 200);
    g.circle(sx(x), floor + 174, 8); g.fill();
  }
  const powered = world.powerGateOpen;
  line(garden.switches[0], floor + 174, garden.switches[1], floor + 174, new Color(85, 116, 91, 120), 2);
  line(garden.switches[1], floor + 174, garden.switches[2], floor + 174, new Color(85, 116, 91, 120), 2);
  line(garden.switches[2], floor + 174, garden.powerGate, floor + 174, new Color(85, 116, 91, 120), 2);
  g.fillColor = powered ? new Color(75, 221, 105, 240) : new Color(207, 66, 49, 220);
  g.circle(sx(garden.powerGate), floor + 248, 12); g.fill();
  if (powered) {
    g.fillColor = new Color(98, 222, 122, 24);
    g.rect(sx(garden.powerGate) - 150, floor, 300, 230); g.fill();
  }

}
