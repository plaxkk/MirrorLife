export const REFERENCE_FIDELITY_V3 = Object.freeze({
  version: "mirrorlife-reference-fidelity-v3",
  openingActorDrawCalls: 55,
  openingDrawCalls: 145,
  desktopArticulationBatchesPerActor: 2,
  drivenRigidSurfacesPerActor: 0,
  skinnedArticulationBonesPerActor: 12,
  mobileDrawCalls: 110,
  mobileTriangles: 250000,
  sevenAxisBaseline: 4,
  sevenAxisTotal: 7
});

function isVisibleInGraph(node, root) {
  let current = node;
  while (current) {
    if (current.visible === false) return false;
    if (current === root) return true;
    current = current.parent;
  }
  return false;
}

function renderedDrawCalls(node) {
  if (!node?.isMesh || !node.geometry || !node.material) return 0;
  if (!Array.isArray(node.material)) return 1;
  const groups = node.geometry.groups || [];
  if (groups.length) {
    return groups.filter((group) => (
      Number(group.count || 0) > 0
      && node.material[Number(group.materialIndex || 0)]
    )).length;
  }
  return node.material.filter(Boolean).length;
}

function weightedBonesForMesh(mesh) {
  const skinIndex = mesh?.geometry?.getAttribute?.("skinIndex");
  const skinWeight = mesh?.geometry?.getAttribute?.("skinWeight");
  const bones = mesh?.skeleton?.bones || [];
  if (!skinIndex || !skinWeight || !bones.length) return new Set();
  const weighted = new Set();
  const vertexCount = Math.min(skinIndex.count, skinWeight.count);
  const componentCount = Math.min(skinIndex.itemSize, skinWeight.itemSize);
  for (let vertex = 0; vertex < vertexCount; vertex += 1) {
    for (let component = 0; component < componentCount; component += 1) {
      if (Number(skinWeight.getComponent(vertex, component) || 0) <= 1e-6) continue;
      const bone = bones[Number(skinIndex.getComponent(vertex, component))];
      if (bone) weighted.add(bone);
    }
  }
  return weighted;
}

function nearestControlKey(node, controlKeyByNode, visual) {
  let current = node?.parent || null;
  while (current) {
    if (controlKeyByNode.has(current)) return controlKeyByNode.get(current);
    if (current === visual) break;
    current = current.parent;
  }
  return null;
}

export function measureActorRuntimeGraph(entry, profile = "desktop") {
  const group = entry?.group;
  const visual = entry?.visual || group;
  const controls = Object.entries(entry?.controllerJoints || {})
    .filter(([, state]) => state?.node && isVisibleInGraph(state.node, group));
  const controlKeyByNode = new Map(controls.map(([key, state]) => [state.node, key]));
  const skinControlKeyByBone = new Map(
    Object.entries(entry?.skinJoints || {})
      .filter(([, state]) => state?.node)
      .map(([key, state]) => [state.node, key])
  );
  const controlPivots = {};
  const weightedBones = new Set();
  let actorDrawCalls = 0;
  let articulationBatchCount = 0;
  let drivenRigidSurfaceCount = 0;

  group?.traverse?.((node) => {
    if (!node?.isMesh || !isVisibleInGraph(node, group)) return;
    const calls = renderedDrawCalls(node);
    if (calls <= 0) return;
    actorDrawCalls += calls;
    if (node.isSkinnedMesh) {
      articulationBatchCount += calls;
      const meshBones = weightedBonesForMesh(node);
      meshBones.forEach((bone) => weightedBones.add(bone));
      const touchedControls = new Set(
        [...meshBones]
          .map((bone) => skinControlKeyByBone.get(bone))
          .filter(Boolean)
      );
      touchedControls.forEach((key) => {
        controlPivots[key] ||= {
          rigidDrawCalls: 0,
          rigidSurfaceCount: 0,
          skinnedDrawCalls: 0
        };
        controlPivots[key].skinnedDrawCalls += calls;
      });
      return;
    }
    const controlKey = nearestControlKey(node, controlKeyByNode, visual);
    if (!controlKey) return;
    controlPivots[controlKey] ||= {
      rigidDrawCalls: 0,
      rigidSurfaceCount: 0,
      skinnedDrawCalls: 0
    };
    controlPivots[controlKey].rigidDrawCalls += calls;
    controlPivots[controlKey].rigidSurfaceCount += 1;
    drivenRigidSurfaceCount += 1;
  });

  return {
    profile,
    actorDrawCalls,
    articulationBatchCount,
    drivenRigidSurfaceCount,
    skinnedArticulationBoneCount: weightedBones.size,
    mobileRemovableDetailBatches: Number(entry?.mobileRemovableDetailBatches || 0),
    controlPivots
  };
}

