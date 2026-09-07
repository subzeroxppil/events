"use client";

import { useEffect } from "react";

/**
 * Reloads a draw screen once, the first time this tab opens a given draw.
 *
 * A cold arrival — a QR scan, a link opened from a chat app, a tab restored
 * from the background — is the one load whose layout and connection state we
 * have least control over; a fresh navigation from a warm document lands
 * cleanly. So the first visit spends one reload on that, and every load after
 * it in the same tab is left alone.
 *
 * `prefix` namespaces the flag so the admin screen and the live page track
 * their own reloads independently — an admin with both open in one browser
 * must not have one suppress the other.
 *
 * The flag lives in `sessionStorage`, keyed by URL: it is set *before* the
 * reload, so the second load sees it and stops, and it dies with the tab
 * rather than making the next visit skip the refresh. If storage is
 * unavailable (private-mode quirks, storage blocked) we simply don't reload —
 * never reload without having recorded that we did, or the page loops.
 */
export function useFirstOpenReload(prefix: string, key: string | undefined) {
  useEffect(() => {
    if (!key) return;

    const flag = prefix + key;
    try {
      if (sessionStorage.getItem(flag)) return;
      sessionStorage.setItem(flag, "1");
    } catch {
      return;
    }

    window.location.reload();
  }, [prefix, key]);
}
