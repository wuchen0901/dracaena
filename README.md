# The Last Light — layered forest study

Open `assets/Main.scene` in Cocos Creator 3.8.8 and preview Current scene.

## Independent images and nodes

The scene no longer uses a single flattened landscape. `assets/resources/layers/` contains separate PNGs for sky, distant forest, main tree, left tree, ground/cliff, cloud, bird, and foreground foliage. The character uses a transparent 16-frame sprite sheet in `assets/resources/character/actions.png`; the original reference remains in `assets/resources/reference/character.png`.

`PuzzleController.ts` creates one node per element at runtime. The two clouds and two birds reuse their respective image assets but have independent positions and motion. Far forest, trees, ground, and foreground use different parallax factors. Clouds drift; birds fly and gently change silhouette scale. The sky stays fixed. The game frame clips layers cleanly.

## Controls

Use **A/D** or **Left/Right** to walk. Hold **Shift** while moving to run; on-screen arrows and a hold-to-run **RUN** button also work. Press **Space**, **W**, **Up**, or the on-screen **↑** button to jump. At the sluice lever, press **E** or tap the on-screen **E** button once to open the gate. It stays open, and the water and timber rise over seven seconds. Step onto the timber and jump to the far bank; running and timed jumps are unnecessary. You can board while the timber is rising or wait until it stops.

Checkpoints save automatically at the start, before the canal, when the lever opens, and after reaching the far bank. The gate state persists in local storage across reloads. **R** restores the latest safe checkpoint without clearing progress. A missed landing into deep water also returns the character safely to shore, preserving the open gate. Storage failures show a brief status message; in-memory checkpoints still work. The route continues to the right after the puzzle, without a victory screen.

The sprite sheet has four rows: idle, walk, run, and jump, with four frames each. Grounded cycles follow movement speed; jump frames follow takeoff, ascent, apex, and descent. Frames share a fixed canvas and foot anchor, and facing left mirrors the art. The engine slices the sheet into `SpriteFrame` regions at runtime. Prompt and asset details are in `design/character-animation.md`.

## Assets and preservation

The built-in imagegen tool reconstructed separate layers from the provided screenshot; obscured areas were inferred, so the result is not pixel-identical. Transparency is preserved for compositing. Prompts are recorded in `design/layer-prompts.md`.

The prior flat controller is archived in `design/FlatPictureController.ts.txt`, with its original image assets retained in `assets/resources/reference/`. The earlier procedural room is archived in `design/GreenhouseController.ts.txt`.

Runtime-created nodes appear in the running preview. They are not serialized editable layer nodes in the editor's Scene view; layout and speeds are currently defined in `PuzzleController.ts`.


## Sluice prototype and validation

The old cliff-jump demonstration is replaced by an approachable canal puzzle. Forest image layers and character animation are retained; the banks, masonry, gate, lever, guide posts, timber and translucent animated water are drawn with Cocos `Graphics`. These are functional prototype visuals. The earlier push-box opening remains a design document and is not implemented in this scene.

`assets/scripts/SluiceWorld.ts` contains shared terrain geometry, substepped movement, moving-platform support, side collisions and versioned save validation. `PuzzleController.ts` connects that model to rendering, keyboard/touch input, sound and Cocos local storage. An opened save restores with the canal filled, so reloading never requires waiting for the fill animation again. The local checkpoint represents a safe milestone rather than the exact last foot position.

Original sluice-water and gate-creak effects are generated with `python3 design/generate_sluice_audio.py`. Water volume follows proximity and filling state; playback unlocks after keyboard or touch input.

Run `npm test` with Node 22.6+ (TypeScript stripping support). The engine-independent tests exercise walking-speed traversal at 30/60/144 FPS, boarding a rising log, wall collisions, blocked traversal before opening, safe recovery and save validation. For Cocos type checking, use the TypeScript compiler bundled with Creator and `--project tsconfig.json`; open the project in Creator first to generate `temp/tsconfig.cocos.json` and engine declarations.

Preview `assets/Main.scene` in Creator 3.8.8 after refreshing external asset changes. Manual visual, sound and touch-device checks are still needed; command-line tests do not verify those surfaces.
