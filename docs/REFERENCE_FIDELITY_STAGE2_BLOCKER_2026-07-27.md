# Reference Fidelity Stage 2 Blocker — 2026-07-27

## Status

`BLOCKED_STOP_RULE`

Stage 1 is complete. Stage 2 was not accepted or retained: three materially distinct foreground/detail-density attempts failed the documented acceptance thresholds, so the goal's three-attempt stop rule applies. Stages 3 and 4 were not entered.

All Stage 2 implementation changes were reverted. The restored source state was commit `22b154c7dba2` on `codex/reference-fidelity-v3`, with build fingerprint:

```text
sha256:36404686f51242a5de439e7ed4f09102f65d87d0fb2168dab1813a83c889c23f
```

## Acceptance thresholds and exact attempt record

Stage 2 required detail density `>= 0.317`, local contrast `>= 0.0676`, and no reduction from the Stage 1 seven-axis baseline of `4/7`. The opening actor layer also had to remain exactly `55`, the opening scene had to remain at or below `145` draw calls, and all existing physics, interaction, mobile, and four-direction constraints had to remain green.

| State | Local contrast | Detail density | Seven-axis | Draw calls | Visible triangles | Geometries | Actor layer | Result |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Restored Stage 1 baseline | `0.0648` | `0.2761` | `4/7` | `133` | `326,095` | `137` | `55` | Stable baseline; below both Stage 2 floors |
| Attempt 1 | `0.0656` | `0.2771` | `4/7` | `133` | `326,799` | `137` | `55` | Failed both Stage 2 floors |
| Attempt 2 | `0.0658` | `0.2775` | `4/7` | `135` | `343,573` | `139` | `55` | Failed both Stage 2 floors |
| Attempt 3 | `0.0663` | `0.2772` | `2/7` | `136` | `343,717` | `140` | `55` | Failed both floors and regressed seven-axis score |
| Required | `>= 0.0676` | `>= 0.3170` | `>= 4/7` | `<= 145` | `<= 450,000` scene budget | `<= 220` | exactly `55` | — |

Attempts 1 and 2 retained the recorded `4/7` aggregate score, but their individual non-target axis values were not archived and are not reconstructed. Attempt 3's complete recorded measurement was:

| Axis | Attempt 3 | Reference | Difference | Measurement result |
| --- | ---: | ---: | ---: | --- |
| Full-frame luma | `0.5034` | `0.5238` | `-0.0204` | Pass |
| Luma standard deviation | `0.2044` | `0.2032+` | `+0.0012` | Pass |
| Mean saturation | `0.4659` | `0.4303+` | `+0.0356` | Fail, high |
| Warm/cool offset (R-B) | `0.2184` | `0.2469` | `-0.0286` | Fail, low |
| Local contrast | `0.0663` | `0.0716` | `-0.0053` | Fail |
| Detail density | `0.2772` | `0.3320` | `-0.0548` | Fail |
| Vertical lighting falloff | `0.0580` | `0.0198+` | `+0.0382` | Fail, high |

The restored baseline returned to `4/7`: full-frame luma `0.5186` pass, luma standard deviation `0.1950` pass, mean saturation `0.4573` pass, warm/cool offset `0.2290` pass, local contrast `0.0648` fail, detail density `0.2761` fail, and vertical lighting falloff `0.0511` fail.

## The three stopped attempts

### Attempt 1 — expose the record desk and add a reading bay

The existing lower-left record desk was moved farther into frame to expose its lamp, clipboard, ledger, cup, pen, and paper grouping. A desktop-only lower-right reading bay was authored as a merged opaque detail batch plus a glass batch.

The reading bay did not instantiate because `getInteriorZoneLayoutProfile()` did not propagate authored `extraColliders` into the normalized layout profile used by the renderer. Only the desk adjustment contributed visibly. Both Stage 2 image thresholds remained red, making this a structural and metric failure.

### Attempt 2 — repair shared transform ownership

The second attempt propagated `extraColliders` and used three shared authored layout entries: a `sensorOnly` rug, a solid tea table, and a solid magazine rack. The renderer and colliders consumed the same placement records, and collider-local yaw was not applied twice when the parent layout already supplied orientation.

The reading bay instantiated, but only a smooth table sliver contributed materially inside the measured image band. The rug and magazine rack remained too low or too far right. The result stayed at `4/7` but missed both Stage 2 floors.

### Attempt 3 — widen the foreground and preserve textured surfaces

The desk moved farther right, the reading bay moved inward and upward, the rug/table/rack became larger, the embossed rug remained a separate visible batch, foreground materials were desaturated, and magazine planes were angled into the measured band. Existing actor and interaction anchors remained untouched and the center stayed sparse.

