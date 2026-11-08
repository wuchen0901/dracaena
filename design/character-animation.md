# Current robot idle correction

The robot now holds the first idle atlas cell instead of cycling eight inconsistently aligned silhouettes. Breathing is a 3.6-second vertical scale cycle from 1.000 to 1.006 around the existing foot anchor; horizontal scale, position and facing stay fixed. Walking, running, jumping, cover and push/pull retain their own animations and use normal scale. Pause stops animation time.

50 tests and Cocos TypeScript checking pass. The idle regression test checks one stable pose and bounded breathing at 30/60/144 FPS, plus reset and movement transitions. Live preview verification was attempted but the browser control connection became unavailable after refresh (debugger unattached), so visual confirmation remains pending.

The earlier atlas notes below describe historical assets and behavior.

---

# Character actions: smoother 32-frame atlas

The current atlas is `assets/resources/character/actions-smooth.png`: 1774 × 887 RGBA, eight columns and four rows. Created with the built-in imagegen tool using the prior atlas and original character as identity references. The previous `actions.png` remains unchanged.

Rows, left to right:

1. Eight subtle idle/breathing poses.
2. Eight walk phases: contact, down, passing, up, opposite contact, down, passing, up.
3. Eight run phases: contact, compression, passing, flight, opposite contact, compression, passing, flight.
4. Launch, early ascent, ascent, apex, early descent, descent, landing compression, recovery.

`CharacterAnimation.ts` selects frames independently of Cocos. Idle plays six poses per second, walk sixteen at 145 units/second and run twenty-four at 240 units/second. These are animation pose rates, not the game's rendering frame rate. Walk/run retain a shared normalized gait phase instead of restarting at each speed transition. Threshold hysteresis avoids row flicker during acceleration. Landing plays for approximately 0.14 seconds and can be interrupted immediately by a new jump.

Atlas dimensions are not exact multiples of the grid. Runtime cell edges are rounded consistently to whole pixels, rather than sampling fractional pixels across adjacent cells. Foot anchors are measured from each cell's visible alpha bounds (alpha >= 64). Run flight uses the contact baseline so both feet can naturally leave the floor. The 102 × 102 scene canvas and physics collision geometry stay independent of these visual anchors.

## Generation prompt

Use case: stylized-concept. Production transparent 2D game sprite atlas. Use the existing atlas and original character as identity/style references. Preserve the black-haired boy, cream short-sleeve tunic, dark sash, loose dark trousers and boots, painterly anime rendering and proportions. Wide 2:1 image, ideally 2048 × 1024. Exactly eight equal columns and four equal rows; one full-body right-facing pose per cell. Same scale, fixed camera, common pelvis position, generous padding, boots on a common 94-percent baseline. Row 1: eight idle breathing phases. Row 2: eight ordered walk phases with alternating foot contacts and counter-swinging arms. Row 3: eight ordered run phases with compression, passing and flight, bent elbows and modest forward lean. Row 4: launch, early ascent, ascent, apex tuck, early descent, extension, landing compression and recovery. Seamless loops. Actual transparency; no floor, shadow, grid, labels, new clothing, equipment or effects. Prioritize coherent neighboring poses and fixed character scale.

## Validation boundaries

- Atlas inspected: four rows with eight visible poses, original character identity retained, alpha preserved.
- Animation tests cover all looping frames, preserved gait phase, hysteresis, six airborne phases, two landing poses, jump interruption, reset and 30/60/144 FPS timing.
- Existing sluice traversal tests remain in the suite; physics is unchanged.
- In-engine appearance, sound and touch-device feel require manual preview. The older validation below describes the previous atlas only.

---

# Previous 16-frame atlas

Generated with the built-in imagegen tool, using `assets/resources/reference/character.png` as the identity/style reference. Final selected asset: `assets/resources/character/actions.png` (1254 × 1254 RGBA, 4 × 4 equal cells). The original reference is preserved. A cleanup variant was reviewed but not selected; the apparent saturated fringe pixels in the selected sheet have negligible alpha (1–3 out of 255) and are not visible in the game preview.

Rows, read left to right:

1. Four idle/breathing poses.
2. Four walk cycle poses: contact, passing, opposite contact, opposite passing.
3. Four run cycle poses: contact, flight, opposite contact, opposite flight.
4. Takeoff, ascent, apex, descent.

The runtime derives fractional cell dimensions from the actual texture size rather than assuming the requested output resolution. All frames use a 102 × 102 scene-unit canvas and a shared foot anchor. The jump row is selected from vertical velocity instead of looping. Walking targets 145 units/second and running 240 units/second; a running jump near the edge crosses the gap.

## Final selected image prompt

Use case: stylized-concept. Create ONE production game sprite sheet matching the reference character exactly: same young boy, black medium hair, cream short-sleeved tunic with dark belt and loose dark trousers and boots, painterly anime forest-game style. True transparent background. Sheet is square 2048x2048 with EXACTLY 4 columns and 4 rows of equal 512x512 cells, no lines, labels, text or decorations. Every cell contains one full-body right-facing side-view boy at identical scale, centered horizontally, feet baseline at 90 percent cell height. Keep all poses inside cell with generous padding, no overlapping cells. Row 1: 4 subtle standing idle/breathing poses. Row 2: 4 ordered walking cycle poses (right leg contact, passing, left leg contact, passing opposite). Row 3: 4 ordered RUNNING cycle poses, distinctly wider strides, bent elbows, forward lean (contact, flight, opposite contact, opposite flight). Row 4: 4 ordered jump poses: takeoff pushing upwards with arms rising; rising with bent knees; apex tucked legs and spread arms; falling with legs extending for landing. Jump poses remain centered on the same baseline (game physics handles vertical motion). Preserve face hair clothing body proportions and painting style of reference. Exactly sixteen clearly different full-body poses. No shadows or floor, actual alpha background.

## Validation

- Cocos Creator 3.8.8 declarations: strict TypeScript check passed.
- Controller simulation: all 16 frame selections, all four jump phases, walking/running speeds, reset, and a running jump across the gap passed.
- Existing Cocos browser preview: new sheet imported and rendered; walking moved the character and jumping visibly selected the bent-knee airborne pose. No browser warning/error logs were reported during inspection.

The older `preview/` greenhouse demo is separate from the current Cocos forest scene and retains its procedural character.
