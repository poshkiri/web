import * as React from "react"
import { cn } from "@/lib/utils"

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
  children?: React.ReactNode
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border backdrop-blur-md",
        "bg-[var(--color-bg-card)] border-[var(--color-border)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
)
GlassCard.displayName = "GlassCard"

export { GlassCard }
