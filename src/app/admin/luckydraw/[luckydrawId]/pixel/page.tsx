"use client";

import { Suspense } from "react";
import PixelAdminScreen from "../PixelAdminScreen";
import { PIXEL_VARIANTS } from "@/components/luckydraw/live/pixel/variants";

/**
 * The pixel admin screen with the deep-space cabinet as its default, kept as
 * its own URL now that the handheld skin is what a bare
 * `/admin/luckydraw/[id]` renders.
 */
export default function PixelAdminLuckyDrawPage() {
  return (
    <Suspense fallback={null}>
      <PixelAdminScreen defaultVariant={PIXEL_VARIANTS.pixel} />
    </Suspense>
  );
}
