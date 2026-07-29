import puppeteer from "puppeteer-core";

const BASE_URL = (process.env.MIRRORLIFE_BASE_URL || "http://127.0.0.1:4182").replace(/\/$/, "");
const CHROME = process.env.CHROME_BIN || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const SAMPLE_INTERVAL_MS = 500;
const SAMPLE_DURATION_MS = Number(process.env.MIRRORLIFE_MAP_DURATION_MS || 10000);
// The rendered body has a 2–3px walk/bob offset around its authored foot
// anchor; 15px still keeps the visible feet within the 18px road + sidewalk
// envelope while rejecting the previous 90–112px drift.
const MAX_ROAD_DISTANCE_PX = 15;
const MAX_SAMPLE_DISPLACEMENT_PX = 28;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function sampleProfile(page, profile) {
  await page.setViewport({ ...profile.viewport, deviceScaleFactor: 1 });
  await page.goto(`${BASE_URL}/game.html?qaInterior=public-plaza&qaFresh=1`, {
    waitUntil: "domcontentloaded",
    timeout: 30000
  });
  await page.waitForFunction(() => document.body.classList.contains("interior-active"), { timeout: 30000 });
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => !document.body.classList.contains("interior-active"), { timeout: 10000 });
  await page.evaluate(() => startSocietyRun());

  const samples = [];
  const startedAt = Date.now();
  while (Date.now() - startedAt < SAMPLE_DURATION_MS) {
    await new Promise((resolve) => setTimeout(resolve, SAMPLE_INTERVAL_MS));
    samples.push(await page.evaluate(() => {
      const frame = lastWorldFrame;
      const roadPoints = [];
      frame.roadPairs.forEach(([fromRect, toRect]) => {
        const start = getRoadEndpoint(fromRect, toRect);
        const end = getRoadEndpoint(toRect, fromRect);
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const horizontal = Math.abs(dx) > Math.abs(dy);
        const control1 = horizontal
          ? { x: start.x + dx * 0.42, y: start.y }
          : { x: start.x, y: start.y + dy * 0.42 };
        const control2 = horizontal
          ? { x: end.x - dx * 0.42, y: end.y }
          : { x: end.x, y: end.y - dy * 0.42 };
        const steps = Math.max(8, Math.ceil(Math.hypot(dx, dy) / 8));
        for (let index = 0; index <= steps; index += 1) {
          const progress = index / steps;
          const inverse = 1 - progress;
          roadPoints.push({
            x: inverse ** 3 * start.x
              + 3 * inverse ** 2 * progress * control1.x
              + 3 * inverse * progress ** 2 * control2.x
              + progress ** 3 * end.x,
            y: inverse ** 3 * start.y
              + 3 * inverse ** 2 * progress * control1.y
              + 3 * inverse * progress ** 2 * control2.y
              + progress ** 3 * end.y
          });
        }
        [
          { rect: fromRect, toward: toRect },
          { rect: toRect, toward: fromRect }
        ].forEach(({ rect, toward }) => {
          const gate = getRoadEndpoint(rect, toward);
          const junction = getZonePedestrianJunctionPoint(rect);
          const connectorSteps = Math.max(
            1,
            Math.ceil(Math.hypot(junction.x - gate.x, junction.y - gate.y) / 8)
          );
          for (let index = 0; index <= connectorSteps; index += 1) {
            const progress = index / connectorSteps;
            roadPoints.push({
              x: gate.x + (junction.x - gate.x) * progress,
              y: gate.y + (junction.y - gate.y) * progress
            });
          }
        });
      });

      const citizens = (frame.citizenEntries || []).flatMap((entry) => {
        const screen = worldToScreenPoint(entry.x, entry.y, frame.W, frame.H);
        if (
          screen.x < -24
          || screen.x > frame.W + 24
          || screen.y < 64
          || screen.y > frame.H + 24
        ) return [];
        let roadDistance = Infinity;
        roadPoints.forEach((point) => {
          roadDistance = Math.min(roadDistance, Math.hypot(entry.x - point.x, entry.y - point.y));
        });
        return [{
          id: entry.citizen.id,
          screenX: screen.x,
          screenY: screen.y,
          roadDistance,
          state: entry.moveAnim?.state || "",
          behavior: entry.moveAnim?.behavior?.id || "",
          worldX: entry.x,
          worldY: entry.y,
          mapZoneId: entry.moveAnim?.mapZoneId || "",
          assignedZoneId: entry.citizen.zoneId || "",
          mapRouteNextZoneId: entry.moveAnim?.mapRouteNextZoneId || "",
          remainingRoutePoints: entry.moveAnim?.mapRoutePath?.length || 0,
          targetX: entry.moveAnim?.targetX,
          targetY: entry.moveAnim?.targetY,
          frameWidth: frame.W,
          frameHeight: frame.H,
          cameraX: camera.x,
          cameraY: camera.y,
          cameraZoom: camera.zoom
        }];
      });
      return {
        citizens,
        clearance: structuredClone(window.__mirrorLifeMapClearance || null)
      };
    }));
  }
  await page.evaluate(() => pauseSocietyRun());

  let maxRoadDistance = 0;
  let worstRoad = null;
  let maxSampleDisplacement = 0;
  let worstJump = null;
  let worstBuildingOverlap = 0;
  let worstLabelOverlap = 0;
  let worstAvatarOverlap = 0;
  let worstCluster = 0;
  let worstClearance = null;
  const previous = new Map();
  const firstPositions = new Map();
  let maxCitizenTravel = 0;
  samples.forEach((sample) => {
    assert(sample.clearance, `${profile.name}: map clearance diagnostics are missing.`);
    const visibleIds = new Set();
    sample.citizens.forEach((citizen) => {
      visibleIds.add(citizen.id);
      if (!firstPositions.has(citizen.id)) {
        firstPositions.set(citizen.id, citizen);
      } else {
        const initial = firstPositions.get(citizen.id);
        maxCitizenTravel = Math.max(
          maxCitizenTravel,
          Math.hypot(citizen.screenX - initial.screenX, citizen.screenY - initial.screenY)
        );
      }
      if (citizen.roadDistance > maxRoadDistance) {
        maxRoadDistance = citizen.roadDistance;
        worstRoad = citizen;
      }
      const prior = previous.get(citizen.id);
      if (prior) {
        const displacement = Math.hypot(citizen.screenX - prior.screenX, citizen.screenY - prior.screenY);
        if (displacement > maxSampleDisplacement) {
          maxSampleDisplacement = displacement;
          worstJump = { id: citizen.id, from: prior, to: citizen };
        }
      }
      previous.set(citizen.id, citizen);
    });
    [...previous.keys()].forEach((citizenId) => {
      if (!visibleIds.has(citizenId)) previous.delete(citizenId);
    });
    if (sample.clearance.buildingOverlaps.length > worstBuildingOverlap) {
      worstBuildingOverlap = sample.clearance.buildingOverlaps.length;
      worstClearance = sample.clearance;
    }
    worstLabelOverlap = Math.max(worstLabelOverlap, sample.clearance.labelOverlaps.length);
    worstAvatarOverlap = Math.max(worstAvatarOverlap, sample.clearance.avatarClearanceViolations.length);
    worstCluster = Math.max(worstCluster, sample.clearance.maxLocalCluster);
  });

  return {
    name: profile.name,
    samples: samples.length,
    maxRoadDistance,
    worstRoad,
    maxSampleDisplacement,
    worstJump,
    worstBuildingOverlap,
    worstLabelOverlap,
    worstAvatarOverlap,
    worstCluster,
    worstClearance,
    maxCitizenTravel
  };
}

