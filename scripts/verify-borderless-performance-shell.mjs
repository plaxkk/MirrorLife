import assert from "node:assert/strict";
import { runBorderlessBenchmark } from "./benchmark-borderless-runtime.mjs";

const baseUrl = process.env.MIRRORLIFE_BASE_URL || "http://127.0.0.1:4173/game.html";
const mobile = process.env.MIRRORLIFE_VIEWPORT === "mobile";
const result = await runBorderlessBenchmark({
  baseUrl,
  viewport: mobile
    ? { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
    : { width: 1440, height: 900, deviceScaleFactor: 1 }
});

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);

const finite = (value, label) => assert.ok(Number.isFinite(value), `${label} must be finite.`);

assert.equal(result.errors.length, 0);
finite(result.navigation.transferBytes, "navigation.transferBytes");
finite(result.map.dragP95Ms, "map.dragP95Ms");
finite(result.sweep.generationP95Ms, "sweep.generationP95Ms");
finite(result.sweep.cacheSize, "sweep.cacheSize");
assert.notEqual(result.interior.warmReadyMs, null, "interior.warmReadyMs must not be null.");
finite(result.interior.warmReadyMs, "interior.warmReadyMs");
assert.ok(result.navigation.transferBytes <= (mobile ? 2_200_000 : 2_800_000));
assert.ok(result.map.dragP95Ms <= (mobile ? 25 : 16.7));
assert.ok(result.sweep.generationP95Ms <= (mobile ? 12 : 8));
assert.equal(result.sweep.cacheSize, 72);
assert.ok(result.interior.warmReadyMs <= (mobile ? 1200 : 800));
assert.equal(result.resourcesBeforeInterior.some((name) =>
  /three\.module|rapier|GLTFLoader|interior-three|interior-physics/.test(name)
), false);
