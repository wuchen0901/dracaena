# Current lighting: normal forest brightness

The global blue night veil has been removed at the user's request. Old saves may retain their `night` field for compatibility and patrol light/siren intensity, but it no longer darkens the environment. Police search, hiding, departure and archive progression remain in place.

Cocos TypeScript checking passes for this visual-only change. Live Chrome preview access was not approved, so the refreshed appearance has not been visually confirmed. The previous nightfall design below is historical.

---

# Nightfall and distant search

After the canal, night falls smoothly between world x=1950 and x=3250. Progress never reverses when walking back, and a separate optional local-storage value retains the atmosphere across reloads. Existing puzzle checkpoints still determine player position.

A distant road centered at x=3500 carries two police car silhouettes with alternating red/blue lamps and three searchers sweeping handheld light cones. The vignette uses 0.55 parallax and has no collision or detection logic. The blue night veil leaves terrain visible and does not darken control labels.

An original four-second synthesized siren loop fades with distance from x=3500, becoming silent beyond 1500 units. Playback uses the existing gesture unlock and stops on controller destruction. Regenerate with `python3 design/generate_siren.py`.

TypeScript and the existing 17 animation/traversal tests pass. The scene still requires in-engine visual and listening review, especially silhouette visibility, flashlight readability and siren mix. The figures and cars are procedural silhouettes, not final painted assets.

The tree-cover encounter now ends this search: four seconds of hiding, then three seconds of patrol departure. Completed state persists locally; departed police and searchers remain absent, and the siren is silent. See `tree-cover.md`.
