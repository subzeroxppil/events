/**
 * A short 8-bit "game start" chime, synthesised rather than downloaded.
 *
 * The live page is opened by a hall full of phones on venue wifi at the same
 * moment, so every byte not fetched is worth having — and a square wave is
 * exactly the timbre the pixel skins are reaching for anyway. Three rising
 * notes (C5-E5-G5) at ~90ms each, so the whole thing is under half a second
 * and cannot collide with the spin that follows.
 *
 * Must be called from a user gesture: browsers start an AudioContext
 * suspended, and only a gesture may resume it. That is the same constraint
 * that makes the live page's Enter button necessary in the first place.
 */

/** C5, E5, G5 — a major triad, unmistakably an "off you go" flourish. */
const NOTES_HZ = [523.25, 659.25, 783.99];
const NOTE_SECONDS = 0.09;
const PEAK_GAIN = 0.18;

type AudioContextConstructor = typeof AudioContext;

function getAudioContextCtor(): AudioContextConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as Window &
    typeof globalThis & { webkitAudioContext?: AudioContextConstructor };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

/**
 * Plays the chime. Never throws and never rejects — a missing or blocked
 * AudioContext just means no chime, which must not stop anyone entering.
 */
export async function playStartChime(): Promise<void> {
  const Ctor = getAudioContextCtor();
  if (!Ctor) return;

  let ctx: AudioContext;
  try {
    ctx = new Ctor();
  } catch {
    return;
  }

  try {
    // Safari hands back a suspended context even inside a gesture handler.
    if (ctx.state === "suspended") await ctx.resume();

    const startAt = ctx.currentTime;

    NOTES_HZ.forEach((frequency, i) => {
      const noteStart = startAt + i * NOTE_SECONDS;
      const noteEnd = noteStart + NOTE_SECONDS;

      const oscillator = ctx.createOscillator();
      oscillator.type = "square";
      oscillator.frequency.setValueAtTime(frequency, noteStart);

      // A hard square-wave edge clicks; ramping the gain in and out over a few
      // milliseconds is what makes it read as a chiptune note rather than a pop.
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, noteStart);
      gain.gain.linearRampToValueAtTime(PEAK_GAIN, noteStart + 0.008);
      gain.gain.setValueAtTime(PEAK_GAIN, noteEnd - 0.02);
      gain.gain.linearRampToValueAtTime(0, noteEnd);

      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(noteStart);
      oscillator.stop(noteEnd);
    });

    // Close once the last note has rung out, so we don't leak a context per
    // entry. Browsers cap how many a page may hold open.
    const totalMs = NOTES_HZ.length * NOTE_SECONDS * 1000;
    window.setTimeout(() => void ctx.close().catch(() => {}), totalMs + 150);
  } catch {
    void ctx.close().catch(() => {});
  }
}
