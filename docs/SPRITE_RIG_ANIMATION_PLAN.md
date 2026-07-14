# Sprite rig animation plan

MirrorLife characters should animate like rigged cartoon bodies, not like a
full-body sticker with extra limbs drawn on top.

## Current implementation

`public/game.js` uses the existing `mirrorlife-citizen-sprite.png` sheet as the
source of truth. For active citizens, the renderer crops each sprite cell into
body parts at runtime:

- head
- torso
- front arm
- back arm
- front leg
- back leg

The parts are drawn back in layered order and rotated around approximate joint
pivots. The original character art remains visible, so the moving body still
belongs to the same cel-shaded person.

## Why this direction

The previous experiment drew procedural limbs over a complete character sprite,
which made the character look like a sticker sitting on an unrelated skeleton.
This approach keeps the animation inside the character image itself.

## Next upgrade

Runtime cropping is a bridge. The better long-term asset pipeline is:

1. Generate transparent layered character sheets with separated head, torso,
   upper/lower arms, hands, upper/lower legs, feet, hair, and props.
2. Keep the same bone names and pivots currently used by the runtime rig.
3. Export real animation clips from Spine, DragonBones, Rive, or a custom
   Canvas rig.
4. Let the world simulation choose the animation intent; let the rig only
   handle visual motion.

