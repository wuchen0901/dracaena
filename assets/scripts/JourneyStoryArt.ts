import { Color, Graphics } from 'cc';
import { CHANNEL, roadHeight } from './SluiceWorld';

/** Small environmental clues linking the factory, controlled city, and reclaimed wilds. */
export function drawJourneyStoryArt(g: Graphics, camera: number, time: number) {
  g.clear();
  const x = (worldX: number) => worldX - camera;
  const line = (x1: number, y1: number, x2: number, y2: number, color: Color, width = 3) => {
    g.strokeColor = color; g.lineWidth = width; g.moveTo(x(x1), y1); g.lineTo(x(x2), y2); g.stroke();
  };
  const rect = (wx: number, y: number, w: number, h: number, color: Color) => {
    g.fillColor = color; g.rect(x(wx), y, w, h); g.fill();
  };

  // The same camera eye appears first over the factory's robot work line.
  const factoryFloor = CHANNEL.near;
  const factoryCam = -1670;
  if (Math.abs(factoryCam - camera) < 940) {
    const mast = factoryFloor + 255;
    line(factoryCam, factoryFloor, factoryCam + 5, mast, new Color(58, 61, 56), 16);
    line(factoryCam - 5, mast - 34, factoryCam + 62, mast - 34, new Color(58, 61, 56), 12);
    rect(factoryCam + 48, mast - 48, 38, 28, new Color(46, 51, 47));
    g.fillColor = new Color(210, 72, 45, Math.round(165 + 75 * Math.sin(time * 2.1)));
    g.circle(x(factoryCam + 79), mast - 34, 5); g.fill();
    line(factoryCam - 90, factoryFloor + 63, factoryCam + 104, factoryFloor + 63, new Color(67, 65, 54), 5);
    // A narrow moving scan is legible in silhouette without turning into a combat beam.
    const scan = factoryCam + 30 + Math.sin(time * .42) * 72;
    line(scan, mast - 42, scan - 24, factoryFloor + 66, new Color(196, 93, 58, 34), 2);
  }

  // The same eye watches a ration kiosk beside the starving city survivor.
  const cityCam = 9790, cityFloor = roadHeight(cityCam);
  if (Math.abs(cityCam - camera) < 940) {
    const mast = cityFloor + 225;
    line(cityCam, cityFloor, cityCam + 2, mast, new Color(72, 63, 54), 11);
    line(cityCam - 7, mast - 30, cityCam + 48, mast - 30, new Color(72, 63, 54), 9);
    rect(cityCam + 34, mast - 43, 34, 24, new Color(42, 48, 43));
    g.fillColor = new Color(210, 75, 43, Math.round(170 + 65 * Math.sin(time * 1.7 + 1)));
    g.circle(x(cityCam + 59), mast - 31, 4); g.fill();

    const kioskX = 10030, kioskFloor = roadHeight(kioskX);
    // A complete visible exchange: an injured applicant is refused, then a tagged worker is served.
    const phase = time % 14;
    const rejected = phase < 7;
    const approach = Math.min(1, phase / 2);
    const leave = Math.max(0, Math.min(1, (phase - 4.5) / 2));
    const hx = rejected ? kioskX - 110 + approach * 64 - leave * 75 : kioskX - 90 + Math.min(1, (phase - 7) / 2) * 48;
    const skin = new Color(152, 131, 105), coat = new Color(71, 75, 68);
    const bend = rejected ? 12 : 0;
    g.fillColor = skin; g.circle(x(hx + bend), kioskFloor + 91, 9); g.fill();
    line(hx, kioskFloor + 70, hx + bend, kioskFloor + 30, coat, 19);
    line(hx + bend, kioskFloor + 30, hx - 12, kioskFloor + 2, coat, 7);
    line(hx + bend, kioskFloor + 30, hx + 14, kioskFloor + 2, coat, 7);
    const reaching = rejected ? phase > 2 && phase < 4.5 : phase > 9 && phase < 12;
    line(hx + 4, kioskFloor + 67, hx + (reaching ? 42 : 17), kioskFloor + (reaching ? 55 : 35), skin, 6);
    if (rejected) line(hx - 15, kioskFloor + 51, hx - 23, kioskFloor + 2, new Color(121, 105, 82), 4);
    else rect(hx - 5, kioskFloor + 66, 10, 9, new Color(118, 177, 120));
    rect(kioskX, kioskFloor, 70, 83, new Color(68, 65, 57));
    const deciding = rejected ? phase > 2 && phase < 4.5 : phase > 9 && phase < 12;
    if (deciding) {
      const signal = rejected ? new Color(211, 69, 48) : new Color(123, 186, 115);
      rect(kioskX + 3, kioskFloor + 85, 64, 5, signal);
      if (rejected) {
        line(kioskX + 24, kioskFloor + 52, kioskX + 46, kioskFloor + 70, signal, 3);
        line(kioskX + 46, kioskFloor + 52, kioskX + 24, kioskFloor + 70, signal, 3);
      } else {
        rect(kioskX - 15, kioskFloor + 39, 30, 6, new Color(142, 128, 99));
        rect(kioskX - 10, kioskFloor + 45, 19, 12, new Color(191, 163, 110));
      }
    }
    rect(kioskX + 10, kioskFloor + 48, 50, 23, new Color(25, 39, 38));
    // A stale allocation screen: food is gated by assigned labor, even after the system collapses.
    g.strokeColor = new Color(129, 161, 120, 190); g.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      g.moveTo(x(kioskX + 16), kioskFloor + 65 - i * 6);
      g.lineTo(x(kioskX + 16 + (i === 1 ? 8 : 29)), kioskFloor + 65 - i * 6); g.stroke();
    }
    line(kioskX + 8, kioskFloor + 42, kioskX + 62, kioskFloor + 42, new Color(137, 119, 91), 2);
    line(kioskX + 34, kioskFloor + 1, kioskX + 36, kioskFloor - 23, new Color(66, 65, 54), 3);
    line(kioskX + 36, kioskFloor - 23, kioskX + 57, kioskFloor - 28, new Color(66, 65, 54), 3);
  }

  // In the meadow, roots have reached the relay. Its scan loses rhythm and direction.
  const relayX = 15920, relayFloor = roadHeight(relayX);
  if (Math.abs(relayX - camera) < 1000) {
    const mast = relayFloor + 210;
    line(relayX, relayFloor, relayX - 7, mast, new Color(78, 79, 61), 12);
    line(relayX - 7, mast - 21, relayX + 42, mast - 21, new Color(78, 79, 61), 8);
    rect(relayX + 27, mast - 34, 31, 23, new Color(43, 52, 46));
    const pulse = Math.sin(time * 3.7) > .82 ? 30 : Math.round(120 + 95 * Math.sin(time * 1.13));
    g.fillColor = new Color(122, 187, 111, pulse);
    g.circle(x(relayX + 49), mast - 22, 5); g.fill();
    const scanEnd = relayX + 80 + Math.sin(time * .63) * 45;
    line(relayX + 49, mast - 29, scanEnd, relayFloor + 95, new Color(119, 180, 102, 30), 2);
    for (const side of [-1, 1]) {
      line(relayX - 20, relayFloor + 5, relayX + side * 27, relayFloor + 44, new Color(70, 123, 69), 5);
      line(relayX + side * 27, relayFloor + 44, relayX + side * 47, relayFloor + 52, new Color(78, 137, 74), 3);
    }
  }
}