const profiles = [
  { name: "desktop", viewport: { width: 1280, height: 720 } },
  { name: "mobile", viewport: { width: 390, height: 844 } }
].filter((profile) => profile.name === (process.env.MIRRORLIFE_MAP_PROFILE || "desktop"));
const results = [];
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--no-sandbox", "--disable-background-networking", "--disable-component-update"]
});
try {
  const profileResults = await Promise.all(profiles.map(async (profile) => {
    const page = await browser.newPage();
    return sampleProfile(page, profile);
  }));
  results.push(...profileResults);
  console.log(JSON.stringify({ results }, null, 2));
  results.forEach((result) => {
    assert(
      result.maxRoadDistance <= MAX_ROAD_DISTANCE_PX,
      `${result.name}: visible citizen feet drifted ${result.maxRoadDistance.toFixed(2)}px from the rendered road (limit ${MAX_ROAD_DISTANCE_PX}px).`
    );
    assert(
      result.maxSampleDisplacement <= MAX_SAMPLE_DISPLACEMENT_PX,
      `${result.name}: a citizen jumped ${result.maxSampleDisplacement.toFixed(2)}px between 500ms samples (limit ${MAX_SAMPLE_DISPLACEMENT_PX}px).`
    );
    assert(result.worstBuildingOverlap === 0, `${result.name}: citizens overlapped ${result.worstBuildingOverlap} building silhouettes.`);
    assert(result.worstLabelOverlap === 0, `${result.name}: citizens overlapped ${result.worstLabelOverlap} zone labels.`);
    assert(result.worstAvatarOverlap === 0, `${result.name}: citizens entered the avatar clearance ${result.worstAvatarOverlap} times.`);
    assert(result.worstCluster <= 2, `${result.name}: local citizen cluster reached ${result.worstCluster} people.`);
    assert(result.maxCitizenTravel >= 8, `${result.name}: citizens stayed spatially frozen for the full 10-second observation window.`);
  });
} finally {
  await Promise.race([browser.close(), new Promise((resolve) => setTimeout(resolve, 4000))]);
}
