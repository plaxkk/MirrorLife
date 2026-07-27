#!/usr/bin/env node
import assert from "node:assert/strict";
import path from "node:path";
import * as THREE from "three";
import { readGlbGeometry } from "./lib/glb-geometry.mjs";

let runtimeContract = null;
try {
  runtimeContract = await import("../src/reference-fidelity-runtime-contract.js");
} catch {
  // The first TDD run deliberately reaches this assertion before the runtime
  // measurement module exists.
}

assert(runtimeContract, "runtime reference-fidelity contract module is missing");
const {
  CIVIC_ARTICULATION_BINDING_SPECS,
  REFERENCE_FIDELITY_V3,
  createCivicArticulationBinding,
  evaluateReferenceFidelityV3,
  isCivicArticulationBindingSynchronizable,
  measureActorContractState,
  measureActorRuntimeGraph,
  syncCivicArticulationBinding
} = runtimeContract;
assert.equal(
  CIVIC_ARTICULATION_BINDING_SPECS?.length,
  20,
  "canonical civic articulation binding roster must cover all weighted bones"
);
assert.equal(
  new Set(CIVIC_ARTICULATION_BINDING_SPECS?.map(({ boneKey }) => boneKey)).size,
  20,
  "canonical civic articulation bone keys must be unique"
);
assert(
  CIVIC_ARTICULATION_BINDING_SPECS?.every(({ controlKey, boneKey, boneName }) => (
    controlKey && boneKey && boneName
  )),
  "canonical civic articulation binding metadata is incomplete"
);
assert.equal(
  typeof createCivicArticulationBinding,
  "function",
  "canonical civic articulation binding factory is missing"
);
assert.equal(
  typeof syncCivicArticulationBinding,
  "function",
  "canonical civic articulation binding synchronizer is missing"
);
assert.equal(
  typeof isCivicArticulationBindingSynchronizable,
  "function",
  "shared civic articulation synchronizability predicate is missing"
);

// Break caught: every shipped desktop role must carry at least twelve real
// positive-weight articulation bones while remaining in the two-batch
// core/detail skin budget. Manifest declarations do not satisfy this gate.
for (const role of REFERENCE_FIDELITY_V3.openingActorRoles) {
  const glb = readGlbGeometry(
    path.resolve(`public/assets/characters/civic/${role}.glb`)
  );
  assert(
    glb.weightedSkinBoneCount >= REFERENCE_FIDELITY_V3.skinnedArticulationBonesPerActor,
    `${role}: ${glb.weightedSkinBoneCount} positive-weight skin bones is below `
      + REFERENCE_FIDELITY_V3.skinnedArticulationBonesPerActor
  );
  assert.equal(
    glb.skinnedPrimitiveBatches,
    REFERENCE_FIDELITY_V3.desktopArticulationBatchesPerActor,
    `${role}: shipped skin batches exceed the desktop articulation budget`
  );
}

const assertMatrixNear = (actual, expected, label) => {
  actual.elements.forEach((value, index) => {
    assert(
      Math.abs(value - expected.elements[index]) <= 1e-6,
      `${label}: matrix element ${index} differs (${value} vs ${expected.elements[index]})`
    );
  });
};

// Break caught: synchronization and measurement must consume the same
// explicit controller→bone binding, including its authored rest offset.
{
  const visual = new THREE.Group();
  visual.position.set(0.4, -0.2, 0.7);
  visual.rotation.set(0.08, -0.16, 0.04);
  const controllerParent = new THREE.Group();
  const controller = new THREE.Group();
  controllerParent.position.set(0.2, 0.3, -0.1);
  controller.position.set(-0.15, 0.25, 0.32);
  controller.rotation.set(0.12, -0.08, 0.19);
  controller.scale.set(1.04, 0.97, 1.02);
  controllerParent.add(controller);
  visual.add(controllerParent);

  const boneParent = new THREE.Bone();
  const bone = new THREE.Bone();
  boneParent.position.set(-0.3, 0.1, 0.2);
  bone.position.set(0.06, 0.44, -0.18);
  bone.rotation.set(-0.05, 0.14, -0.09);
  boneParent.add(bone);
  visual.add(boneParent);
  visual.updateMatrixWorld(true);

  const binding = createCivicArticulationBinding({
    controlKey: "leftArm",
    boneKey: "leftArm",
    controller,
    bone
  });
  assert.equal(binding.controlKey, "leftArm");
  assert.equal(binding.boneKey, "leftArm");
  assert(binding.controllerToBoneRest?.isMatrix4, "binding rest offset is missing");
  const restLocal = bone.matrix.clone();
  syncCivicArticulationBinding(binding);
  assertMatrixNear(bone.matrix, restLocal, "rest-pose synchronization");

  controller.position.add(new THREE.Vector3(0.13, -0.04, 0.09));
  controller.rotation.z += 0.23;
  visual.updateMatrixWorld(true);
  const expectedLocal = bone.parent.matrixWorld.clone()
    .invert()
    .multiply(controller.matrixWorld)
    .multiply(binding.controllerToBoneRest);
  syncCivicArticulationBinding(binding);
  assertMatrixNear(bone.matrix, expectedLocal, "controller-driven synchronization");
}

