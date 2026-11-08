import { Color, Graphics } from 'cc';

/** Background vignette: local silhouettes and lights, never collision geometry. */
export function drawNightSearch(g: Graphics, camera: number, time: number, night: number) {
  g.clear();
  const base = (3500 - camera) * .55;
  const rect = (x: number, y: number, w: number, h: number, color: Color) => {
    g.fillColor = color; g.rect(base + x, y, w, h); g.fill();
  };
  const circle = (x: number, y: number, r: number, color: Color) => {
    g.fillColor = color; g.circle(base + x, y, r); g.fill();
  };
  const dark = new Color(20, 32, 40, Math.round(255 * night));
  // A distant service road above the playable bank.
  rect(-340, 100, 900, 7, new Color(47, 60, 66, Math.round(150 * night)));
  for (const x of [0, 240]) {
    rect(x - 46, 112, 96, 20, dark); rect(x - 24, 132, 48, 17, dark);
    rect(x - 19, 135, 36, 10, new Color(90, 117, 127, Math.round(100 * night)));
    circle(x - 28, 111, 9, dark); circle(x + 29, 111, 9, dark);
    rect(x - 37, 122, 76, 4, new Color(148, 159, 160, Math.round(100 * night)));
    for (let side = 0; side < 2; side++) {
      const pulse = Math.pow(Math.max(0, Math.sin(time * 5 + side * Math.PI + x)), 3) * night;
      const rgb = side ? [80, 145, 255] : [255, 70, 65];
      for (const radius of [32, 19, 8]) circle(x - 8 + side * 16, 151, radius, new Color(rgb[0], rgb[1], rgb[2], Math.round(pulse * 22)));
      rect(x - 14 + side * 16, 148, 12, 5, new Color(rgb[0], rgb[1], rgb[2], Math.round(230 * pulse)));
    }
  }
  for (let i = 0; i < 3; i++) {
    const x = -120 + i * 185 + Math.sin(time * .22 + i) * 28;
    const y = 108;
    circle(x, y + 35, 5, dark); rect(x - 4, y + 14, 8, 17, dark);
    g.strokeColor = dark; g.lineWidth = 3;
    g.moveTo(base + x, y + 15); g.lineTo(base + x - 5, y); g.moveTo(base + x, y + 15); g.lineTo(base + x + 6, y);
    g.moveTo(base + x, y + 25); g.lineTo(base + x + 13, y + 22); g.stroke();
    const angle = -.3 + Math.sin(time * .38 + i * 2) * .65;
    const sx = base + x + 13, sy = y + 22;
    for (let band = 0; band < 3; band++) {
      const spread = .09 + band * .045, length = 155 + band * 22;
      g.fillColor = new Color(213, 229, 206, Math.round(night * (12 - band * 3)));
      g.moveTo(sx, sy); g.lineTo(sx + Math.cos(angle - spread) * length, sy + Math.sin(angle - spread) * length);
      g.lineTo(sx + Math.cos(angle + spread) * length, sy + Math.sin(angle + spread) * length); g.close(); g.fill();
    }
    circle(x + 13, y + 22, 2, new Color(235, 235, 206, Math.round(220 * night)));
  }
}
