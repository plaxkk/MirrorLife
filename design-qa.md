# Design QA — Civic Room Reference Rebuild / 2D Avatar Identity to 3D

## 2026-07-20 reference-fidelity v72 story-scale framing, illustrated gaze and orbit-composition gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Final in-app Browser implementation: `dist/interior-3d-work/civic-fidelity-v72/desktop-yaw-0-1672x941-v72.jpg` (`1672 × 941`, public-plaza, yaw `0°`) and `desktop-yaw-180-1672x941-v72.jpg` for the rear-hemisphere composition, furniture depth and full-volume actor check.
- Same-canvas comparisons: `dist/interior-3d-work/civic-fidelity-v72/reference-vs-v72-full.png` and `reference-vs-v72-cast-focus.png`, with the source on the left and the live implementation on the right.
- Responsive evidence: `dist/interior-3d-work/civic-fidelity-v72/mobile-yaw-0-390x844-v72.jpg` (`390 × 844`, final ready state). In-app Browser warning/error logs are empty.

### Comparison history, fixes and post-fix evidence

- [fixed from v71 P1 / cast read as small scene props] The public-room hero camera moves from `5.65m / 3.56m / 42°` to `5.2m / 3.34m / 40°`. The same-canvas hero comparison shows the social circle and body language occupying a more reference-like share of the frame while retaining the doorway, proposal wall, display case and lounge.
- [fixed / eyes collapsed into dark pixels] Character sculpt v11 enlarges the complete corneal stack, but increases the iris proportion more strongly than the white. The resulting gaze is readable at story-camera distance without restoring the two protruding white discs rejected in the earlier toy-doll pass. Lids, outlines, lashes, pupils and catchlights were resized together, preserving blink and `Attentive` expression articulation.
- [fixed / portal and floor competed with faces] The daylight card multiplier and local portal light are reduced, the civic terrazzo is darker and warmer, and its roughness/env-map response is less mirror-like. The cinematic grade adds modest saturation and shoulder contrast, recovering teal, coral, timber and brass separation without changing the established palette.
- [fixed / weak foot contact] Actor contact-shadow opacity increases from `0.28` to `0.36`. The focused crop and reverse frame now show a clearer weight connection at the feet rather than a floating cut-out edge.
- [fixed from v72 first comparison / close lens broke the rear orbit] A fixed close camera made the opposite witness become a cropped foreground wall at yaw `180°`. The final camera now eases radius, height and FOV across the rear hemisphere, reaching the previous safe `5.65m / 3.56m / 42°` only at `180°` while keeping the intimate hero angle at `0°`. The revised reverse frame restores the player, three witnesses and room landmarks in one readable composition.
- [checked / embodied movement and rotation] Local Chrome moved the physical player `3.97m` and rotated the weighted camera `65.3°`; the room remains a navigable, collision-backed 3D scene rather than a matched still.

### Runtime and performance evidence

- Desktop hero yaw `0°`: `150` draw calls / `284,640` triangles, below the strict `160 / 300,000` civic-room gate.
- Desktop reverse yaw `180°`: `159` draw calls / `298,084` triangles, below the same complete-orbit gate.
- Mobile `390 × 844`: `106` draw calls / `247,300` triangles, below the `110 / 250,000` gate with three actors, touch movement, camera and action controls visible.
- Character contract: `mirrorlife-civic-sculpt-v11` / `mirrorlife-civic-clips-v3`, four roles and `7.21 MB` total. Geometry remains player `29,512`, listener `26,596`, facilitator `30,798` and mediator `28,886` triangles because the eye refinement changes authored scale, not topology.
- Hero-prop contract remains `mirrorlife-civic-hero-props-v4` at `34,332` aggregate authored triangles.
- World regression: all `26` interiors passed the physics audit; desktop/mobile scene flow passed; all `78` enter/exit transitions completed with no failure or runtime error.
- Static/build checks: civic character/hero-prop validation, `pnpm check`, production build and `git diff --check` passed. The build retains only the existing non-module-script and large-chunk advisories.

### Required fidelity surfaces

- [checked][interaction/motion] The public room remains metre-based, Y-up and collision-backed with keyboard/touch locomotion, animation, weighted follow framing and drag orbit. The yaw-dependent lens is continuous rather than a cut between static cameras.
- [checked][spacing/layout rhythm] The hero frame gives the cast and listening circle more of the source's visual authority; foreground records, the portal and the lounge continue to establish front, middle and back depth.
- [checked][colors/tokens] Warm ivory, teal, coral, timber and brass remain the only dominant families. The new grade and terrazzo response increase separation rather than inventing a new visual language.
- [checked][image and asset quality for this iteration] Eyes are real lit geometry with iris, pupil, sclera, outline, lid and catchlight; the portal remains a parallax 3D threshold with an exterior card rather than a fullscreen background replacement.
- [checked][copy/content] Location memory, exit, contextual listening prompt and the four social verbs remain coherent and unchanged.
- [checked][responsiveness/accessibility] At `390 × 844`, no horizontal overflow occurs and all required touch controls remain visible at the established mobile budget.
- [P1][production character modelling] The larger gaze and better story scale improve readability, but the source still has more natural head planes, hair strand grouping, hand skinning, garment seams/tension and facial deformation; the current actors remain visibly simpler in the focused crop.
- [P1][whole-room asset craftsmanship] The room is functionally authored, but portal joinery, upholstery tailoring, wall plaster variation, built-in cabinetry, paper/ceramic storytelling and object-specific wear remain less dense and bespoke than the source.
- [P1][indirect light and contact complexity] Portal highlights and foot contact are better controlled, but the source retains richer bounce-light color, skin subsurface response, multi-scale occlusion and roughness breakup.
- [P2][HUD optical finish] The controls remain functional and responsive, but icon drawing, optical weight, translucent depth and compact alignment are less refined than the reference HUD.

### Gate result

This iteration makes the cast the first visual read, restores illustrated eye contact, grounds the actors and preserves a usable full orbit with no performance regression. The paired canvas still exposes production character-modelling, whole-room craftsmanship and indirect-light P1 gaps, so literal reference-quality parity remains unproven.

final result: blocked

Blocker: production-level character modelling, broader room-specific asset craftsmanship and richer indirect-light/material response remain visible P1 differences.

## 2026-07-20 reference-fidelity v71 articulated hands and attentive-expression gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Final in-app Browser implementation: `dist/interior-3d-work/civic-fidelity-v71/desktop-yaw-0-1672x941-v71.jpg` (`1672 × 941`, public-plaza, yaw `0°`) and `desktop-yaw-180-1672x941-v71.jpg` for the reverse cast, hand silhouette and full-volume asset check.
- Same-canvas comparisons: `dist/interior-3d-work/civic-fidelity-v71/reference-vs-v71-full.png` and `reference-vs-v71-cast-focus.png`, with the source on the left and the live implementation on the right.
- Responsive evidence: `dist/interior-3d-work/civic-fidelity-v71/mobile-yaw-0-390x844-v71.jpg` (`390 × 844`, final ready state). In-app Browser warning/error logs are empty.

### Comparison history, fixes and post-fix evidence

- [fixed from v70 P1 / mitten-like hands] Every hand now combines a shorter continuous palm with four overlapping, tapered finger volumes. The six-sided finger cross-section and sixteen-sided palm are smooth-shaded at gameplay scale; they preserve the readable four-finger contour without spending face-sculpt density on sub-pixel extremities.
- [fixed / static listening faces] The v10 face contract adds an `Attentive` morph that lifts the lower-lid and upper-cheek band. Runtime expression weights are role-specific (`0.58` mediator, `0.50` listener, `0.42` facilitator and restrained `0.16` player) and are coordinated with eye compression and brow lift rather than applied as a universal smile.
- [fixed / weak smile volume] `WarmSmile` now carries more cheek lift and jaw response, so the authored facial state changes surface form rather than only swapping mouth graphics.
- [fixed / waxy shadow-side skin] `mirrorlife-civic-skin-wrap-v3` broadens warm grazing response, adds restrained shadow warmth and a front-facing velvet highlight. Faces remain materially separate from hair and cloth under both hero and reverse lighting.
- [fixed / v71 first-pass budget overrun] The first four-finger pass measured `302,388` triangles at yaw `180°` and `249,880` on mobile. Palm radial density, finger cross-sections and crease bevel resolution were reduced only where invisible at story-camera scale; final reverse is `298,084` and mobile is `247,300` while retaining all four finger volumes on desktop.
- [checked / embodied movement and orbit] Local Chrome moved the physical player `3.57m` and rotated the weighted follow camera `65.3°`. The reverse frame confirms articulated hand and expression geometry remains full-volume rather than becoming camera-facing artwork.

### Runtime and performance evidence

- Desktop hero yaw `0°`: `150` draw calls / `284,640` triangles, below the strict `160 / 300,000` civic-room gate.
- Desktop reverse yaw `180°`: `159` draw calls / `298,084` triangles, below the same complete-orbit gate.
- Mobile `390 × 844`: `106` draw calls / `247,300` triangles, below the `110 / 250,000` gate with three actors, one authored lounge asset and all touch controls visible.
- Character contract: `mirrorlife-civic-sculpt-v10` / `mirrorlife-civic-clips-v3`, four roles and `7.21 MB` total. Role triangle counts are player `29,512`, listener `26,596`, facilitator `30,798` and mediator `28,886`, all below the `35,000` per-role Web LOD0 budget.
- Hero-prop contract remains `mirrorlife-civic-hero-props-v4` at `34,332` aggregate authored triangles.
- World regression: all `26` interiors passed the physics audit; desktop/mobile scene flow passed; all `78` enter/exit transitions completed with no failure or runtime error.
- Static/build checks: civic character/hero-prop validation, `pnpm check`, production build and `git diff --check` passed. The build retains only the existing non-module-script and large-chunk advisories.

### Required fidelity surfaces

- [checked][interaction/motion] The result remains a live metre-based Y-up room with Rapier collision, keyboard/touch locomotion, authored animation, player-follow framing and drag orbit. The new face and hand work is integrated into the same moving actors.
- [checked][character silhouette] Four overlapping fingers, a shorter palm, shaped shoes and role-specific clothing create a clearer human silhouette in hero and reverse views. Mobile removes only sub-pixel crease micro-meshes, not the actor or interaction pose.
- [checked][expression hierarchy] Eye, brow, cheek and mouth states now collaborate to communicate attention. Witness roles no longer share one undifferentiated neutral face.
- [checked][lighting/material integration] The v3 skin response preserves warm edge light, front-plane readability and cloth/hair separation across the orbit without adding a second face mesh or screen-space portrait.
- [checked][spacing/layout rhythm] The four-person story circle remains clear and collision-safe; hand and facial changes do not encroach on the `1.5m` story centre or interaction anchors.
- [checked][responsiveness/accessibility] At `390 × 844`, the final state has no horizontal overflow; joystick, chat, jump, contextual action and all social actions remain visible within the strict mobile budget.
- [P1][production face and hand deformation] The paired crop confirms materially better acting, but fingers are still rigid volumes rather than a skinned production hand, and cheek/jaw/eyelid deformation remains less anatomically integrated than the source.
- [P1][whole-room authored craftsmanship] Hero furniture is materially richer, but portal landscaping, wall plaster, built-in joinery, paper density and small prop storytelling still have less specificity and natural variation than the source room.
- [P1][contact and indirect-light realism] The skin wrap is warmer, but the source retains more convincing subsurface response, foot contact compression, multi-scale bounce and localized roughness/wear.
- [P2][HUD optical finish] Responsive controls work, but icon construction, type weight, translucent depth and compact spacing remain less refined than the reference HUD.

### Gate result

This iteration closes the most visible mitten-hand and neutral-listening-face gaps while preserving real movement, collision, full orbit and strict desktop/mobile budgets. The paired canvas still exposes P1 production deformation, whole-room craftsmanship and indirect-light differences, so literal reference-quality parity remains unproven.

final result: blocked

Blocker: production hand/face deformation, broader room-specific environmental craftsmanship and richer contact/indirect material response remain visible P1 differences.

## 2026-07-20 reference-fidelity v70 material hierarchy and authored environment-craft gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Final in-app Browser implementation: `dist/interior-3d-work/civic-fidelity-v70/desktop-yaw-0-1672x941-v70.jpg` (`1672 × 941`, public-plaza, yaw `0°`) and `desktop-yaw-180-1672x941-v70.jpg` for the reverse room and full-volume asset check.
- Same-canvas comparisons: `dist/interior-3d-work/civic-fidelity-v70/reference-vs-v70-full.png` and `reference-vs-v70-cast-focus.png`, with the source on the left and the live implementation on the right.
- Responsive evidence: `dist/interior-3d-work/civic-fidelity-v70/mobile-yaw-0-390x844-v70.jpg` (`390 × 844`, final ready state). In-app Browser warning/error logs are empty.

### Comparison history, fixes and post-fix evidence

- [fixed from v69 P1 / material hierarchy flattened after batching] Semantic-model batching now preserves authored metalness up to `0.82` instead of clipping every object to `0.18`. Brass inlays, pulls, rims and mullions retain their Blender-authored response in one draw call, while timber, paper, ceramics and fabric keep their existing per-vertex roughness.
- [fixed / generic display-case silhouette] The foreground display gains brass glass mullions and shelf rail, a readable witness card and richer glazed-vessel construction. These are exported meshes with reverse-view depth, not decals or screen-space decoration.
- [fixed / anonymous notice-console table] The proposal wall console gains inset drawers, brass pulls, a teal witness cup and books with spine insets and foil marks. The desk, basket and public papers now read as one authored civic record station rather than a template table under a board.
- [fixed / featureless lounge upholstery and shelf blocks] Seat/back piping now catches the side light, ceramics use distinct glazed materials and every shelf book has page, spine and foil hierarchy. The lounge remains a functional two-seat conversation zone while carrying more of the source's domestic specificity.
- [fixed / cool, isolated direct lighting] The civic preset now lifts hemisphere, fill, portal wash, warm bounce and environment contribution while slightly reducing the hard key. The comparison shows softer room integration and more legible reflective accents without washing out the cast.
- [checked / embodied movement and orbit] Local Chrome moved the physical player `3.97m`, observed the authored locomotion contract and rotated the weighted follow camera `65.3°`. The `180°` frame confirms back/side surfaces, furniture depth and material response around the full orbit.

### Runtime and performance evidence

- Desktop hero yaw `0°`: `150` draw calls / `279,008` triangles, below the strict `160 / 300,000` civic-room gate.
- Desktop reverse yaw `180°`: `159` draw calls / `292,452` triangles, below the same complete-orbit gate.
- Mobile `390 × 844`: `106` draw calls / `242,428` triangles, below the `110 / 250,000` gate with three actors, one authored lounge asset and all touch controls visible.
- Hero-prop contract: `mirrorlife-civic-hero-props-v4` passes at `34,332` aggregate triangles: display case `8,988`, notice console `9,784`, lounge suite `15,560`.
- Character contract remains `mirrorlife-civic-sculpt-v9` / `mirrorlife-civic-clips-v3`, four roles and `6.84 MB` total.
- World regression: all `26` interiors passed the physics audit; desktop/mobile scene flow passed; all `78` enter/exit transitions completed with no failure or runtime error.
- Static/build checks: civic character/hero-prop validation, `pnpm check`, production build and `git diff --check` passed. The build retains only the existing non-module-script and large-chunk advisories.

### Required fidelity surfaces

- [checked][interaction/motion] The result remains a live metre-based Y-up room with Rapier collision, keyboard/touch locomotion, authored animation, player-follow framing and drag orbit. All visual changes are real 3D scene content.
- [checked][spacing/layout rhythm] Foreground civic records frame the four-person listening circle; the proposal wall, display cabinet and lounge create a functional background. Added craft stays on room edges and preserves the `1.5m` clear story centre.
- [checked][colors/tokens] Warm ivory remains the dominant field; teal/coral identify social roles; brass is reserved for evidence, joinery and navigation. New glazes and foil marks reuse the existing palette rather than introducing unrelated colour noise.
- [checked][material hierarchy] Brass, timber, paper, high-roughness textile and glazed ceramic now retain materially distinct surface parameters through runtime batching. Glass remains separately transparent and double-sided.
- [checked][image and asset quality for this iteration] Mullions, rails, drawers, pulls, book bindings, ceramic feet/bands and upholstery piping are authored mesh parts with actual lighting, occlusion and reverse-view evidence.
- [checked][responsiveness/accessibility] At `390 × 844`, no horizontal overflow occurs; joystick, chat, jump, contextual action and four social actions remain visible under the mobile draw/triangle caps.
- [P1][production character deformation] v69 proportions remain improved, but hands, facial deformation, strand grouping, garment tension and foot-to-ground compression are still visibly simpler than the source cast.
- [P1][environment uniqueness beyond hero assets] The three highest-salience furniture groups are now substantially richer, but wall plaster breakup, built-in joinery, portal landscaping, ceramics and paper storytelling across the entire room remain less bespoke than the source.
- [P1][indirect-light realism] The softer fill and restored metalness improve integration, but the source still has more natural skin subsurface response, portal bounce, contact-shadow scale separation and localized roughness/wear.
- [P2][HUD optical finish] Responsive controls work, but icon drawing, type weight, translucent depth and compact spacing remain less optically refined than the reference HUD.

### Gate result

This iteration fixes the environment's most visible material-flattening defect and adds meaningful authored craft to all three hero furniture groups while preserving movement, collision, orbit and strict desktop/mobile budgets. The paired canvas still exposes actionable P1 character deformation, whole-room uniqueness and indirect-light differences, so literal reference-quality parity remains unproven.

final result: blocked

Blocker: production hand/face/cloth deformation, broader whole-room authored craftsmanship and more natural indirect light/material response remain visible P1 differences.

## 2026-07-20 reference-fidelity v69 editorial framing, proportion and cloth-form gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Final in-app Browser implementation: `dist/interior-3d-work/civic-fidelity-v69/desktop-yaw-0-1672x941-v69.jpg` (`1672 × 941`, public-plaza, yaw `0°`) and `desktop-yaw-180-1672x941-v69.jpg` for reverse actor, furniture and room-volume evidence.
- Same-canvas comparisons: `dist/interior-3d-work/civic-fidelity-v69/reference-vs-v69-full.png` and `reference-vs-v69-cast-focus.png`, with the source on the left and the live implementation on the right.
- Responsive evidence: `dist/interior-3d-work/civic-fidelity-v69/mobile-yaw-0-390x844-v69.jpg` (`390 × 844`, final ready state with touch movement, camera and action controls).

### Comparison history, fixes and post-fix evidence

