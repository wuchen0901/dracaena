# Route elevation and camera safety

The opening forest floor is y=-140. The canal still exits onto its required raised bank at y=40, but `ROAD` in `SluiceWorld.ts` now supplies a continuous descent between x=2050 and x=2650, returning to y=-140 before the inner sentry post. All subsequent ordinary ground stays at -140.

The box segment floor is also -140. Its 205-unit local platform tops out at y=65, then the exterior landing returns to -140. The former high platform and ramp have been replaced by a prison perimeter wall. Thus the puzzle retains its required two-step ascent without building on the canal's height gain. Its geometry remains local and relocatable.

Physics, bank surface drawing, fence/pipe/grass placements and the shelter tree use the shared road height. Patrol checkpoint restoration derives its floor height, so existing archives migrate spatially to the revised map without losing their gate, story or normalized crate state.

`WorldCamera.ts` smooths vertical tracking, then clamps the foot position to -230..150 in the 590-unit clipped viewport. The upper bound leaves room for the full 112-unit action sprite plus headroom. Loading a high checkpoint uses the same guard. Sky and night overlay remain fixed to the viewport.

Verification: 49 tests and TypeScript checks pass, including continuous grounded downhill movement at 30/60/144 FPS, fixed long-distance floor elevation, checkpoint restoration and camera safety on abrupt climbs/descents. Live Cocos preview verified the revised crate segment, two jumps with full character visibility, and descent back to the same main-road elevation. Real phone checks remain unperformed.
