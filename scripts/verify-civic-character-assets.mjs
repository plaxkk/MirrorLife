import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import {
  CIVIC_ANIMATION_CLIPS,
  CIVIC_ANIMATION_CLIP_VERSION,
  resolveCivicAnimationState,
  sampleCivicAnimationPose
} from "../src/civic-animation-clips.js";
import { readGlbGeometry } from "./lib/glb-geometry.mjs";

const ROOT = path.resolve("public/assets/characters/civic");
const manifest = JSON.parse(await fs.readFile(path.join(ROOT, "manifest.json"), "utf8"));
const expectedRoles = ["player", "listener", "facilitator", "mediator"];

assert.equal(manifest.contract, "mirrorlife-shared-pivot-v1", "unexpected civic character rig contract");
assert.equal(manifest.sculptContract, "mirrorlife-civic-sculpt-v83", "civic character sculpt contract is stale");
assert.equal(manifest.hairConstructionContract?.version, "mirrorlife-civic-hair-construction-v7", "civic hair construction contract is stale");
assert.equal(
  manifest.hairConstructionContract?.runtime,
  "role-authored-swept-superellipse-planes+temple-wisps+restrained-anisotropic-sheen",
  "civic hair construction runtime changed"
);
assert.deepEqual(
  manifest.hairConstructionContract?.parts,
  ["HairCap", "HairFlowRidge", "HairRibbon", "FaceFrameLock", "HairTempleWisp"],
  "civic hair construction parts changed"
);
assert.equal(manifest.bodyIdentityContract?.version, "mirrorlife-civic-body-identity-v10", "civic body identity contract is stale");
assert.deepEqual(manifest.bodyIdentityContract?.roles, expectedRoles, "civic body identity roles changed");
assert.deepEqual(
  manifest.bodyIdentityContract?.dimensions,
  ["torso", "shoulder", "neck", "waist", "pelvis", "limb", "head", "garment-silhouette"],
  "civic body identity dimensions changed"
);
assert.deepEqual(
  manifest.bodyIdentityContract?.continuityParts,
  ["Torso", "ShoulderMantle", "Neck", "SkinnedArmVolume", "TrouserSeat", "SkirtHipFoundation"],
  "civic body continuity parts changed"
);
assert.equal(manifest.bodyIdentityContract?.shoulderContract, "mirrorlife-civic-shoulder-continuity-v3", "civic shoulder continuity contract is stale");
assert.equal(manifest.bodyIdentityContract?.armAnatomyContract, "mirrorlife-civic-arm-anatomy-v1", "civic arm anatomy contract is stale");
assert.equal(manifest.bodyIdentityContract?.neckContract, "mirrorlife-civic-neck-continuity-v2", "civic neck continuity contract is stale");
assert.equal(manifest.bodyIdentityContract?.pelvisContract, "mirrorlife-civic-pelvis-continuity-v3", "civic pelvis continuity contract is stale");
assert.equal(
  manifest.bodyIdentityContract?.runtime,
  "contoured-shell+tailored-shoulder-plane+reference-head-ratio+contoured-neck-clavicle-transition+deltoid-bicep-forearm-ring-flow+wide-elbow-skin-weights+bone-weighted-shoulder-overlap+load-bearing-pelvis+continuous-limb-skin",
  "civic body continuity runtime changed"
);
assert.equal(manifest.skinContract?.version, "mirrorlife-civic-skin-v1", "continuous civic skin contract is stale");
assert.equal(manifest.skinContract?.runtime, "shared-controller-pivots+continuous-limb-skin", "continuous civic skin runtime changed");
assert.deepEqual(manifest.skinContract?.deformedParts, ["SkinnedArmVolume", "SkinnedLegVolume"], "continuous civic skin parts changed");
assert.deepEqual(manifest.skinContract?.joints, [
  "SkinLeftArm",
  "SkinLeftElbow",
  "SkinRightArm",
  "SkinRightElbow",
  "SkinLeftLeg",
  "SkinLeftKnee",
  "SkinRightLeg",
  "SkinRightKnee"
], "continuous civic skin joint map changed");
assert.equal(manifest.garmentTopologyContract?.version, "mirrorlife-civic-garment-topology-v6", "civic garment topology contract is stale");
assert.equal(
  manifest.garmentTopologyContract?.runtime,
  "bone-weighted-superellipse+reference-slimmed-limb-silhouette+diagonal-tension-topology+asymmetric-drape+constructed-ribs+layered-asymmetric-hems+contoured-cuffs",
  "civic garment topology runtime changed"
);
assert.deepEqual(
  manifest.garmentTopologyContract?.garments,
  ["sleeve", "trouser", "skirt", "vest", "cardigan"],
  "civic garment topology set changed"
);
assert.deepEqual(
  manifest.garmentTopologyContract?.deformingParts,
  ["SkinnedArmVolume", "SkinnedLegVolume", "Skirt"],
  "civic deforming garment topology changed"
);
assert.equal(manifest.garmentMaterialContract?.version, "mirrorlife-civic-garment-material-v1", "civic garment material contract is stale");
assert.equal(
  manifest.garmentMaterialContract?.runtime,
  "role-authored-poplin+knit+canvas+twill",
  "civic garment material runtime changed"
);
assert.deepEqual(
  manifest.garmentMaterialContract?.surfaces,
  ["fine-poplin", "jersey-knit", "cardigan-knit", "waxed-canvas", "weathered-shell", "utility-twill", "pleated-twill"],
  "civic garment material surfaces changed"
);
assert.equal(manifest.clothCorrectiveContract?.version, "mirrorlife-civic-cloth-correctives-v1", "civic cloth corrective contract is stale");
assert.equal(manifest.clothCorrectiveContract?.runtime, "bend-angle-driven-volume+compression-folds", "civic cloth corrective runtime changed");
assert.deepEqual(manifest.clothCorrectiveContract?.pivots, [
  "SleeveCompressionPivot_-1",
  "SleeveCompressionPivot_1",
  "TrouserCompressionPivot_-1",
  "TrouserCompressionPivot_1"
], "civic cloth corrective pivot map changed");
assert.equal(manifest.faceDecal?.contract, "mirrorlife-civic-face-decal-v1", "civic face decal contract is stale");
assert.equal(manifest.faceDecal?.path, "civic-face-decals.png", "civic face decal path is invalid");
assert.equal(manifest.faceDecal?.textureContract, "mirrorlife-civic-face-texture-v2", "civic face texture contract is stale");
assert.equal(manifest.faceDecal?.textureDirection, "soft-premium-sculpted-portrait", "civic face texture direction changed");
assert.deepEqual(manifest.faceDecal?.grid, [2, 2], "civic face decal atlas grid changed");
assert.deepEqual(manifest.faceDecal?.mapping, expectedRoles, "civic face decal role mapping changed");
assert.equal(manifest.faceDecal?.morphContract, "mirrorlife-civic-face-morph-v2", "civic facial morph contract is stale");
assert.equal(manifest.faceDecal?.integrationContract, "mirrorlife-civic-face-identity-v9", "civic facial identity integration contract is stale");
assert.equal(manifest.faceDecal?.productionFaceMode, "sculpted-volume-desktop+curved-atlas-mobile", "civic production face mode changed");
assert.equal(manifest.faceDecal?.productionIntegrationContract, "mirrorlife-civic-face-identity-v9", "civic production facial identity contract is stale");
assert.equal(manifest.faceDecal?.corneaContract, "mirrorlife-civic-cornea-v2", "civic production cornea contract is stale");
assert.equal(manifest.faceDecal?.uvContract, "mirrorlife-civic-head-uv-v3", "civic head UV contract is stale");
assert.equal(manifest.faceDecal?.uvMatteContract, "mirrorlife-civic-head-uv-matte-v3", "civic head UV matte contract is stale");
assert.deepEqual(manifest.faceDecal?.preservedSculptParts, ["Head", "NoseBridge", "NoseTip", "EyePivot_-1", "EyePivot_1"], "civic hybrid facial parts changed");
assert.equal(manifest.faceDecal?.mouthMorphContract, "mirrorlife-civic-mouth-morph-v4", "civic mouth morph contract is stale");
assert.equal(manifest.faceDecal?.lipVolumeContract, "mirrorlife-civic-lip-volume-v3", "civic lip volume contract is stale");
assert.equal(manifest.faceDecal?.eyeGeometryContract, "mirrorlife-civic-eye-volume-v6", "civic eye geometry contract is stale");
assert.equal(manifest.faceDecal?.eyelidDeformationContract, "mirrorlife-civic-eyelid-vertex-v2", "civic eyelid deformation contract is stale");
assert.equal(manifest.faceDecal?.facialContinuityContract, "mirrorlife-civic-orbital-lip-bed-v1", "civic facial continuity contract is stale");
assert.deepEqual(manifest.faceDecal?.eyeGeometryParts, ["EyePivot_-1", "EyePivot_1"], "civic eye geometry parts changed");
assert.deepEqual(manifest.faceDecal?.morphs, ["WarmSmile", "SpeechJaw", "Concern", "Attentive", "SocialAsymmetry", "Blink"], "civic facial morph set changed");
assert.equal(manifest.handContract?.version, "mirrorlife-civic-hand-v11", "civic hand contract is stale");
assert.equal(manifest.handContract?.continuityContract, "mirrorlife-civic-hand-continuity-v1", "civic hand continuity contract is stale");
assert.deepEqual(manifest.handContract?.pivots, ["Hand_-1", "Hand_1"], "civic hand pivot map changed");
assert.deepEqual(
  manifest.handContract?.poseStyles,
  ["relaxed", "soft-cup", "notebook-support", "notebook-guide", "thoughtful", "open"],
  "civic hand role-specific pose set changed"
);
assert.deepEqual(
  manifest.handContract?.surfaceParts,
  ["HandWebSurface", "PalmLifeLine", "PalmHeartLine", "FingerCrease", "ThumbCrease", "six-ring-tapered-digits"],
  "civic hand surface parts changed"
);
assert.equal(manifest.notebookContactContract?.version, "mirrorlife-civic-notebook-contact-v3", "civic notebook contact contract is stale");
assert.deepEqual(
  manifest.notebookContactContract?.parts,
  ["NotebookGripContact", "NotebookGuideContact", "NotebookPalmSupport", "NotebookSupportFinger"],
  "civic notebook contact parts changed"
);
assert.equal(
  manifest.contactConstraintContract?.version,
  "mirrorlife-civic-contact-constraint-v2",
  "civic contact constraint contract is stale"
);
assert.deepEqual(
  manifest.contactConstraintContract?.effectors,
  ["HandContactAnchor_-1", "HandContactAnchor_1"],
  "civic contact effectors changed"
);
assert.deepEqual(
  manifest.contactConstraintContract?.targets,
  ["NotebookSupportTarget", "NotebookGuideTarget", "ThoughtfulJawTarget"],
  "civic contact targets changed"
);
assert.equal(manifest.footwearContract?.version, "mirrorlife-civic-footwear-v4", "civic footwear contract is stale");
assert.deepEqual(manifest.footwearContract?.styles, ["sneaker", "ankle-boot"], "civic footwear styles changed");
assert.equal(manifest.animationContract?.version, CIVIC_ANIMATION_CLIP_VERSION, "civic animation contract is stale");
assert.equal(
  manifest.animationContract?.runtime,
  "authored-keyframe-blend+role-contact-poses+continuous-skin+wide-elbow-volume+asymmetric-weight-transfer+skirt-flex+facial-hand-acting",
  "civic animation runtime contract changed"
);
assert.deepEqual(manifest.animationContract?.clips, ["idle", "walk", "run", "listen", "gesture", "jump", "fall"], "civic animation clip list is incomplete");
assert.equal(manifest.worldUnitMeters, 1, "civic characters must use one world unit per metre");
// Measured from the shipped GLBs by scripts/sync-civic-character-manifest.mjs.
// The old hard-coded 1.72 was 4–7% short of every actual model and, because
// nothing at runtime reads this field, the drift went unnoticed for months.
assert.equal(manifest.heightMeters, 1.816, "civic character height contract changed");
assert.deepEqual(Object.keys(manifest.roles).sort(), [...expectedRoles].sort(), "civic character role manifest is incomplete");
assert(!JSON.stringify(manifest).includes("/Users/"), "public character manifest leaks a workstation path");
const faceDecalStat = await fs.stat(path.join(ROOT, manifest.faceDecal.path));
assert(faceDecalStat.size > 100000 && faceDecalStat.size < 5 * 1024 * 1024, "civic face decal asset size is outside the 0.1–5 MB budget");

