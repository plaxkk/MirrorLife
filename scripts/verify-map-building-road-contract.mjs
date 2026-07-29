import puppeteer from "puppeteer-core";

const BASE_URL = (process.env.MIRRORLIFE_BASE_URL || "http://127.0.0.1:4182").replace(/\/$/, "");
const CHROME = process.env.CHROME_BIN || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const MIN_ENTRANCE_PARCEL_Y = 0.12;
const MIN_CONNECTOR_COVERAGE = 0.25;
const MIN_AVERAGE_CONNECTOR_COVERAGE = 0.72;
const MIN_VISIBLE_BUILDINGS = 6;
// Keep the inherited dense topology observable and non-regressing. Eliminating
// these crossings requires a separate authored road graph; runtime A* added
// nearly a second to first render and is intentionally not accepted here.
const MAX_UNRELATED_ROAD_CROSSINGS = {
  desktop: 55,
  mobile: 43
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function verifyProfile(browser, profile) {
  const page = await browser.newPage();
  await page.setViewport({ ...profile.viewport, deviceScaleFactor: 1 });
  await page.goto(`${BASE_URL}/game.html?qaInterior=public-plaza&qaFresh=1`, {
    waitUntil: "domcontentloaded",
    timeout: 30000
  });
  await page.waitForFunction(() => document.body.classList.contains("interior-active"), { timeout: 30000 });
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => !document.body.classList.contains("interior-active"), { timeout: 10000 });
  await new Promise((resolve) => setTimeout(resolve, 350));

  const result = await page.evaluate(({ minEntranceParcelY, minConnectorCoverage }) => {
    const canvas = document.getElementById("gameCanvas");
    const context = canvas.getContext("2d", { willReadFrequently: true });
    const bounds = canvas.getBoundingClientRect();
    const dpr = canvas.width / bounds.width;
    const frame = lastWorldFrame;
    const renderedContracts = Array.isArray(window.__mirrorLifeMapBuildingRoadContracts)
      ? window.__mirrorLifeMapBuildingRoadContracts
      : [];
    const roadPalette = [
      [26, 26, 46],
      [246, 215, 93],
      [255, 244, 184],
      [239, 198, 90],
      [255, 248, 232]
    ];
    const isRoadPixel = (pixel) => roadPalette.some(([r, g, b]) => (
      Math.abs(pixel[0] - r) <= 24
      && Math.abs(pixel[1] - g) <= 24
      && Math.abs(pixel[2] - b) <= 24
      && pixel[3] >= 150
    ));
    const samplePixel = (point) => {
      const screen = worldToScreenPoint(point.x, point.y, bounds.width, bounds.height);
      if (screen.x < 0 || screen.x >= bounds.width || screen.y < 64 || screen.y >= bounds.height) {
        return { screen, pixel: null };
      }
      const pixel = context.getImageData(
        Math.max(0, Math.min(canvas.width - 1, Math.round(screen.x * dpr))),
        Math.max(0, Math.min(canvas.height - 1, Math.round(screen.y * dpr))),
        1,
        1
      ).data;
      return { screen, pixel: Array.from(pixel) };
    };

    const buildings = frame.zones.flatMap((zone) => {
      const rect = frame.zoneRects.get(zone.id);
      if (!rect) return [];
      const geometry = getZoneBuildingVisualGeometry(zone, rect);
      if (!geometry) return [];
      const visible = geometry.visibleBounds;
      const entrance = {
        x: visible.x + visible.width / 2,
        y: visible.y + visible.height
      };
      const junction = getZoneRoadJunctionPoint(rect);
      const entranceScreen = worldToScreenPoint(entrance.x, entrance.y, bounds.width, bounds.height);
      const junctionScreen = worldToScreenPoint(junction.x, junction.y, bounds.width, bounds.height);
      const visibleOnScreen = (
        entranceScreen.x >= 0
        && entranceScreen.x <= bounds.width
        && entranceScreen.y >= 64
        && entranceScreen.y <= bounds.height
        && junctionScreen.x >= 0
        && junctionScreen.x <= bounds.width
        && junctionScreen.y >= 64
        && junctionScreen.y <= bounds.height
      );
      if (!visibleOnScreen) return [];

      const dx = junction.x - entrance.x;
      const dy = junction.y - entrance.y;
      const length = Math.max(0.001, Math.hypot(dx, dy));
      const perpendicular = { x: -dy / length, y: dx / length };
      const samples = Array.from({ length: 11 }, (_, index) => {
        const progress = index / 10;
        const point = {
          x: entrance.x + (junction.x - entrance.x) * progress,
          y: entrance.y + (junction.y - entrance.y) * progress
        };
        const probes = [-4, -2, 0, 2, 4].map((offset) => samplePixel({
          x: point.x + perpendicular.x * offset,
          y: point.y + perpendicular.y * offset
        }));
        return {
          screen: probes[2].screen,
          pixels: probes.map((probe) => probe.pixel),
          roadVisible: probes.some((probe) => probe.pixel && isRoadPixel(probe.pixel))
        };
      });
      const renderedSamples = samples.filter((sample) => sample.pixels.some(Boolean));
      const connectorCoverage = renderedSamples.length
        ? renderedSamples.filter((sample) => sample.roadVisible).length / renderedSamples.length
        : 0;
      return [{
        id: zone.id,
        entranceParcelY: (entrance.y - rect.y) / rect.h,
        entrance,
        junction,
        connectorLength: Math.hypot(junction.x - entrance.x, junction.y - entrance.y),
        connectorCoverage,
        pathRendered: renderedContracts.some((contract) => contract.zoneId === zone.id),
        misplacedEntrance: (entrance.y - rect.y) / rect.h < minEntranceParcelY,
        samples
      }];
    });
    const visibleIds = new Set(buildings.map((item) => item.id));
    const buildingBounds = frame.zones.flatMap((zone) => {
      if (!visibleIds.has(zone.id)) return [];
      const rect = frame.zoneRects.get(zone.id);
      const bounds = rect ? getZoneBuildingCollisionBounds(zone, rect) : null;
      return bounds ? [{ zoneId: zone.id, bounds }] : [];
    });
    const unrelatedRoadCrossings = [];
    const unrelatedRoadCrossingDetails = [];
    getRoadSamplePoints(frame.roadPairs)
      .filter((sample) => !sample.laneOffset)
      .forEach((sample) => {
        buildingBounds.forEach((building) => {
          if (building.zoneId === sample.fromZoneId || building.zoneId === sample.toZoneId) return;
          if (isPointInMapRect(sample, building.bounds, 9)) {
            const key = `${sample.fromZoneId}->${sample.toZoneId}:${building.zoneId}`;
            unrelatedRoadCrossings.push(key);
            if (!unrelatedRoadCrossingDetails.some((item) => item.key === key)) {
              unrelatedRoadCrossingDetails.push({
                key,
                point: { x: sample.x, y: sample.y },
                progress: sample.progress,
                pairIndex: sample.pairIndex,
                building: building.bounds
              });
            }
          }
        });
      });

    return {
      buildingCount: buildings.length,
      minimumEntranceParcelY: Math.min(...buildings.map((item) => item.entranceParcelY)),
      minimumConnectorCoverage: Math.min(...buildings.map((item) => item.connectorCoverage)),
      averageConnectorCoverage: buildings.reduce((sum, item) => sum + item.connectorCoverage, 0) / buildings.length,
      misplacedBuildings: buildings.filter((item) => item.misplacedEntrance).map((item) => item.id),
      disconnectedBuildings: buildings
        .filter((item) => !item.pathRendered || item.connectorCoverage < minConnectorCoverage)
        .map((item) => item.id),
      unrelatedRoadCrossings: [...new Set(unrelatedRoadCrossings)],
      unrelatedRoadCrossingDetails: unrelatedRoadCrossingDetails.slice(0, 8),
      buildings
    };
  }, {
    minEntranceParcelY: MIN_ENTRANCE_PARCEL_Y,
    minConnectorCoverage: MIN_CONNECTOR_COVERAGE
  });
  await page.close();
  return { name: profile.name, ...result };
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--no-sandbox", "--disable-background-networking", "--disable-component-update"]
});

