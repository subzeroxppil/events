"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

/**
 * The entrance every admin screen shares: a short rise and fade.
 *
 * Small on purpose. A page that slides a long way or lingers stops feeling
 * polished and starts feeling slow, because the wait is real every single
 * time — 18px over 0.35s is enough to read as deliberate without ever being
 * something to sit through.
 *
 * Not used on the draw screens: those are run live in front of an audience,
 * where anything between pressing a button and seeing the reel is a liability.
 */
export function PageTransition({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/**
 * For lists whose rows should arrive one after another rather than all at
 * once. Wrap the list in `Stagger` and each row in `StaggerItem`.
 */
export function Stagger({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        // Capped by `staggerChildren` being small: a long list must not take
        // seconds to finish arriving.
        show: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 14 },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
        },
      }}
    >
      {children}
    </motion.div>
  );
}
