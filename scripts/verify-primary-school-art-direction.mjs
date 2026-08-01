import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { PNG } from "pngjs";

const ROOT = process.cwd();
const DEFAULT_PACKET_ROOT = "assets/art-targets/primary-school-v4";
const REQUIRED_ROOM_VIEWS = Object.freeze(["hero", "yaw-0", "yaw-90", "yaw-180", "yaw-270", "top"]);
const REQUIRED_DETAIL_VIEWS = Object.freeze(["reading-corner", "shared-study-table", "question-wall"]);
const REQUIRED_PROPS = Object.freeze([
  "reading-corner",
  "shared-study-table",
  "student-desk",
  "low-podium",
  "question-wall",
  "sharing-corner"
]);
const REQUIRED_PROP_VIEWS = Object.freeze(["front", "back", "left", "right", "top", "bottom", "isometric"]);
const REQUIRED_CHARACTERS = Object.freeze(["player", "listener", "facilitator", "mediator"]);
const REQUIRED_CHARACTER_VIEWS = Object.freeze([
  "front",
  "side",
  "back",
  "three-quarter",
  "a-pose",
  "head-hands",
  "expressions"
]);
const REVIEW_CATEGORIES = Object.freeze({
  spatialComposition: 20,
  shapeUnity: 20,
  materialColorLighting: 20,
  characterAppeal: 20,
  actionContact: 10,
  mobileReadability: 10
});

