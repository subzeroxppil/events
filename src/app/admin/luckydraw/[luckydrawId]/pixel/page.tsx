"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, Share2, Settings, Trash2, Trophy } from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import SpinnerReel from "@/components/luckydraw/SpinnerReel";
import ViewOnlyShareSheet from "@/components/luckydraw/ViewOnlyShareSheet";
import LuckyDrawSettings from "../LuckyDrawSettings";
import { useAdminDraw } from "../use-admin-draw";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { pixelFontVars } from "@/lib/pixel-font";
import {
  LIVE_VIEWPORT_STYLE,
  useViewportHeight,
} from "@/app/hooks/use-viewport-height";
import {
  PixelBackdrop,
  PixelCrt,
  PixelSelectionFrame,
  pixelButtonStyle,
  pixelFrameStyle,
} from "@/components/luckydraw/live/pixel/PixelChrome";
import {
  DEFAULT_PIXEL_VARIANT,
  PIXEL_VARIANTS,
} from "@/components/luckydraw/live/pixel/variants";
import PixelWinnerOverlay from "@/components/luckydraw/live/pixel/PixelWinnerOverlay";

/** Shared look for the small buttons on this screen. */
const PIXEL_BUTTON =
  "inline-flex items-center gap-1.5 font-pixel text-[8px] uppercase tracking-[0.1em] " +
  "rounded-none px-2.5 py-2 h-auto border-2 transition-transform duration-75 " +
  "active:translate-x-[2px] active:translate-y-[2px] hover:opacity-90";

/**
 * Pixel-retro skin of the admin draw screen.
 *
 * Same draw as `/admin/luckydraw/[luckydrawId]` — it runs the identical
 * `useAdminDraw` hook, so spins, winner recording and the broadcast to the
 * public page behave exactly the same. Only the painting differs, and the
 * original URL is left untouched for anyone who prefers it.
 */
export default function PixelAdminLuckyDrawPage() {
  return (
    <Suspense fallback={null}>
      <PixelAdminLuckyDraw />
    </Suspense>
  );
}

