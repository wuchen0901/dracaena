"""Original synthesized two-bark loop; no external recordings or dependencies."""
from pathlib import Path
import math, random, struct, wave
rate = 22050
rng = random.Random(307)
samples = []
low = 0
for i in range(round(rate * 1.6)):
    t = i / rate
    value = 0
    for start in [.28, .62]:
        u = t - start
        if 0 <= u <= .22:
            envelope = min(1, u / .012) * math.exp(-u * 17) * min(1, (.22 - u) / .02)
            phase = 2 * math.pi * (170 * u - 115 * u * u)
            low = .6 * low + .4 * rng.uniform(-1, 1)
            value += envelope * (.26 * math.sin(phase) + .16 * math.sin(phase * 2) + .09 * math.sin(phase * 3) + .24 * low)
    samples.append(value)
path = Path(__file__).resolve().parents[1] / 'assets/resources/audio/guard-dog-bark.wav'
with wave.open(str(path), 'wb') as out:
    out.setparams((1, 2, rate, 0, 'NONE', 'not compressed'))
    out.writeframes(b''.join(struct.pack('<h', round(max(-1, min(1, s)) * 32767)) for s in samples))
