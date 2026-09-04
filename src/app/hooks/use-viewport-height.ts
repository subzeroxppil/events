"use client";

import { useEffect } from "react";

/**
 * Sizes a full-screen, non-scrolling page to the area the browser is actually
 * showing, and locks the document against scrolling while it is mounted.
 *
 * There are two ways to ask how tall that area is, and each of them is wrong on
 * some browser at some moment:
 *
 *   - `100dvh` is the browser's own answer and is usually right, but it is
 *     recomputed as the chrome animates.
 *   - `visualViewport.height` is what is on screen this instant, but iOS
 *     reports it too small on a cold start — the address bar is compacted a
 *     moment after first paint and the property does not always follow, which
 *     left the page short by the height of a toolbar until switching apps and
 *     back forced a relayout.
 *
 * So take the larger of the two. That is deliberately asymmetric: a box that is
 * a few pixels too tall costs nothing, because the layout is a flex column with
 * safe-area padding at both ends and the footer sits inside it, whereas a box
 * that is too short leaves a visible band of nothing and pushes the content up
 * the screen. Under-reporting from either source is corrected by the other, and
 * only a source over-reporting could hurt — which neither does.
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
      [document, "visibilitychange"],
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
 * Belt and braces for the above: the page is a fixed box sized from a
 * measurement, and a measurement can briefly be wrong. Without this, being
 * short by even a frame shows as a band of the body's white — obvious against
 * every one of the skins. Painting the same background on the root makes any
 * such gap invisible rather than merely rare.
 */
export function useRootBackground(css: string | undefined) {
  useEffect(() => {
    if (!css) return;
    const root = document.documentElement;
    const { body } = document;
    const previous = {
      root: root.style.background,
      body: body.style.background,
    };

    root.style.background = css;
    body.style.background = css;

    return () => {
      root.style.background = previous.root;
      body.style.background = previous.body;
    };
  }, [css]);
}

/** Full-screen box that tracks the visible viewport. */
export const LIVE_VIEWPORT_STYLE = {
  height: "var(--live-vh, 100dvh)",
} as const;
