# MirrorLife character bone animation AI

## Current character source

The game currently uses `public/assets/mirrorlife-citizen-sprite.png` as a 4 x 2
cel-shaded citizen sprite sheet:

1. artist / designer
2. engineer / worker / architect / programmer
3. doctor / nurse / caretaker
4. student / teacher / researcher
5. reporter / observer / explorer
6. farmer / freelancer / drifter
7. chef / resource helper
8. lawyer / judge / mediator

The player avatar uses `public/assets/mirrorlife-avatar-sprite.png` for the
opening identity card and avatar portrait.

## Runtime animation approach

MirrorLife now uses a lightweight procedural `Bone Animation AI` layer in
`public/game.js`.

It is not a trained model. It is an intent-to-pose controller:

```text
citizen state + behavior + gesture + mood + energy
-> animation intent
-> 2D bone keypoints
-> Canvas cel-shaded limb overlay
```

This lets the existing static sprite sheet feel more alive without introducing
a heavy runtime such as Spine, DragonBones, Live2D, or PixiJS.

## Bone rig

Each generated pose uses these keypoints:

- head
- neck
- chest
- pelvis
- leftShoulder / leftElbow / leftHand
- rightShoulder / rightElbow / rightHand
- leftHip / leftKnee / leftFoot
- rightHip / rightKnee / rightFoot

The renderer draws limbs as rounded quadratic curves with a dark ink outline,
then fills the inner stroke with the citizen color so it matches the current
dopamine cel-shading style.

## Intent mapping

The controller reads the existing behavior library:

- `walk`, `run`: counter-swinging arms and stride legs.
- `wave`: raised hand with oscillation.
- `talk`: small conversational hand motions.
- `sit`: folded legs and front-held hands.
- `reach`: extended hand for care, handoff, teaching, shopping, gathering.
- `rock`: tool-swing rhythm for repair, cooking, cleaning, gardening, work.
- `dance`: high arms, bounce, asymmetric feet.
- `wash`: hands near face with scrub motion.
- `sob` / `cry`: hands close to face, low body energy.
- `lean` / `think`: one hand near chin, softer body angle.
- `stomp`: sharper feet and tense hands.

Mood and energy subtly affect body lift and lean so characters feel tied to the
simulation state rather than playing generic loops.

## Future upgrade path

1. Use the current procedural rig as the fallback renderer.
2. Split the sprite sheet into transparent body-part layers.
3. Export matching Spine / DragonBones JSON using the same bone names.
4. Let the procedural intent controller choose clips and blend weights.
5. Keep world simulation authoritative: animation follows behavior, not the
other way around.