The composition was visually coherent, but wider smooth furniture masses occluded higher-frequency terrazzo-floor detail. Much of the rack still fell below the measurement band. Detail density fell from Attempt 2's `0.2775` to `0.2772`, while saturation, warmth, and vertical falloff regressed. The seven-axis score dropped from `4/7` to `2/7`, requiring immediate revert independently of the three-attempt rule.

Attempt 3 was the third distinct failed attempt. No fourth iteration was made.

## Reverted state

All experimental implementation changes were reverted from:

- `public/game.js`;
- `src/interior-three.js`.

No Stage 2 implementation, threshold change, verifier change, collider change, actor-roster change, performance-contract change, interaction-anchor change, or route change was retained.

The experimental normalized-layout support for `extraColliders` was also reverted. Its omission remains in the restored baseline and should only be addressed in a separate, explicitly scoped ownership change with a focused test proving that one authored transform drives rendering and physics.

The failed reading bay was guarded out at mobile widths (`<= 720px`), but intermediate failed attempts were not separately mobile-captured. The restored mobile build was measured directly at `90` draw calls, `249,475` visible triangles, `66` geometries, and three actors.

## Preserved evidence

Attempt 3 evidence:

- `dist/interior-3d-work/task-3-attempt-3/00-public.png`;
- `dist/interior-3d-work/task-3-attempt-3/contact-sheet.png`;
- `dist/interior-3d-work/task-3-attempt-3/manifest.json`;
- `dist/interior-3d-work/task-3-attempt-3/measure.txt`.

Attempts 1 and 2 used fixed capture directories, and their raw PNGs were overwritten by later captures before archival. Their recorded metrics, runtime counts, and visual conclusions are retained above; their missing raw frames are not reconstructed.

Restored-baseline evidence:

- desktop yaw 0: `dist/interior-3d-work/environment-review/00-public.png`;
- mobile: `dist/interior-3d-work/environment-review-mobile/00-public.png`;
- forced blink: `dist/interior-3d-work/environment-review-blink/00-public.png`;
- yaw 90: `dist/interior-3d-work/environment-review-yaw90/00-public.png`;
- yaw 180: `dist/interior-3d-work/environment-review-yaw180/00-public.png`;
- yaw 270: `dist/interior-3d-work/environment-review-yaw270/00-public.png`;
- scene-flow evidence: `dist/interior-3d-work/scene-flow-review`;
- physics report: `dist/interior-physics-review/report.json`.

The detailed working report is retained at:

- `.superpowers/sdd/CODEX_FOLLOWUP_TASK_REFERENCE_FIDELITY_2026-07-27/task-3-report.md`.

## Restored hard-gate results

These results were recorded only after all Stage 2 implementation changes were reverted:

| Command / check | Restored result |
| --- | --- |
| `npm run check` | Pass; syntax, stable-reference, character asset, fingerprint, consolidated skin-state, runtime-stat, v3 artifact, and civic hero-prop validators passed |
| `npm run build` | Pass; only pre-existing legacy non-module-script and large-chunk warnings |
| `npm run verify:interior-physics` | Pass; 26 zones / 10 archetypes |
| `npm run verify:interior-character-exploration` | Pass; walked `2.69m`, rotated `65.3°`, sculpted volumetric eyelid blink confirmed |
| `npm run verify:interior-transitions` | Pass; 26 zones / 78 transitions, no failures or runtime errors |
| `npm run verify:interior-scene-flow` | Pass on desktop and mobile |
| `npm run verify:reference-fidelity:v3` | Pass; contract `mirrorlife-reference-fidelity-v3`, actor layer `55`, opening `133` calls, mobile `90 / 249,475`, seven-axis `4/7` |
| Desktop/mobile/blink/yaw 0/90/180/270 captures | Completed; no obstructive opaque foreground or actor-roster regression in the restored views |

Restored runtime summary:

```text
desktop  133 draw calls / 326,095 visible triangles / 137 geometries / 4 actors
mobile    90 draw calls / 249,475 visible triangles /  66 geometries / 3 actors
actors    55 opening-layer draw calls
axes       4/7
```

## Next-scope recommendation

Do not reopen Stage 2 as another unbounded visual iteration.

If the goal owner explicitly authorizes a new scope, first make normalized `extraColliders` a tested shared ownership channel so one authored transform drives both renderer and physics placement. Then target intentionally authored high-frequency paper, textile, joinery, wear, and edge structure distributed across the broad sampled lower-frame band. Larger smooth furniture silhouettes are not sufficient: in Attempt 3 they replaced textured floor signal and damaged other axes.

Any new scope must preserve the existing thresholds, start from the restored `4/7` baseline, archive every attempt before overwriting capture directories, and define a fresh bounded stop condition. Stages 3 and 4 remain unentered while Stage 2 is blocked.
