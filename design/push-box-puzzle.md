# Movable crate and high maintenance platform

A playable puzzle segment is temporarily placed after the patrol at world origin x=4100. This is a provisional route position, not a final narrative order. There is no level-selection screen or completion overlay.

## Segment and relocation

`assets/scripts/PushBoxSegment.ts` owns the crate, local geometry and dimensions through `PUSH_BOX_LAYOUT`. `PushBoxArt.ts` draws from that same model. The controller injects the segment into `SluiceWorld`, which handles movement and collisions. Tests can instantiate the segment at another origin without changing its mechanics. Move `origin` to reposition the complete box/platform/ramp; if placing it before another story beat, also update the journey checkpoint handoff currently gated on `patrol-cleared`. Reordering the whole narrative still requires updating those story links.

Local dimensions: approach checkpoint x=60, crate center x=310, crate width=110 and height=100, platform starts x=660 and rises 205, platform ends x=960, ramp returns to the floor at x=1260. Floor now returns to the shared forest level at world y=-140. The platform top is y=65, and its exit ramp returns to y=-140. The current jump peak is approximately 133 units, so the platform cannot be reached directly; a jump from the 100-unit crate clears the remaining 105-unit step. Walking jumps suffice.

## Interaction

Walk into the crate to stop against it. Hold E plus left/right to push or pull at 72 units/second. Touch uses the existing hold-interact E button with the directional buttons. Release E to jump normally. Holding interact while jumping does not move the box from above. The crate stays on a flat, bounded track from local x=180 to the platform edge minus half its width, so it cannot fall, overlap the platform or become irretrievable. The low stop and drag marks make the range visible.

The first visual pass uses Cocos Graphics, matching the existing canal structures. The robot now uses a dedicated two-row push/pull atlas, with braced palms while pushing and a backward-stepping pull while facing the box. Scraping audio remains future polish. See `push-pull-animation.md` for animation and contact anchors. The camera follows vertically above y=100 with hard foot-position bounds (-230 to +150 screen units), keeping the whole robot visible even during abrupt climbs; the sky and night veil remain fixed to the viewport.

## Saving

Automatic named records include “旧箱与高台”, “箱子已就位” and “越过旧维护台”. Entering the approach, stopping after moving the box and reaching the safe platform top create recoverable snapshots. Moving frames do not flood the archive. Each box snapshot stores normalized track position and solved status, so moving the segment origin preserves crate placement. Old saves without crate data still load; crate checkpoints require valid crate state. Loading before the puzzle resets the crate, loading a partial puzzle restores its position, and loading completion restores the robot on the safe platform.

## Verification

42 tests pass. New tests cover 30/60/144 FPS push → box jump → platform jump → ramp traversal, inability to bypass by running jumps, reversible pulling and bounds, no pushing from the box top, save restoration/validation and relocation. Cocos TypeScript checking passes. Physics stepping ignores negligible floating-point remainder slices so they cannot zero push velocity on 30 FPS frames.

Live Cocos preview confirmed ordinary walking stops at the crate, holding E moves it to the wall, both jumps reach the platform, completion survives refresh, vertical camera framing is corrected and the named approach save restores the untouched crate. Preview is left at “旧箱与高台” for user testing. Actual multi-touch phone behavior and scraping audio are not verified.
