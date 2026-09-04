"use client";

import { useEffect } from "react";

/**
 * Publishes the height of the *visible* viewport as `--live-vh`, and locks the
 * document against scrolling for as long as the caller is mounted.
 *
 * `100dvh` gets close, but on Chrome for Android the bottom toolbar is not part
 * of the layout viewport and the dvh value only settles after the toolbar has
 * finished animating — so a full-height page has its last ~55px hidden behind
 * the browser chrome. `visualViewport.height` is what is actually on screen at
 * this moment, which is exactly what a non-scrolling full-screen page needs.
 *
 * The lock matters for the same reason: any scrollability at all lets the phone
 * rubber-band the page under the toolbar.
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

    const viewport = window.visualViewport;

    const apply = () => {
      const height = Math.round(viewport?.height ?? window.innerHeight);
      if (height <= 0) return;
      // Compared against what is actually set rather than a remembered value,
      // so the property is restored even if something else clobbers it.
      const next = `${height}px`;
      if (root.style.getPropertyValue("--live-vh") !== next) {
        root.style.setProperty("--live-vh", next);
      }
    };

    // Some browsers resize their own chrome without firing anything we can
    // listen for. iOS Chrome opens with a tall address bar and compacts it a
    // moment after first paint, and neither visualViewport's resize nor
    // window's always follows — so a page measured once at mount stays short,
    // leaving a strip of blank below it until something forces a relayout
    // (which is why switching apps and back "fixed" it).
    //
    // So after every signal, keep re-reading on each frame for a short window.
    // It is a property read and an integer compare; the cost is nil next to
    // the reel animation already running.
    let settleUntil = 0;
    let frame: number | null = null;

    const settle = () => {
      apply();
      if (performance.now() < settleUntil) {
        frame = requestAnimationFrame(settle);
      } else {
        frame = null;
      }
    };

    const nudge = () => {
      apply();
      settleUntil = performance.now() + 2500;
      if (frame === null) frame = requestAnimationFrame(settle);
    };

    nudge();

    const targets: [EventTarget | null | undefined, string][] = [
      [viewport, "resize"],
      [viewport, "scroll"],
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

    // Last resort for a chrome change that fires no event at all. Once a second
    // is imperceptible to correct and cheap enough to leave running.
    const safety = window.setInterval(apply, 1000);

    return () => {
      for (const [target, event] of targets) {
        target?.removeEventListener(event, nudge);
      }
      window.clearInterval(safety);
      if (frame !== null) cancelAnimationFrame(frame);

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