for (const clipName of manifest.animationContract.clips) {
  const clip = CIVIC_ANIMATION_CLIPS[clipName];
  assert(clip && Number(clip.duration) > 0, `${clipName}: duration is invalid`);
  assert.equal(clip.keys[0][0], 0, `${clipName}: first authored key must start at zero`);
  assert.equal(clip.keys.at(-1)[0], 1, `${clipName}: final authored key must end at one`);
  const sampled = sampleCivicAnimationPose(clipName, 0.37, "listener");
  assert(Number.isFinite(sampled.rootY), `${clipName}: root motion is invalid`);
  ["visual", "headGroup", "leftArm", "rightArm", "leftHand", "rightHand", "leftLeg", "rightLeg"].forEach((track) => {
    assert.equal(sampled[track].length, 3, `${clipName}: ${track} track is incomplete`);
    assert(sampled[track].every(Number.isFinite), `${clipName}: ${track} contains a non-finite key`);
  });
}
assert.equal(resolveCivicAnimationState({ state: "walking", civicRole: "player" }, { walking: true }), "walk");
assert.equal(resolveCivicAnimationState({ state: "run", civicRole: "player" }, { walking: true, running: true }), "run");
assert.equal(resolveCivicAnimationState({ state: "listen", civicRole: "listener" }, { publicRoom: true }), "listen");
assert.equal(resolveCivicAnimationState({ state: "talking", civicRole: "facilitator" }, { publicRoom: true }), "gesture");
const mediatorContactPose = sampleCivicAnimationPose("gesture", 0.37, "mediator");
assert(mediatorContactPose.rightElbow[0] < -1.35, "mediator contact pose lost the jaw-side elbow fold");
assert(mediatorContactPose.rightHand[0] > 0.2, "mediator contact pose lost the thoughtful wrist turn");

