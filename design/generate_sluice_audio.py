"""Deterministic original water loop and gate creak; Python standard library only."""
from pathlib import Path
import math
import random
import struct
import wave

ROOT = Path(__file__).resolve().parents[1] / 'assets/resources/audio'
RATE = 22050

def write(name, samples):
    with wave.open(str(ROOT / name), 'wb') as output:
        output.setparams((1, 2, RATE, 0, 'NONE', 'not compressed'))
        output.writeframes(b''.join(struct.pack('<h', int(max(-1, min(1, v)) * 32767)) for v in samples))

def generate():
    rng = random.Random(704)
    # Crossfade two ends of filtered noise for a click-free repeating stream.
    fade = RATE // 4
    size = RATE * 4
    low = 0
    water = []
    for i in range(size + fade):
        noise = rng.uniform(-1, 1)
        low = .93 * low + .07 * noise
        t = i / RATE
        water.append(.65 * low + .12 * noise + .025 * math.sin(t * 47 + 2 * math.sin(t * 9)))
    for i in range(fade):
        mix = i / fade
        water[i] = water[size + i] * (1 - mix) + water[i] * mix
    write('sluice-water.wav', water[:size])
    creak = []
    low = 0
    for i in range(int(RATE * 1.4)):
        t = i / RATE
        low = .88 * low + .12 * rng.uniform(-1, 1)
        envelope = min(1, t * 15) * max(0, 1 - t / 1.4) ** 1.3
        creak.append(envelope * (.23 * math.sin(2 * math.pi * (75 * t + 12 * t * t) + 2 * math.sin(t * 24)) + .35 * low))
    write('sluice-lever.wav', creak)

if __name__ == '__main__':
    generate()
