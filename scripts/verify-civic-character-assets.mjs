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
assert.equal(manifest.sculptContract, "mirrorlife-civic-sculpt-v12", "civic character sculpt contract is stale");
assert.equal(manifest.animationContract?.version, CIVIC_ANIMATION_CLIP_VERSION, "civic animation contract is stale");
assert.equal(manifest.animationContract?.runtime, "authored-keyframe-blend", "civic animation runtime contract changed");
assert.deepEqual(manifest.animationContract?.clips, ["idle", "walk", "run", "listen", "gesture", "jump", "fall"], "civic animation clip list is incomplete");
assert.equal(manifest.worldUnitMeters, 1, "civic characters must use one world unit per metre");
assert.equal(manifest.heightMeters, 1.72, "civic character height contract changed");
assert.deepEqual(Object.keys(manifest.roles).sort(), [...expectedRoles].sort(), "civic character role manifest is incomplete");
assert(!JSON.stringify(manifest).includes("/Users/"), "public character manifest leaks a workstation path");

for (const clipName of manifest.animationContract.clips) {
  const clip = CIVIC_ANIMATION_CLIPS[clipName];
  assert(clip && Number(clip.duration) > 0, `${clipName}: duration is invalid`);
  assert.equal(clip.keys[0][0], 0, `${clipName}: first authored key must start at zero`);
  assert.equal(clip.keys.at(-1)[0], 1, `${clipName}: final authored key must end at one`);
  const sampled = sampleCivicAnimationPose(clipName, 0.37, "listener");
  assert(Number.isFinite(sampled.rootY), `${clipName}: root motion is invalid`);
  ["visual", "headGroup", "leftArm", "rightArm", "leftLeg", "rightLeg"].forEach((track) => {
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
  assert(Number(entry.meshes) >= 20 && Number(entry.meshes) <= 100, `${role}: source mesh count is outside the authored range`);
  assert(Number(entry.triangles) >= 12000 && Number(entry.triangles) <= 35000, `${role}: triangle count is outside the Web LOD0 budget`);
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
  assert(contents.includes(Buffer.from("EyeOutline_-1")), `${role}: left eye silhouette is missing`);
  assert(contents.includes(Buffer.from("EyeOutline_1")), `${role}: right eye silhouette is missing`);
  assert(contents.includes(Buffer.from("NoseBridge")), `${role}: sculpted nose bridge is missing`);
  assert(contents.includes(Buffer.from("NoseTip")), `${role}: sculpted nose tip is missing`);
  if (role === "facilitator") {
    assert(contents.includes(Buffer.from("NotebookSpine")), "facilitator: held notebook spine is missing");
    assert(contents.includes(Buffer.from("NotebookElastic")), "facilitator: held notebook elastic is missing");
    assert(contents.includes(Buffer.from("NotebookPencil")), "facilitator: held notebook pencil is missing");
  }
  assert(contents.includes(Buffer.from("ElbowSleeve_-1")), `${role}: left continuous elbow sleeve is missing`);
  assert(contents.includes(Buffer.from("ElbowSleeve_1")), `${role}: right continuous elbow sleeve is missing`);
  assert(contents.includes(Buffer.from("KneeSleeve_-1")), `${role}: left continuous knee sleeve is missing`);
  assert(contents.includes(Buffer.from("KneeSleeve_1")), `${role}: right continuous knee sleeve is missing`);
  assert(contents.includes(Buffer.from("ShoeUpper_-1")), `${role}: left sculpted shoe last is missing`);
  assert(contents.includes(Buffer.from("ShoeUpper_1")), `${role}: right sculpted shoe last is missing`);
  if (["facilitator", "mediator"].includes(role)) {
    assert(contents.includes(Buffer.from("OuterLash_-1")), `${role}: left role-specific lash is missing`);
    assert(contents.includes(Buffer.from("OuterLash_1")), `${role}: right role-specific lash is missing`);
  }
  assert(contents.includes(Buffer.from("BrowPivot_-1")), `${role}: left expression brow pivot is missing`);
  assert(contents.includes(Buffer.from("BrowPivot_1")), `${role}: right expression brow pivot is missing`);
  assert(contents.includes(Buffer.from("MouthPivot")), `${role}: mouth expression pivot is missing`);
  assert(contents.includes(Buffer.from("MouthClosedPivot")), `${role}: closed-mouth expression is missing`);
  assert(contents.includes(Buffer.from("MouthOpenPivot")), `${role}: open-mouth expression is missing`);
  assert(contents.includes(Buffer.from("WarmSmile")), `${role}: warm-smile face morph is missing`);
  assert(contents.includes(Buffer.from("SpeechJaw")), `${role}: speech-jaw face morph is missing`);
  assert(contents.includes(Buffer.from("Concern")), `${role}: concern face morph is missing`);
  assert(contents.includes(Buffer.from("Attentive")), `${role}: attentive face morph is missing`);
  assert(contents.includes(Buffer.from("LeftElbowPivot")), `${role}: left elbow articulation is missing`);
  assert(contents.includes(Buffer.from("RightElbowPivot")), `${role}: right elbow articulation is missing`);
  assert(contents.includes(Buffer.from("LeftKneePivot")), `${role}: left knee articulation is missing`);
  assert(contents.includes(Buffer.from("RightKneePivot")), `${role}: right knee articulation is missing`);
  assert(contents.includes(Buffer.from("FingerCrease_-1_3")), `${role}: left sculpted-hand finger separation is missing`);
  assert(contents.includes(Buffer.from("FingerCrease_1_3")), `${role}: right sculpted-hand finger separation is missing`);
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
  }
  if (role === "listener") {
    assert(contents.includes(Buffer.from("Satchel")), "listener: satchel secondary-motion node is missing");
    assert(contents.includes(Buffer.from("JacketCenterSeam")), "listener: jacket seam detail is missing");
    assert(contents.includes(Buffer.from("SatchelClasp")), "listener: satchel clasp is missing");
    assert(contents.includes(Buffer.from("JacketTensionFold_-1")), "listener: left jacket tension fold is missing");
    assert(contents.includes(Buffer.from("JacketTensionFold_1")), "listener: right jacket tension fold is missing");
  }
  if (role === "facilitator") assert(contents.includes(Buffer.from("PonytailPivot")), "facilitator: ponytail secondary-motion pivot is missing");
  if (role === "facilitator" || role === "mediator") {
    assert(contents.includes(Buffer.from("SkirtPivot")), `${role}: skirt secondary-motion pivot is missing`);
    assert(contents.includes(Buffer.from("SkirtHem")), `${role}: skirt hem detail is missing`);
    assert(contents.includes(Buffer.from("CoatHem_-1")), `${role}: left coat hem detail is missing`);
    assert(contents.includes(Buffer.from("CoatHem_1")), `${role}: right coat hem detail is missing`);
    assert(contents.includes(Buffer.from("CoatDrape_-1")), `${role}: left coat drape is missing`);
    assert(contents.includes(Buffer.from("CoatDrape_1")), `${role}: right coat drape is missing`);
  }
  totalBytes += stat.size;
}

console.log(`Civic character assets passed: ${expectedRoles.length} roles, ${(totalBytes / 1024 / 1024).toFixed(2)} MB total.`);
