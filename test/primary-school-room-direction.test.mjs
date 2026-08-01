import test from "node:test";
import assert from "node:assert/strict";
import { verifyRoomDirection } from "../scripts/verify-primary-school-room-direction.mjs";

test("room-direction packet preserves six hashed geometry-controlled views", async () => {
  const report = await verifyRoomDirection();

  assert.equal(report.views, 6);
  assert.equal(report.decision, "pending");
  assert.equal(report.promotionEligible, false);
});

test("room-direction promotion rejects missing user approval", async () => {
  await assert.rejects(
    verifyRoomDirection({ requireApproved: true }),
    /pending explicit user approval/
  );
});
