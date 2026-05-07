"use client";

import { motion } from "framer-motion";

const ANIMATION_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

type AnimatedHeaderProps = {
  title: string;
  lastUpdated: string;
  effectiveDate: string;
};

export function AnimatedHeader({
  title,
  lastUpdated,
  effectiveDate,
}: AnimatedHeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 24, filter: "blur(12px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.6, ease: ANIMATION_EASE }}
      className="relative overflow-hidden border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-100/50 to-transparent dark:from-neutral-800/50 pointer-events-none" />

      <div className="container relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-primary dark:text-accent">
            {title}
          </h1>

          <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-400">
            <time dateTime="2025-10-11" className="font-medium">
              {lastUpdated}: {effectiveDate}
            </time>
          </p>
        </div>
      </div>
    </motion.header>
  );
}
