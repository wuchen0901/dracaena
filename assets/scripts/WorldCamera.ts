/** Shared 2.5D camera geometry; keep elevation, orbit position and backdrop alignment together. */
export const CAMERA_ELEVATION = 10;
export const CAMERA_DISTANCE = 28;
// Frame the walking lane below centre to reduce unused foreground.
export const CAMERA_FOCUS_HEIGHT = 2;
const elevationRadians = CAMERA_ELEVATION * Math.PI / 180;
export const CAMERA_HEIGHT = CAMERA_FOCUS_HEIGHT + CAMERA_DISTANCE * Math.sin(elevationRadians);
export const CAMERA_Z = CAMERA_DISTANCE * Math.cos(elevationRadians);
export function backdropHeight(depth: number) {
  return CAMERA_HEIGHT - (CAMERA_Z - depth) * Math.tan(elevationRadians);
}

/** Fixed 590-unit viewport; reserve room for the full robot above its foot position. */
export function cameraHeight(previous: number, feet: number, dt: number) {
  const target = Math.max(0, feet - 100);
  const smooth = previous + (target - previous) * (1 - Math.exp(-Math.max(0, dt) * 6));
  // Feet remain between -230 and +150, leaving >=145 units above for head/jump art.
  return Math.max(feet - 150, Math.min(feet + 230, smooth));
}
