"use client"

import * as React from "react"
import { motion, type HTMLMotionProps } from "framer-motion"
import { cn } from "@/lib/utils"

type GlowButtonVariant = "primary" | "ghost"

export interface GlowButtonProps
  extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: GlowButtonVariant
  className?: string
  children?: React.ReactNode
}

const variantStyles: Record<
  GlowButtonVariant,
  string
> = {
  primary:
    "bg-gradient-to-r from-[var(--color-purple)] to-[var(--color-cyan)] text-white border-0 shadow-[0_0_20px_rgba(108,71,255,0.5),0_0_40px_rgba(0,212,255,0.2)] hover:shadow-[0_0_24px_rgba(108,71,255,0.6),0_0_48px_rgba(0,212,255,0.3)]",
  ghost:
    "bg-[var(--color-bg-card)] border border-[var(--color-border)] backdrop-blur-md text-[var(--color-text)] hover:bg-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.12)]",
}

const GlowButton = React.forwardRef<HTMLButtonElement, GlowButtonProps>(
  (
    {
      variant = "primary",
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => (
    <motion.button
      ref={ref}
      type="button"
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center rounded-lg px-4 py-2 font-medium transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-cyan)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)] disabled:pointer-events-none disabled:opacity-50",
        variantStyles[variant],
        className
      )}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      {...props}
    >
      {children}
    </motion.button>
  )
)
GlowButton.displayName = "GlowButton"

export { GlowButton }
