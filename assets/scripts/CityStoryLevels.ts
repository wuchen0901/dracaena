import { Color, Graphics } from 'cc';

/** Four short, playable environmental stories after the river crossing. */
export type CityStorySave = { rationBox: number; battery: number; pumpOn: boolean; waterBowl: number };
export const CITY_STORY = {
  ration: { box: 9860, target: 10080, gate: 10430, worker: 10155, elder: 10215 },
  repair: { battery: 10870, target: 11120, gate: 11500, robot: 11220 },
  pump: { switchX: 12100, gate: 12700, cameraX: 12315, pumpX: 12480 },
  cat: { bowl: 13120, target: 13435, catX: 13510, survivorX: 13610, gate: 14120 },
  floor: -140, propW: 82, propH: 74, pushSpeed: 112,
};
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));

export class CityStoryLevels {
  rationBox = CITY_STORY.ration.box;
  battery = CITY_STORY.repair.battery;
  pumpOn = false;
  waterBowl = CITY_STORY.cat.bowl;
  rationSolved = false; repairSolved = false; catSolved = false;
  private held: 'ration' | 'battery' | 'bowl' | null = null;

  restore(save?: CityStorySave) {
    this.rationBox = clamp(save?.rationBox ?? CITY_STORY.ration.box, CITY_STORY.ration.box, CITY_STORY.ration.target);
    this.battery = clamp(save?.battery ?? CITY_STORY.repair.battery, CITY_STORY.repair.battery, CITY_STORY.repair.target);
    this.pumpOn = save?.pumpOn ?? false;
    this.waterBowl = clamp(save?.waterBowl ?? CITY_STORY.cat.bowl, CITY_STORY.cat.bowl, CITY_STORY.cat.target);
    this.rationSolved = this.rationBox >= CITY_STORY.ration.target;
    this.repairSolved = this.battery >= CITY_STORY.repair.target;
    this.catSolved = this.waterBowl >= CITY_STORY.cat.target;
    this.held = null;
  }
  save(): CityStorySave { return { rationBox: this.rationBox, battery: this.battery, pumpOn: this.pumpOn, waterBowl: this.waterBowl }; }
  private activeProp(playerX: number, grounded: boolean, grabbing: boolean) {
    if (!grounded || !grabbing) return null;
    const props: ['ration' | 'battery' | 'bowl', number, boolean][] = [
      ['ration', this.rationBox, !this.rationSolved], ['battery', this.battery, !this.repairSolved], ['bowl', this.waterBowl, !this.catSolved],
    ];
    for (const [id, x, available] of props) {
      if (!available) continue;
      if (Math.abs(playerX - x) >= CITY_STORY.propW / 2 && Math.abs(playerX - x) <= CITY_STORY.propW / 2 + 38) return id;
    }
    return null;
  }
  beginMove(playerX: number, grounded: boolean, grabbing: boolean) { this.held = this.activeProp(playerX, grounded, grabbing); return this.held !== null; }
  moveProp(delta: number) {
    if (!this.held) return 0;
    const key = this.held;
    const before = key === 'ration' ? this.rationBox : key === 'battery' ? this.battery : this.waterBowl;
    const minimum = key === 'ration' ? CITY_STORY.ration.box : key === 'battery' ? CITY_STORY.repair.battery : CITY_STORY.cat.bowl;
    const target = key === 'ration' ? CITY_STORY.ration.target : key === 'battery' ? CITY_STORY.repair.target : CITY_STORY.cat.target;
    const next = clamp(before + delta, minimum, target);
    if (key === 'ration') this.rationBox = next;
    else if (key === 'battery') this.battery = next;
    else this.waterBowl = next;
    this.rationSolved ||= this.rationBox >= CITY_STORY.ration.target;
    this.repairSolved ||= this.battery >= CITY_STORY.repair.target;
    this.catSolved ||= this.waterBowl >= CITY_STORY.cat.target;
    return next - before;
  }
  endMove() { this.held = null; }
  interact(playerX: number, grounded: boolean) {
    if (grounded && Math.abs(playerX - CITY_STORY.pump.switchX) < 95 && !this.pumpOn) { this.pumpOn = true; return true; }
    return false;
  }
  get checkpoint(): 'river-cleared' | 'city-ration' | 'city-repair' | 'city-pump' | 'city-cat' | 'city-cleared' {
    if (this.catSolved) return 'city-cleared';
    if (this.pumpOn && this.repairSolved && this.rationSolved) return 'city-cat';
    if (this.pumpOn && this.repairSolved) return 'city-pump';
    if (this.repairSolved) return 'city-repair';
    if (this.rationSolved) return 'city-ration';
    return 'river-cleared';
  }
  canGrab(playerX: number, grounded: boolean, grabbing: boolean) { return this.activeProp(playerX, grounded, grabbing) !== null; }
  walls(includeProps = true) {
    const s = CITY_STORY;
    return [
      ...(!this.rationSolved ? [{ edge: s.ration.gate, top: 240, right: true }] : []),
      ...(!this.repairSolved ? [{ edge: s.repair.gate, top: 240, right: true }] : []),
      ...(!this.pumpOn ? [{ edge: s.pump.gate, top: 240, right: true }] : []),
      ...(!this.catSolved ? [{ edge: s.cat.gate, top: 240, right: true }] : []),
      ...(includeProps && !this.rationSolved ? this.propWall(this.rationBox) : []),
      ...(includeProps && !this.repairSolved ? this.propWall(this.battery) : []),
      ...(includeProps && !this.catSolved ? this.propWall(this.waterBowl) : []),
    ];
  }
  private propWall(x: number) { return [
    { edge: x - CITY_STORY.propW / 2, top: CITY_STORY.floor + CITY_STORY.propH, right: true },
    { edge: x + CITY_STORY.propW / 2, top: CITY_STORY.floor + CITY_STORY.propH, right: false },
  ]; }
  groundAt(x: number): number | null {
    for (const [box, solved] of [[this.rationBox, this.rationSolved], [this.battery, this.repairSolved], [this.waterBowl, this.catSolved]] as [number, boolean][]) {
      if (!solved && Math.abs(x - box) <= CITY_STORY.propW / 2) return CITY_STORY.floor + CITY_STORY.propH;
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
  const crate = (x: number, kind: 'wood' | 'cell' | 'bowl') => {
    const half = s.propW / 2;
    const base = kind === 'wood' ? new Color(116, 87, 55) : kind === 'cell' ? new Color(69, 94, 84) : new Color(120, 113, 84);
    rect(x - half, floor, s.propW, kind === 'bowl' ? 18 : s.propH, base);
    if (kind === 'wood') { line(x - half + 8, floor + 8, x + half - 8, floor + s.propH - 8, new Color(76, 64, 45), 4); line(x - half + 8, floor + s.propH - 8, x + half - 8, floor + 8, new Color(76, 64, 45), 4); }
    if (kind === 'cell') { rect(x - 24, floor + 28, 48, 18, new Color(191, 163, 81)); g.fillColor = new Color(232, 197, 85, Math.round(160 + 80 * Math.sin(time * 4))); g.circle(sx(x), floor + 38, 10); g.fill(); }
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
}
