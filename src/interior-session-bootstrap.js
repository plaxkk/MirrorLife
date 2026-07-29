import { createInteriorSessionController } from "./interior-session-controller.js";

const session = window.MirrorLifeInteriorSession || createInteriorSessionController({
  onTransition(status) {
    window.dispatchEvent(new CustomEvent("mirrorlife:interior-session-transition", {
      detail: status
    }));
  }
});

window.MirrorLifeInteriorSession = session;
window.dispatchEvent(new CustomEvent("mirrorlife:interior-session-ready", {
  detail: session
}));
