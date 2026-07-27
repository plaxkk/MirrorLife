import assert from "node:assert/strict";
import { summarizeBuildingReadiness } from "./report-interior-building-readiness.mjs";

const complete = summarizeBuildingReadiness({
  zoneId: "public-plaza",
  model: true,
  layout: true,
  physics: true,
  pathfinding: true,
  interaction: true,
  performance: true,
  localAcceptance: true,
  deployedAcceptance: true
});

assert.equal(complete.status, "ready");
assert.deepEqual(complete.blockers, []);

const incomplete = summarizeBuildingReadiness({
  zoneId: "factory",
  model: true,
  layout: true,
  physics: true,
  pathfinding: true,
  interaction: false,
  performance: null,
  localAcceptance: null,
  deployedAcceptance: null
});

assert.equal(incomplete.status, "blocked");
assert.deepEqual(incomplete.blockers, ["interaction"]);
assert.deepEqual(incomplete.notVerified, ["performance", "localAcceptance", "deployedAcceptance"]);

console.log("Interior building readiness summary tests passed.");
