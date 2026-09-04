"use client";

import { useEffect, useState } from "react";

const heightForWidth = (width: number) => {
  if (width < 640) return 64;
  if (width < 1024) return 80;
  return 96;
};

/**
 * Height of a single spinner row, in px.
 *
 * Recomputed on resize *and* orientationchange — the view-only page is watched
 * on phones that get rotated mid-draw, and a stale value leaves the reel
 * spaced for the wrong viewport.
 */
export function useItemHeight(): number {
  // 96 matches the desktop default so the server render and the first client
  // render agree; the effect corrects it immediately on mobile.
  const [itemHeight, setItemHeight] = useState(96);

  useEffect(() => {
    const update = () => setItemHeight(heightForWidth(window.innerWidth));
    update();

    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  return itemHeight;
}