- [fixed from v68 P1 / toy-like head and eye hierarchy] Re-sculpted all four heads with a narrower jaw, smaller hair cap, restrained ear/nose/mouth volumes and a smaller sclera/lid/lash stack. The cast crop now gives clothing, gesture and body language more visual weight instead of letting two white eye discs dominate each face.
- [fixed / compressed social tableau] The public-room desktop camera now uses a wider `5.65m` follow radius, `3.56m` height, `42°` FOV and a `56/32/12` player/target/path pivot. The listening circle moves out of the lower HUD band and gains the reference's editorial breathing room without becoming a static overview.
- [fixed / rigid skirt and sleeve cylinders] The two skirted roles now use a five-ring asymmetric drape with twelve pleats, a shaped hem and runtime secondary motion. Traveler, facilitator and mediator sleeves add two shallow elbow-compression ribbons per arm, while a high-roughness cloth mask adds restrained grazing-angle sheen.
- [fixed / oversized toy limbs and shoes] Torso, shoulder spacing, neck, waistband, head scale and shoe lasts were rebalanced toward the target's approximately `1:3.5` illustrated silhouette. The player remains `1.72m` in metre space and keeps the existing capsule, locomotion and interaction contract.
- [fixed / undersized environment inside large colliders] The authored display case, notice console and lounge suite were rescaled toward their authoritative metre-space footprints. The middle and background now carry more believable civic-room mass, and the visible furniture aligns more closely with collision expectations.
- [checked / embodied movement and orbit] Local Chrome moved the physical player `1.69m`, observed the authored walk/idle contract and rotated the weighted follow camera `65.3°`. Reverse-view evidence confirms full-volume faces, clothing, held props and furniture rather than camera-facing substitutes.

### Runtime and performance evidence

- Desktop hero yaw `0°`: `150` draw calls / `274,208` triangles, below the strict `160 / 300,000` civic-room gate.
- Mobile `390 × 844`: `106` draw calls / `240,172` triangles, below the `110 / 250,000` gate while retaining three actors, touch locomotion, jump, camera and contextual/social actions.
- Character contract: four civic roles pass `mirrorlife-civic-sculpt-v9` and `mirrorlife-civic-clips-v3` at `6.84 MB` total. Role triangle counts are player `27,888`, listener `24,972`, facilitator `29,174` and mediator `27,262`, all below the `35,000` per-role Web budget.
- Hero-prop contract: three authored civic assets pass `mirrorlife-civic-hero-props-v3` at `29,532` aggregate triangles.
- World regression: all `26` interiors passed the physics audit; desktop/mobile scene flow passed; all `78` enter/exit transitions completed with no failure or runtime error.
- Static/build checks: civic character/hero-prop validation, `pnpm check` and the Vite production build passed. The production build retains only the existing non-module-script and large-chunk advisories.

### Required fidelity surfaces

- [checked][interaction/motion] The room remains a live metre-based Y-up scene with Rapier collision, keyboard/touch locomotion, authored animation states, a player-follow pivot and drag orbit. Camera and visual changes do not replace the playable world with a framed render.
- [checked][spacing/layout rhythm] A foreground story board frames the cast, the listening ring owns the middle ground, and the proposal wall, storage, display and lounge create readable background function. The wider camera keeps foreground, middle and background visible in one designed composition.
- [checked][colors/tokens] Warm ivory remains dominant, teal/coral identify social roles and brass is reserved for evidence/navigation. Daylight dapples and cloth sheen add material separation without adding unrelated palette noise.
- [checked][image and asset quality for this iteration] Facial planes, eye stack, five-ring skirt drape, sleeve folds and adjusted furniture are real geometry or mesh-shader response with actual lighting, occlusion, collision context and reverse-view evidence.
- [checked][copy/content] Location, room memory, exit, contextual listening prompt and the four social verbs remain coherent and unchanged.
- [checked][responsiveness/accessibility] At `390 × 844`, the final scene keeps all required touch controls visible, avoids horizontal overflow and remains below the strict mobile render budget.
- [P1][production character deformation] The new proportions are materially closer, but the paired crop still shows simpler hands, facial deformation, strand grouping, garment tension and foot-to-ground compression than the source cast.
- [P1][environment craftsmanship] Furniture scale and depth are better, but cabinet joinery, ceramics, books/paper density, upholstery tailoring, woven storage and object-specific wear remain visibly less authored than the reference.
- [P1][lighting/material integration] The warmer dapple and cloth sheen improve hierarchy, but the source still has richer portal bounce, skin subsurface response, multi-scale indirect shadows and roughness breakup across terrazzo, timber, paper, fabric, glass and brass.
- [P2][HUD optical finish] The responsive controls remain functional, but icon drawing, type weight, translucent depth and spacing are less optically refined than the reference HUD.

### Gate result

This iteration closes the largest camera-breathing, toy-proportion, rigid-cloth and undersized-furniture gaps while preserving real movement, collision, orbit and mobile budgets. The same-canvas comparison still exposes actionable P1 production deformation, bespoke environment craft and indirect-material differences, so literal reference-quality parity remains unproven.

final result: blocked

Blocker: production hand/face/cloth deformation, denser bespoke environment craftsmanship and richer indirect material response remain visible P1 differences.

## 2026-07-20 reference-fidelity v68 asymmetric social staging, story-board and mobile-detail gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Final in-app Browser implementation: `dist/interior-3d-work/civic-fidelity-v68/desktop-yaw-0-1672x941-v68.jpg` (`1672 × 941`, public-plaza, yaw `0°`) and `desktop-yaw-180-1672x941-v68.jpg` for the reverse actor/prop view.
- Same-canvas comparisons: `dist/interior-3d-work/civic-fidelity-v68/reference-vs-v68-full.png` and `reference-vs-v68-cast-focus.png`, with the reference on the left and the live implementation on the right.
- Responsive evidence: `dist/interior-3d-work/civic-fidelity-v68/mobile-yaw-0-390x844-v68.jpg` (`390 × 844`, final ready state rather than the loading shell).

### Comparison history, fixes and post-fix evidence

- [fixed from v67 P1 / symmetrical mannequin listening] The `listen` contract is now role-specific and asymmetric. The mediator shifts weight while bringing one hand toward the chin, the listener opens one side of the body while holding the satchel side closer, and the facilitator braces the notebook with opposing ribcage and leg weight. The desktop hero and reverse frames show three distinct social silhouettes instead of one mirrored arm pose.
- [fixed / blank foreground slab] The stale foreground display mesh was rebuilt as a real walnut-and-ivory “today's topic” board with title bar, response rows and brass clip. The final hero frame contains no white placeholder slab; the board reads as a civic story object from front, side and reverse angles.
- [fixed / over-crisp contact and cool shadow wrap] The civic key/fill/hemisphere/bounce balance, GTAO radius/blend, actor rim, face fill and environment intensity were recalibrated. The desktop skin material now uses the `skin-wrap-v2` response, keeping faces warm and readable without flattening their form.
- [fixed / redundant foreground geometry] A duplicate procedural agenda assembly hidden behind the authored hero asset was removed. Rendering, collisions and story affordances retain one authoritative foreground prop instead of paying for two overlapping versions.
- [fixed / mobile budget regression] Mobile actor LOD now removes only sub-pixel nose, lash/glint, button, thumb, finger-crease and notebook micro-meshes while retaining full silhouettes, eyes, costumes and held-prop readability. This recovered `6,888` triangles without reducing the visible player/two-witness composition or touch controls.
- [checked / embodied movement and orbit] The automated real-browser gate moved the physical player `3.41m`, observed the authored locomotion transition and rotated the weighted follow camera `65.3°`; the scene remains playable rather than a matched static render.

### Runtime and performance evidence

- Desktop hero yaw `0°`: `150` draw calls / `272,204` triangles, below the strict `160 / 300,000` civic-room gate. The reverse frame also remains within the previously verified complete-orbit budget and keeps the cast plus functional furniture readable.
- Mobile `390 × 844`: `106` draw calls / `242,062` triangles, below the `110 / 250,000` gate after selective micro-detail LOD.
- Character contract: four civic roles pass at `6.76 MB` total with `mirrorlife-civic-clips-v3`; all three witness roles expose distinct settled listening offsets and secondary-motion diagnostics.
- Hero-prop contract: three authored civic assets pass `mirrorlife-civic-hero-props-v3` at `29,532` aggregate triangles. The display asset includes the new title and three response-line meshes.
- World regression: all `26` interiors passed the physics audit; desktop/mobile scene flow passed; all `78` enter/exit transitions completed with no failure or runtime error.
- Static/build checks: civic character/hero-prop validation, `pnpm check` and the Vite production build passed. The build retains only the existing non-module-script and large-chunk advisories.

### Required fidelity surfaces

- [checked][interaction/motion] The public room remains a metre-based Y-up scene with Rapier-backed collision, keyboard/touch locomotion, authored animation states, player-weighted framing and orbit rotation. No screenshot or screen-space substitute was introduced.
- [checked][spacing/layout rhythm] A real foreground record desk frames the scene, the four-person listening ring owns the middle ground, and the topic wall, storage and lounge establish a functional background. The blank slab no longer interrupts the depth sequence.
- [checked][colors/tokens] Warm ivory remains dominant, teal/coral identify social roles and brass is reserved for evidence/navigation. Softer bounce and skin wrap improve separation without adding unrelated colours.
- [checked][image and asset quality for this iteration] The agenda board, cast, notebook and furnishings are full-volume meshes with real lighting, occlusion and reverse-view evidence. The role poses remain attached to the actual skeletal hierarchy.
- [checked][copy/content] Location, room memory, exit, contextual listening prompt and the four social verbs remain coherent. The rebuilt topic board adds physical story context without introducing unreadable UI copy.
- [checked][responsiveness/accessibility] At `390 × 844`, the final scene keeps joystick, chat, jump, contextual action and all four social actions visible while remaining below the strict mobile draw/triangle ceilings.
- [P1][production character fidelity] Asymmetric staging fixes the mannequin read, but the paired crop still shows simpler finger articulation, facial deformation, cloth compression, hair strand grouping and body-volume transitions than the reference cast.
- [P1][environment craftsmanship] The foreground story object is now authored and coherent, but cabinet joinery, pottery, paper/book density, upholstery softness and object-specific wear remain materially simpler than the reference.
- [P1][lighting/material integration] Softer fill, GTAO and skin wrap improve contact, but the source still has richer skin subsurface response, portal bounce, cloth/wood roughness breakup and multi-scale indirect shadows.
- [P2][HUD optical finish] Responsive hierarchy and controls work, but icon craft, typography, translucent depth and compact spacing remain less refined than the reference HUD.

### Gate result

This iteration removes the blank foreground artifact, gives every witness a distinct social stance, improves material integration and restores the mobile performance margin while preserving real movement, collision and orbit. The same-canvas comparison still contains actionable P1 character-deformation, bespoke-environment and indirect-material differences, so literal reference-quality parity remains unproven.

final result: blocked

Blocker: production hand/face/cloth deformation, denser bespoke environment craftsmanship and more natural indirect material response remain visible P1 differences.

## 2026-07-20 reference-fidelity v67 embodied story contact and hero-prop craft gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Final in-app Browser implementation: `dist/interior-3d-work/civic-fidelity-v67/desktop-yaw-0-1672x941-v67.jpg` (`1672 × 941`, public-plaza, yaw `0°`) and `desktop-yaw-180-1672x941-v67.jpg` for front-facing prop/contact inspection.
- Same-canvas comparisons: `dist/interior-3d-work/civic-fidelity-v67/reference-vs-v67-full.png` and `reference-vs-v67-cast-focus.png`, with the reference on the left and the live implementation on the right.
- Responsive evidence: `dist/interior-3d-work/civic-fidelity-v67/mobile-yaw-0-390x844-v67.jpg` (`390 × 844`). In-app Browser logs contain only Vite connection diagnostics and no warning/error entries.

### Comparison history, fixes and post-fix evidence

- [fixed from v66 P1 / disconnected story prop] The facilitator's notebook moved from a visible `0.12m` hand gap into the authored palm, is counter-rotated against the listening elbow pose and now includes a real spine, elastic and pencil. The reverse crop confirms upright, readable full-volume geometry instead of two floating bars.
- [fixed / printer-like foreground clutter] The oversized horizontal clipboard was replaced by an upright civic agenda with frame, paper hierarchy, title markers and three response rows. The desk cluster was rescaled and pulled back so it frames the cast without becoming the dominant white rectangle.
- [fixed / uniform expression stack] The runtime now couples `WarmSmile` to restrained eye compression and mouth width/depth. This retains gameplay-scale readability while allowing a smile to affect more than one isolated facial mesh.
- [fixed / generic lounge and storage craft] The lounge gains upholstery seams, back tufts, inset cushion panels, a handled cup and bookmark. The notice basket now has alternating weave rings, ribs and a liner; these remain authored GLB details with side/back evidence under orbit.
- [checked / embodied camera and mobile composition] The same metre-based cast, furniture collision and camera pivot remain active on desktop. Mobile retains the player, two nearest witnesses, touch movement, chat, jump, contextual action and the complete social-action rail.

### Runtime and performance evidence

- Desktop yaw `0°`: `150` draw calls / `274,944` triangles. Desktop yaw `180°`: `159` draw calls / `288,388` triangles. Both stay below the strict `160 / 300,000` civic-room gate.
- Mobile `390 × 844`: `106` draw calls / `248,950` triangles, below the `110 / 250,000` gate.
- Character contract: four civic roles pass at `6.76 MB` total with `mirrorlife-civic-sculpt-v8`; facilitator includes the held notebook spine, elastic and pencil.
- Hero-prop contract: three authored civic assets pass `mirrorlife-civic-hero-props-v2` at `29,140` aggregate triangles, including lounge seams/cup detail and woven basket liner.
- World regression: all `26` interiors passed the physics audit; desktop/mobile scene flow and embodied character exploration passed; all `78` enter/exit transitions completed successfully with local Chrome.
- Static/build checks: civic character/hero-prop validation, `pnpm check` and the Vite production build passed. The build retains only the existing non-module-script and large-chunk advisories.

### Required fidelity surfaces

- [checked][interaction/motion] The scene remains a real Y-up 3D room with keyboard/touch locomotion, furniture collision, authored character clips, player-follow framing and drag orbit. Story props are attached to the real actor hierarchy rather than overlaid in screen space.
- [checked][spacing/layout rhythm] The bright portal and record desk frame the foreground; the four-person listening circle holds the middle; proposal wall, storage and lounge establish background function. The final reverse view proves complete actor and furniture volume.
- [checked][colors/tokens] Warm ivory remains the base, teal/coral identify social roles and brass reserves evidence/navigation emphasis. New agenda, notebook, upholstery and basket details inherit those materials rather than introducing unrelated accent colours.
- [checked][image and asset quality for this iteration] The notebook, agenda, upholstery details and weave are full geometry with real occlusion, lighting and reverse views. No billboard, CSS drawing or static panorama substitutes for the playable room.
- [checked][copy/content] Location, room memory, exit, contextual listening prompt and four social verbs remain coherent. The agenda and held notebook increase story legibility without adding instructional copy.
- [checked][responsiveness/accessibility] Essential mobile controls remain visible at `390 × 844`; the room remains within the strict mobile render budget.
- [P1][production character fidelity] The prop-hand gap is closed and expression coupling is better, but finger articulation, facial/cloth deformation, rear hair shaping and body-language asymmetry remain visibly simpler than the reference cast.
- [P1][environment craftsmanship] The agenda, basket and lounge close the clearest modular-prop gaps, but cabinet joinery, pottery, paper/book density, upholstery softness and object-specific wear still lack the reference's authored richness.
- [P1][lighting/material integration] Contact reads more clearly, but the source retains softer portal bounce, skin subsurface response, multi-scale contact shadows and wider roughness variation across wood, paper, cloth, terrazzo and metal.
- [P2][HUD optical finish] Responsive hierarchy and controls work, but icon craft, type weight, translucent depth and compact spacing remain less refined than the reference HUD.

### Gate result

This iteration fixes the clearest story-prop contact error, removes the printer-like foreground silhouette and adds bespoke furniture craft while preserving the playable camera, collisions and responsive budgets. The paired canvases still contain actionable P1 character-deformation, environment-craft and indirect-material differences, so literal reference-quality parity remains unproven.

final result: blocked

Blocker: production hand/face/cloth deformation, broader bespoke environment craftsmanship and more natural indirect material response remain visible P1 differences.

## 2026-07-19 reference-fidelity v66 facial hierarchy, skin wrap and responsive budget gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Current in-app Browser implementation: `dist/interior-3d-work/civic-fidelity-v66/desktop-yaw-0-1672x941-v66.jpg` (`1672 × 941`, public-plaza, yaw `0°`, final ready state) and `desktop-yaw-180-1672x941-v66.jpg` for the front-facing player/cast inspection.
- Same-canvas comparisons: `dist/interior-3d-work/civic-fidelity-v66/reference-vs-v66-full.png` and `reference-vs-v66-cast-focus.png`, with the reference on the left and the live implementation on the right.
- Responsive evidence: `dist/interior-3d-work/civic-fidelity-v66/mobile-yaw-0-390x844-v66.jpg` (`390 × 844`). In-app Browser logs contain only Vite connection diagnostics and no warning/error entries.

### Comparison history, fixes and post-fix evidence

- [fixed from v65 P1 / mask-like facial stack] Reauthored the head into a narrower illustrated jaw with shallow cheek and chin planes, reduced the ears and blush marks, and replaced the protruding single nose with a restrained bridge/tip volume pair. The profile remains fully rotatable geometry rather than a camera-facing portrait.
- [fixed / high-contrast toy eyes] Rebalanced sclera, iris, pupil and glint sizes; replaced the cyclic black eye ring with a thin lower contour; reduced upper-lid, lash and brow weight. The live cast keeps readable expressions without two white discs becoming the first focal point.
- [fixed / coarse hair grouping] Eight narrower tapered fringe locks replace six broad slabs. Warmer lifted hair highlights preserve form in the civic key/fill without returning to glossy plastic facets.
- [fixed / muddy skin and white-costume collapse] Skin palettes are lighter and less grey, pale fabrics are separated from skin and walls with warmer hues, and the desktop face material now receives a restrained view-dependent warm wrap. The wrap is shader-based on the real facial mesh and does not change collision, rigging or scene readiness.
- [fixed / brittle locomotion sampling] The exploration gate now waits up to `2.5s` for the observable `idle && !transitioning` contract after key release. It still fails if the animation never settles, while avoiding a false failure when headless Chrome compiles the skin shader during an arbitrary `500ms` sample.
- [checked / embodied camera] The physical player moved `1.53m`, entered the authored walk clip, returned to settled idle and rotated the weighted 3D follow camera `65.3°`.

### Runtime and performance evidence

- Desktop yaw `0°`: `150` draw calls / `268,876` triangles. Desktop yaw `180°`: `159` draw calls / `282,320` triangles. Both stay below the strict `160 / 300,000` civic-room gate.
- Mobile `390 × 844`: `106` draw calls / `243,902` triangles, below the `110 / 250,000` gate; player and two nearest witnesses remain in the metre-based scene with joystick, chat, jump, contextual action and the full social-action rail.
- Character contract: four civic roles pass at `6.68 MB` total with `mirrorlife-civic-sculpt-v7`; role triangle counts are `24,784–27,596`, below the `35,000` per-role Web budget.
- World regression: all `26` interiors passed the physics audit; desktop/mobile scene flow passed; all `78` enter/exit transitions completed without failure or runtime error.
- Static/build checks: civic character/hero-prop validation, `pnpm check` and the Vite production build passed. The production build retains only the existing non-module-script and large-chunk advisories.

### Required fidelity surfaces

