"use client";

import { motion } from "framer-motion";
import { Shield, FileText, Scale } from "lucide-react";

const ANIMATION_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const iconMap = {
  fileText: FileText,
  shield: Shield,
  scale: Scale,
} as const;

type IconName = keyof typeof iconMap;

type Section = {
  key: string;
  iconName: IconName;
  title: string;
  content: string;
};

type AnimatedSectionsProps = {
  sections: Section[];
};

export function AnimatedSections({ sections }: AnimatedSectionsProps) {
  return (
    <article className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
      <div className="space-y-12 sm:space-y-16">
        {sections.map((section, index) => {
          const Icon = iconMap[section.iconName];

          return (
            <motion.section
              key={section.key}
              id={section.key}
              aria-labelledby={`${section.key}-heading`}
              initial={{ opacity: 0, y: 32, filter: "blur(18px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, amount: 0.35, margin: "0px 0px -120px" }}
              transition={{
                duration: 0.6,
                ease: ANIMATION_EASE,
                delay: index * 0.08,
              }}
              className="scroll-mt-24"
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
                <div
                  className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 grid place-items-center"
                  aria-hidden="true"
                >
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>

                <div className="flex-1 min-w-0 space-y-3">
                  <h2
                    id={`${section.key}-heading`}
                    className="text-2xl sm:text-3xl font-semibold tracking-tight text-primary dark:text-accent"
                  >
                    {section.title}
                  </h2>

                  <p className="text-base sm:text-lg leading-relaxed text-neutral-600 dark:text-neutral-300">
                    {section.content}
                  </p>
                </div>
              </div>

              {index < sections.length - 1 && (
                <div
                  className="mt-8 sm:mt-12 border-t border-neutral-200 dark:border-neutral-800"
                  role="separator"
                  aria-hidden="true"
                />
              )}
            </motion.section>
          );
        })}
      </div>
    </article>
  );
}
