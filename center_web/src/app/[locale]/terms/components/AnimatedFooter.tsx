"use client";

import { motion } from "framer-motion";
import Link from "next/link";

type AnimatedFooterProps = {
  copyright: string;
  loginText: string;
  loginHref: string;
  separator: string;
  signupText: string;
  signupHref: string;
};

export function AnimatedFooter({
  copyright,
  loginText,
  loginHref,
  separator,
  signupText,
  signupHref,
}: AnimatedFooterProps) {
  return (
    <motion.footer
      initial={{ opacity: 0, y: 24, filter: "blur(10px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50"
    >
      <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="text-center space-y-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {copyright}
          </p>

          <nav aria-label="Footer navigation">
            <ul className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm">
              <li>
                <Link
                  href={loginHref}
                  className="text-neutral-600 hover:text-primary dark:text-neutral-400 dark:hover:text-accent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:focus-visible:ring-accent rounded px-2 py-1"
                >
                  {loginText}
                </Link>
              </li>
              <li
                aria-hidden="true"
                className="text-neutral-300 dark:text-neutral-700"
              >
                {separator}
              </li>
              <li>
                <Link
                  href={signupHref}
                  className="text-neutral-600 hover:text-primary dark:text-neutral-400 dark:hover:text-accent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:focus-visible:ring-accent rounded px-2 py-1"
                >
                  {signupText}
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </motion.footer>
  );
}
