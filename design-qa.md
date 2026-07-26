# Design QA — Civic Room Reference Rebuild / 2D Avatar Identity to 3D

## 2026-07-26 reference-fidelity v140 real head-UV identity, reference head ratio and reverse-orbit visibility gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`, device scale factor `1`).
- Browser-rendered implementation: `dist/interior-3d-work/environment-review/00-public.png` (`1280 × 720`, deterministic 06:00 public-plaza testimony state).
- Mandatory normalized comparison: `tmp/v140-reference-full-pair.png` (`2560 × 720`) places the source and implementation at equal `1280 × 720` size on one canvas. Actor-focused evidence is `tmp/v140-character-focus-pair.png`.
- Face-mode audit: `tmp/v140-face-mode-audit-board.png` and `tmp/v140-face-mode-close-board.png` compare curved-atlas, sculpted-volume, UV-hybrid and illustrated modes in the same room/camera. UV-hybrid is the only tested mode that preserves source-like illustrated identity while retaining the real head, volumetric eyes, gaze and blink.
- Full 3D evidence: `tmp/v140-four-direction-board.png` contains yaw `0°`, `90°`, `180°` and `270°`; mobile evidence is `dist/interior-3d-work/environment-review-mobile/00-public.png` at `390 × 844`; forced eye deformation is recorded in `dist/interior-3d-work/environment-review-blink/00-public.png`.
- Runtime evidence: desktop headings remain `174–178` draw calls, `298,594–350,426` triangles and `168–177` geometries. Mobile uses the curved-atlas LOD at `106 / 244,054 / 80`, inside the strict `110 / 250k` phone budget. Every captured view reports zero shader errors.
- Interaction evidence: the final Rapier-controlled regression moved the player `2.53m`, rotated the camera `65.3°` and retained UV-hybrid identity-surface blink. Physics passed for `26` zones / `10` archetypes; desktop/mobile scene flow passed; `78` transitions across all `26` zones completed without failures or runtime errors.
- Asset evidence: all four role GLBs now use sculpt contract v79 and body-identity contract v9. The set remains `7.42 MB`; every role stays below `45k` triangles and `2 MB`.

### Comparison history, fixes and post-fix evidence

- [fixed from v139 P1 / desktop faces were faint curved cards laid over the head] Desktop production now paints each role's authored identity through the real head UVs. The real morphable head remains the occluding and shaded surface; no rectangular face card or camera-facing sprite is present.
- [fixed from v139 P1 / volumetric face mode looked like an undifferentiated doll] The selected UV-hybrid combines role-specific brow, eye and mouth identity with two real eye volumes, gaze tracking, shader-driven eyelid deformation and existing smile/speech/attention/asymmetry morphs.
- [improved from v139 P1 / the source cast's heads were visibly broader at gameplay distance] The source comparison measures roughly `0.46m` across the complete skull/hair silhouette. Body contract v9 widens role-authored heads while preserving the `1.75m` top height and authoritative actor capsule.
- [checked / UV identity must survive a real orbit] Four-heading evidence exposes front, profile and reverse silhouettes without a rectangular seam. Hair and skull continue to occlude the identity surface naturally.
- [fixed during v140 / mobile UV identity exceeded the phone triangle gate] Production selection is now responsive: desktop uses UV-hybrid; phone uses the existing curved-atlas identity LOD. Mobile finishes at `244,054 / 250,000` triangles instead of failing at `251,110`.
- [fixed during v140 / reverse orbit was covered by an apparently opaque foreground asset] Bench and multi-material hero assets now fade each material layer to the occlusion floor. The former compounded `14%` layers no longer form a solid lower-third wall at `180°`; the complete cast, story ring and reverse-wall destination remain readable.

### Required fidelity surfaces and findings

- [improved][character identity and image quality] Desktop citizens now have readable role-specific facial identity on real 3D head topology, broader source-weighted head proportions, volumetric eyes and real blink deformation. The source remains ahead in individual facial planes, iris craft, hair strand grouping, mouth corners and expression nuance.
- [checked][spatial truth and camera behavior] The character scale change does not alter metre-space capsules, foot contact, interaction anchors or navigation. All four headings retain the cast and current target; reverse-orbit foreground furniture now performs as a translucent frame instead of a camera block.
- [checked][responsive behavior] Desktop receives the higher-fidelity identity path; portrait mobile retains a coherent character silhouette, 44px+ controls, no horizontal overflow and its release performance budget.
- [checked][fonts, typography and copy] Place memory, counters, action rail, story state and contextual interaction remain readable. No private-memory text or unsupported public statistics were introduced.
- [checked][colors and material hierarchy] Ivory, oak, teal, coral, butter, brass and mineral floor remain coherent. The source still owns subtler face/garment colour bounce, lower costume saturation and richer transmission through hair, plants and glass.
- [P1][role-specific production face craft remains behind] The UV system is now structurally correct, but the four identities still need individually authored iris scale, eyelid fold, cheek/nose planes, hairline integration and expression-specific texture variation to reach the source.
- [P1][complete-room asset craft remains behind] The source continues to have denser bespoke joinery, textiles, botanical species, paper wear, glass behavior and irregular small-object clustering across the complete frame.
- [P1][offline-quality light transport remains ahead] Real-time key/fill, portal bounce, foliage projection and contact AO are stable, while the source retains softer penumbrae, broader indirect colour, more flattering facial light and materially richer translucency.
- [P2][mobile identity is intentionally lower fidelity] The phone LOD meets the release budget but returns to the curved-atlas face and therefore has less convincing profile integration than desktop.
- [P2][HUD optical finish remains behind] Coverage and interaction pass, while the source still has finer icons, tighter counters, more coherent glass layering and higher-quality button-edge treatment.

### Implementation checklist

- Preserve desktop UV-hybrid and mobile curved-atlas production selection; do not regress desktop to a camera-facing face card or push the phone over `250k` triangles.
- Continue through four separately authored face/iris/hairline sets and expression texture variation on the existing real UV/morph/eye foundation.
- Keep foreground multi-material occlusion at the `0.04` per-layer floor unless the assembly is first consolidated into a single transparency layer.
- Spend the next room pass on wall-wide joinery, textiles, plant species and transmission rather than adding more circulation obstacles.

### Gate result

v140 replaces the desktop's faint identity card with a real UV-painted, morphable and fully orbitable 3D head; restores the reference's broader illustrated head proportion; preserves volumetric gaze/blink; keeps the phone under its hard render budget; and removes the most disruptive reverse-camera block. The mandatory same-canvas comparison still contains actionable P1 gaps in per-character face/hair craft, complete-room secondary asset craftsmanship and offline-quality light/material transport.

final result: blocked

Blocker: source-level role-specific face/hair finish, bespoke room-wide asset craft and offline-quality indirect light/material transport remain visibly ahead of the real-time implementation.

## 2026-07-26 reference-fidelity v139 authored foreground object families and physical desk-detail gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`, device scale factor `1`).
- Browser-rendered implementation: `dist/interior-3d-work/environment-review/00-public.png` (`1280 × 720`, deterministic 06:00 public-plaza testimony state, device scale factor `1`).
- Mandatory normalized full-view comparison: `tmp/v139-reference-full-pair.png` (`2560 × 720`); source and implementation are normalized to equal `1280 × 720` frames and were inspected together on one canvas.
- Mandatory foreground comparison: `tmp/v139-foreground-detail-pair.png` (`1240 × 540`); equal-size crops expose the display case, record desk, paper construction, vessel silhouettes and foreground-to-story-circle proportion.
- Full 3D evidence: `tmp/v139-four-direction-board.png` (`1280 × 720`) contains yaw `0°`, `90°`, `180°` and `270°`; responsive evidence: `dist/interior-3d-work/environment-review-mobile/00-public.png` at `390 × 844`.
- Runtime evidence: opening `174 / 287,394 / 177`, side `177 / 298,502 / 168`, reverse `178 / 339,226 / 174`, fourth orbit `176 / 324,258 / 175` for draw calls / triangles / geometries; mobile is `106 / 244,054 / 80`. Every final view reports zero shader errors and remains inside desktop `180 / 450k` and phone `110 / 250k` release budgets.
- Interaction evidence: the Rapier-controlled player walked `3.45m`, rotated the camera `65.3°` and retained curved identity-surface blink. Physics passed for `26` zones / `10` archetypes; desktop/mobile scene flow passed; `78` transitions across all `26` zones completed without failures or runtime errors.
- Asset evidence: furniture contract v15 contains three authored civic GLBs and `73,930` authored triangles: display case `20,528`, notice console `22,156`, lounge suite `31,246`, all below the shared `95k` asset budget. Surface contract v5 is active in every captured desktop heading.

### Comparison history, fixes and post-fix evidence

- [improved from v137 P1 / the display shelf repeated four nearly identical pale domes] The lower shelf now contains a listening pastry, handled teal witness cup, berry tart and sealed memory parcel. Each family owns a distinct silhouette, material role and civic-story use rather than changing only colour.
- [fixed during v139 / the display case competed with the real “今日议题” desk board] The oversized duplicate white board is now a small counter certificate. The record desk remains the single readable foreground agenda surface.
- [improved from v137 P1 / vessels were solid rounded primitives] Pottery now uses authored lathed profiles with restrained asymmetry, real mouth openings, dark interiors, feet and glaze bands. The display bouquet uses petal-and-centre flower construction instead of spherical lollipop heads.
- [improved from v137 P1 / paper and archive objects had no reverse-side construction] Document packets gain curled three-dimensional paper corners; the lounge archive box gains a real handle and four corner protectors; aged-oak frame sections separate load-bearing structure from lighter display surfaces.
- [improved from v137 P1 / the record desk still looked like stacked blocks] The desk now carries an open witness ledger with two page blocks, gutter, ruled pages and lifted corner; a laid pencil; a water plane and meniscus inside the glass; an open pen cup; and a file tray with base, side walls and rear wall.
- [improved from v137 P1 / hero furniture read too small and detached from the editorial frame] Display case, record desk and lounge suite were enlarged and moved into a source-like foreground/midground rhythm. Their visual transforms, colliders and interaction anchors were updated together, so the denser framing does not create false walkable gaps.
- [improved][material variation] Surface contract v5 adds restrained hand patina to scanned wood and a low-amplitude deckle response to paper while preserving the authored wood/paper semantics and current batching envelope.
- [checked / the richer opening must remain a real rotating room] The four-heading board retains the complete cast and current target. Near furniture fades in the fourth view; the door, evidence wall and target remain visible rather than being removed for the screenshot.

### Required fidelity surfaces and findings

- [checked][fonts and typography] Place memory, status rail, action rail and interaction prompt remain readable at desktop and portrait sizes. The source still has finer icons, tighter counter spacing and more convincing layered glass.
- [improved][spacing and layout rhythm] The implementation now owns a cropped foreground record desk, a substantial display case, a readable central testimony ring and a distinct lounge zone. The source still has denser controlled asymmetry and more continuous room-edge dressing.
- [improved][colors and visual tokens] Ivory, aged oak, walnut, teal, coral, butter, brass and mineral floor remain coherent; the differentiated display objects prevent the former pale monochrome shelf. The implementation still has stronger costume saturation and less natural colour bleeding.
- [improved][image quality and asset fidelity] Real vessel openings, paper curls, tray walls, glass water, archive hardware, differentiated food/parcel silhouettes and flower petals materially reduce the generated-block read. The source still owns finer joinery, fabric weave, glass transmission, botanical anatomy, paper wear and small hardware.
- [checked][copy and content] “倾听线索”, “倾听墙”, place-memory state and contextual interaction remain coherent; no raw private-memory text or unsupported public statistics were introduced.
- [checked][icons and interaction states] Action selection, keyboard movement, camera drag, phone controls, blink, hand/prop contact and atomic room warmup remain functional.
- [checked][physical truth, accessibility and responsiveness] One world unit remains one metre; enlarged hero-prop visual transforms and colliders share the same authored coordinates; player/NPC capsules cannot pass through or stand on the display case, desk or lounge. Mobile retains 44px+ controls, no horizontal overflow and the strict render budget.
- [P1][complete production-character craft remains behind] The citizens are fully 3D, walkable, lit and animated, but the source still has subtler face planes, hair clumping, garment compression, hand contact and character-specific indirect response.
- [P1][complete-room asset craft remains behind] v139 resolves the clearest foreground repetition and hollow-object defects, but the source still has more bespoke wall-wide joinery, textiles, botanical species, wear variation and naturally irregular small-object clustering.
- [P1][offline-quality light and material transport remains ahead] Real-time key/fill, portal bounce, foliage projection and contact AO preserve readability, but the source retains broader colour bounce, softer penumbrae, richer glass/leaf transmission and more flattering facial light.
- [P2][orbit composition remains uneven] Every heading is playable, but side/reverse views are necessarily quieter and the `270°` camera exposes translucent foreground furniture during collision/occlusion avoidance.
- [P2][HUD optical finish remains behind] Coverage and responsiveness pass, while icon family, compact counters, layered translucency and button-edge treatment remain more utilitarian than the target.

### Implementation checklist

- Preserve furniture v15 and surface v5; do not regress to four identical display domes, solid pottery, flat paper corners, closed storage primitives or the duplicate large white board.
- Continue character work through role-specific face/hair/garment secondary forms and more natural hand-to-prop compression.
- Add the next room-wide craft pass through textile weave, botanical species, wall joinery and restrained wear rather than filling circulation with more obstacles.
- Keep every future detail inside the current `174–178` desktop and `106` mobile draw-call envelope, or recover cost through batching/LOD before adding it.

### Gate result

v139 gives the reference-facing foreground distinct civic object families, physically constructed desk accessories, hollow/asymmetric ceramics, source-like prop scale and a materially denser editorial frame while preserving metre-scale physics, real character movement, complete 360° camera rotation, responsive controls and release performance. The mandatory same-canvas evidence still contains actionable P1 gaps in source-level complete-room asset craftsmanship, production character nuance and offline-quality light/material transport.

final result: blocked

Blocker: source-level bespoke room-wide secondary assets, production character finish and offline-quality indirect light/material transport remain visibly ahead of the real-time implementation.

## 2026-07-26 reference-fidelity v137 curated civic detail and indirect-light gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`, device scale factor `1`).
- Browser-rendered implementation: `dist/interior-3d-work/environment-review/00-public.png` (`1280 × 720`, deterministic 06:00 public-plaza testimony state, device scale factor `1`).
- Mandatory normalized full-view comparison: `tmp/v137-reference-full-pair.png` (`2560 × 720`); the source and implementation are normalized to equal `1280 × 720` frames and were inspected together on one canvas.
- Mandatory lounge/detail comparison: `tmp/v137-lounge-focus-pair.png` (`1024 × 450`); equal-size `512 × 450` source and implementation crops expose book rhythm, paper depth, ceramics, plants, lounge joinery and negative space.
- Full 3D evidence: `tmp/v137-four-direction-board.png` (`1280 × 720`) contains yaw `0°`, `90°`, `180°` and `270°`; responsive evidence: `dist/interior-3d-work/environment-review-mobile/00-public.png` at `390 × 844`.
- Runtime evidence: opening `174 / 279,984 / 177`, side `177 / 291,092 / 168`, reverse `178 / 331,816 / 174`, fourth orbit `176 / 316,848 / 175` for draw calls / triangles / geometries; mobile is `106 / 241,124 / 80`. Every final view reports zero shader errors and remains inside desktop `180 / 450k` and phone `110 / 250k` release budgets.
- Camera evidence: the opening retains `49.4° / 5.84m`; side views widen to `52.95° / 6.475m`; reverse uses `55.2° / 6.9m` plus `1.6m` actor avoidance and `1.55m` clearance. The four-heading board retains the cast and current target while near furniture fades instead of becoming an opaque camera block.
- Interaction evidence: the real Rapier-controlled player walked `3.49m`, rotated the camera `65.3°` and retained curved identity-surface blink. Physics passed for `26` zones / `10` archetypes; desktop/mobile scene flow passed; `78` transitions across all `26` zones completed with no failures or runtime errors.
- Asset evidence: furniture contract v14 contains three authored civic GLBs and `68,710` authored triangles: display case `16,504`, notice console `21,832`, lounge suite `30,374`, all below the shared `95k` asset budget.

### Comparison history, fixes and post-fix evidence

- [improved from v136 P1 / the lounge shelf repeated a uniform fifteen-book grid] The lounge suite now uses nine differently scaled upright books, two horizontal reading stacks, an archive box with lid and label, and a framed witness portrait. Deliberate shelf gaps replace the generated supermarket-row rhythm while preserving one authored asset and the draw-call gate.
- [improved from v136 P1 / public-room plants repeated the same generic sculpt] The duplicate desktop floor-plant pair was removed. The opening now separates a broad-leaf portal specimen, a rear-right ficus, the lounge asset's trailing plant and small ceramic greenery by silhouette, height and narrative zone; mobile retains a single low-cost depth proxy.
- [improved from v136 P1 / secondary paper and archive language was too generic] Reading stacks, archive storage, witness portrait, document packet and bookends now tell a civic-record story rather than filling shelves with interchangeable blocks.
- [fixed during v137 / the first indirect-light pass over-lifted oak and reduced contact hierarchy] Civic light transport v5 rebalances direct key to `1.68`, adds neutral ceiling/rear bounce at `0.28 / 0.17`, sets environment contribution to `0.33`, and keeps GTAO strong enough to ground cabinet feet, citizens and the story circle. Final exposure remains `0.90`.
- [checked / the denser source-like opening must remain a truthful traversable room] All new details live inside existing authored hero assets or behind wall/furniture footprints. Navigation surfaces, furniture colliders, interaction anchors and actor capsules remain unchanged and authoritative in every heading.
- [checked / 360° staging does not manufacture a single front-only set] Side and reverse headings retain readable architecture, characters and destination cues. Near furniture becomes translucent, while the door, evidence surfaces and current speaker stay visible.

### Required fidelity surfaces and findings

- [checked][fonts and typography] Place memory, status counters, action rail and interaction prompt remain readable at desktop and portrait sizes. The source still has finer icon drawing, tighter optical spacing and more convincing layered glass.
- [improved][spacing and layout rhythm] The lounge shelves now alternate upright, stacked, framed and open intervals; the opening has clearer foreground desk, story-circle midground and window/notice-wall background layers. The source remains denser and more naturally irregular across the complete room.
- [improved][colors and visual tokens] Neutral warm key, cool fill, teal textiles, oak, brass, ivory and coral are more evenly separated. The implementation still has stronger local saturation and less organic colour bleeding than the source.
- [improved][image quality and asset fidelity] Book, archive, portrait and botanical silhouettes are less repetitive, and v5 light transport restores contact while lifting the room. The source still owns richer joinery, paper thickness, material wear, glass transmission, botanical leaf variation and small-scale craft.
- [checked][copy and content] “倾听线索”, “倾听墙”, place-memory state and contextual interaction remain coherent; no private-memory content or unsupported public statistics were introduced.
- [checked][icons and interaction states] Action selection, keyboard movement, camera drag, phone controls, blink, prop contact and atomic room warmup remain functional.
- [checked][physical truth, accessibility and responsiveness] One world unit remains one metre; furniture render transforms and colliders remain aligned; player and NPC capsules cannot stand on or pass through authored props. Mobile retains 44px+ controls, no horizontal overflow and the strict render budget.
- [P1][complete production-character craft remains behind] v137 preserves the continuous anatomy and asymmetric stance work, but the source still has subtler garment compression, hand contact, hair clumps, facial planes and character-specific indirect light.
- [P1][complete-room asset craft remains behind] The most obvious lounge repetition is removed, but source-level bespoke joinery, ceramics, desk objects, plant species, paper edges and lived-in wear are not yet present across every visible wall and foreground surface.
- [P1][offline-quality light transport remains ahead] Budgeted hemisphere, portal, ceiling and rear-wall bounce improve hierarchy, yet the source retains broader colour bounce, softer penumbrae, richer foliage/glass transmission and more flattering face-to-garment separation.
- [P2][orbit composition remains uneven] All headings are playable and preserve key cues, but side/reverse views are intentionally quieter and contain translucent foreground geometry during camera avoidance.
- [P2][HUD optical finish remains behind] Interaction coverage passes, while icon family, compact counter rhythm, translucent depth and button-edge treatment remain more utilitarian than the target.

### Implementation checklist

- Preserve furniture v14 and light transport v5; do not regress to repeated shelf grids, duplicate generic floor plants or a direct-light-only room.
- Upgrade the remaining display-case and notice-console paper, ceramic and hardware families with real thickness, back faces, wear masks and source-specific silhouettes.
- Continue characters through role-specific hair/garment secondary forms and softer face/cloth indirect response.
- Keep all future detail behind the current `174–178` desktop and `106` mobile draw-call envelope, or recover cost through static batching and LOD before adding it.

### Gate result

v137 removes the most visible procedural repetition, gives the lounge a civic archive narrative, differentiates botanical silhouettes and introduces a deliberately budgeted indirect-light hierarchy while preserving metre-scale physics, real movement, complete 360° camera rotation, responsive controls and release performance. The mandatory same-canvas evidence still contains actionable P1 gaps in source-level complete-room asset craftsmanship, production character nuance and offline-quality indirect transport.

final result: blocked

Blocker: source-level bespoke room-wide secondary assets, production character finish and offline-quality indirect light/material transport remain visibly ahead of the real-time implementation.

## 2026-07-26 reference-fidelity v136 continuous upper-arm anatomy and asymmetric stance gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`, RGB, device scale factor `1`).
- Browser-rendered implementation: `dist/interior-3d-work/environment-review/00-public.png` (`1280 × 720`, deterministic 06:00 public-plaza testimony state, device scale factor `1`).
- Mandatory normalized full-view comparison: `tmp/v136-reference-full-pair.png` (`2560 × 720`); the source is resampled to the implementation's exact `1280 × 720` content viewport and both frames are judged on one canvas.
- Mandatory actor-focused comparison: `tmp/v136-character-focus-pair.png` (`1520 × 520`); equal-size source/implementation crops expose shoulder flow, elbow volume, forearm taper, hand rhythm, stance and prop contact.
- Full 3D evidence: `tmp/v136-four-direction-board.png` contains yaw `0°`, `90°`, `180°` and `270°`; responsive evidence: `dist/interior-3d-work/environment-review-mobile/00-public.png` at `390 × 844`.
- Runtime evidence: opening `176 / 298,500`, side `179 / 309,608`, reverse `180 / 350,332`, fourth orbit `178 / 335,364`; mobile `106 / 248,312`. Every final view reports zero shader errors and remains inside desktop `180 / 450k` and phone `110 / 250k` release budgets.
- Interaction evidence: the real Rapier-controlled player walked `3.33m`, rotated the camera `65.3°` and retained curved identity-surface blink. Physics passed for `26` zones / `10` archetypes; desktop/mobile scene flow passed; `78` transitions across all `26` zones completed with no failures or runtime errors.
- Asset evidence: all four GLBs use sculpt contract v78, shoulder continuity v3, arm anatomy v1 and animation clips v19. The complete set is `7.42 MB`; the largest role stays below `45k` triangles and every file stays below `2 MB`.

### Comparison history, fixes and post-fix evidence

- [improved from v135 P1 / upper limbs still read as straight tubes joined at a hinge] The continuous skin now follows fourteen authored rings through clavicle overlap, deltoid cap, bicep turn, broad elbow transition, forearm flexor flare and wrist taper. Elbow skin weights expand from a `15cm` to `21cm` falloff, so shoulder and lower arm share the bend instead of collapsing at one ring.
- [improved from v135 P1 / the elbow had volume but no readable compression language] Each arm now owns an inner elbow fold and outside tension plane driven by the existing bend corrective. The traveler receives a six-ring bare forearm overlay that follows the same controller instead of a uniform four-ring tube.
- [fixed during v136 / first animation pass still produced identical player upper-arm angles] The first capture exposed `left=-0.152 / right=-0.152`. The role listen offset was corrected and the post-fix capture reports `left=-0.211 / right=-0.061`, with distinct wrist, elbow, leg yaw and support-foot rhythm.
- [improved from v135 P2 / every witness stood almost square to the circle] Role-authored foot yaw now drives a wider but still restrained pelvis spiral (`±0.065rad`) and stronger upper-body counter twist. Listener, facilitator and mediator preserve different support legs, shoulder banks and arm narratives rather than sharing the player's stance.
- [fixed during v136 / new desktop anatomy could have broken the phone gate] Phone LOD explicitly removes elbow crease/tension micro-surfaces while retaining the revised continuous limb silhouette. Final phone cost is `248,312 / 250,000` triangles with the same real metre scale and physical capsule.

### Required fidelity surfaces and findings

- [checked][fonts and typography] Place memory, top status, action rail and interaction prompt remain readable across desktop and portrait captures. The source still has finer icon drawing, tighter optical spacing and more refined translucent panel depth.
- [improved][spacing and layout rhythm] Four characters now form less repetitive shoulder/arm and load-bearing leg rhythms. The source still stages them with richer overlap, more varied gesture height and tighter editorial grouping.
- [improved][colors and visual tokens] Warm ivory, teal, forest, coral, oak and brass remain coherent through every heading. The implementation still has flatter local colour and stronger saturation than the source's warm multi-bounce grade.
- [improved][image quality and asset fidelity] Real deltoid-to-forearm flow, broader elbow deformation and role-separated poses reduce the assembled mannequin read. The source still has finer hand/arm anatomy, more credible garment compression, richer facial planes, denser hair clumps and materially more bespoke secondary objects.
- [checked][copy and content] Testimony, place memory, action language and interaction prompt remain coherent; no private-memory content or unsupported public statistics were added.
- [checked][icons and interaction states] Action selection, keyboard movement, camera drag, phone controls, blink, prop contact and atomic room warmup remain functional.
- [checked][physical truth, accessibility and responsiveness] One world unit remains one metre; visual limb changes do not alter the Rapier capsule, furniture collision, interaction radius or navigation surface. Mobile keeps 44px+ controls, no horizontal overflow and the continuous arm silhouette.
- [P1][complete production-character anatomy remains behind] The new upper-arm chain fixes the largest straight-tube and symmetric-pose defects, but the source still owns continuous cloth-to-skin transitions, knuckle/nail planes, natural shoulder blade response, subtler hand contact and more nuanced facial volume.
- [P1][complete-room asset craft remains behind] The source has materially denser and more silhouette-distinct plants, papers, books, glassware, joinery and foreground framing. The implementation still repeats secondary families and exposes simplified cabinetry.
- [P1][offline-quality light transport remains ahead] Real-time key/fill, foliage projection and contact AO remain stable, but the source retains broader colour bounce, softer penumbrae, stronger glass/foliage transmission and more flattering indirect facial light.
- [P2][orbit composition remains uneven] The opening is readable and all headings preserve the cast, yet `270°` still exposes a broad quiet plaster/floor field while the fixed source frame keeps almost every edge narratively dressed.
- [P2][HUD optical finish remains behind] Coverage and interaction pass, while the icon family, typographic counters, glass layers and compact control edges remain more utilitarian than the target.

### Implementation checklist

- Preserve v78/v19 upper-arm and stance contracts; do not regress to a narrow elbow blend or identical player arm angles.
- Continue the next character pass through scapula/cloth response, knuckle/nail planes and role-specific shoulder-to-hand contact.
- Replace the three most repeated foreground plant/book/paper families with silhouette-distinct authored variants.
- Add restrained probe/lightmap colour bounce only if every heading and the `248,312`-triangle phone gate remain green.

### Gate result

v136 replaces the straight upper-arm hinge with a continuous deltoid–bicep–elbow–forearm flow and gives the four citizens genuinely different load-bearing and conversational poses while preserving real movement, camera rotation, responsive controls, contact constraints, physics and release budgets. The same-canvas evidence still contains actionable P1 gaps in complete production anatomy, room-wide secondary craft and offline-quality indirect transport.

final result: blocked

Blocker: source-level complete character anatomy, bespoke room-wide secondary asset craftsmanship and offline-quality indirect transport remain visibly ahead of the real-time implementation.

## 2026-07-26 reference-fidelity v135 continuous hands and constructed garment-edge gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`, RGB, device scale factor `1`).
- Browser-rendered implementation: `dist/interior-3d-work/environment-review/00-public.png` (`1280 × 720`, deterministic 06:00 public-plaza testimony state).
- Mandatory normalized full-view comparison: `tmp/v135-reference-full-pair.png` (`2560 × 720`); the source is resampled to the implementation's exact `1280 × 720` content viewport and both frames are judged on one canvas.
- Mandatory actor-focused comparison: `tmp/v135-character-focus-pair.png` (`1520 × 520`); equivalent source/implementation crops expose palm-to-finger continuity, cuff/ankle construction, skirt silhouette, prop contact and character scale.
- Full 3D evidence: `tmp/v135-four-direction-board.png` contains yaw `0°`, `90°`, `180°` and `270°`; responsive evidence: `dist/interior-3d-work/environment-review-mobile/00-public.png` at `390 × 844`.
- Runtime evidence: opening `176 / 297,652`, side `179 / 308,760`, reverse `180 / 349,484`, fourth orbit `178 / 334,516`; mobile `106 / 247,736`. Every final view reports zero shader errors and remains inside desktop `180 / 450k` and phone `110 / 250k` release budgets.
- Interaction evidence: the browser regression moved the real Rapier-controlled player `3.49m`, rotated the camera `65.3°` and verified the curved identity-surface blink. Physics passed for `26` zones / `10` archetypes; desktop/mobile scene flow passed; `78` transitions across all `26` zones completed without failures or runtime errors.
- Asset evidence: the four role GLBs use sculpt contract v77, hand contract v11 and garment-topology contract v5. The complete set remains `7.38 MB`; no source asset exceeds the existing `2 MB / 45k` Web LOD0 limits.

### Comparison history, fixes and post-fix evidence

- [improved from v134 P1 / fingers still emerged as four independent cylinders] Each hand now owns a watertight metacarpal fan with real thickness and variable interdigital webs. Enlarged six-ring finger roots disappear into this shared skin volume; the authored pivots and shader-driven curl remain independent after runtime batching.
- [improved from v134 P1 / cuffs and ankle transitions read as uniform plastic bracelets] The traveler short sleeve, listener jacket cuff, both civic cardigan cuffs and every trouser/boot transition now use four authored elliptical rings with small side/depth offsets. The focused and four-heading comparisons retain those connections during quarter and reverse views.
- [improved from v134 P1 / skirt construction disappeared outside the opening angle] Civic skirts now have separately authored front and rear hems, five-point height variation and preserved side-release folds. Coat hems receive role/side-specific height differences instead of one mirrored three-point arc.
- [improved / hands remained visually subordinate at the real story lens] Role hand scales increase by roughly four percent, matching the source's soft illustrated proportion while keeping the same wrist pivots, physical capsules and interaction anchors.
- [fixed during v135 / complete desktop topology pushed phone to `251,944` triangles] Phone LOD now uses the connected palm/web as a coherent mitten silhouette and removes sub-pixel six-ring digits, palm creases and rear-only skirt trim. The final phone capture is `247,736` triangles; desktop keeps the full articulated geometry and hand v11 deformation.

### Required fidelity surfaces and findings

- [checked][fonts and typography] Chinese place state, story memory, action rail and interaction prompt remain readable in full-view and portrait captures. The source still has a finer icon/type family, tighter optical spacing and more refined translucent depth.
- [improved][spacing and layout rhythm] The actor crop preserves four separated silhouettes, readable prop contact and a clearer lower-body rhythm. The source still stages the cast with more natural shoulder/hand overlap and denser controlled room dressing.
- [improved][colors and visual tokens] Skin, warm ivory, forest/teal cloth, coral hair and brown footwear remain coherent under the civic light preset. The implementation still has stronger saturation and flatter local colour than the source's multi-bounce palette.
- [improved][image quality and asset fidelity] Hands now read as one connected organic form, and clothing terminates through constructed hems/cuffs rather than geometric rings. The source still has more natural palm anatomy, finer facial planes, role-specific tailoring, richer hair grouping and subtle textile compression.
- [checked][copy and content] The visible testimony state, speaker beacon and action language remain coherent; no new private-memory text or unsupported social statistics were introduced.
- [checked][icons and interaction states] Action selection, keyboard movement, camera drag, phone controls, blinking, hand/prop contact and atomic scene warmup remain functional.
- [checked][physical truth, accessibility and responsiveness] Visual hand and garment changes do not alter the Rapier capsule, metre scale, collision map, interaction radius or floor contact. Phone LOD removes only sub-pixel cosmetic topology and preserves the complete actor silhouette.
- [P1][production character anatomy remains visibly behind] v135 removes the largest palm/finger and cuff/hem assembly defects, but the source still owns continuous elbow/hand skin transitions, authored nails/knuckles, richer eye sockets, softer jaw planes and more natural garment compression.
- [P1][complete-room asset craft remains behind] The same-canvas pair still exposes simpler foreground cabinetry, repeated plant/book families, lower paper/glass variation and less convincing surface wear than the reference.
- [P1][offline light transport remains ahead] Warm key/fill and contact AO remain coherent, but the source retains broader colour bounce, softer contact penumbrae, stronger foliage/glass transmission and more flattering indirect actor light.
- [P2][actor staging remains more game-board-like] The source gives each citizen more organic stance and conversational asymmetry; the implementation's authored circle remains readable but more evenly distributed and upright.
- [P2][HUD optical finish remains behind] Functional coverage passes, while icon language, compact typography, panel depth and button-edge treatment remain more utilitarian than the target.

### Implementation checklist

- Preserve hand v11 and garment topology v5; do not trade the connected web or asymmetric hems back for primitive rings.
- Continue the next character pass through elbow-to-wrist skin continuity, role-authored stance asymmetry and garment compression around hips/knees.
- Replace the three most repeated foreground prop families with silhouette-distinct authored variants.
- Add probe/lightmap-assisted colour bounce only if all desktop headings and the `247,736`-triangle phone gate remain green.

### Gate result

v135 replaces the most visible assembled-toy hand, cuff and hem relationships with connected organic and constructed clothing topology while preserving real walking, camera rotation, prop contact, responsive controls, physics and strict release budgets. The mandatory same-canvas comparisons still contain actionable P1 gaps in production anatomy/garment deformation, complete-room secondary craft and offline-quality indirect transport.

final result: blocked

Blocker: source-level continuous elbow/hand anatomy, room-wide bespoke secondary assets and offline-quality indirect transport remain visibly ahead of the real-time implementation.

## 2026-07-26 reference-fidelity v134 west witness library and facial-continuity gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`, RGB, device scale factor `1`).
- Browser-rendered implementation: `dist/interior-3d-work/environment-review/00-public.png` (`1280 × 720`, deterministic 06:00 public-plaza testimony state).
- Mandatory normalized full-view comparison: `tmp/v134-reference-full-pair.png` (`2560 × 720`); the source is resampled to the implementation's exact `1280 × 720` content viewport and both frames are judged on one canvas.
- Full 3D evidence: `tmp/v134-four-direction-board.png` contains yaw `0°`, `90°`, `180°` and `270°`; responsive evidence: `dist/interior-3d-work/environment-review-mobile/00-public.png` at `390 × 844`.
- Runtime evidence: opening `176 / 294,812`, side `179 / 305,920`, reverse `180 / 346,644`, fourth orbit `178 / 331,676`; mobile `106 / 249,952`. Every final view reports zero shader errors and remains inside desktop `180 / 450k` and phone `110 / 250k` release budgets.
- Interaction evidence: the browser regression moved the real Rapier-controlled player `2.85m`, rotated the camera `65.3°`, verified curved identity-surface blinking and retained body, foot and facial contracts. Physics passed for all `26` zones / `10` archetypes; desktop/mobile scene flow passed; transition stress completed `78` transitions across `26` zones with no failures or runtime errors.
- Asset evidence: all four role GLBs were rebuilt under sculpt contract v76, body-identity contract v8, face-identity contract v6 and a new orbital/lip-bed continuity contract. The complete set remains `7.40 MB`.

### Comparison history, fixes and post-fix evidence

- [fixed from v133 P2 / the 270° wall was one floating notice panel] The west quarter now owns a `4.15m` built-in witness library with floor-connected walnut cabinetry, four resident-response cards, open archive bays, authorization drawers, brass seals, books, ceramic vase, foliage and architectural reveals. The whole assembly remains behind the collision shell and is merged into one opaque runtime batch.
- [improved from v133 P1 / eyelids and lips floated over a spherical face] The real head topology now contains an orbital rim that bridges brow, lid and upper cheek plus a tapered lip bed that disappears into cheek and chin. Existing illustrated contours remain expressive, but profile light no longer exposes the same feature-to-head gap.
- [improved from v133 P1 / the neck read as a straight toy peg] A four-ring elliptical neck/clavicle transition replaces the cylinder. Its lower ring overlaps the tailored shoulder plane and its upper ring disappears beneath the jaw, preserving a continuous silhouette under head turns.
- [fixed during v134 / the first neck rebuild exceeded the phone budget by 144 triangles] The 6–9cm neck surface uses a visually equivalent 16-side web LOD. Four actors recover `192` triangles and return the final phone frame to `249,952 / 250,000` without weakening the metre scale, physical capsule or desktop geometry contract.
- [checked / the new wall does not manufacture a front-view-only set] The witness library has a real world transform, participates in wall-hemisphere visibility and survives the complete four-heading capture. It is deliberately hidden by the existing phone scene LOD, where portrait framing does not expose that wall and the hard triangle budget takes priority.

### Required fidelity surfaces and findings

- [checked][fonts and typography] Chinese place state, story-memory label, action rail and interaction prompt remain readable in desktop and portrait frames. The source still has a tighter icon/type family, finer counters and more refined translucent depth.
- [improved][spacing and layout rhythm] The west wall now has a vertical cap, four-card rhythm, functional ledge and floor-connected cabinet instead of a small floating rectangle. The source still achieves denser controlled irregularity, more continuous foreground dressing and less quiet walkable floor.
- [improved][colors and visual tokens] Paper, felt, oak, walnut, teal, coral, butter and brass keep the west library inside the established advanced-dopamine palette. The implementation remains more saturated in costumes and foliage than the source's softly bounced photographic palette.
- [improved][image quality and asset fidelity] Real facial orbital/lip-bed shaping, contoured neck topology and a narrative-specific archive wall materially reduce the modular-toy and template-room cues. The source still has finer hands, hair grouping, garment construction, botanical species, joinery and secondary-object wear.
- [checked][copy and content] Resident-response cards, authorization drawers and sealed testimony reinforce the public listening-room story without exposing raw private memory or adding unsupported global statistics.
- [checked][icons and interaction states] Speaker beacon, action selection, keyboard controls, phone joystick/buttons and atomic scene warmup remain functional.
- [checked][physical truth, accessibility and responsiveness] One world unit remains one metre; the library stays behind the wall contact plane, so it creates no false walkable gap or new obstruction. Player/NPC capsules, anchors, 1.4m circulation and furniture colliders remain authoritative.
- [P1][production character topology remains visibly behind] v134 closes the most obvious eyelid/lip/neck attachment gaps, but the source still owns continuous hand anatomy, richer eye sockets, role-specific mouth topology, finer hair masses and garment deformation.
- [P1][complete-room asset craft remains behind] The west wall is now authored and useful, but the same-canvas pair still exposes simplified foreground joinery, repeated plants/books, lower secondary density and less convincing small-scale material wear.
- [P1][offline light transport remains ahead] The implementation preserves warm key/fill and contact AO, yet still lacks the source's multi-bounce colour, broad contact penumbrae, foliage/glass transmission and soft indirect facial light.
- [P2][complete-orbit framing remains uneven] Every heading is readable and playable, but the 270° camera still exposes more negative floor/plaster than the fixed editorial reference; further density must preserve the navigation loop rather than filling it with obstacles.
- [P2][HUD optical finish remains behind] Coverage, state and responsiveness pass, while icon family, compact type spacing, glass depth and button-edge treatment remain more utilitarian than the target.

### Implementation checklist

- Preserve west witness library v1 and facial/body contracts v6/v8; do not regress to floating wall cards or straight neck primitives.
- Continue the next character pass with continuous palms/digits, role-specific garment hems and restrained eye-socket topology rather than larger decals.
- Replace the most visible repeated foreground plant/book/paper families with three silhouette-distinct authored families.
- Add probe/lightmap-assisted colour bounce only if all four desktop headings and the `249,952`-triangle phone gate remain green.

### Gate result

v134 gives the fourth orbit a narrative-specific architectural destination, replaces the remaining straight neck peg, roots the eyelids and lips into real facial volume, and preserves real walking, camera rotation, physics, responsive controls and strict release budgets. The mandatory same-canvas comparison still contains actionable P1 gaps in continuous hand/garment topology, complete-room bespoke secondary craft and offline-quality indirect transport.

final result: blocked

Blocker: source-level hand/garment production topology, complete-room bespoke secondary asset craftsmanship and offline-quality indirect transport remain visibly ahead of the real-time implementation.

## 2026-07-26 reference-fidelity v133 elevated editorial camera, woven lounge and glass-material gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`, RGB, device scale factor `1`).
- Browser-rendered implementation: `dist/interior-3d-work/environment-review/00-public.png` (`1280 × 720`, deterministic 06:00 public-plaza testimony state).
- Mandatory normalized full-view comparison: `tmp/v133-reference-full-pair.png` (`2560 × 720`); the source is bilinear-resampled to the implementation's exact `1280 × 720` content viewport and both frames are judged on one canvas.
- Mandatory material/detail comparison: `tmp/v133-material-focus-pair.png` (`2080 × 420`); equal-density left and right crops compare the display/record desk and lounge/bookcase regions.
- Full 3D evidence: `tmp/v133-four-direction-board.png` contains yaw `0°`, `90°`, `180°` and `270°`; responsive evidence: `dist/interior-3d-work/environment-review-mobile/00-public.png` at `390 × 844`.
- Runtime evidence: opening `176 / 294,604`, side `179 / 305,712`, reverse `180 / 346,436`, fourth orbit `178 / 313,912`; mobile `106 / 249,796`. Every reviewed view reports zero shader errors and remains inside desktop `180 / 450k` and phone `110 / 250k` release budgets.
- Camera evidence: the opening now uses `49.4°`, a `5.84m` orbit and `3.332m` camera height. Side/reverse arcs widen to `52.95–55.2°`, `6.475–6.9m` and `3.682–3.812m` so the elevated composition still supports a complete orbit.
- Interaction evidence: the final browser regression moved the real Rapier-controlled player `3.65m`, rotated the camera `65.3°`, verified curved identity-surface blinking and preserved the four 3D citizens' foot, hand/prop and body-deformation contracts.
- Asset evidence: furniture contract v13 contains three authored GLBs and `67,690` triangles. The lounge suite now owns sculpted cushions, sewn edge treatment and a topology-based draped throw; the record desk owns a one-draw-call transmitted glass assembly.

### Comparison history, fixes and post-fix evidence

- [fixed from v132 P1 / the low close camera compressed the room into one horizontal strip] The opening changes from `48.5° / 5.5m / 2.972m` to `49.4° / 5.84m / 3.332m`. The final full-view comparison restores a visible foreground desk surface, complete story rug, lounge zone and back-wall landmark while keeping the player readable.
- [improved from v132 P1 / lounge textiles still read as rounded plastic blocks] Furniture v13 gives seat and back cushions off-centre compression, perimeter boxing and piping; ivory pillows use real sculpted volumes; the throw bends from seat to front face using a solidified grid rather than two cuboids.
- [improved from v132 P1 / foreground glassware and paper lacked material hierarchy] The record-desk tumbler is now an open wall, base and dense rim merged into one physical glass mesh. Layered paper, mapped agenda, scanned oak, vertex-masked walnut and glass remain separate material classes without breaking the draw-call gate.
- [improved from v132 P1 / civic plaster and floor remained grey and under-filled] Warmer plaster values, broader fill/hemisphere/bounce energy and a restrained environment lift move the implementation toward the source's cream daylight. Contact shadows increase without changing any physical floor or capsule positions.
- [fixed during v133 / the real glass pass pushed reverse orbit to 181 calls] Narrow walnut desk rails rejoin the shared vertex-surface batch, preserving their colour/roughness masks and returning the reverse view to the hard `180`-call limit.
- [fixed during v133 / the elevated mobile composition reached 251,136 triangles] Phone-only brass inlay, rug and tumbler radial segments now use authored LODs. The final portrait capture is `249,796` triangles with no visible route or interaction loss.

### Required fidelity surfaces and findings

- [checked][fonts and typography] Chinese place state, action rail and interaction prompt remain readable in desktop and portrait frames. The source still uses a tighter icon/type family, more compact counters and finer optical spacing.
- [improved][spacing and layout rhythm] Foreground desk, display case, cast, lounge and story wall now form a more source-like layered composition. The source retains denser irregular clustering, a stronger lower-right brass continuation and less unused shell in the fourth orbit.
- [improved][colors and visual tokens] Warm ivory, mineral terrazzo, honey oak, walnut, teal textile, coral and brass now separate more clearly. The implementation still has brighter costume/foliage saturation and less natural colour bleeding.
- [improved][image quality and asset fidelity] The material crop proves real glass thickness, layered paper, mapped oak, sewn cushions and a hanging textile silhouette. The source still has finer botanical species, glass refraction, fabric weave, carved joinery, book variation and small-scale wear.
- [checked][copy and content] “倾听线索”, “倾听墙”, current-place memory and contextual interaction remain coherent with the encounter and contain no private source text.
- [checked][icons and interaction states] Speaker beacon, action selection, interaction prompt, keyboard movement, camera drag, phone controls and atomic warmup continue to work.
- [checked][physical truth, accessibility and responsiveness] Visual transforms, colliders, Rapier actor capsules and interaction anchors remain unchanged. The higher camera does not move geometry or permit furniture traversal; all four headings and the phone LOD pass their performance gates.
- [P1][production character topology remains visibly behind] The source still has continuous shoulder/neck anatomy, dedicated eyelid/lip topology, softer hands, finer hair masses and more garment-specific deformation.
- [P1][complete-room asset craft remains behind] v133 materially improves the high-pixel lounge and desk, but the focused comparison still exposes simplified shelves, pottery, botanicals, joinery, paper edges and repeated secondary prop families.
- [P1][offline light transport remains ahead] The implementation has stronger material separation and grounding, but still lacks the source's multi-bounce colour, broad contact penumbrae, glass/foliage transmission and soft indirect facial light.
- [P2][fourth orbit is under-authored] The 270° view remains functional and collision-safe but shows a large quiet plaster/floor field compared with the source's deliberately dressed hero angle.
- [P2][HUD optical finish remains behind] Coverage and responsiveness pass, while icons, compact typography, translucent depth and button-edge treatment remain more utilitarian.

### Implementation checklist

- Preserve the v133 elevated camera, physical glass and woven lounge; do not trade them back for lower quality to regain performance.
- Author the west/270° wall as a complete low witness-library composition while keeping the 1.4m circulation loop and current fade/collision rules.
- Replace repeated shelf vessels, books and botanical clumps with three bespoke, silhouette-distinct secondary families.
- Move the next character pass into continuous eyelid/lip/hand/neck topology and role-specific garment edges.
- Pursue probe/lightmap-assisted colour bounce only if all five captured performance budgets remain green.

### Gate result

v133 delivers a more faithful elevated composition, real material hierarchy for glass/paper/wood, visibly softer lounge upholstery, stronger grounding and budgeted phone LOD while preserving true walking and 360° orbit. The same-canvas comparisons still contain actionable P1 gaps in source-level character topology, room-wide bespoke secondary craft and offline-quality light transport.

final result: blocked

Blocker: continuous production character topology, complete-room bespoke secondary assets and offline-quality indirect transport remain visibly ahead of the real-time implementation.

## 2026-07-26 reference-fidelity v132 role-authored silhouette, feature-island face and intimate-camera gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`, RGB, device scale factor `1`).
- Browser-rendered implementation: `dist/interior-3d-work/environment-review/00-public.png` (`1280 × 720`, deterministic 06:00 public-plaza testimony state).
- Mandatory normalized full-view comparison: `tmp/v132-reference-full-pair.png` (`2560 × 720`); source and implementation are aspect-fit to the same `1280 × 720` viewport and judged on one canvas.
- Mandatory character/story-centre comparison: `tmp/v132-character-focus-pair.png` (`1520 × 520`); equal-density crops expose head-to-body ratio, hair massing, garment silhouettes, prop contact, face integration and story-circle scale.
- Iteration evidence: `tmp/v132-character-before-after.png` compares the prior v129 implementation with the final v132 browser frame; `tmp/v132-before-after-full.png` records the room-wide material and light change.
- Full 3D evidence: `tmp/v132-four-direction-board.png` contains yaw `0°`, `90°`, `180°` and `270°`; responsive evidence: `dist/interior-3d-work/environment-review-mobile/00-public.png` at `390 × 844`.
- Runtime evidence: opening `176 / 289,298`, side `179 / 300,406`, reverse `180 / 341,130`, fourth orbit `178 / 308,606`; mobile `106 / 245,734`. All reviewed views report zero shader errors and remain inside desktop `180 / 450k` and phone `110 / 250k` release budgets.
- Camera evidence: the opening now uses `48.5°`, a `5.5m` orbit and `2.972m` camera height. Side/reverse arcs progressively restore `52.5–55°`, `6.304–6.87m` and `3.449–3.642m`, preventing the more intimate hero angle from clipping witnesses or furniture.
- Interaction evidence: the final browser regression moved the physical player `3.17m`, rotated the real camera `65.3°`, verified the curved identity-surface blink, preserved planted feet and retained facilitator notebook and mediator jaw contacts.
- Asset evidence: all four role GLBs were rebuilt under sculpt contract v75, hair-construction contract v6 and body-identity contract v7; the complete set is `7.36 MB`.

### Comparison history, fixes and post-fix evidence

- [fixed from v131 P1 / the generated portrait wash remained a second rectangular skin layer] Face matte v2 decomposes each atlas cell into feathered brow, eye, nose, cheek and mouth islands. Broad studio-face shading is removed, so the real morphable head owns forehead, cheek and jaw lighting while the supplied portrait features retain their source resolution.
- [improved from v131 P1 / every skull still shared one doll-like lower-face rhythm] Body identity v7 gives each role an authored jaw taper, chin length, cheek spread and temple compression without changing the physical capsule or head pivot. The differences remain visible at three-quarter angles and survive the same expression morphs.
- [improved / player and civic hair dominated rear and profile silhouettes] Hair construction v6 reduces helmet-cap overhang, narrows the player's rear clumps, turns the facilitator's bun/ponytail into a lighter layered mass and flattens the mediator's crown braid. The player backpack was reduced and re-fitted so it no longer merges into one head-to-pelvis block.
- [improved / the implementation remained darker, yellower and more outline-heavy than the source] Civic wall/floor values move toward neutral ivory and warm-grey terrazzo; fill, hemisphere and bounce energy increase while direct key and grade contrast decrease. Hair seams, trouser folds and timber edges retain form without collapsing to black.
- [improved / the social cast remained too small inside a wide management-game view] The opening orbit moves from `5.72m / 49° / 3.132m` to `5.5m / 48.5° / 2.972m`, increasing facial and garment readability and cropping the foreground desk more like the source. Dynamic side/rear lens expansion keeps the full 360° room usable.
- [checked / the closer composition remains a truthful playable 3D camera] Four-heading evidence preserves the player and social group, and the movement regression uses the real Rapier-controlled actor and camera. No actor, prop or wall is hidden to manufacture the opening frame.

### Required fidelity surfaces and findings

- [checked][fonts and typography] Chinese place state, action rail and contextual prompt remain readable at desktop and portrait sizes. The source still has finer icon/type optical alignment, more compact status spacing and more refined translucent-panel depth.
- [improved][spacing and layout rhythm] The opening now gives the cast more visual weight and a clearer foreground/mid-ground/background progression. The source still achieves richer controlled irregularity, tighter secondary prop clusters and a stronger continuation path along the lower-right brass floor line.
- [improved][colors and visual tokens] Ivory, neutral terrazzo, walnut, teal, coral, forest green and brass now occupy softer value bands. The implementation remains more saturated in foliage and costume accents than the source's multi-bounce photographic palette.
- [improved][image quality and asset fidelity] Feature-island faces, role-specific skull shaping, lighter hair silhouettes and the reduced backpack remove several visible toy/overlay defects. The focused comparison still exposes simpler eyelids, mouths, hands, garment edges, footwear and hair strand grouping.
- [checked][copy and content] “倾听线索”, “倾听墙”, place-memory state and current speaker remain coherent with the visible encounter; no private source text enters runtime state.
- [checked][icons and interaction states] Speaker beacon, contextual prompt, action selection, joystick and jump/interact controls remain functional; atomic warmup prevents incomplete actor, face or material state from becoming visible.
- [checked][physical truth, accessibility and responsiveness] One world unit remains one metre; character roots, Rapier capsules, floor contacts, colliders and interaction anchors are unchanged. Portrait retains three-character performance LOD, usable touch targets and the hard mobile render budget.
- [P1][production character topology remains visibly behind] v132 differentiates skulls and silhouettes, but the source still has continuous shoulder/neck anatomy, dedicated eyelid and lip topology, softer hands, role-specific garment construction and more natural hair strand masses.
- [P1][room-wide secondary craft remains behind] The source contains finer glassware, botanicals, upholstery seams, baskets, layered paper, wall trim and small-scale wear. The implementation's secondary families still repeat broad procedural forms and expose simpler shelves in side/reverse views.
- [P1][offline light transport remains ahead] The softer grade closes the value gap, but the source retains richer multi-bounce colour, larger contact penumbrae, better foliage/glass transmission and more differentiated skin, textile and wood response.
- [P2][complete orbit remains less art-directed than the fixed source] Every heading is playable and readable, but rear quadrants necessarily expose more shell and navigation clearance than the single editorial target.
- [P2][HUD optical finish remains behind] Coverage and interaction pass, while icon family, compact typography, panel translucency and button-edge treatment remain more utilitarian.

### Implementation checklist

- Preserve face matte v2 and the role-authored skull/hair silhouettes; move the next character pass into continuous shoulder/neck, eyelid/lip and garment-edge topology rather than larger feature textures.
- Replace the most visible repeated secondary families—foreground paperwork/glassware, lounge textiles and bookcase dressing—before adding low-salience clutter.
- Introduce probe/lightmap-assisted colour bounce and softer contact response without increasing direct-key intensity or exceeding the current mobile budget.
- Keep the `48.5° / 5.5m / 2.972m` hero angle only while four-heading movement, camera collision and actor visibility continue to pass.

### Gate result

v132 makes the hero view more intimate and materially softer, removes the residual face-patch wash, differentiates role skulls and hair silhouettes, and reduces the player's backpack block while preserving real walking, orbit, physics, mobile controls and performance. The mandatory same-canvas comparisons still contain actionable P1 gaps in production character topology, complete-room secondary asset craftsmanship and offline-quality light/material transport.

final result: blocked

Blocker: source-level continuous character topology, complete-room bespoke secondary assets and offline-quality indirect transport remain visibly ahead of the real-time implementation.

## 2026-07-26 reference-fidelity v131 embodied cast proportion and acting gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`, RGB, device scale factor `1`).
- Browser-rendered implementation: `dist/interior-3d-work/environment-review/00-public.png` (`1280 × 720`, deterministic 06:00 public-plaza testimony state).
- Mandatory normalized full-view comparison: `tmp/v131-reference-full-pair.png` (`2560 × 720`); source and implementation are aspect-fit to the same `1280 × 720` viewport and judged on one canvas.
- Mandatory character/story-centre comparison: `tmp/v131-character-focus-pair-after.png` (`1520 × 520`); equal crops expose arm length, face scale, planted stance, notebook contact and four-character silhouette separation.
- Full 3D evidence: `dist/interior-3d-work/environment-review/00-public.png` plus yaw `90°`, `180°` and `270°` captures under the corresponding `environment-review-yaw-*` folders; responsive evidence: `dist/interior-3d-work/environment-review-mobile/00-public.png` at `390 × 844`.
- Runtime evidence: opening `176 / 289,298`, side `179 / 300,406`, reverse `180 / 341,130`, fourth orbit `178 / 308,606`; mobile `106 / 245,734`. All reviewed views report zero shader errors and remain inside desktop `180 / 450k` and phone `110 / 250k` release budgets.
- Interaction evidence: the browser regression moved the physical player `3.45m`, rotated the real camera `65.3°`, verified the curved identity-surface blink, preserved planted feet and kept the facilitator's notebook and mediator's thoughtful-hand contacts after the shortened-arm rebuild.
- Asset evidence: all four role GLBs were rebuilt from the Blender source under sculpt contract v74, hair-construction contract v5 and animation contract v18; the resulting shared character set is `7.38 MB`.

### Comparison history, fixes and post-fix evidence

- [fixed from v129 P1 / arms read too long and narrow at gameplay distance] All four role rigs now use shorter shoulder-to-elbow and elbow-to-wrist spans, broader sleeve cross-sections and matching controller/cuff/hand offsets. Side and reverse views retain a readable elbow break without letting hands hang below the intended silhouette.
- [improved / the player's generic listening pose looked folded and passive] The player owns a role-specific listen offset that opens the elbows and lowers excessive wrist compression. The stance now reads as present and grounded while the three NPC gestures keep distinct social roles.
- [improved / faces and dark hair collapsed at the story-camera distance] The curved face carrier is larger, the dark actor rim is restrained and low-energy cloth/hair/skin fragments receive a small physically bounded lift. Eyes, hair masses, trouser folds and joint seams survive the opening lens without becoming emissive or screen-space effects.
- [fixed / shortening the facilitator's arm initially broke the notebook hold] Contact solving now uses four closure iterations and a larger authored angle response. Runtime verification requires the hand-to-notebook distance to settle below the same hard contact threshold; the test failed before this correction and passes after it.
- [checked / the improvement remains a truthful moving 3D cast] All visible changes are authored geometry, rig offsets or lit material response. No sprite, billboard, screenshot projection, CSS/SVG drawing or front-view-only prop substitutes for character volume, and the real controller still walks and orbits the room.

### Required fidelity surfaces and findings

- [checked][fonts and typography] Chinese state, place identity, active story memory, action rail and keyboard prompt remain legible at desktop and portrait sizes. The source still has finer icon/type optical alignment and more refined translucent-panel depth.
- [improved][spacing and layout rhythm] The shorter arms and open player stance reduce silhouette tangles in the listening circle. Foreground record desk, mid-ground cast and background threshold remain distinct, although the source still uses denser irregular prop spacing and a stronger lower-right continuation path.
- [improved][colors and visual tokens] Warm mineral ivory, walnut, teal, coral, forest green and brass remain coherent; dark hair and garments now retain form instead of falling into black graphic patches.
- [improved][image quality and asset fidelity] Larger facial surfaces, role-specific acting and corrected arm proportions make the cast more readable in the actual gameplay lens. The focused comparison still exposes simpler eyelids, mouths, hair clumps, hand anatomy, garment edges and cloth response than the source.
- [checked][copy and content] “倾听线索”, “倾听墙”, the public-place memory and current speaker remain coherent with the visible encounter; no private source text enters runtime state.
- [checked][icons and interaction states] Speaker beacon, contextual prompt, action selection, joystick and jump/interact controls remain functional; the atomic warmup still prevents incomplete actor or material state from becoming visible.
- [checked][physical truth, accessibility and responsiveness] One world unit remains one metre; actor roots, Rapier capsules, floor contacts, furniture colliders and interaction anchors are unchanged. The phone frame stays within its hard draw/triangle budget and retains usable touch targets.
- [P1][character production topology remains visibly behind] The source has dedicated facial topology, softer eyelid and lip volume, anatomically continuous shoulders and hands, finer hair massing and garment-specific deformation. v131 improves proportion and acting but remains a parameterized low-poly cast rather than source-level production character art.
- [P1][room-wide secondary craft remains behind] The source contains more specific glassware, botanical species, upholstery seams, baskets, paper stacks, trim profiles and material wear. The implementation's hero suites are coherent but its secondary families still repeat broad procedural forms.
- [P1][light transport remains behind offline reference quality] The source retains richer multi-bounce colour, softer contact penumbrae, better foliage/glass transmission and more differentiated skin, cloth and wood response.
- [P2][complete orbit exposes gameplay/cinematic trade-offs] All headings remain usable, but side and reverse views reveal quieter shell planes and more navigation clearance than the fixed editorial source shot.
- [P2][HUD optical finish remains behind] Coverage and responsiveness pass, while icon family, compact typography, panel depth and edge treatment remain more utilitarian than the target.

### Implementation checklist

- Preserve the shortened role rigs, role-specific player listen pose and hard prop-contact checks; move the next character increment into role-authored face/hair/garment topology rather than stronger shader contrast.
- Replace the most visible procedural secondary prop families and add room-specific textile, glass, paper and botanical variants before increasing decorative density.
- Pursue probe/lightmap-assisted colour bounce and softer contact response while preserving the current mobile and four-orbit performance budgets.
- Keep the current truthful locomotion, Rapier capsules and interaction anchors as hard constraints for every art-quality upgrade.

### Gate result

v131 materially improves the four-character encounter's arm proportions, role differentiation, face readability and gesture contact while preserving real walking, camera orbit, physics, responsive controls and release budgets. The mandatory same-canvas comparisons still contain actionable P1 gaps in source-level character topology, complete-room secondary asset craftsmanship and offline-quality light/material transport.

final result: blocked

Blocker: authored face/hair/garment topology, complete-room secondary asset craftsmanship and offline-quality indirect transport remain visibly ahead of the real-time implementation.

## 2026-07-25 reference-fidelity v129 face matte, neck chain and editorial-space gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`, RGB, device scale factor `1`).
- Browser-rendered implementation: `tmp/v129-public-yaw-0.png` (`1280 × 720`, deterministic 06:00 public-plaza testimony state).
- Mandatory normalized full-view comparison: `tmp/v129-reference-comparison-final.png` (`2560 × 720`); source and implementation are aspect-fit to the same `1280 × 720` viewport and judged on one canvas.
- Mandatory character/story-centre comparison: `tmp/v129-character-focus-comparison.png` (`1520 × 520`); equal crops expose facial integration, head/neck continuity, cast scale, staging, floor cadence and foreground/mid-ground hierarchy.
- Full 3D evidence: `tmp/v129-public-orbit-board.png` with yaw `0°`, `90°`, `180°` and `270°`; responsive evidence: `tmp/v129-public-mobile.png` at `390 × 844`.
- Runtime evidence: opening `176 / 289,516`, side `179 / 300,624`, reverse `180 / 341,348`, fourth orbit `178 / 308,824`; mobile `106 / 245,814`. All reviewed views report zero shader errors and remain inside desktop `180 / 450k` and phone `110 / 250k` release budgets.
- Interaction evidence: the browser regression moved the physical player `5.09m`, rotated the actual camera `65.3°`, verified the curved identity-surface blink, preserved planted feet and restored every body/neck/digit deformation contract after locomotion.
- Asset evidence: `public/assets/interiors/textures/civic-terrazzo-tiles-basecolor-v3.png` is a real `1024 × 1024` diffuse terrazzo tile asset generated from the prior mineral source, inspected before use and integrated as the physically lit floor map rather than a screen-space overlay.

### Comparison history, fixes and post-fix evidence

- [fixed from v128 P1 / face atlas bled a pale rectangular mask into the head] The role-authored face atlas now mattes low-contrast pale pixels toward each exact role skin tone while preserving the high-contrast eyes and line work. Fully transparent texels also carry skin colour, so mipmaps no longer bleed white around the curved facial surface.
- [improved / the head still rotated above a largely static collar seam] The merged body now carries a dedicated neck-chain vertex field. Pitch, yaw and roll rotate the neck region about an authored anatomical pivot at restrained fractions of head motion, including matching normal rotation; all four actors expose `114` live neck vertices and a non-zero pose.
- [fixed from v128 P1 / undifferentiated beige floor weakened metre scale] The new floor asset adds low-contrast architectural tile joints while preserving the quiet warm-grey aggregate. At the authored repeat the room now reads in roughly `1.2–1.4m` slabs, improving path distance, furniture scale and foreground depth without introducing a busy checkerboard.
- [improved / broad fill flattened plaster, floor, cloth and faces into one value] Civic fill, hemisphere, ceiling and rear-wall energy were reduced; the directional key and cool lounge return were retained. A restrained contrast curve and edge vignette now keep the bright threshold, story circle and darker foreground in separate value bands.
- [fixed / opening cast and furniture read too large and crowded] The desktop story lens now uses `50°`, a `6.15m` follow distance and a lower focus height. Listener, facilitator and mediator form a wider asymmetric triangle, preventing the rear speaker and facilitator from sharing one silhouette while retaining the player's walkable approach lane.
- [fixed / cold-browser contact-pressure QA sampled the solver one frame too early] The browser check now waits for the authored pressure output after contact closure, then keeps the same hard sleeve-compression and digit-curl assertions. This removes a sampling race without relaxing the animation or physics contract.
- [checked / all changes remain truthful in a moving, orbitable room] Tile joints, light gradients, face surfaces and head/neck deformation are world-space and physically lit. No screenshot, billboard, CSS/SVG drawing or front-view-only prop substitutes for volume; all four headings retain the player and active story group.

### Required fidelity surfaces and findings

- [checked][fonts and typography] Chinese state, building identity, current speaker, action rail and interaction prompt remain readable at desktop and portrait sizes. The reference still has finer compact typography and more refined translucent-panel optical alignment.
- [improved][spacing and layout rhythm] The opening now has a clear foreground record desk, a single mid-ground listening circle and a background evidence wall/threshold axis. The source still achieves more purposeful irregularity, softer prop spacing and a stronger lower-right continuation path.
- [improved][colors and visual tokens] Warm mineral grey, ivory plaster, walnut, teal, coral, forest green and brass now occupy clearer value layers. The implementation remains somewhat more saturated and graphic than the reference's softer bounced-light palette.
- [improved][image quality and asset fidelity] The mineral tile scale, role-skin face matte and head/neck continuity close three visible gaps with real assets and geometry-aware shading. The focused comparison still exposes simpler hair clumps, facial anatomy, garment edges and hand forms.
- [checked][copy and content] “倾听线索”, “倾听墙”, the public-place memory and the active speaker remain coherent with the visible testimony; no private source text enters runtime state.
- [checked][icons and interaction states] Speaker beacon, keyboard prompt, action selection, joystick and jump/interact controls remain functional; atomic warmup prevents incomplete material or actor states from becoming visible.
- [checked][physical truth, accessibility and responsiveness] One world unit remains one metre; actor roots, capsules, floor contacts, furniture colliders and interaction anchors are unchanged. The phone frame stays under its hard draw/triangle budget with usable touch targets.
- [P1][character production quality remains visibly behind] The source has authored facial topology, softer eyelids/lips, finer hair massing, subtler skin response and cloth-specific deformation. The implementation's curved face atlas and neck field remove the mask/hinge defects but do not equal source-level character art.
- [P1][room-wide secondary craft remains behind] The source contains more specific glassware, botanicals, upholstery seams, baskets, paper stacks, trim profiles and small-scale wear. The implementation has strong hero suites but still repeats broad procedural secondary forms.
- [P1][light transport remains behind offline reference quality] Direction and value hierarchy improved, yet the source retains richer multi-bounce colour, larger and softer contact penumbrae, better glass/foliage transmission and less uniform skin/fabric response.
- [P2][complete orbit exposes gameplay/cinematic trade-offs] All headings remain usable, but side/reverse views necessarily reveal quieter shell planes and wider negative space than the fixed source shot. Near-wall framing is readable and does not hide the cast, but it is not equally art-directed in every quadrant.
- [P2][HUD optical finish remains behind] Coverage and responsiveness pass, while icon family, compact type spacing, panel depth and button edge treatment remain more utilitarian than the target.

### Implementation checklist

- Preserve the role-skin matte and neck-chain contracts; move the next character increment into authored facial topology, eyelid/lip volume and hair/skin material response rather than stronger atlas emission.
- Keep the `50° / 6.15m` opening lens and wider triangle unless player testing shows reduced speaker readability; story-camera changes must continue to pass real walking and four-heading review.
- Extend the new architectural tile scale and restrained light hierarchy to the remaining five vertical-slice rooms before adding low-salience decorative clutter.
- Replace the most visible repeated secondary prop families and pursue probe/lightmap-assisted bounce while preserving the current mobile budget.

### Gate result

v129 materially improves first-read spatial credibility, reference-like story framing, face/head integration and indirect-light hierarchy while preserving actual player movement, camera rotation, physics and mobile controls. The mandatory same-canvas comparisons still contain actionable P1 gaps in source-level character art, room-wide bespoke secondary craft and offline-quality light/material transport.

final result: blocked

Blocker: authored facial/hair/garment production quality, complete-room secondary asset craftsmanship and offline-quality indirect transport remain visibly ahead of the real-time implementation.

## 2026-07-25 reference-fidelity v128 weighted body chain and civic archive craft gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`, RGB, device scale factor `1`).
- Browser-rendered implementation: `dist/interior-3d-work/environment-review/00-public.png` (`1280 × 720` CSS/pixels, device scale factor `1`, deterministic 06:00 public-plaza testimony state).
- Mandatory normalized full-view comparison: `tmp/reference-vs-v128-final-full.png` (`2560 × 720`); the source is aspect-fit to `1280 × 720` and paired with the native `1280 × 720` implementation on the same canvas.
- Mandatory focused comparison: `tmp/reference-vs-v128-final-character-focus.png` (`1120 × 520`); equal `560 × 520` crops compare the four-person ring, shoulder/pelvis continuity, floor contact, gesture props and facial integration.
- Full 3D evidence: `tmp/v128-four-direction-board.png` plus the source captures in `dist/interior-3d-work/environment-review-yaw-90/00-public.png`, `environment-review-yaw-180/00-public.png` and `environment-review-yaw-270/00-public.png`.
- Responsive evidence: `dist/interior-3d-work/environment-review-mobile/00-public.png` at `390 × 844`.
- Runtime evidence: opening desktop `176 / 289,522`, side `179 / 300,630`, reverse `180 / 341,354`, fourth orbit `178 / 308,830`; mobile `106 / 245,814`. All five views report zero shader errors and remain inside the desktop `180 / 450k` and phone `110 / 250k` release budgets.
- Deformation evidence: the player exposes `7,758` weighted body vertices, including `4,338` clavicle and `2,208` pelvis vertices. Live animation drives independent left/right clavicle pitch-bank, pelvis yaw-bank and spine counter-rotation under `mirrorlife-civic-body-chain-v1`.
- Asset evidence: hero furniture contract v12 contains three authored Blender assets and `62,272` source triangles. Layered files, folded corners, consent seals, clips and paper edges are real geometry, then merged into semantic runtime batches.
- Interaction evidence: the final browser regression moved the player `5.09m`, rotated the physical camera `65.3°`, verified the curved identity-surface blink and retained the body-chain contract after locomotion. Desktop/mobile scene flow and the `26`-zone, `78`-transition stress pass report no runtime failures.

### Comparison history, fixes and post-fix evidence

- [fixed from v127 P1 / shoulder and pelvis deformation used broad positional fields] The merged body now carries one per-vertex four-channel chain attribute for left clavicle, right clavicle, spine and pelvis. The vertex and normal shaders rotate each region about authored anatomical pivots, while the existing planted-weight offsets remain a lower-amplitude corrective.
- [improved / gestures animated arms but not their proximal body chain] Listen, gesture and locomotion tracks now derive clavicle pitch/bank and pelvis yaw/bank every frame. Runtime verification requires non-zero chain motion both before and after a physical walk instead of accepting static exported weights.
- [improved from v127 P1 / hero suites still read as broad furniture blocks] Display, notice and lounge assets now include layered witness packets, archive folders, clips, paper edges, real folded wedges and consent seals. Wood, paper and glass remain separately authored material families before semantic batching.
- [fixed / the fourth orbit exposed an uncomposed plaster sector] The civic shell is now four independently fadeable wall planes rather than one shared box. A shallow resident-response ledger is revealed only in the `270°` camera arc; it fills the dead wall without taking walkable space or appearing in the opening composition.
- [checked / additions remain truthful to the spatial contract] The archive panel is inaccessible wall furniture, all floor props keep their existing colliders and interaction anchors, and four-direction screenshots show no intersecting furniture, detached paper or camera-wall takeover.

### Required fidelity surfaces and findings

- [checked][fonts and typography] Chinese status labels, place-memory title, interaction prompt and the four actions remain legible at desktop and portrait sizes. The reference still has finer icon/type optical alignment, less utilitarian numeric spacing and more deliberate translucent-panel text contrast.
- [improved][spacing and layout rhythm] The opening keeps one readable four-person story centre; the fourth orbit now has a civic landmark instead of a broad undecided wall. The source remains denser in foreground framing and distributes secondary props with more irregular but controlled rhythm.
- [checked][colors and visual tokens] Warm mineral ivory, walnut, teal, coral, green and brass remain coherent. New paper layers use warm/cool whites and muted edge values rather than introducing competing saturated accents.
- [improved][image quality and asset fidelity] Chain weights, document layers, folded corners and seals are lit orbit-safe 3D geometry. No sprite, billboard, CSS/SVG drawing, emoji or screenshot projection substitutes for visible character or room volume.
- [checked][copy and content] “倾听线索”, “倾听墙”, the place-memory state and response ledger fit the visible civic testimony. No private source text or unapproved memory is rendered.
- [checked][icons and interaction states] The nearest contextual marker, keyboard prompt, action selection and portrait touch controls remain functional; loading uses the atomic two-frame warmup and all reviewed captures report a ready scene.
- [checked][physical truth, accessibility and responsiveness] Actor roots, Rapier capsules, floor contact, interaction anchors and furniture colliders remain authoritative. Portrait keeps joystick and action targets usable while staying within its hard performance budget.
- [P1][character silhouette and facial production quality remain visibly behind] The focused comparison proves real clavicle/pelvis motion, but the source still has more continuous scapular volume, per-joint hand articulation, softer fabric compression, more expressive faces and finer hair/skin integration. The implementation remains recognizably lower-poly and more rigid at the head-neck and hand-prop contacts.
- [P1][room-wide secondary craft remains behind despite the v12 hero upgrade] The new documents improve the three hero suites, while the source still has richer glassware, varied botanical species, textiles, basketry, trim profiles and irregular shelf dressing across the entire frame.
- [P1][offline indirect lighting and material transport remain visibly ahead] The same-canvas full view shows flatter wall/floor value separation, harder contact shadows and less colour bounce in the implementation. The source retains softer penumbrae, natural skin/cloth response and more convincing glass and foliage transmission.
- [P2][gameplay camera cannot yet match the source's fixed cinematic density] Movement and a complete orbit require more open floor and safer silhouettes. The opening is readable, but it does not yet achieve the source's lower horizon, stronger foreground crop and compressed story tableau without compromising rear-view navigation.
- [P2][HUD optical finish remains behind] Coverage and responsive behavior pass, but panel translucency, icon family, control grouping, compact typography and edge treatment remain visibly more generic than the reference.

### Implementation checklist

- Preserve the four-channel body-chain attribute and move the next character increment into authored scapula/neck weights, facial topology and garment-specific compression rather than larger procedural offsets.
- Extend the v12 archive-paper craft into the foreground desk, lounge textiles, glassware and botanical families while keeping the current semantic batching budgets.
- Introduce probe/lightmap-assisted indirect colour and softer contact response before adding more direct-light intensity.
- Refine the HUD icon family and translucent surfaces only after the character and indirect-light P1 gaps are reduced.

### Gate result

v128 adds real per-vertex clavicle/spine/pelvis deformation, animation-driven proximal motion, more specific civic archive craft and a composed fourth-orbit wall while preserving physical movement, atomic loading, mobile controls and performance budgets. The mandatory same-canvas comparison still contains actionable P1 gaps in character/facial production quality, room-wide secondary asset craft and offline-quality indirect light/material transport.

final result: blocked

Blocker: source-level character and facial deformation, complete-room secondary asset craftsmanship and offline-quality indirect light/material transport remain visibly ahead of the real-time implementation.

## 2026-07-25 reference-fidelity v127 continuous body and digit deformation gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`, RGB, device scale factor `1`).
- Final desktop implementation: `tmp/v127-final-desktop-yaw0.png` (`1672 × 941` CSS/pixels, device scale factor `1`, deterministic 06:00 public-plaza testimony state).
- Mandatory normalized full-view comparison: `tmp/reference-vs-v127-final-full.png` (`2880 × 900`); source and implementation are each aspect-fit to `1440 × 900` on the same canvas.
- Mandatory focused comparison: `tmp/reference-vs-v127-final-character-focus.png` (`1640 × 600`); equal native-pixel `820 × 600` crops expose shoulder slope, pelvis loading, finger silhouettes, notebook/jaw contacts and floor planting.
- Iteration evidence: `tmp/v126-vs-v127-final-character-focus.png` isolates the character change; `tmp/v127-before-after-finger-creases.png` checks the authored crease pass at close range.
- Full 3D and responsive evidence: `tmp/v127-final-desktop-yaw90.png`, `tmp/v127-final-desktop-yaw180.png`, `tmp/v127-final-desktop-yaw270.png`, `tmp/v127-final-mobile-yaw0.png` and `tmp/v127-four-direction-board.png`.
- Runtime evidence: opening desktop `176 / 286,846`, side `179 / 297,954`, reverse `180 / 338,678`, fourth orbit `177 / 290,770`; mobile `106 / 245,342`. Every reviewed view reports zero shader errors and remains inside the desktop `180 / 450k` and phone `110 / 250k` release budgets.
- Deformation evidence: every desktop hand exposes `2,232` participating digit vertices while remaining one draw call. Role curls settle between `0.0275–0.2016rad`; all four bodies report the same planted-weight, shoulder-countershift, pelvis-drop and cloth-tension contract. The rebuilt four-role asset set is `7.40 MB`.
- Interaction evidence: two fresh browser regressions moved the player `5.01m` and `3.33m`, rotated the physical camera `65.3°`, released the fingers into gait curl and restored the planted body/digit contract after stopping. Desktop/mobile scene flow passes; the transition stress run covers `26` zones and `78` transitions with zero failures or runtime errors.

### Comparison history, fixes and post-fix evidence

- [fixed from v126 P1 / real finger source meshes were baked into a static runtime hand] The hand batcher now preserves a per-vertex pivot and orientation frame for every finger and thumb. One shader bends each digit progressively from root to tip and rotates its normals, so hands remain one draw call rather than expanding into forty live finger batches.
- [improved / role poses changed wrists but not finger tension] Player, listener, facilitator and mediator now have different curl targets. Notebook and thoughtful-hand contacts add pressure-dependent curl after contact solving; walking temporarily releases into a gait curl and settles back after locomotion.
- [improved / whole-body weight transfer stopped at a rigid root roll] The torso batch now adds a support-side pelvis shift/drop, counter-moving shoulder shelf, shoulder-height difference and restrained breathing volume. All values read the same support foot as the level-sole contract without moving the actor root or Rapier capsule.
- [improved / cloth folds were static decorations outside elbow/knee correctives] Garment vertices at shoulder and pelvis receive a low-amplitude diagonal tension field coupled to the planted side. Existing elbow/knee volumes and sleeve pressure remain intact.
- [improved / small digits still merged into one skin-colour blob at gameplay distance] Hand contract v10 adds real finger and thumb crease geometry. The marks share the finger pivot and deformation frame, so they bend with the skin rather than floating as a screen-space line.
- [checked / deformation remains spatially honest] Four-direction review shows no inverted fingers, detached creases, collapsed shoulders or cloth spikes. The implementation adds no draw calls, changes no collider, and keeps the existing movement, interaction-anchor and camera contracts.

### Required fidelity surfaces and findings

- [checked][fonts and typography] Chinese HUD hierarchy, place-memory title, four civic actions and portrait truncation remain stable. The source still has more optically refined icon/type balance.
- [improved][spacing and layout rhythm] Shoulder and pelvis asymmetry reinforces the four-person ring without reducing the story-centre clearance or `1.4m` circulation path. The source retains stronger foreground framing and a denser fixed-shot composition.
- [checked][colors and visual tokens] Warm mineral ivory, walnut, teal, green, coral and brass remain coherent. Finger creases reuse the existing warm skin-shadow value instead of adding black graphic noise.
- [improved][image quality and asset fidelity] Body loading, cloth tension, progressive finger curl and crease marks are live, lit and orbit-safe 3D surfaces. No sprite, billboard, CSS/SVG art or screenshot projection substitutes for the deformation.
- [checked][copy and content] “倾听线索”, “倾听墙”, place-memory state and civic actions remain coherent with the visible testimony; no private source copy enters runtime state.
- [checked][physical truth and responsiveness] Desktop deformation uses the same authoritative roots, capsules, floor, contacts and movement. Portrait intentionally keeps the static compact hand LOD because the extra crease/digit vertices are sub-pixel; its touch layout and performance remain unchanged.
- [P1][source-level skeletal and cloth deformation remains ahead] v127 replaces static fingers and rigid torso loading, but the source still has per-phalanx knuckles, continuous clavicle/scapula skinning, garment-specific folds and softer contact compression. The current shader uses one progressive curl field per hand and centimetre-scale torso correctives.
- [P1][room-wide secondary asset craft remains visibly behind] Documents, joinery, glassware, botanical species and shelf irregularity remain broader and more procedural than the source.
- [P1][offline indirect light and material transport remain visibly ahead] The source retains richer multi-bounce colour, subtler skin/cloth response, softer penumbrae and more convincing glass transport.
- [P2][camera is gameplay-correct but not cinematically identical] Full movement and orbit need more open negative space than the source's fixed editorial composition; reverse quadrants expose simpler wall staging.
- [P2][HUD optical finish remains behind] Coverage and responsive behavior pass, but icon craft, translucent-panel depth, micro-spacing and compact typography remain less refined.

### Implementation checklist

- Preserve the packed one-draw-call digit deformation path; extend it with per-phalanx bend only when it can stay within the current attribute and draw-call budgets.
- Move the next body increment into authored clavicle/scapula and pelvis skin weights rather than amplifying the current shader offsets.
- Replace the most visible secondary documents and joinery before adding low-salience decor.
- Add probe/lightmap-assisted indirect colour without increasing direct-light intensity.

### Gate result

v127 makes the standing cast more physically continuous: shoulders and pelvis respond to the same planted side, garment surfaces carry restrained tension, and `2,232` real digit vertices per hand now bend with authored contact pressure while retaining one draw call. The mandatory same-canvas comparison still contains actionable P1 gaps in per-joint character deformation, complete-room secondary asset craft and offline-quality light/material transport.

final result: blocked

Blocker: source-level per-phalanx/clavicle/cloth deformation, complete-room secondary asset craftsmanship and offline-quality indirect light/material transport remain visibly ahead of the real-time implementation.

## 2026-07-25 reference-fidelity v126 planted weight and contact-pressure gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`, RGB, device scale factor `1`).
- Final desktop implementation: `tmp/v126-final-desktop-yaw0.png` (`1672 × 941` CSS/pixels, device scale factor `1`, deterministic 06:00 public-plaza testimony state).
- Mandatory normalized full-view comparison: `tmp/reference-vs-v126-final-full.png` (`2880 × 900`); the source and implementation are each aspect-fit to `1440 × 900` and placed at equal density on one canvas.
- Mandatory focused comparison: `tmp/reference-vs-v126-final-character-focus.png` (`1640 × 600`); equal native-pixel `820 × 600` crops expose the four-person ring, support legs, shoe soles, notebook/jaw contacts and cast-to-floor relationship.
- Full 3D and responsive evidence: `tmp/v126-final-desktop-yaw90.png`, `tmp/v126-final-desktop-yaw180.png`, `tmp/v126-final-desktop-yaw270.png`, `tmp/v126-final-mobile-yaw0.png`, `tmp/v126-four-direction-board.png` and the post-movement state `tmp/v126-final-walk.png`.
- Runtime evidence: opening desktop `176 / 284,606`, side `179 / 295,714`, reverse `180 / 336,438`, fourth orbit `177 / 288,530`; mobile `106 / 245,342`. All reviewed views report zero shader errors and remain within the desktop `180 / 450k` and phone `110 / 250k` release budgets.
- Interaction evidence: two fresh browser regressions moved the player `4.93m` and `3.33m`, rotated the physical camera `65.3°`, then re-established the level-foot contract after locomotion. Civic assets, 26-zone physics, desktop/mobile scene flow and `78` atomic transitions all pass with zero failures or runtime errors.

### Comparison history, fixes and post-fix evidence

- [improved from v125 P1 / characters stood symmetrically with no authored load-bearing side] Each public-room role now owns an explicit support foot. The ribcage shifts over that leg while the head counterbalances part of the roll, creating a restrained S-curve without moving the Rapier capsule or authored actor root.
- [fixed / shoe lasts inherited body, hip and knee roll and could visually tilt away from the floor] Desktop character assembly preserves both shoe pivots as independent lit geometry. A world-up correction levels each sole after animation, and runtime QA requires both foot-up errors to remain below `0.04rad`.
- [improved / one broad oval shadow implied hovering rather than two grounded feet] The civic contact receiver is now a single-call, two-lobe foot-sized geometry. It remains a world-space floor contact, not a screen-space decal, and matches the unchanged physical floor height at `0.025m`.
- [improved / correct notebook and jaw contacts lacked visible pressure] The final contact solve now drives a subtle hand-surface squash and sleeve corrective. Pressure is applied to the visible merged surface after the contact anchor has been solved, so it cannot pull the hand away from the notebook or jaw.
- [checked / the static improvement survives movement] The post-movement frame shows the player in a real translated position; after the walk blend settles, both shoe pivots return to the planted contract. The role-specific notebook and jaw constraints remain valid.
- [checked / no front-view-only fix] Four-direction evidence shows level soles and readable weight transfer at `0°`, `90°`, `180°` and `270°`; portrait retains its three-character performance LOD and unchanged touch controls.

### Required fidelity surfaces and findings

- [checked][fonts and typography] Chinese status, place-memory title, four civic actions and portrait truncation remain stable. The source continues to have more refined icon/type optical balance and denser small-text spacing.
- [improved][spacing and layout rhythm] Asymmetrical stances strengthen the social circle without changing the `1.4m` circulation path, story-center clearance or interaction anchors. The source still has richer foreground framing and a more deliberately compressed fixed-shot composition.
- [checked][colors and visual tokens] Warm mineral ivory, walnut, teal, forest green, coral and brass remain coherent; the new deformation adds no decorative colour or competing highlight.
- [improved][image quality and asset fidelity] Support-foot correction, shoe compression, two-lobe grounding and hand/sleeve pressure are live, lit, orbit-safe 3D structures. No sprite, billboard, CSS/SVG drawing or screenshot projection substitutes for actor volume.
- [checked][copy and content] “倾听线索”, “倾听墙”, place-memory status and the four civic actions remain coherent with the visible testimony. No private source text enters the runtime.
- [checked][physical truth and responsiveness] Actor roots, metre scale, Rapier capsules, furniture colliders, navigation and authoritative movement are unchanged. The rendered shoes, contact receivers and runtime floor contract now make that physical truth more legible.
- [P1][source-level deformation remains visibly ahead] The focused same-canvas comparison shows a more believable planted stance than v125, but the source still has continuous clavicle/hip skinning, finger curl, fabric folds and local compression rather than the implementation's deliberately limited corrective pivots.
- [P1][room-wide secondary asset craft remains visibly behind] Documents, timber joinery, glassware, botanical species and shelf irregularity remain broader and more procedural than the source despite the complete orbit-safe hero suites.
- [P1][offline indirect light and material transport remain visibly ahead] The implementation now has real mineral response and world-space canopy breakup, while the source retains softer multi-bounce colour, subtler skin/cloth response and more convincing glass transport.
- [P2][camera is gameplay-correct but not cinematically identical] Movement and full orbit require more open negative space than the target's fixed editorial shot. Rear quadrants remain readable but expose simpler wall composition.
- [P2][HUD optical finish remains behind] Coverage and responsive behavior pass; icon craft, panel translucency, micro-spacing and compact typography remain less refined than the target.

### Implementation checklist

- Preserve the post-animation support-foot solve and keep it independent from the physical actor root.
- Extend deformation through authored shoulder, pelvis, finger and cloth-corrective channels instead of increasing the current body roll.
- Replace only the highest-salience secondary props, keeping the reverse camera at or below its current `180` draw-call ceiling.
- Pursue probe/lightmap-assisted indirect colour before adding more direct-light intensity.

### Gate result

v126 closes a specific character-grounding gap with role-authored load-bearing sides, level shoe soles, two-foot contact geometry and visible hand/sleeve pressure that persist through movement and a complete orbit. The mandatory same-canvas comparison still contains actionable P1 differences in continuous character deformation, bespoke secondary asset craft and offline-quality light/material transport.

final result: blocked

Blocker: source-level continuous body/cloth/finger deformation, complete-room secondary asset craftsmanship and offline-quality indirect light/material transport remain visibly ahead of the real-time implementation.

## 2026-07-25 reference-fidelity v125 mineral floor and source-derived daylight gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`, RGB, device scale factor `1`).
- Final desktop implementation: `tmp/v125-final-desktop-yaw0.png` (`1672 × 941` CSS/pixels, device scale factor `1`, deterministic 06:00 public-plaza testimony state).
- Mandatory normalized full-view comparison: `tmp/reference-vs-v125-final-full.png` (`3344 × 941`); the complete source and implementation are preserved at equal native pixel dimensions on one canvas.
- Mandatory focused comparison: `tmp/reference-vs-v125-floor-focus.png` (`3344 × 480`); equal-height native-pixel crops expose terrazzo scale, mineral colour separation, foliage breakup, rug/inlay response and furniture grounding.
- Full 3D and responsive evidence: `tmp/v125-final-desktop-yaw90.png`, `tmp/v125-final-desktop-yaw180.png`, `tmp/v125-final-desktop-yaw270.png`, `tmp/v125-final-mobile-yaw0.png` and `tmp/v125-four-direction-board.png`.
- Runtime evidence: opening desktop `168 / 284,598`, side `171 / 295,706`, reverse `172 / 336,430`, fourth orbit `169 / 288,522`; mobile `106 / 245,336`. Every capture completes the hidden two-frame atomic warmup with zero shader errors and remains below the desktop `180 / 450k` and phone `110 / 250k` release budgets.
- Interaction evidence: two fresh browser regressions moved the player `3.33m` and `3.33m`, rotated the physical camera `65.3°`, preserved the curved identity-surface blink and retained both role contact constraints. Desktop/mobile scene flow passes; the transition stress run covers `26` zones and `78` transitions with zero failures or runtime errors.

### Comparison history, fixes and post-fix evidence

- [fixed from v124 P1 / floor read as a uniform procedural beige slab] The civic floor now uses a source-directed `1024 × 1024` warm mineral terrazzo asset with muted teal, coral and umber aggregate, a larger authored repeat and a honed roughness response. The focused same-canvas comparison shows materially clearer aggregate hierarchy without turning the floor into gameplay noise.
- [improved / foliage light had broad value change but little canopy identity] A new source-derived linear gobo supplies irregular leaf breaks to the physical civic spotlight. The projector affects real room surfaces and moving actors rather than a screen-space overlay.
- [fixed / Three could construct the visible room while physical surface assets were still loading] Layer construction now waits for the full Three dependency-and-surface gate. The final map, gobo, rug, physics, camera and two-frame shader warmup therefore participate in one atomic reveal instead of relying on a later signature rebuild.
- [rejected visual experiment / additive sun receiver created a hard floor edge in rear orbit] The `90°–270°` review exposed oversized white leaf masses and a visible rectangular cutoff. The additive receiver and its asset were removed; production keeps the physical gobo plus the existing low-energy world-space foliage shadow receivers.
- [rejected exposure candidate / lighter floor tint and stronger projector flattened the room] Exact-size comparison showed an overly white lower frame and reduced furniture grounding. Production uses the darker `#c8c1b9` mineral tint, `0.72` roughness and `60/32` desktop/mobile projector intensity.
- [checked / the material change remains true through movement and orbit] The floor map, brass navigation lines, rug and foliage breakup remain metre-scale world surfaces at all four camera headings. No generated raster is used as a room screenshot, billboard or replacement for geometry.

### Required fidelity surfaces and findings

- [checked][fonts and typography] Chinese status, place-memory title, four civic actions and mobile truncation remain stable at the exact desktop and `390 × 844` viewports. The source still has more optically refined icon/type balance.
- [improved][spacing and layout rhythm] Material breakup gives the open foreground a navigable floor cadence without adding props to the `1.4m` circulation path. The source still has stronger asymmetrical foreground framing and a denser fixed-shot composition.
- [improved][colors and visual tokens] Warm ivory, walnut, teal, forest green, coral and brass now sit on a quieter mineral base; teal/coral aggregate connects the floor to the room palette without competing with testimony markers.
- [improved][image quality and asset fidelity] The terrazzo and gobo are real, source-directed raster assets with repeat/filtering and physically lit integration. The rejected additive receiver is not present in production, avoiding the raster edge exposed by orbit QA.
- [checked][copy and content] “倾听线索”, “倾听墙”, place-memory status and the four civic actions remain coherent with the visible testimony. No reference-private text is copied into runtime state.
- [checked][physical truth and responsiveness] The visual floor remains the same Rapier walk surface; actor capsules, furniture colliders, interaction anchors and authoritative movement are unchanged. Phone keeps the three-character performance LOD and practical joystick/action layout.
- [P1][whole-body deformation and contact pressure remain behind the source] The source still has finer clavicle rotation, elbow compression, finger curl, cloth reaction and planted weight transfer. The implementation's physical contacts are correct but mechanically cleaner and more toy-like.
- [P1][room-wide secondary asset craft remains visibly behind] Hero furniture is complete and orbit-safe, but documents, joinery, glassware, botanical species and shelf irregularity remain broader and more procedural than the source.
- [P1][offline indirect light and material transport remain visibly ahead] The new mineral/light separation closes part of the gap, but the source retains softer multi-bounce penumbrae, richer contact colour, subtler glass transport and more natural skin/cloth response.
- [P2][camera is gameplay-correct but not cinematically identical] Full orbit, movement and objective readability pass; the target can use a lower, denser fixed composition with richer foreground occlusion. Literal replication would currently compromise navigation in the rear quadrants.
- [P2][HUD optical finish remains behind] Coverage, hierarchy and responsive behavior pass, while icon craft, translucent-panel depth, micro-spacing and compact type treatment remain less refined than the target.

### Implementation checklist

- Preserve the new dependency-and-surface ready gate as part of the atomic scene contract.
- Retain the world-space physical gobo; do not reintroduce the rejected additive floor receiver.
- Build the next character-quality increment around full-body weight transfer and fabric/hand pressure rather than additional surface decoration.
- Replace the most visible broad secondary props only when they contribute a unique civic function and remain inside the established orbit/mobile budgets.

### Gate result

v125 improves the material and light foundation with a quieter, more specific mineral floor, source-derived physical canopy breakup and a stricter pre-render asset gate. The four-direction review also caught and removed a visually attractive front-view shortcut that failed the actual 3D orbit. The room remains genuinely walkable, rotatable and physically staged, but the mandatory same-canvas comparison still contains actionable P1 differences in character deformation, secondary environment craft and offline-quality light transport.

final result: blocked

Blocker: source-level whole-body deformation/contact pressure, complete-room bespoke secondary asset craft and offline-quality indirect light/material transport remain visibly ahead of the real-time implementation.

## 2026-07-25 reference-fidelity v124 physical hand-contact and composition gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`, RGB, device scale factor `1`).
- Final desktop implementation: `tmp/v124-final-desktop-yaw0.png` (`1672 × 941` CSS/pixels, device scale factor `1`, deterministic 06:00 public-plaza testimony state).
- Mandatory normalized full-view comparison: `tmp/reference-vs-v124-final-full.png` (`1672 × 471`); source and implementation are each downsampled to `836 × 471` without crop, then placed on the same canvas.
- Mandatory focused comparison: `tmp/reference-vs-v124-final-character-focus.png` (`1800 × 540`); equal `900 × 540` native-pixel crops expose the four-person circle, hands, props, stance and character/environment integration together.
- Full 3D and responsive evidence: `tmp/v124-final-desktop-yaw90.png`, `tmp/v124-final-desktop-yaw180.png`, `tmp/v124-final-mobile-yaw0.png` and `tmp/v124-orbit-and-mobile-board.png`.
- Runtime evidence: opening desktop `168 / 284,598`, side `172 / 295,706`, reverse `172 / 336,430`; mobile `106 / 245,336`. All scenes complete the hidden two-frame atomic warmup with zero shader errors and remain below the desktop `180 / 450k` and phone `110 / 250k` release budgets.
- Interaction evidence: two fresh browser runs moved the player `1.73m` and `2.05m`, rotated the physical camera `65.3°`, retained the curved identity-surface blink and preserved both contact constraints after movement. Desktop/mobile scene flow passes; the transition stress run covers `26` zones and `78` transitions with zero failures or runtime errors.

### Comparison history, fixes and post-fix evidence

- [fixed from v123 P1 / role hands only approximated story-prop contact] Every civic hand now exports a named contact effector, while the notebook and mediator head export authored targets. Runtime constraint v2 applies animation first, then solves the shoulder/elbow chain and mirrors the final joint deltas into the continuous skin rig.
- [fixed / the facilitator's guide hand visibly floated beside the notebook] The final front, side and reverse captures all retain a physical guide-hand/notebook relationship. Runtime measurement reduces the fingertip-to-guide distance from about `0.153m` to `0.000m` without moving the notebook off its authored hand pivot.
- [fixed / the mediator's thoughtful pose stopped at the chest instead of the face] The mediator now uses a head-attached jaw target, so the right hand follows the animated head rather than a static room coordinate. The opening capture reduces the hand-to-jaw error from about `0.683m` to `0.000m`; the focused comparison shows the intended listening/thinking read.
- [fixed / several simultaneous interaction stars competed with the testimony] The public room still exposes the same keyboard interactions and compass targets, but the world renders only the nearest/focused interaction star. The four-person relationship is now the primary mid-ground read.
- [improved / floor light breakup ended abruptly before the right foreground] A second rotated foliage receiver extends the portal-shadow language across the foreground at a cost of one draw call and two triangles.
- [rejected camera experiment / a `5.56m`, `3.28m` opening camera exposed too much empty floor] Exact-size review showed a smaller cast and weaker social focus. Production remains at the better `5.24m`, `3.18m` editorial camera, with the existing rear/side orbit allowances and no change to physical movement.
- [checked / all visible changes survive an actual orbit] At `90°` and `180°`, the notebook remains held, the jaw gesture remains anatomically legible, the cast stays inside the furnished shell and no front-only sprite or screen-space substitute is exposed.

### Required fidelity surfaces and findings

- [checked][fonts and typography] Chinese status, place-memory title, four civic actions and responsive truncation are stable at the exact desktop viewport and `390 × 844`. The reference still uses slightly more optically balanced small-text weights.
- [improved][spacing and layout rhythm] Removing three redundant world markers and rejecting the wider pullback restores a single mid-ground social focus. The source still has a calmer foreground path and more intentional negative space around the cast.
- [checked][colors and visual tokens] Warm ivory, walnut, teal, forest green, coral and brass remain coherent. The implementation is materially brighter and more uniformly saturated than the reference's softer bounced-light hierarchy.
- [improved][image quality and asset fidelity] Hand effectors, jaw/notebook targets and final contacts are real lit, animated 3D structures. No sprite, billboard, CSS/SVG drawing or screenshot projection substitutes for the visible hands and props.
- [checked][copy and content] “倾听线索”, “倾听墙”, place-memory status and the four civic actions all describe the visible social scene. No reference-private text has been copied into game state.
- [checked][physical truth and responsiveness] The same actor roots, Rapier capsules, furniture colliders, interaction anchors and authoritative movement remain intact. Portrait keeps the practical joystick/action layout and a three-character performance LOD under its hard budget.
- [P1][whole-body deformation and contact pressure remain behind the source] The focused same-canvas comparison now matches the narrative intent of hand-to-jaw and hand-to-notebook contact, but the source still has finer shoulder rotation, elbow compression, finger curl, cloth reaction and planted weight transfer.
- [P1][environment asset craft remains visibly behind] The current room is spatially coherent and fully modeled through orbit, yet documents, joinery, glassware, plant species and furniture edge treatment remain broader and more procedural than the source.
- [P1][lighting/material integration remains visibly behind] The reference has softer multi-bounce penumbrae, richer contact colour, less uniform floor exposure, subtler glass transport and more natural skin/cloth response.
- [P2][camera is gameplay-correct but not yet cinematically matched] The production camera preserves movement and 360° readability, while the reference can use a denser fixed shot with a lower apparent horizon and more foreground framing. A literal camera match would currently reduce navigation clarity, so this remains an authored gameplay/cinematic trade-off rather than an accepted fidelity pass.
- [P2][HUD optical finish remains behind] Functional hierarchy, safe areas and interactions pass; icon drawing, translucent-panel depth, micro-spacing and compact type treatment remain less refined than the source.

### Implementation checklist

- Preserve contact constraint v2 as the base for future finger curl and prop-pressure correctives.
- Replace the remaining broad procedural room forms with a small authored secondary-prop kit before adding more decorative geometry.
- Add lightmapped or probe-assisted indirect colour and material-specific response without exceeding the established mobile budget.
- Revisit camera and HUD optical polish only after character/environment density is closer to the source; the wider opening-camera candidate has already been rejected.

### Gate result

v124 closes a genuine physical storytelling gap: the facilitator now holds the evidence book and the mediator maintains a head-relative thoughtful gesture through the live animation stack, rather than merely resembling those contacts from one frame. Marker cleanup and the retained tighter camera improve the first read without compromising movement, orbit or performance. The mandatory full and focused comparisons still contain actionable P1 differences in whole-body deformation, authored environment finish and offline-quality light/material integration.

final result: blocked

Blocker: source-level whole-body deformation/contact pressure, complete-room production asset craft and offline-quality indirect light/material integration remain visibly ahead of the real-time implementation.

## 2026-07-25 reference-fidelity v123 hand acting and role-contact gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`, RGB).
- Final desktop implementation: `tmp/v123-final-desktop-yaw0.png` (`1672 × 941`, deterministic 06:00 public-plaza testimony state).
- Mandatory same-canvas source/implementation comparison: `tmp/reference-vs-v123-final-full.png`; both frames preserve the complete room at the same output size and an equivalent four-person social state. The implementation delta is isolated in `tmp/v122-vs-v123-final-full.png`.
- Full 3D and responsive evidence: `tmp/v123-final-desktop-yaw90.png`, `tmp/v123-final-desktop-yaw180.png`, `tmp/v123-final-mobile-390x844.png` and the consolidated `tmp/v123-orbit-and-mobile-board.png`.
- Runtime evidence: opening desktop `167 / 284,596`, side `171 / 295,704`, reverse `172 / 336,428`; mobile `106 / 245,336`. Every view completes the hidden two-frame atomic warmup with zero shader errors and remains below the desktop `180 / 450k` and phone `110 / 250k` release budgets.
- Interaction evidence: three consecutive browser regressions moved the player `2.85m`, `2.69m` and `2.85m`, rotated the physical camera `65.3°` and retained the animated curved identity surface. The four regenerated role assets total `7.30 MB`; every asset remains below `45k` triangles and `2 MB`.

### Comparison history, fixes and post-fix evidence

- [fixed from v122 P1 / fingers collapsed into a short mitten read] Hand contract v9 narrows the palm, lengthens and separates all five digits, increases tapered ring resolution and preserves the wrist heel. The new silhouette survives the front, side and reverse gameplay cameras as real rig-attached geometry.
- [fixed / notebook contact used flattened ellipsoids that read as surface stickers] Notebook contract v3 replaces the two edge contacts with curved tubes that wrap the cover and adds three real support fingers below the lower edge. Their final endpoints were pulled behind the book face after visual review so the support reads as grip rather than orange decoration.
- [improved / the mediator's testimony pose did not clearly read as a deliberate social action] Animation v17 brings the right hand into a thoughtful lower-face/chest gesture and opens the left hand toward the listening circle. An over-folded elbow candidate hid the wrist from the gameplay camera and was rejected before the final pose.
- [rejected experiment / listener hand-to-satchel contact reduced silhouette clarity] The proposed contact created a visibly floating hand at the default camera. The production listener pose therefore remains on the stable v16 contact while the asset keeps the new independent fingers.
- [improved / character contours lost separation against similarly valued room surfaces] The physically derived actor ink rim is slightly broader and darker, with no duplicated shell mesh or screen-space outline. Hair, sleeves and hands separate more clearly without breaking room lighting.
- [fixed / movement QA depended on ten wall-clock samples] The exploration gate now observes real browser animation frames and requires at least `0.8` of an authored walk cycle while retaining the strict `>0.22rad` stride and skin-deformation thresholds. Three consecutive cold runs pass, eliminating the former low-frame-rate false negative without weakening the physical contract.

### Required fidelity surfaces and findings

- [checked][fonts and typography] Chinese HUD hierarchy, action labels, testimony title and responsive truncation remain stable at exact desktop size and `390 × 844`.
- [improved][spacing and layout rhythm] The clearer mediator gesture and notebook grip strengthen the four-person listening circle without moving its metre-scale circulation, colliders or camera-safe area.
- [checked][colors and visual tokens] Warm ivory, teal, coral, green, walnut and brass remain the hierarchy; hand and contour changes add no competing decorative colour.
- [improved][image quality and asset fidelity] All hand digits, curved grip contacts, support fingers and role poses are lit, animated, orbit-safe 3D construction. No sprite, billboard, CSS/SVG drawing or screenshot projection substitutes for the visible actor volume.
- [checked][physical truth] Actor roots, Rapier capsules, furniture colliders, interaction anchors and authoritative movement remain unchanged. The movement test now proves an observed animation cycle rather than elapsed wall time.
- [P1][production deformation and true hand IK remain visibly behind the source] The same-canvas comparison still exposes simpler clavicle/upper-arm deformation, finger curling, prop pressure, cloth compression and whole-body weight transfer.
- [P1][room-wide secondary asset finish remains behind] Supporting documents, botanical species, bespoke joinery and small object variation still lack the source's production-level density and irregularity.
- [P1][offline global illumination remains visibly ahead] The reference retains softer multi-bounce penumbrae, richer contact colour, subtler glass transport and more natural skin/cloth response.
- [P2][HUD optical finish remains behind] Coverage and hierarchy pass, but icon drawing, glass-panel depth and compact micro-spacing remain less cinematic than the source.

### Gate result

v123 closes a visible part of the hand silhouette, notebook grip and role-acting gap while keeping the required room fully walkable, rotatable and physically staged. The stricter frame-observed movement gate now passes repeatedly under the same render load. The same-canvas comparison still contains actionable P1 gaps in production deformation/IK, complete-room bespoke asset finish and offline-quality indirect light.

final result: blocked

Blocker: source-level character deformation and true hand/prop IK, complete-room production asset finish and offline-quality global illumination remain visibly ahead of the real-time implementation.

## 2026-07-25 reference-fidelity v122 garment material and atomic-reveal gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`, RGB).
- Final desktop implementation: `tmp/v122-final-desktop-yaw0.png` (`1672 × 941`, deterministic 06:00 public-plaza testimony state).
- Mandatory same-canvas source/implementation comparison: `tmp/reference-vs-v122-final-full.png`; both frames retain their complete room composition at the same output size and comparable four-person social state.
- Full 3D and responsive evidence: `tmp/v122-final-desktop-yaw90.png`, `tmp/v122-final-desktop-yaw180.png`, `tmp/v122-final-mobile-390x844.png` and the consolidated `tmp/v122-orbit-and-mobile-board.png`.
- Runtime evidence: opening desktop `167 / 283,740`, side `170 / 294,848`, reverse `171 / 335,572`; mobile `106 / 244,768`. Every view completes the two-frame atomic warmup with zero shader errors and remains below the desktop `180 / 450k` and phone `110 / 250k` release budgets.
- Interaction evidence: the final browser regression moved the player `3.33m`, rotated the physical camera `65.3°` and retained the animated curved identity surface. Desktop/mobile scene flow passes, while the transition stress run completes `26` zones and `78` transitions with zero failures or runtime errors. The rebuilt four-role asset set is `7.34 MB`; every individual role remains below `45k` source triangles.

### Comparison history, fixes and post-fix evidence

- [fixed from v121 P1 / cardigan construction stopped at decorative seams] Facilitator and mediator now carry real raised cuff ribbing and separate buttonhole geometry. The additions survive side and reverse orbit as authored GLB volume rather than a screen-space texture or line.
- [fixed / all civic clothing inherited one generic plastic response] Garment material contract v1 authors poplin, jersey knit, waxed/weathered canvas and utility/pleated twill families. The merged actor shader packs those four identities into one vertex attribute and applies family-specific micro-normal and roughness response without exceeding WebGL attribute limits.
- [fixed / the story notebook read as a floating generic board] Cover and spine now use a restrained leather surface, while the facilitator gains a real palm-support contact mesh. Notebook contact contract v2 keeps the book, support and animated hand in the same authored pivot.
- [fixed / the first material-family implementation exceeded the runtime vertex-attribute budget] Four scalar flags were replaced by a single packed `vec4` attribute. All four merged actors now compile and render with zero recorded shader errors.
- [fixed / the room could declare itself ready before the merged actors completed their first heavy material frames] The final scene now renders two complete hidden frames after assets, physics, camera and UI are ready, then reveals atomically. A capture only `32ms` after the ready signal contains the complete cast and room; the old half-built actor flash no longer appears.
- [checked / physical and performance contracts remain intact] Garment topology v4, material contract v1 and notebook contact v2 are asserted by the asset and browser regressions. Visual transforms, Rapier colliders, navigation and interaction anchors remain unchanged.

### Required fidelity surfaces and findings

- [checked][fonts and typography] Chinese HUD hierarchy, testimony title, action labels and responsive truncation remain stable at exact desktop size and `390 × 844`.
- [improved][spacing and layout rhythm] More legible cloth families and stable hand-prop contact reinforce the four-person listening circle without changing its metre-scale circulation.
- [improved][colors and visual tokens] Knit, canvas, twill, poplin and leather now separate through light response instead of additional noisy colours; warm ivory, teal, coral, green, walnut and brass remain the room hierarchy.
- [improved][image quality and asset fidelity] Buttonholes, cuff ribs, palm support and fabric response are real lit, animated 3D construction. No sprite, billboard, CSS/SVG drawing or screenshot projection substitutes for the authored volume.
- [checked][atomic presentation] The visible room is never used as a shader-compilation surface. The player sees one complete final state rather than a temporary background or incomplete cast.
- [P1][production body deformation and hand contact remain visibly behind the source] The same-canvas comparison still exposes simpler clavicle/upper-arm deformation, finger articulation, cloth compression and weight transfer.
- [P1][room-wide secondary asset finish remains behind] Supporting documents, botanical species, bespoke joinery and small object variation still lack the source's production-level density and irregularity.
- [P1][offline global illumination remains visibly ahead] The reference retains softer multi-bounce penumbrae, richer contact colour, subtler glass transport and more natural skin/cloth light response.
- [P2][HUD optical finish remains behind] Coverage and hierarchy pass, but icon drawing, glass-panel depth and compact micro-spacing remain less cinematic than the source.

### Gate result

v122 closes a visible portion of the garment/material/contact gap and fixes a player-facing atomic reveal defect uncovered by the new shader path. The deliverable remains a genuinely walkable, rotatable, physically staged 3D room, and every reviewed camera direction compiles inside the release budgets. The same-canvas comparison still contains actionable P1 gaps in production deformation, room-wide bespoke asset finish and offline-quality indirect light.

final result: blocked

Blocker: source-level character deformation/contact, complete-room production asset finish and offline-quality global illumination remain visibly ahead of the real-time implementation.

## 2026-07-25 reference-fidelity v121 face optics and hair-construction gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`, RGB).
- Final desktop implementation: `tmp/v121-final-desktop-yaw0.png` (`1672 × 941`, deterministic 06:00 public-plaza testimony state).
- Mandatory same-canvas source/implementation comparison: `tmp/reference-vs-v121-final-full.png`; both frames use the same output size, equivalent social state and complete uncropped room composition.
- Full 3D and responsive evidence: `tmp/v121-final-desktop-yaw90.png`, `tmp/v121-final-desktop-yaw180.png`, `tmp/v121-final-mobile-390x844.png` and the consolidated `tmp/v121-orbit-and-mobile-board.png`.
- Runtime evidence: opening desktop `167 / 282,888`, side `170 / 293,996`, reverse `171 / 334,720`; mobile `106 / 244,336`. Every view remains below the desktop `180 / 450k` and phone `110 / 250k` release budgets.
- Interaction evidence: the exploration regression moved the player `3.33m`, rotated the physical camera `65.3°`, retained the curved identity-surface blink and completed desktop/mobile scene flow. The transition stress run completed `26` zones and `78` transitions with zero failures or runtime errors.

### Comparison history, fixes and post-fix evidence

- [fixed from v120 P1 / eyes retained a flat luminous decal read] The production curved identity surface now carries a separate pair of physically lit corneal lenses. Cornea v2 uses low-opacity transmission, restrained clearcoat and a shallow head-attached optical shell; it responds to the room rather than glowing independently.
- [fixed / experimental full-volume eyes became bead-like at gameplay distance] A three-mode same-state comparison (`curved-atlas`, `illustrated`, `uv`) showed that replacing the role-authored iris/eyelid hierarchy with primitive volume geometry reduced identity and created a plastic bead read. Production therefore keeps the curved role atlas and adds only the optical lens layer.
- [improved / pale hair highlight slabs competed with the faces] Player, listener, facilitator and mediator hair highlights are darker and closer to their authored base hue. The new value structure separates cap, flow ridge and role silhouette without creating ivory plastic chunks above the forehead.
- [fixed / temples ended in abrupt cap-to-face seams] All four GLBs gain real tapered `HairTempleWisp` geometry, alongside the existing cap, flow ridge, ribbon and face-frame locks. These head-attached locks survive side and reverse orbit and remain under the per-role `45k` triangle asset ceiling.
- [checked / identity optics remain spatially honest] The role atlas remains a dense, curved, head-attached surface with live expression morphs, depth testing and hair occlusion. The corneas and temple wisps are actual 3D geometry; no billboard, sprite, CSS/SVG drawing or screenshot projection is used.
- [checked / transition, movement and performance contracts remain intact] Face identity v4, cornea v2 and hair construction v4 are asserted after the atomic ready state. Assets, full build, 26-zone physics, movement/orbit, desktop/mobile scene flow and transition stress all pass.

### Required fidelity surfaces and findings

- [checked][fonts and typography] Chinese top HUD, location label, testimony state and bottom action rail remain stable at exact desktop size and in `390 × 844` portrait.
- [improved][spacing and layout rhythm] Clearer face/hair separation strengthens the four-person testimony ring while preserving the portal–listening-wall–lounge composition and circulation.
- [improved][colors and visual tokens] Hair values now remain inside the teal, coral, oatmeal, green and walnut hierarchy instead of introducing pale plastic highlights; the face optics borrow only room light.
- [improved][image quality and asset fidelity] Corneal response, temple wisps and layered role hair are authored, lit, animated and orbit-safe 3D geometry. The exact-size comparison shows more legible identity and less procedural cap construction.
- [checked][copy and content] “倾听线索”, “倾听墙”, the current-speaker marker and four civic actions remain coherent with the visible public testimony.
- [P1][production character skinning and contact remain visibly behind the source] The combined comparison still exposes simpler clavicle/upper-arm deformation, hand articulation, notebook grip and weight transfer.
- [P1][garment microconstruction and material response remain below the source] Hems, cuffs, knit/cloth differentiation, hardware and role-specific fabric compression are still less resolved.
- [P1][room-wide secondary asset finish remains below the source] The hero suites are coherent, but supporting shelves, documents, botanical variation and timber joinery still lack the source's production-level irregularity and craftsmanship.
- [P1][offline global illumination remains visibly ahead] The source retains softer multi-bounce penumbrae, richer contact colour, subtler glass reflections and more natural skin/cloth light transport.
- [P2][HUD optical finish remains behind] Responsive coverage and hierarchy pass; icons, glass-panel depth, micro-spacing and compact location treatment still read more functional than cinematic.

### Gate result

v121 improves the gameplay-distance character read without sacrificing the required walkable, rotatable 3D world: each role keeps a recognizable illustrated identity on a curved animated face, gains real light-responsive corneas and receives a more restrained layered hair construction. The exact-size source comparison still contains actionable P1 gaps in production skinning/contact, garment construction, secondary room assets and offline-quality indirect light.

final result: blocked

Blocker: source-level character deformation/contact, garment microconstruction, room-wide bespoke asset finish and offline-quality global illumination remain visibly ahead of the real-time implementation.

## 2026-07-25 reference-fidelity v120 civic material-construction gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`, RGB).
- Final desktop implementation: `tmp/v120-final-desktop-yaw0.png` (`1672 × 941`, deterministic 06:00 public-plaza testimony state).
- Mandatory same-canvas source/implementation comparison: `tmp/reference-vs-v120-final-full.png`; both frames use the same output size, equivalent social state and complete uncropped room composition.
- Full 3D and responsive evidence: `tmp/v120-final-desktop-yaw90.png`, `tmp/v120-final-desktop-yaw180.png`, `tmp/v120-final-mobile-390x844.png` and the consolidated `tmp/v120-orbit-and-mobile-board.png`.
- Runtime evidence: opening desktop `163 / 278,664`, side `166 / 289,772`, reverse `167 / 330,496`; mobile `103 / 241,168`. Every view remains below the desktop `180 / 450k` and phone `110 / 250k` release budgets. The three authored civic hero assets contain `59,592` source triangles.
- Interaction evidence: the exploration regression moved the player `3.17m`, rotated the physical camera `65.3°`, retained the curved identity-surface blink and completed desktop/mobile scene flow. The transition stress run completed `26` zones and `78` transitions with zero failures or runtime errors.

### Comparison history, fixes and post-fix evidence

- [fixed from v119 P1 / both tabletop plants repeated one generic five-leaf tuft] Hero-prop contract v11 gives the notice console a seven-stem upright botanical construction and the lounge shelf a separate crown plus three hanging vines. Pots now include soil and a fired-rim transition. The forms are real GLB geometry and remain species-distinct through side/reverse orbit.
- [improved / upholstery still read as pristine rounded boxes] Sofa seats and backs now carry different off-centre compression fields; the folded throw gains a real vertical drape. Existing piping, boxing, tufts and pillow pattern geometry remain attached, so the suite reads as assembled upholstery rather than one teal plastic volume.
- [improved / the display case lost its pane thickness and timber hierarchy at side angles] The front glazing gains dense cut-edge rails while the physical face uses higher transmission, lower roughness and greater optical thickness. Honey-oak carcass, smoked-oak door joinery, walnut structure and brass mullions preserve a four-level furniture hierarchy without adding a screen-space trick.
- [fixed / duplicated transparent display shelf existed in the authored source] The accidental overlapping shelf is removed before regeneration; labels and evidence objects remain readable through the single transmitted pane.
- [checked / upgraded detail remains inside the authoritative physical world] Furniture transforms, colliders, interaction anchors, metre scale and navigation remain unchanged. Visual and physical placement still share the same `ZoneLayoutProfile`; no new leaf, pane or textile detail creates a false walkable surface.
- [checked / transition and performance contracts remain intact] Hero-prop v11 and surface v3 are asserted after the atomic ready state. Assets, full build, 26-zone physics, movement/orbit, desktop/mobile scene flow and transition stress all pass.

### Required fidelity surfaces and findings

- [checked][fonts and typography] Chinese top HUD, location label, testimony state and bottom action rail remain stable at exact desktop size and in `390 × 844` portrait.
- [improved][spacing and layout rhythm] Material hierarchy strengthens the intended portal–testimony–lounge triangle without changing the clear central circulation or four-person social staging.
- [improved][colors and visual tokens] Warm ivory remains dominant; honey oak, smoked oak, walnut and brass now separate structural depth while teal/coral/green stay reserved for furniture identity, actors and interaction.
- [improved][image quality and asset fidelity] New stems, vines, pane edges, cushion compression and throw drape are authored, lit, orbit-safe 3D geometry. No sprite, billboard, CSS/SVG drawing or screenshot projection substitutes for the environment assets.
- [checked][copy and content] “倾听线索”, “倾听墙”, the current-speaker marker and the four civic actions remain coherent with the visible public testimony.
- [P1][production character skinning and contact remain visibly behind the source] The combined comparison still exposes simpler clavicle/upper-arm deformation, hand articulation, notebook grip and weight transfer.
- [P1][room-wide asset construction remains below the source] The three hero suites improve, but surrounding procedural shelving, secondary decor, timber profiles and document variation still lack the target's production-level irregularity and craftsmanship.
- [P1][offline global illumination remains visibly ahead] The source retains softer multi-bounce penumbrae, richer contact colour, subtler glass reflections and more natural skin/cloth light transport.
- [P2][HUD optical finish remains behind] Responsive coverage and hierarchy pass; icons, glass-panel depth, micro-spacing and the compact location treatment still read more functional than cinematic.

### Gate result

v120 closes a meaningful part of the previous environment-finish blocker with real botanical species, compressed upholstery, layered timber and optically legible glazing that survive movement and full orbit. The exact-size source comparison still contains actionable P1 gaps in production skinning/contact, secondary room-asset craftsmanship and offline-quality indirect light.

final result: blocked

Blocker: source-level character deformation/contact, room-wide bespoke asset finish and offline-quality global illumination remain visibly ahead of the real-time implementation.

## 2026-07-25 reference-fidelity v119 load-bearing character-construction gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`, RGB).
- Final desktop implementation: `tmp/v119-final-desktop-yaw0.png` (`1672 × 941` CSS/pixels, device scale factor `1`, WebGL internal pixel ratio `1.2`, deterministic 06:00 public-plaza testimony state).
- Mandatory same-canvas comparisons: `tmp/reference-vs-v119-final-full.png` and `tmp/reference-vs-v119-final-cast-focus.png`; source and implementation use the same viewport, equivalent social state and equal crop. `tmp/v118-vs-v119-cast-focus.png` isolates the implementation delta.
- Full 3D orbit evidence: `tmp/v119-final-desktop-yaw90.png` and `tmp/v119-final-desktop-yaw180.png`. Shoulder mantles, pelvis foundations, wrist volumes, notebook contacts and garment topology remain attached to the animated cast through real camera rotation.
- Movement evidence: `tmp/v119-walk-parallel.png`; the browser regression moved the player `4.61m`, rotated the camera `65.3°`, retained continuous limb skin and verified the curved identity-surface blink.
- Responsive evidence: `tmp/v119-final-mobile-390x844.png` (`390 × 844`, device scale factor `1`, intentional three-character phone LOD).
- Runtime evidence: desktop opening `163 / 275,248`, side `167 / 286,356`, reverse `167 / 327,080`; mobile `103 / 239,080`. Every view remains below the desktop `180 / 450k` and phone `110 / 250k` release budgets. Four regenerated role assets total `7.27 MB`.

### Comparison history, fixes and post-fix evidence

- [fixed from v118 P1 / shoulder-to-arm connection still read as a toy ball joint] Body identity v6 adds shallow, role-scaled `ShoulderMantle` geometry and diagonal load folds between the clavicle shelf and weighted arm volume. The v118/v119 focused comparison shows a broader authored shoulder plane without changing the metre-scale capsule or movement pivots.
- [fixed / skirted roles depended on a floating cone for their hip silhouette] Pelvis continuity v3 gives every costume a load-bearing foundation. Player and listener retain a fuller trouser seat; facilitator and mediator gain a hidden `SkirtHipFoundation`, so skirt flex no longer exposes two disconnected legs below a narrow waistband.
- [improved / coat and vest fronts carried repeated surface ribbons] Garment topology v3 moves shoulder-to-waist tension into the panel vertices using diagonal, multi-frequency displacement. Existing seam geometry remains restrained, while the lit silhouette now carries cloth pull instead of relying only on decorative strips.
- [improved / wrists collapsed into thin pegs at cuff and prop contact] Hand v8 enlarges the gameplay-scale hand by a few percent and adds a continuous wrist heel before the palm. The facilitator receives a second compressed notebook contact and animation v16 preserves the grip through listen/gesture blending.
- [fixed / cold or parallel QA could outlive the deterministic testimony pose] The QA-only opening observation window now survives four-GLB and post-processing shader compilation under concurrent checks. Player-facing timing remains `6.2s`; the isolated and parallel exploration regressions both pass.
- [checked / character construction remains physically honest] Actor roots, 1m world units, Rapier capsules, furniture colliders, interaction anchors and authoritative movement stay unchanged. The four GLBs remain below `45k` triangles each and the live room remains within every orbit/mobile budget.

### Required fidelity surfaces and findings

- [checked][fonts and typography] Chinese HUD hierarchy, action labels, testimony title, current-speaker beacon and responsive truncation remain stable in the exact-size desktop and portrait captures.
- [improved][spacing and layout rhythm] The cast keeps the same portal–circle–lounge composition, while clearer shoulder, waist, hip, hand and footwear breaks make the four social roles easier to separate at gameplay distance.
- [checked][colors and visual tokens] Warm ivory, teal, coral, forest green, walnut and brass are unchanged; added construction is expressed through form and light rather than extra decorative colours.
- [improved][image quality and asset fidelity] The new shoulder, pelvis, hand and cloth structures are actual lit GLB geometry driven by the existing rig and animation state. No sprite, billboard, screenshot projection, CSS drawing or custom SVG substitutes for character construction.
- [checked][copy and content] “倾听线索”, the deterministic mediator testimony, place-memory title and all four civic actions remain coherent with the visible social scene.
- [P1][production skinning and contact still remain below the source] The comparison now has a more credible load path, but the reference still shows finer clavicle/upper-arm deformation, true finger-to-prop IK, softer elbow compression and more natural seated/standing weight transfer.
- [P1][hair and garment microconstruction remain visibly behind] The source retains finer hair strand grouping, stitched hems, fabric thickness, buttonholes, cuff compression and role-specific material response.
- [P1][room-wide asset and global-light finish remain ahead] The implementation is truthful through orbit, while the source still has richer botanical breakup, thinner bespoke joinery, more varied documents, softer multi-bounce penumbrae and subtler skin/cloth transport.
- [P2][HUD optical finish remains behind] Functional density and responsive coverage pass, but icon drawing, translucent panel depth, micro-spacing and the compact location treatment remain less polished than the source.

### Gate result

v119 closes the most visible body-connection defects from v118: shoulders now carry into arms through a tailored plane, skirts have a real hip foundation, wrists retain volume and the notebook has a stable two-point contact read. These are real animated 3D improvements that survive walking, orbit and mobile LOD within the established budgets. The mandatory same-canvas comparison still exposes actionable P1 gaps in production skinning/IK, garment and hair microconstruction, bespoke environment finish and offline-quality light transport.

final result: blocked

Blocker: source-level character skinning/contact, hair/garment microconstruction, room-wide production asset finish and offline-quality indirect light remain visibly ahead of the real-time implementation.

## 2026-07-25 reference-fidelity v118 reverse witness-archive gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`, RGB).
- Final desktop implementation: `tmp/v118-final-desktop-yaw0.png` (`1672 × 941` CSS/pixels, device scale factor `1`, WebGL internal pixel ratio `1.2`, deterministic 06:00 public-plaza testimony state).
- Mandatory normalized full comparison: `tmp/reference-vs-v118-full.png`; focused equal-crop comparison: `tmp/reference-vs-v118-room-focus.png`. Both preserve source and implementation at the same route, time, room, testimony state, viewport and density before comparison.
- Full 3D orbit evidence: `tmp/v118-final-desktop-yaw90.png`, `tmp/v118-final-desktop-yaw180.png` and `tmp/v118-yaw0-vs-yaw180.png`. The new witness archive is wall-mounted, depth-tested and visible only on the correct far hemisphere while the real camera rotates.
- Responsive evidence: `tmp/v118-final-mobile-390x844.png` (`390 × 844`, device scale factor `1`, intentional three-character phone LOD).
- Runtime evidence: desktop opening `163 / 271,752`, side `166 / 282,860`, reverse `168 / 323,584`; mobile `103 / 236,536`. Every view remains below the desktop `180 / 450k` and phone `110 / 250k` release budgets.

### Comparison history, fixes and post-fix evidence

- [fixed from v117 P2 / reverse wall looked like a small temporary board in a blank rectangular recess] The opposite hemisphere is now a complete floor-to-cove witness archive with a continuous oak arch, walnut outer line, brass inner reveal, matching posts and plinths. `tmp/v118-yaw0-vs-yaw180.png` proves the room owns two intentional story faces instead of one dressed angle and one film-set back.
- [fixed / first v118 arch draft read as a pale inflated plaster ring] The thick pale torus was visually reviewed at `1672 × 941`, then replaced by a materially thinner warm-oak band with dark edge and restrained brass inner line. The final `180°` evidence reads as joinery rather than a balloon-like graphic.
- [fixed / testimony evidence was too sparse to imply a working civic archive] The centre field now carries eight pinned statements, readable colour marks, line hierarchy and individual pins. Paired authorization shelves add ledgers, sealed boxes and brass seals, while a continuous testimony ledge adds stacked records and a woven archive basket.
- [fixed / sconces and plants collided visually with the wider archive] Both are moved beyond the arch posts, preserving the evidence hierarchy and a clean central sofa/board silhouette without changing any collider or walkable path.
- [checked / reverse enrichment remains physically honest] The complete assembly is mounted behind the navigation boundary and adds no false walkable gaps, new floor obstacles or interaction promises. Player, NPC, furniture and Rapier transforms remain unchanged.
- [checked / authored reverse detail survives batching and LOD] Desktop geometry is merged into the orbit-aware wall group; mobile retains a reduced three-card, no-side-cabinet composition. The runtime exposes `mirrorlife-civic-reverse-wall-v3` after the same atomic ready gate.

### Required fidelity surfaces and findings

- [checked][fonts and typography] Chinese HUD family, hierarchy, line height, truncation, action labels and place-memory title remain stable in the exact-size desktop comparison and the `390 × 844` portrait capture.
- [improved][spacing and layout rhythm] The opening keeps its portal–cast–lounge triangle; the reverse view now has an arch–evidence–bench hierarchy at matching human scale. All four actors remain readable at `0°`, `90°` and `180°`, and the mobile action rail stays within the viewport.
- [improved][colors and visual tokens] Warm oak, dark walnut, matte cork, teal upholstery, coral/green testimony marks and narrow brass accents reuse the source-derived civic palette. The corrected arch no longer creates a broad near-white competing shape.
- [improved][image quality and asset fidelity] Arch, shelves, ledgers, pins, seals, woven basket and statement cards are real lit 3D geometry with front/side/reverse depth. No screenshot projection, sprite, CSS drawing, custom SVG or billboard is used.
- [checked][copy and content] “倾听线索”, “场所回声”, current-speaker beacon and the four civic actions remain coherent with the visible testimony/archive scene.
- [P1][production character construction remains visibly below the source] The equal-crop comparison still shows lower-resolution shoulder/hip planes, blockier hair, simplified hands, limited garment compression and weaker footwear/fabric construction.
- [P1][room-wide asset and material finish remains below the source] v118 closes the weakest reverse-wall hierarchy, but the source still has denser bespoke object variation, thinner timber profiles, upholstered compression, richer glass construction and more production-quality botanical breakup across the complete room.
- [P1][offline global illumination remains visibly ahead] The implementation preserves truthful 3D lighting through orbit, while the source retains softer multi-bounce penumbrae, more natural skin/cloth transport, subtler highlight roll-off and richer contact colour.
- [P2][HUD optical finish remains behind] Functional layout and mobile responsiveness pass, but icon drawing, translucent depth, fine padding and the source's compact upper-right location treatment remain more polished.

### Gate result

v118 resolves the previous reverse-wall P2 with a genuine orbit-safe architectural composition. Completing a half-turn now reveals a coherent civic witness archive rather than an unfinished neutral wall, and the added evidence density remains inside all desktop/mobile geometry and draw-call budgets. The exact same-size source comparison still contains actionable P1 gaps in production character construction, room-wide asset finish and offline-quality light transport.

final result: blocked

Blocker: source-level character/garment construction, room-wide production asset finish and offline-quality indirect light remain visibly ahead of the real-time implementation.

## 2026-07-25 reference-fidelity v117 body-silhouette and orbit-composition gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`, RGB).
- Final desktop implementation: `tmp/v117-final-desktop-yaw0.png` (`1672 × 941` CSS/pixels, device scale factor `1`, WebGL internal pixel ratio `1.2`, deterministic 06:00 public-plaza testimony state).
- Mandatory normalized comparison: `tmp/reference-vs-v117-full.png`; focused source/implementation cast comparison: `tmp/reference-vs-v117-cast-focus.png`; implementation delta: `tmp/v116-vs-v117-cast-focus.png`.
- Full 3D orbit evidence: `tmp/v117-final-desktop-yaw90.png` and `tmp/v117-final-desktop-yaw180.png`. The side view uses a tighter `51.32°` lens and a narrative-aware pivot; shortened skirts, tapered limbs, footwear, notebook contact and curved facial identity remain attached to the real animated actors throughout orbit.
- Responsive evidence: `tmp/v117-final-mobile-390x844.png` (`390 × 844`, device scale factor `1`, intentional three-character phone LOD).
- Runtime evidence: desktop opening `163 / 271,752`, side `166 / 282,860`, reverse `167 / 288,988`; mobile `103 / 236,536`. Four regenerated role assets total `7.17 MB`. Final browser exploration walked the player `3.61m`, rotated the real camera `65.3°` and retained the animated curved identity surface.

### Comparison history, fixes and post-fix evidence

- [fixed / all four limbs used an inflated near-uniform tube scale] Body identity v5 introduces reference-weighted arm taper for every role while preserving deliberately fuller cargo thighs on the player and listener. The focused v116/v117 comparison shows less rubber-limb mass without turning the two trouser roles into pencil legs.
- [fixed / both civic dresses read as ankle-length green cylinders] Garment topology v2 moves the skirt top and hem together, shortens the two silhouettes to below-knee length, reduces radial flare and repositions every authored hem/pleat/release ridge. The final front, side, reverse and mobile captures expose a readable cardigan–skirt–leg–boot sequence.
- [fixed / cream cardigan panels formed two broad rectangular bars] Facilitator and mediator coat panels are shorter, narrower, shallower and fitted closer to the torso. Their lapels, opening edges, waist release, pocket welts and cuffs remain real geometry rather than flat colour patches.
- [fixed / the story notebook hid both hands and read as a notice board] Cover, paper, spine, elastic, pencil and grip contact are rescaled together around the existing unified notebook pivot. Facilitator animation v15 reduces the excessive elbow fold and keeps the smaller book supported near the waist.
- [improved / player and listener feet disappeared under straight trouser columns] Cargo-leg fullness is preserved through the thigh while larger role footwear restores a clear ankle, sole and toe rhythm at the gameplay camera.
- [fixed / quarter-turn camera exposed a large unused floor field] The `90°` civic composition no longer spends four extra FOV degrees and almost half a metre of unnecessary pullback. Side-arc pivot weights ease toward the speaker/path centre only at quarter turns, reducing FOV from `54.12°` to `51.32°`, orbit radius from `5.997m` to `5.717m`, camera height from `3.615m` to `3.375m`, and pivot Z from `1.077m` to `0.939m`.
- [checked / silhouette changes do not break the authoritative world] Collider, actor root, metre scale, interaction anchors and Rapier capsule remain unchanged. The four assets retain continuous weighted skin, skirt flex, cloth correctives, facial morphs and the same movement contract.

### Required fidelity surfaces and findings

- [checked][fonts and typography] Chinese HUD family, weight hierarchy, line height, action labels, place-memory title and current-speaker icon remain stable at the matched desktop and portrait sizes.
- [improved][spacing and layout rhythm] The front cast keeps the player–speaker–witness triangle while shorter silhouettes reveal footwear and floor contact. The side orbit now frames the social group and window landmark more deliberately instead of leaving the actors stranded at one edge.
- [checked][colors and visual tokens] Warm ivory, teal, walnut, coral, green and brass remain unchanged; the pass improves colour separation by exposing garment layers rather than adding new hues.
- [improved][image quality and asset fidelity] The revised bodies, skirts, coats, notebook and shoes are regenerated GLB geometry driven by the shared animation and physical world. No sprite, billboard, CSS/SVG drawing or screenshot projection replaces the 3D character.
- [checked][copy and content] “倾听线索”, current-speaker beacon, place-memory title and the four civic actions remain coherent with the visible testimony scene.
- [P1][body and garment construction still remain visibly below the source] v117 corrects mass and length, but the reference still has finer shoulder/hip planes, stitched garment edges, cloth compression, independent fingers, fitted cuffs and role-specific deformation weights.
- [P1][facilitator notebook contact remains less natural than the source] The prop is now correctly scaled, but the wide gameplay pose still reads as a held board in some side phases; a production pass needs true wrist/forearm IK or a baked contact clip.
- [P1][bespoke environment density and curved joinery remain below the source] The selected source contains more documents, botanical species, woven storage, upholstered compression, curved timber profiles, glass thickness and object-scale variation.
- [P1][offline global illumination and material transport remain ahead] The WebGL scene remains spatially correct through orbit, while the source has softer multi-bounce penumbrae, richer cloth/skin response and more restrained highlight roll-off.
- [P2][reverse wall still has weaker authored hierarchy] The reverse view is functional and populated, but its white witness wall and rectilinear furniture remain flatter and more generic than the portal/listening-wall hero angle.
- [P2][HUD optical finish remains behind] Icon weight, translucent depth, spacing nuance and captured-state density remain less authored than the selected frame.

### Gate result

v117 materially improves the characters at the actual gameplay scale: sleeves and hands no longer dominate the silhouettes, civic skirts stop at a credible below-knee line, footwear and legs separate, the notebook becomes a personal prop, and the quarter-turn camera retains a designed social composition. All changes remain real, animated 3D geometry inside the same physical world. The normalized comparison still shows actionable P1 gaps in production garment deformation, hand-prop contact, bespoke environment construction and offline light transport.

final result: blocked

Blocker: source-level body/garment deformation and contact, room-wide bespoke environment density, and offline-quality global illumination remain visibly ahead of the real-time implementation.

## 2026-07-25 reference-fidelity v116 curved identity-surface gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`, RGB).
- Final desktop implementation: `tmp/v116-final-desktop-yaw0.png` (`1672 × 941` CSS/pixels, device scale factor `1`, WebGL internal pixel ratio `1.2`, deterministic 06:00 public-plaza testimony state).
- Mandatory normalized comparison: `tmp/reference-vs-v116-full.png`; focused source/implementation cast comparison: `tmp/reference-vs-v116-cast-focus.png`; implementation delta: `tmp/v115-vs-v116-cast-focus.png`.
- Full 3D orbit evidence: `tmp/v116-final-desktop-yaw90.png` and `tmp/v116-final-desktop-yaw180.png`. The identity surface remains curved around the authored head, depth-tested beneath the real hair volume and attached to head motion rather than facing the camera.
- Responsive evidence: `tmp/v116-final-mobile-390x844.png` (`390 × 844`, device scale factor `1`, intentional three-character phone LOD).
- Runtime evidence: desktop opening `163 / 271,752`, side `167 / 282,860`, reverse `167 / 288,988`; mobile `103 / 236,536`. The final character regression walked the player `3.65m`, rotated the real camera `65.3°` and verified the curved identity-surface blink.

### Comparison history, fixes and post-fix evidence

- [fixed / geometric facial pieces became bead-like and illegible at gameplay distance] A five-mode same-state comparison (`volume`, `atlas`, `hybrid`, `uv`, `illustrated`) showed that the role-authored facial atlas retained eyes, brows and mouth hierarchy more reliably than the former production sculpted-volume mode at the actual camera distance.
- [fixed / the role-authored face was only a QA alternative] The selected v2 facial atlas is now the production `mirrorlife-civic-face-identity-v3` integration. It is projected on a dense `36 × 24` curved mesh parented to the physical head pivot, so the actual head remains real geometry and the facial surface receives morphs, depth testing, hair occlusion and full 3D orbit. It is not a billboard or camera-facing plane.
- [fixed / broad pale source tones initially produced a white facial mask] Dual source-white coverage suppression removes the studio field and pale nose halo while preserving the dark identity marks. The final face blends into the role's authored three-dimensional skin shell instead of reading as a pasted white patch.
- [fixed / mediator hair read as pointed teeth and a bead stack] Five vertical braid spikes and spherical side beads are replaced by seven interwoven crown locks plus tapered overlapping bob locks. The reverse and side captures now retain a layered skull-following silhouette.
- [improved / coral ponytail dominated the focal cast] The bun, main ponytail and layered flyaways are narrower and slightly smaller while retaining the coral role identity.
- [checked / facial identity remains animated and spatially honest] Browser verification asserts six expression morphs, including blink, plus the v3 identity contract on every visible actor. Duplicate primitive eye and volumetric-lip stacks are absent in the production mode.
- [checked / identity readability costs less geometry] The four rebuilt role assets total `7.17 MB`; opening complexity falls to `163 / 271,752`. Desktop remains below `180 / 450k` and mobile remains below `110 / 250k`.

### Required fidelity surfaces and findings

- [checked][fonts and typography] HUD family, Chinese hierarchy, line height, action labels, place-memory title and current-speaker icon remain unchanged at the matched desktop and portrait sizes.
- [checked][spacing and layout rhythm] Actor roots, furniture transforms, colliders, central listening circle, interaction clearances and the `≥1.4m` circulation loop remain unchanged.
- [improved][colors and visual tokens] Role-authored brows, eyes, mouths and warm facial modelling restore the four identities without adding a competing screen-space treatment. Hair refinement preserves the existing teal, coral, oatmeal, green and walnut hierarchy.
- [improved][image quality and asset fidelity] Existing committed role atlases are filtered onto true curved 3D facial surfaces with live morphing, depth testing and hair occlusion. No CSS drawing, generated SVG, camera-facing sprite, billboard or screenshot projection replaces the character.
- [checked][copy and content] “倾听线索”, the current-speaker beacon, place-memory title and four civic actions remain coherent with the testimony state.
- [P1][body, limb and garment topology/deformation remain below the source] Face identity is clearer, but the reference still has finer shoulder/hip planes, cloth folds, finger contact, footwear construction, pose compression and deformation weights.
- [P1][bespoke environment density and curved joinery remain below the source] The reference still carries more individual documents, botanical species, woven storage, upholstery compression, curved timber profiles and object-to-object scale nuance.
- [P1][offline global illumination and material transport remain ahead] The live renderer preserves spatially truthful light through orbit, while the source still has softer multi-bounce penumbrae, richer skin/cloth transport and broader highlight roll-off.
- [P2][HUD optical finish remains less authored] Interaction hierarchy is usable and responsive, but icon weight, translucent depth, spacing nuance and captured-state density remain behind the selected frame.

### Gate result

v116 resolves a high-pixel character-readability failure with a spatially truthful production technique: role identity is now legible at gameplay distance on a curved, animated, head-attached surface, and remains correct from the side, reverse and mobile views. Mediator and facilitator hair silhouettes also lose their most procedural bead-and-spike artifacts. The normalized source comparison is materially closer in facial identity, but full reference parity remains blocked by source-level body/garment construction, room-wide bespoke set dressing and offline light transport.

final result: blocked

Blocker: production body/garment topology and deformation, bespoke environment/curved-joinery density, and offline-quality global illumination remain visibly below the selected reference.

## 2026-07-25 reference-fidelity v115 scanned hero-furniture surface gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`, RGB).
- Final desktop implementation: `tmp/v115-final-desktop-yaw0.png` (`1672 × 941` CSS/pixels, device scale factor `1`, WebGL internal pixel ratio `1.2`, deterministic 06:00 public-plaza testimony state).
- Mandatory normalized comparison: `tmp/reference-vs-v115-full.png`; focused source/implementation furniture comparison: `tmp/reference-vs-v115-furniture-focus.png`; implementation delta: `tmp/v114-vs-v115-furniture-focus.png`; cast check: `tmp/reference-vs-v115-cast-focus.png`.
- Full 3D orbit evidence: `tmp/v115-final-desktop-yaw90.png` and `tmp/v115-final-desktop-yaw180.png`. Wood, fabric, paper, glass and emissive separation remains attached to the actual hero furniture while the camera rotates around the metre-space room.
- Responsive evidence: `tmp/v115-final-mobile-390x844.png` (`390 × 844`, device scale factor `1`, intentional three-character phone LOD).
- Runtime evidence: desktop opening `171 / 289,992`, side `174 / 301,100`, reverse `175 / 307,228`; mobile `100 / 249,172`. The final regression walked the player `3.49m`, rotated the real camera `65.3°`, retained vertex eyelid closure, passed all `26` metre-space layouts and completed `78` atomic transitions without runtime error.

### Comparison history, fixes and post-fix evidence

- [fixed / hero furniture lost semantic materials before the final renderer] The earlier path merged each imported or semantic model into a generic vertex-colour batch before classifying oak, textile, paper, mineral and metal surfaces. v115 classifies and upgrades the three civic hero assets first, then creates a performance-safe opaque batch with persistent per-vertex surface masks.
- [fixed / Three.js material cloning silently removed the scanned-surface shader] The final room-placement and camera-occlusion merge cloned materials after preparation. Native `Material.clone()` intentionally resets `onBeforeCompile`, so the correctly classified scan shader disappeared in the live room. Runtime cloning now preserves both the compiler hook and its program cache key through placement, merge and occlusion-fade ownership.
- [improved / timber and upholstery still read as single painted blocks] Hero-specific shading increases scan frequency, real wood luminance/chroma breakup and restrained bump response while keeping fabric rough and low-specular. Paper, mineral, brass, glass and emissive materials remain separately legible instead of inheriting the wood treatment.
- [fixed / material programs with different surface semantics could enter the same batch] The geometry material key now includes the custom shader program cache key, preventing incompatible actor, architecture and hero-furniture programs from being collapsed together.
- [checked / the improvement is present in the final live room, not only configuration] Exploration verification asserts `mirrorlife-civic-hero-surface-v2` and at least three placed hero-furniture scan batches after the atomic ready state. The final `0°`, `90°`, `180°` and mobile captures retain the treatment.
- [checked / richer surfaces do not spend geometry or draw-call budget] Colliders, transforms, interaction anchors and mesh topology are unchanged. The opening remains at `171` calls; every desktop view stays below `180 / 450k`, and mobile remains below `110 / 250k`.

### Required fidelity surfaces and findings

- [checked][fonts and typography] HUD family, Chinese hierarchy, line height, truncation, action labels, place-memory title and projected speaker icon remain stable at identical desktop and portrait sizes.
- [checked][spacing and layout rhythm] Furniture footprints, the `≥1.4m` circulation loop, interaction clearances, central listening circle and camera-safe staging remain unchanged; the pass improves material reading without moving visual or physical space.
- [improved][colors and visual tokens] The established warm ivory, teal, walnut, coral and brass hierarchy remains intact. Wood gains localized amber/brown variation and cloth retains a calmer matte response instead of every opaque surface sharing one flat colour behavior.
- [improved][image quality and asset fidelity] The final placed display case, notice console and lounge suite now use the committed physical wood/fabric scan maps through real live PBR shader hooks. Glass and emissive layers remain independent; no screenshot projection, CSS drawing, custom SVG or camera-facing furniture substitute is used.
- [checked][copy and content] “倾听线索”, current-speaker beacon, place-memory title and the four civic actions remain coherent with the visible testimony scene.
- [P1][production character topology and deformation remain below the source] The reference still has substantially finer face planes, eyelid/lip performance, hand contacts, stitched garments, hair breakup and pose-specific cloth compression.
- [P1][bespoke environment density and curved joinery remain below the source] v115 restores surface semantics, but the source still has more individual papers, pastry/display detail, botanical species, woven storage, curved furniture profiles, upholstery compression and finer scale variation.
- [P1][offline global illumination and material transport remain ahead] The live WebGL materials now react more credibly, while the selected source still has richer multi-bounce colour, softer contact penumbrae, skin/cloth subsurface response and broader highlight roll-off.
- [P2][HUD optical finish remains less authored] Interaction hierarchy is functional and responsive, but icon weight, translucent depth, spacing nuance and exact captured-state density remain visibly behind the selected frame.

### Gate result

v115 fixes a hidden production-pipeline defect rather than painting over the screenshot: the three hero-furniture assets preserve their classified scanned wood, fabric and paper response through normalization, final batching, placement, camera fading, movement and real 3D orbit. The focused v114/v115 comparison is deliberately subtle because geometry, lighting and palette remain stable, but the display case, console and lounge timber now have less uniform colour and stronger surface separation at no performance cost. The same-size source comparison still shows a material gap driven chiefly by source-level topology, bespoke prop density and offline light transport.

final result: blocked

Blocker: production character topology/deformation, room-wide bespoke prop and curved-joinery density, and offline-quality global illumination remain visibly below the selected reference.

## 2026-07-25 reference-fidelity v114 source-derived foliage-light gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`, RGB).
- Final desktop implementation: `tmp/v114-final-desktop-yaw0.png` (`1672 × 941` CSS/pixels, device scale factor `1`, WebGL internal pixel ratio `1.2`, deterministic 06:00 public-plaza testimony state).
- Mandatory normalized comparison: `tmp/reference-vs-v114-full.png`; focused cast/lighting comparison: `tmp/reference-vs-v114-cast-focus.png`; implementation delta: `tmp/v113-vs-v114-cast-focus.png`.
- Full 3D orbit evidence: `tmp/v114-final-desktop-yaw90.png` and `tmp/v114-final-desktop-yaw180.png`. The foliage light and shadow stay anchored to the metre-space room while the real camera rotates; furniture, actors, exit glazing and reverse witness wall remain perspective-correct.
- Responsive evidence: `tmp/v114-final-mobile-390x844.png` (`390 × 844`, device scale factor `1`, intentional three-character phone LOD).
- Runtime evidence: desktop opening `171 / 289,992`, side `174 / 301,100`, reverse `175 / 307,228`; mobile `100 / 249,172`. The player walked `3.49m`, rotated the camera `65.3°`, retained vertex eyelid closure, passed all `26` metre-space layouts and completed `78` atomic transitions without runtime error.

### Comparison history, fixes and post-fix evidence

- [fixed from v113 P1 / procedural ellipses read as a decorative floor overlay] The former runtime `CanvasTexture` light painting is removed. A reproducible asset build extracts the leaf/branch silhouette from the committed `atelier-window-view.png`, converts it into a linear transmission gobo and a softened receiver texture, and stores both as real source-derived PNG assets.
- [fixed / foliage effect affected only an unlit floor plane] Light contract `mirrorlife-civic-light-transport-v3` projects the transmission map through a real Three.js `SpotLight` from the open threshold, so warm variation reaches terrazzo, furniture, clothing and moving actors. The existing invisible 3D canopy continues contributing truthful directional shadow-map occlusion.
- [fixed / a late texture load could have recreated the old two-stage room reveal] Gobo and receiver now preload inside the same atomic Three.js readiness gate as terrazzo, plaster and the listening rug; the final room is exposed once with its completed light state.
- [fixed / literal photographic edges looked cut out on the first draft] The asset builder applies a deterministic four-pixel separable blur before export. The final 0°, 90° and 180° frames retain recognizable botanical breakup without hard sticker edges.
- [fixed / visual light could silently disappear after an asset-loading regression] Browser exploration verification now asserts both the v3 transport contract and a live `civic-foliage-projection` object after ready-state loading.
- [checked / source-derived projection stays within Web budgets] Replacing the generated ellipse plane with one source-derived receiver keeps the opening at `171` calls; desktop remains below `180 / 450k`, and mobile remains below `110 / 250k`.

### Required fidelity surfaces and findings

- [checked][fonts and typography] Chinese HUD hierarchy, line height, truncation, action labels and world-projected speaker icon remain stable at identical desktop and portrait sizes.
- [improved][spacing and layout rhythm] Irregular light now reinforces the open threshold, listening-circle middle ground and evidence-desk foreground without moving furniture, colliders, interaction anchors or the `≥1.4m` circulation loop.
- [improved][colors and visual tokens] Warm ivory, teal, walnut, coral and brass retain their hierarchy; olive-grey leaf shadow and amber transmitted light add localized variation without introducing another decorative palette.
- [improved][image quality and asset fidelity] The new gobo is derived from the committed real window-view asset rather than code-drawn ellipses, gradients, CSS art or a custom SVG. The projected light participates in the live 3D scene, and the receiver remains perspective-correct through orbit.
- [checked][copy and content] “倾听线索”, current-speaker beacon, place-memory title and action rail remain coherent with the testimony scene.
- [P1][production character topology and deformation remain below the source] The reference still has finer facial planes, eyelid and lip deformation, finger contact, sewn folds, hair breakup and pose-specific cloth compression.
- [P1][environment asset density and scale nuance remain below the source] Functional zones and narrative landmarks match, but the reference has more bespoke papers, shelf objects, botanical species, curved joinery, glass thickness, upholstery compression and object-to-object scale variation.
- [P1][offline global illumination and material response remain ahead] v114 closes the most artificial localized-light gap, but the selected frame still has richer multi-bounce colour, skin/cloth subsurface response, softer contact penumbrae and broader highlight roll-off than the real-time WebGL renderer.
- [P2][HUD optical finish and captured state differ from the source] Controls are functional and responsive, but icon weight, translucent depth and exact state density remain visibly less refined than the selected frame.

### Gate result

v114 removes a conspicuous programmatic-light artifact and replaces it with source-derived botanical transmission that is reproducible, physically anchored and verified through movement, orbit and mobile LOD. The side and reverse frames now gain the localized window/leaf rhythm that was absent in v113. The same-size comparison is materially closer in environmental light authorship, but reference-level character construction, bespoke environment density and offline global illumination still remain visibly ahead.

final result: blocked

Blocker: production character topology/deformation, room-wide bespoke prop/material density, and offline-quality global illumination remain visibly below the selected reference.

## 2026-07-25 reference-fidelity v113 facial-readability and gesture-clearance gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`, RGB).
- Final desktop implementation: `tmp/v113-final-desktop-yaw0.png` (`1672 × 941` CSS/pixels, device scale factor `1`, WebGL internal pixel ratio `1.2`, deterministic 06:00 public-plaza testimony state).
- Mandatory normalized comparison: `tmp/reference-vs-v113-full.png`; focused cast/performance comparison: `tmp/reference-vs-v113-cast-focus.png`; implementation delta: `tmp/v112-vs-v113-cast-focus.png`.
- Full 3D orbit evidence: `tmp/v113-final-desktop-yaw90.png` and `tmp/v113-final-desktop-yaw180.png`. The revised head proportions, lips, eyes, hands and role-authored gesture remain genuine depth-tested geometry through the real camera orbit.
- Responsive evidence: `tmp/v113-final-mobile-390x844.png` (`390 × 844`, device scale factor `1`, intentional three-character phone LOD).
- Runtime evidence: desktop opening `171 / 289,992`, side `174 / 301,804`, reverse `175 / 307,228`; mobile `100 / 249,172`. Four v64 character GLBs total `7.20 MB`; the player walked `4.45m`, rotated the camera `65.3°`, retained vertex eyelid closure, passed all `26` metre-space layouts and completed `78` atomic transitions without runtime error.

### Comparison history, fixes and post-fix evidence

- [fixed / mediator's hand crossed the mouth and read like a moustache or broken face] Animation contract v14 makes the open left palm own the statement and keeps the right wrist below the sternum. The final 0° and 90° frames preserve the complete face; browser verification now rejects the earlier negative face-obscuring wrist fold.
- [fixed / centred nose shadow plus philtrum formed a horizontal dark bar] Face volume v17 replaces the centred bead with a small asymmetric nose-wing shadow and reduces the philtrum line. The nose reads through actual three-quarter volume without creating an artificial moustache.
- [improved / female eye apertures remained too small for the selected illustrated cast] Facilitator and mediator receive modestly wider/taller real sclera, lid and iris stacks while preserving smaller irises and independently deforming upper/lower eyelids. This restores expression readability without returning to the early circular doll-eye proportions.
- [improved / open-mouth frames became dark punched holes] Speech now uses a `26%`-range open-syllable duty cycle instead of roughly `57%`; the smaller mouth cavity has real upper/lower warm lip rims, while cheek, jaw and the unified closed-lip surface continue carrying most dialogue motion.
- [improved / hands had compact equal-length toy fingers] Hand contract v7 narrows the palm, establishes a clearer index-middle-ring-little length rhythm and refines root/tip taper. The full four-finger/thumb geometry remains independently posed and merged per hand for Web rendering.
- [checked / higher facial and hand authorship remains within Web budgets] The four GLBs increase only from `7.18 MB` to `7.20 MB`. All three desktop views stay below `180 / 450k`; the phone stays below `110 / 250k`.

### Required fidelity surfaces and findings

- [checked][fonts and typography] Chinese HUD hierarchy, line height, truncation, action labels and speaker-icon treatment remain stable at identical desktop and portrait sizes.
- [improved][spacing and layout rhythm] The active mediator's face is no longer visually crowded by her own wrist, so the intended player–speaker–witness triangle reads before the surrounding UI. Actor roots, circulation widths and camera-safe framing are unchanged.
- [improved][colors and visual tokens] Warm skin, brown/coral hair, oatmeal cloth and green civic costumes retain the source palette; softer lip/nose values remove the isolated near-black facial bar.
- [improved][image quality and asset fidelity] Revised heads, eye apertures, nose wing, lips, palms and fingers are authored GLB geometry with real materials, morph targets and skeleton pivots. They survive movement and `0°/90°/180°` views; no sprite, billboard or camera-facing character substitute is used.
- [checked][copy and content] “倾听线索”, the active-speaker beacon, story-memory title and action rail remain coherent with the visible testimony performance.
- [P1][production facial and garment topology still remain below the source] v113 removes the most distracting face occlusion and dark-bar artifact, but the selected frame still has finer eyelid rims, cheek/jaw compression, finger contacts, sewn folds and hand-painted deformation weights.
- [P1][environment micro-density and curved joinery remain below the source] The functional zones match, while the source still contains substantially more individual documents, shelf objects, botanical variation, upholstery compression, curved timber and foreground evidence.
- [P1][offline light transport remains ahead] The live room has consistent daylight and contact through orbit, but the source still has localized leaf shadows, softer multi-bounce penumbrae, richer skin/cloth transport and a broader highlight roll-off.

### Gate result

v113 materially improves the first-read character performance: the focal speaker keeps a complete, readable face; her eyes, nose, lips and hand silhouette are closer to the selected stylized cast; and the same authored geometry survives walking, orbit, mobile LOD and the strict performance gates. The exact same-size comparison is cleaner and less mannequin-like, but source-level facial/garment finishing, room-wide bespoke set dressing and offline light transport still remain visibly ahead.

final result: blocked

Blocker: production facial/garment topology and deformation, room-wide bespoke micro-prop/material density, and offline-quality localized indirect light remain visibly below the selected reference.

## 2026-07-25 reference-fidelity v112 world-projected speaker-beacon gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`, RGB).
- Final desktop implementation: `tmp/v112-final-desktop-yaw0.png` (`1672 × 941` CSS/pixels, device scale factor `1`, WebGL internal pixel ratio `1.2`, deterministic 06:00 public-plaza testimony state).
- Mandatory normalized comparison: `tmp/reference-vs-v112-full.png`; focused cast/performance comparison: `tmp/reference-vs-v112-cast-focus.png`; implementation delta: `tmp/v111-vs-v112-cast-focus.png`.
- Full 3D orbit evidence: `tmp/v112-final-desktop-yaw90.png` and `tmp/v112-final-desktop-yaw180.png`. The speaker beacon remains tied to the mediator's projected head position while the real camera orbits; the room, cast and new listening-console detail remain perspective-correct.
- Responsive evidence: `tmp/v112-final-mobile-390x844.png` (`390 × 844`, device scale factor `1`, intentional three-character phone LOD with a smaller beacon following the visible notebook facilitator).
- Runtime evidence: desktop opening `171 / 290,656`, side `174 / 301,764`, reverse `175 / 307,892`; mobile `100 / 249,256`. The player walked `4.13m`, rotated the real camera `65.3°`, retained vertex eyelid closure, and passed the authored speaker-role/icon/projection assertions.

### Comparison history, fixes and post-fix evidence

- [fixed / focal speaker lacked the source's coral listening pin] The room now uses the licensed Font Awesome `location-pin` and `ear-listen` production assets. The coral pin, white ear and shadow reproduce the reference's compact focal language without a handwritten SVG, CSS-drawn ear or text glyph.
- [fixed / a screen-fixed marker would detach during movement or orbit] Each render resolves the active `talking`, `doing` or `interact` actor, projects a point above that actor's world-space head through the live Three.js camera, scales it by camera distance and hides it outside the safe viewport. The exact projected `left/top` relationship is covered by browser verification.
- [fixed / the marker needed to communicate the changing conversation] The opening mediator owns the desktop marker; the visible facilitator owns it in the mobile LOD; selecting “引导对话” transfers the beacon's actor binding to the facilitator. The marker is non-interactive and has the accessible label “当前发言者”.
- [improved / listening console lacked source-like small authored evidence] The console basket gains low-cost weave bands and ribs; the surface gains a framed witness card, paper lines and a brass seal. These details remain within the existing furniture footprint and do not alter collision or circulation.
- [fixed / first density draft exceeded the phone triangle gate] Decorative basket/card strips moved from repeated rounded-box tessellation to small real box meshes. Final mobile complexity falls to `249,256`, below the `250k` gate, while preserving the visible small-scale construction.

### Required fidelity surfaces and findings

- [checked][fonts and typography] Existing Chinese HUD hierarchy, line height, truncation, action labels and target copy remain stable. The beacon communicates through a real icon asset and an ARIA label rather than adding small floating text.
- [improved][spacing and layout rhythm] The marker sits above the active head at the source-relative scale, moves with perspective and hides near viewport edges; it does not cover the player's route or persistent controls at desktop or `390 × 844`.
- [improved][colors and visual tokens] Coral becomes the single active-speaker accent against warm ivory, teal, walnut and brass, matching the source's semantic hierarchy without adding a competing palette.
- [improved][image quality and asset fidelity] The marker uses two attributable vector assets with crisp desktop/mobile rendering. Characters, room props and new console detail remain real geometry; the marker is intentionally the same world-projected UI/3D hybrid used by the source rather than a fake replacement for scene content.
- [checked][copy and content] “倾听线索”, “引导对话” and “当前发言者” now describe the visible conversation state coherently.
- [P1][character topology and acting finesse remain below the source] The selected frame still has finer facial planes, eyelid/lip deformation, finger contact, shoulder compression, cloth folds and individual silhouette polish.
- [P1][environment density and scale nuance remain below the source] The added witness card and weave improve one high-pixel cluster, but the reference still has substantially denser small documents, shelf contents, botanicals, textiles, curved joinery and object-to-object scale variation.
- [P1][offline light transport remains ahead] The real-time scene has coherent daylight and contact, while the source retains softer multi-bounce penumbrae, localized sun flecks, richer skin/cloth response and broader highlight roll-off.

### Gate result

v112 closes the explicit focal-language gap: the currently speaking person is now identified by a licensed, source-matched listening beacon that is genuinely attached to the 3D performance and survives desktop, mobile and orbit changes. The furniture detail pass also improves one foreground/background evidence cluster without violating the strict mobile budget. The literal same-size comparison is clearer in narrative focus, but source-level character construction, bespoke set-dressing density and offline light transport remain visibly ahead.

final result: blocked

Blocker: production character topology/acting, room-wide bespoke micro-prop and material density, and offline-quality localized indirect light remain visibly below the selected reference.

## 2026-07-25 reference-fidelity v111 social-performance and contrast gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`, RGB).
- Final desktop implementation: `tmp/v111-final-desktop-yaw0.png` (`1672 × 941` CSS/pixels, device scale factor `1`, WebGL internal pixel ratio `1.2`, deterministic 06:00 public-plaza testimony state).
- Mandatory normalized comparison: `tmp/reference-vs-v111-full.png`; focused cast/performance comparison: `tmp/reference-vs-v111-cast-focus.png`; implementation delta: `tmp/v110-vs-v111-cast-focus.png`.
- Full 3D orbit evidence: `tmp/v111-final-desktop-yaw90.png` and `tmp/v111-final-desktop-yaw180.png`. The same active testimony, body/head attention chain, PBR room and complete actors remain perspective-correct through the real orbit.
- Responsive evidence: `tmp/v111-final-mobile-390x844.png` (`390 × 844`, device scale factor `1`, intentional three-character phone LOD with the notebook facilitator taking the mobile focal beat).
- Runtime evidence: desktop opening `171 / 290,656`, side `174 / 301,212`, reverse `175 / 307,892`; mobile `96 / 248,996`. The player walked `4.57m`, rotated the real camera `65.3°`, retained vertex eyelid closure, passed all `26` metre-space layouts and desktop/mobile scene flow, and completed `78` atomic transitions without runtime error.

### Comparison history, fixes and post-fix evidence

- [fixed / the four-person opening still read as static mannequins] Entering the civic room now starts an authoritative testimony beat. On desktop the brunette mediator uses the `gesture` clip while the teal listener and notebook facilitator use `listen`; the player also settles into the listening performance until movement takes control.
- [fixed / every witness looked only at the player] The runtime resolves the active speaker, turns stationary witnesses toward that world-space target with time-independent damping, then applies a role-specific camera-opening bias so the social relationship and both eyes remain readable together.
- [improved / generic gesture made every role present two arms symmetrically] Animation contract v13 adds separate mediator, facilitator and listener gesture offsets: measured palm-and-chest mediation, notebook-supported facilitation and one-hand-to-chest testimony. These are composed over the same skeleton and garment correctives used by movement.
- [improved / mobile removed the desktop speaker with its three-character LOD] The focal testimony falls back to the visible notebook facilitator below `720px`, preserving an active speaker and two-person attention chain without reintroducing the hidden fourth actor.
- [fixed / room luminance was measurably too bright and compressed] In the normalized room crop, v110 measured mean luminance `0.608`, standard deviation `0.191`, median `0.676`; the source measured `0.522 / 0.209 / 0.547`. v111 moves to `0.566 / 0.207 / 0.639` by reducing ambient ceiling/rear lift, lowering civic exposure, strengthening directional key/rim separation and applying a warmer, steeper civic-only grade.
- [checked / stronger performance and contrast retain Web budgets] No new scene meshes are required. The animation state, gaze resolution and grade remain below `180 / 450k` desktop and `110 / 250k` mobile.

### Required fidelity surfaces and findings

- [checked][fonts and typography] HUD family, Chinese hierarchy, optical weights, line height, truncation and action copy remain readable at desktop and portrait sizes. No runtime performance state causes label wrap or HUD collision.
- [improved][spacing and layout rhythm] The opening now has a readable action triangle—foreground player, speaking rear mediator and two attending witnesses—while preserving the `≥1.4m` circulation loop, interaction anchors and three-depth composition.
- [improved][colors and visual tokens] Warm ivory, walnut, teal, coral, dark cloth and brass retain identity while the flatter pale mid-tone field gains source-closer contrast and warmth. The adjustment is a civic-only live shader/light treatment, not a baked screenshot.
- [improved][image quality and asset fidelity] Gesture, attention, lighting and contact remain attached to real GLB actors, bones, PBR surfaces, lights and shadow receivers through movement plus `0°/90°/180°` views. No sprite, billboard, CSS drawing, custom SVG or camera-facing scene substitute is used.
- [checked][copy and content] “倾听线索” now corresponds to a visibly active testimony; the location, story-memory title, interaction prompt and four actions remain coherent with the scene.
- [P1][character topology and acting finesse remain below the source] The social intent is now readable, but the reference still has finer shoulder/hand posing, finger contact, eye-line nuance, facial compression and production deformation weights.
- [P1][environment density and scale nuance remain below the source] The implementation has the same functional zones, but shelves, plants, small documents, upholstery and foreground objects remain fewer, chunkier and less individually authored.
- [P1][offline light transport remains ahead] Histogram contrast is closer, while the reference still has localized sun shafts, softer multi-bounce penumbrae, richer skin/cloth response and a broader highlight roll-off than the real-time WebGL rig.
- [P2][desktop focal speaker lacks the reference listening beacon] The mediator is identified through staging, gaze and motion, but the selected source also uses a coral listening pin. A future pass should add a production icon asset with true world projection and occlusion-safe UI placement rather than a code-drawn approximation.

### Gate result

v111 converts the room from a posed diorama into an authored social beat: a visible person speaks, the other actors attend to her, each role uses a different body language, and the relationship remains coherent while the player moves or orbits the room. Measured luminance and contrast also move materially toward the selected frame. The same-size comparison is closer in narrative focus and tonal range, but production character deformation, dense bespoke set dressing and offline light transport still prevent reference-level parity.

final result: blocked

Blocker: source-level character topology/acting, bespoke environment density and offline-quality localized light transport remain visibly below the selected reference; the desktop focal speaker also lacks the reference's production listening-beacon asset.

## 2026-07-25 reference-fidelity v110 facial-proportion and cloth-grounding gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`, RGB).
- Final desktop implementation: `tmp/v110-final-desktop-yaw0.png` (`1672 × 941` CSS/pixels, device scale factor `1`, WebGL internal pixel ratio `1.2`, identical public-plaza listening state).
- Mandatory normalized comparison: `tmp/reference-vs-v110-full.png`; focused cast comparison: `tmp/reference-vs-v110-cast-focus.png`; implementation delta: `tmp/v109-vs-v110-cast-focus.png`.
- Full 3D orbit evidence: `tmp/v110-final-desktop-yaw90.png` and `tmp/v110-final-desktop-yaw180.png`. The same faces, garments, contact shadows and complete actors remain perspective-correct and depth-tested through the real room orbit.
- Responsive evidence: `tmp/v110-final-mobile-390x844.png` (`390 × 844`, device scale factor `1`, intentional three-character phone LOD).
- Runtime evidence: desktop opening `171 / 290,104`, side `174 / 301,212`, reverse `175 / 307,340`; mobile `96 / 248,996`. The player walked `4.41m`, rotated the real camera `65.3°`, verified vertex-driven eyelid closure, passed all `26` metre-space layouts and desktop/mobile flow, and completed `78` atomic transitions without runtime error.

### Comparison history, fixes and post-fix evidence

- [fixed / eyes remained too large, round and widely separated] Civic sculpt v63 narrows the sclera, iris, pupil and glint volumes, reduces the eye-pivot spacing and preserves independently deforming lids. The final focused comparison reads less like four identical bead-eyed dolls while retaining gaze and blink behavior.
- [improved / the eye-to-cheek transition ended abruptly] Face volume v16 adds restrained lower-lid crease geometry plus a short philtrum plane, giving the warm face shell an orbital and nose-to-mouth transition that remains physical through side and reverse views.
- [improved / pale skin and inflated hair caps flattened identity] Role skin palettes move to warmer mid-values, the base face narrows slightly and all four hair caps lose excess lateral/depth volume. Hair ribbons, fringe, ponytail, braids and face frames remain separate real geometry.
- [improved / cloth surfaces showed only micro-weave noise] Actor material hierarchy v12 layers broad low-frequency drape variation under the existing scan-scale weave and construction seams. The response follows world-space light rather than acting as a screen filter.
- [improved / feet still appeared lightly pasted onto the terrazzo] Resting contact opacity/scale increase to `0.32 / 0.96`, with walking contact at `0.25 / 0.84`. Contact remains softer than cast shadows and follows each actor root during movement.
- [checked / added facial construction stays within Web budgets] The four role assets total `7.18 MB`; every role remains below `2 MiB`. Desktop and phone captures remain inside the `180 / 450k` and `110 / 250k` gates.

### Required fidelity surfaces and findings

- [checked][fonts and typography] HUD family, Chinese hierarchy, weights, line height, truncation and action labels remain readable at desktop and portrait sizes; the character-only change does not alter the stable UI layer.
- [checked][spacing and layout rhythm] Actor roots, metre-scale interaction anchors, the listening-circle opening, foreground/middle/background staging and camera-safe composition remain unchanged.
- [improved][colors and visual tokens] Warmer differentiated skin, controlled dark-eye values, teal/green/oatmeal cloth and neutral terrazzo separate more naturally without adding a new decorative palette.
- [improved][image quality and asset fidelity] Eye, lid-crease, philtrum, hair and garment changes are authored GLB geometry or live PBR material response. They remain attached to bone-driven actors through movement and orbit; no sprite, billboard, CSS avatar, custom SVG or camera-facing cover is used.
- [checked][copy and content] Location, story-memory title, current target and four listening actions remain coherent with the visible civic sequence.
- [P1][facial topology and acting remain below the source] The reference has finer eyelid rims, cheek compression, jaw variation, lip-edge definition, gaze nuance and expression weighting. The implementation still reads somewhat mannequin-like in close or reverse views.
- [P1][hair and garment finish remain below the source] The runtime cast has real layered hair and sewn-form garments, but strand breakup, flyaways, anisotropic response, layered hems and contact-fold deformation remain visibly simpler.
- [P1][offline scene rendering remains ahead] The reference still has denser bounce light, softer multi-bounce penumbrae, richer local exposure roll-off and more nuanced skin/cloth subsurface response.

### Gate result

v110 reduces the most conspicuous remaining doll cues by correcting eye proportion, face width, hair-cap mass and facial transitions, then strengthens broad cloth drape and actor-floor contact without sacrificing skeleton animation, movement, orbit, mobile LOD or performance budgets. The literal same-size comparison is closer in facial restraint and grounding, but the selected offline frame remains ahead in production topology, facial acting, hair/garment simulation and renderer-level light transport.

final result: blocked

Blocker: source-level facial deformation and expression weighting, production hair/garment surface authoring, and offline-quality skin/cloth/indirect-light transport remain visibly below the selected reference.

## 2026-07-25 reference-fidelity v109 furniture construction gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`, RGB).
- Final desktop implementation: `tmp/v109-final-desktop-yaw0.png` (`1672 × 941` CSS/pixels, device scale factor `1`, WebGL internal pixel ratio `1.2`, identical public-plaza listening state).
- Mandatory normalized comparison: `tmp/reference-vs-v109-full.png`; focused foreground-furniture comparison: `tmp/reference-vs-v109-furniture-focus.png`; implementation delta: `tmp/v108-vs-v109-furniture-focus.png`.
- Full 3D orbit evidence: `tmp/v109-final-desktop-yaw90.png` and `tmp/v109-final-desktop-yaw180.png`. The same furniture remains perspective-correct, materially lit and physically staged through the real orbit.
- Responsive evidence: `tmp/v109-final-mobile-390x844.png` (`390 × 844`, device scale factor `1`, intentional three-character phone LOD and procedural glass-case fallback).
- Runtime evidence: desktop opening `171 / 288,952`, side `174 / 300,060`, reverse `175 / 306,188`; mobile `96 / 248,996`. The player walked `4.25m`, rotated the real camera `65.3°`, loaded all three v10 desktop hero assets, passed all `26` metre-space layouts and desktop/mobile flow, and completed `78` atomic transitions without runtime error.

### Comparison history, fixes and post-fix evidence

- [fixed / the display cabinet read as a glass box over a painted base] Hero asset v10 adds real lower door rails/stiles, inset reveals, handle backplates, shelf lips, raked glass posts, mullion caps and tray rims. The mobile fallback receives the same face-frame and brass mullion grammar while retaining a single merged opaque batch.
- [fixed / the record desk looked finished only from the opening camera] The desk now has side and rear aprons, a low stretcher and visible joinery pins, all inside the existing render/physics footprint. The back and side remain structurally credible at `90°` and `180°` rather than exposing four disconnected legs.
- [improved / sofa upholstery remained broad rounded slabs] The lounge suite adds cushion side boxing, contrasting welt/seam lines, a restrained brass front reveal and clearer timber rails. These are authored geometry rather than screen-facing decoration and remain attached through orbit.
- [improved / bookcase shelves repeated as an undifferentiated grid] A crown, toe kick, shelf-front lips, varied book depth and alternating bookends introduce readable cabinet construction and curated pauses without moving its collider.
- [checked / higher construction density stays inside Web budgets] The rebuilt three-asset suite totals `56,176` authored triangles. Scene peaks remain below `180` draw calls / `450k` desktop triangles and `110` / `250k` mobile.

### Required fidelity surfaces and findings

- [checked][fonts and typography] HUD family, Chinese hierarchy, weights, truncation and action labels remain readable at desktop and portrait sizes; the asset rebuild does not alter the UI layer.
- [improved][spacing and layout rhythm] Furniture footprints and interaction anchors are unchanged, preserving the `≥1.4m` loop and open hearing centre while adding detail to foreground, middle-ground lounge and background storage.
- [improved][colors and visual tokens] Oak, walnut, teal textile, paper, ceramic, glass and brass now break at meaningful construction seams instead of occupying large undifferentiated blocks.
- [improved][image quality and asset fidelity] The four high-pixel furniture families use authored GLB or real Three.js geometry with bevels, thickness, joinery, glass, PBR surface response and physical depth. No sprite, CSS substitute, fake SVG or camera-facing cover is used.
- [checked][copy and content] Location, story-memory title, current target, evidence-board title and four listening actions remain coherent with the civic scene.
- [P1][furniture form and surface density remain below the offline source] The source still has finer curved wood profiles, softer upholstery compression, richer glass refraction, denser shelf contents and per-object texture variation.
- [P1][character finish remains below the source] Existing volumetric face, layered hair and authored garments remain functional, but facial topology, expression weighting, strand breakup and sewn-detail resolution are visibly simpler.
- [P1][offline rendering remains ahead] v108 light transport remains coherent, while the source has deeper multi-bounce colour, softer contact penumbrae and more localized exposure variation.

### Gate result

v109 removes several conspicuous “programmatic block furniture” cues while keeping visual meshes, physical footprints, interaction anchors, orbit behaviour and mobile budgets aligned. The same-size comparison is closer in cabinet joinery, desk structure, upholstery separation and storage detail, but the selected offline frame remains ahead in furniture sculpting, character finish and renderer-level light transport.

final result: blocked

Blocker: source-level furniture sculpting and per-object material variation, production character topology/acting, and offline-quality indirect-light transport remain visibly below the selected reference.

## 2026-07-25 reference-fidelity v108 indirect-light and material-separation gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`, RGB).
- Final desktop implementation: `tmp/v108-light-final-yaw0.png` (`1672 × 941` CSS/pixels, device scale factor `1`, WebGL internal pixel ratio `1.2`, identical public-plaza listening state).
- Mandatory full-view comparison: `tmp/reference-vs-v108-full.png`; focused cast/material comparison: `tmp/reference-vs-v108-cast-focus.png`; implementation delta: `tmp/v107-vs-v108-cast-focus.png`.
- Full 3D orbit evidence: `tmp/v108-final-desktop-yaw90.png` and `tmp/v108-final-desktop-yaw180.png`. The same light rig, physical materials, cast, props and contact treatment remain perspective-correct through the complete room orbit.
- Responsive evidence: `tmp/v108-final-mobile-390x844.png` (`390 × 844`, device scale factor `1`, intentional three-character phone LOD and reduced local-light budget).
- Runtime evidence: desktop opening `171 / 280,808`, side `174 / 291,916`, reverse `175 / 298,044`; mobile `100 / 239,480`. The player walked `4.05m`, rotated the real camera `65.3°`, retained the lighting and vertex-eyelid contracts, passed all `26` metre-space layouts and desktop/mobile flow, and completed `78` atomic transitions without runtime error.

### Comparison history, fixes and post-fix evidence

- [fixed / the room collapsed into a sepia key with dark corners] `mirrorlife-civic-light-transport-v2` separates a neutral warm window key, cool directional fill, hemisphere lift, portal bounce, ceiling return, rear-wall return and lounge reflection. The final frame keeps a readable daylight direction while lifting ivory plaster and white clothing out of brown shadow.
- [fixed / the first v108 indirect-light pass became too flat] The first draft used a `0.46` ceiling return, `0.25` rear return and softer `14 / 40` VSM shadow. The final pass restores a stronger neutral key, reduces indirect energy to `0.31 / 0.18`, tightens the shadow to `10 / 28` and retains `0.46` contact AO; cast and furniture regain grounded form without returning to the v107 yellow cast.
- [improved / floor, plaster and pale cloth shared one warm value] Civic terrazzo moves to a cooler honed base with controlled scanned bump and stronger environment response; shell plaster moves to layered warm ivory values with lower bump amplitude. Wood, fabric, paper, mineral and brass continue to retain separate per-vertex roughness/metalness or scanned maps after batching.
- [improved / people floated above the pale rug] Resting civic contact footprints increase from `0.22 / 0.84` opacity/scale to `0.30 / 0.90`; walking remains softer at `0.24 / 0.80`. This is a real floor-plane contact cue that follows each actor, not a camera-facing character shadow.
- [improved / grading exaggerated yellow highlights and edge darkening] The civic grade uses a gentler contrast shoulder, reduced warm highlight addition and restrained vignette. Sun dapples remain visible but no longer carry the entire lighting hierarchy.
- [checked / the richer lighting does not increase geometry cost] Two scene-level bounce sources and revised PBR parameters add no mesh draw calls or triangles. All four desktop/phone views remain inside the `180 / 450k` and `110 / 250k` gates.

### Required fidelity surfaces and findings

- [checked][fonts and typography] HUD font family, Chinese hierarchy, optical weights, one-line truncation and action labels remain readable at desktop and portrait sizes; the lighting/material change does not alter the UI layer.
- [improved][spacing and layout rhythm] Light now reinforces the portal foreground, listening-circle middle ground and furnished back wall without changing metre-space staging, interaction anchors, safe camera composition or clear walk routes.
- [improved][colors and visual tokens] Warm ivory plaster, neutral terrazzo, teal textile, oak/walnut and restrained brass separate more clearly. The implementation no longer relies on one yellow source to create warmth.
- [improved][image quality and asset fidelity] Scanned terrazzo/wood/fabric responses, PMREM reflections, physical roughness/metalness, real shadow receivers, VSM sun shadow, GTAO contact and layered local lights remain attached to the live 3D world through movement and orbit.
- [checked][copy and content] Location, story-memory title, current target and four listening actions remain coherent with the visible civic sequence.
- [P1][light transport remains below the offline source] The source still has denser bounced colour, softer multi-bounce penumbrae, localized window caustics and finer exposure roll-off than a compact real-time WebGL light rig.
- [P1][environment geometry and material density remain below the source] The implementation has a playable authored layout, but the source contains more bespoke joinery, textiles, glass thickness, micro-props, bevel resolution and per-object texture variation.
- [P1][character finish remains below the source] v107 facial and hair layering survives the new lighting, while production facial deformation, hair-root density and garment seam/weight detail remain visibly simpler.

### Gate result

v108 materially improves the room-wide first read: light is more neutral and layered, pale surfaces retain separation, character contact is stronger and the same physical response survives movement, orbit and mobile LOD at unchanged geometry cost. The exact same-size comparison is closer in exposure and material readability, but the selected offline frame remains ahead in multi-bounce light transport, environmental asset density and character surface finish.

final result: blocked

Blocker: offline-quality multi-bounce lighting and exposure roll-off, denser bespoke room geometry/material variation, and production-level character face/hair/garment authoring remain visibly below the selected reference.

## 2026-07-25 reference-fidelity v107 facial layering and grouped-hair gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`, RGB).
- Final desktop implementation: `tmp/v107-final-yaw0.png` (`1672 × 941` CSS/pixels, device scale factor `1`, WebGL internal pixel ratio `1.2`, identical public-plaza listening state).
- Mandatory full-view comparison: `tmp/reference-vs-v107-full.png`; focused cast comparison: `tmp/reference-vs-v107-cast-focus.png`; implementation delta: `tmp/v106-vs-v107-cast-focus.png`.
- Full 3D orbit evidence: `tmp/v107-final-yaw90.png` and `tmp/v107-final-yaw180.png`. The same layered eyes, volumetric lips and grouped hair remain perspective-lit, depth-tested and attached to the complete actors rather than camera-facing substitutes.
- Responsive evidence: `tmp/v107-final-mobile.png` (`390 × 844`, device scale factor `1`, intentional three-character phone LOD).
- Runtime evidence: desktop opening `171 / 280,808`, side `174 / 291,916`, reverse `175 / 298,044`; mobile `100 / 239,480`. The player walked `4.61m`, rotated the real camera `65.3°`, retained vertex-driven eyelid closure, passed all `26` metre-space layouts and desktop/mobile flow, and completed `78` atomic transitions without runtime error.

### Comparison history, fixes and post-fix evidence

- [fixed / eyes read as one dark bead without readable anatomy] Eye volume v3 adds independently modeled warm sclera, role-coloured iris ring, darker iris core, pupil, restrained glint and warm inner canthus. The existing weighted upper and lower eyelids continue to close over this stack instead of flattening the complete eye.
- [improved / facial colour and mouth volume were harsher than the reference] Role skin palettes move toward lighter warm neutrals, and mouth morph v4 / lip volume v2 increase the continuous upper/lower lip thickness and widen the contour without adding a detached lower-lip bead.
- [improved / hair read as repeated round tubes] Crown ribbons, fringe, face frames, back locks, ponytail layers, braid knots, temple waves and bob nape now use role-specific flattened oval sections and narrower style caps. This produces grouped planar locks that remain true 3D geometry through the side and reverse orbit.
- [fixed / the first facial palette pass made the facilitator and mediator irises too bright] Their iris rings were darkened before the final capture, restoring eye contact without a startled teal halo.
- [checked / facial detail remains Web-sized] Total civic GLBs are `7.10 MB`; every role remains below `2 MiB`. The opening frame remains at `171` draw calls and all desktop/mobile triangle gates remain satisfied.

### Required fidelity surfaces and findings

- [checked][fonts and typography] HUD family, Chinese hierarchy, optical weights, one-line truncation and action labels remain stable at desktop and portrait sizes; the character-asset changes do not alter the UI layer.
- [improved][spacing and layout rhythm] Narrower hair caps and flatter locks reduce repeated balloon-like silhouettes inside the listening circle while preserving actor roots, interaction anchors, metre-space paths and camera-safe framing.
- [improved][colors and visual tokens] Lighter warm skin, darker iris cores and stronger hair highlight separation move the cast toward the reference while retaining the established teal, green, oatmeal, coral, oak, plaster, terrazzo and brass hierarchy.
- [improved][image quality and asset fidelity] Facial anatomy and hair grouping are authored GLB meshes with real depth, material response and skeleton/head attachment. They survive movement plus `0°`, `90°`, `180°` views; no sprite, billboard, CSS avatar or camera-facing cover is used.
- [checked][copy and content] Location, story-memory title, interaction target and four listening actions remain coherent with the visible civic sequence.
- [P1][facial surface construction remains below the source] The reference still has finer eyelid rims, cheek compression, nose-to-mouth planes, lip-edge definition, brow deformation and expression weighting than the runtime cast.
- [P1][hair construction remains below the source] The new grouped locks remove much of the tube repetition, but root breakup, strand density, silhouette flyaways and anisotropic material variation remain visibly simpler.
- [P1][room dressing, materials and indirect light remain below the source] The implementation is a coherent playable room, while the selected offline frame still has denser bespoke props, softer contact penumbrae, richer bounce colour and more local surface variation.

### Gate result

v107 replaces the remaining single-layer eye shortcut with readable volumetric anatomy, strengthens the continuous lip surface and converts repeated round locks into flatter grouped hair while preserving skeleton animation, movement, physics, orbit, mobile LOD and performance gates. The literal same-size comparison is closer in facial readability and character separation, but it does not yet equal the selected offline image's face topology, hair authoring or light transport.

final result: blocked

Blocker: source-level facial topology and expression weighting, denser root-authored hair with material variation, bespoke prop/material density and offline-quality indirect-light construction remain visibly below the selected reference.

## 2026-07-25 reference-fidelity v106 authored garment topology gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`, RGB).
- Final desktop implementation: `tmp/v106-final-yaw0.png` (`1672 × 941` CSS/pixels, device scale factor `1`, WebGL internal pixel ratio `1.2`, identical public-plaza listening state).
- Mandatory full-view comparison: `tmp/reference-vs-v106-full.png`; focused cast comparison: `tmp/reference-vs-v106-cast-focus.png`; implementation delta: `tmp/v105-vs-v106-cast-focus.png`.
- Full 3D orbit evidence: `tmp/v106-final-yaw90.png` and `tmp/v106-final-yaw180.png`. The same bone-weighted trousers and sleeves, seven-ring skirts, tailored panels and complete actors remain perspective-lit, depth-tested and physically staged.
- Responsive evidence: `tmp/v106-final-mobile.png` (`390 × 844`, device scale factor `1`, intentional three-character phone LOD).
- Runtime evidence: desktop opening `171 / 278,376`, side `174 / 289,484`, reverse `175 / 295,612`; mobile `100 / 237,440`. The player walked `4.57m`, rotated the real camera `65.3°`, retained the garment topology contract throughout the walk, passed all `26` metre-space layouts and desktop/mobile flow, and completed `78` atomic transitions without runtime error.

### Comparison history, fixes and post-fix evidence

- [fixed / trousers and sleeves retained a circular mannequin cross-section] Garment topology v1 reshapes the continuously skinned arm and leg meshes into rounded superellipses with pressed fronts, restrained rear fall and actual side-seam planes. The front crease changes direction gradually along each bone, so cloth flow is part of the deforming mesh rather than a line placed over it.
- [fixed / skirt silhouettes repeated like rigid cones] Both civic skirts now use seven vertical rings, alternating deep/shallow channels, asymmetric radial release and a non-uniform hem drop. A real waistband and side-release folds live under the existing skirt motion pivot.
- [improved / vests, dress bodices and cardigans read as shallow slabs] Tailored panels move from `5 × 7` to `7 × 9` authored samples, adding separate chest bow, waist tension, opening-edge roll and hip release while remaining one mergeable garment surface.
- [fixed / first permanent-fold implementation exceeded the desktop draw-call gate] Separate standing wrinkle ribbons reached `183–187` calls. Their flow was folded into the skinned limb topology, returning the final three desktop views to `171–175` calls without losing true 3D cloth section or movement continuity.
- [checked / garment construction remains Web-sized] Total civic GLBs are `6.94 MB`; every role remains below `2 MiB`. The new geometry adds only `3,008` triangles in the opening frame and `1,712` in the phone LOD relative to v105.

### Required fidelity surfaces and findings

- [checked][fonts and typography] HUD family, Chinese hierarchy, optical weights, one-line truncation and action labels remain stable at desktop and portrait sizes; the character-asset change does not leak into the UI layer.
- [improved][spacing and layout rhythm] More controlled trouser, sleeve, cardigan and skirt silhouettes improve separation inside the four-person circle without shifting actor roots, interaction anchors, metre-space paths or camera-safe framing.
- [checked][colors and visual tokens] Existing teal, green, oatmeal, coral, oak, plaster, terrazzo and brass tokens remain intact. New cloth topology inherits the existing fabric mask, roughness hierarchy and role palette instead of adding procedural accent colours.
- [improved][image quality and asset fidelity] Clothing construction is real GLB topology tied to the skeleton and skirt pivot. It survives movement plus `0°`, `90°`, `180°` views; no billboard, sprite, CSS avatar or camera-facing cover is used.
- [checked][copy and content] Location, story-memory title, interaction target and four listening actions remain coherent with the visible civic scene.
- [P1][garment surface resolution still remains below the source] The reference carries production retopology, sewn panel thickness, cargo seams, layered hems, contact folds and hand-painted wrinkle weighting at a finer scale than the runtime cast.
- [P1][facial and hair fidelity remains below the source] Current volumetric eyes/lips and layered hair survive orbit, but inner-corner anatomy, cheek compression, lip contour, strand density and material variation remain visibly simpler.
- [P1][room dressing and indirect light remain below the source] The implementation is a coherent playable room, while the selected offline frame still has denser bespoke props, softer contact penumbrae, richer bounce colour and more local material microvariation.

### Gate result

v106 closes the largest remaining garment-system shortcut: trousers and sleeves now have authored cut-cloth sections and flowing creases inside their bone-weighted topology; skirts and tailored outerwear receive materially richer drape without exceeding draw-call, triangle, download or mobile gates. The literal same-size comparison is improved in clothing construction, but the selected offline image remains ahead in sewn detail, facial/hair finish and light transport.

final result: blocked

Blocker: source-level sewn garment retopology and painted wrinkle weights, finer facial and layered-hair authoring, bespoke prop/material density and offline indirect-light construction remain visibly below the selected reference.

## 2026-07-25 reference-fidelity v105 contoured body and garment-continuity gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`, RGB).
- Final desktop implementation: `tmp/v105-final-yaw0.png` (`1672 × 941` CSS/pixels, device scale factor `1`, WebGL internal pixel ratio `1.2`, identical public-plaza listening state).
- Mandatory full-view comparison: `tmp/reference-vs-v105-full.png`; focused character comparison: `tmp/reference-vs-v105-cast-focus.png`; implementation delta: `tmp/v104-vs-v105-cast-focus.png`.
- Full 3D orbit evidence: `tmp/v105-final-yaw90.png` and `tmp/v105-final-yaw180.png`. The same contoured torsos, bone-weighted shoulder overlaps, pelvis shells, garments and complete actors remain perspective-lit and depth-tested.
- Responsive evidence: `tmp/v105-final-mobile.png` (`390 × 844`, device scale factor `1`, intentional three-character phone LOD).
- Runtime evidence: desktop opening `171 / 275,368`, side `174 / 286,476`, reverse `175 / 292,604`; mobile `100 / 235,728`. The player walked `4.73m`, rotated the real camera `65.3°`, retained vertex-driven eyelid closure, passed all `26` metre-space layouts and desktop/mobile flow, and completed `78` atomic transitions without runtime error.

### Comparison history, fixes and post-fix evidence

- [fixed / every torso was still a scaled UV-sphere capsule] Body identity v4 replaces the point-tapered sphere with one closed, asymmetric ring shell containing a lower abdomen, waist, rib cage, chest, shoulder shelf and neck transition. Front and back depth are independently authored, so the body keeps a designed silhouette through the side and reverse orbit.
- [fixed / upper arms read as balls or tubes attached beside the torso] The continuous skinned arm gains two bone-weighted upper rings that overlap the real shoulder shelf. They follow the existing shoulder skeleton through walk, gesture and orbit instead of using a camera-facing cover.
- [fixed / trousers began from a round diaper-like ellipsoid] Traveler and listener now use a five-ring tailored pelvis shell with separate front/back depth and a controlled transition into the two skinned legs.
- [improved / heads remained one proportion larger than the selected cast] All four complete head hierarchies shrink by roughly `8%` while their centres rise to preserve the `1.72m` top height. Hair, ears, eyes, lips, morphs and gaze remain one coherent hierarchy; the focused comparison shows a closer head-to-shoulder and head-to-height ratio.
- [improved / role profiles repeated narrow torsos with thick tubular sleeves] Listener, facilitator and mediator receive broader chest/shoulder rhythms and slimmer role-specific arm profiles; the player keeps a sturdier traveler silhouette with a less inflated limb width.
- [fixed / the first shoulder-cap implementation exceeded the orbit draw-call gate] Two separate moving caps per actor reached `182` draw calls at `90°`. Their volume was folded into the existing skinned arm mesh, restoring the final orbit to `174` calls while retaining the overlap.
- [checked / higher body fidelity reduces rather than increases the Web payload] The simpler contoured base shells reduce total civic character assets from `7.47 MB` to `6.86 MB`; all four GLBs remain below `2 MiB`.

### Required fidelity surfaces and findings

- [checked][fonts and typography] HUD family, weight, Chinese hierarchy, one-line truncation and action labels remain readable at the normalized desktop and portrait viewports. No body-system change leaks into the stable UI layer.
- [improved][spacing and layout rhythm] Smaller heads and broader shoulder shelves move the cast toward the reference's editorial proportion while preserving the four-person listening circle, metre-space staging, interaction anchors and foreground/middle/background composition.
- [checked][colors and visual tokens] The established skin, dark hair, oatmeal, green, teal, oak, plaster, terrazzo and brass hierarchy remains intact. New geometry inherits the existing scanned-fabric mask and does not add unrelated colours or screen-space effects.
- [improved][image quality and asset fidelity] Torso, shoulder and pelvis continuity are real closed GLB geometry and remain coherent in the `0°`, `90°`, `180°`, movement and portrait captures. No sprite, billboard, CSS avatar or camera-specific substitute is used.
- [checked][copy and content] Location, scene-memory title, current target and listening actions remain coherent with the visible civic sequence.
- [P1][character surface construction remains below the source] Silhouette and body continuity are closer, but the reference still has production garment topology, stitched seams, layered hems, wrinkle flow and hand-painted deformation weights.
- [P1][facial and hair detail remain below the source] Independent lids, volumetric lips and corrected head ratio survive orbit, while inner-eye anatomy, cheek compression, lip edge definition, strand density and hair material variation remain visibly simpler.
- [P1][room material and indirect-light richness remain below the source] Runtime architecture is spatially functional and rotatable; the selected offline image still has denser bespoke dressing, softer contact penumbrae, richer bounce colour and finer material microvariation.

### Gate result

v105 removes the dominant capsule-body construction: the cast now uses designed torso anatomy, bone-weighted shoulder continuity, tailored pelvis volume and reference-closer head proportions while preserving a real skeleton, movement, physics, full orbit and mobile LOD. The same-size source comparison is materially closer in silhouette and character rhythm, but it remains below the reference in production garment topology, painted deformation, facial/hair authoring and offline material/light transport.

final result: blocked

Blocker: production garment topology and weight painting, finer facial and layered-hair authoring, bespoke material variation and source-level indirect-light construction remain visibly below the selected reference.

## 2026-07-25 reference-fidelity v104 volumetric lips and vertex-driven eyelid gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`, RGB).
- Final desktop implementation: `tmp/v104-final-yaw0.png` (`1672 × 941` CSS/pixels, device scale factor `1`, WebGL internal pixel ratio `1.2`, identical public-plaza listening state).
- Mandatory full-view comparison: `tmp/reference-vs-v104-full.png`; focused comparison: `tmp/reference-vs-v104-cast-focus.png`; implementation delta: `tmp/v103-vs-v104-cast-focus.png`.
- Facial motion evidence: `tmp/v104-open-vs-blink-final.png` compares the settled open-eye state with the forced vertex-eyelid closure state. This QA state drives the same live shader uniforms as gameplay blinking.
- Full 3D orbit evidence: `tmp/v104-final-yaw90.png` and `tmp/v104-final-yaw180.png`; responsive evidence: `tmp/v104-final-mobile.png` (`390 × 844`, intentional three-character phone LOD).
- Runtime evidence: desktop opening `171 / 281,448`, side `174 / 292,556`, reverse `175 / 298,684`; mobile `100 / 240,236`; forced-blink capture `171 / 281,448`. The player walked `4.61m`, rotated the camera `65.3°`, verified all four actors' live eyelid closure, passed all `26` metre-space layouts and desktop/mobile flow, and completed `78` atomic transitions without browser runtime error.

### Comparison history, fixes and post-fix evidence

- [fixed / blinking flattened the entire eyeball like a rubber sticker] Eye volume v2 preserves the spherical eyeball and deforms separately weighted upper and lower eyelid vertices over it. The runtime reports live uniform readiness plus non-zero upper/lower lid weights for every role, and the forced-blink evidence shows real aperture closure instead of eye-object scaling.
- [fixed / the lower lip was a detached bead] Mouth morph v3 replaces the separate lower-lip object with one concave four-row lip surface. The cupid bow, recessed seam, lower cushion and five acting morphs now share one continuous mesh and material response.
- [improved / mouth volume read as a flat coloured mark] Lip volume v1 shades the authored local depth into a restrained crease and cushion response while preserving role-specific smile, speech, concern, attention and social-asymmetry blends.
- [fixed / eyelid QA could regress without a visible proof state] The capture path now accepts a deterministic `qaBlink=1` state, and the exploration verifier asserts `uniformBlink >= 0.9` across player, listener, facilitator and mediator after a real reload.
- [improved / facial refinement increased complexity] Removing the detached lower lip reduces settled desktop draw calls by five relative to v103. All four GLBs remain below `2 MiB`; total civic character assets are `7.47 MB`.

### Required fidelity surfaces and findings

- [checked][fonts and typography] HUD family, weights, Chinese hierarchy, line breaks and action labels remain readable at desktop and portrait sizes; the character-only upgrade does not disturb the stable UI contract.
- [checked][spacing and layout rhythm] The central four-person conflict, foreground work surface, middle-ground story circle and background civic landmark retain the source-aligned composition. No face or eyelid change moves actor staging, interaction anchors or the camera-safe area.
- [checked][colors and visual tokens] Skin, dark hair, oatmeal outerwear, green cloth, oak, plaster, teal textile and brass remain separated. The new lip shading uses authored surface depth rather than an unrelated colour token or screen-space overlay.
- [improved][image quality and asset fidelity] Eyes retain true volume while lids close over them; lips form a single shaped surface with a recessed seam. Both changes are lit, depth-tested and continuous through `0°`, `90°`, `180°`, movement and portrait LOD.
- [checked][copy and content] Location, scene-memory title, current target and all four listening actions remain coherent with the visible public-room sequence.
- [P1][character anatomy and garment construction remain below the source] Runtime bodies preserve metre scale, skeleton motion and corrective volume, but the source still has more resolved shoulder/hip anatomy, garment topology and hand-painted weighting.
- [P1][facial performance remains below the source] Volumetric lips and independent lids remove two synthetic cues; the reference still carries finer lid thickness, inner-corner anatomy, cheek compression, lip edge topology and authored gaze timing.
- [P1][hair, material and light transport remain below the source] Face framing and ribbon response remain coherent through orbit, while strand density, painted roughness, contact penumbrae and multi-bounce colour remain visibly simpler than the selected offline frame.

### Gate result

v104 replaces two conspicuously synthetic facial shortcuts with physically coherent, runtime-driven 3D systems: eyelids now close independently over volumetric eyes, and the mouth is one morphable concave lip surface with depth-aware crease shading. The build is smaller and cheaper than v103, and the new deterministic blink proof protects the result in regression tests. The literal same-size comparison still does not reach the reference's production anatomy, garment construction, strand density or offline material/light transport.

final result: blocked

Blocker: production character topology and painted weighting, finer facial anatomy and acting, denser layered hair construction, bespoke surface variation and source-level indirect-light construction remain below the selected reference.

## 2026-07-25 reference-fidelity v103 asymmetric facial acting and face-framing hair gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`, RGB).
- Final desktop implementation: `tmp/v103-final-yaw0.png` (`1672 × 941` CSS/pixels, device scale factor `1`, WebGL internal pixel ratio `1.2`, identical public-plaza listening state).
- Mandatory full-view comparison: `tmp/reference-vs-v103-full.png`; both native frames are adjacent at identical scale. Focused evidence is `tmp/reference-vs-v103-cast-focus.png`; `tmp/v102-vs-v103-cast-focus.png` records the implementation delta.
- Full 3D orbit evidence: `tmp/v103-final-yaw90.png` and `tmp/v103-final-yaw180.png`. The same head morphs, eyes, hair volumes, bodies and room assets remain lit and depth-tested through the real perspective orbit.
- Responsive evidence: `tmp/v103-final-mobile.png` (`390 × 844`, device scale factor `1`, intentional three-character phone LOD).
- Runtime evidence: desktop opening `176 / 283,288`, side `178 / 294,396`, reverse `179 / 300,524`; mobile `100 / 241,616`. The player walked `4.53m`, rotated the camera `65.3°`, passed all `26` metre-space layouts and desktop/mobile flow, and completed `78` atomic transitions without browser runtime error.

### Comparison history, fixes and post-fix evidence

- [fixed / exported eye rest pose was discarded] Runtime previously replaced each authored eye pivot rotation with gaze or zero. It now composes micro-saccade and social gaze over the exported rest rotation, so role-specific lid/eye direction survives animation and orbit.
- [improved / expressions were bilaterally mirrored] Sculpt v58 adds a fifth `SocialAsymmetry` morph to the head and closed mouth. Player, listener, facilitator and mediator blend different cheek, lower-lid and mouth-corner biases, reported in settled runtime evidence rather than baked into one camera view.
- [improved / crown cap ended abruptly beside the face] Each role gains two real front-to-temple `FaceFrameLock` volumes that bridge crown, fringe and side silhouette. They are parented to `HeadPivot`, batched on desktop and removed by the intentional phone micro-detail LOD.
- [improved / hair response looked like high-frequency shader noise] Actor material hierarchy v10 replaces the dominant thin stripe with a broader ribbon response plus a restrained micro-strand component. The focused v102/v103 comparison shows calmer large-form highlights.
- [fixed / fifth morph exceeded the strict character download budget] Head topology was retuned from `48 × 34` to `44 × 30`, preserving the gameplay silhouette while keeping all four GLBs below `2 MiB`; total civic character assets are `7.60 MB`.
- [checked / facial and hair refinement remains physically coherent and within budget] All settled desktop views remain `176–179` draw calls and `283,288–300,524` triangles; portrait mobile remains `100 / 241,616`.

### Required fidelity surfaces and findings

- [checked][fonts and typography] HUD family, optical weights, Chinese hierarchy, single-line wrapping and action labels remain legible at desktop and portrait sizes; no reference-fidelity change was attempted in the stable UI layer.
- [checked][spacing and layout rhythm] The source and implementation share a central four-person story circle, foreground work surface, middle-ground conflict and background civic landmark. The new face-side volumes do not shift interaction anchors, metre-space staging or camera-safe composition.
- [checked][colors and visual tokens] Skin, dark hair, oatmeal outerwear, green cloth, oak, plaster, teal textile and brass remain separated by the existing material hierarchy; the v10 hair sheen reduces local highlight noise without palette drift.
- [improved][image quality and asset fidelity] Eyes preserve authored direction, faces carry role-specific asymmetry and hair now frames the cheek-to-temple transition. These are genuine GLB/morph/shader changes with side and reverse continuity, not sprites, cards or camera-facing replacements.
- [checked][copy and content] Location, scene-memory title, interaction target and four listening actions remain coherent with the visible public-room sequence on desktop and mobile.
- [P1][facial anatomy and performance remain below the source] The fifth morph breaks mirrored expression, but the reference still has finer eyelid thickness, lip topology, cheek compression, gaze specificity and production facial weighting.
- [P1][hair construction remains below the source] Face framing and broad ribbon highlights improve the silhouette; strand grouping, flyaway rhythm, layered occlusion and painted roughness remain materially simpler.
- [P1][character materials and light transport remain below the source] Runtime fabric and hair hierarchy is coherent, while the selected offline frame retains denser bespoke surface variation, softer contact penumbrae and richer multi-bounce colour.

### Gate result

v103 closes two concrete character-presentation defects: authored eye orientation is no longer erased, and social expression now has role-specific asymmetry across the head, mouth and eye aperture. Real face-framing hair volumes and calmer ribbon highlights improve the cast without breaking movement, full orbit, mobile LOD, asset or render budgets. The same-size source comparison is still visibly short of production facial anatomy, dense hair authoring and offline material/light transport.

final result: blocked

Blocker: production facial topology and weighting, denser layered hair construction, painted character materials and source-level indirect-light construction remain below the selected reference.

## 2026-07-25 reference-fidelity v102 proximal-volume, skirt-flex and role-hand gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Final desktop implementation: `tmp/v102-final-yaw0.png` (`1672 × 941` CSS/pixels, device scale factor `1`, WebGL internal pixel ratio `1.2`, identical public-plaza listening state).
- Mandatory full-view comparison: `tmp/reference-vs-v102-full.png`; source and runtime are adjacent at identical scale. Focused evidence is `tmp/reference-vs-v102-cast-focus.png`, with `tmp/v101-vs-v102-cast-focus.png` recording the iteration delta.
- Full 3D orbit evidence: `tmp/v102-final-yaw90.png` and `tmp/v102-final-yaw180.png`; shoulder/hip volume, role-authored hands and skirt geometry remain coherent through the real perspective orbit.
- Responsive evidence: `tmp/v102-final-mobile.png` (`390 × 844`, device scale factor `1`, intentional three-character phone LOD).
- Runtime evidence: desktop opening `175 / 284,856`, side `178 / 295,964`, reverse `179 / 302,092`; mobile `100 / 243,464`. The player walked `4.37m`, rotated the perspective camera `65.3°`, passed all `26` metre-space layouts and desktop/mobile flow, and completed `78` atomic transitions without runtime error.

### Comparison history, fixes and post-fix evidence

- [fixed / shoulder and hip rings narrowed under bone rotation] Both continuous skinned limb meshes now receive bend-driven proximal-volume correction inside their existing vertex shaders. Shoulder and hip circumference expands only around the rotating joint, with no extra mesh, draw call, collider or camera-specific replacement.
- [fixed / skirt moved as one rigid cone] The existing waist spring still supplies broad inertial follow-through, while a second GPU deformation bends only the lower hem, adds delayed lateral release and retains the planted waist. Facilitator and mediator expose `mirrorlife-civic-skirt-flex-v1` in runtime evidence.
- [improved / facilitator repeated the same fist on both sides of the notebook] Hand contract v6 separates a supporting hand from a guiding hand with different finger curl, splay, thumb opposition and wrist orientation. The prop remains inside the articulated elbow/hand hierarchy through orbit.
- [improved / listener leaned like a hinged mannequin] Animation contract v12 reduces the role's torso and head roll while preserving the asymmetrical open hands and attention toward the social circle. The v101/v102 crop shows a calmer, more upright silhouette.
- [checked / higher-fidelity deformation does not cost the room budget] Proximal and skirt corrections run in the existing arm, leg and skirt draw calls. Every settled desktop angle remains `175–179 / 284,856–302,092`; portrait mobile remains `100 / 243,464`.

### Required fidelity surfaces and findings

- [checked][fonts and typography] HUD font choice, optical hierarchy, line breaks and Chinese copy are unchanged and remain readable at desktop and portrait sizes.
- [improved][spacing and layout rhythm] The more upright listener and clearer facilitator hand silhouette reduce local character overlap without moving the story circle, interaction anchors, doorway or camera-safe composition.
- [checked][colors and visual tokens] All deformation uses existing garment vertex colours and material response. No new palette, saturation or semantic-token drift appears.
- [improved][image quality and asset fidelity] Shoulder/hip bends retain more mass; the skirt lower edge can flex independently; the notebook interaction uses role-specific fingers. These are genuine lit, depth-tested 3D changes and persist at `0°`, `90°` and `180°`.
- [checked][copy and content] Location, scene memory and all four listening actions remain consistent with the visible public-room interaction.
- [P1][body construction remains below the source] The shader correctives improve motion, but the source still has more anatomical shoulder blades, clavicle/hip planes, hand-painted weights and complete garment topology.
- [P1][facial and hair acting remain below the source] Runtime faces and hair survive orbit and animation, yet the selected frame retains substantially finer eyelids, lips, gaze asymmetry, strand grouping and role-specific expression.
- [P1][surface and light transport remain below the source] The room keeps coherent oak, plaster, fabric and terrazzo bands, while the reference has denser bespoke texture variation, softer contact penumbrae and richer multi-bounce colour.

### Gate result

v102 materially improves deformation during movement without spending additional draw calls: shoulders and hips retain volume, skirt hems flex beneath the waist spring, the facilitator owns two distinct notebook-hand shapes, and the listener no longer reads as a strongly tilted mannequin. The same-size source comparison remains visibly short of production character anatomy, complete cloth topology, facial/hair acting and offline light transport.

final result: blocked

Blocker: production retopology and painted weights, complete garment and hand deformation, remaining facial/hair authoring, and source-level material/indirect-light construction remain below the selected reference.

## 2026-07-25 reference-fidelity v101 bend-driven joint volume and cloth-compression gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Final desktop implementation: `tmp/v101-final-yaw0.png` (`1672 × 941` CSS/pixels, device scale factor `1`, WebGL internal pixel ratio `1.2`, identical public-plaza story state).
- Mandatory full-view comparison: `tmp/reference-vs-v101-full.png`; source and runtime are adjacent at identical scale. Focused comparisons are `tmp/reference-vs-v101-cast-focus.png` and `tmp/v100-vs-v101-cast-focus.png`.
- Full 3D orbit evidence: `tmp/v101-final-yaw90.png` and `tmp/v101-final-yaw180.png`; the same articulated actors, clothing carriers and room assets remain coherent through the perspective orbit.
- Responsive evidence: `tmp/v101-final-mobile.png` (`390 × 844`, device scale factor `1`, intentional three-character phone LOD).
- Runtime evidence: desktop opening `175 / 284,856`, side `178 / 295,964`, reverse `179 / 302,092`; mobile `100 / 243,464`. The player walked `4.77m`, rotated the real camera `65.3°`, passed all `26` physical layouts and desktop/mobile flow, and completed `78` atomic transitions without runtime error.

### Comparison history, fixes and post-fix evidence

- [fixed / sharp bends lost volume at elbows and knees] Sculpt v56 adds four authored compression pivots per character and hidden elbow/knee volume carriers. Runtime derives correction strength from each joint's real bend angle, expands across the crease and compresses along the limb instead of leaving a uniform tube.
- [improved / clothing stayed equally smooth through every pose] Sleeve and trouser fold groups now live under the corrective pivots. Their width, depth and outside-crease offset respond continuously to walk, idle and listen clips while remaining parented to the actual articulated joint.
- [fixed / live corrective pivots initially exceeded the desktop draw-call gate] Corrective carriers now become visible only after a meaningful bend. Sub-threshold knee geometry no longer spends draw calls while fully hidden inside the limb; the three settled desktop angles finish at `175–179`, below the `180` hard ceiling.
- [fixed / phone LOD would have paid for sub-pixel fold geometry] Mobile removes the corrective volumes and micro-fold meshes before batching. It remains `100 / 243,464`, below the `110 / 250k` mobile ceiling.
- [checked / correction is not a camera-facing visual trick] The volume and compression meshes are exported GLB geometry with side/back continuity, read by the same animation pose that drives the shared skeleton, and remain depth-tested and lit through real movement and orbit.

### Required fidelity surfaces and findings

- [checked][fonts and typography] No HUD type, hierarchy, wrapping or Chinese copy changed. Desktop and portrait controls remain legible and retain the prior truncation contract.
- [checked][spacing and layout rhythm] Story-circle staging, foreground desk, middle-ground cast and background portal remain stable. Corrective activation does not shift actor roots, interaction anchors or camera-safe composition.
- [checked][colors and visual tokens] Corrective meshes inherit the authored garment/skin vertex colours and the same PBR material hierarchy; no new saturation or token drift is introduced.
- [improved][image quality and asset fidelity] Elbows and sleeves no longer collapse as severely under the notebook, thoughtful-hand and listening poses. The static opening delta is intentionally restrained; the largest improvement appears during walk/run and strong role-authored bends.
- [checked][copy and content] Location, story-memory title, current action and mobile controls still describe the selected listening scene without placeholder or contradictory text.
- [P1][production deformation remains below the source] Bend-driven carriers improve volume truth, but the source still has cleaner anatomical topology, painted blend weights, shoulder/hip correctives and cloth wrinkles distributed across complete garments.
- [P1][facial, hand and hair acting remain below the source] The live cast retains real eyes, morphs, fingers and crown volumes; gaze asymmetry, hand posing, strand density and cheek/lip deformation remain visibly simpler.
- [P1][offline material and indirect light remain below the source] Runtime maintains physical material separation and a coherent portal key, while the selected image retains richer bounced colour, contact penumbrae and surface microvariation.

### Gate result

v101 closes a real deformation-system gap: every desktop actor now owns bend-angle-driven elbow/knee volume and garment-compression correctives, while mobile keeps the lightweight LOD and every settled orbit stays inside budget. The literal same-size comparison and dynamic physical tests are improved, but the reference remains visibly ahead in production topology/weights, complete cloth authoring, facial/hand acting and offline light transport.

final result: blocked

Blocker: production character retopology and painted weights, shoulder/hip/full-garment corrective shapes, remaining facial/hand/hair authoring, and source-level indirect-light construction remain below the selected reference.

## 2026-07-25 reference-fidelity v100 facial hierarchy, hair volume and story-camera gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`, source density normalized to the same native pixel canvas).
- Final desktop implementation: `tmp/v100-final-yaw0.png` (`1672 × 941` CSS/pixels, device scale factor `1`, WebGL internal pixel ratio `1.2`, identical public-plaza story state).
- Mandatory full-view comparison: `tmp/reference-vs-v100-full.png`; both complete native-size frames are adjacent without scaling.
- Mandatory focused comparison: `tmp/reference-vs-v100-cast-focus.png`; the four-person story circles are cropped into one review image so face shape, eye hierarchy, hair grouping, footwear and social pose can be judged directly.
- Before/after evidence: `tmp/v99-vs-v100-full.png` and `tmp/v99-vs-v100-cast-focus.png`.
- Full 3D orbit evidence: `tmp/v100-final-yaw90.png` and `tmp/v100-final-yaw180.png`. The same characters, expressions, hair volumes and room assets remain coherent through the real perspective orbit.
- Responsive evidence: `tmp/v100-final-mobile.png` (`390 × 844`, device scale factor `1`, three-character phone LOD).
- Runtime evidence: desktop opening `167 / 284,056`, side `170 / 295,164`, reverse `171 / 301,292`; mobile `100 / 243,624`. The player walked `4.89m`, rotated the perspective camera `65.3°`, passed all `26` physical layouts and desktop/mobile scene flow, and completed `78` atomic room transitions without runtime error.

### Comparison history, fixes and post-fix evidence

- [improved / faces remained circular and toy-like] Sculpt v55 strengthens the lower-face taper, broadens the actual cheek plane and extends the chin inside the existing head/capsule contract. The focused post-fix crop shows a clearer cheek-to-jaw transition without enlarging the complete head.
- [fixed / brows and lids disappeared after perspective projection] Upper-eye contours, brows and the closed mouth receive a measured physical-width increase; the pupil grows while the catchlight shrinks. Eyes now read as illustrated attention rather than two isolated coloured beads.
- [improved / hair detail existed only as shader noise and hairline tubes] Four shallow `HairRibbon` volumes travel over every crown, the facilitator ponytail gains a three-lock fan and the mediator gains real temple waves. These are lit, depth-tested volumes attached to `HeadPivot`, not screen-space marks.
- [fixed / added strand volume threatened the phone geometry ceiling] Phone LOD removes `HairRibbon_*` before batching; desktop retains the authored crown layer. Mobile finishes at `243,624` triangles, still below the `250,000` hard limit.
- [improved / pale cardigans clipped into flat white bars] Facilitator and mediator garments move toward warmer oatmeal values, preserving the source's cream/green material hierarchy under the portal key. Their boot scale drops from `1.09` to `1.04`, reducing the oversized toy-foot cue.
- [improved / the cast was still visually secondary to the room] The desktop hero orbit moves from `5.42m` to `5.24m` while side/reverse safety arcs remain active. Character scale rises without sacrificing the portal, hero wall or lounge navigation landmarks.
- [improved / faces and feet lacked environment contact] Actor-only facial fill rises from `0.62` to `0.68`; the soft footprint grows from `0.66 × 0.36m / 0.32` opacity to `0.72 × 0.40m / 0.36`. The player and witnesses remain grounded without a hard graphic oval.

### Required fidelity surfaces and findings

- [checked][fonts and typography] The compact Chinese HUD retains the established project type hierarchy, weight and one-line truncation across `1672 × 941` and `390 × 844`; no new wrapping, clipping or optical-weight regression is visible. The source still has finer offline-rendered label antialiasing, but this is not the dominant visual gap.
- [improved][spacing and layout rhythm] The closer camera gives the social circle stronger priority while maintaining clear foreground desk, middle-ground cast and background portal/wall. Desktop action controls and portrait controls remain unobstructed.
- [improved][colors and visual tokens] Warmer cardigan values, restrained face fill and darker contact depth better separate skin, ivory fabric, green cloth, timber and terrazzo. The reference still retains richer bounced colour and more local value variation.
- [improved][image quality and asset fidelity] All new face and hair cues are real GLB geometry with complete side/back continuity. No billboard, sprite, CSS drawing or camera-specific replacement is introduced; source-level strand density, cloth compression and facial anatomy remain visibly ahead.
- [checked][copy and content] The location, objective and four action labels remain coherent with the selected listening scene; mobile preserves the same current action instead of exposing placeholder copy.
- [P1][production deformation remains below the source] The real shared skeleton and continuous limb skin preserve walking/orbit truth, but shoulders, elbows, wrists, skirt compression and knees still lack production retopology, corrective shapes and hand-painted weights.
- [P1][facial performance remains below the source] Features are clearer, yet the selected image still has more expressive eyelids, cheek/lip volume, gaze specificity and role-authored asymmetry.
- [P1][hair/material/light transport remain below the source] Crown ribbons and role silhouettes improve, while the reference retains denser strand grouping, bespoke texture variation and offline-quality indirect illumination/contact penumbrae.

### Gate result

v100 materially improves the story-camera hierarchy, facial read, hair grouping, garment colour separation and physical contact while retaining real movement, full orbit, metre-space physics, responsive LOD and atomic room transitions. The literal same-size comparison is closer, but the reference remains visibly ahead in production deformation, facial acting, hair density and multi-bounce material rendering.

final result: blocked

Blocker: production character retopology/weight painting/corrective deformation, remaining facial and hair authoring, and source-level material/indirect-light construction remain below the selected reference.

## 2026-07-25 reference-fidelity v99 hand acting, reverse-orbit and tonal-depth gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Final desktop implementation at the identical viewport and story state: `tmp/v99-final-yaw0.png` (`1672 × 941`, `166 / 283,272`, renderer pixel ratio `1.2`, `4×` MSAA).
- Mandatory full-view comparison: `tmp/reference-vs-v99-full.png`; source and runtime are adjacent at their unscaled native size.
- Mandatory focused comparison: `tmp/reference-vs-v99-cast-focus.png`; the social-circle crops isolate shoulder, elbow, wrist, hand, gaze and costume relationships.
- Full-orbit evidence: `tmp/v99-final-yaw90.png` and `tmp/v99-final-yaw180.png`; the reverse wall now retains an authored picture rail, paired sconces and local warm washes instead of exposing a blank shell.
- Responsive evidence: `tmp/v99-final-mobile.png` (`390 × 844`, `100 / 243,496`, three-character performance LOD). Mobile retains the player, listener and active facilitator inside the story circle while remaining below the `110 / 250k` hard ceiling.
- Physical/runtime evidence: the same volumetric GLB player walked `4.25m`, rotated the real perspective camera `65.3°`, passed metre-space physics and desktop/mobile scene flow, and completed `78` transitions across all `26` rooms without failure or runtime exception.

### Comparison history, fixes and post-fix evidence

- [fixed / exported wrist poses disappeared at runtime] Controller-joint animation previously replaced each exported wrist quaternion with a delta rotation, erasing the facilitator's notebook grip and the mediator's thoughtful-hand orientation. Runtime now composes `restQuaternion × animationDelta`, matching the skinned-joint contract and preserving role-authored wrist poses through idle/listen blending.
- [improved / upper limbs still read as straight toy tubes] Arm ring profiles gain a restrained inward shoulder and outward bicep curve with a tapered forearm transition. The silhouette is softer without increasing character height, capsule size or adding disconnected overlay geometry.
- [improved / facilitator fingers intersected the notebook] Hand contract v5 differentiates finger lengths and adjusts curl, splay and thumb opposition around the held prop. The book remains a real articulated accessory and follows both wrist controllers during animation.
- [improved / opening cast remained too small] The public-room hero orbit moves from `5.60m` to `5.42m`; the story group grows by roughly `3–4%` while the entrance, listener wall and lounge remain inside the opening composition.
- [fixed / reverse orbit exposed an undirected blank wall] A continuous oak picture rail, brass reveal and two low-glare frosted sconces establish scale and warm hierarchy at `180°`. These are real room volumes and local lights, not a camera-facing backdrop.
- [improved / room values remained washed and material bands collapsed] Civic light levels are restrained, exposure moves from `0.90` to `0.87`, bounce/wash are reduced and the cinematic grade gains modest contrast and edge falloff. Ivory plaster, terrazzo, oak, teal textile and the cast now separate more clearly without crushing mobile faces.
- [checked / no gameplay or budget regression] Desktop opening is `166 / 283,272`; settled side/reverse views remain below `180 / 450k`; portrait mobile is `100 / 243,496`. Civic assets total `7.67 MB` and pass sculpt v54, animation v11, hand v5, skin and footwear contracts.

### Required fidelity surfaces and findings

- [improved][social acting] The notebook grip, mediator hand, listener arm separation and role-specific torso openings survive the real animation layer instead of reverting to a shared mannequin pose.
- [improved][spatial composition] The tighter opening frame strengthens the cast as the primary subject; the portal, wall console and lounge still supply foreground/middle/background navigation cues.
- [improved][orbit continuity and lighting] Front, side and reverse views retain built architecture and readable warm/cool material layers. The reverse wall now behaves like part of the authored room rather than hidden implementation space.
- [checked][responsive and interaction truth] Desktop shows the complete four-person discussion; mobile uses an intentional three-character LOD to preserve readable controls and the hard render budget. The player, NPC staging, interaction anchors and Rapier geometry remain in the same metre-space world.
- [P1][production character deformation remains below the source] The new shoulder and wrist contract improves posing, but elbows, garment compression, fingers and knees still lack production retopology, corrective shapes and authored weight painting.
- [P1][facial and hair performance remain below the source] Real eyes, mouths and hair volumes survive orbit, while cheek/lip deformation, strand rhythm and expression specificity remain visibly simpler than the reference.
- [P1][material construction and indirect light remain below the source] Tonal separation is better, but the selected image still has denser foliage/paper dressing, finer joinery, richer surface response and offline-quality multi-bounce illumination.

### Gate result

v99 fixes a genuine animation-space defect, improves role-specific hand acting, gives the reverse orbit an authored destination and deepens the room's tonal hierarchy while keeping physical exploration, atomic loading and responsive budgets intact. The literal same-size comparison is closer, but the reference remains visibly ahead in production deformation, facial/hair authoring and material/light transport.

final result: blocked

Blocker: production character retopology/weight painting/corrective deformation, remaining facial and hair authoring, and source-level material/indirect-light construction remain below the selected reference.

## 2026-07-25 reference-fidelity v98 character proportion and social-staging gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Final desktop implementation at the identical viewport: `tmp/v98-final-yaw0.png` (`1672 × 941`, `166 / 282,984`, renderer pixel ratio `1.2`, `4×` MSAA).
- Mandatory full-view comparison: `tmp/reference-vs-v98-full.png`; source and runtime are placed together at identical size and state.
- Mandatory focused comparison: `tmp/reference-vs-v98-cast-focus.png`; both four-person social circles are normalized to the same `760 × 610` review area so head-to-body rhythm, costume silhouette, gaze and stance can be judged rather than inferred from code.
- Full-orbit evidence: `tmp/v98-final-board.png`, containing settled `0°`, `90°`, `180°` and portrait mobile frames. Desktop views remain `166–171 / 282,984–296,428`; mobile remains `100 / 243,280`.
- Physical/runtime evidence: the same volumetric GLB player walked `4.65m`, rotated the real perspective camera `65.3°`, passed metre-space physics and desktop/mobile scene flow, and completed `78` transitions across all `26` rooms without failure or runtime exception.

### Comparison history, fixes and post-fix evidence

- [improved / cast retained a long 1:4 mannequin rhythm] All four role profiles enlarge the complete authored head downward into the shoulder line while preserving the same `1.72m` capsule and top height. Hair, ears, eyes, lids, mouth and facial morphs inherit one real local scale, avoiding a detached oversized face.
- [improved / arms and legs read as narrow tubes beside the source's softer illustrated volumes] Per-role arm and leg width/depth increase by a restrained `4–7%`. The existing continuous skin meshes still deform through the shared shoulder, elbow, hip and knee joints.
- [improved / two civic dresses were rigid columns] Facilitator and mediator skirts gain a wider, longer asymmetric pleated silhouette, while cardigan panels narrow and move outward to expose a readable coloured dress/waist layer.
- [improved / facilitator ponytail read as one vertical rubber hose] The primary tail becomes a narrower S-curve and the two overlapping highlight locks carry more of the visible silhouette. The complete tail remains under `PonytailPivot` and retains delayed secondary motion.
- [fixed / every NPC opened equally toward the camera] Story staging now uses role-authored camera opening: the facilitator returns to the source's side-profile notebook pose, the mediator stays readable in three-quarter view and the listener remains open without abandoning the social circle.
- [fixed / listener's hands met at the centre like an invisible tray] Animation contract v10 separates both arms, relaxes the elbows and keeps the palms near their own sides. This removes the clasped mannequin cue while preserving the same procedural clip blending.
- [improved / feet visually floated on the bright terrazzo] Civic contact shadows grow slightly and deepen from `0.23` to `0.32`, restoring a soft weight cue without changing Rapier grounding or drawing a hard oval.
- [checked / no render-budget regression] Opening remains `166 / 282,984`, side and reverse views peak at `171 / 296,428`, and portrait mobile remains `100 / 243,280`. Character source assets remain `7.67 MB` total and pass sculpt v53, animation v10, skin, hand and footwear contracts.

### Required fidelity surfaces and findings

- [improved][character proportion and silhouette] Heads, limbs, skirt hems and footwear now sit in a more coherent illustrated rhythm; the focused comparison no longer reads as four thin adults wearing oversized prop parts.
- [improved][social acting and spatial intent] Gaze, torso angle, hands and held notebook form a readable conversation rather than four independent characters displaying themselves to the camera.
- [checked][true 3D continuity] Every change belongs to lit, depth-tested GLB geometry or authored joint rotation. Front, side, reverse and mobile views retain the same character meshes; no billboard, portrait swap or camera-specific replacement was introduced.
- [checked][movement, physics and loading] The player remains inside the authoritative metre-space capsule, walks `4.65m`, rotates `65.3°`, and all `26 × 3` atomic transition passes remain green.
- [P1][production deformation remains below the source] The silhouette and staging are closer, but elbows, shoulders, skirt compression and fingers still lack production retopology, corrective shapes and authored weight painting.
- [P1][hair and facial acting remain below the source] Hair now has clearer grouped silhouettes, while strand rhythm, eyelid deformation, lip volume and cheek expression remain visibly simpler than the selected image.
- [P1][room-wide light transport and bespoke density remain below the source] The reference retains richer bounce light, paper/foliage density and subtler material transitions around the cast.

### Gate result

v98 corrects the largest character-scale and staging mismatch while preserving genuine walking, orbit, physical grounding, mobile performance and atomic room transitions. The literal focused comparison is materially closer, but production deformation, facial/hair construction and source-level indirect light still remain visibly ahead.

final result: blocked

Blocker: production character retopology/weight painting/corrective deformation, remaining facial and hair authoring, and source-level indirect-light transport remain below the selected reference.

## 2026-07-24 reference-fidelity v97 rectilinear room shell and entry-axis gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Final desktop implementation at the identical viewport: `tmp/v97-yaw0.png` (`1672 × 941`, `166 / 282,984`, renderer pixel ratio `1.2`, `4×` MSAA).
- Mandatory source/runtime comparison: `tmp/reference-vs-v97-full.png`; the unmodified reference and final runtime frame sit side by side at identical size.
- Full-orbit evidence: `tmp/v97-orbits.png`, containing settled `0°`, `90°`, `180°` and `270°` frames (`166–170 / 282,984–296,428`).
- Mobile evidence: `tmp/v97-mobile.png` (`390 × 844`, `100 / 243,280`, renderer pixel ratio `1`, three-character LOD).
- Physical/runtime evidence: the browser regression moved the same volumetric GLB player `4.77m`, rotated the real perspective camera `65.3°`, passed metre-space physics and desktop/mobile scene flow, and completed `78` transitions across all `26` rooms without failure or runtime exception.

### Comparison history, fixes and post-fix evidence

- [fixed / public room still read as a circular template or fishbowl] The visible cylindrical navigation shell is replaced by a quiet rectilinear plaster envelope. Rapier retains the existing circular movement boundary, but no longer exposes that implementation detail as the room's architecture.
- [fixed / removing the cylinder initially exposed clear-colour voids at side orbits] A large back-sided square shell now closes every reverse sightline while remaining behind the authored wall panels, entry portal and courtyard parallax. All four orbit directions retain a continuous floor-to-wall composition.
- [improved / entrance read as a window pasted into a curved room] The open timber portal now sits against a planar architectural field and becomes a real entrance axis. The exterior courtyard remains visible and supplies the same warm daylight direction at `0°`, `90°` and `270°`.
- [improved / broad plaster surfaces lacked middle-ground depth] Authored wall groups gain restrained recessed plaster bays and a clearer warm-value hierarchy. The bay geometry is merged into the existing orbit-aware wall batch, so the refinement adds no draw call.
- [improved / wall, floor and furniture collapsed into one beige value] Public plaster shifts warmer while the terrazzo base shifts slightly cooler and darker. The listening rug, oak joinery, teal lounge and brass path retain separate readable material bands.
- [checked / lower cost than v96] The final opening frame is `166 / 282,984`, side views peak at `170 / 296,428`, and mobile is `100 / 243,280`; all remain below the `180 / 450k` desktop and `110 / 250k` mobile gates.

### Required fidelity surfaces and findings

- [improved][architectural silhouette] The room now reads as a built community interior instead of a decorated circular arena. Straight walls, a planar hero field and the courtyard threshold establish foreground, middle ground and background.
- [improved][360-degree spatial continuity] No orbit angle reveals the scene background, a missing wall or the former cylindrical shell. The player, social circle and at least one story landmark remain readable in every settled cardinal view.
- [checked][movement, physics and loading] Visual architecture changed without splitting render and physics sources. The player remains grounded, walks `4.77m`, rotates the perspective camera `65.3°`, and all `26 × 3` atomic transition passes remain green.
- [P1][room dressing density remains below the source] The entrance and hero wall are coherent, while reverse wall sectors, paper ephemera, foliage layering and custom millwork remain materially less dense than the reference.
- [P1][character production quality remains below the source] The live cast still lacks production retopology, layered cloth deformation, dense hair grouping and source-level facial acting.
- [P1][indirect-light transport remains below the source] Portal direction and material separation improve, but the reference retains richer bounce light, contact shadow softness and local colour interaction.

### Gate result

v97 removes the largest room-scale mismatch: the public interior no longer exposes a circular template shell, the portal becomes a credible architectural axis, and every orbit closes cleanly within budget. Literal source parity is still not reached because character deformation, reverse-wall dressing density and offline-quality light transport remain visibly ahead in the reference.

final result: blocked

Blocker: production character retopology/UV/deformation, remaining reverse-wall bespoke dressing and source-level indirect-light transport remain visibly below the selected reference.

## 2026-07-24 reference-fidelity v96 facial contrast and orbit-light gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Final desktop implementation at the identical viewport: `tmp/v96-face-yaw0.png` (`1672 × 941`, `166 / 284,052`, renderer pixel ratio `1.2`, `4×` MSAA).
- Mandatory source/runtime comparison: `tmp/reference-vs-v96-cast-focus.png`; both four-person circles are inspected in one same-size crop. `tmp/v95-vs-v96-face-read.png` isolates the actual eye and face-light delta.
- Full-orbit evidence: `tmp/v96-face-yaw90.png` (`169 / 295,160`) and the settled reverse view `tmp/v96-face-yaw180b.png` (`170 / 297,496`).
- Mobile evidence: `tmp/v96-face-mobile.png` (`390 × 844`, `100 / 244,348`, renderer pixel ratio `1`, three-character LOD).
- Physical/runtime evidence: the browser regression moved the same volumetric GLB player `2.37m`, rotated the perspective camera `65.3°`, passed desktop/mobile scene flow and completed `78` transitions across all `26` rooms with no failure or runtime exception.

### Comparison history, fixes and post-fix evidence

- [improved / bright sclera and small dark centres read as toy eyes] The four role profiles now use larger role-tinted irises, a warmer lower-value sclera and smaller catchlights. Gaze remains visible at story distance, but the eye reads as one illustrated expression rather than white discs carrying black beads.
- [improved / faces lost too much value when a role turned across the portal key] The camera-side actor-only fill rises from `0.46` to `0.62` in the civic room and remains restricted to head geometry. Side-facing skin and eyes retain readable mid-tones without lifting furniture, walls or the floor.
- [checked / facial revision remains genuine 3D] Head, lids, sclera, iris, pupil and glint remain lit, depth-tested geometry under real hair occlusion. No portrait card, emissive face layer or view-specific replacement was introduced.
- [checked / no render-budget cost] All desktop orbit views retain v95's `166–170` calls and `284,052–297,496` triangles; portrait mobile remains `100 / 244,348`.

### Required fidelity surfaces and findings

- [improved][facial hierarchy] Dark iris area now dominates the small eye aperture and the reduced glint no longer competes with the pupil. Listener, facilitator and mediator maintain readable gaze across front and three-quarter views.
- [improved][character/environment integration] Camera-side fill restores face value while preserving the warm portal direction and clothing shadows; heads no longer collapse as abruptly against dark hair on the portal-opposite side.
- [checked][movement, physics and loading] The same v52 assets retain the v4 shoe pivots, v9 authored motion, metre-space capsule and atomic room lifecycle. Desktop/mobile flow and all `26 × 3` transition passes remain green.
- [P1][facial anatomy still remains below the source] Eye hierarchy is calmer, while the source retains more authored cheek, lip, eyelid and nose planes plus higher-quality expression deformation.
- [P1][hair and cloth deformation remain below the source] The real volumes survive orbit, but strand grouping, cloth compression and joint deformation still lack production DCC retopology and authored normal/texture maps.
- [P1][room-wide asset and light transport remain below the source] The reference still has denser bespoke dressing, finer joinery and materially richer multi-bounce illumination.

### Gate result

v96 removes the strongest white-disc eye cue and improves side-orbit facial readability without changing the real 3D, movement, physics, mobile or performance contracts. The source comparison is calmer and more legible, but production facial anatomy, deformation, bespoke room construction and indirect-light transport remain ahead.

final result: blocked

Blocker: production character retopology/UV/deformation, remaining room-wide asset construction and source-level indirect-light transport remain visibly below the selected reference.

## 2026-07-24 reference-fidelity v95 character stance, footwear and render-resolution gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Final desktop implementation at the identical viewport: `tmp/v95-character-yaw0.png` (`1672 × 941`, `166 / 284,052`, renderer pixel ratio `1.2`, `4×` MSAA).
- Mandatory same-canvas character comparison: `tmp/reference-vs-v95-cast-focus.png`; source and runtime social circles are cropped to the same `680 × 570` review area and inspected together. `tmp/v94-vs-v95-cast-focus.png` isolates the before/after change at the same crop.
- Full-orbit evidence: `tmp/v95-character-yaw90.png` (`169 / 295,160`) and `tmp/v95-character-yaw180.png` (`170 / 297,496`), both rendered at pixel ratio `1.2`.
- Mobile evidence: `tmp/v95-character-mobile.png` (`390 × 844`, device scale factor `1`, `100 / 244,348`, `2×` MSAA, three-character LOD).
- Physical exploration evidence: the browser regression moved the same v51 GLB player `5.09m`, exercised authored movement states and rotated the real perspective camera `65.3°`.
- Runtime evidence: all `26` interiors completed `78` atomic transitions with no stale room, black block, duplicate scene, retained physics world or runtime exception. Desktop/mobile scene flow, metre-space physics, both civic asset suites, repository checks and the production build passed.

### Comparison history, fixes and post-fix evidence

- [fixed / footwear pieces did not share one authored local transform] Shoe upper, sole, midsole, toe bumper, quarter panel, laces and boot collar now live under a single per-foot pivot. Scale and toe-out apply to the complete constructed shoe rather than rotating only one visible piece and leaving seams or soles behind.
- [improved / planted feet disappeared into a narrow peg stance] Role-specific foot scale increases by `9–12%`, while restrained outward yaw, stronger player weight transfer and wider listener hip spacing make left/right ground contact readable in follow, front and side views. The player keeps the same `1.72m` world-space contract and authoritative capsule.
- [improved / four social poses repeated the same vertical mannequin rhythm] Animation contract v9 adds stronger player weight transfer and an asymmetric listener hand/elbow relationship. Hands, forearms, shoes and secondary costume pieces remain parented to their real articulated pivots through idle, walk, run and listen.
- [improved / eyes and dark hair dominated the face at story distance] Eye apertures are slightly restrained per role and the player's hair highlight is lifted within the existing mineral-charcoal family. The result reduces the white-disc/toy contrast without adding a face billboard or unlit decal.
- [improved / exact desktop captures undersampled fine geometry] Desktop interiors now render at a minimum `1.2×` internal pixel ratio (`1.1×` for intermediate widths); portrait mobile remains `1×`. The real composer follows the same ratio and retains `4×/2×` MSAA, so shoe edges, fingers, hair ridges and terrazzo stay cleaner without changing camera framing.

### Required fidelity surfaces and findings

- [improved][footwear construction and contact] The complete shoe now scales and rotates as one authored object. All four roles preserve soles, laces, seams and collars through full orbit with no floating subpart, sunken heel or mismatched transform.
- [improved][character acting silhouette] The cast has clearer role asymmetry and less repeated parallel-leg staging. The player and listener remain recognisable from back, front and profile, and the real animated joints continue to drive their accessories.
- [checked][responsive performance] Opening, side and reverse desktop frames remain `166–170 / 284,052–297,496`; portrait mobile remains `100 / 244,348`, below `110` calls / `250k` triangles despite the sharper desktop raster.
- [checked][movement and atomic continuity] The player moves `5.09m`, rotates the perspective camera `65.3°`, stays grounded and uses the same render/physics/interaction space. All `26` rooms complete `78` transitions without runtime failures.
- [P1][production character deformation remains below the source] The source still has softer elbow/knee deformation, stronger facial anatomy, denser hair grouping, more natural finger acting and substantially richer cloth compression.
- [P1][complete-room bespoke construction remains below the source] The spatial story and hero families are coherent, while cabinetry joinery, object wear, foliage density and paper dressing still expose more procedural construction.
- [P1][indirect-light transport remains below the source] Supersampling improves edge clarity, not light transport; the source still has richer bounce colour, softer local penumbrae and stronger skin/cloth/environment integration.

### Gate result

v95 makes footwear transforms physically coherent, strengthens character stance acting and raises desktop raster quality while preserving metre-space physics, real movement, orbit, mobile performance and atomic room transitions. The literal character comparison is cleaner, but the source remains visibly ahead in deformation, facial construction, bespoke room assets and offline-quality indirect light.

final result: blocked

Blocker: production character retopology/UV/deformation, remaining room-wide asset construction and source-level indirect-light transport remain visibly below the selected reference.

## 2026-07-24 reference-fidelity v94 authored lounge and single-table spatial-truth gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Final desktop implementation at the identical viewport: `tmp/v94-final-yaw0.png` (`1672 × 941`, `166 / 284,052`, `48°`, `5.6m` opening orbit).
- Mandatory same-canvas comparison: `tmp/reference-vs-v94-final.png`; the unmodified source and runtime frame sit side by side at identical size. `tmp/reference-vs-v94-lounge-final.png` compares the source and runtime lounge crops together at equal height.
- Full-orbit evidence: `tmp/v94-final-yaw90.png` (`169 / 295,160`) and `tmp/v94-final-yaw180.png` (`170 / 297,496`).
- Mobile evidence: `tmp/v94-final-mobile.png` (`390 × 844`, device scale factor `1`, `100 / 244,348`, three-character LOD).
- Physical exploration evidence: the browser regression moved the same GLB player `2.85m`, exercised authored movement states and rotated the perspective camera `65.3°`.
- Runtime evidence: all `26` interiors completed `78` atomic transitions with no stale room, black block, duplicate scene, retained physics world or runtime exception. Desktop/mobile scene flow, metre-space physics, both civic asset suites, repository checks and production build passed.

### Comparison history, fixes and post-fix evidence

- [fixed / sofa read as two thin chairs instead of the source's substantial lounge] The authored sofa now has a wider oak load-bearing frame, continuous front rail, deeper teal seat/back upholstery, visible edge piping and grounded feet. Its post-normalization silhouette remains close to a credible two-metre sofa even though the same suite contains a tall side bookcase.
- [improved / textile hierarchy was flat and toy-like] Seat and back cushions now use visibly compressed volumes, inset seams and restrained tufts. The two accent pillows carry different raised pattern grammars, while a folded striped throw breaks the former bilateral procedural symmetry.
- [fixed / two coffee tables occupied the same conversation bay] The GLB contained one table while `ZoneLayoutProfile` rendered another table with the actual Rapier collider and interaction anchor. The duplicate GLB table and its dressing are removed. The final frame has one readable oval table on one rug, and render, collision and interaction again share one metre-space source of truth.
- [improved / detail increase threatened the mobile ceiling] Low-value subdivision was removed from arm pads and decorative pillows while keeping their rounded silhouette. The final lounge falls to `120` authored meshes / `19,572` triangles and the three-prop suite to `51,632` triangles; portrait mobile is `244,348`, safely under `250k`.
- [checked / orbit and movement remained real 3D] The lounge keeps full back/side geometry and stays coherent at `0°`, `90°` and `180°`. The same volumetric character still walks through Rapier space, changes animation state and drives the real orbit camera; no room billboard, sprite or angle-specific replacement was introduced.

### Required fidelity surfaces and findings

- [improved][lounge scale and composition] The right-side conversation bay now has one dominant teal sofa, one oval table, one textile rug and a supporting bookcase. The source remains richer, but the implementation no longer reads as a pile of unrelated miniature props.
- [improved][visual/physical consistency] Removing the duplicate table eliminates a visible overlap and a contradictory non-colliding obstacle. The remaining table owns the authoritative collider and reachable interaction point.
- [checked][responsive performance] Opening, side and reverse desktop frames remain `166–170 / 284,052–297,496`; portrait mobile remains `100 / 244,348`, below `110` calls / `250k` triangles.
- [checked][movement and atomic continuity] The player moves `2.85m`, rotates the perspective camera `65.3°`, retains grounded contact and shares authoritative render/physics/interaction transforms. All `26` rooms complete `78` transitions without runtime failures.
- [P1][lounge construction still remains below the source] The sofa/table family and spacing now align, while source-level upholstery compression, woven textile micro-detail, timber joinery, object wear and foliage density remain absent.
- [P1][character production quality remains visibly below the source] The live cast still has simplified fingers, cloth deformation, hair strand grouping, facial correctives and footwear construction.
- [P1][indirect-light transport remains visibly below the source] Portal direction and contact depth remain coherent, but the source still has richer colour bounce, softer local penumbrae and stronger character/environment integration.

### Gate result

v94 fixes the largest furniture-scale mismatch in the lounge and removes a real render/physics duplication while lowering geometry below v93. The literal crop comparison is cleaner and the complete movement, orbit, physics, mobile and atomic-loading contracts pass, but source-level upholstery/material construction, production character deformation and indirect-light transport are not yet reached.

final result: blocked

Blocker: production upholstery/material authoring, character retopology/UV/deformation and source-level indirect-light transport remain visibly below the selected reference.

## 2026-07-24 reference-fidelity v93 player identity and facial-read gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Final desktop implementation at the identical viewport: `tmp/v93-final-yaw0.png` (`1672 × 941`, `166 / 284,932`, `48°`, `5.6m` opening orbit).
- Mandatory literal same-canvas comparison: `tmp/reference-vs-v93-final.png`; the complete source and final runtime frame sit side by side in one `3344 × 941` image. `tmp/reference-vs-v93-final-cast.png` compares both four-person circles at equal crop size.
- Front-facing character evidence: `tmp/v93-player-front2-crop.png`; the same live player is seen from the reverse orbit with the reconstructed vest, short sleeves, forearms, hands and face.
- Full-orbit evidence: `tmp/v93-final-yaw90.png` (`169 / 296,040`) and `tmp/v93-character2-yaw180.png` (`170 / 298,376`).
- Mobile evidence: `tmp/v93-final-mobile.png` (`390 × 844`, device scale factor `1`, `100 / 245,228`, three-character LOD).
- Physical exploration evidence: the browser regression walked `4.21m`, completed authored movement states and rotated the perspective camera `65.3°`.
- Runtime evidence: all `26` interiors completed `78` atomic transitions with no stale room, black block, duplicate scene, retained physics world or runtime exception. Desktop/mobile scene flow, metre-space physics, both civic asset suites, repository checks and production build passed.

### Comparison history, fixes and post-fix evidence

- [fixed / player costume contradicted the selected 2D-to-3D identity] The reference player's most readable clothing structure is a cream short-sleeve shirt under an olive vest with bare forearms. The earlier GLB built both arms from the green outer layer and read as an unrelated long-sleeve character. Sculpt v50 uses the cream continuous arm beneath real elbow-parented skin forearms, adds a green sleeve edge and widens the two fitted vest panels.
- [fixed / bare-arm colour could remain buried inside the deformation sleeve] The first v50 build placed the skin overlay at almost the same radius as the continuous sleeve. Front-orbit evidence still read as cream to the wrist. The released pass expands the forearm by a few millimetres, preserving the gap-free hidden sleeve while making the warm skin surface visible from front, side and motion poses.
- [improved / faces remained round and their gaze collapsed at story distance] All four roles share a narrower, shallower cranial volume with stronger lower-jaw taper and a restrained chin point. Role-specific eye apertures increase by roughly `5–6%`, while irises rise only enough to preserve the warm sclera and avoid the earlier white-disc doll look.
- [improved / facial features drifted after the head volume changed] Eyes, ears, nose and mouth are moved onto the revised real surface rather than left floating at the old sphere depth. The complete feature hierarchy remains lit, depth-tested, morphable and readable through the `180°` front view.
- [checked / identity reconstruction did not change gameplay truth] Forearms are children of the real elbow pivots, not static colour cards. They follow idle, walk, run, listen and gesture; the capsule, real-world height, interaction anchors and camera target are unchanged.

### Required fidelity surfaces and findings

- [improved][2D-to-3D character identity] The controlled character now carries the source's cream/olive/bare-arm hierarchy from both follow and front views. Vest panels, cargo trousers, backpack and shoes remain separate physical volumes rather than a recoloured mannequin.
- [improved][facial hierarchy] Eyes survive the wide story camera more consistently; the tighter jaw and shallower skull reduce the generic spherical-toy read without increasing head scale.
- [checked][responsive performance] Opening, side and reverse desktop frames remain `166–170 / 284,932–298,376`; portrait mobile remains `100 / 245,228`, below `110` calls / `250k` triangles.
- [checked][movement and orbit continuity] The same v50 GLB player walks `4.21m`, changes real animation states, rotates the perspective camera `65.3°` and preserves the authoritative metre-space capsule and grounded feet.
- [P1][character deformation and close detail remain below the source] The costume mapping is more faithful, but the focused comparison still exposes simplified finger articulation, cloth compression, hair strand grouping, facial correctives and footwear construction.
- [P1][remaining room construction remains visibly below the source] Cabinet joinery, foliage density, paper dressing, curved furniture profiles and object-level wear remain more procedural and less densely art-directed.
- [P1][indirect-light transport remains visibly below the source] The scene keeps coherent portal light and soft fill, but the source still has richer multi-bounce colour return, finer contact penumbrae and more unified character/environment integration.

### Gate result

v93 repairs the largest role-identity mismatch on the controlled character and makes the real volumetric faces more legible without changing head scale, draw-call count, movement, physics, camera or atomic-loading behavior. The selected reference remains visibly ahead in production character deformation, complete-room bespoke construction and offline-quality indirect light.

final result: blocked

Blocker: production character retopology/UV/deformation, remaining room-wide asset construction and source-level indirect-light transport remain visibly below the selected reference.

## 2026-07-24 reference-fidelity v92 authored textile and soft-surface gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Final desktop implementation at the identical viewport: `tmp/v92-final-yaw0.png` (`1672 × 941`, `166 / 284,492`, `48°`, `5.6m` opening orbit).
- Mandatory literal same-canvas comparison: `tmp/reference-vs-v92-final.png`; the complete source and final runtime frame sit side by side in one `3344 × 941` image. `tmp/reference-vs-v92-final-cast.png` isolates the two social circles at equal crop size.
- Full-orbit evidence: `tmp/v92-final-yaw90.png` (`169 / 295,600`) and `tmp/v92-final-yaw180.png` (`170 / 297,936`).
- Mobile evidence: `tmp/v92-final-mobile.png` (`390 × 844`, device scale factor `1`, `100 / 244,788`, three-character LOD).
- Physical exploration evidence: the browser regression walked `4.13m`, completed the real character movement states and rotated the perspective camera `65.3°`.
- Runtime evidence: all `26` interiors completed `78` atomic transitions with no stale room, black block, duplicate scene, retained physics world or runtime exception. Desktop/mobile scene flow, metre-space physics, both civic asset suites, repository checks and production build passed.

### Comparison history, fixes and post-fix evidence

- [fixed / central story surface remained a flat code-drawn motif] The listening circle now uses a project-bound, authored `1024 × 1024` warm-ivory textile asset at `public/assets/interiors/textures/civic-listening-rug-embossed-v1.jpg`. It supplies both colour and restrained bump response, so the botanical relief reads under orbiting light rather than staying a screen-flat ornament.
- [fixed / texture could have appeared after the room became visible] The rug colour and bump maps join the same atomic physical-surface preload as plaster and terrazzo. Failure falls back before scene reveal; there is no late image swap or second final-looking background.
- [improved / civic light was contrasty and skin separated from the room] Civic key energy is lower while hemisphere, fill, floor bounce and portal wash are broader. GTAO and the post-grade are restrained; actor face fill is slightly higher. The opening frame has softer penumbrae and better face/floor continuity without losing the portal direction.
- [improved / pale skin and matte-black hair read as unlit toy parts] Sculpt v49 warms the four role skin families, raises skin roughness, lowers skin clearcoat and gives dark hair a narrower readable highlight response. Runtime face wrapping and contact shadows were recalibrated to preserve grounding without plastic glare.
- [improved / procedural rug relief consumed geometry] Sixteen separate decorative relief meshes were removed after the real textile asset replaced them. The opening falls from v91's `167 / 287,628` to `166 / 284,492`; side and reverse views also remain lower than v91.

### Required fidelity surfaces and findings

- [improved][story focal surface] The circular listening area now has visible fibre-scale relief and a quiet botanical identity close to the reference's embossed centre, while preserving the authoritative walkable plane and collision truth.
- [improved][soft-light hierarchy] Warm portal light, cool fill and floor return separate skin, cloth, plaster and terrazzo more gently. Four-orbit inspection shows no washed-out reverse angle or dark face failure.
- [checked][responsive performance] Opening, side and reverse desktop frames remain `166–170 / 284,492–297,936`; portrait mobile remains `100 / 244,788`, below `110` calls / `250k` triangles.
- [checked][physical and loading continuity] The same GLB player walks `4.13m`, rotates the real camera `65.3°`, retains grounded contact and shares authoritative render/physics/interaction transforms. All room textures are ready before atomic reveal.
- [P1][character production quality remains visibly below the source] Surface response is less chalky, but the focused literal comparison still exposes simplified facial topology, fingers, cloth folds, hair construction, stance acting and footwear.
- [P1][remaining room construction remains visibly below the source] The authored rug closes one prominent surface gap; cabinetry joinery, foliage density, paper dressing, curved furniture profiles and object-level wear remain more procedural.
- [P1][indirect-light transport remains visibly below the source] The balance is softer, but the source still has materially richer multi-bounce colour return, finer contact penumbrae and more unified character/environment integration.

### Gate result

v92 replaces the most visible flat procedural surface with a real authored textile asset, softens the public-room light/material stack and improves character skin/hair response while reducing geometry and preserving the complete movement, orbit, physics and atomic-loading contracts. The literal source comparison is closer, but source-level character topology, complete-room bespoke construction and offline-quality indirect light are not yet reached.

final result: blocked

Blocker: production character retopology/UV/deformation, remaining room-wide asset construction and source-level indirect-light transport remain visibly below the selected reference.

## 2026-07-24 reference-fidelity v91 proportion and full-orbit foreground gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Final desktop implementation at the identical viewport: `tmp/v91-proportions-yaw0.png` (`1672 × 941`, `167 / 287,628`, `48°`, `5.6m` opening orbit).
- Mandatory literal same-canvas comparison: `tmp/reference-vs-v91.png`; the unmodified source and final runtime frame sit side by side in one `3344 × 941` comparison image.
- Full-orbit evidence: `tmp/v91-yaw90.png` (`170 / 298,736`, actor avoidance `0.448m`) and `tmp/v91-yaw180.png` (`171 / 301,072`, actor avoidance `1.6m`, radial clearance `1.55m`).
- Mobile evidence: `tmp/v91-mobile.png` (`390 × 844`, device scale factor `1`, `100 / 244,788`, three-character LOD).
- Physical exploration evidence: the browser regression walked `1.41m`, changed authored movement states and rotated the real camera `65.3°`.
- Runtime evidence: all `26` interiors completed `78` atomic transitions with no stale room, black block, duplicate scene, retained physics world or runtime exception. Desktop/mobile scene flow, metre-space physics, both civic asset suites, repository checks and production build passed.

### Comparison history, fixes and post-fix evidence

- [improved / cast still read as oversized toy heads] Sculpt v48 reduces all four head volumes by roughly `4–5%`, raises the head pivots to preserve the neck transition and keeps the `1.72m` metre-space contract unchanged. The same-canvas frame has a calmer head-to-shoulder relationship without weakening eye direction at gameplay distance.
- [improved / female silhouettes flared like broad toy cones] Facilitator and mediator skirts use narrower waists, hems and depth. The garment remains a real articulated skirt surface with secondary motion, but its standing silhouette is closer to the fitted dresses in the source.
- [fixed / large hero furniture could only fade as part of the complete room batch] Lounge and notice assemblies now keep independent desktop material batches. Camera proximity is measured against their visible bounding surface rather than a distant object origin, so a near counter can be selectively faded without dissolving unrelated furniture, evidence or walls.
- [fixed / reverse witness bench could become an inseparable lower-third mask] The bench is now its own foreground assembly while the evidence board, pendant and plants remain in the architectural batch. The `180°` frame keeps the four-person circle readable and stays below the desktop budget.
- [checked / asset budget remained strict] The mediator sash knot drops imperceptible sub-five-centimetre curvature instead of relaxing the file-size gate. All four GLBs remain below `2 MiB`, total `7.65 MB`, and retain the same rig, face, hand, footwear and animation contracts.

### Required fidelity surfaces and findings

- [improved][character proportion] Player, listener, facilitator and mediator now have less top-heavy silhouettes; the tighter skirts expose leg stance and foot contact more clearly in opening, side and reverse views.
- [improved][full-orbit composition] Foreground furniture can be hidden independently when it actually crosses the camera near field. The actor circle and current objective remain readable through `0°`, `90°` and `180°` without a room-wide transparency artifact.
- [checked][responsive performance] Opening, side and reverse desktop frames remain `167–171 / 287,628–301,072`; portrait mobile remains `100 / 244,788`, below `110` calls / `250k` triangles.
- [checked][physical continuity] The same GLB player walks `1.41m`, turns the perspective camera `65.3°`, retains grounded contact and shares the authoritative render/physics/interaction transforms.
- [P1][character production quality remains visibly below the source] Proportion is closer, but literal comparison still exposes simplified facial topology, fingers, cloth deformation, hair strand construction and material micro-response.
- [P1][remaining room asset construction remains visibly below the source] The functional families and composition are established, while cabinetry joinery, foliage density, paper dressing and curved furniture profiles still reveal more procedural construction than the reference.
- [P1][lighting transport remains visibly below the source] Directional portal light, dapple and contact depth are coherent, while the source still has softer multi-bounce penumbrae, localized colour return and stronger skin/cloth/floor integration.

### Gate result

v91 improves the most visible cast proportion and gives near-camera hero furniture a selective full-orbit occlusion contract without changing metre-space physics, interaction anchors or mobile LOD. The literal same-canvas comparison is closer and all runtime gates pass, but source-level character topology, bespoke room construction and indirect-light transport are not yet reached.

final result: blocked

Blocker: production character retopology/UV/deformation, remaining room-wide asset construction and source-level indirect-light transport remain visibly below the selected reference.

## 2026-07-24 reference-fidelity v90 material hierarchy and side-wall integrity gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Final desktop implementation at the identical viewport: `tmp/v90-final-reference-viewport.png` (`1672 × 941`, `163 / 287,748`, `48°`, `5.6m` opening orbit).
- Mandatory literal same-canvas comparison: `tmp/reference-vs-v90-final.png`; the unmodified source and final runtime frame sit side by side in one `3352 × 941` comparison image.
- Full-orbit evidence: `tmp/v90-final-yaw90.png` (`166 / 298,856`, actor avoidance `0.448m`) and `tmp/v90-final-yaw180.png` (`167 / 301,192`, actor avoidance `1.6m`, radial clearance `1.55m`).
- Mobile evidence: `tmp/v90-final-mobile-390x844.png` (`390 × 844`, device scale factor `1`, `100 / 244,788`, three-character LOD).
- Physical exploration evidence: the browser regression walked `1.09m`, changed authored movement states and rotated the real camera `65.3°`.
- Runtime evidence: all `26` interiors completed `78` atomic transitions with no stale room, black block, duplicate scene, retained physics world or runtime exception. Desktop/mobile scene flow, metre-space physics, both civic asset suites, repository checks and production build passed.

### Comparison history, fixes and post-fix evidence

- [fixed / public-room shell read as a near-white generic cylinder] The civic shell now uses the same warm `terrazzo-teal-brass` plaster family already selected by its authored layout profile. Wall, floor, timber and skin regain separate value families instead of collapsing into a pale grey backdrop.
- [improved / foreground record desk remained a flat vertex-colour block] The two broad oak planes and walnut edge/drawer family are now separately batched with the existing scanned wood colour, normal and roughness maps. Tiny editorial props remain in the economical vertex-colour batch, limiting the material improvement to two additional calls.
- [fixed / side orbit exposed a detached black arch] The obsolete response-alcove assembly occupied the same wall as the newer glazed lightwell. During camera fading it could leave only its dark torus visible above the window. The duplicate assembly is removed; the complete lightwell is now the single side-wall landmark and the `90°` frame falls to `298,856` triangles.
- [checked / render and physics stayed co-authored] Record-desk footprint, transform, collider and interaction anchor are unchanged; the material split changes no walkable space. The removed alcove was decorative and inaccessible, so navigation and scene contracts remain identical.

### Required fidelity surfaces and findings

- [improved][material hierarchy] The opening frame now distinguishes warm lime plaster, honed terrazzo, mapped oak/walnut, brass, paper, fabric and ceramic at gameplay distance. The foreground desk no longer reads as a uniform orange primitive.
- [improved][full-orbit architectural integrity] The side frame contains one complete window/lightwell assembly instead of overlapping wall stories. The black floating arc visible in the first `90°` review is absent from the final evidence.
- [checked][responsive performance] Opening, side and reverse desktop frames remain `163–167 / 287,748–301,192`; portrait mobile remains `100 / 244,788`, below `110` calls / `250k` triangles.
- [P1][character production quality remains visibly below the source] The exact same-canvas comparison still exposes simplified cranial/cheek topology, hands, footwear, cloth folds and role-specific material identity.
- [P1][remaining room asset construction remains visibly below the source] Material response is richer, but several cabinetry, foliage and paper groups retain obvious rounded-primitive construction and less authored wear/joinery.
- [P1][lighting transport remains visibly below the source] Directional daylight, dapple and contact depth are coherent, while the source still has softer multi-bounce penumbrae, localized colour return and stronger skin/cloth/floor integration.

### Gate result

v90 removes a visible full-orbit construction failure and gives the highest-pixel foreground furniture real material response without changing its physical truth or exceeding mobile budgets. The literal same-canvas comparison is materially cleaner, but it still does not reach source-level character topology, complete-room bespoke construction or indirect-light transport.

final result: blocked

Blocker: production character retopology/UV/deformation, remaining room-wide asset construction and source-level indirect-light transport remain visibly below the selected reference.

## 2026-07-24 reference-fidelity v89 continuous-shoulder and grounded-pelvis gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Final desktop implementation at the identical viewport: `tmp/v89-final-reference-viewport.png` (`1672 × 941`, `161 / 287,748`, `48°`, `5.6m` opening orbit).
- Mandatory literal same-canvas comparison: `tmp/reference-vs-v89-final.png`; the unmodified source and final runtime frame sit side by side in one `3344 × 941` comparison image.
- Full-orbit evidence: `tmp/v89-final-yaw90.png` (`165 / 313,748`, actor avoidance `0.448m`) and `tmp/v89-final-yaw180.png` (`165 / 316,084`, actor avoidance `1.6m`, radial clearance `1.55m`).
- Mobile evidence: `tmp/v89-final-mobile-390x844.png` (`390 × 844`, device scale factor `1`, `98 / 244,788`, three-character LOD).
- Physical exploration evidence: `tmp/v89-final-character-walk.png`; the browser regression walked `4.77m`, changed authored movement states and rotated the real camera `65.3°`.
- Runtime evidence: all `26` interiors completed `78` atomic transitions with no stale room, black block, duplicate scene, retained physics world or runtime exception. Desktop/mobile scene flow, metre-space physics, both civic asset suites, repository checks and production build passed.

### Comparison history, fixes and post-fix evidence

- [improved / arm volumes met the torso as narrow vertical tubes] Sculpt v47 reshapes the top ring of the continuously skinned arm mesh into a broader shoulder transition. The same weighted surface now rolls from torso to sleeve through idle, walk, listen and gesture poses without adding a detached shoulder shell.
- [improved / trouser roles separated into two peg-like columns] Player and listener gain a restrained pelvis/trouser-seat bridge inside the existing garment silhouette. It closes the artificial daylight gap at the hips while keeping both leg pivots, the authoritative capsule and foot contact unchanged.
- [improved / neck read as a toy peg] All four roles use a shorter, slimmer neck transition. The visible head-to-torso gap is reduced without changing the `1.72m` world-scale contract or the volumetric face hierarchy.
- [improved / neutral stance remained mechanically parallel] Animation contract v8 adds role-specific outward leg yaw to idle/listen staging, so the social circle reads as planted weight rather than four parallel columns.
- [rejected / separate shoulder-cap experiment] The first pass improved roundness but added eight desktop and six mobile draw calls; a higher second pass also produced an unacceptable raised-shoulder silhouette. Both were removed. The released continuous-skin solution restores the original `161 / 98` draw-call levels and is lower in triangles than v88.
- [improved / orbit QA captured the first opaque frame] Non-zero-yaw captures now settle across the authored occlusion transition before evidence is recorded, and runtime occlusion also samples lower-body sightlines. This makes full-orbit review representative of the view after the real camera completes its movement.

### Required fidelity surfaces and findings

- [improved][character silhouette continuity] Shoulder, neck and pelvis transitions are less segmented in the same-canvas and walking evidence. The changes are real weighted geometry, remain visible from every orbit angle and do not use a billboard or screen-space replacement.
- [checked][movement and physics truth] The player walks `4.77m`, rotates the real camera `65.3°`, retains foot contact and uses the same capsule, metre scale and interaction anchors. Four GLBs remain below `2 MiB` each and total `7.66 MB`.
- [checked][responsive performance] Opening, side and reverse desktop frames remain `161–165 / 287,748–316,084`; portrait mobile remains `98 / 244,788`, below `110` calls / `250k` triangles.
- [P1][character production quality remains visibly below the source] Continuous joints remove a distracting construction defect, but the same-canvas comparison still exposes blockier head/torso proportions, simplified hands and footwear, weak cloth folds and less authored material identity.
- [P1][room asset construction remains visibly below the source] The implementation retains the same story families and walkable composition, while the source still has subtler joinery, curved furniture profiles, richer paper/foliage density, more convincing glass and less procedural edge language.
- [P1][lighting transport remains visibly below the source] Directional portal light and contact depth are coherent, but the source still has softer multi-bounce penumbrae, richer colour return and more unified skin/cloth/floor integration.

### Gate result

v89 removes three visibly mechanical body transitions without increasing draw calls, preserves the complete real-time movement/orbit/physics stack and stays inside stricter mobile budgets. The literal same-canvas comparison is cleaner at the shoulder and pelvis, but it still does not reach source-level character topology/materials, complete-room bespoke construction or indirect-light transport.

final result: blocked

Blocker: production character retopology/UV/deformation, remaining room-wide asset construction and source-level indirect-light transport remain visibly below the selected reference.

## 2026-07-24 reference-fidelity v88 inertial-character and wider-story-camera gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Final desktop implementation at the identical viewport: `tmp/v88-final-desktop-reference-viewport.png` (`1672 × 941`, `161 / 288,220`, `48°`, `5.6m` opening orbit).
- Mandatory literal same-canvas comparison: `tmp/reference-vs-v88-final.png`; the unmodified `1672 × 941` source and the unmodified `1672 × 941` runtime frame sit side by side in one `3344 × 941` comparison image.
- Full-orbit evidence: `tmp/v88-final-desktop-yaw90.png` (`165 / 314,220`, actor avoidance `0.448m`) and `tmp/v88-final-desktop-yaw180.png` (`165 / 316,556`, actor avoidance `1.6m`, radial clearance `1.55m`).
- Mobile evidence: `tmp/v88-final-mobile-390x844.png` (`390 × 844`, device scale factor `1`, `98 / 245,044`, three-character LOD).
- Physical exploration evidence: `tmp/v88-final-character-walk.png`; the browser regression walked `5.37m`, produced independently measured accessory motion, preserved a settling impulse after key release and rotated the real camera `65.3°`.
- Runtime evidence: all `26` interiors completed `78` atomic transitions with no stale room, black block, duplicate scene, retained physics world or runtime exception. Desktop/mobile scene-flow, metre-space physics, both civic asset suites, repository checks and production build passed.

### Comparison history, fixes and post-fix evidence

- [fixed / accessories moved as rigid sine-driven attachments] Backpack, satchel, ponytail and skirt now use deterministic damped springs driven by gait, world velocity, forward/lateral acceleration and turn rate. Each piece has an authored stiffness, damping, angular envelope and vertical lift envelope; braking produces a visible opposite impulse instead of snapping straight back to rest.
- [fixed / secondary motion was not regression-tested] Runtime diagnostics expose the `mirrorlife-civic-secondary-motion-v2` contract, per-piece rotation/lift and angular velocity. The physical exploration test now requires readable motion across a full walk cycle and residual settling energy after key release.
- [improved / reference-resolution opening was too intimate] The desktop civic story camera moves from `46° / 4.8m / 2.78m` to `48° / 5.6m / 3.18m`. The player now occupies roughly one third of frame height, the complete listening ring remains visible and the entrance, evidence wall and lounge share the opening without turning the backpack into a foreground wall.
- [checked / wider opening did not weaken orbit protection] Side and reverse arcs retain responsive FOV, tangent actor avoidance and radial pullback. All four actors remain visible at `0°`, `90°` and `180°`; the room remains inside `180` calls / `450k` triangles and portrait mobile remains inside `110` calls / `250k` triangles.

### Required fidelity surfaces and findings

- [improved][embodied character response] Garments and carried props now lag acceleration, swing through turns and settle after stopping. This adds a layer of weight and material response without changing the authoritative capsule, metre scale, foot contact or animation clips.
- [improved][first-read composition] At the exact source viewport, player scale and scene coverage are materially closer to the reference. The social circle has readable negative space and the public-room function is visible without relying on the title chip.
- [checked][3D exploration continuity] The same real character asset moves `5.37m`, changes idle/walk states, drives continuous skin, retains accessory inertia and rotates the perspective camera `65.3°`; there is no sprite, camera-facing replacement or pre-rendered-room swap.
- [checked][responsive performance] Opening, side and reverse desktop views remain `161–165 / 288,220–316,556`; portrait mobile remains `98 / 245,044`.
- [P1][character production quality remains visibly below the source] The exact same-canvas comparison still exposes blockier cranial/cheek topology, simplified hands and footwear, coarser cloth construction and weaker painted-material identity. Motion is more believable, but the meshes and deformation quality are not yet source-level.
- [P1][room asset construction remains visibly below the source] The implementation has the same functional families and composition, but the source still carries subtler joinery, curved furniture profiles, denser paper/foliage storytelling, more convincing glass and less procedural edge language.
- [P1][lighting transport remains visibly below the source] Portal direction, actor fill and contact shadows are coherent, yet the source retains softer multi-bounce penumbrae, richer colour bleed and more unified skin/cloth/floor integration.

### Gate result

v88 makes character movement materially less rigid and corrects the opening camera at the literal reference viewport while preserving real movement, 360° orbit, physics truth, mobile controls, atomic loading and performance budgets. The required same-canvas review is closer in scale and staging but still not literal production parity in character topology/deformation, complete-room bespoke assets or indirect-light transport.

final result: blocked

Blocker: production character retopology/UV/deformation, remaining room-wide asset construction and source-level indirect-light transport remain visibly below the selected reference.

## 2026-07-24 reference-fidelity v87 crafted-glass and upholstery gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Final desktop implementation: `tmp/v87-light-yaw0.png` (`1600 × 900` CSS pixels, device scale factor `1`, `161 / 288,220`, `46°`, `4.8m` opening orbit).
- Mandatory normalized full-view comparison: `tmp/reference-vs-v87.png`; source and implementation are rendered as equal `934 × 525` content panels in one `1900 × 585` comparison canvas.
- Full-orbit evidence: `tmp/v87-final2-desktop-yaw90.png` (`166 / 314,220`, actor avoidance `0.32m`) and `tmp/v87-final2-desktop-yaw180.png` (`165 / 316,556`, actor avoidance `1.362m`, radial clearance `1.55m`).
- Mobile evidence: `tmp/v87-final2-mobile-390x844.png` (`390 × 844`, device scale factor `1`, `98 / 245,044`, three-character LOD).
- Physical exploration evidence: `tmp/v87-character-walk.png`; the browser regression walked `4.13m`, completed the movement state transition and rotated the real camera `65.3°`.
- Runtime evidence: all `26` interiors completed `78` atomic transitions with no stale room, black block, duplicate scene, retained physics world or runtime exception. Desktop/mobile scene-flow, character exploration, metre-space physics, both civic asset suites, repository checks and production build passed.

### Comparison history, fixes and post-fix evidence

- [improved / foreground display read as a vertical glass box] Hero-prop contract v8 gives the display case a shared `-0.115rad` raked front across its physical glass, walnut posts and brass mullions. Two concealed shelf illumination strips remain a single emissive GLB batch, lifting the curated ceramics/evidence through the glass without adding room-wide fill.
- [improved / sofa cushions remained rounded cuboids] The two seats and two back cushions now use applied bevel topology plus authored local fabric tension: broad faces bulge gently, top surfaces sag and corners pull toward their seams. The visible footprint and authoritative lounge collider remain unchanged.
- [fixed / first sculpt pass exceeded mobile geometry budget] Applying the same dense topology to pillows and throw pushed portrait mobile to `256,208` triangles. That pass was rejected. Decorative textiles returned to lightweight rounded construction, cushion edge segmentation was reduced from `6` to `3`, and the released mobile frame is `245,044`, below the `250k` gate.
- [improved / room light remained broad and chalky] Civic lighting now concentrates more energy in the warm portal key while lowering hemisphere, fill, bounce and wash. Exposure moves from `0.86` to `0.84`, with a restrained contrast lift in the civic grade; faces remain readable through their actor-only fill and volumetric skin response.
- [checked / authored-source and runtime budgets] The editable display, notice and lounge masters remain available as `.blend` sources. Their final GLBs total `52,512` authored triangles; the public room remains below every desktop/mobile draw-call and geometry gate.

### Required fidelity surfaces and findings

- [improved][foreground material hierarchy] Raked glass, brass rails, oak/walnut joinery, emissive shelf light, glazed objects and paper labels now separate by geometry and physical response instead of merging into one pale cabinet block.
- [improved][soft-furniture read] The lounge keeps open timber rails and now gains visible upholstery compression on the surfaces that occupy the most pixels. Lower-value pillows and throw retain their pattern hierarchy without consuming mobile headroom.
- [checked][360° and collision truth] Display trim follows the glass tilt through side orbit; lounge deformation stays inside the existing visual/collider footprint. No new surface changes walkable space, and the player still completes metre-space movement and camera rotation.
- [checked][responsive performance] Opening, side and reverse desktop views remain `161–166 / 288,220–316,556`; portrait mobile is `98 / 245,044`. The first over-budget version was not retained.
- [P1][character production quality remains visibly below the source] Same-canvas comparison still exposes coarse facial planes, rigid limb/hand acting, simplified garment drape and flatter PBR identity than the reference.
- [P1][remaining furniture construction remains below the source] The hero display and lounge improve, but the record desk, reverse bench, smaller cabinetry, foliage, papers and accessories still lack the source's joinery, thickness, compression and authored wear.
- [P1][indirect light transport remains below the source] Directional hierarchy is stronger, yet the implementation still lacks the reference's soft multi-bounce penumbrae, localized colour bleed and unified skin/cloth/floor integration.

### Gate result

v87 replaces two prominent procedural furniture reads with authored glass/joinery and real soft-surface deformation, then recovers mobile budget without discarding the visible improvement. Walking, orbit, collision truth, atomic loading and responsive performance remain intact. Same-canvas evidence is closer but still not literal production parity in character deformation, complete-room asset finish or indirect-light transport.

final result: blocked

Blocker: production character retopology/UV/deformation, remaining room-wide hero-asset construction and source-level indirect-light transport remain visibly below the selected reference.

## 2026-07-24 reference-fidelity v86 restrained volumetric-face gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Final desktop implementation: `tmp/v86-release-yaw0.png` (`1600 × 900` CSS pixels, device scale factor `1`, `160 / 287,124`, `46°`, `4.8m` opening orbit).
- Mandatory normalized full-view comparison: `tmp/reference-vs-v86.png`; source and implementation are rendered as equal `934 × 525` content panels in one `1900 × 585` comparison canvas.
- Mandatory focused cast comparison: `tmp/reference-vs-v86-cast.png`; source and implementation character groups are inspected at equal `660 × 460` panel scale.
- Full-orbit evidence: `tmp/v86-release-desktop-yaw90.png` (`164 / 313,124`, actor avoidance `0.32m`) and `tmp/v86-release-desktop-yaw180.png` (`165 / 315,460`, actor avoidance `1.142m`, radial clearance `1.427m`).
- Mobile evidence: `tmp/v86-release-mobile-390x844.png` (`390 × 844`, device scale factor `1`, `98 / 244,324`, three-character LOD).
- Physical exploration evidence: `tmp/v86-character-walk.png`; the browser regression walked `5.37m`, completed the movement state transition and rotated the real camera `65.3°`.
- Runtime evidence: all `26` interiors completed `78` atomic transitions with no stale room, black block, duplicate scene, retained physics world or runtime exception. Desktop/mobile scene-flow, character exploration, metre-space physics, asset verification, repository checks and production build passed.

### Comparison history, fixes and post-fix evidence

- [improved / faces read as bright toy assemblies] Sculpt v46 compresses the four role-specific eye apertures, removes the second catchlight, softens lid/brow weights and changes the line family from black to warm charcoal. The final pass restores a larger dark pupil and deeper role-tinted iris so gaze survives minification without returning to pale glass-bead eyes.
- [improved / nose, blush and mouth competed with the eyes] Nose bridge/tip volume and the nose shadow are reduced, blush becomes smaller and lower contrast, and the closed mouth/lower lip use thinner, softer geometry. Three-quarter lighting remains truthful while the opening frame reads as one face rather than stacked primitives.
- [improved / warm wrap made skin orange and plastic] The head material now uses a less saturated, lower-amplitude facing/shadow wrap with reduced velvet highlight and a cooler hand-crease family. Skin remains genuinely lit, morphable geometry and does not depend on a front-only decal.
- [improved / hair highlight ridges looked synthetic] Role highlights are pulled closer to their base hair values, the crown cap gains modestly smoother topology and the five flow ridges become lower-relief. All four GLBs remain under the `2 MiB` per-role budget and total `7.60 MB`.
- [rejected / illustrated face shortcut] `tmp/v86-illustrated-yaw0.png` confirms the atlas-cornea route still produces pale mask seams and broken identity at conversation distance. Production remains on the fully volumetric path.

### Required fidelity surfaces and findings

- [improved][facial hierarchy] Dark iris/pupil values, one restrained glint and thinner secondary marks establish the eyes as the first read while nose, blush and lips stay subordinate.
- [checked][360° character continuity] Every facial surface remains head-attached geometry with real parallax, room light, depth occlusion, gaze and expression morphs. Side and reverse orbit expose no billboard edge or face-card swap.
- [checked][movement, physics and mobile continuity] The `1.72m` player walks `5.37m`, turns the real 3D camera `65.3°`, stays grounded by the authoritative capsule and preserves the same role/collider contract on mobile.
- [checked][responsive performance] Desktop remains `160–165 / 287,124–315,460`; portrait mobile remains `98 / 244,324`, below the `110` calls / `250k` triangle gate.
- [P1][character production quality remains visibly below the source] Same-canvas cast comparison still exposes coarse facial planes, rigid limb/hand acting, simplified garment drape, weaker footwear construction and flatter painted-material identity. Literal parity requires production retopology, role-authored PBR UV sets, facial correctives and garment deformation.
- [P1][whole-room construction remains below the source] The functional composition, real lightwell and material hierarchy are established, but furniture proportions, glass thickness, upholstery compression, paper/foliage density, joinery and authored wear remain simpler.
- [P1][lighting transport remains below the source] The scene has directional portal light, local bounce, contact depth and floor dapple, but still lacks the source's soft multi-bounce penumbrae, localized colour bleed and skin/cloth integration.

### Gate result

v86 improves the most distracting character-surface cues while preserving real 3D movement, full orbit, animation, physics, mobile controls and strict budgets. The mandatory same-canvas comparison is materially closer in hierarchy but still not production-parity in character topology/UV/deformation, bespoke room assets or indirect-light transport.

final result: blocked

Blocker: production character retopology/UV/deformation, complete-room hero-asset construction and source-level indirect-light transport remain visibly below the selected reference.

## 2026-07-24 reference-fidelity v85 side-orbit lightwell and face-path decision gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Final desktop implementation: `tmp/v85-release-yaw0.png` (`1600 × 900` CSS pixels, device scale factor `1`, `160 / 286,660`, `46°`, `4.8m` opening orbit).
- Mandatory normalized full-view comparison: `tmp/reference-vs-v85.png`; source and implementation are rendered as equal `934 × 525` content panels in one `1900 × 585` comparison canvas.
- Side-orbit before/after comparison: `tmp/orbit-v79-vs-v85.png`; both `90°` states are rendered as equal `934 × 525` panels on one canvas.
- Full-orbit evidence: `tmp/v85-release-desktop-yaw90.png` (`164 / 312,660`, actor avoidance `0.32m`) and `tmp/v85-release-desktop-yaw180.png` (`165 / 314,996`, actor avoidance `1.142m`, radial clearance `1.427m`).
- Mobile evidence: `tmp/v85-release-mobile-390x844.png` (`390 × 844`, device scale factor `1`, `98 / 243,976`, three-character LOD).
- Physical exploration evidence: `tmp/v85-character-walk.png`; the browser regression walked `2.37m`, completed the movement state transition and rotated the real camera `65.3°`.
- Runtime evidence: all `26` interiors completed `78` atomic transitions with no stale room, black block, duplicate scene, retained physics world or runtime exception. Desktop/mobile scene-flow, character exploration, metre-space physics, repository checks and production build passed.

### Comparison history, fixes and post-fix evidence

- [rejected / raster face routes looked superficially detailed but broke volume] The existing illustrated-cornea, UV-hybrid, hybrid-volume and curved-atlas modes were captured at the same `1600 × 900` state (`tmp/v80-illustrated-yaw0.png`, `tmp/v80-uv-yaw0.png`, `tmp/v80-hybrid-yaw0.png`, `tmp/v80-atlas-yaw0.png`). All four introduced eye-position drift, pale carrier seams, mask-like expression or weak quarter-view continuity. Production therefore remains on the genuinely sculpted, lit and morphable volume path rather than trading 3D integrity for a sharper front-only image.
- [fixed / 90° orbit exposed a broad undecided plaster sector] A glazed civic side lightwell now occupies the far side wall only through the relevant orbit arc. It reuses the real authored courtyard texture and adds a physical oak arch, plaster reveal, mullions, glass, sill and upholstered pads, so the secondary view gains outdoor depth and a functional pause landmark rather than generic wall decoration.
- [fixed / orbit-only landmark risked polluting the hero and reverse views] The lightwell uses an authored camera reveal arc centred on the `90°` side view. It remains hidden at the `0°` hero composition and `180°` witness composition, preserving the existing story hierarchy while making the intermediate rotation intentional.
- [fixed / first lightwell pass left no draw-call headroom] Its opaque construction is vertex-surface batched while the real courtyard texture and glass remain independent materials. The final side view falls from the unbatched `179` calls to `164`, with the visual result preserved.

### Required fidelity surfaces and findings

- [improved][360° spatial depth] The quarter orbit now carries near record furniture, middle-ground citizens and a bright exterior background. The former full-height empty plane no longer flattens the room or makes the circular shell obvious.
- [checked][truthful affordance] The new element reads as a glazed sitting window, not a second exit: mullions, glass and cushions visually block traversal, it adds no false interaction marker, and it does not alter the authoritative navigation or collider profile.
- [checked][camera-state isolation] `0°` remains `160 / 286,660`; `90°` becomes `164 / 312,660`; `180°` remains inside budget at `165 / 314,996`. The landmark appears only when it provides the far background and never becomes a near-camera obstruction.
- [checked][movement and mobile continuity] The player still walks in the metre-space physics world and turns the real camera. Mobile retains its `98 / 243,976` LOD and does not pay for the desktop-only side landmark.
- [P1][character production quality remains visibly below the source] The face-path comparison confirms that a raster shortcut is not sufficient. Source parity still needs production retopology, painted PBR UVs, facial correctives, more natural hair flow, fingers and garment deformation on the actual moving 3D actors.
- [P1][whole-room construction remains below the source] The side lightwell materially improves one orbit sector, but furniture proportion, transparent thickness, upholstery compression, paper/foliage density, joinery and authored wear remain simpler than the reference.
- [P1][lighting transport remains below the source] The exterior now supplies stronger side-view depth, but the source still has softer multi-bounce penumbrae, richer skin/cloth colour return and more convincing contact integration.

### Gate result

v85 resolves the most obvious secondary-camera emptiness with a functional, textured and performance-safe architectural landmark while explicitly rejecting four face paths that would compromise real 3D movement and orbit continuity. The room remains fully walkable, animated, orbitable and mobile-safe. Same-canvas evidence still shows production-level gaps in character topology/UV/deformation, complete-room bespoke finish and indirect-light transport.

final result: blocked

Blocker: production character sculpt/retopology/UV/deformation, complete-room hero-asset construction and source-level indirect-light transport remain visibly below the selected reference.

## 2026-07-24 reference-fidelity v79 authored-plaster and friendlier-sculpt gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Final desktop implementation: `tmp/v79-plaster-yaw0.png` (`1600 × 900` CSS pixels, device scale factor `1`, `160 / 286,660`, `46°`, `4.8m` opening orbit).
- Mandatory normalized full-view comparison: `tmp/reference-vs-v79.png`; source and implementation are rendered as equal `934 × 525` content panels in one `1900 × 585` comparison canvas.
- Mandatory focused cast comparison: `tmp/reference-vs-v79-cast.png`; source and implementation character groups are inspected at an equal `660 × 460` panel scale.
- Full-orbit evidence: `tmp/v58-desktop-yaw90.png` (`161 / 301,552`, actor avoidance `0.32m`) and `tmp/v58-desktop-yaw180.png` (`164 / 314,996`, actor avoidance `1.362m`, radial clearance `1.55m`).
- Mobile evidence: `tmp/v58-mobile-390x844.png` (`390 × 844`, device scale factor `1`, `98 / 243,976`, three-character LOD).
- Physical exploration evidence: `tmp/v79-character-walk.png`; the browser regression walked `3.97m`, completed the movement state transition and rotated the real camera `65.3°`.
- Runtime evidence: all `26` interiors completed `78` atomic transitions with no stale room, black block, duplicate scene, retained physics world or runtime exception. Desktop/mobile scene-flow, character exploration, metre-space physics, asset verification, repository checks and production build passed.

### Comparison history, fixes and post-fix evidence

- [improved / civic shell read as a flat procedural colour] The public room now atomically loads a real authored lime-plaster base-colour surface (`atelier-lime-plaster-basecolor-v1.jpg`) on desktop and mobile. Fine mineral variation remains visible across opening, side and reverse orbit without becoming a camera-facing overlay.
- [improved / floor light lacked the reference's warm exterior rhythm] The deterministic sun-dapple field now uses a denser but softer warm/cool leaf mask. The honed floor base and contact response were rebalanced so the light pattern reads as outdoor foliage rather than a dark decal.
- [improved / faces were narrow, dark and mask-like] Sculpt v45 widens and rounds the role heads, reduces the jaw pinch, lightens four role-specific skin values and softens eyelid/brow line weight. Arms, legs and hands gain more readable illustrated volume without changing the authoritative `1.72m / 1.68m` character scale.
- [checked / runtime cache invalidation] Civic actors move to the `civic-glb-v9` style key, preventing an already-open room from reusing v44 visuals after the new GLBs are available.
- [checked / performance and movement continuity] Four role assets total `7.61 MB`; opening, side, reverse and mobile frames remain below release budgets. The player still walks in the metre-space Rapier room and rotates the real 3D camera.

### Required fidelity surfaces and findings

- [improved][material hierarchy] The architecture now separates plaster, terrazzo, timber, fabric, paper, ceramic and brass through both authored colour variation and distinct roughness response. The wall no longer depends on a single uniform ivory value.
- [improved][character first read] Broader heads, warmer skin and heavier limb volumes reduce the toy-mask impression and keep role silhouettes readable at the intimate opening lens.
- [checked][360° continuity] The new plaster surface, volumetric faces, hair, garments and role props remain actual room/actor geometry at `0°`, `90°` and `180°`; no billboard replacement or front-only texture card is introduced.
- [checked][mobile and atomic loading] Portrait mobile loads the plaster surface as part of the same ready gate and retains the player, two witnesses, target landmark and complete touch controls at `98 / 243,976`.
- [P1][character production quality remains visibly below the source] Equal-scale cast comparison still exposes rigid mouth/cheek acting, simplified hands, planar garment drape, coarse hair flow and weaker material separation. Source parity requires production retopology, painted UV sets, role-specific facial correctives and garment deformation.
- [P1][whole-room asset construction remains below the source] The implementation now has tactile walls and a coherent functional layout, but the source retains more realistic furniture proportion, glass thickness, upholstery compression, fine stationery/foliage, joinery and authored wear.
- [P1][lighting transport remains below the source] Directional dapple and local bounce are readable, but the source still has softer multi-bounce penumbrae, richer skin/cloth colour return and more convincing contact integration.
- [P2][quarter orbit exposes an under-authored wall sector] At `90°`, the citizen group remains legible but the right third becomes a broad undecorated plaster plane. A later room-shell pass should add a functional wall landmark or architectural reveal without filling it with generic decoration.

### Gate result

v79 replaces another major procedural surface with an authored plaster asset and moves the four playable characters toward the reference's friendly illustrated proportions while preserving real walking, full orbit, atomic room loading, mobile controls and strict budgets. Same-canvas evidence still shows production-level gaps in character topology/UV/deformation, complete-room bespoke finish and indirect-light transport.

final result: blocked

Blocker: production character sculpt/retopology/UV/deformation, complete-room hero-asset construction and source-level indirect-light transport remain visibly below the selected reference.

## 2026-07-24 reference-fidelity v74 four-person composition and selective-depth gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Final desktop implementation: `tmp/v74-composition2-yaw0.png` (`1600 × 900` CSS pixels, device scale factor `1`, `160 / 286,660`, `46°`, `4.8m` opening orbit).
- Mandatory normalized full-view comparison: `tmp/reference-vs-v74.png`; source and implementation are rendered as equal `934 × 525` content panels in one `1900 × 585` comparison canvas.
- Mandatory focused cast comparison: `tmp/reference-vs-v74-cast.png`; source and implementation character groups are inspected at an equal `660 × 460` panel scale.
- Full-orbit evidence: `tmp/v58-desktop-yaw90.png` (`161 / 301,552`, actor avoidance `0.32m`) and `tmp/v58-desktop-yaw180.png` (`164 / 314,996`, actor avoidance `1.142m`, radial clearance `1.427m`).
- Mobile evidence: `tmp/v58-mobile-390x844.png` (`390 × 844`, device scale factor `1`, `98 / 243,976`, three-character LOD).
- Physical exploration evidence: `tmp/v74-character-walk.png`; the browser regression walked `5.37m`, completed the movement state transition and rotated the real camera `65.3°`.
- Runtime evidence: all `26` interiors completed `78` atomic transitions with no stale room, black block, duplicate scene, retained physics world or runtime exception. Desktop/mobile scene-flow, character exploration, repository checks and production build passed.

### Comparison history, fixes and post-fix evidence

- [fixed / four-person hearing read as three people] The rear mediator previously shared almost the same opening sightline as the player, hiding the mediator's body behind the player's head and backpack. The authored opening moves the mediator `0.76m` laterally from the player onto the source image's right-rear story axis; all four role silhouettes are now visible in the same opening frame.
- [improved / room-wide fill erased depth] Civic portal bounce drops from `1.42` to `1.22`, camera-side fill from `0.88` to `0.34` and broad rim energy from `0.58` to `0.44`. A small face-material wrap compensates only on the sculpted head, retaining eye/cheek readability while restoring furniture, cloth and floor-plane separation.
- [checked / authored composition survives movement] A regression assertion now requires at least `0.65m` lateral separation between the player and rear mediator in the QA opening. The actual scene passes at `0.76m`, and the same four real actors continue to walk, gesture, listen and rotate under the shared physical/animation contracts.
- [checked / side, reverse and mobile behavior] Quarter orbit remains intimate at `6.231m`; reverse orbit expands to `7.4m` rather than hiding a citizen. Portrait mobile retains the three-character LOD, player, target landmark and complete touch controls inside the existing performance gate.

### Required fidelity surfaces and findings

- [fixed][first-read story composition] The opening now communicates a four-role civic hearing without requiring labels. Player anchors the foreground, listener and facilitator define the near left/right dialogue edges, and the mediator supplies a complete right-rear depth layer against the evidence wall.
- [improved][lighting hierarchy] Lower global fill restores modelling on the notice wall, lounge and character garments. The sculpted skin shader adds restrained facing/shadow wrap so the face does not become the price of recovering room depth.
- [checked][physics and navigation continuity] Only the authored staging point changed; the physics world still validates each position, keeps citizen capsules separate and preserves the central movement route. The player walks `5.37m` and turns the real camera `65.3°`.
- [checked][responsive performance] Desktop remains `160–164 / 286,660–314,996`; mobile remains `98 / 243,976`, below `110` calls / `250k` triangles. No new geometry or texture was added in this composition pass.
- [P1][character production quality remains below the source] The cast comparison is now compositionally honest, but still exposes coarser skull/cheek topology, hair flow, fingers, garment drape and footwear materials than the reference.
- [P1][environment finish remains below the source] Functional density is present, but furniture proportion, transparent glass, upholstered deformation, stationery/foliage detail and authored wear remain visibly simpler.
- [P1][indirect light transport remains below the source] Selective depth is better, but the reference retains softer multi-bounce penumbrae, localized colour bleed and more convincing contact integration.

### Gate result

v74 corrects the opening's hidden fourth participant and restores room depth without sacrificing facial readability. The complete scene remains walkable, animated, orbitable, mobile-safe and below performance budgets. Same-canvas evidence still shows production-level gaps in character sculpt/UV/deformation, complete-room bespoke finish and indirect-light transport.

final result: blocked

Blocker: production character sculpt/retopology/UV/deformation, complete-room hero-asset finish and source-level indirect-light transport remain visibly below the selected reference.

## 2026-07-24 reference-fidelity v73 facial-read, hair-silhouette and character-surface gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Final desktop implementation: `tmp/v73a-desktop-yaw0.png` (`1600 × 900` CSS pixels, device scale factor `1`, `161 / 286,660`, `46°`, `4.8m` opening orbit).
- Mandatory normalized full-view comparison: `tmp/reference-vs-v73.png`; source and implementation are rendered as equal `934 × 525` content panels in one `1900 × 585` comparison canvas.
- Mandatory focused cast comparison: `tmp/reference-vs-v73-cast.png`; source and implementation character groups are inspected at an equal `660 × 460` panel scale.
- Full-orbit evidence: `tmp/v58-desktop-yaw90.png` (`161 / 301,552`, actor avoidance `0.411m`) and `tmp/v58-desktop-yaw180.png` (`164 / 314,996`, actor avoidance `1.142m`, radial clearance `1.427m`).
- Mobile evidence: `tmp/v58-mobile-390x844.png` (`390 × 844`, device scale factor `1`, `98 / 243,976`, three-character LOD).
- Physical exploration evidence: `tmp/v73-character-walk.png`; the browser regression walked `5.37m`, completed the movement state transition and rotated the real camera `65.3°`.
- Runtime evidence: all `26` interiors completed `78` atomic transitions with no stale room, black block, duplicate scene, retained physics world or runtime exception. Desktop/mobile scene-flow, metre-space physics, character assets, civic props, repository checks and production build passed.

### Comparison history, fixes and post-fix evidence

- [improved / gameplay faces collapsed at conversation distance] Sculpt v44 increases the four role-specific eye apertures, iris/pupil area, glints and mouth width while preserving physically lit volumetric sclera, lids, gaze and expression morphs. The equal-scale cast comparison now retains eye direction and mouth rhythm without reintroducing a screen-space face card.
- [improved / hair read as faceted caps in orbit] Crown topology increases from `40 × 26` to `48 × 30`, and fringe, side, spike, rear, ponytail and braid locks receive denser circular profiles. The mediator gains a five-piece nape transition so her bob remains continuous from side and reverse viewpoints.
- [improved / hands remained featureless mittens] Hand v4 adds shallow physical life-line and heart-line surface geometry to each palm. These details follow the articulated hand pivots and survive real gesture/notebook animation rather than being painted onto the screen.
- [improved / footwear lacked construction hierarchy] Footwear v3 adds outer quarter panels, toe bumpers, a third lace row and ankle-boot pull tabs. Facilitator and mediator cardigans also gain neck and front-edge ribs, creating clearer cloth layering at gameplay distance.
- [checked / budgets and complete runtime] Four v44 role GLBs total `7.58 MB`; player/listener/facilitator/mediator contain `36,372 / 34,952 / 40,008 / 39,230` authored triangles. Opening, side, reverse and mobile frames remain below their release budgets.

### Required fidelity surfaces and findings

- [improved][character first read] Enlarged eyes and controlled glints make listening direction clearer in the authored opening, while role-specific hair and garment edges remain readable without depending on colour alone.
- [checked][360° surface continuity] Hair, palm creases, shoe panels, cardigan ribs and all role props are real meshes attached to the shared articulated hierarchy. Side and reverse orbit reveal no billboard edge, detached detail card or front-only identity swap.
- [checked][movement and interaction continuity] The `1.72m` player remains grounded while walking and turning the actual camera. Palm and footwear additions preserve the existing wrist, hand-object, ankle and foot-contact contracts; no collider or interaction anchor diverges from the visible actor.
- [checked][responsive performance] Desktop peaks at `164 / 314,996`; mobile remains `98 / 243,976`, below `110` calls / `250k` triangles. The portrait layout retains the player, two witnesses, target landmark and complete touch controls.
- [P1][character topology and materials remain below the source] The focused comparison still exposes blockier skull/cheek planes, coarser hair flow, simplified garment drape and rigid hands compared with the reference. Literal parity needs a production sculpt/retopology pass, painted PBR UVs, facial correctives and garment-specific deformation.
- [P1][environment finish remains below the source] The room has coherent zoning and authored hero furniture, but the source retains subtler furniture proportion, denser hand-authored stationery/foliage, transparent glass thickness, upholstery compression and material aging.
- [P1][indirect light transport remains below the source] Portal key, local bounce and GTAO preserve hierarchy, but the source still has softer multi-bounce penumbrae, richer skin/cloth colour return and more integrated sunlight.

### Gate result

v73 improves the production actors where the opening and orbit exposed the largest surface gaps: facial readability, hair continuity, palm definition, footwear construction and cardigan finish. The room remains fully walkable, animated, orbitable, mobile-safe and inside strict performance budgets. The required same-canvas comparisons still expose production-level differences in character sculpt/UV/deformation, whole-room bespoke finish and indirect light transport.

final result: blocked

Blocker: production character sculpt/retopology/UV/deformation, complete-room hero-asset finish and source-level indirect-light transport remain visibly below the selected reference.

## 2026-07-23 reference-fidelity v72 role-body, garment-silhouette and reverse-orbit gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Final desktop implementation: `tmp/v72-release-desktop-yaw0.png` (`1600 × 900` CSS pixels, device scale factor `1`, `160 / 277,596`, `46°`, `4.8m` opening orbit).
- Mandatory normalized full-view comparison: `tmp/reference-vs-v72.png`; source and implementation are rendered as equal `934 × 525` content panels in one `1900 × 585` comparison canvas.
- Mandatory focused cast comparison: `tmp/reference-vs-v72-cast.png`; source and implementation character groups are inspected at an equal `660 × 460` panel scale.
- Full-orbit evidence: `tmp/v72-mix-desktop-yaw90.png` (`161 / 292,488`, actor avoidance `0.32m`, no radial pullback) and `tmp/v72-mix-desktop-yaw180.png` (`164 / 305,932`, actor avoidance `1.142m`, radial clearance `1.427m`).
- Mobile evidence: `tmp/v72-mix-mobile-390x844.png` (`390 × 844`, device scale factor `1`, `98 / 237,728`, three-character LOD).
- Physical exploration evidence: `tmp/v72-character-walk.png`; the browser regression walked `5.37m`, completed the movement state transition and rotated the real camera `65.3°`.
- Runtime evidence: all `26` interiors completed `78` atomic transitions with no stale room, black block, duplicate scene, retained physics world or runtime exception. Desktop/mobile scene-flow, metre-space physics, character assets, civic props, repository checks and production build passed.

### Comparison history, fixes and post-fix evidence

- [fixed / four roles inherited one generic body] Sculpt v43 introduces role-owned torso width/depth/height, shoulder and hip placement, waist taper, arm and leg dimensions, hand scale, head scale and shoulder slope. The player, listener, facilitator and mediator no longer read as the same mannequin with colour swaps.
- [improved / civic women depended on hair colour for identity] The facilitator receives a longer flared skirt, fitted long coat and shoulder yoke. The mediator receives a shorter skirt, cropped jacket, waist sash and physical knot. These are orbit-safe garment meshes on the actual animated actors, not screen-space decoration.
- [improved / rig proportions ignored the authored silhouette] Armature shoulders and hips, continuous skinned limbs, cuffs, hands and controller pivots now derive from the same body profile as visible anatomy. Walk, gesture, notebook hold and idle continue to use the shared animation contract without separating hands from the role-specific body.
- [fixed / reverse orbit produced a full-frame witness shoulder] The camera now combines fast tangent avoidance with reverse-angle-weighted radial clearance. Quarter orbit retains the intimate `6.231m` composition, while the reverse arc expands to `7.4m`, keeping all four citizens, the social centre and room landmarks visible without translucent or disappearing characters.
- [checked / performance and complete runtime] Four role GLBs total `7.25 MB`; player/listener/facilitator/mediator remain within individual asset gates at `34,156 / 32,992 / 37,904 / 36,638` authored triangles. Opening, side, reverse and mobile frames remain below their release budgets.

### Required fidelity surfaces and findings

- [improved][character role readability] The equal-scale cast comparison shows clearer differences in shoulder width, torso length, leg proportion, skirt length and outerwear silhouette. The player backpack, listener satchel, facilitator notebook and mediator sash remain readable from the authored opening and side orbit.
- [checked][physical movement and hand-object contact] The `1.72m` player walks inside the same metre-space room, remains grounded and turns the real camera. Role-specific armatures preserve planted feet, hand pivots and the notebook interaction while colliders and authored interaction anchors remain unchanged.
- [improved][360° composition] `0°` keeps the intimate reference-led conversation frame, `90°` uses a restrained `0.32m` lateral correction, and `180°` widens only as much as needed to keep the closest witness from becoming a visual wall. No actor fade, sprite substitution or camera teleport is used.
- [checked][responsive UI and budgets] Desktop action controls remain below the social centre; the portrait layout preserves the player, two partners, listening landmark, joystick and action rail. Desktop peaks at `164 / 305,932`; mobile remains `98 / 237,728`.
- [P1][character surface fidelity remains below the source] The role-owned body contract fixes mannequin sameness, but the focused comparison still exposes blockier skull/cheek transitions, hair roots, fingers, shoe construction, cloth folds, hems and hand-object contact than the reference. Literal parity requires production character topology, painted UV sets, facial correctives and garment-specific deformation.
- [P1][environment finish remains below the source] Functional zoning, bespoke hero furniture, foliage and textile joinery are coherent, but the reference retains denser foreground stationery, finer wood/glass construction, more natural upholstery deformation and stronger material aging.
- [P1][lighting transport remains below the source] The portal key, local warm/cool bounces, GTAO and mineral floor establish hierarchy, but the reference still has softer multi-bounce penumbrae, richer skin/cloth colour return and more convincing sun integration.

### Gate result

v72 removes the shared-mannequin character contract, gives all four social roles measurable body identity, adds role-authored facilitator/mediator garment construction and resolves the worst reverse-orbit obstruction without hiding citizens. The complete 3D room remains walkable, animated, mobile-safe and inside performance budgets. The required same-canvas comparisons still expose production-level differences in character surface topology, whole-room bespoke finish and indirect light transport.

final result: blocked

Blocker: production character topology/UV/deformation, complete-room hero-asset finish and source-level indirect-light transport remain visibly below the selected reference.

## 2026-07-23 reference-fidelity v71 broadleaf, textile-joinery and local-bounce gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Final desktop implementation: `tmp/v71-desktop-yaw0.png` (`1600 × 900` CSS pixels, device scale factor `1`, `160 / 277,200`, `46°`, `4.8m` opening orbit).
- Mandatory normalized full-view comparison: `tmp/reference-vs-v71.png`; source and implementation are both rendered as `934 × 525` content panels in one `1900 × 585` comparison canvas.
- Full-orbit evidence: `tmp/v71-desktop-yaw90.png` (`161 / 292,092`, `52.12°`, `5.415m`, actor avoidance `0.354m`) and `tmp/v71-desktop-yaw180.png` (`163 / 290,644`, `52°`, `5.55m`, actor avoidance `0.31m`).
- Mobile evidence: `tmp/v71-mobile-390x844.png` (`390 × 844`, device scale factor `1`, `98 / 237,632`, three-character LOD).
- Physical exploration evidence: `tmp/v71-character-walk.png`; the browser regression walked `4.29m`, completed the movement state transition and rotated the real camera `65.3°`.
- Runtime evidence: all `26` interiors completed `78` atomic transitions with no stale room, black block, duplicate scene, retained physics world or runtime exception. Desktop and mobile scene-flow checks passed.

### Comparison history, fixes and post-fix evidence

- [fixed / mature plants still read as scaled capsules] Civic editorial foliage now uses authored ovate blades with tapered silhouettes, a real central fold, longitudinal bow, visible midrib, varied tilt and wider clustered crowns. Ceramic and woven planters remain against fixed room edges, so the added density does not create a false walkable opening.
- [improved / lounge textiles looked like detached toy pieces] The Blender-authored sofa now has thick rounded cushions, inset fronts, raised geometric bands and dots, a folded striped throw, piping, seams and compression details. These are real orbit-safe meshes, not a screen-facing decal.
- [improved / lounge lacked object-level storytelling] The coffee table gains a coaster, readable story card and line hierarchy alongside the cup, books and bookmark. The lounge GLB grows from `126 / 17,360` to `141 / 19,732` authored meshes/triangles while remaining a single normalized hero asset and inside runtime budgets.
- [improved / right-side rest zone dissolved into the ivory floor] The tea-table zone now sits on a physically thick blue woven oval with two inlaid textile borders. A second ceramic cup, handle and coaster establish human use and make the lounge legible at the opening camera and reverse orbit.
- [improved / doorway warmth and teal furniture felt disconnected] Two restrained non-shadowing local bounces now return warm portal colour at floor height and cool teal colour around the lounge. They preserve the existing directional key and contact shadows instead of replacing them with a global exposure lift.
- [checked / budgets and complete runtime] The three civic hero assets total `51,416` authored triangles. Desktop remains below `180` calls / `450k` triangles and mobile below `110` / `250k`; the complete movement, camera, physics, scene-flow and atomic-transition contracts remain intact.

### Required fidelity surfaces and findings

- [improved][first read and composition] The four-person listening circle remains the first read. The portal and broadleaf cluster now provide a warmer left background frame, while the patterned teal lounge and blue rug form a clearer right counterweight. Foreground display/record furniture continues to frame rather than block the player.
- [improved][material and micro-asset hierarchy] Wood joinery, woven textile, ceramic, paper, brass, glass and foliage now separate more clearly at gameplay distance. The lounge no longer depends on flat colour blocks to imply upholstery or use.
- [checked][full orbit, movement and affordance] At `0°`, `90°` and `180°`, the player, current social group and at least one authored landmark remain readable. New foliage and lounge details stay outside the main route and do not modify or diverge from the authoritative collider footprint.
- [checked][responsive behavior and UI] The `390 × 844` composition preserves the listening wall, player and two partners, with practical joystick, jump, chat, interaction and action-rail targets. The environmental detail pass adds no mobile obstruction or over-budget geometry.
- [P1][character topology and acting remain below the source] The same-canvas comparison still exposes simpler role-specific skulls, hair roots, garment drape, fingers, shoe construction, facial deformation and hand-object contact. The next material leap requires role-authored body/garment topology and corrective poses rather than another shared-primitive pass.
- [P1][source-level environment finish remains incomplete] The new lounge and plants close the most visible procedural gaps, but the reference still has denser foreground stationery, transparent glass thickness, upholstered deformation, fine joinery, edge wear and a more coherent set of bespoke hero props across the entire room.
- [P1][indirect transport remains below the source] The localized bounces improve colour continuity, but the reference retains softer multi-bounce penumbrae, more convincing sunlight integration and richer contact colour between skin, cloth, timber, mineral floor and wall reveals.
- [P2][reverse-orbit foreground actor remains visually heavy] At `180°`, the nearest mediator still occupies a large lower-frame area. The room stays navigable and the central target remains visible, but a later camera pass should use screen-space shoulder avoidance or restrained foreground actor fade.

### Gate result

v71 materially improves the environment layer that was most visibly procedural: broadleaf vegetation, woven/ceramic planters, constructed upholstery, patterned cushions, table storytelling, a real lounge rug and localized portal/lounge colour return. The room remains fully walkable and orbitable, mobile-safe and within strict performance budgets. The normalized comparison still exposes P1 differences in production character topology, complete-room hero-asset density and source-level indirect transport.

final result: blocked

Blocker: role-authored character/garment topology, whole-room bespoke asset finish and source-level indirect-light transport remain visibly below the selected reference.

## 2026-07-23 reference-fidelity v70 volumetric-face, intimate-camera and mineral-surface gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Final desktop implementation: `tmp/v70-final-desktop-yaw0.png` (`1600 × 900` CSS pixels, device scale factor `1`, `157 / 281,912`, `46°`, `4.8m` opening orbit).
- Mandatory normalized full-view comparison: `tmp/reference-vs-v70.png`; source and implementation are both rendered as `934 × 525` content panels in one `1900 × 585` comparison canvas.
- Mandatory focused cast comparison: `tmp/reference-vs-v70-cast.png`; the source and implementation character groups are inspected at an equal `660 × 460` panel scale.
- Full-orbit evidence: `tmp/v70-final-desktop-yaw90.png` (`158 / 296,804`, `52.12°`, `5.415m`, actor avoidance `0.354m`) and `tmp/v70-final-desktop-yaw180.png` (`161 / 295,356`, `52°`, `5.55m`, actor avoidance `0.31m`).
- Mobile evidence: `tmp/v70-final-mobile-390x844.png` (`390 × 844`, device scale factor `1`, `95 / 236,106`, three-character LOD).
- Physical exploration evidence: `tmp/v70-character-walk.png`; the browser regression walked `5.37m`, completed gesture/walk/idle and facial-expression transitions, and rotated the real camera `65.3°`.
- Runtime evidence: all `26` interiors completed `78` atomic transitions with no stale room, black block, duplicate scene, retained physics world or runtime exception. Desktop and mobile scene-flow checks passed.

### Comparison history, fixes and post-fix evidence

- [fixed / v69 premium portrait layer created a pale face mask] Production no longer uses the curved raster layer. Sculpt v42 keeps the face inside the real head hierarchy: role-specific head volume, eyelids, sclera, irises, pupils, brows, nose, lips and cheek planes all receive room light, depth, occlusion, expression morphs and full-orbit parallax. Legacy atlas modes remain explicit QA options only.
- [improved / previous volumetric fallback read as tiny robotic eyes] All four role profiles now have larger almond-shaped sclera, proportionate irises and pupils, stronger upper contours, clearer brows, a subtle lower lip and nose shadow. Skin values are warmer and less clipped; each role preserves distinct eye aperture, brow rhythm, mouth and cheek volume.
- [improved / citizens read as miniature props inside the room] The desktop opening moves from a `5.55m / 48°` orbit to `4.8m / 46°`, with a lower `2.672m` camera. The cast now owns the middle ground at a scale materially closer to the reference. Side and rear arcs progressively widen and retreat to retain safe 360° exploration rather than applying the intimate distance globally.
- [improved / cardigan layers clipped to white vertical bars] Facilitator and mediator outer cloth moves to deeper oatmeal values, retaining cream identity while making lapels, sleeves and dress layers readable under the portal key.
- [improved / floor competed with faces and furniture] The photographed terrazzo remains the real surface asset, but its material shifts from cold grey to warm honed mineral, with bump reduced from `0.016` to `0.007`, roughness from `0.78` to `0.70`, and environment response raised from `0.44` to `0.60`.
- [checked / asset and performance budgets] Four sculpt-v42 role GLBs total `7.23 MB`; each remains below the `2 MiB` gate. The intimate desktop frame remains below `180` calls / `450k` triangles and mobile remains below `110` / `250k`.

### Required fidelity surfaces and findings

- [checked][fonts, typography, copy and icons] The compact Chinese HUD, room-memory card, interaction markers and action labels preserve the existing product typography and content hierarchy. No label clips in the `1600 × 900` or `390 × 844` evidence; the primary actions remain keyboard and touch reachable.
- [improved][spacing, layout rhythm and composition] The closer lens removes excess empty foreground and makes the player/listening circle the first read. The entrance, listening wall and lounge remain background landmarks, while the display case and record desk provide foreground framing. Side/rear easing prevents the same camera distance from becoming obstructive during rotation.
- [checked][viewport resilience and interactions] Desktop opening, quarter orbit, reverse orbit, portrait mobile, gesture, walking and camera-drag states remain functional. Mobile controls do not cover the player or current target, and the action rail remains usable.
- [improved][colors, tokens and material response] Warm neutral architecture remains dominant, teal carries civic identity, and coral/gold marks actors and actions. Skin and oatmeal cloth separate more clearly from plaster; terrazzo is quieter and more polished while wood, fabric, paper, ceramic and metal preserve distinct roughness.
- [fixed][image quality / facial asset integration] The visible raster halo and mask are removed from the production path. Faces are real 3D geometry, not billboards, sprites, CSS art or a photographed facial card.
- [checked][copy/content and behavior] The civic listening objective, room memory, four actions and interaction prompt remain coherent with the playable social scene. Suggest, listen, guide and leave continue to drive real character and narrative states.
- [P1][production character topology and deformation remain below the source] The focused cast comparison still shows simpler skull/cheek transitions, hair roots, fingers, shoe construction, cloth drape, elbows and hand-object contact. The current shared-pivot/continuous-limb rig is playable and materially improved, but source-level parity needs role-authored topology, facial blendshape correctives and garment-specific skinning.
- [P1][environment asset density and joinery remain below the source] The reference contains finer sofa/cabinet joinery, transparent glass thickness, denser foliage, textiles, stationery, ceramics and authored wear. The implementation remains visibly more procedural and lower frequency despite having the same functional zones.
- [P1][indirect light transport remains below the source] Real-time portal key, fill, bounce, GTAO and dapple establish direction, but the reference still has softer multi-bounce penumbrae, localized colour bleed and more convincing contact integration across skin, cloth, floor and furniture.
- [P2][reverse-orbit foreground actor remains visually heavy] At `180°`, the nearest mediator occupies a large lower-frame area even after `0.31m` tangential avoidance. The player and target remain visible, but the next camera pass should add screen-space capsule avoidance or a temporary shoulder fade rather than hiding the actor.

### Gate result

v70 removes the most damaging facial-mask artifact, restores genuinely volumetric role faces, brings the story camera and cast scale much closer to the selected reference, and improves cloth/floor separation without compromising real walking, full orbit, atomic loading, mobile controls or performance budgets. The normalized full-view and focused comparisons still expose actionable P1 differences in production character topology, environment micro-assets and source-level indirect transport.

final result: blocked

Blocker: role-authored character/garment topology, environment asset density and source-level indirect-light transport remain visibly below the selected reference.

## 2026-07-23 reference-fidelity v69 premium portrait, garment identity and soft-transport gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Final desktop opening: `tmp/v69-final2-desktop-yaw0.png` (`1600 × 900`, `149 / 269,736`, `48°`, `5.55m` orbit).
- Mandatory same-canvas evidence: `tmp/reference-vs-v69.png`; source and implementation are normalized into equal-width panels in one comparison image.
- Mandatory focused cast comparison: `tmp/reference-vs-v69-cast.png`; source and implementation character groups are inspected at the same panel scale.
- Full-orbit evidence: `tmp/v69-final2-desktop-yaw90.png` (`150 / 284,628`, actor avoidance `0.214m`) and `tmp/v69-final2-desktop-yaw180.png` (`152 / 283,180`, actor avoidance `0.31m`).
- Mobile evidence: `tmp/v69-final2-mobile-390x844.png` (`390 × 844`, `101 / 228,150`, three-character LOD).
- Physical exploration evidence: `tmp/v69-character-walk.png`; the browser regression walked `5.37m`, completed action/walk/idle transitions and rotated the real user camera `65.3°`.

### Comparison history, fixes and post-fix evidence

- [improved / inherited atlas retained oversized anime eyes and a pale rectangular face halo] A new four-role premium portrait atlas is grounded directly in the source's softer sculpted character language. Runtime crops the role cell to useful facial density and derives transparency from colour distance while explicitly preserving warm sclera, removing the studio-white carrier field without returning to generic procedural faces.
- [checked / face remains part of the moving 3D actor] The role texture is mapped onto the curved head-attached face surface, with the volumetric skull, hair and two physically lit corneas retained. It receives depth, occlusion and orbit parallax and does not become a camera-facing sprite or billboard.
- [improved / listener garment construction read as a white skeleton] Sculpt v41 moves the jacket centre seam, hem, drawstrings, pocket welts and cross-body strap into a narrow dark construction language. The teal jacket remains dominant while the oatmeal hood reads as a separate soft layer.
- [improved / civic women lacked garment-level role identity] Facilitator and mediator cardigans move from clipped ivory to warmer oatmeal cloth. The mediator gains three low-profile embroidered dress motifs built on the actual garment surface; role distinction no longer relies on hair colour alone.
- [improved / room light retained hard digital separation] The civic preset redistributes energy from the portal key into warm floor bounce, restrained cool fill and ambient wash. Larger VSM filtering, moderated face lift, stronger localized portal bounce and balanced GTAO create softer penumbrae while preserving grounded character and furniture contact.
- [checked / complete runtime] Four sculpt-v41 GLBs total `7.60 MB`; the premium face texture and integration contracts, civic hero props, 26-zone metre-space physics, `78` atomic room transitions, desktop/mobile scene flow, real movement/camera drag, repository checks and production build remain within release budgets.

### Required fidelity surfaces and findings

- [checked][typography, UI, copy and interaction hierarchy] The restrained HUD, room-memory card, desktop action deck and portrait action rail remain unchanged, readable and operational. The facial and lighting pass introduces no UI collision or gameplay affordance regression.
- [checked][spacing, layout and viewport resilience] The player-led orbit continues to preserve the entrance, conversation centre and authored foreground/midground/background landmarks. The `390 × 844` layout keeps the social centre walkable and retains practical mobile controls.
- [improved][colour, material and lighting hierarchy] Warmer plaster, darker mineral terrazzo, teal civic furniture, oatmeal cloth and restrained coral/gold accents move closer to the source's premium editorial warmth. Wood, cloth, paper, glass, terrazzo and metal still receive distinct roughness and light responses.
- [checked][physical and camera continuity] The `1.72m` player walks `5.37m`, returns to idle and turns the actual camera `65.3°` inside the same metre-space room. At `0°`, `90°` and `180°`, the player, listening target and a designed landmark remain readable without entering furniture.
- [checked][atomic transitions and responsive performance] All `26` interiors complete `78` enter/exit transitions without stale backgrounds, black blocks, duplicate rooms, runtime exceptions or retained physics worlds. Desktop remains at `149–152` calls and `269,736–284,628` triangles; mobile remains `101 / 228,150`.
- [P1][character asset fidelity remains below the source] The new atlas and garment pass substantially improve first-read identity, but the focused cast comparison still exposes simpler skull/cheek topology, hair roots, eyelids, fingers, footwear, cloth silhouettes and hand-object contact. Literal parity requires role-authored body, head and garment meshes with final UV texture sets and corrective poses.
- [P1][environment asset fidelity and indirect transport remain below the source] The room is coherent, dense and playable, but the reference still has finer furniture joinery, richer foliage, transparent glass, paper/ceramic microdetail and stronger localized multi-bounce colour transport.
- [P2][facial integration remains a hybrid curved surface] The premium atlas follows a real moving head and survives full orbit, but close quarter views can still distinguish the illustrated facial layer from a final role-painted head UV. The approved identity should ultimately be baked into role-specific head textures after topology lock.

### Gate result

v69 improves facial taste, role readability, clothing construction and soft daylight transport while preserving the complete walkable 3D room, full orbit, mobile controls, atomic scene loading and performance budgets. The mandatory same-canvas comparisons still expose P1 gaps in production character topology, environment microdetail and source-level indirect light, so literal reference-quality parity is not yet proven.

final result: blocked

Blocker: role-authored character/furniture surfaces and source-level indirect-light transport remain visibly below the reference.

## 2026-07-23 reference-fidelity v68 illustrated-cornea, civic lounge and orbit-clearance gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Final desktop opening: `tmp/v68-final-yaw0.png` (`1600 × 900`, `149 / 269,712`, `48°`, `5.55m` orbit).
- Mandatory same-canvas evidence: `tmp/reference-vs-v68.png`; source and implementation are normalized to equal `16:9` panels in one comparison image.
- Mandatory focused cast comparison: `tmp/reference-vs-v68-cast.png`; source and implementation character groups are inspected at the same panel scale.
- Full-orbit evidence: `tmp/v68-final-desktop-yaw90.png` (`150 / 284,604`, `52.41°`) and `tmp/v68-final-desktop-yaw180.png` (`152 / 283,156`, `52°`).
- Mobile evidence: `tmp/v68-final-mobile-390x844.png` (`390 × 844`, `101 / 228,150`, three-character LOD).
- Physical exploration evidence: `tmp/v68-character-walk.png`; the browser regression walked `5.37m`, completed action/walk/idle transitions and rotated the user camera `65.3°`.

### Comparison history, fixes and post-fix evidence

- [fixed / baked head UV reduced role identity at gameplay distance] Production now uses `illustrated-cornea-v2`: each role's existing face atlas is cropped into a higher-density texture and mapped to a curved, head-attached facial surface. The underlying skull, hair and head remain volumetric, while two real clearcoat corneas provide moving highlights, occlusion and orbit parallax. This is not a billboard or sprite fallback.
- [improved / v67 eyes and head read as narrow, dark toy faces] Sculpt v40 lightens the role skin values, reduces aperture, iris, pupil and glint size, and increases the cranial mass modestly. Brows, blush, nose and mouth remain role-specific while the eye-to-cheek relationship is calmer and closer to the illustrated reference.
- [improved / opening camera crowded the conversation centre] The desktop civic orbit moves from `5.2m` to `5.55m`; height and focus are raised while the weighted player-led pivot remains intact. Side/reverse actor avoidance expands to a `1.7m` corridor and reaches `0.31m` at `180°`, keeping the player and listening circle readable without teleporting citizens.
- [improved / public lounge lacked a reference-like middle-ground still life] A physical oval tea table now fills the right lounge with a plant and reading material. Its render transform, collider and interaction anchor come from the same `ZoneLayoutProfile`, preserving the route and removing the possibility of a visual-only obstacle.
- [improved / room retained orange plastic warmth] Plaster and terrazzo are cooler and more neutral; contact shadows are softened; the portal key, warm bounce, face lift and cool fill establish a clearer daylight hierarchy. The lighter record-desk trim and right-lounge table reduce the previous single-tone furniture field.
- [checked / complete runtime] Four sculpt-v40 GLBs total `7.58 MB`; character contracts, civic props, 26-zone physics, `78` atomic room transitions, desktop/mobile scene flow, real movement/camera drag, syntax, repository checks and production build remain within the release budgets.

### Required fidelity surfaces and findings

- [checked][typography, content, icons and interaction hierarchy] The restrained top HUD, room memory card, desktop action deck and portrait action rail remain legible and functional. No interaction labels collide with the three-character mobile view, and the core listen/propose/guide/leave controls preserve the existing product language.
- [checked][spacing, layout and viewport resilience] The wider desktop orbit improves foreground/midground/background separation: record furniture frames the foreground, the four-person listening circle owns the middle, and portal/lounge/listening-wall landmarks define the background. At `390 × 844`, the story centre remains walkable and the mobile controls retain practical tap targets.
- [checked][colour and material hierarchy] Warm neutral architecture remains the dominant field, teal identifies civic furniture and clothing, and coral/gold mark social evidence and actions. Wood, terrazzo, paper, cloth, glass and metal retain distinct roughness responses rather than collapsing into one colour family.
- [checked][physical and camera continuity] The `1.72m` player walks `5.37m` in the metre-space room, returns to idle, rotates the actual camera `65.3°`, and stays grounded. The new tea table is both rendered and collidable; `90°` and `180°` views preserve the player, active target and at least one authored landmark.
- [checked][atomic transitions and responsive performance] All `26` interiors completed `78` enter/exit transitions without stale backgrounds, black blocks, duplicate rooms, runtime exceptions or retained physics worlds. Desktop remains at `149–152` calls and `269,712–284,604` triangles; mobile remains `101 / 228,150`.
- [P1][role-authored character topology and surface finish remain below the source] Illustrated-cornea v2 restores identity and the gameplay face scale, but the same-canvas cast still exposes simpler eyelid-to-cheek flow, hair roots, fingers, shoes, garment construction, cloth compression and hand-object contact. Literal parity needs role-specific head/garment topology, authored UV texture sets and corrective poses rather than another parameter-only sculpt pass.
- [P1][furniture microdetail and indirect transport remain below the source] The room now has a stronger civic lounge, authored foreground and coherent functional density, but the reference retains finer joinery, denser paper/glass/ceramic/foliage storytelling, softer multi-bounce penumbrae and richer localized colour bleed.
- [P2][facial integration remains a hybrid surface treatment] The curved carrier follows the real head and survives full orbit with true corneal depth, but extreme close quarter views can still distinguish the illustrated face surface from a fully painted role head. The next character-art pass should bake the final repainted identity directly into role-specific head UVs after the topology is approved.

### Gate result

v68 materially improves role identity at gameplay distance, eye/head proportion, public-room camera clearance, right-lounge density, physical furniture consistency and warm-daylight hierarchy while preserving the complete walkable 3D world, full orbit, mobile controls and atomic room transitions. The required same-canvas comparisons still expose actionable P1 gaps in production character topology/texture finish, furniture microdetail and source-level indirect-light transport, so literal reference-quality parity is not yet proven.

final result: blocked

Blocker: role-authored character/furniture surfaces and source-level indirect-light transport remain visibly below the reference.

## 2026-07-23 reference-fidelity v67 head-UV identity, volumetric-eye and directional-light gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Final desktop opening: `tmp/v67-final-yaw0.png` (`1600 × 900`, `148 / 276,544`, `48°`, `5.2m` orbit).
- Mandatory same-canvas evidence: `tmp/reference-vs-v67.png`; source and implementation are normalized to equal `16:9` panels in one comparison image.
- Mandatory focused cast comparison: `tmp/reference-vs-v67-cast.png`; the source and implementation character groups are inspected at equal panel scale.
- Full-orbit evidence: `tmp/v67-final-desktop-yaw90.png` (`149 / 291,436`, `52.41°`) and `tmp/v67-final-desktop-yaw180.png` (`151 / 289,988`, `52°`).
- Mobile evidence: `tmp/v67-final-mobile-390x844.png` (`390 × 844`, `101 / 231,726`, three-character LOD).
- Physical exploration evidence: `tmp/v67-character-walk.png`; the browser regression walked `5.09m`, completed action/walk/idle transitions and rotated the user camera `65.3°`.

### Comparison history, fixes and post-fix evidence

- [fixed / illustrated identity still lived on a curved card] The production face no longer renders the role atlas on a separate carrier. Each role's brow, blush, nose and mouth are baked into the real morphable head UV; the exported sclera, iris and eyelids remain volumetric, physically lit, gaze-capable and blink-capable. The `90°` and `180°` evidence has no carrier edge or front-only face swap.
- [fixed / choosing full volume discarded the existing 2D avatar language] The v67 UV-hybrid path reuses the existing four-role face asset instead of replacing it with one generic procedural face. Four head-volume expression morphs and the independent eye blink preserve social animation while every facial pixel now follows the actual skull surface.
- [improved / actors retained a narrow mannequin silhouette] Sculpt v39 broadens the torso, shoulder/arm volume and leg cross-sections inside the authoritative character capsule. The result is closer to the reference's soft illustrated mass without changing the `1.72m` scale, foot contact, skeleton or movement controller.
- [improved / civic cardigans hid the coloured dress] Facilitator and mediator panels are narrower and farther apart, lapels are reduced, buttons move to the opening edge and the green bodice now forms a readable central layer. The notebook grip and skirt follow-through remain intact.
- [improved / camera fill flattened clothing to keep faces legible] Expression fill now uses a dedicated face layer. Heads and volumetric eyes receive the warm camera-side lift while cardigan folds, backpack, notebook and trouser volumes retain the directional portal key and rim hierarchy.
- [improved / room daylight remained broad and low-contrast] Civic global fill, hemisphere and environment energy are reduced; the portal key, low warm bounce, cool lounge reflection, actor rim, shadow definition and window dapple are coordinated into a more directional warm-daylight preset.
- [checked / complete runtime] Four sculpt-v39 GLBs total `7.61 MB`. Head-UV identity, volumetric eyes, civic assets, 26-zone physics, desktop/mobile atomic scene flow, real movement/camera drag, syntax and production build remain within the strict budgets.

### Required fidelity surfaces and findings

- [checked][3D identity continuity] The role-specific 2D identity now lives on the actual 3D head and deforms with it. Eyes retain real parallax, gaze, blink, light and occlusion, and no sprite or camera-facing face surface appears in the complete orbit.
- [checked][camera, layout and interaction continuity] The player-led `5.2m` orbit, `48°` opening lens, wider side/reverse lenses, camera collision and weighted narrative pivot remain unchanged. The listening circle, doorway, foreground evidence desk and action deck remain functional in desktop and portrait states.
- [checked][responsive performance] Desktop stays at `148–151` calls and `276,544–291,436` triangles; mobile is `101 / 231,726`. No stale background, black block, duplicate room, collider mismatch, face swap, runtime exception or movement regression appeared in final evidence.
- [P1][role-authored character topology and texture finish remain below the source] The carrier defect is resolved, but the focused pair still exposes simpler hair roots, eyelid-to-cheek flow, cloth compression, footwear, fingers and hand-object contact. Literal parity needs artist-authored head/garment UV texture sets, corrective cloth shapes and denser silhouette topology rather than additional generic primitives.
- [P1][source-level indirect transport and furniture microdetail remain below the source] Directional light hierarchy is stronger, yet the reference retains softer multi-bounce penumbrae, richer local colour bleed, finer joinery and denser paper/glass/ceramic/foliage storytelling. The real-time room is coherent and playable but not yet source-level production art.
- [P2][facial feature styling remains more graphic than the target render] The inherited 2D atlas preserves product identity and now behaves as true 3D, but its eye/line treatment is sharper and more anime-like than the reference's softer sculpted face shading. A later role texture pass should repaint those maps for the final art direction without reintroducing a carrier.

### Gate result

v67 closes the separate-face-carrier defect and establishes the requested 2D-avatar-to-true-3D path while materially improving character mass, cardigan layering, face-only readability lighting and portal directionality. The mandatory same-canvas comparisons still expose actionable P1 gaps in production character topology/texture finish, furniture microdetail and source-level indirect-light transport, so literal reference-quality parity is not yet proven.

final result: blocked

Blocker: role-authored character/furniture surfaces and source-level indirect-light transport remain visibly below the reference.

## 2026-07-23 reference-fidelity v66 editorial-camera, layered-garment and integrated-inlay gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Final desktop opening: `tmp/v66-desktop-yaw0.png` (`1600 × 900`, `149 / 267,648`, `48°`, `5.2m` orbit).
- Mandatory same-canvas evidence: `tmp/reference-vs-v66.png`; source and implementation are normalized to equal `16:9` panels in one comparison image.
- Mandatory focused cast comparison: `tmp/reference-vs-v66-cast.png`; the source and implementation character groups are inspected at equal panel scale.
- Full-orbit evidence: `tmp/v66-desktop-yaw90.png` (`150 / 282,540`, `52.41°`) and `tmp/v66-desktop-yaw180.png` (`152 / 281,092`, `52°`).
- Mobile evidence: `tmp/v66-mobile-390x844.png` (`390 × 844`, `100 / 226,086`, three-character LOD).
- Physical exploration evidence: `tmp/v66-character-walk.png`; the browser regression walked `5.37m`, completed action/walk/idle transitions and rotated the user camera `65.3°`.

### Comparison history, fixes and post-fix evidence

- [improved / opening retained a management-game pitch] The civic default pitch moves from `0.58` to `0.50`, lowering the authored camera from approximately `2.76m` to `2.652m` while retaining the `5.2m` orbit, `48°` opening lens, weighted player/target pivot, shell collision and user drag. More portal, face and furniture elevation is visible without sacrificing the physical route.
- [improved / civic choices read as four cramped pills] The wide-screen action rail now occupies a deliberate `720px` editorial deck with four equal choices; the mobile contract remains a compact full-width bottom rail and does not cover the conversation centre.
- [improved / coats read as opaque white blocks] Sculpt v38 gives facilitator and mediator a coloured dress bodice beneath a narrower open ivory cardigan, plus opening edges and cuffs. The coral facilitator still carries her notebook in authored hand contact, and the mediator keeps a distinct listening silhouette.
- [improved / hair read as a smooth cap] Five shallow directional hair-flow ridges now break the crown highlight for every role. The facilitator receives a visible ponytail band and layered tail, while the mediator receives side-braid volumes that survive quarter and reverse views.
- [improved / the previous proportion pass over-thinned the limbs] Arm and leg cross-sections recover restrained illustrated volume while staying inside the authoritative capsule and preserving the `1.72m` scale, continuous skinned deformation and sole contact.
- [improved / brass floor paths floated like glowing rails] Civic inlays are thinner, lower, rougher and less reflective; terrazzo response receives a slightly stronger mineral bump and darker neutral base. The navigation language remains legible but reads as embedded joinery instead of a raised obstacle.
- [checked / complete runtime] Four sculpt-v38 GLBs total `7.59 MB`; civic assets, hero props, 26-zone physics, desktop/mobile atomic scene flow, real movement/camera drag, syntax and production build pass inside strict budgets.

### Required fidelity surfaces and findings

- [checked][camera, composition and action hierarchy] The opening reads closer to the source's eye-level editorial frame, with one middle conversation circle, a functional foreground desk/display layer and portal/listening-wall/lounge destinations behind it. The action deck is visually subordinate to the cast and keeps its four working narrative controls.
- [checked][full-orbit and physical continuity] At `0°`, `90°` and `180°`, the player, social target and a designed room landmark remain readable. The player walks on the metre-space floor, returns to idle and supports a real `65.3°` camera turn without crossing furniture or falling back to a sprite.
- [checked][responsive performance] Desktop stays at `149–152` calls and `267,648–282,540` triangles; mobile is `100 / 226,086`. No stale background, black block, duplicate room, collider mismatch, runtime exception or camera reset appeared in final evidence.
- [P1][role-authored character surfaces remain visibly below the source] The focused same-canvas pair still exposes simpler eyelid-to-cheek topology, hair roots, cloth drape, hand-object contact and texture-space detail. Sculpt v38 improves layering and silhouette, but literal parity requires role-specific UV head/garment meshes, cloth corrective shapes and baked skin/hair/fabric maps.
- [P1][furniture microdetail and indirect transport remain visibly below the source] The room now has coherent functional density and better floor integration, but the reference retains finer joinery, denser paper/glass/ceramic/foliage storytelling, softer multi-bounce penumbrae and richer localized colour bleed.
- [P2][the curved face carrier remains detectable at extreme quarter angles] The illustrated atlas preserves the existing 2D avatar identity and participates in depth, light and occlusion, but a close side view can still reveal the carrier edge more readily than a fully UV-authored head.

### Gate result

v66 materially improves the authored eye line, action-deck hierarchy, cardigan/dress construction, hair-role silhouettes, limb balance and embedded floor navigation while preserving the complete playable physical room, full orbit, mobile layout and performance budgets. The mandatory same-canvas comparisons still expose actionable P1 gaps in role-authored character topology/UVs, furniture microdetail and source-level indirect-light transport, so literal reference-quality parity is not yet proven.

final result: blocked

Blocker: role-authored character/furniture surfaces and source-level indirect-light transport remain visibly below the reference.

## 2026-07-23 reference-fidelity v64 editorial-proportion, constructed-upholstery and full-orbit gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Final desktop opening: `tmp/v64-proportion.png` (`1600 × 900`, `147 / 262,360`).
- Mandatory same-canvas evidence: `tmp/reference-vs-v64.png`; source and implementation are normalized to equal `16:9` panels in one comparison image.
- Mandatory focused cast comparison: `tmp/reference-vs-v64-cast.png`; the source and implementation character groups are inspected at equal panel scale.
- Full-orbit evidence: `tmp/v64-desktop-yaw90.png` (`148 / 277,252`, `52.41°`) and `tmp/v64-desktop-yaw180.png` (`150 / 275,804`, `52°`).
- Mobile evidence: `tmp/v64-mobile-390x844.png` (`390 × 844`, `100 / 222,894`, three-character LOD).
- Physical exploration evidence: `tmp/v64-character-walk.png`; the browser regression walked `5.37m`, completed action/walk/idle transitions and rotated the user camera `65.3°`.

### Comparison history, fixes and post-fix evidence

- [fixed / illustrated face atlas produced dotted MSAA cutout noise] Civic face identity now uses a transparent curved carrier with low alpha threshold, disabled alpha-to-coverage, higher anisotropy and `18mm` skin clearance. Brows, irises, lashes and mouths remain authored while the former stipple/hatch pattern is absent in the opening and focused-cast evidence.
- [improved / cast retained stubby toy proportions] Sculpt v37 lengthens and slims the arm, leg and torso rhythm, reduces head and backpack mass, narrows the neck and limbs, and preserves the `1.72m` capsule, sole contact and shared animation pivots. The same-canvas cast comparison is materially closer to the reference's editorial silhouette.
- [improved / footwear and clothing ended as smooth primitives] Footwear v2 adds midsole, heel counter, toe-cap seam and ankle-collar construction. Listener collar, drawstrings and pocket welt, coat pocket welts and a facilitator notebook grip contact add role-specific silhouette and prop contact without changing gameplay colliders.
- [fixed / lounge read as beanbag spheres] Hero-prop contract v7 rebuilds the sofa with bevelled compressed seat/back cushions and distinct support structure. The lounge remains soft and friendly while reading as constructed upholstery from front and reverse orbit angles.
- [improved / broad fill and hard AO retained a plastic realtime look] Civic plaster/floor values, portal bounce, key/fill ratio, GTAO contribution, shadow radius and scene exposure are coordinated into a softer warm-daylight hierarchy. Furniture and actors retain grounding without the former dark outline around every component.
- [improved / reverse orbit made the closest witness dominate] Opening remains `48°`, while side/reverse views widen continuously to approximately `52°`. The constant `5.2m` orbit and actor-aware offset remain intact, reducing foreground witness scale without moving or hiding any citizen.
- [checked / complete runtime] Four v37 character GLBs, three v7 hero props, 26-zone physics, real movement/camera drag, desktop/mobile atomic scene flow and strict performance budgets pass.

### Required fidelity surfaces and findings

- [checked][identity, proportion and physical grounding] All four citizens retain the role-specific 2D facial identity on genuinely lit/occluded 3D heads. The slimmer `1.72m` bodies, articulated shoes and continuous skin remain on the physical floor through idle and real walking.
- [checked][foreground/midground/background composition] The record desk and display create a usable foreground; the cast owns the middle listening circle; the portal, listening wall and constructed lounge define background destinations. Four-way orbit preserves the player, target and a room landmark.
- [checked][responsive performance] Desktop stays at `147–150` calls and `262,360–277,252` triangles; mobile is `100 / 222,894`. No sprite fallback, black block, stale room, shader cutout noise, collider mismatch or runtime exception appeared in the final regression.
- [P1][production character surfaces remain visibly below the source] The focused same-canvas pair still exposes simpler hair roots, cheek/eyelid topology, cloth compression, finger contact and texture-space detail. Sculpt v37 fixes the massing, but literal parity still needs role-authored topology, UV texture sets, cloth corrective shapes and hand-object pose correction.
- [P1][furniture finish and indirect transport remain visibly below the source] The sofa now has credible construction and room materials separate more clearly, but the reference still retains finer joinery, denser glass/ceramic/paper/foliage assets, softer multi-bounce penumbrae and richer localized colour bleed.
- [P2][side-view face carrier is still detectable at close range] The curved atlas preserves identity and front-view depth, but extreme quarter angles reveal its card-like edge more readily than a fully UV-authored head. A later character-art pass should bake the illustrated features into role head UVs.

### Gate result

v64 closes the visible facial stipple defect, materially improves editorial character proportions, footwear/clothing specificity, sofa construction, warm-light hierarchy and reverse-orbit composition while preserving the playable metre-space world, physical walking and mobile budgets. The mandatory same-canvas comparisons still expose actionable P1 gaps in role-authored character/furniture finish and source-level indirect-light transport, so literal reference-quality parity is not yet proven.

final result: blocked

Blocker: role-authored character/furniture surfaces and source-level indirect-light transport remain visibly below the reference.

## 2026-07-23 reference-fidelity v59 face-clearance, compact-hand and surface-response gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Final desktop opening: `tmp/v59-final-yaw0.png` (`1600 × 900`, `147 / 260,424`).
- Mandatory same-canvas evidence: `tmp/reference-vs-v59.png`; source and implementation are normalized to equal `16:9` panels in one comparison image.
- Constant-radius orbit evidence: `tmp/v58-desktop-yaw90.png` (`148 / 275,316`, `5.2m`) and `tmp/v58-desktop-yaw180.png` (`150 / 273,868`, `5.2m`). These use the same v59 character, lighting and surface contracts; v59 only lowers the foreground desk's wood saturation.
- Mobile evidence: `tmp/v58-mobile-390x844.png` (`390 × 844`, `100 / 221,990`, three-character LOD).
- Physical exploration evidence: `tmp/v59-character-walk.png`; the browser regression walked `2.85m`, completed action/idle transitions and rotated the user camera `65.3°`.

### Comparison history, fixes and post-fix evidence

- [fixed / curved illustrated face carrier fought the volumetric head] The feature decal now leaves depth ownership to the sculpted head and sits `12mm` above the skin. This removes facial AO cavities and prevents role-specific cheek/jaw morphs from fragmenting the illustrated iris, lash and mouth planes.
- [improved / fingers still read as separated wire forms] Hand contract v3 clusters and thickens the four articulated digits, shortens their silhouette and reduces splay. The result retains independent finger volume and wrist animation while reading as one compact illustrated hand at gameplay distance.
- [improved / merged materials flattened cloth, paper and wood] The batched actor and room shaders now perturb the actual surface normal from scanned roughness inputs and semantic masks. Fabric, paper and wood receive restrained micro-relief without increasing draw calls or turning skin, metal and glass into noisy materials.
- [improved / broad ambient light reduced hierarchy] The civic preset shifts energy from hemisphere/environment fill into the portal key and bounce. Faces, cloth folds, furniture planes and room corners separate more clearly while the listening circle remains friendly rather than theatrical.
- [improved / foreground desk was too orange and toy-like] The record desk now uses lower-saturation medium wood, darker joinery and the same wood micro-surface contract as the room. It still frames the foreground but competes less with the coral interaction colour.
- [checked / complete runtime] Four regenerated character assets expose sculpt v35 and hand v3. Character contracts, 26-zone physics, real walking/camera drag, desktop/mobile atomic scene flow, syntax and production build pass inside strict budgets.

### Required fidelity surfaces and findings

- [checked][identity and face depth] The listener's eye and the other role-specific atlas features remain intact in the hero frame while the volumetric head, cornea, hair and skull still drive lighting and full-orbit occlusion.
- [checked][material and light hierarchy] Warm plaster and stone remain the 70% field; teal identity surfaces and coral/gold interaction accents retain the intended hierarchy. Cloth, wood and paper now react with distinct micro-normal response instead of one smooth plastic lobe.
- [checked][physical and orbit continuity] The player walks in metre space, returns to idle and supports a real `65.3°` drag turn. At `90°` and `180°`, the player, conversation target and authored room landmarks remain readable at the constant `5.2m` orbit.
- [checked][responsive performance] Desktop stays at `147–150` calls and `260,424–275,316` triangles; mobile is `100 / 221,990`. No sprite fallback, black block, stale room, shader artifact, collider mismatch or runtime exception appeared in final regression.
- [P1][artist-authored character topology remains below the source] The same-canvas pair still exposes simpler eyelid-to-cheek planes, hair roots, cloth compression, footwear and hand-object contact. Compact hands and cleaner face transfer improve gameplay readability, but literal parity requires role-authored topology, UV textures and corrective animation.
- [P1][furniture topology and true indirect transport remain below the source] The reference retains denser bevel construction, more specific glass/ceramic/paper/foliage assets, softer multi-bounce penumbrae and richer local shadow colour. Real-time normal perturbation improves material response but cannot reproduce source-level baked or probe-driven transport.
- [P2][reverse view retains a strong foreground witness crop] Constant radius and actor-aware composition protect the story centre, but the nearest mediator still has substantial lower-frame optical weight. A later staging-volume pass should redistribute the reverse witness without hiding or teleporting actors.

### Gate result

v59 materially improves face stability, compact hand silhouette, real material micro-response, directional hierarchy and foreground wood discipline while preserving the playable physical world, full orbit and responsive budgets. The mandatory same-canvas comparison still exposes actionable P1 gaps in production character/furniture topology and source-level indirect-light transport, so literal reference-quality parity is not yet proven.

final result: blocked

Blocker: role-authored character/furniture surfaces and source-level indirect-light transport remain visibly below the reference.

## 2026-07-22 reference-fidelity v52 illustrated-cornea, editorial-desk and constant-orbit gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Final desktop opening: `tmp/v51-desk-yaw0.png` (`1600 × 900`, `147 / 260,424`).
- Mandatory same-canvas evidence: `tmp/reference-vs-v51.png`; source and implementation are normalized to equal `16:9` panels in one comparison image.
- Constant-radius orbit evidence: `tmp/v52-desktop-yaw90.png` (`148 / 275,316`, `5.2m`) and `tmp/v52-desktop-yaw180.png` (`150 / 273,868`, `5.2m`).
- Mobile evidence: `tmp/v51-mobile-390x844.png` (`390 × 844`, `100 / 221,990`, three-character LOD).
- Physical exploration evidence: `tmp/v52-character-walk.png`; the browser regression walked `5.37m`, completed action/idle transitions and rotated the user camera `65.3°`.

### Comparison history, fixes and post-fix evidence

- [fixed / production face traded identity for plastic eye volume] The default face is now `illustrated-cornea`: the complete role-specific 2D avatar atlas deforms on a curved facial surface while two real clearcoat cornea lenses contribute physical highlights and head/orbit occlusion. Legacy atlas, hybrid and sculpted-volume paths remain explicit QA modes.
- [improved / cast still read too broad-headed] Sculpt v34 reduces the head mass to a more editorial `1:3.5` rhythm while retaining the `1.72m` player scale, capsule, skeleton, animation and foot contact.
- [improved / portal and floor clipped into broad yellow-white values] Civic exposure, local bounce, HDR portal colour, floor dapples and GTAO are rebalanced. Exterior foliage and roof detail survive the threshold, terrazzo texture remains readable, and actor/furniture contact depth is stronger.
- [fixed / foreground agenda hid all lived-in desk detail] The record-desk clipboard is smaller and lower; notebook, writing lines, water glass, coaster, file tray, note cards and lamp now occupy a visible front-right still life without changing the authored desk collider or route.
- [fixed / side and reverse orbit felt like a moving pivot] The public-room orbit now keeps a constant `5.2m` radius through all yaw angles. Actor-aware tangential avoidance and real shell collision remain active, but the quarter/reverse camera no longer zooms inward around the player.
- [checked / complete runtime] Character assets, 26-zone physics, syntax, real walking/camera drag, desktop/mobile atomic scene flow and production build pass. The civic room remains below desktop and mobile budgets.

### Required fidelity surfaces and findings

- [checked][2D identity carried into 3D] Brows, lashes, irises, blush and mouth retain the existing illustrated identity instead of being replaced with generic procedural eyes; the curved carrier, corneas, skull, hair, lighting and side/reverse occlusion preserve genuine 3D behaviour.
- [checked][foreground/midground/background composition] The record desk and display frame the foreground; the physical listening circle and cast anchor the middle; the portal, evidence wall and furnished lounge retain a navigable background axis.
- [checked][physical and orbit continuity] The player walks in metre space, returns to idle and supports a real `65.3°` drag turn. At `90°` and `180°`, the player, conversation target and multiple room landmarks remain readable without hiding actors.
- [checked][responsive performance] Desktop stays at `147–150` calls and `260,424–275,316` triangles; mobile is `100 / 221,990`. No sprite fallback, black block, stale room, collider mismatch or runtime exception appeared in final regression.
- [P1][artist-authored character topology remains below the source] The same-canvas pair still exposes simpler eyelid-to-cheek planes, hair roots, cloth compression, fingers, footwear and hand-object contact. Curved identity transfer resolves the generic-face defect, but it cannot replace role-authored UV meshes and corrective poses.
- [P1][furniture finish and true indirect transport remain below the source] The reference retains finer bevels, denser glass/ceramic/paper/foliage detail, softer multi-bounce penumbrae and richer local shadow colour. The real-time rebuild is coherent and playable but not yet literal source-level production art.
- [P2][reverse view retains a strong foreground witness crop] The constant radius prevents a camera zoom, and the story centre stays readable, but the nearest mediator still forms a large lower-frame foreground shape. A later staging-volume pass should redistribute the reverse-view witness without breaking reachability.

### Gate result

v52 materially improves avatar identity continuity, character proportion, portal/floor value control, foreground micro-story density and full-orbit stability while preserving the playable physical world and responsive budgets. The mandatory same-canvas comparison still exposes actionable P1 gaps in production topology, prop finish and source-level indirect-light transport, so literal reference-quality parity is not yet proven.

final result: blocked

Blocker: role-authored character/furniture surfaces and source-level indirect-light transport remain visibly below the reference.

## 2026-07-22 reference-fidelity v47 scanned-surface, daylight and actor-aware-orbit gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Final desktop opening: `tmp/v47-desktop-yaw0.png` (`1600 × 900`, `151 / 276,232`).
- Mandatory same-canvas evidence: `tmp/reference-vs-v47.png`; source and implementation are normalized to equal `16:9` panels in one comparison image.
- Quarter and reverse orbit evidence: `tmp/v47-desktop-yaw90.png` (`152 / 291,124`) and `tmp/v47-desktop-yaw180.png` (`154 / 289,676`).
- Mobile evidence: `tmp/v47-mobile-390x844.png` (`390 × 844`, `97 / 232,814`, three-character LOD).
- Physical exploration evidence: `tmp/v47-character-walk.png`; the browser regression walked `5.37m`, completed action/idle transitions and rotated the user camera `65.3°`.

### Comparison history, fixes and post-fix evidence

- [improved / batching erased wood, cloth, paper and mineral identity] The merged civic room and actor shaders now retain per-vertex semantic surface masks. Wood and fabric consume the existing scanned colour/roughness maps through local triplanar sampling; paper, mineral, leather, hair and skin keep restrained material-specific response without adding draw calls.
- [improved / broad daylight lacked authored value separation] Portal bounce, key-light energy, shadow radius, floor dapples, contact shadows and the final cool-shadow/warm-highlight grade are coordinated as one civic preset. The threshold reads warmer, the cast has clearer ground contact and the terrazzo no longer collapses into one flat beige value.
- [improved / gameplay-distance eyes became unreadable] Sculpt v33 / facial volume v10 enlarges the eye aperture and iris only enough to preserve gaze at the authored camera while retaining true volumetric eyes, blinking and quarter/reverse occlusion. Atlas brows, blush and mouth still carry the established 2D identity.
- [improved from v42 P2 / foreground actors dominated side orbit] The desktop camera now measures non-player actors in the camera-to-focus corridor and applies a bounded tangential composition offset. The `90°` and `180°` frames retain the complete cast without hiding witnesses or allowing a single foreground body to occupy the story centre.
- [checked / complete runtime] All four regenerated character assets total `7.25 MB`. Character contracts, syntax, 26-zone physics, real movement/camera drag and desktop/mobile atomic scene flow pass; desktop and mobile remain inside strict budgets.

### Required fidelity surfaces and findings

- [checked][material and light hierarchy] The room now distinguishes photographed wood/fabric response from paper, terrazzo, metal, leather, hair and skin while maintaining one warm civic palette. Portal sunlight and floor dapples establish a clearer entrance-to-circle depth axis.
- [checked][physical and orbit continuity] The player walks on the metre-space physical floor, returns to idle and supports a real `65.3°` drag turn. Actor-aware orbit composition is additive to wall collision, safe-area clamping and player-led focus rather than a scripted screenshot camera.
- [checked][responsive performance] Desktop stays at `151–154` calls and `276,232–291,124` triangles; mobile is `97 / 232,814`. No sprite fallback, black block, stale room or collision/render divergence appeared in the final captures and regressions.
- [P1][artist-authored character surfaces remain below the source] Eyes and cloth response are clearer, but the same-canvas pair still exposes weaker eyelid-to-cheek topology, hair roots, hand-object contact, cloth compression and footwear construction than the reference. These gaps require role-authored meshes, UV textures and corrective poses rather than additional procedural primitives.
- [P1][indirect light transport and prop finish remain below the source] The authored real-time daylight pass improves hierarchy, but the reference still has softer multi-bounce penumbrae, richer local shadow colour, finer furniture bevels and denser glass, ceramic, foliage and paper microdetail.
- [P2][reverse orbit still carries foreground optical weight] The bounded camera offset keeps the story centre readable, but the nearest listener remains visually large in the `180°` frame. A later room-specific staging-volume pass should redistribute witnesses without breaking physical reachability.

### Gate result

v47 preserves the playable metre-space world and full orbit while materially improving surface semantics, portal daylight, eye readability and actor-aware composition. The mandatory same-canvas comparison still exposes actionable P1 gaps in production character topology, prop finish and indirect-light transport, so literal reference-quality parity is not yet proven.

final result: blocked

Blocker: role-authored character/prop surfaces and source-level indirect-light transport remain visibly below the reference.

## 2026-07-22 reference-fidelity v42 hybrid identity, proportion and editorial-lens gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Final desktop opening: `tmp/v42-desktop-yaw0.png` (`1600 × 900`, `151 / 276,232`).
- Mandatory same-canvas evidence: `tmp/reference-vs-v42.png`; source and implementation are normalized to equal `16:9` panels in one comparison image.
- Quarter and reverse orbit evidence: `tmp/v42-desktop-yaw90.png` (`152 / 291,124`, `4.32m` orbit) and `tmp/v42-desktop-yaw180.png` (`154 / 289,676`, `4.75m` orbit).
- Mobile evidence: `tmp/v42-mobile-390x844.png` (`390 × 844`, `97 / 232,814`, three-character LOD).
- Physical exploration evidence: `tmp/v42-character-walk.png`; the browser regression walked `5.37m`, completed the authored action/idle transitions and rotated the camera `65.3°`.

### Comparison history, fixes and post-fix evidence

- [fixed / production faces lost the existing 2D identity] The default civic face path is now a true hybrid: the role-specific illustrated brow, blush and mouth atlas deforms on a curved facial surface while real volumetric eyes, lids, nose, head and hair preserve depth, gaze, blinking, light and side/reverse occlusion. Pure atlas and pure volume remain explicit QA modes, not the production default.
- [improved / cast read as broad-headed toy figures] Sculpt v32 shortens the head mass, extends the torso rhythm, narrows shoulders, arms and leg spacing, and moves the four roles toward the reference's editorial `1:3.5` proportion without changing the metre-space capsule or foot contact.
- [improved / eyes and footwear dominated the silhouette] Role eye apertures, irises, pupils, highlights and contour strokes are reduced; shoe lasts, soles, ankles, tongues and laces are shorter and narrower. Faces remain readable at gameplay distance without the former doll-eye/oversized-foot weight.
- [improved / opening camera made the characters one scale too large] The authored desktop lens moves from `45° / 5.05m` to `48° / 5.20m`. The final same-canvas pair has more breathing room around the listening circle and a closer match to the reference's cast-to-room ratio while retaining the player-led pivot and full drag orbit.
- [checked / web and physical contracts] The four regenerated assets are `7.27 MB` total. Hybrid facial morphs, two volumetric eyes, independent wrists, continuous limb skin, real movement, camera drag, desktop/mobile atomic scene flow, 26-zone physics, syntax and strict civic performance budgets pass.

### Required fidelity surfaces and findings

- [checked][identity continuity] The same role identity now survives front, quarter and reverse views: atlas features no longer replace the volumetric skull, and the volumetric head no longer discards the existing 2D avatar language.
- [checked][proportion and framing] The slimmer cast and `48°` opening lens materially reduce the previous toy-scale feeling. Four citizens, the listening circle, threshold, evidence wall and foreground desk remain legible in the hero view.
- [checked][movement and responsive performance] Desktop stays at `151–154` calls and `276,232–291,124` triangles; mobile is `97 / 232,814`. The player walks on the physical floor, returns to idle, and supports a real `65.3°` user camera rotation without a sprite fallback.
- [P1][artist-authored skin, cloth and hair finish remains below the source] The hybrid face fixes identity loss and feature scale, but the source still has better eyelid-to-cheek flow, hair roots, cloth compression, hand contact, footwear construction and texture-space normals. The current geometry is cleaner but still visibly procedural.
- [P1][source-level indirect light and material density remain unmatched] The reference retains softer portal bounce, richer local shadow colour, finer contact penumbrae and more convincing paper, glass, ceramic, foliage and fabric microdetail.
- [P2][quarter/reverse orbit foreground actors can become optically heavy] All required characters remain readable and the camera stays within the shell, but the nearest witness occupies substantial frame area at `90°`/`180°`. A later authored orbit-volume pass should reposition witness staging or use actor-aware composition rather than hiding characters.

### Gate result

v42 closes the largest 2D-avatar identity loss, toy-proportion and opening-scale defects while preserving real 3D movement, orbit, physical grounding, atomic entry and mobile budgets. The mandatory same-canvas comparison still exposes actionable P1 gaps in artist-authored surface finish and cinematic indirect light, so literal reference-quality parity is not yet proven.

final result: blocked

Blocker: production-quality cloth/hair/skin/contact assets and source-level indirect-light/material transport remain visibly below the reference.

## 2026-07-22 reference-fidelity v39 single-layout, material hierarchy and optical-weight gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Final desktop opening: `tmp/v39-desktop-yaw0.png` (`1600 × 900`, `151 / 266,616`).
- Mandatory same-canvas evidence: `tmp/reference-vs-v39.png`; source and implementation are normalized to equal `16:9` panels in one comparison image.
- Quarter and reverse orbit evidence: `tmp/v39-desktop-yaw90.png` (`152 / 281,508`, `4.17m` orbit) and `tmp/v39-desktop-yaw180.png` (`154 / 280,060`, `4.60m` orbit).
- Mobile evidence: `tmp/v39-mobile-390x844.png` (`390 × 844`, `94 / 225,602`, three-character LOD).
- Physical exploration evidence: `tmp/v39-character-walk.png`; the browser regression walked `4.29m`, completed the authored action/idle transitions and rotated the camera `65.3°`.

### Comparison history, fixes and post-fix evidence

- [fixed / generic and authored room generators overlapped] The public-plaza room no longer receives the generic public-room wall kit underneath the authored civic build. This removes the stacked forum board, paired floating panels, duplicate wainscot and unrelated floor pads that cluttered the cast silhouette and several orbit angles.
- [fixed / mobile grade unintentionally removed colour] The cinematic grade now treats strength as effect amount. At the mobile value of `0.72`, saturation is preserved with a restrained lift instead of being multiplied down to roughly `0.72`.
- [improved / broad surfaces shared one beige value] The civic terrazzo base is cooler and slightly rougher, portal bounce is stronger, contact AO is lighter, and the final grade adds restrained cool-shadow/warm-highlight separation. Plaster, stone, wood, teal upholstery and skin are more distinguishable without returning to toy saturation.
- [improved / actor materials behaved like one plastic shader] Batching now preserves explicit cloth and leather masks. Cloth receives subtle woven roughness and grazing sheen, hair gets a restrained strand response, and footwear receives a narrower leather highlight while the existing skin wrap remains intact.
- [improved from v35 P2 / HUD dominated the tableau] Civic status rails and action surfaces use lower-opacity warm glass treatment. They retain legibility but expose more of the room and compete less with the listening circle.
- [checked / real runtime and budgets] Four desktop/mobile screenshots, physical locomotion, camera drag, 26-zone physics, civic asset contracts, atomic scene flow, syntax and production build pass. Removing the duplicate room kit reduces the opening by `4` draw calls and `12,440` triangles versus v38.

### Required fidelity surfaces and findings

- [checked][spatial authorship] The hero view now has one coherent hierarchy: sunlit threshold and display evidence in the foreground, four citizens in the listening circle, and the authored listening wall/living bay behind them. The obvious template collision is absent.
- [checked][orbit and responsive performance] Desktop stays at `151–154` calls and `266,616–281,508` triangles; mobile is `94 / 225,602`. Player, social target and a designed room landmark remain readable at `0°`, `90°`, `180°` and portrait framing.
- [checked][movement and physical continuity] The final room supports real metre-space walking and a `65.3°` player-controlled camera turn; the furniture physics contract is unchanged and all 26 zones still validate.
- [P1][artist-authored character finish remains below the source] Same-canvas comparison still exposes boxier head/body transitions, simplified facial planes, hair roots, hands, shoes and cloth compression. The material hierarchy improves response but cannot replace role-authored topology, corrective poses and baked surface maps.
- [P1][cinematic light transport remains below the source] Portal bounce and material separation improve the frame, but the source still has richer bounced daylight, softer contact penumbrae, more nuanced local shadow colour and denser glass/paper/foliage microdetail.
- [P2][secondary orbit walls remain more graphic than tactile] The quarter and reverse landmarks are spatially coherent, but several framed response panels still read as flat symbol boards rather than crafted paper, cork, glazing and joinery.

### Gate result

v39 removes the accidental template overlap, fixes the mobile colour-grade defect and establishes a clearer room/actor/HUD material hierarchy while preserving physical exploration and full orbit performance. The mandatory same-canvas comparison still shows actionable P1 gaps in production character topology and source-level indirect light, so literal reference-quality parity is not yet proven.

final result: blocked

Blocker: role-authored character topology/surface maps and source-level baked or probe-driven indirect light remain visibly below the reference.

## 2026-07-22 reference-fidelity v35 character-readability and facial-shadow gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Final desktop opening: `tmp/v35-iab-desktop-yaw0.png` (`1600 × 900`, `155 / 279,056`).
- Mandatory same-canvas evidence: `tmp/reference-vs-v35.png`; source and implementation are normalized to equal `16:9` panels in one comparison image.
- Focused cast evidence: `tmp/v34-reference-cast.png` and `tmp/v35-current-cast.png`.
- Quarter and reverse orbit evidence: `tmp/v34-iab-desktop-yaw90.png` (`157 / 293,948`, `4.17m` orbit) and `tmp/v34-iab-desktop-yaw180.png` (`159 / 292,500`, `4.60m` orbit).
- Mobile evidence: `tmp/v34-iab-mobile-390x844.png` (`390 × 844`, `98 / 238,042`, three-character LOD).
- Physical exploration evidence: `tmp/v35-character-walk.png`; the browser regression completed authored walk, idle return, camera drag and scene-ready assertions.

### Comparison history, fixes and post-fix evidence

- [fixed from v33 P1 / faces accumulated several dark horizontal bands] Sculpt v31 removes redundant eye outline, lower-lid ink, eyelid crease and nose-contour tubes. One thinner upper-lid contour now carries the illustrated eye language while real upper/lower lid surfaces preserve orbit-safe volume.
- [fixed / tiny facial pieces cast dirty VSM stripes] Facial volume, eyes and expression-mouth surfaces retain PBR response but no longer participate in the shadow map. A camera-side actor-only warm fill restores eye and skin readability without flattening the room.
- [fixed from v33 P1 / fingers collapsed into dark wires] Hand v2 shortens, thickens and clusters four real finger volumes, removes decorative crease tubes and preserves independent wrist pivots plus notebook/listening/contact poses.
- [improved / limbs read as thick procedural tubes] Continuous arm and leg skin radii are reduced by roughly eight to ten percent while the `1.72m` player scale, capsule, bones, animation and foot contact remain unchanged.
- [checked / production contracts] Four regenerated GLBs expose sculpt v31, facial volume v8, hand v2, continuous skin and the existing animation set. Total character payload falls to `6.36 MB`.
- [checked / real runtime] In-app Browser reached atomic `ready` with all four volumetric actors. Real movement/orbit, 26-zone physics, desktop/mobile scene flow, syntax and production build all pass.

### Required fidelity surfaces and findings

- [checked][face readability] The focused cast comparison no longer shows the former triple eye bands or nose stripe. Sclera, iris, expression and role identity remain readable at the authored story camera and through the real quarter/reverse orbit.
- [checked][hand and body silhouette] Hands read as compact illustrated volumes instead of separated wire fans; slimmer limbs move the cast closer to the reference's editorial `1:3.5` proportion without creating gaps in the continuous skin.
- [checked][responsive/performance] Desktop remains at `155–159` calls and `279,056–293,948` triangles; mobile remains at `98 / 238,042`, all inside the strict civic budgets.
- [P1][artist-authored character finish remains below the source] The same-canvas comparison still exposes simpler cloth compression, hair-root transitions, footwear construction, face normals and hand contact than the reference. The geometry is now clean and readable, but it still reads as procedural low-poly rather than production character art.
- [P1][cinematic indirect light and material microdetail remain below the source] Character-only fill improves faces, but the reference still has softer portal bounce, richer contact penumbrae, denser fabric/paper/wood response and more nuanced local shadow colour.
- [P2][HUD remains optically heavy] The dark top rails and segmented action bar still compete with the social tableau more than the reference's translucent treatment.
- [P2][mobile background framing remains under-authored] Portrait framing is usable and within performance budget, but too much pale upper architecture remains compared with the reference's stronger story landmark composition.

### Gate result

v35 closes the highest-noise facial-shadow, wire-finger and heavy-limb defects while preserving the full animation, physics, orbit, responsive and performance contracts. The mandatory same-canvas comparison still shows actionable P1 gaps in artist-authored character surfaces and source-level indirect light, so literal reference-quality parity is not yet proven.

final result: blocked

Blocker: production cloth/hair/skin/hand-contact assets and source-level indirect-light/material transport remain visibly below the reference.

## 2026-07-22 reference-fidelity v33 directional-light, curated-display and orbit-shell gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Final desktop opening: `tmp/v33-desktop-yaw0.png` (`1600 × 900`, `155 / 282,064`).
- Mandatory same-canvas evidence: `tmp/reference-vs-v33.png`; source and implementation are normalized to equal `16:9` panels in one comparison image.
- Final quarter and reverse orbit evidence: `tmp/v32-desktop-yaw90.png` (`156 / 296,956`, `4.17m` orbit) and `tmp/v33-desktop-yaw180.png` (`158 / 295,508`, `4.60m` orbit).
- Mobile evidence: `tmp/v32-mobile-390x844.png` (`390 × 844`, `98 / 239,938`, three-character LOD).
- Physical exploration evidence: `tmp/v33-character-walk.png`; browser regression walked `1.89m` and rotated the camera `65.3°`.

### Comparison history, fixes and post-fix evidence

- [fixed from v31 P1 / room collapsed into one pale beige value] Civic key light is stronger and warmer at the portal while hemisphere, environment, fill, wash and bounce are reduced. Plaster, terrazzo, timber, skin and paper now form distinct value groups instead of sharing one global fill.
- [improved from v31 P1 / glass display contained anonymous colour blobs] The foreground case now contains four tray-mounted glazed objects with bases and garnish plus a second evidence tier with archive tokens, folded response cards and labels. The rebuilt GLB remains `11,884` triangles; the complete three-prop suite is `50,500` authored triangles.
- [fixed / side orbit crossed the room shell] The civic camera no longer expands to `6.0–6.8m`. The player-led orbit now remains within the declared `3.6–5.2m` range, preventing the entrance arch from becoming a floating black foreground curve at `90°`.
- [checked / complete orbit and responsive performance] Opening, quarter and reverse views remain below `160 / 300,000`; mobile remains below `110 / 250,000`. Player, a social target and the action context remain readable through the real orbit.
- [checked / runtime contracts] Civic prop verification, JavaScript syntax, 26-zone physics, desktop/mobile atomic scene flow, real movement/orbit and production build all pass.

### Required fidelity surfaces and findings

- [checked][space and camera] The entrance, listening circle, evidence wall and foreground desk now retain foreground/midground/background separation without leaving the room shell. The former side-view black arch is absent in post-fix evidence.
- [checked][material storytelling] The display case reads as curated civic evidence rather than generic decoration; doorway sunlight and the quieter cool fill better separate ceramic, glass, wood, paper and terrazzo.
- [checked][responsive/performance] Desktop stays at `155–158` calls and `282,064–296,956` triangles; mobile stays at `98 / 239,938`.
- [P1][character production finish remains visibly below the source] The same-canvas comparison still exposes coarse facial topology, oversized graphic features, stiff hand contacts, simplified cloth folds and weak hair-root/shoe finish. Concrete next fix: replace the current procedural face/hand/cloth surfaces with artist-authored role meshes plus baked normal/roughness maps while preserving the shared animation contract.
- [P1][light transport is improved but not source-level] The reference still has softer bounced sunlight, finer contact penumbrae and richer local shadow colour. Current lighting has clearer direction and value grouping but still reads as real-time procedural shading rather than authored cinematic transport.
- [P2][HUD remains optically heavy] The dark top rails and segmented bottom bar still compete with the social tableau more than the source's translucent treatment.
- [P2][mobile upper-wall allocation remains generous] The story wall is readable, but portrait framing still gives pale architecture more vertical weight than the actors.

### Gate result

v33 closes the civic global-fill problem, replaces generic display blobs with legible micro-stories and restores an orbit radius that stays inside the physical room shell. The mandatory same-canvas comparison still shows an actionable P1 gap in artist-authored character surfaces and cinematic indirect light, so literal reference-quality parity is not yet proven.

final result: blocked

Blocker: production-quality character face/hand/cloth assets and source-level indirect light remain visibly below the reference.

## 2026-07-22 reference-fidelity v31 foreground editorial desk and sculpted-ear gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Browser-rendered implementation: `tmp/v31-character-desk-ready.png` (`1600 × 900`, CSS viewport `1600 × 900`, DPR normalized to `1` for comparison).
- Mandatory same-canvas evidence: `tmp/reference-vs-v31.png`; source and implementation are normalized to the same `16:9` frame and shown side by side in the same comparison image.
- Focused desktop orbit evidence: `tmp/v31-desktop-yaw90.png` (`156 / 294,060`) and `tmp/v31-desktop-yaw180.png` (`158 / 292,612`).
- Physical movement evidence: `tmp/v31-character-walk.png`; automated exploration walked `3.33m` and rotated the camera `65.3°`.
- Mobile evidence: `tmp/v31-mobile-390x844.png` (`390 × 844`, `98 / 239,938`, three-character mobile LOD).
- State: opening public listening-circle scene, 06:00, no modal; source and implementation share the same story tableau but not identical furniture inventory.

### Comparison history, fixes and post-fix evidence

- [fixed from v30 P1 / foreground agenda read as a giant easel] The `0.70 × 0.58m` upright board is replaced by a `0.58 × 0.42m` low-angle drafting clipboard with two physical walnut rests. The desk top is wider and lower, so lamp, paper, pen cup, file tray and water glass form a layered foreground still life instead of hiding behind one slab.
- [fixed / foreground render and collision scale diverged] The record desk profile, visible transform, collider height and reachable interaction point now share the same lowered authored contract. The player cannot collide with the former invisible tall board.
- [improved from v30 P1 / ears read as glued-on beads] Sculpt v30 / facial volume v7 replaces paired ear ellipsoids with a custom helix shell, recessed concha bowl, back thickness and antihelix curve on all four roles. The result remains real lit geometry through front, quarter and reverse views.
- [checked / runtime and motion] All four desktop actors expose facial volume v7, two volumetric eyes, continuous limb skin, independent wrists and authored action clips. Real WASD movement and drag orbit pass without sprite fallback.
- [checked / responsive performance] Opening desktop is `155 / 279,168`; quarter and reverse stay below `160 / 300,000`; mobile remains below `110 / 250,000` with joystick and contextual actions.

### Required fidelity surfaces and findings

- [checked][fonts and typography] Chinese HUD and room copy remain readable with consistent optical weight and no truncation at desktop/mobile sizes. The implementation HUD is intentionally denser than the reference and remains a P2 optical-hierarchy difference.
- [checked][spacing and layout rhythm] The lower foreground desk now frames rather than occludes the circle. Player, three witnesses, exit and primary evidence wall remain readable at 0°, 90° and 180°; mobile retains a centered movement lane and 52px-class action controls.
- [checked][colors and visual tokens] Warm plaster, neutral terrazzo, oak, teal, coral and brass preserve the reference palette hierarchy, but the implementation remains brighter and flatter in broad wall/floor values than the source.
- [checked][image quality and asset fidelity] All visible cast and hero furniture are real 3D assets or authored Three.js geometry with side/back surfaces, shadows and occlusion; no sprite or billboard replacement is used. The new ear shell and desk assembly sharpen silhouette fidelity without breaking budgets.
- [checked][copy and content] “倾听墙”, “邻里广场 · 场所回声”, “倾听线索” and the four civic actions remain aligned to the same social-listening story state; no private-memory copy appears in the screenshot.
- [P1][character production finish remains below the source] Ear anatomy is materially improved, but the same-canvas pair still exposes coarser eyelid-to-cheek flow, hand contact, hair roots, cloth compression and shoe finish. Concrete next fix: artist-authored normal/roughness maps and role-specific corrective head/hand/cloth meshes rather than more primitive detail stacking.
- [P1][room light transport and micro-story density remain below the source] The reference has stronger portal sunlight, softer indirect penumbrae, darker value grouping and denser ceramics/paper/glass storytelling. The current room is spatially coherent but still reads brighter, cleaner and more procedural. Concrete next fix: bake or probe a civic-only bounce/lightmap pass and upgrade the display case/sideboard content density while keeping the open route.
- [P2][mobile upper wall remains under-authored] Portrait framing keeps gameplay clear but still spends too much vertical space on pale wall. A mobile-specific target should lift the listening wall and portal into the upper third.
- [P2][HUD remains optically heavy] The dark top rails and bottom segmented action bar pull more attention than the source's translucent treatment.

### Gate result

v31 fixes the largest foreground composition defect and replaces bead-like ears with true orbit-safe anatomy while preserving atomic entry, physical locomotion and strict desktop/mobile budgets. The same-canvas comparison still shows actionable P1 gaps in character surface/contact finish and civic indirect-light/micro-story density, so literal reference-quality parity is not yet proven.

final result: blocked

Blocker: artist-quality head/hand/cloth surface finish and source-level indirect light/material storytelling remain visibly below the reference.

## 2026-07-22 reference-fidelity v30 eye-line composition, tactile story rug and volumetric gaze gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Same-canvas source/implementation comparison: `tmp/reference-vs-v30-final.png`; both halves show the opening listening-circle state at the same `1280 × 720` presentation ratio.
- Final desktop opening: `tmp/v30-final-neutral-yaw0.jpg` at `155` draw calls / `281,128` triangles.
- Real quarter and reverse views: `tmp/v30-yaw90.png` at `156 / 296,020`, and `tmp/v30-yaw180.png` at `158 / 294,572`.
- Real physical stride evidence: `tmp/v30-character-walk.png`; the authored walk clip, volumetric cast and player-follow camera remain active during WASD motion.
- Real mobile browser evidence: `tmp/v30-mobile-390x844.jpg` at `390 × 844`, `98 / 240,826`.

### Comparison history, fixes and post-fix evidence

- [fixed from v29 P1 / management-game top-down camera flattened the room] The desktop civic opening now uses a roughly `18°` character-eye-line composition (`2.76m` camera height, `6.05m` orbit radius, `45°` FOV). The portal, cast, listening wall and foreground evidence desk resolve as foreground/midground/background rather than stacked floor icons.
- [fixed / lower lens exposed floating ceiling bars] The authored cove termination is lifted above the story lens. The opening frame no longer contains unrelated cropped beams, while the independently managed cove still frames real quarter and reverse orbits.
- [fixed / listening circle read as a painted target decal] The story rug is now a thin real cylinder with a visible textile edge, woven colour texture, restrained low-relief thread motif and physically distinct fabric response. Brass paths remain walkable floor inlay rather than collision-bearing decoration.
- [improved from v29 P1 / character gaze collapsed into black pixels] Sculpt v29 / facial volume v6 increases the four role-specific eye apertures and gives sclera, iris and pupil real corneal depth. Listener, facilitator and mediator eye direction remains readable in the opening, quarter and reverse frames without a billboard face.
- [improved / civic floor collapsed into the same beige as skin and plaster] The photographed terrazzo colour is multiplied by a neutral mineral value instead of the warm fallback floor palette; cool chips, warm wood and skin now separate more clearly under the same doorway light.
- [checked / full orbit and mobile] Player and at least one social target remain visible at `90°` and `180°`; no furniture becomes a full-frame blocker. Desktop stays below `160 / 300,000`, mobile below `110 / 250,000`.
- [checked / runtime contracts] All four citizens expose `mirrorlife-civic-face-volume-v6`, two volumetric eyes, continuous limb skin, independent wrists and authored expression morphs. Syntax, asset, 26-zone physics, desktop/mobile scene flow and production build checks pass.

### Required fidelity surfaces and findings

- [checked][camera and spatial readability] The new eye-line lens is materially closer to the source composition and preserves genuine 360-degree exploration. The player-follow pivot remains player-led, with story and path weighting, safe-area clamping and collision diagnostics.
- [checked][material/grounding] The central rug has truthful thickness and contact, the terrazzo is materially distinct from plaster, and character feet remain on the physical floor during idle and stride.
- [checked][responsive/performance] Opening, quarter and reverse frames are `155`, `156` and `158` calls. Mobile keeps three citizens, joystick and contextual actions at `98 / 240,826`.
- [P1][production character topology remains below the source] Enlarged volumetric eyes improve gaze, but the source still has artist-authored eyelid-to-cheek flow, ear anatomy, hand joints, cloth compression, hair roots and footwear finish. The current cast remains recognizably procedural in the same-canvas comparison.
- [P1][room-wide hero-asset fidelity remains below the source] The reference has denser ceramics, paper stacks, glass display contents, woven storage and furniture joinery with softer indirect penumbrae. Current layout and semantic staging are coherent, but several props still read as simplified primitives.
- [P2][mobile opening spends too much vertical space on an undecorated upper wall] Controls and actors remain usable, but the portrait composition needs a dedicated camera target or taller background story landmark rather than inheriting the desktop wall framing.
- [P2][HUD optical hierarchy remains heavier than the source] Coverage passes, but the dark segmented rails still compete with the social tableau.

### Gate result

v30 closes the high-impact top-down composition, floating-cove, flat-rug and unreadable-gaze defects while preserving complete orbit, physical locomotion, responsive controls and strict performance budgets. The mandatory same-canvas comparison still exposes material differences in artist-authored character anatomy and hero-prop production finish, so literal reference-quality parity remains unproven.

final result: blocked

Blocker: artist-quality head/hand/cloth topology and source-level hero-prop microdetail remain visibly below the reference.

## 2026-07-21 reference-fidelity v29 role-specific face and expression-continuity gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Same-canvas source/implementation comparison: `tmp/reference-vs-v29-final.png`; both halves show the equivalent opening listening-circle state on one `1672 × 941` canvas.
- Focused cast evidence: source crop `tmp/v28-source-cast.png` and final implementation crop `tmp/v29-final-cast.png`.
- Final desktop implementation: `dist/interior-3d-work/environment-review/00-public.png` at `154` draw calls / `280,936` triangles.
- Real quarter and reverse orbits: `dist/interior-3d-work/environment-review-yaw-90/00-public.png` at `155 / 295,828`, and `dist/interior-3d-work/environment-review-yaw-180/00-public.png` at `157 / 294,380`.
- Real physical stride evidence: `tmp/v29-character-walk.png`; the final exploration run moved the player `3.65m` and rotated the camera `65.3°`.
- Real mobile Chrome evidence: `dist/interior-3d-work/environment-review-mobile/00-public.png` at `390 × 844`, `98 / 240,634`.

### Comparison history, fixes and post-fix evidence

- [fixed from v28 P1 / four roles shared the same doll-like resting face] Sculpt v28 introduces metre-authored role profiles for eye aperture, iris ratio, brow rhythm, cheek projection, muzzle projection and resting mouth. Player, listener, facilitator and mediator now preserve their own facial silhouette through front and reverse orbit instead of differing only by hair and colour.
- [fixed from v28 P1 / smile deformed the cheek under a static mouth line] The closed mouth is now one real morph-target mesh with `WarmSmile`, `SpeechJaw`, `Concern` and `Attentive` shapes. Its corners follow the same expression weights as the head without adding another draw call.
- [fixed / lower eye contour looked doubled and tired] The duplicated full-width eye outline is reduced to a restrained outer-corner contour; lower lid and eyelid crease thickness are separately authored. Sclera, iris and pupil ratios are rebalanced per role.
- [fixed / blink compressed corneal depth instead of closing the eye] Runtime blinking now scales the Blender-authored local Z aperture and exposes `blinkAxis: z` plus vertical scale diagnostics. Eye depth stays stable while the lid stack actually closes.
- [fixed / atomic reveal showed neutral masks before expression lerps settled] Each role receives an authored initial social expression before the room becomes visible. Listener, facilitator and mediator appear attentive on the first revealed frame; subsequent runtime acting remains continuous.
- [checked / browser runtime] The in-app browser reached `sceneReady=true` at the real `180°` view with no warnings or errors. All four actors exposed `mirrorlife-civic-face-volume-v5`, four head morphs and two volumetric eyes.
- [checked / performance and interaction] The richer GLBs remain `6.82 MB` total and stay under the same Web LOD budgets. Desktop/mobile scene flow passes; physical exploration walks `3.65m` and rotates `65.3°`.

### Required fidelity surfaces and findings

- [checked][3D character continuity] Eyes, lids, brows, nose, cheeks, mouth, hair, costume and props remain lit geometry with correct front/side/back self-occlusion; no portrait billboard or sprite fallback is used.
- [checked][responsive/performance] All three desktop views remain below `160 / 300,000`; mobile remains below `110 / 250,000` with three actors and complete touch controls.
- [checked][expression readability] The focused crop shows cleaner eye corners, less duplicated lower-lid ink and role-specific mouth/brow rhythms. The reverse orbit exposes the player's face and confirms the same geometry survives a real camera turn.
- [P1][production facial topology still remains below the source] The source has more natural eyelid-to-cheek continuity, softer lip corners, finer nose/ear anatomy, cleaner hair roots and subtler skin-normal response. v29 removes the shared-mask and static-mouth defects, but close comparison still reads as a procedural low-poly sculpt. Next fix: authored per-role head meshes or artist-quality normal maps rather than further primitive-level parameter tuning.
- [P1][character clothing/contact finish remains below the source] The reference has cleaner finger anatomy, fabric compression, seam construction and shoe/ground contact. Current silhouettes and notebook grip are functional, but the cast still lacks the source's production cloth and hand finish.
- [P1][room-wide micro-story density and indirect light remain below the source] The source still carries denser ceramics, paper, foliage and cabinetry storytelling plus more nuanced local bounce and contact penumbrae.
- [P2][HUD optical hierarchy remains heavier than the source] Coverage and controls pass, but the dark segmented rails still compete with the social tableau.

### Gate result

v29 closes the shared-face, static-mouth, doubled-lid and wrong-axis blink defects while preserving genuine locomotion, complete orbit, atomic reveal and strict performance budgets. The mandatory full-view and focused comparisons still expose actionable P1 gaps in artist-authored facial/cloth topology and room microdetail, so literal reference-quality parity remains unproven.

final result: blocked

Blocker: production-quality authored head/hand/cloth topology and room-wide micro-story/indirect-light fidelity remain visibly below the reference.

## 2026-07-21 reference-fidelity v28 balanced light transport and full-orbit batching gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Same-canvas source/implementation comparison: `tmp/reference-vs-v28-balanced.png`; both halves show the equivalent opening listening-circle state on one `1672 × 941` canvas.
- Final desktop implementation: `dist/interior-3d-work/environment-review/00-public.png` at `154` draw calls / `280,824` triangles.
- Real quarter and reverse orbits: `dist/interior-3d-work/environment-review-yaw-90/00-public.png` at `155 / 295,716`, and `dist/interior-3d-work/environment-review-yaw-180/00-public.png` at `157 / 294,268`.
- Real physical stride evidence: `tmp/v28-character-walk.png`; the final exploration run moved the player `2.85m` and rotated the camera `65.3°`.
- Real mobile Chrome evidence: `dist/interior-3d-work/environment-review-mobile/00-public.png` at `390 × 844`, `98 / 240,550`.

### Comparison history, fixes and post-fix evidence

- [fixed from v27 P1 / reverse orbit exceeded the strict civic budget] The public-room orbit frames, architectural wall groups and three static hero assemblies now retain group-level camera visibility while batching their opaque submeshes into vertex-surface meshes. The reverse view falls from `166` to `157` draw calls; all three desktop angles now satisfy the `160`-call civic gate.
- [fixed / static furniture inherited character skin and cloth shading] The shared batcher now has explicit actor and room modes. Room furniture preserves per-part roughness and metalness without receiving character ink, skin-wrap or hair-sheen terms.
- [improved from v27 P1 / crushed contact and yellow plastic read] Civic key/fill/hemi/bounce, portal bounce, environment response, GTAO radius/thickness and the editorial grade are rebalanced together. The opening frame retains grounded feet and furniture contact while recovering pale plaster, paper and terrazzo separation.
- [improved / broad materials collapsed into one gloss level] Civic floor and wall roughness, wall relief, environment response and the non-actor vertex surface are separately tuned; wood, paper, upholstery, ceramic, brass and terrazzo retain different highlight widths after batching.
- [fixed / render-ready regression during the material split] Browser console inspection exposed two misplaced material-mode variables that held atomic entry in `loading`. Both scopes were corrected; the in-app browser then reached `sceneReady=true` with no warnings or errors, and desktop/mobile scene-flow regression passed.
- [checked / physical exploration] The final browser run walks `2.85m`, rotates `65.3°`, keeps the volumetric cast and preserves the same authoritative spatial/physics contract.

### Required fidelity surfaces and findings

- [checked][full-orbit performance] Opening, quarter and reverse views are `154`, `155` and `157` calls respectively; all stay below `160 / 300,000`. Mobile is `98 / 240,550`, below `110 / 250,000`.
- [checked][atomic readiness] The room, imported models, cast, physics, camera and UI reveal together. Fresh browser logs are empty and the scene-flow verifier passes on desktop and mobile.
- [checked][material hierarchy] The balanced frame is less yellow and less crushed than v27 while retaining warm daylight, contact separation and readable interaction paths.
- [P1][facial emotion and surface normals still remain below the source] The source carries finer eyelid-to-cheek transitions, lip corners, skin normals and role-specific micro-expression. The current cast is fully volumetric and animated but remains visibly more procedural at the story camera. Next fix: role-specific facial correctives and authored skin normal/roughness maps on the existing morph rig.
- [P1][indirect light and authored micro-story density remain below the source] The current room now separates material families and avoids hard AO, but the reference still has richer portal bounce, softer local penumbrae, woven/paper detail and denser evidence/cabinet stories. Next fix: localized light probes or baked hero-light cards plus restrained normal/roughness breakup for hero props.
- [P2][HUD optical hierarchy remains heavier than the source] Coverage and touch targets pass, but the dark segmented rails still compete with the cast more than the translucent reference treatment.

### Gate result

v28 closes the full-orbit civic performance blocker, restores a calmer material hierarchy and verifies atomic entry, real locomotion and mobile composition. The mandatory same-canvas comparison still shows visible P1 gaps in facial finish and room-wide indirect-light/micro-story fidelity, so literal reference-quality parity remains unproven.

final result: blocked

Blocker: production facial normals/correctives and room-wide authored indirect-light/material microdetail remain visibly below the reference.

## 2026-07-21 reference-fidelity v27 integrated face, tailored coat and contact-pose gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Same-canvas source/implementation comparison: `tmp/reference-vs-v27-final.png`; both halves use the same `1672 × 941` opening listening-circle state.
- Focused final cast evidence: `tmp/v27b-cast-crop.png`.
- Final desktop implementation: `dist/interior-3d-work/environment-review/00-public.png` at `157` draw calls / `280,824` triangles.
- Real quarter and reverse orbits: `dist/interior-3d-work/environment-review-yaw-90/00-public.png` at `158 / 295,716`, and `dist/interior-3d-work/environment-review-yaw-180/00-public.png` at `166 / 294,268`.
- Real physical stride evidence: `tmp/v27b-character-walk.png`; the exploration run moved the player `3.01m` and rotated the camera `65.3°`.
- Real mobile Chrome evidence: `dist/interior-3d-work/environment-review-mobile/00-public.png` at `390 × 844`, `101 / 240,550`.

### Comparison history, fixes and post-fix evidence

- [fixed from v95 P1 / sclera and features floated on the head] Sculpt v27 adds actual upper and lower skin lid planes, deeper eye sockets, upper-cheek and muzzle shaping, a restrained lower-lip volume and a warmer sclera. These parts remain children of the live eye/mouth pivots, so gaze, blink, speech and expression blending still operate through orbit.
- [fixed from v95 P1 / box-shaped outerwear] Facilitator and mediator coats now taper through the waist, release over the skirt and gain authored waist-to-hem fold planes. The front, side and reverse captures keep the changed silhouette and complete self-occlusion.
- [fixed from v95 P1 / notebook floated beside the actor] The facilitator notebook remains in one elbow-local transform and is visibly supported inside the palm silhouettes. Cover, paper block, spine, elastic and pencil stay coherent through the quarter and reverse orbit.
- [fixed / eye material read as pure-white plastic] The sclera is warmer and rougher, with a larger iris/pupil ratio and reduced clearcoat. This lowers the white-disc contrast while retaining the catchlight at the story camera.
- [checked / physical character contract] All four generated assets preserve `1m = 1m`, `1.72m` player height, the continuous arm/leg skin, independent wrists, expression pivots and full side/back geometry. The browser moved the player `3.01m` and rotated `65.3°` without sprite fallback or foot detachment.
- [checked / regression] Four civic assets, JavaScript syntax, 26-zone physics, desktop/mobile atomic scene flow and production build all pass.

### Required fidelity surfaces and findings

- [checked][3D exploration] Front, quarter and reverse frames expose genuine facial, hair, garment, hand, notebook, backpack and footwear volume. The player follows physical input and the camera completes the real orbit around the room.
- [checked][responsive/performance] Opening desktop remains inside the `160 / 300,000` civic gate and mobile inside `110 / 250,000`. The reverse room view reaches `166` calls because eight extra wall-decoration batches become visible; it remains inside the project-wide `180` hard ceiling but needs another room-batching pass to meet the strict civic target at every angle.
- [checked][contact and staging] The four citizens remain clear of furniture and share the authored listening ring. The notebook is no longer an unsupported floating prop.
- [P1][facial finish still remains visibly below the source] The source has softer eyelid-to-cheek transitions, calmer iris alignment, more natural lip corners and finer role-specific expression. The integrated geometry removes the floating-eye failure, but the cast crop still reads more procedural and less emotionally nuanced. Next fix: role-specific eye aperture and lip-corner correctives plus higher-quality face normals/skin shading.
- [P1][room light transport and material microdetail remain one tier lower] The same-canvas pair still shows harder contrast, flatter plaster bounce, simpler fabric/wood/paper roughness and less finely distributed story clutter than the source. Next fix: local probe/baked bounce and restrained normal/roughness breakup on the hero material families.
- [P1][reverse orbit exceeds the strict civic draw-call target] `180°` is visually readable and below the global ceiling, but `166` calls exceeds the civic goal of `160`. Next fix: merge the reverse-wall paper/decor batches by material while keeping camera-managed foreground coves independently fadeable.
- [P2][HUD optical hierarchy remains heavier than the source] Coverage and touch targets pass, but the dark segmented bars still compete with the social tableau.

### Gate result

v27 closes the specific floating facial-feature, boxy coat and unsupported notebook-contact defects while preserving real locomotion, complete orbit, mobile controls and the shared physical/animation contracts. The required same-canvas comparison still shows visible P1 gaps in emotional facial finish, indirect light/material nuance and reverse-orbit batching, so literal reference-quality parity remains unproven.

final result: blocked

Blocker: role-specific facial finish, room-wide indirect-light/material nuance and the `180°` civic draw-call spike remain below the target.

## 2026-07-21 reference-fidelity v95 body volume, footwear and orbit-occlusion gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Same-canvas source/implementation comparison: `tmp/reference-vs-v95-final.png`; the source and current opening state are each scaled from the same `1672 × 941` viewport.
- Final desktop implementation: `dist/interior-3d-work/environment-review/00-public.png` at `157` draw calls / `279,112` triangles.
- Real quarter orbit after the occlusion fix: `dist/interior-3d-work/environment-review-yaw-90/00-public.png` at `1.571rad`, `158 / 294,004`.
- Real physical stride evidence: `tmp/civic-v95-walk-1280x720.png`; the automated exploration run moved the player `1.89m` and rotated the camera `65.3°`.
- Real mobile Chrome evidence: `dist/interior-3d-work/environment-review-mobile/00-public.png` at `390 × 844`, `101 / 239,274`.

### Comparison history, fixes and post-fix evidence

- [fixed from v94 P1 / tubular anatomy] The v26 shared sculpt thickens the skinned torso, arms and legs while preserving the continuous two-mesh skin contract and metre-scale capsule. The player lower fabric receives a lighter teal-grey value so leg separation survives the room grade.
- [fixed from v94 P1 / mitten hand and weak prop grip] Palms gain depth and the authored finger silhouettes are longer, thinner and more separated. Existing independent wrist pivots and notebook/thoughtful/listening poses remain live.
- [fixed from v94 P1 / identical block footwear] The player and listener now use a wider sneaker last with a separate tongue; facilitator and mediator use a distinct ankle-boot collar. Soles, uppers and role colours remain full side/back geometry through orbit.
- [fixed from v94 P1 / flat costume layers] Vest, coat, bodice and skirt shells gain wider/deeper tailored volume without changing the shared skeleton, identity mapping or mobile LOD contract.
- [fixed / hard contact and muddy floor light] Civic key/fill/bounce/wash balance, GTAO blend, actor shadow alpha and leaf-dapple density are rebalanced for softer contact and warmer face readability.
- [fixed / 90° orbit was physically rotatable but visually unusable] The first real side capture exposed a near-camera brass cove as a full-width bar across the cast and HUD. Eye-height occlusion rays were added, and the three authored cove wings/reveals now stay independently addressable after room batching and fade to `6%` opacity inside the camera near field. The post-fix `1.571rad` capture keeps the whole cast and story furniture readable.
- [checked / performance] Preserving six camera-managed cove meshes adds only five effective room calls at the side view. Desktop remains below the `160 / 300,000` civic gate and mobile below `110 / 250,000`.

### Required fidelity surfaces and findings

- [checked][3D exploration] The player uses real WASD locomotion, alternating skinned stride and full drag orbit. Side/rear geometry, shoes, hands, hair and garments self-occlude instead of facing the camera as sprites.
- [checked][responsive/performance] Desktop keeps four citizens at `157 / 279,112`; the quarter orbit is `158 / 294,004`; mobile keeps three citizens and complete touch controls at `101 / 239,274`.
- [checked][camera safety] The quarter-turn cove no longer obscures the citizens, evidence markers or HUD. Actor torso and face rays now participate in the same 180ms occlusion fade contract.
- [P1][facial topology and expression still remain substantially below the source] The same-canvas comparison shows flatter cheek/lip planes, larger graphic eyes, coarser eyelids and less nuanced role-specific expression. Next fix: role-specific cheek/lip/eyelid correctives and smaller, better integrated eye topology on the existing morph rig.
- [P1][hands and clothing are improved silhouettes, not yet production contact anatomy] Fingers remain coarse at story distance, notebook/cup contacts are approximate, and coat/skirt/trouser surfaces lack the source's seam, fold and compression logic. Next fix: authored contact poses plus corrective cloth shells for each role.
- [P1][room light transport and micro-material detail remain one production tier lower] The source still has softer global bounce, richer portal daylight, more nuanced terrazzo, fabric, paper and ceramic variation, and better value grouping. Next fix: localized baked/probe bounce and restrained material breakup while holding current budgets.
- [P2][HUD optical hierarchy remains heavier than the source] Coverage passes on desktop/mobile, but the dark segmented bars still compete with the social tableau.

### Gate result

v95 materially improves body weight, garment and shoe differentiation, hand silhouette, contact lighting and—most importantly—the real quarter-orbit composition. The direct same-canvas comparison still contradicts literal reference-quality parity in face topology, contact anatomy, tailored cloth and indirect-light/material finish, so the full target remains unproven.

final result: blocked

Blocker: production facial/contact/cloth topology and room-wide indirect-light/material nuance remain visibly below the reference.

## 2026-07-21 reference-fidelity v94 sculpted face and role-readability gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Same-canvas full-room comparison: `dist/interior-3d-work/civic-fidelity-v94/reference-vs-v94.png`; focused cast comparison: `reference-vs-v94-cast.png`.
- Final desktop implementation: `dist/interior-3d-work/civic-fidelity-v94/desktop-1672x941-v94.png` at `153` draw calls / `278,728` triangles.
- Real quarter orbit: `dist/interior-3d-work/civic-fidelity-v94/desktop-orbit-v94.png` at `1.50rad`, `158 / 293,668`.
- Real gesture state: `dist/interior-3d-work/civic-fidelity-v94/desktop-gesture-v94.png`; the player enters the authored gesture/speech state and all three witnesses enter listening poses.
- Real mobile Chrome evidence: `dist/interior-3d-work/civic-fidelity-v94/mobile-390x844-v94.png` at `390 × 844`, `101 / 239,058` for three citizens.
- Browser warning and error logs were empty throughout desktop, action, orbit and mobile checks.

### Comparison history, fixes and post-fix evidence

- [fixed from v93 P1 / face features became stippled and detached at story distance] The production default is now `sculpted-volume`: eyes, lids, brows, nose and mouth are exported lit geometry instead of a bitmap feature sheet. The atlas remains only as an explicit comparison fallback and is no longer requested during normal atomic room entry.
- [fixed / eyes and lids were too small to read] Sculpt v25 enlarges the almond sclera, iris, pupil, glints and outline, adds independent lower lids and strengthens the upper-lid silhouette without turning the actor toward the camera.
- [fixed / facial mid-plane read as a smooth toy mask] A restrained nose contour now joins the existing bridge and tip, while the closed mouth has a clearer authored width and volume. Smile, speech, concern and attentive morphs remain live.
- [fixed / fringe read as a repeated comb] Six broader overlapping fringe groups replace eight narrow repeated locks, reducing procedural repetition while preserving complete side/back hair volume.
- [fixed / mediator costume identity disappeared under the ivory coat] A green layered bodice restores the role's dress silhouette and connects the 2D identity palette to the 3D garment stack.
- [fixed / richer face geometry risked exceeding the room budget] Static brow geometry joins the authored head batch; mouth and eye pivots stay independent for acting. Desktop, orbit and mobile all remain below `160 / 300,000` and `110 / 250,000` gates.

### Required fidelity surfaces and findings

- [checked][3D identity] All four citizens use real head, eye, hair, garment, hand and shoe volume with correct self-occlusion through the quarter orbit. The production path no longer swaps from a placeholder face after entry.
- [checked][interaction] The same actor rig supports idle, listening, proposal gesture, facial speech and physical exploration; the gesture evidence proves the sculpted facial morphs and witness states remain connected to gameplay.
- [checked][responsive/performance] Desktop preserves four citizens at `153 / 278,728`; mobile preserves the player and two witnesses at `101 / 239,058`, with controls and story target visible.
- [P1][body anatomy and tailoring remain visibly coarser than the source] The same-canvas cast crop still shows tubular arms/legs, mitten-like hands, simplified shoes, coarse coat/dress seams and weaker hand-to-prop contact. Next fix: role-specific garment shells, palm/finger silhouettes, shoe lasts and corrective contact poses on the shared rig.
- [P1][hair masses still need authored breakup] The wider fringe removes the comb artifact, but the source carries finer secondary clumps, root-to-tip flow and role-specific silhouette transitions. Next fix: replace remaining primitive clumps with a small reusable curve-derived hair library and role-level LODs.
- [P1][indirect light and micro-story density remain below the reference] Local light pools and material identity are stable, but the source has softer bounce, stronger contact penumbrae and richer ceramics/papers/textiles at the portal and cabinetry edges.
- [P2][HUD optical weight remains higher than the source] Functional grouping and mobile coverage pass, but the dark segmented controls still compete with the editorial tableau.

### Gate result

v94 removes the largest facial rendering artifact, promotes a fully volumetric production face, improves eye, lid, nose, fringe and mediator costume readability, and preserves real movement, action states, orbit and strict performance budgets. The direct same-canvas comparison still exposes production body/cloth/hand/hair and indirect-light gaps, so literal reference-quality parity is not yet proven.

final result: blocked

Blocker: role-specific body/garment/hand production topology and room-wide indirect-light/micro-detail remain below the reference.

## 2026-07-21 reference-fidelity v93 evidence wall, record station and orbit-material gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Same-canvas comparison: `dist/interior-3d-work/civic-fidelity-v93/reference-vs-v93-final.png`; both halves are `1672 × 941` and show the equivalent opening listening-circle state.
- Final desktop implementation: `dist/interior-3d-work/civic-fidelity-v93/desktop-1672x941-v93-final.png`.
- Focused pre-fix comparisons: `dist/interior-3d-work/civic-fidelity-v93/reference-vs-v92-evidence-focus.png` and `reference-vs-v92-record-focus.png` isolate the undersized evidence wall and glossy, poorly oriented record station that this pass replaces.
- Real mobile Chrome evidence: `dist/interior-3d-work/civic-fidelity-v93/mobile-390x844-v93-final.png` at `390 × 844`.
- Opening desktop runtime is `153` draw calls / `281,728` triangles; an in-app quarter orbit at `1.50rad` is `158 / 296,668`; mobile is `104 / 241,410`. All remain inside the civic desktop `160 / 300,000` and mobile `110 / 250,000` gates.

### Comparison history, fixes and post-fix evidence

- [fixed from v92 P1 / evidence wall was small and diagrammatic] Hero-prop v6 enlarges the wall, adds real oak rails and finials, layered cork/paper depth, a mesh-authored `倾听墙` title, picture-light arms/shades/bulbs and a wider evidence console. It now occupies the rear narrative axis rather than reading as generic wall decoration.
- [fixed from v92 P1 / record station read as glossy red plastic] The station now uses pale oak joinery, a thinner top and apron, four tapered legs, a restrained green task lamp, paper/glass/stationery micro-props and a physically oriented agenda board with readable `今日议题 / 倾听 / 理解 / 回应` content.
- [fixed / hero palette became white after room batching] The complete record assembly is collapsed once into authored vertex colors; the room batcher now preserves pre-authored vertex-color materials instead of repainting them with a white base. The `1.50rad` orbit proves that oak, paper, green paint and brass remain intact from the side/reverse view.
- [fixed / hero props remained evenly lit] Two restrained evidence-wall picture-light pools and a warm record-lamp pool add localized emphasis while the room key/fill/wash balance is lowered to restore contact separation.
- [fixed / visual and physical positions could diverge after the desk enlargement] The public profile now moves and resizes the record-station collider and interaction anchor with the rendered transform. All `26` zone profiles continue to pass the shared physics verifier.
- [fixed / visual capture could finish while headless Chrome remained orphaned] The environment capture runner now bounds the WebGL browser shutdown handshake and terminates its own child browser when necessary, so desktop/mobile evidence and manifests finish deterministically.

### Required fidelity surfaces and findings

- [checked][composition] The arched portal and record station frame the foreground, four citizens own the middle listening ring, and the enlarged evidence wall plus lounge provide a legible background story axis.
- [checked][materials and light] Oak, cork, paper, terrazzo, teal upholstery, ceramic, brass and localized warm pools are now visibly distinct; the station remains correctly shaded through real orbit angles.
- [checked][interaction and physics] The room performs an atomic ready reveal, supports physical WASD locomotion and real drag orbit, preserves metre-scale colliders and keeps every rendered hero prop off the walkable listening centre.
- [checked][responsive/performance] Mobile keeps the player, two witnesses, evidence target, joystick, actions and context prompt visible at `390 × 844`, with `104` calls and `241,410` triangles.
- [P1][character production anatomy remains the largest source gap] The same-canvas pair still shows simpler facial planes, hair layering, cloth tailoring, fingers, shoes and hand-to-prop contact than the reference. Next fix: rebuild role-specific head/hair/outer-garment shells and corrective contact poses on the existing shared skeleton without regressing animation or mobile LOD.
- [P1][remaining set density and indirect light are still one tier lower] The evidence wall and record station now have authored identity, but the source has richer threshold foliage, cabinetry accessories, ceramics/papers, woven detail and softer local bounce/contact penumbrae. Next fix: advance doorway/casework micro-stories and add restrained probe/baked bounce while holding the current budgets.
- [P2][HUD remains optically heavier] The top rail and segmented action chrome are functional and compact, but still compete more with the tableau than the reference's calmer translucent grouping.

### Gate result

v93 closes the two targeted furniture blockers, retains authored material identity through the real 360° orbit, synchronizes the enlarged desk with physics and stays inside strict desktop/mobile budgets. The identical-canvas comparison still exposes production-character anatomy and room-wide micro-detail/light-transport gaps, so literal reference-quality parity is not yet proven.

final result: blocked

Blocker: role-specific production character anatomy and consistent room-wide authored micro-detail/indirect lighting remain below the reference.

## 2026-07-21 reference-fidelity v92 face readability and lounge construction gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Same-canvas comparison: `dist/interior-3d-work/civic-fidelity-v92/reference-vs-v92-1672x941.png`; both source and implementation are `1672 × 941` and show the opening civic-room state.
- Final desktop implementation: `dist/interior-3d-work/civic-fidelity-v92/desktop-1672x941-v92-final.png`.
- Quarter-orbit evidence: `dist/interior-3d-work/civic-fidelity-v92/desktop-yaw-72-1280x720-v92b.png`; the camera reaches `1.26rad` while preserving the player, witnesses and functional room landmarks.
- Real mobile Chrome evidence: `dist/interior-3d-work/civic-fidelity-v92/mobile-390x844-v92-final.png` at `390 × 844`.
- Final runtime sample is `156` draw calls / `271,450` triangles on desktop and `108` / `241,148` on mobile. Both remain inside the civic-room quality gates.

### Comparison history, fixes and post-fix evidence

- [fixed from v91 P1 / tiny, low-contrast facial read] Sculpt v24 enlarges and reshapes the head/eye stack, adds secondary catchlights, widens lids, brows and mouth, lowers the head pivot and raises civic face lighting. Expressions remain real lit geometry with gaze, blink and speech animation.
- [fixed / actors presented as a closed ring] Conversational body yaw now opens the four citizens farther toward the authored story camera while preserving their actual world-space staging and collision capsules. Faces, hands and costume identity are more readable without turning actors into billboards.
- [fixed from v91 P1 / lounge read as stacked plastic blocks] Hero-prop v5 replaces the solid sofa box with an open oak rail frame, ladder arms, separate rounded seat/back upholstery and layered cushions. The model keeps complete side/back construction for real orbit views.
- [fixed / mobile budget risk from richer upholstery] The mobile scene remains at `108` draw calls and `241,148` triangles, below the `110 / 250,000` mobile limits; the desktop scene remains below `160 / 300,000`.
- [checked / visual and physical contracts remain synchronized] Furniture collision still comes from the authoritative spatial profile rather than decorative mesh batches. The four civic actors retain metre-scale capsules, real locomotion and complete 3D volume.

### Required fidelity surfaces and findings

- [checked][composition] Entrance, foreground record desk, hearing ring, evidence wall and lounge produce a clear foreground/middle/background sequence. The conflict remains centred and can be followed through a real orbit.
- [checked][materials] The rebuilt lounge now separates oak structure, woven upholstery and accent cushions. Terrazzo, brass, paper and plants keep the room palette coherent.
- [checked][interaction] Desktop and mobile reach one atomic ready state, support physical movement and camera rotation, and keep the contextual action visible without hiding the social tableau.
- [P1][character anatomy is improved but still visibly coarser than the source] The identical-canvas pair shows better eye contrast and body presentation, but the target still has integrated eyelid/cheek/lip planes, finer fingers, tailored cloth folds and authored hand contact. Next fix: replace the remaining feature-sheet dependency with role-specific facial topology and add corrective garment/hand poses.
- [P1][environment density and light transport remain below the source] The lounge is no longer block-built, but the evidence wall, record station, shelving, small ceramics/papers and portal bounce remain more modular and evenly lit than the reference. Next fix: rebuild those hero families and add localized bounce/contact-light treatment within the current budgets.
- [P2][HUD still dominates the upper edge] Controls are functional and responsive, but the target uses calmer translucent grouping, better icon optics and less segmented chrome.

### Gate result

v92 materially improves facial readability, opens the social staging toward the player camera and removes the lounge's stacked-block construction while preserving full movement/orbit, collider parity and desktop/mobile performance. The identical-canvas comparison still contains two visible P1 production-art gaps, so literal reference-quality parity is not yet proven.

final result: blocked

Blocker: production facial/cloth topology and consistent authored hero-asset density/local lighting across the civic room are still below the reference.

## 2026-07-21 reference-fidelity v91 authored threshold and quarter-orbit composition gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Same-canvas implementation/reference pair: `dist/interior-3d-work/civic-fidelity-v91/reference-vs-v91-full.png`, built from `desktop-threshold-warm-1672x941-v91.png` and the source image at identical size.
- Final desktop implementation: `dist/interior-3d-work/civic-fidelity-v91/desktop-yaw-0-1280x720-v91-final.png`.
- Quarter-orbit evidence: `dist/interior-3d-work/civic-fidelity-v91/desktop-yaw-90-1280x720-v91e.png`; the before/after camera comparison is `v90-vs-v91-yaw-90.png`.
- Mobile evidence: `dist/interior-3d-work/civic-fidelity-v91/mobile-yaw-0-390x844-v91-final.png`.
- Runtime diagnostics expose `mirrorlife-civic-portal-v2`; the final desktop scene is `154` draw calls / `260,066` triangles and mobile is `108` / `232,012` for three citizens.

### Comparison history, fixes and post-fix evidence

- [fixed from v90 P1 / threshold read as a thin black ladder] The public entrance is now layered hero architecture: plaster reveal, oak casing, brass inner stop, semi-circular glass fanlight, radial muntins, keystone, terrazzo sill and brass threshold line.
- [fixed / door leaves floated around their centres] Both leaves now pivot at the real jamb hinge line and extend inward from that pivot. Their stiles, rails, glazing, kick panels, handles and hinge plates remain true 3D from the complete orbit.
- [fixed / mobile portal detail exceeded the strict budget] The mobile LOD reuses the principal oak material and omits secondary kick moulding and hinge plates. The final scene remains at `108` draw calls, below the `110` mobile gate.
- [fixed / mobile could remain on the atomic loading shell] Browser logs exposed an undefined `mobileLod` branch introduced during the portal optimization. The branch now derives from the authoritative canvas width before any material selection; the final page reaches `sceneReady=true` and `108 / 232,012` without the partial room.
- [fixed from v90 P2 / quarter-turn foreground became a wall] The civic camera now adds a side-arc term at `90°/270°`, widening to `47.21°`, increasing orbit radius to `6.01m` and height to `3.54m`. The player and active witnesses remain readable while the record desk still frames the foreground.
- [fixed / desktop action controls overlapped at 1280px] The civic contextual action now occupies the lower-right editorial edge while the four-action rail owns the lower-left. Mobile retains its separate joystick/action layout.
- [checked / visual, physical and performance contracts remain aligned] The opening keeps the existing `2.08m × 3.02m` shell gap and physical exit; decorative depth does not create a false collider. All `26` physics profiles, four civic character assets and three civic hero props pass their validators.

### Required fidelity surfaces and findings

- [checked][composition] The entrance now carries the same left-third architectural role as the reference, the hearing circle remains the middle-ground conflict stage, and evidence/lounge furniture completes the background.
- [checked][materials and light] Oak, plaster, terrazzo, brass and glass provide clearer material hierarchy. Portal daylight gains a warmer local source without changing the room's neutral ivory grade.
- [checked][interaction] The scene reaches an atomic ready state on desktop/mobile, exposes the same physical exit, and retains keyboard/touch exploration plus real 360° orbit.
- [P1][character production anatomy remains below the source] Faces, hair, garments and hands remain visibly coarser than the reference despite real volumetric eyes, skinning, facial morphs and full side/back volume. Next fix: role-specific eyelid/cheek/lip correctives, layered hair clumps, tailored garment shells and authored hand contact.
- [P1][remaining furniture craft remains uneven] The new threshold is now a hero asset, but the evidence wall, lounge, record desk and small paper/ceramic props still have simpler joinery, upholstery and roughness breakup than the source. Next fix: advance those three furniture families to the same authored standard.
- [P2][HUD optical finish remains heavier] Placement is now non-overlapping, but the segmented dark controls still carry more visual weight than the reference's calmer translucent groups.

### Gate result

v91 closes the threshold-construction blocker, fixes its mobile runtime regression, improves the quarter-orbit composition and removes desktop action overlap while retaining real movement, complete orbit, collider parity and strict mobile/desktop budgets. Literal source parity is still not proven because production character anatomy and the remaining furniture families remain visible P1 gaps.

final result: blocked

Blocker: role-specific production character anatomy and consistent hero-asset craft across the remaining civic furniture are still below the reference.

## 2026-07-21 reference-fidelity v90 hybrid volumetric eyes and weighted silhouette gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Browser-rendered implementation: `dist/interior-3d-work/civic-fidelity-v90/desktop-hybrid-1672x941-v90.png` (`1672 × 941`, `public-plaza`, ready listening-circle state).
- Full-view same-canvas comparison: `dist/interior-3d-work/civic-fidelity-v90/reference-vs-v90-full.png`; source and implementation use the same viewport and equivalent opening social state.
- Focused cast comparison: `dist/interior-3d-work/civic-fidelity-v90/reference-vs-hybrid-cast-v90.png`. This crop is required because eye shape, iris catchlight, lid volume, limb weight and shoe contact are not safely judgeable at full-room scale.
- Internal option comparison: `dist/interior-3d-work/civic-fidelity-v88/atlas-vs-hybrid-cast-v88.png`; the left side uses the prior decal-only eyes and the right uses real eye geometry at the same viewport/state. `dist/interior-3d-work/civic-fidelity-v89/v88-vs-v89-cast.png` then isolates the circular-to-almond eye correction.
- Previous/final comparison: `dist/interior-3d-work/civic-fidelity-v90/v87-vs-v90-full.png`; v90 preserves the v87 room grade while changing character facial volume and silhouette.
- Orbit evidence: `dist/interior-3d-work/civic-fidelity-v90/desktop-yaw-90-1672x941-v90.png` and `desktop-yaw-180-1672x941-v90.png` prove side/back head, hair, eye occlusion and body volume.
- Interaction and responsive evidence: `dist/interior-3d-work/civic-fidelity-v90/desktop-suggest-1672x941-v90.png`, `walk-stride-1280x720-v90.png` and `mobile-yaw-0-390x844-v90.png`.
- Primary interactions tested in the in-app browser and local Chrome regression: social-action selection, speech/gesture morphs, real-eye gaze/blink pivots, physical WASD locomotion (`4.61m`), drag orbit (`65.3°`), `90°/180°` inspection, mobile controls, desktop/mobile atomic scene flow and all 78 transitions. Browser warning/error logs were empty.

### Comparison history, fixes and post-fix evidence

- [fixed from v87 P1 / decal-dominant eyes] Runtime face mode advances from `curved-atlas` to `hybrid-volume`. Each role keeps atlas-authored brows, blush and mouth, while a feathered elliptical mask reveals the exported sclera, iris, pupil, glint, lower contour and upper lid geometry underneath.
- [fixed from first v88 comparison / circular doll eyes] Sculpt v22 compresses the eye-white, iris, pupil, glint and lid stack into an almond aspect ratio. The v88/v89 same-crop pair shows less exposed circular sclera while keeping expressions readable at the story camera.
- [fixed / eyes did not participate in social acting] Every desktop citizen exposes two `mirrorlife-civic-eye-volume-v1` pivots. Existing gaze, smile compression and blink timing now deform real lit eye geometry; speech continues to drive the shared facial morph contract.
- [fixed from v89 / overly narrow mannequin silhouette] Sculpt v23 adds modest torso depth/width, larger continuous sleeve and trouser cross-sections, wider cuffs and a broader shoe last. The visual remains within the metre-scale capsule tolerance while reading with more foot and garment weight.
- [checked / full orbit remains real] The `90°` and `180°` captures show correct eye/head occlusion, asymmetrical hairstyles, costume backs and articulated props; neither face nor character rotates toward the camera as a sprite.
- [checked / performance remains inside the hero-room gate] Desktop is `147` draw calls / `247,910` triangles, including `79` actor calls for four full-expression citizens. Mobile merges eye detail into the head LOD and remains `108` / `222,232` for three citizens.

### Required fidelity surfaces and findings

- [checked][fonts/typography] Chinese status, location, memory and action labels remain readable at desktop/mobile sizes. The implementation still uses heavier, more segmented dark surfaces and less refined icon optical weights than the source; this remains P2.
- [checked][spacing/layout rhythm] Entrance, record station, hearing circle, evidence wall and lounge maintain a deliberate foreground/middle/background sequence at yaw 0. Side/reverse views remain navigable, although some orbit angles expose more blank wall and foreground furniture overlap than an authored story camera would.
- [checked][colors/tokens] Warm ivory, teal, coral, oak, paper, terrazzo and brass remain consistent with the source direction. Real eye highlights now join the light hierarchy instead of staying printed at one value.
- [checked][image and asset quality] Characters are real lit, skinned geometry with volumetric eyes, sculpted nose/head, morphing facial sheet, independent hands and continuous limb skin. The focused comparison still shows simpler eyelid/cheek/lip anatomy, coarse hair clumps, limited cloth layering and hand contact compared with the target.
- [checked][copy/content] MirrorLife story and social-action copy remains coherent; no fake resident count, public percentage or source-private content was copied into runtime.
- [checked][responsiveness/accessibility] At `390 × 844`, player, two witnesses, objective, joystick, chat/jump, contextual action and all four social actions remain visible and reachable without clipping.
- [P1][character production anatomy remains below the reference] Location: four civic actors. Evidence: v90 replaces painted eyes with real animated volume and improves body weight, but the target still has integrated eyelid/cheek/lip topology, layered hair strands, tailored garment overlaps, stronger hand contact and subtler joint deformation. Impact: close social scenes are more alive yet still visibly prototype-grade beside the target. Fix: add role-specific eyelid/cheek/lip geometry and corrective facial shapes; rebuild hair and outer garments as layered production meshes on the current skeleton.
- [P1][environment craft and local light transport remain one tier lower] Location: doorway, evidence cabinetry, lounge, record station and small props. Evidence: the room program, materials and composition are coherent, but the target contains finer joinery, textile tailoring, ceramic/paper variation, portal bounce and contact penumbrae. Impact: the visual target still wins immediately on richness and believable authored detail. Fix: rebuild the remaining threshold/casework/lounge as bespoke hero assets and add localized baked/probe lighting inside the current performance budget.
- [P2][HUD and free-orbit framing need an editorial pass] Location: persistent top/bottom chrome and yaw 90/180 frames. Evidence: controls remain dark and segmented; side views can give blank wall or foreground desk disproportionate weight. Impact: the scene feels more like a debug-free sandbox than a directed social drama at some angles. Fix: consolidate HUD surfaces and bias orbit collision/composition targets toward the active cast while retaining player control.

### Implementation checklist

1. Add integrated eyelid, cheek and lip geometry plus role-specific facial correctives to the v23 shared skeleton.
2. Rebuild layered hair and outer-garment silhouettes; author reliable notebook/chin/conversation hand contacts.
3. Replace remaining modular threshold, evidence cabinetry and lounge pieces with bespoke hero assets and localized bounce.
4. Add orbit-composition bias and finish the HUD only after the production art pass, then repeat identical desktop/mobile/action/orbit QA.

### Gate result

v90 closes the decal-only-eye problem, adds real gaze/blink/highlight behavior, improves limb and shoe weight, preserves complete orbit and remains inside desktop/mobile performance gates. The source comparison still contains actionable P1 character-production and bespoke-environment differences, so reference-level parity is not yet proven.

final result: blocked

Blocker: production facial/hair/garment anatomy and a fully bespoke, locally lit civic environment remain visible P1 differences against the source.

## 2026-07-21 reference-fidelity v87 integrated face volume, cloth tension and material-depth gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Browser-rendered implementation: `dist/interior-3d-work/civic-fidelity-v87/desktop-yaw-0-1672x941-v87.png` (`1672 × 941`, `public-plaza`, ready listening-circle state).
- Full-view same-canvas comparison: `dist/interior-3d-work/civic-fidelity-v87/reference-vs-v87-full.png`; source and implementation use the same viewport and equivalent opening social state.
- Focused cast comparison: `dist/interior-3d-work/civic-fidelity-v87/reference-vs-v87-cast.png`. A focused region is required because face integration, shoulder-to-waist cloth tension, hand contact and footwear construction are not reliable at full-room scale.
- Before/after grade evidence: `dist/interior-3d-work/civic-fidelity-v87/v86c-vs-v87.png`; both halves use the same implementation state and isolate the public-room light/grade change.
- Interaction evidence: `dist/interior-3d-work/civic-fidelity-v87/desktop-suggest-1672x941-v87.png`; selecting “提出建议” visibly changes the player to the authored speaking gesture while witnesses remain staged around the physical hearing ring.
- Responsive evidence: `dist/interior-3d-work/civic-fidelity-v87/mobile-yaw-0-390x844-v87.png`; physical walk/orbit evidence remains `dist/interior-3d-work/civic-fidelity-v86/walk-stride-1280x720-v86b.png`, `desktop-yaw-90-1672x941-v86.png` and `desktop-yaw-180-1672x941-v86.png` because v87 changes only light/grade parameters.
- Primary interactions tested in the in-app browser and local Chrome regression: social-action selection, speech/gesture state, physical WASD locomotion (`5.43m`), drag orbit (`65.3°`), contextual interaction visibility, mobile controls, desktop/mobile atomic scene flow and 78 enter/exit transitions. Browser warning/error logs were empty.

### Comparison history, fixes and post-fix evidence

- [fixed from v85 P1 / facial print sat apart from the sculpt] The role-specific curved face keeps `Head`, `NoseBridge` and `NoseTip` as real lit geometry. Its border-connected background now receives a six-pixel source-space alpha feather plus MSAA alpha-to-coverage, reducing the hard mask edge while retaining enclosed eye whites.
- [fixed from v85 P1 / smooth tubular torso] Every role receives three same-material collar/shoulder-to-waist tension ribbons. These are genuine garment geometry and survive the full 3D orbit without introducing a camera-facing layer.
- [fixed / hero furniture used uniform material response] Named civic oak/walnut and textile materials now use the existing scanned wood/fabric color, normal and roughness maps with restrained material-specific normal scale and environment response.
- [fixed from first v86 comparison / public room remained value-compressed] The civic key now carries the shape while fill, hemisphere, bounce and wash are restrained. The final grade uses slightly richer saturation, a lower contrast pivot and a stronger edge vignette; the identical-state v86c/v87 pair shows darker wood, clearer contact depth and better separation without clipping the ivory floor.
- [fixed / opening frame exposed the cast too aggressively] The authored civic camera moves to `45°` FOV, `5.30m` radius and `3.28m` height, preserving the physical listening ring while giving entrance, foreground record station, rear evidence wall and side lounge more breathing room.
- [checked / systems remain synchronized] Character sculpt contract advances to v21 and face integration to `mirrorlife-civic-face-volume-v2`; runtime diagnostics expose five facial morphs and real skin motion. Desktop remains `139` draw calls / `232,806` triangles and mobile remains `108` / `211,672`.

### Required fidelity surfaces and findings

- [checked][fonts/typography] Chinese status, place-memory, action and contextual labels remain readable at `1672 × 941` and `390 × 844`. The implementation still uses heavier, more segmented dark chrome than the source's calmer translucent editorial groups; this remains P2.
- [checked][spacing/layout rhythm] Entrance, foreground record station, hearing ring, evidence wall and lounge form a coherent foreground/middle/background path. The pullback improves breathing room, but the source still has finer prop density, controlled foreground overlap and more natural negative-space modulation.
- [checked][colors/tokens] Ivory, oak, teal, coral, paper, terrazzo and brass remain source-aligned. v87 restores darker wood and clearer material value separation, while the source retains more localized daylight bounce and subtler warm/cool transitions.
- [checked][image and asset quality] Citizens are real lit/skinned 3D geometry with full side/back volume, preserved sculpted nose, five facial morphs, independent hands and garment-tension geometry. The focused comparison still exposes much simpler eyelid/cheek/jaw topology, hair grouping, fingers, cloth construction, footwear and hand-to-prop contact than the source.
- [checked][copy/content] MirrorLife story, place-memory and social-action copy remains coherent; no fake resident count, public percentage or private source text was added to imitate the reference.
- [checked][responsiveness/accessibility] At `390 × 844`, player, two witnesses, objective, joystick, chat/jump, contextual action and all four civic actions remain reachable without clipping; keyboard and semantic button paths remain available.
- [P1][production character identity still depends on a decal-dominant face] Location: all four civic actors. Evidence: v87 fuses the atlas with a sculpted nose/head and removes the hard edge, but the focused pair still shows planar eye/cheek response, blocky hair, simplified fingers and shallow garment anatomy beside the source's integrated facial planes and layered cloth. Impact: the emotional focal point continues to read as a high-functioning prototype rather than final character art. Fix: replace the curved feature sheet with role-specific integrated eyelid, eye, cheek, lip and jaw geometry; add corrective facial/cloth shapes and production hand-contact poses on the current shared skeleton.
- [P1][environment remains modular beside the source's authored set] Location: threshold, evidence wall, lounge, cabinetry and small storytelling props. Evidence: physical maps and richer grade improve material separation, but the reference still carries substantially finer joinery, upholstery tailoring, paper/ceramic variation, indirect portal bounce and contact penumbrae. Impact: the room program matches while the craft level remains visibly one production tier lower. Fix: author the remaining threshold/casework/lounge as bespoke hero assets, add baked or probe-driven local bounce, and retain the current performance caps.
- [P2][HUD and editorial framing remain visually heavier] Location: top status groups and lower action rail. Evidence: controls are responsive and functional, but the source uses lighter translucency, more consistent icon weights and less segmented framing. Impact: interface chrome competes with the social tableau. Fix: consolidate the top status into three optically aligned translucent groups and merge redundant contextual/social action treatment without increasing screen coverage.

### Implementation checklist

1. Move the current role identities from the curved atlas onto integrated production facial geometry while preserving morph/animation/identity contracts.
2. Add role-specific corrective cloth shapes, hair clumps and authored hand-to-notebook/chin/contact poses.
3. Rebuild threshold, evidence cabinetry and lounge hero assets; add localized bounce and object-specific roughness breakup.
4. Retune the HUD after character/environment production assets land, then repeat the exact desktop/mobile/interaction/orbit comparison.

### Gate result

v87 materially improves face-to-head integration, garment tension, hero-material response, room depth and opening composition while preserving real movement, full orbit, atomic transitions and desktop/mobile performance. The same-canvas reference comparison still contains two actionable P1 production-art gaps, so literal reference-quality parity is not yet proven.

final result: blocked

Blocker: integrated production facial/cloth topology and a fully bespoke, locally lit civic environment remain visible P1 differences against the source.

## 2026-07-20 reference-fidelity v85 facial morphs, independent hands and action-driven acting gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Browser-rendered implementation: `dist/interior-3d-work/civic-fidelity-v85/desktop-yaw-0-1672x941-v85-final.png` (`1672 × 941`, `public-plaza`, ready listening-circle state).
- Full-view same-canvas comparison: `dist/interior-3d-work/civic-fidelity-v85/reference-vs-v85-final.png`; source and implementation use the same viewport and equivalent opening social state.
- Focused cast comparison: `dist/interior-3d-work/civic-fidelity-v85/reference-vs-v85-cast-final.png`. This crop is required because eyelid/jaw response, wrist posture, finger silhouette, cloth construction and contact posing are not reliable at full-room scale.
- Interaction evidence: `dist/interior-3d-work/civic-fidelity-v85/desktop-suggest-1672x941-v85.png`; selecting “提出建议” visibly changes the player from idle to a two-arm speaking gesture and puts the witnesses into listening poses.
- Responsive evidence: `dist/interior-3d-work/civic-fidelity-v85/mobile-yaw-0-390x844-v85-final.png` and `walk-stride-1280x720.png`.
- Primary interactions tested in the in-app browser and local Chrome regression: social-action selection, authored speech/gesture state, facial speech morph, independent wrist acting, physical WASD locomotion (`5.43m`), drag orbit (`65.3°`), contextual interaction visibility and mobile controls. Browser logs contained Vite connection debug entries only; no runtime warning/error was emitted.

### Comparison history, fixes and post-fix evidence

- [fixed from v84 P1 / static facial print] The curved role-identity face now exposes five real position morphs: `WarmSmile`, `SpeechJaw`, `Concern`, `Attentive` and `Blink`. Runtime gaze, blinking, listening and speech drive those morphs instead of swapping a flat sprite.
- [fixed from v84 P1 / mitten-like hand block] Every character now has independent wrist, palm, thumb and finger pivots. Relaxed, open, soft-cup, notebook-grip and thoughtful profiles produce role-specific silhouettes; the mediator's hand approaches the chin and the facilitator cups the notebook.
- [fixed / action rail did not animate the scene] “倾听线索 / 提出建议 / 引导对话” now stage deterministic temporary acting beats. The selected action controls the speaker, listener poses, speech jaw and wrist animation while preserving movement priority and persistent world-state ownership.
- [fixed / uniformly empty central floor] A restrained daylight-dapple layer adds localized leaf shadow and warm light pools across the hearing ring without creating a collider or false interaction surface.
- [checked / motion and physical contracts remain synchronized] Character animation advances to v7 while keeping continuous skin v1 and metre-scale collider parity. The verifier confirms real stride deformation, morph convergence, independent wrist rotation, action-driven gesture/speech and full return to idle.

### Runtime and regression evidence

- Desktop public-room sample remains within the strict hero-room budget at approximately `142` draw calls / `230,118` triangles for four actors.
- Mobile `390 × 844` remains within the mobile gate at approximately `108` draw calls / `211,600` triangles for three actors; core controls and the social-action rail remain visible.
- Civic character assets total `5.79MB`: player `28,900`, listener `24,784`, facilitator `28,954`, mediator `27,042` triangles; every role remains below the `35,000`-triangle cap.
- All `26` physics profiles passed. Desktop/mobile scene flow passed. All `78` enter/exit transitions completed through only `loading → ready`, with no failure or runtime error. Production build passed with the existing non-module-script and large-chunk advisories.

### Required fidelity surfaces and findings

- [checked][fonts/typography] Chinese status, place-memory, contextual and action labels are legible on desktop/mobile. The implementation still uses heavier, smaller and more segmented chrome than the source's calmer editorial UI; this remains P2.
- [checked][spacing/layout rhythm] Entrance, record station, hearing ring, evidence wall and side lounge form a complete foreground/middle/background path. The source still has substantially finer negative-space control, smaller cast scale, richer foreground overlap and a calmer pullback.
- [checked][colors/tokens] Ivory, oak, teal, coral, paper, terrazzo and brass remain source-aligned. Daylight dappling improves hierarchy, but the implementation still lacks the source's localized bounce and controlled material-to-material value separation.
- [checked][image and asset quality] Citizens are real lit/skinned geometry with full front/side/back volume, facial morphs and articulated hands. The focused comparison still exposes much simpler face topology, hair clumping, fingers, garment folds, footwear and hand-to-prop contact than the source.
- [checked][copy/content] App-specific story and social-action copy remains coherent; no fake resident count, public percentage or source text was injected to imitate the reference.
- [checked][responsiveness/accessibility] At `390 × 844`, player, witnesses, objective, joystick, chat/jump, contextual action and all four civic actions remain reachable without clipping; keyboard movement and semantic buttons remain active.
- [P1][character production topology and cloth correctives] Location: all four civic actors. Evidence: v85 adds actual facial and hand articulation, but the focused pair shows planar cheeks, compressed eye/mouth topology, coarse hair masses, simplified fingers and straight garment tubes beside the source's sculpted eyelids, cheeks, knuckles, folds and layered clothing. Impact: close social acting still reads as prototype-grade. Fix: replace the decal-dominant face with an integrated facial mesh, add corrective eyelid/cheek/jaw shapes, improve finger topology and contact poses, and add shoulder/elbow/hip/knee garment correctives.
- [P1][bespoke furniture craft and local light transport] Location: full civic room. Evidence: the implementation matches the room program and palette, but cabinetry, upholstery, papers, ceramics, doorway joinery, roughness breakup, bounce light and contact penumbrae remain visibly simpler and more modular. Impact: the environment remains one production tier below the visual target. Fix: rebuild the threshold, lounge and remaining casework as authored hero assets; add baked/probe local bounce and object-specific roughness/normal variation within the current budget.
- [P2][opening camera and HUD optical finish] Location: desktop opening and persistent controls. Evidence: the implementation crops furniture more aggressively, makes the cast larger and uses dark segmented surfaces; the source presents a calmer editorial overview and lighter integrated controls. Impact: UI and low-detail facial geometry compete with the story tableau. Fix: after the production asset pass, reduce cast screen height, pull back the authored opening camera slightly and consolidate status/action surfaces with consistent icon weights.

### Implementation checklist

1. Build integrated facial topology and cloth correctives on the existing shared skeleton; preserve the v7 state/morph contract.
2. Add higher-fidelity fingers and authored hand-to-notebook/chin/contact poses.
3. Rebuild the remaining threshold, cabinetry and lounge hero assets; add local bounce, contact shadows and per-material roughness breakup.
4. Retune the opening camera and HUD after asset fidelity improves, then repeat the identical-canvas desktop/mobile QA.

### Gate result

This iteration closes the static-face, mitten-hand and non-reactive-action blockers while preserving real movement, full orbit, physics parity, atomic transitions and performance. The identical-canvas comparison still contains actionable P1 character-topology/cloth and bespoke-environment/lighting gaps, so literal reference-quality parity is not yet proven.

final result: blocked

Blocker: integrated production facial/cloth topology and a fully bespoke, locally lit environment pass remain visible P1 differences against the source.

## 2026-07-20 reference-fidelity v84 continuous armature skinning and physical-stride gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Browser-rendered implementation: `dist/interior-3d-work/civic-fidelity-v84/desktop-yaw-0-1672x941-v84.png` (`1672 × 941`, `public-plaza`, ready listening-circle state), plus `desktop-yaw-90-1672x941-v84.png` and `desktop-yaw-180-1672x941-v84.png` for side/reverse volume.
- Full-view same-canvas comparison: `dist/interior-3d-work/civic-fidelity-v84/reference-vs-v84-full.png`; source and implementation use the same viewport and equivalent opening social state.
- Focused cast comparison: `dist/interior-3d-work/civic-fidelity-v84/reference-vs-v84-cast.png`. The crop is required because limb continuity, hand silhouette, cloth construction and face integration are too small to judge reliably in the full-room pair.
- Iteration comparison: `dist/interior-3d-work/civic-fidelity-v84/v81-vs-v84-cast.png`; this isolates the production change from rigid segmented limbs to continuous weighted limb volumes.
- Responsive and motion evidence: `dist/interior-3d-work/civic-fidelity-v84/mobile-yaw-0-390x844-v84.png` and `dist/interior-3d-work/civic-fidelity-v84/walk-stride-1280x720.png`.
- Primary interactions tested in the in-app browser and local Chrome regression: physical WASD locomotion, actual bone-driven arm/leg deformation, `65.3°` camera orbit, `90°`/`180°` volume inspection, contextual interaction visibility and mobile controls. Browser warning/error logs were empty.

### Comparison history, fixes and post-fix evidence

- [fixed from v81 P1 / rigid shoulder-elbow and hip-knee segments] Character contract `mirrorlife-civic-skin-v1` adds a real Blender armature with eight deform joints and two continuously weighted meshes per role. A `15cm` cosine-smooth blend band spans every elbow and knee, removing the hard sleeve seam and disconnected-cylinder motion visible in the earlier cast.
- [fixed / runtime controller motion did not deform a production skin] Runtime animation v6 multiplies authored pose deltas into the exported glTF rest quaternions. The movement verifier records skin stride above `0.22rad` and within `0.035rad` of the controller stride, so the visible surface and animation controller remain synchronized.
- [fixed / citizen instances could share mutable joint state] Every citizen is cloned with `SkeletonUtils`, preserving independent skeletons, bind matrices, identity materials and held props. Actor diagnostics report skin v1 and exactly two deforming meshes for every visible role.
- [fixed / traveler cargo details stayed attached to the torso] Player and listener cargo pockets/flaps are parented to moving leg pivots, so costume identity follows the physical stride instead of floating through the thigh.
- [fixed / rigid-limb mesh overhead] Replacing the segmented limb batches with two skinned volumes reduces the four-character payload from approximately `7.17MB` to `5.77MB` and lowers the public-room render cost while preserving full front/side/back volume.
- [checked / physical movement and orbit remain real] The movement capture shows a genuine alternating stride after `5.43m` of travel; the weighted camera rotates `65.3°`, and the `90°`/`180°` evidence confirms that neither character nor face is a camera-facing sprite.

### Runtime and performance evidence

- Desktop hero yaw `0°`: `131` draw calls / `224,934` triangles, with `63` actor calls across four skinned actors. Camera diagnostics report `5.10m` radius, `3.20m` height and `44°` FOV.
- Mobile `390 × 844`: `108` draw calls / `207,712` triangles, `35` actor calls across three skinned actors, `19` textures, `2×` MSAA and `1.0` pixel ratio. It remains below the `110 / 250,000` mobile gate.
- Character manifest: player `89` meshes / `28,900` triangles, listener `69 / 24,784`, facilitator `83 / 28,954`, mediator `82 / 27,042`; every role remains below the `35,000`-triangle cap.
- Atomic ready-state capture contains no prior room, black block or half-initialized actor state. Browser warning/error logs were empty.

### Required fidelity surfaces and findings

- [checked][fonts/typography] Chinese place, memory, action and interaction labels remain legible at desktop/mobile sizes. The source still has finer icon/type optical weights and calmer translucent grouping; this remains P2 HUD drift.
- [checked][spacing/layout rhythm] The implementation preserves an entrance, foreground record station, central hearing ring, rear evidence wall and side lounge across the full orbit. The source still has denser authored overlap, more natural furniture scale variation and stronger foreground framing.
- [checked][colors/tokens] Warm ivory, teal, coral, oak, paper, terrazzo and brass remain source-aligned. The room is coherent, but material response is flatter and more uniformly rough than the reference.
- [checked][image and asset quality] Four citizens are real lit, skinned geometry with full front/side/back volume. Continuous limbs are a measurable improvement over v81; the paired crop still shows simpler facial topology, hair grouping, finger articulation, cloth folds, footwear and hand-to-prop contact than the source.
- [checked][copy/content] Existing deterministic place-memory and social-action copy remains coherent; runtime values are not forged to imitate the source screenshot.
- [checked][responsiveness/accessibility] At `390 × 844`, the player, two witnesses, objective, joystick, chat, jump, contextual interaction and four social actions remain visible without clipping. Touch targets remain practical and logs are clean.
- [P1][production face, hands and cloth deformation] Location: all four civic actors. Evidence: v84 solves rigid limb continuity, but the focused pair still shows flat cheek/eyelid construction, mitten-like hands, limited finger contact, straight garment silhouettes and weak cloth tension compared with the reference. Impact: the cast remains visibly prototype-grade in the social scene's most emotionally important surface. Fix: add facial blend shapes and eyelid/jaw loops, articulated finger chains and role-specific contact poses, plus cloth corrective shapes around shoulder, elbow, hip and knee deformation.
- [P1][bespoke environment craft and localized light] Location: full civic room. Evidence: the reference has authored doorway joinery, tailored upholstery, cabinetry, paper/ceramic story detail, localized roughness, daylight bounce and contact penumbrae; the implementation remains more modular and uniformly lit. Impact: the room still sits one production tier below the target despite correct navigation, physics and performance. Fix: author the remaining hero furniture and threshold assets, bake/probe local bounce, and add object-specific roughness/normal breakup inside the recovered performance budget.
- [P2][opening camera, cast scale and HUD optical finish] Location: opening desktop frame and persistent controls. Evidence: the implementation uses larger, more frontal actors and darker segmented controls, while the source has a calmer editorial pullback, richer foreground crop and more integrated iconography. Impact: the asset gap is exposed early and UI competes with the hearing. Fix: after the face/hand/cloth pass, retune the authored opening crop and consolidate status/action surfaces.

### Implementation checklist

1. Add face/jaw/eyelid blend shapes, finger chains and authored hand-contact poses to the existing shared skeleton.
2. Add shoulder/elbow/hip/knee cloth correctives and role-specific garment silhouettes without regressing metre scale or capsule parity.
3. Replace the remaining modular threshold, cabinets and seating with bespoke hero assets; add local bounce and material breakup.
4. Retune the opening camera and HUD only after production actor/environment detail is present, then repeat identical-canvas QA.

### Gate result

This iteration closes the prior rigid-body-deformation blocker: movement is physically grounded, character instances have independent real skeletons, skin and controller motion are synchronized, full orbit remains stable, and desktop/mobile budgets improve materially. The same-canvas comparison still contains actionable P1 face/hand/cloth and bespoke environment/light differences, so exact reference-quality parity is not yet proven.

final result: blocked

Blocker: production facial/hand/cloth deformation and a fully bespoke, locally lit environment pass remain visible P1 differences against the source.

## 2026-07-20 reference-fidelity v81 grounded anatomy, conversational pose and transparent-story-layer gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Browser-rendered implementation: `dist/interior-3d-work/civic-fidelity-v81/desktop-yaw-0-1672x941-v81.png` (`1672 × 941`, `public-plaza`, ready listening-circle state), plus `desktop-yaw-90-1672x941-v81.png` and `desktop-yaw-180-1672x941-v81.png` for side/back volume and orbit composition.
- Full-view same-canvas comparison: `dist/interior-3d-work/civic-fidelity-v81/reference-vs-v81-full.png`; both halves use the exact source viewport and equivalent opening social state.
- Focused cast comparison: `dist/interior-3d-work/civic-fidelity-v81/reference-vs-v81-cast.png`. The crop is required because hand scale, lower-leg weight, held-prop contact and eye direction remain too small to judge reliably in the full-room pair.
- Responsive evidence: `dist/interior-3d-work/civic-fidelity-v81/mobile-yaw-0-390x844-v81.png` (`390 × 844`, ready state).
- Primary interactions tested in the in-app browser: `90°` and `180°` drag orbit, desktop/mobile viewport transition, atomic ready-state reveal, contextual interaction visibility and mobile touch-control layout. Browser warning/error logs were empty.

### Comparison history, fixes and post-fix evidence

- [fixed from v80 / hands and feet disappeared at gameplay scale] Sculpt contract `mirrorlife-civic-sculpt-v18` broadens palms, fingers, thumbs, thighs, knees, shins, cuffs, shoes and soles while preserving the `1.68–1.72m` body/capsule contract. The hero, side and reverse captures show stable contact silhouettes instead of needle-like lower limbs and undersized hands.
- [fixed / listener presented an invisible tray] Animation contract `mirrorlife-civic-clips-v5` lowers and counter-rotates the listener's arms, relaxes the strap-side elbow and adds a restrained weight shift. The opening frame now reads as attentive listening rather than an unexplained holding action.
- [fixed / display-case glass behaved like an opaque mint panel] Named glass materials now use a physical transmission material with `0.24` maximum opacity, `0.34` transmission, `0.16` roughness and disabled depth writing. Pastries, labels and shelf depth remain visible while the cabinet still reads as glazed furniture.
- [fixed / civic faces and portal daylight lost hierarchy] Face fill rises from `0.46` to `0.56`, curved facial identity receives a restrained emissive lift from `0.055` to `0.09`, and the authored daylight-dapple layer rises from `0.62` to `0.76`. The final pair separates faces from hair and restores a more legible warm threshold without flattening the full head volume.
- [checked / improvements survive complete orbit and portrait layout] The revised anatomy, face identity and social pose remain full-volume at `90°`, `180°` and `390 × 844`; no camera-facing sprite, flat character card or non-physical portrait substitute is used.

### Runtime and performance evidence

- Desktop hero yaw `0°`: `147` draw calls / `283,170` triangles, with `77 / 3 / 67` calls across room/models/actors. Camera diagnostics report a `5.55m` orbit radius, `3.42m` height and `46°` FOV in the captured rear arc.
- Mobile `390 × 844`: `110` draw calls / `240,790` triangles, `13` textures, `2×` MSAA and `1.0` pixel ratio. It meets the mobile draw-call ceiling and stays below `250,000` triangles.
- Character assets total approximately `7.17 MB`: player `30,428`, listener `27,512`, facilitator `31,682` and mediator `29,770` triangles, all below the `35,000`-triangle role cap and validated against sculpt v18 / animation clips v5.
- Atomic rendering exposed only the room-consistent loading shell before `data-interior-render-phase=ready`; the final desktop and mobile captures contain no prior room, black block or half-initialized actor state.
- World regression: the physical player walked `3.05m` and the weighted camera rotated `65.3°`; desktop/mobile scene flow passed; all `26` interiors completed `78` enter/exit transitions with only `loading → ready` phases and no failure or runtime error.
- Static/build validation: civic characters, civic hero props, all 26 interior physics profiles, syntax/project references, production build and `git diff --check` passed. Existing non-module-script and large-chunk Vite advisories remain unchanged.

### Required fidelity surfaces and findings

- [checked][fonts/typography] Chinese location, memory-state, contextual action and social-action labels remain readable on desktop and mobile. The source still uses finer icon/type optical weights and more balanced translucent grouping; this remains P2 HUD drift.
- [checked][spacing/layout rhythm] The threshold, record station, central four-person hearing, evidence wall, lounge and floor story-line produce a coherent foreground/middle/background composition around the movable player. The reference still has denser authored overlap, more foreground crop and finer negative-space control.
- [checked][colors/tokens] Ivory, teal, coral, oak, paper, terrazzo and brass remain aligned with the source. Glass now behaves as a distinct optical material rather than another pastel plastic surface.
- [checked][image and asset quality] All citizens and hero furniture are lit geometry with complete front/side/back volume. The identical-canvas and focused comparisons still show lower facial topology, hair strand grouping, finger articulation, cloth tension, cabinet joinery and upholstery detail than the source.
- [checked][copy/content] Existing deterministic place-memory and social-action copy remains coherent; live QA values are intentionally not forged to copy the source screenshot.
- [checked][responsiveness/accessibility] Mobile keeps the player, two social witnesses, objective marker, joystick, chat, jump, contextual interaction and four action choices visible without clipping. Touch targets remain practical and no warning/error log was emitted.
- [P1][production body deformation and emotional acting] Location: all four civic actors. Evidence: v18 fixes gameplay-scale hand/foot weight and v5 removes the listener's false tray pose, but the focused pair still shows rigid shoulders, single-piece elbows, limited finger arcs, weak cloth tension and less expressive whole-body conversation than the source. Impact: the emotional product surface still reads as an authored prototype rather than a production social scene. Fix: migrate the current identity, scale and clip contracts onto a genuinely skinned production rig with shoulder/elbow deformation, hand contact poses, cloth corrective shapes and role-specific conversational beats.
- [P1][bespoke environment craft and localized light transport] Location: full civic room. Evidence: the implementation now has transparent storytelling glass and stronger portal/facial hierarchy, but the source retains substantially finer doorway construction, cabinet joinery, upholstery tailoring, paper/ceramic variation, localized roughness, daylight bounce and contact penumbrae. Impact: the room remains one production tier below the target even though its spatial logic, movement and orbit work. Fix: replace the remaining modular furniture with authored hero assets and add baked/probe-driven local bounce plus object-specific roughness breakup inside the current performance envelope.
- [P2][opening camera and HUD optical finish] Location: initial desktop view, top status strip and lower action rail. Evidence: the implementation establishes the same broad social tableau but presents larger, more frontal low-poly actors and darker segmented controls; the source has a calmer editorial pullback, richer foreground framing and more integrated iconography. Impact: the implementation exposes its geometry limits sooner and the chrome competes with the hearing. Fix: after the production-rig pass, retune the authored opening lens/crop and consolidate the status/action surfaces rather than hiding the current asset gap with a premature camera-only change.

### Gate result

This iteration materially improves grounded anatomy, social-pose legibility, transparent cabinet storytelling and face/portal hierarchy while preserving physical movement, complete orbit, atomic loading and strict desktop/mobile budgets. The exact-size same-canvas review still contains actionable P1 character-deformation and bespoke environment/light differences, so literal reference-quality parity remains unproven.

final result: blocked

Blocker: production-grade skinned body/hand/cloth acting and a fully bespoke, locally lit environment pass remain visible P1 differences against the source.

## 2026-07-20 reference-fidelity v80 metre-scale hero props, editorial camera and material separation gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Browser-rendered implementation: `dist/interior-3d-work/civic-fidelity-v80/desktop-yaw-0-1672x941-v80final2.png` (`1672 × 941`, `public-plaza`, ready listening-circle state), plus `desktop-yaw-90-1672x941-v80final2.png` and `desktop-yaw-180-1672x941-v80final2.png` for complete-volume inspection.
- Full-view same-canvas comparison: `dist/interior-3d-work/civic-fidelity-v80/reference-vs-v80final2-full.png`; both halves use the exact source viewport and equivalent opening social state.
- Focused cast comparison: `dist/interior-3d-work/civic-fidelity-v80/reference-vs-v80final2-cast.png`. This crop is required because face integration, hand silhouette, garment construction and social posture remain too small to judge safely in the full-room pair.
- Responsive evidence: `dist/interior-3d-work/civic-fidelity-v80/mobile-yaw-0-390x844-v80final.png` (`390 × 844`, ready state).
- Primary interactions tested in the in-app browser: `90°` and `180°` drag orbit, responsive viewport switch, atomic ready-state reveal, contextual action visibility and mobile touch-control layout. Browser warning/error logs were empty.

### Comparison history, fixes and post-fix evidence

- [fixed from v79 / wall console render-collider mismatch] The normalized notice-console profile drops from `1.75` to `1.28`. Its rendered width now returns to approximately `2.2m`, matching the authoritative `2.24m` collider instead of drawing a roughly `3m` wall unit around a smaller blocker. The hero and side-orbit captures show a credible civic notice station rather than a wall-sized prop.
- [fixed / foreground record desk dominated the listening conflict] The desk contracts from `1.12` to `1.02` display scale; its collider contracts from `2.24 × 1.30m` to `1.90 × 0.96m`. The final opening keeps the record station as a foreground frame without hiding the cast or producing invisible collision margins.
- [fixed / management-game bird's-eye framing] The civic desktop camera lowers from `3.48m` to `3.20m`, raises its social eye-line target from `0.72m` to `0.82m` and tightens the opening radius from `5.45m` to `5.10m`. The final same-size pair retains more portal and character silhouette, less empty floor and a stronger foreground/middle/background composition.
- [fixed / yellow plastic value collapse] Civic key/fill/wash, saturation, contrast, warm multiplication, screen-edge ink and vignette were rebalanced. Actor skin roughness, cloth weave and the curved face's subtle emissive response now separate skin, fabric, wood, paper, terrazzo and brass more clearly without discarding the source palette.
- [fixed / actor silhouette too narrow for the illustrated source] Character sculpt contract `mirrorlife-civic-sculpt-v17` widens the torso, arms and head while preserving the `1.68–1.72m` metre/capsule contract. Rebuilt GLBs keep the complete animated front, side and back volume; this is not a camera-facing portrait substitute.

### Runtime and performance evidence

- Desktop hero yaw `0°`: `135` draw calls / `266,910` triangles, with `65 / 3 / 67` calls across room/models/actors. Camera diagnostics report `5.10m` orbit radius, `3.20m` height and `44°` FOV.
- Mobile `390 × 844`: `110` draw calls / `238,678` triangles, `13` textures, `2×` MSAA and `1.0` pixel ratio. This exactly meets the mobile draw-call ceiling and remains below `250,000` triangles.
- Character assets total approximately `7.14 MB`: player `29,724`, listener `26,808`, facilitator `30,978` and mediator `29,066` triangles, all validated against sculpt v17 and animation clips v4.
- Atomic rendering exposed only the room-consistent loading shell before `data-interior-render-phase=ready`; the final screenshots contain no old room, black block or half-initialized actor state.
- World regression: the physical player walked `1.53m` and the weighted camera rotated `65.3°`; all `26` interiors passed the unified physics audit; desktop/mobile scene flow passed; all `78` enter/exit transitions completed with only `loading → ready` phases and no failure or runtime error.
- Static/build checks: civic character and hero-prop validation, `pnpm check`, production build and `git diff --check` passed. Existing non-module-script and large-chunk Vite advisories remain unchanged.

### Required fidelity surfaces and findings

- [checked][fonts/typography] Chinese location, memory-state, interaction and social-action labels remain readable at `1672 × 941` and `390 × 844`. The source retains finer icon/type optical weights and calmer grouping; this remains P2 interface drift.
- [checked][spacing/layout rhythm] Portal, listening ring, four-person conflict, evidence wall, lounge, record desk and reverse witness wall form a complete orbitable hierarchy. The revised camera and prop footprints materially reduce empty-floor and oversized-furniture drift, but the source still has denser authored overlap and more controlled negative space.
- [checked][colors/tokens] Warm ivory, teal, coral, oak, paper, terrazzo and brass remain source-aligned. The new neutral grade improves material separation without introducing unrelated colors.
- [checked][image and asset quality] All visible citizens and hero props are real lit geometry with front/side/back surfaces. The focused pair still shows substantially simpler facial topology, hair clumping, finger articulation, cloth folds, cabinet joinery and upholstery than the source.
- [checked][copy/content] Existing deterministic place-memory and social-action copy is coherent and unchanged; the QA resident count is intentionally the current runtime state rather than a fabricated copy of the source capture.
- [checked][responsiveness/accessibility] Mobile preserves the player, two witnesses, target marker, joystick, chat, jump, contextual interaction and all four social actions without clipping. Touch targets remain practical and no warning/error log was emitted.
- [P1][production character anatomy and social acting] Location: all four civic actors. Evidence: v17 gives the cast a broader, more illustrated silhouette, but the focused comparison still shows straighter limbs, rigid shoulders, blockier hands, flatter cloth and less differentiated head/hair construction than the source. Impact: the social simulation's emotional focal point still reads as a polished prototype beside the target. Fix: transfer the existing identity/animation contract to a genuinely skinned production rig with shoulder/elbow deformation, finger arcs, cloth-tension shapes, role-specific hair clumps and authored conversational poses.
- [P1][bespoke environment and physically localized light] Location: full civic room. Evidence: the source carries finer doorway construction, cabinetry joinery, tailored upholstery, paper/ceramic variation, indirect portal bounce, penumbra and object-specific roughness. The implementation has stronger scale and composition but still reads more modular and uniformly lit. Impact: the room remains one production tier below the target despite correct navigation and performance. Fix: replace remaining modular furniture with authored hero assets and add probe/baked local bounce plus controlled roughness breakup inside the current mobile budget.
- [P2][HUD optical finish] Location: top status strip and bottom action rail. Evidence: the implementation is compact and functional but darker, more segmented and less optically balanced than the translucent editorial controls in the source. Impact: UI chrome competes with the social tableau. Fix: consolidate the status surface, normalize icon weights and merge the redundant contextual/social action treatment.

### Gate result

This iteration corrects two measurable render-collider mismatches, establishes a lower and tighter social camera, improves actor proportion and material separation, preserves true metre-scale movement/orbit and stays inside every desktop/mobile rendering budget. The identical-canvas and focused-cast comparisons still expose actionable P1 production character and bespoke environment/lighting gaps, so literal reference-quality parity remains unproven.

final result: blocked

Blocker: production-grade character skinning/hand/cloth acting and a fully bespoke, locally lit environment pass remain visible P1 differences against the source.

## 2026-07-20 reference-fidelity v79 curved facial identity and foreground story-line gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Browser-rendered implementation: `dist/interior-3d-work/civic-fidelity-v79/desktop-yaw-0-1672x941-v79-final.png` (`1672 × 941`, `public-plaza`, yaw `0°`) and `desktop-yaw-180-1672x941-v79-final.png` (`1672 × 941`, yaw `180°`). The side-volume review used `desktop-yaw-90-1672x941-v79b.png`.
- Full-view same-canvas comparison: `dist/interior-3d-work/civic-fidelity-v79/reference-vs-v79-final-full.png`; source and implementation use the same `1672 × 941` viewport and listening-circle state.
- Focused cast comparison: `dist/interior-3d-work/civic-fidelity-v79/reference-vs-v79-final-cast.png`. This focused region is required because eye direction, mouth expression, hair occlusion and face-to-head scale are not reliably judgeable in the full-room pair.
- Responsive evidence: `dist/interior-3d-work/civic-fidelity-v79/mobile-yaw-0-390x844-v79-final.png` (`390 × 844`, ready state).
- Primary interactions tested: metre-space WASD locomotion, authored walk/idle blending, `65.3°` drag orbit, `90°`/`180°` face-volume inspection, desktop/mobile scene flow and all `78` indoor transitions. Browser warning/error logs were empty.

### Comparison history, fixes and post-fix evidence

- [fixed from v78 P1 / readable silhouette but toy-dot facial identity] A purpose-built `1254 × 1254` four-role facial atlas now supplies illustrated eyes, brows, nose and mouth without importing the source portrait's incompatible hair or head silhouette. Each role has its own gaze and expression language instead of sharing procedural dots.
- [fixed from first v79 comparison / facial print too large and dark] The curved facial surface contracts from `0.39 × 0.31m` to `0.35 × 0.285m`, and public-room face fill rises from `0.34` to `0.46`. The final focused pair retains legible expressions without turning the face into a flat mask.
- [fixed / camera-facing sticker risk] The atlas is projected onto an `18 × 12` curved plane parented to `HeadPivot`, writes depth and is normally occluded by full 3D fringe, side and back hair. The `90°` and `180°` browser captures show the decal conforming to the head rather than rotating toward the camera.
- [fixed / stale procedural face could flash before the authored asset] Civic atomic readiness now waits for both the role GLB and face atlas. The old protruding eye/brow/mouth stack is removed only when the authored curved face is available, preventing an identity swap after scene reveal.
- [fixed / lower-right foreground had no narrative continuation] A restrained brass floor sweep now continues the listening-circle geometry toward the lower-right exit direction. It is floor-level, non-colliding and desktop-only, adding foreground movement without promising a false walkable prop.
- [fixed / locomotion regression depended on shader-compilation timing] The character verifier now waits for the authored `150ms` idle-to-walk blend to finish and samples more than one complete `0.72s` stride cycle. This preserves the `>0.22rad` readability gate while removing headless-frame timing variance.

### Runtime and performance evidence

- Desktop hero yaw `0°`: `135` draw calls / `266,030` triangles; reverse yaw `180°`: `147 / 279,474`. Both stay below the strict `160 / 300,000` civic-room gate.
- Mobile `390 × 844`: `110` draw calls / `238,018` triangles and `13` textures, meeting the mobile draw-call ceiling and staying below `250,000` triangles.
- Character assets remain approximately `7.08 MB`: player `29,504`, listener `26,588`, facilitator `30,758`, mediator `28,846` triangles. The authored face contract reports `faceMode: curved-atlas` for all four roles.
- World regression: all `26` interiors passed the physics audit; desktop/mobile scene flow passed; all `78` enter/exit transitions completed with no failure or runtime error. Character exploration moved the player `5.01m`, completed the full authored walk cycle and rotated the camera `65.3°`.
- Static/build checks: civic character and hero-prop validation, `pnpm check`, production build and `git diff --check` passed. Existing non-module-script and large-chunk build advisories remain unchanged.

### Required fidelity surfaces and findings

- [checked][fonts/typography] Chinese place-memory, status and social-action labels remain readable at desktop and mobile sizes. The implementation still has heavier icon/type treatment and more segmented grouping than the source, retained as P2 HUD drift.
- [checked][spacing/layout rhythm] The left threshold, central cast, rear evidence wall, right lounge, lower-left record desk and new lower-right brass sweep provide a deliberate foreground/middle/background path. The source still achieves denser prop overlap and finer negative-space control.
- [checked][colors/tokens] Warm ivory, neutral terrazzo, teal cloth, coral, oak and brass remain source-aligned. The role face atlas adds brown, forest-green, teal and moss-green identity accents without expanding the room palette.
- [checked][image and asset quality] The facial atlas is a generated production asset rather than CSS, SVG, emoji or placeholder art. It is mapped to a curved, lit, depth-tested 3D surface with full side/back head volume. The paired crop nevertheless shows less integrated cheek, eyelid, hair and cloth geometry than the source.
- [checked][copy/content] Existing deterministic MirrorLife story copy and six-resident QA state are preserved instead of fabricating the reference's thirteen-resident capture.
- [checked][responsiveness/accessibility] At `390 × 844`, the player, two witnesses, story objective, joystick, jump/chat controls and four social actions remain visible without clipping. Touch and keyboard paths remain operational.
- [P1][production body, hair and cloth deformation] Location: all four civic actors. Evidence: role-specific facial identity now reads immediately, but the focused pair still shows simpler hands, hair clumps, garment folds, shoulders and hand-to-prop contact than the source. Impact: facial improvement makes the remaining body-production gap more visible during close social scenes. Fix: migrate the existing identity contract onto a skinned production body rig with finger arcs, cloth tension shapes, corrected shoulder deformation and role-specific sculpted hair clumps.
- [P1][bespoke environment craft and localized indirect light] Location: full civic room. Evidence: the source has materially richer cabinetry joinery, textiles, paper/ceramic narrative detail, doorway construction, localized roughness and multi-bounce daylight. The implementation is coherent and navigable but remains cleaner and more modular. Impact: the setting still reads one production tier below the character-led target. Fix: author the remaining hero cabinets, seating and threshold pieces as bespoke assets; add baked/probe local bounce and per-object roughness breakup within the current mobile budget.
- [P2][HUD optical finish] Location: top status controls and lower action rail. Evidence: controls are functional and responsive but darker, smaller and more segmented than the source. Impact: interface chrome competes with the softer editorial room composition. Fix: consolidate status into three translucent groups, align icon optical weights and merge duplicate contextual/social actions.

### Gate result

This iteration replaces generic toy-dot faces with role-specific illustrated identity on a genuinely curved, orbit-safe 3D surface, strengthens the foreground narrative line and preserves physical locomotion, atomic loading and strict performance budgets. The identical-canvas review still exposes actionable P1 production body deformation and environment/lighting differences, so literal reference-quality parity remains unproven.

final result: blocked

Blocker: production body/hand/cloth deformation plus a fully bespoke, locally lit environment pass remain visible P1 gaps against the source.

## 2026-07-20 reference-fidelity v78 illustrated head proportion and social-acting gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Browser-rendered implementation: `dist/interior-3d-work/civic-fidelity-v78/desktop-yaw-0-1672x941-v78b.png` (`1672 × 941`, `public-plaza`, yaw `0°`) and `desktop-yaw-180-1672x941-v78c.png` (`1672 × 941`, yaw `180°`).
- Full-view same-canvas comparison: `dist/interior-3d-work/civic-fidelity-v78/reference-vs-v78-final-full.png`; both halves use the exact `1672 × 941` viewport and the same listening-circle state.
- Focused cast comparison: `dist/interior-3d-work/civic-fidelity-v78/reference-vs-v78b-cast-focus.png`; a focused region was required because facial scale, head/shoulder proportion, held props and social posing are too small to judge reliably in the full room view.
- Responsive evidence: `dist/interior-3d-work/civic-fidelity-v78/mobile-yaw-0-390x844-v78.png` (`390 × 844`, ready state). A final `1280 × 720` browser capture is also stored as `desktop-yaw-0-1672x941-v78-final.png` despite the legacy filename.
- Primary interactions tested: physical player movement, camera rotation, desktop/mobile scene flow, contextual interaction UI and repeated indoor transitions. Browser warning/error log filter returned an empty list.

### Comparison history, fixes and post-fix evidence

- [fixed from v77 P1 / reference cast had illustrated head presence while the implementation read as small-headed toys] `HeadPivot` moves down `0.035m` and grows from roughly `0.87 × 0.87 × 0.84` to `0.96 × 0.96 × 0.94`. The total metre height is preserved while the head-to-shoulder relationship moves toward the source's approximately `80%` ratio. The focused comparison shows a materially stronger face read without changing the Rapier capsule.
- [fixed / black-disc eyes and cold ink exaggerated procedural low-poly facets] Sclera, iris, pupil and glint proportions are rebalanced; lower eye contours and upper lids become thinner; facial ink changes from near-black to warm charcoal. Skin receives a restrained wrap response, hair receives a narrow sheen and cloth rim response is softened.
- [fixed / four citizens shared overly symmetrical mannequin posture] Animation contract `mirrorlife-civic-clips-v4` adds a player weight shift and role-specific head/torso asymmetry for listener, facilitator and mediator. The hero and reverse orbit now read as a social exchange rather than four identical idle rigs.
- [rejected after source-asset inspection / direct 2D face pasted on the 3D head] The existing citizen atlas was inspected as four focused face crops. It contains excellent identity art, but the crops include role-specific hair, glasses and hard-hat silhouettes that conflict with the current full-volume hair and side/back orbit. A curved decal would create a double-hair or flat-mask P1 failure, so it is not shipped; the avatar atlas remains identity reference rather than a camera-facing shortcut.
- [checked / embodied movement, camera and animation contract] The browser regression moved the player `3.53m` and rotated the camera `65.3°`; all civic actors reported the new v4 animation contract and remained attached to the metre-space physical scene.

### Runtime and performance evidence

- Desktop same-size hero frame: `151` draw calls / `285,182` triangles. A final `1280 × 720` recapture reported `154 / 285,182`; both remain below the strict `160 / 300,000` civic-room gate.
- Mobile `390 × 844`: `107` draw calls / `249,850` triangles, `1.0` pixel ratio and three visible civic actors, below the `110 / 250,000` gate.
- Character contract advances to `mirrorlife-civic-sculpt-v16` / `mirrorlife-civic-clips-v4`: player `29,504`, listener `26,588`, facilitator `30,758`, mediator `28,846`; four roles remain `7.08 MB` total.
- World regression: all `26` interiors passed the physics audit; desktop/mobile scene flow passed; all `78` enter/exit transitions completed with no failure or runtime error.
- Static/build checks: civic character/hero-prop validation, `pnpm check`, production build and `git diff --check` passed. The build retains only the existing non-module-script and large-chunk advisories.

### Required fidelity surfaces and findings

- [checked][fonts/typography] Chinese place-memory, location and action labels remain readable at desktop and mobile widths. The source still has finer icon/type optical weight and tighter top-bar grouping; this remains P2 HUD drift.
- [checked][spacing/layout rhythm] The portal, listening circle, notice wall, lounge and foreground record desk create the same broad foreground/middle/background hierarchy. The implementation still leaves more unmodulated floor and weaker foreground object overlap than the source.
- [checked][colors/tokens] Ivory plaster, terrazzo, teal upholstery, coral accents, oak and brass remain aligned with the source. Warm-charcoal facial ink and restrained skin/hair response improve the cast without inventing a new palette.
- [checked][image and asset quality] The four citizens are lit full-volume GLBs with real front, side and back geometry. No billboard, CSS figure, placeholder portrait or sprite-face mask is used. The full-view comparison still exposes lower geometry, texture and material specificity than the source.
- [checked][copy/content] The deterministic QA state intentionally reports `6` residents and the existing MirrorLife story copy rather than fabricating the source capture's `13`-resident state.
- [checked][responsiveness/accessibility] At `390 × 844`, player, two witnesses, story target, joystick, chat, jump, contextual action and four social actions remain visible and usable. The mobile visual hierarchy is denser but does not clip core controls.
- [P1][character production anatomy and facial performance] Location: all four civic actors. Evidence: the paired cast crop shows improved proportions and asymmetric posing, but the source still has integrated eyelids and cheeks, smoother hair clumping, more natural hands, cloth folds and hand-to-prop contact; the implementation retains visible faceting and simplified doll-like eyes. Impact: characters are the social simulation's emotional product surface, so this gap is immediately noticed. Fix: move to a genuinely skinned facial/hand rig with corrected normals, eyelid loops, cheek/jaw blend shapes, finger arcs, cloth tension shapes and role-specific hair cards or sculpted clumps.
- [P1][bespoke environment craft and indirect light] Location: full civic room. Evidence: the source has materially richer cabinetry joinery, textile tailoring, paper/ceramic storytelling, doorway construction, localized roughness and multi-bounce daylight; the implementation remains cleaner and more modular. Impact: the room still reads as a polished prototype beside a production illustration. Fix: replace the remaining modular room pieces with authored hero assets and add baked or probe-driven local bounce/roughness variation without raising the existing mobile draw-call budget.
- [P2][HUD optical finish and desktop framing] Location: top status controls and lower action bar. Evidence: implementation controls are functional but smaller, darker and more segmented than the source; the top bar interrupts the background notice wall and the lower interaction chip competes with the social action rail. Impact: the 3D scene loses some editorial calm. Fix: consolidate top status into three balanced translucent groups, reserve a safe strip above the focal wall and merge the contextual interaction into the active social action when both target the same object.

### Gate result

This iteration materially improves illustrated head presence, facial value hierarchy and social acting while preserving full-volume orbit, physical movement, mobile controls and strict performance budgets. The exact-size side-by-side still contains actionable P1 character-production and bespoke environment/lighting differences, so literal reference-quality parity remains unproven.

final result: blocked

Blocker: production facial/hand/cloth deformation plus a fully bespoke, locally lit environment asset pass remain visible P1 gaps against the source.

## 2026-07-20 reference-fidelity v77 metre-scale cast and rigid held-prop gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Final in-app Browser implementation: `dist/interior-3d-work/civic-fidelity-v77/desktop-yaw-0-1672x941-v77.png` (`1672 × 941`, public-plaza, yaw `0°`) and `desktop-yaw-180-1672x941-v77.png` for the complete opposite orbit.
- Same-canvas comparisons: `dist/interior-3d-work/civic-fidelity-v77/reference-vs-v77-full.png` and `reference-vs-v77-cast-focus.png`, with source and final implementation captured at identical size and state. `v76-vs-v77-cast-focus.png` isolates this iteration's cast-scale change.
- Responsive evidence: `dist/interior-3d-work/civic-fidelity-v77/mobile-yaw-0-390x844-v77.png` (`390 × 844`, final ready state). In-app Browser warning/error logs are empty.

### Comparison history, fixes and post-fix evidence

- [fixed from v76 P1 / render and physics used different actor scale] All four GLBs are authored at `1.68–1.72m`, but the civic payload applied an additional `0.92` visual scale while Rapier retained the real capsule size. The runtime now renders civic actors at `1.0`, restoring mesh/collider parity and the reference-like body height visible in `v76-vs-v77-cast-focus.png`.
- [fixed / cast read as scattered room props] Listening stations move inward from approximately `±1.72m` to `±1.54m`, with the rear witness moving from `-1.58m` to `-1.42m`. The final paired crop shows a more intimate four-person hearing while keeping the `1.5m` story centre free of furniture and preserving actor-to-actor collision clearance.
- [fixed / facilitator notebook exploded into disconnected bars] Cover, pages, spine, elastic and pencil now share a single `NotebookPivot`. Authored listen motion rotates one rigid object instead of independently transformed parts; hero and reverse frames show a coherent open notebook in the facilitator's hands.
- [fixed / cap hair collapsed into one dark helmet] Player and listener crown lobes receive stronger silhouette displacement and a slightly lifted highlight family. The complete orbit retains distinct front clumps and back volume without adding geometry.
- [fixed / costume panels overpowered the torso] Traveler vest and civic coat panels are slimmer, shallower and shorter, reducing the rigid armour-plate read while retaining role identity, animation clips and the existing capsule contract.
- [checked / embodied movement and rotation] Local Chrome moved the physical player `3.41m` and rotated the weighted camera `65.3°`; the four authored roles returned to idle/listen states and stayed collision-backed after the scale correction.

### Runtime and performance evidence

- Desktop hero yaw `0°`: `151` draw calls / `285,182` triangles, below the strict `160 / 300,000` civic-room gate.
- Desktop reverse yaw `180°`: `160` draw calls / `298,626` triangles, below the same complete-orbit gate.
- Mobile `390 × 844`: `107` draw calls / `249,850` triangles, below the `110 / 250,000` gate with the contextual action and all touch controls visible.
- Character contract advances to `mirrorlife-civic-sculpt-v14` / `mirrorlife-civic-clips-v3`: player `29,504`, listener `26,588`, facilitator `30,758`, mediator `28,846`; four roles total `7.08 MB`. The notebook hierarchy fix removes `56` triangles from each civic-skirt role instead of increasing the budget.
- Hero-prop contract remains valid: three authored civic props at `34,332` triangles.
- World regression: all `26` interiors passed the physics audit; desktop/mobile scene flow passed; all `78` enter/exit transitions completed with no failure or runtime error.
- Static/build checks: civic character/hero-prop validation, `pnpm check` and the production build passed. The build retains only the existing non-module-script and large-chunk advisories.

### Required fidelity surfaces

- [checked][interaction/motion] Render mesh, metre-space capsule, authored skeleton, walk/listen clips, Rapier movement and weighted orbit now agree on the same actor scale.
- [checked][spacing/layout rhythm] The four citizens own the middle-ground listening circle at the same visual weight as the source; the threshold, evidence wall, lounge and foreground record desk continue to establish depth.
- [checked][colors/tokens] Warm ivory, neutral terrazzo, teal, coral, oak and brass remain stable. Hair highlight changes improve small-scale silhouette separation without introducing a new palette.
- [checked][image and asset quality] All four citizens remain lit, shadowed, full-volume GLBs with real back/side geometry. The notebook fix is authored hierarchy, not a camera-facing replacement.
- [checked][fonts/typography] Chinese location, memory and social-action labels remain readable at desktop and mobile sizes. The reference still has finer icon and type optical alignment, classified below as P2 HUD drift.
- [checked][copy/content] The live deterministic QA state intentionally shows `6` residents and the established MirrorLife action copy rather than fabricating the reference capture's `13`-resident state.
- [checked][responsiveness/accessibility] At `390 × 844`, joystick, chat, jump, interaction and four social actions remain within the viewport; the player and two witnesses remain readable inside the strict mobile budget.
- [P1][production character anatomy and deformation] Correct scale exposes rather than hides the main remaining gap: the source still has substantially better cheek/eyelid topology, smooth hair clumping, finger articulation, cloth folds, shoe construction and skin/cloth response. Current citizens remain recognizably low-poly beside the source.
- [P1][whole-room bespoke asset craftsmanship] The source retains finer cabinetry joinery, upholstery tailoring, ceramic/paper variation, architectural reveals and prop-specific wear. The current room is coherent and functional but still less authored object by object.
- [P1][localized indirect illumination] The warm portal/cool lounge structure is correct, but the source has richer skin response, multi-bounce daylight, softer contact penumbrae and more localized roughness breakup.
- [P2][HUD optical finish and reverse-orbit framing] The HUD remains less refined than the reference, and the rear witness occupies a heavy foreground position at `180°`; gameplay remains readable, but the opposite orbit needs a dedicated composition target in a later pass.

### Gate result

This iteration fixes the hidden metre-scale contract error, restores reference-like cast prominence, strengthens social proximity and makes the facilitator's notebook behave as one believable held object while preserving movement, collision, full orbit and every performance gate. The identical-canvas review still exposes production character anatomy, bespoke environment and localized indirect-light P1 gaps, so literal reference-quality parity remains unproven.

final result: blocked

Blocker: production facial/hand/cloth deformation, a fully bespoke environment asset set and richer localized indirect illumination remain visible P1 differences.

## 2026-07-20 reference-fidelity v76 material-depth, portal-bounce and editorial-foreground gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Final in-app Browser implementation: `dist/interior-3d-work/civic-fidelity-v76/desktop-yaw-0-1672x941-v76.png` (`1672 × 941`, public-plaza, yaw `0°`) and `desktop-yaw-180-1672x941-v76.png` for the complete opposite orbit.
- Same-canvas comparison: `dist/interior-3d-work/civic-fidelity-v76/reference-vs-v76-full.png`, with source and final live implementation at identical size and state.
- Responsive evidence: `dist/interior-3d-work/civic-fidelity-v76/mobile-yaw-0-390x844-v76.png` (`390 × 844`, final ready state). In-app Browser warning/error logs are empty.

### Comparison history, fixes and post-fix evidence

- [fixed from v75 P1 / ivory room collapsed into one bright value] Public lighting now uses a lower ambient/fill ratio and keeps the directional key as the primary form light. GTAO is tighter and stronger, so feet, furniture bases, display cabinetry and wall joinery regain contact without dirtying the terrazzo field.
- [fixed / portal daylight had no localized color logic] A dedicated warm portal bounce is aimed from the left threshold into the listening circle, balanced by a restrained cool reflection near the right lounge. The source/implementation pair now shows a readable warm-left/cool-right material rhythm rather than uniform cream illumination.
- [fixed / public wood read as flat painted plastic] Desktop wood surfaces now use a neutralized CC0 Poly Haven wood diffuse together with the existing physical normal and roughness maps. Authored oak/walnut colors remain the palette source while real grain and roughness break up broad desk, console and architectural surfaces. Mobile intentionally keeps the cheaper map-free material path.
- [fixed / foreground record desk remained generic] The lower-left record station gains an oak apron, drawer front, brass pull and a full-volume civic brief with frame, paper, clip and response marks. The brief is readable from the reverse side as a real object and remains within the existing shared render/collider transform.
- [fixed / hero lens enlarged the room centre but lost editorial context] The desktop civic lens moves from `40° / 5.20m / 3.34m` to `44° / 5.45m / 3.48m`. The final same-size comparison retains the cast as the middle-ground subject while restoring more of the threshold, record station, lounge and wall evidence.
- [fixed / architecture spent budget on invisible long-edge bevels] Straight wall, dado, base and reveal runs now use true rectilinear geometry, matching the reference joinery and removing `3,552` triangles from the reverse view. Brass path tubes also use a silhouette-equivalent lower segment count, bringing mobile below its hard cap.
- [checked / embodied movement and rotation] Local Chrome moved the physical player `3.17m` and rotated the weighted camera `65.3°`; materials, light and foreground framing remain attached to the navigable, Rapier-backed scene rather than a fixed visual plate.

### Runtime and performance evidence

- Desktop hero yaw `0°`: `151` draw calls / `285,294` triangles, below the strict `160 / 300,000` civic-room gate.
- Desktop reverse yaw `180°`: `160` draw calls / `299,362` triangles, below the same complete-orbit gate.
- Mobile `390 × 844`: `107` draw calls / `249,906` triangles, below the `110 / 250,000` gate with three actors and all touch controls visible.
- Character and hero-prop contracts remain valid: four civic roles at `7.09 MB` total and three authored hero props at `34,332` triangles.
- World regression: all `26` interiors passed the physics audit; desktop/mobile scene flow passed; all `78` enter/exit transitions completed with no failure or runtime error.
- Static/build checks: civic character/hero-prop validation, `pnpm check`, production build and `git diff --check` passed. The build retains only the existing non-module-script and large-chunk advisories.

### Required fidelity surfaces

- [checked][interaction/motion] Metre-space Rapier movement, keyboard/touch controls, camera orbit, atomic loading and the shared record-desk render/collider transform remain intact.
- [checked][spacing/layout rhythm] The wider editorial lens and new foreground brief establish a stronger foreground/middle-ground/background progression without shrinking the four-person listening conflict into background decoration.
- [checked][colors/materials] Warm plaster, neutral terrazzo, teal fabric, coral accents, oak and brass retain the source palette. The new physical wood source changes surface response, not the authored color language.
- [checked][lighting/readability] Warm threshold energy, cooler lounge separation, tighter contact occlusion and reduced ambient lift improve facial, garment and furniture-plane readability in the exact-size comparison.
- [checked][responsiveness/accessibility] At `390 × 844`, the player, target and witnesses remain visible; joystick, chat, jump, contextual interaction and all four social actions stay usable inside the hard rendering budget.
- [P1][production character anatomy and deformation] The reference still has substantially better face topology, hair clumping, eyelid/cheek integration, hand articulation, cloth tension and hand-to-prop contact. Lighting helps the current sculpts but cannot substitute for production deformation.
- [P1][whole-room bespoke asset craftsmanship] The foreground brief and physical wood improve specificity, but the source still carries denser cabinet joinery, tailored upholstery, ceramic/paper variation, object wear and prop-by-prop silhouette authorship.
- [P1][indirect illumination and localized material breakup] The portal-bounce logic is now spatially correct, but the source retains more convincing multi-bounce daylight, skin response, soft penumbrae and per-object roughness variation.
- [P2][HUD optical finish and captured content state] The interface remains functional, compact and responsive, but its icon construction, translucent layering and exact resident/status state do not literally match the reference capture.

### Gate result

This iteration materially improves depth, portal lighting, physical wood response, foreground storytelling and reference-like lensing while keeping the room fully explorable and within every desktop/mobile performance gate. The identical-canvas review still exposes production character, bespoke whole-room asset and multi-bounce material-response gaps, so literal reference-quality parity remains unproven.

final result: blocked

Blocker: production facial/hand/cloth deformation, a fully bespoke environment asset set and richer localized indirect illumination remain visible P1 differences.

## 2026-07-20 reference-fidelity v75 rectilinear-room and foreground-depth gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Final in-app Browser implementation: `dist/interior-3d-work/civic-fidelity-v75/desktop-yaw-0-1672x941-v75.png` (`1672 × 941`, public-plaza, yaw `0°`) and `desktop-yaw-180-1672x941-v75.png` for the opposite wall, navigation ring and complete-orbit inspection.
- Same-canvas comparison: `dist/interior-3d-work/civic-fidelity-v75/reference-vs-v75-full.png`, with the source on the left and the live implementation on the right.
- Responsive evidence: `dist/interior-3d-work/civic-fidelity-v75/mobile-yaw-0-390x844-v75.png` (`390 × 844`, final ready state). In-app Browser warning/error logs are empty.

### Comparison history, fixes and post-fix evidence

- [fixed from v74 P1 / circular sample-room shell] The dominant visible room envelope is rebuilt as a broad rectilinear listening wall, two shorter side wings and an orbit-aware witness wall. Straight oak/brass coves replace the complete circular ceiling rails, and the public terrazzo changes from an oversized circle to a continuous rectangular floor plane. The hero and reverse captures now read as designed rooms rather than opposite views of one undecorated cylinder.
- [fixed / flat reverse hemisphere] The rear witness composition now sits against its own full-height straight wall. A `180°` orbit retains a readable sofa, response board, plants, record desk and listening cast instead of revealing curved blank plaster.
- [fixed / oversized foliage dominated the story axis] Portal-side and lounge-side editorial plants are reduced by roughly `18–24%`, with fewer desktop leaf clusters. The threshold, faces and notice wall regain hierarchy while plants still frame daylight and material contrast.
- [fixed / circular floor graphics overwhelmed the actors] The outer listening inlay contracts from `2.25m` to `2.09m`; the conversation circle remains the interaction affordance but no longer reads as an arena occupying most of the room.
- [fixed / no useful foreground depth] The record desk moves toward the lower-left camera edge and now reads its transform directly from the public `ZoneLayoutProfile`. Rendering, collider and interaction station therefore share the same metre-space coordinates and rotation while the furniture works as a foreground frame.
- [fixed / mobile architecture exceeded budget] Mobile wall panels switch to low-complexity box geometry while preserving the exact silhouette and material hierarchy. The completed mobile frame falls from the first-pass `251,286` triangles to `245,814`.
- [checked / embodied movement and rotation] Local Chrome moved the physical player `2.37m` and rotated the weighted camera `65.3°`; the new room remains an explorable scene rather than a matched still.

### Runtime and performance evidence

- Desktop hero yaw `0°`: `146` draw calls / `284,754` triangles, below the strict `160 / 300,000` civic-room gate.
- Desktop reverse yaw `180°`: `155` draw calls / `298,198` triangles, below the same complete-orbit gate.
- Mobile `390 × 844`: `101` draw calls / `245,814` triangles, below the `110 / 250,000` gate with three actors and all touch controls visible.
- Character and hero-prop contracts remain valid: four civic character roles at `7.09 MB` total and three authored hero props at `34,332` triangles.
- World regression: all `26` interiors passed the physics audit; desktop/mobile scene flow passed; all `78` enter/exit transitions completed with no failure or runtime error.
- Static/build checks: civic character/hero-prop validation, `pnpm check`, production build and `git diff --check` passed. The build retains only the existing non-module-script and large-chunk advisories.

### Required fidelity surfaces

- [checked][interaction/motion] The room remains metre-based, Y-up and Rapier-backed with keyboard/touch locomotion, weighted camera follow, drag orbit and atomic loading.
- [checked][spacing/layout rhythm] The left daylight threshold, central four-person hearing, rear listening wall, right lounge and lower-left record station form distinct foreground, middle-ground and background layers. The reverse hemisphere has an authored focal wall rather than filler.
- [checked][colors/tokens] Ivory plaster, terrazzo, teal upholstery, coral accents, oak and brass remain aligned with the source palette; this iteration changes architecture and hierarchy rather than inventing a new visual language.
- [checked][responsiveness/accessibility] At `390 × 844`, the player, current goal and two witnesses remain visible; joystick, jump, chat, contextual action and the four social actions stay within the viewport.
- [P1][bespoke environment craftsmanship] The rectilinear shell corrects the room type, but the source still has materially better cabinetry joinery, upholstery tailoring, paper/ceramic storytelling, architectural reveals, object wear and prop-specific silhouette design.
- [P1][indirect light and material response] The source retains richer portal bounce, softer penumbrae, skin subsurface response, localized roughness and multi-scale contact occlusion. Current materials remain more uniformly lit and toy-like.
- [P1][production character deformation] Faces, hands and garment tension remain visibly simpler than the source, especially eyelid/cheek integration, skinned finger arcs and hand-to-prop contact.
- [P2][HUD optical finish and captured content state] Controls are functional and responsive, but icon design, translucent depth, compact optical alignment and the source's exact resident/status state remain different.

### Gate result

This iteration replaces the most damaging sample-room cue with a believable rectilinear civic interior, restores foreground/middle/background depth, keeps the full orbit authored and preserves strict desktop/mobile performance gates. The same-canvas comparison still exposes P1 bespoke asset, indirect-light/material and character-deformation gaps, so literal reference-quality parity remains unproven.

final result: blocked

Blocker: production-grade whole-room assets, richer indirect lighting/material response and final facial/hand skinning remain visible P1 differences.

## 2026-07-20 reference-fidelity v74 facial-plane, relaxed-hand and threshold-axis gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Final in-app Browser implementation: `dist/interior-3d-work/civic-fidelity-v74/desktop-yaw-0-1672x941-v74-final.jpg` (`1672 × 941`, public-plaza, yaw `0°`) and `desktop-yaw-180-1672x941-v74.jpg` for rear-volume, held-prop, hand silhouette and complete-orbit inspection.
- Same-canvas comparisons: `dist/interior-3d-work/civic-fidelity-v74/reference-vs-v74-final-full.png` and `reference-vs-v74-final-cast-focus.png`, with the source on the left and the final live implementation on the right. `v73-vs-v74-cast-focus.png`, `v74a-vs-v74b-cast-focus.png` and `v74b-vs-v74c-full.png` isolate character, lighting and grade iterations.
- Responsive evidence: `dist/interior-3d-work/civic-fidelity-v74/mobile-yaw-0-390x844-v74.jpg` (`390 × 844`, final ready state). In-app Browser warning/error logs are empty.

### Comparison history, fixes and post-fix evidence

- [fixed from v73 P1 / pasted-on eye stack] Character sculpt v13 recesses the eye socket into the existing head topology, transitions the upper cheek forward below it and subtly compresses forehead corners. The dark lower eye ring is replaced by a warmer, shallower lid contour; sclera-to-iris-to-pupil proportions now keep illustrated gaze readable without the black-disc or toy-eye failure modes.
- [fixed / four parallel dowel fingers] Every finger now has role-independent lateral fan and fingertip curl authored in the existing four-ring topology. The isolated thumb ellipsoid is replaced by a tapered two-joint volume seated into the palm. The main and reverse frames retain the relaxed silhouette through animated elbow poses, and the total character asset size falls from `7.21 MB` to `7.09 MB`.
- [fixed / uniformly inflated garment torso] Existing torso vertices now carry a shallow centre drape and two diagonal tension valleys. Camera-side actor fill is reduced while warm rim contribution increases, so eye socket, cheek and garment planes read through real lighting rather than additional outline geometry.
- [fixed from first v74 comparison / yellow, toy-like grade] The public-room grade is more neutral and restrained: saturation and yellow multiplication decrease, contrast rises slightly and the screen-space edge term is reduced and narrowed. Ivory plaster, skin, teal cloth, timber and terrazzo no longer collapse into one yellow field.
- [fixed / black foreground leg] The near public-record desk legs change from heavy walnut cylinders to slimmer tapered oak supports. The foreground still frames the scene and retains its collider, but no longer creates the reference-breaking black vertical bar.
- [fixed / entrance outside the story axis] The visible portal, wall opening and physical exit move together from `-1.02` to `-0.88` radians. The final full comparison shows the sunlit doorway on the left-third axis leading directly toward the listening circle, matching the source hierarchy more closely without moving only the painted courtyard card.
- [fixed / weak ground contact and daylight movement] Civic character contact shadow increases from `0.30` to `0.34`, while the window-dapple layer rises from `0.40` to `0.52`. Feet remain planted and the room gains warmer, directional light rhythm without baking the actors into a static background.
- [checked / embodied movement and rotation] Local Chrome moved the physical player `1.45m` and rotated the weighted camera `65.3°`; Rapier, authored movement clips and the same door transform remain active. Reverse and mobile frames prove the result is full-volume and responsive rather than a matched still.

### Runtime and performance evidence

- Desktop hero yaw `0°`: `146` draw calls / `283,168` triangles, below the strict `160 / 300,000` civic-room gate.
- Desktop reverse yaw `180°`: `159` draw calls / `298,100` triangles, below the same complete-orbit gate.
- Mobile `390 × 844`: `102` draw calls / `247,756` triangles, below the `110 / 250,000` gate with three actors, touch locomotion, camera and action controls visible.
- Character contract: `mirrorlife-civic-sculpt-v13` / `mirrorlife-civic-clips-v3`, four roles and `7.09 MB` total. Geometry is player `29,504`, listener `26,588`, facilitator `30,814` and mediator `28,902` triangles; the hand improvement removes `8` triangles per role rather than buying fidelity through a larger mesh budget.
- Hero-prop contract remains `mirrorlife-civic-hero-props-v4` at `34,332` aggregate authored triangles.
- World regression: all `26` interiors passed the physics audit; desktop/mobile scene flow passed; all `78` enter/exit transitions completed with no failure or runtime error.
- Static/build checks: civic character/hero-prop validation, `pnpm check`, production build and `git diff --check` passed. The build retains only the existing non-module-script and large-chunk advisories.

### Required fidelity surfaces

- [checked][interaction/motion] The public room remains metre-based, Y-up and Rapier-backed with keyboard/touch locomotion, authored animation, weighted follow framing, drag orbit and one shared door transform for render and physics.
- [checked][spacing/layout rhythm] The portal now anchors the left third, the four-person listening circle owns the middle ground, and proposal wall/lounge records create a functional background. The reverse hemisphere retains its own witness-wall composition.
- [checked][colors/tokens] Warm ivory, teal, coral, timber and brass remain the dominant families. The final grade improves separation and material neutrality rather than inventing a different palette.
- [checked][image and asset quality for this iteration] Face, hand and cloth changes are lit mesh-space deformations with back/side volume. The portal is a real opening with parallax courtyard geometry; no fullscreen image or view-facing actor card replaces the explorable scene.
- [checked][fonts/typography and copy] Chinese location, exit and social-action labels remain readable at both viewports. The live deterministic QA state still shows `6` residents where the source mock shows `13`; this is a content-state mismatch, not a layout failure, and remains P2 until the reference capture state is reproducible.
- [checked][responsiveness/accessibility] At `390 × 844`, no horizontal overflow occurs; joystick, chat, jump, contextual action and all social actions remain visible and practical under the mobile rendering budget.
- [P1][production face and hand deformation] The paired crop shows better form and relaxed fingers, but the source still has skinned finger arcs, stronger hand-to-prop contact, integrated eyelid/cheek animation and more nuanced facial anatomy.
- [P1][whole-room asset craftsmanship and geometry] The threshold axis is better, but cabinetry joinery, upholstery tailoring, architectural plaster, paper/ceramic storytelling, object-specific wear and room-shell construction remain materially less bespoke than the source.
- [P1][indirect light and material breakup] Neutral grading and stronger dapple help, but the source retains richer bounce-light color, skin subsurface response, localized roughness and multi-scale contact occlusion.
- [P2][HUD optical finish and captured content state] Controls function at both viewports, but icons, optical weight, compact alignment, translucent depth and the reference's exact resident/status values remain visibly different.

### Gate result

This iteration corrects the cast's most procedural facial/hand cues, strengthens cloth and contact response, and restores the source's sunlit threshold-to-listening-circle axis while preserving a real moving, collision-backed, fully orbitable 3D room. The paired canvas still exposes actionable P1 production deformation, bespoke whole-room craftsmanship and indirect-light/material differences, so literal reference-quality parity remains unproven.

final result: blocked

Blocker: production facial/hand skinning, bespoke whole-room environment construction and richer indirect-light/material response remain visible P1 differences.

## 2026-07-20 reference-fidelity v73 silhouette rhythm and editorial-edge gate

### Evidence inspected together

- Source visual truth: `/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png` (`1672 × 941`).
- Final in-app Browser implementation: `dist/interior-3d-work/civic-fidelity-v73/desktop-yaw-0-1672x941-v73.jpg` (`1672 × 941`, public-plaza, yaw `0°`) and `desktop-yaw-180-1672x941-v73.jpg` for rear-volume, crown silhouette and skirt-hem inspection.
- Same-canvas comparisons: `dist/interior-3d-work/civic-fidelity-v73/reference-vs-v73-full.png` and `reference-vs-v73-cast-focus.png`, with the source on the left and the live implementation on the right. `v72-vs-v73-full.png` isolates the visual delta from the previous accepted baseline.
- Responsive evidence: `dist/interior-3d-work/civic-fidelity-v73/mobile-yaw-0-390x844-v73.jpg` (`390 × 844`, final ready state). In-app Browser warning/error logs are empty.

### Comparison history, fixes and post-fix evidence

- [fixed from v72 P1 / mathematically smooth helmet hair] Character sculpt v12 reshapes the existing cap topology into five broad, style-phased crown lobes. This breaks the generic spherical silhouette in the hero and reverse frames without adding triangles or replacing the lit 3D head with a view-facing graphic.
- [fixed / tubular torso read] Shoulder and waist weighting are stronger across the existing body vertices. The player and witnesses now carry a clearer shoulder-to-waist rhythm, while metre scale, skeleton, capsule and animation bindings remain unchanged.
- [fixed / perfectly circular skirt hem] Skirt vertices now combine asymmetric radial drape with a shallow phase-driven hem drop. The facilitator and mediator retain collision-safe floor clearance and secondary motion, but no longer terminate in a mechanically level ring.
- [fixed / weak illustrated edge hierarchy] The public-room cinematic pass derives a restrained luminance edge response from the existing rendered scene and applies it before final color output. It is limited to the 3D canvas, leaves the DOM HUD untouched, and the v72/v73 A/B shows improved prop/actor separation without crunchy terrazzo noise or posterized shading.
- [checked / full-volume orbit and responsive LOD] The reverse frame keeps all four actors and room landmarks readable; the mobile frame retains three actors, the interaction target and touch controls. No crown spike, skirt-floor intersection, long-lived occluder or black/old-scene residue appears in the captured states.
- [checked / embodied movement and rotation] Local Chrome moved the physical player `3.53m` and rotated the weighted camera `65.3°`; the sculpt and edge changes remain integrated with collision-backed movement rather than existing only in a matched still.

### Runtime and performance evidence

- Desktop hero yaw `0°`: `150` draw calls / `284,688` triangles, below the strict `160 / 300,000` civic-room gate.
- Desktop reverse yaw `180°`: `159` draw calls / `298,132` triangles, below the same complete-orbit gate.
- Mobile `390 × 844`: `106` draw calls / `247,324` triangles, below the `110 / 250,000` gate with three actors, touch locomotion, camera and action controls visible.
- Character contract: `mirrorlife-civic-sculpt-v12` / `mirrorlife-civic-clips-v3`, four roles and `7.21 MB` total. Geometry is player `29,512`, listener `26,596`, facilitator `30,822` and mediator `28,910` triangles; the only topology delta is the already budgeted skirt edge treatment (`+24` triangles per skirted role).
- Hero-prop contract remains `mirrorlife-civic-hero-props-v4` at `34,332` aggregate authored triangles.
- World regression: all `26` interiors passed the physics audit; desktop/mobile scene flow passed; all `78` enter/exit transitions completed with no failure or runtime error.
- Static/build checks: civic character/hero-prop validation, `pnpm check`, production build and `git diff --check` passed. The build retains only the existing non-module-script and large-chunk advisories.

### Required fidelity surfaces

- [checked][interaction/motion] The public room remains metre-based, Y-up and Rapier-backed with keyboard/touch locomotion, authored animation, weighted follow framing and drag orbit. The new silhouette work deforms the production meshes used by the running actors.
- [checked][spacing/layout rhythm] The listening circle remains the single middle-ground focus; foreground records and the display case frame it, while the portal, proposal wall and lounge preserve readable depth and exit orientation.
- [checked][colors/tokens] Warm ivory, teal, coral, timber and brass remain the only dominant families. The edge response changes separation, not palette or atmosphere.
- [checked][image and asset quality for this iteration] Hair, torso and skirt improvements are mesh-space changes with real back and side volume; the cinematic edge response operates on the live 3D render instead of replacing authored geometry.
- [checked][responsiveness/accessibility] At `390 × 844`, there is no horizontal overflow and all established touch controls remain visible under the strict mobile rendering budget.
- [P1][production face and hand deformation] The source still has materially better facial planes, expressive eyelid/cheek integration, skinned finger arcs and hand-to-prop contact. Current faces and hands remain visibly simplified in the paired crop.
- [P1][garment construction and whole-room craftsmanship] The asymmetric hem improves rhythm, but cloth folds, seams, tension, upholstery tailoring, joinery, wall plaster variation and object-specific wear remain less bespoke than the source.
- [P1][indirect light and material breakup] The editorial edge helps silhouette separation, but the source retains richer portal bounce, skin subsurface response, localized roughness and multi-scale contact occlusion.
- [P2][HUD optical finish] Controls are functional and responsive, but icon construction, optical weight, translucent depth and compact alignment remain less refined than the reference HUD.

### Gate result

This iteration removes several procedural-looking silhouette cues and adds a restrained illustrated depth response while preserving a playable full orbit, strict budgets and all 26-room regressions. The paired source/implementation canvas still exposes production face/hand deformation, garment construction, whole-room hero craftsmanship and indirect-light P1 gaps, so literal reference-quality parity remains unproven.

final result: blocked

Blocker: production facial/hand skinning, bespoke whole-room environment assets and richer indirect-light/material breakup remain visible P1 differences.

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
