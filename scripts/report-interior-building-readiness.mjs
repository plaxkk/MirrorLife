import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const CHECKS = [
  "model",
  "layout",
  "physics",
  "pathfinding",
  "interaction",
  "performance",
  "localAcceptance",
  "deployedAcceptance"
];

export function summarizeBuildingReadiness(input) {
  const blockers = CHECKS.filter((key) => input[key] === false);
  const notVerified = CHECKS.filter((key) => input[key] == null);
  return {
    ...input,
    status: blockers.length > 0 ? "blocked" : notVerified.length > 0 ? "not_verified" : "ready",
    blockers,
    notVerified
  };
}

async function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return fallback;
    throw error;
  }
}

function mark(value) {
  if (value === true) return "yes";
  if (value === false) return "no";
  return "not verified";
}

async function buildReport(repositoryRoot) {
  const physicsPath = path.join(repositoryRoot, "dist/interior-physics-review/report.json");
  const acceptancePath = path.join(repositoryRoot, "config/interior-building-acceptance.json");
  const physics = await readJson(physicsPath);
  if (!physics) {
    throw new Error("Missing physics report. Run `npm run verify:interior-physics` before generating the building readiness matrix.");
  }
  const acceptance = await readJson(acceptancePath, {});
  const physicsPassed = Object.values(physics.assertions || {}).every(Boolean);

  const rows = (physics.reports || []).map((zone) => {
    const evidence = acceptance[zone.zoneId] || {};
    return summarizeBuildingReadiness({
      zoneId: zone.zoneId,
      archetype: zone.archetype,
      model: zone.colliderCount > 0,
      layout: Boolean(zone.snapshot?.spawn) && zone.interactionCount > 0,
      physics: physicsPassed,
      pathfinding: physics.assertions?.pathfinding === true && zone.maxPathWaypoints > 0,
      interaction: zone.interactionCount > 0,
      performance: typeof evidence.performance === "boolean" ? evidence.performance : null,
      localAcceptance: typeof evidence.localAcceptance === "boolean" ? evidence.localAcceptance : null,
      deployedAcceptance: typeof evidence.deployedAcceptance === "boolean" ? evidence.deployedAcceptance : null,
      evidence: evidence.evidence || null
    });
  });

  return {
    generatedAt: new Date().toISOString(),
    policy: "A building is ready only when model/layout, physics/pathfinding, interaction, performance, local acceptance, and deployed acceptance are all verified.",
    summary: {
      total: rows.length,
      ready: rows.filter((row) => row.status === "ready").length,
      blocked: rows.filter((row) => row.status === "blocked").length,
      notVerified: rows.filter((row) => row.status === "not_verified").length
    },
    rows
  };
}

async function main() {
  const repositoryRoot = process.cwd();
  const report = await buildReport(repositoryRoot);
  const outputRoot = path.join(repositoryRoot, "dist/interior-building-readiness");
  await fs.mkdir(outputRoot, { recursive: true });
  await fs.writeFile(path.join(outputRoot, "report.json"), `${JSON.stringify(report, null, 2)}\n`);

  const lines = [
    "# Interior Building Ready Matrix",
    "",
    `Ready: ${report.summary.ready}/${report.summary.total}; blocked: ${report.summary.blocked}; awaiting evidence: ${report.summary.notVerified}.`,
    "",
    "| Building | Archetype | Model | Layout | Physics | Path | Interaction | Performance | Local | Deployed | Status |",
    "| --- | --- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | --- |",
    ...report.rows.map((row) => `| ${row.zoneId} | ${row.archetype} | ${mark(row.model)} | ${mark(row.layout)} | ${mark(row.physics)} | ${mark(row.pathfinding)} | ${mark(row.interaction)} | ${mark(row.performance)} | ${mark(row.localAcceptance)} | ${mark(row.deployedAcceptance)} | ${row.status} |`),
    "",
    "Performance, local browser acceptance, and deployed-preview acceptance stay `not verified` until explicit evidence is recorded in `config/interior-building-acceptance.json`."
  ];
  await fs.writeFile(path.join(outputRoot, "report.md"), `${lines.join("\n")}\n`);
  console.log(`Interior building readiness: ${report.summary.ready}/${report.summary.total} ready; ${report.summary.blocked} blocked; ${report.summary.notVerified} awaiting evidence.`);
  console.log("Report: dist/interior-building-readiness/report.md");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
