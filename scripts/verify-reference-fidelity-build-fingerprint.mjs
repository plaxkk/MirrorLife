import assert from "node:assert/strict";
import {
  appendFile,
  mkdtemp,
  mkdir,
  rm,
  writeFile
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  computeReferenceFidelityBuildFingerprint
} from "./lib/reference-fidelity-build-fingerprint.mjs";

const fixtureRoot = await mkdtemp(path.join(os.tmpdir(), "mirrorlife-build-fingerprint-"));
const runtimeFile = path.join(fixtureRoot, "src", "interior-three.js");
const characterFile = path.join(
  fixtureRoot,
  "public",
  "assets",
  "characters",
  "civic",
  "player.glb"
);
const runtimeSource = "export const runtimeVersion = 1;\n";
const characterBytes = Buffer.from([0x67, 0x6c, 0x54, 0x46, 0x01, 0x02, 0x03, 0x04]);

try {
  await mkdir(path.dirname(runtimeFile), { recursive: true });
  await mkdir(path.dirname(characterFile), { recursive: true });
  await writeFile(path.join(fixtureRoot, "index.html"), "<main>MirrorLife</main>\n");
  await writeFile(path.join(fixtureRoot, "package.json"), "{\"type\":\"module\"}\n");
  await writeFile(path.join(fixtureRoot, "vite.config.js"), "export default {};\n");
  await writeFile(runtimeFile, runtimeSource);
  await writeFile(characterFile, characterBytes);

  const baseline = computeReferenceFidelityBuildFingerprint(fixtureRoot);
  assert.match(baseline, /^sha256:[a-f0-9]{64}$/);
  assert.equal(
    computeReferenceFidelityBuildFingerprint(fixtureRoot),
    baseline,
    "unchanged fixture must have a deterministic identifier"
  );

  await appendFile(runtimeFile, "export const runtimePatch = true;\n");
  const runtimeChanged = computeReferenceFidelityBuildFingerprint(fixtureRoot);
  assert.notEqual(
    runtimeChanged,
    baseline,
    "changing representative runtime source must change the identifier"
  );

  await writeFile(runtimeFile, runtimeSource);
  const changedCharacterBytes = Buffer.from(characterBytes);
  changedCharacterBytes[changedCharacterBytes.length - 1] ^= 0xff;
  await writeFile(characterFile, changedCharacterBytes);
  const characterChanged = computeReferenceFidelityBuildFingerprint(fixtureRoot);
  assert.notEqual(
    characterChanged,
    baseline,
    "changing one representative public character GLB byte must change the identifier"
  );

  console.log("Reference fidelity build fingerprint verification passed.");
  console.log(`Baseline: ${baseline}`);
  console.log(`Runtime change: ${runtimeChanged}`);
  console.log(`Character GLB change: ${characterChanged}`);
} finally {
  await rm(fixtureRoot, { recursive: true, force: true });
}
