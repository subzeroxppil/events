"use client";

import { Suspense } from "react";
import PixelAdminScreen from "./PixelAdminScreen";
import { PIXEL_VARIANTS } from "@/components/luckydraw/live/pixel/variants";

/**
 * The default admin draw screen: the handheld-LCD pixel skin.
 *
 * The classic screen is still there, at `/admin/luckydraw/[id]/classic`, and
 * `?ui=` picks any other pixel variant from here. Every one of them runs the
 * same `useAdminDraw` hook, so the draw itself behaves identically whichever
 * is on the projector.
 */
export default function AdminLuckyDrawPage() {
  return (
    <Suspense fallback={null}>
      <PixelAdminScreen defaultVariant={PIXEL_VARIANTS["pixel-lcd"]} />
    </Suspense>
  );
}
