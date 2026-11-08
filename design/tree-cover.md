# Automatic shelter under the tree

At x=3160–3410, the grounded robot automatically crouches beside the tree at x=3280. Left/right input remains active at half walking speed. Releasing movement holds the crouch. Entering cover starts four seconds of waiting followed by three seconds of patrol departure.

Leaving either edge or jumping out of cover before the patrol fully leaves causes failure. Exposure is checked after movement, before advancing the safe timer. Jumping over the entry also counts as exposure. Failure freezes player movement and shows “被警察抓住了” with an R/touch retry action. Loading the latest save returns to the automatic checkpoint just before the tree, resets the unfinished encounter, and preserves the sluice puzzle. Staying in cover until departure completes allows safe movement onward and standing up.

Completed escape state persists separately in local storage. Returning to the tree after success does not replay the patrol. Police accelerate rightward during departure and the siren fades to silence.

Depth order is distant police, shelter tree, then robot. The robot crouches on the viewer-facing side of the trunk, remaining visible to the player while the trunk separates it from the police. Exposure triggers the caught/failure state; there is no physical arrest animation.

`assets/resources/character/robot-cover.png` is an eight-frame transparent atlas produced with the built-in imagegen tool using the existing robot atlas as reference. Four lowering/holding frames and four crouch-walking phases share the existing 102-unit canvas. Foot anchors are visually estimated. The tree uses Cocos Graphics, consistent with the current procedural scenery pass.

TypeScript checking and 25 tests pass, including cover transitions at 30/60/144 FPS, holding still, moving out, jumping and reset. In-engine visual review is still required for the new atlas, viewer-facing cover placement and foot alignment.

## Generation prompt

Create a production transparent sprite atlas for this SAME old ivory maintenance robot, amber eyes and chest lamp, backpack, grey joints, same painterly style. Exactly 4 columns and 2 rows, eight equal square cells, no text or grid. All right-facing side view, same head/body scale as reference, constant feet baseline 94% cell height and generous padding. Row 1: standing upright; halfway lowering with bent knees; deep crouch with knees fully folded and head lowered; same deep crouch holding still. Row 2: FOUR sequential crouch-walking phases, knees bent deeply, back hunched, head low, alternating feet. Crouch height around 65% standing height. Full body in every cell, actual transparent background, no floor/shadows. Preserve robot identity and proportions, do not shrink the whole robot for crouching.

Regression fix: crouching and the patrol countdown now share `TreeCover.contains`, including both edges of the cover range. Stopping at the first crouched position therefore completes the encounter instead of waiting indefinitely for the old narrow center trigger.

The former replay shortcut was removed in favor of automatic safe checkpoints before/after this encounter and the shared pause-menu load action. See `autosave.md`.