// Break caught: a visible rigid surface beneath a driven controller must not
// disappear from the articulation count, while hidden surfaces must not leak
// into it and weighted bones must come from real skin attributes.
{
  const actor = new THREE.Group();
  const visual = new THREE.Group();
  actor.add(visual);

  const staticSurface = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial()
  );
  visual.add(staticSurface);

  const leftArm = new THREE.Group();
  visual.add(leftArm);
  leftArm.add(new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.6, 0.2),
    new THREE.MeshBasicMaterial()
  ));

  const rightArm = new THREE.Group();
  rightArm.visible = false;
  visual.add(rightArm);
  rightArm.add(new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.6, 0.2),
    new THREE.MeshBasicMaterial()
  ));

  // Facial and secondary controls are animated, but they are not mapped
  // articulation controls. Their rigid expression surfaces still contribute
  // actor draw calls without polluting the limb-articulation gate.
  const headGroup = new THREE.Group();
  visual.add(headGroup);
  headGroup.add(new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.3, 0.3),
    new THREE.MeshBasicMaterial()
  ));

  const skinnedGeometry = new THREE.BufferGeometry();
  skinnedGeometry.setAttribute("position", new THREE.Float32BufferAttribute([
    0, 0, 0,
    1, 0, 0,
    0, 1, 0
  ], 3));
  skinnedGeometry.setAttribute("skinIndex", new THREE.Uint16BufferAttribute([
    0, 1, 0, 0,
    1, 0, 0, 0,
    0, 1, 0, 0
  ], 4));
  skinnedGeometry.setAttribute("skinWeight", new THREE.Float32BufferAttribute([
    0.75, 0.25, 0, 0,
    1, 0, 0, 0,
    0.5, 0.5, 0, 0
  ], 4));
  const bones = [new THREE.Bone(), new THREE.Bone()];
  bones[0].add(bones[1]);
  const skinnedSurface = new THREE.SkinnedMesh(
    skinnedGeometry,
    new THREE.MeshBasicMaterial()
  );
  skinnedSurface.add(bones[0]);
  skinnedSurface.bind(new THREE.Skeleton(bones));
  visual.add(skinnedSurface);
  visual.updateMatrixWorld(true);
  const leftArmBinding = createCivicArticulationBinding({
    controlKey: "leftArm",
    boneKey: "leftArm",
    controller: leftArm,
    bone: bones[0]
  });

  const graphEntry = {
    group: actor,
    visual,
    articulationBindings: [leftArmBinding],
    // Deliberately retain same-key independent maps. Measurement must ignore
    // them and consume only the binding that the synchronizer executes.
    controllerJoints: {
      leftArm: { node: leftArm },
      rightArm: { node: rightArm },
      headGroup: { node: headGroup }
    },
    skinJoints: {
      leftArm: { node: bones[0] }
    },
    mobileRemovableDetailBatches: 2
  };
  const measured = measureActorRuntimeGraph(graphEntry, "desktop");

  assert.equal(measured.actorDrawCalls, 4);
  assert.equal(measured.articulationBatchCount, 1);
  assert.equal(measured.drivenRigidSurfaceCount, 1);
  assert.equal(measured.skinnedArticulationBoneCount, 1);
  assert.equal(
    measured.mobileRemovableDetailBatches,
    0,
    "desktop fixture accepted a fabricated removable-detail count"
  );
  assert.deepEqual(measured.controlPivots.leftArm, {
    rigidDrawCalls: 1,
    rigidSurfaceCount: 1,
    skinnedDrawCalls: 1
  });
  assert(!("rightArm" in measured.controlPivots));
  assert(!("headGroup" in measured.controlPivots));

  const unbound = measureActorRuntimeGraph({
    ...graphEntry,
    articulationBindings: []
  }, "desktop");
  assert.equal(
    unbound.skinnedArticulationBoneCount,
    0,
    "unbound same-key controller/bone pair counted as synchronized"
  );
  assert.equal(unbound.drivenRigidSurfaceCount, 0);

  const brokenBinding = measureActorRuntimeGraph({
    ...graphEntry,
    articulationBindings: [{
      ...leftArmBinding,
      controllerToBoneRest: null
    }]
  }, "desktop");
  assert.equal(
    brokenBinding.skinnedArticulationBoneCount,
    0,
    "binding without its rest offset still satisfied the articulation gate"
  );

  bones[0].removeFromParent();
  assert.equal(isCivicArticulationBindingSynchronizable(leftArmBinding), false);
  const detachedBone = measureActorRuntimeGraph(graphEntry, "desktop");
  assert.equal(
    detachedBone.skinnedArticulationBoneCount,
    0,
    "detached skeleton bone counted despite being unsynchronizable"
  );
  assert.equal(
    detachedBone.drivenRigidSurfaceCount,
    0,
    "detached skeleton bone left its controller eligible for rigid surfaces"
  );
}

