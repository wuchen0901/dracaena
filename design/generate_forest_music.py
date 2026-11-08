"""Render the original 24-second Glass Garden ambient loop using only Python stdlib."""
from array import array
from pathlib import Path
import math
import wave

RATE = 22050
DURATION = 24
samples = array('f', [0]) * (RATE * DURATION)

def tone(start, duration, midi, gain, pad=False):
    hz = 440 * 2 ** ((midi - 69) / 12)
    count = int(duration * RATE)
    for j in range(count):
        i = int(start * RATE) + j
        if i >= len(samples): break
        t = j / RATE
        attack = min(1, t / (.65 if pad else .025))
        release = min(1, (duration - t) / (1.2 if pad else .5))
        envelope = attack * release * (1 if pad else math.exp(-t * 1.6))
        phase = 2 * math.pi * hz * t
        value = math.sin(phase) + .22 * math.sin(phase * 2) + .07 * math.sin(phase * 3)
        if pad: value *= .92 + .08 * math.sin(2 * math.pi * .18 * t)
        samples[i] += value * envelope * gain

# D minor / B-flat / F / C: warm open voicings, no borrowed recording or melody.
for bar, chord in enumerate([(50,57,65),(46,53,62),(48,57,65),(48,55,64)]):
    for note in chord: tone(bar * 6, 6, note, .055, True)
melody = [(0,74),(2.25,77),(4.5,81),(6.75,79),(9,77),(11.25,74),
          (12.75,72),(15,77),(17.25,79),(18.75,76),(21,72)]
for start, note in melody:
    for delay, gain in [(0,.14),(.3,.035),(.6,.015)]: tone(start+delay, 2, note, gain)
peak = max(abs(v) for v in samples)
pcm = array('h', (int(math.tanh(v / peak * .65) * 32767) for v in samples))
path = Path(__file__).resolve().parents[1] / 'assets/resources/audio/forest-theme.wav'
with wave.open(str(path), 'wb') as out:
    out.setnchannels(1); out.setsampwidth(2); out.setframerate(RATE); out.writeframes(pcm.tobytes())
print(f'{path}: {DURATION}s, {RATE}Hz, peak={max(abs(v) for v in pcm)}, loop endpoints={pcm[0]},{pcm[-1]}')