- [checked][interaction/motion] The target composition remains a live Y-up 3D room. WASD/touch locomotion, furniture collision, authored movement states, player-follow camera and drag orbit all read from the same spatial state.
- [checked][spacing/layout rhythm] The live hero frame preserves the source's bright portal, foreground records, central listening circle and background proposal/lounge zones. The `180°` evidence proves front, side and reverse actor geometry rather than a billboard solution.
- [checked][colors/tokens] Warm ivory remains dominant; teal/coral identify roles; brass marks navigation/evidence. Lighter skin, warmer pale cloth and restrained view-rim response improve separation without breaking the established palette.
- [checked][image and asset quality for this iteration] Facial planes, nose, eyes, brows, lashes and hair fringe are authored GLB geometry with real occlusion, lighting and reverse views. No sprite, CSS drawing or static room panorama replaces the playable scene.
- [checked][copy/content] Location, room memory, exit, contextual listening prompt and the four social verbs remain coherent and unchanged.
- [checked][responsiveness/accessibility] The `390 × 844` frame keeps all essential touch controls visible while the room remains below the mobile geometry and draw-call ceilings.
- [P1][production character fidelity] Facial hierarchy is materially cleaner, but the paired crop still shows simplified skin anatomy, rigid finger/prop contact, limited expression deformation, coarse rear hair masses and less cloth compression than the reference's production sculpt.
- [P1][environment craftsmanship] The spatial composition is close, but the source still has more bespoke joinery, woven storage, ceramics, paper/book density, upholstery tailoring and foreground micro-story assets.
- [P1][indirect-light/material response] The face wrap and lifted palette improve readability, but the reference retains softer portal bounce, subsurface skin, multi-scale contact shadows and broader object-specific roughness variation.
- [P2][HUD optical finish] The responsive interaction hierarchy works, but icon drawing, optical type weight, translucent layering and compact control spacing remain less refined than the reference.

### Gate result

This iteration closes the clearest facial-proportion, eye-outline, hair-fringe and muddy-material defects while preserving physical movement, player-follow orbit and mobile performance. The same-canvas comparison still contains actionable P1 production-character, bespoke-environment and indirect-material differences, so literal reference-quality parity remains unproven.

final result: blocked

Blocker: production facial/cloth deformation, bespoke narrative furniture craftsmanship and more natural indirect material response remain visible P1 differences.

## 2026-07-19 reference-fidelity v65 continuous limb centre-lines and sculpted footwear gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Current browser implementation: `dist/interior-3d-work/civic-fidelity-v65/desktop-yaw-0-1672x941-v65.png` (`1672 × 941`, public-plaza, yaw `0°`, final ready state).
- Same-canvas comparisons: `dist/interior-3d-work/civic-fidelity-v65/reference-vs-v65-full.png` and `reference-vs-v65-cast-focus.png`, with the reference on the left and the live implementation on the right.
- Complete desktop orbit: `desktop-yaw-{0,90,180,270}-1672x941-v65.png`; responsive evidence: `mobile-yaw-0-390x844-v65.png`.
- Product Design's in-app Browser reached `sceneReady=true` on desktop and mobile. Desktop warning/error logs were empty; desktop and mobile document dimensions matched their viewport exactly.

### Comparison history, fixes and post-fix evidence

- [fixed from v64 P1 / cylindrical limbs and toy joints] Upper arms, forearms, thighs and calves now follow authored bowed centre-lines with changing oval sections. Overlapping elbow and knee sleeves replace the exposed spherical bridges, so the hero, face and side views no longer read as ball-jointed dolls.
- [fixed / oversized mitten hands] The palm/finger mass is shorter and flatter, with a narrower wrist, tapered fingertip fan and shallower crease geometry. The role props and animation pivot contract remain unchanged.
- [fixed / capsule-on-box footwear] Shoes now use a seven-station, sixteen-sided last with distinct heel, ankle, instep, ball and rounded toe volumes plus role-specific sole colours. The first v65 browser pass exposed a wedge silhouette; the second exposed inward-facing side polygons. Both were rejected, corrected and recaptured before the full orbit.
- [checked / physical movement] The player moved `2.37m`, entered the authored walk clip, settled back to idle and rotated the weighted follow camera `65.3°`.
- [checked / atomic reveal] Cold asset revisions displayed only the room-matched loading shell until model, actor, physics and camera readiness; the finalized captures contain no old room or intermediate background.

### Runtime and performance evidence

- Desktop `0° / 90° / 180° / 270°`: `150 / 155 / 159 / 157` draw calls and `264,588 / 280,968 / 278,448 / 268,512` triangles. Every view stays below the strict `160 / 300,000` civic-room gate.
- Mobile `390 × 844`: `106` draw calls / `240,686` triangles, below the `110 / 250,000` gate; player and two nearest witnesses remain visible with movement, chat, jump, contextual action and the full social-action rail.
- Character contract: four civic roles pass at `6.24 MB` total with `mirrorlife-civic-sculpt-v6`; role triangle counts are `23,424–26,236`, including the continuous joint sleeves and rounded shoe lasts.
- World regression: all `26` interiors passed the physics audit; desktop/mobile scene flow passed; all `78` enter/exit transitions completed without failure or runtime error. The exploration test passed in isolation after one parallel-load timing miss, confirming `2.37m` locomotion and a settled idle blend.
- Static/build checks: civic character/hero-prop validation, `pnpm check` and the Vite production build passed. The build retains the existing non-module-script and large-chunk advisories.

### Required fidelity surfaces

- [checked][interaction/motion] The reference composition remains a real metre-based room with keyboard/touch locomotion, authored walk/run/jump states, furniture collision and drag orbit. The new topology preserves the same movement and pivot diagnostics rather than becoming a static render.
- [checked][spacing/layout rhythm] Portal and foreground records frame the cast; the listening ring, proposal wall and lounge hold the middle/background hierarchy. Four desktop yaws retain the player and functional landmarks.
- [checked][colors/tokens] Warm ivory is dominant, teal/coral identify social roles and brass remains the route/evidence accent. Dark role-specific footwear now anchors the characters without the rejected white wedge highlights.
- [checked][image and asset quality for this iteration] All citizens are full-volume GLBs with front/side/back geometry. The new limbs, palms and shoe lasts are authored meshes with correct face orientation, shadows and animation pivots; no sprite or static-room substitute is used.
- [checked][copy/content] Location, room memory, exit, contextual listening prompt and the four social verbs remain coherent and unchanged.
- [checked][responsiveness/accessibility] The `390 × 844` document reports `390 × 844` scroll dimensions; touch movement, jump, chat, contextual action and the four social verbs remain visible.
- [P1][character production sculpt] Continuous centre-lines and footwear remove the clearest toy-joint defects, but the paired cast crop still shows simplified facial planes, rigid finger contact, coarse hair grouping, limited cloth compression and flatter skin/cloth response than the reference's production character sculpt.
- [P1][environment craftsmanship] The gameplay layout and depth sequence are credible, but cabinet joinery, woven storage, ceramics, paper density, upholstery shaping and foreground object craftsmanship remain materially simpler than the source.
- [P1][indirect-light integration] The warm portal and character fill are coherent, but the reference still carries softer portal bounce, multi-scale contact shadows, skin subsurface response and more varied roughness. Current broad walls and hair shadow masses remain flatter.
- [P2][HUD optical finish] The responsive hierarchy works, but icon drawing, optical type weight, translucent layering and control spacing remain less refined than the reference HUD.

### Gate result

This iteration closes the visible ball-joint, cylindrical-limb and capsule-shoe regressions while preserving physical movement, complete orbit and mobile performance. The same-canvas comparison still contains actionable P1 production character, bespoke-environment and indirect-material differences, so literal reference-quality parity remains unproven.

final result: blocked

Blocker: production facial/cloth deformation, bespoke narrative furniture craftsmanship and more natural indirect material response remain visible P1 differences.

## 2026-07-19 reference-fidelity v64 facial silhouette, balanced civic light and complete-orbit gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Current browser implementation: `dist/interior-3d-work/civic-fidelity-v64/desktop-yaw-0-1672x941-v64.png` (`1672 × 941`, public-plaza, yaw `0°`, final ready state).
- Same-canvas comparisons: `dist/interior-3d-work/civic-fidelity-v64/reference-vs-v64-full.png` and `reference-vs-v64-cast-focus.png`, with the reference on the left and the live implementation on the right.
- Complete desktop orbit: `desktop-yaw-{0,90,180,270}-1672x941-v64.png`; responsive evidence: `mobile-yaw-0-390x844-v64.png`.
- Product Design's in-app Browser reached `sceneReady=true` on desktop and mobile. Desktop and mobile console warning/error lists were empty; the mobile document reported `scrollWidth=390` at a `390px` viewport.

### Comparison history, fixes and post-fix evidence

- [fixed from v58 P1 / protruding white-sphere eyes] Civic GLBs now use flatter sclerae, larger iris/pupil coverage, a restrained closed eye outline and reduced upper-lid thickness. The eyes remain expressive at gameplay distance without becoming the first high-contrast shape on every face.
- [fixed / generic circular torso] The shared base torso now carries a soft shoulder-to-waist taper in authored geometry. It preserves the existing pivot animation contract while reducing the stacked-capsule silhouette in front, side and reverse views.
- [fixed / harsh face-shadow split] The civic preset now carries stronger fill, hemisphere and warm bounce with a slightly lower key. The cast remains modelled by light, but facial features and white coats no longer fall into the earlier hard light/dark partition.
- [fixed / floor-light noise] Daylight dapple opacity was reduced from `0.50` to `0.34`, retaining the portal cue without competing with the brass route and listening ring.
- [fixed / weak foreground frame] The public record desk is larger and staged closer to the lower-left camera edge. It now creates an intentional foreground crop in the hero view and resolves as real side/back geometry in the `180°` and `270°` views.
- [fixed / animation regression flake] The exploration gate now waits for the actual authored `walk` transition instead of assuming a full four-character, post-processed frame always completes within `90ms`. The original failure reproduced as `idle !== walk`; the corrected gate then passed with `1.25m` of movement and `65.3°` of orbit.
- [checked / core interaction] Activating `倾听线索` selected the action, advanced the visible room memory to `3/3` and changed the contextual affordance to `再次聆听邻里共识圆桌`.

### Runtime and performance evidence

- Desktop hero view: `150` draw calls / `262,732` triangles at `1672 × 941`, below the strict `160 / 300,000` civic-room gate. All four captured yaws retain the player, the social circle and at least one functional landmark or the exit.
- Mobile `390 × 844`: `106` draw calls / `239,294` triangles, below the `110 / 250,000` gate; player plus the two closest witnesses remain visible with joystick, chat, jump, contextual action and all four social actions.
- Character contract: four civic roles pass at `6.64 MB` total with the `mirrorlife-civic-sculpt-v5` silhouette contract and complete authored animation clips.
- Embodied verification: the physical player moved `1.25m`, entered and left the authored walk state, and rotated the weighted follow camera `65.3°`.
- World regression: all `26` interiors passed the physics audit; desktop/mobile scene flow passed; all `78` enter/exit transitions completed without failure or runtime error.
- Static/build checks: civic character/hero-prop validation, `pnpm check` and the Vite production build passed. Vite continues to report the existing non-module script and large-chunk advisory warnings; neither blocks the current static deployment.

### Required fidelity surfaces

- [checked][interaction/motion] The reference composition is now a real playable room: WASD/touch movement, metre-based collision, authored locomotion, weighted player-follow framing and drag orbit remain coupled to the same spatial state.
- [checked][spacing/layout rhythm] Portal, foreground records, central listening ring, notice console and lounge create a readable foreground/middle/background sequence. The `90°`, `180°` and `270°` captures prove that the room is not a billboard and that the social focus survives camera rotation.
- [checked][colors/tokens] Warm ivory remains dominant; teal and coral identify social roles; brass is reserved for navigation/evidence; dark translucent HUD surfaces retain contrast. Softer fill improves face readability without flattening the warm daylight direction.
- [checked][image and asset quality for this iteration] All four citizens are full-volume GLBs with front/side/back geometry, real eye silhouettes and role-specific hair/costume secondary motion. Room props cast shadows and remain spatially coherent under orbit; no static room backdrop replaces exploration.
- [checked][copy/content] Location, room memory, exit, contextual listening action and the four social verbs remain coherent. The tested primary action produces a visible state transition rather than a decorative control.
- [checked][responsiveness/accessibility] `390 × 844` has no document overflow; touch movement, chat and jump remain visible, while the full action rail stays reachable at the bottom edge.
- [P1][character production sculpt] Eye hierarchy and torso taper are better, but the cast crop still shows rigid fingers, cylindrical forearms/calves, large shoes, simplified facial planes, coarse hair masses and limited cloth compression. The reference characters have continuous anatomy, finer strand grouping, articulated hand contact and materially richer skin/cloth response.
- [P1][environment craftsmanship] The functional layout and depth hierarchy now read clearly, but cabinetry joinery, desk objects, ceramics, woven storage, books/paper density and upholstery shaping remain visibly simpler. Several objects still read as clean modular primitives rather than bespoke narrative furniture.
- [P1][indirect-light integration] The softer fill fixes the harsh split, but the reference retains more natural portal-to-room bounce, softer multi-scale contact shadows, skin subsurface response and finer roughness variation. Current hair shadows can still crush to black, while broad walls remain comparatively flat.
- [P2][HUD optical finish] The interaction hierarchy works across viewports, but icon drawing, type weight, translucent depth, spacing and control detailing remain simpler than the reference HUD.

### Gate result

This iteration improves facial readability, softens civic light, strengthens the foreground frame and proves the full playable orbit on desktop and mobile. The paired canvas still contains actionable P1 character-sculpt, bespoke-environment and indirect-light differences, so literal reference-quality parity remains unproven.

final result: blocked

Blocker: production character anatomy/deformation, bespoke narrative furniture craftsmanship and more natural indirect material response remain visible P1 differences.

## 2026-07-19 reference-fidelity v58 portal daylight, cloth follow-through and foreground story-density gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Current browser implementation: `dist/interior-3d-work/civic-fidelity-v58/desktop-yaw-0-1672x941.png` (`1672 × 941`, public-plaza, yaw `0°`, final ready state).
- Same-canvas comparisons: `reference-vs-v58-full.png`, `reference-vs-v58-portal-focus.png` and `reference-vs-v58-cast-focus.png` in the same evidence directory.
- Complete desktop orbit: `desktop-yaw-{0,90,180,270}-1672x941.png`; responsive evidence: `mobile-yaw-0-390x844.png`.
- Product Design's in-app Browser was unavailable, so the project-approved local Chrome fallback was used. Desktop and mobile reached `sceneReady=true`, had no horizontal or vertical document overflow, and reported no console warning/error.

### Comparison history, fixes and post-fix evidence

- [fixed from v55 P1 / dark outdoor card] The civic open portal now renders its real courtyard raster as a daylight source rather than a lit wall material. The texture URL participates in `assetRevision`, removing the stale cached exterior that made source changes invisible. The focused comparison now has a bright exterior threshold and stronger foreground/background separation.
- [fixed / rigid skirt cone] Facilitator and mediator GLBs now contain a named `SkirtPivot` at the waist. The runtime preserves and batches that subtree separately, then applies restrained gait- and breath-driven follow-through. Runtime evidence records non-zero skirt rotation for both roles while their feet remain grounded.
- [fixed / sparse foreground records] The foreground record desk adds a file tray, four paper cards, glass rim, coaster and brass clip. Small opaque props are merged into one vertex-surface batch, increasing story density without increasing the room's draw-call ceiling.
- [fixed / unversioned texture regression] The exterior texture now follows the same query revision contract as GLB assets, so a hard reload and a fresh deployment cannot silently keep an older window image.
- [checked / core interaction] Activating `倾听线索` changed the selected action state and advanced the visible room memory to `3/3`; the contextual action changed to `再次聆听邻里共识圆桌`.

### Runtime and performance evidence

- Desktop `0° / 90° / 180° / 270°`: `150 / 155 / 159 / 157` draw calls and `258,060 / 274,440 / 271,504 / 261,984` triangles. All views remain below the strict `160 / 300,000` civic-room gate.
- Mobile `390 × 844`: `106` draw calls / `235,790` triangles, below the `110 / 250,000` mobile gate with the skirt subtree still independently animated.
- Embodied verification: the physical player moved `3.65m`; the weighted follow camera rotated `65.3°`. Four new yaw captures prove real side/reverse geometry and complete room orbit.
- World regression: all `26` interiors passed the physics audit; desktop/mobile scene flow passed; all `78` enter/exit transitions completed without failure or runtime error.
- Static/build checks: civic character/hero-prop contracts, `pnpm check` and the Vite production build passed.

### Required fidelity surfaces

- [checked][interaction/motion] Physical movement, player-weighted follow framing, 360° orbit and the social action loop remain live. Skirt motion is attached to the real character hierarchy instead of a screen effect.
- [checked][spacing/layout rhythm] The portal, foreground cabinet/desk, listening circle, notice console and lounge establish a readable three-depth composition; all four yaw views retain the player plus a functional landmark.
- [checked][colors/tokens] Warm ivory, teal/coral identity colours, oak/walnut and brass remain coherent. The exterior is now intentionally the brightest local value, matching the reference's entrance hierarchy without lifting the whole room exposure.
- [checked][image and asset quality for this iteration] The courtyard uses a real project raster with correct crop/UVs and cache revision. Characters and props remain full-volume geometry with side/back evidence; no static room backdrop replaces exploration.
- [checked][copy/content] Location, room memory, exit, contextual listening action and the four social verbs remain coherent. The tested action produces a visible state change.
- [checked][responsiveness/accessibility] `390 × 844` has no page overflow; joystick, chat, jump, contextual action and all four social actions remain visible. Mobile keeps the public room below its rendering budget.
- [P1][character production sculpt] The new skirt follow-through fixes one rigid costume layer, but the same-canvas cast crop still shows simplified cylindrical anatomy, large hands/feet, flatter facial planes, sparse strand-group hair and limited cloth compression compared with the reference's production character sculpt.
- [P1][environment craft and composition] The brighter threshold closes the local-light blocker, but the reference still has a physically open garden door, finer cabinet joinery, woven/ceramic/paper material breakup and a denser foreground that frames the cast. Current broad wall and floor regions remain simpler and the display cabinet reads more like a modular game prop.
- [P1][lighting integration] The portal itself is now bright, but exterior-to-interior bounce, face fill, contact-shadow softness and dapple continuity are still less natural than the reference. The doorway crop is slightly hotter and less spatially integrated than the source.
- [P2][HUD optical finish] Information hierarchy and interaction pass, but icon design, type weight, translucent depth and spacing are visibly simpler than the reference HUD.

### Gate result

This iteration materially improves the strongest remaining local-light mismatch, adds real cloth follow-through and increases foreground narrative density while preserving physical movement, complete orbit and mobile performance. The paired canvases still contain actionable P1 character-sculpt, environment-craft and indirect-light integration differences, so literal reference-quality parity remains unproven.

final result: blocked

Blocker: production character sculpt/deformation, broader bespoke environment craftsmanship and more natural indirect light integration remain visible P1 differences.

## 2026-07-19 reference-fidelity v55 continuous sculpt and calibrated civic light gate

### Evidence inspected together

