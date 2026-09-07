"use client";

import { motion } from "motion/react";

export type LiveChrome = {
  /** Painted behind the skeleton — the skin's own, so nothing flashes. */
  background: string;
  /** The colour the gradient ends on, for the document root. */
  base: string;
  /** Placeholder blocks. */
  block: string;
  text: string;
  dim: string;
};

/**
 * The shape of the welcome screen, drawn before its content exists.
 *
 * A spinner on a colour the page never uses again is two jarring changes: the
 * colour goes, then the layout appears. A skeleton in the skin's own palette
 * makes loading a continuation of the page rather than an interruption — by
 * the time the data lands, the only thing that changes is that the blocks
 * become words.
 */
export default function LiveWelcomeSkeleton({ chrome }: { chrome: LiveChrome }) {
  return (
    <div className="flex h-full w-full items-center justify-center px-8">
      <motion.div
        className="flex w-full max-w-xs flex-col items-center gap-5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <Block chrome={chrome} className="h-14 w-28 rounded-md" delay={0} />

        <div className="flex w-full flex-col items-center gap-2">
          <Block chrome={chrome} className="h-3.5 w-40 rounded" delay={0.06} />
          <Block chrome={chrome} className="h-5 w-52 rounded" delay={0.12} />
        </div>

        {/* The stats panel */}
        <Block chrome={chrome} className="h-16 w-full rounded-lg" delay={0.18} />

        <div className="flex w-full flex-col items-center gap-2">
          <Block chrome={chrome} className="h-3 w-full rounded" delay={0.24} />
          <Block chrome={chrome} className="h-3 w-4/5 rounded" delay={0.28} />
        </div>

        {/* The Enter button */}
        <Block chrome={chrome} className="h-14 w-full rounded-lg" delay={0.34} />
      </motion.div>
    </div>
  );
}

/**
 * One placeholder. The pulse is opacity rather than a sweeping highlight —
 * a sweep needs a gradient in a fixed direction, which reads wrong against
 * skins whose own background is already a gradient.
 */
function Block({
  chrome,
  className,
  delay,
}: {
  chrome: LiveChrome;
  className: string;
  delay: number;
}) {
  return (
    <motion.div
      className={className}
      style={{ background: chrome.block }}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: [0.45, 0.85, 0.45], y: 0 }}
      transition={{
        opacity: {
          duration: 1.4,
          repeat: Infinity,
          ease: "easeInOut",
          delay,
        },
        y: { duration: 0.35, ease: "easeOut", delay },
      }}
    />
  );
}
