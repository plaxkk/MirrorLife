#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import {
  REFERENCE_FIDELITY_V3,
  evaluateReferenceFidelityV3
} from "../src/reference-fidelity-runtime-contract.js";

const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const openingStats = (file) => {
  const manifest = readJson(file);
  const scene = manifest.scenes?.find((entry) => entry.zone === "public-plaza");
  if (!scene?.stats) throw new Error(`${file}: public-plaza runtime stats are missing`);
  return scene.stats;
};

const desktopFile = path.resolve(
  process.env.MIRRORLIFE_V3_DESKTOP_MANIFEST
    || "dist/interior-3d-work/environment-review/manifest.json"
);
const mobileFile = path.resolve(
  process.env.MIRRORLIFE_V3_MOBILE_MANIFEST
    || "dist/interior-3d-work/environment-review-mobile/manifest.json"
);
const blinkFile = path.resolve(
  process.env.MIRRORLIFE_V3_BLINK_MANIFEST
    || "dist/interior-3d-work/environment-review-blink/manifest.json"
);
const gapFile = path.resolve(
  process.env.MIRRORLIFE_V3_GAP_JSON
    || "dist/interior-3d-work/reference-gap.json"
);

const desktopStats = openingStats(desktopFile);
const mobileStats = openingStats(mobileFile);
const blinkStats = openingStats(blinkFile);
const sevenAxis = readJson(gapFile);
const result = evaluateReferenceFidelityV3({
  desktopStats,
  mobileStats,
  blinkStats,
  sevenAxis
});

const actorProfiles = {};
for (const [profile, stats] of [["desktop", desktopStats], ["mobile", mobileStats]]) {
  for (const [id, actor] of Object.entries(stats.actorArticulationBreakdown || {})) {
    const key = actor.assetRole || id;
    actorProfiles[key] ||= {};
    actorProfiles[key][profile] = actor.actorDrawCalls;
  }
}
for (const profile of Object.values(actorProfiles)) {
  profile.desktop ??= 0;
  profile.mobile ??= 0;
}

console.log(`Reference fidelity contract: ${REFERENCE_FIDELITY_V3.version}`);
console.log(`Actor draw calls by loaded runtime profile: ${JSON.stringify(actorProfiles)}`);
console.log(
  `Opening ${desktopStats.drawCallsByLayer?.actors}/${desktopStats.drawCalls}`
  + `; mobile ${mobileStats.drawCalls}/${mobileStats.triangles} tri`
  + `; seven-axis ${sevenAxis.within}/${sevenAxis.total}`
);
if (!result.pass) {
  console.error(`Reference fidelity v3 BLOCKED:\n- ${result.failures.join("\n- ")}`);
  process.exitCode = 1;
} else {
  console.log("Reference fidelity v3 passed.");
}
