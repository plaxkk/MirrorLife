const TAU = Math.PI * 2;

export const CIVIC_ANIMATION_CLIP_VERSION = "mirrorlife-civic-clips-v12";

const TRACKS = Object.freeze([
  "visual",
  "headGroup",
  "leftArm",
  "rightArm",
  "leftElbow",
  "rightElbow",
  "leftHand",
  "rightHand",
  "leftLeg",
  "rightLeg",
  "leftKnee",
  "rightKnee"
]);

const v = (x = 0, y = 0, z = 0) => [x, y, z];
const pose = (rootY, tracks = {}) => ({
  rootY,
  ...Object.fromEntries(TRACKS.map((track) => [track, tracks[track] || v()]))
});

// These clips deliberately live outside the render loop.  They are authored
// key poses with stable timing, so motion can be blended and reviewed like an
// animation asset instead of being reconstructed from unrelated sine waves.
export const CIVIC_ANIMATION_CLIPS = Object.freeze({
  idle: {
    duration: 3.2,
    loop: true,
    keys: [
      [0, pose(0, {
        visual: v(0, 0, -0.012), headGroup: v(-0.018, 0, -0.012),
        leftArm: v(-0.15, 0, 0.095), rightArm: v(0.1, 0, -0.065),
        leftElbow: v(-0.3), rightElbow: v(-0.18),
        leftLeg: v(0, 0, 0.03), rightLeg: v(0, 0, -0.018), leftKnee: v(0.045)
      })],
      [0.25, pose(0.009, {
        visual: v(-0.006, 0, -0.006), headGroup: v(-0.01, 0.018, -0.004),
        leftArm: v(-0.14, 0, 0.105), rightArm: v(0.085, 0, -0.075),
        leftElbow: v(-0.32), rightElbow: v(-0.17),
        leftLeg: v(0.006, 0, 0.034), rightLeg: v(-0.004, 0, -0.02), leftKnee: v(0.052)
      })],
      [0.5, pose(0.003, {
        visual: v(0.004, 0, 0.005), headGroup: v(-0.02, -0.012, 0.006),
        leftArm: v(-0.155, 0, 0.09), rightArm: v(0.11, 0, -0.06),
        leftElbow: v(-0.29), rightElbow: v(-0.19),
        leftLeg: v(-0.004, 0, 0.026), rightLeg: v(0.004, 0, -0.016), leftKnee: v(0.04)
      })],
      [0.75, pose(0.011, {
        visual: v(-0.004, 0, -0.015), headGroup: v(-0.012, 0.01, -0.008),
        leftArm: v(-0.145, 0, 0.102), rightArm: v(0.09, 0, -0.071),
        leftElbow: v(-0.31), rightElbow: v(-0.175),
        leftLeg: v(0.004, 0, 0.032), rightLeg: v(-0.002, 0, -0.019), leftKnee: v(0.049)
      })],
      [1, pose(0, {
        visual: v(0, 0, -0.012), headGroup: v(-0.018, 0, -0.012),
        leftArm: v(-0.15, 0, 0.095), rightArm: v(0.1, 0, -0.065),
        leftElbow: v(-0.3), rightElbow: v(-0.18),
        leftLeg: v(0, 0, 0.03), rightLeg: v(0, 0, -0.018), leftKnee: v(0.045)
      })]
    ]
  },
  walk: {
    duration: 0.72,
    loop: true,
    keys: [
      [0, pose(0.022, {
        visual: v(-0.038, 0, 0.016), headGroup: v(0.018, -0.018, -0.012),
        leftArm: v(-0.48, 0, 0.018), rightArm: v(0.42, 0, -0.018),
        leftElbow: v(-0.08), rightElbow: v(-0.22),
        leftLeg: v(0.56), rightLeg: v(-0.47),
        leftKnee: v(0.04), rightKnee: v(0.36)
      })],
      [0.25, pose(0.006, {
        visual: v(-0.03, 0, -0.012), headGroup: v(0.006, 0.01, 0.008),
        leftArm: v(-0.08, 0, 0.01), rightArm: v(0.04, 0, -0.01),
        leftElbow: v(-0.14), rightElbow: v(-0.12),
        leftLeg: v(0.06), rightLeg: v(-0.08),
        leftKnee: v(0.1), rightKnee: v(0.5)
      })],
      [0.5, pose(0.024, {
        visual: v(-0.038, 0, -0.016), headGroup: v(0.018, 0.018, 0.012),
        leftArm: v(0.42, 0, 0.018), rightArm: v(-0.48, 0, -0.018),
        leftElbow: v(-0.22), rightElbow: v(-0.08),
        leftLeg: v(-0.47), rightLeg: v(0.56),
        leftKnee: v(0.36), rightKnee: v(0.04)
      })],
      [0.75, pose(0.006, {
        visual: v(-0.03, 0, 0.012), headGroup: v(0.006, -0.01, -0.008),
        leftArm: v(0.04, 0, 0.01), rightArm: v(-0.08, 0, -0.01),
        leftElbow: v(-0.12), rightElbow: v(-0.14),
        leftLeg: v(-0.08), rightLeg: v(0.06),
        leftKnee: v(0.5), rightKnee: v(0.1)
      })],
      [1, pose(0.022, {
        visual: v(-0.038, 0, 0.016), headGroup: v(0.018, -0.018, -0.012),
        leftArm: v(-0.48, 0, 0.018), rightArm: v(0.42, 0, -0.018),
        leftElbow: v(-0.08), rightElbow: v(-0.22),
        leftLeg: v(0.56), rightLeg: v(-0.47),
        leftKnee: v(0.04), rightKnee: v(0.36)
      })]
    ]
  },
  run: {
    duration: 0.48,
    loop: true,
    keys: [
      [0, pose(0.04, {
        visual: v(-0.1, 0, 0.025), headGroup: v(0.055, -0.025, -0.015),
        leftArm: v(-0.72, 0, 0.04), rightArm: v(0.66, 0, -0.04),
        leftElbow: v(-0.18), rightElbow: v(-0.42),
        leftLeg: v(0.78), rightLeg: v(-0.68),
        leftKnee: v(0.08), rightKnee: v(0.64)
      })],
      [0.25, pose(0.018, {
        visual: v(-0.085, 0, -0.022), headGroup: v(0.04, 0.012, 0.01),
        leftArm: v(-0.1, 0, 0.02), rightArm: v(0.06, 0, -0.02),
        leftElbow: v(-0.28), rightElbow: v(-0.24),
        leftLeg: v(0.08), rightLeg: v(-0.12),
        leftKnee: v(0.2), rightKnee: v(0.74)
      })],
      [0.5, pose(0.042, {
        visual: v(-0.1, 0, -0.025), headGroup: v(0.055, 0.025, 0.015),
        leftArm: v(0.66, 0, 0.04), rightArm: v(-0.72, 0, -0.04),
        leftElbow: v(-0.42), rightElbow: v(-0.18),
        leftLeg: v(-0.68), rightLeg: v(0.78),
        leftKnee: v(0.64), rightKnee: v(0.08)
      })],
      [0.75, pose(0.018, {
        visual: v(-0.085, 0, 0.022), headGroup: v(0.04, -0.012, -0.01),
        leftArm: v(0.06, 0, 0.02), rightArm: v(-0.1, 0, -0.02),
        leftElbow: v(-0.24), rightElbow: v(-0.28),
        leftLeg: v(-0.12), rightLeg: v(0.08),
        leftKnee: v(0.74), rightKnee: v(0.2)
      })],
      [1, pose(0.04, {
        visual: v(-0.1, 0, 0.025), headGroup: v(0.055, -0.025, -0.015),
        leftArm: v(-0.72, 0, 0.04), rightArm: v(0.66, 0, -0.04),
        leftElbow: v(-0.18), rightElbow: v(-0.42),
        leftLeg: v(0.78), rightLeg: v(-0.68),
        leftKnee: v(0.08), rightKnee: v(0.64)
      })]
    ]
  },
  listen: {
    duration: 4.4,
    loop: true,
    keys: [
      [0, pose(0, {
        visual: v(0, 0, 0.012), headGroup: v(-0.055, -0.04, 0.035),
        leftArm: v(-0.22, 0, 0.13), rightArm: v(-0.3, 0, -0.18),
        leftElbow: v(-0.72), rightElbow: v(-1.1),
        leftLeg: v(0, 0, 0.025), rightLeg: v(0, 0, -0.032), leftKnee: v(0.065)
      })],
      [0.25, pose(0.008, {
        visual: v(-0.005, 0, 0.018), headGroup: v(-0.075, 0.025, 0.055),
        leftArm: v(-0.235, 0, 0.145), rightArm: v(-0.315, 0, -0.19),
        leftElbow: v(-0.75), rightElbow: v(-1.14),
        leftLeg: v(0.006, 0, 0.03), rightLeg: v(-0.004, 0, -0.035), leftKnee: v(0.074)
      })],
      [0.5, pose(0.004, {
        visual: v(0.003, 0, 0.008), headGroup: v(-0.045, 0.052, 0.02),
        leftArm: v(-0.215, 0, 0.122), rightArm: v(-0.29, 0, -0.17),
        leftElbow: v(-0.7), rightElbow: v(-1.08),
        leftLeg: v(-0.003, 0, 0.022), rightLeg: v(0.003, 0, -0.028), leftKnee: v(0.06)
      })],
      [0.75, pose(0.009, {
        visual: v(-0.004, 0, 0.015), headGroup: v(-0.068, -0.012, 0.045),
        leftArm: v(-0.23, 0, 0.14), rightArm: v(-0.31, 0, -0.185),
        leftElbow: v(-0.74), rightElbow: v(-1.13),
        leftLeg: v(0.004, 0, 0.028), rightLeg: v(-0.003, 0, -0.034), leftKnee: v(0.071)
      })],
      [1, pose(0, {
        visual: v(0, 0, 0.012), headGroup: v(-0.055, -0.04, 0.035),
        leftArm: v(-0.22, 0, 0.13), rightArm: v(-0.3, 0, -0.18),
        leftElbow: v(-0.72), rightElbow: v(-1.1),
        leftLeg: v(0, 0, 0.025), rightLeg: v(0, 0, -0.032), leftKnee: v(0.065)
      })]
    ]
  },
  gesture: {
    duration: 1.9,
    loop: true,
    keys: [
      [0, pose(0, {
        visual: v(0, 0, -0.018), headGroup: v(-0.015, -0.04, -0.025),
        leftArm: v(-0.2, 0, 0.08), rightArm: v(-0.38, 0, -0.16),
        leftElbow: v(-0.48), rightElbow: v(-0.72)
      })],
      [0.2, pose(0.012, {
        visual: v(-0.018, 0, 0.026), headGroup: v(-0.045, 0.02, 0.04),
        leftArm: v(-0.36, 0, 0.22), rightArm: v(-0.82, 0, -0.28),
        leftElbow: v(-0.7, 0, 0.06), rightElbow: v(-1.02, 0, -0.08)
      })],
      [0.48, pose(0.018, {
        visual: v(-0.025, 0, 0.038), headGroup: v(-0.06, 0.055, 0.055),
        leftArm: v(-0.48, 0, 0.3), rightArm: v(-1.02, 0, -0.34),
        leftElbow: v(-0.88, 0, 0.12), rightElbow: v(-1.24, 0, -0.16),
        leftLeg: v(0, 0, 0.02), rightLeg: v(0, 0, -0.02)
      })],
      [0.72, pose(0.009, {
        visual: v(-0.01, 0, 0.018), headGroup: v(-0.035, 0.015, 0.03),
        leftArm: v(-0.32, 0, 0.18), rightArm: v(-0.7, 0, -0.24),
        leftElbow: v(-0.64, 0, 0.04), rightElbow: v(-0.92, 0, -0.08)
      })],
      [1, pose(0, {
        visual: v(0, 0, -0.018), headGroup: v(-0.015, -0.04, -0.025),
        leftArm: v(-0.2, 0, 0.08), rightArm: v(-0.38, 0, -0.16),
        leftElbow: v(-0.48), rightElbow: v(-0.72)
      })]
    ]
  },
  jump: {
    duration: 0.6,
    loop: false,
    keys: [
      [0, pose(0, {
        visual: v(-0.08, 0, -0.02), headGroup: v(0.04, 0, -0.02),
        leftArm: v(0.18, 0, 0.18), rightArm: v(0.18, 0, -0.18),
        leftElbow: v(-0.2), rightElbow: v(-0.2),
        leftLeg: v(-0.18), rightLeg: v(-0.18), leftKnee: v(0.42), rightKnee: v(0.42)
      })],
      [0.48, pose(0.025, {
        visual: v(-0.045, 0, -0.04), headGroup: v(-0.02, 0, 0.02),
        leftArm: v(0.42, 0, 0.32), rightArm: v(0.42, 0, -0.32),
        leftElbow: v(-0.3), rightElbow: v(-0.3),
        leftLeg: v(-0.42), rightLeg: v(-0.42), leftKnee: v(0.72), rightKnee: v(0.72)
      })],
      [1, pose(0.01, {
        visual: v(-0.025, 0, 0.01), headGroup: v(0.025),
        leftArm: v(0.28, 0, 0.24), rightArm: v(0.28, 0, -0.24),
        leftElbow: v(-0.22), rightElbow: v(-0.22),
        leftLeg: v(-0.26), rightLeg: v(-0.26), leftKnee: v(0.5), rightKnee: v(0.5)
      })]
    ]
  },
  fall: {
    duration: 0.8,
    loop: true,
    keys: [
      [0, pose(0, {
        visual: v(0.035, 0, 0.03), headGroup: v(-0.025, -0.025, -0.015),
        leftArm: v(0, 0, 0.42), rightArm: v(0, 0, -0.42),
        leftElbow: v(-0.22), rightElbow: v(-0.22),
        leftKnee: v(0.28), rightKnee: v(0.48)
      })],
      [0.5, pose(0.006, {
        visual: v(0.045, 0, -0.03), headGroup: v(-0.035, 0.02, 0.018),
        leftArm: v(-0.06, 0, 0.46), rightArm: v(-0.06, 0, -0.46),
        leftElbow: v(-0.28), rightElbow: v(-0.28),
        leftKnee: v(0.34), rightKnee: v(0.42)
      })],
      [1, pose(0, {
        visual: v(0.035, 0, 0.03), headGroup: v(-0.025, -0.025, -0.015),
        leftArm: v(0, 0, 0.42), rightArm: v(0, 0, -0.42),
        leftElbow: v(-0.22), rightElbow: v(-0.22),
        leftKnee: v(0.28), rightKnee: v(0.48)
      })]
    ]
  }
});

