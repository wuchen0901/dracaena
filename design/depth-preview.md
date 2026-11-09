# 2.5D campaign migration

The normal Creator preview URL (`http://localhost:7456/`) now runs the campaign with a real perspective camera elevated 10 degrees above Z. The original `SluiceWorld` and segment classes still own movement, collisions, interactions and checkpoint state. The player stays on the Z = 0.65 gameplay plane; X is progress and Y is elevation/jumping.

`World25D.ts` renders the complete existing route: factory alarm and copies on the conveyor, forest/sluice and rising log, cover and guard post, salvage batch line, prison crate and wall, cat rescue and dog gap, police search, pressure bridge, ferry, ruined-city stories and garden switches. `Actors3D.ts` builds articulated robot, dog and kitten meshes. Walk/run, jump, pushing/pulling, automatic cover and sitting in the boat use joint poses. These procedural models are a first art pass, not imported final character assets.

Ground and water are horizontal XZ surfaces, with slopes and interruptions matching the campaign geometry. Moving prop meshes share positions and dimensions with the simulation. Original vector scene details are converted to batched meshes by `WorldGeometry.ts`; large underground cutaway panels are omitted. Authored paintings remain distant backdrop cards. World prompts and plaques project into the separate UI canvas; pause, retry, music, touch controls and save history continue using the existing controller.

The dog's visual Z approach is derived from its encounter distance: it reaches the player's plane before it can catch them. This preserves the existing encounter's collision rules; it is not unrestricted 3D navigation/pathfinding.

## Entry points

- `/`: campaign and existing autosaves, now using 2.5D rendering.
- `/?view=2d`: old campaign renderer, for comparison.
- `/?view=demo`: original isolated camera/depth experiment.
- `/?preview=factory`, `forest`, `sluice`, `patrol`, `reveal`, `crate`, `dog`, `police`, `press`, `river`, `city`, `garden`, `water`, `signal`: isolated campaign section previews. These load the real simulation but do not write save history.

Controls remain A/D or arrows, Shift to run, Space/W/Up to jump, E to interact or hold while pushing/pulling, R to restore, Escape for pause/save loading. On-screen controls remain available.

## Validation

Creator TypeScript compilation passes. The suite has 64 tests: 57 pass, including six new opening-boundary checks. Seven existing save-history/dog-fixture failures remain; all seven also fail on the unmodified HEAD baseline (which had 50 passes and eight failures). The opening left bound was corrected from -2350 to -3750 so its current -3550 spawn no longer teleports on the first simulation tick, and the opening fixture was updated to that coordinate range. Browser validation is recorded separately from these automated checks; phone performance, full campaign playthrough and production builds are not established by section previews.

Live browser checks: factory clones/conveyor and fixed spawn, city crate completion, sluice lever/log rise, dog failure/retry and cat perch, pressure-bridge section, and ferry seating were inspected. Factory actor instancing reduced the observed draw count from approximately 227 to 30 and recovered approximately 59 FPS on the current desktop; this is not a phone benchmark.

Final browser checks also covered pause/save-history overlays, loading an existing sluice save into 2.5D, the garden power-switch indicator turning green, and the normal URL restoring the existing campaign progress with no new console warnings/errors. The 3D campaign does not load the legacy character/dog/cat sprite atlases or forest layer images; those remain available to the 2D comparison renderer.
