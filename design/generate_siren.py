"""Original soft distant police wail: seamless four-second FM cycle."""
from pathlib import Path
import math
import struct
import wave
rate = 22050
samples = []
for i in range(rate * 4):
    t = i / rate
    phase = 2 * math.pi * 640 * t - 360 * math.cos(2 * math.pi * t / 4)
    samples.append(.34 * math.sin(phase) + .035 * math.sin(phase * 2))
path = Path(__file__).resolve().parents[1] / 'assets/resources/audio/distant-siren.wav'
with wave.open(str(path), 'wb') as out:
    out.setparams((1, 2, rate, 0, 'NONE', 'not compressed'))
    out.writeframes(b''.join(struct.pack('<h', round(v * 32767)) for v in samples))
