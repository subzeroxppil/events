/**
 * A fully synthesised, retro-arcade soundtrack for the draw: a ticking reel
 * while it spins, and a chiptune fanfare when it lands.
 *
 * Synthesised rather than sampled for the same reason as the start chime in
 * `retro-chime.ts` — the live page is opened by a hall full of phones on venue
 * wifi at the same moment, and this adds nothing to download. It also means
 * the reel's ticking can *decelerate with the reel*, which no fixed recording
 * can do: the tick rate is driven by the same ease-out curve the animation
 * uses, so the clicks slow down as the names do.
 *
 * Opt-in per screen via `?sound=arcade`; the default screens keep the mp3s.
 *
 * Everything here must be started from a user gesture — browsers hand back a
 * suspended AudioContext otherwise. `unlock()` is the hook for that.
 */

type AudioContextConstructor = typeof AudioContext;

function getAudioContextCtor(): AudioContextConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as Window &
    typeof globalThis & { webkitAudioContext?: AudioContextConstructor };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

/* ------------------------------------------------------------------ reel */

/** Clicks per second at the very start of the spin, and at the very end. */
const TICK_RATE_FAST = 24;
const TICK_RATE_SLOW = 2.5;
/** How sharply the tick rate decays. Mirrors the reel's ease-out. */
const TICK_DECAY = 2.6;

/** How far ahead of the clock blips are scheduled, and how often we top up. */
const LOOKAHEAD_S = 0.12;
const SCHEDULER_MS = 25;

export type ArcadeSound = {
  /** Call inside a user gesture before anything else. */
  unlock: () => Promise<void>;
  /** Start the reel ticking; `durationMs` lets it slow in step with the reel. */
  startSpin: (durationMs: number) => void;
  stopSpin: () => void;
  /** The win fanfare. */
  playWin: () => void;
  setMuted: (muted: boolean) => void;
  dispose: () => void;
};

export function createArcadeSound(): ArcadeSound | null {
  const Ctor = getAudioContextCtor();
  if (!Ctor) return null;

  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let muted = false;

  let schedulerTimer: ReturnType<typeof setInterval> | null = null;
  let spinStartedAt = 0;
  let spinDurationS = 0;
  let nextTickAt = 0;
  let tickIndex = 0;

  const ensure = (): AudioContext | null => {
    if (ctx) return ctx;
    try {
      ctx = new Ctor();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 1;
      master.connect(ctx.destination);
      return ctx;
    } catch {
      return null;
    }
  };

  /**
   * One reel click: a short square blip with a hard attack. Two alternating
   * pitches, which is what makes it read as a mechanical reel rather than a
   * stuck beep.
   */
  const scheduleTick = (at: number, index: number) => {
    if (!ctx || !master) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "square";
    osc.frequency.setValueAtTime(index % 2 === 0 ? 880 : 660, at);

    const len = 0.028;
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(0.09, at + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0008, at + len);

    osc.connect(gain);
    gain.connect(master);
    osc.start(at);
    osc.stop(at + len + 0.01);
  };

  /** Tick rate at progress `p`, decaying like the reel's own ease-out. */
  const rateAt = (p: number) =>
    TICK_RATE_SLOW +
    (TICK_RATE_FAST - TICK_RATE_SLOW) * Math.pow(1 - Math.min(p, 1), TICK_DECAY);

  const pump = () => {
    if (!ctx) return;
    const horizon = ctx.currentTime + LOOKAHEAD_S;
    // Guard against a runaway loop if the clock jumps.
    let scheduled = 0;
    while (nextTickAt < horizon && scheduled < 64) {
      const p = spinDurationS > 0 ? (nextTickAt - spinStartedAt) / spinDurationS : 1;
      scheduleTick(nextTickAt, tickIndex++);
      nextTickAt += 1 / rateAt(p);
      scheduled += 1;
    }
  };

  const stopScheduler = () => {
    if (schedulerTimer) {
      clearInterval(schedulerTimer);
      schedulerTimer = null;
    }
  };

  return {
    async unlock() {
      const c = ensure();
      if (!c) return;
      try {
        if (c.state === "suspended") await c.resume();
      } catch {
        // Still blocked; the screen stays usable, just silent.
      }
    },

    startSpin(durationMs: number) {
      const c = ensure();
      if (!c) return;
      // Resuming here too: on the admin screen the Spin press is the gesture,
      // and there may have been no earlier one.
      if (c.state === "suspended") void c.resume().catch(() => {});

      stopScheduler();
      spinStartedAt = c.currentTime;
      spinDurationS = Math.max(durationMs, 1) / 1000;
      nextTickAt = spinStartedAt;
      tickIndex = 0;

      pump();
      schedulerTimer = setInterval(pump, SCHEDULER_MS);
    },

    stopSpin() {
      stopScheduler();
    },

    /**
     * A rising arpeggio into a held major chord — the shape every arcade uses
     * to say "you won", kept short enough not to fight the winner overlay.
     */
    playWin() {
      const c = ensure();
      if (!c || !master) return;
      if (c.state === "suspended") void c.resume().catch(() => {});

      const t0 = c.currentTime + 0.02;

      // C5 E5 G5 C6 — the run up.
      const run = [523.25, 659.25, 783.99, 1046.5];
      run.forEach((freq, i) => {
        const at = t0 + i * 0.085;
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(freq, at);
        gain.gain.setValueAtTime(0, at);
        gain.gain.linearRampToValueAtTime(0.16, at + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, at + 0.16);
        osc.connect(gain);
        gain.connect(master!);
        osc.start(at);
        osc.stop(at + 0.18);
      });

      // The chord it lands on, slightly detuned per voice so it shimmers
      // rather than sounding like one flat beep.
      const chordAt = t0 + run.length * 0.085;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        [0, 3].forEach((cents) => {
          const osc = c.createOscillator();
          const gain = c.createGain();
          osc.type = i === 3 ? "triangle" : "square";
          osc.frequency.setValueAtTime(freq * Math.pow(2, cents / 1200), chordAt);
          gain.gain.setValueAtTime(0, chordAt);
          gain.gain.linearRampToValueAtTime(0.075, chordAt + 0.02);
          gain.gain.setValueAtTime(0.075, chordAt + 0.5);
          gain.gain.exponentialRampToValueAtTime(0.001, chordAt + 1.15);
          osc.connect(gain);
          gain.connect(master!);
          osc.start(chordAt);
          osc.stop(chordAt + 1.2);
        });
      });
    },

    setMuted(next: boolean) {
      muted = next;
      if (master && ctx) {
        master.gain.setTargetAtTime(next ? 0 : 1, ctx.currentTime, 0.01);
      }
    },

    dispose() {
      stopScheduler();
      const c = ctx;
      ctx = null;
      master = null;
      if (c) void c.close().catch(() => {});
    },
  };
}

/** `?sound=arcade` turns the synthesised soundtrack on. */
export function isArcadeSoundMode(value: string | null | undefined): boolean {
  return value === "arcade";
}
