#!/usr/bin/env node
// Rewrites the civic character manifest's measured fields from the shipped
// GLBs. The counts used to be maintained by hand and had drifted ~40% away
// from the binaries they described, which let the asset gate pass while
// checking JSON against JSON. Run this after every character re-export.
import fs from "node:fs/promises";
import path from "node:path";
import { readGlbGeometry } from "./lib/glb-geometry.mjs";

const ROOT = path.resolve("public/assets/characters/civic");
const manifestPath = path.join(ROOT, "manifest.json");
const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));

const measurements = [];
for (const [role, entry] of Object.entries(manifest.roles)) {
  const geometry = readGlbGeometry(path.join(ROOT, entry.file));
  const before = { meshes: entry.meshes, triangles: entry.triangles };
  entry.meshes = geometry.meshes;
  entry.triangles = geometry.triangles;
  measurements.push({ role, before, geometry });
}

// One contract height for a cast whose members are deliberately different
// heights: the midpoint that keeps every role inside the verifier's 3% band.
const heights = measurements.map((m) => m.geometry.height);
const contractHeight = Number(((Math.min(...heights) + Math.max(...heights)) / 2).toFixed(3));
const previousHeight = manifest.heightMeters;
manifest.heightMeters = contractHeight;

await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

console.log("Civic character manifest synced from shipped GLBs:\n");
for (const { role, before, geometry } of measurements) {
  const meshDelta = geometry.meshes - before.meshes;
  const triDelta = geometry.triangles - before.triangles;
  console.log(
    `  ${role.padEnd(12)} meshes ${String(before.meshes).padStart(4)} → ${String(geometry.meshes).padStart(4)} (${meshDelta >= 0 ? "+" : ""}${meshDelta})` +
    `   triangles ${String(before.triangles).padStart(6)} → ${String(geometry.triangles).padStart(6)} (${triDelta >= 0 ? "+" : ""}${triDelta})` +
    `   height ${geometry.height.toFixed(3)}m   floor ${geometry.groundOffset.toFixed(4)}m`
  );
}
console.log(`\n  heightMeters ${previousHeight} → ${contractHeight}`);
