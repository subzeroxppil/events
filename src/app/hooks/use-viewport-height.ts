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
      const height = viewport?.height ?? window.innerHeight;
      root.style.setProperty("--live-vh", `${Math.round(height)}px`);
    };

    apply();
    // A second pass after the toolbar's show/hide transition has settled.
    const settle = window.setTimeout(apply, 350);

    viewport?.addEventListener("resize", apply);
    viewport?.addEventListener("scroll", apply);
    window.addEventListener("resize", apply);
    window.addEventListener("orientationchange", apply);

    return () => {
      window.clearTimeout(settle);
      viewport?.removeEventListener("resize", apply);
      viewport?.removeEventListener("scroll", apply);
      window.removeEventListener("resize", apply);
      window.removeEventListener("orientationchange", apply);

      root.style.overflow = previous.rootOverflow;
      body.style.overflow = previous.bodyOverflow;
      body.style.overscrollBehavior = previous.overscroll;
      root.style.removeProperty("--live-vh");
    };
  }, []);
}

/** Full-screen box that tracks the visible viewport. */
export const LIVE_VIEWPORT_STYLE = {
  height: "var(--live-vh, 100dvh)",
} as const;
