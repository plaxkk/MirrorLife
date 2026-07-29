#!/usr/bin/env node
import assert from "node:assert/strict";
import * as THREE from "three";
import { measureActorContractState } from "../src/reference-fidelity-runtime-contract.js";

function consolidatedCorrective(bone) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute([
    0, 0, 0,
    0.1, 0, 0,
    0, 0.1, 0
  ], 3));
  geometry.setAttribute("skinIndex", new THREE.Uint16BufferAttribute([
    0, 0, 0, 0,
    0, 0, 0, 0,
    0, 0, 0, 0
  ], 4));
  geometry.setAttribute("skinWeight", new THREE.Float32BufferAttribute([
    1, 0, 0, 0,
    1, 0, 0, 0,
    1, 0, 0, 0
  ], 4));
  const mesh = new THREE.SkinnedMesh(geometry, new THREE.MeshBasicMaterial());
  mesh.add(bone);
  mesh.bind(new THREE.Skeleton([bone]));
  return mesh;
}

function correctiveState(node, surface, surfaceBone) {
  node.scale.set(1.16, 1.22, 0.94);
  return {
    node,
    restScale: new THREE.Vector3(1, 1, 1),
    bend: 1,
    activationThreshold: 0.035,
    surfaceNodes: [surface],
    surfaceBone
  };
}

// Break caught: after rigid corrective geometry moves into a shared skin
// batch, elbow-volume health must follow the real positive-weight surface
// instead of requiring a separately rendered mesh under the public pivot.
{
  const surfaceBone = new THREE.Bone();
  const surface = consolidatedCorrective(surfaceBone);
  const group = new THREE.Group();
  const leftElbow = new THREE.Group();
  const rightElbow = new THREE.Group();
  const leftCarrier = new THREE.Group();
  const rightCarrier = new THREE.Group();
  group.add(leftElbow, rightElbow, surface);
  leftElbow.add(leftCarrier);
  rightElbow.add(rightCarrier);
  const entry = {
    group,
    leftElbow,
    rightElbow,
    clothCorrectives: {
      leftSleeve: correctiveState(leftCarrier, surface, surfaceBone),
      rightSleeve: correctiveState(rightCarrier, surface, surfaceBone)
    }
  };
  const consolidated = measureActorContractState(entry);
  assert.equal(consolidated.elbowVolume.green, true);
  assert.equal(consolidated.elbowVolume.left.visibleSurfaceCount, 1);
  assert.equal(consolidated.elbowVolume.left.surfaceWeighted, true);

  entry.clothCorrectives.rightSleeve.surfaceBone = new THREE.Bone();
  const wrongBone = measureActorContractState(entry);
  assert.equal(wrongBone.elbowVolume.green, false);

  entry.clothCorrectives.rightSleeve.surfaceBone = surfaceBone;
  surface.removeFromParent();
  const detached = measureActorContractState(entry);
  assert.equal(detached.elbowVolume.green, false);

  const hiddenAncestor = new THREE.Group();
  hiddenAncestor.visible = false;
  group.add(hiddenAncestor);
  hiddenAncestor.add(surface);
  const hidden = measureActorContractState(entry);
  assert.equal(hidden.elbowVolume.green, false);
}

console.log("Reference fidelity consolidated skin state passed.");
