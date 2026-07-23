import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import {
  CIVIC_ANIMATION_CLIPS,
  CIVIC_ANIMATION_CLIP_VERSION,
  resolveCivicAnimationState,
  sampleCivicAnimationPose
} from "../src/civic-animation-clips.js";

const ROOT = path.resolve("public/assets/characters/civic");
const manifest = JSON.parse(await fs.readFile(path.join(ROOT, "manifest.json"), "utf8"));
const expectedRoles = ["player", "listener", "facilitator", "mediator"];

assert.equal(manifest.contract, "mirrorlife-shared-pivot-v1", "unexpected civic character rig contract");
assert.equal(manifest.sculptContract, "mirrorlife-civic-sculpt-v41", "civic character sculpt contract is stale");
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
assert.equal(manifest.faceDecal?.contract, "mirrorlife-civic-face-decal-v1", "civic face decal contract is stale");
assert.equal(manifest.faceDecal?.path, "civic-face-decals.png", "civic face decal path is invalid");
assert.equal(manifest.faceDecal?.textureContract, "mirrorlife-civic-face-texture-v2", "civic face texture contract is stale");
assert.equal(manifest.faceDecal?.textureDirection, "soft-premium-sculpted-portrait", "civic face texture direction changed");
assert.deepEqual(manifest.faceDecal?.grid, [2, 2], "civic face decal atlas grid changed");
assert.deepEqual(manifest.faceDecal?.mapping, expectedRoles, "civic face decal role mapping changed");
assert.equal(manifest.faceDecal?.morphContract, "mirrorlife-civic-face-morph-v1", "civic facial morph contract is stale");
assert.equal(manifest.faceDecal?.integrationContract, "mirrorlife-civic-face-volume-v11", "civic facial volume integration contract is stale");
assert.equal(manifest.faceDecal?.productionIntegrationContract, "mirrorlife-civic-face-illustrated-cornea-v3", "civic production facial integration contract is stale");
assert.equal(manifest.faceDecal?.uvContract, "mirrorlife-civic-head-uv-v1", "civic head UV contract is stale");
assert.deepEqual(manifest.faceDecal?.preservedSculptParts, ["Head", "NoseBridge", "NoseTip", "EyePivot_-1", "EyePivot_1"], "civic hybrid facial parts changed");
assert.equal(manifest.faceDecal?.mouthMorphContract, "mirrorlife-civic-mouth-morph-v1", "civic mouth morph contract is stale");
assert.equal(manifest.faceDecal?.eyeGeometryContract, "mirrorlife-civic-eye-volume-v1", "civic eye geometry contract is stale");
assert.deepEqual(manifest.faceDecal?.eyeGeometryParts, ["EyePivot_-1", "EyePivot_1"], "civic eye geometry parts changed");
assert.deepEqual(manifest.faceDecal?.morphs, ["WarmSmile", "SpeechJaw", "Concern", "Attentive", "Blink"], "civic facial morph set changed");
assert.equal(manifest.handContract?.version, "mirrorlife-civic-hand-v3", "civic hand contract is stale");
assert.deepEqual(manifest.handContract?.pivots, ["Hand_-1", "Hand_1"], "civic hand pivot map changed");
assert.equal(manifest.footwearContract?.version, "mirrorlife-civic-footwear-v2", "civic footwear contract is stale");
assert.deepEqual(manifest.footwearContract?.styles, ["sneaker", "ankle-boot"], "civic footwear styles changed");
assert.equal(manifest.animationContract?.version, CIVIC_ANIMATION_CLIP_VERSION, "civic animation contract is stale");
assert.equal(manifest.animationContract?.runtime, "authored-keyframe-blend+continuous-skin+facial-hand-acting", "civic animation runtime contract changed");
assert.deepEqual(manifest.animationContract?.clips, ["idle", "walk", "run", "listen", "gesture", "jump", "fall"], "civic animation clip list is incomplete");
assert.equal(manifest.worldUnitMeters, 1, "civic characters must use one world unit per metre");
assert.equal(manifest.heightMeters, 1.72, "civic character height contract changed");
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