// Break caught: mobile structure is measured from the loaded core/detail
// SkinnedMesh references after the detail node is actually removed.
{
  const actor = new THREE.Group();
  const visual = new THREE.Group();
  const skinRig = new THREE.Group();
  actor.add(visual);
  visual.add(skinRig);
  const bones = Array.from({ length: 16 }, (_, index) => {
    const bone = new THREE.Bone();
    bone.name = `BoundBone${index}`;
    return bone;
  });
  bones.slice(1).forEach((bone) => bones[0].add(bone));
  const skeleton = new THREE.Skeleton(bones);
  const weightedGeometry = new THREE.BufferGeometry();
  weightedGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(
      bones.flatMap((_, index) => [index * 0.01, 0, 0]),
      3
    )
  );
  weightedGeometry.setAttribute(
    "skinIndex",
    new THREE.Uint16BufferAttribute(
      bones.flatMap((_, index) => [index, 0, 0, 0]),
      4
    )
  );
  weightedGeometry.setAttribute(
    "skinWeight",
    new THREE.Float32BufferAttribute(bones.flatMap(() => [1, 0, 0, 0]), 4)
  );
  const core = new THREE.SkinnedMesh(
    weightedGeometry,
    new THREE.MeshBasicMaterial()
  );
  core.name = "SkinnedArticulationCore";
  core.userData.articulation_batch = "core";
  core.add(bones[0]);
  core.bind(skeleton);
  skinRig.add(core);
  const detail = new THREE.SkinnedMesh(
    weightedGeometry.clone(),
    new THREE.MeshBasicMaterial()
  );
  detail.name = "SkinnedArticulationDetail";
  detail.userData.articulation_batch = "detail";
  detail.bind(skeleton);
  skinRig.add(detail);

  const controllers = bones.map((_, index) => {
    const controller = new THREE.Group();
    controller.name = `BoundController${index}`;
    visual.add(controller);
    return controller;
  });
  visual.updateMatrixWorld(true);
  const articulationBindings = bones.map((bone, index) => (
    createCivicArticulationBinding({
      controlKey: `control${index}`,
      boneKey: `bone${index}`,
      controller: controllers[index],
      bone
    })
  ));
  detail.removeFromParent();
  const measured = measureActorRuntimeGraph({
    group: actor,
    visual,
    articulationBindings,
    articulationSkinBatches: { core, detail }
  }, "mobile");
  assert.equal(measured.articulationBatchCount, 1);
  assert.equal(measured.skinnedArticulationBoneCount, 16);
  assert.deepEqual(measured.mobileArticulationStructure, {
    coreIdentity: "SkinnedArticulationCore",
    coreBatchCount: 1,
    detailIdentity: "SkinnedArticulationDetail",
    detailSemantic: "detail",
    detailSharesCoreSkeleton: true,
    detailVisible: false,
    detailRemoved: true,
    removedDetailBatchCount: 1,
    renderedDetailBatchCount: 0
  });

  skinRig.add(detail);
  detail.visible = false;
  const hiddenAttached = measureActorRuntimeGraph({
    group: actor,
    visual,
    articulationBindings,
    articulationSkinBatches: { core, detail }
  }, "mobile");
  assert.equal(
    hiddenAttached.mobileArticulationStructure.detailRemoved,
    false,
    "attached but hidden detail was misreported as removed"
  );
  assert.equal(hiddenAttached.mobileArticulationStructure.detailVisible, false);
  assert.equal(hiddenAttached.mobileArticulationStructure.renderedDetailBatchCount, 0);
  assert.equal(hiddenAttached.mobileArticulationStructure.removedDetailBatchCount, 0);
}

