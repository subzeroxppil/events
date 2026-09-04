"use client";

import { useEffect } from "react";

/**
 * Locks the document against scrolling for a full-screen page, and publishes
 * `--live-vh`: the height `visualViewport` says is on screen right now.
 *
 * The height itself is not applied here. `.live-viewport` in globals.css takes
 * the largest of three independent answers — the layout viewport via
 * `inset: 0`, the browser's own `100dvh`, and this measurement — and each is
 * only ever allowed to raise the floor, never lower it. That matters because
 * every one of them is wrong on some browser at some moment:
 *
 *   - `100dvh` is usually right, but it is recomputed as the chrome animates
 *     and has been seen to settle short after a cold start.
 *   - `visualViewport.height` is what is on screen this instant, but iOS
 *     reports it too small on a cold start — the address bar is compacted a
 *     moment after first paint and the property does not always follow.
 *   - `inset: 0` never lags, being the browser's own layout viewport, but on
 *     iOS it stays at the toolbars-shown size while the toolbars are minimised.
 *
 * Taking the maximum is deliberately asymmetric. A box a few pixels too tall
 * costs nothing — the layout is a flex column with safe-area padding at both
 * ends — whereas a box too short leaves a visible band of bare page and pushes
 * the content up the screen, which was the bug this arrangement replaces. So
 * a source that under-reports is corrected by the other two, and a stale value
 * left behind by a backgrounded tab can no longer shrink the page on its own.
 */
export function useViewportHeight() {
  useEffect(() => {
    const root = document.documentElement;
    const { body } = document;

    const previous = {
      rootOverflow: root.style.overflow,
      bodyOverflow: body.style.overflow,
      overscroll: body.style.overscrollBehavior,
    };

    root.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.overscrollBehavior = "none";

    // Reports whatever `100dvh` currently resolves to. Measured off a probe
    // rather than the page itself, because the page's own height is the thing
    // being set here and would just report back what it was last told.
    // Collapses to 0 where dvh is unsupported, which the max() then ignores.
    const probe = document.createElement("div");
    probe.setAttribute("aria-hidden", "true");
    probe.style.cssText =
      "position:fixed;top:0;left:0;width:0;height:100dvh;" +
      "pointer-events:none;visibility:hidden;";
    body.appendChild(probe);

    const apply = () => {
      const dvh = probe.getBoundingClientRect().height;
      const visual = window.visualViewport?.height ?? 0;
      const height = Math.round(Math.max(dvh, visual)) || window.innerHeight;
      if (height <= 0) return;

      // Compared against what is actually set rather than a remembered value,
      // so the property is restored even if something else clobbers it.
      const next = `${height}px`;
      if (root.style.getPropertyValue("--live-vh") !== next) {
        root.style.setProperty("--live-vh", next);
      }
    };

    // Browsers resize their own chrome without always firing an event for it,
    // so after every signal keep re-reading for a few seconds. Polled rather
    // than run per-frame: each read forces a layout flush, and the reel is
    // animating.
    let settleUntil = 0;
    let settleTimer: ReturnType<typeof setInterval> | null = null;

    const stopSettling = () => {
      if (settleTimer !== null) {
        clearInterval(settleTimer);
        settleTimer = null;
      }
    };

    const nudge = () => {
      apply();
      settleUntil = performance.now() + 3000;
      if (settleTimer === null) {
        settleTimer = setInterval(() => {
          apply();
          if (performance.now() >= settleUntil) stopSettling();
        }, 120);
      }
    };

    nudge();

    const targets: [EventTarget | null | undefined, string][] = [
      [window.visualViewport, "resize"],
      [window.visualViewport, "scroll"],
      [window, "resize"],
      [window, "orientationchange"],
      // Returning from the app switcher or the bfcache.
      [window, "pageshow"],
      [window, "focus"],
      [window, "load"],
      // Chrome discards and thaws backgrounded tabs; both come back through
      // here, and a thawed tab is exactly where a stale measurement lives.
      [document, "visibilitychange"],
      [document, "resume"],
    ];
    for (const [target, event] of targets) {
      target?.addEventListener(event, nudge);
    }

    // Last resort for a chrome change that fires nothing at all.
    const safety = window.setInterval(apply, 1000);

    return () => {
      for (const [target, event] of targets) {
        target?.removeEventListener(event, nudge);
      }
      window.clearInterval(safety);
      stopSettling();
      probe.remove();

      root.style.overflow = previous.rootOverflow;
      body.style.overflow = previous.bodyOverflow;
      body.style.overscrollBehavior = previous.overscroll;
      root.style.removeProperty("--live-vh");
    };
  }, []);
}

/**
 * Paints `css` behind the document while the caller is mounted.
 *
 * Belt and braces for the above: `.live-viewport` covers the screen by
 * construction, but this makes the page underneath it the right colour anyway,
 * including in the moment before hydration.
 *
 * `base` is the solid colour the gradient ends on. Without it a gradient that
 * ends up shorter than the canvas *repeats* — the failure looked like a pale
 * band of near-white under the handheld skin, not the transparent gap you
 * would expect — so pin a colour under it and stop the tiling.
 */
export function useRootBackground(css: string | undefined, base?: string) {
  useEffect(() => {
    if (!css) return;
    const root = document.documentElement;
    const { body } = document;
    const previous = {
      root: root.style.background,
      body: body.style.background,
    };

    for (const el of [root, body]) {
      // The shorthand first: it resets colour and repeat, which the two lines
      // below then set deliberately.
      el.style.background = css;
      if (base) {
        el.style.backgroundColor = base;
        el.style.backgroundRepeat = "no-repeat";
      }
    }

    return () => {
      root.style.background = previous.root;
      body.style.background = previous.body;
    };
  }, [css, base]);
}

/**
 * Full-screen box that always covers at least the visible viewport.
 * Defined in globals.css — see the comment there for why it is a floor rather
 * than a height.
 */
export const LIVE_VIEWPORT_CLASS = "live-viewport";
