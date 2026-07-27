#!/usr/bin/env node
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { REFERENCE_FIDELITY_V3 } from "../src/reference-fidelity-runtime-contract.js";

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "mirrorlife-v3-artifacts-"));
const writeJson = (name, value) => {
  const file = path.join(tempRoot, name);
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
  return file;
};
const actor = (role, mobile = false) => ({
  assetRole: role,
  actorDrawCalls: 10,
  articulationBatchCount: mobile ? 1 : 2,
  drivenRigidSurfaceCount: 0,
  skinnedArticulationBoneCount: mobile ? 16 : 12,
  ...(mobile ? {
    mobileArticulationStructure: {
      coreIdentity: "SkinnedArticulationCore",
      coreBatchCount: 1,
      detailIdentity: "SkinnedArticulationDetail",
      detailSemantic: "detail",
      detailSharesCoreSkeleton: true,
      detailRemoved: true,
      removedDetailBatchCount: 1,
      renderedDetailBatchCount: 0
    }
  } : {})
});
const greenState = {
  blink: { applicable: true, green: true, value: 1 },
  handContact: { applicable: true, green: true, value: 0 },
  elbowVolume: { applicable: true, green: true, value: 1.12 },
  footPlant: { applicable: true, green: true, value: 0 },
  clothCompression: { applicable: true, green: true, value: 0.2 }
};
const stats = (roles, fingerprint, mobile = false) => ({
  buildFingerprint: fingerprint,
  referenceFidelityContract: REFERENCE_FIDELITY_V3,
  drawCalls: mobile ? 110 : 145,
  triangles: mobile ? 250000 : 320000,
  drawCallsByLayer: { actors: 55 },
  actorArticulationBreakdown: Object.fromEntries(
    roles.map((role) => [role, actor(role, mobile)])
  ),
  actorContractStates: Object.fromEntries(roles.map((role) => [role, greenState]))
});
const manifest = (profileStats, fingerprint) => ({
  buildFingerprint: fingerprint,
  scenes: [{ zone: "public-plaza", stats: profileStats }]
});
const runVerifier = ({ desktop, mobile, blink, gap }) => spawnSync(
  process.execPath,
  [path.resolve("scripts/verify-reference-fidelity-v3.mjs")],
  {
    cwd: process.cwd(),
    encoding: "utf8",
    env: {
      ...process.env,
      MIRRORLIFE_V3_DESKTOP_MANIFEST: desktop,
      MIRRORLIFE_V3_MOBILE_MANIFEST: mobile,
      MIRRORLIFE_V3_BLINK_MANIFEST: blink,
      MIRRORLIFE_V3_GAP_JSON: gap
    }
  }
);

try {
  const fingerprint =
    "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
  const desktopStats = stats(REFERENCE_FIDELITY_V3.openingActorRoles, fingerprint);
  const mobileStats = stats(REFERENCE_FIDELITY_V3.mobileActorRoles, fingerprint, true);
  const blinkStats = stats(REFERENCE_FIDELITY_V3.openingActorRoles, fingerprint);
  const desktop = writeJson("desktop.json", manifest(desktopStats, fingerprint));
  const mobile = writeJson("mobile.json", manifest(mobileStats, fingerprint));
  const blink = writeJson("blink.json", manifest(blinkStats, fingerprint));
  const gap = writeJson("gap.json", {
    buildFingerprint: fingerprint,
    within: 4,
    total: 7
  });

  const sameBuild = runVerifier({ desktop, mobile, blink, gap });
  assert.equal(sameBuild.status, 0, sameBuild.stderr || sameBuild.stdout);
  assert.match(sameBuild.stdout, /Reference fidelity v3 passed/);

  const mixedFingerprint =
    "sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
  const mixedMobile = writeJson(
    "mobile-mixed.json",
    manifest(
      stats(REFERENCE_FIDELITY_V3.mobileActorRoles, mixedFingerprint, true),
      mixedFingerprint
    )
  );
  const mixedBuild = runVerifier({ desktop, mobile: mixedMobile, blink, gap });
  assert.equal(mixedBuild.status, 1, mixedBuild.stderr || mixedBuild.stdout);
  assert.match(mixedBuild.stderr, /build fingerprint mismatch/);

  console.log("Reference fidelity v3 artifact fixtures passed: same-build accepted, mixed-build rejected.");
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
