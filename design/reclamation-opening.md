# Reclamation station escape

The playable journey now starts at x=-2050 in an operating robot reclamation station. Three darkened copies of the same robot stand beside the lit protagonist. A conveyor and oscillating dismantling tool establish the threat. The player keeps normal movement/jump control throughout; no exposition dialog or cutscene is required.

The maintenance shutter at x=-1100 is partially raised, exposing the existing forest. The warning lamp and original alarm activate once the robot passes x=-1040. Machinery hum fades with distance, and the alarm fades out before the canal. Fence fragments at x=-830 through -160 leave a pedestrian gap. Walking to x=-200 automatically advances the checkpoint to the existing forest; water-gate and police encounters follow unchanged.

New saves use the added `reclamation` checkpoint under the existing version-1 save format. Existing forest/sluice/far-bank saves still load their prior positions. P or the “重玩开场” touch label restarts at reclamation, resetting canal, escape completion and night atmosphere. T still replays the police encounter independently.

The first art pass uses Cocos Graphics for station architecture, conveyor, shutter, fence and lamp, plus the existing robot atlas tinted dark for inactive robots. Audio sources: `design/generate_reclamation_audio.py`, producing machinery and alarm WAV loops using only the Python standard library. Audio is gesture-unlocked, distance-mixed and stopped on component destruction.

Validation: TypeScript checking and 27 tests pass. New tests cover fresh start, traversal at 30/60/144 FPS, checkpoint persistence, left boundary and compatibility with old forest saves. Live Cocos browser preview was used to walk from the holding area through the maintenance door and fence into the forest, then return to the opening via the touch replay label. Sound mixing and mobile device behavior still need listening/device review. The browser is left at the holding area for user review.
