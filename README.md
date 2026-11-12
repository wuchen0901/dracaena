# The Last Light — 2.5D puzzle adventure

Open `assets/Main.scene` in Cocos Creator 3.8.8 and preview Current scene.

## Current 2.5D campaign

The normal preview now uses a real perspective camera at a 10-degree elevation, horizontal ground/water surfaces, and articulated 3D robot, dog and kitten models. The player moves along X, jumps along Y, and stays on a fixed Z plane. The full existing campaign simulation, interactions, touch controls, audio and autosave history drive the new renderer. Procedural models are the initial art pass; distant paintings and converted vector details preserve the existing scenes.

Use `?view=2d` to compare the original rendering, `?view=demo` for the initial depth experiment, or `?preview=city` (and other named sections) to inspect a section without writing saves. Architecture and validation boundaries: [2.5D migration](design/depth-preview.md).

On 2026-11-12 the detailed robot model and the three robot sprite sheets were deleted. The campaign robot is now the built-in procedural actor from `assets/scripts/Actors3D.ts`; `?view=2d` and `?view=demo` still open but no longer draw a robot.

## Earlier 2D image layers

The scene no longer uses a single flattened landscape. `assets/resources/layers/` contains separate PNGs for sky, distant forest, main tree, left tree, ground/cliff, cloud, bird, and foreground foliage. The character used a transparent 32-frame sprite sheet (`actions-smooth.png`, earlier `actions.png`) made from a reference image; those three files were deleted on 2026-11-12 because nothing loads them any more.

`PuzzleController.ts` creates one node per element at runtime. The two clouds and two birds reuse their respective image assets but have independent positions and motion. Far forest, trees, ground, and foreground use different parallax factors. Clouds drift; birds fly and gently change silhouette scale. The sky stays fixed. The game frame clips layers cleanly.

## Controls

Use **A/D** or **Left/Right** to walk. Hold **Shift** while moving to run; on-screen arrows and a hold-to-run **RUN** button also work. Press **Space**, **W**, **Up**, or the on-screen **↑** button to jump. At the sluice lever, press **E** or tap the on-screen **E** button once to open the gate. It stays open, and the water and timber rise over seven seconds. Step onto the timber and jump to the far bank; running and timed jumps are unnecessary. You can board while the timber is rising or wait until it stops.

Checkpoints save automatically at the start, before the canal, when the lever opens, and after reaching the far bank. The gate state persists in local storage across reloads. **R** restores the latest safe checkpoint without clearing progress. A missed landing into deep water also returns the character safely to shore, preserving the open gate. Storage failures show a brief status message; in-memory checkpoints still work. The route continues to the right after the puzzle, without a victory screen.

In the earlier 2D comparison renderer, the sprite sheet has four rows of eight poses: idle, walk, run, and jump/landing. At normal movement speeds, walk displays 16 poses per second and run 24, retaining the same two/three gait cycles per second. Walk/run transitions preserve foot phase and use speed hysteresis; jump poses follow vertical motion, followed by two short landing poses. Per-frame foot anchors reduce baseline jitter while run flight frames can lift both feet. The engine slices rounded pixel cell boundaries at runtime. Prompt and asset details are in `design/character-animation.md`.

## Assets and preservation

The built-in imagegen tool reconstructed separate layers from the provided screenshot; obscured areas were inferred, so the result is not pixel-identical. Transparency is preserved for compositing. Prompts are recorded in `design/layer-prompts.md`.

The prior flat controller is archived in `design/FlatPictureController.ts.txt`, with its background image retained in `assets/resources/reference/` (the character reference image was deleted on 2026-11-12). The earlier procedural room is archived in `design/GreenhouseController.ts.txt`.

Runtime-created nodes appear in the running preview. They are not serialized editable layer nodes in the editor's Scene view; layout and speeds are currently defined in `PuzzleController.ts`.

## Music

An original 24-second ambient loop combines sustained chords and a sparse bell melody. It starts after the first keyboard or touch interaction to respect browser audio restrictions. Press **M** or use the **M · MUSIC ON/OFF** button to fade the music out or back in. The loop continues through character resets.