- Source visual truth: `design/references/civic-interior-visual-target.png` (`1672 × 941`).
- Current browser implementation: `dist/interior-3d-work/civic-fidelity-v55/desktop-yaw-0-final.png` (`1672 × 941`, public-plaza, yaw `0°`, final ready state).
- Same-canvas full/focused comparisons: `dist/interior-3d-work/civic-fidelity-v55/reference-vs-v55-full.png` and `reference-vs-v55-focus.png`.
- Complete desktop orbit: `dist/interior-3d-work/civic-fidelity-v55/desktop-yaw-{0,90,180,270}.png`.
- Responsive evidence: `dist/interior-3d-work/civic-fidelity-v55/mobile-yaw-0-390x844.png` (`390 × 844`).
- In-app Browser was unavailable after selection, so the Product Design browser rule permitted the available Chrome extension fallback. Every final capture reached `interiorRenderPhase=ready` / `sceneReady=true`; final desktop and mobile console warning/error lists were empty.

### Comparison history, fixes and post-fix evidence

- [fixed from v52 P1 / ball-jointed silhouette] Rebuilt shoulders as integrated rounded upper-arm topology instead of separate spherical caps. Side and reverse captures no longer expose detached toy-ball joints.
- [fixed / mitten hands and detached props] Replaced pill fingers with a continuous sculpted palm/finger mass plus shallow crease geometry, and moved the facilitator notebook into real palm contact. Rounded shoe uppers replace the previous box profile.
- [fixed / rigid costume and sheared hair] Added a true pleated skirt, tailored coat/lapel panels and path-aligned tapered hair locks. Fringe is shorter so eyes remain readable in the `180°` face view; braids and side hair follow curved local frames instead of shearing across horizontal rings.
- [fixed / asset weight] The four regenerated GLBs remain full-volume side/back geometry while dropping ten source meshes per role. The validated cast is `6.46 MB`; role triangle counts are `22,544–25,356`.
- [fixed from v53 P1 / overbright low-saturation grade] Rebalanced the civic key, portal wash, actor-only rim/face fill, environment response, rug value and tone-mapped dapple. The first lighting iteration was rejected at mean luminance `0.450` / saturation `0.506`; the post-fix browser frame reaches `0.516 / 0.433`, closely tracking the reference's `0.518 / 0.427` without replacing the scene with a static backdrop.
- [fixed / mobile visual drift] The same civic grade now runs at a reduced `0.72` strength on mobile. The final `390 × 844` capture keeps player, two witnesses, joystick, chat, jump, contextual action and the full action rail visible with no horizontal overflow.

### Runtime and performance evidence

- Desktop `0° / 90° / 180° / 270°`: `149 / 154 / 158 / 156` draw calls and `255,472 / 271,852 / 268,916 / 259,396` triangles. Every view remains below the strict `160 / 300,000` civic-room gate.
- Mobile `390 × 844`: `106` draw calls / `233,202` triangles, below the `110 / 250,000` mobile gate even with the reduced-strength grade enabled.
- Embodied verification: the physical player moved `3.53m`; the weighted follow camera rotated `65.3°`. Four stabilized yaw captures prove real front, side and reverse geometry rather than a billboard or pre-rendered panorama.
- World regression: all `26` interiors passed the physics audit; `78` enter/exit transitions completed with no failure or runtime error; desktop/mobile scene flow passed.
- Static/build checks: `pnpm check`, production build, civic character validation and civic prop validation passed.

### Required fidelity surfaces

- [checked][interaction/motion] WASD/touch locomotion, shared physical coordinates, animated stride, player-weighted follow pivot and drag orbit remain coupled. The lighting/material pass changes only real-time rendering and does not weaken collision or camera behavior.
- [checked][spacing/layout rhythm] Portal, notice wall, listening circle, lounge and foreground records still create a readable foreground/middle/background sequence in the hero view. Four yaws retain actors plus at least one functional landmark.
- [checked][colors/tokens] Whole-frame mean luminance and saturation now closely match the source. Ivory architecture, darker honey wood, teal/coral identity, brass routes and restrained dark HUD preserve the source's warm-neutral / identity-color / accent hierarchy.
- [checked][image and asset quality for this iteration] Characters, furniture, foliage, rug, terrazzo and window are project assets or Three.js meshes with true depth, shadows and side/back views. No static room background, screen-facing citizen card, CSS drawing or placeholder image substitutes the target.
- [checked][copy/content] Location, exit, story-memory and four social actions remain coherent and unchanged.
- [checked][responsiveness/accessibility] `390 × 844` has no horizontal overflow; touch controls stay visible and practical. The player and current action remain inside the portrait safe composition.
- [P1][character sculpt and deformation] The new continuous silhouettes are materially better, but the source still has authored facial anatomy, smaller hands, more natural limb taper, cloth compression/folds, layered strand-group hair and skin/cloth deformation. The focused comparison still reads as production illustration versus modular web rig.
- [P1][local light distribution] Global colour statistics now match, but the implementation's dark percentile remains lower (`0.169` versus `0.221`) and bright percentile remains lower (`0.751` versus `0.799`). The portal/outdoor view, face bounce and sun patches need more localized dynamic range rather than another global exposure change.
- [P1][environment craftsmanship and density] The functional zones match, but the target carries richer cabinetry joinery, baskets, ceramics, paper stacks, books, textiles and foreground desk detail. Current large wall/floor regions remain visibly simpler.
- [P2][HUD finish] Information and interaction are clear, but optical type weights, icon drawing, translucent-panel layering and spacing remain simpler than the reference.

### Gate result

This iteration closes the largest overexposure/saturation error, improves character continuity and preserves genuine physical walking, player-follow framing, full orbit and mobile budgets. The paired canvas still contains actionable P1 character deformation, localized daylight and bespoke environment-craft differences, so literal reference-quality parity remains unproven.

final result: blocked

Blocker: production character deformation, localized portal/daylight response and a broader set of bespoke micro-assets remain visible P1 differences.

## 2026-07-19 reference-fidelity v52 authored motion clips and state-blend gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Current browser implementation: `dist/interior-3d-work/civic-fidelity-v52/desktop-yaw-0-1672x941.png` (`1672 × 941`, public-plaza, yaw `0°`).
- Same-canvas full/focused comparisons: `dist/interior-3d-work/civic-fidelity-v52/reference-vs-v52-full.png` and `reference-vs-v52-focus.png`.
- Complete desktop orbit: `dist/interior-3d-work/civic-fidelity-v52/desktop-yaw-{0,90,180,270}-1672x941.png`.
- Responsive evidence: `dist/interior-3d-work/civic-fidelity-v52/mobile-yaw-{0,180}-390x844.png` (`390 × 844`).
- Embodied motion evidence: `dist/interior-3d-work/civic-fidelity-v52/player-walk-1280x720.png`, captured while the physical player was in the authored walk state.

### Earlier findings, fixes and post-fix evidence

- [fixed from v51 P1 / procedural-only acting] Replaced the civic cast's unrelated per-frame joint overrides with a versioned seven-clip motion library: `idle`, `walk`, `run`, `listen`, `gesture`, `jump` and `fall`. Each clip has explicit timing and reviewable full-body key poses covering root lift, torso, head, shoulders, elbows, hips and knees.
- [fixed / abrupt state changes] Movement, stopping, airborne motion and social behavior now crossfade over `90–220ms`. The runtime carries the outgoing pose through the transition rather than snapping every joint to the next state's first frame.
- [fixed / social silhouette repetition] Listener, facilitator and mediator share locomotion timing but receive authored role offsets for listening. The facilitator continues to hold the notebook near the body, the mediator keeps the thinking hand nearer the face and the listener uses a more open arm line.
- [fixed / locomotion legibility] Walk/run cadence is phase-locked to the physics controller's `walkPhase`. An automated six-sample gate verifies a real alternating stride instead of accepting a single potentially neutral passing pose; the captured player walk shows one foot lifted while the contact shadow remains planted on the floor.
- [fixed / animation observability] Runtime diagnostics now expose animation contract version, current clip, transition state, root lift and principal limb rotations. Character validation also rejects stale manifests, missing clips, invalid timing or non-finite key tracks.
- [checked / browser state] Same-size in-app browser captures report player `idle` plus three role-specific `listen` states on desktop, with no console warning/error. Mobile retains player plus the two closest witnesses under its existing actor LOD.

### Runtime and performance evidence

- Desktop `0° / 90° / 180° / 270°`: `149 / 154 / 158 / 156` draw calls and `259,544 / 275,924 / 272,988 / 263,468` triangles. Every view remains below the strict `160 / 300,000` civic-room gate.
- Mobile `0° / 180°`: `106 / 108` draw calls and `233,082 / 240,154` triangles, below the `110 / 250,000` mobile gate.
- Embodied verification: the repeatable exploration gate entered the authored walk clip, sampled a non-neutral alternating stride, moved the player `3.21m`, blended back to settled idle and rotated the follow camera `65.3°`.
- World regression: all `26` interiors passed the physics audit; `78` enter/exit transitions completed with no failure or runtime error; desktop/mobile scene flow passed.
- Static/build checks: `pnpm check`, production build, civic character validation and civic prop validation passed.

### Required fidelity surfaces

- [checked][interaction/motion] The player walks, runs, jumps and falls inside the metre-based physical world while the follow camera remains coupled to the controlled actor. Locomotion animation reads the same controller phase instead of visually skating independently from displacement.
- [checked][spacing/layout rhythm] The closer editorial framing, centre listening circle and role-specific silhouettes preserve one dominant social focus. Four stabilized yaw captures retain the player and at least one functional landmark; the initial transient `180°` capture was rejected and recaptured only after the camera reached its target yaw.
- [checked][colors/tokens] Warm ivory architecture, teal/coral civic roles, brass evidence routes and the dark translucent HUD remain consistent with the prior approved palette hierarchy.
- [checked][image quality for this iteration] The motion system adds no billboard, CSS drawing or placeholder asset. All animated silhouettes remain full-volume GLB geometry with side/back views, real facial pivots and articulated limbs.
- [checked][copy/content] Location, exit, story-memory and four social actions remain coherent and unchanged.
- [checked][responsiveness/accessibility] At `390 × 844`, joystick, contextual action, chat, jump and the complete action rail remain visible without horizontal overflow; both portrait yaws stay within mobile geometry budgets.
- [P1][character sculpt/deformation] Authored timing closes the procedural-motion gap, but the source still has continuous sculpted anatomy, articulated fingers, cloth/hair deformation and more nuanced hand contact. Current web characters animate rigid pivot sections and remain visibly blockier in the focused same-canvas comparison.
- [P1][lighting/material finish] The source still carries offline bounced color, subsurface skin, softer multi-scale penumbrae and object-specific roughness breakup. Current GTAO, portal key and raster floor are coherent but flatter.
- [P1][environment asset density] Cabinet joinery, ceramics, woven storage, paper/book stacks and lounge micro-props remain less numerous and less bespoke than the source.
- [P2][HUD finish] Information hierarchy and interaction are clear, but optical type weights, compact icon drawing and translucent-panel microdetail remain simpler than the target artwork.

### Gate result

This iteration turns civic acting into a deterministic, blendable animation system and proves that it stays synchronized with physical movement, follow-camera rotation, responsive layouts and scene budgets. The paired reference/implementation canvas still contains actionable P1 character-deformation, indirect-lighting and bespoke-environment differences, so literal reference-quality parity remains unproven.

final result: blocked

Blocker: continuous character/cloth deformation, offline-grade indirect material response and broader bespoke environment assets remain visible P1 differences.

## 2026-07-19 reference-fidelity v51 authored terrazzo, organic joints and complete-orbit budget gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Current browser implementation: `dist/interior-3d-work/civic-fidelity-v51/desktop-yaw-0-1672x941.png` (`1672 × 941`, public-plaza, yaw `0°`).
- Same-canvas full/focused comparisons: `dist/interior-3d-work/civic-fidelity-v51-full.png` and `dist/interior-3d-work/civic-fidelity-v51-focus.png`.
- Complete desktop orbit: `dist/interior-3d-work/civic-fidelity-v51/desktop-yaw-{0,90,180,270}-1672x941.png`.
- Responsive evidence: `dist/interior-3d-work/civic-fidelity-v51/mobile-yaw-{0,180}-390x844.png` (`390 × 844`).

### Earlier findings, fixes and post-fix evidence

- [fixed from v45 P1 / floor image quality] Replaced the runtime-drawn civic terrazzo with the authored `1024 × 1024` raster asset at `public/assets/interiors/textures/civic-terrazzo-basecolor-v1.png`. The texture is preloaded with the Three.js runtime before the final room is exposed, uses sRGB colour, repeat wrapping and anisotropic filtering, and no longer swaps in after scene reveal.
- [fixed / architectural scale] The first v46 capture showed aggregate chips that read as oversized stones. The final v51 floor repeats at `4.8 × 4.8`, bringing the visible aggregate down to believable architectural scale while preserving the reference's warm ivory/cool-grey mineral breakup.
- [fixed from v45 P1 / robot joints] Shoulder, elbow and knee bridge volumes were reduced and upper-arm roots widened. The regenerated GLBs now overlap their tapered limb profiles through the pivots instead of exposing large ball-joint silhouettes; the complete rig contract remains intact.
- [fixed / editorial contrast] The civic light preset now carries lower exposure and key/wash intensity plus a restrained contrast/saturation grade. Floor chips, brass routes, teal upholstery, white coats and skin no longer collapse into the same pale value range.
- [fixed / composition scale] Desktop civic FOV changed from `43°` to `41°` and follow distance from `5.12m` to `5.0m`. The cast is larger and more legible while the portal, notice wall, lounge and action rail remain in frame.
- [fixed / complete-orbit performance] Reverse views initially reached `169` draw calls. Narrowing the dynamic far-wall visibility arc keeps authored landmarks in the reverse composition while reducing the final maximum to `158` without deleting the navigable loop.

### Runtime and performance evidence

- Desktop `0° / 90° / 180° / 270°`: `149 / 154 / 158 / 156` draw calls and `259,544 / 275,924 / 272,988 / 263,468` triangles. Every view remains below the strict `160 / 300,000` civic-room gate.
- Mobile `0° / 180°`: `106 / 108` draw calls and `233,082 / 240,154` triangles, below the `110 / 250,000` mobile gate.
- Character asset contract: four shared-pivot roles pass at `7.23 MB` total; regenerated roles use `24,656–26,732` triangles.
- Embodied verification: automated exploration moved the player `3.05m` and rotated the follow camera `65.3°`; desktop and mobile scene flow passed.
- World regression: all `26` interiors passed the physics audit; `78` enter/exit transitions completed with no failure or runtime error.
- Static/build checks: `pnpm check`, production build, civic character validation and civic prop validation passed.

### Required fidelity surfaces

- [checked][spacing/layout rhythm] The closer editorial camera strengthens the player/cast hierarchy without losing the foreground desk, portal, notice console or lounge. Four desktop yaws and two portrait yaws keep a functional landmark or exit readable.
- [checked][colors/tokens] Warm ivory remains dominant; teal and coral separate civic roles; brass is reserved for evidence routes and the listening circle. The revised grade adds separation without recolouring the dark HUD.
- [checked][image quality] The floor now consumes a project-bound raster material asset rather than a generated canvas approximation. It remains sharp at the hero viewport and loads before scene reveal.
- [checked][copy/content] Existing location, story-memory, exit and four social actions remain coherent and unchanged.
- [checked][responsiveness/accessibility] At `390 × 844`, joystick, contextual action, chat, jump and the four-action rail remain visible with no horizontal overflow; controls preserve practical touch sizes.
- [checked][interaction] The character walks through the physical world, the camera follows the player, pointer/touch orbit remains 360-degree, and all actors retain real side/back geometry rather than billboards.
- [P1][characters] The reference still has sculpted continuous anatomy, richer cloth topology, layered strand-group hair, natural hand poses and authored full-body acting. The current shared-pivot citizens are more organic than v45 but still read as modular web characters in the focused same-canvas comparison.
- [P1][lighting/material finish] The authored floor and stronger grade close the largest surface gap, but the source still has offline bounced light, subsurface skin, multi-scale shadow softness and bespoke UV response on most props.
- [P1][environment asset density] The functional composition matches, but cabinetry joinery, ceramics, woven storage, paper stacks and lounge accessories remain visibly simpler and less numerous than the source.
- [P2][HUD finish] Hierarchy and interaction are clear, but icon drawing, optical type weights and translucent-panel microdetail remain simpler than the reference.

### Gate result

This iteration materially improves the most visible floor material, character joint silhouettes, camera scale, contrast and every-angle performance while preserving physical walking and full orbit. The paired reference/implementation canvas still contains actionable P1 character-sculpt, indirect-lighting and bespoke-prop differences, so literal reference-quality parity remains unproven.

final result: blocked

Blocker: production character sculpt/cloth acting, offline-grade indirect material response and broader bespoke environment assets remain visible P1 differences.

## 2026-07-18 reference-fidelity v24 articulated silhouette, prop inertia and portrait-follow gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Current browser implementation: `dist/interior-3d-work/civic-fidelity-v24/desktop-yaw-0.png` (`1280 × 720`, public-plaza, yaw `0°`).
- Same-canvas full/focused comparisons: `dist/interior-3d-work/civic-fidelity-v24-full.png` and `civic-fidelity-v24-focus.png`.
- Complete orbit: current `desktop-yaw-0.png` / `desktop-yaw-90.png` plus unchanged desktop camera evidence `civic-fidelity-v20/desktop-yaw-{180,270}-v23.png`; responsive evidence: `civic-fidelity-v24/mobile-390x844-v25.png` (`390 × 844`).
- Embodied mobile evidence: `civic-fidelity-v24/mobile-walk-v25.png`, captured after a real joystick drag with the player and follow-camera pivot both advancing.

### Implemented and verified

- [fixed from v19 P1 / articulated silhouette] Civic shoulders now end in rounded caps, elbow gaps receive tapered bridges and limb cylinders narrow through the joint. Fringe and crown mass were reduced and hair roughness increased, removing the hardest toy-plastic highlights at gameplay distance.
- [fixed / secondary motion] Backpack, satchel and ponytail are retained as real named pivots in the desktop GLB LOD. Walk/run cadence adds restrained lift, sway and lag; idle breathing settles them without detaching visual geometry from the character root. Runtime stats expose each delta for regression checks.
- [fixed / authored asset contract] The Blender masters, generated GLBs, manifest and validator agree on `BackpackPivot`, `Satchel` and `PonytailPivot`. Four roles pass the asset contract at `6.42 MB` total and `20,660–22,768` triangles per role.
- [fixed / atomic visual evidence] Environment capture now waits for `interiorRenderPhase === "ready"`, preventing the lightweight loading shell from being misreported as the final room.
- [fixed / portrait composition] Mobile camera focus now weights the player at 80% and clamps the post-safe-area focus to within `0.68m` of the controlled character. A real joystick drag moves both player and pivot, so walking near the shell no longer leaves the avatar stranded at the screen edge while the camera follows the room centre.
- [checked / movement and orbit] A clean Chrome exploration run moved the 3D player `1.25m` during the fixed input window and rotated the follow camera `65.3°`. The earlier `0.292m` reading did not reproduce when the verifier ran alone; no motion thresholds or physical parameters were weakened to obtain the passing result.

### Runtime and performance evidence

