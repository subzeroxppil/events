"use client";

import { useEffect } from "react";

/**
 * Makes the document exactly as tall as the window while a full-screen page is
 * mounted, by putting `height: 100%` on `<html>` and `<body>` so the page's own
 * `h-full` has a chain to resolve against, and locking both against scrolling.
 *
 * That is the whole mechanism. There is no measurement, no `dvh`, no
 * `visualViewport`, no polling and no `position: fixed`: `100%` resolves
 * against the initial containing block, which is the area the browser is
 * actually showing, and the browser keeps it correct on its own.
 *
 * Every previous version of this file tried to describe the visible area from
 * outside it and got it wrong somewhere — most recently on Chrome for Android,
 * which restores a killed tab with the visual viewport offset inside the layout
 * viewport that `position: fixed` pins to, leaving the UI high on the screen
 * until the first scroll shunted it down.
 *
 * Applied as a class rather than in the root layout so it stays scoped to these
 * routes; every other page keeps its ordinary scrolling document.
 *
 * This is the fallback path. globals.css does the same thing with `:has()` off
 * the server-rendered markup, which lands at first paint instead of waiting for
 * hydration — without it there is a visible moment on a cold load where the
 * chain is missing and the page collapses to the height of its own content.
 * The class is what browsers too old for `:has()` get instead.
 */
export function useFullHeightPage() {
  useEffect(() => {
    const targets = [document.documentElement, document.body];
    for (const el of targets) el.classList.add("live-page-host");
    return () => {
      for (const el of targets) el.classList.remove("live-page-host");
    };
  }, []);
}

/**
 * Paints `css` behind the document while the caller is mounted.
 *
 * Belt and braces: the page fills the window by construction, but this makes
 * what is underneath it the right colour anyway, including in the moment before
 * hydration and under an overscroll bounce.
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
 * The full-window box for a draw screen: `height: 100%` of the host set up by
 * `useFullHeightPage`, and a positioning context for the overlays inside it.
 */
export const LIVE_VIEWPORT_CLASS = "live-viewport";
