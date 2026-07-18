import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve("public/assets/characters/civic");
const manifest = JSON.parse(await fs.readFile(path.join(ROOT, "manifest.json"), "utf8"));
const expectedRoles = ["player", "listener", "facilitator", "mediator"];

assert.equal(manifest.contract, "mirrorlife-shared-pivot-v1", "unexpected civic character rig contract");
assert.equal(manifest.worldUnitMeters, 1, "civic characters must use one world unit per metre");
assert.equal(manifest.heightMeters, 1.72, "civic character height contract changed");
assert.deepEqual(Object.keys(manifest.roles).sort(), [...expectedRoles].sort(), "civic character role manifest is incomplete");
assert(!JSON.stringify(manifest).includes("/Users/"), "public character manifest leaks a workstation path");

let totalBytes = 0;
for (const role of expectedRoles) {
  const entry = manifest.roles[role];
  assert(entry?.file === `${role}.glb`, `${role}: file mapping is invalid`);
  assert(Number(entry.meshes) >= 20 && Number(entry.meshes) <= 80, `${role}: source mesh count is outside the authored range`);
  assert(Number(entry.triangles) >= 12000 && Number(entry.triangles) <= 35000, `${role}: triangle count is outside the Web LOD0 budget`);
  const file = path.join(ROOT, entry.file);
  const stat = await fs.stat(file);
  assert(stat.size > 100000 && stat.size < 2 * 1024 * 1024, `${role}: GLB size is outside the 0.1–2 MB budget`);
  const contents = await fs.readFile(file);
  const header = contents.subarray(0, 4);
  assert.equal(header.toString("utf8"), "glTF", `${role}: invalid GLB header`);
  assert(contents.includes(Buffer.from("EyePivot_-1")), `${role}: left blink pivot is missing`);
  assert(contents.includes(Buffer.from("EyePivot_1")), `${role}: right blink pivot is missing`);
  assert(contents.includes(Buffer.from("BrowPivot_-1")), `${role}: left expression brow pivot is missing`);
  assert(contents.includes(Buffer.from("BrowPivot_1")), `${role}: right expression brow pivot is missing`);
  assert(contents.includes(Buffer.from("MouthPivot")), `${role}: mouth expression pivot is missing`);
  assert(contents.includes(Buffer.from("LeftElbowPivot")), `${role}: left elbow articulation is missing`);
  assert(contents.includes(Buffer.from("RightElbowPivot")), `${role}: right elbow articulation is missing`);
  totalBytes += stat.size;
}

console.log(`Civic character assets passed: ${expectedRoles.length} roles, ${(totalBytes / 1024 / 1024).toFixed(2)} MB total.`);