// Break caught: elbow-volume health must observe a visible corrective surface
// changing volume at each elbow. A clamped shoulder/hip scalar or a no-op
// corrective transform must not report green.
{
  const corrective = () => {
    const node = new THREE.Group();
    node.add(new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.1, 0.1),
      new THREE.MeshBasicMaterial()
    ));
    node.scale.set(1.16, 1.22, 0.94);
    return {
      node,
      restScale: new THREE.Vector3(1, 1, 1),
      bend: 1,
      activationThreshold: 0.035
    };
  };
  const leftSleeve = corrective();
  const rightSleeve = corrective();
  const group = new THREE.Group();
  const leftElbow = new THREE.Group();
  const rightElbow = new THREE.Group();
  group.add(leftElbow, rightElbow);
  leftElbow.add(leftSleeve.node);
  rightElbow.add(rightSleeve.node);
  const entry = {
    group,
    leftElbow,
    rightElbow,
    clothCorrectives: { leftSleeve, rightSleeve }
  };
  const active = measureActorContractState(entry);
  assert.equal(active.elbowVolume.green, true);
  assert(active.elbowVolume.left.volumeRatio > 1);
  assert(active.elbowVolume.right.visibleSurfaceCount > 0);

  rightSleeve.node.scale.copy(rightSleeve.restScale);
  const noOp = measureActorContractState(entry);
  assert.equal(noOp.elbowVolume.green, false);

  rightSleeve.node.scale.set(1.16, 1.22, 0.94);
  rightElbow.remove(rightSleeve.node);
  const disconnected = measureActorContractState(entry);
  assert.equal(disconnected.elbowVolume.green, false);
}

const greenState = {
  blink: { applicable: true, value: 1, green: true },
  handContact: { applicable: true, value: 0, green: true },
  elbowVolume: { applicable: true, value: 0.3, green: true },
  footPlant: { applicable: true, value: 0, green: true },
  clothCompression: { applicable: true, value: 0.2, green: true }
};
const passingActor = {
  actorDrawCalls: 13,
  articulationBatchCount: 2,
  drivenRigidSurfaceCount: 0,
  skinnedArticulationBoneCount: 12
};
const passingMobileActor = {
  ...passingActor,
  actorDrawCalls: 10,
  articulationBatchCount: 1,
  skinnedArticulationBoneCount: 16,
  mobileArticulationStructure: {
    coreIdentity: "SkinnedArticulationCore",
    coreBatchCount: 1,
    detailIdentity: "SkinnedArticulationDetail",
    detailSemantic: "detail",
    detailSharesCoreSkeleton: true,
    detailVisible: false,
    detailRemoved: true,
    removedDetailBatchCount: 1,
    renderedDetailBatchCount: 0
  }
};
const BUILD_FINGERPRINT_A =
  "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const BUILD_FINGERPRINT_B =
  "sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