- Desktop yaw `0°`: `145` draw calls / `246,144` triangles; yaw `90°`: `152` draw calls. Both remain below the strict `160 / 300,000` core-room gate.
- Mobile `390 × 844`: `110` draw calls / `223,302` triangles, within the `110 / 250,000` gate. Mobile intentionally batches secondary accessories instead of paying the desktop articulation cost.
- Static and build checks: `pnpm check`, production build, civic character validation, civic prop validation and all `26` zones / `10` archetypes passed.
- Runtime checks: character exploration, scene-flow and transition-stress completed successfully against the local QA server after the portrait camera change.

### Required fidelity surfaces

- [checked][interaction/follow camera] Player movement is physical, the camera follows the moving actor rather than a fixed diorama centre, and pointer orbit preserves a complete navigable 360-degree room.
- [checked][responsiveness] At `390 × 844`, player, two witnesses, joystick, jump/chat and the action rail remain reachable without horizontal overflow; the new focus clamp keeps the controlled actor in the playable composition.
- [checked][asset integrity] Hair and all moving accessories have full side/back geometry and are rooted in the generated GLB rather than screen-facing sprites or runtime placeholder boxes.
- [P1][characters] The target still has sculpted hand topology, cloth folds, layered hair anatomy, expressive poses and production animation clips. The current modular rigs read clearly but remain boxier and less emotionally specific in the same-canvas comparison.
- [P1][lighting/material finish] Material roughness and contact depth have improved, but the reference still carries stronger indirect bounce, skin/cloth separation, multi-scale shadow softness and object-specific surface breakup.
- [P1][reverse-room authorship] The `90°` view exposes a conspicuous blank secondary wall. It needs a functional architectural landmark and authored dressing without shrinking the collision-safe walking loop.
- [P2][HUD finish] Controls remain usable, but icon drawing, optical type weights and translucent-panel microdetail are still visibly simpler than the reference.

### Gate result

This iteration strengthens the controlled character's physical silhouette, gives carried objects believable inertia and fixes portrait follow-camera composition without sacrificing 360-degree exploration or mobile budgets. The same-canvas comparison still shows actionable P1 character sculpt, indirect-lighting and reverse-wall gaps, so literal reference-quality parity is not yet proven.

final result: blocked

Blocker: production character/cloth animation, richer indirect material response and an authored reverse-wall landmark remain visible P1 differences.

## 2026-07-18 reference-fidelity v19 editorial foliage, rug surface and embodied-motion gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Current browser implementation: `dist/interior-3d-work/environment-review/00-public.png` (`1920 × 1080`, public-plaza, yaw `0°`).
- Same-canvas full/focused comparisons: `dist/interior-3d-work/civic-fidelity-v19-full.png` and `civic-fidelity-v19-focus.png`.
- Complete orbit: `environment-review-yaw-{90,180,270}/00-public.png`; responsive evidence: `environment-review-mobile/00-public.png` (`390 × 844`).
- Embodied-motion evidence: `dist/interior-3d-work/civic-player-walk-v19.png` (`1280 × 720`, live W-key movement with the follow camera active).

### Earlier findings, fixes and post-fix evidence

- [fixed from v18 P1 / secondary density] The portal, lounge and right foreground now receive three authored editorial foliage clusters using curved-volume leaves, stems, ceramic pots and a complete woven basket. They sit behind fixed furniture or against the wall, frame the hero view and remain present in side/reverse shots without promising false walkable space.
- [fixed / tall-shell termination] Desktop adds a restrained plaster/brass ceiling cove so the cylindrical room ends as designed architecture instead of blank wall panels. The first mobile capture exposed the near cove as a horizontal obstruction; the cove is now desktop-only and the post-fix `390 × 844` capture has no obstruction.
- [fixed from v18 P1 / centre surface] The listening rug now carries a dedicated 512px woven colour texture with subtle radial botanical emboss, linen variation and low-contrast teal rings. It remains a horizontal 3D receiver under the characters rather than a screen overlay. Mobile deliberately keeps the simpler batched fabric surface.
- [fixed / cinematic material separation] A public-room-only desktop grade adds restrained warm/cool separation, saturation, contrast and an 8.5% edge vignette after GTAO and before output tone mapping. It is disabled on mobile and does not affect HUD colour.
- [fixed from v18 P1 / embodied motion] Walking now adds speed-aware forward lean and alternating body roll while retaining fixed floor shadows. The player settles into an asymmetric one-leg idle stance instead of snapping back to a rigid mirrored mannequin pose. Live movement evidence shows a raised stepping foot, planted support foot and follow-camera progression without clipping.
- [checked / runtime spatial truth] Foliage is staged behind existing collision-safe hero furniture or at the non-walkable shell edge; the 26-zone physics audit and 2.81m movement test remain green.

### Runtime and performance evidence

- Desktop `0° / 90° / 180° / 270°`: `140/241,056`, `147/244,980`, `155/256,072`, `150/247,416` draw-calls/triangles. All remain below the strict `160 / 300,000` public-room gate.
- Mobile `390 × 844`: `110` draw calls, `219,486` triangles, `85` geometries and `12` textures, at or below the `110 / 250,000` gate.
- Browser interaction: four civic GLB roles loaded; WASD moved the player `2.81m`; pointer drag rotated the follow camera `65.3°`; the explicit walking capture verifies the rendered mid-stride pose.
- Regression: syntax checks and production build passed; civic character/prop contracts passed; 26 zones / 10 archetypes passed physics; 78 enter/exit transitions completed with no failure/runtime error; desktop/mobile scene flow passed.

### Required fidelity surfaces

- [checked][spacing/layout] Portal foliage, foreground desk, listening circle, notice wall and lounge now produce a stronger foreground/middle/background sequence while preserving the deterministic walking loop.
- [checked][colors/tokens] Warm neutral architecture remains dominant; teal/coral carry civic identity; brass is reserved for routes and evidence. The post grade improves edge depth without shifting the HUD palette.
- [checked][image/asset quality for this iteration] New plants have full side/back volume, ceramic/basket material contrast and complete orbit evidence; the rug texture remains sharp at the hero viewport and disappears cleanly at mobile LOD.
- [checked][copy/content] Existing location, exit, listening action and story-memory copy remains unchanged and coherent.
- [checked][responsiveness] The initial mobile cove obstruction was caught and removed. Final `390 × 844` has no horizontal overflow, clipped primary action or scene-wide foreground obstruction.
- [P1][characters] The target still has production sculpted anatomy, layered hair, cloth folds, hand topology and authored full-body animation clips. Current characters have real 3D volume, facial morphs and better procedural motion but remain a modular Web LOD.
- [P1][lighting/material finish] The realtime grade and foliage improve depth, but the source still has offline bounced colour, subsurface skin, multi-scale soft shadows and bespoke per-object UV wear that are visibly richer.
- [P1][remaining secondary assets] Plants and rug close two prominent gaps; wall joinery, ceramics, woven storage, books/paper and small lounge props still need broader bespoke mesh/UV treatment for literal frame parity.
- [P2][HUD finish] Hierarchy and controls are functional across breakpoints, but icon drawing, optical type balance and translucent-panel microdetail remain simpler than the reference artwork.

### Gate result

This pass materially improves environmental density, centre-surface finish and the physical feel of walking while preserving the requested follow camera and complete 360-degree room. The same-canvas comparison still contains actionable P1 production-character, secondary-asset and offline-lighting differences, so literal reference-quality parity is not yet proven.

final result: blocked

Blocker: production character sculpt/cloth animation, remaining bespoke secondary assets and offline-grade indirect material response remain actionable P1 differences.

## 2026-07-18 reference-fidelity v18 character silhouette, material hierarchy and daylight-depth gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Current browser implementation: `dist/interior-3d-work/environment-review/00-public.png` (`1920 × 1080`, public-plaza, yaw `0°`).
- Same-canvas full/focused comparisons: `dist/interior-3d-work/civic-fidelity-v18-full.png` and `civic-fidelity-v18-focus.png`.
- Complete orbit: `environment-review-yaw-{90,180,270}/00-public.png`; responsive evidence: `environment-review-mobile/00-public.png` (`390 × 844`).
- Canonical character review: `dist/interior-3d-work/civic-character-canonical-v18/civic-player/{front,left,isometric}.png`.

### Implemented and verified

- [fixed from v16 P1 / toy-like silhouette] All four citizens now use narrower upper arms, forearms, hands, thighs, shins, cuffs and shoes. The head mesh has a restrained illustrated jaw taper, while the player vest, scarf and side hair no longer inflate the torso/neck silhouette.
- [fixed / facial artifact] The separate glossy lower-lip mesh was removed after canonical lighting exposed it as a floating moustache at gameplay distance. Closed speech is again one clean ink contour; the modeled dark mouth and tongue remain available for the talking state.
- [fixed / crown readability] The player's symmetric crown points that read as cat ears in reverse orbit were replaced by one lower, asymmetric swept ridge. Hair still has true side/back volume and remains fully rotatable.
- [fixed from v16 P1 / material hierarchy] The civic display case changed from pale coral toy plastic to oak, walnut, teal and brass. The public room now has warmer ivory/plaster values, restrained terrazzo contrast, stronger portal dapple, denser contact shadows and less environment flattening.
- [fixed / shared authored contract] Character and display changes are regenerated from the Blender masters. Named face/expression pivots, metre scale, collider alignment and the existing Three.js animation controls remain intact.
- [checked / complete orbit and responsive composition] Four desktop yaws keep the cast, current objective and either the exit or functional landmark readable. Mobile retains player, two witnesses, joystick, jump/chat and the complete action rail without horizontal overflow.

### Runtime and performance evidence

- Character assets: four GLBs pass the pivot/morph/semantic contract at `6.13 MB` total. Player is `19,468` authored triangles after the silhouette cleanup; the full cast remains below the scene budget.
- Hero furniture: three Blender GLBs pass validation at `26,596` aggregate authored triangles.
- Desktop `0° / 90° / 180° / 270°`: `136/217,504`, `143/221,348`, `151/232,440`, `146/223,784` draw-calls/triangles. All remain below the strict `160 / 300,000` public-room gate.
- Mobile `390 × 844`: `108` draw calls, `215,774` triangles, `85` geometries and `12` textures, below the `110 / 250,000` gate.
- Interaction regression: WASD moved the player `2.93m`; pointer drag rotated the follow camera `65.3°`.
- System regression: syntax checks and production build passed; 26 zones / 10 archetypes passed physics; 78 enter/exit transitions completed with no failure/runtime error; desktop/mobile scene flow and civic character/prop validators passed.

### Required fidelity surfaces

- [checked][first-read composition] The entrance/daylight, listening circle, foreground evidence desk, public notice wall and lounge create a clear front/middle/back read. The center remains walkable instead of duplicating an offline beauty render that has no playable route.
- [checked][palette/material hierarchy] Warm neutral plaster and terrazzo dominate; teal/coral identify civic roles and furniture; brass is limited to navigation/evidence emphasis. The display case no longer breaks this hierarchy.
- [P1][characters] Silhouette and facial cleanup are materially better, but the target still uses production sculpted anatomy, cloth folds, hair cards/strands, authored hand posing and full-body animation clips. Current characters remain a modular pivot-rig Web LOD.
- [P1][lighting/material finish] Direction, dapple and contact depth improved, but the reference's offline bounced colour, soft multi-scale penumbrae, subsurface skin and bespoke UV wear still produce visibly richer material separation.
- [P1][secondary asset density] The hero clusters are authored, but threshold foliage, ceramics, paper clutter, wall joinery and the remaining side furniture need the same bespoke mesh/UV finish for literal frame parity.
- [P2][HUD finish] Desktop and mobile hierarchy are clear and functional, but icon drawing, optical type balance and translucent-panel microdetail remain simpler than the reference artwork.

### Gate result

This pass removes the largest toy-like character and display-material defects while preserving real movement, follow camera, full orbit, collision and mobile budgets. The same-canvas comparison still shows actionable P1 sculpt, secondary-asset and offline-lighting gaps, so literal reference-quality parity is not yet proven.

final result: blocked

Blocker: production character sculpt/cloth animation, remaining secondary bespoke assets and offline-grade indirect material response remain actionable P1 differences.

## 2026-07-18 reference-fidelity v16 authored hero-furniture and complete-orbit gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Current browser implementation: `dist/interior-3d-work/environment-review/00-public.png` (public-plaza, yaw `0°`).
- Same-canvas full/focused comparisons: `dist/interior-3d-work/civic-fidelity-v16-full.png` and `civic-fidelity-v16-focus.png`.
- Complete orbit: `environment-review-yaw-{90,180,270}/00-public.png`; responsive evidence: `environment-review-mobile/00-public.png` (`390 × 844`).

### Earlier findings, fixes and post-fix evidence

- [fixed from v15 P1 / generic hero furniture] The left display, central notice/console and right lounge are no longer runtime arrangements of reusable rounded primitives. They are three authored Blender GLBs with real joinery, inset doors, glass, trays, ceramics, pinned papers, brass lamps, a woven basket, separated sofa cushions, coffee-table dressing and a complete bookcase.
- [fixed / authored material hierarchy] The civic hero loader preserves the assets' oak, walnut, teal, coral, cork, ceramic, paper, brass and glass palette instead of snapping those colors to the generic archetype swatches. Opaque surfaces retain individual roughness/metalness in one vertex-surface batch; glass remains its own transparent batch.
- [fixed / spatial contract] The three visible models and their fixed colliders share the same `INTERIOR_ZONE_LAYOUT_PROFILES.public-plaza.props[]` transforms. The display interaction face, notice reading position, lounge footprint and existing library-wall safety collider remain reachable in the 26-zone physics audit.
- [fixed / orbit authorship] The new furniture has complete front, side and back geometry. `0°`, `90°`, `180°` and `270°` browser captures show no missing back faces, fallen pieces, floating dowels or old/new asset overlap. Near-side assets participate in the existing camera composition and occlusion rules.
- [fixed / performance headroom] Exported opaque meshes use outward normals and single-sided rendering, allowing all three GLBs to become one authored vertex batch plus glass/contact shadow. The previous reverse-view first pass reached `161` draw calls; the corrected asset batch returns it to `147`.

### Runtime and performance evidence

- Authored asset contract: display `7,384`, notice `7,244`, lounge `11,780` triangles; aggregate `26,408` triangles. All three GLBs pass named-part, byte-size and metre-contract validation.
- Desktop `0° / 90° / 180° / 270°`: `136/213,751`, `138/216,175`, `147/227,279`, `145/220,099` draw-calls/triangles. Models consume only `3` draw calls and all views remain below the strict `160 / 300,000` gate.
- Mobile `390 × 844`: `108` draw calls, `213,045` triangles, `84` geometries and `11` textures. The display/notice remain in the room batch while the compact authored lounge stays live.
- Primary interaction: four civic GLB roles loaded; WASD moved the player `3.01m`; pointer drag rotated the follow camera `65.3°`.
- Regression: 26 zones / 10 archetypes passed physical-space validation; 78 enter/exit transitions completed with no failure or runtime error; desktop/mobile scene flow, civic character/prop validation, syntax checks and production build passed.

### Required fidelity surfaces

- [checked][spacing/layout] Entry, listening circle, evidence/display foreground, notice wall and lounge preserve the reference's foreground/middle/background hierarchy. The live room intentionally leaves a wider deterministic walking loop than the offline composition.
- [checked][colors/tokens] The 70/20/10 warm-neutral, teal/coral and brass hierarchy is coherent across authored props, characters and HUD. The target still has stronger warm indirect color transfer.
- [P1][image quality / characters] Furniture authorship is materially closer, but the target characters still have production sculpted anatomy, cloth/hair deformation, hand posing and full animation clips. The browser cast remains a modular Web LOD despite real facial morphs and articulated limbs.
- [P1][image quality / lighting] The reference uses offline global illumination, denser contact bounce, softer multi-scale penumbrae and richer albedo/specular breakup. Realtime portal light, GTAO, scanned micro-surfaces and dappled shadows remain visibly flatter in the same-canvas comparison.
- [P1][asset density] Three major clusters are now authored, but the threshold plants, foreground desk accessories, wall joinery and secondary ceramics still need the same bespoke mesh/UV treatment before literal image-1 parity can pass.
- [P2][typography/icons] HUD hierarchy and touch layout remain usable, but the compact icon drawing and optical type weights are simpler than the target artwork.
- [checked][copy/content] Location, exit, listening action and story-memory text remain coherent.
- [checked][responsiveness] No horizontal overflow or clipped primary action appears at `390 × 844`; player, witnesses, movement control and context actions remain visible.

### Gate result

This iteration replaces the most conspicuous generic furniture clusters with real, orbit-safe, physics-aligned authored assets and simultaneously improves runtime cost. The same-canvas evidence still contains actionable P1 character, secondary-asset and offline-lighting differences, so literal reference-quality parity is not yet proven.

final result: blocked

Blocker: production character/body animation, remaining secondary hero assets/UV albedo and offline-grade indirect lighting remain actionable P1 differences.

## 2026-07-18 reference-fidelity v15 portal light, scanned surfaces and facial-deformation gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Current browser-rendered implementation: `dist/interior-3d-work/environment-review/00-public.png` (public-plaza, yaw `0°`).
- Same-canvas full/focused comparisons: `dist/interior-3d-work/civic-fidelity-v15-full.png` and `civic-fidelity-v15-focus.png`.
- Orbit evidence: `environment-review-yaw-{90,180,270}/00-public.png`; responsive evidence: `environment-review-mobile/00-public.png` (`390 × 844`).

### Implemented and verified

- [fixed from v14 P1 / facial deformation] Each civic GLB now carries authored `WarmSmile`, `SpeechJaw` and `Concern` shape keys on the actual head volume. Three.js continuously blends cheek/jaw deformation with role warmth, speech cadence and attentive state while the existing eyes, brows and modeled mouth remain independent controls.
- [fixed / mobile LOD] Desktop preserves the expressive head as one morphable mesh. Mobile deliberately removes sub-pixel morph attributes before batching the complete head, returning actor rendering to the `33`-draw-call mobile budget instead of silently leaving every face part separate.
- [fixed from v14 P1 / lighting] The public room key and wash now originate at the courtyard portal. A merged, invisible canopy casts real soft dappled shadows through the room; the pattern remains spatially correct across camera orbit instead of being a white floor decal.
- [fixed from v14 P1 / surfaces] Wood and upholstery use CC0 scanned normal/roughness maps from Poly Haven, preloaded before the desktop room's atomic reveal. Per-vertex roughness and metalness survive the room/model batches, allowing paper, brass, plaster and fabric to separate without multiplying draw calls.
- [checked / spatial integrity] Four-direction evidence retains the authored entry, listening circle, notice wall, lounge and foreground desk without fallen furniture, visual/collider drift or blocked route. Player movement and camera orbit remain live.

### Runtime and performance evidence

- Desktop `0° / 90° / 180° / 270°`: `145/277,656`, `147/280,080`, `156/291,184`, `154/284,004` draw-calls/triangles. All remain within the strict `160 / 300,000` public-room gate.
- Mobile `390 × 844`: `110` draw calls, `239,458` triangles, `84` geometries and `12` textures, within the `110 / 250,000` mobile gate.
- Browser interaction: four civic GLB roles loaded; WASD moved the player `2.57m`; pointer drag rotated the live camera `65.3°`.
- Regression: 26-zone/10-archetype physics, desktop/mobile scene flow, civic morph asset validation, syntax checks and production build passed.

