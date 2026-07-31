// MirrorLife interior audio engine — T3 of the visual-excellence roadmap.
//
// Every sound is synthesised at runtime from oscillators, noise buffers and
// filters. There are no audio asset files, so:
//   • the first bundle gains 0 KB (DoD-3 "<500KB" is satisfied trivially)
//   • there are no copyright dependencies (roadmap Risk 1 eliminated)
//   • there is no network latency on room entry
//
// The module is loaded lazily by interior-runtime-loader alongside three and
// physics, so it never enters the first bundle. It installs a single
// `window.MirrorLifeInteriorAudio` API consumed defensively (optional
// chaining) by game.js at room enter/exit and interaction points.
//
// Architecture:
//   destination ← master gain (mute toggle)
//                 ├─ bgm bus    : slow evolving ambient pad, always on
//                 ├─ ambient bus : per-room bed, crossfaded on entry
//                 └─ sfx bus    : short interaction blips, fire-and-forget
//
// Browsers block AudioContext autoplay until a user gesture, so the context
// is created lazily inside enterRoom()/playSfx() (both are gesture-gated:
// room entry follows a click, SFX follow button presses).

const STORAGE_MUTED_KEY = "ml_audio_muted";

// Per-room ambient recipe. Each bed layers a filtered noise "air", an
// optional low drone for warmth/identity, and a set of scheduled one-shot
// events that give the room its characteristic read. Gain values are
// conservative so the bed sits behind the BGM and never fatigue the ear.
const ROOM_AMBIENTS = Object.freeze({
  // 灯火夜市: warm crowd murmur under a lantern drone, market-stall bell
  // clinks. Pairs with the night-lantern colour grade so ear + eye agree.
  "night-market": {
    noise: { type: "brown", filter: "bandpass", freq: 520, q: 0.8, gain: 0.12, lfo: { rate: 0.18, depth: 0.5 } },
    drone: [{ type: "sine", freq: 110, gain: 0.05 }, { type: "sine", freq: 165, gain: 0.035 }],
    events: [{ kind: "bell", interval: [4000, 9000], gain: 0.16 }]
  },
  // 妇幼医院: hushed air, faint 60Hz hum, distant monitor beep. Cool and
  // calm to match the dawn-care grade — quiet enough to feel held, not
  // clinical.
  "maternity-hospital": {
    noise: { type: "pink", filter: "highpass", freq: 600, gain: 0.05 },
    drone: [{ type: "sine", freq: 60, gain: 0.04 }],
    events: [{ kind: "beep", interval: [8000, 15000], gain: 0.06 }]
  },
  // 邻里广场: open-air murmur, soft fifth drone, occasional bird chirp.
  // The civic room is the social hub, so the bed is present but airy.
  "public-plaza": {
    noise: { type: "brown", filter: "bandpass", freq: 380, q: 0.6, gain: 0.1, lfo: { rate: 0.12, depth: 0.4 } },
    drone: [{ type: "sine", freq: 130, gain: 0.04 }],
    events: [{ kind: "chirp", interval: [5000, 12000], gain: 0.09 }]
  },
  // 初学堂: classroom murmur, distant two-tone bell, paper rustle. The
  // bell is the room's identity — recognisable even off-screen.
  "primary-school": {
    noise: { type: "brown", filter: "bandpass", freq: 680, q: 0.7, gain: 0.09, lfo: { rate: 0.22, depth: 0.4 } },
    events: [
      { kind: "schoolbell", interval: [20000, 40000], gain: 0.12 },
      { kind: "rustle", interval: [3000, 7000], gain: 0.08 }
    ]
  },
  // 生活巷: warm home air, low fifth hum, occasional kitchen clink. Quiet
  // and restful — this is where the player recovers energy.
  "residential": {
    noise: { type: "brown", filter: "lowpass", freq: 400, gain: 0.07 },
    drone: [{ type: "sine", freq: 55, gain: 0.05 }, { type: "sine", freq: 82, gain: 0.03 }],
    events: [{ kind: "clink", interval: [6000, 14000], gain: 0.08 }]
  },
  // 共事楼: aircon hum, keyboard typing bursts. The typing rhythm reads as
  // "people working" without needing a visual.
  "office-district": {
    noise: { type: "pink", filter: "lowpass", freq: 500, gain: 0.06 },
    drone: [{ type: "sine", freq: 55, gain: 0.045 }],
    events: [{ kind: "typing", interval: [2000, 6000], gain: 0.07 }]
  }
});

