"""Original seamless machinery and warning loops, using the Python standard library."""
from pathlib import Path
import math
import struct
import wave
RATE = 22050
ROOT = Path(__file__).resolve().parents[1] / 'assets/resources/audio'
def write(name, samples):
    with wave.open(str(ROOT / name), 'wb') as out:
        out.setparams((1, 2, RATE, 0, 'NONE', 'not compressed'))
        out.writeframes(b''.join(struct.pack('<h', round(max(-1, min(1, s)) * 32767)) for s in samples))
machine, alarm = [], []
for i in range(RATE * 6):
    t = i / RATE
    pulse = (.5 + .5 * math.cos(2 * math.pi * t)) ** 18
    if i < RATE * 4:
        machine.append(.13 * math.sin(2 * math.pi * 55 * t) + .07 * math.sin(2 * math.pi * 110 * t) + pulse * .12 * math.sin(2 * math.pi * 173 * t))
    phase = t % 6
    gate = sum(math.sin(math.pi * (phase - start) / .2) for start in (.14, .49, .84) if start <= phase < start + .2)
    alarm.append(gate * (.23 * math.sin(2 * math.pi * 660 * t) + .09 * math.sin(2 * math.pi * 880 * t)))
write('reclamation-machinery.wav', machine)
write('reclamation-alarm.wav', alarm)