### Required fidelity surfaces

- [P1][characters] Real face morphs close the rigid-mask defect, but the target still uses production sculpted anatomy, authored hand poses, cloth/hair deformation and full animation clips. Current bodies remain modular Web LOD assets.
- [P1][environment] Scanned micro-surfaces improve material response, but hero cabinetry, display joinery, ceramics, woven baskets and plants still need bespoke meshes, UVs and authored albedo breakup to match the reference's object-level finish.
- [P1][lighting] Portal-direction keying and true dappled shadows add depth, but browser realtime lighting still lacks the target's offline bounce, soft penumbra density and cinematic indirect color transfer.
- [P2][HUD] The interaction hierarchy is readable and responsive, but icon drawing, type optical balance and translucent-panel finish remain simpler than the target artwork.

### Gate result

This pass materially improves facial acting, material separation and daylight direction without compromising real movement, 360° orbit or mobile performance. The side-by-side image still visibly contradicts literal image-1 production parity, especially in hero asset density and character sculpt/animation.

final result: blocked

Blocker: bespoke hero meshes/UV albedo work, production body/cloth animation and offline-grade indirect lighting remain actionable P1 differences.

## 2026-07-18 reference-fidelity v14 2D identity-to-3D facial-language gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Current browser-rendered implementation: `dist/interior-3d-work/environment-review/00-public.png` (`1674 × 944`, public-plaza, yaw `0°`).
- Same-canvas comparison: `dist/interior-3d-work/civic-fidelity-v14-full.png`.
- Orbit evidence: `environment-review-yaw-{90,180,270}/00-public.png`; responsive evidence: `environment-review-mobile/00-public.png` (`390 × 844`).

### Implemented and verified

- [fixed from v13 P1 / identity translation] The four hero citizens no longer inherit only hair and clothing colors from the 2D avatar language. The GLBs now carry larger curved sclera, iris, pupil and catchlight geometry, articulated upper-lid contours, stronger brow arches, inner ears, cheek color and an asymmetric smile dimple. Facilitator and mediator receive role-specific outer lashes.
- [fixed / spatial truth] The new facial cues remain children of `EyePivot`, `BrowPivot` and `MouthPivot`. They rotate with the modeled head, blink in 3D, accept room/actor lights, cast or receive occlusion, and remain valid in side and reverse orbit views; no camera-facing portrait plane was added.
- [fixed / asset contract] Asset validation now rejects any civic role missing either upper-lid contour and rejects the two authored feminine roles when their outer-lash geometry is absent.
- [checked / environment] The rebuilt civic room retains its authored foreground desk, center listening circle, open portal, public notice wall, side lounge and collision-safe prop placement. No fallen or floating furniture appears in the four-direction capture.

### Runtime and performance evidence

- Desktop `0° / 90° / 180° / 270°`: `148/274,776`, `150/277,200`, `159/288,304`, `157/281,124` draw-calls/triangles. All remain within the strict `160 / 300,000` public-room gate.
- Mobile `390 × 844`: `110` draw calls, `239,458` triangles and `84` geometries, within the `110 / 250,000` mobile gate.
- Browser interaction: four GLB roles loaded; WASD moved the player `3.01m`; pointer drag rotated the live camera `65.3°`.
- Regression: 26-zone/10-archetype physics, civic asset validation, syntax checks and production build passed.

### Required fidelity surfaces

- [P1][characters] Facial identity is more readable, but the source still uses sculpted topology, true eyelid/lip blend shapes, authored fingers, cloth deformation and animation clips. The current browser cast remains a modular pivot-rig Web LOD.
- [P1][environment] Composition and furniture categories are close, but the source has bespoke hero cabinetry, woven storage, ceramics and upholstery with hand-authored UV texture breakup; the live room still relies heavily on reusable geometry and vertex-color materials.
- [P1][lighting] The live room has warm key/fill/rim lights, shadow maps and GTAO, but not the source render's offline global illumination, dappled window-gobo shadows and material-specific micro-specular response.
- [P2][HUD] Hierarchy and interaction remain usable, but icon finish and compact typography are simpler than the target artwork.

### Gate result

This pass closes the most obvious 2D-identity translation gap while preserving real movement, follow camera and full orbit. Literal image-1 production parity is still visibly contradicted by the remaining character deformation, texture and offline-lighting differences.

final result: blocked

Blocker: production facial blend shapes/animation, bespoke per-object UV textures and offline-grade indirect lighting remain actionable P1 differences.

## 2026-07-18 reference-fidelity v13 facial-state, GTAO and foreground-hero gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Current browser-rendered implementation: `dist/interior-3d-work/environment-review/00-public.png` (`1672 × 941`, public-plaza, yaw `0°`).
- Same-canvas full comparison: `dist/interior-3d-work/civic-fidelity-v13-full.png`.
- Same-canvas actor/composition crop: `dist/interior-3d-work/civic-fidelity-v13-focus.png`.
- Four-direction orbit evidence: `dist/interior-3d-work/civic-orbit-v13.png` and `environment-review-yaw-{90,180,270}/00-public.png`.
- Responsive evidence: `dist/interior-3d-work/environment-review-mobile/00-public.png` (`390 × 844`).

### Earlier findings, fixes and post-fix evidence

- [fixed from v12 P1 / facial state] Each civic GLB now contains independently validated `MouthClosedPivot` and `MouthOpenPivot` nodes. Talking/interacting actors switch a modeled dark mouth and tongue instead of scaling one line; the closed alternative remains stable at rest. Mobile removes the unused open state before the head batch is built.
- [fixed from v12 P1 / contact depth] The public hero moved from the older SSAO pass to a tuned GTAO pass with denoising. Floor rings, actor feet, sofa, display case and wall furniture retain soft contact separation without globally dirtying the ivory surfaces. The pass is desktop-only.
- [fixed from v12 P1 / foreground authorship] The generic record-desk model was replaced in the civic layout by a room-authored foreground desk with a banker lamp, clipboard, notebook, marks, cup, pens and a water-glass silhouette. Its render transform and collider share the same `ZoneLayoutProfile` metre coordinates, so the added composition does not reintroduce visual/physical drift.
- [fixed from v12 P2 / framing] The desk now forms a deliberate lower-left frame like the source instead of exposing only an oversized drawer block. Its scaled footprint remains outside the listening-circle route and has a reachable interaction anchor.
- [fixed performance regression] The first transparent glass treatment added three visible passes and exceeded the reverse/mobile gates. The final stylised glass uses one opaque, batchable silhouette; the desk shade joins the room batch. Reverse view returned to `159/160` draw calls and mobile to `110/110`.
- [checked] An attempted broad bloom grade was rejected after same-viewport capture visibly washed out skin, paper and ivory plaster. It is not present in the final implementation.

### Runtime and performance evidence

- Desktop `0° / 90° / 180° / 270°`: `148/269,048`, `150/271,472`, `159/282,576`, `157/275,396` draw-calls/triangles. All remain within the strict `160 / 300,000` public-room gate.
- Mobile `390 × 844`: `110` draw calls, `235,218` triangles and `84` geometries, within the `110 / 250,000` mobile gate.
- Browser interaction: four GLB roles loaded; WASD moved the player `2.93m`; pointer drag rotated the live Three.js camera `65.3°`.
- Regression: 26-zone/10-archetype physics passed; 78 room transitions completed without failure or runtime error; desktop/mobile scene flow, character asset validation, syntax checks and production build passed.

### Required fidelity surfaces

- [P1][image quality / characters] The source still uses sculpted facial topology, blend-shape expressions, authored hand poses, cloth deformation and production animation clips. The live cast has real 3D hair, articulated limbs and modeled mouth states, but remains a modular pivot-rig Web LOD.
- [P1][image quality / environment] The reference display case, cabinetry, ceramics, woven storage and plants have bespoke UVs and texture breakup. The live room now matches their functional hierarchy and foreground/middle/background placement, but most props remain reusable geometry with procedural surface response.
- [P1][colors / lighting] GTAO improves contact depth and the warm-neutral/teal/coral/brass hierarchy is coherent, but the reference's offline global illumination, dappled window shadows and material-specific specular response remain visibly richer.
- [P2][spacing / orbit] The hero view is readable, but the `90°` orbit deliberately lets the near desk/display edge enter the frame and rely on opacity handling; it is a valid exploration view rather than a separately art-directed cinematic shot.
- [P2][typography / icons] The HUD preserves the source hierarchy and is usable at both breakpoints, but icon optical weight and compact status typography remain simpler than the target render.
- [checked][copy / content] Location, listening action, exit and story-memory labels remain coherent.
- [checked][responsiveness / interaction] No horizontal overflow or clipped primary action was found; mobile keeps the player, witnesses, interaction prompt, joystick and actions visible.

### Gate result

This pass makes concrete progress toward the reference while preserving genuine walking, camera following and full orbit. The same-canvas actor/material comparison still contains visible actionable P1 production differences, so literal image-1 quality parity is not yet proven.

final result: blocked

Blocker: production character blend shapes/animation, bespoke per-object UV textures and offline-grade indirect lighting remain actionable P1 differences.

## 2026-07-18 reference-fidelity v12 authored-hair, social-acting and lounge-light gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Current browser-rendered implementation: `dist/interior-3d-work/environment-review/00-public.png` (`1672 × 941`, public-plaza, yaw `0°`).
- Same-canvas full comparison: `dist/interior-3d-work/civic-fidelity-v12-full.png`.
- Same-canvas actor/composition crop: `dist/interior-3d-work/civic-fidelity-v12-focus.png`.
- Four-direction orbit evidence: `dist/interior-3d-work/civic-orbit-v12.png` and the individual `environment-review-yaw-{90,180,270}/00-public.png` captures.
- Responsive evidence: `dist/interior-3d-work/environment-review-mobile/00-public.png` (`390 × 844`).

### Earlier findings, fixes and post-fix evidence

- [fixed from v11 P1 / character silhouette] The six identical capsule bangs were the strongest visible AI-kit artifact. Each role now uses curved, multi-ring tapered locks with a controlled root, pointed tip and restrained highlight color. Forehead and eyes remain readable from the live gameplay camera while the back/side silhouette stays fully modeled.
- [fixed from v11 P1 / anatomy] Shoulder pivots moved inward; upper arms, forearms, palms, fingers and footwear were re-proportioned. Facilitator and mediator now use tailored cardigan panels rather than two balloon-like ellipsoids, and their skirts have a restrained pleat structure.
- [fixed from v11 P2 / acting] The listener, facilitator and mediator no longer stand with hands behind their bodies. Live role poses now stage an open listener gesture, a two-handed notebook gesture and a hand-to-chin mediator gesture. These are visible in `civic-fidelity-v12-focus.png`, not inferred from rig metadata.
- [fixed from v11 P1 / environment hierarchy] The right lounge now has a real brass-and-ivory pendant with a warm local point light. It provides the reference's secondary warm focal point without adding a floor obstacle or changing the collision map.
- [fixed from v11 P1 / material scale] The public terrazzo texture increased from a repeating `512px / 1,750-chip` field to a sharper `768px / 4,200-chip` field with smaller, darker aggregate. The floor now reads as mineral material rather than sparse confetti.
- [fixed] Directional shadows are softened while actor contact shadows remain, reducing the hard diagonal stripe quality on the plaster shell.
- [fixed tooling] Canonical GLB rendering now defaults to `python3` (or `PYTHON_BIN`) instead of assuming a `python` shim, so character front/side/isometric inspections work in the configured workspace runtime.

### Runtime and performance evidence

- Desktop `0° / 90° / 180° / 270°`: `148/276,604`, `150/279,028`, `159/290,132`, `157/282,952` draw-calls/triangles. All stay within the strict `160 / 300,000` public-room gate.
- Mobile `390 × 844`: `110` draw calls, `242,774` triangles and `84` geometries, within the `110 / 250,000` mobile gate.
- Browser interaction: four GLB roles loaded; WASD moved the player `2.97m`; pointer drag rotated the live Three.js camera `65.3°`.
- Regression: 26-zone/10-archetype physics passed; 78 room transitions completed without failure or runtime error; desktop/mobile scene flow, syntax checks and production build passed.

### Required fidelity surfaces

- [P1][image quality / characters] Hair, clothing and social acting are materially more authored, but the source still has sculpted hands, facial blend shapes, cloth deformation and production animation clips. The Web cast remains a modular pivot-rig LOD.
- [P1][image quality / environment] The source's foreground display case, cabinetry, ceramics, woven storage and plant assets have bespoke texture work. The implementation matches their functional placement and hierarchy but not their offline asset density or micro-surface detail.
- [P1][colors / lighting] The warm-neutral, teal, coral and brass hierarchy now matches directionally, but the source still has offline global illumination, window-gobo shadows and richer specular breakup.
- [P2][spacing / layout] The source gives the four actors slightly more asymmetric spacing and negative space. The live circle stays deliberately more regular so navigation, interaction anchors and camera orbit remain deterministic.
- [P2][typography / icons] The live HUD preserves the source's dark translucent rails and compact Chinese hierarchy, but its iconography and optical weights remain simpler than the rendered reference.
- [checked][copy / content] Location, listening action, exit and story-memory labels are coherent and remain usable at desktop and mobile sizes.
- [checked][responsiveness / interaction] No horizontal overflow or clipped primary action was found. Mobile keeps the player, two witnesses, interaction prompt, joystick and actions visible.

### Gate result

This pass is a concrete fidelity improvement and keeps the requested experience genuinely walkable, camera-following and orbitable. The same-canvas comparison still visibly contradicts literal image-1 production parity, so the Product Design handoff gate remains blocked.

final result: blocked

Blocker: hero-character deformation/animation, bespoke per-object textures and offline-grade indirect lighting remain actionable P1 differences.

## 2026-07-18 reference-fidelity v11 cinematic-camera, knees and final browser gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Current browser-rendered implementation: `dist/interior-3d-work/environment-review/00-public.png` (`1672 × 941`, public-plaza, yaw `0°`).
- Same-canvas full comparison: `dist/interior-3d-work/civic-fidelity-v11-full.png`.
- Same-canvas actor/composition crop: `dist/interior-3d-work/civic-fidelity-v11-focus.png`.
- Four-direction orbit evidence: `dist/interior-3d-work/civic-orbit-v11.png` plus `environment-review-yaw-{90,180,270}/00-public.png`.
- Responsive evidence: `dist/interior-3d-work/environment-review-mobile/00-public.png` (`390 × 844`).

### Implemented and verified

- [fixed] The public room now uses a lower editorial camera (`46°` FOV, `3.44m` camera height, `5.48m` follow distance) rather than the elevated archetype view. The player remains the foreground anchor while the listening circle, portal and furnished back wall share a readable middle/background composition.
- [fixed] The open threshold is no longer represented by opaque slabs. Both leaves now have visible wood stiles, rails, glass panes, muntins, kick panels and brass hardware, improving the source's courtyard-threshold read from front and reverse angles.
- [fixed] Four metre-scale civic GLBs now expose knee pivots in addition to shoulder, elbow, head, eye, brow and mouth controls. Walk/run/jump/fall and role-specific idle poses articulate the lower leg; trouser folds, cuffs and shoes remain parented to the correct segment.
- [fixed] Facial expression axes are corrected: brows move on the Blender/Three vertical axis and speech scales the mouth vertically instead of pushing both controls into the face. Reduced iris/pupil proportions preserve visible sclera at gameplay distance.
- [fixed] Civic lighting now has stronger warm-key separation, restrained fill, real doorway shadows and richer environment response. The previous additive white floor decals were removed from this hero room.
- [fixed] Room-ready diagnostics publish immediately after the atomic reveal, so a cold asset load can no longer expose stale `activeModelCount: 0` evidence.
- [fixed] The browser exploration gate now reads live renderer diagnostics instead of a one-second telemetry snapshot. It proves `2.97m` of WASD movement and a `65.3°` drag orbit while four GLB roles remain loaded.
- [fixed] The four desktop angles are within the strict core budget: `146/281,088`, `148/283,512`, `157/294,616`, and `155/287,436` draw-calls/triangles. Mobile is `108/245,874`, within `110/250,000`.
- [fixed] The 26-zone physics gate, 78-transition stress gate, desktop/mobile scene-flow gate, syntax suite and production build all pass.

### Current findings

- [P1][character production] The same-canvas crop still shows a categorical gap. The source uses sculpted anatomy, authored cloth/hair topology, hand poses, facial deformation and animation clips; the live cast remains a modular pivot-rig Web LOD despite improved joints and expressions.
- [P1][environment production] The source's display case, cabinetry, woven accessories, ceramics and architectural joinery are bespoke hero assets with richer texture response. The live equivalents preserve composition and function but remain simplified reusable geometry.
- [P1][lighting] The source has offline-quality global illumination, soft contact bounce and material-specific specular breakup. The live browser grade is coherent and readable but cannot claim literal cinematic parity.
- [P2][orbit composition] All four angles preserve the player and conversation, but the `90°` view still relies on foreground transparency around the portal/desk rather than having a fully bespoke secondary-camera composition.
- [P2][scope] This gate proves one hero interior. It does not prove image-1 authorship for the remaining 25 buildings.

### Gate result

The deliverable is a real walkable, camera-following, 360° Three.js room with stable physics, authored front/reverse sets and modular 3D citizens. The reference remains an offline render target, and literal image-1 asset/lighting parity is still visibly contradicted by the combined comparison.

final result: blocked

Blocker: production character deformation, bespoke texture/material authoring and room-specific hero meshes remain actionable P1 work.

## 2026-07-18 reference-fidelity v10 articulated-acting and complete-orbit gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Current browser-rendered implementation: `dist/interior-3d-work/environment-review/00-public.png` (`1280 × 720`, public-plaza QA state, yaw `0°`).
- Same-viewport full comparison: `dist/interior-3d-work/civic-fidelity-v10-full.png`.
- Focused actor comparison: `dist/interior-3d-work/civic-fidelity-v10-actor-focus.png`.
- Four-direction orbit evidence: `dist/interior-3d-work/civic-orbit-v10-board.png` (`0° / 90° / 180° / 270°`).
- Responsive evidence: `dist/interior-3d-work/environment-review-mobile/00-public.png` (`390 × 844`).

### Comparison history and fixes

