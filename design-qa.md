# Design QA — Civic Room Reference Rebuild / 2D Avatar Identity to 3D

## Comparison target

- Source visual truth: `/var/folders/fr/fwnphzln4y196lk1qw4h7p3h0000gn/T/codex-clipboard-c3ed3c29-42bb-4808-b433-d1e982ae0bb3.png`
- Placement defect reference: `/var/folders/fr/fwnphzln4y196lk1qw4h7p3h0000gn/T/codex-clipboard-2cfcd589-aa2c-4955-942d-0942d03873fe.png`
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

- Source reference: `/var/folders/fr/fwnphzln4y196lk1qw4h7p3h0000gn/T/codex-clipboard-c3ed3c29-42bb-4808-b433-d1e982ae0bb3.png`
- Live desktop capture: `artifacts/design-qa/public-plaza-fidelity-desktop-final.png`
- Live mobile capture: `artifacts/design-qa/public-plaza-fidelity-mobile-final.png`
- Orbit verification capture: `artifacts/design-qa/public-plaza-fidelity-rotated-final.png`
- Same-size combined comparison: `artifacts/design-qa/public-plaza-fidelity-final-comparison.png`
- Runtime URL: `http://127.0.0.1:4182/game.html?qaInterior=public-plaza&qaInteriorScene=1`
- Native viewports: `1672 × 941` and `390 × 844`.

The source and live implementation were judged together in one native-size comparison. The implementation is a real-time, physically navigable Three.js room rather than a static image: the player moved from `z=3.720` to `z=3.697` through browser input, and the orbit camera changed from yaw `0` to `-1.44` while keeping the staged conversation visible.

## Matched design language

- The entrance, listening wall, perimeter lounge, foreground work/display furniture and central brass listening circle reproduce the source's spatial hierarchy.
- Warm plaster, oak, terrazzo, teal upholstery, coral accents, foliage, glass and brass establish the same premium warm civic atmosphere.
- The source's dark translucent editorial HUD and four-option bottom action rail are implemented as live controls with responsive desktop/mobile layouts.
- Existing `record-desk.glb` is reused as the high-detail foreground hero asset; missing civic architecture and furniture are authored as coherent Three.js geometry.
- Four residents are staged around the story circle on desktop. The current 8-frame portrait atlas maps to eight distinct 3D identity profiles with different hair, face, clothing, bags and props.
- Legacy 2D canvas compositing is placed behind this room, removing the pale mobile veil while preserving the rest of the game's compatibility layer.

## Runtime evidence

- Desktop: 158 draw calls, 243,749 triangles, 165 geometries, four actors and one reused GLB asset.
- Mobile: 152 draw calls, 226,277 triangles, 121 geometries, three actors, zero horizontal overflow and a ready Three.js scene.
- Camera orbit, keyboard movement, responsive FOV and atomic room readiness were exercised in the in-app browser.
- No runtime exceptions were observed. Local-only Vercel Analytics script messages are expected because `/_vercel/insights/script.js` is unavailable on localhost.

## Findings

### P0 / P1

- None remain in this representative room.

### P2 — remaining asset-fidelity gap

- The reference uses bespoke cinematic character sculpts, cloth silhouettes, facial features, micro-props, bounced light and material variation. The current Web implementation has reached the same composition and product direction, but its procedural citizens and several furnishings still read as a polished playable blockout when viewed directly beside the source.
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
