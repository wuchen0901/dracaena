/** A patrol encounter: movement stays available; exposure before departure is fatal. */
export class SearchEscape {
  elapsed = 0;
  started = false;
  cleared = false;
  caught = false;
  get active() { return this.started && !this.cleared && !this.caught; }
  get departure() { return this.cleared ? 1 : Math.max(0, Math.min(1, (this.elapsed - 4) / 3)); }
  step(dt: number, inCover: boolean, reachedCover = inCover) {
    if (this.cleared || this.caught) return;
    if (!this.started && reachedCover) this.started = true;
    if (!this.active) return;
    // Exposure wins over a timer expiring on the same frame.
    if (!inCover) { this.caught = true; return; }
    this.elapsed = Math.min(7, this.elapsed + Math.max(0, Math.min(dt, .25)));
    if (this.elapsed >= 7) this.cleared = true;
  }
  reset() { this.elapsed = 0; this.started = false; this.cleared = false; this.caught = false; }
}