- [fixed from v9 P1] Civic characters no longer use a single rigid arm segment. Four regenerated GLBs now expose left/right elbow pivots, articulated forearms, cuff/hand silhouettes and desktop finger detail. Listener, facilitator and mediator use different asymmetric listening poses.
- [fixed from v9 P1] Faces now expose independently validated brow and mouth pivots in addition to eye pivots. Desktop characters blink, shift gaze, lift brows and pulse the mouth during speech; head scale was reduced to move the silhouette toward the reference's calmer `1:3.5` proportion.
- [fixed from v9 P2] The `180°` reverse shot no longer reveals an empty generic wall. It now has a dedicated witness-response wall, pendant, upholstered bench, cushions and paired planters, while the `90°` view gains a balanced story frame above the sideboard.
- [fixed] Reverse-shot furniture has matching fixed colliders. The camera-facing version is culled only while it would sit between the camera and the conversation; the authored physical boundary remains stable and does not become a moving camera-dependent collider.
- [fixed] Mobile keeps articulated elbows but merges sub-pixel facial parts into the head batch and removes finger micro-geometry. The current captured hero is `100` draw calls, `248,562` triangles and `81` geometries, below the `110 / 250,000` mobile gate.
- [fixed] The reverse-wall notes, leaves and cushions are merged into one orbit-aware static batch. The four desktop views now measure `136 / 285,416`, `138 / 287,840`, `147 / 298,944` and `145 / 291,764` draw-calls/triangles respectively, all within the core `160 / 300,000` gate.
- [fixed regression] The shared articulated state machine originally assumed every legacy procedural actor exposed elbow pivots, causing non-civic interiors such as the university to remain in the atomic loading state. Procedural actors now provide compatibility pivots; the 26-zone, three-pass transition stress gate completes `78` transitions with no runtime error, and the desktop/mobile scene-flow gate passes again.

### Current findings

- [P1][image quality / asset fidelity] The focused comparison still shows a categorical character-production gap. The source has sculpted hand anatomy, layered cloth folds, facial blend shapes, authored hair strands and nuanced weight shifts; the live characters remain modular low-poly assets driven by hierarchical pivots.
- [P1][materials / lighting] The source uses materially richer wood grain, woven fabric, ceramic glaze, terrazzo variation and soft indirect bounce. The live room preserves the palette and hierarchy but still reads as simplified real-time toon materials in close comparison.
- [P1][layout / bespoke assets] The default live composition contains more wall-board repetition and less bespoke architectural joinery than the source. The source's left courtyard threshold, foreground display case and right lounge are each hero assets; the live equivalents remain assembled from a reusable Web asset language.
- [P2][acting] Elbows and facial controls materially improve the silhouettes, but the four-person group is still more symmetrical and less narratively staged than the source. The source communicates specific roles through hand props, gaze and stance before any label is read.
- [P2][scope] This v10 visual comparison proves the public hero room and four orbit directions only. It does not prove image-1 authorship for the remaining 25 interiors.
- [checked][typography / UI] The top status rail and lower action rail preserve the source's dark translucent hierarchy and Chinese label density, but the live top controls remain more compact and less optically polished than the rendered target.
- [checked][copy / interaction] The core actions are coherent and functional; WASD walking and drag orbit were browser-tested. The location title, listening action and exit remain reachable without covering the conversation center.

### Gate result

The new pass proves a more expressive shared-rig cast and a genuinely authored 360° room rather than a single-camera facade. Literal image-1 production parity is still contradicted by the same-canvas character/material comparison, so this cannot be handed off as a passed clone.

final result: blocked

Blocker: cinematic hero-character deformation, bespoke texture/material production and room-specific hero assets remain actionable P1 differences.

## 2026-07-18 reference-fidelity v9 material, joinery and living-face gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Current live implementation: `dist/interior-3d-work/environment-review/00-public.png` (`1672 × 941`).
- Same-canvas source/current comparison: `/tmp/mirrorlife-civic-fidelity-v9-comparison.png`.
- Whole-building placement board: `dist/interior-3d-work/environment-review/contact-sheet.png` (26 interiors).

### Findings and fixes in this gate

- [fixed] The civic room no longer uses an evenly washed cream grade. Key/fill/environment balance now restores warm directional contrast while retaining readable faces and floor routes.
- [fixed] Eight shallow wall bays now include real recessed plaster fields, stronger oak/plaster trim separation and readable pilasters. The upper half no longer reads as one unbroken generic cylinder.
- [fixed] The foreground record desk, library and side wall gained paper, pen, water, cabinet, ceramic, textile and hardware detail without introducing new traversal colliders.
- [fixed] Civic GLBs now include independently validated left/right eye pivots. Live characters blink, use slightly more restrained eye proportions and receive a single-pass view-normal ink rim instead of a triangle-doubling outline shell.
- [fixed] The 26-room capture gate now rejects any full-size rendered furnishing promoted to an unconstrained dynamic rigid body. `supply-crate` remains the only permitted free dynamic prop, preventing the tipped chair/shelf and detached-rod failure shown in the defect reference.
- [fixed] The final 26-room sweep stays within budget: desktop peaks at `113` draw calls, `420,238` triangles and `116` geometries; mobile peaks at `100` draw calls, `245,130` triangles and `81` geometries. The public hero itself is `113` draw calls / `245,423` triangles at the native desktop comparison size.
- [P1 remaining] Direct comparison still shows a categorical production gap in characters: the source has hand-sculpted anatomy, expressive hands, cloth folds, facial deformation and authored acting; the current GLBs remain modular Web LOD0 characters with pivot animation.
- [P1 remaining] Furniture forms and joinery are still noticeably simpler than the source's bespoke assets, especially the foreground display case, lounge cabinetry and architectural opening.
- [P2 remaining] The 20 non-core rooms pass stability and path readability but remain visibly organized by archetype families rather than 20 independently art-directed layouts.

### Gate result

The room is materially closer, fully 3D, walkable, orbitable and protected against the reported placement failure. Literal image-1 production parity and bespoke authorship for all building interiors are not yet proven.

v9 final result: blocked on hero character deformation and bespoke per-building environment assets

## 2026-07-18 reference-fidelity v7 shared-rig character gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Current desktop hero: `dist/interior-3d-work/environment-review/00-public.png` (`1280 × 720`).
- Combined source/current canvas: `/tmp/mirrorlife-civic-fidelity-v7-comparison.png`.
- Character canonical views: `dist/interior-3d-work/characters/civic/canonical/civic-{player,listener,facilitator,mediator}/{front,back,left,right,isometric}.png`.
- Orbit evidence: `dist/interior-3d-work/environment-review-yaw-{90,180,270}/00-public.png`.
- Responsive evidence: `dist/interior-3d-work/environment-review-mobile/00-public.png` (`390 × 844`).
- Whole-building placement board: `dist/interior-3d-work/environment-review/contact-sheet.png` (26 cold-started interiors).

### Findings and fixes in this gate

- [fixed] The hero cast no longer uses runtime-built generic meshes or camera-facing portrait sprites. Four real metre-scale GLBs now share the `mirrorlife-shared-pivot-v1` contract and preserve head, arm and leg pivots for walk, run, jump, fall, listen and conversation states.
- [fixed] The four reference roles now have authored 360° identity features: player backpack and scarf, listener cap/satchel/cargo pockets, facilitator coral ponytail/notebook, and mediator braided bob/coat/necklace.
- [fixed] Character assets load lazily and participate in the atomic room-ready gate. Missing or malformed rigs fall back to the procedural actor without exposing a half-loaded room.
- [fixed] Imported meshes are merged per head, torso and limb after cloning, reducing four production characters to `28` actor draw calls. The current desktop scene is `96` draw calls / `257,824` triangles; mobile is `89` draw calls / `236,542` triangles.
- [fixed] A browser exploration gate now verifies the actual result rather than inferring interactivity from screenshots: repeated runs moved the player `0.53–0.77m`, drag orbit rotated `65.3°`, all four GLB roles stayed loaded, and the scene remained ready.
- [fixed] The four public GLBs total `5.53 MB`; static validation enforces the metre scale, role list, triangle/size budgets, GLB header and absence of workstation paths in the public manifest.
- [fixed] The 26-room cold-start board shows no repeat of the tipped full-size chair/shelf defect. Large furnishings remain fixed bodies; only the hand-scale supply crate remains pushable.
- [P1 remaining] The combined canvas still shows a production-detail gap in character anatomy and acting: hands are mitten-like, faces have no blend-shape deformation, cloth lacks folds, hair uses grouped solid locks, and idle/listening motion is pivot-driven rather than hand-authored clips.
- [P1 remaining] The 20 non-core interiors remain too archetype-repetitive. The learning, nature, commerce and care families reuse the same hero arrangements and therefore do not yet reach the source's bespoke-room authorship.
- [P2 remaining] The civic hero room has the correct composition, navigation, material hierarchy and interaction loop, but still lacks the source's micro-prop density, detailed joinery, soft bounce lighting and foreground depth.

### Gate result

The requested 2D-to-3D transition is now implemented as a reusable shared-pivot asset pipeline, and the hero room is genuinely walkable and orbitable on desktop/mobile within budget. Literal image-1 production parity and bespoke identity for all remaining interiors are not yet proven.

v7 final result: blocked on cinematic character deformation and bespoke per-building environment assets

## 2026-07-17 reference-fidelity v6 browser gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Current desktop hero: `dist/interior-3d-work/environment-review/00-public.png` (`1280 × 720`).
- Combined reference/current canvas: `/tmp/mirrorlife-civic-fidelity-v5-comparison.png`.
- Orbit evidence: `dist/interior-3d-work/environment-review-yaw-90/00-public.png`, `environment-review-yaw-180/00-public.png`, and `environment-review-yaw-270/00-public.png`.
- Responsive evidence: `dist/interior-3d-work/environment-review-mobile/00-public.png` (`390 × 844`).

### Findings and fixes in this gate

- [fixed] Cold-cache captures could stop on the atomic loading shell even when the final room was healthy. The environment capture now waits for `interior-active`, `data-scene-ready=true`, visible Three.js output, and two settled animation frames instead of relying on a fixed sleep.
- [fixed] Civic faces lost expression under backlighting and side NPCs became flat profiles. A camera-side actor-only fill light now follows the orbit camera; NPC bodies open 24% toward the camera while their heads keep tracking the player.
- [fixed] All witnesses used the same rigid hanging-arm silhouette. Listener, facilitator and mediator now receive role-specific conversational poses, making the social function readable from the hero and reverse angles.
- [fixed] Secondary orbit angles exposed an undecorated circular shell. Eight performance-safe wall-molding bays follow the far hemisphere, while the story frames remain culled from the foreground. No bay becomes a physical obstacle or separates rendering from authored colliders.
- [fixed] Mobile room complexity remains inside the hard budget after the wall system was reduced to low-triangle box molding: `86` draw calls, `218,869` triangles and `69` geometries. Desktop hero remains `96` draw calls, `277,680` triangles and `99` geometries.
- [P1 remaining] The combined canvas still shows a categorical asset gap between the procedural shared-rig prototype and the source's bespoke sculpted characters: hand topology, cloth folds, hair strand grouping, facial deformation and authored idle animation are not cinematic-production quality.
- [P2 remaining] The real-time room matches the source's spatial hierarchy, palette, arched threshold, social circle, evidence wall, lounge, foreground desks and brass path, but it does not yet match the source's micro-prop density, bounced-light subtlety or bespoke joinery.

### Gate result

The room is now stable, orbitable, physically readable and free of the tipped/floating furniture failure. It passes as a playable real-time vertical slice, but not yet as literal cinematic parity with the supplied image. The next asset milestone remains the documented shared-skeleton GLB character pack plus authored hero-room cabinetry.

v6 final result: blocked on production character and bespoke environment assets

## 2026-07-17 reference-fidelity v5 in-progress gate

### Evidence

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Pre-change implementation baseline: `/tmp/mirrorlife-civic-fidelity-v4-desktop.png` (`1672 × 941`, commit `e03d58f`).
- Full native-size baseline comparison: `/tmp/mirrorlife-civic-fidelity-v4-comparison.png`.
- Focused character evidence: `/tmp/mirrorlife-reference-characters.png` and `/tmp/mirrorlife-v4-characters.png`.
- State: `public-plaza`, deterministic four-resident review cast, default story-circle camera.

### Findings and implemented fixes

- [P1] Character/world finish mismatch. The baseline room uses authored textured furniture and layered lighting, while the citizens remain oversized and read as procedural blockouts. The civic presentation scale is reduced from `1.08` to `0.96`, aligning visual adults with the 1.68–1.72m physics contract and restoring the reference's breathing room.
- [P1] Faces disappear in three-quarter staging. The baseline side residents look away from the player because the whole body faces the circle and the head has only idle noise. Civic NPC heads now track the player with a clamped 0.5-radian local turn; eyes and irises are enlarged, the nose is reduced, and facial material response is separated from cloth response.
- [P2] Clothing reads as rounded boxes. Facilitator and mediator coat panels now use tapered capsule silhouettes; shoulder span is reduced and actor material batches use role-appropriate roughness/environment response.
- [P2] Secondary orbit views expose a blank circular wall. Two civic wall-story frames now exist on the previously empty side. They remain as individually culled room objects and become visible only on the camera's deep far hemisphere, preventing the foreground-overlay failure found in the earlier orbit experiment.

### Verification status

- Syntax/check suite passed.
- 26-zone / 10-archetype physics verification passed.
- 44 GLB runtime assets passed validation (`77.84 MB`).
- Desktop and mobile scene flow passed.
- 78 interior transitions completed with zero failures and zero runtime errors.
- Production Vite build passed; existing non-module-script and chunk-size warnings remain non-blocking.
- A fresh browser-rendered `public-plaza` capture for the v5 visual changes is missing because the selected in-app browser rejected the local preview URL under its URL policy. The source and baseline are available, but the post-fix same-state comparison cannot be truthfully claimed yet.

### Next gate

- Capture the pushed preview at `1672 × 941`, inspect the character close-up and yaw `0° / 90° / 180° / 270°`, then either tune or accept the new scale, head tracking and far-wall visibility.

final result: blocked

## 2026-07-17 reference-fidelity v4 addendum

- Native source: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Live desktop: `/tmp/mirrorlife-civic-fidelity-v4-desktop.png` (`1672 × 941`).
- Live mobile: `/tmp/mirrorlife-civic-fidelity-v4-mobile.png` (`390 × 844`).
- Combined inspection: `/tmp/mirrorlife-civic-fidelity-v4-comparison.png`; reference and implementation were judged together at their native desktop size.

### Changes verified in this pass

- Replaced the small procedural lounge cluster with the existing textured `seating.glb` composition, repaired and reduced in Blender from `75,323` to `17,997` triangles for the Web runtime. The sofa, cushions, coffee table, cups and plant now read as one authored hero grouping instead of disconnected primitives.
- Rescaled the group to a credible two-seat conversation bay and authored a single matching metre-scale collider. The old duplicate coffee-table collider and invisible plant collider were removed, eliminating empty-space collision and the tipped/detached furniture failure shown in the defect reference.
- Reduced the foreground record-desk footprint so it still frames the shot without swallowing the traversal lane.
- Kept the civic material hierarchy restrained: warmer ivory plaster, cooler terrazzo, honey oak, teal upholstery, coral accents and brass routes preserve the source's 70/20/10 hierarchy.
- Desktop keyboard movement and camera orbit were exercised in the live room; mobile `390 × 844` retains the central cast, current action and touch controls. The room remains genuine Three.js geometry rather than a static background.
- Static syntax, 26-zone physics reachability and 78 interior transition passes completed without runtime failures; the production Vite build completed successfully.

### Remaining production-tier gap

- Layout, furniture stability, navigation, identity continuity and the hero-room composition now pass. Literal parity with the offline source still requires the shared-rig hero character asset set described in `docs/design/avatar-2d-to-3d-pipeline.md`: sculpted hair, cloth silhouettes, hand/face deformation, authored animation and higher-order bounced-light/material response.
- The current procedural citizens are an intentionally playable identity prototype. They should be replaced through `AvatarDNA + shared skeleton + portrait rerender`, not by independently generating one incompatible mesh per 2D portrait.

v4 result: passed for playable real-time room fidelity and placement; cinematic character sculpt fidelity remains the next asset milestone.

## Comparison target

- Source visual truth: `design/references/civic-interior-visual-target.png`
- Placement defect reference: `design/references/civic-furniture-placement-defect.png`
- Runtime: `http://127.0.0.1:4182/game.html?qaInterior=public-plaza&qaInteriorScene=1`
- Desktop capture: `artifacts/design-qa/public-plaza-final-desktop.png` (1680 × 945)
- Mobile capture: `artifacts/design-qa/public-plaza-final-mobile.png` (390 × 844)
- Same-size comparison: `artifacts/design-qa/public-plaza-side-by-side.png`

## Fidelity ledger

1. **Composition and first read — matched.** The open daylight arch establishes the left background, the listening ensemble occupies the middle ground, and the record/display desks frame the foreground. The player, current witnesses, exit and listening focus remain readable without relying on the room title.
2. **Functional zoning — matched.** The implementation reproduces the reference's arrival threshold, public evidence display, central listening circle, background record wall and right-side decompression lounge as physically distinct, traversable zones.
3. **Material and lighting hierarchy — matched in real-time form.** Warm plaster, terrazzo, oak, teal upholstery, brass inlays, glass and foliage replace the previous uniform soft-plastic treatment. Daylight and warm practical lights shape the route and social focus.
4. **Character identity — materially upgraded.** UI `avatarFrame` now maps to explicit 3D identities rather than generic profession colors. Eight silhouettes combine body shape, hair, headwear, glasses, coat/apron/overalls, backpack and identity props. The production hand-off path to shared-rig GLB characters is documented in `docs/character-identity-3d-pipeline.md`.
5. **Physics and placement — fixed.** Large seating is no longer promoted to an unconstrained dynamic rigid body, which caused the reference defect's tipped seat and detached rods. Render and collision placement now share authored transforms; hero furniture can be room-shell geometry while retaining explicit solid colliders.
6. **UI and readability — preserved intentionally.** The reference label `邻里议事厅 · public` is represented by the live product's `邻里广场 · 场所回声` state, keeping real save data, narrative actions and current MirrorLife HUD instead of replacing the application with a static mockup.

## Interaction proof

- Public-room scene reached the ready state with one player and three separated NPC witnesses on desktop; mobile uses the reduced two-witness composition.
- Character staging avoids the central pile-up and reserves a navigable listening circle.
- The runtime console/page-error pass returned no errors after the empty merged-model guard was added.
- Desktop and mobile captures are from the actual orbitable Three.js room, not a composited concept image.

## Intentional deviations

- The reference is a high-detail offline target render. This pass matches its spatial hierarchy, premium dopamine palette and hero-object language in a performant real-time procedural room; it does not fake that fidelity with a flat background image.
- Existing story state and controls remain authoritative. Bespoke sculpted GLB faces, clothing folds and hand-authored animation polish remain the next production asset tier, with identity continuity and acceptance criteria already specified in the character pipeline document.

## Iteration history

- Baseline: generic circular room, sparse perimeter, billboard-like character repetition and unstable full-size dynamic seating.
- Room rebuild: added the open arch, exterior depth, terrazzo/brass route, public evidence display, listening console, lounge, foliage and layered light.
- Identity pass: connected UI avatar identity to modular 3D silhouettes and accessories.
- Physics/QA pass: removed furniture auto-dynamics, retained colliders for shell-rendered furnishings, fixed empty spread runtime errors, capped/staged occupants and verified desktop/mobile outputs.

final result: passed

---

# Interior Design QA

## Comparison target