function PixelAdminLuckyDraw() {
  const params = useParams();
  const searchParams = useSearchParams();
  const variant =
    PIXEL_VARIANTS[searchParams.get("ui") ?? ""] ?? DEFAULT_PIXEL_VARIANT;
  const buttonStyle = {
    background: variant.panelFill,
    borderColor: variant.accent,
    color: variant.text,
  };
  const luckydrawId = Array.isArray(params?.luckydrawId)
    ? params.luckydrawId[0]
    : params?.luckydrawId;

  const draw = useAdminDraw();

  useViewportHeight();

  if (draw.initialLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: variant.background }}
      >
        <LoadingSpinner />
      </div>
    );
  }

  if (draw.error) {
    return (
      <div
        className={`${pixelFontVars} min-h-screen flex items-center justify-center px-6`}
        style={{ background: variant.background }}
      >
        <div className="font-pixel text-[11px] leading-[1.8] text-[#e04b4b] text-center">
          {draw.error}
        </div>
      </div>
    );
  }

  const canSpin = !draw.isSpinning && draw.participants.length > 0;

  return (
    <div
      className={`${pixelFontVars} fixed inset-x-0 top-0 w-full overflow-hidden overscroll-none`}
      style={{ ...LIVE_VIEWPORT_STYLE, background: variant.background }}
    >
      <PixelBackdrop variant={variant} />
      <PixelCrt variant={variant} />

      <div className="relative z-10 h-full w-full flex flex-col">
        {/* HUD */}
        <header className="relative z-20 shrink-0 px-3 pt-[calc(env(safe-area-inset-top)+0.6rem)]">
          <div className="flex items-center justify-between gap-2">
            <Link href="/admin/luckydraw" className={PIXEL_BUTTON} style={buttonStyle}>
              <ArrowLeft className="w-3 h-3" aria-hidden />
              Back
            </Link>
            <Link
              href={`/admin/luckydraw/${luckydrawId}`}
              className={PIXEL_BUTTON}
              style={buttonStyle}
            >
              Classic UI
            </Link>
          </div>

          <h1
            className="mt-2 font-pixel text-[10px] sm:text-xs leading-[1.6] uppercase text-center truncate px-2"
            style={{ color: variant.text, textShadow: variant.titleShadow }}
          >
            {draw.luckyDraw?.name}
          </h1>

          <div
            className="mt-1.5 flex items-center justify-center gap-4 font-pixel text-[7px] tracking-[0.14em]"
            style={{ color: variant.dim }}
          >
            <span>PLAYERS {draw.participants.length}</span>
            <span>DRAWN {draw.winners.length}</span>
          </div>
        </header>

        {/* Reel window */}
        <main className="flex-1 min-h-0 mt-2 px-3 pb-1">
          <div
            className="relative h-full w-full max-w-sm sm:max-w-2xl mx-auto"
            style={pixelFrameStyle(variant)}
          >
            <SpinnerReel
              spinnerItems={draw.spinnerItems}
              centerIndex={draw.centerIndex}
              animationOffset={draw.animationOffset}
              itemHeight={draw.itemHeight}
              visibleRange={draw.animationSettings.visibleRange}
              centerItemScale={draw.animationSettings.centerItemScale}
              nearCenterScale={draw.animationSettings.nearCenterScale}
              maxBlur={0}
              accentColors={draw.currentColors}
              isAnimating={draw.isIdleAnimating || draw.isSpinning}
              theme={variant.reelTheme}
              blurEdges={false}
              fade="stepped"
              arrow="pixel"
            />
            <PixelSelectionFrame
              variant={variant}
              height={
                draw.itemHeight * draw.animationSettings.centerItemScale + 10
              }
            />
          </div>
        </main>

        {/* Controls */}
        <footer className="relative z-20 shrink-0 px-3 pb-[calc(env(safe-area-inset-bottom)+0.6rem)] pt-2">
          <button
            type="button"
            onClick={draw.handleSpin}
            disabled={!canSpin}
            className="w-full max-w-sm sm:max-w-2xl mx-auto block font-pixel text-sm sm:text-base uppercase tracking-[0.14em] px-6 py-4 transition-transform duration-75 active:translate-x-[3px] active:translate-y-[3px] disabled:opacity-40 disabled:active:translate-x-0 disabled:active:translate-y-0 disabled:cursor-not-allowed"
            style={pixelButtonStyle(variant)}
          >
            {draw.isSpinning ? "SPINNING..." : "SPIN"}
          </button>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            {/* Winners */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" className={PIXEL_BUTTON} style={buttonStyle}>
                  <Trophy className="w-3 h-3" aria-hidden />
                  Winners
                  {draw.winners.length > 0 && (
                    <span
                      className="ml-1 px-1.5 py-0.5"
                      style={{
                        background: variant.accent,
                        color: variant.buttonText,
                      }}
                    >
                      {draw.winners.length}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Lucky Draw Winners</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-3 pb-6 px-4">
                  {draw.winners.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No winners yet.
                    </p>
                  ) : (
                    draw.winners.map((winner) => (
                      <div
                        key={winner.workId}
                        className="flex items-center justify-between gap-3 border rounded-lg px-3 py-2"
                      >
                        <div className="min-w-0">
                          <div className="font-semibold truncate">
                            {winner.workId}
                          </div>
                          {draw.corpIdMapping?.[winner.workId] && (
                            <div className="text-sm text-muted-foreground truncate">
                              {draw.corpIdMapping[winner.workId]}
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => draw.handleDeleteWinner(winner.workId)}
                          aria-label={`Remove ${winner.workId}`}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </SheetContent>
            </Sheet>

            <ViewOnlyShareSheet
              luckydrawId={String(luckydrawId)}
              enabled={draw.viewOnlyEnabled}
              onEnabledChange={draw.setViewOnlyEnabled}
              triggerClassName={PIXEL_BUTTON}
              triggerStyle={buttonStyle}
            />

            <LuckyDrawSettings
              settings={draw.animationSettings}
              onSettingsChange={draw.setAnimationSettings}
              isSpinning={draw.isSpinning}
              showSettings={draw.showSettings}
              onShowSettingsChange={draw.setShowSettings}
              triggerClassName={PIXEL_BUTTON}
              triggerStyle={buttonStyle}
            />

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" className={PIXEL_BUTTON} style={buttonStyle}>
                  <Trash2 className="w-3 h-3" aria-hidden />
                  <span className="hidden sm:inline">Delete</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete lucky draw?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete your lucky draw and all data
                    related to it.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <Button
                    variant="destructive"
                    onClick={draw.handleDeleteLuckyDraw}
                    className="w-full sm:w-[75px]"
                    disabled={draw.deleteLoading}
                  >
                    {draw.deleteLoading ? <LoadingSpinner /> : "Delete"}
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </footer>
      </div>

      <PixelWinnerOverlay
        variant={variant}
        show={draw.showWinner}
        winner={draw.currentWinner}
        winnerName={
          draw.currentWinner
            ? draw.corpIdMapping?.[draw.currentWinner]
            : undefined
        }
      />
    </div>
  );
}
