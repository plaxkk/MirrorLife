export const CIVIC_ARTICULATION_BINDING_SPECS = Object.freeze([
  { controlKey: "leftArm", boneKey: "leftArm", boneName: "SkinLeftArm" },
  { controlKey: "leftElbow", boneKey: "leftElbow", boneName: "SkinLeftElbow" },
  { controlKey: "rightArm", boneKey: "rightArm", boneName: "SkinRightArm" },
  { controlKey: "rightElbow", boneKey: "rightElbow", boneName: "SkinRightElbow" },
  { controlKey: "leftLeg", boneKey: "leftLeg", boneName: "SkinLeftLeg" },
  { controlKey: "leftKnee", boneKey: "leftKnee", boneName: "SkinLeftKnee" },
  { controlKey: "rightLeg", boneKey: "rightLeg", boneName: "SkinRightLeg" },
  { controlKey: "rightKnee", boneKey: "rightKnee", boneName: "SkinRightKnee" },
  { controlKey: "leftElbow", boneKey: "leftElbowRigid", boneName: "SkinLeftElbowRigid" },
  { controlKey: "rightElbow", boneKey: "rightElbowRigid", boneName: "SkinRightElbowRigid" },
  { controlKey: "leftKnee", boneKey: "leftKneeRigid", boneName: "SkinLeftKneeRigid" },
  { controlKey: "rightKnee", boneKey: "rightKneeRigid", boneName: "SkinRightKneeRigid" },
  { controlKey: "leftHand", boneKey: "leftHand", boneName: "SkinLeftHand" },
  { controlKey: "rightHand", boneKey: "rightHand", boneName: "SkinRightHand" },
  {
    controlKey: "leftSleeveCompression",
    boneKey: "leftSleeveCompression",
    boneName: "SkinLeftSleeveCorrective"
  },
  {
    controlKey: "rightSleeveCompression",
    boneKey: "rightSleeveCompression",
    boneName: "SkinRightSleeveCorrective"
  },
  {
    controlKey: "leftTrouserCompression",
    boneKey: "leftTrouserCompression",
    boneName: "SkinLeftTrouserCorrective"
  },
  {
    controlKey: "rightTrouserCompression",
    boneKey: "rightTrouserCompression",
    boneName: "SkinRightTrouserCorrective"
  },
  { controlKey: "leftFoot", boneKey: "leftFoot", boneName: "SkinLeftFoot" },
  { controlKey: "rightFoot", boneKey: "rightFoot", boneName: "SkinRightFoot" }
].map((binding) => Object.freeze(binding)));

export const REFERENCE_FIDELITY_V3 = Object.freeze({
  version: "mirrorlife-reference-fidelity-v3",
  openingActorRoles: Object.freeze(["player", "listener", "facilitator", "mediator"]),
  mobileActorRoles: Object.freeze(["player", "listener", "facilitator"]),
  openingActorDrawCalls: 55,
  openingDrawCalls: 145,
  desktopArticulationBatchesPerActor: 2,
  drivenRigidSurfacesPerActor: 0,
  skinnedArticulationBonesPerActor: 12,
  mobileArticulationBatchesPerActor: 1,
  mobileSkinnedArticulationBonesPerActor: 16,
  mobileCoreArticulationBatchIdentity: "SkinnedArticulationCore",
  mobileDetailArticulationBatchIdentity: "SkinnedArticulationDetail",
  mobileDrawCalls: 110,
  mobileTriangles: 250000,
  sevenAxisBaseline: 4,
  sevenAxisTotal: 7
});

export function createCivicArticulationBinding({
  controlKey,
  boneKey,
  controller,
  bone
} = {}) {
  if (!controlKey || !boneKey || !controller || !bone?.parent) return null;
  controller.updateWorldMatrix?.(true, false);
  bone.parent.updateWorldMatrix?.(true, false);
  bone.updateMatrix?.();
  const controllerRelative = bone.parent.matrixWorld.clone()
    .invert()
    .multiply(controller.matrixWorld);
  return {
    controlKey,
    boneKey,
    controller,
    bone,
    controllerToBoneRest: controllerRelative
      .clone()
      .invert()
      .multiply(bone.matrix.clone())
  };
}

export function isCivicArticulationBindingSynchronizable(binding) {
  return !!(
    binding?.controlKey
    && binding?.boneKey
    && binding?.controller
    && binding?.bone?.parent
    && binding?.controllerToBoneRest?.isMatrix4
  );
}

