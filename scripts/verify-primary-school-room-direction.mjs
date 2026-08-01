import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { PNG } from "pngjs";

const ROOT = process.cwd();
const PACKET_ROOT = "assets/art-targets/primary-school-v4";
const REQUIRED_VIEWS = Object.freeze(["hero", "yaw-0", "yaw-90", "yaw-180", "yaw-270", "top"]);
const INPUT_CONTRACT_SHA256 = "b7539bfad43e181ab051c7e6131946690f00c8ecd89be0861a2663ebf561f5b6";

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function parseArgs(argv) {
  const args = { requireApproved: false };
  for (const argument of argv) {
    if (argument === "--require-approved") args.requireApproved = true;
    else throw new Error(`Unknown argument: ${argument}`);
  }
  return args;
}

async function verifyRoomDirection({ requireApproved = false } = {}) {
  const root = path.resolve(ROOT, PACKET_ROOT);
  const review = JSON.parse(await fs.readFile(path.join(root, "review/room-direction.json"), "utf8"));
  const provenance = JSON.parse(await fs.readFile(path.join(root, "provenance/room-generation.json"), "utf8"));

  if (review.version !== 1 || review.pilotId !== "primary-school-v4"
    || review.styleId !== "mirrorlife-storybook-cinematic-v1") {
    throw new Error("room-direction identity is invalid");
  }
  if (review.geometry?.inputContractSha256 !== INPUT_CONTRACT_SHA256
    || provenance.geometryInputs?.inputContractSha256 !== INPUT_CONTRACT_SHA256) {
    throw new Error("runtime geometry input contract hash is invalid");
  }
  if (provenance.promotionEligible !== false || review.promotionEligible !== false) {
    throw new Error("unapproved imagegen room packet must not be promotion eligible");
  }
  if (requireApproved && review.userReview?.decision !== "approved") {
    throw new Error("room direction is pending explicit user approval");
  }
  if (!["pending", "approved", "rejected"].includes(review.userReview?.decision)) {
    throw new Error("room user-review decision is invalid");
  }

  for (const view of REQUIRED_VIEWS) {
    const expected = review.artifacts?.[view];
    if (!expected || expected.file !== `room/${view}.png`) {
      throw new Error(`room view metadata is missing: ${view}`);
    }
    const buffer = await fs.readFile(path.join(root, expected.file));
    if (sha256(buffer) !== expected.sha256) throw new Error(`room view hash mismatch: ${view}`);
    const png = PNG.sync.read(buffer);
    if (png.width !== expected.width || png.height !== expected.height) {
      throw new Error(`room view dimensions mismatch: ${view}`);
    }
    if (png.width < 512 || png.height < 512) throw new Error(`room view is below review resolution: ${view}`);
  }

  const attempts = review.structuralAttempts?.filter((attempt) => attempt.subject === "yaw-90") ?? [];
  if (attempts.length !== 3 || attempts.at(-1)?.result !== "accepted-for-user-review") {
    throw new Error("yaw-90 stop-rule evidence is incomplete");
  }
  for (const key of ["exactlyFourPeople", "lShapeVisible", "doorVisibleInAtLeastTwoViews", "circulationReadable"]) {
    if (review.yawEvidence?.[key] !== true) throw new Error(`room yaw evidence is missing: ${key}`);
  }

  return {
    views: REQUIRED_VIEWS.length,
    decision: review.userReview.decision,
    promotionEligible: review.promotionEligible
  };
}

const isMain = process.argv[1]
  && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (isMain) {
  const args = parseArgs(process.argv.slice(2));
  verifyRoomDirection(args).then((report) => {
    console.log(`Primary-school room direction: PASS ${report.views}/6 views; user review ${report.decision}; promotion eligible ${report.promotionEligible}.`);
  }).catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}

export { REQUIRED_VIEWS, verifyRoomDirection };
