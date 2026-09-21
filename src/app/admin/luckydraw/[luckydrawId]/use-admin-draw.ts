"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import LuckyDrawSettings, {
  AnimationSettings,
  DEFAULT_SETTINGS,
} from "./LuckyDrawSettings";
import { useItemHeight } from "@/app/hooks/use-item-height";
import {
  backgroundStyleFor,
  createExtendedList,
  resolveColors,
  rouletteEasing,
  triggerFireworks as runFireworks,
} from "@/lib/luckydraw";
import {
  toViewSettings,
  DEFAULT_VIEW_SETTINGS,
  type ViewSettings,
} from "@/lib/luckydraw-settings";
import {
  isSpinPayload,
  resolveSpinProgress,
  type SpinClaimGranted,
  type SpinClaimRejected,
  type SpinPayload,
} from "@/lib/luckydraw-live";
import { useFirstOpenReload } from "@/lib/use-first-open-reload";
import {
  estimateClockOffset,
  refineOffset,
  type ClockOffset,
} from "@/lib/clock-sync";
import {
  createArcadeSound,
  isArcadeSoundMode,
  type ArcadeSound,
} from "@/lib/arcade-sound";

export type Winner = {
  workId: string;
  wonAt: string;
};

/**
 * A spin as this screen is going to run it.
 *
 * The same shape whether this admin claimed it or another admin did, so a
 * mirrored spin and a local one go through one animation path and cannot drift
 * apart in timing, easing or sound.
 */
type AdminSpin = {
  spinId: number;
  startAt?: number;
  spinnerItems: string[];
  winner: string;
  finalTarget: number;
  duration: number;
  easeExponent: number;
  /** The triggering admin's settings, so the spin is identical everywhere. */
  settings: ViewSettings;
  /** Did this screen claim it? Only the claimant records the winner. */
  owned: boolean;
};

export type LuckyDrawRecord = {
  id: number;
  name: string;
  eventIds: number[];
  createdAt: string;
  createdBy: string;
  viewOnlyEnabled: boolean;
};

/**
 * Everything the admin draw screen does that isn't pixels: loading the draw,
 * picking a winner, running the reel, recording the result and broadcasting
 * the spin to the public view-only page.
 *
 * Extracted from the page so the alternate skin under
 * `/admin/luckydraw/[id]/pixel` renders the same draw — the two screens can
 * differ in how they look, never in how they behave.
 */
