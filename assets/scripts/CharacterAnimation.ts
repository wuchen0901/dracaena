/** Sprite timing independent of rendering and physics; walk/run share one gait phase. */
export const CHARACTER_COLUMNS = 8;
export const CHARACTER_ROWS = 4;
// Visible foot baselines measured at alpha >= 64; run flight keeps the contact baseline.
export const CHARACTER_FOOT_ANCHORS = [0.022523, 0.022523, 0.031532, 0.036036, 0.036036, 0.022523, 0.022523, 0.022523, 0.013514, 0.013514, 0.009009, 0.018018, 0.027027, 0.018018, 0.018018, 0.018018, 0.036199, 0.036199, 0.036199, 0.036199, 0.036199, 0.036199, 0.036199, 0.036199, 0.022523, 0.027027, 0.099099, 0.261261, 0.117117, 0.027027, 0.027027, 0.027027];
export type CharacterMotion = 'idle' | 'walk' | 'run' | 'jump' | 'land';

export class CharacterAnimation {
  motion: CharacterMotion = 'idle';
  private gaitPhase = 0;
  private idlePhase = 0;
  private wasGrounded = true;
  private landingTime = 0;
  private airTime = 0;

  reset() {
    this.motion = 'idle'; this.gaitPhase = this.idlePhase = this.landingTime = this.airTime = 0;
    this.wasGrounded = true;
  }

  frame(delta: number, velocity: number, verticalVelocity: number, grounded: boolean) {
    const dt = Math.min(Math.max(delta, 0), .25), speed = Math.abs(velocity);
    if (!grounded) {
      this.airTime += dt; this.landingTime = 0; this.wasGrounded = false; this.motion = 'jump';
      const pose = verticalVelocity > 520 ? 0 : verticalVelocity > 350 ? 1 :
        verticalVelocity > 80 ? 2 : verticalVelocity > -80 ? 3 : verticalVelocity > -320 ? 4 : 5;
      return 3 * CHARACTER_COLUMNS + pose;
    }
    if (!this.wasGrounded && this.airTime > .1) this.landingTime = .14;
    this.wasGrounded = true; this.airTime = 0;
    if (this.landingTime > 0) {
      this.motion = 'land';
      const pose = this.landingTime > .07 ? 6 : 7;
      this.landingTime = Math.max(0, this.landingTime - dt);
      return 3 * CHARACTER_COLUMNS + pose;
    }
    // Hysteresis prevents noisy speeds flickering between adjacent rows.
    const moving = speed > (this.motion === 'idle' ? 8 : 4);
    if (!moving) {
      this.motion = 'idle'; this.idlePhase = (this.idlePhase + dt * .75) % 1;
      return Math.floor(this.idlePhase * CHARACTER_COLUMNS);
    }
    const running = speed > (this.motion === 'run' ? 165 : 185);
    this.motion = running ? 'run' : 'walk';
    const cycles = running ? 3 * speed / 240 : 2 * speed / 145;
    this.gaitPhase = (this.gaitPhase + dt * cycles) % 1;
    return (running ? 2 : 1) * CHARACTER_COLUMNS + Math.floor(this.gaitPhase * CHARACTER_COLUMNS);
  }
}
