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
  REFERENCE_FIDELITY_V3,
  evaluateReferenceFidelityV3,
  measureActorRuntimeGraph
} = runtimeContract;

// Break caught: the asset-side articulation count must be read from positive
// JOINTS_0/WEIGHTS_0 data in the shipped GLB, not copied from its manifest.
{
  const glb = readGlbGeometry(path.resolve("public/assets/characters/civic/player.glb"));
  assert.equal(glb.skinnedArticulationBoneCount, 8);
  assert.equal(glb.skinnedArticulationBatches, 2);
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

  const measured = measureActorRuntimeGraph({
    group: actor,
    visual,
    controllerJoints: {
      leftArm: { node: leftArm },
      rightArm: { node: rightArm }
    },
    mobileRemovableDetailBatches: 2
  }, "desktop");

  assert.equal(measured.actorDrawCalls, 3);
  assert.equal(measured.articulationBatchCount, 1);
  assert.equal(measured.drivenRigidSurfaceCount, 1);
  assert.equal(measured.skinnedArticulationBoneCount, 2);
  assert.equal(measured.mobileRemovableDetailBatches, 2);
  assert.deepEqual(measured.controlPivots.leftArm, {
    rigidDrawCalls: 1,
    rigidSurfaceCount: 1,
    skinnedDrawCalls: 0
  });
  assert(!("rightArm" in measured.controlPivots));
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
const passingInput = {
  desktopStats: {
    referenceFidelityContract: REFERENCE_FIDELITY_V3,
    drawCalls: 145,
    triangles: 320000,
    drawCallsByLayer: { actors: 55 },
    actorArticulationBreakdown: {
      player: passingActor,
      listener: passingActor,
      facilitator: passingActor,
      mediator: passingActor
    },
    actorContractStates: {
      player: greenState,
      listener: greenState,
      facilitator: greenState,
      mediator: greenState
    }
  },
  mobileStats: {
    referenceFidelityContract: REFERENCE_FIDELITY_V3,
    drawCalls: 110,
    triangles: 250000,
    actorArticulationBreakdown: {
      player: { ...passingActor, actorDrawCalls: 10 }
    }
  },
  blinkStats: {
    referenceFidelityContract: REFERENCE_FIDELITY_V3,
    actorContractStates: {
      player: greenState,
      listener: greenState,
      facilitator: greenState,
      mediator: greenState
    }
  },
  sevenAxis: { within: 4, total: 7 }
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
  assert.equal(REFERENCE_FIDELITY_V3.sevenAxisBaseline, 4);
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