let totalBytes = 0;
const runtimeSkinMeasurements = [];
for (const role of expectedRoles) {
  const entry = manifest.roles[role];
  assert(entry?.file === `${role}.glb`, `${role}: file mapping is invalid`);
  const file = path.join(ROOT, entry.file);

  // Gate the shipped binary, not the manifest's description of it. These two
  // used to be range-checks on hand-maintained JSON fields, so a regenerated
  // GLB could drift arbitrarily far from its recorded counts and still pass.
  const geometry = readGlbGeometry(file);
  assert(
    geometry.meshes >= 20 && geometry.meshes <= 240,
    `${role}: real GLB mesh count ${geometry.meshes} is outside the authored range`
  );
  assert(
    geometry.triangles >= 12000 && geometry.triangles <= 45000,
    `${role}: real GLB triangle count ${geometry.triangles} is outside the Web LOD0 budget`
  );
  runtimeSkinMeasurements.push({
    role,
    weightedSkinBoneCount: geometry.weightedSkinBoneCount,
    skinnedPrimitiveBatches: geometry.skinnedPrimitiveBatches
  });
  assert.equal(
    geometry.meshes,
    Number(entry.meshes),
    `${role}: manifest records ${entry.meshes} meshes but the GLB contains ${geometry.meshes}`
  );
  assert.equal(
    geometry.triangles,
    Number(entry.triangles),
    `${role}: manifest records ${entry.triangles} triangles but the GLB contains ${geometry.triangles}`
  );

  // Physical gates. A civic actor is authored standing on the floor plane, so
  // its lowest vertex belongs just above y=0. Sinking below it buries the sole
  // and floating above it breaks ground contact at the story camera.
  assert(
    geometry.groundOffset >= 0 && geometry.groundOffset <= 0.02,
    `${role}: lowest vertex sits at y=${geometry.groundOffset.toFixed(4)}m, outside the 0–0.02m floor contact band`
  );
  const heightDrift = Math.abs(geometry.height - manifest.heightMeters) / manifest.heightMeters;
  assert(
    heightDrift <= 0.03,
    `${role}: GLB height ${geometry.height.toFixed(3)}m drifts ${(heightDrift * 100).toFixed(1)}% from the ${manifest.heightMeters}m contract`
  );
  const stat = await fs.stat(file);
  assert(stat.size > 100000 && stat.size < 2 * 1024 * 1024, `${role}: GLB size is outside the 0.1–2 MB budget`);
  const contents = await fs.readFile(file);
  const header = contents.subarray(0, 4);
  assert.equal(header.toString("utf8"), "glTF", `${role}: invalid GLB header`);
  assert(contents.includes(Buffer.from("EyePivot_-1")), `${role}: left blink pivot is missing`);
  assert(contents.includes(Buffer.from("ArmInnerElbowFold_-1")), `${role}: inner elbow fold is missing`);
  assert(contents.includes(Buffer.from("ArmOuterTensionPlane_1")), `${role}: outer elbow tension plane is missing`);
  assert(contents.includes(Buffer.from("EyePivot_1")), `${role}: right blink pivot is missing`);
  assert(contents.includes(Buffer.from("UpperLid_-1")), `${role}: left illustrated eye contour is missing`);
  assert(contents.includes(Buffer.from("UpperLid_1")), `${role}: right illustrated eye contour is missing`);
  assert(contents.includes(Buffer.from("EarShell_-1")), `${role}: left sculpted ear shell is missing`);
  assert(contents.includes(Buffer.from("EarShell_1")), `${role}: right sculpted ear shell is missing`);
  assert(contents.includes(Buffer.from("EarConcha_-1")), `${role}: left inset ear concha is missing`);
  assert(contents.includes(Buffer.from("EarConcha_1")), `${role}: right inset ear concha is missing`);
  assert(contents.includes(Buffer.from("UpperLidSkin_-1")), `${role}: left integrated upper lid surface is missing`);
  assert(contents.includes(Buffer.from("UpperLidSkin_1")), `${role}: right integrated upper lid surface is missing`);
  assert(contents.includes(Buffer.from("LowerLidSkin_-1")), `${role}: left integrated lower lid surface is missing`);
  assert(contents.includes(Buffer.from("LowerLidSkin_1")), `${role}: right integrated lower lid surface is missing`);
  assert(contents.includes(Buffer.from("EyeGlint_-1")), `${role}: left eye catchlight is missing`);
  assert(contents.includes(Buffer.from("EyeGlint_1")), `${role}: right eye catchlight is missing`);
  assert(contents.includes(Buffer.from("IrisCore_-1")), `${role}: left layered iris core is missing`);
  assert(contents.includes(Buffer.from("IrisCore_1")), `${role}: right layered iris core is missing`);
  assert(contents.includes(Buffer.from("EyeCanthus_-1")), `${role}: left inner eye canthus is missing`);
  assert(contents.includes(Buffer.from("EyeCanthus_1")), `${role}: right inner eye canthus is missing`);
  assert(contents.includes(Buffer.from("LowerLidCrease_-1")), `${role}: left lower-orbit crease is missing`);
  assert(contents.includes(Buffer.from("LowerLidCrease_1")), `${role}: right lower-orbit crease is missing`);
  assert(contents.includes(Buffer.from("Philtrum")), `${role}: sculpted philtrum is missing`);
  assert(contents.includes(Buffer.from("HairFlowRidge_3")), `${role}: authored crown hair-flow ridge is missing`);
  assert(contents.includes(Buffer.from("HairRibbon_2")), `${role}: broad authored crown hair ribbon is missing`);
  assert(contents.includes(Buffer.from("FaceFrameLock_-1")), `${role}: left face-framing hair lock is missing`);
  assert(contents.includes(Buffer.from("FaceFrameLock_1")), `${role}: right face-framing hair lock is missing`);
  assert(contents.includes(Buffer.from("HairTempleWisp_-1")), `${role}: left secondary temple wisp is missing`);
  assert(contents.includes(Buffer.from("HairTempleWisp_1")), `${role}: right secondary temple wisp is missing`);
  assert(contents.includes(Buffer.from("SleeveCompressionPivot_-1")), `${role}: left bend-driven sleeve corrective is missing`);
  assert(contents.includes(Buffer.from("SleeveCompressionPivot_1")), `${role}: right bend-driven sleeve corrective is missing`);
  assert(contents.includes(Buffer.from("TrouserCompressionPivot_-1")), `${role}: left bend-driven trouser corrective is missing`);
  assert(contents.includes(Buffer.from("TrouserCompressionPivot_1")), `${role}: right bend-driven trouser corrective is missing`);
  assert(contents.includes(Buffer.from("ElbowCorrectiveVolume_-1")), `${role}: left elbow volume preservation mesh is missing`);
  assert(contents.includes(Buffer.from("KneeCorrectiveVolume_1")), `${role}: right knee volume preservation mesh is missing`);
  assert(contents.includes(Buffer.from("NoseBridge")), `${role}: sculpted nose bridge is missing`);
  assert(contents.includes(Buffer.from("NoseTip")), `${role}: sculpted nose tip is missing`);
  if (role === "facilitator") {
    assert(contents.includes(Buffer.from("NotebookPivot")), "facilitator: unified notebook transform pivot is missing");
    assert(contents.includes(Buffer.from("NotebookSpine")), "facilitator: held notebook spine is missing");
    assert(contents.includes(Buffer.from("NotebookElastic")), "facilitator: held notebook elastic is missing");
    assert(contents.includes(Buffer.from("NotebookPencil")), "facilitator: held notebook pencil is missing");
    assert(contents.includes(Buffer.from("NotebookGripContact")), "facilitator: notebook contact surface is missing");
    assert(contents.includes(Buffer.from("NotebookGuideContact")), "facilitator: notebook guide contact surface is missing");
    assert(contents.includes(Buffer.from("NotebookPalmSupport")), "facilitator: notebook palm support is missing");
    assert(contents.includes(Buffer.from("NotebookSupportFinger_1")), "facilitator: first notebook support finger is missing");
    assert(contents.includes(Buffer.from("NotebookSupportFinger_3")), "facilitator: third notebook support finger is missing");
    assert(contents.includes(Buffer.from("NotebookSupportTarget")), "facilitator: notebook support target is missing");
    assert(contents.includes(Buffer.from("NotebookGuideTarget")), "facilitator: notebook guide target is missing");
    assert(contents.includes(Buffer.from("FacilitatorShoulderYoke")), "facilitator: tailored shoulder yoke is missing");
  }
  assert(contents.includes(Buffer.from("HandContactAnchor_-1")), `${role}: left hand contact anchor is missing`);
  assert(contents.includes(Buffer.from("HandContactAnchor_1")), `${role}: right hand contact anchor is missing`);
  assert(contents.includes(Buffer.from("ShoulderMantle_-1")), `${role}: left tailored shoulder plane is missing`);
  assert(contents.includes(Buffer.from("ShoulderMantle_1")), `${role}: right tailored shoulder plane is missing`);
  assert(contents.includes(Buffer.from("HipLoadFold_-1")), `${role}: left load-bearing hip fold is missing`);
  assert(contents.includes(Buffer.from("HipLoadFold_1")), `${role}: right load-bearing hip fold is missing`);
  if (["facilitator", "mediator"].includes(role)) {
    assert(contents.includes(Buffer.from("SkirtHipFoundation")), `${role}: skirt hip foundation is missing`);
  }
  if (role === "mediator") {
    assert(contents.includes(Buffer.from("ThoughtfulJawTarget")), "mediator: head-attached thoughtful contact target is missing");
    assert(contents.includes(Buffer.from("MediatorWaistSash")), "mediator: fitted waist sash is missing");
    assert(contents.includes(Buffer.from("MediatorSashKnot")), "mediator: sash knot is missing");
    assert(contents.includes(Buffer.from("BobNapeLock_3")), "mediator: continuous bob nape is missing");
  }
  if (["facilitator", "mediator"].includes(role)) {
    assert(contents.includes(Buffer.from("CardiganNeckRib")), `${role}: cardigan neck rib is missing`);
    assert(contents.includes(Buffer.from("CardiganFrontRib_-1")), `${role}: left cardigan front rib is missing`);
    assert(contents.includes(Buffer.from("CardiganFrontRib_1")), `${role}: right cardigan front rib is missing`);
    assert(contents.includes(Buffer.from("CoatButtonhole_1")), `${role}: cardigan buttonhole construction is missing`);
    assert(contents.includes(Buffer.from("CoatCuffRib_-1_1")), `${role}: left cardigan cuff rib is missing`);
    assert(contents.includes(Buffer.from("CoatCuffRib_1_1")), `${role}: right cardigan cuff rib is missing`);
    assert(contents.includes(Buffer.from("SkirtWaistband")), `${role}: skirt waistband topology is missing`);
    assert(contents.includes(Buffer.from("SkirtSideRelease_-1")), `${role}: left asymmetric skirt release is missing`);
    assert(contents.includes(Buffer.from("SkirtSideRelease_1")), `${role}: right asymmetric skirt release is missing`);
  }
  if (["player", "listener"].includes(role)) assert(contents.includes(Buffer.from("ShoeUpper_-1Tongue")), `${role}: authored sneaker tongue is missing`);
  if (["facilitator", "mediator"].includes(role)) assert(contents.includes(Buffer.from("ShoeUpper_-1AnkleCollar")), `${role}: authored ankle-boot collar is missing`);
  assert(contents.includes(Buffer.from("SkinnedArmVolume")), `${role}: continuous skinned arm volume is missing`);
  assert(contents.includes(Buffer.from("SkinnedLegVolume")), `${role}: continuous skinned leg volume is missing`);
  if (["player", "listener"].includes(role)) {
    assert(contents.includes(Buffer.from("TrouserSeat")), `${role}: trouser pelvis continuity is missing`);
  }
  assert(contents.includes(Buffer.from("SkinLeftArm")), `${role}: left upper-arm skin joint is missing`);
  assert(contents.includes(Buffer.from("SkinLeftElbow")), `${role}: left elbow skin joint is missing`);
  assert(contents.includes(Buffer.from("SkinRightArm")), `${role}: right upper-arm skin joint is missing`);
  assert(contents.includes(Buffer.from("SkinRightElbow")), `${role}: right elbow skin joint is missing`);
  assert(contents.includes(Buffer.from("SkinLeftLeg")), `${role}: left upper-leg skin joint is missing`);
  assert(contents.includes(Buffer.from("SkinLeftKnee")), `${role}: left knee skin joint is missing`);
  assert(contents.includes(Buffer.from("SkinRightLeg")), `${role}: right upper-leg skin joint is missing`);
  assert(contents.includes(Buffer.from("SkinRightKnee")), `${role}: right knee skin joint is missing`);
  assert(contents.includes(Buffer.from("ShoeUpper_-1")), `${role}: left sculpted shoe last is missing`);
  assert(contents.includes(Buffer.from("ShoeUpper_1")), `${role}: right sculpted shoe last is missing`);
  assert(contents.includes(Buffer.from("ShoeUpper_-1Pivot")), `${role}: left full-shoe transform pivot is missing`);
  assert(contents.includes(Buffer.from("ShoeUpper_1Pivot")), `${role}: right full-shoe transform pivot is missing`);
  assert(contents.includes(Buffer.from("ShoeUpper_-1Midsole")), `${role}: left layered midsole is missing`);
  assert(contents.includes(Buffer.from("ShoeUpper_1HeelCounter")), `${role}: right heel counter is missing`);
  assert(contents.includes(Buffer.from("ShoeUpper_-1OuterQuarterPanel")), `${role}: left footwear quarter panel is missing`);
  assert(contents.includes(Buffer.from("ShoeUpper_1ToeBumper")), `${role}: right footwear toe bumper is missing`);
  assert(contents.includes(Buffer.from("ShoeUpper_-1ToeCapSeam")), `${role}: left toe-cap seam is missing`);
  if (["facilitator", "mediator"].includes(role)) {
    assert(contents.includes(Buffer.from("OuterLash_-1")), `${role}: left role-specific lash is missing`);
    assert(contents.includes(Buffer.from("OuterLash_1")), `${role}: right role-specific lash is missing`);
  }
  assert(contents.includes(Buffer.from("BrowPivot_-1")), `${role}: left expression brow pivot is missing`);
  assert(contents.includes(Buffer.from("BrowPivot_1")), `${role}: right expression brow pivot is missing`);
  assert(contents.includes(Buffer.from("MouthPivot")), `${role}: mouth expression pivot is missing`);
  assert(contents.includes(Buffer.from("MouthClosedPivot")), `${role}: closed-mouth expression is missing`);
  assert(contents.includes(Buffer.from("MouthClosed")), `${role}: morphable closed-mouth mesh is missing`);
  assert(!contents.includes(Buffer.from("LowerLip")), `${role}: detached lower-lip bead returned instead of the unified lip surface`);
  assert(contents.includes(Buffer.from("MouthOpenPivot")), `${role}: open-mouth expression is missing`);
  assert(contents.includes(Buffer.from("MouthOpenUpperRim")), `${role}: authored upper speech rim is missing`);
  assert(contents.includes(Buffer.from("MouthOpenLowerRim")), `${role}: authored lower speech rim is missing`);
  assert(contents.includes(Buffer.from("WarmSmile")), `${role}: warm-smile face morph is missing`);
  assert(contents.includes(Buffer.from("SpeechJaw")), `${role}: speech-jaw face morph is missing`);
  assert(contents.includes(Buffer.from("Concern")), `${role}: concern face morph is missing`);
  assert(contents.includes(Buffer.from("Attentive")), `${role}: attentive face morph is missing`);
  assert(contents.includes(Buffer.from("SocialAsymmetry")), `${role}: social-asymmetry face morph is missing`);
  assert(contents.includes(Buffer.from("LeftElbowPivot")), `${role}: left elbow articulation is missing`);
  assert(contents.includes(Buffer.from("RightElbowPivot")), `${role}: right elbow articulation is missing`);
  assert(contents.includes(Buffer.from("Hand_-1")), `${role}: left wrist articulation is missing`);
  assert(contents.includes(Buffer.from("Hand_1")), `${role}: right wrist articulation is missing`);
  assert(contents.includes(Buffer.from("FingerPivot_-1_4")), `${role}: left finger grip pivot is missing`);
  assert(contents.includes(Buffer.from("FingerPivot_1_4")), `${role}: right finger grip pivot is missing`);
  assert(contents.includes(Buffer.from("LeftKneePivot")), `${role}: left knee articulation is missing`);
  assert(contents.includes(Buffer.from("RightKneePivot")), `${role}: right knee articulation is missing`);
  assert(contents.includes(Buffer.from("FingerVolume_-1_4")), `${role}: left articulated finger volume is missing`);
  assert(contents.includes(Buffer.from("FingerVolume_1_4")), `${role}: right articulated finger volume is missing`);
  assert(contents.includes(Buffer.from("HandWebSurface_-1")), `${role}: left continuous hand web is missing`);
  assert(contents.includes(Buffer.from("HandWebSurface_1")), `${role}: right continuous hand web is missing`);
  assert(contents.includes(Buffer.from("PalmLifeLine_-1")), `${role}: left palm life line is missing`);
  assert(contents.includes(Buffer.from("PalmHeartLine_1")), `${role}: right palm heart line is missing`);
  assert(contents.includes(Buffer.from("TrouserCuff_-1")), `${role}: left contoured ankle transition is missing`);
  assert(contents.includes(Buffer.from("TrouserCuff_1")), `${role}: right contoured ankle transition is missing`);
  if (role === "player") {
    assert(contents.includes(Buffer.from("Backpack")), "player: backpack mesh is missing");
    assert(contents.includes(Buffer.from("BackpackPivot")), "player: backpack secondary-motion pivot is missing");
    assert(contents.includes(Buffer.from("VestCenterSeam")), "player: vest seam detail is missing");
    assert(contents.includes(Buffer.from("VestDrape_-1")), "player: left vest drape is missing");
    assert(contents.includes(Buffer.from("VestDrape_1")), "player: right vest drape is missing");
    assert(contents.includes(Buffer.from("BackpackStrap_-1")), "player: left backpack strap is missing");
    assert(contents.includes(Buffer.from("BackpackStrap_1")), "player: right backpack strap is missing");
    assert(contents.includes(Buffer.from("BackpackHandle")), "player: backpack handle is missing");
    assert(contents.includes(Buffer.from("BackpackCenterDrape")), "player: backpack fabric drape is missing");
    assert(contents.includes(Buffer.from("TravelerCargoPocket_-1")), "player: left moving cargo pocket is missing");
    assert(contents.includes(Buffer.from("TravelerCargoPocket_1")), "player: right moving cargo pocket is missing");
    assert(contents.includes(Buffer.from("TravelerCargoFlap_-1")), "player: left cargo pocket flap is missing");
    assert(contents.includes(Buffer.from("TravelerCargoFlap_1")), "player: right cargo pocket flap is missing");
    assert(contents.includes(Buffer.from("TravelerShortSleeveHem_-1")), "player: left contoured short-sleeve hem is missing");
  }
  if (role === "listener") {
    assert(contents.includes(Buffer.from("Satchel")), "listener: satchel secondary-motion node is missing");
    assert(contents.includes(Buffer.from("JacketCenterSeam")), "listener: jacket seam detail is missing");
    assert(contents.includes(Buffer.from("SatchelClasp")), "listener: satchel clasp is missing");
    assert(contents.includes(Buffer.from("JacketTensionFold_-1")), "listener: left jacket tension fold is missing");
    assert(contents.includes(Buffer.from("JacketTensionFold_1")), "listener: right jacket tension fold is missing");
    assert(contents.includes(Buffer.from("ListenerCollar_-1")), "listener: left collar construction is missing");
    assert(contents.includes(Buffer.from("HoodDrawstring_1")), "listener: right hood drawstring is missing");
    assert(contents.includes(Buffer.from("ListenerPocketWelt_-1")), "listener: left jacket pocket welt is missing");
    assert(contents.includes(Buffer.from("ListenerCuff_-1")), "listener: left contoured jacket cuff is missing");
  }
  if (role === "facilitator") {
    assert(contents.includes(Buffer.from("PonytailPivot")), "facilitator: ponytail secondary-motion pivot is missing");
    assert(contents.includes(Buffer.from("PonytailBand")), "facilitator: ponytail construction band is missing");
  }
  if (role === "facilitator" || role === "mediator") {
    assert(contents.includes(Buffer.from("SkirtPivot")), `${role}: skirt secondary-motion pivot is missing`);
    assert(contents.includes(Buffer.from("SkirtHem")), `${role}: skirt hem detail is missing`);
    assert(contents.includes(Buffer.from("SkirtBackHem")), `${role}: complete rear skirt hem is missing`);
    assert(contents.includes(Buffer.from("CoatHem_-1")), `${role}: left coat hem detail is missing`);
    assert(contents.includes(Buffer.from("CoatHem_1")), `${role}: right coat hem detail is missing`);
    assert(contents.includes(Buffer.from("CoatDrape_-1")), `${role}: left coat drape is missing`);
    assert(contents.includes(Buffer.from("CoatDrape_1")), `${role}: right coat drape is missing`);
    assert(contents.includes(Buffer.from("CoatWaistRelease_-1")), `${role}: left coat waist release is missing`);
    assert(contents.includes(Buffer.from("CoatWaistRelease_1")), `${role}: right coat waist release is missing`);
    assert(contents.includes(Buffer.from("CoatPocketWelt_-1")), `${role}: left coat pocket welt is missing`);
    assert(contents.includes(Buffer.from("CoatOpeningEdge_-1")), `${role}: left coat opening edge is missing`);
    assert(contents.includes(Buffer.from("CoatCuff_1")), `${role}: right coat cuff is missing`);
    assert(contents.includes(Buffer.from("CivicDressBodice")), `${role}: layered civic dress bodice is missing`);
    assert(contents.includes(Buffer.from("ShoeUpper_-1AnkleCollarEdge")), `${role}: left boot collar edge is missing`);
  }
  if (role === "mediator") {
    assert(contents.includes(Buffer.from("BraidedCrownLock_4")), "mediator: interwoven crown braid is missing");
    assert(contents.includes(Buffer.from("BobSideLock_1_2")), "mediator: layered side-bob silhouette is missing");
  }
  totalBytes += stat.size;
}

console.log(
  `Civic character assets passed: ${expectedRoles.length} roles, ${(totalBytes / 1024 / 1024).toFixed(2)} MB total.`
);
console.log(`Loaded GLB skin measurements: ${JSON.stringify(runtimeSkinMeasurements)}`);