export function useAdminDraw() {
  const params = useParams();
  const luckydrawId = Array.isArray(params?.luckydrawId)
    ? params.luckydrawId[0]
    : params?.luckydrawId;

  // The draw is run from this screen on the day of an event, usually opened
  // cold from a bookmark or a pasted link on a presentation machine — the same
  // kind of arrival the live page already spends one reload on. Placed before
  // the participants fetch so the discarded first load doesn't pay for a query.
  useFirstOpenReload("admin-reloaded:", luckydrawId);

  const router = useRouter();

  // `?sound=arcade` swaps the mp3s for the synthesised arcade soundtrack. Read
  // per screen rather than broadcast: which sound a viewer hears is their own
  // choice of URL, not something the admin imposes on the room.
  const searchParams = useSearchParams();
  const arcadeMode = isArcadeSoundMode(searchParams?.get("sound"));
  const arcade = useRef<ArcadeSound | null>(null);

  // Core states
  const [initialLoading, setInitialLoading] = useState(true);
  const [participants, setParticipants] = useState<string[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [luckyDraw, setLuckyDraw] = useState<LuckyDrawRecord | null>(null);
  const [error, setError] = useState("");
  const [currentWinner, setCurrentWinner] = useState<string | null>(null);
  const [showWinner, setShowWinner] = useState(false);

  // Animation settings
  const [animationSettings, setAnimationSettings] =
    useState<AnimationSettings>(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Corp ID to name mapping
  const [corpIdMapping, setCorpIdMapping] = useState<Record<string, string>>(
    {}
  );

  // Recomputed on resize/rotate rather than measured once.
  const itemHeight = useItemHeight();
  // Read from inside the rAF callback, which outlives the render that created
  // it — so rotating the device mid-spin is picked up by the running
  // animation rather than frozen at the pre-rotation row height. The live page
  // does the same.
  const itemHeightRef = useRef(itemHeight);
  useEffect(() => {
    itemHeightRef.current = itemHeight;
  }, [itemHeight]);

  const currentColors = useMemo(
    () => resolveColors(animationSettings),
    [animationSettings.useCustomColors, animationSettings.customColors]
  );

  // Public view-only page toggle. It doubles as the mode switch: off means a
  // single admin spinning instantly on their own, on means the spin is shared
  // with every other screen and has to be scheduled and arbitrated.
  const [viewOnlyEnabled, setViewOnlyEnabled] = useState(false);

  // True from the click until the claimed spin actually starts — the ~700ms
  // the room needs to receive the schedule. Drives the button's busy state.
  const [claimPending, setClaimPending] = useState(false);

  // A spin is claimed or running *somewhere* — this screen or another admin's.
  // `isSpinning` only covers the reel actually moving, which leaves the lead
  // window: without this the Spin button looks live during the very seconds
  // it is guaranteed to be refused.
  const [spinBusy, setSpinBusy] = useState(false);

  // Difference between this device's clock and the server's, estimated from
  // the half round-trip of the claim, exactly as the live page does it. Every
  // screen schedules against server time, so a laptop whose clock is out by a
  // few seconds would otherwise spin seconds away from the room.
  const clockOffsetRef = useRef(0);
  /** The sample behind `clockOffsetRef`, so only a better one replaces it. */
  const clockSampleRef = useRef<ClockOffset | null>(null);
  /** A claimed spin waiting for its scheduled moment. */
  const pendingSpinRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Spins already run, so this screen ignores the echo of its own claim. */
  const lastSpinIdRef = useRef(0);
  /** Set while a spin this screen claimed is running. */
  const ownedSpinRef = useRef(false);
  /**
   * `animateSpin` is declared further down and is rebuilt when the row height
   * changes. Reached through a ref so `startSpin` — which is memoised on far
   * less — can never call into a version built for a stale row height.
   */
  const animateSpinRef = useRef<((spin: AdminSpin) => void) | null>(null);
  /**
   * `handleSpinComplete` is declared further down; reached through a ref so the
   * scheduler above can bank a winner for a spin that was already over by the
   * time this screen heard its claim was granted.
   */
  const handleSpinCompleteRef = useRef<
    | ((winner: string, spinSettings: ViewSettings, owned: boolean) => void)
    | null
  >(null);

  // Vertical spinner states
  const [spinnerItems, setSpinnerItems] = useState<string[]>([]);
  const [centerIndex, setCenterIndex] = useState(0);
  const [animationOffset, setAnimationOffset] = useState(0);
  const animationRef = useRef<number | null>(null);
  const idleAnimationRef = useRef<number | null>(null);
  const [isIdleAnimating, setIsIdleAnimating] = useState(false);

  useEffect(() => {
    if (!arcadeMode) return;
    arcade.current = createArcadeSound();
    return () => {
      arcade.current?.dispose();
      arcade.current = null;
    };
  }, [arcadeMode]);

  // Audio refs
  //
  // `spinLock` guards the Spin button against being spammed. `isSpinning` is
  // state, so two clicks in the same tick both read it as false and both start
  // a spin — which is how the spin sound came to be layered over itself. A ref
  // updates synchronously, so the second click sees the lock immediately.
  const spinLock = useRef(false);
  /** The running spin-sound fade, so a finished spin can cancel it. */
  const fadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const spinSound = useRef<HTMLAudioElement | null>(null);
  const celebrateSound = useRef<HTMLAudioElement | null>(null);
  const applauseSound = useRef<HTMLAudioElement | null>(null);

  /**
   * Put the reel in motion for a spin that is due now.
   *
   * Split out of `handleSpin` because in synced mode none of this may happen
   * at click time: the screen keeps drifting idle through the lead and only
   * commits to the spin when the shared moment arrives.
   */
  const startSpin = useCallback(
    (spin: AdminSpin) => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      if (idleAnimationRef.current) {
        cancelAnimationFrame(idleAnimationRef.current);
        idleAnimationRef.current = null;
      }
      setIsIdleAnimating(false);

      setSpinnerItems(spin.spinnerItems);
      setIsSpinning(true);
      setShowWinner(false);
      setError("");
      setClaimPending(false);
      ownedSpinRef.current = spin.owned;

      // Cancel any fade still running from a previous spin, or it will keep
      // winding this spin's volume down.
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
        fadeIntervalRef.current = null;
      }

      if (spin.settings.enableSounds) {
        if (arcadeMode) {
          // The synth ticks in step with the reel, so it needs the duration.
          arcade.current?.startSpin(spin.duration);
        } else if (spinSound.current) {
          // Plays the same stretch of spin4.mp3 the draw has always used: from
          // 1s in, once, no looping. The clip is shorter than the spin and that
          // is deliberate — only this part of it is wanted.
          spinSound.current.pause();
          spinSound.current.loop = false;
          spinSound.current.currentTime = 1;
          spinSound.current.volume = 1;
          void spinSound.current.play().catch(() => {});
        }
      }

      setCenterIndex(0);
      setAnimationOffset(0);

      animateSpinRef.current?.(spin);
    },
    [arcadeMode]
  );

  /**
   * Place a spin on the shared timeline.
   *
   * A spin carries the instant it is to begin, not an instruction to begin
   * now. A screen holding it early waits out the lead still drifting idle; one
   * that got it late joins part way in; one that got it far too late settles
   * where the reel would have stopped. All three land together, which is the
   * moment the room is actually watching for.
   */
  const scheduleSpin = useCallback(
    (spin: AdminSpin) => {
      if (pendingSpinRef.current) {
        clearTimeout(pendingSpinRef.current);
        pendingSpinRef.current = null;
      }

      const progress = resolveSpinProgress(
        spin,
        Date.now() + clockOffsetRef.current
      );

      if (progress.phase === "finished") {
        // Nothing left to animate. Put the reel where that spin ended so this
        // screen isn't left showing a stale row, and free the button.
        const itemsLength = spin.spinnerItems.length || 1;
        const whole = Math.floor(spin.finalTarget);
        setSpinnerItems(spin.spinnerItems);
        setCenterIndex(whole % itemsLength);
        setAnimationOffset((spin.finalTarget - whole) * itemHeight);
        setIsSpinning(false);
        setClaimPending(false);
        setSpinBusy(false);
        spinLock.current = false;
        ownedSpinRef.current = false;

        // A spin this screen *claimed* still has to bank its winner, even
        // though there was nothing left to animate by the time we got here.
        // Reachable when the claim succeeded on the server but its reply took
        // longer than the spin to come back: the room watched the reel land
        // perfectly, and without this the name it landed on is never recorded.
        if (spin.owned) {
          void handleSpinCompleteRef.current?.(
            spin.winner,
            spin.settings,
            true
          );
        }
        return;
      }

      if (progress.phase === "pending") {
        pendingSpinRef.current = setTimeout(() => {
          pendingSpinRef.current = null;
          startSpin(spin);
        }, progress.waitMs);
        return;
      }

      startSpin(spin);
    },
    [itemHeight, startSpin]
  );

  const handleSpin = useCallback(async () => {
    if (spinLock.current || isSpinning || participants.length === 0) return;
    spinLock.current = true;

    // Prime the celebration clips inside the click. They are only ever played
    // ~13s later, from a rAF callback rather than a gesture handler, which is
    // why the winner sound could silently fail to start — priming them here,
    // muted, is what guarantees they are allowed to play when the reel lands.
    for (const ref of [celebrateSound, applauseSound]) {
      const audio = ref.current;
      if (!audio) continue;
      const wasMuted = audio.muted;
      audio.muted = true;
      void audio
        .play()
        .then(() => {
          audio.pause();
          audio.currentTime = 0;
        })
        .catch(() => {})
        .finally(() => {
          audio.muted = wasMuted;
        });
    }

    // Build the reel and pick the winner. In synced mode this is still only a
    // *proposal* — another admin may have claimed the spin first, in which
    // case all of it is thrown away and their winner is the one that runs.
    const newSpinnerItems = createExtendedList(
      participants,
      animationSettings.spinnerItemCount
    );

    let winnerIndex = -1;
    const availableIndices = [];

    for (let i = 0; i < newSpinnerItems.length; i++) {
      if (!winners.some((w) => w.workId === newSpinnerItems[i])) {
        availableIndices.push(i);
      }
    }

    if (availableIndices.length > 0) {
      winnerIndex =
        availableIndices[Math.floor(Math.random() * availableIndices.length)];
    } else {
      winnerIndex = Math.floor(newSpinnerItems.length / 2);
    }

    const intendedWinner = newSpinnerItems[winnerIndex];

    const totalItems = newSpinnerItems.length;
    const spins =
      animationSettings.minSpins +
      Math.random() * (animationSettings.maxSpins - animationSettings.minSpins);
    const baseTarget = Math.floor(spins) * totalItems + winnerIndex;

    const randomOffset = Math.random() * 0.9;
    const finalTarget = baseTarget + randomOffset;

    const proposal = {
      spinnerItems: newSpinnerItems,
      winner: intendedWinner,
      winnerIndex,
      finalTarget,
      duration: animationSettings.duration,
      easeExponent: animationSettings.easeExponent,
      settings: toViewSettings(animationSettings),
    };

    // ---- solo: the view-only link is off, so this is the only screen there
    // is. Spin immediately, exactly as the draw has always done — nothing to
    // synchronise with, and no reason to make the presenter wait.
    if (!viewOnlyEnabled) {
      setSpinBusy(true);
      startSpin({ ...proposal, spinId: Date.now(), owned: true });
      return;
    }

    // ---- synced: claim the spin, then run it on the schedule the server
    // grants, at the same instant as every other screen in the room.
    setClaimPending(true);
    setSpinBusy(true);
    // Snapshot what this screen had seen before asking. If it moves while the
    // claim is in flight, a spin from another admin arrived and now owns this
    // screen — checked through a ref because state captured before the await
    // would be stale by the time the answer lands.
    const seenBeforeClaim = lastSpinIdRef.current;
    try {
      const res = await fetch(`/api/admin/luckydraw/${luckydrawId}/spin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(proposal),
      });

      if (!res.ok) {
        // Lost the race, or the draw stopped being live. Drop this reel and
        // this winner on the floor; the spin that did win is already on its
        // way down the stream and will run here like any other.
        const rejection: SpinClaimRejected = await res
          .json()
          .catch(() => ({ message: "Spin rejected", inFlightSpinId: 0 }));
        if (res.status !== 409) {
          setError(rejection.message || "Could not start the spin");
        } else if (!rejection.inFlightSpinId) {
          // A 409 with nobody named is not a lost race — it is the server
          // saying this draw is not shared. Silence would leave the admin
          // pressing a button that does nothing.
          toast.error(rejection.message || "This draw is no longer live");
        }
        setClaimPending(false);

        // Release the button only if this screen isn't already holding the
        // spin that beat us. The winner's spin and our rejection race down two
        // different connections, and when the spin arrives first it has
        // already taken the lock — clearing it here would re-enable Spin in
        // the middle of a spin this screen is about to run.
        const alreadyMirroring =
          lastSpinIdRef.current !== seenBeforeClaim ||
          pendingSpinRef.current !== null;
        if (!alreadyMirroring) {
          setSpinBusy(false);
          spinLock.current = false;
        }
        return;
      }

      const granted: SpinClaimGranted = await res.json();

      // Deliberately NOT used to adjust the clock estimate, even though it
      // carries a `serverNow`. The handler reads that clock *after* its
      // database write, so the reading sits near the end of the request
      // rather than at its midpoint — the assumption every round-trip
      // estimate rests on. It is a biased sample that can still look good on
      // round-trip time, and letting it win put the claiming screen half a
      // second behind the room it had just scheduled. `/api/live/<id>/time`
      // does no work before reading the clock, which is the whole point of it.

      // This spin will come back down the stream in a moment. Mark it seen so
      // the echo of our own claim doesn't start it a second time.
      lastSpinIdRef.current = Math.max(lastSpinIdRef.current, granted.spinId);

      scheduleSpin({
        ...proposal,
        spinId: granted.spinId,
        startAt: granted.startAt,
        owned: true,
      });
    } catch (err) {
      console.error("Failed to claim spin:", err);
      setError("Could not reach the server to start the spin");
      setClaimPending(false);
      setSpinBusy(false);
      spinLock.current = false;
    }
  }, [
    isSpinning,
    participants,
    winners,
    animationSettings,
    viewOnlyEnabled,
    luckydrawId,
    startSpin,
    scheduleSpin,
  ]);

  // Initialize audio. Deliberately kept separate from the F5 handler below:
  // `handleSpin` changes identity on every winner/settings change, and tying
  // the Audio objects to it tore them down and rebuilt them each time.
  useEffect(() => {
    window.scrollTo(0, document.body.scrollHeight);

    if (typeof Audio !== "undefined") {
      spinSound.current = new Audio("/sounds/spin4.mp3");
      celebrateSound.current = new Audio("/sounds/celebrate.wav");
      applauseSound.current = new Audio("/sounds/applause1.mp3");

      // Preload audio
      if (spinSound.current) spinSound.current.load();
      if (celebrateSound.current) celebrateSound.current.load();
      if (applauseSound.current) applauseSound.current.load();
    }

    return () => {
      document.body.style.overflow = "auto";

      // Cleanup audio
      if (spinSound.current) spinSound.current = null;
      if (celebrateSound.current) celebrateSound.current = null;
      if (applauseSound.current) applauseSound.current = null;
    };
  }, []);

  // ------------------------------------------------------------------- SSE
  //
  // In synced mode this screen is a participant in the draw, not just its
  // driver: it watches the same stream the audience does, so a spin another
  // admin claimed runs here too, and the winners list stays current instead
  // of frozen at whatever it held when the page was opened.
  //
  // It reuses the public stream rather than an admin-only one. The stream
  // carries exactly what is needed and is already gated on `viewOnlyEnabled`
  // — the same condition under which admin mirroring is wanted — so a second
  // route would duplicate the hub wiring and gate on the identical thing.
  const scheduleSpinRef = useRef(scheduleSpin);
  useEffect(() => {
    scheduleSpinRef.current = scheduleSpin;
  }, [scheduleSpin]);

  useEffect(() => {
    if (!luckydrawId || !viewOnlyEnabled) return;

    const source = new EventSource(`/api/live/${luckydrawId}/stream`);

    source.addEventListener("init", (e) => {
      try {
        const data = JSON.parse((e as MessageEvent).data);
        if (Array.isArray(data.winners)) setWinners(data.winners);
        if (typeof data.lastSpinId === "number") {
          lastSpinIdRef.current = Math.max(
            lastSpinIdRef.current,
            data.lastSpinId
          );
        }
      } catch (err) {
        console.error("Bad init event:", err);
      }
    });

    source.addEventListener("spin", (e) => {
      let tookLock = false;
      try {
        const payload: SpinPayload = JSON.parse((e as MessageEvent).data);
        // Covers both a spin already run and the echo of this screen's own
        // claim, which was marked seen the moment the server granted it.
        if (payload.spinId <= lastSpinIdRef.current) return;
        // A malformed payload must be rejected before it can take the lock,
        // or a single bad frame kills the Spin button for the rest of the
        // event.
        if (!isSpinPayload(payload) || !Array.isArray(payload.spinnerItems)) {
          console.error("Ignoring malformed spin payload", payload);
          return;
        }
        lastSpinIdRef.current = payload.spinId;

        // Another admin's spin. Take the lock so this screen cannot claim one
        // over the top of it, and run it exactly as they will — but without
        // owning it, so the winner is recorded once, by them.
        spinLock.current = true;
        tookLock = true;
        setSpinBusy(true);
        scheduleSpinRef.current({
          spinId: payload.spinId,
          startAt: payload.startAt,
          spinnerItems: payload.spinnerItems,
          winner: payload.winner,
          finalTarget: payload.finalTarget,
          duration: payload.duration,
          easeExponent: payload.easeExponent,
          // Used to render this spin only. Deliberately NOT written into this
          // admin's own settings: one admin's panel is theirs, and having it
          // rewritten under them by someone else's spin would be its own bug.
          settings: payload.settings ?? DEFAULT_VIEW_SETTINGS,
          owned: false,
        });
      } catch (err) {
        console.error("Bad spin event:", err);
        // Hand the button back. Without this, anything thrown downstream
        // leaves `spinLock` held and Spin dead until the page is reloaded.
        if (tookLock) {
          spinLock.current = false;
          setSpinBusy(false);
        }
      }
    });

    source.addEventListener("winners", (e) => {
      try {
        const data = JSON.parse((e as MessageEvent).data);
        if (Array.isArray(data.winners)) setWinners(data.winners);
      } catch (err) {
        console.error("Bad winners event:", err);
      }
    });

    // The toggle went off somewhere else: the draw is back to solo, so stop
    // listening rather than holding a stream that will never speak again.
    source.addEventListener("offline", () => {
      source.close();
      setViewOnlyEnabled(false);
    });

    return () => source.close();
    // `scheduleSpin` is reached through a ref so a settings change cannot tear
    // the stream down and rebuild it mid-draw.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [luckydrawId, viewOnlyEnabled]);

  // Notice the draw going live from another screen.
  //
  // Without this, an admin who opened the page before the live link was turned
  // on would sit in solo mode for the rest of the event — no stream, no
  // mirrored spins — while believing they were watching the draw. Only runs
  // while the link is off, and stops the moment it goes on.
  useEffect(() => {
    if (!luckydrawId || viewOnlyEnabled) return;

    let cancelled = false;
    const check = async () => {
      try {
        const res = await fetch(
          `/api/admin/luckydraw/${luckydrawId}/viewonly`
        );
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (!cancelled && data?.viewOnlyEnabled) setViewOnlyEnabled(true);
      } catch {
        // Offline for a moment; the next tick tries again.
      }
    };

    // Leading call as well as the interval: a page opened moments after
    // someone else enabled the link should join the synced draw now, not in
    // five seconds.
    void check();
    const timer = setInterval(check, 5000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [luckydrawId, viewOnlyEnabled]);

  // Keep the clock estimate honest — see the same effect on the live page.
  // The admin screen needs this just as much: it schedules the spin the whole
  // room runs, so if its own clock estimate is out, it is out on the one
  // screen the presenter is watching.
  useEffect(() => {
    if (!luckydrawId) return;
    let cancelled = false;

    const sync = async () => {
      const sample = await estimateClockOffset(
        `/api/live/${luckydrawId}/time`
      );
      if (cancelled || !sample) return;
      clockSampleRef.current = refineOffset(clockSampleRef.current, sample);
      clockOffsetRef.current = clockSampleRef.current.offsetMs;
    };

    void sync();
    const timer = setInterval(() => {
      clockSampleRef.current = null;
      void sync();
    }, 120_000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [luckydrawId]);

  // A spin waiting on its scheduled moment must not fire into a torn-down
  // screen.
  useEffect(() => {
    return () => {
      if (pendingSpinRef.current) clearTimeout(pendingSpinRef.current);
    };
  }, []);

  // Presenter clickers send F5 — use it to trigger the spin.
  useEffect(() => {
    const handleF5KeyPress = (e: KeyboardEvent) => {
      if (e.key === "F5") {
        e.preventDefault(); // Prevent page refresh
        handleSpin();
      }
    };

    document.addEventListener("keydown", handleF5KeyPress);
    return () => document.removeEventListener("keydown", handleF5KeyPress);
  }, [handleSpin]);

  // Fetch lucky draw data
  useEffect(() => {
    if (!luckydrawId) return;
    fetchLuckyDrawData();
  }, [luckydrawId]);

  const fetchLuckyDrawData = async () => {
    try {
      const res = await fetch(`/api/admin/luckydraw/${luckydrawId}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch data");
      }

      setLuckyDraw(data.luckyDraw);
      setViewOnlyEnabled(Boolean(data.luckyDraw?.viewOnlyEnabled));

      // Fetch corp ID mapping based on lucky draw name
      if (data.luckyDraw?.name) {
        try {
          const mappingRes = await fetch(
            `/api/admin/luckydraw/corpid-name-mapping?name=${encodeURIComponent(
              data.luckyDraw.name
            )}`
          );
          const mappingData = await mappingRes.json();

          if (mappingRes.ok && mappingData.mapping) {
            setCorpIdMapping(mappingData.mapping);
          }
        } catch (err) {
          console.warn("Failed to fetch corp ID mapping:", err);
          // Continue without mapping if it fails
        }
      }

      const uniqueParticipants = Array.from(
        new Set(data.participants)
      ) as string[];

      // Keep all participants in the UI - don't filter out winners
      setParticipants(uniqueParticipants);

      const extendedList = createExtendedList(
        uniqueParticipants,
        animationSettings.spinnerItemCount
      );
      setSpinnerItems(extendedList);

      setCenterIndex(0);
      setAnimationOffset(0);

      if (data.winners && Array.isArray(data.winners)) {
        setWinners(data.winners);
      }
    } catch (err: any) {
      setError("Failed to load data.");
      console.error(err);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleDeleteLuckyDraw = async () => {
    if (!luckydrawId) return;

    try {
      setDeleteLoading(true);
      const res = await fetch(`/api/admin/luckydraw/${luckydrawId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete lucky draw");

      router.push("/admin/luckydraw");
      toast.success("Lucky draw deleted");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error deleting lucky draw");
    } finally {
      setDeleteLoading(false);
    }
  };

  /**
   * Run the reel for a spin.
   *
   * Everything it needs comes off the spin itself rather than this screen's
   * own settings — a spin claimed by another admin must look, last and sound
   * the way *they* set it, or the reels would land at different moments.
   */
  const animateSpin = useCallback(
    (spin: AdminSpin) => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }

      const { duration, winner, settings: spinSettings } = spin;
      const itemsArray = spin.spinnerItems;
      const toIndex = spin.finalTarget;
      let soundFading = false;
      const totalIndices = toIndex;

      // Progress is read off the shared schedule every frame, never
      // accumulated locally: a screen that came in late is already part way
      // through, and a throttled tab catches up instead of finishing late.
      const localStart = Date.now();
      const elapsedNow = () =>
        spin.startAt === undefined
          ? Date.now() - localStart
          : Math.max(0, Date.now() + clockOffsetRef.current - spin.startAt);

      const animate = () => {
        const elapsed = elapsedNow();
        const progress = Math.min(elapsed / duration, 1);

        const easeOut = rouletteEasing(progress, spin.easeExponent);
        const currentProgress = totalIndices * easeOut;

        const wholeIndex = Math.floor(currentProgress);
        const fractionalPart = currentProgress - wholeIndex;

        setCenterIndex(wholeIndex % itemsArray.length);
        setAnimationOffset(fractionalPart * itemHeightRef.current);

        // Fade out sound
        const autoSoundFadeStart = spinSettings.soundFadeStartPercent;
        const autoSoundFadeDuration = spinSettings.soundFadeDuration;

        if (
          !arcadeMode &&
          spinSound.current &&
          spinSettings.enableSounds &&
          progress > autoSoundFadeStart &&
          !soundFading
        ) {
          soundFading = true;
          const fadeOutDurationMs = duration * autoSoundFadeDuration;
          const steps = 20;
          const stepMs = Math.max(16, Math.floor(fadeOutDurationMs / steps));
          const decrement = 1 / steps;
          const fadeInterval = setInterval(() => {
            if (spinSound.current) {
              spinSound.current.volume = Math.max(
                0,
                spinSound.current.volume - decrement
              );
              if (spinSound.current.volume <= 0) {
                spinSound.current.pause();
                spinSound.current.currentTime = 0;
                spinSound.current.volume = 1;
                clearInterval(fadeInterval);
                fadeIntervalRef.current = null;
              }
            } else {
              clearInterval(fadeInterval);
              fadeIntervalRef.current = null;
            }
          }, stepMs);
          // Held so the end of the spin can cancel a fade still in flight —
          // otherwise it goes on winding the volume down into the next spin.
          fadeIntervalRef.current = fadeInterval;
        }

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          const wholeIndex = Math.floor(toIndex);
          const fractionalPart = toIndex - wholeIndex;

          setCenterIndex(wholeIndex % itemsArray.length);
          setAnimationOffset(fractionalPart * itemHeightRef.current);

          handleSpinComplete(winner, spinSettings, spin.owned);
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    },
    [arcadeMode]
  );

  useEffect(() => {
    animateSpinRef.current = animateSpin;
  }, [animateSpin]);

  const handleSpinComplete = useCallback(
    async (winner: string, spinSettings: ViewSettings, owned: boolean) => {
      setCurrentWinner(winner);

      // A fade may still be mid-flight; it must not survive into the
      // celebration and mute the next spin.
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
        fadeIntervalRef.current = null;
      }

      // Stop spin sound
      if (spinSound.current) {
        spinSound.current.loop = false;
        spinSound.current.pause();
        spinSound.current.currentTime = 0;
        spinSound.current.volume = 1;
      }
      arcade.current?.stopSpin();

      // Play celebration sounds. Unmuted explicitly because the priming in
      // handleSpin leaves them muted for a moment, and a spin can finish
      // before that has been undone.
      if (arcadeMode) {
        if (spinSettings.enableSounds) arcade.current?.playWin();
      } else if (spinSettings.enableSounds) {
        for (const ref of [celebrateSound, applauseSound]) {
          const audio = ref.current;
          if (!audio) continue;
          audio.muted = false;
          audio.volume = 1;
          audio.currentTime = 0;
          void audio.play().catch((err) => {
            console.warn("Winner sound blocked:", err);
          });
        }
      }

      // Trigger effects. Guarded so a confetti failure cannot leave the spin
      // lock held and the Spin button dead for the rest of the event.
      if (spinSettings.enableFireworks) {
        try {
          // Driven by the spin's own settings rather than this screen's. Two
          // reasons: a mirrored spin should look the way the admin who ran it
          // set it up, and going through a `useCallback` that closes over
          // `animationSettings` would pin the burst to whatever those were on
          // first render — this callback is memoised on values that never
          // change, so it would never have picked up an edit.
          runFireworks(confetti, spinSettings);
        } catch (error) {
          console.error("Fireworks failed:", error);
        }
      }
      setShowWinner(true);
      setIsSpinning(false);
      setSpinBusy(false);
      spinLock.current = false;
      ownedSpinRef.current = false;

      // Record the winner — but only on the screen that claimed this spin.
      // Every mirroring admin reaches this same point with the same winner,
      // and if they all wrote, one spin would bank three identical winners.
      // The claim in `POST /spin` is what decided which screen that is.
      //
      // Written here at the end rather than at claim time so a spin that is
      // abandoned mid-flight leaves nothing behind. The cost is the reverse
      // case: a browser that dies during the reel loses the winner. That is
      // how the draw has always behaved, and banking a winner the room never
      // saw revealed would be the worse of the two.
      //
      // Deliberately *after* the reveal, and not awaited before it. The
      // mirroring screens have no winner to write, so they reveal the moment
      // the reel lands; if this screen waited for the database first it would
      // announce the winner however long that write took — measured at six
      // seconds against a cold remote database — leaving the presenter's own
      // screen the last in the room to show the name it just drew.
      // Fold the winner into this screen's own list immediately — on every
      // screen, not just the one that writes it.
      //
      // The next spin excludes past winners using this list, and a mirroring
      // admin otherwise only learns of it from the stream's `winners` event,
      // which the hub polls lazily and can be several seconds late. In that
      // gap a mirroring admin who spins again could draw the same person: the
      // room would watch the reel land on a name that had already won, and the
      // write would be refused with nobody told. The stream remains the source
      // of truth and reconciles this shortly either way.
      // Note: we don't remove the winner from participants - they stay visible but can't win again
      setWinners((prev) =>
        prev.some((w) => w.workId === winner)
          ? prev
          : [...prev, { workId: winner, wonAt: new Date().toISOString() }]
      );

      if (owned) {
        void (async () => {
          try {
            const response = await fetch(
              `/api/admin/luckydraw/${luckydrawId}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ workId: winner }),
              }
            );

            if (!response.ok) {
              // Surfaced rather than swallowed: the room has just watched this
              // name come up, so "it didn't save" is something the person
              // running the draw has to know about while they can still act.
              const detail = await response
                .json()
                .catch(() => null as { message?: string } | null);
              console.error("Failed to record winner:", response.status, detail);
              toast.error(detail?.message || "Could not record that winner");
            }
          } catch (error) {
            console.error("Error recording winner:", error);
            toast.error("Could not record that winner");
          }
        })();
      }

      // Auto-hide winner
      setTimeout(() => {
        setShowWinner(false);
      }, spinSettings.winnerDisplayDuration);
    },
    [luckydrawId, arcadeMode]
  );

  useEffect(() => {
    handleSpinCompleteRef.current = handleSpinComplete;
  }, [handleSpinComplete]);

  const handleDeleteWinner = useCallback(
    async (winnerWorkId: string) => {
      try {
        const response = await fetch(`/api/admin/luckydraw/${luckydrawId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workId: winnerWorkId }),
        });

        if (response.ok) {
          setWinners((prev) => prev.filter((w) => w.workId !== winnerWorkId));
          // Note: We don't need to add back to participants since they were never removed
          toast.success("Winner removed");
        } else {
          toast.error("Failed to remove winner");
        }
      } catch (error) {
        console.error("Error removing winner:", error);
        toast.error("Failed to remove winner");
      }
    },
    [luckydrawId]
  );

  // Idle animation
  useEffect(() => {
    if (!isSpinning && spinnerItems.length > 0 && !showWinner) {
      setIsIdleAnimating(true);
      let accumulatedOffset = animationOffset;
      let lastTime = performance.now();

      const animateIdle = () => {
        if (isSpinning || showWinner || spinnerItems.length === 0) {
          setIsIdleAnimating(false);
          return;
        }

        const now = performance.now();
        const delta = (now - lastTime) / 1000;
        lastTime = now;

        accumulatedOffset += animationSettings.idleSpeed * delta;

        if (accumulatedOffset >= itemHeight) {
          setCenterIndex((prev) => (prev + 1) % spinnerItems.length);
          accumulatedOffset = accumulatedOffset % itemHeight;
        }

        setAnimationOffset(accumulatedOffset);

        idleAnimationRef.current = requestAnimationFrame(animateIdle);
      };

      idleAnimationRef.current = requestAnimationFrame(animateIdle);
    } else {
      setIsIdleAnimating(false);
    }

    return () => {
      if (idleAnimationRef.current) {
        cancelAnimationFrame(idleAnimationRef.current);
        idleAnimationRef.current = null;
      }
      setIsIdleAnimating(false);
    };
  }, [
    isSpinning,
    spinnerItems.length,
    showWinner,
    animationSettings.idleSpeed,
    itemHeight,
  ]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (idleAnimationRef.current) {
        cancelAnimationFrame(idleAnimationRef.current);
      }
    };
  }, []);

  // Dynamic background style based on settings
  const backgroundStyle = useMemo(() => backgroundStyleFor(animationSettings), [
    animationSettings.backgroundMode,
    animationSettings.backgroundSolidColor,
    animationSettings.backgroundGradientAngle,
    animationSettings.backgroundGradientFrom,
    animationSettings.backgroundGradientTo,
  ]);

  return {
    // identity
    luckydrawId,
    luckyDraw,
    // load state
    initialLoading,
    error,
    // draw data
    participants,
    winners,
    corpIdMapping,
    // reel
    spinnerItems,
    centerIndex,
    animationOffset,
    itemHeight,
    isSpinning,
    isIdleAnimating,
    currentWinner,
    showWinner,
    // presentation
    animationSettings,
    setAnimationSettings,
    currentColors,
    backgroundStyle,
    // controls
    handleSpin,
    handleDeleteWinner,
    handleDeleteLuckyDraw,
    deleteLoading,
    showSettings,
    setShowSettings,
    viewOnlyEnabled,
    setViewOnlyEnabled,
    // sync mode — what the Spin control needs to explain itself
    /** The draw is shared: spins are scheduled and arbitrated across screens. */
    syncedMode: viewOnlyEnabled,
    /** Claimed, waiting out the lead before the room starts together. */
    claimPending,
    /** A spin is claimed or running, here or on another admin's screen. */
    spinBusy,
  };
}

export type AdminDraw = ReturnType<typeof useAdminDraw>;
