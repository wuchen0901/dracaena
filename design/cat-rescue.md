# Kitten rescue after the prison wall

The small tabby is perched on a broken outer-wall remnant just beyond the prison. A guard dog is barking at it when the robot arrives. The player jumps onto the raised ledge; landing beside the kitten rescues it automatically, with no new interaction key. The dog turns away from the kitten and chases the robot.

A shipping crate blocks the near edge of the existing gap. The player jumps onto it to avoid the dog's bite and cross the gap. The dog cannot climb the crate or jump the gap, so it remains barking on the near bank. The kitten follows the robot and catches up on the far bank. Police search is the next outside encounter.

`DogChaseSegment.ts` owns the ledge, crate, rescue trigger, following position, run poses and dog state. `SluiceWorld.ts` includes the rescued state in the dog-completion checkpoint, so loading before the chase resets the kitten while loading after the gap keeps it with the robot. `assets/resources/cat/follow.png` is an eight-pose atlas: four frightened poses and four right-facing run phases.