// Two-chord slow pad for the global BGM. Detuned triangles through a lowpass
// give a soft "music box at a distance" character that never competes with
// the ambient bed or interaction SFX. Chord changes every ~18s.
const BGM_CHORDS = [
  { freqs: [220, 277.18, 329.63], gain: 0.022 }, // Am
  { freqs: [261.63, 329.63, 392], gain: 0.022 }  // C
];
const BGM_CHORD_DURATION_MS = 18000;

// One-shot SFX recipes. Each returns a short node graph plugged into the
// sfx bus; the graph self-disconnects after its envelope completes so
// repeated clicks do not leak nodes.
function buildSfxRecipes(ctx, bus) {
  const now = () => ctx.currentTime;

  function tone({ freq, dur, type = "sine", gain = 0.3, attack = 0.005, sweepTo }) {
    const t = now();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (sweepTo) osc.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(bus);
    osc.start(t);
    osc.stop(t + dur + 0.05);
    osc.onended = () => { try { osc.disconnect(); g.disconnect(); } catch (_) {} };
  }

  function noiseBurst({ dur, gain = 0.2, type = "white", filter: filt = "bandpass", freq = 1000, q = 1, sweepTo }) {
    const t = now();
    const buffer = makeNoiseBuffer(ctx, type, 0.5);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = false;
    const f = ctx.createBiquadFilter();
    f.type = filt;
    f.frequency.setValueAtTime(freq, t);
    f.Q.value = q;
    if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(bus);
    src.start(t);
    src.stop(t + dur + 0.05);
    src.onended = () => { try { src.disconnect(); f.disconnect(); g.disconnect(); } catch (_) {} };
  }

  return {
    // Soft whoosh on room entry — filtered noise sweep, sits under the
    // ambient crossfade so the entry reads as "arriving" not "clicking".
    enter: () => noiseBurst({ dur: 0.35, gain: 0.14, type: "pink", filter: "bandpass", freq: 300, q: 0.7, sweepTo: 1400 }),
    // Choice-stone tap: a single soft blip. Loud enough to confirm the
    // tap registered, quiet enough not to stack fatigue on long dialogs.
    choice: () => tone({ freq: 523.25, dur: 0.09, type: "sine", gain: 0.18 }),
    // Confirm a commitment: warm major-third chime.
    confirm: () => {
      tone({ freq: 523.25, dur: 0.22, type: "sine", gain: 0.16 });
      tone({ freq: 659.25, dur: 0.26, type: "sine", gain: 0.12 });
    },
    // Back/cancel: low soft tick.
    back: () => tone({ freq: 392, dur: 0.07, type: "sine", gain: 0.14 }),
    // Discovery unlock: bright upward sparkle.
    discover: () => tone({ freq: 880, dur: 0.18, type: "sine", gain: 0.16, sweepTo: 1760 })
  };
}

// Cached noise buffers — generating a 2s buffer per burst would dominate SFX
// cost, so we keep one white/pink/brown buffer and reuse via BufferSource.
const noiseBufferCache = new Map();
function makeNoiseBuffer(ctx, type, seconds = 2) {
  const cached = noiseBufferCache.get(type);
  if (cached && cached.sampleRate === ctx.sampleRate) return cached;
  const length = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  if (type === "white") {
    for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
  } else if (type === "pink") {
    // Paul Kellet's pink noise approximation.
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < length; i += 1) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
  } else {
    // Brown noise: integrated white noise, low-frequency heavy. Good for
    // "air" and "crowd" beds after bandpass filtering.
    let last = 0;
    for (let i = 0; i < length; i += 1) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }
  }
  noiseBufferCache.set(type, buffer);
  return buffer;
}

class InteriorAudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.bgmBus = null;
    this.ambientBus = null;
    this.sfxBus = null;
    this.sfx = null;
    this.bgmNodes = null;
    this.bgmChordIndex = 0;
    this.bgmTimer = null;
    this.currentBed = null; // { nodes: [], timers: [], config, gain }
    this.currentZone = null;
    this.muted = false;
    try {
      this.muted = localStorage.getItem(STORAGE_MUTED_KEY) === "1";
    } catch (_) { /* localStorage may be unavailable in some embeds */ }
  }

  // Lazily build the graph on the first gesture-gated call. No-op if the
  // browser has no Web Audio support — the whole API stays a safe no-op.
  ensureContext() {
    if (this.ctx) return !!this.ctx;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return false;
    try {
      this.ctx = new Ctx();
    } catch (_) {
      this.ctx = null;
      return false;
    }
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.85;
    this.master.connect(this.ctx.destination);
    this.bgmBus = this.ctx.createGain();
    this.bgmBus.gain.value = 0.6;
    this.bgmBus.connect(this.master);
    this.ambientBus = this.ctx.createGain();
    this.ambientBus.gain.value = 0; // ramped per-room
    this.ambientBus.connect(this.master);
    this.sfxBus = this.ctx.createGain();
    this.sfxBus.gain.value = 0.7;
    this.sfxBus.connect(this.master);
    this.sfx = buildSfxRecipes(this.ctx, this.sfxBus);
    this.startBgm();
    return true;
  }

  resume() {
    if (!this.ensureContext()) return;
    if (this.ctx.state === "suspended") this.ctx.resume().catch(() => {});
  }

  startBgm() {
    if (!this.ctx || this.bgmNodes) return;
    this.bgmNodes = [];
    this.applyBgmChord();
    // Slow chord rotation: Am ↔ C every 18s. The change is subtle (shared
    // tones) so it reads as movement, not a song.
    this.bgmTimer = setInterval(() => {
      this.bgmChordIndex = (this.bgmChordIndex + 1) % BGM_CHORDS.length;
      this.applyBgmChord();
    }, BGM_CHORD_DURATION_MS);
  }

  applyBgmChord() {
    if (!this.ctx || !this.bgmBus) return;
    const chord = BGM_CHORDS[this.bgmChordIndex];
    const t = this.ctx.currentTime;
    // Fade out previous chord voices, then drop them. Keeping voices alive
    // across chords would require retuning; re-creating is simpler and the
    // 18s cadence makes the click-free crossfade trivial.
    const fadeOut = 1.2;
    this.bgmNodes.forEach((nodes) => {
      try {
        nodes.gain.gain.cancelScheduledValues(t);
        nodes.gain.gain.setValueAtTime(nodes.gain.gain.value, t);
        nodes.gain.gain.linearRampToValueAtTime(0.0001, t + fadeOut);
        nodes.osc.stop(t + fadeOut + 0.1);
      } catch (_) {}
    });
    this.bgmNodes = [];
    // Lowpass keeps the pad "under" the room bed; without it the triangle
    // harmonics would cut through the ambient and read as music, not bed.
    const lp = this.ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 700;
    lp.connect(this.bgmBus);
    chord.freqs.forEach((freq) => {
      const osc = this.ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.value = freq;
      // Slight detune per voice so the pad breathes rather than drones dry.
      osc.detune.value = (Math.random() - 0.5) * 6;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(chord.gain, t + 1.6);
      osc.connect(g).connect(lp);
      osc.start(t);
      this.bgmNodes.push({ osc, gain: g });
    });
  }

  // Build a single room's ambient bed onto the ambient bus. The bed is a
  // noise source → filter → gain (with optional LFO on the gain for "alive"
  // murmur) plus any drone oscillators, plus scheduled one-shot events.
  buildBed(config) {
    if (!this.ctx || !this.ambientBus) return null;
    // Rooms without an authored ambient bed crossfade to silence via
    // crossfadeTo(null). Tolerate that here so config.noise doesn't throw —
    // returning null leaves the bed empty, which is the intended "better
    // silence than a mismatched bed" fallback (DoD-8: zero pageerror).
    if (!config) return null;
    const nodes = [];
    const timers = [];
    const inputGain = this.ctx.createGain();
    inputGain.gain.value = 1;
    inputGain.connect(this.ambientBus);

    if (config.noise) {
      const n = config.noise;
      const buffer = makeNoiseBuffer(this.ctx, n.type, 2);
      const src = this.ctx.createBufferSource();
      src.buffer = buffer;
      src.loop = true;
      const filter = this.ctx.createBiquadFilter();
      filter.type = n.filter;
      filter.frequency.value = n.freq;
      filter.Q.value = n.q || 1;
      const gain = this.ctx.createGain();
      gain.gain.value = n.gain;
      src.connect(filter).connect(gain).connect(inputGain);
      src.start();
      nodes.push(src, filter, gain);
      // LFO on gain gives the murmur a "breathing" quality instead of a
      // static hiss — essential for crowd/water reads.
      if (n.lfo) {
        const lfo = this.ctx.createOscillator();
        lfo.frequency.value = n.lfo.rate;
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.value = n.gain * n.lfo.depth;
        lfo.connect(lfoGain).connect(gain.gain);
        lfo.start();
        nodes.push(lfo, lfoGain);
      }
    }

    (config.drone || []).forEach((d) => {
      const osc = this.ctx.createOscillator();
      osc.type = d.type;
      osc.frequency.value = d.freq;
      const g = this.ctx.createGain();
      g.gain.value = d.gain;
      osc.connect(g).connect(inputGain);
      osc.start();
      nodes.push(osc, g);
    });

    (config.events || []).forEach((ev) => {
      const schedule = () => {
        this.fireEvent(ev, inputGain);
        const [min, max] = ev.interval;
        const next = min + Math.random() * (max - min);
        timers.push(setTimeout(schedule, next));
      };
      const [min, max] = ev.interval;
      timers.push(setTimeout(schedule, min + Math.random() * (max - min)));
    });

    return { nodes, timers, inputGain };
  }

  // One-shot ambient events (bells, beeps, chirps, typing). These are what
  // make a room recognisable from sound alone — the bed is texture, the
  // events are identity. Connected to inputGain (not sfx bus) so they
  // respect the ambient bus level and crossfade.
  fireEvent(ev, destination) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    if (ev.kind === "bell") {
      // Market stall bell: two high sines with fast decay.
      [880, 1320].forEach((f, i) => {
        const osc = this.ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = f;
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(ev.gain * (i === 0 ? 1 : 0.6), t + 0.005);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
        osc.connect(g).connect(destination);
        osc.start(t);
        osc.stop(t + 0.7);
        osc.onended = () => { try { osc.disconnect(); g.disconnect(); } catch (_) {} };
      });
    } else if (ev.kind === "beep") {
      const osc = this.ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = 1046;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(ev.gain, t + 0.01);
      g.gain.setValueAtTime(ev.gain, t + 0.08);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      osc.connect(g).connect(destination);
      osc.start(t);
      osc.stop(t + 0.2);
      osc.onended = () => { try { osc.disconnect(); g.disconnect(); } catch (_) {} };
    } else if (ev.kind === "chirp") {
      // Bird: quick FM upward sweep.
      const osc = this.ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(2000, t);
      osc.frequency.exponentialRampToValueAtTime(2800, t + 0.08);
      osc.frequency.exponentialRampToValueAtTime(2200, t + 0.14);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(ev.gain, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      osc.connect(g).connect(destination);
      osc.start(t);
      osc.stop(t + 0.2);
      osc.onended = () => { try { osc.disconnect(); g.disconnect(); } catch (_) {} };
    } else if (ev.kind === "schoolbell") {
      // Two-tone bell, longer decay, slightly distant (lowpass).
      [523.25, 659.25].forEach((f) => {
        const osc = this.ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = f;
        const lp = this.ctx.createBiquadFilter();
        lp.type = "lowpass";
        lp.frequency.value = 2400;
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(ev.gain, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
        osc.connect(lp).connect(g).connect(destination);
        osc.start(t);
        osc.stop(t + 1.0);
        osc.onended = () => { try { osc.disconnect(); lp.disconnect(); g.disconnect(); } catch (_) {} };
      });
    } else if (ev.kind === "rustle") {
      // Paper rustle: short filtered noise burst.
      const buffer = makeNoiseBuffer(this.ctx, "white", 0.3);
      const src = this.ctx.createBufferSource();
      src.buffer = buffer;
      const f = this.ctx.createBiquadFilter();
      f.type = "bandpass";
      f.frequency.value = 3000;
      f.Q.value = 0.6;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(ev.gain, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      src.connect(f).connect(g).connect(destination);
      src.start(t);
      src.stop(t + 0.25);
      src.onended = () => { try { src.disconnect(); f.disconnect(); g.disconnect(); } catch (_) {} };
    } else if (ev.kind === "clink") {
      const osc = this.ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = 1500;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(ev.gain, t + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      osc.connect(g).connect(destination);
      osc.start(t);
      osc.stop(t + 0.22);
      osc.onended = () => { try { osc.disconnect(); g.disconnect(); } catch (_) {} };
    } else if (ev.kind === "typing") {
      // Keyboard burst: 2-5 short noise taps in quick succession.
      const taps = 2 + Math.floor(Math.random() * 4);
      for (let i = 0; i < taps; i += 1) {
        const tt = t + i * (0.06 + Math.random() * 0.05);
        const buffer = makeNoiseBuffer(this.ctx, "white", 0.1);
        const src = this.ctx.createBufferSource();
        src.buffer = buffer;
        const f = this.ctx.createBiquadFilter();
        f.type = "bandpass";
        f.frequency.value = 2000;
        f.Q.value = 1.2;
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0, tt);
        g.gain.linearRampToValueAtTime(ev.gain, tt + 0.003);
        g.gain.exponentialRampToValueAtTime(0.0001, tt + 0.04);
        src.connect(f).connect(g).connect(destination);
        src.start(tt);
        src.stop(tt + 0.08);
        src.onended = () => { try { src.disconnect(); f.disconnect(); g.disconnect(); } catch (_) {} };
      }
    }
  }

  // Crossfade between beds. The outgoing bed ramps to silence (1.2s) then
  // is torn down; the incoming bed is built at zero gain and ramps up
  // (1.5s). Overlap is intentional — hard cuts break presence.
  crossfadeTo(config) {
    if (!this.ctx || !this.ambientBus) return;
    const t = this.ctx.currentTime;
    const fadeOut = 1.2;
    const fadeIn = 1.5;
    const previous = this.currentBed;
    if (previous) {
      try {
        previous.inputGain.gain.cancelScheduledValues(t);
        previous.inputGain.gain.setValueAtTime(previous.inputGain.gain.value, t);
        previous.inputGain.gain.linearRampToValueAtTime(0.0001, t + fadeOut);
      } catch (_) {}
      previous.timers.forEach((id) => clearTimeout(id));
      // Stop sources after fadeout; disconnect everything.
      setTimeout(() => {
        previous.nodes.forEach((node) => {
          try {
            if (node.stop) node.stop();
            node.disconnect();
          } catch (_) {}
        });
        try { previous.inputGain.disconnect(); } catch (_) {}
      }, (fadeOut + 0.2) * 1000);
    }
    this.currentBed = this.buildBed(config);
    if (this.currentBed) {
      try {
        this.currentBed.inputGain.gain.setValueAtTime(0.0001, t);
        this.currentBed.inputGain.gain.linearRampToValueAtTime(1, t + fadeIn);
      } catch (_) {}
    }
  }

  enterRoom(zoneId) {
    this.resume();
    this.currentZone = zoneId;
    const config = ROOM_AMBIENTS[zoneId];
    if (!config) {
      // Room without an authored bed: fade to silence so the BGM alone
      // carries the space. Better silence than a mismatched bed.
      this.crossfadeTo(null);
      return;
    }
    this.crossfadeTo(config);
    this.sfx?.enter?.();
  }

  exitRoom() {
    if (!this.ctx) return;
    this.currentZone = null;
    this.crossfadeTo(null);
  }

  playSfx(name) {
    this.resume();
    if (!this.sfx || !this.sfx[name]) return;
    try { this.sfx[name](); } catch (_) {}
  }

  setMuted(muted) {
    this.muted = !!muted;
    try { localStorage.setItem(STORAGE_MUTED_KEY, this.muted ? "1" : "0"); } catch (_) {}
    if (this.master && this.ctx) {
      const t = this.ctx.currentTime;
      try {
        this.master.gain.cancelScheduledValues(t);
        this.master.gain.setValueAtTime(this.master.gain.value, t);
        this.master.gain.linearRampToValueAtTime(this.muted ? 0 : 0.85, t + 0.2);
      } catch (_) {}
    }
  }

  isMuted() { return this.muted; }
  getCurrentZone() { return this.currentZone; }
}

const engine = new InteriorAudioEngine();
window.MirrorLifeInteriorAudio = {
  enterRoom: (zoneId) => engine.enterRoom(zoneId),
  exitRoom: () => engine.exitRoom(),
  playSfx: (name) => engine.playSfx(name),
  setMuted: (muted) => engine.setMuted(muted),
  isMuted: () => engine.isMuted(),
  getCurrentZone: () => engine.getCurrentZone(),
  resume: () => engine.resume()
};

// The audio module loads lazily alongside the 3D runtime, so on a player's
// FIRST room entry `enterRoom` is called before this module finishes loading
// (it is a safe no-op via optional chaining). Once we install, catch up by
// entering whichever room the player is already standing in — game.js sets
// body.interior-active + data-interior-zone synchronously during entry, so
// reading them here is reliable. If the player already left (or never
// entered), both signals are absent and we stay silent. This runs once.
if (document.body.classList.contains("interior-active") && document.body.dataset.interiorZone) {
  queueMicrotask(() => engine.enterRoom(document.body.dataset.interiorZone));
}

// Browsers block AudioContext until a user gesture. The lazy module load
// resolves AFTER the entry click's call stack has drained, so the context
// created in enterRoom() starts suspended. Resume it on the next pointer/
// key interaction. This listener only resumes an EXISTING suspended context
// — it never creates one — so it cannot start BGM on the map screen (where
// no context exists yet). It self-detaches once audio is running.
const unlockAudio = () => {
  if (engine.ctx && engine.ctx.state === "suspended") {
    engine.ctx.resume().catch(() => {});
  }
  if (engine.ctx && engine.ctx.state === "running") {
    document.removeEventListener("pointerdown", unlockAudio);
    document.removeEventListener("keydown", unlockAudio);
  }
};
document.addEventListener("pointerdown", unlockAudio, { passive: true });
document.addEventListener("keydown", unlockAudio, { passive: true });
