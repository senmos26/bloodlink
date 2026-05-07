import { CSSProperties, FC, ReactNode } from "react";

import { cn } from "@/lib/utils";

interface AnimatedShinyTextProps {
  children: ReactNode;
  className?: string;
  shimmerWidth?: number;
}

export const AnimatedShinyText: FC<AnimatedShinyTextProps> = ({
  children,
  className,
  shimmerWidth = 100,
}) => {
  return (
    <span
      style={
        {
          "--shimmer-width": `${shimmerWidth}px`,
        } as CSSProperties
      }
      className={cn(
        // Base text color (must be transparent for bg-clip-text to work with the gradient)
        "text-transparent bg-clip-text bg-no-repeat",

        // Shimmer effect
        "animate-shimmer [background-size:200%_100%]",

        // Shimmer gradient: Base color -> Shine -> Base color
        // We use a gradient that mimics the text color but adds a white/bright spot
        "bg-gradient-to-r from-neutral-600 via-neutral-900 via-50% to-neutral-600 dark:from-neutral-400 dark:via-white dark:to-neutral-400",

        className
      )}
    >
      {children}
    </span>
  );
};
