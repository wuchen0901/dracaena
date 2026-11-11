# Old maintenance robot

The campaign protagonist uses `assets/resources/models/last-light-robot-detailed.glb`, based on the detailed robot model in the project root. The imported model has a 13-joint glTF skeleton with rigid per-part skin weights. `Robot3D` drives its head, torso, arms and legs from the existing movement state; the procedural low-poly actor remains as the fallback while the model loads and for distant robot characters.

The earlier 2D character atlas `assets/resources/character/robot-actions.png` is retained for the legacy sprite preview. It uses eight columns and four rows: idle, walk, run, jump/landing. The prior human atlases are preserved.

Direction: a quiet, lonely, hopeful mechanical world reclaimed by nature. A small maintenance robot has aged ivory plating, grey joints, amber eyes and a warm chest lamp. Its old maintenance assignment is a story proposal, not finalized plot.

The controller loads the robot atlas directly without briefly displaying the old human reference. Foot anchors are visually estimated for this atlas and need in-engine review. Existing motion timing and physics apply.

## Generation prompt

Use case: stylized-concept. Production transparent 2D game sprite atlas, wide 2:1 aspect ratio, EXACTLY 8 equal columns and 4 equal rows, 32 full body poses. A small old maintenance robot in a lonely hopeful forest reclaimed industrial world. Rounded ivory weathered metal shell, grey articulated limbs, small rounded rectangular head with dark faceplate and two understated amber eyes, one warm amber chest lamp, subtle rust and repair seams. Charming quiet curious personality, compact proportions, painterly softly shaded game art, readable silhouette. Every pose faces RIGHT in side view, same robot same scale and centered pelvis, generous cell padding, feet baseline 94% cell height. Row 1 eight subtle idle poses; row 2 eight ordered walking phases alternating contacts, passing and down/up; row 3 eight running phases with alternating contacts and flight; row 4 launch, early ascent, ascent, apex tuck, early descent, descent extension, landing compression, recovery. True transparent background. No ground shadows, no floor, no text, no grid lines, no decorations. Exactly eight poses each row and four rows.