const passingInput = {
  desktopStats: {
    buildFingerprint: BUILD_FINGERPRINT_A,
    referenceFidelityContract: REFERENCE_FIDELITY_V3,
    drawCalls: 145,
    triangles: 320000,
    drawCallsByLayer: { actors: 55 },
    actorArticulationBreakdown: {
      player: { ...passingActor, assetRole: "player" },
      listener: { ...passingActor, assetRole: "listener" },
      facilitator: { ...passingActor, assetRole: "facilitator" },
      mediator: { ...passingActor, assetRole: "mediator" }
    },
    actorContractStates: {
      player: greenState,
      listener: greenState,
      facilitator: greenState,
      mediator: greenState
    }
  },
  mobileStats: {
    buildFingerprint: BUILD_FINGERPRINT_A,
    referenceFidelityContract: REFERENCE_FIDELITY_V3,
    drawCalls: 110,
    triangles: 250000,
    actorArticulationBreakdown: {
      player: { ...passingMobileActor, assetRole: "player" },
      listener: { ...passingMobileActor, assetRole: "listener" },
      facilitator: { ...passingMobileActor, assetRole: "facilitator" }
    }
  },
  blinkStats: {
    buildFingerprint: BUILD_FINGERPRINT_A,
    referenceFidelityContract: REFERENCE_FIDELITY_V3,
    actorArticulationBreakdown: {
      player: { ...passingActor, assetRole: "player" },
      listener: { ...passingActor, assetRole: "listener" },
      facilitator: { ...passingActor, assetRole: "facilitator" },
      mediator: { ...passingActor, assetRole: "mediator" }
    },
    actorContractStates: {
      player: greenState,
      listener: greenState,
      facilitator: greenState,
      mediator: greenState
    }
  },
  sevenAxis: { buildFingerprint: BUILD_FINGERPRINT_A, within: 4, total: 7 }
};

// Break caught: every v3 boundary is inclusive and the isolated seven-axis
// recapture baseline is 4/7, not the unreproducible historical 5/7.
{
  const result = evaluateReferenceFidelityV3(passingInput);
  assert.equal(result.pass, true);
  assert.deepEqual(result.failures, []);
  assert.equal(REFERENCE_FIDELITY_V3.openingActorDrawCalls, 55);
  assert.equal(REFERENCE_FIDELITY_V3.openingDrawCalls, 145);
  assert.equal(REFERENCE_FIDELITY_V3.mobileDrawCalls, 110);
  assert.equal(REFERENCE_FIDELITY_V3.mobileTriangles, 250000);
  assert.equal(REFERENCE_FIDELITY_V3.desktopArticulationBatchesPerActor, 2);
  assert.equal(REFERENCE_FIDELITY_V3.drivenRigidSurfacesPerActor, 0);
  assert.equal(REFERENCE_FIDELITY_V3.skinnedArticulationBonesPerActor, 12);
  assert.equal(REFERENCE_FIDELITY_V3.mobileArticulationBatchesPerActor, 1);
  assert.equal(REFERENCE_FIDELITY_V3.mobileSkinnedArticulationBonesPerActor, 16);
  assert.equal(
    REFERENCE_FIDELITY_V3.mobileCoreArticulationBatchIdentity,
    "SkinnedArticulationCore"
  );
  assert.equal(
    REFERENCE_FIDELITY_V3.mobileDetailArticulationBatchIdentity,
    "SkinnedArticulationDetail"
  );
  assert.equal(REFERENCE_FIDELITY_V3.sevenAxisBaseline, 4);
}

// Break caught: mobile acceptance must enforce the actual loaded core/detail
// graph, not merely the mobile role roster and global frame budgets.
for (const [label, mutate, expectedFailure] of [
  [
    "wrong detail identity",
    (actor) => {
      actor.mobileArticulationStructure.detailIdentity = "FabricatedDetail";
    },
    "detail identity"
  ],
  [
    "detail not removed",
    (actor) => {
      actor.mobileArticulationStructure.detailVisible = true;
      actor.mobileArticulationStructure.detailRemoved = false;
      actor.mobileArticulationStructure.removedDetailBatchCount = 0;
      actor.mobileArticulationStructure.renderedDetailBatchCount = 1;
    },
    "removed detail"
  ],
  [
    "hidden attached detail",
    (actor) => {
      actor.mobileArticulationStructure.detailVisible = false;
      actor.mobileArticulationStructure.detailRemoved = false;
      actor.mobileArticulationStructure.removedDetailBatchCount = 0;
      actor.mobileArticulationStructure.renderedDetailBatchCount = 0;
    },
    "removed detail"
  ],
  [
    "excess core batch",
    (actor) => {
      actor.articulationBatchCount = 2;
      actor.mobileArticulationStructure.coreBatchCount = 2;
    },
    "articulation batch"
  ],
  [
    "missing weighted bones",
    (actor) => {
      actor.skinnedArticulationBoneCount = 15;
    },
    "weighted articulation bone"
  ]
]) {
  const fixture = structuredClone(passingInput);
  mutate(fixture.mobileStats.actorArticulationBreakdown.player);
  const result = evaluateReferenceFidelityV3(fixture);
  assert.equal(result.pass, false, `${label}: invalid mobile graph passed`);
  assert(
    result.failures.some((failure) => failure.includes(expectedFailure)),
    `${label}: expected mobile structural failure was not reported`
  );
}

