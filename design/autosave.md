# Automatic saves and loading

Normal play no longer exposes scene-replay shortcuts. Esc / the top-left Pause control opens a menu with Continue and Load saves. The load menu lists named automatic saves newest first, with five entries per page and Japan-time timestamps. The caught-screen action opens that same list. R remains a shortcut to the newest record. Fresh installs start at reclamation; opening the game resumes a valid local save automatically.

Safe milestones: reclamation (-2050), station exit (-980), forest (-90), pre-canal (1190), far bank (1880), patrol approach (3080), and patrol cleared (3280). The existing gate-open save also persists. Active hiding and caught states never replace the safe snapshot, so retry does not restore an exposed or frozen character. Entering the patrol approach saves before the danger zone; completing the departure saves the cleared milestone without teleporting the live player.

The versioned `the-last-light.autosaves.v1` archive now stores all named snapshots plus the ID chosen for resume in one JSON write. Each snapshot includes checkpoint, gate state, night amount, escape-complete flag and alarm flag. Loading a historical entry preserves all newer entries; subsequent progress appends a new branch of records. Meaningful checkpoint/story changes create records; lighting interpolation alone does not flood history. `readProgress` validates the full snapshot. Legacy checkpoint-only saves remain readable; the controller migrates the old split night/escape keys once when the primary snapshot lacks story fields. Later loads use the unified snapshot only.

Load restores checkpoint position, resets velocity, jump buffers, input, camera and animation, restores scene flags, and closes failure/pause overlays. Pause stops movement, encounter timers and animation updates. If persistent storage fails, an in-memory safe snapshot remains loadable for the session and the existing storage-unavailable notice is shown.

Validation: 31 tests and Cocos TypeScript checking pass. Added tests cover full story-state round trips, safe patrol retries, non-regressing checkpoints, malformed data, old-save compatibility and the station exit checkpoint. Live Cocos preview confirmed removal of replay buttons, the pause menu, loading its latest save and refresh-to-resume. Mobile-device and audio-pause behavior were not verified; music/ambience currently continue during the pause menu.


History migration imports the previous single saved snapshot as one named record with an unknown timestamp. Older overwritten records cannot be reconstructed. Archive parsing validates records, orders by saved time/ID and skips corrupt entries. Selecting a record updates the resume ID without creating a duplicate record. All history is retained; pagination exposes entries beyond the first page.

History validation: 35 tests and TypeScript checking pass, including names, repeated visits, sorting, imported unknown times, invalid records and loading an older entry without losing newer history. Live preview confirmed the migrated named save, chronological list, and click-to-load behavior.