function finiteUnitInterval(values) {
  return values.length > 0 && values.every((value) => (
    Number.isFinite(value) && value >= 0 && value <= 1
  ));
}

export function measureActorContractState(entry) {
  const blinkValue = Number(entry?.blinkInfluence || 0);
  const eyeUniformValues = (entry?.eyeSurfaceMeshes || [])
    .map((mesh) => Number(mesh?.userData?.mirrorLifeEyeDeformation?.uniforms?.blink?.value))
    .filter(Number.isFinite);
  const blinkUniform = eyeUniformValues.length
    ? eyeUniformValues.reduce((sum, value) => sum + value, 0) / eyeUniformValues.length
    : blinkValue;

  const contact = entry?.contactConstraintState || null;
  const contactAfter = Number(contact?.after);
  const contactBefore = Number(contact?.before);
  const contactApplicable = !!contact;

  const elbowValues = Object.values(entry?.jointVolumeDeformation || {})
    .flatMap((state) => [Number(state?.leftBend), Number(state?.rightBend)]);

  const footPlant = entry?.weightTransferState || null;
  const footError = footPlant
    ? Math.max(Number(footPlant.leftUpError || 0), Number(footPlant.rightUpError || 0))
    : null;

  const clothValues = Object.values(entry?.clothCorrectives || {})
    .map((state) => Number(state?.bend));

  return {
    blink: {
      applicable: eyeUniformValues.length > 0,
      value: Number(blinkValue.toFixed(4)),
      uniform: Number(blinkUniform.toFixed(4)),
      green: eyeUniformValues.length > 0 && blinkValue >= 0.9 && blinkUniform >= 0.9
    },
    handContact: {
      applicable: contactApplicable,
      value: contactApplicable ? Number(contactAfter.toFixed(4)) : null,
      before: contactApplicable ? Number(contactBefore.toFixed(4)) : null,
      green: !contactApplicable || (
        Number(contact?.weight || 0) >= 0.9
        && Number.isFinite(contactBefore)
        && Number.isFinite(contactAfter)
        && contactAfter <= 0.01
        && contactAfter < contactBefore
      )
    },
    elbowVolume: {
      applicable: elbowValues.length > 0,
      value: elbowValues.length ? Number(Math.max(...elbowValues).toFixed(4)) : null,
      green: finiteUnitInterval(elbowValues)
    },
    footPlant: {
      applicable: !!footPlant,
      value: footError == null ? null : Number(footError.toFixed(4)),
      weight: footPlant ? Number(Number(footPlant.weight || 0).toFixed(4)) : null,
      green: !!footPlant
        && Number(footPlant.weight || 0) >= 0.9
        && Number.isFinite(footError)
        && footError <= 0.01
    },
    clothCompression: {
      applicable: clothValues.length > 0,
      value: clothValues.length ? Number(Math.max(...clothValues).toFixed(4)) : null,
      sleeve: clothValues.length
        ? Number(Math.max(
          Number(entry?.clothCorrectives?.leftSleeve?.bend || 0),
          Number(entry?.clothCorrectives?.rightSleeve?.bend || 0)
        ).toFixed(4))
        : null,
      trouser: clothValues.length
        ? Number(Math.max(
          Number(entry?.clothCorrectives?.leftTrouser?.bend || 0),
          Number(entry?.clothCorrectives?.rightTrouser?.bend || 0)
        ).toFixed(4))
        : null,
      green: finiteUnitInterval(clothValues)
    }
  };
}

