# Character actions

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
