/** Engine-independent sluice geometry, movement and save validation. Y points up. */
export const CHANNEL = {
  left: 1400, right: 1740, bed: -260, near: -140, far: 40,
  logLeft: 1440, logRight: 1700, logLow: -235, logHigh: -55,
  leverX: 1270, fillSeconds: 7,
};
export type Checkpoint = 'reclamation' | 'station-exit' | 'forest' | 'sluice' | 'far-bank' | 'patrol-approach' | 'patrol-cleared';
export type SluiceSave = { version: 1; checkpoint: Checkpoint; opened: boolean };
export const SAVE_KEY = 'the-last-light.sluice.v1';
export function readSave(raw: string | null): SluiceSave | null {
  try {
    const s = JSON.parse(raw || 'null');
    if (!s || s.version !== 1 || typeof s.opened !== 'boolean' ||
      ['reclamation', 'station-exit', 'forest', 'sluice', 'far-bank', 'patrol-approach', 'patrol-cleared'].indexOf(s.checkpoint) < 0 ||
      (['far-bank', 'patrol-approach', 'patrol-cleared'].indexOf(s.checkpoint) >= 0 && !s.opened)) return null;
    return { version: 1, checkpoint: s.checkpoint, opened: s.opened };
  } catch { return null; }
}
/** Atmosphere and story flags are saved atomically with the safe checkpoint. */
export type ProgressSave = SluiceSave & { night: number; escaped: boolean; alarm: boolean };
export function readProgress(raw: string | null): ProgressSave | null {
  const world = readSave(raw);
  if (!world) return null;
  const s = JSON.parse(raw!);
  const night = s.night === undefined ? 0 : s.night;
  const escaped = s.escaped === undefined ? world.checkpoint === 'patrol-cleared' : s.escaped;
  const alarm = s.alarm === undefined ? world.checkpoint !== 'reclamation' : s.alarm;
  if (typeof night !== 'number' || !Number.isFinite(night) || night < 0 || night > 1 ||
      typeof escaped !== 'boolean' || typeof alarm !== 'boolean' ||
      (world.checkpoint === 'patrol-cleared' && !escaped)) return null;
  return { ...world, night, escaped, alarm };
}
export const ARCHIVE_KEY = 'the-last-light.autosaves.v1';
export type AutoSave = { id: number; name: string; createdAt: number | null; progress: ProgressSave };
export type SaveArchive = { version: 1; activeId: number | null; entries: AutoSave[] };
export function emptyArchive(): SaveArchive { return { version: 1, activeId: null, entries: [] }; }
export function saveName(s: ProgressSave): string {
  const names: Record<Checkpoint, string> = {
    reclamation: '回收站 · 待处理区', 'station-exit': '逃出维修门', forest: '踏入森林',
    sluice: s.opened ? '水闸已开启' : '林间水闸', 'far-bank': '抵达对岸',
    'patrol-approach': '夜林 · 警灯将近', 'patrol-cleared': '躲过搜寻',
  };
  return s.checkpoint === 'reclamation' && s.alarm ? '回收站 · 警报响起' : names[s.checkpoint];
}
export function sameMilestone(a: ProgressSave, b: ProgressSave): boolean {
  return a.checkpoint === b.checkpoint && a.opened === b.opened && a.escaped === b.escaped && a.alarm === b.alarm;
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
    entries.sort((x, y) => (x.createdAt || 0) - (y.createdAt || 0) || x.id - y.id);
    return { version: 1, entries, activeId: ids.has(a.activeId) ? a.activeId : entries.length ? entries[entries.length - 1].id : null };
  } catch { return null; }
}
export function appendAutosave(a: SaveArchive, progress: ProgressSave, createdAt: number | null): SaveArchive {
  const id = a.entries.reduce((max, e) => Math.max(max, e.id), 0) + 1;
  return { version: 1, activeId: id, entries: [...a.entries, { id, name: saveName(progress), createdAt, progress: { ...progress } }] };
}
export class SluiceWorld {
  x = -2050; y = CHANNEL.near; vx = 0; vy = 0; grounded = true;
  opened = false; fill = 0; checkpoint: Checkpoint = 'reclamation';
  private coyote = .12;
  private buffer = 0;
  get logY() { return CHANNEL.logLow + (CHANNEL.logHigh - CHANNEL.logLow) * this.fill; }
  get waterY() { return this.logY - 17; }
  get canInteract() {
    return !this.opened && this.grounded && Math.abs(this.x - CHANNEL.leverX) < 95 && Math.abs(this.y - CHANNEL.near) < 8;
  }
  interact() { if (!this.canInteract) return false; this.opened = true; return true; }
  jump() { this.buffer = .14; }
  save(): SluiceSave { return { version: 1, checkpoint: this.checkpoint, opened: this.opened }; }
  restore(save: SluiceSave) {
    this.checkpoint = save.checkpoint; this.opened = save.opened; this.fill = save.opened ? 1 : 0;
    this.x = save.checkpoint === 'far-bank' ? 1880 : save.checkpoint === 'sluice' ? 1190 : save.checkpoint === 'reclamation' ? -2050 : save.checkpoint === 'station-exit' ? -980 : save.checkpoint === 'patrol-approach' ? 3080 : save.checkpoint === 'patrol-cleared' ? 3280 : -90;
    this.y = ['far-bank', 'patrol-approach', 'patrol-cleared'].indexOf(save.checkpoint) >= 0 ? CHANNEL.far : CHANNEL.near;
    this.vx = this.vy = this.buffer = 0; this.grounded = true; this.coyote = .12;
  }
  groundAt(x: number) {
    if (x <= CHANNEL.left) return CHANNEL.near;
    if (x >= CHANNEL.right) return CHANNEL.far;
    if (x >= CHANNEL.logLeft && x <= CHANNEL.logRight) return this.logY;
    return CHANNEL.bed;
  }
  step(delta: number, direction: number, running = false) {
    // Substep rather than discard elapsed time; moving platforms and collision share the same clock.
    let remaining = Math.min(Math.max(delta, 0), .25);
    while (remaining > 0) {
      const dt = Math.min(remaining, 1 / 120); remaining -= dt;
      this.tick(dt, direction, running);
    }
  }
  private tick(dt: number, direction: number, running: boolean) {
    const oldLog = this.logY;
    if (this.opened) this.fill = Math.min(1, this.fill + dt / CHANNEL.fillSeconds);
    if (this.grounded && this.x >= CHANNEL.logLeft && this.x <= CHANNEL.logRight && Math.abs(this.y - oldLog) < 2) {
      this.y += this.logY - oldLog;
    }
    this.coyote = this.grounded ? .12 : Math.max(0, this.coyote - dt);
    if (this.buffer > 0 && this.coyote > 0) {
      this.vy = 610; this.grounded = false; this.buffer = this.coyote = 0;
    }
    this.buffer = Math.max(0, this.buffer - dt);
    this.vx += (direction * (running ? 240 : 145) - this.vx) * Math.min(1, dt * 15);
    const previousX = this.x, previousY = this.y;
    let nextX = Math.max(-2350, this.x + this.vx * dt);
    // Solid banks and log sides: feet must clear the top before crossing an edge.
    const walls = [
      { edge: CHANNEL.left, top: CHANNEL.near, right: false },
      { edge: CHANNEL.right, top: CHANNEL.far, right: true },
      { edge: CHANNEL.logLeft, top: this.logY, right: true },
      { edge: CHANNEL.logRight, top: this.logY, right: false },
    ];
    for (const wall of walls) {
      if (this.y >= wall.top - 1) continue;
      if (wall.right && previousX <= wall.edge - 12 && nextX > wall.edge - 12) { nextX = wall.edge - 12; this.vx = 0; }
      if (!wall.right && previousX >= wall.edge + 12 && nextX < wall.edge + 12) { nextX = wall.edge + 12; this.vx = 0; }
    }
    this.x = nextX;
    const surface = this.groundAt(this.x);
    if (this.grounded && Math.abs(this.y - surface) <= 3) this.y = surface;
    else {
      this.grounded = false; this.vy -= 1400 * dt; this.y += this.vy * dt;
      if (this.vy <= 0 && previousY >= surface - 3 && this.y <= surface) {
        this.y = surface; this.vy = 0; this.grounded = true;
      }
    }
    if (this.checkpoint === 'reclamation' && this.grounded && this.x >= -1000) this.checkpoint = 'station-exit';
    if (this.checkpoint === 'station-exit' && this.grounded && this.x >= -200) this.checkpoint = 'forest';
    if (this.checkpoint === 'forest' && this.grounded && this.x >= 1050 && this.x < CHANNEL.left) this.checkpoint = 'sluice';
    if (this.checkpoint === 'sluice' && this.opened && this.grounded && this.x >= CHANNEL.right + 50 && this.y === CHANNEL.far) this.checkpoint = 'far-bank';
    if (this.checkpoint === 'far-bank' && this.grounded && this.x >= 3080) this.checkpoint = 'patrol-approach';
    // A missed landing is a gentle return to shore, without a drowning sequence.
    if (this.y < -500 || (this.opened && this.x > CHANNEL.left && this.x < CHANNEL.right && this.y + 60 < this.waterY)) this.restore(this.save());
  }
}
