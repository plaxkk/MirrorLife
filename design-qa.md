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