const ROLE_OFFSETS = Object.freeze({
  player: {
    idle: pose(0, {
      // Give the controlled character an intentional listening stance before
      // the player moves: weight rests on one leg, shoulders counter-rotate
      // and the head leans subtly toward the civic circle. The v77 hero frame
      // was technically animated but still read like a centred mannequin.
      visual: v(0, 0, 0.028), headGroup: v(-0.008, -0.014, -0.024),
      leftArm: v(0.04, 0, 0.035), rightArm: v(-0.035, 0, -0.025),
      leftElbow: v(-0.16, 0, 0.04), rightElbow: v(-0.12, 0, -0.035),
      leftHand: v(-0.04, 0.02, 0.04), rightHand: v(0.025, -0.015, -0.035),
      leftLeg: v(0, -0.075, 0.068), rightLeg: v(0, 0.08, -0.056), leftKnee: v(0.085)
    })
  },
  mediator: {
    listen: pose(0, {
      // Put one hand at the chin while the opposite arm hangs softly. The
      // previous offset bent both elbows and produced the same "holding an
      // invisible tray" silhouette as the other two civic roles.
      visual: v(0.018, 0, 0.042), headGroup: v(-0.012, 0.018, 0.042),
      leftArm: v(0.18, 0, 0.035), rightArm: v(0.12, 0, -0.12),
      leftElbow: v(0.46), rightElbow: v(-0.82, 0, -0.16),
      leftHand: v(-0.12, 0.08, 0.16), rightHand: v(0.22, -0.18, -0.3),
      leftLeg: v(0, -0.035, 0.035), rightLeg: v(0, 0.042, -0.025), leftKnee: v(0.055)
    })
  },
  facilitator: {
    listen: pose(0, {
      // Keep the notebook supported by both palms, then shift the ribcage and
      // legs in opposite directions so the stance reads as a human response
      // rather than a symmetrical display pose.
      visual: v(-0.012, 0, -0.046), headGroup: v(0, -0.016, -0.066),
      leftArm: v(-0.1, 0, 0.16), rightArm: v(0.025, 0, -0.085),
      leftElbow: v(-0.62, 0, 0.18), rightElbow: v(-0.4, 0, -0.08),
      leftHand: v(-0.12, 0.16, 0.18), rightHand: v(-0.08, -0.14, -0.2),
      leftLeg: v(0, -0.042, -0.065), rightLeg: v(0, 0.052, 0.085), rightKnee: v(0.07)
    })
  },
  listener: {
    listen: pose(0, {
      // The reference listener attends with relaxed hands rather than
      // presenting an invisible tray. Open both arms away from the centreline,
      // keep one palm subtly open and let the shoulders counter-rotate toward
      // the social circle.
      visual: v(-0.012, 0, 0.026), headGroup: v(0.006, 0.018, 0.025),
      leftArm: v(0.12, 0, -0.1), rightArm: v(0.14, 0, 0.15),
      leftElbow: v(0.42, 0, 0.04), rightElbow: v(0.82, 0, -0.04),
      leftHand: v(-0.14, 0.06, 0.19), rightHand: v(0.04, -0.04, -0.06),
      leftLeg: v(0, -0.045, 0.055), rightLeg: v(0, 0.055, -0.05), leftKnee: v(0.055)
    })
  }
});