let totalBytes = 0;
for (const role of expectedRoles) {
  const entry = manifest.roles[role];
  assert(entry?.file === `${role}.glb`, `${role}: file mapping is invalid`);
  // Runtime batches these semantic parts per articulated pivot, so source-part
  // count may grow modestly without increasing the live draw-call budget.
  assert(Number(entry.meshes) >= 20 && Number(entry.meshes) <= 124, `${role}: source mesh count is outside the authored range`);
  assert(Number(entry.triangles) >= 12000 && Number(entry.triangles) <= 40000, `${role}: triangle count is outside the Web LOD0 budget`);
  const file = path.join(ROOT, entry.file);
  const stat = await fs.stat(file);
  assert(stat.size > 100000 && stat.size < 2 * 1024 * 1024, `${role}: GLB size is outside the 0.1–2 MB budget`);
  const contents = await fs.readFile(file);
  const header = contents.subarray(0, 4);
  assert.equal(header.toString("utf8"), "glTF", `${role}: invalid GLB header`);
  assert(contents.includes(Buffer.from("EyePivot_-1")), `${role}: left blink pivot is missing`);
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
  assert(contents.includes(Buffer.from("EyeGlintSmall_-1")), `${role}: left secondary eye catchlight is missing`);
  assert(contents.includes(Buffer.from("EyeGlintSmall_1")), `${role}: right secondary eye catchlight is missing`);
  assert(contents.includes(Buffer.from("HairFlowRidge_3")), `${role}: authored crown hair-flow ridge is missing`);
  assert(contents.includes(Buffer.from("NoseBridge")), `${role}: sculpted nose bridge is missing`);
  assert(contents.includes(Buffer.from("NoseTip")), `${role}: sculpted nose tip is missing`);
  if (role === "facilitator") {
    assert(contents.includes(Buffer.from("NotebookPivot")), "facilitator: unified notebook transform pivot is missing");
    assert(contents.includes(Buffer.from("NotebookSpine")), "facilitator: held notebook spine is missing");
    assert(contents.includes(Buffer.from("NotebookElastic")), "facilitator: held notebook elastic is missing");
    assert(contents.includes(Buffer.from("NotebookPencil")), "facilitator: held notebook pencil is missing");
    assert(contents.includes(Buffer.from("NotebookGripContact")), "facilitator: notebook contact surface is missing");
  }
  if (["player", "listener"].includes(role)) assert(contents.includes(Buffer.from("ShoeUpper_-1Tongue")), `${role}: authored sneaker tongue is missing`);
  if (["facilitator", "mediator"].includes(role)) assert(contents.includes(Buffer.from("ShoeUpper_-1AnkleCollar")), `${role}: authored ankle-boot collar is missing`);
  assert(contents.includes(Buffer.from("SkinnedArmVolume")), `${role}: continuous skinned arm volume is missing`);
  assert(contents.includes(Buffer.from("SkinnedLegVolume")), `${role}: continuous skinned leg volume is missing`);
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
  assert(contents.includes(Buffer.from("ShoeUpper_-1Midsole")), `${role}: left layered midsole is missing`);
  assert(contents.includes(Buffer.from("ShoeUpper_1HeelCounter")), `${role}: right heel counter is missing`);
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
  assert(contents.includes(Buffer.from("MouthOpenPivot")), `${role}: open-mouth expression is missing`);
  assert(contents.includes(Buffer.from("WarmSmile")), `${role}: warm-smile face morph is missing`);
  assert(contents.includes(Buffer.from("SpeechJaw")), `${role}: speech-jaw face morph is missing`);
  assert(contents.includes(Buffer.from("Concern")), `${role}: concern face morph is missing`);
  assert(contents.includes(Buffer.from("Attentive")), `${role}: attentive face morph is missing`);
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
  }
  if (role === "facilitator") {
    assert(contents.includes(Buffer.from("PonytailPivot")), "facilitator: ponytail secondary-motion pivot is missing");
    assert(contents.includes(Buffer.from("PonytailBand")), "facilitator: ponytail construction band is missing");
  }
  if (role === "facilitator" || role === "mediator") {
    assert(contents.includes(Buffer.from("SkirtPivot")), `${role}: skirt secondary-motion pivot is missing`);
    assert(contents.includes(Buffer.from("SkirtHem")), `${role}: skirt hem detail is missing`);
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
  if (role === "mediator") assert(contents.includes(Buffer.from("SideBraidBead_1_2")), "mediator: authored side braid chain is missing");
  totalBytes += stat.size;
}

console.log(`Civic character assets passed: ${expectedRoles.length} roles, ${(totalBytes / 1024 / 1024).toFixed(2)} MB total.`);