- Source visual truth: `/Users/kk/.codex/attachments/bdda8e2a-dc7b-4e21-9cc8-5c43fc6e3b13/image-1.png`
- Implementation: `http://127.0.0.1:4173/game.html?qaInterior=public-plaza&qaInteriorScene=1`
- Exact implementation screenshot: `dist/interior-3d-work/design-qa/final-public-exact-1586x992.png`
- Full same-size comparison: `dist/interior-3d-work/design-qa/public-reference-vs-final.png`
- Focused-region comparison: `dist/interior-3d-work/design-qa/public-focused-comparison.png`
- Browser-rendered evidence: `dist/interior-3d-work/design-qa/iab-public-final.png`
- Viewport and state: 1586 × 992, device scale factor 1, `public-plaza`, room ready, three residents active, story journal and contextual action visible.

## Findings

- No actionable P0, P1, or P2 visual or interaction issues remain.
- [P3] The offline reference contains bespoke sculpted cabinetry and micro-prop density beyond the reusable real-time room system. The implementation preserves its important visual language—warm plaster, honey oak, arched daylight, glass display, layered shelving, foliage, soft seating, central social table, organic color fields, and warm directional shadows—while remaining orbitable and within the browser performance budget.

## Required fidelity surfaces

- Fonts and typography: the established MirrorLife Chinese UI hierarchy, weights, borders, line heights, and compact HUD treatment are preserved. Story and interaction copy remain legible over the room.
- Spacing and layout rhythm: the reference's central social anchor and quieter furnished perimeter are reproduced. The window/display zone, back work zone, central conversation zone, and right lounge zone remain visually distinct without obstructing navigation.
- Colors and visual tokens: warm ivory plaster, honey oak/cork, pistachio, olive, apricot, butter yellow, cornflower blue, and restrained tomato accents match the approved premium dopamine direction. Dark ink remains concentrated in the HUD and interaction chrome.
- Image quality and assets: existing GLB props remain primary. Missing architecture and furnishings use compatible Three.js geometry. The generated `public/assets/interiors/textures/atelier-window-view.png` supplies a full-resolution, stylistically matched exterior view inside the actual arched window rather than replacing the room with a static render.
- Copy and content: the room story, three-step journal, contextual listening action, branching response choices, visible outcome, reward, and relationship event form a coherent playable social-simulation loop.
- Icons and affordances: existing product icons and sprite characters are retained. Interaction targets, compass, scene action, movement controls, and exit control are visible and usable.
- Interaction: the in-app browser completed the primary action, displayed both dialogue choices, accepted `leave-concern`, advanced the journal, and rendered the outcome state. Console and page-error checks returned no errors.
- Accessibility and responsiveness: semantic controls, keyboard interaction, focus states, and mobile tap controls remain intact. Desktop and mobile scene-flow verification both passed.

## Comparison history

### Iteration 1

- Visible mismatch: the baseline room had a flat generic window, shallow arches, duplicated clustered props, sparse walls and floor, weak shadows, and undersized character staging.
- Fixes: introduced the warm PBR material/lighting grade, recessed arch niches and cove profiles, explicit public-room composition, dynamic/contact shadows, render-only interaction anchors, larger resident staging, a glass display cabinet, sideboard, soft seating, and denser foliage.
- Evidence: same-size full comparison and browser-rendered public-room capture.

### Iteration 2

- Visible mismatch: the window exterior still lacked the reference's sunlit depth, while the floor and lounge edge remained too sparse.
- Fixes: generated and fitted a premium Mediterranean window-view texture, normalized arched-panel UVs, increased terrazzo detail, added sculpted floor plants, moved the plant rack into the lounge composition, changed the sofa to ivory, and added the right credenza.
- Evidence: `public-reference-vs-final.png` and the three-pair `public-focused-comparison.png`, covering the window/display, desk/table/characters, and wall/sofa/plant regions.

## Full-system verification

- Desktop visual sweep: 26/26 interiors; maximum 179 draw calls, 491,972 triangles, and 137 geometries; zero budget failures and zero horizontal-overflow failures.
- Mobile visual sweep: 26/26 interiors; maximum 129 draw calls, 437,665 triangles, and 99 geometries; zero budget failures and zero horizontal-overflow failures.
- Story flow: desktop and mobile choice, outcome, reward, and relationship-event paths passed.
- Static validation: project syntax checks and `git diff --check` passed.
- Production build: Vite build passed. Existing non-module script and large Three.js chunk warnings remain non-blocking and unchanged in behavior.

## Implementation checklist

- [x] Match the approved premium, relaxed dopamine art direction at the representative public-room state.
- [x] Keep the room fully 3D, orbitable, and explorable.
- [x] Prefer existing GLB assets and fill genuine gaps with consistent Three.js geometry and generated imagery.
- [x] Stage residents around meaningful focal props and retain a complete branching social story loop.
- [x] Apply the shared material, daylight, architectural, furnishing, and foliage system across all 26 building interiors.
- [x] Pass desktop and mobile visual, layout, performance, story-flow, syntax, and production-build checks.

final result: passed

---

# Design QA — Counterfactual Episode Finale / 故事馆终章

## Source truth and verification state

- Accepted concept: `/Users/kk/repos/MirrorLife/docs/design/counterfactual-episode-finale.png`
- Implementation capture: `/tmp/mirrorlife-episode-finale-desktop.png`
- Combined same-size comparison: `/tmp/mirrorlife-episode-finale-comparison.png`
- Responsive capture: `/tmp/mirrorlife-episode-finale-mobile-390.png`
- Runtime URL: `http://127.0.0.1:4173/game.html?qaInterior=story-archive&qaInteriorScene=1&qaCounterfactualFinale=1&qaYaw=0`
- Native desktop viewport: `1536 × 1024`; native mobile viewport: `390 × 844`.

The accepted concept and the live implementation were inspected side by side in one `3072 × 1088` comparison canvas. Both source panels remain native `1536 × 1024`; neither was independently cropped or stretched.

## Five-point fidelity ledger

1. **Editorial episode header — matched.** Both versions use a single dark ink bar, MirrorLife mark, centered episode title, and a gold `5 / 5` completion counter. The implementation adds the story title and act as a compact second line so the screen remains grounded in live state.
2. **Fact / unchosen-future polarity — matched.** Coral facts remain on the left and jade Agent interpretations remain on the right. The implementation uses the actual zone names, chosen action labels, citizen identities, and alternative choices from state rather than concept-only sample copy.
3. **Five-location memory spine — matched with a system-driven treatment.** The concept shows five bespoke miniature room portals; the implementation renders five translucent memory doors over the currently loaded real Three.js room, with the single rewritten location marked jade. This retains live spatial continuity without inventing unrelated static room art.
4. **Social tableau — matched in function, intentionally expanded in evidence.** The concept stages three seated witnesses. The implementation stages the player plus three distinct existing citizen roles at the room's physical focal point. This shows that the verdict belongs to a playable multi-Agent scene, not a detached results page.
5. **Verdict and share dock — closely matched.** The gold next-episode hook, identity verdict, fact/rewrite counts, primary story-card action, and low-emphasis street return preserve the source hierarchy. The dock remains fully usable at desktop and mobile sizes.

## Above-fold copy diff

- Source brand subtitle: `MIRRORLIFE`; implementation: `EPISODE MEMORY` to identify this as an in-world archive state.
- Source location names are atmospheric mock names; implementation uses the five real playable locations: 邻里广场、静心角、公议庭、谈心和解屋、街坊故事馆.
- Source side rails contain authored sample interpretations; implementation replaces them with the current run's actual choice labels and three Agent-specific counterfactual responses.
- The core headline, `5 / 5` completion, verdict, statistics, share action, and street-return promise remain semantically unchanged.

## Findings

### P0 / P1 / P2

- None remain after the responsive and canvas-exit cleanup passes.

### P3 — accepted intentional deviations

- The five concept portals use five one-off miniature illustrations. The implementation keeps the live 3D story-archive room as the visual truth and represents each completed location with a glass memory door. This is more truthful to the product's explorable-world promise and avoids a disconnected results-screen asset set.
- Citizen art uses MirrorLife's current profession sprite system instead of the concept's seated portrait style. Distinct silhouettes, roles, physical positions, and Agent names provide real simulation evidence while remaining consistent with the shipped world.

## Interaction and responsive evidence

- Five distinct locations complete the episode; the finale reports `4` retained facts and `1` rewritten future.
- Three different Agent echoes are drawn from three different locations and persist in Agent memory/task state.
- The share action runs without browser errors and produces a 1080 × 1350 episode card with Web Share, clipboard, and download fallback paths.
- The return action closes the finale, exits the interior, restores the world HUD, and exposes the next-episode hook.
- The finale can be reopened from the completed journey/discovery state.
- At `390 × 844`, facts collapse into the five-door strip, all three Agent echoes remain readable, the verdict wraps, and both actions fit without horizontal overflow.
- Final browser console/page-error count: `0`.

## Final result

passed

---

# Design QA — Premium Civic Interior / 图 1 复刻纵切

## Source truth and verification state

- Source reference: `design/references/civic-interior-visual-target.png`
- Latest live desktop capture: `/tmp/mirrorlife-civic-fidelity-v3-desktop-final.png`
- Latest live mobile capture: `/tmp/mirrorlife-civic-fidelity-v3-mobile-final.png`
- Same-size combined comparison: `/tmp/mirrorlife-civic-fidelity-v3-comparison-final.png`
- Runtime URL: `http://localhost:4173/game.html?qaInterior=public-plaza&qaInteriorScene=1`
- Native viewports: `1672 × 941` and `390 × 844`.

The source and latest live implementation were judged together in one native-size comparison. The implementation is a real-time, physically navigable Three.js room rather than a static image: desktop input moved the player by about `1.10m`; the orbit camera changed from yaw `0` to `-1.20`; mobile joystick input changed the player position and a scene drag changed yaw from `0` to `-0.69`.

## Matched design language

- The entrance, listening wall, perimeter lounge, foreground work/display furniture and central brass listening circle reproduce the source's spatial hierarchy.
- Warm plaster, oak, terrazzo, teal upholstery, coral accents, foliage, glass and brass establish the same premium warm civic atmosphere.
- The source's dark translucent editorial HUD and four-option bottom action rail are implemented as live controls with responsive desktop/mobile layouts.
- Existing `record-desk.glb` is reused as the high-detail foreground hero asset; missing civic architecture and furniture are authored as coherent Three.js geometry.
- Four residents are staged around the story circle on desktop. The current 8-frame portrait atlas maps to eight distinct 3D identity profiles with different hair, eye color, face, clothing, bags and props. The civic review cast now deliberately uses teal listener, coral facilitator, brunette mediator and olive player silhouettes.
- Civic-role overrides now preserve those base portrait identities while adding the reference-specific cap, side braid, braided headband, tailored layers, skirt pleats, cuffs and backpack construction.
- A procedural terrazzo color/bump surface replaces hundreds of flat floor chips; an additional foreground tea table, covenant panel, contact shadows and actor-only warm rim light strengthen the foreground/background hierarchy without exceeding the scene budget.
- The player enters at the listening-circle edge instead of the cutaway wall, and the camera is framed around the conversation rather than a giant foreground avatar.
- Mobile touch controls remain visible beside the story action rail; an informational discovery card no longer suppresses the joystick.
- Legacy 2D canvas compositing is placed behind this room, removing the pale mobile veil while preserving the rest of the game's compatibility layer.

## Runtime evidence

- Desktop at `1672 × 941`: 79 draw calls and 282,573 triangles with four actors.
- Mobile at `390 × 844`: 72 draw calls and 255,263 triangles, zero horizontal overflow, visible joystick/action buttons and a ready Three.js scene.
- Camera orbit, keyboard movement, mobile joystick movement, touch camera drag, responsive FOV and atomic room readiness were exercised in the in-app browser.
- No runtime exceptions were observed. Local-only Vercel Analytics script messages are expected because `/_vercel/insights/script.js` is unavailable on localhost.

## Findings

### P0 / P1

- None remain in this representative room.

### P2 — remaining asset-fidelity gap

- The reference uses bespoke cinematic character sculpts, cloth silhouettes, facial features, micro-props, bounced light and material variation. The current Web implementation has reached the same composition and product direction, but its procedural citizens and several furnishings still read as a polished playable blockout when viewed directly beside the source.
- The final native-size comparison confirms the remaining gap is concentrated in authored assets and material response, not layout, camera, physics, UI or runtime performance. Further procedural geometry would add noise faster than fidelity.
- Reaching literal source quality now requires an authored shared-rig character kit and a small set of hero furniture/material assets; adding more procedural boxes would increase detail without closing the visible sculpt and surface-quality gap.
- The recommended production path and acceptance criteria are documented in `docs/design/avatar-2d-to-3d-pipeline.md`.

## Final result

blocked — interaction, layout, physics, camera and responsive quality pass; literal cinematic asset fidelity remains a P2 production task.

---

# Design QA — Social Avatar Fact Choice / 分身事实推演

## Source truth and verification state

- Accepted concept: `/tmp/mirrorlife-option-2.png`
- Implementation capture: `dist/interior-3d-work/fact-choice-review/desktop-fact-choice.png`
- Responsive capture: `dist/interior-3d-work/fact-choice-review/mobile-fact-choice.png`
- Combined same-size comparison: `/tmp/mirrorlife-fact-choice-comparison.png`
- Runtime URL: `http://127.0.0.1:4182/game.html?qaInterior=public-plaza&qaInteriorScene=1&qaPersonaFact=1&qaFresh=1`
- Native viewports: `1536 × 1024` and `390 × 844`.

The accepted concept and live implementation were inspected in one native-size `3072 × 1088` comparison canvas. The implementation deliberately preserves the approved full-viewport hierarchy while replacing generic “fact” copy with evidence from the running simulation.

## Five-point fidelity and evidence ledger

1. **Episode hierarchy — matched.** The ink header, centered dual-timeline title, act label and single rewrite token remain the dominant editorial frame.
2. **Fact / if polarity — matched and made systemic.** Coral now means the social avatar's derived fact; jade remains the one possible rewrite. The left headline changed from a generic retained action to the avatar's actual support-first choice.
3. **Evidence rails — intentionally upgraded.** The source's left past/present/future rail is replaced with three readable decision signals: persona, recent memory and value ranking. The right rail keeps the alternate timeline rhythm.
4. **Social tableau — matched within the shipped asset system.** Three distinct existing citizen sprites remain centered on the live Three.js room and do not collide with the action dock at desktop or mobile sizes.
5. **Action dock — matched and clarified.** The primary fact action says `保留分身选择` and explicitly states that personality, memory and relationship produced it; the alternate still communicates the cost of the episode's only rewrite.

## Functional evidence

- A seeded `ISFJ / 关怀 / 安全` avatar with support memories deterministically selects `invite-quiet`, although it is the scene's second authored option.
- Re-running the derivation against identical state produces the same choice and exact ranked scores.
- The overlay exposes at least two readable evidence items and binds its fact rail to the same `choiceId`.
- Selecting the fact persists `factChoiceId`, reason, up to three evidence lines, persona label, scores and decision version; it does not consume the rewrite token.
- Desktop and mobile screenshots have no horizontal overflow or clipped primary actions.
- In-app browser interaction completed the fact path and rendered `1/5` progress with `0` browser errors.

## Findings

- No actionable P0, P1 or P2 visual, interaction or persistence defects remain.
- [P3] Evidence text is deliberately clamped on the cinematic side rail so it cannot compete with the actors and decision dock. The complete reason persists in the receipt, finale and share text.

## Final result

passed

---

# Design QA — Counterfactual Episode / 方案 2

## Source truth and implementation

- Source target: `/tmp/mirrorlife-option-2.png`
- Implementation capture: `/tmp/mirrorlife-counterfactual-desktop.png`
- Responsive capture: `/tmp/mirrorlife-counterfactual-mobile.png`
- Combined comparison: `/tmp/mirrorlife-counterfactual-comparison.png`
- Desktop state: `1536 × 1024`, 邻里广场已读懂 3/3 段场所记忆、反事实选择层打开、改写次数为 1。
- Mobile state: `390 × 844`, 同一剧情与选择状态。

## Combined comparison pass

The source target and implementation were inspected side by side in one combined image at the same desktop viewport. The implementation preserves the target's defining composition: a dark editorial episode header, fact/if copy at opposite corners, paired vertical timelines, a luminous draggable split, a three-person social tableau, and a two-choice action dock. The game keeps its existing room and citizen asset system rather than introducing a disconnected visual language.

A separate focused crop was not necessary: this is a fixed, full-viewport cinematic overlay, and the combined full-view image already presents the header, timelines, cast, seam, and action dock together at readable scale. Cropping any one region would remove the cross-screen relationship that is the core of the design.

## Findings and resolutions

### P0 / P1

- None.

### P2 — resolved

- **Cast density and identity:** The first implementation pass showed four overlapping citizens with repeated art, weakening the source's intimate three-person scene. The final pass limits the cinematic cast to three, uses distinct frames from the existing citizen sprite sheet, and hides unrelated room occupants only while the choice layer is active.
- **Foreground collision:** The first pass placed the central citizen behind the choice dock. The final pass reduced the center actor's depth offset so the full silhouette remains readable above the controls.
- **Mobile action clipping:** The initial narrow layout compressed both choices into one row. At `390 × 844`, the choices now stack vertically with complete labels and practical tap targets.

### P3 — accepted

- The source target uses bespoke seated conversational poses, while the implementation uses MirrorLife's current profession-based citizen sprites. This is an intentional asset-system constraint, not a placeholder; the three roles remain visually distinct and the cinematic hierarchy is preserved.

## Core design and functionality

- **Typography:** Header, branch labels, consequence copy, and action hierarchy remain legible at desktop and mobile sizes. Long dynamic names wrap without colliding with the seam or timelines.
- **Spacing and layout:** The header, side timelines, central cast, and bottom choice dock maintain distinct layers. No overlapping controls or clipped action copy remain.
- **Viewport resilience:** Verified at `1536 × 1024` and `390 × 844`. The mobile view removes secondary timeline detail while retaining the decision, token, seam, consequence, and both complete actions.
- **Colors and tokens:** Ink surfaces, coral fact state, jade future state, warm gold rewrite line, and the room's dopamine palette match the selected direction and retain sufficient contrast.
- **Image quality and fidelity:** Existing high-resolution room art and project-native sprite frames are used directly; no placeholder boxes, CSS characters, or substitute SVG illustrations were introduced.
- **Copy and content:** Fact and future branches describe different social consequences. Dynamic participant names and next-day effects make the choice specific to the simulated society.
- **States and interactions:** Verified fact choice, future rewrite choice, token consumption/retention, persistent 1/5 location progress, result receipt, next-chapter CTA, and share CTA.
- **Accessibility:** The overlay is a labeled dialog; choices and seam are semantic buttons; A/D/Escape keyboard handlers are present; mobile tap targets exceed the practical minimum; focus enters the future choice when the dialog opens.

## Runtime evidence

- Fact branch: result card appears, scene becomes `1/5`, rewrite token remains `1`.
- Future branch: result card appears, scene becomes `1/5`, rewrite token becomes `0`.
- Share receipt CTA appears for both outcomes.
- Browser error log: `0` errors during final desktop and mobile verification.
- Syntax checks and repository checks are recorded in the delivery summary.

## Comparison history

1. Initial pass: correct composition, but four repeated citizens and a clipped center actor.
2. Responsive pass: stacked mobile actions fixed complete-label visibility.
3. Final pass: three distinct citizen roles, centered social tableau, unobstructed silhouettes, and matched desktop framing.

## Final result

passed
