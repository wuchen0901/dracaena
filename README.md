# The Last Light — layered forest study

Open `assets/Main.scene` in Cocos Creator 3.8.8 and preview Current scene.

## Independent images and nodes

The scene no longer uses a single flattened landscape. `assets/resources/layers/` contains separate PNGs for sky, distant forest, main tree, left tree, ground/cliff, cloud, bird, and foreground foliage. The character uses a transparent 16-frame sprite sheet in `assets/resources/character/actions.png`; the original reference remains in `assets/resources/reference/character.png`.

`PuzzleController.ts` creates one node per element at runtime. The two clouds and two birds reuse their respective image assets but have independent positions and motion. Far forest, trees, ground, and foreground use different parallax factors. Clouds drift; birds fly and gently change silhouette scale. The sky stays fixed. The game frame clips layers cleanly.

## Controls

Use **A/D** or **Left/Right** to walk. Hold **Shift** while moving to run; on-screen arrows and a hold-to-run **RUN** button also work. Press **Space**, **W**, **Up**, or the on-screen **↑** button to jump. Run and jump near the cliff edge to cross the 170-unit gap. Jumping includes a short input buffer and late-edge grace period, with no double jump. Landing uses separate platform collision surfaces. Falling returns the character to the near cliff, or to the far bank after crossing. **R** resets position, facing, camera, animation, and held inputs.

The sprite sheet has four rows: idle, walk, run, and jump, with four frames each. Grounded cycles follow movement speed; jump frames follow takeoff, ascent, apex, and descent. Frames share a fixed canvas and foot anchor, and facing left mirrors the art. The engine slices the sheet into `SpriteFrame` regions at runtime. Prompt and asset details are in `design/character-animation.md`.

## Assets and preservation

The built-in imagegen tool reconstructed separate layers from the provided screenshot; obscured areas were inferred, so the result is not pixel-identical. Transparency is preserved for compositing. Prompts are recorded in `design/layer-prompts.md`.

The prior flat controller is archived in `design/FlatPictureController.ts.txt`, with its original image assets retained in `assets/resources/reference/`. The earlier procedural room is archived in `design/GreenhouseController.ts.txt`.

Runtime-created nodes appear in the running preview. They are not serialized editable layer nodes in the editor's Scene view; layout and speeds are currently defined in `PuzzleController.ts`.
