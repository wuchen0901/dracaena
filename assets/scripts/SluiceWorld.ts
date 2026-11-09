import type { DogChaseSegment } from './DogChaseSegment';
import type { PushBoxSegment } from './PushBoxSegment';
import type { IndustrialPressSegment } from './IndustrialPressSegment';
import type { RiverCrossing } from './RiverCrossing';
import type { CityStoryLevels, CityStorySave } from './CityStoryLevels';
import { POLICE_COVER } from './TreeCover';
/** Engine-independent sluice geometry, movement and save validation. Y points up. */
export const CHANNEL = {
  left: 1400, right: 1740, bed: -260, near: -140, far: 40,
  logLeft: 1440, logRight: 1700, logLow: -235, logHigh: -55,
  leverX: 1270, fillSeconds: 7,
};
/** The raised canal bank slopes back to the shared forest floor before the inner sentry. */
export const ROAD = { descentStart: 2050, descentEnd: 2650, floor: CHANNEL.near };
export function roadHeight(x: number) {
  if (x <= ROAD.descentStart) return CHANNEL.far;
  if (x >= ROAD.descentEnd) return ROAD.floor;
  const t = (x - ROAD.descentStart) / (ROAD.descentEnd - ROAD.descentStart);
  return CHANNEL.far + (ROAD.floor - CHANNEL.far) * t;
}
export type Checkpoint = 'reclamation' | 'factory-escape' | 'station-exit' | 'forest' | 'sluice' | 'far-bank' | 'patrol-approach' | 'patrol-cleared' | 'crate-approach' | 'crate-cleared' | 'dog-approach' | 'dog-cleared' | 'scrap-yard' | 'police-approach' | 'police-cleared' | 'industrial-approach' | 'industrial-cleared' | 'river-approach' | 'river-cleared' | 'city-ration' | 'city-repair' | 'city-pump' | 'city-cat' | 'city-cleared' | 'garden-pruning' | 'garden-water' | 'garden-signal' | 'garden-cleared';
const CITY_CHECKPOINTS: Checkpoint[] = ['city-ration', 'city-repair', 'city-pump', 'city-cat', 'city-cleared', 'garden-pruning', 'garden-water', 'garden-signal', 'garden-cleared'];
export const SALVAGE = { origin: 3650, end: 4900, checkpoint: 4900, beacon: 5020, floor: -140 };
export const POLICE_SEARCH_APPROACH = 7200;
export type SluiceSave = { version: 1; checkpoint: Checkpoint; opened: boolean; box?: { position: number; solved: boolean }; press?: { crate: number; pressure: number; solved: boolean }; catRescued?: boolean; cityStories?: CityStorySave };
export const SAVE_KEY = 'the-last-light.sluice.v1';
export function readSave(raw: string | null): SluiceSave | null {
  try {
    const s = JSON.parse(raw || 'null');
    if (!s || s.version !== 1 || typeof s.opened !== 'boolean' ||
      ['reclamation', 'factory-escape', 'station-exit', 'forest', 'sluice', 'far-bank', 'patrol-approach', 'patrol-cleared', 'crate-approach', 'crate-cleared', 'dog-approach', 'dog-cleared', 'scrap-yard', 'police-approach', 'police-cleared', 'industrial-approach', 'industrial-cleared', 'river-approach', 'river-cleared', 'city-ration', 'city-repair', 'city-pump', 'city-cat', 'city-cleared', 'garden-pruning', 'garden-water', 'garden-signal', 'garden-cleared'].indexOf(s.checkpoint) < 0 ||
      (['far-bank', 'patrol-approach', 'patrol-cleared', 'crate-approach', 'crate-cleared', 'dog-approach', 'dog-cleared', 'scrap-yard', 'police-approach', 'police-cleared', 'industrial-approach', 'industrial-cleared', 'river-approach', 'river-cleared', 'city-ration', 'city-repair', 'city-pump', 'city-cat', 'city-cleared', 'garden-pruning', 'garden-water', 'garden-signal', 'garden-cleared'].indexOf(s.checkpoint) >= 0 && !s.opened)) return null;
    if (s.box !== undefined && (!s.box || typeof s.box.position !== 'number' || !Number.isFinite(s.box.position) ||
        s.box.position < 0 || s.box.position > 1 || typeof s.box.solved !== 'boolean')) return null;
    if (s.catRescued !== undefined && typeof s.catRescued !== 'boolean') return null;
    if (s.cityStories !== undefined && (!s.cityStories || !Number.isFinite(s.cityStories.rationBox) || s.cityStories.rationBox < 9860 || s.cityStories.rationBox > 10080 || !Number.isFinite(s.cityStories.battery) || s.cityStories.battery < 10870 || s.cityStories.battery > 11120 || typeof s.cityStories.pumpOn !== 'boolean' || !Number.isFinite(s.cityStories.waterBowl) || s.cityStories.waterBowl < 13120 || s.cityStories.waterBowl > 13435 || (s.cityStories.pruningBranch !== undefined && (!Number.isFinite(s.cityStories.pruningBranch) || s.cityStories.pruningBranch < 14540 || s.cityStories.pruningBranch > 14825)) || (s.cityStories.wildWater !== undefined && typeof s.cityStories.wildWater !== 'boolean') || (s.cityStories.relayPanel !== undefined && (!Number.isFinite(s.cityStories.relayPanel) || s.cityStories.relayPanel < 16620 || s.cityStories.relayPanel > 16970)))) return null;
    if (s.press !== undefined && (!s.press || typeof s.press.crate !== 'number' || !Number.isFinite(s.press.crate) || s.press.crate < 0 || s.press.crate > 1 || typeof s.press.pressure !== 'number' || !Number.isFinite(s.press.pressure) || s.press.pressure < 0 || s.press.pressure > 1 || typeof s.press.solved !== 'boolean')) return null;
    if ((['crate-approach', 'crate-cleared', 'dog-approach', 'dog-cleared', 'scrap-yard', 'police-approach', 'police-cleared', 'industrial-approach', 'industrial-cleared', 'river-approach', 'river-cleared', 'city-ration', 'city-repair', 'city-pump', 'city-cat', 'city-cleared'].indexOf(s.checkpoint) >= 0) && !s.box) return null;
    if (['crate-cleared', 'dog-approach', 'dog-cleared', 'police-approach', 'police-cleared', 'industrial-approach', 'industrial-cleared', 'river-approach', 'river-cleared'].indexOf(s.checkpoint) >= 0 && !s.box?.solved) return null;
    if ((s.checkpoint === 'industrial-approach' || s.checkpoint === 'industrial-cleared') && !s.press) return null;
    if (['industrial-cleared', 'river-approach', 'river-cleared'].indexOf(s.checkpoint) >= 0 && !s.press?.solved) return null;
    if (CITY_CHECKPOINTS.indexOf(s.checkpoint) >= 0 && !s.cityStories) return null;
    if (['city-repair', 'city-pump', 'city-cat', 'city-cleared'].indexOf(s.checkpoint) >= 0 && s.cityStories?.rationBox < 10080) return null;
    if (['city-pump', 'city-cat', 'city-cleared'].indexOf(s.checkpoint) >= 0 && s.cityStories?.battery < 11120) return null;
    if (['city-cat', 'city-cleared'].indexOf(s.checkpoint) >= 0 && !s.cityStories?.pumpOn) return null;
    if (s.checkpoint === 'city-cleared' && s.cityStories?.waterBowl < 13435) return null;
    if (['garden-pruning', 'garden-water', 'garden-signal', 'garden-cleared'].indexOf(s.checkpoint) >= 0 && (!s.cityStories || s.cityStories.waterBowl < 13435)) return null;
    if (['garden-water', 'garden-signal', 'garden-cleared'].indexOf(s.checkpoint) >= 0 && s.cityStories?.pruningBranch !== undefined && s.cityStories.pruningBranch < 14825) return null;
    if (['garden-signal', 'garden-cleared'].indexOf(s.checkpoint) >= 0 && !s.cityStories?.wildWater) return null;
    if (s.checkpoint === 'garden-cleared' && s.cityStories?.relayPanel !== undefined && s.cityStories.relayPanel < 16970) return null;
    return { version: 1, checkpoint: s.checkpoint, opened: s.opened, ...(s.box ? { box: { position: s.box.position, solved: s.box.solved } } : {}), ...(s.press ? { press: { crate: s.press.crate, pressure: s.press.pressure, solved: s.press.solved } } : {}), ...(s.catRescued === undefined ? {} : { catRescued: s.catRescued }), ...(s.cityStories ? { cityStories: { ...s.cityStories } } : {}) };
  } catch { return null; }
}
/** Atmosphere and story flags are saved atomically with the safe checkpoint. */
export type ProgressSave = SluiceSave & { night: number; escaped: boolean; alarm: boolean; policeCleared?: boolean };
export function readProgress(raw: string | null): ProgressSave | null {
  const world = readSave(raw);
  if (!world) return null;
  const s = JSON.parse(raw!);
  const night = s.night === undefined ? 0 : s.night;
  const escaped = s.escaped === undefined ? world.checkpoint === 'patrol-cleared' : s.escaped;
  const alarm = s.alarm === undefined ? world.checkpoint !== 'reclamation' : s.alarm;
  const policeCleared = s.policeCleared === undefined ? false : s.policeCleared;
  if (typeof night !== 'number' || !Number.isFinite(night) || night < 0 || night > 1 ||
      typeof escaped !== 'boolean' || typeof alarm !== 'boolean' || typeof policeCleared !== 'boolean' ||
      (world.checkpoint === 'patrol-cleared' && !escaped) ||
      (['police-cleared', 'industrial-approach', 'industrial-cleared', 'river-approach', 'river-cleared', ...CITY_CHECKPOINTS].indexOf(world.checkpoint) >= 0 && !policeCleared)) return null;
  return { ...world, night, escaped, alarm, ...(s.policeCleared === undefined ? {} : { policeCleared }) };
}
export const ARCHIVE_KEY = 'the-last-light.autosaves.v1';
export type AutoSave = { id: number; name: string; createdAt: number | null; progress: ProgressSave };
export type SaveArchive = { version: 1; activeId: number | null; entries: AutoSave[] };
export function emptyArchive(): SaveArchive { return { version: 1, activeId: null, entries: [] }; }
const SAVE_SLOTS = ['reclamation', 'factory-escape', 'station-exit', 'forest', 'sluice', 'sluice-opened', 'far-bank', 'patrol-approach', 'patrol-cleared', 'scrap-yard', 'crate-approach', 'crate-cleared', 'dog-approach', 'dog-cleared', 'police-approach', 'police-cleared', 'industrial-approach', 'industrial-cleared', 'river-approach', 'river-cleared', ...CITY_CHECKPOINTS];
export function saveSlot(s: ProgressSave): string {
  if (s.checkpoint === 'sluice' && s.opened) return 'sluice-opened';
  return s.checkpoint;
}
function slotIndex(s: ProgressSave) { return SAVE_SLOTS.indexOf(saveSlot(s)); }
export function saveName(s: ProgressSave): string {
  const names: Record<Checkpoint, string> = {
    reclamation: '工厂 · 警报响起', 'factory-escape': '工厂逃亡 · 只剩主角', 'station-exit': '逃出维修门', forest: '踏入森林',
    sluice: s.opened ? '水闸已开启' : '林间水闸', 'far-bank': '抵达对岸',
    'patrol-approach': '园区岗哨 · 视线逼近', 'patrol-cleared': '躲过园区岗哨', 'crate-approach': s.box && s.box.position > .99 ? '围墙前 · 箱子已就位' : '监狱围墙 · 旧木箱', 'crate-cleared': '翻越监狱围墙', 'dog-approach': s.catRescued ? '墙外 · 救下小猫' : '墙外 · 犬吠逼近', 'dog-cleared': '越过断口 · 甩开追犬', 'scrap-yard': '中继信号 · 指向海岸', 'police-approach': '墙外 · 警车搜寻', 'police-cleared': '甩开警车搜寻', 'industrial-approach': s.press?.solved ? '废弃车间 · 压力板已固定' : '废弃车间 · 移动检修桥', 'industrial-cleared': '越过断裂检修沟', 'river-approach': '废城河岸 · 旧渡船', 'river-cleared': '顺流划过废城河道',
    'city-ration': '废城 · 配给队伍', 'city-repair': '废城 · 唤醒旧机器人', 'city-pump': '废城 · 恢复水泵', 'city-cat': '废城 · 幸存者与小猫', 'city-cleared': '穿过废城',
    'garden-pruning': '失控的花园 · 卡住修剪机械', 'garden-water': '失控的花园 · 引水到野地', 'garden-signal': '失控的花园 · 改变扫描方向', 'garden-cleared': '离开 AI 花园',
  };
  return s.checkpoint === 'reclamation' && s.alarm ? '工厂 · 警报响起' : names[s.checkpoint];
}
export function sameMilestone(a: ProgressSave, b: ProgressSave): boolean {
  const cityMark = (s: ProgressSave) => s.cityStories ? [s.cityStories.rationBox >= 10080, s.cityStories.battery >= 11120, s.cityStories.pumpOn, s.cityStories.waterBowl >= 13435, (s.cityStories.pruningBranch || 14540) >= 14825, s.cityStories.wildWater, (s.cityStories.relayPanel || 16620) >= 16970].join(':') : '';
  return a.checkpoint === b.checkpoint && a.opened === b.opened && a.escaped === b.escaped && a.alarm === b.alarm && Boolean(a.policeCleared) === Boolean(b.policeCleared) && Boolean(a.catRescued) === Boolean(b.catRescued) && JSON.stringify(a.box) === JSON.stringify(b.box) && JSON.stringify(a.press) === JSON.stringify(b.press) && cityMark(a) === cityMark(b);
}
export function readArchive(raw: string | null): SaveArchive | null {
  try {
    const a = JSON.parse(raw || 'null');
    if (!a || a.version !== 1 || !Array.isArray(a.entries)) return null;
    const entries: AutoSave[] = []; const ids = new Set<number>();
    for (const e of a.entries) {
      if (!e || !(typeof e.id === 'number' && Number.isFinite(e.id) && Math.floor(e.id) === e.id) || e.id < 1 || ids.has(e.id) ||
          (e.createdAt !== null && (typeof e.createdAt !== 'number' || !Number.isFinite(e.createdAt) || e.createdAt < 0))) continue;
      const progress = readProgress(JSON.stringify(e.progress)); if (!progress) continue;
      ids.add(e.id); entries.push({ id: e.id, name: saveName(progress), createdAt: e.createdAt, progress });
    }
    const active = entries.find(e => e.id === a.activeId);
    const activeKey = active ? saveSlot(active.progress) : null;
    const bySlot = new Map<string, AutoSave>();
    // Collapse append-only archives from older versions to the newest save in each fixed slot.
    entries.sort((x, y) => (x.createdAt || 0) - (y.createdAt || 0) || x.id - y.id);
    for (const entry of entries) bySlot.set(saveSlot(entry.progress), entry);
    const ordered = [...bySlot.values()].sort((x, y) => slotIndex(x.progress) - slotIndex(y.progress));
    const activeEntry = activeKey ? ordered.find(e => saveSlot(e.progress) === activeKey) : undefined;
    return { version: 1, entries: ordered, activeId: activeEntry?.id ?? (ordered.length ? ordered[ordered.length - 1].id : null) };
  } catch { return null; }
}
export function upsertAutosave(a: SaveArchive, progress: ProgressSave, createdAt: number | null): SaveArchive {
  const targetKey = saveSlot(progress), targetRank = slotIndex(progress);
  const activeIndex = a.entries.findIndex(e => e.id === a.activeId);
  const active = activeIndex >= 0 ? a.entries[activeIndex] : undefined;
  const activeRank = active ? slotIndex(active.progress) : -1;
  const existing = a.entries.find(e => saveSlot(e.progress) === targetKey);
  const id = existing?.id ?? (a.entries.reduce((max, e) => Math.max(max, e.id), 0) + 1);
  const replacement: AutoSave = { id, name: saveName(progress), createdAt, progress: { ...progress } };
  let entries: AutoSave[];
  if (active && targetRank > activeRank) {
    // Advancing from a loaded older save starts a new branch at this next milestone.
    entries = a.entries.slice(0, activeIndex + 1);
    entries.push(replacement);
  } else if (existing) {
    entries = a.entries.map(e => e.id === existing.id ? replacement : e);
  } else {
    entries = [...a.entries, replacement];
  }
  entries.sort((x, y) => slotIndex(x.progress) - slotIndex(y.progress));
  return { version: 1, activeId: id, entries };
}
/** Keep the opening available as the first loadable checkpoint, including in older archives. */
export function ensureOpeningAutosave(a: SaveArchive, createdAt: number): SaveArchive {
  if (a.entries.some(entry => saveSlot(entry.progress) === 'reclamation')) return a;
  const id = a.entries.reduce((max, entry) => Math.max(max, entry.id), 0) + 1;
  const progress: ProgressSave = {
    version: 1, checkpoint: 'reclamation', opened: false,
    night: 0, escaped: false, alarm: true,
  };
  const entry: AutoSave = { id, name: saveName(progress), createdAt, progress };
  const entries = [...a.entries, entry].sort((x, y) => slotIndex(x.progress) - slotIndex(y.progress));
  return { version: 1, activeId: a.activeId ?? id, entries };
}
export class SluiceWorld {
  readonly box?: PushBoxSegment;
  readonly press?: IndustrialPressSegment;
  readonly river?: RiverCrossing;
  readonly city?: CityStoryLevels;
  readonly dog?: DogChaseSegment; recoverySerial = 0;
  constructor(box?: PushBoxSegment, dog?: DogChaseSegment, press?: IndustrialPressSegment, river?: RiverCrossing, city?: CityStoryLevels) { this.box = box; this.dog = dog; this.press = press; this.river = river; this.city = city; }
  x = -3550; y = CHANNEL.near; vx = 0; vy = 0; grounded = true;
  opened = false; fill = 0; checkpoint: Checkpoint = 'reclamation';
  private coyote = .12;
  private buffer = 0;
  get logY() { return CHANNEL.logLow + (CHANNEL.logHigh - CHANNEL.logLow) * this.fill; }
  get waterY() { return this.logY - 17; }
  get canInteract() {
    return !this.opened && this.grounded && Math.abs(this.x - CHANNEL.leverX) < 95 && Math.abs(this.y - CHANNEL.near) < 8;
  }
  interact() { if (!this.canInteract) return false; this.opened = true; return true; }
  jump() { if (!this.river?.isOnBoat(this.x)) this.buffer = .14; }
  save(): SluiceSave { return { version: 1, checkpoint: this.checkpoint, opened: this.opened, ...(this.box && (['crate-approach', 'crate-cleared', 'dog-approach', 'dog-cleared', 'scrap-yard', 'police-approach', 'police-cleared', 'industrial-approach', 'industrial-cleared', 'river-approach', 'river-cleared', ...CITY_CHECKPOINTS].indexOf(this.checkpoint) >= 0) ? { box: this.box.save() } : {}), ...(this.press && ['industrial-approach', 'industrial-cleared', 'river-approach', 'river-cleared', ...CITY_CHECKPOINTS].indexOf(this.checkpoint) >= 0 ? { press: this.press.save() } : {}), ...(this.dog && ['dog-approach', 'dog-cleared', 'scrap-yard', 'police-approach', 'police-cleared', 'industrial-approach', 'industrial-cleared', 'river-approach', 'river-cleared', ...CITY_CHECKPOINTS].indexOf(this.checkpoint) >= 0 ? { catRescued: this.dog.catRescued } : {}), ...(this.city && CITY_CHECKPOINTS.indexOf(this.checkpoint) >= 0 ? { cityStories: this.city.save() } : {}) }; }
  restore(save: SluiceSave) {
    this.checkpoint = save.checkpoint; this.opened = save.opened; this.fill = save.opened ? 1 : 0; this.city?.restore(save.cityStories);
    this.x = save.checkpoint === 'far-bank' ? 1880 : save.checkpoint === 'sluice' ? 1190 : save.checkpoint === 'reclamation' ? -3550 : save.checkpoint === 'factory-escape' ? -2600 : save.checkpoint === 'station-exit' ? -980 : save.checkpoint === 'patrol-approach' ? 3080 : save.checkpoint === 'patrol-cleared' ? 3280 : save.checkpoint === 'scrap-yard' ? SALVAGE.checkpoint : save.checkpoint === 'police-approach' ? POLICE_SEARCH_APPROACH : save.checkpoint === 'police-cleared' ? POLICE_COVER.right + 40 : save.checkpoint === 'city-ration' ? 9730 : save.checkpoint === 'city-repair' ? 10750 : save.checkpoint === 'city-pump' ? 11940 : save.checkpoint === 'city-cat' ? 13020 : save.checkpoint === 'city-cleared' ? 14200 : save.checkpoint === 'garden-pruning' ? 14420 : save.checkpoint === 'garden-water' ? 15250 : save.checkpoint === 'garden-signal' ? 16250 : save.checkpoint === 'garden-cleared' ? 17550 : -90;
    this.y = ['far-bank', 'patrol-approach', 'patrol-cleared', 'crate-approach', 'crate-cleared', 'dog-approach', 'dog-cleared', 'scrap-yard', 'police-approach', 'police-cleared', ...CITY_CHECKPOINTS].indexOf(save.checkpoint) >= 0 ? roadHeight(this.x) : CHANNEL.near;
    this.box?.restore(save.box);
    this.press?.restore(save.press);
    if (save.checkpoint === 'industrial-approach' || save.checkpoint === 'industrial-cleared') {
      this.x = save.checkpoint === 'industrial-cleared' ? this.press!.exitX : this.press!.entryX;
      this.y = roadHeight(this.x);
    }
    if (save.checkpoint === 'river-approach' || save.checkpoint === 'river-cleared') {
      this.x = save.checkpoint === 'river-cleared' ? this.river!.exitX : this.river!.approachX;
      this.y = roadHeight(this.x);
    }
    if (this.box && (save.checkpoint === 'crate-approach' || save.checkpoint === 'crate-cleared')) {
      this.x = save.checkpoint === 'crate-cleared' ? this.box.exitX : this.box.entryX;
      this.y = this.box.layout.floor;
    }
    if (this.dog) {
      const dogCleared = ['dog-cleared', 'scrap-yard', 'police-approach', 'police-cleared', 'industrial-approach', 'industrial-cleared', 'river-approach', 'river-cleared', ...CITY_CHECKPOINTS].indexOf(save.checkpoint) >= 0;
      if (save.checkpoint === 'dog-approach' || save.checkpoint === 'dog-cleared') {
        this.x = save.checkpoint === 'dog-cleared' ? this.dog.exitX : this.dog.approachX;
        this.y = this.dog.layout.floor;
      }
      this.dog.reset(dogCleared, save.catRescued === undefined ? dogCleared : save.catRescued, this.x);
    }
    this.vx = this.vy = this.buffer = 0; this.grounded = true; this.coyote = .12;
  }
  groundAt(x: number) {
    if (this.checkpoint === 'river-approach' && this.river?.isOnBoat(x)) return this.river.layout.deckY;
    if (this.checkpoint === 'river-approach' && this.river?.isOnRamp(x)) return this.river.rampY(x);
    const gapGround = this.dog?.groundAt(x); if (gapGround !== null && gapGround !== undefined) return gapGround;
    const boxGround = this.box?.groundAt(x); if (boxGround !== null && boxGround !== undefined) return boxGround;
    const machineGround = this.press?.groundAt(x); if (machineGround !== null && machineGround !== undefined) return machineGround;
    const cityGround = this.city?.groundAt(x); if (cityGround !== null && cityGround !== undefined) return cityGround;
    if (this.press && x >= this.press.layout.origin + this.press.layout.gapLeft && x <= this.press.layout.origin + this.press.layout.gapRight) return null;
    if (x <= CHANNEL.left) return CHANNEL.near;
    if (x >= CHANNEL.right) return roadHeight(x);
    if (x >= CHANNEL.logLeft && x <= CHANNEL.logRight) return this.logY;
    return CHANNEL.bed;
  }
  step(delta: number, direction: number, running = false, grabbing = false) {
    // Substep rather than discard elapsed time; moving platforms and collision share the same clock.
    if (this.box) this.box.moving = false;
    if (this.press) this.press.moving = false;
    let remaining = Math.min(Math.max(delta, 0), .25);
    while (remaining > 1e-8) {
      const dt = Math.min(remaining, 1 / 120); remaining -= dt;
      const recovery = this.recoverySerial;
      this.tick(dt, direction, running, grabbing);
      if (this.recoverySerial !== recovery) break;
    }
  }
  private tick(dt: number, direction: number, running: boolean, grabbing: boolean) {
    const oldLog = this.logY;
    const oldBridgeX = this.press?.bridgeX ?? 0;
    this.press?.tick(dt, this.x, this.y, this.grounded);
    if (this.press && this.grounded) this.x += this.press.carriedDelta(this.x, this.y, this.grounded, oldBridgeX);
    if (this.opened) this.fill = Math.min(1, this.fill + dt / CHANNEL.fillSeconds);
    if (this.grounded && this.x >= CHANNEL.logLeft && this.x <= CHANNEL.logRight && Math.abs(this.y - oldLog) < 2) {
      this.y += this.logY - oldLog;
    }
    this.coyote = this.grounded ? .12 : Math.max(0, this.coyote - dt);
    if (this.buffer > 0 && this.coyote > 0) {
      this.vy = 610; this.grounded = false; this.buffer = this.coyote = 0;
    }
    this.buffer = Math.max(0, this.buffer - dt);
    const holdingBox = !!this.box && grabbing && this.box.canGrab(this.x, this.y, this.grounded);
    const holdingPress = !!this.press && this.press.canGrab(this.x, this.y, this.grounded) && grabbing;
    const holdingCity = !!this.city && this.city.beginMove(this.x, this.grounded, grabbing);
    const rowing = this.checkpoint === 'river-approach' && !!this.river?.isOnBoat(this.x);
    const onRamp = this.checkpoint === 'river-approach' && !!this.river?.isOnRamp(this.x);
    const targetSpeed = rowing ? (direction > 0 ? this.river!.layout.rowingSpeed : 0) : direction * (holdingBox ? this.box!.layout.pushSpeed : holdingPress ? 75 : holdingCity ? 90 : running ? 240 : 145);
    this.vx += (targetSpeed - this.vx) * Math.min(1, dt * 15);
    const previousX = this.x, previousY = this.y;
    let nextX = Math.max(-2350, this.x + this.vx * dt);
    if (holdingBox) {
      const moved = this.box!.move(nextX - previousX); nextX = previousX + moved; this.vx = moved / dt;
    }
    if (holdingPress) {
      const moved = this.press!.moveCrate(nextX - previousX); nextX = previousX + moved; this.vx = moved / dt;
    }
    if (holdingCity) { const moved = this.city!.moveProp(nextX - previousX); nextX = previousX + moved; this.vx = moved / dt; }
    const boardStarted = this.checkpoint === 'river-approach' && !!this.river && !this.river.isOnBoat(previousX) && this.river.isOnBoat(nextX);
    if (boardStarted) { this.y = this.river!.layout.deckY; this.vy = 0; this.grounded = true; }
    // Solid banks and log sides: feet must clear the top before crossing an edge.
    const walls = [
      { edge: CHANNEL.left, top: CHANNEL.near, right: false },
      { edge: CHANNEL.right, top: CHANNEL.far, right: true },
      { edge: CHANNEL.logLeft, top: this.logY, right: true },
      { edge: CHANNEL.logRight, top: this.logY, right: false },
      ...(this.box ? this.box.walls(!holdingBox) : []),
      ...(this.press ? this.press.walls(!holdingPress) : []),
      ...(this.dog ? this.dog.walls() : []),
      ...(this.city ? this.city.walls(!holdingCity) : []),
    ];
    for (const wall of walls) {
      if (this.y >= wall.top - 1) continue;
      if (wall.right && previousX <= wall.edge - 12 && nextX > wall.edge - 12) { nextX = wall.edge - 12; this.vx = 0; }
      if (!wall.right && previousX >= wall.edge + 12 && nextX < wall.edge + 12) { nextX = wall.edge + 12; this.vx = 0; }
    }
    this.x = nextX;
    const surface = this.groundAt(this.x);
    if (this.checkpoint === 'river-approach' && this.river?.isOnBoat(this.x)) {
      this.y = this.river.layout.deckY; this.vy = 0; this.grounded = true;
    } else if (onRamp && this.river?.isOnRamp(this.x)) {
      this.y = this.river.rampY(this.x); this.vy = 0; this.grounded = true;
    } else if (surface !== null && this.grounded && Math.abs(this.y - surface) <= 3) this.y = surface;
    else {
      this.grounded = false; this.vy -= 1400 * dt; this.y += this.vy * dt;
      if (surface !== null && this.vy <= 0 && previousY >= surface - 3 && this.y <= surface) {
        this.y = surface; this.vy = 0; this.grounded = true;
      }
    }
    if (this.checkpoint === 'reclamation' && this.grounded && this.x >= -2650) this.checkpoint = 'factory-escape';
    if ((this.checkpoint === 'reclamation' || this.checkpoint === 'factory-escape') && this.grounded && this.x >= -1000) this.checkpoint = 'station-exit';
    if (this.checkpoint === 'station-exit' && this.grounded && this.x >= -200) this.checkpoint = 'forest';
    if (this.checkpoint === 'forest' && this.grounded && this.x >= 1050 && this.x < CHANNEL.left) this.checkpoint = 'sluice';
    if (this.checkpoint === 'sluice' && this.opened && this.grounded && this.x >= CHANNEL.right + 50 && this.y === CHANNEL.far) this.checkpoint = 'far-bank';
    if (this.checkpoint === 'far-bank' && this.grounded && this.x >= 3080) this.checkpoint = 'patrol-approach';
    if (this.checkpoint === 'patrol-cleared' && this.grounded && this.x >= SALVAGE.checkpoint) this.checkpoint = 'scrap-yard';
    if (this.press && this.checkpoint === 'police-cleared' && this.grounded && this.x >= this.press.entryX) this.checkpoint = 'industrial-approach';
    if (this.press && this.checkpoint === 'industrial-approach' && this.press.solved && this.grounded && this.x >= this.press.exitX) this.checkpoint = 'industrial-cleared';
    if (this.river && this.checkpoint === 'industrial-cleared' && this.grounded && this.x >= this.river.approachX) this.checkpoint = 'river-approach';
    if (this.river && this.checkpoint === 'river-approach' && this.grounded && this.x >= this.river.exitX) { this.checkpoint = 'river-cleared'; this.y = roadHeight(this.x); }
    if (this.city && this.checkpoint === 'river-cleared' && this.grounded && this.x >= 9680) this.checkpoint = 'city-ration';
    if (this.city && this.checkpoint === 'city-ration' && this.city.rationSolved && this.grounded && this.x >= 10510) this.checkpoint = 'city-repair';
    if (this.city && this.checkpoint === 'city-repair' && this.city.repairSolved && this.grounded && this.x >= 11600) this.checkpoint = 'city-pump';
    if (this.city && this.checkpoint === 'city-pump' && this.city.pumpOn && this.grounded && this.x >= 12800) this.checkpoint = 'city-cat';
    if (this.city && this.checkpoint === 'city-cat' && this.city.catSolved && this.grounded && this.x >= 14200) this.checkpoint = 'city-cleared';
    if (this.city && this.checkpoint === 'city-cleared' && this.grounded && this.x >= 14420) this.checkpoint = 'garden-pruning';
    if (this.city && this.checkpoint === 'garden-pruning' && this.city.pruningSolved && this.grounded && this.x >= 15220) this.checkpoint = 'garden-water';
    if (this.city && this.checkpoint === 'garden-water' && this.city.wildWater && this.grounded && this.x >= 16220) this.checkpoint = 'garden-signal';
    if (this.city && this.checkpoint === 'garden-signal' && this.city.signalSolved && this.grounded && this.x >= 17520) this.checkpoint = 'garden-cleared';
    if (this.box && this.grounded) {
      if (this.checkpoint === 'scrap-yard' && this.x >= this.box.entryX) this.checkpoint = 'crate-approach';
      if (this.checkpoint === 'crate-approach' && this.x >= this.box.wallEndX + 35 && Math.abs(this.y - this.box.layout.floor) < 1) {
        this.box.solved = true; this.checkpoint = 'crate-cleared';
      }
    }
    if (this.dog && this.checkpoint === 'crate-cleared' && this.grounded && this.x >= this.dog.approachX) this.checkpoint = 'dog-approach';
    if (this.checkpoint === 'dog-cleared' && this.grounded && this.x >= POLICE_SEARCH_APPROACH) this.checkpoint = 'police-approach';
    // A missed landing is a gentle return to shore, without a drowning sequence.
    if (this.y < -500 || (this.opened && this.x > CHANNEL.left && this.x < CHANNEL.right && this.y + 60 < this.waterY)) { this.restore(this.save()); this.recoverySerial++; }
  }
}
