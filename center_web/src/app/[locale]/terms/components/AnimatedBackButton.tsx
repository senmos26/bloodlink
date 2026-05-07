"use client";

import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

type AnimatedBackButtonProps = {
  href: string;
  backText: string;
  backAriaLabel: string;
};

export function AnimatedBackButton({
  href,
  backText,
  backAriaLabel,
}: AnimatedBackButtonProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="sticky top-0 z-40 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800"
    >
      <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16">
          <Link
            href={href}
            className="group inline-flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-primary dark:text-neutral-400 dark:hover:text-accent transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:focus-visible:ring-accent rounded-md px-3 py-2 -ml-3"
            aria-label={backAriaLabel}
          >
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="flex items-center gap-2"
            >
              <ArrowLeft
                className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-0.5"
                aria-hidden="true"
              />
              <span>{backText}</span>
            </motion.span>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
