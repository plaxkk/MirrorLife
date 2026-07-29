import puppeteer from "puppeteer-core";

const BASE_URL = (process.env.MIRRORLIFE_BASE_URL || "http://127.0.0.1:4182").replace(/\/$/, "");
const CHROME = process.env.CHROME_BIN || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const MAX_ENTITY_OFFSET_PX = 3;

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

  const setup = await page.evaluate(() => {
    const canvas = document.getElementById("gameCanvas");
    const context = canvas.getContext("2d");
    state.firstLoop = { ...(state.firstLoop || {}), completed: true };
    const entityEmoji = new Set((state.society.entities || []).map((entity) => entity.emoji));
    window.__mirrorLifeMapTextProbe = [];
    window.__mirrorLifeMapArcProbe = [];
    const originalFillText = context.fillText;
    const originalArc = context.arc;
    context.fillText = function probeMapText(text, x, y, ...rest) {
      if (entityEmoji.has(text) || text === "💨") {
        const transform = this.getTransform();
        window.__mirrorLifeMapTextProbe.push({
          text,
          x: transform.a * x + transform.c * y + transform.e,
          y: transform.b * x + transform.d * y + transform.f,
          alpha: this.globalAlpha
        });
        if (window.__mirrorLifeMapTextProbe.length > 800) {
          window.__mirrorLifeMapTextProbe.splice(0, window.__mirrorLifeMapTextProbe.length - 800);
        }
      }
      return originalFillText.call(this, text, x, y, ...rest);
    };
    context.arc = function probeMapArc(x, y, radius, ...rest) {
      if (String(this.fillStyle).startsWith("rgba(180, 180, 180")) {
        window.__mirrorLifeMapArcProbe.push({ x, y, radius, fillStyle: this.fillStyle });
        if (window.__mirrorLifeMapArcProbe.length > 120) {
          window.__mirrorLifeMapArcProbe.splice(0, window.__mirrorLifeMapArcProbe.length - 120);
        }
      }
      return originalArc.call(this, x, y, radius, ...rest);
    };

    const muted = lastWorldFrame.citizenEntries.filter((entry) => entry.muted && !entry.isAvatar);
    muted.forEach((entry) => {
      startCitizenBehavior(entry.citizen, entry.moveAnim, BEHAVIOR_BY_ID.get("run"), performance.now());
      entry.moveAnim.behavior.until = performance.now() + 4000;
    });
    const visibleRunner = lastWorldFrame.citizenEntries.find((entry) => entry.isAvatar);
    if (visibleRunner) {
      startCitizenBehavior(visibleRunner.citizen, visibleRunner.moveAnim, BEHAVIOR_BY_ID.get("run"), performance.now());
      visibleRunner.moveAnim.behavior.until = performance.now() + 4000;
    }
    const motionPropTexts = [];
    if (visibleRunner) {
      const probeCanvas = document.createElement("canvas");
      const probeContext = probeCanvas.getContext("2d");
      const probeFillText = probeContext.fillText;
      probeContext.fillText = function recordMotionProps(text, ...args) {
        motionPropTexts.push(text);
        return probeFillText.call(this, text, ...args);
      };
      drawCitizenFigure(
        probeContext,
        visibleRunner.citizen,
        visibleRunner.moveAnim,
        60,
        60,
        20,
        false,
        performance.now(),
        0,
        { showMotionPuffs: false }
      );
    }

    const interactionTarget = lastWorldFrame.citizenEntries.find((entry) => !entry.isAvatar);
    let interactionParticleOffset = null;
    if (interactionTarget) {
      interactWithCitizen("support", interactionTarget.citizen.id);
      const spawned = particles.slice(-6);
      interactionParticleOffset = Math.max(
        ...spawned.map((particle) => Math.hypot(
          particle.x - interactionTarget.x,
          particle.y - interactionTarget.y
        ))
      );
    }
    markRenderActive(4500);
    return {
      entityCount: state.society.entities?.length || 0,
      forcedMutedRunners: muted.map((entry) => entry.citizen.id),
      forcedVisibleRunner: visibleRunner?.citizen.id || null,
      motionPropTexts,
      interactionParticleOffset
    };
  });
  assert(setup.entityCount > 0, `${profile.name}: no runtime world entities were available for alignment verification.`);
  assert(setup.forcedVisibleRunner, `${profile.name}: no visible runner was available for motion cloud verification.`);
  if (profile.name === "mobile") {
    assert(setup.forcedMutedRunners.length > 0, "mobile: no muted runner was available for orphan cloud verification.");
  }

  await new Promise((resolve) => setTimeout(resolve, 800));
  const result = await page.evaluate(() => {
    const frame = lastWorldFrame;
    const toScreen = (x, y) => {
      const cx = frame.W / 2 + camera.x;
      const cy = frame.H / 2 + camera.y + 40;
      return {
        x: (x - frame.W / 2) * camera.zoom + cx,
        y: (y - frame.H / 2) * camera.zoom + cy
      };
    };
    const metrics = getZoneMapMetrics(frame.W, frame.H, frame.groundY);
    const entityEmoji = new Set((state.society.entities || []).map((entity) => entity.emoji));
    const probe = window.__mirrorLifeMapTextProbe;
    const entityCount = state.society.entities?.length || 0;
    const entityIndices = probe.flatMap((draw, index) => entityEmoji.has(draw.text) ? [index] : []);
    const lastEntityStart = entityIndices.at(-entityCount) ?? 0;
    const previousEntityIndex = [...entityIndices].reverse().find((index) => index < lastEntityStart) ?? -1;
    const latestFrameDraws = probe.slice(previousEntityIndex + 1);
    const actual = latestFrameDraws.filter((draw) => entityEmoji.has(draw.text)).slice(-entityCount);
    const expected = (state.society.entities || []).map((entity) => {
      const world = {
        x: metrics.margin + entity.x * metrics.mapW - metrics.mobileFocusOffset,
        y: frame.groundY + 10 + entity.y * metrics.mapH
      };
      return {
        id: entity.id,
        text: entity.emoji,
        ...toScreen(world.x, world.y)
      };
    });
    const entityOffsets = expected.map((item, index) => {
      const draw = actual[index];
      return {
        id: item.id,
        expected: item,
        actual: draw || null,
        offset: draw ? Math.hypot(draw.x - item.x, draw.y - item.y) : Infinity
      };
    });

    const puffs = latestFrameDraws.filter((draw) => draw.text === "💨");
    const visibleCitizens = (frame.citizenEntries || []).map((entry) => ({
      id: entry.citizen.id,
      muted: !!entry.muted,
      behavior: entry.moveAnim?.behavior?.id || "",
      ...toScreen(entry.x, entry.y)
    }));
    const orphanPuffs = puffs.flatMap((puff) => {
      const nearest = visibleCitizens
        .map((citizen) => ({ citizen, distance: Math.hypot(puff.x - citizen.x, puff.y - citizen.y) }))
        .sort((first, second) => first.distance - second.distance)[0];
      return nearest?.citizen.muted && nearest.distance <= 40
        ? [{ puff, citizenId: nearest.citizen.id, distance: nearest.distance }]
        : [];
    });
    const factoryZone = state.society.zones.find((zone) => zone.id === "factory");
    const factoryRect = frame.zoneRects.get("factory");
    const factoryLayout = factoryZone && factoryRect
      ? getZoneBuildingLayoutGeometry(factoryZone, factoryRect)
      : null;
    const smokePuffs = (window.__mirrorLifeMapArcProbe || []).slice(-3);
    const smokeViolations = factoryLayout
      ? smokePuffs.filter((puff) => (
        puff.x < factoryLayout.drawRect.x
        || puff.x > factoryLayout.drawRect.x + factoryLayout.drawRect.width
        || puff.y < factoryLayout.drawRect.y - 30
        || puff.y > factoryLayout.drawRect.y + factoryLayout.drawRect.height * 0.3
      ))
      : smokePuffs;
    return {
      maxEntityOffset: Math.max(...entityOffsets.map((item) => item.offset)),
      entityOffsets,
      puffCount: puffs.length,
      mutedRunners: visibleCitizens.filter((citizen) => citizen.muted && citizen.behavior === "run"),
      orphanPuffs,
      smokePuffs,
      smokeViolations
    };
  });
  await page.close();
  return { name: profile.name, setup, ...result };
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
  console.log(JSON.stringify({ results }, null, 2));
  results.forEach((result) => {
    assert(
      Number.isFinite(result.maxEntityOffset) && result.maxEntityOffset <= MAX_ENTITY_OFFSET_PX,
      `${result.name}: world entities drifted ${Number.isFinite(result.maxEntityOffset) ? result.maxEntityOffset.toFixed(2) : "without a rendered anchor"}px from their authored map position (limit ${MAX_ENTITY_OFFSET_PX}px).`
    );
    assert(
      Number.isFinite(result.setup.interactionParticleOffset) && result.setup.interactionParticleOffset <= 1,
      `${result.name}: interaction particles spawned ${Number.isFinite(result.setup.interactionParticleOffset) ? result.setup.interactionParticleOffset.toFixed(2) : "without an anchor"}px from the selected citizen.`
    );
    assert(!result.setup.motionPropTexts.includes("💨"), `${result.name}: map citizen rendering ignored the no-motion-cloud spatial contract.`);
    assert(result.puffCount === 0, `${result.name}: ${result.puffCount} ambiguous white motion clouds rendered on the city map.`);
    assert(result.orphanPuffs.length === 0, `${result.name}: ${result.orphanPuffs.length} white action clouds rendered without a visible citizen.`);
    assert(result.smokePuffs.length === 3, `${result.name}: factory smoke did not render with three auditable attachment points.`);
    assert(result.smokeViolations.length === 0, `${result.name}: ${result.smokeViolations.length} factory smoke puffs detached from the building chimney region.`);
  });
} finally {
  await Promise.race([browser.close(), new Promise((resolve) => setTimeout(resolve, 4000))]);
}
