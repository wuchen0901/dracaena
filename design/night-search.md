# Current lighting: normal forest brightness

The global blue night veil has been removed at the user's request. Old saves may retain their `night` field for compatibility and patrol light/siren intensity, but it no longer darkens the environment. Police search, hiding, departure and archive progression remain in place.

Cocos TypeScript checking passes for this visual-only change. Live Chrome preview access was not approved, so the refreshed appearance has not been visually confirmed. The previous nightfall design below is historical.

---

# Police search outside the prison

The forest stays at its restored normal brightness; the saved night phase controls the search lights and siren only. The police search now occurs outside the prison after the wall and dog-gap chase. `TreeCover.ts` places the roadside shelter around x=7400–7650; the police encounter uses its own hide timer and autosave state so it remains independent of the inner-yard sentry.

A distant roadside track carries two police car silhouettes with alternating red/blue lamps and three searchers sweeping handheld light cones. The vignette uses 0.55 parallax and has no collision geometry; exposure is checked against the roadside cover encounter.

An original four-second synthesized siren loop fades with distance from x=3500, becoming silent beyond 1500 units. Playback uses the existing gesture unlock and stops on controller destruction. Regenerate with `python3 design/generate_siren.py`.

TypeScript and the existing 17 animation/traversal tests pass. The scene still requires in-engine visual and listening review, especially silhouette visibility, flashlight readability and siren mix. The figures and cars are procedural silhouettes, not final painted assets.

The roadside tree-cover encounter ends this search: four seconds of hiding, then three seconds for the police to leave. Completed state persists in its own checkpoint; departed police and searchers remain absent, and the siren fades to silence. The separate inner-yard sentry is documented in `tree-cover.md`.
