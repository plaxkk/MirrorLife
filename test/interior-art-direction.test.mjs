import test from "node:test";
import assert from "node:assert/strict";
import {
  getInteriorArtDirection,
  resolveInteriorPilotProfile,
  validateInteriorArtDirection
} from "../src/interior-art-direction.js";

const STYLE_ID = "mirrorlife-storybook-cinematic-v1";
const PILOT_ID = "primary-school-v4";

test("storybook art direction is complete and immutable", () => {
  const profile = getInteriorArtDirection(STYLE_ID);

  assert.deepEqual(profile.shapeRules.bevelMeters, [0.02, 0.06]);
  assert.deepEqual(profile.shapeRules.detailRatio, [70, 20, 10]);
  assert.equal(profile.characters.adultHeads, 5.25);
  assert.equal(profile.characters.childHeads, 4.25);
  assert.equal(profile.lighting.faceSceneMedianRatio, 0.75);
  assert.deepEqual(
    Object.keys(profile.materials).sort(),
    ["ceramic", "cork", "metal", "oak", "paper", "plaster", "textile"]
  );
  assert(Object.isFrozen(profile));
  assert(Object.isFrozen(profile.palette));
  assert(Object.isFrozen(profile.materials.oak.roughness));
});

test("disabled or invalid pilot resolves atomically to V3", () => {
  const disabled = resolveInteriorPilotProfile(PILOT_ID, { enabled: false });
  const unknown = resolveInteriorPilotProfile("missing-pilot", { enabled: true });

  assert.equal(disabled.shellId, "primary-school-learning-loop-v3");
  assert.equal(disabled.fallbackShellId, "primary-school-learning-loop-v3");
  assert.equal(unknown.shellId, "primary-school-learning-loop-v3");
  assert.equal(unknown.fallbackShellId, "primary-school-learning-loop-v3");
  assert.equal(disabled.assetManifest, null);
  assert.equal(unknown.assetManifest, null);
});

test("enabled pilot resolves as one frozen V4 profile without V3 asset merging", () => {
  const profile = resolveInteriorPilotProfile(PILOT_ID, { enabled: true });

  assert.deepEqual(profile, {
    pilotId: PILOT_ID,
    styleId: STYLE_ID,
    shellId: "primary-school-learning-loop-v4",
    assetManifest: "public/assets/interiors/pilots/primary-school-v4/manifest.json",
    scenarioId: "primary-school-slow-answer-v1",
    fallbackShellId: "primary-school-learning-loop-v3",
    performanceBudgets: {
      desktop: {
        trianglesMax: 400000,
        drawCallsMax: 145,
        interactiveReadyP95Ms: 2500,
        warmReadyP95Ms: 800,
        fullReadyP95Ms: 6000,
        additionalTransferBytesMax: 8388608,
        frameTimeP95Ms: 20
      },
      mobile: {
        trianglesSoftMax: 225000,
        trianglesMax: 250000,
        drawCallsMax: 110,
        interactiveReadyP95Ms: 4000,
        warmReadyP95Ms: 1200,
        fullReadyP95Ms: 8000,
        additionalTransferBytesMax: 6291456,
        frameTimeP95Ms: 25
      },
      shared: {
        freshSamples: 10,
        warmSamples: 10,
        additionalRequestsMax: 40,
        slowFrameThresholdMs: 33,
        slowFrameRatioMax: 0.01,
        longTaskMaxMs: 200,
        preInteractiveBlockingMaxMs: 500
      }
    }
  });
  assert(Object.isFrozen(profile));
  assert(Object.isFrozen(profile.performanceBudgets.mobile));
});

test("invalid material and lighting contracts are rejected", () => {
  const profile = structuredClone(getInteriorArtDirection(STYLE_ID));
  profile.shapeRules.detailRatio = [70, 20, 9];
  assert.throws(
    () => validateInteriorArtDirection(profile),
    /detail ratio must total 100/
  );

  profile.shapeRules.detailRatio = [70, 20, 10];
  profile.lighting.faceSceneMedianRatio = 0.74;
  assert.throws(
    () => validateInteriorArtDirection(profile),
    /face lighting contract is below 0.75/
  );

  profile.lighting.faceSceneMedianRatio = 0.75;
  profile.materials.oak.roughness = [0.8, 0.4];
  assert.throws(
    () => validateInteriorArtDirection(profile),
    /material oak roughness range is invalid/
  );
});
