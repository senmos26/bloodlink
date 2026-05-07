"use client";

import { cn } from "@/lib/utils";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { useRef, useMemo } from "react";

type AnimationVariant =
  | "fadeIn"
  | "blurIn"
  | "blurInUp"
  | "blurInDown"
  | "slideUp"
  | "slideDown";

interface StreamingTextAnimateProps {
  /**
   * The text content to animate (can grow as streaming progresses)
   */
  children: string;
  /**
   * The class name to be applied to the container
   */
  className?: string;
  /**
   * Number of words to animate together as a group
   * @default 1
   */
  wordGroup?: number;
  /**
   * The animation preset to use
   * @default "blurInUp"
   */
  animation?: AnimationVariant;
  /**
   * Duration of each word/group animation
   * @default 0.25
   */
  duration?: number;
  /**
   * Whether currently streaming (shows cursor)
   * @default false
   */
  isStreaming?: boolean;
  /**
   * Custom cursor element class
   */
  cursorClassName?: string;
}

/**
 * A streaming-aware text animation component.
 *
 * Unlike static TextAnimate, this component:
 * - Tracks which words have already been animated
 * - Only animates NEW words as they arrive
 * - Prevents re-animation of existing words on re-render
 * - Shows a blinking cursor during streaming
 *
 * @example
 * ```tsx
 * <StreamingTextAnimate
 *   animation="blurInUp"
 *   wordGroup={2}
 *   isStreaming={true}
 * >
 *   {message.content}
 * </StreamingTextAnimate>
 * ```
 */
export function StreamingTextAnimate({
  children,
  className,
  wordGroup = 1,
  animation = "blurInUp",
  duration = 0.25,
  isStreaming = false,
  cursorClassName,
}: StreamingTextAnimateProps) {
  // Track the number of words that have been fully animated
  const animatedCountRef = useRef(0);

  // Split text into words, preserving spaces for natural rendering
  const words = useMemo(() => {
    if (!children) return [];
    // Split by whitespace but keep track of word boundaries
    return children.split(/(\s+)/).filter(Boolean);
  }, [children]);

  // Group words together based on wordGroup prop
  const wordGroups = useMemo(() => {
    const groups: string[] = [];
    let currentGroup: string[] = [];
    let wordCount = 0;

    for (const segment of words) {
      // Check if segment is whitespace
      const isWhitespace = /^\s+$/.test(segment);

      if (isWhitespace) {
        currentGroup.push(segment);
      } else {
        currentGroup.push(segment);
        wordCount++;

        if (wordCount >= wordGroup) {
          groups.push(currentGroup.join(""));
          currentGroup = [];
          wordCount = 0;
        }
      }
    }

    // Don't forget remaining words
    if (currentGroup.length > 0) {
      groups.push(currentGroup.join(""));
    }

    return groups;
  }, [words, wordGroup]);

  // Determine animation variants based on preset
  const itemVariants: Variants = useMemo(() => {
    const easeOut = [0.33, 1, 0.68, 1] as const; // easeOut as tuple

    const base = {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: { duration, ease: easeOut },
      },
    };

    switch (animation) {
      case "blurIn":
        return {
          hidden: { opacity: 0, filter: "blur(8px)" },
          visible: {
            opacity: 1,
            filter: "blur(0px)",
            transition: { duration, ease: easeOut },
          },
        };
      case "blurInUp":
        return {
          hidden: { opacity: 0, filter: "blur(8px)", y: 12 },
          visible: {
            opacity: 1,
            filter: "blur(0px)",
            y: 0,
            transition: { duration, ease: easeOut },
          },
        };
      case "blurInDown":
        return {
          hidden: { opacity: 0, filter: "blur(8px)", y: -12 },
          visible: {
            opacity: 1,
            filter: "blur(0px)",
            y: 0,
            transition: { duration, ease: easeOut },
          },
        };
      case "slideUp":
        return {
          hidden: { opacity: 0, y: 16 },
          visible: {
            opacity: 1,
            y: 0,
            transition: { duration, ease: easeOut },
          },
        };
      case "slideDown":
        return {
          hidden: { opacity: 0, y: -16 },
          visible: {
            opacity: 1,
            y: 0,
            transition: { duration, ease: easeOut },
          },
        };
      case "fadeIn":
      default:
        return base;
    }
  }, [animation, duration]);

  // Update the animated count after render (for next cycle)
  // This ensures new words animate, but old ones don't re-animate
  const previousCount = animatedCountRef.current;

  // Schedule update for after this render
  if (wordGroups.length > previousCount) {
    // Use setTimeout to update after render to avoid state during render
    setTimeout(() => {
      animatedCountRef.current = wordGroups.length;
    }, 0);
  }

  return (
    <span className={cn("inline", className)}>
      <AnimatePresence mode="popLayout">
        {wordGroups.map((group, index) => {
          // Words that were already rendered should appear immediately
          const isAlreadyAnimated = index < previousCount;

          return (
            <motion.span
              key={`word-group-${index}-${group.slice(0, 10)}`}
              variants={itemVariants}
              initial={isAlreadyAnimated ? "visible" : "hidden"}
              animate="visible"
              className="inline whitespace-pre-wrap"
              style={{ display: "inline" }}
            >
              {group}
            </motion.span>
          );
        })}
      </AnimatePresence>

      {/* Streaming cursor */}
      {isStreaming && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={cn(
            "inline-block w-[3px] h-[1.1em] bg-slate-700 ml-0.5 rounded-sm align-middle",
            cursorClassName
          )}
          style={{
            animation: "pulse 1s ease-in-out infinite",
          }}
        />
      )}
    </span>
  );
}
