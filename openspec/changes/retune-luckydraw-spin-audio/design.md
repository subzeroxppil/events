## Context

Both draw screens build their own `Audio` objects from the same four files in `public/sounds/`, and both animate with a `requestAnimationFrame` loop driven by `duration` and `easeExponent`. The live page receives those two values inside `SpinPayload`, so admin timing already propagates to viewers; the settings defaults are the single place to change pacing.

Measured clip lengths:

```
spin4.mp3        10.89s   ← current spin bed
spin3.mp3        13.98s
spin2.wav        13.30s
celebrate.wav     2.04s
applause1.mp3     8.04s
```

## Goals / Non-Goals

**Goals:**
- Spin audio that covers any spin duration, present and future.
- An Enter unlock that is genuinely silent.
- A start chime that suits the pixel skins without adding a download.
- A slower, calmer reel on both screens.

**Non-Goals:**
- Reworking the settings Sheet or persisting settings.
- Changing `SpinPayload`, the SSE protocol, or the schema.
- Touching `/old-design`, which has its own inline audio and does not broadcast.

## Decisions

**Loop the existing clip rather than swapping to a longer one.**
Setting `loop = true` makes the bed independent of both the clip length and the spin duration, so a future timing change cannot reintroduce the silence. Swapping to `spin3.mp3` (13.98s) would still fall 4s short of the new 18s default. The fade-out handler clears `loop` when it begins so the clip cannot restart underneath the fade.

The clip is a slot-machine bed with no strong downbeat, so a seam at the loop point is not audible in a hall. Playback continues to start at `currentTime = 1` to skip the clip's lead-in; on repeat the browser restarts at 0, which is acceptable — that first second is quiet, not silent.

**Unlock with `muted = true`, not `volume = 0`.**
iOS Safari has historically ignored `volume` on media elements; `muted` is honoured everywhere. The loop also becomes concurrent (`Promise.all`) rather than sequential — the current `for…of` with `await` makes the bursts chain one after another, which is why the leak is so obvious.

**Synthesise the start chime with the Web Audio API.**
A three-note ascending square-wave arpeggio (C5–E5–G5, ~90ms each, ~0.4s total) built from `OscillatorNode` + `GainNode`. It needs no asset, adds no download to an audience of phones on venue wifi, is trivially tunable, and a square wave is exactly the timbre the pixel skins are reaching for. The same user gesture that unlocks the clips is what resumes the `AudioContext`, so no extra interaction is needed. If `AudioContext` is unavailable the chime is skipped silently — it is a nicety, never a gate on entering.

**Slow the reel via `duration` and `easeExponent`.**

```
              before      after
duration      14500ms  →  18000ms
easeExponent      4    →      3.2
```

`easeExponent` is the exponent on the ease-out: a lower value front-loads less of the travel, so the reel is less frantic at the start rather than merely longer overall. Both are already broadcast, so viewers inherit them with no protocol change. `soundFadeStartPercent` stays at 0.65, which with an 18s spin now begins the fade at 11.7s and finishes around 18s — with looping in place, that lands on the winner instead of on silence.

## Risks / Trade-offs

- **An 18s spin is a long time on stage.** It is a settings default, so an admin can shorten it live in the Sheet if it drags.
- **A loop seam may be faintly audible** on good headphones. In a hall over a PA it will not be; the alternative — silence — is far worse.
- **The chime is synthesised, so it will sound marginally different across browsers.** Oscillator output is well-specified; the variation is in output gain, and the chime is short and quiet enough that this does not matter.
