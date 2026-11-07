# The Last Light — layered forest study

Open `assets/Main.scene` in Cocos Creator 3.8.8 and preview Current scene.

## Independent images and nodes

The scene no longer uses a single flattened landscape. `assets/resources/layers/` contains separate PNGs for sky, distant forest, main tree, left tree, ground/cliff, cloud, bird, and foreground foliage. The character remains in `assets/resources/reference/character.png`.

`PuzzleController.ts` creates one node per element at runtime. The two clouds and two birds reuse their respective image assets but have independent positions and motion. Far forest, trees, ground, and foreground use different parallax factors. Clouds drift; birds fly and gently change silhouette scale. The sky stays fixed. The game frame clips layers cleanly.

## Controls

Use **A/D** or **Left/Right** to move. Press **Space**, **W**, or **Up** to jump across the 170-unit gap to the far bank. On-screen arrows move and the **↑** button jumps. Jumping includes a short input buffer and late-edge grace period, with no double jump. Landing uses separate platform collision surfaces. Falling returns the character to the near cliff, or to the far bank after successfully crossing. **R** resets the run. The character still uses one pose rather than a complete walking/jumping animation.

## Assets and preservation

The built-in imagegen tool reconstructed separate layers from the provided screenshot; obscured areas were inferred, so the result is not pixel-identical. Transparency is preserved for compositing. Prompts are recorded in `design/layer-prompts.md`.

The prior flat controller is archived in `design/FlatPictureController.ts.txt`, with its original image assets retained in `assets/resources/reference/`. The earlier procedural room is archived in `design/GreenhouseController.ts.txt`.

Runtime-created nodes appear in the running preview. They are not serialized editable layer nodes in the editor's Scene view; layout and speeds are currently defined in `PuzzleController.ts`.
