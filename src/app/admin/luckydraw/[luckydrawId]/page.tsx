"use client";

import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import GradualBlur from "@/components/GradualBlur";
import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import BackButton from "@/components/BackButton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import LuckyDrawSettings from "./LuckyDrawSettings";
import SpinnerReel from "@/components/luckydraw/SpinnerReel";
import WinnerOverlay from "@/components/luckydraw/WinnerOverlay";
import PreviousWinner from "@/components/luckydraw/PreviousWinner";
import ViewOnlyShareSheet from "@/components/luckydraw/ViewOnlyShareSheet";
import { useAdminDraw } from "./use-admin-draw";
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

export default function LuckyDraw() {
  // All draw behaviour lives in the hook, so this screen and the pixel one at
  // /admin/luckydraw/[id]/pixel cannot drift apart. Destructured into the same
  // names the markup below already used.
  const {
    luckydrawId,
    luckyDraw,
    participants,
    initialLoading,
    error,
    winners,
    corpIdMapping,
    spinnerItems,
    centerIndex,
    animationOffset,
    itemHeight,
    isSpinning,
    isIdleAnimating,
    currentWinner,
    showWinner,
    animationSettings,
    setAnimationSettings,
    currentColors,
    backgroundStyle,
    handleSpin,
    handleDeleteWinner,
    handleDeleteLuckyDraw,
    deleteLoading,
    showSettings,
    setShowSettings,
    viewOnlyEnabled,
    setViewOnlyEnabled,
  } = useAdminDraw();

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={backgroundStyle}
    >
      {/* Overlay veil for contrast */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: `rgba(255,255,255,${animationSettings.backgroundOverlayOpacity})`,
        }}
      />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-3 sm:p-6 flex justify-between items-center z-40">
        <BackButton />
        <div className="flex items-center gap-3">
          <h1 className="text-lg sm:text-2xl font-bold tracking-tight leading-tight text-gray-900">
            🎉 {luckyDraw?.name}
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="min-h-screen flex items-center justify-center relative z-10">
        {/* Spinner Container */}
        <div className="relative w-full max-w-sm sm:max-w-2xl lg:max-w-3xl h-screen">
          {/* Vertical Spinner */}
          <SpinnerReel
            spinnerItems={spinnerItems}
            centerIndex={centerIndex}
            animationOffset={animationOffset}
            itemHeight={itemHeight}
            visibleRange={animationSettings.visibleRange}
            centerItemScale={animationSettings.centerItemScale}
            nearCenterScale={animationSettings.nearCenterScale}
            maxBlur={animationSettings.maxBlur}
            accentColors={currentColors}
            isAnimating={isIdleAnimating || isSpinning}
          />
        </div>

        {/* Previous Winner */}
        <PreviousWinner winners={winners} accentColors={currentColors} />

        {/* Bottom control bar. One row rather than two pinned corners — on a
            phone the left and right groups sat on top of each other. */}
        <div className="fixed inset-x-2 sm:inset-x-4 lg:inset-x-8 bottom-2 sm:bottom-4 lg:bottom-8 z-40 flex flex-wrap gap-2 items-center justify-end">
        {/* Winners Button */}
        <div className="mr-auto">
          <Sheet>
            <SheetTrigger asChild>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              >
                <Button
                  variant="ghost"
                  size={
                    typeof window !== "undefined" && window.innerWidth < 640
                      ? "sm"
                      : "default"
                  }
                  className="backdrop-blur-md bg-white/95 border border-white/70 hover:bg-white text-gray-700 shadow-lg text-xs sm:text-sm font-medium"
                >
                  <Trophy
                    className="w-4 h-4 mr-2"
                    style={{ color: currentColors[1] }}
                  />
                  Winners
                  {winners.length > 0 && (
                    <motion.span
                      className="ml-2 px-2 py-0.5 text-white rounded-full text-xs font-bold"
                      style={{
                        backgroundColor: currentColors[2],
                        boxShadow: `0 0 10px ${currentColors[2]}40`,
                      }}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 25,
                      }}
                    >
                      {winners.length}
                    </motion.span>
                  )}
                </Button>
              </motion.div>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Lucky Draw Winners</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-3 pb-6">
                {winners.length === 0 ? (
                  <p className="text-center text-muted-foreground">
                    No winners yet
                  </p>
                ) : (
                  winners.map((winner, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs tracking-wide leading-relaxed font-medium text-muted-foreground">
                          {new Date(winner.wonAt).toLocaleTimeString("en-SG", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <span className="font-semibold tracking-wide leading-tight">
                          {winner.workId}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteWinner(winner.workId)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
          <ViewOnlyShareSheet
            luckydrawId={String(luckydrawId)}
            enabled={viewOnlyEnabled}
            onEnabledChange={setViewOnlyEnabled}
          />
          <LuckyDrawSettings
            settings={animationSettings}
            onSettingsChange={setAnimationSettings}
            isSpinning={isSpinning}
            showSettings={showSettings}
            onShowSettingsChange={setShowSettings}
          />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant={"ghost"}
                size={
                  typeof window !== "undefined" && window.innerWidth < 640
                    ? "sm"
                    : "default"
                }
                className="backdrop-blur-md bg-white/95 border border-white/70 hover:bg-white text-gray-700 shadow-lg text-xs sm:text-sm"
              >
                <Trash2 className="w-4 h-4 sm:mr-2" />
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
                  onClick={handleDeleteLuckyDraw}
                  className="w-full sm:w-[75px] "
                  disabled={deleteLoading}
                >
                  {deleteLoading ? <LoadingSpinner /> : "Delete"}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>


        {/* SPIN Button */}
        <div className="absolute right-2 sm:right-6 lg:right-12 top-1/2 -translate-y-1/2 z-40">
          <motion.div
            initial={false}
            animate={{
              scale: isSpinning ? 0.95 : 1,
            }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 30,
            }}
          >
            <button
              onClick={handleSpin}
              disabled={isSpinning || participants.length === 0}
              className={cn(
                "backdrop-blur-md bg-white/95 border border-white/70 hover:bg-white text-gray-700 shadow-lg",
                "px-4 sm:px-8 lg:px-12 py-2 sm:py-3 lg:py-4",
                "rounded-full text-sm sm:text-base font-semibold tracking-widest uppercase",
                "transition-all duration-300 ease-out",
                "disabled:cursor-not-allowed disabled:opacity-50"
              )}
            >
              {/* Button text */}
              <motion.span
                className={cn(
                  "relative z-10 font-semibold text-sm sm:text-base tracking-widest uppercase",
                  "transition-all duration-300",
                  "drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)]"
                )}
                style={{
                  color: isSpinning ? currentColors[0] : "#1a1a1a",
                  textShadow: isSpinning
                    ? `0 0 20px ${currentColors[1]}40`
                    : "0 1px 2px rgba(0,0,0,0.05)",
                }}
                animate={{
                  letterSpacing: isSpinning ? "0.2em" : "0.15em",
                }}
              >
                {isSpinning ? (
                  <motion.div
                    className="flex items-center gap-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    Spinning
                    <motion.div
                      className="flex gap-0.5"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-1 h-1 rounded-full"
                          style={{ backgroundColor: currentColors[1] }}
                          animate={{
                            y: [0, -3, 0],
                            opacity: [0.3, 1, 0.3],
                          }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            delay: i * 0.15,
                            ease: "easeInOut",
                          }}
                        />
                      ))}
                    </motion.div>
                  </motion.div>
                ) : (
                  <motion.span
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    Spin
                  </motion.span>
                )}
              </motion.span>

              {/* Pulse ring animation when not spinning */}
              {!isSpinning && (
                <motion.div
                  className="absolute inset-0 rounded-full pointer-events-none"
                  style={{
                    border: `1px solid ${currentColors[1]}20`,
                  }}
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.5, 0, 0.5],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeOut",
                  }}
                />
              )}
            </button>
          </motion.div>
        </div>
      </div>

      {/* Winner Display */}
      <WinnerOverlay
        show={showWinner}
        winner={currentWinner}
        winnerName={currentWinner ? corpIdMapping[currentWinner] : undefined}
        accentColors={currentColors}
      />
    </div>
  );
}
