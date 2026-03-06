import * as React from "react"
import { cn } from "@/lib/utils"

export interface GradientTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  className?: string
  children?: React.ReactNode
}

const GradientText = React.forwardRef<HTMLSpanElement, GradientTextProps>(
  ({ className, children, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        "bg-gradient-to-r from-[var(--color-purple)] to-[var(--color-cyan)] bg-clip-text text-transparent",
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
)
GradientText.displayName = "GradientText"

export { GradientText }
