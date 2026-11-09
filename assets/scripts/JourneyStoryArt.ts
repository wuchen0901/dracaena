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

/** Quiet roadside characters and wildlife placed along the continuous journey. */
export function drawRoadsideCharacters(g: Graphics, camera: number, time: number) {
  g.clear();
  const sx = (x: number) => x - camera;
  const visible = (x: number, margin = 820) => Math.abs(x - camera) < margin;
  const line = (x1: number, y1: number, x2: number, y2: number, color: Color, width = 4) => {
    g.strokeColor = color; g.lineWidth = width; g.moveTo(sx(x1), y1); g.lineTo(sx(x2), y2); g.stroke();
  };
  const rect = (x: number, y: number, w: number, h: number, color: Color) => {
    g.fillColor = color; g.roundRect(sx(x) - w / 2, y, w, h, Math.min(8, h / 3)); g.fill();
  };
  const circle = (x: number, y: number, radius: number, color: Color) => {
    g.fillColor = color; g.circle(sx(x), y, radius); g.fill();
  };
  const human = (x: number, floor: number, coat: Color, skin: Color, crouched = false) => {
    const lean = crouched ? 9 : 0;
    circle(x + lean, floor + 75, 10, skin);
    rect(x, floor + 26, crouched ? 25 : 30, crouched ? 43 : 54, coat);
    line(x - 5, floor + 29, x - 13, floor + 3, coat, 7);
    line(x + 8, floor + 30, x + 17, floor + 4, coat, 7);
  };
  const ground = (x: number) => roadHeight(x);

  // The wanderer carries a tiny living garden through the dry city edge.
  const wanderer = 8580, wf = ground(wanderer);
  if (visible(wanderer)) {
    human(wanderer, wf, new Color(91, 83, 64), new Color(157, 135, 108));
    rect(wanderer - 23, wf + 29, 23, 42, new Color(64, 73, 59));
    line(wanderer - 26, wf + 61, wanderer - 3, wf + 58, new Color(125, 110, 76), 4);
    rect(wanderer + 10, wf + 23, 12, 18, new Color(111, 82, 54));
    line(wanderer + 10, wf + 41, wanderer + 9, wf + 54, new Color(87, 126, 75), 3);
    line(wanderer + 9, wf + 51, wanderer + 2, wf + 58, new Color(113, 157, 88), 3);
    line(wanderer + 9, wf + 50, wanderer + 16, wf + 56, new Color(113, 157, 88), 3);
    // A bundled bedroll and a tin cup make the silhouette read as a traveler.
    line(wanderer - 29, wf + 70, wanderer - 9, wf + 91, new Color(139, 119, 84), 8);
  }

  // A salvage stall made from a torn awning, crate table and carefully sorted scraps.
  const vendor = 9310, vf = ground(vendor);
  if (visible(vendor)) {
    line(vendor - 81, vf + 105, vendor + 74, vf + 105, new Color(73, 67, 53), 5);
    line(vendor - 72, vf + 102, vendor - 52, vf + 153, new Color(83, 76, 58), 4);
    line(vendor + 63, vf + 102, vendor + 44, vf + 153, new Color(83, 76, 58), 4);
    line(vendor - 55, vf + 151, vendor + 47, vf + 151, new Color(117, 92, 61), 10);
    line(vendor - 53, vf + 151, vendor - 37, vf + 128, new Color(110, 78, 58), 3);
    line(vendor - 21, vf + 151, vendor - 3, vf + 131, new Color(137, 128, 94), 4);
    line(vendor + 12, vf + 151, vendor + 32, vf + 130, new Color(71, 105, 87), 4);
    human(vendor + 2, vf, new Color(73, 90, 78), new Color(148, 124, 98), true);
    rect(vendor - 60, vf + 4, 30, 25, new Color(91, 77, 57));
    rect(vendor + 48, vf + 4, 27, 32, new Color(61, 82, 72));
    circle(vendor - 61, vf + 34, 4, new Color(182, 155, 92));
    circle(vendor + 46, vf + 40, 5, new Color(192, 164, 91));
  }

  // The fortune teller reads broken city-sensor patterns through a cracked lens.
  const seer = 11610, sf = ground(seer);
  if (visible(seer)) {
    rect(seer - 4, sf + 3, 55, 18, new Color(62, 65, 54));
    human(seer + 8, sf, new Color(77, 80, 63), new Color(143, 121, 96), true);
    line(seer - 22, sf + 21, seer + 18, sf + 21, new Color(139, 124, 86), 3);
    circle(seer - 14, sf + 30, 5, new Color(196, 166, 91));
    circle(seer + 1, sf + 30, 4, new Color(108, 157, 128));
    circle(seer + 17, sf + 30, 5, new Color(185, 179, 139));
    // A lens and dangling wire point back to the old surveillance network.
    circle(seer + 52, sf + 44, 15, new Color(55, 73, 66));
    circle(seer + 52, sf + 44, 9, new Color(115, 153, 129, 165));
    line(seer + 49, sf + 30, seer + 42, sf + 3, new Color(92, 91, 67), 3);
    line(seer + 42, sf + 3, seer + 58, sf - 1, new Color(92, 91, 67), 3);
  }

  // A street singer plays a salvaged string instrument; the notes are just brief warm glints.
  const singer = 13920, mf = ground(singer), sway = Math.sin(time * 1.6);
  if (visible(singer)) {
    human(singer, mf, new Color(79, 76, 69), new Color(164, 139, 108));
    line(singer + 4, mf + 49, singer + 29 + sway * 3, mf + 63, new Color(164, 139, 108), 5);
    circle(singer + 38, mf + 50, 13, new Color(104, 83, 59));
    circle(singer + 38, mf + 50, 5, new Color(59, 59, 49));
    line(singer + 38, mf + 50, singer + 72, mf + 77, new Color(137, 117, 82), 4);
    for (let i = 0; i < 3; i++) line(singer + 42 + i * 2, mf + 48, singer + 73 + i * 2, mf + 75, new Color(189, 165, 113, 175), 1);
    if (Math.sin(time * 2.2) > .45) {
      circle(singer + 87, mf + 101, 3, new Color(203, 174, 112, 190));
      circle(singer + 101, mf + 118, 2, new Color(203, 174, 112, 155));
    }
  }

  // A wary rooftop cat watches the traveler, keeping its own distance.
  const stray = 10710, cf = ground(stray) + 104;
  if (visible(stray)) {
    rect(stray, ground(stray) + 92, 92, 14, new Color(62, 67, 56));
    g.fillColor = new Color(103, 98, 79); g.ellipse(sx(stray), cf + 10, 25, 11); g.fill();
    circle(stray + 17, cf + 21, 10, new Color(119, 110, 88));
    line(stray + 10, cf + 27, stray + 8, cf + 39, new Color(119, 110, 88), 4);
    line(stray + 23, cf + 27, stray + 25, cf + 39, new Color(119, 110, 88), 4);
    line(stray - 21, cf + 11, stray - 34, cf + 22 + Math.sin(time * 1.2) * 3, new Color(119, 110, 88), 4);
    circle(stray + 20, cf + 22, 1.7, new Color(196, 173, 108));
  }

  // Birds settle on old structures at three points along the route, then lift together.
  const flocks = [
    { x: 8780, y: ground(8780) + 240, count: 3 },
    { x: 12460, y: ground(12460) + 280, count: 4 },
    { x: 16180, y: ground(16180) + 210, count: 3 },
  ];
  for (const flock of flocks) {
    if (!visible(flock.x, 950)) continue;
    for (let i = 0; i < flock.count; i++) {
      const bx = flock.x + i * 27, by = flock.y + Math.sin(time * 1.4 + i * 1.7) * 5;
      const flap = Math.sin(time * 7 + i * 2.1) * 7;
      line(bx - 10, by + flap, bx, by, new Color(44, 52, 46, 220), 3);
      line(bx, by, bx + 10, by + flap, new Color(44, 52, 46, 220), 3);
      circle(bx, by, 2.5, new Color(48, 54, 47, 230));
    }
  }
}
