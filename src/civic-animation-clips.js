const TAU = Math.PI * 2;

export const CIVIC_ANIMATION_CLIP_VERSION = "mirrorlife-civic-clips-v19";

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
        visual: v(-0.004, 0, -0.018), headGroup: v(-0.022, 0, -0.016),
        leftArm: v(-0.18, -0.018, 0.112), rightArm: v(0.07, 0.016, -0.074),
        leftElbow: v(-0.36, 0.012, 0.028), rightElbow: v(-0.24, -0.01, -0.018),
        leftLeg: v(0.006, -0.025, 0.044), rightLeg: v(-0.004, 0.03, -0.028), leftKnee: v(0.065)
      })],
      [0.25, pose(0.009, {
        visual: v(-0.009, 0, -0.011), headGroup: v(-0.014, 0.018, -0.006),
        leftArm: v(-0.17, -0.016, 0.122), rightArm: v(0.055, 0.014, -0.084),
        leftElbow: v(-0.38, 0.014, 0.032), rightElbow: v(-0.23, -0.012, -0.02),
        leftLeg: v(0.012, -0.022, 0.048), rightLeg: v(-0.008, 0.027, -0.03), leftKnee: v(0.072)
      })],
      [0.5, pose(0.003, {
        visual: v(0, 0, -0.002), headGroup: v(-0.024, -0.012, 0.004),
        leftArm: v(-0.185, -0.02, 0.107), rightArm: v(0.08, 0.018, -0.069),
        leftElbow: v(-0.35, 0.01, 0.026), rightElbow: v(-0.25, -0.008, -0.016),
        leftLeg: v(0.002, -0.028, 0.04), rightLeg: v(0, 0.032, -0.026), leftKnee: v(0.06)
      })],
      [0.75, pose(0.011, {
        visual: v(-0.008, 0, -0.021), headGroup: v(-0.016, 0.01, -0.012),
        leftArm: v(-0.175, -0.017, 0.12), rightArm: v(0.06, 0.015, -0.081),
        leftElbow: v(-0.37, 0.013, 0.03), rightElbow: v(-0.235, -0.011, -0.019),
        leftLeg: v(0.01, -0.023, 0.046), rightLeg: v(-0.006, 0.028, -0.029), leftKnee: v(0.069)
      })],
      [1, pose(0, {
        visual: v(-0.004, 0, -0.018), headGroup: v(-0.022, 0, -0.016),
        leftArm: v(-0.18, -0.018, 0.112), rightArm: v(0.07, 0.016, -0.074),
        leftElbow: v(-0.36, 0.012, 0.028), rightElbow: v(-0.24, -0.01, -0.018),
        leftLeg: v(0.006, -0.025, 0.044), rightLeg: v(-0.004, 0.03, -0.028), leftKnee: v(0.065)
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
      visual: v(-0.006, 0, 0.038), headGroup: v(-0.006, -0.02, -0.032),
      leftArm: v(0.035, -0.018, 0.052), rightArm: v(-0.055, 0.022, -0.036),
      leftElbow: v(-0.18, 0.015, 0.055), rightElbow: v(-0.14, -0.014, -0.045),
      leftHand: v(-0.055, 0.025, 0.055), rightHand: v(0.038, -0.022, -0.048),
      leftLeg: v(0.015, -0.11, 0.086), rightLeg: v(-0.008, 0.12, -0.072), leftKnee: v(0.11)
    }),
    listen: pose(0, {
      // The public-room player is already the foreground anchor. Relax the
      // generic listening clip's deep elbow fold so the silhouette matches
      // the reference's planted, open stance instead of looking as if both
      // hands are clasped invisibly in front of the pelvis.
      visual: v(-0.008, 0, 0.032), headGroup: v(0.018, -0.018, -0.036),
      // Keep one hand close to the backpack strap and let the opposite arm
      // hang more freely.  The earlier offsets cancelled the generic clip
      // into identical -0.152 rad upper-arm angles, recreating the exact
      // mannequin symmetry this role pass was meant to remove.
      leftArm: v(0.015, -0.024, -0.018), rightArm: v(0.245, 0.026, 0.022),
      leftElbow: v(0.24, 0.016, 0.045), rightElbow: v(0.8, -0.014, -0.046),
      leftHand: v(-0.02, 0.012, 0.025), rightHand: v(0.018, -0.01, -0.02),
      leftLeg: v(0.012, -0.085, 0.072), rightLeg: v(-0.006, 0.094, -0.061), leftKnee: v(0.085)
    })
  },
  mediator: {
    listen: pose(0, {
      // Put one hand at the chin while the opposite arm hangs softly. The
      // previous offset bent both elbows and produced the same "holding an
      // invisible tray" silhouette as the other two civic roles.
      visual: v(0.022, 0, 0.055), headGroup: v(-0.016, 0.026, 0.052),
      leftArm: v(0.16, -0.018, 0.05), rightArm: v(0.1, 0.025, -0.14),
      leftElbow: v(0.4, 0.015, 0.03), rightElbow: v(-0.78, -0.02, -0.19),
      leftHand: v(-0.12, 0.08, 0.16), rightHand: v(0.22, -0.18, -0.3),
      leftLeg: v(0.01, -0.065, 0.052), rightLeg: v(-0.005, 0.074, -0.038), leftKnee: v(0.078)
    }),
    gesture: pose(0, {
      // Keep the thoughtful right hand close to the jaw while the left palm
      // opens into the circle. The v16 offset relaxed both elbows over the
      // generic gesture and left two hands hovering at waist height instead
      // of the reference's readable speaker/listener silhouette.
      visual: v(0.012, 0, 0.035), headGroup: v(-0.022, 0.035, 0.038),
      leftArm: v(0.18, 0, 0.1), rightArm: v(0.34, 0, 0.14),
      leftElbow: v(0.34, 0, 0.1), rightElbow: v(-0.3, 0, 0.16),
      leftHand: v(-0.12, 0.11, 0.2), rightHand: v(0.24, -0.12, 0.18),
      leftLeg: v(0, -0.04, 0.04), rightLeg: v(0, 0.046, -0.03), leftKnee: v(0.06)
    })
  },
  facilitator: {
    listen: pose(0, {
      // Keep the notebook supported by both palms, then shift the ribcage and
      // legs in opposite directions so the stance reads as a human response
      // rather than a symmetrical display pose.
      visual: v(-0.016, 0, -0.058), headGroup: v(0.004, -0.022, -0.078),
      leftArm: v(-0.14, 0.05, 0.19), rightArm: v(0.0, -0.055, -0.118),
      leftElbow: v(-0.5, 0.04, 0.2), rightElbow: v(-0.27, -0.05, -0.112),
      leftHand: v(-0.12, 0.11, 0.12), rightHand: v(-0.04, -0.08, -0.12),
      leftLeg: v(-0.006, -0.075, -0.082), rightLeg: v(0.012, 0.086, 0.105), rightKnee: v(0.095)
    }),
    gesture: pose(0, {
      // Keep the notebook supported against the torso while the free hand
      // opens toward the current listener.
      visual: v(-0.015, 0, -0.038), headGroup: v(-0.006, -0.028, -0.052),
      leftArm: v(-0.14, 0.035, 0.19), rightArm: v(0.2, -0.025, -0.13),
      leftElbow: v(-0.46, 0.025, 0.17), rightElbow: v(0.26, -0.02, -0.1),
      leftHand: v(-0.12, 0.11, 0.12), rightHand: v(0.06, -0.06, -0.08),
      leftLeg: v(0, -0.05, -0.06), rightLeg: v(0, 0.056, 0.08), rightKnee: v(0.075)
    })
  },
  listener: {
    listen: pose(0, {
      // The reference listener attends with relaxed hands rather than
      // presenting an invisible tray. Open both arms away from the centreline,
      // keep one palm subtly open and let the shoulders counter-rotate toward
      // the social circle.
      visual: v(-0.016, 0, 0.041), headGroup: v(0.01, 0.026, 0.036),
      leftArm: v(0.1, -0.02, -0.118), rightArm: v(0.12, 0.024, 0.17),
      leftElbow: v(0.34, 0.016, 0.058), rightElbow: v(0.68, -0.015, -0.058),
      leftHand: v(-0.14, 0.06, 0.19), rightHand: v(0.04, -0.04, -0.06),
      leftLeg: v(0.012, -0.078, 0.074), rightLeg: v(-0.008, 0.09, -0.068), leftKnee: v(0.082)
    }),
    gesture: pose(0, {
      // The first speaker keeps one hand close to the sternum and offers the
      // other palm into the circle, producing a legible "I am telling you"
      // silhouette at the wide gameplay camera.
      visual: v(-0.02, 0, 0.04), headGroup: v(-0.025, 0.03, 0.042),
      leftArm: v(0.2, 0, -0.12), rightArm: v(-0.06, 0, 0.22),
      leftElbow: v(0.48, 0, 0.08), rightElbow: v(0.38, 0, -0.1),
      leftHand: v(-0.16, 0.08, 0.18), rightHand: v(0.08, -0.04, -0.08),
      leftLeg: v(0, -0.052, 0.065), rightLeg: v(0, 0.06, -0.052), leftKnee: v(0.07)
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