function failAbove(failures, label, actual, limit) {
  if (!Number.isFinite(Number(actual)) || Number(actual) > limit) {
    failures.push(`${label} ${actual ?? "missing"} exceeds ${limit}`);
  }
}

export function evaluateReferenceFidelityV3({
  desktopStats,
  mobileStats,
  blinkStats,
  sevenAxis
} = {}) {
  const failures = [];
  const limits = REFERENCE_FIDELITY_V3;
  for (const [profile, stats] of [
    ["desktop", desktopStats],
    ["mobile", mobileStats],
    ["blink", blinkStats]
  ]) {
    const embedded = stats?.referenceFidelityContract;
    if (!Object.entries(limits).every(([key, value]) => embedded?.[key] === value)) {
      failures.push(`${profile} capture embedded v3 contract is missing or stale`);
    }
  }
  failAbove(
    failures,
    "opening actors draw call",
    desktopStats?.drawCallsByLayer?.actors,
    limits.openingActorDrawCalls
  );
  failAbove(failures, "opening total draw call", desktopStats?.drawCalls, limits.openingDrawCalls);
  failAbove(failures, "mobile draw call", mobileStats?.drawCalls, limits.mobileDrawCalls);
  failAbove(failures, "mobile triangles", mobileStats?.triangles, limits.mobileTriangles);

  const actors = Object.entries(desktopStats?.actorArticulationBreakdown || {});
  if (!actors.length) failures.push("desktop actor articulation breakdown is missing");
  actors.forEach(([actorId, actor]) => {
    failAbove(
      failures,
      `${actorId} desktop articulation batch`,
      actor?.articulationBatchCount,
      limits.desktopArticulationBatchesPerActor
    );
    if (Number(actor?.drivenRigidSurfaceCount) !== limits.drivenRigidSurfacesPerActor) {
      failures.push(
        `${actorId} driven rigid articulation surface ${actor?.drivenRigidSurfaceCount ?? "missing"}`
        + ` must equal ${limits.drivenRigidSurfacesPerActor}`
      );
    }
    if (
      !Number.isFinite(Number(actor?.skinnedArticulationBoneCount))
      || Number(actor.skinnedArticulationBoneCount) < limits.skinnedArticulationBonesPerActor
    ) {
      failures.push(
        `${actorId} skinned articulation bone count ${actor?.skinnedArticulationBoneCount ?? "missing"}`
        + ` is below ${limits.skinnedArticulationBonesPerActor}`
      );
    }
  });

  const desktopStates = Object.entries(desktopStats?.actorContractStates || {});
  for (const metric of ["handContact", "elbowVolume", "footPlant", "clothCompression"]) {
    const applicable = desktopStates.filter(([, state]) => state?.[metric]?.applicable);
    if (!applicable.length) failures.push(`${metric} numeric runtime state is missing`);
    applicable.forEach(([actorId, state]) => {
      if (state[metric].green !== true) failures.push(`${actorId} ${metric} state is red`);
    });
  }

  const blinkStates = Object.entries(blinkStats?.actorContractStates || {});
  if (!blinkStates.length) failures.push("forced-blink numeric runtime state is missing");
  blinkStates.forEach(([actorId, state]) => {
    if (state?.blink?.green !== true) failures.push(`${actorId} blink state is red`);
  });

  if (
    Number(sevenAxis?.total) !== limits.sevenAxisTotal
    || !Number.isFinite(Number(sevenAxis?.within))
    || Number(sevenAxis.within) < limits.sevenAxisBaseline
  ) {
    failures.push(
      `seven-axis result ${sevenAxis?.within ?? "missing"}/${sevenAxis?.total ?? "missing"}`
      + ` is below isolated recapture baseline ${limits.sevenAxisBaseline}/${limits.sevenAxisTotal}`
    );
  }

  return { pass: failures.length === 0, failures };
}