export function syncCivicArticulationBinding(binding) {
  const {
    controller,
    bone,
    controllerToBoneRest
  } = binding || {};
  if (!isCivicArticulationBindingSynchronizable(binding)) return false;
  controller.updateWorldMatrix?.(true, false);
  bone.parent.updateWorldMatrix?.(true, false);
  const relativeMatrix = bone.parent.matrixWorld.clone()
    .invert()
    .multiply(controller.matrixWorld)
    .multiply(controllerToBoneRest);
  relativeMatrix.decompose(bone.position, bone.quaternion, bone.scale);
  bone.updateMatrix?.();
  bone.updateMatrixWorld?.(true);
  return true;
}

function isVisibleInGraph(node, root) {
  let current = node;
  while (current) {
    if (current.visible === false) return false;
    if (current === root) return true;
    current = current.parent;
  }
  return false;
}

function isAttachedInGraph(node, root) {
  let current = node;
  while (current) {
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

const weightedBonesByMesh = new WeakMap();

function weightedBonesForMesh(mesh) {
  const cached = weightedBonesByMesh.get(mesh);
  if (
    cached
    && cached.geometry === mesh?.geometry
    && cached.skeleton === mesh?.skeleton
  ) {
    return cached.weighted;
  }
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
  weightedBonesByMesh.set(mesh, {
    geometry: mesh.geometry,
    skeleton: mesh.skeleton,
    weighted
  });
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
  const activeBindings = (entry?.articulationBindings || [])
    .filter((binding) => (
      isCivicArticulationBindingSynchronizable(binding)
      && isVisibleInGraph(binding.controller, group)
    ));
  const controlKeyByNode = new Map(
    activeBindings.map((binding) => [binding.controller, binding.controlKey])
  );
  const skinControlKeyByBone = new Map(
    activeBindings.map((binding) => [binding.bone, binding.controlKey])
  );
  const controlPivots = {};
  const weightedBones = new Set();
  const articulationCore = entry?.articulationSkinBatches?.core || null;
  const articulationDetail = entry?.articulationSkinBatches?.detail || null;
  let actorDrawCalls = 0;
  let articulationBatchCount = 0;
  let drivenRigidSurfaceCount = 0;
  let renderedCoreBatchCount = 0;
  let renderedDetailBatchCount = 0;

  group?.traverse?.((node) => {
    if (!node?.isMesh || !isVisibleInGraph(node, group)) return;
    const calls = renderedDrawCalls(node);
    if (calls <= 0) return;
    actorDrawCalls += calls;
    if (node.isSkinnedMesh) {
      const meshBones = weightedBonesForMesh(node);
      const touchedControls = new Set(
        [...meshBones]
          .map((bone) => skinControlKeyByBone.get(bone))
          .filter(Boolean)
      );
      if (!touchedControls.size) return;
      articulationBatchCount += calls;
      if (node === articulationCore) renderedCoreBatchCount += calls;
      if (node === articulationDetail) renderedDetailBatchCount += calls;
      meshBones.forEach((bone) => {
        if (skinControlKeyByBone.has(bone)) weightedBones.add(bone);
      });
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

  const coreBones = articulationCore?.skeleton?.bones || [];
  const detailBones = articulationDetail?.skeleton?.bones || [];
  const detailSharesCoreSkeleton = coreBones.length > 0
    && detailBones.length === coreBones.length
    && detailBones.every((bone, index) => bone === coreBones[index]);
  const detailVisible = !!articulationDetail
    && isVisibleInGraph(articulationDetail, group);
  const detailRemoved = !!articulationDetail
    && !isAttachedInGraph(articulationDetail, group);
  const detailIdentityValid = articulationDetail?.isSkinnedMesh
    && articulationDetail.name === "SkinnedArticulationDetail"
    && articulationDetail.userData?.articulation_batch === "detail"
    && detailSharesCoreSkeleton;
  const removedDetailBatchCount = profile === "mobile"
    && detailRemoved
    && detailIdentityValid
    ? 1
    : 0;

  return {
    profile,
    actorDrawCalls,
    articulationBatchCount,
    drivenRigidSurfaceCount,
    skinnedArticulationBoneCount: weightedBones.size,
    mobileRemovableDetailBatches: removedDetailBatchCount,
    mobileArticulationStructure: {
      coreIdentity: articulationCore?.name || null,
      coreBatchCount: renderedCoreBatchCount,
      detailIdentity: articulationDetail?.name || null,
      detailSemantic: articulationDetail?.userData?.articulation_batch || null,
      detailSharesCoreSkeleton,
      detailVisible,
      detailRemoved,
      removedDetailBatchCount,
      renderedDetailBatchCount
    },
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

  const elbowCorrection = (state, controller) => {
    if (!state?.node || !state?.restScale) return null;
    let current = state.node;
    let attachedToController = false;
    while (current) {
      if (current === controller) {
        attachedToController = true;
        break;
      }
      current = current.parent;
    }
    const surfaceNodes = state.surfaceNodes?.filter(Boolean)?.length
      ? state.surfaceNodes.filter(Boolean)
      : [state.node];
    const visibleSurfaceNodes = surfaceNodes.filter((surfaceNode) => (
      isVisibleInGraph(surfaceNode, entry?.group)
    ));
    let visibleSurfaceCount = 0;
    visibleSurfaceNodes.forEach((surfaceNode) => {
      surfaceNode.traverseVisible?.((node) => {
        if (node.isMesh && node.geometry && node.material) visibleSurfaceCount += 1;
      });
    });
    const surfaceWeighted = !state.surfaceBone || visibleSurfaceNodes.some((surfaceNode) => {
      let carriesBone = false;
      surfaceNode.traverseVisible?.((node) => {
        if (node.isSkinnedMesh && weightedBonesForMesh(node).has(state.surfaceBone)) {
          carriesBone = true;
        }
      });
      return carriesBone;
    });
    const safeRatio = (axis) => Number(state.node.scale?.[axis] || 0)
      / Math.max(1e-8, Number(state.restScale?.[axis] || 0));
    const widthRatio = safeRatio("x");
    const depthRatio = safeRatio("y");
    const lengthRatio = safeRatio("z");
    const volumeRatio = widthRatio * depthRatio * lengthRatio;
    const bend = Number(state.bend);
    return {
      bend,
      widthRatio,
      depthRatio,
      lengthRatio,
      volumeRatio,
      visibleSurfaceCount,
      surfaceWeighted,
      attachedToController,
      green: Number.isFinite(bend)
        && bend > Number(state.activationThreshold || 0)
        && attachedToController
        && state.node.visible !== false
        && visibleSurfaceCount > 0
        && surfaceWeighted
        && widthRatio > 1.001
        && depthRatio > 1.001
        && lengthRatio < 0.999
        && volumeRatio > 1.001
    };
  };
  const leftElbowVolume = elbowCorrection(
    entry?.clothCorrectives?.leftSleeve,
    entry?.leftElbow
  );
  const rightElbowVolume = elbowCorrection(
    entry?.clothCorrectives?.rightSleeve,
    entry?.rightElbow
  );

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
      applicable: !!leftElbowVolume && !!rightElbowVolume,
      value: leftElbowVolume && rightElbowVolume
        ? Number(Math.min(leftElbowVolume.volumeRatio, rightElbowVolume.volumeRatio).toFixed(4))
        : null,
      left: leftElbowVolume,
      right: rightElbowVolume,
      green: !!leftElbowVolume?.green && !!rightElbowVolume?.green
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
  const buildFingerprints = [
    desktopStats?.buildFingerprint,
    mobileStats?.buildFingerprint,
    blinkStats?.buildFingerprint,
    sevenAxis?.buildFingerprint
  ];
  const contentFingerprint = /^sha256:[a-f0-9]{64}$/;
  if (
    buildFingerprints.some((fingerprint) => (
      typeof fingerprint !== "string" || !contentFingerprint.test(fingerprint)
    ))
    || new Set(buildFingerprints).size !== 1
  ) {
    failures.push(
      `artifact build fingerprint mismatch: ${buildFingerprints
        .map((fingerprint) => fingerprint || "missing")
        .join(" / ")}`
    );
  }
  for (const [profile, stats] of [
    ["desktop", desktopStats],
    ["mobile", mobileStats],
    ["blink", blinkStats]
  ]) {
    const embedded = stats?.referenceFidelityContract;
    if (!Object.entries(limits).every(([key, value]) => (
      JSON.stringify(embedded?.[key]) === JSON.stringify(value)
    ))) {
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

  const requiredActors = (stats, profile, requiredRoles) => {
    const actorEntries = Object.entries(stats?.actorArticulationBreakdown || {});
    const byRole = new Map();
    for (const role of requiredRoles) {
      const matches = actorEntries.filter(([, actor]) => actor?.assetRole === role);
      if (matches.length !== 1) {
        failures.push(
          `${profile} required role ${role} has ${matches.length} runtime actors; expected exactly 1`
        );
      } else {
        byRole.set(role, matches[0]);
      }
    }
    const unexpected = actorEntries.filter(([, actor]) => (
      !requiredRoles.includes(actor?.assetRole)
    ));
    if (unexpected.length) {
      failures.push(
        `${profile} has unexpected runtime actor roles: `
        + unexpected.map(([, actor]) => actor?.assetRole || "missing").join(", ")
      );
    }
    return byRole;
  };
  const desktopActors = requiredActors(desktopStats, "desktop", limits.openingActorRoles);
  const mobileActors = requiredActors(mobileStats, "mobile", limits.mobileActorRoles);
  const blinkActors = requiredActors(blinkStats, "blink", limits.openingActorRoles);
  for (const [role, [, actor]] of desktopActors) {
    failAbove(
      failures,
      `${role} desktop articulation batch`,
      actor?.articulationBatchCount,
      limits.desktopArticulationBatchesPerActor
    );
    if (Number(actor?.drivenRigidSurfaceCount) !== limits.drivenRigidSurfacesPerActor) {
      failures.push(
        `${role} driven rigid articulation surface ${actor?.drivenRigidSurfaceCount ?? "missing"}`
        + ` must equal ${limits.drivenRigidSurfacesPerActor}`
      );
    }
    if (
      !Number.isFinite(Number(actor?.skinnedArticulationBoneCount))
      || Number(actor.skinnedArticulationBoneCount) < limits.skinnedArticulationBonesPerActor
    ) {
      failures.push(
        `${role} skinned articulation bone count ${actor?.skinnedArticulationBoneCount ?? "missing"}`
        + ` is below ${limits.skinnedArticulationBonesPerActor}`
      );
    }
  }
  for (const [role, [, actor]] of mobileActors) {
    if (Number(actor?.articulationBatchCount) !== limits.mobileArticulationBatchesPerActor) {
      failures.push(
        `${role} mobile articulation batch ${actor?.articulationBatchCount ?? "missing"}`
        + ` must equal ${limits.mobileArticulationBatchesPerActor}`
      );
    }
    if (
      Number(actor?.skinnedArticulationBoneCount)
      !== limits.mobileSkinnedArticulationBonesPerActor
    ) {
      failures.push(
        `${role} mobile weighted articulation bone count`
        + ` ${actor?.skinnedArticulationBoneCount ?? "missing"}`
        + ` must equal ${limits.mobileSkinnedArticulationBonesPerActor}`
      );
    }
    const structure = actor?.mobileArticulationStructure;
    if (
      structure?.coreIdentity !== limits.mobileCoreArticulationBatchIdentity
      || Number(structure?.coreBatchCount) !== limits.mobileArticulationBatchesPerActor
    ) {
      failures.push(
        `${role} mobile core articulation batch identity/count is invalid`
      );
    }
    if (structure?.detailIdentity !== limits.mobileDetailArticulationBatchIdentity) {
      failures.push(
        `${role} mobile detail identity ${structure?.detailIdentity ?? "missing"}`
        + ` must equal ${limits.mobileDetailArticulationBatchIdentity}`
      );
    }
    if (
      structure?.detailSemantic !== "detail"
      || structure?.detailSharesCoreSkeleton !== true
    ) {
      failures.push(`${role} mobile detail batch is not tied to the loaded articulation skin`);
    }
    if (
      structure?.detailRemoved !== true
      || structure?.detailVisible !== false
      || Number(structure?.removedDetailBatchCount) !== 1
      || Number(structure?.renderedDetailBatchCount) !== 0
    ) {
      failures.push(`${role} mobile removed detail batch state is invalid`);
    }
  }

  const desktopStates = desktopStats?.actorContractStates || {};
  for (const [role, [actorId]] of desktopActors) {
    for (const metric of ["handContact", "elbowVolume", "footPlant", "clothCompression"]) {
      const state = desktopStates?.[actorId]?.[metric];
      if (!state) {
        failures.push(`${role} ${metric} numeric runtime state is missing`);
        continue;
      }
      const mustApply = metric !== "handContact"
        || role === "facilitator"
        || role === "mediator";
      if (mustApply && state.applicable !== true) {
        failures.push(`${role} ${metric} numeric runtime state is not applicable`);
      }
      if (state.green !== true) failures.push(`${role} ${metric} state is red`);
    }
  }

  const blinkStates = blinkStats?.actorContractStates || {};
  for (const [role, [actorId]] of blinkActors) {
    const state = blinkStates?.[actorId]?.blink;
    if (!state) {
      failures.push(`${role} blink numeric runtime state is missing`);
      continue;
    }
    if (state.applicable !== true) failures.push(`${role} blink state is not applicable`);
    if (state.green !== true) failures.push(`${role} blink state is red`);
  }

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
