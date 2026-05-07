"use client";

import { cn } from "@/lib/utils";
import { AnimatePresence, motion, MotionProps, Variants } from "framer-motion";
import { ElementType } from "react";

type AnimationType = "text" | "word" | "character" | "line";
type AnimationVariant =
  | "fadeIn"
  | "blurIn"
  | "blurInUp"
  | "blurInDown"
  | "slideUp"
  | "slideDown"
  | "slideLeft"
  | "slideRight"
  | "scaleUp"
  | "scaleDown";

interface TextAnimateProps extends MotionProps {
  /**
   * The text content to animate
   */
  children: string;
  /**
   * The class name to be applied to the component
   */
  className?: string;
  /**
   * The element type to render
   * @default "p"
   */
  as?: ElementType;
  /**
   * How to split the text ("text", "word", "character")
   * @default "word"
   */
  by?: AnimationType;
  /**
   * The animation preset to use
   * @default "fadeIn"
   */
  animation?: AnimationVariant;
  /**
   * Delay before animation starts
   * @default 0
   */
  delay?: number;
  /**
   * Duration of the animation
   * @default 0.3
   */
  duration?: number;
  /**
   * Whether to start animation when component enters viewport
   * @default true
   */
  startOnView?: boolean;
  /**
   * Whether to animate only once
   * @default false
   */
  once?: boolean;
}
export function TextAnimate({
  children,
  className,
  as: Component = "p",
  by = "word",
  animation = "fadeIn",
  delay = 0,
  duration = 0.3,
  startOnView = true,
  once = false,
  ...props
}: TextAnimateProps) {
  const itemVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { duration },
    },
  };

  if (animation === "blurIn") {
    itemVariants.hidden = { opacity: 0, filter: "blur(10px)" };
    itemVariants.show = {
      opacity: 1,
      filter: "blur(0px)",
      transition: { duration },
    };
  } else if (animation === "blurInUp") {
    itemVariants.hidden = { opacity: 0, filter: "blur(10px)", y: 20 };
    itemVariants.show = {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
      transition: { duration },
    };
  } else if (animation === "blurInDown") {
    itemVariants.hidden = { opacity: 0, filter: "blur(10px)", y: -20 };
    itemVariants.show = {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
      transition: { duration },
    };
  } else if (animation === "slideUp") {
    itemVariants.hidden = { opacity: 0, y: 20 };
    itemVariants.show = {
      opacity: 1,
      y: 0,
      transition: { duration },
    };
  } else if (animation === "slideDown") {
    itemVariants.hidden = { opacity: 0, y: -20 };
    itemVariants.show = {
      opacity: 1,
      y: 0,
      transition: { duration },
    };
  } else if (animation === "slideLeft") {
    itemVariants.hidden = { opacity: 0, x: 20 };
    itemVariants.show = {
      opacity: 1,
      x: 0,
      transition: { duration },
    };
  } else if (animation === "slideRight") {
    itemVariants.hidden = { opacity: 0, x: -20 };
    itemVariants.show = {
      opacity: 1,
      x: 0,
      transition: { duration },
    };
  } else if (animation === "scaleUp") {
    itemVariants.hidden = { opacity: 0, scale: 0.5 };
    itemVariants.show = {
      opacity: 1,
      scale: 1,
      transition: { duration },
    };
  } else if (animation === "scaleDown") {
    itemVariants.hidden = { opacity: 0, scale: 1.5 };
    itemVariants.show = {
      opacity: 1,
      scale: 1,
      transition: { duration },
    };
  }

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: delay,
      },
    },
  };

  let segments: string[] = [];
  if (by === "text") {
    segments = [children];
  } else if (by === "word") {
    segments = children.split(" ");
  } else if (by === "character") {
    segments = children.split("");
  } else if (by === "line") {
    segments = children.split("\n");
  }

  const MotionComponent = motion(Component as ElementType);

  return (
    <AnimatePresence mode="popLayout">
      <MotionComponent
        variants={containerVariants}
        initial="hidden"
        whileInView={startOnView ? "show" : undefined}
        animate={!startOnView ? "show" : undefined}
        viewport={{ once }}
        className={cn("inline-block whitespace-pre-wrap", className)}
        {...props}
      >
        {segments.map((segment, i) => (
          <motion.span
            key={`${by}-${i}-${segment}`}
            variants={itemVariants}
            className={cn(
              by === "line" ? "block" : "inline-block",
              by === "word" && i < segments.length - 1 && "mr-[0.25em]"
            )}
          >
            {segment}
          </motion.span>
        ))}
      </MotionComponent>
    </AnimatePresence>
  );
}
