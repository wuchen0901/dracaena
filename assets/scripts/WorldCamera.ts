/** Fixed 590-unit viewport; reserve room for the full robot above its foot position. */
export function cameraHeight(previous: number, feet: number, dt: number) {
  const target = Math.max(0, feet - 100);
  const smooth = previous + (target - previous) * (1 - Math.exp(-Math.max(0, dt) * 6));
  // Feet remain between -230 and +150, leaving >=145 units above for head/jump art.
  return Math.max(feet - 150, Math.min(feet + 230, smooth));
}