Audio: `assets/resources/audio/forest-theme.wav`. Playback: `assets/scripts/ForestMusic.ts`. The standard-library synthesis source is `design/generate_forest_music.py`; rerun it with Python 3 to regenerate the same original loop.


## Sluice prototype and validation

The old cliff-jump demonstration is replaced by an approachable canal puzzle. Forest image layers and character animation are retained; the banks, masonry, gate, lever, guide posts, timber and translucent animated water are drawn with Cocos `Graphics`. These are functional prototype visuals. The earlier push-box opening remains a design document and is not implemented in this scene.

`assets/scripts/SluiceWorld.ts` contains shared terrain geometry, substepped movement, moving-platform support, side collisions and versioned save validation. `PuzzleController.ts` connects that model to rendering, keyboard/touch input, sound and Cocos local storage. An opened save restores with the canal filled, so reloading never requires waiting for the fill animation again. The local checkpoint represents a safe milestone rather than the exact last foot position.

Original sluice-water and gate-creak effects are generated with `python3 design/generate_sluice_audio.py`. Water volume follows proximity and filling state; playback unlocks after keyboard or touch input.

Run `npm test` with Node 22.6+ (TypeScript stripping support). The engine-independent tests exercise walking-speed traversal at 30/60/144 FPS, boarding a rising log, wall collisions, blocked traversal before opening, safe recovery and save validation. For Cocos type checking, use the TypeScript compiler bundled with Creator and `--project tsconfig.json`; open the project in Creator first to generate `temp/tsconfig.cocos.json` and engine declarations.

Preview `assets/Main.scene` in Creator 3.8.8 after refreshing external asset changes. Manual visual, sound and touch-device checks are still needed; command-line tests do not verify those surfaces.

## Reclamation opening

A fresh journey starts in the robot reclamation holding area before the forest. Walk right past inactive robots, underneath a partially raised maintenance shutter, and through a gap in the perimeter fence. Crossing the exit activates a warning lamp and alarm; station machinery and alarm fade with distance. The forest checkpoint then connects to the existing canal and later patrol encounter.

Progress saves automatically at safe milestones, including the station exit and both sides of the patrol encounter. Opening the game resumes the latest save. Press **Esc** or tap **暂停** for Continue and Load saves; **R** loads the newest save. The load menu lists all named automatic saves newest first with timestamps and pagination; selecting an older save preserves newer history. The former P/T scene-replay controls have been removed. See `design/autosave.md` for persistence and recovery details.

## Push-box puzzle segment

A provisional puzzle follows the patrol: hold **E** plus left/right to push or pull a crate beneath a prison perimeter wall, release E, jump onto the crate and then onto the platform. Touch supports holding the E/interact button while using the movement buttons. Ordinary walking does not move the crate. Drop down on the far side to escape; the exterior has no ramp.

Placement and dimensions live in `assets/scripts/PushBoxSegment.ts`; the drawing and collision use that shared geometry. Named autosaves retain partial box placement and completion. Load **监狱围墙 · 旧木箱** to try the puzzle from its approach. See `design/push-box-puzzle.md` for relocation, save behavior and validation boundaries.

Dedicated push/pull animation used `assets/resources/character/robot-push-pull.png` (deleted on 2026-11-12). While gripping, the robot faces the crate, braces both hands for pushing and steps backward for pulling. Animation timing and contact anchors are documented in `design/push-pull-animation.md`.

The raised canal bank now descends back to the opening forest floor before the patrol. The prison wall is a local obstacle and the outside landing returns to that same floor; elevation does not accumulate across the route. Vertical camera bounds preserve headroom during jumps and high-platform loads.

## Guard dog pursuit

After the prison wall, a guard dog chases from behind. Continue right and jump across the broken path; a normal walking jump is sufficient. The dog stops at the near edge and barks, while the route continues at the same ground height on the far side. Getting caught opens the failure/load screen; a missed jump returns to the automatic approach checkpoint. Named history retains both the pre-chase and escaped states.

Dog sprites: `assets/resources/dog/chase-bark.png`. Pursuit layout: `assets/scripts/DogChaseSegment.ts`. Audio regeneration: `python3 design/generate_dog_bark.py`. See `design/dog-chase.md` for save and validation details.