function parseArgs(argv) {
  const args = { packetRoot: DEFAULT_PACKET_ROOT, allowPendingReview: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--packet-root") args.packetRoot = argv[++index];
    else if (arg === "--allow-pending-review") args.allowPendingReview = true;
    else if (arg === "--help" || arg === "-h") {
      console.log(`Verify the geometry-controlled primary-school V4 Art Target packet.

Usage:
  node scripts/verify-primary-school-art-direction.mjs
  node scripts/verify-primary-school-art-direction.mjs --allow-pending-review

Options:
  --packet-root <dir>       Packet root. Default: ${DEFAULT_PACKET_ROOT}
  --allow-pending-review   Validate generated assets while leaving the user Art Gate pending.
`);
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return args;
}

function toPosix(filePath) {
  return filePath.split(path.sep).join("/");
}

function artifactId(kind, owner, view) {
  return [kind, owner, view].filter(Boolean).join(":");
}

function requiredArtifacts() {
  return [
    ...REQUIRED_ROOM_VIEWS.map((view) => ({
      id: artifactId("room", null, view),
      file: `room/${view}.png`,
      kind: "png"
    })),
    ...REQUIRED_DETAIL_VIEWS.map((view) => ({
      id: artifactId("detail", null, view),
      file: `details/${view}.png`,
      kind: "png"
    })),
    ...REQUIRED_PROPS.flatMap((prop) => REQUIRED_PROP_VIEWS.map((view) => ({
      id: artifactId("prop", prop, view),
      file: `props/${prop}/${view}.png`,
      kind: "png"
    }))),
    ...REQUIRED_CHARACTERS.flatMap((role) => REQUIRED_CHARACTER_VIEWS.map((view) => ({
      id: artifactId("character", role, view),
      file: `characters/${role}/${view}.png`,
      kind: "png"
    }))),
    {
      id: "benchmark:environment-and-cast",
      file: "benchmark/environment-and-cast.png",
      kind: "png"
    },
    { id: "source:hero", file: "sources/hero.kra", kind: "source" },
    ...REQUIRED_PROPS.map((prop) => ({
      id: artifactId("source-prop", prop),
      file: `sources/props/${prop}.kra`,
      kind: "source"
    })),
    ...REQUIRED_CHARACTERS.map((role) => ({
      id: artifactId("source-character", role),
      file: `sources/characters/${role}.kra`,
      kind: "source"
    }))
  ];
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

async function sha256File(filePath) {
  return crypto.createHash("sha256").update(await fs.readFile(filePath)).digest("hex");
}

async function validatePng(filePath, label) {
  const png = PNG.sync.read(await fs.readFile(filePath));
  if (png.width < 512 || png.height < 512) {
    throw new Error(`${label} is below the 512px review floor (${png.width}x${png.height})`);
  }
  const pixels = png.width * png.height;
  let opaquePixels = 0;
  for (let offset = 3; offset < png.data.length; offset += 4) {
    if (png.data[offset] > 8) opaquePixels += 1;
  }
  if (opaquePixels / pixels < 0.5) {
    throw new Error(`${label} has insufficient visible image coverage`);
  }
  return { width: png.width, height: png.height };
}

function validateWorkflow(workflow) {
  const inputNames = new Set(Object.keys(workflow?.interface?.inputs ?? {}));
  const outputNames = new Set(Object.keys(workflow?.interface?.outputs ?? {}));
  for (const name of ["graybox", "depth", "normal", "palette", "material_board", "seed"]) {
    if (!inputNames.has(name)) throw new Error(`workflow input is missing: ${name}`);
  }
  for (const name of ["candidate", "workflow_metadata"]) {
    if (!outputNames.has(name)) throw new Error(`workflow output is missing: ${name}`);
  }
  const model = workflow?.model;
  if (model?.name !== "FLUX.2 klein 4B" || !/^[0-9a-f]{64}$/i.test(model?.sha256 ?? "")) {
    throw new Error("workflow FLUX.2 klein 4B model hash is missing or invalid");
  }
}

function validateReview(review, heroHash, { allowPendingReview }) {
  const scores = [];
  for (const [category, weight] of Object.entries(REVIEW_CATEGORIES)) {
    const score = Number(review?.categories?.[category]);
    if (!Number.isFinite(score) || score < 0 || score > 100) {
      throw new Error(`Art Gate category score is invalid: ${category}`);
    }
    scores.push({ category, score, weight });
  }
  if (allowPendingReview && review.decision === "pending") return { total: null, pending: true };
  if (review.decision !== "approved") throw new Error("Art Gate decision must be approved by the user");
  if (typeof review.reviewer !== "string" || review.reviewer.trim().length === 0) {
    throw new Error("Art Gate reviewer is missing");
  }
  if (!Number.isFinite(Date.parse(review.reviewedAt))) throw new Error("Art Gate reviewedAt is invalid");
  if (review.selectedCandidateHash !== heroHash) throw new Error("Art Gate selected candidate hash does not match hero.png");
  const belowCategoryFloor = scores.find(({ score }) => score < 75);
  if (belowCategoryFloor) {
    throw new Error(`Art Gate category is below 75: ${belowCategoryFloor.category}=${belowCategoryFloor.score}`);
  }
  const total = scores.reduce((sum, { score, weight }) => sum + score * weight, 0) / 100;
  if (total < 85) throw new Error(`Art Gate total is below 85: ${total.toFixed(2)}`);
  return { total, pending: false };
}

async function verifyPrimarySchoolArtDirection(options = {}) {
  const packetRoot = path.resolve(ROOT, options.packetRoot ?? DEFAULT_PACKET_ROOT);
  const required = requiredArtifacts();
  const supporting = [
    "manifest.json",
    "prompts/prompt-set.json",
    "provenance/generation.json",
    "review/art-direction.json",
    "workflow/primary-school-flux2-klein.json"
  ];
  const missing = [];
  for (const artifact of required) {
    if (!await exists(path.join(packetRoot, artifact.file))) missing.push(artifact.file);
  }
  for (const file of supporting) {
    if (!await exists(path.join(packetRoot, file))) missing.push(file);
  }
  if (missing.length) {
    throw new Error(`Art Target packet is missing ${missing.length} artifact(s):\n${missing.map((file) => `- ${file}`).join("\n")}`);
  }

  const manifest = await readJson(path.join(packetRoot, "manifest.json"));
  const workflow = await readJson(path.join(packetRoot, "workflow/primary-school-flux2-klein.json"));
  const prompts = await readJson(path.join(packetRoot, "prompts/prompt-set.json"));
  const provenance = await readJson(path.join(packetRoot, "provenance/generation.json"));
  const review = await readJson(path.join(packetRoot, "review/art-direction.json"));

  if (manifest.version !== 1 || manifest.pilotId !== "primary-school-v4"
    || manifest.styleId !== "mirrorlife-storybook-cinematic-v1") {
    throw new Error("Art Target manifest identity is invalid");
  }
  validateWorkflow(workflow);
  if (!Array.isArray(prompts.prompts) || prompts.prompts.length === 0) {
    throw new Error("Art Target prompt set is empty");
  }
  if (!/^[0-9a-f]{64}$/i.test(provenance?.geometryInputManifestHash ?? "")) {
    throw new Error("Art Target geometry input provenance is missing");
  }

  const manifestById = new Map((manifest.artifacts ?? []).map((entry) => [entry.id, entry]));
  const dimensions = {};
  for (const artifact of required) {
    const manifestEntry = manifestById.get(artifact.id);
    if (!manifestEntry || manifestEntry.file !== artifact.file) {
      throw new Error(`manifest entry is missing or mismatched: ${artifact.id}`);
    }
    const absoluteFile = path.join(packetRoot, artifact.file);
    const digest = await sha256File(absoluteFile);
    if (manifestEntry.sha256 !== digest) throw new Error(`manifest hash mismatch: ${artifact.id}`);
    if (artifact.kind === "png") dimensions[artifact.id] = await validatePng(absoluteFile, artifact.id);
    else if ((await fs.stat(absoluteFile)).size < 512) throw new Error(`editable source is unexpectedly small: ${artifact.id}`);
  }

  const heroHash = await sha256File(path.join(packetRoot, "room/hero.png"));
  const reviewResult = validateReview(review, heroHash, {
    allowPendingReview: options.allowPendingReview === true
  });
  return {
    packetRoot: toPosix(path.relative(ROOT, packetRoot)),
    roomViews: REQUIRED_ROOM_VIEWS.length,
    detailViews: REQUIRED_DETAIL_VIEWS.length,
    propViews: REQUIRED_PROPS.length * REQUIRED_PROP_VIEWS.length,
    characterViews: REQUIRED_CHARACTERS.length * REQUIRED_CHARACTER_VIEWS.length,
    editableSources: 1 + REQUIRED_PROPS.length + REQUIRED_CHARACTERS.length,
    artGate: reviewResult,
    dimensions
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const report = await verifyPrimarySchoolArtDirection(args);
  const decision = report.artGate.pending ? "PENDING USER REVIEW" : `PASS ${report.artGate.total.toFixed(2)}`;
  console.log(`Primary-school Art Target: ${report.roomViews} room, ${report.detailViews} detail, ${report.propViews} prop, ${report.characterViews} character views; Art Gate ${decision}.`);
}

const isMain = process.argv[1]
  && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (isMain) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}

export {
  REQUIRED_CHARACTER_VIEWS,
  REQUIRED_CHARACTERS,
  REQUIRED_DETAIL_VIEWS,
  REQUIRED_PROPS,
  REQUIRED_PROP_VIEWS,
  REQUIRED_ROOM_VIEWS,
  REVIEW_CATEGORIES,
  requiredArtifacts,
  verifyPrimarySchoolArtDirection
};