// Break caught: removing a required opening role from every artifact must not
// lower draw calls and leave the v3 gate green.
{
  const missingRole = structuredClone(passingInput);
  for (const stats of [
    missingRole.desktopStats,
    missingRole.mobileStats,
    missingRole.blinkStats
  ]) {
    delete stats.actorArticulationBreakdown.facilitator;
    delete stats.actorContractStates?.facilitator;
  }
  const result = evaluateReferenceFidelityV3(missingRole);
  assert.equal(result.pass, false);
  assert(result.failures.some((failure) => failure.includes("facilitator")));
}

// Break caught: keeping one applicable state cannot mask missing numeric
// contract state on the other required roles.
for (const metric of ["handContact", "elbowVolume", "footPlant", "clothCompression"]) {
  const missingStates = structuredClone(passingInput);
  for (const role of ["player", "listener", "facilitator"]) {
    delete missingStates.desktopStats.actorContractStates[role][metric];
  }
  const result = evaluateReferenceFidelityV3(missingStates);
  assert.equal(result.pass, false, `${metric}: missing per-role states passed`);
  assert(
    result.failures.some((failure) => failure.includes(`player ${metric}`)),
    `${metric}: missing player state was not reported`
  );
}

// Break caught: otherwise valid artifacts from different content-hashed
// runtime builds must not be combined into one acceptance verdict.
{
  const mixedBuild = structuredClone(passingInput);
  mixedBuild.mobileStats.buildFingerprint = BUILD_FINGERPRINT_B;
  const result = evaluateReferenceFidelityV3(mixedBuild);
  assert.equal(result.pass, false);
  assert(result.failures.some((failure) => failure.includes("build fingerprint")));
}

// Break caught: the old chunk pathname is not a build-wide content identifier
// and must not be accepted even when every artifact repeats it.
{
  const legacyPathBuild = structuredClone(passingInput);
  legacyPathBuild.desktopStats.buildFingerprint = "/assets/game-fixture.js";
  legacyPathBuild.mobileStats.buildFingerprint = "/assets/game-fixture.js";
  legacyPathBuild.blinkStats.buildFingerprint = "/assets/game-fixture.js";
  legacyPathBuild.sevenAxis.buildFingerprint = "/assets/game-fixture.js";
  const result = evaluateReferenceFidelityV3(legacyPathBuild);
  assert.equal(result.pass, false);
  assert(result.failures.some((failure) => failure.includes("build fingerprint")));
}

// Break caught: relaxing either inverse structural gate or accepting a red
// animation state must keep the implementation phase blocked.
{
  const failingInput = structuredClone(passingInput);
  failingInput.desktopStats.drawCallsByLayer.actors = 56;
  failingInput.desktopStats.actorArticulationBreakdown.player.drivenRigidSurfaceCount = 1;
  failingInput.desktopStats.actorArticulationBreakdown.listener.skinnedArticulationBoneCount = 11;
  failingInput.mobileStats.triangles = 250001;
  failingInput.desktopStats.actorContractStates.mediator.clothCompression.green = false;
  failingInput.blinkStats.actorContractStates.player.blink.green = false;
  failingInput.sevenAxis.within = 3;
  delete failingInput.desktopStats.referenceFidelityContract;
  const result = evaluateReferenceFidelityV3(failingInput);
  assert.equal(result.pass, false);
  assert(result.failures.some((failure) => failure.includes("opening actors draw call")));
  assert(result.failures.some((failure) => failure.includes("player driven rigid")));
  assert(result.failures.some((failure) => failure.includes("listener skinned articulation bone")));
  assert(result.failures.some((failure) => failure.includes("mobile triangles")));
  assert(result.failures.some((failure) => failure.includes("clothCompression")));
  assert(result.failures.some((failure) => failure.includes("blink")));
  assert(result.failures.some((failure) => failure.includes("seven-axis")));
  assert(result.failures.some((failure) => failure.includes("embedded v3 contract")));
}

console.log("Reference fidelity runtime stats passed: actual graph measurement and v3 boundaries verified.");
