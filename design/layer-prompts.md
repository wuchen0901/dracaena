# Layer asset prompts

Tool: built-in imagegen. Reference: the existing forest-background.png derived from the user's screenshot. All outputs are project assets in assets/resources/layers/. Each request was made separately. No CLI/API fallback was used.

- sky.png: Only a clean turquoise painted sky, subtle texture and faint planetary arc on right; remove clouds, trees, birds, landscape, ground, borders and UI dot; wide opaque plate.
- distant-forest.png: Only pale distant forest and low hills, full-width treetops across lower half, misty greens/teals; transparent sky; no large trees, ground ledge, rocks, birds, clouds or border.
- main-tree.png: Only the enormous central tree, reconstruct hidden trunk and canopy, preserve painted leaves and bark; true transparent background; no other scenery.
- left-tree.png: Only the left tall leafy tree, reconstruct obscured foliage, whole tree with base at bottom; transparent background; no central tree, ground, sky, clouds, birds, UI or border.
- ground.png: Only the sloping grassy rock shelf and dark cliff face; transparent above grass; no trees, sky, background forest, birds, UI or border.
- cloud.png: One isolated cream-white painted cloud cluster with soft edges; true transparent background; no other scenery.
- bird.png: One dark teal bird silhouette in flight, raised wings and readable profile; true transparent background; no sky or scenery.
- foreground.png: Dark teal painted leafy branches at lower left and lower right corners; center empty; transparent background; no ground, sky, trees, birds or border.

The source screenshot and prior flat assets were preserved. Generated reconstruction necessarily changes some details.