try {
  const profiles = [
    { name: "desktop", viewport: { width: 1280, height: 720 } },
    { name: "mobile", viewport: { width: 390, height: 844 } }
  ].filter((profile) => !process.env.MIRRORLIFE_MAP_PROFILE || profile.name === process.env.MIRRORLIFE_MAP_PROFILE);
  const results = [];
  for (const profile of profiles) results.push(await verifyProfile(browser, profile));
  console.log(JSON.stringify({
    results: results.map(({ buildings, unrelatedRoadCrossings, ...summary }) => ({
      ...summary,
      unrelatedRoadCrossingCount: unrelatedRoadCrossings.length
    }))
  }, null, 2));
  results.forEach((result) => {
    assert(
      result.buildingCount >= MIN_VISIBLE_BUILDINGS,
      `${result.name}: only ${result.buildingCount} buildings were visible for the building-road contract.`
    );
    assert(
      result.minimumEntranceParcelY >= MIN_ENTRANCE_PARCEL_Y,
      `${result.name}: building entrances remained outside their authored parcels (minimum normalized y ${result.minimumEntranceParcelY.toFixed(3)}, misplaced ${result.misplacedBuildings.join(", ")}).`
    );
    assert(
      result.minimumConnectorCoverage >= MIN_CONNECTOR_COVERAGE,
      `${result.name}: entrance paths did not visibly connect every building to its street (${(result.minimumConnectorCoverage * 100).toFixed(1)}% minimum coverage, disconnected ${result.disconnectedBuildings.join(", ")}).`
    );
    assert(
      result.averageConnectorCoverage >= MIN_AVERAGE_CONNECTOR_COVERAGE,
      `${result.name}: entrance paths were not legible across the map (${(result.averageConnectorCoverage * 100).toFixed(1)}% average coverage, limit ${(MIN_AVERAGE_CONNECTOR_COVERAGE * 100).toFixed(0)}%).`
    );
    assert(
      result.unrelatedRoadCrossings.length <= MAX_UNRELATED_ROAD_CROSSINGS[result.name],
      `${result.name}: unrelated road/building crossings regressed from the measured topology baseline (${result.unrelatedRoadCrossings.length} > ${MAX_UNRELATED_ROAD_CROSSINGS[result.name]}).`
    );
  });
} finally {
  const browserProcess = browser.process();
  await Promise.race([browser.close(), new Promise((resolve) => setTimeout(resolve, 4000))]);
  if (browserProcess && browserProcess.exitCode == null && !browserProcess.killed) browserProcess.kill("SIGTERM");
}
