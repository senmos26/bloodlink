import React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const rainbowButtonVariants = cva(
  cn(
    "relative cursor-pointer group transition-all animate-rainbow",
    "inline-flex items-center justify-center gap-2 shrink-0",
    "rounded-sm outline-none focus-visible:ring-[3px] aria-invalid:border-destructive",
    "text-sm font-medium whitespace-nowrap",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0"
  ),
  {
    variants: {
      variant: {
        default:
          "border-0 bg-[linear-gradient(#0d9488,#0d9488),linear-gradient(#0d9488_50%,rgba(13,148,136,0.6)_80%,rgba(13,148,136,0)),linear-gradient(90deg,#14b8a6,#0d9488,#0f766e,#115e59,#134e4a)] bg-[length:200%] text-white [background-clip:padding-box,border-box,border-box] [background-origin:border-box] [border:calc(0.125rem)_solid_transparent]",
        outline:
          "border border-input border-b-transparent bg-[linear-gradient(#ffffff,#ffffff),linear-gradient(#ffffff_50%,rgba(13,148,136,0.6)_80%,rgba(13,148,136,0)),linear-gradient(90deg,#14b8a6,#0d9488,#0f766e,#115e59,#134e4a)] bg-[length:200%] text-teal-900 [background-clip:padding-box,border-box,border-box] [background-origin:border-box]",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-xl px-3 text-xs",
        lg: "h-11 rounded-xl px-8",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

interface RainbowButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof rainbowButtonVariants> {
  asChild?: boolean
}

const RainbowButton = React.forwardRef<HTMLButtonElement, RainbowButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        data-slot="button"
        className={cn(rainbowButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)

RainbowButton.displayName = "RainbowButton"

export { RainbowButton, rainbowButtonVariants, type RainbowButtonProps }