function copyPose(source) {
  return Object.fromEntries(Object.entries(source).map(([key, value]) => [key, Array.isArray(value) ? [...value] : value]));
}

function addPose(base, offset) {
  if (!offset) return base;
  const result = copyPose(base);
  result.rootY += Number(offset.rootY || 0);
  TRACKS.forEach((track) => {
    const delta = offset[track] || v();
    result[track] = result[track].map((value, index) => value + Number(delta[index] || 0));
  });
  return result;
}

function smoothstep(value) {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
}

function interpolatePose(a, b, alpha) {
  const t = smoothstep(alpha);
  const result = { rootY: a.rootY + (b.rootY - a.rootY) * t };
  TRACKS.forEach((track) => {
    result[track] = a[track].map((value, index) => value + (b[track][index] - value) * t);
  });
  return result;
}

export function blendCivicAnimationPoses(fromPose, toPose, alpha) {
  if (!fromPose) return copyPose(toPose);
  return interpolatePose(fromPose, toPose, alpha);
}

export function sampleCivicAnimationPose(clipName, normalizedTime = 0, role = "") {
  const clip = CIVIC_ANIMATION_CLIPS[clipName] || CIVIC_ANIMATION_CLIPS.idle;
  const time = clip.loop
    ? ((Number(normalizedTime) % 1) + 1) % 1
    : Math.max(0, Math.min(1, Number(normalizedTime) || 0));
  let left = clip.keys[0];
  let right = clip.keys[clip.keys.length - 1];
  for (let index = 1; index < clip.keys.length; index += 1) {
    if (time <= clip.keys[index][0]) {
      left = clip.keys[index - 1];
      right = clip.keys[index];
      break;
    }
  }
  const span = Math.max(0.0001, right[0] - left[0]);
  const sampled = interpolatePose(left[1], right[1], (time - left[0]) / span);
  return addPose(sampled, ROLE_OFFSETS[role]?.[clipName]);
}

export function getCivicAnimationClip(clipName) {
  return CIVIC_ANIMATION_CLIPS[clipName] || CIVIC_ANIMATION_CLIPS.idle;
}

export function resolveCivicAnimationState(actor = {}, { walking = false, running = false, publicRoom = false } = {}) {
  if (actor.state === "jump") return "jump";
  if (actor.state === "fall") return "fall";
  if (running) return "run";
  if (walking) return "walk";
  if (["doing", "talking", "waving", "interact"].includes(actor.state)) return "gesture";
  if (actor.state === "listen" || (publicRoom && actor.civicRole && actor.civicRole !== "player")) return "listen";
  return "idle";
}

export function normalizedWalkPhase(walkPhase = 0) {
  return (((Number(walkPhase) || 0) % TAU) + TAU) % TAU / TAU;
}

export const CIVIC_ANIMATION_TRACKS = TRACKS;
