import { createInteriorSessionController } from "./interior-session-controller.js";
import {
  createInteriorEntrySnapshot,
  fingerprintInteriorEntrySnapshot
} from "./interior-entry-snapshot.js";

const session = window.MirrorLifeInteriorSession || createInteriorSessionController({
  onTransition(status) {
    window.dispatchEvent(new CustomEvent("mirrorlife:interior-session-transition", {
      detail: status
    }));
  }
});

window.MirrorLifeInteriorSession = session;
window.MirrorLifeInteriorEntrySnapshot = Object.freeze({
  create: createInteriorEntrySnapshot,
  fingerprint: fingerprintInteriorEntrySnapshot
});
window.dispatchEvent(new CustomEvent("mirrorlife:interior-session-ready", {
  detail: session
}));
